# Contratos de Dados e Esquema do Banco (PostgreSQL / Supabase)

Este documento descreve a estrutura das entidades centrais do banco de dados do O Vermelhinho. A IA deve consultar este documento para evitar alucinações sobre nomes de colunas que não existem.

## Tabela: `clientes` (A Entidade Central)
*Contém os dados comerciais e perfis públicos dos assinantes.*
*   `id` (PK)
*   `nome_fantasia` (String): Nome principal de exibição.
*   `slug` (String): Identificador para a URL no portal (gerado automaticamente no boot do Model).
*   `logo_url` e `banner_url` (String): Caminhos da mídia. **(Atenção: Não existe a coluna `cover_url`)**.
*   `status_assinatura` (String/Enum): Define se o cliente está ativo, inativo, pendente.
*   `exibir_no_site` (Boolean): Controla a visibilidade na vitrine pública.
*   `seo_keywords` (JSON/Array): Palavras-chave associadas ao cliente para rastreamento no Google.
*   `deleted_at` (Timestamp): Coluna vitalícia utilizada para **Soft Delete**.

## Tabela: `galerias_imagens`
*Armazena as fotos do portfólio de cada cliente.*
*   `id` (PK)
*   `cliente_id` (FK -> clientes.id)
*   `url` (String): Caminho do arquivo ou link externo.
*   `legenda` (String): Descrição da imagem.
*   `ordem` (Integer): Para controle de exibição na galeria.
*   *(Nota: A tabela não possui as colunas tradicionais de timestamps completas do Laravel, pois o model gerencia apenas `created_at`).*

## Tabela: `tickets`
*Gestão de demandas operacionais e suporte.*
*   `id` (PK)
*   `cliente_id` (FK -> clientes.id)
*   `titulo`, `descricao` (String/Text)
*   `status` (Enum: aberto, em_andamento, concluido, fechado)
*   `setor` (String): Ex: marketing, desenvolvimento.
*   *(Nota: O fechamento de um ticket pode exigir validações sistêmicas, como checar se o cliente possui logotipo cadastrado).*
