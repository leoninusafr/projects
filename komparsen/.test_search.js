const http = require('http');
const BASE = 'http://localhost:4173';
function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(BASE + path);
    const r = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}) },
      res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>resolve({status:res.statusCode, raw:b, cookie: res.headers['set-cookie']?res.headers['set-cookie'].map(s=>s.split(';')[0]).join('; '):null})); });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}
(async () => {
  const email = 'prod_' + Date.now() + '@test.de';
  await req('POST', '/api/auth/register', { email, password: 'TestPass123', role: 'production' });
  // verify-link aus mailbox
  const fs = require('fs'); const path = require('path');
  const dir = '/opt/data/home/kolour-proj/komparsen/data/mailbox';
  const latest = fs.readdirSync(dir).map(f=>path.join(dir,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs)[0];
  const txt = fs.readFileSync(latest,'utf8');
  const m = txt.match(/(/api/auth/verify?token=[^ ]+)/);
  const link = m[1].replace(/&amp;/g,'&');
  const v = await req('GET', link + '&redirect=1');
  const cookie = v.cookie;
  console.log('verify status:', v.status, '| cookie:', cookie ? 'YES' : 'NO');
  // Suche
  const s = await req('GET', '/api/search?hair=blond&min_age=18&max_age=80', null, cookie);
  const j = JSON.parse(s.raw);
  console.log('SUCHE status:', s.status, '| treffer:', Array.isArray(j) ? j.length : JSON.stringify(j).slice(0,80));
  if (Array.isArray(j) && j.length) console.log('erster Treffer:', j[0].first_name, j[0].last_name, '| photo_id:', j[0].photo_id ? 'JA' : 'NEIN');
})();
