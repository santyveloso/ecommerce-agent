# Polish Audit — Ecommerce Agent

> Análise crítica de UX, performance, consistência, código morto, tipos e acessibilidade.
> Baseado no código real (ui/src/ e api/app/). Nenhuma alteração foi feita.

---

## Quick Wins (minutos, impacto alto)

| # | Categoria | Localização | Problema | Solução | Esforço | Impacto |
|---|-----------|------------|----------|---------|---------|---------|
| Q1 | Código morto | `ui/src/App.css` (184 linhas) | Boilerplate do starter template (`.counter`, `.hero`, `#center`, `#next-steps`). Nenhuma classe é usada na app. | Apagar o ficheiro. | 30s | — |
| Q2 | Código morto | `ui/src/index.css` (1 linha) | Comentário `/* Minimal — reset is in chat.css */`. Ficheiro vazio. | Apagar. | 10s | — |
| Q3 | Consistência | `ui/src/dash-themes.css:83` e `:187` | `[data-theme="espresso"]` **definido duas vezes**. O segundo overwrites o primeiro. São temas diferentes (um é "rich coffee + caramel", o outro é "almost black + warm gold"). | Renomear um deles (ex: `espresso` → `roasted` ou `charcoal`). | 2min | Baixo — tema duplicado nunca é usado |
| Q4 | Consistência | Naming: `StatusTab.tsx`, `LinksTab.tsx` vs `OrdersPanel.tsx`, `EmailsPanel.tsx` | 2 painéis usam sufixo `Tab`, 7 usam `Panel`. Inconsistência de naming. | Renomear `StatusTab` → `StatusPanel`, `LinksTab` → `LinksPanel`. Actualizar imports em `DashboardBody.tsx`. | 5min | Baixo |
| Q5 | UX | `ui/src/Sidebar.tsx` | `nav-category` definido em CSS mas **nunca usado**. Sidebar não tem separadores/categorias. | Adicionar categorias (ex: "Gestão", "Ferramentas") ou remover o CSS morto. | 5min | Médio |
| Q6 | CSS morto | `ui/src/dash-base.css:51-53` | `.sidebar.transition { transition: width 0.2s ease }` definido mas **nunca aplicado**. | Aplicar a classe quando o sidebar colapsa/expande, ou remover. | 2min | Baixo |
| Q7 | UX | `ui/src/SettingsPanel.tsx` | Tema espresso duplicado no seletor de temas | Remover a entrada duplicada. | 2min | Baixo |

---

## Médios (impacto médio, esforço baixo-médio)

| # | Categoria | Localização | Problema | Solução | Esforço | Impacto |
|---|-----------|------------|----------|---------|---------|---------|
| M1 | Tipos | `ui/src/DashboardBody.types.ts` + todos os painéis | **`any` em todo o lado**: `dashboardData: any`, `statusData: any`, `orders: any[]`, `emails: any[]`, `automations: any[]`, `memoryEntries: any[]`, `generatedImages: any[]`, `links: any[]`, etc. Dos 207 lines de props, ~80% são `any`. | Tipar com interfaces (já existem `Order`, `DashboardData`, `MomMessage` em `types.ts` — estender para os restantes). | 1-2h | Alto — catching de bugs em compile-time |
| M2 | Arquitetura | `ui/src/Dashboard.tsx:213-392` | **Prop drilling extremo**: 80+ props passadas de `Dashboard` → `DashboardBody` → painéis individuais. 394 linhas de Dashboard.tsx são só props. | 1. Agrupar props relacionadas em objetos (ex: `chatProps`, `ordersProps`). 2. Ou usar React Context para dados de baixa frequência. | 2-3h | Alto — manutenibilidade |
| M3 | Performance | `ui/src/useMomState.ts:74-78` | **Polling a correr mesmo com o tab background**: 10s ativo, 15s inativo. Consome bateria/recursos em background. | Usar `document.hidden` para pausar poll quando o tab não está visível. Ou aumentar para 60s em background. | 30min | Médio |
| M4 | Consistência visual | Vários painéis | **Inline styles vs CSS classes misturados**: `OrdersPanel` usa classes (`.table`, `.orders-layout`). `MemoryPanel`, `MomPanel`, `StatusTab` usam 100% inline styles. `LinksTab` usa mistura. | Consolidar: ou tudo CSS modules, ou tudo inline (se for app pequena). Mínimo: extrair estilos repetidos (ex: input fields, buttons) para classes CSS. | 3-4h | Alto — consistência |
| M5 | Tradução | Vários locais | **Mistura PT/EN sem critério**: "Dashboard" vs "Mãe", "Settings" vs "Definições" (título EN mas conteúdo PT). "All Systems Go" vs "Todos os serviços estão operacionais". | Escolher um idioma (PT) para toda a UI. Especialmente: `StatusTab.tsx:53` "All Systems Go" / "Issues Detected". | 1h | Médio |
| M6 | UX | `ui/src/Sidebar.tsx:94-97` | **"Conectado" é falso positivo**: mostra sempre "Conectado" com green dot mesmo se o backend estiver down. | Usar `fetchStatus()` do `useStatusData` para mostrar estado real. Ou pelo menos mostrar "Offline" se houver erro. | 30min | Médio |
| M7 | UX | `ui/src/MomPanel.tsx` | Painel da Mãe não tem **error state** — se o fetch falhar, fica simplesmente vazio/silencioso. | Mostrar "Sem ligação ao servidor" com opção de retry. | 20min | Médio |
| M8 | UX | `ui/src/MemoryPanel.tsx:79-84` | **Loading state fraco**: só mostra spinner, sem skeleton. | Adicionar skeleton placeholder (já há exemplos no código? Não — criar simples). | 30min | Baixo |

---

## Deep Polish (esforço médio-alto, impacto alto)

| # | Categoria | Localização | Problema | Solução | Esforço | Impacto |
|---|-----------|------------|----------|---------|---------|---------|
| D1 | Acessibilidade | Toda a app | **Zero `aria-label`, `role`, ou suporte a keyboard navigation** além do básico. `<a>` sem `href` (usados como botões no sidebar), `<button>` sem texto acessível. | Adicionar `aria-label` nos nav items, roles apropriados, `aria-current="page"` no tab ativo. | 2-3h | Alto — a11y |
| D2 | Acessibilidade | `ui/src/DashboardBody.tsx:88-312` | **Tabs não são focusable**: os `activeTab === 'x' && <Panel />` fazem render condicional. O conteúdo muda mas o foco não é gerido. | Usar `role="tabpanel"` com `aria-labelledby`. Gerir foco quando tab muda. | 2h | Médio |
| D3 | Acessibilidade | Toda a app | **Sem `focus-visible` styles** globais. Usar Tab para navegar não mostra indicador de foco. | Adicionar `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` global. | 15min | Alto — a11y |
| D4 | Responsividade | Vários painéis | **Testado apenas em desktop**: `dash-pages.css` tem breakpoints a 768px e 900px (esconde sidebar, muda grids). Mas painéis como `MemoryPanel` (flex layout fixo com `width: 280` sidebar), `OrdersPanel` (tabela larga), `StudioPanel` (grid de imagens) não foram adaptados. | Testar em 375px, 768px, 1024px, 1440px. Ajustar grids a colapsar para single column. | 3-5h | Alto |
| D5 | UX | `ui/src/LoadingScreen.tsx` | **Loading screen minimalista**: só spinner + "A carregar...". Não mostra progresso ou branding. | Adicionar logo, animação de entrada, mensagem contextual (ex: "A verificar configuração..."). | 1h | Médio |
| D6 | UX | `ui/src/useMomState.ts:46-57` | **Notificação sem agrupar**: se a mãe manda 5 mensagens seguidas, o browser mostra 5 notificações individuais. | Agrupar notificações: mostrar uma notificação com "Mãe (3 novas mensagens)". | 30min | Médio |
| D7 | UX | `ui/src/Onboarding.tsx` | **Onboarding não pode ser re-trigged**: depois de configurado, não há forma de voltar ao onboarding completo sem limpar localStorage. | Adicionar "Reconfigurar loja" nas Settings que limpa e redireciona. | 1h | Médio |

---

## Código Limpo (baixo impacto, bom de fazer)

| # | Categoria | Localização | Problema | Solução | Esforço |
|---|-----------|------------|----------|---------|---------|
| C1 | Manutenção | `ui/src/constants.ts`, `api.ts`, `useChatStream.ts`, `Onboarding.tsx` | **`API = 'http://localhost:7777'` hardcoded em 4 ficheiros**. | Unificar em `constants.ts` e importar nos outros. | 10min |
| C2 | Manutenção | `ui/src/Dashboard.tsx` | Props `onGatewayActiveModelChange` e `onActiveModelChange` recebem a mesma função `setGatewayActiveModel`. | Unificar. | 2min |
| C3 | Manutenção | `ui/src/Dashboard.tsx:207-209` | `handleStudioInputChange`, `insertStudioSuggestion`, `handleStudioInputKeyDown` são wrappers inline complexos. | Extrair lógica para dentro de `useStudioAutocomplete`. | 15min |
| C4 | Consistência | `ui/src/Sidebar.tsx:36-87` | Nav items repetem o mesmo padrão 10x. Dá para refatorar com um array e `.map()`. | Extrair para `const NAV_ITEMS = [...]` e fazer map. | 30min |
| C5 | UX | `ui/src/DashboardBody.tsx:88-312` | `activeTab === 'x' && <Panel />` para cada tab — 11 renders condicionais. Podem ser lazy-load com `React.lazy` + `Suspense`. | Usar `lazy()` e `Suspense` para carregar painéis apenas quando usados. | 1h |

---

## Verdict

**Estado atual**: MVP funcional, shipável para uso pessoal, MAS:

- **Tipos `any` dominantes**: ~80% das props são sem tipo. Refactor M1 é o que mais impacto dá na confiança do código.
- **Prop drilling severo**: M2 precisa ser endereçado antes de adicionar mais features.
- **Acessibilidade zero**: D1/D2/D3 — se quiseres partilhar a app com não-técnicos, isto é blocker.
- **Responsividade quebrada em mobile**: D4 — o sidebar desaparece mas os painéis não foram desenhados para ecrãs pequenos. Alguns painéis (`MemoryPanel`, `OrdersPanel`) ficam inutilizáveis em <768px.

**Tempo estimado para polish completo**: ~20-30h
- Quick wins: 30min
- Médios: 8-12h
- Deep polish: 12-16h
- Código limpo: 2-3h

**Ordem recomendada**:

```
1. Q1-Q4 (limpeza rápida, 5min)
2. C1, C2 (unificar API e limpar props, 15min)
3. M1 (tipar any -> interfaces, 2h) ← MAIOR IMPACTO
4. D3 (focus-visible global, 15min) ← MAIOR IMPACTO/ESFORÇO
5. M5 (PT consistency, 1h)
6. M4 (inline styles -> classes, 3-4h)
7. M2 (reduzir prop drilling via context, 2-3h)
8. D1/D2 (a11y: aria-labels + roles, 4h)
9. D4 (responsividade mobile, 3-5h)
10. M3, M6, M7, D5, D6, D7 (polimento final)
```
