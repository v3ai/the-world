from lib import *
area('ee_physics')
n('si_units_ee','Units, dimensions and prefixes','concept','','The shared language of measurement.',
  'Volts, amps, ohms, farads and henries are units; prefixes like milli- and mega- scale them. Checking units catches many mistakes.',
  'Dimensional analysis shows that RC has units of seconds and that √(L/C) has units of ohms.',
  'SI base units include the ampere (defined via the elementary charge e=1.602176634×10⁻¹⁹ C since 2019); decibels express ratios logarithmically: dB=20log₁₀(V₂/V₁).',
  f='dB = 20 log₁₀(V₂/V₁)', r='UP1:1.2 UP1:1.4', kn='si_units')
n('mechanics_kinematics','Kinematics and forces','concept','derivative','Describing motion and what causes it.',
  'Position, velocity and acceleration describe motion; Newton’s laws link acceleration to force.',
  'Mechanical systems (motors, MEMS springs, loudspeaker cones) are modelled with the same equations as circuits.',
  'F=ma; the mass–spring–damper mẍ+bẋ+kx=F is the mechanical twin of series RLC (m↔L, b↔R, k↔1/C).',
  f='F = m a', r='UP1:5.3 UP1:3.4', kn='newton_laws', lab='control:mass_spring_damper')
n('energy_momentum','Energy, power and momentum','concept','mechanics_kinematics integral_ftc','Conserved bookkeeping of motion.',
  'Energy cannot be created or destroyed, only moved; power is energy per time; momentum is conserved in collisions.',
  'Electric power P=VI is the same idea as mechanical power P=Fv, and electromagnetic fields carry energy and momentum too.',
  'Work–energy theorem W=ΔKE; potential energy of conservative forces; ∮ Poynting vector gives field energy flow.',
  f='P = dE/dt', r='UP1:7.1 UP1:7.4 UP1:8.3 UP1:9.1', kn='conservation_energy')
n('rotation_torque','Rotation and torque','concept','energy_momentum','Spinning motion.',
  'Torque twists things the way force pushes them; moment of inertia is rotational mass.',
  'Electric motors and generators convert between electrical power and torque×speed.',
  'τ=Iα; rotational power P=τω; angular momentum L=Iω conserved without external torque; gyroscopic effects underlie MEMS gyros.',
  f='P = τ ω', r='UP1:10.4 UP1:10.6 UP1:11.2', kn='rotational_dynamics')
n('coulombs_law_ee','Charge and Coulomb’s law','law','vectors_3d','Charges push or pull with an inverse-square force.',
  'Like charges repel, unlike attract, and the force falls with the square of distance.',
  'Charge is conserved and quantised in units of e. Electric field is force per unit charge.',
  'F=kq₁q₂/r², k=1/(4πε₀)≈8.99×10⁹ N·m²/C². Superposition holds, which is why fields of many charges add as vectors.',
  f='F = q₁q₂ / (4πε₀ r²)', r='UP2:5.1 UP2:5.3 UP2:5.4', kn='coulomb_law electric_fields', lab='field:point_charges')
n('gauss_law_ee','Gauss’s law','law','coulombs_law_ee divergence_theorem','Electric flux out of a closed surface counts the enclosed charge.',
  'Surround any region with an imaginary surface: the total electric field passing out is proportional to the charge inside.',
  'For symmetric charge shapes it gives fields instantly, and shows why the field inside a conductor is zero.',
  '∯E·dA=Q_enc/ε₀ ⇔ ∇·E=ρ/ε₀ (first Maxwell equation).',
  f='∯ E·dA = Q/ε₀', r='UP2:6.1 UP2:6.2 UP2:6.3', kn='maxwell', lab='field:gauss_surfaces')
n('electric_potential_ee','Electric potential and voltage','concept','gauss_law_ee gradient_directional','Energy per charge: what we call voltage.',
  'Voltage is the energy a unit charge gains moving between two points; a battery maintains a voltage.',
  'Potential is a scalar map of the field; equipotential surfaces are perpendicular to field lines. Ground is a chosen zero.',
  'V=−∫E·dl; point charge V=q/4πε₀r; Poisson ∇²V=−ρ/ε₀. In circuits voltage differences are path independent as long as flux is static.',
  f='V = −∫ E·dl', r='UP2:7.2 UP2:7.3 UP2:7.5', lab='field:equipotentials', kn='electric_fields')
n('capacitance_physics','Capacitance and dielectrics','concept','electric_potential_ee','Storing charge in an electric field.',
  'Two conductors separated by an insulator store charge when a voltage is applied; the ratio is capacitance.',
  'A dielectric between the plates increases capacitance by εr; energy is stored in the field.',
  'C=εA/d for parallel plates; U=½CV²; series 1/C=Σ1/Cᵢ; parallel C=ΣCᵢ. Molecular polarisation explains εr; dielectric breakdown limits voltage.',
  f='C = εA/d;  U = ½CV²', r='UP2:8.1 UP2:8.3 UP2:8.4', lab='circuit:rc_charging')
n('current_resistance_physics','Current, resistivity and conduction','concept','electric_potential_ee','Moving charge through materials.',
  'Current is charge flowing per second; resistivity says how much a material opposes it.',
  'In metals electrons collide with the lattice, giving Ohm’s law; semiconductors have far fewer carriers that can be controlled.',
  'J=σE microscopic Ohm’s law; Drude model σ=nq²τ/m; R=ρL/A; resistivity rises with T in metals, falls in semiconductors.',
  f='J = σE;  R = ρL/A', r='UP2:9.1 UP2:9.3 UP2:9.4 UP2:9.5', kn='circuits_ohm', lab='circuit:ohms_law')
n('magnetic_fields_forces','Magnetic fields and forces','concept','vectors_3d current_resistance_physics','Moving charge feels and creates magnetic fields.',
  'Moving charges and currents create magnetic fields and feel forces in them, which is how motors turn.',
  'Biot–Savart and Ampère’s law give fields of wires and coils; force on a wire is I L × B; Hall effect senses fields.',
  'F=q(E+v×B); ∮B·dl=μ₀I_enc; B of a solenoid μ₀nI; ∇·B=0 (no monopoles).',
  f='F = q v × B', r='UP2:11.2 UP2:11.4 UP2:12.1 UP2:12.5 UP2:11.6', kn='magnetism_force', lab='field:magnetic_loops')
n('faraday_lenz','Faraday’s law and Lenz’s law','law','magnetic_fields_forces stokes_theorem','Changing flux induces voltage.',
  'Changing the magnetic flux through a loop creates an electromotive force; the induced current opposes the change.',
  'This one law explains generators, transformers, inductors and wireless charging.',
  'ε=−dΦ_B/dt ⇔ ∇×E=−∂B/∂t; motional EMF ε=Blv; eddy currents arise in solid conductors.',
  f='ε = −dΦ/dt', r='UP2:13.1 UP2:13.2 UP2:13.3', kn='induction_generators', lab='field:faraday_loop')
n('inductance_physics','Inductance','concept','faraday_lenz','Storing energy in a magnetic field.',
  'A coil resists changes in current because its own changing field induces a counter-voltage.',
  'Self- and mutual inductance quantify this; energy ½LI² is stored in the field.',
  'v=L di/dt; L=N²μA/ℓ for a solenoid; M=k√(L₁L₂) with coupling 0≤k≤1.',
  f='v = L di/dt;  U = ½LI²', r='UP2:14.1 UP2:14.2 UP2:14.3', lab='circuit:rl_transient')
n('waves_interference','Wave behaviour and interference','concept','ode_second_order','Superposition, standing waves, resonance.',
  'Waves add: peaks meeting peaks reinforce, peaks meeting troughs cancel. Confined waves form standing patterns.',
  'Transmission lines, antennas, optical cavities and acoustic resonators all rely on the same ideas.',
  'y=A sin(kx−ωt), v=fλ; standing waves with nodes at fixed ends: fₙ=nv/2L; phase velocity vs group velocity.',
  f='v = fλ', r='UP1:16.1 UP1:16.5 UP1:16.6 UP3:3.1', kn='waves oscillations', lab='field:wave_interference')
n('optics_basics','Optics and light','concept','waves_interference','Light as a ray and as a wave.',
  'Light reflects, refracts and diffracts. Lenses and mirrors focus it.',
  'Snell’s law n₁sinθ₁=n₂sinθ₂ governs fibre guiding; diffraction limits resolution of photolithography.',
  'Rayleigh limit θ=1.22λ/D; thin-film interference; Fresnel equations for reflectance; light is EM waves from ~400 to 700 nm.',
  f='n₁ sinθ₁ = n₂ sinθ₂', r='UP3:1.1 UP3:3.4 UP3:4.5', kn='optics_geometric wave_optics')
n('photoelectric_effect','Photoelectric effect and photons','law','optics_basics','Light delivers energy in packets.',
  'Light knocks electrons out of metal only if its frequency is high enough, no matter how bright; this shows light comes in photons.',
  'Photon energy E=hf; the same physics runs solar cells and photodiodes.',
  'K_max=hf−φ; h=6.626×10⁻³⁴ J·s; absorption of a photon with E>E_g creates an electron–hole pair.',
  f='E = h f', r='UP3:6.2 CPH:29.2', kn='photon_node quantum_discovery')
n('quantum_intro','Quantum mechanics: the basis of semiconductors','concept','photoelectric_effect integration_techniques','Matter behaves as waves with discrete energies.',
  'Electrons confined in atoms or crystals have only certain allowed energies. This explains why materials differ as conductors, insulators and semiconductors.',
  'Wave functions, the uncertainty principle and tunnelling are the intro to band theory and to why tiny transistors leak.',
  'Time-independent Schrödinger equation −ħ²/2m ψ″+Vψ=Eψ; particle in a box Eₙ=n²π²ħ²/2mL²; Pauli exclusion fills states two electrons at a time.',
  f='−(ħ²/2m)ψ″ + Vψ = Eψ', r='UP3:7.1 UP3:7.3 UP3:7.4 UP3:7.6 UP3:8.4', kn='schrodinger uncertainty tunneling', lab='device:bands_formation')
n('atomic_structure_ee','Atomic structure and the periodic table','concept','quantum_intro','Electrons arranged in shells.',
  'Atoms have a nucleus and electron shells. Elements in the same column share valence electron counts and so behave alike.',
  'Silicon (group 14) has four valence electrons, forming a tetrahedral crystal; boron (3) and phosphorus (5) neighbours are the classic dopants.',
  'Electron configuration, ionisation energy and electronegativity trends explain which elements make good conductors, dopants and dielectrics. Si: [Ne]3s²3p².',
  r='CHE:6.4 CHE:6.5 CHE:2.5', kn='periodic_table quantum_orbitals', made='silicon')
n('bonding_materials','Chemical bonding and material properties','concept','atomic_structure_ee','Why materials conduct, insulate or flex.',
  'Metallic bonds leave electrons free to move (conductors); covalent and ionic bonds lock them in place (insulators, semiconductors).',
  'Silicon’s covalent diamond-cubic lattice gives a small band gap; SiO₂ is a strong insulator, which is why MOS gates and chip isolation work.',
  'Bond strength and bond angles set band gaps and mechanical behaviour; lattice types (diamond, zincblende) matter for III-V devices; thermal conductivity and expansion drive packaging.',
  r='CHE:7.1 CHE:7.2 CHE:10.5 CHE:10.6', kn='chemical_bonding engineering_materials crystal_lattices', made='silicon')
n('batteries_electrochem','Electrochemistry basics','concept','bonding_materials','Voltage from chemical reactions.',
  'A battery turns chemical energy into electricity via oxidation at one electrode and reduction at the other.',
  'Cell voltage depends on the electrode materials; lithium-ion cells shuttle Li⁺ ions between graphite and an oxide.',
  'Nernst equation E=E°−(RT/nF)ln Q; capacity in Ah, internal resistance and C-rate set practical performance; degradation by SEI growth.',
  f='E = E° − (RT/nF) ln Q', r='CHE:17.2 CHE:17.3 CHE:17.5', kn='electrochemistry batteries_tech')
save('ee_physics')
