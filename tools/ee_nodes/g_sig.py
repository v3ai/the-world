from lib import *
area('ee_signals')
SS="MIT RES.6-007 Signals and Systems|https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/"
n('signals_basics','Continuous- and discrete-time signals','concept','complex_numbers','Functions that carry information.',
  'A signal is a quantity varying with time (or position): a voltage, a sound, a row of pixels. Continuous signals exist at every instant; discrete ones only at samples.',
  'Basic signals: step, ramp, impulse, sinusoid, exponential. Operations: shift, scale, reverse, add.',
  'Energy vs power signals; even/odd; periodic; x[n]=x(nT); the complex exponential e^{st} is the universal building block.',
  x=SS, lab='signal:signal_builder')
n('dirac_delta','Impulse and step functions','concept','signals_basics integral_ftc','The idealised spike and switch.',
  'The impulse is an infinitely narrow spike with unit area; the step switches from 0 to 1. They probe systems.',
  'Any signal is a sum of shifted impulses; the step is the integral of the impulse.',
  '∫δ(t)f(t)dt=f(0); δ is a distribution; unit step u(t)=∫δ.',
  f='∫ δ(t) f(t) dt = f(0)', lab='signal:signal_builder')
n('lti_properties','System properties: linearity, time invariance, causality, stability','concept','signals_basics','What makes a system tractable.',
  'Linear: scaling and addition pass through. Time-invariant: delaying the input delays the output. Causal: no response before input. Stable: bounded input gives bounded output.',
  'LTI systems are fully described by their impulse response and respond to sinusoids with sinusoids of the same frequency.',
  'BIBO stability ⇔ ∫|h|dt<∞; memoryless vs dynamic; invertibility; non-linear systems (saturation, hysteresis) need other tools.',
  lab='signal:system_properties')
n('convolution','Convolution and impulse response','technique','lti_properties dirac_delta','Output = input smeared by the system’s response.',
  'To get the output of an LTI system, flip the impulse response, slide it across the input and add up overlaps.',
  'Convolution in time = multiplication in frequency, which is why transforms are useful.',
  'y(t)=∫x(τ)h(t−τ)dτ; commutative, associative, distributive; discrete y[n]=Σx[k]h[n−k].',
  f='y(t) = ∫ x(τ) h(t−τ) dτ', lab='signal:convolution_sketch')
n('fourier_series_ee','Fourier series','technique','convolution fourier_math','Periodic signals as sums of harmonics.',
  'A repeating waveform is a sum of a fundamental and its multiples; square waves need odd harmonics.',
  'The coefficients show how much of each harmonic is present; power splits across them (Parseval).',
  'x(t)=Σcₖe^{jkω₀t}, cₖ=(1/T)∫x e^{−jkω₀t}dt; Gibbs phenomenon; square wave cₖ ∝ 1/k for odd k.',
  f='cₖ = (1/T) ∫ x(t) e^{−jkω₀t} dt', lab='signal:fourier_synth', kn='fourier')
n('fourier_transform_ee','Fourier transform','technique','fourier_series_ee','Spectra of non-repeating signals.',
  'The Fourier transform shows which frequencies a signal contains; narrow in time means wide in frequency.',
  'Properties: linearity, shifting, scaling, convolution-multiplication duality, Parseval.',
  'X(ω)=∫x(t)e^{−jωt}dt; rect↔sinc; Gaussian↔Gaussian (uncertainty); F{δ}=1.',
  f='X(ω) = ∫ x(t) e^{−jωt} dt', lab='signal:spectrum_analyzer', kn='fourier')
n('laplace_signals','Laplace transform for systems','technique','laplace_math convolution','Transfer functions of LTI systems.',
  'The Laplace transform lets you describe a system by a transfer function H(s) and find its response to anything by multiplication.',
  'Region of convergence decides causality and stability; poles in the left half-plane mean stable.',
  'Bilateral vs unilateral; Y(s)=H(s)X(s); relationship to Fourier: s=jω if the imaginary axis lies in the ROC.',
  f='Y(s) = H(s) X(s)', lab='control:pole_zero_map')
n('z_transform','z-transform','technique','laplace_signals sequences_series','Laplace’s discrete-time sibling.',
  'The z-transform turns difference equations (the discrete cousins of differential equations) into algebra.',
  'The unit circle |z|=1 plays the role of the jω axis; poles inside the circle mean stability.',
  'X(z)=Σx[n]z⁻ⁿ; delay ↔ z⁻¹; H(z) from difference equation; mapping z=e^{sT}.',
  f='X(z) = Σ x[n] z⁻ⁿ', lab='signal:z_plane')
n('sampling_theorem','Sampling theorem (Nyquist)','law','fourier_transform_ee','Sample at least twice the highest frequency.',
  'To capture a signal perfectly from samples, you must sample at more than twice its highest frequency.',
  'Ideal reconstruction uses sinc interpolation; practical systems oversample and use filters.',
  'Sampling multiplies by an impulse train, replicating the spectrum every f_s; bandlimited signals avoid overlap; Nyquist–Shannon.',
  f='f_s > 2 f_max', lab='signal:sampling_aliasing', kn='fourier information_theory')
n('aliasing','Aliasing','concept','sampling_theorem','When fast signals masquerade as slow ones.',
  'If you sample too slowly, high frequencies fold back and look like lower ones, like wagon wheels appearing to spin backwards.',
  'An anti-aliasing low-pass filter before the ADC prevents it; once aliased, it cannot be undone.',
  'f_alias=|f−k f_s|; undersampling deliberately mixes a band down in RF receivers.',
  f='f_alias = |f − k f_s|', lab='signal:sampling_aliasing')
n('spectra_filtering','Spectra and filtering','concept','fourier_transform_ee','Keeping some frequencies, dropping others.',
  'A spectrum plots strength vs frequency. Filtering multiplies the spectrum by the filter’s frequency response.',
  'Ideal filters have brick-wall shape but infinite sinc impulse responses; real ones compromise.',
  'Y(f)=H(f)X(f); group delay −dφ/dω; linear-phase FIR; spectral leakage and windows; PSD of random signals.',
  f='Y(f) = H(f) X(f)', lab='signal:spectrum_analyzer')
n('modulation_basics','Modulation basics','concept','fourier_transform_ee','Shifting signals to carriers.',
  'Multiplying a signal by a carrier shifts its spectrum to the carrier frequency, so it can be transmitted by antenna.',
  'AM, FM and PM vary carrier amplitude, frequency or phase; mixers do the multiplication.',
  'x(t)cos ω_c t ↔ ½[X(ω−ω_c)+X(ω+ω_c)]; demodulation by product detector + low-pass; bandwidth rules.',
  f='x(t)cos ω_c t', lab='signal:am_fm_demo')

save('ee_signals')
area('ee_dsp')
n('dtft_dft','DTFT and DFT','technique','z_transform sampling_theorem','Spectra of sampled signals.',
  'The DFT turns N samples into N frequency values; it is what computers calculate.',
  'DTFT is continuous in frequency and periodic; DFT samples it at N points. Circular convolution.',
  'X[k]=Σx[n]e^{−j2πkn/N}; zero-padding interpolates the spectrum, it does not improve resolution; leakage unless periods fit exactly.',
  f='X[k] = Σ x[n] e^{−j2πkn/N}', lab='signal:dft_explorer')
n('fft_algorithm','Fast Fourier transform','technique','dtft_dft algorithms_complexity','DFT in N log N operations.',
  'The FFT computes the DFT far faster by reusing partial results.',
  'Radix-2 butterflies halve the problem repeatedly; makes real-time spectrum analysis and OFDM feasible.',
  'Cooley–Tukey: O(N log₂N) vs O(N²); N=1024 saves ~100×; real-FFT tricks; Bluestein for prime N.',
  f='O(N log N)', lab='signal:dft_explorer')
n('fir_filters','FIR filter design','technique','dtft_dft convolution','Finite impulse response filters.',
  'FIR filters average recent samples with chosen weights; always stable and can have perfect linear phase.',
  'Windowing a sinc impulse response, or Parks–McClellan optimisation, designs them.',
  'y[n]=Σb_k x[n−k]; linear phase if symmetric; order estimate N≈(−20log√(δ₁δ₂)−13)/(14.6Δf).',
  f='y[n] = Σ b_k x[n−k]', lab='signal:filter_designer')
n('iir_filters','IIR filter design','technique','z_transform lti_properties','Filters with feedback.',
  'IIR filters reuse past outputs, giving sharp responses with few coefficients but risking instability.',
  'Design by transforming analog prototypes (bilinear transform) such as Butterworth or Chebyshev.',
  'Bilinear s=(2/T)(1−z⁻¹)/(1+z⁻¹) warps frequency; biquad cascades reduce coefficient sensitivity; limit cycles.',
  f='s = (2/T)(1−z⁻¹)/(1+z⁻¹)', lab='signal:filter_designer')
n('windowing_methods','Windowing','technique','fir_filters','Taming spectral leakage.',
  'Cutting a signal abruptly smears its spectrum; tapering with a window reduces the smear.',
  'Hann, Hamming, Blackman trade main-lobe width against side-lobe level.',
  'Rectangular −13 dB sidelobes; Hamming −43 dB; Kaiser window β controls the trade-off.',
  lab='signal:filter_designer')
n('multirate_processing','Multirate processing','technique','fir_filters','Changing the sampling rate.',
  'Decimation lowers the sample rate (after filtering); interpolation raises it (inserting zeros then filtering).',
  'Saves computation when only a narrow band matters; sample-rate converters in audio.',
  'Polyphase structures; CIC filters in sigma-delta and digital radios; noble identities.',
  lab='signal:filter_designer')
n('quantization_effects','Quantization effects','concept','adc_basics dtft_dft','The cost of finite word length.',
  'Rounding to a finite number of bits adds noise and, in filters, can produce small oscillations.',
  'Quantisation noise power Δ²/12; coefficient rounding shifts poles.',
  'SQNR=6.02B+1.76 dB; dither linearises; noise shaping in sigma-delta; overflow handling (saturate vs wrap).',
  f='σ² = Δ²/12', lab='signal:adc_quantizer')
n('fixed_vs_float','Fixed- vs floating-point arithmetic','concept','number_systems quantization_effects','Cheap vs flexible number formats.',
  'Fixed-point is cheaper and faster on small chips; floating-point handles a huge range automatically.',
  'Choose Q-format and scaling to avoid overflow; floats cost more power.',
  'IEEE-754 binary32: 24-bit significand, 8-bit exponent; bfloat16 and int8 for ML accelerators.')
n('dsp_applications','DSP applications: audio, image, radar, communications','concept','fft_algorithm fir_filters','Where DSP is used.',
  'DSP powers audio equalisers, noise cancelling, camera pipelines, radar signal processing and software radios.',
  'Typical blocks: FIR/IIR filters, FFT, correlators, adaptive filters (LMS).',
  'Matched filter maximises SNR; pulse compression; adaptive beamforming; DSP slices in FPGAs, SIMD in CPUs.',
  x='The Scientist and Engineer’s Guide to DSP|https://www.dspguide.com/', lab='signal:audio_equalizer')
save('ee_dsp')
