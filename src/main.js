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

/** Click-to-dismiss for the v0.1 sticky note (shows on every reload). */
function mountStickyNote() {
  const note = document.getElementById('sticky-note');
  if (!note) return;
  note.addEventListener('click', () => {
    note.classList.add('is-dismissing');
    // Remove from DOM after the exit animation completes so it doesn't
    // capture clicks invisibly. Matches the 0.9s sticky-exit duration.
    setTimeout(() => note.remove(), 920);
  });
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
