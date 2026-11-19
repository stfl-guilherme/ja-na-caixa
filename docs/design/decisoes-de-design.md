# Decisões de Design — JáNaCaixa

Este documento registra **como** e **por que** o visual do JáNaCaixa foi definido: as direções testadas, o que foi rejeitado e as regras que saíram de cada iteração. As decisões de arquitetura ficam em `docs/decisoes.md`; o uso de IA, em `docs/ia/registro-uso-ia.md`.

> Campos entre `[colchetes]` devem ser preenchidos pelo autor.

---

## 1. Princípios

1. **Ilustração cartunesca, dados sóbrios.** O personagem e o cenário são cartoon; números, tabelas, gráficos e formulários são limpos e legíveis. Num app de dinheiro, valor com cara de brinquedo reduz a confiança.
2. **O traço forte é exclusivo do mascote.** Contorno escuro e grosso só no Papo. Cenário e interface usam formas chapadas, sem contorno preto, para o mascote ser o único elemento "cartoon" e não competir com o resto.
3. **A praia é a vitrine.** O cenário completo existe só na tela de login. As telas internas usam fundo cor de areia clara e cartões brancos.
4. **O personagem decora, não informa.** Ele nunca carrega uma informação que não esteja também em texto, e nunca fica sobre dados ou controles.
5. **Acessibilidade como requisito, não acabamento.** Contraste WCAG AA, foco visível, alvos de toque ≥ 44px, cor nunca como único sinal (receita/despesa sempre com sinal + ou −).

## 2. Identidade

| Item | Decisão | Motivo |
|---|---|---|
| Nome | **JáNaCaixa** (`ja-na-caixa` em código e URLs) | "Já na caixa" = dinheiro guardado. A grafia com maiúsculas mantém a leitura correta; o slug com hífens evita a leitura "Jana caixa". |
| Nome descartado | "Flet" | Coincide com um framework Python conhecido; no portfólio, sugeriria que o app foi feito com ele. |
| Mascote | **Papo**, um jacaré | Referência ao jacaré-de-papo-amarelo, espécie brasileira. O jacaré "guarda o que é dele", o que conversa com a ideia de dinheiro guardado. |
| Tema | Praia brasileira | Tom leve e acolhedor para um assunto que costuma gerar ansiedade (finanças). |

## 3. O mascote

### Origem e diferenciação
A ideia inicial partiu de mascotes de marcas conhecidas (ex.: o jacaré da HostGator). Para não criar um personagem derivado, o Papo foi definido com traços próprios:
- papo/barriga amarela como marca registrada (referência à espécie);
- roupas e acessórios de praia (camisas floridas, bermuda, óculos escuros, prancha, coco);
- estilo de ilustração genérico de cartoons dos anos 1990/2000, que não pertence a nenhuma marca.

### Iterações
| # | Tentativa | Resultado | Decisão |
|---|---|---|---|
| 1 | Claude Design desenhando o mascote em SVG | Genérico e "cartoon demais", sem o acabamento desejado | Rejeitado. Ferramentas de layout não são adequadas para ilustração de personagem. |
| 2 | Gerador de imagens ([FERRAMENTA]) com prompt de estilo: cartoon anos 90/2000, formas orgânicas, contorno limpo, cores chapadas, cel shading mínimo | Folha com 6 poses consistentes | **Aprovado.** O mascote passou a ser um asset (PNG) usado pelas telas, nunca redesenhado. |
| 3 | Mesmo gerador e mesmo prompt de estilo, pedindo poses pensadas para a interface: espiando (atrás da borda de um cartão), espiando de lado, sentado com moeda, na cadeira de praia acenando, animado, joinha e preocupado. No mesmo estilo, dois coadjuvantes: caranguejo e gaivota | A folha original de 6 poses não tinha poses que funcionassem nas bordas dos cartões nem nos estados vazios; as novas poses foram recortadas com fundo transparente | **Aprovado.** São estes os PNGs usados pelo app (`frontend/src/assets/papo/` e `frontend/src/assets/personagens/`). As poses da folha original não são usadas na interface. |

### Limitação conhecida
Todas as poses da folha usam óculos escuros. Em tamanhos pequenos (≤ 72px), o rosto perde expressão. Se necessário, gerar poses com os óculos na testa.

## 4. Tela de login

### Cenário
| # | Tentativa | Resultado | Decisão |
|---|---|---|---|
| 1 | Cenário desenhado pelo Claude Design | Simples demais | Pedido de mais riqueza |
| 2 | Referência de composição: ilustração de praia em pixel art de banco de imagens | Usada **apenas como ideia de composição** (palmeira à esquerda, mar em faixas, nuvens à direita, areia em primeiro plano). Não foi usada como asset (imagem com marca d'água e de outro estilo). | — |
| 3 | Cenário gerado no gerador de imagens, no estilo do mascote | Poluído: contorno preto em todos os elementos, saturação máxima, guarda-sol ocupando a área do mascote | Rejeitado |
| 4 | Mesma geração com pedido de cenário calmo | O gerador manteve contornos e saturação | Rejeitado |
| 5 | Voltar ao cenário chapado do Claude Design (opção B), refinado: nuvens com formato de nuvem, sol fora da área do cartão, espuma suave, profundidade sem poluir | Combina com o mascote justamente por ser simples: o Papo vira o único elemento com traço forte | **Aprovado.** Foram geradas 3 variações (Manhã calma, Fim de tarde, Praia completa); escolhida: **[VERSÃO]** |

Lição registrada: **um fundo bonito para uma tela de interface é um fundo calmo.** Mais detalhe no cenário reduziu a legibilidade e a hierarquia.

### Desktop
Cenário em tela cheia, mascote na cadeira de praia com o baú de moedas ("o dinheiro já tá na caixa") à esquerda, cartão de login branco à direita sobre a área calma do céu. Botão "Entrar como demonstração" em destaque, por ser o caminho principal da apresentação.

### Mobile
- Sem cartão branco: o formulário fica direto sobre o cenário.
- Topo ilustrado (céu, mar e mascote) com no máximo ~40% da altura, para o formulário continuar acessível com o teclado aberto.
- A areia da ilustração continua como fundo da página ao rolar, sem emenda (mesma cor).
- Campos brancos; botões mantêm as cores do desktop; textos sobre a areia com contraste ≥ 4,5:1.

### Estados
Padrão, carregando e erro, cada um com a pose correspondente do mascote.

## 5. Telas internas

### Direção
Fundo cor de areia clara, cartões brancos, sombras suaves, algarismos tabulares, moeda em BRL com centavos, datas em dd/mm/aaaa. Receitas em verde, despesas em vermelho-coral, sempre com sinal.

### Componentes de referência (21st.dev)
Dois componentes foram avaliados como referência visual para o painel. Nenhum foi usado sem adaptação:

| Elemento | Decisão | Motivo |
|---|---|---|
| Linha de receita (Analytics Bento) | Usado como **saldo acumulado por dia** | Gráfico mais útil para quem controla o mês |
| Ondas espelhadas desktop × mobile | Usado como **receitas acima × despesas abaixo, por dia**, desenhado como **barras espelhadas** (não curvas); animação contínua removida | Animação em loop faz dado financeiro parecer instável; curvas sugerem valores entre os dias que não existem |
| Treemap por categoria | Usado para **despesas por categoria**, com a cor de cada categoria e contraste automático do texto | Lê melhor que pizza com muitas categorias |
| Radar de sazonalidade | **Descartado**, substituído por barras dos 12 meses | O componente suaviza a forma (ajuste de Fourier), então o desenho não representa os valores reais. Inaceitável em dados financeiros. |
| Contagem animada dos números | Usada com formatação **BRL e 2 casas** | O original arredondava para inteiro, sumindo com os centavos |
| Cartão de métrica (DashboardMetricCard) | Usado nos cartões Receitas/Despesas/Saldo, com **semântica invertida em despesas** (subir = vermelho) | No original, subir era sempre verde |
| Hover com "levantar" + cursor de clique | Mantido apenas porque o cartão passou a ser clicável (abre Transações filtrada) | Evitar affordance falsa |
| framer-motion | Não adotado | Dependência inteira para um efeito resolvível em CSS |

Créditos e licenças dos componentes de referência: ver README.

### Iteração do Painel: de bento para fluxo vertical (18/11/2026)
| # | Tentativa | Resultado | Decisão |
|---|---|---|---|
| 1 | Painel em bento (grid de 12 colunas): cartões no topo e gráficos lado a lado, em alturas diferentes (`docs/design/telas/app/painel/Painel.dc.html`) | Considerado difícil de entender: sem ordem clara de leitura, gráficos baixos e significado dependente de conhecer cada gráfico. O gráfico de entradas e saídas, pensado a partir das ondas espelhadas em curvas, ainda lembrava a referência | Rejeitado |
| 2 | Fluxo vertical: uma seção abaixo da outra, cada uma com título e uma frase em linguagem simples ("Quanto entrou, quanto saiu e quanto sobrou."), gráficos em largura total com eixos e unidades rotulados; o gráfico espelhado em curvas vira **barras espelhadas** (receitas para cima em verde, despesas para baixo em vermelho-coral) | Lê como um relatório, de cima para baixo | **Aprovado** (ADR-019). O seletor de mês fica fixo no topo ao rolar. |

### Escolha da demonstração no login (18/11/2026)
O botão "Entrar como demonstração" deixa de entrar direto: ele expande, **no mesmo cartão do login**, duas opções em cartões grandes e clicáveis (empilhadas no celular):
1. **"Ver com dados de exemplo"** — opção destacada (é a principal da apresentação), no amarelo do Papo com o traço cartunesco, que continua exclusivo da demonstração.
2. **"Começar do zero"** — cartão branco com contorno simples.

Abaixo, em texto pequeno: "Os dados de demonstração são recriados a cada entrada." e um botão "Voltar". O foco vai para a primeira opção ao abrir. A cena de praia e o Papo continuam iguais (ADR-018).

### Novas funcionalidades (19/11/2026)
- **Orçamentos:** uma barra de progresso por categoria com limite, em verde até 80%, em âmbar de 80% a 100% e em vermelho-coral acima de 100% (cor da categoria só no marcador; ver "Barras de orçamento: cor do estado"), sempre com o **estado também em texto** ("Dentro do limite", "Atenção", "Limite ultrapassado em R$ X") e com "R$ gasto de R$ limite (N%)". A cor nunca é o único sinal. A barra tem `role="progressbar"` com `aria-valuenow` limitado a 100 e `aria-valuetext` com o texto completo. Aparece no Painel (seção "Orçamentos de [mês]", depois do Resumo) e no cartão da categoria em Categorias.
- **Como você pagou:** nova seção do Painel, depois de "Para onde foi o dinheiro": barras horizontais, uma por forma de pagamento, com ícone, rótulo, valor e percentual escritos; "Não informado" por último e em cinza, para não competir com as formas reais.
- **Repetir fixas:** botão secundário "Repetir fixas de [mês anterior]" no topo de Transações, acima dos filtros, que abre um diálogo com a lista marcada (desmarcável) e o botão "Lançar N transações"; o sucesso usa o aviso com o `papo-joinha`. Na tabela, a coluna "Forma" mostra ícone + rótulo.

### Fundo das telas internas (19/11/2026)
O fundo de areia liso foi considerado simples demais. Opções avaliadas:

| Opção | Descrição | Decisão |
|---|---|---|
| A | Textura de areia (granulado sutil) | **Escolhida** |
| B | Faixa de horizonte (céu, mar, espuma, areia) no topo | **Escolhida** |
| C | Padrão repetido de ícones | Descartada: polui os espaços entre os cartões |
| D | Ilustrações nos cantos | Descartada: conflita com o Papo flutuante no canto |
| E | Degradê céu → areia | Descartada: clichê visual |

Motivos da escolha **A + B**: preserva a leitura (o conteúdo fica em cartões opacos e a decoração fica fora das áreas de texto), liga as telas internas ao login e deixa os cantos livres para o Papo flutuante.
- **Textura (A):** ruído gerado em SVG (`feTurbulence`) como `background-image` em CSS, opacidade de 2% a 4%, sem imagem externa; rola com a página (sem `background-attachment: fixed`, que trava a rolagem em celulares). Não se aplica ao login. Títulos e descrições sobre o fundo mantêm contraste ≥ 4,5:1.
- **Horizonte (B):** componente SVG `HorizonteHeader`, recriado a partir da referência aprovada `docs/design/referencias/horizonte-referencia.png` (gerada em outra ferramenta de IA), com as cores amostradas da imagem como tokens `--horizonte-ceu`, `--horizonte-mar-1`, `--horizonte-mar-2` e `--horizonte-espuma`. Estilo chapado, sem contorno; ~160px de altura no desktop e ~110px no mobile, na largura da área de conteúdo (não fica sob o menu lateral); céu ~55%, mar ~30%, espuma e areia ~15%. As faixas esticam na horizontal e as duas nuvens ficam num grupo ancorado à direita, sem distorção. A areia da base usa exatamente a cor de fundo da página. Decorativo (`aria-hidden="true"`), rola com a página, sem animação. O título sobre o céu tem contraste ≥ 4,5:1 (coberto por teste).
- **Barra superior fixa:** transparente no topo da página; ao ficar fixa, ganha fundo sólido de areia, sombra suave e borda inferior.

### Dica do Papo como "cabeça de chat" (19/11/2026)
O balão no topo do painel criava um espaço vazio grande acima dos cartões do Resumo. No desktop (≥ 1024px) ele é trocado pelo padrão "cabeça de chat": botão redondo flutuante com o Papo no canto inferior direito (24px das bordas), com selo da quantidade de dicas; o balão abre acima do botão. O Papo que espiava sobre o cartão Saldo sai e os cartões sobem. No mobile (< 1024px) continua o cartão abaixo do Resumo (o canto inferior direito é do botão "+"). Regras completas na spec, seção 17.2.

### Barras de orçamento: cor do estado (19/11/2026)
A cor da barra passa a indicar o estado: verde (dentro do limite), âmbar (atenção) e vermelho-coral (ultrapassado). A cor da categoria fica só no marcador redondo ao lado do nome. O estado continua em texto abaixo da barra. Vale no Painel e em Categorias. Motivo: com a cor da categoria na barra, uma categoria vermelha "dentro do limite" parecia estourada.

### Telas
- **Layout:** menu lateral (desktop) / barra inferior (mobile), seletor de mês global, ação "+ Nova transação" sempre acessível.
- **Painel (seções verticais, ADR-019):** resumo do mês (3 cartões), saldo acumulado, entradas × saídas por dia em barras espelhadas, treemap de despesas + maiores categorias, ano até agora, últimas transações. *(A primeira versão em bento foi substituída; ver iteração acima.)*
- **Transações:** filtros, tabela (desktop) ou cartões agrupados por dia (mobile), modal de criar/editar, confirmação de exclusão.
- **Categorias:** seções Receitas e Despesas, modal com 10 cores pré-aprovadas em contraste, tipo bloqueado quando há transações.

## 6. Regras do personagem nas telas internas

- Sempre nas bordas; nunca sobre textos, números, gráficos, tabelas, botões ou campos.
- Vale para o Papo e para os coadjuvantes (caranguejo e gaivota).
- Efeito "espiando": imagem atrás do cartão, só cabeça e ombros acima da borda.
- Máximo de 72px visíveis no desktop (o espiando aparece só até a altura dos ombros).
- No máximo **2 personagens visíveis por tela**, contando o Papo do menu lateral e os coadjuvantes. Nunca 2 no mesmo cartão, com uma exceção: no estado vazio, o Papo e o coadjuvante dividem o cartão em bordas opostas, e por isso o Papo do menu lateral é ocultado nesses estados (o export mostrava 3; a regra de 2 prevalece).
- Sem animação contínua; `aria-hidden`.
- Mobile: só em estados vazios, diálogos e topo do Painel.
- Única exceção informativa: com saldo negativo, o Papo do Painel troca para a pose preocupada. O saldo continua em vermelho e com sinal de menos, então a informação não depende do personagem.
- **Exceção das Dicas do Papo (19/11/2026, ADR-022):** o balão de dica é **informação real**. O texto fica numa região rotulada "Dicas do Papo" (`<section aria-label>`, `aria-live="polite"`), é lido pelo leitor de tela e **não** é `aria-hidden`. A imagem do Papo continua decorativa (`alt=""`, `aria-hidden`), e em todo o resto o Papo continua só decorando. A pose acompanha o tipo da dica (alerta → preocupado; parabéns → joinha; informação e primeiros passos → espiando), mas o tipo também está no texto, nunca só na pose. Com saldo negativo, o Papo do cartão Saldo fica preocupado em qualquer dica.
  - *Desktop (≥ 1024px, desde 19/11/2026):* botão flutuante "cabeça de chat" no canto inferior direito, com o balão abrindo acima dele (ver seção 5). A versão anterior (balão acima dos cartões, ligado ao Papo do cartão Saldo) foi substituída.
  - *Mobile:* cartão de largura total abaixo do Resumo, com o Papo pequeno (48px) à esquerda. Conta no limite de 2 personagens com o Papo do cabeçalho.
  - *Estado vazio do Painel:* o balão sai do Papo da cadeira que já está no cartão; nenhuma imagem nova (o caranguejo é o segundo personagem).

Coadjuvantes (caranguejo e gaivota):
- São **decorativos** e aparecem só nos estados vazios, sempre nas bordas do cartão, nunca sobre texto ou botão.
- Contam no limite de **2 personagens por tela**: num estado vazio com coadjuvante, o Papo espiando dos filtros e o do menu lateral somem.
- Mesmo tratamento do Papo: `alt=""`, `aria-hidden="true"`, sem animação.

Posições lidas nas telas de `docs/design/telas/` (arquivos em `frontend/src/assets/papo/` e `frontend/src/assets/personagens/`):

| Local | Arquivo | Tela de referência |
|---|---|---|
| Menu lateral, atrás do cartão do usuário (desktop) | `papo-espiando.png` (oculto nos estados vazios com coadjuvante) | `componentes/Sidebar.dc.html` |
| Painel, atrás do cartão Saldo (desktop) | `papo-espiando.png`; `papo-preocupado.png` se saldo < 0 | `app/painel/Painel.dc.html`, `Painel_Negativo.dc.html` |
| Painel mobile, ao lado do seletor de mês | `papo-espiando.png` (pequeno) | `app/painel/Painel_Mobile.dc.html` |
| Estado vazio do Painel | `papo-cadeira-acenando.png` + `caranguejo.png` | `app/painel/Painel_Vazio.dc.html`, `Painel_Mobile_Vazio.dc.html` |
| Transações, atrás da borda dos filtros (desktop) | `papo-espiando.png` (some no estado vazio e com o toast aberto) | `app/transacoes/Transacoes.dc.html` |
| Estado vazio de Transações | `papo-espiando-lado.png` (borda esquerda) + `gaivota.png` (borda direita) | `app/transacoes/Transacoes_Vazio.dc.html`, `Transacoes_Mobile_Vazio.dc.html` |
| Categorias, ao lado do título Receitas (desktop) | `papo-sentado-moeda.png` (some com diálogo de exclusão ou toast aberto) | `app/categorias/Categorias.dc.html` |
| Diálogo de categoria em uso (exclusão bloqueada) | `papo-preocupado.png` | `app/categorias/Categorias_Excluir.dc.html` |
| Toast de sucesso | `papo-joinha.png` (40px) | `app/transacoes/Transacoes_Salva.dc.html` |
| Dica do Papo, desktop (balão ligado ao Papo do cartão Saldo) | `papo-espiando.png`, `papo-preocupado.png` ou `papo-joinha.png`, conforme o tipo da dica | — (19/11/2026, seção 6) |
| Dica do Papo, mobile (cartão abaixo do Resumo) | mesma pose, 48px, à esquerda do texto | — (19/11/2026, seção 6) |
| Login: padrão / carregando / erro | `papo-cadeira-acenando.png` / `papo-animado.png` / `papo-preocupado.png` | `login/Main.dc.html`, `LoginB_*`, `Mobile_*` |

No login o personagem faz parte da cena de praia, que é a vitrine (princípio 3); o limite de 72px vale só para as telas internas.

## 7. Ferramentas

| Ferramenta | Uso |
|---|---|
| Claude (claude.ai) | Debate das direções, crítica das iterações, prompts de design |
| Claude Design | Layout das telas, estados, tokens de design |
| [FERRAMENTA de geração de imagens] | Mascote e tentativas de cenário |
| Claude Code | Implementação das telas no frontend |

## 8. Tokens

Os valores exatos (cores, tipografia, raios, sombras, espaçamentos) estão em `frontend/src/styles/tokens.css` (variáveis CSS usadas pelo app) e em `docs/design/tokens.json`, exportados do Claude Design, e são a fonte da verdade para o tema do Tailwind. As telas exportadas ficam em `docs/design/telas/`, os PNGs dos personagens em `frontend/src/assets/papo/` e `frontend/src/assets/personagens/`, e os componentes de referência em `docs/design/referencias/`.
