'use strict';
// Supabase-Adapter für KAST — ersetzt lib/db.js, wenn SUPABASE_URL + SUPABASE_ANON_KEY
// gesetzt sind. Gleiche Schnittstelle wie db.js, damit server.js nichts merkt.
// Zero-Dependency: nutzt globales fetch (Node 18+).
//
// WICHTIG (DSGVO): Wir nutzen die Supabase REST API mit dem ANON-Key. Die
// eigentliche Sicherheit liegt in Row Level Security (siehe migrations/001_init.sql):
//   - Extras sehen nur sich selbst
//   - Produktionen sehen nur visible=true Profile/Fotos
//   - Schreibende Admin-Operationen brauchen einen Service-Role-Key (SUPABASE_SERVICE_KEY),
//     der NUR serverseitig (nie im Frontend!) verwendet wird.
const { newId, plusMonths, ageFromDob } = require('./util');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // nur serverseitig
const HEADERS = (service = false) => ({
  'Content-Type': 'application/json',
  'apikey': service ? SERVICE_KEY : KEY,
  'Authorization': 'Bearer ' + (service ? SERVICE_KEY : KEY)
});

// Tabellen-Mapping (JSON-Collection -> Supabase-Table)
const T = {
  users: 'users', profiles: 'profiles', photos: 'photos',
  productions: 'productions', bookings: 'bookings',
  shortlists: 'shortlists', site_settings: 'site_settings'
};

async function sb(table, { method = 'GET', body, service = false, qs = '' } = {}) {
  const res = await fetch(`${URL}/rest/v1/${table}${qs}`, {
    method,
    headers: HEADERS(service),
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const txt = await res.text();
  if (!res.ok) throw new Error(`Supabase ${table} ${method} -> ${res.status}: ${txt}`);
  return txt ? JSON.parse(txt) : null;
}

async function ensure() { return true; } // Supabase braucht keinen lokalen Cache

// ---- Generische CRUD ----
async function all(collection) { return sb(T[collection]) || []; }
async function find(collection, pred) {
  const rows = await all(collection);
  return rows.find(pred) || null;
}
async function filter(collection, pred) {
  return (await all(collection)).filter(pred);
}
async function insert(collection, obj) {
  const row = Object.assign({ id: obj.id || newId() }, obj);
  // id aus dem Insert-Response holen, falls von DB generiert
  const res = await sb(T[collection], { method: 'POST', body: row,
    qs: '?select=*', service: collection === 'users' || collection === 'site_settings' });
  return res && res[0] ? res[0] : row;
}
async function update(collection, id, patch) {
  await sb(T[collection], { method: 'PATCH', body: patch, qs: `?id=eq.${id}`, service: true });
  return Object.assign({ id }, patch);
}
async function remove(collection, id) {
  await sb(T[collection], { method: 'DELETE', qs: `?id=eq.${id}`, service: true });
}
async function deleteUserCascade(userId) {
  for (const [col, fld] of [['photos','user_id'],['productions','user_id'],
       ['profiles','user_id'],['bookings','extra_id'],['bookings','production_id'],['users','id']]) {
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
  const res = await sb(T.users, { method: 'POST', body: row, qs: '?select=*', service: true });
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
  const res = await sb(T.profiles, { method: 'POST', body: row, qs: '?select=*', service: true });
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
  // Freitext + Alter + Skills clientseitig filtern (Supabase ILIKE pro Feld aufwändig)
  let rows = await sb(T.profiles, { qs });
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

module.exports = {
  ensure, all, find, filter, insert, update, remove,
  getSetting, setSetting, getUserByEmail, getUserById, createUser,
  ensureProfile, searchExtras, deleteUserCascade,
  isSupabase: true
};
