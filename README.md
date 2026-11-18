# Controle Financeiro Pessoal

> 🚧 Em desenvolvimento — Trabalho de G2 de Engenharia de Software (AMF), apresentação em 24/11/2026.

Sistema web local para registrar receitas e despesas, organizá-las em categorias e acompanhar o saldo mensal.

## Funcionalidades (planejadas)

- Login com acesso de demonstração em um clique
- CRUD de categorias e transações
- Filtros por mês, categoria e tipo
- Dashboard com totais do mês e gráfico de despesas por categoria
- Dados isolados por usuário

## Stack

**Backend:** Python · Django · Django REST Framework · SQLite
**Frontend:** React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts
**Testes:** pytest-django · Vitest · React Testing Library

## Como rodar

> Os passos serão completados conforme a implementação avança.

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173` e clique em **Entrar como demonstração**.

### Testes
```bash
cd backend && pytest
cd frontend && npm test
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [Spec de design](docs/superpowers/specs/2026-11-17-controle-financeiro-design.md) | Escopo, modelo de dados, API, telas, testes, cronograma |
| [Decisões (ADR)](docs/decisoes.md) | Escolhas de arquitetura e por quê |
| [Plano de implementação](docs/superpowers/plans/) | Tarefas geradas a partir da spec |
| [Registro de uso de IA](docs/ia/registro-uso-ia.md) | Ferramentas, skills e revisão humana em cada etapa |

## Uso de IA

Este projeto foi desenvolvido com Claude e Claude Code, usando as skills do plugin Superpowers, com a metodologia de especificar e documentar antes de programar. Detalhes em [docs/ia/registro-uso-ia.md](docs/ia/registro-uso-ia.md).

## Créditos de componentes

<!-- Listar aqui cada componente do 21st.dev usado, com autor e licença. -->

## Autor

Guilherme — Sistemas de Informação, AMF
