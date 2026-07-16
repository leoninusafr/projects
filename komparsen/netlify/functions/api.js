// Netlify Function: reicht alle /api/*-Requests durch.
//
// STRATEGIE (persistenz-sicher, DSGVO-lokal):
//   1) KAST_API_PROXY gesetzt  -> alle /api/* an diesen Server durchreichen.
//      EMPFOHLEN: dein portforwardter Node-Server (node server.js). Der
//      persistiert die JSON-DB lokal und hat Admin/Register/Login voll am Laufen.
//      So läuft das Frontend bei Netlify (auto-deploy per Git-Push), aber die
//      API + Daten kommen aus deinem immer-laufenden Node-Server.
//   2) SUPABASE_URL + SUPABASE_ANON_KEY gesetzt -> Supabase-Adapter
//      (server.js wählt ihn automatisch; persistierte Cloud-DB).
//   3) sonst -> lokale JSON-DB über server.js. ACHTUNG: auf Netlify Functions
//      ist das Dateisystem EPHEMERAL -> keine Persistenz, nur für reine
//      Lesetests. Deshalb hier KEIN require von server.js mehr (Netlify bundleled
//      parent-Files nicht -> require('../../../server.js') schlägt fehl).
//
// Voraussetzung für (1): im Netlify-Dashboard eine Env-Var setzen:
//   KAST_API_PROXY = https://deine-domain-oder-ip:PORT
// (der Port, auf dem dein ZimaOS-portforwardter Node-Server lauscht)

const PROXY = (process.env.KAST_API_PROXY
  ? process.env.KAST_API_PROXY.replace(/\/+$/, '')
  // KEIN hartcodierter Fallback mehr: tote Cloudflare-URL verursachte
  // „fetch failed"-Banner im Frontend. Wenn KAST_API_PROXY nicht gesetzt ist,
  // wird direkt der lokale-Server-Fallback (unten) genutzt.
  : '');

exports.handler = async function (event, context) {
  if (PROXY) {
    const path = (event.path || '/').replace(/^\//, '');
    const q = event.queryStringParameters || {};
    const qs = Object.keys(q).map(k => k + '=' + encodeURIComponent(q[k])).join('&');
    const target = PROXY + '/' + path + (qs ? '?' + qs : '');

    // Header aufräumen: host/transfer-/content-length dürfen nicht mitgereicht werden
    const fwd = {};
    for (const [k, v] of Object.entries(event.headers || {})) {
      const lk = k.toLowerCase();
      if (['host', 'content-length', 'transfer-encoding'].includes(lk)) continue;
      fwd[k] = v;
    }

    let body;
    if (event.body && event.httpMethod && event.httpMethod.toUpperCase() !== 'GET') {
      body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    }

    try {
      const r = await fetch(target, {
        method: event.httpMethod || 'GET',
        headers: fwd,
        body
      });
      const buf = Buffer.from(await r.arrayBuffer());
      return {
        statusCode: r.status,
        headers: Object.fromEntries(r.headers.entries()),
        body: buf.toString('base64'),
        isBase64Encoded: true
      };
    } catch (e) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'API-Proxy nicht erreichbar (KAST_API_PROXY=' + PROXY + '): ' + e.message })
      };
    }
  }

  // KEIN PROXY gesetzt: saubere Meldung statt Crash/Fallback.
  // Netlify-Functions können server.js (Parent-Files) nicht laden -> keine lokale DB.
  // Lösung: KAST_API_PROXY im Netlify-Dashboard auf deinen Node-Server setzen
  // (z.B. Cloudflare-Tunnel-URL oder Port-Forwarding-Domain).
  return {
    statusCode: 503,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'KAST_API_PROXY nicht gesetzt. Setze im Netlify-Dashboard KAST_API_PROXY auf die URL deines Node-Servers (z.B. https://deine-domain:4173), damit /api/* funktioniert.'
    })
  };
};
