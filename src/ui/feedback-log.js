/**
 * feedback.log — auto-cycling chat-log-style feed pinned to the right of the
 * landing page. New quotes fade in at the bottom; the oldest fades out at the
 * top via a mask gradient on the container. Click the red light to close —
 * plays a CRT-style shutdown animation and removes the tab from the DOM.
 */

// Each entry pairs a plausible handle with a concrete bit of Produck usage —
// real platform/stack references (webhooks, RLS, migrations, rate limits, A/B
// flags, Sentry, etc.) so the log reads like actual teams using the product
// rather than generic praise.
const ENTRIES = [
  { name: 'maya@finchpay',   msg: 'duck caught a race in our /checkout webhook before deploy' },
  { name: 'bens@notionwave', msg: 'flagged a missing idempotency key on Stripe retries' },
  { name: '@ravenui_team',   msg: 'found 3 a11y misses before our Series A demo' },
  { name: 'jordan@triallm',  msg: 'reviewed the auth refactor. zero PR rounds.' },
  { name: '@stitch_io',      msg: 'saved us from a bad migration on the customers table' },
  { name: 'priya@hexlogs',   msg: 'first prod push this quarter with no Sentry alerts' },
  { name: '@velvetcrm',      msg: 'caught a typo in the unsubscribe webhook. phew.' },
  { name: 'tom@orbit-dev',   msg: 'called out our missing rate limit on /login' },
  { name: '@arclabs',        msg: 'Slack integration shipped tuesday. completely silent.' },
  { name: 'soren@klipd',     msg: 'we run it on every staging diff now' },
  { name: '@minorbit',       msg: 'duck > our QA contractor, and ¼ the cost' },
  { name: 'carlos@lumenbrk', msg: '10 PR reviews in. zero rollbacks since.' },
  { name: '@nestbuilder',    msg: 'spotted a bad Supabase RLS policy at 11pm sunday' },
  { name: '@grovestack',     msg: 'demoed to investors live — nothing crashed. miracle.' },
  { name: 'liam@portavault', msg: 'flagged a leaky env var in our Vercel config' },
  { name: '@ember.dev',      msg: 'duck reads our schema diffs better than our DBA' },
  { name: 'ana@brickline',   msg: 'killed a flaky cron before it hit pagerduty' },
  { name: '@shipmate_hq',    msg: 'noticed our /api/users perf regression on PR #482' },
  { name: 'noor@lattice.fm', msg: 'first launch without a war room in 9 months' },
  { name: '@northpeak_eng',  msg: 'caught a missing null check in our oauth callback' },
];

const VISIBLE_MAX     = 4;      // entries kept on screen
const CYCLE_MS        = 3200;   // how often a new entry arrives
const START_DELAY_MS  = 1500;   // wait for the entrance animation to settle
const SHUTDOWN_MS     = 550;    // must match the CSS keyframe duration

export function mountFeedbackLog() {
  const root  = document.getElementById('feedback-log');
  const list  = document.getElementById('feedback-log-list');
  const close = document.getElementById('feedback-log-close');
  if (!root || !list || !close) return;

  // Start the clock at a plausible "now" so timestamps feel live, and tick
  // it forward 1–3 minutes per entry to read like a real activity log.
  const now = new Date();
  let clock = now.getHours() * 60 + now.getMinutes() - VISIBLE_MAX * 2;

  // Shuffle so reloads don't always show the same opening pair
  let queue = shuffle(ENTRIES.slice());
  let qIdx  = 0;
  let intervalId = null;
  let closed = false;

  // Seed with a few entries so the tab isn't empty during the entrance anim
  for (let i = 0; i < Math.min(2, VISIBLE_MAX); i++) {
    clock += randInt(1, 3);
    appendEntry(nextEntry(), clock);
  }

  // Stagger their entrance so they don't all pop in at once
  Array.from(list.children).forEach((el, i) => {
    el.style.animationDelay = `${0.5 + i * 0.18}s`;
  });

  setTimeout(startCycling, START_DELAY_MS);

  close.addEventListener('click', handleClose);

  /** Pull the next entry from the shuffled queue, reshuffling on wrap. */
  function nextEntry() {
    if (qIdx >= queue.length) {
      queue = shuffle(ENTRIES.slice());
      qIdx = 0;
    }
    return queue[qIdx++];
  }

  function startCycling() {
    if (closed) return;
    intervalId = setInterval(() => {
      clock += randInt(1, 3);
      appendEntry(nextEntry(), clock);
      pruneIfNeeded();
    }, CYCLE_MS);
  }

  function appendEntry({ name, msg }, minutesSinceMidnight) {
    // Strip the cursor off the previously-newest entry — there should only
    // ever be one orange box visible at a time, parked on the latest line.
    list.querySelectorAll('.feedback-log-cursor').forEach((c) => c.remove());

    const li = document.createElement('li');
    li.className = 'feedback-log-entry';
    li.innerHTML = `
      <div class="feedback-log-meta">
        <span class="feedback-log-time">${formatTime(minutesSinceMidnight)}</span>
        <span class="feedback-log-handle">${escapeHtml(name)}</span><span class="feedback-log-colon">:</span>
      </div>
      <div class="feedback-log-msg">${escapeHtml(msg)}<span class="feedback-log-cursor" aria-hidden="true"></span></div>
    `;
    list.appendChild(li);
  }

  function pruneIfNeeded() {
    while (list.children.length > VISIBLE_MAX) {
      const oldest = list.firstElementChild;
      if (!oldest || oldest.classList.contains('is-fading')) break;
      oldest.classList.add('is-fading');
      oldest.addEventListener('animationend', () => oldest.remove(), { once: true });
    }
  }

  function handleClose() {
    if (closed) return;
    closed = true;
    if (intervalId) clearInterval(intervalId);
    root.classList.add('is-closing');
    setTimeout(() => root.remove(), SHUTDOWN_MS + 30);
  }
}

// ---------- helpers ----------

function formatTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = ((minutes % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
