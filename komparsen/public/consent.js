'use strict';
// DSGVO-Cookie-/Consent-Banner — eigenständig, keine Abhängigkeiten.
// Zeigt Besuchern einen Hinweis + Einwilligungs-Buttons.
// Einwilligung wird lokal (localStorage) gespeichert — DSGVO-konform (Opt-in).
(function () {
  const KEY = 'kast_consent';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }

  const bar = document.createElement('div');
  bar.id = 'consentBar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Einwilligung zu Cookies und lokaler Datenspeicherung');
  bar.innerHTML =
    '<div class="consent-inner">' +
      '<p class="consent-text">Wir verwenden nur technisch notwendige Cookies und speichern ' +
      'deine Sitzung lokal. Für Casting-Fotos (biometrische Daten, Art. 9 DSGVO) ' +
      'holen wir deine ausdrückliche Einwilligung separat im Profil ein. ' +
      '<a href="/impressum.html">Mehr im Datenschutz</a>.</p>' +
      '<div class="consent-actions">' +
        '<button class="btn sm" id="consentOk">Verstanden — weiter</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(bar);

  document.getElementById('consentOk').addEventListener('click', () => {
    try { localStorage.setItem(KEY, JSON.stringify({ ok: true, at: new Date().toISOString() })); } catch (e) {}
    bar.remove();
  });
})();
