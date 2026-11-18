from lib import *
import math

def build(S):
    S['intro_programming'] = blocks([
        ('s', 'start', 50, 4, 'green'), ('i', 'i = 0; sum = 0', 50, 22), ('c', 'i < n ?', 50, 46, 'gold', 'diamond'),
        ('b', 'sum += a[i]', 18, 70), ('n', 'i = i + 1', 18, 92), ('o', 'print(sum)', 82, 70, 'accent'), ('e', 'end', 82, 92, 'green')],
        [('s', 'i'), ('i', 'c'), ('c', 'b', 'yes'), ('b', 'n'), ('n', 'c', 'repeat'), ('c', 'o', 'no'), ('o', 'e')],
        'Every program is variables, decisions and loops. Follow the token: it loops while i < n, adding each array element, then leaves the loop and prints the total.', aspect=0.85)

    S['c_language'] = blocks([
        ('src', 'main.c', 20, 6, 'accent'), ('pp', 'preprocessor', 80, 6), ('cc', 'compiler', 20, 31),
        ('as', 'assembler', 80, 31), ('ld', 'linker', 20, 56, 'gold'), ('lib', 'libraries .a', 80, 56, 'pink'),
        ('ex', 'firmware.elf', 20, 81, 'green'), ('fl', 'flash to chip', 80, 81, 'green')],
        [('src', 'pp'), ('pp', 'cc'), ('cc', 'as'), ('as', 'ld'), ('lib', 'ld'), ('ld', 'ex'), ('ex', 'fl')],
        'C source goes through a fixed pipeline: preprocess (#include, #define), compile to assembly, assemble to object code, then link with libraries into one executable you load onto the chip.', aspect=0.95)

    S['data_structures'] = spec('graph', 'A binary search tree keeps smaller keys left and larger keys right, so a search for 6 only touches 3 of the 7 nodes (8 → 3 → 6): O(log n) instead of O(n).',
        layout='tree', directed=True,
        nodes=[{'id': k, 'label': k} for k in ['8', '3', '10', '1', '6', '14', '4']],
        edges=[['8', '3'], ['8', '10'], ['3', '1'], ['3', '6'], ['10', '14'], ['6', '4']],
        steps=[['8'], ['3'], ['6']], aspect=0.7)

    S['algorithms_complexity'] = plot(
        [F('x', 'O(n)', 'green'), F('x*log2(x)', 'O(n log n)', 'accent'), F('x^2', 'O(n²)', 'gold'), F('2^x', 'O(2ⁿ)', 'pink')],
        'Work grows with problem size n. Merge sort, T(n) = 2T(n/2) + O(n), lands at n log n; a naive n² method is fine at n = 10 but hopeless at n = 10⁶.',
        x=[2, 40], y=[1, 1e9], logy=True, xlabel='input size n', ylabel='operations',
        vlines=[{'x': 'nn', 'label': 'n = {nn}'}],
        params=[P('nn', 'input size n', 2, 40, 20, step=1)],
        readouts=[R('n log₂ n', 'nn*log2(nn)'), R('n²', 'nn^2'), R('2ⁿ', '2^nn')])

    S['matlab_python_sim'] = spec('signal', 'A typical simulation script: build a signal, add noise, take the FFT. The spectrum below is exactly what numpy.fft.fft would show: peaks at 5 Hz and your chosen second tone.',
        x=[0, 1], y=[-2.5, 2.5], f='sin(2*pi*5*x)+a2*sin(2*pi*f2*x)+nz*(rand(floor(x*400))-0.5)*2',
        spectrum=True, fmax=60,
        params=[P('f2', 'second tone', 10, 50, 25, 'Hz'), P('a2', 'its amplitude', 0, 1.5, 0.6), P('nz', 'noise', 0, 1.5, 0.3)],
        readouts=[R('Nyquist limit (400 Hz sampling)', '200', 'Hz')])

    S['embedded_c'] = spec('bits', 'A hardware register is just a row of bits. Click a bit to flip it: setting bit n is REG |= (1<<n); clearing it is REG &= ~(1<<n). Each bit might be one pin or one feature.',
        bits=8, value=36, mode='unsigned')

    S['hdl_verilog_vhdl'] = spec('logic', 'assign y = s ? b : a; is a 2-to-1 multiplexer: s picks which input reaches y. An HDL line like this describes real gates, not steps executed in order.',
        inputs=['S', 'A', 'B'], expr='(S & B) | (!S & A)', output='Y')

    S['simulation_tools'] = blocks([
        ('n', 'netlist', 28, 8, 'accent'), ('m', 'device models', 80, 8, 'pink'), ('p', 'build matrix', 54, 32),
        ('s', 'solve G·v = i', 28, 60, 'gold'), ('t', 'next time step', 80, 60), ('w', 'waveforms', 28, 90, 'green')],
        [('n', 'p'), ('m', 'p'), ('p', 's'), ('s', 't', 'update'), ('t', 's', 'repeat', True), ('s', 'w')],
        'SPICE turns a circuit into equations: it builds a conductance matrix from the netlist and device models, solves it at each time step (iterating for non-linear parts such as diodes) and plots the node voltages.', aspect=0.85)
    f = '4/pi*(sin(pi*x)*sinh(pi*y)/sinh(pi)+if(nt>=2,sin(3*pi*x)*sinh(3*pi*y)/(3*sinh(3*pi)),0)+if(nt>=3,sin(5*pi*x)*sinh(5*pi*y)/(5*sinh(5*pi)),0)+if(nt>=4,sin(7*pi*x)*sinh(7*pi*y)/(7*sinh(7*pi)),0))*V'
    S['field_solvers'] = spec('heatmap', 'A field solver finds the potential V that satisfies ∇²V = 0 inside the box with the top edge held at V volts and the other three grounded. Add series terms (or mesh cells) for a closer answer.',
        f=f, x=[0, 1], y=[0, 1], z=[0, 10], equal=True,
        params=[P('V', 'top-edge voltage', 1, 10, 10, 'V'), P('nt', 'series terms', 1, 4, 1, step=1)],
        readouts=[R('exact centre value V/4 (by symmetry)', 'V/4', 'V')])
