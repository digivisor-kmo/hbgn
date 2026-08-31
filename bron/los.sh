#!/bin/sh
# Bouwt de losse versie: één HTML-bestand met alles erin, foto's en geluid als
# data-uri. Handig om door te sturen of offline te tonen. Ongeveer 1,5 MB.
#
#   sh bron/los.sh
#
# Draai eerst maak.sh, want dit gebruikt hetzelfde sjabloon.
set -e
HIER=$(cd "$(dirname "$0")" && pwd)
cd "$HIER"

python3 bouw.py layout4.tpl.html ../halloween-boardgame-night-2026.html lig,maan,mist,botten

# in de losse versie moet de privacylink naar het echte adres wijzen,
# anders loopt hij dood als je het bestand gewoon dubbelklikt
python3 - <<'PY'
p = '../halloween-boardgame-night-2026.html'
s = open(p, encoding='utf-8').read()
s = s.replace('href="/privacy"',
              'href="https://hbgn.be/privacy" target="_blank" rel="noopener noreferrer"')
open(p, 'w', encoding='utf-8').write(s)
print('privacylink absoluut gemaakt')
PY
