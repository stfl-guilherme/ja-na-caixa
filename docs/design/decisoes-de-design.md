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
| Ondas espelhadas desktop × mobile | Usado como **receitas acima × despesas abaixo, por dia**; animação contínua removida | Animação em loop faz dado financeiro parecer instável |
| Treemap por categoria | Usado para **despesas por categoria**, com a cor de cada categoria e contraste automático do texto | Lê melhor que pizza com muitas categorias |
| Radar de sazonalidade | **Descartado**, substituído por barras dos 12 meses | O componente suaviza a forma (ajuste de Fourier), então o desenho não representa os valores reais. Inaceitável em dados financeiros. |
| Contagem animada dos números | Usada com formatação **BRL e 2 casas** | O original arredondava para inteiro, sumindo com os centavos |
| Cartão de métrica (DashboardMetricCard) | Usado nos cartões Receitas/Despesas/Saldo, com **semântica invertida em despesas** (subir = vermelho) | No original, subir era sempre verde |
| Hover com "levantar" + cursor de clique | Mantido apenas porque o cartão passou a ser clicável (abre Transações filtrada) | Evitar affordance falsa |
| framer-motion | Não adotado | Dependência inteira para um efeito resolvível em CSS |

Créditos e licenças dos componentes de referência: ver README.

### Telas
- **Layout:** menu lateral (desktop) / barra inferior (mobile), seletor de mês global, ação "+ Nova transação" sempre acessível.
- **Painel (bento):** 3 cartões de métrica, saldo acumulado, entradas × saídas por dia, treemap de despesas + top 5, ano em resumo, últimas transações.
- **Transações:** filtros, tabela (desktop) ou cartões agrupados por dia (mobile), modal de criar/editar, confirmação de exclusão.
- **Categorias:** seções Receitas e Despesas, modal com 10 cores pré-aprovadas em contraste, tipo bloqueado quando há transações.

## 6. Regras do personagem nas telas internas

- Sempre nas bordas; nunca sobre textos, números, gráficos, tabelas, botões ou campos.
- Efeito "espiando": imagem atrás do cartão, só cabeça e ombros acima da borda.
- Máximo de 72px visíveis no desktop; no máximo 2 aparições por tela.
- Sem animação contínua; `aria-hidden`.
- Mobile: só em estados vazios, diálogos e topo do Painel.
- Única exceção informativa: com saldo negativo, o Papo do Painel troca para a pose preocupada. O saldo continua em vermelho e com sinal de menos, então a informação não depende do personagem.

| Local | Pose |
|---|---|
| Menu lateral | `papo-coco` |
| Painel (cartão Saldo) | `papo-bracos-cruzados` / `papo-preocupado` se saldo < 0 |
| Transações (filtros) | `papo-regata` |
| Categorias (título Receitas) | `papo-prancha` |
| Estado vazio do Painel | `papo-cadeira` |
| Estado vazio de Transações | `papo-melancia` |
| Diálogo de categoria em uso | `papo-preocupado` |
| Toast de sucesso | `papo-joinha` |

## 7. Ferramentas

| Ferramenta | Uso |
|---|---|
| Claude (claude.ai) | Debate das direções, crítica das iterações, prompts de design |
| Claude Design | Layout das telas, estados, tokens de design |
| [FERRAMENTA de geração de imagens] | Mascote e tentativas de cenário |
| Claude Code | Implementação das telas no frontend |

## 8. Tokens

Os valores exatos (cores, tipografia, raios, sombras, espaçamentos) estão em `frontend/src/styles/tokens.css` (variáveis CSS usadas pelo app) e em `docs/design/tokens.json`, exportados do Claude Design, e são a fonte da verdade para o tema do Tailwind. As telas exportadas ficam em `docs/design/telas/`, os PNGs dos personagens em `frontend/src/assets/papo/` e `frontend/src/assets/personagens/`, e os componentes de referência em `docs/design/referencias/`.
