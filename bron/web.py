"""Bouwt de webversie: beelden en geluid als echte bestanden in plaats van data-uri's.

Draait vanuit bron/ en schrijft index.html, privacy.html en assets/ naar de
hoofdmap van de repository. Wat daar komt te staan is wat Vercel publiceert.
"""
import base64, json, math, os, re, sys

HIER   = os.path.dirname(os.path.abspath(__file__))
WORTEL = os.path.dirname(HIER)          # de hoofdmap van de repository
def bron(n): return os.path.join(HIER, n)
def uit(n):  return os.path.join(WORTEL, n)

b = json.load(open(bron('bundle.json')))
SYM, IMG = b['sym'], b['img']

# wat de affiche nodig heeft staat meteen in de pagina,
# de decoratieve figuren komen pas als de pagina er staat
DIRECT = ['wordmerk', 'datum', 'gratis', 'logo']
LATER  = ['dobbelsteen', 'jokerkaart', 'schedel', 'zandloper', 'meeple']
GEBRUIKT = DIRECT + LATER
BEELDEN  = ['lig', 'maan', 'mist', 'botten']
GELUID   = 'sfeer'

os.makedirs(uit('assets'), exist_ok=True)


def schrijf(naam, uri, ext):
    kop, data = uri.split(',', 1)
    pad = uit('assets/%s.%s' % (naam, ext))
    open(pad, 'wb').write(base64.b64decode(data))
    return '/assets/%s.%s' % (naam, ext), os.path.getsize(pad)


paden, totaal = {}, 0
paden[GELUID], n = schrijf(GELUID, IMG[GELUID], 'mp3'); totaal += n

# de beelden staan al als webp klaar, in drie maten voor drie soorten schermen
MATEN = {
    'lig':    {'klein': 900, 'gewoon': 1600, 'groot': 2000},
    'maan':   {'klein': 700, 'gewoon': 1400, 'groot': 1400},
    'mist':   {'klein': 700, 'gewoon': 1400, 'groot': 1400},
    'botten': {'klein': 700, 'gewoon': 1400, 'groot': 1400},
}
def beeld(k, soort):
    return '/assets/%s-%d.webp' % (k, MATEN[k][soort])

# het spinnenweb dat bouw.py ook maakt
R, N, RINGS = 260, 7, 5
angs = [i * (math.pi / 2) / (N - 1) for i in range(N)]
strands = ['M0,0 L%.1f,%.1f' % (R * math.cos(a), R * math.sin(a)) for a in angs]
arcs = []
for k in range(1, RINGS + 1):
    r = R * k / (RINGS + 0.4)
    pts = [(r * math.cos(a), r * math.sin(a)) for a in angs]
    d = 'M%.1f,%.1f' % pts[0]
    for i in range(1, len(pts)):
        x0, y0 = pts[i - 1]; x1, y1 = pts[i]
        d += ' Q%.1f,%.1f %.1f,%.1f' % (((x0 + x1) / 2) * .8, ((y0 + y1) / 2) * .8, x1, y1)
    arcs.append(d)
WEB = ('<svg viewBox="0 0 %d %d" fill="none" stroke="currentColor" stroke-width="1.6" '
       'stroke-linecap="round">%s%s</svg>'
       % (R, R, ''.join('<path d="%s"/>' % s for s in strands),
          ''.join('<path d="%s" stroke-width="1.1"/>' % a for a in arcs)))

def symbolen(namen):
    # de padgegevens blijven zoals ze zijn: afronden breekt de gaten in de letters
    return ''.join('<symbol id="s-%s" viewBox="%s">%s</symbol>'
                   % (k, SYM[k]['viewBox'], SYM[k]['inner']) for k in namen)

DEFS = ('<svg class="defs" aria-hidden="true" focusable="false"><defs>'
        + symbolen(DIRECT) + '</defs></svg>')
# de zware tekeningen staan als tekst in de pagina en worden pas ontleed
# wanneer de browser tijd over heeft
_later = symbolen(LATER)
assert '</script' not in _later.lower()
FIGDEFS = '<script type="text/hbgn-defs" id="fig-defs">' + _later + '</' + 'script>'

s = open(bron('layout4.tpl.html'), encoding='utf-8').read()
s = s.replace('%%DEFS%%', DEFS + FIGDEFS).replace('%%WEB%%', WEB)
s = re.sub(r'%%VB:([a-z0-9_]+)%%',
           lambda m: '0 0 %s %s' % tuple(SYM[m.group(1)]['viewBox'].split()[2:]), s)
s = re.sub(r'%%IMG:([a-z0-9_]+)%%', lambda m: paden[m.group(1)], s)
s = s.replace('%%INSCHRIJFLINK%%', 'https://hbgn.be/#inschrijven')

def vars(soort):
    return ''.join('--img-%s:url("%s");' % (k, beeld(k, soort)) for k in BEELDEN)

css = (open(bron('fonts.css'), encoding='utf-8').read().strip() + '\n'
       + ':root{' + vars('gewoon') + '}\n'
       + '@media (max-width:760px){:root{' + vars('klein') + '}}\n'
       + '@media (min-width:1700px){:root{' + vars('groot') + '}}')
ix = s.index('<style>') + len('<style>')
s = s[:ix] + '\n' + css + '\n' + s[ix:]
assert '%%' not in s, 'onvervangen marker'

kop = '''<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#000000">
<link rel="canonical" href="https://hbgn.be/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" as="font" type="font/woff2" href="/fonts/archivo-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/archivoblack-latin.woff2" crossorigin>
<link rel="preload" as="image" href="/assets/lig-900.webp" fetchpriority="high" media="(max-width:760px)">
<link rel="preload" as="image" href="/assets/lig-1600.webp" fetchpriority="high" media="(min-width:761px)">
<meta name="description" content="Halloween Boardgame Night 2026. Zaterdag 7 november, Kerk Minnestraat Lebbeke, van 18:00 tot ongeveer 24:00. Gratis inkom. Inschrijven voor D&amp;D, Magic en Atmosfear.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://hbgn.be/">
<meta property="og:site_name" content="Halloween Boardgame Night">
<meta property="og:locale" content="nl_BE">
<meta property="og:title" content="Halloween Boardgame Night 2026">
<meta property="og:description" content="Zaterdag 7 november, Kerk Minnestraat Lebbeke. Gratis inkom. Schrijf je in voor D&amp;D, Magic of Atmosfear.">
<meta property="og:image" content="https://hbgn.be/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<!-- Google Tag Manager, geladen zodra de pagina rustig is -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});
function laad(){if(w.__gtm)return;w.__gtm=1;
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
f.parentNode.insertBefore(j,f);}
if(d.readyState==='complete')setTimeout(laad,1);
else w.addEventListener('load',function(){
  (w.requestIdleCallback||function(c){setTimeout(c,900)})(laad,{timeout:2500});});
['pointerdown','keydown','touchstart'].forEach(function(e){
  w.addEventListener(e,laad,{once:true,passive:true});});
})(window,document,'script','dataLayer','GTM-W396B9PH');</script>
<!-- End Google Tag Manager -->
'''
GTM_BODY = '''<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W396B9PH"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager -->
'''
ix = s.index('</style>') + len('</style>')
stijl = s[:ix]                      # alles tot en met </style>, met de letters en de kleuren
doc = kop + stijl + '\n</head>\n<body>\n' + GTM_BODY + s[ix:].rstrip() + '\n</body>\n</html>\n'
open(uit('index.html'), 'w', encoding='utf-8').write(doc)
print('index.html %.0f kB, losse bestanden %.0f kB' % (len(doc) / 1024, totaal / 1024))

# ---- de privacypagina, met dezelfde opmaak maar een eigen adres ----
pkop = kop.replace('<title>Halloween Boardgame Night 2026</title>',
                   '<title>Privacy | Halloween Boardgame Night</title>')
pkop = pkop.replace('<link rel="canonical" href="https://hbgn.be/">',
                    '<link rel="canonical" href="https://hbgn.be/privacy">')
pkop = pkop.replace('<meta property="og:url" content="https://hbgn.be/">',
                    '<meta property="og:url" content="https://hbgn.be/privacy">')
pkop = pkop.replace('<meta property="og:title" content="Halloween Boardgame Night 2026">',
                    '<meta property="og:title" content="Wat ik met je gegevens doe">')
pkop = pkop.replace(
    '<meta name="description" content="Halloween Boardgame Night 2026. Zaterdag 7 november, '
    'Kerk Minnestraat Lebbeke, van 18:00 tot ongeveer 24:00. Gratis inkom. Inschrijven voor '
    'D&amp;D, Magic en Atmosfear.">',
    '<meta name="description" content="Wat er gebeurt met de gegevens die je invult bij je '
    'inschrijving voor Halloween Boardgame Night: wat we vragen, waarom, wie het ziet en '
    'hoe lang we het bijhouden.">')
pkop = pkop.replace('<meta property="og:description" content="Zaterdag 7 november, Kerk '
                    'Minnestraat Lebbeke. Gratis inkom. Schrijf je in voor D&amp;D, Magic of '
                    'Atmosfear.">',
                    '<meta property="og:description" content="Wat er gebeurt met de gegevens '
                    'die je invult bij je inschrijving.">')
# de hero-afbeelding hoeft hier niet vooraf geladen te worden
pkop = re.sub(r'<link rel="preload" as="image"[^>]*>\n', '', pkop)

pstijl = stijl.replace('<title>Halloween Boardgame Night 2026</title>',
                       '<title>Wat ik met je gegevens doe | Halloween Boardgame Night</title>')
pbody = open(bron('privacy.body.html'), encoding='utf-8').read().rstrip()
pdoc = pkop + pstijl + '\n</head>\n<body>\n' + GTM_BODY + pbody + '\n</body>\n</html>\n'
open(uit('privacy.html'), 'w', encoding='utf-8').write(pdoc)
print('privacy.html %.0f kB' % (len(pdoc) / 1024))
