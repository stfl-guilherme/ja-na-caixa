# Plano de Implementação — Novo design do JáNaCaixa

- **Fonte:** spec `docs/superpowers/specs/2026-11-17-ja-na-caixa-design.md` (seções 6.3, 6.4, 6.6, 7, 8, 9 e 15), `docs/decisoes.md` (ADR-012 a ADR-016) e `docs/design/decisoes-de-design.md` (fonte da verdade do design).
- **Gerado em:** 18/11/2026, roteiro equivalente à skill `writing-plans` (o plugin Superpowers não está instalado; ADR-006).
- **Regra de execução (TDD):** em cada tarefa, escrever o teste, confirmar que falha, implementar o mínimo, rodar a suíte completa da camada, commitar com a mensagem prevista e marcar a tarefa como concluída (`[x]`) no mesmo commit.
- **Definição de pronto:** backend `pytest` verde; frontend `npm run build`, `npm run lint` e `npm test` verdes. A suíte existente continua passando (testes de tela antigos são **atualizados** para a nova interface, nunca apagados sem substituto que cubra o mesmo comportamento).
- **Regras transversais:** o front não soma dinheiro; moeda sempre BRL com 2 casas; animações só de entrada e com `prefers-reduced-motion`; sem `framer-motion`; personagens conforme a seção 6 de `decisoes-de-design.md`.

Legenda: `[ ]` pendente · `[x]` concluída · `[~]` pulada (pendência registrada em `docs/decisoes.md`).

---

## Backend

### [x] NB1 — Série diária no resumo
- **Arquivos:** `backend/financas/views.py`, `backend/financas/tests/test_resumo.py`.
- **Teste primeiro:** `serie_diaria` tem um item por dia do mês (30 em novembro, 29 em fevereiro de 2028); receitas, despesas e `saldo_acumulado` corretos; dia sem transação com `"0.00"` e acumulado repetido; mês sem transações → todos os itens zerados; precisão decimal (`0.10 + 0.20`); isolamento (transações de outro usuário não entram).
- **Pronto quando:** testes verdes; campos antigos do resumo inalterados.
- **Commit:** `feat(api): adicionar série diária ao resumo do mês`

### [x] NB2 — Totais do mês anterior no resumo
- **Arquivos:** `backend/financas/views.py`, `backend/financas/filters.py`, `backend/financas/tests/test_resumo.py`.
- **Teste primeiro:** `mes_anterior` de `2026-11` é `2026-10` com os totais certos; **virada de ano**: `2026-01` → `2025-12`; mês anterior vazio → zeros; isolamento.
- **Pronto quando:** testes verdes.
- **Commit:** `feat(api): adicionar totais do mês anterior ao resumo`

### [x] NB3 — Quantidade de transações por categoria no mês
- **Arquivos:** `backend/financas/views.py`, `backend/financas/tests/test_resumo.py`.
- **Teste primeiro:** `por_categoria[].quantidade` conta só transações do mês consultado (transação de outro mês não conta).
- **Pronto quando:** teste verde; o teste antigo de `por_categoria` passa a incluir `quantidade`.
- **Commit:** `feat(api): informar quantidade de transações por categoria no resumo`

### [x] NB4 — Resumo anual
- **Arquivos:** `backend/financas/views.py`, `backend/financas/urls.py`, `backend/financas/tests/test_resumo_anual.py`.
- **Teste primeiro:** 12 meses sempre presentes, em ordem; totais por mês e do ano; meses vazios com `"0.00"`; precisão decimal; isolamento; transação de outro ano não entra; sem `ano` usa o ano atual; `ano` inválido (`"26"`, `"abcd"`, `"0000"`) → `400 {"ano": [...]}`; sem login → `401`.
- **Pronto quando:** testes verdes; rota `GET /api/resumo/anual/` antes de qualquer rota que pudesse capturá-la.
- **Commit:** `feat(api): adicionar endpoint de resumo anual`

### [x] NB5 — Totais na listagem de transações
- **Arquivos:** `backend/financas/views.py`, `backend/financas/tests/test_transacoes.py`.
- **Teste primeiro:** `totais` soma **todas as páginas** do filtro (25 transações, página 1 com 20 itens, totais das 25); respeita `tipo`, `categoria`, `busca` e `mes`; `totais_por_dia` traz só as datas da página atual, em ordem decrescente, com o saldo do dia; precisão decimal; isolamento.
- **Pronto quando:** testes verdes; formato paginado anterior (`count`, `next`, `previous`, `results`) inalterado.
- **Commit:** `feat(api): adicionar totais do filtro à listagem de transações`

### [x] NB6 — Seed de 12 meses com cores da paleta
- **Arquivos:** `backend/financas/management/commands/seed_demo.py`, `backend/financas/tests/test_seed_demo.py`.
- **Teste primeiro:** transações nos últimos 12 meses (inclusive o atual, nenhuma no futuro), cerca de 20 por mês; todas as cores das categorias pertencem à paleta de 10 cores; o mês anterior ao atual tem transações; continua idempotente e `--reset` recria.
- **Pronto quando:** testes verdes; `seed_demo --reset` roda no banco local.
- **Commit:** `feat(seed): gerar 12 meses de dados com cores da paleta`

## Frontend

### [x] NF1 — Tema: tokens, Tailwind e fontes
- **Arquivos:** `frontend/src/index.css`, `frontend/src/styles/tokens.css` (só importado), `frontend/package.json` (`@fontsource/baloo-2`, `@fontsource/plus-jakarta-sans`), `frontend/src/main.tsx`.
- **Teste primeiro:** `src/styles/tema.test.ts` lê `index.css` e confirma que as cores do tema do Tailwind apontam para variáveis `--jnc-*` existentes em `tokens.css` (nenhum hexadecimal solto no tema).
- **Pronto quando:** tema mapeado (`bg-fundo-app`, `text-tinta`, `text-receita`, `bg-verde-700` etc.), `tabular-nums` no `body`, fundo areia nas telas internas, fontes empacotadas; build/lint/test verdes.
- **Commit:** `style(frontend): aplicar tokens do design no tema do Tailwind`

### [x] NF2 — Componente `Personagem`
- **Arquivos:** `frontend/src/components/Personagem.tsx`, `Personagem.test.tsx`.
- **Teste primeiro:** renderiza o PNG da pose pedida com `alt=""` e `aria-hidden="true"`; tamanho em px aplicado à altura; variante `espiando` posicionada atrás da borda (`z-0`, cartão em `z-10`); não aceita pose inexistente (tipo).
- **Pronto quando:** testes verdes.
- **Commit:** `feat(frontend): adicionar componente Personagem`

### [x] NF3 — Utilitários de exibição e máscaras
- **Arquivos:** `frontend/src/lib/format.ts`, `format.test.ts`, `frontend/src/lib/mascaras.ts`, `mascaras.test.ts`, `frontend/src/lib/comparacao.ts`, `comparacao.test.ts`.
- **Teste primeiro:** `formatarComSinal("1450.00", "DESPESA")` → `− R$ 1.450,00` (U+2212); máscara de centavos (`"123456"` → `1.234,56`, envio `"1234.56"`, sem perder centavos); máscara de data (`"17112026"` → `17/11/2026`, conversão para ISO e validação de datas impossíveis); comparação: em Despesas, aumento = ruim (vermelho), queda = bom (verde); em Receitas/Saldo, o contrário; frases "gastou mais/menos", "ganhou…", "sobrou…".
- **Pronto quando:** testes verdes.
- **Commit:** `feat(frontend): adicionar formatação com sinal, máscaras e comparação mensal`

### [x] NF4 — API e mês global
- **Arquivos:** `frontend/src/api/types.ts`, `endpoints.ts`, `frontend/src/hooks/useResumo.ts`, `frontend/src/hooks/useMesSelecionado.ts` (+ teste).
- **Teste primeiro:** `useMesSelecionado` lê `?mes=` da URL, usa o mês atual sem parâmetro e preserva os outros parâmetros ao trocar; `resumoApi.anual(2026)` chama `/api/resumo/anual/?ano=2026`.
- **Pronto quando:** tipos novos (`serie_diaria`, `mes_anterior`, `quantidade`, `totais`, `totais_por_dia`, `ResumoAnual`) e testes verdes.
- **Commit:** `feat(frontend): consumir novos dados do resumo e guardar o mês na URL`

### [x] NF5 — Login
- **Arquivos:** `frontend/src/pages/LoginPage.tsx` (+ teste), `frontend/src/components/login/CenaPraia.tsx`, `CenaPraiaMobile.tsx`.
- **Teste primeiro:** testes atuais de login continuam (demo, usuário/senha, erro, redirecionamento); novos: estado carregando (botão "Entrando…", campos desabilitados, Papo animado), estado de erro (banner `role="alert"` com "Usuário ou senha inválidos", campos `aria-invalid`, Papo preocupado), mostrar/ocultar senha.
- **Pronto quando:** desktop (cena + cartão) e mobile (cena no topo sobre areia contínua, sem cartão) conforme `docs/design/telas/login/`.
- **Commit:** `feat(frontend): aplicar novo design na tela de login`

### [x] NF6 — Layout base
- **Arquivos:** `frontend/src/components/Layout.tsx` (+ teste), `components/layout/` (`AppSidebar`, `BottomNav`, `MonthPicker`, `CabecalhoPagina`, `contexto`), `TransacaoModal.tsx` (+ teste, **completo**, substitui `TransacaoForm.test.tsx`), `ExcluirTransacaoDialog.tsx`, `Aviso.tsx` (ADR-017).
- **Teste primeiro:** testes atuais do layout continuam (nome, links, usuário, sair); novos: "+ Nova transação" abre o modal de qualquer rota; links preservam `?mes=`; seletor troca o mês na URL; item ativo com `aria-current="page"`; Papo do menu some quando a página pede (estado vazio com coadjuvante).
- **Pronto quando:** menu lateral ≥ 720px, barra inferior + FAB < 720px.
- **Commit:** `feat(frontend): adicionar layout com menu lateral, barra inferior e mês global`

### [x] NF7 — Painel: cartões de métrica
- **Arquivos:** `frontend/src/components/painel/MetricCard.tsx` (+ teste), `frontend/src/hooks/useContagem.ts`.
- **Teste primeiro:** valor com sinal e cor; comparação com o mês anterior (texto + seta); **Despesas: aumento vermelho, queda verde**; cartão é link para `/transacoes?mes=…&tipo=…`; contagem animada termina no valor exato e não anima com `prefers-reduced-motion`.
- **Commit:** `feat(frontend): adicionar cartões de métrica do painel`

### [x] NF8 — Painel: gráficos
- **Arquivos:** `frontend/src/components/painel/SaldoLineChart.tsx`, `FluxoEspelhadoChart.tsx`, `AnoBarChart.tsx`, `CategoriasTreemap.tsx`, `frontend/src/lib/squarify.ts` (+ testes).
- **Teste primeiro:** `squarify` cobre a área total sem sobreposição; `textoSobre` escolhe branco/tinta pelo contraste; cada gráfico tem `role="img"` com `aria-label` e tabela equivalente escondida; tooltip do saldo responde às setas do teclado; treemap mostra só despesas e a tabela das 5 maiores.
- **Commit:** `feat(frontend): adicionar gráficos do painel em SVG`

### [x] NF9 — Painel: página completa
- **Arquivos:** `frontend/src/pages/DashboardPage.tsx` (+ teste).
- **Teste primeiro:** testes atuais adaptados (totais, só despesas no gráfico, 5 últimas, troca de mês, vazio); novos: **troca para `papo-preocupado` quando o saldo é negativo**; estado vazio com `papo-cadeira-acenando` + `caranguejo` e botão "Nova transação"; no máximo 2 personagens.
- **Commit:** `feat(frontend): montar o painel bento com estados vazio e negativo`

### [x] NF10 — Transações
- **Arquivos:** `frontend/src/pages/TransacoesPage.tsx` (+ teste), `TransacaoModal.tsx` (+ teste, substitui `TransacaoForm`), `ConfirmDialog.tsx`, `Toast.tsx`.
- **Teste primeiro:** testes atuais adaptados (lista, mês, tipo, vazio, exclusão, paginação, erros da API no campo, edição preenchida); novos: filtros segmentados e `?tipo=` da URL; linha de totais do filtro vinda da API; máscaras e mensagens exatas de validação; exclusão pelo modal de edição; toast com `papo-joinha`; Papo dos filtros some no vazio e com toast.
- **Commit:** `feat(frontend): aplicar novo design na tela de transações`

### [x] NF11 — Categorias
- **Arquivos:** `frontend/src/pages/CategoriasPage.tsx` (+ teste), `CategoriaModal.tsx` (substitui `CategoriaForm`).
- **Teste primeiro:** testes atuais adaptados (seções, vazio, criar, erro no campo, tipo bloqueado); novos: quantidade e total do mês por categoria vindos do resumo; 10 cores como radios; exclusão de categoria em uso abre diálogo informativo (sem botão excluir, com `papo-preocupado`) usando o número de transações; exclusão livre confirma e chama a API.
- **Commit:** `feat(frontend): aplicar novo design na tela de categorias`

### [x] NF12 — Créditos e limpeza
- **Arquivos:** `README.md`, componentes antigos sem uso (`GraficoDespesas`, `SeletorMes`, `CategoriaForm`, `TransacaoForm`).
- **Teste primeiro:** não se aplica (remoção de código morto); suíte completa verde.
- **Commit:** `refactor(frontend): remover componentes substituídos pelo novo design`

## Verificação

### [x] V1 — Verificação final
- `pytest` (113), `npm run build`, `npm run lint` (sem avisos) e `npm test` (152) verdes.
- `seed_demo --reset`, back e front no ar; fluxo pela API via proxy do Vite: login demo → resumo e resumo anual → criar transação → editar → excluir → criar categoria → excluir categoria em uso (`409`, 48 transações) → excluir categoria livre (`204`).
- Roteiro no navegador (Chromium headless, Playwright) em 1440 px e 375 px: login padrão e erro, entrada demo, Painel, Transações, modal com erros, edição, exclusão, Transações vazio, Categorias, edição de categoria, exclusão bloqueada e Painel vazio. Screenshots em `docs/screenshots/`. Console: só o `401` esperado de `/auth/me` antes do login e o `400` do login com senha errada. Nenhuma rolagem horizontal.
- Correções feitas a partir dos screenshots (`8895362`): falhas na linha do saldo (tracejado com `non-scaling-stroke` no Chromium), tabelas acessíveis que esticavam a página, rótulos dos meses sobrepostos no celular, fundo do menu lateral, cartões de categoria apertados.
- **Commit:** `docs: atualizar documentação após novo design`

### Diferenças conhecidas em relação a `docs/design/telas/`
1. **Paginação:** 20 por página (spec 6.3); o protótipo usa 10.
2. **Barra inferior:** tem um 4º item, "Sair" (ADR-017).
3. **Cartão do usuário:** mostra iniciais e `username`; o design mostra nome completo e login (ADR-017).
4. **Personagens:** nos estados vazios o Papo do menu lateral some (limite de 2 personagens); o export mostrava 3. No celular, o Papo pequeno do Painel troca para a pose preocupada com saldo negativo (o export mostrava sempre a pose espiando).
5. **Categorias:** cartões com no mínimo 300 px (3 colunas em 1440 px); o design usa 260 px (4 colunas), o que cortava os nomes.
6. **Ano em resumo no celular:** meses pela inicial (J, F, M…); no design as abreviações se sobrepõem em 375 px.
7. **Estado vazio de Transações sem filtro:** texto "Nenhuma transação em {mês}." com botão "Nova transação" (o design só tem o vazio por filtro).
8. **Comparação sem mês anterior:** "Sem movimento em {mês} para comparar", sem percentual (o design não prevê o caso).
9. **Seletor de mês:** sem limite de janeiro a dezembro (o protótipo travava em 2026).
10. **Componentes de referência do 21st.dev:** não vieram no export; os gráficos seguem o comportamento descrito em `Painel.dc.html` (ADR-012, ADR-014).
11. **Mensagem do valor:** "Informe um valor maior que R$ 0,00." pode quebrar a linha entre "R$" e "0,00" em larguras estreitas.
