#!/usr/bin/env bash
# Reassemble the vendored Gradle distribution (android/gradle/wrapper/
# dist-unbundled/gradle-8.14.3-bin.zip.part*) and point the wrapper at the
# local file so building never needs to download from Gradle's CDNs.
#
# This removes the network dependency which broke GitHub Actions runs where
# services.gradle.org, Tencent, Huawei and Aliyun all refused connections.
#
# Usage: bash scripts/setup-gradle-dist.sh [--ci]
#   --ci  exit silently when the parts are missing (e.g. on shallow checkouts
#         where the LFS-less parts are absent) so the wrapper falls back
set -euo pipefail
CI_MODE=0
[ "${1:-}" = "--ci" ] && CI_MODE=1

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PART_DIR="$ROOT/android/gradle/wrapper/dist-unbundled"
ZIP="$PART_DIR/gradle-8.14.3-bin.zip"
SHA256="bd71102213493060956ec229d946beee57158dbd89d0e62b91bca0fa2c5f3531"
PROPS="$ROOT/android/gradle/wrapper/gradle-wrapper.properties"

# Already installed? (previous runs)
if [ -f "$ZIP" ] && echo "$SHA256  $ZIP" | sha256sum -c --quiet >/dev/null 2>&1; then
    :
else
    if ! ls "$PART_DIR"/*.part >/dev/null 2>&1; then
        if [ "$CI_MODE" = "1" ]; then
            echo "Vendored gradle parts not present; leaving distributionUrl as-is"
            exit 0
        fi
        echo "ERROR: $PART_DIR/*.part missing — run 'git pull' (parts are committed to the repo)"
        exit 1
    fi
    cat "$PART_DIR"/*.part > "$ZIP"
    echo "$SHA256  $ZIP" | sha256sum -c --quiet
    echo "Reassembled $ZIP (sha256 verified)"
fi

# Gradle's wrapper understands file: URLs.
perl -pi -e "s|^distributionUrl=.*|distributionUrl=file:$ZIP|" "$PROPS"
grep distributionUrl "$PROPS"
echo "Gradle distribution ready (offline)."
