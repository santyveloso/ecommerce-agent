# Chat — Como Funciona

O chat é roteado pelo `GatewayBridge` (`api/app/gateway.py`). Tem dois caminhos possíveis.

## Router: GatewayBridge

```python
async def chat_stream(message, context, history, model):
    # 1. Tenta provider direct (se credenciais existirem)
    # 2. Fallback: gateway URL configurado
```

### Path A — Provider Direct (preferido)

Usa as credenciais do `~/.hermes/config.yaml`:

```yaml
model:
  base_url: "https://api.opencode.ai/v1"
  api_key: "sk-..."
  default: "deepseek-v4-flash"
```

Se `PROVIDER_BASE_URL` + `PROVIDER_API_KEY` existirem, o chat faz:

```
API ──POST {provider_url}/chat/completions──▶ OpenCode/DeepSeek API
API ◀── SSE stream ────────────────────────── OpenCode/DeepSeek API
```

**Vantagens:** Sem depender do Hermes Gateway. Modelo respeitado. Latência direta.

### Path B — Gateway URL (fallback)

Se não houver provider direct configurado, usa o `GATEWAY_URL` do `.env`:

```
API ──POST {GATEWAY_URL}──▶ Hermes Gateway na VPS
API ◀── SSE stream ──────── Hermes Gateway na VPS
```

O gateway VPS precisa de:
- Estar a correr e acessível (firewall aberta)
- Responder a `GET /health`
- Aceitar requests com token (se configurado)

**⚠️ Nota:** O Hermes Gateway pode ignorar o parâmetro `model` (bug upstream conhecido). O provider direct respeita sempre.

## Discovery do Gateway

No startup, `GatewayBridge.discover()` tenta:

1. Se `GATEWAY_URL` configurado (não localhost) → `GET {base}/health`
2. **Auto-discovery** local: portas `[8888, 32774, 8642]` → `GET http://localhost:{port}/health`

Se nada responder, `_available = false` e o chat devolve "[Gateway offline]".

## Comandos Diretos (sem AI)

Antes de chamar o gateway/provider, o `chat_stream` verifica se a mensagem corresponde a comandos pré-definidos. Se sim, responde diretamente sem consumir tokens:

| Padrão | Endpoint chamado |
|---|---|
| "produtos", "mostra produtos" | `shopify.get_products(20)` |
| "baixo stock", "stock baixo" | `shopify.get_low_stock(5)` |
| "orders", "encomendas" | `shopify.get_orders(10)` |
| "order #X", "encomenda #X" | `shopify.get_order(ref)` |
| "cria colecção X" | `approvals.create()` (pede aprovação) |

## Flags Especiais

O agente AI pode responder com `[APPROVAL_REQUIRED]` antes de uma ação de escrita. A API deteta esta flag no meio da resposta e:

1. Corta a resposta no ponto da flag
2. Cria uma approval pendente
3. Devolve instruções para aprovar/rejeitar via `/approve`

## Modelo

- O modelo pode ser passado por request (`model` param)
- Se omitido, usa o `selected_model` do GatewayBridge
- O modelo ativo pode ser mudado via `POST /gateway/model`
- Modelos disponíveis vêm de `GET /gateway/models`

## Streaming SSE

O `chat_stream` devolve um SSE (Server-Sent Events) com:

```
data: {"token":"texto"}
data: {"token":" mais texto"}
data: {"type":"tool_progress","tool":"shopify","status":"...","emoji":"🔧","label":"Shopify"}
data: [DONE]
```

O frontend consome isto via `useChatStream.ts` que:
1. Abre `EventSource` ou fetch com `ReadableStream`
2. Filtra eventos `__TOOL__` para mostrar indicadores visuais
3. Acumula tokens até `[DONE]`
