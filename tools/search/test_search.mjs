// Unit tests for search, in node, no browser:  node tools/search/test_search.mjs
// Each row is [query, expected id of the FIRST result, or an array of acceptable ids, or null when nothing at all may come back].
// "First result" is what Enter would choose. Ids are the explorer's own (mol:, crystal:, el:, node:, kn:, lm:, pl:, trail:, lab:).
import { SC, load } from './lib.mjs';
import fs from 'node:fs';
const idx = load();
const T = [
  // the owner's examples
  ['sugar', 'mol:sucrose'], ['Sugar', 'mol:sucrose'], ['a battery', 'node:phone_battery'], ['battery', 'node:phone_battery'], ['batteries', 'node:phone_battery'], ['the battery in my phone', 'node:phone_battery'],
  ['sugars', 'mol:sucrose'], ['what is sugar', 'mol:sucrose'],
  // everyday names
  ['table sugar', 'mol:sucrose'], ['cane sugar', 'mol:sucrose'], ['blood sugar', 'mol:glucose_alpha'], ['glucose', 'mol:glucose_alpha'], ['fruit sugar', 'mol:fructose'], ['milk sugar', 'mol:lactose'], ['malt sugar', 'mol:maltose'],
  ['salt', 'crystal:halite'], ['table salt', 'crystal:halite'], ['sodium chloride', 'crystal:halite'], ['rock salt', 'crystal:halite'],
  ['rust', 'crystal:hematite'], ['rusty', 'crystal:hematite'],
  ['baking soda', 'mol:bicarbonate'], ['bicarbonate of soda', 'mol:bicarbonate'], ['washing soda', 'mol:carbonate'],
  ['vinegar', 'mol:acetic_acid'], ['alcohol', 'mol:ethanol'], ['beer', 'mol:ethanol'], ['rubbing alcohol', 'mol:isopropanol'], ['antifreeze', 'mol:ethylene_glycol'], ['nail polish remover', 'mol:acetone'],
  ['coffee', 'mol:caffeine'], ['tea', 'mol:caffeine'], ['chilli', 'mol:capsaicin'], ['vanilla', 'mol:vanillin'], ['mint', 'mol:menthol'], ['carrot', 'mol:beta_carotene'], ['tomato', 'mol:lycopene'], ['jeans', 'mol:indigo'],
  ['plastic', 'mol:polyethylene_c20'], ['plastics', 'mol:polyethylene_c20'], ['rubber', 'mol:rubber_frag'], ['nylon', 'mol:nylon66_frag'], ['teflon', 'mol:ptfe_frag'], ['polystyrene', 'mol:polystyrene_frag'], ['kevlar', 'mol:kevlar_frag'],
  ['glass', 'crystal:quartz'], ['sand', 'crystal:quartz'], ['quartz', 'crystal:quartz'], ['limestone', 'crystal:calcite'], ['chalk', 'crystal:calcite'], ['marble', 'crystal:calcite'], ['diamond', 'crystal:diamond'], ['graphite', 'crystal:graphite'], ['pencil lead', 'crystal:graphite'],
  ['fools gold', 'crystal:pyrite'], ["fool's gold", 'crystal:pyrite'], ['olivine', 'crystal:forsterite'], ['ice', 'crystal:ice_ih'], ['snowflake', 'crystal:ice_ih'], ['magnet', 'crystal:magnetite'],
  ['gold', 'el:Au'], ['iron', 'el:Fe'], ['copper', 'el:Cu'], ['aluminium', 'el:Al'], ['aluminum', 'el:Al'], ['steel', 'crystal:iron_bcc'], ['copper wire', 'el:Cu'],
  ['water', 'mol:water'], ["what's water made of", 'mol:water'], ['whats water made of', 'mol:water'], ['drinking water', 'mol:water'], ['steam', 'mol:water'],
  ['carbon dioxide', 'mol:carbon_dioxide'], ['dry ice', 'mol:carbon_dioxide'], ['laughing gas', 'mol:nitrous_oxide'], ['natural gas', 'mol:methane'], ['petrol', 'mol:octane'], ['dna bases', 'mol:adenine'],
  ['vitamin c', 'mol:ascorbic_acid'], ['Vitamin C', 'mol:ascorbic_acid'], ['vitamin d', 'mol:vitamin_d3'], ['vitamin b1', 'mol:thiamine'], ['aspirin', 'mol:aspirin'], ['paracetamol', 'mol:paracetamol'], ['tylenol', 'mol:paracetamol'],
  ['adrenaline', 'mol:adrenaline'], ['epinephrine', 'mol:adrenaline'], ['melatonin', 'mol:melatonin'], ['cholesterol', 'mol:cholesterol'], ['nicotine', 'mol:nicotine'], ['cannabis', 'mol:thc'], ['atp', 'mol:atp'], ['urine', 'mol:urea'],
  // formulas, with and without subscripts, upper and lower case
  ['H2O', 'mol:water'], ['h2o', 'mol:water'], ['H₂O', 'mol:water'], ['CO2', 'mol:carbon_dioxide'], ['CO₂', 'mol:carbon_dioxide'], ['co2', 'mol:carbon_dioxide'], ['NaCl', 'crystal:halite'], ['nacl', 'crystal:halite'],
  ['C6H12O6', 'mol:glucose_alpha'], ['C₆H₁₂O₆', 'mol:glucose_alpha'], ['C12H22O11', 'mol:sucrose'], ['NH3', 'mol:ammonia'], ['CH4', 'mol:methane'], ['H2SO4', 'mol:sulfuric_acid'], ['O2', 'mol:oxygen'], ['N2', 'mol:nitrogen'],
  ['O3', 'mol:ozone'], ['HCl', 'mol:hydrogen_chloride'], ['CaCO3', 'crystal:calcite'], ['Fe2O3', 'crystal:hematite'], ['SiO2', 'crystal:quartz'], ['H2O2', 'mol:hydrogen_peroxide'], ['C2H5OH', 'mol:ethanol'], ['C8H10N4O2', 'mol:caffeine'], ['NO2', 'mol:nitrogen_dioxide'],
  // element symbols and names
  ['Fe', 'el:Fe'], ['fe', 'el:Fe'], ['Au', 'el:Au'], ['Na', 'el:Na'], ['Pb', 'el:Pb'], ['Hg', 'el:Hg'], ['He', 'el:He'], ['Cu', 'el:Cu'], ['Ag', 'el:Ag'], ['K', 'el:K'], ['U', 'el:U'], ['Og', 'el:Og'],
  ['helium', 'el:He'], ['uranium', 'el:U'], ['natrium', 'el:Na'], ['wolfram', 'el:W'], ['hydrogen', 'mol:hydrogen'], ['oxygen', 'mol:oxygen'], ['lithium', 'el:Li'],
  // typos
  ['sugr', 'mol:sucrose'], ['suger', 'mol:sucrose'], ['bateries', 'node:phone_battery'], ['batery', 'node:phone_battery'], ['caffiene', 'mol:caffeine'], ['plasticc', 'mol:polyethylene_c20'], ['cholestrol', 'mol:cholesterol'], ['mitocondria', 'node:mitochondrion'],
  ['photosyntesis', ['trail:why_is_a_leaf_green', 'node:bio_photosynthesis_overview', 'kn:photosynthesis_light']], ['gluclose', 'mol:glucose_alpha'], ['hydrogn', ['mol:hydrogen', 'el:H']], ['vitamine c', 'mol:ascorbic_acid'], ['alchohol', 'mol:ethanol'], ['aluminuim', 'el:Al'],
  // filler words and questions
  ['what is the sun', 'lm:The Sun'], ['the sun', 'lm:The Sun'], ['tell me about water', 'mol:water'], ['how does a battery work', 'node:phone_battery'], ['how does wifi work', 'node:phone_wifi_bt'], ['what is dna', 'lm:DNA'],
  ['where is my heart', 'node:heart'], ['my heart', 'node:heart'], ['the heart', 'node:heart'], ['hearts', 'node:heart'], ['why is the sky blue', 'kn:light_scattering'], ['Why is the sky blue?', 'kn:light_scattering'], ['how do planes fly', 'kn:flight_tech'],
  ['what is a black hole', 'lm:Black hole Sgr A*'], ['what is gravity', 'kn:gravitation_newton'], ['how does a transistor work', 'node:finfet_transistor'], ['what is a virus', 'node:bio_viruses_structure'], ['what is an atom', 'lm:Oxygen nucleus'],
  ['how do i see', 'node:retina'], ['what are stars made of', 'lm:Nearest stars'], ['what is light', ['kn:electromagnetic_waves', 'trail:what_is_light']], ['how big is the universe', 'lm:Observable universe'], ['what is a rainbow', 'kn:optics_geometric'],
  // devices
  ['wifi', 'node:phone_wifi_bt'], ['wi-fi', 'node:phone_wifi_bt'], ['phone', 'node:smartphone'], ['my phone', 'node:smartphone'], ['screen', 'node:phone_display'], ['camera', 'node:phone_camera'], ['speaker', 'node:phone_speaker'], ['bluetooth', 'node:phone_wifi_bt'],
  ['chip', 'node:phone_soc'], ['processor', 'node:phone_soc'], ['transistor', 'node:finfet_transistor'], ['computer chip', 'node:phone_soc'], ['logic gate', 'node:logic_gate_nand'], ['charger', 'node:phone_charger_port'], ['usb c', 'node:phone_charger_port'],
  ['motor', 'node:phone_vibration_motor'], ['power grid', 'node:electric_power_grid'], ['generator', 'node:power_plant'], ['solar panel', 'crystal:silicon'], ['led', 'node:led_photodiode'], ['laser', 'node:lasers_semiconductor'], ['ohms law', 'node:ohms_law_node'],
  // the body
  ['heart', 'node:heart'], ['brain', 'node:brain'], ['lungs', 'node:lung_l'], ['liver', 'node:liver'], ['stomach', 'node:stomach'], ['tummy', 'node:stomach'], ['kidney', 'node:kidney_l'], ['eye', 'node:eye_l'], ['skull', 'node:skull'], ['kneecap', 'node:patella_l'],
  ['collarbone', 'node:clavicle_l'], ['biceps', 'node:biceps_brachii'], ['voice box', 'node:larynx'], ['windpipe', 'node:trachea'], ['teeth', 'node:teeth'], ['tongue', 'node:tongue'], ['skin', 'node:skin'], ['blood', 'node:blood_vessels'], ['skeleton', 'lm:You'],
  ['dna', 'lm:DNA'], ['cell', 'lm:Skin cell'], ['mitochondria', 'node:mitochondrion'], ['heartbeat', ['node:heart', 'trail:how_does_my_heart_beat']],
  // park, Earth, space
  ['dog', 'pl:Dog'], ['bee', 'pl:Honeybee'], ['tree', 'pl:Tree'], ['mushroom', 'pl:Mushroom'], ['flower', 'pl:Flowers'], ['pond', 'pl:Pond'], ['cloud', 'pl:Cloud'], ['soil', 'pl:Soil'],
  ['mars', 'pl:Mars'], ['jupiter', 'pl:Jupiter'], ['saturn', 'pl:Saturn'], ['titan', 'pl:Titan'], ['the moon', 'pl:Moon'], ['sun', 'lm:The Sun'], ['earth', 'lm:Earth'], ['milky way', 'lm:Milky Way'], ['iss', 'pl:ISS'], ['pluto', 'pl:Pluto'],
  ['volcano', 'kn:volcanism'], ['earthquake', 'kn:seismology'], ['lightning', 'kn:hurricanes_storms'], ['rainbow', 'kn:optics_geometric'], ['ocean', 'kn:oceans_circulation'], ['climate change', 'kn:climate_system'], ['aurora', 'kn:space_weather'],
  ['proton', 'node:sm_proton'], ['electron', 'node:sm_electron'], ['quark', 'node:sm_up'], ['higgs', 'node:sm_higgs'], ['standard model', 'lm:Standard Model'], ['photon', 'node:sm_photon'],
  // symbols with context, cases and spacing
  ['  sugar  ', 'mol:sucrose'], ['SUGAR', 'mol:sucrose'], ['Sugár', 'mol:sucrose'], ['sugar!!', 'mol:sucrose'],
];
const NOTHING = ['asdfghjkl', 'qwertyuiop', 'zzzzzz', 'blorptastic', 'xylophonic', 'lorem ipsum dolor', 'the quick brown fox', 'flibbertigibbet', 'qqqq', 'zxcvbnm', 'hmmmmmm', '!!!', 'xkcdqzv', 'wibblewobble', 'ploxxy snorf'];

let pass = 0, fail = 0; const bad = [];
for (const [q, want] of T) {
  const r = SC.query(idx, q), got = r.results[0] && r.results[0].id, ok = Array.isArray(want) ? want.includes(got) : got === want;
  if (ok) pass++; else { fail++; bad.push(`  "${q}": wanted ${JSON.stringify(want)}, got ${got} (${r.results.slice(0, 3).map(x => x.id).join(', ')})`); }
}
for (const q of NOTHING) { const r = SC.query(idx, q); if (!r.results.length && !r.weak.length) pass++; else { fail++; bad.push(`  nonsense "${q}" returned ${r.results.slice(0, 3).map(x => x.id).concat(r.weak.slice(0, 2).map(x => x.id)).join(', ')}`); } }

// structural checks
const checks = [];
const al = JSON.parse(fs.readFileSync(new URL('../../data/search/aliases.json', import.meta.url)));
checks.push(['every alias names a source that exists', al.aliases.every(a => a.src && a.src.length && a.src.every(s => al.sources[s]))]);
checks.push(['every alias target is an indexed thing', al.aliases.every(a => a.t.every(t => idx.byId.has(t)))]);
checks.push(['near-targets are among the targets', al.aliases.every(a => (a.near || []).every(n => a.t.includes(n)))]);
checks.push(['"sugar" says there are several sugars', /several/.test(SC.query(idx, 'sugar').hint || '')]);
checks.push(['"rust" results say nearest', SC.query(idx, 'rust').results[0].near === true]);
checks.push(['"rust" note says hydrated iron(III) oxide', /hydrated iron\(III\) oxide/.test(SC.query(idx, 'rust').results[0].note)]);
{ // speed: 200 mixed queries, worst case
  const qs = T.map(t => t[0]).concat(NOTHING); let worst = 0, wq = ''; const t0 = performance.now(); let n = 0;
  for (let rep = 0; rep < 3; rep++) for (const q of qs) { const t = performance.now(); SC.query(idx, q); const d = performance.now() - t; n++; if (rep > 0 && d > worst) { worst = d; wq = q; } }
  const avg = (performance.now() - t0) / n; checks.push([`speed: mean ${avg.toFixed(2)} ms, worst ${worst.toFixed(2)} ms ("${wq}") per query; index build ${idx.buildMs.toFixed(0)} ms (limit 20 ms per query)`, worst < 20]);
}
checks.forEach(([n, ok]) => { if (ok) pass++; else { fail++; bad.push('  check failed: ' + n); } if (/^speed/.test(n)) console.log(n); });
console.log(`${T.length + NOTHING.length} query tests + ${checks.length} checks: ${pass} passed, ${fail} failed`);
if (bad.length) console.log(bad.join('\n'));
process.exit(fail ? 1 : 0);
