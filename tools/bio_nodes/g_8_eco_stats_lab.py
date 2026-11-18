from lib import *

section('bio_ecology', 'Ecology',
 'Populations, communities, ecosystems and the biosphere.',
 'Ecology studies how organisms interact with each other and their environment. It scales from one population up to the planet, including energy flow and the cycling of matter.',
 'Populations grow, compete, are eaten and cooperate; communities have structure and change over time; ecosystems pass energy along food chains and recycle nutrients. Human activity now reshapes all of it.',
 'Ecological theory uses models (logistic growth, Lotka–Volterra) and long-term data. Conservation biology applies this to slow biodiversity loss, balancing evidence, values and policy under uncertainty.',
 'ecology_energy population_dynamics')
n('bio_ecology_scope','Scope of ecology and the niche','concept','bio_levels_organization','Levels of ecological study and what a species needs.',
 'Ecologists study organisms, populations, communities, ecosystems and the biosphere. A species\' niche is the set of conditions and resources it uses.',
 'Abiotic factors (temperature, water, light) and biotic factors (other species) shape where organisms live. Fundamental niche is the potential range, realised niche is what is actually occupied.',
 'Hutchinson\'s n-dimensional hypervolume formalises niche. Species distribution models predict ranges from climate variables, and can forecast range shifts under warming.',
 'Hutchinson niche|1957;Species range shift (many taxa)|≈ 17 km/decade poleward', 'BIO:44.1 BIO:44.2', k='ecology_energy', w='place:park')
n('bio_population_structure','Population size, density and demography','concept','bio_ecology_scope','Counting and describing populations.',
 'Populations are described by size, density, spacing (clumped, uniform, random) and age structure.',
 'Mark–recapture and quadrats estimate sizes. Life tables and survivorship curves (Types I, II, III) summarise births and deaths by age.',
 'Net reproductive rate R₀ = Σ lₓmₓ; generation time and intrinsic rate r follow from the Euler–Lotka equation. Type III survivorship (high juvenile mortality) is typical of oysters and many fish.',
 'Survivorship types|I, II, III;Net reproductive rate|R₀ = Σ lₓmₓ', 'BIO:45.1 COB:19.1', f='R₀ = Σ lₓ·mₓ', k='population_dynamics', w='place:park', lab='population:life_table')
n('bio_exponential_logistic_growth','Exponential and logistic growth','law','bio_population_structure','Unlimited and limited growth.',
 'Without limits, populations grow exponentially. Real populations level off near the carrying capacity K.',
 'Exponential growth: dN/dt = rN. Logistic: dN/dt = rN(1 − N/K). Real populations often overshoot, cycle or crash.',
 'Solution of logistic: N(t) = K/(1 + ((K − N₀)/N₀)e^(−rt)). Time delays cause oscillations (May\'s chaos in the discrete logistic map for r > ≈ 3).',
 'Exponential equation|dN/dt = rN;Max growth at|N = K/2', 'BIO:45.3 COB:19.2', f='dN/dt = r·N·(1 − N/K)', k='population_dynamics dynamical_chaos', w='place:park', lab='population:exponential_logistic', rel='ode_first_order')
n('bio_life_history_regulation','Life-history strategies and population regulation','concept','bio_exponential_logistic_growth','Trade-offs between growth, reproduction and survival.',
 'r-selected species make many offspring with little care; K-selected species make few offspring with more care. Density-dependent factors (disease, competition) regulate population size.',
 'Weather and disasters act independent of density. Predator–prey and boom–bust cycles (lemmings, snowshoe hare–lynx) are classic examples.',
 'The r/K scheme is a simplification; modern life-history theory uses trade-offs between fecundity and survival. Snowshoe hare cycle period ≈ 10 years.',
 'Hare–lynx cycle|≈ 10 years;Elephant gestation|≈ 22 months', 'BIO:45.2 BIO:45.4 COB:19.2', k='population_dynamics', w='place:park')
n('bio_metapopulations_human_growth','Metapopulations and human population growth','concept','bio_life_history_regulation','Patches of populations and the human trend.',
 'A metapopulation is a set of local populations linked by migration, where local extinction and recolonisation balance. Human population is ≈ 8.1 billion and growth is slowing.',
 'The demographic transition describes falling death rates then birth rates. UN medium projections peak near 10.3 billion in the 2080s.',
 'Levins model: dp/dt = cp(1 − p) − ep. Total fertility rate globally ≈ 2.3; replacement ≈ 2.1. Projections carry substantial uncertainty.',
 'World population|≈ 8.1 billion (2024);Global TFR|≈ 2.3', 'BIO:45.5 COB:19.3', f='dp/dt = c·p(1 − p) − e·p', k='demography_agriculture', w='place:earth')
n('bio_competition_predation','Competition and predation models','concept','bio_exponential_logistic_growth','Species interactions in equations.',
 'Species that need the same resources compete. Predators reduce prey numbers, and prey adaptations evolve in response.',
 'Gause\'s experiments with Paramecium showed competitive exclusion. Lotka–Volterra equations produce predator–prey cycles.',
 'Lotka–Volterra: dx/dt = αx − βxy, dy/dt = δxy − γy. Competitive coexistence requires intraspecific competition to exceed interspecific. Resource partitioning allows coexistence (MacArthur\'s warblers).',
 'Gause experiment|1934;Predator–prey system|2 coupled ODEs', 'BIO:45.6 COB:19.4', f='dx/dt = αx − βxy;  dy/dt = δxy − γy', k='population_dynamics', w='place:park', lab='population:lotka_volterra', rel='ode_systems')
n('bio_symbiosis','Symbiosis: mutualism, commensalism and parasitism','concept','bio_competition_predation','Close relationships between species.',
 'Mutualism benefits both partners (bees and flowers), commensalism benefits one without harm, parasitism benefits one at the cost of the other.',
 'Mycorrhizae, gut microbes, coral–algae and cleaner fish are mutualisms. Parasites include tapeworms, ticks and malaria protists.',
 'Interaction outcomes are context dependent and can shift along a mutualism–parasitism continuum. Parasites alter host behaviour (Toxoplasma in rodents, Ophiocordyceps in ants).',
 'Mycorrhizae partners|≈ 80–90% land plants;Mutualism example|coral and Symbiodiniaceae', 'BIO:45.6 COB:19.4', k='soil_biology', w='place:soil')
n('bio_community_structure','Community structure, diversity and keystone species','concept','bio_competition_predation','Who lives together and how many.',
 'A community is all the species in an area. Species richness counts species; evenness describes how equally abundant they are.',
 'Keystone species (sea otters, wolves, sea stars) affect communities far beyond their abundance. Removing wolves from Yellowstone led to trophic cascades.',
 'Shannon index H = −Σ pᵢ ln pᵢ. Paine\'s Pisaster removal experiment (1966) cut mussel-bed diversity from 15 to 8 species. Species–area relationship S = cA^z with z ≈ 0.15–0.35.',
 'Species–area exponent|z ≈ 0.15–0.35;Pisaster removal|15 → 8 species', 'BIO:45.6 COB:19.4', f='H = −Σ pᵢ ln pᵢ', k='population_dynamics biodiversity_conservation', w='place:park')
n('bio_succession_disturbance','Ecological succession and disturbance','process','bio_community_structure','How communities change over time.',
 'After a disturbance such as fire, communities change in a predictable sequence called succession. Primary succession starts on bare rock; secondary succession starts on soil.',
 'Pioneer species (lichens, grasses) are replaced by shrubs and trees. Intermediate disturbance maintains highest diversity.',
 'Climax community concepts are now seen as less deterministic; priority effects and history matter. After Mount St. Helens (1980), vegetation recovered over decades.',
 'Mount St. Helens eruption|1980;Peak diversity at|intermediate disturbance', 'BIO:45.6', k='ecology_energy', w='place:park')
n('bio_food_webs_energy_flow','Food webs and energy flow','concept','bio_community_structure bio_thermo_laws','Who eats whom and how energy passes.',
 'Energy enters ecosystems through producers and passes to consumers and decomposers. Most energy is lost as heat at each step.',
 'Only about 10% of energy transfers between trophic levels, so food chains are short. Biomass pyramids narrow upward in most ecosystems.',
 'Trophic transfer efficiency ranges ≈ 5–20%. Net primary production = GPP − respiration. Aquatic food webs can show inverted biomass pyramids with rapid-turnover producers.',
 'Typical trophic efficiency|≈ 10%;Global NPP|≈ 100–120 Pg C/yr', 'BIO:46.1 BIO:46.2 COB:20.1', f='NPP = GPP − R', k='ecology_energy biosphere_energy', w='place:park', lab='ecosystem:food_web')
n('bio_primary_production_decomposition','Primary production and decomposition','concept','bio_food_webs_energy_flow bio_photosynthesis_overview','Making and recycling organic matter.',
 'Plants and algae make organic matter (primary production). Decomposers (bacteria, fungi) break down dead matter and return nutrients to the soil and water.',
 'Production is highest in tropical rainforests and coral reefs per area; open ocean covers more area but is nutrient-poor.',
 'Limiting nutrients are N and P on land and in freshwater, and iron in high-nutrient low-chlorophyll ocean regions. Decomposition rate depends on temperature, moisture and litter quality (lignin:N).',
 'Open ocean share of global NPP|≈ 45–50%;Iron-limited ocean regions|Southern Ocean, N. Pacific', 'BIO:46.2 BIO:46.1', k='ecology_energy soil_biology', w='place:soil', lab='ecosystem:nutrient_limitation')
n('bio_biogeochemical_cycles_concept','Biogeochemical cycles','concept','bio_primary_production_decomposition','Cycling of carbon, nitrogen, phosphorus and water.',
 'Elements cycle between living things and the environment. Carbon, nitrogen, phosphorus and water each have reservoirs and fluxes.',
 'Humans have altered these cycles: fossil fuel burning adds CO₂, fertilisers add nitrogen and phosphorus, and runoff causes eutrophication.',
 'Residence times range from days (atmospheric water ≈ 9 d) to millions of years (rock P). Human nitrogen fixation (≈ 150–200 Tg N/yr) now exceeds natural terrestrial fixation (≈ 100–140 Tg N/yr).',
 'Atmospheric N₂|≈ 78%;Atmospheric CO₂ (2024)|≈ 420 ppm', 'BIO:46.3 COB:20.2', k='biogeochemical_cycles nitrogen_cycle carbon_cycle_climate water_cycle', w='place:earth', lab='ecosystem:nutrient_cycle')
n('bio_biomes','Terrestrial and aquatic biomes','concept','bio_biogeochemical_cycles_concept','Major ecological regions.',
 'Biomes are large regions with typical climate and life: tundra, taiga, temperate forest, grassland, desert, tropical forest, plus freshwater and marine systems.',
 'Temperature and precipitation largely predict a land biome (Whittaker diagram). Oceans are divided by depth and light into zones.',
 'Marine habitats include intertidal, pelagic, benthic, abyssal and hydrothermal vent communities (chemosynthesis). Biome shifts under climate change are already observed at treelines and coral reefs.',
 'Tropical rainforest species share|≈ half of terrestrial species;Ocean share of Earth\'s surface|≈ 71%', 'BIO:44.3 BIO:44.4 COB:20.3 COB:20.4', k='biomes_climate', w='place:earth', lab='ecosystem:biome_climate')
n('bio_biogeography_island','Biogeography and island biogeography','concept','bio_community_structure','Where species live and why.',
 'The distribution of species reflects climate, geography and history. Islands hold fewer species than mainlands, and larger or closer islands hold more.',
 'MacArthur and Wilson\'s equilibrium theory (1967) balances immigration and extinction rates.',
 'Latitudinal diversity gradient (more species near the equator) has multiple proposed causes (energy, area, time, speciation rates). Wallace Line and plate tectonics explain faunal differences.',
 'MacArthur–Wilson|1967;Latitudinal gradient|tropics have more species', 'BIO:44.2', k='speciation_biodiversity plate_tectonics', w='place:earth')
n('bio_climate_change_biology','Climate change and ecological impacts','concept','bio_biomes bio_biogeochemical_cycles_concept','How warming and CO₂ affect life.',
 'Rising temperature and CO₂ are shifting ranges, seasons and ecosystems. Oceans are warming and becoming more acidic.',
 'Coral bleaching, phenological mismatches and species range shifts are documented. Ocean pH has fallen by ≈ 0.1 since pre-industrial times.',
 'Global mean surface temperature is ≈ 1.1–1.2 °C above pre-industrial. Impacts depend on adaptation capacity, dispersal, and interactions; tipping points (Amazon dieback, coral loss) are assessed with uncertainty.',
 'Warming since pre-industrial|≈ 1.1–1.2 °C;Ocean pH change|≈ −0.1', 'BIO:44.5 COB:20.2', k='carbon_cycle_climate ocean_acidification greenhouse_effect', w='place:earth')
n('bio_biodiversity_crisis','Biodiversity and the extinction crisis','concept','bio_community_structure bio_mass_extinctions','Why diversity matters and how it is lost.',
 'Biodiversity includes genetic, species and ecosystem diversity. It is declining mainly through habitat loss, overexploitation, invasive species, pollution and climate change.',
 'IUCN assesses extinction risk (Least Concern to Extinct). About 28% of assessed species are threatened. Wildlife populations monitored have declined ≈ 69% since 1970 (WWF Living Planet Index, 2022).',
 'Estimated extinction rates are ≈ 10–1,000× background depending on method. The Living Planet Index is debated methodologically. Ecosystem services (pollination, water purification) are valued at tens of trillions of dollars per year, with substantial uncertainty.',
 'Threatened share of assessed species|≈ 28%;Extinction rate vs background|≈ 10–1000×', 'BIO:47.1 BIO:47.2 BIO:47.3 COB:21.1 COB:21.2', k='biodiversity_conservation', w='place:park')
n('bio_conservation_strategies','Conservation strategies and invasive species','technique','bio_biodiversity_crisis','Protecting and restoring nature.',
 'Conservation tools include protected areas, habitat restoration, species recovery plans, anti-poaching efforts and managing invasive species.',
 'Corridors link habitats. Reintroductions such as gray wolves to Yellowstone and California condor breeding programs show recovery is possible.',
 'Population viability analysis estimates extinction risk; 30×30 targets aim to protect 30% of land and sea by 2030. Invasive species (zebra mussels, cane toads) cause ≈ $400 billion in global costs yearly.',
 'Protected land share (global)|≈ 17%;California condor numbers|22 (1987) → > 500', 'BIO:47.4 COB:21.3', k='biodiversity_conservation', w='place:park', lab='population:pva')
n('bio_ecosystem_services','Ecosystem services and ecological economics','concept','bio_biodiversity_crisis','Benefits nature gives people.',
 'Ecosystems provide food, clean water, pollination, climate regulation and recreation, which have large economic and cultural value.',
 'Wetlands filter water and buffer floods; pollinators support much of food production.',
 'Valuation uses market prices, avoided costs and stated preference methods and is controversial; Costanza et al. estimated ≈ $125–145 trillion per year (2014), a disputed order-of-magnitude figure.',
 'Costanza estimate (2014)|≈ $125–145 trillion/yr (disputed);Pollinator-dependent crops|≈ 35% of production', 'BIO:47.2', c='C2', oq=['Monetary valuation of ecosystem services is methodologically contested and highly assumption-dependent.'], w='place:park')

# ---------------- 18 Biostatistics ----------------
section('bio_biostats', 'Biostatistics and quantitative biology',
 'Statistics, modelling and data analysis for biologists.',
 'Biological data are noisy, so conclusions need statistics. Describing data, estimating uncertainty and testing ideas fairly are core lab skills.',
 'Probability distributions model variation; confidence intervals and hypothesis tests quantify evidence; regression and ANOVA relate variables; differential equations model change in populations and cells.',
 'Good practice includes design before analysis, awareness of multiple testing, effect sizes, reproducible code and honest reporting. Mechanistic models (ODEs, stochastic simulation) complement statistical ones.',
 'probability bayes_stats regression_models')
use('limits_continuity derivative integral_ftc integration_techniques random_variables expectation_variance')
n('bio_descriptive_statistics','Descriptive statistics and data display','technique','expectation_variance','Summarising data.',
 'Mean, median, standard deviation and range summarise a data set; histograms and box plots show its shape.',
 'The mean is sensitive to outliers; the median is not. Standard error (SD/√n) describes the precision of a mean.',
 'Sample variance uses n − 1 for an unbiased estimate. Report SD for spread of data and SE or CI for uncertainty of the mean; error bars must be labelled.',
 'Sample SD denominator|n − 1;Standard error|SD/√n', 'IST:2.3 IST:2.5 IST:2.7 IST:2.4', f='s² = Σ(xᵢ − x̄)²/(n − 1);  SE = s/√n', k='probability', w='')
n('bio_distributions_biology','Common distributions: binomial, Poisson, normal','concept','bio_descriptive_statistics','Models for biological counts and measurements.',
 'The binomial counts successes in n trials (offspring with a trait), the Poisson counts rare events (mutations per genome), and the normal describes many continuous traits.',
 'The Poisson variance equals its mean; for large n the binomial is approximately normal. About 95% of a normal population lies within ±1.96 SD.',
 'Luria–Delbrück\'s experiment used the Poisson-like fluctuation pattern to show mutations arise before selection. Overdispersed counts are better modelled by negative binomial.',
 '95% interval|±1.96 SD;Poisson|mean = variance', 'IST:4.3 IST:4.6 IST:6.1 IST:6.2', f='P(k) = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ', k='probability', w='', rel='random_variables')
n('bio_sampling_clt','Sampling and the central limit theorem','law','bio_distributions_biology','Why sample means are nearly normal.',
 'Means of large random samples are approximately normally distributed, whatever the original distribution, centred on the true mean.',
 'The spread of sample means (standard error) shrinks as 1/√n, so larger samples give more precise estimates.',
 'CLT requires finite variance and independent samples; heavy-tailed data or strong dependence (spatial or temporal autocorrelation) violate it. Bootstrapping provides an alternative.',
 'SE halves when n|quadruples;n often cited for CLT|≈ 30', 'IST:7.1 IST:7.2 IST:1.2', k='probability', w='')
n('bio_confidence_intervals','Confidence intervals','technique','bio_sampling_clt','Range of plausible values for a parameter.',
 'A 95% confidence interval is computed so that 95% of such intervals from repeated experiments would contain the true value.',
 'It is typically mean ± t × SE. A wider interval means more uncertainty.',
 'It is not "95% probability the parameter is in this interval" for a given interval (frequentist). Bayesian credible intervals give that interpretation under a prior.',
 'Approx. 95% CI|mean ± 2 SE;t critical (df=10, 95%)|2.23', 'IST:8.1 IST:8.2 IST:8.3', f='CI = x̄ ± t*·s/√n', k='bayes_stats', w='')
n('bio_hypothesis_testing','Hypothesis testing and p-values','concept','bio_confidence_intervals','Testing a null hypothesis.',
 'A hypothesis test asks how surprising the data would be if there were no effect (the null hypothesis). The p-value is that probability.',
 'A small p (< 0.05 by convention) suggests the data are unlikely under the null. Type I error is a false positive; Type II is a false negative.',
 'p-values are not the probability the null is true, and are not effect sizes. Power = 1 − β. Misuse (p-hacking, publication bias) contributes to the replication crisis.',
 'Conventional α|0.05;Typical target power|0.8', 'IST:9.1 IST:9.2 IST:9.3 IST:9.4', k='bayes_stats replication_crisis', w='')
n('bio_t_tests','t-tests','technique','bio_hypothesis_testing','Comparing means.',
 'A t-test compares a sample mean with a value, or two group means, accounting for the variability and sample size.',
 'Types: one-sample, two-sample (independent), paired (same subjects before and after). Welch\'s test does not assume equal variances.',
 'Student (W. S. Gosset) derived the t distribution in 1908 while working at Guinness. Assumes approximate normality; for small samples with skew use Wilcoxon/Mann–Whitney.',
 't distribution published|1908 (Student);df paired t|n − 1', 'IST:10.1 IST:10.3 IST:10.4', f='t = (x̄ − μ₀)/(s/√n)', k='bayes_stats', w='')
n('bio_chi_square_tests','Chi-square tests','technique','bio_hypothesis_testing bio_dihybrid_assortment','Testing counts against expectations.',
 'A chi-square test compares observed counts with those expected, such as the 9:3:3:1 ratio in a dihybrid cross.',
 'χ² = Σ(O − E)²/E. A large value means a poor fit. It is also used to test whether two categorical variables are related.',
 'Degrees of freedom: categories − 1 (goodness of fit) or (r − 1)(c − 1). Expected counts should be ≥ 5. For 3 df, the 5% critical value is 7.81.',
 'Critical χ² (df=3, α=0.05)|7.81;Dihybrid df|3', 'IST:11.1 IST:11.2 IST:11.3 BIO:12.3', f='χ² = Σ (O − E)²/E', lab='genetics:chi_square_fit', k='bayes_stats', w='')
n('bio_anova','ANOVA and comparing many groups','technique','bio_t_tests','Testing differences among several means.',
 'ANOVA tests whether any of three or more group means differ, by comparing variation between groups with variation within groups.',
 'A significant F is followed by post-hoc tests (Tukey) to find which groups differ. Running many t-tests inflates false positives.',
 'F = MS_between/MS_within. Assumes independence, normal residuals and equal variances. Mixed-effects models handle repeated measures and nested designs (e.g., cells within animals).',
 'F statistic|MSB/MSW;Groups|≥ 3', 'IST:13.1 IST:13.2', f='F = MS_between / MS_within', k='regression_models', w='')
n('bio_regression_correlation','Correlation and regression','technique','bio_descriptive_statistics','Relating two variables.',
 'Correlation measures how closely two variables move together (−1 to +1). Linear regression fits a line to predict one variable from another.',
 'Correlation does not prove causation. R² is the fraction of variance explained, and residual plots check the fit.',
 'Ordinary least squares minimises squared residuals. Extensions: multiple, logistic (binary outcomes), Poisson and mixed models. Extrapolation beyond data and confounding are common errors.',
 'Pearson r range|−1 to +1;OLS slope|b = r·sy/sx', 'IST:12.2 IST:12.3 IST:12.4 IST:12.5', f='y = a + b·x;  b = r·s_y/s_x', k='regression_models', w='', lab='population:regression_fit')
n('bio_multiple_testing_pvalues','Multiple testing and false discovery','concept','bio_hypothesis_testing','Many tests, many false positives.',
 'If you test 20 hypotheses at p < 0.05, you expect about one false positive by chance alone.',
 'Bonferroni divides α by the number of tests; the false discovery rate (Benjamini–Hochberg) controls the share of false positives among hits.',
 'Genomic studies test 10⁴–10⁶ hypotheses; thresholds such as 5×10⁻⁸ (GWAS) or FDR < 5% (RNA-seq) are used. Pre-registration reduces analytic flexibility.',
 'Expected false positives (20 tests)|≈ 1;GWAS threshold|5×10⁻⁸', 'IST:9.2', k='bayes_stats replication_crisis', w='')
n('bio_experimental_design_stats','Experimental design and power','technique','bio_experimental_basics bio_hypothesis_testing','Planning to get a clear answer.',
 'Good design uses randomisation, replication, controls and blocking. Sample size should be chosen before the experiment.',
 'Pseudoreplication occurs when non-independent samples are treated as independent. Power analysis estimates the needed n for a chosen effect size.',
 'Sample size n ≈ 2(z₁₋α/₂ + z₁₋β)²σ²/δ² per group. Randomised block, factorial and split-plot designs increase efficiency; ethical design aims to minimise animals and participants (3Rs).',
 'Common power target|80–90%;3Rs|Replace, Reduce, Refine', 'IST:1.4 IST:1.2', f='n ≈ 2(z₁₋α/₂ + z₁₋β)²·σ²/δ²', w='')
n('bio_bayesian_inference_bio','Bayesian inference in biology','concept','bio_confidence_intervals','Updating beliefs with data.',
 'Bayes\' theorem combines prior knowledge with data to give an updated (posterior) probability. It is used in diagnostics, genetics and phylogenetics.',
 'A positive test for a rare disease may still be most likely a false positive. Example: sensitivity 99%, specificity 95%, prevalence 1% gives ≈ 17% chance of disease after a positive test.',
 'Posterior ∝ likelihood × prior. MCMC samples posteriors for complex models; prior choice matters for small data. Used in BEAST (phylogenetics), STRUCTURE (populations) and clinical trial adaptive designs.',
 'PPV example|≈ 17%;Bayes\' theorem|1763', 'IST:3.3 IST:3.4', f='P(H|D) = P(D|H)P(H)/P(D)', k='bayes_stats', w='')
use('ode_first_order numerical_integration ode_solvers error_analysis matrices_systems estimation_theory')
n('bio_ode_models_biology','Differential-equation models in biology','technique','ode_first_order bio_exponential_logistic_growth bio_michaelis_menten','Modelling change with ODEs.',
 'Rates of change in biology are modelled with differential equations: growth dN/dt, enzyme reactions, drug decay and epidemics.',
 'First-order decay dC/dt = −kC gives half-life t½ = ln2/k. Michaelis–Menten and logistic models are nonlinear ODEs.',
 'Equilibria and stability come from linearisation (eigenvalues of the Jacobian). Systems such as the SIR model, Lotka–Volterra and gene-circuit toggles show oscillations, bistability and bifurcations; numeric solvers (RK4) handle cases without closed form.',
 'Half-life|t½ = ln 2/k;Drug dosing steady-state|≈ 5 half-lives', 'CA2:4.2 CA2:4.3', f='dC/dt = −k·C → C = C₀e^(−kt)', k='ode_pde dynamical_chaos', w='', rel='ode_solvers', lab='population:ode_playground')
n('bio_matrix_population_models','Matrix population models','technique','matrices_systems bio_population_structure','Leslie matrices for structured populations.',
 'A matrix tracks how many individuals are in each age or stage class and projects them forward one step at a time.',
 'The dominant eigenvalue λ gives the long-term growth rate: λ > 1 growth, λ < 1 decline.',
 'Elasticity analysis shows which vital rates most affect λ; for sea turtles, adult survival dominates, guiding conservation (turtle excluder devices). Stochastic and density-dependent extensions exist.',
 'Population growth rate|λ = dominant eigenvalue;Loggerhead sea turtle key rate|adult survival', 'CA3:2.1', f='n(t+1) = L·n(t)', k='linalg_hilbert population_dynamics', w='', lab='population:age_structure', rel='eigen')
n('bio_bioinformatics_data_analysis','Data analysis, programming and reproducibility','tool','bio_descriptive_statistics','R, Python and reproducible workflows.',
 'Biologists increasingly write code in R or Python to analyse and plot data, and keep scripts and data organised so others can repeat the work.',
 'Version control (git), notebooks and workflow managers (Snakemake, Nextflow) support reproducibility. FAIR data principles: findable, accessible, interoperable, reusable.',
 'Common failure modes: undocumented data cleaning, hidden manual steps, non-seeded random numbers and software-version drift. Containers (Docker) fix environments; code review catches errors.',
 'FAIR principles|2016;Survey of irreproducible results (Nature, 2016)|> 70% failed to reproduce another\'s experiment', 'DSC:1.1', k='replication_crisis computation', w='')

# ---------------- 19 Lab skills ----------------
section('bio_lab', 'Lab skills and research practice',
 'Hands-on techniques, safety, data handling and research ethics.',
 'Biology is learned at the bench as well as in books. This section covers microscopes, solutions, instruments, culture, safety and honest record-keeping.',
 'Good technique makes data trustworthy: accurate pipetting, clean sterile work, calibrated instruments, careful notes. Safety rules and ethics keep people, animals and the public protected.',
 'Experiments need controls, calibration and documentation to be repeatable. Regulatory frameworks (IBC, IRB, IACUC, biosafety levels) formalise responsible practice.',
 'scientific_method')
n('bio_lab_safety_biosafety','Laboratory safety and biosafety levels','technique','','Protecting people and the environment.',
 'Wear gloves, eye protection and a lab coat; know where eyewash, showers and exits are; never eat or drink in the lab; dispose of waste correctly.',
 'Biosafety levels (BSL-1 to BSL-4) match containment to the hazard. Most teaching labs are BSL-1 or BSL-2.',
 'BSL-3 requires controlled access and directional airflow for agents like M. tuberculosis; BSL-4 (Ebola, Marburg) uses full-body suits or Class III cabinets. Risk assessment weighs agent, procedure and host factors.',
 'Biosafety levels|1–4;Safety data sheet sections|16', 'MIC:13.1', w='')
n('bio_light_microscopy','Light microscopy','tool','bio_cell_theory','Seeing cells with visible light.',
 'A compound microscope uses lenses to magnify cells. Total magnification is eyepiece × objective, and resolution limits detail.',
 'Bright-field, phase-contrast and DIC reveal unstained cells. Staining (Gram, H&E) adds contrast.',
 'Abbe limit: d = λ/(2NA) ≈ 200 nm for visible light and NA ≈ 1.4. Oil immersion raises NA. Resolution, not magnification, decides what can be seen.',
 'Resolution limit|≈ 200 nm;Typical total magnification|40–1,000×', 'BIO:4.1 MIC:2.1 MIC:2.2 MIC:2.3 MIC:2.4', f='d = λ / (2·NA)', k='optics_geometric wave_optics', w='', lab='microscope:light_scope')
n('bio_fluorescence_microscopy','Fluorescence and confocal microscopy','tool','bio_light_microscopy','Labelling molecules with light.',
 'Fluorescent dyes or proteins (like GFP) glow when lit with the right colour, showing where specific molecules are in cells.',
 'Confocal microscopes block out-of-focus light for sharp sections. Live-cell imaging tracks proteins over time.',
 'Super-resolution methods (STED, PALM/STORM; Nobel 2014) reach ≈ 20–50 nm. Photobleaching and phototoxicity limit imaging; careful controls avoid artefacts from overexpression.',
 'Super-resolution|≈ 20–50 nm;GFP discovered|1962 (Shimomura), Nobel 2008', 'MIC:2.3 MIC:20.5', k='light_scattering', w='', lab='microscope:fluorescence_labels')
n('bio_electron_microscopy','Electron microscopy and cryo-EM','tool','bio_light_microscopy','Imaging with electrons.',
 'Electron microscopes use electron beams to see detail far smaller than light microscopes: TEM shows interior slices, SEM shows surfaces.',
 'Samples must be fixed and kept in vacuum (except cryo methods). Images are grey-scale.',
 'Resolution ≈ 0.05–0.2 nm in practice for TEM; cryo-EM reconstructs structures to near-atomic resolution from thousands of frozen particle images (Nobel 2017).',
 'TEM resolution|≈ 0.1 nm;Cryo-EM Nobel|2017', 'BIO:4.1 MIC:2.3', k='wave_particle', w='', lab='microscope:tem_sem')
n('bio_pipetting_solutions','Pipetting and preparing solutions','technique','bio_mole_molarity','Accurate small volumes and buffers.',
 'Micropipettes deliver exact microlitre volumes. Pipette with the right range, pre-wet tips and dispense steadily.',
 'To make a solution: calculate mass from molarity × volume × molar mass, dissolve, adjust pH and bring to final volume.',
 'Error sources: temperature, viscosity, angle and speed. Calibration checks gravimetrically. Serial dilutions propagate error; a 1:10 series of 6 steps spans 10⁶.',
 'P200 range|20–200 µL;Typical accuracy|≈ ±1–2%', 'CHE:3.3 CHE:3.4', f='mass = M × V × MW', w='', lab='molecule:dilution_series')
n('bio_spectrophotometry','Spectrophotometry and Beer–Lambert law','technique','bio_pipetting_solutions bio_resonance_aromatic','Measuring concentration by light absorption.',
 'A spectrophotometer measures how much light a solution absorbs. Absorbance is proportional to concentration.',
 'DNA is quantified at 260 nm (A260 of 1.0 ≈ 50 µg/mL dsDNA); proteins at 280 nm or by colour assays (Bradford, BCA).',
 'A = ε·l·c, valid up to A ≈ 1–2. NADH absorbs at 340 nm (ε = 6,220 M⁻¹cm⁻¹), used to follow dehydrogenase kinetics. Blanks and standard curves correct for background.',
 'A260 = 1|≈ 50 µg/mL dsDNA;ε NADH 340 nm|6,220 M⁻¹cm⁻¹', 'CHE:6.1 ORG:14.7', f='A = ε·l·c', k='spectroscopy_methods', w='', lab='enzyme:spectrophotometer_assay')
n('bio_centrifugation_separation','Centrifugation and cell fractionation','technique','bio_pipetting_solutions','Separating by density.',
 'A centrifuge spins samples so heavier components sink. Differential centrifugation separates nuclei, mitochondria and membranes.',
 'Speed is given as relative centrifugal force (× g), not rpm. Density gradients separate similar particles.',
 'RCF = 1.118×10⁻⁵ · r · rpm². Meselson–Stahl used CsCl density-gradient centrifugation to show semiconservative replication. Ultracentrifuges reach ≈ 10⁶ × g.',
 'Ultracentrifuge|≈ 10⁶ × g;Typical bench microfuge|≈ 15,000–21,000 × g', 'BIO:4.1', f='RCF = 1.118×10⁻⁵ · r(cm) · rpm²', w='')
n('bio_cell_culture_aseptic','Cell culture and aseptic technique','technique','bio_microbial_control bio_pipetting_solutions','Growing cells safely and cleanly.',
 'Cells are grown in flasks or dishes with nutrient medium at 37 °C and 5% CO₂. Aseptic technique, working in a biosafety cabinet and sterilising tools, prevents contamination.',
 'Primary cells have limited life; immortal lines (HeLa, from 1951) grow indefinitely. Cultures are checked for mycoplasma.',
 'Cell line misidentification is common (≈ 15–20% of lines), so authentication (STR profiling) is needed. HeLa raised ethical issues about consent; Henrietta Lacks\' family was acknowledged in later agreements.',
 'Mammalian culture conditions|37 °C, 5% CO₂;Misidentified cell lines|≈ 15–20%', 'MIC:13.2 MIC:9.6', w='', lab='microscope:cell_culture')
n('bio_gfp_reporters','Reporter genes and GFP','tool','bio_fluorescence_microscopy bio_recombinant_expression','Making genes visible.',
 'Green fluorescent protein from a jellyfish can be attached to other proteins to see where and when they appear in a living cell.',
 'Reporters such as GFP, luciferase and lacZ show gene activity. Variants cover the whole colour range.',
 'GFP forms its chromophore autocatalytically from Ser65–Tyr66–Gly67 with oxygen; Nobel 2008 (Shimomura, Chalfie, Tsien). Tags can change protein behaviour, so controls are needed.',
 'GFP size|238 aa, ≈ 27 kDa;Excitation / emission|≈ 488 / 509 nm', 'MIC:20.5', k='crispr_biotech', w='mol:gfp_chromophore', mol='gfp_chromophore', ext='RCSB PDB: 1EMA GFP|https://www.rcsb.org/structure/1EMA')
n('bio_lab_notebook_reports','Lab notebooks, data and reports','technique','bio_experimental_basics','Recording and communicating results.',
 'Record what you did and saw, with dates, in a notebook so others can repeat it. Reports follow IMRaD: introduction, methods, results and discussion.',
 'Figures need labelled axes with units, error bars and legends. Raw data should be saved unaltered.',
 'Good practice: pre-specify analyses, record software versions and instrument settings, store data in open formats and deposit in repositories. Image manipulation beyond uniform adjustments is misconduct.',
 'Report structure|IMRaD;Data retention|often ≥ 5–7 years', 'WRG:1.1', w='')
n('bio_literature_scientific_writing','Reading and citing scientific literature','technique','bio_lab_notebook_reports','Finding and evaluating sources.',
 'Primary papers report original experiments; reviews summarise a field. PubMed and Google Scholar help find them.',
 'Read the abstract and figures first, then the methods and discussion critically. Peer review is a check but does not guarantee correctness.',
 'Evaluate effect sizes, sample sizes, controls and conflicts of interest; be aware of preprints, retractions and predatory journals. Cite sources properly to avoid plagiarism.',
 'PubMed records|> 36 million;Retractions per year|≈ 5,000+', 'WRG:1.1', w='', ext='PubMed|https://pubmed.ncbi.nlm.nih.gov/')
n('bio_research_ethics','Research ethics: IRB, IACUC and misconduct','concept','bio_lab_notebook_reports','Rules that protect participants, animals and honesty.',
 'Research with people needs informed consent and review by an Institutional Review Board (IRB); animal research needs approval by an IACUC.',
 'Misconduct means fabrication, falsification and plagiarism. The Tuskegee study and Nuremberg trials led to modern human-subject protections (Belmont Report 1979).',
 'The 3Rs (replace, reduce, refine) guide animal work. Dual-use research and gain-of-function work add biosecurity review. Genomic data raise privacy and consent issues, as does editing of human embryos.',
 'Belmont Report|1979;Principles|respect, beneficence, justice', 'BET:1.1', k='medicine_evidence', w='')
n('bio_field_methods','Field sampling methods','technique','bio_ecology_scope bio_experimental_basics','Collecting data outdoors.',
 'Field biologists use quadrats, transects, traps and cameras. They record location, weather and time and avoid disturbing habitats.',
 'Random or stratified sampling avoids bias; mark–recapture estimates populations.',
 'Detection probability must be modelled (occupancy models). Permits and ethics approvals are needed; environmental DNA and acoustic monitoring reduce disturbance.',
 'Quadrat size (plants)|≈ 1 m²;Camera-trap days per site|≈ 30–60', 'BIO:45.1', w='place:park')
save('bio_eco_stats_lab')
