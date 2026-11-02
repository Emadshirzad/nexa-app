#!/bin/sh
set -e

echo "[entrypoint] waiting for MySQL..."
until php -r '
  $h = getenv("DB_HOST") ?: "mysql";
  $u = getenv("DB_USERNAME") ?: "nexa";
  $p = getenv("DB_PASSWORD") ?: "nexa_secret";
  try {
    new PDO("mysql:host=$h", $u, $p, [PDO::ATTR_TIMEOUT => 2]);
    exit(0);
  } catch (Throwable $e) {
    exit(1);
  }
'
do
  echo "[entrypoint] MySQL not ready, retrying in 2s..."
  sleep 2
done

echo "[entrypoint] running migrations..."
php artisan migrate --force

echo "[entrypoint] starting Laravel dev server on :8080"
exec php artisan serve --host=0.0.0.0 --port=8080
