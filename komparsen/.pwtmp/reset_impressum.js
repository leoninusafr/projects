const fs = require('fs');
const F = '/opt/data/home/kolour-proj/komparsen/data/db.json';
const db = JSON.parse(fs.readFileSync(F, 'utf8'));
// Platzhalter mit [..] — sichtbar im Panel, werden vom Impressum/Setup ignoriert
const RESET = {
  company_name: 'KAST — Komparsen Agentur',
  owner_name: '[Vorname Nachname]',
  owner_address: '[Straße & Hausnummer]',
  owner_city: '[PLZ Stadt]',
  owner_email: '[E-Mail]',
  owner_phone: '[Telefon]',
  owner_ustid: '',
  domain: '[eigene Domain, z.B. kast.de]',
  separate_imprint_address: '',
  impressum_extra: '',
  setup_done: '0'
};
let n = 0;
db.site_settings.forEach(s => {
  if (Object.prototype.hasOwnProperty.call(RESET, s.key)) { s.value = RESET[s.key]; n++; }
});
['impressum_extra', 'owner_ustid'].forEach(k => {
  if (!db.site_settings.find(x => x.key === k)) { db.site_settings.push({ key: k, value: '' }); n++; }
});
fs.writeFileSync(F, JSON.stringify(db, null, 2));
const s = {};
db.site_settings.forEach(x => s[x.key] = x.value);
console.log('reset fields:', n);
console.log('owner_name=', JSON.stringify(s.owner_name), '| setup_done=', s.setup_done);
