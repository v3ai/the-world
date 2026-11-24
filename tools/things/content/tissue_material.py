# Applies the `material` of each tissue-scene population (what it is made of, for the zoom-into-anything descent),
# from tissue_materials.json: {scene id: {population id: material}}. Every *_tissues.py and extra_*.py calls apply(d) before it writes a scene.
# A population whose material leads to a cell type with its own spec (data/descent/materials.json: a first constituent with scene "cell:<id>",
# data/cells/<id>.json) loses a `deeper` of its own: that cell is its next level down, not the generic cell or a molecule.
import json, os
_D = os.path.dirname(os.path.abspath(__file__))
_T = json.load(open(os.path.join(_D, 'tissue_materials.json')))
_ROOT = os.path.normpath(os.path.join(_D, '..', '..', '..'))
_M = json.load(open(os.path.join(_ROOT, 'data', 'descent', 'materials.json')))['materials']
def _spec_cell(m):
    row = _M.get(m) or {}
    for c in row.get('inside', []):
        sc = c.get('scene')
        if isinstance(sc, str) and sc.startswith('cell:'):
            return os.path.exists(os.path.join(_ROOT, 'data', 'cells', sc[5:] + '.json'))
        if sc or c.get('material'): return False
    return False
def apply(d):
    m = _T.get(d['id'], {})
    for p in d.get('populations', []):
        if p['id'] in m: p['material'] = m[p['id']]
        if p.get('material') and p.get('deeper') and _spec_cell(p['material']): del p['deeper']
    return d
