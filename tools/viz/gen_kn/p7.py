# Overrides applied after a first visual pass over every figure (layout/legibility fixes).
from lib import *
import math
def redo(i): S.pop(i, None)

# --- blocks / hubs with tighter layouts ---
redo('millennium_problems')
hub('millennium_problems', 'Seven Clay prizes were set in 2000; only the Poincaré conjecture has been solved (Perelman, 2003). The rest are open, so any prediction here is a guess.',
    'Millennium problems', ['P vs NP', 'Riemann', 'Yang–Mills gap', 'Navier–Stokes', 'Hodge', 'BSD conjecture', 'Poincaré (solved)'],
    colors=['pink'] * 6 + ['green'], aspect=0.95)
redo('maxwell')
blocks('maxwell', "Maxwell's equations tie electricity and magnetism together: charges make E, currents make B, and a changing B makes E (Faraday) while a changing E makes B (Maxwell's term). That loop is light.",
       [('rho', 'Charges', 12, 12, 'pink'), ('j', 'Currents', 12, 88, 'pink'), ('e', 'E field', 62, 12, 'accent'), ('b', 'B field', 62, 88, 'accent'), ('w', 'EM wave', 90, 50, 'gold')],
       [('rho', 'e', 'Gauss'), ('j', 'b', 'Ampère'), ('b', 'e', 'Faraday'), ('e', 'b', 'Maxwell'), ('e', 'w'), ('b', 'w')], aspect=0.62)
redo('magnetism_force')
add('magnetism_force', dict(type='parametric', range=[-6, 6, -6, 6], curves=[dict(x='0.569*v/B*cos(s)', y='0.569*v/B*sin(s)', s=[0, 6.2832], color='accent', dot='t*B*0.3')],
    shapes=[T(0, 0, 'B into page', 'dim', 10)],
    params=[P('v', 'speed', 1, 10, 8, '×10⁶ m/s'), P('B', 'field B', 1, 10, 1.5, 'mT')],
    readouts=[R('radius mv/qB', '0.569*v/B', 'cm'), R('cyclotron frequency', '28*B', 'MHz')],
    caption='A charged particle (here an electron) moves in a circle in a magnetic field because the force is always sideways. A stronger field or slower particle gives a tighter circle.'))
redo('electromagnetic_waves')
bars('electromagnetic_waves', 'The electromagnetic spectrum is one phenomenon spanning many orders of magnitude in frequency (f = c/λ); visible light is a thin sliver near 5×10¹⁴ Hz. Bar height is log₁₀ of the typical frequency in Hz.',
     [('radio', 8, 'orange'), ('micro', 10.5, 'orange'), ('infra-red', 13.5, 'red'), ('visible', 14.7, 'green'), ('UV', 15.5, 'purple'), ('X-ray', 18.5, 'blue'), ('gamma', 20.5, 'blue')], ylabel='log₁₀ frequency (Hz)')
S['gravitational_waves']['y'] = [-0.9, 0.9]
redo('black_holes')
plot('black_holes', 'The Schwarzschild radius r_s = 2GM/c² grows in proportion to mass: about 3 km per solar mass. A black hole is a mass squeezed inside its own r_s.',
     [F('2.95*x', 'event horizon radius', 'accent')], x=[0.1, 1e10], y=[0.1, 1e11], logx=True, logy=True, xlabel='mass (solar masses)', ylabel='r_s (km)',
     points=[dict(x=1, y=2.95, label='Sun', color='gold'), dict(x=4.3e6, y=1.27e7, label='Sgr A*', color='pink'), dict(x=6.5e9, y=1.9e10, label='M87*', color='pink'), dict(x='10^lm', y='2.95*10^lm', color='white')],
     params=[P('lm', 'log₁₀ mass', -1, 10, 1)], readouts=[R('radius for this mass', '2.95*10^lm', 'km')])
redo('wave_particle')
plot('wave_particle', 'Matter has a wavelength, λ = h/p. Electrons and atoms have wavelengths comparable to atom spacings, so they diffract from crystals; a thrown baseball\'s is ~10²⁴ times smaller than any atom. Both axes are log₁₀. Slide the speed.',
     [F('-33.18-x-vv', 'λ = h/(m v)', 'accent')], x=[-31, 2], y=[-37, -8], xlabel='log₁₀ mass (kg)', ylabel='log₁₀ wavelength (m)',
     params=[P('vv', 'log₁₀ speed (m/s)', 0, 6, 2)], hlines=[dict(y=-10, label='size of an atom', color='gold')],
     points=[dict(x=-30.04, y='-33.18+30.04-vv', label='electron', color='gold'), dict(x=-24.4, y='-33.18+24.4-vv', label='C₆₀', color='green'), dict(x=-0.84, y='-33.18+0.84-vv', label='baseball', color='pink'), dict(x=1.85, y='-33.18-1.85-vv', label='person', color='pink')],
     readouts=[R('electron wavelength', '10^(-33.18+30.04-vv)*1e9', 'nm')])
redo('strong_cp_axion')
plot('strong_cp_axion', 'The neutron electric dipole moment d ≈ 3.6×10⁻¹⁶·θ e·cm is not seen down to 1.8×10⁻²⁶ e·cm, so θ < ~10⁻¹⁰. Why it is so tiny is unexplained; the axion is one proposed answer. Axes are log₁₀.',
     [F('-15.44+x', 'predicted dipole moment', 'accent')], x=[-12, 0], y=[-28, -14], xlabel='log₁₀ θ (QCD vacuum angle)', ylabel='log₁₀ neutron EDM (e·cm)',
     hlines=[dict(y=-25.74, label='measured limit', color='pink')], vlines=[dict(x=-10.3, label='θ < 5×10⁻¹¹', color='pink')])
redo('quantum_gravity')
bars('quantum_gravity', 'Gravity and quantum theory clash at the Planck length, ~20 orders of magnitude below anything we have probed. Bars show how small each length is: height = n where length = 10⁻ⁿ m. Candidate theories exist, none tested.',
     [('proton', 15.1, 'green'), ('LHC probes', 19, 'accent'), ('Planck length', 34.8, 'pink')], ylabel='n in length = 10⁻ⁿ m')
redo('nucleosynthesis_stars')
bars('nucleosynthesis_stars', 'Abundance of elements in the Sun on a log scale (height = log₁₀ of atoms per 10¹² hydrogen). H and He came from the Big Bang; C to Fe from stars; lead and gold from rarer neutron-capture events. Sources of heavy elements are still being worked out.',
     [('H', 12), ('He', 10.93), ('O', 8.69, 'green'), ('C', 8.43, 'green'), ('Fe', 7.5, 'gold'), ('Pb', 1.75, 'pink'), ('Au', 0.92, 'pink')], ylabel='log₁₀ atoms per 10¹² H')
redo('optical_clocks')
bars('optical_clocks', 'Clock precision as digits of accuracy: height = −log₁₀(fractional uncertainty), so taller is better (approximate). Optical lattice clocks are now so stable they test whether physical constants change over time.',
     [('quartz', 6), ('rubidium', 11), ('Cs fountain', 16), ('Sr optical', 17.7, 'gold')], ylabel='digits of accuracy')
S['periodic_table']['y'] = [0, 28]
redo('atomic_spectra')
geo('atomic_spectra', 'Atoms emit only specific colours: a jump between levels releases a photon with exactly the energy difference. Balmer lines (visible) end at n = 2, e.g. 3→2 is red at 656 nm; jumps to n = 1 are ultraviolet.',
    [-1, 6.5, -15, 1],
    [T(0.3, -13.6, 'n=1', 'dim', 10), T(4.1, -3.4, 'n=2', 'dim', 10), T(4.1, -1.5, 'n=3', 'dim', 10)] + [L(0.5, '-13.606/%d' % n, 3.5, '-13.606/%d' % n, 'white', 1.5) for n in range(1, 8)] +
    [A(2, '-13.606/ni^2', 2, '-13.606/nf^2', 'gold', 3), T(5.4, -8, '{1239.84/(13.606*(1/nf^2-1/ni^2))} nm', 'gold', 11)],
    params=[P('ni', 'start level', 3, 7, 3, step=1), P('nf', 'end level', 1, 2, 2, step=1)],
    readouts=[R('photon wavelength', '1239.84/(13.606*abs(1/nf^2-1/ni^2))', 'nm'), R('photon energy', '13.606*abs(1/nf^2-1/ni^2)', 'eV')], equal=False, aspect=0.65)
S['atomic_spectra']['shapes'][1]['y'] = -3.4; S['atomic_spectra']['shapes'][2]['y'] = -1.5
S['antihydrogen']['edges'][2].pop('label', None)
S['reaction_kinetics']['y'] = [0.01, 1e9]
S['computational_chemistry']['y'] = [1e3, 1e15]; S['computational_chemistry']['x'] = [10, 1000]
S['computational_chemistry']['params'][0] = P('lb', 'budget: log₁₀(operations)', 9, 14, 12, None)
S['inorganic_coordination']['params'][0]['label'] = 'splitting Δ'
S['inorganic_coordination']['caption'] = S['inorganic_coordination']['caption'] + ' Water gives Δ ≈ 124 kJ/mol (high spin), cyanide ≈ 400 (low spin).'

# --- chains with shorter labels ---
for i in ['haber_bosch', 'viruses', 'chloroplast_org', 'organelles_overview', 'metabolism_overview', 'rna_world', 'central_dogma', 'antimatter_asymmetry', 'effective_theories', 'evolution_algorithm', 'minerals_rocks', 'organic_functional_groups']:
    redo(i)
chain('haber_bosch', 'The Haber–Bosch process makes ammonia from N₂ and H₂ over an iron catalyst at ~400–500 °C and 150–300 atm. Unreacted gas is recycled. About half the nitrogen in your body passed through this industrial process.',
      ['N₂ + 3H₂', 'Iron catalyst, 200 atm', '2 NH₃ mixture', 'Condense out NH₃'], per_row=2, colors=['accent', 'gold', 'accent', 'pink'])
S['haber_bosch']['edges'].append({'from': 'n3', 'to': 'n0', 'label': 'recycle', 'dashed': True})
chain('viruses', 'A virus cannot reproduce alone: it attaches to a host cell, injects its genome, makes the cell build copies, assembles new particles and bursts out. Each cycle can release hundreds of virions.',
      ['Attach', 'Enter, release genome', 'Host copies virus', 'Assemble', 'Release virions'], per_row=2, colors=['accent', 'accent', 'pink', 'gold', 'green'])
S['viruses']['edges'].append({'from': 'n4', 'to': 'n0', 'label': 'next cell', 'dashed': True})
chain('chloroplast_org', 'Chloroplasts are former cyanobacteria. Light reactions in the thylakoid membranes make ATP and NADPH; the Calvin cycle in the surrounding stroma uses them to fix CO₂ into sugar.',
      ['Light + H₂O', 'Light reactions', 'ATP + NADPH', 'Calvin cycle', 'Sugar + O₂'], per_row=2, colors=['gold', 'green', 'pink', 'green', 'gold'])
chain('organelles_overview', 'The secretory pathway: the gene is copied in the nucleus, the protein is made and folded in the rough ER, finished in the Golgi, and shipped in vesicles to the membrane or to lysosomes.',
      ['Nucleus (mRNA)', 'Rough ER', 'Golgi', 'Vesicles to target'], per_row=2, colors=['accent', 'gold', 'pink', 'green'])
chain('metabolism_overview', 'Cells burn glucose in stages: glycolysis (2 ATP), the Krebs cycle (carriers NADH, FADH₂) and finally the electron transport chain, which makes most of the ~30 ATP per glucose.',
      ['Glucose', 'Glycolysis', 'Krebs cycle', 'NADH, FADH₂', 'Electron chain', '~30 ATP + H₂O'], per_row=3, colors=['gold', 'accent', 'accent', 'pink', 'accent', 'gold'])
chain('rna_world', 'RNA can both carry information and catalyse reactions (ribozymes), so it could have run early life before DNA and proteins. Later, proteins took over catalysis and DNA took over storage. Supported by lab evidence but not proven.',
      ['Self-copying RNA', 'RNA + peptides', 'DNA stores, protein works'], per_row=1, colors=['pink', 'accent', 'gold'], elabels=['ribozymes', 'specialisation'], aspect=0.8)
chain('central_dogma', 'Information flows DNA → RNA → protein. Transcription copies a gene into messenger RNA; ribosomes translate it, three letters (a codon) per amino acid. DNA also copies itself (replication).',
      ['DNA', 'mRNA', 'Protein'], per_row=1, colors=['accent', 'gold', 'pink'], elabels=['transcription', 'translation'], aspect=0.8)
chain('antimatter_asymmetry', 'The Big Bang should have made equal matter and antimatter, yet the universe has about one extra matter particle per billion pairs. The mechanism (needing the three Sakharov conditions) is not known.',
      ['Baryon number violated', 'C and CP violated', 'Out of equilibrium', 'Matter excess 6×10⁻¹⁰'], per_row=2, colors=['pink', 'pink', 'pink', 'gold'])
chain('effective_theories', 'Each level of nature has its own good description, mostly independent of the details below: chemistry does not need quark physics, biology does not need to solve the Schrödinger equation. New behaviour "emerges" at each level.',
      ['Quarks, gluons', 'Nuclei', 'Atoms', 'Molecules', 'Cells'], per_row=3, colors=['pink', 'pink', 'gold', 'accent', 'green'])
chain('evolution_algorithm', 'Evolution as an algorithm: copy with variation, select what works, repeat. Information about the environment accumulates in genomes over generations. The same loop drives genetic algorithms in computing.',
      ['Variation', 'Selection', 'Inheritance'], per_row=3, colors=['accent', 'pink', 'gold'], loop=True)
chain('minerals_rocks', 'The rock cycle: magma cools into igneous rock; weathering and burial make sedimentary rock; heat and pressure make metamorphic rock; and melting returns it to magma. The cycle takes tens to hundreds of millions of years.',
      ['Magma', 'Igneous', 'Sediment', 'Sedimentary', 'Metamorphic'], per_row=3, colors=['pink', 'accent', 'gold', 'gold', 'green'], loop=True, elabels=['cooling', 'weathering', 'burial', 'heat, pressure', 'melting'])
chain('organic_functional_groups', 'The carbon backbone stays; the functional group at the end sets the chemistry. Oxidation steps an alkane through alcohol and aldehyde up to a carboxylic acid (here C₂).',
      ['Ethane CH₃CH₃', 'Ethanol CH₃CH₂OH', 'Acetaldehyde CH₃CHO', 'Acetic acid CH₃COOH'], per_row=2, colors=['dim', 'accent', 'gold', 'pink'], elabels=['+O', '−2H', '+O'])

# --- hand layouts ---
redo('crispr_biotech')
blocks('crispr_biotech', "CRISPR–Cas9: a guide RNA leads the Cas9 enzyme to a matching 20-letter DNA site, where it cuts both strands. The cell's repair then either disables the gene or, with a template, writes in a new sequence.",
       [('g', 'Guide RNA + Cas9', 24, 10, 'gold'), ('t', 'Find target', 76, 10), ('c', 'Double-strand cut', 76, 50, 'pink'), ('k', 'Gene knocked out', 24, 90, 'accent'), ('i', 'New DNA inserted', 76, 90, 'green')],
       [('g', 't'), ('t', 'c'), ('c', 'k', 'NHEJ repair'), ('c', 'i', 'HDR repair')], aspect=0.7)
redo('mitochondria_org')
blocks('mitochondria_org', 'Mitochondria descend from a bacterium engulfed by an ancestral host cell about 2 billion years ago. They still have their own small circular DNA (16.6 kb in humans), their own ribosomes and a double membrane.',
       [('h', 'Archaeal host', 26, 10, 'accent'), ('b', 'Proteobacterium', 76, 10, 'pink'), ('e', 'Endosymbiosis', 50, 50), ('m', 'Mitochondrion', 50, 90, 'gold')],
       [('h', 'e'), ('b', 'e'), ('e', 'm')], aspect=0.62)
redo('cell_signaling')
blocks('cell_signaling', 'A signal molecule binds a receptor, a relay chain of enzymes amplifies it, and the cell responds: change gene activity, move, divide, or (if damaged beyond repair) trigger programmed death (apoptosis).',
       [('l', 'Signal (ligand)', 24, 10, 'gold'), ('r', 'Receptor', 76, 10), ('k', 'Kinase cascade', 76, 50, 'accent'), ('x', 'Gene response', 24, 90, 'green'), ('a', 'Apoptosis', 76, 90, 'pink')],
       [('l', 'r'), ('r', 'k'), ('k', 'x', 'survive'), ('k', 'a', 'severe damage')], aspect=0.7)
redo('kilonova_rprocess')
blocks('kilonova_rprocess', 'In 2017 gravitational waves and light from two merging neutron stars (GW170817) showed fresh heavy elements being made by rapid neutron capture (r-process). Mergers are one source; whether supernovae also contribute is debated.',
       [('m', 'NS merger', 24, 10, 'pink'), ('e', 'Neutron-rich ejecta', 76, 10), ('r', 'r-process', 76, 50, 'gold'), ('a', 'Gold, uranium', 24, 90, 'gold'), ('k', 'Kilonova glow', 76, 90, 'accent')],
       [('m', 'e'), ('e', 'r'), ('r', 'a'), ('r', 'k')], aspect=0.7)
redo('common_descent')
blocks('common_descent', 'All living things share ancestors. Each split in the tree is a population that diverged; closeness on the tree means more recent common ancestry. Simplified: the true tree has millions of tips.',
       [('l', 'LUCA', 9, 50, 'gold'), ('b', 'Bacteria', 36, 12, 'accent'), ('a', 'Archaea', 36, 50, 'accent'), ('e', 'Eukaryotes', 64, 50, 'accent'),
        ('p', 'Plants', 91, 14, 'green'), ('f', 'Fungi', 91, 50), ('an', 'Animals', 91, 86, 'pink')],
       [('l', 'b'), ('l', 'a'), ('a', 'e'), ('e', 'p'), ('e', 'f'), ('e', 'an')], flow=False, aspect=0.7)
redo('moon_origin_node')
hub('moon_origin_node', "The leading idea is a giant impact with a Mars-sized body (Theia), but the Moon's Earth-like isotopes are hard to explain, so variants compete.",
    'Moon formation (open)', ['Giant impact', 'Fast-spinning Earth', 'Many impacts', 'Synestia'], colors=['accent'] * 4, aspect=0.8)
redo('consciousness_theories')
hub('consciousness_theories', 'There is no agreed scientific theory of consciousness; leading candidates make different predictions and are being tested against each other.',
    'Consciousness (open)', ['Global workspace', 'IIT', 'Higher-order', 'Recurrent', 'Predictive'], colors=['accent'] * 5, aspect=0.9)
redo('machine_consciousness')
hub('machine_consciousness', 'Whether a machine could be conscious depends on what consciousness is, which is unsettled. Views differ: computation might suffice, hardware might matter, or life itself might be required. No test exists.',
    'Machine minds?', ['Functionalism', 'IIT (hardware)', 'Biological only', 'Illusionism'], colors=['accent', 'pink', 'green', 'gold'], aspect=0.85)
redo('predictive_brain')
blocks('predictive_brain', 'On this view the brain constantly predicts its inputs. Only the mismatch (prediction error) travels up the hierarchy to update the model. The idea fits a lot of data but remains debated as a full account.',
       [('m', 'Internal model', 22, 12, 'gold'), ('s', 'Sensory input', 22, 88, 'accent'), ('e', 'Compare', 56, 50, None, 'sum'), ('u', 'Prediction error', 82, 50, 'pink')],
       [('m', 'e'), ('s', 'e'), ('e', 'u'), ('u', 'm', 'update', True)], aspect=0.62)
redo('string_theory_holography')
blocks('string_theory_holography', 'String theory replaces point particles with tiny vibrating strings, and the AdS/CFT duality says a gravity theory in a volume equals a quantum theory without gravity on its boundary. Both are mathematically rich, but untested by experiment.',
       [('s', 'Vibrating strings', 50, 10, 'gold'), ('b', 'Gravity in AdS', 22, 55, 'accent'), ('c', 'Boundary CFT', 78, 55, 'pink'), ('t', 'No experimental test yet', 50, 92, 'dim')],
       [('s', 'b'), ('s', 'c'), ('b', 'c', 'equivalent')], flow=False, aspect=0.7)

# --- bars: shorter labels ---
def relabel(i, labs):
    for b, l in zip(S[i]['bars'], labs): b['label'] = l
relabel('mass_extinctions', ['End-Ord', 'L-Dev', 'End-Perm', 'End-Tri', 'K–Pg'])
relabel('cell_biology_intro', ['ribosome', 'virus', 'bacteria', 'red cell', 'animal', 'frog egg'])
relabel('sensory_systems', ['rods', 'cones', 'smell', 'hair cells', 'taste buds'])
relabel('biodiversity_conservation', ['amphib.', 'sharks', 'conifers', 'mammals', 'reptiles', 'birds'])
relabel('deep_time', ['Earth', 'life', 'O₂', 'animals', 'dinos', 'humans'])
relabel('soil_biology', ['bacteria', 'actino.', 'fungi', 'protozoa', 'nematodes'])
relabel('ice_sheets', ['glaciers', 'W. Antarc.', 'Greenland', 'E. Antarc.'])
relabel('earth_water_origin', ['nebula', 'oceans', 'chondrite', '67P', 'Halley'])
relabel('animal_diversity', ['insects', 'fungi', 'molluscs', 'vertebr.', 'mammals'])
relabel('mars_node', ['radius', 'mass', 'gravity', 'sunlight', 'air press.', 'day'])
relabel('intermolecular_forces', ['H₂O', 'H₂S', 'H₂Se', 'H₂Te'])
S['human_evolution']['x'] = [-4, 1.3]

# --- log-heavy plots rewritten on log10 axes ---
redo('volcanism')
plot('volcanism', 'Silica-rich magma is thousands to billions of times more viscous than basalt (axis is log₁₀). Runny basalt lets gas escape (gentle lava flows); sticky rhyolite traps gas and erupts explosively. Values approximate.',
     [F('2+0.35*(x-50)', 'log₁₀ viscosity', 'accent')], x=[45, 78], y=[0, 12], xlabel='silica content (wt% SiO₂)', ylabel='log₁₀ viscosity (Pa·s)',
     vlines=[dict(x=50, label='basalt', color='gold'), dict(x=60, label='andesite', color='gold'), dict(x=72, label='rhyolite', color='gold')], params=[P('si', 'silica', 45, 78, 52, '%')],
     points=[dict(x='si', y='2+0.35*(si-50)')], readouts=[R('viscosity', '10^(2+0.35*(si-50))', 'Pa·s')])
redo('agn_quasars')
plot('agn_quasars', 'A black hole can shine no brighter than the Eddington luminosity (about 3.3×10⁴ L☉ per solar mass) or its own light would blow the gas away. Quasars are supermassive black holes feeding near that limit; Sgr A* is nearly starved. Axes are log₁₀.',
     [F('4.52+log10(lam)+x', 'luminosity', 'accent')], x=[5.5, 10], y=[0, 15], xlabel='log₁₀ black-hole mass (M☉)', ylabel='log₁₀ luminosity (L☉)',
     params=[P('lam', 'fraction of Eddington', 0.001, 1, 0.3)], points=[dict(x=6.63, y=3, label='Sgr A* (dim)', color='pink'), dict(x=9.8, y='4.52+log10(lam)+9.8', label='M87*-like', color='gold')],
     readouts=[R('luminosity of a 10⁸ M☉ hole', '3.29e4*lam*1e8', 'L☉')])
redo('big_bang')
plot('big_bang', 'The universe was hotter in the past: the cosmic background temperature scales as T = 2.725 K × (1 + z). Light first travelled freely at ~3000 K (z ≈ 1100); nuclei formed near 10¹⁰ K, within the first minutes. Axes are log₁₀; earlier eras are extrapolations.',
     [F('0.4353+x', 'radiation temperature', 'accent')], x=[0, 10], y=[0, 11], xlabel='log₁₀ (1 + redshift)', ylabel='log₁₀ temperature (K)',
     points=[dict(x=3.04, y=3.48, label='light released', color='gold'), dict(x=9.57, y=10, label='nuclei form', color='pink'), dict(x=0, y=0.4353, label='today', color='green')],
     params=[P('lz', 'log₁₀(1+z)', 0, 10, 3)], readouts=[R('temperature', '2.725*10^lz', 'K'), R('thermal energy kT', '8.617e-5*2.725*10^lz', 'eV')])
redo('inflation')
plot('inflation', 'In inflation the comoving Hubble radius shrinks, so one tiny region became everything we see and was smoothed out; afterwards it grows again. Roughly 60 e-folds of growth are needed. Inflation is a hypothesis; competing ideas exist. Vertical axis is log₁₀.',
     [F('x<N ? -x/2.3026 : (x-2*N)/2.3026', 'comoving Hubble radius (relative)', 'accent')], x=[0, 'N+25'], y=['-N/2.3026-1', 1], xlabel='expansion (e-folds of growth)', ylabel='log₁₀ Hubble radius (relative)',
     vlines=[dict(x='N', label='inflation ends', color='gold')], params=[P('N', 'e-folds of inflation', 20, 70, 60)])
redo('observable_universe')
bars('observable_universe', 'Distance scales from the Earth to the observable universe; bar height is log₁₀ of the diameter in metres, so every step of 3 is a thousand times larger. The edge of what we can see is ~46 billion light-years away (radius), though more may lie beyond.',
     [('Earth', 7.1), ('Sun–Neptune', 12.95), ('nearest star', 16.6), ('Milky Way', 20.98), ('Virgo cl.', 23.7), ('observable', 26.9, 'gold')], ylabel='log₁₀ diameter (m)')
redo('arrow_of_time')
plot('arrow_of_time', 'Why time has a direction: the chance that N gas molecules all end up in one half of a box is 2⁻ᴺ (log₁₀ shown). For 100 molecules it is 10⁻³⁰, and for a mole it is effectively zero. Entropy rises because disordered states vastly outnumber ordered ones. Why the early universe was so ordered remains an open question.',
     [F('-0.30103*x', 'log₁₀ probability all in one half', 'accent')], x=[1, 100], y=[-32, 0], xlabel='number of molecules N', ylabel='log₁₀ probability', params=[P('n', 'molecules', 1, 100, 20, step=1)],
     points=[dict(x='n', y='-0.30103*n')], readouts=[R('probability', '2^-n')])
redo('quantum_computing')
plot('quantum_computing', "Grover's algorithm searches N items in about (π/4)√N steps instead of N/2. It is a quadratic, not exponential, speed-up; the big exponential gains (e.g. Shor's factoring) apply only to special problems. Axes are log₁₀. Useful large machines do not yet exist.",
     [F('x-0.301', 'classical (average N/2)', 'pink'), F('0.5*x-0.105', 'Grover quantum', 'accent')], x=[1, 12], y=[0, 12], xlabel='log₁₀ number of items N', ylabel='log₁₀ steps',
     params=[P('lg', 'log₁₀ N', 1, 12, 9)], points=[dict(x='lg', y='lg-0.301', color='pink'), dict(x='lg', y='0.5*lg-0.105', color='accent')],
     readouts=[R('classical steps', '10^lg/2'), R('Grover steps', '0.785*10^(lg/2)'), R('speed-up', '10^lg/2/(0.785*10^(lg/2))')])
redo('plasma_physics')
plot('plasma_physics', 'In a plasma, charges screen each other beyond the Debye length λ_D = 7430·√(T/n) m (T in eV, n in m⁻³). Plasma behaviour needs the system to be much bigger than this. Hot, thin plasmas (solar wind) have long λ_D; dense fusion plasmas are tiny. Axes are log₁₀.',
     [F('3.871+0.5*(lT-x)', 'Debye length', 'accent')], x=[6, 30], y=[-10, 8], xlabel='log₁₀ electron density (m⁻³)', ylabel='log₁₀ Debye length (m)',
     params=[P('lT', 'log₁₀ temperature (eV)', -1, 4, 1)], points=[dict(x=6.7, y=1.0, label='solar wind', color='gold'), dict(x=20, y=-4.13, label='tokamak', color='pink')])
S['telescopes_tech']['y'] = [1e-3, 1e5]
S['galaxies']['x'] = [20, 600]
S['planet_types']['x'] = [0.05, 1500]
S['solar_system_formation']['x'] = [0.3, 70]
S['quark_gluon_plasma']['x'] = [0, 1250]
redo('electric_motors')
plot('electric_motors', "A DC motor's torque falls linearly with speed (stall torque at 0 rpm, none at no-load speed), so mechanical power peaks at half speed. Curves are shown as a percentage of stall torque and of peak power; readouts give real values.",
     [F('100*(1-x/wn)', 'torque (% of stall)', 'accent'), F('400*(1-x/wn)*(x/wn)', 'power (% of peak)', 'gold')], x=[0, 3000], y=[0, 105], xlabel='speed (rpm)', ylabel='percent',
     params=[P('Ts', 'stall torque', 0.5, 5, 2, 'N·m'), P('wn', 'no-load speed', 1000, 3000, 2500, 'rpm')], readouts=[R('peak power', 'Ts*wn*0.10472/4', 'W'), R('peak power at', 'wn/2', 'rpm')])
redo('human_development')
hg = [(0, 50, 49), (1, 76, 74), (2, 87, 86), (4, 102, 100), (6, 116, 114), (8, 128, 127), (10, 139, 140), (12, 149, 152), (14, 163, 160), (16, 174, 162), (18, 176, 163)]
plot('human_development', 'Height at 50th percentile (typical boys and girls, approximate). Growth is fastest in infancy, slows, then spurts at puberty, earlier in girls. Development of the mind and body unfolds in these stages, with large normal variation.',
     [], x=[0, 19], y=[40, 190], xlabel='age (years)', ylabel='height (cm)', points=[dict(x=a, y=b, color='accent', r=3) for a, b, g in hg] + [dict(x=a, y=g, color='pink', r=3) for a, b, g in hg] + [dict(x=3, y=170, label='boys', color='accent', r=5), dict(x=3, y=155, label='girls', color='pink', r=5)])
