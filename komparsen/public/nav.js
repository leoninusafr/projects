'use strict';
// Nav-Status: zeigt je nach Login Admin-Link + Logout statt "Anmelden".
// Logo -> rollenspezifische Startseite (eingeloggt) bzw. Landing (gast).
// Wird von öffentlichen Seiten geladen (nach app.js).
(function () {
  const slot = document.getElementById('navAuth');
  if (!slot) return;

  // Logo-Ziel je nach Rolle setzen
  function setBrandTarget(me) {
    const brand = document.querySelector('a.brand');
    if (!brand) return;
    let target = '/';
    if (me) {
      if (me.role === 'admin') target = '/dashboard.html';
      else if (me.role === 'production') target = '/search.html';
      else target = '/me.html'; // Komparse -> eigenes Profil-Dashboard
    }
    brand.setAttribute('href', target);
  }

  fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(me => {
    setBrandTarget(me);
    if (me) {
      const delLink = me.role !== 'admin'
        ? '<a href="#" id="navDel">Account löschen</a>' : '';
      slot.innerHTML =
        (me.role === 'admin' ? '<a href="/dashboard.html">Dashboard</a>' : '') +
        '<a href="/search.html">Suche</a>' +
        delLink +
        '<a href="#" id="navLogout">Abmelden</a>';
      const lo = document.getElementById('navLogout');
      if (lo) lo.addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        location.href = '/';
      });
      const dl = document.getElementById('navDel');
      if (dl) dl.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Account wirklich löschen? Alle deine Daten (Profil, Fotos, Selfie) werden unwiderruflich gelöscht (DSGVO Art. 17).')) {
          const r = await fetch('/api/profile/me', { method: 'DELETE', credentials: 'same-origin' });
          if (r.ok) location.href = '/';
          else alert('Löschen fehlgeschlagen.');
        }
      });
    } else {
      slot.innerHTML = '<a href="/login.html">Anmelden</a>';
    }
  }).catch(() => { slot.innerHTML = '<a href="/login.html">Anmelden</a>'; });
})();
