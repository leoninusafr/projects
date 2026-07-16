'use strict';
// Auth: Sessions, Double-Opt-In, Cookie-Verwaltung. Keine externen Abhängigkeiten.
const crypto = require('crypto');
const db = require('./db');
const { hashPassword, verifyPassword, newId } = require('./util');
const mail = require('./mail');

const SESSION_TTL = 30 * 24 * 3600 * 1000; // 30 Tage ("angemeldet bleiben")
const sessions = new Map(); // sessionId -> { userId, expires }

function signSession(userId) {
  const id = newId() + newId(); // 64 hex
  sessions.set(id, { userId, expires: Date.now() + SESSION_TTL });
  return id;
}
function getSession(sessionId) {
  if (!sessionId) return null;
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (s.expires < Date.now()) { sessions.delete(sessionId); return null; }
  return s;
}
function destroySession(sessionId) {
  if (sessionId) sessions.delete(sessionId);
}

// Registrierung mit Double-Opt-In
async function register({ email, password, role, extra }) {
  email = String(email || '').toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ungültige E-Mail');
  if (!password || password.length < 8) throw new Error('Passwort min. 8 Zeichen');
  if (await db.getUserByEmail(email)) throw new Error('E-Mail bereits registriert');

  const { salt, hash } = hashPassword(password);
  const user = await db.createUser({ email, password_hash: hash, salt, role: role || 'extra' });
  await db.ensureProfile(user.id, extra || {});

  // Double-Opt-In-Token bereits in user.verification_token
  const verifyLink = `/api/auth/verify?token=${encodeURIComponent(user.verification_token)}&email=${encodeURIComponent(email)}`;
  // Opt-In-Mail versenden (Brevo/SMTP/Mock je nach Env)
  const link = mail.publicUrl(verifyLink);
  await mail.sendMail({
    to: email,
    subject: 'Bitte bestätige deine Registrierung bei KAST',
    text: `Hallo,\n\ndu bist fast dabei. Bitte bestätige deine E-Mail, damit dein KAST-Konto aktiv wird:\n\n${link}\n\nLiebe Grüße\nDein KAST-Team`
  });
  return { userId: user.id, verifyLink: link };
}

async function mockSendMail(to, subject, body) {
  // Rückwärtskompatibilität: leitet auf das zentrale Mail-Modul weiter.
  return mail.sendMail({ to, subject, text: body });
}

async function verifyEmail(token, email) {
  const user = await db.getUserByEmail(email);
  if (!user) throw new Error('Unbekannt');
  if (user.verification_token !== token) throw new Error('Token ungültig');
  if (user.email_verified) return user;
  await db.update('users', user.id, { email_verified: true, verification_token: null });
  return user;
}

async function login({ email, password }) {
  email = String(email || '').toLowerCase().trim();
  const user = await db.getUserByEmail(email);
  if (!user) throw new Error('E-Mail oder Passwort falsch');
  if (!verifyPassword(password, user.salt, user.password_hash))
    throw new Error('E-Mail oder Passwort falsch');
  if (!user.email_verified) throw new Error('Bitte zuerst E-Mail bestätigen (Double-Opt-In)');
  await db.update('users', user.id, { last_login: new Date().toISOString() });
  return signSession(user.id);
}

async function currentUser(sessionId) {
  const s = getSession(sessionId);
  if (!s) return null;
  const user = await db.getUserById(s.userId);
  if (!user) return null;
  return user;
}

module.exports = { register, verifyEmail, login, currentUser, signSession,
  destroySession, getSession, mockSendMail, SESSION_TTL };
