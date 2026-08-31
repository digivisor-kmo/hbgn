import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const fouten = [];
for (const [n, w, h] of [['pv_desk', 1440, 1000], ['pv_mob', 390, 900]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => fouten.push(n + ' js: ' + e.message));
  p.on('response', r => { if (r.status() >= 400) fouten.push(n + ' ' + r.status() + ' ' + r.url()); });
  await p.goto('http://127.0.0.1:8100/privacy', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const d = await p.evaluate(() => ({
    titel: document.title,
    h1: document.querySelector('h1')?.textContent,
    koppen: document.querySelectorAll('h2').length,
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    hoogte: document.documentElement.scrollHeight
  }));
  if (d.sw > d.cw + 1) fouten.push(n + ': overflow');
  console.log(n, JSON.stringify(d));
  await p.screenshot({ path: n + '_1.png' });
  await p.evaluate(() => window.scrollTo(0, 1500));
  await p.waitForTimeout(400);
  await p.screenshot({ path: n + '_2.png' });
  await p.close();
}
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:8100/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('footer').scrollIntoView());
await p.waitForTimeout(1500);
const link = await p.evaluate(() => {
  const a = document.querySelector('.voet-recht a');
  return a ? { tekst: a.textContent, href: a.getAttribute('href') } : 'geen link';
});
console.log('voetlink:', JSON.stringify(link));
await p.screenshot({ path: 'pv_voet.png' });
await b.close();
console.log(fouten.length ? 'FOUTEN:\n' + fouten.join('\n') : 'geen fouten');
