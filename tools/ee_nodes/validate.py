"""Validate the EE content graph. Prints a coverage table (also usable for the report) and exits non-zero on errors."""
import json, glob, os, re, sys
from lib import ROOT, SEC, AREAS, AREA_IDS, KNOWN_CIRCUIT, KNOWN_DEVICE
from syllabus_map import M, SKIP_HEADINGS
from presets import SPEC
SYL = '/mnt/user-data/uploads/a9ec1ffb-attachment.txt'
errs = []; warns = []
def err(m): errs.append(m)
# load
files = sorted(glob.glob(ROOT + '/data/nodes/ee_*.json'))
nodes = []
for f in files: nodes += json.load(open(f))
ids = [n['id'] for n in nodes]
by = {n['id']: n for n in nodes}
# unique + collision
seen = set()
for i in ids:
    if i in seen: err(f'duplicate id {i}')
    seen.add(i)
existing = set()
for f in glob.glob(ROOT + '/data/nodes/*.json'):
    if os.path.basename(f).startswith('ee_') or f.endswith('manifest.json'): continue
    existing |= {n['id'] for n in json.load(open(f))}
for i in ids:
    if i in existing: err(f'id collides with existing node {i}')
kn = {n['id'] for n in json.load(open(ROOT + '/data/knowledge/nodes.json'))}
crystals = {c['id'] for c in json.load(open(ROOT + '/data/crystals.json'))}
mols = set(json.load(open(ROOT + '/data/molecules_all.json'))['mols'])
elements = {e['symbol'] for e in json.load(open(ROOT + '/data/elements.json'))} | {e['name'].lower() for e in json.load(open(ROOT + '/data/elements.json'))}
allref = set(ids) | existing
for n in nodes:
    for fld in ('parents', 'parts', 'processes', 'related', 'needs'):
        for r in n.get(fld, []):
            if r not in by: err(f'{n["id"]}.{fld}: unknown id {r}')
    for r in n.get('made_of', []):
        if r not in by and r not in crystals and r not in elements and r not in existing: err(f'{n["id"]}.made_of unknown {r}')
    for r in n.get('molecules', []):
        if r not in mols: err(f'{n["id"]}.molecules unknown {r}')
    for r in n.get('kn', []):
        if r not in kn: err(f'{n["id"]}.kn unknown {r}')
    for b, s, slug in n['refs']:
        if SEC.get((b, s)) != slug: err(f'{n["id"]}: bad ref {b} {s}')
    for e in n.get('ext', []):
        if not e['url'].startswith('https://'): err(f'{n["id"]}: bad ext url')
    if not n['refs'] and not n.get('ext') and n['kind'] not in ('field',) and n['template'] == 'concept':
        warns.append(f'{n["id"]}: no refs/ext')
    for k in ('summary',):
        if not n.get(k): err(f'{n["id"]}: empty {k}')
    for k in ('basics', 'deeper', 'expert'):
        if not n['layers'].get(k): err(f'{n["id"]}: empty layer {k}')
    if n['template'] == 'teardown':
        if n['scale_m'] is None: err(f'{n["id"]}: teardown needs scale_m')
        if n['id'] not in ('smartphone', 'usb_c_charger', 'electric_power_grid') and 'hotspot' not in n:
            err(f'{n["id"]}: teardown without hotspot')
    if 'hotspot' in n:
        h = n['hotspot']
        if h['of'] not in by: err(f'{n["id"]}: hotspot.of unknown')
        if h['of'] not in n['parents']: err(f'{n["id"]}: hotspot parent not in parents')
    if n['template'] == 'process':
        if len(n.get('steps', [])) < 3: err(f'{n["id"]}: process needs steps')
        for s in n.get('steps', []):
            for fid in s['focus']:
                if fid not in by: err(f'{n["id"]}: step focus unknown {fid}')
    if 'where' in n and n['where'] not in by: err(f'{n["id"]}: where unknown {n["where"]}')
    if n.get('certainty') in ('C2', 'C3') and not n.get('open_questions'): err(f'{n["id"]}: C2/C3 without open_questions')
# required teardown ids
REQ = """smartphone phone_display phone_battery phone_pcb phone_camera phone_speaker phone_antenna phone_charger_port phone_vibration_motor phone_touchscreen
phone_soc phone_ram phone_flash phone_pmic phone_rf_frontend phone_modem phone_wifi_bt phone_sensors phone_passives phone_crystal_osc
soc_cpu_cluster soc_gpu soc_npu soc_cache soc_memory_controller soc_isp soc_interconnect cpu_core core_fetch core_decode core_alu core_registers core_l1_cache core_branch_predictor core_pipeline
logic_adder logic_gate_nand cmos_inverter finfet_transistor silicon_channel usb_c_charger rectifier_bridge flyback_transformer switching_mosfet feedback_optocoupler buck_converter
power_plant generator step_up_transformer transmission_line substation distribution_transformer wall_outlet electrical_engineering
how_a_phone_charges how_a_transistor_switches instruction_execution how_wifi_sends_data how_a_photo_is_taken chip_fabrication power_grid_delivery how_touchscreen_senses""".split()
for r in REQ:
    if r not in by: err(f'required id missing: {r}')
for a in AREA_IDS:
    if a not in by: err(f'missing hub {a}')
# chain checks
CH = [('smartphone','phone_pcb'),('phone_pcb','phone_soc'),('phone_soc','soc_cpu_cluster'),('soc_cpu_cluster','cpu_core'),('cpu_core','core_alu'),('core_alu','logic_adder'),('logic_adder','logic_gate_nand'),('logic_gate_nand','cmos_inverter'),('cmos_inverter','finfet_transistor'),('finfet_transistor','silicon_channel')]
for p, c in CH:
    if p in by and c in by and c not in by[p]['parts']: err(f'chain {p}->{c} missing in parts')
if 'silicon_channel' in by and 'silicon' not in by['silicon_channel']['made_of']: err('silicon_channel not made_of silicon')
# acyclic needs (Kahn)
indeg = {i: 0 for i in ids}; out = {i: [] for i in ids}
for n in nodes:
    for d in n['needs']:
        if d in by: out[d].append(n['id']); indeg[n['id']] += 1
q = [i for i in ids if indeg[i] == 0]; cnt = 0
while q:
    x = q.pop(); cnt += 1
    for y in out[x]:
        indeg[y] -= 1
        if indeg[y] == 0: q.append(y)
if cnt != len(ids):
    err('needs cycle among: ' + ', '.join(i for i in ids if indeg[i] > 0))
# parents acyclic
# labs
planned = {}
for n in nodes:
    if 'lab' in n:
        l, p = n['lab']['id'], n['lab']['preset']
        if l not in ('circuit','device','signal','logic','control','field','math','prob','code','network'): err(f'{n["id"]}: bad lab id {l}')
        if l == 'circuit' and p in KNOWN_CIRCUIT: continue
        if l == 'device' and p in KNOWN_DEVICE: continue
        planned.setdefault((l, p), []).append(n['id'])
        if (l, p) not in SPEC: err(f'no spec for planned preset {l}:{p}')
# track
tr = json.load(open(ROOT + '/data/tracks/ee.json'))
pos = {}
for si, s in enumerate(tr['sections']):
    for k, i in enumerate(s['nodes']):
        if i in pos: err(f'track duplicate {i}')
        if i not in by: err(f'track unknown {i}')
        pos[i] = (si, k)
for i in ids:
    if i not in pos: err(f'node not in track: {i}')
flat = {i: (si * 10000 + k) for i, (si, k) in pos.items()}
for n in nodes:
    for d in n['needs']:
        if d in flat and n['id'] in flat and flat[d] >= flat[n['id']]: err(f'track order: {n["id"]} before its need {d}')
# syllabus coverage
lines = open(SYL, encoding='utf-8').read().split('\n')[63:335]
lines = [l.strip() for l in lines if l.strip()]
cov = []; unmapped = []
used = set()
for l in lines:
    if re.match(r'^\d+\. ', l) or l.startswith("Here's an example") or any(l == s or l.startswith(s) and len(l) < len(s) + 12 for s in SKIP_HEADINGS):
        continue
    hit = None
    for k, (key, nl) in enumerate(M):
        if key in l: hit = (k, key, nl.split()); break
    if not hit: unmapped.append(l); continue
    used.add(hit[0])
    for i in hit[2]:
        if i not in by: err(f'syllabus map: unknown id {i} for "{key}"')
    cov.append((l, hit[2]))
for k, (key, nl) in enumerate(M):
    if k not in used: warns.append(f'syllabus key unused: {key}')
for l in unmapped: err(f'syllabus line not covered: {l}')
# stats
from collections import Counter
c_kind = Counter(n['kind'] for n in nodes); c_t = Counter(n['template'] for n in nodes); c_cert = Counter(n['certainty'] for n in nodes)
c_area = Counter(n['area'] for n in nodes)
stats = dict(total=len(nodes), kinds=dict(c_kind), templates=dict(c_t), certainty=dict(c_cert), area=dict(c_area),
             with_refs=sum(1 for n in nodes if n['refs']), with_ext=sum(1 for n in nodes if n.get('ext')), no_refs_no_ext=sum(1 for n in nodes if not n['refs'] and not n.get('ext')),
             with_lab=sum(1 for n in nodes if 'lab' in n), with_where=sum(1 for n in nodes if 'where' in n), with_formula=sum(1 for n in nodes if 'formula' in n),
             planned_presets=len(planned), syllabus_lines=len(cov), edges_needs=sum(len(n['needs']) for n in nodes))
json.dump({'stats': stats, 'coverage': cov, 'planned': {f'{k[0]}:{k[1]}': v for k, v in planned.items()}, 'warnings': warns},
          open(os.path.join(os.path.dirname(__file__), 'validate_out.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps(stats, indent=1))
print('warnings:', len(warns))
for w in warns[:40]: print('  W', w)
print('ERRORS:', len(errs))
for e in errs[:80]: print('  E', e)
sys.exit(1 if errs else 0)
