# API — Endpoints

Base URL: `http://localhost:7777`

Auth: `X-API-Key: <key>` em todos os endpoints exceto públicos.

---

## Setup / Onboarding

### `GET /setup/status`

Estado da configuração Shopify.

```json
// Response 200
{
  "configured": true,
  "store_name": "Lana Zagreb",
  "error": null,
  "api_key": "db23ac..."
}
```

- Público (sem auth)
- Se `configured = false`, a UI mostra onboarding
- `api_key` só é devolvida quando configured=true

### `POST /setup/save`

Guarda credenciais Shopify e testa conexão.

```json
// Request
{
  "shopify_store_domain": "minha-loja.myshopify.com",
  "shopify_access_token": "shpat_...",
  "shopify_api_version": "2026-01"
}

// Response 200
{ "configured": true, "store_name": "Minha Loja" }

// Response 400
{ "detail": "Conexao falhou: ..." }
```

### `GET /setup/gateway`

Estado da conexão ao Hermes Gateway.

- Público (sem auth)
- Testa `/health` no URL configurado

```json
{ "configured": true, "gateway_url": "http://vps:8888/v1/chat/completions", "connected": true }
```

### `POST /setup/gateway`

Guarda URL do gateway e testa conexão.

```json
// Request
{ "gateway_url": "http://123.123.123.123:8888", "gateway_token": "opcional" }

// Response
{ "configured": true, "gateway_url": "...", "connected": true }
```

---

## Chat

### `POST /chat/stream`

**Streaming SSE.** Endpoint principal de chat.

```json
// Request
{
  "message": "olá",
  "model": "deepseek-v4-flash",
  "history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}],
  "context": {"store": "Lana Zagreb"}
}
```

**Ou formato messages[]:**
```json
{
  "messages": [
    {"role": "system", "content": "Tu és um agente..."},
    {"role": "user", "content": "olá"}
  ],
  "model": "deepseek-v4-flash"
}
```

**Response (SSE stream):**
```
data: {"token":"Olá"}
data: {"token":" como"}
data: {"token":" posso"}
data: {"token":" ajudar"}
data: [DONE]
```

**Eventos especiais no stream:**

| Prefixo | Significado |
|---|---|
| `{"token":"..."}` | Token de texto normal |
| `{"type":"tool_progress","tool":"shopify","status":"A buscar produtos...","emoji":"🔧","label":"Shopify"}` | Tool call do agente |
| `[DONE]` | Fim do stream |

**Comandos diretos** (sem passar pelo AI, resposta imediata):

| Expressão | Ação |
|---|---|
| "mostra produtos", "lista produtos", "produtos" | Lista 20 produtos |
| "baixo stock", "stock baixo" | Produtos com stock ≤5 |
| "ultimas orders", "orders", "encomendas" | Últimas 10 orders |
| "order #ABCD", "encomenda #ABCD" | Detalhes de uma order |
| "cria colecção X" | Cria approval para nova coleção |

### `POST /chat`

Versão non-streaming (mesmo request, response normal).

```json
{ "reply": "Olá! Como posso ajudar?", "approval_required": false }
```

---

## Dashboard

### `GET /dashboard`

Métricas do dashboard.

```json
{
  "storeName": "Lana Zagreb",
  "currency": "EUR",
  "products": 42,
  "lowStock": 3,
  "ordersToday": 5,
  "revenueToday": "234.50",
  "pendingApprovals": 1,
  "recentOrders": [
    {"name": "#1001", "total": "89.90", "status": "pending", "customer": "Ana", "date": "2026-06-07"}
  ]
}
```

---

## Approvals

### `GET /approvals`

Lista approvals pendentes.

### `POST /approve`

Aprova ou rejeita uma ação.

```json
// Request
{ "id": 123, "action": "go" }

// go → executa a ação na Shopify
// stop → cancela e remove
```

---

## Gateway / Modelos

### `GET /gateway/models`

Lista modelos disponíveis.

- Público (sem auth)
- Se o gateway estiver offline, devolve fallbacks hardcoded

```json
{
  "models": ["deepseek-v4-flash", "deepseek-v4-pro", "claude-sonnet-4"],
  "active": "deepseek-v4-flash"
}
```

### `POST /gateway/model`

Muda o modelo ativo.

```json
// Request
{ "model": "claude-sonnet-4" }

// Response 200
```

---

## Memory

### `GET /memory/read`

Lê ficheiro dentro de `~/ghost/`. Path traversal bloqueado.

```json
// Request: /memory/read?path=memory/2026-06-07.md
{ "content": "...", "path": "memory/2026-06-07.md" }

// Fora de ~/ghost/ → 403
```

### `POST /memory/write`

Escreve ficheiro dentro de `~/ghost/`.

```json
// Request
{ "path": "memory/test.md", "content": "hello" }

// Response
{ "saved": true }
```

### `DELETE /memory/delete`

Apaga ficheiro dentro de `~/ghost/`.

---

## Zoho

### `GET /zoho/status`

Estado da integração Zoho Mail.

### `POST /setup/zoho`

Configura credenciais Zoho.

---

## Status

### `GET /status`

Estado de todos os serviços.

```json
{
  "overall": "ok",
  "services": [
    {"name": "Shopify", "status": "ok", "detail": "Lana Zagreb"},
    {"name": "Gateway", "status": "ok", "detail": "http://vps:8888"},
    {"name": "Meta Ads", "status": "ok", "detail": "Conta: ..."},
    {"name": "Zoho", "status": "off", "detail": "Não configurado"}
  ]
}
```

---

## Uploads

### `POST /studio/upload`

Upload de imagem. Só imagens, max 10MB.

```
multipart/form-data: { file: <imagem> }

Response 200: { "url": "/uploads/uuid_nome.png" }
```

### `GET /uploads/{filename}`

Ficheiro estático servido.

---

## Utils

### `GET /health`

Health check. Público.

```json
{ "status": "ok", "shopify": "Lana Zagreb", "gateway": "online" }
```
