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

    @classmethod
    def from_env(cls) -> "Config":
        # 1) Load project-level .env (~/.hermes/ecommerce-agent/.env)
        project_env = Path.home() / ".hermes" / "ecommerce-agent" / ".env"
        if project_env.exists():
            with open(project_env) as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())

        # 2) Load Hermes master .env (~/.hermes/.env) — lower priority
        hermes_env = Path.home() / ".hermes" / ".env"
        if hermes_env.exists():
            with open(hermes_env) as f:
                for line in f:
                    line = line.strip()
                    if "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())

        return cls(
            shopify_store_domain=os.environ.get("SHOPIFY_STORE_DOMAIN", ""),
            shopify_access_token=os.environ.get("SHOPIFY_ACCESS_TOKEN", ""),
            shopify_api_version=os.environ.get("SHOPIFY_API_VERSION", "2026-01"),
            meta_access_token=os.environ.get("META_ACCESS_TOKEN", ""),
            gateway_url=os.environ.get(
                "GATEWAY_URL",
                "http://localhost:8888/v1/chat/completions"
            ),
            gateway_token=os.environ.get("HERMES_GATEWAY_TOKEN", ""),
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
        )
