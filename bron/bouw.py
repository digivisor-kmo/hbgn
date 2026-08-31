import json, re, math, sys

import os
HIER = os.path.dirname(os.path.abspath(__file__))
b = json.load(open(os.path.join(HIER, 'bundle.json')))
SYM, IMG = b['sym'], b['img']

R,N,RINGS = 260,7,5
angs=[i*(math.pi/2)/(N-1) for i in range(N)]
strands=['M0,0 L%.1f,%.1f'%(R*math.cos(a),R*math.sin(a)) for a in angs]
arcs=[]
for k in range(1,RINGS+1):
    r=R*k/(RINGS+0.4); pts=[(r*math.cos(a),r*math.sin(a)) for a in angs]
    d='M%.1f,%.1f'%pts[0]
    for i in range(1,len(pts)):
        x0,y0=pts[i-1]; x1,y1=pts[i]
        d+=' Q%.1f,%.1f %.1f,%.1f'%(((x0+x1)/2)*.8,((y0+y1)/2)*.8,x1,y1)
    arcs.append(d)
WEB = ('<svg viewBox="0 0 %d %d" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">%s%s</svg>'
       % (R,R,''.join('<path d="%s"/>'%s for s in strands),
          ''.join('<path d="%s" stroke-width="1.1"/>'%a for a in arcs)))

DEFS = ('<svg class="defs" aria-hidden="true" focusable="false"><defs>' +
        ''.join('<symbol id="s-%s" viewBox="%s">%s</symbol>' % (k, v['viewBox'], v['inner'])
                for k, v in SYM.items()) +
        '</defs></svg>')

def bouw(tpl, uit, imgvars):
    s = open(tpl, encoding='utf-8').read()
    s = s.replace('%%DEFS%%', DEFS).replace('%%WEB%%', WEB)
    def vb(m):
        # <use> mapt de symbol-viewBox al op de viewport van het buitenste svg,
        # dus dat svg krijgt enkel de verhouding, niet nog eens de offset
        p = SYM[m.group(1)]['viewBox'].split()
        return '0 0 %s %s' % (p[2], p[3])
    s = re.sub(r'%%VB:([a-z0-9_]+)%%', vb, s)
    s = re.sub(r'%%IMG:([a-z0-9_]+)%%', lambda m: IMG[m.group(1)], s)
    css = ':root{' + ''.join('--img-%s:url("%s");' % (k, IMG[k]) for k in imgvars) + '}'
    ix = s.index('<style>') + len('<style>')
    s = s[:ix] + '\n' + css + '\n' + s[ix:]
    s = s.replace('%%INSCHRIJFLINK%%', 'https://claude.ai/code/artifact/c627d1f7-a96d-440d-b06a-0daec9a11209')
    assert '%%' not in s, 'onvervangen marker in ' + uit
    open(uit, 'w', encoding='utf-8').write(s)
    print(uit, round(len(s)/1024/1024, 2), 'MB, em-dashes:', s.count(chr(8212)))

if __name__ == '__main__':
    bouw(sys.argv[1], sys.argv[2], sys.argv[3].split(',') if len(sys.argv) > 3 else [])
