'use strict';
/* KAST — Startseiten-Logik:
   - füllt optionale Layout-Sektionen (Kartei-Grid).
   - injiziert pro Design eigene Texte (CONTENT-Map), damit
     die Designs sich nicht nur durch Farbe, sondern durch
     Sprache/Aufbau unterscheiden.
   - repariert die Studio-Marquee (Span verdoppelt, damit die
     Animation nahtlos looped und nicht in schwarz ausläuft). */
(function () {
  var CONTENT = {
    block: {
      eyebrow: 'Mitgliedschaft kostenlos',
      title: 'Vom Profil<br>zum Set.',
      lead: 'Werde in zwei Minuten Komparse — und werde von Produktionen in Sekunden gefunden. Ohne Papierkram, ohne Umwege, deutschlandweit.',
      cta1: 'Komparse werden',
      cta2: 'Produktion anmelden',
      statFallback: 'Deutschlandweit verfügbar — werde jetzt Teil der Kartei.',
      cards: [
        ['Für Komparsen', 'Profil in 2 Minuten, Foto per Upload, Selfie alle 6 Monate für aktuelle Sichtbarkeit. DSGVO-konform — du behältst die Kontrolle über deine Daten und kannst sie jederzeit löschen.'],
        ['Für Produktionen', 'Filtern oder frei suchen — „braune Haare, groß, Köln". Komparsen in den Warenkorb, Anfrage mit einem Klick, Export auf Knopfdruck. Zeitnahe Vorschläge, keine Umwege.'],
        ['Vertrauen & Sicherheit', 'DSGVO-konform von Grund auf. Deine Daten gehören dir — Fotos und Profil löschst du jederzeit selbst. Keine Weitergabe an Dritte ohne deine Einwilligung.']
      ],
      quoteMain: 'Ein Gesicht, ein Profil, ein Klick zum Set.',
      quoteSub: 'Kein Papierkram, keine versteckten Kosten — nur der schnellste Weg zwischen dir und deiner nächsten Produktion.'
    },
    studio: {
      eyebrow: 'Casting-Board · Hamburg',
      title: 'Wir casten<br>Menschen.',
      lead: 'Kein SaaS. Kein Bullshit. Komparsen, die in zwei Minuten live sind — und Produktionen, die in Sekunden finden, was sie brauchen.',
      cta1: 'Jetzt casten',
      cta2: 'Produktion buchen',
      statFallback: 'Über 30 Gesichter in der Kartei — deutschlandweit.',
      cards: [
        ['01 / Komparsen', 'Profil in 2 Minuten. Foto hochladen, fertig. Deine Daten bleiben deine — löschbar, DSGVO-konform, ohne Kleingedrucktes.'],
        ['02 / Produktionen', '„Braune Haare, groß, Köln" — und die Kartei liefert. Warenkorb, Anfrage, Export. Kein Casting-Manager nötig.'],
        ['03 / Verschwiegenheit', 'Wir reden nicht. Daten bleiben auf deutschen Servern, kein Verkauf, keine Weitergabe. Punkt.']
      ],
      quoteMain: 'Jeder Mensch hat ein Gesicht.',
      quoteSub: 'Wir bringen es vors Licht — und zwar zu den Produktionen, die danach suchen. Schnell, sauber, DSGVO-konform.'
    },
    editorial: {
      eyebrow: 'Ein Porträt über Komparsen',
      title: 'Das Gesicht<br>hinter der Szene.',
      lead: 'Eine Agentur, die Nebendarsteller ernst nimmt. Wir haben das Profil auf das Wesentliche reduziert — und den Weg zum Set auf einen Klick.',
      cta1: 'Profil lesen',
      cta2: 'Agentur kennenlernen',
      statFallback: 'Eine wachsende Kartei verfügbarer Gesichter — deutschlandweit.',
      cards: [
        ['Der Komparse', 'Früher Papierkram und Tagewarten. Heute: ein Profil in zwei Minuten, ein Selfie alle sechs Monate. Mehr braucht es nicht, um sichtbar zu werden.'],
        ['Die Produktion', 'Ein Suchfeld statt einer Agentur. „Groß, dunkel, München" liefert in Sekunden. Anfrage per Klick, Abrechnung per Export.'],
        ['Das Versprechen', 'DSGVO ist kein Häkchen bei uns, sondern Bauplan. Daten gehören dem Komparsen. Löschbar. Ohne Wenn und Aber.']
      ],
      quoteMain: 'Hinter jeder großen Szene steht ein Gesicht, das man nie vergisst.',
      quoteSub: 'Kast ist die Agentur, die diese Gesichter findbar macht — für Produktionen, die wissen, was sie suchen.'
    },
    kartei: {
      eyebrow: 'Die Kartei · live',
      title: '30 Gesichter.<br>Eine Kartei.',
      lead: 'Unsere Startseite ist keine Werbung. Sie ist die Kartei. Blättere durch verfügbare Komparsen — und werde selbst Teil davon.',
      cta1: 'Selbst eintragen',
      cta2: 'Kartei durchsuchen',
      statFallback: 'Täglich neue Gesichter in der Kartei.',
      cards: [
        ['Sichtbar', 'Dein Profil erscheint in der Kartei, sobald du online bist. Produktionen sehen dich — anonymisiert, bis zur Anfrage.'],
        ['Suchen', 'Produktionen filtern nach Größe, Haarfarbe, Stadt. Die Kartei liefert in Echtzeit, was die Szene braucht.'],
        ['Sicher', 'Kein Gesicht verlässt die Kartei ohne Einwilligung. DSGVO-konform, löschbar, deutsche Server.']
      ],
      quoteMain: 'Die Kartei ist die Seite.',
      quoteSub: 'Kein Marketing-Bullshit — nur Gesichter, die warten, gecastet zu werden.'
    },
    manifest: {
      eyebrow: 'Manifest',
      title: 'Jeder Mensch<br>hat ein Gesicht.',
      lead: 'Wir glauben, dass Sichtbarkeit ein Recht ist, kein Privileg. Kast macht Komparsen zum Profil, das Profil zum Set — in zwei Minuten, kostenlos, DSGVO-konform.',
      cta1: 'Beitreten',
      cta2: 'Manifest lesen',
      statFallback: 'Schließ dich einer wachsenden Kartei verfügbarer Gesichter an.',
      cards: [
        ['Sichtbarkeit ist ein Recht', 'Nicht wer die beste Agentur kennt, soll gecastet werden — sondern wer am besten passt. Wir machen das Profil zur Bühne.'],
        ['Daten gehören dir', 'Wir speichern nur, was nötig ist. Du löschst, wann du willst. DSGVO ist bei uns Bauplan, nicht Beiprogramm.'],
        ['Schnelligkeit ist Respekt', 'Zwei Minuten zum Profil. Ein Klick zur Anfrage. Wir verschwenden deine Zeit nicht mit Formularen.']
      ],
      quoteMain: 'Ein Gesicht. Ein Profil. Ein Klick zum Set.',
      quoteSub: 'Das ist das ganze Geschäftsmodell. Alles andere ist Lärm.'
    },
    intro: {
      eyebrow: 'KAST · Komparsen-Agentur',
      title: 'Vom Profil<br>zum Set.',
      lead: 'Kostenlos Komparse werden. Von Produktionen in Sekunden gefunden. Menschlich, einfach, DSGVO-konform.',
      cta1: 'Komparse werden',
      cta2: 'Produktion anmelden',
      statFallback: 'Deutschlandweit verfügbar — werde jetzt Teil der Kartei.',
      cards: [
        ['Für Komparsen', 'Profil in 2 Minuten, Foto per Upload, Selfie alle 6 Monate für aktuelle Sichtbarkeit. DSGVO-konform — du behältst die Kontrolle.'],
        ['Für Produktionen', 'Filtern oder frei suchen. Komparsen in den Warenkorb, Anfrage mit einem Klick, Export auf Knopfdruck. Keine Umwege.'],
        ['Vertrauen & Sicherheit', 'DSGVO-konform von Grund auf. Deine Daten gehören dir — löschbar, ohne Weitergabe an Dritte.']
      ],
      quoteMain: 'Ein Gesicht, ein Profil, ein Klick zum Set.',
      quoteSub: 'Kein Papierkram, keine versteckten Kosten — nur der schnellste Weg zwischen dir und deiner nächsten Produktion.'
    },
    kino: {
      eyebrow: 'Action! · Casting für Film & Werbung',
      title: 'Licht an.<br>Kamera läuft.',
      lead: 'Vom ersten Callsheet bis zum letzten Take: Kast bringt die Gesichter vors Objektiv, die deine Produktion sucht. Film, Serie, Werbung, Fotoshooting.',
      cta1: 'Für die Kamera',
      cta2: 'Produktion buchen',
      statFallback: 'Über 30 Gesichter bereit fürs Set — deutschlandweit.',
      cards: [
        ['Fürs Bild', 'Ob Still oder Bewegtbild: dein Profil ist dein Casting. Foto, Maße, Typ — in zwei Minuten live, DSGVO-konform.'],
        ['Fürs Set', 'Wirf „Braham, 40er, Berlin, Statisten" in die Suche. Kartei liefert. Callsheet per Export, Anfrage per Klick.'],
        ['Fürs Team', 'Regie will keine Agentur-Mails spammmen. Sie will Ergebnisse. Wir liefern Gesichter, nicht Versprechen — verschwiegen und sicher.']
      ],
      quoteMain: 'Jeder Take braucht ein Gesicht.',
      quoteSub: 'Kast ist der Casting-Regisseur im Browser — schnell, sauber, DSGVO-konform. Bereit, wenn du „Action" sagst.'
    },
    apple: {
      eyebrow: 'Kast',
      title: 'Komparse werden.<br>Ganz einfach.',
      lead: 'In zwei Minuten. Kostenlos. Und wenn du nicht mehr willst, löschst du alles mit einem Klick. So sollten Agenturen sein.',
      cta1: 'Jetzt beginnen',
      cta2: 'Mehr erfahren',
      statFallback: 'Über 30 Komparsen. Bereit, gefunden zu werden.',
      cards: [
        ['Für dich', 'Ein Profil. Ein Foto. Zwei Minuten. Mehr brauchst du nicht, um von Produktionen gefunden zu werden.'],
        ['Für Produktionen', 'Suche, was du brauchst. Frage an. Krieg dein Callsheet. Alles an einem Ort, ohne Umwege.'],
        ['Für dein Gefühl', 'Deine Daten gehören dir. Löschbar. DSGVO-konform. Wir machen es dir leicht, die Kontrolle zu behalten.']
      ],
      quoteMain: 'Manchmal ist weniger einfach mehr.',
      quoteSub: 'Kast macht das Komplizierte einfach — und das Wichtige sicher.'
    },
    parallax: {
      eyebrow: 'Bewegung. Licht. Gesichter.',
      title: 'Wir bewegen<br>die Kamera.',
      lead: 'Kast ist die Agentur, die mitläuft: scrollende Sets, lebendige Gesichter, ein Profil, das dich findbar macht, bevor die Klappe fällt.',
      cta1: 'Mitlaufen',
      cta2: 'Produktion starten',
      statFallback: 'Eine Kartei in Bewegung — täglich neue Gesichter.',
      cards: [
        ['In Bewegung', 'Dein Profil ist kein Stillstand. Selfies, Updates, Sichtbarkeit — alles fließt, damit Produktionen dich live sehen.'],
        ['Im Bild', 'Produktionen scrollen durch die Kartei wie durch ein Drehbuch. Finden den Type, exportieren das Callsheet, rollen die Kamera.'],
        ['Im Fluss', 'Daten fließen nur mit deiner Einwilligung. DSGVO-konform, löschbar, sicher — während alles in Bewegung bleibt.']
      ],
      quoteMain: 'Ein Gesicht in Bewegung sagt mehr als tausend Castings.',
      quoteSub: 'Kast hält die Kartei in Bewegung — für Produktionen, die das nächste Bild schon sehen.'
    }
  };

  function applyContent(name) {
    var c = CONTENT[name] || CONTENT.block;
    if (window.KAST_FALLBACK_STAT === undefined && c.statFallback) window.KAST_FALLBACK_STAT = c.statFallback;
    var set = function (id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; };
    set('heroEyebrow', c.eyebrow);
    set('heroTitle', c.title);
    set('heroLead', c.lead);
    var c1 = document.getElementById('cta1'), c2 = document.getElementById('cta2');
    if (c1) c1.textContent = c.cta1;
    if (c2) c2.textContent = c.cta2;
    set('quoteMain', c.quoteMain);
    set('quoteSub', c.quoteSub);
    var pitch = document.getElementById('pitch');
    if (pitch && c.cards) {
      var cards = pitch.querySelectorAll('.card');
      c.cards.forEach(function (card, i) {
        if (!cards[i]) return;
        var h = cards[i].querySelector('h3');
        var p = cards[i].querySelector('p');
        if (h) h.textContent = card[0];
        if (p) p.textContent = card[1];
      });
    }
  }
  // Hook: wird von theme.js nach jedem apply() aufgerufen
  window.KAST_APPLY_CONTENT = applyContent;

  // Kartei-Grid mit anonymisierten Kacheln füllen (DSGVO)
  function fillKartei() {
    var grid = document.getElementById('karteiGrid');
    if (!grid) return;
    var n = 12;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ fillKartei(); });
  } else { fillKartei(); }
})();
