"""Config — lê variáveis de ambiente."""

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Config:
    # Shopify
    shopify_store_domain: str = ""
    shopify_access_token: str = ""
    shopify_api_version: str = "2026-01"

    # Meta Ads
    meta_access_token: str = ""
    meta_ad_account_ids: list = field(default_factory=lambda: [
        "act_1463037185241989",  # Lana Zagreb
    ])

    # Hermes Gateway
    gateway_url: str = "http://localhost:8888/v1/chat/completions"
    gateway_token: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 7777
    cors_origins: list = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ])

    # Data dir
    data_dir: Path = Path.home() / ".hermes" / "ecommerce-agent"

    # Zoho Mail
    zoho_client_id: str = ""
    zoho_client_secret: str = ""
    zoho_refresh_token: str = ""
    zoho_account_id: str = ""
    zoho_region: str = "com"

    # Hermes config (for model discovery)
    hermes_config_path: str = str(Path.home() / ".hermes" / "config.yaml")

    # Hermes Gateway provider info (for model list auto-discovery)
    provider_base_url: str = ""
    provider_api_key: str = ""
    provider_default_model: str = "deepseek-v4-flash"

    @classmethod
    def from_env(cls) -> "Config":
        # 1) Load project-level .env (~/.hermes/ecommerce-agent/.env) — highest priority
        project_env_path = None
        project_env = Path.home() / ".hermes" / "ecommerce-agent" / ".env"
        if project_env.exists():
            project_env_path = project_env
            with open(project_env) as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip()  # override, not setdefault

        # 2) Load Hermes master .env (~/.hermes/.env) — lower priority
        hermes_env = Path.home() / ".hermes" / ".env"
        if hermes_env.exists():
            with open(hermes_env) as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())

        # 3) Read Hermes config.yaml for provider model info
        hermes_config_path = Path.home() / ".hermes" / "config.yaml"
        provider_base_url = ""
        provider_api_key = ""
        provider_default_model = "deepseek-v4-flash"
        if hermes_config_path.exists():
            try:
                import yaml
                with open(hermes_config_path) as f:
                    hc = yaml.safe_load(f) or {}
                model_cfg = hc.get("model", {})
                provider_base_url = model_cfg.get("base_url", "")
                provider_api_key = model_cfg.get("api_key", "")
                provider_default_model = model_cfg.get("default", "deepseek-v4-flash")
            except Exception:
                pass

        return cls(
            shopify_store_domain=os.environ.get("SHOPIFY_STORE_DOMAIN", ""),
            shopify_access_token=os.environ.get("SHOPIFY_ACCESS_TOKEN", ""),
            shopify_api_version=os.environ.get("SHOPIFY_API_VERSION", "2026-01"),
            meta_access_token=os.environ.get("META_ACCESS_TOKEN", ""),
            gateway_url=os.environ.get(
                "GATEWAY_URL",
                "http://localhost:8888/v1/chat/completions"
            ),
            gateway_token=os.environ.get("HERMES_GATEWAY_TOKEN") or os.environ.get("API_SERVER_KEY", ""),
            cors_origins=os.environ.get(
                "API_SERVER_CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173"
            ).split(","),
            data_dir=Path(
                os.environ.get("HERMES_DATA_DIR", str(Path.home() / ".hermes" / "ecommerce-agent"))
            ),
            zoho_client_id=os.environ.get("ZOHO_CLIENT_ID", ""),
            zoho_client_secret=os.environ.get("ZOHO_CLIENT_SECRET", ""),
            zoho_refresh_token=os.environ.get("ZOHO_REFRESH_TOKEN", ""),
            zoho_account_id=os.environ.get("ZOHO_ACCOUNT_ID", ""),
            zoho_region=os.environ.get("ZOHO_REGION", "com"),
            provider_base_url=provider_base_url,
            provider_api_key=provider_api_key,
            provider_default_model=provider_default_model,
        )
