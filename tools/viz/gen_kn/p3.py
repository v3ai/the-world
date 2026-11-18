from lib import *
import math

# ---------- NUCLEI ----------
def quark(x, y, lab, col): return [C(x, y, 0.32, col, col, alpha=0.35), T(x, y, lab, 'white', 12)]
geo('protons_neutrons', 'A proton is two up quarks and a down quark (charge ⅔+⅔−⅓ = +1); a neutron is one up and two down (⅔−⅓−⅓ = 0). Quarks make up only ~1% of the mass; the rest is the energy of the gluon field.',
    [-4, 4, -2, 2],
    [C(-2, 0, 1.4, 'red', alpha=0.3), C(2, 0, 1.4, 'dim', alpha=0.3)] +
    quark(-2.5, 0.3, 'u', 'accent') + quark(-1.5, 0.3, 'u', 'accent') + quark(-2, -0.55, 'd', 'pink') +
    quark(1.5, 0.3, 'd', 'pink') + quark(2.5, 0.3, 'd', 'pink') + quark(2, -0.55, 'u', 'accent') +
    [T(-2, 1.7, 'proton  uud   charge +1', 'red', 10), T(2, 1.7, 'neutron  udd   charge 0', 'dim', 10), T(0, -1.8, 'mass: p 938.27 MeV, n 939.57 MeV', 'gold', 10)], aspect=0.5)

plot('nuclear_force', 'The nuclear force (blue) is short-ranged but far stronger than the proton\'s electric repulsion (dashed) inside about 2–3 fm, so nuclei hold together; beyond that it dies away exponentially. A schematic potential.',
     [F('-c*exp(-x/1.4)/x+5000*exp(-6*x)', 'nuclear potential', 'accent'), F('1.44/x', 'Coulomb repulsion (p–p)', 'pink', dash=True)],
     x=[0.4, 6], y=[-60, 40], xlabel='separation (fm)', ylabel='potential energy (MeV)', params=[P('c', 'strength', 60, 160, 113)],
     readouts=[R('depth at 1 fm', '-c*exp(-1/1.4)+5000*exp(-6)', 'MeV'), R('Coulomb at 1 fm', '1.44', 'MeV')])

plot('nuclear_binding', 'Binding energy per nucleon peaks near iron (A ≈ 56). Fusion of light nuclei and fission of heavy ones both move toward it and release energy. The curve is the semi-empirical mass formula (approximate).',
     [F('(15.8*x-18.3*x^(2/3)-0.714*(x/(2+0.0153*x^(2/3))/2)^2*4/2*0+(-0.714*(x/(2+0.0153*x^(2/3)))^2/x^(1/3))-23.2*(x-2*x/(2+0.0153*x^(2/3)))^2/x)/x', 'formula', 'accent')],
     x=[8, 250], y=[0, 10], xlabel='mass number A', ylabel='binding energy per nucleon (MeV)',
     points=[dict(x=56, y=8.79, label='Fe-56', color='gold'), dict(x=4, y=7.07, label='He-4', color='pink'), dict(x=238, y=7.57, label='U-238', color='pink')])
Z = '(x/(2+0.0153*x^(2/3)))'
S['nuclear_binding']['fns'][0]['f'] = '(15.8*x-18.3*x^(2/3)-0.714*%s^2/x^(1/3)-23.2*(x-2*%s)^2/x)/x' % (Z, Z)
S['nuclear_binding']['params'] = [P('A', 'mass number A', 8, 250, 100, step=1)]
Za = '(A/(2+0.0153*A^(2/3)))'
S['nuclear_binding']['points'].append(dict(x='A', y='(15.8*A-18.3*A^(2/3)-0.714*%s^2/A^(1/3)-23.2*(A-2*%s)^2/A)/A' % (Za, Za), color='white'))
S['nuclear_binding']['readouts'] = [R('binding per nucleon (formula)', '(15.8*A-18.3*A^(2/3)-0.714*%s^2/A^(1/3)-23.2*(A-2*%s)^2/A)/A' % (Za, Za), 'MeV')]

plot('radioactivity', 'Each nucleus decays at random, but a large sample follows a smooth curve: the amount halves every half-life. Change the half-life and the time of observation.',
     [F('exp(-ln(2)*x/T)', 'fraction remaining', 'accent')], x=[0, 30], y=[0, 1.05], xlabel='time (days)', ylabel='fraction undecayed',
     params=[P('T', 'half-life', 1, 15, 5, 'days'), P('t0', 'time elapsed', 0, 30, 10, 'days')],
     points=[dict(x='t0', y='exp(-ln(2)*t0/T)', label='{100*exp(-ln(2)*t0/T)}% left')],
     readouts=[R('left after t', '100*exp(-ln(2)*t0/T)', '%'), R('half-lives elapsed', 't0/T')])

blocks('weak_force_note', 'Beta decay: a neutron turns into a proton by emitting a W⁻ boson, which becomes an electron and an antineutrino. The weak force is the only one that changes quark flavour.',
       [('n', 'neutron (udd)', 8, 50, 'accent'), ('p', 'proton (uud)', 52, 14, 'accent'), ('w', 'W⁻ boson', 50, 50, 'gold'), ('e', 'electron e⁻', 92, 38, 'green'), ('nu', 'antineutrino ν̄', 92, 82, 'green')],
       [('n', 'p', 'd → u'), ('n', 'w'), ('w', 'e'), ('w', 'nu')], aspect=0.6)

plot('radiometric_dating', 'Radioactive parent atoms (blue) turn into daughter atoms (pink) at a known rate, so the ratio gives the rock\'s age. U-238 (half-life 4.47 Gyr) dates the oldest rocks; Earth is about 4.5 Gyr old.',
     [F('exp(-ln(2)*x/T)', 'parent', 'accent'), F('1-exp(-ln(2)*x/T)', 'daughter', 'pink')], x=[0, 10], y=[0, 1.05], xlabel='age (Gyr)', ylabel='fraction of the original atoms',
     params=[P('T', 'half-life', 1, 15, 4.47, 'Gyr'), P('age', 'sample age', 0, 10, 4.5, 'Gyr')],
     points=[dict(x='age', y='1-exp(-ln(2)*age/T)', color='pink')],
     readouts=[R('daughter/parent ratio', '2^(age/T)-1')])

chain('fission_power', 'A neutron splits a U-235 nucleus into two fragments, releasing ~200 MeV and 2–3 more neutrons. If on average one or more go on to cause another fission (k ≥ 1) a chain reaction runs; reactors hold k at exactly 1.',
      ['n + U-235', 'U-236* (unstable)', 'Ba + Kr + 2–3 n', '≈200 MeV heat'], per_row=2, colors=['accent', 'accent', 'pink', 'gold'], loop=False)
del S['fission_power']
plot('fission_power', 'Neutron population per generation grows as kⁿ. Below k = 1 the chain dies out, at k = 1 it is steady (a reactor), above 1 it grows exponentially (a bomb). Control rods keep k at 1.',
     [F('k^x', 'neutron population', 'accent')], x=[0, 20], y=[0.01, 1000], logy=True, xlabel='generation', ylabel='relative neutron population',
     params=[P('k', 'multiplication factor k', 0.8, 1.3, 1.0, None)], readouts=[R('after 20 generations', 'k^20')])

plot('fusion_stars', 'Fusion rate climbs steeply with temperature. The proton–proton chain (∝T⁴) powers the Sun; the CNO cycle (∝T^18) takes over in somewhat hotter, more massive stars. Curves are approximate, normalised to the proton-proton rate at 15 million K.',
     [F('(x/15)^4', 'pp chain', 'accent'), F('0.01*(x/15)^18', 'CNO cycle', 'pink')], x=[5, 40], y=[1e-4, 1e5], logx=True, logy=True, xlabel='core temperature (million K)', ylabel='relative energy generation',
     vlines=[dict(x=15.7, label='Sun', color='gold')], params=[P('Tc', 'core T', 5, 40, 15.7, 'MK')], readouts=[R('pp rate vs Sun', '(Tc/15.7)^4'), R('CNO rate vs Sun', '(Tc/15.7)^18')])

# ---------- ATOMS ----------
def r_(): return 'hypot(x,y)+1e-6'
orb = 'k==1 ? exp(-2*%s)/pi : k==2 ? (2-%s)^2*exp(-%s)/(32*pi) : k==3 ? y^2*exp(-%s)/(32*pi) : (3*y^2-%s^2)^2*exp(-2*%s/3)/(39366*pi)' % ((r_(),) * 6)
add('quantum_orbitals', dict(type='heatmap', f=orb, x=[-12, 12], y=[-12, 12], equal=True,
    params=[P('k', 'orbital: 1 = 1s, 2 = 2s, 3 = 2p, 4 = 3d', 1, 4, 3, step=1)],
    readouts=[R('energy', '-13.6/(k==1 ? 1 : k<=3 ? 4 : 9)', 'eV')],
    caption='Where the hydrogen electron is likely to be found (bright = more likely). Axes are in Bohr radii. s orbitals are round, p and d orbitals have lobes; higher shells are bigger and have higher energy.'))

geo('atomic_spectra', 'Atoms emit only specific colours: a jump between levels releases a photon with exactly the energy difference. Choose the start and end levels; jumps down to n = 2 give the visible Balmer lines.',
    [-1, 6.5, -15, 1],
    [T(0.3, -13.6, 'n=1', 'dim', 10)] + [L(0.5, '-13.606/%d' % n, 3.5, '-13.606/%d' % n, 'white', 1.5) for n in range(1, 8)] +
    [T(4.1, '-13.606/%d' % n, 'n=%d' % n, 'dim', 10) for n in range(2, 8)] +
    [A(2, '-13.606/ni^2', 2, '-13.606/nf^2', 'gold', 3), T(5.4, -8, '{1239.84/(13.606*(1/nf^2-1/ni^2))} nm', 'gold', 11)],
    params=[P('ni', 'start level', 2, 7, 3, step=1), P('nf', 'end level', 1, 6, 2, step=1)],
    readouts=[R('photon wavelength', '1239.84/(13.606*abs(1/nf^2-1/ni^2))', 'nm'), R('photon energy', '13.606*abs(1/nf^2-1/ni^2)', 'eV')], equal=False, aspect=0.65)
S['atomic_spectra']['caption'] = 'Atoms emit only specific colours: a jump between levels releases a photon with exactly the energy difference. Set start above end for emission; Balmer lines (visible) end at n = 2, e.g. 3→2 is red at 656 nm.'
S['atomic_spectra']['params'] = [P('ni', 'start level', 3, 7, 3, step=1), P('nf', 'end level', 1, 2, 2, step=1)]

plot('light_scattering', 'Tiny air molecules scatter short wavelengths far more (∝ 1/λ⁴), so the sky is blue and sunsets are red. Larger droplets scatter all colours alike, which is why clouds are white. Slide the particle size.',
     [F('(550/x)^n', 'scattered light', 'accent')], x=[400, 700], y=[0, 5], xlabel='wavelength (nm)', ylabel='relative scattering',
     params=[P('n', 'size: 4 = molecules, 0 = droplets', 0, 4, 4)],
     vlines=[dict(x=450, label='blue', color='blue'), dict(x=650, label='red', color='red')], readouts=[R('blue / red scattering', '(650/450)^n')])

ie = [13.60, 24.59, 5.39, 9.32, 8.30, 11.26, 14.53, 13.62, 17.42, 21.56, 5.14, 7.65, 5.99, 8.15, 10.49, 10.36, 12.97, 15.76, 4.34, 6.11, 6.56, 6.83, 6.75, 6.77, 7.43, 7.90, 7.88, 7.64, 7.73, 9.39, 6.00, 7.90, 9.79, 9.75, 11.81, 14.00]
names = {1: 'H', 2: 'He', 3: 'Li', 10: 'Ne', 11: 'Na', 18: 'Ar', 19: 'K', 36: 'Kr'}
pts = []
for z, v in enumerate(ie, 1):
    d = dict(x=z, y=v, r=3, color='pink' if z in (2, 10, 18, 36) else ('gold' if z in (3, 11, 19) else 'accent'))
    if z in names: d['label'] = names[z]
    pts.append(d)
plot('periodic_table', 'First ionisation energy (energy to remove one electron) repeats with atomic number: noble gases (pink) are peaks, alkali metals (gold) are valleys. That periodic pattern is the periodic table.',
     [], x=[0, 37], y=[0, 26], xlabel='atomic number Z', ylabel='ionisation energy (eV)', points=pts)

bars('optical_clocks', 'Clock precision (fractional frequency uncertainty, lower is better; approximate). Optical lattice clocks are now so stable they are used to test whether physical constants change over time.',
     [('quartz', 1e-6), ('rubidium', 1e-11), ('caesium fountain', 1e-16), ('strontium optical', 2e-18, 'gold')], logy=True, ylabel='fractional uncertainty')

blocks('antihydrogen', 'Antihydrogen is made by trapping antiprotons and positrons together. Lasers then probe its 1S–2S transition; it matches ordinary hydrogen to about 2 parts in 10¹², the strictest matter–antimatter symmetry test of its kind.',
       [('pb', 'Antiprotons\n(accelerator)', 10, 15, 'pink'), ('e', 'Positrons\n(source)', 10, 85, 'pink'), ('t', 'Magnetic trap', 48, 50), ('h', 'Antihydrogen', 82, 22, 'gold'), ('s', 'Laser spectroscopy', 82, 82, 'accent')],
       [('pb', 't'), ('e', 't'), ('t', 'h', 'combine'), ('h', 's')], aspect=0.62)
S['antihydrogen']['nodes'][0]['label'] = 'Antiprotons'; S['antihydrogen']['nodes'][1]['label'] = 'Positrons'

# ---------- CHEMISTRY ----------
plot('chemical_bonding', 'A covalent bond sits at the minimum of the potential energy curve, where attraction and repulsion balance (Morse model, H₂-like). Stretching beyond the minimum breaks the bond; the well depth is the bond energy.',
     [F('De*(1-exp(-1.94*(x-0.74)))^2-De', 'bond potential', 'accent')], x=[0.4, 3], y=[-5, 3], xlabel='distance between nuclei (Å)', ylabel='energy (eV)',
     params=[P('De', 'bond energy', 1, 6, 4.5, 'eV')], points=[dict(x=0.74, y='-De', label='bond length 0.74 Å')],
     readouts=[R('bond energy', 'De*96.485', 'kJ/mol')])

geo('molecular_shapes', 'Electron pairs around an atom repel and spread out. Four pairs make a tetrahedron (CH₄, 109.5°); each lone pair squeezes the bond angle (NH₃ 107°, H₂O 104.5°), shown in this flat sketch.',
    [-3, 3, -2.6, 2.6],
    [C(0, 0, 0.35, 'gold', 'gold', alpha=0.6), T(0, 0, 'X', 'white', 11),
     L(0, 0, '1.6*sin(rad(109.5-2.5*n)/2)', '-1.6*cos(rad(109.5-2.5*n)/2)', 'white', 2), L(0, 0, '-1.6*sin(rad(109.5-2.5*n)/2)', '-1.6*cos(rad(109.5-2.5*n)/2)', 'white', 2),
     C('1.6*sin(rad(109.5-2.5*n)/2)', '-1.6*cos(rad(109.5-2.5*n)/2)', 0.25, 'accent', 'accent', alpha=0.7), C('-1.6*sin(rad(109.5-2.5*n)/2)', '-1.6*cos(rad(109.5-2.5*n)/2)', 0.25, 'accent', 'accent', alpha=0.7),
     L(0, 0, 1.3, 1.1, 'white', 2, when='n<1'), C(1.3, 1.1, 0.25, 'accent', 'accent', alpha=0.7, when='n<1'),
     L(0, 0, -1.3, 1.1, 'white', 2, when='n<2'), C(-1.3, 1.1, 0.25, 'accent', 'accent', alpha=0.7, when='n<2'),
     C(1.1, 0.9, 0.5, 'pink', 'pink', alpha=0.35, when='n>=2'), C(-1.1, 0.9, 0.5, 'pink', 'pink', alpha=0.35, when='n>=1'),
     T(1.1, 0.9, '••', 'pink', 12, when='n>=2'), T(-1.1, 0.9, '••', 'pink', 12, when='n>=1'),
     T(0, -2.3, 'bond angle {109.5-2.5*n}°', 'gold', 12)],
    params=[P('n', 'lone pairs on centre atom', 0, 2, 0, step=1)], readouts=[R('bond angle', '109.5-2.5*n', '°')], aspect=0.62)
S['molecular_shapes']['shapes'][-4]['x'] = -1.1; 
S['molecular_shapes']['shapes'][-6]['x'] = 1.1; 
# the lone-pair cloud shapes: n>=2 shows right, n>=1 shows left
bars('intermolecular_forces', 'Boiling points of the group-16 hydrides. Water is far out of line: hydrogen bonds between molecules hold it together, so it boils ~170 K higher than the trend of its heavier cousins would suggest.',
     [('H₂O', 373, 'pink'), ('H₂S', 213), ('H₂Se', 232), ('H₂Te', 271)], ylabel='boiling point (K)')

plot('liquid_water_properties', 'Water is densest at about 4 °C, not at its freezing point, and ice (917 kg/m³) is lighter still, so ice floats and lakes freeze from the top down. Slide the temperature.',
     [F('999.975*(1-((x-3.983)^2*(x+301.797))/(522528.9*(x+69.349)))', 'liquid water density', 'accent')], x=[0, 30], y=[995, 1000.5], xlabel='temperature (°C)', ylabel='density (kg/m³)',
     params=[P('T', 'temperature', 0, 30, 10, '°C')], vlines=[dict(x=3.98, label='max at 4 °C', color='gold')],
     points=[dict(x='T', y='999.975*(1-((T-3.983)^2*(T+301.797))/(522528.9*(T+69.349)))')],
     readouts=[R('density', '999.975*(1-((T-3.983)^2*(T+301.797))/(522528.9*(T+69.349)))', 'kg/m³')])

plot('states_of_matter', 'Ideal-gas isotherms: pressure p = nRT/V. Squeeze the gas to half the volume and the pressure doubles (Boyle); heat it and the whole curve lifts. 1 mole shown.',
     [F('8.314*T/x', 'p(V)', 'accent')], x=[5, 50], y=[0, 500], xlabel='volume (L)', ylabel='pressure (kPa)',
     params=[P('T', 'temperature', 200, 600, 300, 'K'), P('V', 'volume', 5, 50, 24.5, 'L')],
     points=[dict(x='V', y='8.314*T/V', label='{8.314*T/V} kPa')], readouts=[R('pressure', '8.314*T/V', 'kPa'), R('pressure in atm', '8.314*T/V/101.325', 'atm')])

bars('gas_air_properties', 'Dry air is mostly nitrogen and oxygen; argon is the third most common. Carbon dioxide, the gas driving climate change, is just 0.04% (about 420 parts per million).',
     [('nitrogen', 78.08), ('oxygen', 20.95, 'green'), ('argon', 0.93), ('CO₂', 0.042, 'pink')], logy=True, ylabel='percent of air by volume')

plot('chemistry_solutions', 'Solubility (grams per 100 g of water) versus temperature: a few salts such as KNO₃ dissolve far more when hot, while common salt barely changes. That is why you can grow crystals by cooling a hot solution. Curves are fits to textbook data.',
     [F('13.3+0.3*x+0.0204*x^2', 'KNO₃', 'pink'), F('35.7+0.04*x', 'NaCl', 'accent')], x=[0, 100], y=[0, 260], xlabel='temperature (°C)', ylabel='solubility (g / 100 g water)',
     params=[P('T', 'temperature', 0, 100, 40, '°C')], points=[dict(x='T', y='13.3+0.3*T+0.0204*T^2', color='pink'), dict(x='T', y='35.7+0.04*T')],
     readouts=[R('KNO₃ dissolves', '13.3+0.3*T+0.0204*T^2', 'g'), R('NaCl dissolves', '35.7+0.04*T', 'g')])

plot('thermochemistry', 'The energy profile of a reaction: reactants climb a barrier (activation energy) then fall to the products. Exothermic reactions end lower (ΔH < 0, heat released); endothermic ones end higher.',
     [F('dH/(1+exp(-2.5*(x-5)))+80*exp(-((x-4.5)/1.2)^2)', 'energy', 'accent')], x=[0, 10], y=[-220, 150], xlabel='reaction progress', ylabel='enthalpy (kJ/mol)',
     params=[P('dH', 'enthalpy change ΔH', -200, 100, -100, 'kJ/mol')], hlines=[dict(y=0, label='reactants')],
     readouts=[R('ΔH', 'dH', 'kJ/mol'), R('barrier from reactants ≈', '80+max(0,dH)*0.5', 'kJ/mol')])

plot('chemistry_gibbs', 'A reaction is spontaneous when ΔG = ΔH − TΔS is negative. Entropy gains (ΔS > 0) win at high temperature; the line crosses zero at T = ΔH/ΔS. Try ΔH > 0 with ΔS > 0: it only goes when hot.',
     [F('dH-x*dS/1000', 'ΔG(T)', 'accent')], x=[0, 1000], y=[-300, 300], xlabel='temperature (K)', ylabel='ΔG (kJ/mol)', hlines=[dict(y=0, label='spontaneous below this')],
     params=[P('dH', 'ΔH', -100, 200, 50, 'kJ/mol'), P('dS', 'ΔS', -200, 300, 150, 'J/mol·K')],
     readouts=[R('switch temperature ΔH/ΔS', 'dH/dS*1000', 'K'), R('ΔG at 298 K', 'dH-298*dS/1000', 'kJ/mol')])

plot('chemistry_equilibrium', 'A weak acid HA is part ionised: at pH = pKa half is HA and half is A⁻. Lower the pH and HA wins; raise it and A⁻ does. Acetic acid has pKa 4.76; ammonium has 9.25.',
     [F('1/(1+10^(x-pKa))', 'acid form HA', 'accent'), F('1/(1+10^(pKa-x))', 'base form A⁻', 'pink')], x=[0, 14], y=[0, 1.05], xlabel='pH', ylabel='fraction',
     params=[P('pKa', 'pKa', 2, 12, 4.76)], vlines=[dict(x='pKa', label='pKa', color='gold')])

plot('reaction_kinetics', 'Rate constant k ∝ e^(−Eₐ/RT): reactions speed up strongly with temperature, and a catalyst lowers Eₐ so the same reaction runs much faster. Rates are relative to the uncatalysed rate at 298 K.',
     [F('exp(-(Ea*1000)/(8.314*x)+Ea*1000/(8.314*298))', 'no catalyst', 'accent'), F('exp(-((Ea-dEa)*1000)/(8.314*x)+Ea*1000/(8.314*298))', 'with catalyst', 'pink')],
     x=[250, 500], y=[0.001, 1e12], logy=True, xlabel='temperature (K)', ylabel='relative rate',
     params=[P('Ea', 'activation energy Eₐ', 40, 100, 70, 'kJ/mol'), P('dEa', 'catalyst lowers Eₐ by', 0, 40, 20, 'kJ/mol')],
     readouts=[R('catalyst speed-up at 298 K', 'exp(dEa*1000/(8.314*298))')])

plot('electrochemistry', 'The Nernst equation: a cell voltage falls as the reaction quotient Q rises, E = E° − (0.0592/n)·log₁₀Q. Reactants-rich (small Q) cells give more than E°; products pile up and the voltage fades to zero at equilibrium. Daniell cell: E° = 1.10 V.',
     [F('E0-0.05916/n*log10(x)', 'cell voltage', 'accent')], x=[1e-4, 1e4], y=[0.9, 1.3], logx=True, xlabel='reaction quotient Q', ylabel='cell voltage (V)',
     params=[P('E0', 'standard voltage E°', 0.5, 1.5, 1.1, 'V'), P('n', 'electrons n', 1, 4, 2, step=1)], hlines=[dict(y='E0', label='E°')],
     readouts=[R('voltage at Q = 100', 'E0-0.05916/n*2', 'V')])

chain('organic_functional_groups', 'The carbon backbone stays; the functional group at the end sets the chemistry. Oxidation steps an alkane through alcohol and aldehyde up to a carboxylic acid (here C₂).',
      ['Ethane  CH₃–CH₃', 'Ethanol  CH₃–CH₂OH', 'Acetaldehyde  CH₃–CHO', 'Acetic acid  CH₃–COOH'], per_row=2, colors=['dim', 'accent', 'gold', 'pink'], elabels=['+O', '−2H', '+O'])

geo('stereochemistry_chirality', 'Left- and right-handed molecules are mirror images that cannot be rotated onto each other, like your hands. Turn the left one: however you rotate it, the colours never line up with the right.',
    [-5, 5, -2.5, 2.5],
    [L(0, -2.4, 0, 2.4, 'dim', 1, dash=True), T(-2.5, -2.3, 'left-handed', 'accent', 10), T(2.5, -2.3, 'right-handed', 'pink', 10),
     C(-2.5, 0, 0.3, 'white', 'white', alpha=0.6), C(2.5, 0, 0.3, 'white', 'white', alpha=0.6)] +
    sum([[L(-2.5, 0, '-2.5+1.5*cos(rad(%d)+th)' % a, '1.5*sin(rad(%d)+th)' % a, 'white', 1.5), C('-2.5+1.5*cos(rad(%d)+th)' % a, '1.5*sin(rad(%d)+th)' % a, 0.28, c, c, alpha=0.8),
          L(2.5, 0, '2.5+1.5*cos(rad(%d))' % b, '1.5*sin(rad(%d))' % b, 'white', 1.5), C('2.5+1.5*cos(rad(%d))' % b, '1.5*sin(rad(%d))' % b, 0.28, c, c, alpha=0.8)]
         for a, b, c in [(90, 90, 'red'), (-30, 210, 'accent'), (210, -30, 'green')]], []),
    params=[P('th', 'rotate left molecule', 0, 6.283, 0)], aspect=0.5)

add('spectroscopy_methods', dict(type='plot', x=[500, 4000], y=[0, 1.1],
    fns=[dict(f='c*(0.95*exp(-((x-1715)/45)^2)+0.5*exp(-((x-2950)/60)^2)+0.6*exp(-((x-3350)/230)^2))', label='absorption of an acid-like molecule', color='accent')],
    xlabel='wavenumber (cm⁻¹)', ylabel='absorbance', params=[P('c', 'concentration', 0.2, 1.1, 1)],
    vlines=[dict(x=1715, label='C=O', color='gold'), dict(x=3350, label='O–H', color='pink')],
    readouts=[R('transmitted at C=O peak (Beer–Lambert)', '100*10^(-0.95*c)', '%')],
    caption='Each bond vibrates at a characteristic frequency, so an infrared spectrum acts as a fingerprint: C=O near 1715 cm⁻¹, O–H broad near 3350. More sample makes the peaks taller (Beer–Lambert).'))

plot('polymers_chem', 'A polymer is a chain of repeated units. The fraction of chains with n units is (1−p)p^(n−1); pushing the reaction closer to complete (p → 1) gives much longer chains, average 1/(1−p).',
     [F('(1-p)*p^(x-1)', 'fraction of chains of length n', 'accent')], x=[1, 200], xlabel='chain length n', ylabel='fraction', params=[P('p', 'reaction conversion p', 0.9, 0.995, 0.97)],
     readouts=[R('average chain length 1/(1−p)', '1/(1-p)')])

geo('inorganic_coordination', 'In a metal complex with six ligands the d-orbitals split into a lower and an upper set, by Δ. For d⁶ (Fe²⁺): if Δ is bigger than the pairing energy P the electrons crowd into the low set (low spin, no unpaired electrons); otherwise they spread out (high spin).',
    [-2.5, 2.5, -0.6, 3.2],
    [L(-1.6, 0, -0.8, 0, 'white', 2), L(-0.4, 0, 0.4, 0, 'white', 2), L(0.8, 0, 1.6, 0, 'white', 2),
     L(-0.9, 'dl/100', -0.1, 'dl/100', 'gold', 2), L(0.1, 'dl/100', 0.9, 'dl/100', 'gold', 2),
     T(-2.2, 0, 't₂g', 'dim', 10), T(-2.2, 'dl/100', 'e_g', 'dim', 10),
     A(2, 0, 2, 'dl/100-0.1', 'gold', 2), T(2.25, 'dl/200', 'Δ', 'gold', 12),
     A(-1.3, -0.3, -1.3, 0.4, 'accent', 3), A(-0.9, 0.4, -0.9, -0.3, 'pink', 3), A(0, -0.3, 0, 0.4, 'accent', 3), A(0.4, 0.4, 0.4, -0.3, 'pink', 3), A(1.2, -0.3, 1.2, 0.4, 'accent', 3), A(1.6, 0.4, 1.6, -0.3, 'pink', 3, when='dl>P'),
     A(-1.3 + 0.0, -0.3, -1.3, 0.4, 'accent', 3, when='0'),
     A(-0.5, 'dl/100-0.3', -0.5, 'dl/100+0.4', 'accent', 3, when='dl<=P'), A(0.5, 'dl/100-0.3', 0.5, 'dl/100+0.4', 'accent', 3, when='dl<=P'),
     T(0, 3, '{dl>P ? 0 : 4} unpaired electrons', 'gold', 11)],
    params=[P('dl', 'splitting Δ (water ≈ 124, CN⁻ ≈ 400)', 100, 400, 124, 'kJ/mol'), P('P', 'pairing energy P', 200, 300, 250, 'kJ/mol')],
    readouts=[R('unpaired electrons', 'dl>P ? 0 : 4')], equal=False, aspect=0.65)
sh = S['inorganic_coordination']['shapes']
# arrows: t2g six electrons only if low spin; high spin: 4 in t2g (3 up + 1 down) & 2 up in eg
S['inorganic_coordination']['shapes'] = [s for s in sh if s.get('when') != '0']
for s in S['inorganic_coordination']['shapes']:
    if s.get('k') == 'arrow' and s.get('x1') in (-0.9, 0.4) and s.get('when') is None: s['when'] = 'dl>P'
# first down-arrow (orbital 1) always present for high spin (4th electron) -> set orbital-1 down arrow unconditional
for s in S['inorganic_coordination']['shapes']:
    if s.get('k') == 'arrow' and s.get('x1') == -0.9: s.pop('when', None)

chain('haber_bosch', 'The Haber–Bosch process makes ammonia from N₂ and H₂ over an iron catalyst at ~400–500 °C and 150–300 atm. Unreacted gas is recycled. About half the nitrogen in your body passed through this industrial process.',
      ['N₂ + 3H₂', 'Iron catalyst, 450 °C, 200 atm', '2 NH₃ mixture', 'Condense out NH₃'], per_row=2, colors=['accent', 'gold', 'accent', 'pink'], loop=False)
S['haber_bosch']['edges'].append({'from': 'n3', 'to': 'n0', 'label': 'recycle', 'dashed': True})

plot('computational_chemistry', 'Cost of electronic-structure methods grows steeply with system size N: DFT roughly N³, coupled-cluster CCSD(T) N⁷. Set your computing budget and see how large a molecule each method can reach.',
     [F('x^3', 'DFT ~N³', 'accent'), F('x^5', 'MP2 ~N⁵', 'gold'), F('x^7', 'CCSD(T) ~N⁷', 'pink')], x=[10, 1000], y=[100, 1e21], logx=True, logy=True, xlabel='size N (basis functions)', ylabel='operations',
     params=[P('lb', 'budget: log₁₀(operations)', 9, 18, 15, None)], hlines=[dict(y='10^lb', label='budget', color='white')],
     readouts=[R('largest N, DFT', '10^(lb/3)'), R('largest N, CCSD(T)', '10^(lb/7)')])
