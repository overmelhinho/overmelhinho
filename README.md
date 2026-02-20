# Vermelhinho - Plataforma de Inteligência de Negócios

Bem-vindo ao repositório do projeto **Vermelhinho**. Este sistema é uma plataforma de turismo composta por uma API Backend em Laravel e um Frontend em React.

## 🚀 Visão Geral

O projeto foi migrado para um fluxo de desenvolvimento profissional, utilizando:
- **Docker**: Para orquestração de containers de desenvolvimento.
- **Laravel 11**: Como API Backend robusta.
- **React + Vite**: Para uma interface de usuário rápida e moderna.

## 🛠️ Tecnologias Principais

- **Backend**: PHP 8.2+, Laravel 11, Laravel Octane, MySQL 8.
- **Frontend**: Node.js, React 18, Vite, TailwindCSS, TypeScript.
- **Infraestrutura**: Docker Compose.

## ⚙️ Pré-requisitos

Para rodar o projeto localmente, você precisa ter instalado:
- [Docker](https://www.docker.com/products/docker-desktop/) & Docker Compose
- [Git](https://git-scm.com/)

(Node.js e PHP são opcionais se você rodar tudo via Docker, mas recomendados para facilidades de IDE).

## 🏃‍♂️ Como Rodar o Projeto

1. **Clone o repositório**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd overmelhinho
   ```

2. **Configure as Variáveis de Ambiente**
   
   Backend:
   ```bash
   cd backend
   cp .env.example .env
   # Edite o .env se necessário (DB_HOST=db, DB_PASSWORD=root, etc)
   ```

   Frontend:
   ```bash
   cd frontend
   cp .env.example .env
   # Defina VITE_API_URL=http://localhost:8000/api (ou a URL correta local)
   ```

3. **Suba os Containers**
   Volte para a raiz e execute:
   ```bash
   docker-compose up -d --build
   ```

4. **Instale as Dependências (se não estiver no Dockerfile)**
   Caso os containers não instalem automaticamente:
   ```bash
   docker-compose exec backend composer install
   docker-compose exec backend php artisan key:generate
   docker-compose exec backend php artisan migrate
   docker-compose exec frontend npm install
   ```

5. **Acesse**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:8000](http://localhost:8000)

## 📂 Estrutura de Pastas

- `backend/`: Código fonte da API Laravel.
- `frontend/`: Código fonte da aplicação React.
- `docker-compose.yml`: Orquestração dos serviços.

## 📚 Documentação Adicional

Para detalhes sobre a arquitetura e decisões técnicas, consulte [ARCHITECTURE.md](./ARCHITECTURE.md).
