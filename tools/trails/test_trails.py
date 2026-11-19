"""Browser test: plays every stop of every trail and checks where the camera ends up.
Usage: python tools/trails/test_trails.py [--shard i/n] [--trail id,id] [--real] [--cold] [--shots DIR] [--out FILE]
  default: 'instant' flights (flyTo replaced by a jump) so all stops run in reasonable time; --real keeps real flights.
  --cold: reload the page for every stop (a cold start per stop). Default: one cold start per trail, stops in order.
Asserts per stop: the player arrives, the camera chain matches expect.frame (regex on frame names/types), expect.thing's frame
is drawn, no console errors, no player errors. One browser at a time. Output: one JSON line per stop in --out."""
import sys, os, json, re, time, argparse
sys.path.insert(0, '/home/rhett/projects/how/.devtools/harness')
os.environ.setdefault('WT_URL', 'http://127.0.0.1:8153/index.html')
ap = argparse.ArgumentParser()
ap.add_argument('--shard', default='0/1'); ap.add_argument('--trail', default='')
ap.add_argument('--real', action='store_true'); ap.add_argument('--cold', action='store_true')
ap.add_argument('--shots', default='/home/rhett/projects/how/.devtools/shots/trails/stops')
ap.add_argument('--out', default='/home/rhett/projects/how/.devtools/tmp/trails/test_out.jsonl')
ap.add_argument('--stops', default='')
a = ap.parse_args()
os.environ['WT_SHOTS'] = a.shots
from wt import World
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
man = json.load(open(os.path.join(root, 'data/trails/manifest.json')))
files = man.get('files', man) if isinstance(man, dict) else man
trails = []
for f in files:
    x = json.load(open(os.path.join(root, 'data/trails', f))); trails += x.get('trails', [x])
si, sn = map(int, a.shard.split('/'))
if a.trail: trails = [t for t in trails if t['id'] in a.trail.split(',')]
trails = [t for k, t in enumerate(trails) if k % sn == si]
INSTANT = """(() => { window.flyTo = function (f, p, D, then) { jumpTo(f, p, D); fly = null; camHold = f; setTimeout(() => safeThen(then), 80); }; })()"""
PROBE = """(() => { const S = TRAILS.state(); const st = TRAILS.cur && TRAILS.cur.stops[TRAILS.i]; const e = (st && st.expect) || {};
  const names = chainOf(cam.A).map(f => (f.name || '') + '|' + (f.type || ''));
  let thingDrawn = null; if (e.thing) { const F = FR['thing_' + e.thing]; thingDrawn = !!F && drawn.includes(F); }
  return { arrived: S.arrived, errors: S.errors, names, thingDrawn, expect: e, D: cam.D, card: !!document.querySelector('#info.open'), title: (document.querySelector('#trail h3') || {}).textContent }; })()"""
out = open(a.out, 'a'); fails = 0
def run_stop(w, t, i, cold):
    w.js(f"TRAILS.start('{t['id']}', {i})")
    t0 = time.time(); r = None
    while time.time() - t0 < (200 if a.real else 60):
        w.settle(1); r = w.js(PROBE)
        if r['arrived']: break
    w.settle(2.5); r = w.js(PROBE)
    ok = bool(r['arrived']); why = [] if ok else ['did not arrive']
    e = r['expect']
    if e.get('frame') and not any(re.search(e['frame'], n) for n in r['names'][:1]): ok = False; why.append('frame %s not in chain %s' % (e['frame'], r['names'][:4]))
    if e.get('thing') and not r['thingDrawn']: ok = False; why.append('thing %s not drawn' % e['thing'])
    if r['errors']: ok = False; why.append('player errors %s' % r['errors'])
    if w.errors: ok = False; why.append('console %s' % w.errors[:2])
    shot = w.shot('%s_%02d' % (t['id'], i + 1))
    rec = dict(trail=t['id'], stop=i + 1, ok=ok, why=why, chain=[n.split('|')[0] for n in r['names']][:3], D=r['D'], card=r['card'], shot=shot)
    out.write(json.dumps(rec) + '\n'); out.flush(); print(('PASS ' if ok else 'FAIL ') + t['id'], i + 1, '; '.join(why)[:300], flush=True)
    w.errors.clear()
    return ok
for t in trails:
    n = len(t['stops']); idx = [int(x) - 1 for x in a.stops.split(',')] if a.stops else list(range(n))
    if a.cold:
        for i in idx:
            with World() as w:
                w.settle(2)
                if not a.real: w.js(INSTANT)
                w.js('TRAILS.ready'); w.settle(1); fails += 0 if run_stop(w, t, i, True) else 1
    else:
        with World() as w:
            w.settle(2)
            if not a.real: w.js(INSTANT)
            w.settle(1)
            for i in idx: fails += 0 if run_stop(w, t, i, False) else 1
print('DONE fails =', fails, flush=True)
sys.exit(1 if fails else 0)
