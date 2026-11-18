"""Small helpers for building data/nodes/phys_particles.json and data/viz/particles.json."""
import json, os
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
D = json.load(open(os.path.join(ROOT, 'data', 'particles.json')))
BOOKS = {b['c']: b for b in json.load(open(os.path.join(ROOT, 'data', 'library', 'books.json')))}
PBY = {p['id']: p for p in D['particles']}
NODES, VIZ = [], {}

def ref(code, sec):
    b = BOOKS[code]
    for ch in b['ch']:
        for s in ch[2]:
            if s[0] == sec: return [code, sec, s[2]]
    raise KeyError(code + sec)

def N(id, title, kind, summary, basics, deeper, expert, facts=None, cert='C1', refs=(), kn=(), parents=('sm_overview',), parts=(), made_of=(),
      oq=None, dyk=None, formula=None, where=None, ext=None, scale=None, needs=(), related=(), viz=None):
    n = dict(id=id, title=title, kind=kind, template='concept', scale_m=scale, area='standard_model', parents=list(parents), parts=list(parts), made_of=list(made_of),
             processes=[], related=list(related), mesh=None, needs=list(needs), summary=summary,
             layers=dict(basics=basics, deeper=deeper, expert=expert), facts=facts or [], certainty=cert, refs=[ref(*r) for r in refs], kn=list(kn))
    if oq: n['open_questions'] = oq
    if dyk: n['did_you_know'] = dyk
    if formula: n['formula'] = formula
    if where: n['where'] = where
    if ext: n['ext'] = ext
    NODES.append(n)
    if viz: VIZ[id] = viz
    return n

def pdg_ext(pdgid):
    return [{'title': 'PDG live listing (Particle Data Group)', 'url': 'https://pdglive.lbl.gov/Particle.action?node=%s&init=0' % pdgid}]

def mevs(id_):
    return PBY[id_]['mass']['eV'] / 1e6
