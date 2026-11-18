Leia o CLAUDE.md e siga todas as regras (git sem coautoria, documentação antes do código). Trabalhe de forma autônoma, fase por fase, com commits a cada etapa.

## Fase 1 — Documentação
1. Spec (docs/superpowers/specs/): seções de Usuário de demonstração, API de auth e Telas:
   - POST /api/auth/demo/ passa a receber {"modo": "vazio" | "exemplo"} (padrão "exemplo" para não quebrar chamadas existentes).
   - Dois usuários separados: demo-vazio e demo.
   - A cada login de demonstração, os dados daquele usuário são recriados: "vazio" apaga todas as categorias e transações dele; "exemplo" apaga e roda o seed de novo (datas relativas ao mês atual).
   - Continua controlado por DEMO_ENABLED; modo inválido → 400.
2. docs/decisoes.md: novo ADR que complementa o ADR-003, explicando os dois modos e por que os dados são recriados a cada entrada (demonstração previsível) e o efeito colateral (sair e entrar apaga o que foi lançado).
3. docs/design/decisoes-de-design.md: nova iteração do Painel — a versão em bento foi considerada difícil de entender; passa a ser um fluxo vertical em seções com título e descrição; o gráfico espelhado em curvas vira barras espelhadas. Registre também a escolha de demonstração na tela de login.
4. Commit: docs(spec): especificar modos de demonstração e reorganizar painel

## Fase 2 — Backend (TDD)
Testes primeiro:
- modo "vazio" autentica em demo-vazio e o usuário fica sem categorias e transações;
- modo "exemplo" autentica em demo e recria o seed;
- logar de novo em "vazio" apaga o que foi criado antes;
- usuário demo e demo-vazio não veem dados um do outro;
- modo inválido → 400; DEMO_ENABLED=False → 404;
- chamada sem "modo" continua funcionando (modo "exemplo").
Ajuste também o comando seed_demo para aceitar --modo.
Um commit por tarefa.

## Fase 3 — Login
- O botão "Entrar como demonstração" abre uma escolha com duas opções em cartões grandes e clicáveis (no mesmo cartão do login, expandindo; no mobile, empilhadas):
  1. "Ver com dados de exemplo" — "Três meses de receitas e despesas para explorar o painel." (opção destacada, é a principal)
  2. "Começar do zero" — "Uma conta vazia para lançar suas primeiras transações."
- Abaixo, texto pequeno: "Os dados de demonstração são recriados a cada entrada."
- Botão "Voltar" para fechar a escolha. Navegável por teclado; foco vai para a primeira opção ao abrir.
- Estado carregando na opção escolhida. Mantenha o visual da tela de login atual.

## Fase 4 — Onboarding do modo vazio
- Painel vazio sem nenhuma categoria: mensagem guiando em 2 passos ("1. Crie uma categoria  2. Lance sua primeira transação"), com o passo atual destacado e botão para ele.
- Modal "Nova transação" sem categorias do tipo escolhido: no lugar do select, mensagem "Você ainda não tem categorias de [receita/despesa]" + botão "Criar categoria", que abre o modal de categoria e, ao salvar, volta para a transação com ela já selecionada.
- Teste os dois comportamentos.

## Fase 5 — Painel reorganizado
Troque o grid em bento por um fluxo vertical, uma seção abaixo da outra, cada uma com título (h2) e uma linha de descrição em linguagem simples. Ordem:
1. "Resumo de [mês]" — os 3 cartões (Receitas, Despesas, Saldo) lado a lado no desktop, empilhados no mobile. Descrição: "Quanto entrou, quanto saiu e quanto sobrou."
2. "Como seu saldo evoluiu" — gráfico de linha em largura total, com eixo de datas e eixo de valores em R$. Descrição: "Saldo acumulado dia a dia ao longo do mês."
3. "Entradas e saídas por dia" — barras espelhadas (receitas para cima em verde, despesas para baixo em vermelho-coral), largura total, legenda visível. Descrição: "Cada barra é um dia: para cima o que entrou, para baixo o que saiu."
4. "Para onde foi o dinheiro" — treemap à esquerda e tabela das maiores categorias à direita (no mobile, tabela abaixo). Descrição: "Suas despesas do mês divididas por categoria."
5. "Seu ano até agora" — barras dos 12 meses, receitas e despesas lado a lado, eixo em R$. Descrição: "Compare os meses do ano."
6. "Últimas transações" — lista com link "Ver todas".

Regras:
- Gráficos com altura generosa (mínimo 280px no desktop), eixos e unidades sempre rotulados, tooltip ao passar o mouse.
- Espaçamento entre seções de pelo menos 48px; a página rola naturalmente.
- Barra superior com o seletor de mês fixa (sticky) ao rolar.
- Personagens continuam seguindo a seção 6 de decisoes-de-design.md (bordas, nunca sobre dados).
- Estado vazio e de saldo negativo continuam funcionando.
- Testes: títulos das seções presentes; eixos com rótulo; gráficos com aria-label.

## Fase 6 — Verificação
pytest, npm run build, npm run lint e npm test passando (cole a saída). Teste manual dos dois modos de demonstração, incluindo sair e entrar de novo no modo vazio. Atualize docs/ia/registro-uso-ia.md (Revisão humana = pendente) e o README (seção de como usar a demonstração). Commit e push.

Ao terminar, responda com o que mudou, as diferenças em relação ao pedido e o resultado dos testes.
