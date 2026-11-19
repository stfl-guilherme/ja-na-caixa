# Diagramas UML

Arquivos do draw.io (XML sem compressão), desenhados a partir do código. Abra em [app.diagrams.net](https://app.diagrams.net) ou no draw.io desktop. Cada página tem formato 16:9 (1920 × 1080).

## `diagrama-de-classes.drawio`

- **Domínio**: `User`, `Categoria`, `Transacao` e `TipoCategoria` (`backend/financas/models.py`), com composição User → Categoria (`CASCADE`), associação Categoria → Transacao (`PROTECT`), os atributos derivados `/tipo` e `/usuario` e notas com as restrições.
- **Camadas do backend**: as classes reais em cada camada, Models → Serializers → Views/ViewSets → URLs, com as dependências entre elas.

## `diagrama-de-atividades.drawio`

Raias: Usuário | Frontend | Backend | Banco de dados.

- **Entrar no sistema**: login com usuário e senha ou demonstração (modo “exemplo” ou “vazio”, com os dados recriados a cada entrada), até abrir o Painel.
- **Registrar transação**: do botão "Nova transação" ao `INSERT`, com a criação de categoria quando não há nenhuma do tipo escolhido, a validação no navegador e no `TransacaoSerializer` e a volta ao formulário quando há erro.
- **Excluir categoria**: aviso quando a categoria tem transações (no diálogo e pelo `409` do backend) e exclusão quando não tem.
