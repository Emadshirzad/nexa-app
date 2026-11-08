#!/usr/bin/env bash
# Signs the release APK with the local release keystore.
# Requires: keystore at /tmp/opencode/nexa-rs/nexa-release.keystore (or pass NEXA_KEYSTORE_PATH)
# Usage: bash scripts/sign-release.sh <apk-file> [output]
set -euo pipefail

APK="$1"
OUT="${2:-${APK%.apk}-signed.apk}"
KS_PATH="${NEXA_KEYSTORE_PATH:-/tmp/opencode/nexa-rs/nexa-release.keystore}"
KS_PW="${NEXA_KEYSTORE_PASSWORD:?}"

SDK="${ANDROID_HOME:-$HOME/Android/Sdk}"

# Align (zipalign) then sign (apksigner v1+v2)
ZIPALIGN=$(find "$SDK/build-tools" -name zipalign | sort -V | tail -1)
APKSIGNER=$(find "$SDK/build-tools" -name apksigner | sort -V | tail -1)

ALIGNED="$OUT.aligned"
"$ZIPALIGN" -f -p 4 "$APK" "$ALIGNED"
"$APKSIGNER" sign \
  --ks "$KS_PATH" \
  --ks-pass "pass:$KS_PW" \
  --key-pass "pass:$KS_PW" \
  --ks-key-alias nexa-crm-release \
  --out "$OUT" "$ALIGNED"
rm -f "$ALIGNED"

"$APKSIGNER" verify --print-certs "$OUT" | tee "${OUT%.apk}-certs.txt"
sha256sum "$OUT" > "${OUT%.apk}.sha256"
