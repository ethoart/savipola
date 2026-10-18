# SaviPola source and deployment handoff

Version 0.6.0 · Team Hyper Way · 18 October 2026

**Team leader:** Sathini Dewmanthi Jayamaha. **Team member:** Sandun Nayanaka Subasingha.

## Confirmed submission requirements

The user/local chat inspected the signed-in **AI Builder Cup 2026** portal and supplied these requirements:

- Working prototype deployed on GCP/Cloud Run.
- Public GitHub source repository.
- A 3–4 minute demo video.
- A PDF pitch deck under 5 MB using the prescribed 16-slide template.
- A description of at most 1,024 characters mentioning Firebase, Firestore, Cloud Run and Gemini.
- Deadline shown: **18 October 2026, 11:59 PM IST**. Sri Lanka has the same UTC+05:30 clock offset.

The local chat reports that the official 16-slide PPTX and a 1.27 MB final PDF are already prepared. No second presentation is being created here. Template source supplied by the user: https://docs.google.com/presentation/d/13rg7vW43mEH6DkpuusAE6fdoEylSFz8waNpE4RLzoUg/edit

The public FAQ still says a video under three minutes: https://aibuildercup.com/Faqs.html . The primary 3:35 plan follows the confirmed portal guidance; `submission/demo_plan.md` also contains a 2:50 alternative. We did not access the signed-in portal in this cloud workspace. Do not submit the older supporting brief in `docs/` as the official-template deck.

## Current delivery status

| Item | Status and evidence |
| --- | --- |
| Existing marketplace | Preserved stock, negotiation, private chat, profiles, services and all three UI languages. Local tests cover these functions. |
| Firebase Authentication | Real SDK phone sign-in/session integration in source. Local application tests mock Firebase verification; live SMS/reCAPTCHA unverified. |
| Firestore | Added real server SDK create/list/delete for private Saved harvests. User ownership, idempotent retries and error handling tested with a Firestore network double. No live Firestore read/write claimed. |
| Cloud SQL | Existing ledger retained. Saved harvests read current stock/price from SQL. Local tests use SQLite; live PostgreSQL concurrency unverified. |
| Gemini / Vertex AI | Server-side integration retained for text translation/reply drafts and structured listing/photo/plan APIs. No successful live Gemini call claimed. |
| Cloud Run deployment | Source, container and scripts prepared. **No deployed URL**: project ID and billing setup have not been supplied. |
| GitHub | Connector identity/account access confirmed for **ethoart**. No accessible SaviPola repository found. Source publication is prepared; **no public SaviPola repository or pushed commit claimed**. |
| Pitch deck | Delegated to the local chat using the user-supplied official template. No replacement deck created here. |
| Actual app screenshots | Not captured: no supported browser capture tool was available. Local capture checklist is in `submission/demo_plan.md`. No mockups presented as screenshots. |

## Minimum setup needed from the user/local team

1. **A dedicated GCP project ID with billing enabled** and a deployer account that can provision Run, SQL, Firestore, IAM, secrets and Scheduler. Billing status is not known. No private key or password needs to be sent in chat.
2. **Firebase added to that same project.** Register a web app and provide public `apiKey`, `authDomain`, `appId` and project ID. Enable Phone authentication, allow LK in the SMS region policy and authorize the deployed hostname. Set a real support email. The script generates the database password and stores it in Secret Manager.
3. **An accessible public `ethoart/savipola` repository**, or an explicitly selected SaviPola repository with connector write access. No repository-creation action is exposed by this connected GitHub tool set, and no authenticated `gh` CLI is available here. We did not reuse or modify another project repository. Create the related repository through your own GitHub session or use the commands below locally.
4. **Choose/enable a currently available Gemini model**, quotas and budget alerts in that project. `GEMINI_MODEL` is required. Use attached service-account ADC; never put an AI API key or service-account JSON file in the browser or repository.

These are deployment inputs, not claims that live integration has passed. Follow `PRODUCTION_DEPLOYMENT.md`, including its outstanding product/security/operations limits. Cloud SQL HA and recovery settings incur ongoing costs even with no visitors. This is a hackathon prototype, not a production-certified marketplace.

## Deploy from Cloud Shell

Upload/extract the latest source ZIP. From the folder containing `app.py`:

```bash
npm install -g firebase-tools
firebase login --no-localhost
export SAVIPOLA_PROJECT="YOUR_PROJECT_ID"
export SAVIPOLA_SERVICE="savipola-staging"
export SAVIPOLA_REGION="asia-southeast1"
export FIREBASE_API_KEY="YOUR_PUBLIC_FIREBASE_WEB_API_KEY"
export FIREBASE_AUTH_DOMAIN="YOUR_PROJECT.firebaseapp.com"
export FIREBASE_APP_ID="YOUR_FIREBASE_WEB_APP_ID"
export GEMINI_MODEL="YOUR_SUPPORTED_VERTEX_GEMINI_MODEL"
export SAVIPOLA_SUPPORT_EMAIL="YOUR_MONITORED_SUPPORT_EMAIL"
bash deploy_production.sh
```

Use a project dedicated to SaviPola: the bundled rules deny all direct client Firestore access in its default database. The script creates/checks Firestore Native mode, deletion protection/PITR, publishes the rules with Firebase CLI, grants runtime Firestore IAM data access and configures `SAVIPOLA_FIRESTORE_ENABLED=1`. The server, not the browser, accesses Firestore. The script also provisions the existing SQL/Run/AI/secret/worker architecture. It leaves Cloud Run IAM-private for setup.

Get its URL, add only its hostname in Firebase Authorized domains, and review the finalized service configuration. Then make **staging** public for controlled browser testing:

```bash
export SAVIPOLA_URL="$(gcloud run services describe "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION" --format='value(status.url)')"
gcloud run services add-iam-policy-binding "$SAVIPOLA_SERVICE" \
  --region="$SAVIPOLA_REGION" --member=allUsers --role=roles/run.invoker
```

The public URL is a submission blocker until these commands actually succeed and the app is tested anonymously and with separate accounts. Do not submit a localhost address or placeholder URL as deployed evidence. Do not use the older sample `deploy.sh` and claim it demonstrates the new Firestore/Firebase flow.

## Firestore feature and security

Path: `savipola_saved_harvests/<SHA-256 of verified Firebase UID>/items/<product ID>`.

The backend derives the UID from the verified session's linked SQL identity; client UID/person fields do not choose the owner. Documents contain only `product_id` and a server timestamp. The original SQL ledger remains authoritative. An initial repeated PUT is idempotent and keeps its original timestamp. DELETE is safely repeatable. Reads return the most recent 100 items, reporting `has_more` if there are others. Saving does not reserve a harvest, guarantee a price or subscribe to alerts.

Unauthenticated requests fail, demo/local-password identities cannot use this feature, writes require the existing exact-Origin/CSRF checks, and SQL-backed per-user limits apply. Disabled storage, missing credentials, IAM denial, malformed stored data and upstream errors return explicit unavailable responses. A write timeout can leave the outcome uncertain, so the UI says the change is unconfirmed and lets the user retry. There is no fake local-storage or in-memory persistence fallback in the real app.

`firestore.rules` denies direct client access. Server SDKs bypass these rules and rely on IAM plus the backend's ownership checks. `roles/datastore.user` grants data access in the dedicated project; it does not enforce per-user ownership. Keep project/IAM access restricted. Operator account-deletion work must recursively delete a user's `items` subcollection; deleting a parent document alone is insufficient. No automated account-deletion flow is implemented.

## Transfer to the local chat and prepare GitHub publication

Download the source ZIP through the artifact link in this chat, then attach/upload it in the local chat or Cloud Shell. The ZIP is self-contained; it does not require access to this workspace's absolute paths, virtual environment or local database. `SOURCE_MANIFEST.sha256` records hashes of the public source files. The local team can receive the same ZIP through the separately numbered base64 command outputs, concatenate their payloads in numeric order, decode once and compare the published SHA-256. Base64 is a transport encoding, not a secret or a deployment.

To prepare the extracted source for publication:

```bash
cd savipola_prototype
python3 ops/audit_public_source.py .
git init -b main
git add .
git -c user.name="Hyper Way" -c user.email="48042245+ethoart@users.noreply.github.com" commit -m "Prepare SaviPola hackathon prototype"
```

Using a local GitHub CLI authenticated as **ethoart**, create and publish only the related repository if it does not already exist:

```bash
gh auth status
gh api user --jq .login
# Continue only if the login shown is ethoart.
gh repo create ethoart/savipola --public --source=. --remote=origin --push
```

If the related repository already exists, inspect it first, preserve its content/history, and push through an appropriate branch/PR. Do not force-push or overwrite it blindly. Alternatively, create an empty public repository in GitHub, grant the connector access and provide its exact URL so the cloud chat can prepare the corresponding commit/branch update with the available GitHub tools.

The source scan checks known credential patterns and runtime-data exclusions, not every possible secret. Never add your `.env`, SQLite database, local Firebase caches, OTPs, tokens or service-account files. Third-party asset/font/icon attribution files remain included. No new license has been invented for the team's source.

## Verify and record real evidence

Run each Python test in a separate process; configuration initializes at import:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.lock
SAVIPOLA_PYTHON=.venv/bin/python bash ops/run_checks.sh
```

Optional DOM-only checks require a development installation of `jsdom`: `node ops/test_phone_ui.cjs`. Those tests cannot prove browser layout, reCAPTCHA/SMS, Firestore rules enforcement or live Google integration.

After deployment record the actual URL, finalized revision, successful Firebase sign-in, real Firestore save/reload from a second session, real Vertex response, stock acceptance and persisted data after redeployment. Record failures truthfully. Use the 900-character text in `submission/description_1024.txt` until live evidence supports changing the “pending deployment” wording. Keep the final PDF below 5 MB and the primary video within the signed-in portal's 3–4 minute requirement.
