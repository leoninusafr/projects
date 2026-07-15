// Netlify Function: reicht alle /api/*-Requests an die bestehende
// handleApi-Logik durch. Statische Dateien (HTML/CSS/JS) liefert Netlify
// selbst aus dem `public/`-Ordner — siehe netlify.toml.
//
// HINWEIS Datenschicht: Netlify Functions haben KEIN persistentes Dateisystem
// (ephemeral). Für echten Betrieb db.js auf Supabase umstellen
// (migrations/001_init.sql liegt bereit) — sonst gehen Daten nach jedem
// Deploy/ Cold-Start verloren. Lokal (node server.js) bleibt die JSON-DB.
const { handleApi } = require('../../../server.js');
const url = require('url');

// Minimaler Response-Shim, der handleApi's res.writeHead/res.end auffängt.
function makeRes() {
  return {
    _status: 200, _headers: {}, _body: '',
    writeHead(code, headers) { this._status = code; if (headers) this._headers = headers; return this; },
    setHeader(k, v) { this._headers[k] = v; return this; },
    end(body) { if (body != null) this._body = body; this._done = true; },
    // netlify erwartet kein .json(), handleApi nutzt json() helper selbst (schreibt via end)
  };
}

function toNodeReq(event) {
  const rawUrl = '/' + (event.path || '').replace(/^\//, '');
  const query = event.queryStringParameters || {};
  const search = Object.keys(query).map(k => k + '=' + encodeURIComponent(query[k])).join('&');
  const full = rawUrl + (search ? '?' + search : '');
  const parsed = url.parse(full, true);
  return {
    method: (event.httpMethod || 'GET').toUpperCase(),
    url: full,
    headers: event.headers || {},
    // Body nur bei nicht-GET
    on(type, cb) {
      if (type === 'data' && event.body) cb(Buffer.from(event.body));
      if (type === 'end' && cb) cb();
    },
    // Fallback für parseBody (req.on)
    destroy() {},
    _parsed: parsed
  };
}

exports.handler = async function (event, context) {
  // handleApi nutzt url.parse(req.url, true) intern -> wir setzen req.url korrekt
  const req = toNodeReq(event);
  // handleApi liest parsed über url.parse(req.url, true) selbst, daher reicht req.url
  const res = makeRes();
  await handleApi(req, res, req._parsed);
  return {
    statusCode: res._status,
    headers: res._headers,
    body: typeof res._body === 'string' ? res._body : String(res._body || '')
  };
};
