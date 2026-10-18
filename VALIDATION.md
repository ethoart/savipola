# Validation - October 18, 2026

## Passed locally

- Multilingual responsive update: locally served font files and licences, per-message/source language tags, translated DOM flows, and viewport-controller checks with mocked geometry. The browser matrix at `/responsive-check` is implemented but has not been run in this environment. See `RESPONSIVE_VALIDATION.md`; no all-device visual pass is claimed.
- Refined interface checks: all requested icons render from the bundled Lucide package across all nine main screens in three languages; the marketplace has one search field; popups disable background navigation, cycle keyboard focus, close with Escape and restore focus. Registration, search/filter, sample chat, offers/acceptance/transport and profile editing still pass. These remain DOM checks, not visual browser or device tests.
- Marketplace redesign DOM checks: initial screen is language selection; language → activity → details registration; draft retention after going back; password show/hide; role/language in registration payload; password draft clearing after success. Sinhala, Tamil and English labels are present throughout.
- English/Sinhala/Tamil/Singlish tomato searches return matching crops; district filters, ascending price sort, filter clearing, global search and how-to help work. The existing offer → seller acceptance → transport flow passes through the redesigned UI. Photographs were inspected for subject correctness; sample crops are not asserted to be actual seller photos.
- Mobile interface DOM checks: all nine main screens in English, Sinhala and Tamil; every literal translation key exists and has three nonempty values. Profile creation/editing, saved edits after refresh, original-message toggling, both participants' sample chat views, prepared-message sending, unknown-message fallback and escaped user content pass. These checks do not establish browser layout quality or linguistic accuracy.
- Three independent registered accounts: login/logout, cookie sessions, actor ownership checks, public phone/hash exclusion, conversation membership, anonymous denial, WebSocket message delivery, idempotent sending and cross-site mutation denial pass.
- Chat translation boundaries: missing Vertex credentials retains the original and reports unavailable; an identified model fixture supports retry; a fixture changing numeric tokens is rejected. No live translation request was sent.
- Original end-to-end API flow: offer, acceptance, stock ledger, vehicle capacity/quote, worker booking, completion/review and produce fulfilment.
- New boundary checks: missing Vertex configuration returns an error; test fixtures never publish a listing automatically; photo review leaves the seller's grade unchanged; schema validation rejects invalid quantities; failed model processing returns an explicit error.
- Allocation excludes asking prices above the buyer's maximum goods price.
- Two competing acceptances cannot oversell the available sample stock; repeating fulfilment does not move stock twice.
- DOM integration checks render all ten application views, escape AI-supplied HTML, fill a draft into a review form and show a buyer explanation. These use identified fixtures, not live AI.
- The real Google Gen AI SDK serializes the Vertex response schema and parses a mocked response through its HTTP interface. No live request was sent.
- Python/JavaScript syntax and deployment-shell syntax checks pass.
- The four-page PDF brief was rendered and visually checked.

## Still to verify in your project

- A real Vertex AI text and photo request with your project's model access and quota.
- Cloud Run source build, IAM setup and deployment script against your account.
- Cloud SQL PostgreSQL connectivity, schema setup, transactions and persistence after redeployment. Only the local SQLite database flow was executed here; the PostgreSQL backend is implemented but unverified against a live database.
- Actual mobile/desktop visual browser rendering. Chromium could not be installed in this environment; DOM checks do not establish visual correctness.
- Sinhala/Tamil extraction quality, real produce-photo accuracy and user usability.
- Native-speaker review of all Sinhala/Tamil interface copy and bidirectional chat translations; real-device installation, reconnect behavior and cross-instance polling under Cloud Run.
- Usability sessions with farmers and workers who have little experience using apps. Plain and mixed wording is implemented, but universal comprehension is not established. No live code-switched Vertex translation test was run.
- All community impact and price outcomes. Sample transactions are not pilot evidence.

Use GOOGLE_CLOUD_SETUP.md for the final deployed checks before recording and submission.
