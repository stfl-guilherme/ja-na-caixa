# JáNaCaixa

> Trabalho de G2 de Engenharia de Software (AMF), apresentação em 24/11/2026.

Controle financeiro pessoal: sistema web local para registrar receitas e despesas, organizá-las em categorias e acompanhar o saldo mensal.

## Funcionalidades

- Login por sessão com botão **Entrar como demonstração**, em dois modos: com dados de exemplo ou começando do zero (sem senha no front)
- CRUD de categorias (nome, tipo receita/despesa, cor), com exclusão bloqueada quando há transações
- CRUD de transações, com valor no formato brasileiro (`1.234,56`)
- Filtros de transações por mês, categoria, tipo e busca na descrição, com paginação (20 por página)
- Painel do mês em seções verticais, cada uma com título e descrição: resumo (receitas, despesas e saldo com comparação ao mês anterior), saldo acumulado dia a dia, entradas × saídas por dia, despesas por categoria (treemap + tabela), ano até agora e 5 últimas transações; eixos rotulados e tooltips; estados vazio e de saldo negativo
- Seletor de mês global (vale para Painel, Transações e Categorias) e "+ Nova transação" a partir de qualquer tela
- Visual próprio: cena de praia no login, mascote Papo (jacaré-de-papo-amarelo) como decoração acessível, tokens de design em `frontend/src/styles/tokens.css`
- Dados isolados por usuário (objetos de outro usuário retornam `404`)
- Dados de demonstração recriados a cada entrada: ~240 transações nos últimos 12 meses (modo exemplo) ou conta vazia com guia de primeiros passos (modo vazio)
- Layout responsivo a partir de 375 px (menu lateral ≥ 720 px; barra inferior e botão "+" abaixo disso)

## Stack

**Backend:** Python 3.12 · Django 5 · Django REST Framework · SQLite
**Frontend:** React · TypeScript (strict) · Vite · Tailwind CSS · componentes no padrão shadcn/ui · TanStack Query · React Router · gráficos em SVG próprio
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
python manage.py seed_demo        # opcional: o login de demonstração já cria os dados
python manage.py runserver
```

A API fica em `http://localhost:8000/api/`.

- `python manage.py seed_demo --reset` apaga e recria os dados do `demo`; `--modo vazio` prepara o `demo-vazio`.
- Para criar um usuário com senha (login pelo formulário): `python manage.py createsuperuser`. O mesmo usuário acessa o admin em `http://localhost:8000/admin/`.
- Variáveis opcionais: `DEMO_ENABLED=false` desliga o login de demonstração; `DJANGO_SECRET_KEY` e `DJANGO_DEBUG` substituem os valores de desenvolvimento.

### Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173` e clique em **Entrar como demonstração** (detalhes abaixo). O Vite faz proxy de `/api` para o Django, então os dois servidores precisam estar rodando.

### Abrir no celular (mesma rede Wi-Fi)

Com o backend rodando (terminal 1), no lugar do `npm run dev`:

```bash
cd frontend
npm run celular
```

O comando gera o build e mostra o endereço da rede, por exemplo `Network: http://192.168.1.106:5173/`. Abra esse endereço no celular, conectado **ao mesmo Wi-Fi** do computador. O IP pode mudar de uma rede para outra; não é preciso configurar nada no Django (ADR-020).

- Se não abrir, libere a porta 5173 no firewall do computador (no Ubuntu: `sudo ufw allow 5173/tcp`).
- Mudanças no código só aparecem no celular depois de rodar `npm run celular` de novo. Para recarregamento automático (mais lento no celular), use `npm run dev:rede`.
- Use só em rede confiável: o app fica visível para todos da rede.

### Como usar a demonstração

Na tela de login, **Entrar como demonstração** abre duas opções no próprio cartão:

| Opção | Usuário | O que você encontra |
|---|---|---|
| **Ver com dados de exemplo** (destacada) | `demo` | 8 categorias e cerca de 240 transações nos últimos 12 meses, com datas relativas ao mês atual: o Painel já abre com todos os gráficos |
| **Começar do zero** | `demo-vazio` | Uma conta vazia. O Painel guia em 2 passos: criar uma categoria e lançar a primeira transação. No modal "Nova transação", se não houver categoria do tipo escolhido, dá para criá-la ali mesmo |

- **Os dados de demonstração são recriados a cada entrada** (ADR-018). Sair e entrar de novo apaga o que foi lançado. Para guardar dados, crie um usuário próprio com `python manage.py createsuperuser` e entre pelo formulário.
- Os dois usuários são separados: um não vê os dados do outro.
- A API aceita `POST /api/auth/demo/` com `{"modo": "exemplo"}` ou `{"modo": "vazio"}`; sem `modo`, usa `exemplo`.
- `DEMO_ENABLED=false` desliga os dois modos.

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
| [Plano do novo design](docs/superpowers/plans/2026-11-18-novo-design.md) | Tarefas do novo visual (backend e frontend), verificação e diferenças conhecidas |
| [Decisões de design](docs/design/decisoes-de-design.md) | Princípios visuais, mascote, regras dos personagens (fonte da verdade do design) |
| [Telas do design](docs/design/README.md) | Export do Claude Design (`docs/design/telas/`) e como lê-lo |
| [Screenshots](docs/screenshots/) | Telas implementadas em 1440 px e 375 px |
| [Registro de uso de IA](docs/ia/registro-uso-ia.md) | Ferramentas, skills e revisão humana em cada etapa |
| [Prompt inicial](docs/ia/prompt-inicial.md) | Instruções dadas ao Claude Code para a construção autônoma |
| [Prompt do novo design](docs/ia/prompt-design.md) | Instruções para implementar o novo design |
| [Prompt dos modos de demonstração](docs/ia/prompt-demo-painel.md) | Instruções para os modos de demonstração, o onboarding e o Painel em seções |

## Uso de IA

O rascunho da spec e das decisões foi feito em conversa com o Claude (claude.ai). A revisão da spec, o plano e a implementação foram feitos pelo Claude Code, seguindo o fluxo especificar → planejar → TDD → revisar → verificar. O plugin Superpowers não estava instalado no ambiente, então esse fluxo foi seguido manualmente (ADR-006). Detalhes, commits de cada etapa e revisão humana em [docs/ia/registro-uso-ia.md](docs/ia/registro-uso-ia.md).

## Créditos de componentes

| Componente | Origem | Licença |
|---|---|---|
| Button, Dialog, Skeleton (`frontend/src/components/ui/`) | Escritos no projeto seguindo o padrão do [shadcn/ui](https://ui.shadcn.com), sem uso da CLI (ADR-007) | MIT (shadcn/ui) |
| Primitivos de Dialog e Slot | [Radix UI](https://www.radix-ui.com) via npm | MIT |
| Ícones | [Lucide](https://lucide.dev) via npm | ISC |
| Fontes Plus Jakarta Sans e Baloo 2 | [Fontsource](https://fontsource.org) via npm (ADR-015) | SIL Open Font License 1.1 |
| Gráficos do Painel (linha do saldo, barras espelhadas, treemap, contagem animada, cartão de métrica) | Escritos no projeto em React + SVG, **inspirados** em componentes do [21st.dev](https://21st.dev) (Analytics Bento, ondas espelhadas, treemap, DashboardMetricCard). Nenhum código foi copiado: os arquivos de referência não vieram no export (`docs/design/referencias/`, ADR-012) e foram adaptados conforme o ADR-014 | Código próprio; a licença das referências deve ser conferida quando os arquivos forem adicionados |
| Mascote Papo, caranguejo e gaivota (`frontend/src/assets/`) | Ilustrações fornecidas pelo autor (gerador de imagens; ver `docs/design/decisoes-de-design.md`) | Uso no projeto |
| Layout, cores e telas | Claude Design, a partir das decisões do autor (`docs/design/`) | — |

## Autor

Guilherme — Sistemas de Informação, AMF
