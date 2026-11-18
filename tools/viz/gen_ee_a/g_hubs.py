from lib import *

def hub(title, left, right, caption, cross=(), color='gold', lc='accent', rc='pink'):
    nodes = [('t', title, 50, 5, color)]
    ys = [26, 47, 68, 89]
    for i, l in enumerate(left):
        nodes.append((f'l{i}', l, 22, ys[i], lc))
    for i, r in enumerate(right):
        nodes.append((f'r{i}', r, 78, ys[i], rc))
    edges = [('t', 'l0'), ('t', 'r0')]
    edges += [(f'l{i}', f'l{i+1}') for i in range(len(left) - 1)]
    edges += [(f'r{i}', f'r{i+1}') for i in range(len(right) - 1)]
    for a, b, lab in cross:
        edges.append((a, b, lab, True))
    return blocks(nodes, edges, caption, aspect=0.95)

def build(S):
    S['electrical_engineering'] = blocks([
        ('m', 'Math', 14, 16, 'accent'), ('p', 'Physics', 14, 50, 'accent'), ('c', 'Programming', 14, 84, 'accent'),
        ('ci', 'Circuits', 50, 16, 'gold'), ('el', 'Electronics', 50, 38, 'gold'), ('di', 'Digital logic', 50, 60, 'gold'), ('ar', 'Architecture', 50, 82, 'gold'),
        ('sg', 'Signals & DSP', 86, 10, 'pink'), ('ct', 'Control', 86, 28, 'pink'), ('cm', 'Comms', 86, 46, 'pink'), ('pw', 'Power', 86, 64, 'pink'), ('em', 'EM & devices', 86, 82, 'pink'), ('lb', 'Labs', 86, 98, 'green')],
        [('m', 'ci'), ('p', 'ci'), ('ci', 'el'), ('el', 'di'), ('di', 'ar'), ('c', 'di'), ('ci', 'sg'), ('sg', 'ct'), ('sg', 'cm'), ('el', 'pw'), ('p', 'em', None, True), ('ar', 'lb', None, True)],
        'The curriculum is a map: mathematics, physics and programming (blue) feed the core of circuits → electronics → digital → architecture (gold), which branch into the specialisations (pink): signals, control, communication, power, fields and devices. Labs tie it all to the bench.', aspect=1.0)

    S['ee_math'] = hub('Mathematics for EE', ['Calculus', 'Multivariable', 'Vector fields', 'Diff. equations'], ['Linear algebra', 'Complex numbers', 'Probability', 'Numerical methods'],
        'The maths of EE: calculus and vector calculus (fields, Maxwell), differential equations and Laplace (circuit transients), linear algebra (networks, states), complex numbers (phasors, poles), probability (noise) and numerical methods (simulation).',
        cross=[('l3', 'r1', 'Laplace, poles'), ('l2', 'r0', None)])
    S['ee_physics'] = hub('Physics and chemistry', ['Mechanics', 'Energy & power', 'Electrostatics', 'Magnetism'], ['Waves & optics', 'Quantum ideas', 'Atoms & bonding', 'Batteries'],
        'Physics gives EE its meaning: charge and fields (Coulomb, Gauss, Faraday), waves and light, and the quantum and chemistry ideas behind semiconductors and batteries.', cross=[('l3', 'r0', None), ('r1', 'r2', None)])
    S['ee_programming'] = hub('Programming and computing', ['Intro (C, C++)', 'Data structures', 'Algorithms', 'Embedded C'], ['MATLAB / Python', 'Verilog / VHDL', 'SPICE / Simulink', 'Field solvers'],
        'Engineers write code for three jobs: firmware that runs on chips (C, embedded C), descriptions of hardware (HDLs), and simulation and analysis tools (Python, SPICE, field solvers).', cross=[('l3', 'r1', None)])
    S['ee_circuits'] = hub('Circuit analysis', ['V, I, R, power', 'KCL and KVL', 'Analysis methods', 'Thévenin / Norton'], ['Transients (RC, RLC)', 'AC and phasors', 'Power (P, Q, S)', 'Filters and Bode'],
        'Circuits I and II in one map: the basic laws, systematic solution methods and equivalents (left), then time-domain transients, AC steady state, power and frequency response (right).', cross=[('l3', 'r0', None), ('r1', 'r3', 'impedance')])
    S['ee_electronics'] = hub('Electronics', ['Diodes', 'BJT', 'MOSFET', 'CMOS logic'], ['Amplifiers', 'Op-amps', 'Feedback', 'ADC / DAC'],
        'Devices first (diodes, BJTs, MOSFETs, CMOS), then what you build from them: amplifiers, op-amp circuits, feedback systems and the converters that bridge analogue and digital.', cross=[('l2', 'r0', None), ('l3', 'r3', None)])
    S['ee_digital'] = hub('Digital logic design', ['Number systems', 'Boolean algebra', 'Gates, K-maps', 'Adders, ALU'], ['Latches, flip-flops', 'Counters, FSMs', 'Timing analysis', 'Memory, FPGA'],
        'Combinational logic (left) computes from the current inputs; sequential logic (right) adds memory and a clock. Together they build every processor and memory.', cross=[('l3', 'r0', 'add memory')])
    S['ee_architecture'] = hub('Computer architecture', ['Instruction sets', 'Datapath', 'Pipelining', 'Cache, virtual mem.'], ['Microcontrollers', 'GPIO, timers, ADC', 'UART, SPI, I²C', 'RTOS, drivers'],
        'Architecture connects logic to software: how a CPU executes instructions fast (left), and how a microcontroller talks to the world through peripherals, buses and an operating system (right).', cross=[('l2', 'r0', None), ('l3', 'r3', None)])
    S['ee_signals'] = hub('Signals and systems', ['Signals', 'LTI systems', 'Convolution', 'Fourier series'], ['Fourier transform', 'Laplace / z', 'Sampling', 'Modulation'],
        'A signal is information in time; a system transforms it. Convolution describes any LTI system in time, and the Fourier, Laplace and z transforms describe it in frequency.', cross=[('l2', 'r0', None), ('r2', 'r3', None)])
    S['ee_dsp'] = hub('Digital signal processing', ['DFT / FFT', 'FIR filters', 'IIR filters', 'Windowing'], ['Multirate', 'Quantization', 'Fixed vs float', 'Applications'],
        'DSP does signal processing with numbers: transforms and digital filters (left), and the practical issues of sample rates, finite precision and real applications (right).', cross=[('l1', 'r1', None)])
    S['ee_em'] = hub('Electromagnetics', ['Vector analysis', 'Static fields', 'Maxwell equations', 'Plane waves'], ['Transmission lines', 'Smith chart', 'Antennas', 'EMI / EMC'],
        'Fields first (statics, Maxwell, waves), then their engineering uses: guiding signals along lines and structures, matching them, radiating with antennas and keeping unwanted interference out.', cross=[('l3', 'r0', None)])
    S['ee_devices'] = hub('Semiconductor devices', ['Crystal structure', 'Carriers and Fermi level', 'PN junction', 'BJT and MOSFET'], ['Short-channel effects', 'Optoelectronics', 'Fabrication', 'FinFET'],
        'From atoms in a crystal, to carriers, junctions and transistors (left), to modern devices, light-emitting and detecting parts, and how chips are manufactured (right).', cross=[('l3', 'r0', None), ('l2', 'r1', None)])
    S['ee_control'] = hub('Control systems', ['Modelling', 'Block diagrams', 'Time response', 'Stability (Routh)'], ['Root locus', 'Bode and Nyquist', 'PID control', 'State space'],
        'Control uses feedback to make a system do what you want: model it, measure how it responds and whether it is stable, then design a compensator (root locus, frequency response, PID, state feedback).', cross=[('l3', 'r0', None)])
    S['ee_comm'] = hub('Communication systems', ['Analog modulation', 'Digital modulation', 'Noise, SNR, BER', 'Information theory'], ['Error-correcting codes', 'Multiplexing', 'Wireless channels', 'Networks (OSI)'],
        'A link: encode, modulate onto a carrier, cross a noisy channel, demodulate and decode. The theory (left) says what is possible; the systems (right) are how it is done.', cross=[('l2', 'r0', None)])
    S['ee_power'] = hub('Power systems and energy', ['Magnetic circuits', 'Transformers', 'Machines', 'Generation'], ['Transmission, grid', 'Protection', 'Power converters', 'Motor drives'],
        'Energy from generator to wall: machines and transformers (left), then the grid, its protection and the power electronics that convert and control energy (right).', cross=[('l2', 'r3', None), ('l1', 'r0', None)])
    S['ee_labs'] = hub('Labs and hands-on skills', ['Oscilloscope', 'Multimeter', 'Function generator', 'Bench supply'], ['Logic analyzer', 'Breadboard, solder', 'PCB design', 'Safety, error'],
        'Measure (instruments), build (breadboard, solder, PCB) and report (error analysis, safety): the practical skills that turn theory into working hardware.', cross=[('l3', 'r1', None)])
    S['ee_electives'] = hub('Electives', ['RF and microwave', 'VLSI / IC design', 'Photonics', 'Wireless 5G/6G'], ['Robotics', 'ML hardware', 'Biomedical', 'Energy and EVs'],
        'Specialisations that build on the core: radio and chips, light and wireless on the left; robots, AI accelerators, medical devices and energy systems on the right.', cross=[('l1', 'r1', None)])
