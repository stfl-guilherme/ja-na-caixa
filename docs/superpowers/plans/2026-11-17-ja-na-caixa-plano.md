# Plano de Implementação — JáNaCaixa

- **Fonte:** `docs/superpowers/specs/2026-11-17-ja-na-caixa-design.md` (revisada na Fase 1) e `docs/decisoes.md`.
- **Gerado em:** 17/11/2026, roteiro equivalente à skill `writing-plans` (ADR-006).
- **Regra de execução (TDD):** em cada tarefa, escrever o teste, confirmar que falha, implementar o mínimo, rodar a suíte completa da camada, commitar com a mensagem prevista e marcar a tarefa como concluída (`[x]`) no mesmo commit.
- **Definição de pronto:** backend `pytest` verde; frontend `npm run build`, `npm run lint` e `npm test` verdes.

Legenda: `[ ]` pendente · `[x]` concluída · `[~]` pulada (pendência registrada em `docs/decisoes.md`).

---

## Backend

### [x] B1 — Scaffold do backend
- **Arquivos:** `backend/manage.py`, `backend/config/{settings,urls,wsgi,asgi}.py`, `backend/financas/` (app), `backend/requirements.txt`, `backend/pytest.ini`, `backend/conftest.py`.
- **Teste primeiro:** `financas/tests/test_smoke.py` — `GET /api/auth/me/` sem login não retorna `500` (rota ainda inexistente → `404`, confirmando que o projeto sobe).
- **Pronto quando:** `pytest` roda e passa; settings com DRF, `SessaoAuthentication` (ADR-008), `IsAuthenticated` padrão, `DEMO_ENABLED`, idioma `pt-br`, fuso `America/Sao_Paulo`.
- **Commit:** `chore(backend): criar projeto Django com DRF e pytest`

### [x] B2 — Modelo `Categoria`
- **Arquivos:** `financas/models.py`, migração, `financas/tests/test_models.py`.
- **Teste primeiro:** cor padrão `#64748B`; nome duplicado ignorando maiúsculas no mesmo usuário gera `IntegrityError`; mesmo nome em usuários diferentes é permitido.
- **Pronto quando:** testes verdes; `UniqueConstraint(Lower("nome"), "usuario")`.
- **Commit:** `feat(financas): adicionar modelo Categoria`

### [x] B3 — Modelo `Transacao`
- **Arquivos:** `financas/models.py`, migração, `financas/tests/test_models.py`.
- **Teste primeiro:** valor `0` e negativo violam a constraint; excluir categoria com transação levanta `ProtectedError`; propriedades `tipo` e `usuario` vêm da categoria.
- **Pronto quando:** `CheckConstraint valor > 0`, `on_delete=PROTECT`, índice `(categoria, data)`.
- **Commit:** `feat(financas): adicionar modelo Transacao`

### [x] B4 — Autenticação por sessão
- **Arquivos:** `financas/authentication.py`, `financas/views_auth.py`, `financas/urls.py`, `config/urls.py`, `financas/tests/test_auth.py`.
- **Teste primeiro:** `csrf` → `204` e cookie `csrftoken`; login válido → `200 {id, username}`; inválido → `400`; `me` sem login → `401`; `me` logado → `200`; logout → `204` e `me` volta a `401`.
- **Pronto quando:** testes de spec nº 7 (parcial) verdes.
- **Commit:** `feat(api): adicionar autenticação por sessão`

### [x] B5 — Login de demonstração
- **Arquivos:** `financas/views_auth.py`, `financas/tests/test_auth.py`.
- **Teste primeiro:** com usuário `demo` → `200` e sessão ativa; `DEMO_ENABLED=False` → `404`; sem usuário `demo` → `503`.
- **Pronto quando:** teste de spec nº 8 verde.
- **Commit:** `feat(api): adicionar login de demonstração`

### [x] B6 — CRUD de categorias
- **Arquivos:** `financas/serializers.py`, `financas/views.py`, `financas/urls.py`, `financas/tests/test_categorias.py`.
- **Teste primeiro:** CRUD feliz; filtro `?tipo=`; duplicado (case-insensitive) → `400`; cor inválida → `400`; excluir com transações → `409 {"detail", "transacoes": N}` sem excluir; mudar `tipo` com transações → `400`; isolamento (B recebe `404` e não vê dados de A); sem login → `401`.
- **Pronto quando:** testes de spec nº 2, 3, 4, 5 (categorias) e 7 verdes.
- **Commit:** `feat(api): adicionar CRUD de categorias`

### [ ] B7 — CRUD de transações
- **Arquivos:** `financas/serializers.py`, `financas/views.py`, `financas/tests/test_transacoes.py`.
- **Teste primeiro:** CRUD feliz com `categoria_nome`, `categoria_cor`, `tipo` na resposta; valor `<= 0` → `400`; categoria de outro usuário → `400`; isolamento (`404`); ordem `-data, -id`.
- **Pronto quando:** testes de spec nº 1, 5 (transações) e 6 verdes.
- **Commit:** `feat(api): adicionar CRUD de transações`

### [ ] B8 — Filtros e paginação de transações
- **Arquivos:** `financas/views.py`, `financas/filters.py`, `financas/tests/test_transacoes.py`.
- **Teste primeiro:** `mes` retorna só o mês; `mes` inválido → `400`; filtros `categoria`, `tipo`, `busca`; paginação com 20 por página e `count`.
- **Pronto quando:** teste de spec nº 9 verde.
- **Commit:** `feat(api): adicionar filtros e paginação de transações`

### [ ] B9 — Resumo mensal
- **Arquivos:** `financas/views.py`, `financas/tests/test_resumo.py`.
- **Teste primeiro:** receitas, despesas e saldo do mês como string; `0.10 + 0.20 == "0.30"`; `por_categoria` ordenado por total; sem `mes` usa mês atual; `mes` inválido → `400`; isolamento.
- **Pronto quando:** teste de spec nº 10 verde.
- **Commit:** `feat(api): adicionar endpoint de resumo mensal`

### [ ] B10 — Comando `seed_demo`
- **Arquivos:** `financas/management/commands/seed_demo.py`, `financas/tests/test_seed_demo.py`.
- **Teste primeiro:** cria `demo` com senha inutilizável, ~8 categorias e ~60 transações nos últimos 3 meses; rodar duas vezes não duplica; `--reset` recria.
- **Pronto quando:** testes verdes; comando idempotente.
- **Commit:** `feat(financas): adicionar comando seed_demo`

### Revisão do backend
- Revisão de código (equivalente a `requesting-code-review`), correções em commits `fix`/`refactor`, linha no `registro-uso-ia.md`.

---

## Frontend

### [ ] F1 — Scaffold do frontend
- **Arquivos:** `frontend/` (Vite React TS), `vite.config.ts` (proxy `/api` → `:8000`, Vitest jsdom), Tailwind v4, ESLint, `src/test/setup.ts`, alias `@/`.
- **Teste primeiro:** `src/App.test.tsx` — renderiza o texto "JáNaCaixa".
- **Pronto quando:** `npm run build`, `npm run lint`, `npm test` verdes.
- **Commit:** `chore(frontend): criar projeto React com Vite, Tailwind e Vitest`

### [ ] F2 — Utilitários de moeda e data
- **Arquivos:** `src/lib/format.ts`, `src/lib/format.test.ts`.
- **Teste primeiro:** `formatarMoeda("1234.5")` → `R$ 1.234,50`; `parseValorBR("1.234,56")` → `"1234.56"`; entradas inválidas (`""`, `"abc"`, `"1,2,3"`, `"-5"`, `"0"`) → `null`; `mesAtual()`, `formatarMes("2026-11")`, `formatarData("2026-11-17")` → `17/11/2026`.
- **Pronto quando:** testes de spec do front nº 1 e 2 verdes.
- **Commit:** `feat(frontend): adicionar utilitários de moeda e data`

### [ ] F3 — Cliente da API
- **Arquivos:** `src/api/client.ts`, `src/api/types.ts`, `src/api/endpoints.ts`, `src/api/client.test.ts`.
- **Teste primeiro:** POST envia `X-CSRFToken` lido do cookie; erro `400` vira `ApiError` com `fieldErrors`; `401` vira `ApiError` com `status 401`; `204` retorna `undefined`.
- **Pronto quando:** testes verdes; tipos `Categoria`, `Transacao`, `Resumo`, `Paginado<T>`, `Usuario`.
- **Commit:** `feat(frontend): adicionar cliente da API`

### [ ] F4 — Componentes de UI
- **Arquivos:** `src/components/ui/{button,input,label,card,dialog,select,table,skeleton,badge,textarea}.tsx`, `src/lib/utils.ts` (`cn`).
- **Teste primeiro:** `button.test.tsx` — aplica variante e repassa `onClick`.
- **Pronto quando:** build/lint/test verdes (ADR-007).
- **Commit:** `feat(frontend): adicionar componentes de UI no padrão shadcn`

### [ ] F5 — Tela de login
- **Arquivos:** `src/auth/useAuth.ts`, `src/pages/LoginPage.tsx`, `src/pages/LoginPage.test.tsx`.
- **Teste primeiro:** clicar em "Entrar como demonstração" chama `POST /api/auth/demo/` e navega para `/`; login inválido exibe a mensagem.
- **Pronto quando:** teste de spec do front nº 3 verde.
- **Commit:** `feat(frontend): adicionar tela de login`

### [ ] F6 — Layout e rotas protegidas
- **Arquivos:** `src/App.tsx`, `src/components/Layout.tsx`, `src/components/ProtectedRoute.tsx`, testes.
- **Teste primeiro:** sem sessão (`me` → `401`) redireciona para `/login`; com sessão mostra o cabeçalho "JáNaCaixa" e o menu.
- **Pronto quando:** build/lint/test verdes.
- **Commit:** `feat(frontend): adicionar layout e rotas protegidas`

### [ ] F7 — Tela de categorias
- **Arquivos:** `src/pages/CategoriasPage.tsx`, `src/components/CategoriaForm.tsx`, testes.
- **Teste primeiro:** lista categorias; estado vazio; exclusão com `409` mostra a mensagem do backend.
- **Pronto quando:** CRUD de categorias pela interface (ponto de controle do dia 3).
- **Commit:** `feat(frontend): adicionar tela de categorias`

### [ ] F8 — Formulário de transação
- **Arquivos:** `src/components/TransacaoForm.tsx`, `src/components/TransacaoForm.test.tsx`.
- **Teste primeiro:** erros `400` da API aparecem no campo correspondente; valor `1.234,56` é enviado como `"1234.56"`; valor inválido bloqueia o envio.
- **Pronto quando:** teste de spec do front nº 4 verde.
- **Commit:** `feat(frontend): adicionar formulário de transação`

### [ ] F9 — Tela de transações
- **Arquivos:** `src/pages/TransacoesPage.tsx`, testes.
- **Teste primeiro:** lista transações com valor formatado; filtro de mês muda a consulta; estado vazio.
- **Pronto quando:** tabela paginada, filtros (mês, categoria, tipo, busca), modal criar/editar, confirmação ao excluir.
- **Commit:** `feat(frontend): adicionar tela de transações`

### [ ] F10 — Dashboard
- **Arquivos:** `src/pages/DashboardPage.tsx`, `src/components/GraficoDespesas.tsx`, testes.
- **Teste primeiro:** cards exibem receitas, despesas e saldo formatados vindos de `/api/resumo/`; lista as 5 últimas transações.
- **Pronto quando:** seletor de mês, cards, gráfico (Recharts, só despesas), últimas transações.
- **Commit:** `feat(frontend): adicionar dashboard`

### Revisão do frontend
- Revisão de código, correções em commits `fix`/`refactor`, linha no `registro-uso-ia.md`.

---

## Polimento e documentação

### [ ] P1 — Polimento
- **Arquivos:** páginas e componentes.
- **Teste primeiro:** não se aplica (ajustes visuais); suítes completas devem continuar verdes.
- **Pronto quando:** responsivo a partir de 375 px; estados carregando/vazio/erro em todas as telas.
- **Commit:** `style(frontend): polir responsividade e estados das telas`

### [ ] P2 — README final (Fase 4)
- **Arquivos:** `README.md`, `docs/ia/registro-uso-ia.md`.
- **Pronto quando:** README reproduzido em clone limpo; critérios de aceite conferidos.
- **Commit:** `docs: finalizar documentação`
