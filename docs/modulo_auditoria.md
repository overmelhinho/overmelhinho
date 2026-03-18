# Módulo: Auditoria de Dados (IA & Sincronização Web)

## 📌 Visão Geral
O **Módulo de Auditoria** é um motor de integridade de dados que garante que as informações dos clientes no portal O Vermelhinho estejam sempre sincronizadas com as fontes oficiais na Web (Google Places, Redes Sociais e DNS). O módulo combina automação robótica noturna, Inteligência Artificial para análise de divergências e uma interface de revisão humana para validação final.

---

## 🏗 Arquitetura do Módulo

### 1. Automação Backend (Laravel)
- **Service Principal:** `backend/app/Services/AuditAutomationService.php`
    - Responsável pela lógica de comparação e decisão de discrepâncias.
    - Filtra campos baseados no **plano do cliente** (`tipo_cliente`).
- **Motor de Inteligência:** `backend/app/Services/LeadIntelService.php`
    - Consome a API do **Google Places** para obter dados oficiais.
    - Realiza *scraping* no site do cliente para extrair redes sociais via DNS/Links.
    - Utiliza IA para parsear e estruturar componentes de endereço.
- **Comando de Agendamento:** `php artisan audit:scan --limit=50`
    - Script rodado via *Cron* na madrugada para escanear a base de clientes.
    - Limita o processamento diário para otimização de custos de API.
- **Logs de Auditoria:** `backend/app/Models/AuditLog.php`
    - Registra cada alteração feita, quem aprovou (IA ou Operador) e o estado anterior/novo do dado.

### 2. Interface Frontend (React + Tailwind)
- **Dashboard de Fila:** `frontend/src/pages/AuditDashboardPage.tsx`
    - Exibe a lista de clientes que possuem divergências detectadas pelo script noturno.
- **Tela de Conciliação:** `frontend/src/pages/AuditMatchPage.tsx`
    - Interface de comparação "Lado a Lado" (No Sistema vs Encontrado na Web).
    - Apresenta apenas campos com inconsistência real (ignora diferenças de maiúsculas/espaços).
    - Fornece links diretos para a fonte original (Google/Instagram) para validação rápida.

---

## 🛡 Regras de Negócio & Filtros

### 💎 Diferenciação por Plano (`tipo_cliente`)
Para otimizar o foco da equipe e respeitar os limites do produto:
- **Cliente Gratuito:** O sistema audita apenas o **Telefone**. Outras mudanças na web são ignoradas para este nível de acesso.
- **Cliente Pagante:** Auditoria completa de **Telefone, Website, Instagram e Endereço Estruturado**.

### 📍 Inteligência de Endereço
Diferente de uma string simples, o sistema separa o endereço em componentes:
- **Rua, Número, Bairro, Cidade, Estado e CEP.**
- Se o Google detecta uma mudança, o sistema preenche automaticamente todos os subcampos do formulário de endereço, evitando erros de digitação.

---

## 🚀 Fluxo de Trabalho (Workflow)

1. **Varredura (Madrugada):** O comando `audit:scan` busca os registros mais antigos e cruza com o Google. Se houver divergência, marca o cliente como `audit_status = 'pending'`.
2. **Triagem:** O operador acessa o menu **Auditoria** e vê a lista de clientes marcados.
3. **Conferência:** Ao abrir o cliente, o operador vê os blocos vermelhos apenas nos campos que mudaram.
4. **Validação:** O operador pode clicar no ícone de "Link Externo" para ver o dado na fonte original.
5. **Decisão:**
    - **Manter dado atual:** Ignora a sugestão da IA e mantém o que está no banco.
    - **Atualizar Cadastro:** Substitui o dado antigo pelo novo encontrado na Web.
6. **Finalização:** Ao clicar em "Publicar Alterações", o `audit_status` volta para `'ok'` e um `AuditLog` é gerado para rastreabilidade.

---

## 🛠 Comandos Úteis

```bash
# Rodar varredura manual para os próximos 5 clientes
php artisan audit:scan --limit=5

# Forçar varredura de um cliente específico (via ID)
php artisan audit:scan --client=123
```

---

## ✅ Checklist de Qualidade (UX/UI)
- [x] **Micro-animações:** Uso de `framer-motion` para transições suaves nos cards de comparação.
- [x] **Feedback Visual:** Cores e badges indicam claramente o que está validado e o que é novo.
- [x] **Segurança:** Bloqueio de publicação se houver campos pendentes de decisão.
- [x] **Mobile Friendly:** Grid responsivo que se adapta de 1 para 2 colunas.
