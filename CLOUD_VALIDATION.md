# SaviPola cloud validation

18 October 2026 · Team Hyper Way · shared fictional evaluation data only.

## Live checks passed

- Cloud Run revision `savipola-00004-96h` serves the container built as `evaluation-v063`. Public canonical URL: https://savipola-2cpvvetnwq-uc.a.run.app .
- Native Firebase email/password sign-in succeeded for two distinct pre-provisioned accounts. The backend verified their real ID tokens and issued separate secure server sessions. Phone sign-in is disabled; all SMS regions remain blocked; the browser uses no CAPTCHA bypass.
- The buyer saved the tomato harvest to real Cloud Firestore, read it back, and the farmer account did not see the buyer's saved item. SQL supplied the current listing price and availability.
- A fresh English chat message asking for **10 kg at LKR 245/kg** was translated into Sinhala by **Vertex AI / gemini-3.5-flash-lite**. The original message remained available. This was a real model request, separate from local test doubles.
- Buyer offer #1 was accepted by the farmer. PostgreSQL stock changed from **300 kg to 290 kg available**. The buyer then created transport request #1 with an illustrative LKR 1,900 quote for manually entered 20 km. This books a fictional record, not an actual driver.
- Cloud Scheduler's translation recovery job successfully called the authenticated internal endpoint (HTTP 200). The recovery job runs every five minutes; fresh evaluation chat translation completes during the request because request-scoped Cloud Run CPU is used.
- The evaluation database deletion schedule is installed for **10 January 2027, 00:00 UTC**. Its workflow was exercised outside that date and safely returned inactive. The job's scope is only `savipola-eval-db`.

## Local verification

All eight backend suites passed: flow, AI/stock, community, cloud security, Firebase identity, production configuration, saved harvests and review access. JavaScript syntax checks passed. The suites explicitly mock external network boundaries; the live results above are separate checks.

## Limits of the evidence

This is a functional evaluation deployment, not a load, uptime or production-readiness certification. Real SMS is intentionally unavailable. There are two public shared accounts, with no private-data promise between people using the same account. No payments, actual transport, field pilot, certified produce grades, real-user impact measurement, backup-restore exercise or broad device benchmark is claimed. Gemini output can be wrong and should be compared with the original.

The approved monthly target is US$10 for small evaluation traffic. The deployment uses scale-to-zero hosting, a single maximum app instance, polling chat, daily AI quotas, and the authorized database trial. These controls do not constitute a provider-enforced spending cap. The deployed database and its data expire on the scheduled deletion date.
