# 🤖 Suite de Testes Automatizados - O Vermelhinho

Este guia explica como executar os testes automatizados tanto no Backend quanto no Frontend para garantir a qualidade do sistema.

---

## 🏗️ 1. Backend (Laravel)

Os testes de backend utilizam o **PHPUnit** e cobrem as funcionalidades de criação, edição e validação de Leads e Clientes.

### Requisitos:
- O banco de dados de teste deve estar configurado (os testes utilizam `RefreshDatabase` para garantir um ambiente limpo).

### Como rodar:
Abra o terminal na pasta `backend/` e execute:
```bash
php artisan test
```
*Este comando executará todos os testes da suite, incluindo o `LeadAndClientFeatureTest.php`.*

---

## 🎨 2. Frontend (React)

Os testes End-to-End (E2E) utilizam o **Cypress** para simular as interações reais de um usuário no navegador.

### Requisitos:
- O servidor de desenvolvimento deve estar rodando (`npm run dev` na pasta `frontend`).
- O Cypress deve estar instalado (`npm install` na pasta `frontend`).

### Como rodar:

#### Modo Interface (Recomendado para desenvolvimento):
Abra o terminal na pasta `frontend/` e execute:
```bash
npm run test:e2e
```
*Isso abrirá o painel do Cypress onde você poderá selecionar o teste `create_lead.cy.js` e ver o robô interagindo com a tela.*

#### Modo Headless (Para CI/CD ou terminal):
```bash
npm run test:e2e:run
```

---

## 📂 Arquivos Criados:
- **Backend**: `backend/tests/Feature/LeadAndClientFeatureTest.php`
- **Frontend Config**: `frontend/cypress.config.js`
- **Frontend Test**: `frontend/cypress/e2e/create_lead.cy.js`
