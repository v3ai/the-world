"""Helpers for the Biology (B.S.) content graph generators."""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BOOKS = json.load(open(ROOT + '/data/library/books.json'))
SEC = {}
for _b in BOOKS:
    for _n, _t, _secs in _b['ch']:
        for _s in _secs:
            if _s[0]:
                SEC[(_b['c'], _s[0])] = _s[2]
NODES = []          # nodes of the current output file
ALL = []            # every new node in generation order
TRACK = []          # [{title, hub, nodes:[ids]}]
_cur = {'hub': None}
ROOT_ID = 'biology_degree'
AREA_WHERE = {'bio_chem_life':'place:atom','bio_biochem':'place:cell','bio_cell_biology':'place:cell','bio_molecular':'place:dna',
 'bio_genetics':'place:dna','bio_genomics':'place:dna','bio_microbiology':'place:pond','bio_evolution':'place:earth','bio_diversity':'place:park',
 'bio_plants':'place:leaf','bio_animal_phys':'human_body','bio_neuro':'brain','bio_immuno':'lymphatic_immune_system','bio_development':'place:cell','bio_ecology':'place:park'}

def sp(s):
    return s.split() if isinstance(s, str) else list(s or [])

def _refs(s):
    out = []
    for t in sp(s):
        b, sec = t.split(':')
        out.append([b, sec, SEC[(b, sec)]])
    return out

def _base(id, title, kind, tmpl, needs, summary, basics, deeper, expert, par, hub):
    return {"id": id, "title": title, "kind": kind, "template": tmpl, "scale_m": None, "area": hub,
            "parents": par, "parts": [], "made_of": [], "processes": [], "related": [], "mesh": None,
            "needs": sp(needs), "summary": summary,
            "layers": {"basics": basics, "deeper": deeper, "expert": expert}}

def section(hub, title, summary, basics, deeper, expert, kn=''):
    """Start a track section and create its hub node."""
    _cur['hub'] = hub
    d = _base(hub, title, 'field', 'concept', '', summary, basics, deeper, expert, [ROOT_ID], hub)
    d.update(facts=[], certainty='C1', refs=[])
    if kn: d['kn'] = sp(kn)
    NODES.append(d); ALL.append(d)
    TRACK.append({"title": title, "area": hub, "nodes": [hub]})

def n(id, title, kind, needs, summary, basics, deeper, expert, facts='', refs='', f=None, d=None,
      w=None, lab=None, k='', mol='', c='C1', oq=None, rel='', ext='', par=None):
    hub = _cur['hub']
    dd = _base(id, title, kind, 'concept', needs, summary, basics, deeper, expert, sp(par) if par else [hub], hub)
    dd['related'] = sp(rel)
    dd['facts'] = [[a.strip(), b.strip()] for a, b in (x.split('|') for x in facts.split(';') if x.strip())] if facts else []
    if f: dd['formula'] = f
    if d: dd['did_you_know'] = d
    dd['certainty'] = c
    if oq: dd['open_questions'] = oq
    dd['refs'] = _refs(refs)
    if ext: dd['ext'] = [{"title": t.split('|')[0], "url": t.split('|')[1]} for t in ext.split(';;')]
    if k: dd['kn'] = sp(k)
    if lab:
        l, p = lab.split(':'); dd['lab'] = {"id": l, "preset": p}
    if w is None: w = AREA_WHERE.get(hub, '')
    if w: dd['where'] = w
    if mol: dd['molecules'] = sp(mol)
    NODES.append(dd); ALL.append(dd); TRACK[-1]['nodes'].append(id)
    return dd

def proc(id, title, needs, summary, basics, deeper, expert, facts, refs, steps, **kw):
    """Process node: steps = [(title, text, 'focus ids'), ...]"""
    dd = n(id, title, 'process', needs, summary, basics, deeper, expert, facts, refs, **kw)
    dd['template'] = 'process'
    dd['steps'] = [{"title": a, "text": b, "focus": sp(c)} for a, b, c in steps]
    return dd

def use(ids):
    """Reuse existing node ids at this point of the current track section."""
    for i in sp(ids):
        TRACK[-1]['nodes'].append(i)

def save(name):
    json.dump(NODES, open(ROOT + f'/data/nodes/{name}.json', 'w'), indent=1, ensure_ascii=False)
    print(name, len(NODES)); NODES.clear()

def root():
    d = _base(ROOT_ID, 'Biology (B.S.)', 'field', 'concept', '',
              'An undergraduate map of the science of life, from atoms to the biosphere.',
              'Biology asks how living things work, how they came to be, and how they interact. This track walks from chemistry through cells, genes, evolution, organisms and ecosystems.',
              'The degree is organised in levels: molecules, cells, organisms, populations, ecosystems. Each level has its own laws, but evolution and energy flow tie them together.',
              'Modern biology is quantitative and comparative: statistics, modelling and sequencing now sit beside microscopy and physiology as core skills. Claims are graded by certainty so open questions stay visibly open.', [], ROOT_ID)
    d.update(facts=[], certainty='C1', refs=[], kn=['cell_biology_intro', 'natural_selection'])
    return d
