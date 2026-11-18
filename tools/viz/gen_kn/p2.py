from lib import *
import math

# ---------- ELECTROMAGNETISM ----------
plot('coulomb_law', 'The force between two charges falls as 1/r² and is proportional to the product of the charges. Two 1 µC charges 10 cm apart push each other with about 0.9 N.',
     [F('8.988e9*q1*q2*1e-12/(x*1e-2)^2', 'F = kq₁q₂/r²', 'accent')], x=[2, 30], y=[0, 30], xlabel='separation (cm)', ylabel='force (N)',
     params=[P('q1', 'charge 1', 0.2, 3, 1, 'µC'), P('q2', 'charge 2', 0.2, 3, 1, 'µC'), P('r', 'separation', 2, 30, 10, 'cm')],
     points=[dict(x='r', y='8.988e9*q1*q2*1e-12/(r*1e-2)^2', label='{8.988e9*q1*q2*1e-12/(r*1e-2)^2} N')],
     readouts=[R('force', '8.988e9*q1*q2*1e-12/(r*1e-2)^2', 'N')])

add('electric_fields', dict(type='heatmap', f='1/(hypot(x-d/2,y)+0.04)-1/(hypot(x+d/2,y)+0.04)', x=[-3, 3], y=[-2, 2], z=[-6, 6], colormap='diverging', equal=True,
    params=[P('d', 'charge separation', 0.5, 3, 1.5)],
    caption='Electric potential of a positive (red) and a negative (blue) charge, a dipole. Fields point from high to low potential; move the charges apart to widen the dipole.'))

plot('circuits_ohm', 'Two resistors in series split the voltage: V_out = V·R₂/(R₁+R₂). Kirchhoff\'s rules say the same current flows through both. Slide R₂ and see where V_out lands.',
     [F('V*x/(R1+x)', 'V_out', 'accent')], x=[0, 1000], y=[0, 12], xlabel='R₂ (Ω)', ylabel='output voltage (V)',
     params=[P('V', 'supply', 3, 12, 9, 'V'), P('R1', 'R₁', 100, 1000, 470, 'Ω'), P('R2', 'R₂', 0, 1000, 330, 'Ω')],
     points=[dict(x='R2', y='V*R2/(R1+R2)', label='{V*R2/(R1+R2)} V')],
     readouts=[R('V_out', 'V*R2/(R1+R2)', 'V'), R('current', '1000*V/(R1+R2)', 'mA'), R('power', 'V^2/(R1+R2)*1000', 'mW')])

add('magnetism_force', dict(type='parametric', range=[-6, 6, -6, 6], curves=[dict(x='0.569*v/B*cos(s)', y='0.569*v/B*sin(s)', s=[0, 6.2832], color='accent', dot='t*B*0.3')],
    shapes=[T(0, 0, 'B into page', 'dim', 10)],
    params=[P('v', 'speed', 1, 10, 4, '×10⁶ m/s'), P('B', 'field B', 1, 10, 3, 'mT')],
    readouts=[R('radius mv/qB', '0.569*v/B', 'cm'), R('cyclotron frequency', '28*B', 'MHz')],
    caption='A charged particle (here an electron) moves in a circle in a magnetic field because the force is always sideways. A stronger field or slower particle gives a tighter circle.'))

plot('induction_generators', 'Spin a coil in a magnetic field and a voltage appears (Faraday\'s law): peak EMF = N·B·A·ω. Spin faster or add turns for more voltage. This is how a generator works.',
     [F('N*0.5*0.01*2*pi*f*sin(2*pi*f*x)', 'EMF', 'gold')], x=[0, 0.1], xlabel='time (s)', ylabel='EMF (V)', y=['-N*0.5*0.01*2*pi*100*1.1', 'N*0.5*0.01*2*pi*100*1.1'],
     params=[P('f', 'rotation rate', 10, 100, 50, 'Hz'), P('N', 'turns', 10, 200, 100, step=10)],
     points=[dict(x='mod(t*0.05,0.1)', y='N*0.5*0.01*2*pi*f*sin(2*pi*f*mod(t*0.05,0.1))')],
     readouts=[R('peak voltage', 'N*0.5*0.01*2*pi*f', 'V')])
S['induction_generators']['y'] = [-330, 330]
S['induction_generators']['y'] = ['-3.4*100*1.1*0.5*0.01*2*pi*10/pi/2*0+(-340)', 340]
S['induction_generators']['y'] = [-340, 340]

blocks('maxwell', 'Maxwell\'s equations tie electricity and magnetism together: charges make E, currents make B, and a changing B makes E (Faraday) while a changing E makes B. That loop is light.',
       [('rho', 'Charges ρ', 8, 14, 'pink'), ('j', 'Currents J', 8, 86, 'pink'), ('e', 'Electric field E', 50, 14, 'accent'), ('b', 'Magnetic field B', 50, 86, 'accent'), ('w', 'EM wave', 92, 50, 'gold')],
       [('rho', 'e', 'Gauss'), ('j', 'b', 'Ampère'), ('b', 'e', 'Faraday'), ('e', 'b', 'Maxwell term'), ('e', 'w'), ('b', 'w')], aspect=0.62)

bars('electromagnetic_waves', 'The electromagnetic spectrum is one phenomenon with wavelengths from kilometres to smaller than atoms; visible light is a sliver near 500 nm. All travel at c; f = c/λ.',
     [('radio', 1, 'orange'), ('micro-wave', 0.01, 'orange'), ('infrared', 1e-5, 'red'), ('visible', 5.5e-7, 'green'), ('UV', 1e-7, 'purple'), ('X-ray', 1e-10, 'blue'), ('gamma', 1e-12, 'blue')],
     logy=True, ylabel='typical wavelength (m)')

shp = [L(-8, 0, 8, 0, 'dim', 1), L(0, -2.6, 0, 2.6, 'white', 3), T(0, 2.9, 'lens', 'white', 10),
       A('-do', 0, '-do', 1, 'gold', 3), T('-do', 1.3, 'object', 'gold', 10),
       Pt('-f', 0, 'dim', 4), Pt('f', 0, 'dim', 4),
       A('di', 0, 'di', '-di/do', 'pink', 3), T('di', '-di/do-0.3', 'image', 'pink', 10),
       L('-do', 1, 0, 1, 'accent', 1.5), L(0, 1, 'di', '-di/do', 'accent', 1.5),
       L('-do', 1, 'di', '-di/do', 'green', 1.5),
       L('-do', 1, 0, '-f/(do-f)', 'purple', 1.5), L(0, '-f/(do-f)', 'di', '-di/do', 'purple', 1.5)]
geo('optics_geometric', 'A converging lens focuses parallel rays at its focal point and forms an inverted real image. Move the object closer than 2f and the image grows larger than the object.',
    [-8, 8, -2.8, 3.2], shp, params=[P('f', 'focal length f', 1, 2, 1.5), P('do', 'object distance', 3, 7, 4.5)],
    readouts=[R('image distance', 'f*do/(do-f)'), R('magnification', '-f/(do-f)')], aspect=0.55)
S['optics_geometric']['shapes'] = [dict(s) for s in S['optics_geometric']['shapes']]
for s in S['optics_geometric']['shapes']:
    for k, v in list(s.items()):
        if isinstance(v, str) and k not in ('k', 'color', 'text'): s[k] = v.replace('di', '(f*do/(do-f))')
        if k == 'text' and False: pass

add('wave_optics', dict(type='plot', x=[-12, 12], y=[0, 1.05],
    fns=[dict(f='cos(pi*d*1e-6*sin(rad(x))/(lam*1e-9))^2*(sin(pi*3e-6*sin(rad(x))/(lam*1e-9)+1e-9)/(pi*3e-6*sin(rad(x))/(lam*1e-9)+1e-9))^2', label='intensity', color='accent')],
    xlabel='angle on the screen (°)', ylabel='relative brightness', params=[P('d', 'slit spacing', 5, 30, 12, 'µm'), P('lam', 'wavelength', 400, 700, 550, 'nm')],
    readouts=[R('fringe spacing', 'deg(lam*1e-9/(d*1e-6))', '°')],
    caption='Light through two slits makes bright and dark fringes (interference), under a broad single-slit envelope. Larger slit spacing squeezes the fringes; longer wavelength spreads them.'))

add('projectile_motion', dict(type='parametric', equal=False, range=[0, 170, 0, 45],
    curves=[dict(x='v*cos(rad(a))*s', y='v*sin(rad(a))*s-4.905*s^2', s=[0, '2*v*sin(rad(a))/9.81'], color='accent', dot='mod(t*0.5,2*v*sin(rad(a))/9.81)')],
    params=[P('v', 'launch speed', 10, 40, 30, 'm/s'), P('a', 'launch angle', 5, 85, 45, '°')],
    readouts=[R('range', 'v^2*sin(2*rad(a))/9.81', 'm'), R('max height', '(v*sin(rad(a)))^2/19.62', 'm'), R('flight time', '2*v*sin(rad(a))/9.81', 's')],
    caption='Without air resistance the path is a parabola. The range is greatest at 45° and equal for angles that add to 90°.', xlabel='distance (m)', ylabel='height (m)'))

plot('rocketry', 'Tsiolkovsky rocket equation: Δv = vₑ ln(m₀/m_f). Doubling the exhaust speed doubles Δv, but extra Δv costs fuel exponentially. About 9.4 km/s is needed to reach low Earth orbit.',
     [F('ve*ln(x)', 'Δv', 'accent')], x=[1, 20], y=[0, 14], xlabel='mass ratio m₀/m_f', ylabel='Δv (km/s)',
     params=[P('ve', 'exhaust speed', 2.5, 4.5, 3.5, 'km/s'), P('mr', 'mass ratio', 1, 20, 8, step=0.5)],
     points=[dict(x='mr', y='ve*ln(mr)', label='{ve*ln(mr)} km/s')], hlines=[dict(y=9.4, label='low Earth orbit')],
     readouts=[R('Δv', 've*ln(mr)', 'km/s'), R('fuel fraction', '100*(1-1/mr)', '%')])

# ---------- RELATIVITY ----------
plot('special_relativity', 'Moving clocks run slow by the factor γ = 1/√(1−v²/c²). It is negligible at everyday speeds but diverges as v → c. Slide the speed.',
     [F('1/sqrt(1-x^2)', 'γ(v)', 'accent')], x=[0, 0.99], y=[1, 8], xlabel='speed v / c', ylabel='time dilation factor γ',
     params=[P('v', 'speed', 0, 0.99, 0.8, 'c')], points=[dict(x='v', y='1/sqrt(1-v^2)', label='γ = {1/sqrt(1-v^2)}')],
     readouts=[R('γ', '1/sqrt(1-v^2)'), R('1 s on the moving clock lasts', '1/sqrt(1-v^2)', 's'), R('length contraction', 'sqrt(1-v^2)')])

add('general_relativity', dict(type='surface', f='-M/sqrt(x^2+y^2+0.3)', x=[-3, 3], y=[-3, 3], params=[P('M', 'mass', 0.2, 3, 1.5)],
    caption='A schematic of curved space: mass makes a dip in spacetime, and objects follow the curves (rotate it by dragging). A bigger mass gives a deeper well, so stronger gravity.'))

plot('gps_relativity', 'GPS satellite clocks tick fast by about +38 µs/day: +46 from weaker gravity (general relativity) and −7 from their speed (special relativity). Without correction, position errors would grow about 10 km per day.',
     [F('-1.9159e5/x', 'speed effect', 'pink'), F('60.14-3.8319e5/x', 'gravity effect', 'accent'), F('60.14-3.8319e5/x-1.9159e5/x', 'net', 'gold', width=3)],
     x=[6400, 45000], y=[-30, 70], xlabel='orbit radius (km)', ylabel='clock offset (µs per day)',
     vlines=[dict(x=26560, label='GPS')], params=[P('r', 'orbit radius', 6500, 45000, 26560, 'km')],
     readouts=[R('net offset', '60.14-3.8319e5/r-1.9159e5/r', 'µs/day')])

geo('gravitational_lensing', 'A massive lens bends light from a distant source into two images (or a full Einstein ring when aligned). Drag the source offset to see the images move and brighten.',
    [-3, 3, -1.6, 1.6],
    [C(0, 0, 1, 'dim', dash=True), Pt(0, 0, 'white', 6), T(0, -0.3, 'lens', 'white', 10),
     Pt('b', 0, 'gold', 6), T('b', 0.3, 'source', 'gold', 10),
     Pt('(b+sqrt(b^2+4))/2', 0, 'accent', 6), Pt('(b-sqrt(b^2+4))/2', 0, 'pink', 6),
     T(0, 1.35, 'ring radius = Einstein radius θ_E', 'dim', 10)],
    params=[P('b', 'source offset', 0.1, 2, 0.6, 'θ_E')],
    readouts=[R('image 1 position', '(b+sqrt(b^2+4))/2', 'θ_E'), R('image 2 position', '(b-sqrt(b^2+4))/2', 'θ_E'), R('total magnification', '(b^2+2)/(b*sqrt(b^2+4))')], aspect=0.45)

plot('gravitational_waves', 'The "chirp" of two merging black holes: the waves speed up and grow stronger as the orbit shrinks. Heavier systems chirp more slowly. Time is measured before the merger.',
     [F('(-x/(5*4.925e-6*Mc))^(-0.25)*cos(2*(-x/(5*4.925e-6*Mc))^0.625)', 'strain h', 'accent')], x=[-0.25, -0.003], y=[-12, 12], xlabel='time before merger (s)', ylabel='strain (arbitrary units)',
     params=[P('Mc', 'chirp mass', 10, 40, 28, 'M☉')], readouts=[R('GW frequency at −50 ms', '(1/pi)*(5/256)^0.375*(4.925e-6*Mc)^-0.625*0.05^-0.375', 'Hz')])
S['gravitational_waves']['y'] = [-8, 8]

plot('black_holes', 'The Schwarzschild radius r_s = 2GM/c² grows in proportion to mass: about 3 km per solar mass. A black hole is a mass squeezed inside its own r_s.',
     [F('2.95*x', 'event horizon radius', 'accent')], x=[1e-6, 1e10], y=[1e-6, 1e11], logx=True, logy=True, xlabel='mass (solar masses)', ylabel='r_s (km)',
     points=[dict(x=3e-6, y=8.9e-6, label='Earth (9 mm)', color='green'), dict(x=1, y=2.95, label='Sun', color='gold'), dict(x=4.3e6, y=1.27e7, label='Sgr A*', color='pink'), dict(x=6.5e9, y=1.9e10, label='M87*', color='pink')],
     params=[P('lm', 'log₁₀ mass', -6, 10, 1)], readouts=[R('radius for this mass', '2.95*10^lm', 'km')])
S['black_holes']['points'].append(dict(x='10^lm', y='2.95*10^lm', color='white'))

# ---------- QUANTUM ----------
plot('quantum_discovery', 'Classical physics (Rayleigh–Jeans, dashed) predicts infinite glow at short wavelengths, the "ultraviolet catastrophe". Planck\'s quantised energy exchange fixes it and started quantum theory.',
     [F('3.7418e-16/(x*1e-9)^5/(exp(1.4388e7/(x*T))-1)*1e-9', 'Planck (quantum)', 'accent'), F('2*pi*2.998e8*1.381e-23*T/(x*1e-9)^4*1e-9', 'classical', 'pink', dash=True)],
     x=[100, 3000], y=[0, '1.45e-14*T^5'], xlabel='wavelength (nm)', ylabel='spectral exitance (W m⁻² nm⁻¹)',
     params=[P('T', 'temperature', 2500, 7000, 5000, 'K')])

plot('wave_particle', 'Matter has a wavelength, λ = h/p. Electrons at everyday lab energies have wavelengths comparable to atoms (hence electron microscopes); a baseball\'s is far too small to ever notice.',
     [], x=[0, 1], y=[0, 1])
del S['wave_particle']
bars('wave_particle', 'Matter has a wavelength, λ = h/p. A 100 eV electron is about the size of an atom, so it diffracts from crystals; a thrown baseball\'s wavelength is 10²⁴ times smaller than anything measurable.',
     [('e⁻ 100 eV', 1.2e-10, 'accent'), ('neutron thermal', 1.8e-10, 'accent'), ('C₆₀ 200 m/s', 2.8e-12, 'green'), ('baseball', 1.1e-34, 'pink'), ('walking person', 9.5e-36, 'pink')],
     logy=True, ylabel='de Broglie wavelength (m)')

plot('schrodinger', 'A particle trapped in a box has only certain allowed wave functions, with n half-waves. The shape ψ (wiggling) gives the probability density |ψ|² (dashed); energy grows as n².',
     [F('sqrt(2)*sin(n*pi*x)*cos(n*n*t*1.5)', 'ψ(x) (real part)', 'accent'), F('2*sin(n*pi*x)^2', '|ψ|²', 'pink', dash=True)],
     x=[0, 1], y=[-2.2, 2.2], xlabel='position in box (fraction of L)', params=[P('n', 'level n', 1, 6, 2, step=1)],
     readouts=[R('energy (electron, 1 nm box)', '0.376*n^2', 'eV')])

plot('uncertainty', 'A particle squeezed into a narrow position range (blue) must have a broad range of momenta (pink), and vice versa. The product of widths is never less than ħ/2.',
     [F('exp(-x^2/(2*sx^2))/(sx*sqrt(2*pi))', 'position spread', 'accent'), F('exp(-x^2/(2*(0.5/sx)^2))/((0.5/sx)*sqrt(2*pi))', 'momentum spread', 'pink')],
     x=[-4, 4], xlabel='position x   /   momentum p (units with ħ = 1)', ylabel='probability density',
     params=[P('sx', 'position width σₓ', 0.3, 1.5, 0.6)], readouts=[R('σₓ', 'sx'), R('σₚ = ħ/2σₓ', '0.5/sx'), R('σₓ·σₚ (in ħ)', 'sx*0.5/sx')])

shp = [L(-1, -2.2, 3, -2.2, 'dim', 1), T(0.7, -2.55, 'energy →', 'dim', 10)]
levels = [('1s', -1.0, 1), ('2s', -0.2, 1), ('2p', 0.6, 1)]
shp = []
shp += [T(-1.6, 0, '1s', 'dim', 10), T(-1.6, 1.4, '2s', 'dim', 10), T(-1.6, 2.8, '2p', 'dim', 10)]
for i, (lab, y) in enumerate([('1s', 0)]):
    shp += [L(-1.2, 0, -0.2, 0, 'white', 2)]
shp += [L(-1.2, 1.4, -0.2, 1.4, 'white', 2)]
shp += [L(x, 2.8, x + 0.8, 2.8, 'white', 2) for x in (-1.2, -0.1, 1.0)]
add('spin_pauli', dict(type='geometry', range=[-2, 3.5, -0.7, 3.6], equal=False, aspect=0.6,
    shapes=[T(-1.7, 0, '1s', 'dim', 10), T(-1.7, 1.4, '2s', 'dim', 10), T(-1.7, 2.8, '2p', 'dim', 10),
            L(-1.2, 0, -0.2, 0, 'white', 2), L(-1.2, 1.4, -0.2, 1.4, 'white', 2),
            L(-1.2, 2.8, -0.4, 2.8, 'white', 2), L(-0.2, 2.8, 0.6, 2.8, 'white', 2), L(0.8, 2.8, 1.6, 2.8, 'white', 2),
            A(-0.85, -0.25, -0.85, 0.4, 'accent', 3, when='N>=1'), A(-0.55, 0.4, -0.55, -0.25, 'pink', 3, when='N>=2'),
            A(-0.85, 1.15, -0.85, 1.8, 'accent', 3, when='N>=3'), A(-0.55, 1.8, -0.55, 1.15, 'pink', 3, when='N>=4'),
            A(-0.8, 2.55, -0.8, 3.15, 'accent', 3, when='N>=5'), A(0, 2.55, 0, 3.15, 'accent', 3, when='N>=6'), A(1.2, 2.55, 1.2, 3.15, 'accent', 3, when='N>=7'),
            A(-0.5, 3.15, -0.5, 2.55, 'pink', 3, when='N>=8'), A(0.3, 3.15, 0.3, 2.55, 'pink', 3, when='N>=9'), A(1.5, 3.15, 1.5, 2.55, 'pink', 3, when='N>=10'),
            T(2.4, 1.4, '{N} electrons', 'gold', 11)],
    params=[P('N', 'electrons (H … Ne)', 1, 10, 6, step=1)],
    readouts=[R('unpaired spins', 'N<=1 ? N : N<=2 ? 0 : N<=3 ? 1 : N<=4 ? 0 : N<=7 ? N-4 : 10-N')],
    caption='No two electrons can share all quantum numbers (Pauli), so each orbital holds at most two, with opposite spins. Add electrons and watch the levels fill; this is the origin of the periodic table.'))

add('entanglement', dict(type='plot', x=[0, 180], y=[-1.1, 1.1],
    fns=[dict(f='-cos(rad(x))', label='quantum prediction', color='accent'), dict(f='-(1-x/90)', label='best local-hidden-variable', color='pink', dash=True)],
    xlabel='angle between the two detectors (°)', ylabel='correlation', params=[P('a', 'angle', 0, 180, 45, '°')],
    points=[dict(x='a', y='-cos(rad(a))', color='accent')],
    readouts=[R('quantum correlation', '-cos(rad(a))'), R('classical limit', '-(1-a/90)'), R('max CHSH value (quantum)', '2*sqrt(2)'), R('max CHSH (local realism)', '2')],
    caption='Entangled pairs show correlations that follow a smooth cosine, bulging beyond what any local pre-agreed-answers model allows (dashed). Bell tests measure exactly that gap.'))

plot('tunneling', 'A particle can pass through a barrier it classically could not, with probability ≈ e^(−2κw). Thicker or taller barriers suppress it exponentially; this powers fusion in the Sun and scanning tunnelling microscopes.',
     [F('exp(-2*5.123*sqrt(dv)*x)', 'transmission (electron)', 'accent')], x=[0, 1.5], y=[1e-8, 1], logy=True, xlabel='barrier width (nm)', ylabel='transmission probability',
     params=[P('dv', 'barrier above energy', 0.5, 5, 2, 'eV'), P('w', 'barrier width', 0.1, 1.5, 0.5, 'nm')],
     points=[dict(x='w', y='exp(-2*5.123*sqrt(dv)*w)', label='T = {exp(-2*5.123*sqrt(dv)*w)}')], readouts=[R('transmission', 'exp(-2*5.123*sqrt(dv)*w)')])

hub('quantum_measurement', 'No one agrees what happens when a quantum state becomes a definite result. These interpretations all give the same predictions for experiments so far, so the question is open.',
    'Measurement problem', ['Copenhagen', 'Many worlds', 'Pilot wave (Bohm)', 'Objective collapse', 'Relational / QBism'], colors=['accent', 'accent', 'accent', 'accent', 'accent'], aspect=0.85)

plot('decoherence', 'Interference between two quantum states fades as the system leaks information to its surroundings. The bigger or hotter the environment, the faster the fade, which is why everyday objects look classical.',
     [F('exp(-x/tau)', 'interference visibility', 'accent')], x=[0, 10], y=[0, 1.05], xlabel='time (arbitrary units)', ylabel='visibility of quantum coherence',
     params=[P('tau', 'decoherence time', 0.2, 6, 2)], readouts=[R('visibility left at t = 5', 'exp(-5/tau)')])

geo('qed', 'Feynman diagram of QED: two electrons repel by exchanging a photon (wavy line). Each vertex is an interaction whose strength is set by α ≈ 1/137; stronger coupling makes the photon line bolder in this schematic.',
    [-3, 3, -2, 2.2],
    [A(-2.2, -1.7, -0.8, 0, 'accent', 3), A(-0.8, 0, -2.2, 1.7, 'accent', 3),
     A(2.2, -1.7, 0.8, 0, 'pink', 3), A(0.8, 0, 2.2, 1.7, 'pink', 3),
     dict(k='spring', x1=-0.8, y1=0, x2=0.8, y2=0, coils=7, color='gold', width='1+4*al'),
     T(-2.4, -1.95, 'e⁻', 'accent'), T(2.4, -1.95, 'e⁻', 'pink'), T(0, 0.45, 'γ', 'gold', 13), T(0, -0.55, 'α = {al}', 'dim', 10)],
    params=[P('al', 'coupling α', 0.0073, 0.0073 * 4, 0.0073, None)], readouts=[R('1/α', '1/al')], aspect=0.55)
S['qed']['params'] = [P('al', 'coupling strength α', 0.0073, 0.3, 0.0073)]
for sh in S['qed']['shapes']:
    if sh.get('k') == 'spring': sh['width'] = 1.5
S['qed']['caption'] = 'Feynman diagram of QED: two electrons repel by exchanging a photon (wavy line); each vertex carries a factor √α with α ≈ 1/137. Raise α and the interaction (and the number of loop corrections) grows.'

geo('standard_model', 'The Standard Model: 12 matter particles (quarks and leptons in three generations), 4 force carriers and the Higgs. It describes everything we have made in colliders, yet leaves out gravity and dark matter.',
    [0, 100, 0, 100], [], aspect=0.8)
del S['standard_model']
nodes = []
q = ['u', 'c', 't', 'd', 's', 'b']
for k, n in enumerate(q): nodes.append(nd('q%d' % k, n, 8 + 14 * (k % 3), 14 + 18 * (k // 3), 'accent', 'circle'))
for k, n in enumerate(['e', 'μ', 'τ', 'νe', 'νμ', 'ντ']): nodes.append(nd('l%d' % k, n, 8 + 14 * (k % 3), 54 + 18 * (k // 3), 'green', 'circle'))
for k, n in enumerate(['g', 'γ', 'W', 'Z']): nodes.append(nd('b%d' % k, n, 66, 14 + 24 * k, 'gold', 'circle'))
nodes.append(nd('h', 'H', 90, 50, 'pink', 'circle'))
blocks('standard_model', 'Standard Model, certain in its parts but known to be incomplete. Blue: quarks (top rows u c t, d s b). Green: leptons (e μ τ and their neutrinos). Gold: force carriers. Pink: Higgs. Gravity and dark matter lie outside it.', nodes, [], flow=False, aspect=0.75)

bars('quarks_leptons', 'Particle masses span a huge range: the top quark is about 340,000 times heavier than the electron, and the Standard Model does not explain why. Neutrinos (not shown) are lighter still, below ~1 eV.',
     [('electron', 0.511, 'green'), ('up', 2.2, 'accent'), ('down', 4.7, 'accent'), ('strange', 95, 'accent'), ('tau', 1777, 'green'), ('charm', 1275, 'accent'), ('bottom', 4180, 'accent'), ('top', 172760, 'accent')],
     logy=True, ylabel='mass (MeV/c²)')

plot('qcd', 'Between two quarks the energy keeps rising with distance (a "string" of gluons), so pulling them apart costs more and more until new quarks pop out. That is confinement.',
     [F('-4/3*alf*0.1973/x+sig*x', 'V(r)', 'accent'), F('-4/3*alf*0.1973/x', 'Coulomb-like part', 'dim', dash=True), F('sig*x', 'linear string part', 'pink', dash=True)],
     x=[0.1, 1.5], y=[-3, 1.5], xlabel='quark separation (fm)', ylabel='potential energy (GeV)',
     params=[P('alf', 'strong coupling αₛ', 0.2, 0.5, 0.3), P('sig', 'string tension', 0.6, 1.2, 0.9, 'GeV/fm')],
     readouts=[R('energy at 1 fm', '-4/3*alf*0.1973+sig', 'GeV')])

add('higgs_mechanism', dict(type='surface', f='m*(x^2+y^2)+0.25*(x^2+y^2)^2', x=[-2, 2], y=[-2, 2], params=[P('m', 'mass term μ²', -1, 1, -1)],
    caption='The Higgs potential: with positive μ² the lowest point is the centre; with negative μ² (the "Mexican hat") the field settles somewhere on the rim, giving particles mass. Rotate it and slide μ².'))

plot('neutrinos', 'Neutrinos change flavour as they travel, P = 1 − sin²2θ·sin²(1.27Δm²L/E), which only works if they have mass. Slide Δm² and see how the oscillation length changes.',
     [F('1-s2*sin(1.267*dm*1e-3*x)^2', 'chance it is still a νμ', 'accent')], x=[0, 3000], y=[0, 1.05], xlabel='distance / energy, L/E (km per GeV)', ylabel='survival probability',
     params=[P('dm', 'mass splitting Δm²', 0.5, 4, 2.5, '×10⁻³ eV²'), P('s2', 'mixing sin²2θ', 0.1, 1, 1)],
     readouts=[R('first minimum at L/E =', '1.5708/(1.267*dm*1e-3)', 'km/GeV')])

chain('antimatter_asymmetry', 'The Big Bang should have made equal matter and antimatter, yet the universe has about one extra matter particle per billion pairs. The mechanism (needing the three Sakharov conditions) is not known.',
      ['Baryon number violation', 'C and CP violation', 'Out of equilibrium', 'Matter excess ~6×10⁻¹⁰'], per_row=2, colors=['pink', 'pink', 'pink', 'gold'], flow=True)

plot('strong_cp_axion', 'The neutron electric dipole moment d ≈ 3.6×10⁻¹⁶·θ e·cm is not seen down to 1.8×10⁻²⁶ e·cm, so θ < ~10⁻¹⁰. Why it is so tiny is unexplained; the axion is one proposed answer.',
     [F('3.6e-16*x', 'predicted dipole moment', 'accent')], x=[1e-12, 3], y=[1e-28, 1e-15], logx=True, logy=True, xlabel='θ (QCD vacuum angle)', ylabel='neutron EDM (e·cm)',
     hlines=[dict(y=1.8e-26, label='measured limit', color='pink')], vlines=[dict(x=5e-11, label='θ ≲ 5×10⁻¹¹', color='pink')])

plot('symmetry_breaking', 'Free energy of a magnet versus its magnetisation. Above the critical temperature (T/T_c > 1) it has a single minimum at zero; below, two lower minima appear and the system must choose one, breaking the symmetry.',
     [F('(T-1)*x^2+0.5*x^4', 'free energy', 'accent')], x=[-1.5, 1.5], y=[-0.4, 1.5], xlabel='magnetisation m', ylabel='free energy (arb.)',
     params=[P('T', 'temperature T/T_c', 0.2, 1.8, 0.6)], readouts=[R('minima at |m| =', 'T<1 ? sqrt(1-T) : 0')])

bars('quantum_gravity', 'Gravity and quantum theory clash at the Planck length, ~20 orders of magnitude below anything we have probed. Candidate theories exist, but none has been tested.',
     [('proton', 8.4e-16, 'green'), ('LHC probes', 1e-19, 'accent'), ('Planck length', 1.6e-35, 'pink')], logy=True, ylabel='length (m)')

plot('black_hole_info', 'Hawking\'s calculation says the radiation entropy keeps growing (dashed), but quantum mechanics requires it to turn over, the Page curve (solid). How the information escapes is still debated.',
     [F('x<0.5 ? 1.6*x : 1.6*(1-x)^0.67*0.5^0.33*1.0*0.5/0.5^0.67*1', 'Page curve (unitary)', 'accent'), F('1.6*x', 'Hawking (information lost)', 'pink', dash=True)],
     x=[0, 1], y=[0, 1.7], xlabel='fraction of black hole evaporated', ylabel='entropy of radiation (arb.)', params=[P('f', 'evaporation progress', 0, 1, 0.3)],
     points=[dict(x='f', y='f<0.5 ? 1.6*f : 0.8*((1-f)/0.5)^0.67')])
S['black_hole_info']['fns'][0]['f'] = 'x<0.5 ? 1.6*x : 0.8*((1-x)/0.5)^0.67'
