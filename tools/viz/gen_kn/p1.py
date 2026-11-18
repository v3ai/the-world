from lib import *
import math

# ---------- MATH ----------
geo('logic_sets', 'Two sets overlap in c elements, so the union has a + b - c. Slide the overlap and watch the union count update.',
    [-4, 4, -2.2, 2.2],
    [C('-ov/2', 0, 1.3, 'accent', 'accent', alpha=0.25), C('ov/2', 0, 1.3, 'pink', 'pink', alpha=0.25),
     T(-1.7, 0.2, 'A', 'accent', 14), T(1.7, 0.2, 'B', 'pink', 14),
     T(0, -1.8, '|A ∪ B| = {a+b-c} = |A| + |B| − |A ∩ B|', 'gold')],
    params=[P('a', '|A|', 4, 20, 12, step=1), P('b', '|B|', 4, 20, 9, step=1), P('c', '|A ∩ B|', 0, 4, 3, step=1)],
    readouts=[R('union size', 'a+b-c')])
S['logic_sets']['shapes'].insert(0, {})  # placeholder removed below
S['logic_sets']['shapes'].pop(0)
# overlap distance depends on c
S['logic_sets']['shapes'][0]['x'] = '-(1.9-0.4*c)/2'; S['logic_sets']['shapes'][1]['x'] = '(1.9-0.4*c)/2'

blocks('godel', "Any consistent formal system rich enough for arithmetic has true statements it can never prove. The self-referential sentence G says 'G is not provable here'.",
       [('ax', 'Axioms + rules', 20, 12, 'accent'), ('th', 'Provable theorems', 78, 12), ('g', 'Gödel sentence G', 78, 50, 'pink'),
        ('tr', 'All true statements', 30, 90, 'gold')],
       [('ax', 'th', 'proof'), ('th', 'tr', 'subset of'), ('g', 'tr', 'is true'), ('th', 'g', 'cannot reach', True)], aspect=0.62)

geo('calculus', 'The slope of the chord from x₀ to x₀+h approaches the tangent slope 2x₀ as h shrinks. Drag h toward 0.',
    [-1, 4, -1, 10],
    [Cv('s', 's^2', [-1, 4], 'white'),
     L('-1', 'x0^2+(2*x0+h)*(-1-x0)', '4', 'x0^2+(2*x0+h)*(4-x0)', 'gold', 2),
     Pt('x0', 'x0^2', 'accent', 5), Pt('x0+h', '(x0+h)^2', 'pink', 5),
     T(2.2, 9, 'f(x) = x²   chord slope = {2*x0+h}', 'gold')],
    params=[P('x0', 'point x₀', 0, 2.5, 1.2), P('h', 'step h', 0.05, 2, 1.5)],
    readouts=[R('chord slope', '2*x0+h'), R('derivative f′(x₀)', '2*x0')], equal=False, axes=True)

plot('ode_pde', 'dx/dt = −kx has the solution x = x₀e^(−kt) for every starting value. Change k to change the decay rate.',
     [F('x0*exp(-k*x)', 'x₀ = 3', 'accent'), F('0.5*x0*exp(-k*x)', 'x₀ = 1.5', 'pink'), F('-0.7*x0*exp(-k*x)', 'x₀ = −2.1', 'gold')],
     x=[0, 5], y=[-3, 3.5], xlabel='time t', ylabel='x(t)',
     params=[P('k', 'rate k', 0.2, 2, 0.8), P('x0', 'scale', 1, 1, 1)],
     readouts=[R('half-life ln2/k', 'ln(2)/k')])
S['ode_pde']['params'].pop()  # no dummy slider
S['ode_pde']['fns'] = [F('3*exp(-k*x)', 'x₀ = 3', 'accent'), F('1.5*exp(-k*x)', 'x₀ = 1.5', 'pink'), F('-2.1*exp(-k*x)', 'x₀ = −2.1', 'gold')]

add('linalg_hilbert', dict(type='vectors', range=3, matrix=[['sx*cos(th)', '-sin(th)'], ['sx*sin(th)', 'cos(th)']],
    vectors=[dict(x=1, y=0, transform=True, label='Ae₁', color='gold')],
    params=[P('th', 'rotate θ', -1.5, 1.5, 0.5), P('sx', 'stretch', 0.3, 2, 1.4)],
    readouts=[R('determinant (area scale)', 'sx')],
    caption='A matrix is a linear map: it moves the whole grid at once. The yellow unit square shows how areas scale (the determinant).'))

add('diff_geometry', dict(type='surface', f='c*x^2+y^2', x=[-2, 2], y=[-2, 2],
    params=[P('c', 'curvature in x', -1, 1, -1)],
    readouts=[R('Gaussian curvature sign (∝ c)', 'c')],
    caption='Drag to rotate. With c > 0 the surface is a bowl (positive curvature); c < 0 gives a saddle (negative curvature). Curvature is measured from inside the surface.'))

shapes = [Pg([['cos(%s)' % (k * math.pi / 3 + 0.0), 'sin(%s)' % (k * math.pi / 3)] for k in range(6)], 'dim', alpha=0.4)]
hx = lambda k: ['1.6*cos(%s+rot*1.0472)' % round(k * math.pi / 3, 4), '1.6*sin(%s+rot*1.0472)' % round(k * math.pi / 3, 4)]
add('group_symmetry', dict(type='geometry', range=[-2.4, 2.4, -2.2, 2.2],
    shapes=[Pg([hx(k) for k in range(6)], 'accent', 'accent', alpha=0.15)] + [C(*(hx(k)), 0.18, c, c, alpha=0.8) for k, c in zip(range(6), ['red', 'gold', 'green', 'accent', 'purple', 'pink'])] +
    [T(0, 0, 'rotation by {rot*60}°', 'gold'), T(0, -2, 'six rotations form the group C₆; 6 reflections make D₆', 'dim', 10)],
    params=[P('rot', 'apply rotation r^k, k =', 0, 5, 1, step=1)],
    readouts=[R('angle', 'rot*60', '°')],
    caption='Symmetries of a hexagon: each rotation maps the shape to itself, and doing two in a row gives another. That closure is what a group is.'))

blocks('noether', 'Every continuous symmetry of the laws gives a conserved quantity. Change nothing under a shift in time and energy is conserved.',
       [('a', 'Time shift', 14, 12), ('b', 'Space shift', 14, 38), ('c', 'Rotation', 14, 64), ('d', 'Phase (U(1))', 14, 90),
        ('e', 'Energy', 84, 12, 'gold'), ('f', 'Momentum', 84, 38, 'gold'), ('g', 'Angular mom.', 84, 64, 'gold'), ('h', 'Electric charge', 84, 90, 'gold')],
       [('a', 'e', 'symmetry →'), ('b', 'f'), ('c', 'g'), ('d', 'h')], aspect=0.6)

add('probability', dict(type='dist', kind='binomial', n='n', p='p', sample=True, shade=['n*p-1', 'n*p+1'],
    params=[P('n', 'trials n', 5, 60, 20, step=1), P('p', 'success prob p', 0.05, 0.95, 0.4)],
    readouts=[R('mean np', 'n*p'), R('std dev', 'sqrt(n*p*(1-p))')],
    caption='Counts of successes across many repeats form a bell-shaped pile; the random draws (pink) settle onto the exact probabilities as more accumulate.'))

def beta(a, b, m):  # unnormalised peak-1 beta shape
    return '((x/%s)^(%s))*(((1-x)/(1-%s))^(%s))' % (m, a, m, b)
plot('bayes_stats', 'Start with a prior belief about a coin (blue), multiply by the likelihood of the flips you saw, and you get the posterior (gold). More data pulls it toward the observed rate.',
     [F('((x/0.5)^1)*(((1-x)/0.5)^1)', 'prior', 'accent'),
      F('((x/((k)/(n)))^(k))*(((1-x)/(1-(k)/(n)))^(n-k))', 'likelihood', 'pink', dash=True),
      F('((x/((1+k)/(2+n)))^(1+k))*(((1-x)/(1-(1+k)/(2+n)))^(1+n-k))', 'posterior', 'gold', width=3)],
     x=[0.005, 0.995], y=[0, 1.1], xlabel='coin bias θ (probability of heads)', ylabel='relative belief',
     params=[P('k', 'heads seen', 1, 29, 7, step=1), P('n', 'flips', 10, 30, 10, step=1)],
     readouts=[R('posterior mode', '(1+k)/(2+n)')])
S['bayes_stats']['params'][0]['max'] = 9; S['bayes_stats']['params'][0]['value'] = 7
S['bayes_stats']['params'] = [P('k', 'heads seen', 1, 9, 7, step=1), P('n', 'flips', 10, 30, 10, step=1)]

plot('dynamical_chaos', 'The logistic map x → rx(1−x). Where the curve crosses the diagonal is a fixed point; its slope (2 − r) decides stability. For r > 3 it loses stability and period doubling begins.',
     [F('x', None, 'dim', dash=True), F('r*x*(1-x)', 'f(x)', 'accent'), F('r*(r*x*(1-x))*(1-r*x*(1-x))', 'f(f(x))', 'pink', dash=True)],
     x=[0, 1], y=[0, 1], equal=True, xlabel='x', ylabel='next x',
     params=[P('r', 'growth r', 0.6, 3.99, 2.8)],
     points=[dict(x='1-1/r', y='1-1/r', label='fixed point')],
     readouts=[R('slope at fixed point (2 − r)', '2-r'), R('stable?  (1 = yes)', 'abs(2-r)<1')])

add('fourier', dict(type='signal', x=[0, 2], f='2/pi*(sin(2*pi*x) - sin(4*pi*x)/2 + if(N>=3,sin(6*pi*x)/3,0) - if(N>=4,sin(8*pi*x)/4,0) + if(N>=5,sin(10*pi*x)/5,0) - if(N>=6,sin(12*pi*x)/6,0) + if(N>=7,sin(14*pi*x)/7,0) - if(N>=8,sin(16*pi*x)/8,0))',
    spectrum=True, fmax=10, params=[P('N', 'harmonics', 2, 8, 4, step=1)],
    caption='Any repeating wave is a sum of sine waves. Add harmonics to build a sawtooth, and watch each one appear as a bar in the spectrum below.'))
S['fourier']['f'] = '2/pi*(sin(2*pi*x) - sin(4*pi*x)/2 + if(N>=3,sin(6*pi*x)/3,0) - if(N>=4,sin(8*pi*x)/4,0) + if(N>=5,sin(10*pi*x)/5,0) - if(N>=6,sin(12*pi*x)/6,0) + if(N>=7,sin(14*pi*x)/7,0) - if(N>=8,sin(16*pi*x)/8,0))'

add('graph_theory', dict(type='graph', layout='tree', nodes=[dict(id=c) for c in 'ABCDEFG'],
    edges=[['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['C', 'G'], ['E', 'F']],
    steps=[['A'], ['B', 'C'], ['D', 'E', 'F', 'G']],
    caption='Nodes joined by edges model networks of all kinds. Watch a breadth-first search spread outward from A one layer at a time.'))

hub('millennium_problems', 'Seven Clay prizes were set in 2000; only the Poincaré conjecture has been solved (Perelman, 2003). The rest are open, so any prediction here is a guess.',
    'Millennium problems', ['P vs NP', 'Riemann hypothesis', 'Yang–Mills gap', 'Navier–Stokes', 'Hodge', 'Birch–Swinnerton-Dyer', 'Poincaré (solved)'],
    colors=['pink', 'pink', 'pink', 'pink', 'pink', 'pink', 'green'], aspect=0.95)

# ---------- MECHANICS ----------
geo('newton_laws', 'Same force, different mass: acceleration a = F/m. A heavier block speeds up more slowly. Try 2 N on 1 kg versus 4 kg.',
    [-3.2, 5.2, -0.6, 1.2],
    [L(-3.2, 0, 5.2, 0, 'dim'),
     Rc('bx-0.3', 0, 0.6, 0.6, 'accent', 'accent', alpha=0.4),
     A('bx-1.4', 0.3, 'bx-0.4', 0.3, 'gold', 3), T('bx-0.9', 0.55, 'F', 'gold'),
     T('bx', 0.3, '{m} kg', 'white')],
    params=[P('F', 'force', 0.5, 6, 2, 'N'), P('m', 'mass', 0.5, 5, 1, 'kg')],
    readouts=[R('acceleration a = F/m', 'F/m', 'm/s²')], aspect=0.4)
# block position: start at -2, accelerate (time slowed), loop
def subst(o, a, b):
    if isinstance(o, str): return o.replace(a, b)
    if isinstance(o, list): return [subst(v, a, b) for v in o]
    if isinstance(o, dict): return {k: subst(v, a, b) for k, v in o.items()}
    return o
S['newton_laws']['shapes'] = subst(S['newton_laws']['shapes'], 'bx', '(-2.5+min(7,0.5*(F/m)*mod(t,3)^2))')

geo('gravitation_newton', 'Gravity falls as 1/r². Drag the orbit radius: doubling the distance cuts the pull to a quarter. At the Moon (60 Earth radii) g is about 0.003 m/s².',
    [-1, 1, -1, 1], [], aspect=0.1)
del S['gravitation_newton']
plot('gravitation_newton', 'Gravity falls as 1/r²: doubling the distance from Earth\'s centre cuts the pull to a quarter. The ISS is only about 6% farther out than the ground, so its g is still ~90% of surface g.',
     [F('9.81/x^2', 'g(r)', 'accent')], x=[1, 10], y=[0, 10], xlabel='distance from Earth\'s centre (Earth radii)', ylabel='g (m/s²)',
     params=[P('r', 'distance r', 1, 10, 3, 'R⊕')],
     points=[dict(x='r', y='9.81/r^2', label='{9.81/r^2} m/s²'), dict(x=1.066, y='9.81/1.066^2', label='ISS', color='pink')],
     readouts=[R('g at r', '9.81/r^2', 'm/s²'), R('altitude', '(r-1)*6371', 'km')])

add('orbits_kepler', dict(type='parametric', range=[-2.2, 1.6, -1.3, 1.3],
    curves=[dict(x='cos(s)-e0', y='sqrt(1-e0^2)*sin(s)', s=[0, 6.2832], color='accent', dot='t*0.6+e0*sin(t*0.6)+e0^2/2*sin(2*t*0.6)')],
    shapes=[C(0, 0, 0.06, 'gold', 'gold'), T(0.3, -0.12, 'Sun', 'gold', 10), L(-1 - 0, 0, 1, 0, 'dim', 1, dash=True)],
    params=[P('e0', 'eccentricity e', 0, 0.6, 0.45)],
    readouts=[R('perihelion distance', '1-e0', 'a'), R('aphelion distance', '1+e0', 'a'), R('speed ratio peri/aph', '(1+e0)/(1-e0)')],
    caption='Kepler: planets sweep equal areas in equal times, so they race at perihelion and crawl at aphelion. Raise e and watch the dot speed up near the Sun.'))
S['orbits_kepler']['shapes'][2] = L('-1-e0', 0, '1-e0', 0, 'dim', 1, dash=True)
S['orbits_kepler']['shapes'][2]['x1'] = '-1-e0'

plot('conservation_energy', 'A mass on a spring trades potential for kinetic energy while the total (dashed) stays constant. The dot moves along the energy curves as the mass oscillates.',
     [F('0.5*k*x^2', 'potential', 'pink'), F('max(0,0.5*k*A^2-0.5*k*x^2)', 'kinetic', 'accent'), F('0.5*k*A^2', 'total', 'white', dash=True)],
     x=[-1.5, 1.5], y=[0, 5], xlabel='position (m)', ylabel='energy (J)',
     params=[P('k', 'spring k', 2, 10, 4, 'N/m'), P('A', 'amplitude', 0.3, 1.4, 1.0, 'm')],
     points=[dict(x='A*cos(2*t)', y='0.5*k*(A*cos(2*t))^2', color='pink'), dict(x='A*cos(2*t)', y='0.5*k*A^2-0.5*k*(A*cos(2*t))^2', color='accent')],
     readouts=[R('total energy', '0.5*k*A^2', 'J')])

geo('conservation_momentum', 'Elastic collision: total momentum is unchanged. A moving block hits one at rest; heavy-on-light keeps going, light-on-heavy bounces back. Try the mass ratio.',
    [-5, 7, -0.8, 1.2],
    [L(-5, 0, 7, 0, 'dim'),
     Rc('X1-0.3', 0, 0.6, 0.6, 'accent', 'accent', alpha=0.45), Rc('X2-0.3', 0, 0.6, 0.6, 'pink', 'pink', alpha=0.45),
     T('X1', 0.3, 'm₁', 'white'), T('X2', 0.3, 'm₂', 'white'),
     T(1, 1.0, 'p total = {m1*1.5} kg·m/s before and after', 'gold', 10)],
    params=[P('m1', 'mass 1', 0.5, 4, 2, 'kg'), P('m2', 'mass 2', 0.5, 4, 1, 'kg')],
    readouts=[R('v₁ after', '(m1-m2)/(m1+m2)*1.5', 'm/s'), R('v₂ after', '2*m1/(m1+m2)*1.5', 'm/s')], aspect=0.42)
X1 = '(mod(t,5)<1.6 ? -3+1.5*mod(t,5) : -0.6+(m1-m2)/(m1+m2)*1.5*(mod(t,5)-1.6))'
X2 = '(mod(t,5)<1.6 ? 0 : 2*m1/(m1+m2)*1.5*(mod(t,5)-1.6))'
S['conservation_momentum']['shapes'] = subst(subst(S['conservation_momentum']['shapes'], 'X1', X1), 'X2', X2)

plot('rotational_dynamics', 'Angular momentum L = Iω is conserved. A skater who pulls arms in reduces the moment of inertia I, so the spin rate ω must rise.',
     [F('4/(0.8+2*4*x^2)', 'spin rate ω', 'accent')], x=[0.1, 0.9], y=[0, 5.5], xlabel='arm extension r (m)', ylabel='ω (rad/s)',
     points=[dict(x='r', y='4/(0.8+8*r^2)', label='{4/(0.8+8*r^2)} rad/s')],
     params=[P('r', 'hands at r', 0.1, 0.9, 0.7, 'm')],
     readouts=[R('moment of inertia', '0.8+8*r^2', 'kg·m²'), R('turns per second', '4/(0.8+8*r^2)/6.283')])

add('lagrangian', dict(type='plot', x=[-3.5, 3.5], y=[-2.6, 2.6],
    fns=[dict(f='sqrt(2*(E+cos(x)))', label='phase-space orbit', color='accent'), dict(f='-sqrt(2*(E+cos(x)))', color='accent'),
         dict(f='sqrt(2*(1+cos(x)))', color='dim', dash=True), dict(f='-sqrt(2*(1+cos(x)))', color='dim', dash=True)],
    xlabel='angle θ (rad)', ylabel='momentum p', params=[P('E', 'energy', -0.95, 2, -0.2)],
    readouts=[R('max swing angle', 'E<1 ? deg(acos(-E)) : 180', '°')],
    caption='The Hamiltonian view: a pendulum traces closed loops in (θ, p) space. The dashed separatrix (E = 1) divides swinging from full rotation. Raise E past 1 and the loop opens.'))

add('oscillations', dict(type='plot', x=[0, 2], y=[0, 12],
    fns=[dict(f='1/sqrt((1-x^2)^2+(2*z*x)^2)', label='amplitude', color='gold')],
    xlabel='driving frequency / natural frequency', ylabel='amplitude (relative)', params=[P('z', 'damping ζ', 0.05, 0.7, 0.1)],
    vlines=[dict(x=1, label='resonance')], readouts=[R('quality factor Q ≈ 1/2ζ', '1/(2*z)')],
    caption='Drive an oscillator near its natural frequency and the response grows large. Less damping makes the peak taller and narrower.'))

plot('waves', 'A sound wave in air, slowed down so you can watch it. A shorter wavelength means a higher pitch: f = v/λ with v = 343 m/s.',
     [F('sin(2*pi*(x/L-0.4*t))', 'pressure', 'accent')], x=[0, 4], y=[-1.4, 1.4], xlabel='position (m)', ylabel='pressure (relative)',
     params=[P('L', 'wavelength λ', 0.2, 2, 1, 'm')],
     readouts=[R('frequency f = v/λ', '343/L', 'Hz')])

plot('elasticity_materials', 'Pull steel and stress rises in proportion to strain (Hooke\'s law) until it yields; after that, deformation is permanent. The dot shows where you are.',
     [F('x<0.125 ? 2000*x : x<2 ? 250 : x<15 ? 250+150*(1-((15-x)/13)^2) : 400-6*(x-15)', 'mild steel', 'accent')],
     x=[0, 25], y=[0, 450], xlabel='strain (%)', ylabel='stress (MPa)',
     points=[dict(x='e', y='e<0.125 ? 2000*e : e<2 ? 250 : e<15 ? 250+150*(1-((15-e)/13)^2) : 400-6*(e-15)')],
     params=[P('e', 'strain', 0, 25, 0.1, '%')],
     hlines=[dict(y=250, label='yield ≈ 250 MPa')],
     readouts=[R('stress', 'e<0.125 ? 2000*e : e<2 ? 250 : e<15 ? 250+150*(1-((15-e)/13)^2) : 400-6*(e-15)', 'MPa'), R('elastic?  (1 = recovers)', 'e<0.125')])

plot('electrostatic_bonds', 'Two atoms attract at long range and repel at short range. The Lennard-Jones curve has a minimum at r = 1.12σ: the bond length. A deeper well means a stronger bond.',
     [F('4*eps*((1/x)^12-(1/x)^6)', 'V(r)', 'accent')], x=[0.9, 2.5], y=[-1.5, 2], xlabel='separation r / σ', ylabel='energy V (units of ε₀)',
     params=[P('eps', 'well depth ε', 0.3, 1.4, 1, None)],
     points=[dict(x=1.1225, y='-eps', label='equilibrium')],
     readouts=[R('equilibrium r', '1.1225', 'σ'), R('bond energy', 'eps', 'ε₀')])

plot('fluid_statics', 'Pressure grows linearly with depth: p = p₀ + ρgh. In water it rises by about 1 atmosphere every 10 m. A denser liquid (try mercury, 13,600) rises much faster.',
     [F('(101325+rho*9.81*x)/101325', 'pressure', 'accent')], x=[0, 100], xlabel='depth (m)', ylabel='pressure (atm)',
     params=[P('rho', 'fluid density', 700, 13600, 1000, 'kg/m³')],
     readouts=[R('buoyant force on 1 L displaced', 'rho*9.81*0.001', 'N'), R('pressure at 10 m', '(101325+rho*9.81*10)/101325', 'atm')])

plot('bernoulli_flight', 'Faster air over the top of a wing means lower pressure there (Bernoulli), so the wing is pushed up. Lift grows with the square of airspeed.',
     [F('0.5*1.2*((1+k)^2-1)*x^2*16', 'lift on a 16 m² wing', 'accent')], x=[0, 80], xlabel='airspeed (m/s)', ylabel='lift (N)',
     params=[P('k', 'extra speed over top', 0.05, 0.4, 0.2), P('v', 'airspeed', 10, 80, 50, 'm/s')],
     points=[dict(x='v', y='0.5*1.2*((1+k)^2-1)*v^2*16', label='{0.5*1.2*((1+k)^2-1)*v^2*16/9.81} kg-equivalent')],
     readouts=[R('lift', '0.5*1.2*((1+k)^2-1)*v^2*16', 'N'), R('pressure drop', '0.5*1.2*((1+k)^2-1)*v^2', 'Pa')])

plot('navier_stokes', 'Steady flow in a pipe: friction with the walls (viscosity) makes a parabolic speed profile, fastest in the middle. A thicker fluid flows more slowly for the same push.',
     [F('(16/(4*mu*1e-3))*(2.5e-5-(x*1e-3)^2)', 'speed u(r)', 'accent')], x=[-5, 5], xlabel='position across pipe (mm)', ylabel='velocity (m/s)',
     params=[P('mu', 'viscosity μ', 1, 20, 1, 'mPa·s')],
     readouts=[R('centre speed', '(16/(4*mu*1e-3))*2.5e-5', 'm/s'), R('Reynolds number', '1000*(16/(4*mu*1e-3))*2.5e-5/2*0.01/(mu*1e-3)')])

plot('turbulence', 'Pipe friction versus Reynolds number: smooth laminar flow below ~2300, chaotic turbulence above ~4000. The transition between them is hard to predict, and a full theory of turbulence is still open.',
     [F('sqrt(2300-x)*0+64/x', 'laminar (64/Re)', 'accent'), F('sqrt(x-3000)*0+0.316*x^-0.25', 'turbulent (smooth pipe)', 'pink')],
     x=[500, 100000], y=[0.01, 0.2], logx=True, logy=True, xlabel='Reynolds number', ylabel='friction factor',
     vlines=[dict(x=2300, label='transition')], params=[P('Re', 'Re', 500, 100000, 5000)],
     points=[dict(x='Re', y='Re<2300 ? 64/Re : 0.316*Re^-0.25', label='Re = {Re}')])

# ---------- THERMO ----------
Q = '(x<42 ? -20+x/2.1 : x<376 ? 0 : x<794 ? (x-376)/4.18 : x<3054 ? 100 : 100+(x-3054)/2.0)'
Qs = Q.replace('x', 'q')
plot('temperature_heat', 'Heat 1 kg of ice: temperature rises, then stalls while ice melts (334 kJ) and again while water boils (2260 kJ). During these plateaus, heat changes the state, not the temperature.',
     [F(Q, 'temperature', 'accent')], x=[0, 3150], y=[-30, 130], xlabel='heat added (kJ)', ylabel='temperature (°C)',
     params=[P('q', 'heat added', 0, 3100, 200, 'kJ')], points=[dict(x='q', y=Qs)], readouts=[R('temperature', Qs, '°C')])

plot('heat_diffusion', 'A hot spot spreads and flattens as heat diffuses; its width grows as √(2Dt). Copper (D ≈ 1 cm²/s) evens out far faster than water (0.0014 cm²/s).',
     [F('20*exp(-x^2/(4*D*(1+mod(t,9))))/sqrt(4*pi*D*(1+mod(t,9)))*3', 'temperature rise', 'accent')],
     x=[-10, 10], y=[0, 18], xlabel='position (cm)', ylabel='temperature rise (°C)', params=[P('D', 'diffusivity D', 0.05, 1.2, 0.3, 'cm²/s')],
     readouts=[R('width √(2Dt)', 'sqrt(2*D*(1+mod(t,9)))', 'cm'), R('time', '1+mod(t,9)', 's')])

add('kinetic_theory', dict(type='dist', kind='custom', f='4/sqrt(pi)*(M*6.0136e-5/T)^1.5*x^2*exp(-M*6.0136e-5/T*x^2)', x=[0, 3000], shade=['0', 'sqrt(3*8.314*T/(M*0.001))'],
    xlabel='molecular speed (m/s)', params=[P('T', 'temperature', 100, 1000, 300, 'K'), P('M', 'molar mass', 2, 44, 28, 'g/mol')],
    readouts=[R('rms speed', 'sqrt(3*8.314*T/(M*0.001))', 'm/s'), R('most probable speed', 'sqrt(2*8.314*T/(M*0.001))', 'm/s')],
    caption='Molecules in a gas move at a spread of speeds (Maxwell–Boltzmann). Heating widens and shifts the curve; heavier molecules (try 2 for H₂ vs 44 for CO₂) are slower.'))

blocks('first_law', 'Energy is conserved: the change in internal energy equals heat added minus work done by the system, ΔU = Q − W.',
       [('q', 'Heat Q in', 8, 50, 'pink'), ('u', 'System\n(internal energy U)', 50, 50, 'accent'), ('w', 'Work W out', 92, 50, 'gold')],
       [('q', 'u', 'Q'), ('u', 'w', 'W')], aspect=0.4,
       params=[P('Q', 'heat in', 0, 100, 60, 'J'), P('W', 'work out', 0, 100, 40, 'J')], readouts=[R('ΔU = Q − W', 'Q-W', 'J')])
S['first_law']['nodes'][1]['label'] = 'System (U)'

add('second_law', dict(type='dist', kind='binomial', n='n', p=0.5, sample=True,
    params=[P('n', 'number of molecules', 4, 100, 10, step=1)],
    readouts=[R('P(all on one side)', '2*0.5^n')],
    caption='N gas molecules each randomly in the left or right half. With few molecules, lopsided splits are common; with many, the even split overwhelms everything else. That is why entropy rises.'))

plot('third_law', 'As T → 0 the heat capacity of a solid falls to zero and entropy approaches its minimum. Because removing the last bit of heat gets ever harder, absolute zero is unreachable.',
     [F('(th/x)^2*exp(-th/x)/(1-exp(-th/x))^2', 'C / 3Nk (Einstein model)', 'accent')], x=[5, 600], y=[0, 1.1], xlabel='temperature (K)', ylabel='heat capacity (units of 3Nk)',
     params=[P('th', 'characteristic temp', 100, 500, 300, 'K')], hlines=[dict(y=1, label='classical value')])

plot('statistical_mechanics', 'Boltzmann factor: the chance of a state with energy E falls as e^(−E/kT). Raise the temperature and higher levels fill up.',
     [F('exp(-x/(8.617e-5*T))', 'relative probability', 'accent')], x=[0, 0.5], y=[0, 1.05], xlabel='energy above ground (eV)', ylabel='relative population',
     params=[P('T', 'temperature', 100, 3000, 300, 'K')],
     points=[dict(x=0.1, y='exp(-0.1/(8.617e-5*T))', label='0.1 eV level')],
     readouts=[R('kT', '8.617e-5*T', 'eV'), R('population of 0.1 eV level', 'exp(-0.1/(8.617e-5*T))')])

plot('heat_engines', 'No engine can beat the Carnot limit η = 1 − T_c/T_h. Raising the hot temperature or lowering the cold one helps; real engines reach about half this.',
     [F('(1-Tc/x)*100', 'Carnot efficiency', 'accent')], x=[300, 1500], y=[0, 100], xlabel='hot reservoir T_h (K)', ylabel='efficiency (%)',
     params=[P('Tc', 'cold temp T_c', 250, 400, 300, 'K'), P('Th', 'hot temp T_h', 320, 1500, 900, 'K')],
     points=[dict(x='Th', y='(1-Tc/Th)*100', label='{(1-Tc/Th)*100}%')], readouts=[R('Carnot efficiency', '(1-Tc/Th)*100', '%')])

plot('phase_transitions', 'Van der Waals isotherms (reduced units). Above the critical temperature (T = 1) pressure falls smoothly with volume; below it the loop signals a liquid–gas transition. Slide T through 1.',
     [F('8*T/(3*x-1)-3/x^2', 'p(V)', 'accent')], x=[0.45, 3], y=[0, 1.6], xlabel='volume (reduced)', ylabel='pressure (reduced)',
     params=[P('T', 'temperature T/T_c', 0.8, 1.2, 0.9)], points=[dict(x=1, y=1, label='critical point', color='pink')])

plot('blackbody', 'Every warm object glows with a smooth spectrum that depends only on temperature. Hotter means more light, and the peak moves to shorter wavelengths (Wien: λ_peak = 2.9 mm·K / T).',
     [F('3.7418e-16/(x*1e-9)^5/(exp(1.4388e7/(x*T))-1)*1e-9', 'emitted power', 'accent')], x=[100, 3000], y=[0, '1.35e-12*T^5'],
     xlabel='wavelength (nm)', ylabel='spectral exitance (W m⁻² nm⁻¹)', params=[P('T', 'temperature', 1500, 8000, 5772, 'K')],
     vlines=[dict(x='2.898e6/T', label='peak', color='gold')], readouts=[R('peak wavelength', '2.898e6/T', 'nm'), R('total power per m²', '5.670374e-8*T^4/1000', 'kW')])
S['blackbody']['y'] = [0, '1.45e-14*T^5']
