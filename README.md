
# 🌾 SaviPola — connect the harvest to the whole community 🌍

Working evaluation prototype for **Google Cloud AI Builder Cup 2026**, Sustainability & Social Impact.

🌐 **Public app:** https://savipola-2cpvvetnwq-uc.a.run.app

🎬 **3:15 demonstration video:** https://storage.googleapis.com/savipola-demo-1056643858922/watch.html

👥 **Hyper Way:** leader Sathini Dewmanthi Jayamaha; member Sandun Nayanaka Subasingha.

---

## 🤝 Contributors

- 🌟 [Sathini Dewmanthi Jayamaha (@Dewmanthi)](https://github.com/Dewmanthi) — Team leader.

---

## 🚀 Try the application

Create an account as a farmer/seller, buyer, driver or worker. Open Firebase's verification email, verify, then sign in. Password reset and logout are available. All SMS regions remain blocked; the deployment uses email, not phone authentication.

🎮 For a quick demonstration, select Try as farmer, buyer, driver or worker on the welcome page. These four native Firebase accounts contain shared fictional data. Use separate browser profiles or a normal and private window for simultaneous accounts. Ordinary tabs share cookies. Never put personal information in a shared account. Credentials and deployment details are in [EVALUATION_DEPLOYMENT.md](EVALUATION_DEPLOYMENT.md).

---

## ✨ Working features

- 🌐 **Multilingual experience:** Sinhala, Tamil and English interface, language-first registration, crop aliases and responsive cards. The team confirmed the iPhone color fix on its own phone on 18 October 2026.
- 🌱 **Smart agricultural marketplace:** Farmer listings, stock/restock and explicitly self-reported quality checks; buyer search, demands, stock-aware sourcing proposals and private saved harvests.
- 💬 **AI-powered communication:** Private conversations with Gemini translation and reply drafting. Original messages remain available. Translation is assistance and may be wrong.
- 🤝 **Connected community services:** Structured offers, seller acceptance and consistent inventory reservation/completion. Driver service listings, linked transport records and delivery completion. Worker listings, hiring records, completion and ratings. No payment or actual dispatch occurs.
- ⭐ **Trust and reputation:** Mutual buyer/seller reviews after a completed trade, with one review per party. Trust scores expose their components; demo activity does not raise a real account's score.
- 🛡️ **Privacy-focused identity checks:** Private, consented buyer/seller KYC: Gemini checks readability, name consistency and anomalies. AI checks passed is distinct from identity verified. Only an authorized human reviewer can approve identity. Self-approval and shared-account document uploads are blocked. Images are removed after a decision or 30 days.

---

## ☁️ Actual Google Cloud integration

🔥 Firebase Authentication supplies verified-email identities. Cloud Run hosts the interface and FastAPI APIs. Cloud Firestore persists each account's private saved-harvest references. Cloud SQL PostgreSQL stores profiles, inventory, orders, messages and private review records. Gemini through Vertex AI performs translation, drafting and document consistency checks. Runtime credentials stay on the server; no service-account key or database password is published.

📋 [CLOUD_VALIDATION.md](CLOUD_VALIDATION.md) records fourteen live workflow checks, the separate real-model fictional-document check, nine backend suites and their limits. [RESPONSIVE_VALIDATION.md](RESPONSIVE_VALIDATION.md) distinguishes browser checks from physical-device evidence.

---

## 💻 Run locally

📦 Extract the source. On Windows, open the project folder and run `START_SAVIPOLA.bat`. On macOS/Linux, run `python3 launch_local.py`. Python 3.12 is recommended. The launcher installs dependencies and opens a free local port starting at 8000. Keep its process open while using the app.

### 🛠️ Manual start

```bash
python -m pip install -r requirements.txt
python app.py
```

📝 Local sample mode uses SQLite and fictional profiles; its phone/password registration is not SMS verification. Cloud features require the configuration in GOOGLE_CLOUD_SETUP.md. Verified-email onboarding and private KYC require Firebase mode. Evaluation access defaults off in source.

---

## ✅ Verify

```bash
python -m pip install -r requirements-dev.txt
python test_flow.py
python test_ai_and_stock.py
python test_community.py
python test_cloud_security.py
python test_firebase_identity.py
python test_production_config.py
python test_saved_harvests.py
python test_review_access.py
python test_identity_reputation.py
```

🧪 Network boundaries in local tests are mocked. Successful live cloud checks are separately documented.

---

## 📋 Submission and operating limits

🏆 Use the prescribed 16-slide challenge pitch PDF, public app/repository URLs, a working 3–4 minute video and the short technology description. SUBMISSION_HANDOFF.md identifies the template. Historical material under docs/ is supporting material, not the prescribed pitch deck. The recorded video remains a team deliverable until its URL is added.

💰 The approved target is US$10/month for small evaluation traffic, not a provider-enforced cap. Hosting scales to zero with one maximum instance. AI requests are limited to 20 per account and 40 globally per day. Phone authentication is disabled. The authorized evaluation SQL database is permanently deleted on 10 January 2027 at 00:00 UTC (05:30 Sri Lanka), before trial billing. This stops the app until a replacement database is connected. Other project resources are outside that deletion job. The historical paid HA deployment script is outside the approved budget and has an explicit cost-review guard.

⚠️ This is a working evaluation prototype, not production-readiness certification. No real payments, live routing, government identity API, document-authenticity guarantee, liveness checks, field pilot or measured income improvements are claimed. Broader moderation, operational monitoring, account-deletion workflows, backup/recovery and load testing remain. AI inputs are sent to Google Cloud with the displayed notices and consent. Private API responses are never cached by the service worker.

---

📩 Support and privacy requests: **mail@hyperway.site**.

