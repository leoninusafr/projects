'use strict';
// Onboarding-Flow: Rolle wählen -> 4 Schritte + Foto-Upload + Selfie + Consent.
(function () {
  const $ = (id) => document.getElementById(id);
  const photos = { portrait: null, full: null };
  let selfie = null;
  const state = { userId: null, token: null };

  function show(step) {
    document.querySelectorAll('[data-step]').forEach(el => {
      el.classList.toggle('hidden', Number(el.dataset.step) !== step);
    });
    [0,1,2,3,4].forEach(i => {
      const d = $('s' + i);
      if (d) d.classList.toggle('done', step >= i);
    });
    window.scrollTo(0, 0);
  }
  function fail(err) {
    $('msg').innerHTML = '<div class="notice err">' + esc(err.message || err) + '</div>';
  }

  // Rolle aus der Auswahl lesen + ggf. Firmenfeld zeigen
  function currentRole() {
    const sel = document.querySelector('input[name="role"]:checked');
    return sel ? sel.value : 'extra';
  }
  function syncRoleUI() {
    const isProd = currentRole() === 'production';
    $('companyWrap').style.display = isProd ? 'block' : 'none';
    $('roleHint').textContent = isProd
      ? 'Sie erhalten nach Bestätigung Zugang zur Caster-Suche und können Komparsen anfragen.'
      : 'Nach Bestätigung richten Sie Ihr Profil und Fotos ein.';
  }
  document.querySelectorAll('input[name="role"]').forEach(r => r.addEventListener('change', syncRoleUI));

  // Schritt 1 -> Register (Double-Opt-In)
  $('next1').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.classList.add('loading'); btn.disabled = true;
    try {
      const role = currentRole();
      const body = { email: $('email').value, password: $('pw').value, role };
      if (role === 'production') body.extra = { company: $('company').value || '' };
      const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Registrierung fehlgeschlagen');
      $('msg').innerHTML = '<div class="notice ok">Bitte bestätigen Sie Ihre E-Mail über den erhaltenen Link. ' +
        'Für die Demo hier klicken: <a href="' + j.verifyLink + '&redirect=1">E-Mail bestätigen</a></div>';
      state.userId = j.userId;
      show(2);
    } catch (err) { fail(err); }
    finally { btn.classList.remove('loading'); btn.disabled = false; }
  });

  // Bei Opt-In-Link automatisch Verifizierung abschließen + einloggen,
  // damit Schritte 2–4 mit gültiger Session laufen (PUT /api/profile/me braucht Auth).
  const params = new URLSearchParams(location.search);
  if (params.get('token') && params.get('email')) {
    (async () => {
      try {
        const r = await api('/api/auth/verify?token=' + encodeURIComponent(params.get('token')) +
          '&email=' + encodeURIComponent(params.get('email')));
        if (r.ok) {
          $('msg').innerHTML = '<div class="notice ok">E-Mail bestätigt. Sie können jetzt Profil & Fotos anlegen.</div>';
          show(2);
        }
      } catch (e) { fail(e); }
    })();
  }

  // Schritt 2 -> Profil speichern
  $('next2').addEventListener('click', async () => {
    const profile = {
      first_name: $('fn').value, last_name: $('ln').value, dob: $('dob').value,
      gender: $('gender').value, height_cm: Number($('height').value) || null,
      hair_color: $('hair').value, eye_color: $('eye').value,
      city: $('city').value, plz: $('plz').value,
      skills: $('skills').value.split(',').map(s => s.trim()).filter(Boolean),
      bio: $('bio').value
    };
    try {
      const r = await api('/api/profile/me', { method: 'PUT', body: JSON.stringify(profile) });
      if (r.ok) { show(3); return; }
      state.draftProfile = profile;
      show(3);
    } catch (e) { fail(e); }
  });

  // Schritt 3 -> Foto-Upload mit Kompression
  function wireDrop(zoneId, fileId, kind) {
    const zone = $(zoneId), inp = $(fileId);
    zone.addEventListener('click', () => inp.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('over');
      if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
    inp.addEventListener('change', () => { if (inp.files[0]) handle(inp.files[0]); });
    async function handle(file) {
      try {
        const { dataUrl, width, height } = await compressImage(file, { maxDim: 1280, quality: 0.8 });
        photos[kind] = { dataUrl, width, height, kind };
        zone.innerHTML = '<img src="' + dataUrl + '">' + file.name +
          ' <span class="badge ok">hochgeladen</span>';
      } catch (e) { fail(e); }
    }
  }
  wireDrop('dropPortrait', 'filePortrait', 'portrait');
  wireDrop('dropFull', 'fileFull', 'full');

  $('next3').addEventListener('click', async () => {
    try {
      for (const k of ['portrait', 'full']) {
        if (photos[k]) {
          await api('/api/photos', { method: 'POST', body: JSON.stringify(photos[k]) });
        }
      }
      show(4);
    } catch (e) { fail(e); }
  });

  // Schritt 4 -> Selfie (Live) + Consent
  let stream = null;
  $('startCam').addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      $('vid').srcObject = stream; $('vid').classList.remove('hidden');
      $('shoot').disabled = false;
    } catch (e) { fail(new Error('Kamerazugriff nicht möglich: ' + e.message)); }
  });
  $('shoot').addEventListener('click', () => {
    selfie = captureSelfie($('vid'), $('canvas'));
    $('canvas').classList.remove('hidden'); $('vid').classList.add('hidden');
    if (stream) stream.getTracks().forEach(t => t.stop());
    checkConsent();
    $('selfieState').style.display = 'block';
    $('selfieState').innerHTML = '<span class="badge ok">Selfie erfasst (live)</span>';
  });
  ['cImg','cShare','cBio'].forEach(id => $(id).addEventListener('change', checkConsent));
  function checkConsent() {
    $('finish').disabled = !(selfie && $('cImg').checked && $('cShare').checked && $('cBio').checked);
  }

  $('finish').addEventListener('click', async () => {
    try {
      await api('/api/photos', { method: 'POST',
        body: JSON.stringify({ kind: 'selfie', dataUrl: selfie, width: 480, height: 640 }) });
      await api('/api/profile/consents', { method: 'POST', body: JSON.stringify({
        image_rights: $('cImg').checked,
        data_share: $('cShare').checked,
        biometric: $('cBio').checked,
        accepted_version: '1.0'
      }) });
      $('msg').innerHTML = '<div class="notice ok">Profil aktiviert. Sie können sich jetzt anmelden.</div>';
      setTimeout(() => location.href = '/login.html', 1200);
    } catch (e) { fail(e); }
  });

  syncRoleUI();
  // Vorauswahl der Rolle per URL (?role=production)
  const pre = new URLSearchParams(location.search).get('role');
  if (pre === 'production') {
    const rb = document.querySelector('input[name="role"][value="production"]');
    if (rb) { rb.checked = true; syncRoleUI(); }
  }
  show(0);
})();
