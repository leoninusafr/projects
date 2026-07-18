'use strict';
// Benachrichtigungen — Email (via lib/mail, Brevo/SMTP/Mock) und WhatsApp
// (Meta WhatsApp Business Cloud API). Keine Vendor-Lock-in: WhatsApp läuft
// über Metas öffentliche Cloud-API (kostenlos im Dev-Modus, eigene
// Phone-Number-ID). Email über eigenes Relay/Brevo möglich.
// Aktivierung jeweils nur via Env-Var (kein Code-Wechsel nötig):
//   WHATSAPP_TOKEN + WHATSAPP_PHONE_ID  -> WhatsApp live
//   (sonst: Konsolen-Log, keine echte Zustellung)
const mail = require('./mail');
const http = require('http');
const https = require('https');
const { URL } = require('url');

function whatsappEnabled() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

// user: { id, email, phone, ... }  text: Nachricht
async function notifyWhatsApp(user, text) {
  if (!user) return { ok: false, reason: 'no-user' };
  const phone = user.phone || (user.profile && user.profile.phone);
  if (!phone) {
    console.log('[whatsapp] kein Telefon für ' + (user.email || user.id) + ' — übersprungen');
    return { ok: false, reason: 'no-phone' };
  }
  if (!whatsappEnabled()) {
    console.log('[whatsapp-stub] (deaktiviert) an ' + phone + ': ' + text);
    return { ok: false, reason: 'disabled' };
  }
  // Meta Cloud API: POST graph.facebook.com/v19.0/{PHONE_ID}/messages
  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: phone.replace(/[^\d]/g, ''),   // nur Ziffern
    type: 'text',
    text: { preview_url: false, body: text }
  });
  const url = new URL('https://graph.facebook.com/v19.0/' + process.env.WHATSAPP_PHONE_ID + '/messages');
  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.WHATSAPP_TOKEN,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ ok: true, sent: true });
        else { console.error('[whatsapp] API-Fehler', res.statusCode, data); resolve({ ok: false, error: data }); }
      });
    });
    req.on('error', e => { console.error('[whatsapp] netz-fehler', e.message); resolve({ ok: false, error: e.message }); });
    req.write(body);
    req.end();
  });
}

async function notifyEmail(to, subject, body, type) {
  try {
    return await mail.sendMailSafe({ type: type || 'admin', to, subject, text: body });
  } catch (e) {
    console.error('[email-fehler]', e.message);
    return { ok: false, error: e.message };
  }
}

// Hilfsfunktion: je nach Nutzer-Präferenz E-Mail oder WhatsApp (oder beide).
// pref: 'email' | 'whatsapp' | 'both'  (default: email)
async function notifyUser(user, { subject, text, pref }) {
  pref = pref || 'email';
  const out = {};
  if (pref === 'email' || pref === 'both') {
    out.email = await notifyEmail(user.email, subject, text, 'booking');
  }
  if (pref === 'whatsapp' || pref === 'both') {
    out.whatsapp = await notifyWhatsApp(user, text);
  }
  return out;
}

module.exports = { notifyWhatsApp, notifyEmail, notifyUser, whatsappEnabled };
