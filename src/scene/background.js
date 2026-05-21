/**
 * PostHog-style clean desktop background.
 *   - Solid warm cream (#EEEFE9) — matches PostHog's actual --bg
 *   - Faint dot grid overlay (24px spacing, ~0.05 opacity) for OS-desktop texture
 *   - No props, no characters — the duck and headline carry the page
 *
 * If you want the texture even quieter, drop opacity in the radial-gradient
 * below. If you want it gone entirely, set `pattern: ''` and the element
 * collapses to a solid-color fill.
 */

const PATTERN_CSS = `
  position: absolute;
  inset: 0;
  background-color: #EEEFE9;
  background-image: radial-gradient(circle, rgba(15,15,15,0.06) 1px, transparent 1.6px);
  background-size: 24px 24px;
  background-position: 0 0;
`;

export function mountScene() {
  const scene = document.getElementById('scene');
  if (!scene) return;
  // Use a div, not SVG — the dot grid is a CSS gradient which the browser
  // renders far cheaper than 100s of inline <circle> elements.
  const layer = document.createElement('div');
  layer.style.cssText = PATTERN_CSS;
  scene.replaceChildren(layer);
}
