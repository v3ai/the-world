from lib import *

section('bio_evolution', 'Evolution',
 'Descent with modification: mechanisms, evidence, history and origins.',
 'Evolution is change in the inherited traits of populations over generations. Natural selection, drift, mutation and gene flow drive it, and all life shares common ancestry.',
 'Fossils, DNA, anatomy and geography all point to the same tree of life. New species form when populations become reproductively isolated, and the history of life is punctuated by mass extinctions and radiations.',
 'Modern evolutionary theory integrates population genetics, development and phylogenetics. Open questions include the origin of life, the tempo of macroevolution and the role of non-genetic inheritance.',
 'natural_selection common_descent')
n('bio_natural_selection','Natural selection','law','bio_population_genetics','Differential survival and reproduction.',
 'Individuals vary, some traits are heritable, and more offspring are born than can survive. Those with helpful traits leave more offspring, so such traits spread.',
 'Darwin and Wallace proposed the idea in 1858–59. Fitness is relative reproductive success, not strength.',
 'Selection acts on phenotypes but changes allele frequencies: Δp = p(w̄ₐ − w̄)/w̄. The Price equation generalises it; the response to selection is R = h²S.',
 'Darwin\'s Origin|1859;Peppered moth melanic frequency|≈ 2% to ≈ 95% (1848–1895)', 'BIO:18.1 COB:11.1 COB:11.2', f='R = h²·S', k='natural_selection', w='place:park', lab='genetics:drift_selection', rel='natural_selection_process')
n('bio_selection_modes','Modes of selection and adaptation','concept','bio_natural_selection','Directional, stabilising, disruptive.',
 'Directional selection favours one extreme, stabilising favours the middle and disruptive favours both extremes.',
 'Human birth weight is under stabilising selection; beak size in Galápagos finches changed during droughts (Grants\' studies).',
 'Frequency-dependent and balancing selection maintain variation (MHC, sickle-cell). Adaptations differ from exaptations, and not every trait is an adaptation (Gould & Lewontin "spandrels").',
 'Finch beak change in drought|≈ 4–5% in one generation;Balancing example|sickle-cell allele', 'BIO:19.3 COB:11.2', k='natural_selection', w='place:park')
n('bio_sexual_selection','Sexual selection','concept','bio_selection_modes','Competing for mates.',
 'Traits like peacock tails and antlers evolve because they help in winning mates, even at a cost to survival.',
 'Female choice and male–male competition are the two main mechanisms.',
 'Handicap and good-genes models explain costly ornaments; Fisherian runaway selection explains exaggerated traits. Sperm competition and sexual conflict drive rapid evolution of reproductive proteins.',
 'Proposed by|Darwin, 1871;Peacock train length|≈ 1.5 m', 'BIO:19.3 BIO:45.7', w='place:park')
n('bio_evidence_for_evolution','Evidence for evolution','concept','bio_natural_selection','Fossils, anatomy, DNA and observation.',
 'Fossils show change over time, homologous structures (the forelimb of a bat and a whale) show common ancestry, and DNA sequences nest into a tree.',
 'Vestigial structures and shared pseudogenes (e.g., the broken vitamin C gene in primates) fit descent. Observed evolution includes antibiotic resistance and Lenski\'s E. coli.',
 'Independent trees from morphology and molecules agree; transitional fossils (Tiktaalik, Archaeopteryx) fill predicted gaps. Lenski\'s experiment has run since 1988 (> 75,000 generations).',
 'Lenski experiment start|1988;Human–chimp DNA similarity|≈ 98.8%', 'BIO:18.1 COB:11.3', k='common_descent fossils_paleontology', w='place:earth')
n('bio_species_concepts','Species concepts','concept','bio_natural_selection','What is a species?',
 'The biological species concept defines a species as interbreeding populations reproductively isolated from others.',
 'Alternatives include morphological, phylogenetic and ecological concepts. Bacteria and asexual organisms fit poorly with the biological concept.',
 'Ring species and hybrid zones show that speciation is gradual. About 8.7 million eukaryotic species are estimated, with only ≈ 1.2–2 million described.',
 'Estimated eukaryotic species|≈ 8.7 million;Described|≈ 2 million', 'BIO:18.2 COB:11.4', c='C2', oq=['No single species concept works for all life; the boundaries are a matter of convention in many groups.'], k='speciation_biodiversity', w='place:park')
n('bio_speciation_mechanisms','Speciation and reproductive isolation','process','bio_species_concepts bio_drift_flow_selection_pop','How one species becomes two.',
 'Populations separated by a barrier (allopatric) diverge until they can no longer interbreed. Speciation can also occur without barriers (sympatric), such as by polyploidy.',
 'Prezygotic barriers (timing, behaviour, mechanical) and postzygotic barriers (hybrid sterility, inviability) keep species apart.',
 'Dobzhansky–Muller incompatibilities accumulate in isolation. Polyploid speciation is common in plants. Speciation can take from a few generations (polyploids) to millions of years.',
 'Cichlid species in Lake Victoria|≈ 500 in ≈ 15,000 y;Hybrid sterility example|mule', 'BIO:18.2 BIO:18.3 COB:11.4', k='speciation_biodiversity', w='place:earth', rel='speciation_process')
n('bio_adaptive_radiation','Adaptive radiation and coevolution','concept','bio_speciation_mechanisms','Rapid diversification into new niches.',
 'When a lineage enters a new environment with open niches it can split into many species, like Darwin\'s finches and Hawaiian honeycreepers.',
 'Coevolution is reciprocal evolutionary change in interacting species, such as flowers and pollinators or hosts and parasites.',
 'Radiations often follow key innovations or mass extinctions (mammals after the Cretaceous). Red Queen dynamics describe perpetual arms races between hosts and parasites.',
 'Hawaiian drosophilids|≈ 1,000 species;Darwin\'s finches|≈ 15 species', 'BIO:18.3 BIO:19.3', k='speciation_biodiversity', w='place:earth')
n('bio_phylogeny_cladistics','Phylogenies and cladistics','technique','bio_evidence_for_evolution','Reading and building evolutionary trees.',
 'A phylogenetic tree shows branching ancestry. A clade includes an ancestor and all its descendants.',
 'Characters shared because of a common ancestor (synapomorphies) define clades; similarity from convergent evolution (analogy) misleads.',
 'Cladistic methods use parsimony or probabilistic models. Monophyletic, paraphyletic and polyphyletic groups are distinguished; "reptiles" excluding birds is paraphyletic.',
 'Tree terms|node, branch, clade, outgroup;Birds are|dinosaurs (clade Theropoda)', 'BIO:20.1 BIO:20.2 COB:12.1 COB:12.2', k='common_descent', w='place:earth', lab='population:phylogeny_builder')
n('bio_molecular_clock','Molecular clocks and divergence times','concept','bio_phylogeny_cladistics bio_mutations','Dating splits using sequence change.',
 'If mutations accumulate at a steady rate, the number of differences between species estimates how long ago they split.',
 'Clocks are calibrated with fossils. Human and chimp lineages split about 6–7 million years ago.',
 'Rates vary between lineages (relaxed clocks) and with generation time; Bayesian dating (BEAST) integrates calibrations. Rate heterogeneity gives wide credible intervals.',
 'Human–chimp split|≈ 6–7 Ma;Substitution rate (human)|≈ 10⁻⁹ per bp per year', 'BIO:20.3', k='radiometric_dating common_descent', w='place:earth')
n('bio_geologic_time','Geologic time and the history of life','concept','bio_evidence_for_evolution','Eons, eras and key events.',
 'Earth is ≈ 4.54 billion years old. Life appeared by ≈ 3.5–3.8 billion years ago, animals by ≈ 575 million, and humans only in the last ≈ 300,000 years.',
 'Key events: oxygenation (≈ 2.4 Ga), eukaryotes (≈ 1.6–2 Ga), Cambrian explosion (≈ 540 Ma), land plants (≈ 470 Ma), dinosaurs (≈ 230–66 Ma).',
 'Radiometric dating (U–Pb, K–Ar) calibrates the timescale. Banded iron formations, stromatolites and biomarkers document early life; Ediacaran biota precede the Cambrian.',
 'Age of Earth|≈ 4.54 Ga;Cambrian explosion|≈ 540 Ma', 'BIO:20.3 COB:11.3', k='deep_time fossils_paleontology', w='place:earth')
n('bio_mass_extinctions','Mass extinctions','concept','bio_geologic_time','Five great die-offs.',
 'Five mass extinctions wiped out most species, including the end-Permian event (≈ 252 Ma, ≈ 90% of marine species) and the end-Cretaceous event (≈ 66 Ma).',
 'Causes include volcanism, climate change, ocean anoxia and, for the dinosaurs, an asteroid impact at Chicxulub.',
 'Recovery takes ≈ 5–10 million years. Many scientists argue we are entering a sixth mass extinction; current rates are ≈ 100–1,000× background.',
 'End-Permian loss|≈ 90% marine species;Current extinction rate|≈ 100–1000× background', 'BIO:47.1 BIO:20.3', k='mass_extinctions', w='place:earth')
n('bio_macroevolution_evodevo','Macroevolution and evo-devo','concept','bio_adaptive_radiation bio_phylogeny_cladistics','Big changes and the genes behind body plans.',
 'Large-scale changes arise by the accumulation of small ones, plus changes in genes that control development.',
 'Hox genes pattern the body axis in animals; small regulatory changes can alter limbs, eyes or body segments. Whale limbs and bird wings show repurposing.',
 'Evo-devo studies modular regulatory evolution and deep homology (Pax6 for eyes). Punctuated equilibrium proposes stasis with bursts of change; the fossil record supports both tempo patterns in different lineages.',
 'Hox clusters in vertebrates|4 (≈ 39 genes);Pax6 homologue|eye development in flies and mice', 'BIO:27.2 BIO:43.7', k='development_biology', w='place:earth')
n('bio_neutral_theory_drift','Neutral and nearly neutral theory','concept','bio_drift_flow_selection_pop','Most molecular change is random.',
 'Most mutations that persist in a genome are effectively neutral and spread through drift rather than selection.',
 'Kimura proposed the neutral theory in 1968. It underlies molecular clocks.',
 'Substitution rate for neutral mutations equals the mutation rate (k = μ). Nearly neutral dynamics depend on Ne·s; how much of genome evolution is selected remains actively debated.',
 'Kimura|1968;Neutral substitution rate|k = μ', 'BIO:19.1', f='k = μ', c='C2', oq=['The proportion of genomic divergence driven by positive selection versus drift is still disputed.'], k='natural_selection', w='place:dna')
n('bio_kin_selection_behavior_evo','Kin selection and altruism','concept','bio_natural_selection','Helping relatives.',
 'Animals may help relatives because relatives share genes. Worker bees and meerkat helpers are examples.',
 'Hamilton\'s rule says altruism evolves when relatedness × benefit exceeds cost.',
 'rb > c, where r is relatedness. Haplodiploidy gives full sisters r = 0.75, a historical explanation for eusociality, though other factors matter. Group selection models remain debated.',
 'Relatedness full siblings|0.5;Relatedness cousins|0.125', 'BIO:45.7', f='r·b > c', w='place:park')
n('bio_human_evolution','Human evolution','concept','bio_phylogeny_cladistics bio_comparative_human_genomics','The primate lineage leading to us.',
 'Humans share ancestors with the African apes. The hominin line includes Australopithecus (e.g. "Lucy", ≈ 3.2 Ma), early Homo (≈ 2.8 Ma) and Homo sapiens (≈ 300,000 years ago in Africa).',
 'Bipedalism came early, large brains later. Neanderthals and Denisovans interbred with modern humans; most non-Africans carry ≈ 1–2% Neanderthal DNA.',
 'Ancient DNA has reshaped the story: multiple dispersals, admixture and local adaptation (lactase persistence, high altitude EPAS1). Details of the Out-of-Africa timing and the role of archaic admixture in Africa remain under active study.',
 'Homo sapiens origin|≈ 300,000 y (Jebel Irhoud);Neanderthal DNA in non-Africans|≈ 1–2%', 'BIO:29.7', k='human_evolution', c='C2', oq=['Exact branching of early Homo lineages and the geography of H. sapiens origins (multiregional African model) are debated.'], w='place:earth')
n('bio_origin_of_life','Origin of life','concept','bio_atp_energy_coupling bio_nucleotides','How chemistry became biology.',
 'Life likely began on early Earth more than 3.5 billion years ago from chemical reactions that formed organic molecules, which then organised into self-copying systems.',
 'Leading ideas: RNA world, metabolism-first at hydrothermal vents, and lipid vesicle protocells. Miller–Urey (1953) made amino acids from simple gases.',
 'No complete pathway is known. Challenges: chirality, polymerisation in water, and the origin of coding. Prebiotic synthesis of nucleotides (Sutherland 2009) suggests plausible routes; none has produced a full cell from chemistry.',
 'Miller–Urey|1953;Earliest accepted evidence of life|≈ 3.5–3.8 Ga', 'BIO:20.3', k='origin_of_life rna_world luca', c='C3',
 oq=['Whether life began as RNA, metabolism, lipids or something else is unresolved.', 'Where it began (vents, ponds, clay surfaces) is not settled.', 'How information-bearing polymers first arose without enzymes is unknown.'], w='place:earth', mol='hydrogen_cyanide formamide ammonia')
n('bio_rna_world_luca','RNA world and the last universal common ancestor','concept','bio_origin_of_life bio_rna_types','Early life\'s likely machinery.',
 'The RNA world hypothesis proposes that RNA both stored information and catalysed reactions before DNA and proteins.',
 'Ribozymes support the idea: the ribosome itself is an RNA enzyme. LUCA, the last universal common ancestor of bacteria, archaea and eukaryotes, lived ≈ 3.5–4.2 billion years ago.',
 'Reconstructions suggest LUCA was a anaerobic, hydrogen-using cell possibly with a Wood–Ljungdahl pathway, though estimates differ. In vitro evolution has produced RNA polymerase ribozymes that copy short templates.',
 'LUCA age (est.)|≈ 3.5–4.2 Ga;Ribozyme discovery Nobel|1989', 'BIO:20.3', k='rna_world luca', c='C3', oq=['Whether an RNA world preceded DNA/protein life is unproven.', 'The complexity and habitat of LUCA are contested.'], w='place:earth')
n('bio_evolution_misconceptions','Common misconceptions about evolution','concept','bio_natural_selection','What evolution does not say.',
 'Individuals do not evolve; populations do. Evolution has no goal, and "survival of the fittest" means reproductive success, not strength.',
 'Humans did not evolve from today\'s chimps; both share an ancestor. "Theory" in science means a well-tested explanation.',
 'Evolution is not progress towards complexity. Adaptation is limited by history, trade-offs and chance; many traits are compromises or by-products.',
 'Theory status|well-supported explanatory framework;Chimp–human common ancestor|≈ 6–7 Ma', 'COB:11.5 BIO:18.1', w='')
n('bio_experimental_evolution','Experimental evolution','technique','bio_natural_selection','Watching evolution in the lab.',
 'Researchers grow microbes or flies for hundreds or thousands of generations under controlled conditions and watch them adapt.',
 'Lenski\'s E. coli lines evolved the ability to use citrate after ≈ 31,000 generations.',
 'Frozen fossil records allow replay experiments to test contingency. Repeatability of outcomes tells us how deterministic adaptation is.',
 'Lenski generations|> 75,000;Citrate use appeared|≈ 31,500 generations', 'BIO:18.1', w='place:pond')

# ---------------- 11 Diversity ----------------
section('bio_diversity', 'Diversity of life',
 'Fungi, protists, plants and animals, from invertebrates to vertebrates.',
 'Life on Earth is enormously diverse. This section tours the major groups of eukaryotes: fungi, algae, plants and animals, with their body plans and lifestyles.',
 'Groups are defined by shared ancestry. Key transitions include multicellularity, the move to land, the evolution of seeds and flowers, and of backbones, jaws, limbs, feathers and fur.',
 'Phylogenomics keeps revising animal and plant relationships (e.g., placement of ctenophores or sponges at the base of animals). Diversity gradients and extinction risk are explored in ecology and conservation.',
 'animal_diversity')
n('bio_fungi_basics','Fungi: biology and classification','organism','bio_protists','Absorptive heterotrophs with chitin walls.',
 'Fungi are mostly made of threads (hyphae) forming a mycelium. They absorb food from their surroundings after digesting it with enzymes.',
 'Major groups: chytrids, zygomycetes, ascomycetes (yeasts, molds, morels) and basidiomycetes (mushrooms). Fungi are more closely related to animals than to plants.',
 'The largest known organism is an Armillaria mycelium in Oregon (≈ 9 km², perhaps 2,000+ years old). Fungi reproduce both sexually and asexually, and many have long dikaryotic stages.',
 'Described fungal species|≈ 150,000;Estimated total|2–5 million', 'BIO:24.1 BIO:24.2 COB:13.4 MIC:5.3', k='animal_diversity', w='place:soil')
n('bio_fungal_ecology','Fungal ecology and symbioses','concept','bio_fungi_basics','Decomposers, partners and pathogens.',
 'Fungi decompose dead matter, form mycorrhizae with plant roots, and make lichens with algae or cyanobacteria. Some cause disease in plants and animals.',
 'About 90% of land plants have mycorrhizal partners that trade soil minerals for sugar. Yeasts bring us bread, beer and antibiotics (penicillin).',
 'Chytrid fungus Batrachochytrium has caused amphibian declines in > 500 species. White-nose syndrome has killed millions of bats. Fungal infections kill ≈ 1.5 million people yearly.',
 'Plants with mycorrhizae|≈ 80–90%;Amphibian species hit by chytrid|> 500', 'BIO:24.3 BIO:24.4 BIO:24.5 MIC:5.5', k='soil_biology', w='place:soil')
n('bio_algae_green_origin','Algae and the origin of land plants','organism','bio_protists','Green algae are the closest relatives of land plants.',
 'Land plants descended from freshwater green algae (charophytes) about 470 million years ago.',
 'Moving onto land needed protection from drying (cuticle), support, and water transport.',
 'Streptophyte algae share cell-division and cell-wall features with plants; Zygnematophyceae may be the sister group. Key innovations: sporopollenin, embryos, vascular tissue.',
 'Land plant origin|≈ 470 Ma;Closest algal relatives|charophytes', 'BIO:25.1 BIO:25.2', k='plant_physiology', w='place:pond')
n('bio_bryophytes_seedless','Bryophytes and seedless vascular plants','organism','bio_algae_green_origin','Mosses, ferns and relatives.',
 'Mosses, liverworts and hornworts have no true vascular tissue and stay small. Ferns and lycophytes have vascular tissue but still need water for sperm to swim.',
 'These plants have alternation of generations: a gametophyte stage and a sporophyte stage. In mosses the gametophyte dominates; in ferns the sporophyte does.',
 'Carboniferous seedless forests formed much of today\'s coal. Ferns number ≈ 10,500 species; vascular tissue with lignin evolved ≈ 430 Ma.',
 'Ferns|≈ 10,500 species;Moss species|≈ 12,000', 'BIO:25.3 BIO:25.4 COB:14.2', k='plant_physiology', w='place:park')
n('bio_seed_plants','Gymnosperms and angiosperms','organism','bio_bryophytes_seedless','Seeds, pollen and flowers.',
 'Seeds protect and feed the embryo. Gymnosperms (conifers) have "naked" seeds in cones; angiosperms (flowering plants) enclose seeds in fruit.',
 'Angiosperms are ≈ 300,000 species. Double fertilisation produces an embryo and nutritive endosperm. Flowers attract animals for pollination.',
 'Angiosperms diversified in the Cretaceous, which Darwin called an "abominable mystery". Basal lineages include Amborella. Monocots and eudicots differ in cotyledons, vascular arrangement and pollen apertures.',
 'Angiosperm species|≈ 300,000;Conifer species|≈ 600–700', 'BIO:26.1 BIO:26.2 BIO:26.3 COB:14.3 COB:14.4', k='flowers_pollination plant_physiology', w='place:park')
n('bio_animal_features','Animal features and body plans','concept','bio_phylogeny_cladistics','What makes an animal and how animals are organised.',
 'Animals are multicellular heterotrophs without cell walls that develop from an embryo. Body plans differ in symmetry, layers and body cavity.',
 'Radial vs bilateral symmetry, diploblastic vs triploblastic layers, and protostome vs deuterostome development are the main categories.',
 'Molecular phylogeny groups bilaterians into Lophotrochozoa, Ecdysozoa and Deuterostomia. Whether sponges or ctenophores branch first remains debated.',
 'Described animal species|≈ 1.5 million;Animal phyla|≈ 35', 'BIO:27.1 BIO:27.2 BIO:27.3 COB:15.1', k='animal_diversity', c='C2', oq=['Whether sponges or comb jellies are sister to all other animals is unsettled.'], w='place:pond')
n('bio_sponges_cnidarians','Sponges and cnidarians','organism','bio_animal_features','The simplest animals.',
 'Sponges filter water through pores and have no true tissues. Cnidarians (jellyfish, corals, anemones) have stinging cells and radial symmetry.',
 'Coral reefs, built by cnidarians with symbiotic algae, cover < 1% of the sea floor but host ≈ 25% of marine species.',
 'Cnidocytes fire nematocysts in ≈ 700 ns, among the fastest cellular events. Coral bleaching occurs when symbionts are expelled under heat stress.',
 'Reef share of marine species|≈ 25%;Nematocyst discharge|≈ 700 ns', 'BIO:28.1 BIO:28.2 COB:15.2', k='animal_diversity', w='place:pond')
n('bio_lophotrochozoans','Flatworms, mollusks and annelids','organism','bio_sponges_cnidarians','Soft-bodied bilaterians.',
 'Flatworms include free-living planarians and parasitic tapeworms and flukes. Mollusks have a muscular foot, mantle and often a shell; annelids are segmented worms.',
 'Octopuses are mollusks with large brains and ≈ 500 million neurons. Earthworms aerate soil.',
 'Cephalopods have closed circulatory systems and camera-type eyes arising independently of vertebrates. Annelid segmentation parallels but evolved separately from arthropods\' and vertebrates\'.',
 'Mollusk species|≈ 85,000;Octopus neurons|≈ 500 million', 'BIO:28.3 BIO:28.4 COB:15.3 COB:15.4', k='animal_diversity', w='place:pond')
n('bio_nematodes_arthropods','Nematodes and arthropods','organism','bio_lophotrochozoans','Molting animals: roundworms and jointed-legged animals.',
 'Nematodes are unsegmented roundworms found nearly everywhere. Arthropods (insects, spiders, crustaceans) have jointed legs and a chitin exoskeleton.',
 'Arthropods make up ≈ 80% of described animal species. Moulting lets them grow despite the rigid exoskeleton.',
 'Ecdysozoa moult under ecdysone control. The arthropod body plan has repeated segments modified by Hox genes into specialised appendages.',
 'Arthropods share of animal species|≈ 80%;Insect species described|≈ 1 million', 'BIO:28.5 BIO:28.6 COB:15.3', k='animal_diversity', w='place:park')
n('bio_entomology_insects','Insects and entomology basics','organism','bio_nematodes_arthropods','The most diverse animal class.',
 'Insects have three body regions, six legs and usually wings. They pollinate crops, spread diseases and decompose waste.',
 'Complete metamorphosis (egg, larva, pupa, adult) occurs in beetles, flies, butterflies and bees; incomplete metamorphosis in grasshoppers.',
 'Beetles alone are ≈ 400,000 described species. Social insects (ants, termites, bees) show eusociality with castes. Insect declines of ≈ 1–2% per year in some regions are a concern.',
 'Beetle species|≈ 400,000;Insects pollinate|≈ 75% of crop types', 'BIO:28.6 COB:15.3', k='animal_diversity', w='place:park')
n('bio_echinoderms_chordates','Echinoderms and chordates','organism','bio_nematodes_arthropods','Deuterostomes, including us.',
 'Echinoderms (sea stars, urchins) have radial adult symmetry; chordates have a notochord, dorsal nerve cord, pharyngeal slits and a post-anal tail at some stage.',
 'Tunicates and lancelets are invertebrate chordates. Vertebrates add a backbone and a skull.',
 'Echinoderms and chordates are both deuterostomes, sharing ancestry; hemichordates link them. Vertebrate genomes show two whole-genome duplications.',
 'Chordate hallmark features|4;Vertebrate genome duplications|2 rounds', 'BIO:28.7 BIO:29.1 COB:15.5', k='animal_diversity', w='place:pond')
n('bio_fishes_amphibians','Fishes and amphibians','organism','bio_echinoderms_chordates','Fins to legs.',
 'Fishes (jawless, cartilaginous, ray-finned, lobe-finned) are the oldest vertebrates. Amphibians moved to land but still need water to breed.',
 'Tetrapods evolved from lobe-finned fishes ≈ 375 Ma (Tiktaalik). Amphibian skin breathes and is sensitive to pollution.',
 'Ray-finned fish are ≈ 99% of fish species (≈ 35,000). Frogs\' decline is among the fastest of any vertebrate group (≈ 40% of species threatened).',
 'Fish species|≈ 35,000;Amphibian species threatened|≈ 40%', 'BIO:29.2 BIO:29.3 COB:15.6', k='animal_diversity', w='place:pond')
n('bio_reptiles_birds','Reptiles and birds','organism','bio_fishes_amphibians','Amniotes and feathered dinosaurs.',
 'Reptiles have scaly skin and lay shelled eggs on land. Birds, descended from theropod dinosaurs, have feathers and lay hard-shelled eggs.',
 'The amniotic egg freed vertebrates from water. Bird bones are light and air-sacs give efficient breathing.',
 'Birds (≈ 11,000 species) are a clade within Reptilia as phylogenetically defined. Feathers evolved before flight, probably for insulation and display.',
 'Bird species|≈ 11,000;Reptile species|≈ 12,000', 'BIO:29.4 BIO:29.5 COB:15.6', k='animal_diversity', w='place:park')
n('bio_mammals_primates','Mammals and primates','organism','bio_reptiles_birds','Hair, milk and big brains.',
 'Mammals have hair, three middle-ear bones and mammary glands. The three groups are monotremes (egg-laying), marsupials and placentals.',
 'Primates have grasping hands, forward-facing eyes and large brains; they include lemurs, monkeys, apes and humans.',
 'Mammals radiated after the end-Cretaceous extinction. There are ≈ 6,500 mammal species and ≈ 500 primates; ≈ 25% of mammals are threatened.',
 'Mammal species|≈ 6,500;Primate species|≈ 500', 'BIO:29.6 BIO:29.7 COB:15.6', k='animal_diversity human_evolution', w='place:park')
n('bio_zoology_taxonomy_methods','Zoology field methods and identification','technique','bio_animal_features','How animals are surveyed and named.',
 'Zoologists identify species with keys, specimens, photos and DNA barcodes, and count animals with transects, traps and cameras.',
 'The COI gene is the standard animal barcode (≈ 650 bp). Mark–recapture estimates population size.',
 'Lincoln–Petersen: N ≈ (M·C)/R. Occupancy models separate detection from presence. Specimen collection follows permits, ethics and museum curation standards.',
 'Barcode gene|COI, ≈ 650 bp;Lincoln–Petersen|N ≈ MC/R', 'BIO:45.1 COB:12.1', f='N ≈ M·C / R', w='place:park')

# ---------------- 12 Plants ----------------
section('bio_plants', 'Plant biology',
 'How plants are built, move water, make food, grow and respond.',
 'Plants are living factories that capture sunlight. They have roots, stems and leaves, move water from soil to air, and respond to light, gravity and seasons.',
 'Xylem carries water up and phloem carries sugars around. Hormones such as auxin, gibberellin and ethylene coordinate growth, flowering and fruit ripening.',
 'Plant physiology blends biophysics (water potential, cohesion–tension) with molecular signalling and development. C4 and CAM adaptations address the Rubisco oxygenase problem in warm, dry settings.',
 'plant_physiology')
n('bio_plant_body_tissues','Plant body and tissues','structure','bio_chloroplasts_plastids bio_seed_plants','Roots, stems, leaves and their tissues.',
 'Roots anchor and absorb, stems support and transport, leaves capture light. Dermal, ground and vascular tissues form the plant body.',
 'Meristems at tips (apical) and sides (lateral) allow growth throughout life. Secondary growth makes wood and bark.',
 'Monocots have scattered vascular bundles; eudicots have them in a ring. Annual rings result from seasonal cambial activity and are used in dendrochronology.',
 'Tallest tree|≈ 116 m (coast redwood);Meristems|apical, lateral', 'BIO:30.1 BIO:30.2 BIO:30.3 BIO:30.4', k='plant_physiology', w='place:leaf')
n('bio_leaf_structure_gas_exchange','Leaf anatomy and stomata','structure','bio_plant_body_tissues','Built for light, CO2 and water balance.',
 'Leaves are thin and flat to catch light. Stomata (pores flanked by guard cells) let CO2 in and water vapour out.',
 'Guard cells open in light by taking up K+ and water, and close in drought via abscisic acid. A leaf loses ≈ 400 water molecules for each CO2 fixed (C3).',
 'Stomatal density and index record past CO2 levels. Trade-off between carbon gain and water loss shapes plant strategies and water-use efficiency.',
 'Water lost per CO2 fixed (C3)|≈ 400;Stomata density|≈ 100–500/mm²', 'BIO:30.4 COB:5.1', k='plant_physiology', w='place:leaf')
n('bio_water_transport','Water transport: xylem and cohesion–tension','process','bio_leaf_structure_gas_exchange bio_water_properties','Moving water up tall trees.',
 'Water evaporating from leaves pulls a continuous column of water up through the xylem from the roots.',
 'Cohesion between water molecules and adhesion to xylem walls support the column. Water flows from high to low water potential.',
 'Cohesion–tension theory predicts xylem pressures of −1 to −3 MPa; cavitation (embolism) is a risk in drought. Water potential Ψ = Ψs + Ψp.',
 'Xylem tension|≈ −1 to −3 MPa;Redwood water rise|≈ 100 m', 'BIO:30.5', f='Ψ = Ψs + Ψp', k='plant_physiology', w='place:leaf')
n('bio_phloem_transport','Phloem and pressure-flow','process','bio_water_transport','Moving sugars from source to sink.',
 'Phloem carries sugars from leaves (sources) to roots, fruits and growing tips (sinks).',
 'Sugar loading raises osmotic pressure at the source so water enters; at the sink sugar leaves and water follows, driving bulk flow (Münch pressure-flow).',
 'Phloem sap flows ≈ 0.5–1 m/h in sieve tubes; companion cells load sucrose using H⁺-coupled symporters. Aphid stylets sample phloem sap.',
 'Phloem flow speed|≈ 0.5–1 m/h;Sucrose in phloem|≈ 0.5 M', 'BIO:30.5', k='plant_physiology', w='place:leaf')
n('bio_plant_nutrition_soil','Plant nutrition and soil','concept','bio_water_transport','Minerals, nitrogen and symbionts.',
 'Plants need nitrogen, phosphorus, potassium and micronutrients from soil. Legumes host nitrogen-fixing bacteria in root nodules.',
 'Mycorrhizae extend root reach. Soil pH and structure control nutrient availability.',
 'Rhizobia fix N₂ via nitrogenase at ≈ 100–200 kg N/ha/yr in good legume stands. Haber–Bosch fertiliser supports ≈ half of the world\'s food nitrogen. Carnivorous plants supplement N in poor soils.',
 'Essential plant elements|17;Legume N fixation|≈ 100–200 kg/ha/yr', 'BIO:31.1 BIO:31.2 BIO:31.3', k='soil_biology haber_bosch', w='place:soil')
n('bio_photosynthetic_adaptations','C3, C4 and CAM photosynthesis','concept','bio_calvin_cycle bio_leaf_structure_gas_exchange','Ways to avoid photorespiration.',
 'In hot, dry places some plants concentrate CO2 around Rubisco. C4 plants (corn, sugarcane) separate steps in space; CAM plants (cacti, pineapple) separate them in time.',
 'Photorespiration wastes up to ≈ 25–30% of fixed carbon in C3 plants at high temperature. C4 uses PEP carboxylase in mesophyll and the Calvin cycle in bundle sheath.',
 'C4 evolved independently > 60 times; ≈ 3% of plant species, ≈ 25% of terrestrial primary production. CAM opens stomata at night. Engineering C4 rice is an active project.',
 'C4 species|≈ 3% of plants;C4 independent origins|> 60', 'BIO:8.3 BIO:30.4', k='plant_physiology photosynthesis_light', w='place:leaf')
n('bio_plant_hormones','Plant hormones','concept','bio_plant_body_tissues bio_signaling_overview','Chemical signals for growth and development.',
 'Auxin steers growth towards light; gibberellins promote stem elongation and germination; cytokinins promote cell division; abscisic acid closes stomata; ethylene ripens fruit.',
 'Apical dominance is auxin-mediated. Ripe apples release ethylene that ripens neighbours.',
 'Auxin transport by PIN proteins creates gradients (chemiosmotic polar transport). Hormone receptors include TIR1 (auxin) and ETR1 (ethylene).',
 'Auxin discovered|Darwin 1880, Went 1928;Ethylene|a gas hormone', 'BIO:30.6', k='plant_physiology', w='place:leaf')
n('bio_plant_responses','Tropisms, photoperiodism and plant defences','concept','bio_plant_hormones','How plants sense and respond.',
 'Plants bend toward light (phototropism) and roots grow down (gravitropism). Flowering time is set by day length via photoreceptors such as phytochrome.',
 'Plants defend with thorns, toxins and signals; attacked plants release volatile compounds warning neighbours.',
 'Phytochromes switch between Pr and Pfr forms by red/far-red light; the FT protein is the mobile "florigen". Systemic acquired resistance involves salicylic acid.',
 'Phytochrome forms|Pr (660 nm), Pfr (730 nm);Florigen|FT protein', 'BIO:30.6 BIO:32.1', k='plant_physiology', w='place:leaf')
n('bio_plant_reproduction','Plant reproduction and flowers','concept','bio_seed_plants','Flowers, pollination, fertilisation and seeds.',
 'Flowers are reproductive organs. Pollen carries sperm to the ovule; after double fertilisation the ovule becomes a seed and the ovary becomes a fruit.',
 'Pollinators include insects, birds, bats and wind. Fruits aid seed dispersal; plants can also reproduce asexually (runners, cloning).',
 'Self-incompatibility systems prevent selfing. Seed dormancy and germination are controlled by abscisic acid and gibberellin. Agriculture exploits vegetative propagation and grafting.',
 'Pollinator-dependent crops|≈ 35% of global crop production;Orchid seed size|≈ 0.3 mm', 'BIO:32.1 BIO:32.2 BIO:32.3', k='flowers_pollination', w='place:park')
n('bio_plant_development_flower','Plant development and the ABC model','concept','bio_plant_reproduction','Genes that build a flower.',
 'A seedling grows from a seed by cell division at meristems, and flowers form when a shoot meristem switches to reproductive development.',
 'In the ABC model, combinations of three gene classes decide sepals, petals, stamens and carpels.',
 'Arabidopsis mutants (apetala2, pistillata, agamous) led to the model; MADS-box genes are central. Plant development is plastic and modular, with indeterminate growth.',
 'Flower whorls|4 (sepal, petal, stamen, carpel);ABC classes|A, B, C (+ E)', 'BIO:32.1', k='development_biology', w='place:leaf')
save('bio_evol_diversity_plants')
