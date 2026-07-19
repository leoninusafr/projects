// Questions Database for Physics 2 (Physikalische Akustik HAW Hamburg)
// Contains the 25 Core Exam Questions (WS25) and selected Lecture Quiz Questions.

export const EXAM_QUESTIONS = [
  {
    id: 'klausur_01',
    title: '1. Fundamentale Wechselwirkungen',
    category: 'Grundlagen',
    question: 'Geben Sie die vier grundlegenden Wechselwirkungen (Stand 2026) der Physik an.',
    type: 'multiple-choice-multi',
    options: [
      'Gravitation',
      'Elektromagnetische Wechselwirkung',
      'Starke Wechselwirkung',
      'Schwache Wechselwirkung',
      'Reibungskraft',
      'Zentrifugalkraft'
    ],
    correct: [0, 1, 2, 3],
    formulaId: 'constants',
    solution: {
      intuition: 'Die gesamte Physik basiert auf nur vier fundamentalen Kräften, die beschreiben, wie Teilchen im Universum interagieren.',
      redThread: 'Markiere die vier Elementarkräfte. Makroskopische Kräfte wie Reibungs- oder Federkräfte sind letztlich elektromagnetischen Ursprungs.',
      calculation: 'Die vier Wechselwirkungen sind:<br>1. **Gravitation** (Massenanziehung, unendliche Reichweite)<br>2. **Elektromagnetische Kraft** (Ladungswechselwirkung, unendliche Reichweite)<br>3. **Starke Kernkraft** (Hält Atomkerne zusammen, sehr kurze Reichweite)<br>4. **Schwache Kernkraft** (Verantwortlich für radioaktiven Zerfall, sehr kurze Reichweite)'
    }
  },
  {
    id: 'klausur_02',
    title: '2. Physikalische SI-Einheiten',
    category: 'Grundlagen',
    question: 'Trage für die folgenden physikalischen Größen die korrekte SI-Einheit (oder das Einheitszeichen) ein.',
    type: 'multi-field',
    fields: [
      { id: 'u_feder', label: 'Federkonstante ($D$):', placeholder: 'z.B. kg', correct: 'N/m' },
      { id: 'u_energie', label: 'Energie ($E$):', placeholder: 'z.B. s', correct: 'J' },
      { id: 'u_dichte', label: 'Massendichte ($\\rho$):', placeholder: 'z.B. m', correct: 'kg/m³' },
      { id: 'u_druck', label: 'Schalldruck ($p$):', placeholder: 'z.B. kg', correct: 'Pa' },
      { id: 'u_frequenz', label: 'Frequenz ($f$):', placeholder: 'z.B. s', correct: 'Hz' },
      { id: 'u_schnelle', label: 'Schallschnelle ($v$):', placeholder: 'z.B. m', correct: 'm/s' },
      { id: 'u_widerstand', label: 'Elektrischer Widerstand ($R$):', placeholder: 'z.B. kg', correct: 'Ω' }
    ],
    formulaId: 'constants',
    solution: {
      intuition: 'SI-Einheiten sind die standardisierten Einheiten des internationalen Einheitensystems, auf die jede abgeleitete Einheit zurückgeführt wird.',
      redThread: 'Nutze die Standardzeichen (z. B. J für Joule, Pa für Pascal, Ω oder Ohm für den Widerstand).',
      calculation: '- **Federkonstante:** Kraft pro Auslenkung $\\rightarrow \\text{Newton pro Meter } [\\text{N/m}]$\<br>- **Energie:** Kraft mal Weg $\\rightarrow \\text{Joule } [\\text{J}]$\<br>- **Massendichte:** Masse pro Volumen $\\rightarrow [\\text{kg/m}^3]$\<br>- **Schalldruck:** Kraft pro Fläche $\\rightarrow \\text{Pascal } [\\text{Pa}]$\<br>- **Frequenz:** Schwingungen pro Sekunde $\\rightarrow \\text{Hertz } [\\text{Hz}]$\<br>- **Schallschnelle:** Teilchengeschwindigkeit $\\rightarrow [\\text{m/s}]$\<br>- **Widerstand:** Spannung pro Stromstärke $\\rightarrow \\text{Ohm } [\\Omega]$'
    }
  },
  {
    id: 'klausur_03',
    title: '3. Bewegungsgleichung des Federpendels',
    category: 'Schwingungen',
    question: 'Ein ungedämpftes Federpendel auf der Erdoberfläche hat die Kugelmasse $m$, die Federkonstante $D$ und die Fallbeschleunigung $g$.<br>a) Wie lautet die Bewegungsgleichung (DGL)?<br>b) Wie heißt diese Gleichung?<br>c) Mit welcher Frequenz $f_0$ schwingt die Kugel?',
    type: 'multi-field',
    fields: [
      { id: 'dgl_eq', label: "Bewegungsgleichung (Formel):", placeholder: "z.B. y'' = -k*y", correct: "m*x'' = -D*x" },
      { id: 'dgl_name', label: 'Name der Gleichung:', placeholder: 'z.B. Differentialgleichung des...', correct: 'Differentialgleichung des harmonischen Oszillators' },
      { id: 'dgl_freq', label: 'Frequenz f0 (Formel):', placeholder: 'z.B. 1 / T', correct: '1/(2*pi)*sqrt(D/m)' }
    ],
    formulaId: 'spring_pendulum',
    solution: {
      intuition: 'Auf die Masse wirken nur Gewichtskraft (wird durch Ruhelage kompensiert) und die auslenkungsabhängige Federkraft. Ohne Reibung oszilliert das System ewig.',
      redThread: "1. Trägheitskraft $m\\ddot{x}$ ist gleich der rückstellenden Kraft $-Dx$.\<br>2. Die Differentialgleichung (DGL) lautet $m\\ddot{x} + Dx = 0$ bzw. $m x'' = -D x$.\<br>3. Die Eigenkreisfrequenz ist $\\omega_0 = \\sqrt{D/m}$, die Frequenz $f_0 = \\frac{\\omega_0}{2\\pi} = \\frac{1}{2\\pi}\\sqrt{\\frac{D}{m}}$.",
      calculation: 'Kräftegleichgewicht:\<br>$$F_{Trägheit} = F_{Feder} \\implies m \\cdot \\ddot{x}(t) = -D \\cdot x(t)$$\<br>Dies ist eine lineare homogene Differentialgleichung 2. Ordnung mit konstanten Koeffizienten, genannt **Differentialgleichung des harmonischen Oszillators**.\<br>\<br>Der Ansatz $x(t) = A \\sin(\\omega_0 t + \\phi)$ eingesetzt ergibt:\<br>$$-m \\omega_0^2 A \\sin(...) = -D A \\sin(...) \\implies \\omega_0^2 = \\frac{D}{m} \\implies f_0 = \\frac{1}{2\\pi}\\sqrt{\\frac{D}{m}}$$'
    }
  },
  {
    id: 'klausur_04',
    title: '4. Sätze korrigieren (Physikalische Mythen)',
    category: 'Grundlagen',
    question: 'Welche der folgenden Aussagen ist physikalisch KORREKT (bzw. wie müssen die falschen Sätze korrigiert werden)?',
    type: 'multiple-choice',
    options: [
      'Das 2. Newtonsche Gesetz besagt: Kraft = Masse * Geschwindigkeit.',
      'Der tägliche Energiebedarf eines Babys liegt bei 2,5 Millionen Joule pro Tag (2,5 MJ).',
      'Der Druck im Sonneninneren liegt bei 2 * 10^16 Pa/m³.',
      'Der Tagesverbrauch der Beleuchtung eines Hörsaals liegt bei 2 Kilowatt (kW).',
      'Ein lautes Moped erzeugt 95 dB Schalldruckpegel, was einer Leistung von 3,16 mW entspricht.'
    ],
    correct: 1,
    formulaId: 'constants',
    solution: {
      intuition: 'In der Physik ist die präzise Unterscheidung von Größen (Leistung vs. Energie, Druck vs. Druckgradient, Geschwindigkeit vs. Beschleunigung) elementar.',
      redThread: 'Suche die korrekte Aussage. Korrigiere im Geiste die Einheiten der Fehlerhaften.',
      calculation: '- Falsch: Kraft = Masse * **Beschleunigung** ($F = m \\cdot a$, nicht Geschwindigkeit).\<br>- **Richtig**: Der tägliche Energiebedarf liegt bei **2,5 MJ/Tag** ($2{,}5 \\cdot 10^6$ J).\<br>- Falsch: Druck wird in **Pascal (Pa)** angegeben, nicht Pa/m³ (das wäre ein Druckgradient).\<br>- Falsch: Verbrauch (Energie) wird in **kWh** gemessen, kW ist die momentane Leistung.\<br>- Falsch: Der Pegel von 95 dB entspricht einer Schall**intensität** von $3{,}16 \\text{ mW/m}^2$, nicht einer Leistung in mW.'
    }
  },
  {
    id: 'klausur_05',
    title: '5. Erzwungene Schwingung & Resonanz',
    category: 'Schwingungen',
    question: 'Was kennzeichnet eine Resonanzschwingung im Kern?',
    type: 'multiple-choice',
    options: [
      'Das System kommt aufgrund extrem starker Reibung sofort zum Stillstand.',
      'Die Schwingung erreicht bei Anregung nahe der Eigenfrequenz maximale Amplituden, da Energie optimal übertragen wird.',
      'Die Eigenfrequenz des Oszillators verdoppelt sich automatisch.',
      'Die Oszillation findet ausschließlich im Vakuum statt.'
    ],
    correct: 1,
    formulaId: 'resonance',
    solution: {
      intuition: 'Wenn ein periodischer Impuls genau im Rhythmus der Eigenfrequenz des Systems anstupst, schaukelt sich die Schwingung extrem auf.',
      redThread: 'Resonanz tritt auf, wenn die Anregerfrequenz $f_{Anreger}$ nahe der Eigenfrequenz $f_0$ liegt.',
      calculation: 'Die Amplitude einer erzwungenen Schwingung ist gegeben durch:\<br>$$A(\\omega) = \\frac{F_0/m}{\\sqrt{(\\omega_0^2 - \\omega^2)^2 + 4\\delta^2\\omega^2}}$$\<br>Für $\\omega \\to \\omega_R = \\sqrt{\\omega_0^2 - 2\\delta^2}$ wird der Nenner minimal, was zu einem **Maximum der Amplitude** (Resonanz) führt. Musikinstrumente nutzen Resonanzkörper (z.B. Gitarrenkorpus) zur Schallverstärkung. Ein Helmholtz-Resonator nutzt Luftresonanz zur Absorption oder Verstärkung.'
    }
  },
  {
    id: 'klausur_06',
    title: '6. Aperiodischer Grenzfall',
    category: 'Schwingungen',
    question: 'Was versteht man unter dem aperiodischen Grenzfall einer gedämpften Schwingung?',
    type: 'multiple-choice',
    options: [
      'Das System oszilliert mit unendlich hoher Frequenz.',
      'Das System kehrt ohne Überschwingen in kürzester Zeit in die Gleichgewichtslage zurück.',
      'Die Dämpfung ist exakt Null.',
      'Die Federkonstante wird unendlich groß.'
    ],
    correct: 1,
    formulaId: 'damping',
    solution: {
      intuition: 'Stell dir eine Tür vor, die zufällt: Ist sie unterdämpft, pendelt sie hin und her. Ist sie überdämpft, schließt sie extrem langsam. Im aperiodischen Grenzfall schließt sie optimal schnell, ohne zu pendeln.',
      redThread: 'Dies tritt ein, wenn der Dämpfungskoeffizient $\\delta$ exakt gleich der Eigenkreisfrequenz $\\omega_0$ ist.',
      calculation: 'Schwingungsgleichung: $\\ddot{x} + 2\\delta\\dot{x} + \\omega_0^2 x = 0$\<br>Die charakteristische Gleichung $\\lambda^2 + 2\\delta\\lambda + \\omega_0^2 = 0$ hat die Lösungen $\\lambda_{1,2} = -\\delta \\pm \\sqrt{\\delta^2 - \\omega_0^2}$.\<br>Für **$\\delta = \\omega_0$** ist die Diskriminante Null. Es ergibt sich eine doppelte reelle Nullstelle $\\lambda = -\\delta$.\<br>Die allgemeine Lösung lautet:\<br>$$x(t) = (C_1 + C_2 t) e^{-\\delta t}$$\<br>Dies beschreibt das schnellstmögliche Klingen ohne Vorzeichenwechsel (Überschwingen).'
    }
  },
  {
    id: 'klausur_07',
    title: '7. 3dB-Abfallgrenze beim Tiefpass',
    category: 'Wellen',
    question: 'Ein Hersteller spezifiziert für einen Tiefpassfilter eine „3dB-Abfallfrequenz bei 10 kHz“. Was bedeutet das physikalisch?',
    type: 'multiple-choice',
    options: [
      'Frequenzen über 10 kHz werden vollständig gesperrt.',
      'Bei einer Frequenz von 10 kHz beträgt die abgegebene Leistung genau 50% der eingespeisten Leistung.',
      'Bei 10 kHz beträgt die Ausgangsspannung genau 50% der Eingangsspannung.',
      'Wenn am Eingang 100 V anliegen, liegen bei 10 kHz am Ausgang 50 V an.'
    ],
    correct: 1,
    formulaId: 'sound_levels',
    solution: {
      intuition: 'Der Dezibel-Pegel ist logarithmisch. $-3$ dB entspricht einer Leistungshalbierung.',
      redThread: 'Verknüpfe den Pegelverlust von $-3$ dB mit dem Leistungsverhältnis: $\\Delta L_P = 10 \\cdot \\log_{10}(P_{out}/P_{in})$.',
      calculation: 'Berechnung des Leistungsverhältnisses für $\\Delta L = -3 \\text{ dB}$:\<br>$$-3 = 10 \\log_{10}\\left(\\frac{P_{out}}{P_{in}}\\right) \\implies -0{,}3 = \\log_{10}\\left(\\frac{P_{out}}{P_{in}}\\right) \\implies \\frac{P_{out}}{P_{in}} = 10^{-0{,}3} \\approx 0{,}50$$ (d.h. 50% Leistung).\<br>Für die Spannung gilt:\<br>$$\\frac{U_{out}}{U_{in}} = \\sqrt{\\frac{P_{out}}{P_{in}}} = \\sqrt{0{,}5} \\approx 0{,}707$$ (d.h. ca. 70,7% der Eingangsspannung, nicht 50%).'
    }
  },
  {
    id: 'klausur_08',
    title: '8. Effektivwert & mittlere Leistung',
    category: 'Grundlagen',
    question: 'Eine periodische, stückweise lineare Spannung $u(t)$ mit Periode $T = 6\\text{ s}$ liegt an einem Widerstand $R = 1\\text{ k}\\Omega$ an. Die Kurve ist wie folgt definiert:<br>• $0 \\le t < 1$: $u(t) = t$<br>• $1 \\le t < 2$: $u(t) = 1$<br>• $2 \\le t < 4$: $u(t) = 3-t$<br>• $4 \\le t < 5$: $u(t) = -1$<br>• $5 \\le t < 6$: $u(t) = t-6$<br><br>Berechne die mittlere Leistung $P$, die am Widerstand abfällt.',
    type: 'multi-field',
    fields: [
      { id: 'rms_integral', label: 'Wert des Integrals $\\int_0^T u^2(t) dt$ ($V^2 s$):', placeholder: 'z.B. 1.25 oder 5/4', correct: '10/3' },
      { id: 'rms_power', label: 'Mittlere Leistung P (in mW):', placeholder: 'z.B. 4.2', correct: '0.56' }
    ],
    formulaId: 'rms_value',
    solution: {
      intuition: 'Der Effektivwert entspricht dem quadratischen Mittelwert der Spannung über eine Periode. Die mittlere Leistung ergibt sich aus $U_{eff}^2 / R$.',
      redThread: '1. Integriere $u(t)^2$ abschnittsweise über alle 5 Intervalle.\<br>2. Addiere die Integrale zu $\\int_0^6 u(t)^2 dt = \\frac{10}{3} \\text{ V}^2\\text{s}$.\<br>3. Berechne $P = \\frac{1}{T \\cdot R} \\int_0^T u(t)^2 dt$.',
      calculation: 'Abschnittsweise Integration von $u(t)^2$:\<br>1) $\\int_0^1 t^2 dt = \\left[ \\frac{1}{3}t^3 \\right]_0^1 = \\frac{1}{3}$\<br>2) $\\int_1^2 1^2 dt = [t]_1^2 = 1$\<br>3) $\\int_2^4 (3-t)^2 dt$. Substituiere $z = 3-t \\implies dz = -dt$. Grenzen: $t=2 \\to z=1$, $t=4 \\to z=-1$. $\\int_{1}^{-1} -z^2 dz = \\int_{-1}^1 z^2 dz = \\left[ \\frac{1}{3}z^3 \\right]_{-1}^1 = \\frac{2}{3}$.\<br>4) $\\int_4^5 (-1)^2 dt = [t]_4^5 = 1$\<br>5) $\\int_5^6 (t-6)^2 dt = \\left[ \\frac{1}{3}(t-6)^3 \\right]_5^6 = 0 - (-\\frac{1}{3}) = \\frac{1}{3}$.\<br>Summe aller Integrale: $\\frac{1}{3} + 1 + \\frac{2}{3} + 1 + \\frac{1}{3} = \\frac{10}{3} \\approx 3{,}33 \\text{ V}^2\\text{s}$.\<br>\<br>Leistung am Widerstand $R = 1000 \,\\Omega$ über $T = 6\\text{ s}$:\<br>$$P = \\frac{U_{eff}^2}{R} = \\frac{1}{T \\cdot R} \\int_0^T u(t)^2 dt = \\frac{1}{6 \\cdot 1000} \\cdot \\frac{10}{3} = \\frac{10}{18000} \\text{ W} \\approx 0{,}556 \\text{ mW} \\approx 0{,}56 \\text{ mW}$$'
    }
  },
  {
    id: 'klausur_09',
    title: '9. Systematik der Schallarten',
    category: 'Wellen',
    question: 'Welche drei physikalischen Schallarten werden primär nach dem Ausbreitungsmedium unterschieden?',
    type: 'multiple-choice-multi',
    options: [
      'Luftschall',
      'Körperschall',
      'Flüssigkeitsschall',
      'Vakuumschall',
      'Infraschall'
    ],
    correct: [0, 1, 2],
    formulaId: 'constants',
    solution: {
      intuition: 'Schall benötigt stets ein elastisches Medium zur Ausbreitung. Je nach Aggregatzustand des Mediums verhalten sich die Wellen anders.',
      redThread: 'Wähle die drei Schallarten, die sich direkt auf Gase, Festkörper und Flüssigkeiten beziehen.',
      calculation: '- **Luftschall:** Ausbreitung in Luft/Gasen (rein longitudinal).\<br>- **Körperschall:** Ausbreitung in festen Strukturen (Schubwellen, Biegewellen, Longitudinalwellen).\<br>- **Flüssigkeitsschall:** Ausbreitung in z.B. Wasser (praktisch nur longitudinal, wichtig für Sonar).\<br><br><br><div style="text-align: center; margin: 15px 0;"><svg width="320" height="100" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px;"><line x1="10" y1="40" x2="310" y2="40" stroke="var(--text-muted)" stroke-width="3" /><line x1="80" y1="35" x2="80" y2="45" stroke="#fff" stroke-width="2" /><text x="80" y="58" fill="var(--text-muted)" font-family="Outfit" font-size="10" text-anchor="middle">20 Hz</text><line x1="220" y1="35" x2="220" y2="45" stroke="#fff" stroke-width="2" /><text x="220" y="58" fill="var(--text-muted)" font-family="Outfit" font-size="10" text-anchor="middle">20 kHz</text><rect x="10" y="20" width="70" height="15" fill="var(--red)" opacity="0.3" rx="3" /><text x="45" y="31" fill="#fff" font-family="Outfit" font-size="9" text-anchor="middle" font-weight="600">Infraschall</text><rect x="80" y="20" width="140" height="15" fill="var(--emerald)" opacity="0.3" rx="3" /><text x="150" y="31" fill="#fff" font-family="Outfit" font-size="9" text-anchor="middle" font-weight="600">Hörschall (Audio)</text><rect x="220" y="20" width="90" height="15" fill="var(--cyan)" opacity="0.3" rx="3" /><text x="265" y="31" fill="#fff" font-family="Outfit" font-size="9" text-anchor="middle" font-weight="600">Ultraschall</text></svg></div>'
    }
  },
  {
    id: 'klausur_10',
    title: '10. Fundamentaler Wellenzusammenhang',
    category: 'Wellen',
    question: 'In welcher mathematischen Beziehung stehen die Ausbreitungsgeschwindigkeit $c$, die Frequenz $f$ und die Wellenlänge $\\lambda$ zueinander?<br>Trage die Formel und die Bedeutung der Symbole ein.',
    type: 'multi-field',
    fields: [
      { id: 'wave_eq', label: 'Formel:', placeholder: 'z.B. a = b * c', correct: 'c = lambda * f' },
      { id: 'lambda_unit', label: 'SI-Einheit von $\\lambda$:', placeholder: 'z.B. m', correct: 'm' },
      { id: 'f_unit', label: 'SI-Einheit von $f$:', placeholder: 'z.B. Hz oder 1/s', correct: 'Hz' }
    ],
    formulaId: 'wave_basics',
    solution: {
      intuition: 'Eine Welle legt pro Sekunde eine Distanz zurück, die sich aus der Länge einer Schwingung ($\\lambda$) multipliziert mit der Anzahl der Schwingungen pro Sekunde ($f$) ergibt.',
      redThread: 'Formel lautet $c = \\lambda \\cdot f$.',
      calculation: 'Es gilt:\<br>$$c = \\lambda \\cdot f = \\frac{\\lambda}{T}$$\<br>Mit:\<br>• $c$ = Ausbreitungsgeschwindigkeit (Schallgeschwindigkeit) in $\\text{m/s}$\<br>• $\\lambda$ = Wellenlänge (räumliche Periode) in Meter ($\\text{m}$)\<br>• $f$ = Frequenz (zeitliche Wiederholungsrate) in Hertz ($\\text{Hz}$ bzw. $\\text{1/s}$)'
    }
  },
  {
    id: 'klausur_11',
    title: '11. Wellenzahl und Kreisfrequenz',
    category: 'Wellen',
    question: 'Wie hängen Kreisfrequenz $\\omega$, Wellenzahl $k$ und Schallgeschwindigkeit $c$ zusammen?',
    type: 'multi-field',
    fields: [
      { id: 'w_eq', label: 'Formel für $\\omega$ (Kreisfrequenz über f):', placeholder: 'z.B. 2 * pi * x', correct: '2*pi*f' },
      { id: 'k_eq', label: 'Formel für $k$ (Wellenzahl über lambda):', placeholder: '2*pi/lambda', correct: '2*pi/lambda' },
      { id: 'w_k_rel', label: 'Verknüpfung (Formel für $\\omega$ über c und k):', placeholder: 'z.B. a * b', correct: 'c*k' }
    ],
    formulaId: 'wave_basics',
    solution: {
      intuition: 'Die Wellenzahl $k$ is das räumliche Pendant zur zeitlichen Kreisfrequenz $\\omega$. Beide werden über die Wellengeschwindigkeit $c$ verknüpft.',
      redThread: '1. $\\omega = 2\\pi f$\<br>2. $k = 2\\pi / \\lambda$\<br>3. Division der Gleichungen führt auf $\\omega = c \\cdot k$.',
      calculation: 'Aus $\\omega = 2\\pi f$ und $k = \\frac{2\\pi}{\\lambda}$ folgt:\<br>$$\\frac{\\omega}{k} = \\frac{2\\pi f}{\\frac{2\\pi}{\\lambda}} = f \\cdot \\lambda = c \\implies \\omega = c \\cdot k$$'
    }
  },
  {
    id: 'klausur_12',
    title: '12. Der Party-Gag (Helium-Stimme)',
    category: 'Wellen',
    question: 'Warum spricht man mit einer hohen „Micky-Maus-Stimme“, wenn man Helium einatmet?',
    type: 'multiple-choice',
    options: [
      'Helium wirkt direkt auf den Kehlkopf ein und zieht die Stimmbänder durch chemische Kontraktion mechanisch extrem straff.',
      'Die hohe Schallgeschwindigkeit in Helium verschiebt die akustischen Resonanzfrequenzen des Mund- und Rachenraums nach oben.',
      'Helium besitzt eine geringe Gasdichte und regt die feinen Haarsinneszellen in der Gehörschnecke direkt zu höheren Resonanzschwingungen an.',
      'Helium verringert das nutzbare Lungenvolumen durch Verdrängung des Sauerstoffs, sodass die Atemmuskulatur nur noch hohe Druckfrequenzen erzeugen kann.'
    ],
    correct: 1,
    formulaId: 'constants',
    solution: {
      intuition: 'Der Rachenraum wirkt wie ein Orgelrohr. Ist das Gas darin Helium, breitet sich die Schallwelle viel schneller aus und prallt schneller hin und her – die Tonhöhe steigt.',
      redThread: 'Die Grundfrequenz der Stimmbänder (Larynx) ändert sich kaum. Aber die Formanten (Resonanzfrequenzen des Vokaltrakts) hängen von der Schallgeschwindigkeit des Gases ab: $f_n \\propto c$.',
      calculation: 'Schallgeschwindigkeit in Luft: $c_{Luft} \\approx 340 \\text{ m/s}$.\<br>Schallgeschwindigkeit in Helium: $c_{He} \\approx 1000 \\text{ m/s}$ (da Dichte $\\rho$ viel kleiner ist, $c = \\sqrt{\\kappa R T / M}$).\<br>Die Resonanzfrequenzen des Resonanzraumes (Vokaltrakt) sind:\<br>$$f_n = (2n-1) \\frac{c}{4L}$$\<br>Da $c$ um den Faktor $3$ steigt, wandern alle Resonanzfrequenzen nach oben. Die Stimme klingt dadurch extrem hell und micky-maus-artig.'
    }
  },
  {
    id: 'klausur_13',
    title: '13. Orgelpfeife & Temperatureinfluss',
    category: 'Rohre',
    question: 'Eine Orgelpfeife wird in der kalten Kirche bei $T_1 = 5^\\circ\\text{C}$ bespielt und klingt mit $f_1 = 440\\text{ Hz}$. Welche Frequenz $f_2$ erklingt im Hochsommer bei $T_2 = 35^\\circ\\text{C}$?<br>Berechne die Schallgeschwindigkeiten und die neue Frequenz.',
    type: 'multi-field',
    fields: [
      { id: 'c_5deg', label: 'c bei 5°C (in m/s):', placeholder: 'z.B. 334', correct: '334' },
      { id: 'c_35deg', label: 'c bei 35°C (in m/s):', placeholder: 'z.B. 352', correct: '352' },
      { id: 'f_new', label: 'Neue Frequenz f2 (in Hz, ganzzahlig gerundet):', placeholder: 'z.B. 464', correct: '464' }
    ],
    formulaId: 'temperature_speed',
    solution: {
      intuition: 'Wärmere Luft erhöht die Schallgeschwindigkeit. Da die Länge der Pfeife gleich bleibt, steigt die Frequenz – die Orgel verstimmt sich nach oben.',
      redThread: '1. Berechne $c_1$ bei $5^\\circ$C mit $c \\approx 331 + 0{,}6 \\cdot T$.\<br>2. Berechne $c_2$ bei $35^\\circ$C.\<br>3. Da die Wellenlänge $\\lambda$ konstant ist, gilt $f_2 = f_1 \\cdot \\frac{c_2}{c_1}$.',
      calculation: '1. Schallgeschwindigkeit bei $5^\\circ$C:\<br>$$c_1 = 331 \\text{ m/s} + 0{,}6 \\cdot 5 = 334 \\text{ m/s}$$\<br>2. Schallgeschwindigkeit bei $35^\\circ$C:\<br>$$c_2 = 331 \\text{ m/s} + 0{,}6 \\cdot 35 = 352 \\text{ m/s}$$\<br>3. Frequenzberechnung bei konstanter Rohrlänge $L$ (daher $\\lambda = \\text{konst.}$):\<br>$$f_2 = f_1 \\cdot \\frac{c_2}{c_1} = 440 \\text{ Hz} \\cdot \\frac{352}{334} \\approx 463{,}7 \\text{ Hz} \\approx 464 \\text{ Hz}$$'
    }
  },
  {
    id: 'klausur_14',
    title: '14. Graphen vs. Diamant',
    category: 'Wellen',
    question: 'Welche Schallgeschwindigkeit erwarten Sie in Graphen im Vergleich zu Diamant (Schallgeschwindigkeit Diamant $\\approx 18.000\\text{ m/s}$)?',
    type: 'multiple-choice',
    options: [
      'Deutlich niedriger als in Luft, da das zweidimensionale Gitter keine mechanischen Schallwellen entlang der Atomlagen tragen kann.',
      'Höher als in Diamant, da die Kohlenstoffbindungen in Graphen eine extrem hohe Steifigkeit bei sehr geringer Massendichte aufweisen.',
      'Genau identisch mit der in Diamant, da beide Strukturen aus reinen Kohlenstoffatomen mit identischen Bindungslängen aufgebaut sind.',
      'Nahezu null, da Schallwellen aufgrund der atomaren Dicke von Graphen sofort an der Oberfläche gestreut und gedämpft werden.'
    ],
    correct: 1,
    formulaId: 'wave_basics',
    solution: {
      intuition: 'Schallwellen breiten sich umso schneller aus, je steifer die Bindungen zwischen den Atomen sind und je leichter die Atome selbst sind.',
      redThread: 'Die Schallgeschwindigkeit in Festkörpern ist gegeben durch $c = \\sqrt{\\frac{E}{\\rho}}$.',
      calculation: 'Graphen hat extrem starke kovalente sp²-Bindungen, was zu einem enormen Elastizitätsmodul $E$ führt. Gleichzeitig ist die zweidimensionale Massendichte $\\rho$ minimal. Da:\<br>$$c = \\sqrt{\\frac{E}{\\rho}}$$\<br>ist die Schallgeschwindigkeit in Graphen mit Werten von über $20.000 \\text{ m/s}$ sogar höher als im Diamanten.'
    }
  },
  {
    id: 'klausur_15',
    title: '15. Das Straßenbahn-Paraboltelefon',
    category: 'Wellen',
    question: 'An einigen Haltestellen stehen sich zwei große, parabolförmige Schalen gegenüber, mit denen sich Personen über große Distanzen hinweg leise flüsternd unterhalten können. Welches physikalische Prinzip liegt vor?',
    type: 'multiple-choice',
    options: [
      'Der ausgesendete Schall erfährt eine akustische Verstärkung durch Resonanzeffekte mit den Eigenschwingungen der Straßenbahnschienen.',
      'Die Parabolschalen reflektieren und bündeln die Schallwellen als gerichtetes Bündel, das am Empfänger wieder exakt im Brennpunkt fokussiert wird.',
      'Der Effekt basiert auf elektromagnetischer Koppelung der Schallwellen über die metallischen Trägerstrukturen der Straßenbahn.',
      'Es handelt sich um eine rein psychologische Täuschung, bei der das Gehirn weit entfernte Sprachlaute liest und akustisch rekonstruiert.'
    ],
    correct: 1,
    formulaId: 'spherical_wave',
    solution: {
      intuition: 'Die Parabolschale funktioniert für Schallwellen exakt so wie ein Hohlspiegel (oder eine Parabolantenne) für Licht- bzw. Funkwellen.',
      redThread: 'Schall wird an festen Wänden reflektiert. Die Parabelform lenkt alle aus dem Brennpunkt kommenden Wellen parallel aus.',
      calculation: '1. Sprecher steht im **Brennpunkt (Fokus)** der Parabel 1. Die kugelförmig auseinanderlaufenden Schallwellen treffen auf die Parabel und werden parallel reflektiert.\<br>2. Die parallele Welle reist mit sehr geringen Divergenzverlusten zur zweiten Schale.\<br>3. Die zweite Parabel fängt die parallelen Wellen auf und fokussiert sie alle exakt in ihren Brennpunkt (wo sich das Ohr des Hörers befindet). Dadurch wird der Schall stark verstärkt.'
    }
  },
  {
    id: 'klausur_16',
    title: '16. Schallschnelle vs. Schallgeschwindigkeit',
    category: 'Wellen',
    question: 'Was unterscheidet die Schallschnelle $v$ von der Schallgeschwindigkeit $c$?',
    type: 'multiple-choice',
    options: [
      'Es gibt keinen physikalischen Unterschied, da beide Begriffe historisch bedingt dieselbe Ausbreitungsgeschwindigkeit beschreiben.',
      'Schallgeschwindigkeit ist die Ausbreitungsgeschwindigkeit der Welle im Medium, während Schallschnelle die Schwingungsgeschwindigkeit der Moleküle ist.',
      'Die Schallschnelle gibt die Ausbreitungsgeschwindigkeit im Vakuum an, während die Schallgeschwindigkeit die Dichteänderung im Medium misst.',
      'Schallschnelle ist eine frequenzabhängige Messgröße in Hertz, während die Schallgeschwindigkeit eine konstante Materialeigenschaft in m/s ist.'
    ],
    correct: 1,
    formulaId: 'sound_levels',
    solution: {
      intuition: 'Die Welle rast im Express-Tempo durch den Raum ($c$), aber die Luftmoleküle selbst zittern nur ganz minimal vor und zurück ($v$).',
      redThread: 'Schallgeschwindigkeit $c$ ist eine Materialkonstante des Mediums. Schallschnelle $v$ ist die dynamische Teilchengeschwindigkeit und hängt von der Lautstärke ab.',
      calculation: 'Für eine ebene Welle sind Schalldruck $p$ und Schallschnelle $v$ über den Wellenwiderstand $Z_0$ verknüpft:\<br>$$v = \\frac{p}{Z_0} = \\frac{p}{\\rho \\cdot c}$$\<br>Da $Z_0 \\approx 413 \\text{ Pa s/m}$ in Luft sehr groß ist, ist die Schallschnelle bei normalen Lautstärken extrem klein. Bei $p = 1 \\text{ Pa}$ (ca. 94 dB SPL) beträgt die Schallschnelle nur:\<br>$$v = \\frac{1}{413} \\approx 2.4 \\text{ mm/s} \\ll c \\approx 343 \\text{ m/s}$$'
    }
  },
  {
    id: 'klausur_17',
    title: '17. Das Weber-Fechner-Gesetz',
    category: 'Gehör',
    question: 'Was beschreibt das Weber-Fechner-Gesetz in der Akustik?',
    type: 'multiple-choice',
    options: [
      'Dass die Tonhöhe linear mit der Frequenz ansteigt.',
      'Dass die subjektive Empfindungsstärke logarithmisch mit der physikalischen Reizintensität wächst.',
      'Dass Schallwellen an Ecken gebeugt werden.',
      'Dass Schallgeschwindigkeit unabhängig von der Frequenz ist.'
    ],
    correct: 1,
    formulaId: 'weber_fechner',
    solution: {
      intuition: 'Unser Gehör komprimiert gigantische Pegelunterschiede. Wenn wir die zehnfache Energie aufwenden, empfinden wir das nur als „doppelt so laut“.',
      redThread: 'Reizstärke $S$ und Empfindung $E$ sind über $E = c \\cdot \\ln(S/S_0)$ verknüpft.',
      calculation: 'Die menschliche Lautheitswahrnehmung folgt einer logarithmischen Kennlinie. Daher wurde die Dezibel-Skala eingeführt. Eine Verzehnfachung der Leistung (+10 dB) entspricht etwa einer Verdopplung der wahrgenommenen Lautstärke.'
    }
  },
  {
    id: 'klausur_18',
    title: '18. Warum wurde das dB(A) eingeführt?',
    category: 'Gehör',
    question: 'Warum wird bei Lärmmessungen meist die dB(A)-Bewertung verwendet?',
    type: 'multiple-choice',
    options: [
      'Weil die A-Gewichtung für allgemeine Akustikmessungen im Freien optimiert ist und als internationaler Standard gilt.',
      'Um den Frequenzgang des Messgeräts an die frequenzabhängige Empfindlichkeit des menschlichen Gehörs bei leisen Lautstärken anzupassen.',
      'Weil die A-Skala auf einer vereinfachten logarithmischen Skalierung basiert, die mathematisch leichter zu berechnen ist.',
      'Damit tiefe Frequenzen im tieffrequenten Bassbereich künstlich angehoben werden, um den Umgebungslärm herauszufiltern.'
    ],
    correct: 1,
    formulaId: 'sound_levels',
    solution: {
      intuition: 'Unser Ohr ist bei tiefen Tönen (Bass) viel unempfindlicher als im Präsenzbereich bei 2-4 kHz. Der dB(A)-Filter ahmt dies nach, indem er tiefe Frequenzen abschwächt.',
      redThread: 'Die A-Bewertungskurve dämpft tiefe (und extrem hohe) Frequenzen ab, um dem menschlichen Frequenzgang (Kurven gleicher Lautstärkepegel nach Fletcher-Munson) gerecht zu werden.',
      calculation: 'Der bewertete Schalldruckpegel $L_{pA}$ wird ermittelt, indem das Schallspektrum mit der A-Filterkurve gefaltet wird. Ein Ton bei 50 Hz wird beispielsweise um ca. $-30 \\text{ dB}$ gedämpft, während ein Ton bei 1 kHz unverändert ($0 \\text{ dB}$) in die Bewertung einfließt.'
    }
  },
  {
    id: 'klausur_19',
    title: '19. Kugelwelle - Abstandsgesetz',
    category: 'Wellen',
    question: 'Wie ändert sich der Schalldruck $p$ einer idealen Kugelwelle im Freifeld, wenn sich der Abstand zur Schallquelle vervierfacht?',
    type: 'multiple-choice',
    options: [
      'Er bleibt genau gleich.',
      'Er sinkt auf ein Sechzehntel (1/16) des Werts.',
      'Er sinkt auf ein Viertel (1/4) des Werts.',
      'Er halbiert sich.'
    ],
    correct: 2,
    formulaId: 'spherical_wave',
    solution: {
      intuition: 'Der Schalldruck nimmt mit dem Abstand $r$ ab, da sich die Schallenergie auf eine immer größere Kugelfläche verteilen muss.',
      redThread: 'Im Fernfeld einer Kugelwelle gilt $p \\propto 1/r$ (1/r-Gesetz) und $I \\propto 1/r^2$ (Abstandsquadratgesetz).',
      calculation: 'Für den Schalldruck gilt:\<br>$$p(r) = \\frac{A}{r}$$\<br>Ververvierfachung des Abstands ($r_2 = 4 r_1$):\<br>$$p(r_2) = \\frac{A}{4 r_1} = \\frac{1}{4} p(r_1)$$\<br>Der Schalldruck sinkt also auf **ein Viertel (1/4)**. (Für den Schallpegel bedeutet dies eine Reduktion um $\\Delta L_p = 20 \\log_{10}(1/4) \\approx -12 \\text{ dB}$).'
    }
  },
  {
    id: 'klausur_20',
    title: '20. Klirrverzerrungen bei hohen Schalldrücken',
    category: 'Wellen',
    question: 'Warum kommt es bei extrem hohen Schalldrücken in Luft zu Klirrverzerrungen und Intermodulation?',
    type: 'multiple-choice',
    options: [
      'Weil die Zuleitungskabel bei hohen Leistungen thermisch überlastet werden und elektromagnetische Störsignale in die Schwingspule induzieren.',
      'Weil Luft bei extrem hohen Drücken nichtlinear reagiert, wodurch sich Kompressionsphasen erwärmen und die Sinusform der Schallwelle verzerrt.',
      'Weil sich die Schallgeschwindigkeit bei hohen Pegeln lokal verlangsamt und dadurch Phasenverschiebungen im Frequenzspektrum erzeugt.',
      'Weil die Gehörschnecke ab einem Schalldruckpegel von 80 dB keine reinen Sinustöne mehr trennen kann und Obertöne hinzudichtet.'
    ],
    correct: 1,
    formulaId: 'constants',
    solution: {
      intuition: 'Bei Riesenpegeln wird die Luft so stark zusammengepresst, dass sie sich erwärmt. Heiße Luft leitet Schall schneller als kalte Luft – die Wellenberge holen die Täler ein.',
      redThread: 'Die Schallgeschwindigkeit hängt von der Temperatur ab. Bei extremem Schalldruck is die Zustandsänderung adiabatisch und nichtlinear.',
      calculation: '1. In den Verdichtungsphasen (hoher Druck) steigt die Temperatur, wodurch $c$ lokal ansteigt.\<br>2. In den Verdünnungsphasen (Unterdruck) sinkt die Temperatur, wodurch $c$ lokal sinkt.\<br>3. Die Druckmaxima bewegen sich schneller als die Druckminima. Dadurch verformt sich die Welle im Laufe der Ausbreitung (Sinuskurve steilt sich auf und nähert sich einer Sägezahnform).\<br>4. Mathematisch entspricht diese Verformung dem Entstehen neuer Frequenzen (Oberschwingungen = Klirrverzerrung).'
    }
  },
  {
    id: 'klausur_21',
    title: '21. Klassifikation von Musikinstrumenten',
    category: 'Wellen',
    question: 'Nenne die vier Hauptgruppen der Instrumentenklassifikation nach Hornbostel-Sachs.',
    type: 'multi-field',
    fields: [
      { id: 'inst_chord', label: 'Saitenklinger (z.B. Gitarre, Klavier):', placeholder: 'z.B. Elektophone', correct: 'Chordophone' },
      { id: 'inst_idio', label: 'Selbstklinger (z.B. Xylophon, Becken):', placeholder: 'z.B. Elektophone', correct: 'Idiophone' },
      { id: 'inst_memb', label: 'Fellklinger (z.B. Trommel, Pauke):', placeholder: 'z.B. Elektophone', correct: 'Membranophone' },
      { id: 'inst_aero', label: 'Luftklinger (z.B. Orgelpfeife, Flöte):', placeholder: 'z.B. Elektophone', correct: 'Aerophone' }
    ],
    formulaId: 'standing_waves',
    solution: {
      intuition: 'Musikinstrumente werden systematisch danach eingeteilt, was primär den physikalischen Ton erzeugt: Eine Saite, ein starrer Körper, eine Membran oder eine Luftsäule.',
      redThread: 'Verwende die Fachbegriffe auf -phone.',
      calculation: '- **Chordophone:** Saitenklinger. Die Schallquelle ist eine gespannte Saite (Violine, Klavier, Gitarre).\<br>- **Idiophone:** Selbstklinger. Der elastische Instrumentenkörper schwingt selbst (Xylophon, Triangel, Becken).\<br>- **Membranophone:** Fellklinger. Eine gespannte Membran schwingt (Trommel, Pauke).\<br>- **Aerophone:** Luftklinger. Die Schallquelle ist eine schwingende Luftsäule (Flöte, Trompete, Orgelpfeife).'
    }
  },
  {
    id: 'klausur_22',
    title: '22. Noise-Cancelling (ANC)',
    category: 'Wellen',
    question: 'Auf welchem physikalischen Grundprinzip basiert die aktive Geräuschunterdrückung (Active Noise Cancelling) bei Kopfhörern?',
    type: 'multiple-choice',
    options: [
      'Der Kopfhörer erzeugt ein aktives elektromagnetisches Gegenfeld, welches die ankommenden Schallwellen vor dem Ohr ablenkt.',
      'Ein mikrofon nimmt den Außenschall auf und strahlt diesen um 180° phasenverschoben wieder aus, sodass sich die Druckwellen auslöschen.',
      'Der Kopfhörer erzeugt über ein integriertes Ventil einen leichten Unterdruck in der Ohrmuschel, was die Schallübertragung dämpft.',
      'Es wird ein akustisch optimiertes Gegenrauschen eingespielt, welches die Wahrnehmung des Gehirns effektiv von Störgeräuschen ablenkt.'
    ],
    correct: 1,
    formulaId: 'wave_basics',
    solution: {
      intuition: 'Wenn ein Berg auf ein gleich tiefes Tal trifft, heben sie sich auf. ANC erzeugt künstlich ein exaktes Gegental zu jedem ankommenden Schallberg.',
      redThread: 'Das Prinzip ist die destruktive Interferenz von Wellen: $p_{ges}(t) = p_{Störung}(t) + p_{Gegenschall}(t) = 0$.',
      calculation: 'Ein Mikrofon an der Außenseite misst $p_{Stör}(t)$. Der interne DSP berechnet das invertierte Signal $p_{Gegen}(t) = -p_{Stör}(t)$ unter Berücksichtigung der Laufzeit zum Ohrkanal. Der Lautsprecher gibt diesen Antischall wieder. Die Überlagerung in der Luftkammer vor dem Trommelfell ergibt:\<br>$$p_{ges} = p_{Stör} + (-p_{Stör}) = 0$$'
    }
  },
  {
    id: 'klausur_23',
    title: '23. Die reale Klaviersaite',
    category: 'Wellen',
    question: 'Warum sind die harmonischen Obertöne einer realen Klaviersaite meist keine ganzzahligen Vielfachen der Grundfrequenz?',
    type: 'multiple-choice',
    options: [
      'Weil die Klaviersaiten durch das Anschlagen der Hämmerchen mechanisch gedehnt werden und sich dadurch ungleichmäßig verstimmen.',
      'Weil die Biegesteifigkeit dicker Saiten bei kurzen Wellenlängen als zusätzliche Kraft wirkt und die Eigenfrequenzen anhebt.',
      'Weil die Resonanzböden des Klaviers aus Holz gefertigt sind und durch Eigendämpfung die Oberschwingungen der Saite dämpfen.',
      'Weil sich die Temperatur und Luftfeuchtigkeit im Klaviergehäuse durch das Spielen ständig ändern und die Saiten verstimmen.'
    ],
    correct: 1,
    formulaId: 'standing_waves',
    solution: {
      intuition: 'Eine dicke Stahlsaite lässt sich nicht beliebig leicht biegen. Diese Steifigkeit drückt die Saite bei schnellen Schwingungen extra stark in die Ausgangslage zurück – sie schwingt schneller als gedacht.',
      redThread: 'Die Biegesteifigkeit erhöht die Rückstellkraft besonders bei hohen Frequenzen (kurzen Wellenlängen).',
      calculation: 'Für eine ideale Saite gilt $f_n = n \\cdot f_1$. Für eine reale Saite mit Biegesteifigkeit gilt die Näherungsformel:\<br>$$f_n = n \\cdot f_1 \\cdot \\sqrt{1 + B \\cdot n^2}$$\<br>Mit dem Inharmonizitätskoeffizienten $B \\propto E \\cdot d^4 / F_0$ ($E$ = Elastizitätsmodul, $d$ = Saitendurchmesser, $F_0$ = Saitenspannung). Da $B > 0$, rutschen die Frequenzen der Obertöne mit steigender Ordnung $n$ immer weiter nach oben ab.'
    }
  },
  {
    id: 'klausur_24',
    title: '24. Warum sind Xylophonstäbe ausgehöhlt?',
    category: 'Wellen',
    question: 'Warum sind die Holzstäbe eines Xylophons an der Unterseite meist bogenförmig ausgehöhlt (ausgekehlt)?',
    type: 'multiple-choice',
    options: [
      'Um das Eigengewicht des Holzstabs zu reduzieren und dadurch ein schnelleres Einschwingverhalten nach dem Anschlag zu ermöglichen.',
      'Um die Steifigkeit in der Mitte gezielt zu senken (was den Grundton senkt) und die Obertöne in ein harmonisches Verhältnis zu bringen.',
      'Um eine passgenaue Mulde für die Filzauflagen zu schaffen, damit die Stäbe beim Anschlagen nicht verrutschen oder klappern.',
      'Um akustische Hohlräume zu bilden, die als Resonanzkörper dienen und den Schall gerichtet nach unten abstrahlen.'
    ],
    correct: 1,
    formulaId: 'standing_waves',
    solution: {
      intuition: 'Ein gerader Holzquader klingt beim Anschlagen eher dumpf und unharmonisch. Durch die Auskehlung stimmt man den Stab exakt so, dass die Obertöne musikalisch rein klingen.',
      redThread: '1. Die Dickenreduktion in der Mitte schwächt die Steifigkeit, was die Frequenz der Grund-Biegewelle senkt.\<br>2. Durch gezieltes Abtragen an bestimmten Stellen (Schwingungsknoten/-bäuche) lassen sich Grundton und Obertöne separat abstimmen.',
      calculation: 'Ein homogener freier Stab hat unharmonische Eigenfrequenzen ($f_1, 2.76 f_1, 5.40 f_1...$). Durch die bogenförmige Auskehlung wird das Trägheitsmoment in der Mitte verringert. Dies senkt $f_1$ (Kompensation der Länge) und verschiebt die Frequenz des ersten Obertons gezielt auf exakt $3 \\cdot f_1$ (eine reine Quinte über der Oktave), was dem Xylophon seinen reinen, harmonischen Charakter gibt.'
    }
  },
  {
    id: 'klausur_25',
    title: '25. Mündungskorrektur',
    category: 'Rohre',
    question: 'Erkläre den Begriff der Mündungskorrektur bei Orgelpfeifen oder Flöten und nenne die übliche Faustformel für ein offenes Ende.',
    type: 'multi-field',
    fields: [
      { id: 'end_corr_formula', label: 'Faustformel für ein freies Ende Delta L:', placeholder: 'z.B. 0.5 * d', correct: '0.6 * r' },
      { id: 'end_corr_eff_len', label: 'Wirksame Länge Leff bei einem beidseitig offenen Rohr (Länge L, Radius r):', placeholder: 'z.B. A + 2 * B', correct: 'L + 1.2 * r' }
    ],
    formulaId: 'end_correction',
    solution: {
      intuition: 'Die Luft schwingt an der Mündung eines Rohres etwas über das physikalische Rohrende hinaus in den Raum. Das Rohr wirkt dadurch akustisch etwas länger.',
      redThread: 'Am offenen Ende ist der Schalldruck nicht exakt Null, sondern die Reflexion findet ein Stück außerhalb statt. Der Korrekturwert beträgt $\\Delta L \\approx 0{,}6 \\cdot r$ pro offenem Ende.',
      calculation: '1. Die Welle reflektiert in einem Abstand $\\Delta L$ außerhalb des Mündungsrandes. Die effektive Länge ist daher:\<br>$$L_{eff} = L_{geometrisch} + \\sum \\Delta L$$\<br>2. Für ein einseitig geschlossenes Rohr (ein offenes Ende): $L_{eff} = L + 0{,}6 \\cdot r$.\<br>3. Für ein beidseitig offenes Rohr (zwei offene Enden): $L_{eff} = L + 2 \\cdot (0{,}6 \\cdot r) = L + 1{,}2 \\cdot r$.'
    }
  }
];

export const LECTURE_QUESTIONS = [
  {
    id: 'lec_01_01',
    title: 'Coulomb vs. Gravitation',
    category: 'Grundlagen',
    question: 'In welcher Hinsicht stimmen das newtonsche Gravitationsgesetz und das coulombschen Gesetz überein?',
    type: 'multiple-choice',
    options: [
      'Beide Kräfte sind immer anziehend.',
      'Beide Kräfte nehmen umgekehrt proportional zum Quadrat des Abstands ($1/r^2$) ab.',
      'Beide Kräfte hängen von den elektrischen Ladungen ab.',
      'Beide Kräfte sind nur im Vakuum aktiv.'
    ],
    correct: 1,
    formulaId: 'constants',
    solution: {
      intuition: 'Sowohl Massen als auch Ladungen erzeugen Felder, deren Wirkung im dreidimensionalen Raum mit der Fläche einer Kugel ($4\\pi r^2$) abnimmt.',
      redThread: 'Gravitationsgesetz: $F_G = G \\frac{m_1 m_2}{r^2}$. Coulomb-Gesetz: $F_C = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$.',
      calculation: 'Beide Gesetze weisen dieselbe mathematische Struktur auf:\<br>$$F \\propto \\frac{1}{r^2}$$\<br>Sie sind radialsymmetrische Zentralkräfte, deren Stärke quadratisch mit dem Abstand abnimmt.'
    }
  },
  {
    id: 'lec_02_01',
    title: 'SI-Basiseinheiten',
    category: 'Grundlagen',
    question: 'Welche der folgenden Einheiten ist KEINE SI-Basiseinheit?',
    type: 'multiple-choice',
    options: [
      'Meter (Länge)',
      'Kilogramm (Masse)',
      'Newton (Kraft)',
      'Ampere (Stromstärke)'
    ],
    correct: 2,
    formulaId: 'constants',
    solution: {
      intuition: 'Das SI-System baut auf sieben fundamentale Basiseinheiten auf. Alle anderen Einheiten werden aus diesen zusammengesetzt.',
      redThread: 'Die sieben Basiseinheiten sind: m, kg, s, A, K, mol, cd. Das Newton ist eine abgeleitete Einheit.',
      calculation: 'Ein Newton ist definiert als die Kraft, die benötigt wird, um eine Masse von 1 kg mit $1 \\text{ m/s}^2$ zu beschleunigen:\<br>$$1 \\text{ N} = 1 \\text{ kg} \\cdot \\text{m/s}^2$$'
    }
  },
  {
    id: 'lec_03_01',
    title: 'Hookesches Gesetz',
    category: 'Schwingungen',
    question: 'Welches Gesetz beschreibt die proportionale Rückstellkraft einer gedehnten Feder?',
    type: 'multiple-choice',
    options: [
      'Das Hookesche Gesetz',
      'Das Ohmsche Gesetz',
      'Das Snellius-Brechungsgesetz',
      'Das Newtonsche Abkühlungsgesetz'
    ],
    correct: 0,
    formulaId: 'spring_pendulum',
    solution: {
      intuition: 'Je weiter man eine elastische Feder ausdehnt, desto stärker zieht sie sich wieder zusammen. Diese Kraft ist proportional zur Auslenkung.',
      redThread: 'Das Hookesche Gesetz lautet $F = -D \\cdot x$.',
      calculation: 'Es gilt:\<br>$$F(x) = -D \\cdot x$$\<br>Mit $F$ = Kraft in Newton, $D$ = Federkonstante in N/m, $x$ = Auslenkung in Metern. Das Minuszeichen zeigt, dass die Kraft der Auslenkung entgegengerichtet ist.'
    }
  },
  {
    id: 'lec_05_01',
    title: 'Schallschnelle Definition',
    category: 'Wellen',
    question: 'Wie ist die Schallschnelle physikalisch definiert?',
    type: 'multiple-choice',
    options: [
      'Als die mittlere Strömungsgeschwindigkeit des Windes.',
      'Als die Momentangeschwindigkeit, mit der die Luftteilchen um ihre Ruhelage schwingen.',
      'Als die Geschwindigkeit, mit der die Wellenfront voranschreitet.',
      'Als die Schallgeschwindigkeit geteilt durch die Wellenlänge.'
    ],
    correct: 1,
    formulaId: 'sound_levels',
    solution: {
      intuition: 'Schallschnelle beschreibt die Bewegung der Moleküle des Mediums, nicht der Welle selbst.',
      redThread: 'Teilchenschwingungsgeschwindigkeit $v = \\dot{x}(t) = \\frac{dx}{dt}$.',
      calculation: 'Die Schallschnelle ist die zeitliche Ableitung der Teilchenauslenkung $\\xi(t)$:\<br>$$v(t) = \\frac{\\partial \\xi}{\\partial t}$$'
    }
  },
  {
    id: 'lec_06_01',
    title: 'Referenzwert des Schalldrucks',
    category: 'Wellen',
    question: 'Wie hoch ist der Referenzschalldruck p0 der menschlichen Hörschwelle bei 1 kHz?',
    type: 'multiple-choice',
    options: [
      '1 Pa',
      '20 µPa (20 * 10^-6 Pa)',
      '10^-12 Pa',
      '343 Pa'
    ],
    correct: 1,
    formulaId: 'constants',
    solution: {
      intuition: 'Der Referenzwert entspricht dem leisesten Schalldruck, den ein gesundes menschliches Ohr bei der empfindlichsten Frequenz gerade noch wahrnehmen kann.',
      redThread: '$p_0 = 20 \\, \\mu\\text{Pa}$ ist der internationale Bezugswert für den Schalldruckpegel.',
      calculation: '$$p_0 = 20 \\cdot 10^{-6} \\text{ Pa} = 2 \\cdot 10^{-5} \\text{ N/m}^2$$'
    }
  },
  {
    id: 'lec_08_01',
    title: 'Stehende Welle - Offenes Ende',
    category: 'Rohre',
    question: 'Welche physikalische Bedingung liegt an einem idealen OFFENEN Ende eines Orgelrohres vor?',
    type: 'multiple-choice',
    options: [
      'Ein Schalldruckmaximum (Druckbauch) bei minimaler Teilchenbewegung.',
      'Ein Schalldruckknoten (Druckminimum) und ein Schallschnellemaximum (Bewegungsbauch).',
      'Ein Abfall der lokalen Schallgeschwindigkeit im Medium auf Null.',
      'Ein schalltoter Übergang, bei dem keinerlei Reflexion der Welle stattfindet.'
    ],
    correct: 1,
    formulaId: 'standing_waves',
    solution: {
      intuition: 'Am offenen Ende kann sich kein nennenswerter Druck aufbauen, da die Luftteilchen ungehindert in den freien Raum ausweichen können. Sie schwingen dort maximal heftig.',
      redThread: 'Offenes Ende = Druckknoten (Druck = 0, da an Atmosphäre gekoppelt) und Schnellemaximum (maximale Bewegung).',
      calculation: 'Die akustische Randbedingung an einer offenen Grenzfläche fordert, dass der Wechseldruck $p$ verschwindet:\<br>$$p_{Wechsel}(x_{Mündung}) = 0$$'
    }
  },
  {
    id: 'lec_11_01',
    title: 'Helmholtz-Resonator',
    category: 'Rohre',
    question: 'Ein Helmholtz-Resonator (z.B. eine leere Bierflasche, über die man bläst) besteht aus einem Volumen V und einem Hals der Länge L und Querschnitt A. Was schwingt hier?',
    type: 'multiple-choice',
    options: [
      'Die elastische Schwingung der starren Flaschenwand durch akustischen Druck.',
      'Die Luft im Flaschenhals schwingt als Masse auf dem Flaschenvolumen, das als Feder wirkt.',
      'Die stehende elektromagnetische Welle im Inneren des zylindrischen Hohlraums.',
      'Die Anregung transversaler Eigenschwingungen entlang der gespannten Flaschenoberfläche.'
    ],
    correct: 1,
    formulaId: 'resonance',
    solution: {
      intuition: 'Der Flaschenhals wirkt wie ein Kolben aus Luft. Drückt man ihn hinein, wird die Luft in der Flasche komprimiert und drückt ihn wie eine Feder wieder nach außen.',
      redThread: 'Helmholtz-Resonanz ist ein Masse-Feder-System. Masse = Luftkolben im Hals ($m = \\rho A L_{eff}$), Feder = Kompressibilität des Innenvolumens ($D = \\rho c^2 A^2 / V$).',
      calculation: 'Die Resonanzfrequenz eines Helmholtz-Resonators berechnet sich zu:\<br>$$f_0 = \\frac{c}{2\\pi} \\sqrt{\\frac{A}{V \\cdot L_{eff}}}$$'
    }
  }
];

export const CAMPAIGN_STAGES = [
  {
    id: 'stage_1',
    title: 'Stage 1: Grundlagen & Einheiten',
    bossName: 'Der RMS-König 👑',
    bossEmoji: '👑',
    bossGenerator: 'rms_value_calc',
    levels: [
      { id: 'stage1_lvl1', type: 'theorie', title: 'Theorie-Check', questionIds: ['klausur_01', 'klausur_04', 'klausur_09'] },
      { id: 'stage1_lvl2', type: 'praxis', title: 'Einheiten & Klassifikation', questionIds: ['klausur_02', 'klausur_21'] },
      { id: 'stage1_lvl3', type: 'boss', title: 'RMS-Mittelwert-Berechnung' }
    ]
  },
  {
    id: 'stage_2',
    title: 'Stage 2: Schwingungen & Pendel',
    bossName: 'Der DGL-Dämon 👾',
    bossEmoji: '👾',
    bossGenerator: 'spring_pendulum_calc',
    levels: [
      { id: 'stage2_lvl1', type: 'theorie', title: 'Dämpfung & Resonanz', questionIds: ['klausur_05', 'klausur_06'] },
      { id: 'stage2_lvl2', type: 'praxis', title: 'Bewegungsgleichung', questionIds: ['klausur_03'] },
      { id: 'stage2_lvl3', type: 'boss', title: 'Federpendel-DGL-Berechnung' }
    ]
  },
  {
    id: 'stage_3',
    title: 'Stage 3: Signalanalyse & Pegel',
    bossName: 'Die Kugelwellen-Krake 🐙',
    bossEmoji: '🐙',
    bossGenerator: 'spherical_wave_calc',
    levels: [
      { id: 'stage3_lvl1', type: 'theorie', title: 'Filter-Dämpfung', questionIds: ['klausur_07'] },
      { id: 'stage3_lvl2', type: 'praxis', title: 'Effektivwert-Integral', questionIds: ['klausur_08'] },
      { id: 'stage3_lvl3', type: 'boss', title: 'Kugelwellen-Pegel-Berechnung' }
    ]
  },
  {
    id: 'stage_4',
    title: 'Stage 4: Wellen & Akustik',
    bossName: 'Der Orgel-Titan 🧌',
    bossEmoji: '🧌',
    bossGenerator: 'pipe_temp_calc',
    levels: [
      { id: 'stage4_lvl1', type: 'theorie', title: 'Akustik-Konzepte', questionIds: ['klausur_14', 'klausur_15', 'klausur_16', 'klausur_17', 'klausur_18', 'klausur_20', 'klausur_22'] },
      { id: 'stage4_lvl2', type: 'praxis', title: 'Wellenzahl & Frequenz', questionIds: ['klausur_10', 'klausur_11'] },
      { id: 'stage4_lvl3', type: 'boss', title: 'Orgelrohr-Frequenz-Berechnung' }
    ]
  },
  {
    id: 'stage_5',
    title: 'Stage 5: Musikakustik & Rohre',
    bossName: 'Der Mündungs-Meister 🧙',
    bossEmoji: '🧙',
    bossGenerator: 'end_correction_calc',
    levels: [
      { id: 'stage5_lvl1', type: 'theorie', title: 'Instrumenten-Physik', questionIds: ['klausur_23', 'klausur_24'] },
      { id: 'stage5_lvl2', type: 'praxis', title: 'Mündungskorrektur & Helium', questionIds: ['klausur_12', 'klausur_13', 'klausur_19', 'klausur_25'] },
      { id: 'stage5_lvl3', type: 'boss', title: 'Mündungskorrektur-Berechnung' }
    ]
  }
];

