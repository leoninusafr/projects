// Formulas Database for Physics 2 Cheatsheet (Physikalische Akustik)

export const FORMULAS_DB = {
  'constants': {
    id: 'constants',
    title: 'Akustische Konstanten',
    category: 'Grundlagen',
    formula: 'c_{Luft} \\approx 343 \\text{ m/s} \\quad | \\quad c_{Helium} \\approx 1000 \\text{ m/s} \\quad | \\quad p_0 = 20 \\, \\mu\\text{Pa} \\quad | \\quad I_0 = 10^{-12} \\text{ W/m}^2',
    description: 'Wichtige akustische Referenzwerte bei Standardbedingungen (20°C). $p_0$ ist die menschliche Hörschwelle bei 1 kHz, $I_0$ die entsprechende Schallintensität.',
    recipe: '1. Schallgeschwindigkeit in Luft: ca. 343 m/s bei 20°C.\n2. In Helium breitet sich Schall aufgrund der geringeren Dichte deutlich schneller aus (ca. 1000 m/s).\n3. Referenzschalldruck $p_0$ dient als Bezugswert für Dezibel-Berechnungen ($L_p$).',
    youtube: 'https://www.youtube.com/results?search_query=schallgeschwindigkeit+referenzwerte',
    defaultNotes: 'Helium erhöht die Schallgeschwindigkeit c, wodurch die Resonanzfrequenzen des Mundraums steigen (Micky-Maus-Effekt).'
  },
  
  'spring_pendulum': {
    id: 'spring_pendulum',
    title: 'Harmonischer Oszillator (Federpendel)',
    category: 'Schwingungen',
    formula: 'm\\ddot{x} + Dx = 0 \\quad \\Longrightarrow \\quad \\omega_0 = \\sqrt{\\frac{D}{m}} \\quad | \\quad f_0 = \\frac{1}{2\\pi}\\sqrt{\\frac{D}{m}}',
    description: 'Bewegungsgleichung des ungedämpften Federpendels. $m$ ist die Masse, $D$ die Federkonstante und $x$ die Auslenkung.',
    recipe: '1. Kräftegleichgewicht aufstellen: Trägheitskraft $m\\ddot{x}$ und Rückstellkraft $-Dx$ addieren sich zu Null.\n2. Eigenkreisfrequenz $\\omega_0$ bestimmen durch $\\sqrt{D/m}$.\n3. Eigenfrequenz $f_0$ berechnen über $f_0 = \\omega_0 / 2\\pi$.',
    youtube: 'https://www.youtube.com/results?search_query=harmonischer+oszillator+federpendel',
    defaultNotes: 'Gilt bei vernachlässigbarer Reibung. Erhöhung der Masse verringert die Frequenz.'
  },
  
  'damping': {
    id: 'damping',
    title: 'Gedämpfte Schwingung & Grenzfall',
    category: 'Schwingungen',
    formula: '\\ddot{x} + 2\\delta\\dot{x} + \\omega_0^2 x = 0 \\quad | \\quad \\text{Aperiodischer Grenzfall: } \\delta = \\omega_0',
    description: 'Schwingungsgleichung mit Dämpfungskoeffizient $\\delta$. Der aperiodische Grenzfall beschreibt die schnellstmögliche Rückkehr zur Ruhelage ohne Überschwingen.',
    recipe: '1. Falls $\\delta < \\omega_0$: Schwingfall (abklingende sinusförmige Oszillation).\n2. Falls $\\delta = \\omega_0$: Aperiodischer Grenzfall (wichtig z.B. für Stoßdämpfer oder Zeigermessgeräte).\n3. Falls $\\delta > \\omega_0$: Kriechfall (sehr langsame Rückkehr zur Nulllage).',
    youtube: 'https://www.youtube.com/results?search_query=aperiodischer+grenzfall+dämpfung',
    defaultNotes: 'Wird auch als kritische Dämpfung bezeichnet.'
  },
  
  'resonance': {
    id: 'resonance',
    title: 'Erzwungene Schwingung & Resonanz',
    category: 'Schwingungen',
    formula: '\\omega_R = \\sqrt{\\omega_0^2 - 2\\delta^2} \\quad | \\quad Q = \\frac{\\omega_0}{2\\delta}',
    description: 'Resonanz tritt auf, wenn ein System periodisch angeregt wird und die Anregungsfrequenz nahe der Eigenfrequenz liegt. $Q$ ist der Gütefaktor (Qualitätsfaktor).',
    recipe: '1. Resonanzfrequenz $\\omega_R$ liegt leicht unter der ungedämpften Eigenfrequenz $\\omega_0$.\n2. Je kleiner die Dämpfung $\\delta$, desto schärfer die Resonanzkurve und desto größer der Gütefaktor $Q$.\n3. Bei $\\delta = 0$ (ideal) würde die Amplitude bei Resonanz unendlich groß werden (Resonanzkatastrophe).',
    youtube: 'https://www.youtube.com/results?search_query=resonanz+gütefaktor+erzwungene+schwingung',
    defaultNotes: 'Musikinstrumente nutzen Resonanzkörper zur Schallverstärkung.'
  },
  
  'wave_basics': {
    id: 'wave_basics',
    title: 'Wellengleichung & Kenngrößen',
    category: 'Wellen',
    formula: 'c = \\lambda \\cdot f \\quad | \\quad k = \\frac{2\\pi}{\\lambda} \\quad | \\quad \\omega = 2\\pi f \\quad \\Longrightarrow \\quad \\omega = c \\cdot k',
    description: 'Zusammenhang zwischen Ausbreitungsgeschwindigkeit $c$, Wellenlänge $\\lambda$, Frequenz $f$, Wellenzahl $k$ und Kreisfrequenz $\\omega$.',
    recipe: '1. Schallgeschwindigkeit in Luft ist ca. 340 m/s. Höhere Frequenz bedeutet kürzere Wellenlänge.\n2. Die Wellenzahl $k$ gibt an, wie viele Schwingungszyklen auf eine Einheitsstrecke von $2\\pi$ Metern entfallen.\n3. $\\omega = c \\cdot k$ ist die Dispersionsrelation für dispersionsfreie Medien.',
    youtube: 'https://www.youtube.com/results?search_query=wellenzahl+wellenlänge+frequenz',
    defaultNotes: 'Die Wellenzahl k ist das räumliche Äquivalent zur zeitlichen Kreisfrequenz w.'
  },
  
  'sound_levels': {
    id: 'sound_levels',
    title: 'Schallpegel (Dezibel)',
    category: 'Wellen',
    formula: 'L_p = 20 \\cdot \\log_{10}\\left(\\frac{p}{p_0}\\right) \\quad | \\quad L_I = 10 \\cdot \\log_{10}\\left(\\frac{I}{I_0}\\right) \\quad | \\quad I = \\frac{p^2}{Z_0}',
    description: 'Der logarithmische Schallpegel in Dezibel (dB). $Z_0 \\approx 413 \\text{ Pa s/m}$ ist der Schallwellenwiderstand der Luft.',
    recipe: '1. Eine Verdopplung des Schalldrucks $p$ erhöht den Pegel um $+6$ dB ($20 \\log_{10}(2) \\approx 6$).\n2. Eine Verdopplung der Intensität $I$ erhöht den Pegel um $+3$ dB ($10 \\log_{10}(2) \\approx 3$).\n3. Das Gehör nimmt eine Änderung von ca. 10 dB als Verdopplung der Lautstärke wahr.',
    youtube: 'https://www.youtube.com/results?search_query=schallpegel+dezibel+berechnen',
    defaultNotes: 'Z0 = p / v (Schalldruck geteilt durch Schallschnelle).'
  },
  
  'weber_fechner': {
    id: 'weber_fechner',
    title: 'Weber-Fechner-Gesetz',
    category: 'Gehör',
    formula: 'E = c \\cdot \\ln\\left(\\frac{S}{S_0}\\right) \\quad \\Longrightarrow \\quad E \\propto \\text{log}(S)',
    description: 'Beschreibt das logarithmische Verhältnis zwischen Reizstärke $S$ und subjektiver Empfindungsstärke $E$. Wichtig für das Hörempfinden.',
    recipe: '1. Menschliches Empfinden wächst logarithmisch mit der physikalischen Reizintensität.\n2. Daher wird in der Akustik der logarithmische Dezibel-Pegel verwendet.\n3. 10-fache physikalische Schallleistung entspricht subjektiv ca. einer Verdopplung der Lautheit (+10 dB).',
    youtube: 'https://www.youtube.com/results?search_query=weber+fechner+gesetz+akustik',
    defaultNotes: 'Erklärt, warum wir einen riesigen Dynamikbereich hören können.'
  },
  
  'spherical_wave': {
    id: 'spherical_wave',
    title: 'Kugelwelle (Fernfeld)',
    category: 'Wellen',
    formula: 'p(r) \\propto \\frac{1}{r} \\quad | \\quad I(r) \\propto \\frac{1}{r^2}',
    description: 'Abstandsgesetz für eine ideale Kugelwelle im Fernfeld. Der Schalldruck nimmt linear mit dem Abstand ab, die Intensität quadratisch.',
    recipe: '1. Schalldruck $p$ ist proportional zu $1/r$. Bei 4-fachem Abstand sinkt der Druck auf $1/4$.\n2. Schallintensität $I$ sinkt mit $1/r^2$. Bei 4-fachem Abstand sinkt die Intensität auf $1/16$.\n3. Pegelabfall bei Abstandsverdopplung beträgt $-6$ dB für den Schalldruckpegel.',
    youtube: 'https://www.youtube.com/results?search_query=kugelwelle+abstandsgesetz',
    defaultNotes: 'Gilt nur im Freifeld ohne Reflexionen.'
  },
  
  'temperature_speed': {
    id: 'temperature_speed',
    title: 'Schallgeschwindigkeit & Temperatur',
    category: 'Rohre',
    formula: 'c(T) \\approx 331.4 + 0.6 \\cdot T_C \\quad \\left[\\text{m/s}\\right]',
    description: 'Näherungsformel für die Schallgeschwindigkeit in Luft in Abhängigkeit von der Celsius-Temperatur $T_C$.',
    recipe: '1. Bei $0^\\circ$C beträgt $c \\approx 331.4$ m/s.\n2. Pro Kelvin/Grad Erwärmung steigt die Schallgeschwindigkeit um ca. $0.6$ m/s.\n3. Beispiel: Bei $20^\\circ$C: $c = 331.4 + 0.6 \\cdot 20 = 343.4$ m/s.',
    youtube: 'https://www.youtube.com/results?search_query=schallgeschwindigkeit+temperatur',
    defaultNotes: 'Entscheidend für das Verstimmen von Orgelpfeifen im Sommer vs. Winter.'
  },
  
  'standing_waves': {
    id: 'standing_waves',
    title: 'Stehende Wellen in Rohren',
    category: 'Rohre',
    formula: '\\text{Beidseitig offen: } f_n = n \\frac{c}{2L} \\quad | \\quad \\text{Einseitig geschlossen: } f_n = (2n-1) \\frac{c}{4L}',
    description: 'Eigenfrequenzen stehender Wellen in Rohren. $L$ ist die Rohrlänge, $c$ die Schallgeschwindigkeit und $n = 1, 2, 3...$ die Ordnung der Schwingung.',
    recipe: '1. Offenes Ende erzeugt Druckknoten (Schnellemaximum).\n2. Geschlossenes Ende erzeugt Druckmaximum (Schnelleknoten).\n3. Einseitig geschlossene Rohre haben nur ungerade Oberwellen ($2n-1$) und sind bei gleicher Länge halb so hoch gestimmt wie offene.',
    youtube: 'https://www.youtube.com/results?search_query=stehende+wellen+orgelpfeife',
    defaultNotes: 'Die Wellenlängen betragen 2L/n (offen) bzw. 4L/(2n-1) (einseitig geschlossen).'
  },
  
  'end_correction': {
    id: 'end_correction',
    title: 'Mündungskorrektur',
    category: 'Rohre',
    formula: 'L_{eff} = L_{geo} + \\Delta L \\quad | \\quad \\Delta L \\approx 0.6 \\cdot r \\quad (\\text{einzelnes offenes Ende})',
    description: 'Die effektive akustische Länge eines Rohres ist größer als seine geometrische Länge, da die Reflexion knapp außerhalb der Öffnung stattfindet.',
    recipe: '1. Akustisch wirksame Länge $L_{eff}$ ermitteln.\n2. Pro offenem Ende $\\Delta L = 0.6 \\cdot r$ addieren. Bei einem beidseitig offenen Rohr gilt: $L_{eff} = L_{geo} + 1.2 \\cdot r$.\n3. Verwende $L_{eff}$ statt $L_{geo}$ in den Frequenzformeln.',
    youtube: 'https://www.youtube.com/results?search_query=mündungskorrektur+akustik',
    defaultNotes: 'Erklärt, warum Musikinstrumente (z.B. Flöten) stets etwas tiefer klingen als geometrisch berechnet.'
  },
  
  'rms_value': {
    id: 'rms_value',
    title: 'Effektivwert (RMS) & Leistung',
    category: 'Grundlagen',
    formula: 'U_{eff} = \\sqrt{\\frac{1}{T}\\int_0^T u(t)^2 dt} \\quad | \\quad P = \\frac{U_{eff}^2}{R}',
    description: 'Der Effektivwert (Root Mean Square) entspricht der Gleichspannung, die an einem ohmschen Widerstand $R$ dieselbe mittlere Leistung $P$ erbringt.',
    recipe: '1. Periode $T$ der periodischen Spannung $u(t)$ bestimmen.\n2. Integral $\\int_0^T u(t)^2 dt$ abschnittsweise berechnen.\n3. Durch $T$ teilen und Quadratwurzel ziehen, um $U_{eff}$ zu erhalten. Für mittlere Leistung durch $R$ teilen.',
    youtube: 'https://www.youtube.com/results?search_query=effektivwert+berechnen+integral',
    defaultNotes: 'Wichtig für die Bestimmung der Leistung von unregelmäßigen Wellenformen.'
  }
};
