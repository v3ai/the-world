from lib import *
HUB = {
 'ee_math':('Mathematics for EE','Calculus, differential equations, linear algebra, probability, complex analysis, discrete math and numerical methods: the language in which circuits, signals and fields are written.'),
 'ee_physics':('Physics and chemistry for EE','Mechanics, electricity and magnetism, waves, quantum ideas and the chemistry of materials that make electronics possible.'),
 'ee_programming':('Programming and computing','Programming languages, algorithms, embedded C, hardware description languages and simulation tools.'),
 'ee_circuits':('Circuit analysis','Circuits I and II: Ohm and Kirchhoff, analysis techniques, transients, AC power, frequency response and filters.'),
 'ee_electronics':('Electronics','Diodes, transistors, amplifiers, op-amps, feedback, oscillators and data converters.'),
 'ee_digital':('Digital logic design','From Boolean algebra to gates, flip-flops, state machines, memories and FPGAs.'),
 'ee_architecture':('Computer architecture and microcontrollers','Instruction sets, pipelines, caches, microcontrollers, buses and embedded systems.'),
 'ee_signals':('Signals and systems','Signals, LTI systems, convolution, Fourier, Laplace and z transforms, sampling.'),
 'ee_dsp':('Digital signal processing','DFT/FFT, digital filters, multirate, quantisation and applications.'),
 'ee_em':('Electromagnetics','Fields, Maxwell, waves, transmission lines, antennas and EMC.'),
 'ee_devices':('Semiconductor devices','Bands, junctions, transistors, optoelectronics and chip fabrication.'),
 'ee_control':('Control systems','Modelling, stability, PID, state space and digital control.'),
 'ee_comm':('Communication systems','Modulation, noise, information theory, coding, multiple access, channels and networks.'),
 'ee_power':('Power systems and energy conversion','Machines, transformers, the grid, power electronics and power semiconductors.'),
 'ee_labs':('Labs and hands-on skills','Instruments, building circuits, PCB design, reports, measurement and safety.'),
 'ee_electives':('Electives and specialisations','RF, VLSI, photonics, wireless, robotics, ML, imaging, biomedical, energy, EVs, MEMS, quantum hardware, IoT and security.'),
}
n_root = None
area('electrical_engineering')
n('electrical_engineering','Electrical engineering','field','',
  'The discipline of making electricity and information do useful work.',
  'Electrical engineers design everything from power grids to phone chips by understanding voltage, current, fields and signals.',
  'The curriculum climbs from maths and physics through circuits, electronics, digital logic, signals, fields and control to specialised applications.',
  'Unifying ideas: linearity and superposition, frequency-domain thinking, feedback, energy conservation and abstraction layers from devices to systems.',
  par=[], kn='electronics_logic circuits_ohm', r='UP2:10.1')
for hid,(t,s) in HUB.items():
    area(hid)
    n(hid,t,'field','',s,s,'This hub groups the concept nodes for the area; follow the prerequisite arrows (needs) from the left of the track to the right.',
      'Prerequisite structure is a directed acyclic graph; each node links to textbooks (refs) and interactive labs where available.',
      par='electrical_engineering')
save('ee_hubs')
