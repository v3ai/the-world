# The Map of What Humanity Knows (Late 2026): A Drillable Knowledge Blueprint for a "How Things Really Work" World Simulation

No single document can list all scientific knowledge. What it can give is the complete map: a handful of deep theories (the Standard Model plus general relativity, thermodynamics, information theory and evolution by natural selection) from which everyday phenomena emerge through a chain of well-tested "effective theories," one per scale. Your simulation should therefore be a scale-layered knowledge graph of those effective theories, with every node tagged by certainty and linked to the layers above and below, rather than a flat encyclopedia. Most of what learners meet daily is settled to many decimal places. The genuinely open questions sit at the extremes of scale (quantum gravity, dark matter, dark energy, the Hubble tension) and of complexity (origin of life, consciousness, climate tipping points, social science). Several of these moved measurably in 2025–2026.

## TL;DR

- **Structure = a ladder of effective theories.** It runs mathematics → quantum fields → particles → nuclei/atoms → molecules → materials and cells → organisms → ecosystems/Earth system → planets, stars, galaxies and the universe, with information/computation and minds/societies as cross-cutting layers. Each layer is an approximation valid in a regime and derivable in principle, though rarely in practice, from the one below. Model each node with: laws, validity regime, "emerges from"/"explains" links, evidence, a certainty tag and its frontier.
- **The settled core is vast and extremely reliable.** Examples: Maxwell's equations; quantum mechanics (e.g., the Fermilab muon g-2 final result at 127 ppb); thermodynamics; general relativity (the GW250114 black-hole merger confirmed Hawking's area theorem in 2025); the periodic table; plate tectonics; evolution and molecular biology; human-caused climate change. These are engines your simulation can run with confidence.
- **The frontier is concentrated and live.** In 2025–26:
  - The Hubble tension hardened (local 73.50 ± 0.81 km/s/Mpc vs the Planck 2018 early-universe value of 67.4 ± 0.5 km/s/Mpc).
  - DESI hinted at evolving dark energy (2.8–4.2σ).
  - KATRIN bounded the neutrino mass below 0.45 eV.
  - LZ reported one unexplained 248 keV event (only 2.6σ global).
  - Bennu samples held ribose and other RNA ingredients.
  - An adversarial test challenged both leading theories of consciousness.
  - OpenAI made an AI-produced, still-unvalidated claim of blowup for the *forced* Navier–Stokes equations.

---

## Part 0 — Certainty Legend

| Tag | Meaning | Example |
|---|---|---|
| **[C1] Settled** | Tested by many independent methods; can be *extended* but not *replaced* within its domain | Energy conservation, atomic theory, evolution |
| **[C2] Well-supported, being refined** | Framework secure; parameters or mechanisms still measured | ΛCDM, climate sensitivity value, neutrino parameters |
| **[C3] Actively debated** | Several serious hypotheses; evidence real but inconclusive | Dark matter identity, Moon's isotopes, AMOC timing, consciousness theories |
| **[C4] Speculative** | Motivated mathematically or conceptually; little direct test | String landscape, multiverse, most QM interpretations |

"Settled" does not mean "final." Newtonian mechanics is C1 *within its regime* (v ≪ c, scales ≫ atoms, weak gravity). Every node needs a "regime of validity" field. When learners push past that boundary, the simulation hands them to the next deeper theory, which is how "going deeper" should work.

---

## Part 1 — Architecture

### 1.1 The Scale Ladder

| Level | Scale | Governing effective theory | Emerges from | Explains |
|---|---|---|---|---|
| 0 | — | Mathematics, logic, probability | axioms | Language of all layers |
| 1 | <10⁻¹⁸ m | Standard Model + GR (+ unknown quantum gravity at ~10⁻³⁵ m) | ? | Particles, forces |
| 2 | 10⁻¹⁵ m | Nuclear physics (QCD) | Quarks, gluons | Nuclei, fusion, elements |
| 3 | 10⁻¹⁰ m | Atomic physics (QED) | Nuclei + electrons | Periodic table, spectra |
| 4 | 10⁻¹⁰–10⁻⁸ m | Chemistry | QM + stat mech | Molecules, reactions |
| 5 | 10⁻⁹–10⁻⁶ m | Biochemistry; condensed matter | Chemistry | Proteins, DNA; solids |
| 6 | 10⁻⁶–10⁻⁴ m | Cell biology; microstructure | Biochemistry | Cells; material strength |
| 7 | 10⁻³–10 m | Physiology, neuroscience, engineering | Cells; materials | Organisms, machines |
| 8 | 10–10⁷ m | Ecology, Earth system, societies | Organisms + physics | Ecosystems, climate, economies |
| 9 | 10⁷–10¹³ m | Planetary science | Gravity + geochemistry | Planets, moons |
| 10 | 10⁹–10²¹ m | Stellar & galactic astrophysics | Nuclear + plasma + gravity | Stars, galaxies |
| 11 | 10²²–10²⁶ m | Cosmology (ΛCDM) | GR + particle physics | Cosmic history |
| ✕ | all | Thermodynamics, information, complexity, evolution | — | Cross-cutting principles |

**Key insight:** chemistry does not need quarks, and climate models do not need QCD. Each level is derivable in principle, but almost none can be computed that way (even the proton's mass needs supercomputer lattice QCD). So the simulation should **switch models by scale** and, on zoom, show the *bridge principle*:
- statistical mechanics (micro → macro);
- Born–Oppenheimer (quantum electrons → molecular structure);
- continuum limits (molecules → fluids and solids);
- natural selection (chemistry → adapted life);
- renormalization/mean-field ideas (many-body → emergent laws).

### 1.2 Node Schema
Each node should have: phenomenon; mechanism (one level down); laws with validity regime; key constants with uncertainty; "emerges from"/"explains" edges; learning prerequisites; key evidence; certainty tag; frontier (with last-updated date); deep sources.

---

## Part 2 — The Knowledge Tree

### LEVEL 0 — Mathematics, Logic, Probability

**Core (C1):**
- Logic and set theory (ZFC). Gödel's incompleteness theorems: any consistent system rich enough for arithmetic has unprovable truths.
- Calculus and differential equations, the native language of physical law (ODEs for particles, PDEs for fields and fluids).
- Linear algebra and Hilbert spaces (quantum mechanics); differential geometry (general relativity).
- Group theory and symmetry. **Noether's theorem** says each continuous symmetry gives a conservation law (time → energy, space → momentum, rotation → angular momentum). Gauge groups SU(3)×SU(2)×U(1) define the forces.
- Probability and statistics: Bayes, the central limit theorem; "5σ" is the particle-physics discovery convention.
- Dynamical systems: bifurcations, chaos, attractors.

**Frontier:**
- **Navier–Stokes existence and smoothness (Clay Millennium Problem).**
  - On 8 September 2026 OpenAI announced a 166-page, Lean-formalized proof of finite-time blowup for the *forced* 3D equations (Clay statements C/D), produced by about 10,000 coordinating AI agents in 88 hours.
  - **Status [C3]: claimed, not validated.** Terence Tao endorsed calling it "a formally verified proposed solution awaiting expert digestion and community validation." The Clay Institute says evaluation will be "deliberately unhurried" and requires peer-reviewed publication.
  - Constantin, Ignatova and Vicol showed that for this construction the force can be neither absent near the singularity nor real-analytic. Commentators read this as a sign the method cannot reach the *unforced* problem (statements A/B), which **remains open**.
  - A Communications Physics commentary: "If the proof stands, it settles one of the forms of the Clay Millennium problem… For physics, it changes much less."
- **Yang–Mills mass gap (Clay):** physicists are confident it is true from experiment and lattice QCD, but there is no proof.
- **Riemann hypothesis; P vs NP** (limits of efficient computation, which bear on what any simulation can compute); rigorous construction of interacting 4D QFTs.
- **AI-driven mathematics:** researchers debate whether a Lean check guarantees that the formal statement matches the intended claim.

---

### LEVEL 1 — Fundamental Physics

#### 1A. Classical Mechanics [C1 within regime]
- **Laws and conservation:** Newton's laws (F = ma); gravitation F = Gm₁m₂/r²; conservation of energy, momentum and angular momentum. Lagrangian/Hamiltonian mechanics (least action) is the bridge to quantum theory.
- **Explains:** orbits (Kepler), machines, waves, structures.
- **Breaks down** → special relativity (fast), QM (small), GR (strong gravity).

#### 1B. Thermodynamics & Statistical Mechanics [C1]
- **Laws:**
  - (1) ΔU = Q − W.
  - (2) Entropy of an isolated system never decreases. This sets the arrow of time and the Carnot limit η = 1 − T_c/T_h.
  - (3) Absolute zero is unattainable.
- **Statistical mechanics:** S = k_B ln W; Boltzmann distribution p ∝ e^(−E/kT). It is the *main* micro→macro bridge: why heat flows, why reactions equilibrate, why engines have limits, why life must consume free energy.
- **Frontier:** a general theory of far-from-equilibrium and living/active matter [C3]; why the early universe had such low entropy [C3/C4].

#### 1C. Electromagnetism & Optics [C1]
- **Laws:** Maxwell's equations plus the Lorentz force F = q(E + v×B). Light is an EM wave, c = 299,792,458 m/s (exact by definition). Optics covers reflection, refraction, diffraction, interference and polarization; photons carry E = hf.
- **Explains:** circuits (V = IR), motors and generators (Faraday induction), radio, color, and all chemical forces (chemistry = EM + QM).

#### 1D. Relativity
- **Special relativity [C1]:** invariant c leads to time dilation and E = mc².
- **General relativity [C1 in tested regimes]:** gravity is spacetime curvature, G_μν + Λg_μν = (8πG/c⁴)T_μν. Confirmations:
  - Mercury's orbit, light bending, GPS corrections.
  - Gravitational waves (2015) and black-hole images (2019).
  - **GW250114** (2025), the clearest gravitational-wave signal yet (signal-to-noise about 80). It confirmed Hawking's area theorem "to high credibility," with a ringdown consistent with a Kerr black hole.
- **Frontier:** singularities signal GR's breakdown; it is incompatible with QM (see 1G).

#### 1E. Quantum Mechanics [C1 predictions; C3/C4 interpretation]
- **Core:**
  - Schrödinger equation iħ∂ψ/∂t = Ĥψ; Born rule.
  - Superposition; uncertainty ΔxΔp ≥ ħ/2.
  - Spin and Pauli exclusion, which builds the periodic table.
  - Entanglement: loophole-free Bell tests (2015; Nobel 2022) excluded local hidden variables.
  - Tunneling (powers the Sun).
- **Explains:** atoms, chemistry, solids, lasers, semiconductors, MRI.
- **Measurement problem [C3/C4]:** Copenhagen, Many-Worlds, Bohmian pilot wave, objective collapse (GRW, Penrose–Diósi; testable and being constrained), QBism/relational. All match tested predictions. Teach the formalism as C1 and the interpretations as an open debate.
- **Quantum computing [C2]:** Google's Willow achieved surface-code error correction below threshold. Each step up in code size (3×3 → 5×5 → 7×7) cut logical errors by a factor of Λ = 2.14 ± 0.02 (Google Quantum AI, Nature, 2025), reaching 0.143% error per cycle on a 101-qubit distance-7 code, still far above the ~10⁻⁶ needed for large algorithms.

#### 1F. Quantum Field Theory & the Standard Model [C2: superbly tested, known incomplete]
- **Content:** 12 fermions in three generations; photon, W/Z, 8 gluons; the Higgs boson (2012, ~125 GeV); gauge group SU(3)×SU(2)×U(1). Gravity is excluded.
- **Precision:** QED predicts the electron's magnetic moment to ~1 part in 10¹². Fermilab's final **muon g-2** (127 ppb, 2025) *agrees* with the revised 2025 lattice-based Standard Model prediction, so the famous anomaly no longer signals new physics; theory-method mismatches remain.
- **QCD:** confinement and asymptotic freedom. ~99% of visible mass is QCD binding energy, not Higgs.
- **Known gaps:**
  - **Neutrino mass.**
    - Oscillations prove it exists.
    - KATRIN (Science, 2025) set m_ν < 0.45 eV (90% CL).
    - JUNO's first 59.1 days (Nov 2025) gave sin²θ₁₂ = 0.3092 ± 0.0087 and Δm²₂₁ = (7.50 ± 0.12)×10⁻⁵ eV², 1.6× better than all prior experiments combined. Its main goal is the mass ordering.
    - Open: absolute scale; Dirac vs Majorana nature.
  - **Matter–antimatter asymmetry.** Standard-Model CP violation is far too small (LHCb observed it in baryons in 2025). Leading candidates are leptogenesis and electroweak baryogenesis [C3].
  - **Other open puzzles:** strong CP problem (axions, also a dark-matter candidate) [C3]; Higgs hierarchy/naturalness (no supersymmetry found at the LHC) [C3/C4]; why three generations.

#### 1G. Quantum Gravity [C4]
- GR and QFT clash at the Planck scale (~10⁻³⁵ m).
- **Programs:** string/M-theory (holography, AdS/CFT, spacetime from entanglement), loop quantum gravity, asymptotic safety, causal sets.
- **Black-hole information paradox:** the 2019–20 "island"/Page-curve calculations suggest information survives (majority view) [C3].
- **Tests:** tabletop gravity-induced entanglement, primordial gravitational waves, precision ringdowns.

#### 1H. Nuclear Physics [C1/C2]
- The binding-energy curve (iron peak) explains why both fusion and fission release energy. Decay follows N = N₀e^(−λt), the basis of radiometric dating.
- **Frontier:** the neutron-lifetime discrepancy between beam and bottle methods (~9 s) [C3]; the neutron-star equation of state.

#### 1I. Condensed Matter [C1 core; C3 frontier]
- **Core:** band theory (metals, insulators, semiconductors), phonons, magnetism, BCS superconductivity, phase transitions and broken symmetry, topological phases. Underlies all electronics.
- **Frontier:** cuprate high-Tc mechanism; room-temperature superconductivity claims (e.g., LK-99, 2023, failed replication); strange metals; moiré materials.

#### 1J. Fluids, Chaos & Complexity
- **Fluids:** Navier–Stokes equations, Bernoulli, Reynolds number [C1]; they explain flight, weather, blood flow. Turbulence has no first-principles theory beyond Kolmogorov's E(k) ∝ k⁻⁵ᐟ³ scaling [C3].
- **Chaos and complexity:** chaos (Lorenz) limits weather predictability to ~2 weeks; fractals, self-organization, networks, criticality [C1 concepts]. No general theory of complexity exists, and early-warning signals for tipping points are contested [C3].

---

### LEVEL 2–3 — Atoms and Light [C1]
- Quantum numbers + Pauli principle → electron shells → **the periodic table**.
- Discrete spectral lines tell us what stars are made of. Light–matter interactions include absorption, emission, stimulated emission (lasers) and scattering (blue sky).
- **Frontier:** optical clocks (~10⁻¹⁸) test whether constants vary and probe dark matter. The proton-radius puzzle is largely resolved [C2]. ALPHA-g (2023) found antihydrogen falls down.

---

### LEVEL 4 — Chemistry [C1]
- **Bonding:** ionic, covalent, metallic, hydrogen, van der Waals; VSEPR shapes; molecular orbital theory; electronegativity.
- **Periodic trends:** radius, ionization energy, reactivity, from effective nuclear charge.
- **Thermochemistry:** **ΔG = ΔH − TΔS**; spontaneous if ΔG < 0; K = e^(−ΔG°/RT).
- **Kinetics:** **Arrhenius** k = Ae^(−Ea/RT); catalysts lower activation energy.
- **Equilibrium & electrochemistry:** Le Chatelier; acid–base (pH, pKa); redox and the Nernst equation (batteries).
- **Branches:** organic (functional groups, mechanisms, chirality), inorganic, physical, analytical, polymer.
- **Computational chemistry:** DFT, molecular dynamics [C2: known accuracy limits].
- **Frontier:** strongly correlated quantum chemistry (a quantum-computing target); AI-predicted materials outpacing validation; nitrogen-fixation catalysts; origin of biological homochirality [C3].
- **Materials science [C1/C2]:** structure → properties (lattices, dislocations, composites, doping and p–n junctions). Frontier: 2D materials, perovskite solar-cell stability, solid-state batteries.

---

### LEVEL 9–11 — Astronomy, Astrophysics, Cosmology

#### Cosmology [C2 framework; C3 components]
- **ΛCDM:** expansion from a hot dense state ~13.8 billion years ago. Contents: ~5% ordinary matter, ~27% dark matter, ~68% dark energy. Evidence: Hubble expansion, the 2.725 K CMB, Big Bang nucleosynthesis, BAO, large-scale structure.
- **Timeline:**
  1. Inflation (C3), ~10⁻³⁶ s.
  2. Nucleosynthesis at ~3 minutes.
  3. CMB release at ~380,000 years.
  4. First stars at ~100–200 million years.
  5. Reionization by ~1 billion years.
  6. Sun and Earth at ~4.6 billion years ago.
- **Hubble tension [C3].**
  - CMB inference gives 67.4 ± 0.5 km/s/Mpc (Planck 2018 results VI, A&A 641, A6).
  - The H0 Distance Network Collaboration (A&A, April 2026) measured **73.50 ± 0.81 km/s/Mpc**. The authors say it "effectively rules out explanations… that rely on a single overlooked error in local distance measurements."
  - Strong lensing (TDCOSMO-2026) gives 71.1 (+2.4/−2.3), 3.7σ from Planck.
  - Proposed fixes (early dark energy, extra relativistic species) are unconfirmed, and the Freedman/CCHP TRGB ladder finds smaller tension.
- **Dark energy [C3]:** DESI DR2 (March 2025) plus CMB and supernovae prefers *evolving* dark energy at 2.8–4.2σ, depending on the supernova sample, below the 5σ discovery bar. Reanalyses attribute much of the signal to DESI's LRG1–2 tracers, with ~1–2σ from late-time data alone.
- **Dark matter [C2 exists; C3 identity].**
  - Evidence: rotation curves, lensing, the Bullet Cluster, CMB peaks. Candidates: WIMPs, axions, sterile neutrinos, primordial black holes. MOND fits galaxies but struggles with clusters and the CMB.
  - LZ set WIMP limits ~5× stricter (2.2×10⁻⁴⁸ cm² at 40 GeV, 2025) and in December 2025 detected boron-8 solar neutrinos, the onset of the "neutrino fog."
  - In September 2026 LZ reported **one nuclear-recoil event at 248 keV** (2.6σ global, 3.4σ max local). Dozens of theory papers followed (e.g., ~1 TeV higgsino), but **one event at 2.6σ is not a discovery** [C3/C4].
- **Inflation [C3]:** explains flatness and the near-scale-invariant fluctuations; primordial B-modes are not yet detected. The multiverse is [C4].
- **Neutrino mass from cosmology:** DESI+CMB push the mass sum toward or below the oscillation minimum, a tension eased if dark energy evolves.

#### Stars, Compact Objects, Galaxies
- **Stars [C1]:** hydrostatic balance; pp-chain and CNO fusion (~0.7% of hydrogen's mass converted). Mass decides the fate: white dwarf, or supernova → neutron star/black hole.
- **Element origins [C1/C3]:** Big Bang made H/He/Li; stars make elements up to iron; neutron-star mergers (GW170817 kilonova) and supernovae make heavier ones. Merger vs collapsar shares of r-process elements are debated.
- **Black holes [C1 existence]:** Sgr A* is ~4 million solar masses; Hawking radiation remains unobserved.
- **Little red dots [C3]:** compact red JWST objects bearing on how supermassive black holes grew so fast.
  - A January 2026 *Nature* paper (Rusakov et al.) reads them as young black holes in dense ionized gas cocoons, ~100× lighter than first estimated.
  - Others propose "black hole stars"; dense star clusters remain an alternative.
- **Galaxies [C2]:** form in dark-matter halos and merge hierarchically along a cosmic web. Open: cusp–core, satellite counts, surprisingly mature early galaxies.

#### Planetary Science & Exoplanets
- **Formation [C1/C2]:** solar nebula → disk → planetesimals → planets; giant-planet migration (Nice/Grand Tack, C3).
- **Exoplanets:** NASA's official count passed 6,000 in September 2025 (6,007 as of 17 September 2025, per the NASA Exoplanet Science Institute), with more than 8,000 additional candidates awaiting confirmation. Super-Earths and mini-Neptunes are the commonest types yet absent here; JWST is probing atmospheres.
- **Origin of the Moon [C3].**
  - Giant impact by Theia is consensus in outline.
  - The "isotopic crisis": lunar O, Ti and other isotopes nearly match Earth's.
  - Competing fixes: a **synestia** (vaporized Earth–Moon donut; Lock & Stewart), favored by recent Ca/Mg isotope work; an Earth-like impactor; hit-and-run; post-impact equilibration.
- **Origin of Earth's water [C3]:** carbonaceous-chondrite delivery (D/H matches), indigenous hydrogen in enstatite-like building blocks, or nebular capture. Comets are minor (67P's D/H is ~3× Earth's). Likely a mix.
- **Life elsewhere [C3/C4]:** phosphine on Venus and DMS on K2-18b remain unconfirmed.

---

### LEVEL 8a — Earth Sciences

#### Geology & Plate Tectonics [C1]
- **Structure and tectonics:** solid inner core, liquid outer core (geodynamo), convecting mantle, crust (seismology). ~15 major plates move cm/yr at divergent, convergent and transform boundaries, explaining earthquakes, volcanoes and mountains.
- **Rock cycle and deep time:** igneous → sedimentary → metamorphic. Earth is 4.54 Gyr old (radiometric dating).
- **Frontier:** when plate tectonics began (~4.2–2.5 Ga) [C3]; mantle plumes; earthquakes are only probabilistically forecastable; inner-core dynamics.

#### Oceanography [C1/C2]
- **Core:** thermohaline and wind-driven circulation; tides. The ocean absorbs ~90% of excess heat; surface pH has dropped ~0.1 since preindustrial.
- **AMOC stability [C3].**
  - A 2025 *JGR Oceans* study (van Westen, Vanderborght & Dijkstra) found 16 of 25 CMIP6 models (64%) show a tipping-indicator sign change before 2100 under intermediate emissions.
  - IPCC AR6 judged (medium confidence) abrupt collapse before 2100 unlikely.
  - A 2025 UW–Madison study warns that statistical "critical slowing down" signals can raise false alarms.
  - Timing and reversibility are open.

#### Atmosphere, Weather & Climate
- **Atmosphere and weather [C1 physics]:** the greenhouse effect (Fourier, Tyndall, Arrhenius); Coriolis; Hadley cells; jet streams; cloud microphysics. Forecast skill reaches ~10 days, and AI models such as GraphCast now rival physics models [C2].
- **Climate [C1]:** human influence has unequivocally warmed the planet (IPCC AR6). Per NOAA's Global Monitoring Laboratory, atmospheric CO₂ is now about 50% above preindustrial (~280 ppm): the 2025 Mauna Loa annual mean was 427.35 ppm (global mean 425.62 ppm), with a record monthly 432.34 ppm in May 2026.
- **Climate sensitivity [C2]:** AR6 best estimate 3°C per CO₂ doubling; likely 2.5–4°C; very likely 2–5°C. This halved the old 1.5–4.5°C likely range. Cloud feedback is the main uncertainty.
- **Frontier [C3]:** tipping elements (AMOC, ice sheets, Amazon, permafrost, reefs); the eastern-Pacific "pattern effect"; aerosol forcing; recent warming acceleration.
- **Hydrology and cycles [C1/C2]:** water, carbon, nitrogen and phosphorus cycles link geology to life. Haber–Bosch now fixes about as much nitrogen as all natural land processes.

---

### LEVEL 5–8b — Biology

#### Origin of Life [C3: open but constrained]
- **Constraints:**
  - Life's earliest widely accepted traces date to ~3.5–3.7 Ga.
  - Moody et al. (*Nature Ecology & Evolution*, 2024) dated **LUCA to ~4.2 billion years ago**. They reconstructed it as an anaerobic acetogen with ~2,500 genes and an early CRISPR-like antiviral system, living within an ecosystem. If right, life arose fast.
- **Hypotheses:**
  - RNA world (ribozymes exist; the ribosome core is RNA) [C2 as a stage].
  - Alkaline hydrothermal vents (natural proton gradients).
  - Wet–dry cycling in surface ponds and hot springs.
  - Sutherland's UV-driven cyanosulfidic chemistry.
  - Panspermia (relocates the problem) [C4].
- **Bennu (2025):** 14 of 20 protein amino acids and all five nucleobases, plus **ribose and glucose** (*Nature Geoscience*, December 2025) but no deoxyribose. So every RNA component existed in early solar-system material. This is consistent with an RNA-first view but is chemistry, not life.
- **Open:** the start of replication and of the genetic code; homochirality (Bennu amino acids are racemic); protocells.

#### Molecular Biology & Biochemistry [C1]
- **Molecules and the central dogma:** proteins (20 amino acids, four structural levels), DNA/RNA, lipids, carbohydrates. DNA → RNA → protein via a 64-codon code, with exceptions.
- **Enzymes:** Michaelis–Menten kinetics, allostery.
- **Metabolism:** ATP; glycolysis → Krebs cycle → oxidative phosphorylation (chemiosmosis); photosynthesis.
- **Protein structure [C2].** AlphaFold 2/3 (Nobel Prize in Chemistry 2024, with Baker) predicts static structures near experimental accuracy. Documented limits:
  - dynamics and multiple conformations;
  - disordered regions;
  - ligand complexes with large (>5 Å) conformational change;
  - binding affinity;
  - weaker performance on post-training-cutoff structures, suggesting partial memorization.

  First-principles folding is understood in principle (funnel landscapes) but not solved.

#### Genetics & Genomics [C1 core]
- **Core:** Mendelian → chromosomal → molecular inheritance; population genetics (drift, selection). The human genome is ~3.1 billion bp with ~20,000 protein-coding genes; the gapless sequence was finished in 2022.
- **Regulation and tools:** enhancers, chromatin, epigenetics. CRISPR (Nobel 2020) produced the first approved therapy in 2023 (sickle-cell disease).
- **Frontier:** polygenic traits and "missing heritability"; the genotype → phenotype map; non-coding function; human transgenerational epigenetics [C3].

#### Cell Biology [C1]
- **Core:** cell theory; prokaryote vs eukaryote; organelles; membranes and transport; cytoskeleton; mitosis and meiosis; signaling; apoptosis. Endosymbiotic origin of mitochondria and chloroplasts is C1.
- **Frontier:** eukaryogenesis from Asgard archaea + a bacterium [C3]; biomolecular condensates [C2]; whole-cell simulation (only minimal cells so far).

#### Evolution [C1]
- **Mechanisms and evidence:** common descent; selection, drift, gene flow, mutation, sexual selection, horizontal transfer. Evidence comes from fossils, phylogenetics and observed evolution (antibiotic resistance; Lenski's *E. coli*).
- **Major transitions:** eukaryotes (~2 Ga), multicellularity, Cambrian explosion (~540 Ma), five mass extinctions (end-Cretaceous impact, 66 Ma).
- **Humans [C2]:** split from chimpanzee lineages ~6–7 Ma; *H. sapiens* in Africa ~300,000 years ago; interbred with Neanderthals and Denisovans.
- **Frontier:** Extended Evolutionary Synthesis debate [C3]; predictability of evolution; origin of sex.

#### Diversity of Life, Microbes, Development [C1/C2]
- **Tree of life and microbes:** three domains, though some phylogenies nest eukaryotes within archaea [C3]. ~2 million species are described, with estimates of the true total from ~8 million to >1 trillion [C3]. Microbes drive biogeochemical cycles; the microbiome's causal health roles are C3.
- **Development:** gastrulation, morphogen gradients, Hox genes, stem cells, induced pluripotency (Nobel 2012). Frontier: how genomes encode 3D form; regeneration; organoids; whether aging can be substantially slowed [C3].

#### Physiology & Anatomy [C1]
- **Organ systems:** nervous, cardiovascular (~5 L/min resting output), respiratory, digestive, renal, endocrine, musculoskeletal, integumentary, reproductive, immune.
- **Unifying principle:** homeostasis via negative feedback.

#### Immunology [C1 core]
- **Innate and adaptive immunity:** innate (barriers, phagocytes, inflammation) and adaptive (B/T cells; V(D)J recombination giving ~10¹⁵ possible receptors; memory → vaccines).
- **Frontier:** autoimmunity triggers; immunotherapy (checkpoints, CAR-T); trained innate immunity.

#### Neuroscience [C1 cellular; C3 cognition/consciousness]
- **Cellular and systems core:** action potentials (Hodgkin–Huxley); synapses; plasticity (LTP). ~86 billion neurons, ~10¹⁴ synapses.
- **Connectomics:** whole fruit-fly connectome (139,255 neurons and ~54.5 million synapses; FlyWire Consortium, Dorkenwald et al., *Nature* 634, October 2024); a cubic millimeter of mouse cortex (2025).
- **Frontier:** neural coding; predictive processing/free-energy principle [C3]; psychiatric mechanisms; sleep's functions.
- **Consciousness [C3/C4].** The 2025 COGITATE adversarial collaboration (*Nature* 642) pre-registered rival IIT and Global Neuronal Workspace predictions. Results "critically challenge key tenets of both": IIT's sustained posterior synchronization was absent, and GNWT's offset "ignition" was largely absent. There is no consensus theory, and the "hard problem" remains open.

#### Ecology & Biosphere [C1 principles; C3 prediction]
- **Principles:** ~10% energy transfer between trophic levels; nutrient cycles; logistic and Lotka–Volterra dynamics; niches; succession; island biogeography.
- **Life reshaping Earth:** the Great Oxidation Event (~2.4 Ga) is the prime example.
- **Frontier:** predicting ecosystem response to warming and to extinction rates far above background; ecological tipping points.

---

### LEVEL 7–8c — Mind, Medicine, Society
- **Cognitive science and psychology [C1–C3]:**
  - Robust: constructive perception; working memory ~4 chunks; conditioning; dopamine as reward-prediction error; heuristics and biases; trait heritability.
  - The **replication crisis** undercut many social-psychology effects (ego depletion, power posing, some priming), so tag findings individually.
- **Medicine [C1 core]:**
  - Germ theory → antibiotics, vaccines, sanitation (the largest life-expectancy gains); pharmacology; cancer as accumulated somatic mutation; RCT evidence hierarchy.
  - Frontier: antimicrobial resistance; Alzheimer's causation (amyloid antibodies show modest effects) [C3]; gene and mRNA therapies.
- **Economics and social systems:**
  - Well established [C2]: supply/demand, opportunity cost, comparative advantage, incentives, game theory (Nash; evolution of cooperation), externalities and public goods, behavioral biases.
  - Debated [C3]: macro causation (policy effects, growth, inequality).

---

### LEVEL ✕ — Information, Computation, AI
- **Information theory [C1]:** Shannon entropy H = −Σ p log₂ p; capacity C = B log₂(1 + S/N).
- **Landauer's principle:** erasing a bit costs ≥ k_BT ln 2 (~3×10⁻²¹ J at room temperature). Information is physical.
- **Computation [C1]:** Church–Turing; the halting problem; complexity classes (P, NP, BQP); digital logic from transistors.
- **Quantum computing [C2]:** Shor and Grover algorithms; below-threshold error correction achieved; no useful fault-tolerant machine yet.
- **AI [C2 mechanics; C3 understanding]:**
  - Neural networks trained by backpropagation; transformers (2017) → large language models; empirical scaling laws; reinforcement learning.
  - Now part of how science works (proteins, weather, materials, claimed mathematics).
  - Frontier: why networks generalize; interpretability; verifying AI-generated science; alignment; whether AI could be conscious (no test exists).

---

### LEVEL 7 — Applied Science & Everyday Technology (all C1 principles)

| Technology | Core principle | Links to |
|---|---|---|
| Power grid | Faraday induction; transformers; high-voltage transmission cuts I²R loss | EM |
| Electronics | p–n junctions, MOSFET switches → logic → CPUs | Condensed matter |
| Engines | Carnot/Rankine/Otto cycles | Thermodynamics |
| Solar cells | Band gap; Shockley–Queisser ~33% limit | QM, materials |
| Batteries | Redox; Li-ion intercalation | Chemistry |
| Nuclear | Fission; fusion ignition at NIF (2022), no power plant yet [C3] | Nuclear |
| Flight | Lift from flow turning (Bernoulli + Newton) | Fluids |
| Communications | EM modulation; Shannon capacity; fiber total internal reflection | EM, information |
| Medical imaging | X-ray, CT, MRI (nuclear spin), PET (antimatter) | Physics + physiology |
| GPS | Special + general relativistic clock corrections (~38 μs/day) | Relativity |

---

## Part 3 — Frontier Dashboard (November 2026)

| Question | Best evidence | Positions | Tag |
|---|---|---|---|
| Quantum gravity | No direct data | Strings, LQG, asymptotic safety | C4 |
| QM interpretation | Identical predictions | Copenhagen, Many-Worlds, Bohm, collapse | C3/C4 |
| Dark matter | Gravitational only; LZ 248 keV event (2.6σ) | WIMPs, axions, others | C3 |
| Dark energy | DESI DR2 2.8–4.2σ evolving | Λ vs dynamical | C3 |
| Hubble tension | 73.50 ± 0.81 vs 67.4 ± 0.5 (Planck 2018) | New physics vs systematics | C3 |
| Neutrino mass | <0.45 eV; JUNO precision | Ordering; Dirac/Majorana | C2/C3 |
| Matter–antimatter | SM CP violation too small | Leptogenesis, EW baryogenesis | C3 |
| Muon g-2 | Agrees with 2025 SM | Resolved, theory reconciling | C2 |
| Origin of life | LUCA ~4.2 Ga; Bennu RNA ingredients | RNA world, vents, ponds | C3 |
| Moon's origin | Isotopic twins | Canonical vs synestia | C3 |
| Earth's water | Chondrite-like D/H | Asteroids vs indigenous | C3 |
| Little red dots | Cocooned black holes favored | BH cocoons, BH stars, clusters | C3 |
| Climate sensitivity | 2.5–4°C likely | Cloud feedbacks | C2 |
| AMOC | Models show risk; IPCC: unlikely pre-2100 | Timing debated | C3 |
| Consciousness | COGITATE challenged IIT & GNWT | No consensus | C3/C4 |
| Protein dynamics | Static structures solved | MD + AI hybrids | C2/C3 |
| Navier–Stokes | AI forced-blowup claim | Validation ongoing; unforced open | C3 |

---

## Part 4 — Sources for Filling Deeper Levels

- **Ontologies (node skeletons):** PhySH (APS physics), MSC2020 (mathematics), ChEBI, Gene Ontology, NCBI Taxonomy, Uberon, MeSH, ENVO, Cognitive Atlas, ACM CCS, and Wikidata/OpenAlex as cross-domain glue.
- **Reference data:** Particle Data Group *Review*, CODATA constants, Planck/DESI parameters, IPCC AR6 WGI, NIST databases, PDB/AlphaFold DB, NASA Exoplanet Archive.
- **Textbook spine:** Feynman Lectures; Griffiths; Kittel; Carroll (GR); Atkins; Clayden; Grotzinger & Jordan; Alberts *Molecular Biology of the Cell*; Kandel; Guyton & Hall; Janeway; Cover & Thomas; Sipser; Russell & Norvig; OpenStax (free, introductory).
- **Open-problem lists:** Clay Millennium Problems; Wikipedia's "List of unsolved problems in…" pages (verify primaries); *Science*'s 125 questions; Annual Reviews; Snowmass/European Strategy; Astro2020.

---

## Recommendations (may or may not already be implemented or good ideas you don't nessesarily need to implement or follow)

1. **Build the spine first:** the 12-level ladder plus cross-cutting principles (conservation, thermodynamics, information, evolution).
2. **Make "zoom" mean "change effective theory."** For "why does ice float?" the path runs hydrogen bonding → electronegativity and orbitals → Pauli exclusion → QED, showing at each step what is approximated and why.
3. **Teach the regime boundaries.** "Newton fails here; relativity takes over" shows how science really works.
4. **Show C1–C4 badges and "last updated" dates.** Four headline items here (H0DN, LZ 248 keV, Navier–Stokes, little red dots) date from 2026.
5. **Separate measurement from interpretation.** DESI measures distances, while "evolving dark energy" is an inference; LZ saw one event, while "higgsino" is a hypothesis.
6. **Run real models for C1 domains** (orbits, circuits, equilibria). For C3 domains, let learners toggle competing hypotheses and see which data each explains.
7. **Plan for ~10⁴–10⁵ nodes.** Populate 2–3 levels across all domains first, then deepen along the most-used learner paths.

