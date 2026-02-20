# Plano de Implementação: Sistema Financeiro Avançado (Parcelamento e Multi-pagamentos)

Este documento descreve as tarefas necessárias para implementar a geração de cobranças parceladas e a escolha de métodos de pagamento integrados ao Tiny ERP.

## Tarefas de Banco de Dados (Backend)

### [ ] Task 1.1: Migração da Tabela `invoices`
- Adicionar campos:
  - `payment_method`: enum ou string ('boleto', 'pix', 'cartao', 'dinheiro').
  - `parcel_number`: registro da parcela atual (ex: 1).
  - `total_parcels`: total de parcelas geradas (ex: 12).
  - `group_id`: Identificador único para o lote de parcelas geradas juntas.

## Lógica de Negócio (Backend)

### [ ] Task 2.1: Refatoração do `FinancialController@storeInvoice`
- Modificar para aceitar `installments_count` (quantidade de parcelas).
- Implementar loop de criação:
  - Calcular data de vencimento incremental (+30 dias por parcela).
  - Gerar registros individuais para cada parcela.
  - Chamar serviço do Tiny para cada parcela.

### [ ] Task 2.2: Atualização do `TinyErpService`
- Mapear o campo `forma_recebimento` na API do Tiny (método `conta.receber.incluir`).
- Garantir que o link do boleto/pix retornado pelo Tiny seja salvo individualmente em cada fatura.

## Interface do Usuário (Frontend)

### [ ] Task 3.1: Atualização da Modal "Gerar Cobrança"
- Incluir campo Select: **Forma de Pagamento**.
- Incluir campo Number: **Quantidade de Parcelas**.
- Incluir visualização prévia (ex: "Serão gerados 12 boletos de R$ 299,00").

### [ ] Task 3.2: Listagem de Faturas
- Agrupar ou sinalizar visualmente faturas que fazem parte do mesmo parcelamento (ex: "1/12", "2/12").

## Comunicação e WhatsApp

### [ ] Task 4.1: Envio em Massa via WhatsApp
- Criar opção para selecionar múltiplas faturas e enviar todos os links em uma única mensagem.
- Refinar o template da mensagem para incluir o número da parcela.

---

## Fluxo Técnico de Geração de 12x

1. O usuário seleciona "Boleto" e "12 parcelas" no Painel.
2. O Painel cria a 1ª fatura para 20/03, 2ª para 20/04... até 20/02 do próximo ano.
3. Para cada uma, o sistema faz um POST para o Tiny.
4. O Tiny gera as 12 contas a receber.
5. Se configurado no Tiny, ele dispara os 12 e-mails automaticamente.
6. O Painel armazena os 12 IDs e Links de pagamento para consulta e reenvio via WhatsApp.
