# Plano de Implementação — Novas funcionalidades (orçamento, dicas, forma de pagamento, fixas)

- **Fonte:** spec `docs/superpowers/specs/2026-11-17-ja-na-caixa-design.md` (seção 17), `docs/decisoes.md` (ADR-021 a ADR-027) e `docs/design/decisoes-de-design.md` (seções 5 e 6).
- **Gerado em:** 19/11/2026, roteiro equivalente à skill `writing-plans` (o plugin Superpowers não está instalado; ADR-006).
- **Regra de execução (TDD):** em cada tarefa, escrever o teste, confirmar que falha, implementar o mínimo, rodar a suíte completa da camada, commitar com a mensagem prevista e marcar a tarefa como concluída (`[x]`) no mesmo commit.
- **Definição de pronto:** backend `pytest` verde; frontend `npm run build`, `npm run lint` e `npm test` verdes (Node 22, ADR-027). Nenhuma funcionalidade existente quebra.
- **Regra de corte:** uma funcionalidade só começa quando a anterior está completa (backend + frontend), com toda a suíte verde, commitada e enviada (`git push`). Se uma funcionalidade não ficar estável, os commits dela são revertidos (`git revert`, nunca `reset`), o motivo vai para `docs/decisoes.md` e o trabalho para; as anteriores ficam.
- **Regras transversais:** o front não soma dinheiro (valores e excessos vêm do backend); a cor nunca é o único sinal; personagens conforme a seção 6 de `decisoes-de-design.md`; no máximo 2 personagens por tela.

Legenda: `[ ]` pendente · `[x]` concluída · `[~]` pulada (pendência registrada em `docs/decisoes.md`).

---

## Funcionalidade 1 — Orçamento por categoria (spec 17.1, ADR-021)

### [x] O1 — Campo `limite_mensal` e validações
- **Arquivos:** `backend/financas/models.py`, nova migration `0003_categoria_limite_mensal.py`, `backend/financas/serializers.py`, `backend/financas/tests/test_orcamentos.py`.
- **Teste primeiro:** criar despesa com limite → 201 e limite devolvido; sem limite → `null`; receita com limite → 400 `limite_mensal`; limite `0` e negativo → 400; trocar despesa sem transações para receita mantendo o limite → 400 com mensagem clara; trocar enviando `limite_mensal: null` → 200 e limite removido; PATCH só do nome mantém o limite.
- **Pronto quando:** testes verdes; migration reversível (`migrate financas 0002` e de volta).
- **Commit:** `feat(api): adicionar limite mensal às categorias de despesa`

### [x] O2 — Endpoint de orçamentos
- **Arquivos:** `backend/financas/views.py`, `backend/financas/urls.py`, `backend/financas/tests/test_orcamentos.py`.
- **Teste primeiro:** só categorias de despesa com limite, em ordem alfabética; `gasto`, `percentual` (2 casas) e `excesso`; situação nos limites exatos 79,99% (`ok`) / 80% (`atencao`) / 100% (`atencao`) / 100,01% (`estourado`); mês sem gastos → `"0.00"` e `ok`; transações de outro mês não entram; isolamento; `mes` inválido → 400; sem login → 401.
- **Pronto quando:** testes verdes.
- **Commit:** `feat(api): adicionar endpoint de orçamentos do mês`

### [x] O3 — Tipos, API e componente da barra de orçamento
- **Arquivos:** `frontend/src/api/types.ts`, `frontend/src/api/endpoints.ts`, `frontend/src/hooks/useOrcamentos.ts`, `frontend/src/components/BarraOrcamento.tsx` e teste.
- **Teste primeiro:** "R$ 340,00 de R$ 500,00 (68%)"; texto "Dentro do limite", "Atenção" e "Limite ultrapassado em R$ 82,50"; 79,99 → "79%"; `role="progressbar"` com `aria-valuenow` limitado a 100.
- **Pronto quando:** build, lint e testes verdes.
- **Commit:** `feat(frontend): adicionar barra de orçamento`

### [x] O4 — Limite no modal de categoria
- **Arquivos:** `frontend/src/components/CategoriaModal.tsx`, `frontend/src/components/CategoriaModal.test.tsx`.
- **Teste primeiro:** campo "Limite mensal (opcional)" visível para despesa e escondido para receita; envia `limite_mensal` em formato da API; vazio envia `null`; trocar para receita envia `null`; erro da API em `limite_mensal` aparece no campo.
- **Pronto quando:** build, lint e testes verdes.
- **Commit:** `feat(frontend): editar limite mensal no modal de categoria`

### [x] O5 — Orçamentos no Painel e em Categorias
- **Arquivos:** `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/CategoriasPage.tsx` e testes.
- **Teste primeiro:** Painel mostra a seção "Orçamentos de novembro" depois do Resumo, com uma barra por categoria; sem limites → mensagem com link para Categorias; Categorias mostra a barra só nos cartões com limite.
- **Pronto quando:** build, lint e testes verdes; push.
- **Commit:** `feat(frontend): mostrar orçamentos no painel e nas categorias`

## Funcionalidade 2 — Dicas do Papo (spec 17.2, ADR-022)

### [x] D1 — Regras de dicas e endpoint
- **Arquivos:** `backend/financas/dicas.py`, `backend/financas/views.py`, `backend/financas/urls.py`, `backend/financas/tests/test_dicas.py`.
- **Teste primeiro:** cada regra isolada com os limites exatos (estourado e maior excesso; vermelho; 80% e 100% em "perto"; crescimento 19,99% × 20% e R$ 49,99 × R$ 50,00; concentração 40% × 40,01%; despesas caíram); regras 4 e 6 ignoradas sem despesas no mês anterior; virada de ano (janeiro compara com dezembro); primeiros passos (sem categorias; sem transações no mês) substituem as demais; ordenação por prioridade; máximo de 3; formato BRL e mês por extenso; tom (sem "demais"/"exagerou"); isolamento; `mes` inválido → 400; sem login → 401.
- **Pronto quando:** testes verdes.
- **Commit:** `feat(api): adicionar dicas do Papo por regras`

### [x] D2 — Balão de dicas no Painel
- **Arquivos:** `frontend/src/api/*`, `frontend/src/hooks/useDicas.ts`, `frontend/src/components/painel/DicasDoPapo.tsx` e teste, `frontend/src/pages/DashboardPage.tsx` e teste.
- **Teste primeiro:** região "Dicas do Papo" com o texto da primeira dica; "Próxima dica (1/3)" avança e volta para a primeira depois da última; pose por tipo (alerta → preocupado, parabéns → joinha, info → espiando); "Ver transações" com o link; sem dicas e com erro → nada aparece e o painel continua; imagem com `alt=""`; no estado vazio, dica de primeiros passos sem imagem extra (máximo de 2 personagens).
- **Pronto quando:** build, lint e testes verdes; push.
- **Commit:** `feat(frontend): mostrar dicas do Papo no painel`

## Funcionalidade 3 — Forma de pagamento (spec 17.3, ADR-023)

### [ ] F1 — Campo, filtro e resumo por forma
- **Arquivos:** `backend/financas/models.py`, migration `0004_transacao_forma_pagamento.py`, `serializers.py`, `filters.py`, `views.py`, `backend/financas/tests/test_forma_pagamento.py`.
- **Teste primeiro:** padrão `NAO_INFORMADO` na criação; valor inválido → 400; rótulo na resposta; filtro `forma_pagamento` (inválido → 400); migration preenche os registros existentes (teste com `MigrationExecutor`); `despesas_por_forma` com totais, percentuais e precisão decimal, sem receitas, ordem decrescente com não informado por último; isolamento.
- **Pronto quando:** testes verdes; migration reversível.
- **Commit:** `feat(api): adicionar forma de pagamento às transações`

### [ ] F2 — Forma de pagamento na interface
- **Arquivos:** `frontend/src/lib/formasPagamento.ts`, `TransacaoModal.tsx`, `TransacoesPage.tsx`, `components/painel/FormasPagamento.tsx`, `DashboardPage.tsx` e testes.
- **Teste primeiro:** select "Forma de pagamento" no modal (rótulo "Forma de recebimento" para receita) enviando o valor; coluna "Forma" com rótulo na tabela; filtro por forma envia `forma_pagamento`; seção "Como você pagou" com rótulo, valor e percentual e não informado por último.
- **Pronto quando:** build, lint e testes verdes; push.
- **Commit:** `feat(frontend): registrar e exibir forma de pagamento`

## Funcionalidade 4 — Repetir transações fixas (spec 17.4, ADR-024)

### [ ] R1 — Campos `fixa` e `repetida_de` e endpoints de repetição
- **Arquivos:** `backend/financas/models.py`, migration `0005_transacao_fixa_repetida_de.py`, `serializers.py`, `views.py`, `backend/financas/tests/test_fixas.py`.
- **Teste primeiro:** CRUD aceita `fixa`, `repetida_de` é somente leitura; lista de fixas para repetir (só do mês anterior, só fixas, some depois de repetir, data sugerida); cópia de todos os campos; 31/01 → 28/02 e 29/02 (bissexto); idempotência; ids de outro usuário, não fixos e fora do mês anterior → 400 sem criar nada; `ids` vazio → 400; virada de ano; excluir a original não apaga a cópia.
- **Pronto quando:** testes verdes; migration reversível.
- **Commit:** `feat(api): repetir transações fixas do mês anterior`

### [ ] R2 — Repetir fixas na interface
- **Arquivos:** `frontend/src/api/*`, `hooks/useTransacoes.ts`, `TransacaoModal.tsx`, `components/RepetirFixasDialog.tsx` e teste, `TransacoesPage.tsx` e teste.
- **Teste primeiro:** checkbox "Repete todo mês (fixa)" envia `fixa`; botão "Repetir fixas de outubro"; diálogo lista todas marcadas; desmarcar muda "Lançar N transações"; lançar envia os ids e chama o aviso de sucesso; lista vazia mostra a mensagem.
- **Pronto quando:** build, lint e testes verdes; push.
- **Commit:** `feat(frontend): repetir transações fixas pela tela de transações`

## Fase 7 — Seed de demonstração (spec 17.5, ADR-025)

### [ ] S1 — Seed com limites, formas e fixas
- **Arquivos:** `backend/financas/demo.py`, `backend/financas/tests/test_seed_demo.py`.
- **Teste primeiro:** 3 categorias com limite, uma em cada situação no mês atual; Transporte cresce ≥ 20% e ≥ R$ 50; formas variadas com algumas não informadas; fixas em todos os meses encadeadas; ao menos 2 dicas e ao menos 2 fixas para repetir no mês atual; modo vazio continua vazio; testes antigos do seed continuam verdes.
- **Pronto quando:** testes verdes; `seed_demo --reset` roda no banco local.
- **Commit:** `feat(seed): demonstrar orçamento, dicas, formas de pagamento e fixas`

## Fase 8 — Verificação e documentação

### [ ] V1 — Verificação completa e documentação
- Rodar `pytest`, `npm run build`, `npm run lint` e `npm test` e registrar a saída.
- Roteiro manual no navegador com as duas demonstrações (barras nos 3 estados, dicas alternando, formas de pagamento, repetir fixas duas vezes sem duplicar; no modo vazio, primeiros passos e lista de fixas vazia).
- Diagramas (`docs/diagramas/`): classes (`limite_mensal`, `fixa`, `forma_pagamento`, `repetida_de` 0..1 — 0..*, enumeração `FormaPagamento`, notas das restrições) e atividades (página "Repetir transações fixas"); validar o XML.
- README (funcionalidades, Node 22) e `docs/ia/registro-uso-ia.md` (nova linha, revisão humana `pendente`).
- **Commit:** `docs: atualizar documentação das novas funcionalidades`; push.
