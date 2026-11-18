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
