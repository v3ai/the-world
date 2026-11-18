from lib import *
import math
S = {}

# ---------- muscles ----------
CAP = 'Drag the joint angle: the red muscle shortens or lengthens and its leverage (moment arm, the distance from the joint to the muscle line) changes. Torque = force x moment arm; try raising the force.'
S['biceps_brachii'] = jointfig('shoulder', 'forearm', 90, 1, 2.8, 0.35, 0.2, 'The biceps pulls the forearm up (flexion). Its leverage is greatest near a right angle, about 3.5-4 cm. A 600 N pull gives roughly 20 N·m of elbow torque. Drag the elbow angle and the force.', 140, 600, 3.0, 2.9, thdef=70, muscle='biceps', thlabel='elbow flexion')
S['triceps_brachii'] = jointfig('shoulder', 'forearm', 90, 1, 2.5, -0.2, -0.25, 'The triceps lies behind the elbow and straightens it. As you bend the elbow the muscle is stretched; drag the angle to see its length and leverage change.', 140, 900, 3.0, 2.9, thdef=70, muscle='triceps', thlabel='elbow flexion')
S['deltoid'] = jointfig('trunk', 'arm', 90, 1, 0.2, 1.5, 0.3, 'The deltoid lifts the arm out to the side (abduction). Its leverage changes as the arm rises; watch the moment arm and torque readouts.', 120, 800, 3.0, 3.0, thdef=30, muscle='deltoid', thlabel='arm raised sideways')
S['pectoralis_major'] = jointfig('trunk', 'arm', 90, 1, 0.4, 1.0, (0.7, 0.25), 'The pectoralis major pulls the arm forward and across the chest, as in a push-up or throw. Drag the arm forward to see the muscle shorten.', 120, 900, 3.0, 3.0, thdef=30, muscle='pectoralis', thlabel='arm raised forward')
S['latissimus_dorsi'] = jointfig('trunk', 'arm', 90, -1, -2.0, 0.8, (-0.8, 0.1), 'The latissimus pulls the raised arm down and back, as in a pull-up or rowing. Swing the arm backward (extension) and watch the muscle shorten.', 60, 900, 3.0, 3.0, thdef=20, muscle='latissimus', thlabel='arm swung back')
S['trapezius'] = jointfig('thorax', 'head', 270, 1, 2.0, 1.2, (0.3, 0.4), 'The upper trapezius tilts the head backward (and raises the shoulder). Move the head back: the muscle shortens and its moment arm changes.', 50, 400, 3.0, 2.0, rng=(-3.4, 3.4, -3.4, 3.4), thdef=20, muscle='trapezius', thlabel='head tilted back')
S['sternocleidomastoid'] = jointfig('thorax', 'head', 270, -1, 0.5, 1.2, (-0.5, -0.2), 'The two sternocleidomastoids bend the head forward; one alone turns and tilts it. Drag the nod angle to see it shorten.', 60, 250, 3.0, 2.0, rng=(-3.4, 3.4, -3.4, 3.4), thdef=25, muscle='SCM', thlabel='head bowed forward')
S['rectus_abdominis'] = jointfig('pelvis', 'trunk', 270, -1, 0.8, 2.2, -1.0, 'The strap-like rectus abdominis lies in front of the spine and curls the trunk forward (a sit-up). It is far from the pivot, so it has a long lever arm of about 10 cm.', 80, 1000, 2.5, 3.0, rng=(-4.2, 4.2, -3.2, 3.8), thdef=30, muscle='rectus abdominis', thlabel='trunk bent forward')
S['external_obliques'] = jointfig('pelvis', 'trunk', 270, -1, 0.6, 1.9, (-0.9, -1.0), 'The external obliques run diagonally along the side of the trunk. One side alone bends the trunk to that side; both together flex it, and diagonal pairs twist it. Side view simplified.', 50, 900, 2.5, 3.0, rng=(-4.2, 4.2, -3.2, 3.8), thdef=20, muscle='external oblique', thlabel='trunk bent')
S['quadriceps'] = jointfig('thigh', 'shin', 90, -1, 4.0, 0.5, (0.5, 0.35), 'The four quadriceps heads straighten the knee through the patella and patellar tendon. Bend the knee: the muscle stretches. Raise the force to see how the knee torque grows.', 120, 2000, 4.5, 4.0, rng=(-5, 5, -4.6, 5.0), thdef=60, muscle='quadriceps', thlabel='knee flexion')
S['hamstrings'] = jointfig('thigh', 'shin', 90, -1, 4.2, 0.6, (-0.5, -0.3), 'The hamstrings run behind the knee: they bend it and extend the hip. Flex the knee and the muscle shortens, which is why they cramp easily at full shortening.', 120, 1500, 4.5, 4.0, rng=(-5, 5, -4.6, 5.0), thdef=40, muscle='hamstrings', thlabel='knee flexion')
S['gastrocnemius'] = jointfig('shin', 'foot', 90, -1, 3.5, -0.5, (-0.4, -0.3), 'The calf muscle pulls on the heel through the Achilles tendon and points the foot (plantarflexion), as in a heel raise. A 3000 N pull on a 5 cm lever gives about 150 N·m.', 50, 3000, 3.8, 2.4, rng=(-4.2, 4.2, -4.2, 4.6), thdef=10, muscle='gastrocnemius', off=90, thlabel='toes pointed down')
S['gluteus_maximus'] = jointfig('trunk', 'thigh', 90, 1, 1.0, 1.2, (-0.8, -0.4), 'The gluteus maximus is the body\'s biggest muscle and the main hip extensor, used in climbing and sprinting. Flexing the hip (lifting the thigh forward) stretches it.', 120, 1500, 3.0, 4.0, rng=(-4.5, 4.5, -4.6, 3.6), thdef=40, muscle='gluteus maximus', thlabel='hip flexion')
# tendon
S['tendon'] = plot([fn('(x<=10)*(x<2?2.5*x*x:10+14*(x-2))', 'stress (MPa)', 'gold')], [0, 12], [0, 110],
    'Pull a tendon: first the crimped collagen straightens (flat toe), then it stiffens (a stiffness of about 1 GPa) and fails near 10% strain at about 100 MPa. Drag the strain; tendons store and return elastic energy.',
    'strain (%)', 'stress (MPa)', [P('e', 'stretch', 0, 10, 4, '%')], [R('stress', 'e<2?2.5*e*e:10+14*(e-2)', 'MPa'), R('safe working range', '4', '% strain')], points=[{'x': 'e', 'y': 'e<2?2.5*e*e:10+14*(e-2)', 'label': ''}], vlines=[{'x': 10, 'label': 'rupture'}])
# synapse geometry animated
sh = [rect(-4, 1.2, 8, 1.5, 'accent', 'accent', 0.16, 1.5), rect(-4, -2.7, 8, 1.5, 'pink', 'pink', 0.16, 1.5), line(-4, 1.2, 4, 1.2, 'accent', 2), line(-4, -1.2, 4, -1.2, 'pink', 2)]
for i in range(5):
    x = -2.8 + i * 1.4
    sh.append(circ(x, 2.0, 0.28, 'gold', 'gold', 0.5))
    sh.append(rect(x - 0.18, -1.28, 0.36, 0.16, 'green', 'green', 0.9, 1))
    for k in range(3):
        sh.append(pt(f'{x}+0.25*sin({k*2+i}+3*t)', f'1.1-mod(t*0.5+{k/3+i*0.13},1)*2.2', 'gold', 3, when=f'mod(t*0.5+{i*0.13},1)>0.0'))
sh += [text(-3.9, 2.5, 'presynaptic terminal', 'accent', 10, 'left'), text(-3.9, -2.5, 'postsynaptic cell', 'pink', 10, 'left'), text(3.9, 0, 'cleft ~20 nm', 'white', 10, 'right'), text(3.9, 1.7, 'vesicles', 'gold', 10, 'right'), text(3.9, -1.7, 'receptors', 'green', 10, 'right')]
S['synapse'] = geo(sh, 'Vesicles in the sending terminal release transmitter (gold dots) across the tiny gap, where it binds receptors (green) on the receiving cell. The cleft is only about 20 nm wide, so crossing takes under a millisecond.', (-4.2, 4.2, -3.0, 3.0))

# ---------- skeleton ----------
S['skull'] = bars([('cranium', 8, 'accent'), ('face', 14, 'gold'), ('ear ossicles', 6, 'pink')],
    'The skull has 22 bones (8 cranial, 14 facial) fused by immovable sutures, except the mandible. Each ear also holds three tiny ossicles (6 in total), the smallest bones in the body.', ylabel='number of bones')
S['mandible'] = plot([fn('Fm*3.5/x', 'bite force (N)', 'pink')], [3.5, 10], [0, 900],
    'The jaw is a lever with the pivot (joint) at one end and the muscles close to it, so biting is strongest at the back teeth and weakest at the front. Move the tooth position or the muscle force.',
    'distance from jaw joint (cm)', 'bite force (N)', [P('Fm', 'muscle force (masseter + temporalis)', 300, 1500, 800, 'N'), P('d', 'tooth position', 4, 10, 5.5, 'cm')],
    [R('bite force at this tooth', 'Fm*3.5/d', 'N')], points=[{'x': 'd', 'y': 'Fm*3.5/d', 'label': ''}], vlines=[{'x': 5.5, 'label': 'molar'}, {'x': 9, 'label': 'incisor'}])
S['cervical_spine'] = bars([('flexion', 50, 'accent'), ('extension', 60, 'accent'), ('rotation', 80, 'gold'), ('side bend', 45, 'pink')],
    'Seven small vertebrae make the neck the most mobile part of the spine. The top two (atlas and axis) alone give about half of the head\'s rotation. Typical range in each direction, degrees.', ylabel='range of motion (degrees)')
S['thoracic_spine'] = bars([('neck', 80, 'dim'), ('chest', 35, 'gold'), ('low back', 10, 'dim')],
    'The 12 thoracic vertebrae carry the ribs. The rib cage stiffens this part of the spine for bending, but allows about 35° of twist to each side, more than the lumbar spine. Rotation to one side by region.', ylabel='rotation to one side (degrees)')
S['lumbar_spine'] = bars([('lying', 25, 'green'), ('standing', 100, 'gold'), ('sitting', 140, 'orange'), ('bent forward', 220, 'pink'), ('lifting bent', 275, 'red')],
    'The five lumbar vertebrae carry most of the body\'s weight, and the pressure inside the discs depends on posture. Lifting with a bent back loads the discs nearly three times as much as standing (standing = 100).', ylabel='disc pressure (standing = 100)')
S['sacrum'] = bars([('neck', 7, 'accent'), ('chest', 12, 'accent'), ('low back', 5, 'accent'), ('sacrum', 5, 'gold'), ('coccyx', 4, 'orange')],
    'The sacrum is five vertebrae fused into one wedge, wedged between the hip bones; with the coccyx (3-5 fused) it ends the 33 vertebrae of the spine. Number of vertebrae per region.', ylabel='vertebrae')
PH = '(0.5-0.5*cos(1.6*t))'
sh = [curve(f'3.7*(1+0.07*D*{PH})*cos(s)', f'2.5*(1+0.07*D*{PH})*sin(s)', [0, 6.2832], 'white', 4),
      curve(f'-1.75+(0.07*D*{PH})*(-1)+1.45*cos(s)*(1+0.12*D*{PH})', f'0.1+1.55*sin(s)*(1+0.1*D*{PH})', [0, 6.2832], 'accent', 2),
      curve(f'1.75+(0.07*D*{PH})+1.45*cos(s)*(1+0.12*D*{PH})', f'0.1+1.55*sin(s)*(1+0.1*D*{PH})', [0, 6.2832], 'accent', 2),
      circ(0, -1.95, 0.45, 'gold', 'gold', 0.6), rect(-0.4, f'2.5*(1+0.07*D*{PH})-0.15', 0.8, 0.3, 'gold', 'gold', 0.8),
      text(0, 2.95, 'sternum', 'gold', 10), text(0, -2.85, 'spine', 'gold', 10), text(0, 0.1, 'heart', 'pink', 10), text(-1.75, 0.1, 'lung', 'accent', 10), text(1.75, 0.1, 'lung', 'accent', 10), text(-4.3, 0.5, 'ribs', 'white', 10)]
sh[3] = circ(0, -1.95, 0.45, 'gold', 'gold', 0.6)
S['ribcage'] = geo(sh, 'Seen from above (a horizontal slice), breathing in swings the ribs up and out like bucket handles: the chest grows front-to-back and side-to-side, and the lungs expand into the extra space.', (-5, 5, -3.3, 3.4),
    params=[P('D', 'breath depth', 0.5, 3, 1.2, 'x quiet')], readouts=[R('chest circumference gain', '2*D', 'cm')])
S['sternum'] = bars([('manubrium', 5.5, 'accent'), ('body', 10, 'gold'), ('xiphoid', 2.5, 'pink')],
    'The breastbone (about 17 cm) has three parts. In CPR the rescuer presses the body of the sternum about 5-6 cm to squeeze the heart. Typical length of each part.', ylabel='length (cm)')
S['pelvis'] = flow(['spine (L5)', 'sacrum', 'sacroiliac joints', 'two hip bones', 'hip joints', 'thigh bones'],
    'The pelvic ring carries upper-body weight down into the legs and also protects the pelvic organs. Weight flows from the spine through the sacrum and sacroiliac joints to the hip bones, then out through the hip sockets to the femurs.', cols=2, colors={1: 'gold', 3: 'gold'})
S['clavicle_l'] = flow(['arm and hand', 'scapula', 'collarbone', 'sternum', 'rib cage'],
    'The collarbone is the only bony strut linking the arm to the trunk. It holds the shoulder out to the side and passes forces from the arm to the chest, which is why falls on an outstretched hand often break it.', cols=2, colors={2: 'gold'})
S['scapula_l'] = plot([fn('x*2/3', 'shoulder joint (glenohumeral)', 'accent'), fn('x/3', 'shoulder blade (scapulothoracic)', 'gold'), fn('x', 'total arm elevation', 'white', dash=True)], [0, 180], [0, 185],
    'Raising the arm overhead is shared: about 2° at the shoulder joint for every 1° the blade rotates on the back. Drag the arm angle to see the split.',
    'arm elevation (°)', 'degrees', [P('a', 'arm elevation', 0, 180, 90, '°')], [R('at the joint', 'a*2/3', '°'), R('blade rotation', 'a/3', '°')], vlines=[{'x': 'a', 'label': ''}])
LB = {'humerus': ('humerus', 0.19), 'radius': ('radius', 0.145), 'femur': ('femur', 0.267), 'tibia': ('tibia', 0.22)}
def stat(hl, cap):
    items = [(n, f'{p}*H', 'gold' if k == hl else 'accent') for k, (n, p) in LB.items()]
    return bars(items, cap, ylabel='bone length (cm)', params=[P('H', 'body height', 140, 200, 170, 'cm')], readouts=[R('estimated length', f'{LB[hl][1]}*H', 'cm')])
S['humerus_l'] = stat('humerus', 'The humerus is about 19% of body height (about 32 cm in a 170 cm adult). The ratios are stable enough that forensic scientists estimate height from a single long bone. Slide the height.')
S['radius_ulna_l'] = stat('radius', 'The radius is about 14.5% of body height. The forearm bones cross over each other (pronation), letting you turn the palm up or down without moving the elbow. Slide the height.')
S['tibia_fibula_l'] = stat('tibia', 'The weight-bearing tibia is about 22% of body height; the slim fibula carries only about 6-17% of the load. Forensic estimates of stature use these ratios. Slide the height.')
sh = [('standing, 2 legs', '0.3*m*9.81/1000', 'green'), ('one leg', '2.5*m*9.81/1000', 'gold'), ('walking', '3*m*9.81/1000', 'orange'), ('stairs', '4*m*9.81/1000', 'pink'), ('running', '5*m*9.81/1000', 'red')]
S['femur_l'] = bars([('2 legs', sh[0][1], 'green'), ('1 leg', sh[1][1], 'gold'), ('walking', sh[2][1], 'orange'), ('stairs', sh[3][1], 'pink'), ('running', sh[4][1], 'red')],
    'The femur\'s head carries the whole upper body through the hip. The joint force is several times body weight in everyday movement (the muscles add to it): about 3 times in walking and 5 or more in running. Slide the body mass.', ylabel='hip force (kN)',
    params=[P('m', 'body mass', 40, 120, 70, 'kg')], readouts=[R('body weight', 'm*9.81', 'N'), R('walking peak', '3*m*9.81', 'N')])
S['patella_l'] = plot([fn('3.3*(x/90)^2', 'force on kneecap joint (x body weight)', 'pink')], [0, 120], [0, 6],
    'The kneecap shifts the quadriceps pull forward, increasing its leverage, but the squeeze on the joint behind it grows steeply with knee bend: about 0.4 body weight at 30°, about 3 at 90° in a squat (approximate). Drag the angle.',
    'knee bend (°)', 'x body weight', [P('k', 'knee bend', 0, 120, 60, '°'), P('m', 'body mass', 40, 120, 70, 'kg')], [R('joint force', '3.3*(k/90)^2*m*9.81', 'N')], points=[{'x': 'k', 'y': '3.3*(k/90)^2', 'label': ''}])
S['hand_bones_l'] = bars([('wrist', 8, 'accent'), ('palm', 5, 'gold'), ('fingers', 14, 'pink')], 'Each hand holds 27 bones (8 carpals in the wrist, 5 metacarpals in the palm, 14 phalanges in the fingers), a quarter of all the bones in the body for only about 2% of its mass: the price of fine dexterity.', ylabel='number of bones')
S['foot_bones_l'] = bars([('ankle/heel', 7, 'accent'), ('midfoot', 5, 'gold'), ('toes', 14, 'pink')], 'Each foot has 26 bones (7 tarsals, 5 metatarsals, 14 phalanges) arranged in arches that act as springs, storing and returning about 17% of the energy of each running stride.', ylabel='number of bones')
# long bone section
sh = [rect(-0.9, -1.9, 1.8, 3.8, 'gold', 'gold', 0.5, 1), rect(-0.55, -1.9, 1.1, 3.8, 'pink', 'pink', 0.55, 0)]
for ys in (1, -1):
    sh.append(poly([(-1.6, ys * 2.0), (1.6, ys * 2.0), (1.45, ys * 3.1), (-1.45, ys * 3.1)], 'gold', 'gold', 0.3, 2))
    sh.append(poly([(-1.5, ys * 3.1), (1.5, ys * 3.1), (1.4, ys * 3.4), (-1.4, ys * 3.4)], 'accent', 'accent', 0.7, 1.5))
    for i in range(6):
        sh.append(line(-1.3 + i * 0.5, ys * 2.1, -1.0 + i * 0.5, ys * 3.0, 'gold', 1, alpha=0.8)); sh.append(line(-1.0 + i * 0.5, ys * 2.1, -1.3 + i * 0.5, ys * 3.0, 'gold', 1, alpha=0.8))
    sh.append(line(-1.6, ys * 1.95, 1.6, ys * 1.95, 'white', 2, dash=True))
sh += tag('compact bone', -3.8, 0.6, -0.75, 0.6, 'gold', 'left')[:0]
sh += tag('compact bone', -3.9, 0.9, -0.75, 0.9, 'gold', 'left') + tag('marrow cavity', 3.9, -0.4, 0.0, -0.4, 'pink', 'right') + tag('spongy bone', -3.9, 2.6, -1.0, 2.6, 'gold', 'left') + tag('growth plate', 3.9, 1.95, 1.6, 1.95, 'white', 'right') + tag('cartilage cap', -3.9, 3.25, -1.2, 3.25, 'accent', 'left') + tag('shaft (diaphysis)', 3.9, 1.0, 0.9, 1.0, 'white', 'right') + tag('end (epiphysis)', 3.9, 2.8, 1.45, 2.8, 'white', 'right')
S['long_bone'] = geo(sh, 'A long bone is a light, strong tube: a hard shell of compact bone around a marrow cavity in the shaft, with spongy bone at the ends and a cartilage cap where it forms a joint. The dashed lines are growth plates.', (-5, 5, -3.7, 3.7))
S['compact_bone'] = bars([('spongy', 5, 'accent'), ('concrete', 30, 'dim'), ('oak', 50, 'dim'), ('compact', 170, 'gold'), ('steel', 250, 'dim')],
    'Compact bone (gold) resists crushing nearly as well as steel (170 MPa vs about 250) at a quarter of the weight, thanks to its mineral-and-collagen composite. Typical compressive strength, log scale.', ylabel='strength (MPa, log)', logy=True)
S['spongy_bone'] = plot([fn('170*(x/1.85)^2', 'strength (MPa)', 'gold')], [0.1, 1.9], [0, 180],
    'Spongy bone is a lattice with a density of only 0.2-0.8 g/cm³ versus 1.9 for compact bone, yet its strength rises with the square of the density. Doubling the density quadruples its strength. Slide the density.',
    'apparent density (g/cm³)', 'MPa', [P('r', 'bone density', 0.1, 1.9, 0.4, 'g/cm³')], [R('compressive strength', '170*(r/1.85)^2', 'MPa')], points=[{'x': 'r', 'y': '170*(r/1.85)^2', 'label': ''}])
S['bone_marrow'] = bars([('red cells', 2e11, 'pink'), ('platelets', 1e11, 'accent'), ('neutrophils', 1e11, 'gold'), ('lymphocytes', 1e10, 'green')],
    'Red marrow produces roughly 200 billion red cells, 100 billion platelets and 100 billion neutrophils every day (about 5 million new cells per second). Approximate daily production, log scale.', ylabel='new cells per day (log)', logy=True)
S['periosteum'] = flow(['outer fibrous layer', 'blood vessels, nerves in', 'inner cell layer', 'osteoblasts add bone', 'bone gets wider'],
    'The periosteum is the bone\'s skin: its tough outer layer anchors tendons and carries nerves (why a bone bruise hurts) and its inner layer holds cells that build new bone, which also lets a broken bone heal.', cols=1, colors={3: 'gold'})
S['growth_plate'] = plot([fn('(0.8+22*exp(-x/0.9)+(' + '9*exp(-sq((x-Pk)/1.5))' + '))/(1+exp((x-Pk-3)*1.5))', 'growth rate (cm/year)', 'gold')], [0, 20], [0, 28],
    'A cartilage plate near each end of the bone keeps adding length until hormones at the end of puberty turn it to bone. Growth is fast in infancy, then settles to about 5-6 cm a year, with a puberty spurt of 8-10 cm. Slide the spurt age.',
    'age (years)', 'cm per year', [P('Pk', 'age of puberty spurt', 10, 15, 13, 'years')], [R('growth stops at about', 'Pk+3', 'years')])
S['synovial_joint'] = bars([('synovial joint', 0.01, 'accent'), ('ice on ice', 0.03, 'dim'), ('wood on wood', 0.4, 'dim'), ('rubber on road', 1.0, 'dim')],
    'Lubricated by synovial fluid, cartilage slides against cartilage with a friction coefficient of about 0.01, slicker than ice. Healthy joints can last 80 years of walking. Log scale.', ylabel='friction coefficient (log)', logy=True)
