const fs = require('fs');
const src = fs.readFileSync('/opt/data/home/kolour-proj/komparsen/public/theme.js', 'utf8');
const m = src.match(/var THEMES = (\{[\s\S]*?\n  \});/);
if (!m) { console.error('THEMES not found'); process.exit(1); }
const THEMES = eval('(' + m[1] + ')');
const keys = Object.keys(THEMES);
console.log('THEMES keys:', keys.join(', '));

const pub = '/opt/data/home/kolour-proj/komparsen/public';
const missing = [];
keys.forEach(k => {
  const t = THEMES[k];
  if (t.css && !fs.existsSync(pub + t.css)) missing.push(k + ' -> ' + t.css + ' (FEHLT)');
  if (!t.body && k !== 'block') missing.push(k + ' missing body class');
});
console.log('missing css/body:', missing.length ? missing.join(', ') : 'NONE');

const adminValues = ['block', 'studio', 'editorial', 'kartei', 'manifest', 'intro'];
const unresolved = adminValues.filter(v => !THEMES[v]);
console.log('admin select unresolved:', unresolved.length ? unresolved.join(', ') : 'NONE (all 6 map)');

function resolve(input, serverTheme, saved) {
  if (input && THEMES[input]) return input;
  if (serverTheme && THEMES[serverTheme]) return serverTheme;
  if (saved && THEMES[saved]) return saved;
  return 'studio';
}
console.log('resolve("block") ->', resolve('block', null, null));
console.log('resolve("")     ->', resolve('', null, null));
console.log('resolve("intro") ->', resolve('intro', null, null));
console.log('resolve(?theme=xyz) ->', resolve('xyz', null, null), '(falls back studio)');
