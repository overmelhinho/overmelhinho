# Documentação Técnica: Módulo Financeiro (Integração Tiny ERP)

## 1. Visão Geral
O Módulo Financeiro do sistema "O Vermelhinho" foi projetado para externalizar toda a gestão fiscal e de cobrança para o **Tiny ERP**. O sistema funciona como um disparador de ordens e monitor de pagamento, enquanto o Tiny ERP lida com a geração de boletos, PIX e controle bancário.

## 2. Arquitetura Técnica

### 2.1 Banco de Dados (Schema)
Foram implementadas novas estruturas para suportar o fluxo financeiro:

*   **Tabela `plans`**: Armazena os produtos/serviços oferecidos.
    *   `name`: Nome comercial do plano.
    *   `price`: Valor base.
    *   `billing_cycle`: Ciclo (mensal, anual, avulso).
    *   `tiny_product_id`: Mapeamento do código do produto dentro do Tiny ERP.
*   **Tabela `invoices`**: Registro local das cobranças geradas.
    *   `tiny_account_id`: ID da "Conta a Receber" no Tiny.
    *   `payment_url`: Link direto para o pagamento (boleto/PIX).
    *   `status`: Controle local (pending, paid, canceled).
*   **Alteração em `clientes`**:
    *   `tiny_id`: ID único do contato no Tiny, usado para vincular cobranças.
    *   `status_assinatura`: Controla o acesso do cliente aos serviços do portal.

### 2.2 Camada de Serviço (`TinyErpService`)
Localizada em `app/Services/TinyErpService.php`, esta classe isola toda a complexidade da API do Tiny ERP (v2).

*   **`syncClient()`**: Verifica se o cliente já existe no Tiny via `tiny_id`. Caso contrário, envia os dados (Razão Social, CNPJ, Endereço, Contato) para o endpoint `contato.incluir.php`.
*   **`createReceivable()`**: Envia uma instrução de "Conta a Receber" para o Tiny. Utiliza os dados do plano e do cliente para gerar a fatura.

### 2.3 Webhooks
O sistema expõe um endpoint público em `/api/v1/webhooks/tiny` para receber notificações de baixa automática.
*   **Fluxo**: Tiny (Pagamento confirmado) -> Webhook POST -> Laravel -> Atualiza Invoice -> Ativa Cliente.

## 3. Endpoints da API (V1)

| Método | Rota | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| GET | `/v1/plans` | Lista os planos disponíveis | Sim |
| GET | `/v1/clientes/{id}/invoices` | Lista faturas de um cliente específico | Sim |
| POST | `/v1/clientes/{id}/invoices` | Gera uma nova cobrança no sistema e no Tiny | Sim |
| POST | `/v1/webhooks/tiny` | Recebe notificações de pagamento do Tiny | Não |

## 4. Integração Frontend (React)

A interface foi integrada nativamente na tela de **Edição de Clientes** (`ClienteEdit.tsx`), utilizando o padrão de design "Nature Distilled".

*   **Componente `TabFinanceiro.tsx`**: 
    *   Exibe o histórico de faturas em uma tabela responsiva.
    *   Permite a cópia rápida do link de pagamento para envio via WhatsApp.
    *   Garante feedback visual via Badges (Verde para Pago, Amarelo para Pendente).
*   **Modal de Cobrança**: Interface amigável para seleção de planos e datas de vencimento, com integração assíncrona via `React Query`.

## 5. Configuração de Ambiente

Para o funcionamento correto, as seguintes variáveis devem estar no `.env`:

```env
TINY_ERP_TOKEN=seu_token_api_aqui
```

### Configuração no Tiny ERP:
1.  Obtenha o token em **Configurações > Ecossistema > API**.
2.  Configure o Webhook no Tiny apontando para a URL da sua API + `/api/v1/webhooks/tiny`.
3.  Certifique-se de que os produtos no Tiny tenham códigos compatíveis com os `tiny_product_id` cadastrados na tabela `plans`.

## 6. Fluxo de Uso (Processo de Venda)
1.  Admin acessa o cadastro do cliente.
2.  Vai até a aba **Financeiro** e clica em **Gerar Cobrança**.
3.  Seleciona o plano e o vencimento.
4.  O sistema sincroniza o cliente com o Tiny (se necessário), gera a conta e recebe o link.
5.  O Admin clica em "Copiar Link" e envia para o cliente.
6.  Assim que o cliente paga, o portal é ativado automaticamente via Webhook.
