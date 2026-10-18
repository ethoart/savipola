# SaviPola: Google Cloud deployment and release guide

Prepared 18 October 2026 · source version 0.6.0

**Status: production-oriented integration package, awaiting cloud staging and release approval by your team.** It has not been deployed to your account. Offline tests pass; live Firebase SMS, Vertex requests, Cloud SQL transactions, real reCAPTCHA, device layout, backup restore and load tests have not been performed. Do not describe this version as production-certified.

## 1. What each service does

| Service | Role in this package |
| --- | --- |
| Cloud Run | Serves the responsive web/PWA interface, FastAPI API and authenticated WebSockets over HTTPS. |
| Firebase Authentication | Verifies Sri Lankan mobile numbers by SMS and reCAPTCHA; the backend exchanges a recent ID token for a five-day HttpOnly session cookie. |
| Cloud Firestore | Private saved-harvest shortlists shared across a verified account’s devices. Stores product IDs and timestamps; SQL supplies current prices and availability. |
| Cloud SQL for PostgreSQL | Stores profiles, stock, offers, services, private messages, translations, sessions, quotas and the translation outbox. |
| Gemini through Vertex AI | Translates Sinhala/Tamil/English messages and drafts assistance using server-side Application Default Credentials. Existing structured listing and photo-review API operations remain available. |
| Secret Manager | Supplies the database password to the Cloud Run revision. No AI API key is shipped to the browser. |
| Cloud Scheduler | Calls an OIDC-protected endpoint every minute to recover interrupted translation jobs. |
| Cloud Logging / Monitoring | Platform logs and the monitoring/alerts you configure below. |

“Google AI” here means Gemini, accessed through Vertex AI. Do not add a second AI Studio API key to the frontend. Firebase AI Logic is not used. Firestore now stores private saved-harvest references through the server SDK; it does not store the transactional stock ledger. Keeping the transactional stock ledger in PostgreSQL avoids introducing a second database with conflicting stock values. Firebase Hosting is optional and is not configured: Cloud Run already hosts the site and WebSockets on one origin.

This remains a web/PWA product, not a compiled Android/iOS application. Messaging is stored server-side, not end-to-end encrypted. Cross-instance updates use the existing three-second polling fallback; WebSocket broadcasts are instance-local. Translation is automatic after sending; always retain and expose the original message.

## 2. Create a staging project first

1. Open https://console.cloud.google.com/ and create a project you control. Attach billing.
2. Use a separate staging project and Firebase project first. Do not use your demo database or production user data.
3. In https://console.firebase.google.com/ choose **Add Firebase to an existing Google Cloud project** and select that same project ID.
4. In Project settings, register a **Web app**. Copy `apiKey`, `authDomain`, `projectId`, and `appId`. These identify the web app; the Firebase web API key is public configuration, not a server credential.
5. Enable Authentication → Phone provider. In Authentication settings, allow **Sri Lanka (LK)** in the SMS region policy. Set SMS quotas and alerting. Use Firebase's documented fictional test numbers in staging; never use a production bypass or disable app verification.
6. Authorize the final HTTPS hostname after deployment in step 5. Do not include `https://` or a path in the Authorized domains entry. Phone auth needs an authorized hosted domain; localhost is not supported for this phone-auth flow.
7. Restrict the Firebase web API key to the actual site referrers and the Firebase Authentication APIs it needs, following Firebase's API-key guide. Verify sign-in after restrictions; the web key is not an authorization boundary.

Cloud Shell deployer needs permission to enable APIs, provision SQL, build/deploy Cloud Run, create service accounts/custom roles/secrets, attach service accounts, edit IAM, deploy Firestore rules and create Scheduler jobs. Use your organization's delegated deployment role. The runtime gets only Vertex AI User, Cloud SQL Client, Datastore User for Firestore data access, access to its single database secret, and a custom role with `firebaseauth.users.get` and `firebaseauth.users.createSession`. Do not grant the runtime Owner/Editor. Source builds may need the build service account's documented Cloud Run Builder permissions and Artifact Registry access. Do not create or upload a service-account JSON key.

## 3. Upload the project and set configuration

Version 0.6.0 also uses Firebase CLI to publish the bundled deny-all client Firestore rules before it deploys the web service. In Cloud Shell install the CLI and authenticate the account that owns this project:

```bash
npm install -g firebase-tools
firebase login --no-localhost
firebase projects:list
```

Use a dedicated SaviPola project. The included rules deny **all** direct client document access in that database; publishing them into an unrelated app's database would affect that app. The server SDK bypasses rules and uses IAM, so server session/ownership checks remain essential.


Upload and unzip `savipola_prototype.zip` in Google Cloud Shell, then open its folder. Run from the folder containing `app.py`:

```bash
export SAVIPOLA_PROJECT="YOUR_STAGING_PROJECT_ID"
export SAVIPOLA_SERVICE="savipola-staging"
export SAVIPOLA_REGION="asia-southeast1"
export FIREBASE_API_KEY="YOUR_FIREBASE_WEB_API_KEY"
export FIREBASE_AUTH_DOMAIN="YOUR_PROJECT.firebaseapp.com"
export FIREBASE_APP_ID="YOUR_FIREBASE_WEB_APP_ID"
export GEMINI_MODEL="gemini-3.5-flash-lite"
export SAVIPOLA_SUPPORT_EMAIL="YOUR_REAL_MONITORED_SUPPORT_EMAIL"
```

Check Google's model lifecycle page and your project's model access before choosing the model. `gemini-3.5-flash-lite` was listed when this guide was prepared; future model availability, quotas and pricing can change. The backend uses `GOOGLE_CLOUD_LOCATION=global`; assess where AI data is processed before accepting sensitive data. Singapore is the SQL/Run default, not a guarantee that AI processing stays there.

The script creates **billable** regional high-availability PostgreSQL (1 vCPU / 3.75 GiB per primary configuration), storage, backups, Firestore, Cloud Run, builds and Scheduler. Firestore reads/writes and PITR also incur usage charges. HA SQL keeps costing money when traffic is zero. SMS and Gemini calls also cost money. Review the current Google Cloud calculator and set budget notifications before executing. Budget notifications are alerts, not spending caps. For a cheaper hackathon demonstration use `deploy.sh` in a disposable demo project; it is explicitly not the hardened deployment path.

## 4. Deploy the service privately

```bash
bash deploy_production.sh
```

The script enables APIs, creates or checks the default Firestore Native database with deletion protection and PITR, deploys `firestore.rules`, provisions separate `savipola-staging-db`, creates its password secret, grants limited runtime roles and builds the container with `requirements.lock`. Firestore access uses the attached runtime service account and `roles/datastore.user`. The code enables it with `SAVIPOLA_FIRESTORE_ENABLED=1` and `FIRESTORE_DATABASE=(default)`. Disabled or unavailable storage returns 503; the UI does not pretend an unconfirmed change was saved. The container runs as a non-root user. SQL has regional HA, automated backups, seven retained backups, PITR and deletion protection. Existing SQL instances must pass the script's resilience check.

The first revision has a bootstrap origin and is IAM-private. The script then sets the actual Cloud Run origin, adds the worker invoker grant and creates the minute-by-minute translation sweep. It leaves the site IAM-private. The bootstrap revision must never be promoted manually.

Capture the URL and inspect it without printing any secrets:

```bash
export SAVIPOLA_URL="$(gcloud run services describe "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION" --format='value(status.url)')"
gcloud run services describe "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION"
gcloud sql instances describe "${SAVIPOLA_SERVICE}-db"
gcloud scheduler jobs describe "${SAVIPOLA_SERVICE}-translations" --location="$SAVIPOLA_REGION"
```

In Firebase Authorized domains, add the hostname of `SAVIPOLA_URL`. If using a custom domain later, provision its certificate/DNS, add that hostname to Firebase and update `SAVIPOLA_PUBLIC_ORIGIN` to that exact HTTPS origin. The current app supports one canonical origin: redirect other hostnames to it. Update the Scheduler URI/audience consistently and verify Cloud Run accepts that audience, or continue to use the original Run URL with a separately configured worker audience before introducing a custom domain. Custom-domain routing/audiences are not automated by this script.

Verify no demo database was selected, real support contact is configured, the finalized revision is healthy, Firebase phone sign-in is enabled, and the SMS region/quotas and key restrictions are correct. Then expose **staging** for browser testing:

```bash
gcloud run services add-iam-policy-binding "$SAVIPOLA_SERVICE" \
  --region="$SAVIPOLA_REGION" --member=allUsers --role=roles/run.invoker
```

Cloud Run IAM public access lets the browser reach the application; Firebase and the app's ownership checks protect private operations. The internal worker endpoint still independently verifies a Google OIDC token, audience, verified email and the exact worker service account. An organization policy may prohibit allUsers; use your organization's supported ingress and identity design in that case.

## 5. Test staging end to end

Open `SAVIPOLA_URL` on two actual phones or isolated browser sessions.

1. Select Sinhala, Tamil or English before registration. Register a farmer and a buyer using different verified test numbers in staging. Confirm no password fields or sample-profile switcher appear. Inspect cookies: session is Secure, HttpOnly, SameSite=Strict and uses the `__Host-` prefix.
2. Check actual Sri Lankan SMS delivery on a controlled real number, user consent, reCAPTCHA challenges and quota-denied cases. Firebase console test numbers do not verify real carrier delivery. Check all three languages, narrow screens, large text and the keyboard; reCAPTCHA/SMS localization depends on Google support and is not guaranteed for every language.
3. Save a farmer’s harvest as the buyer, reload, and sign in as the same buyer on the other device. The saved harvest must remain. Inspect its real Firestore document under `savipola_saved_harvests/<SHA-256 of Firebase UID>/items/<product ID>`. A second user must see only their own shortlist. Remove a saved harvest, test a failed Firestore request, and verify the UI warns that the change is unconfirmed. Confirm current price/stock still come from SQL; saves do not reserve stock. Then create a harvest, make an offer and accept it as its farmer. Competing offers must not reserve more stock than is available. Complete a trade twice: the second attempt must fail without changing the stock ledger again. Verify another account cannot change the seller ID to impersonate someone else.
4. Sign in as an unrelated third person. Offers, private jobs, message history and other people's phone numbers must be absent from its API responses. An anonymous browser must not mutate records.
5. Set the two profiles to different languages. Send a message such as “20 kg for LKR 200”. Confirm the recipient sees the original immediately and a real Vertex translation when available. Check **Show original**, reconnect, failed translation and explicit retry. Digits are checked, but AI can still mistranslate units or meaning; human confirmation remains necessary.
6. Request an AI draft and review it before sending. The assistant must not automatically send a message, create a listing, change a quality grade or accept a trade. The current mobile screen exposes chat assistance; advanced listing/photo APIs need their own client workflow before advertising those features to production users. `/classic` is intentionally disabled in production mode.
7. Disable/revoke a staging user in Firebase. New HTTP requests and WebSocket pings must deny access. Logout must invalidate the current server session. SMS alone does not establish seller trust or protect against reassigned numbers/SIM takeover; provide an operator recovery policy and stronger authentication before handling sensitive transactions.
8. Interrupt an instance after a message/outbox commit. Force the Scheduler job using the console or command below. The persisted lease must expire, translation must eventually become ready or unavailable, and the original message must survive. A job has a 120-second lease and at most three automatic attempts. Cloud Scheduler may deliver again; the SQL lease coordinates claims.
9. Deploy a new revision and verify the same Cloud SQL records remain. Test a real PostgreSQL race under at least two Cloud Run instances; local SQLite test results do not prove PostgreSQL behavior.
10. Validate Firestore PITR/recovery and consented account deletion, including nested `items` subcollections. Deleting a parent document does not delete its subcollections. Then create and restore a SQL backup into a separate recovery instance. Verify sessions/messages/stock there without sending production SMS or contacting real users. Record recovery time and data loss against agreed targets.

```bash
gcloud scheduler jobs run "${SAVIPOLA_SERVICE}-translations" --location="$SAVIPOLA_REGION"
gcloud run services logs read "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION" --limit=50
```

Logs must not contain SMS codes, cookies, ID tokens, database passwords or full private-message bodies. Cloud Run access logging in the Python server is disabled in production mode; platform request logs still exist and need an appropriate retention/access policy. Do not share logs containing personal information in public issues.

## 6. Finish the remaining product work before a public real-user launch

The following are release blockers, not completed features:

- Pass the live staging checks above, a real security review and an agreed load/capacity test. No browser-layout or real-device QA was possible in this environment. DOM-only checks do not prove every screen size works perfectly.
- Review all Sinhala/Tamil copy and translations with native speakers and farmers/workers. Check accessibility, screen readers, large text and consent comprehension with representative users.
- Add abuse reporting, blocking/moderation, operator recovery and account-deletion workflows, and publish operator-specific terms, privacy/retention/backup-deletion policies. `/privacy` provides an implementation summary and contact, not a completed legal/compliance review. Retention/deletion currently requires operator action; no scheduled deletion of profiles/messages is implemented.
- Add paginated search and directory/order APIs before growth. `/api/state` still builds a full snapshot. Three-second cross-instance polling is suitable only for a measured small pilot; add shared pub/sub for higher chat scale. The sweep handles three jobs per minute per invocation; monitor backlog and replace it with a scalable task worker when required. Avoid claiming guaranteed real-time translation latency.
- Establish versioned SQL migrations and a separate restricted application SQL role versus schema-migration role. Startup schema setup is serialized but still uses the deployment user. Test PostgreSQL transactions, duplicate-request handling, connection limits and migrations before live onboarding.
- Add real seller-provided photo upload/storage, scanning and access control before representing illustrative photos as real stock. Current images remain marked as samples. Sample price recommendations are removed in live mode; no live HARTI/feed integration exists.
- Agree cancellation/refund/dispute and transport fulfillment policies. No payment processing, escrow, carrier dispatch, verified farmer credentials, real route calculation or marketplace fraud controls are implemented. Do not collect money through this prototype.

## 7. Monitoring and cost controls

In Cloud Monitoring/Logging configure notifications to a monitored owner for:

- Cloud Run availability, 5xx rate, latency, memory and instance count.
- SQL connections, CPU, disk growth, failed backups and storage/PITR availability.
- Scheduler failures and a growing count/age of due translation jobs; inspect `translation_jobs` using an authorized database operator. There is no custom monitoring dashboard/exporter in this package.
- Firebase SMS usage/errors and unexpected regions; Vertex request/token usage, failures and quota exhaustion.
- Billing budget thresholds and unusual spend. Stop/disable affected AI/SMS features if necessary; alerts do not stop spend automatically.

Shared fixed-window quotas live in SQL and are cleaned up by the authenticated sweep. The default AI allowance is 100 attempts per person per UTC day (86400-second windows), not a guaranteed monetary cap. Automatic retries count too. Login/API fallback limits for anonymous requests use the connection address without trusting arbitrary forwarded headers, so users behind shared infrastructure can share a quota. Validate the proxy/address policy and tune limits under load. No Cloud Armor/App Check deployment or project-wide financial hard cap is configured.

## 8. Release to production and rollback

Use a fresh production GCP/Firebase project, repeat steps 2–5 with `SAVIPOLA_SERVICE=savipola-prod`, real configuration and no staging test-number bypasses. Never migrate demo sessions/identities by matching a phone number alone. This version deliberately requires support-assisted verified migration for old local-password accounts. Do not delete an existing demo database to “fix” the production guard.

Record the tested image/revision, source version, exact secret version, backup ID, approvals and smoke-test results. After all release blockers are closed, run the public-access command for the production service and verify the live URL. Deployment alone does not close the blockers.

For subsequent releases, use an immutable tested image and a no-traffic candidate revision, then promote gradually. The supplied bootstrap script is for initial provisioning and defaults to the latest deployed revision; it is not a complete CI/CD promotion pipeline. Never rerun it casually against an already-public live service: it intentionally makes the service IAM-private during setup.

Before rollback, confirm the old revision is compatible with the current database schema:

```bash
gcloud run revisions list --service="$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION"
gcloud run services update-traffic "$SAVIPOLA_SERVICE" --region="$SAVIPOLA_REGION" \
  --to-revisions=YOUR_PREVIOUS_TESTED_REVISION=100
```

Rolling back a revision does not roll back database changes. Restore a backup into a separate instance, validate and plan a controlled cutover if recovery is necessary. SQL deletion protection is intentional; account for ongoing costs after a demo ends. Remove public access immediately if private data is at risk:

```bash
gcloud run services remove-iam-policy-binding "$SAVIPOLA_SERVICE" \
  --region="$SAVIPOLA_REGION" --member=allUsers --role=roles/run.invoker
```

## 9. Local verification shipped with this package

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.lock
python test_flow.py
python test_ai_and_stock.py
python test_community.py
python test_cloud_security.py
python test_firebase_identity.py
python test_production_config.py
python test_saved_harvests.py
bash -n deploy_production.sh
```

Run each Python test as a separate process because environment and schema are initialized at import. The cloud security tests mock Firebase/Google verification and Vertex network calls; they test the application boundary and durable local SQL behavior, not live cloud permissions. Optional DOM checks: install `jsdom` in a separate development environment and run `node ops/test_phone_ui.cjs`. Do not ship development dependencies or credentials in the image.

For local demo use `python app.py` without production environment settings; the seeded local-password experience remains available. Do not use local demo authentication for real accounts. Real Firebase phone testing needs a hosted authorized domain.

## Official references

Checked 18 October 2026; revisit before deployment:

- Firebase web phone auth, consent, SMS region policy and domain configuration: https://firebase.google.com/docs/auth/web/phone-auth
- Firebase Admin session cookies and CSRF: https://firebase.google.com/docs/auth/admin/manage-cookies
- Firebase API-key handling: https://firebase.google.com/docs/projects/api-keys
- Firebase SDK releases (the web adapter pins 13.0.0): https://firebase.google.com/support/release-notes/js
- Firebase IAM permissions: https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth
- Vertex/Gemini ADC: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/gcp-auth
- Model lifecycle: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions
- Cloud Run deployment flags: https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy
- Cloud Run WebSockets and shared-state considerations: https://docs.cloud.google.com/run/docs/triggering/websockets
- Cloud SQL creation/HA/backup flags: https://docs.cloud.google.com/sdk/gcloud/reference/sql/instances/create
- Cloud Scheduler OIDC authentication: https://docs.cloud.google.com/scheduler/docs/http-target-auth

## Firestore references

- Server SDKs and rules/IAM: https://firebase.google.com/docs/firestore/security/rules-conditions
- Document create/delete semantics: https://docs.cloud.google.com/python/docs/reference/firestore/latest/google.cloud.firestore_v1.document.DocumentReference
- Database create/protection/PITR flags: https://docs.cloud.google.com/sdk/gcloud/reference/firestore/databases/create
- Firebase CLI and rules deployment: https://firebase.google.com/docs/cli
