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

## ADR-013 — Direção visual do novo design

- **Status:** Aceita — 18/11/2026
- **Contexto:** O autor definiu o visual do JáNaCaixa no Claude Design e num gerador de imagens. O processo e as regras estão em `docs/design/decisoes-de-design.md`, que passa a ser a fonte da verdade do design. O `CLAUDE.md` diz que mascote e logo não são escopo da IA.
- **Decisão (resumo de `decisoes-de-design.md`):**
  - *Ilustração cartunesca, dados sóbrios.* Personagem e cenário são cartoon; números, tabelas, gráficos e formulários são limpos. O traço forte (contorno escuro) é exclusivo do mascote; na interface, o único elemento com traço cartunesco é o botão "Entrar como demonstração".
  - *A praia é a vitrine.* A cena de praia existe só no login. As telas internas usam fundo areia clara (`#FBF6EC`), cartões brancos com raio de 20px e sombra suave.
  - *O personagem decora, não informa.* O Papo (jacaré-de-papo-amarelo) e os coadjuvantes (caranguejo e gaivota) são PNGs fornecidos pelo autor, sempre com `alt=""` e `aria-hidden="true"`, nas bordas, com no máximo 72px visíveis e no máximo 2 personagens por tela. A única exceção informativa (Papo preocupado com saldo negativo) repete uma informação que já está no texto.
  - *Acessibilidade como requisito.* WCAG AA, foco visível, alvos ≥ 44px, cor nunca como único sinal (sinal + seta + texto).
  - Tokens (cores, tipografia, raios, sombras, espaços) em `frontend/src/styles/tokens.css`, mapeados no tema do Tailwind; nenhum valor inventado.
- **Escopo da IA:** a IA **não desenha** mascote nem logo. Os PNGs entram como assets e o logotipo é o texto "JáNaCaixa" em Baloo 2, como no design. Isso mantém a regra do `CLAUDE.md`, que tratava do *desenho* do mascote e do logo.
- **Alternativas descartadas:** manter o visual neutro do shadcn (sem identidade); usar a ilustração também nas telas internas (polui os dados).
- **Consequências:** o tema do Tailwind troca as cores neutras do shadcn pelos tokens do design; os testes de interface passam a cobrir as regras do personagem e de cor.

## ADR-014 — Adaptação dos componentes de referência do 21st.dev

- **Status:** Aceita — 18/11/2026
- **Contexto:** A seção 5 de `decisoes-de-design.md` lista componentes do 21st.dev avaliados como referência visual para o Painel. Os arquivos `.tsx` não vieram no export (`docs/design/referencias/` vazia, ADR-012) e o ADR-007 proíbe rodar a CLI do shadcn. O prompt do design proíbe `framer-motion`.
- **Decisão:** os componentes de referência **não são instalados nem copiados**. Os gráficos e cartões são escritos no projeto, em React + SVG, a partir do comportamento descrito nas telas (`Painel.dc.html`) e na seção 5:

  | Referência | Uso no JáNaCaixa | Motivo |
  |---|---|---|
  | Linha de receita (Analytics Bento) | **Adaptado:** linha do saldo acumulado por dia, com área suave, tooltip por mouse e teclado | É o gráfico mais útil para quem controla o mês |
  | Ondas espelhadas desktop × mobile | **Adaptado:** barras de receitas acima e despesas abaixo do eixo, por dia; sem animação contínua | Animação em loop faz dado financeiro parecer instável |
  | Treemap por categoria | **Adaptado:** despesas por categoria com a cor da categoria e cor do texto escolhida por contraste (`squarify` + `textoSobre`) | Lê melhor que pizza com muitas categorias |
  | Radar de sazonalidade | **Descartado**, substituído por barras dos 12 meses | Suaviza a forma (ajuste de Fourier): o desenho não representa os valores reais |
  | Contagem animada dos números | **Adaptado:** formatação BRL com 2 casas, termina exatamente no valor da API, desligada com `prefers-reduced-motion` | O original arredondava para inteiro |
  | Cartão de métrica (DashboardMetricCard) | **Adaptado:** semântica invertida em Despesas (subir = vermelho), texto explicativo, cartão clicável | No original, subir era sempre verde |
  | Hover "levantar" + cursor de clique | **Mantido** só nos cartões de métrica, que são clicáveis | Evitar affordance falsa |
  | framer-motion | **Não adotado** | Dependência inteira para efeitos resolvíveis em CSS e `requestAnimationFrame` |

- **Alternativas descartadas:** Recharts para todos os gráficos (não tem treemap com contraste automático nem barras espelhadas sem customização pesada; continua no projeto); copiar os `.tsx` de referência (não disponíveis e dependem de `framer-motion`).
- **Consequências:** nenhum código de terceiros entra; a seção "Créditos de componentes" do README registra o 21st.dev como **referência visual**, com a licença a confirmar quando os arquivos forem adicionados a `docs/design/referencias/`.

## ADR-015 — Fontes instaladas via npm (`@fontsource`)

- **Status:** Aceita — 18/11/2026
- **Contexto:** O design usa Baloo 2 (só o logotipo, peso 800) e Plus Jakarta Sans (500 a 800). As telas exportadas carregam as fontes do Google Fonts.
- **Decisão:** instalar `@fontsource/baloo-2` e `@fontsource/plus-jakarta-sans` pelo npm e importar só os pesos usados. O Vite empacota os arquivos de fonte.
- **Alternativas descartadas:** link para o Google Fonts (dependência de rede em tempo de execução e envio de requisições a terceiros num app local).
- **Consequências:** o app funciona sem internet; as fontes têm licença SIL Open Font License, registrada no README.

## ADR-016 — Seletor de mês global na URL

- **Status:** Aceita — 18/11/2026
- **Contexto:** O design pede um seletor de mês que vale para todas as telas internas. Antes, cada página tinha o próprio estado.
- **Decisão:** o mês fica no parâmetro `?mes=AAAA-MM` da URL, lido por um hook (`useMesSelecionado`). Os links do menu preservam o parâmetro. Sem o parâmetro, vale o mês atual.
- **Alternativas descartadas:** contexto React em memória (perde o mês ao recarregar a página e não gera links compartilháveis).
- **Consequências:** clicar num cartão do Painel abre `/transacoes?mes=…&tipo=…` já filtrado; os testes de página passam o mês pela rota inicial.

## ADR-017 — Ajustes do layout em relação ao export do design

- **Status:** Aceita — 18/11/2026
- **Contexto:** Ao implementar o layout, apareceram lacunas no export (`docs/design/telas/`), que é um protótipo.
- **Decisões:**
  - *Sair no celular:* a barra inferior do design tem só Painel, Transações e Categorias, e o botão "Sair" existe apenas no menu lateral. Sem ele, quem usa o celular não encerra a sessão. A barra inferior ganha um quarto item, "Sair", com o mesmo estilo dos outros.
  - *Modal de transação no layout:* para "+ Nova transação" abrir de qualquer tela, o modal, a confirmação de exclusão e o aviso de sucesso ficam no layout e são acionados por contexto (`useInterface`). A tela de Transações usa o mesmo modal para editar.
  - *Cartão do usuário:* o design mostra nome completo e login; a API só tem `username`. O cartão mostra as iniciais e o `username`.
  - *Limite de 2 personagens:* nos estados vazios com coadjuvante, a página pede ao layout para esconder o Papo do menu (`useOcultarPapoDoMenu`), como registrado em `decisoes-de-design.md`, seção 6.
- **Consequências:** o plano (NF6) inclui o modal completo; a NF10 só monta a tela de Transações em volta dele.
