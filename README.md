# SaviPola - connect the harvest to the whole community

Working prototype for **Google Cloud AI Builder Cup 2026**, recommended theme: **Sustainability & Social Impact**. Farmers, buyers, drivers and local workers coordinate a harvest sale in one workflow.

## Hyper Way submission package

Version 0.6.0 adds private Firestore saved-harvest shortlists, alongside Firebase verified-phone sign-in, server-side Firebase sessions, CSRF protection, shared SQL quotas, persistent translation recovery and a production configuration that disables demo data and legacy screens. **Start with [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** for the service map, Firebase setup, deployment commands, staging tests, costs and remaining launch blockers. The deployment script is `deploy_production.sh`; `deploy.sh` remains a sample-data hackathon deployment.

**Team Hyper Way:** Team leader Sathini Dewmanthi Jayamaha; team member Sandun Nayanaka Subasingha. Start with `SUBMISSION_HANDOFF.md` for the confirmed AI Builder Cup 2026 portal requirements, minimum setup, source transfer and evidence limits. The local team is preparing the official 16-slide template and PDF. The older PDF brief under `docs/` is historical supporting material, not the prescribed deck.

This package has not been deployed to your Google Cloud account. It is production-oriented source awaiting live staging and additional product/operational work; it is not a production-readiness certification.

## Run locally

**Windows:** extract the ZIP first, open the `savipola_prototype` folder, and double-click **START_SAVIPOLA.bat**. Python 3.12 is recommended. The first launch installs dependencies, then opens the app in your browser. Keep the command window open while using the app; press Ctrl+C to stop it.

**macOS / Linux:** from the extracted project folder run `python3 launch_local.py`. The launcher uses a local SQLite database and chooses a free port starting at 8000. It does not require Google Cloud credentials for the marketplace, stock, transport and worker demonstration. Vertex AI features still require the setup in GOOGLE_CLOUD_SETUP.md.

For a manual start:

```bash
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:8000. SQLite preserves local changes. Sample profiles, prices, vehicles and histories are fictional. Manual marketplace functions work without Google credentials.

## What changed

- **Persistent saved harvests:** verified Firebase accounts can save/remove a harvest and reload their private shortlist across devices. The backend writes real Cloud Firestore documents using ADC. Original stock and prices stay in SQL. Firestore is off in the default local demo and requires configured cloud credentials in Firebase mode. No live Firestore request has been verified here.

- **Multilingual reflow:** locally bundled Sinhala/Tamil/Latin fonts, natural script spacing, taller line heights and responsive controls. Narrow screens use fewer columns; header and navigation adapt to available space and larger text. Chat and popups respond to viewport height. See `RESPONSIVE_VALIDATION.md` for actual verification limits and the included `/responsive-check` browser checker.
- **Visual refinement:** a consistent outlined icon set, calmer colours, aligned product cards and buttons, one marketplace search field, shorter mobile navigation and a two-column desktop registration introduction. Popups keep keyboard focus inside them, close on Escape and restore focus to the opening control. Reduced-motion preferences disable decorative movement. Lucide 0.468.0 is bundled locally with its licence; no external icon request is needed during app use.
- **Clear marketplace redesign:** responsive photo-led cards, prominent search, separate buy/sell/work/delivery actions, optional area and price/stock sorting, and short how-to guidance. Layout draws on familiar marketplace patterns; it does not connect to or copy listings from eBay, OpenSea or AliExpress.
- **Language-first registration:** language → main activity → personal details. Draft details remain when moving back; password visibility is optional and passwords stay only in form memory until submission. Password drafts clear after a successful sign-in/signup or logout.
- **Everyday Sinhala:** familiar Sinhala–English wording replaces formal technical labels. Search recognises a curated set of English, Sinhala, Tamil and Singlish crop names, for example `tomato`, `තක්කාලි`, `thakkali` and `தக்காளி`. This is an alias lookup, not unrestricted natural-language understanding. Vertex translation/assistant prompts now explicitly accommodate code-switched messages; actual translation quality still needs testing.
- **Illustrative photos:** included photographs are labelled examples, not images of the seller's actual harvest. Photo sources are recorded in `static/photos/SOURCES.md` and are served locally. This update does not add listing-photo uploads.
- **Mobile interface:** touch-friendly screens, bottom navigation, standalone web-app manifest and English, Sinhala and Tamil interface strings. This is an installable web app, not an Android/iOS binary. Installation availability depends on your browser and HTTPS; localhost works for development.
- **Profiles:** create a farmer, buyer, worker or driver account using a Sri Lankan mobile number and password. Set your district, preferred language, bio and skills. Passwords use scrypt; sessions use HttpOnly cookies. Local demo phone numbers are not SMS-verified; Firebase mode replaces passwords with verified SMS sign-in. Public profiles omit phone numbers.
- **Private P2P chat:** registered people can message each other. Messages are saved and checked against conversation membership. A WebSocket delivers updates on the same process; a three-second poll recovers missed messages across instances and reconnects.
- **Two-language conversations:** each person writes in their chosen language. Gemini on Vertex AI translates incoming messages to the recipient's profile language. Original text remains available; translation errors retain it and offer retry. AI can draft a reply for review before sending. Translation is text-based, not voice interpretation.
- **Clearly marked sample chat:** demo profiles use prepared Sinhala/Tamil/English examples. Arbitrary sample messages keep their original text if no prepared translation exists. Demo profiles never impersonate a registered account or receive private messages.
- **Harvest AI:** Gemini on Vertex AI turns Sinhala, Tamil or English messages into structured listing drafts. Missing information stays empty; the farmer reviews before publishing.
- **Photo review:** Vertex AI describes visible cosmetic condition and uncertainty. It does not change the seller's grade or certify food safety.
- **Sourcing explanation:** code computes stock-aware quantities and goods totals; Gemini explains next steps. The allocation respects the buyer's per-kg cap. It is a heuristic, not a guaranteed cost optimum.
- **Cloud deployment:** Dockerfile, Cloud Run deployment script, Cloud SQL PostgreSQL backend and Secret Manager password injection.
- **Audit:** successful AI calls record operation, model, latency and time. Failed or unconfigured calls never return fake AI results.

See **GOOGLE_CLOUD_SETUP.md** to configure your project. Cloud source is implemented but has not been deployed to your account; no successful live Vertex request is claimed here.

## Local demo / judge walkthrough

1. The first screen asks for Sinhala, Tamil or English. Choose **Continue**, then your main activity and your details to create an account. **Just have a look first** opens sample data. On mobile, bottom navigation opens Market, Messages, Services and Profile; desktop uses the top navigation.
2. Home → **Speak in your language** opens a labelled sample conversation. Use **Preview as** to see both participants' language views. Toggle **Show original**, then send a prepared question.
3. Profile → **Create your profile** starts the same language-first registration flow. Open a second browser profile or incognito window and register another person in a different language. These are separate accounts, not the demo profile selector. Try mixed-language crop search and optional filters before starting a trade.
4. Messages → **New chat** → choose the other registered person. With Vertex configured, send an English/Sinhala/Tamil message and check the recipient's translation and original. Without credentials, the original arrives and translation is marked unavailable.
5. In sample mode, Market → View harvest → offer 40 kg at Rs. 240/kg. Switch to its sample farmer and accept in Profile → My orders & offers. Inventory moves from available to reserved.
6. The buyer can book transport after acceptance; Services supports worker booking and subsequent completion/review. Fulfil the trade to move reserved stock to sold.
7. The previous advanced desktop tools remain at **http://127.0.0.1:8000/classic**: Harvest AI listing drafts, photo review, and AI sourcing explanations. Sign out of any real account first, then use sample profiles there for the judge demo. The new marketplace uses the same backend.

Multi-farm sourcing is a proposal; each farmer must separately accept an offer. No grouped checkout or pooled freight routing is implemented. Sinhala/Tamil interface copy and model output still require review by native speakers. No speech recognition is implemented.

## Verify

```bash
python -m pip install -r requirements-dev.txt
python test_flow.py
python test_ai_and_stock.py
python test_community.py
python test_cloud_security.py
python test_firebase_identity.py
python test_production_config.py
python test_saved_harvests.py
```

AI boundary tests use explicitly identified test fixtures; these are not live Gemini evidence. See VALIDATION.md and CLOUD_VALIDATION.md for results and limits.

## Submission material

`solution_brief.md` maps product decisions to the rubric and proposes pilot evidence. `pitch.md` gives the core story. `submission/demo_plan.md` contains the primary 3–4 minute walkthrough required by the signed-in submission portal. The included PDF brief is supporting material, not a slide deck.

Submit a working Google Cloud URL, public source repository, a 3–4 minute video and a PDF deck under 5 MB using the prescribed template. The signed-in portal deadline is October 18, 2026 at 11:59 PM IST. The rules require a 2-4 person JAPAC team aged 21+ and exclude students.

## Boundaries

No live HARTI feed, verified fair-price algorithm, real payments, government identity checks, live routing, driver confirmations or independently verified worker credentials are present. Grades are self-reported. The profile switcher selects sample people only; registered accounts sign in separately. Keep public judging to sample data. Set `SAVIPOLA_DEMO_MODE=0` to disable anonymous mutations through sample actors before a real-user pilot.

Messages submitted for translation and AI assistance, and selected photos, are sent to Google Cloud for AI processing. Chat messages and translations persist in the configured database; images are not saved. Audit events exclude raw prompts and photos. Numeric tokens are checked against accidental changes in translations, but meaning and trade accuracy still need human review. Translations are not guaranteed correct.

Local demo mode uses password sessions and process-local limits. Firebase mode adds verified-phone sessions and SQL-backed limits. Moderation, account recovery/deletion workflows, complete migration management and live operational validation remain release blockers; see PRODUCTION_DEPLOYMENT.md. WebSocket notification state is process-local, with polling fallback; a shared message bus is a future improvement. The service worker caches static application files only; it does not cache private API responses or support offline transactions. Live Vertex, Cloud SQL and mobile browser rendering have not been verified in this environment. Maps Routes, consented Cloud Storage evidence and BigQuery analytics remain roadmap items.
