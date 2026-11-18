# Spec de Design — JáNaCaixa

> Controle financeiro pessoal. Nome na interface: **JáNaCaixa**; slug: `ja-na-caixa`.

| Campo | Valor |
|---|---|
| Disciplina | Engenharia de Software — Trabalho de G2 (AMF) |
| Autor | Guilherme |
| Modalidade | Individual (autorizado pela professora) |
| Data da spec | 17/11/2026 |
| Apresentação | 24/11/2026 |
| Status | Revisada na Fase 1 (17/11/2026) e ampliada para o novo design (18/11/2026). Ver seções 14 e 15 e `docs/ia/registro-uso-ia.md` |

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

### Fora do escopo
- Cadastro de usuário pela interface (usuários criados por comando/admin).
- Recuperação de senha, e-mail, 2FA.
- Múltiplas contas bancárias, cartões, parcelamento, transações recorrentes.
- Orçamentos e metas.
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
| UI | Tailwind CSS + componentes no padrão shadcn/ui (escritos no projeto, ADR-007) + sonner (toasts) | Visual polido; componentes copiáveis |
| Estado do servidor | TanStack Query | Loading, erro e cache sem código manual repetido |
| Rotas | React Router | Navegação entre páginas da SPA |
| Gráficos | SVG próprio (novo design, ADR-014); Recharts continua instalado | Os gráficos do design (linha, barras espelhadas, treemap, barras anuais) são desenhados à mão em SVG com escalas próprias |
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
| POST | `/api/auth/demo/` | Autentica no usuário `demo` → `200 {id, username}`; `404` se `DEMO_ENABLED=False`; `503` se o `demo` não existir (rodar `seed_demo`) |
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

- Comando `python manage.py seed_demo` cria o usuário `demo`, 8 categorias e cerca de 240 transações (20 por mês) distribuídas nos **últimos 12 meses**, incluindo o mês atual até hoje. Doze meses são necessários para o gráfico "Ano em resumo" e para a comparação com o mês anterior também em janeiro.
- As cores das categorias do `demo` são da paleta fixa de 10 cores do design (`--jnc-cat-*`, ver `frontend/src/styles/tokens.css`). O cenário é parecido com `docs/design/dados-exemplo.json` (salário, freelance, moradia, mercado etc.), sem copiá-lo.
- `--reset` apaga e recria os dados do `demo`.
- Setting `DEMO_ENABLED` (padrão `True` em desenvolvimento) liga ou desliga `/api/auth/demo/`.
- A senha do `demo` **não** fica no frontend. O backend autentica direto no endpoint. O `demo` é criado com senha inutilizável (`set_unusable_password`), então só entra pelo botão (ADR-009).

## 8. Telas

O visual segue `docs/design/decisoes-de-design.md` (fonte da verdade do design) e as telas exportadas em `docs/design/telas/`. Resumo:

| Rota | Tela | Conteúdo |
|---|---|---|
| `/login` | Login | Cena de praia + cartão (desktop) ou cena no topo sobre areia (mobile < 720px); formulário usuário/senha; botão "Entrar como demonstração"; estados padrão, carregando e erro |
| `/` | Painel | Cartões Receitas / Despesas / Saldo com comparação ao mês anterior (clicáveis: abrem Transações filtrada); "Saldo do mês" (linha do saldo acumulado); "Últimas transações" (5); "Entradas e saídas por dia" (barras espelhadas); "Para onde foi o dinheiro" (treemap de despesas + 5 maiores); "Ano em resumo" (barras dos 12 meses); estado vazio; estado de saldo negativo |
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
8. Login demo funciona; com `DEMO_ENABLED=False` → `404`.
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

## 10. Critérios de aceite

- [x] `README` permite rodar o projeto do zero seguindo só os passos escritos. *(Conferido em clone limpo: instalação, `migrate`, `seed_demo`, testes, build e os dois servidores respondendo pelo proxy.)*
- [x] CRUD completo de categorias e de transações pela interface. *(Coberto por testes de componente e pela API; uso no navegador **pendente de verificação humana**.)*
- [x] Dashboard mostra valores que batem com a soma das transações do mês. *(Testado em `test_resumo.py`; os totais vêm do backend.)*
- [x] Todos os testes passam (`pytest` e `npm test`). *(85 no backend, 70 no frontend.)*
- [ ] Nenhum erro no console do navegador nos fluxos principais. ***Pendente de verificação humana.***
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
| 4 | O que acontece se `/auth/demo` for chamado antes do `seed_demo`? | `503` com mensagem pedindo para rodar o comando. |
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

