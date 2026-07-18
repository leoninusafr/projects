'use strict';
// Datenschicht. Lokal: JSON-Dateien unter data/. Supabase-ready: alle Zugriffe
// laufen über diese Funktionen, damit später nur diese Datei getauscht wird.
// Keine externen Abhängigkeiten (nur fs/promises + path + crypto).
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { newId, plusMonths, isEmail } = require('./util');

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
    // site_settings: fehlende Keys aus defaultSettings ergänzen (Migration)
    const def = defaultSettings();
    def.forEach(d => {
      if (!cache.site_settings.find(x => x.key === d.key)) cache.site_settings.push(d);
    });
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
    admins: [],
    site_settings: defaultSettings(),
    _meta: { version: 1, seeded: false }
  };
}

function defaultSettings() {
  return [
    { key: 'company_name', value: 'KAST — Komparsen Agentur' },
    { key: 'impressum_extra', value: '' },
    { key: 'owner_ustid', value: '' },
    { key: 'agb', value: '## AGB (Teilnahme als Komparse)\n\n1. **Kein Vertragszwang:** Die Registrierung bei KAST ist kostenlos und jederzeit kündbar. Es entsteht kein Abo-Zwangsverhältnis.\n2. **Bildnutzung:** Mit der Registrierung räumst du KAST das einfache Nutzungsrecht an deinen Profilfotos für Vermittlungszwecke (Casting, Auswahl durch Produktionen) ein. Eine darüber hinausgehende Nutzung erfolgt nur mit deiner gesonderten Einwilligung.\n3. **Kein Arbeitsverhältnis:** KAST vermittelt lediglich; zwischen dir und KAST entsteht kein Arbeitsverhältnis und keine Arbeitnehmerüberlassung im Sinne des AÜG.\n4. **Vergütung:** Etwaige Gagen zahlt die Produktion direkt an dich. KAST ist nicht Schuldner der Vergütung.\n5. **Löschung:** Du kannst dein Profil und alle gespeicherten Daten jederzeit selbst löschen.\n6. **DSGVO:** Deine Daten werden ausschließlich zur Vermittlung verarbeitet, auf Servern in der EU. Eine Weitergabe an Dritte erfolgt nur mit deiner Einwilligung oder zur Vertragserfüllung (z.B. Anfrage durch Produktion).' },
    { key: 'privacy', value: '## Datenschutzerklärung (zusammenfassend)\n\n- **Verantwortlich:** KAST — Komparsen Agentur (Kontakt siehe Impressum).\n- **Zweck:** Vermittlung von Komparsen an Produktionen.\n- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung), Art. 9 DSGVO (biometrische Daten/Fotos) ausschließlich mit deiner **ausdrücklichen Einwilligung**.\n- **Selfie-Re-Verify:** Alle 6 Monate (Live-Kamera, kein Upload) zur Aktualität deines Profils.\n- **Deine Rechte:** Auskunft, Berichtigung, Löschung, Widerspruch, Datenübertragbarkeit — jederzeit über dein Profil oder per E-Mail.\n- **Keine Weitergabe** an Dritte ohne Einwilligung.\n- **Cookies:** Nur technisch notwendige (Session), lokal im Browser gespeichert (Opt-in). Kein Tracking ohne deine Zustimmung.\n- **EU-Streitschlichtung:** Wir sind zur Teilnahme an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle nicht verpflichtet und nehmen freiwillig nicht teil.' },
    { key: 'separate_imprint_address', value: '' },
    // --- Setup / Pflichtfelder für den "Publish"-Blocker ---
    // (leer = noch nicht ausgefüllt; im Admin-Panel mit "!" markiert)
    { key: 'setup_done', value: '0' },
    { key: 'owner_name', value: '' },
    { key: 'owner_address', value: '' },
    { key: 'owner_city', value: '' },
    { key: 'owner_email', value: '' },
    { key: 'owner_phone', value: '' },
    { key: 'domain', value: '' }
  ];
}

// Definition der Pflichtfelder, die ausgefüllt sein MÜSSEN, bevor die Seite
// "live/published" geht (DSGVO/TMG: Impressum braucht echte Angaben).
// Jeder Eintrag: key = site_settings-Schlüssel, label = Anzeige, section = Gruppe.
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

// Liefert den aktuellen Setup-Status: welche Pflichtfelder fehlen.
// Platzhalter ([..]) und leere Werte zählen als fehlend.
function isFilled(v) {
  const s = String(v || '').trim();
  if (!s) return false;
  if (s.startsWith('[') && s.endsWith(']')) return false; // Platzhalter
  return true;
}
async function getSetupStatus() {
  const db = await ensure();
  const get = (k) => { const s = db.site_settings.find(x => x.key === k); return s ? s.value : ''; };
  const missing = REQUIRED_SETUP_FIELDS
    .filter(f => !isFilled(get(f.key)))
    .map(f => ({ key: f.key, label: f.label, section: f.section }));
  const done = missing.length === 0;
  if (done && get('setup_done') !== '1') await setSetting('setup_done', '1');
  if (!done && get('setup_done') === '1') await setSetting('setup_done', '0');
  return {
    done,
    missing,
    total: REQUIRED_SETUP_FIELDS.length,
    filled: REQUIRED_SETUP_FIELDS.length - missing.length
  };
}

module.exports.REQUIRED_SETUP_FIELDS = REQUIRED_SETUP_FIELDS;

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

// Baut das IMPRESSUM automatisch aus den strukturierten Admin-Feldern
// (§ 5 TMG / § 18 Abs. 2 MStV). Klammern-Platzhalter ([..]) und
// leere Felder werden NICHT ausgegeben — fehlende Pflichtfelder bleiben
// leer und werden vom Setup-Check ("!") im Admin-Panel eingefordert.
// Ein freier Zusatzblock (impressum_extra) wird angehängt.
// val(): echter Wert nur, wenn nicht leer und kein [..]-Platzhalter.
function impVal(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (s.startsWith('[') && s.endsWith(']')) return ''; // Platzhalter
  return s;
}
async function getImpressum() {
  const db = await ensure();
  const raw = (k) => { const s = db.site_settings.find(x => x.key === k); return s ? String(s.value || '') : ''; };
  const company = impVal(raw('company_name')) || 'KAST — Komparsen Agentur';
  const owner = impVal(raw('owner_name'));
  const addr = impVal(raw('owner_address'));
  const city = impVal(raw('owner_city'));
  const email = impVal(raw('owner_email'));
  const phone = impVal(raw('owner_phone'));
  const ustId = impVal(raw('owner_ustid'));
  const sep = impVal(raw('separate_imprint_address'));
  const extra = impVal(raw('impressum_extra'));

  let out = '## Impressum\n\n';
  out += 'Angaben gemäß § 5 TMG / § 18 Abs. 2 MStV\n\n';
  out += '**Firma:** ' + company + '\n';
  if (owner) out += '**Vertreten durch:** ' + owner + '\n';
  if (sep) {
    out += '**Adresse:** ' + sep + '\n';
  } else {
    const place = [addr, city].filter(Boolean).join(', ');
    if (place) out += '**Adresse:** ' + place + '\n';
  }
  if (email) out += '**Kontakt:** ' + email + '\n';
  if (phone) out += '**Telefon:** ' + phone + '\n';
  if (ustId) out += '**Umsatzsteuer-ID:** ' + ustId + ' (gem. § 27a UStG)\n';
  if (owner) out += '**Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:** ' + owner + '\n';
  if (extra) out += '\n' + extra + '\n';
  return out.trim() + '\n';
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

async function inviteAdmin({ email, role_scope, invited_by }) {
  const db = await ensure();
  const e = String(email || '').toLowerCase().trim();
  if (!isEmail(e)) throw new Error('Ungültige E-Mail');
  if (db.admins.find(a => a.email === e && !a.revoked_at)) throw new Error('Admin bereits eingeladen');
  const token = newId() + newId(); // 64 hex Einladungs-Token
  const rec = {
    id: newId(), email: e,
    role_scope: role_scope || 'all',     // 'all' | 'website' | 'database' | 'legal'
    token, invited_by: invited_by || null,
    created_at: new Date().toISOString(), revoked_at: null
  };
  db.admins.push(rec);
  scheduleSave();
  return rec;
}
async function listAdmins() {
  const db = await ensure();
  return db.admins.map(a => Object.assign({}, a, { token: undefined }));
}
async function getAdminByToken(token) {
  const db = await ensure();
  return db.admins.find(a => a.token === token && !a.revoked_at) || null;
}
async function revokeAdmin(id) {
  const db = await ensure();
  const a = db.admins.find(x => x.id === id);
  if (!a) throw new Error('nicht gefunden');
  a.revoked_at = new Date().toISOString();
  scheduleSave();
  return true;
}
async function setAdminScope(id, scope) {
  const db = await ensure();
  const a = db.admins.find(x => x.id === id);
  if (!a) throw new Error('nicht gefunden');
  a.role_scope = scope;
  scheduleSave();
  return true;
}

async function getImpressum() {
  const db = await ensure();
  const get = (k) => { const s = db.site_settings.find(x => x.key === k); return s ? String(s.value || '') : ''; };
  // Platzhalter [..] und leere Werte ignorieren (nicht ins öffentliche Impressum)
  const clean = (v) => { const s = String(v || '').trim(); return (s && !(s.startsWith('[') && s.endsWith(']'))) ? s : ''; };
  const company = clean(get('company_name')) || 'KAST — Komparsen Agentur';
  const owner = clean(get('owner_name'));
  const addr = clean(get('owner_address'));
  const city = clean(get('owner_city'));
  const email = clean(get('owner_email'));
  const phone = clean(get('owner_phone'));
  const ustid = clean(get('owner_ustid'));
  const extra = clean(get('impressum_extra'));

  // Mindestens Inhaber + Kontakt vorhanden? Sonst Hinweis, nicht leeres Impressum.
  if (!owner && !email && !phone) return ''; // Frontend zeigt dann „folgt in Kürze"

  let out = '## ' + company + '\n\n';
  if (owner) out += '**Vertreten durch:** ' + owner + '\n\n';
  if (addr) out += addr + '\n';
  if (city) out += city + '\n';
  if (phone) out += 'Telefon: ' + phone + '\n';
  if (email) out += 'E-Mail: ' + email + '\n';
  if (ustid) out += 'USt-IdNr.: ' + ustid + '\n';
  if (extra) out += '\n' + extra + '\n';
  return out.trim();
}

module.exports = {
  ensure, persist, all, find, filter, insert, update, remove,
  getSetting, setSetting, getUserByEmail, getUserById, createUser,
  ensureProfile, searchExtras, defaultSettings, deleteUserCascade,
  getSetupStatus, REQUIRED_SETUP_FIELDS, getImpressum,
  inviteAdmin, listAdmins, getAdminByToken, revokeAdmin, setAdminScope
};
