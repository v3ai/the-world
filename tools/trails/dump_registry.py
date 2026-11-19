"""Writes tools/trails/registry.json from the running app (landmark labels, frame keys, INFO card ids, ...).
Run when landmarks or frames change:  WT_URL=http://127.0.0.1:8153/index.html python tools/trails/dump_registry.py"""
import sys, os, json
sys.path.insert(0, '/home/rhett/projects/how/.devtools/harness')
os.environ.setdefault('WT_URL', 'http://127.0.0.1:8153/index.html')
from wt import World
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'registry.json')
with World() as w:
    w.settle(3)
    r = w.js("""(async () => { try { await PX.load(); } catch (e) {}
      return { landmarks: LANDMARKS.map(l => l.label), frames: Object.keys(FR), info: Object.keys(INFO),
      places: ['place:park','place:human','place:skin','place:cell','place:dna','place:base_pair','place:atom','place:earth','place:leaf','place:pond','place:soil','place:air'],
      smModes: ['overview','forces','everyday','mass','decay','hadron'],
      smParticles: Object.keys(PX.P || {}), bodyModes: Object.keys(MODES), elements: Object.keys(ELJ) }; })()""")
    json.dump(r, open(OUT, 'w'), indent=1)
    print({k: len(v) for k, v in r.items()}, w.errors)
