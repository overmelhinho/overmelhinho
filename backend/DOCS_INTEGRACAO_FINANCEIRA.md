# Documentação de Integração Financeira - Tiny ERP v2

Esta documentação detalha a implementação da integração entre **O Vermelhinho** e o **Tiny ERP** (API v2), focando na sincronização de clientes e emissão de contas a receber.

## 1. Visão Geral
A integração tem dois objetivos principais:
1.  **Sincronizar Cadastros**: Manter os dados do cliente (PF/PJ) atualizados no Tiny ERP.
2.  **Gerar Contas a Receber**: Criar lançamentos financeiros vinculados ao cliente correto, garantindo que os dados fiscais (CNPJ, Endereço Completo) estejam presentes para emissão de Nota Fiscal e Boletos.

### 1.1. Automação de Cobranças Recorrentes (Novo)
O sistema agora possui um **Job Automático** (`financial:generate-recurring`) que roda diariamente às **06:00 da manhã**.
Ele verifica:
*   Clientes com status `Pagante` (ou ativo).
*   Clientes com um `Plano` vinculado no cadastro.
*   Clientes cujo `Dia de Recorrência` (1-31) coincide com o dia atual.

Se todas as condições forem atendidas, o sistema:
1.  Gera uma nova fatura (`Invoice`) localmente.
2.  Envia para o Tiny ERP com os dados completos do cliente.
3.  Atualiza a data da última geração para evitar duplicidade no mesmo mês.

---

## 2. Sincronização de Clientes
Classe: `App\Services\TinyErpService`
Método: `syncClient(Cliente $client)`

### Desafios e Soluções (API v2)

#### A. Estrutura do Payload (Singular vs Plural)
O Tiny ERP v2 possui um comportamento distinto para criação e atualização:
*   **Inclusão (`contato.incluir.php`)**: Exige uma estrutura de **lista** (array de contatos).
*   **Alteração (`contato.alterar.php`)**: Exige, para funcionamento correto de campos fiscais em PJ, um objeto **singular** (`contato`) direto na raiz, ou o uso de lista com IDs explícitos.
    *   *Solução*: Implementamos uma lógica condicional no `Service` que formata o JSON adequadamente dependendo se o cliente já possui `tiny_id`.

#### B. Campos Críticos para Pessoa Jurídica
Para que o Tiny aceite a atualização de CNPJ e Endereço de uma empresa já cadastrada, é obrigatório enviar:
1.  **`sequencia`**: Sempre enviar `'sequencia' => '1'`, inclusive na alteração. Sem isso, o Tiny ignora o payload silenciosamente.
2.  **`atualizar_cliente`**: Flag `'atualizar_cliente' => 'S'`. Força a sobrescrita de dados sensíveis.
3.  **`tipos_contato`**: Array explícito definindo o contato como Cliente (`C`).
4.  **Dados Limpos**: Campos como `complemento` não podem ser `null`; devem ser strings vazias `""`.

#### C. Mapeamento de Endereço
O endereço deve ser enviado tanto nos campos planos (`endereco`, `numero`, `bairro`, `cep`, `cidade`, `uf`) quanto duplicado para os campos de cobrança (`endereco_cobranca`, etc.), garantindo compatibilidade com todos os módulos do Tiny.

---

## 3. Emissão de Contas a Receber
Classe: `App\Services\TinyErpService`
Método: `createReceivable(Invoice $invoice)`

### Estratégia de "Envio Híbrido" (Dados na Fatura)
Apenas vincular o `id` do cliente na fatura mostrou-se insuficiente em casos onde a atualização do cadastro do contato ainda não foi indexada pelo Tiny.

**Solução Implementada:**
Ao criar a conta a receber (`conta.receber.incluir.php`), enviamos o objeto `cliente` **completo** dentro do payload da conta, e não apenas o ID.
Isso inclui:
*   Nome / Razão Social
*   CPF / CNPJ
*   Endereço Completo (Logradouro, Número, Bairro, CEP, Cidade, UF)

```php
'cliente' => [
    'id' => (int) $client->tiny_id,
    'nome' => ...,
    'cpf_cnpj' => ...,
    'endereco' => ...,
    // ... demais campos
]
```

Isso garante que, **mesmo que o cadastro do contato esteja desatualizado ou incompleto na base do Tiny**, a fatura (e subsequente Nota Fiscal) sairá com os dados corretos que foram enviados no momento da venda.

---

## 4. Tratamento de Erros e Logs
*   O sistema registra logs detalhados (`Log::info`) com o payload JSON enviado e a resposta recebida do Tiny.
*   Erros de validação do Tiny (ex: CNPJ inválido, Estado não informado) lançam exceções que impedem a conclusão do fluxo no Vermelhinho, alertando o usuário.

## 5. Referência de Campos (Mapeamento)

| Campo Vermelhinho | Campo Tiny API | Obs |
| :--- | :--- | :--- |
| `id` (Tiny ID) | `id` | Obrigatório para vínculo |
| `cpf_cnpj` | `cpf_cnpj` | Apenas números |
| `inscricao_estadual` | `ie` | String vazia se isento |
| `rua` | `endereco` | Logradouro |
| `numero` | `numero` | String |
| `cep` | `cep` | Apenas números |
| `estado` (Sigla) | `uf` | Ex: RS, SP |

---

## 6. Alteração de Contas a Receber (Edição de Parcelas)

### Estratégia: Reconciliação no Pagamento (Implementada em 27/04/2026)
Devido às limitações e bugs da API v2 do Tiny (endpoint `alterar` não-funcional e ausência de endpoint de `excluir/cancelar`), adotamos uma estratégia de reconciliação tardia:

1.  **Edição Local**: Quando uma parcela é editada ou redistribuída no Vermelhinho, a alteração é feita **apenas no banco de dados local**. O registro correspondente no Tiny permanece com o valor original.
2.  **Zero Poluição**: Isso evita a criação de "contas fantasma", duplicatas ou registros de baixa fictícios que poluiriam o financeiro do Tiny.
3.  **Baixa com Desconto**: A sincronização real acontece no momento do **recebimento (baixa)**.
    -   O sistema consulta o valor original da conta no Tiny.
    -   Calcula a diferença entre o valor no Tiny e o valor efetivamente pago no Vermelhinho.
    -   Executa a baixa (`conta.receber.baixar.php`) enviando o `valor` pago e a diferença no campo `desconto`.

### Vantagens
-   **Integridade do Fluxo de Caixa**: Apenas o valor real pago entra no caixa do Tiny. A diferença é registrada como desconto, mantendo o saldo correto.
-   **Robustez**: Elimina a dependência de endpoints instáveis da API v2 para operações de edição.
-   **Simplicidade**: O código fica mais limpo e menos propenso a erros de sincronização parcial.

### Regras de Negócio
-   **Parcelas Extras**: Se a edição resultar na criação de uma parcela extra, esta será enviada ao Tiny normalmente como uma nova conta.
-   **Cancelamento**: Faturas canceladas localmente permanecem "em aberto" no Tiny (devido à falta de endpoint de cancelamento na API v2) e devem ser tratadas em batches de limpeza ou manualmente no painel, se necessário. No entanto, o sistema as ignora para fins de fluxo.


