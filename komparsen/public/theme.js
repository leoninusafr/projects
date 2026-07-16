'use strict';
// Theme-Switcher: lädt das gewählte Theme-CSS zusätzlich zu styles.css.
// Quelle: ?theme= (Vorschau-Link) > localStorage > Server-Setting (site_theme) > 'default'.
// Themes: default (Apple-neutral), serious (Seriös-Jung), fresh (Frisch-Minimal).
(function () {
  const THEMES = {
    default: null,                 // nur styles.css (+ styles-alt.css für Komponenten)
    serious: '/theme-serious.css',
    fresh: '/theme-fresh.css'
  };

  const params = new URLSearchParams(location.search);
  const fromUrl = params.get('theme');
  const stored = localStorage.getItem('kast_theme');

  function applyTheme(name) {
    name = THEMES.hasOwnProperty(name) ? name : 'default';
    // existierende Theme-Links entfernen
    document.querySelectorAll('link[data-theme]').forEach(l => l.remove());
    const href = THEMES[name];
    if (href) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-theme', '1');
      document.head.appendChild(link);
    }
    document.body.setAttribute('data-theme', name);
  }

  // 1) URL-Param (Vorschau/Live-Vergleich)
  if (fromUrl && THEMES.hasOwnProperty(fromUrl)) {
    applyTheme(fromUrl);
    localStorage.setItem('kast_theme', fromUrl);
  } else if (stored && THEMES.hasOwnProperty(stored)) {
    // 2) lokal gespeichert
    applyTheme(stored);
  } else {
    // 3) Server-Default (site_theme) — asynchron, fällt auf 'default' zurück
    applyTheme('default');
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(s => {
      const t = s && s.site_theme;
      if (t && THEMES.hasOwnProperty(t) && t !== 'default') {
        applyTheme(t);
        localStorage.setItem('kast_theme', t);
      }
    }).catch(() => {});
  }

  // Mini-Switcher NUR im Entwickler-Modus (?dev=1) — echte Besucher sehen ihn nie.
  if (!params.has('dev')) return;
  const sw = document.createElement('div');
  sw.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:99;display:flex;gap:6px;' +
    'background:#fff;border:1px solid var(--line);border-radius:980px;padding:6px;box-shadow:var(--shadow)';
  const btn = (t, label) =>
    '<button data-t="' + t + '" style="border:none;background:transparent;font:inherit;padding:6px 12px;cursor:pointer;border-radius:980px">' + label + '</button>';
  sw.innerHTML = btn('default', 'Std') + btn('serious', 'Seriös') + btn('fresh', 'Frisch');
  sw.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const nt = b.dataset.t;
    applyTheme(nt);
    localStorage.setItem('kast_theme', nt);
    const sep = location.search.includes('theme=') ? '?theme=' : (location.search ? location.search + '&theme=' : '?theme=');
    location.href = location.pathname + sep + nt;
  }));
  document.body.appendChild(sw);
})();
