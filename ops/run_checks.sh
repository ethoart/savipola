#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SAVIPOLA_PYTHON="${SAVIPOLA_PYTHON:-python3}"
for SAVIPOLA_TEST in test_flow.py test_ai_and_stock.py test_community.py test_cloud_security.py test_firebase_identity.py test_production_config.py test_saved_harvests.py; do
  "$SAVIPOLA_PYTHON" "$SAVIPOLA_TEST"
done
"$SAVIPOLA_PYTHON" -m pip check
"$SAVIPOLA_PYTHON" ops/audit_public_source.py .
bash -n deploy_production.sh
for SAVIPOLA_SCRIPT in static/mobile.js static/transport.js static/firebase-auth.js static/cloud-copy.js; do
  node --check "$SAVIPOLA_SCRIPT"
done
