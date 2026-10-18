#!/usr/bin/env bash
# Run from Google Cloud Shell in a billing-enabled project. Creates billable resources.
set -euo pipefail
: "${SAVIPOLA_PROJECT:?Set SAVIPOLA_PROJECT to your Google Cloud project ID}"
SAVIPOLA_REGION="${SAVIPOLA_REGION:-asia-southeast1}"
SAVIPOLA_SERVICE="savipola-demo"
SAVIPOLA_SA="savipola-runtime@${SAVIPOLA_PROJECT}.iam.gserviceaccount.com"
SAVIPOLA_INSTANCE="${SAVIPOLA_PROJECT}:${SAVIPOLA_REGION}:savipola-db"
SAVIPOLA_MODEL="${GEMINI_MODEL:-gemini-3.5-flash-lite}"
cd "$(dirname "$0")"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  aiplatform.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com \
  --project="$SAVIPOLA_PROJECT"

if ! gcloud iam service-accounts describe "$SAVIPOLA_SA" --project="$SAVIPOLA_PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create savipola-runtime --display-name="SaviPola demo runtime" --project="$SAVIPOLA_PROJECT"
fi
for SAVIPOLA_ROLE in roles/aiplatform.user roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding "$SAVIPOLA_PROJECT" \
    --member="serviceAccount:$SAVIPOLA_SA" --role="$SAVIPOLA_ROLE" --quiet >/dev/null
done

if ! gcloud sql instances describe savipola-db --project="$SAVIPOLA_PROJECT" >/dev/null 2>&1; then
  gcloud sql instances create savipola-db --database-version=POSTGRES_16 --edition=ENTERPRISE \
    --tier=db-f1-micro --region="$SAVIPOLA_REGION" --storage-size=10 \
    --project="$SAVIPOLA_PROJECT"
fi
if ! gcloud sql databases describe savipola --instance=savipola-db --project="$SAVIPOLA_PROJECT" >/dev/null 2>&1; then
  gcloud sql databases create savipola --instance=savipola-db --project="$SAVIPOLA_PROJECT"
fi

SAVIPOLA_PASSWORD_FILE="$(mktemp)"
chmod 600 "$SAVIPOLA_PASSWORD_FILE"
trap 'rm -f "$SAVIPOLA_PASSWORD_FILE"' EXIT
if gcloud secrets describe savipola-db-password --project="$SAVIPOLA_PROJECT" >/dev/null 2>&1; then
  gcloud secrets versions access latest --secret=savipola-db-password --project="$SAVIPOLA_PROJECT" >"$SAVIPOLA_PASSWORD_FILE"
else
  python3 -c 'import secrets; print(secrets.token_urlsafe(32),end="")' >"$SAVIPOLA_PASSWORD_FILE"
  gcloud secrets create savipola-db-password --data-file="$SAVIPOLA_PASSWORD_FILE" --project="$SAVIPOLA_PROJECT"
fi
# Password is read from the temporary file; never echoed or stored in project source.
SAVIPOLA_DB_PASSWORD="$(cat "$SAVIPOLA_PASSWORD_FILE")"
if [ "$(gcloud sql users list --instance=savipola-db --project="$SAVIPOLA_PROJECT" --filter='name=savipola' --format='value(name)')" = savipola ]; then
  gcloud sql users set-password savipola --instance=savipola-db --password="$SAVIPOLA_DB_PASSWORD" --project="$SAVIPOLA_PROJECT" >/dev/null
else
  gcloud sql users create savipola --instance=savipola-db --password="$SAVIPOLA_DB_PASSWORD" --project="$SAVIPOLA_PROJECT" >/dev/null
fi
unset SAVIPOLA_DB_PASSWORD
gcloud secrets add-iam-policy-binding savipola-db-password --project="$SAVIPOLA_PROJECT" \
  --member="serviceAccount:$SAVIPOLA_SA" --role=roles/secretmanager.secretAccessor --quiet >/dev/null

gcloud run deploy "$SAVIPOLA_SERVICE" --source=. --project="$SAVIPOLA_PROJECT" \
  --region="$SAVIPOLA_REGION" --execution-environment=gen2 --service-account="$SAVIPOLA_SA" \
  --add-cloudsql-instances="$SAVIPOLA_INSTANCE" --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$SAVIPOLA_PROJECT,GOOGLE_CLOUD_LOCATION=global,GEMINI_MODEL=$SAVIPOLA_MODEL,DB_HOST=/cloudsql/$SAVIPOLA_INSTANCE,DB_NAME=savipola,DB_USER=savipola" \
  --set-secrets=DB_PASS=savipola-db-password:latest \
  --max-instances=2 --concurrency=8 --memory=512Mi --timeout=90

gcloud run services describe "$SAVIPOLA_SERVICE" --project="$SAVIPOLA_PROJECT" \
  --region="$SAVIPOLA_REGION" --format='value(status.url)'
