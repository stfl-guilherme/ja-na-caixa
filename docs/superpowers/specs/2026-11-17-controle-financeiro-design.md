# Spec de Design — Controle Financeiro Pessoal

| Campo | Valor |
|---|---|
| Disciplina | Engenharia de Software — Trabalho de G2 (AMF) |
| Autor | Guilherme |
| Modalidade | Individual (autorizado pela professora) |
| Data da spec | 17/11/2026 |
| Apresentação | 24/11/2026 |
| Status | Rascunho para revisão (ver `docs/ia/registro-uso-ia.md`) |

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
controle-financeiro/
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
└── README.md
```

## 4. Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Backend | Python 3.12, Django 5, Django REST Framework | Autor já domina Django; DRF padroniza CRUD e validação |
| Banco | SQLite | Projeto local; zero configuração |
| Frontend | React + TypeScript + Vite | Exigência de portfólio; tipagem do contrato da API |
| UI | Tailwind CSS + shadcn/ui + componentes do 21st.dev | Visual polido; componentes copiáveis |
| Estado do servidor | TanStack Query | Loading, erro e cache sem código manual repetido |
| Rotas | React Router | Navegação entre páginas da SPA |
| Gráficos | Recharts | Base dos gráficos do shadcn |
| Testes backend | pytest + pytest-django | |
| Testes frontend | Vitest + React Testing Library | |

> Licenças: cada componente do 21st.dev usado deve ter licença verificada e anotada no README.

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
| cor | CharField(7) | hexadecimal `#RRGGBB`; padrão `#64748B` |
| criado_em | DateTimeField | `auto_now_add` |

Restrições:
- `UniqueConstraint(Lower("nome"), "usuario", name="categoria_nome_unico_por_usuario")`.
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
| GET | `/api/auth/csrf/` | Define o cookie `csrftoken` |
| POST | `/api/auth/login/` | `{username, password}` → `200 {id, username}` ou `400` |
| POST | `/api/auth/demo/` | Autentica no usuário `demo`; `404` se `DEMO_ENABLED=False` |
| POST | `/api/auth/logout/` | Encerra a sessão |
| GET | `/api/auth/me/` | Usuário atual ou `401` |

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

### 6.4 Resumo (dashboard)

`GET /api/resumo/?mes=AAAA-MM`

```json
{
  "mes": "2026-11",
  "receitas": "4500.00",
  "despesas": "2310.45",
  "saldo": "2189.55",
  "por_categoria": [
    {"categoria_id": 3, "nome": "Mercado", "cor": "#22C55E", "tipo": "DESPESA", "total": "820.30"}
  ]
}
```

### 6.5 Convenções
- Valores monetários trafegam como **string** decimal (`"1234.56"`), que é o padrão do DRF. O frontend **não soma dinheiro**: todo total vem do backend.
- Objeto de outro usuário retorna **`404`**, não `403`, para não revelar que o objeto existe.
- Erros de validação no formato padrão do DRF: `{"campo": ["mensagem"]}`.

## 7. Usuário de demonstração

- Comando `python manage.py seed_demo` cria o usuário `demo`, cerca de 8 categorias e cerca de 60 transações distribuídas nos últimos 3 meses.
- `--reset` apaga e recria os dados do `demo`.
- Setting `DEMO_ENABLED` (padrão `True` em desenvolvimento) liga ou desliga `/api/auth/demo/`.
- A senha do `demo` **não** fica no frontend. O backend autentica direto no endpoint.

## 8. Telas

| Rota | Tela | Conteúdo |
|---|---|---|
| `/login` | Login | Formulário usuário/senha + botão "Entrar como demonstração" |
| `/` | Dashboard | Seletor de mês; cards Receitas / Despesas / Saldo; gráfico de despesas por categoria; 5 últimas transações |
| `/transacoes` | Transações | Tabela paginada; filtros (mês, categoria, tipo, busca); modal criar/editar; confirmação ao excluir |
| `/categorias` | Categorias | Lista com cor e tipo; modal criar/editar; exclusão bloqueada com mensagem quando há transações |

Regras de interface:
- Rotas protegidas: sem sessão (`/auth/me` → 401), redireciona para `/login`.
- Toda tela tem estados de **carregando** (skeleton), **vazio** (mensagem + ação) e **erro** (toast).
- Erros de validação do backend aparecem no campo correspondente do formulário.
- Moeda exibida com `Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"})`.
- Entrada de valor aceita formato brasileiro (`1.234,56`) e é convertida para `"1234.56"` antes do envio.
- Responsivo: funcional a partir de 375 px de largura.

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

### Frontend
1. Formatação de moeda pt-BR.
2. Conversão da entrada `1.234,56` → `"1234.56"` (incluindo entradas inválidas).
3. Botão "Entrar como demonstração" chama o endpoint e redireciona.
4. Formulário de transação exibe os erros retornados pela API.

## 10. Critérios de aceite

- [ ] `README` permite rodar o projeto do zero seguindo só os passos escritos.
- [ ] CRUD completo de categorias e de transações pela interface.
- [ ] Dashboard mostra valores que batem com a soma das transações do mês.
- [ ] Todos os testes passam (`pytest` e `npm test`).
- [ ] Nenhum erro no console do navegador nos fluxos principais.
- [ ] Histórico do git mostra os documentos commitados antes do código.

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

## 13. Questões em aberto

- Nome final do projeto (provisório: `controle-financeiro`).
- Tema escuro: incluir ou não? (sugestão: só se sobrar tempo no dia 6).
