import hashlib, json, os, sys, urllib.request, urllib.error

TOKEN = os.environ['VERCEL_TOKEN']
TEAM  = os.environ.get('VERCEL_TEAM', '')
NAAM  = 'hbgn'
HIER = os.path.dirname(os.path.abspath(__file__))
WORTEL = os.path.dirname(HIER)          # de hoofdmap van de repository

def api(pad, data=None, method=None, ruw=None, extra=None):
    url = 'https://api.vercel.com' + pad
    if TEAM:
        url += ('&' if '?' in pad else '?') + 'teamId=' + TEAM
    kop = {'Authorization': 'Bearer ' + TOKEN}
    if extra: kop.update(extra)
    body = ruw
    if data is not None:
        body = json.dumps(data).encode(); kop['Content-Type'] = 'application/json'
    import time
    for poging in range(5):
        req = urllib.request.Request(url, data=body, headers=kop,
                                     method=method or ('POST' if body else 'GET'))
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e:
            return {'_status': e.code, '_body': e.read().decode()[:600]}
        except Exception:
            time.sleep(2 + poging * 3)
    return {'_status': 'netwerk', '_body': 'geen verbinding'}

bestanden = []
OVERSLAAN = {'.git', 'bron', 'node_modules', '.vercel'}
for wortel, mappen, namen in os.walk(WORTEL):
    mappen[:] = [m for m in mappen if m not in OVERSLAAN]
    for n in namen:
        p = os.path.join(wortel, n)
        rel = os.path.relpath(p, WORTEL)
        b = open(p, 'rb').read()
        bestanden.append((rel, hashlib.sha1(b).hexdigest(), len(b), b))

print('bestanden:', len(bestanden))
for rel, sha, n, b in bestanden:
    r = api('/v2/files', ruw=b, extra={'Content-Type': 'application/octet-stream',
                                       'x-vercel-digest': sha,
                                       'Content-Length': str(n)})
    st = r.get('_status')
    print('  upload %-22s %7d B  %s' % (rel, n, 'fout %s %s' % (st, r.get('_body')) if st else 'ok'))
    if st: sys.exit(1)

d = api('/v13/deployments?forceNew=1', data={
    'name': NAAM,
    'target': 'production',
    'files': [{'file': rel.replace(os.sep, '/'), 'sha': sha, 'size': n} for rel, sha, n, _ in bestanden],
    'projectSettings': {'framework': None, 'buildCommand': None,
                        'outputDirectory': None, 'installCommand': None,
                        'devCommand': None, 'rootDirectory': None},
})
print(json.dumps({k: d.get(k) for k in ('id','url','readyState','_status','_body','projectId')}, indent=1))
