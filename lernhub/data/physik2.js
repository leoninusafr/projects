/* Physik 2 — Klausur WS25 (Lösungen)
 * Geparst aus "Physik 2 - Prüfung WS25 (Lösungen).pdf".
 * Formeln als LaTeX (KaTeX). Typen: short, wf, numeric, choice.
 */
window.MODULE_PHYS2 = {
  id: "phys2",
  title: "Physik 2",
  icon: "i-atom",
  meta: "Medientechnik · WM · unbegrenzte Formelsammlung erlaubt",
  questions: [
    /* 1. Wechselwirkungen */
    { id: "phys2-1", type: "choice", multiple: true,
      prompt: "Geben Sie die grundlegenden Wechselwirkungen (Stand 2026) der Physik an.",
      choices: ["Gravitation", "Elektromagnetische Wechselwirkung", "Starke Wechselwirkung", "Schwache Wechselwirkung", "Magnetische Wechselwirkung", "Thermische Wechselwirkung"],
      correct: [0, 1, 2, 3],
      explain: "Die 4 fundamentalen Kräfte: Gravitation, elektromagnetisch, stark (Kernkraft), schwach (radioaktiver Zerfall). Magnetismus ist Teil der elektromagnetischen; 'thermisch' ist keine Grundkraft." },

    /* 2. SI-Einheiten */
    { id: "phys2-2", type: "short",
      prompt: "Geben Sie für die Größen die SI-Einheiten (Symbol) an: Beschleunigung, Frequenz, Federkonstante, Energie, Massendichte, Schalldruck.",
      solution: "Beschleunigung: m/s² · Frequenz: Hz (1/s) · Federkonstante: N/m · Energie: J · Massendichte: kg/m³ · Schalldruck: Pa",
      explain: "Alle abgeleitet aus Basiseinheiten: $a = \\tfrac{m}{s^2}$, $f = \\tfrac{1}{s}$, $D = \\tfrac{N}{m}$, $E = J = N\\cdot m$, $\\rho = \\tfrac{kg}{m^3}$, $p = Pa = \\tfrac{N}{m^2}$." },

    /* 3. Federpendel */
    { id: "phys2-3a", type: "short",
      prompt: "Federpendel (Masse m, Federkonstante D, g). Stellen Sie eine Gleichung auf, die die wirkenden Kräfte enthält.",
      solution: "Gewichtskraft $F_g = mg$ (unten), Federkraft $F_F = -D x$ (oben, rückstellend). Bewegungsgleichung: $m\\ddot{x} = -D x$.",
      explain: "Newtons 2. Gesetz mit rückstellender Federkraft. Das ist die Differentialgleichung des harmonischen Oszillators." },
    { id: "phys2-3b", type: "short",
      prompt: "Wie heißt die Gleichung $m\\ddot{x} = -D x$?",
      solution: "Differentialgleichung des harmonischen Oszillators (Bewegungsgleichung des Federpendels).",
      explain: "Standardform des ungedämpften Harmonischen Oszillators." },
    { id: "phys2-3c", type: "numeric",
      prompt: "Mit welcher Frequenz schwingt die Kugel (ausgelenkt, losgelassen)? Kreisfrequenz $\\omega = \\sqrt{D/m}$. Geben Sie f in Hz an. (D = {{d}} N/m, m = {{m}} kg)",
      unit: "Hz",
      placeholder: "z. B. 1.5",
      values: { d: { v: 20, variants: [20, 50, 10] }, m: { v: 2, variants: [2, 1, 4] } },
      compute(v) { return Math.sqrt(v.d / v.m) / (2 * Math.PI); },
      extra(v) { return { omega: Math.sqrt(v.d / v.m) }; },
      explain:
        "Kreisfrequenz: $\\omega = \\sqrt{D/m} = \\sqrt{{{d}}/{{m}}} = {{omega}}$ rad/s.\n" +
        "Frequenz: $f = \\tfrac{\\omega}{2\\pi} = {{ans}}$ Hz.\n" +
        "(Bei 50 N/m, 1 kg → f ≈ 1,13 Hz; Werte variieren mit D,m.)" },

    /* 4. Satz korrigieren */
    { id: "phys2-4a", type: "short",
      prompt: "Korrigieren: 'Das zweite Newton'sche Gesetz besagt: Kraft = Masse · Geschwindigkeit'.",
      solution: "Kraft = Masse · Beschleunigung: $F = m\\cdot a$ (nicht Geschwindigkeit).",
      explain: "2. Newton: $F = m\\,a$. Geschwindigkeit wäre Impuls $p = m\\,v$." },
    { id: "phys2-4b", type: "short",
      prompt: "Korrigieren: 'Der Tagesverbrauch der Beleuchtung liegt bei 2 Kilowatt.'",
      solution: "2 Kilowatt ist Leistung — Verbrauch ist Energie: 2 kWh (Kilowattstunde).",
      explain: "kW = Leistung (P), kWh = Energie (E = P·t)." },
    { id: "phys2-4c", type: "short",
      prompt: "Korrigieren: 'Druck im Sonneninneren bei 2·10¹⁶ Pa/m³.'",
      solution: "Einheit Pa/m³ ist falsch — Druck hat Einheit Pa (Pascal), nicht Pa/m³.",
      explain: "Druck $p = \\tfrac{F}{A}$ in Pascal." },
    { id: "phys2-4d", type: "short",
      prompt: "Korrigieren: 'Energiebedarf eines Babys liegt bei 2,5 Millionen Joule.'",
      solution: "2,5 Millionen Joule = 2,5 MJ pro Tag (Angabe der Zeiteinheit fehlt im Original).",
      explain: "MJ = Megajoule, sinnvoll als Tagesenergiebedarf." },
    { id: "phys2-4e", type: "short",
      prompt: "Korrigieren: 'PKW mit defektem Schalldämpfer erzeugt 95 dB, entspricht 3,16 mW/m² Leistung.'",
      solution: "Korrekt ist mW/m² (Flächenleistung / Intensität), nicht nur mW. Angabe als Intensität I = 3,16 mW/m².",
      explain: "Schalldruckpegel L_p hängt mit Intensität $I$ zusammen: $L_p = 10\\log_{10}(I/I_0)$, $I_0=10^{-12}$ W/m²." },

    /* 5. Erzwungene Schwingung / Resonanz */
    { id: "phys2-5a", type: "short",
      prompt: "Was kennzeichnet eine resonante Schwingung?",
      solution: "Maximale Amplitude, weil besonders effizient Energie vom Anreger auf das System übertragen wird.",
      explain: "Resonanz: Anregungsfrequenz ≈ Eigenfrequenz." },
    { id: "phys2-5b", type: "short",
      prompt: "Welche Bedingung muss erfüllt sein, damit es zur Resonanz kommt?",
      solution: "Anregungsfrequenz nahe der Eigenfrequenz des Systems.",
      explain: "Bei gleicher Frequenz schaukelt sich die Schwingung auf." },
    { id: "phys2-5c", type: "short",
      prompt: "Welche Folgen kann eine Resonanz auslösen? Nennen Sie ein Beispiel aus Tontechnik/Musik.",
      solution: "Sehr große Amplituden, im Extremfall Zerstörung (Brücken). Beispiel: Resonanzkörper (Gitarre), Helmholtz-Resonator (Lautsprechergehäuse), Wolftöne.",
      explain: "Resonanz verstärkt Schwingungen — nützlich (Instrument) oder gefährlich (Bauwerke)." },

    /* 6. Aperiodischer Grenzfall */
    { id: "phys2-6", type: "short",
      prompt: "Beschreiben Sie den aperiodischen Grenzfall (kritische Dämpfung).",
      solution: "System schwingt nicht mehr, kehrt möglichst schnell in Gleichgewichtslage zurück, kein Überschwingen.",
      explain: "Grenze zwischen Kriechfall (überdämpft) und Schwingfall (unterdämpft)." },

    /* 7. 3dB Abfall */
    { id: "phys2-7", type: "choice",
      prompt: "Tiefpass: '3dB Abfallfrequenz liegt bei 10 kHz.' Welche Aussage ist richtig?",
      choices: [
        "Es werden keine Frequenzen oberhalb von 10 kHz durchgelassen.",
        "Es werden keine Frequenzen unterhalb von 10 kHz durchgelassen.",
        "Die abgegebene Leistung einer Frequenz von 10 kHz beträgt 50% der eingespeisten Leistung.",
        "Bei 1 Watt Eingang werden am Ausgang noch 1/3 Watt abgegeben.",
        "Alle anderen Alternativen sind falsch."
      ],
      correct: 2,
      explain:
        "3 dB Abfall = halbe Leistung ($10\\log_{10}(0{,}5) \\approx -3$ dB). Also bei 10 kHz genau 50% Leistung. Frequenzen darüber werden nur gedämpft, nicht blockiert." },

    /* 8. Effektivwert */
    { id: "phys2-8", type: "numeric",
      prompt: "Effektivwert: Mittlere Leistung an Widerstand R = 1 kΩ. Periodendauer T = 6 s (skizziert). Ergebnis aus Klausur ~0,56 mW. Berechnen Sie P in mW (mit den gegebenen Intervallen).",
      unit: "mW",
      placeholder: "z. B. 0.56",
      values: { r: { v: 1000, variants: [1000, 2000] } },
      compute(v) {
        // Integral aus Aufgabe: Gesamtintegral = 10/3 V²s (aus Klausur)
        const intU2 = 10 / 3;
        const T = 6;
        const P = (1 / (T * v.r)) * intU2; // W
        return P * 1000; // mW
      },
      extra(v) { const intU2 = 10 / 3; return { intU2, P: (1 / (6 * v.r)) * intU2 }; },
      explain:
        "Effektivwert der Spannung: $U_{eff} = \\sqrt{\\tfrac{1}{T}\\int_0^T u(t)^2 dt}$.\n" +
        "Mittlere Leistung: $P = \\tfrac{U_{eff}^2}{R} = \\tfrac{1}{T\\,R}\\int u(t)^2 dt$.\n" +
        "Gesamtintegral (Klausur): $\\int u(t)^2 dt = \\tfrac{10}{3}\\,V^2s$.\n" +
        "Mit R = {{r}} Ω, T = 6 s: $P = \\tfrac{1}{6\\cdot{{r}}}\\cdot\\tfrac{10}{3} = {{ans}}$ mW." },

    /* 9. Schallarten */
    { id: "phys2-9", type: "short",
      prompt: "Welche Schallarten werden unterschieden?",
      solution: "Luftschall (Gase, z.B. Luft), Körperschall (Festkörper, Wände, Stahlträger), Flüssigkeitsschall (Flüssigkeiten, z.B. Wasser).",
      explain: "Unterscheidung nach Ausbreitungsmedium." },

    /* 10. Zusammenhang c, f, λ */
    { id: "phys2-10", type: "short",
      prompt: "In welcher Beziehung stehen Geschwindigkeit, Frequenz und Wellenlänge?",
      solution: "$c = \\lambda \\cdot f$ — Ausbreitungsgeschwindigkeit = Wellenlänge · Frequenz.",
      explain: "$c$ in m/s (Schall Luft ≈ 343 m/s), $\\lambda$ in m, $f$ in Hz." },

    /* 11. Wellenzahl und mehr */
    { id: "phys2-11", type: "short",
      prompt: "Zusammenhang Frequenz, Kreisfrequenz, Wellenlänge und Wellenzahl einer ebenen Welle?",
      solution: "Wellenzahl $k = \\tfrac{2\\pi}{\\lambda}$, Kreisfrequenz $\\omega = 2\\pi f$, $c = \\lambda f$, $\\omega = c\\cdot k$.",
      explain: "Alle verknüpft über $c$: $k=\\tfrac{2\\pi}{\\lambda}$, $\\omega=2\\pi f$, $\\omega=c\\,k$." },

    /* 12. Party-Gag Helium */
    { id: "phys2-12", type: "short",
      prompt: "Warum spricht man mit Helium mit 'Micky-Maus'-Stimme?",
      solution: "Schallgeschwindigkeit in Helium (~1000 m/s) >> Luft (~340 m/s). Dadurch steigt die Frequenz der Formanten/Resonanz der Stimmbahn bei gleicher Anregung durch die Stimmbänder.",
      explain: "Die Stimmlippenfrequenz bleibt gleich, aber die Resonanz der Luftfüllung verschiebt sich nach oben → höhere wahrgenommene Tonhöhe." },

    /* 13. Orgelpfeife Temperatur */
    { id: "phys2-13", type: "numeric",
      prompt: "Orgelpfeife bei 5°C: 440 Hz. Welche Tonhöhe bei 35°C? (Rohrlänge = Wellenlänge gleich). $c(T) = 331 + 0{,}6\\,T$.",
      unit: "Hz",
      placeholder: "z. B. 464",
      values: { t1: { v: 5, variants: [5, 0, 10] }, t2: { v: 35, variants: [35, 30, 40] }, f1: { v: 440, variants: [440] } },
      compute(v) {
        const c1 = 331 + 0.6 * v.t1, c2 = 331 + 0.6 * v.t2;
        return (v.f1 * c2) / c1;
      },
      extra(v) { const c1 = 331 + 0.6 * v.t1, c2 = 331 + 0.6 * v.t2; return { c1, c2 }; },
      explain:
        "$c(5°) = 331 + 0{,}6\\cdot{{t1}} = {{c1}}$ m/s; $c(35°) = 331 + 0{,}6\\cdot{{t2}} = {{c2}}$ m/s.\n" +
        "Bei gleicher Wellenlänge: $f_2 = f_1\\cdot\\tfrac{c_2}{c_1} = 440\\cdot\\tfrac{{{c2}}}{{{c1}}} = {{ans}}$ Hz.\n" +
        "Wärmer → schneller → höher." },

    /* 14. Graphen */
    { id: "phys2-14", type: "short",
      prompt: "Welche Schallgeschwindigkeit erwarten Sie bei Graphen im Vergleich zu Diamant? Begründung.",
      solution: "Höher als Diamant (>18.000 m/s). Begründung: $c = \\sqrt{E/\\rho}$ — Graphen ist steifer (höheres E) und leichter (kleineres ρ).",
      explain: "Schallgeschwindigkeit wächst mit $\\sqrt{E/\\rho}$. Graphen kombiniert hohen Elastizitätsmodul mit geringer Dichte." },

    /* 15. Straßenbahn-Telefon */
    { id: "phys2-15", type: "short",
      prompt: "Parabolschalen an der Haltestelle (Straßenbahn-'Telefon'): Welches physikalische Prinzip?",
      solution: "Reflexion und Bündelung von Schallwellen an parabolischen Flächen (wie Parabolspiegel in der Optik).",
      explain: "Sprecher im Brennpunkt → paralleles Schallbündel; gegenüberliegende Schale reflektiert in ihren Brennpunkt (Ohr)." },

    /* 16. Schall-Schnelle */
    { id: "phys2-16a", type: "short",
      prompt: "Was versteht man unter der Schnelle des Schalls?",
      solution: "Die (Schall-)Schnelle v ist die Augenblicksgeschwindigkeit, mit der sich die Luftteilchen um ihre Ruhelage schwingen (gerichtete Größe, Vektor, ändert sich ständig).",
      explain: "Nicht zu verwechseln mit der Schallgeschwindigkeit c (Ausbreitung der Welle). Die Teilchen bewegen sich nur mikrometerweit hin und her." },
    { id: "phys2-16b", type: "short",
      prompt: "Was unterscheidet die Schall-Schnelle von der Schallgeschwindigkeit?",
      solution: "Schallgeschwindigkeit c = Ausbreitung der Welle im Raum (~343 m/s). Schallschnelle v = Geschwindigkeit der Teilchen selbst (v ≪ c, im µm-Bereich).",
      explain: "Die Welle rast über weite Strecken, die Teilchen wackeln nur minimal." },
    { id: "phys2-16c", type: "short",
      prompt: "Welche physikalische Einheit hat die Schall-Schnelle?",
      solution: "Meter pro Sekunde (m/s) — wie jede Geschwindigkeit.",
      explain: "Trotz kleiner Werte in der Praxis (oft µm/s) ist die SI-Einheit m/s." },

    /* 17. Fechner'sches Gesetz */
    { id: "phys2-17", type: "short",
      prompt: "Beschreiben Sie in Kürze den Inhalt des Fechner'schen (Weber-Fechner-)Gesetzes.",
      solution: "Die Empfindungsstärke E wächst proportional zum Logarithmus der Reizintensität S: $E = k \\cdot \\ln\\tfrac{S}{S_0}$.",
      explain: "Wahrnehmung ist logarithmisch: 10× Energie ≈ +10 dB ≈ doppelte Lautheit. Wir empfinden Reizänderungen nicht linear." },

    /* 18. dB(A) */
    { id: "phys2-18", type: "short",
      prompt: "Warum wurde das dB(A) für den Schalldruckpegel eingeführt? Skizzieren Sie den dB(A)-zu-Frequenz-Verlauf.",
      solution: "dB(A) gewichtet Frequenzen wie das menschliche Ohr (empfindlich 2–5 kHz, unempfindlich bei tiefen/hohen Frequenzen). Verlauf: Bewertungskurve, die tiefe und sehr hohe Frequenzen absenkt, Mitte (≈3–4 kHz) durchlässt.",
      explain: "dB(A) ist eine Nummer, die mit unserer Lautstärke-Empfindung korreliert, nicht mit rein physikalischer Energie." },

    /* 19. Kugelwelle */
    { id: "phys2-19", type: "short",
      prompt: "Wie ändert sich der Schalldruck einer Kugelwelle bei Vervierfachung des Abstands (nur Fernfeld)?",
      solution: "Im Fernfeld gilt $p \\sim \\tfrac{1}{r}$ (Abstandsgesetz). Bei 4× Abstand sinkt der Schalldruck auf ein Viertel ($1/4$).",
      explain: "Kugelwelle: Energie verteilt sich auf Kugelfläche $4\\pi r^2$ → Schalldruck ∝ 1/r, Schallintensität ∝ 1/r²." },

    /* 20. Klirrverzerrungen */
    { id: "phys2-20", type: "short",
      prompt: "Warum kommt es bei sehr hohen Schalldrücken zu Klirrverzerrungen und Intermodulation?",
      solution: "Nichtlinearität der Luft: bei hohem Schalldruck ist Druck–Dichte nicht mehr linear. Verdichtung → lokale Erwärmung → c steigt → Wellenberge laufen schneller als Täler → Sinuskurve verformt sich. Folge: neue Obertöne (Klirr) und bei mehreren Tönen Summen-/Differenztöne (Intermodulation).",
      explain: "Ursache ist das Nichtlinearwerden des Mediums bei extremen Pegeln (thermische Effekte)." },

    /* 21. Vier Gruppen von Musikinstrumenten */
    { id: "phys2-21", type: "choice", multiple: true,
      prompt: "Wie lauten die vier Hauptgruppen, nach denen Musikinstrumente klassifiziert werden?",
      choices: ["Chordophone (Saitenklinger, z.B. Gitarre)", "Idiophone (Selbstklinger, z.B. Xylophon)", "Membranophone (Fellklinger, z.B. Trommel)", "Aerophone (Luftklinger, z.B. Flöte)", "Elektrophone (elektr. Klangerzeugung)", "Luminescente (Lichtklang)"],
      correct: [0, 1, 2, 3],
      explain: "Hornbostel-Sachs: Chordophone, Idiophone, Membranophone, Aerophone. Elektrophone manchmal als 5. Gruppe; Luminescente gibt es nicht." },

    /* 22. Noise-Cancelling */
    { id: "phys2-22", type: "short",
      prompt: "Beschreiben Sie kurz die Funktionsweise von Noise-Cancelling-Kopfhörern. Welches physikalische Prinzip?",
      solution: "Aktive Unterdrückung durch Interferenz: der Kopfhörer sendet den invertierten (um 180° phasenverschobenen) Außenschall, der sich mit dem Störschall auslöscht (destruktive Interferenz).",
      explain: "Prinzip: Überlagerung zweier Wellen gleicher Amplitude, gegensätzlicher Phase → Auslöschung." },

    /* 23. Reale Klaviersaite */
    { id: "phys2-23", type: "short",
      prompt: "Warum sind die harmonischen Oberwellen einer realen Klaviersaite meist nicht ganzzahlige Vielfache der Grundfrequenz?",
      solution: "Biegesteifigkeit der dicken Saite wirkt als zusätzliche rücktreibende Kraft (über die reine Saitenspannung hinaus). Sie wächst mit der Ordnung (kürzere Wellenlänge → stärkere Biegung), wodurch die Frequenzen der oberen Teiltöne nach oben 'wegrutschen'.",
      explain: "Ideale Saite: $f_n = n\\cdot f_1$. Reale Saite: $f_n > n\\cdot f_1$ für wachsende n wegen Biegesteifigkeit." },

    /* 24. Xylophon */
    { id: "phys2-24", type: "short",
      prompt: "Warum sind beim Xylophon die Stäbe in der Regel nicht quaderförmig (sondern ausgekehlt)?",
      solution: "Die Auskehlung in der Mitte macht den Stab dort flexibler → senkt die Biegefrequenz (Frequenzsenkung), ohne die Enden zu schwächen. So lässt sich die gewünschte Tonhöhe bei handhabbarer Stablänge erreichen.",
      explain: "Durch das 'Aushöhlen' ändert sich die effektive Steifigkeit und damit die Eigenfrequenz." },

    /* 25. Mündungskorrektur */
    { id: "phys2-25a", type: "short",
      prompt: "Erklären Sie den Begriff Mündungskorrektur und geben Sie ein Beispiel an.",
      solution: "Die akustisch wirksame Länge eines Rohres ist größer als die geometrische Länge, weil die Welle erst kurz hinter der Öffnung reflektiert wird. Beispiel: Blockflöte klingt tiefer, als man aus der Rohrlänge berechnet.",
      explain: "Die Reflexion erfolgt nicht exakt an der Rohrmündung, sondern etwas außerhalb → effektiv längeres Rohr → tiefere Frequenz." },
    { id: "phys2-25b", type: "short",
      prompt: "Welche Faustformel wird für die Mündungskorrektur empfohlen?",
      solution: "Für ein freies Ende: $\\Delta L \\approx 0{,}6 \\cdot r$ (r = Rohrradius).",
      explain: "Die Korrektur der wirksamen Länge beträgt etwa 0,6× Radius pro offenes Ende (bei beidseitig offen: 2×)." }
  ]
};
