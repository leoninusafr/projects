'use strict';
// Gemeinsame Helfer — keine externen Abhängigkeiten.
const crypto = require('crypto');

const ID_BYTES = 16;
function newId() {
  return crypto.randomBytes(ID_BYTES).toString('hex'); // 32 hex chars
}

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Einfache HTML-Escaping für sicheres Einbetten in Templates.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Passwort-Hashing (scrypt, salted) — sicher für lokale Nutzung.
const SCRYPT_KEYLEN = 64;
function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash };
}
function verifyPassword(pw, salt, expectedHash) {
  const { hash } = hashPassword(pw, salt);
  // timing-safe
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Grundvalidierung
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').toLowerCase());
}
function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

// ISO jetzt + 6 Monate
function plusMonths(iso, months) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

module.exports = {
  newId, slug, esc, hashPassword, verifyPassword, randomToken,
  isEmail, ageFromDob, plusMonths, SCRYPT_KEYLEN
};
