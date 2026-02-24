# Módulo de Automação de Renovações

O Módulo de Renovações automatiza o ciclo de vida dos contratos dos clientes, reduzindo a carga manual da equipe comercial e oferecendo uma interface simplificada para o cliente confirmar sua continuidade ou solicitar alterações de dados.

## 1. Visão Geral do Fluxo

O processo de renovação segue uma esteira automatizada baseada na data de vencimento do contrato:

1.  **Geração Automática**: Mensalmente (todo dia 1º às 01:00), o sistema identifica contratos que vencem no mês subsequente via comando `renewals:generate`.
2.  **Criação de Registros**: São gerados registros na tabela `renewals` e **Tickets Comerciais** para acompanhamento.
3.  **Priorização**: A prioridade do ticket é definida pela preferência de contato do cliente:
    - **Alta**: Presencial.
    - **Média**: Ligação ou E-mail.
    - **Baixa**: WhatsApp ou não informado.
4.  **Interação do Cliente**: O cliente recebe um **Magic Link** (único e seguro) que o leva a uma página pública otimizada para celular.

---

## 2. Ações do Cliente e Fluxos de Resposta

O sistema foi desenhado para agir como um filtro automático, direcionando o cliente para dois caminhos principais:

### ✅ Fluxo A: Aprovação Direta ("Tudo Certo")
Utilizado quando o cliente valida as informações e confirma a renovação.
- **Ação no Backend**: Status da renovação muda para `approved`.
- **Destino**: **Setor Financeiro**.
- **Ticket Gerado**: `Cliente Renovado Online: [Nome Fantasia]`
- **Objetivo**: Notificar o financeiro para faturamento e atualização de contrato.

### 📝 Fluxo B: Solicitação de Ajustes
Utilizado quando o cliente identifica que algum dado (endereço, telefone, etc) mudou.
- **Ação no Backend**: Status da renovação muda para `updated_data`. A mensagem do cliente é salva no campo `suggested_changes`.
- **Destino**: **Setor Comercial**.
- **Ticket Gerado**: `Solicitação de Alteração de Dados: [Nome Fantasia]`
- **Descrição**: Contém o texto exato enviado pelo cliente para triagem humana.
- **Objetivo**: Garantir que o consultor comercial valide as informações antes da renovação final.

---

## 3. Estrutura de Dados

### Tabela `clientes` (Atualizada)
- `contact_preference`: Enum (`presential`, `call`, `email`, `whatsapp`).
- `best_contact_shift`: Enum (`morning`, `afternoon`).
- `contract_ends_at`: Data de término do contrato.
- `beneficios`: JSON (Armazena as facilidades como 24h, Pix, Cartão, etc).
- `horario_atendimento`: Texto livre com o horário de funcionamento.

### Tabela `renewals` (Nova)
- `cliente_id`: Relacionamento com o cliente.
- `expiration_date`: Data de expiração prevista.
- `status`: `pending`, `sent`, `approved`, `rejected`, `updated_data`.
- `magic_link_token`: Token seguro de 64 caracteres.
- `suggested_changes`: Texto com as alterações solicitadas.

---

## 4. Interfaces (Frontend)

### Painel Administrativo (Admin)
- **Aba Contato**: Configuração das preferências de contato com opções "Selecione..." para evitar preenchimento acidental.
- **Aba Financeiro**: Card de **Renovação de Contrato**.
    - Permite editar a data de vencimento.
    - Botão "Gerar Link" que cria o registro e abre um campo com **botão de cópia rápida** e **envio via WhatsApp**.
    - **Lógica de Duplicidade**: O sistema reaproveita registros em aberto (`pending`, `sent`, `updated_data`) para o mesmo cliente, atualizando o token e a data em vez de criar novas linhas duplicadas.

### Central de Controle (Menu Financeiro > Aba Renovações)
- **Visão Geral**: Tabela gerencial consolidada para acompanhamento da esteira de renovações.
- **Status em Tempo Real**: 🟡 Pendente, 🔵 Ajuste Solicitado, 🟢 Confirmada.
- **Interação**: Exibição direta das mensagens de ajuste enviadas pelos clientes e atalhos de ação rápida.

### Landing Page Pública (Magic Link)
- **Otimização**: Design Premium Mobile-First (Rede/Branding O Vermelhinho).
- **Dados Exibidos**:
    - Nome Fantasia e CNPJ.
    - Endereço Completo (Rua, Número, CEP, Cidade/Estado).
    - Grade de Contatos (Telefone, WhatsApp, E-mail).
    - Presença Digital (Ícones de Redes Sociais).
    - Benefícios e Formas de Pagamento (Badges visuais).
    - Horário de Funcionamento.
- **UX**: Botões grandes de fácil clique no celular e formulário simplificado para ajustes.

---

## 5. Configuração Técnica
A variável `FRONTEND_URL` no `.env` do backend é obrigatória para a geração dos links.

```env
FRONTEND_URL=https://dashboard.overmelhinho.com.br
```
