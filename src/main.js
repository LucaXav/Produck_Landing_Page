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

/** Click-to-dismiss for the v0.1 sticky note. The sticky drops off the
 *  bottom, gets removed from the DOM, then ~10s later a fresh copy is
 *  re-inserted with an .is-respawning class that plays a small drop-in
 *  animation. The click handler is reattached to each fresh element so
 *  the cycle can repeat for as long as the user keeps dismissing it. */
const STICKY_RESPAWN_MS  = 10000;
const STICKY_DISMISS_MS  = 920;
const STICKY_TEMPLATE = `<button class="sticky-note is-respawning" id="sticky-note" type="button" aria-label="Dismiss version note"><img src="/sticky-v01.png" alt="v0.1 — hatching" /></button>`;

function mountStickyNote() {
  attachStickyHandler();
}

function attachStickyHandler() {
  const note = document.getElementById('sticky-note');
  if (!note) return;
  note.addEventListener('click', () => {
    // Strip is-respawning so the dismiss animation never has to outcompete
    // it in the cascade — only one state class on the element at a time.
    note.classList.remove('is-respawning');
    note.classList.add('is-dismissing');
    const parent = note.parentElement;

    setTimeout(() => {
      note.remove();
      setTimeout(() => {
        parent.insertAdjacentHTML('beforeend', STICKY_TEMPLATE);
        attachStickyHandler();
      }, STICKY_RESPAWN_MS - STICKY_DISMISS_MS);
    }, STICKY_DISMISS_MS);
  }, { once: true });
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
