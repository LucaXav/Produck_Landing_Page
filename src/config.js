// Centralized constants. Tune behavior here without touching modules.

// ============== DUCK ==============
export const DUCK = {
  waddleSpeed: 38,              // px/sec while waddling (deliberate, duck-like)
  huntSpeed:   180,              // px/sec while chasing cursor
  proximityRadius: 320,         // mouse within this → switch to hunting
  grabRadius:      54,          // close enough to grab
  // Soft margin so duck stays inside viewport.
  edgeMargin: 90,
  // No static avoid zones — duck can now waddle anywhere, including over
  // the topnav (sits on top of it via z-index).
  avoidZones: [],
  // CSS selectors whose live bounding boxes the duck must skirt during waddle.
  // The topnav is intentionally NOT here — the duck can dock over it.
  avoidSelectors: ['.dialog', '.desktop-icon'],
  // Padding around dynamic avoid rects (px)
  avoidPadding: 28,

  // ============== DISTANCE-DRIVEN WALK CYCLE ==============
  // Used by duck.js _applyWalkPose() + _maybeDropFootprints().
  // A full leg-swing cycle completes every `stridePixels` of travel — so a
  // slow-moving duck has slow legs, a fast-moving duck has fast legs, and a
  // standing-still duck has frozen legs.
  stridePixels: 80,             // px traveled per full cycle (≈ 2 steps)
  legSwingDeg:  24,             // peak ± rotation of each leg
  bodyBobPx:    1.6,            // peak vertical body bob
  // Plant phases — when each foot touches down within the 0→1 cycle.
  plantPhaseBack:  0.25,        // back leg most-forward (just planted)
  plantPhaseFront: 0.75,        // front leg most-forward (just planted)
  // Footprint position offset from the duck's center, in px.
  // x is signed by `facing` so left-facing duck flips the offsets automatically.
  footOffset: {
    front: { x:  8, y: 46 },
    back:  { x: -8, y: 46 },
  },
};

// ============== FOOTPRINTS ==============
export const FOOTPRINTS = {
  maxAlive: 8,
  fadeMs:   1400,        // time from full opacity → 0 once aged out
};

// ============== WHITEBOARD ==============
export const WHITEBOARD = {
  strokeColor: '#ff7a1a',
  strokeWidth: 4,
};
