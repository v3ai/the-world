# Applies the `material` of each tissue-scene population (what it is made of, for the zoom-into-anything descent),
# from tissue_materials.json: {scene id: {population id: material}}. Every *_tissues.py calls apply(d) before it writes a scene.
import json, os
_T = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tissue_materials.json')))
def apply(d):
    m = _T.get(d['id'], {})
    for p in d.get('populations', []):
        if p['id'] in m: p['material'] = m[p['id']]
    return d
