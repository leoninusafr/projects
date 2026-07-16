'use strict';
// Supabase-Adapter für KAST — ersetzt lib/db.js, wenn SUPABASE_URL + SUPABASE_ANON_KEY
// gesetzt sind. Gleiche Schnittstelle wie db.js, damit server.js nichts merkt.
// Zero-Dependency: nutzt globales fetch (Node 18+).
//
// WICHTIG (DSGVO): Wir nutzen die Supabase REST API mit dem ANON-Key. Die
// eigentliche Sicherheit liegt in Row Level Security (siehe migrations/001_init.sql).
//   - Extras sehen nur sich selbst
//   - Produktionen sehen nur visible=true Profile/Fotos
//   - Schreibende Admin-Operationen brauchen einen Service-Role-Key (SUPABASE_SERVICE_KEY),
//     der NUR serverseitig (nie im Frontend!) verwendet wird.
//
// Voraussetzung für Schreibzugriffe: SUPABASE_SERVICE_KEY MUSS gesetzt sein.
// Sonst schlagen alle Inserts/Updates/Deletes fehl (anon-Key hat kein Schreibrecht).

const { newId, plusMonths } = require('./util');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // nur serverseitig

// HINWEIS: Ohne SERVICE_KEY funktionieren Registrierung/Profile/Buchungen nicht.
// Das ist gewollt (Sicherheit) — der Deploy schlägt dann mit klarem Fehler statt
// still zu versagen.

function headers(service = false) {
  const k = service ? SERVICE_KEY : KEY;
  return {
    'Content-Type': 'application/json',
    'apikey': k,
    'Authorization': 'Bearer ' + k,
    'Prefer': 'return=representation'
  };
}

// --- ZENTRALER FIX 1: sb() darf NICHT ohne Options-Objekt aufgerufen werden.
//     Alle Aufrufer übergeben jetzt { method, body, service, qs }. ---
async function sb(table, opts = {}) {
  const { method = 'GET', body, service = false, qs = '' } = opts;
  if (!URL || !KEY) throw new Error('Supabase nicht konfiguriert (SUPABASE_URL/KEY fehlen)');
  const res = await fetch(`${URL}/rest/v1/${table}${qs}`, {
    method,
    headers: headers(service),
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const txt = await res.text();
  if (!res.ok) throw new Error(`Supabase ${table} ${method} -> ${res.status}: ${txt}`);
  return txt ? JSON.parse(txt) : null;
}

async function ensure() {
  // Supabase braucht keinen lokalen Cache; existiert nur für Kompatibilität.
  return true;
}

// ---- Generische CRUD ----
async function all(collection) { return (await sb(T[collection])) || []; }
async function find(collection, pred) { return (await all(collection)).find(pred) || null; }
async function filter(collection, pred) { return (await all(collection)).filter(pred); }

async function insert(collection, obj) {
  const row = Object.assign({ id: obj.id || newId() }, obj);
  const res = await sb(T[collection], { method: 'POST', body: row, service: true });
  return res && res[0] ? res[0] : row;
}
async function update(collection, id, patch) {
  const res = await sb(T[collection], { method: 'PATCH', body: patch, qs: `?id=eq.${id}`, service: true });
  return res && res[0] ? Object.assign({ id }, res[0]) : Object.assign({ id }, patch);
}
async function remove(collection, id) {
  await sb(T[collection], { method: 'DELETE', qs: `?id=eq.${id}`, service: true });
}
async function deleteUserCascade(userId) {
  for (const [col, fld] of [['photos', 'user_id'], ['productions', 'user_id'],
       ['profiles', 'user_id'], ['bookings', 'extra_id'], ['bookings', 'production_id'], ['users', 'id']]) {
    await sb(T[col], { method: 'DELETE', qs: `?${fld}=eq.${userId}`, service: true });
  }
  return true;
}

// ---- Settings ----
async function getSetting(key) {
  const rows = await sb(T.site_settings, { qs: `?key=eq.${encodeURIComponent(key)}` });
  return rows && rows[0] ? rows[0].value : null;
}
async function setSetting(key, value) {
  const existing = await sb(T.site_settings, { qs: `?key=eq.${encodeURIComponent(key)}` });
  if (existing && existing[0]) {
    await sb(T.site_settings, { method: 'PATCH', body: { value }, qs: `?key=eq.${encodeURIComponent(key)}`, service: true });
  } else {
    await sb(T.site_settings, { method: 'POST', body: { key, value }, service: true });
  }
  return value;
}

// ---- Users ----
async function getUserByEmail(email) {
  const e = String(email || '').toLowerCase();
  const rows = await sb(T.users, { qs: `?email=eq.${encodeURIComponent(e)}` });
  return rows && rows[0] ? rows[0] : null;
}
async function getUserById(id) {
  const rows = await sb(T.users, { qs: `?id=eq.${id}` });
  return rows && rows[0] ? rows[0] : null;
}
async function createUser({ email, password_hash, salt, role }) {
  const row = {
    id: newId(), email: String(email).toLowerCase(), password_hash, salt,
    role: role || 'extra', email_verified: false, verification_token: newId(),
    created_at: new Date().toISOString(), last_login: null
  };
  const res = await sb(T.users, { method: 'POST', body: row, service: true });
  return res && res[0] ? res[0] : row;
}

// ---- Profiles ----
async function ensureProfile(userId, data = {}) {
  const existing = await sb(T.profiles, { qs: `?user_id=eq.${userId}` });
  if (existing && existing[0]) {
    if (data && Object.keys(data).length) {
      await sb(T.profiles, { method: 'PATCH', body: data, qs: `?user_id=eq.${userId}`, service: true });
    }
    return existing[0];
  }
  const row = Object.assign({ user_id: userId, consents: {}, visible: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, data, { user_id: userId });
  const res = await sb(T.profiles, { method: 'POST', body: row, service: true });
  return res && res[0] ? res[0] : row;
}

// ---- Suche (nur visible) ----
async function searchExtras(query = {}) {
  const { gender, hair_color, eye_color, city, min_height, max_height,
          min_age, max_age, skills, q } = query;
  let qs = '?visible=eq.true&select=*';
  if (gender) qs += `&gender=eq.${encodeURIComponent(gender)}`;
  if (hair_color) qs += `&hair_color=eq.${encodeURIComponent(hair_color)}`;
  if (eye_color) qs += `&eye_color=eq.${encodeURIComponent(eye_color)}`;
  if (city) qs += `&city=ilike.*${encodeURIComponent(city)}*`;
  if (min_height) qs += `&height_cm=gte.${Number(min_height)}`;
  if (max_height) qs += `&height_cm=lte.${Number(max_height)}`;
  let rows = (await sb(T.profiles, { qs })) || [];
  if (skills && skills.length) rows = rows.filter(p => (p.skills || []).some(s => skills.includes(s)));
  if (q && q.trim()) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    rows = rows.filter(p => {
      const hay = [p.first_name, p.last_name, p.city, p.bio, p.hair_color, p.eye_color,
        p.gender, String(p.height_cm || ''), ...(p.skills || [])].join(' ').toLowerCase();
      return terms.every(t => hay.includes(t));
    });
  }
  if (min_age || max_age) {
    rows = rows.filter(p => {
      const a = ageFromDob(p.dob); if (a == null) return false;
      if (min_age && a < Number(min_age)) return false;
      if (max_age && a > Number(max_age)) return false;
      return true;
    });
  }
  return rows.map(p => Object.assign({}, p, { age: ageFromDob(p.dob), email: undefined }));
}

// ===================== HINZUGEFÜGT: fehlende Exports =====================
// (server.js, admin.js und db.js erwarten diese — ohne sie crashte der Supabase-Pfad
//  mit "db.getSetupStatus is not a function" bzw. fehlender REQUIRED_SETUP_FIELDS.)

function defaultSettings() {
  return [
    { key: 'company_name', value: 'Kast — Komparsen Agentur' },
    { key: 'impressum', value: '##_ Impressum\n\nAngaben gemäß § 5 TMG\n\n**Firma:** Kast Komparsen Agentur\n**Vertreten durch:** Leon\n**Adresse:** Musterstraße 1, 12345 Musterstadt\n**Kontakt:** hallo@kast.example\n\n_Adresse im Admin-Panel änderbar._' },
    { key: 'agb', value: '##_ AGB\n\n1. Mit der Registrierung überträgst du uns die Nutzungsrechte an von dir hochgeladenen Bildern für Casting-Zwecke.\n2. Wir sind berechtigt, deinen Account jederzeit zu löschen.\n3. Deine Daten werden DSGVO-konform verarbeitet.' },
    { key: 'privacy', value: '##_ Datenschutz\n\nWir verarbeiten deine Daten ausschließlich zur Vermittlung als Komparse. Ein Selfie (biometrische Daten, Art. 9 DSGVO) wird nur mit deiner ausdrücklichen Einwilligung verarbeitet.' },
    { key: 'separate_imprint_address', value: '' },
    { key: 'setup_done', value: '0' },
    { key: 'owner_name', value: '' },
    { key: 'owner_address', value: '' },
    { key: 'owner_city', value: '' },
    { key: 'owner_email', value: '' },
    { key: 'owner_phone', value: '' },
    { key: 'domain', value: '' }
  ];
}

const REQUIRED_SETUP_FIELDS = [
  { key: 'company_name', label: 'Firmenname / Name der Agentur', section: 'Grunddaten' },
  { key: 'owner_name', label: 'Name des Inhabers (Vertreten durch)', section: 'Impressum' },
  { key: 'owner_address', label: 'Straße & Hausnummer', section: 'Impressum' },
  { key: 'owner_city', label: 'PLZ & Stadt', section: 'Impressum' },
  { key: 'owner_email', label: 'Kontakt-E-Mail (Impressum)', section: 'Impressum' },
  { key: 'owner_phone', label: 'Telefon (Impressum)', section: 'Impressum' },
  { key: 'domain', label: 'Eigene Domain (z. B. kast.de)', section: 'Technik' },
  { key: 'agb', label: 'AGB hinterlegt', section: 'Rechtstexte' },
  { key: 'privacy', label: 'Datenschutzerklärung hinterlegt', section: 'Rechtstexte' }
];

async function getSetupStatus() {
  const get = async (k) => await getSetting(k);
  const missing = [];
  for (const f of REQUIRED_SETUP_FIELDS) {
    const v = await get(f.key);
    if (!String(v || '').trim()) missing.push({ key: f.key, label: f.label, section: f.section });
  }
  const done = missing.length === 0;
  await setSetting('setup_done', done ? '1' : '0');
  return {
    done,
    missing,
    total: REQUIRED_SETUP_FIELDS.length,
    filled: REQUIRED_SETUP_FIELDS.length - missing.length
  };
}

// ageFromDob lokal definieren (util reicht es durch, aber zur Sicherheit hier gespiegelt)
const { ageFromDob } = require('./util');

module.exports = {
  ensure, all, find, filter, insert, update, remove,
  getSetting, setSetting, getUserByEmail, getUserById, createUser,
  ensureProfile, searchExtras, deleteUserCascade,
  isSupabase: true,
  // --- neu (zuvor fehlend) ---
  getSetupStatus, defaultSettings, REQUIRED_SETUP_FIELDS
};

// Tabellen-Mapping (JSON-Collection -> Supabase-Table)
const T = {
  users: 'users', profiles: 'profiles', photos: 'photos',
  productions: 'productions', bookings: 'bookings',
  shortlists: 'shortlists', site_settings: 'site_settings'
};
