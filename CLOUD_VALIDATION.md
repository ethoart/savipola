# Cloud integration validation — 18 October 2026

Source version 0.6.0. No resources were created in the user's Google Cloud project.

## Passed here

- `test_saved_harvests.py`: private saved-harvest ownership, hashed UID paths, CSRF, create/delete idempotency, cross-session reads, SQL price/stock authority and explicit disabled/IAM/outage errors. Firebase identity and Firestore network use test doubles; no live Firestore verification is claimed.
- Updated trilingual DOM checks exercise save, reload, removal and failed-write behavior, in addition to phone onboarding. Actual browser screenshots were not available; the local chat will capture the running app.


- `test_flow.py`: marketplace roles, offers, stock transitions, sourcing, transport, workers and reviews.
- `test_ai_and_stock.py`: AI failures/structured-output boundaries, competing reservations and duplicate fulfillment.
- `test_community.py`: separate account sessions, private chat/membership, WebSocket delivery, idempotent sends and numeric-preserving translation/retry.
- `test_cloud_security.py`: Firebase exchange/revocation application boundary, revoked WebSocket closure, CSRF and exact-Origin checks, disabled password/demo routes, privacy for the first real users, conflicting actor-field rejection, persistent translation recovery, worker identity, shared quotas, bounded request bodies and production headers. Uses local SQLite and mocked Google/Firebase/Vertex network boundaries.
- `test_firebase_identity.py`: Firebase Admin adapter enforces recent phone-provider ID tokens, checks revocation, mints five-day cookies, maps revoked/invalid credentials to 401 and service outages to 503. SDK calls are mocked.
- `test_production_config.py`: production refuses demo seeding, local authentication, missing required settings, insecure origins, emulators, key files and mismatched Firebase/GCP projects.
- `ops/test_phone_ui.cjs`: English/Sinhala/Tamil consent, signup and OTP flow; verified-profile display; sample access removed; copy coverage; escaped names. JSDOM only, SMS and backend mocked.
- Python compile checks, JavaScript parse checks, shell syntax and `pip check` passed. Dependencies are pinned in `requirements.lock` for the container; no vulnerability-free certification is implied.
- Official Firebase 13.0.0 app/auth module endpoints returned HTTP 200. This does not prove browser execution, CSP compatibility or reCAPTCHA behavior.

## Not verified / not completed

Live Firestore read/write/rules enforcement, Firebase SMS delivery, consent localization, reCAPTCHA/browser/CSP behavior, Cloud Run builds/IAM, real Vertex model calls, Cloud SQL/PostgreSQL concurrency, cross-instance polling under load, Scheduler OIDC in Cloud Run, HA/failover, backup restore and cost behavior require testing in the user's cloud project. No browser/device visual QA or all-screen-size guarantee is claimed.

A small measured staging pilot is the next deployment target. Production launch also requires the product and operational blockers in `PRODUCTION_DEPLOYMENT.md`: moderation/reporting/blocking, recovery/deletion and retention policies, versioned migrations/restricted SQL roles, scalable paginated APIs/chat delivery, real photo storage and native-speaker/usability review. No payment or escrow implementation is present.

The `/privacy` page is a technical implementation summary with the configured operator contact. It is not a completed operator policy or legal review. The deployment script configures backups/PITR but no backup has been restored here, and it does not create monitoring alerts or a complete CI/CD pipeline.

## Submission coordination

The user/local chat confirmed AI Builder Cup 2026, official 16-slide template, 3–4 minute video, PDF under 5 MB and 1,024-character description. They report the PPTX and 1.27 MB PDF already exist locally. No second presentation was produced. GitHub connection is ethoart; no accessible SaviPola repository was found, and no repository/source publication or cloud deployment is claimed. Source transfer uses a sanitized ZIP, SHA-256 manifest and numbered base64 command outputs at the user’s explicit request.
