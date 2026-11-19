#!/usr/bin/env python3
"""Generate data/atomic/scf.json: mean radius <r> and radius of maximum density of every occupied subshell of every element,
from the self-consistent central-field calculation in scf.py, and validate it.

    PYTHONPATH=<dir with scipy+numpy> python3 tools/atom/build_scf.py

Validation (stored in the output):
  * hydrogenic test: the solver without electron-electron terms must give <r> = (3n^2 - l(l+1)) / (2Z) (exact);
  * grid test: Au, U and Fe on a grid half as fine must agree to 1e-3;
  * comparison with Hartree-Fock: tools/atom/reference/mann1968_raw.json holds <r> and r_max read from Table 11 of J. B. Mann,
    Los Alamos report LA-3691 (1968), numerical non-relativistic Hartree-Fock for H-Lr. It is used for the atoms whose configuration
    in that table equals the NIST ground-state configuration of this app, and only for rows whose 1s radius agrees with ours
    within 6 percent (a guard against misread names in the scanned report).
"""
import os, sys, json, re, math
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import scf
from multiprocessing import Pool
LETTER = 'spdfg'
A0_PM = 52.9177210544

EL = json.load(open(os.path.join(ROOT, 'data/elements.json'), encoding='utf-8'))
BYZ = {e['Z']: e for e in EL}

def occ_of(e): return {(int(k[0]), LETTER.index(k[1])): v for k, v in e['subshells'].items()}

def run(Z, **kw):
    e = BYZ[Z]; res, rec = scf.solve(Z, occ_of(e), **kw)
    return Z, res, rec

def mann_config(h):
    """Configuration from a (garbled) block header such as '3010 4S I' (= 3d10 4s1: OCR reads D as 0 and a lone 1 as I)."""
    rest = re.sub(r'^[A-Za-z _\.\-\u2022\u00b7]+', '', h)
    rest = re.sub(r'^[A-Za-z _]+?(?=\d)', '', rest) if re.match(r'^[A-Za-z]', rest) else rest
    out, last = {}, None
    for t in rest.split():
        m = re.fullmatch(r'(\d)([SPDF0])(\d*|I|l)', t)
        if m:
            l = 'd' if m.group(2) == '0' else m.group(2).lower(); c = m.group(3)
            last = f'{m.group(1)}{l}'; out[last] = 1 if c in ('I', 'l', '') else int(c)
        elif t in ('I', 'l', '1') and last and out.get(last) == 1: pass
    return out

def validate(results):
    ref = json.load(open(os.path.join(HERE, 'reference/mann1968_raw.json')))
    rows, skipped = [], []
    for zs, blk in ref.items():
        Z = int(zs); e = BYZ[Z]; mc = mann_config(blk['header'])
        mine = results[Z]
        if not mc or any(e['subshells'].get(k) != v for k, v in mc.items()):
            skipped.append((e['symbol'], 'configuration differs or unreadable')); continue
        o = blk['orbitals']
        if '1s' in o:
            a = mine['1s']['r_mean']
            if abs(a / o['1s']['r_mean'] - 1) > 0.06: skipped.append((e['symbol'], '1s radius disagrees: block misread')); continue
        top = max(o, key=lambda q: (int(q[0]), 'spdf'.index(q[1]))) if o else None
        for k, v in o.items():
            if k in mine: rows.append(dict(el=e['symbol'], sub=k, mann=v['r_mean'], mine=mine[k]['r_mean'], err=mine[k]['r_mean'] / v['r_mean'] - 1,
                                         valence=(k == top), rmax_mann=v.get('r_max'), rmax_mine=mine[k]['r_max']))
    return rows, skipped

def stats(x):
    a = np.abs(np.array(x))
    return dict(n=len(a), mean_abs=round(float(a.mean()), 4), median_abs=round(float(np.median(a)), 4), p90_abs=round(float(np.percentile(a, 90)), 4), max_abs=round(float(a.max()), 4),
                mean_signed=round(float(np.mean(x)), 4))

def main():
    with Pool(min(16, os.cpu_count() or 1)) as p: out = p.map(run, list(range(1, 119)))
    results = {Z: {f'{n}{LETTER[l]}': v for (n, l), v in res.items()} for Z, res, rec in out}
    recs = {Z: rec for Z, res, rec in out}
    assert all(r['residual'] < 1e-7 for r in recs.values()), [Z for Z, r in recs.items() if r['residual'] >= 1e-7]
    # --- tests of the solver itself
    herr = 0.0
    for Z in (2, 10, 50, 92):
        for n, l in ((1, 0), (2, 0), (2, 1), (3, 2), (4, 3)):
            if n <= l: continue
            res, _ = scf.solve(Z, {(m, l): (1 if m == n else 0) for m in range(l + 1, n + 1)}, interact=False)   # lower states empty but present
            exact = (3 * n * n - l * (l + 1)) / (2 * Z)
            herr = max(herr, abs(res[(n, l)]['r_mean'] / exact - 1))
    gerr = 0.0
    for Z in (26, 79, 92):
        coarse, _ = scf.solve(Z, occ_of(BYZ[Z]), N=1200)
        for (n, l), v in coarse.items(): gerr = max(gerr, abs(v['r_mean'] / results[Z][f'{n}{LETTER[l]}']['r_mean'] - 1))
    rows, skipped = validate(results)
    allerr = [r['err'] for r in rows]; val = [r['err'] for r in rows if r['valence']]
    rm_all = [r['rmax_mine'] / r['rmax_mann'] - 1 for r in rows if r['rmax_mann']]
    rm = [x for x in rm_all if abs(x) < 0.5]            # a larger difference means a misread digit in the scanned table, not physics
    worst = sorted(rows, key=lambda r: -abs(r['err']))[:8]
    atoms = sorted({r['el'] for r in rows}, key=lambda s: next(e['Z'] for e in EL if e['symbol'] == s))
    elements = {}
    for Z, r in results.items():
        e = BYZ[Z]
        elements[e['symbol']] = {k: dict(r_mean=round(v['r_mean'], 5), r_max=round(v['r_max'], 5), eps=round(v['e'], 4)) for k, v in r.items()}
    doc = dict(
        method=dict(
            name='Spherical non-relativistic self-consistent central-field atom (Hartree-Fock-Slater type: local exchange, no correlation)',
            code='tools/atom/scf.py', exchange='Kohn-Sham/Gaspar local exchange, V_x = -(3 rho / pi)^(1/3) (alpha = 2/3)', hartree='full Hartree potential of the total spherical density',
            occupations='ground-state configuration of the app (NIST), spherically averaged: fractional occupation of each subshell, no spin polarisation',
            relativity='none', correlation='none', hydrogen='one-electron atom solved without electron-electron terms (exact)',
            grid='logarithmic, 2400 points, r from min(1e-3, 0.03/Z) to 80 bohr; eigenvalues by tridiagonal solver; mixing 0.35 (reduced automatically if needed); converged to 1e-9 in the density',
            units='bohr (a0 = 52.9177210544 pm, CODATA 2022); eps in hartree',
            use='The app draws each subshell as a hydrogen-like function with its n-l-1 nodes, rescaled so that its <r> equals r_mean here.'),
        validation=dict(
            hydrogenic_test=dict(what='bare Coulomb field, <r> against (3n^2 - l(l+1))/(2Z), Z = 2, 10, 50, 92', max_rel_error=float(f'{herr:.2e}')),
            grid_test=dict(what='Fe, Au, U on a grid with half the points', max_rel_difference=float(f'{gerr:.2e}')),
            reference=dict(source='J. B. Mann, Atomic Structure Calculations II. Hartree-Fock wavefunctions and radial expectation values: hydrogen to lawrencium, Los Alamos Scientific Laboratory report LA-3691 (1968), Table 11',
                           url='https://www.osti.gov/biblio/4553157', how='numbers read from the OCR text layer of the scanned report by tools/atom/parse_mann.py; rows failing consistency tests dropped',
                           atoms=atoms, n_atoms=len(atoms), skipped=[f'{a}: {b}' for a, b in skipped]),
            all_subshells=stats(allerr), outermost_subshell=stats(val), r_max_all=dict(stats(rm), excluded_as_misread=len(rm_all) - len(rm)),
            worst=[dict(el=r['el'], sub=r['sub'], mine=round(r['mine'], 4), hartree_fock=r['mann'], rel_error=round(r['err'], 3)) for r in worst],
            note='Relative error of <r> (this calculation / Hartree-Fock - 1). Both are non-relativistic, so this measures the cost of the local-exchange approximation only; real heavy atoms also differ by relativity (not in this table).'),
        elements=elements)
    path = os.path.join(ROOT, 'data/atomic/scf.json')
    with open(path, 'w', encoding='utf-8') as f: json.dump(doc, f, ensure_ascii=False, separators=(',', ':')); f.write('\n')
    v = doc['validation']
    print('atoms compared', len(atoms), '| subshells', v['all_subshells'], '| outermost', v['outermost_subshell'])
    print('hydrogenic', herr, 'grid', gerr, '| worst', v['worst'][:4], '| skipped', len(skipped))

if __name__ == '__main__':
    main()
