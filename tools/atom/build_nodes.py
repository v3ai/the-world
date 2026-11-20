#!/usr/bin/env python3
"""Generate data/nodes/phys_atom.json (topic cards for the atom view and one card per element) and data/viz/atom.json
(one figure per card). Run from the repo root:  python3 tools/atom/build_nodes.py
Element cards are generated from data/elements.json and data/atomic/*.json, so every number on them is the sourced one.
Concept cards are written here; their numbers are computed or come from the sources listed in .devtools notes / sources.json."""
import json, math, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding='utf-8'))
EL = J('data/elements.json'); ISO = J('data/atomic/isotopes.json'); ZEFF = J('data/atomic/zeff.json')['elements']; SCF = J('data/atomic/scf.json'); SRC = J('data/atomic/sources.json')['fields']
BOOKS = {b['c']: b for b in J('data/library/books.json')}

def ref(code, sec):
    b = BOOKS[code]; ch = b['ch'][int(sec.split('.')[0]) - 1]
    s = next(x for x in ch[2] if x[0] == sec)
    return [code, sec, s[2]]

A0 = 52.9177210544            # pm, CODATA 2022
RY = 13.605693123             # eV: half the hartree (4.3597447222e-18 J / 1.602176634e-19 C) / 2
INV_RH_NM = 91.1763           # nm, 1/R_H for hydrogen with the reduced-mass Rydberg constant (R_H = 10967758.3 /m)
KE2 = 1.43996454              # MeV fm = e^2 / (4 pi eps0)

V_ = SCF['validation']; pc = lambda x, d=1: f"{100 * x:.{d}f}%"
EC = {e['symbol']: e for e in EL}
def rpm(sym, sub): return SCF['elements'][sym][sub]['r_mean'] * A0
def zeq(sym, sub):                      # hydrogen-like charge that gives the computed mean radius
    n, l = int(sub[0]), 'spdf'.index(sub[1]); return (3 * n * n - l * (l + 1)) / (2 * SCF['elements'][sym][sub]['r_mean'])

def node(id, title, kind, summary, basics, deeper, expert, facts, cert, refs, oq=None, dyk=None, scale=None, parents=None, ext=None):
    n = {"id": id, "title": title, "kind": kind, "template": "concept", "scale_m": scale, "parents": parents or [], "parts": [], "made_of": [],
         "processes": [], "related": [], "mesh": None, "summary": summary, "layers": {"basics": basics, "deeper": deeper, "expert": expert},
         "facts": facts, "certainty": cert, "refs": refs}
    if oq: n["open_questions"] = oq
    if dyk: n["did_you_know"] = dyk
    if ext: n["ext"] = ext
    return n

P = lambda *s: ''.join(f'<p>{x}</p>' for x in s)
UP3_8_1, UP3_8_3, UP3_8_4, UP3_8_5 = ref('UP3', '8.1'), ref('UP3', '8.3'), ref('UP3', '8.4'), ref('UP3', '8.5')
UP3_7_1, UP3_6_4, UP3_7_3 = ref('UP3', '7.1'), ref('UP3', '6.4'), ref('UP3', '7.3')
CHE_2_2, CHE_2_3, CHE_2_5, CHE_6_2, CHE_6_3, CHE_6_4, CHE_6_5 = [ref('CHE', s) for s in ('2.2', '2.3', '2.5', '6.2', '6.3', '6.4', '6.5')]
CHE_21_1 = ref('CHE', '21.1')

N, V = [], {}
def add(n, fig=None):
    N.append(n)
    if fig: V[n['id']] = fig

# ---------------------------------------------------------------- concept cards
add(node('at_atom', 'The atom', 'structure',
  'An atom is a tiny nucleus with a cloud of electrons around it; the number of protons in the nucleus decides which element it is.',
  P('Everything around you is made of atoms. An atom has a nucleus at its centre, made of protons and neutrons, and electrons around it. The protons each carry one positive charge and the electrons one negative charge, so a neutral atom has as many electrons as protons.',
    'The number of protons, called the atomic number Z, decides the element: 1 proton is hydrogen, 8 is oxygen, 26 is iron. The electrons decide almost everything else you notice about an atom: how it bonds, what colour it emits, how it conducts.',
    'The nucleus is far smaller than the atom. For iron-56 the empirical rule R ≈ 1.2 A<sup>⅓</sup> fm gives about 4.6 femtometres, while the atom is of the order of 100 picometres across, so the atom is roughly thirty thousand times wider than its nucleus. The rest of the atom is the electron cloud, which has no sharp edge.'),
  P('Electrons are not tiny planets. Each electron is described by a wavefunction, and the cloud you see in this view is a picture of where that wavefunction says the electron could be found. See “Wavefunction and probability”.',
    'The size of an atom depends on how you measure it: a radius from the bond length in a molecule, from the packing in a crystal, or from how close another atom can get all differ. Atomic sizes in this app are labelled with the way they were obtained.'),
  P('Mass is almost all in the nucleus: the electrons of an atom together weigh about 1/1836 of one proton each. The electromagnetic force binds electrons to the nucleus; the strong force binds the nucleus itself. Atomic energy levels are set by the electromagnetic interaction and the quantum mechanics of bound electrons, with corrections from the electron’s spin and from relativity that grow with Z.'),
  [['Protons = Z', 'sets the element'], ['Electrons (neutral atom)', '= Z'], ['Typical size', '≈ 10⁻¹⁰ m (empirical atomic radii in this app are 25–260 pm)'], ['Nucleus radius', '≈ 1.2 × A^⅓ fm (an average rule)']],
  'C1', [CHE_2_3, CHE_2_2]),
  {"type": "bars", "ylabel": "radius, pm (logarithmic)", "logy": True, "caption": "An iron atom against its nucleus, on a logarithmic scale. The nucleus radius uses the empirical rule R = 1.2 A^(1/3) fm with A = 56; the atom value is the empirical atomic radius.",
   "bars": [{"label": "Fe atom (empirical radius)", "value": 140}, {"label": "H atom: Bohr radius a0", "value": A0}, {"label": "Fe-56 nucleus (rule)", "value": round(1.2 * 56 ** (1 / 3) * 1e-3, 5)}]})

add(node('at_orbital', 'Electron cloud and orbitals', 'concept',
  'An orbital is the shape of the region where an electron could be found; in standard quantum mechanics the electron is not a dot travelling on a path.',
  P('In standard quantum mechanics an electron in an atom has no path. (In the pilot-wave reading it does; see “What the wavefunction is”.) What it has is a set of probabilities: for each place in space, how likely it is to be found there. The pattern of those probabilities is called an orbital.',
    'In this view, every dot is one place the single electron could be found. Dots are crowded where the electron is more likely to be. They are not many electrons, and the dot size is not the electron’s size.',
    'The simplest orbital (1s) is a round ball, densest at the centre. Others have nodes, surfaces where the chance of finding the electron is exactly zero: p orbitals have two lobes with a flat node between them, d orbitals have four lobes or a ring.'),
  P('For hydrogen and any one-electron ion the orbital shapes are exact solutions of the Schrödinger equation. In atoms with more electrons the electrons repel each other, so no single orbital describes one electron exactly; “orbital” then means the best one-electron description (the orbital approximation), which still organises the periodic table very well.',
    'Chemists usually draw real orbitals (px, py, pz, …). They are equal mixtures of the states with rotation +m and −m, so they show no net flow. The states with definite m do carry a flow of probability around the vertical axis; see “The flow of probability”.'),
  P('Each state is ψ<sub>nlm</sub> = R<sub>nl</sub>(r) Y<sub>l</sub><sup>m</sup>(θ, φ). The radial function has n − l − 1 nodes and the angular part has l nodes, so the total number of nodal surfaces is n − 1. The dots in this app are drawn from |ψ|² by inverse-transform sampling: r from the cumulative distribution of r²R², cos θ from that of [P<sub>l</sub><sup>|m|</sup>]², and φ uniformly.'),
  [['Number of nodal surfaces', 'n − 1'], ['Radial nodes', 'n − l − 1'], ['Angular nodes', 'l']], 'C1', [CHE_6_3, UP3_8_1],
  oq=['What the wavefunction is (a real wave, knowledge, one of many worlds, a guide for particles) is not settled. Every reading predicts the same measurements.'],
  dyk='This way of drawing an orbital as a cloud of many small dots was popularised by the video “A Better Way To Picture Atoms”.'),
  {"type": "heatmap", "x": [-14.4, 14.4], "y": [-14.4, 14.4], "equal": True, "colormap": "heat",
   "f": "if(state==1, y*y*exp(-hypot(x,y)), if(state==2, (6-hypot(x,y))^2*y*y*exp(-2*hypot(x,y)/3), (3*y*y-x*x-y*y)^2*exp(-2*hypot(x,y)/3)/9))",
   "params": [{"id": "state", "label": "state: 1 = 2p, 2 = 3p, 3 = 3d (m = 0)", "min": 1, "max": 3, "value": 1, "step": 1}],
   "caption": "A slice through the vertical axis of a hydrogen state: bright where the electron is more likely to be found. Distances are in Bohr radii; each state is drawn at its own brightness scale. Look for the dark nodes: a plane for 2p, an extra ring for 3p."})

add(node('at_wavefunction', 'Wavefunction and probability', 'concept',
  'The wavefunction ψ is a number at every point in space; the chance of finding the electron near a point is proportional to |ψ|².',
  P('The wavefunction of an electron is a quantity that has a value at every point in space. You cannot measure ψ directly. What you can do is square its size: |ψ|² gives the probability per unit volume of finding the electron there if you look.',
    'Because the electron has to be somewhere, the total probability over all space is exactly 1 (the wavefunction is “normalised”). For hydrogen in its lowest state the probability is greatest per unit volume at the nucleus, but the most likely distance from the nucleus is one Bohr radius, 52.9 pm, because there is much more volume further out.',
    'The picture on this card shows the probability of finding the electron at distance r (a shell of radius r), not at a point.'),
  P('Energies come out of the same mathematics. A bound electron can only have certain energies; for hydrogen they are about −13.6 eV / n² (−13.598 eV for the ground state). Light emitted when the electron changes state has the energy difference, which is why atoms have spectral lines.'),
  P('The radial probability density is P(r) = r² R<sub>nl</sub>(r)², with ∫P dr = 1. Hydrogen-like states with nuclear charge Z have R<sub>nl</sub> ∝ e<sup>−ρ/2</sup> ρ<sup>l</sup> L<sup>2l+1</sup><sub>n−l−1</sub>(ρ) with ρ = 2Zr/n. For the 1s state P(r) = 4Z³ r² e<sup>−2Zr</sup> (r in Bohr radii), with its maximum at r = 1/Z. The mean radius is ⟨r⟩ = [3n² − l(l+1)]/(2Z) Bohr radii.'),
  [['Bohr radius a₀', '52.9177 pm (CODATA 2022)'], ['Hydrogen 1s most probable radius', '1 a₀'], ['Hydrogen ground-state energy', '−13.598 eV (measured ionisation energy 13.5984 eV; −13.6057 eV is the value for an infinitely heavy nucleus)']], 'C1', [UP3_7_1, UP3_8_1],
  oq=['Why a measurement gives one definite place when the wavefunction is spread out (the measurement problem) is an open question of interpretation.']),
  {"type": "plot", "x": [0, 14], "xlabel": "distance r from the nucleus (Bohr radii)", "ylabel": "probability per Bohr radius",
   "fns": [{"f": "Z*4*(Z*x)^2*exp(-2*Z*x)", "label": "1s"}, {"f": "Z*(Z*x)^2*(2-Z*x)^2*exp(-Z*x)/8", "label": "2s"}, {"f": "Z*(Z*x)^4*exp(-Z*x)/24", "label": "2p"}],
   "params": [{"id": "Z", "label": "nuclear charge Z (hydrogen-like ion)", "min": 1, "max": 4, "value": 1, "step": 1}],
   "caption": "Radial probability for hydrogen-like states. Each curve has area 1. The 1s peak sits at r = 1/Z; raise Z and the cloud shrinks and its peak grows (the vertical scale follows)."})

add(node('at_quantum_numbers', 'Quantum numbers', 'concept',
  'Four numbers name an electron state in an atom: n (size and energy), l (shape), m (orientation or rotation) and spin.',
  P('n is the principal quantum number: 1, 2, 3 … It sets the energy and, roughly, the size of the cloud. Electrons with the same n are said to be in the same shell.',
    'l is the angular momentum number and sets the shape. It can be 0 to n − 1, named s, p, d, f for l = 0, 1, 2, 3. An s orbital is a ball; a p orbital has two lobes.',
    'm is the magnetic quantum number, from −l to +l. It is the orientation along a chosen axis; in the states with definite m the electron’s probability circulates around that axis. Finally, spin has two values, up or down.',
    'Counting the allowed combinations gives 2n² states in shell n: 2, 8, 18, 32. The rows of the periodic table are not 2, 8, 18, 32 long; they are 2, 8, 8, 18, 18, 32, 32, because subshells do not fill shell by shell: 4s fills before 3d, for instance (see “Electron configuration and the periodic table”).'),
  P('You can pick any (n, l, m) of a hydrogen-like atom in this app by choosing “Any n, l, m”. For the real-orbital family you pick x, y, z instead of m; those are sums of the +m and −m states.'),
  P('l(l+1)ħ² is the squared orbital angular momentum and mħ the component along z. The energies of hydrogen depend only on n (in the simple Schrödinger treatment) so all states of one n are degenerate; relativity and spin split them slightly (fine structure).'),
  [['n', '1, 2, 3, …'], ['l', '0 to n − 1'], ['m', '−l to +l'], ['States in shell n (with spin)', '2n²']], 'C1', [CHE_6_4, UP3_8_1]),
  {"type": "table", "cols": ["shell n", "subshells", "orbitals", "electrons (max)"],
   "rows": [["1", "1s", "1", "2"], ["2", "2s 2p", "4", "8"], ["3", "3s 3p 3d", "9", "18"], ["4", "4s 4p 4d 4f", "16", "32"]],
   "caption": "How the quantum numbers add up: shell n has n² orbitals, each holding two electrons of opposite spin."})

add(node('at_spin_pauli', 'Spin and the Pauli principle', 'concept',
  'Every electron has a built-in two-valued property called spin, and no two electrons in an atom can be in exactly the same state.',
  P('An electron behaves like a tiny magnet with two possible orientations, called spin up and spin down. This is not a ball spinning: it is a property with no everyday counterpart.',
    'The Pauli exclusion principle says that no two electrons in an atom can have the same four quantum numbers. So an orbital holds at most two electrons, and they must have opposite spins.',
    'This is why atoms fill up shell by shell instead of all electrons dropping into the lowest orbital. It is the reason matter takes up space and the reason for the structure of the periodic table.'),
  P('Within a subshell, electrons spread over separate orbitals with parallel spins before they pair up (Hund’s rule), The usual explanation is that parallel spins keep the electrons apart and so lower their repulsion; the exact reason is still discussed in the research literature. The picture on this card shows oxygen’s 2p electrons as you add them one by one.'),
  P('Electrons are fermions: the many-electron wavefunction changes sign when two electrons are swapped, so it vanishes if two have the same state. Pauli’s principle follows from relativistic quantum field theory (the spin–statistics theorem); Hund’s rule is an empirical rule, usually explained through the exchange energy, although the details are still debated.'),
  [['Spin quantum number', '½ (two orientations)'], ['Electrons per orbital', 'at most 2']], 'C1', [UP3_8_3, UP3_8_4],
  oq=['None for the principle itself. Detailed energies of many-electron atoms need approximate methods.']),
  {"type": "geometry", "range": [0, 10, 0, 4], "equal": True,
   "params": [{"id": "e", "label": "electrons in a p subshell", "min": 0, "max": 6, "value": 4, "step": 1}],
   "shapes": [{"k": "rect", "x": 1, "y": 1, "w": 2, "h": 1.6, "stroke": "dim"}, {"k": "rect", "x": 4, "y": 1, "w": 2, "h": 1.6, "stroke": "dim"}, {"k": "rect", "x": 7, "y": 1, "w": 2, "h": 1.6, "stroke": "dim"},
     {"k": "arrow", "x1": 1.7, "y1": 1.2, "x2": 1.7, "y2": 2.4, "color": "accent", "when": "e>=1"}, {"k": "arrow", "x1": 4.7, "y1": 1.2, "x2": 4.7, "y2": 2.4, "color": "accent", "when": "e>=2"},
     {"k": "arrow", "x1": 7.7, "y1": 1.2, "x2": 7.7, "y2": 2.4, "color": "accent", "when": "e>=3"},
     {"k": "arrow", "x1": 2.3, "y1": 2.4, "x2": 2.3, "y2": 1.2, "color": "gold", "when": "e>=4"}, {"k": "arrow", "x1": 5.3, "y1": 2.4, "x2": 5.3, "y2": 1.2, "color": "gold", "when": "e>=5"},
     {"k": "arrow", "x1": 8.3, "y1": 2.4, "x2": 8.3, "y2": 1.2, "color": "gold", "when": "e>=6"},
     {"k": "text", "x": 2, "y": 0.5, "text": "px", "align": "center"}, {"k": "text", "x": 5, "y": 0.5, "text": "py", "align": "center"}, {"k": "text", "x": 8, "y": 0.5, "text": "pz", "align": "center"}],
   "caption": "Three p orbitals are three boxes; each holds up to two electrons with opposite spins (arrows up and down). Add electrons: the first three go into separate boxes, then they pair up. Four electrons is oxygen’s 2p."})

add(node('at_configuration', 'Electron configuration and the periodic table', 'concept',
  'The electron configuration lists how many electrons sit in each subshell; the periodic table is that pattern laid out in rows and columns.',
  P('To write the configuration of an atom, fill its electrons into subshells from the lowest energy upward, at most 2 in an s subshell, 6 in p, 10 in d and 14 in f. Oxygen has 8 electrons: 1s² 2s² 2p⁴. Iron has 26: [Ar] 3d⁶ 4s², where [Ar] stands for argon’s 18 electrons.',
    'Atoms with similar outer electrons behave alike, so they fall in the same column of the periodic table. Rows end when a shell’s p subshell is full, which is a noble gas. The table is arranged in blocks named for the subshell being filled: s, p, d and f.',
    'The usual filling order (1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, …) is a rule of thumb, and it has exceptions: chromium and copper are [Ar] 3d⁵ 4s¹ and [Ar] 3d¹⁰ 4s¹, a result of the small energy gap between 3d and 4s and the repulsion between the electrons. A half-filled or full d subshell is often quoted as the reason, but that is a rule of thumb rather than a full explanation. Click an element in the picker or a subshell in the strip to see them.'),
  P('The configurations in this app are the ground-state configurations in the NIST Atomic Spectra Database for elements 1 to 108. They are measured up to nobelium (102); NIST’s entries for lawrencium to hassium (103–108) rest on calculation (it brackets some of their ionisation energies as interpolated or theoretical), and elements 109 to 118 are not in NIST at all, so their configurations are predictions. Elements 103 to 118 are marked as predicted.',
    'The Madelung rule says subshells fill in order of increasing n + l, and for equal n + l in order of increasing n. It is a good guide for the neutral atoms, but it is empirical, and the true orbital energies change as electrons are added.'),
  P('There are 20 anomalous ground-state configurations among the elements up to Lr (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt, Au, Ac, Th, Pa, U, Np, Cm, Lr), checked against NIST. For the heaviest elements relativity strongly affects the order of the 7s, 7p and 6d orbitals, so predictions come from relativistic calculations and differ somewhat between sources.'),
  [['Source', 'NIST ASD ground levels (Z ≤ 108)'], ['Anomalous configurations (Z ≤ 103)', '20'], ['Predicted rather than measured', 'Z ≥ 103 in this app']], 'C2', [CHE_6_4, CHE_2_5, UP3_8_4],
  oq=['Ground-state configurations of the superheavy elements are predictions; the strong relativistic effects make them hard to calculate and different calculations disagree for a few elements (for example Ds and Rg).']),
  {"type": "table", "cols": ["row", "subshells filled in this row, in order", "electrons added"],
   "rows": [["1", "1s", "2"], ["2", "2s 2p", "8"], ["3", "3s 3p", "8"], ["4", "4s 3d 4p", "18"], ["5", "5s 4d 5p", "18"], ["6", "6s 4f 5d 6p", "32"], ["7", "7s 5f 6d 7p", "32"]],
   "caption": "The order of filling that builds the rows of the periodic table (the Madelung order). It is a rule of thumb with about twenty exceptions, which the configuration strip shows."})

# trends: first ionisation energies across period 2
p2 = [e for e in EL if e['period'] == 2]
add(node('at_trends', 'Periodic trends', 'concept',
  'Across a row of the periodic table atoms get smaller and hold their electrons more tightly; down a column they get bigger and let go more easily.',
  P('Moving left to right across a period, each atom has one more proton and one more electron in the same shell. The extra charge pulls the shell in, so atoms shrink, and it takes more energy to remove an electron. This energy for the outermost electron is the first ionisation energy.',
    'Moving down a group, atoms gain a whole new shell, so they get larger and the outer electron is easier to remove. That is why the alkali metals at the left of the table react so readily.',
    'Use the “Colour by” control in the periodic table to see these trends yourself: choose first ionisation energy, electronegativity or atomic radius. In the whole-atom view you can also watch the outermost cloud shrink across a row: the computed mean radius of the outermost subshell falls from ' + f"{rpm('Li', '2s'):.0f} pm for lithium (2s) to {rpm('Ne', '2p'):.0f} pm for neon (2p)" + ', then jumps to ' + f"{rpm('Na', '3s'):.0f} pm for sodium (3s)" + ' where a new shell starts.'),
  P('Electronegativity is a measure of how strongly an atom in a molecule attracts the shared electrons; this app uses the Pauling scale. It rises across a period and falls down a group, with fluorine the highest.',
    'The trends have small, well-understood breaks. For example boron’s ionisation energy is lower than beryllium’s because its outer electron is in a 2p subshell, which is further out and slightly screened by 2s.'),
  P('The ionisation energies shown are from the NIST Atomic Spectra Database; the radii in the picker are empirical and covalent values compiled in the mendeleev package (use them as guides; the noble gases have no empirical radius), while the clouds in the atom view use the subshell sizes computed in “Electron cloud sizes”. Electronegativity is not a directly measurable quantity: several scales exist, and the Pauling scale is built from bond energies.'),
  [['Outermost cloud, computed mean radius', f"Li {rpm('Li', '2s'):.0f} pm, Ne {rpm('Ne', '2p'):.0f} pm, Na {rpm('Na', '3s'):.0f} pm"], ['Highest first ionisation energy', 'helium, 24.59 eV'], ['Lowest (of the elements with data here)', 'caesium, 3.89 eV'], ['Source', 'NIST ASD']], 'C1', [CHE_6_5, UP3_8_4]),
  {"type": "bars", "ylabel": "first ionisation energy, eV", "caption": "First ionisation energy across period 2 (lithium to neon), from the NIST Atomic Spectra Database. It rises across the row, with small dips at boron and oxygen.",
   "bars": [{"label": e['symbol'], "value": round(e['ionization_eV'], 2)} for e in p2]})

zs = {e['symbol']: ZEFF[e['symbol']]['zeff'] for e in p2}
val = lambda s: zs[s].get('2p') or zs[s]['2s']
add(node('at_zeff', 'Effective nuclear charge', 'concept',
  'An outer electron feels less than the full pull of the nucleus because the electrons in between shield it; the pull it does feel is the effective nuclear charge.',
  P('The nucleus of oxygen has 8 protons, but an electron in its outer shell does not feel +8. The two inner electrons sit between it and the nucleus and cancel part of the charge. What is left is the effective nuclear charge, Z<sub>eff</sub>.',
    'A bigger Z<sub>eff</sub> pulls a cloud in closer: this is why atoms shrink across a row of the periodic table. Z<sub>eff</sub> is an idea for understanding trends. It is not what sets the cloud sizes drawn in the atom view: those come from a computed model of the whole atom (see “Electron cloud sizes”).',
    'Z<sub>eff</sub> is a model quantity: it depends on the method used to define it, so different tables give different numbers for the same electron.'),
  P('The tabulated Z<sub>eff</sub> values on this card are the Clementi–Raimondi screening constants for elements up to radon (Z ≤ 86). They come from self-consistent-field calculations in which each orbital was fitted by a single Slater-type function, a smooth function with no nodes, and the constant is the exponent of that function. They describe that fitted function. Putting them into a hydrogen-like function with nodes, as this app did in an earlier version, makes outer s clouds 15–40% too large and d and f clouds too small, so the app no longer does it.',
    'For comparison, the hydrogen-like charge that would give oxygen’s 2p cloud its computed mean radius is ' + f"{zeq('O', '2p'):.2f}" + ', while the Clementi–Raimondi value is ' + f"{val('O'):.2f}" + ': they are different quantities.'),
  P('Slater’s simple rules assign shielding of 0.35 from the same group, 0.85 per electron one shell in, and 1.0 deeper, with effective quantum numbers n* of 1, 2, 3, 3.7, 4.0 and 4.2 for n = 1 to 6 (Slater defined none for n = 7). The Clementi–Raimondi values belong to the configuration used in those papers, which for a few anomalous elements differs from the NIST ground state. For heavy atoms relativity contracts s and p shells and expands d and f shells, which neither scheme includes. Slater’s rules are still used in this data set for elements beyond radon (Z > 86), where no Clementi–Raimondi values exist; they appear on the cards of those elements only.'),
  [['Z for oxygen', '8'], ['Z_eff of oxygen 2p (Clementi–Raimondi)', f"{val('O'):.2f}"], ['Z_eff of oxygen 1s', f"{zs['O']['1s']:.2f}"]], 'C2', [CHE_6_5, UP3_8_4],
  oq=['Z_eff is a model quantity, not an observable. Different methods give different values for the same atom.']),
  {"type": "bars", "ylabel": "Z_eff of the outermost subshell", "caption": "Clementi and Raimondi’s effective nuclear charge for the outermost subshell across period 2 (single Slater-type orbitals; these values are not used to draw the clouds). The actual nuclear charge grows from 3 to 10; the electrons feel a smaller, slower-growing pull.",
   "bars": [{"label": e['symbol'], "value": round(val(e['symbol']), 2)} for e in p2]})

add(node('at_cloud_sizes', 'Electron cloud sizes', 'concept',
  'The size of each shell in a many-electron atom is computed by letting every electron move in the average field of the nucleus and all the others; the atom view draws the shells at those sizes.',
  P('In an atom with many electrons, each electron is pushed by the others as well as pulled by the nucleus, so its cloud is not the simple hydrogen shape. A computer can still find a good answer by repeating one step. Guess where all the electrons are. Work out the average electric field that they and the nucleus make. Find the best cloud for each electron in that field. Then repeat with the new clouds until nothing changes. This is called a self-consistent-field calculation.',
    'The result is a mean distance from the nucleus for every occupied subshell (1s, 2s, 2p and so on). The whole-atom view draws each subshell at its computed size, with a hydrogen-like pattern of dots stretched to that size. The shape inside each shell is therefore a stand-in; the sizes are the calculated part.',
    f"For iron the calculation gives a mean radius of about {rpm('Fe', '3d'):.0f} pm for 3d and {rpm('Fe', '4s'):.0f} pm for 4s, so the 4s cloud lies far outside the 3d cloud, while its 1s cloud is only about {rpm('Fe', '1s'):.1f} pm."),
  P(f"The calculation is non-relativistic, treats the exchange between electrons with a local approximation (every electron feels the Hartree field of the total density plus a local exchange term −(3ρ/π)<sup>1/3</sup>), leaves out electron correlation, and averages each subshell over directions. One-electron hydrogen is solved exactly. It was checked against numerical Hartree–Fock mean radii from J. B. Mann’s 1968 Los Alamos tables for {V_['reference']['n_atoms']} atoms ({V_['all_subshells']['n']} subshells): a typical subshell is within {pc(V_['all_subshells']['median_abs'])}, the average difference is {pc(V_['all_subshells']['mean_abs'])}, nine in ten are within {pc(V_['all_subshells']['p90_abs'], 0)}, and the worst are about {pc(V_['all_subshells']['max_abs'], 0)} (the {V_['worst'][0]['sub']} shell of {EC[V_['worst'][0]['el']]['name'].lower()} and the {V_['worst'][1]['sub']} shell of {EC[V_['worst'][1]['el']]['name'].lower()}, where the local exchange approximation is poor). For the outermost subshell the typical difference is {pc(V_['outermost_subshell']['median_abs'])} and the worst {pc(V_['outermost_subshell']['max_abs'])}.",
    'What it leaves out matters most for heavy atoms. Relativity contracts s and p shells and expands d and f shells. The contraction of the outermost 6s shell is strongest at gold in its row of the table, and it is part of why gold is yellow rather than silvery (P. Pyykkö and J.-P. Desclaux, Acc. Chem. Res. 12, 276, 1979). The clouds drawn for the heaviest atoms are therefore probably too large for s and p shells and too small for d and f shells.'),
  P('Each subshell satisfies [−½ d²/dr² + l(l+1)/(2r²) + V(r)] P<sub>nl</sub> = ε<sub>nl</sub> P<sub>nl</sub> with V = −Z/r + V<sub>Hartree</sub>[ρ] + V<sub>x</sub>[ρ] and V<sub>x</sub> = −(3ρ/π)<sup>1/3</sup> (hartree, bohr), where ρ is the spherical sum of all occupied subshells at their ground-state occupations (the NIST configuration, fractional occupation, no spin polarisation). The equations are solved on a logarithmic grid until the density stops changing (1 part in 10⁹). A hydrogen-like function of charge Z′ has ⟨r⟩ = [3n² − l(l+1)]/(2Z′), so the app uses Z′ = [3n² − l(l+1)]/(2⟨r⟩) with the computed ⟨r⟩ for each subshell, keeping the n − l − 1 radial nodes. The results also list the radius of maximum density and the check against Hartree–Fock.'),
  [['Method', 'non-relativistic self-consistent field, local exchange, no correlation'], ['Typical error of a subshell’s mean radius (median)', pc(V_['all_subshells']['median_abs'])], ['Average error', pc(V_['all_subshells']['mean_abs'])],
   ['Worst case in the check', pc(V_['all_subshells']['max_abs'], 0)], ['Iron 4s mean radius', f"{rpm('Fe', '4s'):.0f} pm"], ['Iron 3d mean radius', f"{rpm('Fe', '3d'):.0f} pm"], ['Reference', 'J. B. Mann, Los Alamos report LA-3691 (1968), Hartree–Fock']], 'C2', [CHE_6_5, UP3_8_4],
  oq=['How much relativity and electron correlation change the sizes of the d and f shells of heavy atoms is a research-level calculation that this app does not include.']),
  {"type": "bars", "ylabel": "mean radius, pm (logarithmic)", "logy": True, "caption": "Computed mean radius of each occupied subshell of iron (non-relativistic self-consistent field). The 4s cloud lies far outside the 3d cloud even though 3d is the subshell being filled across the row.",
   "bars": [{"label": k, "value": round(rpm('Fe', k), 2)} for k in EC['Fe']['subshells']]})

sn = ISO['Sn']['natural']
add(node('at_isotopes', 'Isotopes', 'concept',
  'Isotopes are atoms of one element with different numbers of neutrons; they behave alike chemically but have different masses.',
  P('Every atom of an element has the same number of protons, but the number of neutrons can differ. Atoms with the same Z and different neutron numbers N are isotopes. They are named by the total A = Z + N: carbon-12 has 6 protons and 6 neutrons, carbon-14 has 6 protons and 8.',
    'Most elements found in nature are a mixture of isotopes, always in nearly the same proportions; tin has ten stable isotopes. Some isotopes are radioactive and decay with a measurable half-life.',
    'In the atom view, choose an isotope to set the number of neutrons in the nucleus you can zoom into. For elements with no stable isotope the app shows the longest-lived isotope that has been measured.'),
  P('The atomic weight listed for an element is the average over its natural isotopes. Where the natural mixture varies, the standard value is an interval, and this app uses the conventional single value.'),
  P('Isotope half-lives, spins and abundances in this app come from NUBASE2020 and the CIAAW tables. The nucleus drawn is at a size given by R ≈ 1.2 A<sup>⅓</sup> fm, an average rule, not a measurement for that isotope.'),
  [['Tin stable isotopes', str(len([x for x in sn if x['stable']]))], ['Source', 'NUBASE2020; CIAAW']], 'C1', [CHE_2_3, CHE_21_1]),
  {"type": "bars", "ylabel": "natural abundance, %", "caption": "The natural isotopes of tin, by mass number (NUBASE2020 and CIAAW abundances). Different isotopes of one element have the same chemistry.",
   "bars": [{"label": f"Sn-{x['A']}", "value": round(100 * x['abundance'], 2)} for x in sn if x.get('abundance')]})

add(node('at_ions', 'Ions', 'concept',
  'An ion is an atom that has gained or lost electrons, so it has a net electric charge.',
  P('If an atom loses an electron it becomes a positive ion; if it gains one it becomes a negative ion. The nucleus does not change: sodium has 11 protons and keeps them. Sodium easily loses its single outer 3s electron to become Na⁺ with the stable, noble-gas-like electrons 1s² 2s² 2p⁶.',
    'Chlorine does the opposite: it gains one electron to fill its 3p subshell and becomes Cl⁻. Table salt is a crystal of these two ions held together by their opposite charges.'),
  P('The energy needed to remove the first electron is the first ionisation energy (in the periodic table’s “Colour by” control); the energy released when an atom gains an electron is its electron affinity. Removing further electrons costs much more, because the remaining electrons feel the nucleus more strongly.'),
  P('A hydrogen-like ion has one electron, such as He⁺ or Li²⁺. The “Any n, l, m” mode of the atom view draws these: the nucleus of the chosen element with a single electron. In the non-relativistic Schrödinger theory the mathematics for one electron is exact; relativity matters more as the nuclear charge grows, and the atom view warns about it from Z = 20.'),
  [['Na → Na⁺', 'loses one electron'], ['Cl → Cl⁻', 'gains one electron']], 'C1', [ref('CHE', '2.6'), CHE_6_5]),
  {"type": "table", "cols": ["", "protons", "electrons", "charge", "configuration"],
   "rows": [["Na", "11", "11", "0", "1s² 2s² 2p⁶ 3s¹"], ["Na⁺", "11", "10", "+1", "1s² 2s² 2p⁶"], ["Cl", "17", "17", "0", "1s² 2s² 2p⁶ 3s² 3p⁵"], ["Cl⁻", "17", "18", "−1", "1s² 2s² 2p⁶ 3s² 3p⁶"]],
   "caption": "Ions keep the nucleus and change the number of electrons. Both ions here have the full outer shell of a noble gas."})

add(node('at_spectra', 'Atomic spectra', 'concept',
  'Each element gives out and absorbs light only at certain colours, because its electrons can only have certain energies.',
  P('Heat a gas of one element, or pass electricity through it, and it glows at a few sharp colours: its emission lines. Every element has its own pattern, a fingerprint used to identify it, even in distant stars.',
    'The reason is that an electron in an atom can only have certain energies. When it drops from a higher to a lower state, the atom gives out a photon whose energy is exactly the difference. A larger drop gives a bluer photon.',
    'Hydrogen is the cleanest case. The visible red line, H-alpha, comes from n = 3 to n = 2 and has a wavelength of 656 nm (in air). The ultraviolet Lyman-alpha line (n = 2 to 1) is at 121.567 nm.'),
  P('The wavelength λ of a hydrogen line from level n<sub>u</sub> to n<sub>l</sub> follows the Rydberg formula 1/λ = R<sub>H</sub>(1/n<sub>l</sub>² − 1/n<sub>u</sub>²), with R<sub>H</sub> = 1.0967758 × 10⁷ m⁻¹ for hydrogen, which is 1/R<sub>H</sub> = 91.176 nm. In the atom view, switch to Bohr’s model for hydrogen and press “Let it jump and emit light”, or use “Two states” to see the electron cloud itself oscillate at that frequency.'),
  P('For hydrogen the difference of the two energies divided by Planck’s constant is the frequency: for 1s and 2p it is 2.466 × 10¹⁵ Hz, which is the Lyman-alpha line. Lines for other elements in this app are those listed by the NIST Atomic Spectra Database (visible range); in many-electron atoms the levels have to be calculated with the electrons’ interactions, which is why a Bohr diagram cannot predict them. Real lines also show fine structure and hyperfine splitting.'),
  [['Hydrogen Lyman-alpha', '121.567 nm (observed)'], ['Hydrogen H-alpha', '656.29 nm (air)'], ['Source', 'NIST ASD; Rydberg formula']], 'C1', [CHE_6_2, UP3_8_5]),
  {"type": "geometry", "range": [0, 12, -15, 1], "params": [{"id": "nu", "label": "upper level n", "min": 2, "max": 7, "value": 3, "step": 1}, {"id": "nl", "label": "lower level n", "min": 1, "max": 2, "value": 2, "step": 1}],
   "readouts": [{"label": "wavelength", "value": f"if(nu>nl, {INV_RH_NM}/(1/nl^2-1/nu^2), 0)", "unit": "nm (vacuum)"}, {"label": "photon energy", "value": f"if(nu>nl, {RY}*(1/nl^2-1/nu^2), 0)", "unit": "eV"}],
   "shapes": [{"k": "line", "x1": 2, "y1": f"-{RY}/{n*n}", "x2": 10, "y2": f"-{RY}/{n*n}", "color": "dim"} for n in range(1, 8)] +
     [{"k": "arrow", "x1": 6, "y1": f"-{RY}/(nu*nu)", "x2": 6, "y2": f"-{RY}/(nl*nl)", "color": "accent", "when": "nu>nl"}, {"k": "text", "x": 1.9, "y": f"-{RY}/(nl*nl)", "text": "n = {nl}", "align": "right"}, {"k": "text", "x": 1.9, "y": f"-{RY}/(nu*nu)", "text": "n = {nu}", "align": "right"}],
   "caption": "Energy levels of hydrogen (eV, zero is a free electron). Pick two levels: the arrow is the jump and the readout is the light it gives out, from the Rydberg formula."})

add(node('at_models', 'The historical models of the atom', 'concept',
  'Our picture of the atom changed in five steps between 1803 and 1926, each forced by an experiment the previous model could not explain.',
  P('Each model in the atom view is a real stage in the history, and each was dropped because of something it could not explain. Dalton’s solid, indivisible ball had no room for the electrons that experiments in the 1890s showed come out of every atom; Thomson’s pudding could not explain how alpha particles bounce back; Rutherford’s planetary atom should collapse; Bohr’s circles only work for hydrogen. Quantum mechanics (1925–26) has not been contradicted by an atomic experiment since; its early non-relativistic form was extended by Dirac’s relativistic theory and by quantum electrodynamics, which agree with measurements to many digits.',
    'Choose a year at the top of the atom view to see each one, with a note on what it got right, what ended it, and how the picture on screen is only an illustration.'),
  P('A good model is not a lie. Dalton’s ball still works for counting atoms in chemistry; Bohr’s levels still give hydrogen’s spectrum correctly. A model is right in some range and wrong beyond it.'),
  P('The jump from Bohr’s model to quantum mechanics (1925–26) was made by Heisenberg’s matrix mechanics and Schrödinger’s wave mechanics.'),
  [['Dalton', '1803'], ['Thomson', '1904'], ['Rutherford', '1911'], ['Bohr', '1913'], ['Quantum', '1926']], 'C1', [CHE_2_2, CHE_6_2]),
  {"type": "blocks", "flow": True, "caption": "Five models and what forced each change.",
   "nodes": [{"id": "d", "label": "Dalton 1803: solid ball", "x": 10, "y": 50, "shape": "box"}, {"id": "t", "label": "Thomson 1904: pudding", "x": 30, "y": 50, "shape": "box"},
             {"id": "r", "label": "Rutherford 1911: nucleus", "x": 50, "y": 50, "shape": "box"}, {"id": "b", "label": "Bohr 1913: levels", "x": 70, "y": 50, "shape": "box"}, {"id": "q", "label": "Quantum 1926: wavefunction", "x": 90, "y": 50, "shape": "box"}],
   "edges": [{"from": "d", "to": "t", "label": "electrons found"}, {"from": "t", "to": "r", "label": "alpha bounce-back"}, {"from": "r", "to": "b", "label": "stability, spectra"}, {"from": "b", "to": "q", "label": "multi-electron atoms"}]})

add(node('at_model_dalton', 'Dalton’s atom, 1803', 'concept',
  'Dalton pictured each element as its own kind of small, solid, indivisible ball.',
  P('John Dalton explained the way elements combine by supposing that each element is made of identical, indestructible atoms, with different elements having atoms of different weights. A chemical reaction just rearranges them.',
    'It explained why compounds have fixed proportions by mass, and why when two elements make several compounds, the masses combine in small whole-number ratios.',
    'It was dropped as the final story when Thomson found in 1897 that every atom contains much lighter, negatively charged particles: atoms have parts.'),
  P('In Dalton’s picture atoms of different elements differ in weight, and all atoms of one element are alike.'),
  P('Dates vary in the history: the multiple-proportions observation is dated 1804, with the full theory published in 1808; 1803 is the date given for the start of this work.'),
  [['Idea', 'atoms are solid, indivisible balls'], ['Evidence', 'laws of definite and multiple proportions']], 'C1', [CHE_2_2],
  oq=None),
  {"type": "geometry", "range": [-4, 4, -3, 3], "equal": True, "shapes": [{"k": "circle", "x": 0, "y": 0, "r": 2, "fill": "#6a8fc7"}, {"k": "text", "x": 0, "y": -2.7, "text": "a solid ball, no inside", "align": "center"}],
   "caption": "Dalton’s atom: a ball with nothing inside. The size is not part of the model."})

add(node('at_model_thomson', 'Thomson’s atom, 1904', 'concept',
  'Thomson pictured an atom as a ball of positive charge with the electrons embedded in it.',
  P('J. J. Thomson showed in 1897 that cathode rays are streams of negatively charged particles much lighter than any atom. By 1904 he proposed that an atom is a sphere of positive charge with these electrons spread inside so that the whole is neutral. It was later nicknamed the plum-pudding model.',
    'It explained neutrality and why electrons could be pulled out of any atom. In 1909 Geiger and Marsden found that some alpha particles bounced back from a thin metal sheet, which a diffuse positive ball cannot do.'),
  P('Thomson’s calculation put the electrons into rings in the ball (he later thought of concentric shells); the electrons in the atom view are placed for illustration only.'),
  P('Electron charge-to-mass ratio from combined electric and magnetic deflection: 1.759 × 10¹¹ C/kg; Millikan’s oil-drop work showed charge comes in units of 1.6 × 10⁻¹⁹ C (OpenStax Chemistry 2e, section 2.2).'),
  [['Charge-to-mass of the electron', '1.759 × 10¹¹ C/kg'], ['Elementary charge', '1.6 × 10⁻¹⁹ C']], 'C1', [CHE_2_2]),
  {"type": "geometry", "range": [-4, 4, -3, 3], "equal": True, "shapes": [{"k": "circle", "x": 0, "y": 0, "r": 2.4, "fill": "#e59a9a", "alpha": 0.5}] + [{"k": "point", "x": round(1.4 * math.cos(2 * math.pi * k / 7), 2), "y": round(1.4 * math.sin(2 * math.pi * k / 7), 2), "size": 6, "color": "blue"} for k in range(7)] + [{"k": "text", "x": 0, "y": -2.8, "text": "electrons (blue) in a positive ball", "align": "center"}],
   "caption": "The plum-pudding atom. The electron positions are drawn for illustration."})

add(node('at_model_rutherford', 'Rutherford’s atom, 1911', 'concept',
  'Rutherford put all the positive charge and nearly all the mass in a tiny nucleus, with the electrons around it in mostly empty space.',
  P('Geiger and Marsden fired alpha particles at thin metal sheets. Most went nearly straight through, but a tiny fraction (about 1 in 8,000 in their first report) bounced back. Rutherford’s 1911 paper explained it: the positive charge and mass must be packed into a tiny core, because only a concentrated charge can turn an alpha particle round.',
    'The nucleus is thousands of times smaller than the atom, so atoms are mostly empty space.',
    'The model could not say why electrons orbiting a nucleus do not radiate away their energy and spiral in, and it could not explain atomic spectra.'),
  P('The figure shows the angle by which a point-like alpha particle is turned as it passes a heavy nucleus at distance b. Closer passes give bigger turns; a head-on approach stops at the distance d.'),
  P('Rutherford scattering: tan(θ/2) = d/(2b), where d = 2 Z e²/(4πε₀ E) is the distance of closest approach in a head-on collision for an alpha particle of energy E on a nucleus of charge Z, with e²/(4πε₀) = 1.43996 MeV fm. This treats both as point charges, ignores the electrons and the recoil of the nucleus, and fails when the alpha particle reaches the nucleus’s surface.'),
  [['e²/(4πε₀)', '1.43996 MeV fm'], ['Idea', 'tiny, dense, positive nucleus']], 'C1', [CHE_2_2]),
  {"type": "plot", "x": [1, 100], "y": [0, 180], "xlabel": "impact parameter b (fm)", "ylabel": "deflection angle θ (degrees)",
   "fns": [{"f": f"deg(2*atan(2*Z*{KE2}/E/(2*x)))", "label": "θ"}],
   "params": [{"id": "Z", "label": "nucleus charge Z (gold is 79)", "min": 2, "max": 92, "value": 79, "step": 1}, {"id": "E", "label": "alpha energy (MeV)", "min": 1, "max": 10, "value": 5, "step": 0.5}],
   "readouts": [{"label": "closest approach, head-on", "value": f"2*Z*{KE2}/E", "unit": "fm"}],
   "caption": "Point-charge scattering: how far an alpha particle is turned by a bare nucleus, as a function of how close it passes. Raise Z or lower the energy and the turns get larger."})

add(node('at_model_bohr', 'Bohr’s atom, 1913', 'concept',
  'Bohr let the electron move on circles with only certain allowed energies, and made the atom give out light when it jumps between them.',
  P('Niels Bohr kept Rutherford’s nucleus and added a rule: the electron can only be on certain circles, and it does not radiate while on one. Light comes out only when it jumps from a higher circle to a lower one.',
    'For hydrogen it reproduced the measured spectrum from fundamental constants, and the smallest circle has radius 52.9 pm, the Bohr radius. The radius of circle n is n² times that.',
    'It fails for atoms with more than one electron, even helium, and it predicts the wrong angular momentum for the ground state (it is zero in reality). It was replaced by quantum mechanics in 1925–26.'),
  P('In the atom view, Bohr’s model for hydrogen is drawn at true scale (the radii n²a₀), and the colours are computed from the Rydberg formula. For every other element it only shows a shell diagram: the number of electrons in each shell from the real configuration, not orbits.'),
  P('Bohr’s energies, −13.6057 eV Z²/n² (for a nucleus of infinite mass; the hydrogen atom’s own values are about 0.05% smaller), agree with the exact quantum result for hydrogen-like atoms (without fine structure), but the picture of definite orbits is wrong: the quantum ground state has no orbit and no angular momentum.'),
  [['Smallest radius', '52.9 pm (a₀)'], ['Ground-state energy', '−13.6 eV'], ['Radius of circle n', 'n² a₀']], 'C1', [CHE_6_2, UP3_6_4]),
  {"type": "bars", "ylabel": "radius of Bohr circle, pm", "caption": "Radius of Bohr’s circles for hydrogen: n² times the Bohr radius, 52.9 pm. In the real atom the electron has no such orbit, but its most probable distance in the 1s state is the same 52.9 pm.",
   "bars": [{"label": f"n = {n}", "value": round(n * n * A0, 1)} for n in range(1, 7)]})

add(node('at_probability_current', 'The flow of probability', 'concept',
  'In a state with a definite rotation, probability circulates around the axis; the dots in the atom view follow that flow.',
  P('For an electron state with m not zero, the cloud has a steady circulation around the vertical axis, like water in a whirlpool where the water level does not change. The probability density stays the same, but probability is flowing.',
    'Dots in the atom view drift along that flow, counterclockwise seen from above for positive m and clockwise for negative m. States with m = 0 do not flow, and neither do the chemist’s real orbitals (px, py, …), which are equal mixes of +m and −m. In standard quantum mechanics a cloud that sits still is not an electron at rest: its kinetic energy is not zero. (In the pilot-wave reading the electron would be at rest in such a state, and the energy sits in the wave’s “quantum potential”.)',
    'The motion on screen is slowed down by a stated factor of order 10¹⁶, because the real rotation takes about 10⁻¹⁶ s.'),
  P('In standard quantum mechanics only the probabilities are defined. In the pilot-wave (de Broglie–Bohm) reading, the dots would be an actual electron’s path. Both readings predict exactly the same measurements.'),
  P('The probability current is j = (ħ/m<sub>e</sub>) Im(ψ* ∇ψ). For ψ<sub>nlm</sub> it is purely azimuthal: v = mħ/(m<sub>e</sub> r sin θ) φ̂, so in atomic units each dot circles at fixed height and fixed distance s = r sin θ from the axis with angular speed ω = m/s². For display, the speed is capped close to the axis: dots closer than 0.12 of the mean radius turn at the rate they would have at that distance (fewer than 1.5% of the dots, measured for 3p and 5f with m = 1). The explanation panel in the atom view says so too. The simulation of mixed states takes steps of at most 0.25 atomic units of time per frame, so below about 17 frames a second the slowing is larger than stated.'),
  [['Flow speed', 'mħ/(mₑ s) at distance s from the axis'], ['Atomic unit of time', '2.4189 × 10⁻¹⁷ s']], 'C1', [UP3_7_1, ref('UP3', '8.2')],
  oq=['Whether the electron really follows these flow lines (pilot-wave theory) or only the probabilities are real is an interpretation question that experiments have not decided.']),
  {"type": "field", "range": [-3, 3, -3, 3], "streamlines": True, "vx": "-m*y/(x*x+y*y+0.05)", "vy": "m*x/(x*x+y*y+0.05)",
   "params": [{"id": "m", "label": "quantum number m", "min": -2, "max": 2, "value": 1, "step": 1}],
   "caption": "Probability flow seen from above the axis, for a state with rotation number m. Speed is proportional to m and fastest near the axis (a small constant keeps the centre finite). m = 0 means no flow."})

add(node('at_superposition', 'Superposition and the light an atom emits', 'concept',
  'Mix two energy states and the electron cloud itself oscillates, at exactly the frequency of the light the atom can give out.',
  P('An electron in a single energy state has a cloud that does not change. If it is in a mixture of two states of different energy, the cloud sloshes back and forth at a rate set by the energy difference.',
    'Mix hydrogen’s 1s and 2p (m = 0) states and the cloud swings up and down along the axis at 2.466 × 10¹⁵ times a second. That is the frequency of the Lyman-alpha line at 121.567 nm: an oscillating charge cloud is what makes light, so this is the link between orbitals and spectral lines.',
    '1s plus 2s makes the cloud breathe in and out without shifting its centre, so it has no oscillating dipole and cannot give out a single photon.'),
  P('The dots here move along the probability current of the mixed state, step by step, and are checked to stay distributed as |ψ(t)|². The motion on screen is slowed by the factor stated next to the picture.'),
  P('ψ(t) = Σ c<sub>k</sub> ψ<sub>k</sub> e<sup>−iE<sub>k</sub>t/ħ</sup> with E<sub>n</sub> = −Z²/2n² hartree for hydrogen-like atoms. For 1s + 2p<sub>0</sub> the density contains a cross term proportional to cos[(E₂ − E₁)t/ħ]; the beat frequency (E₂ − E₁)/h is 2.4660 × 10¹⁵ Hz with the reduced-mass hydrogen nucleus (2.4674 × 10¹⁵ Hz for an infinitely heavy nucleus).'),
  [['(E₂ − E₁)/h, hydrogen', '2.466 × 10¹⁵ Hz'], ['Lyman-alpha (observed)', '121.567 nm']], 'C1', [UP3_7_1, UP3_8_5]),
  {"type": "plot", "x": [-9, 9], "y": [0, 0.5], "xlabel": "position along the axis, z (Bohr radii)", "ylabel": "|ψ|²",
   "fns": [{"f": "0.5*(exp(-2*abs(x))/pi + x*x*exp(-abs(x))/(32*pi)) + exp(-abs(x))/sqrt(pi)*x*exp(-abs(x)/2)/(4*sqrt(2*pi))*cos(2*pi*t/4)", "label": "1s + 2p(m = 0), density along the axis"}],
   "caption": "The density of an equal mix of 1s and 2p (m = 0) along the vertical axis. The cloud sloshes from one side to the other; the real period is 4.05 × 10⁻¹⁶ s, slowed here to 4 s."})

add(node('at_interpretations', 'What the wavefunction is', 'concept',
  'Quantum mechanics predicts what you will measure; what the wavefunction actually is remains an open question with several competing answers.',
  P('Everyone agrees on the rules for calculating the outcomes of experiments, and they have passed every test so far (in their relativistic form, for atoms, they are accurate to many digits). People disagree about what the mathematics describes.',
    'In the usual (Copenhagen-style) reading, the wavefunction is a tool for calculating probabilities, and an electron has no definite position until measured. In the pilot-wave (de Broglie–Bohm) reading, electrons always have positions and are guided by the wavefunction, so the dots in this app would be real paths. In the many-worlds reading, the wavefunction is all there is and every outcome happens.',
    'The three readings give the same predictions for the atom, which is why this app draws the dots as “places the electron could be found” and treats the interpretation as open.'),
  P('So far no experiment has separated these readings for atoms. A physicist can use any of them to compute the same numbers.'),
  P('The hydrogen current v = (ħ/m<sub>e</sub>) Im(∇ψ/ψ) is the guidance equation of pilot-wave theory.'),
  [['Predictions of the theory', 'certain (C1)'], ['What ψ is', 'debated (C4)']], 'C4', [UP3_7_1, ref('UP3', '6.6')],
  oq=['What is the wavefunction? Is it physically real, a state of knowledge, or one branch of many worlds?', 'Does the electron have a definite position between measurements?']),
  {"type": "blocks", "caption": "The same measurements follow from every reading.",
   "nodes": [{"id": "w", "label": "Wavefunction ψ and its equation (C1)", "x": 50, "y": 20, "shape": "box"}, {"id": "p", "label": "Predicted measurements: the same for all", "x": 50, "y": 55, "shape": "box"},
             {"id": "c", "label": "Probabilities only", "x": 17, "y": 85, "shape": "box"}, {"id": "b", "label": "Pilot wave: real paths", "x": 50, "y": 85, "shape": "box"}, {"id": "m", "label": "Many worlds", "x": 83, "y": 85, "shape": "box"}],
   "edges": [{"from": "w", "to": "p"}, {"from": "p", "to": "c", "dashed": True}, {"from": "p", "to": "b", "dashed": True}, {"from": "p", "to": "m", "dashed": True}]})

# ---------------------------------------------------------------- one card per element
def fmt(x, d=4):
    return f"{x:.{d}g}"
def sup(c):
    import re
    return re.sub(r'(\d[spdfgh])(\d+)', lambda m: m.group(1) + m.group(2).translate(str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')), c)
LETTER = 'spdfg'
def outermost(sym):
    d = SCF['elements'][sym]; k = max(d, key=lambda q: d[q]['r_mean']); return k, d[k]['r_mean'] * A0
for e in EL:
    s = e['symbol']; nm = e['name']; low = nm.lower(); iso = ISO[s]; z = ZEFF[s]; Z = e['Z']
    row = e['period']; grp = e['group']
    if grp: place = f"period {row}, group {grp}, {e['block']} block"
    else: place = f"period {row}, in the f block, which is the row of {'lanthanides' if 57 <= Z <= 70 else 'actinides'} drawn below the main table (it has no group number)"
    cfg = sup(e['config'])
    b = [f"{nm} is element {Z}: its atoms have {Z} proton{'s' if Z > 1 else ''} and, when neutral, {Z} electron{'s' if Z > 1 else ''}. In the periodic table it is in {place}; its family is {e['category'].lower()}.",
         e['summary'],
         f"In its lowest-energy state the electrons are arranged {cfg}" + ('.' if not e['config_predicted'] else ', which is a prediction: no spectrum of the neutral atom has been measured.')]
    if e['config_anomaly']: b.append(f"This breaks the usual filling order: {nm} is one of the elements whose ground-state configuration differs from the simple rule, which the configuration strip in the atom view shows.")
    facts = [['Atomic number Z', str(Z)]]
    if e['mass'] is not None:
        u = f" ± {e['mass_uncertainty']}" if e.get('mass_uncertainty') else ''
        facts.append(['Atomic weight', f"{e['mass']}{u} u" + ('' if iso['natural'] else ' (longest-lived isotope: no standard value)')])
    facts.append(['Electron configuration', cfg + (' (predicted)' if e['config_predicted'] else '')])
    if e['ground_level']: facts.append(['Ground level (NIST)', e['ground_level']])
    if e['ionization_eV']: facts.append(['First ionisation energy', f"{e['ionization_eV']:.4g} eV"])
    if e['electronegativity']: facts.append(['Electronegativity (Pauling)', str(e['electronegativity'])])
    ok, orm = outermost(s)
    facts.append(['Outermost subshell: computed mean radius', f"{ok}, {orm:.0f} pm (self-consistent field, no relativity)"])
    if e['radius_atomic_pm']: facts.append(['Atomic radius (empirical)', f"{e['radius_atomic_pm']:g} pm"])
    if e['radius_covalent_pm']:
        extra = e.get('radius_covalent_note') or ('' if e['radius_covalent_source'].startswith('Cordero') else 'calculated (Pyykkö), not measured')
        facts.append(['Covalent radius', f"{e['radius_covalent_pm']:g} pm" + (f" ({extra[0].lower() + extra[1:] if extra[0].isupper() and not extra.startswith(('Cordero', 'Pyyk')) else extra})" if extra else '')])
    if e['radius_vdw_pm']: facts.append(['Van der Waals radius', f"{e['radius_vdw_pm']:g} pm"])
    if e['density'] is not None: facts.append(['Density', f"{e['density']:.4g} g/cm³" + (' (gas, 0 °C, 1 atm)' if e['phase_stp'] == 'gas' else '') + (f" ({e['density_note']})" if e.get('density_note') else '')])
    if e['melt_K']: facts.append(['Melting point', f"{e['melt_K']:.6g} K ({e['melt_K'] - 273.15:.5g} °C)"])
    if e['boil_K']: facts.append(['Boiling point', f"{e['boil_K']:.6g} K ({e['boil_K'] - 273.15:.5g} °C)"])
    facts.append(['State at room temperature', e['phase_stp'] if e['phase_stp'] != 'unknown' else 'not known (no visible amount ever made)'])
    if iso['natural']:
        facts.append(['Natural isotopes', ', '.join(f"{s}-{x['A']}" + (f" ({100 * x['abundance']:.4g}%)" if x.get('abundance') is not None else '') + ('' if x['stable'] else f" radioactive, {x['half_life_text']}") for x in iso['natural'])])
    elif iso['longest_lived']:
        L = iso['longest_lived']; facts.append(['Longest-lived isotope known', f"{s}-{L['A']}, half-life {L['half_life_text']}"])
    facts.append(['Discovered', 'known since antiquity' if e['discovered'] == 'antiquity' else str(e['discovered'])])
    if Z == 1:
        d0 = f"Hydrogen has a single electron, so nothing screens the nucleus from it: it feels the full nuclear charge, +1. In this app its 1s cloud is drawn at the exact hydrogen size (mean radius {orm:.1f} pm, 1.5 Bohr radii)."
    elif Z == 2:
        d0 = f"Helium’s two electrons each partly screen the nucleus from the other (there are no inner electrons). The 1s cloud is drawn at a mean radius of {orm:.1f} pm from a self-consistent-field calculation."
    else:
        d0 = f"In this app each occupied subshell is drawn as a hydrogen-like cloud scaled to a mean radius computed by a self-consistent-field calculation (see “Electron cloud sizes”). The outermost subshell ({sup(ok)[:2]}) comes out at about {orm:.0f} pm; the electrons in the inner shells screen part of the nuclear charge ({Z}) from it."
    deeper = [d0]
    n_nat = len(iso['natural'])
    if n_nat == 1:
        deeper.append(f"Natural {low} is a single isotope, {s}-{iso['natural'][0]['A']}, so the atom view has no isotope to choose; the nucleus you can zoom into is that one.")
    elif n_nat > 1:
        deeper.append(f"Natural {low} is a mixture of {n_nat} isotopes. Pick an isotope in the atom view to set the neutron number of the nucleus you can zoom into.")
    else:
        L = iso['longest_lived']; deeper.append(f"{nm} has no stable or primordial isotope. The nucleus you can zoom into in the atom view is that of the longest-lived isotope measured, {s}-{L['A']}, with a half-life of {L['half_life_text']}.")
    if e['block'] != e['block_by_config']:
        deeper.append(f"Placement note: {nm} sits in the {e['block']} block of the table by the usual layout, but the subshell that fills last in its ground-state configuration {cfg} is a {e['block_by_config']} subshell.")
    if e['config_predicted']: deeper.append("Because the configuration is predicted, relativistic calculations are used; they do not always agree.")
    if Z >= 55: deeper.append("For heavy atoms the computed sizes leave out relativity, which shrinks s and p shells and expands d and f shells, so those clouds are approximate.")
    radii = ', '.join(f"{k} {SCF['elements'][s][k]['r_mean'] * A0:.3g} pm" for k in SCF['elements'][s])
    ex = [f"Ground level {e['ground_level']} (NIST term notation)." if e['ground_level'] else '', f"Configuration source: {e['config_source']}." + (f" {e['config_note']}" if e['config_note'] else ''),
          f"Cloud sizes: non-relativistic self-consistent-field model; computed mean radii of the occupied subshells: {radii}.", e.get('mass_note') or '']
    if e.get('ionization_unc_eV') and e['ionization_eV']: ex.append(f"First ionisation energy {e['ionization_eV']:.8g} eV (uncertainty {e['ionization_unc_eV']:.2g} eV); status: {e['ionization_status']}.")
    if e['discovered_note']: ex.append(e['discovered_note'])
    cert = 'C2' if e['config_predicted'] else 'C1'
    oq = None
    if e['config_predicted']: oq = [f"What is the real ground-state configuration of {low}? Only a few atoms have ever been made, so it rests on calculation."]
    n = node('at_el_' + s, f"{nm} ({s})", 'element', e['summary'], P(*b), P(*deeper), P(*[x for x in ex if x]), facts, cert, [CHE_2_5, CHE_6_4], oq=oq,
             parents=['at_configuration'])
    n['template'] = 'concept'
    N.append(n)

json.dump(N, open(os.path.join(ROOT, 'data/nodes/phys_atom.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(V, open(os.path.join(ROOT, 'data/viz/atom.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(N), 'nodes,', len(V), 'figures')
