'use strict';
/* KAST — Design-Switcher.
   6 gleichwertige Designs:
     - block     = seriös-ecke (Navy, in styles.css = Default)
     - studio    = kantig / Branche (dein Favorit)
     - editorial  = Magazin, ruhig
     - kartei     = Startseite IST die Kartei (Gesichter-Grid)
     - manifest   = großer Statement-Block
     - intro      = warmer Startbildschirm, dann Seite
   Jedes Theme lädt eigene CSS (block = Basis, keine Extra-Datei nötig).
   Layout-Sektionen (Kartei/Manifest) werden je nach Theme ein/ausgeblendet.
   Wahl in localStorage; ?theme= überschreibt. */
(function () {
  var THEMES = {
    block:    { label: 'Block',     css: null,                    body: null,             layouts: [] },
    studio:   { label: 'Studio',    css: '/theme-studio.css',    body: 'theme-studio',   layouts: [] },
    editorial:{ label: 'Editorial',  css: '/theme-editorial.css', body: 'theme-editorial', layouts: [] },
    kartei:   { label: 'Kartei',    css: '/theme-kartei.css',    body: 'theme-kartei',   layouts: ['kartei'] },
    manifest: { label: 'Manifest',  css: '/theme-manifest.css',  body: 'theme-manifest', layouts: ['manifest'] },
    intro:    { label: 'Intro',     css: '/theme-intro.css',     body: 'theme-intro',    layouts: [] }
  };
  var KEY = 'kast_theme';
  var current = 'studio';
  var introDismissed = false;

  function apply(name) {
    var t = THEMES[name]; if (!t) name = 'studio', t = THEMES.studio;
    current = name;
    var old = document.getElementById('kast-theme-css');
    if (old) old.remove();
    document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
    if (t.css) {
      var link = document.createElement('link');
      link.id = 'kast-theme-css'; link.rel = 'stylesheet'; link.href = t.css;
      document.head.appendChild(link);
    }
    if (t.body) document.body.classList.add(t.body);
    // optionale Layout-Sektionen zeigen/verstecken
    document.querySelector('.layout-kartei') && document.querySelector('.layout-kartei').classList.toggle('hidden', t.layouts.indexOf('kartei') < 0);
    document.querySelector('.layout-manifest') && document.querySelector('.layout-manifest').classList.toggle('hidden', t.layouts.indexOf('manifest') < 0);
    // Intro-Overlay nur zeigen, wenn Theme=intro und nicht schon dismissed
    toggleIntro(name === 'intro' && !introDismissed);
    try { localStorage.setItem(KEY, name); } catch (e) {}
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme-btn') === name);
    });
  }

  function dismissIntro() {
    introDismissed = true;
    toggleIntro(false);
    try { localStorage.setItem('kast_intro_seen', '1'); } catch (e) {}
  }
  function toggleIntro(show) {
    var ov = document.querySelector('.intro');
    if (!ov) return;
    if (show) { document.body.classList.remove('intro-closed'); ov.style.display = ''; }
    else { document.body.classList.add('intro-closed'); ov.style.display = 'none'; }
  }
  function wireIntro() {
    var ov = document.querySelector('.intro');
    if (!ov) return;
    try { introDismissed = localStorage.getItem('kast_intro_seen') === '1'; } catch (e) {}
    ov.addEventListener('click', dismissIntro);
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismissIntro(); }
    });
  }

  function buildSwitcher() {
    var wrap = document.createElement('div');
    wrap.id = 'kast-switcher';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Design wechseln');
    var html = '<span class="kast-sw-label">Design</span>';
    Object.keys(THEMES).forEach(function (k) {
      html += '<button data-theme-btn="' + k + '" type="button">' + THEMES[k].label + '</button>';
    });
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme-btn]');
      if (b) apply(b.getAttribute('data-theme-btn'));
    });
  }

  function init() {
    // 1) Server-Setting (Admin-Wahl) hat Vorrang, falls gesetzt
    // 2) sonst localStorage
    // 3) sonst Default = studio
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(s => {
      const serverTheme = s && s.site_theme && THEMES[s.site_theme] ? s.site_theme : null;
      const fromUrl = new URLSearchParams(location.search).get('theme');
      const saved = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
      const start = (fromUrl && THEMES[fromUrl]) ? fromUrl : (serverTheme || (saved && THEMES[saved] ? saved : 'studio'));
      apply(start);
      wireIntro();
      buildSwitcher();
    }).catch(() => {
      const fromUrl = new URLSearchParams(location.search).get('theme');
      const saved = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
      apply((fromUrl && THEMES[fromUrl]) ? fromUrl : (saved && THEMES[saved] ? saved : 'studio'));
      wireIntro();
      buildSwitcher();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
