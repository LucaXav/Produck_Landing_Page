// ============== VIDEO DUCK SPRITE ==============
// Single looping walk video. duck.js pauses it on grab so the duck holds
// still while you draw, and resumes it on release.
//
// The source video shows the duck facing LEFT. duck.css adds an inherent
// `scaleX(-1)` so the video natively renders the duck facing RIGHT, then the
// outer .duck transform's scaleX(facing) flips it back when moving left.

export const DUCK_SVG = /* html */ `
<video class="duck-video"
       src="/duck-walk.webm"
       width="720" height="1080"
       autoplay loop muted playsinline preload="auto"
       aria-hidden="true"></video>
`;

// ─── MUDDY FOOTPRINT VARIANTS ────────────────────────────────
// Three slightly-different pixel-art stamps so the trail looks like real
// dirty steps instead of identical clones. Each defaults to "toes up";
// duck.js rotates the rendered element so the toes follow the velocity vector.
//
// Pixel anatomy:
//   - 3 toe tips at the top
//   - thicker heel pad at the bottom
//   - irregular smear/splatter pixels around the edges = the "mud"
const FP_COLOR      = '#1A140C';   // main print
const FP_COLOR_SOFT = 'rgba(26,20,12,0.55)';  // splatter

const FOOTPRINT_SVG_A = /* svg */ `
<svg viewBox="0 0 9 10" xmlns="http://www.w3.org/2000/svg"
     shape-rendering="crispEdges" aria-hidden="true">
  <!-- toes -->
  <rect x="4" y="0" width="1" height="3" fill="${FP_COLOR}"/>
  <rect x="1" y="2" width="1" height="3" fill="${FP_COLOR}"/>
  <rect x="7" y="2" width="1" height="3" fill="${FP_COLOR}"/>
  <!-- heel pad -->
  <rect x="3" y="5" width="3" height="3" fill="${FP_COLOR}"/>
  <rect x="2" y="6" width="5" height="1" fill="${FP_COLOR}"/>
  <!-- mud splatter -->
  <rect x="3" y="2" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="5" y="2" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="0" y="4" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="8" y="4" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="3" y="8" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="5" y="8" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
</svg>`;

const FOOTPRINT_SVG_B = /* svg */ `
<svg viewBox="0 0 9 10" xmlns="http://www.w3.org/2000/svg"
     shape-rendering="crispEdges" aria-hidden="true">
  <!-- toes (a little tighter together) -->
  <rect x="4" y="0" width="1" height="3" fill="${FP_COLOR}"/>
  <rect x="2" y="2" width="1" height="3" fill="${FP_COLOR}"/>
  <rect x="6" y="2" width="1" height="3" fill="${FP_COLOR}"/>
  <!-- heel pad with extra smudge -->
  <rect x="2" y="5" width="5" height="2" fill="${FP_COLOR}"/>
  <rect x="3" y="7" width="3" height="1" fill="${FP_COLOR}"/>
  <!-- mud splatter — heavier on one side -->
  <rect x="4" y="1" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="3" y="3" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="5" y="3" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="1" y="5" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="7" y="5" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="6" y="8" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
</svg>`;

const FOOTPRINT_SVG_C = /* svg */ `
<svg viewBox="0 0 9 10" xmlns="http://www.w3.org/2000/svg"
     shape-rendering="crispEdges" aria-hidden="true">
  <!-- toes — slightly off-center -->
  <rect x="3" y="0" width="1" height="3" fill="${FP_COLOR}"/>
  <rect x="1" y="3" width="1" height="2" fill="${FP_COLOR}"/>
  <rect x="6" y="2" width="1" height="3" fill="${FP_COLOR}"/>
  <!-- heel pad — drawn slightly thicker -->
  <rect x="3" y="5" width="3" height="3" fill="${FP_COLOR}"/>
  <rect x="2" y="6" width="5" height="2" fill="${FP_COLOR}"/>
  <!-- mud splatter — trailing smear behind -->
  <rect x="4" y="2" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="2" y="4" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="5" y="4" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="3" y="9" width="3" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="1" y="7" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
  <rect x="7" y="7" width="1" height="1" fill="${FP_COLOR_SOFT}"/>
</svg>`;

export const FOOTPRINT_VARIANTS = [FOOTPRINT_SVG_A, FOOTPRINT_SVG_B, FOOTPRINT_SVG_C];

// Back-compat — some old code paths still import the singular name.
export const FOOTPRINT_SVG = FOOTPRINT_SVG_A;
