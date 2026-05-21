/**
 * Desktop icon rails — PostHog-OS-style file shortcuts that flank the dialog.
 * Each icon is decorative (no real link target) and routes click to the email
 * input, giving every desktop element a single coherent "sign up" affordance.
 *
 * Icon SVGs are inlined here so the bundle stays single-file and the icons
 * inherit currentColor for theming.
 */

const SVG = {
  doc: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <path d="M10 4 H24 L31 11 V36 H10 Z" fill="#FFFDF6"/>
      <path d="M24 4 V11 H31"/>
      <path d="M15 18 H26 M15 22 H26 M15 26 H22" stroke-linecap="round"/>
    </svg>`,
  duck: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <ellipse cx="18" cy="25" rx="12" ry="7.5" fill="#FFFDF6"/>
      <circle cx="27" cy="18" r="5.2" fill="#FFFDF6"/>
      <path d="M31.5 17.5 L37 17.5 L35 20.5 L31.5 19.5 Z" fill="#ff7a1a" stroke="#ff7a1a"/>
      <circle cx="28.2" cy="17" r="0.95" fill="currentColor" stroke="none"/>
      <path d="M15 32 V35 M22 32 V35" stroke="#ff7a1a" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  film: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <rect x="6" y="10" width="22" height="20" rx="1.5" fill="#FFFDF6"/>
      <path d="M28 14 L34 11 V29 L28 26 Z" fill="#FFFDF6"/>
      <path d="M14 16 L22 20 L14 24 Z" fill="#ff7a1a" stroke="#ff7a1a"/>
    </svg>`,
  mail: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <rect x="6" y="11" width="28" height="20" rx="1.5" fill="#FFFDF6"/>
      <path d="M6 13 L20 23 L34 13"/>
      <circle cx="32" cy="11" r="3.2" fill="#ff7a1a" stroke="#ff7a1a"/>
    </svg>`,
  book: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <path d="M6 8 H18 C19.5 8 20 9 20 10 V34 C20 33 19.5 32 18 32 H6 Z" fill="#FFFDF6"/>
      <path d="M34 8 H22 C20.5 8 20 9 20 10 V34 C20 33 20.5 32 22 32 H34 Z" fill="#FFFDF6"/>
      <path d="M10 15 H16 M10 19 H16 M24 15 H30 M24 19 H30"/>
    </svg>`,
  sheet: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <rect x="7" y="7" width="26" height="26" rx="1.5" fill="#FFFDF6"/>
      <path d="M7 14 H33 M7 21 H33 M7 28 H33 M14 7 V33 M21 7 V33 M28 7 V33"/>
      <rect x="14" y="14" width="7" height="7" fill="#ff7a1a" stroke="none"/>
    </svg>`,
  bag: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <path d="M9 14 H31 L29 34 H11 Z" fill="#FFFDF6"/>
      <path d="M14 14 V10 C14 6 26 6 26 10 V14"/>
      <circle cx="16" cy="22" r="0.9" fill="currentColor" stroke="none"/>
      <circle cx="24" cy="22" r="0.9" fill="currentColor" stroke="none"/>
    </svg>`,
  trash: `
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <path d="M9 11 H31"/>
      <path d="M11 11 V34 H29 V11" fill="#FFFDF6"/>
      <path d="M15 11 V8 H25 V11"/>
      <path d="M16 16 V29 M20 16 V29 M24 16 V29"/>
    </svg>`,
};

const LEFT = [
  { name: 'welcome.txt',    icon: 'doc'  },
  { name: 'the-duck.exe',   icon: 'duck' },
  { name: 'demo.mov',       icon: 'film' },
  { name: 'feedback.mbox',  icon: 'mail' },
  { name: 'manual.pdf',     icon: 'book' },
];

const RIGHT = [
  { name: 'pricing.xls',    icon: 'sheet' },
  { name: 'changelog.md',   icon: 'doc'   },
  { name: 'merch',          icon: 'bag'   },
  { name: 'trash',          icon: 'trash' },
];

function renderIcon({ name, icon }) {
  const a = document.createElement('a');
  a.className = 'desktop-icon';
  a.href = '#';
  a.dataset.action = 'focus-email';
  a.innerHTML = `
    <span class="desktop-icon-art" aria-hidden="true">${SVG[icon] || SVG.doc}</span>
    <span class="desktop-icon-label">${name}</span>
  `;
  return a;
}

export function mountDesktopIcons() {
  const left  = document.getElementById('rail-left');
  const right = document.getElementById('rail-right');
  if (!left || !right) return;
  LEFT.forEach(i  => left.appendChild(renderIcon(i)));
  RIGHT.forEach(i => right.appendChild(renderIcon(i)));
}
