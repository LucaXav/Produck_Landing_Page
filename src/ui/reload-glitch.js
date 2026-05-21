/**
 * reload-glitch — manages the page-wide CRT overlay during the reload burst.
 *
 * Each tab (.dialog / .feedback-log / .sticky-note) owns its own explode-in
 * keyframe + shockwave in components.css and starts animating on first paint
 * — no JS needed to drive the entrances. This module only owns the
 * `html.is-reloading` class lifecycle, which gates the page-wide CRT
 * scanline overlay + tiny vertical-sync jitter.
 *
 * Total burst is ~1.05s (longest tab is sticky-note at 0.22s delay + 0.72s
 * duration = 0.94s, plus its shockwave running to 0.93s). We give an extra
 * beat then drop the class so the overlay fades out cleanly.
 *
 * prefers-reduced-motion: drop the class immediately — components.css
 * already nulls every reload animation in that mode.
 */

// Longest tab (sticky-note) finishes at 0.34s delay + 0.78s anim = 1.12s.
// Give an extra beat so the class is gone before any post-burst styles tick.
const BURST_TOTAL_MS = 1180;

export function mountReloadGlitch() {
  const root = document.documentElement;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('is-reloading');
    return;
  }

  setTimeout(() => root.classList.remove('is-reloading'), BURST_TOTAL_MS);
}
