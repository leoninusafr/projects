'use strict';
// Dashboard — rollen-spezifisch: Komparse / Produktion / Admin sehen Verschiedenes.
(function () {
  const $ = (id) => document.getElementById(id);

  requireAuth('/dashboard.html').then(async (me) => {
    if (!me) return;

    // Rolle ermitteln
    const role = me.role;
    $('roleTitle').textContent = role === 'production' ? 'Produktion' : role === 'admin' ? 'Admin' : 'Komparse';

    if (role === 'admin') return renderAdmin(me);
    if (role === 'production') return renderProduction(me);
    return renderExtra(me);
  });

  // ---------- KOMPARSE ----------
  async function renderExtra(me) {
    const r = await api('/api/profile/me');
    const p = r.ok ? await r.json() : {};
    const visible = !!p.visible;
    const due = p.selfie_due_at ? new Date(p.selfie_due_at) : null;
    const selfieDue = due && due < new Date();

    let html = '';
    html += card(visible ? 'ok' : 'warn',
      visible ? 'Sichtbar in der Kartei' : 'Nicht sichtbar',
      visible ? 'Du wirst von Produktionen gefunden.' : 'Mache dein Profil sichtbar, um gebucht zu werden.',
      '<a class="btn sm" href="/me.html">Profil bearbeiten</a>');

    html += card(selfieDue ? 'warn' : 'ok',
      selfieDue ? 'Selfie-Auffrischung fällig' : 'Selfie aktuell',
      selfieDue ? 'Lade ein neues Live-Selfie hoch (alle 6 Monate).' : (due ? 'Gültig bis ' + due.toLocaleDateString('de-DE') : 'Noch kein Selfie.'),
      selfieDue ? '<a class="btn sm" href="/onboarding.html?role=extra">Selfie erneuern</a>' : '');

    // Meine Anfragen (Buchungen, wo ich als Extra gelistet bin)
    const bk = await api('/api/bookings/me').then(r => r.ok ? r.json() : { bookings: [] });
    const list = (bk.bookings || []);
    html += '<h2 style="margin-top:30px">Meine Anfragen</h2>';
    html += list.length
      ? '<table><tr><th>Projekt</th><th>Wann</th><th>Status</th></tr>' +
        list.map(b => '<tr><td>' + esc(b.title) + '</td><td>' + esc((b.date_start||'').slice(0,10)) +
          '</td><td><span class="badge">' + esc(b.status) + '</span></td></tr>').join('') + '</table>'
      : '<p class="muted">Noch keine Anfragen. Halte dein Profil aktuell und sichtbar.</p>';

    $('todos').innerHTML = html;
    $('stats').innerHTML = '';
    $('bookings').innerHTML = '';
  }

  // ---------- PRODUKTION ----------
  async function renderProduction(me) {
    let html = '';
    html += card('ok', 'Komparsen suchen', 'Filtere oder suche frei nach Gesichtern, Größe, Haarfarbe, Ort.',
      '<a class="btn sm" href="/search.html">Zur Suche</a>');
    html += card('ok', 'Merkliste', 'Baue dir eine Auswahl für dein Casting zusammen.',
      '<a class="btn sm" href="/search.html">Merkliste öffnen</a>');

    const bk = await api('/api/bookings/me').then(r => r.ok ? r.json() : { bookings: [] });
    const list = (bk.bookings || []);
    html += '<h2 style="margin-top:30px">Meine Anfragen</h2>';
    html += list.length
      ? '<table><tr><th>Projekt</th><th>Wann</th><th>Status</th></tr>' +
        list.map(b => '<tr><td>' + esc(b.title) + '</td><td>' + esc((b.date_start||'').slice(0,10)) +
          '</td><td><span class="badge">' + esc(b.status) + '</span></td></tr>').join('') + '</table>'
      : '<p class="muted">Noch keine Anfragen gesendet.</p>';

    $('todos').innerHTML = html;
    $('stats').innerHTML = '';
    $('bookings').innerHTML = '';
  }

  // ---------- ADMIN ----------
  async function renderAdmin(me) {
    const [stats, bookings] = await Promise.all([
      api('/api/admin/stats').then(r => r.json()),
      api('/api/admin/bookings').then(r => r.json())
    ]);

    const todos = [];
    if (stats.flag_selfie_due > 0) todos.push(['warn', stats.flag_selfie_due + ' Selfies fällig', 'Kalender prüfen']);
    if (stats.pending_bookings > 0) todos.push(['warn', stats.pending_bookings + ' offene Anfragen', 'Bestätigen']);
    if (stats.unverified > 0) todos.push(['warn', stats.unverified + ' unbestätigte Mails', 'Opt-In erinnern']);
    if (!todos.length) todos.push(['ok', 'Alles erledigt', 'Genieß den Tag']);

    $('todos').innerHTML = todos.map(t =>
      '<div class="card"><span class="badge ' + t[0] + '">' + (t[0] === 'ok' ? 'OK' : '!') +
      '</span><h3 style="margin-top:8px">' + t[1] + '</h3><p class="muted">' + t[2] + '</p></div>').join('');

    $('stats').innerHTML = [
      ['Komparsen gesamt', stats.extras],
      ['Sichtbar', stats.visible],
      ['Produktionen', stats.productions]
    ].map(s => '<div class="card"><h3>' + s[1] + '</h3><p class="muted">' + s[0] + '</p></div>').join('');

    $('bookings').innerHTML = bookings.length
      ? '<table><tr><th>Extra</th><th>Projekt</th><th>Wann</th><th>Status</th><th></th></tr>' +
        bookings.map(b => '<tr><td>' + esc(b.extra_name) + '</td><td>' + esc(b.title) +
          '</td><td>' + esc((b.date_start || '').slice(0,10)) + '</td><td><span class="badge">' +
          esc(b.status) + '</span></td><td><button class="btn sm" data-b="' + b.id + '">Bestätigen</button></td></tr>').join('') + '</table>'
      : '<p class="muted">Keine Buchungen.</p>';

    $('bookings').querySelectorAll('button[data-b]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await api('/api/admin/bookings/' + btn.dataset.b + '/confirm', { method: 'POST' });
        location.reload();
      });
    });

    // Admin-spezifischer Link-Block
    $('adminLinks').style.display = 'block';
  }

  function card(badge, title, text, action) {
    return '<div class="card"><span class="badge ' + badge + '">' + (badge === 'ok' ? 'OK' : '!') +
      '</span><h3 style="margin-top:8px">' + title + '</h3><p class="muted">' + text + '</p>' +
      (action ? '<div style="margin-top:10px">' + action + '</div>' : '') + '</div>';
  }
})();
