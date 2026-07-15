'use strict';
// Seed-Skript: legt den Main-Admin an (leon63808@gmail.com).
// Sicher: scrypt-Hash, E-Mail verifiziert, is_main_admin=true.
// Läuft lokal gegen die JSON-DB. Bei Supabase-Betrieb stattdessen via SQL/API.
//
// Aufruf: node scripts/seed-admin.js [email] [password]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EMAIL = (process.argv[2] || 'leon63808@gmail.com').toLowerCase().trim();
const PW = process.argv[3] || '@Penis123';

const FILE = path.join(__dirname, '..', 'data', 'db.json');
if (!fs.existsSync(FILE)) {
  console.error('Keine db.json gefunden. Server einmal starten (node server.js), damit sie existiert.');
  process.exit(1);
}
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));

if (db.users.some(u => u.email === EMAIL)) {
  console.log('Admin', EMAIL, 'existiert bereits.');
  process.exit(0);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(PW, salt, 64).toString('hex');
const id = crypto.randomBytes(16).toString('hex');

db.users.push({
  id, email: EMAIL, password_hash: hash, salt,
  role: 'admin', email_verified: true, verification_token: null,
  is_main_admin: true, created_at: new Date().toISOString(), last_login: null
});
db.profiles.push({ user_id: id, consents: {}, visible: false,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString() });

fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log('Main-Admin angelegt:', EMAIL, '| Rolle: admin | verifiziert: ja');
console.log('Login: /login.html  — Passwort kann später im Admin-Panel geändert werden.');
