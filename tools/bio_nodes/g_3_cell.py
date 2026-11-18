from lib import *

section('bio_cell_biology', 'Cell biology',
 'The structure, transport, signalling and life cycle of cells.',
 'The cell is the smallest unit of life. Cells have membranes, organelles, a skeleton, ways to move materials, ways to talk to each other and a cycle of growth and division.',
 'Prokaryotic cells are simple and small; eukaryotic cells have a nucleus and compartments. Compartments let a cell run incompatible chemistry side by side and target proteins to the right place.',
 'Cell behaviour emerges from networks: signalling pathways convert external cues to gene-expression and cytoskeletal changes, while checkpoints tie growth to division and trigger apoptosis when damage is irreparable.',
 'cell_biology_intro organelles_overview')
n('bio_prokaryote_eukaryote','Prokaryotic and eukaryotic cells','concept','bio_cell_theory','Two basic cell plans.',
 'Prokaryotes (bacteria and archaea) lack a nucleus and membrane-bound organelles. Eukaryotes keep their DNA in a nucleus and have compartments.',
 'Prokaryotes are typically 0.5–5 µm and eukaryotes 10–100 µm. Both have ribosomes, DNA and a plasma membrane.',
 'Eukaryotes arose from an archaeal host that acquired bacterial endosymbionts. Eukaryotic cell volume is ≈ 1,000–10,000× that of a bacterium and mitochondria give the energy budget to support large genomes.',
 'Typical bacterium|≈ 1–2 µm;Typical animal cell|≈ 10–30 µm', 'BIO:4.2 BIO:4.3 COB:3.2', k='cell_types cell_biology_intro', w='place:cell')
n('bio_cell_size_limits','Cell size and surface-area-to-volume ratio','concept','bio_prokaryote_eukaryote','Why cells are small.',
 'As a cell grows, volume increases faster than surface area, so it becomes harder to supply and clear the interior.',
 'This is why cells divide, why gut lining and lung surfaces are folded, and why large cells use many small compartments.',
 'For a sphere SA/V = 3/r. Diffusion time scales with distance squared (t ≈ x²/2D); in cytoplasm, a small molecule diffuses ≈ 10 µm in ≈ 50 ms but 1 mm in ≈ 10 min.',
 'SA/V of sphere|3/r;Diffusion time for 10 µm|≈ 50 ms', 'BIO:4.1 BIO:4.2', f='t ≈ x² / (2D)', k='dimensional_scaling', w='place:cell')
n('bio_fluid_mosaic','Fluid mosaic membrane','structure','bio_membrane_lipids','Proteins floating in a lipid bilayer.',
 'The plasma membrane is a fluid bilayer of phospholipids with proteins, cholesterol and carbohydrates embedded.',
 'Lipids and many proteins move sideways; cholesterol buffers fluidity. Membrane proteins act as channels, pumps, receptors and anchors.',
 'Lipid rafts and cytoskeletal fences create domains; the membrane is asymmetric between leaflets. Membrane composition changes with temperature (homeoviscous adaptation).',
 'Membrane thickness|≈ 5 nm;Protein share of mass|≈ 50%', 'BIO:5.1 COB:3.4', k='membrane_structure', w='cell_membrane', mol='popc cholesterol')
use('cell_membrane')
n('bio_diffusion_osmosis','Diffusion and osmosis','concept','bio_fluid_mosaic bio_solutions_concentration','Passive movement down gradients.',
 'Particles spread from high to low concentration (diffusion). Water follows by osmosis across a semipermeable membrane toward higher solute concentration.',
 'Small nonpolar molecules (O2, CO2) cross membranes directly. Cells in hypotonic solution swell, in hypertonic solution shrink; plant walls prevent bursting.',
 'Fick\'s first law gives flux J = −D dC/dx. Aquaporins increase osmotic water permeability by ≈ 10–100-fold; Peter Agre received the 2003 Nobel for their discovery.',
 'Diffusion coefficient of glucose in water|≈ 6×10⁻¹⁰ m²/s;Aquaporin rate|≈ 3×10⁹ water/s', 'BIO:5.2 COB:3.5', f='J = −D·dC/dx', w='mol:water', lab='microscope:osmosis_cells')
n('bio_facilitated_transport','Channels and carriers (facilitated diffusion)','concept','bio_diffusion_osmosis','Proteins that help specific molecules cross.',
 'Channel and carrier proteins let ions and polar molecules cross membranes without energy, always downhill.',
 'Ion channels can be gated by voltage, ligand or force. GLUT transporters move glucose into cells.',
 'Channels conduct up to 10^7–10^8 ions/s while carriers cycle at 10²–10⁴ s⁻¹. Selectivity filters (K+ channel) discriminate by dehydration and coordination geometry.',
 'K+ channel selectivity|≈ 1000:1 over Na+;GLUT1 rate|≈ 10³ s⁻¹', 'BIO:5.2 ANP:3.1', w='cell_membrane')
n('bio_active_transport','Active transport and the Na⁺/K⁺ pump','process','bio_facilitated_transport bio_atp_energy_coupling','Pumping against gradients with ATP.',
 'The sodium-potassium pump uses ATP to push 3 Na+ out and 2 K+ in. It builds and maintains the ion gradients.',
 'It consumes about a quarter of resting ATP in the body and up to two-thirds in neurons. Secondary active transport (e.g. SGLT) uses the sodium gradient to import glucose.',
 'P-type ATPases phosphorylate an aspartate in the cycle. Digoxin inhibits the pump and raises intracellular Ca2+ in the heart. Co-transport and antiport couple solute movement to ion gradients.',
 'Stoichiometry|3 Na⁺ out : 2 K⁺ in per ATP;Share of resting ATP|≈ 20–25%', 'BIO:5.3 COB:3.6 ANP:3.1', w='cell_membrane', mol='atp')
n('bio_bulk_transport','Endocytosis and exocytosis','process','bio_fluid_mosaic','Moving large cargo in vesicles.',
 'Cells engulf material by endocytosis and release it by exocytosis, using membrane vesicles.',
 'Types include phagocytosis (cell eating), pinocytosis (cell drinking) and receptor-mediated endocytosis, which captures cholesterol-carrying LDL.',
 'Clathrin coats and dynamin pinch off vesicles; SNARE proteins mediate vesicle fusion. Defective LDL receptor endocytosis causes familial hypercholesterolemia.',
 'Clathrin vesicle|≈ 100 nm;SNARE complex|4-helix bundle', 'BIO:5.4 COB:3.6', w='cell_membrane', rel='macrophage')
n('bio_membrane_potential','Membrane potential','concept','bio_electrolytes_ions bio_active_transport','Voltage across cell membranes.',
 'Cells are electrically polarised, with the inside negative. Ion gradients and selective channels create this resting voltage.',
 'Resting potential is ≈ −70 mV in neurons, set mainly by K+ leak channels. Changes in this voltage are the basis of nerve signals.',
 'The Goldman–Hodgkin–Katz equation weights each ion by permeability. Mitochondria also maintain a ≈ −180 mV potential across their inner membrane.',
 'Neuron resting potential|≈ −70 mV;Mitochondrial inner membrane|≈ −180 mV', 'ANP:12.4 BIO:35.2', f='Vm = (RT/F)·ln[(ΣPₖ[K]ₒ + …)/(ΣPₖ[K]ᵢ + …)]', k='action_potential', w='neuron', rel='action_potential')
use('nucleus')
n('bio_nuclear_organization','Nucleus, nuclear pores and nucleolus','structure','bio_prokaryote_eukaryote','The cell\'s command centre.',
 'The nucleus holds chromosomes inside a double membrane with pores. The nucleolus inside builds ribosome parts.',
 'Nuclear pore complexes regulate traffic between nucleus and cytoplasm; mRNA exits while transcription factors enter.',
 'Each pore is ≈ 120 MDa made of ≈ 30 distinct nucleoporins and passes ≈ 1,000 translocations per second. The lamina gives mechanical support; mutations in lamin A cause progeria.',
 'Nuclear pore mass|≈ 120 MDa;Pores per nucleus|≈ 2,000–4,000', 'BIO:4.3 ANP:3.3', w='nucleus')
use('ribosome endoplasmic_reticulum golgi_apparatus')
n('bio_protein_targeting_secretory','Secretory pathway and protein targeting','process','bio_chaperones_proteostasis bio_glycoconjugates','Getting proteins to the right place.',
 'Proteins destined for secretion or membranes are made on ER-bound ribosomes, folded and glycosylated in the ER, sorted in the Golgi, and shipped in vesicles.',
 'A short signal sequence on the new chain directs it to the ER. Other signals send proteins to the nucleus, mitochondria or lysosomes.',
 'The signal recognition particle (SRP) pauses translation and docks the ribosome onto the translocon (Sec61). Mannose-6-phosphate tags direct enzymes to lysosomes; I-cell disease results from loss of the tagging enzyme.',
 'Signal peptide length|≈ 15–30 residues;Golgi cisternae|3–8', 'BIO:4.4 ANP:3.2', w='endoplasmic_reticulum', rel='golgi_apparatus')
use('lysosome')
n('bio_autophagy','Autophagy','process','bio_protein_targeting_secretory','Cells recycling their own parts.',
 'In autophagy a membrane wraps cytoplasm or damaged organelles and delivers them to lysosomes for breakdown and recycling.',
 'It is activated by starvation and stress, and clears damaged mitochondria (mitophagy) and aggregates. Yoshinori Ohsumi won the 2016 Nobel for discovering its mechanisms.',
 'The ATG gene family drives phagophore formation; mTOR inhibition triggers it. Impaired autophagy is linked to neurodegeneration and cancer, but tumours can also exploit it.',
 'Nobel Prize|2016 (Ohsumi);Autophagosome size|≈ 0.5–1.5 µm', 'BIO:4.4 ANP:3.2', w='lysosome')
use('peroxisome mitochondrion')
n('bio_endosymbiosis','Endosymbiotic theory','concept','bio_prokaryote_eukaryote bio_photosynthesis_overview','Mitochondria and chloroplasts as ex-bacteria.',
 'Mitochondria and chloroplasts descend from free-living bacteria engulfed by ancestral cells. They keep their own DNA and ribosomes and divide independently.',
 'Evidence: circular DNA, bacterial-type ribosomes, double membranes, and genes that group with alpha-proteobacteria (mitochondria) and cyanobacteria (chloroplasts). Lynn Margulis championed the idea in 1967.',
 'Most endosymbiont genes have moved to the nucleus; the human mtDNA retains only 37 genes (16.6 kb). Secondary endosymbiosis explains algae with 3–4 membranes around plastids. The identity of the archaeal host (Asgard archaea) is still being tested.',
 'Human mtDNA|16,569 bp, 37 genes;Mitochondria per cell|hundreds to thousands', 'BIO:23.1 BIO:4.3 COB:13.2', k='common_descent mitochondria_org chloroplast_org', c='C2',
 oq=['The exact nature of the host cell and the timing of mitochondrial acquisition relative to eukaryotic complexity (mitochondria-early vs late) remain debated.'], w='place:cell')
n('bio_chloroplasts_plastids','Chloroplasts and plastids','structure','bio_endosymbiosis','Plant organelles for photosynthesis and storage.',
 'Chloroplasts hold stacks of thylakoid membranes (grana) where light reactions occur, in a fluid called stroma.',
 'Other plastids store starch (amyloplasts) or pigments (chromoplasts). Chloroplast numbers per leaf cell range from ≈ 20 to 100.',
 'Chloroplast genomes are ≈ 120–160 kb with ≈ 100–130 genes. Chloroplasts import ≈ 3,000 proteins using TOC/TIC translocons.',
 'Chloroplasts per leaf cell|≈ 20–100;Chloroplast genome|≈ 120–160 kb', 'BIO:4.3 COB:5.1', k='chloroplast_org', w='place:leaf', mol='chlorophyll_a')
n('bio_cell_wall_ecm','Cell walls and extracellular matrix','structure','bio_polysaccharides bio_prokaryote_eukaryote','Outer layers that support and connect cells.',
 'Plant cells have cellulose walls, bacteria have peptidoglycan walls and fungi have chitin. Animal cells are embedded in an extracellular matrix of collagen and other proteins.',
 'Walls resist osmotic bursting; the ECM carries signals and guides cell migration. Collagen is the most abundant protein in the human body.',
 'Integrins link the ECM to the actin cytoskeleton and transmit mechanical signals (mechanotransduction). Primary vs secondary plant walls differ in composition; lignin makes wood rigid.',
 'Collagen share of body protein|≈ 25–30%;Bacterial wall|peptidoglycan', 'BIO:4.6 COB:3.3', w='connective_tissue_loose')
n('bio_cell_junctions','Cell junctions','structure','bio_fluid_mosaic','How neighbouring cells attach and communicate.',
 'Tight junctions seal gaps between cells, desmosomes act as spot rivets, and gap junctions form channels that let small molecules pass.',
 'Plant cells connect through plasmodesmata. Junctions let tissues act as units, for example synchronising heart cells.',
 'Gap junctions are made of connexins and pass molecules < 1 kDa. Tight junctions (claudins, occludin) set epithelial barrier properties and the blood–brain barrier.',
 'Gap junction cutoff|≈ 1 kDa;Plasmodesmata pore|≈ 3–50 nm', 'BIO:4.6 ANP:4.2', w='epithelial_tissue')
use('cytoskeleton')
n('bio_microtubules_motors','Microtubules and motor proteins','structure','bio_prokaryote_eukaryote','Tracks and trucks inside the cell.',
 'Microtubules are hollow tubes of tubulin that form tracks. Kinesin and dynein motors walk along them carrying cargo.',
 'Microtubules form the mitotic spindle and the core of cilia and flagella. Kinesin steps ≈ 8 nm per ATP.',
 'Dynamic instability (growth and catastrophe) lets spindles search and capture chromosomes. Taxol stabilises microtubules and kills dividing cells, and colchicine prevents polymerisation.',
 'Microtubule diameter|≈ 25 nm;Kinesin step|8 nm per ATP', 'BIO:4.5 COB:3.3', k='cytoskeleton_motors', w='cytoskeleton')
n('bio_actin_intermediate','Actin and intermediate filaments','structure','bio_prokaryote_eukaryote','Cell shape, movement and strength.',
 'Actin filaments drive crawling, pinch cells in two and work with myosin in muscle. Intermediate filaments such as keratin give tensile strength.',
 'Actin polymerises at one end and shrinks at the other (treadmilling), pushing the leading edge of moving cells.',
 'Arp2/3 nucleates branched actin networks; formins nucleate straight filaments. Intermediate filament types are tissue-specific and used as diagnostic markers.',
 'Actin filament diameter|≈ 7 nm;Intermediate filament|≈ 10 nm', 'BIO:4.5 ANP:3.2', k='cytoskeleton_motors', w='cytoskeleton')
n('bio_signaling_overview','Cell signaling: ligands, receptors and responses','concept','bio_fluid_mosaic','How cells sense and answer messages.',
 'A signalling molecule (ligand) binds a receptor, which starts a chain of events inside the cell leading to a response.',
 'Signals can act at a distance (endocrine), nearby (paracrine), on themselves (autocrine) or by direct contact. Receptors are at the surface or inside.',
 'Signalling networks add amplification, feedback and crosstalk. Response specificity arises from receptor type, scaffold proteins and cell context; typical receptor K_d ≈ nM.',
 'Receptor affinity|K_d ≈ nM;Signalling classes|endocrine, paracrine, autocrine, juxtacrine', 'BIO:9.1 BIO:9.2 BIO:9.3 COB:6.1', k='cell_signaling', w='cell_membrane')
n('bio_gpcr_signaling','G-protein-coupled receptors','process','bio_signaling_overview','The largest family of receptors.',
 'A GPCR spans the membrane seven times. When a ligand binds, it activates a G protein that triggers second messengers.',
 'About a third of approved drugs act on GPCRs, including beta blockers and antihistamines. Vision, smell and adrenaline responses use them.',
 'Gα exchanges GDP for GTP and dissociates from Gβγ; Gs activates adenylyl cyclase (cAMP), Gq activates PLC (IP3/DAG). β-arrestin terminates and redirects signalling. Lefkowitz and Kobilka won the 2012 Nobel.',
 'Human GPCRs|≈ 800;Drugs targeting GPCRs|≈ 30–35%', 'BIO:9.1 BIO:9.2', k='cell_signaling', w='cell_membrane', mol='camp', rel='hormone_signaling')
n('bio_rtk_cascades','Receptor tyrosine kinases and kinase cascades','process','bio_signaling_overview bio_covalent_regulation','Growth-factor signalling by phosphorylation.',
 'When a growth factor binds an RTK, receptors pair up and phosphorylate each other. This starts cascades such as Ras–MAP kinase.',
 'Cascades amplify the signal and end in changes to transcription factors. Mutations that lock Ras or RTKs "on" drive many cancers.',
 'SH2 domains dock to phosphotyrosines, Grb2/SOS activates Ras, and the Raf–MEK–ERK module relays the signal. Imatinib and other kinase inhibitors target these pathways.',
 'Ras mutated in|≈ 20–30% of human cancers;MAPK tiers|3 kinases', 'BIO:9.2 BIO:9.3', k='cell_signaling', w='cell_membrane', rel='signal_transduction_process')
n('bio_second_messengers','Second messengers and calcium signalling','concept','bio_gpcr_signaling','Small molecules that spread the message.',
 'cAMP, IP3, diacylglycerol and Ca2+ are small second messengers that relay and amplify signals.',
 'Cytosolic Ca2+ rises from ≈ 100 nM to ≈ 1 µM when channels open, triggering muscle contraction, secretion and fertilisation responses.',
 'Calmodulin decodes Ca2+ oscillations; phosphodiesterases degrade cAMP (caffeine inhibits them). Signal amplification: one activated receptor can generate thousands of second messengers.',
 'Resting cytosolic Ca²⁺|≈ 100 nM;Ca²⁺ during signal|≈ 1 µM', 'BIO:9.2 ANP:17.2', w='mol:camp', mol='camp')
n('bio_nuclear_receptors','Steroid and nuclear receptors','concept','bio_signaling_overview bio_steroids_terpenoids','Hormones that act directly on gene expression.',
 'Lipid-soluble hormones like cortisol, estrogen and thyroid hormone cross the membrane and bind receptors that act as transcription factors.',
 'The hormone–receptor complex binds hormone response elements in DNA and turns genes on or off. Effects are slower but longer lasting than membrane receptors.',
 'The nuclear receptor superfamily has ≈ 48 human members. Many drugs (tamoxifen, glucocorticoids) target them.',
 'Human nuclear receptors|≈ 48;Onset of action|minutes to hours', 'BIO:9.1 ANP:17.2', w='mol:cortisol', mol='cortisol estradiol thyroxine', rel='endocrine_system')
n('bio_cell_cycle','The cell cycle','process','bio_prokaryote_eukaryote','G1, S, G2 and M.',
 'Cells grow in G1, copy DNA in S, prepare in G2 and divide in M phase (mitosis and cytokinesis).',
 'Cell cycle lengths vary: ≈ 24 h in typical cultured human cells, ≈ 20 min for E. coli, and G0 for cells that exit the cycle such as neurons.',
 'Cyclin-dependent kinases (CDKs) partner with cyclins, whose abundance oscillates. Three main checkpoints: G1/S, G2/M and the spindle checkpoint in metaphase.',
 'Typical human cell cycle|≈ 24 h;S phase|≈ 8 h', 'BIO:10.2 COB:6.2', k='cell_cycle', w='place:cell', rel='mitosis')
n('bio_cell_cycle_control','Cell-cycle control, checkpoints and tumour suppressors','concept','bio_cell_cycle bio_rtk_cascades','Brakes and accelerators of division.',
 'Checkpoints stop the cycle if DNA is damaged or chromosomes are not aligned. Proteins like p53 and Rb act as brakes.',
 'Cyclin–CDK complexes push the cycle forward; p21 and p27 inhibit them. Mutated p53 is found in about half of human cancers.',
 'Rb holds E2F transcription factors until phosphorylated by CDK4/6. p53 senses DNA damage via ATM/ATR and induces arrest, repair or apoptosis; the anaphase-promoting complex triggers separation of sister chromatids.',
 'TP53 mutated in|≈ 50% of cancers;CDK4/6 inhibitors|approved for breast cancer', 'BIO:10.3 BIO:10.4 COB:6.3', k='cell_cycle cancer_biology', w='place:cell')
n('bio_cytokinesis_prokaryotic_division','Cytokinesis and binary fission','process','bio_cell_cycle','Splitting the cell in two.',
 'Animal cells pinch in two with a ring of actin and myosin; plant cells build a new wall; bacteria divide by binary fission.',
 'Bacteria use FtsZ, a tubulin relative, to form a ring at mid-cell. Under ideal conditions E. coli can divide every ≈ 20 min.',
 'Cytokinesis is positioned by the spindle midzone and regulated by RhoA. Min proteins in bacteria oscillate to keep the division ring at the centre.',
 'E. coli doubling time|≈ 20 min;Bacterial division protein|FtsZ', 'BIO:10.1 BIO:10.5 COB:6.4', w='place:cell')
n('bio_apoptosis','Apoptosis and cell death','process','bio_cell_cycle_control','Programmed cell suicide.',
 'Apoptosis is an orderly, controlled way for cells to die. It shapes tissues in development and removes damaged cells.',
 'A cascade of caspase enzymes cuts cell components. The cell shrinks, blebs and is eaten by neighbours without causing inflammation, unlike necrosis.',
 'Intrinsic pathway: mitochondrial cytochrome c release and apoptosome; extrinsic: death receptors (Fas). BCL-2 family proteins balance survival. In C. elegans exactly 131 of 1,090 somatic cells die by apoptosis.',
 'C. elegans cells dying|131;Adult human cells lost per day|≈ 50–70 billion', 'BIO:10.3 ANP:3.5', k='cell_cycle', w='place:cell', mol='')
n('bio_stem_cells_differentiation','Stem cells and differentiation','concept','bio_nuclear_organization bio_cell_cycle','Cells that can renew and become specialised.',
 'Stem cells divide to renew themselves and to produce cells that specialise. Embryonic stem cells can give rise to any cell type.',
 'Adult stem cells (bone marrow, gut crypts, skin) maintain tissues. Reprogramming adult cells to induced pluripotent stem cells (iPSC) won Yamanaka the 2012 Nobel.',
 'Pluripotency is maintained by OCT4, SOX2 and NANOG; differentiation involves epigenetic restriction. Applications include disease modelling, organoids and cell therapy; safety concerns include tumour formation.',
 'iPSC factors|OCT4, SOX2, KLF4, c-MYC;Gut epithelium turnover|≈ 3–5 days', 'ANP:3.6 BIO:10.1', k='cell_types development_biology', w='stem_cell', rel='stem_cell')
use('stem_cell')
n('bio_telomeres_senescence','Telomeres, senescence and ageing','concept','bio_cell_cycle_control','The cell\'s division counter.',
 'Telomeres are repeated DNA caps at chromosome ends that shorten with each division. When short, cells stop dividing (senescence).',
 'Telomerase rebuilds telomeres in stem and germ cells and is reactivated in most cancers. Hayflick found normal human cells divide ≈ 40–60 times.',
 'Human telomere repeat TTAGGG, 5–15 kb long at birth. Senescent cells secrete inflammatory factors (SASP); clearing them extends healthspan in mice. How much telomere loss drives human ageing is still being studied.',
 'Hayflick limit|≈ 40–60 divisions;Telomere repeat|TTAGGG', 'BIO:14.5 ANP:3.5', k='aging_biology', c='C2',
 oq=['How much replicative senescence and telomere erosion contribute to organismal ageing versus other hallmarks is unresolved.'], w='place:dna')
save('bio_cell')
