'use strict';
/* KAST — Design-Switcher.
   DEFAULT = „Block" (eckig/strukturiert, dein Favorit).
   Editorial / Studio / Intro = eigene CSS-Dateien mit eigenem Aufbau.
   Auswahl in localStorage; ?theme= im URL überschreibt. */
(function () {
  var THEMES = {
    block:     { label: 'Block',     css: null,                    body: '' },
    editorial: { label: 'Editorial', css: '/theme-editorial.css',  body: 'theme-editorial' },
    studio:    { label: 'Studio',    css: '/theme-studio.css',     body: 'theme-studio' },
    intro:     { label: 'Intro',     css: '/theme-intro.css',      body: 'theme-intro' }
  };
  var KEY = 'kast_theme';
  var current = 'block';

  function apply(name) {
    var t = THEMES[name]; if (!t) name = 'block', t = THEMES.block;
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
    if (t.body === 'theme-intro') setupIntro();
    try { localStorage.setItem(KEY, name); } catch (e) {}
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme-btn') === name);
    });
  }

  function setupIntro() {
    if (document.querySelector('.intro')) return;
    var intro = document.createElement('div');
    intro.className = 'intro';
    intro.innerHTML =
      '<div class="intro-kicker">Kast — Komparsen-Agentur</div>' +
      '<h1 class="intro-title">Menschen. Vor der Kamera.</h1>' +
      '<p class="intro-sub">Kostenlos Komparse werden. Von Produktionen in Sekunden gefunden.</p>' +
      '<div class="intro-go">Los geht\'s</div>' +
      '<div class="intro-foot">Tippen oder scrollen zum Start</div>';
    document.body.appendChild(intro);
    function close() { document.body.classList.add('intro-closed'); }
    intro.addEventListener('click', close);
    window.addEventListener('scroll', function once() {
      if (window.scrollY > 10) { close(); window.removeEventListener('scroll', once); }
    }, { passive: true });
    setTimeout(close, 6000);
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
    var start = (fromUrl && THEMES[fromUrl]) ? fromUrl : (saved && THEMES[saved]) ? saved : 'block';
    apply(start);
    buildSwitcher();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
