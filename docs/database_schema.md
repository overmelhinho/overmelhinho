# Estrutura do Banco de Dados

Baseado nas migrations e models presentes no `backend/`, esta é a estrutura das principais tabelas persistidas no sistema:

## 1. Core e Autenticação
- `users`: Armazena os usuários do sistema administrativo.
- `roles` / `permissions` / `model_has_roles` / etc.: Gerado pelo Spatie para controle de acesso refinado.
- `personal_access_tokens`: Tokens de autenticação via Laravel Sanctum.
- `password_resets`: Controle de recuperação de senhas.
- `cache` / `jobs`: Controle de filas e cache do próprio framework Laravel.

## 2. Clientes e CRM
- `clientes`: Cadastros de empresas/entidades clientes (possui dados de recorrência e SEO).
- `cidades`: Catálogo de cidades para categorização geográfica.
- `cliente_cidade`: Tabela pivot entre clientes e cidades.
- `leads`: Contatos iniciais de vendas antes da conversão (com data_follow_up e motivo_perda).
- `oportunidades`: Oportunidades de negócios abertas e ganhas.
- `contatos` / `enderecos` / `redes_sociais`: *(Tabelas identificadas via Models relacionais aos clientes)*.

## 3. Gestão e Suporte (Tickets)
- `tickets`: Entidades centrais do helpdesk (assunto, cliente ou lead vinculado, responsável, status de kanban).
- `ticket_logs`: Histórico de interações nos tickets.
- `ticket_subtasks`: Subtarefas/checklists dentro de um ticket de atendimento.

## 4. Financeiro
- `plans`: Planos de contratação associados a clientes/sistema (possui `tiny_id` indicativo de integração).
- `invoices`: Faturas geradas (inclui dados de parcelas e justificativas).

## 5. Recrutamento e RH
- `job_roles`: Cargos disponíveis ou tabelados.
- `job_opportunities`: Vagas de emprego abertas com descritivo para atração.
- `candidates`: Currículos e candidatos aplicados para as vagas.

## 6. Mídia
- `galerias_imagens`: Repositório de imagens atreladas a entidades, gerenciando o file_path e `thumb_url`.

## 7. Logs e Sistema
- `audit_logs`: Tabela polimórfica/geral para rastrear que usuário fez qual alteração (auditoria).
- `notifications`: Tabela nativa do Laravel (database notifications) utilizada junto ao pusher/websockets para salvar notificações não lidas dos usuários.
