# Visão Geral do Projeto

Este documento fornece um panorama do projeto "O Vermelhinho", detalhando as tecnologias utilizadas e os principais módulos do sistema.

## 1. Stack Tecnológico

O projeto é divido em duas aplicações principais (Backend e Frontend), configuradas para operar de forma integrada.

### 1.1 Backend
- **Linguagem:** PHP 8.2+
- **Framework:** Laravel 12.0
- **Servidor Web/Performance:** Laravel Octane (via FrankenPHP ou Swoole)
- **WebSockets / Tempo Real:** Laravel Reverb 1.0
- **Autenticação:** Laravel Sanctum
- **Permissões / ACL:** Spatie Laravel Permission
- **Testes:** PHPUnit e Pest (com cobertura de testes de integração e unitários via Pest PHP e Testes do Laravel)
- **Geração de PDF:** barryvdh/laravel-dompdf
- **Processamento de Imagem:** intervention/image

### 1.2 Frontend
- **Biblioteca Principal:** React 18
- **Bundler e Servidor de Desenvolvimento:** Vite
- **Roteamento:** React Router DOM
- **Estilização e UI:** 
  - Tailwind CSS v3 (com postcss)
  - Radix UI (Componentes acessíveis Headless)
  - Framer Motion (Animações)
  - Lucide React & React Icons (Ícones)
- **Gerenciamento de Estado de Servidor:** React Query (@tanstack/react-query)
- **Formulários e Validação:** Formik, Yup
- **WebSockets (Cliente):** Laravel Echo + Pusher JS
- **Tabelas / Drag & Drop:** @tanstack/react-table, @dnd-kit (Sortable e Utilitários)
- **Manipulação de Datas:** date-fns, dayjs

## 2. Principais Módulos do Sistema

A aplicação atua como um ERP/CRM/Gestão completa para o negócio, sendo composta dos seguintes módulos identificados via controllers, models e migrations:

1. **Gestão de Clientes e CRM**
   - Cadastro de Clientes (`Cliente`).
   - Gestão de Contatos e Endereços (`Contato`, `Endereco`, `Cidade`).
   - Módulo de Leads e CRM comercial (`Lead`, `Oportunidade`), incluindo esteira automática de recuperação e integração com Tickets. *(Veja `docs/leads_module.md` para detalhes)*.

2. **Atendimento e Suporte (Tickets)**
   - Kanban de tickets (`Ticket`, `TicketLog`, `TicketSubtask`) permitindo assinalar atendentes, trocar status, definir subtarefas.

3. **Módulo Financeiro**
   - Faturamento (`Invoice`), planos de assinatura (`Plan`), controle parcelas e recorrência em clientes.

4. **Recrutamento e RH (Job Board)**
   - Cadastro de vagas de emprego (`JobOpportunity`, `JobRole`) e controle de Candidatos (`Candidate`).

5. **Notificações em Tempo Real**
   - Sistema de push via Laravel Reverb e Laravel Echo alertando usuários internos sobre ações no sistema de Tickets ou outros eventos.

6. **Auditoria**
   - Registro de histórico de alterações sensíveis e ações dos usuários no sistema (`AuditLog`, `HistoricoAlteracao`).

7. **Arquivos e Mídia**
   - Gerenciamento de mídias (`GaleriaImagem`) com suporte a URLs de thumb (miniatura).

8. **Orçamentos com IA**
   - Captura de orçamentos via site público com redação automática de respostas para WhatsApp usando GPT-4 e Torre de Controle administrativo para monitoramento de agilidade. *(Veja `docs/ai_quotes_module.md` para detalhes)*.
