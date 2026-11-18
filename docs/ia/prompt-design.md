Leia o `CLAUDE.md` e siga todas as regras dele, principalmente as de git (nunca se incluir como autor ou coautor) e a de atualizar a documentação antes do código.

Tarefa: organizar o material de design no repositório e implementar o novo design do JáNaCaixa no frontend existente, de forma autônoma, fase por fase, commitando a cada etapa, sem pedir aprovação entre fases.

## Fase 0 — Organizar o material de design

O material exportado está em `docs/design-import/`, com esta estrutura:

```
docs/design-import/
├── assets/mascote/          papo-animado, papo-cadeira-acenando, papo-espiando-lado,
│                            papo-espiando, papo-joinha, papo-preocupado, papo-sentado-moeda (.png)
├── assets/personagens/      caranguejo.png, gaivota.png
├── dados/exemplo.json
├── telas/app/  telas/componentes/  telas/login/
├── tokens/tokens.css  tokens/tokens.json
├── referencias/             componentes de referência do 21st.dev (.tsx)
├── README.md
├── decisoes-de-design.md
└── prompt-design-claude-code.md
```

1. Leia `docs/design-import/README.md` primeiro: ele descreve o export.
2. Reorganize com `git mv` (ou `mv` + `git add`) para:

| Origem (`docs/design-import/…`) | Destino |
|---|---|
| `decisoes-de-design.md` | `docs/design/decisoes-de-design.md` |
| `README.md` | `docs/design/README.md` |
| `telas/` | `docs/design/telas/` |
| `tokens/tokens.json` | `docs/design/tokens.json` |
| `tokens/tokens.css` | `frontend/src/styles/tokens.css` (cópia viva usada pelo app; não duplique em `docs/`) |
| `referencias/` | `docs/design/referencias/` |
| `dados/exemplo.json` | `docs/design/dados-exemplo.json` |
| `assets/mascote/*.png` | `frontend/src/assets/papo/` |
| `assets/personagens/*.png` | `frontend/src/assets/personagens/` |
| `prompt-design-claude-code.md` | `docs/ia/prompt-design.md` |

3. Remova `docs/design-import/` quando estiver vazia.
4. Atualize os caminhos citados dentro de `docs/design/README.md` e de `decisoes-de-design.md` para a nova estrutura.
5. Se faltar algum arquivo listado (ex.: `referencias/`), registre a falta em `docs/decisoes.md` como pendência e continue.
6. Commit: `docs(design): organizar material de design no repositório`.

## Material de referência (após a Fase 0)
- `docs/design/decisoes-de-design.md` — princípios, decisões e regras dos personagens. Fonte da verdade do design.
- `docs/design/telas/` — export do Claude Design (`login/`, `app/`, `componentes/`). Os `.dc.html` são HTML com estilos inline e um runtime próprio (`<x-dc>`, `{{...}}`): leia-os como especificação de layout, cores e espaçamentos; não tente executá-los. Reproduza fielmente em React + Tailwind.
- `frontend/src/styles/tokens.css` e `docs/design/tokens.json` — tokens. Use as variáveis CSS como base do tema do Tailwind; não invente valores.
- `docs/design/referencias/` — componentes de referência do 21st.dev. São REFERÊNCIA: adapte conforme a seção 5 de `decisoes-de-design.md`.
- `docs/design/dados-exemplo.json` — dados usados nas telas. Use para conferir se o `seed_demo` gera um cenário parecido; não substitua o seed sem necessidade.
- `frontend/src/assets/papo/` e `frontend/src/assets/personagens/` — PNGs. Nunca redesenhe os personagens nem gere SVG deles.

## Fase 1 — Documentação (antes de qualquer código)
1. Corrija `decisoes-de-design.md` para refletir os assets finais:
   - Seção 3: acrescente uma iteração dizendo que, além da folha original de 6 poses, foram geradas poses próprias para interface (espiando, espiando de lado, sentado com moeda, cadeira acenando, animado, joinha, preocupado) e dois coadjuvantes no mesmo estilo (caranguejo e gaivota).
   - Seção 6: refaça a tabela "Local × Pose" com os nomes reais dos arquivos, lendo nas telas de `docs/design/telas/` onde cada personagem aparece. Inclua caranguejo e gaivota nas regras (decorativos, bordas, máximo de 2 personagens por tela).
2. Atualize a spec em `docs/superpowers/specs/` com o que o novo painel exige do backend e ainda não existe:
   - série diária do mês (receitas, despesas e saldo acumulado por dia);
   - totais do mês anterior, para a comparação nos cartões;
   - resumo anual (receitas e despesas de cada um dos 12 meses).
   Defina os endpoints (ex.: ampliar `GET /api/resumo/` e criar `GET /api/resumo/anual/?ano=AAAA`), mantendo as convenções da spec: valores como string decimal, totais calculados só no backend, isolamento por usuário.
3. Adicione ADRs em `docs/decisoes.md`: um de direção visual (resumindo `decisoes-de-design.md`) e um de adaptação dos componentes de referência (o que foi usado, adaptado e descartado, e por quê).
4. Commit: `docs(spec): especificar dados do novo painel e decisões visuais`.

## Fase 2 — Plano (skill: `writing-plans`)
Gere `docs/superpowers/plans/2026-11-18-novo-design.md` com tarefas pequenas, cada uma com teste, critério de pronto e mensagem de commit. Commit: `docs(plano): adicionar plano do novo design`.

## Fase 3 — Backend (skill: `test-driven-development`)
Implemente os endpoints da Fase 1 com teste primeiro. Obrigatório testar: isolamento por usuário, precisão decimal, mês sem transações, virada de ano no "mês anterior" (janeiro → dezembro do ano anterior). Um commit por tarefa.

## Fase 4 — Frontend (skills: `executing-plans` / `subagent-driven-development` + `test-driven-development`)
Ordem:
1. **Tema:** importar `tokens.css`, mapear as variáveis no tema do Tailwind, fontes, fundo areia das telas internas.
2. **Componente `Personagem`:** recebe o personagem/pose e o tamanho, renderiza o PNG com `alt=""` e `aria-hidden="true"`. Variante "espiando" (posicionada atrás da borda de um cartão). Teste: no Painel, troca para `papo-preocupado` quando o saldo é negativo.
3. **Login:** desktop e mobile, estados padrão/carregando/erro, conforme `docs/design/telas/login/`. Mobile sem cartão, areia contínua ao rolar.
4. **Layout base:** menu lateral / barra inferior, seletor de mês global, ação "+ Nova transação".
5. **Painel:** cartões de métrica, saldo acumulado, entradas × saídas espelhado, treemap, ano em resumo, últimas transações, estado vazio, estado de saldo negativo.
6. **Transações** e **Categorias:** telas, modais, diálogos, toasts e estados vazios/carregando.

Regras de implementação:
- Formatação monetária sempre BRL com 2 casas (`Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`); nunca arredondar centavos; nunca somar dinheiro no front.
- Em Despesas, aumento = vermelho, queda = verde. Teste essa regra.
- Animações só de entrada, nada em loop; respeitar `prefers-reduced-motion`.
- Não adicionar `framer-motion`. Gráficos em SVG próprio (como nas referências) ou Recharts, que já está no projeto.
- Personagens: siga a seção 6 de `decisoes-de-design.md` à risca (bordas, máx. 72px, máx. 2 por tela, nunca sobre dados).
- Acessibilidade: contraste AA, foco visível, alvos ≥ 44px, `aria-label` nos gráficos.
- Nenhuma funcionalidade existente pode quebrar: a suíte de testes atual continua passando.
- Registre na seção "Créditos de componentes" do README a origem e a licença dos componentes de referência.

## Fase 5 — Verificação (skill: `verification-before-completion`)
1. `pytest`, `npm run build`, `npm run lint`, `npm test` passando; cole a saída.
2. Rode `seed_demo`, suba back e front e confira os fluxos: login demo → painel → criar transação → editar → excluir → criar categoria → tentar excluir categoria em uso.
3. Se possível, tire screenshots (desktop 1440px e mobile 375px) de cada tela e compare com o que está descrito em `docs/design/telas/`; liste as diferenças que restarem.
4. Atualize `docs/ia/registro-uso-ia.md` (coluna "Revisão humana" = `pendente`) e o README.
5. Commit: `docs: atualizar documentação após novo design`. Faça push.

## Ao terminar
Responda com: telas entregues, diferenças conhecidas em relação ao design, endpoints criados e o resultado final dos testes.