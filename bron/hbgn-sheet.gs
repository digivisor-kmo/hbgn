/**
 * HBGN inschrijvingen
 * Zet elke inschrijving in deze spreadsheet en stuurt er een mail over.
 *
 * Tabbladen die vanzelf ontstaan:
 *   Overzicht  aantallen per spel, met formules, dus altijd juist
 *   Alles      elke deelnemer, ruw, in volgorde van binnenkomst. Niet aanpassen.
 *   D&D initiatie / Magic leren spelen / Magic draft / Atmosfear
 *              per spel een leesbaar tabblad met de juiste kolommen
 *
 * Raakt er iets scheef in een speltabblad, dan herstel je het via het menu
 * "HBGN" bovenaan: "Herbouw de speltabbladen uit Alles".
 */

// Het wachtwoord dat de website meestuurt. Staat ook in Vercel bij SHEETS_GEHEIM.
// Verander je het hier, dan moet het daar mee veranderen, anders komt er niets meer binnen.
const GEHEIM = 'ZET-HIER-HETZELFDE-WACHTWOORD-ALS-IN-VERCEL';

// Naar welk adres elke inschrijving gemeld wordt. Leeg laten = geen melding.
// Wil je er zelf ook een kopie van, zet er dan een komma en je eigen adres achter.
const MAIL_NAAR = 'depoortwachter666@gmail.com';

// Krijgt de inschrijver zelf een bevestiging in de stijl van de Poortwachter?
// Die mail vertrekt vanaf het Google-account waarmee dit script gepubliceerd is,
// dus vanaf depoortwachter666@gmail.com. Antwoorden komen daar ook toe.
const BEVESTIG_INSCHRIJVER = true;

const VASTE_KOLOMMEN = ['Tijdstip', 'Inschrijving', 'Naam', 'E-mailadres', 'Personen', 'Persoon'];
const ALLES_KOLOMMEN = ['Tijdstip', 'Inschrijving', 'Spel', 'Persoon', 'Van', 'Naam',
                        'E-mailadres', 'Antwoorden'];

/* ============================================================
   binnenkomende inschrijving
   ============================================================ */
function doPost(e) {
  const slot = LockService.getScriptLock();
  try {
    slot.waitLock(30000);
  } catch (err) {
    return antwoord({ ok: false, fout: 'bezet' });
  }

  try {
    const body = JSON.parse(e.postData.contents);
    if (body.geheim !== GEHEIM) return antwoord({ ok: false, fout: 'geen toegang' });

    const boek = SpreadsheetApp.getActiveSpreadsheet();
    const nu = new Date();
    const id = kenmerk(nu);
    const spel = String(body.spel || 'onbekend');
    const mensen = Array.isArray(body.mensen) ? body.mensen : [];
    if (!mensen.length) return antwoord({ ok: false, fout: 'geen deelnemers' });

    const alles = tabblad(boek, 'Alles', ALLES_KOLOMMEN);
    const blad = tabblad(boek, spel.slice(0, 95), VASTE_KOLOMMEN);

    // zorg dat elke vraag een eigen kolom heeft in het speltabblad
    const labels = (mensen[0].antwoorden || []).map(function (a) { return String(a.vraag); });
    const koppen = zorgVoorKolommen(blad, labels);

    mensen.forEach(function (p, i) {
      const antw = p.antwoorden || [];
      const paar = {};
      antw.forEach(function (a) { paar[String(a.vraag)] = String(a.antwoord); });

      alles.appendRow([
        nu, id, spel, i + 1, mensen.length, p.naam || '', p.email || '',
        antw.map(function (a) { return a.vraag + ': ' + a.antwoord; }).join(' | ')
      ]);

      const rij = koppen.map(function (kop) {
        if (kop === 'Tijdstip') return nu;
        if (kop === 'Inschrijving') return id;
        if (kop === 'Naam') return p.naam || '';
        if (kop === 'E-mailadres') return p.email || '';
        if (kop === 'Personen') return mensen.length;
        if (kop === 'Persoon') return (i + 1) + ' van ' + mensen.length;
        return paar[kop] !== undefined ? paar[kop] : '';
      });
      blad.appendRow(rij);
    });

    opmaak(blad);
    bouwOverzicht(boek);

    if (MAIL_NAAR) stuurMelding(id, spel, mensen);
    if (BEVESTIG_INSCHRIJVER && mensen[0] && mensen[0].email) {
      stuurBevestiging(mensen[0].email, spel, mensen, id);
    }

    return antwoord({ ok: true, id: id });
  } catch (err) {
    return antwoord({ ok: false, fout: String(err) });
  } finally {
    slot.releaseLock();
  }
}

function doGet() {
  return antwoord({ ok: true, hallo: 'de poortwachter luistert' });
}

function antwoord(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function kenmerk(nu) {
  const t = Utilities.formatDate(nu, 'Europe/Brussels', 'yyMMdd-HHmmss');
  return t + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
}

/* ============================================================
   tabbladen
   ============================================================ */
function tabblad(boek, naam, koppen) {
  let blad = boek.getSheetByName(naam);
  if (!blad) {
    blad = boek.insertSheet(naam);
    blad.appendRow(koppen);
    blad.setFrozenRows(1);
    blad.getRange(1, 1, 1, koppen.length).setFontWeight('bold');
  }
  return blad;
}

function zorgVoorKolommen(blad, labels) {
  let koppen = blad.getRange(1, 1, 1, Math.max(1, blad.getLastColumn()))
    .getValues()[0].filter(String);
  const ontbreekt = labels.filter(function (l) { return koppen.indexOf(l) === -1; });
  if (ontbreekt.length) {
    blad.getRange(1, koppen.length + 1, 1, ontbreekt.length).setValues([ontbreekt])
      .setFontWeight('bold');
    koppen = koppen.concat(ontbreekt);
  }
  return koppen;
}

function opmaak(blad) {
  blad.autoResizeColumns(1, blad.getLastColumn());
  blad.getRange(1, 1, 1, blad.getLastColumn()).setBackground('#efe6fa');
  const t = blad.getRange(2, 1, Math.max(1, blad.getLastRow() - 1), 1);
  t.setNumberFormat('dd/MM/yyyy HH:mm');
}

function bouwOverzicht(boek) {
  const alles = boek.getSheetByName('Alles');
  const rijen = alles ? alles.getDataRange().getValues().slice(1) : [];

  // per spel tellen we de deelnemers en de unieke inschrijvingen.
  // Bewust in het script en niet met formules: de scheidingstekens in
  // spreadsheetformules verschillen per taalinstelling.
  const perSpel = {};
  const alleBoekingen = {};
  let laatste = null;
  rijen.forEach(function (r) {
    const tijd = r[0], id = String(r[1]), spel = String(r[2]);
    if (!spel) return;
    if (!perSpel[spel]) perSpel[spel] = { mensen: 0, boekingen: {} };
    perSpel[spel].mensen++;
    perSpel[spel].boekingen[id] = 1;
    alleBoekingen[id] = 1;
    if (tijd instanceof Date && (!laatste || tijd > laatste)) laatste = tijd;
  });

  let blad = boek.getSheetByName('Overzicht');
  if (!blad) blad = boek.insertSheet('Overzicht', 0);
  blad.clear();

  blad.getRange('A1').setValue('Halloween Boardgame Night, inschrijvingen')
    .setFontSize(14).setFontWeight('bold');
  blad.getRange('A2')
    .setValue('bijgewerkt op ' +
      Utilities.formatDate(new Date(), 'Europe/Brussels', 'dd/MM/yyyy HH:mm'))
    .setFontColor('#777777');

  blad.getRange('A4:C4').setValues([['Spel', 'Inschrijvingen', 'Deelnemers']])
    .setFontWeight('bold').setBackground('#efe6fa');

  const namen = Object.keys(perSpel).sort();
  let rij = 5;
  namen.forEach(function (naam) {
    blad.getRange(rij, 1, 1, 3).setValues([[
      naam, Object.keys(perSpel[naam].boekingen).length, perSpel[naam].mensen
    ]]);
    rij++;
  });
  if (!namen.length) {
    blad.getRange(rij, 1).setValue('nog geen inschrijvingen').setFontColor('#777777');
    rij++;
  }

  blad.getRange(rij, 1, 1, 3).setValues([[
    'Samen', Object.keys(alleBoekingen).length, rijen.length
  ]]).setFontWeight('bold');

  blad.getRange(rij + 2, 1).setValue('Laatste inschrijving');
  blad.getRange(rij + 2, 2).setValue(laatste
    ? Utilities.formatDate(laatste, 'Europe/Brussels', 'dd/MM/yyyy HH:mm')
    : 'nog geen');

  blad.setColumnWidth(1, 240);
  blad.setColumnWidth(2, 130);
  blad.setColumnWidth(3, 110);
}

/* ============================================================
   mails
   ============================================================ */
function stuurMelding(id, spel, mensen) {
  const regels = mensen.map(function (p, i) {
    const antw = (p.antwoorden || []).map(function (a) {
      return '      ' + a.vraag + ' ' + a.antwoord;
    }).join('\n');
    return '  ' + (i + 1) + '. ' + (p.naam || '?') +
      (p.email ? '  <' + p.email + '>' : '') + (antw ? '\n' + antw : '');
  }).join('\n\n');

  MailApp.sendEmail({
    to: MAIL_NAAR,
    subject: 'Nieuwe inschrijving: ' + spel + ' (' + mensen.length +
             (mensen.length === 1 ? ' persoon)' : ' personen)'),
    body: 'Er staat iemand op de lijst.\n\n' +
      'Spel: ' + spel + '\n' +
      'Kenmerk: ' + id + '\n\n' + regels + '\n\n' +
      'De volledige lijst staat in de spreadsheet:\n' +
      SpreadsheetApp.getActiveSpreadsheet().getUrl() + '\n'
  });
}

function stuurBevestiging(naar, spel, mensen, id) {
  const wie = mensen.map(function (p) { return p.naam; }).filter(String).join(', ');
  const aantal = mensen.length + (mensen.length === 1 ? ' persoon' : ' personen');
  MailApp.sendEmail({
    to: naar,
    subject: 'Je staat op mijn lijst: ' + spel,
    name: 'De Poortwachter',
    body:
      'Zo. Je staat op mijn lijst.\n\n' +
      'Ontsnappen kan niet meer.\n\n' +
      'WAT IK GENOTEERD HEB\n' +
      '  Spelletje   ' + spel + '\n' +
      '  Personen    ' + aantal + (wie ? ' (' + wie + ')' : '') + '\n' +
      '  Kenmerk     ' + id + '\n\n' +
      'WANNEER EN WAAR\n' +
      '  Zaterdag 7 november 2026\n' +
      '  Kerk Minnestraat, Lebbeke\n' +
      '  De deur gaat open om 18:00 en gaat rond middernacht weer toe.\n\n' +
      'WAT JE NOG VAN MIJ KRIJGT\n' +
      '  Mijn vier begeleide spelletjes lopen allemaal tegelijk. Zodra ik het\n' +
      '  uur van het jouwe beslist heb, mail ik je opnieuw.\n' +
      '  Wie te laat komt, speelt niet mee. Dat meen ik.\n\n' +
      'WAT HET KOST\n' +
      '  Atmosfear gratis, D&D 5 euro, Magic leren spelen 15 euro met twee\n' +
      '  Jumpstart boosters mee naar huis, de draft 20 euro met drie boosters\n' +
      '  die je zelf opent en houdt. Bij alles zit een hapje en een drankje.\n' +
      '  Betalen doe je ter plaatse, cash of met je smartphone.\n' +
      '  Binnenkomen blijft gratis.\n\n' +
      'WAT JE MOET MEEBRENGEN\n' +
      '  Niets, behalve wat je moet betalen. Van het spel hoef je niets te\n' +
      '  kennen, dat is nu net de bedoeling.\n\n' +
      'KAN JE TOCH NIET\n' +
      '  Antwoord gewoon op deze mail. Dan geef ik je plaats aan iemand die\n' +
      '  wel durft. Zwijgen is erger dan afzeggen.\n\n' +
      'Alles wat ik onderweg nog beslis zet ik op mijn Facebook-event:\n' +
      'https://www.facebook.com/events/1445920600735035/\n\n' +
      'Tot dan. Ik tel af.\n\n' +
      'Onvriendelijke groeten,\n' +
      'De Poortwachter\n' +
      'hbgn.be\n'
  });
}

/* ============================================================
   herstel: de speltabbladen opnieuw opbouwen uit Alles
   ============================================================ */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('HBGN')
    .addItem('Herbouw de speltabbladen uit Alles', 'herbouw')
    .addItem('Ververs het overzicht', 'ververs')
    .addToUi();
}

function ververs() {
  bouwOverzicht(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getActive().toast('Overzicht bijgewerkt.');
}

function herbouw() {
  const boek = SpreadsheetApp.getActiveSpreadsheet();
  const alles = boek.getSheetByName('Alles');
  if (!alles) return;
  const data = alles.getDataRange().getValues().slice(1);

  boek.getSheets().forEach(function (s) {
    const n = s.getName();
    if (n !== 'Alles' && n !== 'Overzicht') boek.deleteSheet(s);
  });

  data.forEach(function (r) {
    const nu = r[0], id = r[1], spel = String(r[2]), nr = r[3], van = r[4];
    const naam = r[5], email = r[6], antw = String(r[7] || '');
    const paren = antw ? antw.split(' | ').map(function (x) {
      const i = x.indexOf(': ');
      return i === -1 ? [x, ''] : [x.slice(0, i), x.slice(i + 2)];
    }) : [];
    const blad = tabblad(boek, spel.slice(0, 95), VASTE_KOLOMMEN);
    const koppen = zorgVoorKolommen(blad, paren.map(function (p) { return p[0]; }));
    const map = {};
    paren.forEach(function (p) { map[p[0]] = p[1]; });
    blad.appendRow(koppen.map(function (kop) {
      if (kop === 'Tijdstip') return nu;
      if (kop === 'Inschrijving') return id;
      if (kop === 'Naam') return naam;
      if (kop === 'E-mailadres') return email;
      if (kop === 'Personen') return van;
      if (kop === 'Persoon') return nr + ' van ' + van;
      return map[kop] !== undefined ? map[kop] : '';
    }));
  });

  boek.getSheets().forEach(function (s) {
    if (s.getName() !== 'Alles' && s.getName() !== 'Overzicht') opmaak(s);
  });
  bouwOverzicht(boek);
  SpreadsheetApp.getActive().toast('Speltabbladen opnieuw opgebouwd.');
}
