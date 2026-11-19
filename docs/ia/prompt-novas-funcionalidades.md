Leia o `CLAUDE.md` e siga todas as regras (git sem coautoria, documentação antes do código, autonomia). Trabalhe fase por fase, com commits a cada etapa, sem pedir aprovação entre fases.

Tarefa: adicionar quatro funcionalidades ao JáNaCaixa, **nesta ordem**:
1. **Orçamento por categoria**
2. **Dicas do Papo** (usa o orçamento)
3. **Forma de pagamento**
4. **Repetir transações fixas**

**Regras de corte:**
- Só comece uma funcionalidade depois que a anterior estiver completa (backend + frontend) com toda a suíte passando, commitada e enviada.
- Nenhuma funcionalidade existente pode quebrar.
- Se uma funcionalidade não ficar estável, reverta os commits dela, registre o motivo em `docs/decisoes.md` e encerre. As anteriores ficam.

---

## Fase 1 — Documentação (antes de qualquer código)

### 1.1 Spec (`docs/superpowers/specs/`)
Acrescente uma seção para cada funcionalidade, com o conteúdo das fases abaixo (modelo, regras, API, telas e testes).

### 1.2 ADRs (`docs/decisoes.md`)
- **Orçamento como campo da Categoria:** `limite_mensal` em `Categoria`, em vez de tabela própria. Motivo: prazo e simplicidade. Limitação aceita: o limite não tem histórico, e alterá-lo muda a visão dos meses anteriores. Evolução futura: tabela `Orcamento(categoria, mes, valor)`.
- **Dicas por regras:** regras determinísticas no backend, **sem uso de IA/modelo de linguagem**; limiares mínimos; tom informativo, nunca de julgamento; no máximo 3 dicas, uma por vez.
- **Forma de pagamento como enumeração:** campo com escolhas fixas na `Transacao`, padrão `NAO_INFORMADO` para os dados existentes.
- **Repetir transações fixas:** campo `fixa` na `Transacao` e autorrelacionamento `repetida_de` (FK para a própria `Transacao`, `on_delete=SET_NULL`), que garante idempotência: repetir duas vezes não duplica.
- **Funcionalidades avaliadas e descartadas:** simulador de compra parcelada (não usa os dados do usuário, foge do propósito do app) e previsão de saldo (a projeção ingênua trataria receitas pontuais, como o salário, como diárias).

### 1.3 Design (`docs/design/decisoes-de-design.md`)
- Seção 6 (personagens): registrar a **exceção** — o balão de dica do Papo é informação real (texto acessível, não `aria-hidden`); o Papo continua decorativo em todo o resto.
- Orçamento: barras de progresso com estado também em texto (nunca só cor).
- Nova seção do painel "Formas de pagamento" e o botão "Repetir fixas" em Transações.

Commit: `docs(spec): especificar orçamento, dicas, forma de pagamento e transações fixas`.

## Fase 2 — Plano (skill: `writing-plans`)
Gere `docs/superpowers/plans/2026-11-19-novas-funcionalidades.md` com tarefas pequenas, cada uma com teste, critério de pronto e mensagem de commit. Commit: `docs(plano): adicionar plano das novas funcionalidades`.

---

## Fase 3 — Orçamento por categoria (TDD)

### Modelo
- `Categoria.limite_mensal`: `DecimalField(12, 2, null=True, blank=True)`.
- Restrições: se preenchido, deve ser > 0; só categorias `DESPESA` podem ter limite. Categoria `RECEITA` com limite → 400. Ao mudar uma categoria sem transações de `DESPESA` para `RECEITA`, o limite precisa ser removido no mesmo request; caso contrário, 400 com mensagem clara.
- Migration reversível.

### API
- O CRUD de categorias passa a aceitar `limite_mensal`.
- `GET /api/orcamentos/?mes=AAAA-MM` → categorias de despesa com limite: `[{categoria_id, nome, cor, limite, gasto, percentual, situacao}]`, com `situacao`: `ok` (< 80%), `atencao` (80% a 100%) ou `estourado` (> 100%). Valores como string decimal; isolamento por usuário.

### Frontend
- Modal de categoria: campo "Limite mensal (opcional)", visível só para despesas.
- Painel: nova seção "Orçamentos de [mês]", depois de "Resumo do mês", com uma barra por categoria: "R$ 340,00 de R$ 500,00 (68%)", e o estado também em texto ("Dentro do limite" / "Atenção" / "Limite ultrapassado em R$ X"). Sem categorias com limite → mensagem curta com link para Categorias.
- Tela Categorias: a mesma barra no cartão da categoria que tiver limite.

### Testes
Limite em receita → 400; limite ≤ 0 → 400; troca de tipo com limite; os limites exatos de situação (79,99% / 80% / 100% / 100,01%); mês sem gastos; isolamento; formatação e exibição das barras.

Commit e push ao fim.

---

## Fase 4 — Dicas do Papo (TDD)

### Endpoint
`GET /api/dicas/?mes=AAAA-MM` (exige login) → lista ordenada por prioridade, no máximo 3:
```json
[{"id": "orcamento_estourado", "tipo": "alerta", "texto": "Lazer passou do limite em R$ 82,50.", "link": "/transacoes?categoria=5&mes=2026-11"}]
```
`tipo`: `alerta` | `info` | `parabens` | `primeiros_passos`.

### Regras, em ordem de prioridade
1. **Orçamento estourado** (`alerta`): categoria acima de 100% do limite → "X passou do limite em R$ Y." (se houver várias, a de maior excesso)
2. **Mês no vermelho** (`alerta`): despesas > receitas no mês → "O mês está no vermelho até agora: as despesas passaram as receitas em R$ X."
3. **Orçamento perto do limite** (`info`): categoria entre 80% e 100% → "X já usou Y% do limite de [mês]."
4. **Categoria que mais cresceu** (`info`): maior aumento em relação ao mês anterior, somente se for de **pelo menos 20% e pelo menos R$ 50,00**.
5. **Concentração** (`info`): uma categoria com mais de 40% das despesas do mês.
6. **Despesas caíram** (`parabens`): total de despesas menor que no mês anterior → "Suas despesas caíram R$ X em relação a [mês anterior]. Boa!"
7. **Primeiros passos** (`primeiros_passos`), só sem dados: sem categorias → "Crie sua primeira categoria para começar."; sem transações no mês → "Lance sua primeira transação de [mês]."

Detalhes: as regras 4 e 6 são ignoradas se o mês anterior não tiver despesas; a virada de ano funciona (janeiro → dezembro anterior); valores em BRL e meses por extenso; tom informativo (nunca "demais", "exagerou"); isolamento por usuário.

### Frontend
- **Painel, desktop:** balão de fala ligado ao Papo que espia no cartão Saldo, sem cobrir números. **Mobile:** cartão de largura total abaixo de "Resumo do mês", com o Papo pequeno à esquerda.
- Pose por tipo: `alerta` → `papo-preocupado`; `parabens` → `papo-joinha`; `info`/`primeiros_passos` → `papo-espiando`.
- Uma dica por vez, com o botão "Próxima dica (1/3)", que volta para a primeira depois da última. Botão "Ver transações" quando houver `link`.
- O texto do balão é conteúdo real, dentro de uma região rotulada "Dicas do Papo"; a imagem continua com `alt=""`.
- Sem dicas ou erro na requisição → o balão não aparece e o painel funciona normalmente.

### Testes
Cada regra isolada com os limites exatos (19,99% vs 20%; R$ 49,99 vs R$ 50,00; 40% vs 40,01%; 80%/100%); ordenação; máximo de 3; virada de ano; mês anterior vazio; isolamento; 401 sem login; frontend: alternância, pose por tipo, ausência sem dicas.

Commit e push ao fim.

---

## Fase 5 — Forma de pagamento (TDD)

### Modelo
- `Transacao.forma_pagamento`: `CharField` com escolhas `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `DINHEIRO`, `BOLETO`, `TRANSFERENCIA`, `NAO_INFORMADO`; padrão `NAO_INFORMADO`. Migration que preenche os registros existentes com o padrão.

### API
- CRUD de transações com o campo; filtro `?forma_pagamento=` na listagem.
- `GET /api/resumo/` (ou o endpoint de resumo atual) passa a incluir `despesas_por_forma`: `[{forma, rotulo, total, percentual}]`.

### Frontend
- Modal de transação: select "Forma de pagamento" (rótulo "Forma de recebimento" quando a categoria for de receita).
- Tabela de transações: coluna com ícone + rótulo; filtro por forma.
- Painel: seção "Como você pagou", com barras horizontais por forma (rótulo, valor, percentual), depois de "Para onde foi o dinheiro". `NAO_INFORMADO` aparece por último, como "Não informado".

### Testes
Valor inválido → 400; padrão aplicado na migration; filtro; totais por forma com precisão decimal; isolamento.

Commit e push ao fim.

---

## Fase 6 — Repetir transações fixas (TDD)

### Modelo
- `Transacao.fixa`: `BooleanField(default=False)`.
- `Transacao.repetida_de`: `ForeignKey("self", null=True, blank=True, on_delete=SET_NULL, related_name="repeticoes")`.

### API
- `GET /api/transacoes/fixas-para-repetir/?mes=AAAA-MM` → transações fixas do mês anterior que ainda **não** foram repetidas no mês informado, cada uma com a data sugerida.
- `POST /api/transacoes/repetir-fixas/` com `{"mes": "AAAA-MM", "ids": [..]}` → cria as cópias no mês informado, com `repetida_de` apontando para a original e `fixa=True`. Retorna as criadas.
- Regras:
  - Data da cópia: mesmo dia do mês; se o dia não existir no mês de destino, usa o último dia (31/01 → 28/02 ou 29/02).
  - **Idempotência:** se já existir no mês de destino uma transação com `repetida_de` = original, ela é ignorada (não duplica).
  - Só os ids do próprio usuário, só fixas do mês anterior; os demais → 400.
  - Copia descrição, valor, categoria, forma de pagamento e observação.

### Frontend
- Modal de transação: checkbox "Repete todo mês (fixa)".
- Tela Transações: botão "Repetir fixas de [mês anterior]" → modal com a lista (descrição, categoria, valor, data sugerida), todas marcadas, com a possibilidade de desmarcar → "Lançar N transações". Lista vazia → "Nenhuma transação fixa de [mês anterior] para repetir."
- Toast de sucesso com `papo-joinha`.

### Testes
Cópia correta de todos os campos; ajuste de fim de mês (31/01 → fevereiro, ano bissexto); idempotência (repetir duas vezes); ids de outro usuário → 400; não fixas → 400; virada de ano (dezembro → janeiro); exclusão da original não apaga a cópia (`SET_NULL`).

Commit e push ao fim.

---

## Fase 7 — Seed de demonstração
Ajuste o `seed_demo` (modo exemplo) para demonstrar tudo no **mês atual**:
- Limites em 3 categorias de despesa: uma em ~60%, uma em ~85% e uma estourada.
- Uma categoria com aumento ≥ 20% e ≥ R$ 50 em relação ao mês anterior.
- Formas de pagamento variadas, incluindo algumas `NAO_INFORMADO`.
- Transações fixas (ex.: salário, aluguel, internet, streaming) nos meses anteriores; no mês atual, lance salário e aluguel já repetidos e **deixe 2 fixas sem repetir**, para o botão "Repetir fixas" ter o que mostrar.
- Teste: o seed gera pelo menos 2 dicas no mês atual e pelo menos 2 fixas disponíveis para repetir.

O modo vazio continua vazio.

---

## Fase 8 — Verificação e documentação (skill: `verification-before-completion`)
1. `pytest`, `npm run build`, `npm run lint` e `npm test` passando; cole a saída.
2. Teste manual com a demonstração "com dados": barras de orçamento nos 3 estados, pelo menos 2 dicas alternando, seção de formas de pagamento, repetir fixas (e repetir de novo sem duplicar). Com a demonstração "vazia": dicas de primeiros passos e o botão de repetir com a lista vazia.
3. Diagramas (se existirem em `docs/diagramas/`):
   - Classes: `limite_mensal` em Categoria; `fixa`, `forma_pagamento` e o autorrelacionamento `repetida_de` (0..1 — 0..*) em Transacao; nova enumeração `FormaPagamento`; notas das novas restrições.
   - Atividades: nova página "Repetir transações fixas" (mesma notação e raias).
   - Valide o XML.
4. README (funcionalidades) e `docs/ia/registro-uso-ia.md` (nova linha, Revisão humana = `pendente`).
5. Commit: `docs: atualizar documentação das novas funcionalidades`. Push.

## Ao terminar
Responda com: funcionalidades entregues (e alguma revertida, com o motivo), migrations criadas, divergências em relação a este prompt e o resultado final dos testes.
