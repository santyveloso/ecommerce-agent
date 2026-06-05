"""Setup endpoints — onboarding + env management."""

import os
from typing import Optional, Union
from pathlib import Path
from pydantic import BaseModel

from .config import Config
from .shopify import ShopifyClient


ENV_PATH = Path.home() / ".hermes" / "ecommerce-agent" / ".env"


def load_env(path: Union[str, Path]):
    """Carrega um ficheiro .env manualmente."""
    path = Path(path)
    if not path.exists():
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()


class SetupStatus(BaseModel):
    configured: bool
    store_name: Optional[str] = None
    error: Optional[str] = None


def update_env_file(updates: dict):
    """Updates the .env file with new keys, preserving existing ones."""
    ENV_PATH.parent.mkdir(parents=True, exist_ok=True)
    existing = {}
    if ENV_PATH.exists():
        with open(ENV_PATH) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    existing[k.strip()] = v.strip()
    
    # Update with new values
    existing.update(updates)
    
    # Write back to file
    with open(ENV_PATH, "w") as f:
        f.write("# Ecommerce Agent Config\n")
        for k, v in existing.items():
            f.write(f"{k}={v}\n")


class SetupSave(BaseModel):
    shopify_store_domain: str
    shopify_access_token: str
    shopify_api_version: str = "2026-01"


class ZohoSetupSave(BaseModel):
    zoho_client_id: str
    zoho_client_secret: str
    zoho_refresh_token: str
    zoho_account_id: Optional[str] = ""
    zoho_region: str = "com"


def get_status() -> SetupStatus:
    """Check if Shopify credentials are configured and working."""
    if ENV_PATH.exists():
        load_env(ENV_PATH)

    config = Config.from_env()

    if not config.shopify_access_token or not config.shopify_store_domain:
        return SetupStatus(configured=False)

    try:
        client = ShopifyClient(config)
        info = client.shop_info()
        return SetupStatus(
            configured=True,
            store_name=info.get("name"),
        )
    except Exception as e:
        return SetupStatus(
            configured=False,
            error=f"Conexao falhou: {e}",
        )


def save_credentials(data: SetupSave) -> SetupStatus:
    """Save Shopify credentials to .env and test connection."""
    update_env_file({
        "SHOPIFY_STORE_DOMAIN": data.shopify_store_domain.strip(),
        "SHOPIFY_ACCESS_TOKEN": data.shopify_access_token.strip(),
        "SHOPIFY_API_VERSION": data.shopify_api_version.strip(),
    })

    # Load into environment for this session
    load_env(ENV_PATH)

    return get_status()


def save_zoho_credentials(data: ZohoSetupSave):
    """Save Zoho credentials to .env and reload env."""
    update_env_file({
        "ZOHO_CLIENT_ID": data.zoho_client_id.strip(),
        "ZOHO_CLIENT_SECRET": data.zoho_client_secret.strip(),
        "ZOHO_REFRESH_TOKEN": data.zoho_refresh_token.strip(),
        "ZOHO_ACCOUNT_ID": (data.zoho_account_id or "").strip(),
        "ZOHO_REGION": data.zoho_region.strip(),
    })

    # Load into environment for this session
    load_env(ENV_PATH)
