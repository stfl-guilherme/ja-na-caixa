# JáNaCaixa: pacote de design para implementação

Este pacote tem as telas aprovadas do JáNaCaixa (login + app) feitas num canvas de design. **Use como referência visual e de comportamento** para implementar no projeto `ja-na-caixa` (frontend React + TypeScript consumindo a API Django). Não copie os arquivos `.dc.html` para dentro do projeto: eles são o *spec*, não o código final.

## Estrutura

Caminhos relativos a `docs/design/`:

```
telas/
  login/          Main.dc.html = login desktop (cena + card) e mobile (empilhado), responsivo pela largura
                  LoginB_Carregando / LoginB_Erro / Mobile_* = mesmos arquivos em outros estados
  app/painel/     Painel.dc.html (dashboard bento, responsivo) + variações: negativo, vazio, mobile
  app/transacoes/ Transacoes.dc.html (filtros, tabela, modais, skeleton, vazio, toast) + 10 variações de estado
  app/categorias/ Categorias.dc.html (seções, modal, tipo bloqueado, exclusão bloqueada) + variações
  componentes/    Form (login), SceneVar (praia desktop), SceneMobile, Sidebar, BottomNav, Ficha (mascote + tokens)
```

Fora de `telas/`, o material fica assim no repositório:

```
docs/design/tokens.json                 tokens em JSON (referência)
docs/design/dados-exemplo.json          categorias, 24 transações de novembro/2026, histórico do ano → referência do seed do usuário demo
docs/design/decisoes-de-design.md       princípios e decisões visuais (fonte da verdade do design)
docs/design/referencias/                componentes de referência do 21st.dev (pendente: não vieram no export, ver docs/decisoes.md)
frontend/src/styles/tokens.css          tokens como variáveis CSS (cópia viva usada pelo app)
frontend/src/assets/papo/               poses do Papo já recortadas, fundo transparente
frontend/src/assets/personagens/        caranguejo e gaivota (só em estados vazios)
```

Os arquivos de variação (ex.: `Transacoes_Nova.dc.html`) só importam a tela principal com outra prop (`modal="nova" erro-valor`). **A lógica e o markup estão sempre no arquivo principal** de cada pasta.

## Como ler um `.dc.html`

Cada arquivo é um componente com duas partes:

1. **Markup** dentro de `<x-dc>`: HTML com estilos inline (os valores visuais exatos estão aí).
   - `{{nome}}` = valor calculado no script (equivale a `{nome}` em JSX).
   - `<sc-if value="{{cond}}">` = renderização condicional (`{cond && ...}`).
   - `<sc-for list="{{itens}}" as="item">` = loop (`itens.map(item => ...)`).
   - `<dc-import name="Sidebar" ativo="painel">` = usar outro componente com props (`<Sidebar ativo="painel" />`).
   - `onClick="{{fn}}"` = handler, igual ao React.
2. **Script** `class Component extends DCLogic`: `renderVals()` calcula tudo o que o markup usa a partir de `this.props` e `this.state`. É aí que estão as regras: formatação, filtros, validação, squarify do treemap, escalas dos gráficos.

Ignore `support.js`, `data-props`, `hint-*` e `$preview`: são do editor de design.

## Mapa para componentes React

| Spec | Componente sugerido |
|---|---|
| `Sidebar.dc.html` | `<AppSidebar ativo />` com o botão "Nova transação" e o Papo espiando sobre o cartão do usuário |
| `BottomNav.dc.html` + FAB nas páginas | `<BottomNav ativo />` + `<FabNovaTransacao />` (mobile < 720px) |
| seletor de mês (em todas as páginas) | `<MonthPicker />` com estado global (contexto/URL), vale para todas as telas |
| cartões de métrica do Painel | `<MetricCard tipo="receita|despesa|saldo" />` com seta + texto ("gastou menos") |
| saldo acumulado | `<SaldoLineChart />`: SVG com `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"`, rótulos em HTML, tooltip com mouse **e** setas do teclado |
| entradas e saídas | `<FluxoEspelhadoChart />`: receitas acima e despesas abaixo do eixo |
| para onde foi o dinheiro | `<CategoriasTreemap />`: algoritmo squarify está em `Painel.dc.html` (`squarify()`), cor do texto automática por contraste (`textoSobre()`) |
| ano em resumo | `<AnoBarChart />` |
| tabela de transações | `<TransacoesTable />` (desktop) e `<TransacoesLista />` agrupada por dia (mobile) |
| modal transação | `<TransacaoModal modo="nova|editar" />` |
| modal categoria | `<CategoriaModal />` com `<ColorPicker />` de 10 cores |
| diálogos | `<ConfirmDialog />`; exclusão de categoria com transações é um diálogo informativo (sem botão excluir) |
| aviso | `<Toast />` com papo-joinha pequeno |
| vazio | `<EmptyState />` |
| carregando | `<TransacoesSkeleton />` (estático, sem brilho em loop) |

Os gráficos foram feitos à mão em SVG. Se usar uma biblioteca (Recharts etc.), mantenha cores, ordem e acessibilidade iguais.

## Regras que não podem se perder

**Dinheiro e datas**
- Moeda sempre `R$ 1.234,56` com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Sinal explícito: `+ R$ 5.200,00` / `− R$ 1.450,00` (o menos é o caractere U+2212). Receita verde `#1E7B3A`, despesa `#C2412D`. **A cor nunca aparece sozinha**: sempre vem com sinal **e** ícone de seta.
- Datas `dd/mm/aaaa`. Algarismos tabulares (`font-variant-numeric: tabular-nums`) em todo o app.
- Comparação "vs mês anterior": em Despesas, subir é ruim (vermelho) e cair é bom (verde), sempre com texto ("gastou mais/menos", "sobrou mais/menos").
- Campo valor do modal: o usuário digita só números e a máscara monta os centavos (`onValor` em `Transacoes.dc.html`). Guarde em **centavos inteiros** na API.
- O tipo (receita/despesa) **vem da categoria**; não há campo de tipo na transação.

**Validação do modal de transação** (mensagens exatas)
- Descrição vazia: "Escreva uma descrição, ex.: Mercado do mês."
- Valor 0: "Informe um valor maior que R$ 0,00."
- Data inválida: "Use o formato dd/mm/aaaa, ex.: 17/11/2026."
- Sem categoria: "Escolha uma categoria."
- Campo com erro: borda `2px #B42318`, `aria-invalid`, mensagem ligada por `aria-describedby`.

**Categorias**
- Ao editar uma categoria que já tem transações, o tipo fica bloqueado (radios desabilitados + cadeado + explicação).
- Excluir categoria com transações: bloqueado, com diálogo "Esta categoria tem N transações. Mova ou exclua as transações antes."
- 10 cores fixas (tokens `--jnc-cat-*`), todas com contraste ≥ 4,9:1 com branco.

**Papo (mascote)** (PNGs em `frontend/src/assets/papo/` e `frontend/src/assets/personagens/`): decorativo, nunca protagonista
- Sempre `alt=""` + `aria-hidden="true"`; nenhuma informação só nele.
- No máximo 2 aparições por tela, nunca 2 no mesmo cartão.
- Efeito espiando: a imagem fica **atrás** do cartão (cartão com `position: relative; z-index: 1`, imagem `position: absolute; top: -72px; z-index: 0`). Altura visível máxima de 72px no desktop.
- Hover: só uma inclinação sutil (`rotate(-4deg)`) no cartão onde ele está; desligada com `prefers-reduced-motion`.
- Mobile: o Papo aparece só no topo do Painel, nos estados vazios, nos diálogos e no toast.

| Lugar | Imagem |
|---|---|
| Menu lateral (sobre o cartão do usuário) | `papo-espiando.png` |
| Painel, atrás do cartão Saldo | `papo-espiando.png`; saldo negativo → `papo-preocupado.png` |
| Painel mobile, ao lado do seletor de mês | `papo-espiando.png` pequeno |
| Transações, atrás da borda dos filtros (desktop) | `papo-espiando.png` (some no vazio e com o toast aberto, para respeitar o limite de 2) |
| Categorias, ao lado do título Receitas | `papo-sentado-moeda.png` |
| Painel vazio | `papo-cadeira-acenando.png` + `caranguejo.png` |
| Transações vazio (filtro sem resultado) | `papo-espiando-lado.png` + `gaivota.png` |
| Exclusão de categoria bloqueada | `papo-preocupado.png` |
| Toast de sucesso | `papo-joinha.png` (40px) |
| Login: padrão / carregando / erro | `papo-cadeira-acenando` / `papo-animado` / `papo-preocupado` |

**Login**
- Desktop: cena de praia "manhã calma" em tela cheia + cartão branco à direita. O sol nunca fica atrás do cartão e a área atrás do cartão continua lisa.
- Mobile (< 720px): cena no topo (no máximo 300px ou 38% da altura, **não fixa**, para o teclado não esconder o formulário). Abaixo da linha do mar a cena é transparente: a areia `#F6E7C8` é o fundo da página inteira, sem emenda ao rolar. Sem cartão branco.
- Botão "Entrar como demonstração": amarelo do papo + contorno de 2,5px + sombra `0 4px 0`. É o **único** elemento com traço cartunesco na interface.
- Estados: carregando (spinner + "Entrando…", campos desabilitados) e erro ("Usuário ou senha inválidos", banner `role="alert"`, campos com borda vermelha, Papo preocupado).

**Acessibilidade**
- WCAG AA, foco visível, alvos ≥ 44px (campos 48px).
- Cada gráfico tem `aria-label` com resumo **e** uma tabela equivalente escondida visualmente (ver as `div role="table"` em `Painel.dc.html`).
- Modais com `role="dialog"`/`alertdialog`, `aria-modal`, foco inicial no primeiro campo e Esc para fechar. Na implementação real, adicione também *focus trap* e devolva o foco ao botão que abriu o modal.
- Animação só na entrada do Painel (contagem dos números e desenho da linha, cerca de 900ms); nada em loop; respeitar `prefers-reduced-motion`.

## Layout responsivo

- Breakpoint único: **720px**. Acima disso, menu lateral (248px) + conteúdo. Abaixo, navegação inferior + FAB "+".
- Painel desktop: grid de 12 colunas, gap 24px. Linha 1: Receitas | Despesas | Saldo (4 colunas cada). Linha 2: Saldo do mês (7) | Últimas transações (5). Linhas 3–4: Entradas e saídas (7) e Ano em resumo (7) à esquerda; Para onde foi o dinheiro (5) ocupando as duas linhas à direita.
- Painel mobile: tudo em uma coluna, na ordem do markup.
- O botão "+ Nova transação" fica no **menu lateral** no desktop: a barra superior deixa a direita livre para o Papo espiar o cartão Saldo.

## O que o protótipo simplifica (implemente de verdade)

- Os dados são fixos (novembro/2026). O seletor de mês só troca o rótulo; dezembro mostra o estado vazio.
- No protótipo, "Nova transação" só abre o modal dentro de Transações. No app, ele precisa abrir de qualquer tela.
- Clicar num cartão de métrica deve abrir Transações já filtrada (`?tipo=receitas` etc.); no protótipo, só navega.
- Login "Entrar" sempre resulta em erro no protótipo; "Entrar como demonstração" deve entrar no usuário demo semeado com base em `docs/design/dados-exemplo.json`.
