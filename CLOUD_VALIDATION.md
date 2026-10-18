# SaviPola cloud validation

18 October 2026 · Hyper Way · fictional evaluation records only.

## Passed live integration checks

- Public Cloud Run application and Firebase email authentication are working. Four separate reviewer role sessions passed. The team owner personally confirmed registration, verification-email delivery and sign-in with their own account. An unverified email token was refused; its disposable test account was removed.
- Farmer listing publication, restocking and self-reported quality; buyer demand and stock-aware planning; Firestore saved-harvest persistence and cross-account isolation passed.
- Driver service publication, private booking visibility and delivery completion passed. Worker service publication, hiring, completion and rating passed. These are records using fictional data, not actual services.
- A 10 kg trade completed with correct inventory: 60 kg total became 50 kg available, zero reserved and 10 sold. Buyer and seller each posted a rating; a duplicate was refused.
- Shared reviewer accounts were denied the human KYC queue and personal KYC upload. No identity points were awarded for an unapproved KYC request.
- Fresh Gemini reply drafting and chat translation passed, with original text retained. A separate real Gemini document check correctly flagged a visibly fictional evaluation image as a sample with no legal validity. No real identity document was used in this test.
- Logout invalidated the session, and subsequent Firebase sign-in worked.
- Authenticated Scheduler recovery returned HTTP 200. The authorized database cleanup is scoped to the evaluation instance on 10 January 2027 at 00:00 UTC, with a date guard tested outside the deletion date.

The application release also replaces unsupported light-dark() colors with ordinary values and dark-mode media queries, adds viewport fallbacks, versions stylesheet URLs and revalidates app assets. The team reopened the updated app in iPhone Chrome and confirmed the green cards, buttons and layout displayed correctly. This is one physical-device confirmation, not a broad device benchmark.

## Local checks

Nine backend suites passed, including the new verified-email/KYC/mutual-review suite. These tests mock external Firebase and Gemini boundaries. They cover staff-only decisions, no self-approval, document deletion and retention, duplicate/outsider reviews, trust arithmetic and exclusion of demo activity from real-user trust. JavaScript syntax checks passed. Local fixtures are not evidence of a live model; the live checks above were separate.

## Limits

This is a functional evaluation deployment, not load, uptime or production-readiness certification. SMS is disabled and all phone regions remain blocked. Four published accounts share fictional data. Native accounts have separate private access. AI cannot establish document authenticity or ownership; a human decision is required for the identity-verified badge. No government identity API, liveness check, payments, actual delivery, field pilot or measured impact is claimed.

The approved US$10 monthly target uses scale-to-zero hosting, one maximum app instance, polling and daily AI quotas. It is not a provider-enforced cap. The authorized evaluation database and its data are permanently deleted on 10 January 2027 at 00:00 UTC; the app then needs a replacement database.
