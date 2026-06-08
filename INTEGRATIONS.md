# Integrações

## Shopify

Ficheiro: `api/app/shopify.py` (278 linhas)

Cliente REST para a Admin API da Shopify.

### Credenciais
- `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_ACCESS_TOKEN`
- Permissões necessárias: `read_products`, `read_orders`, `write_products`
- Guardadas em `~/.hermes/ecommerce-agent/.env`

### Endpoints usados

| Shopify API | Uso |
|---|---|
| `GET /admin/api/{version}/shop.json` | Verificar conexão + nome da loja |
| `GET /admin/api/{version}/products.json` | Listar produtos (com stock) |
| `PUT /admin/api/{version}/products/{id}.json` | Atualizar produto |
| `GET /admin/api/{version}/orders.json` | Listar orders |
| `GET /admin/api/{version}/orders/{id}.json` | Detalhes de order |
| `POST /admin/api/{version}/custom_collections.json` | Criar coleção |

### Funcionalidades implementadas

- `shop_info()` — nome da loja
- `get_products(limit)` — produtos com status + stock
- `get_low_stock(threshold)` — produtos com stock ≤ threshold
- `get_orders(limit)` — últimas orders
- `get_order(reference)` — detalhes de uma order
- `update_product(product_id, data)` — atualizar produto
- `create_collection(title)` — criar custom collection

---

## Meta Ads

Ficheiro: `api/app/meta_ads.py` (101 linhas)

Cliente para a Marketing API do Facebook.

### Credenciais
- `META_ACCESS_TOKEN` — token de acesso (long-lived)
- `META_AD_ACCOUNT_IDS` — IDs das contas de anúncio (vírgula)

### Endpoints usados

| Meta API | Uso |
|---|---|
| `GET /{api-version}/{account-id}` | Verificar conta |
| `GET /{api-version}/{account-id}/campaigns` | Listar campanhas |
| `GET /{api-version}/{campaign-id}/insights` | Métricas de campanha |

### Funcionalidades implementadas

- `health()` — verifica se token + conta são válidos
- `list_campaigns()` — campanhas ativas
- `get_insights(campaign_id, date_preset)` — métricas (spend, impressions, clicks, ROAS)

### Como é usado

Principalmente para o dashboard mostrar métricas de ads. A UI não faz ações de escrita no Meta (Santy gere campanhas manualmente).

---

## Zoho Mail

Ficheiro: `api/app/zoho.py` (534 linhas)

Cliente para a Zoho Mail API (email).

### Credenciais
- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ACCOUNT_ID`, `ZOHO_REGION`

### Fluxo

```
1. POST https://accounts.zoho.{region}/oauth/v2/token
   → access_token (válido 1h)
2. GET https://mail.zoho.{region}/api/accounts/{accountId}/messages/search
3. POST https://mail.zoho.{region}/api/accounts/{accountId}/messages/send
```

### Funcionalidades implementadas

- `refresh_token()` — obtém access token via refresh token
- `search_emails(query)` — pesquisa emails
- `send_email(to, subject, body)` — enviar email
- `get_unread_count()` — contagem de não lidos

### Configuração Zoho

A Zoho API é complexa de configurar (precisa de Client ID + Secret + Refresh Token). O onboarding tem um passo separado para Zoho (via Settings), ou pode ser configurado manualmente no `.env`.

---

## Approvals Store

Ficheiro: `api/app/approvals.py` (101 linhas)

Sistema de aprovação para ações de escrita. Funciona como um semáforo:

1. Utilizador pede ação de escrita via chat
2. AI deteta e responde com `[APPROVAL_REQUIRED]`
3. API cria approval pendente em `approvals.json`
4. Utilizador confirma com `/approve <id> go`
5. API executa ação (coleção, atualização, etc.)

Approvals são persistidas em `~/.hermes/ecommerce-agent/approvals.json`.

---

## Memory Store

Ficheiro: `api/app/memory_store.py` (111 linhas)

Key-value store simples para memória do agente.

- `get(key)` — ler valor
- `set(key, value)` — guardar valor
- `delete(key)` — apagar
- `list()` — todas as chaves

Persistência: `~/.hermes/ecommerce-agent/memory.json`

---

## Cron Jobs

Ficheiro: `api/app/cron_jobs.py` (106 linhas)

Tarefas agendadas (APScheduler integrado no FastAPI):

- **`sync-meta`** — atualiza métricas do Meta Ads (a cada 30 min)
- **`check-low-stock`** — alerta se stock baixo (diário)
- **`sync-status`** — atualiza health checks (a cada 5 min)

---

## Gateway Bridge

Ficheiro: `api/app/gateway.py` (309 linhas)

Ver [CHAT.md](CHAT.md) para detalhes completos.

Resumo: Roteia requests de chat. Primeiro tenta **provider direct** (credenciais do Hermes config.yaml), fallback para **gateway URL** configurado no onboarding.
