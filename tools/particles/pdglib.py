"""Helpers shared by the particle build scripts: look up PDG values in pdg_extract.json and format them."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
EX = json.load(open(os.path.join(HERE, 'pdg_extract.json')))
UNIT_EV = {'eV': 1.0, 'keV': 1e3, 'MeV': 1e6, 'GeV': 1e9, 'TeV': 1e12}
SUP = str.maketrans('-0123456789+', '⁻⁰¹²³⁴⁵⁶⁷⁸⁹⁺')
HBAR_GEV_S = 6.582119569e-25      # hbar in GeV s (CODATA 2022 value; hbar = h/2pi with h exact)

def rec(pid):
    r = EX['records'][pid]
    if r.get('missing'): raise KeyError(pid)
    return r

def pick(pid, comment=None):
    vs = rec(pid)['values']
    if comment:
        for v in vs:
            if comment in (v.get('comment') or ''): return v
        raise KeyError(pid + ' ' + comment)
    for v in vs:
        if v['in_summary']: return v
    return vs[0]

def pretty(text):
    t = text.strip()
    t = re.sub(r'\+(\d[\d.]*)-(\d[\d.]*)', r' +\1 −\2', t) if '+-' not in t else t
    t = t.replace('+-', ' ± ')
    t = re.sub(r'\s*E\s*([+-]?\d+)', lambda m: '×10' + m.group(1).translate(SUP), t)
    t = t.replace('<', '< ').replace('>', '> ')
    return re.sub(r' +', ' ', t).strip()

def pdg(pid, comment=None):
    """Return the record stored in data/particles.json for a PDG number."""
    v = pick(pid, comment)
    u = v['unit'] or ''
    uu = u.replace('**2', '²').replace('mu(N)', 'μN').replace('pi rad', 'π rad').replace('eV**2', 'eV²')
    t = pretty(v['text'])
    d = {'pdgid': pid, 'edition': 2026, 'text': t, 'unit': u, 'value': v['value'], 'display': (t + ' ' + uu).strip()}
    if v['limit']: d['limit'] = v['limit']; d['cl'] = v['cl']
    if v['err_plus'] is not None and not v['limit']: d['err_plus'] = v['err_plus']; d['err_minus'] = v['err_minus']
    if v['scale']: d['scale_factor'] = v['scale']
    if v['comment']: d['pdg_comment'] = v['comment']
    return d

def mass(pid, scheme, comment=None):
    d = pdg(pid, comment)
    d['scheme'] = scheme
    d['eV'] = d['value'] * UNIT_EV[d['unit']]
    d['err_eV'] = (d.get('err_plus') or 0) * UNIT_EV[d['unit']]
    return d

def br(pid):
    d = pdg(pid); return {'pdgid': pid, 'text': d['text'], 'value': d['value'], 'mode': rec(pid)['description']}

def life_from_width(w_gev):
    return HBAR_GEV_S / w_gev
