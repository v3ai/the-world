from common import *
D = {}
D["smartphone"] = blocks([N("soc","SoC",50,50,color="gold"),N("bat","battery",12,14),N("pm","PMIC",12,50),N("mem","RAM + flash",12,86),N("sen","sensors",50,10),N("wf","Wi-Fi / BT",50,90),
  N("dp","display + touch",88,14),N("cm","camera",88,50),N("rf","modem + RF",88,86)],
  [E("bat","pm"),E("pm","soc","power"),E("mem","soc"),E("soc","mem"),E("sen","soc"),E("cm","soc","pixels"),E("soc","dp","image"),E("soc","rf"),E("rf","soc"),E("wf","soc")],
  "A phone is a small computer: the SoC at the centre talks to memory, the screen, camera, sensors and radios, while the PMIC turns the battery into every voltage they need.", aspect=0.78)

D["phone_display"] = S("geometry","An OLED pixel is a stack of thin organic layers: electrons and holes injected from the electrodes meet in the emissive layer and release photons. The drive current, set by the TFT beneath, sets the brightness.",
  [P("L","pixel brightness",50,1500,600,"nits")], [R("current density J = L/η (η = 50 cd/A)","L/50","A/m²")],
  range=[-0.5,10.5,-0.3,5.4], aspect=0.62, shapes=[
  {"k":"rect","x":0,"y":0,"w":10,"h":0.7,"fill":"white","alpha":0.18,"color":"white"},{"k":"rect","x":0,"y":0.7,"w":10,"h":0.3,"fill":"gold","alpha":0.5,"color":"gold"},
  {"k":"rect","x":0,"y":1,"w":10,"h":0.5,"fill":"blue","alpha":0.35,"color":"blue"},{"k":"rect","x":0,"y":1.5,"w":10,"h":0.5,"fill":"green","alpha":0.5,"color":"green"},
  {"k":"rect","x":0,"y":2,"w":10,"h":0.5,"fill":"pink","alpha":0.35,"color":"pink"},{"k":"rect","x":0,"y":2.5,"w":10,"h":0.3,"fill":"white","alpha":0.45,"color":"white"},
  {"k":"rect","x":0,"y":2.8,"w":10,"h":0.7,"fill":"accent","alpha":0.15,"color":"accent"},
  {"k":"text","x":5,"y":0.35,"text":"TFT backplane (drive transistor)","size":9},{"k":"text","x":5,"y":0.85,"text":"anode (+)","size":9},{"k":"text","x":5,"y":1.25,"text":"hole transport","size":9},
  {"k":"text","x":5,"y":1.75,"text":"emissive layer: light made here","size":9},{"k":"text","x":5,"y":2.25,"text":"electron transport","size":9},{"k":"text","x":5,"y":2.65,"text":"cathode (−)","size":9,"color":"#0a0e17"},{"k":"text","x":5,"y":3.15,"text":"glass encapsulation","size":9}]
  + [{"k":"arrow","x1":x,"y1":3.6,"x2":x,"y2":"3.7+L/500","color":"gold","width":2} for x in (1.5,3.5,5.5,7.5,9)])

_gx = [{"k":"line","x1":i,"y1":0.3,"x2":i,"y2":9.7,"color":"accent","alpha":0.6,"width":1.5} for i in range(1,6)]
_gy = [{"k":"line","x1":0.3,"y1":j,"x2":5.7,"y2":j,"color":"gold","alpha":0.6,"width":1.5} for j in range(1,10)]
D["phone_touchscreen"] = S("heatmap","Under the glass, drive electrodes (gold) cross sense electrodes (blue); a fingertip steals some of the field at the crossings below it. The map shows the capacitance drop the controller sees; move the finger.",
  [P("fx","finger x",0.5,5.5,3,"",0.1),P("fy","finger y",0.5,9.5,5,"",0.1)], [R("nearest column","round(fx)"), R("nearest row","round(fy)"), R("signal drop at that node","20*exp(-((round(fx)-fx)^2+(round(fy)-fy)^2)/(2*0.64))","%")],
  f="exp(-((x-fx)^2+(y-fy)^2)/(2*0.64))", x=[0,6], y=[0,10], equal=True, aspect=1.1, shapes=_gx+_gy)

D["phone_battery"] = plot([("x<45/Cr ? 3.55+0.65*(x/(45/Cr))^0.8 : 4.2","cell voltage (V)","accent"),("x<45/Cr ? Cr : Cr*exp(-(x-45/Cr)/15)","charge current (× C)","pink")],[0,120],[0,4.5],
  "Lithium-ion cells charge in two phases: constant current until about 4.2 V, then constant voltage while the current tapers away. A higher charge rate shortens the first phase but not the taper.",
  [P("Cr","charge rate",0.5,2,1,"C")], [R("constant-current phase","45/Cr","min"), R("time to full (cut-off 0.05 C)","45/Cr+15*ln(Cr/0.05)","min")],
  vlines=[{"x":"45/Cr","label":"→ CV"}], xlabel="time (min)")

D["phone_pcb"] = S("geometry","A phone board is stacked layers of copper and glass-epoxy. A fast trace over a ground plane is a transmission line whose impedance depends on its width w and height h above ground; boards are designed for 50 Ω.",
  [P("w","trace width",0.05,0.5,0.18,"mm",0.01),P("h","dielectric height",0.05,0.3,0.1,"mm",0.01)],
  [R("impedance Z₀","87/sqrt(4.4+1.41)*ln(5.98*h/(0.8*w+0.035))","Ω")],
  range=[-0.8,0.8,-0.1,0.5], aspect=0.5, shapes=[
  {"k":"rect","x":-0.8,"y":-0.05,"w":1.6,"h":0.05,"fill":"gold","alpha":0.8,"color":"gold"},{"k":"rect","x":-0.8,"y":0,"w":1.6,"h":"h","fill":"accent","alpha":0.15,"color":"accent"},
  {"k":"rect","x":"-w/2","y":"h","w":"w","h":0.035,"fill":"gold","alpha":0.9,"color":"gold"},
  {"k":"text","x":0.45,"y":-0.025,"text":"ground plane","size":9,"color":"gold"},{"k":"text","x":0.45,"y":"h/2","text":"FR-4 (εr ≈ 4.4)","size":9,"color":"accent"},
  {"k":"text","x":0,"y":"h+0.07","text":"trace","size":9,"color":"gold"},{"k":"text","x":-0.45,"y":0.42,"text":"w = {w} mm, h = {h} mm","size":10,"color":"white"}])

_v = "(u*4/(u-4))"
D["phone_camera"] = S("geometry","A lens focuses light from an object to an image at distance v where 1/u + 1/v = 1/f. Move the sensor away from that plane and each point smears into a blur circle; autofocus slides the lens until the blur vanishes.",
  [P("u","object distance u",6,14,9,"mm",0.1),P("s","sensor position",4.5,13,7.2,"mm",0.1)],
  [R("image distance v","u*4/(u-4)","mm"), R("blur diameter (aperture 2 mm)","2*abs(s-u*4/(u-4))/(u*4/(u-4))","mm")],
  range=[-15,13,-3.3,3.3], aspect=0.5, shapes=[
  {"k":"line","x1":-21,"y1":0,"x2":15,"y2":0,"color":"dim","width":1},{"k":"line","x1":0,"y1":-3,"x2":0,"y2":3,"color":"white","width":3},
  {"k":"arrow","x1":"-u","y1":0,"x2":"-u","y2":1.5,"color":"green","width":3},
  {"k":"line","x1":"-u","y1":1.5,"x2":0,"y2":1.5,"color":"gold","width":1.6},{"k":"line","x1":0,"y1":1.5,"x2":"s","y2":"1.5+(-1.5*%s/u-1.5)*s/%s"%(_v,_v),"color":"gold","width":1.6},
  {"k":"line","x1":"-u","y1":1.5,"x2":"s","y2":"-1.5*s/u","color":"pink","width":1.6},
  {"k":"line","x1":"-u","y1":1.5,"x2":0,"y2":"-1.5*4/(u-4)","color":"accent","width":1.6},{"k":"line","x1":0,"y1":"-1.5*4/(u-4)","x2":"s","y2":"-1.5*4/(u-4)","color":"accent","width":1.6},
  {"k":"line","x1":"s","y1":-2.6,"x2":"s","y2":2.6,"color":"green","width":4},{"k":"text","x":"s","y":2.95,"text":"sensor","color":"green","size":9},{"k":"text","x":0,"y":3.1,"text":"lens f = 4","size":9},
  {"k":"point","x":-4,"y":0,"color":"dim","size":3},{"k":"point","x":4,"y":0,"color":"dim","size":3},{"k":"text","x":-12,"y":-2.6,"text":"object","color":"green","size":9}])

D["phone_speaker"] = plot([("20*log10((x/f0)^2/sqrt((1-(x/f0)^2)^2+((x/f0)/Q)^2))","sound output","accent")],[100,20000],[-50,15],
  "A phone speaker is a tiny mass on a spring, so it rolls off at 12 dB per octave below its resonance f₀. That is why phones sound thin at low notes; resonance Q adds a bump near f₀.",
  [P("f0","resonance f₀",200,1500,600,"Hz"),P("Q","quality factor Q",0.5,3,1.2)], [R("output at 100 Hz","20*log10((100/f0)^2/sqrt((1-(100/f0)^2)^2+((100/f0)/Q)^2))","dB")],
  logx=True, xlabel="frequency (Hz)", ylabel="level (dB)")

D["phone_antenna"] = plot([("10*log10((0.1+(Q*(x/(75/L)-(75/L)/x))^2)/(1+(Q*(x/(75/L)-(75/L)/x))^2))","S11 return loss","accent")],[0.5,6],[-25,1],
  "An antenna works well where its reflection S11 dips. A metal strip a quarter-wavelength long resonates at f = c/4L, so a 30 mm frame segment suits 2.5 GHz; a longer one tunes lower.",
  [P("L","antenna length",20,80,30,"mm"),P("Q","quality factor Q",3,20,8)], [R("resonance c/4L","75/L","GHz")],
  hlines=[{"y":-10,"label":"−10 dB: good match"}], xlabel="frequency (GHz)", ylabel="S11 (dB)")

def usbc():
    top=[("GND","dim"),("TX","green"),("TX","green"),("VBUS","red"),("CC","gold"),("D+","accent"),("D−","accent"),("SBU","purple"),("VBUS","red"),("RX","green"),("RX","green"),("GND","dim")]
    bot=[("GND","dim"),("RX","green"),("RX","green"),("VBUS","red"),("SBU","purple"),("D−","accent"),("D+","accent"),("CC","gold"),("VBUS","red"),("TX","green"),("TX","green"),("GND","dim")]
    sh=[{"k":"rect","x":-0.6,"y":-0.5,"w":12.2,"h":2.3,"color":"white","alpha":0.35,"width":1.5}]
    for i,(n,c) in enumerate(top):
        sh.append({"k":"rect","x":i,"y":1.0,"w":0.75,"h":0.55,"fill":c,"alpha":0.8,"color":c})
    for i,(n,c) in enumerate(bot):
        sh.append({"k":"rect","x":i,"y":-0.25,"w":0.75,"h":0.55,"fill":c,"alpha":0.8,"color":c})
    for i,(n,c) in enumerate([("VBUS","red"),("GND","dim"),("CC","gold"),("D±","accent"),("SBU","purple"),("TX/RX","green")]):
        sh.append({"k":"text","x":0.8+i*2.1,"y":2.5,"text":n,"color":c,"size":10})
    sh.append({"k":"text","x":5.9,"y":0.65,"text":"24 pins, reversible: row A and row B mirror each other","size":8,"color":"dim"})
    return sh
_V="(i==0 ? 5 : (i==1 ? 9 : (i==2 ? 15 : 20)))"
D["phone_charger_port"] = S("geometry","The USB-C plug has 24 pins in two mirrored rows so it fits either way up. Four carry power (red), two CC pins negotiate the voltage, and the rest carry data. Pick a power-delivery level below.",
  [P("i","PD level (5 / 9 / 15 / 20 V)",0,3,2,"",1)], [R("negotiated voltage",_V,"V"), R("power at 3 A","%s*3"%_V,"W")],
  range=[-0.8,12.4,-0.7,3.0], aspect=0.45, shapes=usbc())

D["phone_vibration_motor"] = plot([("1/Q/sqrt((1-(x/f0)^2)^2+((x/f0)/Q)^2)","mass motion (relative)","accent")],[50,400],[0,1.4],
  "A linear resonant actuator shakes a mass on a spring with a coil. It moves most when driven at its resonance f₀, so haptic drivers lock onto that frequency; a higher Q rings longer after the pulse.",
  [P("f0","resonance f₀",150,250,175,"Hz"),P("Q","quality factor Q",5,20,10),P("fd","drive frequency",100,300,175,"Hz")],
  [R("motion at the drive frequency","1/Q/sqrt((1-(fd/f0)^2)^2+((fd/f0)/Q)^2)","× peak"), R("ring-down time constant Q/(πf₀)","1000*Q/(pi*f0)","ms")],
  points=[{"x":"fd","y":"1/Q/sqrt((1-(fd/f0)^2)^2+((fd/f0)/Q)^2)"}], xlabel="drive frequency (Hz)")

D["phone_soc"] = blocks([N("ic","interconnect",50,50,color="gold"),N("cpu","CPU",14,16),N("gpu","GPU",50,12),N("npu","NPU",86,16),N("isp","ISP",14,84),N("mc","mem ctrl",50,88),N("mo","modem",86,84)],
  [E("cpu","ic"),E("gpu","ic"),E("npu","ic"),E("isp","ic"),E("ic","mc"),E("mc","ic"),E("mo","ic")],
  "A system-on-chip puts the processor, graphics, AI engine, image processor and modem on one die, linked by an on-chip interconnect to a shared memory controller.", aspect=0.72)

D["phone_ram"] = plot([("exp(-mod(x,T)/tau)","stored 1: cell voltage","accent")],[0,200],[0,1.1],
  "A DRAM bit is charge on a tiny capacitor that leaks away. Every row is refreshed periodically; if the refresh interval is longer than the cell can hold its charge above the sense limit, the bit is lost.",
  [P("T","refresh interval",8,128,64,"ms"),P("tau","leakage time constant",50,500,200,"ms")],
  [R("voltage just before refresh","exp(-T/tau)","× full"), R("data safe? (1 = yes)","exp(-T/tau)>0.5")],
  hlines=[{"y":0.5,"label":"sense limit","color":"red"}], xlabel="time (ms)")

_fl = "+".join("(%d<2^b ? exp(-((x-%d*7/(2^b-1))/s)^2/2) : 0)"%(k,k) for k in range(8))
D["phone_flash"] = plot([(_fl,"cells in each state","accent",False,2.2)],[-1,8],[0,1.2],
  "A flash cell stores bits as trapped charge, read as a threshold voltage. Each extra bit per cell halves the spacing between states; as cells wear, the peaks widen (σ) and overlap, causing read errors.",
  [P("b","bits per cell",1,3,3,"",1),P("s","wear spread σ",0.08,0.4,0.15)],
  [R("states per cell","2^b"), R("spacing ÷ σ","7/(2^b-1)/s")], xlabel="threshold voltage (arb.)", ylabel="cells")

D["phone_pmic"] = plot([("100*x/Vin","linear regulator (LDO)","pink"),("90+0*x","switching buck ≈ 90 %","accent")],[0.5,2],[0,100],
  "A linear regulator burns the difference between input and output as heat, so efficiency is just Vout/Vin. A buck converter switches energy through an inductor and stays near 90 %, which is why the PMIC uses bucks for the big rails.",
  [P("Vin","battery voltage",3,4.4,3.8,"V")], [R("LDO efficiency at 0.8 V","100*0.8/Vin","%"), R("LDO heat at 0.8 V, 1 A","(Vin-0.8)*1","W")],
  xlabel="output voltage (V)", ylabel="efficiency (%)")

D["phone_rf_frontend"] = blocks([N("an","antenna",9,50),N("sw","switch",31,50),N("rf","RX filter",53,18),N("ln","LNA",75,18,color="green"),N("md","modem",91,50,color="gold"),N("pa","PA",75,82,color="pink"),N("tf","TX filter",53,82)],
  [E("an","sw"),E("sw","rf"),E("rf","ln"),E("ln","md","receive"),E("md","pa","transmit"),E("pa","tf"),E("tf","sw")],
  "The front-end keeps the radio's strong transmit signal out of its own sensitive receiver: filters pick the band, a switch shares the antenna, the LNA amplifies weak signals and the PA boosts the outgoing one.", aspect=0.7)

D["phone_modem"] = blocks([N("t1","encode",14,16),N("t2","QAM map",38,16),N("t3","IFFT",62,16),N("t4","DAC + RF",86,16,color="pink"),N("air","radio link",86,50,color="dim"),
  N("r1","RF + ADC",86,84,color="green"),N("r2","FFT",62,84),N("r3","equalise",38,84),N("r4","decode",14,84)],
  [E("t1","t2"),E("t2","t3"),E("t3","t4"),E("t4","air"),E("air","r1"),E("r1","r2"),E("r2","r3"),E("r3","r4")],
  "The modem turns bits into an OFDM radio waveform (top row) and, on the way back, recovers bits from the received waveform by reversing each step (bottom row).", aspect=0.72)

D["phone_wifi_bt"] = plot([("1/(1+((x-(2407+5*ch))/10)^8)","Wi-Fi channel (20 MHz)","accent"),("exp(-((x-(2402+floor(79*rand(floor(2*t)))))/0.6)^2)","Bluetooth hop (1 MHz)","gold")],[2400,2485],[0,1.2],
  "Wi-Fi sits on one 20 MHz channel while Bluetooth hops among 79 1 MHz channels several times a second. Pick Wi-Fi channels 1, 6 or 11 to avoid overlapping neighbours.",
  [P("ch","Wi-Fi channel",1,13,6,"",1)], [R("Wi-Fi centre","2407+5*ch","MHz"), R("Bluetooth channels","79")], xlabel="frequency (MHz)")

_c="cos(rad(th))"; _s="sin(rad(th))"
D["phone_sensors"] = S("geometry","An accelerometer measures gravity along the phone's own axes. Tilt the phone and gravity (red) splits into two components (gold, green); software turns them back into the tilt angle with atan2.",
  [P("th","tilt angle",-90,90,30,"°")], [R("x-axis reading","sin(rad(th))","g"), R("y-axis reading","cos(rad(th))","g"), R("tilt = atan2(x, y)","deg(atan2(sin(rad(th)),cos(rad(th))))","°")],
  range=[-1.4,1.4,-1.3,1.1], aspect=0.78, shapes=[
  {"k":"poly","pts":[["-0.35*%s+0.7*%s"%(_c,_s),"-0.35*%s-0.7*%s"%(_s,_c)],["0.35*%s+0.7*%s"%(_c,_s),"0.35*%s-0.7*%s"%(_s,_c)],["0.35*%s-0.7*%s"%(_c,_s),"0.35*%s+0.7*%s"%(_s,_c)],["-0.35*%s-0.7*%s"%(_c,_s),"-0.35*%s+0.7*%s"%(_s,_c)]],"fill":"accent","alpha":0.25,"color":"accent"},
  {"k":"arrow","x1":0,"y1":0,"x2":0,"y2":-1,"color":"red","width":3},{"k":"text","x":0.15,"y":-1.12,"text":"gravity 1 g","color":"red","size":10},
  {"k":"arrow","x1":0,"y1":0,"x2":"%s*%s"%(_c,_s),"y2":"-(%s)^2"%_c,"color":"gold","width":2},
  {"k":"arrow","x1":0,"y1":0,"x2":"-%s*%s"%(_s,_c),"y2":"-(%s)^2"%_s,"color":"green","width":2}])

D["phone_passives"] = plot([("hypot(0.02, 2*pi*x*1e6*ESL*1e-9-1/(2*pi*x*1e6*C*1e-9))","|Z| of a decoupling capacitor","accent")],[0.01,1000],[0.01,1e5],
  "A real capacitor also has parasitic inductance (ESL). Its impedance falls like 1/ωC, bottoms out at the self-resonant frequency, then rises like an inductor, so a 100 nF part stops decoupling above about 20 MHz.",
  [P("C","capacitance",1,1000,100,"nF"),P("ESL","parasitic inductance",0.3,2,0.6,"nH")], [R("self-resonance","1e3/(2*pi*sqrt(ESL*C))","MHz")],
  logx=True, logy=True, vlines=[{"x":"1e3/(2*pi*sqrt(ESL*C))","label":"SRF"}], xlabel="frequency (MHz)", ylabel="|Z| (Ω)")

_F="(32768+x)"; _Lm="(1/((2*pi*32768)^2*Cm*1e-15))"; _w="(2*pi*%s)"%_F; _a="(%s*%s*(1-(32768/%s)^2))"%(_w,_Lm,_F); _c0="(%s*C0*1e-12)"%_w
D["phone_crystal_osc"] = plot([("-(1/%s)*%s/(%s-1/%s)"%(_c0,_a,_a,_c0),"crystal reactance","accent",False,2.4)],[-20,45],[-4e6,4e6],
  "A quartz crystal behaves like a very high-Q LC circuit: its reactance crosses zero at the series resonance (here 32 768 Hz) and again at the slightly higher parallel resonance. An oscillator locks onto the narrow region between.",
  [P("Cm","motional capacitance",1,4,2,"fF",0.1),P("C0","shunt capacitance",1,3,1.5,"pF",0.1)],
  [R("series resonance","32768","Hz"), R("parallel resonance","32768*(1+Cm*1e-3/(2*C0))","Hz")],
  hlines=[{"y":0,"label":"zero reactance"}], xlabel="frequency − 32 768 Hz", ylabel="reactance (Ω)")

D["soc_cpu_cluster"] = plot([("1*min(2,(x/0.05)^(1/3))","little core","accent"),("ipc*min(3.5,(x/1.5)^(1/3))","big core","pink")],[0,6],[0,12],
  "Power grows roughly as f³ (voltage must rise with frequency). Small cores deliver most performance per watt but top out early; big cores keep scaling but cost much more power. A cluster mixes both.",
  [P("ipc","big-core IPC",2,4,3)], [R("big core at 4 W","ipc*min(3.5,(4/1.5)^(1/3))","perf units"), R("little core ceiling","2","perf units")], xlabel="core power (W)", ylabel="performance (IPC × GHz)")

D["soc_gpu"] = plot([("1/((1-p)+p/x)","speed-up","accent")],[1,4096],[1,1000],
  "A GPU spreads one job over thousands of simple units, but Amdahl's law caps the gain at 1/(1−p), where p is the parallel fraction. Even 1 % serial code limits 4096 cores to about 80×.",
  [P("p","parallel fraction p",0.8,0.9999,0.99,"",0.0001)], [R("speed-up at 1024 units","1/((1-p)+p/1024)"), R("limit 1/(1−p)","1/(1-p)")],
  logx=True, logy=True, xlabel="parallel units", ylabel="speed-up")

D["soc_npu"] = S("bars","Energy per operation (approximate, 45 nm): arithmetic is cheap, moving data is not. An NPU wins by using small integers and keeping data in on-chip memory instead of fetching it from DRAM.",
  [], [R("DRAM read ÷ INT8 multiply-add","640/0.23")],
  bars=[{"label":"INT8","value":0.23,"color":"green"},{"label":"FP16","value":1.5},{"label":"FP32","value":4.6},{"label":"SRAM","value":5,"color":"gold"},{"label":"DRAM","value":640,"color":"pink"}], logy=True, ylabel="picojoules (log scale)")

D["soc_cache"] = plot([("ht+(1-x/100)*mp","average access time","accent")],[80,100],None,
  "Average memory access time = hit time + miss rate × miss penalty. Even a few percent of misses dominate, because a trip to DRAM costs far more than a cache hit.",
  [P("ht","cache hit time",0.5,4,1,"ns"),P("mp","miss penalty (DRAM)",50,150,80,"ns"),P("h","hit rate",80,100,95,"%")],
  [R("average access time","ht+(1-h/100)*mp","ns"), R("speed-up vs no cache","mp/(ht+(1-h/100)*mp)")],
  points=[{"x":"h","y":"ht+(1-h/100)*mp"}], xlabel="cache hit rate (%)", ylabel="ns")

D["soc_memory_controller"] = plot([("rate/125*2.5/(2.5+(1-x)*tm)","achieved bandwidth","accent")],[0,1],None,
  "DRAM rows must be opened before they can be read. Accesses that hit the already-open row stream data at full speed; a miss pays an activate/precharge delay, so the controller reorders requests to maximise row hits.",
  [P("rate","transfer rate",3200,8533,6400,"MT/s"),P("tm","row-miss penalty",20,50,35,"ns")],
  [R("peak bandwidth (64-bit)","rate/125","GB/s"), R("at 50 % row hits","rate/125*2.5/(2.5+0.5*tm)","GB/s")], xlabel="row-buffer hit rate", ylabel="bandwidth (GB/s)")

D["soc_isp"] = chain(["RAW","Defects","Demosaic","White bal.","Denoise","Tone map","Sharpen","JPEG"],
  "The image signal processor turns raw one-colour-per-pixel sensor data into a finished photo through a hardware pipeline of corrections, run on every frame at video rate.", per=3, colors={2:"gold"})

mods=[["CPU","GPU","NPU"],["ISP","L3","DSP"],["MEM","IO","NIC"]]
gn=[{"id":"r%d%d"%(i,j),"label":mods[i][j],"x":18+j*32,"y":18+i*32} for i in range(3) for j in range(3)]
ge=[["r%d%d"%(i,j),"r%d%d"%(i,j+1)] for i in range(3) for j in range(2)]+[["r%d%d"%(i,j),"r%d%d"%(i+1,j)] for i in range(2) for j in range(3)]
D["soc_interconnect"] = {"type":"graph","nodes":gn,"edges":ge,"steps":[["r00"],["r01","r10"],["r02","r11","r20"],["r12","r21"],["r22"]],"aspect":0.8,
  "caption":"Big chips replace one shared bus with a mesh of routers; a message hops from router to router. Watch a packet from the top-left corner reach the bottom-right in four hops."}

D["cpu_core"] = chain(["Fetch","Decode","Issue","Execute","L1 cache","Retire"],
  "A core fetches instructions, decodes them, issues them to execution units, accesses the L1 cache when needed and retires results in order. Branch results feed back to the fetch stage.",
  per=3, extra=[(3,0,"branch result")], colors={3:"gold"})

D["core_fetch"] = blocks([N("pc","PC",10,50),N("ic","I-cache",38,50),N("fb","buffer",66,50),N("dc","decode",91,50),N("p4","PC + 4",24,16),N("bp","predictor",44,86,color="gold")],
  [E("pc","ic"),E("ic","fb"),E("fb","dc"),E("pc","p4"),E("p4","pc"),E("bp","pc","predicted target")],
  "Fetch sends the program counter to the instruction cache and queues the returned instructions for decode. Normally the PC just advances; the branch predictor redirects it ahead of time.", aspect=0.62)

D["core_decode"] = blocks([N("w","ADD x3,x1,x2",13,50,color="gold"),N("op","opcode",43,14),N("r1","rs1 = x1",43,38),N("r2","rs2 = x2",43,62),N("rd","rd = x3",43,86),
  N("ct","control: ALU add",83,14),N("rf","read registers",83,50),N("wb","write x3",83,86)],
  [E("w","op"),E("w","r1"),E("w","r2"),E("w","rd"),E("op","ct"),E("r1","rf"),E("r2","rf"),E("rd","wb")],
  "Decode slices the 32-bit instruction word into fields: the opcode picks the operation, the register numbers pick operands, and each field drives control signals or register-file ports.", aspect=0.72)

D["core_alu"] = blocks([N("a","A = {A}",12,22),N("b","B = {B}",12,78),N("alu","ALU",45,50,color="gold"),N("r","A + B = {mod(A+B,16)}",84,30,color="green"),N("f","carry = {(A+B)>15}",84,72,color="pink"),N("d","A − B = {mod(A-B+16,16)}",84,88)],
  [E("a","alu"),E("b","alu"),E("alu","r"),E("alu","f"),E("alu","d")],
  "A 4-bit ALU takes two operands and produces a result plus flags. Change A and B and watch the sum wrap around at 16 and the carry flag set.",
  [P("A","operand A",0,15,11,"",1),P("B","operand B",0,15,7,"",1)], [R("A + B (4 bits)","mod(A+B,16)"), R("carry out","(A+B)>15"), R("A − B (4 bits)","mod(A-B+16,16)")], aspect=0.72)

D["core_registers"] = blocks([N("a1","rs1 address",12,18),N("a2","rs2 address",12,50),N("rf","register file",47,50,color="gold"),N("o1","operand A",86,22),N("o2","operand B",86,50),N("wr","result (rd, data)",47,88,color="pink")],
  [E("a1","rf"),E("a2","rf"),E("rf","o1"),E("rf","o2"),E("wr","rf","write")],
  "The register file is a small, very fast memory with two read ports and one write port, so an instruction can fetch both operands and store a result in the same cycle.", aspect=0.7)

D["core_l1_cache"] = plot([("x<=L1 ? 4 : (x<=512 ? 14 : (x<=8192 ? 40 : 300))","average access latency","accent",False,2.6)],[4,65536],[1,1000],
  "Access time depends on whether the working set fits: L1 holds a few tens of kilobytes at about 4 cycles, then each level further out costs several times more. Programs that fit in L1 run fastest.",
  [P("L1","L1 size",16,128,32,"KB",16)], [R("L1 hit latency","4","cycles"), R("DRAM latency","300","cycles")],
  logx=True, logy=True, vlines=[{"x":"L1","label":"L1"},{"x":512,"label":"L2"},{"x":8192,"label":"L3"}], xlabel="working-set size (KB)", ylabel="latency (cycles)")

D["core_branch_predictor"] = {"type":"fsm","states":[{"id":"SN"},{"id":"WN"},{"id":"WT","accept":True},{"id":"ST","accept":True}],"start":"WN",
  "transitions":[["SN","WN","T"],["SN","SN","N"],["WN","WT","T"],["WN","SN","N"],["WT","ST","T"],["WT","WN","N"],["ST","ST","T"],["ST","WT","N"]],"input":"TTTNTTTNNT",
  "caption":"A 2-bit saturating counter predicts 'taken' in the two double-ring states. It takes two wrong outcomes in a row to flip the prediction, so a loop's single exit does not spoil it. Watch the input (T = taken, N = not)."}

def pipe():
    cols=["accent","gold","pink","green","purple"]; sh=[]
    for i in range(6):
        for s,l in enumerate("FDEMW"):
            sh.append({"k":"rect","x":i+s,"y":-i,"w":0.92,"h":0.8,"fill":cols[s],"alpha":0.55,"color":cols[s],"when":"%d<n"%i})
            sh.append({"k":"text","x":i+s+0.46,"y":-i+0.4,"text":l,"color":"white","size":10,"when":"%d<n"%i})
        sh.append({"k":"text","x":-0.6,"y":-i+0.4,"text":"i%d"%(i+1),"color":"dim","size":9,"when":"%d<n"%i})
    sh.append({"k":"text","x":6,"y":1.2,"text":"cycle →","color":"dim","size":9})
    return sh
D["core_pipeline"] = S("geometry","A 5-stage pipeline (Fetch, Decode, Execute, Memory, Write-back) starts a new instruction every cycle, like an assembly line. Add instructions and see the speed-up over finishing each one before starting the next.",
  [P("n","instructions",1,6,4,"",1)], [R("cycles, pipelined","n+4"), R("cycles, one at a time","5*n"), R("speed-up","5*n/(n+4)")],
  range=[-1.2,10.2,-6,1.8], aspect=0.62, shapes=pipe())

D["logic_adder"] = S("logic","A full adder's sum bit is the XOR of its three inputs; the carry-out is 1 when at least two inputs are 1. Toggle A, B and carry-in and check the truth table against 1 + 1 + 1 = 11₂.",
  expr="A ^ B ^ Cin", inputs=["A","B","Cin"], output="S")
D["logic_gate_nand"] = S("logic","NAND is 0 only when both inputs are 1. Because any other gate can be built from NANDs, it is the universal building block of digital chips.",
  expr="!(A & B)", inputs=["A","B"], output="Y")

D["cmos_inverter"] = plot([("VDD*(0.5-0.5*tanh(g*(x-VDD/2)))","V_out","accent",False,2.6),("x","V_out = V_in","dim",True)],[0,1.2],[0,1.25],
  "In a CMOS inverter one transistor is always off, so it draws almost no current when idle and swings rail to rail. The steepness of the transition (gain g) sets noise margin; each switch costs energy C·V².",
  [P("VDD","supply V_DD",0.6,1.2,1,"V"),P("g","transition steepness g",3,15,8),P("C","load capacitance",1,10,3,"fF")],
  [R("energy per switch C·V²","C*VDD^2","fJ"), R("power at 1 GHz, 10 % activity","0.1*C*VDD^2","µW")],
  points=[{"x":"VDD/2","y":"VDD/2","label":"switching point"}], xlabel="V_in (V)", ylabel="V_out (V)")

D["finfet_transistor"] = S("geometry","In a FinFET the channel is a thin vertical fin and the gate wraps it on three sides, so it controls the channel far better than a flat gate. A taller fin adds more channel width in the same footprint.",
  [P("H","fin height",20,50,40,"nm"),P("T","fin width",5,12,7,"nm")], [R("effective channel width 2H + T","2*H+T","nm"), R("gate sides controlling channel","3")],
  range=[-45,45,-10,66], aspect=0.8, shapes=[
  {"k":"rect","x":-45,"y":-10,"w":90,"h":10,"fill":"white","alpha":0.14,"color":"white"},{"k":"rect","x":"-T/2","y":0,"w":"T","h":"H","fill":"accent","alpha":0.7,"color":"accent"},
  {"k":"poly","pts":[["-T/2-3",0],["-T/2-3","H+3"],["T/2+3","H+3"],["T/2+3",0]],"closed":False,"color":"gold","width":6,"alpha":0.7},
  {"k":"text","x":0,"y":"H+10","text":"gate (wraps 3 sides)","color":"gold","size":10},{"k":"text","x":28,"y":"H/2","text":"fin = channel","color":"accent","size":10},{"k":"text","x":0,"y":-5,"text":"silicon substrate","size":9},
  {"k":"arrow","x1":24,"y1":"H/2","x2":"T/2+4","y2":"H/2","color":"accent","width":1.5}])

D["silicon_channel"] = plot([("(b^3/2)*x^2*exp(-b*x)","electron density","accent")],[0,8],None,
  "The inversion layer is only a few nanometres thick: electrons are squeezed against the oxide by the gate field. A stronger field (more carriers per area Ns) pulls the electrons even closer to the interface.",
  [P("Ns","carriers per area",1,20,8,"×10¹² cm⁻²")], [R("peak depth","2/(0.7*Ns^(1/3))","nm"), R("average depth","3/(0.7*Ns^(1/3))","nm")], xlabel="depth below the oxide (nm)", ylabel="density (normalised)")
D["silicon_channel"]["fns"][0]["f"]="((0.7*Ns^(1/3))^3/2)*x^2*exp(-(0.7*Ns^(1/3))*x)"

D["usb_c_charger"] = blocks([N("ac","AC mains",11,16),N("br","rectify",36,16),N("sw","switch",61,16,color="gold"),N("tx","flyback",86,16),N("sr","sync rect",86,50),N("bk","buck",61,50),N("out","USB-C out",36,50,color="green"),N("pd","PD + opto",61,86,color="pink")],
  [E("ac","br"),E("br","sw"),E("sw","tx"),E("tx","sr"),E("sr","bk"),E("bk","out"),E("out","pd","voltage?"),E("pd","sw","duty",dashed=True)],
  "The charger rectifies mains, chops it at high frequency through a small flyback transformer, rectifies and trims the output. A feedback path across the isolation barrier tells it what voltage the phone asked for.", aspect=0.72)

_ac="325*sin(2*pi*60*x/1000)"
D["rectifier_bridge"] = plot([(_ac,"AC mains (120 V rms)","dim",True),("325*max(abs(sin(2*pi*60*x/1000)),exp(-mod(x+4.1667,8.3333)/(90*C/P)))","after bridge + bulk capacitor","accent",False,2.8)],[0,50],[-350,350],
  "Four diodes always steer current the same way through the load, turning AC into pulsating DC. A bulk capacitor fills the gaps between peaks; a bigger C or lighter load leaves less ripple.",
  [P("C","bulk capacitor",22,1000,68,"µF"),P("P","load power",5,100,50,"W")], [R("ripple (approx.)","P/300/(120*C*1e-6)","V p-p"), R("peak voltage","325","V")], xlabel="time (ms)", ylabel="volts")

D["flyback_transformer"] = plot([("(mod(x,10)<10*D) ? 0.3*mod(x,10) : 0","primary current (switch on)","accent",False,2.6),("(mod(x,10)>=10*D) ? max(0,n*0.3*10*D-Vr*n/1000*(mod(x,10)-10*D)) : 0","secondary current (switch off)","pink",False,2.6)],[0,20],[0,10],
  "A flyback transformer is really a coupled inductor: while the switch is on the primary stores energy; when it turns off, the stored energy is released through the secondary. Turns ratio n sets the output voltage Vo = Vr/n.",
  [P("D","duty cycle D",0.1,0.5,0.4),P("n","turns ratio Np:Ns",4,10,6,"",1),P("Vr","reflected voltage",60,150,120,"V")],
  [R("output voltage Vr/n","Vr/n","V"), R("primary peak current","0.3*10*D","A"), R("energy rate ½·L·Ip²·f","50*(0.3*10*D)^2","W")], xlabel="time (µs, 100 kHz)", ylabel="amperes")

D["switching_mosfet"] = plot([("1-clamp((x-10-tr)/tf,0,1)","drain voltage (× 300 V)","accent"),("clamp((x-10)/tr,0,1)","drain current (× 2 A)","pink"),("clamp((x-10)/tr,0,1)*(1-clamp((x-10-tr)/tf,0,1))","power V·I","gold",False,2.8)],[0,100],[0,1.1],
  "While a MOSFET turns on, current rises and voltage falls over tr + tf, and their overlap (the gold area) is lost as heat every cycle. Faster switching, or GaN/SiC devices, shrink the area and the loss.",
  [P("tr","current rise time",5,40,15,"ns"),P("tf","voltage fall time",5,40,15,"ns")], [R("energy per turn-on","0.3*(tr+tf)","µJ"), R("loss at 100 kHz","0.03*(tr+tf)","W")],
  shade={"f":"clamp((x-10)/tr,0,1)*(1-clamp((x-10-tr)/tf,0,1))","from":10,"to":"10+tr+tf","color":"gold"}, xlabel="time (ns)")

D["feedback_optocoupler"] = plot([("min(CTR*age*x/100,Isat)","phototransistor current","accent",False,2.6),("x","1:1 reference","dim",True)],[0,20],[0,20],
  "An optocoupler passes the error signal across the isolation barrier as light: the LED current sets the phototransistor current by the current-transfer ratio (CTR). CTR falls as the LED ages, which the feedback loop must tolerate.",
  [P("CTR","CTR",50,300,100,"%"),P("age","ageing factor",0.5,1,1),P("Isat","saturation current",2,20,10,"mA")],
  [R("effective CTR","CTR*age","%")], xlabel="LED current (mA)", ylabel="output current (mA)")

D["buck_converter"] = plot([("20*(mod(x,2)<2*Vo/20)","switch node V_sw (20 V in)","pink"),("3-((20-Vo)*(Vo/20)*2/L)/2+(mod(x,2)<2*Vo/20 ? (20-Vo)/L*mod(x,2) : (20-Vo)/L*2*Vo/20-Vo/L*(mod(x,2)-2*Vo/20))","inductor current","accent",False,2.6)],[0,6],[-1,22],
  "The charger's last stage steps 20 V down to whatever the phone requests (5, 9, 15 V...) by changing the duty cycle D = Vout/Vin. The inductor current's ripple shrinks as inductance or switching speed rises.",
  [P("Vo","requested voltage",5,15,9,"V"),P("L","inductance",1,10,3.3,"µH")], [R("duty cycle D","Vo/20"), R("current ripple","(20-Vo)*(Vo/20)*2/L","A p-p")], xlabel="time (µs, 500 kHz)", ylabel="V  |  A")

D["electric_power_grid"] = plot([("60-60*dP/100/2*(1-exp(-x/H))","grid frequency","accent",False,2.6)],[0,30],[58,60.3],
  "Supply and demand must balance every instant; the spinning mass of generators (inertia H) is the buffer. If a plant trips, frequency falls, and more inertia makes it fall slower, buying time for other plants to respond.",
  [P("dP","generation lost",0.5,5,2,"%"),P("H","system inertia H",2,8,5,"s")], [R("initial rate of change","60*dP/100/(2*H)","Hz/s"), R("level before governors act","60-60*dP/100/2","Hz")],
  hlines=[{"y":59.5,"label":"alarm limit","color":"red"}], xlabel="time after the trip (s)", ylabel="frequency (Hz)")

D["power_plant"] = S("bars","Energy conversion efficiency differs widely by source: heat engines are limited by thermodynamics, while hydro and wind convert motion directly. Typical values.",
  bars=[{"label":"coal","value":38,"color":"dim"},{"label":"gas CCGT","value":60,"color":"orange"},{"label":"nuclear","value":33,"color":"purple"},{"label":"wind","value":45,"color":"accent"},{"label":"hydro","value":90,"color":"blue"},{"label":"solar PV","value":22,"color":"gold"}], ylabel="% of input energy delivered as electricity")

D["generator"] = plot([("(rpm/3000)*sin(2*pi*(rpm*P/120)*x/1000)","phase A","accent"),("(rpm/3000)*sin(2*pi*(rpm*P/120)*x/1000-2*pi/3)","phase B","pink"),("(rpm/3000)*sin(2*pi*(rpm*P/120)*x/1000+2*pi/3)","phase C","gold")],[0,60],[-1.35,1.35],
  "As the rotor's magnetic poles sweep past three coils spaced 120° apart, each coil produces an AC voltage; frequency is f = rpm × poles/120. Faster rotation raises both frequency and amplitude.",
  [P("rpm","rotor speed",600,3600,3000,"rpm",100),P("P","poles",2,8,2,"",2)], [R("frequency","rpm*P/120","Hz"), R("EMF vs 3000 rpm","rpm/3000")], xlabel="time (ms)", ylabel="EMF (relative)")

D["step_up_transformer"] = blocks([N("g","generator 20 kV",16,50),N("t","1 : {k}",50,50,color="gold"),N("l","line {20*k} kV",86,50,color="pink")],
  [E("g","t"),E("t","l")],
  "The same power leaves the transformer at k times the voltage and 1/k the current. Because line loss is I²R, raising the voltage twenty-fold cuts the loss four-hundred-fold.",
  [P("k","step-up ratio k",5,40,20)], [R("line voltage","20*k","kV"), R("line current","14.43/k","kA"), R("I²R loss relative","1/k^2")], aspect=0.42)

D["transmission_line"] = plot([("abs(x)<=L/2 ? 45-(a*cosh(L/(2*a))-a*cosh(x/a)) : 0/0","conductor height","accent",False,2.8)],[-300,300],[-5,50],
  "Overhead conductors hang in a catenary between towers. More tension (larger a) gives less sag; in summer heat the wire lengthens and sags toward the ground, which limits how much current the line may carry.",
  [P("a","tension parameter a",700,3000,1500,"m"),P("L","span L",200,600,400,"m")], [R("sag","a*cosh(L/(2*a))-a","m"), R("clearance at mid-span","45-(a*cosh(L/(2*a))-a)","m")],
  vlines=[{"x":"-L/2","label":"tower"},{"x":"L/2","label":"tower"}], hlines=[{"y":0,"label":"ground","color":"green"}], xlabel="distance along span (m)", ylabel="height (m)")

D["substation"] = blocks([N("hv","HV line",14,18),N("ds","switch",38,18),N("cb","breaker",62,18,color="gold"),N("tx","xfmr",86,18),N("lb","breaker",86,58,color="gold"),N("bus","LV bus",62,58),N("f1","feeder",30,44),N("f2","feeder",30,76)],
  [E("hv","ds"),E("ds","cb"),E("cb","tx"),E("tx","lb"),E("lb","bus"),E("bus","f1"),E("bus","f2")],
  "A substation switches and transforms power. Disconnect switches isolate equipment for maintenance, breakers interrupt fault current, the transformer changes voltage and a bus splits power to several feeders.", aspect=0.72)

D["distribution_transformer"] = blocks([N("p","primary {kv} kV",14,50),N("t","pole xfmr",48,50,color="gold"),N("l1","L1  120 V",86,16),N("n","neutral 0 V",86,50,color="dim"),N("l2","L2  120 V",86,84)],
  [E("p","t"),E("t","l1"),E("t","n"),E("t","l2")],
  "The last step-down: a transformer on the pole cuts the distribution voltage to 240 V with a centre-tapped secondary. Each half gives 120 V for outlets; both together give 240 V for ovens and dryers.",
  [P("kv","primary voltage",4,13.8,7.2,"kV",0.1)], [R("turns ratio","kv*1000/240"), R("secondary current per kW","1000/240","A")], aspect=0.62)

D["wall_outlet"] = plot([("Vrms*sqrt(2)*sin(2*pi*f*x/1000)","outlet voltage","accent",False,2.6)],[0,50],[-360,360],
  "The 'voltage' quoted for an outlet is the RMS value; the real peak is √2 times larger. The waveform repeats 50 or 60 times a second, and 120 V RMS does the same heating as 120 V DC.",
  [P("Vrms","RMS voltage",100,240,120,"V"),P("f","frequency",50,60,60,"Hz",10)], [R("peak voltage","Vrms*sqrt(2)","V"), R("period","1000/f","ms"), R("heat in 100 Ω load","Vrms^2/100","W")],
  hlines=[{"y":"Vrms*sqrt(2)","label":"peak","color":"pink"},{"y":"Vrms","label":"RMS","color":"gold"}], xlabel="time (ms)", ylabel="volts")

D["how_a_phone_charges"] = chain(["Wall AC","Charger","USB-C PD","Charge IC","Battery"],
  "AC is converted to DC by the charger, the phone and charger agree a voltage over USB-C, and the charge IC converts it to the right current for the cell. Faster charging is mostly just higher voltage.",
  per=3, params=[P("V","PD voltage",5,20,9,"V"),P("I","current",1,3,3,"A",0.1)], readouts=[R("charger power","V*I","W"), R("ideal 0→100 % time (15.4 Wh, 90 % eff.)","15.4/(V*I*0.9)*60","min")], colors={4:"green"})

D["how_a_transistor_switches"] = S("geometry","Raise the gate voltage above the threshold and electrons are drawn under the gate, forming a conducting channel between source and drain: the transistor turns on. Below it, no channel, no current.",
  [P("Vg","gate voltage",0,1.2,0.8,"V",0.01),P("Vt","threshold",0.2,0.7,0.4,"V",0.01)], [R("state (1 = on)","Vg>Vt"), R("drain current ∝ (V_G − V_T)²","Vg>Vt ? (Vg-Vt)^2 : 0")],
  range=[-4.2,4.2,-2,1.6], aspect=0.55, shapes=[
  {"k":"rect","x":-4,"y":-2,"w":8,"h":2,"fill":"white","alpha":0.1,"color":"white"},{"k":"rect","x":-3.6,"y":-0.9,"w":1.8,"h":0.9,"fill":"blue","alpha":0.5,"color":"blue"},{"k":"rect","x":1.8,"y":-0.9,"w":1.8,"h":0.9,"fill":"blue","alpha":0.5,"color":"blue"},
  {"k":"rect","x":-1.8,"y":0,"w":3.6,"h":0.15,"fill":"gold","alpha":0.8,"color":"gold"},{"k":"rect","x":-1.8,"y":0.15,"w":3.6,"h":0.6,"fill":"purple","alpha":0.6,"color":"purple"},
  {"k":"rect","x":-1.8,"y":-0.3,"w":3.6,"h":0.3,"fill":"green","alpha":"clamp((Vg-Vt)*2.5,0,1)","color":"green","when":"Vg>Vt"},
  {"k":"point","x":"-1.7+mod(t+0,1)*3.4","y":-0.15,"color":"white","size":3,"when":"Vg>Vt"},{"k":"point","x":"-1.7+mod(t+0.33,1)*3.4","y":-0.15,"color":"white","size":3,"when":"Vg>Vt"},{"k":"point","x":"-1.7+mod(t+0.66,1)*3.4","y":-0.15,"color":"white","size":3,"when":"Vg>Vt"},
  {"k":"text","x":-2.7,"y":-0.45,"text":"source","size":9},{"k":"text","x":2.7,"y":-0.45,"text":"drain","size":9},{"k":"text","x":0,"y":0.45,"text":"gate","size":9},{"k":"text","x":0,"y":-1.5,"text":"p-type silicon","size":9,"color":"dim"},
  {"k":"text","x":0,"y":1.25,"text":"ON: electrons flow","color":"green","when":"Vg>Vt"},{"k":"text","x":0,"y":1.25,"text":"OFF: no channel","color":"red","when":"Vg<=Vt"}])

D["instruction_execution"] = chain(["PC","Fetch","Decode","Execute","Memory","Write back"],
  "Every instruction, such as ADD x3, x1, x2, goes through the same cycle: look up where it is, fetch it, decode it, execute it, touch memory if needed and write the result. Then the PC moves on.",
  per=3, extra=[(5,0,"next instruction")], colors={3:"gold"})

D["how_wifi_sends_data"] = chain(["bits","encode","QAM","IFFT","DAC","mixer","PA","antenna"],
  "Wi-Fi turns bits into an OFDM radio signal: error-coding, mapping to constellation points, an inverse FFT, conversion to analogue, mixing up to 5 GHz and amplification. The receiver undoes each step.",
  per=4, colors={7:"gold"}, params=[P("b","bits per symbol (QAM)",1,10,6,"",1),P("cr","coding rate",0.5,0.9,0.75)],
  readouts=[R("PHY rate, 20 MHz, 1 stream (Wi-Fi 6)","234*b*cr/13.6","Mbit/s")])

D["how_a_photo_is_taken"] = chain(["Light","Lens","Bayer","Pixel","ADC","ISP","JPEG"],
  "The lens focuses light, a colour filter lets each pixel see red, green or blue, photodiodes turn photons into electrons, and an ADC and image processor assemble the picture. More photons mean a cleaner image.",
  per=4, params=[P("Ne","electrons collected per pixel",100,50000,5000,"e⁻")], readouts=[R("shot-noise limited SNR","10*log10(Ne)","dB")], colors={3:"gold"})

D["chip_fabrication"] = chain(["Wafer","Oxidise","Resist","Expose","Etch","Implant","Metal","Dice","Package"],
  "A wafer goes through the same cycle many times, depositing a layer, coating resist, exposing a pattern, etching and doping, to build transistors and wiring layer by layer. Then it is cut into chips and packaged.",
  per=3, extra=[(5,1,"repeat x80")], colors={3:"gold"})

D["power_grid_delivery"] = chain(["Plant","Step-up","{Vtx} kV line","Substation","Feeder","Pole xfmr","Outlet"],
  "Power is stepped up for efficient long-distance transport, then stepped down in stages to the outlet. The higher the transmission voltage, the smaller the I²R loss on the line.",
  per=3, params=[P("Vtx","transmission voltage",100,765,400,"kV")], readouts=[R("line loss (100 MW, 10 Ω)","1e5/Vtx^2","%")], colors={2:"gold"})

D["how_touchscreen_senses"] = chain(["Drive rows","Mutual C","Sense cols","ADC","Controller","SoC"],
  "The controller sends a signal along each drive row and measures what arrives on each sense column. A finger near a crossing absorbs some field, so the mutual capacitance drops; the controller finds the biggest drop.",
  per=3, params=[P("k","finger signal drop",10,30,20,"%")], readouts=[R("C without finger","1","pF"), R("C with finger","1-k/100","pF")], colors={1:"gold"})
