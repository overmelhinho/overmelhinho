# Módulo de Orçamentos com IA

O Módulo de Orçamentos com IA foi desenvolvido para acelerar a conversão de leads provenientes do site público, reduzindo o tempo de resposta e aumentando a produtividade dos lojistas através de automação e priorização inteligente.

---

## 🚀 Visão Geral do Fluxo (Estado Atual — Fase 1)

```
[Site do Lojista — página pública no O Vermelhinho]
      ↓ Usuário clica em "Pedir Orçamento"

[Modal QuoteRequestModal — Progressive Disclosure]
  Passo 1: O que precisa? + Urgência (Emergência / Semana / Pesquisa)
  Passo 2: Nome + WhatsApp
      ↓ POST /api/v1/quotes

[Backend Laravel — QuoteController@store]
  → Grava registro na tabela `quotes` (status: new)
  → Dispara Job assíncrono: GenerateAiQuoteResponse
      ↓

[Job GenerateAiQuoteResponse — Fila de Processamento]
  → Chama AiQuoteService (OpenAI GPT-4)
  → Gera rascunho de resposta para WhatsApp
  → Salva em quotes.ai_draft_response
      ↓

[Painel do Lojista — Fila de Foco / QuotesFocusFila]
  → Exibe orçamento mais urgente em destaque
  → Rascunho da IA já preenchido e editável
  → Botão "Enviar via WhatsApp" → abre wa.me com texto pronto
  → Sistema marca status = replied
```

---

## 📲 Estratégia de Notificação (Fase 2 — Em Planejamento)

### Por que não usamos notificação in-app?
Testamos a viabilidade de notificações in-app (via Laravel Reverb/WebSocket), porém o modelo de negócio não comporta essa abordagem: os lojistas não são power-users do painel e não monitoram o sistema continuamente. **O WhatsApp é o canal de atenção real**.

### Solução Definida: Z-API (API Gerenciada)

Após testes de auto-hospedagem (Evolution API) no VPS, optamos pelo uso da **Z-API** para garantir maior estabilidade e evitar bloqueios de IP de datacenter por parte do WhatsApp.

O fluxo proposto é:

```
[Job GenerateAiQuoteResponse — após salvar rascunho]
      ↓
[Z-API REST Endpoint]
      ↓ ENVIA mensagem para o celular do lojista (cliente nosso)

Exemplo de mensagem enviada ao lojista:
---
🔴 *Novo Orçamento Urgente — O Vermelhinho*

Olá, *Barbearia do João*!

O cliente *Carlos Eduardo* solicitou um orçamento pelo seu site:

📋 *Pedido:* Revisão de 40.000km em um Jeep Compass
⏱ *Urgência:* Esta Semana
📱 *WhatsApp:* (51) 98765-4321

🤖 *Rascunho IA sugerido:*
"Olá Carlos! Podemos realizar a revisão do seu Compass esta semana..."

👉 Acesse sua Fila de Foco para responder:
https://dash.overmelhinho.com.br/dashboard/foco
---
```

### Por que Z-API em vez de auto-hospedagem ou API Oficial?
| Critério | Z-API | Evolution API (Auto-hospedada) | Meta Business API |
|---|---|---|---|
| Custo | R$ 99,99/mês (instância) | Grátis (VPS) | R$ 0,10/msg + setup |
| Estabilidade | Alta (Gerenciado) | Média (Risco de ban de IP) | Máxima (Oficial) |
| Setup | Imediato (Tokens) | Complexo (Docker/Proxy) | Lento (Aprovação Meta) |
| Confiabilidade | Alta | Baixa em datacenters | Alta |

**Decisão**: Z-API oferece o melhor custo-benefício e menor atrito técnico para o estágio atual do projeto.

---

## 🖥️ Componentes do Sistema

### Backend
| Arquivo | Responsabilidade |
|---|---|
| `app/Models/Quote.php` | Model com fillable, casts para `notified_at` e relacionamento com Cliente |
| `app/Http/Controllers/Api/V1/QuoteController.php` | `store`, `index` (admin c/ KPIs), `indexFocus` (lojista), `updateStatus` |
| `app/Services/AiQuoteService.php` | Integração OpenAI GPT-4, constrói prompt contextualizado |
| `app/Services/ZApiService.php` | Integração com Z-API para envio de mensagens automáticas |
| `app/Jobs/GenerateAiQuoteResponse.php` | Job assíncrono: chama IA e dispara ZApiService para notificar lojista |
| `app/Http/Resources/ClienteResource.php` | Inclui flag `quotes_enabled` e carrega contatos parcialmente |
| `database/migrations/..._create_quotes_table.php` | Estrutura base da tabela `quotes` |
| `database/migrations/..._add_notified_at_to_quotes.php` | Adiciona rastro da notificação automática |

### Frontend
| Arquivo | Responsabilidade |
|---|---|
| `src/components/modals/QuoteRequestModal.tsx` | Modal público com Progressive Disclosure (2 passos) |
| `src/pages/quotes/QuotesFocusFila.tsx` | Painel do lojista: Bento Grid, rascunho IA editável, ação WhatsApp |
| `src/pages/quotes/QuotesPage.tsx` | Torre de Controle Admin: KPIs + tabela + status de auto-notificação |
| `src/components/layout/Sidebar.tsx` | Item "Orçamentos IA" no menu administrativo |

---

## 📊 KPIs Monitorados (Torre de Controle)

| KPI | Descrição | Campo Origem |
|---|---|---|
| Aguardando | Orçamentos com `status = new` | `quotes.status` |
| Emergências | `status = new` + `urgency = emergencia` | `quotes.urgency` |
| Espera Média | Minutos desde criação (apenas pendentes) | `EXTRACT EPOCH` PostgreSQL |
| Conversão | % de orçamentos que chegaram a `replied` | Cálculo dinâmico |

---

## ⚙️ Configuração Necessária

```env
# .env do backend
OPENAI_API_KEY=sk-...

# Configuração Z-API (WhatsApp Gerenciado)
ZAPI_INSTANCE_ID=instancia_id
ZAPI_TOKEN=token_id
ZAPI_CLIENT_ID=client_id (opcional)
```

---

## 🔐 Regras de Negócio

- **Detecção de Disponibilidade**: O sistema expõe a flag `quotes_enabled` via API do Cliente. Ela é `true` somente se o lojista possuir pelo menos um número de `celular` cadastrado nos contatos.
- **Notificação Automática**: O Job `GenerateAiQuoteResponse` dispara a Z-API assim que o rascunho da IA é salvo. O campo `notified_at` registra o sucesso desse envio.
- **Botão Inteligente (Torre de Controle)**:
    - Se `notified_at` está vazio: Exibe botão vermelho **"Cobrar Lojista"**.
    - Se `notified_at` preenchido: Exibe botão cinza **"Cobrar Manualmente"** (fallback).
- **Indicador Visual**: Na listagem admin, um badge verde indica se a notificação automática já foi realizada.
- **Formatação de Número**: O `ZApiService` normaliza o celular (remove máscaras) e garante o prefixo internacional `55` (Brasil) para os envios.
- **Status `replied`**: Marcado no momento em que o lojista clica em "Enviar via WhatsApp" na Fila de Foco.
