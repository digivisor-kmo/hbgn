/**
 * Neemt een inschrijving aan en geeft ze door aan de Google Sheet.
 *
 * Waarom via de server en niet rechtstreeks vanuit de pagina:
 * het adres van het script en het wachtwoord blijven zo geheim, er is geen
 * gedoe met CORS, en de bezoeker krijgt een eerlijk antwoord of het gelukt is.
 *
 * Verwacht in de omgeving:
 *   SHEETS_URL      de web-app-URL van het Apps Script (eindigt op /exec)
 *   SHEETS_GEHEIM   hetzelfde wachtwoord als bovenaan dat script
 */

const SPELLEN = {
  'dnd': 'D&D initiatie',
  'magic-leren': 'Magic leren spelen',
  'magic-draft': 'Magic draft',
  'atmosfear': 'Atmosfear',
  'unconscious': 'The Unconscious Mind: Nightmares'
};

const MAX_PERSONEN = 5;
const MAX_TEKST = 200;
const MAX_LADING = 20000;

function schoon(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max || MAX_TEKST);
}

function mailKlopt(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 190;
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, fout: 'methode' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, fout: 'onleesbaar' });
  }
  if (JSON.stringify(body).length > MAX_LADING) {
    return res.status(413).json({ ok: false, fout: 'te groot' });
  }

  // het onzichtbare veld: alleen een robot vult dat in
  if (schoon(body.gastenboek, 50)) {
    return res.status(200).json({ ok: true, kenmerk: 'x' });
  }

  const spelId = schoon(body.spelId, 40);
  const spel = SPELLEN[spelId];
  if (!spel) return res.status(400).json({ ok: false, fout: 'onbekend spel' });

  const binnen = Array.isArray(body.mensen) ? body.mensen : [];
  if (!binnen.length || binnen.length > MAX_PERSONEN) {
    return res.status(400).json({ ok: false, fout: 'aantal personen' });
  }

  const mensen = [];
  for (let i = 0; i < binnen.length; i++) {
    const p = binnen[i] || {};
    const naam = schoon(p.naam, 120);
    const email = schoon(p.email, 190);
    if (!naam) return res.status(400).json({ ok: false, fout: 'naam ontbreekt' });
    if (i === 0 && !mailKlopt(email)) {
      return res.status(400).json({ ok: false, fout: 'mailadres' });
    }
    if (i > 0 && email && !mailKlopt(email)) {
      return res.status(400).json({ ok: false, fout: 'tweede mailadres' });
    }
    const antw = Array.isArray(p.antwoorden) ? p.antwoorden.slice(0, 8) : [];
    mensen.push({
      naam: naam,
      email: email,
      antwoorden: antw.map(function (a) {
        return { vraag: schoon(a && a.vraag, 160), antwoord: schoon(a && a.antwoord, 160) };
      }).filter(function (a) { return a.vraag; })
    });
  }

  const url = process.env.SHEETS_URL;
  const geheim = process.env.SHEETS_GEHEIM;
  if (!url || !geheim) {
    return res.status(503).json({ ok: false, fout: 'nog niet ingesteld' });
  }

  const lading = {
    geheim: geheim,
    spel: spel,
    spelId: spelId,
    mensen: mensen,
    bron: schoon(req.headers['referer'], 300)
  };

  try {
    const stop = new AbortController();
    const wekker = setTimeout(function () { stop.abort(); }, 20000);
    const antwoord = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lading),
      redirect: 'follow',
      signal: stop.signal
    });
    clearTimeout(wekker);

    const tekst = await antwoord.text();
    let uit = null;
    try { uit = JSON.parse(tekst); } catch (e) { /* geen json */ }

    if (!antwoord.ok || !uit || uit.ok !== true) {
      console.error('sheet weigerde', antwoord.status, tekst.slice(0, 400));
      return res.status(502).json({ ok: false, fout: 'opslaan mislukt' });
    }
    return res.status(200).json({ ok: true, kenmerk: uit.id || '' });
  } catch (err) {
    console.error('sheet onbereikbaar', String(err));
    return res.status(504).json({ ok: false, fout: 'geen verbinding' });
  }
};
