from lib import *
area('ee_control')
CT="Control Tutorials for MATLAB and Simulink|https://ctms.engin.umich.edu/CTMS/"
n('system_modeling','Modelling electrical and mechanical systems','concept','ode_second_order mechanics_kinematics rlc_transient','Equations that describe plants.',
  'To control something, first write equations for it: a motor, a heater, a circuit. Electrical and mechanical systems have direct analogies.',
  'Mass–spring–damper ↔ series RLC; DC motor couples electrical and mechanical equations through k_t and k_e.',
  'Force–voltage analogy; linearisation about operating point; state variables chosen as energy-storage quantities.',
  x=CT, lab='control:mass_spring_damper')
n('block_diagrams_mason','Transfer functions, block diagrams and signal-flow graphs','technique','system_modeling transfer_function_ee','Wiring diagrams for dynamics.',
  'Block diagrams show how signals flow through subsystems; transfer functions in blocks multiply along a path.',
  'Closed-loop T=G/(1+GH); signal-flow graphs and Mason’s gain formula handle complex loops.',
  'Mason: T=ΣPₖΔₖ/Δ, Δ=1−ΣL+ΣLL−…; block reduction rules; algebra equals Cramer’s rule on the graph.',
  f='T = G/(1+GH)', lab='control:block_diagram')
n('time_domain_specs','Time-domain response: rise time, overshoot, settling time, steady-state error','concept','block_diagrams_mason damping_regimes','How a control system’s response is judged.',
  'We judge a controller by how fast, how smoothly and how accurately the output follows a step command.',
  'Second-order metrics: overshoot %OS=e^{−πζ/√(1−ζ²)}, settling t_s≈4/(ζω_n), rise time ≈1.8/ω_n.',
  'Steady-state error from system type: e_ss=1/(1+K_p) for type 0 step; type-1 systems track steps with zero error.',
  f='%OS = 100·exp(−πζ/√(1−ζ²))', lab='control:step_response')
n('routh_hurwitz','Routh–Hurwitz criterion','technique','time_domain_specs','Stability test without finding roots.',
  'A table built from the characteristic polynomial’s coefficients reveals how many roots lie in the unstable right half-plane.',
  'Sign changes in the first column count unstable poles; handy for finding the gain at which a system goes unstable.',
  'Special cases (zero in first column, row of zeros) handled by ε-substitution and auxiliary polynomial; gives critical K for oscillation.',
  lab='control:routh_table')
n('root_locus','Root locus','technique','routh_hurwitz poles_zeros','How poles move as gain changes.',
  'A root locus plots where the closed-loop poles go as the controller gain is turned up.',
  'Rules for sketching: starts at open-loop poles, ends at zeros, asymptotes, breakaway points.',
  'Angle condition ∠L(s)=±180°(2k+1), magnitude gives K; design by adding poles/zeros (compensators) to reshape locus.',
  f='1 + K·G(s)H(s) = 0', lab='control:root_locus')
n('bode_nyquist_margins','Frequency-domain control: Bode, Nyquist, margins','technique','frequency_response_bode feedback_stability_margins contour_integration','Stability from measured frequency response.',
  'Nyquist plots the open-loop response in the complex plane; encirclements of −1 reveal instability. Gain and phase margins show the safety buffer.',
  'Can be measured on real plants without a model; handles time delay.',
  'Nyquist: Z=N+P; sensitivity peak M_s=max|1/(1+L)|; Bode gain–phase relation; delay adds phase −ωτ.',
  f='Z = N + P', lab='control:bode_margins')
n('pid_controller','PID controllers','technique','time_domain_specs','Proportional, integral, derivative control.',
  'PID looks at the error now (P), its accumulated past (I) and its trend (D) to decide the correction; it runs most industrial loops.',
  'P speeds response, I removes steady error, D adds damping; tuning methods: Ziegler–Nichols, loop-shaping.',
  'u=K_p e+K_i∫e+K_d de/dt; anti-windup, derivative filter; digital form with sample time; 2-DOF structures.',
  f='u = Kp e + Ki ∫e dt + Kd de/dt', lab='control:pid_tuner')
n('lead_lag_compensators','Lead and lag compensators','technique','root_locus bode_nyquist_margins','Reshape the loop.',
  'A lead compensator adds phase near crossover for stability and speed; a lag improves low-frequency gain (accuracy).',
  'Lead: C=(1+sαT)/(1+sT), α<1; lag: places a pole–zero pair at low frequency.',
  'Max phase lead φ_m=asin((1−α)/(1+α)) at ω=1/(T√α); lead-lag combined = PID-like.',
  f='φ_max = asin((1−α)/(1+α))', lab='control:bode_margins')
n('state_space','State-space methods','concept','ode_systems eigen','Matrices describe dynamics.',
  'State-space writes a system as first-order equations in a state vector; it handles multi-input multi-output systems naturally.',
  'ẋ=Ax+Bu, y=Cx+Du; eigenvalues of A are the poles; transfer function G=C(sI−A)⁻¹B+D.',
  'Realisations (canonical forms); similarity transformations; balanced truncation for model reduction.',
  f='ẋ = Ax + Bu;  y = Cx + Du', lab='control:state_space')
n('controllability_observability','Controllability and observability','concept','state_space','Can we steer it? Can we see it?',
  'Controllable: inputs can drive the state anywhere. Observable: outputs reveal the state.',
  'Rank tests on the controllability matrix [B AB … Aⁿ⁻¹B] and the observability matrix.',
  'Kalman decomposition; duality; PBH test; uncontrollable modes cannot be moved by feedback.',
  f='rank [B AB … Aⁿ⁻¹B] = n', lab='control:state_space')
n('pole_placement','Pole placement and observers','technique','controllability_observability','Choose where closed-loop poles go.',
  'State feedback u=−Kx can set closed-loop poles anywhere if the system is controllable; observers estimate unmeasured states.',
  'Ackermann’s formula; Luenberger observer; separation principle lets you design them separately.',
  'LQR minimises ∫(xᵀQx+uᵀRu), solved via Riccati equation; LQG = LQR + Kalman filter.',
  f='u = −K x;  eig(A−BK) = desired', lab='control:state_space')
n('digital_control','Digital control systems','concept','z_transform pid_controller','Controllers running on a computer.',
  'Digital controllers sample the plant, compute in software, and output through a DAC with zero-order hold.',
  'Discretise the plant (c2d) or the controller (Tustin); choose sample rate ≥10× bandwidth.',
  'z-plane stability inside unit circle; deadbeat; computational delay and jitter; aliasing; dual-rate loops.',
  lab='control:step_response')
save('ee_control')

area('ee_comm')
n('analog_modulation','Analog modulation: AM, FM, PM','concept','modulation_basics','Encoding signals on a carrier.',
  'AM varies carrier amplitude, FM varies frequency, PM phase. FM resists amplitude noise.',
  'AM bandwidth 2B; FM Carson’s rule B≈2(Δf+f_m); broadcast radio and TV audio use them.',
  'Modulation index β=Δf/f_m; SNR improvement of FM above threshold ∝3β²; envelope and quadrature detectors; SSB and VSB save bandwidth.',
  f='B_FM ≈ 2(Δf + f_m)', lab='signal:am_fm_demo', kn='radio_comm')
n('digital_modulation','Digital modulation: ASK, FSK, PSK, QAM, OFDM','concept','analog_modulation','Bits to waveforms.',
  'Digital modulation switches amplitude, frequency or phase between a few states; QAM mixes amplitude and phase to send many bits per symbol.',
  'Constellation diagrams display the states; OFDM splits the data across many narrow subcarriers to resist multipath.',
  '16-QAM carries 4 bits/symbol; OFDM implemented with IFFT, cyclic prefix; peak-to-average power ratio problem; spectral efficiency vs SNR trade-off.',
  f='bits/symbol = log₂M', lab='signal:constellation')
n('noise_snr_ber','Noise, SNR and bit error rate','concept','noise_modeling digital_modulation','How noise causes errors.',
  'Noise blurs received symbols; the bit error rate depends on signal-to-noise ratio and modulation type.',
  'BPSK BER=Q(√(2E_b/N₀)); higher-order modulations need more SNR.',
  'E_b/N₀ vs SNR relation SNR=(E_b/N₀)(R_b/B); Q-function tail of Gaussian; waterfall curves.',
  f='BER_BPSK = Q(√(2Eb/N₀))', lab='signal:ber_curve')
n('information_entropy_capacity','Information theory: entropy and channel capacity','law','noise_snr_ber random_variables','The ultimate limits of communication.',
  'Entropy measures information in bits; Shannon showed that every noisy channel has a capacity below which errors can be made arbitrarily small.',
  'C=B log₂(1+SNR); more bandwidth or more power raises capacity, with diminishing returns.',
  'H=−Σp log p; channel coding theorem; Shannon limit −1.59 dB on E_b/N₀ as bandwidth → ∞; turbo and LDPC codes approach it.',
  f='C = B log₂(1 + S/N)', lab='signal:shannon_capacity', kn='information_theory')
n('error_correcting_codes','Error-correcting codes','technique','information_entropy_capacity combinatorics_ee','Adding redundancy to fix errors.',
  'Extra check bits let a receiver detect and fix errors; Hamming codes fix single-bit errors; CRCs detect them.',
  'Block codes work on fixed chunks; convolutional codes work on streams, decoded with the Viterbi algorithm.',
  'Minimum distance d_min corrects ⌊(d−1)/2⌋ errors; Reed–Solomon (QR codes, CDs); LDPC and polar codes in 5G; coding gain.',
  f='t = ⌊(d_min−1)/2⌋', lab='signal:hamming_demo')
n('multiplexing_access','Multiplexing: TDM, FDM, CDMA','concept','digital_modulation','Sharing a channel.',
  'FDM gives each user a frequency slot, TDM a time slot, CDMA a code; OFDMA mixes slots in time and frequency.',
  'Cell phones have used all of these across generations.',
  'Orthogonal codes (Walsh); processing gain=chip rate/bit rate; near–far problem; OFDMA in 4G/5G.',
  lab='signal:cdma_demo')
n('wireless_channels_fading','Wireless channels, fading and link budgets','concept','antenna_fundamentals noise_snr_ber','What happens between antennas.',
  'Signals weaken with distance, bounce off buildings (multipath) and fade in and out as you move.',
  'Link budget adds transmit power, antenna gains, losses and noise to find received SNR.',
  'Free-space path loss (4πd/λ)²; Rayleigh/Rician fading; delay spread and coherence bandwidth; Doppler; shadowing; Friis & noise figure.',
  f='FSPL = (4πd/λ)²', lab='signal:link_budget')
n('networking_osi_tcpip','Networking basics: OSI model and TCP/IP','concept','digital_modulation','Layers that let computers talk.',
  'Networks are organised in layers: physical, link, network (IP), transport (TCP/UDP), application. Each layer handles one job.',
  'Packets carry addresses; routers forward them; TCP gives reliable delivery, UDP quick delivery.',
  'Ethernet/Wi-Fi at layer 2; IPv4/v6; congestion control (AIMD, BBR); NAT; TLS; latency-bandwidth product.',
  lab='network:packet_flow', x=wp('OSI_model;Internet_protocol_suite'.split(';')[0])+';'+wp('Internet_protocol_suite'))
save('ee_comm')
