#!/bin/bash
# ============================================================
# deploy-auto.sh - Script de auto-deploy executado pelo webhook
# Localização: /var/www/deploy-auto.sh
# ============================================================

set -e  # Para imediatamente se qualquer comando falhar

ROOT_DIR="/var/www"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_DIR="${ROOT_DIR}/backend"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "${LOG_PREFIX} === DEPLOY AUTOMÁTICO INICIADO ==="

# ── 1. Git Pull ──────────────────────────────────────────────
echo "${LOG_PREFIX} [1/5] Sincronizando código com o GitHub..."
cd "${ROOT_DIR}"
git fetch --all --quiet
git reset --hard origin/main --quiet
echo "${LOG_PREFIX} ✓ Código atualizado."

# ── 2. Backend: Dependências e Cache ─────────────────────────
echo "${LOG_PREFIX} [2/5] Atualizando dependências do backend..."
cd "${BACKEND_DIR}"
composer install --no-interaction --prefer-dist --optimize-autoloader --quiet
php artisan config:cache --quiet
php artisan route:cache --quiet
php artisan view:cache --quiet
php artisan cache:clear --quiet
php artisan migrate --force --quiet
echo "${LOG_PREFIX} ✓ Backend atualizado."

# ── 3. Frontend: Build ───────────────────────────────────────
echo "${LOG_PREFIX} [3/5] Gerando build do frontend..."
cd "${FRONTEND_DIR}"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
command -v nvm >/dev/null && nvm install 20 && nvm use 20
npm ci --silent
npm run build
echo "${LOG_PREFIX} ✓ Frontend compilado."

# ── 4. Permissões ────────────────────────────────────────────
echo "${LOG_PREFIX} [4/5] Ajustando permissões..."
chmod -R 755 "${BACKEND_DIR}/storage"
chmod -R 755 "${BACKEND_DIR}/bootstrap/cache"
echo "${LOG_PREFIX} ✓ Permissões ajustadas."

# ── 5. Reiniciar Octane ──────────────────────────────────────
echo "${LOG_PREFIX} [5/5] Reiniciando servidor Octane..."
cd "${BACKEND_DIR}"
php artisan octane:reload 2>/dev/null || pm2 restart laravel-octane 2>/dev/null || true
echo "${LOG_PREFIX} ✓ Servidor reiniciado."

echo "${LOG_PREFIX} === DEPLOY CONCLUÍDO COM SUCESSO ==="
