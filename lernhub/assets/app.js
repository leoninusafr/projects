/* LernHub — Quiz-Engine
 * Statische App, kein Build-Schritt. Persistenz über austauschbares Store-Modul.
 */
(function () {
  "use strict";

  const MODULES = [window.MODULE_VT2, window.MODULE_PHYS2].filter(Boolean);

  const STORE_KEY = "lernhub.progress.v1";
  const EXACT_KEY = "lernhub.exact.v1";
  const THEME_KEY = "lernhub.theme.v1";

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
    }
  };

  // Später: Store = SupabaseStore(url, anonKey) — gleiche Methoden.
  // Fertiges Schema liegt in migrations/ (KAST-Supabase). Hier erstmal lokal.

  let progress = Store.read();
  let exact = Store.readExact();

  function qKey(modId, idx) { return modId + ":" + idx; }
  function recordAttempt(modId, idx, correct) {
    const k = qKey(modId, idx);
    const p = progress[k] || { seen: 0, correct: 0, wrong: 0, lastOk: false };
    p.seen += 1;
    if (correct) { p.correct += 1; p.lastOk = true; }
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
    // LaTeX-Passagen: \(..\) oder $..$ in <span class="tex"> verpacken
    let s = esc(text);
    s = s.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
    // \( ... \) inline
    s = s.replace(/\\\(([\s\S]+?)\\\)/g, (m, tex) => `<span class="tex">${tex}</span>`);
    // $ ... $ inline (einfach, nur wenn nicht escapt)
    s = s.replace(/(^|[^\\$])\$([^$\n]+?)\$(?!\d)/g, (m, pre, tex) => `${pre}<span class="tex">${tex}</span>`);
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

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    document.body.setAttribute("data-theme", t);
    $("#themeIcon").innerHTML = `<use href="#${t === "dark" ? "i-sun" : "i-moon"}"/>`;
  }
  function initTheme() {
    let t = localStorage.getItem(THEME_KEY);
    if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(t);
    $("#themeToggle").addEventListener("click", () => {
      const next = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
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
      btn.addEventListener("click", () => startQuiz(modId, btn.getAttribute("data-mode")));
    });

    app.replaceChildren(node);
    renderMath();
    updateFooter();
  }

  function pickQuestions(mod, mode) {
    const idxs = mod.questions.map((_, i) => i);
    if (mode === "wrong") {
      const w = idxs.filter(i => { const p = progress[qKey(mod.id, i)]; return p && !p.lastOk; });
      return w.length ? w : idxs;
    }
    if (mode === "unseen") {
      const u = idxs.filter(i => !((progress[qKey(mod.id, i)] || {}).seen));
      return u.length ? u : idxs;
    }
    return idxs;
  }

  /* ---------- Quiz ---------- */
  let QUIZ = null;

  function startQuiz(modId, mode) {
    const mod = MODULES.find(m => m.id === modId);
    const list = pickQuestions(mod, mode);
    if (!list.length) { goModule(modId); return; }
    QUIZ = { mod, list, pos: 0, score: 0 };
    renderQuestion();
  }

  function renderQuestion() {
    const { mod, list, pos } = QUIZ;
    const q = mod.questions[list[pos]];
    const useExact = !!exact[mod.id];
    const vals = resolveValues(q, useExact);

    const node = tpl("tpl-quiz");
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
      html += `<div class="q-input"><input id="ans" type="text" placeholder="${esc(q.placeholder || "Antwort eintippen")}" autocomplete="off"></div>`;
    } else if (q.type === "wf") {
      html += `<div class="choices" id="choices">
        <div class="choice" data-i="1"><span class="mark"></span><span>Wahr</span></div>
        <div class="choice" data-i="0"><span class="mark"></span><span>Falsch</span></div>
      </div>`;
    }

    html += `<button class="btn primary block" id="checkBtn" disabled>Aufgabe abgeben</button>`;
    html += `<div id="fb"></div>`;
    card.innerHTML = html;

    const checkBtn = $("#checkBtn", node);
    const sel = new Set();

    function submit() {
      if (checkBtn.disabled) return;
      doCheck();
    }

    if (q.type === "numeric" || q.type === "text" || q.type === "short" || q.type === "huffman") {
      const inp = $("#ans", node);
      inp.addEventListener("input", () => { checkBtn.disabled = inp.value.trim() === ""; });
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
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
        correct = true; // Selbst-Check (short/huffman/text), Lösung wird gezeigt
        userVal = ansEl ? ansEl.value : "";
      }

      recordAttempt(mod.id, list[pos], correct);
      if (correct) QUIZ.score++;

      const fb = fbEl;
      const fbIcon = correct ? "i-check" : "i-x";
      const fbCls = correct ? "good" : "bad";
      let fbHtml = `<div class="feedback ${fbCls}">${icon(fbIcon)}<span>${correct ? "Richtig." : (q.type === "wf" ? "Falsch eingeschätzt." : "Nicht quite.")}</span></div>`;

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
      if (q.type === "text" || q.type === "short" || q.type === "huffman") {
        fbHtml += `<div class="feedback-note">Lösung unten zur Kontrolle.</div>`;
      }

      if (q.explain || q.solution) {
        const extraVals = typeof q.extra === "function" ? q.extra(vals) : {};
        const merged = Object.assign({}, vals, extraVals);
        let body = "";
        if (q.solution) body += `**Lösung:** ${fmt(substitute(q.solution, merged))}\n\n`;
        if (q.explain) body += fmt(substitute(q.explain, merged));
        fbHtml += `<details class="explain" open><summary>Warum — Lösungsweg</summary><div class="explain-body">${body}</div></details>`;
      }

      const last = pos === list.length - 1;
      fbHtml += `<div class="next-row"><button class="btn ${last ? "ghost" : "primary"} block" id="nextBtn">${last ? "Auswertung" : "Weiter"}</button></div>`;
      fb.innerHTML = fbHtml;

      // sperren
      checkBtn.disabled = true;
      const inp = document.querySelector("#ans"); if (inp) inp.disabled = true;
      document.querySelectorAll(".choice").forEach(c => c.style.pointerEvents = "none");

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
  }

  function renderResult() {
    const { mod, list, score } = QUIZ;
    const total = list.length;
    const pct = Math.round((score / total) * 100);
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
        if (a === "retry") startQuiz(mod.id, "all");
        else goHome();
      });
    });
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

  /* ---------- Sync (Export/Import; später Supabase) ---------- */
  function wireSync() {
    const exportBtn = $("#exportBtn");
    const importBtn = $("#importBtn");
    const importFile = $("#importFile");
    if (!exportBtn || !importBtn || !importFile) return;

    exportBtn.addEventListener("click", () => {
      const payload = {
        app: "lernhub", version: 1,
        exported: new Date().toISOString(),
        progress, exact,
        modules: MODULES.map(m => m.id)
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "lernhub-fortschritt.json";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });

    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", () => {
      const f = importFile.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (data.progress) { progress = Object.assign({}, progress, data.progress); Store.write(progress); }
          if (data.exact) { exact = Object.assign({}, exact, data.exact); Store.writeExact(exact); }
          renderHome(); updateFooter();
        } catch { /* stumm: ungültige Datei */ }
      };
      r.readAsText(f);
      importFile.value = "";
    });
  }

  /* ---------- Boot ---------- */
  initTheme();
  wireSync();
  renderHome();
})();
