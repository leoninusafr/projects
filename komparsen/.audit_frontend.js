const fs = require('fs');
const path = require('path');
const pub = '/opt/data/home/kolour-proj/komparsen/public';
const srv = fs.readFileSync('/opt/data/home/kolour-proj/komparsen/server.js', 'utf8');

// 1) Alle /api/... Aufrufe aus dem Frontend sammeln (api('/api/..'), fetch(..), open(..))
const files = fs.readdirSync(pub).filter(f => f.endsWith('.js'));
const calls = new Set();
for (const f of files) {
  const src = fs.readFileSync(path.join(pub, f), 'utf8');
  const re = /(?:api\(|fetch\(|open\()\s*['"`](\/api\/[^'"`\s?]+)/g;
  let m;
  while ((m = re.exec(src))) calls.add(m[1].split('?')[0]); // query weg
}

// 2) Statische Routen aus server.js (p === '/api/...')
const routes = new Set();
const re2 = /p\s*===\s*['"`](\/api\/[^'"`]+)['"`]/g;
let m2;
while ((m2 = re2.exec(srv))) routes.add(m2[1]);

const missing = [...calls].filter(c => !routes.has(c));
console.log('Frontend /api/-Aufrufe:', calls.size);
[...calls].sort().forEach(c => console.log('  CALL', c, routes.has(c) ? 'OK' : '<<< FEHLT IM SERVER'));
console.log('\nServer-Routen (statisch):', routes.size);
console.log('\n=== NICHT gemappte Frontend-Aufrufe ===');
console.log(missing.length ? [...missing].sort().join('\n') : 'KEINE (alle Frontend-Calls haben Server-Routen)');
