# hbgn.be

De site van Halloween Boardgame Night, vierde editie. Zaterdag 7 november 2026,
Kerk Minnestraat in Lebbeke, van 18:00 tot ongeveer 24:00. Gratis inkom.

Live op **https://hbgn.be**.

## Aan de slag

```sh
git clone https://github.com/digivisor-kmo/hbgn.git
cd hbgn
sh bron/maak.sh                 # bouwt index.html en privacy.html uit bron/
node bron/test/server.mjs       # http://127.0.0.1:8100
```

Publiceren is een push naar `main`. Vercel doet de rest.

Wil je aan de site werken, lees dan eerst **[CLAUDE.md](CLAUDE.md)**. Daar staat hoe
alles in elkaar zit, hoe het formulier werkt, welke schrijfregels gelden en welke
valkuilen er al een keer toegeslagen hebben.

## Wat staat waar

De bewerkbare bestanden staan in `bron/`. Alles in de hoofdmap is gegenereerd of
statisch en wordt door Vercel gepubliceerd. `index.html` en `privacy.html` bewerk je
nooit met de hand.

## Geen geheimen

Deze repository is publiek. Het wachtwoord van de Google Sheet, het adres van het
Apps Script en het spreadsheet-ID staan hier niet in. Die leven in de instellingen
van Vercel en in het script zelf.
