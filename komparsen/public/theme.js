'use strict';
// Theme-Steuerung: liest ?theme= oder localStorage, setzt body-Klasse.
// Bietet einen Mini-Switcher (Editorial / Studio / Mono) zum Live-Vergleich.
(function () {
  const params = new URLSearchParams(location.search);
  const t = params.get('theme') || localStorage.getItem('kast_theme') || 'editorial';
  function applyTheme(name) {
    // Nur Theme-Klassen ersetzen — guard/auth-ok u.a. bleiben erhalten.
    document.body.classList.remove('theme-editorial', 'theme-studio', 'theme-mono');
    document.body.classList.add('theme-' + name);
  }
  applyTheme(t);
  localStorage.setItem('kast_theme', t);

  // Mini-Switcher NUR im Entwickler-Modus (?dev=1) — echte Besucher sehen ihn nie.
  if (!params.has('dev')) return;

  const sw = document.createElement('div');
  sw.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:99;display:flex;gap:6px;' +
    'background:#fff;border:1px solid var(--line);border-radius:980px;padding:6px;box-shadow:var(--shadow-sm)';
  sw.innerHTML = '<button data-t="editorial" style="border:none;background:transparent;font:inherit;padding:6px 12px;cursor:pointer;border-radius:980px">Edt</button>' +
    '<button data-t="studio" style="border:none;background:transparent;font:inherit;padding:6px 12px;cursor:pointer;border-radius:980px">Stu</button>' +
    '<button data-t="mono" style="border:none;background:transparent;font:inherit;padding:6px 12px;cursor:pointer;border-radius:980px">Mno</button>';
  sw.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const nt = b.dataset.t;
    applyTheme(nt);
    localStorage.setItem('kast_theme', nt);
    const sep = location.search.includes('theme=') ? '?theme=' : (location.search ? location.search + '&theme=' : '?theme=');
    location.href = location.pathname + sep + nt;
  }));
  document.body.appendChild(sw);
})();
