# Módulo Financeiro e Contratos (Autorizações)

Este módulo é responsável por toda a gestão financeira do sistema, desde o faturamento manual até a automação completa via assinaturas digitais e integração com o Tiny ERP.

## 1. Gestão de Contratos (Autorizações)

O sistema permite a geração de contratos de publicidade que podem ser assinados digitalmente pelos clientes.

### 1.1 Fluxo de Criação
1. **Onde:** Localizado na aba "Financeiro" da edição do cliente.
2. **Dados:** O gestor preenche o título do anúncio, período de vigência, plano, descontos, permutas e condições de pagamento (parcelamento).
3. **Status Inicial:** O contrato nasce como "Rascunho".

### 1.2 Assinatura Digital
- O sistema gera um link único e seguro para assinatura.
- O link pode ser enviado via WhatsApp (disparo automático via Z-API) ou copiado manualmente pelo gestor.
- **Página de Assinatura:** O cliente visualiza o resumo do contrato, termo legal e assina via canvas (assinatura desenhada).
- **Dados Capturados:** IP do assinante, data/hora e imagem da assinatura (base64).

### 1.3 Pós-Assinatura (Automação)
Assim que o contrato é assinado:
1. **Status:** Muda para "Assinado".
2. **PDF Final:** É gerado um PDF oficial com a assinatura digital e armazenado no servidor.
3. **Automação Tiny ERP:** O sistema dispara automaticamente a criação das faturas no Tiny ERP baseadas nas parcelas do contrato.

---

## 2. Integração Tiny ERP

O sistema utiliza a API do Tiny ERP (v2) para sincronização financeira.

### 2.1 Sincronização de Clientes
Antes de gerar qualquer fatura, o sistema verifica se o cliente existe no Tiny. Se não existir, o cadastro é criado e o `tiny_id` é salvo localmente.

### 2.2 Geração de Contas a Receber
Para cada parcela do contrato (ou faturamento avulso):
- É criado um registro de `Invoice` localmente.
- É enviado um comando `conta.receber.incluir` para o Tiny.
- O Tiny devolve o ID da conta e, se configurado, o link para pagamento (Pix/Boleto).

---

## 3. Gestão Financeira Local

### 3.1 Aba Financeiro (Edição de Cliente)
- **Carnê:** Permite baixar o carnê completo em PDF de um grupo de parcelas.
- **Faturas:** Listagem de todas as faturas com status (Pendente, Pago, Cancelado).
- **Contratos:** Listagem de autorizações com acesso ao PDF e controles de envio.

### 3.2 Trava de Segurança
Para evitar faturamento duplicado ou desorganizado, o sistema exibe um alerta de confirmação caso o gestor tente gerar uma "Cobrança Avulsa" enquanto o cliente possui contratos pendentes de assinatura.

---

## 4. Requisitos do Servidor (PDF)
A geração de PDFs com assinatura digital exige que a extensão **PHP GD** esteja habilitada no servidor para o processamento de imagens base64 dentro do dompdf.
