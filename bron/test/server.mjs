import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

// standaard: de hoofdmap van de repository, twee niveaus boven dit bestand
const HIER = path.dirname(fileURLToPath(import.meta.url));
const WORTEL = path.resolve(process.argv[2] || path.join(HIER, '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };
const PERSBAAR = new Set(['.html', '.css', '.js', '.svg', '.json', '.xml', '.txt', '.webmanifest']);
const cache = new Map();

const ontvangen = [];

http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  // nagebootste Google Sheet, zodat we de hele keten kunnen testen
  if (p === '/nep-sheet') {
    let b = ''; for await (const c of req) b += c;
    const j = JSON.parse(b);
    if (j.geheim !== 'test-geheim') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, fout: 'geen toegang' }));
    }
    ontvangen.push(j);
    fs.writeFileSync('ontvangen.json', JSON.stringify(ontvangen, null, 1));
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, id: '260828-120000-ABC' }));
  }

  if (p === '/api/inschrijven') {
    let b = ''; for await (const c of req) b += c;
    let body = null; try { body = JSON.parse(b); } catch (e) {}
    const nep = {
      method: req.method, headers: req.headers, body,
    };
    const uit = {
      _code: 200, _kop: {},
      setHeader(k, v) { this._kop[k] = v; return this; },
      status(c) { this._code = c; return this; },
      json(o) { res.writeHead(this._code, { 'content-type': 'application/json', ...this._kop });
                res.end(JSON.stringify(o)); }
    };
    const mod = await import(path.join(WORTEL, 'api/inschrijven.js') + '?t=' + Date.now());
    await (mod.default || mod)(nep, uit);
    return;
  }
  if (p === '/' || p.endsWith('/')) p += 'index.html';
  let bestand = path.join(WORTEL, p);
  // cleanUrls, net zoals Vercel het doet: /privacy vindt privacy.html
  if (!path.extname(bestand) && fs.existsSync(bestand + '.html')) bestand += '.html';
  if (!bestand.startsWith(WORTEL) || !fs.existsSync(bestand) || fs.statSync(bestand).isDirectory()) {
    res.writeHead(404); return res.end('niet gevonden');
  }
  const ext = path.extname(bestand);
  const type = TYPES[ext] || 'application/octet-stream';
  let data = fs.readFileSync(bestand);
  const kop = { 'content-type': type,
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' };
  if (PERSBAAR.has(ext) && /br/.test(req.headers['accept-encoding'] || '')) {
    const sleutel = bestand + ':' + fs.statSync(bestand).mtimeMs;
    if (!cache.has(sleutel)) cache.set(sleutel, zlib.brotliCompressSync(data,
      { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }));
    data = cache.get(sleutel);
    kop['content-encoding'] = 'br';
  }
  kop['content-length'] = data.length;
  res.writeHead(200, kop);
  res.end(data);
}).listen(Number(process.argv[3] || 8100), () => console.log('brotli-server op ' + (process.argv[3] || 8100)));
