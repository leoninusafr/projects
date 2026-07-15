'use strict';
// Auth: Sessions, Double-Opt-In, Cookie-Verwaltung. Keine externen Abhängigkeiten.
const crypto = require('crypto');
const db = require('./db');
const { hashPassword, verifyPassword, newId } = require('./util');

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
  // In Realität: Mail versenden. Hier: Log + zurückgeben (Dev).
  console.log(`[OPT-IN] Bestätigungslink für ${email}: ${verifyLink}`);
  // Mock-Versand
  await mockSendMail(email, 'Bitte bestätige deine Registrierung',
    `Klicke zum Bestätigen: ${verifyLink}`);
  return { userId: user.id, verifyLink };
}

async function mockSendMail(to, subject, body) {
  // Platzhalter für echten SMTP/Supabase-Mail später
  const dir = require('path').join(__dirname, '..', 'data', 'mailbox');
  require('fs').mkdirSync(dir, { recursive: true });
  const f = require('path').join(dir, Date.now() + '_' + crypto.randomBytes(3).toString('hex') + '.txt');
  require('fs').writeFileSync(f, `To: ${to}\nSubject: ${subject}\n\n${body}\n`);
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
