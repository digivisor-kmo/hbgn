import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const fouten = [];
for (const [n, w, h] of [['v_desk', 1440, 900], ['v_laptop', 1280, 720], ['v_mob', 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => fouten.push(n + ' js: ' + e.message));
  p.on('response', r => { if (r.status() >= 400) fouten.push(n + ' ' + r.status() + ' ' + r.url()); });
  await p.goto('http://127.0.0.1:8100/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const d = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth,
                                      cw: document.documentElement.clientWidth }));
  if (d.sw > d.cw + 1) fouten.push(n + ': overflow ' + d.sw + '>' + d.cw);
  for (const s of ['#aftellen', '#regels', '#inschrijven', '#contact', 'footer']) {
    await p.evaluate(x => document.querySelector(x).scrollIntoView(), s);
    await p.waitForTimeout(800);
  }
  const cij = await p.$$eval('.klok .cijfer', e => e.map(x => x.textContent));
  if (cij.some(c => !/^\d+$/.test(c))) fouten.push(n + ': klok leeg ' + cij);
  // formulier
  await p.evaluate(() => document.querySelector('#inschrijven').scrollIntoView());
  await p.waitForTimeout(500);
  await p.click('label[for="act-dnd"]');
  await p.selectOption('#aantal', '2');
  await p.click('#f button[type=submit]'); await p.waitForTimeout(500);
  await p.fill('#naam', 'Testlijk'); await p.fill('#mail', 'test@example.com');
  for (const v of ['ervaring', 'leeftijd', 'held']) await p.click(`input[name="${v}"] + span`);
  await p.click('#f button[type=submit]'); await p.waitForTimeout(400);
  await p.fill('#naam', 'Tweede lijk');
  for (const v of ['ervaring', 'leeftijd', 'held']) await p.click(`input[name="${v}"] + span`);
  await p.click('#f button[type=submit]'); await p.waitForTimeout(500);
  await p.click('#f button[type=submit]'); await p.waitForTimeout(900);
  const dank = await p.evaluate(() => !!document.querySelector('.dank-kop'));
  if (!dank) fouten.push(n + ': geen bedanktpagina');
  const d2 = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth,
                                       cw: document.documentElement.clientWidth }));
  if (d2.sw > d2.cw + 1) fouten.push(n + ': overflow op bedankt');
  console.log(n, 'flow ok, bedankt:', dank);
  await p.close();
}
await b.close();
console.log(fouten.length ? 'FOUTEN:\n' + fouten.join('\n') : 'geen fouten');
