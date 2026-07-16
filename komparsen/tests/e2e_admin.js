'use strict';
// Erweiterter E2E-Test für KAST — fokus: Admin-Einladung, Rechte, Setup-Status,
// neue Seiten, Cookie-Banner-Skript. Build auf tests/e2e.js auf.
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
let cookie = '';

function reqAnon(method, p, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(BASE + p);
    const r = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search, method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    }, res => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { let j; try { j = JSON.parse(buf); } catch { j = buf; } resolve({ status: res.statusCode, body: j, raw: buf }); });
    });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}
function req(method, p, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(BASE + p);
    const r = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search, method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    }, res => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { if (res.headers['set-cookie']) cookie = res.headers['set-cookie'].map(s => s.split(';')[0]).join('; '); let j; try { j = JSON.parse(buf); } catch { j = buf; } resolve({ status: res.statusCode, body: j, raw: buf }); });
    });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}

const log = (...a) => console.log(...a);
const assert = (cond, msg) => { if (!cond) { console.error('  ✗ FAIL: ' + msg); process.exitCode = 1; } else log('  ✓ ' + msg); };

(async () => {
  log('\n=== A. NEUE STATISCHE SEITEN ===');
  for (const p of ['/team.html', '/consent.js', '/styles.css']) {
    const r = await req('GET', p);
    assert(r.status === 200, p + ' -> ' + r.status);
  }

  log('\n=== B. SETUP-STATUS (Admin-Panel "!"-Marker Backend) ===');
  // Gast darf Setup-Status NICHT (nur admin)
  let r = await reqAnon('GET', '/api/admin/setup-status');
  assert(r.status === 401 || r.status === 403, 'Gast Setup-Status -> gesperrt (' + r.status + ')');

  log('\n=== C. ADMIN EINLADUNG + RECHTE ===');
  // admin anlegen + verifizieren + login
  const aemail = 'admin2_' + Date.now() + '@test.de';
  r = await reqAnon('POST', '/api/auth/register', { email: aemail, password: 'geheim123', role: 'admin' });
  assert(r.status === 200 && r.body.userId, 'Admin registrieren -> 200');
  const mdir = path.join(__dirname, '..', 'data', 'mailbox');
  const files = fs.readdirSync(mdir).sort();
  const txt = fs.readFileSync(mdir + '/' + files[files.length - 1], 'utf8');
  const m = txt.match(/token=([^&]+)&email=([^\s]+)/);
  await req('GET', '/api/auth/verify?token=' + decodeURIComponent(m[1]) + '&email=' + decodeURIComponent(m[2]));
  await req('POST', '/api/auth/login', { email: aemail, password: 'geheim123' });
  assert(cookie, 'Admin eingeloggt (Cookie)');

  // Setup-Status als Admin
  r = await req('GET', '/api/admin/setup-status');
  assert(r.status === 200 && r.body.total >= 9, 'Admin Setup-Status -> total=' + r.body.total + ', missing=' + r.body.missing.length);

  // Admin-Einladung
  const inviteEmail = 'newadmin_' + Date.now() + '@test.de';
  r = await req('POST', '/api/admin/invite', { email: inviteEmail, scope: 'website' });
  assert(r.status === 200 && r.body.inviteLink && r.body.scope === 'website', 'Admin einladen (scope=website) -> Link + Scope');
  const inviteLink = r.body.inviteLink;
  const invToken = inviteLink.match(/invite=([^&]+)/)[1];

  // Eingeladener Admin registriert sich mit Token
  const regBody = { email: inviteEmail, password: 'geheim123', role: 'admin', invute: invToken };
  r = await reqAnon('POST', '/api/auth/register', regBody);
  assert(r.status === 200, 'Eingeladener Admin registriert sich mit Token -> 200');

  // Liste der Admins (ohne Token sichtbar)
  r = await req('GET', '/api/admin/admins');
  assert(r.status === 200 && Array.isArray(r.body) && r.body.length >= 1, 'Admin-Liste -> ' + (r.body.length) + ' Einträge, keine Tokens sichtbar');
  const newAdmin = r.body.find(a => a.email === inviteEmail);
  assert(newAdmin && newAdmin.token === undefined, 'Token in Liste NICHT exposed (DSGVO)');
  assert(newAdmin && newAdmin.role_scope === 'website', 'Scope korrekt übernommen (website)');

  // Scope ändern
  r = await req('PATCH', '/api/admin/admins', { id: newAdmin.id, scope: 'legal' });
  assert(r.status === 200 && r.body.ok, 'Scope ändern -> ok');
  r = await req('GET', '/api/admin/admins');
  const updated = r.body.find(a => a.id === newAdmin.id);
  assert(updated && updated.role_scope === 'legal', 'Scope nach Änderung = legal');

  // Widerrufen
  r = await req('PATCH', '/api/admin/admins', { id: newAdmin.id, revoke: true });
  assert(r.status === 200 && r.body.ok, 'Admin-Rechte entziehen -> ok');
  r = await req('GET', '/api/admin/admins');
  const revoked = r.body.find(a => a.id === newAdmin.id);
  assert(revoked && revoked.revoked_at, 'Widerruf verzeichnet (revoked_at gesetzt)');

  log('\n=== D. SETTINGS SCHREIBEN (Admin) ===');
  r = await req('PUT', '/api/settings', { company_name: 'Kast Komparsen', owner_name: 'Leon', owner_address: 'Beispielweg 5', owner_city: '20095 Hamburg', owner_email: 'hallo@kast.de', owner_phone: '+49 40 123456', domain: 'kast.de', agb: 'AGB Text', privacy: 'Datenschutz Text' });
  assert(r.status === 200 && r.body.ok, 'Settings (Pflichtfelder) speichern -> ok');
  r = await req('GET', '/api/admin/setup-status');
  assert(r.body.done === true, 'Nach Settings: setup_status.done = true (alle Pflichtfelder)');

  log('\n=== FERTIG ===');
  if (process.exitCode) log('\nES GAB FEHLER ❌'); else log('\nALLE ERWEITERTEN TESTS GRÜN ✅');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
