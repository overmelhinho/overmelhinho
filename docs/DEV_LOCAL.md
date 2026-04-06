# 🖥️ Guia de Desenvolvimento Local

Este guia explica como rodar o projeto **Vermelhinho** localmente no Windows, conectado ao banco de dados de produção (Supabase).

---

## ✅ Pré-requisitos

| Ferramenta | Versão mínima | Onde está no projeto |
|---|---|---|
| **PHP 8.2+** | 8.2 | `C:\xampp2\php\php.exe` |
| **Node.js** | 20+ | via `nvm` (já instalado) |
| **npm** | 10+ | junto com Node.js |

> ⚠️ PHP vem do XAMPP2 em `C:\xampp2\php\php.exe`. NÃO use o PHP do PATH padrão se houver outro instalado.

---

## 🚀 Como subir os serviços

Abra **dois terminais separados** (PowerShell ou CMD).

### Terminal 1 — Backend (Laravel)

```powershell
cd C:\Dev\overmelhinho\backend
C:\xampp2\php\php.exe artisan serve --host=0.0.0.0 --port=8000
```

Saída esperada:
```
INFO  Server running on [http://0.0.0.0:8000].
Press Ctrl+C to stop the server
```

### Terminal 2 — Frontend (React + Vite) — Painel Administrativo

```powershell
cd C:\Dev\overmelhinho\frontend
npm run dev
```

Saída esperada:
```
VITE v6.x  ready in XXXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### Terminal 3 — Site (Next.js) — Site Público

> ⚠️ No Windows, `npm run dev` pode ser interrompido por um prompt de batch. Use o comando direto abaixo:

```powershell
cd C:\Dev\overmelhinho\site
node node_modules\next\dist\bin\next dev
```

Saída esperada:
```
▲ Next.js 16.x (Turbopack)
- Local:   http://localhost:3000
✓ Ready in XX.Xs
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---|---|---|
| **Site (Next.js)** | http://localhost:3000 | Site público |
| **Frontend (React)** | http://localhost:5173 | Painel administrativo |
| **Backend API (Laravel)** | http://localhost:8000 | API REST |
| **API Health Check** | http://localhost:8000/api/v1/health | Verificação de saúde |

---

## 🗄️ Banco de Dados

O `.env` do backend já aponta para o banco **Supabase de produção**:

```
DB_CONNECTION=pgsql
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
```

> ⚠️ **Atenção:** Você estará operando em dados reais. Tenha cuidado ao criar/deletar registros.

---

## 🔧 Variáveis de Ambiente

### Backend — `backend/.env`

Arquivo já configurado. Principais variáveis:

| Variável | Valor |
|---|---|
| `APP_URL` | `http://localhost:8000` |
| `FRONTEND_URL` | `http://localhost:5173` |
| `DB_CONNECTION` | `pgsql` (Supabase) |
| `BROADCAST_CONNECTION` | `reverb` |

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🛑 Como parar os serviços

Em cada terminal, pressione **`Ctrl + C`**.

---

## ⚠️ Problemas Conhecidos

### Prompt "Deseja finalizar o arquivo em lotes (S/N)?" ao iniciar o Vite

Isso ocorre no Windows quando o `npm run dev` é executado via script `.cmd`. Ao aparecer a mensagem, **pressione `N` + Enter** para manter o servidor rodando.

Alternativa — usar diretamente o Vite:
```powershell
cd C:\Dev\overmelhinho\frontend
npx vite
```

### Porta já em uso (`EADDRINUSE`)

Se a porta 8000 ou 5173 já estiver em uso de uma sessão anterior:

```powershell
# Encontrar o processo usando a porta
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Encerrar pelo PID (substitua XXXX pelo número)
taskkill /PID XXXX /F
```

### PHP não encontrado

Sempre use o caminho completo: `C:\xampp2\php\php.exe`  
Ou adicione `C:\xampp2\php` ao PATH do Windows nas variáveis de ambiente do sistema.

---

## 📋 Checklist Rápido

- [ ] Abrir Terminal 1 → iniciar backend: `C:\xampp2\php\php.exe artisan serve --host=0.0.0.0 --port=8000`
- [ ] Abrir Terminal 2 → iniciar painel admin: `npm run dev` em `frontend/`
- [ ] Abrir Terminal 3 → iniciar site público: `node node_modules\next\dist\bin\next dev` em `site/`
- [ ] Acessar http://localhost:3000 → site público
- [ ] Acessar http://localhost:5173 → painel administrativo
- [ ] Confirmar que o login funciona (conecta no Supabase)
