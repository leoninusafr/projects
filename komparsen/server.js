'use strict';
// KAST — Null-Dependency Node-Server (HTTP + API + statische Dateien).
// Datenschicht: lokale JSON (lib/db.js) oder Supabase (lib/db-supabase.js),
// sobald SUPABASE_URL + SUPABASE_ANON_KEY gesetzt sind. Gleiche Schnittstelle.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const db = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  ? require('./lib/db-supabase')
  : require('./lib/db');
const auth = require('./lib/auth');
const mail = require('./lib/mail');
const { exportBookings } = require('./lib/export');
const notify = require('./lib/notify');
const { newId, esc, plusMonths, ageFromDob, isEmail, hashPassword, verifyPassword } = require('./lib/util');

const PORT = process.env.PORT || 4173;
// WICHTIG: an alle Interfaces binden (0.0.0.0), damit ein Reverse-Proxy /
// Port-Forwarding des Hosts (z. B. ZimaOS) den Server von außen erreichbar macht.
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

// --- Brute-Force-Schutz: einfaches Rate-Limit auf Login/Register ---
// (In-Memory pro Prozess; für Multi-Instanz später durch Redis ersetzen.)
const RATE = { windowMs: 10 * 60 * 1000, max: 20, hits: new Map() };
function rateLimited(key) {
  const now = Date.now();
  const e = RATE.hits.get(key) || { count: 0, first: now };
  if (now - e.first > RATE.windowMs) { e.count = 0; e.first = now; }
  e.count++;
  RATE.hits.set(key, e);
  return e.count > RATE.max;
}

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ 'Cache-Control': 'no-store' }, SECURITY_HEADERS, headers || {}));
  res.end(body);
}
// Security-Header (DSGVO/Sicherheit — Produktion)
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
};
function json(res, code, obj) { send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json' }); }
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 12e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
function getCookie(req, name) {
  const c = req.headers.cookie || '';
  const m = c.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function setCookie(res, name, val, opts) {
  opts = opts || {};
  let s = name + '=' + encodeURIComponent(val) + '; Path=/; SameSite=Lax';
  if (opts.maxAge) s += '; Max-Age=' + opts.maxAge;
  if (opts.httpOnly !== false) s += '; HttpOnly';
  return s;
}

// --- Routen ---
async function handleApi(req, res, parsed) {
  const p = parsed.pathname;
  const method = req.method;
  const sess = getCookie(req, 'sid');
  const me = await auth.currentUser(sess);

  // Auth
  if (p === '/api/auth/register' && method === 'POST') {
    if (rateLimited('reg:' + (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?')))
      return json(res, 429, { error: 'zu viele Versuche — bitte später erneut' });
    const b = await parseBody(req);
    let role = b.role === 'production' || b.role === 'admin' ? b.role : 'extra';
    let adminScope = 'all';
    // Admin-Einladung: Token prüfen -> Rolle 'admin' + Scope übernehmen
    if (role === 'admin' && b.invite) {
      const inv = await db.getAdminByToken(b.invite);
      if (!inv) return json(res, 400, { error: 'Ungültige oder abgelaufene Einladung' });
      if (inv.email !== String(b.email || '').toLowerCase().trim())
        return json(res, 400, { error: 'E-Mail stimmt nicht mit der Einladung überein' });
      adminScope = inv.role_scope || 'all';
    }
    // Produktion: zusätzlich production-Datensatz
    const extra = role === 'production' ? { company: b.extra && b.extra.company } : (b.extra || {});
    try {
      const { userId, verifyLink } = await auth.register({ email: b.email, password: b.password, role, extra });
      if (role === 'admin') {
        // Admin-Account markieren (Scope für spätere Rechte-Prüfung)
        await db.update('users', userId, { admin_scope: adminScope });
      }
      if (role === 'production') {
        await db.insert('productions', { user_id: userId, company: extra.company || '', contact_name: '', created_at: new Date().toISOString() });
      }
      return json(res, 200, { userId, verifyLink });
    } catch (e) { return json(res, 400, { error: e.message }); }
  }

  if (p === '/api/auth/verify' && method === 'GET') {
    const t = parsed.query.token, e = parsed.query.email;
    const redirect = parsed.query.redirect === '1'; // 1 = Browser-Login nach Verify
    try {
      const user = await auth.verifyEmail(t, e);
      // Nach erfolgreichem Opt-In direkt einloggen (Token = ausreichender Besitznachweis),
      // damit Onboarding-Schritte 2–4 mit gültiger Session laufen.
      const sid = auth.signSession(user.id);
      const cookie = setCookie(res, 'sid', sid, { maxAge: 30 * 24 * 3600 });
      if (redirect) {
        res.writeHead(302, { 'Location': '/onboarding.html?done=1', 'Set-Cookie': cookie });
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': cookie });
      return res.end(JSON.stringify({ ok: true }));
    } catch (err) { return json(res, 400, { error: err.message }); }
  }

  if (p === '/api/auth/login' && method === 'POST') {
    if (rateLimited('login:' + (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?')))
      return json(res, 429, { error: 'zu viele Login-Versuche — bitte später erneut' });
    const b = await parseBody(req);
    try {
      const sid = await auth.login({ email: b.email, password: b.password });
      const cookie = setCookie(res, 'sid', sid, { maxAge: 30 * 24 * 3600 });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': cookie });
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) { return json(res, 401, { error: e.message }); }
  }

  if (p === '/api/auth/logout' && method === 'POST') {
    auth.destroySession(sess);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': setCookie(res, 'sid', '', { maxAge: 0 }) });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (p === '/api/auth/me' && method === 'GET') {
    if (!me) return json(res, 401, { error: 'nicht angemeldet' });
    return json(res, 200, { id: me.id, email: me.email, role: me.role });
  }

  // --- Zentrale Auth-Guard ---
  // Öffentlich ohne Login: nur diese Routen. ALLES andere braucht eine gültige Session.
  // (Die einzelnen admin-Routen prüfen zusätzlich die Rolle via need().)
  // WICHTIG (DSGVO): Suche, Fotos und Export sind NICHT öffentlich — nur für
  // eingeloggte Produktion/Admin. Gäste sehen keine Profile, Fotos oder Attribute.
  const publicRoutes = [
    '/api/auth/register', '/api/auth/verify', '/api/auth/login', '/api/auth/logout',
    '/api/settings', '/api/impressum', '/api/stats/public'
  ];
  if (!me && !publicRoutes.includes(p)) {
    return json(res, 401, { error: 'login erforderlich' });
  }
  const need = (roles) => { if (!me) return false; if (roles && !roles.includes(me.role)) return false; return true; };

  // Profil
  if (p === '/api/profile/me' && method === 'PUT') {
    if (!me) return json(res, 401, { error: 'login' });
    const b = await parseBody(req);
    await db.ensureProfile(me.id, Object.assign(b, { updated_at: new Date().toISOString() }));
    return json(res, 200, { ok: true });
  }
  if (p === '/api/profile/me' && method === 'GET') {
    if (!me) return json(res, 401, { error: 'login' });
    const prof = await db.find('profiles', x => x.user_id === me.id);
    return json(res, 200, prof || {});
  }
  if (p === '/api/profile/consents' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'login' });
    const b = await parseBody(req);
    const due = plusMonths(new Date().toISOString(), 6);
    await db.ensureProfile(me.id, {
      consents: b, selfie_due_at: due, selfie_verified_at: new Date().toISOString(),
      visible: true, updated_at: new Date().toISOString()
    });
    return json(res, 200, { ok: true });
  }
  // Account-Löschung (DSGVO Art. 17 — Recht auf Vergessenwerden). Nur eigener Account.
  if (p === '/api/profile/me' && method === 'DELETE') {
    if (!me) return json(res, 401, { error: 'login' });
    await db.deleteUserCascade(me.id);
    auth.destroySession(getCookie(req, 'sid'));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': setCookie(res, 'sid', '', { maxAge: 0 }) });
    return res.end(JSON.stringify({ ok: true }));
  }

  // Fotos
  if (p === '/api/photos' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'login' });
    const b = await parseBody(req);
    if (!b.dataUrl || !b.kind) return json(res, 400, { error: 'fehlend' });
    // Größe begrenzen (Base64-JPEG komprimiert erwartet)
    if (b.dataUrl.length > 3_000_000) return json(res, 413, { error: 'Bild zu groß (komprimieren!)' });
    await db.insert('photos', { user_id: me.id, kind: b.kind, data: b.dataUrl,
      width: b.width || null, height: b.height || null, created_at: new Date().toISOString() });
    return json(res, 200, { ok: true });
  }

  // Suche (NUR für eingeloggte Produktion/Admin — DSGVO: keine öffentliche DB)
  if (p === '/api/search' && method === 'GET') {
    if (!need(['production', 'admin'])) return json(res, 403, { error: 'nur für eingeloggte Produktionen' });
    const q = parsed.query;
    const skills = q.skills ? q.skills.split(',').filter(Boolean) : undefined;
    const res2 = await db.searchExtras({
      gender: q.gender, hair_color: q.hair, eye_color: q.eye, city: q.city,
      min_height: q.min_height, max_height: q.max_height, min_age: q.min_age,
      max_age: q.max_age, skills, q: q.q
    });
    const d = await db.ensure();
    return json(res, 200, res2.map(stripPhoto).map(p => {
      // Portrait-Foto-ID mitliefern, damit Frontend das Bild rendern kann (ohne base64 im Suchergebnis)
      const ph = d.photos.find(x => x.user_id === p.user_id && x.kind === 'portrait');
      return Object.assign({}, p, { photo_id: ph ? ph.id : null });
    }));
  }

  // Foto eines Extras (NUR für eingeloggte Produktion/Admin — DSGVO: keine öffentlichen Fotos)
  if (/^\/api\/photo\/[^/]+$/.test(p) && method === 'GET') {
    if (!need(['production', 'admin'])) return json(res, 403, { error: 'nur für eingeloggte Produktionen' });
    const id = p.split('/')[3];
    const d = await db.ensure();
    const ph = d.photos.find(x => x.id === id && (x.kind === 'portrait' || x.kind === 'full'));
    if (!ph) return json(res, 404, { error: 'nicht gefunden' });
    // Nur zeigen, wenn zugehöriges Profil sichtbar ist
    const pr = d.profiles.find(x => x.user_id === ph.user_id);
    if (!pr || !pr.visible) return json(res, 404, { error: 'nicht gefunden' });
    return json(res, 200, { id: ph.id, data: ph.data, kind: ph.kind, width: ph.width, height: ph.height });
  }

  // Shortlist-Export (NUR für eingeloggte Produktion/Admin)
  if (p === '/api/shortlist/export' && method === 'POST') {
    if (!need(['production', 'admin'])) return json(res, 403, { error: 'nur für eingeloggte Produktionen' });
    const b = await parseBody(req);
    const ids = b.ids || [];
    const all = await db.all('profiles');
    const users = await db.all('users');
    const rows = [['id', 'name', 'alter', 'stadt', 'groesse', 'haare', 'augen']];
    ids.forEach(id => {
      const pr = all.find(x => x.id === id);
      if (!pr) return;
      const u = users.find(x => x.id === pr.user_id);
      rows.push([pr.id, (pr.first_name || '') + ' ' + (pr.last_name || ''),
        ageFromDob(pr.dob) || '', pr.city || '', pr.height_cm || '', pr.hair_color || '', pr.eye_color || '']);
    });
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    send(res, 200, csv, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=kast_auswahl.csv' });
    return;
  }

  // Settings (öffentliches Lesen)
  if (p === '/api/settings' && method === 'GET') {
    const d = await db.ensure();
    const out = {};
    d.site_settings.forEach(s => out[s.key] = s.value);
    return json(res, 200, out);
  }
  // Setup-Status: welche Pflichtfelder (noch) fehlen? (Admin-Panel "!"-Marker)
  if (p === '/api/admin/setup-status' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    return json(res, 200, await db.getSetupStatus());
  }
  // Impressum (automatisch aus Admin-Feldern generiert, öffentlich)
  if (p === '/api/impressum' && method === 'GET') {
    const imp = await db.getImpressum();
    return json(res, 200, { impressum: imp || '' });
  }
  // Öffentliche, anonymisierte Statistik (DSGVO: KEINE Einzelprofile, nur Aggregate)
  if (p === '/api/stats/public' && method === 'GET') {
    const d = await db.ensure();
    const visible = d.profiles.filter(x => x.visible);
    const heights = visible.map(x => Number(x.height_cm)).filter(h => h > 0);
    const hair = new Set(visible.map(x => x.hair_color).filter(Boolean));
    const cities = new Set(visible.map(x => x.city).filter(Boolean));
    return json(res, 200, {
      count: visible.length,
      min_height: heights.length ? Math.min(...heights) : null,
      max_height: heights.length ? Math.max(...heights) : null,
      hair_colors: [...hair],
      city_count: cities.size
    });
  }
  if (p === '/api/settings' && method === 'PUT') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const b = await parseBody(req);
    for (const k of Object.keys(b)) await db.setSetting(k, b[k]);
    return json(res, 200, { ok: true });
  }

  // Buchungen (Kalender)
  if (p === '/api/bookings' && method === 'GET') {
    const d = await db.ensure();
    const bookings = d.bookings.map(b => Object.assign({}, b, { extra_name: nameOf(b.extra_id, d) }));
    return json(res, 200, bookings);
  }
  if (p === '/api/bookings' && method === 'POST') {
    // Produktion (und Admin) dürfen Anfragen stellen; Komparse nicht.
    if (!need(['production', 'admin'])) return json(res, 403, { error: 'nur für Produktionen' });
    const b = await parseBody(req);
    if (!b.extra_id || !b.title || !b.date_start) return json(res, 400, { error: 'Pflichtfelder' });
    const rec = await db.insert('bookings', Object.assign({
      id: newId(), extra_id: b.extra_id, production_id: me.role === 'production' ? me.id : (b.production_id || null),
      title: b.title, location: b.location || '', date_start: b.date_start,
      date_end: b.date_end || b.date_start, day_rate: Number(b.day_rate) || 0,
      status: 'angefragt', created_at: new Date().toISOString()
    }));
    // Benachrichtigung (Email + WhatsApp-Stub) — DSGVO-konform: nur an Betroffene.
    try {
      const d = await db.ensure();
      const extra = d.users.find(u => u.id === b.extra_id);
      const prod = d.users.find(u => u.id === rec.production_id);
      const extraName = extra ? extra.email : 'Komparse';
      const prodName = prod ? (prod.email) : 'Produktion';
      const msg = 'Hallo! Du wurdest für "' + b.title + '" (' + (b.date_start || '') +
        (b.location ? ' in ' + b.location : '') + ') angefragt. Melde dich im Dashboard.';
      if (extra) await mail.sendMail({ to: extra.email, subject: 'Neue Casting-Anfrage: ' + b.title, text: msg });
      // Admin informieren
      const admins = d.users.filter(u => u.role === 'admin');
      for (const a of admins) await mail.sendMail({ to: a.email, subject: 'Neue Anfrage: ' + b.title, text: prodName + ' fragt ' + extraName + ' an.' });
      // WhatsApp (Stub / später echte API)
      await notify.notifyWhatsApp(extra, msg);
    } catch (e) { /* Benachrichtigung darf Anfrage nicht blockieren */ console.error('notify fehler', e.message); }
    return json(res, 200, rec);
  }

  // Admin
  if (p === '/api/admin/stats' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const d = await db.ensure();
    const now = Date.now();
    return json(res, 200, {
      extras: d.profiles.length,
      visible: d.profiles.filter(x => x.visible).length,
      productions: d.productions.length,
      unverified: d.users.filter(u => !u.email_verified).length,
      pending_bookings: d.bookings.filter(b => b.status === 'angefragt').length,
      flag_selfie_due: d.profiles.filter(x => x.selfie_due_at && new Date(x.selfie_due_at).getTime() < now).length
    });
  }
  if (p === '/api/admin/bookings' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const d = await db.ensure();
    return json(res, 200, d.bookings.map(b => Object.assign({}, b, { extra_name: nameOf(b.extra_id, d) })));
  }
  if (p === '/api/bookings/me' && method === 'GET') {
    if (!me) return json(res, 401, { error: 'login' });
    const d = await db.ensure();
    const mine = d.bookings.filter(b => b.extra_id === me.id || b.production_id === me.id);
    return json(res, 200, { bookings: mine });
  }
  if (/^\/api\/admin\/bookings\/[^\/]+\/confirm$/.test(p) && method === 'POST') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const id = p.split('/')[4];
    await db.update('bookings', id, { status: 'bestaetigt' });
    return json(res, 200, { ok: true });
  }
  if (p === '/api/admin/selfie-due' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const d = await db.ensure();
    const now = Date.now();
    const due = d.profiles.filter(x => x.selfie_due_at && new Date(x.selfie_due_at).getTime() < now);
    return json(res, 200, due.map(stripPhoto));
  }
  if (p === '/api/admin/export-adag' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const { csv, total, count } = await exportBookings({ status: undefined });
    send(res, 200, csv, { 'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=adag_export.csv' });
    return;
  }
  // Mail-Versand-Status (Admin: ist echter SMTP/Brevo konfiguriert?)
  if (p === '/api/admin/mail-status' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    return json(res, 200, mail.isConfigured());
  }

  // Admin-Verwaltung: Einladung + Rechte (nur Haupt-Admin bzw. 'all'-Scope)
  if (p === '/api/admin/invite' && method === 'POST') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const b = await parseBody(req);
    try {
      const rec = await db.inviteAdmin({ email: b.email, role_scope: b.scope, invited_by: me.id });
      // Einladungs-Link zusammenbauen (Frontend schickt ihn z. B. per Mail/WhatsApp)
      const link = '/onboarding.html?role=admin&invite=' + encodeURIComponent(rec.token);
      return json(res, 200, { ok: true, id: rec.id, email: rec.email, scope: rec.role_scope, inviteLink: link });
    } catch (e) { return json(res, 400, { error: e.message }); }
  }
  if (p === '/api/admin/admins' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    return json(res, 200, await db.listAdmins());
  }
  if (p === '/api/admin/admins' && method === 'PATCH') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const b = await parseBody(req);
    if (!b.id) return json(res, 400, { error: 'id fehlt' });
    try {
      if (b.scope) await db.setAdminScope(b.id, b.scope);
      if (b.revoke) await db.revokeAdmin(b.id);
      return json(res, 200, { ok: true });
    } catch (e) { return json(res, 400, { error: e.message }); }
  }

  // ---- Account-Self-Service (eingeloggter User) ----
  if (p === '/api/account/delete' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'login erforderlich' });
    const b = await parseBody(req);
    if (!b.confirm || b.confirm !== 'LOSCHEN') return json(res, 400, { error: 'Bestätigung fehlt (erwartet: LOSCHEN)' });
    try { await db.deleteUserCascade(me.id); } catch (e) { return json(res, 500, { error: e.message }); }
    // Session ungültig machen
    if (sess) auth.destroySession(sess);
    setCookie(res, 'sid', '', { maxAge: 0 });
    return json(res, 200, { ok: true });
  }
  if (p === '/api/account/change-password' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'login erforderlich' });
    const b = await parseBody(req);
    if (!b.current || !b.next) return json(res, 400, { error: 'Felder fehlen' });
    if (String(b.next).length < 8) return json(res, 400, { error: 'Neues Passwort zu kurz (min. 8)' });
    const u = await db.getUserById(me.id);
    if (!u || !verifyPassword(b.current, u.salt, u.password_hash)) return json(res, 403, { error: 'Aktuelles Passwort falsch' });
    const salt = crypto.randomBytes(16).toString('hex');
    const { hash: password_hash } = hashPassword(b.next, salt);
    await db.update('users', me.id, { salt, password_hash });
    return json(res, 200, { ok: true });
  }
  if (p === '/api/account/change-email' && method === 'POST') {
    if (!me) return json(res, 401, { error: 'login erforderlich' });
    const b = await parseBody(req);
    if (!b.email || !isEmail(b.email)) return json(res, 400, { error: 'gültige E-Mail erforderlich' });
    const exists = await db.getUserByEmail(b.email);
    if (exists && exists.id !== me.id) return json(res, 409, { error: 'E-Mail bereits vergeben' });
    await db.update('users', me.id, { email: String(b.email).toLowerCase().trim(), email_verified: false });
    return json(res, 200, { ok: true });
  }

  // ---- Admin: Nutzer-Verwaltung ----
  if (p === '/api/admin/users' && method === 'GET') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const users = (await db.all('users')).map(u => ({
      id: u.id, email: u.email, role: u.role, email_verified: !!u.email_verified,
      created_at: u.created_at, is_main_admin: !!u.is_main_admin, revoked: !!u.revoked
    }));
    return json(res, 200, { users });
  }
  if (p === '/api/admin/users' && method === 'DELETE') {
    if (!need(['admin'])) return json(res, 403, { error: 'admin' });
    const b = await parseBody(req);
    if (!b.id) return json(res, 400, { error: 'id fehlt' });
    const target = await db.getUserById(b.id);
    if (!target) return json(res, 404, { error: 'nicht gefunden' });
    if (target.is_main_admin) return json(res, 403, { error: 'Haupt-Admin kann nicht gelöscht werden' });
    if (me && target.id === me.id) return json(res, 403, { error: 'Du kannst dich nicht selbst löschen — nutze den Account-Löschvorgang.' });
    try { await db.deleteUserCascade(b.id); } catch (e) { return json(res, 500, { error: e.message }); }
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'unknown endpoint' });
}

function nameOf(userId, d) {
  const pr = d.profiles.find(x => x.user_id === userId);
  return pr ? ((pr.first_name || '') + ' ' + (pr.last_name || '')) : userId;
}
function stripPhoto(p) { const { consents, ...rest } = p; return rest; }

// Statische Dateien — mit 404-Abfang
function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  // Clean-URLs ohne Dateiendung -> .html anhängen (z.B. /admin -> /admin.html)
  if (path.extname(rel) === '') {
    const cand = rel + '.html';
    const fpCand = path.join(PUBLIC, path.normalize(cand));
    if (fpCand.startsWith(PUBLIC) && fs.existsSync(fpCand)) rel = cand;
  }
  const fp = path.join(PUBLIC, path.normalize(rel));
  if (!fp.startsWith(PUBLIC)) return send(res, 403, 'forbidden'); // path traversal
  fs.readFile(fp, (err, buf) => {
    if (err) {
      // 404-Seite statt leerem Body
      fs.readFile(path.join(PUBLIC, '404.html'), (e2, buf404) => {
        if (e2) return send(res, 404, 'not found');
        send(res, 404, buf404, { 'Content-Type': 'text/html; charset=utf-8' });
      });
      return;
    }
    const ext = path.extname(fp);
    send(res, 200, buf, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname.startsWith('/api/')) {
      await handleApi(req, res, parsed);
    } else {
      serveStatic(req, res, parsed.pathname);
    }
  } catch (e) {
    console.error('ERR', e);
    json(res, 500, { error: 'server error' });
  }
});

// Export-Modus für Serverless (Netlify Functions, Vercel, etc.):
// wenn als Modul eingebunden (nicht direkt ausgeführt) oder NETLIFY=1,
// nicht selbst listenen — nur handleApi exportieren.
const isMain = require.main === module;
if (process.env.NETLIFY === '1' || !isMain) {
  module.exports = { handleApi, url };
} else {
  server.listen(PORT, HOST, () => {
    console.log('KAST läuft auf http://' + HOST + ':' + PORT + ' (gebunden an alle Interfaces)');
  });
}
