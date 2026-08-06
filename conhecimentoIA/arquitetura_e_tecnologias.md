# Padrões de Engenharia e Arquitetura - O Vermelhinho

Este documento descreve a pilha tecnológica oficial (Tech Stack) e os padrões arquiteturais do projeto. Qualquer nova funcionalidade, biblioteca ou serviço proposto pelo agente de IA DEVE ser compatível com esta stack.

## 1. Stack Tecnológica Atual

### 1.1. Backend (API)
*   **Framework:** Laravel (PHP).
*   **Servidor de Aplicação:** Laravel Octane (rodando via PM2 no servidor).
*   **Ambiente Local:** XAMPP (`C:\xampp2\php\php.exe`). **Não utilizamos Docker.**
*   **Dependências:** Gerenciadas nativamente via Composer.

### 1.2. Frontend (Painel SPA)
*   **Tecnologia Base:** React.
*   **Build Tool:** Vite.
*   **Gerenciador de Pacotes:** NPM. (Requer Node.js versão 20.x, gerenciado via NVM em produção).
*   **Localização:** Fica estritamente na pasta `frontend/`.

### 1.3. Site Público
*   **Tecnologia Base:** Next.js.
*   **Gerenciador de Pacotes:** NPM. (Requer Node.js versão 20.x).
*   **Localização:** Fica estritamente na pasta `site/`.
*   **Execução:** Mantido vivo em produção via PM2 (`overmelhinho-site`).

### 1.4. Banco de Dados e Infraestrutura
*   **Banco de Dados Relacional:** PostgreSQL (Hospedado no Supabase).
*   **Storage (Arquivos e Mídias):** Supabase Storage Bucket (`clientes-media`). Substitui o antigo armazenamento em disco local.
*   **Controle de Processos em Produção:** PM2 é responsável por rodar os daemons do Node e do Laravel Octane.

## 2. Padrões Arquiteturais e Decisões (ADRs)

*   **Separação de Contexto (Monorepo Lógico):** Embora tudo esteja no mesmo repositório, o Backend, Frontend e Site são aplicações independentes com seus próprios `package.json` ou `composer.json`. Nunca cruze as dependências de uma pasta para a outra.
*   **Build de Frontend Atômico:** Durante o deploy, o frontend Vite é buildado em uma pasta temporária (`dist_new`) e só substitui a antiga se compilar com sucesso. O agente deve estar ciente que quebrar o build do frontend pausa o deploy de novas interfaces.
*   **Gestão de Node (NVM):** Para evitar problemas de compatibilidade de bibliotecas React/Next, todo comando `npm` executado no ambiente do servidor utiliza o `nvm use 20` para travar a versão do Node.js na v20.

---
*(O agente de IA não deve sugerir a instalação de novos bancos de dados (ex: MongoDB, Redis) ou orquestradores (ex: Docker, Kubernetes) sem que seja previamente aprovado e registrado neste documento).*
