import { DUCK } from '../config.js';
import { DUCK_SVG } from './duck-sprite.js';
import { FootprintTrail } from './footprints.js';

/**
 * Duck state machine
 *   waddling → roams between random viewport waypoints, leaves footprints
 *   hunting  → mouse entered proximity radius; duck chases cursor faster
 *   grabbed  → duck has the cursor; emits 'grabbed' event so whiteboard activates
 *
 * Caller wires:
 *   - on('stateChange', (state) => …)
 *   - on('positionChange', ({ x, y, angle }) => …)
 *   - release()       — externally force back to waddling
 *
 * Coordinates are viewport pixels (CSS pixels).
 */
export class Duck {
  constructor({ host, footprintHost, onState, onPosition, onFootprintCount }) {
    this.host = host;
    this.host.innerHTML = DUCK_SVG;
    this.trail = new FootprintTrail(footprintHost, onFootprintCount);

    this.onState    = onState    || (() => {});
    this.onPosition = onPosition || (() => {});

    // Position and motion
    this.x = window.innerWidth  * 0.20;
    this.y = window.innerHeight * 0.55;
    this.vx = 0; this.vy = 0;
    this.facing = 1;            // 1 = right, -1 = left
    this.state = null;          // null so _setState fires the initial event
    this.target = this._pickWaypoint();
    this.waypointPauseUntil = 0;

    // Walk-cycle phase, advanced by distance traveled (not time).
    // 0 → 1 cycles every DUCK.stridePixels of travel.
    this.walkPhase = 0;
    this._prevPhase = 0;

    // Cached references to the inner SVG groups we transform each frame.
    // (Set after the SVG is injected, just below.)
    this.legFrontEl = null;
    this.legBackEl  = null;
    this.bodyEl     = null;

    // Mouse tracking
    this.mouse = { x: -9999, y: -9999, present: false, safe: false };
    // Velocity sample ring buffer for shake-to-release detection.
    // Keeps the last ~500ms of {x, y, t} so we can score direction reversals.
    this._mouseSamples = [];
    // Cooldown after release-by-shake — duck ignores proximity until past this stamp
    this._huntCooldownUntil = 0;
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.present = true;
      const now = performance.now();
      this._mouseSamples.push({ x: e.clientX, y: e.clientY, t: now });
      // Prune samples older than 500ms — short window so a quick shake registers
      while (this._mouseSamples.length && now - this._mouseSamples[0].t > 500) {
        this._mouseSamples.shift();
      }
    });

    // Cursor-left-the-viewport detection. mouseleave on `window` alone is
    // unreliable across browsers — in particular, when the cursor moves to a
    // different monitor it often won't fire there, so the duck would keep
    // chasing the last-known edge position. Combine multiple signals:
    //   - mouseout on document with no relatedTarget → cursor left the page
    //   - window blur                                → focus left the window
    //   - visibilitychange to hidden                 → tab switched away
    const markAbsent = () => {
      this.mouse.present = false;
      // If we were mid-chase, drop back to waddling immediately so the duck
      // doesn't keep accelerating toward the edge.
      if (this.state === 'hunting') this._setState('waddling');
    };
    document.addEventListener('mouseleave', markAbsent);
    document.addEventListener('mouseout', (e) => {
      // relatedTarget=null means the cursor left the document, not just
      // moved between two elements inside it.
      if (!e.relatedTarget) markAbsent();
    });
    window.addEventListener('blur', markAbsent);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) markAbsent();
    });

    // Safe zones — duck stops chasing while the cursor is over these so the
    // user can type, click, etc. without the duck getting in the way.
    ['.dialog', '[data-duck-safe]'].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.addEventListener('mouseenter', () => { this.mouse.safe = true; });
        el.addEventListener('mouseleave', () => { this.mouse.safe = false; });
      });
    });

    // Click on duck → instant grab (lets user trigger drawing without waiting)
    this.host.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.state !== 'grabbed') this._setState('grabbed');
    });

    // Grab inner SVG groups now that they're in the DOM
    this.legFrontEl = this.host.querySelector('.duck-leg-front');
    this.legBackEl  = this.host.querySelector('.duck-leg-back');
    this.bodyEl     = this.host.querySelector('.duck-body');
    // Single walk-cycle video. Playback rate scales with state so the visible
    // leg cadence roughly matches the movement speed on screen, and we pause
    // it entirely on grab so the duck holds still while you draw.
    this.videoEl = this.host.querySelector('.duck-video');

    // Loop
    this.lastT = performance.now();
    this._raf = requestAnimationFrame(this._tick.bind(this));

    // Initial render
    this._applyTransform();
    this._applyWalkPose();
    this._setState('waddling');
  }

  /**
   * Force duck back to waddling (called by whiteboard release / Escape).
   * Imposes a hunt-cooldown so the duck doesn't immediately re-chase the
   * cursor — gives the user time to move their mouse out of range.
   */
  release(cooldownMs = 2500) {
    if (this.state !== 'grabbed') return;
    this._huntCooldownUntil = performance.now() + cooldownMs;
    // Bounce the duck away from the cursor so it isn't sitting on the mouse
    // when waddling resumes.
    const dx = this.x - this.mouse.x;
    const dy = this.y - this.mouse.y;
    const d  = Math.hypot(dx, dy) || 1;
    const bumpDist = 180;
    this.x = this.mouse.x + (dx / d) * bumpDist;
    this.y = this.mouse.y + (dy / d) * bumpDist;
    // Clamp to viewport so it doesn't fly off-screen
    const m = 40;
    this.x = Math.max(m, Math.min(window.innerWidth  - m, this.x));
    this.y = Math.max(m, Math.min(window.innerHeight - m, this.y));
    this._mouseSamples.length = 0;
    this._setState('waddling');
  }

  /** Move duck immediately to position (no animation). */
  teleport(x, y) {
    this.x = x; this.y = y;
    this._applyTransform();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
  }

  // ───────────────────────── internals ─────────────────────────

  _setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.host.classList.remove('state-waddling', 'state-hunting', 'state-grabbed');
    this.host.classList.add(`state-${s}`);
    // Toggle the global cursor-hide on the html root — duck.css uses this to
    // suppress the OS pointer everywhere while the duck IS the cursor.
    document.documentElement.classList.toggle('duck-grabbed', s === 'grabbed');
    // Drive the single walk-cycle video off the new state:
    //   - waddling: 1.0x normal playback (matches the natural waddle speed)
    //   - hunting:  2.4x — duck is sprinting after the cursor
    //   - grabbed:  PAUSED — the duck is holding the mouse, so it shouldn't
    //               appear to be walking. We pause(); on release one of the
    //               other branches calls play() again.
    if (this.videoEl) {
      if (s === 'grabbed') {
        try { this.videoEl.pause(); } catch {}
      } else {
        this.videoEl.playbackRate = (s === 'hunting') ? 2.4 : 1.0;
        try { this.videoEl.play(); } catch {}
      }
    }
    this.onState(s);
  }

  _pickWaypoint() {
    const { edgeMargin, avoidZones, avoidPadding } = DUCK;
    // On mobile the dialog spans nearly the full viewport width — if we
    // honored the avoid list the duck would have no viable random waypoints
    // and would stall against an edge or oscillate at a corner. Treat the
    // whole viewport as walkable on narrow screens; the duck is decorative
    // there anyway.
    const isMobile = window.innerWidth <= 720;
    const avoidSelectors = isMobile ? [] : DUCK.avoidSelectors;
    const W = window.innerWidth, H = window.innerHeight;

    // Collect live bounding rects for hero content so duck never lands on
    // OR walks through it.
    const liveRects = [];
    for (const sel of avoidSelectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          liveRects.push({
            left:   r.left   - avoidPadding,
            right:  r.right  + avoidPadding,
            top:    r.top    - avoidPadding,
            bottom: r.bottom + avoidPadding,
          });
        }
      });
    }

    // Safety: if the duck is currently *inside* an avoid region (page just
    // loaded or window resized), evacuate to the nearest safe corner first
    // so subsequent path-clear checks have a chance.
    if (this._pointInAnyRect(this.x, this.y, liveRects, W, H, avoidZones)) {
      const corner = this._nearestSafeCorner(this.x, this.y, W, H);
      this.x = corner.x; this.y = corner.y;
    }

    // Try up to 30 candidates: must land in a safe spot AND the straight-line
    // path from the duck's current position must not cross any live rect.
    for (let i = 0; i < 30; i++) {
      const x = edgeMargin + Math.random() * (W - 2 * edgeMargin);
      const y = edgeMargin + Math.random() * (H - 2 * edgeMargin);
      if (this._pointInAnyRect(x, y, liveRects, W, H, avoidZones)) continue;
      if (!this._pathClear(this.x, this.y, x, y, liveRects)) continue;
      return { x, y };
    }
    // Fallback: a safe corner FAR from where the duck already is. Picking the
    // nearest corner means a duck that's already in a corner returns its own
    // position, which would freeze it there — pick the farthest instead so we
    // always have somewhere meaningful to walk to.
    return this._farthestSafeCorner(this.x, this.y, W, H);
  }

  /** Is (x, y) inside any static viewport-zone or live element rect? */
  _pointInAnyRect(x, y, liveRects, W, H, avoidZones) {
    const inStaticZone = avoidZones.some(z =>
      x >= z.left * W && x <= z.right * W &&
      y >= z.top * H  && y <= z.bottom * H);
    if (inStaticZone) return true;
    return liveRects.some(r =>
      x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  }

  /** Sample-based line-rect intersection: 16 points along the segment. */
  _pathClear(x1, y1, x2, y2, liveRects) {
    const samples = 16;
    for (let i = 1; i < samples; i++) {
      const t = i / samples;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      for (const r of liveRects) {
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          return false;
        }
      }
    }
    return true;
  }

  /** Closest of the four corners (with edge margin) to (x, y). Used by the
   *  evacuate-from-avoid-zone path where we want to bail out fast. */
  _nearestSafeCorner(x, y, W, H) {
    return this._pickCornerExtreme(x, y, W, H, /* farthest */ false);
  }

  /** Farthest of the four corners — used as the waypoint fallback so the duck
   *  always has a meaningfully distant target and never stalls in place. */
  _farthestSafeCorner(x, y, W, H) {
    return this._pickCornerExtreme(x, y, W, H, /* farthest */ true);
  }

  _pickCornerExtreme(x, y, W, H, farthest) {
    const m = 90;
    const corners = [
      { x: m,     y: m     },
      { x: W - m, y: m     },
      { x: m,     y: H - m },
      { x: W - m, y: H - m },
    ];
    let best = corners[0], bestD = farthest ? -Infinity : Infinity;
    for (const c of corners) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (farthest ? d > bestD : d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  _tick(now) {
    const dt = Math.min(0.05, (now - this.lastT) / 1000); // clamp at 50ms to survive tab-throttling
    this.lastT = now;

    switch (this.state) {
      case 'waddling': this._tickWaddle(dt, now); break;
      case 'hunting':  this._tickHunt(dt);        break;
      case 'grabbed':  this._tickGrabbed();       break;
    }

    this._applyTransform();
    this.onPosition({ x: this.x, y: this.y, angle: Math.atan2(this.vy, this.vx) });
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  _tickWaddle(dt, now) {
    // Check mouse proximity — switch to hunt if user is around.
    // Skip while in post-release cooldown so a shake actually shakes us off.
    // Skip while cursor is over a safe zone (email form, etc.) so the user can type.
    // Skip entirely on mobile — touch-as-mouse events can fire spurious
    // "mousemove"s and the duck is purely decorative on small screens. We
    // never want it sprinting at a tap.
    const isMobile = window.innerWidth <= 720;
    if (!isMobile && this.mouse.present && !this.mouse.safe && now > this._huntCooldownUntil) {
      const dx = this.mouse.x - this.x;
      const dy = this.mouse.y - this.y;
      const d  = Math.hypot(dx, dy);
      if (d < DUCK.proximityRadius) {
        this._setState('hunting');
        return;
      }
    }

    // Pick a new target as soon as we arrive — no idle pause. The duck should
    // be perpetually waddling somewhere, never frozen on a spot. If the
    // waypoint picker degenerately returned the current position (all 30
    // candidates were blocked + fallback corner == here), reject it and try
    // again so we don't loop arriving-at-current-position.
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d  = Math.hypot(dx, dy);

    if (d < 8) {
      let tries = 0;
      do {
        this.target = this._pickWaypoint();
        tries++;
      } while (Math.hypot(this.target.x - this.x, this.target.y - this.y) < 60 && tries < 6);
      return;
    }

    const speed = DUCK.waddleSpeed;
    this.vx = (dx / d) * speed;
    this.vy = (dy / d) * speed;
    this._step(dt);
  }

  _tickHunt(dt) {
    // If mouse left, or entered a safe zone → return to waddling
    if (!this.mouse.present || this.mouse.safe) { this._setState('waddling'); return; }

    const dx = this.mouse.x - this.x;
    const dy = this.mouse.y - this.y;
    const d  = Math.hypot(dx, dy);

    // Grab when close enough
    if (d < DUCK.grabRadius) {
      this._setState('grabbed');
      return;
    }

    // Otherwise pursue
    const speed = DUCK.huntSpeed;
    this.vx = (dx / d) * speed;
    this.vy = (dy / d) * speed;
    this._step(dt);
  }

  _tickGrabbed() {
    // Cursor entered a safe zone (email form, etc.) → let go so the user can type.
    if (this.mouse.safe) { this._setState('waddling'); return; }

    // Snap to cursor with a small follow offset (so cursor pokes out from
    // duck's beak — duck is "eating" the mouse). NOTE: footprints are
    // intentionally NOT dropped while grabbed — the duck is being held,
    // not walking, so it shouldn't leave muddy tracks while you drag it
    // around to draw.
    this.x = this.mouse.x - 28;
    this.y = this.mouse.y - 14;
    this.vx = this.vy = 0;

    // Shake-to-release: count rapid direction reversals in the recent buffer.
    if (this._detectShake()) {
      // Bounce the duck a bit away from the cursor and lock it out of hunt mode
      const angle = Math.random() * Math.PI * 2;
      this.x = this.mouse.x + Math.cos(angle) * 260;
      this.y = this.mouse.y + Math.sin(angle) * 200;
      // Clamp to viewport so it doesn't fly off-screen
      const m = 40;
      this.x = Math.max(m, Math.min(window.innerWidth  - m, this.x));
      this.y = Math.max(m, Math.min(window.innerHeight - m, this.y));
      this._mouseSamples.length = 0;
      this._huntCooldownUntil = performance.now() + 1500;
      this._setState('waddling');
    }
  }

  /**
   * Shake detection: scan the velocity buffer for direction reversals.
   * A "shake" = ≥5 reversals within 500ms with total travel > 800px and
   * each leg moving at least ~28px (filters out drawing-quality wiggles).
   * Returns true on detection.
   */
  _detectShake() {
    const s = this._mouseSamples;
    if (s.length < 6) return false;
    let reversals = 0;
    let totalDist = 0;
    for (let i = 2; i < s.length; i++) {
      const v1x = s[i - 1].x - s[i - 2].x;
      const v1y = s[i - 1].y - s[i - 2].y;
      const v2x = s[i].x     - s[i - 1].x;
      const v2y = s[i].y     - s[i - 1].y;
      const m1 = Math.hypot(v1x, v1y);
      const m2 = Math.hypot(v2x, v2y);
      totalDist += m2;
      // Only count direction flips that span real distance, not jitter
      if (m1 > 28 && m2 > 28 && (v1x * v2x + v1y * v2y) < 0) reversals++;
    }
    return reversals >= 5 && totalDist > 800;
  }

  _step(dt) {
    const prevX = this.x, prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp to viewport
    const m = 20;
    this.x = Math.max(m, Math.min(window.innerWidth  - m, this.x));
    this.y = Math.max(m, Math.min(window.innerHeight - m, this.y));

    // Face the right direction
    if (Math.abs(this.vx) > 1) this.facing = this.vx > 0 ? 1 : -1;

    // ============== DISTANCE-DRIVEN WALK PHASE ==============
    // Advance walkPhase proportionally to how far the duck just moved.
    // Slow movement → slow legs. Standing still → frozen legs.
    const traveled = Math.hypot(this.x - prevX, this.y - prevY);
    if (traveled > 0.05) {
      this._prevPhase = this.walkPhase;
      this.walkPhase = (this.walkPhase + traveled / DUCK.stridePixels) % 1;
      this._applyWalkPose();
      this._maybeDropFootprints();
    }
  }

  /** Set leg rotation + body bob to match current walkPhase. */
  _applyWalkPose() {
    if (!this.legFrontEl) return;
    const TAU = Math.PI * 2;
    // Legs swing in opposite phase
    const a = Math.sin(this.walkPhase * TAU) * DUCK.legSwingDeg;
    this.legFrontEl.style.transform = `rotate(${a.toFixed(2)}deg)`;
    this.legBackEl.style.transform  = `rotate(${(-a).toFixed(2)}deg)`;
    // Body bobs up when either foot is fully planted (every half-cycle)
    const bob = Math.abs(Math.sin(this.walkPhase * Math.PI * 2)) * DUCK.bodyBobPx;
    this.bodyEl.style.transform = `translateY(${(-bob).toFixed(2)}px)`;
  }

  /**
   * Drop a footprint under whichever foot just planted this frame.
   * Plant moments are when walkPhase crosses plantPhaseBack or plantPhaseFront.
   *
   * Footprint angle: the SVG has toes pointing UP by default. We rotate
   * so they point in the direction of travel —
   *   atan2(vy, vx) → 0° east, 90° south, 180° west, -90° north
   *   add 90° because "up in the SVG" is north and we want "up" to map to
   *   travel direction.
   */
  _maybeDropFootprints() {
    const { plantPhaseBack, plantPhaseFront, footOffset } = DUCK;
    const angleDeg = Math.atan2(this.vy, this.vx) * 180 / Math.PI + 90;
    if (this._phaseCrossed(plantPhaseFront)) {
      this.trail.add(
        this.x + footOffset.front.x * this.facing,
        this.y + footOffset.front.y,
        angleDeg
      );
    }
    if (this._phaseCrossed(plantPhaseBack)) {
      this.trail.add(
        this.x + footOffset.back.x * this.facing,
        this.y + footOffset.back.y,
        angleDeg
      );
    }
  }

  /** Did walkPhase pass `threshold` between previous and current frame? */
  _phaseCrossed(threshold) {
    const a = this._prevPhase, b = this.walkPhase;
    if (a <= b) return a < threshold && b >= threshold;     // normal advance
    return a < threshold || b >= threshold;                  // wrapped through 1→0
  }

  _applyTransform() {
    const fx = this.facing === 1 ? 1 : -1;
    this.host.style.transform =
      `translate(${this.x}px, ${this.y}px) translate(-50%, -50%) scaleX(${fx})`;
  }
}
