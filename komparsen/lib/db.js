'use strict';
// Datenschicht. Lokal: JSON-Dateien unter data/. Supabase-ready: alle Zugriffe
// laufen über diese Funktionen, damit später nur diese Datei getauscht wird.
// Keine externen Abhängigkeiten (nur fs/promises + path + crypto).
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { newId, plusMonths } = require('./util');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');

// In-memory Cache
let cache = null;
let saveTimer = null;

async function ensure() {
  if (!fs.existsSync(DATA_DIR)) await fsp.mkdir(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    cache = emptyDb();
    await persist();
  } else if (!cache) {
    const raw = await fsp.readFile(FILE, 'utf8');
    cache = JSON.parse(raw);
    // Felder auffüllen, falls Schema wächst
    cache = Object.assign(emptyDb(), cache);
  }
  return cache;
}

function emptyDb() {
  return {
    users: [],
    profiles: [],
    photos: [],
    productions: [],
    bookings: [],
    shortlists: [],
    site_settings: defaultSettings(),
    _meta: { version: 1, seeded: false }
  };
}

function defaultSettings() {
  return [
    { key: 'company_name', value: 'Kast — Komparsen Agentur' },
    { key: 'impressum', value: '##_ Impressum\n\nAngaben gemäß § 5 TMG\n\n**Firma:** Kast Komparsen Agentur\n**Vertreten durch:** Leon\n**Adresse:** Musterstraße 1, 12345 Musterstadt\n**Kontakt:** hallo@kast.example\n\n_Adresse im Admin-Panel änderbar._' },
    { key: 'agb', value: '##_ AGB\n\n1. Mit der Registrierung überträgst du uns die Nutzungsrechte an von dir hochgeladenen Bildern für Casting-Zwecke.\n2. Wir sind berechtigt, deinen Account jederzeit zu löschen.\n3. Deine Daten werden DSGVO-konform verarbeitet.' },
    { key: 'privacy', value: '##_ Datenschutz\n\nWir verarbeiten deine Daten ausschließlich zur Vermittlung als Komparse. Ein Selfie (biometrische Daten, Art. 9 DSGVO) wird nur mit deiner ausdrücklichen Einwilligung verarbeitet.' },
    { key: 'separate_imprint_address', value: '' }
  ];
}

// Persistenz (debounced, atomar via tmp+rename)
async function persist() {
  if (!cache) return;
  const tmp = FILE + '.tmp.' + crypto.randomBytes(4).toString('hex');
  await fsp.writeFile(tmp, JSON.stringify(cache, null, 2));
  await fsp.rename(tmp, FILE);
}
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { persist().catch(err => console.error('save err', err)); }, 50);
}

// ---- Generische CRUD-Helfer ----
async function all(collection) { const db = await ensure(); return db[collection]; }
async function find(collection, pred) { const db = await ensure(); return db[collection].find(pred); }
async function filter(collection, pred) { const db = await ensure(); return db[collection].filter(pred); }

async function insert(collection, obj) {
  const db = await ensure();
  obj.id = obj.id || newId();
  db[collection].push(obj);
  scheduleSave();
  return obj;
}
async function update(collection, id, patch) {
  const db = await ensure();
  const item = db[collection].find(x => x.id === id);
  if (!item) throw new Error('not found: ' + collection + '/' + id);
  Object.assign(item, patch, { updated_at: new Date().toISOString() });
  scheduleSave();
  return item;
}
async function remove(collection, id) {
  const db = await ensure();
  db[collection] = db[collection].filter(x => x.id !== id);
  scheduleSave();
}
async function deleteUserCascade(userId) {
  const db = await ensure();
  // Photos dieses Users
  db.photos = db.photos.filter(x => x.user_id !== userId);
  // Produktionen-Datensatz
  db.productions = db.productions.filter(x => x.user_id !== userId);
  // Profil
  db.profiles = db.profiles.filter(x => x.user_id !== userId);
  // Buchungen, an denen der User als Extra beteiligt war
  db.bookings = db.bookings.filter(x => x.extra_id !== userId && x.production_id !== userId);
  // User selbst
  db.users = db.users.filter(x => x.id !== userId);
  scheduleSave();
  return true;
}

// ---- Domänen-Helfer ----
async function getSetting(key) {
  const db = await ensure();
  const s = db.site_settings.find(x => x.key === key);
  return s ? s.value : null;
}
async function setSetting(key, value) {
  const db = await ensure();
  let s = db.site_settings.find(x => x.key === key);
  if (s) s.value = value; else db.site_settings.push({ key, value });
  scheduleSave();
  return value;
}

async function getUserByEmail(email) {
  const db = await ensure();
  const e = String(email || '').toLowerCase();
  return db.users.find(u => u.email === e) || null;
}
async function getUserById(id) {
  const db = await ensure();
  return db.users.find(u => u.id === id) || null;
}

async function createUser({ email, password_hash, salt, role }) {
  return insert('users', {
    email: String(email).toLowerCase(),
    password_hash, salt, role: role || 'extra',
    email_verified: false,
    verification_token: newId(),
    created_at: new Date().toISOString(),
    last_login: null
  });
}

async function ensureProfile(userId, data = {}) {
  const db = await ensure();
  let p = db.profiles.find(x => x.user_id === userId);
  if (!p) {
    p = await insert('profiles', Object.assign({
      user_id: userId,
      consents: {}, visible: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, data));
  } else if (data && Object.keys(data).length) {
    // vorhandenes Profil mergen (PUT / Consents aktualisieren Felder)
    Object.assign(p, data, { updated_at: new Date().toISOString() });
    scheduleSave();
  }
  return p;
}

async function searchExtras(query = {}) {
  const db = await ensure();
  // Nur sichtbare, verifizierte Extras für Produktionen
  let res = db.profiles.filter(p => p.visible === true);
  const { gender, hair_color, eye_color, city, min_height, max_height,
          min_age, max_age, skills, q } = query;
  if (gender) res = res.filter(p => p.gender === gender);
  if (hair_color) res = res.filter(p => p.hair_color === hair_color);
  if (eye_color) res = res.filter(p => p.eye_color === eye_color);
  if (city) res = res.filter(p => (p.city || '').toLowerCase().includes(city.toLowerCase()));
  if (min_height) res = res.filter(p => (p.height_cm || 0) >= Number(min_height));
  if (max_height) res = res.filter(p => (p.height_cm || 999) <= Number(max_height));
  if (skills && skills.length) {
    res = res.filter(p => (p.skills || []).some(s => skills.includes(s)));
  }
  if (q && q.trim()) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    res = res.filter(p => {
      const hay = [p.first_name, p.last_name, p.city, p.ethnicity, p.bio,
        p.hair_color, p.eye_color, p.gender, String(p.height_cm || ''),
        ...(p.skills || [])].join(' ').toLowerCase();
      // JEDER Suchbegriff muss irgendwo vorkommen (Token-AND)
      return terms.every(t => hay.includes(t));
    });
  }
  // Alter
  if (min_age || max_age) {
    res = res.filter(p => {
      const a = require('./util').ageFromDob(p.dob);
      if (a == null) return false;
      if (min_age && a < Number(min_age)) return false;
      if (max_age && a > Number(max_age)) return false;
      return true;
    });
  }
  // User-Email/Dob ergänzen — BEWUSST KEINE E-Mail im öffentlichen Suchergebnis
  // (DSGVO: E-Mail ist personenbezogenes Datum, nur nach Buchung/Opt-in sichtbar).
  return res.map(p => {
    return Object.assign({}, p, { age: require('./util').ageFromDob(p.dob), email: undefined });
  });
}

module.exports = {
  ensure, persist, all, find, filter, insert, update, remove,
  getSetting, setSetting, getUserByEmail, getUserById, createUser,
  ensureProfile, searchExtras, defaultSettings, deleteUserCascade
};
