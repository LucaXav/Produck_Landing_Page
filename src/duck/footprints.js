import { FOOTPRINTS } from '../config.js';
import { FOOTPRINT_VARIANTS } from './duck-sprite.js';

/**
 * Footprint trail system.
 * - Maintains at most FOOTPRINTS.maxAlive prints on screen at once.
 * - When a new print would push us over the cap, the oldest is removed.
 * - Each print fades in age order so the trail visibly dissipates.
 */
export class FootprintTrail {
  constructor(host, onChange) {
    this.host = host;
    this.onChange = onChange || (() => {});
    this.prints = []; // [{ el, born }]
    this.stepCount = 0; // total ever
  }

  add(x, y, angleDeg, sizeScale = 1) {
    const el = document.createElement('div');
    el.className = 'footprint';
    // Pick a random variant + small size/rotation jitter so the trail looks
    // like organic dirty steps, not identical clones. sizeScale tracks the
    // duck's --ui-scale so prints grow with the duck on large monitors.
    const variant = FOOTPRINT_VARIANTS[Math.floor(Math.random() * FOOTPRINT_VARIANTS.length)];
    const jitterScale = (0.9 + Math.random() * 0.25) * sizeScale;   // 0.9–1.15× × scale
    const jitterAngle = (Math.random() - 0.5) * 14;   // ±7°
    el.innerHTML = variant;
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    el.style.transform = `translate(-50%, -50%) rotate(${angleDeg + jitterAngle}deg) scale(${jitterScale})`;
    // Start invisible — fades in via CSS transition for the "slowly comes out
    // from under the duck" look.
    el.style.opacity = '0';
    el.style.transition = 'opacity 280ms ease-out';
    this.host.appendChild(el);

    const print = { el, born: performance.now() };
    this.prints.push(print);
    this.stepCount += 1;

    // Cap reached → fade out and remove oldest
    if (this.prints.length > FOOTPRINTS.maxAlive) {
      const oldest = this.prints.shift();
      this._fadeAndRemove(oldest);
    }

    // Wait one frame so the browser registers opacity:0 before transitioning
    // to the target value — otherwise the fade-in won't run.
    requestAnimationFrame(() => this._refreshOpacities());
    this.onChange(this.prints.length);
  }

  _refreshOpacities() {
    // Newest = full opacity, fade across the trail.
    const n = this.prints.length;
    this.prints.forEach((p, i) => {
      // i=0 oldest, i=n-1 newest
      const t = (i + 1) / n;
      // Range: oldest at 0.35, newest at 1.0
      p.el.style.opacity = (0.35 + 0.65 * t).toFixed(3);
    });
  }

  _fadeAndRemove(print) {
    print.el.style.transition = `opacity ${FOOTPRINTS.fadeMs}ms ease-out`;
    // Force reflow so the transition applies
    void print.el.offsetWidth;
    print.el.style.opacity = '0';
    setTimeout(() => print.el.remove(), FOOTPRINTS.fadeMs);
  }

  clearAll() {
    this.prints.forEach(p => this._fadeAndRemove(p));
    this.prints = [];
    this.onChange(0);
  }

  count() { return this.prints.length; }
}
