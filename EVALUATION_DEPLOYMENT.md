# SaviPola evaluation deployment

Team Hyper Way. Leader: Sathini Dewmanthi Jayamaha. Member: Sandun Nayanaka Subasingha.

Canonical application URL: https://savipola-2cpvvetnwq-uc.a.run.app

The public cloud deployment and live Firebase, Firestore, Gemini and PostgreSQL workflow checks passed on 18 October 2026. See `CLOUD_VALIDATION.md` for the evidence and its limits.

## Reviewer access

Register with your own email, verify the Firebase email, then sign in for private features. Alternatively use **Try as farmer**, **Try as buyer**, **Try as driver** or **Try as worker** on the welcome page. This is an evaluation prototype with shared fictional accounts and example data. Do not enter personal information. The buttons use native Firebase email/password sign-in. Phone authentication is disabled and all SMS regions remain blocked. No CAPTCHA exception is used. The normal source configuration leaves evaluation mode disabled.

| Account | Fictional email | Published evaluation password |
| --- | --- | --- |
| Farmer | farmer@savipola.example | SavipolaFarmerReview2026! |
| Buyer | buyer@savipola.example | SavipolaBuyerReview2026! |
| Driver | driver@savipola.example | SavipolaDriverReview2026! |
| Worker | worker@savipola.example | SavipolaWorkerReview2026! |

For shared evaluation access, the backend accepts the four pre-provisioned reviewer Firebase UIDs with their matching emails and the password sign-in provider when review access is enabled. Other users must verify their own email before creating an application session. It verifies recent Firebase identity tokens, checks revocation, and sets a secure HTTP-only session cookie. These accounts are not labelled phone-verified. Their published passwords grant access only to shared fictional evaluation data. Example transport and worker listings demonstrate booking records; they do not arrange actual services. Quality labels are unverified unless explicitly checked; illustrative photos do not certify produce.

## Actual architecture

- Cloud Run serves the interface and FastAPI backend in `us-central1`, with zero minimum instances and one maximum instance.
- Firebase Authentication supplies verified-email users and four distinct fictional reviewer identities. A dedicated browser key is restricted to Firebase Auth and Secure Token APIs and the application hosts. Existing project API keys were preserved.
- Cloud Firestore stores private saved-harvest references and timestamps under a hash of the verified Firebase UID. Client rules deny direct access; server IAM is restricted to the new database. SQL remains authoritative for price and stock.
- Cloud SQL PostgreSQL 18 stores profiles, messages, offers, inventory and booking records. It was provisioned using Firebase SQL Connect's default three-month trial configuration. It is not the original paid high-availability configuration.
- Gemini 3.5 Flash-Lite through Vertex AI provides language assistance. Original messages remain available and translations preserve numeric details. AI output is assistance rather than certification.

Runtime credentials come from the attached service account. No service-account key or SQL password is shipped to the browser or source repository. SQL connection rights are restricted to the evaluation instance. Gemini access uses the inference permission rather than broad model-management roles.

## Budget and expiry

The approved target is **US$10 per month** for small evaluation traffic. Real SMS delivery is blocked by the project's SMS region policy. AI calls are limited to 20 per account and 40 across the deployment per day, and chat uses polling rather than keeping an open WebSocket connection. The database trial covers the intended challenge evaluation period; changing its instance configuration can end the trial early.

The team explicitly authorized automatic deletion of **only `savipola-eval-db` at 00:00 UTC on 10 January 2027** (05:30 Sri Lanka time), before the three-month trial can become paid. Cloud Scheduler invokes the `savipola-evaluation-cleanup` Workflow. Its date check prevents deletion in later years, and its service account's SQL permissions are restricted to this instance. The schedule was installed before database creation. Deletion permanently removes its example messages, offers and inventory; the app will then stop working until another database is connected. Firestore and other project resources are outside this deletion job.

Other Google Cloud services are metered. This configuration is not a provider-enforced $10 spending cap. The deployment account cannot read the linked billing account's credits or budgets; the billing owner should review usage and configure alerts. Do not change the cleanup schedule or provision a paid database without a new cost review.

## Source and operations

The container uses the pinned `requirements.lock`. The nine backend suites include authorization, inventory, Firebase boundaries, Firestore failure behavior and evaluation-account restrictions. Network doubles in local tests are explicitly labelled; live checks are recorded separately.

`ops/seed_evaluation.py` is a one-off, idempotent fixture command. It runs only in evaluation mode and does not reset existing trades or stock. It was executed as a Cloud Run job after the four Firebase users were configured.

`deploy_production.sh` is the older paid HA deployment path and is outside this budget. Do not run it for the evaluation deployment. `deploy.sh` is a local/sample-data demonstration path and does not reproduce the verified cloud architecture.

Support and privacy requests: **mail@hyperway.site**.

This is a working evaluation prototype, not a certification of readiness for real financial transactions, real deliveries or an unrestricted public launch. General production work still includes operational monitoring, recovery testing, moderation and account lifecycle management.

## KYC, trust and mutual reviews

Private KYC is available only to a buyer/seller using their own verified email. Shared demo accounts cannot upload documents or access the human queue. With consent, an image is sent to Gemini for readability, name consistency and anomaly review. A clean AI result is labelled AI checks passed, not identity verified. Anomalies or model failures remain for human review. Only the configured, verified private reviewer email can make an identity decision; self-approval is denied. Document images are deleted after a decision or 30 days. The scheduled recovery worker enforces retention. This is not government-database verification or a liveness check.

Completed trades permit one buyer-to-seller and one seller-to-buyer rating. Trust scoring is visible: verified email 20; human-approved identity 40; completed trades up to 20; rating evidence up to 20. Shared-demo activity is excluded from real-account scores. Scores summarize recorded app events and do not guarantee honesty or transaction safety.
