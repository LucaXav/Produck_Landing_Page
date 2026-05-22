// ============== PRODUCK · ENTRY POINT ==============
// Wires up scene → header → email form → duck → whiteboard.
// Each module is self-contained; main.js is the orchestration layer.

import { Duck } from './duck/duck.js';
import { Whiteboard } from './ui/whiteboard.js';
import { mountEmailForm } from './ui/email.js';
import { mountScene } from './scene/background.js';
import { mountDialogDrag } from './ui/dialog-drag.js';
import { mountFeedbackLog } from './ui/feedback-log.js';
import { mountReloadGlitch } from './ui/reload-glitch.js';

// 0. Reload glitch — on every page load the dialog (and feedback.log tab)
//    appear in a classic-Mac "system error" state, then reboot into the real
//    Produck content with a chunky stepped reveal. Respects prefers-reduced-
//    motion. See src/ui/reload-glitch.js for the choreography.
mountReloadGlitch();

// 1. Static layers
mountScene();
mountEmailForm();
mountDialogDrag();
mountStickyNote();
mountFeedbackLog();

/** Click-to-dismiss for the v0.1 sticky note (shows on every reload).
 *  After it drops, a hatching easter egg plays — see spawnHatch() below. */
function mountStickyNote() {
  const note = document.getElementById('sticky-note');
  if (!note) return;
  note.addEventListener('click', () => {
    note.classList.add('is-dismissing');
    // Remove from DOM after the exit animation completes so it doesn't
    // capture clicks invisibly. Matches the 0.9s sticky-exit duration.
    setTimeout(() => {
      note.remove();
      spawnHatch();
    }, 920);
  }, { once: true });
}

/** Hatching easter egg.
 *  The "v0.1 — hatching" sticky was hiding an actual egg the whole time.
 *  Once the sticky drops, the egg is revealed: drops in, wobbles, cracks,
 *  the shell halves fall away, and a tiny pixel duckling waddles off the
 *  left edge of the viewport. Pure CSS-driven — see .hatch styles in
 *  components.css. */
function spawnHatch() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const hatch = document.createElement('div');
  hatch.className = 'hatch';
  hatch.setAttribute('aria-hidden', 'true');
  hatch.innerHTML = `
    <svg class="hatch-egg" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="44" rx="22" ry="30" fill="#FFFDF6" stroke="#0E0E0E" stroke-width="2.5"/>
      <ellipse cx="24" cy="34" rx="4" ry="6" fill="#FFE5A8" opacity="0.85"/>
    </svg>
    <svg class="hatch-crack" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
      <polyline points="14,40 22,34 18,42 26,38 22,46 30,42 26,50 34,46 30,54"
                fill="none" stroke="#0E0E0E" stroke-width="2" stroke-linejoin="miter" stroke-linecap="butt"/>
    </svg>
    <svg class="hatch-half hatch-half--left" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M32,14 A22,30 0 0 0 10,44 L32,44 Z"
            fill="#FFFDF6" stroke="#0E0E0E" stroke-width="2.5" stroke-linejoin="miter"/>
    </svg>
    <svg class="hatch-half hatch-half--right" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M32,14 A22,30 0 0 1 54,44 L32,44 Z"
            fill="#FFFDF6" stroke="#0E0E0E" stroke-width="2.5" stroke-linejoin="miter"/>
    </svg>
    <svg class="hatch-duckling" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <!-- body -->
      <rect x="16" y="40" width="32" height="22" fill="#FFE066"/>
      <rect x="14" y="44" width="2"  height="14" fill="#FFE066"/>
      <rect x="48" y="44" width="2"  height="14" fill="#FFE066"/>
      <!-- head -->
      <rect x="22" y="24" width="20" height="18" fill="#FFE066"/>
      <rect x="20" y="28" width="2"  height="12" fill="#FFE066"/>
      <!-- beak (faces left, toward the waddle direction) -->
      <rect x="14" y="30" width="8" height="6" fill="#FF7A1A"/>
      <rect x="14" y="33" width="8" height="2" fill="#E85D00"/>
      <!-- eye -->
      <rect x="28" y="28" width="3" height="3" fill="#0E0E0E"/>
      <!-- feet -->
      <rect x="20" y="62" width="5" height="3" fill="#FF7A1A"/>
      <rect x="34" y="62" width="5" height="3" fill="#FF7A1A"/>
    </svg>
  `;
  document.body.appendChild(hatch);

  // All animations are CSS-driven; the duckling's waddle finishes at 3.60s.
  // Give a small buffer then yank the element out of the DOM.
  setTimeout(() => hatch.remove(), 3800);
}

// 1.5. Any "focus the email input" affordance — top-nav links, CTA, desktop icons.
const emailInput = document.getElementById('email-input');
document.querySelectorAll('[data-action="focus-email"]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    emailInput?.focus({ preventScroll: true });
    emailInput?.select?.();
  });
});

// 2. Hint banner that surfaces when the duck has the cursor
const hintEl = document.createElement('div');
hintEl.className = 'draw-hint';
hintEl.innerHTML = `Draw on the page · <kbd>ESC</kbd> to release the duck`;
document.body.appendChild(hintEl);

// 3. Whiteboard
const whiteboard = new Whiteboard({
  canvas:     document.getElementById('whiteboard'),
  releaseBtn: document.getElementById('release-duck-btn'),
  clearBtn:   document.getElementById('clear-canvas-btn'),
  hintEl,
  onRelease() { duck.release(); },
});

// 4. Duck
const duck = new Duck({
  host:          document.getElementById('duck'),
  footprintHost: document.getElementById('footprints'),
  onState(state) {
    if (state === 'grabbed') whiteboard.activate();
    if (state === 'waddling' || state === 'hunting') {
      if (whiteboard.active) whiteboard.deactivate();
    }
  },
});

// 5. Expose for console debugging — handy during the build
window.__produck = { duck, whiteboard };
console.log('%c🦆 Produck loaded.', 'color:#ff7a1a;font-weight:600');
