'use strict';
// Seed-Skript für SUPABASE (Online-DB): legt den Main-Admin an.
// Nutzt den SERVICE-ROLE-Key (umgeht RLS) — NUR lokal ausführen, Key NIE ins Frontend.
//
// Voraussetzung: Env-Variablen gesetzt (z.B. in einer lokalen .env oder inline):
//   SUPABASE_URL=https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY=eyJ...   (Service Role, NICHT der anon-Key)
//
// Aufruf:
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed-admin-supabase.js [email] [pw]
const crypto = require('crypto');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const EMAIL = (process.argv[2] || 'leon63808@gmail.com').toLowerCase().trim();
const PW = process.argv[3] || '@Penis123';

if (!URL || !KEY) {
  console.error('FEHLER: SUPABASE_URL und SUPABASE_SERVICE_KEY müssen gesetzt sein.');
  console.error('Beispiel: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/seed-admin-supabase.js');
  process.exit(1);
}

const H = {
  'Content-Type': 'application/json',
  'apikey': KEY,
  'Authorization': 'Bearer ' + KEY,
  'Prefer': 'return=representation'
};

async function main() {
  // 1. Existiert der Admin schon?
  const check = await fetch(`${URL}/rest/v1/users?email=eq.${encodeURIComponent(EMAIL)}`, { headers: H });
  const existing = await check.json();
  if (Array.isArray(existing) && existing.length) {
    console.log('Admin', EMAIL, 'existiert bereits in Supabase. Nichts zu tun.');
    return;
  }

  // 2. Passwort hashen (scrypt, salted) — gleiche Methode wie lib/util.js
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(PW, salt, 64).toString('hex');

  // 3. User anlegen
  const insRes = await fetch(`${URL}/rest/v1/users`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      email: EMAIL, password_hash: hash, salt, role: 'admin',
      email_verified: true, verification_token: null
    })
  });
  if (!insRes.ok) {
    console.error('User-Insert fehlgeschlagen:', insRes.status, await insRes.text());
    process.exit(1);
  }
  const [user] = await insRes.json();

  // 4. Leeres Profil anlegen (FK)
  await fetch(`${URL}/rest/v1/profiles`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ user_id: user.id, consents: {}, visible: false })
  });

  console.log('Main-Admin in Supabase angelegt:', EMAIL, '| Rolle: admin | verifiziert: ja');
  console.log('Du kannst dich jetzt online unter /login.html einloggen.');
}

main().catch(e => { console.error(e); process.exit(1); });
