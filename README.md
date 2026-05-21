# Produck — Landing Site

Fixed-fold one-pager. The duck waddles around the screen, leaves up to 8
footprints behind it, and if it catches your cursor you can use it as a pen to
draw on the page. Built with Vite + vanilla JS so the code stays grep-able and
the dev server stays fast.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Folder layout

```
produck-site/
├── index.html                      ← shell (announce bar / nav / hero / canvas / duck)
├── package.json                    ← vite dep
├── vite.config.js                  ← port 5173, host: true for LAN access
├── public/
│   └── favicon.svg                 ← sage-green tile + Produck silhouette
└── src/
    ├── main.js                     ← wires every module together
    ├── config.js                   ← palette + duck/footprint/whiteboard tunables
    ├── duck/
    │   ├── duck.js                 ← Duck class — state machine (waddling/hunting/grabbed)
    │   ├── duck-sprite.js          ← Friendly-Mascot SVG markup (from logo studies)
    │   └── footprints.js           ← FootprintTrail — max-8-alive, fade with age
    ├── ui/
    │   ├── header.js               ← injects the "pro_duck" wordmark
    │   ├── email.js                ← email form validation + localStorage persist
    │   └── whiteboard.js           ← canvas drawing layer (pointer events)
    ├── scene/
    │   └── background.js           ← static isometric SVG backdrop (sage + props)
    └── styles/
        ├── reset.css               ← minimal reset, no-scroll lock
        ├── tokens.css              ← CSS custom-properties (palette + type)
        ├── layout.css              ← fixed positioning, 100dvh
        ├── components.css          ← buttons, inputs, eyebrow chip, headline
        └── duck.css                ← duck transforms, footprints, draw-hint banner
```

## Tunable behavior

Edit `src/config.js`:

- `DUCK.waddleSpeed` — px/sec while roaming
- `DUCK.huntSpeed` — px/sec while chasing the cursor
- `DUCK.proximityRadius` — distance at which duck notices the mouse
- `DUCK.grabRadius` — distance at which the duck snags the cursor
- `DUCK.stepDistance` — distance between footprints
- `FOOTPRINTS.maxAlive` — how many footprints persist (default 8)
- `WHITEBOARD.strokeColor`, `strokeWidth` — pen settings

## Hot-reload notes

Vite watches every file under `src/` and `index.html`. Edit anything and the
browser updates without losing the duck's position. The whiteboard canvas is
recreated on full reload — drawings clear, signups in `localStorage` persist.

## Browser support

Targets modern Chromium/Firefox/Safari. Uses:
- `100dvh` viewport units (graceful fallback on older mobile)
- `PointerEvent` API (universal touch + mouse)
- `requestAnimationFrame` loop
- No build-time framework — code ships ~6 KB gzipped (+ Plus Jakarta / Inter / JetBrains Mono from Google Fonts).
