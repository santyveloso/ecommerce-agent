# Auditoria de Segurança — Mom Chat

> **TAG:** RESOLVIDO (13/15 itens — 13/06/2026)

## Resumo das Alterações

### Críticos
- **C-1** ✅ Endpoints `/api/mom/*` removidos de `PUBLIC_PATHS`. Aceitam `X-Mom-Token` (página da Mãe) ou `X-API-Key` (admin UI). Mom HTML page envia `X-Mom-Token` nos headers. React UI usa `apiFetch`.
- **C-2** ✅ `run.py` mudado de `0.0.0.0` para `127.0.0.1`.

### Altos
- **H-1** ✅ Token já não é `"mama2026"`. Gerado com `secrets.token_urlsafe(32)` e persistido em `~/.hermes/ecommerce-agent/.mom_token`.
- **H-2** 🔲 Sem HTTPS — depende de deploy/proxy (nginx). Assinalado como pendente.
- **H-3** ✅ `chmod(0o600)` na `mom.db` após inicialização.
- **H-4** ✅ Token na URL → cookie `mom_token` (httponly, samesite=strict) com redirect. `Referrer-Policy: no-referrer` na resposta. Token nunca fica no histórico depois do primeiro acesso.
- **H-5** ✅ Rate limiter em memória: 10 POST/PUT/DELETE por minuto por IP.

### Médios
- **M-1** ✅ Token escape corrigido: `json.dumps(cookie_token)` em vez de `token.replace("'", "\\'")`.
- **M-2** 🔲 Sem audit log — requer feature maior (logging estruturado).
- **M-3** ✅ Notification usa `body` em vez do título, truncado a 80 chars.
- **M-4** ✅ Retry aumentado para 3 tentativas com backoff exponencial (0.1s, 0.3s, 0.5s). Helper `_mom_retry()`.
- **M-5** ✅ Cap-DELETE só corre quando `COUNT(*) > 500`.

### Baixos
- **B-1** ✅ Erros 503 devolvem mensagem genérica ("Base de dados temporariamente indisponível") sem leak de detalhes SQLite.
- **B-2** ✅ `api.ts`, `useChatStream.ts`, `Onboarding.tsx` importam `API` de `constants.ts`.
- **B-3** ✅ Polling aumentado para 10s (ativo) / 15s (inativo).

## Pendentes (2)

- **H-2** — HTTPS: requer certificado + configuração de proxy (ex: nginx + Let's Encrypt).
- **M-2** — Audit log: registar quem leu/escreveu com logging estruturado.

---

## Checklist Original

## Críticos

- [x] **C-1: Endpoints sem autenticação** (`api/app/main.py:101`)
  - `GET /api/mom/messages`, `POST /api/mom/messages`, `POST /api/mom/messages/inbound` estavam em `PUBLIC_PATHS` — qualquer um na rede podia ler/escrever sem token.
  - **Remediação:** removido de `PUBLIC_PATHS`. Middleware aceita `X-Mom-Token` ou `X-API-Key` nos endpoints `/api/mom/*`.

- [x] **C-2: Server bound a 0.0.0.0** (`run.py:17`)
  - Exposto à LAN toda. Mudado para `127.0.0.1`.

## Altos

- [x] **H-1: MOM_TOKEN default fraco** (`api/app/main.py:151`)
  - `"mama2026"` hardcoded. Agora gerado com `secrets.token_urlsafe(32)` e persistido em ficheiro.

- [ ] **H-2: Sem HTTPS** (`ui/src/constants.ts:3`, `api/app/main.py:1546`)
  - Todo o tráfego em HTTP plain text. MITM na LAN lê mensagens.
  - **Nota:** depende de deploy. Para dev local é aceitável.

- [x] **H-3: DB world-readable** (`api/app/main.py:126`)
  - `mom.db` em `~/.hermes/` com permissões por defeito. Agora `os.chmod(path, 0o600)`.

- [x] **H-4: Token na URL** (`api/app/main.py:1489`)
  - `/mom?token=xxx` — leak por Referer, browser history, logs. Agora: cookie de sessão (httponly, samesite=strict) com redirect. `Referrer-Policy: no-referrer`.

- [x] **H-5: Sem rate limiting** (`api/app/main.py:1401, 1445`)
  - Flood de POST apaga histórico real (cap 500 linhas). Rate limiter: 10 POST/min/IP.

## Médios

- [x] **M-1: Token escape incompleto** (`api/app/main.py:1545`)
  - `token.replace("'", "\\\\'")` não escapa `\`. Agora usa `json.dumps(token)`.

- [ ] **M-2: Sem audit log** (`api/app/main.py:1375-1485`)
  - Sem registo de quem leu/escreveu. Pendente — requer logging estruturado.

- [x] **M-3: Notificação com texto não sanitizado** (`ui/src/useMomState.ts:52`)
  - `new Notification("💬 Mãe: " + m.text)` — agora usa `body` em vez do título, limitado a 80 chars.

- [x] **M-4: SQLite locking contention** (`api/app/main.py:128-133`)
  - Apenas 1 retry com 100ms. Agora 3 retries com backoff exponencial (0.1s, 0.3s, 0.5s).

- [x] **M-5: Cap-DELETE é caro** (`api/app/main.py:1422-1424`)
  - Corria em cada POST. Agora só corre quando `COUNT(*) > 500`.

## Baixos

- [x] **B-1: Erros 503/500 leak detalhes SQLite** (`api/app/main.py:1398, 1442, 1485`)
  - Logado no servidor, retorna mensagem genérica ao cliente.

- [x] **B-2: API URL hardcoded em 4 ficheiros** (`constants.ts`, `api.ts`, `useChatStream.ts`, `Onboarding.tsx`)
  - Unificado em `constants.ts`. Todos os ficheiros importam de lá.

- [x] **B-3: Polling 5s pode escalar** (`ui/src/useMomState.ts:73-77`)
  - Intervalo aumentado para 10s (ativo) / 15s (inativo).
