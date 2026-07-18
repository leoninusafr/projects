/* LernHub — Quiz-Engine
 * Statische App, kein Build-Schritt. Persistenz über austauschbares Store-Modul.
 */
(function () {
  "use strict";

  const MODULES = [window.MODULE_VT2, window.MODULE_PHYS2].filter(Boolean);

  const STORE_KEY = "lernhub.progress.v1";
  const EXACT_KEY = "lernhub.exact.v1";
  const THEME_KEY = "lernhub.theme.v1";
  const NOTES_KEY = "lernhub.notes.v1";
  const RESUME_KEY = "lernhub.resume.v1";

  /* ---------- Store (Persistenz, später Supabase) ---------- */
  const Store = {
    // Lokaler Default. Ersetzbar durch connectSupabase().
    read() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
      catch { return {}; }
    },
    write(p) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch {}
    },
    readExact() {
      try { return JSON.parse(localStorage.getItem(EXACT_KEY)) || {}; }
      catch { return {}; }
    },
    writeExact(e) {
      try { localStorage.setItem(EXACT_KEY, JSON.stringify(e)); } catch {}
    },
    readNotes() {
      try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; }
      catch { return {}; }
    },
    writeNotes(n) {
      try { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); } catch {}
    }
  };

  // Später: Store = SupabaseStore(url, anonKey) — gleiche Methoden.
  // Fertiges Schema liegt in migrations/ (KAST-Supabase). Hier erstmal lokal.

  let progress = Store.read();
  let exact = Store.readExact();
  let notes = Store.readNotes();

  function qKey(modId, idx) { return modId + ":" + idx; }
  function noteKey(modId, idx) { return modId + ":" + idx; }
  function getNote(modId, idx) { return notes[noteKey(modId, idx)] || ""; }
  function setNote(modId, idx, val) {
    const k = noteKey(modId, idx);
    if (val && val.trim()) notes[k] = val;
    else delete notes[k];
    Store.writeNotes(notes);
  }
  function recordAttempt(modId, idx, correct, selfCheck) {
    const k = qKey(modId, idx);
    const p = progress[k] || { seen: 0, correct: 0, wrong: 0, lastOk: false };
    p.seen += 1;
    // Self-Check: als "gesehen" werten, aber NICHT als sicher/z richtig verbuchen
    // (der User bewertet selbst — wir wissen nicht, ob's stimmt).
    if (selfCheck) { p.lastOk = false; }
    else if (correct) { p.correct += 1; p.lastOk = true; }
    else { p.wrong += 1; p.lastOk = false; }
    progress[k] = p;
    Store.write(progress);
  }

  /* ---------- Utils ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  function tpl(id) { return document.getElementById(id).content.cloneNode(true); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // `code` -> <code>, {{key}} bleibt für Werte-Einsetzung
  function fmt(text) {
    let s = esc(text);
    // Inline-Code `code`
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    // LaTeX \\( ... \\) und $ ... $
    s = s.replace(/\\\(([\s\S]+?)\\\)/g, (m, tex) => `<span class="tex">${tex}</span>`);
    s = s.replace(/(^|[^\\$])\$([^$\n]+?)\$(?!\d)/g, (m, pre, tex) => `${pre}<span class="tex">${tex}</span>`);
    // **bold** und *italic* (Markdown)
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // Zeilenumbrüche erhalten
    s = s.replace(/\n/g, "<br>");
    return s;
  }
  // KaTeX anwenden auf alle .tex-Spans im app-Container
  function renderMath() {
    if (typeof katex === "undefined") {
      // KaTeX noch nicht geladen (defer) — erneut versuchen
      setTimeout(renderMath, 60);
      return;
    }
    document.querySelectorAll("#app .tex").forEach(el => {
      if (el.dataset.rendered) return;
      try { katex.render(el.textContent, el, { throwOnError: false, displayMode: false }); el.dataset.rendered = "1"; }
      catch { /* leise */ }
    });
  }
  function icon(id, cls) {
    return `<svg class="${cls || "icon"}"><use href="#${id}"/></svg>`;
  }
  function fmtNum(n) {
    if (!isFinite(n)) return String(n);
    const r = Math.round(n * 1000) / 1000;
    return String(r);
  }

  /* ---------- Variation ---------- */
  // Ersetzt {{key}} im Text durch formatierte Werte.
  function substitute(str, vals) {
    return str.replace(/\{\{(\w+)\}\}/g, (m, k) =>
      vals && vals[k] != null ? fmtNum(vals[k]) : m);
  }
  // Seedable PRNG (mulberry32) -> reproduzierbare Sitzung pro Aufgabe.
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // Liefert die aktiven Werte einer Aufgabe (exakt oder leicht abgewandelt).
  function resolveValues(q, useExact) {
    const base = q.values || {};
    if (useExact || !q.values) {
      const out = {};
      for (const k in base) out[k] = base[k].v;
      return out;
    }
    const seed = hashStr(q.id + ":v");
    const rng = mulberry32(seed);
    const out = {};
    for (const k in base) {
      const def = base[k];
      if (def.variants && def.variants.length) {
        // zufällige Variante, aber nicht identisch mit Basis
        let pick = def.v;
        if (def.variants.length > 1) {
          const opts = def.variants.filter(v => v !== def.v);
          pick = opts[Math.floor(rng() * opts.length)] ?? def.v;
        } else pick = def.v;
        out[k] = pick;
      } else {
        out[k] = def.v;
      }
    }
    return out;
  }

  /* ---------- Bewertung ---------- */
  function checkNumeric(val, q, vals) {
    if (val === null || isNaN(val)) return false;
    const ans = q.compute(vals);
    const tol = q.tolerance != null ? q.tolerance : Math.max(1e-6, Math.abs(ans) * 0.02);
    return Math.abs(val - ans) <= tol;
  }
  function checkChoice(sel, q) {
    const correct = Array.isArray(q.correct) ? q.correct : [q.correct];
    if (sel.length !== correct.length) return false;
    const s = new Set(sel), c = new Set(correct);
    for (const x of c) if (!s.has(x)) return false;
    return true;
  }

  // Text-Bewertung mit Tippfehler-Toleranz (Levenshtein).
  // Erkennt: exakt richtig / fast richtig (Tippfehler) / falsch.
  function normText(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFKD").replace(/[̀-ͯ]/g, "") // Akzente weg
      .replace(/[­­­­­­­­­­]/g, "") // Soft-Hyphens
      .replace(/[­­­­­­­­­­]/g, "") // Zero-Width
      .replace(/[­­­­­­­­­­]/g, "") // BOM
      .replace(/[­­­­­­­­­­]/g, "") // Zero-Width-Space
      .replace(/[­­­­­­­­­­]/g, "") // Non-Joiner
      .replace(/[()[\]{}]/g, " ")     // Klammern -> Leerzeichen (damit "RLE)" nicht klebt)
      .replace(/[-–—_.]/g, "")        // Bindestriche/Unterstrich/Punkt entfernen (DVB-S == DVBS)
      .replace(/\s+/g, " ")            // Mehrfachspaces
      .trim();
  }
  function lev(a, b) {
    a = a || ""; b = b || "";
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = [...Array(n + 1).keys()];
    for (let i = 1; i <= m; i++) {
      let cur = [i];
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[n];
  }
  function gradeText(input, solution, answers, required, accept) {
    const u = normText(input);
    if (!u) return { correct: false, near: false, reason: "empty" };
    const s = normText(solution);
    if (!s && (!answers || !answers.length) && (!accept || !accept.length))
      return { correct: false, near: false, reason: "no-key", selfCheck: true };

    // 1) accept-Liste: EINE akzeptierte Voll-Antwort reicht (Synonyme/Varianten).
    //    z.B. LCD -> ["liquid crystal display", "flüssigkristallbildschirm"].
    if (accept && accept.length) {
      for (const a of accept) {
        const na = normText(a);
        if (!na) continue;
        if (u === na) return { correct: true, near: false, reason: "exact" };
        // Teilstring-Treffer (User schreibt mehr/weniger drumherum)
        if (u.includes(na) || na.includes(u)) return { correct: true, near: false, reason: "exact" };
        const d = lev(u, na);
        if (d <= 3 && d / Math.max(u.length, na.length) <= 0.2)
          return { correct: true, near: true, reason: "typo", dist: d };
      }
      // nichts getroffen → falsch, mit Hinweis auf akzeptierte Varianten
      return { correct: false, near: false, reason: "wrong", accepted: accept };
    }

    // 2) Aufzählung mit vorgegebenen Begriffen (answers) — nur required nötig.
    if (answers && answers.length) {
      const sWords = answers.map(a => normText(a)).filter(Boolean);
      const uWords = u.split(/[\s,/;]+/).filter(Boolean);
      const usedS = new Set();
      const wrong = [];
      let matched = 0;
      for (const w of uWords) {
        let best = -1, bestD = 99;
        sWords.forEach((sw, i) => {
          if (usedS.has(i)) return;
          const d = lev(w, sw);
          const tol = sw.length <= 4 ? 0 : (sw.length > 7 ? 3 : 2);
          const ok = (w === sw) || (tol > 0 && d <= tol && d / Math.max(w.length, sw.length) <= 0.3);
          if (ok && d < bestD) { best = i; bestD = d; }
        });
        if (best >= 0) { usedS.add(best); matched++; }
        else wrong.push(w);
      }
      const missing = sWords.filter((_, i) => !usedS.has(i));
      const need = (typeof required === "number" && required > 0) ? required : sWords.length;
      const allRight = matched >= need && wrong.length === 0;
      const incomplete = wrong.length === 0 && matched < need;
      return {
        correct: allRight, near: false, list: true,
        matched, total: need, wrong, missing,
        reason: allRight ? "exact" : (wrong.length ? "wrong-items" : "incomplete"),
        incomplete
      };
    }

    if (!s) return { correct: false, near: false, reason: "no-key", selfCheck: true };

    // 3) Freitext-Definition ohne feste Begriffsliste: Ähnlichkeit zur Lösung.
    //    Der User muss die Kernaussage treffen (nicht Wort-für-Wort, keine
    //    Synonyme/Klammer-Zusätze erzwungen).
    if (u === s) return { correct: true, near: false, reason: "exact" };
    // Wenn die Nutzerantwort als Teilstring in der Lösung steckt (oder umgekehrt)
    // und mindestens 4 Zeichen hat → als Treffer werten.
    if (u.length >= 4 && (s.includes(u) || u.includes(s)))
      return { correct: true, near: false, reason: "exact" };
    // Wortweise: wie viele Lösungswörter (>=3 Zeichen) kommen vor?
    const sTokens = s.split(/[\s,/;]+/).filter(t => t.length >= 3);
    const uTokens = u.split(/[\s,/;]+/).filter(Boolean);
    if (sTokens.length) {
      let hit = 0;
      for (const st of sTokens) {
        if (uTokens.some(ut => ut === st || (lev(ut, st) <= 2 && lev(ut, st) / Math.max(ut.length, st.length) <= 0.3)))
          hit++;
      }
      const frac = hit / sTokens.length;
      // Kernbegriffe getroffen → richtig; teilweise → fast
      if (frac >= 0.6) return { correct: true, near: frac < 1, reason: frac < 1 ? "typo" : "exact" };
      if (frac >= 0.35) return { correct: false, near: false, reason: "partial", matched: hit, total: sTokens.length };
    }
    const d = lev(u, s);
    const ratio = d / Math.max(u.length, s.length);
    if (ratio <= 0.18 && d <= 3) return { correct: true, near: true, reason: "typo", dist: d };
    return { correct: false, near: false, reason: "wrong", dist: d };
  }

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const ti = $("#themeIcon"); if (ti) ti.innerHTML = `<use href="#${t === "dark" ? "i-sun" : "i-moon"}"/>`;
  }
  function initTheme() {
    let t = localStorage.getItem(THEME_KEY);
    if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(t);
    const tt = $("#themeToggle");
    if (tt) tt.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* ---------- Ehrlicher Motivations-Ton ---------- */
  function praiseFor(pct, total) {
    if (total === 0) return "Noch keine Aufgaben.";
    if (pct >= 90) return "Solide. Das sitzt.";
    if (pct >= 70) return "Guter Stand. Die letzten Lücken schließt du schnell.";
    if (pct >= 50) return "Die Hälfte steht. Weiter so, die Rechnung geht ins Fleisch.";
    if (pct >= 25) return "Geschäftsgrundlage da. Jetzt die wiederholen, die du noch nicht sicher hast.";
    if (pct > 0) return "Gestartet. Lieber jetzt üben als in der Klausur.";
    return "Noch nichts gelaufen. Erstes Durchgehen zählt mehr als die Quote.";
  }

  /* ---------- Navigation ---------- */
  function goHome() { renderHome(); }
  function goModule(modId) { renderModule(modId); }

  function moduleProgress(mod) {
    const cnt = mod.questions.length;
    let seen = 0, done = 0;
    mod.questions.forEach((_, i) => {
      const p = progress[qKey(mod.id, i)];
      if (p && p.seen) seen++;
      if (p && p.lastOk) done++;
    });
    return { cnt, seen, done, pct: cnt ? Math.round((done / cnt) * 100) : 0 };
  }

  function renderHome() {
    const node = tpl("tpl-home");
    const wrap = $(".cards", node);
    MODULES.forEach(mod => {
      const mp = moduleProgress(mod);
      const card = document.createElement("button");
      card.className = "mod-card";
      const iconId = mod.icon || "i-list";
      card.innerHTML = `
        <span class="mod-icon">${icon(iconId)}</span>
        <span class="mod-body">
          <h3>${esc(mod.title)}</h3>
          <p>${esc(mod.meta || "")}</p>
          <span class="mod-prog"><i style="width:${mp.pct}%"></i></span>
        </span>
        <span class="mod-meta">${mp.cnt ? mp.done + "/" + mp.cnt : "–"}</span>`;
      card.addEventListener("click", () => goModule(mod.id));
      wrap.appendChild(card);
    });
    app.replaceChildren(node);
    renderMath();
    updateFooter();
  }

  function renderModule(modId) {
    const mod = MODULES.find(m => m.id === modId);
    if (!mod) return goHome();
    const node = tpl("tpl-module");
    $("#modTitle", node).textContent = mod.title;
    $("#modMeta", node).textContent = mod.meta || "";

    node.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", goHome));

    const mp = moduleProgress(mod);
    $("#modStats", node).innerHTML = `
      <span class="stat-pill"><b>${mp.cnt}</b> Aufgaben</span>
      <span class="stat-pill"><b>${mp.seen}</b> bearbeitet</span>
      <span class="stat-pill"><b>${mp.done}</b> sicher</span>`;

    const exOn = !!exact[mod.id];
    const toggle = $("#exactToggle", node);
    toggle.checked = exOn;
    toggle.addEventListener("change", () => {
      exact[mod.id] = toggle.checked;
      Store.writeExact(exact);
    });

    node.querySelectorAll(".mode-card").forEach(btn => {
      btn.addEventListener("click", () => startQuiz(modId, btn.getAttribute("data-mode"), { fresh: true }));
    });

    app.replaceChildren(node);
    renderMath();
    updateFooter();
  }

  // Fisher-Yates In-Place-Shuffle
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Blockschlüssel aus der Aufgaben-ID: "vt2-2-7" -> "2", "vt2-3c-choice" -> "3",
  // "phys2-5c" -> "5". So bleiben Themenblöcke zusammen.
  function blockKey(q, fallbackIdx) {
    const m = (q.block != null) ? String(q.block)
      : (typeof q.id === "string" ? (q.id.match(/-(\d+)/) || [])[1] : null);
    return m != null ? m : "z" + fallbackIdx;
  }

  // Mischt Aufgaben blockweise: Reihenfolge der Blöcke gemischt +
  // Reihenfolge innerhalb jedes Blocks gemischt. Original-Blockstruktur bleibt.
  function shuffleBlocks(mod, idxs) {
    const groups = new Map();
    idxs.forEach(i => {
      const k = blockKey(mod.questions[i], i);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(i);
    });
    const blocks = shuffle([...groups.values()]);
    const out = [];
    blocks.forEach(b => shuffle(b).forEach(i => out.push(i)));
    return out;
  }

  function pickQuestions(mod, mode) {
    const idxs = mod.questions.map((_, i) => i);
    const exOn = !!exact[mod.id]; // Exakt-Modus = Originalreihenfolge (wie Klausur)
    let list;
    if (mode === "wrong") {
      const w = idxs.filter(i => { const p = progress[qKey(mod.id, i)]; return p && !p.lastOk; });
      list = w.length ? w : idxs.slice();
    } else if (mode === "unseen") {
      const u = idxs.filter(i => !((progress[qKey(mod.id, i)] || {}).seen));
      list = u.length ? u : idxs.slice();
    } else {
      list = idxs.slice();
    }
    // Ohne Exakt-Modus: blockweise mischen, damit man nicht die Reihenfolge lernt.
    return exOn ? list : shuffleBlocks(mod, list);
  }

  /* ---------- Quiz ---------- */
  let QUIZ = null;

  function saveResume() {
    if (!QUIZ) return;
    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify({
        modId: QUIZ.mod.id, mode: QUIZ.mode, list: QUIZ.list,
        pos: QUIZ.pos, score: QUIZ.score
      }));
    } catch {}
  }
  function loadResume(modId) {
    try {
      const r = JSON.parse(localStorage.getItem(RESUME_KEY));
      if (r && r.modId === modId && Array.isArray(r.list) && r.list.length) return r;
    } catch {}
    return null;
  }
  function clearResume() {
    try { localStorage.removeItem(RESUME_KEY); } catch {}
  }

  function startQuiz(modId, mode, opts) {
    const mod = MODULES.find(m => m.id === modId);
    let list, pos = 0, score = 0;
    // Fortsetzen? Wenn ein gespeicherter Durchlauf für dieses Mod existiert
    // und nicht explizit "neu" gewollt ist → den gemischten Stand wiederherstellen.
    if (!opts || !opts.fresh) {
      const r = loadResume(modId);
      if (r) { list = r.list; pos = r.pos; score = r.score || 0; mode = r.mode || mode; }
    }
    if (!list) {
      list = pickQuestions(mod, mode);
      if (!list.length) { goModule(modId); return; }
    }
    QUIZ = { mod, list, pos, score, mode };
    saveResume();
    renderQuestion();
  }

  function renderQuestion() {
    const { mod, list, pos } = QUIZ;
    const q = mod.questions[list[pos]];
    const useExact = !!exact[mod.id];
    const vals = resolveValues(q, useExact);

    // --- Read-only "Zurück"-Ansicht: Aufgabe nur ansehen + Lösung, kein erneutes Beantworten ---
    if (QUIZ.reviewMode) {
      const node = tpl("tpl-quiz");
      const qTop = $("#qTop", node);
      qTop.innerHTML = `
        <div class="q-top-left">
          <button class="link-btn" id="backBtn">${icon("i-back")} Zurück</button>
          <button class="link-btn" id="noteBtn">${icon("i-note")} Notiz</button>
        </div>`;
      $("#qCrumb", node).textContent = mod.title;
      $("#barFill", node).style.width = Math.round((pos / list.length) * 100) + "%";
      $("#qCount", node).textContent = (pos + 1) + " / " + list.length;

      const card = $("#quizCard", node);
      let html = `<div class="q-prompt">${fmt(substitute(q.prompt, vals))}</div>`;
      html += `<div class="ro-tag">Nur ansehen — du warst hier schon.</div>`;
      html += `<div id="fb"></div>`;
      card.innerHTML = html;

      // Notiz
      const noteWrap = document.createElement("div");
      noteWrap.className = "note-area";
      noteWrap.innerHTML = `<textarea id="noteArea" class="note-input" placeholder="Notiz zu dieser Aufgabe (bleibt gespeichert)…" rows="2">${esc(getNote(mod.id, list[pos]))}</textarea>`;
      card.appendChild(noteWrap);
      const noteArea = $("#noteArea", node);
      noteArea.addEventListener("input", () => setNote(mod.id, list[pos], noteArea.value));
      $("#noteBtn", node).addEventListener("click", () => noteArea.focus());
      $("#backBtn", node).addEventListener("click", () => { QUIZ.reviewMode = false; QUIZ.pos++; renderQuestion(); });

      // Lösung direkt anzeigen (wie nach dem Abgeben)
      const merged = Object.assign({}, vals, (typeof q.extra === "function" ? q.extra(vals) : {}));
      let body = "";
      if (q.solution) body += `**Lösung:** ${fmt(substitute(q.solution, merged))}\n\n`;
      if (q.explain) body += fmt(substitute(q.explain, merged));
      body = fmt(body);
      let fbHtml = `<div class="feedback self">${icon("i-eye")}<span>Schon bearbeitet — Lösung zur Kontrolle.</span></div>`;
      // Multiple-Choice/WF: richtige Boxen grün zeigen
      if (q.type === "choice" || q.type === "wf") {
        const correctSet = new Set(q.type === "wf" ? [q.correct ? 1 : 0] : (Array.isArray(q.correct) ? q.correct : [q.correct]));
        let ch = `<div class="choices">`;
        const opts = q.type === "wf" ? [{ t: "Wahr", i: 1 }, { t: "Falsch", i: 0 }] : q.choices.map((c, i) => ({ t: c, i }));
        opts.forEach(o => {
          const cls = "choice" + (correctSet.has(o.i) ? " is-correct" : "");
          ch += `<div class="${cls}"><span class="mark"></span><span>${fmt(o.t)}</span></div>`;
        });
        ch += `</div>`;
        fbHtml = ch + fbHtml;
      }
      fbHtml += `<details class="explain" open><summary>Warum — Lösungsweg</summary><div class="explain-body">${body}</div></details>`;
      fbHtml += `<div class="next-row"><button class="btn primary block" id="nextBtn">Weiter</button></div>`;
      $("#fb", node).innerHTML = fbHtml;
      $("#nextBtn", node).addEventListener("click", () => { QUIZ.reviewMode = false; QUIZ.pos++; renderQuestion(); });

      app.replaceChildren(node);
      renderMath();
      saveResume();
      return;
    }
    const node = tpl("tpl-quiz");
    const idx = list[pos];
    // q-top: Zurück (außer bei 1.) + Notiz
    const qTop = $("#qTop", node);
    qTop.innerHTML = `
      <div class="q-top-left">
        ${pos > 0 ? `<button class="link-btn" id="backBtn">${icon("i-back")} Zurück</button>` : `<span></span>`}
        <button class="link-btn" id="noteBtn">${icon("i-note")} Notiz</button>
      </div>`;
    $("#qCrumb", node).textContent = mod.title;
    $("#barFill", node).style.width = Math.round((pos / list.length) * 100) + "%";
    $("#qCount", node).textContent = (pos + 1) + " / " + list.length;

    const card = $("#quizCard", node);
    let html = `<div class="q-prompt">${fmt(substitute(q.prompt, vals))}</div>`;

    if (q.type === "numeric") {
      html += `<div class="q-input"><input id="ans" type="text" inputmode="decimal" placeholder="${esc(q.placeholder || "")}" autocomplete="off"><span class="q-unit">${esc(q.unit || "")}</span></div>`;
    } else if (q.type === "choice") {
      html += `<div class="choices" id="choices">`;
      q.choices.forEach((c, i) => {
        html += `<div class="choice${q.multiple ? " multi" : ""}" data-i="${i}"><span class="mark"></span><span>${fmt(c)}</span></div>`;
      });
      html += `</div>`;
    } else if (q.type === "text" || q.type === "short" || q.type === "huffman") {
      if (q.sketch) {
        html += `<div class="sketch-builder">
          <div class="sketch-bar"><span>Schaltbild-Baukasten:</span>
            <button type="button" class="chip" data-sk="src">Quelle A/B/C</button>
            <button type="button" class="chip" data-sk="mix">Mix-Effekt</button>
            <button type="button" class="chip" data-sk="key">Key-Layer</button>
            <button type="button" class="chip" data-sk="cross">Kreuzschiene</button>
            <button type="button" class="chip" data-sk="out">Ausgang</button>
            <button type="button" class="chip" data-sk="arrow">Pfeil ↓</button>
          </div>
          <textarea id="ans" class="sketch-area" placeholder="Schaltbild hier skizzieren (ASCII) — Bausteine oben einfügen oder selbst tippen…" rows="6"></textarea>
        </div>`;
      } else {
        html += `<div class="q-input"><input id="ans" type="text" placeholder="${esc(q.placeholder || "Antwort eintippen")}" autocomplete="off"></div>`;
      }
    } else if (q.type === "wf") {
      html += `<div class="choices" id="choices">
        <div class="choice" data-i="1"><span class="mark"></span><span>Wahr</span></div>
        <div class="choice" data-i="0"><span class="mark"></span><span>Falsch</span></div>
      </div>`;
    }

    html += `<button class="btn primary block" id="checkBtn" disabled>Aufgabe abgeben</button>`;
    html += `<div id="fb"></div>`;
    card.innerHTML = html;

    // Notiz-Bereich (bleibt sichtbar, wird pro Aufgabe gespeichert)
    const noteWrap = document.createElement("div");
    noteWrap.className = "note-area";
    noteWrap.innerHTML = `<textarea id="noteArea" class="note-input" placeholder="Notiz zu dieser Aufgabe (bleibt gespeichert)…" rows="2">${esc(getNote(mod.id, idx))}</textarea>`;
    card.appendChild(noteWrap);
    const noteArea = $("#noteArea", node);
    noteArea.addEventListener("input", () => setNote(mod.id, idx, noteArea.value));

    // Zurück-Button
    const backBtn = $("#backBtn", node);
    if (backBtn) backBtn.addEventListener("click", () => { QUIZ.pos--; QUIZ.reviewMode = true; renderQuestion(); });

    const checkBtn = $("#checkBtn", node);
    const sel = new Set();

    function submit() {
      if (checkBtn.disabled) return;
      doCheck();
    }

    if (q.type === "numeric" || q.type === "text" || q.type === "short" || q.type === "huffman") {
      const inp = $("#ans", node);
      if (inp) {
        inp.addEventListener("input", () => { checkBtn.disabled = inp.value.trim() === ""; });
        if (!q.sketch) inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
        // Schaltbild-Baukasten: Baustein-Klick fügt Snippet ein
        if (q.sketch) {
          const SKETCH = {
            src: "Quelle A ─┐\nQuelle B ─┤\nQuelle C ─┘\n",
            mix: "[ Mix-Effekt / ME-Bank ]\n",
            key: "[ Key-Layer (C über A+B) ]\n",
            cross: "[ Kreuzschiene: wählt 1 von N Eingängen ]\n",
            out: "══> Programm-Ausgang\n",
            arrow: "      ↓\n"
          };
          node.querySelectorAll(".chip").forEach(chip => {
            chip.addEventListener("click", () => {
              const snip = SKETCH[chip.getAttribute("data-sk")] || "";
              const start = inp.selectionStart || inp.value.length;
              const end = inp.selectionEnd || inp.value.length;
              inp.value = inp.value.slice(0, start) + snip + inp.value.slice(end);
              inp.focus();
              inp.selectionStart = inp.selectionEnd = start + snip.length;
              checkBtn.disabled = inp.value.trim() === "";
            });
          });
        }
      }
    } else if (q.type === "choice" || q.type === "wf") {
      card.querySelectorAll(".choice").forEach(ch => {
        ch.addEventListener("click", () => {
          const i = +ch.getAttribute("data-i");
          sel.clear(); sel.add(i);
          card.querySelectorAll(".choice").forEach(c => c.classList.remove("selected"));
          ch.classList.add("selected");
          checkBtn.disabled = sel.size === 0;
        });
      });
    }

    checkBtn.addEventListener("click", submit);

    function doCheck() {
      let correct, userVal;
      const ansEl = document.querySelector("#ans");
      const fbEl = document.querySelector("#fb");
      let g = {}; // Grade-Ergebnis (vor recordAttempt verfügbar)
      if (q.type === "numeric") {
        userVal = parseFloat(ansEl.value.replace(",", "."));
        correct = checkNumeric(userVal, q, vals);
      } else if (q.type === "choice") {
        userVal = [...sel].sort();
        correct = checkChoice([...sel], q);
      } else if (q.type === "wf") {
        userVal = [...sel][0];
        correct = (userVal === (q.correct ? 1 : 0));
      } else {
        // short / text / huffman: echte Bewertung mit Tippfehler-Toleranz
        userVal = ansEl ? ansEl.value : "";
        g = gradeText(userVal, q.solution || "", q.answers || null, q.required || 0, q.accept || null);
        if (q.selfCheck) g.selfCheck = true; // explizit als Selbst-Check markieren
        correct = g.correct;
        window.__grade = g; // für Feedback-Anzeige
      }

      recordAttempt(mod.id, list[pos], correct, g.selfCheck);
      if (correct) QUIZ.score++;

      const fb = fbEl;
      let fbIcon, fbCls, fbMsg;
      if (g.selfCheck) {
        // Keine Musterlösung hinterlegt → User bewertet selbst
        fbIcon = "i-check"; fbCls = "self"; fbMsg = "Selbst-Check — Lösung unten. Stimmt's? Dann als gelernt markieren.";
        correct = true; // für die Session als "bearbeitet" werten, aber ehrlich als Self-Check
      } else if (g.near) {
        fbIcon = "i-check"; fbCls = "good"; fbMsg = "Fast richtig — Tippfehler erkannt. So sitzt's.";
      } else if (correct) {
        fbIcon = "i-check"; fbCls = "good"; fbMsg = "Richtig.";
      } else {
        fbIcon = "i-x"; fbCls = "bad";
        if (q.type === "wf") fbMsg = "Falsch eingeschätzt.";
        else if (g.list && g.matched > 0) fbMsg = `Halb richtig — ${g.matched}/${g.total}. Schau dir den Rest an.`;
        else if (g.incomplete) fbMsg = "Zu wenig genannt.";
        else fbMsg = "Nicht ganz.";
      }
      let fbHtml = `<div class="feedback ${fbCls}">${icon(fbIcon)}<span>${fbMsg}</span></div>`;

      if (!correct && q.type === "numeric") {
        const ans = q.compute(vals);
        fbHtml += `<div class="feedback-note">Richtiges Ergebnis: <b>${fmtNum(ans)} ${esc(q.unit || "")}</b></div>`;
      }
      if (!correct && q.type === "choice") {
        const right = (Array.isArray(q.correct) ? q.correct : [q.correct]).map(i => fmt(q.choices[i])).join(q.multiple ? " + " : " / ");
        fbHtml += `<div class="feedback-note">Richtig wäre: <b>${right}</b></div>`;
      }
      if (!correct && q.type === "wf") {
        const richtig = q.correct ? "Wahr" : "Falsch";
        fbHtml += `<div class="feedback-note">Richtig ist: <b>${richtig}</b></div>`;
      }
      if (g.list && !g.correct) {
        const parts = [];
        parts.push(`<b>${g.matched}/${g.total}</b> richtig.`);
        if (g.wrong && g.wrong.length)
          parts.push(`Falsch: ${g.wrong.map(w => `<span class="tok-wrong">${esc(w)}</span>`).join(" ")}`);
        if (g.missing && g.missing.length)
          parts.push(`Fehlt: ${g.missing.map(w => `<span class="tok-missing">${esc(w)}</span>`).join(" ")}`);
        fbHtml += `<div class="feedback-note">${parts.join(" ")}</div>`;
        fbHtml += `<div class="feedback-note">Richtig wäre: <b>${esc(normText(q.solution || "").replace(/\s+/g, " "))}</b></div>`;
      }
      if (g.near) {
        fbHtml += `<div class="feedback-note">Gemeint war: <b>${esc(normText(q.solution || "").replace(/\s+/g, " "))}</b> — Schreibweise ist egal, Hauptsache der Begriff stimmt.</div>`;
      }
      if (g.selfCheck) {
        fbHtml += `<div class="feedback-note">Lösung / Erklärung unten — vergleich selbst.</div>`;
      }

      if (q.explain || q.solution) {
        const extraVals = typeof q.extra === "function" ? q.extra(vals) : {};
        const merged = Object.assign({}, vals, extraVals);
        let body = "";
        if (q.solution) body += `**Lösung:** ${fmt(substitute(q.solution, merged))}\n\n`;
        if (q.explain) body += fmt(substitute(q.explain, merged));
        body = fmt(body); // **bold** etc. erst am Ende rendern
        fbHtml += `<details class="explain" open><summary>Warum — Lösungsweg</summary><div class="explain-body">${body}</div></details>`;
      }

      const last = pos === list.length - 1;
      fbHtml += `<div class="next-row"><button class="btn ${last ? "ghost" : "primary"} block" id="nextBtn">${last ? "Auswertung" : "Weiter"}</button></div>`;
      fb.innerHTML = fbHtml;

      // sperren
      checkBtn.disabled = true;
      const inp = document.querySelector("#ans"); if (inp) inp.disabled = true;
      document.querySelectorAll(".choice").forEach(c => c.style.pointerEvents = "none");

      // Antwort-Boxen einfärben: richtig = grün, falsch angeklickt = rot
      if (q.type === "choice" || q.type === "wf") {
        const correctSet = new Set(
          q.type === "wf"
            ? [q.correct ? 1 : 0]
            : (Array.isArray(q.correct) ? q.correct : [q.correct])
        );
        document.querySelectorAll(".choice").forEach(ch => {
          const i = +ch.getAttribute("data-i");
          const picked = sel.has(i);
          if (correctSet.has(i)) {
            ch.classList.add("is-correct");            // immer die richtige Lösung grün
          } else if (picked) {
            ch.classList.add("is-wrong");              // falsch angeklickt rot
          }
        });
      }

      const nextBtn = document.querySelector("#nextBtn");
      function goNext() {
        if (last) renderResult();
        else { QUIZ.pos++; renderQuestion(); }
      }
      nextBtn.addEventListener("click", goNext);
      // Enter = weiter, wenn nicht mehr in Eingabe
      nextBtn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); goNext(); } });
      nextBtn.focus();

      updateFooter();
    }

    app.replaceChildren(node);
    renderMath();
    // Fokus auf Eingabe
    const ai = document.querySelector("#ans"); if (ai) ai.focus();
    saveResume(); // Position nach jedem Rendern sichern (auch bei Zurück)
  }

  function renderResult() {
    const { mod, list, score } = QUIZ;
    const total = list.length;
    const pct = Math.round((score / total) * 100);
    clearResume(); // Durchlauf abgeschlossen → Fortsetzen zurücksetzen
    const node = tpl("tpl-result");

    const badge = $("#resultBadge", node);
    let cls = "low";
    if (pct >= 70) cls = "good"; else if (pct >= 40) cls = "mid";
    badge.className = "result-badge " + cls;
    badge.innerHTML = icon(pct >= 40 ? "i-check" : "i-flag", "icon-lg");

    $("#resultTitle", node).textContent = praiseFor(pct, total);
    $("#resultText", node).textContent = `${score} von ${total} richtig · ${pct}% in ${mod.title}.`;
    $("#resultStats", node).innerHTML = `
      <div class="result-stat"><div class="n">${score}</div><div class="l">richtig</div></div>
      <div class="result-stat"><div class="n">${total - score}</div><div class="l">offen</div></div>
      <div class="result-stat"><div class="n">${pct}%</div><div class="l">Quote</div></div>`;
    node.querySelectorAll("[data-act]").forEach(b => {
      b.addEventListener("click", () => {
        const a = b.getAttribute("data-act");
        if (a === "retry") startQuiz(mod.id, "all", { fresh: true });
        else if (a === "review") renderReview();
        else goHome();
      });
    });
    app.replaceChildren(node);
    renderMath();
    updateFooter();
  }

  function renderReview() {
    const { mod, list } = QUIZ;
    const node = tpl("tpl-review");
    $("#revTitle", node).textContent = "Durchsehen · " + mod.title;
    const wrap = $("#revList", node);

    list.forEach((idx, n) => {
      const q = mod.questions[idx];
      const useExact = !!exact[mod.id];
      const vals = resolveValues(q, useExact);
      const p = progress[qKey(mod.id, idx)] || {};
      const note = getNote(mod.id, idx);

      const card = document.createElement("div");
      card.className = "rev-card " + (p.lastOk ? "ok" : (p.seen ? "bad" : ""));
      let html = `<div class="rev-head"><span class="rev-n">${n + 1}</span>`;
      html += `<span class="rev-status">${p.lastOk ? "✓ sicher" : (p.seen ? "✗ offen" : "–")}</span></div>`;
      html += `<div class="rev-prompt">${fmt(substitute(q.prompt, vals))}</div>`;
      if (q.type === "numeric") {
        html += `<div class="rev-ans">Richtig: <b>${esc(fmtNum(q.compute(vals)))} ${esc(q.unit || "")}</b></div>`;
      } else if (q.type === "choice") {
        const right = (Array.isArray(q.correct) ? q.correct : [q.correct]).map(i => fmt(q.choices[i])).join(q.multiple ? " + " : " / ");
        html += `<div class="rev-ans">Richtig: <b>${right}</b></div>`;
      } else if (q.type === "wf") {
        html += `<div class="rev-ans">Richtig: <b>${q.correct ? "Wahr" : "Falsch"}</b></div>`;
      } else if (q.solution) {
        const extraVals = typeof q.extra === "function" ? q.extra(vals) : {};
        const merged = Object.assign({}, vals, extraVals);
        html += `<div class="rev-ans">Lösung: <b>${fmt(substitute(q.solution, merged))}</b></div>`;
      }
      if (q.explain) {
        const extraVals = typeof q.extra === "function" ? q.extra(vals) : {};
        const merged = Object.assign({}, vals, extraVals);
        html += `<div class="rev-explain">${fmt(substitute(q.explain, merged))}</div>`;
      }
      if (note.trim()) html += `<div class="rev-note">${icon("i-note")} ${esc(note)}</div>`;
      card.innerHTML = html;
      wrap.appendChild(card);
    });

    node.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", goHome));
    app.replaceChildren(node);
    renderMath();
    updateFooter();
  }

  function updateFooter() {
    let total = 0, done = 0;
    MODULES.forEach(mod => mod.questions.forEach((_, i) => {
      total++;
      if ((progress[qKey(mod.id, i)] || {}).lastOk) done++;
    }));
    $("#progressLabel").textContent = total
      ? `Gesamt: ${done} von ${total} Aufgaben sicher`
      : "Noch keine Aufgaben — PDFs fehlen";
  }

  /* ---------- Sync ----------
   * Aktuell: reiner localStorage (Fortschritt/Notes automatisch im Browser,
   * kein Download nötig). Später: Store = SupabaseStore(...) für geräteübergreifend.
   */
  function wireSync() { /* Platzhalter — siehe Store oben */ }

  /* ---------- Boot ---------- */
  const brandHome = document.getElementById("brandHome");
  if (brandHome) brandHome.addEventListener("click", goHome);
  initTheme();
  renderHome();
})();
