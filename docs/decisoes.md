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

## ADR-018 — Dois modos de demonstração, com dados recriados a cada entrada

- **Status:** Aceita — 18/11/2026. Complementa o ADR-003 e o ADR-009.
- **Contexto:** O botão "Entrar como demonstração" só mostrava a conta cheia de dados. Na apresentação também é preciso mostrar o começo do uso (cadastrar a primeira categoria e a primeira transação). Além disso, quem usa a demonstração altera os dados, e a próxima pessoa encontra um cenário diferente do esperado.
- **Decisão:**
  - `POST /api/auth/demo/` recebe `{"modo": "vazio" | "exemplo"}`; sem `modo`, vale `exemplo` (compatível com o botão antigo). Modo inválido → `400`. `DEMO_ENABLED=False` → `404`.
  - Dois usuários separados: `demo` (modo `exemplo`) e `demo-vazio` (modo `vazio`), ambos com senha inutilizável e criados pelo endpoint se não existirem.
  - **A cada entrada, os dados daquele usuário são recriados:** `vazio` apaga todas as categorias e transações do `demo-vazio`; `exemplo` apaga as do `demo` e roda o seed de novo, com datas relativas ao mês atual.
  - `seed_demo` ganha `--modo` e reutiliza a mesma função de recriação.
- **Por que recriar a cada entrada:** a demonstração fica **previsível**. Quem clica sempre vê o mesmo cenário, com datas no mês atual (o painel nunca abre num mês vazio só porque o seed foi rodado semanas antes), e nenhum teste anterior polui a apresentação.
- **Efeito colateral aceito:** sair e entrar de novo **apaga o que foi lançado** na demonstração. A tela de login avisa: "Os dados de demonstração são recriados a cada entrada." Quem quiser guardar dados usa um usuário próprio (`createsuperuser`).
- **Alternativas descartadas:**
  - *Um só usuário, alternando os dados:* um modo apagaria os dados do outro.
  - *Recriar só pelo comando `seed_demo`:* as datas envelhecem e o estado depende do que a última pessoa fez.
  - *Usuário temporário por sessão:* mais previsível ainda, mas acumula usuários no banco e exige limpeza periódica.
- **Consequências:** o `503` "rode o `seed_demo`" deixa de existir; dois logins simultâneos no mesmo modo compartilham os mesmos dados (aceitável num sistema local).

## ADR-019 — Painel em fluxo vertical de seções

- **Status:** Aceita — 18/11/2026. Substitui a organização em bento do ADR-013 / `Painel.dc.html`.
- **Contexto:** Na revisão do novo design, o Painel em bento (12 colunas, gráficos lado a lado e em alturas diferentes) foi considerado difícil de entender: não ficava claro por onde começar a ler, os gráficos eram baixos (200px) e o significado de cada um dependia de conhecer o gráfico.
- **Decisão:** uma seção abaixo da outra, cada uma com título (h2) e uma linha de descrição em linguagem simples, na ordem: Resumo do mês → Como seu saldo evoluiu → Entradas e saídas por dia → Para onde foi o dinheiro → Seu ano até agora → Últimas transações. Gráficos em largura total, com altura mínima de 280px no desktop, eixos e unidades rotulados e tooltip. Seletor de mês fixo no topo ao rolar.
- **Alternativas descartadas:** manter o bento com legendas maiores (continuava sem ordem de leitura); abas por gráfico (esconde informação e exige cliques).
- **Consequências:** a página fica mais longa e rola; os componentes de gráfico são reaproveitados; as regras dos personagens (bordas, máximo de 2) continuam valendo.

## ADR-020 — Abrir o app no celular pela rede local

- **Status:** Aceita — 18/11/2026. Complementa o ADR-002.
- **Contexto:** Na apresentação e nos testes, o autor quer abrir o app no celular, na mesma rede Wi-Fi do computador. O IP do computador muda a cada rede. Dois problemas apareceram na prática:
  1. O Django recusa o `Host` com o IP da rede (`ALLOWED_HOSTS`) e o CSRF recusa a `Origin` `http://<ip>:5173` (`CSRF_TRUSTED_ORIGINS`).
  2. O servidor de desenvolvimento do Vite manda centenas de módulos separados, sem compilar para navegadores mais antigos: no celular a tela ficou branca, carregando sem terminar.
- **Decisão:**
  - O proxy de `/api` do Vite reescreve `Host` (`changeOrigin`) e `Origin` para `localhost`. Para o Django, toda requisição vem de `localhost:5173`, qualquer que seja o IP usado no navegador. O proxy já é a "mesma origem" do ADR-002; só passa a se apresentar sempre do mesmo jeito.
  - Script `npm run celular`: `build` + `vite preview --host` na porta 5173 (pacote de produção, rápido no celular). O `preview` usa o mesmo proxy.
  - Script `npm run dev:rede`: servidor de desenvolvimento com `--host`, para quem quiser recarregamento automático em outro computador da rede.
  - O Django continua em `127.0.0.1:8000`: só o Vite fica exposto na rede.
- **Alternativas descartadas:**
  - *IP fixo ou variável de ambiente com o IP:* teria de ser trocado a cada rede.
  - *`ALLOWED_HOSTS = ["*"]` e confiar em qualquer origem:* afrouxaria o Django em vez de só ajustar o proxy local.
  - *Expor o Django direto na rede:* duas portas abertas e CORS entre origens (descartado no ADR-002).
- **Consequências:** a proteção CSRF continua ativa (o token ainda é exigido). Os modos `--host` expõem o app a todos da rede: usar só em rede confiável, como o resto do projeto, que é local (seção 2). Em `npm run celular`, mudanças no código só aparecem depois de rodar o script de novo.

## ADR-021 — Orçamento como campo da Categoria

- **Status:** Aceita — 19/11/2026
- **Contexto:** O usuário quer definir um limite mensal de gastos por categoria e acompanhar quanto já usou. O prazo até a apresentação (24/11/2026) é curto.
- **Decisão:** campo `limite_mensal` (`DecimalField(12, 2)`, opcional) em `Categoria`, em vez de uma tabela própria. Só categorias de despesa têm limite; se preenchido, deve ser maior que zero. A situação (`ok` < 80%, `atencao` 80%–100%, `estourado` > 100%) é calculada no backend em `GET /api/orcamentos/`, que também devolve o `excesso` em reais, para o front não subtrair dinheiro (ADR-005).
- **Alternativas descartadas:** tabela `Orcamento(categoria, mes, valor)`: guarda o histórico, mas exige CRUD próprio, tela própria e regra de "copiar o limite do mês anterior", fora do prazo.
- **Limitação aceita:** o limite não tem histórico. Alterá-lo muda também a visão dos meses anteriores (o mesmo limite vale para todos os meses).
- **Evolução futura:** tabela `Orcamento(categoria, mes, valor)`, migrando o valor atual de `limite_mensal` como limite de todos os meses passados.

## ADR-022 — Dicas do Papo por regras determinísticas

- **Status:** Aceita — 19/11/2026
- **Contexto:** O Painel mostra números e gráficos, mas não chama a atenção para o que mudou no mês. O Papo, até aqui decorativo, pode "falar" esses avisos.
- **Decisão:**
  - Regras fixas no backend (`GET /api/dicas/`), **sem uso de IA nem de modelo de linguagem**: o mesmo dado sempre gera a mesma dica, testável com limites exatos.
  - Limiares mínimos para não gerar ruído: crescimento só com ≥ 20% **e** ≥ R$ 50,00; concentração só acima de 40%; perto do limite a partir de 80%.
  - Tom informativo, nunca de julgamento ("passou do limite", "subiu", nunca "demais" ou "exagerou").
  - No máximo 3 dicas, uma regra = no máximo uma dica, exibidas uma por vez.
  - Sem dados, só a dica de primeiros passos (as demais regras não fazem sentido num mês vazio). A regra de crescimento só compara categorias que tiveram gasto no mês anterior (sem base, o percentual não existe).
  - Os textos já saem formatados do backend (moeda BRL e mês por extenso), para o front só exibir.
- **Alternativas descartadas:** gerar os textos com um modelo de linguagem (não determinístico, depende de rede e de chave de API, difícil de testar e pode julgar o usuário); mostrar todas as dicas de uma vez (polui o Painel).
- **Consequências:** é a única informação que o Papo carrega (exceção registrada na seção 6 de `decisoes-de-design.md`); o texto continua acessível e a imagem continua decorativa.

## ADR-023 — Forma de pagamento como enumeração

- **Status:** Aceita — 19/11/2026
- **Contexto:** O usuário quer saber como pagou as despesas do mês (Pix, cartão, dinheiro...).
- **Decisão:** campo `forma_pagamento` na `Transacao` com escolhas fixas (`PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `DINHEIRO`, `BOLETO`, `TRANSFERENCIA`, `NAO_INFORMADO`), padrão `NAO_INFORMADO`, que também preenche as transações existentes na migration. O resumo do mês ganha `despesas_por_forma`.
- **Alternativas descartadas:** tabela de formas de pagamento cadastráveis pelo usuário (mais um CRUD sem ganho real para o escopo); modelar cartões e contas (fora do escopo, seção 2 da spec).
- **Consequências:** acrescentar uma forma nova exige migration; "Não informado" aparece sempre por último no Painel, para não parecer uma forma de pagamento como as outras.

## ADR-024 — Repetir transações fixas com autorrelacionamento

- **Status:** Aceita — 19/11/2026
- **Contexto:** Contas como aluguel, internet e salário se repetem todo mês. Lançá-las de novo é trabalho repetitivo. Recorrência automática (agendador) está fora do escopo.
- **Decisão:** campo `fixa` (booleano) e autorrelacionamento `repetida_de` (FK para a própria `Transacao`, `on_delete=SET_NULL`, `related_name="repeticoes"`). O usuário escolhe, por ação explícita, quais fixas do mês anterior lançar no mês atual. Uma original que já tem cópia no mês de destino (`repetida_de` = original) é ignorada: repetir duas vezes não duplica (idempotência). A cópia também é fixa, para ser repetida no mês seguinte.
- **Alternativas descartadas:** recorrência automática com agendador (precisa de processo em segundo plano, fora do escopo); comparar descrição e valor para detectar duplicatas (frágil: o usuário pode editar a cópia).
- **Consequências:** excluir a original não apaga a cópia (só zera `repetida_de`); nesse caso a cópia deixa de ser reconhecida como repetição dela.

## ADR-025 — Seed de demonstração das novas funcionalidades

- **Status:** Aceita — 19/11/2026. Complementa o ADR-018.
- **Contexto:** O seed é aleatório (semente fixa) e o mês atual só tem lançamentos até hoje. Limites fixos poderiam cair em situações diferentes dependendo do dia.
- **Decisão:** os limites das 3 categorias com orçamento são calculados **depois** de gerar as transações, sobre o gasto do mês atual (gasto ÷ 0,60, ÷ 0,85 e ÷ 1,15, arredondados para baixo em reais), para a demonstração mostrar sempre os três estados. Uma despesa extra de Transporte no mês atual garante a dica de crescimento. As 4 fixas existem em todos os meses, encadeadas por `repetida_de`; no mês atual, internet e streaming ficam sem repetir.
- **Consequências:** o mês atual tem 19 lançamentos (18 dos modelos, sem as duas fixas, mais a revisão do carro), e o total continua perto de 240.

## ADR-026 — Funcionalidades avaliadas e descartadas

- **Status:** Aceita — 19/11/2026
- **Decisão:** não implementar:
  - *Simulador de compra parcelada:* não usa os dados do usuário (é uma calculadora genérica) e foge do propósito do app, que é registrar e entender o que já aconteceu.
  - *Previsão de saldo do mês:* a projeção ingênua (média diária × dias restantes) trataria receitas pontuais, como o salário, como se fossem diárias, e mostraria um saldo futuro enganoso.
- **Consequências:** as dicas (ADR-022) cobrem a necessidade de "o que fazer com esses números" usando só fatos do mês.

## ADR-027 — Node.js 22 para os testes do frontend

- **Status:** Aceita — 19/11/2026
- **Contexto:** Ao começar as novas funcionalidades, `npm test` falhou no Node 20 instalado: o `undici` usado pelo `jsdom` 31 exige Node ≥ 22.19 (`createZstdDecompress`). O README dizia "Node.js 20 ou superior".
- **Decisão:** documentar Node.js **22.19 ou superior** como pré-requisito. Nesta sessão, os testes rodaram com o Node 22 instalado a partir do registry do npm (pacote `node`) numa pasta temporária, sem instalar nada global.
- **Alternativas descartadas:** rebaixar o `jsdom` (mexe em dependências já aprovadas só por causa do ambiente).
- **Consequências:** o README passa a pedir Node 22.

## ADR-028 — Detalhes do fundo das telas internas e das dicas flutuantes

- **Status:** Aceita — 19/11/2026. Complementa o ADR-022.
- **Contexto:** A iteração "Fundo das telas internas" e a dica do Papo como "cabeça de chat" (decisoes-de-design, seção 5) deixaram lacunas de implementação.
- **Decisão:**
  - *Areia do horizonte:* o SVG não pinta a faixa de areia; ela fica transparente e mostra o próprio fundo da página. Assim a cor é exatamente a da página e a textura continua sem emenda. A referência tinha uma areia mais escura (`#F3D8B6`), que daria emenda com o fundo `#FBF6EC`.
  - *Tokens extras:* além de `--horizonte-ceu`, `--horizonte-mar-1`, `--horizonte-mar-2` e `--horizonte-espuma`, foram criados `--horizonte-mar-crista` (`#71C1CB`, faixa mais escura entre as duas faixas de mar, presente na referência) e `--horizonte-nuvem` (`#EEF8FB`). As barras de orçamento usam `--jnc-estado-sucesso`, `--jnc-estado-atencao` e `--jnc-estado-erro` (este igual a `--jnc-despesa`), escolhidos com contraste ≥ 3:1 com o trilho.
  - *Faixa de 720 a 1023px:* menu lateral e cartão de dica na página (o botão flutuante é só a partir de 1024px). O Papo do cartão Saldo foi removido em toda largura ≥ 720px, para respeitar o limite de 2 personagens (menu lateral + Papo da dica).
  - *Saldo negativo no desktop:* sem o Papo do cartão Saldo, a pose preocupada aparece no botão flutuante quando a primeira dica é um alerta (`mes_no_vermelho` é alerta). O saldo continua em vermelho e com sinal.
  - *Estado vazio:* sem botão flutuante; a dica continua dentro do cartão vazio (limite de 2 personagens).
  - *Chave da abertura automática:* `jnc:dicas-auto:<usuário>:<AAAA-MM>` no `localStorage`; o usuário é lido do cache da sessão, sem nova requisição.
- **Consequências:** a faixa e a barra fixa dependem de alturas fixas (barra de 72px no desktop; título do celular abaixo da faixa de 110px). Mudar essas alturas exige ajustar as constantes em `CabecalhoPagina.tsx` e `lib/horizonte.ts`.
