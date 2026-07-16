'use strict';
// lib/smtp-relay.js — EIGENES SMTP-Relay (Open-Source-Nachbau, Null-Dependency).
//
// WARUM: Wer nicht von einem Dienst (Brevo) abhängig sein will, hostet sein
// eigenes Relay. Das hier ist ein minimaler, aber vollständiger SMTP-Sender
// mit DKIM-Signatur (rein Node crypto — KEIN postfix/opendkim nötig).
//
// WAS DU DACHAUS MACHST (extern, ich kann's nicht allein):
//   1) Eigene Domain (z.B. kast.de) kaufen.
//   2) DNS-TXT setzen (Anleitung: /docs/eigene-mail-infra.md):
//      - SPF:    v=spf1 a mx ip4:<DEINE-IP> ~all
//      - DKIM:   kast._domainkey TXT (öffentlicher Schlüssel aus generateDkim())
//      - DMARC:  _dmarc TXT v=DMARC1; p=quarantine; rua=mailto:admin@kast.de
//   3) Port 25 (outbound) + 587 (submission) in Router/ZimaOS freigeben.
//   4) OWN_SMTP_* in .env setzen, MAIL_MODE=own (oder failover_own).
//
// SICHERHEIT: nur als Relay für KAST selbst, nicht offen für die Welt
// (kein Open-Relay!). Auth über SMTP_USER/SMTP_PASS (Env).

const net = require('net');
const tls = require('tls');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ───── DKIM ─────
// Generiert ein RSA-Keypair für DKIM. Privater Schlüssel bleibt auf dem Server
// (Env OWN_DKIM_PRIVATE oder Datei), öffentlicher kommt als DNS-TXT.
function generateDkim(domain, selector) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  const pubB64 = publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  return {
    privateKey,
    publicKey,
    dnsTxt: `${selector}._domainkey.${domain} IN TXT "v=DKIM1; k=rsa; p=${pubB64}"`,
    dnsValue: `v=DKIM1; k=rsa; p=${pubB64}`
  };
}

// Lädt privaten DKIM-Key (aus Env oder Datei)
function loadDkimPrivate() {
  if (process.env.OWN_DKIM_PRIVATE) return process.env.OWN_DKIM_PRIVATE;
  const f = path.join(__dirname, '..', 'data', 'dkim-private.pem');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  return null;
}

// Erzeugt DKIM-Signature-Header für eine Mail
function dkimSign({ domain, selector, privateKey, from, headers, body }) {
  const d = crypto.createSign('RSA-SHA256');
  const bodyHash = crypto.createHash('sha256').update(body).digest('base64');
  // signierter Header-Block (kanonisch simple)
  const signHeaders = ['from', 'to', 'subject', 'date', 'message-id'];
  const h = signHeaders.map(h => h + ':' ).join(' ');
  const canon = signHeaders.map(s => {
    const line = headers[s] || '';
    return s + ':' + line.replace(/\s+/g, ' ').trim();
  }).join('\r\n');
  const bh = `DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/simple; d=${domain}; s=${selector}; h=${h}; bh=${bodyHash}; b=`;
  d.update(canon + '\r\n' + bh.replace(/b=$/, ''));
  const sig = d.sign(privateKey, 'base64');
  return bh + sig;
}

// ───── SMTP-SEND (eigenes Relay, mit DKIM) ─────
async function sendViaOwnRelay({ to, subject, text, from, domain }) {
  const host = process.env.OWN_SMTP_HOST;
  const port = Number(process.env.OWN_SMTP_PORT) || 587;
  const user = process.env.OWN_SMTP_USER;
  const pass = process.env.OWN_SMTP_PASS;
  if (!host) throw new Error('OWN_SMTP_HOST nicht gesetzt');

  const f = from || (process.env.MAIL_FROM || 'KAST <noreply@kast.example>');
  const d = domain || (f.match(/<([^>]+@([^>]+))>/) ? RegExp.$2 : (f.split('@')[1] || 'localhost'));
  const selector = process.env.OWN_DKIM_SELECTOR || 'kast';
  const priv = loadDkimPrivate();

  const date = new Date().toUTCString();
  const messageId = `<${Date.now()}.${crypto.randomBytes(4).toString('hex')}@${d}>`;
  const headers = {
    from: f,
    to,
    subject,
    date,
    'message-id': messageId
  };
  let raw = `From: ${f}\r\nTo: ${to}\r\nSubject: ${subject}\r\nDate: ${date}\r\nMessage-ID: ${messageId}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n`;
  if (priv) {
    const sig = dkimSign({ domain: d, selector, privateKey: priv, from: f, headers, body: text || '' });
    raw += sig + '\r\n';
  }
  raw += '\r\n' + (text || '') + '\r\n';

  // SMTP-Aushandlung
  return new Promise((resolve, reject) => {
    const socket = (port === 465 ? tls : net).connect(port, host, () => {});
    let buf = ''; let step = 0; const lines = [];
    const cmd = (c) => { if (c) socket.write(c + '\r\n'); };
    socket.setTimeout(20000);
    socket.on('timeout', () => { socket.destroy(); reject(new Error('SMTP timeout')); });
    socket.on('error', (e) => reject(e));
    socket.on('data', (dt) => {
      buf += dt.toString();
      const parts = buf.split('\r\n'); buf = parts.pop();
      for (const line of parts) {
        lines.push(line);
        const code = line.slice(0, 3);
        if (line[3] === '-') continue;
        try {
          if (step === 0 && code === '220') { step = 1; cmd('EHLO kast-relay'); }
          else if (step === 1 && code === '250') {
            if (port !== 465) { step = 2; cmd('STARTTLS'); }
            else { step = 3; authenticate(); }
          }
          else if (step === 2 && code === '220') {
            const sec = tls.connect({ socket, rejectUnauthorized: true }, () => { socket = sec; step = 3; cmd('EHLO kast-relay'); });
            socket = sec;
          }
          else if (step === 3 && code === '250') { step = 4; authenticate(); }
          else if (step === 4 && (code === '235')) { step = 5; cmd('MAIL FROM:<' + (f.match(/<([^>]+)>/) ? RegExp.$1 : f) + '>'); }
          else if (step === 5 && code === '250') { step = 6; cmd('RCPT TO:<' + to + '>'); }
          else if (step === 6 && code === '250') { step = 7; cmd('DATA'); }
          else if (step === 7 && code === '354') { step = 8; cmd(raw + '.\r\n'); }
          else if (step === 8 && code === '250') { step = 9; cmd('QUIT'); }
          else if (step === 9) { socket.end(); resolve({ ok: true, provider: 'own' }); }
          else if (code[0] === '4' || code[0] === '5') { socket.destroy(); reject(new Error('SMTP ' + code + ': ' + line)); }
        } catch (e) { socket.destroy(); reject(e); }
      }
    });
    function authenticate() {
      if (!user || !pass) { step = 4; cmd('MAIL FROM:<' + (f.match(/<([^>]+)>/) ? RegExp.$1 : f) + '>'); return; }
      cmd('AUTH LOGIN');
      setTimeout(() => cmd(Buffer.from(user).toString('base64')), 50);
      setTimeout(() => cmd(Buffer.from(pass).toString('base64')), 120);
      step = 4;
    }
  });
}

module.exports = { generateDkim, sendViaOwnRelay, loadDkimPrivate };
