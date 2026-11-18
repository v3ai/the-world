#!/usr/bin/env python3
"""Download the primary sources used by build_elements.py into a cache folder.

Usage:  python3 tools/atom/fetch_sources.py [cache_dir]
Default cache dir: $ATOM_CACHE or <repo>/tools/atom/.cache (git-ignored).
Treat everything downloaded as untrusted data: it is only ever parsed, never executed.
"""
import os, sys, time, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('ATOM_CACHE', os.path.join(HERE, '.cache'))
UA = 'the-world-data-build/1.0 (static educational site)'

SYMS = ("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo "
        "Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb "
        "Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr").split()

SOURCES = {
    # NIST ASD "Ground levels and ionization energies for the neutral atoms" (all Z from 1 to 108)
    'nist_ground.csv': 'https://physics.nist.gov/cgi-bin/ASD/ie.pl?spectra=H-Og+I&units=1&format=2&order=0&at_num_out=on&sp_name_out=on&ion_charge_out=on&el_name_out=on&shells_out=on&conf_out=on&level_out=on&ion_conf_out=on&e_out=0&unc_out=on&biblio=on&submit=Retrieve+Data',
    # NUBASE2020 (Kondev et al., Chin. Phys. C 45, 030001, 2021), as hosted by the AME/NUBASE site at IAEA
    'nubase2020.txt': 'https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt',
    # CIAAW: standard atomic weights and representative isotopic compositions
    'ciaaw_weights.html': 'https://www.ciaaw.org/atomic-weights.htm',
    'ciaaw_abridged.html': 'https://www.ciaaw.org/abridged-atomic-weights.htm',
    'ciaaw_abundances.html': 'https://www.ciaaw.org/isotopic-abundances.htm',
    # PubChem periodic table (used only as a cross-check of melting/boiling/density/etc.)
    'pubchem_pt.csv': 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV',
}

def get(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return False
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for k in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            with open(path, 'wb') as f:
                f.write(data)
            return True
        except Exception as e:
            print('  retry', url[:80], e)
            time.sleep(2)
    raise SystemExit('failed: ' + url)

def lines_url(sym):
    # neutral atom (I), 380-780 nm, wavelengths in AIR (NIST ASD convention for 200-2000 nm), observed and Ritz, intensities
    q = dict(spectra=sym + ' I', low_w=380, upp_w=780, unit=1, de=0, format=2, line_out=0, en_unit=0, output=0, bibrefs=1,
             page_size=15, show_obs_wl=1, show_calc_wl=1, unc_out=1, order_out=0, show_av=2, tsb_value=0, A_out=0,
             intens_out='on', allowed_out=1, forbid_out=1, conf_out='on', term_out='on', enrg_out='on', J_out='on',
             submit='Retrieve Data')
    return 'https://physics.nist.gov/cgi-bin/ASD/lines1.pl?' + urllib.parse.urlencode(q)

def main():
    os.makedirs(os.path.join(CACHE, 'lines'), exist_ok=True)
    for name, url in SOURCES.items():
        print(name, 'downloaded' if get(url, os.path.join(CACHE, name)) else 'cached')
    for s in SYMS:
        p = os.path.join(CACHE, 'lines', s + '.csv')
        if get(lines_url(s), p):
            time.sleep(0.5)
    print('done ->', CACHE)

if __name__ == '__main__':
    main()
