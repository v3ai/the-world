from lib import *
import math

def build(S):
    S['isa_risc_cisc'] = geo([
        line(0.2, 0, 3.8, 0, 'dim', 1),
        rect(0.6, 0, 1.2, 'cc', 'pink', 'pink', alpha=0.75), text(1.2, -0.7, 'CISC', 'pink'),
        rect(2.2, 0, 1.2, 'icr*1.2', 'accent', 'accent', alpha=0.75), text(2.8, -0.7, 'RISC', 'accent'),
        text(2, 8.3, 'execution time ∝ instructions × CPI', 'white')],
        [0, 4, -1.4, 9], 'The “iron law” time = instructions × cycles per instruction × clock period. CISC uses fewer, richer instructions with higher CPI; RISC uses more, simpler ones with CPI near 1. Neither wins by definition: it depends on the numbers.',
        params=[P('icr', 'RISC instruction count ÷ CISC', 1, 3, 1.6), P('cc', 'CISC cycles per instruction', 1.5, 6, 3.5)],
        readouts=[R('CISC time (relative)', 'cc'), R('RISC time (relative, CPI 1.2)', 'icr*1.2'), R('RISC speed-up', 'cc/(icr*1.2)', '×')], equal=False, aspect=0.6)

    S['assembly_language'] = blocks([
        ('c', 'x = a + b;', 50, 5, 'accent'), ('l1', 'LDR r1, [a]', 50, 24), ('l2', 'LDR r2, [b]', 50, 42), ('ad', 'ADDS r0, r1, r2', 50, 60, 'gold'), ('st', 'STR r0, [x]', 50, 78),
        ('mc', 'ADDS word = 0x1888', 50, 95, 'green')],
        [('c', 'l1', 'compiler'), ('l1', 'l2'), ('l2', 'ad'), ('ad', 'st'), ('ad', 'mc', 'assembler', True)],
        'Assembly is one human-readable line per machine instruction: a C statement becomes load, add and store instructions, and the assembler turns each line into a binary word (here a 16-bit Thumb ADDS: opcode 0001100, Rm = 2, Rn = 1, Rd = 0).', aspect=1.0)
    S['datapath_control'] = blocks([
        ('pc', 'PC', 14, 8, 'accent'), ('im', 'instr. memory', 50, 8), ('rf', 'registers', 86, 8), ('alu', 'ALU', 86, 38, 'gold'), ('dm', 'data memory', 50, 38), ('wb', 'write back', 14, 38, 'green'),
        ('cu', 'control unit', 50, 70, 'pink'), ('p4', 'PC + 4', 14, 70, 'dim')],
        [('pc', 'im'), ('im', 'rf'), ('rf', 'alu'), ('alu', 'dm'), ('dm', 'wb'), ('wb', 'rf', None, True), ('pc', 'p4', None, True), ('p4', 'pc', None, True), ('im', 'cu', 'opcode', True), ('cu', 'alu', None, True)],
        'The datapath moves and transforms data (PC, instruction fetch, registers, ALU, memory, write-back); the control unit reads the opcode and tells each part what to do this cycle. Follow a token through one instruction.', aspect=0.7)
    cols = lambda i, s_: f'{i}+{s_}+(hz>0.5 && {i}>=2 ? 1 : 0)'
    shapes = []
    names = ['IF', 'ID', 'EX', 'MEM', 'WB']; clr = ['accent', 'gold', 'pink', 'purple', 'green']
    for i in range(6):
        for s_ in range(5):
            x = f'({cols(i, s_)})*0.75'
            shapes.append(rect(x, f'{5-i}*0.9', 0.7, 0.8, clr[s_], clr[s_], alpha=0.55))
            shapes.append(text(f'({cols(i, s_)})*0.75+0.35', f'{5-i}*0.9+0.4', names[s_], 'white', 9))
        shapes.append(text(-0.3, f'{5-i}*0.9+0.4', f'i{i+1}', 'dim', 9, align='right'))
    shapes.append(text(5.5, 5.7, 'load-use stall inserted before i3', 'orange', 10, when='hz>0.5'))
    S['pipelining_hazards'] = geo(shapes, [-0.8, 8.4, -0.3, 5.9],
        'Pipelining overlaps instructions like an assembly line: after the 4-cycle fill, one instruction finishes per cycle. A data hazard (i3 needs a load result) forces a one-cycle bubble; the later instructions all slip one column.',
        params=[P('hz', 'data hazard (0 = none, 1 = load-use stall)', 0, 1, 0, step=1)],
        readouts=[R('cycles for 6 instructions', '6+4+hz'), R('without pipelining', '30'), R('speed-up', '30/(10+hz)', '×')], aspect=0.68)

    S['cache_memory'] = plot(
        [F('thit+x/100*tmiss', 'average access time AMAT', 'accent'), F('tmiss', 'no cache (always DRAM)', 'pink', dash=True)],
        'AMAT = t_hit + miss rate × t_miss. Because a miss costs ~100× a hit, even a few percent of misses dominate the average. Better hit rates matter more than a slightly faster cache.',
        x=[0, 20], y=[0, 110], xlabel='miss rate (%)', ylabel='ns',
        points=[{'x': 'mr', 'y': 'thit+mr/100*tmiss', 'label': '{thit+mr/100*tmiss} ns'}],
        params=[P('thit', 'hit time', 1, 5, 1, 'ns'), P('tmiss', 'miss penalty', 50, 100, 80, 'ns'), P('mr', 'miss rate', 0, 20, 4, '%')],
        readouts=[R('AMAT', 'thit+mr/100*tmiss', 'ns'), R('speed-up vs no cache', 'tmiss/(thit+mr/100*tmiss)', '×')])

    S['memory_hierarchy'] = spec('bars', 'Each level is bigger, slower and cheaper than the one above it. From a register to a hard disk the access time spans about 7 orders of magnitude: caches exist because programs reuse nearby data.',
        bars=[{'label': 'register', 'value': 0.3, 'color': 'accent'}, {'label': 'L1', 'value': 1, 'color': 'accent'}, {'label': 'L2', 'value': 4, 'color': 'gold'}, {'label': 'L3', 'value': 15, 'color': 'gold'},
              {'label': 'DRAM', 'value': 80, 'color': 'pink'}, {'label': 'SSD', 'value': 100000, 'color': 'purple'}, {'label': 'HDD', 'value': 5000000, 'color': 'purple'}],
        logy=True, ylabel='typical access time (ns, log)')

    S['virtual_memory'] = blocks([
        ('va', 'virtual address {VA}', 50, 6, 'accent'), ('vpn', 'page # {floor(VA/4096)}', 24, 30), ('off', 'offset {mod(VA,4096)}', 78, 30, 'gold'),
        ('pt', 'page table → frame {mod(5*floor(VA/4096)+3,16)}', 28, 58, 'pink'), ('pa', 'physical address {mod(5*floor(VA/4096)+3,16)*4096+mod(VA,4096)}', 50, 92, 'green')],
        [('va', 'vpn'), ('va', 'off', None, True), ('vpn', 'pt', 'look up'), ('pt', 'pa'), ('off', 'pa', 'unchanged', True)],
        'Every address a program uses is virtual. The top bits (page number) are translated through a page table (here: frame = (5·page + 3) mod 16) to a physical frame; the low bits (offset within the 4 KiB page) pass straight through. Slide the address across a page boundary.',
        params=[P('VA', 'virtual address', 0, 65535, 20000, step=1)],
        readouts=[R('page number', 'floor(VA/4096)'), R('offset', 'mod(VA,4096)'), R('physical address', 'mod(5*floor(VA/4096)+3,16)*4096+mod(VA,4096)')], aspect=0.8)
    S['mcu_architecture'] = blocks([
        ('cpu', 'CPU core', 50, 10, 'gold'), ('fl', 'Flash (program)', 12, 40, 'accent'), ('ram', 'SRAM (data)', 12, 70, 'accent'), ('bus', 'system bus', 50, 40, 'white'),
        ('gp', 'GPIO', 88, 28, 'pink'), ('ua', 'UART/SPI/I²C', 88, 48, 'pink'), ('ad', 'ADC/DAC', 88, 68, 'pink'), ('tm', 'timers/PWM', 88, 88, 'pink'), ('clk', 'clock + reset', 50, 82, 'dim')],
        [('cpu', 'bus'), ('fl', 'bus'), ('ram', 'bus'), ('bus', 'gp'), ('bus', 'ua'), ('bus', 'ad'), ('bus', 'tm'), ('clk', 'cpu', None, True)],
        'A microcontroller is a whole computer on one chip: a CPU core, flash for the program, SRAM for data, and peripherals (GPIO, serial ports, converters, timers) all sharing a bus. ARM Cortex-M, AVR and PIC differ in detail, not in this layout.', aspect=0.8)

    S['gpio'] = geo([
        rect(-4.4, -1.2, 2.2, 2.4, 'dim', None), text(-3.3, 0.8, 'MCU', 'white'), text(-3.3, -0.2, 'pin', 'dim', 9),
        line(-2.2, 0, -1.6, 0, 'white', 1.6), resH(-1.6, 0.4, 0, 'gold'),
        line(0.4, 0, 0.9, 0, 'white', 1.6),
        poly([[0.9, 0.5], [0.9, -0.5], [1.9, 0]], color='red', fill='red', alpha=0.35), line(1.9, 0.5, 1.9, -0.5, 'red', 2), line(1.9, 0, 2.5, 0, 'white', 1.6),
        arrow(1.1, 0.9, 1.6, 1.5, 'orange', 1.8, when='Id>0.5'), arrow(1.5, 0.8, 2.0, 1.4, 'orange', 1.8, when='Id>3'),
        line(2.5, 0, 2.5, -1.4, 'white', 1.6), line(2.1, -1.4, 2.9, -1.4, 'dim', 2), line(2.3, -1.6, 2.7, -1.6, 'dim', 2),
        text(-0.6, 0.7, 'R = {R} Ω', 'gold', 10), text(1.4, -0.9, 'LED', 'red', 10), text(-3.3, -1.8, 'drives {Vdd} V', 'accent', 10),
        text(0.0, -2.2, 'I = ({Vdd} − 2.0 V)/R = {(Vdd-2)/R*1000} mA', 'accent')],
        [-4.8, 3.4, -2.6, 1.9], 'A GPIO pin is a switchable output (and readable input). To light an LED you need a series resistor to set the current, I = (V_DD − V_F)/R; most pins can only supply about 20 mA. (LED forward drop assumed 2 V.)',
        params=[P('Vdd', 'pin voltage', 3.3, 5, 3.3, 'V'), P('R', 'series resistor', 47, 1000, 220, 'Ω')],
        readouts=[R('LED current', '(Vdd-2)/R*1000', 'mA'), R('within 20 mA pin limit? (1 = yes)', '(Vdd-2)/R*1000<=20 ? 1 : 0'), R('resistor power', '((Vdd-2)/R)^2*R*1000', 'mW')], aspect=0.5)
    S['gpio']['shapes'][0] = rect(-4.4, -1.2, 2.2, 2.4, 'dim')

    S['interrupts'] = blocks([
        ('m', 'main loop runs', 22, 8, 'accent'), ('ev', 'event!', 78, 8, 'pink'), ('sv', 'save context', 78, 33), ('isr', 'run ISR (short!)', 78, 58, 'gold'), ('rs', 'restore context', 78, 83), ('m2', 'main loop resumes', 22, 83, 'accent')],
        [('m', 'ev', 'IRQ', True), ('ev', 'sv'), ('sv', 'isr'), ('isr', 'rs'), ('rs', 'm2')],
        'An interrupt lets hardware demand attention instead of the program polling. The CPU saves where it was, runs a short service routine (ISR), then resumes. The cost is CPU time: load = rate × ISR time.',
        params=[P('rate', 'interrupt rate', 0.1, 100, 10, 'kHz'), P('dur', 'ISR duration', 1, 100, 5, 'µs')],
        readouts=[R('CPU load from the ISR', 'rate*dur/10', '%'), R('time between interrupts', '1000/rate', 'µs')], aspect=0.8)
    S['timers_pwm'] = plot(
        [F('if(mod(x*fk,1)<D,5,0)', 'PWM output (5 V logic)', 'accent', width=2.6)],
        'A timer counts clock ticks and flips the pin when it matches a compare value; the fraction of the period spent high is the duty cycle D. A filter or a motor sees the average V_avg = D·V_cc: a fake analog voltage from a digital pin.',
        x=[0, 2], y=[-0.5, 6], xlabel='time (ms)',
        hlines=[{'y': 'D*5', 'label': 'average', 'color': 'gold'}],
        params=[P('D', 'duty cycle D', 0, 1, 0.3), P('fk', 'PWM frequency', 1, 10, 4, 'kHz')],
        readouts=[R('V_avg = D·V_cc', 'D*5', 'V'), R('period', '1/fk', 'ms')])

    S['mcu_adc_dac'] = blocks([
        ('s', 'sensor {Vin} V', 24, 10, 'accent'), ('ad', 'ADC, {nb} bits', 76, 10, 'gold'), ('cpu', 'code = {min(floor(Vin/3.3*2^nb),2^nb-1)}', 76, 46, 'green'),
        ('d', 'DAC out {min(floor(Vin/3.3*2^nb),2^nb-1)/2^nb*3.3} V', 24, 46, 'pink')],
        [('s', 'ad', 'analog'), ('ad', 'cpu', 'integer'), ('cpu', 'd', 'write back')],
        'An MCU’s ADC turns a voltage into an integer: code = floor(V_in/V_ref × 2ᴺ) with V_ref = 3.3 V, and its DAC does the reverse. More bits give finer steps, but the extra codes only help if noise stays below one LSB.',
        params=[P('Vin', 'input voltage', 0, 3.3, 1.2, 'V'), P('nb', 'resolution', 8, 16, 12, 'bits', step=1)],
        readouts=[R('ADC code', 'min(floor(Vin/3.3*2^nb),2^nb-1)'), R('LSB size', '3300/2^nb', 'mV')], aspect=0.55)
    S['uart_serial'] = plot(
        [F('if(x<1,1,if(x<2,0,if(x<10,mod(floor(by/pow(2,floor(x-2))),2),1)))', 'TX line', 'accent', width=2.6)],
        'UART has no clock wire. The line idles high; a falling start bit begins a frame, then 8 data bits (least-significant first) and a stop bit, each lasting 1/baud. Change the byte and watch the pattern change.',
        x=[0, 11], y=[-0.3, 1.5], xlabel='bit times',
        vlines=[{'x': 1, 'label': 'start'}, {'x': 10, 'label': 'stop'}],
        params=[P('by', 'byte sent (65 = “A”)', 0, 255, 65, step=1), P('bd', 'baud rate', 1.2, 115.2, 9.6, 'kbaud')],
        readouts=[R('bit time', '1000/bd', 'µs'), R('frame time (10 bits)', '10/bd', 'ms'), R('bytes per second', 'bd*100')])

    S['spi_bus'] = plot(
        [F('4+(x>=0.5 && x<8.5 ? 0 : 1)', 'CS (active low)', 'dim'), F('2+(x>=0.5 && x<8.5 ? (mod(x-0.5,1)>=0.5 ? 1 : 0) : 0)', 'SCLK', 'gold'),
         F('0+(x>=0.5 && x<8.5 ? mod(floor(by/pow(2,7-floor(x-0.5))),2) : 0)', 'MOSI (data)', 'accent', width=2.6)],
        'SPI sends a byte with a shared clock: pull CS low, then the master puts one bit on MOSI before each rising SCLK edge (most-significant bit first) and the slave samples it. Four wires, no addresses, very fast.',
        x=[0, 9], y=[-0.5, 5.6], xlabel='bit times',
        params=[P('by', 'byte sent', 0, 255, 165, step=1)],
        readouts=[R('bits per second at 8 MHz clock', '8000', 'kbit/s'), R('byte in binary → value', 'by')])

    S['i2c_bus'] = plot(
        [F('3.3*(1-exp(-x/(Rp*Cb)))', 'line voltage (released high)', 'accent', width=2.6)],
        'I²C lines are open-drain: devices only pull them low, and a pull-up resistor lets them rise. The rise time is set by R·C of the wire, so more devices or longer wires (bigger C) cap the speed; a smaller pull-up helps but wastes current.',
        x=[0, 1500], y=[0, 3.6], xlabel='time after release (ns)',
        hlines=[{'y': 0.99, 'label': '30%'}, {'y': 2.31, 'label': '70%'}],
        params=[P('Rp', 'pull-up R', 1, 10, 4.7, 'kΩ'), P('Cb', 'bus capacitance', 10, 400, 100, 'pF')],
        readouts=[R('rise time 30–70%', '0.8473*Rp*Cb', 'ns'), R('fits fast mode (<300 ns)? 1 = yes', '0.8473*Rp*Cb<300 ? 1 : 0'), R('low-level current', '3.3/Rp', 'mA')])

    can_dom = 'x<1 ? 1 : (x<12 ? 1-mod(floor(id/pow(2,11-floor(x))),2) : 0)'
    S['can_bus'] = plot(
        [F(f'2.5+({can_dom})+nz*sin(2*pi*x*0.8)', 'CAN_H', 'accent'), F(f'2.5-({can_dom})+nz*sin(2*pi*x*0.8)', 'CAN_L', 'pink'), F(f'1.7*(2*({can_dom}))/2*1+0*nz', 'difference V_H − V_L', 'gold', dash=True, width=2.6)],
        'CAN sends each bit as the difference between two wires: dominant (0) is about 2 V apart, recessive (1) is 0 V. Noise hits both wires equally, so it cancels in the difference. The lowest arbitration ID wins the bus.',
        x=[0, 13], y=[-0.5, 5], xlabel='bit times (SOF, then 11 ID bits)',
        params=[P('id', 'message ID', 0, 2047, 291, step=1), P('nz', 'common-mode noise', 0, 1.5, 0.6, 'V')],
        readouts=[R('dominant differential', '2', 'V'), R('differential noise left', '0', 'V')])
    S['can_bus']['fns'][2]['f'] = f'2*({can_dom})'

    S['usb_protocol'] = plot(
        [F('min(240,x*I)', 'power = V·I (capped at 240 W)', 'accent'), F('x*3', 'at 3 A', 'dim', dash=True)],
        'USB power grew from 2.5 W (5 V at 0.5 A) to 240 W with PD 3.1 (48 V at 5 A). Higher power works by raising the voltage: the same cable current carries more watts.',
        x=[5, 48], y=[0, 260], xlabel='negotiated voltage (V)',
        points=[{'x': 'V', 'y': 'min(240,V*I)', 'label': '{min(240,V*I)} W'}],
        params=[P('V', 'voltage', 5, 48, 20, 'V'), P('I', 'current', 0.5, 5, 3, 'A')],
        readouts=[R('power', 'min(240,V*I)', 'W'), R('cable loss in 0.2 Ω', 'I^2*0.2', 'W')])

    S['rtos'] = plot(
        [F('floor(x)*(pow(2,1/floor(x))-1)', 'RMS bound n(2^(1/n) − 1)', 'accent', width=2.6)],
        'Rate-monotonic scheduling guarantees all deadlines if total CPU utilisation U ≤ n(2^(1/n) − 1), which falls from 1 toward ln 2 ≈ 0.69 as tasks are added. Below the curve you are safe; above it you must check more carefully.',
        x=[1, 20], y=[0.5, 1.05], xlabel='number of tasks n',
        hlines=[{'y': 0.693, 'label': 'ln 2 = 0.693', 'color': 'gold'}, {'y': 'U', 'label': 'your load U', 'color': 'pink'}],
        points=[{'x': 'nn', 'y': 'nn*(pow(2,1/nn)-1)', 'label': '{nn*(pow(2,1/nn)-1)}'}],
        params=[P('nn', 'tasks n', 1, 20, 5, step=1), P('U', 'utilisation U', 0.5, 1, 0.7)],
        readouts=[R('bound for n tasks', 'nn*(pow(2,1/nn)-1)'), R('guaranteed schedulable? (1 = yes)', 'U<=nn*(pow(2,1/nn)-1) ? 1 : 0')])

    S['low_power_design'] = plot(
        [F('C*x^2*f', 'dynamic power P = C V² f', 'accent')],
        'Dynamic power P = C·V²·f grows with the square of the supply voltage, so dropping V is the most powerful trick: half the voltage means a quarter of the power. Lower the clock for a further linear saving.',
        x=[0.5, 3.6], xlabel='supply voltage (V)', ylabel='mW',
        points=[{'x': 'V', 'y': 'C*V^2*f', 'label': '{C*V^2*f} mW'}],
        params=[P('C', 'switched capacitance', 0.1, 5, 1, 'nF'), P('f', 'clock', 1, 200, 50, 'MHz'), P('V', 'supply voltage', 0.6, 3.3, 1.8, 'V')],
        readouts=[R('dynamic power', 'C*V^2*f', 'mW'), R('at half the voltage', 'C*(V/2)^2*f', 'mW'), R('at half the clock', 'C*V^2*f/2', 'mW')])

    S['device_drivers'] = blocks([
        ('app', 'application', 50, 6, 'accent'), ('sys', 'system call (read/write)', 50, 28), ('drv', 'device driver', 50, 50, 'gold'), ('reg', 'registers + interrupt', 50, 72, 'pink'), ('hw', 'hardware device', 50, 94, 'green')],
        [('app', 'sys'), ('sys', 'drv'), ('drv', 'reg', 'read/write registers'), ('reg', 'hw'), ('hw', 'drv', 'interrupt: done!', True)],
        'A driver hides a device’s messy details behind a clean interface: the application just calls read() or write(); the driver pokes the device registers and handles the interrupt when the hardware is ready.', aspect=0.85)

    S['interfacing_sensors'] = plot(
        [F('Vcc*10*exp(B*(1/(x+273.15)-1/298.15))/(10+10*exp(B*(1/(x+273.15)-1/298.15)))', 'divider output (V)', 'accent')],
        'A thermistor’s resistance falls as it warms (R = R₀ e^(B(1/T − 1/T₀)), 10 kΩ at 25 °C). In a divider with a 10 kΩ resistor that becomes a voltage the ADC can read. The steeper the curve, the better the sensitivity.',
        x=[-20, 100], xlabel='temperature (°C)',
        points=[{'x': 'Tc', 'y': 'Vcc*10*exp(B*(1/(Tc+273.15)-1/298.15))/(10+10*exp(B*(1/(Tc+273.15)-1/298.15)))', 'label': '{Vcc*10*exp(B*(1/(Tc+273.15)-1/298.15))/(10+10*exp(B*(1/(Tc+273.15)-1/298.15)))} V'}],
        params=[P('B', 'thermistor B', 3000, 4500, 3950, 'K', step=50), P('Vcc', 'supply', 3.3, 5, 3.3, 'V'), P('Tc', 'temperature', -20, 100, 40, '°C')],
        readouts=[R('thermistor resistance', '10*exp(B*(1/(Tc+273.15)-1/298.15))', 'kΩ'), R('12-bit ADC code', 'floor(10*exp(B*(1/(Tc+273.15)-1/298.15))/(10+10*exp(B*(1/(Tc+273.15)-1/298.15)))*4096)')])
    S['interfacing_sensors']['y'] = [0, 5.2]

    S['interfacing_motors'] = plot(
        [F(f'max(0,{d}*w0-w0*x/Ts)', f'duty {d}', c) for d, c in zip([0.25, 0.5, 0.75, 1], ['#98a2b8', '#98a2b8', '#98a2b8', '#98a2b8'])] + [F('max(0,D*w0-w0*x/Ts)', 'your duty D', 'gold', width=3)],
        'A PWM duty cycle scales a DC motor’s supply voltage. Speed falls linearly with load torque, and the stall torque and no-load speed both scale with D. Peak mechanical power is a quarter of (no-load speed × stall torque).',
        x=[0, 60], y=[0, 10000], xlabel='load torque (mN·m)', ylabel='rpm',
        params=[P('D', 'duty cycle D', 0.1, 1, 0.6), P('w0', 'no-load speed at 100%', 3000, 10000, 6000, 'rpm', step=100), P('Ts', 'stall torque at 100%', 20, 60, 50, 'mN·m')],
        readouts=[R('no-load speed', 'D*w0', 'rpm'), R('stall torque', 'D*Ts', 'mN·m'), R('peak mech. power', 'D*w0*2*pi/60*D*Ts*1e-3/4', 'W')])

    seg = lambda x1, y1, x2, y2, cond: line(x1, y1, x2, y2, 'red', 7, when=cond, alpha=0.95)
    sh = [
        seg(-1, 2, 1, 2, '!(d==1||d==4)'), seg(1.1, 1.9, 1.1, 0.1, '!(d==5||d==6)'), seg(1.1, -0.1, 1.1, -1.9, 'd!=2'),
        seg(-1, -2, 1, -2, '!(d==1||d==4||d==7)'), seg(-1.1, -0.1, -1.1, -1.9, 'd==0||d==2||d==6||d==8'), seg(-1.1, 1.9, -1.1, 0.1, '!(d==1||d==2||d==3||d==7)'),
        seg(-1, 0, 1, 0, '!(d==0||d==1||d==7)'),
        line(-1, 2, 1, 2, 'dim', 7, alpha=0.25), line(1.1, 1.9, 1.1, 0.1, 'dim', 7, alpha=0.18), line(1.1, -0.1, 1.1, -1.9, 'dim', 7, alpha=0.18),
        line(-1, -2, 1, -2, 'dim', 7, alpha=0.18), line(-1.1, -0.1, -1.1, -1.9, 'dim', 7, alpha=0.18), line(-1.1, 1.9, -1.1, 0.1, 'dim', 7, alpha=0.18), line(-1, 0, 1, 0, 'dim', 7, alpha=0.18),
        text(2.9, 1.6, 'a', 'dim', 9, when=0), ]
    sh = [g for g in sh if g.get('when') != 0]
    S['interfacing_displays'] = geo(sh, [-2.2, 2.2, -2.7, 2.7], 'A 7-segment digit is seven LEDs a–g. Choosing which segments to light shows a number; to drive many digits with few pins the MCU multiplexes them, lighting one digit at a time faster than the eye can see. A 4-digit display at 1 kHz refresh updates each digit 250 times a second.',
        params=[P('d', 'digit to display', 0, 9, 8, step=1)],
        readouts=[R('segments lit', 'd==1 ? 2 : (d==7 ? 3 : (d==4 ? 4 : (d==0||d==6||d==9 ? 6 : (d==8 ? 7 : 5))))'), R('current at 10 mA/segment', '10*(d==1 ? 2 : (d==7 ? 3 : (d==4 ? 4 : (d==0||d==6||d==9 ? 6 : (d==8 ? 7 : 5)))))', 'mA')], aspect=0.9)
