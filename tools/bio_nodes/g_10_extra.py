from lib import *

resume('bio_molecular')
n('bio_genome_organization','Genome organisation and size','concept','bio_chromatin_packaging','How much DNA, and what is in it.',
 'Genomes range from ≈ 160 kb in small bacterial symbionts to > 100 Gb in some plants. Bacteria have compact, gene-dense genomes; eukaryotes carry large amounts of noncoding DNA.',
 'The "C-value paradox" notes that genome size does not track organismal complexity: onions have ≈ 5× more DNA than humans.',
 'Genome size correlates with cell size and division time and is shaped by transposon expansion and drift (Lynch). Human genome: ≈ 1.5% coding, ≈ 45% transposon-derived, ≈ 8% from retroviral insertions.',
 'Human genome|≈ 3.1 Gb;E. coli genome|≈ 4.6 Mb', 'BIO:17.2 BIO:14.2', k='chromatin_genome', w='place:dna')
n('bio_mitochondrial_genome','Mitochondrial genome and heteroplasmy','concept','bio_endosymbiosis bio_replication_machinery','The small genome inside mitochondria.',
 'Mitochondria carry their own circular DNA, inherited almost entirely from the mother. Human mtDNA codes for 13 proteins, 22 tRNAs and 2 rRNAs.',
 'Cells hold many copies; a mix of normal and mutant copies is called heteroplasmy. Mitochondrial diseases appear when mutant copies exceed a threshold (often ≈ 60–90%).',
 'mtDNA has a higher mutation rate (≈ 10–20× nuclear) and slightly different genetic code. mtDNA is used for maternal-lineage studies and ancient DNA (e.g., Neanderthal mtDNA).',
 'Human mtDNA|16,569 bp;Copies per cell|≈ 100–10,000', 'BIO:4.3 BIO:13.2', k='mitochondria_org', w='mitochondrion')
n('bio_riboswitches_ribozymes','Riboswitches and ribozymes','concept','bio_rna_types bio_enzyme_catalysis','RNA that senses and catalyses.',
 'Riboswitches are RNA segments in mRNAs that change shape when they bind a small molecule, turning a gene on or off. Ribozymes are RNAs that act as enzymes.',
 'Examples: the thiamine pyrophosphate riboswitch in bacteria; self-splicing introns and RNase P. Cech and Altman won the 1989 Nobel.',
 'Riboswitch aptamers reach nanomolar affinity and discriminate close analogues. They are targets for antibiotics and support the RNA-world idea that RNA once combined genotype and phenotype roles.',
 'Ribozyme Nobel|1989;Known riboswitch classes|> 50', 'BIO:16.5', k='rna_world', w='place:dna')
n('bio_translation_steps','Translation: initiation, elongation, termination','process','bio_trna_translation_machinery','The three stages of protein synthesis.',
 'The ribosome assembles at a start codon, adds amino acids one by one as tRNAs match codons, and stops at a stop codon.',
 'Initiation uses Shine–Dalgarno (bacteria) or the 5′ cap and scanning (eukaryotes). Elongation cycles through A-site binding, peptide bond formation and translocation.',
 'EF-Tu delivers tRNAs and GTP hydrolysis proofreads; error rate ≈ 10⁻⁴ per codon. Release factors recognise stop codons. Polysomes allow many ribosomes per mRNA.',
 'Translation error rate|≈ 10⁻⁴ per codon;Ribosomes per polysome|≈ 5–10', 'BIO:15.5 MIC:11.4 COB:9.4', k='central_dogma', w='ribosome', rel='protein_synthesis')
n('bio_chromatin_remodeling_histone_code','Chromatin remodelling and the histone code','concept','bio_epigenetics','Enzymes that read and rewrite chromatin.',
 'Writer enzymes add marks to histones, eraser enzymes remove them and reader proteins recognise them, so chromatin can be opened or closed.',
 'ATP-driven remodelers slide or evict nucleosomes. Together they make genes accessible to transcription machinery.',
 'The "histone code" hypothesis proposes combinatorial marks encode regulatory states; how instructive versus consequential marks are is debated. Polycomb and Trithorax complexes maintain repressed and active states.',
 'Remodeler families|SWI/SNF, ISWI, CHD, INO80;Histone acetyltransferases|writers of H3K27ac', 'BIO:16.3', k='chromatin_genome gene_regulation', c='C2', oq=['Which histone modifications cause, rather than follow, changes in transcription remains contested.'], w='place:dna')

resume('bio_genetics')
n('bio_genetic_counseling_screening','Genetic testing, counselling and screening','technique','bio_single_gene_disorders bio_pedigree_analysis','Using genetics to inform health decisions.',
 'Genetic tests check for carrier status, risk of disease, or conditions in embryos and newborns. Counsellors explain what the results mean.',
 'Newborn screening tests for dozens of treatable conditions (PKU, CF). Polygenic scores give modest risk predictions for common diseases.',
 'Test performance (sensitivity, specificity, PPV) depends on prevalence; variants of uncertain significance (VUS) are common. Ethical issues include privacy, discrimination and embryo selection.',
 'PKU newborn screening|since 1960s;Typical VUS rate in panel tests|≈ 10–40%', 'ANP:28.7 BIO:17.4', k='bayes_stats', w='place:dna')
n('bio_twin_family_studies','Twin and family studies','technique','bio_quantitative_traits','Separating genes from environment.',
 'Identical twins share all genes; fraternal twins share half. Comparing them estimates how much of a trait\'s variation is genetic.',
 'Falconer\'s formula h² ≈ 2(r_MZ − r_DZ). Twin studies suggest high heritability for height and moderate for many behaviours.',
 'Assumptions (equal environments, no assortative mating) can fail; gene–environment correlation and interaction complicate interpretation. Molecular methods (GREML, GWAS) now complement twin designs.',
 'Falconer\'s estimate|h² ≈ 2(r_MZ − r_DZ);Identical twin height correlation|≈ 0.9', 'BIO:19.3', f='h² ≈ 2(r_MZ − r_DZ)', w='place:dna')
n('bio_genetic_screens','Forward and reverse genetics','technique','bio_mutations','Linking genes to functions.',
 'Forward genetics starts from a mutant trait and finds the gene; reverse genetics starts from a gene and creates a mutant to see the effect.',
 'Screens in yeast, flies, worms and zebrafish found cell-cycle, development and signalling genes. CRISPR now lets researchers knock out every gene in a genome-wide screen.',
 'Complementation tests group mutations into genes. Genome-wide CRISPR screens use pooled guides with sequencing readout and statistical tools (MAGeCK) to find essential genes (≈ 2,000 in human cell lines).',
 'Essential genes in human cells|≈ 2,000;Yeast deletion collection|≈ 6,000 strains', 'BIO:17.1', k='crispr_biotech', w='place:dna', rel='bio_crispr_cas9')

resume('bio_plants')
n('bio_roots_mycorrhiza','Roots, nutrient uptake and rhizosphere','structure','bio_plant_nutrition_soil','The underground half of the plant.',
 'Roots anchor plants and take up water and nutrients through root hairs. The soil around roots (rhizosphere) is full of microbes.',
 'Mycorrhizal fungi extend the root\'s reach; nodules host nitrogen-fixing bacteria in legumes. Roots secrete acids and sugars to shape the rhizosphere.',
 'The Casparian strip forces water and solutes through selective membranes in the endodermis. Total root length in a single rye plant has been estimated at > 600 km.',
 'Root hair length|≈ 1 mm;Rye root system|> 600 km', 'BIO:30.3 BIO:31.3', k='soil_biology', w='place:soil')
n('bio_plant_secondary_metabolites','Plant secondary metabolites','concept','bio_plant_responses','Defensive and attractive chemicals.',
 'Plants make compounds not needed for basic growth but useful for defence and signalling: caffeine, nicotine, morphine, capsaicin and pigments.',
 'Many human medicines come from plants (aspirin, taxol, artemisinin, digitoxin).',
 'Three main classes: terpenoids, phenolics and alkaloids. Metabolic gene clusters and coevolutionary arms races with herbivores shape diversity; ≈ 200,000 plant natural products are known.',
 'Plant natural products|≈ 200,000;Taxol source|Pacific yew bark', 'ORG:27.5 BIO:30.6', k='pharmacology', w='place:leaf', mol='caffeine nicotine morphine capsaicin salicylic_acid thc')
n('bio_plant_stress_drought','Plant responses to stress','process','bio_plant_hormones bio_leaf_structure_gas_exchange','Drought, cold, salt and pathogens.',
 'Under drought, roots signal leaves, hormone abscisic acid builds up and stomata close to save water.',
 'Plants also respond to cold with antifreeze proteins and to salt by sequestering ions in vacuoles.',
 'Osmolytes (proline, sucrose) lower water potential; heat shock proteins protect proteins. Breeding and engineering of stress tolerance is a major agricultural goal under climate change.',
 'ABA rise in drought|≈ 10–30×;Wilting point|≈ −1.5 MPa', 'BIO:30.6', k='plant_physiology', w='place:leaf')
n('bio_crop_domestication','Crop domestication and plant breeding','concept','bio_plant_reproduction bio_quantitative_traits','Humans reshaping plants.',
 'Farmers selected wild plants over ≈ 10,000 years to make crops like wheat, rice and maize with larger seeds and less shattering.',
 'Modern breeding uses crosses, mutation breeding, marker-assisted selection and genome editing. Green Revolution dwarf wheat boosted yields.',
 'Domestication syndrome genes (e.g., teosinte branched1 in maize, Rht in wheat) were identified by QTL mapping. Crop diversity narrows risk (Irish potato famine, banana TR4).',
 'Maize domestication|≈ 9,000 y ago (Mexico);Rice, wheat, maize share of calories|≈ 50%', 'BIO:32.3 COB:10.2', k='demography_agriculture', w='place:soil')
n('bio_plant_pathogens_defense','Plant pathogens and immunity','concept','bio_plant_responses bio_pathogenesis','Diseases of plants and how they fight back.',
 'Fungi, bacteria, viruses and nematodes attack plants. Plants respond with physical barriers, chemicals and localised cell death.',
 'The hypersensitive response sacrifices infected cells. Resistance (R) genes recognise pathogen effectors.',
 'Plants lack mobile immune cells but have PAMP-triggered and effector-triggered immunity. Wheat rust and rice blast threaten food security; durable resistance requires pyramiding R genes.',
 'Crop losses to pests and disease|≈ 20–40%;Rust spore travel|continents', 'BIO:30.6 BIO:24.4', k='plant_physiology', w='place:leaf')
n('bio_plant_polyploidy','Polyploidy and plant genome evolution','concept','bio_chromosomal_aberrations bio_speciation_mechanisms','Genome doubling in plants.',
 'Many plants have extra sets of chromosomes. Bread wheat has six sets and strawberries have eight.',
 'Polyploidy can instantly create new species and often gives larger organs; breeders use colchicine to double chromosomes.',
 'Allopolyploids combine genomes of two species (e.g., Brassica napus). Roughly 30% of living plant species are recent polyploids and all flowering plants show ancient duplications.',
 'Polyploid fraction of plants|≈ 30%;Wheat ploidy|6n = 42', 'BIO:13.2 BIO:18.2', k='speciation_biodiversity', w='place:leaf')

resume('bio_diversity')
n('bio_arachnids_crustaceans','Arachnids and crustaceans','organism','bio_nematodes_arthropods','Spiders, mites and crabs.',
 'Arachnids (spiders, scorpions, mites, ticks) have eight legs and two body regions. Crustaceans (crabs, shrimp, barnacles) mostly live in water and have two pairs of antennae.',
 'Ticks and mites spread diseases; krill form a keystone food source in the Southern Ocean.',
 'Spider silk is a protein with tensile strength ≈ 1 GPa. Antarctic krill biomass is estimated at 100–500 million tonnes. Pancrustacean phylogeny places insects within crustaceans.',
 'Spider species|≈ 51,000;Krill biomass|≈ 100–500 Mt', 'BIO:28.6', k='animal_diversity', w='place:park')
n('bio_parasites_helminths','Parasites and helminths','organism','bio_lophotrochozoans bio_nematodes_arthropods','Life on and in other animals.',
 'Parasites such as tapeworms, flukes and roundworms live in hosts and take nutrients. Some have complex life cycles with multiple hosts.',
 'About 1.5 billion people are infected with soil-transmitted worms. Schistosomiasis affects ≈ 240 million.',
 'Parasites make up a large share of biodiversity, perhaps 40% of animal species. They manipulate host behaviour and immune responses; the hygiene hypothesis links reduced helminth exposure to allergy risk (still debated).',
 'Soil-transmitted worm infections|≈ 1.5 billion;Schistosomiasis|≈ 240 million', 'BIO:28.3 MIC:5.2', k='animal_diversity', w='place:pond')
n('bio_evolution_of_flight','Evolution of flight and key innovations','concept','bio_reptiles_birds','Wings evolved several times.',
 'Flight evolved independently in insects, pterosaurs, birds and bats. Each used different wing structures.',
 'Feathered dinosaurs show feathers came before flight; Archaeopteryx (≈ 150 Ma) shows a mix of reptile and bird features.',
 'Hypotheses for bird flight origin include ground-up (running) and trees-down (gliding); evidence from wing-assisted incline running supports a mix. Flight requires high power-to-weight and efficient lungs.',
 'Archaeopteryx|≈ 150 Ma;Independent origins of flight|4 (vertebrates + insects)', 'BIO:29.5', c='C2', oq=['Whether bird flight arose from ground-up or arboreal origins is not settled.'], k='fossils_paleontology', w='place:air')
n('bio_lichens_fungal_biotech','Lichens and fungal biotechnology','concept','bio_fungal_ecology','Fungi as partners and tools.',
 'Lichens are partnerships between fungi and algae or cyanobacteria that colonise bare rock. Yeasts and moulds are used to make bread, beer, antibiotics and enzymes.',
 'Lichens are sensitive to air pollution. Penicillium makes penicillin; Aspergillus makes citric acid industrially.',
 'Saccharomyces cerevisiae is the first eukaryote with a fully sequenced genome (1996, ≈ 12 Mb, ≈ 6,000 genes). Fungal enzymes and mycoprotein are growing industries.',
 'Yeast genome|≈ 12 Mb, ≈ 6,000 genes;Lichen species|≈ 20,000', 'MIC:5.5 BIO:24.5', k='soil_biology', w='place:park')
n('bio_deuterostome_protostome','Protostome and deuterostome development','concept','bio_animal_features','Two ways to form a mouth.',
 'In protostomes the first opening in the embryo (blastopore) becomes the mouth; in deuterostomes it becomes the anus.',
 'Humans and sea urchins are deuterostomes; insects and snails are protostomes. Cleavage patterns and coelom formation also differ.',
 'Molecular phylogeny supports the split but shows exceptions to the textbook developmental differences. Xenacoelomorphs\' position (basal or with deuterostomes) is still debated.',
 'Protostome examples|insects, mollusks, annelids;Deuterostome examples|echinoderms, chordates', 'BIO:27.2 BIO:27.3', c='C2', oq=['The phylogenetic position of Xenacoelomorpha affects interpretations of early bilaterian evolution.'], k='animal_diversity', w='place:pond')

resume('bio_animal_phys')
n('bio_countercurrent_exchange','Countercurrent exchange and multiplication','concept','bio_comparative_respiration bio_excretion_nitrogen','A recurring design for efficient transfer.',
 'When two fluids flow in opposite directions side by side, heat or solutes can transfer along the whole length. Fish gills, bird legs and kidneys use this.',
 'Countercurrent heat exchange stops a duck\'s feet from losing body heat. In the kidney, the loop of Henle multiplies a salt gradient.',
 'Countercurrent exchange can in principle transfer nearly 100% versus 50% for concurrent flow. Multiplication uses active transport to create a gradient larger than the single-step difference.',
 'Max efficiency concurrent|50%;Human medullary osmolality|up to ≈ 1,200 mOsm/L', 'BIO:39.2 BIO:41.2 ANP:25.6', k='digestion_renal', w='loop_of_henle')
n('bio_acid_base_physiology','Acid–base and fluid balance in the body','concept','bio_buffers bio_osmoregulation','Regulating pH, water and electrolytes.',
 'The body holds blood pH steady using buffers, breathing (removes CO₂) and the kidneys (excrete acid or base).',
 'Respiratory acidosis follows CO₂ retention; metabolic acidosis may follow diabetic ketosis. Hormones ADH, aldosterone and ANP control water and sodium.',
 'The Henderson–Hasselbalch equation for bicarbonate links pH to PCO₂ and [HCO₃⁻]. Compensation takes minutes (respiratory) to days (renal). Body water ≈ 60% of mass: two-thirds intracellular, one-third extracellular.',
 'Normal arterial PCO₂|≈ 40 mmHg;Body water|≈ 60% of mass', 'ANP:26.1 ANP:26.4 ANP:26.5', f='pH = 6.1 + log([HCO₃⁻]/(0.03·PCO₂))', k='homeostasis', w='kidney_l')
n('bio_blood_pressure_control','Blood pressure and cardiovascular regulation','concept','bio_comparative_circulation bio_homeostasis_concept','Keeping blood flowing at the right pressure.',
 'Blood pressure depends on heart output and resistance in vessels. Nerves and hormones adjust both.',
 'Baroreceptors sense stretch and change heart rate; the kidneys regulate volume through the renin–angiotensin–aldosterone system.',
 'MAP ≈ CO × SVR; CO = HR × SV. Normal adult values: ≈ 120/80 mmHg, CO ≈ 5 L/min. Hypertension affects ≈ 30% of adults and is controlled with drugs targeting RAAS, calcium channels or diuresis.',
 'Normal blood pressure|≈ 120/80 mmHg;Cardiac output (rest)|≈ 5 L/min', 'ANP:20.2 ANP:20.4 BIO:40.4', f='MAP = CO × SVR;  CO = HR × SV', k='blood_circulation', w='heart')
n('bio_exercise_physiology','Exercise physiology and muscle metabolism','concept','bio_locomotion_skeletons bio_fermentation','Energy systems for movement.',
 'Muscles use stored ATP and creatine phosphate for seconds, glycolysis for minutes and aerobic metabolism for long efforts.',
 'Fast-twitch fibres suit sprinting and slow-twitch fibres suit endurance. Training raises mitochondria number and capillary density.',
 'VO₂max (≈ 35–45 mL/kg/min untrained, > 80 in elite endurance athletes) is limited by cardiac output. Lactate threshold, oxygen debt and muscle fibre types predict performance.',
 'Creatine phosphate energy supply|≈ 10 s;Elite VO₂max|> 80 mL/kg/min', 'ANP:10.5 ANP:10.6', k='muscle_contraction', w='skeletal_muscle_tissue', mol='creatine lactate')
n('bio_torpor_hibernation','Torpor, hibernation and extreme physiology','concept','bio_thermoregulation_animals','Surviving cold, drought and low oxygen.',
 'Some animals lower their metabolism and body temperature to save energy: bears, ground squirrels and hummingbirds.',
 'Arctic ground squirrels can cool to below 0 °C; wood frogs freeze solid and thaw. Tardigrades survive near-total dehydration.',
 'Hibernators suppress metabolism to ≈ 2–5% of normal and preserve muscle by unknown mechanisms. Antifreeze proteins and cryoprotectants (glucose, glycerol) protect cells.',
 'Hibernation metabolic rate|≈ 2–5% of basal;Arctic ground squirrel min. body temp.|≈ −2.9 °C', 'BIO:33.3', k='homeostasis', w='place:park')

resume('bio_immuno')
n('bio_cytokines_chemokines','Cytokines and chemokines','concept','bio_innate_immunity','The messengers of the immune system.',
 'Cytokines are small proteins that immune cells use to talk, such as interleukins and interferons. Chemokines guide cells to sites of infection.',
 'Too much cytokine release causes a "cytokine storm" in severe infections. Drugs that block TNF or IL-6 treat autoimmune disease.',
 'Cytokines signal through JAK–STAT pathways; receptors share common chains. Interferons induce hundreds of antiviral genes. Pleiotropy and redundancy complicate therapeutic targeting.',
 'Interferon-stimulated genes|≈ 300–500;First anti-TNF drug|1998', 'BIO:42.1 MIC:17.5 ANP:21.2', k='immune_system', w='macrophage')
n('bio_hematopoiesis','Hematopoiesis: making blood cells','process','bio_stem_cells_differentiation bio_innate_immunity','Blood cells from stem cells.',
 'Blood cells are made in bone marrow from haematopoietic stem cells. These make red cells, platelets and all white cells.',
 'Erythropoietin from the kidney boosts red blood cell production; G-CSF boosts neutrophils. Bone marrow transplants replace diseased stem cells.',
 'The tree splits into myeloid and lymphoid lineages; cell fate is controlled by transcription factors (GATA1, PU.1) and cytokines. About 2×10¹¹ red cells are made daily.',
 'Red blood cells made per day|≈ 2×10¹¹;RBC lifespan|≈ 120 days', 'ANP:18.2 ANP:18.3 ANP:18.4', k='cell_types', w='bone_marrow')
n('bio_complement_system','Complement and acute-phase defences','concept','bio_innate_immunity','A cascade of blood proteins.',
 'Complement proteins in blood coat microbes so phagocytes eat them, and can punch holes in bacterial membranes.',
 'Three pathways (classical, lectin, alternative) converge on C3 cleavage. Inflammation signals C3a and C5a attract immune cells.',
 'The membrane attack complex (C5b–C9) forms ≈ 10 nm pores. Complement deficiencies increase infections; excessive activation contributes to autoimmune and eye diseases (complement inhibitors approved).',
 'Complement proteins|≈ 30;MAC pore size|≈ 10 nm', 'MIC:17.2 ANP:21.2', k='immune_system', w='blood_tissue')

resume('bio_development')
n('bio_spemann_induction','Embryonic induction and the organiser','concept','bio_gastrulation_germ_layers','Signals from one tissue direct another.',
 'In 1924, Spemann and Mangold transplanted a small region of a newt embryo and showed it could organise a second body axis.',
 'Induction is when one group of cells signals to another to change its fate, as the lens is induced by the optic cup.',
 'The organiser secretes BMP antagonists (noggin, chordin) that set up dorsal–ventral patterning. Spemann received the 1935 Nobel Prize. Induction principles are reused in organ formation.',
 'Spemann–Mangold|1924;Nobel|1935', 'BIO:43.7', k='development_biology', w='place:cell')
n('bio_sex_determination_development','Sex determination and gonad development','process','bio_sex_linkage bio_developmental_signaling','How embryos become male or female.',
 'In humans, the SRY gene on the Y chromosome switches the gonad towards testis; without it ovaries develop. Hormones then shape other tissues.',
 'Testosterone and anti-Müllerian hormone direct male structures. Variations in sex development (DSD) arise from differences in genes, hormones or receptors.',
 'SRY activates SOX9; WNT4/RSPO1/FOXL2 maintain ovarian identity. Other animals use temperature (many reptiles), chromosome counts (bees) or social cues (clownfish).',
 'SRY discovery|1990;Clownfish|sequential hermaphrodite', 'ANP:27.3 BIO:43.3', k='development_biology', w='place:dna')
n('bio_axis_symmetry_breaking','Axis formation and symmetry breaking','concept','bio_morphogens_gradients','Establishing front, back and left, right.',
 'Early embryos need to know up from down and left from right. Maternal molecules and early signals break the initial symmetry.',
 'In flies, Bicoid and Nanos mRNAs are placed at opposite ends of the egg. In vertebrates, cilia generate flow that sets left–right asymmetry.',
 'Nodal signalling and cilia-driven flow in the node break left–right symmetry; defects cause situs inversus. Symmetry breaking uses reaction–diffusion and mechanical feedback.',
 'Fly egg length|≈ 0.5 mm;Situs inversus incidence|≈ 1 in 10,000', 'BIO:43.7', k='development_biology', w='place:cell')

resume('bio_lab')
n('bio_flow_cytometry','Flow cytometry and cell sorting','tool','bio_fluorescence_microscopy bio_immunoassays','Counting and sorting single cells.',
 'Cells stream one by one past lasers, and detectors record scattered and fluorescent light. This counts cell types and can sort them.',
 'Fluorescent antibodies label markers such as CD4 or CD8. Clinical uses include blood cell counts, leukaemia diagnosis and CD4 counts in HIV.',
 'Instruments measure ≈ 10⁴ cells per second across ≥ 10–40 parameters; compensation corrects for spectral overlap. Gating strategies and controls (FMO) drive correct interpretation.',
 'Typical event rate|≈ 10,000/s;Parameters measured|10–40', 'MIC:20.5', k='immune_system', w='')
n('bio_calibration_standard_curves','Calibration, standard curves and detection limits','technique','bio_spectrophotometry bio_regression_correlation','Making measurements quantitative.',
 'To turn a signal into a concentration, you measure known standards, draw a calibration curve, and read unknowns from it.',
 'Include a blank and replicates. Keep unknowns within the linear range, or dilute them.',
 'Limit of detection ≈ 3.3σ/slope and limit of quantitation ≈ 10σ/slope. Weighted regression handles heteroscedastic errors; four-parameter logistic fits are standard for ELISA.',
 'LOD|≈ 3.3 σ/slope;LOQ|≈ 10 σ/slope', 'CHE:1.5 IST:12.3', f='LOD ≈ 3.3·σ/slope', w='')
n('bio_western_blot_elisa_protocols','Western blots and ELISA in practice','technique','bio_protein_analysis bio_immunoassays','From lysate to a quantified band or well.',
 'In a Western blot, proteins are separated on a gel, moved onto a membrane and detected with antibodies. In an ELISA, antibodies capture and detect the target in a plate well.',
 'Loading controls (actin, tubulin) check equal loading. Validation of antibodies with knockout controls prevents false conclusions.',
 'Quantitation requires signals in the linear range; saturated bands cannot be compared. Many published antibodies fail specificity tests, a recognised reproducibility problem.',
 'Gel-to-membrane transfer|≈ 1–2 h;ELISA typical range|≈ 1 pg–100 ng/mL', 'MIC:20.4 MIC:12.2', w='')

resume('bio_ecology')
n('bio_ecosystem_stability','Ecosystem stability, resilience and tipping points','concept','bio_community_structure bio_succession_disturbance','How ecosystems respond to shocks.',
 'Ecosystems can resist change, bounce back (resilience), or shift to a new state if pushed too far.',
 'Diverse communities often show more stable production over time (insurance effect). Lakes can flip from clear to algal-dominated.',
 'Alternative stable states and hysteresis arise from feedbacks (Scheffer). Early-warning signals (critical slowing down) are proposed but difficult to apply in practice; evidence for global tipping points is mixed.',
 'Diversity–stability studies|Cedar Creek (since 1994);Lake regime shift|clear ↔ turbid', 'BIO:44.1 BIO:46.1', c='C2', oq=['How general and predictable ecological tipping points are remains uncertain.'], k='dynamical_chaos ecology_energy', w='place:pond')
n('bio_pollination_networks','Plant–animal interaction networks','concept','bio_symbiosis bio_plant_reproduction','Webs of pollinators, plants and seed dispersers.',
 'Plants and animals form webs of mutual benefit: bees pollinate flowers, birds and mammals disperse seeds.',
 'Networks tend to be nested: specialists interact with subsets of what generalists use, which may buffer against loss.',
 'Network metrics (nestedness, modularity) link structure to robustness. Declines in pollinators (habitat loss, pesticides, disease) threaten ≈ 75% of leading crops to some degree.',
 'Animal-pollinated flowering plants|≈ 87%;Honeybee colony loss (US, annual)|≈ 30–40%', 'BIO:32.2 BIO:45.6', k='flowers_pollination', w='place:park')
n('bio_soil_ecology','Soil ecology and the soil food web','concept','bio_primary_production_decomposition','Life beneath our feet.',
 'A handful of soil holds billions of microbes plus fungi, worms and mites. They break down organic matter and make nutrients available.',
 'Earthworms mix soil; fungi bind particles; bacteria fix nitrogen. Soil carbon is the largest terrestrial carbon store.',
 'Soil holds ≈ 1,500–2,400 Pg C, about 2–3× atmospheric carbon. Soil carbon persistence depends more on mineral association and microbial processing than on chemical recalcitrance (the microbial carbon pump view).',
 'Soil organic carbon (top 1–2 m)|≈ 1,500–2,400 Pg C;Bacteria per gram of soil|≈ 10⁸–10⁹', 'BIO:31.2', k='soil_biology', w='place:soil')
save('bio_extra')
