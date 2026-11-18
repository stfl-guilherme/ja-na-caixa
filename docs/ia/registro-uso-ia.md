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

## Observação de transparência

O rascunho inicial da spec foi produzido em conversa no claude.ai, **sem** a skill `brainstorming`. No Claude Code, o plugin Superpowers também não estava instalado: a revisão da spec (Fase 1), o plano (Fase 2), a implementação com TDD e as revisões (Fase 3) e a verificação final (Fase 4) seguiram o roteiro das skills manualmente, como registrado no ADR-006 e em cada linha do log acima.

Todos os commits foram feitos com a identidade do autor configurada no git; o uso de IA está documentado aqui e não nos metadados dos commits. A coluna "Revisão humana" das linhas do Claude Code fica `pendente` até o autor revisar o código e preenchê-la com o que revisou de fato.
