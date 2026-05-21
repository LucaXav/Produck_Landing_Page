import { WHITEBOARD } from '../config.js';

/**
 * Transparent canvas that becomes draw-able when the duck grabs the cursor.
 *
 * - When idle: pointer-events: none (everything underneath works normally).
 * - When active: captures pointer, paints strokes following the cursor.
 * - Mousedown begins a stroke, mousemove extends, mouseup ends.
 * - ESC or "Release the duck" button: deactivates and releases duck back to waddling.
 */
export class Whiteboard {
  constructor({ canvas, releaseBtn, clearBtn, hintEl, onRelease }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.releaseBtn = releaseBtn;
    this.clearBtn = clearBtn;
    this.hintEl = hintEl;
    this.onRelease = onRelease || (() => {});

    this.active = false;
    this.drawing = false;
    this.lastPt = null;

    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Pointer (works for both mouse and touch)
    canvas.addEventListener('pointerdown', this._onDown.bind(this));
    canvas.addEventListener('pointermove', this._onMove.bind(this));
    canvas.addEventListener('pointerup',   this._onUp.bind(this));
    canvas.addEventListener('pointercancel', this._onUp.bind(this));

    // Global ESC to release
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.active) this.deactivate();
    });

    this.releaseBtn.addEventListener('click', () => this.deactivate());
    this.clearBtn.addEventListener('click',   () => this.clear());
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.canvas.classList.add('active');
    this.releaseBtn.hidden = false;
    this.clearBtn.hidden = false;
    this._showHint(true);
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;
    this.canvas.classList.remove('active');
    this.releaseBtn.hidden = true;
    this._showHint(false);
    this.drawing = false;
    this.lastPt = null;
    this.onRelease();
    // Leave clear button visible if there are any strokes on canvas
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.active) this.clearBtn.hidden = true;
  }

  _showHint(show) {
    if (!this.hintEl) return;
    this.hintEl.classList.toggle('visible', show);
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    // Preserve existing drawing across resize by snapshotting + redrawing
    const prev = this.canvas.toDataURL();
    this.canvas.width  = Math.floor(window.innerWidth  * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width  = window.innerWidth  + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const img = new Image();
    img.onload = () => this.ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
    img.src = prev;
  }

  _onDown(e) {
    if (!this.active) return;
    // Forward clicks that land on topnav controls so the user can still hit
    // "Release the duck" / "Clear drawing" while the canvas is intercepting
    // pointer events. Hit-test through the canvas using elementsFromPoint.
    if (this._forwardClickIfControl(e)) return;
    this.drawing = true;
    this.lastPt = { x: e.clientX, y: e.clientY };
  }

  _forwardClickIfControl(e) {
    // Temporarily disable pointer events on the canvas so elementsFromPoint
    // sees what's underneath it, then restore.
    const prevPe = this.canvas.style.pointerEvents;
    this.canvas.style.pointerEvents = 'none';
    const stack = document.elementsFromPoint(e.clientX, e.clientY);
    this.canvas.style.pointerEvents = prevPe;
    for (const el of stack) {
      const ctrl = el.closest && el.closest('button, a, [role="button"]');
      if (ctrl && !ctrl.hidden && !ctrl.disabled) {
        e.preventDefault();
        ctrl.click();
        return true;
      }
    }
    return false;
  }

  _onMove(e) {
    if (!this.active) return;
    // Show pointer cursor over clickable controls; crosshair everywhere else.
    this._updateCursor(e);
    if (!this.drawing) return;
    const x = e.clientX, y = e.clientY;
    this.ctx.strokeStyle = WHITEBOARD.strokeColor;
    this.ctx.lineWidth   = WHITEBOARD.strokeWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastPt.x, this.lastPt.y);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastPt = { x, y };
    this.clearBtn.hidden = false;
  }

  _updateCursor(e) {
    const prevPe = this.canvas.style.pointerEvents;
    this.canvas.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    this.canvas.style.pointerEvents = prevPe;
    const overControl = el && el.closest && el.closest('button, a, [role="button"]');
    this.canvas.style.cursor = overControl ? 'pointer' : 'crosshair';
  }

  _onUp() {
    this.drawing = false;
    this.lastPt = null;
  }
}
