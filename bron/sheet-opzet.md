# De inschrijvingen in een Google Sheet

Vijf minuten werk, eenmalig. Daarna schrijft elke inschrijving zichzelf in de
spreadsheet en krijg jij er een mail over.

## 1. Maak de spreadsheet

Ga naar [sheets.new](https://sheets.new) en geef het bestand een naam,
bijvoorbeeld **HBGN 2026 inschrijvingen**.

Je hoeft zelf geen tabbladen of kolommen te maken. Het script zet die aan bij de
eerste inschrijving: een **Overzicht** met de aantallen per spel, een tabblad
**Alles** met de ruwe gegevens en een tabblad per spelletje.

**Belangrijk:** doe dit vanuit het Google-account waarvan de bevestigingsmails
later mogen vertrekken. Heb je toegang tot depoortwachter666@gmail.com, gebruik
dan dat account. De mails vertrekken namelijk vanaf het account dat het script
publiceert en dat kan je achteraf niet meer wijzigen zonder opnieuw te publiceren.

## 2. Plak het script

In de spreadsheet: **Extensies → Apps Script**.

Er opent een tabblad met een leeg bestand `Code.gs` waarin één functie staat.
Selecteer alles wat daar staat, gooi het weg en plak de volledige inhoud van
`hbgn-sheet.gs` erin.

Bovenaan het script staat:

```js
const GEHEIM = 'ZET-HIER-EEN-LANG-WACHTWOORD';
```

Vervang dat door een lange willekeurige reeks tekens. Bijvoorbeeld iets als
`hbgn-xxxx-xxxx-xxxx-xxxx-xxxx`. Verzin gerust zelf iets, als het maar lang is
en je het nergens anders gebruikt. **Die reeks heb ik straks nodig.**

Klik op het diskette-icoontje om te bewaren.

## 3. Publiceer het als webapp

Rechtsboven: **Implementeren → Nieuwe implementatie**.

- Bij het tandwiel naast "Type selecteren" kies je **Web-app**
- Beschrijving: `HBGN inschrijvingen`
- Uitvoeren als: **Ik** (jouw account)
- Wie heeft toegang: **Iedereen**

Dat laatste klinkt eng maar is het niet: zonder het geheime wachtwoord uit stap 2
weigert het script alles. De adressen van je inschrijvers zijn nergens opvraagbaar.

Klik **Implementeren**. Google vraagt je nu om toestemming te geven. Kies je
account. Komt er een scherm met "Google heeft deze app niet geverifieerd",
klik dan op **Geavanceerd** en daarna op **Ga naar HBGN inschrijvingen (onveilig)**.
Dat is jouw eigen script, dat is in orde. Geef daarna toestemming voor de
spreadsheet en voor het versturen van mail.

## 4. Geef mij twee dingen door

Na het implementeren toont Google een **web-app-URL**. Die ziet er zo uit:

```
https://script.google.com/macros/s/AKfycb.....................btw/exec
```

Stuur mij:

1. die volledige URL
2. het geheime wachtwoord uit stap 2

Dan koppel ik het formulier eraan en test ik de hele keten.

## Wat er dan gebeurt bij elke inschrijving

- Een rij per deelnemer in **Alles**, in volgorde van binnenkomst
- Dezelfde deelnemer in het tabblad van zijn spelletje, met de vragen als kolommen
- Het **Overzicht** telt opnieuw: inschrijvingen en deelnemers per spel
- Een mail naar jou met alle gegevens

## Later, als alles werkt

Bovenaan het script staan twee regels. Meer moet je niet aanpassen:

```js
const MAIL_NAAR = 'daanlybeert@gmail.com';   → depoortwachter666@gmail.com
const BEVESTIG_INSCHRIJVER = false;          → true
```

Bewaren en opnieuw implementeren (**Implementeren → Implementaties beheren →
potlood → versie: Nieuwe versie → Implementeren**). De URL blijft dezelfde.

Vanaf dan gaat de melding naar de Poortwachter en krijgt elke inschrijver een
bevestigingsmail in zijn stijl, met de datum, het adres, wat hij nog van je
krijgt, wat hij moet meebrengen en hoe hij kan afzeggen.

## Als er ooit iets misgaat in de sheet

Bovenaan de spreadsheet verschijnt een menu **HBGN** met twee knoppen:

- **Herbouw de speltabbladen uit Alles** zet alle speltabbladen opnieuw op vanuit
  de ruwe gegevens. Handig als iemand per ongeluk in een tabblad heeft geknoeid.
- **Ververs het overzicht** telt alles opnieuw.

Het tabblad **Alles** is de echte kopie. Laat dat met rust en er kan weinig
gebeuren. En omdat elke inschrijving ook per mail binnenkomt, heb je sowieso
altijd een tweede spoor.
