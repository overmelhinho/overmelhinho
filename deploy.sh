#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www"
LOCK_FILE="/tmp/overmelhinho_deploy.lock"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

fail() {
  log "❌ ERRO: $*"
  exit 1
}

# Lock para evitar deploy concorrente
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  fail "Já existe um deploy em andamento (lock: $LOCK_FILE)."
fi

# Carregar NVM se disponível
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  log "Carregando NVM..."
  source "$NVM_DIR/nvm.sh"
else
  log "⚠️ Aviso: NVM não encontrado. Usando Node padrão do sistema."
fi

cd "$APP_DIR"

log "== DEPLOY START =="

# Garantir que o remote está correto (SSH)
git remote -v | grep -q "git@github.com:overmelhinho/overmelhinho.git" || \
  log "⚠️ Aviso: origin não parece estar em SSH correto."

# Pega commits para diff
PREV_COMMIT="$(git rev-parse HEAD)"
PREV_SHORT="$(git rev-parse --short HEAD)"

log "Commit atual: $PREV_SHORT"
log "Atualizando repositório..."

git fetch origin main
git reset --hard origin/main

NEW_COMMIT="$(git rev-parse HEAD)"
NEW_SHORT="$(git rev-parse --short HEAD)"

if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
  log "Nada novo para deploy. Encerrando."
  log "== DEPLOY END =="
  exit 0
fi

log "Novo commit: $NEW_SHORT"

# Detectar alterações por pasta
CHANGED="$(git diff --name-only "$PREV_COMMIT" "$NEW_COMMIT" || true)"

backend_changed=false
frontend_changed=false
site_changed=false

if echo "$CHANGED" | grep -qE '^backend/'; then backend_changed=true; fi
if echo "$CHANGED" | grep -qE '^frontend/'; then frontend_changed=true; fi
if echo "$CHANGED" | grep -qE '^site/'; then site_changed=true; fi

log "Mudanças detectadas:"
echo "$CHANGED" | sed 's/^/ - /'

rollback() {
  log "⏪ ROLLBACK: voltando para $PREV_SHORT"
  git reset --hard "$PREV_COMMIT" || true

  if $backend_changed; then
    log "Rollback backend: composer + caches + restart octane"
    cd "$APP_DIR/backend"
    command -v nvm >/dev/null && nvm use 18.20.8
    composer install --no-dev --optimize-autoloader || true
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
    pm2 restart laravel-octane || true
    pm2 save || true
  fi

  if $frontend_changed; then
    log "Rollback frontend: rebuild"
    cd "$APP_DIR/frontend"
    command -v nvm >/dev/null && nvm use 18.20.8
    npm ci || true
    npm run build || true
  fi

  if $site_changed; then
    log "Rollback site (nextjs): rebuild + restart"
    cd "$APP_DIR/site"
    command -v nvm >/dev/null && nvm use 20
    npm ci || true
    npm run build || true
    pm2 restart overmelhinho-site || true
  fi

  log "Rollback finalizado."
}

# Se qualquer coisa falhar daqui pra frente, faz rollback
trap 'rollback; fail "Deploy falhou e rollback foi executado."' ERR

# BACKEND
if $backend_changed; then
  log "== BACKEND DEPLOY =="
  cd "$APP_DIR/backend"

  # composer (sem dev)
  log "composer install..."
  export COMPOSER_ALLOW_SUPERUSER=1
  composer install --no-dev --optimize-autoloader --no-interaction

  # migrations
  log "php artisan migrate..."
  php artisan migrate --force

  # caches
  log "cacheando config/routes/views..."
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache

  # permissões (muito importante)
  log "ajustando permissões storage/cache..."
  chown -R www-data:www-data "$APP_DIR/backend/storage" "$APP_DIR/backend/bootstrap/cache"
  chmod -R ug+rwx "$APP_DIR/backend/storage" "$APP_DIR/backend/bootstrap/cache"

  # restart octane
  log "reiniciando laravel-octane (pm2)..."
  pm2 restart laravel-octane
  pm2 save
else
  log "Backend sem mudanças — pulando."
fi

# FRONTEND
if $frontend_changed; then
  log "== FRONTEND DEPLOY =="
  cd "$APP_DIR/frontend"

  log "npm ci..."
  command -v nvm >/dev/null && nvm use 18.20.8
  npm ci

  log "npm run build (atômico)..."
  # Build em pasta temporária para evitar tela branca durante o processo
  rm -rf dist_new
  npm run build -- --outDir dist_new

  if [ -d "dist_new" ]; then
    log "Swap de pastas dist..."
    rm -rf dist_old
    [ -d "dist" ] && mv dist dist_old
    mv dist_new dist
    rm -rf dist_old
  else
    fail "Build falhou: pasta dist_new não foi criada."
  fi

  # garantir que o dist pode ser lido pelo Nginx
  log "ajustando permissões do dist..."
  chown -R www-data:www-data "$APP_DIR/frontend/dist" || true
  chmod -R a+rX "$APP_DIR/frontend/dist" || true
else
  # Verifica se o dist sumiu por algum motivo, se sim, força build
  if [ ! -d "$APP_DIR/frontend/dist" ]; then
    log "⚠️ Pasta dist não encontrada. Forçando build..."
    cd "$APP_DIR/frontend"
    command -v nvm >/dev/null && nvm use 18.20.8
    npm run build
  fi
  log "Frontend sem mudanças — pulando."
fi

# SITE (Next.js)
if $site_changed; then
  log "== SITE (NEXTJS) DEPLOY =="
  cd "$APP_DIR/site"

  log "npm ci..."
  command -v nvm >/dev/null && nvm use 20
  npm ci

  log "npm run build..."
  npm run build

  log "reiniciando site (pm2)..."
  # Tenta reiniciar, se não existir, cria o processo
  pm2 restart overmelhinho-site || pm2 start npm --name "overmelhinho-site" -- start
  pm2 save
else
  log "Site sem mudanças — pulando."
fi

log "== DEPLOY OK =="
log "De $PREV_SHORT -> $NEW_SHORT"
log "== DEPLOY END =="

exit 0
