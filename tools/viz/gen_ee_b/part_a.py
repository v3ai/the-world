from common import *
import math
D = {}
# ---------------- SIGNALS ----------------
D["signals_basics"] = S("signal", "The smooth blue curve is a continuous-time signal; the gold stems are a discrete-time signal that only exists at the sample instants n/fs. Change fs to see how much of the wave the samples keep.",
  [P("f0","signal frequency",1,8,2,"Hz"), P("fs","sample rate",8,40,16,"Hz")],
  [R("samples per period","fs/f0"), R("sample spacing","1000/fs","ms")],
  x=[0,1], y=[-1.3,1.3], f="sin(2*pi*f0*x)", sample="fs", reconstruct=False)

D["dirac_delta"] = plot([("(abs(x)<w/2) ? 1/w : 0","pulse: width w, height 1/w","accent"),("clamp(x/w+0.5,0,1)","ramp of width w","gold")],
  [-2,2],[-0.2,5.5],"A narrow pulse of area 1 approaches the impulse δ(t) and the ramp approaches the unit step u(t); the pulse is the slope of the ramp. Shrink w to see the limit.",
  [P("w","width w",0.2,1.5,0.6,"s")], [R("pulse height 1/w","1/w"), R("pulse area","w*(1/w)")], xlabel="t (s)")

D["lti_properties"] = plot([("A*sin(x)","input","dim"),("clamp(A*sin(x),-L,L)","output of clipping amplifier","gold")],
  [0,6.283],[-4.2,4.2],"A linear system doubles its output when you double the input. Clipping breaks that: once the input exceeds the limit L the output stops following, so the system is no longer linear.",
  [P("A","input amplitude",0.5,4,3,"V"), P("L","clip level",0.5,3,1.5,"V")],
  [R("peak gain out/in","min(1,L/A)"), R("distortion","A>L ? 1 : 0")], xlabel="time (rad)")
D["lti_properties"]["readouts"][1]["label"] = "clipping? (1 = yes)"

D["convolution"] = plot([("(x>=0&&x<=1) ? 1 : 0","input x(t): 1 s pulse","accent",True),("(x>=0) ? exp(-x/T) : 0","impulse response h(t)","pink",True),
  ("x<0 ? 0 : (x<1 ? T*(1-exp(-x/T)) : T*(exp(-(x-1)/T)-exp(-x/T)))","output y = x*h","gold",False,3)],
  [-0.5,5],[-0.1,1.1],"The output is the pulse smeared by the system's impulse response. A slow system (large T) gives a low, long output; a fast one reproduces the pulse.",
  [P("T","time constant T",0.1,1.5,0.5,"s")], [R("peak output","T*(1-exp(-1/T))"), R("output lasts about","1+4*T","s")], xlabel="t (s)")

D["fourier_transform_ee"] = S("signal","A short pulse (top) has a wide spectrum (bottom); a long pulse has a narrow one. Time and frequency spread are inversely related.",
  [P("T","pulse width T",0.05,0.8,0.2,"s")], [R("first spectral null 1/T","1/T","Hz")],
  x=[-1,1], f="(abs(x)<T/2) ? 1 : 0", spectrum=True, fmax=30)

D["laplace_signals"] = S("pz","Each pair of s-plane poles is a damped oscillation e^(-σt) sin(ωt): the real part sets the decay, the imaginary part the ringing. Poles in the left half-plane decay, so the system is stable.",
  [P("a","decay σ",0.2,3,1,"1/s"), P("w0","ringing ω",0,4,2,"rad/s")],
  [R("time constant 1/σ","1/a","s"), R("damping ratio ζ","a/hypot(a,w0)")],
  range=5, poles=[["-a","w0"],["-a","-w0"]], zeros=[])

D["z_transform"] = S("pz","In the z-plane a pole at radius r decays like r^n and its angle sets the oscillation per sample. Inside the unit circle the response dies away; push r past 1 and it grows.",
  [P("r","pole radius r",0.2,1.15,0.8), P("th","pole angle",10,170,50,"°")],
  [R("amplitude after 10 samples","r^10"), R("oscillation","th/360","cycles/sample")],
  plane="z", range=1.5, poles=[["r*cos(rad(th))","r*sin(rad(th))"],["r*cos(rad(th))","-r*sin(rad(th))"]], zeros=[[0,0]])

D["aliasing"] = S("signal","Above the Nyquist limit fs/2 a fast sine is sampled so sparsely that the samples fit a slower wave (dashed): the alias. Raise the signal frequency past fs/2 and watch the apparent frequency fall.",
  [P("f0","signal frequency",1,40,17,"Hz"), P("fs","sample rate",10,30,20,"Hz")],
  [R("alias frequency |f − k fs|","abs(f0-round(f0/fs)*fs)","Hz"), R("Nyquist limit fs/2","fs/2","Hz")],
  x=[0,1], y=[-1.3,1.3], f="sin(2*pi*f0*x)", sample="fs")

D["spectra_filtering"] = S("signal","A 3 Hz tone and a 20 Hz tone pass through a low-pass filter. Lower the cutoff below 20 Hz and the high tone shrinks in the waveform and in the spectrum below it.",
  [P("fc","cutoff fc",2,40,8,"Hz")],
  [R("gain at 3 Hz","-10*log10(1+(3/fc)^2)","dB"), R("gain at 20 Hz","-10*log10(1+(20/fc)^2)","dB")],
  x=[0,1], f="sin(2*pi*3*x-atan(3/fc))/sqrt(1+(3/fc)^2) + 0.6*sin(2*pi*20*x-atan(20/fc))/sqrt(1+(20/fc)^2)", spectrum=True, fmax=40)

D["modulation_basics"] = S("signal","Multiplying a low-frequency message by a carrier shifts its spectrum up: the 30 Hz carrier gets sidebands at 30 ± fm. Raise the depth m for stronger sidebands.",
  [P("m","modulation depth m",0,1,0.7), P("fm","message frequency",1,6,2,"Hz",1)],
  [R("sidebands at","30-fm","Hz"), R("and","30+fm","Hz"), R("bandwidth","2*fm","Hz")],
  x=[0,1], f="(1+m*cos(2*pi*fm*x))*cos(2*pi*30*x)", spectrum=True, fmax=50)
D["modulation_basics"]["readouts"][1]["label"]="and"

# ---------------- DSP ----------------
D["dtft_dft"] = S("signal","Sampling a 1 s window gives a DFT with bins 1 Hz apart. Each tone shows up as one spectral line at its frequency; move the tones and watch the lines follow.",
  [P("f0","tone 1",3,20,5,"Hz",1), P("f1","tone 2",3,30,12,"Hz",1)],
  [R("bin spacing 1/T","1","Hz")],
  x=[0,1], f="sin(2*pi*f0*x)+0.5*sin(2*pi*f1*x)", spectrum=True, fmax=35)

D["fft_algorithm"] = plot([("x^2","DFT: N² operations","pink"),("x*log2(x)","FFT: N log₂N","accent")],[4,4096],[1,2e7],
  "The direct DFT needs N² multiplications; the FFT needs only N log₂N. At N = 1024 that is about a hundred times fewer, and the gap keeps growing.",
  [P("m","size N = 2^m",2,12,10,"",1)], [R("N","2^m"), R("speed-up N/log₂N","2^m/m")],
  logx=True, logy=True, xlabel="N (points)", ylabel="operations",
  points=[{"x":"2^m","y":"(2^m)^2","color":"pink"},{"x":"2^m","y":"2^m*m","color":"accent"}])

D["fir_filters"] = plot(["abs(sin(pi*x*M)/(M*sin(pi*x)))"],[0.001,0.5],[0,1.05],
  "An M-tap moving average is the simplest FIR low-pass filter. More taps narrow the passband and place nulls at multiples of 1/M.",
  [P("M","number of taps M",2,16,8,"",1)], [R("first null 1/M","1/M","cycles/sample"), R("−3 dB point ≈ 0.443/M","0.443/M","cycles/sample")],
  xlabel="frequency (cycles/sample)", ylabel="|H|")
D["fir_filters"]["fns"][0]["label"]="|H(f)| of M-tap average"

D["iir_filters"] = plot(["(1-r)*sqrt(1-2*r*cos(2*th)+r^2)/hypot(1-2*r*cos(th)*cos(x)+r^2*cos(2*x), 2*r*cos(th)*sin(x)-r^2*sin(2*x))"],[0.001,3.14159],[0,1.3],
  "Feedback lets a two-pole IIR filter resonate. Pushing the pole radius r toward 1 sharpens the peak at the pole angle, something an FIR filter would need many taps to do.",
  [P("r","pole radius r",0.5,0.99,0.9), P("th","pole angle θ",0.3,2.8,1,"rad")], [R("peak at ω ≈ θ","th","rad/sample"), R("stable?","r<1")],
  xlabel="ω (rad/sample)", ylabel="|H|")
D["iir_filters"]["readouts"][1]["label"]="stable (1 = yes)"

D["windowing_methods"] = S("signal","A tone that does not fit a whole number of cycles in the window leaks across the spectrum, hiding the weak neighbour at f₀+6. A Hann window (w = 1) tames the leakage.",
  [P("f0","tone frequency",6,12,8.5,"Hz",0.5), P("w","window: 0 rect, 1 Hann",0,1,0,"",1)],
  [R("weak tone at","f0+6","Hz")],
  x=[0,1], f="(1-w+w*(0.5-0.5*cos(2*pi*x)))*(sin(2*pi*f0*x)+0.1*sin(2*pi*(f0+6)*x))", spectrum=True, fmax=25)

D["multirate_processing"] = S("signal","Decimation keeps every M-th sample of a 64 Hz stream. If the new Nyquist limit 32/M falls below the signal frequency, it aliases, which is why a low-pass filter must come first.",
  [P("f0","signal frequency",1,30,5,"Hz"), P("M","decimation factor M",1,8,4,"",1)],
  [R("new rate 64/M","64/M","Hz"), R("new Nyquist","32/M","Hz"), R("apparent frequency","abs(f0-round(f0*M/64)*64/M)","Hz")],
  x=[0,1], y=[-1.3,1.3], f="sin(2*pi*f0*x)", sample="64/M")

D["quantization_effects"] = plot([("sin(2*pi*x)","signal","dim"),("(2/(2^B))*floor(sin(2*pi*x)*2^B/2+0.5)","quantised","gold",False,2.6)],
  [0,1],[-1.2,1.2],"Rounding to B bits turns a smooth wave into steps. Each extra bit halves the step and adds about 6 dB of signal-to-quantisation-noise ratio.",
  [P("B","word length B",2,8,3,"bits",1)], [R("step Δ = 2/2^B","2/2^B","FS"), R("SQNR ≈ 6.02B + 1.76","6.02*B+1.76","dB"), R("rms error Δ/√12","2/2^B/sqrt(12)","FS")],
  xlabel="time (cycles)")

D["fixed_vs_float"] = plot([("2^(-(F+1))/x","fixed point (F fraction bits)","pink"),("2^(-24)+0*x","32-bit float","accent")],[1e-4,1],[1e-8,10],
  "Fixed point has a constant step, so small numbers lose relative accuracy. Floating point keeps relative error about 6×10⁻⁸ at every size, which is why it is easier but costs more hardware.",
  [P("F","fraction bits F",8,24,15,"bits",1)], [R("fixed step 2^−F","2^(-F)"), R("float relative error","2^(-24)")],
  logx=True, logy=True, xlabel="value magnitude", ylabel="relative rounding error")

D["dsp_applications"] = blocks([
  N("in","in",8,50),N("adc","ADC",29,50),N("dsp","DSP",52,50,color="gold"),N("dac","DAC",75,50),N("out","out",93,50),
  N("a","audio",20,90,color="green"),N("b","image",50,90,color="pink"),N("c","radar",80,90,color="purple"),N("d","comms",52,10,color="orange")],
  [E("in","adc"),E("adc","dsp"),E("dsp","dac"),E("dac","out"),E("dsp","a",dashed=True),E("dsp","b",dashed=True),E("dsp","c",dashed=True),E("d","dsp",dashed=True)],
  "A DSP chain digitises a signal, computes on it as numbers, and converts back. The same pattern serves audio, images, radar and radio.", aspect=0.72)

# ---------------- EM ----------------
D["vector_analysis_em"] = S("field","Divergence measures how much field spreads out of a point (a source); curl measures how much it circulates. Set one to zero and see the pure source or pure swirl.",
  [P("a","spreading a",-1,1,0.5), P("b","swirl b",-1,1,0.5)],
  [R("divergence ∇·F = 2a","2*a"), R("curl (∇×F)z = 2b","2*b")],
  range=[-3,3,-3,3], vx="a*x-b*y", vy="a*y+b*x", streamlines=True, density=13)

D["electrostatics_dielectrics"] = plot([("(x>=0.3&&x<=0.7) ? 1/er : 1","electric field E (× D/ε₀)","accent"),("1+0*x","flux density D (× D)","gold",True)],
  [0,1],[0,1.15],"Between capacitor plates D stays constant, but inside a dielectric the field E drops by 1/εr because the material's dipoles oppose it. Less field for the same charge means more capacitance.",
  [P("er","relative permittivity εr",1,20,4)], [R("E inside / E outside","1/er"), R("capacitance gain C/C₀","1/(0.6+0.4/er)")],
  vlines=[{"x":0.3,"label":"slab"},{"x":0.7,"label":""}], xlabel="position between plates (d)")

D["magnetostatics_materials"] = plot([("1.8*tanh(mur*4e-7*pi*x/1.8)","iron core B = μ0μrH, saturating","accent"),("4e-7*pi*x","air B = μ0H","dim",True)],
  [-2000,2000],[-2.2,2.2],"Iron multiplies the flux density by μr until it saturates near 1.8 T; air stays on the shallow dashed line. A larger μr means the same field needs far less current.",
  [P("mur","relative permeability μr",50,5000,1500)], [R("slope at origin μ0μr","4e-7*pi*mur","T per A/m")],
  xlabel="field H (A/m)", ylabel="flux density B (T)")

D["maxwell_equations"] = plot([("sin(2*pi*(x/lam-0.5*t))","E field","accent"),("sin(2*pi*(x/lam-0.5*t))","cB field (in phase, ⊥ to E)","gold",True)],
  [0,2],[-1.3,1.3],"A changing E creates B and a changing B creates E, so together they travel as a wave at c. Raise the frequency and the wavelength λ = c/f shrinks.",
  [P("fG","frequency",0.15,1.5,0.5,"GHz")], [R("wavelength λ","0.3/fG","m"), R("speed λ·f","0.3/fG*fG*1e9","m/s")],
  xlabel="distance (m)")
D["maxwell_equations"]["fns"][0]["f"]="sin(2*pi*(x/(0.3/fG)-0.5*t))"; D["maxwell_equations"]["fns"][1]["f"]=D["maxwell_equations"]["fns"][0]["f"]

D["plane_waves"] = S("parametric","The tip of the electric field traces a shape as the wave passes. Equal components 90° apart give a circle (circular polarisation); in phase gives a line; anything else an ellipse.",
  [P("a","Ey/Ex ratio",0,1.5,1), P("d","phase difference δ",0,180,90,"°")],
  [R("wave impedance η₀ = √(μ₀/ε₀)","sqrt(4e-7*pi/8.854e-12)","Ω")],
  range=[-1.6,1.6,-1.6,1.6], curves=[{"x":"cos(s)","y":"a*cos(s+rad(d))","s":[0,6.2832],"dot":"2*t","color":"accent"}], aspect=0.8)

D["reflection_refraction"] = S("geometry","Light bends toward the normal entering a denser medium (Snell's law n₁ sinθ₁ = n₂ sinθ₂). Going from dense to less dense at a steep angle it cannot escape and reflects totally.",
  [P("n1","index n₁ (top)",1,2.5,1),P("n2","index n₂ (bottom)",1,2.5,1.5),P("th","incident angle",5,85,45,"°")],
  [R("refraction angle (90 = none)","deg(asin(min(1,n1*sin(rad(th))/n2)))","°"), R("reflected power at normal incidence","100*((n1-n2)/(n1+n2))^2","%")],
  range=[-4,4,-3,3], aspect=0.75, shapes=[
  {"k":"rect","x":-4,"y":-3,"w":8,"h":3,"fill":"accent","alpha":0.12,"stroke":False},
  {"k":"line","x1":-4,"y1":0,"x2":4,"y2":0,"color":"white","width":1.5},
  {"k":"line","x1":0,"y1":-3,"x2":0,"y2":3,"color":"dim","dash":True,"width":1},
  {"k":"line","x1":"-3*sin(rad(th))","y1":"3*cos(rad(th))","x2":0,"y2":0,"color":"gold","width":2.5},
  {"k":"line","x1":0,"y1":0,"x2":"3*sin(rad(th))","y2":"3*cos(rad(th))","color":"pink","width":1.8},
  {"k":"line","x1":0,"y1":0,"x2":"3*n1*sin(rad(th))/n2","y2":"-3*sqrt(max(0,1-(n1*sin(rad(th))/n2)^2))","color":"green","width":2.5,"when":"n1*sin(rad(th))/n2<1"},
  {"k":"text","x":-2.5,"y":-1.5,"text":"n₂ = {n2}","color":"accent"},{"k":"text","x":-2.7,"y":2.6,"text":"n₁ = {n1}","color":"white"},
  {"k":"text","x":2,"y":-1.5,"text":"total internal reflection","color":"red","when":"n1*sin(rad(th))/n2>=1"}])

D["transmission_lines"] = plot([("exp(-((x-mod(3*t,20))/0.6)^2)+((ZL-50)/(ZL+50))*exp(-((x-(20-mod(3*t,20)))/0.6)^2)","voltage pulse on the line","accent",False,2.6)],
  [0,10],[-1.3,2],"A pulse travels down a 50 Ω line and reflects from the load with coefficient Γ = (Z_L − Z₀)/(Z_L + Z₀). A matched 50 Ω load absorbs it; open or short circuits reflect it fully.",
  [P("ZL","load impedance Z_L",5,500,150,"Ω")], [R("reflection Γ","(ZL-50)/(ZL+50)"), R("reflected power Γ²","((ZL-50)/(ZL+50))^2*100","%")],
  vlines=[{"x":9.8,"label":"load"}], xlabel="position along line")

D["standing_waves_vswr"] = plot([("cos(2*t-2*pi*x)+G*cos(2*t+2*pi*x)","instantaneous voltage","accent"),("sqrt(1+G^2+2*G*cos(4*pi*x))","envelope","gold",True),("-sqrt(1+G^2+2*G*cos(4*pi*x))","","gold",True)],
  [0,2],[-2.1,2.1],"Incident and reflected waves add into a standing pattern. The more reflection, the deeper the nulls and the higher the VSWR = (1+|Γ|)/(1−|Γ|).",
  [P("G","reflection |Γ|",0.05,0.95,0.5)], [R("VSWR","(1+G)/(1-G)"), R("return loss","-20*log10(G)","dB")], xlabel="distance (wavelengths)")

def smith():
    sh = [{"k":"circle","x":0,"y":0,"r":1,"color":"white","width":1.5},{"k":"line","x1":-1,"y1":0,"x2":1,"y2":0,"color":"dim","width":1}]
    for r in [0.2,0.5,1,2,5]:
        sh.append({"k":"circle","x":r/(1+r),"y":0,"r":1/(1+r),"color":"accent","alpha":0.45,"width":1})
    for X in [0.5,1,2,5,-0.5,-1,-2,-5]:
        rr = "(s/(1-s))^2"
        sh.append({"k":"curve","x":"((%s)^2-1+%s)/(((%s)+1)^2+%s)"%(rr,X*X,rr,X*X),"y":"%s/(((%s)+1)^2+%s)"%(2*X,rr,X*X),"s":[0,0.99],"color":"purple","alpha":0.5,"width":1})
    g = "((r0)^2-1+(x0)^2)/((r0+1)^2+(x0)^2)"; gi = "2*x0/((r0+1)^2+(x0)^2)"
    sh += [{"k":"circle","x":0,"y":0,"r":"hypot(%s,%s)"%(g,gi),"color":"gold","dash":True,"width":1.2},
      {"k":"point","x":g,"y":gi,"color":"gold","size":6},{"k":"line","x1":0,"y1":0,"x2":g,"y2":gi,"color":"gold","width":1.5},
      {"k":"text","x":-1.08,"y":0.07,"text":"short","color":"dim","size":9},{"k":"text","x":1.07,"y":0.07,"text":"open","color":"dim","size":9},{"k":"text","x":0.09,"y":-0.07,"text":"Z₀","color":"dim","size":9}]
    return sh
D["smith_chart"] = S("geometry","The Smith chart maps every impedance z = r + jx onto one disc: circles are constant resistance, arcs constant reactance. Move z and watch the reflection Γ (gold) and its constant-VSWR circle.",
  [P("r0","resistance r",0.1,5,1.5),P("x0","reactance x",-3,3,1)],
  [R("|Γ|","hypot(((r0)^2-1+(x0)^2)/((r0+1)^2+(x0)^2),2*x0/((r0+1)^2+(x0)^2))"), R("VSWR","(1+hypot(((r0)^2-1+(x0)^2)/((r0+1)^2+(x0)^2),2*x0/((r0+1)^2+(x0)^2)))/(1-hypot(((r0)^2-1+(x0)^2)/((r0+1)^2+(x0)^2),2*x0/((r0+1)^2+(x0)^2)))")],
  range=[-1.15,1.15,-1.15,1.15], aspect=0.95, shapes=smith())

D["impedance_matching"] = plot([("abs(ZL-50)*abs(cos(pi/2*x))/sqrt(4*50*ZL*sin(pi/2*x)^2+(ZL+50)^2*cos(pi/2*x)^2)","with λ/4 transformer","accent",False,2.6),("abs(ZL-50)/(ZL+50)+0*x","no matching","pink",True)],
  [0.2,1.8],[0,1],"A quarter-wave section of impedance √(Z₀Z_L) cancels the reflection exactly at the design frequency (f/f₀ = 1) and keeps it low over a band around it.",
  [P("ZL","load Z_L",10,300,200,"Ω")], [R("transformer impedance √(Z₀Z_L)","sqrt(50*ZL)","Ω"), R("unmatched |Γ|","abs(ZL-50)/(ZL+50)")],
  xlabel="frequency / design frequency", ylabel="|Γ|")

D["waveguides"] = plot([("x>150/a ? sqrt(1-(150/(a*x))^2) : 0/0","group velocity v_g / c (signal speed)","accent"),("x>150/a ? 1/sqrt(1-(150/(a*x))^2) : 0/0","phase velocity v_p / c","pink")],
  [0,25],[0,3],"Below the cutoff fc = c/2a nothing propagates. Above it the signal speed v_g climbs toward c while the phase velocity exceeds c (their product is c²).",
  [P("a","wide dimension a",10,40,23,"mm")], [R("cutoff fc = c/2a","150/a","GHz")], xlabel="frequency (GHz)")

D["skin_effect"] = plot([("exp(-x/(66.1/sqrt(10^p)))","current density J / J_surface","accent")],[0,6],[0,1.05],
  "At high frequency AC current crowds near the surface of a conductor and falls by 1/e at the skin depth δ. Slide the frequency up and the copper core stops carrying current.",
  [P("p","log₁₀ frequency",1.7,6.5,3,"")], [R("frequency","10^p","Hz"), R("skin depth δ (copper)","66.1/sqrt(10^p)","mm")],
  points=[{"x":"66.1/sqrt(10^p)","y":"exp(-1)","label":"δ"}], xlabel="depth below surface (mm)")

D["antenna_fundamentals"] = S("parametric","The lobe shows how strongly an antenna radiates in each direction. A narrower beam (larger n) puts more power forward: higher directivity, measured against the dashed isotropic reference.",
  [P("n","beam sharpness n",0.5,20,3,"",0.5)],
  [R("directivity D = 2(2n+1)","2*(2*n+1)"), R("gain (lossless)","10*log10(2*(2*n+1))","dBi"), R("half-power beamwidth","2*deg(acos(0.5^(1/(2*n))))","°")],
  range=[-0.3,1.15,-0.85,0.85], aspect=0.75, curves=[{"x":"cos(s)^(n+1)","y":"cos(s)^n*sin(s)","s":[-1.5708,1.5708],"color":"accent","n":600},{"x":"cos(s)/sqrt(2*(2*n+1))","y":"sin(s)/sqrt(2*(2*n+1))","s":[0,6.2832],"color":"dim"}])

D["dipole_antennas"] = S("parametric","A dipole radiates most broadside to its axis (gold) and nothing along it. A half-wave dipole (L = 0.5) gives a smooth doughnut; lengths past one wavelength split the pattern into extra lobes.",
  [P("L","length L",0.1,1.5,0.5,"λ")], [R("length at 2.4 GHz","L*12.5","cm")],
  range=[-1.9,1.9,-1.9,1.9], aspect=0.85, curves=[
  {"x":"abs((cos(pi*L*cos(s))-cos(pi*L))/(abs(sin(s))+1e-6))/(1-cos(pi*L))*sin(s)","y":"abs((cos(pi*L*cos(s))-cos(pi*L))/(abs(sin(s))+1e-6))/(1-cos(pi*L))*cos(s)","s":[0,6.2832],"color":"accent","n":800},
  {"x":"0","y":"s","s":["-L/2","L/2"],"color":"gold"}])

_psi = "(2*pi*d*(sin(s)-sin(rad(th0))))"
_r = "abs(sin(N*%s/2+1e-9)/(N*sin(%s/2+1e-9)))" % (_psi,_psi)
D["antenna_arrays"] = S("parametric","N antennas fed in step make a narrow beam broadside; shifting their phases steers it electronically. Spacing above one wavelength lets extra grating lobes appear.",
  [P("N","elements N",2,12,6,"",1),P("d","spacing d",0.25,1,0.5,"λ"),P("th0","steer angle",-60,60,0,"°")],
  [R("beamwidth ≈ 50.8°/(N d cosθ)","50.8/(N*d*cos(rad(th0)))","°")],
  range=[-1.1,1.1,-1.1,1.1], aspect=0.85, curves=[{"x":"%s*sin(s)"%_r,"y":"%s*cos(s)"%_r,"s":[0,6.2832],"color":"accent","n":1500}])

D["emi_emc"] = blocks([N("s","noise source",14,50,color="red"),N("c","conducted: filter",52,16),N("r","radiated: shield",52,50),N("g","ground loop: 1-pt gnd",52,84),N("v","victim",89,50,color="green")],
  [E("s","c"),E("s","r"),E("s","g"),E("c","v"),E("r","v"),E("g","v")],
  "Interference needs a source, a coupling path and a victim. Each fix breaks one path: filters stop conducted noise, shields stop radiated noise, careful grounding avoids loops.", aspect=0.7)
