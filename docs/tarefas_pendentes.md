# 📋 Tarefas Pendentes

Este documento lista o status das tarefas em andamento e o que ainda precisa ser feito no sistema.

---

## ✅ Concluído Recentemente (Sprint: 2026-02-25)

### Módulo de Clientes — Enhancements

- [x] **Geração de Descrição com IA**: Botão "Gerar com IA" na aba Identificação integrado com Google Places + OpenAI GPT-4o-mini.
- [x] **Importação de Horários via Google Maps**: Botão "Importar do Google Maps" na aba Horário, com mapeamento correto de múltiplos períodos por dia (manhã + tarde → open/close único).
- [x] **4 Telefones com WhatsApp Principal**: Aba Contato expandida com 4 número (Principal, Secundário, Celular, Outro/0800) e seleção via radio de qual é o WhatsApp.
- [x] **Email opcional**: Campo de e-mail não é mais obrigatório.
- [x] **Campo Responsável marcado como obrigatório** visualmente (`*`).
- [x] **Toggle Arquivo/Link na Mídia**: Aba de mídia permite escolher entre enviar arquivo (PDF/IMG, até 10MB) ou inserir link externo.
- [x] **Erros amigáveis na Galeria**: Upload com mensagens de erro detalhadas ao falhar.
- [x] **Fix de Ordem de Rotas**: Rotas estáticas `/clientes/ai-description` e `/clientes/google-hours` movidas para antes do `apiResource` para evitar conflito com `{id}`.
- [x] **Migração `client_materials`**: Nova tabela para materiais de clientes (arquivo ou link).
- [x] **Migração `contatos`**: Adicionados campos `telefone_outro`, `whatsapp_selected`, `exibir_*`.

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

### 1.2 Configuração OpenAI e Google Places
- [ ] Garantir que `OPENAI_API_KEY` no VPS tenha saldo e permissão para `gpt-4o-mini`.
- [ ] Garantir que `GOOGLE_PLACES_KEY` no VPS tenha as APIs **Places API** e **Places Details API** habilitadas no Google Cloud Console.

---

## 🟡 PRIORIDADE 2: Refinamento de UX

### 2.1 Módulo de Clientes — Melhorias Futuras
- [ ] **Salvar `client_materials`**: Implementar o endpoint para persistir os materiais (arquivo ou link) na nova tabela `client_materials` no momento do save.
- [ ] **Exibição de WhatsApp no site público**: Consumir `whatsapp_selected` para exibir o botão do WhatsApp correto no perfil público do cliente.
- [ ] **Horários no site público**: Consumir o campo `horario_atendimento` (JSON) para exibir os horários de funcionamento no perfil público.

### 2.2 Visibilidade do Botão de Orçamento (Fase 2.5)
- [ ] **Integração no Frontend Público**: Consumir o campo `quotes_enabled` para ocultar o botão "Pedir Orçamento" quando `false`.

---

## 🔵 PRIORIDADE 3: Qualidade de Dados e Monitoramento

### 3.1 Higienização da Base de Clientes
- [ ] Levantar lojistas ativos com `celular` vazio na tabela `contatos`.
- [ ] Campanha interna para atualizar os contatos.

### 3.2 Estabilidade da Fila (Queue)
- [ ] Monitorar se o Job `GenerateAiQuoteResponse` está sendo processado sem erros.
- [ ] Verificar logs em: `storage/logs/laravel.log`.

---

## 🟣 PRIORIDADE 4: Tracking e Dashboards

### 4.1 Integração de Eventos no Site Público
- [ ] **WhatsApp, Waze e Redes Sociais**: Importar `trackInteraction` e disparar nos cliques dos botões do site público.
- [ ] **Validar Page Views**: Confirmar tracking após deploy.

### 4.2 Dashboards
- [x] **Dashboards Funcionais**: Botões de navegação conectados e operacionais.
- [ ] **Deploy de Assets**: Rodar `npm run build` no servidor para compilar a biblioteca `recharts`.

---

## 🔮 FASE 3: Visão de Futuro (Pós-Lançamento)

### 5.1 Rastreabilidade de Respostas (Orçamentos)
- [ ] Configurar Webhook na Z-API apontando para o servidor.
- [ ] Implementar endpoint de recepção no Laravel para marcar orçamentos como "Cliente Respondeu".

### 5.2 Histórico de Chat
- [ ] Criar interface para o lojista ver mensagens trocadas no painel.
