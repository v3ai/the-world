#!/usr/bin/env python3 -I
"""Build data/particles_binding.json: binding energy per nucleon of every nuclide, from the AME2020 mass table
(Wang et al., Chinese Physics C 45, 030003, 2021; file mass_1.mas20.txt from https://www-nds.iaea.org/amdc/ame2020/).
Usage: python3 -I tools/particles/build_binding.py <path to mass_1.mas20.txt>   (run from the repo root)
Output: {"source": ..., "unit": "keV", "be": {"Z": {"N": [binding_per_nucleon, uncertainty, estimated(0/1)]}}}"""
import sys, json
src = sys.argv[1]
be = {}
started = False
for line in open(src, encoding='latin-1'):
    if '(keV)' in line and not started:
        started = True; continue
    if not started or len(line) < 80: continue
    try:
        n = int(line[4:9]); z = int(line[9:14]); a = int(line[14:19])
    except ValueError:
        continue
    raw = line[54:67].strip(); unc = line[68:78].strip()
    if raw.startswith('*') or not raw: continue
    est = '#' in raw
    v = float(raw.replace('#', '.')); u = float(unc.replace('#', '.')) if unc and not unc.startswith('*') else 0.0
    if a != n + z: continue
    be.setdefault(str(z), {})[str(n)] = [round(v, 3), round(u, 3), 1 if est else 0]
out = {"source": "AME2020 atomic mass evaluation, Wang et al., Chinese Physics C 45, 030003 (2021); https://www-nds.iaea.org/amdc/ame2020/mass_1.mas20.txt",
       "unit": "keV per nucleon (binding energy divided by A); third number 1 = estimated from trends, not measured",
       "be": be}
json.dump(out, open('data/particles_binding.json', 'w'), separators=(',', ':'))
print(sum(len(v) for v in be.values()), 'nuclides;', 'He4', be['2']['2'], 'O16', be['8']['8'], 'Fe56', be['26']['30'], 'U238', be['92']['146'])
