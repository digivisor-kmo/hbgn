import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:8100/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
// haar eigen wandeling stilleggen en haar op een vaste plek zetten
await p.evaluate(() => {
  const s = document.querySelector('.spin');
  s.style.setProperty('--dur','0ms');
  s.style.setProperty('--x','700px'); s.style.setProperty('--y','400px');
  s.classList.add('aan');
});
await p.waitForTimeout(500);
const a = await p.evaluate(() => { const r = document.querySelector('.spin').getBoundingClientRect(); return [r.top, r.left]; });
const b0 = await p.evaluate(() => { const r = document.querySelector('.spin').getBoundingClientRect(); return [r.top, r.left]; });
await p.evaluate(() => window.scrollBy(0, 1500));
await p.waitForTimeout(500);
const c = await p.evaluate(() => { const r = document.querySelector('.spin').getBoundingClientRect(); return [r.top, r.left]; });
await p.evaluate(() => window.scrollBy(0, -900));
await p.waitForTimeout(500);
const d = await p.evaluate(() => { const r = document.querySelector('.spin').getBoundingClientRect(); return [r.top, r.left]; });
console.log('controle zonder scroll:', a.map(Math.round), '->', b0.map(Math.round));
console.log('na +1500 scroll       :', c.map(Math.round));
console.log('na -900 scroll        :', d.map(Math.round));
const stil = [b0,c,d].every(q => Math.abs(q[0]-a[0]) < 2 && Math.abs(q[1]-a[1]) < 2);
console.log(stil ? 'blijft op haar plek, scroll doet haar niets' : 'BEWEEGT MEE MET DE PAGINA');
await b.close();
