Leia o `CLAUDE.md` e todos os arquivos em `docs/` antes de começar. As regras do `CLAUDE.md` valem durante todo o trabalho, principalmente as de git (nunca se incluir como autor ou coautor).

Sua tarefa é construir o projeto JáNaCaixa do início ao fim, de forma autônoma, fase por fase, commitando a cada etapa. Os documentos podem estar incompletos: quando estiverem, complete-os você mesmo antes de programar, registrando as decisões em `docs/decisoes.md`.

## Fase 1 — Revisão da especificação (skill: `brainstorming`)
1. Revise a spec em `docs/superpowers/specs/` usando a skill `brainstorming`, respondendo você mesmo às perguntas da skill com base na spec e nos ADRs.
2. Renomeie o projeto de "controle-financeiro" / "Controle Financeiro Pessoal" para **JáNaCaixa** (`ja-na-caixa`) em todos os documentos, inclusive no nome do arquivo da spec, e corrija os links do README.
3. Resolva a seção "Questões em aberto", complete lacunas e corrija inconsistências entre spec e ADRs.
4. Commit: `docs(spec): revisar especificação e renomear para JáNaCaixa`.

## Fase 2 — Plano de implementação (skill: `writing-plans`)
1. Gere o plano em `docs/superpowers/plans/` a partir da spec revisada.
2. Tarefas pequenas, cada uma com: arquivos afetados, teste a escrever primeiro, critério de pronto e mensagem de commit prevista.
3. Ordem: backend (scaffold → models → autenticação/demo → categorias → transações → resumo → `seed_demo`) → frontend (scaffold → cliente da API → login → layout e rotas protegidas → categorias → transações → dashboard) → polimento → README final.
4. Commit: `docs(plano): adicionar plano de implementação`.

**Nenhum código de aplicação pode ser commitado antes dos commits das fases 1 e 2.**

## Fase 3 — Implementação (skills: `executing-plans` ou `subagent-driven-development`, com `test-driven-development`)
Para cada tarefa do plano:
1. Escreva o teste e confirme que ele falha.
2. Implemente o mínimo para o teste passar.
3. Rode a suíte completa da camada (backend ou frontend).
4. Commit com a mensagem prevista no plano.
5. Marque a tarefa como concluída no arquivo do plano (no mesmo commit).

Ao terminar o backend e ao terminar o frontend, use `requesting-code-review`, corrija o que for apontado (commits `fix`/`refactor`) e atualize `docs/ia/registro-uso-ia.md`.

## Fase 4 — Finalização (skill: `verification-before-completion`)
1. Siga o README do zero, em um clone limpo do repositório, e corrija os passos que não funcionarem.
2. Rode todos os testes, o build e o lint do front, `seed_demo` e um smoke test da API com o servidor rodando.
3. Confira cada item da seção "Critérios de aceite" da spec. Itens que exigem olho humano (ex.: console do navegador) ficam marcados como "pendente de verificação humana".
4. Atualize o README (funcionalidades, como rodar, testes, créditos) e o registro de uso de IA.
5. Commit: `docs: finalizar documentação`.

## Ao terminar
Responda com: o que foi entregue, o que ficou pendente, a lista de ADRs que você criou e o resultado final dos testes.

Se em algum momento os nomes das skills acima não existirem na instalação, use a skill equivalente e registre a troca no `registro-uso-ia.md`.
