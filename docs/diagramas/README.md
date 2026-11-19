# Diagramas UML

Arquivos do draw.io (XML sem compressão), desenhados a partir do código. Abra em [app.diagrams.net](https://app.diagrams.net) ou no draw.io desktop. Cada página tem formato 16:9 (1920 × 1080).

## `diagrama-de-classes.drawio`

- **Domínio**: `User`, `Categoria`, `Transacao`, `TipoCategoria` e `FormaPagamento` (`backend/financas/models.py`), com composição User → Categoria (`CASCADE`), associação Categoria → Transacao (`PROTECT`), o autorrelacionamento `repetida_de` (0..1 — 0..*, `SET_NULL`), os atributos `limite_mensal`, `forma_pagamento` e `fixa`, os atributos derivados `/tipo` e `/usuario` e notas com as restrições (limite só em despesa e maior que zero; repetir não duplica).
- **Camadas do backend**: as classes reais em cada camada, Models → Serializers → Views/ViewSets → URLs, com as dependências entre elas (inclui `OrcamentosView`, `DicasView` e as ações `fixas_para_repetir` e `repetir_fixas`).

## `diagrama-de-atividades.drawio`

Raias: Usuário | Frontend | Backend | Banco de dados.

- **Entrar no sistema**: login com usuário e senha ou demonstração (modo “exemplo” ou “vazio”, com os dados recriados a cada entrada), até abrir o Painel.
- **Registrar transação**: do botão "Nova transação" ao `INSERT`, com a criação de categoria quando não há nenhuma do tipo escolhido, a validação no navegador e no `TransacaoSerializer` e a volta ao formulário quando há erro.
- **Excluir categoria**: aviso quando a categoria tem transações (no diálogo e pelo `409` do backend) e exclusão quando não tem.
- **Repetir transações fixas**: do botão "Repetir fixas de [mês anterior]" à lista com as fixas ainda não repetidas (ou o aviso de lista vazia), a escolha das transações, a validação dos ids (`400` se algum não for fixo do usuário no mês anterior), a idempotência e o `INSERT` das cópias com `repetida_de`.
