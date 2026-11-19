"""Browser test for search: types 12 representative queries, presses Enter, and checks that the camera ends at the right
model with the right card open, with zero console errors or warnings.
  WT_URL=http://127.0.0.1:8154/index.html /home/rhett/projects/how/.devtools/venv/bin/python -I tools/search/test_browser.py > out.txt
One browser, slow machine: allow several minutes. Writes screenshots to $WT_SHOTS."""
import sys, os, time, json
sys.path.insert(0, '/home/rhett/projects/how/.devtools/harness')
os.environ.setdefault('WT_URL', 'http://127.0.0.1:8154/index.html')
os.environ.setdefault('WT_SHOTS', '/home/rhett/projects/how/.devtools/shots/search')
from wt import World

# query, expected camera anchor frame types (any of), expected card title contains, extra check JS (optional)
CASES = [
  ('sugar',               ['mol'],              'Sucrose'),
  ('a battery',           ['phone'],            'Battery'),
  ('salt',                ['crystal'],          'Halite'),
  ('Fe',                  ['atom'],             'Iron'),
  ('my heart',            ['organ'],            'Heart'),
  ('the sun',             ['solarsystem', 'sun', 'planet'], 'Sun'),
  ('mars',                ['planet'],           'Mars'),
  ('dog',                 ['park', 'thing'],    'Dog'),
  ('wifi',                ['phone', 'die', 'core'], 'Wi-Fi'),
  ('quark',               ['sm'],               'Up quark'),
  ('H2O',                 ['mol'],              'Water'),
  ('why is the sky blue', None,                 'sky colour'),
]
SHOT_ONLY = os.environ.get('SEARCH_TEST_N')
def main():
    results = []; t00 = time.time()
    with World(size=(1280, 800)) as w:
        w.settle(3)
        for qi, (q, types, card) in enumerate(CASES):
            if SHOT_ONLY and qi >= int(SHOT_ONLY): break
            t0 = time.time()
            w.js("closeInfo(); jumpTo(FR.park, new V3(0,1,0), 8)"); w.settle(1.5)
            w.page.keyboard.press('/')
            w.page.evaluate("document.querySelector('#srchQ').value=''")
            w.page.type('#srchQ', q, delay=15); w.settle(0.4)
            n_rows = w.js("document.querySelectorAll('#srchPanel .srow').length")
            w.page.keyboard.press('Enter')
            w.settle(2)
            ok_fly = w.wait_fly(timeout=240)
            w.settle(3)
            st = w.js("""(() => { const A = cam.A; const info = document.querySelector('#info'); const h2 = info && info.querySelector('h2');
              return { type: A && A.type, name: A && (A.name || ''), D: cam.D, card: h2 ? h2.textContent : '', open: !!(info && info.classList.contains('open')), flying: !!fly } })()""")
            ok_type = types is None or st['type'] in types
            ok_card = st['open'] and card.lower() in st['card'].lower()
            shot = os.path.join(os.environ['WT_SHOTS'], 'bt_%02d_%s.png' % (qi, q.replace(' ', '_')))
            try: w.page.screenshot(path=shot, timeout=180000)
            except Exception as e: shot = 'shot failed: %s' % e
            results.append((q, ok_type and ok_card and ok_fly, st, round(time.time() - t0)))
            print('%-22s %s rows=%s type=%s name=%r card=%r open=%s D=%.3g fly_done=%s (%ds)' % (q, 'PASS' if ok_type and ok_card and ok_fly else 'FAIL', n_rows, st['type'], st['name'], st['card'], st['open'], st['D'], ok_fly, time.time() - t0), flush=True)
        errs = [e for e in w.errors]
        warns = [l for l in w.logs if l.startswith('warning') and 'GPU stall' not in l and 'GL Driver' not in l]
        print('console errors:', errs)
        print('console warnings:', warns)
        npass = sum(1 for r in results if r[1])
        print('RESULT: %d of %d cases pass; %d console errors; %d warnings; %ds' % (npass, len(results), len(errs), len(warns), time.time() - t00))
        return 0 if npass == len(results) and not errs and not warns else 1
if __name__ == '__main__':
    sys.exit(main())
