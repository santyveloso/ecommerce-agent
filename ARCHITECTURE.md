# Architecture

## Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                   Portátil do Utilizador              │
│                                                      │
│  ┌──────────┐     ┌──────────────────────────────┐   │
│  │ Browser  │────▶│    API FastAPI (localhost:7777) │   │
│  │ :5173    │     │                                │   │
│  │          │     │  ┌────────────┐               │   │
│  │ React UI │     │  │ GatewayBridge│────────────┐   │   │
│  │ Vite     │     │  └────────────┘            │   │   │
│  └──────────┘     │                              │   │   │
│                   │  ┌──────────┐  ┌──────────┐   │   │   │
│                   │  │ Shopify  │  │ Meta Ads │   │   │   │
│                   │  │ Client   │  │ Client   │   │   │   │
│                   │  └──────────┘  └──────────┘   │   │   │
│                   │  ┌──────────┐  ┌──────────┐   │   │   │
│                   │  │ Zoho     │  │ Approvals│   │   │   │
│                   │  │ Mail     │  │ Store    │   │   │   │
│                   │  └──────────┘  └──────────┘   │   │   │
│                   └──────────────────────────────┘   │   │
│                                                      │   │
└──────────────────────────────────────────────────────┘   │
                                                          │
               ┌──────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────┐
│    VPS Hostinger (do utilizador)      │
│                                      │
│  ┌──────────────────────────────┐   │
│  │   Hermes Gateway             │   │
│  │   + Provider OpenCode Go     │   │
│  │   + Skills, Tools, Agentes   │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

## Fluxos Principais

### 1. Onboarding (primeiro uso)

```
Browser ──GET /setup/status──▶ API ──▶ Shopify API (test)
Browser ◀──{configured: false}── API
Browser ──POST /setup/save──▶ API ──▶ guarda .env + test Shopify
Browser ──POST /setup/gateway──▶ API ──▶ testa health da VPS
Browser ◀──onDone()──▶ Dashboard
```

### 2. Chat

```
Browser ──POST /chat/stream──▶ API
                                │
                    GatewayBridge.chat_stream()
                    ├─ Provider direct (OpenCode Go)
                    │   ──▶ DeepSeek/OpenAI API ──▶ SSE stream
                    │
                    └─ Gateway URL (VPS Hostinger)
                        ──▶ Hermes Gateway ──▶ SSE stream
```

### 3. Dashboard

```
Browser ──GET /dashboard──▶ API ──▶ Shopify + Meta
Browser ◀── métricas, orders, produtos
```

### 4. Ações de escrita (aprovação)

```
Browser ──"cria colecção X"──▶ API
                                │
                    GatewayBridge envia ao AI
                    AI responde com [APPROVAL_REQUIRED]
                    API cria approval pendente
Browser ◀── "Aprovação necessária: /approve 123 go"
Browser ──POST /approve──▶ API ──▶ executa ação na Shopify
```

## Segurança

- **API Key** única (64 hex chars) gerada em `~/.hermes/ecommerce-agent/.api_key`
- **Middleware auth** em todos os endpoints exceto `/setup/*`, `/docs`, `/gateway/models`
- **Path traversal bloqueado:** reads de memory/ficheiros confinados a `~/ghost/`
- **Uploads restritos:** só imagens (JPEG/PNG/GIF/WebP/SVG), max 10MB, magic bytes validados
- **`.env` permissions:** `chmod 600`

## Config Persistida em

```
~/.hermes/ecommerce-agent/
├── .env              # Credenciais (Shopify, Gateway, Zoho, Meta)
├── .api_key          # Chave para auth frontend-backend
├── approvals.json    # Approvals pendentes
├── memory.json       # Key-value store
└── uploads/          # Uploads de imagens
```
