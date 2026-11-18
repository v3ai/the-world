from lib import *

section('bio_biochem', 'Biomolecules and biochemistry',
 'Carbohydrates, lipids, proteins, nucleic acids, enzymes and metabolism.',
 'Cells are built from four families of large molecules and run on enzymes. Metabolism is the web of reactions that turns food or light into energy and building blocks.',
 'Sugars store energy, lipids make membranes and fuel, proteins do most of the work, and nucleic acids store and read information. Enzymes speed reactions by orders of magnitude and are controlled by feedback.',
 'Biochemistry connects structure to function through thermodynamics and kinetics. Metabolic pathways are regulated at a few committed or irreversible steps, and flux is integrated across tissues by hormones.',
 'biomolecules_overview metabolism_overview')
# ---- carbohydrates
n('bio_monosaccharides','Monosaccharides','molecule','bio_fischer_cyclic_sugars bio_macromolecule_synthesis','Simple sugars such as glucose, fructose and ribose.',
 'Monosaccharides are single sugar units with the formula (CH2O)n. Glucose is the main fuel; ribose and deoxyribose are in RNA and DNA.',
 'Sugars are classed as aldoses or ketoses and by chain length (triose to heptose). Blood glucose is held near 5 mM.',
 'Glucose is transported by GLUT proteins and trapped in cells by hexokinase phosphorylation to glucose-6-phosphate. Non-enzymatic glycation of proteins (as in HbA1c) is a marker of long-term hyperglycaemia.',
 'Normal fasting blood glucose|≈ 4–5.5 mM;Glucose formula|C6H12O6', 'BIO:3.2 COB:2.3 ORG:25.1 ORG:25.7', k='carbohydrates_energy', w='mol:glucose_alpha', mol='glucose_alpha glucose_beta fructose galactose ribose deoxyribose')
n('bio_disaccharides','Disaccharides and glycosidic bonds','concept','bio_monosaccharides','Two sugars linked by a glycosidic bond.',
 'Sucrose, lactose and maltose are disaccharides. A glycosidic bond joins two sugars with loss of water.',
 'Lactose intolerance arises when lactase activity declines after weaning, so milk sugar reaches the colon.',
 'α(1→4), β(1→4), α(1→2) and other linkages give different shapes and digestibility. Lactase persistence evolved independently several times in pastoral populations.',
 'Sucrose|glucose + fructose;Lactose|glucose + galactose', 'BIO:3.2 ORG:25.8', w='mol:sucrose', mol='sucrose lactose maltose cellobiose')
n('bio_polysaccharides','Polysaccharides: starch, glycogen, cellulose, chitin','structure','bio_disaccharides','Sugar polymers for storage and structure.',
 'Starch (plants) and glycogen (animals) store glucose; cellulose and chitin build cell walls and exoskeletons.',
 'Glycogen is highly branched so many ends can be cleaved at once, giving rapid glucose release. Cellulose chains line up in hydrogen-bonded microfibrils that are very strong.',
 'Cellulose is the most abundant biopolymer on Earth, but only microbes (including gut symbionts of ruminants and termites) produce the cellulases to digest it. Chitin contains N-acetylglucosamine.',
 'Liver glycogen|≈ 100 g;Cellulose in wood|≈ 40–50% dry mass', 'BIO:3.2 ORG:25.9 COB:2.3', k='carbohydrates_energy', w='mol:cellotriose', mol='cellotriose n_acetylglucosamine glucose_alpha')
n('bio_glycoconjugates','Glycoproteins, glycolipids and the glycocalyx','structure','bio_polysaccharides','Sugars attached to proteins and lipids.',
 'Many proteins and lipids on the cell surface carry short sugar chains. These form a coat called the glycocalyx.',
 'ABO blood groups, cell recognition, immune signalling and viral attachment all depend on cell-surface glycans.',
 'N-linked glycosylation begins in the ER on a dolichol-linked precursor and is trimmed in the Golgi, serving as a folding-quality-control tag. Aberrant glycosylation is a hallmark of cancer.',
 'ABO antigen basis|terminal sugars;N-glycan precursor|14 sugar residues', 'BIO:4.6 ORG:25.10', w='cell_membrane', rel='cell_membrane')
# ---- lipids
n('bio_fatty_acids_fats','Fatty acids and triglycerides','molecule','bio_macromolecule_synthesis','Hydrocarbon chains that store energy.',
 'Fatty acids are long carbon chains with a carboxyl end. Three of them on a glycerol make a triglyceride (fat), the main long-term energy store.',
 'Saturated fats have no double bonds and pack tightly (solid at room temperature); unsaturated fats have kinks and stay liquid. Fat stores about twice the energy of carbohydrate per gram.',
 'Essential fatty acids (linoleic, α-linolenic) cannot be made by humans. Trans fats raise LDL; cis double bonds impart fluidity to membranes.',
 'Fat energy density|≈ 38 kJ/g (9 kcal/g);Typical chain length|16–18 C', 'BIO:3.3 ORG:27.1 COB:2.3', k='biomolecules_overview', w='mol:stearic_acid', mol='palmitic_acid stearic_acid oleic_acid linoleic_acid tripalmitin glycerol')
n('bio_membrane_lipids','Phospholipids, glycolipids and sphingolipids','structure','bio_fatty_acids_fats','Amphipathic lipids that form membranes.',
 'Phospholipids have a polar head and two fatty-acid tails. In water they assemble into bilayers with tails hidden inside.',
 'Head groups (choline, ethanolamine, serine) and tail saturation tune membrane charge and fluidity. Sphingolipids are enriched in the outer leaflet and in nerve myelin.',
 'The critical micelle concentration of bilayer-forming lipids is extremely low (≈ 10^-10 M), so bilayers are stable. Flip-flop between leaflets is slow without scramblases or flippases.',
 'Bilayer thickness|≈ 4–5 nm;Lateral diffusion of lipids|≈ 1 µm²/s', 'BIO:3.3 BIO:5.1 ORG:27.3', k='membrane_structure', w='mol:popc', mol='popc sphingosine choline ethanolamine')
n('bio_steroids_terpenoids','Steroids, terpenoids and signalling lipids','molecule','bio_fatty_acids_fats','Ring-based and isoprene-derived lipids with signalling roles.',
 'Cholesterol, sex hormones and cortisol are steroids built from four fused rings. Vitamins A and carotenoids are made from isoprene units.',
 'Cholesterol stiffens membranes and is the precursor of steroid hormones and bile acids. Eicosanoids such as prostaglandins are derived from arachidonic acid.',
 'Steroid hormones cross membranes and bind nuclear receptors that regulate transcription. Aspirin and ibuprofen inhibit cyclooxygenase, reducing prostaglandin synthesis.',
 'Human cholesterol synthesis|≈ 0.8–1 g/day;Steroid rings|4 fused (A–D)', 'BIO:3.3 ORG:27.5 ORG:27.6 ORG:27.4', w='mol:cholesterol', mol='cholesterol cortisol testosterone estradiol progesterone squalene isoprene')
# ---- proteins
n('bio_amino_acids','Amino acids','molecule','bio_chirality bio_acid_base_organic','The twenty building blocks of proteins.',
 'Every amino acid has an amino group, a carboxyl group and a side chain. The side chain makes each of the 20 standard amino acids unique.',
 'Side chains are nonpolar, polar, acidic or basic, and these properties drive folding. Nine are essential to humans.',
 'Selenocysteine (the 21st) and pyrrolysine (22nd) are encoded by recoded stop codons. Post-translational modifications (phosphorylation, glycosylation, methylation) greatly expand chemistry.',
 'Standard amino acids|20 (+ Sec, Pyl);Essential for humans|9', 'BIO:3.4 ORG:26.1 COB:2.3', k='protein_structure', w='mol:aa_gly', mol='aa_gly aa_ala aa_val aa_leu aa_ile aa_pro aa_phe aa_trp aa_met aa_ser aa_thr aa_cys aa_tyr aa_asn aa_gln aa_asp aa_glu aa_lys aa_arg aa_his aa_selenocysteine')
n('bio_peptide_bond','Peptide bond and polypeptides','structure','bio_amino_acids bio_acyl_substitution','Amino acids linked into chains.',
 'A peptide bond joins the carboxyl of one amino acid to the amino group of the next. A chain has an N-terminus and a C-terminus.',
 'The bond is planar and rigid, so the chain\'s flexibility comes mainly from rotations about the φ and ψ angles on either side.',
 'Ramachandran plots show which (φ, ψ) pairs are sterically allowed, explaining the helix and sheet regions. Peptide bond hydrolysis has t½ ≈ 400 years at neutral pH without catalysts.',
 'Peptide C–N bond length|≈ 1.33 Å;Typical protein length|≈ 300–400 residues', 'BIO:3.4 ORG:26.4', w='mol:polyglycine_5', mol='polyglycine_5')
n('bio_protein_structure','Four levels of protein structure','structure','bio_peptide_bond','Primary to quaternary structure.',
 'Primary structure is the amino-acid sequence, secondary is local folding (α-helix, β-sheet), tertiary is the full 3D shape and quaternary is how several chains assemble.',
 'Hydrogen bonds stabilise helices and sheets; hydrophobic burial, disulfides, salt bridges and metal ions stabilise tertiary and quaternary structure.',
 'Domains are independent folding units; motifs such as the helix–turn–helix recur in DNA-binding proteins. The Protein Data Bank holds > 200,000 experimental structures.',
 'α-helix|3.6 residues per turn, 5.4 Å pitch;Hemoglobin|4 subunits (α2β2)', 'BIO:3.4 ORG:26.9 COB:2.3', k='protein_structure', w='mol:aa_gly', rel='bio_hemoglobin_cooperativity', ext='RCSB Protein Data Bank|https://www.rcsb.org/')
n('bio_protein_folding','Protein folding','process','bio_protein_structure bio_noncovalent_forces','How a chain finds its working shape.',
 'A newly made chain folds into its native shape, often within seconds, guided by the amino-acid sequence.',
 'Anfinsen showed that sequence alone can specify the fold in vitro. Chaperones help prevent aggregation in crowded cells.',
 'Levinthal\'s paradox: random search is impossible, so folding follows a funnel-shaped energy landscape. AlphaFold-class networks now predict many structures from sequence, though kinetics, dynamics and folding pathways remain less well solved.',
 'Anfinsen experiment|1960s, ribonuclease A;AlphaFold database|> 200 million predicted structures', 'BIO:3.4 ORG:26.9', c='C2',
 oq=['Predicting folding pathways and kinetics, not just final structures, remains open.', 'How well structure predictors handle disordered regions, mutations and complexes is still being benchmarked.'],
 k='protein_structure', w='mol:aa_gly', rel='bio_chaperones_proteostasis')
n('bio_chaperones_proteostasis','Chaperones, misfolding and proteostasis','concept','bio_protein_folding','Quality control for proteins.',
 'Chaperones help proteins fold and rescue those that unfold under stress. Heat-shock proteins are a famous family.',
 'Misfolded proteins are tagged by ubiquitin and destroyed by the proteasome, or they aggregate and cause diseases such as Alzheimer\'s, Parkinson\'s and prion disease.',
 'Hsp70 and Hsp60 (GroEL) bind exposed hydrophobic patches and use ATP cycles to refold. The unfolded protein response in the ER senses misfolded load and retunes translation and chaperone production.',
 'GroEL cavity|≈ 8 nm;Hsp70 ATPase cycle|ATP-driven binding/release', 'BIO:3.4 BIO:4.4', w='place:cell', rel='endoplasmic_reticulum')
n('bio_ubiquitin_proteasome','Ubiquitin and the proteasome','process','bio_chaperones_proteostasis','Tagging proteins for destruction.',
 'A small protein called ubiquitin is attached in chains to doomed proteins. The proteasome recognises these tags and chops the protein into peptides.',
 'Three enzyme types (E1, E2, E3) attach ubiquitin; humans have ≈ 600 E3 ligases that give specificity. The system controls the cell cycle, signalling and stress responses.',
 'A K48-linked chain of ≥ 4 ubiquitins is the canonical proteasome signal, while K63 and mono-ubiquitination mark trafficking and DNA-repair roles. Targeted protein degradation (PROTACs) hijacks this machinery for drug design.',
 'Ubiquitin|76 residues, ≈ 8.6 kDa;Human E3 ligases|≈ 600', 'BIO:16.6 BIO:10.3', w='mol:aa_lys', rel='lysosome', ext='RCSB PDB: 1UBQ ubiquitin|https://www.rcsb.org/structure/1UBQ',
 d='The 2004 Nobel Prize in Chemistry went to Ciechanover, Hershko and Rose for discovering ubiquitin-mediated protein degradation.')
n('bio_hemoglobin_cooperativity','Hemoglobin and cooperative binding','structure','bio_protein_structure','A protein that shows how structure changes with ligand.',
 'Hemoglobin carries oxygen in red blood cells using four heme groups. Binding of oxygen to one subunit makes it easier for the others to bind.',
 'This cooperativity gives a sigmoidal oxygen-binding curve, so hemoglobin loads in the lungs and unloads in tissues. CO2, H+ and 2,3-BPG shift the curve (Bohr effect).',
 'T (tense) to R (relaxed) quaternary transition explains cooperativity in the MWC model; Hill coefficient ≈ 2.8. Fetal hemoglobin has higher affinity thanks to weaker 2,3-BPG binding.',
 'Hill coefficient|≈ 2.8;O2 per Hb|up to 4', 'ANP:22.5 BIO:39.4', f='Y = pⁿ/(P₅₀ⁿ + pⁿ)', k='heme_oxygen', w='mol:heme_b', mol='heme_b', ext='RCSB PDB: 4HHB hemoglobin|https://www.rcsb.org/structure/4HHB')
n('bio_protein_analysis','Protein purification and analysis','technique','bio_protein_structure','Separating and studying proteins.',
 'Proteins are separated by size (gel electrophoresis), charge or affinity, and measured by antibody-based methods such as Western blots.',
 'SDS-PAGE unfolds proteins and coats them with charge, so migration reflects molecular weight. Chromatography steps (size, ion exchange, affinity tags) purify them.',
 'Mass spectrometry identifies proteins and modifications in complex mixtures. X-ray crystallography, NMR and cryo-EM give structures; typical cryo-EM resolutions now reach ≈ 1.2–3 Å.',
 'SDS-PAGE separates by|size (kDa);Cryo-EM Nobel|2017', 'BIO:17.1 MIC:12.2 ORG:26.5', w='')
# ---- nucleic acids
n('bio_nucleotides','Nucleotides and nucleic acids','molecule','bio_phosphoryl_transfer bio_fischer_cyclic_sugars','Base + sugar + phosphate, and the chains they form.',
 'A nucleotide has a nitrogenous base, a five-carbon sugar and one or more phosphates. DNA and RNA are chains of nucleotides.',
 'DNA uses deoxyribose and bases A, T, G, C; RNA uses ribose and A, U, G, C. Chains run 5′ to 3′ with a sugar–phosphate backbone.',
 'Purines (A, G) and pyrimidines (C, T, U) are synthesised by de novo and salvage pathways. Nucleotides also serve as energy (ATP, GTP), signals (cAMP) and cofactors (NAD, FAD, CoA).',
 'Bases in DNA|A, T, G, C;Human haploid genome|≈ 3.1 × 10⁹ bp', 'BIO:3.5 ORG:28.1 COB:2.3', k='dna_structure', w='mol:adenine', mol='adenine guanine cytosine thymine uracil dtmp dcmp dgmp damp amp ump gtp camp')
n('bio_rna_types','RNA types and structure','structure','bio_nucleotides','Messenger, transfer, ribosomal and regulatory RNAs.',
 'RNA is usually single-stranded and can fold into shapes. mRNA carries the message, tRNA brings amino acids, rRNA forms ribosomes.',
 'Ribozymes are RNAs that catalyse reactions, including the ribosome\'s peptide bond formation. Small RNAs (miRNA, siRNA) silence genes.',
 'Only ≈ 1–2% of the human genome codes for protein, yet ≈ 75% is transcribed at some level; the functional share of noncoding transcripts is debated. rRNA makes ≈ 80% of total cellular RNA.',
 'rRNA share of RNA|≈ 80%;mRNA share|≈ 2–5%', 'BIO:3.5 ORG:28.1', k='rna_world', w='mol:uracil')
# ---- enzymes
n('bio_enzyme_catalysis','Enzymes as biological catalysts','concept','bio_reaction_kinetics bio_protein_structure','Proteins that speed reactions up to a trillion-fold.',
 'Enzymes bind a substrate at the active site and turn it into product. They are not used up and make reactions fast enough for life.',
 'They lower activation energy by orienting substrates, straining bonds and providing acid–base or covalent catalysis. Each is highly specific.',
 'Rate enhancements range from 10^6 to > 10^17 (orotidine decarboxylase). Catalytic proficiency reflects transition-state binding much tighter than substrate binding.',
 'Orotidine decarboxylase speed-up|≈ 10^17;Carbonic anhydrase kcat|≈ 10^6 s⁻¹', 'BIO:6.5 COB:4.1 ORG:26.10', k='enzymes', w='mol:aa_ser', rel='bio_active_site_induced_fit')
n('bio_active_site_induced_fit','Active site and induced fit','concept','bio_enzyme_catalysis','The pocket where chemistry happens.',
 'The active site is a small pocket whose shape and chemistry fit the substrate. Binding can make it close around the substrate, called induced fit.',
 'Lock-and-key was the older picture; induced fit and conformational selection show enzymes are flexible.',
 'Catalytic triads (Ser–His–Asp in chymotrypsin) and metal ions position nucleophiles. Dynamics on µs–ms timescales couple with the catalytic step.',
 'Chymotrypsin triad|Ser195, His57, Asp102;Active site size|few residues in a large protein', 'BIO:6.5 ORG:26.11', w='mol:aa_his')
n('bio_cofactors_coenzymes','Cofactors, coenzymes and vitamins','concept','bio_enzyme_catalysis','Helpers that enzymes need to work.',
 'Many enzymes need metal ions or small organic helpers (coenzymes). Many vitamins are the precursors of coenzymes.',
 'NAD+ carries hydride, FAD carries electrons, coenzyme A carries acyl groups, and biotin carries CO2.',
 'Examples: thiamine pyrophosphate (decarboxylations), pyridoxal phosphate (amino-acid transformations), folate (one-carbon units), B12 (rearrangements). Deficiencies cause beriberi, pellagra, scurvy and others.',
 'NAD+ from|niacin (B3);One-carbon carrier|folate (B9)', 'BIO:6.5 ORG:26.10', w='mol:nad_plus', mol='nad_plus fad thiamine pyridoxal_phosphate biotin folic_acid lipoic_acid niacin riboflavin ascorbic_acid')
n('bio_michaelis_menten','Michaelis–Menten kinetics','law','bio_active_site_induced_fit','How reaction rate depends on substrate concentration.',
 'At low substrate, rate rises in proportion to substrate; at high substrate the enzyme saturates and the rate levels off at Vmax.',
 'Km is the substrate level giving half-maximal rate; a low Km means tight binding. kcat is the turnover number per enzyme per second.',
 'Derived from E + S ⇌ ES → E + P with the steady-state assumption: Km = (k₋₁ + kcat)/k₁. The ratio kcat/Km (≤ 10^8–10^9 M⁻¹s⁻¹, diffusion limit) measures catalytic efficiency.',
 'Typical Km|≈ 10⁻⁵–10⁻² M;Catalase kcat|≈ 4×10⁷ s⁻¹', 'BIO:6.5 CHE:12.7', f='v = Vmax·[S]/(Km + [S])', k='enzymes reaction_kinetics', w='mol:aa_ser', lab='enzyme:michaelis_menten', rel='derivative')
n('bio_lineweaver_burk','Linearised enzyme plots','technique','bio_michaelis_menten','Straight-line views of enzyme data.',
 'Plotting 1/v against 1/[S] gives a straight line from which Vmax and Km can be read.',
 'Lineweaver–Burk plots make inhibition types obvious by the pattern of intersecting lines, though they distort error.',
 'Because the double-reciprocal plot amplifies noise at low [S], modern practice fits the hyperbola by nonlinear regression. Eadie–Hofstee and Hanes–Woolf plots are alternatives.',
 'Y-intercept|1/Vmax;X-intercept|−1/Km', 'BIO:6.5', f='1/v = (Km/Vmax)(1/[S]) + 1/Vmax', lab='enzyme:lineweaver_burk', w='')
n('bio_enzyme_inhibition','Enzyme inhibition','concept','bio_michaelis_menten','How drugs and regulators slow enzymes.',
 'Competitive inhibitors compete with the substrate for the active site; noncompetitive inhibitors bind elsewhere and reduce activity.',
 'Competitive inhibition raises apparent Km but not Vmax; noncompetitive lowers Vmax but not Km; uncompetitive lowers both. Many drugs are enzyme inhibitors (statins, penicillin, aspirin).',
 'Ki quantifies inhibitor affinity. Irreversible inhibitors form covalent bonds (aspirin acetylates COX; penicillin acylates transpeptidase). Transition-state analogues bind with Ki orders of magnitude below Km.',
 'Statins inhibit|HMG-CoA reductase;Penicillin targets|bacterial transpeptidases', 'BIO:6.5 ORG:26.10', lab='enzyme:inhibition', w='mol:penicillin_g', mol='penicillin_g aspirin ibuprofen warfarin')
n('bio_allostery','Allosteric regulation and cooperativity','concept','bio_enzyme_inhibition bio_hemoglobin_cooperativity','Binding at one site changes activity at another.',
 'Allosteric enzymes have regulatory sites away from the active site. Binding of an activator or inhibitor changes the enzyme\'s shape and activity.',
 'These enzymes show sigmoidal rather than hyperbolic kinetics. Phosphofructokinase is turned down by ATP and citrate and up by AMP.',
 'MWC (concerted) and KNF (sequential) models describe T/R state transitions. Allostery underlies feedback inhibition, receptor activation and signalling switches.',
 'PFK-1 inhibited by|ATP, citrate;PFK-1 activated by|AMP, fructose-2,6-bisphosphate', 'BIO:6.5 BIO:7.7', lab='enzyme:allosteric', w='mol:amp', mol='amp atp')
n('bio_enzyme_conditions','Temperature, pH and enzyme activity','concept','bio_enzyme_catalysis bio_acids_bases_ph','Why enzymes have optimal conditions.',
 'Enzymes work best in a narrow temperature and pH range. Too hot or too far from the optimum and they lose shape and activity (denature).',
 'Human enzymes peak near 37 °C and neutral pH, but pepsin works near pH 2 and Taq polymerase survives 95 °C.',
 'Rate rises with temperature until unfolding dominates, giving a bell-shaped curve. Extremophile enzymes underlie PCR (Taq) and laundry detergents (proteases).',
 'Pepsin optimum|pH ≈ 2;Taq polymerase|stable at 95 °C', 'BIO:6.5', lab='enzyme:ph_temperature', w='')
n('bio_covalent_regulation','Covalent regulation and zymogens','concept','bio_enzyme_catalysis','On/off switching by chemical modification or cleavage.',
 'Enzymes can be switched on or off by attaching phosphate groups or by cutting an inactive precursor (zymogen).',
 'Digestive proteases and blood clotting factors are made as zymogens to prevent damage. Kinases and phosphatases add and remove phosphate in signalling.',
 'Phosphorylation cascades amplify signals; glycogen phosphorylase is activated by phosphorylation and by AMP. Zymogen activation is often a cascade (chymotrypsinogen → chymotrypsin; coagulation).',
 'Human kinome|≈ 500 kinases;Trypsinogen activator|enteropeptidase', 'BIO:6.5 BIO:9.3', w='mol:phosphate', rel='blood_clotting')
# ---- metabolism
n('bio_metabolism_overview','Metabolism: anabolism and catabolism','concept','bio_atp_energy_coupling bio_enzyme_catalysis','The sum of the cell\'s chemical reactions.',
 'Catabolic pathways break down fuel and release energy; anabolic pathways build molecules and use energy. ATP links them.',
 'Pathways are sequences of enzyme steps with shared intermediates. Their rates are controlled at a few key steps.',
 'Metabolic flux is regulated by substrate availability, allostery, covalent modification and enzyme amount. Flux control analysis shows control is shared among steps.',
 'Basal metabolic rate (human)|≈ 1,400–1,800 kcal/day;ATP yield from glucose|≈ 30–32', 'BIO:6.1 COB:4.1 CHE:5.1', k='metabolism_overview', w='mol:atp', rel='cellular_respiration')
n('bio_glycolysis','Glycolysis','process','bio_metabolism_overview bio_monosaccharides','Splitting glucose into two pyruvates.',
 'Glycolysis is a ten-step pathway in the cytosol that converts one glucose to two pyruvate, with a small net gain of ATP and NADH.',
 'It uses two ATP early and makes four later (net 2 ATP) plus 2 NADH. It works without oxygen and is common to nearly all life.',
 'Regulated at hexokinase, PFK-1 (the committed step) and pyruvate kinase. Tumours often show the Warburg effect: high glycolysis even in the presence of oxygen.',
 'Net ATP|2 per glucose;Location|cytosol', 'BIO:7.2 COB:4.2 ORG:29.5 MIC:8.2', k='metabolism_overview', w='mol:glucose_6_phosphate', mol='glucose_alpha glucose_6_phosphate pyruvate phosphoenolpyruvate nadh atp', rel='glycolysis_process')
n('bio_fermentation','Fermentation','concept','bio_glycolysis','Making ATP without oxygen.',
 'When oxygen is absent, cells regenerate NAD+ by turning pyruvate into lactate or ethanol so glycolysis can continue.',
 'Muscles make lactate during intense work; yeast makes ethanol and CO2, the basis of bread, wine and beer.',
 'Fermentation yields only ≈ 2 ATP per glucose versus ≈ 30 with oxygen. Lactate is recycled by the liver (Cori cycle) and heart.',
 'ATP per glucose|2;Yeast end products|ethanol + CO2', 'BIO:7.5 COB:4.4 MIC:8.4', w='mol:lactate', mol='lactate ethanol pyruvate')
n('bio_pyruvate_oxidation','Pyruvate oxidation','process','bio_glycolysis','Preparing fuel for the citric acid cycle.',
 'In mitochondria, pyruvate loses a carbon as CO2 and the rest is attached to coenzyme A as acetyl-CoA, making NADH.',
 'The pyruvate dehydrogenase complex is a huge enzyme machine with three enzymes and five coenzymes. This step is irreversible.',
 'PDH is inhibited by its products and by phosphorylation (PDH kinase), connecting it to energy status. Thiamine deficiency impairs it, causing lactic acidosis.',
 'Products per pyruvate|1 CO2, 1 NADH, 1 acetyl-CoA;Complex size|≈ 10 MDa', 'BIO:7.3 ORG:29.6', w='mol:pyruvate', mol='pyruvate acetate thiamine lipoic_acid')
n('bio_krebs_cycle','Citric acid (Krebs) cycle','process','bio_pyruvate_oxidation','Burning acetyl units to CO2 and reduced carriers.',
 'Acetyl-CoA joins oxaloacetate to form citrate, which is oxidised through eight steps back to oxaloacetate, releasing CO2 and loading NADH and FADH2.',
 'Each acetyl-CoA yields 3 NADH, 1 FADH2, 1 GTP/ATP and 2 CO2. Intermediates feed biosynthesis, so the cycle is also a hub for anabolism.',
 'Key regulated enzymes: citrate synthase, isocitrate dehydrogenase, α-ketoglutarate dehydrogenase. Anaplerotic reactions replenish intermediates drained for synthesis.',
 'Per acetyl-CoA|3 NADH, 1 FADH2, 1 GTP;Location|mitochondrial matrix', 'BIO:7.3 COB:4.3 ORG:29.7', w='mol:citrate', mol='citrate oxaloacetate alpha_ketoglutarate succinate fumarate malate acetate nadh fad', rel='krebs_cycle_process mitochondrion')
n('bio_electron_transport_chain','Electron transport chain','structure','bio_krebs_cycle bio_redox_biology','Complexes that pass electrons to oxygen and pump protons.',
 'Electrons from NADH and FADH2 are handed down a chain of protein complexes in the inner mitochondrial membrane. The energy released pumps protons out.',
 'Complexes I, III and IV pump protons; Complex II feeds in from succinate. Oxygen is the final electron acceptor, forming water.',
 'Mobile carriers are ubiquinone and cytochrome c. Cyanide blocks Complex IV and uncouplers (DNP) dissipate the gradient; mitochondrial supercomplexes ("respirasomes") improve channelling.',
 'Protons pumped per NADH|≈ 10;Gradient|≈ 150–200 mV', 'BIO:7.4 MIC:8.3', k='oxidative_phosphorylation mitochondria_org', w='mol:ubiquinone_q1', mol='ubiquinone_q1 heme_b nadh oxygen', rel='oxidative_phosphorylation_process')
n('bio_chemiosmosis_atp_synthase','Chemiosmosis and ATP synthase','structure','bio_electron_transport_chain','A rotary motor that makes ATP from a proton gradient.',
 'Protons flow back through ATP synthase, spinning a rotor that drives ATP formation. This is chemiosmosis.',
 'The proton-motive force combines a pH difference and a membrane voltage. The same principle works in chloroplasts and in bacteria.',
 'ATP synthase has an F₀ rotor (c-ring of 8–15 subunits) and an F₁ head with three catalytic sites cycling through binding-change states. About 3–4 H⁺ are needed per ATP, giving ≈ 2.5 ATP/NADH and 1.5 ATP/FADH2.',
 'Rotation speed|≈ 100–150 rev/s;ATP per NADH|≈ 2.5', 'BIO:7.4 MIC:8.3', f='Δp = Δψ − (2.3RT/F)·ΔpH', k='oxidative_phosphorylation', w='mol:adp', mol='atp adp phosphate',
 d='Peter Mitchell proposed chemiosmosis in 1961, was mocked at first, and won the 1978 Nobel Prize in Chemistry.')
n('bio_beta_oxidation','Fatty-acid (β) oxidation','process','bio_krebs_cycle bio_fatty_acids_fats','Turning fats into acetyl-CoA.',
 'Fatty acids are chopped two carbons at a time into acetyl-CoA, generating NADH and FADH2.',
 'Each round of β-oxidation has four steps: oxidation, hydration, oxidation and thiolysis. A 16-carbon palmitate gives ≈ 106 ATP in total.',
 'Carnitine shuttles long-chain fatty acids into mitochondria (the regulated step, inhibited by malonyl-CoA). Very-long-chain fatty acids are first shortened in peroxisomes.',
 'Palmitate net ATP|≈ 106;Rounds for palmitate|7', 'BIO:7.6 ORG:29.3 ANP:24.3', w='mol:palmitic_acid', mol='palmitic_acid carnitine acetate fad nadh')
n('bio_gluconeogenesis','Gluconeogenesis and glycogen metabolism','process','bio_glycolysis','Making and breaking glucose stores.',
 'When fasting, the liver builds glucose from lactate, amino acids and glycerol (gluconeogenesis) and breaks glycogen into glucose.',
 'Gluconeogenesis bypasses the three irreversible glycolytic steps with four distinct enzymes. Insulin and glucagon reciprocally control these pathways.',
 'Glycogen phosphorylase and glycogen synthase are reciprocally regulated by phosphorylation cascades (cAMP-PKA). Brain uses ≈ 120 g glucose per day and cannot use fatty acids directly.',
 'Brain glucose use|≈ 120 g/day;Liver glycogen|≈ 100 g', 'ORG:29.8 BIO:7.6 ANP:24.2', w='mol:glucose_6_phosphate', mol='glucose_6_phosphate lactate pyruvate glycerol', rel='hormone_signaling')
n('bio_pentose_phosphate_pathway','Pentose phosphate pathway','process','bio_glycolysis','A branch that makes NADPH and ribose.',
 'This pathway makes NADPH (for biosynthesis and antioxidant defence) and ribose-5-phosphate (for nucleotides) from glucose-6-phosphate.',
 'It is especially active in liver, fat, adrenal tissue and red blood cells, which need NADPH to keep glutathione reduced.',
 'G6PD deficiency (≈ 400 million carriers) makes red cells vulnerable to oxidative stress, causing hemolysis after fava beans or certain drugs, yet protects against malaria.',
 'G6PD deficiency|≈ 400 million people;Main products|NADPH, ribose-5-P', 'BIO:7.6', w='mol:ribose', mol='ribose glutathione')
n('bio_amino_acid_catabolism','Amino-acid catabolism and the urea cycle','process','bio_krebs_cycle bio_amino_acids','Disposing of nitrogen.',
 'Amino groups are removed from amino acids (transamination) and converted to urea in the liver. The carbon skeletons enter energy pathways.',
 'Ammonia is toxic, so it is converted to urea (humans), uric acid (birds, reptiles) or excreted directly as ammonia (fish).',
 'Urea cycle: ammonia + CO2 + 3 ATP → urea. Defects cause hyperammonemia. Glucogenic amino acids can make glucose; ketogenic ones make acetyl-CoA.',
 'Urea cycle cost|≈ 4 ATP-equivalents per urea;Daily urea excretion|≈ 20–35 g', 'ORG:29.9 BIO:7.6 ANP:24.4', w='mol:urea', mol='urea ornithine citrulline ammonia pyridoxal_phosphate')
n('bio_fatty_acid_synthesis','Fatty-acid and lipid biosynthesis','process','bio_beta_oxidation','Building fats from acetyl-CoA.',
 'When energy is plentiful, cells convert excess acetyl-CoA into fatty acids and store them as fat.',
 'Fatty acid synthase builds chains two carbons at a time using malonyl-CoA and NADPH. Insulin promotes the pathway and glucagon blocks it.',
 'Acetyl-CoA carboxylase (ACC) is the regulated step, activated by citrate and inhibited by AMPK phosphorylation. Cholesterol synthesis (HMG-CoA reductase) is another controlled branch.',
 'Chain built by FAS|palmitate (C16);Regulated enzyme|ACC (biotin)', 'ORG:29.4 ORG:27.7 ANP:24.3', w='mol:palmitic_acid', mol='palmitic_acid biotin')
n('bio_photosynthesis_overview','Photosynthesis: overview','process','bio_redox_biology bio_atp_energy_coupling','Turning light, water and CO2 into sugar and oxygen.',
 'Plants, algae and cyanobacteria capture light energy to make sugars from CO2 and water, releasing oxygen.',
 'Two stages: light reactions in thylakoid membranes make ATP and NADPH; the Calvin cycle in the stroma uses them to fix CO2. Chlorophyll absorbs mainly red and blue light.',
 'Net: 6 CO2 + 12 H2O + light → C6H12O6 + 6 O2 + 6 H2O. Global net primary productivity ≈ 100–120 Pg C/yr, split roughly equally between land and ocean.',
 'Global NPP|≈ 100–120 Pg C/yr;Efficiency (leaf, light to biomass)|≈ 1–2%', 'BIO:8.1 COB:5.1 MIC:8.6', f='6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', k='photosynthesis_light', w='place:leaf', mol='chlorophyll_a glucose_alpha oxygen carbon_dioxide water')
n('bio_light_reactions','Light-dependent reactions','structure','bio_photosynthesis_overview bio_electron_transport_chain','Photosystems that split water and make ATP and NADPH.',
 'Light excites chlorophyll in photosystem II, which splits water and releases oxygen. Electrons travel down a chain to photosystem I and finally to NADP+.',
 'The chain pumps protons into the thylakoid lumen, and ATP synthase uses that gradient to make ATP. This is photophosphorylation.',
 'The Z-scheme describes the energetics of linear electron flow; cyclic flow around PSI makes extra ATP. The oxygen-evolving complex has a Mn4CaO5 cluster that cycles through S0–S4 states.',
 'PSII reaction center|P680;PSI reaction center|P700', 'BIO:8.2 COB:5.2', k='photosynthesis_light chloroplast_org', w='mol:chlorophyll_a', mol='chlorophyll_a beta_carotene', rel='photosynthesis_light_process')
n('bio_calvin_cycle','Calvin cycle (carbon fixation)','process','bio_light_reactions','Building sugar from CO2.',
 'In the stroma, the enzyme Rubisco attaches CO2 to a five-carbon sugar. Using ATP and NADPH, the product is turned into G3P, which makes glucose and regenerates the starting sugar.',
 'Three turns fix 3 CO2 and net one G3P at a cost of 9 ATP and 6 NADPH. Rubisco is slow (≈ 3–10 s⁻¹) and also fixes O2, which wastes energy.',
 'Rubisco is thought to be the most abundant enzyme on Earth. Its oxygenase activity drives photorespiration, which has motivated C4, CAM, and engineering efforts to improve carbon fixation.',
 'Cost per G3P|9 ATP + 6 NADPH;Rubisco kcat|≈ 3–10 s⁻¹', 'BIO:8.3 COB:5.3', k='photosynthesis_light', w='mol:carbon_dioxide', mol='carbon_dioxide', rel='calvin_cycle_process')
n('bio_metabolic_regulation','Regulation of metabolism','concept','bio_allostery bio_glycolysis','Controlling flux with feedback and hormones.',
 'Cells speed up or slow down pathways with feedback: end products inhibit early steps, and low ATP switches on ATP-making pathways.',
 'Key regulators: AMPK (energy sensor), insulin, glucagon and adrenaline (hormones), and substrate availability.',
 'Flux control is distributed; covalent modification and gene expression give slower, longer-lasting control. The Pasteur effect (glycolysis slows in oxygen) and the Crabtree effect (aerobic fermentation at high glucose) are classic examples.',
 'Fasting insulin|≈ 3–25 µIU/mL;AMPK activated by|high AMP/ATP', 'BIO:7.7 ANP:24.5', w='mol:amp', k='metabolism_overview', rel='hormone_signaling pancreatic_islets')
n('bio_metabolic_integration','Metabolic integration and fuel use','concept','bio_metabolic_regulation bio_gluconeogenesis bio_beta_oxidation','How organs share fuel across fed, fasting and exercising states.',
 'After a meal the body stores glucose as glycogen and fat; between meals, it releases them. In long fasting, the liver makes ketone bodies.',
 'Liver, muscle, fat and brain each have a different fuel profile. Insulin dominates the fed state; glucagon, cortisol and adrenaline dominate fasting.',
 'Diabetes mellitus results from insufficient insulin (type 1) or insulin resistance (type 2). During prolonged fasting the brain derives ≈ 60–70% of its energy from ketones.',
 'Ketone adaptation|≈ 3 days of fasting;Type 2 diabetes prevalence|≈ 10% of adults', 'ANP:24.5 BIO:7.6 ANP:17.9', w='liver', rel='liver pancreas')
save('bio_biochem')
