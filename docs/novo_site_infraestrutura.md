# Documentação Técnica: Novo Site (Next.js) & Infraestrutura Híbrida

Este documento descreve a implementação do novo frontend público do projeto **O Vermelhinho**, utilizando Next.js, e a configuração da infraestrutura híbrida na VPS para suportar múltiplas versões do Node.js simultaneamente.

## 1. Visão Geral do Novo Frontend (`/site`)

Diferente do Dashboard administrativo (`/frontend`), que é uma SPA React estática, o novo site público foi construído com **Next.js 15+** com foco em SEO, performance e SSR (Server Side Rendering).

### Tecnologias Principais:
- **Framework:** Next.js (App Router)
- **Estilização:** Tailwind CSS v4
- **Dados:** TanStack Query (React Query) v5
- **Comunicação:** Axios (configurado em `src/services/api.ts`)
- **Node.js Requerido:** >= 20.9.0

---

## 2. Infraestrutura Híbrida na VPS

Para suportar o legado (Dashboard/Backend no Node 18) e o novo site (Next.js no Node 20), foi implementada uma solução baseada em **NVM (Node Version Manager)**.

### Configuração de Versões:
- **Node 18.20.8 (Default):** Utilizado pelo Laravel Octane, Worker e Dashboard administrativo.
- **Node 20.20.0:** Utilizado exclusivamente para o build e execução do novo site Next.js.

### Gerenciamento de Processos (PM2):
Os processos são isolados por interpretadores específicos:
1. `laravel-octane`: Roda no Node 18 padrão.
2. `overmelhinho-site`: Configurado para usar o interpretador `/root/.nvm/versions/node/v20.20.0/bin/node`.

---

## 3. Fluxo de Deploy Automatizado

O script `deploy.sh` na VPS foi atualizado para gerenciar as trocas de versão do Node automaticamente via NVM durante o processo de build.

### Lógica do `deploy.sh`:
- Detecta mudanças nas pastas `/backend`, `/frontend` e `/site`.
- **Se `/frontend` mudar:** Carrega `nvm use 18.20.8` -> `npm ci` -> `npm run build`.
- **Se `/site` mudar:** Carrega `nvm use 20` -> `npm ci` -> `npm run build` -> `pm2 restart overmelhinho-site`.
- **Garante Rollback:** Em caso de falha em qualquer build, o script retorna ao commit anterior.

---

## 4. Configuração de Rede (Nginx & SSL)

O acesso ao site público foi configurado no subdomínio de desenvolvimento, com redirecionamento automático para HTTPS.

- **URL:** `https://novo.overmelhinho.com.br`
- **Porta Interna:** 3000 (Proxy reverso para o processo PM2)
- **SSL:** Gerenciado via Certbot (Let's Encrypt) com renovação automática.

### Arquivo de Configuração (`/etc/nginx/sites-available/novo.overmelhinho.com.br`):
O arquivo utiliza um bloco `proxy_pass` para a porta 3000 e inclui otimizações para os arquivos estáticos do Next.js em `/_next/static`.

---

## 5. Variáveis de Ambiente (Produção)

Na VPS, o arquivo `/var/www/site/.env.local` deve ser mantido manualmente com as seguintes definições:

```env
NEXT_PUBLIC_API_URL=https://api.overmelhinho.com.br/api/v1
NEXT_PUBLIC_SITE_URL=https://novo.overmelhinho.com.br
```

---

## 6. Comandos Úteis na VPS

### Verificar processos:
```bash
pm2 status
```

### Build manual do site (se necessário):
```bash
cd /var/www/site
nvm use 20
npm run build
pm2 restart overmelhinho-site
```

### Limpar cache do Nginx após mudanças:
```bash
nginx -t && systemctl reload nginx
```
