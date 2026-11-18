from lib import *
import math
S = {}

# ---------- processes ----------
S['urine_formation'] = flow(['filter: 125 mL/min', 'proximal tube: 65% back', 'loop: salt gradient', 'distal: fine-tune', 'collecting duct: water', 'urine ~1.5 L/day'],
    'Each day the kidneys filter about 180 litres of plasma but excrete only about 1.5 litres: over 99% of the filtrate is reabsorbed. Most is reclaimed in the first tube; hormones fine-tune the rest.', cols=2, colors={0: 'accent', 5: 'gold'})
S['blood_clotting'] = flow(['vessel torn', 'vessel narrows', 'platelets stick, plug', 'cascade makes thrombin', 'fibrinogen to fibrin', 'mesh seals clot', 'clot dissolved later'],
    'Clotting is a chain reaction in which each activated factor activates the next, so a tiny trigger is amplified into a solid fibrin mesh within minutes. Normal bleeding stops in about 2-9 minutes. Plasmin dissolves the clot after healing.', cols=2, colors={2: 'gold', 3: 'red'})
S['immune_response'] = plot([fn('1+99/(1+exp(-(x-8)/1.5))*exp(-max(x-14,0)/25)+step(x-D)*(9900/(1+exp(-(x-D-3)/1))*exp(-max(x-D-8,0)/40))', 'antibody level (log scale)', 'gold')], [0, 70], [0.8, 20000],
    'The first meeting with a germ takes about a week to produce a modest antibody peak. Memory cells let a second exposure (day D) respond within days and produce 10-100 times as much. Slide the booster day.',
    'days', 'relative antibody level', [P('D', 'second exposure day', 20, 60, 35, 'day')], [R('first-response peak', '100'), R('second-response peak', '10000')], logy=True, vlines=[{'x': 'D', 'label': 'second exposure'}, {'x': 0, 'label': 'first'}])
S['hormone_signaling'] = plot([fn('85+(55/S)*(x*S)*exp(1-x*S)', 'blood glucose (mg/dL)', 'gold')], [0, 6], [60, 260],
    'After a meal glucose rises, beta cells release insulin, and the falling glucose switches the release off: negative feedback. If tissues respond poorly (low sensitivity, as in type 2 diabetes) glucose peaks higher and stays up longer. Slide sensitivity.',
    'hours after a meal', 'mg/dL', [P('S', 'insulin sensitivity', 0.3, 1.5, 1.0, '')], [R('peak glucose', '85+55/S', 'mg/dL'), R('peak at', '1/S', 'h')], hlines=[{'y': 140, 'label': 'normal limit at 2 h: 140'}, {'y': 100, 'label': 'fasting limit 100'}])
S['bone_remodeling'] = flow(['quiet bone surface', 'activation', 'osteoclasts dig (2-3 weeks)', 'reversal', 'osteoblasts refill (3-4 months)', 'new bone, quiet again'],
    'About 10% of bone is replaced every year, so the whole skeleton is renewed roughly every 10 years. Dissolving is quick and rebuilding slow; if the two get out of balance, bone is lost (osteoporosis).', cols=1, colors={2: 'red', 4: 'gold'}, extra=[(5, 0, '')])

# ---------- digestive ----------
S['mouth_pharynx'] = flow(['chew + saliva (1-1.5 L/day)', 'tongue pushes food back', 'soft palate seals nose', 'epiglottis covers airway', 'enters esophagus (~1 s)'],
    'Swallowing is a reflex that takes about a second in the throat. The airway is briefly shut (breathing pauses) so food goes down the esophagus, not the windpipe.', cols=1, colors={3: 'gold'})
S['esophagus'] = plot([fn('(35*exp(-sq((x-3.5*mod(t,6))/2.5))+4)*(x<22)+(x>=22)*(18-14*exp(-sq(mod(t,6)-5.5)/0.6))', 'pressure (mmHg)', 'accent')], [0, 25], [0, 90],
    'A ring of squeeze (about 3-4 cm per second) pushes each swallow down the 25 cm tube, so you can swallow even upside down. The sphincter at the bottom (right) relaxes just as the wave arrives.',
    'distance down the esophagus (cm)', 'mmHg', hlines=[{'y': 18, 'label': 'lower sphincter at rest'}])
S['esophagus']['fns'][0]['f'] = '(35*exp(-sq((x-3.5*mod(t,6))/2.5))+4)*(x<22)+(x>=22)*(20-16*exp(-sq(mod(t,6)-5.2)/0.8))'
S['stomach'] = plot([fn('100*0.5^(x*60/20)', 'liquids', 'accent'), fn('100*0.5^(max(x-lag,0)*60/90)', 'solid meal', 'gold')], [0, 5], [0, 105],
    'Liquids leave the stomach within about 20 minutes, but a solid meal is ground into a paste first (the lag) and then emptied in small squirts over 3-4 hours. Fatty meals slow it further. Slide the lag.',
    'hours after eating', '% still in stomach', [P('lag', 'lag phase', 0, 2, 1, 'h')], [R('half emptied at', 'lag+1.5', 'h')])
S['gastric_pits'] = plot([fn('1.5+5.5/(1+exp(-(x-110)/18))', 'pH', 'gold')], [0, 250], [1, 8],
    'Parietal cells pump out acid (about 2 L of juice a day, pH 1.5-2) that is strong enough to dissolve metal. A mucus layer of about 0.2 mm, rich in bicarbonate, holds the pH near neutral at the cells so the stomach does not digest itself.',
    'distance from the stomach cavity to the cell wall (µm)', 'pH', hlines=[{'y': 7, 'label': 'neutral'}], vlines=[{'x': 200, 'label': 'cell surface'}])
S['small_intestine'] = bars([('swallowed', 2, 'accent'), ('secreted', 7, 'gold'), ('absorbed', 7.5, 'green'), ('colon', 1.4, 'orange'), ('stool', 0.1, 'pink')],
    'About 9 litres of fluid (2 drunk plus 7 from the body\'s own juices) enter the gut each day, and the small intestine takes back about 7.5 of them along with nearly all nutrients. Only about 100 mL leaves in stool.', ylabel='litres per day')
S['villi'] = net([('l', 'gut lumen', 10, 14), ('v', 'villus lining cell', 40, 14, 'gold'), ('c', 'blood capillary', 82, 14, 'pink'), ('p', 'portal vein to liver', 82, 50), ('ch', 'chylomicron fat parcels', 40, 60, 'accent'), ('la', 'lacteal', 40, 90), ('lym', 'lymph to blood', 82, 90)],
    [('l', 'v', 'sugars, amino acids'), ('v', 'c'), ('c', 'p'), ('l', 'ch', 'fats'), ('ch', 'la'), ('la', 'lym')],
    'Each villus (about 1 mm tall, 20-40 per mm²) has a capillary for water-soluble nutrients and a lymph vessel (lacteal) for fat. Villi and microvilli together multiply the absorbing surface about 600-fold.', aspect=0.72)
S['villi']['nodes'][0]['label'] = 'gut'; S['villi']['nodes'][1]['label'] = 'villus cell'; S['villi']['nodes'][4]['label'] = 'fat parcels'; S['villi']['nodes'][3]['label'] = 'to liver'; S['villi']['nodes'][6]['label'] = 'lymph to blood'
S['large_intestine'] = bars([('stomach', 3, 'accent'), ('small gut', 4, 'gold'), ('colon', 36, 'pink')],
    'The colon is slow: food waste takes about 12-48 hours (30-40 on average) to cross it while water and salts are absorbed and gut bacteria ferment fibre. Typical transit time in each region.', ylabel='hours')
S['microbiome'] = bars([('stomach', 1e3, 'accent'), ('duodenum', 1e3, 'accent'), ('jejunum', 1e4, 'gold'), ('ileum', 1e7, 'orange'), ('colon', 1e11, 'pink')],
    'Bacteria thrive in the oxygen-poor colon: about 100 billion per millilitre, tens of trillions in total (roughly as many as human cells). Acid and fast flow keep numbers low upstream. Log scale.', ylabel='bacteria per mL (log)', logy=True)
sh = []
hexa = [(3.0 * math.cos(math.radians(60 * i + 30)), 3.0 * math.sin(math.radians(60 * i + 30))) for i in range(6)]
sh.append(poly(hexa, 'white', None, 0.7, 2))
sh.append(circ(0, 0, 0.45, 'blue', 'blue', 0.6))
for i, (x, y) in enumerate(hexa):
    sh.append(circ(x * 0.95, y * 0.95, 0.28, 'pink', 'pink', 0.6))
    sh.append(line(x * 0.95, y * 0.95, 0, 0, 'red', 1.5, alpha=0.35))
    sh.append(pt(f'{x*0.95}*(1-mod(t*0.4+{i/6},1))', f'{y*0.95}*(1-mod(t*0.4+{i/6},1))', 'pink', 4))
sh += [text(0, 0, 'central vein', 'white', 9), text(0, -3.4, 'portal triads at the corners (artery, vein, bile duct)', 'pink', 10), text(0, 3.55, 'blood flows corner to center through sinusoids', 'dim', 10)]
sh += [text(0, 1.2, 'zone 3 (low O2)', 'dim', 9), text(0, 2.4, 'zone 1 (high O2)', 'gold', 9)]
S['liver_lobule'] = geo(sh, 'The hexagonal lobule is the liver\'s working unit: blood runs from the corner triads, past rows of hepatocytes, to the central vein, so cells near the corners get the most oxygen and nutrients (zone 1) and those near the center the least.', (-4.2, 4.2, -3.9, 3.9))
S['gallbladder'] = plot([fn('40*(1-EF*(1-exp(-x/12))*exp(-max(x-45,0)/70))', 'gallbladder volume (mL)', 'green')], [0, 240], [0, 50],
    'The gallbladder stores bile (concentrating it 5-10 times, 30-50 mL). A fatty meal releases the hormone CCK, which squeezes out about 60-70% of it within an hour; then it refills. Slide the ejection fraction.',
    'minutes after a fatty meal', 'mL', [P('EF', 'fraction squeezed out', 0.2, 0.9, 0.65, '')], [R('volume ejected', '40*EF', 'mL')])
S['pancreatic_islets'] = bars([('beta', 65, 'gold'), ('alpha', 25, 'accent'), ('delta', 8, 'pink'), ('PP', 2, 'green')],
    'A human has about a million islets, each with about 1,000 cells. Beta cells (insulin, lowers glucose) are the majority, and alpha cells (glucagon, raises glucose) are their opposite. Approximate share of islet cells.', ylabel='% of islet cells')

# ---------- kidney ----------
MAP = 'x'
AR = '(p<80?p/80*0.9:(p<180?0.9+0.12*(p-80)/100:1.02+(p-180)/60))'
S['kidney_l'] = plot([fn(AR.replace('p', 'x') + '*1200', 'renal blood flow (mL/min)', 'pink')], [40, 220], [0, 1500],
    'Kidneys receive about 1.2 L of blood per minute (a fifth of the output) and keep flow and filtration almost constant for pressures from about 80 to 180 mmHg (autoregulation), protecting the filters from swings. Move the pressure.',
    'mean arterial pressure (mmHg)', 'mL/min', [P('p', 'blood pressure', 40, 220, 93, 'mmHg')], [R('blood flow', '1200*' + AR, 'mL/min'), R('filtration rate', '125*' + AR, 'mL/min')], vlines=[{'x': 'p', 'label': ''}])
S['renal_cortex'] = bars([('cortex', 90, 'pink'), ('outer medulla', 8, 'gold'), ('inner medulla', 2, 'accent')],
    'The outer cortex holds the million glomerular filters and receives about 90% of the kidney\'s blood flow. The deeper medulla gets much less, which helps it keep its salt gradient. Share of renal blood flow.', ylabel='% of kidney blood flow')
S['renal_medulla'] = plot([fn('300+900*x', 'interstitial concentration (mOsm/kg)', 'gold')], [0, 1], [0, 1300],
    'The medulla is saltier the deeper you go: from blood-like 300 mOsm/kg at the cortex to about 1200 at the tip. Water is drawn out of urine into this gradient, which is how we make urine four times more concentrated than blood. Slide the depth.',
    'depth in the medulla (0 = cortex, 1 = papilla tip)', 'mOsm/kg', [P('d', 'depth', 0, 1, 0.5, '')], [R('here', '300+900*d', 'mOsm/kg')], points=[{'x': 'd', 'y': '300+900*d', 'label': ''}], hlines=[{'y': 300, 'label': 'blood 300'}])
S['renal_pelvis'] = flow(['collecting ducts', 'minor calyces', 'major calyces', 'renal pelvis', 'ureter'],
    'Urine drains from about 10-18 minor calyces, which merge into 2-3 major calyces and then into the funnel-shaped renal pelvis. Waves of squeezing push it on to the ureter a few times per minute.', cols=1, colors={3: 'gold'})
fin = '(0.5+9.5*(1-adh)^2)'
S['glomerulus'] = bars([('capillary push', 'Pg', 'pink'), ('protein pull', 30, 'accent'), ('capsule back-pressure', 15, 'orange'), ('net filtering', 'max(Pg-45,0)', 'gold')],
    'Plasma is forced through the leaky capillary wall by blood pressure (about 55 mmHg), opposed by protein pull (30) and capsule pressure (15), leaving about 10 mmHg of net push and a filtration rate of about 125 mL/min. Slide the pressure.', ylabel='mmHg',
    params=[P('Pg', 'glomerular pressure', 35, 75, 55, 'mmHg')], readouts=[R('net push', 'max(Pg-45,0)', 'mmHg'), R('filtration rate', '12.5*max(Pg-45,0)', 'mL/min')])
S['glomerulus']['bars'][2]['label'] = 'back-pressure'; S['glomerulus']['bars'][0]['label'] = 'blood push'; S['glomerulus']['bars'][1]['label'] = 'protein pull'; S['glomerulus']['bars'][3]['label'] = 'net push'
S['proximal_tubule'] = plot([fn('1.25*x', 'filtered (mg/min)', 'accent'), fn('Tm*tanh(1.25*x/Tm)', 'reabsorbed', 'green'), fn('1.25*x-Tm*tanh(1.25*x/Tm)', 'lost in urine', 'pink')], [0, 500], [0, 600],
    'The first tube reclaims all filtered glucose, but its transporters saturate (transport maximum). In diabetes, blood glucose above about 180 mg/dL overloads them and sugar spills into urine. Slide the transport capacity.',
    'blood glucose (mg/dL)', 'mg/min', [P('Tm', 'transport capacity', 200, 500, 375, 'mg/min'), P('g', 'blood glucose', 50, 500, 100, 'mg/dL')], [R('glucose in urine', '1.25*g-Tm*tanh(1.25*g/Tm)', 'mg/min')], vlines=[{'x': 'g', 'label': ''}])
S['loop_of_henle'] = plot([fn('300+(M-300)*x', 'inner fluid and descending limb', 'gold'), fn('300+(M-300)*x-200', 'ascending limb fluid', 'accent')], [0, 1], [0, 1300],
    'The hairpin multiplies a small 200 mOsm difference at each level into a gradient of 900 mOsm: the ascending limb pumps out salt but not water, drawing water out of the descending limb. A deeper gradient gives more concentrated urine. Slide the maximum.',
    'depth in the medulla', 'mOsm/kg', [P('M', 'deepest concentration', 600, 1400, 1200, 'mOsm/kg')], [R('max urine concentration', 'M', 'mOsm/kg')])
S['collecting_duct'] = plot([fn('50+1150*x/(x+1)', 'urine concentration (mOsm/kg)', 'gold')], [0, 6], [0, 1300],
    'ADH tells the collecting-duct cells to insert water channels, so water follows the salt gradient out and the urine becomes concentrated; with no ADH the urine is dilute and plentiful. Slide the ADH level.',
    'blood ADH (pg/mL)', 'mOsm/kg', [P('A', 'ADH level', 0, 6, 1.5, 'pg/mL')], [R('urine concentration', '50+1150*A/(A+1)', 'mOsm/kg'), R('urine volume', '600/(50+1150*A/(A+1))', 'L/day')], points=[{'x': 'A', 'y': '50+1150*A/(A+1)', 'label': ''}])
S['ureters'] = plot([fn('5+Pk*pow(max(sin(pi*f*x/60),0),6)', 'pressure in ureter (cmH2O)', 'accent')], [0, 60], [0, 40],
    'The ureters push urine toward the bladder with waves of squeezing, a few per minute, even upside down. Each wave sends a small bolus of urine along the 25-30 cm tube. Slide the rate.',
    'time (s)', 'cmH2O', [P('f', 'waves per minute', 1, 6, 3, '/min'), P('Pk', 'wave pressure', 10, 40, 30, 'cmH2O')], [R('interval', '60/f', 's')])
S['bladder'] = plot([fn(pw([(0, 4), (100, 6), (200, 8), (300, 10), (400, 14), (500, 28), (600, 50)], dense=5), 'bladder pressure (cmH2O)', 'gold')], [0, 600], [0, 60],
    'The bladder stretches with almost no rise in pressure up to about 300 mL (thanks to its folded, stretchy wall); first desire comes at about 150 mL and strong urgency near 400 mL. Beyond about 500 mL pressure climbs steeply. Slide the volume.',
    'volume (mL)', 'cmH2O', [P('V', 'bladder volume', 0, 600, 250, 'mL')], [R('pressure', pw([(0, 4), (100, 6), (200, 8), (300, 10), (400, 14), (500, 28), (600, 50)], 'V', 5), 'cmH2O')], vlines=[{'x': 150, 'label': 'first desire'}, {'x': 400, 'label': 'urgent'}])
S['urethra'] = flow(['bladder fills, nerves stretch', 'brain: not now', 'urge reaches awareness', 'brain permits', 'detrusor squeezes', 'sphincters relax, urine flows'],
    'Continence is a negotiation: the sphincters are held shut until the brainstem and cortex agree. Then the bladder muscle contracts and the sphincters relax together. The urethra is about 4 cm in women and 20 cm in men.', cols=1, colors={3: 'gold'})
S['urethra']['caption'] = S['urethra']['caption']
S['urethra'] = flow(['bladder stretch signal', 'brain says wait', 'brain says go', 'bladder muscle squeezes', 'sphincters relax', 'urine flows out'],
    'Continence is a negotiation: the sphincters stay shut until the brainstem and cortex agree. Then the bladder muscle contracts and the sphincters relax together. The urethra is about 4 cm long in women and 20 cm in men.', cols=2, colors={2: 'gold'})
# ---------- endocrine ----------
S['thyroid'] = plot([fn('1.5*exp(-0.614*(x-15+sh))', 'TSH (mIU/L)', 'gold')], [5, 35], [0.01, 200],
    'Negative feedback: the pituitary raises TSH when thyroid hormone (free T4) is low, and lowers it when T4 is high. A 2-fold change in T4 makes a roughly 100-fold change in TSH, which is why TSH is such a sensitive test. Slide T4.',
    'free T4 (pmol/L)', 'TSH (log scale)', [P('T', 'free T4', 5, 35, 15, 'pmol/L'), P('sh', 'pituitary set-point shift', -4, 4, 0, '')], [R('TSH', '1.5*exp(-0.614*(T-15+sh))', 'mIU/L')], logy=True, points=[{'x': 'T', 'y': '1.5*exp(-0.614*(T-15+sh))', 'label': ''}], hlines=[{'y': 4, 'label': 'upper normal 4'}, {'y': 0.4, 'label': 'lower 0.4'}])
S['parathyroid_glands'] = plot([fn('10+250/(1+exp(2.2*(x-8.3)))', 'PTH (pg/mL)', 'gold')], [6.5, 11], [0, 280],
    'Four tiny glands behind the thyroid read blood calcium continuously. Falling calcium makes them pour out PTH within minutes; PTH raises calcium from bone, kidneys and (via vitamin D) the gut. Slide the calcium.',
    'blood calcium (mg/dL)', 'pg/mL', [P('Ca', 'blood calcium', 6.5, 11, 9.5, 'mg/dL')], [R('PTH', '10+250/(1+exp(2.2*(Ca-8.3)))', 'pg/mL')], points=[{'x': 'Ca', 'y': '10+250/(1+exp(2.2*(Ca-8.3)))', 'label': ''}], vlines=[{'x': 8.5, 'label': 'normal range'}, {'x': 10.5, 'label': ''}])
CORT = '(8.5+6.5*cos(2*pi*(x-8)/24)+2*cos(4*pi*(x-8)/24))'
S['adrenal_glands'] = plot([fn(f'{CORT}+St*10*exp(-sq((x-14)/1.2))', 'cortisol (µg/dL)', 'orange')], [0, 24], [0, 28],
    'Cortisol follows a daily rhythm: highest on waking (about 8 am) and lowest around midnight. Stress (slider) adds a surge from the adrenal cortex, while the medulla releases adrenaline within seconds.',
    'time of day (hours)', 'µg/dL', [P('St', 'stress at 2 pm', 0, 1, 0, '')], [R('cortisol at 8 am', '15', 'µg/dL')])
S['pineal_gland'] = plot([fn('70*exp(-sq((x-27)/3.5))/(1+(L/100)^1.5)', 'melatonin (pg/mL)', 'purple')], [12, 36], [0, 80],
    'The pineal releases melatonin in the dark, peaking at about 3 am, and bright light at night suppresses it (ordinary room light, 100-200 lux, cuts it by half or more). The time axis runs from noon to noon. Slide the evening light.',
    'clock time (hours, 24 = midnight, 36 = noon)', 'pg/mL', [P('L', 'light after 9 pm', 0, 500, 0, 'lux')], [R('melatonin peak', '70/(1+(L/100)^1.5)', 'pg/mL')])
# ---------- lymphoid ----------
S['spleen'] = flow(['blood enters (~5% of CO)', 'red pulp filters', 'old red cells removed', 'white pulp meets germs', 'cleaned blood leaves'],
    'The spleen filters about 150-300 mL of blood per minute: macrophages remove old red cells (about 2 million per second) and bacteria, and its white pulp starts immune responses. It can store extra red cells and platelets.', cols=1, colors={1: 'pink', 3: 'gold'})
S['thymus'] = plot([fn('100*exp(-0.03*max(x-1,0))', 'functional thymus tissue (%)', 'gold')], [0, 90], [0, 105],
    'T cells learn to tell self from foreign in the thymus, which is most active in childhood and shrinks about 3% a year after that, replaced by fat. This is one reason immunity changes with age. Slide the age.',
    'age (years)', '% of childhood level', [P('a', 'age', 1, 90, 30, 'years')], [R('remaining', '100*exp(-0.03*max(a-1,0))', '%')], points=[{'x': 'a', 'y': '100*exp(-0.03*max(a-1,0))', 'label': ''}])
S['lymph_nodes'] = flow(['lymph enters (afferent)', 'sinus filters debris', 'B-cell follicles', 'T-cell zone', 'lymph leaves (efferent)'],
    'About 600 nodes are scattered along the lymph vessels, like checkpoints. Germs and antigens reach waiting B and T cells here, which is why nodes swell when you are fighting an infection.', cols=1, colors={2: 'accent', 3: 'gold'})
# ---------- skin ----------
S['skin'] = plot([fn('0.25+7*1/(1+exp(-(x-37.6)/0.25))', 'skin blood flow (L/min)', 'pink')], [36, 39], [0, 8],
    'The skin is a radiator: as core temperature rises, skin blood flow can climb from about 0.25 to 7 L/min (over half the cardiac output) so heat escapes; in the cold it shuts down. Slide the core temperature.',
    'core temperature (°C)', 'L/min', [P('T', 'core temperature', 36, 39, 37, '°C')], [R('skin blood flow', '0.25+7/(1+exp(-(T-37.6)/0.25))', 'L/min')], points=[{'x': 'T', 'y': '0.25+7/(1+exp(-(T-37.6)/0.25))', 'label': ''}])
S['epidermis'] = bars([('eyelid', 0.05, 'accent'), ('face', 0.1, 'accent'), ('back', 0.14, 'gold'), ('palm', 0.6, 'orange'), ('sole', 1.4, 'pink')],
    'The epidermis is thinnest on the eyelids (about 0.05 mm) and thickest on the soles (up to 1.5 mm), where the outer dead layer is built up by friction. It renews itself about every month.', ylabel='thickness (mm)')
S['dermis'] = plot([fn('0.5*(exp(k*x)-1)', 'skin stress', 'gold')], [0, 60], [0, 120],
    'Skin is soft at first (the coiled collagen straightens out) and then stiff, a J-shaped curve that protects against tearing. With age (higher stiffness factor) the curve steepens as the dermis loses elastin. Slide the stiffness.',
    'stretch (%)', 'relative stress', [P('k', 'stiffness factor (age)', 0.05, 0.12, 0.08, ''), P('s', 'stretch', 0, 60, 30, '%')], [R('stress', '0.5*(exp(k*s)-1)')], points=[{'x': 's', 'y': '0.5*(exp(k*s)-1)', 'label': ''}])
S['hair_follicle'] = plot([fn('x<A*12?x:(x<A*12+4?A*12:0)', 'hair length (cm)', 'orange')], [0, 96], [0, 90],
    'A hair grows about 1 cm a month during its long growth phase (2-7 years), which sets its maximum length. It then rests for about 3 months before it is shed and replaced. Slide the growth duration.',
    'months', 'cm', [P('A', 'growth phase (anagen)', 2, 7, 3, 'years')], [R('maximum length', 'A*12', 'cm')])
S['sweat_gland'] = plot([fn('(1.5+1.0*ac)/(1+exp(-(x-(37.4-0.4*ac))/0.3))', 'sweat rate (L/h)', 'accent')], [36, 39.5], [0, 3],
    'When core temperature climbs above about 37.4 °C, sweating switches on steeply (up to 1.5 L/h, or about 3 L/h after heat acclimatization). Each litre that evaporates removes about 670 W-hours of heat. Slide acclimatization.',
    'core temperature (°C)', 'L/h', [P('ac', 'acclimatization', 0, 1, 0, ''), P('T', 'core temperature', 36, 39.5, 38, '°C')], [R('sweat rate', '(1.5+1*ac)/(1+exp(-(T-(37.4-0.4*ac))/0.3))', 'L/h'), R('cooling power', '674*(1.5+1*ac)/(1+exp(-(T-(37.4-0.4*ac))/0.3))', 'W')], points=[{'x': 'T', 'y': '(1.5+1.0*ac)/(1+exp(-(T-(37.4-0.4*ac))/0.3))', 'label': ''}])
S['hypodermis'] = plot([fn('q*x/1000/0.2', 'temperature drop across fat (°C)', 'gold')], [0, 40], [0, 15],
    'Fat conducts heat poorly (thermal conductivity about 0.2 W/m·K), so a thicker layer drops the temperature more for the same heat flow: that is its insulation job, along with cushioning and storing energy. Slide the thickness and heat flow.',
    'fat layer thickness (mm)', '°C', [P('d', 'fat thickness', 2, 40, 10, 'mm'), P('q', 'heat flow', 30, 150, 55, 'W/m²')], [R('temperature drop', 'q*d/1000/0.2', '°C')], points=[{'x': 'd', 'y': 'q*d/1000/0.2', 'label': ''}])
# ---------- reproductive ----------
O_ = '(L-14)'
S['ovaries'] = plot([fn(f'40+180*exp(-sq((x-({O_}-1.5))/2.2))+110*exp(-sq((x-({O_}+7))/3))', 'estradiol', 'pink'), fn(f'8+90*exp(-sq((x-{O_})/0.8))', 'LH', 'gold'), fn(f'5+90*exp(-sq((x-({O_}+7))/3.5))*(x>{O_})', 'progesterone', 'green')], [0, 35], [0, 260],
    'The ovarian cycle runs on feedback between brain and ovary: rising estradiol triggers a short LH surge, which releases the egg (ovulation); the empty follicle then makes progesterone for about 14 days. The luteal phase stays at 14 days; the first half stretches. Slide the cycle length.',
    'cycle day', 'relative level', [P('L', 'cycle length', 21, 35, 28, 'days')], [R('ovulation on day', 'L-14')], vlines=[{'x': 'L-14', 'label': 'ovulation'}])
S['uterus'] = plot([fn('x<5?2:(x<L-14?2+8*(x-5)/(L-19):(x<L-0.5?10+4*(x-L+14)/14:2))', 'endometrium thickness (mm)', 'pink')], [0, 35], [0, 16],
    'The uterine lining thickens in two stages: estrogen in the first half rebuilds it from about 2 mm to 10 mm, and progesterone then makes it a receptive 12-14 mm. If no embryo arrives, hormones fall and the lining is shed (menstruation). Slide the cycle length.',
    'cycle day', 'mm', [P('L', 'cycle length', 21, 35, 28, 'days')], [R('thickest at day', 'L-0.5')], vlines=[{'x': 'L-14', 'label': 'ovulation'}])
S['testes'] = flow(['spermatogonium (stem)', 'primary spermatocyte', 'secondary spermatocyte', 'spermatid', 'sperm (74 days total)'],
    'The testes make about 1,000 sperm every second, taking about 74 days per batch, at 2-4 °C below body temperature (hence the scrotum). Leydig cells make testosterone in the spaces between tubules.', cols=1, colors={4: 'gold'})
