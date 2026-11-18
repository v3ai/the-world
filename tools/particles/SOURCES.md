# Sources for data/particles.json and data/nodes/phys_particles.json

Edition used everywhere: **Particle Data Group, Review of Particle Physics, 2026 edition**
(F. Takahashi et al., Int. J. Mod. Phys. A 41, 2630011 (2026); database released 2026-05-30; licence CC BY 4.0).
Fetched 18 Nov 2026.

## How the PDG numbers got into the data (no hand-typed measurements)

1. `https://pdg.lbl.gov/2026/api/pdg-2026.0.sqlite` (the official PDG SQLite database, documented at
   `https://pdg.lbl.gov/2026/api/index.html`) was downloaded into `.devtools/tmp/particles/pdg/` and read by
   `tools/particles/extract_pdg.py`, which writes `tools/particles/pdg_extract.json` (value, the text PDG prints,
   error, scale factor, limit type, confidence level, unit, per PDG identifier).
2. `tools/particles/build_particles.py` looks every measured value up in that file by PDG identifier. Each number in
   `data/particles.json` carries `pdgid` and `edition`. `check_particles.py` asserts each equals the extract.
3. Cross-check: masses and widths in `https://pdg.lbl.gov/2026/mcdata/mass_width_2026.txt` (generated 11 May 2026 from the
   same database) agree with the SQLite values for e, mu, tau, quarks, W, Z, H, p, n and the hadrons used.
   The PDG API page itself warns its data should be checked item by item before use in publications; this is why the
   cross-check against the Monte Carlo mass table was made. Browse any listing at
   `https://pdglive.lbl.gov/Particle.action?node=<id>&init=0`.

PDG identifiers used (all in pdg_extract.json): quark masses Q001M Q002M Q003M Q004M Q005M, top Q007TP (direct), Q007TP2, Q007TP4,
Q007W (width), Q007R6 (Wb ratio); leptons S003M, S004M, S004T, S035M, S035T, S003T (electron stability), neutrinos S066MAE (KATRIN),
S066M2E, S066MNE/MNM/MNT, S067P12 S067P13 S067P23 S067DM3 S067DM1 S067DEL (mixing and mass-squared differences);
bosons S000M S000Q (photon), S043M S043W (W), S044M S044W (Z), S126M S126W (Higgs); branching fractions S043.7 S043.8, S044.7 S044.9 S044.16,
S126.1-.5, S035.1 .2 .12 .16, S008.1, S009.1, S010.1 .2, S018.1 .2, S024.1 .2, B033.1, M070.1-.3, M049.1 .101;
composites S016* (proton), S017* (neutron); hadron masses and lifetimes S008-S014, S018, S024, S031-S033, S041, S042, M049, M070, B033.

## What each quark mass means (PDG notes inside the database, pdgtext)

- u, d, s: "current-quark masses", MS-bar at mu = 2 GeV (PDG quark-mass note).
- c: running mass m_c(m_c) in MS-bar; the same quark has pole mass about 1.65 GeV (PDG text on Q004M).
- b: MS-bar at its own mass.
- t: from direct measurements (event kinematics of t-tbar), LHC and Tevatron average 172.60 +- 0.27 GeV (Q007TP); PDG notes the theory interpretation of this number carries an uncertainty hard to quantify (pdgtext Q007TP).

## Numbers from outside the PDG database (each fetched this session)

| Fact | Source |
|---|---|
| Weak isospin T3 assignments, Q = T3 + Y/2, Higgs doublet, v about 246 GeV, Z couplings | PDG 2026 "Electroweak Model and Constraints on New Physics" (`https://pdg.lbl.gov/2026/reviews/rpp2026-rev-standard-model.pdf`) |
| Cosmological bound on neutrino mass sum < 0.064 eV (95%), other analyses 0.08-0.19 eV | listed in the PDG database under S066MNS (measurement table), which cites DESI DR2 Results II, Phys. Rev. D 112, 083515 (2025) |
| KATRIN bound 0.45 eV and JUNO results | `data/knowledge/frontier.json` entries `katrin_neutrino`, `juno_oscillation`; the same KATRIN number is in the PDG 2026 listing S066MAE |
| Proton momentum shared about 49% quarks and antiquarks, 51% gluons (MS-bar, 2 GeV) | G. Wang, Y.-B. Yang, J. Liang, T. Draper, K.-F. Liu (chiQCD), Phys. Rev. D 106, 014512 (2022), arXiv:2111.09329 (abstract fetched) |
| Proton mass decomposition: quark energy 33(4)(4)%, glue 37(5)(4)%, trace anomaly 23(1)(1)%, sigma terms 9(2)(1)% | Y.-B. Yang et al. (chiQCD), Phys. Rev. Lett. 121, 212001 (2018), arXiv:1808.08677 (abstract fetched) |
| No compositeness found: contact-interaction scale limits 9.2-29.5 TeV (quark models, ATLAS/CMS dijets) and 23.9-36.4 TeV (llqq); length = hbar c / Lambda | PDG 2026 "Searches for Quark and Lepton Compositeness" (`rpp2026-rev-searches-quark-lep-compositeness.pdf`, text read); the lengths are my calculation (hbar c = 197.327 MeV fm) |
| alpha_s about 0.118 at M_Z; "strongly interacting at and below 1 GeV; alpha_s about 0.1 at 0.1-1 TeV"; measured colour factors C_A = 2.89 +- 0.03 +- 0.21, C_F = 1.30 +- 0.01 +- 0.09 | PDG 2026 "Quantum Chromodynamics" review (`rpp2026-rev-qcd.pdf`, text read). The review quotes sub-averages 0.1171 +- 0.0017 and 0.1182 +- 0.0021 in its categories; I give "about 0.118" and did not extract its final world-average line |
| Solar pp neutrino flux at Earth about 6e10 per cm^2 per s | PDG 2026 neutrino-mixing review (text read: "about 6 x 10^10 cm^-2 s^-1") |
| Sea-level muon rate about 1 per cm^2 per minute (horizontal detector), 70 per m^2 per s per sr vertical, above 1 GeV/c | PDG cosmic-ray review, **2000 edition** (KEK mirror `https://ccwww.kek.jp/pdg/2000/cosmicrayrppbook.pdf`, seen through a search snippet only). The 2026 review was read but its text did not give this number in extractable form. Treat as an old but long-stable figure |
| Binding energy per nucleon (H-2, He-4, C-12, O-16, Ca-40, Fe-56, Ni-62, Sn-120, Pb-208, U-238); Ni-62 is the maximum in the table | AME2020 atomic mass evaluation, Wang et al., Chinese Physics C 45, 030003 (2021), file `https://www-nds.iaea.org/amdc/ame2020/mass_1.mas20.txt` |
| Higgs discovery announced 4 July 2012 by ATLAS and CMS at CERN | `https://home.cern/science/physics/higgs-boson` |
| W announced 25 Jan 1983 (UA1 Rubbia, UA2 Darriulat), SPS as proton-antiproton collider | `https://home.cern/science/physics/w-boson-sunshine-and-stardust` |
| Top quark announced 2 March 1995 by CDF and D0 at Fermilab | search results from Fermilab and Symmetry magazine |
| tau: Perl and colleagues, Mark I at SPEAR, SLAC, 1975, e-mu events, Nobel 1995 | search results (DOE accomplishments page, PRL 35, 1489 (1975)) |
| nu_e: Cowan and Reines, Savannah River reactor, 1956; nu_mu: Lederman, Schwartz, Steinberger, Brookhaven AGS, 1962 | search results (CERN Courier, Fermilab/IceCube history pages) |
| Gluon: three-jet events at PETRA (DESY), TASSO, June 1979, then JADE, PLUTO, Mark J | `https://www.desy.de/news/backgrounders/40_years_of_gluon/index_eng.html` (search result summary) |
| Asymptotic freedom Nobel Prize 2004 to Gross, Politzer, Wilczek | search results (Nobel Foundation, Physics Today) |
| Neutrino oscillation shown by Super-Kamiokande (1998) and SNO (2001-2002) | search results (APS News, Symmetry, DOE) |
| Muon (Neddermeyer, Anderson, Street, Stevenson; 1937), positron (Anderson 1932), kaon (Rochester, Butler 1947), Omega-minus (Brookhaven 1964), J/psi (Richter and Ting groups 1974), Upsilon (Fermilab 1977), nu_tau (DONUT, Fermilab 2000), SLAC deep inelastic scattering (1969), quark model (Gell-Mann, Zweig 1964), electron (Thomson 1897), Lambda in cosmic rays (1950) | Wikipedia "Timeline of particle discoveries" (a **lead**, not a primary source; fetched twice) |

## Calculations (marked "my calculation" or "calc" in the text)

- Lifetimes from widths: tau = hbar / Gamma with hbar = 6.582119569e-25 GeV s (top 4.6e-25 s, W 3.1e-25 s, Z 2.6e-25 s, Higgs 2.2e-22 s).
- Mass ratios: top/electron = 337,800 (172.60 GeV / 0.51099895 MeV); electron / KATRIN limit > 1.1e6; muon/electron 206.8; tau/electron 3477;
  W, Z, H in proton masses 85.7, 97.2, 133.4.
- Rest mass of u+u+d = 2(2.16) + 4.70 = 9.02 MeV = 0.96% of 938.272 MeV.
- Electric / gravitational force between two protons = e^2 / (4 pi eps0) / (G m_p^2) = 1.24e36 (CODATA constants), checked in `check_particles.py`.
- Weak range: hbar c / (m_W c^2) = 197.327 MeV fm / 80362.5 MeV = 2.5e-18 m; pion-exchange range hbar c / (m_pi c^2) = 1.41 fm.
- Minimum neutrino mass sums from PDG Delta m^2 (lightest massless): normal 0.058 eV, inverted 0.10 eV.
- Z width to neutrinos, 3.37% per charged lepton pair, etc. are PDG branching fractions.
- Count of 19 free parameters is a standard counting convention (6+3 masses, 3+1 CKM, 3 couplings, 2 Higgs, theta_QCD); not a PDG number.

## Known weak spots (details I could not confirm in a primary source this session)

- Discovery sentences for the muon (1937 attribution to four people), electron (Thomson, Cavendish, charge-to-mass of cathode rays), photon (Planck 1900, Einstein 1905, Compton 1923), up/down/strange quarks, J/psi, Upsilon (Lederman), nu_tau (DONUT, 2000), Omega-minus: leads from the Wikipedia timeline or common knowledge; not read in a primary source. Years and laboratories are what the card says; names beyond that were kept to what the sources gave.
- The Z announcement "a few months after the W" (the CERN page gave only the W date).
- 2013 Nobel Prize for the Higgs mechanism (Higgs and Englert) is stated from common knowledge; Nobel pages returned HTTP 403 to the fetch tool.
- "Positrons are used in PET scanners" and "Pauli exclusion gives the shell structure of atoms" are textbook statements, not individually sourced.
- Open-question wording (hierarchy problem, strong CP, dark energy not explained) is standard but not tied to a single document; PDG reviews exist for each.
