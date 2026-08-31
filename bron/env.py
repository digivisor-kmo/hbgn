import json, os, sys, time, urllib.request, urllib.error
TOKEN=os.environ['VERCEL_TOKEN']; TEAM=os.environ['VERCEL_TEAM']
PRJ='prj_F4pLpcOljOpiPxl6erLhWI0lyUxC'
def api(pad, data=None, method=None):
    url='https://api.vercel.com'+pad+(('&' if '?' in pad else '?')+'teamId='+TEAM)
    for _ in range(4):
        kop={'Authorization':'Bearer '+TOKEN}; body=None
        if data is not None:
            body=json.dumps(data).encode(); kop['Content-Type']='application/json'
        try:
            with urllib.request.urlopen(urllib.request.Request(url,data=body,headers=kop,
                                        method=method or ('POST' if body else 'GET')),timeout=60) as r:
                return json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e:
            return {'_status':e.code,'_body':e.read().decode()[:300]}
        except Exception: time.sleep(3)
    return {'_status':'netwerk'}

def zet(sleutel, waarde):
    bestaand = api('/v9/projects/%s/env' % PRJ).get('envs', [])
    for e in bestaand:
        if e.get('key') == sleutel:
            r = api('/v9/projects/%s/env/%s' % (PRJ, e['id']),
                    data={'value': waarde, 'target': ['production','preview','development']},
                    method='PATCH')
            return 'bijgewerkt' if not r.get('_status') else 'fout %s' % r.get('_body')
    r = api('/v10/projects/%s/env' % PRJ, data={
        'key': sleutel, 'value': waarde, 'type': 'encrypted',
        'target': ['production','preview','development']})
    return 'aangemaakt' if not r.get('_status') else 'fout %s' % r.get('_body')

for k, v in [(a, b) for a, b in zip(sys.argv[1::2], sys.argv[2::2])]:
    print('%-16s %s' % (k, zet(k, v)))
print('\nnu ingesteld:', [e['key'] for e in api('/v9/projects/%s/env' % PRJ).get('envs', [])])
