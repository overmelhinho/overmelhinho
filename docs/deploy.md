# Fluxo de Deploy

Este documento descreve como o código é versionado e implantado nos ambientes de produção.

## 1. Fluxo Geral

O projeto utiliza o GitHub como intermediário entre o desenvolvimento local e o servidor de produção (VPS).

```mermaid
graph LR;
    Local[Desenvolvimento Local] -- "deploy.ps1 (Push)" --> GitHub[GitHub (main)]
    GitHub -- "deploy.sh (Pull & Build)" --> VPS[Servidor VPS]
```

## 2. Deploy para o GitHub (Local)

Para enviar as alterações locais para o repositório central no GitHub, utilize o script PowerShell na raiz do projeto:

- **Arquivo:** `deploy.ps1`
- **O que ele faz:**
  1. Solicita uma mensagem de commit.
  2. Executa `git add .`.
  3. Executa `git commit -m "sua mensagem"`.
  4. Executa `git push origin main`.

**Como usar:**
No terminal (PowerShell), execute:
```powershell
./deploy.ps1
```

## 3. Deploy para a Produção (VPS)

O servidor de produção possui um script que sincroniza o código e realiza as tarefas de build e atualização de serviços.

- **Arquivo:** `deploy.sh` (Localizado em `/var/www` no servidor).
- **Responsabilidades:**
  - `git fetch` e `git reset --hard` para garantir que o código seja idêntico ao do GitHub.
  - Sincronização de dependências (`composer install`, `npm ci`).
  - Execução de migrations (`php artisan migrate`).
  - Geração de caches do Laravel para performance.
  - Build do frontend (`npm run build`).
  - Reinicialização do servidor de alta performance (`pm2 restart laravel-octane`).
  - **Auto-Rollback:** Caso algum passo falhe, o script reverte automaticamente para o commit anterior estável.

## 4. Configuração Git

O repositório está configurado para o seguinte endereço:
- **Remote:** `git@github.com:overmelhinho/overmelhinho.git`
- **Branch Principal:** `main`
