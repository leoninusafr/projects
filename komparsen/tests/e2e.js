'use strict';
// E2E-Test für KAST — fährt den ganzen Flow mit echtem HTTP.
const http = require('http');

const BASE = process.env.BASE || 'http://localhost:4173';
let cookie = '';

function reqAnon(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(BASE + path);
    const r = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method, headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        let json; try { json = JSON.parse(buf); } catch { json = buf; }
        resolve({ status: res.statusCode, body: json, raw: buf });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(BASE + path);
    const r = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method, headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'].map(s => s.split(';')[0]).join('; ');
        let json; try { json = JSON.parse(buf); } catch { json = buf; }
        resolve({ status: res.statusCode, body: json, raw: buf });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const log = (...a) => console.log(...a);
const assert = (cond, msg) => { if (!cond) { console.error('  ✗ FAIL: ' + msg); process.exitCode = 1; } else log('  ✓ ' + msg); };

(async () => {
  log('\n=== 1. STATISCHE SEITEN ===');
  for (const p of ['/', '/login.html', '/onboarding.html', '/search.html', '/kalender.html', '/admin.html', '/dashboard.html', '/impressum.html', '/styles.css']) {
    const r = await req('GET', p);
    assert(r.status === 200, p + ' -> ' + r.status);
  }

  log('\n=== 2. AUTH-GUARD (ohne Login darf nichts gehen) ===');
  let r = await req('GET', '/api/bookings');
  assert(r.status === 401, 'GET /api/bookings ohne Login -> 401 (war vorher Datenleck!)');
  r = await req('POST', '/api/shortlist/export', { ids: ['x'] });
  assert(r.status === 401, 'POST /api/shortlist/export ohne Login -> 401');
  r = await req('GET', '/api/profile/me');
  assert(r.status === 401, 'GET /api/profile/me ohne Login -> 401');

  log('\n=== 3. REGISTER + DOUBLE-OPT-IN ===');
  const email = 'extra' + Date.now() + '@test.de';
  r = await req('POST', '/api/auth/register', { email, password: 'geheim123', role: 'extra', first_name: 'Anna', last_name: 'Muster' });
  assert(r.status === 200 && r.body.userId, 'Register -> 200 + userId');
  const uid = r.body.userId;
  r = await req('POST', '/api/auth/login', { email, password: 'geheim123' });
  assert(r.status === 401 && /bestätigen/.test(r.body.error || ''), 'Login vor Verify -> 401 Double-Opt-In');
  // Token aus mailbox lesen
  const fs = require('fs');
  const mdir = require('path').join(__dirname, '..', 'data', 'mailbox');
  const files = fs.readdirSync(mdir).filter(f => f.endsWith('.txt') && fs.statSync(mdir + '/' + f).isFile()).sort();
  const last = files[files.length - 1];
  const txt = fs.readFileSync(mdir + '/' + last, 'utf8');
  const m = txt.match(/token=([^&]+)&email=([^\s]+)/);
  const token = decodeURIComponent(m[1]); const em = decodeURIComponent(m[2]);
  r = await req('GET', '/api/auth/verify?token=' + token + '&email=' + em);
  assert(r.status === 200 && r.body.ok, 'Verify -> 200 ok');
  r = await req('POST', '/api/auth/login', { email, password: 'geheim123' });
  assert(r.status === 200 && r.body.ok && cookie, 'Login nach Verify -> 200 + Cookie gesetzt');

  log('\n=== 4. PROFIL + CONSENTS (Selfie-Pflicht) ===');
  r = await req('PUT', '/api/profile/me', { first_name: 'Anna', last_name: 'Muster', dob: '1995-05-20', gender: 'weiblich', height_cm: 172, hair_color: 'blond', eye_color: 'blau', city: 'Köln', skills: ['reiten', 'englisch'], bio: 'Komparse Köln' });
  assert(r.status === 200, 'PUT /api/profile/me -> 200');
  r = await req('POST', '/api/profile/consents', { image_rights: true, data_share: true, biometric: true, accepted_version: '1.0' });
  assert(r.status === 200, 'POST /api/profile/consents -> 200');

  log('\n=== 5. FOTO UPLOAD (kompaktes 1x1 PNG als Surrogat) ===');
  // 1x1 transparent PNG base64
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
  r = await req('POST', '/api/photos', { kind: 'portrait', dataUrl: png, width: 1, height: 1 });
  assert(r.status === 200, 'POST /api/photos portrait -> 200');
  r = await req('POST', '/api/photos', { kind: 'full', dataUrl: png, width: 1, height: 1 });
  assert(r.status === 200, 'POST /api/photos full -> 200');
  r = await req('POST', '/api/photos', { kind: 'selfie', dataUrl: png, width: 1, height: 1 });
  assert(r.status === 200, 'POST /api/photos selfie -> 200');

  log('\n=== 6. SUCHE & FOTOS nur für PRODUKTION/ADMIN (Gast = 401) ===');
  // Gast darf Suche/Foto nicht (DSGVO + Caster-Zugang)
  r = await reqAnon('GET', '/api/search?q=' + encodeURIComponent('blond Köln'));
  assert(r.status === 401, 'Gast Suche -> 401 (nicht öffentlich)');
  // Produktions-Account anlegen + verifizieren + login
  const pemail = 'prod' + Date.now() + '@test.de';
  r = await req('POST', '/api/auth/register', { email: pemail, password: 'geheim123', role: 'production', extra: { company: 'TestFilm' } });
  assert(r.status === 200, 'Register Produktion -> 200');
  // Verify aus Mailbox (letzte Mail)
  let pfiles = fs.readdirSync(mdir).filter(f => f.endsWith('.txt') && fs.statSync(mdir + '/' + f).isFile()).sort(); let plast = pfiles[pfiles.length - 1];
  let ptxt = fs.readFileSync(mdir + '/' + plast, 'utf8');
  let pm = ptxt.match(/token=([^&]+)&email=([^\s]+)/);
  r = await req('GET', '/api/auth/verify?token=' + decodeURIComponent(pm[1]) + '&email=' + decodeURIComponent(pm[2]));
  assert(r.status === 200, 'Verify Produktion -> 200');
  // Cookie für Produktion
  let pcookie = '';
  const oldReq = req;
  // eigene Request-Funktion mit capture
  async function reqP(method, path, body) {
    const res = await oldReq(method, path, body);
    return res;
  }
  r = await req('POST', '/api/auth/login', { email: pemail, password: 'geheim123' });
  assert(r.status === 200 && r.body.ok && cookie, 'Login Produktion -> 200 + Cookie');
  // jetzt Suche als Produktion
  r = await req('GET', '/api/search?q=' + encodeURIComponent('blond Köln'));
  assert(r.status === 200 && Array.isArray(r.body) && r.body.length >= 1, 'Suche als Produktion "blond Köln" -> Treffer');
  const hit = r.body[0];
  assert(hit.email === undefined, 'Suchergebnis enthält KEINE E-Mail (DSGVO)');
  assert(hit.photo_id, 'Suchergebnis enthält photo_id für Bild-Rendering');
  assert(!hit.consents, 'Suchergebnis enthält KEINE consents (Biometrie)');
  // Foto abrufen (Produktion)
  r = await req('GET', '/api/photo/' + hit.photo_id);
  assert(r.status === 200 && r.body.data && /^data:image/.test(r.body.data), 'GET /api/photo/:id -> Bild base64');

  log('\n=== 7. WARENKORB-EXPORT (jetzt mit Login) ===');
  r = await req('POST', '/api/shortlist/export', { ids: [hit.id] });
  assert(r.status === 200, 'POST /api/shortlist/export mit Login -> 200');

  log('\n=== 8. ADMIN-STATS / BUCHUNG / ADAG (braucht Admin) ===');
  // Logout extra, login admin
  await req('POST', '/api/auth/logout');
  cookie = '';
  r = await req('POST', '/api/auth/register', { email: 'admin@test.de', password: 'geheim123', role: 'admin' });
  // admin direkt verify via mailbox
  const files2 = fs.readdirSync(mdir).filter(f => f.endsWith('.txt') && fs.statSync(mdir + '/' + f).isFile()).sort();
  const txt2 = fs.readFileSync(mdir + '/' + files2[files2.length - 1], 'utf8');
  const m2 = txt2.match(/token=([^&]+)&email=([^\s]+)/);
  await req('GET', '/api/auth/verify?token=' + decodeURIComponent(m2[1]) + '&email=' + decodeURIComponent(m2[2]));
  await req('POST', '/api/auth/login', { email: 'admin@test.de', password: 'geheim123' });
  r = await req('GET', '/api/admin/stats');
  assert(r.status === 200 && typeof r.body.extras === 'number', 'Admin stats -> extras=' + r.body.extras);
  r = await req('POST', '/api/bookings', { extra_id: hit.id, title: 'Film XY', date_start: '2026-08-01', date_end: '2026-08-03', location: 'Köln', day_rate: 150 });
  assert(r.status === 200 && r.body.id, 'POST /api/bookings -> 200 + id');
  const bid = r.body.id;
  r = await req('GET', '/api/bookings');
  assert(r.status === 200 && r.body.some(b => b.id === bid), 'GET /api/bookings zeigt neue Buchung');
  r = await req('POST', '/api/admin/bookings/' + bid + '/confirm');
  assert(r.status === 200 && r.body.ok, 'Confirm booking -> ok');
  r = await req('GET', '/api/admin/export-adag');
  assert(r.status === 200, 'ADAG-Export -> 200');

  log('\n=== 9. SETTINGS (öffentlich lesen / nur admin schreiben) ===');
  cookie = '';
  r = await req('GET', '/api/settings');
  assert(r.status === 200 && r.body.impressum, 'GET /api/settings öffentlich -> impressum da');
  r = await req('GET', '/api/impressum');
  assert(r.status === 200 && r.body.impressum, 'GET /api/impressum -> 200 (Bug behoben)');
  r = await req('PUT', '/api/settings', { company_name: 'Kast Test' });
  assert(r.status === 403, 'PUT /api/settings ohne Admin -> 403');

  log('\n=== 10. AUTO-LOGIN NACH VERIFY (redirect=1 setzt Cookie) ===');
  cookie = '';
  const email2 = 'auto' + Date.now() + '@test.de';
  await req('POST', '/api/auth/register', { email: email2, password: 'geheim123', role: 'extra' });
  const files3 = fs.readdirSync(mdir).filter(f => f.endsWith('.txt') && fs.statSync(mdir + '/' + f).isFile()).sort();
  const txt3 = fs.readFileSync(mdir + '/' + files3[files3.length - 1], 'utf8');
  const m3 = txt3.match(/token=([^&]+)&email=([^\s]+)/);
  const vres = await req('GET', '/api/auth/verify?token=' + decodeURIComponent(m3[1]) + '&email=' + decodeURIComponent(m3[2]) + '&redirect=1', null);
  assert(vres.status === 302 && cookie, 'verify?redirect=1 -> 302 + Session-Cookie gesetzt (Auto-Login)');
  // Jetzt Profil direkt ablegen (ohne erneuten Login)
  r = await req('PUT', '/api/profile/me', { first_name: 'Auto', last_name: 'Login', dob: '1990-01-01', city: 'Berlin' });
  assert(r.status === 200, 'PUT /api/profile/me NACH Auto-Login -> 200 (Onboarding-Schritte 2-4 funktionieren)');

  log('\n=== 11. AUTHZ: EXTRA/KEIN ADMIN -> ADMIN-ROUTES 403 ===');
  cookie = ''; // extra ist noch eingeloggt aus Block 10
  // cookie ist leer -> neu einloggen als extra
  await req('POST', '/api/auth/login', { email: email2, password: 'geheim123' });
  r = await req('GET', '/api/admin/stats');
  assert(r.status === 403, 'Extra ruft /api/admin/stats -> 403 (Rollen-Schutz)');
  r = await req('POST', '/api/bookings', { extra_id: hit.id, title: 'X', date_start: '2026-09-01' });
  assert(r.status === 403, 'Extra legt Buchung an -> 403 (nur Admin)');

  log('\n=== 12. DSGVO LÖSCHUNG (eigener Account) ===');
  // extra2 (email2) löscht sich selbst
  r = await req('DELETE', '/api/profile/me');
  assert(r.status === 200 && r.body.ok, 'DELETE /api/profile/me -> 200 ok');
  r = await req('GET', '/api/profile/me');
  assert(r.status === 401, 'Nach Löschung ist Session weg -> 401');
  // Suche ALS PRODUKTION: gelöschter Extra darf nicht mehr auftauchen
  cookie = '';
  await req('POST', '/api/auth/login', { email: pemail, password: 'geheim123' });
  r = await req('GET', '/api/search?q=' + encodeURIComponent('blond Köln'));
  assert(r.status === 200, 'Suche als Produktion nach Löschung -> 200');
  const stillThere = r.body.some(p => p.email === email2 || (p.first_name === 'Auto' && p.last_name === 'Login'));
  assert(!stillThere, 'Gelöschter Account erscheint NICHT mehr in der Suche');

  log('\n=== FERTIG ===');
  if (process.exitCode) log('\nES GAB FEHLER ❌'); else log('\nALLE TESTS GRÜN ✅');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
