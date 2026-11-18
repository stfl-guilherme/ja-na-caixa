# JáNaCaixa

> Trabalho de G2 de Engenharia de Software (AMF), apresentação em 24/11/2026.

Controle financeiro pessoal: sistema web local para registrar receitas e despesas, organizá-las em categorias e acompanhar o saldo mensal.

## Funcionalidades

- Login por sessão com botão **Entrar como demonstração** (usuário `demo`, sem senha no front)
- CRUD de categorias (nome, tipo receita/despesa, cor), com exclusão bloqueada quando há transações
- CRUD de transações, com valor no formato brasileiro (`1.234,56`)
- Filtros de transações por mês, categoria, tipo e busca na descrição, com paginação (20 por página)
- Dashboard do mês: receitas, despesas, saldo, gráfico de despesas por categoria e 5 últimas transações
- Dados isolados por usuário (objetos de outro usuário retornam `404`)
- Comando `seed_demo` com ~240 transações nos últimos 12 meses
- Layout responsivo a partir de 375 px

## Stack

**Backend:** Python 3.12 · Django 5 · Django REST Framework · SQLite
**Frontend:** React · TypeScript (strict) · Vite · Tailwind CSS · componentes no padrão shadcn/ui · TanStack Query · React Router · Recharts
**Testes:** pytest-django · Vitest · React Testing Library

## Como rodar

Pré-requisitos: Python 3.12 e Node.js 20 ou superior.

### Depois de clonar

Ative os hooks versionados (bloqueiam commits com coautoria de IA):

```bash
git config core.hooksPath scripts/git-hooks
```

### Backend (terminal 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

A API fica em `http://localhost:8000/api/`.

- `python manage.py seed_demo --reset` apaga e recria os dados do `demo`.
- Para criar um usuário com senha (login pelo formulário): `python manage.py createsuperuser`. O mesmo usuário acessa o admin em `http://localhost:8000/admin/`.
- Variáveis opcionais: `DEMO_ENABLED=false` desliga o login de demonstração; `DJANGO_SECRET_KEY` e `DJANGO_DEBUG` substituem os valores de desenvolvimento.

### Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173` e clique em **Entrar como demonstração**. O Vite faz proxy de `/api` para o Django, então os dois servidores precisam estar rodando.

### Testes e verificação

```bash
cd backend && source .venv/bin/activate && pytest
cd frontend && npm test && npm run lint && npm run build
```

## Arquitetura

```
Navegador ──▶ Vite :5173 ──(proxy /api)──▶ Django + DRF :8000 ──▶ SQLite
            React SPA                      sessão + CSRF
```

- Autenticação por sessão do Django com CSRF; o proxy do Vite dá ao navegador uma única origem, sem CORS (ADR-002).
- A transação não guarda tipo nem dono: os dois vêm da categoria (ADR-004).
- Dinheiro em `Decimal`, trafegando como string; todos os totais são calculados no backend (ADR-005).

## Documentação

| Documento | Conteúdo |
|---|---|
| [Spec de design](docs/superpowers/specs/2026-11-17-ja-na-caixa-design.md) | Escopo, modelo de dados, API, telas, testes, cronograma |
| [Decisões (ADR)](docs/decisoes.md) | Escolhas de arquitetura e por quê |
| [Plano de implementação](docs/superpowers/plans/2026-11-17-ja-na-caixa-plano.md) | Tarefas, testes e commits previstos, com status |
| [Registro de uso de IA](docs/ia/registro-uso-ia.md) | Ferramentas, skills e revisão humana em cada etapa |
| [Prompt inicial](docs/ia/prompt-inicial.md) | Instruções dadas ao Claude Code para a construção autônoma |

## Uso de IA

O rascunho da spec e das decisões foi feito em conversa com o Claude (claude.ai). A revisão da spec, o plano e a implementação foram feitos pelo Claude Code, seguindo o fluxo especificar → planejar → TDD → revisar → verificar. O plugin Superpowers não estava instalado no ambiente, então esse fluxo foi seguido manualmente (ADR-006). Detalhes, commits de cada etapa e revisão humana em [docs/ia/registro-uso-ia.md](docs/ia/registro-uso-ia.md).

## Créditos de componentes

| Componente | Origem | Licença |
|---|---|---|
| Button, Input, Label, Card, Dialog, Table, Skeleton, Badge, Textarea (`frontend/src/components/ui/`) | Escritos no projeto seguindo o padrão do [shadcn/ui](https://ui.shadcn.com), sem uso da CLI (ADR-007) | MIT (shadcn/ui) |
| Primitivos de Dialog, Label e Slot | [Radix UI](https://www.radix-ui.com) via npm | MIT |
| Toasts | [sonner](https://sonner.emilkowal.ski) via npm | MIT |
| Ícones | [Lucide](https://lucide.dev) via npm | ISC |
| Gráfico | [Recharts](https://recharts.org) via npm | MIT |

Nenhum componente do 21st.dev foi usado.

## Autor

Guilherme — Sistemas de Informação, AMF
