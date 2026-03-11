# GitHub Webhook Auto-Deploy

Este documento descreve como funciona o sistema de deploy automático via GitHub Webhook.

## Como Funciona

```
Local (VS Code) → git push → GitHub main → Webhook → VPS auto-deploy
```

Quando você roda `./deploy.ps1`, o código vai ao GitHub. O GitHub avisa imediatamente o VPS pelo Webhook. O VPS puxa o código e reconstrói tudo automaticamente.

## Arquivos Criados

| Arquivo | Localização | Função |
|---|---|---|
| `deploy-webhook.php` | `/var/www/backend/public/` | Endpoint que o GitHub chama |
| `deploy-auto.sh` | `/var/www/` | Script de build que roda no VPS |

## Configuração (única vez no VPS)

Acesse o VPS via SSH e execute:

```bash
# 1. Copiar o script para a raiz
cp /var/www/backend/public/../../../deploy-auto.sh /var/www/deploy-auto.sh
# (O script já é sincronizado pelo git pull)

# 2. Dar permissão de execução
chmod +x /var/www/deploy-auto.sh

# 3. Configurar o segredo do webhook (opcional, tem default)
# Edite o /var/www/backend/.env e adicione:
echo "DEPLOY_WEBHOOK_SECRET=overmelhinho_deploy_2026" >> /var/www/backend/.env
```

## Configuração no GitHub (única vez)

1. Vá em: https://github.com/overmelhinho/overmelhinho/settings/hooks
2. Clique em **"Add webhook"**
3. Preencha:
   - **Payload URL**: `https://dash.overmelhinho.com.br/deploy-webhook.php`
   - **Content type**: `application/json`
   - **Secret**: `overmelhinho_deploy_2026`
   - **Events**: Selecione **"Just the push event"**
4. Clique em **"Add webhook"**

## Verificando o Deploy

O log de cada deploy fica em:
```
/var/www/backend/storage/logs/deploy.log
```

Para ver ao vivo no VPS:
```bash
tail -f /var/www/backend/storage/logs/deploy.log
```

## Segurança

O webhook valida a assinatura HMAC-SHA256 enviada pelo GitHub em cada request. Apenas pushes no branch `main` disparam o deploy.
