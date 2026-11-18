from lib import *
import math

# ===== BIOCHEMISTRY =====
hx = lambda a, r=1.5: (round(r * math.cos(math.radians(a)), 3), round(r * math.sin(math.radians(a)), 3))
ring = [hx(a) for a in (0, -60, -120, 180, 120, 60)]  # C1,C2,C3,C4,C5,O
sh = [Pg([list(p) for p in ring], 'accent', 'accent', 0.12, 2)]
for nm, (px, py) in zip(['C1', 'C2', 'C3', 'C4', 'C5'], ring[:5]):
    sh.append(T(px * 0.72, py * 0.72, nm, 'dim', 9, 'center'))
sh += [T(ring[5][0], ring[5][1] + 0.0, 'O', 'red', 12, 'center'),
       L(ring[1][0], ring[1][1], 0.9, -2.2, 'white', 2), T(0.9, -2.5, 'OH', 'white', 11, 'center'),
       L(ring[2][0], ring[2][1], -0.9, -2.2, 'white', 2), T(-0.9, -2.5, 'OH', 'white', 11, 'center'),
       L(ring[3][0], ring[3][1], -2.4, -0.6, 'white', 2), T(-2.8, -0.7, 'OH', 'white', 11, 'center'),
       L(ring[4][0], ring[4][1], -1.4, 2.3, 'white', 2), T(-1.4, 2.6, 'CH₂OH', 'gold', 11, 'center'),
       L(ring[0][0], ring[0][1], 2.3, -0.9, 'pink', 3, when='an<0.5'), T(2.7, -1.0, 'OH', 'pink', 12, 'center', when='an<0.5'),
       L(ring[0][0], ring[0][1], 2.3, 0.9, 'pink', 3, when='an>=0.5'), T(2.7, 1.0, 'OH', 'pink', 12, 'center', when='an>=0.5'),
       T(0, 3.3, '{an<0.5 ? "α" : "β"}-D-glucopyranose', 'gold', 12, 'center')]
sh[-1]['text'] = 'anomer at C1: OH down = α, OH up = β'
geo('bio_monosaccharides', 'Glucose closes into a six-membered ring; the new OH on C1 can point down (α) or up (β). Flip the slider to switch anomers.',
    [-3.4, 3.4, -3.0, 3.6], sh, params=[P('an', 'C1 hydroxyl (0 = α, 1 = β)', 0, 1, 0, step=1)], readouts=[R('formula', '6', 'C  (C₆H₁₂O₆)'), R('anomer', 'an', '(0 = α)')], aspect=0.85)
S['bio_monosaccharides']['readouts'] = [R('carbons', '6')]
chain('bio_disaccharides', 'Each disaccharide is two sugars joined by a glycosidic bond with loss of water: maltose (α1→4), lactose (β1→4), sucrose (α1→β2).',
      ['Glc + Glc', 'maltose', 'Glc + Gal', 'lactose', 'Glc + Fru', 'sucrose'], per_row=2, colors=['accent', 'gold', 'accent', 'gold', 'accent', 'gold'], elabels=['α1→4, −H₂O', '', 'β1→4, −H₂O', '', 'α1→β2, −H₂O'], aspect=0.9, flow=True)
S['bio_disaccharides']['edges'] = [e for e in S['bio_disaccharides']['edges'] if (e['from'], e['to']) in (('n0', 'n1'), ('n2', 'n3'), ('n4', 'n5'))]
for n_, y_ in zip(S['bio_disaccharides']['nodes'], [15, 15, 50, 50, 85, 85]):
    n_['y'] = y_
for n_, x_ in zip(S['bio_disaccharides']['nodes'], [25, 75, 25, 75, 25, 75]):
    n_['x'] = x_
table('bio_polysaccharides', 'Same monomer, different bond: α-1,4 chains coil into energy stores, while β-1,4 chains lie straight and H-bond into tough fibres.',
      ['Polymer', 'Bond / branching', 'Role'],
      [['Amylose', 'α1→4, none', 'plant store'], ['Amylopectin', 'α1→4, α1→6 / 25', 'plant store'], ['Glycogen', 'α1→4, α1→6 / 10', 'animal store'], ['Cellulose', 'β1→4, straight', 'plant wall'], ['Chitin', 'β1→4 GlcNAc', 'fungus / insect']], aspect=0.7)
blocks('bio_glycoconjugates', 'Sugar chains on proteins and lipids form the glycocalyx, the cell\'s outer coat; the ABO blood groups are simply different glycolipid sugars.',
       [('gc', 'Glycocalyx', 50, 12, 'gold'), ('gp', 'Glycoprotein', 15, 50), ('pg', 'Proteoglycan', 50, 50), ('gl', 'Glycolipid', 85, 50), ('f1', 'Recognition', 15, 88, 'pink'), ('f2', 'Hydration', 50, 88, 'pink'), ('f3', 'Blood groups', 85, 88, 'pink')],
       [('gc', 'gp'), ('gc', 'pg'), ('gc', 'gl'), ('gp', 'f1'), ('pg', 'f2'), ('gl', 'f3')], flow=False, aspect=0.75)
bars('bio_fatty_acids_fats', 'Fat packs about twice the energy per gram of carbohydrate or protein because its carbons are more reduced and carry almost no water.',
     [('fat', 37, 'gold'), ('ethanol', 29, 'pink'), ('protein', 17, 'accent'), ('carb', 17, 'green')], ylabel='energy density (kJ/g)', aspect=0.7)
lip = []
for k in range(8):
    xk = -3.5 + k
    lip += [C('%s+0.12*sin(t*1.5+%d)' % (xk, k), '1.6+0.08*sin(t*2+%d)' % k, 0.38, 'gold', 'gold', alpha=0.8),
            L(xk - 0.12, 1.25, xk - 0.12, 0.1, 'white', 2), L(xk + 0.12, 1.25, xk + 0.12, 0.1, 'white', 2),
            C('%s+0.12*sin(t*1.5+%d+2)' % (xk + 0.5, k), '-1.6+0.08*sin(t*2+%d)' % k, 0.38, 'accent', 'accent', alpha=0.8),
            L(xk + 0.38, -1.25, xk + 0.38, -0.1, 'white', 2), L(xk + 0.62, -1.25, xk + 0.62, -0.1, 'white', 2)]
lip += [T(-4.2, 2.3, 'water', 'accent', 10), T(-4.2, 0, 'hydrophobic core', 'white', 10), T(-4.2, -2.3, 'water', 'accent', 10), T(3.5, 2.3, 'hydrophilic heads', 'gold', 10, 'right')]
geo('bio_membrane_lipids', 'Phospholipids have a polar head (circle) and two nonpolar tails (lines); in water they self-assemble into a bilayer with tails hidden inside. Watch the heads jiggle.',
    [-4.5, 4.5, -2.8, 2.8], lip, aspect=0.6)
chain('bio_steroids_terpenoids', 'All of these are built from five-carbon isoprene units; cholesterol is made via mevalonate, and statins block the step that commits carbon to it.',
      ['Acetyl-CoA', 'HMG-CoA', 'Mevalonate', 'IPP (C5)', 'Squalene (C30)', 'Cholesterol'], per_row=3, colors=['accent', 'gold', 'gold', 'green', 'green', 'pink'],
      elabels=['', 'HMG-CoA reductase (statins)', '', '', ''], aspect=0.6)
plot('bio_amino_acids', 'Amino acids carry charge that depends on pH. Net charge is zero at the pI (≈ 6.0 for glycine); acidic residues push it down, lysine pushes it up.',
     [F('-1/(1+10^(2.34-x))+1/(1+10^(x-9.6))', 'glycine', 'accent'), F('-1/(1+10^(2.19-x))-1/(1+10^(3.65-x))+1/(1+10^(x-9.6))', 'aspartate', 'pink'), F('-1/(1+10^(2.18-x))+1/(1+10^(x-8.95))+1/(1+10^(x-10.53))', 'lysine', 'gold')],
     x=[0, 14], y=[-2.2, 2.2], xlabel='pH', ylabel='net charge', hlines=[dict(y=0, label='')], params=[P('pH', 'pH', 0, 14, 7.4, step=0.1)],
     readouts=[R('glycine charge', '-1/(1+10^(2.34-pH))+1/(1+10^(pH-9.6))'), R('lysine charge', '-1/(1+10^(2.18-pH))+1/(1+10^(pH-8.95))+1/(1+10^(pH-10.53))'), R('glycine pI', '(2.34+9.6)/2')],
     points=[dict(x='pH', y='-1/(1+10^(2.34-pH))+1/(1+10^(pH-9.6))', color='white')])
pep = [L(-4, 0, -2, 0.8, 'white', 2), L(-2, 0.8, 0, 0, 'white', 2), L(0, 0, 2, 0.8, 'white', 2), L(2, 0.8, 4, 0, 'white', 2)]
for xx, lab, col in [(-4, 'N', 'accent'), (-2, 'Cα', 'white'), (0, 'N', 'accent'), (2, 'Cα', 'white'), (4, 'C', 'gold')]:
    pass
pep = [Pg([[-2, 0.8], [-1, -0.2], [0, 0.8], [1, -0.2]], 'dim', 'gold', 0.12, 1),
       L(-4, -0.2, -3, 0.8, 'white', 2), L(-3, 0.8, -2, -0.2, 'white', 2), L(-2, -0.2, -1, 0.8, 'white', 2), L(-1, 0.8, 0, -0.2, 'white', 2), L(0, -0.2, 1, 0.8, 'white', 2), L(1, 0.8, 2, -0.2, 'white', 2),
       T(-4, -0.6, 'H₃N⁺', 'accent', 10, 'center'), T(-3, 1.2, 'Cα', 'white', 10, 'center'), T(-2, -0.6, 'C', 'gold', 10, 'center'), T(-1, 1.2, 'N', 'accent', 10, 'center'),
       T(0, -0.6, 'Cα', 'white', 10, 'center'), T(1, 1.2, 'C', 'gold', 10, 'center'), T(2, -0.6, 'N', 'accent', 10, 'center'),
       T(-2.5, 2.2, 'peptide bond (rigid, planar)', 'gold', 10, 'center'), L(-2, -0.2, -1, 0.8, 'gold', 4),
       T(-3, -1.8, 'R₁', 'pink', 11, 'center'), L(-3, 0.8, -3, -1.3, 'pink', 1, dash=True), T(0, -1.8, 'R₂', 'pink', 11, 'center'), L(0, -0.2, 0, -1.3, 'pink', 1, dash=True),
       T(3.5, 0.4, '…→ C-term', 'dim', 10, 'center')]
geo('bio_peptide_bond', 'The peptide bond (gold) has partial double-bond character, so six atoms stay in one plane. Slide n to see how length grows the sequence space (20ⁿ chains).',
    [-4.8, 4.8, -2.4, 2.8], pep, params=[P('n', 'residues n', 2, 30, 10, step=1)],
    readouts=[R('peptide bonds', 'n-1'), R('mass', '0.11*n', 'kDa'), R('possible sequences', '20^n')], aspect=0.55)
S['bio_peptide_bond']['readouts'][2] = R('log₁₀(sequences)', 'n*log10(20)')
# protein structure
ps = [T(-2.4, 2.6, 'α-helix', 'accent', 11, 'center'), T(2.4, 2.6, 'β-sheet', 'gold', 11, 'center'),
      Cv('-3.2+0.9*sin(s+t)', 's*0.35-2', [0, 12], 'accent', 3), Cv('-1.6+0.9*sin(s+t+pi)', 's*0.35-2', [0, 12], 'accent', 1, dash=True),
      T(-2.4, -2.6, '3.6 residues / turn,  5.4 Å pitch', 'dim', 9, 'center'), T(2.4, -2.6, 'strands 3.3 Å per residue', 'dim', 9, 'center')]
for k in range(3):
    yy = -1.2 + 1.2 * k
    ps += [A(1.0, yy, 3.8, yy, 'gold', 4), T(0.3, yy, '↑' if k % 2 == 0 else '↓', 'dim', 10, 'center')]
ps += [L(1.6, -1.0, 1.6, 0.0, 'pink', 1, dash=True), L(2.4, -1.0, 2.4, 0.0, 'pink', 1, dash=True), L(3.2, -1.0, 3.2, 0.0, 'pink', 1, dash=True), L(1.6, 0.2, 1.6, 1.2, 'pink', 1, dash=True), L(2.4, 0.2, 2.4, 1.2, 'pink', 1, dash=True), L(3.2, 0.2, 3.2, 1.2, 'pink', 1, dash=True)]
ps = [x for x in ps if x.get('text') not in ('↑', '↓')]
geo('bio_protein_structure', 'Secondary structure comes from backbone hydrogen bonds: helix (i to i+4, left) and β-strands side by side (dashed, right). Primary is the sequence; tertiary and quaternary fold and assemble these.',
    [-4.5, 4.5, -3.0, 3.0], ps, aspect=0.7)
plot('bio_protein_folding', 'In urea a protein unfolds sharply, like a two-state switch. A more stable protein (bigger ΔG) needs more denaturant to reach the 50% midpoint.',
     [F('100/(1+exp(-(dG-m*x)/2.58))', 'folded (%)', 'accent')], x=[0, 10], y=[0, 100], xlabel='urea (M)', ylabel='folded protein (%)',
     params=[P('dG', 'stability ΔG(H₂O)', 10, 60, 30, 'kJ/mol'), P('m', 'm-value', 4, 12, 8, 'kJ/mol/M')], vlines=[dict(x='dG/m', label='midpoint')],
     readouts=[R('midpoint Cm = ΔG/m', 'dG/m', 'M urea')])
blocks('bio_chaperones_proteostasis', 'Chaperones give nascent chains a second chance to fold; proteins that still fail are tagged for destruction, otherwise they aggregate.',
       [('n', 'New chain', 8, 25), ('u', 'Unfolded', 38, 25, 'pink'), ('c', 'Chaperone', 22, 78, 'accent'), ('f', 'Native protein', 85, 25, 'green'), ('m', 'Misfolded', 55, 55, 'pink'), ('d', 'Degraded', 85, 78, 'gold'), ('a', 'Aggregate', 50, 95, 'orange')],
       [('n', 'u'), ('u', 'f', 'folds'), ('u', 'c', 'binds'), ('c', 'u', 'releases', True), ('u', 'm', '', True), ('m', 'd', 'Ub tag'), ('m', 'a', 'if not cleared', True)], aspect=0.7)
chain('bio_ubiquitin_proteasome', 'E1, E2 and E3 enzymes attach a chain of ubiquitin to a target; the 26S proteasome recognises the chain, unfolds the protein and chops it into peptides.',
      ['E1 activate', 'E2 carry', 'E3 select', 'poly-Ub tag', '26S proteasome', 'peptides + Ub'], per_row=3, colors=['accent', 'accent', 'accent', 'gold', 'pink', 'green'], aspect=0.6)
plot('bio_hemoglobin_cooperativity', 'Hemoglobin binds O₂ cooperatively (Hill n ≈ 2.8), giving an S-shaped curve: it loads in the lungs and unloads in tissues. Raise P50 to mimic the Bohr effect.',
     [F('100*x^n/(P50^n+x^n)', 'hemoglobin', 'pink'), F('100*x/(2.8+x)', 'myoglobin', 'accent', True)], x=[0, 100], y=[0, 100], xlabel='pO₂ (mmHg)', ylabel='O₂ saturation (%)',
     vlines=[dict(x=100, label='lungs'), dict(x=40, label='tissue')], params=[P('n', 'Hill coefficient n', 1, 3.5, 2.8, step=0.1), P('P50', 'P50', 15, 40, 26, 'mmHg')],
     readouts=[R('saturation in lungs', '100*100^n/(P50^n+100^n)', '%'), R('saturation in tissue', '100*40^n/(P50^n+40^n)', '%'), R('O₂ delivered', '100*100^n/(P50^n+100^n)-100*40^n/(P50^n+40^n)', '%')])
bars('bio_protein_analysis', 'Each purification step removes other proteins, raising the specific activity (activity per mg protein) by orders of magnitude.',
     [('crude', 1, 'dim'), ('(NH₄)₂SO₄', 4, 'accent'), ('ion exch.', 20, 'accent'), ('size excl.', 90, 'gold'), ('affinity', 800, 'green')], logy=True, ylabel='fold purification', aspect=0.7)
chain('bio_nucleotides', 'A nucleotide is base + sugar + phosphate; the phosphodiester bond joins the 3′ OH of one sugar to the 5′ phosphate of the next, giving the chain direction.',
      ['Base', '+ Sugar', 'Nucleoside', '+ Phosphate', 'Nucleotide', 'Polynucleotide'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'green', 'pink'], aspect=0.6)
bars('bio_rna_types', 'Most RNA in a cell is ribosomal RNA; the messenger RNAs that code for proteins are only a few percent of the total.',
     [('rRNA', 80, 'accent'), ('tRNA', 15, 'gold'), ('mRNA', 4, 'pink'), ('other', 1, 'green')], ylabel='% of cellular RNA', aspect=0.7)
# enzyme catalysis energy profile
prof = lambda ea: '(-dg*0.5*(1+tanh((x-5)*1.0)) + %s*exp(-((x-5)/1.4)^2))' % ea
plot('bio_enzyme_catalysis', 'An enzyme does not change the reactant or product energies; it lowers the activation barrier by stabilising the transition state. Slide ΔΔG‡ to see the rate gain.',
     [F('-dg*0.5*(1+tanh((x-5)*1.0)) + Ea*exp(-((x-5)/1.4)^2)', 'uncatalysed', 'pink'),
      F('-dg*0.5*(1+tanh((x-5)*1.0)) + (Ea-dd)*exp(-((x-5)/1.4)^2) - 12*exp(-((x-2.7)/0.8)^2)', 'enzyme-catalysed', 'accent')],
     x=[0, 10], y=[-60, 110], xlabel='reaction coordinate  (S → ES → TS → EP → P)', ylabel='free energy (kJ/mol)',
     params=[P('Ea', 'uncatalysed barrier', 60, 110, 90, 'kJ/mol'), P('dd', 'barrier lowering ΔΔG‡', 10, 70, 50, 'kJ/mol'), P('dg', 'ΔG of reaction', 0, 40, 20, 'kJ/mol')],
     readouts=[R('rate enhancement', 'exp(dd*1000/(8.314*310))', '×'), R('orders of magnitude', 'dd*1000/(8.314*310)/2.303')])
ind = lambda f: '%s' % f
geo('bio_active_site_induced_fit', 'The substrate does not just fit a rigid lock: binding makes the enzyme close around it (induced fit). Slide to bring the substrate in.',
    [-4, 4, -3, 3],
    [C(0, '1.9-0.9*f', 1.25, 'accent', 'accent', alpha=0.3), C(0, '-1.9+0.9*f', 1.25, 'accent', 'accent', alpha=0.3),
     C(0, 0, 2.7, 'accent', width=2), T(0, 2.75, 'enzyme', 'accent', 11, 'center'),
     Pg([['-3.5+3.5*f', 0.4], ['-3.0+3.5*f', 0], ['-3.5+3.5*f', -0.4], ['-2.8+3.5*f', -0.45], ['-2.7+3.5*f', 0.45]], 'gold', 'gold', 0.9),
     T(0, -2.8, 'ES complex: pocket closed around S', 'gold', 10, 'center', when='f>0.9'), T(0, -2.8, 'substrate approaching', 'dim', 10, 'center', when='f<=0.9')],
    params=[P('f', 'substrate binding', 0, 1, 0.1, step=0.01)], readouts=[R('pocket gap', '0.8-0.9*f*0.8', 'rel.')], aspect=0.6)
S['bio_active_site_induced_fit']['readouts'] = [R('induced fit', '100*f', '% closed')]
table('bio_cofactors_coenzymes', 'Many coenzymes are made from vitamins, so a vitamin deficiency stops the enzymes that need them. Each coenzyme shuttles one kind of chemical group.',
      ['Coenzyme', 'Vitamin', 'Carries'],
      [['NAD⁺ / NADH', 'niacin (B3)', 'H⁻ (hydride)'], ['FAD', 'riboflavin (B2)', '2 H'], ['Coenzyme A', 'pantothenate (B5)', 'acyl groups'], ['TPP', 'thiamine (B1)', 'aldehydes'], ['Biotin', 'biotin (B7)', 'CO₂'], ['PLP', 'pyridoxine (B6)', 'amino groups'], ['THF', 'folate (B9)', 'one-carbon units']], aspect=0.8)
plot('bio_michaelis_menten', 'Rate rises with substrate and levels off at Vmax; Km is the substrate level giving half of Vmax. Move both sliders and see which feature shifts.',
     [F('Vmax*x/(Km+x)', 'v = Vmax[S]/(Km+[S])', 'accent')], x=[0, 100], y=[0, 110], xlabel='[S] (µM)', ylabel='rate v (µmol/min)',
     hlines=[dict(y='Vmax/2', label='Vmax/2'), dict(y='Vmax', label='Vmax')], vlines=[dict(x='Km', label='Km')],
     params=[P('Vmax', 'Vmax', 20, 100, 80, 'µmol/min'), P('Km', 'Km', 2, 60, 15, 'µM')], readouts=[R('v at [S] = Km', 'Vmax/2', 'µmol/min'), R('v at [S] = 10 Km', 'Vmax*10/11', 'µmol/min')])
plot('bio_lineweaver_burk', 'Plotting 1/v against 1/[S] straightens the Michaelis–Menten curve: the y-intercept is 1/Vmax and the x-intercept is −1/Km. Change them and watch the intercepts move.',
     [F('Km/Vmax*x+1/Vmax', '1/v = (Km/Vmax)(1/[S]) + 1/Vmax', 'accent')], x=[-0.3, 1.0], y=[0, 0.25], xlabel='1/[S] (1/µM)', ylabel='1/v (min/µmol)',
     points=[dict(x=0, y='1/Vmax', label='1/Vmax'), dict(x='-1/Km', y=0, label='−1/Km')], vlines=[dict(x=0, label='')],
     params=[P('Vmax', 'Vmax', 20, 100, 80, 'µmol/min'), P('Km', 'Km', 3, 30, 15, 'µM')], readouts=[R('slope Km/Vmax', 'Km/Vmax'), R('1/Vmax', '1/Vmax')])
plot('bio_enzyme_inhibition', 'Competitive inhibitors raise apparent Km (Vmax unchanged); non-competitive ones lower Vmax; uncompetitive ones lower both. Slide [I] and compare each curve to the control.',
     [F('80*x/(15+x)', 'no inhibitor', 'white'), F('80*x/(15*(1+I/Ki)+x)', 'competitive', 'gold'), F('80/(1+I/Ki)*x/(15+x)', 'non-competitive', 'pink'), F('80/(1+I/Ki)*x/(15/(1+I/Ki)+x)', 'uncompetitive', 'green')],
     x=[0, 150], y=[0, 90], xlabel='[S] (µM)', ylabel='rate v (µmol/min)', params=[P('I', 'inhibitor [I]', 0, 40, 10, 'µM'), P('Ki', 'Ki', 2, 40, 10, 'µM')],
     readouts=[R('competitive Km,app', '15*(1+I/Ki)', 'µM'), R('non-comp. Vmax,app', '80/(1+I/Ki)', 'µmol/min')])
plot('bio_allostery', 'Allosteric enzymes give an S-shaped rate curve. An activator (ATP here) shifts it left, an inhibitor (CTP) shifts it right, so small changes in substrate act like a switch.',
     [F('100*x^n/(K^n+x^n)', 'no effector', 'white'), F('100*x^n/((K*0.5)^n+x^n)', '+ activator', 'green'), F('100*x^n/((K*2)^n+x^n)', '+ inhibitor', 'pink')],
     x=[0, 40], y=[0, 100], xlabel='[substrate] (mM)', ylabel='rate (% Vmax)', params=[P('n', 'cooperativity n', 1, 4, 3, step=0.1), P('K', 'K0.5', 4, 20, 10, 'mM')],
     readouts=[R('rate at [S] = K0.5', '50', '% Vmax'), R('shifts to', 'K*0.5', 'mM with activator')])
plot('bio_enzyme_conditions', 'Rate climbs with temperature until the protein starts to unfold, then crashes, so each enzyme has an optimum. Slide the melting temperature to compare a human and a heat-loving enzyme.',
     [F('exp(-Ea*1000/8.314*(1/(x+273.15)-1/(Topt-12+273.15)))/(1+exp((x-Tm)/2.5))*0.3', 'relative activity', 'accent')], x=[0, 100], y=[0, 1.1], xlabel='temperature (°C)', ylabel='relative activity',
     params=[P('Tm', 'unfolding midpoint', 40, 90, 50, '°C'), P('Ea', 'activation energy', 30, 80, 50, 'kJ/mol'), P('Topt', 'scale ref.', 37, 37, 37)], vlines=[dict(x=37, label='body 37 °C')])
S['bio_enzyme_conditions']['params'].pop()
S['bio_enzyme_conditions']['fns'][0]['f'] = 'exp(-Ea*1000/8.314*(1/(x+273.15)-1/(Tm-10+273.15)))*0.8/(1+exp((x-Tm)/2.5))'
S['bio_enzyme_conditions']['readouts'] = [R('rate at 37 °C vs at Tm−10', 'exp(-Ea*1000/8.314*(1/310.15-1/(Tm-10+273.15)))/(1+exp((37-Tm)/2.5))')]
blocks('bio_covalent_regulation', 'Two covalent switches: cutting an inactive zymogen once turns it on for good, while phosphorylation flips an enzyme on and off reversibly.',
       [('z', 'Zymogen (inactive)', 15, 15), ('a', 'Active enzyme', 80, 15, 'green'), ('e0', 'Enzyme (off)', 15, 75), ('e1', 'Enzyme–P (on)', 80, 75, 'gold')],
       [('z', 'a', 'proteolytic cut'), ('e0', 'e1', 'kinase + ATP'), ('e1', 'e0', 'phosphatase', True)], aspect=0.6)
blocks('bio_metabolism_overview', 'Catabolism breaks big molecules down to release ATP and building blocks; anabolism spends ATP and reducing power to build them back up.',
       [('p', 'Polymers', 12, 15), ('m', 'Monomers', 12, 50), ('a', 'Acetyl-CoA', 12, 85, 'gold'), ('c', 'CO₂ + H₂O', 80, 85, 'pink'), ('t', 'ATP', 50, 50, 'accent'), ('b', 'Biosynthesis', 80, 15, 'green')],
       [('p', 'm', 'catabolism'), ('m', 'a'), ('a', 'c', 'Krebs + ETC'), ('c', 't', '', True), ('t', 'b', 'powers'), ('m', 'b', 'anabolism', True)], aspect=0.7)
chain('bio_glycolysis', 'Glycolysis spends 2 ATP early (priming) and earns 4 later, netting 2 ATP and 2 NADH per glucose. Change the number of glucose molecules.',
      ['Glucose', 'G6P', 'F6P', 'F1,6BP', 'G3P ×2', '1,3-BPG', '3-PG', 'PEP', 'Pyruvate ×2'], per_row=3, colors=['accent', 'dim', 'dim', 'gold', 'gold', 'pink', 'pink', 'green', 'green'],
      elabels=['−ATP', '', '−ATP (PFK-1)', '', '+NADH', '+ATP', '', '+ATP (PK)'], aspect=0.85,
      params=[P('g', 'glucose molecules', 1, 10, 1, step=1)], readouts=[R('net ATP', '2*g'), R('NADH', '2*g'), R('pyruvate', '2*g')])
blocks('bio_fermentation', 'Without oxygen NADH must be recycled to NAD⁺ so glycolysis can continue: animals make lactate, yeast make ethanol and CO₂. Only 2 ATP per glucose result.',
       [('g', 'Glucose', 8, 50), ('p', 'Pyruvate', 38, 50, 'gold'), ('l', 'Lactate', 85, 15, 'pink'), ('e', 'Ethanol + CO₂', 85, 85, 'green'), ('a', '2 ATP', 38, 90, 'accent')],
       [('g', 'p', 'glycolysis'), ('p', 'l', 'NADH → NAD⁺'), ('p', 'e', 'NADH → NAD⁺'), ('g', 'a', '', True)], aspect=0.6)
blocks('bio_pyruvate_oxidation', 'The pyruvate dehydrogenase complex links glycolysis to the citric acid cycle: one carbon leaves as CO₂ and the rest becomes acetyl-CoA, making NADH.',
       [('py', 'Pyruvate (C3)', 10, 50), ('pdh', 'PDH complex', 45, 50, 'gold'), ('ac', 'Acetyl-CoA (C2)', 88, 20, 'green'), ('co', 'CO₂', 88, 50, 'pink'), ('nd', 'NADH', 88, 80, 'accent')],
       [('py', 'pdh'), ('pdh', 'ac'), ('pdh', 'co'), ('pdh', 'nd')], aspect=0.55)
kc = [('a', 'Acetyl-CoA', 12, 10, 'gold'), ('c', 'Citrate', 50, 12), ('i', 'Isocitrate', 85, 25), ('k', 'α-KG', 90, 58), ('s', 'Succinyl-CoA', 80, 88), ('u', 'Succinate', 48, 92), ('f', 'Fumarate', 14, 80), ('m', 'Malate', 8, 52), ('o', 'OAA', 12, 30)]
blocks('bio_krebs_cycle', 'Each turn of the cycle oxidises one acetyl group to 2 CO₂, making 3 NADH, 1 FADH₂ and 1 GTP (ATP). Oxaloacetate is regenerated, so the cycle can repeat.',
       [nd(*n) for n in kc[1:]] + [nd('a', 'Acetyl-CoA', 30, 3, 'gold')],
       [('a', 'c'), ('c', 'i'), ('i', 'k', 'CO₂, NADH'), ('k', 's', 'CO₂, NADH'), ('s', 'u', 'GTP'), ('u', 'f', 'FADH₂'), ('f', 'm'), ('m', 'o', 'NADH'), ('o', 'c')], aspect=0.95)
S['bio_krebs_cycle']['nodes'] = [n for n in S['bio_krebs_cycle']['nodes'] if n['id'] != 'a'] + [nd('a', 'Acetyl-CoA', 28, 4, 'gold')]
S['bio_krebs_cycle']['nodes'][-1]['y'] = 4
S['bio_krebs_cycle']['edges'][0] = {'from': 'a', 'to': 'c'}
for n_ in S['bio_krebs_cycle']['nodes']:
    if n_['id'] == 'c': n_['x'], n_['y'] = 55, 15
    if n_['id'] == 'o': n_['x'], n_['y'] = 14, 32
blocks('bio_electron_transport_chain', 'NADH and FADH₂ hand electrons down a series of carriers to O₂; complexes I, III and IV use the energy to pump protons (4, 4 and 2 H⁺) across the inner mitochondrial membrane.',
       [('nadh', 'NADH', 12, 10, 'accent'), ('c1', 'CI: 4H⁺', 50, 10, 'gold'), ('q', 'Q', 88, 10), ('fad', 'FADH₂ (CII)', 82, 35, 'accent'), ('c3', 'CIII: 4H⁺', 50, 60, 'gold'), ('cc', 'Cyt c', 14, 60), ('c4', 'CIV: 2H⁺', 50, 90, 'gold'), ('o2', 'O₂ → H₂O', 86, 90, 'pink')],
       [('nadh', 'c1'), ('c1', 'q'), ('fad', 'q'), ('q', 'c3'), ('c3', 'cc'), ('cc', 'c4'), ('c4', 'o2')], aspect=0.75)
pm = '(180+59*dpH)'
geo('bio_chemiosmosis_atp_synthase', 'Protons flow back through ATP synthase and spin its rotor, which squeezes out ATP (about 3 per full turn). A larger proton-motive force spins it faster.',
    [-4, 4, -3.2, 3.2],
    [Rc(-4, -0.45, 8, 0.9, 'gold', 'gold', 0.25), T(-3.9, 0.0, 'inner membrane', 'gold', 9),
     T(3.9, 2.6, 'H⁺ high (intermembrane)', 'pink', 9, 'right'), T(3.9, -2.8, 'H⁺ low (matrix)', 'accent', 9, 'right'),
     Rc(-0.9, -0.45, 1.8, 0.9, 'white', 'white', 0.5), C(0, -1.4, 0.9, 'accent', 'accent', alpha=0.35), T(1.3, -1.4, 'F₁', 'accent', 11),
     A(0, 0, '1.4*cos(%s*t*0.8)' % ('dpH'), '1.4*sin(%s*t*0.8)*0+0.0' % ('dpH'), 'pink', 0),
     L(0, -0.4, '0.7*cos(dpH*t*3)', '-1.4+0.7*sin(dpH*t*3)', 'gold', 4), C('0.7*cos(dpH*t*3)', '-1.4+0.7*sin(dpH*t*3)', 0.14, 'gold', 'gold')]
    + [C('-0.5+0.2*%d*0+0.1*sin(t*3+%d)' % (k, k), '2.4-3.8*((t*(0.5+0.5*dpH)+%s)%%1)' % (k / 6), 0.1, 'pink', 'pink') for k in range(6)]
    + [T(-3.5, -2.0, 'ADP + Pi  →  ATP', 'green', 10)],
    params=[P('dpH', 'ΔpH (matrix more basic)', 0.3, 1.5, 0.8, step=0.05), P('dpsi', 'membrane potential Δψ', 120, 180, 160, 'mV')],
    readouts=[R('proton-motive force', 'dpsi+59*dpH', 'mV'), R('ΔG per H⁺ (about)', '0.0965*(dpsi+59*dpH)', 'kJ/mol')], aspect=0.8)
S['bio_chemiosmosis_atp_synthase']['shapes'] = [x for x in S['bio_chemiosmosis_atp_synthase']['shapes'] if x.get('k') != 'arrow']
chain('bio_beta_oxidation', 'Each round of four steps shortens the fatty acid by two carbons, releasing acetyl-CoA, FADH₂ and NADH. Longer chains give far more ATP than glucose.',
      ['Acyl-CoA', 'FAD → FADH₂', 'Hydration', 'NAD⁺ → NADH', 'Thiolysis', 'Acetyl-CoA'], per_row=3, colors=['gold', 'accent', 'dim', 'accent', 'dim', 'green'], loop=True,
      params=[P('n', 'fatty acid carbons', 8, 24, 16, step=2)],
      readouts=[R('rounds', 'n/2-1'), R('acetyl-CoA', 'n/2'), R('net ATP (2.5/1.5/10)', '(n/2-1)*4+n/2*10-2')], aspect=0.65)
chain('bio_gluconeogenesis', 'Gluconeogenesis reverses glycolysis but bypasses its three irreversible steps with different enzymes (pyruvate carboxylase, PEPCK, FBPase-1, G6Pase). It costs 6 ATP-equivalents per glucose.',
      ['Pyruvate', 'OAA', 'PEP', 'F1,6BP', 'F6P', 'G6P', 'Glucose'], per_row=4, colors=['gold', 'pink', 'pink', 'dim', 'pink', 'dim', 'green'],
      elabels=['PC (+CO₂)', 'PEPCK', 'reverse', 'FBPase-1', 'reverse', 'G6Pase'], aspect=0.65)
blocks('bio_pentose_phosphate_pathway', 'The oxidative branch turns glucose-6-phosphate into ribulose-5-P, making 2 NADPH and a CO₂; the rest either gives ribose for nucleotides or recycles into glycolysis.',
       [('g', 'G6P', 10, 20, 'accent'), ('p', '6-P-gluconate', 45, 20), ('r', 'Ru5P', 85, 20, 'gold'), ('n', 'NADPH ×2', 30, 60, 'pink'), ('rb', 'R5P (ribose)', 85, 60, 'green'), ('gl', 'F6P + G3P', 70, 90, 'accent')],
       [('g', 'p', 'G6PDH'), ('p', 'r', 'CO₂'), ('g', 'n', '', True), ('r', 'rb'), ('r', 'gl')], aspect=0.65)
blocks('bio_amino_acid_catabolism', 'Amino groups are moved to α-ketoglutarate, then released as ammonium; the liver\'s urea cycle turns toxic NH₄⁺ into urea, using aspartate as a second nitrogen donor.',
       [('aa', 'Amino acid', 12, 10), ('g', 'Glutamate', 50, 10, 'gold'), ('nh', 'NH₄⁺', 86, 10, 'pink'), ('o', 'Ornithine', 14, 85), ('c', 'Citrulline', 14, 50), ('as', 'Arg-succinate', 58, 50), ('ar', 'Arginine', 58, 85), ('u', 'Urea', 90, 68, 'green')],
       [('aa', 'g', 'transamination'), ('g', 'nh'), ('nh', 'c', 'carbamoyl-P'), ('o', 'c'), ('c', 'as', '+Asp'), ('as', 'ar'), ('ar', 'u'), ('ar', 'o', '', True)], aspect=0.7)
chain('bio_fatty_acid_synthesis', 'Fatty acid synthase adds two carbons per cycle, starting from malonyl-CoA and spending 2 NADPH each time; seven cycles make 16-carbon palmitate.',
      ['Acetyl-CoA', 'Citrate shuttle', 'Malonyl-CoA', 'FAS cycles', 'Palmitate'], per_row=3, colors=['gold', 'dim', 'pink', 'accent', 'green'],
      params=[P('n', 'FAS cycles', 1, 7, 7, step=1)], readouts=[R('chain length', '2+2*n', 'carbons'), R('NADPH used', '2*n')], aspect=0.6)
blocks('bio_photosynthesis_overview', 'Light reactions in the thylakoid make ATP and NADPH and release O₂; the Calvin cycle in the stroma uses them to fix CO₂ into sugar.',
       [('l', 'Light + H₂O', 16, 10, 'gold'), ('lr', 'Light reactions', 52, 10, 'green'), ('o', 'O₂', 90, 10, 'pink'), ('at', 'ATP + NADPH', 52, 50, 'accent'), ('c', 'CO₂', 16, 90), ('cc', 'Calvin cycle', 52, 90, 'green'), ('s', 'Sugar (G3P)', 88, 90, 'gold')],
       [('l', 'lr'), ('lr', 'o'), ('lr', 'at'), ('at', 'cc'), ('c', 'cc'), ('cc', 's')], aspect=0.65)
zp = [(0, 1.0), (0.12, -0.8), (0.3, -0.1), (0.45, 0.1), (0.55, 0.45), (0.66, -1.2), (0.8, -0.43), (1.0, -0.32)]
zpts = [[round(2 * 0.0 + 8 * a, 3), b] for a, b in zp]
zpath = [(a * 10 - 0, b) for a, b in zp]
geo('bio_light_reactions', 'Light lifts electrons to a high energy twice (the Z-scheme): photosystem II then I. Between the two the electron falls and its energy pumps protons; at the end it reduces NADP⁺ to NADPH.',
    [-1, 11, -1.6, 1.4],
    [Pg([[a, b] for a, b in zpath], 'accent', None, None, 3, closed=False),
     T(0.0, 1.15, 'P680', 'white', 10, 'center'), T(1.2, -1.0, 'P680*', 'gold', 10, 'center'), T(3, -0.3, 'PQ', 'white', 10, 'center'), T(4.5, 0.3, 'b6f', 'white', 10, 'center'),
     T(5.5, 0.7, 'P700', 'white', 10, 'center'), T(6.6, -1.4, 'P700*', 'gold', 10, 'center'), T(8, -0.65, 'Fd', 'white', 10, 'center'), T(10.2, -0.5, 'NADPH', 'pink', 10, 'center'),
     A(1.2, 0.9, 1.2, -0.7, 'gold', 2), A(6.6, 0.5, 6.6, -1.2, 'gold', 2), T(1.6, 0.5, 'photon', 'gold', 9), T(7.1, 0.0, 'photon', 'gold', 9),
     C(path_expr(zpath, 'u', 0), path_expr(zpath, 'u', 1), 0.13, 'white', 'white')],
    aspect=0.7, equal=False)
S['bio_light_reactions']['shapes'][-1]['x'] = path_expr(zpath, '((t*0.12)%1)', 0); S['bio_light_reactions']['shapes'][-1]['y'] = path_expr(zpath, '((t*0.12)%1)', 1)
blocks('bio_calvin_cycle', 'Rubisco fixes CO₂ onto RuBP; ATP and NADPH reduce the product to G3P, and five-sixths of the G3P is recycled to RuBP. Three turns give one net G3P.',
       [('c', 'CO₂', 8, 12), ('r', 'RuBP (C5)', 42, 12, 'gold'), ('p', '2 × 3-PGA', 82, 12, 'pink'), ('g', 'G3P', 82, 50, 'green'), ('rg', 'Regenerate', 42, 88, 'accent'), ('o', 'Net sugar', 85, 90, 'gold')],
       [('c', 'r'), ('r', 'p', 'Rubisco'), ('p', 'g', 'ATP, NADPH'), ('g', 'rg', '5 of 6'), ('rg', 'r', 'ATP'), ('g', 'o', '1 of 6')],
       aspect=0.7, params=[P('n', 'CO₂ fixed', 3, 18, 3, step=3)], readouts=[R('net G3P', 'n/3'), R('ATP', '3*n'), R('NADPH', '2*n')])
plot('bio_metabolic_regulation', 'PFK-1, the glycolysis gatekeeper, is inhibited by ATP: more ATP shifts its S-shaped curve to the right, so glycolysis slows when energy is plentiful.',
     [F('100*x^3.5/((0.5*(1+ATP*0.6))^3.5+x^3.5)', 'PFK-1 activity', 'accent')], x=[0, 3], y=[0, 100], xlabel='[fructose-6-P] (mM)', ylabel='PFK-1 activity (% max)',
     params=[P('ATP', 'ATP', 0, 5, 1, 'mM')], readouts=[R('K0.5 for F6P', '0.5*(1+ATP*0.6)', 'mM')])
plot('bio_metabolic_integration', 'In fasting, liver glycogen runs out within about a day while ketone bodies rise, so the brain can switch fuels. Slide the glycogen store to see how long it lasts.',
     [F('max(0,100-x*100/T)', 'liver glycogen (% left)', 'accent'), F('60*(1-exp(-x/30))', 'blood ketones (mM × 10)', 'pink')], x=[0, 72], y=[0, 100], xlabel='hours without food', ylabel='% / scaled',
     params=[P('T', 'glycogen lasts', 12, 36, 24, 'h')], vlines=[dict(x='T', label='')], readouts=[R('ketones at 72 h', '6*(1-exp(-72/30))', 'mM')])
