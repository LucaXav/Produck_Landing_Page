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

// Burst budget: boot screen plays 0–1.30s, then its 80s-arcade CRT shutdown
// runs 1.30–2.25s (pre-flicker → invert → vertical collapse → glowing slit
// → pixel dot → poof). Dialog/feedback/sticky glitches still run with +0.9s
// delays so they finish at 1.62 / 1.82 / 2.02s — settled by the time the
// boot screen reaches its slit phase. Extra 150ms beat after the latest
// finisher (boot at 2.25s) before the class drops.
const BURST_TOTAL_MS = 2400;

export function mountReloadGlitch() {
  const root = document.documentElement;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('is-reloading');
    return;
  }

  setTimeout(() => root.classList.remove('is-reloading'), BURST_TOTAL_MS);
}
