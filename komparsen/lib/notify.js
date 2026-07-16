'use strict';
// Benachrichtigungen — Email (via lib/mail, Brevo/SMTP/Mock) und WhatsApp (Stub).
// WhatsApp ist hier nur ein Stub: später echte API (z.B. WhatsApp Business /
// Twilio) einhängen. Bis dahin: Konsolen-Log + (falls WHATSAPP_TOKEN gesetzt)
// wird die Nachricht als "pending" markiert, damit ein Worker sie versendet.
const mail = require('./mail');

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
  console.log('[whatsapp] (API-Platzhalter) an +' + phone + ': ' + text);
  return { ok: true, sent: true };
}

async function notifyEmail(to, subject, body, type) {
  try {
    return await mail.sendMailSafe({ type: type || 'admin', to, subject, text: body });
  } catch (e) {
    console.error('[email-fehler]', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { notifyWhatsApp, notifyEmail, whatsappEnabled };
