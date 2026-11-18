"""Validate the biology content graph. Prints counts and exits non-zero on errors."""
import json, glob, os, sys
from collections import Counter
sys.path.insert(0, os.path.dirname(__file__))
from lib import ROOT, SEC, ROOT_ID
from presets import SPEC
errs = []; warns = []
def err(m): errs.append(m)
files = sorted(glob.glob(ROOT + '/data/nodes/bio_*.json'))
nodes = []
for f in files: nodes += json.load(open(f))
ids = [n['id'] for n in nodes]; by = {n['id']: n for n in nodes}
seen = set()
for i in ids:
    if i in seen: err(f'duplicate id {i}')
    seen.add(i)
existing = {}
for f in glob.glob(ROOT + '/data/nodes/*.json'):
    b = os.path.basename(f)
    if b.startswith('bio_') or b == 'manifest.json': continue
    for n in json.load(open(f)): existing[n['id']] = n
for i in ids:
    if i in existing: err(f'id collides with existing node {i}')
    if i != i.lower() or ' ' in i: err(f'bad id {i}')
allnodes = dict(existing); allnodes.update(by)
kn = {n['id'] for n in json.load(open(ROOT + '/data/knowledge/nodes.json'))}
crystals = {c['id'] for c in json.load(open(ROOT + '/data/crystals.json'))}
mols = set(json.load(open(ROOT + '/data/molecules_all.json'))['mols'])
PLACES = {'place:' + p for p in 'park human skin cell dna base_pair atom earth leaf pond soil air'.split()}
KINDS = {'concept','law','technique','structure','process','organism','tool','field','molecule'}
LABS = {'genetics','population','microscope','molecule','enzyme','ecosystem'}
def where_ok(w):
    if w in PLACES: return True
    if w.startswith('mol:'): return w[4:] in mols
    if w.startswith('crystal:'): return w[8:] in crystals
    return w in allnodes
for n in nodes:
    i = n['id']
    if n['kind'] not in KINDS: err(f'{i}: bad kind {n["kind"]}')
    if n['template'] not in ('concept', 'process'): err(f'{i}: bad template')
    for fld in ('parents', 'parts', 'processes', 'related', 'needs'):
        for r in n.get(fld, []):
            if r not in allnodes: err(f'{i}.{fld}: unknown id {r}')
    for r in n.get('molecules', []):
        if r not in mols: err(f'{i}.molecules unknown {r}')
    for r in n.get('kn', []):
        if r not in kn: err(f'{i}.kn unknown {r}')
    for b, s, slug in n['refs']:
        if SEC.get((b, s)) != slug: err(f'{i}: bad ref {b} {s}')
    for e in n.get('ext', []):
        if not e['url'].startswith('https://'): err(f'{i}: bad ext url')
    if not n.get('summary'): err(f'{i}: empty summary')
    for k in ('basics', 'deeper', 'expert'):
        if not n['layers'].get(k): err(f'{i}: empty layer {k}')
    if n['kind'] != 'field' and not (2 <= len(n['facts']) <= 5): err(f'{i}: facts count {len(n["facts"])}')
    if n['kind'] != 'field' and not n['refs'] and not n.get('ext'): warns.append(f'{i}: no refs/ext')
    if n['certainty'] in ('C2', 'C3', 'C4') and not n.get('open_questions'): err(f'{i}: {n["certainty"]} without open_questions')
    if n['template'] == 'process':
        if not (5 <= len(n.get('steps', [])) <= 7): err(f'{i}: process needs 5-7 steps')
        for s in n.get('steps', []):
            for fid in s['focus']:
                if not where_ok(fid): err(f'{i}: step focus unknown {fid}')
    if 'where' in n and not where_ok(n['where']): err(f'{i}: bad where {n["where"]}')
    if 'lab' in n and n['lab']['id'] not in LABS: err(f'{i}: bad lab id')
    if 'lab' in n and (n['lab']['id'], n['lab']['preset']) not in SPEC: err(f'{i}: no spec for preset {n["lab"]}')
    if n['id'] != ROOT_ID and not any(p in allnodes for p in n['parents']): err(f'{i}: no parent')
# required processes
REQ = """dna_replication_process transcription_process glycolysis_process krebs_cycle_process oxidative_phosphorylation_process photosynthesis_light_process calvin_cycle_process meiosis_process pcr_process crispr_editing_process viral_replication_process natural_selection_process speciation_process nitrogen_cycle_process carbon_cycle_process signal_transduction_process vaccine_immunity_process gastrulation_process sanger_ngs_sequencing_process""".split()
for r in REQ:
    if r not in by or by[r]['template'] != 'process': err(f'required process missing: {r}')
# acyclic needs over new + existing
indeg = {i: 0 for i in allnodes}; out = {i: [] for i in allnodes}
for i, n in allnodes.items():
    for d in n.get('needs', []):
        if d in allnodes: out[d].append(i); indeg[i] += 1
q = [i for i in allnodes if indeg[i] == 0]; cnt = 0
while q:
    x = q.pop(); cnt += 1
    for y in out[x]:
        indeg[y] -= 1
        if indeg[y] == 0: q.append(y)
if cnt != len(allnodes): err('needs cycle among: ' + ', '.join(i for i in allnodes if indeg[i] > 0)[:400])
# track
tr = json.load(open(ROOT + '/data/tracks/biology.json'))
pos = {}
for si, s in enumerate(tr['sections']):
    for k, i in enumerate(s['nodes']):
        if i in pos: err(f'track duplicate {i}')
        if i not in allnodes: err(f'track unknown {i}')
        pos[i] = si * 10000 + k
for i in ids:
    if i not in pos: err(f'new node not in track: {i}')
for i in pos:
    n = allnodes.get(i)
    if not n: continue
    for d in n.get('needs', []):
        if d not in pos: err(f'track: {i} needs {d} which is not in the track')
        elif pos[d] >= pos[i]: err(f'track order: {i} before its need {d}')
# stats
sec_of = {}
for s in tr['sections']:
    for i in s['nodes']: sec_of[i] = s['title']
c_sec = Counter(); c_sec_total = Counter()
for s in tr['sections']:
    c_sec_total[s['title']] = len(s['nodes'])
    c_sec[s['title']] = sum(1 for i in s['nodes'] if i in by)
stats = dict(total_new=len(nodes), kinds=dict(Counter(n['kind'] for n in nodes)), templates=dict(Counter(n['template'] for n in nodes)),
 certainty=dict(Counter(n['certainty'] for n in nodes)), per_section_new=dict(c_sec), per_section_track=dict(c_sec_total),
 reused_in_track=sum(1 for i in pos if i in existing), track_total=len(pos),
 with_refs=sum(1 for n in nodes if n['refs']), with_ext=sum(1 for n in nodes if n.get('ext')), no_refs_no_ext=sum(1 for n in nodes if not n['refs'] and not n.get('ext')),
 with_where=sum(1 for n in nodes if 'where' in n), with_lab=sum(1 for n in nodes if 'lab' in n), with_formula=sum(1 for n in nodes if 'formula' in n),
 with_kn=sum(1 for n in nodes if n.get('kn')), with_molecules=sum(1 for n in nodes if n.get('molecules')),
 edges_needs=sum(len(n['needs']) for n in nodes),
 reused_ids_referenced=len({r for n in nodes for f in ('needs','related','parents','processes') for r in n.get(f, []) if r in existing}))
json.dump({'stats': stats, 'warnings': warns}, open(os.path.join(os.path.dirname(__file__), 'validate_out.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps(stats, indent=1)); print('warnings:', len(warns))
for w in warns[:30]: print('  W', w)
print('ERRORS:', len(errs))
for e in errs[:100]: print('  E', e)
sys.exit(1 if errs else 0)
