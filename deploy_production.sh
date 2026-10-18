#!/usr/bin/env bash
# Run in Google Cloud Shell. Creates billable HA SQL, Cloud Run and Scheduler resources.
# Leaves the web service IAM-private. Follow PRODUCTION_DEPLOYMENT.md before public release.
set -euo pipefail
if [[ "${SAVIPOLA_APPROVE_PAID_HA:-}" != "yes" ]]; then
  printf '%s\n' 'This older script provisions paid HA SQL outside the US$10 evaluation budget. Read EVALUATION_DEPLOYMENT.md. Set SAVIPOLA_APPROVE_PAID_HA=yes only after a separate cost review.' >&2
  exit 1
fi
: "${SAVIPOLA_PROJECT:?Set your billing-enabled GCP project ID}"
: "${FIREBASE_API_KEY:?Copy apiKey from your Firebase web app}"
: "${FIREBASE_AUTH_DOMAIN:?Copy authDomain from your Firebase web app}"
: "${FIREBASE_APP_ID:?Copy appId from your Firebase web app}"
: "${GEMINI_MODEL:?Choose a currently supported Vertex Gemini model}"
: "${SAVIPOLA_SUPPORT_EMAIL:?Set your real monitored support email}"
export SAVIPOLA_REGION="${SAVIPOLA_REGION:-asia-southeast1}"
export SAVIPOLA_SERVICE="${SAVIPOLA_SERVICE:-savipola-prod}"
export SAVIPOLA_SQL="${SAVIPOLA_SERVICE}-db"
export SAVIPOLA_RUNTIME="${SAVIPOLA_SERVICE}-runtime@${SAVIPOLA_PROJECT}.iam.gserviceaccount.com"
export SAVIPOLA_WORKER="${SAVIPOLA_SERVICE}-worker@${SAVIPOLA_PROJECT}.iam.gserviceaccount.com"
export SAVIPOLA_SECRET="${SAVIPOLA_SERVICE}-db-password"
export SAVIPOLA_CONNECTION="${SAVIPOLA_PROJECT}:${SAVIPOLA_REGION}:${SAVIPOLA_SQL}"
export SAVIPOLA_PROJECT FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_APP_ID GEMINI_MODEL SAVIPOLA_SUPPORT_EMAIL
cd "$(dirname "$0")"
if ! command -v firebase >/dev/null 2>&1; then
  printf '%s\n' 'Install Firebase CLI and authenticate it first; see SUBMISSION_HANDOFF.md.' >&2
  exit 1
fi
gcloud config set project "$SAVIPOLA_PROJECT" >/dev/null
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  aiplatform.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com \
  identitytoolkit.googleapis.com cloudscheduler.googleapis.com firestore.googleapis.com firebaserules.googleapis.com
if ! gcloud firestore databases describe --database='(default)' >/dev/null 2>&1; then
  gcloud firestore databases create --database='(default)' --location="$SAVIPOLA_REGION" \
    --type=firestore-native --edition=standard --delete-protection --enable-pitr
fi
python3 ops/check_firestore.py
firebase deploy --only firestore:rules --project="$SAVIPOLA_PROJECT" --non-interactive
for SAVIPOLA_ACCOUNT in "${SAVIPOLA_SERVICE}-runtime" "${SAVIPOLA_SERVICE}-worker"; do
  if ! gcloud iam service-accounts describe "$SAVIPOLA_ACCOUNT@$SAVIPOLA_PROJECT.iam.gserviceaccount.com" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$SAVIPOLA_ACCOUNT"
  fi
done
for SAVIPOLA_ROLE in roles/aiplatform.user roles/cloudsql.client roles/datastore.user; do
  gcloud projects add-iam-policy-binding "$SAVIPOLA_PROJECT" --member="serviceAccount:$SAVIPOLA_RUNTIME" --role="$SAVIPOLA_ROLE" --quiet >/dev/null
done
SAVIPOLA_AUTH_ROLE="savipolaFirebaseSessions"
if gcloud iam roles describe "$SAVIPOLA_AUTH_ROLE" --project="$SAVIPOLA_PROJECT" >/dev/null 2>&1; then
  gcloud iam roles update "$SAVIPOLA_AUTH_ROLE" --project="$SAVIPOLA_PROJECT" --permissions=firebaseauth.users.get,firebaseauth.users.createSession --stage=GA >/dev/null
else
  gcloud iam roles create "$SAVIPOLA_AUTH_ROLE" --project="$SAVIPOLA_PROJECT" --title='SaviPola Firebase sessions' --permissions=firebaseauth.users.get,firebaseauth.users.createSession --stage=GA >/dev/null
fi
gcloud projects add-iam-policy-binding "$SAVIPOLA_PROJECT" --member="serviceAccount:$SAVIPOLA_RUNTIME" --role="projects/$SAVIPOLA_PROJECT/roles/$SAVIPOLA_AUTH_ROLE" --quiet >/dev/null
if ! gcloud sql instances describe "$SAVIPOLA_SQL" >/dev/null 2>&1; then
  gcloud sql instances create "$SAVIPOLA_SQL" --database-version=POSTGRES_16 --edition=ENTERPRISE \
    --tier=db-custom-1-3840 --region="$SAVIPOLA_REGION" --availability-type=REGIONAL \
    --storage-size=10 --storage-auto-increase --backup-start-time=03:00 \
    --enable-point-in-time-recovery --retained-backups-count=7 --deletion-protection
else
  python3 ops/check_sql.py
fi
if ! gcloud sql databases describe savipola --instance="$SAVIPOLA_SQL" >/dev/null 2>&1; then
  gcloud sql databases create savipola --instance="$SAVIPOLA_SQL"
fi
SAVIPOLA_TEMP="$(mktemp -d)"
chmod 700 "$SAVIPOLA_TEMP"
trap 'rm -rf "$SAVIPOLA_TEMP"' EXIT
export SAVIPOLA_PASSWORD_PATH="$SAVIPOLA_TEMP/password"
if gcloud secrets describe "$SAVIPOLA_SECRET" >/dev/null 2>&1; then
  gcloud secrets versions access latest --secret="$SAVIPOLA_SECRET" > "$SAVIPOLA_PASSWORD_PATH"
else
  python3 -c 'import secrets,os;open(os.environ["SAVIPOLA_PASSWORD_PATH"],"w").write(secrets.token_urlsafe(40))'
  gcloud secrets create "$SAVIPOLA_SECRET" --replication-policy=automatic --data-file="$SAVIPOLA_PASSWORD_PATH"
fi
chmod 600 "$SAVIPOLA_PASSWORD_PATH"
# SQL Admin REST reads the password from a private temporary file, never a command argument.
python3 ops/set_sql_password.py
gcloud secrets add-iam-policy-binding "$SAVIPOLA_SECRET" --member="serviceAccount:$SAVIPOLA_RUNTIME" --role=roles/secretmanager.secretAccessor --quiet >/dev/null
SAVIPOLA_SECRET_VERSION="$(gcloud secrets versions list "$SAVIPOLA_SECRET" --filter='state=ENABLED' --sort-by='~createTime' --limit=1 --format='value(name)')"
SAVIPOLA_SECRET_VERSION="${SAVIPOLA_SECRET_VERSION##*/}"
export SAVIPOLA_BOOT_ORIGIN="https://bootstrap.invalid"
python3 ops/write_cloud_env.py > "$SAVIPOLA_TEMP/env.json"
gcloud run deploy "$SAVIPOLA_SERVICE" --source=. --region="$SAVIPOLA_REGION" \
  --execution-environment=gen2 --service-account="$SAVIPOLA_RUNTIME" --no-allow-unauthenticated \
  --add-cloudsql-instances="$SAVIPOLA_CONNECTION" --env-vars-file="$SAVIPOLA_TEMP/env.json" \
  --set-secrets="DB_PASS=$SAVIPOLA_SECRET:$SAVIPOLA_SECRET_VERSION" \
  --max-instances=3 --concurrency=8 --memory=1Gi --cpu=1 --timeout=300
SAVIPOLA_URL="$(gcloud run services describe "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION" --format='value(status.url)')"
gcloud run services update "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION" --update-env-vars="SAVIPOLA_PUBLIC_ORIGIN=$SAVIPOLA_URL"
gcloud run services add-iam-policy-binding "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION" --member="serviceAccount:$SAVIPOLA_WORKER" --role=roles/run.invoker --quiet >/dev/null
SAVIPOLA_SCHEDULER_ACTION=create
if gcloud scheduler jobs describe "${SAVIPOLA_SERVICE}-translations" --location="$SAVIPOLA_REGION" >/dev/null 2>&1; then
  SAVIPOLA_SCHEDULER_ACTION=update
fi
gcloud scheduler jobs "$SAVIPOLA_SCHEDULER_ACTION" http "${SAVIPOLA_SERVICE}-translations" --location="$SAVIPOLA_REGION" \
  --schedule='* * * * *' --uri="$SAVIPOLA_URL/internal/translation-sweep" --http-method=POST \
  --oidc-service-account-email="$SAVIPOLA_WORKER" --oidc-token-audience="$SAVIPOLA_URL" --attempt-deadline=180s
python3 - "$SAVIPOLA_URL" <<'PY'
import sys
print('Service created (IAM-private): '+sys.argv[1])
print('Next: authorize its hostname in Firebase, then follow the staging checks and public-access command in PRODUCTION_DEPLOYMENT.md.')
PY
