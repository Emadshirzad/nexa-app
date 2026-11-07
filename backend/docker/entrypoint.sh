#!/bin/sh
#
# Nexa CRM API entrypoint.
#
# Waits for MariaDB, persists an APP_KEY across container recreations (only
# the `api` service holds KEY_PROVIDER=1; worker/scheduler wait for the key
# to appear on the shared storage volume), caches Laravel configuration,
# then execs the container command (php-fpm | queue:work | schedule:work).
# Everything is idempotent, so the container can restart safely.

set -eu

APP_ROOT="${APP_ROOT:-/var/www/html}"
DATA_DIR="${NEXA_DATA_DIR:-${APP_ROOT}/storage}"
KEY_FILE="${DATA_DIR}/app.key"

log() {
    printf '%s entrypoint: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

mkdir -p \
    "${APP_ROOT}/storage/framework/cache/data" \
    "${APP_ROOT}/storage/framework/sessions" \
    "${APP_ROOT}/storage/framework/views" \
    "${APP_ROOT}/storage/logs" \
    "${APP_ROOT}/storage/app/public" \
    "${APP_ROOT}/bootstrap/cache" \
    "${DATA_DIR}"

# Named volumes are created as root; the FPM workers run as www-data.
chown -R www-data:www-data \
    "${APP_ROOT}/storage" \
    "${APP_ROOT}/bootstrap/cache" 2>/dev/null || true

# Persistent APP_KEY: generated once by the api service, reused everywhere.
if [ -z "${APP_KEY:-}" ]; then
    if [ ! -s "${KEY_FILE}" ] && [ "${KEY_PROVIDER:-0}" = "1" ]; then
        APP_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
        (umask 077 && printf '%s' "${APP_KEY}" > "${KEY_FILE}")
        chmod 0600 "${KEY_FILE}"
        chown www-data:www-data "${KEY_FILE}" 2>/dev/null || true
        log "generated a new APP_KEY and persisted it in ${KEY_FILE}"
    elif [ -s "${KEY_FILE}" ]; then
        APP_KEY="$(cat "${KEY_FILE}")"
        log "using the persisted APP_KEY from ${KEY_FILE}"
    else
        log "no APP_KEY env and no key file yet; waiting for the provider..."
        until [ -s "${KEY_FILE}" ]; do
            sleep 2
        done
        APP_KEY="$(cat "${KEY_FILE}")"
        log "APP_KEY found in ${KEY_FILE}"
    fi
    export APP_KEY
else
    log "using the APP_KEY provided by the environment"
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    log "waiting for the database at ${DB_HOST:-mariadb}..."
    until php -r '
      $h = getenv("DB_HOST") ?: "mariadb";
      $u = getenv("DB_USERNAME") ?: "nexa";
      $p = getenv("DB_PASSWORD");
      try {
        new PDO("mysql:host=$h", $u, $p, [PDO::ATTR_TIMEOUT => 2]);
        exit(0);
      } catch (Throwable $e) {
        exit(1);
      }
    '; do
        log "MariaDB not ready, retrying in 2s..."
        sleep 2
    done
    log "running database migrations"
    php artisan migrate --force --no-interaction
else
    log "RUN_MIGRATIONS disabled, skipping the wait and migrations"
fi

log "caching configuration and compiled views"
php artisan config:cache --no-interaction
php artisan view:cache --no-interaction || true

# Files created by artisan above are root-owned; refresh ownership once more.
chown -R www-data:www-data \
    "${APP_ROOT}/storage" \
    "${APP_ROOT}/bootstrap/cache" 2>/dev/null || true

# Drop root privileges for non-fpm commands (queue:work, schedule:work) so
# task output keeps matching the www-data-owned storage volume. su-exec is
# installed in the image (see Dockerfile).
if [ "$1" != "php-fpm" ]; then
    exec su-exec www-data:www-data "$@"
fi

log "starting php-fpm"
exec "$@"
