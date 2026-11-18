"""Import all generators, fill derived fields, write data/nodes/bio_*.json and data/tracks/biology.json."""
import json, importlib, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import lib
from lib import ROOT, ALL, TRACK, FILES, root, ROOT_ID
for m in ['g_1_foundations', 'g_2_biochem', 'g_3_cell', 'g_4_molgen', 'g_5_genomics_micro', 'g_6_evol_div',
          'g_7_physio', 'g_8_eco_stats_lab', 'g_9_electives_processes', 'g_10_extra']:
    if os.path.exists(os.path.join(os.path.dirname(__file__), m + '.py')):
        importlib.import_module(m)
r = root()
by = {d['id']: d for d in ALL}
by[ROOT_ID] = r
# parts = inverse of parents (new nodes only)
for d in ALL:
    for p in d['parents']:
        if p in by and d['id'] not in by[p]['parts']:
            by[p]['parts'].append(d['id'])
WIKI = {'bio_pcr':'Polymerase_chain_reaction','bio_crispr_cas9':'CRISPR','bio_michaelis_menten':'Michaelis%E2%80%93Menten_kinetics','bio_glycolysis':'Glycolysis',
 'bio_krebs_cycle':'Citric_acid_cycle','bio_calvin_cycle':'Calvin_cycle','bio_hardy_weinberg':'Hardy%E2%80%93Weinberg_principle','bio_natural_selection':'Natural_selection',
 'bio_meiosis_variation':'Meiosis','bio_dna_structure':'DNA','bio_sanger_sequencing':'Sanger_sequencing','bio_ngs':'DNA_sequencing','bio_gel_electrophoresis':'Gel_electrophoresis',
 'bio_apoptosis':'Apoptosis','bio_cell_cycle':'Cell_cycle','bio_hemoglobin_cooperativity':'Hemoglobin','bio_chemiosmosis_atp_synthase':'ATP_synthase',
 'bio_light_reactions':'Light-dependent_reactions','bio_endosymbiosis':'Symbiogenesis','bio_phylogeny_cladistics':'Cladistics','bio_ubiquitin_proteasome':'Ubiquitin',
 'bio_vaccines':'Vaccine','bio_antibiotic_resistance':'Antimicrobial_resistance','bio_hox_developmental_genes':'Hox_gene','bio_gastrulation_germ_layers':'Gastrulation',
 'bio_action_potential_channels':'Action_potential','bio_exponential_logistic_growth':'Logistic_function','bio_competition_predation':'Lotka%E2%80%93Volterra_equations',
 'bio_epidemic_modeling':'Compartmental_models_in_epidemiology','bio_chi_square_tests':'Chi-squared_test','bio_t_tests':'Student%27s_t-test','bio_anova':'Analysis_of_variance',
 'bio_regression_correlation':'Linear_regression','bio_pedigree_analysis':'Pedigree_chart','bio_light_microscopy':'Optical_microscope','bio_spectrophotometry':'Beer%E2%80%93Lambert_law',
 'bio_flow_cytometry':'Flow_cytometry','bio_gfp_reporters':'Green_fluorescent_protein','bio_lac_operon':'Lac_operon','bio_origin_of_life':'Abiogenesis','bio_buffers':'Buffer_solution',
 'bio_acids_bases_ph':'PH','bio_water_properties':'Properties_of_water','bio_synaptic_plasticity_memory':'Long-term_potentiation','bio_human_microbiome':'Human_microbiome',
 'bio_retroviruses_hiv':'HIV','bio_kin_selection_behavior_evo':'Kin_selection','bio_speciation_mechanisms':'Speciation','bio_mass_extinctions':'Extinction_event',
 'bio_geologic_time':'Geologic_time_scale','bio_photosynthetic_adaptations':'C4_carbon_fixation','bio_water_transport':'Cohesion-tension_theory','bio_genetic_code':'Genetic_code',
 'bio_telomeres_senescence':'Telomere','bio_epigenetics':'Epigenetics','bio_noncoding_rna':'RNA_interference','bio_sequence_alignment':'Sequence_alignment',
 'bio_hematopoiesis':'Haematopoiesis','bio_cancer_hallmarks':'Hallmarks_of_cancer','bio_biodiversity_crisis':'Holocene_extinction','bio_fermentation':'Fermentation',
 'bio_stem_cells_differentiation':'Stem_cell','bio_cell_culture_aseptic':'Cell_culture','bio_fluid_mosaic':'Fluid_mosaic_model','bio_protein_folding':'Protein_folding',
 'bio_electron_transport_chain':'Electron_transport_chain','bio_synthetic_biology':'Synthetic_biology','bio_astrobiology':'Astrobiology','bio_hypothesis_testing':'Statistical_hypothesis_test'}
from urllib.parse import unquote
for k, t in WIKI.items():
    d = by[k]
    d.setdefault('ext', []).append({"title": 'Wikipedia: ' + unquote(t).replace('_', ' '), "url": 'https://en.wikipedia.org/wiki/' + t})
FILES['bio_hubs'] = [r]
# remove old output
for f in os.listdir(ROOT + '/data/nodes'):
    if f.startswith('bio_') and f.endswith('.json'): os.remove(ROOT + '/data/nodes/' + f)
for name, nodes in FILES.items():
    json.dump(nodes, open(ROOT + f'/data/nodes/{name}.json', 'w'), indent=1, ensure_ascii=False)
# track
tr = {"id": "biology", "title": "Biology (B.S.)",
      "description": "A guided path through an undergraduate biology degree: foundations and chemistry, biochemistry and cell biology, molecular biology and genetics, genomics and microbiology, evolution and diversity, plants and animal physiology, neuroscience, immunology, development, ecology, biostatistics, lab skills and electives. Existing human-body, cell and statistics nodes are reused; open questions are flagged by certainty level.",
      "sections": []}
seen = set()
for i, s in enumerate(TRACK):
    ids = [x for x in s['nodes'] if not (x in seen or seen.add(x))]
    if i == 0: ids = [ROOT_ID] + ids
    tr['sections'].append({"title": s['title'], "area": s['area'], "nodes": ids})
json.dump(tr, open(ROOT + '/data/tracks/biology.json', 'w'), indent=1, ensure_ascii=False)
print('nodes', len(ALL) + 1, 'files', len(FILES), 'track sections', len(tr['sections']))
