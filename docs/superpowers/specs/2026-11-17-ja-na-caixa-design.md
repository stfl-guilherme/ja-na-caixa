# Spec de Design — JáNaCaixa

> Controle financeiro pessoal. Nome na interface: **JáNaCaixa**; slug: `ja-na-caixa`.

| Campo | Valor |
|---|---|
| Disciplina | Engenharia de Software — Trabalho de G2 (AMF) |
| Autor | Guilherme |
| Modalidade | Individual (autorizado pela professora) |
| Data da spec | 17/11/2026 |
| Apresentação | 24/11/2026 |
| Status | Revisada na Fase 1 (17/11/2026), ampliada para o novo design (18/11/2026) para os modos de demonstração e o Painel em seções (18/11/2026) e para orçamento, dicas, forma de pagamento e transações fixas (19/11/2026). Ver seções 14 a 17 e `docs/ia/registro-uso-ia.md` |

---

## 1. Objetivo

Sistema web, executado **localmente**, para uma pessoa registrar as próprias receitas e despesas, organizá-las em categorias e acompanhar o saldo mensal em um painel visual.

Requisitos da avaliação que esta spec atende:

| Requisito do enunciado | Como é atendido |
|---|---|
| Sistema com banco de dados (mín. 2 tabelas) | `Categoria` e `Transacao` (+ `auth_user` do Django) |
| CRUD completo | CRUD de Categoria **e** de Transação, via API e interface |
| Especificar e documentar antes de programar | Esta spec, o plano de implementação e as decisões são commitados **antes** do código (verificável no histórico do git) |
| Entrega no GitHub com artefatos Markdown | Pasta `docs/` + `README.md` |
| Uso explícito de IA | `docs/ia/registro-uso-ia.md` |

## 2. Escopo

### Dentro do escopo (MVP)
1. Login real (sessão do Django) com botão **"Entrar como demonstração"**.
2. CRUD de categorias (nome, tipo receita/despesa, cor).
3. CRUD de transações (descrição, valor, data, categoria, observação).
4. Listagem de transações com filtro por mês, categoria e tipo.
5. Dashboard do mês: total de receitas, total de despesas, saldo, gráfico de despesas por categoria, últimas transações.
6. Isolamento por usuário: cada usuário vê e altera apenas os próprios dados.
7. Dados de demonstração gerados por comando.
8. Testes automatizados no backend e no frontend.
9. Orçamento (limite mensal) por categoria de despesa (seção 17.1).
10. Dicas do Papo: avisos por regras fixas sobre o mês (seção 17.2).
11. Forma de pagamento da transação (seção 17.3).
12. Repetir transações fixas do mês anterior (seção 17.4).

### Fora do escopo
- Cadastro de usuário pela interface (usuários criados por comando/admin).
- Recuperação de senha, e-mail, 2FA.
- Múltiplas contas bancárias, cartões, parcelamento e recorrência **automática** (as transações fixas são repetidas por ação do usuário, seção 17.4).
- Metas de economia e orçamento com histórico por mês (o limite mensal da seção 17.1 vale para todos os meses, ADR-021).
- Importação/exportação (CSV, OFX).
- Deploy em servidor (pós-apresentação, para portfólio).

## 3. Arquitetura

```
┌──────────────────────────┐        /api/*        ┌──────────────────────────┐
│ Frontend (SPA)           │ ───────────────────▶ │ Backend (API REST)       │
│ React + TypeScript       │   JSON + cookie de   │ Django + DRF             │
│ Vite (dev: :5173)        │   sessão + CSRF      │ (dev: :8000)             │
└──────────────────────────┘                      └────────────┬─────────────┘
                                                               │
                                                        ┌──────▼──────┐
                                                        │ SQLite      │
                                                        └─────────────┘
```

- Em desenvolvimento, o Vite faz **proxy** de `/api` para `http://localhost:8000`. O navegador enxerga uma única origem, então não é necessário configurar CORS e o cookie de sessão funciona normalmente. Decisão registrada em ADR-002.
- Autenticação por **sessão do Django** com proteção CSRF (sem JWT).
- **Acesso pelo celular na rede local (ADR-020):** `npm run celular` gera o build de produção e o serve com `vite preview --host`, na porta 5173 de todas as interfaces; o Vite mostra o endereço da rede (ex.: `http://192.168.1.106:5173`). O proxy de `/api` reescreve os cabeçalhos `Host` e `Origin` para `localhost`, então o Django aceita a requisição **com qualquer IP**, sem configurar `ALLOWED_HOSTS` nem `CSRF_TRUSTED_ORIGINS` a cada rede. O Django continua escutando só em `127.0.0.1:8000`. `npm run dev:rede` faz o mesmo com o servidor de desenvolvimento (mais lento no celular).

### Estrutura do repositório

```
ja-na-caixa/
├── backend/
│   ├── config/              # settings, urls, wsgi
│   ├── financas/            # app: models, serializers, views, tests
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # cliente HTTP, tipos da API
│   │   ├── components/      # UI (shadcn / 21st.dev)
│   │   ├── pages/           # Login, Dashboard, Transacoes, Categorias
│   │   └── lib/             # formatação de moeda/data
│   └── package.json
├── docs/
├── scripts/git-hooks/    # hook commit-msg versionado
└── README.md
```

## 4. Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Backend | Python 3.12, Django 5, Django REST Framework | Autor já domina Django; DRF padroniza CRUD e validação |
| Banco | SQLite | Projeto local; zero configuração |
| Frontend | React + TypeScript + Vite | Exigência de portfólio; tipagem do contrato da API |
| UI | Tailwind CSS + componentes no padrão shadcn/ui (escritos no projeto, ADR-007); aviso de sucesso próprio com o Papo joinha (o `sonner` saiu do projeto) | Visual polido; componentes copiáveis |
| Estado do servidor | TanStack Query | Loading, erro e cache sem código manual repetido |
| Rotas | React Router | Navegação entre páginas da SPA |
| Gráficos | SVG próprio (novo design, ADR-014) | Os gráficos do design (linha, barras espelhadas, treemap, barras anuais) são desenhados à mão em SVG com escalas próprias; o Recharts saiu do projeto por não ter mais uso |
| Testes backend | pytest + pytest-django | |
| Testes frontend | Vitest + React Testing Library | |

> Licenças: cada componente externo usado deve ter licença verificada e anotada no README. Componentes do 21st.dev só entram se instaláveis pela CLI do shadcn (ver ADR-007).

## 5. Modelo de dados

```
auth_user (Django)
   │ 1
   │
   │ N
Categoria ───────────────┐
   │ 1                   │
   │                     │
   │ N                   │
Transacao                │
(dono = categoria.usuario)
```

### 5.1 Categoria

| Campo | Tipo | Regras |
|---|---|---|
| id | AutoField | PK |
| usuario | FK → User | `on_delete=CASCADE` |
| nome | CharField(50) | obrigatório; único por usuário, sem diferenciar maiúsculas |
| tipo | CharField(7) | `RECEITA` ou `DESPESA` |
| cor | CharField(7) | hexadecimal `#RRGGBB` (validado por regex); padrão `#64748B` |
| limite_mensal | DecimalField(12, 2) | opcional (`null`); se preenchido, > 0 e só em `DESPESA` (seção 17.1) |
| criado_em | DateTimeField | `auto_now_add` |

Restrições:
- `UniqueConstraint(Lower("nome"), "usuario", name="categoria_nome_unico_por_usuario")`. A API valida antes de salvar e responde `400` (`{"nome": [...]}`), nunca `500`.
- **O `tipo` não pode ser alterado se a categoria já tiver transações.** Senão, todas as transações antigas mudariam de sinal retroativamente.

### 5.2 Transacao

| Campo | Tipo | Regras |
|---|---|---|
| id | AutoField | PK |
| categoria | FK → Categoria | `on_delete=PROTECT` |
| descricao | CharField(120) | obrigatório |
| valor | DecimalField(12, 2) | **sempre > 0**; o sinal vem do tipo da categoria |
| data | DateField | obrigatório; sem hora (evita problemas de fuso) |
| observacao | TextField | opcional |
| forma_pagamento | CharField(14) | escolhas fixas; padrão `NAO_INFORMADO` (seção 17.3) |
| fixa | BooleanField | padrão `False` (seção 17.4) |
| repetida_de | FK → Transacao | opcional; `on_delete=SET_NULL`, `related_name="repeticoes"` (seção 17.4) |
| criado_em | DateTimeField | `auto_now_add` |
| atualizado_em | DateTimeField | `auto_now` |

Restrições e índices:
- `CheckConstraint(check=Q(valor__gt=0), name="transacao_valor_positivo")`.
- Índice em `(categoria, data)`.

Decisões de modelagem (detalhes em `docs/decisoes.md`):
- A transação **não** guarda `tipo` nem `usuario`. Os dois são derivados da categoria, o que elimina por construção a inconsistência de ter uma "despesa" dentro de uma categoria de receita.
- `Decimal`, nunca `float`, para dinheiro.

## 6. API REST

Base: `/api/`. Todas as rotas, exceto `auth/csrf`, `auth/login` e `auth/demo`, exigem usuário autenticado (`401` caso contrário).

### 6.1 Autenticação

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/auth/csrf/` | Define o cookie `csrftoken`; `204` |
| POST | `/api/auth/login/` | `{username, password}` → `200 {id, username}` ou `400 {"detail": "Usuário ou senha inválidos."}` |
| POST | `/api/auth/demo/` | Corpo opcional `{"modo": "vazio" \| "exemplo"}` (padrão `"exemplo"`). Recria os dados do usuário de demonstração do modo e autentica nele → `200 {id, username}`; `400 {"modo": [...]}` se o modo for inválido; `404` se `DEMO_ENABLED=False` (ver seção 7) |
| POST | `/api/auth/logout/` | Encerra a sessão; `204` |
| GET | `/api/auth/me/` | `200 {id, username}` ou `401` |

O DRF responde `403` para requisições sem autenticação quando só a sessão está configurada. A API usa uma autenticação de sessão que define o header `WWW-Authenticate`, para que a resposta seja `401` como especificado (ADR-008).

### 6.2 Categorias

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/categorias/?tipo=` | Lista as categorias do usuário |
| POST | `/api/categorias/` | Cria |
| GET | `/api/categorias/{id}/` | Detalha |
| PUT/PATCH | `/api/categorias/{id}/` | Atualiza (`400` se tentar mudar o `tipo` com transações) |
| DELETE | `/api/categorias/{id}/` | Exclui; **`409`** se houver transações: `{"detail": "...", "transacoes": N}` |

> O `ProtectedError` precisa ser capturado e convertido em `409`. Sem esse tratamento, a exclusão retorna `500`.

### 6.3 Transações

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/transacoes/?mes=AAAA-MM&categoria=&tipo=&busca=&page=` | Lista paginada (20/página), ordem `-data, -id` |
| POST | `/api/transacoes/` | Cria |
| GET/PUT/PATCH/DELETE | `/api/transacoes/{id}/` | CRUD |

Validação: `categoria` deve pertencer ao usuário logado (`400` caso contrário).

Filtros: `mes` no formato `AAAA-MM` (inválido → `400 {"mes": [...]}`); `categoria` = id; `tipo` = `RECEITA`/`DESPESA` (tipo da categoria); `busca` = trecho da descrição, sem diferenciar maiúsculas.

Resposta paginada: `{"count", "next", "previous", "results", "totais", "totais_por_dia"}`. Cada transação traz, além dos campos do modelo, os campos somente leitura `categoria_nome`, `categoria_cor` e `tipo` (derivados da categoria).

Totais da listagem (novo design, seção 15), calculados no backend sobre **todas** as transações que passam pelos filtros, não só sobre a página:

```json
"totais": {"receitas": "6686.42", "despesas": "3711.81", "saldo": "2974.61"},
"totais_por_dia": [
  {"data": "2026-11-17", "saldo": "-81.60"},
  {"data": "2026-11-16", "saldo": "-189.33"}
]
```

- `totais` alimenta a linha "24 transações · Receitas + R$ … · Despesas − R$ …" do cartão de filtros.
- `totais_por_dia` traz o saldo do dia (receitas − despesas que passam pelos filtros) **só para as datas presentes na página atual**, em ordem decrescente de data. Alimenta o total de cada grupo de dia na lista do celular.

### 6.4 Resumo (dashboard)

`GET /api/resumo/?mes=AAAA-MM` (sem `mes`, usa o mês atual; `mes` inválido → `400`)

```json
{
  "mes": "2026-11",
  "receitas": "6686.42",
  "despesas": "3711.81",
  "saldo": "2974.61",
  "por_categoria": [
    {"categoria_id": 3, "nome": "Moradia", "cor": "#2F6FB2", "tipo": "DESPESA", "total": "1830.00", "quantidade": 2}
  ],
  "mes_anterior": {"mes": "2026-10", "receitas": "6420.00", "despesas": "4105.60", "saldo": "2314.40"},
  "serie_diaria": [
    {"data": "2026-11-01", "receitas": "5200.00", "despesas": "1450.00", "saldo_acumulado": "3750.00"},
    {"data": "2026-11-02", "receitas": "0.00", "despesas": "380.00", "saldo_acumulado": "3370.00"}
  ]
}
```

- `por_categoria` lista as categorias, dos dois tipos, que têm transações no mês, em ordem decrescente de total. `quantidade` é o número de transações da categoria **no mês** (a tela de Categorias mostra "N transações em novembro"). O treemap do painel usa só as de tipo `DESPESA`.
- `mes_anterior` traz os totais do mês imediatamente anterior, para a comparação dos cartões de métrica. Em janeiro, o mês anterior é dezembro do ano anterior (`2026-01` → `2025-12`). Mês anterior sem transações → totais `"0.00"`.
- `serie_diaria` tem **um item por dia do mês**, do dia 1 ao último dia (28 a 31 itens), inclusive dias sem transações (`"0.00"`). `saldo_acumulado` é a soma de `receitas − despesas` do dia 1 até aquele dia, **só dentro do mês** (não carrega saldo de meses anteriores). Alimenta o gráfico "Saldo do mês" e o gráfico espelhado "Entradas e saídas por dia". No mês corrente, o front desenha a linha só até a data de hoje (corte de exibição, sem conta).
- Os campos antigos (`mes`, `receitas`, `despesas`, `saldo`, `por_categoria`) não mudam de formato; os novos são acréscimos.

### 6.5 Convenções
- Valores monetários trafegam como **string** decimal (`"1234.56"`), que é o padrão do DRF. O frontend **não soma dinheiro**: todo total, inclusive saldo acumulado, totais por dia, por mês e por filtro, vem do backend. O front só faz contas de **exibição** que não produzem valores em reais: percentuais (variação vs mês anterior, fatia de cada categoria), escala dos gráficos e a contagem animada, que sempre termina exatamente no valor recebido.
- Objeto de outro usuário retorna **`404`**, não `403`, para não revelar que o objeto existe.
- Erros de validação no formato padrão do DRF: `{"campo": ["mensagem"]}`.

### 6.6 Resumo anual

`GET /api/resumo/anual/?ano=AAAA` (sem `ano`, usa o ano atual; `ano` fora do formato de 4 dígitos ou menor que 1 → `400 {"ano": [...]}`)

```json
{
  "ano": 2026,
  "receitas": "71000.00",
  "despesas": "54107.41",
  "saldo": "16892.59",
  "meses": [
    {"mes": "2026-01", "receitas": "6100.00", "despesas": "4890.00", "saldo": "1210.00"},
    {"mes": "2026-12", "receitas": "0.00", "despesas": "0.00", "saldo": "0.00"}
  ]
}
```

- `meses` tem sempre **12 itens**, de janeiro a dezembro, inclusive meses sem transações (`"0.00"`). Alimenta o gráfico "Ano em resumo".
- `ano` vem como número; os valores, como string decimal.
- Mesmas regras de isolamento e de autenticação das outras rotas (`401` sem login; só as transações do usuário logado entram na soma).

## 7. Usuário de demonstração

Há **dois** usuários de demonstração, separados, um por modo (ADR-018):

| Modo | Usuário | Dados após cada entrada |
|---|---|---|
| `exemplo` (padrão) | `demo` | Apaga as categorias e transações do `demo` e roda o seed de novo: 8 categorias e cerca de 240 transações (20 por mês) nos **últimos 12 meses**, incluindo o mês atual até hoje, com datas relativas ao mês atual |
| `vazio` | `demo-vazio` | Apaga todas as categorias e transações do `demo-vazio`: a conta começa sem nada |

- **A cada login de demonstração, os dados daquele usuário são recriados.** Sair e entrar de novo apaga o que foi lançado (efeito colateral aceito, ADR-018).
- Os dois usuários são criados pelo próprio endpoint se ainda não existirem, com senha inutilizável (`set_unusable_password`, ADR-009): só entram pelo botão de demonstração, nunca pelo formulário. Não há mais o `503` por falta de `seed_demo`.
- Um usuário de demonstração nunca vê os dados do outro (isolamento normal da seção 6.5).
- `POST /api/auth/demo/` sem corpo ou sem `modo` usa `exemplo`, para não quebrar chamadas existentes. `modo` diferente de `vazio`/`exemplo` → `400 {"modo": ["Use \"vazio\" ou \"exemplo\"."]}`.
- Setting `DEMO_ENABLED` (padrão `True` em desenvolvimento) liga ou desliga `/api/auth/demo/` nos dois modos (`404` quando desligado; o modo nem é validado).
- Comando `python manage.py seed_demo [--modo exemplo|vazio] [--reset]`: cria o usuário do modo (padrão `exemplo`). Sem `--reset`, não mexe em dados existentes; com `--reset`, recria como no login. Continua útil para preparar o banco antes da apresentação, mas não é mais obrigatório.
- As cores das categorias do `demo` são da paleta fixa de 10 cores do design (`--jnc-cat-*`, ver `frontend/src/styles/tokens.css`). O cenário é parecido com `docs/design/dados-exemplo.json` (salário, freelance, moradia, mercado etc.), sem copiá-lo.
- A senha dos usuários de demonstração **não** fica no frontend. O backend autentica direto no endpoint.

## 8. Telas

O visual segue `docs/design/decisoes-de-design.md` (fonte da verdade do design) e as telas exportadas em `docs/design/telas/`. Resumo:

| Rota | Tela | Conteúdo |
|---|---|---|
| `/login` | Login | Cena de praia + cartão (desktop) ou cena no topo sobre areia (mobile < 720px); formulário usuário/senha; botão "Entrar como demonstração", que expande no mesmo cartão uma escolha entre "Ver com dados de exemplo" (destacada) e "Começar do zero", com "Voltar"; estados padrão, carregando (na opção escolhida) e erro |
| `/` | Painel | Fluxo vertical de seções, cada uma com título (h2) e descrição: "Resumo de [mês]" (cartões Receitas / Despesas / Saldo, clicáveis); "Como seu saldo evoluiu" (linha do saldo acumulado); "Entradas e saídas por dia" (barras espelhadas); "Para onde foi o dinheiro" (treemap + tabela das maiores categorias); "Seu ano até agora" (barras dos 12 meses); "Últimas transações" (5). Estado vazio (com guia de 2 passos quando não há categorias) e estado de saldo negativo |
| `/transacoes` | Transações | Filtros (tipo em botões segmentados, categoria, busca) com totais do filtro; tabela (desktop) ou lista agrupada por dia (mobile); paginação (20/página); modal criar/editar; confirmação ao excluir; estados carregando, vazio e toast |
| `/categorias` | Categorias | Seções Receitas e Despesas com total do mês; cartões com quantidade e total do mês; modal com 10 cores fixas; tipo bloqueado quando há transações; diálogo informativo quando a exclusão é bloqueada |

Regras de interface:
- Layout: menu lateral (248px) no desktop e barra inferior + botão flutuante "+" abaixo de 720px. O **seletor de mês é global** (vale para Painel, Transações e Categorias, guardado na URL como `?mes=AAAA-MM`). A ação "+ Nova transação" abre o modal a partir de qualquer tela.
- Nome "JáNaCaixa" no menu e no login, em Baloo 2. Os personagens são PNGs fornecidos pelo autor (`frontend/src/assets/`); a IA só os posiciona, nunca os redesenha (ADR-013).
- Somente tema claro (ADR-010). Fundo areia clara nas telas internas; cena de praia só no login.
- Rotas protegidas: sem sessão (`/auth/me` → 401), redireciona para `/login`.
- Toda tela tem estados de **carregando** (skeleton estático), **vazio** (mensagem + ação) e **erro**.
- Erros de validação do backend aparecem no campo correspondente do formulário.
- Moeda sempre `Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"})`, com 2 casas, sinal explícito (`+ R$ 5.200,00` / `− R$ 1.450,00`, com o caractere U+2212) e seta; a cor nunca é o único sinal.
- Valor no modal com máscara de centavos (o usuário digita só números); data no formato `dd/mm/aaaa` com máscara. Ambos convertidos para o formato da API (`"1234.56"`, `"AAAA-MM-DD"`) antes do envio.
- Painel em seções (ADR-019): uma abaixo da outra, espaçamento ≥ 48px; gráficos com altura ≥ 280px no desktop, eixos e unidades (R$, dias, meses) sempre rotulados, tooltip ao passar o mouse; barra superior com o seletor de mês fixa ao rolar.
- Onboarding do modo vazio: sem nenhuma categoria, o Painel mostra os passos "1. Crie uma categoria · 2. Lance sua primeira transação", com o passo atual destacado e um botão para ele. No modal "Nova transação", o usuário escolhe primeiro o tipo (receita ou despesa); sem categorias daquele tipo, o select dá lugar a "Você ainda não tem categorias de [receita/despesa]" + "Criar categoria", que abre o modal de categoria já com o tipo e, ao salvar, volta para a transação com a categoria selecionada.
- Comparação com o mês anterior: em **Despesas**, subir é ruim (vermelho) e cair é bom (verde); em Receitas e Saldo, o contrário. Sempre com texto ("gastou mais", "sobrou menos").
- Animação só na entrada do Painel (≈900ms), nada em loop, desligada com `prefers-reduced-motion`.
- Acessibilidade: WCAG AA, foco visível, alvos ≥ 44px (campos 48px), `aria-label` com resumo em cada gráfico e tabela equivalente escondida visualmente.
- Responsivo: funcional a partir de 375 px de largura; breakpoint único de 720px.

## 9. Testes

### Backend (obrigatórios)
1. Valor `<= 0` é rejeitado.
2. Nome de categoria duplicado (ignorando maiúsculas) no mesmo usuário é rejeitado; em usuários diferentes é permitido.
3. Excluir categoria com transações → `409`, e nada é excluído.
4. Alterar o `tipo` de categoria com transações → `400`.
5. **Isolamento:** o usuário B recebe `404` ao acessar, editar ou excluir objetos do A, e as listagens do B não contêm dados do A.
6. Criar transação com categoria de outro usuário → `400`.
7. Rotas sem login → `401`.
8. Login demo funciona nos dois modos; `vazio` deixa `demo-vazio` sem dados e apaga o que foi criado antes; `exemplo` recria o seed do `demo`; os dois não veem dados um do outro; sem `modo` usa `exemplo`; modo inválido → `400`; com `DEMO_ENABLED=False` → `404`.
9. Filtro `mes` retorna apenas transações do mês.
10. Resumo calcula com precisão decimal (ex.: `0.10 + 0.20 == 0.30`).
11. Série diária: um item por dia do mês, saldo acumulado correto, mês sem transações com zeros, precisão decimal, isolamento.
12. Mês anterior: totais corretos e virada de ano (`2026-01` compara com `2025-12`).
13. `quantidade` por categoria conta só as transações do mês.
14. Resumo anual: 12 meses, meses vazios com zeros, precisão decimal, isolamento, `ano` inválido → `400`, sem login → `401`.
15. Totais da listagem de transações respeitam os filtros e somam todas as páginas; `totais_por_dia` cobre as datas da página.

### Frontend
1. Formatação de moeda pt-BR.
2. Conversão da entrada `1.234,56` → `"1234.56"` (incluindo entradas inválidas).
3. Botão "Entrar como demonstração" chama o endpoint e redireciona.
4. Formulário de transação exibe os erros retornados pela API.
5. Componente `Personagem` renderiza o PNG com `alt=""` e `aria-hidden="true"`; no Painel, troca para `papo-preocupado` com saldo negativo.
6. Comparação com o mês anterior: em Despesas, aumento é vermelho e queda é verde.
7. Máscaras de valor (centavos) e data (`dd/mm/aaaa`) e mensagens de validação do modal.
8. Seletor de mês global: trocar o mês numa tela vale para as outras.
9. Login: a escolha de demonstração abre com foco na primeira opção, envia o `modo` escolhido, mostra carregando na opção e fecha com "Voltar".
10. Onboarding: Painel sem categorias mostra os 2 passos; modal de transação sem categoria do tipo oferece "Criar categoria" e volta com ela selecionada.
11. Painel: títulos das seções presentes; eixos com rótulo; gráficos com `aria-label`.

## 10. Critérios de aceite

- [x] `README` permite rodar o projeto do zero seguindo só os passos escritos. *(Conferido em clone limpo: instalação, `migrate`, `seed_demo`, testes, build e os dois servidores respondendo pelo proxy.)*
- [x] CRUD completo de categorias e de transações pela interface. *(Coberto por testes de componente e pela API; uso no navegador **pendente de verificação humana**.)*
- [x] Dashboard mostra valores que batem com a soma das transações do mês. *(Testado em `test_resumo.py`; os totais vêm do backend.)*
- [x] Todos os testes passam (`pytest` e `npm test`). *(113 no backend, 152 no frontend após o novo design.)*
- [x] Nenhum erro no console do navegador nos fluxos principais. *(Roteiro automatizado em Chromium headless em 18/11/2026: só os `401`/`400` esperados de sessão e senha errada. Verificação manual pelo autor ainda **pendente**.)*
- [x] Histórico do git mostra os documentos commitados antes do código. *(Spec `f71765a` e plano `c8eac96` antes do primeiro commit de código `50e7a20`.)*

## 11. Cronograma

| Dia | Data | Entrega |
|---|---|---|
| 1 | 18/11 | Spec revisada + plano commitados; scaffold back e front; models, migrations e testes de model |
| 2 | 19/11 | API: auth, categorias, transações, resumo + testes |
| 3 | 20/11 | Front: login, layout, CRUD de categorias. **Ponto de controle** |
| 4 | 21/11 | Front: CRUD de transações + filtros |
| 5 | 22/11 | Dashboard + gráfico + `seed_demo` |
| 6 | 23/11 | Polimento visual, estados vazios/erro, README, prints, ensaio |
| 7 | 24/11 | Apresentação |

**Ponto de controle (dia 3):** se o CRUD de categorias no front não estiver funcionando até o fim do dia 20, aplicar os cortes abaixo imediatamente, sem esperar.

### Ordem de corte (do primeiro ao último)
1. Busca textual em transações.
2. Paginação (troca por limite fixo das 100 mais recentes).
3. Cor das categorias (passa a ser uma cor fixa por tipo).
4. Testes de frontend 3 e 4 (os testes de backend **não** são cortados).
5. Gráfico do dashboard (os cards de totais ficam).

## 12. Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Pouca experiência com React | Alta | Alto | Ponto de controle no dia 3 + ordem de corte |
| CSRF/sessão entre front e back | Média | Alto | Proxy do Vite (mesma origem); implementar auth no dia 2 |
| Componentes do 21st.dev com dependências pesadas ou licença restritiva | Média | Médio | Usar só componentes avulsos; checar licença antes |
| Código gerado por IA sem revisão | Média | Alto | TDD + revisão de cada tarefa registrada no log de IA |

## 13. Questões resolvidas

| Questão | Resolução |
|---|---|
| Nome final do projeto | **JáNaCaixa** (`ja-na-caixa`). |
| Tema escuro | Fora do escopo do MVP (ADR-010). |

## 14. Revisão da spec (Fase 1)

A skill `brainstorming` do Superpowers não estava instalada no ambiente. A revisão seguiu o mesmo roteiro manualmente (ADR-006). Perguntas feitas e respondidas com base na spec e nos ADRs:

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Qual o nome do projeto? | JáNaCaixa, conforme `CLAUDE.md`. Arquivo da spec renomeado. |
| 2 | Que status HTTP a API devolve sem login, já que o DRF usa `403` com sessão? | `401`, como a spec pede; via `authenticate_header` (ADR-008). |
| 3 | Como o `demo` entra sem senha no front? | O backend faz `login()` direto; o `demo` tem senha inutilizável (ADR-009). |
| 4 | O que acontece se `/auth/demo` for chamado antes do `seed_demo`? | `503` com mensagem pedindo para rodar o comando. *(Substituído na seção 16: o endpoint cria o usuário.)* |
| 5 | Nome duplicado: quem valida? | O serializer, com `400`; a constraint do banco é a última barreira. |
| 6 | `mes` inválido nos filtros? | `400` no campo `mes`. |
| 7 | `por_categoria` inclui receitas? | Sim, os dois tipos; o gráfico filtra despesas. |
| 8 | Como mostrar nome e cor da categoria na tabela de transações sem outra requisição? | Campos somente leitura `categoria_nome`, `categoria_cor`, `tipo`. |
| 9 | Como usar shadcn/ui se a CLI baixa de fora do npm? | Componentes no padrão shadcn escritos no projeto, dependências do npm (ADR-007). |
| 10 | Tema escuro? | Não (ADR-010). |
| 11 | Logo e mascote? | Texto "JáNaCaixa" como espaço reservado. |

## 15. Novo design (18/11/2026)

O design visual aprovado (`docs/design/`) pede dados que a API da seção 6 não tinha. Perguntas e respostas desta revisão:

| # | Pergunta | Resposta |
|---|---|---|
| 1 | De onde vem a linha "saldo acumulado dia a dia"? | De `serie_diaria` em `GET /api/resumo/` (6.4). O front não acumula valores. |
| 2 | Como os cartões comparam com o mês anterior sem o front subtrair valores de dois meses? | `mes_anterior` em `GET /api/resumo/` traz os três totais prontos. O front só calcula o **percentual** de variação, que é exibição. |
| 3 | E em janeiro? | `mes_anterior` é dezembro do ano anterior. Coberto por teste. |
| 4 | De onde vem o "Ano em resumo"? | Novo `GET /api/resumo/anual/?ano=AAAA` (6.6), com os 12 meses. |
| 5 | A tela de Categorias mostra "N transações em novembro" e o total do mês. De onde? | `por_categoria[].quantidade` e `por_categoria[].total` do resumo do mês; o total de cada seção é `receitas`/`despesas` do mesmo resumo. |
| 6 | O cartão de filtros de Transações e os grupos por dia do celular mostram totais. Quem soma? | O backend, em `totais` e `totais_por_dia` da listagem (6.3). |
| 7 | O protótipo pagina de 10 em 10; a spec diz 20. | Mantidos 20 por página (6.3). Diferença registrada. |
| 8 | O seed tinha 3 meses e cores fora da paleta. | Seed com 12 meses e cores da paleta (seção 7). |
| 9 | Fontes Baloo 2 e Plus Jakarta Sans vêm do Google Fonts nas telas exportadas. | Instaladas via npm (`@fontsource`), sem depender de rede em tempo de execução (ADR-015). |
| 10 | O mascote estava fora do escopo da IA. | Continua: o autor forneceu os PNGs; a IA só os posiciona conforme a seção 6 de `decisoes-de-design.md` (ADR-013). |

## 16. Modos de demonstração e Painel em seções (18/11/2026)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Por que dois usuários e não um com os dados trocados? | Assim um modo nunca apaga os dados do outro no meio de uma apresentação, e o isolamento entre usuários continua valendo (ADR-018). |
| 2 | O `seed_demo` ainda é necessário? | Não. O endpoint cria o usuário do modo se ele não existir. O comando continua existindo, com `--modo`. |
| 3 | O botão antigo (sem corpo) continua funcionando? | Sim: sem `modo`, usa `exemplo`. |
| 4 | O texto da opção de exemplo diz "Três meses de receitas e despesas"? | O seed gera 12 meses (seção 7). O texto passa a ser "Um ano de receitas e despesas para explorar o painel.", para não prometer algo diferente do que aparece. |
| 5 | Como o modal sabe de que tipo é a categoria a criar? | O modal ganha uma escolha de tipo (Despesa/Receita) antes da categoria; o select só lista as categorias desse tipo. O tipo continua vindo da categoria na API (ADR-004): a escolha só filtra a lista. |
| 6 | O bento sai? | Sim, substituído pelo fluxo vertical (ADR-019); os componentes de gráfico são reaproveitados com mais altura e eixos rotulados. |


## 17. Novas funcionalidades (19/11/2026)

Quatro funcionalidades, implementadas **nesta ordem**, cada uma completa (backend + frontend, suíte verde, commit e push) antes da próxima: orçamento por categoria → dicas do Papo → forma de pagamento → repetir transações fixas. Se uma delas não ficar estável, os commits dela são revertidos, o motivo vai para `docs/decisoes.md` e o trabalho para; as anteriores ficam. Decisões: ADR-021 a ADR-027.

### 17.1 Orçamento por categoria

**Modelo.** `Categoria.limite_mensal`: `DecimalField(12, 2, null=True, blank=True)` (ADR-021). Migration reversível (só `AddField`).

**Regras.**
- Se preenchido, `limite_mensal > 0`; `0` ou negativo → `400 {"limite_mensal": [...]}`.
- Só categorias `DESPESA` têm limite. Criar ou editar uma `RECEITA` com limite → `400 {"limite_mensal": [...]}`.
- Mudar de `DESPESA` para `RECEITA` (permitido só sem transações, seção 5.1) exige remover o limite **no mesmo request** (`"limite_mensal": null`). Se o limite continuar (enviado ou já gravado), `400 {"limite_mensal": ["Categorias de receita não têm limite. Remova o limite para mudar o tipo."]}`.
- O limite vale para todos os meses e não tem histórico (ADR-021).

**API.**
- O CRUD de categorias aceita e devolve `limite_mensal` (string decimal ou `null`). Sem o campo no corpo, o limite não muda (na criação, fica `null`). Para remover, envie `"limite_mensal": null`.
- `GET /api/orcamentos/?mes=AAAA-MM` (sem `mes`, mês atual; inválido → `400`; sem login → `401`): categorias de **despesa** do usuário **com limite**, em ordem alfabética:

```json
[{"categoria_id": 5, "nome": "Lazer", "cor": "#8C6A0C", "limite": "300.00", "gasto": "382.50",
  "percentual": "127.50", "excesso": "82.50", "situacao": "estourado"}]
```

- `gasto`: soma das transações da categoria no mês (`"0.00"` sem gastos). `percentual = gasto / limite × 100`, com 2 casas (arredondamento meio para cima). `excesso = gasto − limite` quando positivo, senão `"0.00"`. O campo `excesso` foi acrescentado ao contrato do prompt para o front não subtrair dinheiro (seção 6.5).
- `situacao` pelo percentual **exato** (antes do arredondamento): `ok` se < 80%; `atencao` de 80% a 100% (inclusive); `estourado` se > 100%.

**Telas.**
- Modal de categoria: campo "Limite mensal (opcional)" com a mesma máscara de centavos do valor da transação, **visível só quando o tipo é Despesa**. Trocar para Receita esconde o campo e envia `limite_mensal: null`. Campo vazio = sem limite.
- Painel: seção "Orçamentos de [mês]", logo depois de "Resumo de [mês]", com uma barra por categoria: "R$ 340,00 de R$ 500,00 (68%)" e o estado **também em texto**: "Dentro do limite", "Atenção" ou "Limite ultrapassado em R$ X". O percentual exibido é o inteiro truncado (79,99% → 79%), e a barra fica cheia acima de 100%. Sem categorias com limite → "Nenhuma categoria com limite. Defina limites em Categorias." com link para `/categorias`.
- Categorias: a mesma barra no cartão de cada categoria com limite, para o mês selecionado.

**Testes.** Limite em receita → 400; limite ≤ 0 → 400; troca de tipo com limite (com e sem remover no mesmo request); limites de situação exatos (79,99% / 80% / 100% / 100,01%); mês sem gastos (`"0.00"`, `ok`); só categorias com limite e só de despesa; isolamento; sem login → 401. Front: formatação da barra, texto do estado nos três casos, campo de limite só para despesa, mensagem sem limites.

### 17.2 Dicas do Papo

**Endpoint.** `GET /api/dicas/?mes=AAAA-MM` (exige login; sem `mes`, mês atual; inválido → `400`). Lista ordenada por prioridade, **no máximo 3**, cada regra gera no máximo uma dica:

```json
[{"id": "orcamento_estourado", "tipo": "alerta", "texto": "Lazer passou do limite em R$ 82,50.",
  "link": "/transacoes?categoria=5&mes=2026-11"}]
```

`tipo`: `alerta` | `info` | `parabens` | `primeiros_passos`. `link` pode ser `null`. Regras **determinísticas**, sem IA (ADR-022).

**Regras, em ordem de prioridade.**

| # | id | tipo | Quando | Texto | link |
|---|---|---|---|---|---|
| 1 | `orcamento_estourado` | alerta | categoria acima de 100% do limite (várias → a de maior excesso em R$) | "X passou do limite em R$ Y." | `/transacoes?categoria=ID&mes=M` |
| 2 | `mes_no_vermelho` | alerta | despesas > receitas no mês | "O mês está no vermelho até agora: as despesas passaram as receitas em R$ X." | `/transacoes?tipo=DESPESA&mes=M` |
| 3 | `orcamento_perto` | info | categoria de 80% a 100% do limite (várias → a de maior percentual) | "X já usou Y% do limite de [mês]." (Y truncado) | `/transacoes?categoria=ID&mes=M` |
| 4 | `categoria_cresceu` | info | maior aumento em R$ de uma categoria de despesa em relação ao mês anterior, se o aumento for **≥ 20% e ≥ R$ 50,00** | "X subiu Y% em relação a [mês anterior] (mais R$ Z)." (Y truncado) | `/transacoes?categoria=ID&mes=M` |
| 5 | `concentracao` | info | uma categoria com **mais de 40%** das despesas do mês (a maior) | "X concentra Y% das despesas de [mês]." (Y truncado) | `/transacoes?categoria=ID&mes=M` |
| 6 | `despesas_cairam` | parabens | total de despesas menor que no mês anterior | "Suas despesas caíram R$ X em relação a [mês anterior]. Boa!" | `null` |
| 7a | `primeira_categoria` | primeiros_passos | usuário sem categorias | "Crie sua primeira categoria para começar." | `/categorias` |
| 7b | `primeira_transacao` | primeiros_passos | nenhuma transação no mês | "Lance sua primeira transação de [mês]." | `null` |

Detalhes:
- **Primeiros passos substituem as demais** (ADR-022): sem categorias → só a 7a; com categorias e sem transações no mês → só a 7b. Assim nunca aparece "suas despesas caíram" num mês ainda sem lançamentos.
- Regras 4 e 6 são ignoradas se o mês anterior não tiver despesas. A regra 4 só compara categorias que tiveram gasto no mês anterior (sem gasto anterior o percentual não existe).
- Virada de ano: o mês anterior de janeiro é dezembro do ano anterior.
- Valores em BRL (`R$ 1.234,56`, formatados no backend) e meses por extenso em minúsculas ("novembro").
- Tom informativo: os textos nunca usam "demais", "exagerou" ou julgamento parecido (coberto por teste).
- Isolamento por usuário; sem login → `401`.

**Telas.**
- Painel, **desktop**: balão de fala acima dos cartões do Resumo, alinhado à direita e com a ponta apontando para o Papo que espia no cartão Saldo; não cobre números nem o título. **Mobile**: cartão de largura total logo abaixo do Resumo, com o Papo pequeno (48px) à esquerda do texto.
- Pose do Papo pela dica exibida: `alerta` → `papo-preocupado`; `parabens` → `papo-joinha`; `info` e `primeiros_passos` → `papo-espiando`. Com saldo negativo, o Papo do cartão Saldo continua `papo-preocupado` (regra antiga da seção 6 do design).
- Uma dica por vez. Com mais de uma, botão "Próxima dica (1/3)" (posição atual / total), que volta para a primeira depois da última. Botão "Ver transações" quando houver `link` (para `/categorias`, "Ver categorias").
- O texto é conteúdo real dentro de `<section aria-label="Dicas do Papo">`, com `aria-live="polite"`; a imagem continua `alt=""` e `aria-hidden`.
- Sem dicas ou erro na requisição → o balão não aparece e o painel funciona normalmente.
- Estado vazio do Painel (mês sem movimento): o balão aparece dentro do cartão vazio, saindo do Papo da cadeira que já está lá, sem acrescentar outra imagem (limite de 2 personagens com o caranguejo).

**Testes.** Cada regra isolada com os limites exatos (19,99% vs 20%; R$ 49,99 vs R$ 50,00; 40% vs 40,01%; 80% / 100%); ordenação; máximo de 3; virada de ano; mês anterior vazio; primeiros passos; isolamento; 401 sem login; tom. Front: alternância (inclusive a volta à primeira), pose por tipo, botão de link, ausência sem dicas e com erro.

### 17.3 Forma de pagamento

**Modelo.** `Transacao.forma_pagamento`: `CharField(max_length=14)` com as escolhas abaixo; padrão `NAO_INFORMADO` (ADR-023). A migration adiciona a coluna com o padrão, o que preenche as transações existentes; é reversível.

| Valor | Rótulo |
|---|---|
| `PIX` | Pix |
| `CARTAO_CREDITO` | Cartão de crédito |
| `CARTAO_DEBITO` | Cartão de débito |
| `DINHEIRO` | Dinheiro |
| `BOLETO` | Boleto |
| `TRANSFERENCIA` | Transferência |
| `NAO_INFORMADO` | Não informado |

**API.**
- CRUD de transações com `forma_pagamento` (opcional na criação, padrão `NAO_INFORMADO`; valor fora da lista → `400 {"forma_pagamento": [...]}`). A resposta traz também `forma_pagamento_rotulo` (somente leitura).
- Filtro `?forma_pagamento=` na listagem (valor inválido → `400`).
- `GET /api/resumo/` ganha `despesas_por_forma`: `[{forma, rotulo, total, percentual}]`, só despesas do mês, só formas com total > 0, em ordem decrescente de total, com `NAO_INFORMADO` sempre por último. `percentual` = fatia das despesas do mês, string com 2 casas. Mês sem despesas → `[]`. Os campos antigos não mudam.

**Telas.**
- Modal de transação: select "Forma de pagamento" (rótulo "Forma de recebimento" quando o tipo escolhido for Receita), com "Não informado" como padrão.
- Transações: no desktop, coluna "Forma" com ícone + rótulo; no celular, o rótulo junto da categoria. Filtro "Forma de pagamento" ao lado do de categoria (vai para a URL como `forma`).
- Painel: seção "Como você pagou", depois de "Para onde foi o dinheiro", com barras horizontais por forma (rótulo, valor e percentual). "Não informado" aparece por último. Sem despesas → "Nenhuma despesa em [mês]."

**Testes.** Valor inválido → 400; padrão na criação e nos registros existentes (migration); filtro; totais por forma com precisão decimal e ordem (não informado por último); isolamento. Front: select com o rótulo certo para receita, coluna e filtro na listagem, seção do painel.

### 17.4 Repetir transações fixas

**Modelo** (ADR-024).
- `Transacao.fixa`: `BooleanField(default=False)`.
- `Transacao.repetida_de`: `ForeignKey("self", null=True, blank=True, on_delete=SET_NULL, related_name="repeticoes")`. Somente leitura na API de CRUD (só o endpoint de repetir preenche).

**API.**
- `GET /api/transacoes/fixas-para-repetir/?mes=AAAA-MM` (`mes` obrigatório; inválido → `400`): transações **fixas do mês anterior** ao informado que ainda **não** têm cópia no mês informado (nenhuma transação do mês com `repetida_de` = original), em ordem de data. Cada item traz os campos da transação mais `data_sugerida`.
- `POST /api/transacoes/repetir-fixas/` com `{"mes": "AAAA-MM", "ids": [..]}`: cria as cópias no mês informado e responde `201` com a lista das criadas.
- Regras:
  - Data da cópia: o mesmo dia do mês; se o dia não existir no mês de destino, o último dia (31/01 → 28/02, ou 29/02 em ano bissexto).
  - Copia descrição, valor, categoria, forma de pagamento e observação; `fixa=True`; `repetida_de` = original.
  - **Idempotência:** id que já tem cópia no mês de destino é ignorado (não duplica nem dá erro). Repetir duas vezes cria só uma vez.
  - `ids` deve ser uma lista não vazia de inteiros. Id de outro usuário, inexistente, não fixo ou fora do mês anterior → `400 {"ids": [...]}`, e nada é criado.
  - Virada de ano: repetir em `2027-01` usa as fixas de `2026-12`.
  - Excluir a original não apaga a cópia (`SET_NULL`).

**Telas.**
- Modal de transação: checkbox "Repete todo mês (fixa)".
- Transações: botão "Repetir fixas de [mês anterior]" (secundário, acima dos filtros) que abre um modal com a lista (descrição, categoria, valor, data sugerida), todas marcadas, com a possibilidade de desmarcar, e o botão "Lançar N transações" (N = marcadas; desabilitado com 0). Lista vazia → "Nenhuma transação fixa de [mês anterior] para repetir."
- Ao lançar, o modal fecha e aparece o aviso de sucesso com o `papo-joinha` ("N transações lançadas.").

**Testes.** Cópia de todos os campos; ajuste de fim de mês (31/01 → 28/02 e 29/02 em ano bissexto); idempotência (repetir duas vezes); ids de outro usuário → 400; não fixas → 400; fora do mês anterior → 400; virada de ano (dezembro → janeiro); exclusão da original não apaga a cópia; a listagem para repetir some depois de repetir. Front: checkbox no modal, lista marcada, desmarcar muda o "Lançar N", lista vazia, aviso de sucesso.

### 17.5 Seed de demonstração

O modo `exemplo` passa a demonstrar tudo no **mês atual** (ADR-025):
- Limites em 3 categorias de despesa, calculados sobre o gasto do mês atual: Mercado em ~60%, Restaurantes em ~85% e Lazer estourado.
- Transporte com aumento ≥ 20% e ≥ R$ 50 em relação ao mês anterior (uma "Revisão do carro" no mês atual).
- Formas de pagamento variadas, incluindo algumas `NAO_INFORMADO`.
- Fixas em todos os meses: salário, aluguel, internet e streaming, cada cópia com `repetida_de` apontando para a do mês anterior. No mês atual, salário e aluguel já estão repetidos e **internet e streaming ficam sem repetir**, para o botão "Repetir fixas" ter o que mostrar.
- Teste: o seed gera ao menos 2 dicas e ao menos 2 fixas para repetir no mês atual. O modo `vazio` continua vazio.

### 17.6 Perguntas e respostas desta revisão

| # | Pergunta | Resposta |
|---|---|---|
| 1 | O front calcula "Limite ultrapassado em R$ X"? | Não: o backend devolve `excesso` (seção 6.5, o front não soma dinheiro). |
| 2 | Qual percentual aparece na tela, 79,99% ou 80%? | O inteiro truncado (79%), coerente com a situação `ok`. A API manda 2 casas. |
| 3 | Primeiros passos convivem com as outras dicas? | Não: sem dados, só a dica de primeiros passos (ADR-022). |
| 4 | Categoria sem gasto no mês anterior conta como "a que mais cresceu"? | Não: sem base, não há percentual (ADR-022). |
| 5 | Repetir um id já repetido dá erro? | Não: é ignorado (idempotência); só ids inválidos dão `400`. |
| 6 | A cópia também é fixa? | Sim (`fixa=True`), para poder ser repetida no mês seguinte. |
| 7 | Onde o filtro por forma fica na URL? | `?forma=`, como `tipo` e `categoria`; a API recebe `forma_pagamento`. |
| 8 | O Papo da dica conta no limite de 2 personagens? | Sim. No desktop é o mesmo Papo do cartão Saldo; no celular, o da dica e o do cabeçalho são os dois da tela. |
