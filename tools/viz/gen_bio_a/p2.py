from lib import *
import math

# ===== CHEMISTRY OF LIFE (rest) =====
plot('bio_noncovalent_forces', 'Two atoms attract at long range (van der Waals) and repel when they overlap. The minimum is the stable contact distance; deeper wells mean stickier surfaces.',
     [F('4*eps*((3.4/x)^12-(3.4/x)^6)', 'Lennard-Jones', 'accent')], x=[3, 8], y=[-2.2, 2.5], xlabel='distance r (Å)', ylabel='energy (kJ/mol)',
     hlines=[dict(y=0, label='')], params=[P('eps', 'well depth ε', 0.2, 2, 1, 'kJ/mol')],
     readouts=[R('contact distance 2^(1/6)σ', '1.122*3.4', 'Å'), R('binding energy', '-eps', 'kJ/mol')])
plot('bio_water_properties', 'Liquid water is densest at about 4 °C, so ice floats and lakes freeze from the top down. Slide the temperature along the curve.',
     [F('999.975*(1-(x-3.983)^2*(x+301.797)/(522528.9*(x+69.349)))', 'density of water', 'accent')], x=[0, 25], y=[997, 1000.2],
     xlabel='temperature (°C)', ylabel='density (kg/m³)', vlines=[dict(x=3.98, label='4 °C')],
     points=[dict(x='T', y='999.975*(1-(T-3.983)^2*(T+301.797)/(522528.9*(T+69.349)))', color='gold')], params=[P('T', 'temperature', 0, 25, 10, '°C')],
     readouts=[R('density', '999.975*(1-(T-3.983)^2*(T+301.797)/(522528.9*(T+69.349)))', 'kg/m³')])
plot('bio_solutions_concentration', 'Osmotic pressure Π = i·c·R·T grows with the number of dissolved particles. At the same molarity NaCl (i = 2) pulls twice as hard as glucose.',
     [F('1*x*0.08206*Tk', 'glucose (i = 1)', 'accent'), F('2*x*0.08206*Tk', 'NaCl (i = 2)', 'gold'), F('3*x*0.08206*Tk', 'CaCl₂ (i = 3)', 'pink')],
     x=[0, 0.4], y=[0, 30], xlabel='concentration (mol/L)', ylabel='osmotic pressure Π (atm)', vlines=[dict(x=0.15, label='0.15 M saline')],
     params=[P('Tk', 'temperature', 273, 330, 310, 'K')], readouts=[R('Π of 0.15 M NaCl', '2*0.15*0.08206*Tk', 'atm'), R('same in kPa', '2*0.15*0.08206*Tk*101.3', 'kPa')])
plot('bio_acids_bases_ph', 'pH is −log₁₀[H⁺]: each unit is a tenfold change. Slide the pH and watch [H⁺] fall as [OH⁻] rises; they cross at pH 7 where both equal 10⁻⁷ M.',
     [F('10^(-x)', '[H⁺]', 'pink'), F('10^(x-14)', '[OH⁻]', 'accent')], x=[0, 14], y=[1e-14, 1], logy=True, xlabel='pH', ylabel='concentration (mol/L)',
     points=[dict(x=1.5, y='10^(-1.5)', label='stomach'), dict(x=7.4, y='10^(-7.4)', label='blood'), dict(x='pH', y='10^(-pH)', color='gold')],
     params=[P('pH', 'pH', 0, 14, 7.4, step=0.1)], readouts=[R('[H⁺]', '10^(-pH)', 'M'), R('[OH⁻]', '10^(pH-14)', 'M'), R('pOH', '14-pH')])
plot('bio_buffers', 'Around pH = pKa the curve is flat: a buffer works best within ±1 pH unit of its pKa. Change pKa to retune the buffer.',
     [F('pKa+log10(x/(1-x))', 'pH = pKa + log([A⁻]/[HA])', 'accent')], x=[0.02, 0.98], y=[0, 14], xlabel='fraction of acid converted to base [A⁻]/total', ylabel='pH',
     hlines=[dict(y='pKa', label='pKa')], vlines=[dict(x=0.5, label='half-neutralised')],
     points=[dict(x=0.1, y='pKa-1', color='pink'), dict(x=0.9, y='pKa+1', color='pink')], params=[P('pKa', 'pKa', 2, 12, 6.8, step=0.1)],
     readouts=[R('buffering range', 'pKa-1', 'pH'), R('up to', 'pKa+1', 'pH')])
plot('bio_mole_molarity', 'Diluting does not change the amount of solute: C₁V₁ = C₂V₂. Raise the final volume and the concentration drops as 1/V.',
     [F('C1*V1/x', 'C₂ after dilution', 'accent')], x=[5, 200], y=[0, 100], xlabel='final volume V₂ (mL)', ylabel='concentration C₂ (mM)',
     points=[dict(x='V2', y='C1*V1/V2', color='gold')],
     params=[P('C1', 'stock C₁', 10, 100, 100, 'mM'), P('V1', 'stock volume V₁', 1, 20, 5, 'mL'), P('V2', 'final volume V₂', 5, 200, 50, 'mL')],
     readouts=[R('C₂', 'C1*V1/V2', 'mM'), R('dilution factor', 'V2/V1', '×'), R('moles of solute', 'C1*V1/1000', 'µmol')])
plot('bio_reaction_equilibrium', 'A ⇌ B settles where forward and reverse rates match, at [B]/[A] = K = kf/kr. Change the rate constants and watch the plateau move.',
     [F('A0*(kr+kf*exp(-(kf+kr)*x))/(kf+kr)', '[A]', 'pink'), F('A0*kf*(1-exp(-(kf+kr)*x))/(kf+kr)', '[B]', 'accent')], x=[0, 10], y=[0, 1.05],
     xlabel='time (s)', ylabel='concentration (M)', params=[P('kf', 'forward k (1/s)', 0.1, 3, 1), P('kr', 'reverse k (1/s)', 0.1, 3, 0.5), P('A0', 'start [A]', 1, 1, 1)],
     readouts=[R('K = kf/kr', 'kf/kr'), R('ΔG°′ = −RT ln K (37 °C)', '-2.58*ln(kf/kr)', 'kJ/mol')])
S['bio_reaction_equilibrium']['params'].pop()
S['bio_reaction_equilibrium']['fns'][0]['f'] = '(kr+kf*exp(-(kf+kr)*x))/(kf+kr)'; S['bio_reaction_equilibrium']['fns'][1]['f'] = 'kf*(1-exp(-(kf+kr)*x))/(kf+kr)'
plot('bio_reaction_kinetics', 'Rate constants follow the Arrhenius law k ∝ exp(−Ea/RT). A bigger activation energy makes the reaction far more temperature-sensitive.',
     [F('exp(-Ea*1000/8.314*(1/(x+273.15)-1/310.15))', 'relative rate k(T)/k(37 °C)', 'accent')], x=[0, 60], y=[0, 12], xlabel='temperature (°C)', ylabel='relative rate',
     points=[dict(x=37, y=1, label='37 °C')], params=[P('Ea', 'activation energy', 20, 100, 50, 'kJ/mol')],
     readouts=[R('rate gain for +10 °C (Q10)', 'exp(Ea*1000/8.314*(1/310.15-1/320.15))', '×')])
blocks('bio_thermo_laws', 'Energy is conserved but spreads out: sunlight becomes chemical energy, work, and finally heat that raises the entropy of the surroundings.',
       [('s', 'Sunlight', 15, 12, 'gold'), ('p', 'Photosynthesis', 70, 12, 'green'), ('g', 'Glucose', 70, 50, 'accent'), ('w', 'Cell work', 15, 50, 'pink'),
        ('h', 'Heat (entropy up)', 45, 90, 'orange')],
       [('s', 'p', 'light'), ('p', 'g', 'chemical E'), ('g', 'w', 'ATP'), ('p', 'h', '', True), ('g', 'h', '', True), ('w', 'h', '', True)], aspect=0.6)
plot('bio_gibbs_free_energy', 'ΔG = ΔH − TΔS. A process that absorbs heat (ΔH > 0) can still go if it increases disorder enough: the line crosses zero at T = ΔH/ΔS.',
     [F('H-(x+273.15)*S/1000', 'ΔG (kJ/mol)', 'accent')], x=[0, 100], y=[-40, 40], xlabel='temperature (°C)', ylabel='ΔG (kJ/mol)', hlines=[dict(y=0, label='ΔG = 0')],
     params=[P('H', 'ΔH', -20, 80, 50, 'kJ/mol'), P('S', 'ΔS', 50, 300, 150, 'J/mol/K')],
     readouts=[R('ΔG at 37 °C', 'H-310.15*S/1000', 'kJ/mol'), R('crossover T = ΔH/ΔS', 'H*1000/S-273.15', '°C')])
plot('bio_redox_biology', 'ΔG°′ = −nFΔE°′: a bigger voltage drop between donor and acceptor releases more free energy per electron pair. Points show NADH and FADH₂ burning with O₂.',
     [F('-n*96.485*x', 'ΔG°′', 'accent')], x=[0, 1.3], y=[-320, 0], xlabel='ΔE°′ (V)', ylabel='ΔG°′ (kJ/mol)',
     points=[dict(x=1.14, y='-2*96.485*1.14', label='NADH→O₂'), dict(x=1.04, y='-2*96.485*1.04', label='FADH₂→O₂'), dict(x='dE', y='-n*96.485*dE', color='gold')],
     params=[P('dE', 'voltage drop ΔE°′', 0, 1.3, 1.14, 'V', 0.01), P('n', 'electrons n', 1, 4, 2, step=1)], readouts=[R('ΔG°′', '-n*96.485*dE', 'kJ/mol')])
plot('bio_atp_energy_coupling', 'ATP hydrolysis is more favourable in cells than in the test tube because ATP is kept far above equilibrium relative to ADP. Slide [Pi] or read the curve at ATP/ADP ≈ 10.',
     [F('-30.5+2.58*ln(Pi/1000/x)', 'ΔG of ATP hydrolysis', 'gold')], x=[0.1, 1000], logx=True, y=[-70, -20], xlabel='[ATP]/[ADP]', ylabel='ΔG (kJ/mol)',
     hlines=[dict(y=-30.5, label='standard ΔG°′')], vlines=[dict(x=10, label='typical cell')], params=[P('Pi', 'phosphate [Pi]', 1, 10, 5, 'mM')],
     readouts=[R('ΔG at ATP/ADP = 10', '-30.5+2.58*ln(Pi/1000/10)', 'kJ/mol')])
plot('bio_electrolytes_ions', 'The Nernst equation gives the voltage at which an ion is at equilibrium across a membrane: E = (61.5/z)·log([out]/[in]) at 37 °C. Vary the outside K⁺.',
     [F('61.5*log10(x/Kin)', 'E_K (mV)', 'accent')], x=[1, 150], logx=True, y=[-120, 20], xlabel='[K⁺] outside (mM)', ylabel='E_K (mV)',
     points=[dict(x=5, y='61.5*log10(5/Kin)', label='normal')], vlines=[dict(x=5, label='')], params=[P('Kin', 'K⁺ inside', 100, 160, 140, 'mM')],
     readouts=[R('E_K at 5 mM outside', '61.5*log10(5/Kin)', 'mV'), R('E_K at 8 mM (hyperkalaemia)', '61.5*log10(8/Kin)', 'mV')])
bars('bio_carbon_chemistry', 'Carbon forms four strong, stable bonds (to C, H, O, N), and multiple bonds get stronger but shorter. That strength makes long chains and rings possible.',
     [('C–C', 346, 'accent'), ('C=C', 614, 'accent'), ('C≡C', 839, 'accent'), ('C–H', 413, 'green'), ('C–O', 358, 'gold'), ('C–N', 305, 'pink'), ('O–H', 463, 'orange')], ylabel='bond energy (kJ/mol)', aspect=0.75)
blocks('bio_macromolecule_synthesis', 'Condensation joins monomers by removing water; hydrolysis splits polymers by adding it. Cells use the same bond with opposite enzymes.',
       [('m1', 'Monomer', 8, 20), ('m2', 'Monomer', 8, 80), ('d', 'Dimer', 50, 50, 'gold'), ('pol', 'Polymer', 90, 50, 'accent'), ('w', 'H₂O out', 50, 10, 'accent'), ('w2', 'H₂O in', 50, 90, 'pink')],
       [('m1', 'd', 'dehydration'), ('m2', 'd'), ('d', 'pol', 'repeat'), ('d', 'w'), ('w2', 'd', 'hydrolysis', True)], aspect=0.62)
table('bio_functional_groups', 'Seven groups account for most of the chemistry of life; the group, not the carbon skeleton, decides how a molecule behaves.',
      ['Group', 'Formula', 'Behaviour'],
      [['Hydroxyl', '–OH', 'polar, H-bonds'], ['Carbonyl', 'C=O', 'reactive, polar'], ['Carboxyl', '–COOH', 'acid, charged'], ['Amino', '–NH₂', 'base, charged'],
       ['Phosphate', '–OPO₃²⁻', 'energy, charge'], ['Sulfhydryl', '–SH', 'forms S–S bonds'], ['Methyl', '–CH₃', 'hydrophobic']], aspect=0.8)
tree('bio_isomers', 'Isomers share a formula but differ in connectivity (structural) or in 3D arrangement (stereo). Glucose and fructose are structural isomers.',
     [('i', 'Isomers'), ('st', 'Structural'), ('ss', 'Stereo'), ('ch', 'Chain'), ('po', 'Position'), ('fu', 'Group'), ('cis', 'cis/trans'), ('en', 'Mirror')],
     [('i', 'st'), ('i', 'ss'), ('st', 'ch'), ('st', 'po'), ('st', 'fu'), ('ss', 'cis'), ('ss', 'en')], aspect=0.75)
# chirality
chir = [L(0, -2.2, 0, 2.2, 'gold', 2, dash=True), T(0, 2.4, 'mirror', 'gold', 10, 'center'),
        C(-2.2, 0, 0.2, 'dim', 'dim'), C(2.2, 0, 0.2, 'dim', 'dim')]
cols_ = ['pink', 'accent', 'green']
for k in range(3):
    a = 90 + k * 120
    chir += [A(-2.2, 0, '-2.2+1.4*cos(rad(%d+th))' % a, '1.4*sin(rad(%d+th))' % a, cols_[k], 2),
             C('-2.2+1.4*cos(rad(%d+th))' % a, '1.4*sin(rad(%d+th))' % a, 0.28, cols_[k], cols_[k], alpha=0.8),
             A(2.2, 0, 2.2 + 1.4 * math.cos(math.radians(90 + 120 * (3 - k) % 360)) * 1.0, 1.4 * math.sin(math.radians(90 + 120 * ((3 - k) % 3))), cols_[k], 2),
             C(2.2 + 1.4 * math.cos(math.radians(90 + 120 * ((3 - k) % 3))), 1.4 * math.sin(math.radians(90 + 120 * ((3 - k) % 3))), 0.28, cols_[k], cols_[k], alpha=0.8)]
chir += [T(-2.2, -2.2, 'molecule', 'white', 10, 'center'), T(2.2, -2.2, 'mirror image', 'white', 10, 'center')]
geo('bio_chirality', 'Looking down from the fourth group, the left molecule goes pink→blue→green clockwise; its mirror image goes the other way. Rotate the left one: no angle matches the right.',
    [-4.2, 4.2, -2.7, 2.9], chir, params=[P('th', 'rotate left molecule', 0, 360, 0, '°', 1)], aspect=0.6)
bars('bio_fischer_cyclic_sugars', 'In water, glucose sits mostly in two ring forms that interconvert through the open chain (mutarotation); the reactive aldehyde form is vanishingly rare.',
     [('α-pyranose', 36, 'accent'), ('β-pyranose', 64, 'gold'), ('furanose', 0.5, 'green'), ('open chain', 0.002, 'pink')], logy=True, ylabel='% at equilibrium', aspect=0.7)
plot('bio_conformations', 'Rotating about a C–C bond changes the energy: staggered forms (anti, gauche) are low, eclipsed ones are high. Raise the barrier to see a stiffer bond.',
     [F('0.5*(7*(1+cos(rad(x)))-1.9*(1-cos(rad(2*x)))+V3*(1+cos(rad(3*x))))', 'butane C2–C3', 'accent')], x=[0, 360], y=[0, 24], xlabel='dihedral angle (°); 180° = anti', ylabel='energy (kJ/mol)',
     params=[P('V3', 'torsion barrier', 6, 16, 12, 'kJ/mol')], vlines=[dict(x=60, label='gauche'), dict(x=180, label='anti'), dict(x=300, label='gauche')])
plot('bio_acid_base_organic', 'A group is half-protonated at pH = pKa. Carboxylates (pKa ≈ 4.8) are charged at body pH, while amines (pKa ≈ 10.6) stay protonated.',
     [F('100/(1+10^(x-4.8))', 'COOH (still protonated)', 'accent'), F('100/(1+10^(x-6.8))', 'H₂PO₄⁻', 'gold'), F('100/(1+10^(x-10.6))', 'R–NH₃⁺', 'pink'),
      F('100/(1+10^(x-pK))', 'your group', 'white', True)], x=[0, 14], y=[0, 100], xlabel='pH', ylabel='% protonated', vlines=[dict(x=7.4, label='blood')],
     params=[P('pK', 'pKa of your group', 2, 13, 8, step=0.1)], readouts=[R('your group at pH 7.4', '100/(1+10^(7.4-pK))', '% protonated')])
nu = 'clamp(((t%6)-1)/3,0,1)'
geo('bio_nucleophile_electrophile', 'A nucleophile (electron-rich, Nu⁻) donates a pair to an electrophile (δ+ carbon); the curved arrow tracks the electrons, and the leaving group departs.',
    [-5, 5, -2.2, 2.2],
    [C(0, 0, 0.5, 'dim', 'dim', alpha=0.7), T(0, 0, 'C', 'white', 12), T(0, 0.9, 'δ+', 'accent', 11),
     C('-4+2.5*%s' % nu, 0, 0.45, 'pink', 'pink', alpha=0.8), T('-4+2.5*%s' % nu, 0, 'Nu⁻', 'white', 11),
     C('2.6+2.2*%s' % nu, 0, 0.45, 'gold', 'gold', alpha=0.8), T('2.6+2.2*%s' % nu, 0, 'X', 'white', 11),
     L('-4+2.5*%s+0.45' % nu, 0, -0.5, 0, 'pink', 2, when='%s>0.55' % nu), L(0.5, 0, '2.6+2.2*%s-0.45' % nu, 0, 'white', 2, when='%s<0.5' % nu),
     Cv('-2.7+3.3*s', '0.5+0.9*sin(pi*s)', [0, 1], 'pink', 2, dash=True),
     T(0, -1.7, 'Nu⁻ + R–X  →  R–Nu + X⁻  (SN2)', 'gold', 11)], aspect=0.45)
plot('bio_substitution_elimination', 'SN2 rate rises with nucleophile concentration, SN1 does not (its slow step is the leaving group alone). Slide the substrate concentration.',
     [F('k2*S*x', 'SN2: rate = k[R–X][Nu]', 'accent'), F('k1*S', 'SN1: rate = k[R–X]', 'pink')], x=[0, 2], y=[0, 4], xlabel='nucleophile concentration (M)', ylabel='rate (M/s ×10⁻³)',
     params=[P('S', '[R–X]', 0.2, 2, 1, 'M'), P('k1', 'k₁', 0.2, 2, 1), P('k2', 'k₂', 0.2, 2, 1.5)], readouts=[R('SN2 rate at 1 M Nu', 'k2*S*1'), R('SN1 rate', 'k1*S')])
blocks('bio_carbonyl_chemistry', 'A nucleophile attacks the δ+ carbonyl carbon; the intermediate either picks up a proton (addition, e.g. hemiacetal) or loses water (condensation, e.g. imine or aldol).',
       [('c', 'Carbonyl C=O', 18, 12, 'gold'), ('n', 'Nu attacks C', 75, 12), ('t', 'Tetrahedral int.', 50, 50, 'accent'), ('a', 'Addition product', 22, 88), ('d', 'Condensation', 78, 88, 'pink')],
       [('c', 'n'), ('n', 't'), ('t', 'a', '+H⁺'), ('t', 'd', '−H₂O')], aspect=0.7)
blocks('bio_acyl_substitution', 'The tetrahedral intermediate collapses by expelling the best leaving group, so reactive acyl groups (thioesters, anhydrides) can safely hand the acyl to a better-bound partner.',
       [('s', 'Acyl–X', 18, 12, 'gold'), ('nu', 'Nu attacks', 75, 12), ('ti', 'Tetrahedral C', 50, 50, 'accent'), ('p', 'Acyl–Nu', 22, 88, 'green'), ('lg', 'X⁻ leaves', 78, 88, 'pink')],
       [('s', 'nu'), ('nu', 'ti'), ('ti', 'p', 'collapse'), ('ti', 'lg')], aspect=0.7)
blocks('bio_phosphoryl_transfer', 'A kinase moves the terminal phosphate of ATP onto a target; a phosphatase takes it off. This on/off switch regulates much of the cell.',
       [('atp', 'ATP', 10, 20, 'gold'), ('k', 'Kinase', 40, 20, 'accent'), ('adp', 'ADP', 80, 20, 'gold'), ('p', 'Protein–OH', 17, 85), ('pp', 'Protein–P', 70, 85, 'pink'), ('pi', 'Pi', 88, 55)],
       [('atp', 'k'), ('k', 'adp'), ('p', 'pp', 'kinase'), ('pp', 'p', 'phosphatase', True), ('pp', 'pi', '', True)], aspect=0.7)
chain('bio_redox_organic', 'Each step up the ladder removes two hydrogens (or adds oxygen): the carbon oxidation state rises from −4 in methane to +4 in CO₂, releasing energy at each step.',
      ['CH₄ (−4)', 'CH₃OH (−2)', 'CH₂O (0)', 'HCOOH (+2)', 'CO₂ (+4)'], per_row=3, colors=['pink', 'pink', 'gold', 'accent', 'accent'], elabels=['−2H', '−2H', '+O', '−2H'], aspect=0.62)
bars('bio_resonance_aromatic', 'Resonance spreads electrons, so the peptide C–N and benzene C–C bonds are intermediate between single and double. That makes the peptide bond short, flat and rigid.',
     [('C–N', 147, 'accent'), ('peptide', 133, 'gold'), ('C=N', 127, 'accent'), ('C–C', 154, 'accent'), ('benzene', 139, 'gold'), ('C=C', 134, 'accent')], ylabel='bond length (pm)', aspect=0.75)
# NMR
def peaks():
    # ethanol 1H NMR: CH3 triplet 1.2 (3H), OH 2.6 (1H), CH2 quartet 3.7 (2H); J = 7 Hz; field B MHz
    terms = []
    lw = '(LW/B)'
    for c, n, w in [(1.2, 3, 3), (3.7, 4, 2)]:
        pass
    def mult(c, area, coefs):
        tot = sum(coefs); m = len(coefs)
        for k, co in enumerate(coefs):
            off = (k - (m - 1) / 2)
            terms.append('%s/(1+((x-%s-%s*7/B)/%s)^2)' % (round(area * co / tot, 4), c, off, lw))
    mult(1.2, 3, [1, 2, 1]); mult(2.6, 1, [1]); mult(3.7, 2, [1, 3, 3, 1])
    return '(' + '+'.join(terms) + ')'
plot('bio_spectroscopy_structure', 'In ¹H NMR the CH₃ triplet and CH₂ quartet of ethanol reveal neighbouring hydrogens (n + 1 rule). Higher field strength narrows each multiplet in ppm.',
     [F(peaks(), 'ethanol 1H NMR', 'accent')], x=[0.5, 4.5], y=[0, 2], xlabel='chemical shift δ (ppm)', ylabel='signal',
     params=[P('B', 'spectrometer', 60, 600, 60, 'MHz', 10), P('LW', 'line width', 1, 8, 3, 'Hz')], readouts=[R('splitting J = 7 Hz in ppm', '7/B', 'ppm')])
