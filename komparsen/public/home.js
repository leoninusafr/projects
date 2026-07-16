'use strict';
/* KAST — Startseiten-Logik: füllt optionale Layout-Sektionen.
   - Kartei-Grid: anonymisierte Porträt-Kacheln (keine echten Fotos, DSGVO).
     Zeigt die "Dichte" der Kartei, nicht echte Gesichter. */
(function () {
  // Kartei-Grid mit anonymisierten Kacheln füllen (Anzahl aus Statistik)
  function fillKartei() {
    var grid = document.getElementById('karteiGrid');
    if (!grid) return;
    var n = 12;
    try {
      var raw = document.getElementById('stat');
      // Anzahl grob aus dem stat-Text ableiten, fallback 12
    } catch (e) {}
    var initials = ['M','L','K','S','J','A','T','R','N','B','E','F','C','D','P','V'];
    var hues = [12, 28, 200, 320, 145, 260, 95, 350];
    var html = '';
    for (var i = 0; i < n; i++) {
      var ini = initials[i % initials.length];
      var hue = hues[i % hues.length];
      html += '<div class="kartei-cell" title="Verfügbare:r Komparse" aria-hidden="true">' +
        '<div class="kartei-face" style="background:hsl(' + hue + ' 40% 88%)">' +
        '<span style="color:hsl(' + hue + ' 45% 35%)">' + ini + '</span></div>' +
        '<div class="kartei-meta"></div></div>';
    }
    grid.innerHTML = html;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillKartei);
  else fillKartei();
})();
