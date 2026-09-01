# hbgn.be

De site van **Halloween Boardgame Night**, vierde editie. Zaterdag 7 november 2026,
18:00 tot ongeveer 24:00, Kerk Minnestraat in Lebbeke. Gratis inkom, in samenwerking
met Buurtatelier LAB. Eén pagina plus een privacypagina, met een inschrijfformulier
dat naar een Google Sheet schrijft.

Deze repository is publiek. **Er mag geen enkel wachtwoord, adres van een Apps
Script of spreadsheet-ID in terechtkomen.** Die staan in Vercel en in het script zelf.

---

## Hoe het in elkaar zit

Geen framework, geen bundler, geen buildstap bij het publiceren. `index.html` is één
groot gegenereerd bestand: alle CSS staat in een `<style>` bovenaan en de hele pagina
wordt door JavaScript in de DOM gezet. Dat bestand bewerk je **nooit** met de hand.
Je bewerkt de bron in `bron/` en bouwt opnieuw.

```
/                     wat Vercel publiceert
  index.html          gegenereerd, niet bewerken
  privacy.html        gegenereerd, niet bewerken
  assets/             foto's als webp in drie maten, plus sfeer.mp3
  fonts/              zelf gehoste woff2
  api/inschrijven.js  serverfunctie van Vercel, wél met de hand bewerken
  vercel.json         caching, cleanUrls, beveiligingskoppen
  sitemap.xml, robots.txt, iconen, og.jpg

bron/                 hier werk je (wordt niet gepubliceerd, zie .vercelignore)
  basis.css           kleuren, lettertypes, de hero, de knoppen
  blok.css            componenten: spelkaarten, regelkaarten, formuliervelden, chips
  sfeer.css           de banden, de sluiers, de klok, de voet, de dialogen, de spin
  snel.css            overrides onder 900 px, puur voor snelheid op een telefoon
  fonts.css           de @font-face-regels
  layout4.body.html   de hele pagina: de teksten, de data en alle JavaScript
  privacy.body.html   de privacypagina, statische HTML met een klein scriptje
  bundle.json         de SVG-tekeningen en het geluid, 2 MB, niet met de hand aanraken
  web.py              bouwt index.html en privacy.html
  bouw.py             bouwt de losse versie met alles als data-uri
  maak.sh             plakt de CSS samen en roept web.py aan
  los.sh              bouwt de losse versie
  deploy.py           publiceren via de Vercel API, alleen als noodoplossing
  env.py              instellingen in Vercel zetten, alleen als noodoplossing
  hbgn-sheet.gs       het Apps Script dat in de Google Sheet draait
  sheet-opzet.md      hoe je die Sheet opzet
  test/               een lokale server en een paar Playwright-tests
```

## Werken

```sh
sh bron/maak.sh                 # bouwt index.html en privacy.html opnieuw
node bron/test/server.mjs       # http://127.0.0.1:8100, met brotli en cleanUrls
```

De testserver doet hetzelfde als Vercel: hij dient de hoofdmap, laat `/privacy`
werken zonder `.html` en draait `api/inschrijven.js` als er naar `/api/inschrijven`
gepost wordt. Wil je de hele inschrijfketen lokaal testen zonder de echte Sheet te
vervuilen, start hem dan met de nagebootste Sheet die erin zit:

```sh
SHEETS_URL=http://127.0.0.1:8100/nep-sheet SHEETS_GEHEIM=test-geheim node bron/test/server.mjs
```

Tests (vereisen `npm install playwright`):

```sh
node bron/test/vol.mjs     # het hele inschrijfformulier op drie schermbreedtes
node bron/test/priv.mjs    # de privacypagina
node bron/test/meten.mjs   # snelheid met een trage processor en een traag netwerk
node bron/test/klik2.mjs   # klikken gaan door de spin heen
node bron/test/scrol.mjs   # de spin blijft aan het scherm hangen, niet aan de pagina
```

## Publiceren

Vercel hangt aan deze repository met `main` als productiebranch.

```sh
sh bron/maak.sh
git add -A && git commit -m "..." && git push
```

Meer is het niet. Binnen de minuut staat het op https://hbgn.be.

`bron/deploy.py` publiceert rechtstreeks via de Vercel API en heeft daarvoor
`VERCEL_TOKEN` en `VERCEL_TEAM` nodig. Gebruik dat alleen als de koppeling met
GitHub stuk is.

**Let op:** een gewijzigde omgevingsvariabele in Vercel telt pas na een nieuwe
publicatie. Verander je er een, publiceer dan opnieuw, anders draait de site nog
met de oude waarde.

## Het inschrijfformulier

```
hbgn.be  →  /api/inschrijven  →  Apps Script  →  Google Sheet + twee mails
 (pagina)    (Vercel functie)     (web-app)
```

De pagina praat nooit rechtstreeks met Google. De serverfunctie controleert het
spel, het aantal personen (maximaal 5), de namen, de mailadressen en de lengte van
elk veld en stuurt het door met een gedeeld wachtwoord. Er zit een onzichtbaar veld
`gastenboek` in het formulier: wordt dat ingevuld, dan is het een robot en verdwijnt
de inzending zonder dat er iets bewaard wordt.

In Vercel staan twee instellingen: `SHEETS_URL` (het `/exec`-adres van het Apps
Script) en `SHEETS_GEHEIM` (hetzelfde wachtwoord als bovenaan `hbgn-sheet.gs`).
Beide staan bewust **niet** in deze repository.

Het script draait op het Google-account van de Poortwachter. Elke inschrijving komt
in de Sheet, er vertrekt een melding naar de organisatie en de inschrijver krijgt een
bevestiging in de stijl van de Poortwachter. Pas je `hbgn-sheet.gs` aan, dan moet je
in Apps Script opnieuw implementeren: **Implementeren → Implementaties beheren →
potlood → Versie: Nieuwe versie**. Zo blijft het `/exec`-adres hetzelfde. Kies je
"Nieuwe implementatie", dan krijg je een nieuw adres en moet `SHEETS_URL` in Vercel
mee.

## Een spel toevoegen

De spellen staan in `ACTIVITEITEN` bovenaan `layout4.body.html`. Daar hangt alles
aan vast: de kaart in het formulier, het infovenster en de bijvragen. Vergeet deze
vijf plekken niet, want die weten van niets:

1. `api/inschrijven.js`, de lijst `SPELLEN`. Staat het id daar niet in, dan weigert
   de server de inschrijving.
2. `bron/web.py`, de lijst `LATER`, als het spel een figuur krijgt die er nog niet
   in zit. De tekeningen in `bundle.json` die nog vrij zijn: `bot`, `puin`, `ruit`.
3. De `VB`-lijst in `layout4.body.html`, met `%%VB:naam%%` voor diezelfde figuur.
4. De teksten die tellen of opsommen: de zin onder de knop in de hero, regel 02 en
   regel 03 in `REGELS`.
5. `bron/hbgn-sheet.gs`, alleen de teksten: het aantal spelletjes en het prijzenlijstje
   in de bevestigingsmail.

De Sheet zelf hoef je niet aan te passen. Die maakt vanzelf een tabblad met de naam
van het spel en zet voor elke bijvraag vanzelf een kolom klaar. Wijzig je het script,
dan moet je in Apps Script wel opnieuw implementeren, zie hierboven.

## Schrijfregels

De hele site staat in de stem van **De Poortwachter**, de figuur van de cassette uit
Atmosfear. Kort, droog, licht dreigend, nooit vriendelijk. Hij noemt bezoekers
lijkwormpjes. Hij belooft niets.

- Nederlands.
- **Geen em-dashes.** Nergens, ook niet in commentaar.
- **Geen komma voor "en".**
- Geen AI-jargon en geen marketingtaal.
- Het mailadres van de Poortwachter mag nooit als zichtbare tekst op de pagina
  staan, alleen achter een `mailto:`-link. Anders oogst een robot het.
- Externe links openen in een nieuw tabblad. Dat gebeurt automatisch: er loopt een
  scriptje over alle `a[href^="http"]` dat `target` en `rel` zet.

## Vormgeving

Paars (`--paars` #9238e6) en groen (`--groen` #4ab865) op zwart. Archivo voor de
tekst, Archivo Black voor de koppen en de labels, Creepster als sierletter voor
"BOE", de handtekening en de grafsteen.

De pagina is opgebouwd uit **banden** (`.band`). Elke band heeft een eigen foto die
trager beweegt dan de tekst, met daarover een stilstaande sluier (`.band-sluier`) die
de banden in elkaar laat overvloeien. Die sluier moet los blijven van de bewegende
foto, anders schuiven de overgangen mee en zie je harde randen.

Blokken komen tevoorschijn met `.op` plus `--i` voor de volgorde. Een
IntersectionObserver zet er `.in` op.

## Valkuilen

Dingen die al een keer stukgegaan zijn.

1. **De padgegevens van de SVG-symbolen mogen nooit afgerond worden.** Dat bespaart
   nauwelijks bytes en het breekt de gaten in de letters van het woordmerk.
2. **Creepster laadt pas na `load`.** Tot dan staat er `html:not(.laat)` in `snel.css`
   dat overal Archivo Black oplegt. Voeg je ergens een Creepster-element toe, zet het
   dan mee in die lijst, anders springt de letter zichtbaar om. Elke pagina die
   Creepster gebruikt heeft het scriptje nodig dat `.laat` op `<html>` zet.
3. **De vier zware tekeningen** (schedel, joker, dobbelsteen, zandloper) staan als
   tekst in de pagina in een `<script type="text/hbgn-defs">` en worden pas ontleed
   als de browser tijd over heeft. Bestaande `<use>`-verwijzingen worden daarna
   opnieuw gezet, want die zoeken niet vanzelf opnieuw.
4. **Tijdens het scrollen wordt niets opgemeten.** `meet()` berekent alle posities één
   keer, `schuif()` schrijft alleen nog. Zet daar nooit een `getBoundingClientRect()`
   in, dan is de snelheidswinst meteen weg.
5. **De spin** ligt in een `position:fixed` veld met `pointer-events:none`, op
   z-index 55. Ze mag nooit een klik tegenhouden. Ze houdt zich in tijdens een
   dialoog, tijdens het verzenden en terwijl iemand in een veld typt.
   Ze reageert wel op de cursor: staat ze stil, dan draait ze jouw kant op, en
   kom je te dichtbij dan schiet ze het beeld uit. Dat gebeurt met een luisteraar
   op `window` die de cursor vergelijkt met de positie die de code zelf al
   bijhoudt. **Zet daar nooit `pointer-events:auto` voor op haar lijf**, dan vangt
   een bewegend beest van meer dan honderd pixels klikken af boven de knoppen.
   Meet in die luisteraar ook niets op, want hij loopt bij elke muisbeweging.
   Alles wat de spin gepland heeft hangt aan de teller `beurt`: schrikt ze, dan
   telt die door en vervalt de rest vanzelf. Nieuwe vertragingen dus altijd via
   `later()` en niet via `setTimeout`.
6. **Voeg geen browseropslag toe** waar de pagina van afhangt. Er zit nu niets in en
   dat houdt de privacypagina eerlijk: die zegt dat de site geen cookies zet.
7. Google Tag Manager (`GTM-W396B9PH`) staat in de pagina maar de container is leeg.
   Komt daar iets in dat cookies zet, dan is een cookiebanner in België verplicht en
   moet de privacypagina mee aangepast worden.

## De losse versie

`sh bron/los.sh` maakt `halloween-boardgame-night-2026.html` in de hoofdmap: één
bestand van ongeveer 1,5 MB met alles erin, om door te sturen of offline te tonen.
Dat bestand hoort **niet** in de repository, het staat in `.gitignore`.

## Wat er nog niet beslist is

Starturen per spel, de capaciteit van Atmosfear en van Magic leren spelen, wat er te
eten en te drinken is en wie de drie partners zijn. Die staan nu als "weet ik nog
niet" en "nog niet verklapt" op de pagina. Er is ook nog geen maximum per spel en
geen wachtlijst: het formulier noteert alles.

De prijzen liggen wel vast: Atmosfear gratis, D&D 5 euro, The Unconscious Mind:
Nightmares 5 euro, Magic leren spelen 15 euro, de draft 20 euro. Betalen gebeurt ter plaatse, cash of met de smartphone.
