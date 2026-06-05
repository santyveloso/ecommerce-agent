"""Meta Ads client — busca métricas da Marketing API com cache."""

from typing import Optional, Dict, Tuple
import time
import httpx
from .config import Config


class MetaAdsClient:
    def __init__(self, config: Config):
        self.token = config.meta_access_token
        self.account_ids = config.meta_ad_account_ids
        self.base = "https://graph.facebook.com/v21.0"
        # cache: { cache_key: (timestamp, data) }
        self._cache: Dict[str, Tuple[float, dict]] = {}
        self._cache_ttl = 300  # 5 minutes

    def _cache_key(self, date_preset: str = "today", since: str = None, until: str = None) -> str:
        return f"{date_preset}_{since}_{until}"

    def _get_cached(self, key: str) -> Optional[dict]:
        entry = self._cache.get(key)
        if entry and (time.time() - entry[0]) < self._cache_ttl:
            return entry[1]
        return None

    def _set_cache(self, key: str, data: dict):
        self._cache[key] = (time.time(), data)

    async def _get(self, path: str, params: dict) -> dict:
        params["access_token"] = self.token
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self.base}/{path}", params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_insights(
        self,
        since: Optional[str] = None,
        until: Optional[str] = None,
        date_preset: str = "today",
        force_refresh: bool = False,
    ) -> dict:
        """Busca métricas agregadas da conta Lana Zagreb.

        Args:
            force_refresh: se True, ignora cache e busca da API
        Returns:
            { spend, conversions_value, purchases, roas }
        """
        if not self.token:
            return {"spend": 0, "conversions_value": 0, "purchases": 0, "roas": 0}

        cache_key = self._cache_key(date_preset, since, until)

        if not force_refresh:
            cached = self._get_cached(cache_key)
            if cached:
                return cached

        total_spend = 0.0
        total_value = 0.0
        total_purchases = 0

        params = {
            "level": "account",
            "fields": "spend,purchase_roas,actions",
            "date_preset": date_preset,
        }
        if since and until:
            params["time_range"] = f'{{"since":"{since}","until":"{until}"}}'
            del params["date_preset"]

        for acc_id in self.account_ids:
            try:
                data = await self._get(f"{acc_id}/insights", params)
                for row in data.get("data", []):
                    total_spend += float(row.get("spend", 0))

                    roas_val = 0.0
                    for roas in row.get("purchase_roas", []):
                        roas_val = float(roas.get("value", 0))
                        break  # primary attribution window
                    total_value += roas_val * float(row.get("spend", 0))

                    for act in row.get("actions", []):
                        if act.get("action_type") == "purchase":
                            total_purchases += int(act.get("value", 0))
            except Exception:
                continue

        roas = round(total_value / total_spend, 2) if total_spend > 0 else 0
        result = {
            "spend": round(total_spend, 2),
            "conversions_value": round(total_value, 2),
            "purchases": total_purchases,
            "roas": roas,
        }

        self._set_cache(cache_key, result)
        return result
