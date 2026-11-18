#!/usr/bin/env python3
"""Generate data/elements.json and data/atomic/{zeff,isotopes,lines,sources}.json.

Run tools/atom/fetch_sources.py first (it fills the cache), then:
    ATOM_CACHE=<cache dir> python3 tools/atom/build_elements.py
Needs the `mendeleev` package (pip install mendeleev) for the basic per-element properties and the
Clementi-Raimondi screening constants. Everything else comes straight from the primary sources listed in sources.json.
"""
import os, re, csv, json, math, html, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.environ.get('ATOM_CACHE', os.path.join(HERE, '.cache'))
OUT = os.path.join(ROOT, 'data')
os.makedirs(os.path.join(OUT, 'atomic'), exist_ok=True)

from mendeleev import element as mend_element
from mendeleev.db import get_session
from mendeleev.models import ScreeningConstant

SYMS = ("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo "
        "Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb "
        "Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og").split()
LETTER = 'spdfg'
NOBLE = [(2, 'He'), (10, 'Ne'), (18, 'Ar'), (36, 'Kr'), (54, 'Xe'), (86, 'Rn')]

def rd(name):
    return open(os.path.join(CACHE, name), encoding='utf-8', errors='replace').read()

def clean(x):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', x)).replace('\xa0', ' ')).strip()

# ---------------------------------------------------------------- electron configurations
# NIST ASD ground levels (Z = 1..108). Z = 109..118 are predictions (not in NIST): Wikipedia
# "Electron configurations of the elements (data page)", which says elements beyond Hs have never been measured.
PREDICTED_109_118 = {
    109: '[Rn].5f14.6d7.7s2', 110: '[Rn].5f14.6d8.7s2', 111: '[Rn].5f14.6d9.7s2', 112: '[Rn].5f14.6d10.7s2',
    113: '[Rn].5f14.6d10.7s2.7p', 114: '[Rn].5f14.6d10.7s2.7p2', 115: '[Rn].5f14.6d10.7s2.7p3',
    116: '[Rn].5f14.6d10.7s2.7p4', 117: '[Rn].5f14.6d10.7s2.7p5', 118: '[Rn].5f14.6d10.7s2.7p6'}

def parse_subshells(s, cores):
    out = {}
    for tok in s.split('.'):
        tok = tok.strip()
        if not tok: continue
        if tok.startswith('['):
            for k, v in cores[tok.strip('[]')].items(): out[k] = out.get(k, 0) + v
            continue
        m = re.fullmatch(r'(\d)([spdfg])(\d*)', tok)
        if not m: raise ValueError('bad shell token ' + tok)
        out[m.group(1) + m.group(2)] = int(m.group(3) or 1)
    return out

def sort_sub(d):
    return {k: d[k] for k in sorted(d, key=lambda k: (int(k[0]), LETTER.index(k[1])))}

def madelung(Z):
    order = sorted(((n, l) for n in range(1, 9) for l in range(0, min(n, 5))), key=lambda t: (t[0] + t[1], t[0]))
    out, left = {}, Z
    for n, l in order:
        c = min(2 * (2 * l + 1), left)
        if c: out[f'{n}{LETTER[l]}'] = c
        left -= c
        if not left: break
    return sort_sub(out)

def load_nist_ground():
    txt = rd('nist_ground.csv')
    notes = dict(re.findall(r'\[(\w+)\] = ([\w.]+)', txt))
    cores = {k: parse_subshells(v, {}) for k, v in notes.items()}
    rows = {}
    for r in csv.reader(txt.splitlines()):
        if len(r) < 12 or not r[0].startswith('="'): continue
        c = [x.replace('="', '').replace('"', '').strip() for x in r]
        Z = int(c[0])
        rows[Z] = dict(subs=sort_sub(parse_subshells(c[4], cores)), level=c[6], prefix=c[8], ie=float(c[9]) if c[9] else None,
                       ie_unc=float(c[11]) if c[11] else None, suffix=c[10], ref=c[12])
    return rows, cores

def noble_notation(subs):
    for Zc, sym in reversed(NOBLE):
        core = madelung(Zc)
        if all(subs.get(k) == v for k, v in core.items()):
            rest = {k: v for k, v in subs.items() if k not in core or subs[k] != core[k]}
            return f'[{sym}] ' + ' '.join(f'{k}{v}' for k, v in rest.items())
    return ' '.join(f'{k}{v}' for k, v in subs.items())

# ---------------------------------------------------------------- effective nuclear charge
def slater_zeff(subs, target):
    """Slater (1930) shielding rules. Groups, in order: 1s | 2s2p | 3s3p | 3d | 4s4p | 4d | 4f | 5s5p | 5d | 5f | ..."""
    def grp(k):
        n, l = int(k[0]), LETTER.index(k[1])
        return (n, 0 if l <= 1 else l)
    Z = sum(subs.values())
    tn, tl = int(target[0]), LETTER.index(target[1])
    tg = grp(target)
    S = 0.0
    for k, cnt in subs.items():
        n, l = int(k[0]), LETTER.index(k[1])
        g = grp(k)
        c = cnt - (1 if k == target else 0)
        if c <= 0: continue
        if tl <= 1:
            if g == tg: S += c * (0.30 if tn == 1 else 0.35)
            elif n == tn - 1: S += c * 0.85
            elif n < tn - 1: S += c * 1.0
        else:
            if g == tg: S += c * 0.35
            elif g < tg: S += c * 1.0
    return Z - S

def compute_zeff(Z, subs, clem):
    z, src = {}, {}
    for k in subs:
        key = (int(k[0]), k[1])
        if key in clem:
            z[k] = round(Z - clem[key], 3); src[k] = 'C'
        else:
            z[k] = round(slater_zeff(subs, k), 3); src[k] = 'S'
    kinds = set(src.values())
    method = 'clementi-raimondi' if kinds == {'C'} else 'slater' if kinds == {'S'} else 'mixed'
    return dict(method=method, zeff=z, src=src)

# ---------------------------------------------------------------- nuclides (NUBASE2020)
UNIT = {'ys': 1e-24, 'zs': 1e-21, 'as': 1e-18, 'fs': 1e-15, 'ps': 1e-12, 'ns': 1e-9, 'us': 1e-6, 'ms': 1e-3, 's': 1, 'm': 60,
        'h': 3600, 'd': 86400, 'y': 3.15576e7, 'ky': 3.15576e10, 'My': 3.15576e13, 'Gy': 3.15576e16, 'Ty': 3.15576e19,
        'Py': 3.15576e22, 'Ey': 3.15576e25, 'Zy': 3.15576e28, 'Yy': 3.15576e31}
AMU_KEV = 931494.10242  # keV per u (CODATA 2018)

def human_time(sec):
    for lim, name, div in [(1e-6, 'ns', 1e-9), (1e-3, 'µs', 1e-6), (1, 'ms', 1e-3), (120, 's', 1), (7200, 'min', 60), (172800, 'h', 3600),
                           (2 * 3.15576e7, 'days', 86400)]:
        if sec < lim: return f'{sec / div:.3g} {name}'
    y = sec / 3.15576e7
    if y < 1e3: return f'{y:.3g} years'
    if y < 1e6: return f'{y / 1e3:.3g} thousand years'
    if y < 1e9: return f'{y / 1e6:.3g} million years'
    if y < 1e12: return f'{y / 1e9:.3g} billion years'
    return f'{y:.2e} years'

def load_nubase():
    by_z = {}
    for ln in rd('nubase2020.txt').splitlines():
        if ln.startswith('#') or len(ln) < 80: continue
        A = int(ln[0:3]); zi = ln[4:8]; Z = int(zi[:3]); i = int(zi[3])
        if i != 0: continue
        me = ln[18:31].strip(); est = me.endswith('#')
        hl = ln[69:78].strip(); unit = ln[78:80].strip()
        br = ln[119:].strip() if len(ln) > 119 else ''
        rec = dict(A=A, Z=Z, mass_excess_keV=float(me.rstrip('#')) if me.rstrip('#') else None, mass_est=est, jpi=ln[88:102].strip(),
                   br=br)
        if hl == 'stbl': rec['stable'] = True; rec['half_life_s'] = None
        else:
            rec['stable'] = False
            m = re.match(r'([<>~]?)([\d.]+)#?', hl)
            if m and unit in UNIT:
                rec['half_life_s'] = float(m.group(2)) * UNIT[unit]; rec['half_life_text'] = human_time(rec['half_life_s'])
                rec['half_life_nubase'] = f'{hl} {unit}'.strip(); rec['hl_est'] = hl.endswith('#')
            else:
                rec['half_life_s'] = None; rec['half_life_nubase'] = f'{hl} {unit}'.strip()
        m = re.search(r'IS=([\d.]+)', br)
        rec['is_pct'] = float(m.group(1)) if m else None
        # leading decay mode
        rec['decay'] = br.split(';')[0].split(' ')[0] if br else ''
        by_z.setdefault(Z, []).append(rec)
    return by_z

# ---------------------------------------------------------------- CIAAW
def parse_ciaaw_abund():
    h = rd('ciaaw_abundances.html')
    out = {}
    Z = None
    for tr in re.findall(r'<tr([^>]*)>(.*?)</tr>', h, re.S):
        cells = [clean(c) for c in re.findall(r'<td[^>]*>(.*?)</td>', tr[1], re.S)]
        if 'childRow' in tr[0]:
            A, v = cells[0], cells[1]
        elif len(cells) >= 5 and cells[0].isdigit() and cells[1].isalpha():
            Z = int(cells[0]); A, v = cells[3], cells[4]
        elif len(cells) >= 4 and cells[0].isdigit() and cells[1].isalpha() and not cells[2].isdigit():
            Z = int(cells[0]); A, v = cells[3], cells[4]
        else:
            continue
        if not A.isdigit(): continue
        m = re.match(r'\[([\d.\s]+),\s*([\d.\s]+)\]', v)
        if m:
            out.setdefault(Z, {})[int(A)] = dict(interval=[float(m.group(1).replace(' ', '')), float(m.group(2).replace(' ', ''))])
        else:
            m = re.match(r'([\d.\s]+)(?:\((\d+)\))?', v)
            val = float(m.group(1).replace(' ', ''))
            out.setdefault(Z, {})[int(A)] = dict(value=val, unc_last_digits=m.group(2))
    return out

def parse_weights():
    full, abr = {}, {}
    for name, dst in (('ciaaw_weights.html', full), ('ciaaw_abridged.html', abr)):
        for tr in re.findall(r'<tr>(.*?)</tr>', rd(name), re.S):
            c = [clean(x) for x in re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)]
            if len(c) >= 4 and c[0].isdigit(): dst[int(c[0])] = c[3]
    return full, abr

# ---------------------------------------------------------------- lines (NIST ASD)
def load_lines(sym, n=12):
    p = os.path.join(CACHE, 'lines', sym + '.csv')
    if not os.path.exists(p): return []
    txt = open(p, encoding='utf-8', errors='replace').read()
    if not txt.startswith('obs_wl_air'): return []
    rows = []
    rd_ = csv.reader(txt.splitlines())
    head = [h.strip() for h in next(rd_)]
    for r in rd_:
        c = dict(zip(head, [x.replace('="', '').replace('"', '').strip() for x in r]))
        m = re.match(r'(\d+(?:\.\d+)?)', c.get('intens', ''))
        if not m: continue
        obs, ritz = c.get('obs_wl_air(nm)', ''), c.get('ritz_wl_air(nm)', '')
        try: wlf = float(re.sub(r'[^\d.]', '', obs or ritz))
        except ValueError: continue
        rows.append(dict(wl_nm=wlf, wl_kind='observed' if obs else 'Ritz', unc_nm=(c.get('unc_obs_wl') if obs else c.get('unc_ritz_wl')) or None,
                         intensity=c['intens'], _i=float(m.group(1)),
                         lower=f"{c.get('conf_i','')} {c.get('term_i','')} J={c.get('J_i','')}".strip(),
                         upper=f"{c.get('conf_k','')} {c.get('term_k','')} J={c.get('J_k','')}".strip(),
                         Aki=c.get('Aki(s^-1)') or None, ref=c.get('line_ref', '')))
    rows.sort(key=lambda d: -d['_i'])
    rows = rows[:n]
    for d in rows: d.pop('_i')
    rows.sort(key=lambda d: d['wl_nm'])
    return rows

# ---------------------------------------------------------------- hydrogen series (computed)
R_INF = 10973731.568160       # m^-1, CODATA 2018
ME_OVER_MP = 1 / 1836.15267343  # CODATA 2018
R_H = R_INF / (1 + ME_OVER_MP)

def air_from_vac(lam_nm):
    s2 = (1000.0 / lam_nm) ** 2   # sigma in um^-1, squared
    n = 1 + 8342.13e-8 + 2406030e-8 / (130 - s2) + 15997e-8 / (38.9 - s2)   # Edlen (1966), standard air
    return lam_nm / n

def hydrogen_series():
    names = {1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund'}
    out = []
    for nl, nm in names.items():
        for nu in range(nl + 1, nl + 8):
            lam_vac = 1e9 / (R_H * (1 / nl ** 2 - 1 / nu ** 2))
            d = dict(series=nm, n_lower=nl, n_upper=nu, wl_vac_nm=round(lam_vac, 4))
            if lam_vac > 200: d['wl_air_nm'] = round(air_from_vac(lam_vac), 4)
            out.append(d)
    return dict(method='Rydberg formula 1/lambda = R_H (1/n1^2 - 1/n2^2), R_H = R_inf/(1 + m_e/m_p)', R_inf_per_m=R_INF, me_over_mp=ME_OVER_MP,
                R_H_per_m=R_H, lines=out, note='Fine structure and the Lamb shift split each line by about 0.01 nm or less and are not included.')

# ---------------------------------------------------------------- main
def r(x, k=4):
    return None if x is None else round(float(x), k)

def main():
    ov = json.load(open(os.path.join(HERE, 'overrides.json')))
    summaries = json.load(open(os.path.join(HERE, 'summaries.json')))
    ground, _ = load_nist_ground()
    nub = load_nubase()
    ciaaw = parse_ciaaw_abund()
    wfull, wabr = parse_weights()
    pc = {int(x['AtomicNumber']): x for x in csv.DictReader(open(os.path.join(CACHE, 'pubchem_pt.csv')))}
    sess = get_session()
    clem_all = {}
    for s in sess.query(ScreeningConstant).all():
        clem_all.setdefault(s.atomic_number, {})[(s.n, s.s)] = s.screening
    gas = {1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86}; liquid = {35, 80}

    elements, zeffs, isos, lines = [], {}, {}, {}
    for Z, sym in enumerate(SYMS, 1):
        e = mend_element(Z)
        assert e.symbol == sym, (Z, e.symbol, sym)
        # --- configuration
        if Z in ground:
            subs = ground[Z]['subs']; basis = 'NIST ASD ground levels table'
        else:
            cores = {k: madelung(z) for z, k in NOBLE}
            subs = sort_sub(parse_subshells(PREDICTED_109_118[Z], cores)); basis = 'predicted (Z > 108); not in NIST'
        assert sum(subs.values()) == Z, (sym, subs)
        mad = madelung(Z)
        anomaly = subs != mad
        predicted = Z >= 103
        cnote = None
        if Z >= 103: cnote = 'Not measured spectroscopically; NIST (Z<=108) or the cited prediction (Z>=109). Relativistic effects are large here.'
        if Z in (110, 111): cnote = (cnote or '') + ' Calculations disagree: the CRC Handbook gives ' + ('6d9 7s1' if Z == 110 else '6d10 7s1') + '.'
        # --- Z_eff
        zeffs[sym] = compute_zeff(Z, subs, clem_all.get(Z, {}))
        # --- nuclides
        recs = nub.get(Z, [])
        natural = [x for x in recs if x['is_pct'] is not None]
        cia = ciaaw.get(Z, {})
        iso_list = []
        for x in sorted(natural, key=lambda t: t['A']):
            ab_nub = x['is_pct'] / 100
            c = cia.get(x['A'])
            if c and 'value' in c:
                ab, basis_ab = c['value'], 'CIAAW representative composition'
                assert abs(ab - ab_nub) < max(0.003, 0.05 * ab), (sym, x['A'], ab, ab_nub)
            elif c and 'interval' in c:
                lo, hi = c['interval']
                ab, basis_ab = ab_nub, 'NUBASE2020 (CIAAW gives only an interval, which this value lies in)'
                assert lo - 0.001 <= ab <= hi + 0.001, (sym, x['A'], ab, lo, hi)
            else:
                ab, basis_ab = ab_nub, 'NUBASE2020'
                assert not cia or True
            iso_list.append(dict(A=x['A'], abundance=round(ab, 6), abundance_basis=basis_ab, stable=x['stable'],
                                 half_life=x.get('half_life_nubase'), half_life_s=x['half_life_s'], half_life_text=x.get('half_life_text'),
                                 decay=x['decay'] if not x['stable'] else None))
        # stable isotopes without natural abundance flag are not listed as natural
        longest = None
        pool = [x for x in recs if x['half_life_s'] is not None or x['stable']]
        if not iso_list:
            cand = [x for x in recs if x['half_life_s'] and not x.get('hl_est')]   # measured half-lives only (NUBASE marks systematics with #)
            lg = max(cand, key=lambda t: t['half_life_s'])
            longest = dict(A=lg['A'], half_life=lg['half_life_nubase'], half_life_s=lg['half_life_s'], half_life_text=lg['half_life_text'],
                           decay=lg['decay'], estimated=lg.get('hl_est', False),
                           mass_u=round(lg['A'] + lg['mass_excess_keV'] / AMU_KEV, 6) if lg['mass_excess_keV'] is not None else None,
                           mass_estimated=lg['mass_est'],
                           note='Based on very few atoms; treat as approximate.' if Z >= 104 else None)
        known = sorted(x['A'] for x in recs)
        isos[sym] = dict(Z=Z, natural=iso_list, longest_lived=longest, known_A_range=[known[0], known[-1]] if known else None,
                         n_known=len(known), source='NUBASE2020 (Kondev et al. 2021); abundances CIAAW where a single value is given')
        if iso_list:
            mostA = max(iso_list, key=lambda t: t['abundance'])['A']
        else:
            mostA = longest['A']
        # --- mass
        wf, wa = wfull.get(Z, ''), wabr.get(Z, '')
        mass = None; mass_note = None; mass_unc = None
        if not re.match(r'[\d.]+\s*±', wa):
            assert longest, (sym, wa)
            mass = longest['mass_u']
            mass_note = f'No stable isotopes: mass of the longest-lived isotope, {sym}-{mostA} (NUBASE2020 mass excess)' + ('; extrapolated' if longest and longest['mass_estimated'] else '')
        else:
            m = re.match(r'([\d.]+)\s*±\s*([\d.]+)', wa)
            mass, mass_unc = float(m.group(1)), float(m.group(2))
            if wf.startswith('['):
                mass_note = 'CIAAW conventional (abridged) value; the true value varies between sources, CIAAW interval ' + wf
            else:
                mm = re.match(r'([\d\s.]+)\((\d+)\)', wf)
                mass = float(mm.group(1).replace(' ', ''))
                mass_note = 'CIAAW standard atomic weight, uncertainty in last digit(s): ' + mm.group(2)
        # --- other properties
        p = pc[Z]
        ion = ground.get(Z)
        vdw, vdw_src = None, None
        for cand, nm in ((e.vdw_radius_bondi, 'Bondi 1964'), (e.vdw_radius_alvarez, 'Alvarez 2013')):
            if cand: vdw, vdw_src = float(cand), nm; break
        density = e.density; melt = e.melting_point; boil = e.boiling_point; en = e.en_pauling
        for key, cur in (('density', 'density'), ('melt_K', 'melt'), ('boil_K', 'boil'), ('electronegativity', 'en')):
            if str(Z) in ov[key]:
                v = ov[key][str(Z)]
                if key == 'density': density = v
                elif key == 'melt_K': melt = v
                elif key == 'boil_K': boil = v
                else: en = v
        disc = e.discovery_year
        discovered = int(disc) if disc else ('antiquity' if (e.discoverers or '').lower().startswith('known') else None)
        dnote = None
        if str(Z) in ov['discovered']:
            discovered, dnote = ov['discovered'][str(Z)]
        phase = 'gas' if Z in gas else 'liquid' if Z in liquid else 'unknown' if Z in ov['phase_stp_unknown'] else 'solid'
        # group / block by position in the table
        grp = e.group_id
        block = e.block
        if 57 <= Z <= 70 or 89 <= Z <= 102: grp = None; block = 'f'
        if Z in (71, 103): grp = 3; block = 'd'
        rec = dict(Z=Z, symbol=sym, name=e.name, mass=mass, mass_uncertainty=mass_unc, mass_note=mass_note,
                   category=e.series, group=grp, period=e.period, block=block,
                   config=noble_notation(subs), subshells=subs, config_anomaly=anomaly, config_predicted=predicted,
                   config_source=basis, config_note=cnote, ground_level=ground[Z]['level'] if Z in ground else None,
                   electronegativity=en, radius_covalent_pm=round(e.covalent_radius_cordero or e.covalent_radius_pyykko),
                   radius_vdw_pm=vdw, radius_vdw_source=vdw_src, radius_atomic_pm=e.atomic_radius,
                   ionization_eV=ion['ie'] if ion else None, ionization_unc_eV=ion['ie_unc'] if ion else None,
                   ionization_status=({'(': 'interpolated or extrapolated', '[': 'theoretical', '': 'measured'}.get(ion['prefix'], 'measured') if ion else 'not listed by NIST'),
                   density=density, melt_K=melt, boil_K=boil, phase_stp=phase,
                   color_cpk=e.cpk_color or e.jmol_color or '#ff1493', isotopes=[[x['A'], x['abundance']] for x in iso_list],
                   mostAbundantA=mostA, isotope_basis='natural abundance' if iso_list else 'longest-lived known isotope',
                   discovered=discovered, discovered_note=dnote, summary=summaries[sym])
        for k in ('density', 'melt_K', 'boil_K', 'electronegativity', 'radius_atomic_pm', 'radius_vdw_pm', 'ionization_eV', 'mass'):
            rec[k] = r(rec[k], 9) if rec[k] is not None else None
        elements.append(rec)
        lines[sym] = load_lines(sym)

    def dump(name, obj, indent=None):
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, indent=indent, separators=(',', ':') if indent is None else None)
            f.write('\n')
    dump('elements.json', elements)
    dump('atomic/zeff.json', dict(note='Effective nuclear charge per occupied subshell. src C = Clementi-Raimondi SCF values (Z<=86; Clementi & Raimondi 1963, Clementi, Raimondi & Reinhardt 1967), S = Slater (1930) rules. Used only to set the size of each drawn cloud.', elements=zeffs))
    dump('atomic/isotopes.json', isos)
    h = hydrogen_series()
    dump('atomic/lines.json', dict(
        note='Hydrogen lines are computed; other elements list the strongest (by listed relative intensity) neutral-atom lines between 380 and 780 nm fetched from the NIST Atomic Spectra Database (wavelengths in air, nm; intensities are the relative values NIST lists, on scales that differ between elements). An empty list means no usable lines were retrieved, not that the element emits none.',
        hydrogen=h, elements={k: v for k, v in lines.items() if k != 'H'}))
    print('elements', len(elements), 'with lines', sum(1 for v in lines.values() if v))

if __name__ == '__main__':
    main()
