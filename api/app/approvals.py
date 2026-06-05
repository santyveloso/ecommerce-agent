"""Approval store — go/stop system.

Regras do GHOST:
- Qualquer ação que escreve na loja (criar produto, alterar preço, responder cliente) → pausa
- Qualquer toque em Meta/Shopify/Zoho/customer channels/third parties → go/stop
- Aprovação via chat (go/stop)
- Log de decisões em JSONL
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List


class ApprovalStore:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._pending = {}  # type: ignore
        self._load_pending()

    @property
    def _pending_file(self) -> Path:
        return self.data_dir / "pending_approvals.json"

    @property
    def _log_file(self) -> Path:
        return self.data_dir / "approval_log.jsonl"

    def _load_pending(self):
        if self._pending_file.exists():
            try:
                data = json.loads(self._pending_file.read_text())
                self._pending = {a["id"]: a for a in data}
            except (json.JSONDecodeError, KeyError):
                self._pending = {}

    def _save_pending(self):
        with open(self._pending_file, "w") as f:
            json.dump(list(self._pending.values()), f, indent=2)

    def _log(self, approval: dict):
        with open(self._log_file, "a") as f:
            f.write(json.dumps(approval, default=str) + "\n")

    def needs_approval(self, intent: str, payload: dict) -> bool:
        """Determina se uma ação precisa de aprovação."""
        WRITE_INTENTS = {
            "product_create", "product_update", "product_delete",
            "collection_create", "collection_update",
            "order_refund", "order_cancel", "order_update",
            "customer_reply",
            "campaign_create", "campaign_update", "campaign_delete",
            "ad_set_create", "ad_update",
        }
        return intent in WRITE_INTENTS

    def create(self, intent: str, payload: dict, summary: str) -> dict:
        """Cria um pedido de aprovação pendente."""
        approval = {
            "id": str(uuid.uuid4())[:8],
            "intent": intent,
            "payload": payload,
            "summary": summary,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._pending[approval["id"]] = approval
        self._save_pending()
        self._log(approval)
        return approval

    def approve(self, approval_id: str) -> Optional[dict]:
        """Aprova e remove dos pendentes."""
        a = self._pending.pop(approval_id, None)
        if a is None:
            return None
        a["status"] = "approved"
        a["resolved_at"] = datetime.now(timezone.utc).isoformat()
        self._save_pending()
        self._log(a)
        return a

    def reject(self, approval_id: str) -> Optional[dict]:
        """Rejeita e remove dos pendentes."""
        a = self._pending.pop(approval_id, None)
        if a is None:
            return None
        a["status"] = "rejected"
        a["resolved_at"] = datetime.now(timezone.utc).isoformat()
        self._save_pending()
        self._log(a)
        return a

    def list_pending(self) -> List[dict]:
        return list(self._pending.values())

    def get(self, approval_id: str) -> Optional[dict]:
        return self._pending.get(approval_id)
