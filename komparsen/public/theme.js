'use strict';
/* KAST — Design-Switcher.
   Default = Studio (dein Favorit, 90%).
   Gleichwertige Alternativen: Editorial (Magazin), Kartei (Gesichter-Grid),
   Manifest (großer Statement). Jedes mit eigenem Aufbau + Texten.
   Layout-Sektionen (Kartei/Manifest) werden je nach Theme ein/ausgeblendet.
   Wahl in localStorage; ?theme= überschreibt. */
(function () {
  var THEMES = {
    studio:   { label: 'Studio',   css: '/theme-studio.css',   body: 'theme-studio',   layouts: [] },
    editorial:{ label: 'Editorial', css: '/theme-editorial.css', body: 'theme-editorial', layouts: [] },
    kartei:   { label: 'Kartei',   css: '/theme-kartei.css',   body: 'theme-kartei',   layouts: ['kartei'] },
    manifest: { label: 'Manifest', css: '/theme-manifest.css', body: 'theme-manifest', layouts: ['manifest'] }
  };
  var KEY = 'kast_theme';
  var current = 'studio';

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
    document.querySelectorAll('[data-layout-section]').forEach(function () {});
    document.querySelector('.layout-kartei') && document.querySelector('.layout-kartei').classList.toggle('hidden', t.layouts.indexOf('kartei') < 0);
    document.querySelector('.layout-manifest') && document.querySelector('.layout-manifest').classList.toggle('hidden', t.layouts.indexOf('manifest') < 0);
    try { localStorage.setItem(KEY, name); } catch (e) {}
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme-btn') === name);
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
    var fromUrl = new URLSearchParams(location.search).get('theme');
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var start = (fromUrl && THEMES[fromUrl]) ? fromUrl : (saved && THEMES[saved]) ? saved : 'studio';
    apply(start);
    buildSwitcher();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
