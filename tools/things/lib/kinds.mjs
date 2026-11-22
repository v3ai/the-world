// What every part of every thing is made of, as a material KIND (the vocabulary of js/look.js LOOK.KINDS, extended by
// TH_KINDS in js/things.js). The bake writes `kind` into each part of thing.json (assemble, export.mjs), so the picture never
// guesses a material from a part's name. Order: a kind the model script sets on the part itself, then `ids` (exceptions by part
// id), then `systems` (the kind of a whole system). A part left without a kind, or with a kind the runtime does not know, stops
// the bake. `tone` lists the parts whose baked shade byte is true colour variation of the material (earlywood and latewood, the
// bands of a bee's abdomen), kept under the realistic look; every other shade byte was drawn as light, and the realistic look,
// which lights the surface itself, leaves it out.
export const KIND_NAMES = ['matte', 'plastic', 'metal', 'glass', 'chitin', 'skin', 'wet', 'muscle', 'bone', 'enamel', 'horn', 'eye', 'fur', 'feather',
  'leaf', 'petal', 'bark', 'wood', 'rock', 'soil', 'turf', 'fungus', 'wax', 'water',
  // added by js/things.js (TH_KINDS)
  'wing', 'mucosa', 'cap', 'gill', 'stone', 'root', 'stem', 'mud', 'foil', 'polymer', 'powder', 'cartilage', 'shell', 'moss', 'lichen', 'marker'];

const same = (kind, ids) => Object.fromEntries(ids.map(i => [i, kind]));
export const KINDS_OF = {
  oak: {
    systems: { trunk: 'bark', branches: 'bark', twigs: 'bark', leaves: 'leaf', acorns: 'wood', crown_far: 'leaf', roots: 'root', soil: 'soil', wood: 'wood', flow: 'marker' },
    ids: { buds: 'horn', acorn_nuts: 'wax', fine_roots: 'root', hyphae: 'fungus', log_bark: 'bark', log_phloem: 'wet', log_cambium: 'wet' },
    tone: ['log_heartwood', 'log_sapwood'],
  },
  dog: {
    systems: { coat: 'fur', fill: 'wet', eyes: 'eye', skeleton: 'bone', muscles: 'muscle', organs: 'wet', nervous: 'wet', cord: 'wet', vessels: 'wet', d_heart: 'muscle', d_eye: 'wet', d_nose: 'mucosa', d_ear: 'mucosa' },
    ids: { nose: 'mucosa', paw_pads: 'skin', claws: 'horn', teeth: 'enamel', tongue: 'mucosa', trachea: 'mucosa', tracheal_rings: 'cartilage', costal: 'cartilage', larynx: 'cartilage', bronchi: 'mucosa', esophagus: 'mucosa',
      m_fore_tendons: 'cartilage', m_hind_tendons: 'cartilage', h_valves: 'wet', h_lv: 'wet', h_rv: 'wet', h_la: 'wet', h_ra: 'wet',
      eye_cornea: 'eye', eye_lens: 'glass', eye_vitreous: 'glass', eye_sclera: 'wet', ear_drum: 'mucosa', ear_bulla: 'bone', ear_cochlea: 'bone', ear_canals: 'bone' },
  },
  bee: {
    systems: { cuticle: 'chitin', wings: 'wing', hairs: 'fur', muscles: 'muscle', nerves: 'wet', organs: 'wet', tracheal: 'wet' },
    ids: { eye_l: 'eye', eye_r: 'eye', ocelli: 'eye', pollen: 'powder', fringe: 'fur', corbicula: 'chitin', veins: 'chitin', hamuli: 'chitin', wax: 'wax', sting: 'chitin', barbs: 'chitin' },
    tone: ['abd1', 'abd2', 'abd3', 'abd4', 'abd5', 'abd6', 'head', 'prothorax', 'mesothorax', 'metathorax', 'brain', 'crop'],
  },
  mushroom: {
    systems: { mature: 'fungus', halfopen: 'fungus', egg: 'fungus', half: 'fungus', eggcut: 'fungus', soil: 'soil', mycelium: 'fungus', root: 'root' },
    ids: { ...same('cap', ['cap', 'cap_far', 'h_cap', 'c_cap', 'c_cuticle', 'e_cap_cuticle']), ...same('gill', ['gills', 'c_gills', 'c_gill', 'e_gills', 'cap_under', 'c_under']), ecm_sheath: 'fungus', ecm_core: 'root' },
    tone: ['cap', 'h_cap', 'c_cap'],
  },
  flower: {
    systems: { stems: 'stem', leaves: 'leaf', flowers: 'petal', buds: 'leaf', fruit: 'stem', roots: 'root', soil: 'soil', half: 'stem' },
    ids: { hairs: 'stem', petioles: 'stem', sepals: 'leaf', h_sepal0: 'leaf', h_sepals: 'leaf', ...same('petal', ['h_petal0', 'h_petals']), ...same('wax', ['anthers', 'h_anthers', 'nectary_scales', 'nectary_pits', 'h_scales', 'h_pits']),
      ...same('stem', ['filaments', 'ovaries', 'styles', 'receptacles', 'flower_discs', 'h_filaments', 'h_ovaries', 'h_styles']), achenes: 'stem', s_pollen_sacs: 'powder' },
    tone: ['petals', 'h_petal0', 'h_petals'],
  },
  pond: {
    systems: { surface: 'water', bank: 'leaf', water: 'water', bed: 'mud', floating: 'leaf', plants: 'leaf', animals: 'chitin' },
    ids: { bank: 'mud', stones: 'stone', iris_flowers: 'petal', iris_stalks: 'stem', iris_far: 'leaf', leaf_litter: 'leaf', gas_pockets: 'water', gas_bubbles: 'water', iris_rhizome: 'root', iris_roots: 'root',
      skater_body: 'chitin', skater_front_legs: 'chitin', skater_mid_legs: 'chitin', skater_hind_legs: 'chitin', film_dimples: 'water', hornwort_stems: 'stem', oxygen_bubbles: 'water',
      daphnia_eye: 'eye', daphnia_heart: 'wet', daphnia_gut: 'wet', daphnia_eggs: 'wet', daphnia_swarm: 'chitin', snail_shell: 'shell', snail_body: 'mucosa', snail_tentacles: 'mucosa', snail_eyes: 'eye',
      larva_eyes: 'eye', tadpole_body: 'skin', tadpole_eyes: 'eye', tadpole_tail: 'skin', tadpole_legs: 'skin', tadpole_swarm: 'skin' },
    tone: ['iris_leaves'],
  },
  robin: {
    systems: { outside: 'feather', skeleton: 'bone', skin: 'skin', fill: 'wet', muscles: 'muscle', organs: 'wet', eyes: 'eye', airway: 'mucosa', nerves: 'wet', d_syrinx: 'mucosa', d_eye: 'wet', d_heart: 'muscle' },
    ids: { bill_up: 'horn', bill_lo: 'horn', nostrils: 'mucosa', eye: 'eye', eye_ring: 'skin', leg_shin: 'horn', leg_ankle: 'horn', leg_tarsus: 'horn', leg_toes: 'horn', leg_hallux: 'horn', leg_claws: 'horn',
      mu_sc_tendon: 'cartilage', mu_tendon: 'cartilage', og_trachea: 'cartilage', sy_rings: 'cartilage', og_sac_interclav: 'glass', og_sac_cervical: 'glass', og_sac_ant: 'glass', og_sac_post: 'glass', og_sac_abd: 'glass',
      ey_cornea: 'eye', ey_lens: 'glass', ey_vitreous: 'glass', ey_scleral_ring: 'bone', hd_lv: 'wet', hd_rv: 'wet', hd_la: 'wet', hd_ra: 'wet' },
  },
  grass: {
    systems: { blades: 'leaf', sheaths: 'leaf', stems: 'stem', flowers: 'stem', roots: 'root', soil: 'soil', tiller: 'leaf', base: 'stem', leafsec: 'wet', floret: 'stem' },
    ids: { dead_leaves: 'matte', anthers: 'wax', f_anthers: 'wax', stigmas: 'stem', glumes: 'leaf', lemmas: 'leaf', f_lemma: 'leaf', f_palea: 'leaf', t_stem: 'stem', t_apex: 'stem', t_roots: 'root', b_roots: 'root',
      b_sheaths: 'leaf', b_leaf_in: 'leaf', l_silica: 'glass' },
    tone: ['lemmas', 'glumes'],
  },
  soil: {
    systems: { topsoil: 'soil', subsoil: 'soil', parent: 'soil', turf: 'leaf', roots: 'root', fungi: 'fungus', worm_out: 'skin', worm_in: 'wet', animals: 'chitin' },
    ids: { flints_a: 'stone', flints_b: 'stone', flints_c: 'stone', flints_s: 'stone', crumbs_a: 'soil', crumbs_b: 'soil', pore_back: 'soil', pore_water: 'water', litter: 'leaf', cast: 'soil', burrow: 'mud',
      worm_setae: 'horn', woodlouse_eyes: 'eye', beetle_eyes: 'eye', springtail_body: 'chitin', mite_body: 'chitin', worm_gutcontent: 'soil', worm_dorsal_vessel: 'wet', worm_ventral_vessel: 'wet' },
  },
  boulder: {
    systems: { rock: 'rock', growth: 'moss', debris: 'stone' },
    ids: { lichen: 'lichen', lichen_yellow: 'lichen' },
  },
  li_cell: {
    systems: { pouch: 'polymer', tabs: 'foil', pcm: 'polymer', copper: 'foil', anode: 'powder', separator: 'polymer', cathode: 'powder', aluminium: 'foil', pair: 'powder', circuit: 'marker', flow_dis: 'marker', flow_chg: 'marker' },
    ids: { pcm_ic: 'plastic', pcm_fet: 'plastic', p_cu: 'foil', p_al: 'foil', p_sep: 'polymer', wire: 'foil' },
  },
};

/* the kind of one part; null when the tables have none */
export function kindOf(thingId, p) {
  if (p.kind) return p.kind;
  const t = KINDS_OF[thingId]; if (!t) return null;
  return (t.ids && t.ids[p.id]) || (t.systems && t.systems[p.system]) || null;
}
/* write `kind` (and `shade: 'tone'`) into every part; returns problems */
export function applyKinds(thing) {
  const t = KINDS_OF[thing.id] || {}, problems = [], tone = new Set(t.tone || []), listed = !!KINDS_OF[thing.id];
  for (const p of thing.parts) {
    const k = kindOf(thing.id, p);
    if (!k) { if (listed || p.kind) problems.push(`part ${p.id}: no material kind (tools/things/lib/kinds.mjs)`); }   // a thing not yet in the table keeps the look's guess from its names
    else if (!KIND_NAMES.includes(k)) problems.push(`part ${p.id}: unknown kind ${k}`);
    else p.kind = k;
    if (tone.has(p.id)) p.shade = 'tone';
  }
  return problems;
}

/* The cut faces (thing.cut.faces), under the realistic look: what kind of material the cut goes through, and the pattern its section
   shows (js/things.js thFaceSurf): `grain` cells of the face's palette (rock, soil, a coating); `fibre` bundles of fibres parted by
   pale sheets of connective tissue (a muscle cut across); `pore` dense tissue with small holes (bone); `plain` one colour with a fine
   grain. `cell`: the size of a cell in metres where the face gives none. A drawn pattern of the kind of tissue, not a photograph of a
   section: the legend says so. */
export const FACE_LOOK = {
  muscle: { kind: 'muscle', pattern: 'fibre', cell: .004 }, heart: { kind: 'muscle', pattern: 'fibre', cell: .002 },
  bone: { kind: 'bone', pattern: 'pore', cell: .0015 }, cuticle: { kind: 'chitin', pattern: 'plain' },
  fill: { kind: 'wet', pattern: 'grain' }, organ: { kind: 'wet', pattern: 'grain' }, gut: { kind: 'wet', pattern: 'grain' }, gland: { kind: 'wet', pattern: 'grain' },
  brain: { kind: 'wet', pattern: 'grain' }, nerve: { kind: 'wet', pattern: 'fibre' }, skin: { kind: 'skin', pattern: 'plain' }, tract: { kind: 'mucosa', pattern: 'plain' },
  air: { kind: 'mucosa', pattern: 'plain' }, blood_l: { kind: 'wet', pattern: 'plain' }, blood_r: { kind: 'wet', pattern: 'plain' },
  ho: { kind: 'soil', pattern: 'grain' }, ha: { kind: 'soil', pattern: 'grain' }, hb: { kind: 'soil', pattern: 'grain' }, hc: { kind: 'soil', pattern: 'grain' },
  flint: { kind: 'stone', pattern: 'grain' }, root: { kind: 'root', pattern: 'grain' }, cast: { kind: 'soil', pattern: 'grain' },
  clit: { kind: 'wet', pattern: 'plain' }, circ: { kind: 'muscle', pattern: 'fibre' }, long: { kind: 'muscle', pattern: 'fibre' }, coel: { kind: 'wet', pattern: 'plain' },
  pharynx: { kind: 'muscle', pattern: 'fibre' }, oes: { kind: 'mucosa', pattern: 'plain' }, crop: { kind: 'mucosa', pattern: 'plain' }, gizz: { kind: 'muscle', pattern: 'fibre' },
  int: { kind: 'mucosa', pattern: 'grain' }, gutc: { kind: 'soil', pattern: 'grain' }, blood: { kind: 'wet', pattern: 'plain' },
  moss: { kind: 'moss', pattern: 'grain' }, granite: { kind: 'rock', pattern: 'grain' },
  film: { kind: 'polymer', pattern: 'plain' }, copper: { kind: 'foil', pattern: 'plain' }, alu: { kind: 'foil', pattern: 'plain' }, graphite: { kind: 'powder', pattern: 'grain' },
  sep: { kind: 'polymer', pattern: 'plain' }, lco: { kind: 'powder', pattern: 'grain' }, board: { kind: 'polymer', pattern: 'grain' }, chip: { kind: 'plastic', pattern: 'plain' },
  tissue: { kind: 'wet', pattern: 'grain' }, water: { kind: 'water', pattern: 'plain' }, mud: { kind: 'mud', pattern: 'grain' },
};
export function applyFaceLooks(thing) {
  const problems = [], F = thing.cut && thing.cut.faces; if (!F) return problems;
  for (const [k, f] of Object.entries(F)) { const lk = FACE_LOOK[k]; if (!lk) { problems.push(`cut face ${k}: no look (tools/things/lib/kinds.mjs FACE_LOOK)`); continue; } f.look = lk; }
  return problems;
}
