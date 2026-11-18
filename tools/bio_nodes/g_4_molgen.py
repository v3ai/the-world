from lib import *

section('bio_molecular', 'Molecular biology',
 'How genetic information is stored, copied, read and regulated.',
 'DNA stores instructions, RNA copies them, and ribosomes build proteins from them. Cells also decide which genes to read, when and how much.',
 'Replication copies the genome with high fidelity and repair systems fix damage. Transcription and translation follow the genetic code, and layers of regulation (chromatin, factors, RNAs) control expression.',
 'Gene expression is a regulated, noisy, multi-step process with feedback at every level. Chromatin state, noncoding RNAs and post-transcriptional control give eukaryotes a vast regulatory repertoire.',
 'central_dogma dna_structure gene_regulation')
n('bio_dna_structure','DNA double helix','structure','bio_nucleotides bio_polarity_hbonds','Two antiparallel strands in a helix.',
 'DNA is two strands twisted into a double helix. A pairs with T and G with C through hydrogen bonds.',
 'The strands run in opposite directions (antiparallel). Chargaff\'s rules (A = T, G = C) and Franklin\'s X-ray patterns led Watson and Crick to the model in 1953.',
 'B-DNA has ≈ 10.5 bp per turn, a 3.4 Å rise per bp, a 2 nm diameter and major and minor grooves that proteins read. Z-DNA and G-quadruplexes are alternative forms.',
 'Base pairs per turn|≈ 10.5;Helix diameter|≈ 2 nm', 'BIO:14.2 COB:9.1 ORG:28.2', k='dna_structure', w='place:dna', mol='bp_AT bp_GC', ext='RCSB PDB: 1BNA B-DNA|https://www.rcsb.org/structure/1BNA')
n('bio_chromatin_packaging','Chromatin and chromosome packaging','structure','bio_dna_structure','Fitting two metres of DNA in a nucleus.',
 'DNA wraps around histone proteins to form nucleosomes, which fold into chromatin and condense into chromosomes.',
 'A human cell has ≈ 2 m of DNA in a nucleus ≈ 6 µm across. Euchromatin is loose and active; heterochromatin is compact and mostly silent.',
 'Nucleosome core: 147 bp wrapped around an H2A/H2B/H3/H4 octamer. Higher-order folding involves loops and TADs organised by cohesin and CTCF.',
 'Nucleosome DNA|147 bp;DNA length per diploid cell|≈ 2 m', 'BIO:16.3 ANP:3.3', k='chromatin_genome', w='place:dna')
n('bio_central_dogma','Central dogma and its exceptions','concept','bio_dna_structure bio_rna_types','DNA to RNA to protein.',
 'Information normally flows from DNA to RNA to protein. DNA is copied (replication), read (transcription) and translated into proteins.',
 'Exceptions: retroviruses copy RNA into DNA with reverse transcriptase, RNA viruses replicate RNA, and prions transmit shape-based information.',
 'Crick\'s 1958 formulation prohibits information flow from protein back to nucleic acid; this still holds. Telomerase and retrotransposons also use reverse transcription.',
 'Proposed by|Francis Crick, 1958;Reverse transcriptase discovered|1970', 'BIO:15.1 COB:9.1', k='central_dogma', w='place:dna', rel='protein_synthesis')
n('bio_replication_machinery','DNA replication: enzymes and fork','process','bio_dna_structure bio_enzyme_catalysis','Copying the genome semiconservatively.',
 'Each new double helix has one old and one new strand (semiconservative). Helicase unwinds the DNA and DNA polymerase builds new strands from the 5′ to 3′ direction.',
 'The leading strand is made continuously, the lagging strand in short Okazaki fragments joined by ligase. Primase lays RNA primers.',
 'E. coli replicates ≈ 1,000 nt/s with an error rate ≈ 10⁻¹⁰ per base after proofreading and mismatch repair; human forks move ≈ 50 nt/s from ≈ 30,000–50,000 origins. Meselson–Stahl confirmed semiconservative replication in 1958.',
 'E. coli fork speed|≈ 1,000 nt/s;Final error rate|≈ 10⁻¹⁰ per bp', 'BIO:14.3 BIO:14.4 BIO:14.5 COB:9.2', k='dna_structure', w='place:dna', rel='dna_replication_process')
n('bio_dna_damage_repair','DNA damage and repair','process','bio_replication_machinery','Fixing mistakes and lesions.',
 'UV light, chemicals and copying errors damage DNA. Cells detect and repair most of it using several pathways.',
 'Mismatch repair fixes copying errors, base- and nucleotide-excision repair fix chemical damage, and double-strand breaks are fixed by end-joining or homologous recombination.',
 'Xeroderma pigmentosum arises from defective nucleotide excision repair; BRCA1/2 mutations impair homologous recombination (PARP inhibitors exploit this). A human cell suffers ≈ 10⁴–10⁵ DNA lesions per day.',
 'Lesions per cell per day|≈ 10⁴–10⁵;Repair pathways|≥ 5 major', 'BIO:14.6 MIC:11.5', k='dna_structure', w='place:dna')
n('bio_recombination_transposons','Recombination and transposable elements','concept','bio_dna_damage_repair','Shuffling and moving DNA.',
 'Cells can swap segments between DNA molecules (recombination) and some DNA sequences can move around the genome (transposons).',
 'Crossing over in meiosis is recombination; transposons make up ≈ 45% of the human genome, mostly inactive remnants.',
 'Barbara McClintock discovered mobile elements in maize. Retrotransposons (LINEs, Alus) copy via RNA; V(D)J recombination uses recombination to build antibody genes.',
 'Transposon share of human genome|≈ 45%;Alu elements|≈ 10%', 'BIO:14.6 MIC:11.6', k='chromatin_genome', w='place:dna')
n('bio_genetic_code','The genetic code','law','bio_central_dogma','Triplets of bases specify amino acids.',
 'Each group of three bases (codon) in mRNA specifies one amino acid or a stop. There are 64 codons for 20 amino acids.',
 'The code is redundant ("degenerate") and almost universal. AUG codes for methionine and starts translation; UAA, UAG, UGA are stop codons.',
 'Wobble pairing at the third position lets ≈ 40 tRNAs read 61 sense codons. Codon usage bias affects expression; some organisms recode stop codons (e.g., UGA for selenocysteine).',
 'Codons|64 (61 sense + 3 stop);Standard amino acids|20', 'BIO:15.1 COB:9.4', k='central_dogma', w='mol:aa_met', mol='aa_met')
n('bio_transcription_prokaryotic','Transcription in prokaryotes','process','bio_central_dogma bio_replication_machinery','RNA polymerase and sigma factors.',
 'RNA polymerase unwinds DNA at a promoter and builds a complementary RNA. It stops at a terminator.',
 'In bacteria a sigma factor guides the polymerase to the promoter (−10 and −35 boxes). Transcription and translation can occur at the same time.',
 'Rho-dependent and intrinsic (hairpin) termination. Rates ≈ 40–80 nt/s. Rifampicin blocks bacterial RNA polymerase.',
 'Elongation rate|≈ 40–80 nt/s;Promoter motifs|−35 and −10 boxes', 'BIO:15.2 MIC:11.3', k='central_dogma', w='place:dna', rel='transcription_process')
n('bio_transcription_eukaryotic','Transcription in eukaryotes','process','bio_transcription_prokaryotic bio_chromatin_packaging','Three polymerases and general factors.',
 'Eukaryotes use three RNA polymerases (I, II, III). Pol II makes mRNA and needs many general transcription factors.',
 'The TATA box and the pre-initiation complex position Pol II; enhancers far away boost transcription through looping.',
 'Mediator, TFIID and chromatin remodellers integrate signals; transcription is bursty. Pol II CTD phosphorylation coordinates capping, splicing and termination.',
 'Pol II machinery|≈ 50 proteins;Transcription speed|≈ 1–4 kb/min', 'BIO:15.3', k='gene_regulation', w='place:dna')
n('bio_rna_processing','RNA processing: capping, polyadenylation, splicing','process','bio_transcription_eukaryotic','Turning pre-mRNA into mRNA.',
 'Eukaryotic pre-mRNA gets a 5′ cap and a poly-A tail, and introns are cut out so exons are joined (splicing).',
 'Cap and tail protect mRNA and help translation. The spliceosome, made of snRNAs and proteins, removes introns.',
 'Human genes average ≈ 8–9 exons; introns are ≈ 95% of a gene. Alternative splicing lets ≈ 95% of multi-exon genes make more than one mRNA, so ≈ 20,000 genes give ≫ 20,000 proteins.',
 'Human protein-coding genes|≈ 20,000;Multi-exon genes alternatively spliced|≈ 95%', 'BIO:15.4 BIO:16.5', k='central_dogma', w='place:dna')
n('bio_trna_translation_machinery','tRNA and the ribosome','structure','bio_rna_processing bio_genetic_code','Adapters and the protein factory.',
 'tRNAs carry amino acids and read codons through an anticodon. Ribosomes, made of rRNA and proteins, join amino acids into a chain.',
 'Aminoacyl-tRNA synthetases attach the right amino acid, a key accuracy step. The ribosome has A, P and E sites.',
 'The ribosome is a ribozyme: peptidyl transfer is catalysed by rRNA. Bacterial ribosomes are 70S (30S + 50S), eukaryotic 80S (40S + 60S); many antibiotics target the 70S ribosome.',
 'Bacterial ribosome|70S;Translation speed in E. coli|≈ 15–20 aa/s', 'BIO:15.5 COB:9.4 MIC:11.4', k='central_dogma', w='ribosome', rel='protein_synthesis ribosome')
n('bio_translation_regulation_ptm','Translation control and post-translational modification','concept','bio_trna_translation_machinery','Regulating protein output and modifying proteins.',
 'Cells control how much protein is made by controlling translation initiation and mRNA lifetime, and modify proteins after synthesis.',
 'Phosphorylation, glycosylation, ubiquitination and cleavage change protein activity, location and lifetime.',
 'Initiation is the main control point (eIF2 phosphorylation in stress). Proteome complexity: > 400 types of post-translational modification are known; mRNA half-lives range from minutes to days.',
 'Types of PTM|> 400;mRNA half-life|minutes to days', 'BIO:16.6 BIO:16.5', k='gene_regulation', w='ribosome')
n('bio_lac_operon','Operons: lac and trp','concept','bio_transcription_prokaryotic','Gene regulation in bacteria.',
 'Bacteria group related genes into an operon controlled together. The lac operon is turned on only when lactose is present and glucose is low.',
 'A repressor blocks the lac promoter until lactose (allolactose) releases it; CAP–cAMP boosts transcription when glucose is scarce. The trp operon is switched off when tryptophan is plentiful.',
 'Jacob and Monod proposed the operon model in 1961 (Nobel 1965). The lac system shows combinatorial control, and trp adds attenuation. Gene circuits built from these parts are the basis of synthetic biology.',
 'Nobel Prize|1965 (Jacob, Monod, Lwoff);lac operon genes|lacZ, lacY, lacA', 'BIO:16.2 MIC:11.7', k='gene_regulation', w='place:pond', lab='molecule:lac_operon')
n('bio_eukaryotic_gene_regulation','Eukaryotic transcriptional regulation','concept','bio_transcription_eukaryotic','Transcription factors, enhancers and combinatorial control.',
 'Transcription factors bind DNA at specific sites and turn genes on or off. Enhancers can sit far from the genes they control.',
 'Many factors working together give each cell type its pattern. Signalling pathways modify factor activity.',
 'About 1,600 human transcription factors; enhancers loop to promoters within TADs. Pioneer factors open closed chromatin. Mutations in enhancers underlie many GWAS hits.',
 'Human transcription factors|≈ 1,600;Enhancer–promoter distance|up to ≈ 1 Mb', 'BIO:16.4 BIO:16.1', k='gene_regulation', w='place:dna')
n('bio_epigenetics','Epigenetics: DNA methylation and histone marks','concept','bio_chromatin_packaging bio_eukaryotic_gene_regulation','Heritable changes in expression without changes in sequence.',
 'Chemical tags on DNA (methylation) and on histones change how tightly DNA is packed and whether genes are active.',
 'Methylation of CpG sites usually silences genes. X-inactivation and genomic imprinting use epigenetic silencing; marks can be passed through cell divisions.',
 'Histone acetylation opens chromatin, H3K27me3 marks repression and H3K4me3 marks active promoters. Transgenerational epigenetic inheritance in humans is debated and evidence is limited.',
 'CpG methylation in human genome|≈ 70–80% of CpGs;Histone marks|acetylation, methylation, phosphorylation', 'BIO:16.3 ANP:3.3', k='chromatin_genome gene_regulation', c='C2',
 oq=['How much epigenetic information is inherited across generations in mammals is unresolved.', 'Causality of many marks in gene regulation (cause vs consequence) is still being worked out.'], w='place:dna')
n('bio_x_inactivation_imprinting','X-inactivation and genomic imprinting','concept','bio_epigenetics','Parent-of-origin and dosage compensation.',
 'In female mammals one X chromosome is silenced in each cell. Some genes are expressed only from the maternal or only the paternal copy (imprinting).',
 'Tortoiseshell and calico cats show X-inactivation as a patchwork of coat colours. Imprinting disorders include Prader–Willi and Angelman syndromes.',
 'Xist RNA coats the inactive X and recruits silencing complexes. Imprinted genes (~100–200 in humans) are regulated by differentially methylated regions set in the germline.',
 'Imprinted genes in humans|≈ 100–200;Xist RNA length|≈ 17 kb', 'BIO:16.3 BIO:13.2', k='chromatin_genome', w='place:dna')
n('bio_noncoding_rna','Noncoding RNAs: miRNA, siRNA, lncRNA','concept','bio_rna_types bio_epigenetics','RNAs that regulate rather than code.',
 'Small RNAs (microRNA, siRNA) bind mRNAs and reduce their expression. Long noncoding RNAs act as scaffolds and guides.',
 'RNA interference was discovered in C. elegans (Fire and Mello, Nobel 2006). Over 2,000 human miRNAs regulate a majority of genes.',
 'Argonaute proteins load guide RNAs into RISC and cleave or repress targets. piRNAs defend germ cells against transposons. Many lncRNAs have unknown function and their number (≈ 20,000+) is debated.',
 'miRNA length|≈ 22 nt;Human miRNAs|≈ 2,000', 'BIO:16.5 BIO:16.3', k='gene_regulation', w='place:dna', lab='molecule:rnai')
n('bio_post_transcriptional_control','mRNA stability and localisation','concept','bio_noncoding_rna bio_rna_processing','Control after transcription.',
 'Cells also control genes by regulating how long mRNAs last and where they are used.',
 'RNA-binding proteins and miRNAs target mRNAs for decay; localised mRNAs let proteins be made where needed, as in neuron dendrites.',
 'Nonsense-mediated decay removes mRNAs with premature stops. Poly-A tail length and AU-rich elements set half-life; mRNA vaccines use modified nucleosides and optimised UTRs to improve stability.',
 'Average mammalian mRNA half-life|≈ 9 h;Nonsense-mediated decay|degrades PTC-mRNAs', 'BIO:16.5 BIO:16.6', w='place:dna')
n('bio_cancer_gene_regulation','Oncogenes and tumour-suppressor genes','concept','bio_cell_cycle_control bio_eukaryotic_gene_regulation','Genes whose changes drive cancer.',
 'Oncogenes are "gas pedals" stuck on and tumour suppressors are "brakes" that fail. Cancer arises when multiple such changes accumulate.',
 'Examples: Ras and Myc (oncogenes), p53 and Rb (suppressors). Most mutations are somatic, not inherited.',
 'Knudson\'s two-hit hypothesis explains inherited retinoblastoma. Tumours typically carry ≈ 2–8 driver mutations; epigenetic silencing can substitute for mutation.',
 'Typical driver mutations|≈ 2–8 per tumour;Retinoblastoma|two-hit model', 'BIO:16.7 BIO:10.4', k='cancer_biology', w='place:dna')

# ---------------- 7 Genetics ----------------
section('bio_genetics', 'Genetics',
 'Inheritance, linkage, mutation and the genetics of populations.',
 'Genetics asks how traits pass from parents to offspring. Mendel found that heredity comes in discrete units (genes) that segregate and combine according to probability.',
 'Genes sit on chromosomes, so some travel together (linkage) and can be mapped. Mutations create new alleles, chromosome changes cause syndromes, and complex traits depend on many genes and the environment.',
 'Population genetics tracks allele frequencies through time under mutation, selection, drift, migration and non-random mating; the Hardy–Weinberg principle is the null model.',
 'genetics_inheritance')
n('bio_mendel_laws','Mendel\'s laws','law','bio_cell_cycle','Segregation and independent assortment.',
 'Mendel crossed pea plants and found that each parent passes one of its two copies of a gene to the offspring (segregation) and that different genes are inherited separately (independent assortment).',
 'Dominant alleles mask recessive ones, so a 3:1 ratio appears in the second generation. Mendel published in 1866; the work was rediscovered in 1900.',
 'Independent assortment holds only for unlinked genes. Mendel\'s ratios are a probabilistic expectation; the data were later argued to fit surprisingly well (Fisher), a topic of historical debate.',
 'Mendel\'s F2 ratio|3:1;Pea plants studied|≈ 28,000 (1856–63)', 'BIO:12.1 BIO:12.2 BIO:12.3 COB:8.1 COB:8.2', k='genetics_inheritance', w='place:park')
n('bio_alleles_genotype','Alleles, genotype and phenotype','concept','bio_mendel_laws','The vocabulary of inheritance.',
 'A gene has versions called alleles. Genotype is the pair of alleles you carry and phenotype is the observable trait.',
 'Homozygous means two identical alleles, heterozygous two different. The same genotype can yield different phenotypes in different environments.',
 'Penetrance and expressivity describe how often and how strongly a genotype shows a phenotype. Genotype–phenotype maps are many-to-many for complex traits.',
 'Diploid human cell|2 alleles per autosomal gene;Human chromosomes|46', 'BIO:12.2 COB:8.1', k='genetics_inheritance', w='place:dna')
n('bio_genetics_probability','Probability rules in genetics','technique','bio_alleles_genotype','Product, sum and conditional rules.',
 'Probabilities of independent events multiply ("and") and probabilities of mutually exclusive outcomes add ("or").',
 'The chance that two heterozygous parents have an aa child is 1/4; for three independent children all aa it is (1/4)³. Binomial formulas count outcomes for families.',
 'Bayesian reasoning updates carrier risk from pedigree and test information. The binomial probability of k affected among n offspring is C(n,k)p^k(1−p)^(n−k).',
 'P(aa) from Aa × Aa|1/4;P(carrier) from Aa × Aa unaffected|2/3', 'IST:3.2 IST:3.3 IST:4.3 BIO:12.3', f='P(A and B) = P(A)·P(B);  P(A or B) = P(A) + P(B)', k='probability bayes_stats', w='', lab='genetics:probability_rules')
n('bio_punnett_squares','Punnett squares and test crosses','technique','bio_genetics_probability','A grid for predicting offspring.',
 'A Punnett square lists parental gametes on its sides and shows all possible offspring genotypes in the grid.',
 'A test cross (unknown × homozygous recessive) reveals the genotype of an individual showing the dominant trait.',
 'For two genes, a 16-cell dihybrid square gives 9:3:3:1; the forked-line (probability) method is faster and scales better for more genes.',
 'Monohybrid cross ratio|3:1 (phenotype), 1:2:1 (genotype);Dihybrid ratio|9:3:3:1', 'BIO:12.3 COB:8.2', lab='genetics:punnett', k='genetics_inheritance', w='')
n('bio_dihybrid_assortment','Dihybrid crosses and independent assortment','technique','bio_punnett_squares','Two genes at once.',
 'When two genes are on different chromosomes they assort independently, giving a 9:3:3:1 ratio in the F2 of a dihybrid cross.',
 'A test cross of a dihybrid gives 1:1:1:1. Deviations from these ratios indicate linkage or interaction.',
 'Use χ² goodness-of-fit to test whether observed counts match expectation (df = categories − 1). Independent assortment results from random orientation of homologous pairs at metaphase I (2²³ combinations in humans).',
 'Human gamete combinations|2²³ ≈ 8.4 million;Dihybrid test cross|1:1:1:1', 'BIO:12.3 COB:8.2', lab='genetics:dihybrid_cross', w='')
n('bio_dominance_extensions','Incomplete dominance, codominance and multiple alleles','concept','bio_alleles_genotype','Beyond simple dominance.',
 'In incomplete dominance the heterozygote is intermediate; in codominance both alleles show, as in AB blood. Some genes have more than two alleles.',
 'ABO blood group has three alleles (IA, IB, i). Rh and other factors add further antigens.',
 'Dominance is a property of the phenotype and level of observation, not of the molecule: sickle-cell heterozygotes are recessive for anaemia, codominant for haemoglobin, and dominant for malaria resistance.',
 'ABO alleles|IA, IB, i;Sickle heterozygote|malaria resistance', 'BIO:12.2 BIO:12.3 COB:8.3 ANP:18.6', w='mol:heme_b')
n('bio_epistasis_pleiotropy','Epistasis, pleiotropy and polygenic effects','concept','bio_dominance_extensions','Genes that interact and genes with many effects.',
 'In epistasis one gene masks or modifies another, as in coat colour in Labrador retrievers. Pleiotropy means one gene affects several traits.',
 'Many traits depend on several genes (polygenic) and the environment, so they do not fall into neat classes.',
 'Modified Mendelian ratios (9:3:4, 12:3:1, 9:7) reveal pathway structure. Marfan syndrome (FBN1) shows pleiotropy affecting eyes, skeleton and aorta.',
 'Modified ratios|9:3:4, 12:3:1, 9:7;Marfan gene|FBN1', 'BIO:12.3 COB:8.3', lab='genetics:epistasis', w='place:dna')
n('bio_meiosis_variation','Meiosis, crossing over and genetic variation','concept','bio_cell_cycle bio_recombination_transposons','How gametes get halved chromosome sets and new combinations.',
 'Meiosis makes four genetically different cells with half the chromosomes. Crossing over and random assortment shuffle alleles.',
 'Crossing over happens between homologous chromosomes in prophase I. Fertilisation restores the diploid number.',
 'About 1–2 crossovers per human chromosome arm. Nondisjunction in meiosis I or II causes aneuploidy; the chance rises with maternal age (Down syndrome ≈ 1/1,500 at 20 vs ≈ 1/100 at 40).',
 'Human gametes|n = 23;Crossovers per human meiosis|≈ 40–60', 'BIO:11.1 BIO:11.2 COB:7.2 COB:7.3', k='genetics_inheritance', w='place:cell', rel='meiosis_process')
n('bio_chromosome_theory','Chromosome theory of inheritance','law','bio_meiosis_variation bio_mendel_laws','Genes ride on chromosomes.',
 'Genes are located on chromosomes, and the behaviour of chromosomes in meiosis explains Mendel\'s laws.',
 'Sutton and Boveri proposed it in 1902; Morgan\'s fruit-fly work with white-eyed males supported it by showing a sex-linked trait.',
 'The theory has been confirmed by cytogenetics and sequencing. Exceptions include extranuclear inheritance (mitochondria, chloroplasts) and epigenetic effects.',
 'Morgan\'s fly experiment|1910;Drosophila chromosome pairs|4', 'BIO:13.1 COB:7.1', k='genetics_inheritance', w='place:cell')
n('bio_linkage_mapping','Linkage and genetic mapping','technique','bio_chromosome_theory','Genes close together travel together.',
 'Genes near each other on a chromosome tend to be inherited together. Crossing over breaks the link sometimes, and its frequency estimates distance.',
 'One map unit (1 centimorgan) equals 1% recombination. A three-point test cross orders genes along a chromosome.',
 'Recombination frequency saturates at 50% for far-apart genes; mapping functions (Haldane, Kosambi) correct for double crossovers. Human genetic map ≈ 3,500 cM; ≈ 1 cM ≈ 1 Mb on average.',
 'Max recombination frequency|50%;Human 1 cM|≈ 1 Mb', 'BIO:13.1 COB:8.2', f='RF = recombinants / total offspring × 100%', lab='genetics:linkage_mapping', w='place:dna')
n('bio_sex_linkage','Sex determination and sex-linked inheritance','concept','bio_chromosome_theory','X and Y chromosomes and their traits.',
 'In humans XX is female and XY is male. Genes on the X show different patterns in males and females.',
 'X-linked recessive traits such as red–green colour blindness and haemophilia are more common in males, who have only one X.',
 'SRY on the Y triggers male development. Other systems: ZW in birds, haplodiploidy in bees, temperature-dependent sex in many reptiles. Dosage compensation evolves by different mechanisms.',
 'Red–green colour blindness|≈ 8% of men, 0.5% of women;SRY|testis-determining gene', 'BIO:13.2 COB:8.3', lab='genetics:sex_linked', k='genetics_inheritance', w='place:dna')
n('bio_pedigree_analysis','Pedigree analysis','technique','bio_sex_linkage bio_genetics_probability','Reading family trees.',
 'A pedigree chart shows who in a family has a trait. Its pattern suggests dominant, recessive or sex-linked inheritance.',
 'Squares are males, circles females, shaded symbols affected individuals. Affected children of unaffected parents imply recessive inheritance.',
 'Software computes likelihoods for carrier status using Bayes\' theorem and linkage data. Complicating factors: reduced penetrance, new mutations, mosaicism, consanguinity.',
 'Autosomal recessive carrier frequency (CF, Europeans)|≈ 1 in 25;Carrier risk, sibling of affected|2/3', 'BIO:12.2 ANP:28.7', lab='genetics:pedigree_analysis', w='')
n('bio_mutations','Mutations','concept','bio_dna_damage_repair bio_genetic_code','Heritable changes in DNA sequence.',
 'A mutation is a change in the DNA sequence. Point mutations swap one base; insertions and deletions can shift the reading frame.',
 'Silent, missense and nonsense mutations differ in effect on the protein. Most mutations are neutral or harmful; a few are beneficial.',
 'The human germline mutation rate is ≈ 1.2×10⁻⁸ per base per generation, giving ≈ 70 new mutations per child. Somatic mutations accumulate in tissues and drive cancer.',
 'Human germline mutation rate|≈ 1.2×10⁻⁸ per bp;New mutations per child|≈ 70', 'BIO:14.6 MIC:11.5 COB:9.5', k='genetics_inheritance', w='place:dna')
n('bio_chromosomal_aberrations','Chromosomal abnormalities','concept','bio_meiosis_variation','Changes in chromosome number and structure.',
 'Having an extra or missing chromosome (aneuploidy) usually causes disorders, such as Down syndrome (trisomy 21).',
 'Structural changes include deletions, duplications, inversions and translocations. Cytogeneticists identify them by karyotyping.',
 'The Philadelphia chromosome (BCR–ABL translocation) causes chronic myeloid leukaemia. Polyploidy is common in plants (wheat is hexaploid) and a source of speciation.',
 'Down syndrome incidence|≈ 1 in 700 births;Bread wheat|hexaploid (6n = 42)', 'BIO:13.2 COB:7.3', k='genetics_inheritance', w='place:cell')
n('bio_single_gene_disorders','Single-gene and mitochondrial disorders','concept','bio_pedigree_analysis bio_mutations','Mendelian diseases and non-Mendelian inheritance.',
 'Cystic fibrosis, sickle-cell disease and Huntington\'s disease are caused by changes in single genes. Mitochondrial DNA is inherited from the mother.',
 'Autosomal recessive diseases need two mutant copies; dominant ones need one. Mitochondrial diseases show maternal inheritance and heteroplasmy.',
 'CFTR ΔF508 is the most common cystic fibrosis allele; Huntington\'s disease is a CAG repeat expansion in HTT. OMIM lists > 7,000 single-gene phenotypes.',
 'Cystic fibrosis carriers (Europeans)|≈ 1 in 25;Known Mendelian phenotypes|> 7,000', 'BIO:13.2 ANP:28.7', w='place:dna')
n('bio_quantitative_traits','Quantitative traits and heritability','concept','bio_epistasis_pleiotropy','Continuous traits with many genes.',
 'Height, weight and yield vary continuously because many genes and the environment contribute.',
 'Heritability is the fraction of variation in a population due to genetic differences; it is not the same as genetic determination and applies to a population, not an individual.',
 'Broad-sense H² = VG/VP; narrow-sense h² = VA/VP predicts response to selection (breeder\'s equation R = h²S). Human height h² ≈ 0.8, but ≈ 12,000 variants explain most of the genetic variance.',
 'Human height heritability|≈ 0.8;Breeder\'s equation|R = h²S', 'BIO:19.3 COB:8.3', f='R = h²·S', k='genetics_inheritance', w='place:dna')
n('bio_gwas','Genome-wide association studies','technique','bio_quantitative_traits bio_linkage_mapping','Finding variants linked to traits.',
 'GWAS compare the genomes of thousands of people with and without a trait to find variants that are more common in one group.',
 'Most hits have small effects. Results are used to build polygenic scores and to find drug targets.',
 'Genome-wide significance is p < 5×10⁻⁸ to correct for ≈ 10⁶ independent tests. Confounding by population structure and ancestry bias in reference data are major concerns.',
 'Significance threshold|p < 5×10⁻⁸;Typical single-variant effect|small (< 1% of variance)', 'BIO:17.2 IST:9.1', k='bayes_stats', w='place:dna')
n('bio_population_genetics','Population genetics: allele and genotype frequencies','concept','bio_alleles_genotype bio_genetics_probability','Genetics of groups.',
 'A population\'s gene pool can be described by the frequency of each allele. Evolution is a change in these frequencies over generations.',
 'Frequencies shift through mutation, natural selection, genetic drift, gene flow and nonrandom mating.',
 'The infinite-population null model is Hardy–Weinberg equilibrium. Effective population size Ne (often ≪ census N) sets the strength of drift.',
 'Drift strength|∝ 1/Ne;Human Ne (long-term)|≈ 10⁴', 'BIO:19.2 COB:11.1', f='p + q = 1', k='natural_selection', w='place:park')
n('bio_hardy_weinberg','Hardy–Weinberg equilibrium','law','bio_population_genetics','Allele frequencies stay constant without evolutionary forces.',
 'If mating is random and there is no selection, mutation, migration or drift, allele frequencies stay constant and genotype frequencies follow p², 2pq and q².',
 'It lets you estimate carrier frequency from disease frequency: if q² = 1/2,500 then q = 0.02 and carriers 2pq ≈ 0.04.',
 'Deviations signal evolutionary forces or genotyping artefacts. Tests use χ² with 1 degree of freedom (for two alleles). One generation of random mating restores HWE for an autosomal locus.',
 'Carrier frequency from q²=1/2500|≈ 3.9%;df for 2 alleles|1', 'BIO:19.2 COB:11.1', f='p² + 2pq + q² = 1', k='natural_selection', lab='genetics:hardy_weinberg', w='place:park')
n('bio_drift_flow_selection_pop','Drift, gene flow and selection in populations','concept','bio_hardy_weinberg','Forces that change allele frequencies.',
 'Genetic drift is random change in small populations; gene flow mixes alleles between populations; selection favours alleles that boost survival and reproduction.',
 'Bottlenecks and founder effects reduce diversity. Heterozygote advantage maintains the sickle-cell allele where malaria is common.',
 'Selection coefficient s changes allele frequency by Δp ≈ s·p·q/w̄ for a haploid model. Fixation probability of a neutral allele equals its frequency; for a new beneficial mutation it is ≈ 2s.',
 'Fixation probability of beneficial mutation|≈ 2s;Time to fixation of neutral allele|≈ 4Ne generations', 'BIO:19.1 BIO:19.3 COB:11.2', lab='genetics:drift_selection', k='natural_selection', w='place:park')
n('bio_inbreeding_conservation_genetics','Inbreeding and genetic load','concept','bio_drift_flow_selection_pop','Mating between relatives.',
 'Mating between relatives raises homozygosity and exposes harmful recessive alleles, a problem called inbreeding depression.',
 'Small endangered populations, such as Florida panthers and cheetahs, suffer from low diversity; introducing new individuals (genetic rescue) can help.',
 'Inbreeding coefficient F is the probability two alleles are identical by descent; offspring of first cousins have F = 1/16. Deleterious load can also be purged in long-inbred populations.',
 'F of first-cousin offspring|1/16;Florida panther rescue|1995 Texas pumas', 'BIO:19.2 BIO:47.4', f='F = Σ(½)^(n₁+n₂+1)', k='biodiversity_conservation', w='place:park')
save('bio_molecular_genetics')
