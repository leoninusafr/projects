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
  // Fallback-Default: aktuelle Cloudflare-Tunnel-URL des Node-Servers.
  // HINWEIS: Quick-Tunnel-URLs rotieren bei Neustart. Bei Tunnel-Neustart
  // hier aktualisieren ODER KAST_API_PROXY im Netlify-Dashboard setzen
  // (empfohlen: feste Cloudflare-Domain via Cloudflare-Account).
  : 'https://slight-reflection-acid-leaf.trycloudflare.com');

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

  // Fallback (2)/(3): lokale App. Achtung: nur mit Supabase persistent.
  // Bei reiner JSON-DB auf Netlify -> keine Persistenz (siehe oben).
  try {
    const { handleApi } = require('../../../server.js');
    const url = require('url');
    const rawUrl = '/' + ((event.path || '').replace(/^\//, ''));
    const query = event.queryStringParameters || {};
    const search = Object.keys(query).map(k => k + '=' + encodeURIComponent(query[k])).join('&');
    const full = rawUrl + (search ? '?' + search : '');
    const parsed = url.parse(full, true);
    const req = {
      method: (event.httpMethod || 'GET').toUpperCase(),
      url: full,
      headers: event.headers || {},
      on(type, cb) {
        if (type === 'data' && event.body) cb(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
        if (type === 'end' && cb) cb();
      },
      destroy() {}
    };
    const res = {
      _status: 200, _headers: {}, _body: '',
      writeHead(code, headers) { this._status = code; if (headers) this._headers = headers; return this; },
      setHeader(k, v) { this._headers[k] = v; return this; },
      end(b) { if (b != null) this._body = b; }
    };
    await handleApi(req, res, parsed);
    return {
      statusCode: res._status,
      headers: res._headers,
      body: typeof res._body === 'string' ? res._body : String(res._body || '')
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'server.js konnte nicht geladen werden (Netlify bundleled parent-Files nicht). Setze KAST_API_PROXY auf deinen Node-Server. Details: ' + e.message })
    };
  }
};
