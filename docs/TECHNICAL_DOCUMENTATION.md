# Documentação Técnica e Arquitetural - O Vermelhinho

## 1. Visão Geral do Sistema
O **Vermelhinho** é uma plataforma robusta de gestão de clientes, leads, oportunidades (CRM) e financeiro, projetada com foco em **alta disponibilidade (PWA Offline First)** e **interatividade em tempo real (WebSockets)**.

A arquitetura do projeto segue o padrão Cliente-Servidor (API REST), desacoplando totalmente a interface visual (Frontend) das regras de negócio (Backend).

---

## 2. Arquitetura Técnica

### 2.1 Backend (API)
Construído sobre o ecossistema Laravel, o backend é a fonte de verdade dos dados e o motor de regras de negócio pesadas.

- **Framework**: Laravel 12.x.
- **Banco de Dados Relacional**: MySQL 8 (Persistência primária).
- **Autenticação**: Laravel Sanctum (Token JWT/Bearer baseado em estado stateless para a API).
- **Controle de Acesso (ACL)**: `spatie/laravel-permission` (Gestão refinada por Cargos/Roles e Permissões/Permissions).
- **WebSockets / Tempo Real**: Laravel Reverb + Laravel Echo, permitindo notificações push e atualizações ao vivo sem sobrecarregar requisições HTTP (polling).
- **Processamento Assíncrono (Jobs/Filas)**: Integrações com Inteligência Artificial (`ClientAiService`) e API do Google Places (`GooglePlacesService`), que rodam em background para enriquecer os dados dos clientes sem travar a interface.

### 2.2 Frontend (SPA + PWA)
Uma aplicação web moderna, responsiva e instalável (Progressive Web App).

- **Framework Principal**: React (v18+) em TypeScript.
- **Build Tool**: Vite (Alta performance e Hot Module Replacement veloz).
- **Estilização**: TailwindCSS puro em conjunto com componentes acessíveis baseados em Radix UI / Headless UI.
- **Gerenciamento de Estado**: 
  - *Server State*: React Query (`@tanstack/react-query`) para cache, deduplicação de requisições e estado de loading.
  - *Local State*: Context API nativa do React (ex: `AuthContext`).
- **Offline First (PWA)**:
  - `vite-plugin-pwa` com Workbox gerenciando o cache de recursos estáticos e o ciclo de vida do Service Worker.
  - Banco de Dados Local (IndexedDB via `idb-keyval`) armazenando dezenas de milhares de clientes.
- **Roteamento**: React Router DOM (v6+), protegido por um componente `ProtectedRoute` inteligente (redireciona para login e checa permissões ativamente).

---

## 3. Arquitetura Offline e Sincronização (SyncEngine)
Um dos maiores diferenciais técnicos da aplicação é sua capacidade de operar offline.

1. **Leitura (IndexedDB)**: O app armazena a lista base de clientes no IndexedDB (armazenamento persistente do navegador) sob a chave `offline_clientes_db`.
2. **SyncEngine**:
   - Uma engine de sincronização que busca os dados da API de forma fatiada (lotes/chunks) para não sobrecarregar o servidor.
   - **Full Sync**: Ocorre na primeira instalação.
   - **Delta Sync**: Usa a data `last_sync` para puxar do servidor apenas registros atualizados/criados recentemente, poupando banda.
   - Possui sistema de `retry` (tolerância a falhas) para evitar abortar o download em conexões móveis ruins.
3. **Mutações (Outbox Pattern)**:
   - Requisições de escrita (`POST`, `PUT`, `DELETE`) feitas sem internet são retidas (interceptador do Axios) e guardadas na fila "Outbox".
   - A UI reage de forma otimista (Optimistic UI), mentindo para o usuário que deu certo.
   - Quando a internet volta, o App envia as requisições pendentes da Outbox silenciosamente.

---

## 4. Estrutura de Domínios (Funcionalidades)

A organização dos módulos segue princípios de isolamento de domínio:

- **Clientes**: CRUD complexo, relacionamento com Endereços, Redes Sociais, Galerias, Tags, Segmentos e Cidades de Atendimento.
- **Leads & Oportunidades**: Painel Kanban dinâmico para acompanhamento de pipeline de vendas.
- **Tickets**: Gestão de suporte e demandas internas.
- **Campanhas e Vagas**: Geração de landing pages / recursos públicos voltados a atração.
- **Financeiro / Planos**: Visão estratégica sobre assinaturas e inadimplências.
- **Fila de Foco (FocusDashboard)**: Uma visão hiper-simplificada feita para produtividade máxima da equipe comercial, listando apenas os "próximos passos".

---

## 5. Padrões de Código e Diretrizes para Futuras Implementações

### Frontend (React)
1. **Nunca use `useEffect` para requisições manuais se houver alternativa**. Use SEMPRE o `React Query` (Hooks `useQuery` e `useMutation`). Ele lidará nativamente com estados offline, cache e revalidação de abas inativas.
2. **Formulários**: Adote `Formik` + `Yup`. Mantenha a complexidade de validação dentro dos esquemas (schemas) do Yup e fora da lógica de renderização.
3. **Tratamento de Sessão**: O `AuthContext` é sincrônico ao iniciar, para evitar piscadas de tela (flickers) no PWA. Se a API der `401 Unauthorized` e o usuário estiver online, o interceptor do Axios o joga na tela de login automaticamente.

### Backend (Laravel)
1. **Evite consultas pesadas nas Listagens (`index`)**: Mantenha rotas tipo `lite=true` (usadas pelo SyncEngine) extremamente limpas de sub-queries complexas (evite relacionamentos 1-para-N desnecessários para reduzir payload e memória).
2. **Validações Fortes**: Use sempre as `FormRequest` classes para validar todos os `POST/PUT`. Nunca confie no JSON de frontend cru.
3. **Background Jobs**: Qualquer integração de IA, disparo de e-mails pesados, ou leitura de API Externa (Google Places) DEVE obrigatoriamente ir para filas (`Jobs`).

---

## 6. Rotinas Críticas e Manutenção Diária

- **Problemas de PWA (Cache Travado)**: Se a interface antiga não atualizar nos celulares, o culpado quase sempre é o Service Worker. A configuração de PWA está setada para `autoUpdate`, então o usuário só precisa fechar e reabrir o app, sem popups chatos de atualização.
- **Deploy**: A infraestrutura conta com scripts de deploy na raiz (`deploy.sh` e `deploy.ps1`). Eles rodam rotinas seguras (`npm ci`, `vite build`, `composer install`, cache-clear, queue-restart) para que o sistema não caia enquanto atualiza.
