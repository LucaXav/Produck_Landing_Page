/**
 * Email form: HTML5 validation + Supabase insert + success state.
 * On duplicate-email the user still sees the "on the list" UI; on network
 * failure they see a clear error so they can retry.
 */

import { saveSignup } from '../lib/supabase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RESET_BUTTON_HTML = `Get the duck
  <svg class="btn-arrow" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 8 H14 M9 3 L14 8 L9 13" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;

export function mountEmailForm() {
  const form   = document.getElementById('email-form');
  const input  = document.getElementById('email-input');
  const button = document.getElementById('email-submit');
  const status = document.getElementById('form-status');

  function setStatus(text, kind) {
    status.textContent = text;
    status.classList.remove('error', 'ok');
    if (kind) status.classList.add(kind);
  }

  function resetButton() {
    button.classList.remove('success');
    button.disabled = false;
    button.innerHTML = RESET_BUTTON_HTML;
    input.disabled  = false;
  }

  input.addEventListener('input', () => {
    if (status.textContent) setStatus('', null);
    form.classList.remove('shake');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim().toLowerCase();

    if (!email) {
      setStatus('Please enter your email so the duck can find you.', 'error');
      form.classList.add('shake');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setStatus("That doesn't look like a valid email. Try again.", 'error');
      form.classList.add('shake');
      input.focus();
      return;
    }

    button.disabled = true;
    button.innerHTML = `Saving…`;
    setStatus('', null);

    try {
      const result = await saveSignup(email);
      button.classList.add('success');
      button.innerHTML = result.duplicate
        ? `Already on it <span aria-hidden="true">✓</span>`
        : `On the list <span aria-hidden="true">✓</span>`;
      input.value = '';
      input.disabled = true;
      setStatus(
        result.duplicate
          ? "You're already on the list — we'll be in touch."
          : "We'll let you know when Produck hatches.",
        'ok',
      );
      setTimeout(resetButton, 4500);
    } catch (err) {
      console.error('[signup] save failed:', err);
      setStatus("Couldn't save that just now. Mind trying again?", 'error');
      form.classList.add('shake');
      resetButton();
    }
  });
}
