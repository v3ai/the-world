from lib import *

# ---------------- 1 Foundations ----------------
section('bio_foundations', 'Foundations of biology',
 'What biology is, how it is done, and what counts as alive.',
 'Biology is the study of living things and the rules they share. It starts with careful questions and tests, and it sorts life into levels from molecules to the whole planet.',
 'A handful of themes keep returning: cells as units, information in DNA, energy flow, structure matching function, evolution, and interaction with the environment. These give you a frame for every later chapter.',
 'Biology mixes experiment, observation, comparison and modelling. Because organisms are historical products of evolution, "why" questions have both a mechanistic (proximate) and an evolutionary (ultimate) answer.',
 'scientific_method cell_biology_intro')
n('bio_scientific_method','Scientific method in biology','technique','','Observe, hypothesise, test, revise.',
 'Scientists notice something, propose an explanation that could be wrong, and test it with an experiment or new observation. Results either support the idea or send it back for revision.',
 'A good hypothesis is falsifiable and makes a prediction. Controls, replication and blinding keep the result from reflecting bias or chance.',
 'Biology uses both hypothesis-driven and discovery-driven (data-first) science. Inference runs from experiment through statistics to a model, and strong claims need independent replication.',
 'Typical cycle|observe, hypothesise, predict, test, analyse;Key safeguard|control group + replication', 'BIO:1.1 COB:1.2', k='scientific_method', w='place:park',
 d='Louis Pasteur\'s swan-neck flask experiments (1860s) are a classic example of a clean control: they ended the idea of spontaneous generation.')
n('bio_themes_of_life','Unifying themes of biology','concept','bio_scientific_method','Six recurring ideas that tie all of biology together.',
 'Every living thing is made of cells, stores information in DNA, uses energy, responds to its surroundings and evolves. Structure usually fits function.',
 'Themes link scales: a protein\'s shape sets its job, a cell\'s membrane controls what enters, an ecosystem\'s energy flow sets how many organisms it can hold.',
 'Evolution by natural selection is the integrating theory (Dobzhansky: nothing in biology makes sense except in the light of evolution). Emergent properties appear at each level of organisation and cannot be read directly from the parts.',
 'Core themes|information, energy, structure-function, evolution, interaction;Proposed in|textbook syntheses since the 1900s', 'BIO:1.2 COB:1.1', k='cell_biology_intro')
n('bio_levels_organization','Levels of biological organization','concept','bio_themes_of_life','From atoms and molecules up to the biosphere.',
 'Life is nested: atoms form molecules, molecules form organelles and cells, cells form tissues and organs, organs form organisms, and organisms form populations, communities and ecosystems.',
 'Each level has emergent properties that its parts lack. A heartbeat is not a property of a single cardiomyocyte, and a food web is not a property of one species.',
 'Reductionism explains higher levels by lower ones, but explanation often runs both ways: gene expression depends on the cellular and organismal context. Scales span about 20 orders of magnitude, from atoms (0.1 nm) to the biosphere (10^7 m).',
 'Scale span|≈ 10^-10 m to 10^7 m;Cell|smallest unit generally called alive', 'BIO:1.2 COB:1.1', k='dimensional_scaling', w='place:cell', rel='human_body')
n('bio_characteristics_life','Characteristics of life','concept','bio_themes_of_life','The checklist biologists use to call something alive.',
 'Living things are organised, take in and use energy, grow and develop, reproduce, respond to stimuli, maintain internal balance and evolve across generations.',
 'No single trait is enough: fire grows and uses energy, crystals grow and are ordered. Life is the combination, and each trait has borderline cases such as viruses.',
 'A common working definition is a self-sustaining chemical system capable of Darwinian evolution (NASA). Viruses, prions and mules each break one criterion, which shows the list is a convention, not a law.',
 'Typical list|7–8 properties;Borderline cases|viruses, prions, mules', 'BIO:1.2 COB:1.1', c='C2',
 oq=['No consensus definition of life exists; astrobiology needs one that works for non-Earth chemistry.'], k='origin_of_life', w='place:cell')
n('bio_cell_theory','Cell theory','law','bio_characteristics_life','All life is made of cells, and cells come from cells.',
 'Every organism consists of one or more cells, the cell is the basic unit of life, and new cells arise only from existing cells.',
 'The theory grew from microscope work by Hooke, Leeuwenhoek, Schleiden, Schwann and Virchow. Later additions: cells carry DNA and metabolism happens inside them.',
 'Endosymbiosis shows eukaryotic cells themselves arose by merging prokaryotes. Exceptions that test the rule: syncytia (muscle fibres), acellular viruses, and anucleate cells such as mature red blood cells.',
 'Hooke named "cells"|1665;Virchow: omnis cellula e cellula|1855', 'BIO:4.1 MIC:3.2', k='cell_biology_intro', w='place:cell', rel='cell_membrane')
n('bio_homeostasis_concept','Homeostasis and feedback','concept','bio_characteristics_life','Keeping the internal state steady against a changing world.',
 'Organisms hold conditions like temperature, pH and blood sugar near set values. When a variable drifts, a response pushes it back.',
 'Negative feedback reverses a change and stabilises; positive feedback amplifies it, as in childbirth contractions or the rising phase of an action potential.',
 'A feedback loop has a sensor, a set point or integrator, and an effector. Gain, delay and oscillation matter, just as in control engineering; many hormonal systems are tuned loops with time lags.',
 'Core body temperature|≈ 37 °C;Blood pH|≈ 7.35–7.45', 'BIO:33.3 ANP:1.5', k='homeostasis', w='human_body', rel='thermoregulation hormone_signaling')
n('bio_model_organisms','Model organisms','concept','bio_scientific_method','A few species studied intensely to learn general rules.',
 'Scientists often work on organisms that are easy to grow and breed, such as E. coli, yeast, fruit flies, roundworms, zebrafish, mice and Arabidopsis.',
 'Deep conservation of cell biology and genes means findings transfer: yeast revealed the cell-cycle checkpoints, flies revealed Hox genes, worms revealed apoptosis.',
 'Choice of model involves generation time, genetic tools and genome size, and brings a bias towards lab-friendly species. Conservation does not guarantee transfer of every trait, especially for complex physiology and immunity.',
 'E. coli doubling time|≈ 20 min in rich medium;C. elegans cells|959 somatic cells in the adult hermaphrodite', 'BIO:1.2', w='place:pond',
 d='The nematode C. elegans has every one of its cell divisions mapped, one of very few animals where that is true.')
n('bio_taxonomy_intro','Classification and the tree of life','concept','bio_levels_organization','Naming and grouping species in a nested hierarchy.',
 'Species get two-part Latin names (genus and species), and groups nest: genus, family, order, class, phylum, kingdom, domain.',
 'The three-domain system (Bacteria, Archaea, Eukarya) came from ribosomal RNA comparisons by Woese. Modern classification aims to name monophyletic groups that include all descendants of a common ancestor.',
 'Linnaean ranks are conventions, while the phylogeny is the data. Names are governed by codes (ICZN, ICN), and species concepts (biological, phylogenetic, ecological) can disagree on where to draw lines.',
 'Domains|Bacteria, Archaea, Eukarya;Described species|≈ 2 million', 'BIO:20.1 COB:12.1', k='common_descent', w='place:park')
n('bio_experimental_basics','Variables, controls and replicates','technique','bio_scientific_method','The logic of a fair test.',
 'An experiment changes one variable (independent), measures another (dependent) and holds the rest fixed. A control group shows what happens without the treatment.',
 'Replicates show how much results vary; randomisation spreads unknown influences evenly; blinding stops expectations from colouring measurements.',
 'Pseudoreplication (treating non-independent samples as independent) is a frequent error. Power analysis before the experiment sets the sample size needed to detect an effect of a given size.',
 'Typical replicates|≥ 3 biological;Technical vs biological|different sources of variation', 'IST:1.4', w='')
n('bio_history_of_biology','Milestones in the history of biology','concept','bio_cell_theory','Key discoveries that built the modern field.',
 'Landmarks include Hooke\'s cells (1665), Darwin\'s natural selection (1859), Mendel\'s heredity (1866), the DNA double helix (1953) and the human genome (2003).',
 'Each shifted what questions were thinkable: microscopes gave cells, genetics gave inheritance, molecular biology gave mechanism, and sequencing gave whole-genome comparison.',
 'The "modern synthesis" (1930s–40s) fused Mendelian genetics with Darwinian selection, and the extended synthesis debate now asks how development, epigenetics and niche construction fit in.',
 'Double helix|1953 (Watson, Crick, Franklin, Wilkins);Human genome draft|2001, essentially complete 2022', 'BIO:1.1 BIO:14.1', k='history_placeholder' if False else 'common_descent', w='')

# ---------------- 2 Chemistry of life ----------------
section('bio_chem_life', 'Chemistry of life',
 'The atoms, bonds, water and energy rules that all biology runs on.',
 'Life is chemistry in water. Atoms bond into molecules, water makes them dissolve and fold, and energy rules decide which reactions go.',
 'A few elements (C, H, O, N, P, S) make most of the mass of cells. Weak bonds and the properties of water give biological molecules their flexible, specific shapes.',
 'Thermodynamics and kinetics together decide whether and how fast a reaction proceeds. Cells couple unfavourable reactions to favourable ones (mainly ATP hydrolysis) and use catalysts to set the speed.',
 'chemical_bonding thermochemistry')
n('bio_atoms_isotopes','Atoms, elements and isotopes','concept','','The particles that make up all matter and the six elements of life.',
 'An atom has a nucleus of protons and neutrons with electrons around it. The number of protons sets the element; isotopes differ in neutron number.',
 'About 96% of body mass is carbon, hydrogen, oxygen and nitrogen. Radioactive isotopes such as 14C and 32P serve as tracers and dating tools.',
 'Stable isotope ratios (13C/12C, 15N/14N) reveal diet and photosynthetic pathway, while radiocarbon dating works to about 50,000 years given a half-life of ≈ 5,730 years.',
 'CHON share of body mass|≈ 96%;14C half-life|≈ 5,730 y', 'BIO:2.1 CHE:2.3', k='periodic_table atomic_spectra', w='place:atom')
n('bio_electron_shells','Electron configuration and valence','concept','bio_atoms_isotopes','How electrons set an atom\'s bonding behaviour.',
 'Electrons fill energy levels, and the outermost (valence) electrons decide bonding. Carbon has four valence electrons, so it can make four bonds.',
 'Atoms bond to fill their outer shell: sodium gives up an electron, chlorine accepts one, carbon shares. Orbitals are regions where an electron is likely to be found.',
 'Quantum mechanics replaces circular orbits with probability orbitals (s, p, d). Hybridisation (sp3, sp2, sp) explains carbon\'s tetrahedral, planar and linear geometries.',
 'Carbon valence|4;Nitrogen / Oxygen valence|3 / 2', 'BIO:2.1 CHE:6.4', k='quantum_orbitals', w='place:atom')
n('bio_ionic_covalent','Ionic and covalent bonds','concept','bio_electron_shells','Transferring versus sharing electrons.',
 'In an ionic bond one atom hands electrons to another and the resulting charged ions attract. In a covalent bond atoms share electrons.',
 'Covalent bonds hold biomolecules together and are strong (≈ 350 kJ/mol for C–C). In water, salts like NaCl dissociate because ions are stabilised by the solvent.',
 'Bond polarity lies on a continuum set by electronegativity difference. Bond energies set the thermodynamics of metabolism: ATP stores energy in strained phosphoanhydride bonds.',
 'C–C bond energy|≈ 350 kJ/mol;Electronegativity (O vs H)|3.44 vs 2.20', 'BIO:2.1 CHE:7.1', k='chemical_bonding', w='mol:nacl_pair', mol='nacl_pair methane')
n('bio_polarity_hbonds','Polarity and hydrogen bonds','concept','bio_ionic_covalent','Uneven sharing of electrons and the bond that shapes life.',
 'In a polar bond one atom pulls electrons more, giving partial charges. A hydrogen bond is the attraction between a partly positive H and a partly negative O or N on another molecule.',
 'Each hydrogen bond is weak (≈ 5–30 kJ/mol), but huge numbers add up. They hold DNA strands together and stabilise protein helices and sheets.',
 'Hydrogen bonds are mostly electrostatic with some covalent character and strong directionality (≈ 180° donor–H···acceptor). Water molecules form a fluctuating network lasting picoseconds.',
 'H-bond strength|≈ 5–30 kJ/mol;Base pair H-bonds|2 (A–T), 3 (G–C)', 'BIO:2.2 CHE:10.1', k='intermolecular_forces', w='mol:water', mol='water bp_AT bp_GC')
n('bio_noncovalent_forces','Weak interactions: van der Waals and hydrophobic effect','concept','bio_polarity_hbonds','The soft forces that fold and assemble biomolecules.',
 'Van der Waals forces are brief attractions between any close atoms. The hydrophobic effect pushes oily groups together because water prefers to bond to itself.',
 'Membranes and the cores of folded proteins form because nonpolar parts cluster away from water, not because oily groups attract strongly.',
 'The hydrophobic effect is largely entropic: ordered water around a nonpolar surface is released on burial. Combined weak forces give specificity and reversibility to binding, with typical K_d from µM to pM.',
 'Van der Waals energy|≈ 0.4–4 kJ/mol;Typical antibody K_d|≈ nM', 'BIO:2.2 ORG:2.12', k='intermolecular_forces', w='mol:popc', mol='popc hexane')
n('bio_water_properties','Properties of water','concept','bio_polarity_hbonds','Why water is the medium of life.',
 'Water is a polar solvent with strong cohesion, high heat capacity and a solid form (ice) that floats. These traits stabilise temperature and let life dissolve and move molecules.',
 'Cohesion and adhesion lift water up plants, surface tension supports pond insects, and high heat of vaporisation (≈ 2,260 J/g) makes sweating an effective coolant.',
 'Water is densest at ≈ 4 °C, so lakes freeze from the top. Its dielectric constant (≈ 80) screens charges, which is why salts dissolve and why ion-pair interactions behave differently in cells.',
 'Specific heat|4.18 J/g·K;Dielectric constant|≈ 80', 'BIO:2.2 COB:2.2 CHE:10.2', k='liquid_water_properties', w='mol:water', mol='water', ext='')
n('bio_solutions_concentration','Solutions, solutes and osmolarity','concept','bio_water_properties','How much dissolved stuff is in a liquid.',
 'A solution is a solute dissolved in a solvent. Concentration tells how much solute per volume, as mass/volume or moles/litre (molarity).',
 'Osmolarity counts dissolved particles, because osmosis depends on the number of particles. Cells placed in a hypotonic solution swell, in a hypertonic solution shrink.',
 'Colligative properties (osmotic pressure Π = iMRT) depend on particle count, not identity. Blood plasma is ≈ 290 mOsm/L, and cells use compatible osmolytes to resist drying.',
 'Plasma osmolarity|≈ 290 mOsm/L;Normal saline|0.9% NaCl (≈ 154 mM)', 'CHE:3.3 CHE:11.4 BIO:5.2', f='Π = iMRT', k='chemistry_solutions', w='place:cell')
n('bio_acids_bases_ph','Acids, bases and pH','concept','bio_water_properties','The scale for hydrogen-ion concentration.',
 'Acids donate hydrogen ions (H+) and bases accept them. pH is −log10[H+], so each pH unit is a ten-fold change in H+.',
 'Pure water has [H+] = 10^-7 M (pH 7). Stomach acid is near pH 1.5–3.5; blood is held within about 0.05 units of 7.40.',
 'Strong acids dissociate fully; weak acids set pKa and equilibrium. Proteins\' ionisable groups change charge with pH, shifting shape, binding and enzyme activity.',
 'Blood pH|7.35–7.45;pH of pure water at 25 °C|7.0', 'BIO:2.2 CHE:14.2 ANP:2.4', f='pH = −log₁₀[H⁺]', k='chemistry_equilibrium', w='mol:hydroxide', mol='hydroxide ammonium')
n('bio_buffers','Buffers and Henderson–Hasselbalch','concept','bio_acids_bases_ph','Resisting changes in pH.',
 'A buffer is a weak acid and its conjugate base together. It soaks up added acid or base so pH changes little.',
 'The bicarbonate system (CO2 + H2O ⇌ H2CO3 ⇌ H+ + HCO3−) is the main buffer of blood, with phosphate and proteins as supporting acts.',
 'Henderson–Hasselbalch links pH to pKa and the base/acid ratio. Buffers work best within ±1 unit of pKa; blood bicarbonate has pKa ≈ 6.1 but is effective because the lungs control CO2.',
 'Blood bicarbonate|≈ 24 mM;Effective range|pKa ± 1', 'CHE:14.6 ANP:26.4 ORG:20.3', f='pH = pKa + log([A⁻]/[HA])', w='mol:bicarbonate', mol='bicarbonate carbonate phosphate')
n('bio_mole_molarity','Moles, molarity and dilutions','technique','bio_solutions_concentration','Bookkeeping for amounts of molecules.',
 'A mole is 6.022×10^23 particles. Molarity (M) is moles per litre, and you can dilute a stock using C1V1 = C2V2.',
 'Biologists prepare buffers and media from molecular weights: mass = molarity × volume × MW. Serial dilutions (e.g. 1:10) cover many orders of magnitude.',
 'Real solutions are not ideal at high ionic strength; activity differs from concentration. In cell culture and enzyme assays, final concentrations after mixing are the numbers that matter.',
 'Avogadro constant|6.022×10^23 mol⁻¹;MW of glucose|180.16 g/mol', 'CHE:3.1 CHE:3.3', f='C₁V₁ = C₂V₂', k='chemistry_solutions', w='')
n('bio_reaction_equilibrium','Chemical reactions and equilibrium','concept','bio_acids_bases_ph','Reactions run both ways until forward and reverse balance.',
 'A reaction can run forward and backward. At equilibrium the forward and reverse rates are equal and concentrations stop changing.',
 'The equilibrium constant K = [products]/[reactants] says where the balance lies. Le Châtelier\'s principle: a stress shifts the balance to oppose it.',
 'K relates to standard free energy: ΔG° = −RT ln K. Cells are not at equilibrium but in steady state, kept far from it by constant fluxes.',
 'Relation|ΔG° = −RT ln K;RT at 37 °C|≈ 2.58 kJ/mol', 'CHE:13.1 CHE:13.2 CHE:13.3', f='K = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ', k='chemistry_equilibrium', w='')
n('bio_reaction_kinetics','Reaction rates and activation energy','concept','bio_reaction_equilibrium','How fast reactions go, and what catalysts do.',
 'Reactions must overcome an energy barrier, the activation energy. Heat, concentration and catalysts speed them up.',
 'Rate laws express speed as a function of concentrations. Catalysts, including enzymes, lower the barrier without changing the final balance.',
 'Arrhenius: k = A·e^(−Ea/RT), so rates roughly double for a 10 °C rise in many reactions (Q10 ≈ 2–3). Transition-state theory ties catalysis to stabilising the transition state.',
 'Q10 typical|≈ 2–3;Enzymes speed up|10^6–10^17 fold', 'BIO:6.2 CHE:12.3 CHE:12.7', f='k = A·e^(−Ea/RT)', k='reaction_kinetics', w='')
n('bio_thermo_laws','Laws of thermodynamics in living systems','law','bio_reaction_kinetics','Energy is conserved, and disorder tends to increase.',
 'Energy cannot be created or destroyed, only changed in form. Every conversion loses some energy as heat and increases disorder overall.',
 'Cells are open systems: they stay ordered by taking in energy (light or food) and exporting heat and waste. Life does not violate the second law.',
 'Entropy production in the surroundings exceeds local entropy decrease. Efficiency of ATP production from glucose is ≈ 35–40%, with the rest lost as heat that also warms endotherms.',
 'Glucose oxidation|≈ −2,870 kJ/mol;Human power at rest|≈ 80 W', 'BIO:6.3 CHE:16.2 CHE:16.3', k='first_law second_law', w='place:cell')
n('bio_gibbs_free_energy','Free energy and spontaneity','law','bio_thermo_laws','The energy available to do work.',
 'Gibbs free energy change ΔG tells whether a reaction can proceed on its own. Negative ΔG releases usable energy; positive ΔG needs an input.',
 'ΔG = ΔH − TΔS balances heat change against disorder. Reactions in cells are often "coupled" so that an unfavourable step is driven by a favourable one.',
 'Actual ΔG depends on concentrations: ΔG = ΔG°′ + RT ln Q. In cells ATP hydrolysis yields ≈ −50 to −60 kJ/mol because ATP/ADP is kept far from equilibrium.',
 'ATP hydrolysis ΔG°′|≈ −30.5 kJ/mol;Cellular ΔG ATP|≈ −50 to −60 kJ/mol', 'BIO:6.2 CHE:16.4', f='ΔG = ΔH − TΔS', k='chemistry_gibbs', w='mol:atp', mol='atp adp phosphate')
n('bio_redox_biology','Oxidation–reduction (redox) in biology','concept','bio_gibbs_free_energy','Electron transfers that carry cellular energy.',
 'Oxidation is loss of electrons (or hydrogen) and reduction is gain. NAD+ and FAD pick up electrons from food and carry them to the respiratory chain.',
 'In cells, redox pairs have reduction potentials; electrons flow from low to high potential, releasing energy that makes a proton gradient.',
 'ΔG°′ = −nFΔE°′. NADH (E°′ ≈ −0.32 V) to O2 (≈ +0.82 V) spans ≈ 1.14 V, about 220 kJ/mol, enough to pump about 10 protons per NADH in the respiratory chain.',
 'E°′ NAD+/NADH|≈ −0.32 V;E°′ O2/H2O|≈ +0.82 V', 'BIO:7.1 CHE:17.1 CHE:17.4', f='ΔG°′ = −nFΔE°′', k='electrochemistry', w='mol:nadh', mol='nad_plus nadh fad')
n('bio_atp_energy_coupling','ATP and energy coupling','concept','bio_gibbs_free_energy','The cell\'s universal energy currency.',
 'ATP carries energy in its phosphate bonds. Cells split off a phosphate to power work, then rebuild ATP from food or light.',
 'Hydrolysis of ATP is coupled to pumps, motors and synthesis by transferring the phosphate to a target molecule, which raises that molecule\'s energy.',
 'A person turns over roughly their own body weight of ATP per day (≈ 50–70 kg), recycling a pool of only ≈ 50 g. ATP synthase makes ≈ 90% of it in aerobic tissues.',
 'ATP pool in body|≈ 50 g;Daily turnover|≈ 50–70 kg', 'BIO:6.4 CHE:16.4', k='atp_energy', w='mol:atp', mol='atp adp amp', rel='cellular_respiration',
 d='Your body makes and uses roughly its own weight in ATP every day, yet holds only a few dozen grams at once.')
n('bio_electrolytes_ions','Electrolytes and ion gradients','concept','bio_solutions_concentration','Charged ions that carry signals and set osmotic balance.',
 'Ions like Na+, K+, Ca2+ and Cl− dissolve in body fluids and carry electric charge. Cells keep different amounts inside and outside.',
 'The gap in K+ and Na+ across the membrane is the source of the resting membrane voltage, and calcium is a ubiquitous signal.',
 'Typical mammalian concentrations: [K+] ≈ 140 mM inside vs 5 mM outside; [Na+] ≈ 12 mM inside vs 145 mM outside. The Nernst equation gives the equilibrium potential for each ion.',
 'K+ in / out|≈ 140 / 5 mM;Resting potential|≈ −70 mV', 'ANP:26.3 BIO:5.2', f='E_ion = (RT/zF)·ln([out]/[in])', w='place:cell')
n('bio_carbon_chemistry','Carbon: the backbone of life','concept','bio_ionic_covalent','Why carbon builds the molecules of life.',
 'Carbon makes four stable bonds, forming chains, rings and branches with itself and with H, O, N, P and S.',
 'These skeletons carry functional groups that give each biomolecule its chemistry. Isomers with the same formula can behave very differently.',
 'Carbon–carbon bonds are strong yet reactive enough for metabolism, and carbon\'s tendency to form stable ring and chain structures underlies the huge variety of organic chemistry (> 10^8 known compounds).',
 'Bonds per carbon|4;Known organic compounds|> 10^8', 'BIO:2.3 ORG:1.6', k='organic_functional_groups', w='mol:methane', mol='methane benzene cyclohexane')
n('bio_macromolecule_synthesis','Dehydration synthesis and hydrolysis','technique','bio_carbon_chemistry','How monomers are joined and split.',
 'Cells build polymers by joining monomers with the loss of a water molecule (dehydration synthesis) and break them apart by adding water (hydrolysis).',
 'This one idea makes starch, proteins and DNA from sugars, amino acids and nucleotides. Enzymes catalyse both directions.',
 'Condensation is thermodynamically uphill in water, so cells couple it to ATP or other activated intermediates; hydrolysis is favourable but kinetically slow without enzymes.',
 'Polymer examples|starch, protein, DNA;Water released per bond|1 H2O', 'BIO:3.1 COB:2.3', w='mol:glucose_alpha', mol='glucose_alpha maltose')

# ---------------- 3 Organic chemistry ----------------
section('bio_orgchem', 'Organic chemistry for biologists',
 'The structures and reaction types that explain biochemistry.',
 'Organic chemistry is the chemistry of carbon compounds. Biologists use it to read molecular structures and to see why enzymes do what they do.',
 'Functional groups, three-dimensional shape (stereochemistry) and a small set of reaction types such as substitution, addition and condensation cover nearly all of metabolism.',
 'Enzyme mechanisms are organic mechanisms with a protein for scaffolding: curved-arrow steps through intermediates, with acid–base and covalent catalysis steering outcomes.',
 'organic_functional_groups stereochemistry_chirality')
n('bio_functional_groups','Functional groups','concept','bio_carbon_chemistry','The reactive groups that give molecules their behaviour.',
 'Hydroxyl, carbonyl, carboxyl, amino, phosphate and sulfhydryl groups sit on carbon skeletons and determine polarity, acidity and reactivity.',
 'A hydroxyl makes alcohols (sugars), a carboxyl makes acids (amino acids, fatty acids), and phosphate groups carry charge and energy.',
 'Group properties set pKa and nucleophilicity: thiolate (Cys) and imidazole (His) are common catalytic groups, and phosphoanhydrides are high-energy transfer groups.',
 'Key groups|–OH, C=O, –COOH, –NH2, –PO4, –SH;Amide bond|peptide linkage', 'ORG:3.1 CHE:20.2', k='organic_functional_groups', w='mol:ethanol', mol='ethanol acetone acetic_acid methylamine phosphoric_acid')
n('bio_isomers','Isomers','concept','bio_functional_groups','Same atoms, different arrangement.',
 'Isomers share a molecular formula but differ in structure. Structural isomers differ in connections, stereoisomers differ only in 3D arrangement.',
 'Glucose and fructose are structural isomers (C6H12O6), while the two mirror-image forms of an amino acid are stereoisomers.',
 'Isomer classes: constitutional, cis–trans (geometric) and optical. Biological systems usually treat isomers as entirely different molecules because enzyme active sites are three-dimensional.',
 'Glucose / fructose|C6H12O6 both;Possible stereoisomers|2^n for n stereocentres', 'ORG:5.9 ORG:4.2', w='mol:fructose', mol='glucose_alpha fructose')
n('bio_chirality','Chirality and enantiomers','concept','bio_isomers','Molecules that are mirror images but not superimposable.',
 'A carbon with four different groups is a stereocentre. The two mirror-image forms are enantiomers, like left and right hands.',
 'Life uses almost only L-amino acids and D-sugars. Enantiomers can differ in taste, smell or drug effect: thalidomide\'s isomers are the classic warning.',
 'Cahn–Ingold–Prelog priority rules give R/S labels; optical rotation measures enantiomeric excess. The origin of biological homochirality is unsolved (see origin of life).',
 'Amino acids in proteins|L (except achiral glycine);Sugars in nature|mostly D', 'ORG:5.1 ORG:5.5 ORG:5.12', k='stereochemistry_chirality', w='mol:aa_ala', mol='aa_ala glyceraldehyde')
n('bio_fischer_cyclic_sugars','Sugar stereochemistry: Fischer and ring forms','concept','bio_chirality','How sugars are drawn and how they close into rings.',
 'Sugars are drawn as chains (Fischer projection) but in water mostly form rings. Ring closure creates a new stereocentre, giving α and β forms.',
 'Glucose in water is ≈ 64% β-pyranose, ≈ 36% α-pyranose, with trace open chain. α versus β linkage separates digestible starch from indigestible cellulose.',
 'Anomeric carbon, mutarotation and the anomeric effect govern ring preferences. Haworth and chair representations convey the same molecule in different ways.',
 'β-glucopyranose in solution|≈ 64%;Open-chain form|≈ 0.002%', 'ORG:25.2 ORG:25.5', w='mol:glucose_beta', mol='glucose_alpha glucose_beta ribose')
n('bio_conformations','Conformation and ring strain','concept','bio_isomers','Rotation about single bonds and shapes of rings.',
 'Single bonds rotate, so molecules wiggle among shapes (conformations). Cyclohexane prefers a chair shape that keeps substituents far apart.',
 'Bulky groups prefer equatorial positions in a chair. Conformational preferences affect how sugars, steroids and lipids pack.',
 'Energy differences between staggered and eclipsed ethane ≈ 12 kJ/mol; axial–equatorial preference for a methyl on cyclohexane ≈ 7.6 kJ/mol. Peptide bonds are planar due to partial double-bond character.',
 'Ethane barrier|≈ 12 kJ/mol;Methyl axial penalty|≈ 7.6 kJ/mol', 'ORG:3.6 ORG:4.5 ORG:4.6', w='mol:cyclohexane', mol='cyclohexane')
n('bio_acid_base_organic','Organic acids, bases and pKa','concept','bio_functional_groups','Which groups gain or lose protons.',
 'Carboxylic acids lose H+ (pKa ≈ 4–5) and amines gain it (conjugate acid pKa ≈ 9–10), so at body pH carboxyls are negative and amines positive.',
 'Amino acids carry both, so they are zwitterions. The isoelectric point is the pH at which the net charge is zero.',
 'Side-chain pKa values (Asp ≈ 3.9, Glu ≈ 4.1, His ≈ 6.0, Cys ≈ 8.3, Lys ≈ 10.5) shift in the protein environment, which tunes enzyme catalysis.',
 'Acetic acid pKa|4.76;Histidine side chain pKa|≈ 6.0', 'ORG:2.7 ORG:2.8 ORG:2.10 ORG:26.2', k='chemistry_equilibrium', w='mol:aa_his', mol='aa_his aa_lys aa_asp acetic_acid')
n('bio_nucleophile_electrophile','Nucleophiles, electrophiles and curved arrows','concept','bio_acid_base_organic','The language of reaction mechanisms.',
 'A nucleophile has electrons to give and attacks an electrophile that is short of electrons. Curved arrows track electron movement.',
 'Most biochemical steps are polar reactions: an electron-rich atom (e.g. Ser–OH, Cys–S−, water) attacks a carbon bearing a partial positive charge.',
 'Reactivity depends on charge, polarisability, solvent and leaving-group ability. Enzymes enhance rates by orienting reactants and stabilising charged intermediates.',
 'Common biological nucleophiles|H2O, –OH, –SH, –NH2;Common electrophile|carbonyl C', 'ORG:6.3 ORG:6.5 ORG:2.11', w='mol:formaldehyde', mol='formaldehyde')
n('bio_substitution_elimination','Substitution and elimination reactions','concept','bio_nucleophile_electrophile','Swap one group for another, or remove atoms to make a double bond.',
 'In substitution a nucleophile replaces a leaving group; in elimination atoms are removed to form a C=C bond.',
 'SN2 is a single-step backside attack with inversion; SN1 passes through a carbocation. Cells use SN2-type steps in methylation reactions with S-adenosylmethionine.',
 'Biological eliminations (dehydrations such as enolase) often proceed by E1cB through carbanion intermediates. Rates depend on leaving group, substrate and solvent.',
 'SN2 stereochemistry|inversion;Methyl donor|S-adenosylmethionine (SAM)', 'ORG:11.2 ORG:11.4 ORG:11.6 ORG:11.11', w='mol:ethanol', mol='methanol')
n('bio_carbonyl_chemistry','Carbonyl addition and condensation','concept','bio_nucleophile_electrophile','Reactions at C=O, the workhorse of metabolism.',
 'Carbonyl carbons are electrophiles. Nucleophiles add to them to make alcohols, hemiacetals and imines.',
 'Sugar rings are hemiacetals, Schiff bases link retinal to opsin, and the aldol reaction builds carbon–carbon bonds in glycolysis and the Calvin cycle.',
 'Aldol and Claisen condensations use enolates (α-carbon nucleophiles). Citrate synthase and fatty-acid synthesis are biological Claisen-type reactions.',
 'Aldol in glycolysis|aldolase cleaves FBP;Claisen in lipid synthesis|malonyl-ACP + acyl', 'ORG:19.4 ORG:19.10 ORG:23.1 ORG:23.7 ORG:23.13', w='mol:acetone', mol='acetone acetaldehyde retinal')
n('bio_acyl_substitution','Nucleophilic acyl substitution','concept','bio_carbonyl_chemistry','How peptide bonds, esters and thioesters form and break.',
 'A nucleophile attacks a carboxylic-acid-derived carbonyl and swaps out the leaving group. This forms and cleaves esters, amides and thioesters.',
 'Proteases and the ribosome use acyl substitution; acetyl-CoA is a thioester whose acetyl group is easily transferred.',
 'Reactivity order: acid chlorides > anhydrides > thioesters > esters > amides. A tetrahedral intermediate forms and collapses, a pattern seen in serine proteases and in peptidyl transfer.',
 'Peptide bond|an amide;Acetyl-CoA|thioester, ΔG°′ hydrolysis ≈ −31 kJ/mol', 'ORG:21.2 ORG:21.7 ORG:21.8', w='mol:acetate', mol='acetate')
n('bio_phosphoryl_transfer','Phosphoryl transfer','concept','bio_acyl_substitution','The chemistry behind ATP, kinases and DNA backbones.',
 'Phosphate groups are moved from one molecule to another, such as from ATP to a protein. Kinases add phosphate; phosphatases remove it.',
 'Phosphoryl transfer drives signalling and energy coupling. DNA and RNA backbones are phosphodiesters, and nucleotide synthesis relies on activated triphosphates.',
 'Transfers occur via associative or dissociative transition states, often with Mg2+ stabilising the leaving group. Phosphodiester bonds are remarkably stable (hydrolysis half-life ≈ 10^8 years for DNA at neutral pH in water).',
 'Human kinases|≈ 500;DNA phosphodiester stability|half-life ≈ 10^8 y', 'ORG:21.8 ORG:28.1', w='mol:atp', mol='atp adp phosphate')
n('bio_redox_organic','Organic oxidation and reduction','concept','bio_carbonyl_chemistry','Moving hydrogen and electrons in carbon compounds.',
 'Oxidation of an alcohol gives an aldehyde or ketone; reduction reverses it. Cells use NAD+/NADH to carry out these steps by hydride transfer.',
 'Dehydrogenases move a hydride (H−) between substrate and NAD+. Lactate dehydrogenase interconverts pyruvate and lactate this way.',
 'Oxidation state of carbon tracks energy content: fats (highly reduced) store ≈ 38 kJ/g versus carbohydrate ≈ 17 kJ/g.',
 'Fat energy|≈ 38 kJ/g;Carbohydrate energy|≈ 17 kJ/g', 'ORG:19.12 ORG:17.7 ORG:10.8', w='mol:nadh', mol='nadh nad_plus lactate pyruvate')
n('bio_resonance_aromatic','Resonance and aromaticity','concept','bio_functional_groups','Electron delocalisation that stabilises many biomolecules.',
 'When electrons spread over several atoms the molecule is more stable. Benzene rings and the peptide bond are examples.',
 'Aromatic rings (Phe, Tyr, Trp, His, nucleobases) absorb UV light near 260–280 nm, which is how DNA and proteins are quantified.',
 'Hückel\'s 4n+2 rule predicts aromatic stability. Delocalisation gives the peptide bond about 40% double-bond character, keeping it planar with a rotation barrier ≈ 80 kJ/mol.',
 'DNA absorbance max|≈ 260 nm;Protein absorbance max|≈ 280 nm', 'ORG:2.4 ORG:15.3 ORG:15.5', w='mol:benzene', mol='benzene pyridine indole purine')
n('bio_spectroscopy_structure','Structure determination: MS, IR, NMR, UV','technique','bio_functional_groups','How chemists read a molecule.',
 'Mass spectrometry weighs molecules, infrared spectroscopy identifies bond types, NMR maps the carbon–hydrogen framework, and UV–visible spectroscopy detects conjugated systems.',
 'Biologists use MS in proteomics and metabolomics, NMR and X-ray crystallography for protein structure, and UV–vis for nucleic-acid and protein concentration.',
 'NMR depends on nuclear spin in a magnetic field (chemical shift, coupling). Cryo-EM and X-ray diffraction give atomic models of large complexes; resolution ≈ 1.5–3 Å is typical.',
 'Typical protein MS accuracy|< 5 ppm;Protein NMR size limit|traditionally ≈ 30–50 kDa', 'ORG:12.1 ORG:13.1 ORG:12.6 CHE:6.1', k='spectroscopy_methods', w='')
save('bio_foundations_chem')
