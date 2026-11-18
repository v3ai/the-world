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

if fails:
    print('FAILED (%d):' % len(fails)); [print(' -', f) for f in fails]; sys.exit(1)
print('OK: 17 particles, %d hadrons, %d decays balanced, %d nodes, %d figures, all references resolve' % (len(D['hadrons']), nbal, len(nodes), len(viz)))
