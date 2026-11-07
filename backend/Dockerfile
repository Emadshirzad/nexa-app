# syntax=docker/dockerfile:1.7
#
# Nexa CRM API — PHP 8.3-FPM on Alpine.
#
# Two stages keep the runtime image free of Composer, build headers and dev
# dependencies. The resulting image runs Laravel from /var/www/html and
# listens on FastCGI port 9000; nginx (the `web` service) is the only public
# entry point.

FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --prefer-dist \
        --no-scripts \
        --optimize-autoloader


FROM php:8.3-fpm-alpine

# Extensions required by Laravel + MySQL. Build headers are installed and
# removed in a single virtual package so they never end up in the image.
RUN apk add --no-cache --virtual .persistent-deps \
        icu-libs \
        libzip \
        oniguruma \
        su-exec \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libzip-dev \
        oniguruma-dev \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        bcmath \
        intl \
        zip \
        pcntl \
    && apk del .build-deps \
    && rm -rf /tmp/* /usr/src/php*

# Memory-conscious PHP/FPM defaults (see docker/php.ini + php-fpm.conf).
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-nexa.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-nexa.conf

WORKDIR /var/www/html

COPY --from=vendor /app/vendor ./vendor
COPY . .

# `docker/` is a build artefact, not application code. Create the writable
# Laravel directories and generate the package manifest while we are still
# root, then leave app code owned by root (read-only for FPM) — only
# storage/ and bootstrap/cache need to be writable.
RUN rm -rf docker tests phpunit.xml \
    && mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        storage/app/public \
        bootstrap/cache \
    && php artisan package:discover --ansi

COPY docker/entrypoint.sh /usr/local/bin/nexa-entrypoint.sh
RUN chmod 0755 /usr/local/bin/nexa-entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["nexa-entrypoint.sh"]
CMD ["php-fpm", "-F"]
