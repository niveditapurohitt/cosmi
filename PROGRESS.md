# Cosmichameleon — Progress

## Current state (all verified working)
- **Services/Products view switcher** (bottom-left, plain stacked text: "Our Services" / "Our Products", both clickable).
  - Services reveals only the 7 "Our Expertise" sub cards.
  - Products reveals cards 1–3.
  - Buttons always visible; nothing revolves until a view is clicked.
- **Sub cards use the main-card design**: dark rounded card, constellation net, accent border + top bar, "COSMICHAMELEON" branding, white title, accent subtitle (hover variant brighter). The main "Our Expertise" card stays hidden.
  - Textures: `makeCardStyleTexture()` (512×356), cached via `useCardStyleTextures()`.
  - Portrait geometry `[3.8, 2.65]`.
- **Spacing**: all 7 cards fully on-screen in a wide arc, no overlaps.
  - Constants: `SUB_CARD_SCALE 0.56`, `SUB_CARD_SPREAD 10`, `SUB_CARD_OFFSET -1.5`, `SUB_ORBIT_RADIUS 4.8`.
- **Click-to-detail works**: clicking a sub card opens the `DetailPanel` (follow mode, x = camera.x + 14).

## Key files
- `dna-scroll/src/App.jsx` — textures, hook, orbiting cards, detail panel, switcher JSX.
- `dna-scroll/src/index.css` — `.view-switcher` / `.view-btn` (plain text, stacked column).

## Verification
- `npm run build` passes (chunk-size warning only).
- Clean headless run: no console errors, probe code removed.

## Build / run
- Dev server: `npm run dev` (http://localhost:5173).
- Build: `npm run build`.
