# Registro de Uso de IA

Este projeto foi desenvolvido com assistência de IA, com autorização da professora. Este documento registra **qual ferramenta e qual skill foi usada em cada etapa, o que ela produziu e o que foi revisado ou alterado por mim**.

## Ferramentas

| Ferramenta | Uso |
|---|---|
| Claude (claude.ai) | Discussão de escopo, stack e rascunho inicial da spec e das decisões |
| Claude Code | Implementação, testes e revisão |
| Superpowers (plugin de skills do Claude Code) | Fluxo de trabalho: brainstorming → plano → execução com TDD → revisão |

## Fluxo de skills adotado

| Etapa | Skill | Artefato gerado |
|---|---|---|
| 1. Refinar requisitos e design | `brainstorming` | `docs/superpowers/specs/*-design.md` |
| 2. Quebrar o design em tarefas | `writing-plans` | `docs/superpowers/plans/*.md` |
| 3. Implementar tarefa por tarefa | `executing-plans` / `subagent-driven-development` | Commits de código |
| 4. Testes antes do código | `test-driven-development` | Arquivos de teste |
| 5. Revisão | `requesting-code-review` | Comentários e correções |
| 6. Conferir antes de declarar pronto | `verification-before-completion` | Saída dos testes |

> O plugin Superpowers não estava instalado no ambiente de execução. Cada etapa seguiu o roteiro da skill manualmente (ADR-006); o log abaixo indica a substituição em cada linha.

## Log

| Data | Ferramenta / Skill | Objetivo | Artefato | Commits | Revisão humana |
|---|---|---|---|---|---|
| 17/11/2026 | Claude (claude.ai), sem skill | Definir escopo, stack e decisões; rascunhar spec | `docs/superpowers/specs/2026-11-17-ja-na-caixa-design.md`, `docs/decisoes.md` | `a6f2600` | Escolhi a opção de arquitetura B; rejeitei a sugestão de não ter login; troquei o login fictício pelo botão de demonstração |
| 17/11/2026 | Claude Code; `brainstorming` não instalada, roteiro manual equivalente (ADR-006) | Fase 1: revisar a spec, renomear para JáNaCaixa, resolver questões em aberto | Spec renomeada e revisada (seção 14 com perguntas e respostas), ADR-006 a ADR-010 | `f71765a` | pendente |
| 17/11/2026 | Claude Code; `writing-plans` não instalada, roteiro manual equivalente (ADR-006) | Fase 2: gerar plano de implementação | `docs/superpowers/plans/2026-11-17-ja-na-caixa-plano.md` | `c8eac96` | pendente |
| 17/11/2026 | Claude Code; `executing-plans` + `test-driven-development` não instaladas, roteiro manual equivalente (ADR-006) | Fase 3 (backend): tarefas B1–B10 com TDD | `backend/` (models, API de auth/categorias/transações/resumo, `seed_demo`), 80 testes pytest | `50e7a20`..`937c316` | pendente |
| 17/11/2026 | Claude Code; `requesting-code-review` não instalada, revisão manual (ADR-006) | Revisar o backend | 3 achados: filtro `tipo` inválido em categorias ignorado (corrigido); modelos fora do admin (registrados); contagem de transações após edição (falso positivo, teste de regressão mantido). Smoke test com `runserver` + curl aprovado. Total após a revisão: 85 testes | `2b56569`..`d4130c5` | pendente |
| 17/11/2026 | Claude Code; `executing-plans` + `test-driven-development` não instaladas, roteiro manual equivalente (ADR-006) | Fase 3 (frontend): tarefas F1–F10 e P1 com TDD | `frontend/` (cliente da API, login, layout, categorias, transações, dashboard), ADR-011, 68 testes Vitest | `d42c2de`..`9c6442d`, `0506447` | pendente |
| 17/11/2026 | Claude Code; `requesting-code-review` não instalada, revisão manual (ADR-006) | Revisar o frontend | 2 achados corrigidos: erros de campo sem `aria-describedby`; `/login` não redirecionava usuário logado. Integração real via proxy do Vite (CSRF, login demo, criação de transação) aprovada | `5207cb2`..`16653df` | pendente |
| 17/11/2026 | Claude Code; `verification-before-completion` não instalada, roteiro manual equivalente (ADR-006) | Fase 4: seguir o README em clone limpo, rodar testes/lint/build, `seed_demo` e smoke test; conferir critérios de aceite | README final, critérios de aceite marcados na spec (console do navegador pendente de verificação humana) | ver `git log` (commit `docs: finalizar documentação`) | pendente |
| 18/11/2026 | Claude Code, sem skill (organização de arquivos) | Novo design, Fase 0: organizar o export do Claude Design no repositório | `docs/design/`, `frontend/src/styles/tokens.css`, `frontend/src/assets/`, `docs/ia/prompt-design.md`, ADR-012 (pendência: `referencias/` vazia) | `7ca4cc8` | pendente |
| 18/11/2026 | Claude Code; `brainstorming` não instalada, roteiro manual equivalente (ADR-006) | Novo design, Fase 1: corrigir `decisoes-de-design.md` (poses reais, regras dos coadjuvantes), especificar os dados do novo painel e registrar as decisões visuais | Spec seções 6.3, 6.4, 6.6, 7, 8, 9 e 15; ADR-013 a ADR-016 | `ba0928b` | pendente |
| 18/11/2026 | Claude Code; `writing-plans` não instalada, roteiro manual equivalente (ADR-006) | Novo design, Fase 2: plano com tarefas NB1–NB6, NF1–NF12 e V1 | `docs/superpowers/plans/2026-11-18-novo-design.md` | `2d30209` | pendente |
| 18/11/2026 | Claude Code; `test-driven-development` não instalada, roteiro manual equivalente (ADR-006) | Novo design, Fase 3 (backend): série diária, mês anterior (com virada de ano), quantidade por categoria, resumo anual, totais da listagem, seed de 12 meses | `backend/financas/` (views, filtros, seed), 28 testes novos; total de 113 testes pytest | `48a0e34`..`9cbcce2` | pendente |
| 18/11/2026 | Claude Code; `executing-plans` + `test-driven-development` não instaladas, roteiro manual equivalente (ADR-006) | Novo design, Fase 4 (frontend): tema com tokens, `Personagem`, máscaras e comparação mensal, mês global na URL, login, layout, painel bento com gráficos em SVG, Transações, Categorias, limpeza de código e dependências | `frontend/src/` (componentes `layout/`, `painel/`, `login/`, modais, páginas), ADR-017, 152 testes Vitest | `25dc179`..`695ae38` | pendente |
| 18/11/2026 | Claude Code; `verification-before-completion` não instalada, roteiro manual equivalente (ADR-006) | Novo design, Fase 5: testes, build, lint, fluxo completo pela API, roteiro no navegador em 1440/375 px, correções visuais e documentação | `docs/screenshots/`, diferenças conhecidas no plano, README (créditos), critérios de aceite | `8895362` e commit `docs: atualizar documentação após novo design` | pendente |
| 18/11/2026 | Claude Code; `brainstorming` não instalada, roteiro manual equivalente (ADR-006) | Modos de demonstração e Painel em seções, Fase 1: spec (seções 6.1, 7, 8, 9 e 16), ADR-018 e ADR-019, nova iteração em `decisoes-de-design.md` | Spec, `docs/decisoes.md`, `docs/design/decisoes-de-design.md` | `dc32120` | pendente |
| 18/11/2026 | Claude Code; `test-driven-development` não instalada, roteiro manual equivalente (ADR-006) | Fase 2 (backend): `POST /api/auth/demo/` com `modo`, usuários `demo` e `demo-vazio` recriados a cada entrada, `seed_demo --modo` | `backend/financas/demo.py`, `views_auth.py`, testes; total de 127 testes pytest | `ec0723b`..`cc2b77e` | pendente |
| 18/11/2026 | Claude Code; `executing-plans` + `test-driven-development` não instaladas, roteiro manual equivalente (ADR-006) | Fases 3 a 5 (frontend): escolha de demonstração no login, onboarding do modo vazio (2 passos; criar categoria a partir da transação), Painel em seções verticais com eixos rotulados, tooltips e cabeçalho fixo | `LoginForm`, `TransacaoModal`, `CategoriaModal`, `DashboardPage`, componentes `painel/`; 165 testes Vitest | `58633b8`..`d4b51b4` | pendente |
| 18/11/2026 | Claude Code; `verification-before-completion` não instalada, roteiro manual equivalente (ADR-006) | Fase 6: testes, build, lint e teste dos dois modos no navegador (Chromium headless, 1440/375 px), incluindo sair e entrar de novo no modo vazio | Screenshots 13 a 19 em `docs/screenshots/`, README ("Como usar a demonstração"), `docs/ia/prompt-demo-painel.md` | commit `docs: atualizar documentação dos modos de demonstração e do painel` | pendente |
| 18/11/2026 | Claude Code, sem skill | Abrir o app no celular pela rede local, sem configurar IP: proxy do Vite reescreve `Host` e `Origin`; scripts `npm run celular` (build + preview com `--host`) e `npm run dev:rede` | Spec seção 3, ADR-020, README ("Abrir no celular"), `frontend/vite.config.ts`, `frontend/package.json`. Verificado pelo IP da rede com o Django na configuração padrão (login, painel e POST com CSRF) | `2f237a4` e commit `feat(frontend): abrir o app no celular pela rede local` | pendente |
| 19/11/2026 | Claude Code, sem skill (diagramas gerados por script fora do repositório) | Diagramas UML para a apresentação, desenhados a partir do código (models, serializers, views, urls, `seed_demo` e páginas do frontend) | `docs/diagramas/diagrama-de-classes.drawio` (domínio e camadas do backend), `docs/diagramas/diagrama-de-atividades.drawio` (entrar, registrar transação, excluir categoria), `docs/diagramas/README.md`; sem exportação PNG/SVG (CLI do draw.io não instalado) | commit `docs(diagramas): adicionar diagramas de classes e de atividades` | pendente |
| 19/11/2026 | Claude Code; `brainstorming` e `writing-plans` não instaladas, roteiro manual equivalente (ADR-006) | Fases 1 e 2 das novas funcionalidades: spec (seção 17), ADR-021 a ADR-027, decisões de design e plano | `docs/superpowers/specs/2026-11-17-ja-na-caixa-design.md`, `docs/decisoes.md`, `docs/design/decisoes-de-design.md`, `docs/superpowers/plans/2026-11-19-novas-funcionalidades.md` | `6025002`, `43b5537` | pendente |
| 19/11/2026 | Claude Code; `test-driven-development` não instalada, roteiro manual equivalente (ADR-006) | Fase 3: orçamento por categoria (`limite_mensal`, `GET /api/orcamentos/`, barra no Painel e em Categorias) | Migration `0003`, `orcamentos.py`, `BarraOrcamento`, `OrcamentosDoMes`, testes | `8908d90` a `dfcd4a2` | pendente |
| 19/11/2026 | Claude Code; `test-driven-development` não instalada, roteiro manual equivalente (ADR-006) | Fase 4: dicas do Papo por regras fixas (`GET /api/dicas/`), balão no Painel (desktop, celular e estado vazio) | `dicas.py`, `DicasDoPapo`, testes | `aa697c5` a `7f1e8e9` | pendente |
| 19/11/2026 | Claude Code; `test-driven-development` não instalada, roteiro manual equivalente (ADR-006) | Fase 5: forma de pagamento (campo, filtro, `despesas_por_forma`, coluna e filtro em Transações, seção "Como você pagou") | Migration `0004`, `formasPagamento.ts`, `FormasPagamento`, testes | `c732202` a `e100eba` | pendente |
| 19/11/2026 | Claude Code; `test-driven-development` não instalada, roteiro manual equivalente (ADR-006) | Fase 6: repetir transações fixas (`fixa`, `repetida_de`, endpoints `fixas-para-repetir/` e `repetir-fixas/`, diálogo em Transações) | Migration `0005`, `RepetirFixasDialog`, testes | `06cb676` a `1619ef8` | pendente |
| 19/11/2026 | Claude Code, sem skill | Fase 7: seed de demonstração com limites nos 3 estados, formas variadas, fixas encadeadas e 2 fixas sem repetir no mês atual | `backend/financas/demo.py`, `test_seed_demo.py` | `f29540f` | pendente |
| 19/11/2026 | Claude Code; `verification-before-completion` não instalada, roteiro manual equivalente (ADR-006) | Fase 8: pytest, build, lint e testes; roteiro no navegador (Chromium headless) com as duas demonstrações; diagramas (classes e nova página de atividades); README | `docs/diagramas/*.drawio`, `docs/diagramas/README.md`, `README.md` | commit `docs: atualizar documentação das novas funcionalidades` | pendente |

## Observação de transparência

O rascunho inicial da spec foi produzido em conversa no claude.ai, **sem** a skill `brainstorming`. No Claude Code, o plugin Superpowers também não estava instalado: a revisão da spec (Fase 1), o plano (Fase 2), a implementação com TDD e as revisões (Fase 3) e a verificação final (Fase 4) seguiram o roteiro das skills manualmente, como registrado no ADR-006 e em cada linha do log acima.

Todos os commits foram feitos com a identidade do autor configurada no git; o uso de IA está documentado aqui e não nos metadados dos commits. A coluna "Revisão humana" das linhas do Claude Code fica `pendente` até o autor revisar o código e preenchê-la com o que revisou de fato.

Nota sobre o histórico do novo design: o commit `0fcd706` (`docs(spec): registrar a saída do Recharts e do sonner`) levou junto, por engano, a exclusão de cinco componentes antigos que já estavam preparados para o commit seguinte. O build e os testes continuavam passando nesse ponto (os arquivos não eram mais importados). O commit não foi desfeito porque o `CLAUDE.md` exige confirmação do autor para desfazer commits.

Nota sobre o histórico dos modos de demonstração: o commit `58633b8` foi feito com um teste de foco falhando na suíte completa (passava isolado; dependia de `requestAnimationFrame`). Foi corrigido no commit seguinte, `5022776`, e a suíte foi rodada três vezes antes de continuar. O commit não foi desfeito porque o `CLAUDE.md` exige confirmação do autor para desfazer commits.

