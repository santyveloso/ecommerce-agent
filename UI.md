# UI — Frontend

Stack: React 19 + TypeScript + Vite. CSS nativo (sem framework).

## Estrutura de Ficheiros

```
ui/src/
├── main.tsx              # Entry point React
├── App.tsx               # Componente principal: Dashboard + navegação
├── api.ts                # API helper (fetch com X-API-Key)
│
├── Onboarding.tsx        # Wizard de 3 passos (Shopify → View → Gateway)
├── SettingsPanel.tsx     # Settings: conexões, tema, Zoho
├── StatusTab.tsx         # Página de status de todos os serviços
│
├── ChatInput.tsx         # Input de chat (auto-resize, Cmd+K, Stop)
├── ChatMessages.tsx      # Lista de mensagens com scroll automático
├── MessageBubble.tsx     # Bolha individual (user/assistant, timestamps)
├── SessionSidebar.tsx    # Sidebar de sessões de chat
├── SessionItem.tsx       # Item individual na sidebar
├── useChatStream.ts      # Hook SSE para streaming de chat
│
├── RevenueChart.tsx      # Gráfico de receita (recharts)
├── MarkdownRenderer.tsx  # Renderizador de markdown nas mensagens
├── Icons.tsx             # Ícones SVG inline
│
├── index.css             # Reset + variáveis CSS + temas
├── App.css               # Estilos gerais da app
├── dashboard.css         # Dashboard + onboarding + settings
├── chat.css              # Estilos do chat
└── revenue-chart.css     # Estilos do gráfico
```

## Fluxo de Ecrãs

```
                    ┌──────────────────────┐
                    │   Loading Screen     │
                    │  (a verificar config)│
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  configured=false?   │
                    └──────┬──────────┬────┘
                      Sim  │          │  Não
                ┌──────────▼──┐  ┌────▼──────────┐
                │ Onboarding  │  │  Dashboard    │
                │             │  │               │
                │ Step 1      │  │ ┌─ Dashboard  │
                │  Shopify    │  │ ├─ Chat       │
                │             │  │ ├─ Orders     │
                │ Step 2      │  │ ├─ Emails     │
                │  Default    │  │ ├─ Studio     │
                │  View       │  │ ├─ Routines   │
                │             │  │ ├─ Memory     │
                │ Step 3      │  │ ├─ Links      │
                │  Gateway    │  │ ├─ Status     │
                │             │  │ └─ Settings   │
                └─────────────┘  └──────────────┘
```

## Onboarding (3 passos)

1. **Shopify** — domain + token + helper text
2. **Ecrã inicial** — Dashboard 📊 ou Chat 💬 (guarda em `localStorage.ec_default_tab`)
3. **Gateway** — URL do Hermes na VPS + token opcional + "Saltar"

Após o passo 3, guarda `localStorage.ec_configured = '1'` e mostra o Dashboard.

## Dashboard

- **Sidebar** com tabs: Dashboard, Chat, Orders, Emails, Studio, Routines, Memory, Links, Status, Settings
- **Topo**: greeting + período (Hoje/Semana/Mês) + date picker
- **Métricas**: receita, orders, ROAS, spend (se Meta configurado)
- **Gráfico de receita** (recharts)
- **Orders recentes**
- **Approvals pendentes**

## Chat

- **Streaming SSE** com indicador visual de tool progress
- **Model selector** no topo
- **Keyboard shortcuts**: Cmd+K (focus input), Escape (fechar)
- **Session sidebar** com histórico de conversas
- **Message editing** nas mensagens do utilizador
- **Timestamps** nas bolhas
- **Dark/light theme** via data-theme attribute

## Settings

- **Conexões**: Shopify (status + ligar), Gateway (status + configurar)
- **Tema**: Dark, Light, Mono, Midnight, Espresso (guarda em `localStorage.ec_theme`)

## Status

Tabela com todos os serviços: Shopify, Gateway, Meta Ads, Zoho. Cada um com badge verde/vermelho + detalhe.

## Temas

5 temas definidos em `index.css` com variáveis CSS (`--bg`, `--surface`, `--text`, `--accent`, etc.):

| Tema | Fundo | Destaque |
|---|---|---|
| Dark | `#0f1117` | `#6366f1` |
| Light | `#f4f5f7` | `#6366f1` |
| Mono | `#121212` | `#e0e0e0` |
| Midnight | `#0f1419` | `#3b82f6` |
| Espresso | `#0d0d0d` | `#a67c52` |

## Auth UI

- No primeiro load, faz `GET /setup/status`
- Se devolver `api_key`, guarda-a via `setApiKey()`
- Todos os requests daí em diante levam `X-API-Key` via `apiFetch()`

## API Base URL

Hardcoded como `http://localhost:7777` em `api.ts` e `Onboarding.tsx`. Para deploy noutra máquina, alterar estas constantes.
