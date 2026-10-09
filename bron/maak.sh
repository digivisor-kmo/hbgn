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

# de stijlbestanden, het paginafragment en de sfeerlaag worden tot één sjabloon geplakt
python3 - <<'PY'
kop = '''<title>Halloween Boardgame Night 2026</title>

<style>
'''
css = ''.join(open(f, encoding='utf-8').read()
              for f in ['basis.css', 'blok.css', 'sfeer.css', 'snel.css', 'v2.css'])
body = open('layout4.body.html', encoding='utf-8').read()
# versie 2: de sfeerlaag komt als eigen script na het hoofdscript
v2 = open('v2.js', encoding='utf-8').read()
assert '</script' not in v2.lower(), 'v2.js mag geen </script bevatten'
body = body.rstrip() + '\n\n<script>\n' + v2.strip() + '\n</script>\n'
open('layout4.tpl.html', 'w', encoding='utf-8').write(kop + css + '</style>\n\n' + body)
PY

python3 web.py
