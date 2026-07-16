'use strict';
// Caster-Suche: Filter + Freitext, Warenkorb (Shortlist).
(function () {
  const $ = (id) => document.getElementById(id);
  let cart = JSON.parse(localStorage.getItem('kast_cart') || '[]');

  function renderCart() {
    $('cartLink').textContent = 'Warenkorb (' + cart.length + ')';
  }

  function card(p) {
    const inCart = cart.includes(p.id);
    const chips = [p.age && (p.age + ' J'), p.height_cm && (p.height_cm + ' cm'),
      p.hair_color, p.eye_color, p.city].filter(Boolean)
      .map(c => '<span class="chip">' + esc(c) + '</span>').join('');
    const skills = (p.skills || []).map(s => '<span class="chip">' + esc(s) + '</span>').join('');
    const avatar = p.photo_id
      ? '<div class="avatar"><img src="/api/photo/' + esc(p.photo_id) + '" alt="' + esc((p.first_name||'')+' '+(p.last_name||'')) + '"></div>'
      : '<div class="avatar"></div>';
    return '<div class="card"><div class="person">' +
      avatar +
      '<div><h3>' + esc((p.first_name || '') + ' ' + (p.last_name || '').slice(0,1) + '.') + '</h3>' +
      '<div class="muted">' + esc(p.city || '') + '</div></div></div>' +
      '<div class="chips">' + chips + '</div>' +
      (skills ? '<div class="chips">' + skills + '</div>' : '') +
      '<button class="btn sm ' + (inCart ? 'secondary' : '') + '" data-id="' + p.id + '" style="margin-top:12px">' +
      (inCart ? 'Im Warenkorb ' + icon('check') : 'In Warenkorb') + '</button></div>';
  }

  function doSearch() {
    const params = new URLSearchParams();
    const q = $('q').value.trim(); if (q) params.set('q', q);
    if ($('gender').value) params.set('gender', $('gender').value);
    if ($('hair').value) params.set('hair', $('hair').value);
    if ($('eye').value) params.set('eye', $('eye').value);
    if ($('minh').value) params.set('min_height', $('minh').value);
    if ($('maxh').value) params.set('max_height', $('maxh').value);
    if ($('mina').value) params.set('min_age', $('mina').value);
    if ($('maxa').value) params.set('max_age', $('maxa').value);

    api('/api/search?' + params.toString()).then(r => {
      if (r.status === 401 || r.status === 403) {
        $('results').innerHTML = '<div class="notice">' +
          'Die Komparsen-Kartei ist nur für eingeloggte Produktionen einsehbar. ' +
          'Bitte <a href="/onboarding.html?role=production">als Produktion anmelden</a>, ' +
          'um Profile, Fotos und Attribute zu sehen.</div>';
        return;
      }
      return r.json();
    }).then(res => {
      if (!res) return;
      const box = $('results');
      if (!res.length) { box.innerHTML = '<div class="empty"><h3>Keine Treffer</h3><p>Suchbegriff oder Filter anpassen?</p></div>'; return; }
      box.innerHTML = res.map(card).join('');
      box.querySelectorAll('button[data-id]').forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.id;
          if (cart.includes(id)) cart = cart.filter(x => x !== id);
          else cart.push(id);
          localStorage.setItem('kast_cart', JSON.stringify(cart));
          renderCart(); doSearch();
        });
      });
    });
  }

  $('searchBtn').addEventListener('click', doSearch);
  $('resetBtn').addEventListener('click', () => {
    ['q','gender','hair','eye','minh','maxh','mina','maxa'].forEach(id => $(id).value = '');
    doSearch();
  });
  $('q').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Klick auf Warenkorb -> Export
  $('cartLink').addEventListener('click', async (e) => {
    e.preventDefault();
    if (!cart.length) { alert('Warenkorb ist leer.'); return; }
    if (confirm('Auswahl als Liste exportieren? (' + cart.length + ' Komparsen)')) {
      const r = await api('/api/shortlist/export', { method: 'POST', body: JSON.stringify({ ids: cart }) });
      if (r.status === 401 || r.status === 403) { alert('Bitte als Produktion anmelden, um zu exportieren.'); return; }
      if (r.ok) {
        const blob = await r.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'kast_auswahl.csv'; a.click();
      }
    }
  });

  renderCart();
  doSearch();

  // ---- Anfrage aus Warenkorb stellen ----
  const panel = document.createElement('div');
  panel.className = 'card';
  panel.style.marginTop = '30px';
  panel.innerHTML = '<h3>Casting-Anfrage senden</h3>' +
    '<p class="muted">Für alle ' + cart.length + ' Komparsen im Warenkorb eine Anfrage stellen. ' +
    'Sie erhalten eine E-Mail (und später WhatsApp) und sehen die Anfrage im Dashboard.</p>' +
    '<label for="projTitle">Projekt / Titel</label><input id="projTitle" placeholder="z.B. Werbespot \"Sonne\"">' +
    '<div class="row"><div><label for="projDate">Datum</label><input id="projDate" type="date"></div>' +
    '<div><label for="projLoc">Ort</label><input id="projLoc" placeholder="z.B. Hamburg"></div></div>' +
    '<button class="btn block" id="sendReq" style="margin-top:12px">Anfrage senden (' + cart.length + ')</button>';
  document.getElementById('results').after(panel);

  function refreshReqBtn() {
    const btn = document.getElementById('sendReq');
    if (btn) btn.textContent = 'Anfrage senden (' + cart.length + ')';
  }
  // nach jedem doSearch den Counter aktualisieren
  const origDoSearch = doSearch;
  doSearch = function () { origDoSearch(); refreshReqBtn(); };

  document.getElementById('sendReq').addEventListener('click', async () => {
    if (!cart.length) { alert('Warenkorb ist leer.'); return; }
    const title = document.getElementById('projTitle').value.trim();
    const date = document.getElementById('projDate').value;
    const loc = document.getElementById('projLoc').value.trim();
    if (!title || !date) { alert('Bitte Projekttitel und Datum angeben.'); return; }
    const btn = document.getElementById('sendReq');
    btn.disabled = true; btn.textContent = 'Sende…';
    let ok = 0, fail = 0;
    for (const id of cart) {
      const r = await api('/api/bookings', { method: 'POST', body: JSON.stringify({ extra_id: id, title, date_start: date, location: loc }) });
      if (r.ok) ok++; else fail++;
    }
    btn.disabled = false; refreshReqBtn();
    if (ok) {
      cart = []; localStorage.setItem('kast_cart', '[]'); renderCart();
      alert(ok + ' Anfrage(n) gesendet. ' + (fail ? fail + ' fehlgeschlagen.' : ''));
      doSearch();
    } else alert('Fehler beim Senden.');
  });
})();
