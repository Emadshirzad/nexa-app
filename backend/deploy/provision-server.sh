#!/usr/bin/env bash
# Provision irpaymard for Nexa docker-compose deployment.
#
# Run ON THE SERVER (or over ssh). Safe to re-run: every step is guarded.
# The `deploy` user needs sudo only for creating /var/www/nexa.
#
#   ssh irpaymard
#   bash provision-server.sh                # will prompt for sudo password once
#
# Steps:
#   1. /var/www/nexa/{releases,shared} owned by deploy
#   2. shared .env (from env.production.example + generated DB password)
#   3. nexa database + nexa_app user in the shared mariadb
#   4. GitHub deploy key + CI keypair in /home/deploy/nexa
#   5. github.com in known_hosts + ssh config
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/nexa}
REPO_URL=${REPO_URL:-git@github.com:Emadshirzad/nexa-app.git}
DOMAIN=${DOMAIN:-nexa.shirzadd.ir}
MARIADB_ROOT_PASSWORD=${MARIADB_ROOT_PASSWORD:?export MARIADB_ROOT_PASSWORD first}

echo "==> [1/5] directories under $APP_DIR (uses sudo)"
sudo mkdir -p "$APP_DIR/releases" "$APP_DIR/shared" "$APP_DIR/persist"
sudo chown -R "$USER:$USER" "$APP_DIR"

echo "==> [2/5] shared .env"
if [ ! -f "$APP_DIR/shared/.env" ]; then
    DB_PASS=$(openssl rand -base64 24 | tr -d '=+/' | head -c 27)
    sed "s|^DB_PASSWORD=.*|DB_PASSWORD=$DB_PASS|" \
        "$(dirname "$0")/env.production.example" > "$APP_DIR/shared/.env"
    chmod 600 "$APP_DIR/shared/.env"
    echo "  generated .env at $APP_DIR/shared/.env"
else
    echo "  .env already exists, leaving as-is"
fi

echo "==> [3/5] database + user in shared mariadb"
PW=$(grep '^DB_PASSWORD=' "$APP_DIR/shared/.env" | cut -d= -f2)
docker exec -i mariadb mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS nexa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nexa_app'@'%' IDENTIFIED BY '$PW';
GRANT ALL PRIVILEGES ON nexa.* TO 'nexa_app'@'%';
FLUSH PRIVILEGES;
SQL

echo "==> [4/5] SSH keys for github + CI"
KEY_DIR=$HOME/nexa
mkdir -p "$KEY_DIR"
[ -f "$KEY_DIR/github_deploy_key" ] || ssh-keygen -q -t ed25519 -N '' -f "$KEY_DIR/github_deploy_key" -C nexa-github-deploy
[ -f "$KEY_DIR/ci_key" ]           || ssh-keygen -q -t ed25519 -N '' -f "$KEY_DIR/ci_key" -C nexa-github-actions-ci
grep -q "$(cut -d' ' -f2 "$KEY_DIR/ci_key.pub")" ~/.ssh/authorized_keys 2>/dev/null ||
    cat "$KEY_DIR/ci_key.pub" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

echo "      GitHub deploy key (add it at $REPO_URL -> Settings -> Deploy keys, read-only):"
cat "$KEY_DIR/github_deploy_key.pub"

echo "==> [5/5] github.com in known_hosts + ssh config"
touch ~/.ssh/known_hosts ~/.ssh/config
chmod 700 ~/.ssh
grep -q 'github.com' ~/.ssh/known_hosts || ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null
grep -q 'github.com' ~/.ssh/config || printf 'Host github.com\n  HostName github.com\n  User git\n  IdentityFile %s/github_deploy_key\n  IdentitiesOnly yes\n' "$KEY_DIR" >> ~/.ssh/config
chmod 600 ~/.ssh/known_hosts ~/.ssh/config

echo "==> Verifying server can read the repository"
git ls-remote "$REPO_URL" HEAD >/dev/null 2>&1 && echo "OK: server can clone $REPO_URL" ||
    { echo "NOT OK: add the deploy key printed above, then re-run this script"; exit 1; }

echo "Provisioning done."
