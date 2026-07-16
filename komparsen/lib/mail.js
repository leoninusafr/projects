'use strict';
// lib/mail.js — Null-Dependency E-Mail-Versand für KAST.
//
// PROVIDER (MAIL_MODE, Env):
//   brevo  -> Brevo REST-API (EU/Schrems-II, Free 300/Tag, 0€)
//   smtp   -> eigenes SMTP (z.B. Open-Source Postfix/OpenDKIM auf eigenem Server)
//   own    -> eigenes Relay (VORBEREITET, noch NICHT aktiv — MAIL_MODE=own schaltet es ein)
//   mock   -> Datei-Mock (Entwicklung, wenn nichts konfiguriert)
//
// SKALIERUNG (Quota-Policy, Env MAIL_QUOTA_POLICY):
//   queue_next_day -> bei Brevo-Tageslimit: Mail in Pending-Queue, nächster Tag
//   failover_own   -> bei Brevo-Tageslimit: eigenes Relay übernimmt
//
// TYP-ROUTING: sendMail({type:'optin'|'booking'|'admin'}) -> Policy kann pro Typ
//               den Ziel-Provider überschreiben (z.B. booking immer brevo=Garantie).
//
// Credentials KOMMEN IMMER aus Env (nie db.json/Code). Secrets niemals ins Panel.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Eigenes Relay (Open-Source-Nachbau, DKIM-Signatur)
const relay = require('./smtp-relay');

// Lazy require, um Zirkularität zu vermeiden (db.js requiret mail nicht).
let _db = null;
function db() { if (!_db) _db = require('./db'); return _db; }

const FROM = process.env.MAIL_FROM || 'KAST <noreply@kast.example>';
const PUBLIC_URL = (process.env.APP_PUBLIC_URL || '').replace(/\/+$/, '');

// MAIL_MODE: Env als Default, aber Admin-Panel-Override (db.site_settings 'mail_mode')
// hat Vorrang, damit du im Panel umschalten kannst OHNE Server-Neustart.
async function getMode() {
  try {
    const v = await db().getSetting('mail_mode');
    if (['brevo', 'smtp', 'own', 'mock'].includes(v)) return v;
  } catch (e) {}
  return (process.env.MAIL_MODE || (process.env.MAIL_PROVIDER === 'brevo' && process.env.MAIL_API_KEY ? 'brevo' : 'mock')).toLowerCase();
}

const QUOTA_POLICY = (process.env.MAIL_QUOTA_POLICY || 'queue_next_day').toLowerCase();
// Typ -> bevorzugter Provider (default: active MODE). Admin kann im Panel überschreiben
// (db.site_settings: mail_route_optin / mail_route_booking / mail_route_admin).
const TYPE_ROUTE = {
  optin: (process.env.MAIL_ROUTE_OPTIN || '').toLowerCase() || MODE_FALLBACK(),
  booking: (process.env.MAIL_ROUTE_BOOKING || '').toLowerCase() || MODE_FALLBACK(),
  admin: (process.env.MAIL_ROUTE_ADMIN || '').toLowerCase() || MODE_FALLBACK(),
};
function MODE_FALLBACK() { return (process.env.MAIL_MODE || 'brevo').toLowerCase(); }

// Holt Admin-Override für Typ-Routing aus der DB (falls gesetzt).
async function typeRouteFromDb() {
  try {
    const r = {};
    for (const t of ['optin', 'booking', 'admin']) {
      const v = await db().getSetting('mail_route_' + t);
      if (v && ['brevo', 'own', 'smtp'].includes(v)) r[t] = v;
    }
    return r;
  } catch (e) { return {}; }
}

// Baut aus einer (relativen) Pfad-URL eine absolute URL, sofern APP_PUBLIC_URL gesetzt ist.
// Opt-In-Links MÜSSEN absolut sein (Mails werden woanders geöffnet).
function publicUrl(p) {
  if (!PUBLIC_URL) return p;
  if (/^https?:\/\//i.test(p)) return p;
  return PUBLIC_URL + p;
}

function parseFrom() {
  // "Name <addr@x>" -> { name, email }
  const m = String(FROM).match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || 'KAST', email: m[2].trim() };
  return { name: 'KAST', email: String(FROM).trim() };
}

// Welcher Provider für diesen Typ (Typ-Routing, Fallback auf MODE)?
// Admin-Override aus DB (mail_route_*) hat Vorrang vor Env.
async function providerForType(type) {
  const overrides = await typeRouteFromDb();
  if (type && overrides[type]) return overrides[type];
  if (type && TYPE_ROUTE[type]) return TYPE_ROUTE[type];
  return MODE;
}

// Liefert den aktiven Sende-Fn für einen Provider-String
async function dispatch(provider, msg) {
  if (provider === 'brevo' && process.env.MAIL_API_KEY) return brevoSend(msg);
  if (provider === 'smtp' && process.env.SMTP_HOST) return smtpSend(msg);
  if (provider === 'own') {
    // EIGENES RELAY — vorbereitet, aktiv nur wenn MAIL_MODE=own + OWN_SMTP_HOST.
    if (process.env.OWN_SMTP_HOST) return relay.sendViaOwnRelay(msg);
    return mockSend(msg);
  }
  return mockSend(msg);
}

async function sendMail({ to, subject, text, html }) {
  const mode = await getMode();
  return dispatch(mode, { to, subject, text, html });
}
// --- Brevo REST (empfohlen: kostenlos, EU, 300/Tag) ---
async function brevoSend({ to, subject, text, html }) {
  const from = parseFrom();
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.MAIL_API_KEY,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      sender: from,
      to: [{ email: to }],
      subject: subject,
      textContent: text || '',
      htmlContent: html || undefined
    })
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error('Brevo ' + res.status + ': ' + err.slice(0, 200));
  }
  return { ok: true, provider: 'brevo' };
}

// --- Minimaler SMTP+STARTTLS-Client (eigene Domain / beliebiger SMTP) ---
function smtpSend({ to, subject, text }) {
  const tls = require('tls');
  const net = require('net');
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || (process.env.SMTP_TLS === '1' ? 465 : 587);
  const implicitTLS = port === 465;
  const from = parseFrom();

  return new Promise((resolve, reject) => {
    const socket = (implicitTLS ? tls : net).connect(port, host, () => {});
    let buf = '';
    let step = 0;
    const lines = [];
    function cmd(c) { if (c) socket.write(c + '\r\n'); }
    function ok(code) { return lines.some(l => l.startsWith(code)); }

    socket.setTimeout(15000);
    socket.on('timeout', () => { socket.destroy(); reject(new Error('SMTP timeout')); });
    socket.on('error', (e) => reject(e));

    socket.on('data', (d) => {
      buf += d.toString();
      const parts = buf.split('\r\n');
      buf = parts.pop();
      for (const line of parts) {
        lines.push(line);
        const code = line.slice(0, 3);
        const cont = line[3] === '-';
        if (cont) continue;

        try {
          if (step === 0 && code === '220') {
            step = 1; cmd('EHLO kast'); 
          } else if (step === 1 && code === '250') {
            if (!implicitTLS) { step = 2; cmd('STARTTLS'); }
            else { step = 3; auth(); }
          } else if (step === 2 && code === '220') {
            // TLS neu aushandeln
            const secure = tls.connect({ socket, rejectUnauthorized: true }, () => {
              socket = secure; step = 3; cmd('EHLO kast');
            });
            socket = secure;
          } else if (step === 3 && code === '250') {
            step = 4; auth();
          } else if (step === 4 && (code === '235' || code === '334')) {
            step = 5; cmd('MAIL FROM:<' + from.email + '>');
          } else if (step === 5 && code === '250') {
            step = 6; cmd('RCPT TO:<' + to + '>');
          } else if (step === 6 && code === '250') {
            step = 7; cmd('DATA');
          } else if (step === 7 && code === '354') {
            step = 8;
            const msg = 'From: ' + FROM + '\r\n' +
              'To: ' + to + '\r\n' +
              'Subject: ' + subject + '\r\n' +
              'MIME-Version: 1.0\r\n' +
              'Content-Type: text/plain; charset=utf-8\r\n\r\n' +
              (text || '') + '\r\n.\r\n';
            cmd(msg);
          } else if (step === 8 && code === '250') {
            step = 9; cmd('QUIT');
          } else if (step === 9) {
            socket.end(); resolve({ ok: true, provider: 'smtp' });
          } else if (code[0] === '4' || code[0] === '5') {
            socket.destroy(); reject(new Error('SMTP ' + code + ': ' + line));
          }
        } catch (e) { socket.destroy(); reject(e); }
      }
    });

    function auth() {
      const u = Buffer.from(process.env.SMTP_USER).toString('base64');
      const p = Buffer.from(process.env.SMTP_PASS).toString('base64');
      cmd('AUTH LOGIN');
      // AUTH LOGIN erwartet User/Pass als zwei base64-Zeilen
      setTimeout(() => cmd(u), 50);
      setTimeout(() => cmd(p), 120);
    }
  });
}

// --- Mock (Entwicklung) ---
async function mockSend({ to, subject, text }) {
  const dir = path.join(__dirname, '..', 'data', 'mailbox');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, Date.now() + '_' + crypto.randomBytes(3).toString('hex') + '.txt');
  fs.writeFileSync(f, `To: ${to}\nSubject: ${subject}\nProvider: MOCK (kein echter Versand — MAIL_PROVIDER/SMTP konfigurieren)\n\n${text}\n`);
  return { ok: true, provider: 'mock' };
}

// Status für Admin-Panel
async function isConfigured() {
  const mode = await getMode();
  const providers = {};
  if (process.env.MAIL_API_KEY) providers.brevo = true;
  if (process.env.SMTP_HOST) providers.smtp = true;
  if (process.env.OWN_SMTP_HOST) providers.own = true;
  // "configured" = aktiver MODE hat echte Credentials (mock zählt NICHT als konfiguriert)
  const configured = mode === 'mock' ? false : !!providers[mode];
  return {
    configured,
    provider: mode,
    quotaPolicy: QUOTA_POLICY,
    typeRoutes: TYPE_ROUTE,
    availableProviders: providers,
    brevoDailyLimit: 300 // Free-Tier; bei Bezahlplan anpassen (Env MAIL_BREVO_DAILY_LIMIT)
  };
}

// --- Pending-Queue (Skalierung): Brevo Free = 300/Tag.
// Wenn ein Versand fehlschlägt (z.B. quota exceeded), landet die Mail
// in data/mailbox/pending/ und wird vom nexten Flush nachgeholt.
// So geht KEINE Opt-In/Buchung verloren, wenn das Business >300/Tag wächst.
const PENDING_DIR = path.join(__dirname, '..', 'data', 'mailbox', 'pending');
function queuePending(msg) {
  try {
    fs.mkdirSync(PENDING_DIR, { recursive: true });
    const f = path.join(PENDING_DIR, Date.now() + '_' + crypto.randomBytes(3).toString('hex') + '.json');
    fs.writeFileSync(f, JSON.stringify(Object.assign({ queued_at: new Date().toISOString() }, msg)));
    return true;
  } catch (e) { console.error('[mail-queue] fehler', e.message); return false; }
}

// Tageslimit-Verstoß erkennen (Brevo-Response enthält "quota" / 429 / 402)
function isQuotaError(r, e) {
  if (e && /quota|429|402|limit/i.test(e.message || '')) return true;
  if (r && (r.status === 429 || r.status === 402 || r.status === 400) &&
      r.body && /quota|limit|exceeded/i.test(String(r.body))) return true;
  return false;
}

async function sendMailSafe(msg) {
  const type = msg.type || 'default';
  const target = await providerForType(type);
  const mode = await getMode();
  // Versand über Ziel-Provider (Brevo/SMTP/own)
  try {
    const r = await dispatch(target, msg);
    if (r && r.ok) return r;
    // Fehler -> Quota-Policy prüfen
    if (target === 'brevo' && isQuotaError(r, null)) {
      if (QUOTA_POLICY === 'failover_own' && process.env.OWN_SMTP_HOST) {
        const f = await dispatch('own', msg); // eigenes Relay übernimmt
        if (f.ok) return Object.assign({ failover: true }, f);
      }
      queuePending(msg); // nächster Tag (queue_next_day default)
      return Object.assign({ ok: false, queued: true, reason: 'quota' }, r || {});
    }
    if (target !== 'mock') { queuePending(msg); return Object.assign({ ok: false, queued: true }, r || {}); }
    return r || { ok: false };
  } catch (e) {
    if (target === 'brevo' && QUOTA_POLICY === 'failover_own' && process.env.OWN_SMTP_HOST) {
      try { const f = await dispatch('own', msg); if (f.ok) return Object.assign({ failover: true }, f); } catch (_) {}
    }
    if (target !== 'mock') { queuePending(msg); return { ok: false, queued: true, error: e.message }; }
    return { ok: false, error: e.message };
  }
}

// Flusht gemanagte Pending-Mails (z.B. per Cron alle 24h).
// Gibt Anzahl erfolgreich zugestellter zurück.
async function flushPending() {
  if (!fs.existsSync(PENDING_DIR)) return 0;
  const files = fs.readdirSync(PENDING_DIR).filter(f => f.endsWith('.json'));
  let done = 0;
  for (const f of files) {
    try {
      const msg = JSON.parse(fs.readFileSync(path.join(PENDING_DIR, f), 'utf8'));
      const r = await sendMail(msg);
      if (r.ok) { fs.unlinkSync(path.join(PENDING_DIR, f)); done++; }
    } catch (e) { /* bleibt pending für nächsten Versuch */ }
  }
  return done;
}

module.exports = { sendMail, sendMailSafe, flushPending, publicUrl, isConfigured, parseFrom, providerForType };
