# Guia de Inicialização Local - Projeto Vermelhinho

Este documento serve como referência rápida para ativar todos os serviços do ecossistema Vermelhinho no ambiente local.

## 🛠 Pré-requisitos
No ambiente atual, o PHP não está no PATH global. Utilize o executável do XAMPP2:
- **Caminho do PHP:** `C:\xampp2\php\php.exe`

## 🏃‍♂️ Comandos de Inicialização

### 1. Backend (Laravel API)
Responsável pelo processamento de dados e endpoints.
```powershell
cd backend
C:\xampp2\php\php.exe artisan serve --port=8000
```
- **URL:** http://localhost:8000

### 2. Broadcasting (Laravel Reverb)
Necessário para atualizações em tempo real (WebSockets).
```powershell
cd backend
C:\xampp2\php\php.exe artisan reverb:start --port=8080
```
- **Porta:** 8080

### 3. Frontend (Dashboard Administrativo)
Aplicação React + Vite utilizada para gestão interna.
```powershell
cd frontend
npm run dev
```
- **URL:** http://localhost:5173

### 4. Site (Público)
Aplicação Next.js voltada para o usuário final.
```powershell
cd site
npx next dev
```
- **URL:** http://localhost:3000

---

## 💡 Dicas de Troubleshooting
- **Porta Ocupada:** Verifique se as portas 8000, 8080, 5173 ou 3000 já estão sendo usadas por outros processos.
- **Node Modules:** Se algum serviço node falhar ao iniciar, rode `npm install` na pasta correspondente.
- **Docker:** Embora exista um `docker-compose.yml`, o uso direto via XAMPP2 e Node local tem se mostrado mais estável neste ambiente.
