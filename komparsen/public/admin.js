'use strict';
// Admin: Kategorien (Website/Datenbank/Rechtliches/Team),
// "!"-Marker für fehlende Pflichtfelder, Admin-Einladung mit Rechten.
requireRole(['admin'], '/admin.html').then(async (me) => {
  if (!me) return;
  const $ = (id) => document.getElementById(id);

  // ---- Tabs ----
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.tabpanel').forEach(x => x.classList.add('hidden'));
      t.classList.add('active'); t.setAttribute('aria-selected', 'true');
      document.querySelector(`.tabpanel[data-panel="${t.dataset.tab}"]`).classList.remove('hidden');
      if (t.dataset.tab === 'team') renderAdmins();
    });
  });

  // ---- Pflichtfelder (gleiche Keys wie Backend) ----
  const REQUIRED = ['company_name', 'owner_name', 'owner_address', 'owner_city',
    'owner_email', 'owner_phone', 'domain', 'agb', 'privacy'];
  const LABELS = {
    company_name: 'Firmenname', owner_name: 'Inhaber', owner_address: 'Adresse',
    owner_city: 'PLZ/Stadt', owner_email: 'E-Mail', owner_phone: 'Telefon',
    domain: 'Domain', agb: 'AGB', privacy: 'Datenschutz'
  };

  async function renderSetup() {
    const r = await api('/api/admin/setup-status');
    if (!r.ok) return;
    const st = await r.json();
    const badge = $('publishBadge'), title = $('publishTitle'), body = $('publishBody');
    if (st.done) {
      badge.textContent = 'LIVE BEREIT';
      badge.className = 'badge ok';
      title.textContent = 'Alle Pflichtangaben vorhanden — die Seite ist veröffentlichungsfähig.';
      body.innerHTML = '<p class="muted">Keine offenen Punkte. Du kannst jederzeit live gehen.</p>';
      $('goLive').checked = true;
    } else {
      badge.textContent = (st.total - st.filled) + ' OFFEN';
      badge.className = 'badge warn';
      title.textContent = 'Noch ' + (st.total - st.filled) + ' Pflichtfeld(er) ausfüllen.';
      const bySec = {};
      st.missing.forEach(m => { (bySec[m.section] = bySec[m.section] || []).push(m); });
      body.innerHTML = '<p class="muted">Diese Angaben fehlen noch (mit "!" markiert):</p>' +
        Object.keys(bySec).map(sec =>
          '<p style="margin:10px 0 4px"><strong>' + esc(sec) + '</strong></p>' +
          '<ul style="margin:0 0 6px;padding-left:18px">' +
          bySec[sec].map(m => '<li><span class="reqflag">!</span> ' + esc(m.label) + '</li>').join('') +
          '</ul>').join('');
      $('goLive').checked = false;
    }
    // Eingabe-Felder markieren
    REQUIRED.forEach(k => {
      const flag = $('req-' + k);
      if (!flag) return;
      if (st.missing.some(m => m.key === k)) { flag.textContent = '!'; flag.setAttribute('role', 'alert'); }
      else { flag.textContent = '✓'; flag.className = 'reqflag ok'; flag.removeAttribute('role'); }
    });
  }

  async function loadWebsite() {
    const r = await api('/api/settings');
    const s = await r.json();
    ['company_name', 'owner_name', 'owner_address', 'owner_city', 'owner_email',
     'owner_phone', 'domain', 'site_theme'].forEach(k => { if ($(k) && s[k] != null) $(k).value = s[k]; });
    $('useSeparate').checked = !!s.separate_imprint_address;
    $('sepBox').classList.toggle('hidden', !s.separate_imprint_address);
    await renderSetup();
  }
  async function loadLegal() {
    const r = await api('/api/settings');
    const s = await r.json();
    ['impressum', 'agb', 'privacy'].forEach(k => { if ($(k)) $(k).value = s[k] || ''; });
    await renderSetup();
  }

  function payloadSite() {
    const p = {};
    ['company_name', 'owner_name', 'owner_address', 'owner_city', 'owner_email',
     'owner_phone', 'domain', 'site_theme'].forEach(k => { if ($(k)) p[k] = $(k).value; });
    p.separate_imprint_address = $('useSeparate').checked ? ($('separate_imprint_address').value || ' ') : '';
    return p;
  }

  $('useSeparate').addEventListener('change', () =>
    $('sepBox').classList.toggle('hidden', !$('useSeparate').checked));

  $('saveWebsite').addEventListener('click', async () => {
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify(payloadSite()) });
    if (r.ok) { await renderSetup(); alert('Website-Einstellungen gespeichert.'); }
    else alert('Fehler beim Speichern.');
  });
  $('saveImpressum').addEventListener('click', async () => {
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify({ impressum: $('impressum').value }) });
    if (r.ok) alert('Impressum gespeichert.'); else alert('Fehler.');
  });
  $('saveLegal').addEventListener('click', async () => {
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify({ agb: $('agb').value, privacy: $('privacy').value }) });
    if (r.ok) { await renderSetup(); alert('Rechtstexte gespeichert.'); }
    else alert('Fehler.');
  });

  $('exportAdag').addEventListener('click', async () => {
    const r = await api('/api/admin/export-adag');
    if (r.ok) { const b = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'adag_export.csv'; a.click(); }
  });
  $('exportCsv').addEventListener('click', async () => {
    const r = await api('/api/shortlist/export', { method: 'POST', body: JSON.stringify({ ids: [] }) });
    if (r.ok) { const b = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'kartei_export.csv'; a.click(); }
  });

  // ---- Admin-Einladung ----
  $('inviteBtn').addEventListener('click', async () => {
    const email = $('inviteEmail').value.trim();
    const scope = $('inviteScope').value;
    if (!email) { alert('Bitte E-Mail eingeben.'); return; }
    const r = await api('/api/admin/invite', { method: 'POST', body: JSON.stringify({ email, scope }) });
    if (r.ok) {
      const j = await r.json();
      $('inviteResult').innerHTML = '<div class="notice ok">Eingeladen: <code>' + esc(j.email) +
        '</code> (' + esc(j.scope) + ')<br>Einladungslink: <code>' + esc(location.origin + j.inviteLink) + '</code></div>';
      $('inviteEmail').value = '';
      renderAdmins();
    } else {
      const j = await r.json().catch(() => ({}));
      alert('Fehler: ' + (j.error || 'unbekannt'));
    }
  });

  async function renderAdmins() {
    const r = await api('/api/admin/admins');
    if (!r.ok) { $('adminList').innerHTML = '<p class="muted">Kein Zugriff.</p>'; return; }
    const list = await r.json();
    if (!list.length) { $('adminList').innerHTML = '<p class="muted">Noch keine eingeladenen Admins.</p>'; return; }
    $('adminList').innerHTML = '<table><tr><th>E-Mail</th><th>Rechte</th><th></th></tr>' +
      list.map(a => {
        const scopeLabel = { all: 'Voller Zugriff', website: 'Website', database: 'Datenbank', legal: 'Rechtliches' }[a.role_scope] || a.role_scope;
        const revoked = !!a.revoked_at;
        return '<tr><td>' + esc(a.email) + '</td><td>' +
          '<select data-scope="' + a.id + '"><option value="all"' + (a.role_scope === 'all' ? ' selected' : '') + '>Voller Zugriff</option>' +
          '<option value="website"' + (a.role_scope === 'website' ? ' selected' : '') + '>Website</option>' +
          '<option value="database"' + (a.role_scope === 'database' ? ' selected' : '') + '>Datenbank</option>' +
          '<option value="legal"' + (a.role_scope === 'legal' ? ' selected' : '') + '>Rechtliches</option></select></td>' +
          '<td><button class="btn sm" data-revoke="' + a.id + '"' + (revoked ? ' disabled' : '') + '>' + (revoked ? 'Widerrufen' : 'Entziehen') + '</button></td></tr>';
      }).join('') + '</table>';
    $('adminList').querySelectorAll('select[data-scope]').forEach(sel => {
      sel.addEventListener('change', async () => {
        await api('/api/admin/admins', { method: 'PATCH', body: JSON.stringify({ id: sel.dataset.scope, scope: sel.value }) });
        renderAdmins();
      });
    });
    $('adminList').querySelectorAll('button[data-revoke]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Admin-Rechte für ' + btn.dataset.revoke + ' entziehen?')) return;
        await api('/api/admin/admins', { method: 'PATCH', body: JSON.stringify({ id: btn.dataset.revoke, revoke: true }) });
        renderAdmins();
      });
    });
  }

  // Init
  loadWebsite();
  loadLegal();
});
