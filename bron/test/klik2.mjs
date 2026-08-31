import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:8100/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
const k = await p.$('.infoknop');
await k.scrollIntoViewIfNeeded();
await p.waitForTimeout(1400);
const doel = await p.evaluate(() => {
  const k = document.querySelector('.infoknop');
  const r = k.getBoundingClientRect();
  const s = document.querySelector('.spin');
  s.style.setProperty('--sp','180px'); s.style.setProperty('--dur','0ms');
  s.style.setProperty('--x', Math.round(r.x + r.width/2) + 'px');
  s.style.setProperty('--y', Math.round(r.y + r.height/2) + 'px');
  s.classList.add('aan');
  return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
});
await p.waitForTimeout(400);
console.log('element op dat punt:', await p.evaluate(([x,y]) => {
  const e = document.elementFromPoint(x,y); return e ? e.tagName + '.' + e.className : 'niets'; }, [doel.x, doel.y]));
await p.mouse.click(doel.x, doel.y);
await p.waitForTimeout(700);
console.log('venster open:', await p.evaluate(() => !!document.querySelector('dialog[open]')));
// ook hover/tekstselectie testen: ligt de spin in de weg voor het aanwijzen?
console.log('pointer-events veld:', await p.evaluate(() => getComputedStyle(document.querySelector('.spinnenveld')).pointerEvents));
console.log('pointer-events spin:', await p.evaluate(() => getComputedStyle(document.querySelector('.spin')).pointerEvents));
await b.close();
