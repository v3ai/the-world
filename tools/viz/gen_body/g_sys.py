from lib import *
import math
S = {}

S['human_body'] = bars([('water', '(100-f)*0.73', 'accent'), ('protein', '(100-f)*0.2', 'pink'), ('fat', 'f', 'gold'), ('minerals', '(100-f)*0.07', 'dim')],
    'An adult body is about 60% water by mass, with the rest mostly protein, fat and the mineral of bone, built from about 30 trillion human cells (and a similar number of microbes). Fat is the variable part: slide it and the water share changes.', ylabel='% of body mass',
    params=[P('f', 'body fat', 5, 40, 18, '%')], readouts=[R('water in 70 kg body', '70*(100-f)*0.73/100', 'kg')])
S['skeletal_system'] = bars([('skull', 22, 'accent'), ('spine', 26, 'gold'), ('chest', 25, 'orange'), ('arms', 64, 'pink'), ('legs', 62, 'green'), ('ear/hyoid', 7, 'dim')],
    'Adults have 206 bones: 80 in the axial skeleton (skull, spine, chest) and 126 in the limbs. Babies are born with about 300, which fuse as they grow. Bones also store 99% of the body\'s calcium and make blood cells.', ylabel='number of bones')

# ---------- tissues ----------
S['dense_connective_tissue'] = bars([('tendon', 85, 'gold'), ('ligament', 70, 'accent'), ('dermis', 75, 'pink'), ('cornea', 70, 'green')],
    'Dense connective tissue is packed with parallel collagen, a rope-like protein: about 70-85% of its dry weight. That is why tendons and ligaments are so strong but poorly stretchy and heal slowly. Approximate collagen share of dry weight.', ylabel='% collagen of dry weight')
S['adipose_tissue'] = bars([('fat', '7700*kg', 'gold'), ('carbohydrate', 2000, 'accent')],
    'Fat stores about 9 kcal per gram, over twice as much as carbohydrate, and a lean adult carries about 100,000 kcal of it (more than 50 days of fasting) versus only about 2,000 kcal as glycogen. Slide the fat mass. Log scale.', ylabel='stored energy (kcal, log)', logy=True,
    params=[P('kg', 'body fat mass', 5, 40, 13, 'kg')], readouts=[R('energy in fat', '7700*kg', 'kcal'), R('days at 2000 kcal/day', '7700*kg/2000', 'days')])
S['cartilage_tissue'] = plot([fn('Hc*(1-exp(-x/tau))', 'cartilage compressed (%)', 'accent')], [0, 240], [0, 18],
    'Cartilage is a squishy gel: under steady load water slowly squeezes out and it compresses by about 10-15%, recovering when unloaded. This is why we are about 1 cm shorter at night and why cartilage needs movement to be nourished. Slide the load.',
    'minutes under load', '% compressed', [P('Hc', 'load', 5, 17, 12, '%'), P('tau', 'water flow time', 20, 100, 50, 'min')], [R('after 1 hour', 'Hc*(1-exp(-60/tau))', '%')])
sh = [circ(0, 0, 0.3, 'red', 'red', 0.8, 2)]
for r in (0.7, 1.0, 1.3, 1.6, 1.9, 2.2):
    sh.append(circ(0, 0, r, 'gold', None, 0.75, 1.5))
for k in range(12):
    for r, off in ((0.85, 0), (1.45, 0.25), (2.05, 0.5)):
        a = 2 * math.pi * (k + off) / 12
        sh.append(ell(r * math.cos(a), r * math.sin(a), 0.13, 0.08, 'accent', 'accent', 0.9, math.degrees(a) + 90, None, 8))
for k in range(12):
    a = 2 * math.pi * k / 12
    sh.append(line(0.35 * math.cos(a), 0.35 * math.sin(a), 2.15 * math.cos(a), 2.15 * math.sin(a), 'accent', 1, alpha=0.18))
sh.append(line(0.3, 0, 4.2, 0, 'red', 2, dash=True))
sh += [text(0, 0, '', 'red', 9), text(3.3, 0.35, 'Volkmann canal', 'red', 10), text(-3.0, 1.9, 'lamellae', 'gold', 10), text(-3.0, -1.5, 'osteocyte', 'accent', 10), text(0, -2.75, 'central canal: blood vessel + nerve', 'red', 10)]
S['bone_tissue'] = geo(sh, 'Compact bone is built from osteons: concentric layers (lamellae) of mineralised collagen wrapped around a central canal that carries blood, with osteocytes in tiny cavities linked by channels. The layered tube resists cracking.', (-4.3, 4.3, -3.1, 2.7))
S['bone_tissue']['shapes'] = [x for x in S['bone_tissue']['shapes'] if not (x['k'] == 'text' and x['text'] == '')]
S['blood_tissue'] = bars([('red cells', 5e6, 'pink'), ('platelets', 2.5e5, 'accent'), ('neutrophils', 4000, 'gold'), ('lymphocytes', 2500, 'green'), ('monocytes', 400, 'purple'), ('eosinophils', 200, 'orange'), ('basophils', 40, 'dim')],
    'In each microliter of blood there are about 5 million red cells, 250,000 platelets and only about 7,000 white cells in several types. Typical adult counts per µL, log scale.', ylabel='cells per µL (log)', logy=True)
S['skeletal_muscle_tissue'] = flow(['whole muscle (cm)', 'fascicle (mm)', 'muscle fiber (50 µm)', 'myofibril (1 µm)', 'sarcomere (2.5 µm)', 'actin + myosin (nm)'],
    'Muscle is organised in nested bundles, each wrapped in connective tissue, down to the molecular filaments. A single fibre can be 10 cm long and contain 100s of nuclei; a muscle shortens when about 100 billion sarcomeres shorten together.', cols=2, colors={4: 'gold'})
S['cardiac_muscle_tissue'] = bars([('SA node', 0.05, 'gold'), ('AV node', 0.05, 'orange'), ('atria', 1, 'accent'), ('ventricle', 0.5, 'pink'), ('Purkinje', 3, 'green')],
    'Heart muscle cells are joined end to end by intercalated discs, so an impulse spreads through them like one unit. Slow conduction through the AV node gives the atria time to empty; fast Purkinje fibers then fire the ventricle all at once. Speed in m/s, log scale.', ylabel='conduction speed (m/s, log)', logy=True)
S['smooth_muscle_tissue'] = plot([fn('(x/0.04)*exp(1-x/0.04)', 'skeletal (peak ~0.04 s)', 'accent'), fn('(x/0.2)*exp(1-x/0.2)', 'cardiac (~0.2 s)', 'pink'), fn('(x/3)*exp(1-x/3)', 'smooth (~3 s)', 'gold')], [0.01, 30], [0, 1.1],
    'Smooth muscle contracts about 100 times more slowly than skeletal muscle but can hold tension for minutes at very little energy cost, ideal for vessel walls and the gut. The time axis is logarithmic.',
    'time after stimulus (s)', 'relative force', logx=True)
S['nervous_tissue'] = bars([('neurons', 86, 'accent'), ('glia', 85, 'gold')],
    'The brain has about 86 billion neurons and about the same number of supporting glial cells (not the 10:1 once taught). Neurons do the signaling; glia insulate, feed and protect them. Billions of cells.', ylabel='billions of cells')
S['simple_squamous_epithelium'] = plot([fn('2.5e-4*x^2', 'diffusion time (s)', 'accent')], [0.1, 1000], [1e-6, 1000],
    'Diffusion time grows with the square of distance (t = x²/2D), so exchange surfaces must be very thin: the alveolar-capillary barrier is only about 0.5 µm and gases cross in milliseconds, while 1 mm would take minutes. Slide the distance.',
    'distance (µm, log)', 'seconds (log)', [P('d', 'distance', 0.2, 1000, 0.5, 'µm')], [R('time for oxygen', '2.5e-4*d^2', 's')], logx=True, logy=True, points=[{'x': 'd', 'y': '2.5e-4*d^2', 'label': ''}])
S['simple_columnar_epithelium'] = flow(['glucose + Na+ at brush border', 'Na+ pumped out at base', 'glucose into cell', 'leaves via GLUT2', 'enters blood'],
    'Tall columnar cells are polarised: one side (the top) has transporters that take up nutrients, and the other side exports them. Tight junctions between cells keep the gut contents out, and goblet cells add protective mucus.', cols=1, colors={1: 'gold'})
# stratified squamous
sh = [line(-4.6, -2.9, 4.6, -2.9, 'white', 3), text(-4.6, -3.25, 'basement membrane', 'white', 10, 'left')]
rows = [(-2.3, 0.45, 0.5, 'accent', 0.5), (-1.45, 0.55, 0.4, 'accent', 0.4), (-0.7, 0.62, 0.3, 'green', 0.35), (-0.1, 0.7, 0.22, 'gold', 0.3), (0.45, 0.9, 0.12, 'orange', 0.0), (0.8, 0.9, 0.1, 'orange', 0.0), (1.15, 0.9, 0.09, 'orange', 0.0)]
for ri, (y, rx, ry, c, nuc) in enumerate(rows):
    n = int(9.2 / (2 * rx))
    for i in range(n):
        x = -4.6 + rx + i * 2 * rx + (rx * 0.5 if ri % 2 else 0)
        if x + rx > 4.7: continue
        if nuc:
            sh.append(ell(x, y, rx * 0.95, ry * 0.95, c, c, 0.28, 0, 1, 8))
            sh.append(circ(x, y, min(rx * 0.35, 0.16), 'white', 'white', 0.5, 1))
        else:
            sh.append(rect(x - rx * 0.95, y - ry, rx * 1.9, ry * 2, c, c, 0.3, 1))
sh += [text(4.7, -2.3, 'basal: divide', 'accent', 10, 'right'), text(4.7, -0.7, 'middle: bind', 'green', 10, 'right'), text(4.7, 1.9, 'flat, dead surface', 'orange', 10, 'right'), text(4.7, 2.55, 'cells climb up (skin: ~28 days)', 'dim', 10, 'right')]
S['stratified_squamous_epithelium'] = geo(sh, 'Many layers protect against wear: the base cells divide and push older cells upward, where they flatten and lose their nuclei. Skin, mouth, esophagus and vagina use this design, so scrapes are replaced from below.', (-4.8, 4.8, -3.5, 2.9))
FL_ = 'f'
sh = [line(-4.6, -1.9, 4.6, -1.9, 'white', 3), text(-4.6, -2.25, 'basement membrane', 'white', 10, 'left'), text(4.6, 1.9, 'urine (lumen)', 'gold', 10, 'right')]
for i in range(8):
    xo = f'({i}-3.5)*(0.62+0.7*f)'
    sh.append({'k': 'poly', 'pts': [[f'{xo}-(0.3+0.34*f)', 0.9], [f'{xo}+(0.3+0.34*f)', 0.9], [f'{xo}+(0.3+0.34*f)', f'0.9+0.55-0.4*f'], [f'{xo}-(0.3+0.34*f)', f'0.9+0.55-0.4*f']], 'color': 'gold', 'fill': 'gold', 'alpha': 0.4, 'width': 1.5})
    sh.append(ell(0, 0.0, 0.01, 0.01, 'accent', None, 0.0)) if False else None
    sh.append({'k': 'poly', 'pts': [[f'{xo}-(0.34-0.1*f)', 0.1], [f'{xo}+(0.34-0.1*f)', 0.1], [f'{xo}+(0.34-0.1*f)', f'0.1+0.7-0.35*f'], [f'{xo}-(0.34-0.1*f)', f'0.1+0.7-0.35*f']], 'color': 'accent', 'fill': 'accent', 'alpha': 0.3, 'width': 1.2})
    sh.append({'k': 'poly', 'pts': [[f'{xo}-0.3', -0.9], [f'{xo}+0.3', -0.9], [f'{xo}+0.3', -0.3], [f'{xo}-0.3', -0.3]], 'color': 'green', 'fill': 'green', 'alpha': 0.3, 'width': 1.2})
sh = [x for x in sh if x]
sh += [text(-4.6, 1.2, 'umbrella cells', 'gold', 10, 'left'), text(-4.6, 0.4, 'intermediate', 'accent', 10, 'left'), text(-4.6, -0.6, 'basal', 'green', 10, 'left')]
S['transitional_epithelium'] = geo(sh, 'The bladder lining adapts to being empty or full. Slide the filling: when stretched the dome-shaped surface cells flatten and the layers thin from about 6 cell layers to 2-3, without tearing or leaking.', (-4.8, 4.8, -2.9, 2.6),
    params=[P('f', 'bladder filling', 0, 1, 0, '')], readouts=[R('cell layers', '6-3*f', '')])
