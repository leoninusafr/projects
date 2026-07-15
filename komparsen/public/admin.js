'use strict';
// Admin: Setup-Checkliste (Pflichtfelder mit "!"-Marker), Rechtstexte,
// ADAG-Export, Live-Schalter. Nur für Admin.
requireRole(['admin'], '/admin.html').then(async (me) => {
  if (!me) return;
  const $ = (id) => document.getElementById(id);

  // Pflichtfelder, die optisch mit "!" markiert werden (gleiche Keys wie Backend)
  const REQUIRED = ['company_name', 'owner_name', 'owner_address', 'owner_city',
    'owner_email', 'owner_phone', 'domain', 'agb', 'privacy'];
  const LABELS = {
    company_name: 'Firmenname', owner_name: 'Inhaber', owner_address: 'Adresse',
    owner_city: 'PLZ/Stadt', owner_email: 'E-Mail', owner_phone: 'Telefon',
    domain: 'Domain', agb: 'AGB', privacy: 'Datenschutz'
  };

  // ---- Setup-Status laden + anzeigen ----
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
    } else {
      badge.textContent = (st.total - st.filled) + ' OFFEN';
      badge.className = 'badge warn';
      title.textContent = 'Noch ' + (st.total - st.filled) + ' Pflichtfeld(er) ausfüllen, bevor veröffentlicht wird.';
      // nach Sektion gruppieren
      const bySec = {};
      st.missing.forEach(m => { (bySec[m.section] = bySec[m.section] || []).push(m); });
      body.innerHTML = '<p class="muted">Diese Angaben fehlen noch. Bis sie ergänzt sind, ' +
        'bleibt der Live-Schalter gesperrt (Impressum/DSGVO nicht vollständig):</p>' +
        Object.keys(bySec).map(sec =>
          '<p style="margin:10px 0 4px"><strong>' + esc(sec) + '</strong></p>' +
          '<ul style="margin:0 0 6px;padding-left:18px">' +
          bySec[sec].map(m => '<li><span class="reqflag">!</span> ' + esc(m.label) + '</li>').join('') +
          '</ul>').join('');
    }
    // Eingabe-Felder markieren
    REQUIRED.forEach(k => {
      const flag = $('req-' + k);
      if (!flag) return;
      if (st.missing.some(m => m.key === k)) {
        flag.textContent = '!';
        flag.setAttribute('role', 'alert');
      } else {
        flag.textContent = '✓';
        flag.className = 'reqflag ok';
        flag.removeAttribute('role');
      }
    });
  }

  async function load() {
    const r = await api('/api/settings');
    const s = await r.json();
    ['company_name', 'owner_name', 'owner_address', 'owner_city', 'owner_email',
     'owner_phone', 'domain', 'impressum', 'agb', 'privacy', 'separate_imprint_address']
      .forEach(k => { if ($(k) && s[k] != null) $(k).value = s[k]; });
    $('useSeparate').checked = !!s.separate_imprint_address;
    $('sepBox').classList.toggle('hidden', !s.separate_imprint_address);
    await renderSetup();
  }

  $('useSeparate').addEventListener('change', () =>
    $('sepBox').classList.toggle('hidden', !$('useSeparate').checked));

  $('save').addEventListener('click', async () => {
    const payload = {};
    ['company_name', 'owner_name', 'owner_address', 'owner_city', 'owner_email',
     'owner_phone', 'domain', 'impressum', 'agb', 'privacy', 'separate_imprint_address']
      .forEach(k => { if ($(k)) payload[k] = $(k).value; });
    payload.separate_imprint_address = $('useSeparate').checked ? ($('separate_imprint_address').value || ' ') : '';
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify(payload) });
    if (r.ok) {
      await renderSetup();
      alert('Gespeichert. Offene Pflichtfelder sind oben markiert.');
    } else {
      alert('Fehler beim Speichern.');
    }
  });

  $('exportAdag').addEventListener('click', async () => {
    const r = await api('/api/admin/export-adag');
    if (r.ok) {
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'adag_export.csv'; a.click();
    }
  });

  load();
});
