'use strict';
// Admin: Kategorien (Website/Datenbank/Rechtliches/Team),
// "!"-Marker für fehlende Pflichtfelder, Admin-Einladung mit Rechten.
requireRole(['admin'], '/admin.html').then(async (me) => {
  if (!me) return;
  const $ = (id) => document.getElementById(id);

  // ---- Mail-Config-Sektion (API & Versand) ----
  (async () => {
    const view = $('mailConfigView'), edit = $('mailConfigEdit');
    const msg = $('mailMsg');
    function loadCfg() {
      return api('/api/admin/mail-status').then(r => r.json());
    }
    async function refresh() {
      try {
        const cfg = await loadCfg();
        const key = await (async () => {
          // Key nie im Klartext anzeigen, nur ob gesetzt
          const j = await api('/api/settings').then(r => r.json());
          return j.mail_api_key ? '●●●●●●●● (gesetzt)' : (process.env ? 'nicht gesetzt' : 'nicht gesetzt');
        })();
        if ($('cfgMode')) $('cfgMode').textContent = cfg.provider || '—';
        if ($('cfgKey')) $('cfgKey').textContent = key;
        if ($('cfgFrom')) $('cfgFrom').textContent = (await api('/api/settings').then(r => r.json())).mail_from || '—';
        if ($('cfgQuota')) $('cfgQuota').textContent = cfg.quotaPolicy || '—';
        if ($('cfgUrl')) $('cfgUrl').textContent = (await api('/api/settings').then(r => r.json())).app_public_url || '—';
        if ($('cfgRoutes')) $('cfgRoutes').textContent =
          `optin→${cfg.typeRoutes.optin}, booking→${cfg.typeRoutes.booking}, admin→${cfg.typeRoutes.admin}`;
      } catch (e) { if (msg) msg.textContent = 'Konnte Config nicht laden.'; }
    }
    await refresh();
    const editBtn = $('mailEditBtn'), saveBtn = $('mailSaveBtn'), cancelBtn = $('mailCancelBtn'), testBtn = $('mailTestBtn');
    if (editBtn) editBtn.addEventListener('click', async () => {
      const cfg = await loadCfg();
      const s = await api('/api/settings').then(r => r.json());
      if ($('edMode')) $('edMode').value = cfg.provider === 'mock' ? 'brevo' : cfg.provider;
      if ($('edFrom')) $('edFrom').value = s.mail_from || 'KAST <noreply@kast.example>';
      if ($('edQuota')) $('edQuota').value = cfg.quotaPolicy || 'queue_next_day';
      if ($('edUrl')) $('edUrl').value = s.app_public_url || '';
      if ($('edKey')) $('edKey').value = '';
      if ($('edConfirm')) $('edConfirm').checked = false;
      view.style.display = 'none'; edit.style.display = 'block';
      editBtn.style.display = 'none'; saveBtn.style.display = 'inline-block'; cancelBtn.style.display = 'inline-block';
    });
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      view.style.display = 'block'; edit.style.display = 'none';
      editBtn.style.display = 'inline-block'; saveBtn.style.display = 'none'; cancelBtn.style.display = 'none';
      if (msg) msg.textContent = '';
    });
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      if (!($('edConfirm') && $('edConfirm').checked)) {
        if (msg) msg.textContent = 'Bitte Bestätigung ankreuzen, bevor du speicherst.';
        return;
      }
      const body = {
        mail_mode: $('edMode').value,
        mail_from: $('edFrom').value,
        mail_quota_policy: $('edQuota').value,
        app_public_url: $('edUrl').value
      };
      const k = $('edKey').value.trim();
      if (k) body.mail_api_key = k; // nur wenn neu eingegeben (Rotation)
      const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify(body) });
      if (r.ok) {
        view.style.display = 'block'; edit.style.display = 'none';
        editBtn.style.display = 'inline-block'; saveBtn.style.display = 'none'; cancelBtn.style.display = 'none';
        if (msg) msg.textContent = 'Gespeichert — überall automatisch übernommen (kein Neustart).';
        await refresh();
      } else {
        if (msg) msg.textContent = 'Speichern fehlgeschlagen.';
      }
    });
    if (testBtn) testBtn.addEventListener('click', async () => {
      const r = await api('/api/admin/mail-test', { method: 'POST' });
      const j = await r.json().catch(() => ({}));
      if (msg) msg.textContent = j.ok ? 'Test-Mail gesendet (' + (j.provider || '?') + ').' : 'Fehler: ' + (j.error || j.message || 'unbekannt');
    });
  })();

  (async () => {
    const el = $('mailStatus');
    const active = $('mailActive');
    if (!el) return;
    try {
      const r = await api('/api/admin/mail-status');
      if (!r.ok) { el.textContent = 'Status nicht abrufbar.'; return; }
      const j = await r.json();
      active.textContent = j.provider || 'mock';
      if (j.configured) {
        el.innerHTML = '<span class="badge ok">AKTIV</span> Versand über: ' + esc(j.provider) +
          ' · Quota-Policy: ' + esc(j.quotaPolicy) + ' · Brevo-Limit: ' + (j.brevoDailyLimit || 300) + '/Tag';
      } else {
        el.innerHTML = '<span class="badge warn">MOCK</span> Kein Anbieter konfiguriert — Mails nur lokal gespeichert.';
      }
      // Werte in Selects setzen
      if ($('mailMode')) $('mailMode').value = j.provider === 'mock' ? 'brevo' : j.provider;
      if ($('mailQuota')) $('mailQuota').value = j.quotaPolicy || 'queue_next_day';
      if (j.typeRoutes) {
        if ($('routeOptin') && j.typeRoutes.optin) $('routeOptin').value = j.typeRoutes.optin;
        if ($('routeBooking') && j.typeRoutes.booking) $('routeBooking').value = j.typeRoutes.booking;
        if ($('routeAdmin') && j.typeRoutes.admin) $('routeAdmin').value = j.typeRoutes.admin;
      }
    } catch (e) { el.textContent = 'Status nicht abrufbar.'; }
  })();
  if ($('saveMail')) $('saveMail').addEventListener('click', async () => {
    const body = {
      mail_mode: $('mailMode') ? $('mailMode').value : 'brevo',
      mail_quota_policy: $('mailQuota') ? $('mailQuota').value : 'queue_next_day',
      mail_route_optin: $('routeOptin') ? $('routeOptin').value : '',
      mail_route_booking: $('routeBooking') ? $('routeBooking').value : '',
      mail_route_admin: $('routeAdmin') ? $('routeAdmin').value : ''
    };
    // Provider-Wechsel (mail_mode) + Quota-Policy werden live in db.site_settings
    // gespeichert. lib/mail.js liest mail_mode aus DB (Override > Env).
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify(body) });
    const ok = $('mailSaved');
    if (ok) { ok.style.display = r.ok ? 'block' : 'none'; }
  });

  // ---- Tabs ----
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.tabpanel').forEach(x => x.classList.add('hidden'));
      t.classList.add('active'); t.setAttribute('aria-selected', 'true');
      document.querySelector(`.tabpanel[data-panel="${t.dataset.tab}"]`).classList.remove('hidden');
      if (t.dataset.tab === 'team') renderAdmins();
      if (t.dataset.tab === 'users') renderUsers();
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
    ['impressum', 'agb', 'privacy', 'impressum_extra'].forEach(k => { if ($(k)) $(k).value = s[k] || ''; });
    await renderSetup();
    // Impressum-Vorschau aus der generierten API laden
    const imp = await api('/api/impressum');
    if (imp.ok) { const j = await imp.json(); if ($('impressum')) $('impressum').value = j.impressum || ''; }
  }

  // "Pflichtdaten ergänzen" → Website-Tab öffnen + zu den Impressum-Feldern scrollen
  $('gotoWebsite') && $('gotoWebsite').addEventListener('click', () => {
    const t = document.querySelector('.tab[data-tab="website"]');
    if (t) t.click();
    setTimeout(() => { const el = $('owner_name'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el) el.focus({ preventScroll: true }); }, 120);
  });

  $('saveImpressumExtra') && $('saveImpressumExtra').addEventListener('click', async () => {
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify({ impressum_extra: $('impressum_extra').value }) });
    if (r.ok) {
      const imp = await api('/api/impressum');
      if (imp.ok) { const j = await imp.json(); if ($('impressum')) $('impressum').value = j.impressum || ''; }
      alert('Zusatz gespeichert — Impressum aktualisiert.');
    } else alert('Fehler.');
  });

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

  async function renderUsers() {
    const r = await api('/api/admin/users');
    if (!r.ok) { $('userList').innerHTML = '<p class="muted">Kein Zugriff.</p>'; return; }
    const j = await r.json();
    const users = j.users || [];
    if (!users.length) { $('userList').innerHTML = '<p class="muted">Noch keine Nutzer registriert.</p>'; return; }
    const roleLabel = { extra: 'Komparse', production: 'Produktion', admin: 'Admin' };
    $('userList').innerHTML = '<table><tr><th>E-Mail</th><th>Rolle</th><th>Verifiziert</th><th></th></tr>' +
      users.map(u => {
        const canDel = !u.is_main_admin;
        return '<tr><td>' + esc(u.email) + '</td><td>' + (roleLabel[u.role] || u.role) + '</td>' +
          '<td>' + (u.email_verified ? '✓' : '—') + '</td>' +
          '<td><button class="btn sm danger" data-del="' + u.id + '"' + (canDel ? '' : ' disabled title="Haupt-Admin kann nicht gelöscht werden"') + '>Löschen</button></td></tr>';
      }).join('') + '</table>';
    $('userList').querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.del;
        if (!confirm('Nutzer endgültig löschen? Alle Daten (Profil, Fotos, Buchungen) werden entfernt.')) return;
        const r2 = await api('/api/admin/users', { method: 'DELETE', body: JSON.stringify({ id }) });
        if (r2.ok) renderUsers();
        else { const e = await r2.json().catch(() => ({})); alert('Fehler: ' + (e.error || 'unbekannt')); }
      });
    });
  }

  // Init
  loadWebsite();
  loadLegal();
});
