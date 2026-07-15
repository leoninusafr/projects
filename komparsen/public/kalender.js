'use strict';
// Kalender: Buchungen anlegen + fällige Selfies anzeigen.
(function () {
  const $ = (id) => document.getElementById(id);

  // Nur Admin darf Buchungen verwalten
  requireRole(['admin'], '/kalender.html').then(async (me) => {
    if (!me) return;
    async function load() {
    const bookings = await api('/api/bookings').then(r => r.json());
    $('list').innerHTML = bookings.length
      ? '<table><tr><th>Extra</th><th>Titel</th><th>Von</th><th>Bis</th><th>Ort</th><th>Satz</th><th>Status</th></tr>' +
        bookings.map(b => '<tr><td>' + esc(b.extra_name) + '</td><td>' + esc(b.title) +
          '</td><td>' + esc((b.date_start||'').slice(0,10)) + '</td><td>' + esc((b.date_end||'').slice(0,10)) +
          '</td><td>' + esc(b.location) + '</td><td>' + esc(b.day_rate) + ' €</td><td><span class="badge">' +
          esc(b.status) + '</span></td></tr>').join('') + '</table>'
      : '<p class="muted">Noch keine Einsätze.</p>';

    const due = await api('/api/admin/selfie-due').then(r => r.json());
    $('selfies').innerHTML = due.length
      ? due.map(p => '<div class="card"><b>' + esc((p.first_name||'')+ ' ' + (p.last_name||'')) +
          '</b> <span class="badge warn">fällig ' + esc((p.selfie_due_at||'').slice(0,10)) + '</span></div>').join('')
      : '<p class="muted">Keine fällig. ' + icon('check') + '</p>';
  }

  $('add').addEventListener('click', async () => {
    const payload = {
      extra_id: $('extra_id').value, production_id: $('production_id').value || null,
      title: $('title').value, location: $('loc').value,
      date_start: $('start').value, date_end: $('end').value || $('start').value,
      day_rate: Number($('rate').value) || 0
    };
    if (!payload.extra_id || !payload.title || !payload.date_start) { alert('Pflichtfelder fehlen.'); return; }
    const r = await api('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
    if (r.ok) { load(); }
    else alert((await r.json()).error || 'Fehler');
  });

  load();
  });
})();
