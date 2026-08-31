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

# de vier stijlbestanden en het paginafragment worden tot één sjabloon geplakt
python3 - <<'PY'
kop = '''<title>Halloween Boardgame Night 2026</title>

<style>
'''
css = ''.join(open(f, encoding='utf-8').read()
              for f in ['basis.css', 'blok.css', 'sfeer.css', 'snel.css'])
body = open('layout4.body.html', encoding='utf-8').read()
open('layout4.tpl.html', 'w', encoding='utf-8').write(kop + css + '</style>\n\n' + body)
PY

python3 web.py
