/* Flux sign-in screen. Shown after Sign out; the session flag lives in sessionStorage. */
(() => {
  'use strict';

  const SIGNED_OUT_KEY = 'flux-signed-out';
  const meta = (window.FLUX_SEED && window.FLUX_SEED.meta) || {};
  const credentials = meta.credentials || {};
  const user = meta.currentUser || {};

  const nextParam = new URLSearchParams(window.location.search).get('next') || '';
  // Only return to a page inside this app.
  const next = /^[a-z-]+\.html(\?[^#]*)?$/i.test(nextParam) && !/^login\.html/i.test(nextParam) ? nextParam : 'index.html';

  function signIn() {
    try { window.sessionStorage.removeItem(SIGNED_OUT_KEY); } catch { /* storage unavailable: nothing to clear */ }
    window.location.replace(next);
  }

  const continueBtn = document.getElementById('continue-as');
  if (user.name) continueBtn.querySelector('span:last-child').textContent = `Continue as ${user.name}`;
  continueBtn.addEventListener('click', signIn);

  const form = document.getElementById('login-form');
  const error = document.getElementById('login-error');
  const email = document.getElementById('login-email');
  const password = document.getElementById('login-password');
  email.value = credentials.email || '';

  function fail(message, field) {
    error.textContent = message;
    error.hidden = false;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', 'login-error');
    field.focus();
  }

  form.addEventListener('input', () => {
    error.hidden = true;
    [email, password].forEach((el) => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const e = email.value.trim().toLowerCase();
    const p = password.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { fail('Enter your work email.', email); return; }
    if (!p) { fail('Enter your password.', password); return; }
    if (e !== String(credentials.email || '').toLowerCase() || p !== credentials.password) {
      fail('That email and password do not match. Check them and try again.', password);
      return;
    }
    signIn();
  });
})();
