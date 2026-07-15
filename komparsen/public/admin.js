'use strict';
// Admin: editierbare Rechtstexte + ADAG-Export. Nur für Admin.
requireRole(['admin'], '/admin.html').then(async (me) => {
  if (!me) return;
  const $ = (id) => document.getElementById(id);
  const keys = ['company_name', 'impressum', 'agb', 'privacy', 'separate_imprint_address'];

  async function load() {
    const r = await api('/api/settings');
    const s = await r.json();
    keys.forEach(k => { if ($(k) && s[k] != null) $(k).value = s[k]; });
    $('useSeparate').checked = !!s.separate_imprint_address;
    $('sepBox').classList.toggle('hidden', !s.separate_imprint_address);
  }
  $('useSeparate').addEventListener('change', () =>
    $('sepBox').classList.toggle('hidden', !$('useSeparate').checked));

  $('save').addEventListener('click', async () => {
    const payload = {};
    keys.forEach(k => { if ($(k)) payload[k] = $(k).value; });
    payload.separate_imprint_address = $('useSeparate').checked ? ($('separate_imprint_address').value || ' ') : '';
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify(payload) });
    if (r.ok) alert('Gespeichert.');
    else alert('Fehler beim Speichern.');
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
