from lib import *
import math

def build(S):
    S['boolean_algebra_digital'] = spec('logic', 'Absorption: A + AB = A. The B input is irrelevant (try it): the output always equals A, so the extra AND gate can be deleted. Boolean algebra shrinks circuits this way.',
        inputs=['A', 'B'], expr='A | (A & B)', output='Y')

    S['quine_mccluskey'] = spec('kmap', 'f = Σm(4, 8, 10, 11, 12, 15) + d(9, 14). Quine–McCluskey finds all the prime implicants (the coloured groups) and picks a minimal cover: F = AB′ + AC + BC′D′. Don’t-cares (×) may join a group if that helps.',
        vars=['A', 'B', 'C', 'D'], minterms=[4, 8, 10, 11, 12, 15], dontcare=[9, 14], groups=[[8, 9, 10, 11], [10, 11, 14, 15], [4, 12]])

    S['muxes_decoders'] = spec('logic', 'A 2-to-4 decoder with enable: output Y2 is high only when E = 1 and the address AB = 10. Each of the four outputs decodes one address; a multiplexer is the same idea in reverse.',
        inputs=['E', 'A', 'B'], expr='E & A & !B', output='Y2')

    S['adders_arithmetic'] = plot(
        [F('x*tc', 'ripple-carry adder', 'pink'), F('tc*(2*ceil(log(x)/log(4))+2)', 'carry-lookahead adder', 'accent')],
        'A ripple-carry adder passes the carry through every bit, so delay grows linearly with width. Carry-lookahead computes carries in parallel groups, so delay grows only with log₄(n). (Each full-adder stage: S = A⊕B⊕C_in, C_out = AB + C_in(A⊕B).)',
        x=[1, 64], xlabel='adder width (bits)', ylabel='ns',
        points=[{'x': 'nb', 'y': 'nb*tc', 'label': '{nb*tc} ns', 'color': 'pink'}, {'x': 'nb', 'y': 'tc*(2*ceil(log(nb)/log(4))+2)', 'label': '{tc*(2*ceil(log(nb)/log(4))+2)} ns'}],
        params=[P('nb', 'width n', 2, 64, 32, 'bits', step=1), P('tc', 'gate stage delay', 0.1, 0.6, 0.3, 'ns')],
        readouts=[R('ripple delay', 'nb*tc', 'ns'), R('lookahead delay', 'tc*(2*ceil(log(nb)/log(4))+2)', 'ns'), R('max clock (ripple)', '1000/(nb*tc)', 'MHz')])

    S['alu_design'] = blocks([
        ('a', 'A = {A}', 10, 20, 'accent'), ('b', 'B = {B}', 10, 62, 'accent'), ('op', 'op: {op<0.5 ? 0 : 1}  (0 = ADD, 1 = SUB)', 50, 94, 'gold'),
        ('alu', 'ALU', 50, 40, 'gold', 'diamond'), ('r', 'result = {op<0.5 ? mod(A+B,16) : mod(A-B+16,16)}', 90, 40, 'green'), ('f', 'Z={(op<0.5 ? mod(A+B,16) : mod(A-B+16,16))==0 ? 1 : 0}  C={op<0.5 ? ((A+B)>=16 ? 1 : 0) : (A>=B ? 1 : 0)}', 88, 78, 'pink')],
        [('a', 'alu'), ('b', 'alu'), ('op', 'alu', None, True), ('alu', 'r'), ('alu', 'f', 'flags')],
        'An ALU takes two operands and an operation select and produces a result plus status flags (zero, carry). Here is a 4-bit add/subtract unit: set A, B and op and watch the result wrap around modulo 16.',
        params=[P('A', 'operand A', 0, 15, 9, step=1), P('B', 'operand B', 0, 15, 12, step=1), P('op', 'operation (0 = add, 1 = subtract)', 0, 1, 0, step=1)],
        readouts=[R('result', 'op<0.5 ? mod(A+B,16) : mod(A-B+16,16)'), R('carry / no-borrow', 'op<0.5 ? ((A+B)>=16 ? 1 : 0) : (A>=B ? 1 : 0)')], aspect=0.75)

    S['latches'] = spec('fsm', 'An SR latch remembers one bit: S sets Q to 1, R resets it to 0, and holding (repeating the same input) keeps the old value. Watch it store its state between inputs.',
        states=[{'id': 'Q=0', 'x': 22, 'y': 62}, {'id': 'Q=1', 'accept': True, 'x': 78, 'y': 62}], start='Q=0',
        transitions=[['Q=0', 'Q=1', 'S'], ['Q=1', 'Q=0', 'R'], ['Q=0', 'Q=0', 'R'], ['Q=1', 'Q=1', 'S']], input='SSRRSR')

    D = lambda u: f'mod(floor(({u})*dr+0.3),2)'
    S['flip_flops'] = plot(
        [F('4+(mod(x,1)<0.5 ? 1 : 0)', 'CLK', 'dim'), F(f'2+{D("x")}', 'D', 'accent'), F(f'0+{D("floor(x)")}', 'Q (updates on rising edge)', 'gold', width=2.8)],
        'A D flip-flop samples D only at the clock’s rising edge and holds it until the next edge. D can wiggle freely between edges, yet Q stays steady. That is how a clocked system remembers.',
        x=[0, 8], y=[-0.5, 5.8], xlabel='time (clock periods)',
        vlines=[{'x': 'floor(mod(t*0.8,8))+0.001', 'label': 'edge', 'color': 'pink'}],
        params=[P('dr', 'how fast D changes', 0.3, 1.7, 0.9)])

    S['registers_counters'] = plot(
        [F(f'{2*(2-k)}+mod(floor(x/{2**k}),2)', f'Q{k}  (÷{2**(k+1)})', c) for k, c in zip([0, 1, 2], ['#6ee7ff', '#ffd166', '#ff8fb1'])],
        'A counter is a chain of flip-flops, each toggling at half the rate of the one before: Q0, Q1, Q2 count 0…7 in binary and each stage divides the clock by 2. Slow the clock to see each output frequency.',
        x=[0, 8], y=[-0.5, 5.5], xlabel='clock pulses',
        points=[{'x': 'mod(t*2,8)', 'y': 4.9, 'label': 'count = {floor(mod(t*2,8))}'}],
        params=[P('fk', 'clock frequency', 1, 100, 32, 'kHz')],
        readouts=[R('Q0 frequency', 'fk/2', 'kHz'), R('Q1 frequency', 'fk/4', 'kHz'), R('Q2 frequency', 'fk/8', 'kHz'), R('count now', 'floor(mod(t*2,8))')])

    tot = '(0.8+tl)'  # t_cq 0.4 + t_setup 0.2 + t_skew 0.2 + logic
    S['timing_analysis'] = geo([
        rect(0, 0.4, 0.4, 0.8, 'accent', 'accent', alpha=0.8), text(0.2, 0.8, 'cq', 'white', 9),
        rect(0.4, 0.4, 'tl', 0.8, 'gold', 'gold', alpha=0.8), text('0.4+tl/2', 0.8, 'logic', 'white', 9),
        rect('0.4+tl', 0.4, 0.2, 0.8, 'pink', 'pink', alpha=0.8),
        rect('0.6+tl', 0.4, 0.2, 0.8, 'purple', 'purple', alpha=0.8),
        line('Tc', -0.3, 'Tc', 1.9, 'green', 3, when=f'Tc>={tot}'), line('Tc', -0.3, 'Tc', 1.9, 'red', 3, when=f'Tc<{tot}'),
        text('Tc', 2.3, 'next clock edge', 'white', 10),
        line(0, -0.3, 0, 1.9, 'white', 2), text(1.0, 2.3, 'launch edge', 'white', 10),
        text(4, -0.7, 'slack = {Tc-' + tot + '} ns  (setup met)', 'green', 11, when=f'Tc>={tot}'),
        text(4, -0.7, 'slack = {Tc-' + tot + '} ns  (TIMING VIOLATION)', 'red', 11, when=f'Tc<{tot}'),
        text(7.3, 0.8, 'setup 0.2\nskew 0.2', 'dim', 9, when=0)],
        [-0.5, 9, -1.2, 2.8], 'Between two flip-flops the data must travel clock-to-Q (0.4 ns) + logic + setup (0.2) + skew (0.2) before the next edge: T_clk ≥ t_cq + t_logic + t_setup + t_skew. Slow the logic or speed the clock until the line turns red.',
        params=[P('tl', 'logic delay', 0.2, 6, 2, 'ns'), P('Tc', 'clock period', 1, 9, 4, 'ns')],
        readouts=[R('min period', tot, 'ns'), R('max clock frequency', f'1000/{tot}', 'MHz'), R('slack', f'Tc-{tot}', 'ns')], aspect=0.45)
    S['timing_analysis']['shapes'] = [g for g in S['timing_analysis']['shapes'] if g.get('when') != 0]

    S['memory_rom_ram'] = blocks([
        ('ad', 'address: {nn} bits', 24, 8, 'accent'), ('dec', 'row decoder', 78, 8), ('arr', 'array: {2^nn} × {ww} bits', 50, 38, 'gold'), ('sa', 'sense amps', 24, 68, 'pink'), ('dt', 'data: {ww} bits', 78, 68, 'green'),
        ('cap', 'capacity {2^nn*ww/8192} KiB', 50, 94, 'green')],
        [('ad', 'dec'), ('dec', 'arr', 'one row on'), ('arr', 'sa'), ('sa', 'dt'), ('arr', 'cap', None, True)],
        'A memory is a grid of bit cells with a decoder that turns an n-bit address into one row, and amplifiers that read the row out. Each extra address bit doubles the capacity. (SRAM cell: 6 transistors; DRAM: 1 transistor + capacitor; ROM: fixed.)',
        params=[P('nn', 'address bits n', 2, 20, 8, step=1), P('ww', 'word width', 8, 64, 8, 'bits', step=8)],
        readouts=[R('words 2ⁿ', '2^nn'), R('capacity', '2^nn*ww/8', 'bytes')], aspect=0.8)
    S['flash_memory'] = plot(
        [F('max(0,x-1)^2*0.5', 'erased cell (V_T = 1 V)', 'accent'), F('max(0,x-1-dVt)^2*0.5', 'programmed cell (V_T raised)', 'pink')],
        'Trapped charge on the floating gate shifts the transistor’s threshold. At the read voltage an erased cell conducts (reads 1) and a programmed cell does not (reads 0). More trapped charge means a bigger shift, which MLC/TLC flash uses to store several bits.',
        x=[0, 6], y=[0, 14], xlabel='control-gate voltage (V)', ylabel='µA',
        vlines=[{'x': 'Vread', 'label': 'V_read', 'color': 'gold'}],
        params=[P('dVt', 'threshold shift ΔV_T', 0, 4, 3, 'V'), P('Vread', 'read voltage', 1.5, 5, 3, 'V')],
        readouts=[R('erased cell current', 'max(0,Vread-1)^2*0.5', 'µA'), R('programmed cell current', 'max(0,Vread-1-dVt)^2*0.5', 'µA'), R('read OK? (1 = yes)', 'Vread>1+0.3 && Vread<1+dVt ? 1 : 0')])

    S['programmable_logic'] = spec('bits', 'An FPGA’s basic cell is a look-up table: a small memory whose address is the input signals. Here are 8 bits for a 3-input LUT: bit k is the output when the inputs spell k in binary. Only bit 7 set = a 3-input AND; click bits to program any function.',
        bits=8, value=128, mode='unsigned')
    S['hdl_design_flow'] = blocks([
        ('rtl', 'RTL code (Verilog)', 16, 8, 'accent'), ('sim', 'simulate', 80, 8), ('syn', 'synthesise to gates', 16, 38, 'gold'), ('pr', 'place & route', 80, 38), ('ta', 'timing analysis', 16, 68), ('bit', 'bitstream / layout', 80, 68, 'green'), ('hw', 'test on hardware', 48, 94, 'pink')],
        [('rtl', 'sim', 'testbench'), ('sim', 'rtl', 'fix bugs', True), ('rtl', 'syn'), ('syn', 'pr'), ('pr', 'ta'), ('ta', 'rtl', 'fails timing', True), ('ta', 'bit'), ('bit', 'hw')],
        'HDL design is a loop: write RTL, simulate it, synthesise it into gates, place and route, check timing, then program the chip. A failed simulation or timing check sends you back to the code.', aspect=0.9)
