#!/bin/sh
# Bouwt de site opnieuw uit de bronbestanden.
#
#   sh bron/maak.sh
#
# Resultaat: index.html en privacy.html in de hoofdmap van de repository,
# plus assets/sfeer.mp3. Dat is precies wat Vercel publiceert, dus na het
# bouwen volstaat committen en pushen.
set -e
HIER=$(cd "$(dirname "$0")" && pwd)
cd "$HIER"

# de sjablonen: versie 2 voor de startpagina, versie 1 voor de opmaak van de privacypagina
python3 - <<'PY'
kop = '''<title>Halloween Boardgame Night 2026</title>

<style>
'''
def lees(f): return open(f, encoding='utf-8').read()

# versie 1: alleen nog nodig voor de opmaak van de privacypagina
css = ''.join(lees(f) for f in ['basis.css', 'blok.css', 'sfeer.css', 'snel.css'])
open('layout4.tpl.html', 'w', encoding='utf-8').write(kop + css + '</style>\n\n' + lees('layout4.body.html'))

# versie 2: een eigen pagina, met de gegevens, de logica, de spin en de sfeerlaag
app = '(function(){\n"use strict";\n' + lees('v2/data.js') + '\n' + lees('v2/app.js') + '\n' + lees('v2/spin.js') + '\n})();'
sfeer = lees('v2/sfeer.js')
for naam, t in [('app', app), ('sfeer', sfeer)]:
    assert '</script' not in t.lower(), naam + ' mag geen </script bevatten'
v2 = (kop + lees('v2/stijl.css') + '</style>\n\n' + lees('v2/pagina.html').rstrip() +
      '\n\n<script>\n' + app + '\n</script>\n<script>\n' + sfeer.strip() + '\n</script>\n')
open('v2.tpl.html', 'w', encoding='utf-8').write(v2)
PY

python3 web.py
