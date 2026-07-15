'use strict';
// Gemeinsame Client-Helfer: API-Call, escape, Session-Handling.
window.api = async function (url, opts) {
  opts = opts || {};
  opts.credentials = 'same-origin';
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  const r = await fetch(url, opts);
  return r;
};
window.esc = function (s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};
// Schlanke Inline-SVG-Icons (kein Emoji, kein Dep) — Apple-Stil, stroke-based.
window.icon = function (name) {
  const s = {
    check: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    warn: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    bag: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
  };
  return s[name] || '';
};
// Prüfe Login, leite ggf. weiter. Gibt bei Erfolg das User-Objekt zurück, sonst false.
window.requireAuth = async function (next) {
  const r = await api('/api/auth/me');
  if (!r.ok) { location.href = '/login.html?next=' + encodeURIComponent(next || location.pathname); return false; }
  const me = await r.json();
  window.ME = me;
  document.body.classList.add('auth-ok');
  return me;
};
// Wie requireAuth, verlangt zusätzlich eine der Rollen. Sonst -> 403-Seite.
window.requireRole = async function (roles, next) {
  const r = await api('/api/auth/me');
  if (!r.ok) { location.href = '/login.html?next=' + encodeURIComponent(next || location.pathname); return false; }
  const me = await r.json();
  window.ME = me;
  if (roles && !roles.includes(me.role)) {
    location.href = '/403.html';
    return false;
  }
  document.body.classList.add('auth-ok');
  return me;
};
