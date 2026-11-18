# Figures whose layouts were tuned to fit narrow cards (labels kept short).
from lib import *
import math
S = {}

# ---- cells ----
S['lymphocyte_t'] = net([('n', 'naive T cell', 14, 50), ('a', 'antigen', 46, 50, 'gold'), ('h', 'helper CD4', 86, 14, 'accent'), ('k', 'killer CD8', 86, 50, 'red'), ('m', 'memory', 86, 88, 'green')],
    [('n', 'a'), ('a', 'h'), ('a', 'k'), ('a', 'm')],
    'A T cell is activated only when its receptor recognises a matching fragment shown on another cell. It then becomes a helper that directs the response (cytokines), a killer that destroys infected cells, or a long-lived memory cell.', aspect=0.66)
S['lymphocyte_b'] = flow(['antigen binds', 'T helper helps', 'cell multiplies', 'plasma cell', 'antibodies 2000/s', 'memory B cell'],
    'A B cell that meets its antigen turns into a plasma cell: an antibody factory pumping out about 2,000 antibody molecules per second. Some daughters stay behind as memory cells for a faster second response.', cols=2, colors={3: 'gold', 4: 'pink'})
S['hepatocyte'] = hub('Liver cell', [('store glycogen', ''), ('make bile', ''), ('detoxify', ''), ('albumin', ''), ('urea from NH3', ''), ('process fats', '')],
    'Hepatocytes make up about 80% of the liver and carry out hundreds of jobs, including making 0.5-1 L of bile a day and about 10-15 g of albumin. Blood flows past them in sinusoids, bringing nutrients and carrying products away.', aspect=0.78)
S['stem_cell'] = net([('s', 'stem cell', 14, 50, 'gold'), ('m', 'myeloid', 48, 16), ('l', 'lymphoid', 48, 84), ('r', 'red cells etc', 86, 16), ('t', 'T, B, NK cells', 86, 84)],
    [('s', 'm'), ('s', 'l'), ('m', 'r'), ('l', 't')],
    'One blood stem cell in the bone marrow can renew itself and give rise to every blood cell type, via myeloid progenitors (red cells, platelets, neutrophils...) or lymphoid ones. The body makes roughly 200 billion red cells every day this way.', aspect=0.66)
S['melanocyte'] = flow(['UV hits skin', 'neighbours signal', 'melanin made', 'melanosomes packed', 'to 36 neighbours', 'shields DNA'],
    'A melanocyte (about 1 for every 36 basal keratinocytes) makes pigment in packets and hands it to its neighbours, which place it above their nuclei like tiny umbrellas. Skin colour depends on how much and what type of melanin, not on the number of melanocytes.', cols=2, colors={2: 'gold'})
sh = [curve('2.0*(1+act*0.4*pow(abs(cos(5*s)),4))*cos(s)', '2.0*(1+act*0.4*pow(abs(cos(5*s)),4))*sin(s)*(0.5+0.5*act)', [0, 6.2832], 'pink', 3),
      circ(-0.8, 0.2, 0.17, 'gold', 'gold'), circ(0.4, -0.35, 0.17, 'gold', 'gold'), circ(1.1, 0.3, 0.13, 'accent', 'accent'), circ(-0.1, 0.5, 0.13, 'accent', 'accent'), circ(-1.3, -0.3, 0.13, 'accent', 'accent'),
      text(0, -2.6, 'granules hold clotting signals', 'dim', 10), text(0, 2.6, 'resting: smooth disc, 2-3 µm', 'white', 11, when='act<0.5'), text(0, 2.6, 'activated: spiky, sticky', 'gold', 11, when='act>=0.5')]
S['platelet'] = geo(sh, 'A platelet is a cell fragment (150-450 billion per litre of blood, lifespan 8-10 days). Slide activation to see the resting disc turn into the spiky, sticky form that plugs a wound.', (-4.2, 4.2, -3.0, 3.0),
    params=[P('act', 'activation', 0, 1, 0, '')], readouts=[R('activation', '100*act', '%')])
sh = [circ(0, 0, '0.9+1.4*f', 'orange', 'orange', 0.18, 2), circ(0, 0, '(0.9+1.4*f)*(0.25+0.7*f)', 'gold', 'gold', 0.6), circ('-(0.9+1.4*f)+0.12', 0, 0.2, 'accent', 'accent', 0.9),
      text(0, 0, 'lipid droplet', 'white', 10), text(0, -2.9, 'cell diameter = {40+80*f} µm', 'orange', 11), text('-(0.9+1.4*f)+0.3', 0.7, 'nucleus', 'accent', 10, 'left')]
S['adipocyte'] = geo(sh, 'A fat cell stores energy as a single droplet that can fill nearly the whole cell (about 90% fat). Fill it from empty to full: the cell swells from about 40 to over 100 µm, a 15-fold volume change.', (-3.6, 3.6, -3.4, 2.8),
    params=[P('f', 'fat stored', 0, 1, 0.7, '')], readouts=[R('volume vs lean cell', '((40+80*f)/40)^3', 'x')])
S['lysosome'] = bars([('cytosol', 63, 'accent'), ('endosome', 1000, 'gold'), ('lysosome', 20000, 'pink'), ('stomach', 31600000, 'red')],
    'Lysosomal enzymes work only in strong acid (pH 4.5-5, about 300 times more H+ than the cytosol at pH 7.2), so a leak is mostly harmless to the rest of the cell. pH values: cytosol 7.2, endosome 6, lysosome 4.7, stomach 1.5. H+ concentration, log scale.', ylabel='[H+] (nM, log)', logy=True)
# ---- brain ----
S['hippocampus'] = plot([fn('100*exp(-x/(S*(1+n*2)))', 'memory retained', 'gold')], [0, 30], [0, 105],
    'A new memory fades unless the hippocampus helps consolidate it. Each rehearsal (spaced review) slows the forgetting curve. Add reviews and compare.',
    'days since learning', '% retained', [P('S', 'initial memory strength', 0.5, 8, 3, 'days'), P('n', 'spaced reviews', 0, 5, 0, '', 1)], [R('retained after 7 days', '100*exp(-7/(S*(1+n*2)))', '%')])
S['brainstem'] = hub('Brainstem', [('breathing', ''), ('heart + BP', ''), ('sleep, wake', ''), ('eye movement', ''), ('cranial nerves', ''), ('body relay', '')],
    'The brainstem (midbrain, pons, medulla) runs automatic life-support jobs (breathing 12-20 per minute, heart rate, blood pressure) and is the cable through which every signal between brain and body passes. Damage here is quickly life-threatening.', aspect=0.78)
# ---- digestion etc ----
S['digestion'] = flow(['mouth: starch', 'stomach: protein', 'small gut: absorb', 'colon: water', 'stool out'],
    'Food spends seconds in the mouth, 2-4 hours in the stomach, 3-5 hours in the small intestine (where nearly all nutrients are absorbed) and 12-48 hours in the colon, which recovers water. The whole tube is about 9 m long.', cols=2, colors={2: 'green'})
S['thermoregulation'] = net([('t', 'temp off 37 °C', 14, 14), ('s', 'sensors', 50, 14), ('h', 'hypothalamus', 86, 14, 'gold'), ('e', 'effectors', 86, 70, 'red'), ('b', 'back to 37 °C', 50, 70, 'green')],
    [('t', 's'), ('s', 'h'), ('h', 'e'), ('e', 'b'), ('b', 't', '', True)],
    'Temperature is held near 37 °C by negative feedback: sensors in skin and brain report to the hypothalamus, which compares with its set point and switches on heating (shiver, narrow skin vessels) if too cold or cooling (sweat, wide vessels) if too hot, until the error disappears.', aspect=0.55)
S['liver'] = net([('pv', 'portal vein 75%', 14, 14, 'blue'), ('ha', 'artery 25%', 14, 86, 'pink'), ('li', 'LIVER', 50, 50, 'gold'), ('bi', 'bile', 86, 14), ('pr', 'proteins', 86, 50), ('de', 'detox, storage', 86, 86)],
    [('pv', 'li'), ('ha', 'li'), ('li', 'bi'), ('li', 'pr'), ('li', 'de')],
    'The liver gets 1.5 L of blood a minute from two sources: nutrient-rich, oxygen-poor blood from the gut (portal vein, 75%) and oxygen-rich arterial blood (25%). It handles everything absorbed from food, makes 0.6-1 L of bile a day and plasma proteins, and detoxifies.', aspect=0.7)
S['pancreas'] = net([('a', 'acinar cells', 14, 14, 'gold'), ('e', 'enzymes', 50, 14), ('d', 'duodenum', 86, 14), ('i', 'islets', 14, 70, 'pink'), ('h', 'hormones', 50, 70), ('b', 'blood', 86, 70, 'red')],
    [('a', 'e'), ('e', 'd'), ('i', 'h'), ('h', 'b')],
    'About 98% of the pancreas is exocrine: acinar cells send 1-1.5 L a day of digestive enzymes and bicarbonate to the gut by a duct. The remaining 1-2%, in islets, is endocrine: insulin and glucagon go into the blood to control glucose.', aspect=0.6)
fin = '(0.5+9.5*(1-adh)^2)'
S['nephron'] = plot([fn(f'(x<1)*100+(x>=1)*(x<2)*(100-65*(x-1))+(x>=2)*(x<3)*(35-17*(x-2))+(x>=3)*(x<4)*(18-4*(x-3))+(x>=4)*(14-(14-{fin})*(x-4))', 'water left in tubule', 'gold')], [0, 5], [0, 105],
    'Percentage of filtered water remaining along the tubule: 65% is reclaimed in the first tube, more in the loop and distal tube, and the collecting duct makes the final decision under control of the hormone ADH. Slide ADH to see urine volume range from about 1 to 18 L a day.',
    'tubule segment (1 = start, 5 = end)', '% of filtered water', [P('adh', 'ADH hormone', 0, 1, 0.8, '')], [R('urine volume', '180*(0.5+9.5*(1-adh)^2)/100', 'L/day'), R('urine = % of filtrate', '0.5+9.5*(1-adh)^2', '%')])
S['distal_tubule'] = hub('Distal tubule', [('NCC: Na+, Cl- in', ''), ('PTH: Ca2+ in', ''), ('aldosterone', ''), ('thiazide drugs', '')],
    'The distal tubule fine-tunes the filtrate. The NCC transporter reclaims 5-7% of filtered sodium and is blocked by thiazide diuretics; PTH adds calcium reabsorption; aldosterone raises sodium reabsorption and potassium secretion.', aspect=0.6)
S['pituitary_gland'] = hub('Pituitary', [('growth hormone', 'anterior'), ('prolactin', ''), ('TSH', ''), ('ACTH', ''), ('FSH + LH', ''), ('ADH, oxytocin', 'posterior')],
    'The pea-sized pituitary (about 0.5 g), under hypothalamic control, releases hormones that drive other glands (TSH to thyroid, ACTH to adrenals, FSH and LH to gonads): the "master gland". The posterior lobe stores two hypothalamic hormones, ADH and oxytocin.', aspect=0.78)
S['lymphatic_vessels'] = bars([('leaks out', 20, 'accent'), ('to veins', 17, 'green'), ('lymph', '3*fn', 'gold'), ('swelling', '3*(1-fn)', 'red')],
    'Capillaries leak about 20 litres of fluid a day into the tissues; about 17 L return directly and about 3 L (with proteins and fat) return through the lymphatic vessels. Slide lymph function to 0 and the 3 L backs up as swelling (lymphedema).', ylabel='litres per day',
    params=[P('fn', 'lymph function', 0, 1, 1, '')], readouts=[R('fluid accumulating', '3*(1-fn)', 'L/day')])
# ---- systems ----
S['integumentary_system'] = hub('Skin', [('waterproof', ''), ('sweat cools', ''), ('touch, pain', ''), ('vitamin D', ''), ('immune guard', ''), ('hair, nails', '')],
    'The skin covers about 1.8 m² and makes up about 15% of body weight. It keeps water in and germs out, regulates temperature, makes vitamin D from sunlight and houses touch sensors.', aspect=0.78)
S['muscular_system'] = net([('n', 'motor nerve', 14, 12, 'accent'), ('m', 'muscles', 50, 50, 'pink'), ('t', 'tendons', 86, 12), ('b', 'bone levers', 86, 50), ('mv', 'movement', 86, 88, 'green'), ('h', 'heat', 14, 88, 'orange')],
    [('n', 'm'), ('m', 't'), ('t', 'b'), ('b', 'mv'), ('m', 'h')],
    'About 600 skeletal muscles make up about 40% of body mass. They turn chemical energy into force but only about 25% efficiently; the rest becomes heat that keeps us warm. A nerve signal triggers each contraction.', aspect=0.7)
S['nervous_system'] = net([('s', 'senses', 12, 50, 'green'), ('c', 'brain + cord', 46, 50, 'gold'), ('m', 'muscles', 88, 14, 'pink'), ('a', 'organs', 88, 50, 'accent'), ('g', 'glands', 88, 86, 'orange')],
    [('s', 'c'), ('c', 'm'), ('c', 'a'), ('c', 'g')],
    'The nervous system gathers sensory data, integrates it in the brain and spinal cord, and sends commands to muscles, organs (autonomic nerves) and glands, in milliseconds. About 86 billion neurons and 100 trillion synapses carry out this work.', aspect=0.66)
S['endocrine_system'] = net([('h', 'hypothalamus', 14, 12, 'gold'), ('p', 'pituitary', 50, 12, 'gold'), ('t', 'thyroid', 86, 12), ('x', 'in blood', 50, 50), ('a', 'adrenals', 86, 50), ('g', 'gonads', 86, 88), ('y', 'targets', 50, 88, 'green')],
    [('h', 'p'), ('p', 't'), ('p', 'a'), ('t', 'x'), ('a', 'x'), ('g', 'x'), ('p', 'g'), ('x', 'y')],
    'Endocrine glands send chemical messengers (hormones) through the blood to far-off target organs. The hypothalamus and pituitary form the control center, and most axes run on negative feedback.', aspect=0.8)
S['cardiovascular_system'] = net([('h', 'heart', 50, 8, 'pink'), ('a', 'arteries', 88, 38, 'pink'), ('c', 'capillaries', 50, 92, 'gold'), ('v', 'veins', 12, 38, 'blue'), ('l', 'lungs', 50, 44, 'accent')],
    [('h', 'a'), ('a', 'c'), ('c', 'v'), ('v', 'h'), ('h', 'l', 'to lungs')],
    'A closed loop of about 100,000 km of vessels: the heart pumps oxygen-rich blood through arteries to capillaries, where exchange happens, and veins return it; a second loop through the lungs picks up fresh oxygen. Cardiac output is about 5 L/min.', aspect=0.78)
S['lymphatic_immune_system'] = net([('t', 'fluid', 14, 12), ('lv', 'lymph vessel', 50, 12), ('ln', 'nodes', 86, 12, 'gold'), ('v', 'veins', 86, 50, 'blue'), ('ic', 'immune cells', 50, 50, 'accent'), ('bm', 'marrow', 14, 88, 'pink'), ('th', 'thymus', 50, 88), ('sp', 'spleen', 86, 88)],
    [('t', 'lv'), ('lv', 'ln'), ('ln', 'v'), ('bm', 'ic'), ('th', 'ic'), ('sp', 'ic'), ('ic', 'ln')],
    'Lymph vessels return about 3 L of leaked fluid a day to the blood, passing through lymph nodes where immune cells inspect it. Bone marrow makes the immune cells, the thymus trains T cells, and the spleen filters blood and samples it for germs.', aspect=0.72)
S['respiratory_system'] = net([('a', 'air in', 14, 12), ('w', 'airways', 50, 12), ('al', 'alveoli', 86, 12, 'gold'), ('bl', 'blood', 86, 50, 'pink'), ('co', 'CO2 out', 50, 50, 'accent'), ('ex', 'breath out', 14, 50), ('d', 'diaphragm', 50, 88)],
    [('a', 'w'), ('w', 'al'), ('al', 'bl', 'O2 in'), ('bl', 'co'), ('co', 'ex'), ('d', 'w', 'pumps', True)],
    'About 12-20 breaths a minute move about 6 L of air in and out. In the 300-500 million alveoli (a surface of about 70 m²), oxygen enters the blood and carbon dioxide leaves it, powered by the diaphragm.', aspect=0.74)
S['digestive_system'] = net([('m', 'mouth', 14, 12), ('e', 'esophagus', 50, 12), ('s', 'stomach', 86, 12, 'gold'), ('l', 'liver', 14, 50, 'pink'), ('p', 'pancreas', 14, 88, 'pink'), ('si', 'small gut', 50, 50, 'green'), ('co', 'colon', 86, 50), ('bl', 'blood', 50, 88, 'red')],
    [('m', 'e'), ('e', 's'), ('s', 'si'), ('l', 'si', 'bile'), ('p', 'si', 'enzymes'), ('si', 'bl', 'nutrients'), ('si', 'co')],
    'The 9 m digestive tube breaks food down and absorbs nutrients (mostly in the small intestine), helped by bile from the liver and enzymes from the pancreas; the colon recovers water.', aspect=0.74)
S['urinary_system'] = net([('b', 'blood in', 14, 14, 'pink'), ('k', 'kidneys', 50, 14, 'gold'), ('u', 'ureters', 86, 14), ('bl', 'bladder', 86, 55), ('ur', 'urethra', 50, 90), ('c', 'clean blood', 14, 55, 'pink')],
    [('b', 'k'), ('k', 'u', 'urine'), ('u', 'bl'), ('bl', 'ur'), ('k', 'c')],
    'The kidneys clean the blood (about 1.2 L a minute in, about 180 L of filtrate a day), keep water, salts and acidity in balance and pass about 1.5 L of urine to the bladder through the ureters.', aspect=0.66)
S['reproductive_system'] = net([('h', 'hypothalamus', 14, 12, 'gold'), ('p', 'pituitary', 50, 12, 'gold'), ('g', 'gonads', 86, 12), ('s', 'hormones', 86, 50, 'pink'), ('ga', 'gametes', 86, 88, 'green'), ('f', 'fertilize', 50, 88), ('u', 'uterus', 14, 88)],
    [('h', 'p', 'GnRH'), ('p', 'g'), ('g', 's'), ('g', 'ga'), ('ga', 'f'), ('f', 'u'), ('s', 'h', '', True)],
    'The reproductive organs are run by a brain-gonad hormone loop (GnRH, then LH and FSH, then testosterone or estrogen and progesterone, with feedback to the brain). They make the gametes, and in females the uterus supports an embryo for about 38 weeks.', aspect=0.74)
S['epithelial_tissue'] = hub('Epithelium', [('squamous', 'exchange'), ('columnar', 'absorb'), ('stratified', 'protect'), ('transitional', 'stretch'), ('glandular', 'secrete')],
    'Epithelia are named by cell shape (flat squamous, cube-shaped, tall columnar) and layers (simple = one, stratified = many). The structure matches the job: thin for exchange (lung), absorbing (gut), tough for protection (skin), stretchy (bladder). They have no blood vessels and are renewed quickly.', aspect=0.8)
S['connective_tissue_loose'] = hub('Loose tissue', [('fibroblasts', 'make fibers'), ('macrophages', 'defend'), ('mast cells', 'histamine'), ('collagen', 'strength'), ('elastin', 'stretch'), ('gel matrix', 'holds water')],
    'Loose connective tissue is the body\'s packing material under skin and around organs: sparse fibers and cells floating in a gel. It supports vessels and nerves and is the first place an infection meets immune cells.', aspect=0.8)

S['villi'] = net([('g', 'gut', 12, 50), ('v', 'villus cell', 42, 50, 'gold'), ('c', 'capillary', 86, 12, 'pink'), ('l', 'to liver', 86, 36), ('f', 'lacteal', 86, 64, 'accent'), ('ly', 'lymph', 86, 88)],
    [('g', 'v'), ('v', 'c'), ('c', 'l'), ('v', 'f'), ('f', 'ly')],
    'Each villus (about 1 mm tall, 20-40 per mm²) has a capillary for water-soluble nutrients (sugars, amino acids, which go to the liver by the portal vein) and a lymph vessel, the lacteal, for fat. Villi and microvilli together multiply the absorbing surface about 600-fold.', aspect=0.72)
FF = 'f'
sh = [line(-4.6, -1.9, 4.6, -1.9, 'white', 3), text(-4.6, -2.25, 'basement membrane', 'white', 10, 'left'), text(4.6, 2.2, 'urine (lumen)', 'gold', 10, 'right')]
for i in range(8):
    xo = f'({i}-3.5)*(0.62+0.7*f)'
    sh.append(curve(f'{xo}+(0.3+0.34*f)*cos(s)', '1.2+(0.55-0.4*f)*sin(s)', [0, 6.2832], 'gold', 2))
    sh.append(curve(f'{xo}+(0.34-0.1*f)*cos(s)', '0.25+(0.4-0.2*f)*sin(s)', [0, 6.2832], 'accent', 2))
    sh.append(curve(f'{xo}+0.3*cos(s)', '-0.75+0.4*sin(s)', [0, 6.2832], 'green', 2))
sh += [text(-4.6, 1.7, 'umbrella cells', 'gold', 10, 'left'), text(-4.6, 0.7, 'intermediate', 'accent', 10, 'left'), text(-4.6, -0.2, 'basal', 'green', 10, 'left')]
S['transitional_epithelium'] = geo(sh, 'The bladder lining adapts to being empty or full. Slide the filling: when stretched the dome-shaped surface cells flatten and spread, and the layers thin from about 6 cell layers to 2-3, without tearing or leaking.', (-4.8, 4.8, -2.9, 2.7),
    params=[P('f', 'bladder filling', 0, 1, 0, '')], readouts=[R('cell layers', '6-3*f', '')])
