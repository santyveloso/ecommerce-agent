# Configuração

## Ficheiro .env

Localização: `~/.hermes/ecommerce-agent/.env`

Gerado pelo onboarding (passos 1 e 3). Pode ser editado manualmente.

## Variáveis de Ambiente

### Shopify (obrigatório)

| Variável | Exemplo | Onde obter |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | `minha-loja.myshopify.com` | Shopify Admin |
| `SHOPIFY_ACCESS_TOKEN` | `shpat_abc123...` | Shopify Admin → Apps → Develop apps |
| `SHOPIFY_API_VERSION` | `2026-01` | (opcional, default 2026-01) |

A app Shopify precisa das permissões: `read_products`, `read_orders`, `write_products`.

### Hermes Gateway (opcional — necessário para chat se não houver provider direct)

| Variável | Exemplo | Onde obter |
|---|---|---|
| `GATEWAY_URL` | `http://123.123.123.123:8888/v1/chat/completions` | O Hermes do utilizador na VPS |
| `HERMES_GATEWAY_TOKEN` | `token_abc...` | Config do gateway (opcional) |

Default: `http://localhost:8888/v1/chat/completions`

### Provider Direct (opcional — alternativa ao gateway)

Se estas variáveis existirem no `~/.hermes/config.yaml`, o chat usa **provider direct** em vez do gateway:

```yaml
model:
  base_url: "https://api.opencode.ai/v1"
  api_key: "sk-..."
  default: "deepseek-v4-flash"
```

O `GatewayBridge` lê automaticamente do config.yaml do Hermes e prefere provider direct quando disponível.

### Meta Ads (opcional)

| Variável | Exemplo |
|---|---|
| `META_ACCESS_TOKEN` | `EAAB...` |
| `META_AD_ACCOUNT_IDS` | `act_123456,act_789012` (separados por vírgula) |

### Zoho Mail (opcional)

| Variável | Exemplo |
|---|---|
| `ZOHO_CLIENT_ID` | `1000.XXXXX` |
| `ZOHO_CLIENT_SECRET` | `abc...` |
| `ZOHO_REFRESH_TOKEN` | `1000.XXXXX` |
| `ZOHO_ACCOUNT_ID` | `12345678` |
| `ZOHO_REGION` | `com` (ou `eu` para Europa) |

### Servidor

| Variável | Default | Descrição |
|---|---|---|
| `API_SERVER_CORS_ORIGINS` | `http://localhost:5173` | Origens CORS (vírgula) |
| `ECOMMERCE_API_KEY` | (auto-gerada) | Chave auth frontend-backend |

## Ficheiros de Config

```
~/.hermes/
├── config.yaml          # Config do Hermes (lido para provider direct)
├── .env                 # Config global Hermes (fallback)
└── ecommerce-agent/
    ├── .env             # Config específica da app (prioridade máxima)
    ├── .api_key         # Chave auth (auto-gerada, chmod 600)
    ├── approvals.json   # Approvals pendentes
    ├── memory.json      # Key-value store
    └── uploads/         # Uploads de imagens
```

## Hierarquia de Carregamento

1. `~/.hermes/ecommerce-agent/.env` — **prioridade máxima**
2. `~/.hermes/.env` — fallback global
3. `~/.hermes/config.yaml` — lido para provider + modelo default
