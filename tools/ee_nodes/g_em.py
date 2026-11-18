from lib import *
area('ee_em')
n('vector_analysis_em','Vector analysis for fields','concept','divergence_curl stokes_theorem divergence_theorem','The language of field theory.',
  'Fields are vectors defined everywhere; gradient, divergence and curl describe how they change.',
  'Choose Cartesian, cylindrical or spherical coordinates to match geometry.',
  'Helmholtz theorem: a field is fixed by its divergence and curl plus boundary conditions; Dirac delta for point sources.',
  lab='field:vector_field_probe')
n('electrostatics_dielectrics','Electrostatics and dielectrics','concept','gauss_law_ee electric_potential_ee','Static electric fields in matter.',
  'Insulators polarise in a field, reducing it by the relative permittivity εr.',
  'Boundary conditions: tangential E continuous, normal D jumps by surface charge. Method of images and Poisson/Laplace equations solve problems.',
  'D=ε₀E+P=εE; bound charge ρ_b=−∇·P; energy density ½E·D; uniqueness theorem.',
  f='D = εE;  ∇²V = −ρ/ε', lab='field:equipotentials', r='UP2:8.4 UP2:7.4')
n('magnetostatics_materials','Magnetostatics and magnetic materials','concept','magnetic_fields_forces','Steady magnetic fields and iron.',
  'Steady currents make magnetic fields; ferromagnetic cores concentrate them.',
  'B=μH with μ=μ₀μr; ferromagnets show hysteresis and saturation; magnetic circuits use reluctance.',
  'Boundary: normal B continuous, tangential H jumps by surface current. Hysteresis loop area is energy lost per cycle; soft vs hard magnetic materials.',
  f='B = μH;  ℜ = ℓ/(μA)', r='UP2:12.7', lab='field:magnetic_loops', kn='magnetic_materials')
n('maxwell_equations','Maxwell’s equations','law','electrostatics_dielectrics magnetostatics_materials faraday_lenz','Four equations that govern all electromagnetism.',
  'Gauss’s law for E and B, Faraday’s law and Ampère–Maxwell law describe how charges and currents make fields and how changing fields make each other.',
  'The displacement current term lets the equations predict waves travelling at c=1/√(μ₀ε₀).',
  '∇·D=ρ, ∇·B=0, ∇×E=−∂B/∂t, ∇×H=J+∂D/∂t. Boundary conditions and constitutive relations close the system; covariant form F^{μν}.',
  f='∇×E = −∂B/∂t;  ∇×H = J + ∂D/∂t', r='UP2:16.1 CPH:24.1', lab='field:maxwell_waves', kn='maxwell')
n('plane_waves','Plane waves and polarisation','concept','maxwell_equations waves_interference','Light and radio in free space.',
  'In free space, E and B oscillate perpendicular to each other and to the direction of travel at c.',
  'Polarisation describes the E-field’s orientation: linear, circular or elliptical.',
  'E=E₀e^{j(ωt−kz)}; η₀=√(μ₀/ε₀)≈377 Ω; Poynting S=E×H; in lossy media, skin depth δ=√(2/ωμσ).',
  f='η₀ = √(μ₀/ε₀) ≈ 377 Ω', r='UP2:16.2 UP2:16.3', lab='field:maxwell_waves', kn='electromagnetic_waves')
n('reflection_refraction','Reflection and refraction','concept','plane_waves','Waves at interfaces.',
  'When a wave hits a boundary, some reflects and some transmits, with a bend determined by the media’s impedances.',
  'Reflection coefficient Γ=(η₂−η₁)/(η₂+η₁); Brewster angle gives no reflection for one polarisation; total internal reflection traps light in fibre.',
  'Fresnel equations for TE/TM; phase shifts on reflection; thin-film anti-reflection coatings with quarter-wave layers.',
  f='Γ = (η₂−η₁)/(η₂+η₁)', lab='field:wave_boundary', r='UP3:1.1')
n('transmission_lines','Transmission lines','concept','plane_waves reflection_refraction','When wires are long compared to wavelength.',
  'When a signal’s wavelength is comparable to wire length, wires act as waveguides with a characteristic impedance.',
  'Mismatched terminations cause reflections; PCB traces, coax and antennas feeds are transmission lines.',
  'Telegrapher’s equations; Z₀=√((R+jωL)/(G+jωC)) ≈√(L/C); velocity 1/√(LC); Γ_L=(Z_L−Z₀)/(Z_L+Z₀).',
  f='Z₀ = √(L/C);  Γ = (Z_L−Z₀)/(Z_L+Z₀)', lab='field:tline_reflections', x=wp('Transmission_line'))
n('standing_waves_vswr','Standing waves and VSWR','concept','transmission_lines','Incident and reflected waves interfere.',
  'Reflections create standing-wave patterns whose ratio of max to min voltage is VSWR; 1:1 means perfect match.',
  'VSWR=(1+|Γ|)/(1−|Γ|); high values waste power and can damage transmitters.',
  'Return loss RL=−20log|Γ|; mismatch loss −10log(1−|Γ|²); input impedance of a line Z_in=Z₀(Z_L+jZ₀tanβl)/(Z₀+jZ_L tanβl).',
  f='VSWR = (1+|Γ|)/(1−|Γ|)', lab='field:tline_reflections')
n('smith_chart','Smith chart','tool','standing_waves_vswr complex_numbers','A map of impedances and reflections.',
  'The Smith chart is a circular graph that maps complex impedance onto reflection coefficient, making matching problems visual.',
  'Moving along a line rotates around the centre; adding series and shunt elements moves along circles.',
  'Conformal map Γ=(z−1)/(z+1); admittance chart is a 180° rotation; used for stub and L-network matching and amplifier design.',
  f='Γ = (z−1)/(z+1)', lab='field:smith_chart')
n('impedance_matching','Impedance matching','technique','smith_chart max_power_transfer','Make loads look like the line.',
  'Matching networks (L-networks, stubs, quarter-wave transformers) make a load look like the source impedance so power is transferred without reflection.',
  'Quarter-wave transformer Z_T=√(Z₀Z_L); single-stub tuning; bandwidth shrinks with higher mismatch.',
  'Bode–Fano limit bounds broadband matching; lumped LC L-section Q=√(R_h/R_l−1).',
  f='Z_T = √(Z₀ Z_L)', lab='field:smith_chart')
n('waveguides','Waveguides','component','plane_waves','Hollow metal pipes for microwaves.',
  'At microwave frequencies, a hollow metal tube guides waves with less loss than coax.',
  'Modes TE/TM have cutoff frequencies; below cutoff nothing propagates.',
  'Rectangular TE₁₀ cutoff f_c=c/2a; dispersion v_g=c√(1−(f_c/f)²); optical fibre is a dielectric waveguide.',
  f='f_c = c/(2a)', lab='field:waveguide_modes')
n('skin_effect','Skin effect','concept','plane_waves','AC current hugs the surface.',
  'At high frequency, current flows only near the surface of a conductor, raising resistance.',
  'Skin depth δ=√(2/ωμσ): ~66 µm for copper at 1 MHz; Litz wire and plating mitigate.',
  'R_ac≈R_dc·a/(2δ) for round wire; proximity effect adds in coils; rough surfaces add further loss at GHz.',
  f='δ = √(2/(ωμσ))', lab='field:skin_depth')
n('antenna_fundamentals','Antennas: patterns, gain and directivity','concept','plane_waves','Launching and catching waves.',
  'An antenna turns circuit signals into radiated waves and back; its radiation pattern shows where it sends power.',
  'Gain is directivity times efficiency; dipole 2.15 dBi; effective aperture A_e=λ²G/4π; Friis equation for links.',
  'Reciprocity; far-field r>2D²/λ; radiation resistance of a half-wave dipole ≈73 Ω; polarisation mismatch loss.',
  f='A_e = λ² G/(4π)', lab='field:antenna_pattern', x=wp('Antenna_(radio)'))
n('dipole_antennas','Dipoles and monopoles','component','antenna_fundamentals','Simplest resonant antennas.',
  'A half-wave dipole is two quarter-wave rods driven at the centre; a monopole above a ground plane acts like half of one.',
  'Phone antennas are folded and miniaturised variants (PIFA, IFA).',
  'Current distribution sinusoidal; pattern ∝cos(π/2 cosθ)/sinθ; bandwidth depends on thickness; small antennas limited by Chu limit.',
  lab='field:antenna_pattern')
n('antenna_arrays','Antenna arrays','concept','antenna_fundamentals','Many antennas steer a beam.',
  'Combining several antennas with chosen phases forms a narrow, steerable beam.',
  'Array factor AF=Σe^{jnψ}; ψ=kd cosθ+β; phased arrays steer electronically without moving.',
  'Grating lobes appear when spacing exceeds λ/2; beamforming weights from DSP; massive MIMO in 5G.',
  f='AF = Σ aₙ e^{jnψ}', lab='field:array_factor')
n('emi_emc','EMI/EMC: interference, shielding, grounding','concept','plane_waves skin_effect','Keeping devices from disturbing each other.',
  'Electronics emit and receive unwanted electromagnetic noise; EMC design ensures devices coexist.',
  'Shielding, filtering, careful PCB layout (return paths, ground planes) and cable management.',
  'Common-mode vs differential-mode; ferrites; ground loops; ESD (kV transients); FCC/CISPR limits; spread-spectrum clocking.',
  lab='field:emc_loop')
save('ee_em')

area('ee_devices')
n('crystal_structure_ee','Crystal structure of semiconductors','concept','bonding_materials','Atoms in a repeating lattice.',
  'Silicon forms a diamond-cubic crystal where each atom bonds with four neighbours; lattice order is what creates bands.',
  'Miller indices label planes; wafer orientation (100) affects interface quality; GaAs is zincblende.',
  'Lattice constant 5.431 Å for Si; Brillouin zone and Bloch’s theorem; defects (vacancies, dislocations) affect lifetimes.',
  made='silicon', r='CHE:10.6 UP3:9.3', kn='crystal_lattices band_theory', lab='device:bands_formation')
n('carrier_statistics','Carrier statistics and Fermi level','concept','energy_bands_ee','How many carriers at what temperature.',
  'The Fermi–Dirac distribution tells the probability that an energy state is occupied; the Fermi level shows where this drops to ½.',
  'In n-type material E_F moves toward the conduction band; in p-type toward the valence band.',
  'f(E)=1/(1+e^{(E−E_F)/kT}); n=N_c e^{−(E_c−E_F)/kT}; N_c≈2.8×10¹⁹ cm⁻³ for Si; non-degenerate approximation.',
  f='f(E) = 1/(1 + e^{(E−E_F)/kT})', lab='device:fermi_dirac', kn='band_theory statistical_mechanics')
n('pn_junction_physics','PN junction physics: depletion, capacitance, breakdown','concept','pn_junction_ee carrier_statistics','Inside the junction.',
  'The depletion region has no free carriers and acts like a capacitor whose width changes with voltage; at high reverse voltage the junction breaks down.',
  'Depletion width W=√(2ε(V_bi−V)/q·(1/N_a+1/N_d)); junction capacitance basis of varactors.',
  'Breakdown by avalanche (impact ionisation) or Zener tunnelling; Shockley equation from minority-carrier diffusion; generation–recombination currents.',
  f='W = √(2ε(V_bi−V)(1/N_a+1/N_d)/q)', lab='device:pn_reverse', kn='semiconductors_pn')
n('bjt_physics_deep','BJT device physics in depth','concept','pn_junction_physics','Why β is large and what limits it.',
  'Carriers injected from emitter cross a thin base; few recombine, so most reach the collector.',
  'Gain β depends on emitter and base doping; Early effect and high-level injection limit it.',
  'β≈D_nW_E N_E/(D_pW_B N_B)-type expressions; base transit time τ_B=W_B²/2D_n sets f_T; heterojunction BJTs (SiGe) reach >300 GHz.',
  lab='device:bjt_active')
n('mosfet_physics_deep','MOSFET device physics in depth','concept','mosfet_iv pn_junction_physics','Charge control in the channel.',
  'Gate voltage inverts the surface charge to form a channel; the oxide thickness sets gate control.',
  'Charge-sheet and gradual-channel models yield the I–V; subthreshold swing ≥60 mV/dec at 300 K.',
  'S=(kT/q)ln10(1+C_d/C_ox); capacitances C_gs, C_gd; f_T≈g_m/2π(C_gs+C_gd); gate tunnelling and high-k/metal-gate.',
  f='S ≥ (kT/q) ln10 ≈ 60 mV/dec', lab='device:mosfet_transfer')
n('short_channel_effects','Short-channel effects','concept','mosfet_physics_deep','When transistors get tiny.',
  'As channels shorten, the drain starts to control the barrier: threshold falls, leakage rises, and current saturates through velocity limits.',
  'DIBL, velocity saturation, hot carriers, and gate leakage. FinFETs and nanosheets restore gate control.',
  'DIBL (mV/V), V_T roll-off, subthreshold leakage ∝10^{−V_T/S}; scaling rules (Dennard) broke down near 90 nm as voltage stopped scaling.',
  lab='device:short_channel')
n('optoelectronic_devices','Optoelectronic devices','component','pn_junction_physics photoelectric_effect','LEDs, lasers, detectors, solar cells.',
  'Semiconductors can emit light (LED, laser) and detect it (photodiode, solar cell) through band-gap transitions.',
  'Lasers add an optical cavity and population inversion to give coherent light; solar cells are large photodiodes.',
  'Radiative efficiency; internal quantum efficiency; threshold current; Shockley–Queisser limit ≈33% for single-junction at 1.34 eV.',
  lab='device:solar_cell', kn='led_lasers solar_cells', r='UP3:8.6')
n('lasers_semiconductor','Semiconductor lasers','device','optoelectronic_devices','Coherent light from a diode.',
  'A laser diode amplifies light bouncing between mirrored facets through stimulated emission.',
  'Above a threshold current, output becomes coherent; used in fibre links and Lidar.',
  'Rate equations; VCSELs emit upward (used in face ID); DFB lasers give single-wavelength telecom light at 1310/1550 nm.',
  lab='device:led_colors', kn='led_lasers')
n('photodetectors_solar','Photodetectors and solar cells','device','optoelectronic_devices','Light to current.',
  'Photons create electron–hole pairs; a built-in field separates them to produce current.',
  'PIN photodiodes and avalanche photodiodes for speed and sensitivity; solar cells for energy.',
  'Responsivity R=ηqλ/hc (A/W); dark current; open-circuit voltage V_oc and fill factor; tandem cells beat single-junction limit.',
  f='R = ηqλ/(hc)', lab='device:solar_cell', kn='solar_cells')
n('fabrication_lithography','Lithography','process','fabrication_overview','Printing circuits with light.',
  'Light projects a pattern through a mask onto photosensitive resist on the wafer.',
  'Resolution ≈k₁λ/NA; EUV (13.5 nm) reached 3–5 nm-class nodes.',
  'Rayleigh resolution; depth of focus; multi-patterning; EUV needs reflective optics and tin-plasma sources; overlay accuracy <2 nm.',
  f='CD = k₁ λ/NA', lab='device:fab_process')
n('fabrication_overview','Semiconductor fabrication overview','concept','crystal_structure_ee','From sand to chip.',
  'Chips are made by repeating cycles of depositing, patterning and etching thin layers on a polished silicon wafer.',
  'Steps: crystal growth → wafer → oxidation → lithography → etch → doping → deposition → metallisation → test and packaging.',
  'Czochralski growth; cleanroom class ISO 1–5; yield Y=e^{−AD}; hundreds of steps, ~3 months, >1000 individual processes.',
  lab='device:fab_process', kn='engineering_materials')
n('doping_implantation','Doping: ion implantation and diffusion','process','fabrication_overview','Placing dopants.',
  'Ions fired into the wafer, then annealed, provide precise dopant profiles.',
  'Dose and energy set depth and concentration; annealing repairs damage.',
  'Gaussian range profile; channelling; rapid thermal annealing; diffusion D=D₀e^{−E_a/kT}.',
  lab='device:fab_process')
n('oxidation_process','Oxidation','process','fabrication_overview','Growing silicon dioxide.',
  'Heating silicon in oxygen or steam grows a high-quality SiO₂ insulating layer.',
  'Thermal oxide forms gate dielectrics and isolation; Deal–Grove model describes growth.',
  'x²+Ax=B(t+τ); linear then parabolic regimes; modern gates use high-k HfO₂ rather than SiO₂.',
  f='x² + A x = B (t + τ)', lab='device:fab_process')
n('etching_process','Etching','process','fabrication_overview','Removing material selectively.',
  'Wet chemicals or plasmas remove material where resist leaves it exposed.',
  'Anisotropic plasma etching makes vertical walls; selectivity protects layers underneath.',
  'RIE and DRIE (Bosch process); atomic-layer etching; etch rate, selectivity, aspect ratio.',
  lab='device:fab_process')
n('deposition_processes','Deposition','process','fabrication_overview','Adding thin films.',
  'CVD, PVD and atomic layer deposition lay down films of metals, oxides and silicon.',
  'Copper is deposited electrochemically into etched trenches (damascene).',
  'ALD gives monolayer-level control; epitaxy grows crystal layers; stress and step coverage issues.',
  lab='device:fab_process')
save('ee_devices')
