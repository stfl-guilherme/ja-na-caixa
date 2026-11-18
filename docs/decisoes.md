# Registro de Decisões de Arquitetura (ADR)

Cada decisão registra o contexto, a escolha, as alternativas descartadas e as consequências. Decisões novas entram no final; decisões revogadas não são apagadas, recebem o status **Substituída**.

---

## ADR-001 — Frontend separado (React + TypeScript) consumindo API Django

- **Status:** Aceita — 17/11/2026
- **Contexto:** O projeto será apresentado em aula e depois publicado no portfólio do autor. O autor domina Django, mas quer usar componentes do 21st.dev, que são React + Tailwind.
- **Decisão:** Backend Django + DRF expondo API REST; frontend SPA em React + TypeScript + Vite.
- **Alternativas descartadas:**
  - *Templates do Django + TypeScript pontual:* metade do trabalho e menos risco, mas os componentes do 21st.dev precisariam ser reescritos sem React, perdendo os que têm animação ou estado.
- **Consequências:** Cerca do dobro de trabalho (API + front). Exige ponto de controle no cronograma e uma ordem de corte definida (ver spec, seção 11).

## ADR-002 — Autenticação por sessão do Django com proxy do Vite

- **Status:** Aceita — 17/11/2026
- **Contexto:** A SPA e a API rodam em portas diferentes em desenvolvimento.
- **Decisão:** Sessão do Django + CSRF. O Vite faz proxy de `/api` para o Django, então o navegador vê uma única origem.
- **Alternativas descartadas:**
  - *JWT:* exige armazenar o token no front (localStorage é vulnerável a XSS) e implementar refresh. É complexidade sem benefício num sistema local.
  - *CORS com cookies entre origens:* configuração frágil (`SameSite`, `credentials`, origens permitidas).
- **Consequências:** O front precisa buscar `/api/auth/csrf/` antes do primeiro POST e enviar o header `X-CSRFToken`.

## ADR-003 — Login real com botão "Entrar como demonstração"

- **Status:** Aceita — 17/11/2026
- **Contexto:** O autor queria uma tela de login apenas visual, para agilizar a demonstração.
- **Decisão:** O login é real. Um botão autentica, pelo backend, no usuário `demo` com dados de exemplo.
- **Alternativas descartadas:**
  - *Login fictício (botão que só navega):* seria uma funcionalidade de mentira. Na avaliação e no portfólio isso é visto como defeito.
  - *Sem login:* mais simples, mas perde a demonstração de isolamento de dados entre usuários.
- **Consequências:** Endpoint `/api/auth/demo/` controlado pela setting `DEMO_ENABLED`; comando `seed_demo`.

## ADR-004 — Transação deriva `tipo` e `usuario` da categoria

- **Status:** Aceita — 17/11/2026
- **Contexto:** Guardar `tipo` e `usuario` tanto na categoria quanto na transação permitiria estados inconsistentes, como uma despesa dentro de uma categoria de receita.
- **Decisão:** A transação só referencia a categoria. O dono e o tipo vêm dela.
- **Consequências:**
  - Consultas filtram por `categoria__usuario`.
  - O `tipo` de uma categoria com transações não pode ser alterado (mudaria o histórico).
  - A categoria usa `on_delete=PROTECT` na transação; excluir uma categoria em uso retorna `409`.

## ADR-005 — Dinheiro em `Decimal`, valor sempre positivo

- **Status:** Aceita — 17/11/2026
- **Contexto:** `float` gera erro de arredondamento (`0.1 + 0.2 = 0.30000000000000004`).
- **Decisão:** `DecimalField(max_digits=12, decimal_places=2)` com `CheckConstraint valor > 0`. O sinal vem do tipo da categoria. A API trafega valores como string; o front não faz somas monetárias.
- **Consequências:** Todo total (dashboard, resumo) é calculado no backend.

## ADR-006 — Fluxo do Superpowers executado manualmente

- **Status:** Aceita — 17/11/2026
- **Contexto:** O prompt inicial pede as skills `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `requesting-code-review` e `verification-before-completion`, do plugin Superpowers. O plugin não está instalado no ambiente, e instalá-lo exigiria rede fora dos registries pip/npm.
- **Decisão:** Seguir o mesmo roteiro manualmente: revisão da spec com perguntas e respostas registradas (seção 14 da spec), plano com tarefas pequenas, TDD por tarefa (teste falhando → implementação → suíte completa → commit), revisão de código ao fim de cada camada e verificação com saída real dos comandos.
- **Consequências:** O `registro-uso-ia.md` registra a skill prevista e a substituição feita em cada fase.

## ADR-007 — Componentes no padrão shadcn/ui escritos no projeto

- **Status:** Aceita — 17/11/2026
- **Contexto:** A CLI do shadcn (`npx shadcn add`) baixa os componentes de `ui.shadcn.com`, fora dos registries de pacotes permitidos para execução autônoma.
- **Decisão:** Os componentes (Button, Input, Card, Dialog, Select, Table etc.) são escritos em `frontend/src/components/ui/` seguindo o padrão do shadcn/ui (Tailwind + `class-variance-authority` + primitivos do Radix instalados via npm). Toasts com `sonner`. Nenhum componente do 21st.dev é usado.
- **Alternativas descartadas:** rodar a CLI do shadcn (exige rede fora do npm); biblioteca pronta como MUI (foge da stack definida).
- **Consequências:** Mais código próprio, mas sem dependência de rede externa. A seção "Créditos de componentes" do README registra a inspiração no shadcn/ui (MIT).

## ADR-008 — `401` para requisições sem autenticação

- **Status:** Aceita — 17/11/2026
- **Contexto:** A spec exige `401` sem login. O `SessionAuthentication` do DRF não define `authenticate_header`, então o DRF responde `403`.
- **Decisão:** Classe `SessaoAuthentication` (subclasse de `SessionAuthentication`) que retorna `Session` em `authenticate_header`, fazendo o DRF responder `401`.
- **Consequências:** O front trata `401` como "sem sessão" e redireciona para `/login`. `403` fica reservado para falha de CSRF.

## ADR-009 — Usuário `demo` com senha inutilizável

- **Status:** Aceita — 17/11/2026
- **Contexto:** A spec diz que a senha do `demo` não fica no front e que o backend autentica direto.
- **Decisão:** `seed_demo` cria o `demo` com `set_unusable_password()`. O endpoint `/api/auth/demo/` usa `django.contrib.auth.login()` com o backend padrão. Se o `demo` não existir, responde `503`.
- **Consequências:** Não há senha do `demo` para vazar; ele não entra pelo formulário normal.

## ADR-010 — Somente tema claro

- **Status:** Aceita — 17/11/2026
- **Contexto:** Questão em aberto da spec. O cronograma tem 6 dias e a ordem de corte já prevê cortes.
- **Decisão:** Somente tema claro no MVP.
- **Consequências:** Menos variantes de estilo para testar; pode entrar depois da apresentação.

## ADR-011 — Lint com oxlint, padrão do template do Vite

- **Status:** Aceita — 17/11/2026
- **Contexto:** O plano (F1) previa ESLint. O template atual do `create-vite` (`react-ts`) já vem com `oxlint` configurado em `npm run lint` e com TypeScript 7.
- **Decisão:** Manter o `oxlint` do template, com os plugins `react`, `typescript` e `oxc`. A checagem de tipos continua no `npm run build` (`tsc -b`, `strict: true`).
- **Alternativas descartadas:** substituir por ESLint (mais configuração, sem ganho para o escopo).
- **Consequências:** `npm run lint` roda `oxlint`; a definição de pronto do `CLAUDE.md` continua valendo.

## ADR-012 — Organização do material de design importado

- **Status:** Aceita — 18/11/2026
- **Contexto:** O export do Claude Design chegou em `docs/design-import/` e foi reorganizado em `docs/design/` (especificação), `frontend/src/styles/tokens.css` (tokens vivos) e `frontend/src/assets/` (PNGs dos personagens), conforme `docs/ia/prompt-design.md`.
- **Decisão:** Cada arquivo tem um único lugar; `tokens.css` só existe no frontend, para não haver duas cópias divergentes.
- **Pendências registradas na importação:**
  - `referencias/` (componentes de referência do 21st.dev, `.tsx`) veio **vazia** no export. A seção 5 de `decisoes-de-design.md` e as telas (`Painel.dc.html`, que traz o `squarify()`, as escalas dos gráficos e a contagem animada) descrevem o que foi usado, adaptado e descartado; a implementação segue essas descrições. Quando os arquivos forem adicionados em `docs/design/referencias/`, conferir origem e licença e completar a seção "Créditos de componentes" do README.
  - `decisoes-de-design.md` e `prompt-design-claude-code.md` não estavam dentro de `docs/design-import/`, e sim na pasta acima do repositório. Foram **copiados** (não movidos) para `docs/design/decisoes-de-design.md` e `docs/ia/prompt-design.md`, porque apagar arquivos fora do repositório exige confirmação do autor (`CLAUDE.md`). Os originais podem ser apagados manualmente.
- **Consequências:** `docs/design/README.md` e `decisoes-de-design.md` citam os caminhos novos.
