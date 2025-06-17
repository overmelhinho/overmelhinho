# Usa imagem PHP com FPM
FROM php:8.2-fpm

# Instalações essenciais e extensões PHP
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip libzip-dev libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd zip

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Define diretório correto do backend
WORKDIR /var/www/backend

# Copia apenas os arquivos do backend
COPY ./backend ./

# Instala dependências do Laravel
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Ajusta permissões para o Laravel
RUN chown -R www-data:www-data /var/www/backend \
    && chmod -R 775 storage bootstrap/cache
