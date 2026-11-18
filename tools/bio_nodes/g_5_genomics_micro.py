from lib import *

section('bio_genomics', 'Genomics, biotechnology and bioinformatics',
 'Reading, copying and editing DNA, and analysing biological data.',
 'Biotechnology uses cells and molecules as tools. PCR copies DNA, gels separate it, sequencers read it, and CRISPR edits it.',
 'Sequencing has become a million-fold cheaper in two decades, producing datasets that need computing to interpret. Alignment, phylogenetics and omics methods turn raw sequences into biological insight.',
 'Method choice depends on read length, throughput, error profile and cost. Editing technologies raise safety and ethics questions that are as important as the technical ones.',
 'crispr_biotech chromatin_genome')
n('bio_gel_electrophoresis','Gel electrophoresis','technique','bio_dna_structure','Separating DNA, RNA or proteins by size.',
 'An electric field pulls charged molecules through a gel; smaller pieces move faster, so fragments separate by size.',
 'DNA is stained (ethidium bromide or safer dyes) and compared to a ladder of known sizes. Agarose is used for DNA, polyacrylamide for proteins and small DNA.',
 'Migration is roughly linear in log10 (size) over a range. Pulsed-field gels separate megabase DNA; capillary electrophoresis underlies automated sequencing.',
 'Typical agarose gel|0.7–2%;Voltage|≈ 5–10 V/cm', 'BIO:17.1 MIC:12.2', k='crispr_biotech', w='mol:bp_AT', lab='molecule:gel_electrophoresis')
n('bio_pcr','Polymerase chain reaction (PCR)','technique','bio_replication_machinery bio_enzyme_conditions','Exponentially copying a chosen DNA region.',
 'PCR uses heat cycles, short primers and a heat-stable DNA polymerase to make millions of copies of one DNA segment.',
 'Each cycle (denature ≈ 95 °C, anneal ≈ 55–65 °C, extend ≈ 72 °C) roughly doubles the target, so 30 cycles give ≈ 10⁹ copies. Kary Mullis devised it in 1983 (Nobel 1993).',
 'Primer design (Tm, specificity), polymerase fidelity and inhibitors determine success. qPCR measures amplification in real time; RT-PCR starts from RNA; digital PCR counts single molecules.',
 'Copies after n cycles|2ⁿ;Typical run|25–35 cycles, 1–2 h', 'BIO:17.1 MIC:12.2 ORG:28.8', f='N = N₀·2ⁿ', k='crispr_biotech', w='mol:bp_AT', lab='molecule:pcr_amplification', rel='pcr_process')
n('bio_restriction_cloning','Restriction enzymes and DNA cloning','technique','bio_gel_electrophoresis','Cutting and pasting DNA.',
 'Restriction enzymes cut DNA at specific sequences; DNA ligase pastes fragments into a vector such as a plasmid.',
 'Cloned plasmids are put into bacteria (transformation), which copy the DNA as they grow. Antibiotic resistance genes help select the cells that took up the plasmid.',
 'Type II enzymes recognise 4–8 bp palindromes and leave sticky or blunt ends. Modern cloning also uses Gibson assembly and Golden Gate. Blue–white screening uses lacZ to detect inserts.',
 'EcoRI site|GAATTC;Typical plasmid size|≈ 3–10 kb', 'BIO:17.1 MIC:12.1 COB:10.1', k='crispr_biotech', w='place:pond')
n('bio_recombinant_expression','Recombinant protein expression','technique','bio_restriction_cloning bio_lac_operon','Making proteins in host cells.',
 'A gene is put into bacteria, yeast or other cells so they make a human or useful protein, such as insulin.',
 'Human insulin made in E. coli was approved in 1982. Systems include bacteria, yeast, insect and mammalian cells, chosen by folding and modification needs.',
 'Expression is commonly driven by IPTG-inducible T7 promoters; inclusion bodies, codon bias and missing glycosylation are common problems. Therapeutic antibodies are produced in CHO cells.',
 'First recombinant drug|human insulin, 1982;Common host|E. coli BL21', 'BIO:17.1 MIC:12.1 COB:10.2', k='crispr_biotech', w='mol:aa_gly')
n('bio_sanger_sequencing','Sanger sequencing','technique','bio_pcr','Chain-termination DNA sequencing.',
 'A polymerase copies DNA with a few chain-stopping bases that carry fluorescent tags. Fragments ending at each base are sorted by size to read the sequence.',
 'Reads are up to ≈ 800–1,000 bases with high accuracy (≈ 99.99%). It was used for the Human Genome Project and is still the gold standard for verifying clones.',
 'Capillary arrays read 96 samples in parallel. Read-quality scores (Phred Q = −10 log₁₀P) quantify base-call confidence.',
 'Read length|≈ 800–1,000 bp;Invented|Sanger, 1977', 'BIO:14.2 MIC:12.2 ORG:28.6', f='Q = −10·log₁₀(P_error)', k='crispr_biotech', w='place:dna', rel='sanger_ngs_sequencing_process')
n('bio_ngs','Next-generation sequencing','technique','bio_sanger_sequencing','Massively parallel DNA reading.',
 'Instead of one fragment at a time, NGS reads millions to billions of short fragments simultaneously, typically 100–300 bases each.',
 'Illumina sequencing-by-synthesis images fluorescent bases added cycle by cycle. Sequencing a human genome fell from ≈ $3 billion (2003) to ≈ $200–600 now.',
 'Coverage (reads per base, ≈ 30× for human WGS) determines variant-calling confidence. Long-read platforms (PacBio HiFi, Oxford Nanopore) give 10 kb–Mb reads that resolve repeats and structural variants.',
 'Human genome sequencing cost|≈ $200–600;Standard coverage|≈ 30×', 'BIO:17.3', k='crispr_biotech', w='place:dna', lab='molecule:ngs_library')
n('bio_genome_assembly','Genome assembly and annotation','technique','bio_ngs','From reads to a genome and its genes.',
 'Short reads are stitched into longer sequences (assembly) and genes and other features are marked (annotation).',
 'Repeats make assembly hard. The first complete human genome without gaps (T2T-CHM13) was published in 2022.',
 'Assemblers use overlap or de Bruijn graphs; scaffolding uses Hi-C or optical maps. Annotation combines ab initio prediction, RNA-seq evidence and homology.',
 'Human genome size|≈ 3.1 Gb;T2T-CHM13|2022', 'BIO:17.2 BIO:17.3', k='chromatin_genome', w='place:dna')
n('bio_transcriptomics','RNA-seq and transcriptomics','technique','bio_ngs bio_rna_processing','Measuring which genes are active.',
 'RNA-seq counts RNA molecules to show which genes are expressed and how much, in a tissue or a single cell.',
 'Differential expression finds genes that change between conditions. Single-cell RNA-seq reveals cell types and states in a tissue.',
 'Counts are normalised (TPM, DESeq2 size factors) and modelled with negative-binomial statistics. Multiple-testing correction (FDR) is essential when testing ≈ 20,000 genes.',
 'Genes tested|≈ 20,000;Single-cell throughput|10⁴–10⁶ cells', 'BIO:17.5', k='gene_regulation', w='place:dna')
n('bio_proteomics_omics','Proteomics, metabolomics and systems biology','technique','bio_transcriptomics bio_protein_analysis','Measuring whole sets of proteins and metabolites.',
 'Proteomics and metabolomics identify and measure all proteins or small molecules in a sample, mostly using mass spectrometry.',
 'Combining omics layers with networks gives a systems view of a cell. Biomarker discovery and drug target studies use these methods.',
 'Shotgun proteomics digests proteins and matches peptide spectra to databases; detection of ≈ 10,000 human proteins from one cell line is now routine. Dynamic range of plasma proteins spans ≈ 10 orders of magnitude.',
 'Human proteins (reviewed)|≈ 20,000;Plasma protein dynamic range|≈ 10¹⁰', 'BIO:17.5', k='networks_complexity', w='')
n('bio_crispr_cas9','CRISPR–Cas9 genome editing','technique','bio_dna_damage_repair bio_noncoding_rna','Programmable DNA cutting.',
 'A guide RNA leads the Cas9 enzyme to a matching DNA sequence and cuts both strands. The cell\'s repair then disrupts or edits the gene.',
 'CRISPR began as a bacterial immune system against phages. Doudna and Charpentier turned it into a tool in 2012 (Nobel 2020). Casgevy (2023) is the first approved CRISPR therapy, for sickle-cell disease.',
 'Cas9 needs an NGG PAM. Repair by NHEJ makes indels; HDR can insert a template. Off-target cuts, delivery and mosaicism are limits. Base editors and prime editors change bases without double-strand breaks.',
 'Guide RNA length|≈ 20 nt;Nobel Prize|2020 (Doudna, Charpentier)', 'BIO:17.1 MIC:12.4 ORG:28.8', k='crispr_biotech', w='place:dna', rel='crispr_editing_process',
 d='The CRISPR repeats were first noticed in E. coli in 1987 and only decades later linked to bacterial immunity.')
n('bio_gmo_transgenics','GMOs and transgenic organisms','concept','bio_restriction_cloning','Organisms with added or edited genes.',
 'Genetically modified organisms carry genes from another species or edited genes. Examples include Bt corn and insulin-producing bacteria.',
 'Bt crops make a bacterial toxin that kills certain insect pests. Golden Rice is engineered to make beta-carotene. Regulators assess each product for safety and environmental risk.',
 'Meta-analyses find approved GM foods are as safe to eat as conventional ones; environmental questions (gene flow, resistance evolution, herbicide use) are assessed case by case. Gene drives are a distinct, more contested technology.',
 'Share of US corn that is GM|≈ 90%;First GM food approved|1994 (Flavr Savr)', 'BIO:17.1 COB:10.2', k='crispr_biotech', w='place:soil')
n('bio_gene_therapy','Gene therapy and genomic medicine','technique','bio_crispr_cas9 bio_gmo_transgenics','Treating disease by changing genes.',
 'Gene therapy delivers a working gene or edits a faulty one to treat disease. Viruses are the usual delivery vehicles.',
 'Approved examples include treatments for SMA, certain inherited blindness, haemophilia and sickle-cell disease. Prices can reach millions of dollars per patient.',
 'AAV vectors have ≈ 4.7 kb capacity and trigger immune responses; lentiviral vectors integrate. Early trials revealed insertional mutagenesis and the 1999 Gelsinger death, shaping oversight.',
 'AAV cargo limit|≈ 4.7 kb;First approved gene therapy (EU)|2012', 'MIC:12.4 BIO:17.4', k='crispr_biotech', w='place:dna')
n('bio_dna_fingerprinting_blotting','DNA profiling and blotting','technique','bio_pcr bio_gel_electrophoresis','Identifying individuals and specific sequences.',
 'DNA profiling compares short repeating sequences (STRs) that vary between people. Southern, northern and western blots detect specific DNA, RNA and proteins.',
 'Forensic profiles use 13–20 STR loci, giving random match probabilities below 1 in a billion. Paternity and identification cases use similar methods.',
 'Match probabilities multiply allele frequencies across loci (product rule), with corrections for relatedness and population structure. Western blots use antibody detection after SDS-PAGE transfer.',
 'CODIS core loci|20;Random match probability|< 1 in 10⁹ typical', 'BIO:17.1 MIC:12.2', k='bayes_stats', w='')
n('bio_sequence_alignment','Sequence alignment','technique','bio_genetic_code','Comparing sequences to find similarity.',
 'Alignment lines up two or more DNA or protein sequences to show matches, mismatches and gaps.',
 'Similarity between sequences suggests common ancestry (homology). Algorithms score matches, mismatches and gap penalties; the best alignment has the highest score.',
 'Needleman–Wunsch (global) and Smith–Waterman (local) dynamic programming are O(mn). Substitution matrices (BLOSUM62, PAM) capture amino-acid exchange. Multiple alignment (Clustal, MAFFT) underlies phylogenetics.',
 'Global algorithm|Needleman–Wunsch, 1970;Standard protein matrix|BLOSUM62', 'BIO:20.2', lab='molecule:sequence_alignment', k='information_theory', w='')
n('bio_blast_databases','BLAST and biological databases','tool','bio_sequence_alignment','Searching for related sequences.',
 'BLAST quickly searches huge databases for sequences similar to yours. Databases like GenBank, UniProt and the PDB store sequences and structures.',
 'The E-value says how many matches of that score you would expect by chance; smaller is more significant. Annotated databases link sequences to function.',
 'BLAST uses seeds (words of ≈ 3 aa or 11 nt) extended into high-scoring pairs. GenBank holds > 10¹² bases; AlphaFold DB provides > 200 million predicted structures.',
 'Significant E-value|< 10⁻⁵ often used;GenBank size|> 10¹² bases', 'BIO:17.5', k='information_theory', w='', ext='NCBI BLAST|https://blast.ncbi.nlm.nih.gov/Blast.cgi;;UniProt|https://www.uniprot.org/')
n('bio_phylogenetic_methods','Building phylogenetic trees from data','technique','bio_sequence_alignment','Inferring evolutionary relationships.',
 'Trees are built from aligned sequences by distance, parsimony, maximum-likelihood or Bayesian methods.',
 'Branch lengths show amount of change; bootstrap values (percent) show support. Rooting uses an outgroup.',
 'ML and Bayesian approaches use substitution models (GTR, LG) and rate variation. Molecular clocks calibrated by fossils estimate divergence times. Horizontal gene transfer makes trees of genes differ from the species tree.',
 'Bootstrap "good support"|≥ 70–95%;Number of rooted trees for n taxa|(2n−3)!!', 'BIO:20.2 COB:12.2', k='common_descent', w='place:earth', lab='population:phylogeny_builder')
n('bio_comparative_human_genomics','Comparative and human genomics','concept','bio_genome_assembly','What genomes reveal when compared.',
 'Comparing genomes shows shared genes between species and what makes each unique. Humans and chimpanzees differ by ≈ 1.2% in single-base changes.',
 'Humans have ≈ 20,000 protein-coding genes, similar to other mammals; most of the genome is regulatory or repetitive. The Human Genome Project (1990–2003) cost ≈ $2.7 billion.',
 'Conserved noncoding elements flag functional regions. Human populations share ≈ 99.9% of their DNA; most variation lies within, not between, continental groups (≈ 85–90%).',
 'Human–chimp difference|≈ 1.2% (SNVs);Variation within populations|≈ 85–90%', 'BIO:17.2 BIO:17.4', k='chromatin_genome human_evolution', w='place:dna')
n('bio_metagenomics','Metagenomics and environmental DNA','technique','bio_ngs','Sequencing whole communities.',
 'Sequencing all DNA from a sample (soil, water, gut) reveals the microbes present without growing them.',
 '16S rRNA gene sequencing classifies bacteria; shotgun metagenomics adds functional genes. eDNA from water can detect rare animals.',
 'Most microbial species have never been cultured (the "great plate count anomaly"); metagenome-assembled genomes expand the tree of life, including Asgard archaea and the CPR bacteria.',
 'Cultured share of microbes|≈ < 1–2% (many habitats);16S gene length|≈ 1.5 kb', 'BIO:17.5 MIC:12.3', k='bacteria_archaea', w='place:soil')

# ---------------- 9 Microbiology ----------------
section('bio_microbiology', 'Microbiology and virology',
 'Bacteria, archaea, protists, fungi and viruses, and how they affect us.',
 'Microbes are the most numerous and diverse living things. Many are harmless or helpful, a few cause disease, and viruses are particles that replicate only inside cells.',
 'Bacteria and archaea show enormous metabolic variety, exchange genes horizontally and form communities such as biofilms and the human microbiome. Viruses are classified by their genomes and replication.',
 'Microbial genetics, growth kinetics and ecology link to medicine and the environment: antibiotics, resistance, epidemiology, biogeochemical cycling and biotechnology all depend on them.',
 'bacteria_archaea viruses')
n('bio_bacterial_structure','Bacterial cell structure','structure','bio_prokaryote_eukaryote bio_cell_wall_ecm','Wall, membrane, nucleoid and appendages.',
 'Bacteria have a cell wall of peptidoglycan, a nucleoid region, ribosomes, and often flagella or pili.',
 'Gram-positive bacteria have a thick peptidoglycan layer; Gram-negative ones have a thin layer plus an outer membrane. This explains Gram stain results and antibiotic susceptibility.',
 'The outer membrane carries lipopolysaccharide (endotoxin). Capsules, S-layers and endospores add protection; endospores of Bacillus can survive > 10⁵ years in some reports.',
 'Typical bacterial cell|0.5–5 µm;Peptidoglycan thickness (Gram+)|≈ 20–80 nm', 'MIC:3.3 BIO:22.2', k='bacteria_archaea', w='place:pond', lab='microscope:gram_stain')
n('bio_microbial_growth','Microbial growth and culture','technique','bio_cytokinesis_prokaryotic_division','Growth curves and culture media.',
 'Bacteria grow exponentially in a lag, log, stationary and death-phase pattern. They are grown on media with nutrients like agar plates or broth.',
 'Growth depends on temperature, pH, oxygen and nutrients; organisms are classed as psychrophiles, mesophiles, thermophiles, aerobes, anaerobes and so on.',
 'Exponential growth follows N = N₀·2^(t/g) with generation time g. Selective and differential media (MacConkey, blood agar) help identify species.',
 'Generation time E. coli|≈ 20 min;Colony count|CFU/mL', 'MIC:9.1 MIC:9.2 MIC:9.4 MIC:9.6', f='N = N₀·2^(t/g)', k='population_dynamics', w='place:pond', lab='population:bacterial_growth')
n('bio_microbial_metabolism','Microbial metabolic diversity','concept','bio_metabolism_overview bio_bacterial_structure','Many ways to make a living.',
 'Microbes get energy from light (phototrophs), organic molecules (heterotrophs) or inorganic chemicals (chemolithotrophs), and carbon from CO2 or organic matter.',
 'Anaerobic respiration uses alternatives to oxygen (nitrate, sulfate, CO2). Cyanobacteria invented oxygenic photosynthesis ≈ 2.4–3 billion years ago.',
 'Nitrogen fixers (nitrogenase), methanogens, sulfate reducers and anammox bacteria drive global cycles. Electron donors and acceptors set energy yield via the redox tower.',
 'Oxygenic photosynthesis arose|≈ 2.4–3 Ga;Methanogens|archaea only', 'MIC:8.3 MIC:8.4 MIC:8.6 BIO:22.3', k='biogeochemical_cycles', w='place:pond')
n('bio_horizontal_gene_transfer','Bacterial genetics and horizontal gene transfer','concept','bio_bacterial_structure bio_replication_machinery','Swapping genes between cells.',
 'Bacteria share genes by conjugation (plasmid transfer), transformation (taking up free DNA) and transduction (via phage).',
 'This spreads traits like antibiotic resistance among species. Griffith\'s 1928 mouse experiments revealed transformation.',
 'Genomes of one species can differ by 10–30% in gene content (pan-genome). Integrons, transposons and plasmids (F, R) drive gene mobility; CRISPR provides adaptive defence.',
 'Griffith experiment|1928;E. coli core genome|≈ 50% of pan-genome', 'MIC:11.6 BIO:22.2', k='bacteria_archaea', w='place:pond')
n('bio_bacterial_diversity','Bacterial diversity and phyla','organism','bio_bacterial_structure','Major groups of bacteria.',
 'Notable groups include Proteobacteria (E. coli, Salmonella), Firmicutes (Bacillus, Streptococcus), Actinobacteria, Cyanobacteria and spirochetes.',
 'Different groups cause disease, fix nitrogen, make antibiotics (Streptomyces) or photosynthesise (cyanobacteria).',
 'Culture-independent surveys revealed dozens of phyla, including Candidate Phyla Radiation bacteria with tiny genomes. Bacteria are probably 10⁹–10¹⁰ species; only ≈ 10⁴ are formally described.',
 'Estimated bacterial cells on Earth|≈ 10³⁰;Formally named species|≈ 10⁴–10⁵', 'BIO:22.1 MIC:4.1 MIC:4.2 MIC:4.4', k='bacteria_archaea', w='place:pond')
n('bio_archaea','Archaea','organism','bio_bacterial_diversity','The third domain of life.',
 'Archaea look like bacteria but are genetically closer to eukaryotes. Many live in extreme places, though they also live in soil and oceans.',
 'Groups include methanogens, halophiles and thermophiles. They have ether-linked membrane lipids and no peptidoglycan.',
 'Asgard archaea contain eukaryote-like proteins and are the closest known relatives of the eukaryotic host. Thermococcus and Pyrolobus can grow above 100 °C (record ≈ 122 °C).',
 'Growth record|≈ 122 °C (Methanopyrus kandleri strain 116);Discovered as a domain|1977 (Woese)', 'BIO:22.1 MIC:4.6', k='bacteria_archaea luca', w='place:pond')
n('bio_viruses_structure','Viruses: structure and classification','organism','bio_cell_theory bio_nucleotides','Genetic material in a protein coat.',
 'A virus is genetic material (DNA or RNA) in a protein shell (capsid), sometimes inside a lipid envelope. It can replicate only within a host cell.',
 'Shapes include helical, icosahedral and complex. Baltimore classification sorts viruses by genome type and mRNA production (seven classes).',
 'Genomes range from ≈ 1.7 kb (circoviruses) to > 2.5 Mb (pandoraviruses). Whether viruses are alive and how they originated (virus-first, escape, reduction) is unsettled.',
 'Typical virion|≈ 20–300 nm;Baltimore classes|7', 'BIO:21.1 MIC:6.1', k='viruses', c='C2', oq=['The origin of viruses (before cells, escaped genes, or reduced cells) remains unresolved and may differ between groups.'], w='place:pond')
n('bio_viral_life_cycles','Viral replication cycles','process','bio_viruses_structure','Attach, enter, replicate, assemble, exit.',
 'A virus attaches to a host receptor, enters, hijacks the cell to copy itself, assembles new particles and leaves.',
 'Lytic viruses burst the cell; lysogenic viruses integrate their DNA and wait. Enveloped viruses bud from the membrane.',
 'Burst sizes range from ≈ 10 to > 10⁵ particles per cell. Latency (herpesviruses), antigenic drift (influenza) and reassortment (flu pandemics) are key evolutionary features.',
 'Phage burst size|≈ 100–200;Influenza genome|8 RNA segments', 'BIO:21.2 MIC:6.2', k='viruses', w='place:cell', rel='viral_replication_process')
n('bio_bacteriophages','Bacteriophages','organism','bio_viral_life_cycles','Viruses that infect bacteria.',
 'Bacteriophages are the most abundant biological entities (≈ 10³¹ on Earth). They infect bacteria and can control bacterial populations.',
 'Phage T4 and λ were model systems that shaped molecular biology. Phage therapy is being revisited for resistant infections.',
 'Phages shuttle genes (transduction), transfer toxins, and shape ocean carbon cycling by lysing ≈ 20% of marine bacteria daily. Phage display evolves binding proteins (Nobel 2018).',
 'Phages on Earth|≈ 10³¹;Ocean bacteria lysed/day|≈ 20%', 'MIC:6.2 BIO:21.1', k='viruses bacteria_archaea', w='place:pond')
n('bio_retroviruses_hiv','Retroviruses and HIV','organism','bio_viral_life_cycles bio_central_dogma','RNA viruses that write DNA.',
 'Retroviruses like HIV copy their RNA genome into DNA and insert it into the host genome. HIV attacks CD4⁺ T cells and causes AIDS if untreated.',
 'Antiretroviral drugs target reverse transcriptase, protease and integrase; combination therapy makes HIV a manageable infection. About 39 million people live with HIV.',
 'Reverse transcriptase is error-prone (≈ 10⁻⁴ per base) giving rapid evolution and drug resistance. Latent reservoirs in resting cells prevent cure; rare bone-marrow transplants have cured a few patients.',
 'People with HIV|≈ 39 million;RT error rate|≈ 10⁻⁴ per base', 'BIO:21.2 MIC:6.2 MIC:25.3', k='viruses', w='lymphocyte_t')
n('bio_viroids_prions','Viroids and prions','organism','bio_viruses_structure bio_protein_folding','Smaller or simpler infectious agents.',
 'Viroids are naked circular RNAs that infect plants. Prions are misfolded proteins that convert normal proteins into the misfolded form.',
 'Prion diseases include mad cow disease (BSE) and Creutzfeldt–Jakob disease. They are not destroyed by normal sterilisation.',
 'PrP^Sc seeds conversion of PrP^C; strain diversity is encoded in conformations. Stanley Prusiner received the 1997 Nobel for prion research.',
 'Viroid size|≈ 250–400 nt;Prusiner Nobel|1997', 'BIO:21.4 MIC:6.4', k='viruses', w='place:cell')
n('bio_emerging_viruses','Emerging viruses and pandemics','concept','bio_viral_life_cycles','Where new viral threats come from.',
 'New viruses often jump from animals to people (zoonosis). Examples are HIV, influenza, Ebola and SARS-CoV-2.',
 'Mutation, reassortment and recombination give variants. Surveillance, vaccines and antivirals are the main responses.',
 'R₀ and generation time drive spread; COVID-19 pandemic (2019–) caused > 7 million reported deaths. Origin investigations weigh zoonotic spillover against lab-related hypotheses; this remains debated for SARS-CoV-2.',
 'R₀ (measles)|≈ 12–18;R₀ (seasonal flu)|≈ 1.3', 'BIO:21.3 MIC:16.4', c='C2', oq=['The precise origin of SARS-CoV-2 has not been conclusively established.'], k='viruses', w='place:pond')
n('bio_protists','Protists','organism','bio_endosymbiosis','Diverse eukaryotes that are not plants, animals or fungi.',
 'Protists are mostly single-celled eukaryotes: amoebas, ciliates, algae, diatoms and parasites like Plasmodium.',
 'They include producers, predators and parasites. Diatoms and dinoflagellates are important marine photosynthesisers, and malaria kills ≈ 600,000 people a year.',
 'Protists are polyphyletic; eukaryotic supergroups (Opisthokonta, Archaeplastida, SAR, Excavata, Amoebozoa) reflect phylogenomics. Secondary endosymbiosis shaped plastids of many algae.',
 'Malaria deaths|≈ 600,000/yr;Diatom share of ocean productivity|≈ 20%', 'BIO:23.2 BIO:23.3 BIO:23.4 MIC:5.1 MIC:5.4', k='cell_types', w='place:pond')
n('bio_human_microbiome','Human microbiome','concept','bio_bacterial_diversity','Microbes living on and in us.',
 'Trillions of microbes live in the gut, on the skin and elsewhere. Most are harmless or helpful, aiding digestion and training immunity.',
 'Gut bacteria make vitamins and short-chain fatty acids. Antibiotics, diet and early life shape the community; imbalance (dysbiosis) is linked with disease.',
 'Human cells and bacteria are roughly 1:1 (≈ 3.8×10¹³ bacteria). Causation versus correlation in microbiome–disease links is still being tested, and fecal transplants are approved for recurrent C. difficile.',
 'Gut bacteria|≈ 4×10¹³ cells;Microbial genes in gut|≈ 3 million', 'MIC:21.1 BIO:22.5', k='soil_biology', c='C2', oq=['Which microbiome–disease associations are causal (versus consequences) is still mostly unresolved.'], w='microbiome')
use('microbiome')
n('bio_pathogenesis','Pathogenesis and virulence','concept','bio_bacterial_structure bio_emerging_viruses','How microbes cause disease.',
 'A pathogen must reach the host, attach, evade defences and damage tissue. Toxins, enzymes and capsules help.',
 'Exotoxins (cholera, botulinum) are proteins; endotoxin is LPS from Gram-negative walls. Koch\'s postulates link a microbe to a disease.',
 'Virulence factors are often on pathogenicity islands or plasmids. ID50 (infectious dose) and LD50 quantify virulence; botulinum toxin is among the most lethal known (≈ 1 ng/kg).',
 'Botulinum toxin lethal dose|≈ 1 ng/kg;Koch\'s postulates|1884', 'MIC:15.1 MIC:15.2 MIC:15.3 MIC:15.4', w='place:pond')
n('bio_antibiotics','Antibiotics: mechanisms and discovery','concept','bio_bacterial_structure bio_trna_translation_machinery','Drugs that kill or stop bacteria.',
 'Antibiotics target bacterial structures absent from human cells: cell wall synthesis (penicillin), ribosomes, DNA gyrase or folate synthesis.',
 'Fleming discovered penicillin in 1928. Antibiotics do not work on viruses.',
 'Selective toxicity depends on target differences (70S vs 80S ribosomes). Spectrum, MIC and pharmacokinetics guide use; many antibiotics derive from soil actinomycetes.',
 'Penicillin discovery|1928;Targets|wall, ribosome, DNA gyrase, folate', 'MIC:14.2 MIC:14.3 MIC:14.4', k='pharmacology', w='mol:penicillin_g', mol='penicillin_g amoxicillin')
n('bio_antibiotic_resistance','Antibiotic resistance','concept','bio_antibiotics bio_horizontal_gene_transfer bio_drift_flow_selection_pop','Evolution of resistant bacteria.',
 'Bacteria evolve resistance when exposed to antibiotics. The sensitive ones die and the resistant ones multiply.',
 'Mechanisms: drug inactivation (β-lactamases), altered targets, efflux pumps and reduced uptake. Misuse in medicine and farming speeds resistance.',
 'AMR was associated with ≈ 4.7 million deaths in 2021 (≈ 1.1 million directly attributable). MRSA, CRE and drug-resistant TB are priority threats; new classes are rare, so stewardship, phage therapy and diagnostics matter.',
 'Deaths linked to AMR (2021)|≈ 4.7 million;New antibiotic classes since 1987|few', 'MIC:14.5 MIC:14.7', k='natural_selection pharmacology', w='place:pond', lab='population:antibiotic_resistance')
n('bio_microbial_control','Sterilisation, disinfection and aseptic control','technique','bio_microbial_growth','Controlling microbial growth.',
 'Heat, filtration, radiation and chemicals kill or remove microbes. Sterilisation kills all life; disinfection reduces pathogens.',
 'An autoclave uses steam at 121 °C and 15 psi for ≈ 15–20 minutes. Alcohol (70%) works better than 100% on many bacteria.',
 'D-value and Z-value describe thermal death kinetics; endospores and prions need harsher treatment. Efficacy tests include the phenol coefficient and disk diffusion.',
 'Autoclave|121 °C, 15 psi, ≈ 15 min;Pasteurisation (HTST)|72 °C, 15 s', 'MIC:13.1 MIC:13.2 MIC:13.3', w='')
n('bio_biofilms_quorum','Biofilms and quorum sensing','concept','bio_microbial_growth','Microbial communities that talk.',
 'Microbes stick to surfaces inside a slimy matrix (biofilm) and use chemical signals (quorum sensing) to coordinate when they are numerous.',
 'Biofilms on teeth (plaque) and catheters resist antibiotics and immune cells. Vibrio fischeri\'s glow in squid is the classic quorum example.',
 'Biofilm cells can tolerate 10–1,000× higher antibiotic doses. Signals include AHLs (Gram-negatives) and peptides (Gram-positives).',
 'Biofilm antibiotic tolerance|≈ 10–1000×;Quorum signal|AHL / peptide', 'MIC:4.1 BIO:22.5', w='place:pond')
save('bio_genomics_micro')
