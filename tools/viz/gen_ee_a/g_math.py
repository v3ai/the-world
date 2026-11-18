from lib import *
import math

def build(S):
    S['limits_continuity'] = plot(
        [F('sin(x)/x', 'f(x) = sin x / x')], 'Slide x toward 0 from the right: f(x) never reaches 0/0 there, yet it closes in on L = 1. That is what a limit means.',
        x=[-10, 10], y=[-0.4, 1.2],
        hlines=[{'y': 1, 'label': 'L = 1'}],
        points=[{'x': 'd', 'y': 'sin(d)/d', 'label': 'x = {d} → f = {sin(d)/d}'}],
        params=[P('d', 'x (approaching 0)', 0.02, 6, 1.6, step=0.02)],
        readouts=[R('gap |f(x) − 1|', 'abs(sin(d)/d-1)')])

    S['integration_techniques'] = plot(
        [F('x*exp(-x)', 'f(x) = x e⁻ˣ')], 'Integration by parts turns ∫x e⁻ˣ dx into −(x+1)e⁻ˣ. Drag b and watch the shaded area match the closed form.',
        x=[0, 8], y=[-0.05, 0.45],
        shade={'f': 'x*exp(-x)', 'from': 0, 'to': 'b'},
        params=[P('b', 'upper limit b', 0.2, 8, 3)],
        readouts=[R('∫₀ᵇ x e⁻ˣ dx = 1 − (b+1)e⁻ᵇ', '1-(b+1)*exp(-b)'), R('→ as b→∞', '1')])

    S['sequences_series'] = plot(
        [F('(1-r^(floor(x)+1))/(1-r)', 'partial sum Sₙ', 'accent')], 'Partial sums of 1 + r + r² + … settle toward 1/(1−r) when |r| < 1. Push r toward 1 and the series barely converges.',
        x=[0, 20], y=[-0.5, 6],
        hlines=[{'y': '1/(1-r)', 'label': 'limit 1/(1−r)', 'color': 'gold'}],
        xlabel='number of terms n',
        params=[P('r', 'ratio r', -0.9, 0.9, 0.7)],
        readouts=[R('limit 1/(1−r)', '1/(1-r)')])

    S['vectors_3d'] = spec('vectors', 'The dot product measures how much two vectors point the same way; the cross product (its z-part, here) measures the area they span. Drag b around a.',
        params=[P('bx', 'b_x', -3, 3, 1), P('by', 'b_y', -3, 3, 2)],
        readouts=[R('a·b = |a||b|cosθ', '3*bx+by'), R('(a×b)_z = area', '3*by-bx'), R('angle θ', 'deg(atan2(3*by-bx,3*bx+by))', '°')],
        range=4, vectors=[{'x': 3, 'y': 1, 'label': 'a', 'color': 'accent'}, {'x': 'bx', 'y': 'by', 'label': 'b', 'color': 'gold'}])

    S['partial_derivatives'] = plot(
        [F('x^2/4+x*y0', 'f(x, y₀) = x²/4 + x y₀')], 'Fix y at y₀ and you have an ordinary curve in x; its slope is the partial derivative ∂f/∂x. Change y₀ to tilt the slice.',
        x=[-3, 3], y=[-8, 8], tangent={'at': 'x0'},
        params=[P('y0', 'fixed y₀', -2, 2, 1), P('x0', 'point x₀', -2.5, 2.5, 1)],
        readouts=[R('∂f/∂x = x₀/2 + y₀', 'x0/2+y0')])

    S['multiple_integrals'] = spec('heatmap', 'A double integral adds up density over an area. The total of a Gaussian blob is ρ₀·π·σ²: widen it or raise its peak and the total follows.',
        f='r0*exp(-(x^2+y^2)/s0^2)', x=[-2, 2], y=[-2, 2], z=[0, 3], equal=True,
        params=[P('r0', 'peak density ρ₀', 0.5, 3, 2), P('s0', 'width σ', 0.3, 1, 0.7)],
        readouts=[R('total ∬ρ dA = π ρ₀ σ²', 'pi*r0*s0^2')])

    S['vector_fields_line_integrals'] = spec('field', 'Work along a path is ∮F·dl. For this swirling field, a circle of radius R collects 2πR²: the longer the path with the field, the more work.',
        range=[-3, 3, -3, 3], vx='-y', vy='x', density=11,
        shapes=[{'k': 'circle', 'x': 0, 'y': 0, 'r': 'R', 'color': 'gold', 'width': 2.5}],
        params=[P('R', 'path radius R', 0.5, 2.8, 1.5)],
        readouts=[R('∮ F·dl = 2πR²', '2*pi*R^2')])

    S['divergence_curl'] = spec('field', 'Divergence says how much a field spreads out (outward arrows); curl says how much it swirls. Mix the two sliders: F = (a x − c y, a y + c x).',
        range=[-3, 3, -3, 3], vx='a*x-c*y', vy='a*y+c*x', density=11,
        params=[P('a', 'spread a', -1, 1, 0.6), P('c', 'swirl c', -1, 1, 0.6)],
        readouts=[R('∇·F', '2*a'), R('(∇×F)_z', '2*c')])

    S['greens_theorem'] = spec('field', 'Green: the circulation around the square equals the curl summed over its inside. For F = (−y, (1+p)x) the curl is 2+p everywhere, so both sides are (2+p)·4h².',
        range=[-3, 3, -3, 3], vx='-y', vy='(1+p)*x', density=11,
        shapes=[{'k': 'rect', 'x': '-h', 'y': '-h', 'w': '2*h', 'h': '2*h', 'color': 'gold', 'width': 2.5}],
        params=[P('h', 'half-side h', 0.5, 2.5, 1.5), P('p', 'field strength p', 0, 2, 0.5)],
        readouts=[R('curl Q_x − P_y', '2+p'), R('∮ F·dr = ∬ curl dA', '(2+p)*4*h^2')])

    S['stokes_theorem'] = geo([
        {'k': 'curve', 'x': '2*cos(s)', 'y': '0.55*sin(s)-0.8', 's': [0, 6.2832], 'color': 'gold', 'width': 3},
        line(-2, -0.8, 2, -0.8, 'dim', dash=True),
        {'k': 'curve', 'x': '2*cos(s)', 'y': 'h*sin(s)-0.8', 's': [0, 3.1416], 'color': 'accent'},
        arrow(2, -0.8, 2, -0.1, 'pink'), arrow(-2, -0.8, -2, -1.5, 'pink'),
        text(0, 1.8, 'two surfaces, one edge', 'white'), text(0, -2.2, 'edge circulation ∮F·dr = flux of curl = {2*pi*2^2*k0}', 'gold')],
        [-3, 3, -2.8, 2.6], 'Stokes: the circulation around the gold edge equals the flux of the curl through any surface it bounds, flat or domed. Change the dome height; the answer does not move.',
        params=[P('h', 'dome height', 0.2, 2.2, 1.4), P('k0', 'curl strength', 0.2, 2, 1)],
        readouts=[R('∮ F·dr = flux of ∇×F  (R=2)', '2*pi*4*k0')], aspect=0.7)

    S['divergence_theorem'] = spec('field', 'Divergence theorem: the net outflow through the closed loop equals the total source inside. Here ∇·F = 2k everywhere, so flux = 2kπR².',
        range=[-3, 3, -3, 3], vx='k0*x', vy='k0*y', density=11,
        shapes=[{'k': 'circle', 'x': 0, 'y': 0, 'r': 'R', 'color': 'gold', 'width': 2.5}],
        params=[P('k0', 'source strength k', -1, 1, 0.6), P('R', 'loop radius R', 0.5, 2.8, 1.5)],
        readouts=[R('∮ F·n dl', '2*pi*R*k0*R'), R('∬ ∇·F dA = 2kπR²', '2*k0*pi*R^2')])

    S['ode_first_order'] = plot(
        [F('u+(y0-u)*exp(-x/tau)', 'y(t)', 'accent'), F('u', 'final value', 'dim', dash=True)],
        'y′ + y/τ = u/τ: the quantity creeps from its start toward u, covering 63% of the gap every time constant τ.',
        x=[0, 10], y=[-0.1, 5.2], xlabel='time',
        points=[{'x': 'tau', 'y': 'u+(y0-u)*exp(-1)', 'label': 't = τ'}],
        params=[P('tau', 'time constant τ', 0.3, 4, 1.5), P('u', 'input u', 1, 5, 4), P('y0', 'start y(0)', 0, 5, 0.5)],
        readouts=[R('settled (5τ)', '5*tau', 's')])

    S['ode_second_order'] = plot(
        [F('if(z<1, 1-exp(-z*4*x)*(cos(4*sqrt(1-z^2)*x)+z/sqrt(1-z^2)*sin(4*sqrt(1-z^2)*x)), 1-exp(-z*4*x)*(cosh(4*sqrt(z^2-1)*x)+z/sqrt(z^2-1)*sinh(4*sqrt(z^2-1)*x)))', 'step response', 'accent'),
         F('1', None, 'dim', dash=True)],
        's² + 2ζω₀s + ω₀² = 0. Small damping ζ rings and overshoots; ζ = 1 is the fastest without overshoot; large ζ is sluggish. Here ω₀ = 4 rad/s.',
        x=[0, 5], y=[0, 1.9],
        params=[P('z', 'damping ζ', 0.1, 2, 0.3, step=0.07)],
        readouts=[R('overshoot', 'z<1 ? 100*exp(-pi*z/sqrt(1-z^2)) : 0', '%'), R('Q = 1/(2ζ)', '1/(2*z)')])

    S['ode_systems'] = spec('field', 'ẋ = A x with A = [[−a, −w],[w, −a]]: trajectories spiral. With a > 0 they spiral in (stable); a < 0 they spiral out (unstable).',
        range=[-3, 3, -3, 3], vx='-a*x-w*y', vy='w*x-a*y', streamlines=True, density=9,
        params=[P('a', 'damping a', -0.4, 1, 0.3), P('w', 'rotation w', 0, 2, 1)],
        readouts=[R('eigenvalues: real part', '-a'), R('imaginary part ±', 'w')])

    S['laplace_math'] = plot(
        [F('exp(-a*x)*cos(w*x)', 'f(t) = e^(−at) cos ωt', 'accent'), F('exp(-a*x)', None, 'dim', dash=True), F('-exp(-a*x)', None, 'dim', dash=True)],
        'The Laplace transform of this decaying cosine has poles at s = −a ± jω. Decay a is the real part of the pole; the ringing frequency ω is the imaginary part.',
        x=[0, 10], y=[-1.2, 1.2], xlabel='time t',
        params=[P('a', 'decay a', 0.05, 1.5, 0.4), P('w', 'frequency ω', 0.5, 6, 3)],
        readouts=[R('pole real part −a', '-a'), R('pole imaginary part ±ω', 'w')])

    S['pde_intro'] = plot(
        [F('sin(pi*x)*exp(-k*pi^2*mod(t,4))+0.5*sin(3*pi*x)*exp(-9*k*pi^2*mod(t,4))', 'u(x, t)', 'accent'),
         F('sin(pi*x)+0.5*sin(3*pi*x)', 'start', 'dim', dash=True)],
        'Heat equation ∂u/∂t = k ∂²u/∂x²: the sharp 3rd harmonic dies 9× faster than the smooth one, so the profile smooths out. Raise k for faster diffusion.',
        x=[0, 1], y=[-1.4, 1.6], xlabel='position along rod',
        params=[P('k', 'diffusivity k', 0.02, 0.2, 0.08)],
        readouts=[R('slowest-mode decay rate kπ²', 'k*pi^2', '1/s')])

    S['matrices_systems'] = plot(
        [F('4-x', 'x + y = 4', 'accent'), F('p*x-q', 'p x − y = q', 'pink')],
        'Each equation of A x = b is a line; the solution is where they cross. When the lines become parallel (p = −1) det A = 0 and there is no unique answer.',
        x=[-2, 6], y=[-4, 8], equal=False,
        points=[{'x': '(4+q)/(1+p)', 'y': '4-(4+q)/(1+p)', 'label': 'solution'}],
        params=[P('p', 'slope p', -2, 3, 2, step=0.05), P('q', 'offset q', -2, 2, 1)],
        readouts=[R('det A', '-1-p'), R('x', '(4+q)/(1+p)'), R('y', '4-(4+q)/(1+p)')])

    S['determinants'] = spec('vectors', 'The determinant is the factor by which the matrix scales area (the gold square). It hits 0 when the plane is flattened onto a line: the matrix is not invertible.',
        range=3, matrix=[['a', 'b'], ['0.5', 'd']],
        params=[P('a', 'a', -2, 2, 1.2), P('b', 'b', -2, 2, 0.6), P('d', 'd', -2, 2, 1)],
        readouts=[R('det = a d − 0.5 b', 'a*d-0.5*b')])

    S['vector_spaces'] = spec('vectors', 'The same vector v has different coordinates in different bases. Change the angle between the basis vectors and watch the coordinates (c₁, c₂) change while v stays put.',
        range=3.5, matrix=[['1', 'cos(th)'], ['0', 'sin(th)']],
        vectors=[{'x': 2, 'y': 1.5, 'label': 'v', 'color': 'gold'}],
        params=[P('th', 'angle between b₁ and b₂', 0.4, 2.7, 1.2)],
        readouts=[R('c₂', '1.5/sin(th)'), R('c₁ = 2 − c₂ cosθ', '2-1.5/sin(th)*cos(th)')])

    S['matrix_decompositions'] = spec('vectors', 'SVD says any matrix is rotate–stretch–rotate. Here A = R(φ)·diag(σ₁, σ₂): the unit square becomes a parallelogram stretched by σ₁ and σ₂. A big σ₁/σ₂ means ill-conditioned.',
        range=3, matrix=[['s1*cos(ph)', '-s2*sin(ph)'], ['s1*sin(ph)', 's2*cos(ph)']],
        params=[P('s1', 'σ₁', 0.5, 2.5, 2), P('s2', 'σ₂', 0.1, 1.5, 0.6), P('ph', 'rotation φ', -1.5, 1.5, 0.5)],
        readouts=[R('condition number σ₁/σ₂', 's1/s2'), R('det = σ₁σ₂', 's1*s2')])

    S['expectation_variance'] = spec('dist', 'A binomial count has mean np and variance np(1−p). Change n and p: the centre of the bars follows the mean and the width follows the variance.',
        kind='binomial', n='nn', p='pp', sample=True,
        params=[P('nn', 'trials n', 2, 40, 20, step=1), P('pp', 'probability p', 0.05, 0.95, 0.4)],
        readouts=[R('E[X] = np', 'nn*pp'), R('Var X = np(1−p)', 'nn*pp*(1-pp)'), R('σ', 'sqrt(nn*pp*(1-pp))')])

    nz = 'sin(2*pi*3*x)+nz*(rand(floor(x*120)+floor(t*1.5)*977)-0.5)*2'
    S['random_processes'] = spec('signal', 'One realisation of a random process: a 3 Hz tone buried in noise (a fresh noise draw appears every moment). The spectrum below shows the tone standing above the noise floor.',
        x=[0, 2], y=[-3, 3], f=nz, spectrum=True, fmax=40,
        params=[P('nz', 'noise level', 0, 3, 1)],
        readouts=[R('tone-to-noise amplitude', '1/max(nz,0.01)')])

    S['noise_modeling'] = plot(
        [F('sqrt(4*1.380649e-23*T*x*B*1000)*1e6', 'v_n (µV rms)', 'accent')],
        'Thermal noise v_n = √(4kTRΔf): it grows with the square root of resistance, temperature and bandwidth. Compare a 1 kΩ and a 1 MΩ resistor on the log axes.',
        x=[10, 10000000], y=[0.01, 1000], logx=True, logy=True, xlabel='resistance (Ω)',
        points=[{'x': 'Rr', 'y': 'sqrt(4*1.380649e-23*T*Rr*B*1000)*1e6', 'label': '{sqrt(4*1.380649e-23*T*Rr*B*1000)*1e6} µV'}],
        params=[P('T', 'temperature', 200, 400, 300, 'K'), P('B', 'bandwidth', 0.1, 100, 10, 'kHz'), P('Rr', 'resistance', 100, 5000000, 10000, 'Ω', step=100)],
        readouts=[R('v_n at chosen R', 'sqrt(4*1.380649e-23*T*Rr*B*1000)*1e6', 'µV')])

    S['estimation_theory'] = plot(
        [F('gauss(x,0,s0)', 'one measurement', 'dim'), F('gauss(x,0,s0/sqrt(N))', 'average of N', 'gold')],
        'Averaging N noisy readings narrows the spread of the estimate by √N. No unbiased estimator can beat the Cramér–Rao bound Var ≥ σ²/N, and the plain average reaches it.',
        x=[-5, 5], xlabel='estimate error',
        params=[P('s0', 'noise σ', 0.5, 3, 1.5), P('N', 'samples N', 1, 100, 9, step=1)],
        readouts=[R('estimate spread σ/√N', 's0/sqrt(N)')])

    S['complex_numbers'] = geo([
        line(-3.2, 0, 3.2, 0, 'dim', 1), line(0, -2.4, 0, 2.4, 'dim', 1),
        text(3, -0.3, 'real', 'dim'), text(0.4, 2.3, 'imag (j)', 'dim'),
        circle(0, 0, 'hypot(re,im)', 'dim', alpha=0.5),
        arrow(0, 0, 're', 'im', 'gold', 3),
        line('re', 0, 're', 'im', 'accent', dash=True), line(0, 'im', 're', 'im', 'accent', dash=True),
        point('re', 'im', 'gold', 6),
        {'k': 'arc', 'x': 0, 'y': 0, 'r': 0.6, 'a0': 0, 'a1': 'atan2(im,re)', 'color': 'pink'},
        text('re*0.5+(re>0?0.7:-0.7)', 'im+0.35', 'z = {re} + j{im}', 'gold')],
        [-3.5, 3.5, -2.6, 2.6], 'A complex number is a point (or arrow) in the plane: a + jb in rectangular form, r∠θ in polar form. Drag a and b and watch r and θ update.',
        params=[P('re', 'real part a', -3, 3, 2), P('im', 'imaginary part b', -2.2, 2.2, 1.2)],
        readouts=[R('magnitude r', 'hypot(re,im)'), R('angle θ', 'deg(atan2(im,re))', '°')], aspect=0.62)

    S['euler_formula'] = geo([
        line(-1.6, 0, 1.6, 0, 'dim', 1), line(0, -1.4, 0, 1.4, 'dim', 1),
        circle(0, 0, 1, 'dim'),
        arrow(0, 0, 'cos(th)', 'sin(th)', 'gold', 3), point('cos(th)', 'sin(th)', 'gold', 6),
        line('cos(th)', 0, 'cos(th)', 'sin(th)', 'accent', dash=True), line(0, 'sin(th)', 'cos(th)', 'sin(th)', 'pink', dash=True),
        point('cos(th)', 0, 'accent', 5), point(0, 'sin(th)', 'pink', 5),
        text(0, -1.25, 'e^(jθ) = {cos(th)} + j{sin(th)}', 'white')],
        [-1.7, 1.7, -1.45, 1.45], 'e^(jθ) is a point on the unit circle: its real part is cosθ and its imaginary part is sinθ. Turn θ to 90° and you get j; to 180° and e^(jπ) = −1.',
        params=[P('th', 'angle θ', 0, 6.2832, 0.9, 'rad')],
        readouts=[R('cosθ', 'cos(th)'), R('sinθ', 'sin(th)'), R('θ in degrees', 'deg(th)', '°')], aspect=0.75)

    S['poles_zeros'] = spec('pz', 'H(s) = K Π(s − zᵢ)/Π(s − pⱼ). Poles (×) are where the response blows up; the closer to the jω axis, the longer the ringing. Poles in the right half-plane are unstable.',
        range=4, poles=[['-a', 'w'], ['-a', '-w']], zeros=[['-zz', 0]],
        params=[P('a', 'pole damping a', -0.5, 3, 1), P('w', 'pole frequency ω', 0.2, 3, 1.5), P('zz', 'zero at −z', 0, 3.5, 2)],
        readouts=[R('ζ = a/√(a²+ω²)', 'a/sqrt(a^2+w^2)'), R('natural freq ω₀', 'sqrt(a^2+w^2)', 'rad/s')])

    S['contour_integration'] = geo([
        line(-3.2, 0, 3.2, 0, 'dim', 1), line(0, -2.4, 0, 2.4, 'dim', 1),
        circle(0, 0, 'R', 'gold', width=3),
        text(1, 0, '×', 'pink', 18), text(-1.5, 0, '×', 'pink', 18), text(0, 0.6, '×', 'pink', 18),
                text(0, -2.1, 'enclosed poles: {(1<R)+(1.5<R)+(0.6<R)}', 'gold')],
        [-3.5, 3.5, -2.6, 2.6], 'The contour integral ∮f dz = 2πj Σ(residues inside). Grow the circle and each pole it swallows adds its residue (each is 1 here) to the answer.',
        params=[P('R', 'contour radius', 0.2, 3, 0.9)],
        readouts=[R('poles inside', '(1<R)+(1.5<R)+(0.6<R)'), R('|∮ f dz|', '2*pi*((1<R)+(1.5<R)+(0.6<R))')], aspect=0.75)

    S['logic_boolean_math'] = spec('logic', "De Morgan's law: ¬(A·B) = ¬A + ¬B. Toggle the inputs: the two sides always agree, so this circuit (their XNOR) outputs 1 in every row.",
        inputs=['A', 'B'], expr='xnor(!(A & B), (!A | !B))', output='Y')

    S['combinatorics_ee'] = spec('dist', 'The bar height at k is C(n,k)/2ⁿ: the number of ways to choose k items from n. These counts are the rows of Pascal’s triangle and the shape of a binomial.',
        kind='binomial', n='nn', p='0.5', shade=['kk', 'kk'],
        params=[P('nn', 'items n', 2, 20, 10, step=1), P('kk', 'chosen k', 0, 20, 4, step=1)],
        readouts=[R('C(n,k)', 'kk<=nn ? choose(nn,kk) : 0'), R('all subsets 2ⁿ', '2^nn')])

    xn = lambda e: f'({e}+2/({e}))/2'
    x1 = xn('x0'); x2 = xn(x1); x3 = xn(x2)
    S['root_finding'] = plot(
        [F('x^2-2', 'f(x) = x² − 2', 'accent'), F('0', None, 'dim', dash=True)],
        'Newton’s method rides the tangent line down to the x-axis to get a better guess: x₍n+1₎ = xₙ − f/f′. Start anywhere positive and it homes in on √2 in a few steps.',
        x=[0, 4.2], y=[-3, 6], tangent={'at': 'x0'},
        points=[{'x': x1, 'y': 0, 'label': 'x₁', 'color': 'pink'}, {'x': x2, 'y': 0, 'label': 'x₂', 'color': 'green'}],
        params=[P('x0', 'starting guess x₀', 0.6, 4, 3.5)],
        readouts=[R('x₁', x1), R('x₂', x2), R('x₃ (√2 = 1.41421)', x3)])

    hh = 'pi/N'
    lo = f'sin({hh}*floor(x/({hh})))'; hi = f'sin({hh}*(floor(x/({hh}))+1))'
    S['numerical_integration'] = plot(
        [F('sin(x)', 'f(x) = sin x', 'accent'), F(f'{lo}+({hi}-{lo})*(x/({hh})-floor(x/({hh})))', 'trapezoid fit', 'gold')],
        'The trapezoid rule replaces the curve with straight pieces and adds up the strips. More strips (bigger N) shrink the error; here the exact area is 2.',
        x=[0, 3.1416], y=[-0.1, 1.15],
        params=[P('N', 'strips N', 1, 16, 3, step=1)],
        readouts=[R('trapezoid sum', f'({hh})/tan(({hh})/2)'), R('error vs exact 2', f'2-({hh})/tan(({hh})/2)')])

    S['ode_solvers'] = plot(
        [F('exp(-x)', 'exact e⁻ᵗ', 'accent'), F('(1-h)^floor(x/h)', 'Euler steps', 'gold')],
        'Euler’s method steps y′ = −y forward: yₙ₊₁ = yₙ + h f. Small h tracks the exact curve; h > 1 overshoots into oscillation, and h > 2 blows up.',
        x=[0, 6], y=[-1.2, 1.2], xlabel='time',
        params=[P('h', 'step size h', 0.05, 2.1, 0.5, step=0.05)],
        readouts=[R('growth per step |1−h|', 'abs(1-h)')])

    S['error_analysis'] = geo([
        line(0.2, 0, 4.4, 0, 'dim', 1),
        rect(0.5, 0, 0.9, '2*eV', 'accent', 'accent', alpha=0.7), text(0.95, -0.9, '2·δV/V', 'accent', 10),
        rect(1.6, 0, 0.9, 'eR', 'pink', 'pink', alpha=0.7), text(2.05, -0.9, 'δR/R', 'pink', 10),
        rect(2.7, 0, 0.9, '2*eV+eR', 'gold', 'gold', alpha=0.7), text(3.15, -0.9, 'worst case', 'gold', 10),
        rect(3.8, 0, 0.9, 'sqrt((2*eV)^2+eR^2)', 'green', 'green', alpha=0.7), text(4.25, -0.9, 'RSS', 'green', 10),
        text(2.5, 15.5, 'error in P = V²/R  (%)', 'white')],
        [0, 5, -2, 17], 'Errors propagate through a formula: for P = V²/R the voltage error counts twice (power 2) and the resistor error once. The worst case adds them; independent errors combine as a root-sum-square.',
        params=[P('eV', 'voltage error δV/V', 0.1, 5, 2, '%'), P('eR', 'resistor error δR/R', 0.1, 5, 1, '%')],
        readouts=[R('worst case δP/P', '2*eV+eR', '%'), R('RSS δP/P', 'sqrt((2*eV)^2+eR^2)', '%')], equal=False, aspect=0.6)

    harm = ' '.join(f'+ if(N>={k},{"-" if k%2==0 else ""}sin(2*pi*{k}*x)/{k},0)' for k in range(2, 11))
    S['fourier_math'] = spec('signal', 'Any periodic signal is a sum of sinusoids. These are the first N harmonics of a sawtooth (aₖ = 2/πk); more terms sharpen the ramp, and the overshoot at the jump never disappears (Gibbs).',
        x=[0, 2], f=f'2/pi*(sin(2*pi*x) {harm})', spectrum=True, fmax=12,
        params=[P('N', 'harmonics N', 1, 10, 3, step=1)],
        readouts=[R('amplitude of kth harmonic ∝ 1/k', '1/N')])
