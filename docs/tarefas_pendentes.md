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
- [x] **Infraestrutura GA4 Híbrida**: Implementado services (Reporting e Measurement Protocol) no Laravel e custom hook Analytics no React.
- [x] **Arquitetura Híbrida (Node 18 + Node 20)**: Configurado NVM na VPS para suportar simultaneamente o Dashboard/Backend (v18) e o novo Site Público (Next.js v20).
- [x] **Deploy Automatizado (Site Público)**: Script `deploy.sh` atualizado com detecção de pastas e troca automática de versão do Node via NVM.
- [x] **Setup Novo Site Público (Next.js)**: Framework instalado com Tailwind CSS v4, React Query v5 e Axios, configurado em `https://novo.overmelhinho.com.br`.
- [x] **Home Page 2026 (Disruptiva)**: Implementado Bento Grid Dinâmico, Busca VUI (IA), Scrollytelling Ads e estética Gimme Gummy.
- [x] **Search Listing Page 2026**: Criado página de resultados com "Match Perfeito" IA e Mapa Skeuomorph.
- [x] **Página do Cliente 2026**: Implementado micro-interações de conversão e fluxo de Vagas Atrito Zero.
- [x] **SSL & Redirects**: Certificado SSL (Let's Encrypt) ativo e redirecionamento HTTPS configurado em todos os subdomínios.


### Módulo Financeiro — Pagamento com Permuta

- [x] **Model & Migration de Permuta**: Adicionados campos `is_permuta`, `permuta_amount`, `payable_amount` e `permuta_description` à tabela de Invoices.
- [x] **Lógica Backend**: Modificação no `storeInvoice` para verificar se é permuta 100% (ativa plano imediatamente sem gerar recebível no Tiny) ou permuta parcial (desconta o valor e gera recebível com a diferença).
- [x] **Feedback Visual e Validação Frontend**: Campos dinâmicos no modal (Progressive Disclosure) informando o valor original, desconto, abatimento da permuta e o valor final real a ser cobrado. Mudança do botão de ação dependendo do resíduo (ex: "Confirmar Permuta e Ativar" para permuta integral).

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
- [x] **Exibição de WhatsApp no site público**: Consumir `whatsapp_selected` para exibir o botão do WhatsApp correto no perfil público do cliente.
- [x] **Horários no site público**: Consumir o campo `horario_atendimento` (JSON) para exibir os horários de funcionamento no perfil público.

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
- [x] **WhatsApp, Waze e Redes Sociais**: Importar `trackInteraction` e disparar nos cliques dos botões do site público.
- [x] **Validar Page Views**: Confirmar tracking após deploy.

### 4.2 Dashboards
- [x] **Dashboards Funcionais**: Botões de navegação conectados e operacionais.
- [x] **Deploy de Assets**: Rodar `npm run build` no servidor para compilar a biblioteca `recharts`.
- [x] **Integração de Dados Dinâmicos**: Perfil e Busca agora consomem dados reais do backend.

### 4.3 Configuração e Ativação GA4 (Google Analytics)
- [ ] **Google Cloud Console**:
    - [ ] Ativar a **Google Analytics Data API**.
    - [ ] Criar **Conta de Serviço (Service Account)**.
    - [ ] Gerar Chave JSON e salvar em `backend/storage/app/analytics/service-account.json`.
- [ ] **Google Analytics 4 (Google Admin)**:
    - [ ] Criar **Dimensões Personalizadas**: `client_id`, `client_segment`, `client_city` (Escopo: Evento).
    - [ ] Criar **Segredo da API do Measurement Protocol**: Em Fluxos de Dados > Selecionar Fluxo > Protocolo de Medição.
    - [ ] Adicionar e-mail da Service Account como **Visualizador** no acesso à Propriedade.
- [ ] **Configuração .env (Servidor VPS)**:
    - [ ] `GA4_MEASUREMENT_ID`: O ID "G-" do fluxo de dados.
    - [ ] `GA4_API_SECRET`: O segredo gerado no console do GA.
    - [ ] `GA4_PROPERTY_ID`: ID da propriedade (encontrado nas configurações da propriedade).
    - [ ] `VITE_GA4_MEASUREMENT_ID`: Repetir o ID "G-" no frontend.


---

## 🔮 FASE 3: Visão de Futuro (Pós-Lançamento)

### 5.1 Rastreabilidade de Respostas (Orçamentos)
- [ ] Configurar Webhook na Z-API apontando para o servidor.
- [ ] Implementar endpoint de recepção no Laravel para marcar orçamentos como "Cliente Respondeu".

### 5.2 Histórico de Chat
- [ ] Criar interface para o lojista ver mensagens trocadas no painel.

### 5.3 Radar de Oportunidades (Gaps de Mercado)
- [x] **Integração Front-end Público**: Ligar o campo de pesquisa do site ao endpoint `/v1/tracking/search` para iniciar de fato a coleta orgânica.
- [ ] **Integração Real-Time com Websockets (Reverb)**: Se um "Gap gigante" bater no sistema, notificar a equipe comercial ao vivo.
- [ ] **Oportunidades Arquivadas ou Excluídas**: Permitir ao administrador "dispensar" uma sugestão de oportunidade e ocultá-la do Radar.
- [ ] **Feedback da IA Gen**: Permitir edição e regeneração de *Tone of Voice* (ex. Botões alternativos: "Gerar mais agressivo", "Gerar mais formal").
- [ ] **Conexão com CRM**: Acoplar o "Prospectar" para abrir um modal puxando possíveis links/Google Maps locais antes de jogar pro WhatsApp - facilitando encontrar o prospect.

