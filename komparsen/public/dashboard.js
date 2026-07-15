'use strict';
// Admin-Dashboard: To-dos, Stats, offene Bookings.
(function () {
  const $ = (id) => document.getElementById(id);
  // Nur Admin darf das Dashboard sehen (Authz, nicht nur Auth)
  requireRole(['admin'], '/dashboard.html').then(async (me) => {
    if (!me) return;
    const [stats, bookings] = await Promise.all([
      api('/api/admin/stats').then(r => r.json()),
      api('/api/admin/bookings').then(r => r.json())
    ]);

    // To-dos
    const todos = [];
    if (stats.flag_selfie_due > 0) todos.push(['warn', stats.flag_selfie_due + ' Selfies fällig', 'Kalender prüfen']);
    if (stats.pending_bookings > 0) todos.push(['warn', stats.pending_bookings + ' offene Anfragen', 'Bestätigen']);
    if (stats.unverified > 0) todos.push(['warn', stats.unverified + ' unbestätigte Mails', 'Opt-In erinnern']);
    if (!todos.length) todos.push(['ok', 'Alles erledigt ' + icon('check'), 'Genieß den Tag']);

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
  });
})();
