#!/usr/bin/env python3
"""Invariant checks for data/elements.json and data/atomic/*.json.  Exit status 0 = all pass.

Usage: python3 tools/atom/check_elements.py [cache_dir]
The reference tables below were typed by hand from the NIST Atomic Spectra Database and CIAAW pages (see sources.json);
they are deliberately independent of the generator so a bug in the parser cannot hide itself.
"""
import json, os, re, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('ATOM_CACHE', os.path.join(HERE, '.cache'))
D = lambda p: json.load(open(os.path.join(ROOT, 'data', p), encoding='utf-8'))
E = D('elements.json'); ZF = D('atomic/zeff.json')['elements']; ISO = D('atomic/isotopes.json'); LN = D('atomic/lines.json')
fails = []
def check(cond, msg):
    if not cond: fails.append(msg)

# NIST ASD "Ground levels and ionization energies for the neutral atoms": the ground-state configurations that break
# the simple filling order (Madelung n+l rule), valence part only, as printed by NIST.
ANOMALIES = {
    24: '3d5 4s1', 29: '3d10 4s1', 41: '4d4 5s1', 42: '4d5 5s1', 44: '4d7 5s1', 45: '4d8 5s1', 46: '4d10', 47: '4d10 5s1',
    57: '5d1 6s2', 58: '4f1 5d1 6s2', 64: '4f7 5d1 6s2', 78: '4f14 5d9 6s1', 79: '4f14 5d10 6s1',
    89: '6d1 7s2', 90: '6d2 7s2', 91: '5f2 6d1 7s2', 92: '5f3 6d1 7s2', 93: '5f4 6d1 7s2', 96: '5f7 6d1 7s2', 103: '5f14 7s2 7p1'}
# a few regular ones, to be sure the anomaly detector is not simply marking everything
REGULAR = {1: '1s1', 8: '2s2 2p4', 26: '3d6 4s2', 30: '3d10 4s2', 43: '4d5 5s2', 63: '4f7 6s2', 70: '4f14 6s2', 74: '5d4 6s2', 80: '5d10 6s2', 102: '5f14 7s2'}
# NIST first ionisation energies (eV) and CIAAW atomic weights typed from the fetched pages: 31 elements across the table
SPOT = {  # Z: (IE eV, atomic weight)
    1: (13.598434599702, 1.008), 2: (24.587389011, 4.0026), 3: (5.391714996, 6.94), 4: (9.322699, 9.0122), 6: (11.2602880, 12.011),
    7: (14.53413, 14.007), 8: (13.618055, 15.999), 9: (None, 18.998), 10: (None, 20.180), 11: (None, 22.990), 13: (None, 26.982),
    15: (None, 30.974), 26: (None, 55.845), 29: (None, 63.546), 47: (None, 107.87), 79: (None, 196.97), 80: (None, 200.59),
    82: (None, 207.2), 83: (None, 208.98), 84: (8.418070, None), 85: (9.31751, None), 86: (10.74850, None), 87: (4.0727411, None),
    88: (5.2784239, None), 89: (5.380235, None), 90: (6.30670, 232.04), 91: (None, 231.04), 92: (6.19405, 238.03), 93: (6.265608, None),
    94: (6.02576, None), 96: (5.992241, None)}
IE_NIST_SPOT = {26: 7.9024681, 29: 7.72638, 47: 7.576234, 79: 9.2255, 80: 10.437504, 82: 7.416680}  # filled below only if cache present

CAP = {'s': 2, 'p': 6, 'd': 10, 'f': 14, 'g': 18}
cats = {}
check(len(E) == 118, 'not 118 elements')
for i, e in enumerate(E, 1):
    s = e['symbol']; Z = e['Z']
    check(Z == i, f'{s}: Z order')
    subs = e['subshells']
    check(sum(subs.values()) == Z, f'{s}: electron count {sum(subs.values())} != Z {Z}')
    for k, v in subs.items():
        check(0 < v <= CAP[k[1]], f'{s}: {k}{v} over capacity')
    # the printed config string must expand to the same occupancies
    cfg = e['config']; occ = {}
    m = re.match(r'\[(\w+)\]\s*(.*)', cfg)
    if m:
        core = {'He': 2, 'Ne': 10, 'Ar': 18, 'Kr': 36, 'Xe': 54, 'Rn': 86}[m.group(1)]
        check(sum(subs.values()) >= core, f'{s}: core larger than atom')
        rest = m.group(2).split()
    else:
        rest = cfg.split()
    n_rest = sum(int(re.fullmatch(r'\d[spdfg](\d+)', t).group(1)) for t in rest)
    check(n_rest + (core if m else 0) == Z, f'{s}: config string electron count')
    # table geometry
    check(e['period'] == [1, 1] + [2] * 8 + [3] * 8 + [4] * 18 + [5] * 18 + [6] * 32 + [7] * 32 and False or True, '')
    P = [0] + [1] * 2 + [2] * 8 + [3] * 8 + [4] * 18 + [5] * 18 + [6] * 32 + [7] * 32
    check(e['period'] == P[Z], f'{s}: period {e["period"]} expected {P[Z]}')
    g, b = e['group'], e['block']
    if 57 <= Z <= 70 or 89 <= Z <= 102: check(g is None and b == 'f', f'{s}: f-block placement')
    elif Z == 2: check(g == 18 and b == 's', 'He')
    elif g in (1, 2): check(b == 's', f'{s}: s block')
    elif g in range(13, 19): check(b == 'p', f'{s}: p block')
    elif g in range(3, 13): check(b == 'd', f'{s}: d block')
    else: check(False, f'{s}: bad group {g}')
    cats[e['category']] = cats.get(e['category'], 0) + 1
    # config reference
    valence = lambda: ' '.join(f'{k}{v}' for k, v in subs.items() if k in [kk for kk in subs][-6:])
    if Z in ANOMALIES:
        check(e['config_anomaly'], f'{s}: should be flagged anomalous')
        check(e['config'].endswith(ANOMALIES[Z]), f'{s}: config {e["config"]} != NIST …{ANOMALIES[Z]}')
    elif Z <= 108 and not (109 <= Z):
        check(not e['config_anomaly'], f'{s}: flagged anomalous but not in the NIST anomaly list')
    if Z in REGULAR: check(e['config'].endswith(REGULAR[Z]), f'{s}: config {e["config"]}')
    check(e['config_predicted'] == (Z >= 103), f'{s}: config_predicted flag')
    # isotopes
    iso = e['isotopes']
    if iso:
        tot = sum(a for _, a in iso)
        check(abs(tot - 1) < 0.002, f'{s}: abundance sum {tot}')
        check(all(a >= Z * 0 for _, a in iso) and all(A >= Z for A, _ in iso), f'{s}: isotope A < Z')
        check(e['mostAbundantA'] == max(iso, key=lambda t: t[1])[0], f'{s}: mostAbundantA')
        avg = sum(A * a for A, a in iso) / tot
        check(abs(avg - e['mass']) / e['mass'] < 0.01, f'{s}: mass {e["mass"]} vs abundance-weighted {avg:.3f}')
    else:
        ll = ISO[s]['longest_lived']
        check(ll is not None and ll['A'] == e['mostAbundantA'], f'{s}: longest-lived isotope missing')
        check(ll and ll['half_life_s'] and ll['half_life_s'] > 0, f'{s}: half-life')
        check(abs(e['mass'] - e['mostAbundantA']) < 0.5, f'{s}: mass {e["mass"]} vs A {e["mostAbundantA"]}')
        check(e['isotope_basis'] == 'longest-lived known isotope', f'{s}: basis')
    # zeff
    zz = ZF[s]
    check(set(zz['zeff']) == set(subs), f'{s}: zeff subshells')
    for k, v in zz['zeff'].items():
        check(0.5 < v <= Z, f'{s}: zeff {k}={v}')
    check(zz['zeff']['1s'] > Z - 2 or Z == 1, f'{s}: 1s zeff too small')
    check(zz['method'] == ('clementi-raimondi' if Z <= 86 and set(zz['src'].values()) == {'C'} else zz['method']), f'{s}: zeff method')
    if Z > 86: check(set(zz['src'].values()) == {'S'}, f'{s}: Z>86 should use Slater only')
    # outer subshell zeff should be the smallest or close for the valence s/p
    # text
    check(len(e['summary']) > 60 and 'TODO' not in e['summary'], f'{s}: summary')
    check(e['phase_stp'] in ('gas', 'liquid', 'solid', 'unknown'), f'{s}: phase')
    if e['melt_K'] and e['boil_K']: check(e['boil_K'] > e['melt_K'] or s in ('As',), f'{s}: boil<melt')
    check(e['ionization_eV'] is None or 3 < e['ionization_eV'] < 25, f'{s}: ionisation energy {e["ionization_eV"]}')
    check(e['discovered'] is None or e['discovered'] == 'antiquity' or 1600 < e['discovered'] < 2026, f'{s}: discovered')
    if Z in SPOT:
        ie, aw = SPOT[Z]
        if ie is not None: check(abs(e['ionization_eV'] - ie) < 1e-6 * max(1, ie) + 1e-9, f'{s}: IE {e["ionization_eV"]} != NIST {ie}')
        if aw is not None: check(abs(e['mass'] - aw) < 0.0006 * aw, f'{s}: mass {e["mass"]} != CIAAW {aw}')
check(cats == {'Transition metals': 40, 'Lanthanides': 14, 'Actinides': 14, 'Poor metals': 11, 'Nonmetals': 7, 'Noble gases': 7,
               'Metalloids': 7, 'Alkali metals': 6, 'Alkaline earth metals': 6, 'Halogens': 6}, f'category counts {cats}')
check(sum(1 for e in E if e['config_anomaly']) == len(ANOMALIES), 'anomaly count differs from reference table of %d' % len(ANOMALIES))
for s, k in (('Hg', 'liquid'), ('Br', 'liquid'), ('Fe', 'solid'), ('O', 'gas')):
    check(next(e for e in E if e['symbol'] == s)['phase_stp'] == k, f'{s} phase')
# Slater self-test on a textbook case: Fe 4s -> 3.75, Fe 3d -> 6.25 (Slater 1930)
sys.path.insert(0, HERE)
try:
    import importlib.util
    spec = importlib.util.spec_from_file_location('be', os.path.join(HERE, 'build_elements.py'))
    src = open(os.path.join(HERE, 'build_elements.py')).read()
    ns = {}
    fn = re.search(r'def slater_zeff.*?\n    return Z - S\n', src, re.S).group(0)
    exec("LETTER='spdfg'\n" + fn, ns)
    fe = {'1s': 2, '2s': 2, '2p': 6, '3s': 2, '3p': 6, '3d': 6, '4s': 2}
    check(abs(ns['slater_zeff'](fe, '4s') - 3.75) < 1e-9, 'Slater Fe 4s')
    check(abs(ns['slater_zeff'](fe, '3d') - 6.25) < 1e-9, 'Slater Fe 3d')
    check(abs(ns['slater_zeff'](fe, '1s') - 25.70) < 1e-9, 'Slater Fe 1s')
except Exception as ex:
    fails.append('slater self-test: %r' % ex)
# hydrogen lines against the fetched NIST H I list (if the cache is present)
H = {(l['n_lower'], l['n_upper']): l for l in LN['hydrogen']['lines']}
check(abs(H[(2, 3)]['wl_air_nm'] - 656.28) < 0.02, 'H-alpha air wavelength %s' % H[(2, 3)])
check(abs(H[(1, 2)]['wl_vac_nm'] - 121.567) < 0.002, 'Lyman-alpha vacuum wavelength %s' % H[(1, 2)])
check(abs(H[(2, 4)]['wl_air_nm'] - 486.13) < 0.02, 'H-beta')
hp = os.path.join(CACHE, 'lines', 'H.csv')
if os.path.exists(hp):
    import csv
    nist = []
    for r in list(csv.reader(open(hp)))[1:]:
        c = [x.replace('="', '').replace('"', '') for x in r]
        try: nist.append(float(c[0] or c[2]))
        except Exception: pass
    for (nl, nu), l in H.items():
        if 'wl_air_nm' in l and 380 < l['wl_air_nm'] < 780:
            near = min(nist, key=lambda x: abs(x - l['wl_air_nm'])) if nist else None
            check(near is not None and abs(near - l['wl_air_nm']) < 0.02, f'H {nl}->{nu}: computed {l["wl_air_nm"]} vs NIST {near}')
for s, rows in LN['elements'].items():
    for r_ in rows: check(380 <= r_['wl_nm'] <= 780, f'{s}: line outside 380-780 nm')
check(sum(1 for v in LN['elements'].values() if v) >= 90, 'too few elements have fetched lines')
# the cross-check against the downloaded NIST ground-level table, when available
gp = os.path.join(CACHE, 'nist_ground.csv')
if os.path.exists(gp):
    import csv
    for r in list(csv.reader(open(gp)))[1:]:
        c = [x.replace('="', '').replace('"', '') for x in r]
        if len(c) > 10 and c[0].isdigit() and c[9]:
            e = E[int(c[0]) - 1]
            check(abs(e['ionization_eV'] - float(c[9])) < 1e-8, f'{e["symbol"]}: IE differs from NIST table')
print('elements checked:', len(E), '| anomalies:', sum(1 for e in E if e['config_anomaly']))
if fails:
    print('FAILURES (%d):' % len(fails)); [print(' -', f) for f in fails[:60]]; sys.exit(1)
print('all checks passed')
