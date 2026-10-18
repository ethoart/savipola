# Connect SaviPola to Google Cloud

## Production-oriented Firebase deployment

For the current Firebase SMS authentication, Firestore saved harvests, hardened configuration, shared quotas and durable translation jobs, follow **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** and `deploy_production.sh`. The older `deploy.sh` instructions below are for a public sample-data hackathon demo only. Live cloud validation and the runbook's product/operations blockers remain outstanding.

## Demo and Vertex setup

The source supports **Gemini on Vertex AI**, **Cloud Run**, **Cloud SQL for PostgreSQL** and **Secret Manager**. This package has not been deployed to your account and no successful live Gemini call is claimed. The interface shows configuration separately from successful AI audit events.

Google AI Studio can help develop prompts; Vertex AI is the application runtime. Using every suggested Google tool is unnecessary. Firebase Authentication is now integrated as an optional verified-phone mode. Maps Routes API, Cloud Storage photo uploads and BigQuery analytics remain unimplemented roadmap items.

## Fast local start

```bash
python -m pip install -r requirements.txt
python app.py
```

Open http://localhost:8000. SQLite persists locally. AI controls show setup-needed until a project is configured.

## Test Vertex AI locally

In Google Cloud Shell, or a computer with the Google Cloud CLI and a billing-enabled project:

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
export GOOGLE_CLOUD_LOCATION="global"
export GEMINI_MODEL="gemini-3.5-flash-lite"
gcloud services enable aiplatform.googleapis.com --project="$GOOGLE_CLOUD_PROJECT"
python app.py
```

The caller needs Vertex AI User access. Confirm model access in your project; `GEMINI_MODEL` can be changed without editing source. The default model was listed on Google's model lifecycle page on October 17, 2026. The older prototype's hard-coded Gemini 2.5 Flash is close to its listed retirement, so this version uses a configurable model instead.

The mobile homepage supports profiles and multilingual private chat. Create two accounts in separate browser sessions, choose different profile languages, start a conversation and send a message. The original should arrive immediately; a successful Vertex call supplies the recipient's translation. Test **Show original**, retry after a failed translation and the review-before-send AI assistant. Samples are explicitly marked and do not call Vertex.

The older advanced interface remains at `/classic`. There, choose a sample farmer → Harvest AI → Prepare a listing draft. A successful call displays model and latency. Review the suggested fields before posting. For a photo, use My Harvest → Quality check, select a real produce image and run Vertex AI photo review. The model does not change the batch grade.

## Deploy the working prototype

Upload this project folder to Google Cloud Shell. Use a project you own with billing enabled and permissions to create Cloud Run, Cloud SQL, service accounts, secrets and IAM bindings. The script creates billable resources; Cloud SQL continues to exist when Cloud Run is idle. Run it in a demo project.

```bash
export SAVIPOLA_PROJECT="YOUR_PROJECT_ID"
bash deploy.sh
```

The script creates or reuses `savipola-db`, the `savipola` database and database user, a dedicated runtime service account and one password secret. It deploys a public demonstration with sample profiles and a maximum of two instances. Cloud SQL supplies persistent shared data; **do not deploy the SQLite path on Cloud Run for a persistent judge demo**, because local container files are ephemeral and separate across instances.

If your organization prohibits public services or source builds, follow that organization's deployment process. A source build may require granting the build service account the Cloud Run Builder role as directed by the Cloud Run quickstart. Do not grant broad Owner access to the runtime account.

The demo deployment uses sample profiles, local-password accounts and process-local limits. It must not onboard real users. The production-oriented path uses Firebase, disables sample seeding/mutations and uses shared SQL quotas. Complete the release gates in PRODUCTION_DEPLOYMENT.md before real-user onboarding. A project-configured badge is not proof of a successful live API call.

Chat WebSocket broadcasts are process-local. The mobile client also polls every three seconds so other Cloud Run instances can see persisted messages; it reconnects after connection loss. Shared pub/sub is not implemented, so updates across instances are near-real-time through polling. Chat translations need the same Vertex permissions and model access as the other AI features. Database persistence includes private messages and translations; use appropriate project access and retention controls for any pilot.

## Verify before submitting

1. Open the returned HTTPS URL on another device or in an incognito window.
2. Run a listing draft and photo review against Vertex AI; see a successful audit entry.
3. Create an offer, switch to its farmer, accept it and verify the available/reserved ledger.
4. Book a suitable vehicle and local worker; complete/review the work and fulfil the trade.
5. Deploy the same source again; verify your new trade remains in Cloud SQL.
6. Record a video shorter than 3 minutes, then submit the deployed URL, public source repository and PDF deck. This brief is supporting material; it is not a replacement for the required slide deck.

## Source references (checked October 17, 2026)

- Event rubric and build requirements: https://aibuildercup.com/themes.html
- Submission and eligibility FAQ: https://aibuildercup.com/Faqs.html
- Timeline: https://aibuildercup.com/
- Google Gen AI SDK: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/sdks/overview
- Model lifecycle: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions
- Structured output: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output
- Cloud Run FastAPI: https://docs.cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-python-fastapi-service
- Cloud Run + Cloud SQL: https://docs.cloud.google.com/sql/docs/postgres/connect-run
- HARTI bulletins: https://www.harti.gov.lk/weekly-price.php
