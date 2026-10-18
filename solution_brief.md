# SaviPola: judging-aligned solution brief

Prepared October 17, 2026. Event: Google Cloud AI Builder Cup. Proposed theme: **Sustainability & Social Impact**. Weights and submission rules come from organizer pages; the product choices and pilot design are recommendations.

## The local story

A farmer in Dambulla has a tomato harvest ready. A buyer in Colombo needs more volume than one farm can provide. A driver can move a suitable load, and a local worker can sort and load it. Coordinating quantities, acceptable prices, condition, transport and labour can require separate calls and messages. Validate that account through local interviews before claiming research evidence.

SaviPola connects those participants through a complete transaction. Lead with: **"Finding a buyer is only the start of selling a harvest. SaviPola connects the rest of the journey."** Keep SaviWork focused on harvest-related jobs so the product remains coherent.

## How to address the rubric

| Weight | What our entry should prove | Evidence to show |
| --- | --- | --- |
| 40% technical merit and Gen AI | AI improves a functioning workflow | Real Vertex listing draft, photo review and plan explanation; stock transactions; Google Cloud URL and persistent records |
| 25% problem fit and impact | Specific local people benefit | One believable transaction, early interviews if available, clear pilot measures |
| 25% innovation and creativity | Useful coordination beyond listing products | Language-to-listing review, photo observations, multi-farm sourcing proposal, transport and paid local work |
| 10% usability and design | Users can complete the journey | Mobile-friendly screens, kg/LKR labels, review-before-posting, visible shortages and failures |

The weights are official. This evidence mapping is our strategy, not a guarantee of selection.

## Google services that do real work

**Vertex AI + Gemini:** extract Sinhala, Tamil or English messages into validated listing fields; describe visible cosmetic produce condition; explain a stock-aware sourcing plan already calculated by code. Missing inputs remain null. Drafts need confirmation. Photo opinions never certify safety or update the seller's grade. Successful calls show model and latency.

**Cloud Run:** hosts FastAPI and the web app. **Cloud SQL PostgreSQL:** preserves inventory, offers, jobs and AI audit events across instances. **Secret Manager:** supplies the database password. A Dockerfile and deployment script connect these components. Your Google Cloud deployment and actual model calls still require project credentials and verification.

**Later additions:** Firebase Auth plus server-side ownership checks, Maps Routes API estimates, Cloud Storage for consented photo evidence and BigQuery pilot analytics. These are not integrated now. AI Studio can help prompt development. Additional agents, Gemma or Antigravity are not needed simply to make the tool list longer.

The model is configurable. Google's model lifecycle page listed `gemini-3.5-flash-lite` when checked; verify your project can access it before recording. This replaces the old fixed Gemini 2.5 Flash dependency.

## The prototype's connected workflow

1. Farmer describes a harvest → Vertex drafts fields → farmer reviews and publishes.
2. Farmer requests photo observations → model reports visible condition and uncertainty.
3. Buyer specifies crop, kg and maximum goods price → code proposes a split across available batches under that price cap.
4. Gemini explains the plan, shortfall and remaining actions; it does not execute purchases.
5. Buyer offers → seller accepts → a database transaction reserves the kilograms.
6. Buyer books a capacity-appropriate vehicle and separately sees an estimate using an entered distance.
7. Buyer books sorting/loading help → completes and reviews the job → fulfils the produce trade.

The allocation is a heuristic, not a guaranteed optimum. Each farmer accepts separately. Grouped checkout, pooled freight routing, live GPS, payments, independent worker verification and food-safety testing are not present. The selectable profiles are demonstration identities.

## Make the economics understandable

Show farmer proceeds and buyer landed cost separately. Example only: 500 kg at LKR 255/kg plus 100 kg at LKR 245/kg gives **LKR 152,000 goods value**. A 210 km sample truck quote at LKR 1,800 + LKR 65/km adds **LKR 15,450**; one sample loading job adds **LKR 3,800**. The resulting illustrative total is **LKR 171,250**, or **LKR 285.42/kg**. None of these are established market rates, net farmer income or proven savings. A two-farm pickup must be validated separately; there is no route optimizer.

HARTI publishes market bulletins, but no live feed is integrated. A future reference must show source, bulletin date, market, unit and retail/wholesale basis. Retail prices cannot be treated as directly comparable farm-gate prices. Prices remain negotiated; neither Gemini nor our sample guide certifies fairness.

## Collect credible impact evidence

If time permits, interview one farmer, one buyer and one driver or worker about their most recent real sale. With consent, keep anonymized notes on calls made, coordination time, failed pickups and what they would actually use. Three conversations are early discovery, not representative validation.

Proposed pilot: two weeks in one sourcing area, around ten farmers, two buyers, two drivers and five workers. These are proposed counts, not enrolled participants. Measure coordination minutes per fulfilled order, fulfilled kg/listed kg, stock conflicts, cancellations, landed LKR/kg, farmer proceeds less separately recorded selling costs, paid local jobs, repeat bookings and disputes. Compare similar crops, grades and trips with a pre-pilot baseline.

A 30% coordination-time reduction can be an initial **unmeasured target**. Report actual baseline, sample size and outcome after the pilot. Simulated trades cannot establish waste reduction or income gains.

## Finish the submission

Builder A configures the Google project, deploys, proves live Vertex calls and checks that trades survive redeployment. Builder B refines the local story, gathers early interviews if available, makes an English PDF deck and records the demo. Pair for the final end-to-end run.

Prioritize one complete transaction and genuine AI outputs. Defer custom training, forecasting, escrow, general jobs listings and automated freight pooling. The organizer requests a working deployed prototype, public repository, video under three minutes and a deck; the requirements page specifies PDF and English materials. This brief supports the deck and is not a slide deck. The public timeline lists October 18, 2026; check the dashboard for exact cutoff time. Eligibility requires ages 21+ and excludes students.

## References checked October 17, 2026

- Rubric and requirements: https://aibuildercup.com/themes.html
- Submission/eligibility FAQ: https://aibuildercup.com/Faqs.html
- Timeline: https://aibuildercup.com/
- Gen AI SDK: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/sdks/overview
- Model lifecycle: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions
- Structured output: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output
- Cloud Run/PostgreSQL: https://docs.cloud.google.com/sql/docs/postgres/connect-run
- HARTI: https://www.harti.gov.lk/weekly-price.php
