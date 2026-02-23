# Módulo de Leads e CRM

O sistema de Leads do "O Vermelhinho" evoluiu para uma esteira completa de prospecção e reengajamento automático. Este documento detalha o funcionamento técnico e operacional deste módulo.

## 1. Ciclo de Vida do Lead

Os leads passam pelas seguintes etapas (status):
- **Novo:** Lead recém-chegado ou cadastrado.
- **Em Contato:** Lead em fase de negociação/conversa.
- **Qualificado:** Lead que avançou no funil e está pronto para proposta.
- **Convertido:** Lead que se tornou cliente.
- **Perdido:** Lead que não fechou negócio por algum motivo específico.

## 2. Automação de Recuperação (Esteira de 3 Meses)

Uma das funcionalidades centrais é a **Esteira de Reengajamento Automático**.

### Funcionamento:
- Quando um lead é marcado como **Perdido**, o sistema exige um **Motivo da Perda** e grava automaticamente a data no campo `lost_at`.
- Diariamente, às 10h, um comando agendado (`leads:process-lost-followup`) verifica quais leads completam ciclos de **3, 6, 9... meses** desde a data de perda.
- Para cada lead identificado, o sistema:
  1. Envia uma mensagem automática de WhatsApp via Webhook.
  2. Cria um **Ticket de Tarefa** automaticamente para o responsável original do lead (ou para o setor comercial) conferir o retorno.

## 3. Ferramentas do Gestor

O painel administrativo oferece visibilidade completa sobre o potencial de recuperação:
- **KPIs de Previsão:** Visualização de quantos leads estão previstos para recuperação "Hoje", "Amanhã" e no "Mês Atual".
- **Filtro de Recuperáveis:** Filtro especializado na listagem de leads que mostra apenas aqueles que estão no dia exato do ciclo de reengajamento.
- **Recuperação Manual:** Botões de ação rápida para disparar o WhatsApp do sistema ou agendar um ticket de tarefa manualmente para qualquer lead perdido.

## 4. Estratégia de Dados

### Campos Importantes no Banco de Dados (`leads`):
- `status`: Padronizado em minúsculo (`novo`, `em_contato`, `qualificado`, `convertido`, `perdido`).
- `lost_at`: Timestamp de quando o lead foi perdido.
- `motivo_perda`: Texto obrigatório descrevendo o porquê do lead não ter fechado.
- `data_follow_up`: Data opcional para retorno agendado.

### Integração com Tickets:
A tabela `tickets` agora possui o campo `lead_id`, permitindo que tarefas de suporte ou comercial sejam vinculadas diretamente a um lead, mantendo o histórico de prospecção separado do histórico de cliente, mas integrado ao fluxo de trabalho da equipe.
