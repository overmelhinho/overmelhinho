# Arquitetura do Sistema Vermelhinho

Este documento descreve a arquitetura técnica e o fluxo de dados do projeto.

## 🏗️ Diagrama de Alto Nível

```mermaid
graph TD
    User[Usuário] -->|Acessa via Browser| Frontend[Frontend (React/Vite)]
    Frontend -->|Requisições HTTP/JSON| Backend[Backend (Laravel API)]
    Backend -->|Leitura/Escrita| DB[(MySQL Database)]
```

## 🔌 Backend (Laravel)

O backend serve como uma API RESTful para o frontend.

- **Framework**: Laravel 12.
- **Servidor**: Laravel Octane (Swoole/RoadRunner) para alta performance.
- **Banco de Dados**: MySQL 8.
- **Autenticação**: Laravel Sanctum (Token-based) para API.
- **Permissões**: `spatie/laravel-permission` para controle de acesso (Roles/Permissions).
- **Recursos**: Uso de API Resources para transformação de dados.
- **Redirecionamento Inteligente**: O sistema detecta o cargo do usuário no login e o direciona para o Dashboard administrativo (Diretores/Admin) ou para a **Fila de Foco** (Operacional/Comercial/Marketing).

### Principais Diretórios
- `app/Models`: Modelos Eloquent.
- `app/Http/Controllers`: Lógica de controle e endpoints da API.
- `routes/api.php`: Definição das rotas da API.

## 🎨 Frontend (React)

O frontend é uma SPA (Single Page Application) construída com React.

- **Build Tool**: Vite.
- **Estilização**: TailwindCSS + Bibliotecas de UI (Radix UI, Headless UI).
- **Gerenciamento de Estado/Data Fetching**: React Query (@tanstack/react-query).
- **Roteamento**: React Router DOM.
- **Formulários**: Formik + Yup para validação.

### Principais Diretórios
- `src/components`: Componentes reutilizáveis (botões, inputs, etc).
- `src/pages` (ou estrutura equivalente em `src/`): Páginas da aplicação.
- `src/services` (ou config axios): Configuração de chamadas à API.

## 🐳 Infraestrutura (Docker)

O ambiente de desenvolvimento é containerizado via Docker Compose.

- **Service `backend`**: Container PHP/Laravel.
- **Service `frontend`**: Container Node para desenvolvimento (hot-reload).
- **Service `db`**: Container MySQL oficial.
- **Volumes**: Persistência de dados do MySQL em `db_data`.

## 🚀 Fluxo de Deploy (Planejado)

1. **Desenvolvimento Local**: Commit e Push para GitHub.
2. **CI/CD**: GitHub Actions (futuro) para testes e build.
3. **Produção (VPS)**: Pull do repositório, build das imagens Docker e restart dos serviços.
