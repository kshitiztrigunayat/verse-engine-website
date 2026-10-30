// Prototype sign-in for internal flow testing. Any details continue; the session is a localStorage flag.
// Replace `finish()` with a real authentication call when the backend is integrated.
const $ = s => document.querySelector(s);
const SESSION = 'verse-playground-session';
let mode = 'pw', signup = false;
const params = new URLSearchParams(location.search);
signup = params.get('mode') === 'signup';
const next = (() => { const n = params.get('next') || '/studio'; return n.startsWith('/') && !n.startsWith('//') ? n : '/studio'; })();
try { if (JSON.parse(localStorage.getItem(SESSION))?.name && params.get('switch') === null && !signup) $('#si-sub').textContent = 'You are already signed in. Continue, or sign in as someone else.'; } catch { /* storage unavailable */ }

function paint() {
  $('#si-eyebrow').textContent = signup ? 'CREATE ACCOUNT' : 'SIGN IN';
  $('#si-title').textContent = signup ? 'Start for free.' : 'Welcome back.';
  if (!$('#si-sub').dataset.keep) $('#si-sub').textContent = signup ? 'Create an account to open Verse Engine Studio.' : 'Sign in to open Verse Engine Studio.';
  $('#si-go').textContent = signup ? 'Create account' : 'Sign in';
  $('#si-alt-t').textContent = signup ? 'Already have an account?' : 'New to Verse Engine?';
  $('#si-switch').textContent = signup ? 'Sign in' : 'Create an account';
  $('.si-name').hidden = !(signup && mode === 'pw');
  $('#si-pass').autocomplete = signup ? 'new-password' : 'current-password';
  $('#tab-pw').setAttribute('aria-selected', mode === 'pw'); $('#tab-tok').setAttribute('aria-selected', mode === 'tok');
  $('#tab-pw').tabIndex = mode === 'pw' ? 0 : -1; $('#tab-tok').tabIndex = mode === 'tok' ? 0 : -1;
  $('#panel-pw').hidden = mode !== 'pw'; $('#panel-tok').hidden = mode !== 'tok';
}
document.querySelectorAll('[data-mode]').forEach(b => {
  b.addEventListener('click', () => { mode = b.dataset.mode; paint(); });
  b.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); mode = mode === 'pw' ? 'tok' : 'pw'; paint(); $('#tab-' + mode).focus(); } });
});
$('#si-switch').addEventListener('click', () => { signup = !signup; $('#si-sub').dataset.keep = ''; $('#si-msg').textContent = ''; paint(); });
$('#si-forgot').addEventListener('click', () => { $('#si-msg').textContent = 'Password reset is not connected in this prototype. Enter any details to continue.'; });
function finish(name, email) {
  try { localStorage.setItem(SESSION, JSON.stringify({ name, email, at: Date.now() })); } catch { /* still continue */ }
  location.href = next;
}
$('#si-form').addEventListener('submit', e => {
  e.preventDefault();
  if (mode === 'pw') {
    const email = $('#si-email').value.trim(), name = $('#su-name').value.trim();
    finish(name || (email.split('@')[0] || 'Guest').replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Guest', email);
  } else finish($('#tk-name').value.trim() || 'Guest', '');
});
paint();
$('#si-email').focus();
