# Fluxos Operacionais e Casos de Uso (Workflows)

Abaixo estão os fluxos de negócios vitais que orquestram o funcionamento do O Vermelhinho.

## 1. Fluxo de Geração de Slugs (Automático)
Ao salvar um Cliente no banco, o sistema intercepta a ação via o evento `booted` (no `Cliente.php`). Se o cliente não tiver um `slug`, o sistema gera um slug sanitizado baseado no `nome_fantasia` e garante que ele seja único no banco de dados, anexando um sufixo numérico (-1, -2) em caso de colisão. O agente de IA **não precisa se preocupar em gerar slugs manualmente** ao inserir novos clientes via código.

## 2. Fluxo de Checagem e Auditoria de SEO
*   **Gatilho:** O Comando Console `seo:check-rankings` roda periodicamente.
*   **Ação:** Ele pega os clientes em blocos (chunks) e enfileira (dispatch) o Job `ProcessClienteSeoJob` com delay progressivo para evitar sobrecarregar APIs externas (Rate Limit).
*   **Processamento:** O Job consulta a API do Google Search Console. Se o ranking de uma palavra-chave registrada (`seo_keywords`) sofrer uma queda brusca, o Job cria um alerta sistêmico na forma de um **Ticket** direcionado ao setor de marketing, para que uma ação corretiva seja tomada.

## 3. Fluxo de Criação de Tickets
Quando o sistema ou usuário abre um Ticket de atendimento, ele passa por validações rígidas. Por exemplo, existem regras onde um Ticket relacionado ao cadastro final do cliente só pode ser marcado como concluído se a base de dados certificar que ele possui um `logo_url` preenchido e mídias ativas na galeria.

## 4. Fluxo de Deploy Atômico (Deploy Script)
*   Gatilho Manual (Restrito).
*   Ao atualizar o frontend, o script cria uma build em `dist_new`. A pasta `dist` atual de produção só é deletada e substituída pela nova caso a compilação ocorra com sucesso absoluto. Caso ocorra erro, o deploy executa rollback no repositório inteiro.
