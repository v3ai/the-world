from lib import *

section('bio_animal_phys', 'Animal physiology',
 'How animal bodies work, compared across species.',
 'Animals solve the same problems in different ways: getting energy and oxygen, moving fluids, balancing water and salts, controlling temperature and coordinating organs.',
 'Human organ systems are one example of a general plan; comparisons across fish, insects, birds and mammals show how physical constraints and evolution shape solutions.',
 'Physiological scaling (Kleiber\'s law), countercurrent exchange and feedback control recur from kidneys to gills to heat exchangers, linking physiology to physics and evolution.',
 'homeostasis')
use('human_body epithelial_tissue connective_tissue_loose dense_connective_tissue adipose_tissue cartilage_tissue bone_tissue blood_tissue skeletal_muscle_tissue cardiac_muscle_tissue smooth_muscle_tissue nervous_tissue')
n('bio_animal_form_scaling','Animal form, size and scaling','concept','bio_homeostasis_concept bio_cell_size_limits','Body size shapes physiology.',
 'Bigger animals have lower surface-area-to-volume ratios, so they lose less heat per gram and need special structures for exchange.',
 'Metabolic rate rises with mass, but less than proportionally: a shrew burns far more energy per gram than an elephant.',
 'Kleiber\'s law: BMR ∝ M^0.75. The origin of the 3/4 exponent (fractal supply networks vs other models) is debated. Heart rate scales ≈ M^−0.25, so most mammals have ≈ 10⁹ lifetime heartbeats.',
 'Kleiber exponent|≈ 0.75;Shrew heart rate|≈ 800–1,000 bpm', 'BIO:33.1 BIO:33.3', f='B ∝ M^(3/4)', c='C2', oq=['The mechanistic origin and universality of the 3/4 exponent are still debated.'], k='dimensional_scaling', w='human_body')
n('bio_energy_budgets_nutrition','Nutrition and energy budgets','concept','bio_metabolic_integration','Intake, expenditure and storage.',
 'Animals get energy from food: carbohydrates, fats and proteins, and need vitamins, minerals and water.',
 'Basal metabolic rate is the minimum energy at rest. Ectotherms use ≈ 10× less energy than endotherms of the same size.',
 'Respiratory quotient (CO₂/O₂) is ≈ 1.0 for carbohydrate, ≈ 0.7 for fat. Energy balance relates intake, work, heat and storage. Obesity and undernutrition are major public-health issues.',
 'RQ carbohydrate / fat|≈ 1.0 / 0.7;Human BMR|≈ 1,400–1,800 kcal/day', 'BIO:34.2 ANP:24.6 ANP:24.7', w='human_body')
n('bio_comparative_digestion','Comparative digestive systems','concept','bio_energy_budgets_nutrition','Digestion across animals.',
 'Animals have sac-like or tube-like guts. Herbivores have long guts or fermentation chambers, carnivores shorter ones.',
 'Ruminants (cows) ferment plant material in a rumen with microbes. Birds use a muscular gizzard with grit in place of teeth.',
 'Hindgut fermenters (horses, rabbits) differ from foregut fermenters; microbial fermentation yields short-chain fatty acids that supply ≈ 60–70% of a cow\'s energy.',
 'Ruminant energy from SCFAs|≈ 60–70%;Cow stomach chambers|4', 'BIO:34.1 BIO:34.3 COB:16.2', k='digestion_renal', w='digestive_system')
n('bio_comparative_circulation','Comparative circulation','concept','bio_animal_form_scaling','Open, closed, single and double circuits.',
 'Insects have open circulation; fish have a single circuit with a two-chambered heart; birds and mammals have two circuits with a four-chambered heart.',
 'Double circulation keeps oxygenated and deoxygenated blood separate and allows high pressure systemic flow, supporting endothermy.',
 'Amphibian and reptile three-chambered hearts allow shunting; crocodilians have a four-chambered heart with a foramen of Panizza. Blood pressure scales little with body size, except in giraffes (≈ 250 mmHg at heart level).',
 'Fish heart chambers|2;Bird and mammal heart chambers|4', 'BIO:40.1 BIO:40.3 COB:16.3', k='blood_circulation', w='heart')
n('bio_comparative_respiration','Gas exchange across animals','concept','bio_comparative_circulation','Skin, gills, tracheae and lungs.',
 'Small animals exchange gases through the skin. Fish use gills, insects use tracheal tubes and vertebrates on land use lungs.',
 'Fish gills use countercurrent flow to extract up to ≈ 80% of O₂ from water. Bird lungs have one-way airflow through air sacs, giving them an advantage at altitude.',
 'Water holds ≈ 30× less O₂ than air and is 800× denser and ≈ 50× more viscous. Fick\'s law sets diffusion limits: rate ∝ area × ΔP / thickness.',
 'O₂ capacity of water vs air|≈ 1/30 per litre;Fish gill extraction|up to ≈ 80%', 'BIO:39.1 BIO:39.2 BIO:39.3', k='respiratory_physiology', w='respiratory_system')
n('bio_oxygen_transport_diving','Oxygen binding, myoglobin and diving','concept','bio_hemoglobin_cooperativity bio_comparative_respiration','Oxygen carriers and extreme adaptations.',
 'Myoglobin stores oxygen in muscle. Diving mammals have high myoglobin, large blood volume and slow their heart rate.',
 'Elephant seals dive > 1 h; sperm whales over 2 h. Bar-headed geese fly over the Himalayas with hemoglobin of high O₂ affinity.',
 'Myoglobin has a hyperbolic binding curve with P₅₀ ≈ 2.8 mmHg, versus Hb ≈ 26 mmHg. Antarctic icefish have no hemoglobin at all, relying on dissolved O₂ in cold water.',
 'Myoglobin P₅₀|≈ 2.8 mmHg;Hb P₅₀|≈ 26 mmHg', 'BIO:39.4 ANP:22.5', k='heme_oxygen', w='mol:heme_b')
n('bio_osmoregulation','Osmoregulation across animals','concept','bio_diffusion_osmosis bio_comparative_circulation','Balancing water and salt.',
 'Marine fish lose water and drink seawater; freshwater fish gain water and make dilute urine. Osmoconformers match their surroundings, osmoregulators do not.',
 'Salt glands, gills and kidneys excrete excess salts. Desert mammals make very concentrated urine.',
 'Kangaroo rat urine reaches ≈ 5,000 mOsm/L (human max ≈ 1,200). Sharks retain urea and TMAO to equal seawater osmolarity (≈ 1,000 mOsm/L).',
 'Kangaroo rat urine|≈ 5,000 mOsm/L;Human max urine|≈ 1,200 mOsm/L', 'BIO:41.1 BIO:41.2 COB:16.1', k='digestion_renal homeostasis', w='kidney_l')
n('bio_excretion_nitrogen','Excretory systems and nitrogenous wastes','concept','bio_osmoregulation bio_amino_acid_catabolism','Disposing of waste.',
 'Flatworms use protonephridia, insects Malpighian tubules and vertebrates kidneys. Wastes are ammonia, urea or uric acid.',
 'Ammonia is toxic but water-hungry to excrete; uric acid is nearly dry. The choice reflects the habitat and egg-laying style.',
 'The vertebrate nephron filters ≈ 180 L plasma per day, reabsorbing > 99%. Countercurrent multiplication in the loop of Henle builds the medullary gradient.',
 'GFR (human)|≈ 125 mL/min;Waste of birds|uric acid', 'BIO:41.3 BIO:41.4 ANP:25.5', k='digestion_renal', w='nephron')
use('kidney_l nephron')
n('bio_thermoregulation_animals','Thermoregulation: ectotherms and endotherms','concept','bio_homeostasis_concept bio_energy_budgets_nutrition','Keeping body temperature in range.',
 'Endotherms (birds, mammals) make heat internally; ectotherms (most reptiles, fish, insects) rely on environmental heat and behaviour.',
 'Insulation, sweating, shivering, vasodilation and countercurrent heat exchange help control temperature. Hibernation and torpor save energy.',
 'Endothermy costs ≈ 5–10× more energy but extends activity to cold and night. Bluefin tuna and some sharks are regionally endothermic using retia mirabilia. Brown fat uncoupling protein (UCP1) produces heat without ATP.',
 'Human core temperature|≈ 37 °C;Torpid hummingbird metabolism|≈ 1/15 of normal', 'BIO:33.3 ANP:24.6', k='homeostasis temperature_heat', w='hypothalamus', rel='thermoregulation')
n('bio_locomotion_skeletons','Skeletons and locomotion','concept','bio_comparative_circulation','Hydrostatic, exo- and endoskeletons.',
 'Animals support and move their bodies with hydrostatic skeletons (worms), exoskeletons (insects) or endoskeletons (vertebrates).',
 'Muscles work in antagonistic pairs across joints. Running, flying and swimming each have different mechanical trade-offs.',
 'Cost of transport falls with body size and is lowest for swimming, then flying, then running. Insect flight muscles can be asynchronous, contracting multiple times per nerve impulse.',
 'Bee wingbeat|≈ 230 Hz;Muscle shortening speed|≈ 5–10 lengths/s', 'BIO:38.1 BIO:38.3 BIO:38.4', k='musculoskeletal', w='skeletal_system')
n('bio_endocrine_comparative','Hormones and endocrine regulation','concept','bio_signaling_overview bio_nuclear_receptors','Chemical coordination across animals.',
 'Hormones are chemical messengers released into the blood. Insects have ecdysone for moulting and juvenile hormone; vertebrates have a wide range of peptide and steroid hormones.',
 'Feedback keeps levels stable, such as thyroid hormone controlled via the hypothalamus and pituitary. Amphibian metamorphosis is driven by thyroid hormone.',
 'Hormone classes: peptide, steroid, amine. Half-lives range from minutes (insulin ≈ 5 min) to days (thyroxine ≈ 7 days). The hypothalamic–pituitary axes work as cascades with negative feedback.',
 'Insulin half-life|≈ 5 min;Thyroxine half-life|≈ 7 days', 'BIO:37.1 BIO:37.2 BIO:37.3 BIO:37.4 ANP:17.2', k='endocrine_physiology', w='endocrine_system')
use('endocrine_system pituitary_gland thyroid adrenal_glands pancreas pancreatic_islets')
n('bio_reproduction_strategies','Animal reproduction strategies','concept','bio_meiosis_variation','Sexual and asexual reproduction.',
 'Animals reproduce sexually or asexually, with external or internal fertilisation, and lay eggs, give live birth or both.',
 'Parthenogenesis occurs in some insects, lizards and sharks. Hormones tightly control human cycles.',
 'Reproductive strategies lie on an r/K continuum. Placental mammals nourish embryos via a placenta; marsupials give birth early; monotremes lay eggs.',
 'Human gestation|≈ 38 weeks;Menstrual cycle|≈ 28 days', 'BIO:43.1 BIO:43.2 BIO:43.3 BIO:43.4 COB:18.1 COB:18.3', k='development_biology', w='reproductive_system')
use('reproductive_system testes ovaries uterus sperm egg_cell')
use('cardiovascular_system respiratory_system digestive_system urinary_system muscular_system skeletal_system integumentary_system')
use('heart lung_l alveoli liver stomach small_intestine large_intestine villi')
use('artery vein capillary blood red_blood_cell platelet')

# ---------------- 14 Neuroscience & behavior ----------------
section('bio_neuro', 'Neuroscience and behavior',
 'How nervous systems sense, compute and drive behaviour.',
 'Neurons send electrical and chemical signals. Networks of neurons sense the world, store memories, make decisions and control the body.',
 'Action potentials travel along axons, synapses pass the message, and plasticity changes connections with experience. Behaviour has both proximate (mechanism) and ultimate (evolutionary) explanations.',
 'Understanding the brain spans scales: ion channels, synaptic plasticity, circuits and whole-brain dynamics. Many questions, such as consciousness and memory encoding, remain open.',
 'brain_organization')
use('nervous_system neuron astrocyte synapse neuromuscular_junction')
n('bio_neuron_glia','Neurons and glial cells','structure','bio_membrane_potential','Cells of the nervous system.',
 'Neurons have dendrites that receive input, a cell body and an axon that sends output. Glia (astrocytes, oligodendrocytes, microglia) support them.',
 'Myelin from oligodendrocytes and Schwann cells speeds conduction. The brain has ≈ 86 billion neurons and about as many glia.',
 'Neuron types are classified by shape, transmitter and gene expression (hundreds of types by single-cell RNA-seq). Axon lengths reach 1 m or more in humans.',
 'Human brain neurons|≈ 86 billion;Myelinated conduction speed|≈ 100 m/s', 'BIO:35.1 ANP:12.2', k='cell_types', w='neuron')
n('bio_action_potential_channels','Action potentials and ion channels','process','bio_neuron_glia bio_facilitated_transport','All-or-none electrical spikes.',
 'When a neuron\'s membrane voltage reaches threshold, voltage-gated Na⁺ channels open, causing a rapid spike that is then terminated by K⁺ channels.',
 'The spike regenerates down the axon without weakening. Refractory periods keep it moving in one direction.',
 'Hodgkin and Huxley\'s squid axon model (1952) describes the gating variables m, h, n. Peak potential ≈ +30 to +40 mV; speed ≈ 1 m/s unmyelinated to ≈ 120 m/s myelinated (saltatory conduction).',
 'Threshold|≈ −55 mV;Peak|≈ +30 to +40 mV', 'BIO:35.2 ANP:12.4', k='action_potential', w='neuron', rel='action_potential', lab='microscope:neuron_spike_demo')
n('bio_synapse_neurotransmitters','Synapses and neurotransmitters','process','bio_action_potential_channels','Chemical communication between neurons.',
 'At a synapse, an arriving spike triggers release of neurotransmitter, which binds receptors on the next cell and excites or inhibits it.',
 'Glutamate is the main excitatory transmitter and GABA the main inhibitory one. Others: dopamine, serotonin, acetylcholine.',
 'Ca²⁺ entry triggers vesicle fusion (SNAREs) within ≈ 0.2 ms. Ionotropic receptors act in ms; metabotropic ones in 100s ms to s. SSRIs block serotonin reuptake; botulinum toxin cleaves SNAREs.',
 'Synaptic delay|≈ 0.5–1 ms;Synapses in human brain|≈ 10¹⁴', 'BIO:35.2 ANP:12.5', k='synapse_plasticity', w='synapse', mol='dopamine serotonin gaba acetylcholine noradrenaline', rel='synaptic_transmission')
n('bio_synaptic_plasticity_memory','Synaptic plasticity, learning and memory','concept','bio_synapse_neurotransmitters','Connections change with experience.',
 'Synapses strengthen or weaken with use. This is a main basis for learning and memory.',
 'Long-term potentiation (LTP) in the hippocampus is the best studied form. Memories move from short-term to long-term storage via consolidation.',
 'LTP involves NMDA receptors, Ca²⁺ influx and AMPA receptor insertion. H.M. showed the hippocampus is needed to form new declarative memories. How engrams store information over years remains an active question.',
 'H.M. surgery|1953;Memory consolidation|hours to years', 'BIO:35.3 ANP:14.2', k='memory_learning synapse_plasticity', c='C2', oq=['How long-term memory is physically encoded and maintained across molecular turnover is unresolved.'], w='hippocampus', rel='hippocampus')
n('bio_sensory_transduction','Sensory receptors and transduction','concept','bio_action_potential_channels','Turning stimuli into nerve signals.',
 'Receptors convert light, sound, chemicals, touch and heat into electrical signals. Different receptor types respond to different stimuli.',
 'Sensory neurons adapt to constant stimuli. Signal strength is coded by firing rate and number of cells.',
 'Weber–Fechner and Stevens\' power law relate stimulus to perceived intensity. TRP channels sense temperature and chemicals; Piezo channels sense force (2021 Nobel).',
 'Weber fraction|ΔI/I ≈ constant;Nobel for TRPV1/Piezo|2021', 'BIO:36.1 BIO:36.2 ANP:14.1', k='sensory_systems', w='peripheral_nerves')
n('bio_vision_photoreception','Vision and photoreception','process','bio_sensory_transduction','From photons to sight.',
 'Light hits rods and cones in the retina. A pigment molecule changes shape and starts a signal that travels via the optic nerve to the brain.',
 'Rods work in dim light; cones give colour (three types in humans). The fovea has the sharpest vision.',
 'Retinal isomerises from 11-cis to all-trans in ≈ 200 fs; the cascade (rhodopsin → transducin → PDE) amplifies a single photon response ≈ 10⁵-fold. Rods can respond to single photons.',
 'Rods / cones|≈ 120 M / 6 M;Isomerisation time|≈ 200 fs', 'BIO:36.5 ANP:14.1', k='vision_eye', w='retina', mol='retinal', rel='vision')
n('bio_hearing_chemosense','Hearing, balance, taste and smell','concept','bio_sensory_transduction','Other senses.',
 'Hair cells in the cochlea turn sound vibrations into signals. Taste and smell detect molecules with chemical receptors.',
 'Humans have ≈ 400 functional olfactory receptor genes and five basic tastes. The vestibular system senses head motion.',
 'The cochlea performs a frequency analysis along the basilar membrane (≈ 20 Hz–20 kHz). Olfactory receptors are GPCRs; Buck and Axel won the 2004 Nobel.',
 'Human hearing range|≈ 20 Hz–20 kHz;Olfactory receptor genes|≈ 400', 'BIO:36.3 BIO:36.4', k='sound_hearing sensory_systems', w='temporal_lobe')
n('bio_brain_organization','Organisation of the central nervous system','structure','bio_neuron_glia','Brain regions and their roles.',
 'The brain\'s major regions are the cerebrum (thinking, senses, movement), cerebellum (coordination) and brainstem (vital functions).',
 'The cerebral cortex has four lobes. Hippocampus is key for memory, amygdala for emotion and hypothalamus for homeostasis.',
 'Brain mass ≈ 1.4 kg (2% of body mass, ≈ 20% of resting energy). Functional specialisation coexists with distributed networks; connectomics maps wiring (fly connectome 2023, ≈ 140,000 neurons).',
 'Brain energy share|≈ 20% of resting;Cortex thickness|≈ 2–4 mm', 'BIO:35.3 ANP:13.2', k='brain_organization connectome', w='brain')
use('brain cerebral_cortex frontal_lobe parietal_lobe temporal_lobe occipital_lobe hippocampus amygdala hypothalamus thalamus cerebellum brainstem spinal_cord peripheral_nerves basal_ganglia corpus_callosum')
use('eye_l retina fovea optic_nerve lens cornea rod_cell cone_cell')
n('bio_autonomic_reflexes','Autonomic nervous system and reflexes','concept','bio_brain_organization','Automatic control of organs.',
 'The sympathetic system prepares the body for action ("fight or flight") and the parasympathetic system promotes rest and digestion.',
 'A reflex arc (sensor, spinal circuit, effector) gives fast responses without the brain, such as the knee jerk.',
 'Sympathetic postganglionic fibres use noradrenaline and parasympathetic use acetylcholine. Baroreflex adjusts heart rate within 1–2 beats of blood-pressure change.',
 'Knee-jerk latency|≈ 50 ms;Parasympathetic nerve|vagus (cranial X)', 'BIO:35.4 ANP:15.1 ANP:15.2', k='homeostasis', w='brainstem')
n('bio_sleep_circadian','Sleep and circadian rhythms','concept','bio_brain_organization','Daily cycles in physiology.',
 'Animals have internal clocks with a ≈ 24 h cycle set by light. Sleep alternates between NREM and REM stages.',
 'The suprachiasmatic nucleus is the master clock; melatonin from the pineal rises at night.',
 'Clock genes (PER, CRY, CLOCK, BMAL1) form a transcription–translation feedback loop with ≈ 24 h period (Nobel 2017). Sleep functions (memory, waste clearance) are active research topics.',
 'Circadian period (humans)|≈ 24.2 h;Nobel Prize for clock genes|2017', 'ANP:15.3', k='sleep_circadian', c='C2', oq=['The core biological function of sleep is not settled.'], w='hypothalamus', mol='melatonin')
n('bio_nervous_disorders','Neurological disorders','concept','bio_synaptic_plasticity_memory','When circuits fail.',
 'Disorders include stroke, epilepsy, Parkinson\'s, Alzheimer\'s and multiple sclerosis.',
 'Parkinson\'s disease follows loss of dopamine neurons in the substantia nigra; MS is autoimmune demyelination.',
 'Alzheimer\'s is linked to amyloid-β plaques and tau tangles; amyloid-targeting antibodies slow decline modestly. Causal chains and best targets remain contested.',
 'Dementia prevalence worldwide|≈ 55 million;Parkinson\'s dopamine neuron loss|≈ 60–80% at diagnosis', 'BIO:35.5 ANP:16.1', k='aging_biology', c='C2', oq=['The causal role of amyloid and tau in Alzheimer\'s disease and best therapeutic targets are still debated.'], w='brain')
n('bio_behavior_proximate_ultimate','Animal behaviour: proximate and ultimate causes','concept','bio_natural_selection bio_brain_organization','Tinbergen\'s four questions.',
 'Behaviour has immediate causes (hormones, neurons) and evolutionary causes (why selection favoured it).',
 'Tinbergen asked: mechanism, development, function and evolution. Fixed action patterns (egg-rolling in geese) are innate; imprinting and song learning are learned.',
 'Behavioural genetics (foraging gene in Drosophila) and optimality models link genes to ecology. Nobel to Lorenz, Tinbergen, von Frisch (1973).',
 'Nobel for ethology|1973;Tinbergen questions|4', 'BIO:45.7 COB:19.4', k='natural_selection', w='place:park')
n('bio_learning_social_behavior','Learning, foraging and social behaviour','concept','bio_behavior_proximate_ultimate bio_kin_selection_behavior_evo','Habituation, conditioning, foraging and cooperation.',
 'Animals learn through habituation, conditioning and imitation. They also forage, defend territories, form groups and sometimes cooperate.',
 'Optimal foraging models predict diet choice. Honeybees communicate food location by the waggle dance (von Frisch).',
 'Marginal value theorem predicts when to leave a patch. Eusocial insects and naked mole-rats have reproductive division of labour; cooperative breeding is common in birds.',
 'Honeybee dance|encodes distance and direction;Marginal value|leave when rate drops to average', 'BIO:45.7 COB:19.4', k='cognition_psychology', w='place:park')
n('bio_migration_navigation','Migration and animal navigation','concept','bio_learning_social_behavior','Long journeys with built-in compasses.',
 'Birds, turtles, salmon and butterflies migrate thousands of kilometres using the Sun, stars, magnetic fields and smell.',
 'Arctic terns migrate ≈ 70,000 km a year. Salmon return to natal streams using odour cues.',
 'Magnetoreception may involve cryptochromes (radical-pair mechanism) and magnetite. Evidence for specifics remains incomplete.',
 'Arctic tern migration|≈ 70,000 km/yr;Bar-tailed godwit nonstop flight|≈ 11,000 km', 'BIO:45.7', c='C2', oq=['The molecular basis of magnetoreception in animals is not established.'], w='place:air')
n('bio_neuro_methods','Methods in neuroscience','tool','bio_brain_organization','Recording and manipulating the brain.',
 'Neuroscientists record electrical activity (EEG, patch clamp), image the brain (fMRI, PET) and manipulate circuits with light (optogenetics).',
 'EEG has ms resolution but poor spatial detail; fMRI has mm resolution but is slow (seconds).',
 'fMRI measures BOLD, an indirect proxy for neural activity. Two-photon calcium imaging records hundreds of neurons; Neuropixels probes record from thousands. Statistical issues in neuroimaging (cluster inflation, small samples) are known concerns.',
 'EEG time resolution|≈ ms;fMRI spatial resolution|≈ 1–3 mm', 'ANP:1.7 BIO:35.3', k='medical_imaging mri_tech replication_crisis', w='brain')
save('bio_physio_neuro')

# ---------------- 15 Immunology ----------------
section('bio_immuno', 'Immunology',
 'Innate and adaptive defences, antibodies, vaccines and disorders.',
 'The immune system recognises and removes threats. Innate defences respond fast and generally; adaptive defences respond specifically and remember.',
 'Barriers, phagocytes and inflammation form the first response. B and T lymphocytes recognise specific antigens, make antibodies and kill infected cells, and memory cells give lasting protection after infection or vaccination.',
 'Immune responses balance defence and tolerance. Failures cause allergy, autoimmunity or immunodeficiency; manipulating them underlies vaccines, transplants and cancer immunotherapy.',
 'immune_system')
use('lymphatic_immune_system lymph_nodes spleen thymus macrophage neutrophil lymphocyte_t lymphocyte_b')
n('bio_innate_immunity','Innate immunity: barriers, phagocytes and inflammation','concept','bio_pathogenesis','The first line of defence.',
 'Skin, mucus and acid block most invaders. Phagocytes (neutrophils, macrophages) engulf microbes and inflammation brings more cells.',
 'Complement proteins mark and kill microbes; interferons warn neighbouring cells about viruses; fever helps.',
 'Pattern-recognition receptors (Toll-like receptors) detect PAMPs. NF-κB drives cytokine release; neutrophil extracellular traps catch microbes. Sepsis is a dysregulated systemic response.',
 'Neutrophils in blood|≈ 50–70% of leukocytes;TLR family in humans|10 members', 'BIO:42.1 MIC:17.1 MIC:17.3 MIC:17.4 MIC:17.5 ANP:21.2', k='immune_system', w='lymphatic_immune_system', rel='immune_response')
n('bio_antigen_presentation_mhc','MHC and antigen presentation','concept','bio_innate_immunity','Showing fragments to T cells.',
 'Cells display protein fragments on MHC molecules. T cells check these fragments to decide whether a cell is infected or foreign.',
 'MHC I (on all nucleated cells) presents to CD8⁺ cytotoxic T cells; MHC II (on dendritic cells, macrophages, B cells) presents to CD4⁺ helper T cells.',
 'HLA genes are the most polymorphic in humans (> 30,000 alleles). Matching HLA is key for transplants. The thymus selects T cells that recognise self-MHC but not self-peptides.',
 'HLA alleles known|> 30,000;Peptide length on MHC I|8–10 aa', 'MIC:18.2 BIO:42.2 ANP:21.3', k='immune_system', w='macrophage')
n('bio_t_cell_immunity','T cells and cellular immunity','concept','bio_antigen_presentation_mhc','Helper and killer T cells.',
 'Helper T cells coordinate other immune cells; cytotoxic T cells kill infected or cancerous cells.',
 'Naive T cells activate in lymph nodes after meeting antigen with co-stimulation, then expand ≈ 10,000-fold.',
 'T cell receptors are generated by V(D)J recombination (repertoire ≈ 10¹⁵ theoretically). Regulatory T cells enforce tolerance; checkpoint receptors (PD-1, CTLA-4) restrain responses.',
 'T cell clonal expansion|≈ 10⁴–10⁵ fold;CD4 count healthy|≈ 500–1,500/µL', 'MIC:18.3 BIO:42.2 ANP:21.3', k='immune_system', w='lymphocyte_t')
n('bio_b_cells_antibodies','B cells and antibodies','concept','bio_antigen_presentation_mhc','Producing specific antibodies.',
 'B cells make antibodies that bind antigens, marking them for destruction or neutralising them.',
 'Antibody classes: IgM (first), IgG (most abundant), IgA (mucosal), IgE (allergy), IgD. Plasma cells secrete thousands of antibodies per second.',
 'Antibodies are Y-shaped with two heavy and two light chains; variable regions give specificity. Somatic hypermutation and class switching refine responses in germinal centres; affinity often rises ≈ 10–1,000-fold.',
 'IgG half-life|≈ 21 days;Antibodies per plasma cell|≈ 2,000/s', 'MIC:18.4 BIO:42.3 ANP:21.4', k='immune_system', w='lymphocyte_b')
n('bio_antibody_diversity','Antibody and receptor diversity (V(D)J)','process','bio_b_cells_antibodies bio_recombination_transposons','Generating a vast repertoire from few genes.',
 'Gene segments are cut and pasted in developing lymphocytes to make a unique receptor in each cell.',
 'RAG1/2 enzymes drive the rearrangement. Junctional diversity and hypermutation add more variation.',
 'The potential repertoire exceeds 10¹¹ antibodies. Tonegawa received the 1987 Nobel for explaining this. Immune repertoire sequencing now tracks clones during disease and vaccination.',
 'Possible antibody types|> 10¹¹;Nobel|1987 (Tonegawa)', 'BIO:42.3 MIC:18.1', w='lymphocyte_b')
n('bio_immune_memory_clonal','Clonal selection and immune memory','concept','bio_t_cell_immunity bio_b_cells_antibodies','Why second infections are milder.',
 'When an antigen meets the matching lymphocyte it multiplies. After infection some cells remain as memory cells.',
 'Primary responses take ≈ 1–2 weeks; secondary responses peak in ≈ 2–3 days with far more antibody.',
 'Burnet\'s clonal selection theory (1957) is a cornerstone of immunology. Memory B-cell and long-lived plasma cell pools can last decades; some antigens (influenza) drift and evade memory.',
 'Primary response peak|≈ 1–2 weeks;Secondary response peak|≈ 2–3 days', 'BIO:42.2 MIC:18.1', k='immune_system', w='lymph_nodes')
n('bio_vaccines','Vaccines and herd immunity','technique','bio_immune_memory_clonal','Training the immune system safely.',
 'A vaccine shows the immune system a harmless form of a pathogen so it builds memory. Types include live-attenuated, inactivated, subunit and mRNA vaccines.',
 'Smallpox was eradicated in 1980 through vaccination. When enough people are immune (herd immunity threshold ≈ 1 − 1/R₀), outbreaks fade.',
 'Adjuvants boost responses; mRNA-LNP vaccines encode antigens and were deployed in 2020–21 (Nobel 2023 for nucleoside modification). Vaccine effectiveness is evaluated by randomised trials and observational data; waning immunity and escape require boosters.',
 'Smallpox eradicated|1980;Herd immunity threshold (measles)|≈ 92–95%', 'MIC:18.5 BIO:21.3 ANP:21.5', f='HIT = 1 − 1/R₀', k='vaccines_medicine', w='lymphatic_immune_system', rel='vaccine_immunity_process')
n('bio_hypersensitivity_autoimmunity','Allergy and autoimmunity','concept','bio_b_cells_antibodies','Immune overreaction and self-attack.',
 'Allergies are overreactions to harmless substances, driven by IgE. In autoimmune disease the body attacks its own tissues, as in type 1 diabetes and rheumatoid arthritis.',
 'Gell–Coombs types I–IV classify hypersensitivity. Anaphylaxis can be life threatening and is treated with adrenaline.',
 'Autoimmune diseases affect ≈ 5–8% of people, mostly women. Triggers combine genes (HLA), infection and environment; molecular mimicry is one proposed mechanism.',
 'People with autoimmune disease|≈ 5–8%;Peanut allergy prevalence|≈ 1–2% (children, US)', 'BIO:42.4 MIC:19.1 MIC:19.2 ANP:21.6', k='immune_system', w='lymphatic_immune_system')
n('bio_immunodeficiency_transplant','Immunodeficiency, transplantation and tolerance','concept','bio_t_cell_immunity','Weak immunity and foreign tissue.',
 'Immunodeficiency can be inherited or acquired (HIV). Transplants are rejected unless donors are matched and immune responses are suppressed.',
 'Tolerance means not attacking self. Immunosuppressive drugs like cyclosporine prevent rejection but raise infection risk.',
 'SCID ("bubble boy") was the first target for gene therapy. Graft-versus-host disease occurs when donor T cells attack the recipient. Pregnancy involves unique fetal tolerance mechanisms.',
 'Kidney transplants (US)|≈ 25,000/yr;Cyclosporine introduced|1983', 'MIC:19.3 MIC:19.4 ANP:21.7', k='immune_system', w='lymphatic_immune_system')
n('bio_cancer_immunotherapy','Cancer and immunotherapy','technique','bio_t_cell_immunity bio_cancer_gene_regulation','Using immunity against tumours.',
 'Immunotherapy removes brakes on T cells (checkpoint inhibitors) or engineers T cells to attack tumours (CAR-T).',
 'Allison and Honjo won the 2018 Nobel for checkpoint blockade. Responses can be durable in some melanoma and lung cancer patients.',
 'Response rates vary (≈ 20–40% in many tumours); biomarkers include PD-L1 and tumour mutational burden. Side effects include immune-related adverse events.',
 'Nobel|2018 (Allison, Honjo);CAR-T first approval|2017', 'MIC:19.5 ANP:21.7', k='cancer_biology immune_system', w='lymphocyte_t')
n('bio_immunoassays','Immunoassays: ELISA and flow cytometry','technique','bio_b_cells_antibodies','Detecting antigens and antibodies.',
 'ELISA uses an enzyme-linked antibody to produce a colour change that tells how much antigen is present.',
 'Lateral-flow tests (pregnancy, rapid antigen) use antibodies on a strip. Flow cytometry counts and sorts cells by fluorescent antibody labels.',
 'Sandwich ELISA sensitivities reach ≈ pg/mL. Monoclonal antibodies (Köhler and Milstein, 1975) provide specificity. Controls and standard curves are essential for quantitation.',
 'ELISA sensitivity|≈ pg–ng/mL;Monoclonal antibody invention|1975', 'MIC:20.1 MIC:20.2 MIC:20.4 MIC:20.5', k='immune_system', w='')
save('bio_immuno_part')

# ---------------- 16 Development ----------------
section('bio_development', 'Developmental biology',
 'How a single cell becomes an organism.',
 'A fertilised egg divides and its cells specialise, folding into layers and organs. Chemical gradients and signals tell cells where they are and what to become.',
 'Key stages are fertilisation, cleavage, gastrulation and organogenesis. Genes like Hox set the body plan, and signalling pathways (Wnt, Hedgehog, Notch, BMP) are reused again and again.',
 'Development is a gene regulatory program in space and time. Evo-devo shows conserved toolkits underlying very different body plans; regeneration and stem cells show how plastic it can be.',
 'development_biology')
n('bio_fertilization','Fertilisation','process','bio_meiosis_variation','Sperm meets egg.',
 'A sperm binds and fuses with an egg, combining genetic material and starting development. The egg then blocks other sperm.',
 'A calcium wave sweeps the egg to activate it. In humans fertilisation occurs in the fallopian tube.',
 'Fast block (membrane depolarisation) and slow block (cortical reaction) prevent polyspermy. Human zygote genome activation occurs at the 4–8 cell stage.',
 'Sperm number in ejaculate|≈ 10⁸;Zygote genome activation|4–8 cell stage', 'BIO:43.2 BIO:43.6 ANP:28.1', k='development_biology', w='egg_cell')
n('bio_cleavage_blastula','Cleavage and blastula','process','bio_fertilization','Rapid divisions of the embryo.',
 'The zygote divides repeatedly without growing, forming a ball of cells and then a hollow blastula.',
 'In mammals the blastocyst has an inner cell mass (source of embryonic stem cells) and a trophoblast that forms the placenta.',
 'Yolk amount shapes cleavage patterns (holoblastic vs meroblastic). Cell polarity and cell–cell contacts set the first fate decisions (Hippo pathway in mouse embryos).',
 'Human blastocyst day|≈ 5–6 days;Cells at blastocyst|≈ 100–200', 'BIO:43.6 ANP:28.2', k='development_biology', w='place:cell')
n('bio_gastrulation_germ_layers','Gastrulation and germ layers','process','bio_cleavage_blastula','Making three layers.',
 'Cells move inward to form three layers: ectoderm (skin, nerves), mesoderm (muscle, bone, blood) and endoderm (gut lining, organs).',
 'Gastrulation sets up the body axes. Lewis Wolpert said "it is not birth, marriage or death, but gastrulation which is truly the most important time in your life."',
 'In humans gastrulation occurs at ≈ day 14–16 with the primitive streak. Conserved movements include invagination, ingression, involution and convergent extension.',
 'Primitive streak appears|≈ day 15;Germ layers|3', 'BIO:43.6 BIO:43.7 ANP:28.2', k='development_biology', w='place:cell', rel='gastrulation_process')
n('bio_neurulation_organogenesis','Neurulation and organogenesis','process','bio_gastrulation_germ_layers','Building nervous system and organs.',
 'The ectoderm folds to form a neural tube, which becomes the brain and spinal cord; organs then form from the three layers.',
 'Folic acid helps prevent neural tube defects such as spina bifida. The heart is the first functional organ, beating by ≈ week 4.',
 'Neural crest cells migrate widely and give rise to peripheral neurons, pigment cells and facial cartilage. Somitogenesis uses a segmentation clock with ≈ 4–6 h (human) period.',
 'Heart begins beating|≈ week 4;Neural tube closure|≈ week 4', 'BIO:43.7 ANP:28.2', k='development_biology', w='place:cell', mol='folic_acid')
n('bio_morphogens_gradients','Morphogens and pattern formation','concept','bio_cleavage_blastula bio_signaling_overview','Concentration gradients give positional information.',
 'A morphogen forms a concentration gradient and cells respond according to how much they receive. In fly embryos, Bicoid sets head–tail pattern.',
 'Wolpert\'s French-flag model explains thresholds. Other morphogens: Sonic hedgehog in limbs, BMP in dorsal–ventral patterning.',
 'Turing reaction–diffusion systems explain periodic patterns (digits, animal skin). The robustness of gradients to noise and scaling with embryo size are active research areas.',
 'Bicoid gradient length|≈ 100 µm;Turing paper|1952', 'BIO:43.7', k='dynamical_chaos development_biology', w='place:cell')
n('bio_hox_developmental_genes','Hox genes and body plan','concept','bio_morphogens_gradients bio_eukaryotic_gene_regulation','Genes that give each segment an identity.',
 'Hox genes specify what each body segment becomes. Mutations can turn an antenna into a leg in flies.',
 'They are arranged along the chromosome in the same order as their expression along the body (colinearity). Vertebrates have four Hox clusters.',
 'Hox genes encode homeodomain transcription factors. Lewis, Nüsslein-Volhard and Wieschaus won the 1995 Nobel. Changes in Hox regulation underlie differences in vertebrate neck and limb.',
 'Human Hox genes|39 in 4 clusters;Homeodomain|≈ 60 aa', 'BIO:43.7 COB:18.2', k='development_biology', w='place:dna')
n('bio_developmental_signaling','Developmental signalling pathways','concept','bio_rtk_cascades bio_morphogens_gradients','Wnt, Hedgehog, Notch, BMP/TGF-β.',
 'A handful of signalling pathways are reused throughout development to tell cells to divide, specialise or die.',
 'Notch handles neighbour-to-neighbour decisions (lateral inhibition); Wnt controls axis and stem cell renewal; Hedgehog patterns limbs.',
 'Mutations in these pathways cause birth defects and cancers (Wnt/APC in colon cancer, Hedgehog/PTCH1 in basal-cell carcinoma). Pathway crosstalk is context-dependent.',
 'Core pathways|≈ 7–10;Colon cancers with Wnt pathway mutations|> 80%', 'BIO:9.3 BIO:43.7', k='cell_signaling development_biology', w='place:cell')
n('bio_organoids_regeneration','Regeneration and metamorphosis','concept','bio_stem_cells_differentiation bio_hox_developmental_genes','Rebuilding and remodelling.',
 'Some animals regrow lost parts: salamanders limbs, planarians whole bodies. Insects and amphibians undergo metamorphosis.',
 'Mammals regenerate livers and fingertips but not limbs. Hormones (ecdysone, thyroid hormone) control metamorphosis.',
 'Blastema formation, dedifferentiation and positional memory underlie limb regeneration. Planarians use ≈ 20–30% neoblasts. Organoids derived from stem cells mimic organ structures in vitro.',
 'Axolotl limb regrowth|≈ weeks;Liver regeneration (human)|≈ 8–15 days', 'BIO:43.7 ANP:28.2', k='development_biology', w='place:cell')
n('bio_human_prenatal_development','Human pregnancy and prenatal development','concept','bio_neurulation_organogenesis bio_reproduction_strategies','From zygote to newborn.',
 'Pregnancy lasts about 38 weeks. The embryo forms organs in the first 8 weeks; then the fetus grows.',
 'The placenta supplies nutrients and oxygen and removes waste. Hormones (hCG, progesterone, oxytocin) regulate pregnancy and birth.',
 'Teratogens (thalidomide, alcohol, rubella) act during sensitive windows. Fetal hemoglobin has higher O₂ affinity than adult Hb. Fetal programming of adult disease (Barker hypothesis) is supported by epidemiology but mechanisms are partly unclear.',
 'Full-term gestation|≈ 38 weeks (from conception);Newborn weight|≈ 3.4 kg', 'BIO:43.5 ANP:28.2 ANP:28.3 ANP:28.4', k='human_development development_biology', w='uterus')
n('bio_plant_embryogenesis_note','Plant embryogenesis and germination','concept','bio_plant_development_flower','Seeds from zygote to seedling.',
 'In plants the zygote becomes a seed embryo with a root and shoot tip and cotyledons; it can wait for years before germinating.',
 'Germination starts when water is taken up (imbibition) and hormones trigger enzyme production.',
 'Seed dormancy is broken by light, cold stratification or fire. The oldest seed germinated: a ≈ 2,000-year-old date palm.',
 'Date palm seed age|≈ 2,000 y;Seed hormone for dormancy|abscisic acid', 'BIO:32.1 BIO:32.2', k='plant_physiology', w='place:soil')
save('bio_dev_part')
