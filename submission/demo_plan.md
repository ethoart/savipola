# Hyper Way: SaviPola demo recording plan

Team: Sandun Nayanaka Subasingha and Sathini Dewmanthi Jayamaha.
Confirmed event: AI Builder Cup 2026. The user inspected the signed-in portal and reports a **3–4 minute** video requirement. Use the 3:35 primary cut below for that portal. The public FAQ still says **under 3 minutes**, so a 2:50 alternative is included. We have not inspected the signed-in portal ourselves.

## Before recording

Use the deployed HTTPS URL after the cloud smoke tests pass. Prepare controlled farmer/buyer accounts and, if showing services, controlled driver/worker accounts. Label the recording as a demonstration; never portray staged listings or prepared histories as real adoption or revenue. Do not show phone numbers, OTPs, cookies, tokens, personal chat, billing information or credentials.

Use a new 40 kg tomato listing at LKR 200/kg. Accept a 20 kg offer so the visible stock becomes 20 kg available and 20 kg reserved. Amounts are demonstration inputs, not current market rates. Do not claim the app establishes a fair market price or certifies crop quality. Use a fresh recording of a successful Vertex request, not prepared translations, screenshots of fixtures or a Gemini logo standing in for evidence.

## Primary cut: 3 minutes 35 seconds

| Time | Screen/action | Narration and proof |
| --- | --- | --- |
| 0:00–0:12 | Title and app home | “We are Hyper Way. SaviPola helps Sri Lankan farmers and buyers coordinate a harvest sale with transport and local work.” Present the local problem as the scenario we are testing, without invented interview or impact statistics. |
| 0:12–0:32 | Language screen and signed-in profiles | Show Sinhala, Tamil and English selection. Briefly show the verified farmer and buyer accounts. Edit out SMS waiting, label any cut, and hide numbers/codes. |
| 0:32–0:55 | Farmer posts 40 kg at LKR 200/kg | Show the actual listing and units. The current mobile flow posts a manual listing. Do not imply the mobile screen has the older desktop listing/photo AI workflow; those structured APIs remain in source. |
| 0:55–1:15 | Buyer saves the harvest, reloads Saved harvests | Explain that Firestore persists a private shortlist. Reopen the same buyer account in another session, or reload after sign-in. Show the stored document path only with private identity hidden. Saving does not reserve stock. |
| 1:15–2:00 | Two-account P2P conversation | Set different profile languages, send a new message mentioning 20 kg and LKR 200/kg, and show a fresh successful Gemini translation via Vertex AI. Toggle Show original. Request an AI reply, review it and send only after a deliberate action. If AI fails, show the real failure and original text; do not replace it with a test fixture. A working-AI submission still needs a successful live call before submission. |
| 2:00–2:35 | Offer and farmer acceptance | Buyer offers for 20 kg. Farmer accepts. Show stock at 20 available / 20 reserved. Explain that code checks stock and ownership; the model does not make trade commitments. |
| 2:35–3:00 | Transport and worker booking | Show capacity check, a manually entered distance and the separate quote. Book a listed worker. Explain that routes, availability and physical fulfillment are not live dispatch integrations. Ratings reflect completed in-app demonstration jobs, not independently verified employment. |
| 3:00–3:20 | Architecture and actual deployment evidence | Show Cloud Run URL, then the service map: Firebase Auth, private Firestore saved harvests, SQL ledger and Gemini on Vertex AI. Redact project internals and all credentials. State only integrations actually smoke-tested. |
| 3:20–3:35 | Close | State the proposed pilot measurements: coordination time, fulfilled volume and usability. Explain that payment processing and food-safety certification are outside this prototype. Display the real deployed URL and real public repository link only once both exist. |

Speaker split suggestion: Sandun handles the problem and farmer/trade workflow; Sathini handles the buyer, language/AI workflow and closing pilot plan. Swap if that suits the team better.

## Alternative cut: 2 minutes 50 seconds

| Time | Focus |
| --- | --- |
| 0:00–0:10 | Team and problem |
| 0:10–0:25 | Language choice and verified profiles |
| 0:25–0:45 | Manual harvest listing |
| 0:45–1:00 | Firestore save and reload |
| 1:00–1:35 | Fresh Gemini translation, original and reviewed draft |
| 1:35–2:05 | Offer, acceptance and stock ledger |
| 2:05–2:25 | Brief transport/worker flow |
| 2:25–2:50 | Architecture, honest limits and links |

Keep this version only as a fallback for the public FAQ's conflicting limit. The confirmed signed-in portal is the primary submission guidance supplied by the user. Deadline reported there: 18 October 2026, 11:59 PM IST, the same clock time in Sri Lanka.

## Actual-app screenshot checklist for the local team

No browser screenshots were captured in this cloud environment. Do not use these instructions as evidence that screenshots already exist. Open the real app and capture the following after the changes and cloud setup work:

1. `01_language.png`: first screen with all three language choices visible.
2. `02_market.png`: an actual current app market screen at 390×844 CSS pixels; preserve its “sample photo” labels. Crop/redact personal information.
3. `03_saved_harvests.png`: verified buyer’s Saved harvests after a reload with a real Firestore write/read confirmed. This screen proves a shortlist, not stock reservation.
4. `04_translation.png`: a newly sent message, actual successful Vertex translation and visible Show original control. Record the call time/model privately. Never insert prepared demo text or offline test output and label it live Gemini.
5. `05_stock.png`: accepted 20 kg offer and actual available/reserved quantities from the controlled 40 kg listing.
6. `06_services.png`: real app transport or worker booking screen, with manually entered distance and example photos honestly labelled.

Use direct browser/device captures of the running app. Do not fabricate screenshots, draw replacement screens or remove disclosure labels. Native-speaker and physical-device review remain outstanding. The user/local chat is handling the official 16-slide template and final PDF under 5 MB.
