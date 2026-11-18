# JáNaCaixa — Instruções permanentes para o Claude Code

Leia este arquivo inteiro antes de qualquer ação, em toda sessão.

## Contexto

Trabalho de G2 de Engenharia de Software (AMF). Sistema web local de controle financeiro pessoal.
O tema do trabalho é a IA construir o projeto **de forma autônoma**, seguindo a metodologia de especificar e documentar antes de programar.

- Nome na interface: **JáNaCaixa**. Slug (repo, pastas, pacotes): `ja-na-caixa`.
- Fonte da verdade, nesta ordem: `docs/superpowers/specs/` > `docs/decisoes.md` > `docs/superpowers/plans/`.
- Se o código precisar divergir da spec, **atualize a spec primeiro** (commit `docs` separado) e só depois altere o código.

## Regras de git (inegociáveis)

1. **Nunca** inclua você mesmo como autor, coautor ou colaborador. Nas mensagens de commit, descrições de PR, tags, nomes de branch e arquivos, nunca escreva:
   - `Co-Authored-By:` de qualquer tipo;
   - "Generated with Claude Code" ou variações;
   - menções a Claude, Anthropic ou e-mails `noreply@anthropic.com`.
2. **Não altere** `git config` (nome/e-mail do autor). Os commits saem com a identidade já configurada.
3. Mensagens no padrão Conventional Commits, em português:
   `tipo(escopo): descrição no imperativo`. Tipos: `feat`, `fix`, `test`, `docs`, `refactor`, `style`, `chore`.
   Exemplo: `feat(api): adicionar endpoint de resumo mensal`.
4. Um commit por tarefa do plano. Commits pequenos e frequentes.
5. **Nunca** faça commit com teste falhando ou build quebrado.
6. **Nunca** use `--no-verify`, `push --force`, `rebase` em commits já enviados ou `reset --hard`.
7. **Nunca** commite `db.sqlite3`, `.env`, `node_modules/`, `.venv/` ou arquivos de build.
8. Se existir remote `origin`, faça `git push` ao final de cada fase.

## Autonomia

- Trabalhe sem pedir confirmação. Diante de ambiguidade ou lacuna na documentação: escolha a opção **mais simples coerente com a spec**, registre como novo ADR em `docs/decisoes.md` e continue.
- Em skills interativas (ex.: `brainstorming`), responda às próprias perguntas com base na spec e nos ADRs, e registre as perguntas e respostas no documento gerado.
- **Pare e pergunte apenas se** precisar: apagar arquivos fora do repositório, instalar algo globalmente no sistema, usar rede além dos registries de pacotes (pip/npm), ou desfazer commits.

## Registro de uso de IA

Ao final de cada fase, adicione uma linha em `docs/ia/registro-uso-ia.md` com: data, skill usada, objetivo, artefatos gerados e intervalo de commits.
Na coluna "Revisão humana", escreva **`pendente`**. Nunca invente uma revisão humana que não aconteceu.

## Qualidade (definição de pronto de cada tarefa)

- Backend: `pytest` passando.
- Frontend: `npm run build` (inclui checagem de tipos), `npm run lint` e `npm test` passando.
- Usar a skill `verification-before-completion` antes de declarar uma fase concluída: rode os comandos e cole a saída relevante, não afirme sem rodar.

## Stack e convenções

- Backend: Python 3.12, Django 5, Django REST Framework, SQLite, pytest-django. Projeto `config`, app `financas`.
- Frontend: React + TypeScript (strict) + Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router, Recharts, Vitest + React Testing Library.
- Nomes de domínio em português, como na spec (`Categoria`, `Transacao`). Demais identificadores podem ser em inglês.
- Componentes externos (ex.: 21st.dev): só se instaláveis pela CLI do shadcn; registrar origem e licença na seção "Créditos de componentes" do README.
- Mascote e logo **não** fazem parte do escopo da IA. Deixe um espaço reservado (texto "JáNaCaixa") no cabeçalho e na tela de login.
