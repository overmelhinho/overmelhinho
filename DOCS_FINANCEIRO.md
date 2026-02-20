# Documentação Técnica: Módulo Financeiro (Integração Tiny ERP & SaaS Metrics)

## 1. Visão Geral
O Módulo Financeiro do sistema "O Vermelhinho" foi projetado para externalizar toda a gestão fiscal e de cobrança para o **Tiny ERP**. Além da integração, o módulo evoluiu para uma central de **SaaS Metrics**, fornecendo indicadores em tempo real (MRR, LTV, Churn) e ferramentas de cobrança ativa via WhatsApp.

## 2. Arquitetura Técnica

### 2.1 Banco de Dados (Schema)
Estruturas para suporte financeiro e auditoria:

*   **Tabela `plans`**: Produtos/serviços oferecidos.
    *   `name`, `price`, `billing_cycle`, `tiny_product_id`.
*   **Tabela `invoices`**: Registro local das cobranças.
    *   `tiny_account_id`: ID da conta no Tiny.
    *   `payment_url`: Link de pagamento (boleto/PIX).
    *   `status`: Status (pending, paid, canceled).
    *   `justification` (Novo): Texto obrigatório para baixas/cancelamentos manuais.
    *   `action_date` (Novo): Timestamp do momento da ação manual.
*   **Alteração em `clientes`**:
    *   `tiny_id`: ID para vínculo no ERP.
    *   `status_assinatura`: Controle de acesso (ativo, inadimplente).

### 2.2 Dashboard de Métricas (SaaS Metrics)
Localizado em `MetricsTab.tsx`, o sistema calcula indicadores reais:
*   **MRR (Monthly Recurring Revenue):** Soma de faturas pagas no mês corrente.
*   **LTV (Lifetime Value):** Faturamento Total Pago ÷ Total de Clientes Únicos.
*   **Churn Rate:** Proporção de faturas canceladas nos últimos 30 dias em relação ao total de faturas do período.
*   **Inadimplência:** Soma de faturas `pending` com `due_date` expirado.

### 2.3 Camada de Serviço & Auditoria
*   **`TinyErpService`**: Isola a comunicação via API em REST (v2).
*   **Auditoria Manual**: Todas as alterações manuais de status (Financeiro Geral) exigem uma justificativa de no mínimo 5 caracteres, gravada no banco para histórico.

## 3. Endpoints da API (V1)

| Método | Rota | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| GET | `/v1/plans` | Lista os planos disponíveis | Sim |
| GET | `/v1/financial/invoices` | Lista TODAS as faturas (Financeiro Geral) | Sim |
| GET | `/v1/clientes/{id}/invoices` | Lista faturas de um cliente específico | Sim |
| PATCH | `/v1/financial/invoices/{id}/status` | Baixa ou Cancelamento manual com justificativa | Sim |
| POST | `/v1/financial/invoices/sync` | Sincroniza faturas pendentes com o Tiny ERP | Sim |
| POST | `/v1/clientes/{id}/invoices` | Gera uma nova cobrança no sistema e no Tiny | Sim |
| POST | `/v1/webhooks/tiny` | Recebe notificações de pagamento do Tiny (Resiliente a status numérico ou string) | Não |

## 4. Interface e UX Premium

A interface utiliza componentes modernos (Radix UI / Shadcn) para uma experiência de alta performance:

*   **Botão de Sincronia Inteligente**: Localizado no topo da lista de faturas, permite buscar o status real de todas as contas pendentes no Tiny com um clique, bypassando falhas de webhook.
*   **Ficha de Cobrança (Popover)**: Ao interagir com o nome do cliente na lista, uma ficha flutuante exibe contatos rápidos (Email, Tel, WhatsApp) permitindo a cobrança com um clique.
*   **Sistema de Filtros**: Seletores avançados por Status (incluindo "Atrasados ⚠️") e Período (7, 15, 30 dias ou range personalizado).
*   **Modais de Ação**: Diálogos confirmadores para Pagamento/Cancelamento com validação de campo obrigatório.
*   **Visual Dinâmico**: Badges coloridos, animações de entrada e design "clean" focado em dados legíveis.

## 5. Configuração de Ambiente

Para o funcionamento correto, as seguintes variáveis devem estar no `.env`:

```env
TINY_ERP_TOKEN=seu_token_api_aqui
```

### Configuração no Tiny ERP:
1.  Obtenha o token em **Configurações > Ecossistema > API**.
2.  Configure o Webhook no Tiny apontando para a URL da sua API + `/api/v1/webhooks/tiny`.

## 6. Fluxos Operacionais

### 6.1 Fluxo de Cobrança Ativa
1.  Admin acessa **Financeiro** > **Faturas**.
2.  Aplica o filtro de status **"Atrasados ⚠️"**.
3.  Identifica o cliente, usa a **Ficha de Cobrança** para abrir o WhatsApp.
4.  Após o cliente confirmar o pagamento (ex: via PIX por fora), o Admin clica no botão "Check", insere a justificativa ("Recebido via PIX") e confirma.
5.  O sistema liquida a fatura e ativa a assinatura do cliente instantaneamente.

### 6.2 Fluxo de Gráficos
Os gráficos de **Evolução de Faturamento** são gerados automaticamente baseando-se apenas em faturas com status `paid`, agrupadas por mês de vencimento (últimos 6 meses).

### 6.3 Fluxo de Sincronização em Lote
1.  Admin acessa **Financeiro** > **Faturas**.
2.  Clica em **"Sincronizar Tiny"**.
3.  O sistema varre todas as faturas `pending` que possuem um `tiny_account_id`.
4.  Para cada fatura, consulta a API do Tiny (`conta.receber.obter`).
5.  Se o Tiny retornar situação "2", "pago" ou "recebido", a fatura é liquidada localmente e o cliente é ativado.
6.  Se o Tiny retornar situação "3" ou "cancelado", a fatura é marcada como cancelada.
