# 📋 Tarefas Pendentes — Módulo de Orçamentos com IA

Este documento lista as ações necessárias para finalizar a implementação e garantir a operação plena do sistema de orçamentos e notificações.

---

## 🔴 PRIORIDADE 1: Configuração e Ativação (Produção)

### 1.1 Configuração Z-API (WhatsApp)
- [ ] **Provisionar Instância**: Criar/Acessar conta na Z-API.
- [ ] **Pareamento**: Escanear o QR Code usando o número oficial do "O Vermelhinho".
- [ ] **Variáveis de Ambiente**: Configurar o `.env` no servidor VPS (`/var/www/backend/.env`):
  ```env
  ZAPI_INSTANCE_ID=...
  ZAPI_TOKEN=...
  ZAPI_CLIENT_ID=...
  ```
- [ ] **Reset de Cache**: Após editar o .env, rodar `php artisan config:cache` no VPS.

### 1.2 Configuração OpenAI
- [ ] Garantir que a `OPENAI_API_KEY` no VPS tenha saldo e permissão para o modelo GPT-4 (necessário para gerar os rascunhos de alta qualidade).

---

## 🟡 PRIORIDADE 2: Refinamento de UX (Site Público)

### 2.1 Visibilidade do Botão de Orçamento (Fase 2.5)
- [ ] **Integração no Frontend Público**: O desenvolvedor do site principal deve consumir o campo `quotes_enabled` (booleano) retornado pelo endpoint de detalhes do cliente.
- [ ] **Lógica**: Ocultar o botão "Pedir Orçamento" para qualquer lojista que retorne `quotes_enabled: false`.
- [ ] **Motivo**: Evitar frustração do usuário ao solicitar algo que o lojista não será notificado por falta de WhatsApp cadastrado.

---

## 🔵 PRIORIDADE 3: Qualidade de Dados e Monitoramento

### 3.1 Higienização da Base de Clientes
- [ ] Realizar um levantamento dos lojistas ativos que estão com o campo `celular` vazio na tabela `contatos`.
- [ ] Campanha interna para atualizar esses contatos, permitindo que eles comecem a receber leads de orçamento.

### 3.2 Estabilidade da Fila (Queue)
- [ ] Monitorar se o Job `GenerateAiQuoteResponse` está sendo processado sem erros.
- [ ] Verificar logs periodicamente em: `storage/logs/laravel.log`.

---

## � PRIORIDADE 4: Tracking e Dashboards (Novo Módulo)

### 4.1 Integração de Eventos no Site Público
- [ ] **WhatsApp, Waze e Redes Sociais**: O desenvolvedor do site principal deve importar o `trackInteraction` do arquivo `@/lib/tracking` e disparar a função nos cliques dos respectivos botões.
- [ ] **Validar Page Views**: Confirmar se o tracking de visualização de página está funcionando corretamente após o deploy.

### 4.2 Dashboards
- [x] **Dashboards Funcionais**: Botões de navegação para "Fila de Foco", "Clientes" e "Nova Vaga" conectados e operacionais.
- [ ] **Deploy de Assets**: Rodar `npm run build` no servidor para compilar a biblioteca `recharts`.
- [ ] **Carga Inicial de Dados**: Como o sistema de tracking é novo, os gráficos começarão vazios. Considerar um script de "warm-up" ou aguardar 7 dias de tráfego real para ver as curvas de performance.

---

## �🔮 FASE 3: Visão de Futuro (Pós-Lançamento)

### 4.1 Rastreabilidade de Respostas
- [ ] Configurar Webhook no painel da Z-API apontando para o servidor.
- [ ] Implementar endpoint de recepção no Laravel para marcar orçamentos como "Cliente Respondeu" automaticamente.

### 4.2 Histórico de Chat
- [ ] Criar interface para o lojista ver as mensagens trocadas anteriormente diretamente no painel.
