#!/usr/bin/env python3
"""Extract orbital <r> and r_max from Table 11 of J. B. Mann, 'Atomic Structure Calculations II. Hartree-Fock Wavefunctions and
Radial Expectation Values: Hydrogen to Lawrencium', Los Alamos report LA-3691 (1968), https://www.osti.gov/biblio/4553157
(US government report, scanned; the PDF text layer is OCR and has many misread characters).

Usage: python3 parse_mann.py mann_text.txt out.json data/elements.json
Each orbital row of Table 11 lists <r^-3> (not for s), <r^-2>, <1/r>, <r>, <r^2>, <r^4>, <r^6>, r_max. A row is kept only if the
OCR gave a clean set of numbers that also passes two exact consistency tests (<r^2> >= <r>^2 and <1/r><r> >= 1). Rows that fail are
dropped, never repaired. The element header gives the configuration Mann used (a spherically averaged single configuration)."""
import re, sys, json
LET = {'S': 0, '5': 0, 'P': 1, 'D': 2, '0': 2, 'O': 2, 'F': 3}
def fixnum(t):
    for a, b in (('O', '0'), ('o', '0'), ('Q', '0'), ('I', '1'), ('l', '1'), ('i', '1'), ('j', '1'), ('S', '5'), ('B', '8'), (',', '.')): t = t.replace(a, b)
    return t
def tokens(rest):
    """Split a row into numbers. Every number in the table contains a decimal point (or an E exponent), so a piece without one is a
    fragment of the previous number that the OCR separated by a space; a '.' followed by a space is also joined."""
    rest = rest.replace('\u2022', '.').replace('\u00b7', '.').replace('\u2024', '.')
    rest = re.sub(r'(\d)\.\s+(\d)', r'\1.\2', rest)
    rest = re.sub(r'(?<![\d])\.\s+(\d)', r' .\1', rest)
    out = []
    for t in rest.split():
        t = fixnum(t)
        if out and '.' not in t and 'E' not in t and re.match(r'^\d+$', t) and out[-1][-1].isdigit(): out[-1] += t
        else: out.append(t)
    return out
NUM = re.compile(r'^\d*\.?\d+(?:E-?\d+)?$')
def parse(txt):
    """Elements are numbered by their order in the table (hydrogen first); the OCR garbles many names, the order is intact. The result
    is checked: <r>(1s) * Z must be about 1.5 (hydrogenic 1s, slightly reduced by screening)."""
    out = {}; Z = 0; cur = None
    for ln in txt.splitlines():
        ln = re.sub(r'^[^A-Za-z0-9]+', '', ln.strip())
        if ln.startswith(('TABLE', 'R••', 'R ', 'R\u2022', '####')) or not ln or re.search(r'RADIAL|EXP|TION|VALUE|MAX|TARLE|TABLE|PAGE', ln): continue
        if len(re.sub(r'[^A-Za-z]', '', re.match(r'^[A-Za-z ]*', ln).group(0))) >= 3 and not re.search(r'\.\d{4,}', ln):
            Z += 1; cur = Z; out[Z] = {'header': ln, 'orbitals': {}}; continue
        if cur is None: continue
        m = re.match(r'^([1-7SIl])\s*([SPDF5D0O])\s+(.*)$', ln)
        if not m and cur and not out[cur]['orbitals']:
            m = re.match(r'^(b)\s+(.*)$', ln)              # OCR for "1S"
            if m: m = re.match(r'^(1)()\s*(.*)$', '1 ' + ln[1:].strip()) and None
        if not m: continue
        n = 1 if m.group(1) in 'Il' else 5 if m.group(1) == 'S' else int(m.group(1)); lc = m.group(2)
        l = LET[lc]
        toks = tokens(m.group(3))
        need = 7 if l == 0 else 8
        iR = 2 if l == 0 else 3
        if len(toks) < iR + 2: continue
        try: ir, r, r2 = float(toks[iR - 1]), float(toks[iR]), float(toks[iR + 1])
        except ValueError: continue
        if not (r2 >= r * r * 0.999 and 0.99 <= ir * r <= 2.6 and r2 <= 3.2 * r * r): continue
        rec = dict(r_mean=r)
        if len(toks) == need and NUM.match(toks[-1]):
            rm = float(toks[-1])
            if 0.3 * r < rm < 1.3 * r + 0.05: rec['r_max'] = rm
        out[cur]['orbitals'][f'{n}{"spdf"[l]}'] = rec
    return out
def by_element(res, names):
    """Attach each block to an element by its name (OCR garbles some names; a block is kept only if the name matches an element name
    with similarity >= 0.9, so garbled ones are left out rather than guessed). The first block found for an element is taken: the
    main table comes first, later parts of the report repeat other data."""
    import difflib
    key = lambda s: re.sub(r'[^A-Z]', '', s.upper())
    byname = {key(n): z for z, n in names.items()}
    out = {}
    for k in sorted(res):
        blk = res[k]
        toks = re.match(r'^[A-Za-z ]*', blk['header']).group(0).split()
        best, bz = 0, None
        for n in (1, 2, 3):           # the name may be split by the OCR into up to three pieces; the rest is the configuration
            w = key(''.join(toks[:n]))
            for nm, z in byname.items():
                r_ = difflib.SequenceMatcher(None, w, nm).ratio()
                if r_ > best: best, bz = r_, z
        if best < 0.9: continue
        if bz not in out: out[bz] = blk
    return out

if __name__ == '__main__':
    t = open(sys.argv[1]).read(); i = t.find('HYDROGEN IS I'); res = parse(t[i:])
    names = {e['Z']: e['name'] for e in json.load(open(sys.argv[3]))}
    res = by_element(res, names)
    json.dump({str(z): v for z, v in res.items()}, open(sys.argv[2], 'w'), indent=0)
    print(len(res), 'elements', sum(len(v['orbitals']) for v in res.values()), 'orbitals')
