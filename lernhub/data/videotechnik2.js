/* Videotechnik 2 — Übungsaufgaben (VID2 V1.4)
 * Geparst aus "Übungsaufgaben Videotechnik 2 VID2 V1.4.pdf".
 * Typen: short (Kurzfrage, Selbst-Check), wf (Wahr/Falsch), numeric (Rechnung), choice, huffman.
 */
window.MODULE_VT2 = {
  id: "vt2",
  title: "Videotechnik 2",
  icon: "i-film",
  meta: "Medientechnik · WM · 1× DIN A4 Handzettel + Taschenrechner erlaubt",
  questions: [
    /* ---- 1. Kurz und knapp (a–r) ---- */
    { id: "vt2-1a", type: "short", prompt: "Wofür steht die Abkürzung LCD?",
      solution: "Liquid Crystal Display — Flüssigkristallbildschirm.",
      explain: "LCD nutzt Flüssigkristalle, deren Ausrichtung durch Spannung gesteuert wird, um Licht zu modulieren. Hintergrundbeleuchtung nötig (selbst nicht leuchtend)." },
    { id: "vt2-1b", type: "short", prompt: "Was sind die Grundfarben der additiven Farbmischung?",
      solution: "Rot, Grün, Blau (R,G,B).",
      explain: "Additiv = Licht wird addiert. Alle drei ergeben Weiß. (Subtraktiv wäre C,M,Y,K — Farbstoffe.)" },
    { id: "vt2-1c", type: "short", prompt: "Nennen Sie 3 Wege, über die das digitale Fernsehen verbreitet werden kann.",
      solution: "z.B. DVB-S (Satellit), DVB-C (Kabel), DVB-T (terrestrisch/antenne); optional: IPTV/Streaming.",
      answers: ["DVB-S", "DVB-C", "DVB-T", "IPTV", "Streaming", "DVB-S2"], required: 3,
      explain: "DVB = Digital Video Broadcasting. Die drei klassischen Übertragungswege sind Satellit, Kabel und terrestrisch." },
    { id: "vt2-1d", type: "short", prompt: "Wofür steht die Abkürzung GoP?",
      solution: "Group of Pictures — Bildgruppe bei MPEG.",
      explain: "Eine GoP ist eine Folge aus I-, P- und B-Bildern. Die Länge (z.B. Short/Long GoP) beeinflusst Schnittfähigkeit vs. Kompressionsrate." },
    { id: "vt2-1e", type: "short", prompt: "Ein digitales Komponentensignal mit Abtaststruktur 4:4:4 kann alternativ auch als ein anderes Signal übertragen werden. Wie ist der Name dieses Signals?",
      solution: "RGB (bzw. die Komponente lässt sich als RGB-Signal übertragen).",
      explain: "4:4:4 beschreibt volle Auflösung aller drei Kanäle. Üblich als YCbCr 4:4:4 oder als reines RGB." },
    { id: "vt2-1f", type: "short", prompt: "Was bedeutet SDI?",
      solution: "Serial Digital Interface — serielle digitale Schnittstelle für Video.",
      explain: "SDI (z.B. HD-SDI, 3G-SDI) überträgt unkomprimiertes Video seriell über Koaxkabel, im Broadcast-Studio Standard." },
    { id: "vt2-1g", type: "short", prompt: "Thema Datenreduktion: Nennen Sie 3 Verfahren, die die Qualität des Videosignals nicht mindern (verlustfrei).",
      solution: "z.B. Huffman-Codierung, Laufängenkodierung (RLE), verlustfreie DPCM, ZIP-artige Verfahren.",
      answers: ["Huffman", "Huffman-Codierung", "Laufängenkodierung", "RLE", "DPCM", "verlustfreie DPCM", "ZIP", "Entropiecodierung", "arithmetische Codierung"], required: 3,
      explain: "Verlustfrei = aus komprimierten Daten lässt sich das Original exakt rekonstruieren. Entropiecodierung (Huffman, arithmisch) gehört dazu." },
    { id: "vt2-1h", type: "short", prompt: "Nennen Sie zwei digitale Videoschnittstellen, die als Kabelverbindungen verwendet werden.",
      solution: "z.B. SDI (Koax), HDMI, DisplayPort, USB-Video, (optisch: Glasfaser/SDI-over-Fiber).",
      answers: ["SDI", "HDMI", "DisplayPort", "USB", "USB-Video", "Glasfaser", "Fiber", "SDI-over-Fiber"], required: 2,
      explain: "Kabelgebunden: SDI = Broadcast, HDMI/DisplayPort = Consumer/Prosumer." },
    { id: "vt2-1i", type: "wf", prompt: "Ist die DCT (diskrete Kosinustransformation) reversibel?",
      solution: "Ja (mathematisch reversibel; praktisch verlustbehaftet wegen Quantisierung nachfolgend).",
      correct: true },
    { id: "vt2-1j", type: "short", prompt: "Welche Bausteine/Teilbausteine der Datenreduktion möchte man in der Produktionsumgebung nicht benutzen?",
      solution: "Starke verlustbehaftete Verfahren: Quantisierung mit hohem Verlust, Long-GoP, Intra-Frame-Reduktion die Schnitt erschwert; generell alles, was Qualität dauerhaft entfernt (Generationenverlust).",
      explain: "In der Produktion arbeitet man verlustfrei oder mit milden Intra-Codecs (z.B. ProRes, DNxHD), um Mehrfachbearbeitung ohne Qualitätsverlust zu erlauben." },
    { id: "vt2-1k", type: "short", prompt: "Was ist der wesentliche Unterschied zwischen CCD und CMOS?",
      solution: "CCD: Ladungstransfer über einen Ausleseverstärker (besseres Rauschverhalten, mehr Strom). CMOS: jede Zelle eigenen Verstärker (integriert, weniger Strom, günstiger, mehr Integration).",
      explain: "Historisch: CCD = höhere Bildqualität, CMOS = billiger/stromsparender. Heute hat CMOS (dank BSI etc.) bei Kameras überholt." },
    { id: "vt2-1l", type: "short", prompt: "Was für ein Bildartefakt kann beim CMOS auftreten?",
      solution: "Rolling Shutter (Verzerrung bei schneller Bewegung / bei CMOS mit zeilenweisem Auslesen).",
      explain: "Global Shutter (teurere CMOS) vermeidet das. Bei CCD typisch eher Smear/Blooming." },
    { id: "vt2-1m", type: "short", prompt: "Nennen Sie 2 aktive Displaytypen.",
      solution: "LCD (mit Hintergrundbeleuchtung) und OLED (selbstleuchtend) — oder Plasma.",
      answers: ["LCD", "OLED", "Plasma"], required: 2,
      explain: "Aktiv = eigene Lichtquelle/-steuerung pro Pixel oder Ebene. Passiv wäre z.B. E-Ink oder projiziertes Licht." },
    { id: "vt2-1n", type: "short", prompt: "Nennen Sie 3 optische Speichermedien.",
      solution: "CD, DVD, Blu-ray (optional: HD-DVD, Laserdisc).",
      answers: ["CD", "DVD", "Blu-ray", "Bluray", "HD-DVD", "Laserdisc"], required: 3,
      explain: "Optisch = Daten durch Laser gelesen. Im Video-Bereuch relevant für Verleih/Archiv." },
    { id: "vt2-1o", type: "short", prompt: "Was sind Kriterien für Speicher im Videobereich?",
      solution: "Kapazität, Datenrate (Schreib/Lese), Zugriffszeit, Haltbarkeit, Kosten, RAID-Fähigkeit, Portabilität.",
      explain: "Besonders wichtig: konstante Schreibrate (kein Drop), sonst Frame-Verlust bei Aufzeichnung." },
    { id: "vt2-1p", type: "short", prompt: "Wie heißt die zentrale Stufe im Bildmischer?",
      solution: "Der MISC-H (Mischkreis / Mischer-Matrix) bzw. der Kreuzschienen-Ausgang; zentral: die Mischstufe (Mix-Effect, ME).",
      explain: "Bildmischer (Vision Mixer) mischen mehrere Quellen; zentrale Stufe = Mix-Effects-Bank mit Überblendungen." },
    { id: "vt2-1q", type: "short", prompt: "Über welche Messgeräte lässt sich prüfen, ob der Weißabgleich korrekt ist?",
      solution: "Wellenformmonitor / Vektorskop (Vectorscope zeigt Farbsättigung, Waveform Helligkeit).",
      explain: "Das Vektorskop zeigt, ob Farben im Neutralbereich (achsenfern bei 100% weiß) sitzen — Indikator für korrekten Weissabgleich." },
    { id: "vt2-1r", type: "short", prompt: "Welche Fehlerschutzverfahren werden bei DVB angewendet?",
      solution: "Reed-Solomon-Fehlerkorrektur (外层), Faltungscode / Convolutional Coding (innere Codierung), Interleaving, RS(204,188) Blockcode.",
      explain: "DVB nutzt ein Codierungsschema: äußere RS-Codierung + Convolutional Inner + Interleaving, um Übertragungsfehler zu korrigieren." },

    /* ---- 2. Wahr oder Falsch ---- */
    { id: "vt2-2-1", type: "wf", prompt: "Die Farbe wird vom Auge besser aufgelöst, die Datenreduktion greift an der Helligkeit.",
      solution: "Falsch — umgekehrt: Helligkeit (Luma) wird besser aufgelöst, Farbe (Chroma) reduziert (Subsampling).",
      correct: false },
    { id: "vt2-2-2", type: "wf", prompt: "2 Polfilter, die parallel zueinander stehen, lassen kein Licht durch.",
      solution: "Falsch — parallel = gleiche Achse, lassen (wenn unpolarisiert) noch 50% durch; gekreuzt (90°) blockieren.",
      correct: false },
    { id: "vt2-2-3", type: "wf", prompt: "Auf der Video-DVD kann auch HD gespeichert werden. Der Standard wurde dahingehend erweitert.",
      solution: "Falsch — DVD ist SD (max. 720×576). HD erst mit Blu-ray/HD-DVD.",
      correct: false },
    { id: "vt2-2-4", type: "wf", prompt: "Mit MPEG2 kann auch HD-Material nach dem Standard codiert werden.",
      solution: "Wahr — MPEG-2 kann HD (wurde für HD-DVD/Broadcast HD genutzt), ist aber ineffizient.",
      correct: true },
    { id: "vt2-2-5", type: "wf", prompt: "Magnetische Festplatten werden im Videobereich nicht mehr verwendet.",
      solution: "Falsch — HDDs werden noch vielfach genutzt (Archive, große Capazität), neben SSD.",
      correct: false },
    { id: "vt2-2-6", type: "wf", prompt: "Lese- und Schreibgeschwindigkeiten sind bei Festwertspeichern (SSD) immer identisch.",
      solution: "Falsch — Schreiben ist oft langsamer als Lesen; variiert nach Controller/TLC etc.",
      correct: false },
    { id: "vt2-2-7", type: "wf", prompt: "Die DWT (Diskrete Wavelet-Transformation) wird wegen starker Blockartefakten nur im Consumerbereich verwendet.",
      solution: "Falsch — DWT erzeugt gerade KEINE Blockartefakte (im Gegensatz zur DCT). Genutzt bei JPEG2000, professionell.",
      correct: false },
    { id: "vt2-2-8", type: "wf", prompt: "Bei der Datenreduktion sollte immer eine Relevanzreduktion für bessere Qualität stattfinden.",
      solution: "Wahr — Relevanzreduktion entfernt für das Auge irrelevantes (psychovisuelle Reduktion), verbessert subjektive Qualität bei gleicher Rate.",
      correct: true },
    { id: "vt2-2-9", type: "wf", prompt: "Intermediate Codecs nutzen eine Long-GoP-Folge.",
      solution: "Falsch — Intermediate-Codecs (ProRes, DNxHD) sind Intra-GoP (jeder Frame eigenständig), nicht Long-GoP. Long-GoP = Delivery-Codecs (H.264).",
      correct: false },
    { id: "vt2-2-10", type: "wf", prompt: "H.264/AVC nutzt einen Deblocking-Filter.",
      solution: "Wahr — im Loop-Filter (deblocking) glättet Blockgrenzen.",
      correct: true },
    { id: "vt2-2-11", type: "wf", prompt: "DVB-C ist weniger fehleranfällig als DVB-S und DVB-T.",
      solution: "Wahr — Kabel (C) ist störungsärmer als Satellit (S, Rauschen) und terrestrisch (T, Mehrwegempfang).",
      correct: true },
    { id: "vt2-2-12", type: "wf", prompt: "Bei der Studiokamera bestimmt der Operator nur den Bildausschnitt.",
      solution: "Falsch — Operator steuert auch Focus, Iris/Blende, Zoom, ggf. Farbe/Weißabgleich (Kamera-Einstellungen).",
      correct: false },
    { id: "vt2-2-13", type: "wf", prompt: "Mit einer Kreuzschiene können mehrere Eingänge auf einen Ausgang geschaltet werden.",
      solution: "Wahr — Kreuzschiene (Router) schaltet beliebige Inputs auf Outputs.",
      correct: true },
    { id: "vt2-2-14", type: "wf", prompt: "RAID 1 ist eine gute Wahl mit Hinblick auf die Datensicherheit.",
      solution: "Wahr — RAID 1 = Spiegelung, Ausfalltoleranz bei Plattenausfall.",
      correct: true },
    { id: "vt2-2-15", type: "wf", prompt: "Ein DLP-Projektor nutzt den DMD-Chip.",
      solution: "Wahr — DLP = Digital Light Processing, DMD = Digital Micromirror Device.",
      correct: true },

    /* ---- 3. Rechenaufgaben ---- */
    { id: "vt2-3a", type: "numeric",
      prompt: "Berechnen Sie die Datenrate für ein unkomprimiertes 4:2:2 SD-Signal mit 10 Bit, wie im SDI-Standard. Rechnung angeben!",
      unit: "Mbit/s",
      placeholder: "z. B. 270",
      values: { w: { v: 720, variants: [720, 640] }, h: { v: 576, variants: [576, 480] }, fps: { v: 25, variants: [25, 30] }, b: { v: 10, variants: [8, 10] } },
      compute(v) { return (v.w * v.h * 2 * v.b * v.fps) / 1e6; }, // 4:2:2 = 2x luma samples
      extra(v) { return { samp: v.w * v.h * 2, bits: v.w * v.h * 2 * v.b, rate: v.w * v.h * 2 * v.b * v.fps }; },
      explain:
        "4:2:2 = Y voll + Cb/Cr je halbiert → je 2 Samples pro Pixel (Y + ½Cb + ½Cr).\n" +
        "Samples/Bild: {{w}}·{{h}}·2 = {{samp}}\n" +
        "Bit/Bild: {{samp}}·{{b}} = {{bits}} bit\n" +
        "Bei {{fps}} fps: {{bits}}·{{fps}} = {{rate}} bit/s → {{ans}} Mbit/s.\n" +
        "(SD-SDI-Standard liegt klassisch bei 270 Mbit/s für 720×576/25/10bit — passt.)" },
    { id: "vt2-3b", type: "numeric",
      prompt: "Berechnen Sie den Cropfaktor für einen 2/3″-Sensor. Diagonale = 11 mm. Vollformatsensor = 36 mm × 24 mm. Welche Brennweite erzeugt den gleichen diagonalen Sichtwinkel wie 50 mm am Vollformat? Wie wäre der Winkel? (Sichtwinkeldiagonal = 2·arctan(Sensordiagonale/2 · 1/Brennweite))",
      unit: "mm",
      placeholder: "Cropfaktor, z. B. 3.3",
      values: { diag: { v: 11, variants: [11, 8.8] }, vfdiag: { v: 43.3, variants: [43.3] }, bw: { v: 50, variants: [50, 35] } },
      compute(v) { return v.vfdiag / v.diag; },
      extra(v) { return { bwEquiv: v.bw * (v.vfdiag / v.diag) }; },
      explain:
        "Cropfaktor = Diagonale Vollformat / Diagonale Sensor = {{vfdiag}} / {{diag}} = {{ans}}.\n" +
        "Äquivalente Brennweite am 2/3″ für {{bw}} mm Vollformat: {{bw}} · {{ans}} = {{bwEquiv}} mm.\n" +
        "Sichtwinkel (Diagonal): 2·arctan(d/2f). Größerer Crop → kleinerer Winkel bei gleicher Brennweite." },
    { id: "vt2-3c", type: "numeric",
      prompt: "Projektor: Abstand Leinwand = 4 m, Höhe Leinwand = 1,5 m, 16:9. Berechnen Sie das Projektionsverhältnis (Throw Ratio) und wählen Sie einen passenden Projektor für Indoor-Tageslicht, wirtschaftlich.",
      unit: "",
      placeholder: "Throw Ratio, z. B. 2.0",
      values: { dist: { v: 4, variants: [4, 5, 3] }, h: { v: 1.5, variants: [1.5, 2, 1.2] } },
      compute(v) {
        const h_px = 9, w_px = 16;
        const width = (v.h * w_px) / h_px;
        return v.dist / width; // throw ratio = dist / image-width
      },
      extra(v) { return { width: (v.h * 16) / 9 }; },
      explain:
        "Bildbreite bei 16:9 und Höhe {{h}} m: {{width}} m.\n" +
        "Throw Ratio = Abstand / Bildbreite = {{dist}} / {{width}} = {{ans}}.\n" +
        "Für Tageslicht-Indoor braucht man hohe Lumen (Laser 5000+). Aus den Optionen: d) 1,4–2,0:1 Laser DLP 5000 lm passt (wirtschaftlich, hell genug)." },
    { id: "vt2-3c-choice", type: "choice",
      prompt: "Welcher Projektor (aus den vorgegebenen) ist für Indoor-Tageslichtanwendung geeignet und wirtschaftlich? (Throw Ratio aus voriger Aufgabe ~2,0:1)",
      choices: [
        "a) 1,5–1,66:1 Halogen LCD mit 2000 ANSI-Lumen",
        "b) 1,0–1,8:1 Laser mit 20000 ANSI-Lumen",
        "c) 1,7–2,2 DLP mit 4500 ANSI-Lumen",
        "d) 1,4–2,0:1 Laser DLP mit 5000 ANSI-Lumen"
      ],
      correct: 3,
      explain:
        "Throw Ratio ~2,0 passt zu d) (1,4–2,0:1). Laser + 5000 lm ist hell genug für Tageslicht, aber wirtschaftlicher als 20000 lm (b). Daher d)." },
    { id: "vt2-3d", type: "numeric",
      prompt: "Multikamera: 4 Kameras in ProRes 4:2:2 HQ mit 185 Mbit/s + Programm + Cleanfeed als unkomprimiertes HD-SDI@4:2:2, 25 fps, 10 Bit, Bruttoauflösung 2640×1125. Sendung dauert 70 min. Wie hoch ist der Speicherbedarf (in GB)?",
      unit: "GB",
      placeholder: "z. B. 75",
      values: { dur: { v: 70, variants: [70, 60, 90] } },
      compute(v) {
        const sdiMbps = (2640 * 1125 * 2 * 10 * 25) / 1e6; // 4:2:2 → 2x
        const programMbps = sdiMbps; const cleanfeedMbps = sdiMbps;
        const totalMbps = 4 * 185 + programMbps + cleanfeedMbps;
        return (totalMbps * v.dur * 60) / 8 / 1e9; // MB→GB
      },
      extra(v) { const sdi = (2640 * 1125 * 2 * 10 * 25) / 1e6; return { sdi: sdi.toFixed(1), totalMbps: (4 * 185 + 2 * sdi).toFixed(1) }; },
      explain:
        "HD-SDI 4:2:2 10bit 25fps 2640×1125: {{sdi}} Mbit/s.\n" +
        "Summe: 4×185 + Programm + Cleanfeed = 740 + 2·{{sdi}} = {{totalMbps}} Mbit/s.\n" +
        "70 min: {{totalMbps}}·70·60/8 MB = {{ans}} GB.\n" +
        "(Rundungsabhängig ~70–80 GB.)" },
    { id: "vt2-3e", type: "numeric",
      prompt: "DVB: Nutzdatenrate auf dem Kanal. Bandbreiteneffizienz = 6 Bit/s/Hz, Roll-Off r = 0,1, Blockcode 188/204. Kanalbandbreite = 8 MHz. Für welchen DVB-Kanal könnte das gelten?",
      unit: "Mbit/s",
      placeholder: "z. B. 41",
      values: { eff: { v: 6, variants: [6, 4, 8] }, rolloff: { v: 0.1, variants: [0.1, 0.15, 0.2] }, bw: { v: 8, variants: [8, 6, 7] } },
      compute(v) {
        const symRate = v.bw / (1 + v.rolloff); // MHz
        const gross = symRate * v.eff; // Mbit/s (mit Effizienz)
        return (gross * 188 / 204) / 1; // netto
      },
      extra(v) { const sym = v.bw / (1 + v.rolloff); const gross = sym * v.eff; return { sym: sym.toFixed(3), gross: gross.toFixed(2) }; },
      explain:
        "Symbolrate = B/(1+r) = {{bw}}/(1+{{rolloff}}) = {{sym}} MHz.\n" +
        "Brutto = Symrate·Effizienz = {{sym}}·{{eff}} = {{gross}} Mbit/s.\n" +
        "Netto (188/204): {{gross}}·188/204 = {{ans}} Mbit/s.\n" +
        "Das entspricht grob DVB-C (8 MHz Kanal, 64-QAM ≈ 6 Bit/s/Hz). Modulation: 64-QAM." },

    /* ---- 4. Sonstige ---- */
    { id: "vt2-4a", type: "huffman",
      prompt: "Huffman-Code für Verteilung: A 50%, B 15%, C 15%, D 15%, E 5%. Erstellen Sie den Code und zeigen Sie, dass weniger Daten nötig sind als direkt (fix 3 bit/Wort).",
      solution: "Baum: E(5)+D(15)=20; C(15)+B(15)=30; 20+30=50; 50+A(50)=100. Code z.B. A=0, B=10, C=110, D=1110, E=1111. Mittlere Länge = 0.5·1+0.15·2+0.15·3+0.15·4+0.05·4 = 2.15 bit < 3 bit.",
      explain:
        "Huffman: seltene Symbole länger, häufige kürzer. Mittlere Länge ≈ 2,15 bit/Wort vs. 3 bit fix → ~28% Ersparnis. Eignet sich gut für verlustfreie Reduktion (Entropiecodierung)." },
    { id: "vt2-4b", type: "short",
      prompt: "Was sind die grundlegenden Aufgaben eines klassischen Bildmischers? Wie verhindert man Artefakte (halbe Bilder / nur Teile von Bildern im Programm-Output)? Wie könnte man 3 Eingänge mischen (Skizze)?",
      solution: "Aufgaben: Umschalten, Überblenden (Mix), Wipe/Key, Effekte. Artefekte vermeiden: gleiche Synchronisation/Genlock aller Quellen, gleiches Format (kein Timing-Offset). 3 Eingänge mischen: z.B. A+B via Mix-Effekt, dann Key (z.B. C als Insert/Luminanz-Key) — oder Kreuzschiene vor dem Mixer.",
      explain:
        "Genlock (Referenztakt) ist essenziell, damit Quellen phasengleich sind. Mischer nutzen ME-Banks: Layer (Background + Key) ermöglichen 3+ Quellen gleichzeitig." }
  ]
};
