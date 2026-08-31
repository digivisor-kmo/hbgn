import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:8099/';
const LABEL = process.argv[3] || 'meting';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
});
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', {
  offline: false, latency: 150, downloadThroughput: Math.round(1.6 * 1024 * 1024 / 8),
  uploadThroughput: Math.round(750 * 1024 / 8)
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

// Google Fonts is in deze omgeving geblokkeerd; we doen alsof het normaal werkt
// zodat de oude opzet een eerlijke kans krijgt: echte inhoud, 150 ms vertraging.
const fs = await import('node:fs');
const CSS = fs.readFileSync('fonts_google.css', 'utf8');
await p.route('https://fonts.googleapis.com/**', async r => {
  await new Promise(x => setTimeout(x, 150));
  r.fulfill({ status: 200, contentType: 'text/css', body: CSS });
});
await p.route('https://fonts.gstatic.com/**', async r => {
  const naam = r.request().url().split('/').pop();
  await new Promise(x => setTimeout(x, 150));
  r.fulfill({ status: 200, contentType: 'font/woff2',
              body: fs.readFileSync('site/fonts/' + naam) });
});

const bronnen = [];
p.on('response', r => {
  try {
    const h = r.headers();
    bronnen.push({ u: r.url().replace(/^https?:\/\/[^/]+/, ''), t: h['content-type'] || '',
                   n: Number(h['content-length'] || 0), enc: h['content-encoding'] || '-' });
  } catch {}
});

const t0 = Date.now();
await p.goto(URL, { waitUntil: 'load', timeout: 120000 });
const laadtijd = Date.now() - t0;
await p.waitForTimeout(3500);

const m = await p.evaluate(() => new Promise(res => {
  const uit = { fcp: 0, lcp: 0, cls: 0, lange: 0, langste: 0, dom: 0, ttfb: 0 };
  for (const e of performance.getEntriesByType('paint'))
    if (e.name === 'first-contentful-paint') uit.fcp = Math.round(e.startTime);
  try {
    new PerformanceObserver(l => { const e = l.getEntries(); uit.lcp = Math.round(e[e.length - 1].startTime); })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) uit.cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) {
      uit.lange++; uit.langste = Math.max(uit.langste, Math.round(e.duration)); } })
      .observe({ type: 'longtask', buffered: true });
  } catch (e) {}
  uit.dom = document.querySelectorAll('*').length;
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav) uit.ttfb = Math.round(nav.responseStart);
  setTimeout(() => res(uit), 1200);
}));

const fps = await p.evaluate(() => new Promise(res => {
  let n = 0, traag = 0, vorige = performance.now();
  const start = performance.now();
  function tel(t) {
    const dt = t - vorige; vorige = t; n++;
    if (dt > 32) traag++;
    if (t - start < 4000) requestAnimationFrame(tel);
    else res({ fps: Math.round(n / ((t - start) / 1000)), traag });
  }
  let y = 0;
  const rol = setInterval(() => {
    y += 120; window.scrollTo(0, y);
    if (y > document.documentElement.scrollHeight) clearInterval(rol);
  }, 60);
  requestAnimationFrame(tel);
  setTimeout(() => clearInterval(rol), 4200);
}));

const totaal = bronnen.reduce((s, r) => s + r.n, 0);
console.log('=== ' + LABEL + ' ===');
console.log('  laadtijd (load)      : ' + laadtijd + ' ms');
console.log('  TTFB                 : ' + m.ttfb + ' ms');
console.log('  FCP                  : ' + m.fcp + ' ms');
console.log('  LCP                  : ' + m.lcp + ' ms');
console.log('  CLS                  : ' + m.cls.toFixed(4));
console.log('  lange taken          : ' + m.lange + ' (langste ' + m.langste + ' ms)');
console.log('  DOM-knopen           : ' + m.dom);
console.log('  fps tijdens scrollen : ' + fps.fps + '   trage frames: ' + fps.traag);
console.log('  overgedragen         : ' + Math.round(totaal / 1024) + ' kB in ' + bronnen.length + ' verzoeken');
bronnen.filter(r => r.n > 10000).sort((a, b) => b.n - a.n)
  .forEach(r => console.log('     ' + String(Math.round(r.n / 1024)).padStart(5) + ' kB  ' + r.enc.padEnd(5) + ' ' + r.u.slice(0, 58)));
await b.close();
