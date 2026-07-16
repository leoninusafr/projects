'use strict';
// Benachrichtigungen — Email (via auth.mockSendMail) und WhatsApp (Stub).
// WhatsApp ist hier nur ein Stub: später echte API (z.B. WhatsApp Business /
// Twilio) einhängen. Bis dahin: Konsolen-Log + (falls WHATSAPP_TOKEN gesetzt)
// wird die Nachricht als "pending" markiert, damit ein Worker sie versenden kann.
const auth = require('./auth');

function whatsappEnabled() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_FROM);
}

// user: { id, email, phone, ... }  text: Nachricht
async function notifyWhatsApp(user, text) {
  if (!user) return { ok: false, reason: 'no-user' };
  // Telefonnummer? Wenn keine hinterlegt, nur Log.
  const phone = user.phone || (user.profile && user.profile.phone);
  if (!phone) {
    console.log('[whatsapp-stub] kein Telefon für ' + (user.email || user.id) + ' — übersprungen');
    return { ok: false, reason: 'no-phone' };
  }
  if (!whatsappEnabled()) {
    console.log('[whatsapp-stub] (deaktiviert) an +' + phone + ': ' + text);
    return { ok: false, reason: 'disabled' };
  }
  // --- Hier später echte API (z.B. Twilio / Meta WhatsApp) ---
  // Beispiel-Skelett:
  // await fetch('https://graph.facebook.com/v19.0/' + process.env.WHATSAPP_FROM + '/messages', {
  //   method: 'POST',
  //   headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_TOKEN, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: text } })
  // });
  console.log('[whatsapp] (API-Platzhalter) an +' + phone + ': ' + text);
  return { ok: true, sent: true };
}

async function notifyEmail(to, subject, body) {
  try {
    await auth.mockSendMail(to, subject, body);
    return { ok: true };
  } catch (e) {
    console.error('[email-fehler]', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { notifyWhatsApp, notifyEmail, whatsappEnabled };
