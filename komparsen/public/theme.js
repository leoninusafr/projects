'use strict';
// Theme-Switcher: lädt das gewählte Theme-CSS zusätzlich zu styles.css.
// Quelle: ?theme= (Vorschau-Link) > localStorage > Server-Setting (site_theme) > 'default'.
// Live-Switcher unten rechts ist für ALLE Besucher sichtbar (zum Vergleich/Auswählen).
(function () {
  const THEMES = {
    default:   { css: null,                  label: 'Apple',    swatch: '#0071e3' },
    block:     { css: '/theme-block.css',     label: 'Block',    swatch: '#0a2540' },
    editorial: { css: '/theme-editorial.css', label: 'Editorial',swatch: '#9b2226' },
    warm:      { css: '/theme-warm.css',      label: 'Warm',     swatch: '#c2410c' },
    serious:   { css: '/theme-serious.css',   label: 'Seriös',   swatch: '#b45309' },
    fresh:     { css: '/theme-fresh.css',     label: 'Frisch',   swatch: '#0d9488' }
  };
  const ORDER = ['default', 'block', 'editorial', 'warm', 'serious', 'fresh'];

  const params = new URLSearchParams(location.search);

  function applyTheme(name, persist) {
    if (!THEMES.hasOwnProperty(name)) name = 'default';
    document.querySelectorAll('link[data-theme]').forEach(l => l.remove());
    const t = THEMES[name];
    if (t.css) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = t.css;
      link.setAttribute('data-theme', '1');
      document.head.appendChild(link);
    }
    document.body.setAttribute('data-theme', name);
    if (persist) localStorage.setItem('kast_theme', name);
  }

  // 1) URL-Param (?theme=) — Vorschau/Live-Vergleich, persistiert
  const fromUrl = params.get('theme');
  if (fromUrl && THEMES.hasOwnProperty(fromUrl)) {
    applyTheme(fromUrl, true);
  } else {
    const stored = localStorage.getItem('kast_theme');
    if (stored && THEMES.hasOwnProperty(stored)) {
      // 2) lokal gespeichert
      applyTheme(stored, false);
    } else {
      // 3) Server-Default (site_theme) — asynchron, fällt auf 'default' zurück
      applyTheme('default', false);
      fetch('/api/settings').then(r => r.ok ? r.json() : null).then(s => {
        const t = s && s.site_theme;
        if (t && THEMES.hasOwnProperty(t) && t !== 'default') applyTheme(t, true);
      }).catch(() => {});
    }
  }

  // ---- Live-Switcher (unten rechts, für alle sichtbar) ----
  const sw = document.createElement('div');
  sw.id = 'themeSwitcher';
  sw.innerHTML =
    '<button class="ts-toggle" type="button" aria-label="Design wechseln">🎨 Design</button>' +
    '<div class="ts-panel hidden">' +
      ORDER.map(k =>
        '<button class="ts-opt" type="button" data-t="' + k + '">' +
        '<span class="ts-dot" style="background:' + THEMES[k].swatch + '"></span>' +
        THEMES[k].label + '</button>').join('') +
    '</div>';
  document.body.appendChild(sw);

  sw.querySelector('.ts-toggle').addEventListener('click', () => {
    sw.querySelector('.ts-panel').classList.toggle('hidden');
  });
  sw.querySelectorAll('.ts-opt').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.t;
    applyTheme(k, true);
    const sep = location.search.includes('theme=') ? '?theme='
      : (location.search ? location.search + '&theme=' : '?theme=');
    history.replaceState(null, '', location.pathname + sep + k);
    sw.querySelector('.ts-panel').classList.add('hidden');
  }));

  // Switcher-CSS (inline, kein extra File nötig)
  const st = document.createElement('style');
  st.textContent =
    '#themeSwitcher{position:fixed;right:14px;bottom:14px;z-index:300;font:inherit}' +
    '#themeSwitcher .ts-toggle{background:var(--ink,#1d1d1f);color:#fff;border:none;' +
    'border-radius:980px;padding:9px 14px;font-size:13px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18)}' +
    '#themeSwitcher .ts-panel{position:absolute;right:0;bottom:48px;background:#fff;' +
    'border:1px solid var(--line,#d2d2d7);border-radius:14px;padding:8px;' +
    'box-shadow:0 8px 30px rgba(0,0,0,.16);display:flex;flex-direction:column;gap:2px;min-width:148px}' +
    '#themeSwitcher .ts-opt{display:flex;align-items:center;gap:8px;background:none;border:none;' +
    'font:inherit;font-size:14px;color:var(--ink,#1d1d1f);padding:8px 10px;border-radius:8px;' +
    'cursor:pointer;text-align:left;width:100%}' +
    '#themeSwitcher .ts-opt:hover{background:rgba(0,0,0,.05)}' +
    '#themeSwitcher .ts-dot{width:12px;height:12px;border-radius:50%;flex:none;border:1px solid rgba(0,0,0,.12)}';
  document.head.appendChild(st);
})();
