# 🗺️ Roadmap — Módulo de Orçamentos com IA

Este arquivo centraliza todas as tarefas pendentes para completar o ciclo do módulo de captura e resposta de orçamentos via IA + WhatsApp.

---

## ✅ FASE 1 — Concluída (Fundação)

- [x] Criação da migration e model `Quote`
- [x] Endpoint público `POST /api/v1/quotes` para captura do site
- [x] Modal de Progressive Disclosure (`QuoteRequestModal.tsx`) com 2 passos
- [x] Job assíncrono `GenerateAiQuoteResponse` (fila Laravel)
- [x] Serviço `AiQuoteService` com integração OpenAI GPT-4
- [x] Fila de Foco do Lojista (`QuotesFocusFila.tsx`) — Bento Grid
- [x] Botão "Enviar via WhatsApp" (abre `wa.me` com rascunho)
- [x] Endpoint `PATCH /quotes/{id}/status` para marcar como respondido
- [x] Torre de Controle Admin (`QuotesPage.tsx`) com KPIs e tabela
- [x] Botão "Cobrar Lojista" abre WhatsApp com mensagem pré-formatada
- [x] Lógica de visibilidade: oculta botão se lojista não tem telefone
- [x] Compatibilidade com PostgreSQL (EXTRACT EPOCH para tempo médio)
- [x] Seeder `QuoteSeeder` com 4 orçamentos de teste
- [x] Documentação do módulo (`docs/ai_quotes_module.md`)
- [x] Integração com Z-API para notificações automáticas (Fase 2)
  - [x] Configuração no `.env` e `services.php`
  - [x] Criação do `ZApiService.php`
  - [x] Atualização do Job `GenerateAiQuoteResponse` para disparo automático
  - [x] Migration e Model para o campo `notified_at`
  - [x] Indicador de auto-notificação na Torre de Controle
  - [x] Lógica de cobrança inteligente (Automática vs Manual)
  - [x] Flag `quotes_enabled` no `ClienteResource` para controle de visibilidade pública

---

## 🔮 FASE 2.5 — Backend & Frontend: Visibilidade no Site Público

- [ ] Integrar a flag `quotes_enabled` (já presente na API) no componente de "Página do Lojista" no site público.
- [ ] Ocultar o botão "Pedir Orçamento" caso `quotes_enabled === false`.

---

## 🔮 FASE 3 — Visão de Futuro (Rastreio de Resposta)

> Estas tarefas dependem da maturidade do uso do módulo e do volume gerado.

- [ ] **Webhook de resposta**: configurar Z-API para postar em `/api/v1/webhooks/whatsapp` quando o lojista receber uma resposta do cliente final.
- [ ] Processar webhook: identificar `quotes` linkado pelo número de WhatsApp do cliente e atualizar para `status = customer_replied`.
- [ ] Adicionar campo `customer_replied_at` na tabela `quotes`.
- [ ] Exibir na Torre de Controle o status **"Cliente Respondeu"** diferenciado.
- [ ] **Histórico de conversa**: registrar as mensagens trocadas em uma tabela `quote_messages` para visualização no painel.

---

## 📋 Checklist de Situação Atual

- [x] **Z-API Ativa** — Em vez de Evolution API (auto-hospedada), optamos por Z-API para evitar bloqueios de IP de datacenter.
- [x] **Laravel Queue worker rodando** — Confirmado em produção.
- [x] **Regra de lojistas sem WhatsApp** — Implementada no backend via recurso do cliente.
- [x] **Banco de Dados** — Tabela `quotes` atualizada com `notified_at`.

---

## 🧭 Dependências Entre Fases

```
FASE 1 ✅ → FASE 2.1 (VPS) → FASE 2.2 (Serviço) → FASE 2.3 (Migration)
                                                    → FASE 2.4 (Frontend)
                                                          ↓
                                                     FASE 3 (Webhooks)
```
