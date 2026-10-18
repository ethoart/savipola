# Multilingual responsive validation

Implemented 18 October 2026 for English, Sinhala and Tamil. This is a validation plan and record of available checks; it is not a claim that every browser or screen has passed.

## What changed

- Noto Sans, Noto Sans Sinhala and Noto Sans Tamil are bundled locally at weights 400, 500, 600 and 700, with their SIL Open Font Licences. Static fonts remain available after the app cache installs. The runnable app makes no font request to an external service.
- Sinhala and Tamil use script-specific font stacks, natural letter spacing and taller line heights. Translated messages and original messages carry their own language tags. Inputs follow the selected message language.
- Cards use one column on very narrow screens, two on phones/smaller tablets, three on larger tablets and four on wide desktop layouts. Header, registration, forms, controls, service cards and chat allow long labels to wrap.
- Relative text sizes and measured width/text-size breakpoints adapt to larger default text. No user zoom restriction is set. Safe-area padding is included for mobile screens.
- Bottom-navigation space follows its measured rendered height. Chat uses available viewport height, responds to viewport resize and allows normal page scrolling on very short screens. Keyboard detection preserves the composer and trade context while temporarily hiding secondary chat information. Pinch zoom is not treated as a keyboard.

## Checks completed here

- Three-language DOM flows for registration, search, profile editing, offers, acceptance, transport, sample conversations, original text, filters and accessible popups.
- Layout-controller checks with mocked geometry: changing navigation height, a shortened keyboard viewport, a very short viewport, pinch zoom, 200% root text size, responsive breakpoints and observer cleanup.
- Static routes, script order, every cached asset, twelve font-file headers and licences, JavaScript syntax, and stylesheet block balance.

**Not completed here:** real browser geometry, screenshots, actual mobile keyboards, font shaping on real browsers, touch-device interactions, native-speaker copy review or usability sessions. This environment has no supported browser QA surface. Mocked geometry does not prove that text fits visually.

## Run the real browser check

1. Start the app normally and open `/responsive-check` on the same local app URL. For example, if it runs on port 8000, use `http://127.0.0.1:8000/responsive-check`.
2. Run the quick matrix, then the full matrix. Repeat with **200% text size** selected.
3. Review every flagged result in the target browser. Repeat in Chrome/Edge, Safari and Firefox where available.
4. Check real phones in portrait and landscape, with the keyboard open, rotating the screen, pinch zoom and increased accessibility text settings. Desktop iframes do not simulate a real phone keyboard or mobile browser chrome.

The checker uses the real app and waits for the selected script font. It only uses sample profiles, keeps preferences in memory, blocks mutating API requests, and never submits forms or sends messages. Its report stays in that browser tab.

| Matrix | Viewports |
| --- | --- |
| Quick | 320, 375, 768, 1024 and 1440 CSS pixels wide; 800 high |
| Full | 240, 280, 320, 360, 375, 390, 414, 600, 720, 768, 820, 920, 1024, 1280, 1440 and 1920 wide; 800 high |
| Short landscape | 568 × 320, 844 × 390 and 1024 × 480 |
| Languages | English, Sinhala and Tamil |
| Screens | Language, role, signup, login, home, market, profile, orders, inventory, transport, workers, jobs, demands, messages, chat, offer form and help |

The checker flags page overflow, out-of-viewport text/controls, clipped containers and controls below 44 pixels high. A geometry pass does not establish good language, user comprehension, visual appeal, or support for every browser. Native select/input fields can scroll their values normally; these are not treated as clipped text.
