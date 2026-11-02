FROM php:8.3-cli-bookworm

# PHP extensions required by Laravel + MySQL
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        libzip-dev \
        libonig-dev \
        libxml2-dev \
        unzip \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        bcmath \
        zip \
        pcntl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP dependencies first for layer caching
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-progress

# Copy the rest of the application
COPY . .

RUN php artisan config:clear >/dev/null 2>&1 || true

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint"]
