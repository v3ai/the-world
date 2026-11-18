#!/usr/bin/env python3
"""Consistency checks for the Standard Model data.  Run from the repo root:  python3 -I tools/particles/check_particles.py
Exit status 0 only if everything passes."""
import json, os, sys, glob
from fractions import Fraction as F
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import qn
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
J = lambda *p: json.load(open(os.path.join(ROOT, *p)))
D = J('data', 'particles.json'); EX = json.load(open(os.path.join(HERE, 'pdg_extract.json')))
nodes = J('data', 'nodes', 'phys_particles.json'); viz = J('data', 'viz', 'particles.json')
books = {b['c']: b for b in J('data', 'library', 'books.json')}
kn = {n['id'] for n in J('data', 'knowledge', 'nodes.json')}; frontier = {e['id'] for e in J('data', 'knowledge', 'frontier.json')}
fails = []
def check(cond, msg):
    if not cond: fails.append(msg)
PB = {p['id']: p for p in D['particles']}
def Q(s): return F(s.replace('+', '').replace('−', '-'))

# 1. seventeen particles, correct census
check(len(PB) == 17, 'need 17 fundamental particles')
check(sum(1 for p in PB.values() if p['family'] == 'quark') == 6 and sum(1 for p in PB.values() if p['family'] == 'lepton') == 6, 'six quarks and six leptons')
check(sum(1 for p in PB.values() if p['kind'] != 'fermion') == 5, 'five bosons (gluon, photon, W, Z, Higgs)')

# 2. charges sum to zero in every generation (colour counted), and each member has the right charge
for g in (1, 2, 3):
    ms = [p for p in PB.values() if p['generation'] == g]
    check(len(ms) == 4, 'generation %d must have 4 fermions' % g)
    tot = sum(Q(p['charge']) * (3 if p['family'] == 'quark' else 1) for p in ms)
    check(tot == 0, 'generation %d charge sum = %s (colour counted)' % (g, tot))
    ups = [p for p in ms if p['family'] == 'quark' and Q(p['charge']) == F(2, 3)]; downs = [p for p in ms if p['family'] == 'quark' and Q(p['charge']) == F(-1, 3)]
    check(len(ups) == 1 and len(downs) == 1, 'generation %d needs one up-type and one down-type quark' % g)
# charge matches the PDG database
pdgq = {'up': 2, 'down': 1, 'strange': 3, 'charm': 4, 'bottom': 5, 'top': 6, 'electron': 11, 'muon': 13, 'tau': 15, 'nu_e': 12, 'nu_mu': 14, 'nu_tau': 16, 'gluon': 21, 'photon': 22, 'z_boson': 23, 'w_boson': 24, 'higgs': 25}
for pid, mc in pdgq.items():
    r = EX['particles'][str(mc)]; ch = F(r['charge']).limit_denominator(3)
    p = PB[pid]
    mine = Q(p['charge'].replace('±1', '+1'))
    check(mine == ch, '%s charge %s differs from PDG %s' % (pid, mine, ch))
    check(F(p['spin']) == F(r['J']), '%s spin %s differs from PDG %s' % (pid, p['spin'], r['J']))

# 3. proton and neutron charges from quark content
tot = lambda names: sum(qn.QN[n][0] for n in names)
PRO, NEU = D['composites']
check(tot(PRO['quarks']) == 1 and PRO['quarks'] == ['u', 'u', 'd'], 'proton must be uud with charge +1')
check(tot(NEU['quarks']) == 0 and NEU['quarks'] == ['u', 'd', 'd'], 'neutron must be udd with charge 0')
check(qn.totals(PRO['quarks'])[2] == 1 and qn.totals(NEU['quarks'])[2] == 1, 'baryon number of p and n is 1')
for h in D['hadrons']:
    q, L, B = qn.totals(h['quarks'])
    if not h.get('quark_content_mixed'):
        check(q == Q(h['charge']), '%s: charge from quark content %s != listed %s' % (h['id'], q, h['charge']))
    else: check(q == 0 and Q(h['charge']) == 0, h['id'] + ': mixed-content hadron must be neutral')
    check(B in (0, 1), h['id'] + ' baryon number')
    check((len(h['quarks']) == 3) == (h['kind'] == 'baryon'), h['id'] + ' kind vs quark count')
    if h['kind'] == 'baryon': check(F(h['spin']).denominator == 2, h['id'] + ' baryon spin must be half-integer')
    else: check(F(h['spin']).denominator == 1, h['id'] + ' meson spin must be integer')
    check(h['mass'].get('pdgid') in EX['records'] or h['mass'].get('value'), h['id'] + ' mass source')

# 4. every number carrying a pdgid matches the extract exactly
def walk(o, path=''):
    if isinstance(o, dict):
        if 'pdgid' in o and 'edition' in o and 'text' in o and o.get('value') is not None and o['pdgid'] in EX['records'] and not o.get('pdg_override'):
            vs = EX['records'][o['pdgid']]['values']
            check(any(abs((v['value'] or 0) - o['value']) <= 1e-12 * max(1, abs(o['value'])) for v in vs), 'value mismatch with PDG extract at ' + path + ' ' + o['pdgid'])
            check(o['edition'] == 2026, 'edition at ' + path)
        for k, v in o.items(): walk(v, path + '/' + k)
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(v, path + '/%d' % i)
walk(D)
for p in D['particles']:
    check(bool(p.get('sources')), p['id'] + ' has no sources')
    for s in p['sources']:
        check(s in EX['records'] or s == 'G021', p['id'] + ' source not in PDG extract: ' + s)
    check(p['discovery'] and p['everyday'], p['id'] + ' needs discovery and everyday text')
    for k in ('symbol', 'name', 'antiparticle', 'colour', 'weak_isospin', 'mass', 'lifetime', 'decays', 'feels'):
        check(k in p, p['id'] + ' missing ' + k)
    if p['mass'].get('known', True) and p['id'] not in ('gluon', 'photon'): check(p['mass'].get('eV', 0) > 0 and p['mass'].get('scheme') and p['mass'].get('note'), p['id'] + ' mass needs value, scheme and note')
check(PB['up']['mass']['scheme'].startswith('MS-bar') and PB['charm']['mass']['scheme'].startswith('MS-bar') and 'Direct' in PB['top']['mass']['scheme'], 'quark mass schemes')
for n in ('nu_e', 'nu_mu', 'nu_tau'): check(PB[n]['mass']['known'] is False and PB[n]['antiparticle']['self_conjugate'] is None, n + ': mass unknown, Majorana question open')

# 5. every decay balances charge, lepton number and baryon number
def decays():
    for p in D['particles']: yield p['id'], p['decays']
    yield 'neutron', [NEU['decay']]
    for h in D['hadrons']: yield h['id'], h.get('decays', [])
nbal = 0
for owner, ds in decays():
    for d in ds:
        if not d['out']: continue
        names = d['in'] + d['out']
        if any(n in qn.UNBALANCEABLE for n in names): continue
        bad = [n for n in names if n not in qn.QN]
        if bad: fails.append('%s decay %s uses unknown particle %s' % (owner, d['label'], bad)); continue
        a, b = qn.totals(d['in']), qn.totals(d['out'])
        check(a == b, '%s: %s does not balance: %s -> %s' % (owner, d['label'], a, b)); nbal += 1
check(nbal >= 25, 'too few decays checked (%d)' % nbal)
# branching fractions cannot sum beyond 1
for owner, ds in decays():
    s = sum(d['br']['value'] for d in ds if d.get('br') and d['br']['value'])
    check(s <= 1.0 + 1e-9, owner + ' branching fractions sum to ' + str(s))

# 6. composite and derived numbers
check(abs(D['proton_mass_origin']['rest_mass_fraction'] - 0.00961) < 2e-4, 'u+u+d rest-mass fraction of the proton')
check(sum(D['proton_mass_origin']['parts'].values()) in range(98, 106), 'proton mass decomposition percentages')
g = 6.67430e-11; e = 1.602176634e-19; eps0 = 8.8541878128e-12; mp = 1.67262192369e-27
ratio = e ** 2 / (4 * 3.141592653589793 * eps0) / (g * mp ** 2)
check(1.2e36 < ratio < 1.3e36, 'electric/gravity ratio for two protons %.3g' % ratio)
check(300000 < D['mass_axis']['top_over_electron'] < 360000, 'top/electron mass ratio')
check(D['mass_axis']['electron_over_neutrino_at_least'] > 1e6, 'electron is more than a million times heavier than the KATRIN limit')
check(sum(n for _, n in D['free_parameters']['list']) == D['free_parameters']['count'] == 19, 'free parameter count')
check(D['neutrinos']['direct_bound']['frontier'] in frontier and D['neutrinos']['oscillation_frontier'] in frontier, 'frontier ids for neutrinos')
check(len(D['open_questions']) >= 9 and all(q['cert'] in ('C1', 'C2', 'C3', 'C4') for q in D['open_questions']), 'open questions need certainty tags')
check(all(q.get('kn') in kn for q in D['open_questions'] if q.get('kn')), 'open question kn ids')
check(abs(D['compositeness']['length_m_range'][0] - 5.4e-21) < 3e-22, 'compositeness length')

# 7. nodes
ids = [n['id'] for n in nodes]; idset = set(ids)
check(len(ids) == len(idset), 'duplicate node ids')
check(all(i.startswith('sm_') for i in ids), 'node ids must start with sm_')
for p in D['particles']: check(p['node'] in idset, p['node'] + ' node missing')
for c in ('proton', 'neutron'): check('sm_' + c in idset, c + ' node')
allnodes = set(idset)
for f in glob.glob(os.path.join(ROOT, 'data', 'nodes', '*.json')):
    if os.path.basename(f) not in ('manifest.json',): allnodes |= {x['id'] for x in json.load(open(f))}
required = ('id', 'title', 'kind', 'template', 'summary', 'layers', 'facts', 'certainty', 'refs', 'kn', 'parents', 'parts', 'made_of')
for n in nodes:
    for k in required: check(k in n, n['id'] + ' missing ' + k)
    check(all(n['layers'].get(k) for k in ('basics', 'deeper', 'expert')), n['id'] + ' needs all three layers')
    check(n['certainty'] in ('C1', 'C2', 'C3', 'C4'), n['id'] + ' certainty')
    check(n['refs'], n['id'] + ' needs at least one OpenStax reference')
    for r in n['refs']:
        b = books.get(r[0]); ok = False
        if b:
            ch = b['ch'][int(r[1].split('.')[0]) - 1]
            ok = any(s[0] == r[1] and s[2] == r[2] for s in ch[2])
        check(ok, n['id'] + ' ref does not resolve: ' + str(r))
    check(n['kn'] and all(k in kn for k in n['kn']), n['id'] + ' kn ids must resolve: ' + str([k for k in n['kn'] if k not in kn]))
    for fld in ('parents', 'parts', 'made_of', 'related', 'needs'):
        for x in n.get(fld, []): check(x in allnodes, '%s %s -> %s does not exist' % (n['id'], fld, x))
    check(n['id'] in viz, n['id'] + ' needs a figure')
    check('<script' not in json.dumps(n).lower(), n['id'] + ' script in text')
check(set(viz) == idset, 'figures must match nodes exactly: ' + str(set(viz) ^ idset))
for k in ('katrin_neutrino', 'muon_g2', 'juno_oscillation'): check(k in frontier, 'frontier ' + k)
# nodes that carry quantitative statements about neutrinos must point to the frontier note rather than restate 2025 numbers
check('katrin_neutrino' in json.dumps(nodes), 'nodes should mention the frontier entry katrin_neutrino')


# 8. prose checks (added after the science referee review): statements in the cards must agree with the data
import re
JS = open(os.path.join(ROOT, 'js', 'particles.js'), encoding='utf-8').read()
def texts():
    """every human-readable string in the data files and the on-screen strings: (where, text)"""
    def walk_s(o, path):
        if isinstance(o, str): yield path, o
        elif isinstance(o, dict):
            for k, v in o.items(): yield from walk_s(v, path + '/' + str(k))
        elif isinstance(o, list):
            for i, v in enumerate(o): yield from walk_s(v, path + '/%d' % i)
    yield from walk_s(D, 'particles.json'); yield from walk_s(nodes, 'nodes'); yield from walk_s(viz, 'viz'); yield 'particles.js', JS
plain = lambda t: re.sub(r'<[^>]+>', ' ', t)
ALLTXT = [(w, plain(t)) for w, t in texts()]

# 8a. any stated mass ratio ("about N times ...", "twice") between two named particles agrees with the data within 10%
MG = {}   # mass in MeV
for pid, nm in (('up', 'up'), ('down', 'down'), ('strange', 'strange'), ('charm', 'charm'), ('bottom', 'bottom'), ('top', 'top'), ('electron', 'electron'), ('muon', 'muon'),
                ('tau', 'tau'), ('w_boson', 'W'), ('z_boson', 'Z'), ('higgs', 'Higgs')):
    MG[nm] = PB[pid]['mass']['eV'] / 1e6
MG['proton'] = PRO['mass']['value']; MG['neutron'] = NEU['mass']['value']
NAMEPAT = {'up': r'\bup(?: quark)?\b(?! to)', 'down': r'\bdown(?: quark)?\b', 'strange': r'\bstrange\b', 'charm': r'\bcharm\b', 'bottom': r'\bbottom\b', 'top': r'\btop\b', 'electron': r'\belectrons?\b',
           'muon': r'\bmuons?\b', 'tau': r'\btau\b', 'proton': r'\bprotons?\b', 'neutron': r'\bneutrons?\b', 'W': r'\bW\b', 'Z': r'\bZ\b', 'Higgs': r'\bHiggs\b'}
NUMW = {'twice': 2, 'twenty': 20}
RATIO = re.compile(r'(?:about|roughly|around)\s+([\d,]+(?:\.\d+)?|twice|twenty)', re.I)
nratio = 0
for where, t in ALLTXT:
    if where == 'particles.js': continue
    for sent in re.split(r'(?<=[.;:])\s+', t):
        if not re.search(r'times (?:as )?(?:heavy|heavier|the|a |an |its|as much)|twice-as-heavy|times as heavy|times heavier', sent): continue
        names = [n for n, pat in NAMEPAT.items() if re.search(pat, sent)]
        if len(names) < 2: continue
        for m in RATIO.finditer(sent):
            raw = m.group(1).lower(); val = NUMW.get(raw) or float(raw.replace(',', ''))
            rs = [MG[a] / MG[b] for a in names for b in names if a != b]
            nratio += 1
            check(any(abs(val / r - 1) <= 0.10 for r in rs), 'stated mass ratio "%s" (%s) matches no pair of %s within 10%%: %s... [%s]' % (m.group(0), val, names, sent[:90], where))
check(nratio >= 3, 'ratio checker found too few ratio statements (%d); is the pattern broken?' % nratio)

# 8b. proton lifetime: the 9e29 yr limit is the mode-independent one; the e+ pi0 partial limit is far larger, and any text quoting 9e29 must say so
pl = PRO['lifetime']
check(pl['bound']['value'] == 9e29 and pl['partial_e_pi0']['value'] >= 2.4e34 and pl['partial_e_pi0']['value'] > 1e4 * pl['bound']['value'], 'proton lifetime limits')
for where, t in ALLTXT:
    if where != 'particles.js' and len(t) > 40 and '9×10²⁹' in t: check('2.4×10³⁴' in t, 'text quotes the 9×10²⁹ yr proton limit without the p → e⁺π⁰ limit: ' + t[:80])

# 8c. proton mass: never "99%" / "most of the mass is gluon energy" / "few percent at most"; the 9% sigma-term share must accompany the 1% valence figure
MO = D['proton_mass_origin']['parts']
check(MO == {'quark_energy': 33, 'glue_energy': 37, 'trace_anomaly': 23, 'sigma_terms': 9}, 'lattice decomposition numbers (Yang et al. 2018)')
for where, t in ALLTXT:
    for bad in ('99%', 'few percent at most', 'Gluon energy is most', 'supply most of the mass', 'is the energy of the gluon field holding them', 'is the energy of the strong field'):
        check(bad not in t, 'banned proton-mass wording %r in %s: %s' % (bad, where, t[:80]))
for n in nodes:
    t = plain(json.dumps(n, ensure_ascii=False))
    if re.search(r'about 1% of (?:a |the )?proton|only about 1%', t) and n['id'] in ('sm_proton_mass_origin', 'sm_proton', 'sm_higgs', 'sm_up'):
        check('9%' in t, n['id'] + ' states the 1% valence mass without the 9% quark-mass-dependent (sigma-term) share')

# 8d. weak range from hbar c / m_W c^2, and the Z couplings
rng = 197.3269804 / (PB['w_boson']['mass']['eV'] / 1e6) * 1e-15   # metres (MeV fm / MeV)
for where, t in ALLTXT:
    if where == 'particles.js': continue
    for m in re.finditer(r'(\d(?:\.\d)?)×10⁻¹⁸ m', t):
        ctx = t[max(0, m.start() - 160): m.start()]
        if re.search(r'weak|W boson|reaches', ctx): check(abs(float(m.group(1)) * 1e-18 / rng - 1) < 0.10, 'weak range %s in %s differs from hbar c / m_W = %.3g m' % (m.group(0), where, rng))
for where, t in ALLTXT:
    if 'T₃ − Q sin²θ' in t: fails.append('wrong Z vector coupling (missing factor 2) in ' + where)
check(any('g_V = T₃ − 2Q sin²θ_W' in plain(n['layers']['expert']) for n in nodes if n['id'] == 'sm_z_boson'), 'Z coupling formula g_V = T3 - 2 Q sin^2 theta_W on the Z card')

# 8e. neutrinos: bounds on mass states, not flavour positions; cosmology flagged model dependent
nb = D['neutrinos']['mass_state_bounds_eV']
check(0.04 < nb['heaviest_at_least_normal'] < 0.06 and 0.008 < nb['second_at_least'] < 0.01 and nb['each_below_direct'] == 0.45 and nb['sum_below_cosmology'] == 0.064, 'neutrino mass-state bounds')
check('standard cosmological model' in JS and 'no single mass' in JS and 'KATRIN' in JS, 'mass view must explain the neutrino bounds (cosmology model dependent, flavours have no single mass)')
check('PX.NUY' in JS and '(PX.my(.05) + PX.my(.45)) / 2, 0)' not in JS, 'neutrino flavour balls must not sit inside the mass band')

# 8f. hadron builder wording
check('or when two are a quark and an antiquark' not in JS, 'builder colour message must not say that mixed triples cancel colour')
check('Quark content does not fix the particle' in JS and 'twelve hadrons' not in JS, 'builder must say quark content does not fix the particle and not mis-count the table')
check(len(D['hadrons']) + len(D['composites']) == 14 and 'Object.keys(PX.H).length' in JS, 'hadron table size is computed (p, n + 12 hadrons = 14)')

# 8g. gluon momentum fraction carries scale, uncertainty and the global-fit comparison
pm = D['proton_momentum']
check(pm['scale_GeV'] == 2 and 0.39 < pm['global_fits']['JAM19'] < 0.42 and pm['gluons_uncertainty'] and pm['gluons'] > pm['global_fits']['CT18'], 'momentum fraction needs scale, uncertainty and global fits')
for where, t in ALLTXT:
    if re.search(r'about half of the (?:proton.s )?momentum|carry about half', t): fails.append('unqualified "about half" gluon momentum in ' + where)

# 8h. grammar slips, doubled periods, counting convention, photon credit
ART = re.compile(r'\b[Aa] ((?:[aeiAEI]|[oO](?!ne\b|nce\b)|[uU](?!ni|se|ra|nit|ltra|\())\w*)')
for where, t in ALLTXT:
    for m in ART.finditer(t):
        fails.append('"a %s" should be "an": %s [%s]' % (m.group(1), t[max(0, m.start() - 30): m.end() + 30], where))
    if where != 'particles.js': check('..' not in t.replace('...', '').replace('…', ''), 'doubled period in %s: %s' % (where, t[:60]))
check('Einstein (1905) proposed that light itself' in PB['photon']['discovery'], 'photon discovery sentence must credit Einstein 1905 for light quanta')
check('convention' in D['particle_count_note'] and any('convention' in plain(n['layers']['basics']) for n in nodes if n['id'] == 'sm_overview'), 'overview must say that seventeen is a counting convention')

if fails:
    print('FAILED (%d):' % len(fails)); [print(' -', f) for f in fails]; sys.exit(1)
print('OK: 17 particles, %d hadrons, %d decays balanced, %d nodes, %d figures, all references resolve' % (len(D['hadrons']), nbal, len(nodes), len(viz)))
