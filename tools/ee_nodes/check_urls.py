"""Optional: HEAD-check every ext URL (needs network). Usage: python3 check_urls.py"""
import json, glob, urllib.request, concurrent.futures as cf
from lib import ROOT
urls = {}
for f in glob.glob(ROOT + '/data/nodes/ee_*.json'):
    for n in json.load(open(f)):
        for e in n.get('ext', []): urls.setdefault(e['url'], []).append(n['id'])
def chk(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, method='HEAD', headers={'User-Agent': 'content-check/1.0'}), timeout=20)
        return u, r.status
    except Exception as ex:
        return u, str(ex)[:60]
with cf.ThreadPoolExecutor(8) as ex:
    res = list(ex.map(chk, urls))
bad = [(u, s) for u, s in res if s != 200]
print(len(urls), 'urls;', len(bad), 'not 200')
for u, s in bad: print(s, u, urls[u][:3])
