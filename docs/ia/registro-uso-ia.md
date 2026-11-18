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

## Observação de transparência

O rascunho inicial da spec foi produzido em conversa no claude.ai, **sem** a skill `brainstorming`. A próxima etapa é rodar a `brainstorming` no Claude Code tendo esse rascunho como entrada, para revisá-lo antes do plano. O resultado dessa revisão substitui o rascunho e é registrado neste log.
