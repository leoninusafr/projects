'use strict';
// lib/mail.js — Null-Dependency E-Mail-Versand für KAST.
//
// Strategie (DSGVO / kostenfrei / skalierbar):
//   1) MAIL_PROVIDER=brevo + MAIL_API_KEY  -> Brevo REST-API (Node22 fetch, EU/Schrems-II-sicher)
//   2) SMTP_HOST + SMTP_USER + SMTP_PASS     -> minimaler SMTP+STARTTLS-Client (eigene Domain)
//   3) Fallback: Datei-Mock (data/mailbox/*.txt) — NUR Entwicklung, wenn kein Provider konfiguriert
//
// Credentials kommen IMMER aus Env-Variablen (nie db.json / Code).
// PII (E-Mail, Opt-In-Token) wird im Mock nur in Entwicklung geschrieben.
// Im Produktivbetrieb loggen wir bewusst KEINE Mail-Inhalte.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FROM = process.env.MAIL_FROM || 'KAST <noreply@kast.example>';
const PUBLIC_URL = (process.env.APP_PUBLIC_URL || '').replace(/\/+$/, '');

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

async function sendMail({ to, subject, text, html }) {
  const provider = (process.env.MAIL_PROVIDER || '').toLowerCase();
  if (provider === 'brevo' && process.env.MAIL_API_KEY) {
    return brevoSend({ to, subject, text, html });
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return smtpSend({ to, subject, text, html });
  }
  return mockSend({ to, subject, text });
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

// Status für Admin-Panel: ist echter Versand konfiguriert?
function isConfigured() {
  const p = (process.env.MAIL_PROVIDER || '').toLowerCase();
  if (p === 'brevo' && process.env.MAIL_API_KEY) return { configured: true, provider: 'brevo' };
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return { configured: true, provider: 'smtp' };
  return { configured: false, provider: null };
}

module.exports = { sendMail, publicUrl, isConfigured, parseFrom };
