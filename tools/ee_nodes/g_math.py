from lib import *
area('ee_math')
n('limits_continuity','Limits and continuity','concept','', 'What a function approaches, and whether it jumps.',
  'A limit asks what value a function heads toward as its input nears some point. A function is continuous if you can draw it without lifting the pen.',
  'Limits make instantaneous change and infinite sums precise. Circuit voltages across a capacitor are continuous; a switch flipping is modelled as a jump that the capacitor smooths.',
  'ε–δ definition: for every ε>0 there is δ>0 with |x−a|<δ ⇒ |f(x)−L|<ε. Piecewise models (ideal switches, step inputs) are discontinuous; physical energy storage keeps state variables continuous.',
  f='lim x→a f(x) = L', r='CA1:2.2 CA1:2.3 CA1:2.4', kn='calculus')
n('derivative','Derivative','concept','limits_continuity','The instantaneous rate of change of a quantity.',
  'The derivative tells how fast something is changing right now: speed from position, current from charge.',
  'Rules for sums, products, chains and common functions turn rate-of-change questions into algebra. In circuits, i = C·dv/dt and v = L·di/dt are derivatives.',
  'f′(x)=lim h→0 [f(x+h)−f(x)]/h. Linearization f(x+δ)≈f(x)+f′(x)δ underlies small-signal models of every nonlinear device.',
  f='i = dq/dt;  i_C = C·dv/dt', r='CA1:3.1 CA1:3.3 CA1:3.6', kn='calculus')
n('integral_ftc','Integral and the fundamental theorem','concept','derivative','Accumulating a rate over time or space.',
  'An integral adds up many tiny pieces: total charge from current over time, or total energy from power.',
  'The fundamental theorem links differentiation and integration as inverse operations, so antiderivatives compute areas exactly.',
  '∫ₐᵇ f dx = F(b)−F(a). Capacitor voltage v(t)=v(0)+(1/C)∫i dt; energy E=∫p dt. Riemann and Lebesgue definitions agree on well-behaved signals.',
  f='Q = ∫ i dt;  E = ∫ p dt', r='CA1:5.2 CA1:5.3', kn='calculus')
n('integration_techniques','Techniques of integration','technique','integral_ftc','Substitution, parts, partial fractions.',
  'Tricks to evaluate integrals that do not look simple: substitute a new variable, split into pieces, or use parts.',
  'Partial fractions are especially important because they invert Laplace and z transforms of rational functions.',
  'Integration by parts ∫u dv=uv−∫v du; improper integrals converge or diverge by comparison tests; numerical quadrature takes over when no closed form exists.',
  r='CA2:3.1 CA2:3.4 CA2:3.7', kn='calculus')
n('sequences_series','Sequences and infinite series','concept','integral_ftc','Adding infinitely many terms and when it settles.',
  'A series adds endless terms; some, like 1+½+¼+…, add up to a finite number.',
  'Convergence tests (ratio, comparison, integral) decide whether the sum exists. Geometric series appear in transmission-line multiple reflections and in the z-transform.',
  'Σ rⁿ = 1/(1−r) for |r|<1. Absolute vs conditional convergence matters when rearranging terms; uniform convergence justifies termwise differentiation.',
  f='Σₙ rⁿ = 1/(1−r)', r='CA2:5.1 CA2:5.2 CA2:5.6', kn='calculus')
n('taylor_series','Taylor and power series','concept','sequences_series derivative','Approximating a function by a polynomial.',
  'Near a point, almost any smooth function looks like a polynomial; more terms give a better match.',
  'Engineers truncate Taylor series to linearize a transistor curve or to derive sin x ≈ x for small angles; e^x and sin/cos are exactly their series.',
  'f(x)=Σ f⁽ⁿ⁾(a)(x−a)ⁿ/n!. Remainder bounds quantify truncation error. Radius of convergence is set by the nearest complex singularity.',
  f='eˣ = Σ xⁿ/n!', r='CA2:6.1 CA2:6.3 CA2:6.4', kn='calculus')
n('vectors_3d','Vectors, dot and cross product','concept','', 'Quantities with magnitude and direction.',
  'Vectors describe forces and fields. The dot product measures alignment; the cross product gives a perpendicular vector.',
  'Components in Cartesian, cylindrical and spherical coordinates let fields be written for the geometry at hand.',
  'a·b=|a||b|cosθ, a×b=|a||b|sinθ n̂. Orthogonal curvilinear coordinates carry scale factors that enter gradient, divergence and curl.',
  f='a·b = |a||b| cosθ', r='CA3:2.3 CA3:2.4 CA3:2.7 UP1:2.4')
n('partial_derivatives','Partial derivatives','concept','derivative vectors_3d','Rates of change with several variables.',
  'When a quantity depends on many inputs, a partial derivative asks how it changes if only one input moves.',
  'Partials give the slope of a transistor current with respect to gate voltage while drain voltage is held fixed: the transconductance.',
  'Total differential df=Σ(∂f/∂xᵢ)dxᵢ; the Jacobian generalises the chain rule and drives small-signal linearization and Newton iteration.',
  f='gm = ∂iD/∂vGS', r='CA3:4.3 CA3:4.4 CA3:4.5')
n('gradient_directional','Gradient and directional derivative','concept','partial_derivatives','The direction of steepest increase.',
  'The gradient points uphill. Electric field is the downhill direction of potential: E = −∇V.',
  'It turns a scalar map (potential, temperature) into a vector field and is perpendicular to level surfaces.',
  '∇f=(∂f/∂x,∂f/∂y,∂f/∂z); directional derivative D_u f=∇f·u. Gradient descent for optimization and training uses the same object.',
  f='E = −∇V', r='CA3:4.6', kn='electric_fields')
n('multiple_integrals','Multiple integrals','concept','integral_ftc partial_derivatives','Integrating over areas and volumes.',
  'Double and triple integrals add up a quantity over a surface or a volume, such as total charge from a charge density.',
  'Polar, cylindrical and spherical coordinates make symmetric problems easy, with a Jacobian factor for the volume element.',
  'Fubini lets iterated integrals swap order; change of variables multiplies by |det J|. Q=∭ρ dV is the source integral for Gauss’s law.',
  f='Q = ∭ ρ dV', r='CA3:5.1 CA3:5.4 CA3:5.5 CA3:5.7')
n('vector_fields_line_integrals','Vector fields and line integrals','concept','vectors_3d multiple_integrals','Fields and work done along a path.',
  'A vector field assigns an arrow to every point. A line integral adds the field’s push along a path, like work or voltage.',
  'If the field is conservative the answer depends only on endpoints, which is why voltage between two nodes is well defined in a static circuit.',
  '∫C F·dr; F=∇φ iff curl F=0 on simply connected domains. Faraday induction breaks conservativeness, which is why KVL needs care with changing flux.',
  f='V_ab = −∫ E·dl', r='CA3:6.1 CA3:6.2 CA3:6.3')
n('divergence_curl','Divergence and curl','concept','vector_fields_line_integrals gradient_directional','How a field spreads out and how it swirls.',
  'Divergence is net outflow per unit volume (sources and sinks); curl measures local rotation.',
  'Two of Maxwell’s equations are statements about divergence and two about curl.',
  '∇·F=∂Fx/∂x+∂Fy/∂y+∂Fz/∂z; ∇×F is the circulation density. Identities: ∇×∇φ=0, ∇·(∇×F)=0.',
  f='∇·F,  ∇×F', r='CA3:6.5', kn='maxwell')
n('greens_theorem','Green’s theorem','law','divergence_curl','Circulation around a loop equals curl inside.',
  'A loop integral around a flat region equals the total swirl inside it.',
  'It is the 2-D case of Stokes’ theorem and the first bridge between local differential and global integral forms.',
  '∮(P dx+Q dy)=∬(∂Q/∂x−∂P/∂y)dA for positively oriented piecewise-smooth boundaries.',
  f='∮(P dx+Q dy) = ∬(Qx−Py) dA', r='CA3:6.4')
n('stokes_theorem','Stokes’ theorem','law','greens_theorem','Circulation around an edge equals flux of curl through a surface.',
  'The line integral of a field around a closed loop equals the flux of its curl through any surface bounded by that loop.',
  'Turns Faraday’s law from differential to integral form: EMF around a loop equals −dΦ/dt.',
  '∮∂S F·dr=∬S(∇×F)·dS. Independence of surface follows from ∇·(∇×F)=0.',
  f='∮ F·dr = ∬ (∇×F)·dS', r='CA3:6.7')
n('divergence_theorem','Divergence theorem','law','divergence_curl','Net outflow through a closed surface equals source inside.',
  'Add up all the sources inside a volume and you get the total flow leaving through its surface.',
  'It converts Gauss’s law between its integral and point forms and gives charge conservation.',
  '∯S F·dS=∭V(∇·F)dV. Applied to J: ∇·J=−∂ρ/∂t.',
  f='∯ F·dS = ∭ ∇·F dV', r='CA3:6.8')
n('ode_first_order','First-order ODEs','concept','integration_techniques','Equations linking a quantity to its own rate.',
  'First-order equations, like dv/dt = −v/RC, describe exponential approach to a final value: charging, cooling, decay.',
  'Separable and linear first-order equations have closed forms; the integrating factor handles driven cases.',
  'y′+p(t)y=q(t) has y=e^{−∫p}[∫q e^{∫p}dt+C]. Time constant τ sets 63% rise in 1τ and ~99% in 5τ.',
  f='y′ + y/τ = u/τ', r='CA2:4.1 CA2:4.3 CA2:4.5', kn='ode_pde')
n('ode_second_order','Second-order linear ODEs','concept','ode_first_order','Oscillation, damping and resonance.',
  'Second-order equations govern masses on springs and RLC circuits: they can ring, decay smoothly, or in between.',
  'The characteristic equation s²+2ζω₀s+ω₀²=0 has real, repeated or complex roots giving over-, critical or under-damping.',
  'General solution = homogeneous + particular. Undetermined coefficients or variation of parameters handle drives; Q=1/(2ζ).',
  f='s² + 2ζω₀s + ω₀² = 0', r='CA3:7.1 CA3:7.2 CA3:7.3', kn='ode_pde oscillations')
n('ode_systems','Systems of ODEs','concept','ode_second_order','Many coupled quantities evolving together.',
  'Multi-capacitor and multi-inductor circuits give several linked equations, written as one matrix equation.',
  'Eigenvalues of the system matrix are the circuit’s natural frequencies; eigenvectors are its modes.',
  'ẋ=Ax+Bu with x(t)=e^{At}x₀+∫e^{A(t−τ)}Bu dτ. This is state-space form, shared by circuits, mechanics and control.',
  f='ẋ = A x + B u', r='CA3:7.1', kn='ode_pde')
n('laplace_math','Laplace transform','technique','ode_first_order integration_techniques','Turning differential equations into algebra.',
  'The Laplace transform converts calculus problems about time into algebra in a new variable s, then converts back.',
  'Derivatives become multiplication by s, so a circuit ODE becomes an algebraic equation, with initial conditions built in.',
  'F(s)=∫₀^∞ f(t)e^{−st}dt; L{f′}=sF−f(0); final-value and initial-value theorems; inverse via partial fractions or the Bromwich integral.',
  f='L{f′} = sF(s) − f(0)', x=wp('Laplace_transform'), kn='ode_pde')
n('pde_intro','Introduction to PDEs','concept','ode_second_order partial_derivatives','Heat, wave and Laplace equations.',
  'Partial differential equations describe fields varying in space and time: heat flow, waves on a line, and voltage on a conductor.',
  'Separation of variables splits a PDE into ODEs. The wave equation underlies transmission lines; Laplace’s equation underlies electrostatics.',
  'Heat: u_t=αu_xx; wave: u_tt=c²u_xx; Laplace: ∇²φ=0. Boundary conditions and uniqueness theorems decide which solutions are physical; numerical solvers (FDM, FEM) fill in for awkward geometries.',
  f='∇²V = 0;  ∂²u/∂t² = c² ∂²u/∂x²', x=wp('Partial_differential_equation'), kn='ode_pde heat_diffusion')
n('matrices_systems','Matrices and linear systems','concept','','Rectangular arrays that solve many equations at once.',
  'A matrix stores a list of equations compactly. Gaussian elimination solves them step by step.',
  'Nodal and mesh analysis of any circuit reduces to Ax=b with a conductance or impedance matrix.',
  'LU factorization costs ~⅔n³ flops; ill-conditioned A amplifies error by condition number κ(A). Sparse solvers power circuit simulators.',
  f='A x = b', r='PRE:9.5 PRE:9.6', x='MIT 18.06 Linear Algebra|https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', kn='linalg_hilbert')
n('determinants','Determinants','concept','matrices_systems','A single number telling if a matrix is invertible.',
  'The determinant is zero exactly when the equations are dependent, so there is no unique solution.',
  'It measures volume scaling of the transformation and appears in Cramer’s rule and in characteristic polynomials.',
  'det(AB)=det A·det B; det A=Πλᵢ. Singular node-admittance matrices flag floating nodes in a circuit.',
  f='det A = Π λᵢ', r='PRE:9.8')
n('vector_spaces','Vector spaces and bases','concept','determinants','Sets where you can add and scale; choosing coordinates.',
  'A vector space is any collection you can add and scale, from arrows to signals. A basis is a set of building blocks.',
  'Fourier series treat signals as vectors in a space whose basis is sines and cosines; inner products give projections.',
  'Span, independence, dimension, rank-nullity; orthogonal projection onto a subspace gives least squares; Hilbert spaces extend to infinite dimension.',
  kn='linalg_hilbert')
n('eigen','Eigenvalues and eigenvectors','concept','vector_spaces','Directions that a matrix only stretches.',
  'An eigenvector is not turned by a matrix, only scaled by its eigenvalue.',
  'Eigenvalues are the natural frequencies and decay rates of linear systems and decide stability.',
  'Av=λv, det(A−λI)=0. Symmetric matrices have real eigenvalues and orthogonal eigenvectors; the spectrum of A_state places closed-loop poles.',
  f='A v = λ v', kn='linalg_hilbert')
n('matrix_decompositions','Matrix decompositions (LU, QR, SVD)','technique','eigen','Factoring matrices for stable computation and insight.',
  'Breaking a matrix into simpler pieces makes solving, compressing and analysing data easier.',
  'SVD finds the dominant patterns in data (principal components, noise removal); QR gives stable least squares; Cholesky speeds symmetric solves.',
  'A=UΣVᵀ with singular values σ₁≥σ₂≥…; truncated SVD is the best low-rank approximation (Eckart–Young). Used in MIMO precoding, Kalman filter square-root forms and balanced model reduction.',
  f='A = U Σ Vᵀ', x=wp('Singular_value_decomposition'))
n('random_variables','Random variables and distributions','concept','integral_ftc','Numbers whose values come with probabilities.',
  'A random variable assigns a number to an uncertain outcome. Its distribution says how likely each value is.',
  'Bernoulli, binomial, Poisson, uniform, exponential and Gaussian distributions model bit errors, packet arrivals, component lifetimes and noise.',
  'PMF/PDF/CDF; the Gaussian N(μ,σ²) emerges from sums by the central limit theorem, which is why thermal noise is Gaussian.',
  f='f(x) = e^{−(x−μ)²/2σ²}/(σ√2π)', r='IST:4.1 IST:5.1 IST:6.1 IST:7.1', kn='probability')
n('expectation_variance','Expectation and variance','concept','random_variables','Average value and spread.',
  'The expected value is the long-run average; variance measures how widely values scatter around it.',
  'Noise power is variance; signal-to-noise ratio is a ratio of expectations.',
  'E[X]=∫x f dx; Var X=E[X²]−E[X]²; covariance and correlation generalise to pairs; linearity of expectation holds without independence.',
  f='Var X = E[X²] − (E[X])²', r='IST:4.2')
n('random_processes','Random processes','concept','expectation_variance','Signals that evolve randomly in time.',
  'A random process is a whole family of possible waveforms, like all the possible noise traces from a resistor.',
  'Stationarity lets us describe a process by its autocorrelation and power spectral density.',
  'Wiener–Khinchin: S(f)=F{R(τ)}. White noise has flat PSD; filtering by H(f) multiplies PSD by |H(f)|². Ergodicity lets one long trace stand in for the ensemble.',
  f='S_y(f) = |H(f)|² S_x(f)', r='DSC:5.1', x=wp('Stochastic_process'))
n('noise_modeling','Noise modelling','concept','random_processes','Thermal, shot and flicker noise.',
  'Every resistor hisses faintly from random electron motion; every current also carries shot noise from discrete charges.',
  'Thermal noise 4kTRB, shot noise 2qIB and 1/f noise are modelled as random sources added to circuits.',
  'v_n²=4kTRΔf (Johnson–Nyquist); noise figure F=SNR_in/SNR_out; Friis cascade sets receiver sensitivity. Quantum limits appear at very low T or high f.',
  f='v_n² = 4kTRΔf', kn='statistical_mechanics')
n('estimation_theory','Estimation','technique','expectation_variance','Inferring hidden values from noisy data.',
  'Estimation turns noisy measurements into the best guess of the underlying quantity.',
  'Least squares, maximum likelihood, and Kalman filtering are the working tools of sensors, GPS and radar.',
  'Cramér–Rao bound Var(θ̂)≥1/I(θ). Kalman filter is the MMSE estimator for linear-Gaussian state-space models; Bayesian estimation gives the posterior.',
  f='Var(θ̂) ≥ 1/I(θ)', r='IST:12.3', kn='bayes_stats')
n('complex_numbers','Complex numbers','concept','','Numbers with a real and an imaginary part.',
  'Complex numbers a+jb live on a plane; engineers write j so as not to confuse it with current i.',
  'Multiplying by j rotates by 90°. Magnitude and phase make sinusoids easy to add.',
  'Polar form re^{jθ}; conjugate z*; |z|²=zz*; the complex plane is the natural home of impedances, poles and spectra.',
  f='z = a + jb = r e^{jθ}', r='PRE:3.1 PRE:8.5')
n('euler_formula','Euler’s formula','law','complex_numbers taylor_series','e^{jθ} = cosθ + j sinθ.',
  'Euler’s formula ties exponentials to sines and cosines and turns trigonometry into multiplication.',
  'Proven by comparing Taylor series. cosωt = Re{e^{jωt}} is the basis of phasors.',
  'cosθ=(e^{jθ}+e^{−jθ})/2; Euler identity e^{jπ}=−1; generalises to complex exponentials as eigenfunctions of LTI systems.',
  f='e^{jθ} = cosθ + j sinθ', x=wp("Euler's_formula"))
n('phasors_math','Phasors','concept','euler_formula','Rotating arrows that stand in for sinusoids.',
  'A phasor captures the size and phase of a sinusoid at a known frequency, so adding waves means adding arrows.',
  'Differentiation becomes multiplication by jω, which is why AC circuits behave like algebraic DC ones.',
  'v(t)=Re{V e^{jωt}} with V=|V|∠φ. Valid for steady-state linear systems at a single frequency; superpose across frequencies.',
  f='d/dt → jω', lab='circuit:ac_phasors', kn='circuits_ohm')
n('poles_zeros','Poles, zeros and the s-plane','concept','complex_numbers laplace_math','Where a transfer function blows up or vanishes.',
  'Poles are the complex frequencies where a system’s response is infinite, zeros where it vanishes. Together they sketch the response.',
  'Poles in the left half-plane mean decaying behaviour (stable); on the imaginary axis, oscillation; in the right half, runaway.',
  'H(s)=K Π(s−zᵢ)/Π(s−pⱼ). Frequency response is |H(jω)| read off the pole-zero plot by distances to jω.',
  f='H(s) = K Π(s−zᵢ)/Π(s−pⱼ)', lab='control:pole_zero_map')
n('contour_integration','Contour integration basics','technique','poles_zeros integral_ftc','Integrals in the complex plane via residues.',
  'Integrals along loops in the complex plane can be computed from the poles inside them.',
  'It gives inverse Laplace transforms and some real integrals that otherwise resist; also the Nyquist stability criterion’s argument principle.',
  '∮f dz=2πj Σ Res f(zₖ) (Cauchy). Argument principle: N=Z−P encirclements. Jordan’s lemma handles semicircle arcs.',
  f='∮ f dz = 2πj ΣRes', x=wp('Residue_theorem'))
n('logic_boolean_math','Logic, sets and Boolean algebra','concept','','Reasoning with true/false and collections.',
  'Logic combines true/false statements with AND, OR and NOT; sets collect things; Boolean algebra is the algebra of both.',
  'Boolean algebra is exactly what logic gates compute; De Morgan’s laws let you swap AND and OR.',
  'Boolean lattice axioms; De Morgan: ¬(A∧B)=¬A∨¬B. Shannon (1937) showed relay circuits implement Boolean algebra.',
  f='¬(A·B) = ¬A + ¬B', r='CMA:2.1 CMA:2.6 CMA:1.4', kn='logic_sets', lab='logic:boolean_playground')
n('graph_theory_ee','Graphs and trees','concept','logic_boolean_math','Nodes and edges.',
  'A graph is dots joined by lines. A circuit diagram is a graph, and so is a network of computers.',
  'Trees and cut sets give systematic mesh and node counts; shortest-path algorithms route packets.',
  'Kirchhoff’s matrix-tree theorem counts spanning trees from the Laplacian; independent KCL equations = n−1, KVL = b−n+1.',
  r='CMA:12.1 CMA:12.10', kn='graph_theory')
n('combinatorics_ee','Combinatorics','concept','logic_boolean_math','Counting arrangements.',
  'Permutations and combinations count the ways things can be ordered or chosen.',
  'Used to count code words, bit patterns and error events, and in probability.',
  'C(n,k)=n!/(k!(n−k)!); binomial pmf P(k errors)=C(n,k)pᵏ(1−p)^{n−k}; the number of binary words of length n is 2ⁿ.',
  f='C(n,k) = n!/(k!(n−k)!)', r='CMA:7.2 CMA:7.3')
n('root_finding','Numerical root finding','technique','derivative','Solving f(x)=0 by iteration.',
  'When an equation cannot be solved on paper, step toward the answer by repeated guesses (bisection, Newton).',
  'Circuit simulators solve nonlinear diode and transistor equations with Newton–Raphson at every timestep.',
  'xₙ₊₁=xₙ−f/f′ converges quadratically near simple roots; bisection is slow but sure; damping and homotopy help SPICE convergence.',
  f='x₍n+1₎ = xₙ − f(xₙ)/f′(xₙ)', x=wp('Newton%27s_method'), lab='math:newton_iteration')
n('numerical_integration','Numerical integration','technique','integral_ftc','Approximating areas by sums.',
  'Trapezoid and Simpson rules estimate integrals from sampled values.',
  'Used inside simulators to step through time and to compute energy and RMS from measured data.',
  'Trapezoid error O(h²), Simpson O(h⁴); Gauss quadrature reaches higher order with fewer points.',
  f='∫f ≈ h/2 [f₀ + 2f₁ + … + fₙ]', r='CA2:3.6')
n('ode_solvers','Numerical ODE solvers','technique','ode_first_order numerical_integration','Stepping differential equations forward in time.',
  'Euler’s method advances using the slope; better methods (Runge–Kutta, backward Euler) are more accurate or more stable.',
  'SPICE uses implicit trapezoidal or Gear methods so that stiff circuits with fast and slow time constants stay stable.',
  'Local error O(hᵖ⁺¹); stiffness requires A-stable implicit methods; adaptive step control keeps error below tolerance.',
  f='yₙ₊₁ = yₙ + h f(tₙ, yₙ)', r='CA2:4.2', lab='math:ode_stepper')
n('error_analysis','Error analysis','concept','numerical_integration','Rounding, truncation, and conditioning.',
  'Every computation and measurement has error; knowing how big it is makes results trustworthy.',
  'Truncation error from approximating, round-off from finite digits, and conditioning that amplifies both.',
  'Machine epsilon 2⁻⁵² for doubles; catastrophic cancellation; propagation δf≈Σ|∂f/∂xᵢ|δxᵢ; backward stability.',
  f='δf ≈ Σ |∂f/∂xᵢ| δxᵢ', r='UP1:1.6')
n('fourier_math','Fourier analysis (mathematical view)','concept','vector_spaces euler_formula integral_ftc','Any signal is a sum of sinusoids.',
  'Fourier showed that periodic waves are sums of sine waves at multiples of a base frequency.',
  'Orthogonality of sines makes the coefficients easy to compute with an integral; the idea extends to non-repeating signals.',
  'Convergence (Dirichlet), Gibbs overshoot ~9% at jumps, Parseval’s theorem equates energy in time and frequency.',
  f='x(t)=Σ cₖ e^{jkω₀t}', kn='fourier')
save('ee_math')
