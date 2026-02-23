# Documentação do Módulo de Tickets

O módulo de Tickets atua como a central de atendimento e gerenciamento de tarefas operacionais da agência O Vermelhinho. Ele foi desenhado para organizar as demandas internas (Financeiro, Suporte, Administrativo e Criativo) e para facilitar o fluxo de comunicação entre a equipe e o cliente.

---

## 1. Visão Geral (Descritiva)

Os tickets são registros rastreáveis usados para acompanhar o progresso de solicitações específicas de um cliente. Em vez de utilizar e-mails ou mensagens soltas, todas as interações e responsabilidades ficam centralizadas em um único lugar.

### Ciclo de Vida do Ticket
Um ticket nasce `aberto`, é `atribuído` a um responsável, transita para `em andamento`, podendo passar por estágios de espera (`aguardando cliente` / `aguardando interno`), e finalmente ser `resolvido`, `concluído`, `fechado` ou `cancelado`.

### Componentes de um Ticket
- **Setores (Filas):** Os tickets são organizados em setores (`criativo`, `suporte`, `financeiro`, `admin`). Apenas usuários com as permissões e cargos (Roles) correspondentes conseguem visualizar ou assumir demandas desses setores.
- **Responsável (Assignee):** Quem está ativamente trabalhando na solução do ticket.
- **SLA e Prazos:** Existe uma data limite de vencimento (`due_at`). Baseado nesta data, o ticket alerta sobre riscos de atraso de forma automática.
- **Subtarefas (Checklist):** Listas sequenciais dentro de um único ticket para fragmentar o trabalho e orientar o responsável.
- **Timeline de Histórico (Logs):** Tudo que acontece no ticket (mudança de status, nova atribuição, comentários da equipe) é salvo em um histórico à prova de adulterações. Acompanha inclusive quem executou a ação e a data/hora exata.
- **Cliente e Metadados:** O ticket está sempre vinculado a um cliente. A área de metadados (`meta`) permite o vínculo automático com faturas de cobrança, disparos sistêmicos ou referências cruzadas invisíveis.

### Automações Presentes
O sistema age ativamente na criação de tickets em cenários críticos:
1. **Cobrança Automática:** Faturas vencidas há 3 dias sem pagamento geram, via um cron-job programado diário, um ticket no setor do `Financeiro`.
2. **Boas-vindas (Onboarding):** A criação de um novo cliente no CRM, de imediato, origina um ticket no setor de `Suporte` com SLA de 1 dia útil, instruindo a equipe a verificar cadastros e contatá-lo.

### Regras de Negócio Inflexíveis
- **Módulo Criativo:** Para evitar entregas que esbarram em detalhes cadastrais, o sistema **bloqueia** a movimentação de um ticket do setor `Criativo` para `Resolvido` ou a própria criação do mesmo se o cliente atrelado a ele não possuir em seu cadastro os campos de `Logotipo` (link válido) e itens na `Galeria de Imagens`. 

---

## 2. Visão Técnica (Arquitetura)

### Tabelas do Banco de Dados
A modelagem do módulo de tickets se expande em 3 tabelas interligadas no banco relacional `MySQL`:

- `tickets`
  - `id`, `cliente_id` (FK para Clientes), `created_by` (FK para User, anulável se criado via sistema), `assignee_id` (FK para User responsável).
  - `setor` (ENUM/String), `titulo`, `descricao`, `prioridade`, `status`.
  - `due_at` (Timestamp), `resolved_at`, `closed_at` (Para análises eficientes e cálculo de indicadores no futuro).
  - `meta` (JSON para uso genérico).
- `ticket_logs`
  - Tabela responsável pelos rastros de auditoria.
  - Guarda atributos básicos como: `ticket_id`, `user_id`, `action` (e.g. `status_changed`), e uma `message` detalhada.
- `ticket_subtasks`
  - Organiza e isola o checklist de cada ticket.
  - Campos: `ticket_id`, `title`, `is_completed` (TinyInt), `completed_at`, `completed_by` (FK para rastrear quem encerrou o checkbox).

### Controladores (Controllers)
O arquivo `TicketController.php` (API V1) implementa todos os métodos de CRUD com suas devidas validações, e engloba funções para as automações (ex: manipulação das rotas aninhadas `toggleSubtask`). E faz intenso uso de Policies e roles via [Spatie/Laravel-Permission](https://spatie.be/docs/laravel-permission).

### O Cálculo do SLA (Service Level Agreement)
Este sistema aplica a modelagem de *Domain-Driven* utilizando uma propriedade anexada da Model Eloquent (`$appends = ['sla_status']`). O accessor de `getSlaStatusAttribute()` isola a regra de verificação da seguinte forma:
- Se o campo `due_at` não existir ou o status for terminal (`fechado`, `cancelado`...): Retorna `normal` ou `completed`.
- O SLA avalia a diferença do prazo pela base atual `now()`.
- Menos de x tempo ou vencido: O model renderiza virtualmente o status `overdue` ou `warning`.

A principal vantagem deste método é entregar ao _Frontend_ a formatação do semáforo ponta-a-ponta, desobrigando o _React_ de refazer cálculos de fuso horário.

### O Comando Agendado (Scheduler)
Implementado em `app/Console/Commands/CheckOverdueInvoicesAndCreateTickets.php`. Este script rola sobre a tabela de faturas utilizando a classe nativa do Carbon no `Laravel` em busca de boletos sem liquidação. Uma vez validado que nenhuma cobrança prévia com aquela fatura repousa no nó originário de uma string *JSON (`meta->invoice_id`)* do ticket, ele dispara a criação e seu respectivo histórico de ação. Registrado e ativado via `app/Console/Kernel.php` ou `routes/console.php`.

### Frontend (React/Vite/Tailwind)
A interface baseia-se fortemente em componentização pura e performática.
Os hooks (`useTickets.ts`) invocam com paginação infinita (`@tanstack/react-query`) o Backend com queries avançadas.

- **`TicketDetailsPage.tsx`**: Tela minudada. Permite injetar metadados, listar Logs temporalmente e englobar uma funcionalidade nova de deleção, transição e adição de subtarefas (*optimistic updates* em conjunto com React Query).
- **`TicketKanbanView.tsx` e `TicketsPage.tsx`**: Tela com dupla arquitetura. Usuário seleciona se prefere o modo de Visualização por "Tabela Tradicional" ou painel "Kanban" (quadro de status) usando React States simples para a sobreposição renderizada. 

---

## 3. Notificações, Avisos e Alertas

A estrutura do módulo de Tickets possui suporte robusto a alertas nas extremidades da sua aplicação, sendo dividida nas seguintes camadas:

### Camada 1: Alertas Visuais no App (Totalmente Operante)
Toda a plataforma já injeta alertas passados do Backend:
- Barras vermelhas para avisos de tickets (`overdue`).
- Indicadores (`1/3`) na exibição rápida para sinalizar subtarefas atreladas.
- Caixas de alertas de Toast de Sucesso e Erros da API, traduzindo erros complexos provessos do banco.

### Camada 2: Notificações em Tempo Real no Frontend (Totalmente Operante)
Uma comunicação de mão dupla (WebSockets) já é aplicada em rotas chave operacionais do backend:
- Arquitetura: **Pusher** habilitado nativamente via **Laravel Reverb**.
- O envio (`Notification::send()`) usando traits de `ShouldBroadcastNow` armazena um arquivo legível na tabela local de notificações `notifications` e emite o payload para portas WS/WSS conectadas.
- **Na UI (Frontend)**: Usuários escutam o próprio canal `App.Models.User.{id}` (Pusher + Laravel Echo). Recebe um Alert UI Toast pop-up imediato sem recarregamento da tela e as notificações antigas repousam num Dropdown unificado do Sininho no Header para marcação de `lidas` pelo operador.

### Camada 3: Comunicação Multicanal Operacional (Avisando externamente)
Os mesmos eventos criados para enviar o *broadcaster Socket* acionariam _Listeners_ (na estrutura Assíncrona via filas `Redis` ou DB `Jobs`) para enviar notificações de fato pesadas:

- **Slack / Discord (Aviso do Setor):** Os tickets criados automaticamente para cobrança pingariam em um canal corporativo (`#financeiro_alertas`).
- **Emails Transacionais:** Configuração do pacote Mail nativo para que, quando o cliente criar o ticket via portal dele (futuro próximo) o Suporte ou Criativo receba uma notificação silenciosa por e-mail com os materiais indexados.
- **WhatsApp API:** Com a interligação de APIs sistêmicas consolidadas, enviar um template (HSM) automático para o desenvolvedor / Designer com um resumo contendo a _deadline_.

*Fim da Documentação.*
