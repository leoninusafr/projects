// Infinite Physics Task Generator for Physics 2 (Physikalische Akustik)

const randChoice = (list) => list[Math.floor(Math.random() * list.length)];
const randRange = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const roundTo = (num, decimals) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

export const GENERATOR_DB = {
  spring_pendulum_calc: {
    id: 'spring_pendulum_calc',
    title: 'Federpendel Berechnen',
    description: 'Berechne Kreisfrequenz und Frequenz eines Federpendels bei variierenden Parametern.',
    generate() {
      const m = roundTo(randRange(0.2, 4.0), 2); // kg
      const D = randInt(20, 400); // N/m
      
      const w0 = Math.sqrt(D / m);
      const f0 = w0 / (2 * Math.PI);
      
      return {
        type: 'multi-field',
        instruction: `Gegeben ist ein ungedämpftes Federpendel auf der Erde mit:<br>
                      - Masse der Kugel: $m = ${m.toString().replace('.', ',')}\\text{ kg}$<br>
                      - Federkonstante: $D = ${D}\\text{ N/m}$<br><br>
                      Berechne die Eigenkreisfrequenz $\\omega_0$ und die Schwingungsfrequenz $f_0$.`,
        fields: [
          { id: 'w0', label: 'Kreisfrequenz $\\omega_0$ (in rad/s, auf 2 Dezimalstellen gerundet):', placeholder: 'z.B. 14.14', correct: roundTo(w0, 2).toString() },
          { id: 'f0', label: 'Frequenz $f_0$ (in Hz, auf 2 Dezimalstellen gerundet):', placeholder: 'z.B. 2.25', correct: roundTo(f0, 2).toString() }
        ],
        solution: {
          intuition: 'Die Steifigkeit der Feder treibt die Masse an. Mehr Federkraft (größeres D) beschleunigt das System, mehr Trägheit (größere Masse m) bremst es aus.',
          redThread: '1. Kreisfrequenz über $\\omega_0 = \\sqrt{D/m}$ berechnen.\\n2. Frequenz über $f_0 = \\omega_0 / 2\\pi$ berechnen.',
          calculation: `Gegeben: $m = ${m.toString().replace('.', ',')}\\,\\text{kg}$ und $D = ${D}\\,\\text{N/m}$.\\n\\n` +
                       `1. Eigenkreisfrequenz:\\n` +
                       `$$\\omega_0 = \\sqrt{\\frac{D}{m}} = \\sqrt{\\frac{${D}}{${m}}} = \\sqrt{${roundTo(D/m, 4)}} \\approx ${roundTo(w0, 2).toString().replace('.', ',')}\\,\\text{rad/s}$$\\n` +
                       `2. Schwingungsfrequenz:\\n` +
                       `$$f_0 = \\frac{\\omega_0}{2\\pi} = \\frac{${roundTo(w0, 4).toString().replace('.', ',')}}{2\\pi} \\approx ${roundTo(f0, 2).toString().replace('.', ',')}\\,\\text{Hz}$$`
        }
      };
    }
  },

  pipe_temp_calc: {
    id: 'pipe_temp_calc',
    title: 'Orgelpfeife Temperatureinfluss',
    description: 'Berechne die Frequenzänderung einer Orgelpfeife bei Temperaturwechseln.',
    generate() {
      const f1 = randInt(100, 800); // Hz
      const T1 = randInt(-10, 15); // °C (Winter)
      const T2 = randInt(20, 40); // °C (Sommer)
      
      const c1 = 331.4 + 0.6 * T1;
      const c2 = 331.4 + 0.6 * T2;
      const f2 = f1 * (c2 / c1);
      
      return {
        type: 'multi-field',
        instruction: `Eine Orgelpfeife erklingt im Winter bei einer Temperatur von $T_1 = ${T1}^\\circ\\text{C}$ mit der Frequenz $f_1 = ${f1}\\text{ Hz}$.<br>
                      Berechne die Frequenz $f_2$ im Hochsommer bei einer Lufttemperatur von $T_2 = ${T2}^\\circ\\text{C}$.<br>
                      (Verwende die Näherung $c(T) \\approx 331{,}4 + 0{,}6 \\cdot T_C$ für die Schallgeschwindigkeit).`,
        fields: [
          { id: 'c1', label: 'Schallgeschwindigkeit c1 bei T1 (in m/s, auf 1 Dezimalstelle gerundet):', placeholder: 'z.B. 334.4', correct: roundTo(c1, 1).toString() },
          { id: 'c2', label: 'Schallgeschwindigkeit c2 bei T2 (in m/s, auf 1 Dezimalstelle gerundet):', placeholder: 'z.B. 349.4', correct: roundTo(c2, 1).toString() },
          { id: 'f2', label: 'Neue Frequenz f2 (in Hz, ganzzahlig gerundet):', placeholder: 'z.B. 456', correct: Math.round(f2).toString() }
        ],
        solution: {
          intuition: 'Durch Erwärmung sinkt die Dichte der Luft, wodurch die Schallwellen schneller laufen. Bei unveränderter Länge der Pfeife muss der Ton höher klingen.',
          redThread: '1. Schallgeschwindigkeiten $c_1$ und $c_2$ berechnen.\\n2. Da $\\lambda$ konstant bleibt, die Verhältnisformel $f_2 = f_1 \\cdot (c_2 / c_1)$ anwenden.',
          calculation: `1. Schallgeschwindigkeit bei $T_1 = ${T1}^\\circ\\text{C}$:\\n` +
                       `$$c_1 = 331{,}4 + 0{,}6 \\cdot T_1 = 331{,}4 + 0{,}6 \\cdot (${T1}) = ${roundTo(c1, 1).toString().replace('.', ',')}\\,\\text{m/s}$$\\n` +
                       `2. Schallgeschwindigkeit bei $T_2 = ${T2}^\\circ\\text{C}$:\\n` +
                       `$$c_2 = 331{,}4 + 0{,}6 \\cdot T_2 = 331{,}4 + 0{,}6 \\cdot ${T2} = ${roundTo(c2, 1).toString().replace('.', ',')}\\,\\text{m/s}$$\\n` +
                       `3. Neue Frequenz:\\n` +
                       `$$f_2 = f_1 \\cdot \\frac{c_2}{c_1} = ${f1} \\cdot \\frac{${roundTo(c2, 1)}}{${roundTo(c1, 1)}} \\approx ${roundTo(f2, 2).toString().replace('.', ',')}\\,\\text{Hz} \\\\rightarrow ${Math.round(f2)}\\,\\text{Hz}$$`
        }
      };
    }
  },

  spherical_wave_calc: {
    id: 'spherical_wave_calc',
    title: 'Kugelwellen-Abstandsgesetz',
    description: 'Berechne Schalldruck und Intensität einer Kugelwelle in verschiedenen Abständen.',
    generate() {
      const r1 = randInt(1, 5); // m
      const r2 = r1 * randChoice([2, 3, 4, 5, 8]); // m (multiple of r1 for nice calculations)
      const p1 = roundTo(randRange(0.2, 5.0), 2); // Pa
      
      const factor = r2 / r1;
      const p2 = p1 / factor;
      const I_drop = factor * factor; // Intensity drops by factor^2
      
      return {
        type: 'multi-field',
        instruction: `Im Freifeld breitet sich eine ideale Schallkugelwelle aus. In einem Abstand von $r_1 = ${r1}\\text{ m}$ zur Quelle wird ein Schalldruck von $p_1 = ${p1.toString().replace('.', ',')}\\text{ Pa}$ gemessen.<br>
                      Berechne den Schalldruck $p_2$ in einem Abstand von $r_2 = ${r2}\\text{ m}$. Wie stark (um welchen Faktor) fällt die Schallintensität $I$ im Vergleich zu $I_1$ ab?`,
        fields: [
          { id: 'p2', label: 'Schalldruck p2 (in Pa, auf 3 Dezimalstellen gerundet):', placeholder: 'z.B. 0.25', correct: roundTo(p2, 3).toString() },
          { id: 'i_drop', label: 'Abfallfaktor der Schallintensität (I1 / I2):', placeholder: 'z.B. 16', correct: I_drop.toString() }
        ],
        solution: {
          intuition: 'Der Schalldruck sinkt umgekehrt proportional zum Abstand ($1/r$). Die Intensität (Energie pro Fläche) sinkt quadratisch ($1/r^2$), weil sich die Energie auf eine Kugeloberfläche ($4\\pi r^2$) verteilt.',
          redThread: '1. Schalldruck über $p_2 = p_1 \\cdot (r_1 / r_2)$ berechnen.\\n2. Intensitätsabfall über $(r_2 / r_1)^2$ ermitteln.',
          calculation: `Gegeben: $r_1 = ${r1}\\,\\text{m}$, $r_2 = ${r2}\\,\\text{m}$ (Faktor $r_2/r_1 = ${factor}$) und $p_1 = ${p1.toString().replace('.', ',')}\\,\\text{Pa}$.\\n\\n` +
                       `1. Schalldruck am Punkt 2:\\n` +
                       `$$p_2 = p_1 \\cdot \\frac{r_1}{r_2} = ${p1.toString().replace('.', ',')} \\cdot \\frac{${r1}}{${r2}} = \\frac{${p1.toString().replace('.', ',')}}{${factor}} \\approx ${roundTo(p2, 3).toString().replace('.', ',')}\\,\\text{Pa}$$\\n` +
                       `2. Intensitätsverlauf:\\n` +
                       `Da $I \\propto p^2 \\propto \\frac{1}{r^2}$ gilt:\\n` +
                       `$$\\frac{I_1}{I_2} = \\left(\\frac{r_2}{r_1}\\right)^2 = ${factor}^2 = ${I_drop}$$\\n` +
                       `Die Intensität sinkt folglich auf das $1/${I_drop}$-fache (Abfallfaktor ${I_drop}).`
        }
      };
    }
  },

  end_correction_calc: {
    id: 'end_correction_calc',
    title: 'Mündungskorrektur & Resonanz',
    description: 'Berechne die akustisch wirksame Länge und Grundfrequenz von Rohren unter Berücksichtigung des Rohrrands.',
    generate() {
      const L = roundTo(randRange(0.3, 1.5), 2); // m
      const r_cm = randInt(2, 8); // cm
      const r = r_cm / 100; // m
      const type = randChoice(['offen', 'geschlossen']); // beidseitig offen oder einseitig geschlossen
      
      const c = 343; // m/s
      let Leff, f1;
      let dL_desc, type_desc, formula_desc;
      
      if (type === 'offen') {
        Leff = L + 1.2 * r;
        f1 = c / (2 * Leff);
        type_desc = 'beidseitig offenes Rohr';
        dL_desc = '$$L_{eff} = L_{geo} + 2 \\cdot \\Delta L = L_{geo} + 1{,}2 \\cdot r$$';
        formula_desc = '$$f_1 = \\frac{c}{2 \\cdot L_{eff}}$$';
      } else {
        Leff = L + 0.6 * r;
        f1 = c / (4 * Leff);
        type_desc = 'einseitig geschlossenes Rohr';
        dL_desc = '$$L_{eff} = L_{geo} + \\Delta L = L_{geo} + 0{,}6 \\cdot r$$';
        formula_desc = '$$f_1 = \\frac{c}{4 \\cdot L_{eff}}$$';
      }
      
      return {
        type: 'multi-field',
        instruction: `Ein zylindrisches, <strong>${type_desc}</strong> hat eine geometrische Länge von $L = ${L.toString().replace('.', ',')}\\text{ m}$ und einen Radius von $r = ${r_cm}\\text{ cm}$ ($${r.toString().replace('.', ',')}\\text{ m}$).<br>
                      Berechne die akustisch wirksame Länge $L_{eff}$ und die Grundfrequenz $f_1$ bei einer Schallgeschwindigkeit von $c = 343\\text{ m/s}$ unter Berücksichtigung der Mündungskorrektur.`,
        fields: [
          { id: 'leff', label: 'Effektive Länge Leff (in m, auf 3 Dezimalstellen gerundet):', placeholder: 'z.B. 0.854', correct: roundTo(Leff, 3).toString() },
          { id: 'f1', label: 'Grundfrequenz f1 (in Hz, auf 1 Dezimalstelle gerundet):', placeholder: 'z.B. 200.8', correct: roundTo(f1, 1).toString() }
        ],
        solution: {
          intuition: 'Am offenen Ende endet das Mitschwingen der Luftteilchen nicht abrupt. Sie greifen etwas in den Außenraum aus, wodurch das Rohr akustisch länger wird.',
          redThread: `1. Bestimme die effektive Länge $L_{eff}$ unter Addition von $0{,}6 \\cdot r$ pro offenem Ende.\\n2. Berechne $f_1$ für den Rohrtyp (${type === 'offen' ? 'offen: c/(2Leff)' : 'geschlossen: c/(4Leff)'}).`,
          calculation: `Gegeben: $L = ${L.toString().replace('.', ',')}\\,\\text{m}$, $r = ${r.toString().replace('.', ',')}\\,\\text{m}$, $c = 343\\,\\text{m/s}$.\\n\\n` +
                       `1. Berechnung der effektiven Länge $L_{eff}$ (${type_desc}):\\n` +
                       `${dL_desc}\\n` +
                       `$$L_{eff} = ${L.toString().replace('.', ',')} + ${type === 'offen' ? '1{,}2 \\cdot ' + r.toString().replace('.', ',') : '0{,}6 \\cdot ' + r.toString().replace('.', ',')} = ${roundTo(Leff, 4).toString().replace('.', ',')}\\,\\text{m} \\\\approx ${roundTo(Leff, 3).toString().replace('.', ',')}\\,\\text{m}$$\\n` +
                       `2. Berechnung der Grundfrequenz:\\n` +
                       `${formula_desc}\\n` +
                       `$$f_1 = \\frac{343}{${type === 'offen' ? '2 \\cdot ' + roundTo(Leff, 4).toString() : '4 \\cdot ' + roundTo(Leff, 4).toString()}} \\approx ${roundTo(f1, 1).toString().replace('.', ',')}\\,\\text{Hz}$$`
        }
      };
    }
  },

  rms_value_calc: {
    id: 'rms_value_calc',
    title: 'Effektivwert (RMS) bestimmen',
    description: 'Berechne den Effektivwert und die mittlere Wirkleistung für vereinfachte Wellenformen.',
    generate() {
      // We will generate a symmetrical rectangular wave with duty cycle or a triangular pulse
      const type = randChoice(['sinus', 'dreieck', 'rechteck_50', 'rechteck_25']);
      const u_max = randChoice([10, 12, 15, 20, 24]); // V
      const R = randChoice([100, 200, 500, 1000]); // Ohm
      
      let u_eff, formula_tex, u_eff_desc;
      let name;
      
      if (type === 'sinus') {
        name = 'Sinusförmige Wechselspannung';
        u_eff = u_max / Math.sqrt(2);
        formula_tex = '$$U_{eff} = \\frac{U_{max}}{\\sqrt{2}}$$';
        u_eff_desc = `$$\\\\frac{${u_max}}{\\\\sqrt{2}} \\\\approx ${roundTo(u_eff, 2).toString().replace('.', ',')}\\,\\\\text{V}$$`;
      } else if (type === 'dreieck') {
        name = 'Symmetrische Dreiecksspannung';
        u_eff = u_max / Math.sqrt(3);
        formula_tex = '$$U_{eff} = \\frac{U_{max}}{\\sqrt{3}}$$';
        u_eff_desc = `$$\\\\frac{${u_max}}{\\\\sqrt{3}} \\\\approx ${roundTo(u_eff, 2).toString().replace('.', ',')}\\,\\\\text{V}$$`;
      } else if (type === 'rechteck_50') {
        name = 'Rechteckpuls (Tastgrad D = 50%, symmetrisch)';
        u_eff = u_max; // since u(t)^2 is always u_max^2 (if bipolar) or u_max/sqrt(2) if unipolar.
        // Let's assume unipolar: 0 to T/2 has u_max, T/2 to T has 0.
        u_eff = u_max * Math.sqrt(0.5);
        formula_tex = '$$U_{eff} = U_{max} \\cdot \\sqrt{D} = U_{max} \\cdot \\sqrt{0{,}5}$$';
        u_eff_desc = `$$${u_max} \\\\cdot \\\\sqrt{0{,}5} \\\\approx ${roundTo(u_eff, 2).toString().replace('.', ',')}\\,\\\\text{V}$$`;
      } else {
        name = 'Rechteckpuls (Tastgrad D = 25%, unipolar)';
        u_eff = u_max * Math.sqrt(0.25); // u_max * 0.5
        formula_tex = '$$U_{eff} = U_{max} \\cdot \\sqrt{D} = U_{max} \\cdot 0{,}5$$';
        u_eff_desc = `$$${u_max} \\\\cdot 0{,}5 = ${roundTo(u_eff, 2).toString().replace('.', ',')}\\,\\\\text{V}$$`;
      }
      
      const P = (u_eff * u_eff) / R;
      
      return {
        type: 'multi-field',
        instruction: `Eine periodische Spannung $u(t)$ der Form <strong>${name}</strong> mit Scheitelwert (Peak) $U_{max} = ${u_max}\\text{ V}$ liegt an einem Widerstand $R = ${R}\\text{ }\\Omega$ an.<br>
                      Berechne den Effektivwert $U_{eff}$ der Spannung und die mittlere Leistung $P$, die am Widerstand abfällt.`,
        fields: [
          { id: 'ueff', label: 'Effektivwert Ueff (in V, auf 2 Dezimalstellen gerundet):', placeholder: 'z.B. 8.49', correct: roundTo(u_eff, 2).toString() },
          { id: 'pow', label: 'Mittlere Wirkleistung P (in W, auf 3 Dezimalstellen gerundet):', placeholder: 'z.B. 0.072', correct: roundTo(P, 3).toString() }
        ],
        solution: {
          intuition: 'Der Effektivwert RMS entspricht der thermisch wirksamen Gleichspannung. Bei komplexeren Formen hängt er vom Formfaktor oder Tastgrad ab.',
          redThread: `1. Wähle die Effektivwertformel für den Signal-Typ (${name}).\\n2. Setze $U_{max}$ ein, um $U_{eff}$ zu bestimmen.\\n3. Berechne die Leistung mit $P = U_{eff}^2 / R$.`,
          calculation: `Gegeben: Signaltyp = ${name}, $U_{max} = ${u_max}\\,\\text{V}$, $R = ${R}\\,\\Omega$.\\n\\n` +
                       `1. Berechnung des Effektivwerts $U_{eff}$:\\n` +
                       `${formula_tex}\\n` +
                       `${u_eff_desc}\\n` +
                       `2. Berechnung der Leistung:\\n` +
                       `$$P = \\frac{U_{eff}^2}{R} = \\frac{(${roundTo(u_eff, 4).toString()})^2}{${R}} = \\frac{${roundTo(u_eff*u_eff, 3).toString().replace('.', ',')}}{${R}} \\approx ${roundTo(P, 3).toString().replace('.', ',')}\\,\\text{W}$$`
        }
      };
    }
  }
};
