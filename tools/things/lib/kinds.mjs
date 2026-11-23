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
  'wing', 'mucosa', 'cap', 'gill', 'stone', 'root', 'stem', 'mud', 'foil', 'polymer', 'powder', 'cartilage', 'shell', 'moss', 'lichen', 'marker', 'gloss_petal'];

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
    ids: { hairs: 'stem', petioles: 'stem', sepals: 'leaf', h_sepal0: 'leaf', h_sepals: 'leaf', ...same('gloss_petal', ['petals', 'h_petal0', 'h_petals']), ...same('wax', ['anthers', 'h_anthers', 'nectary_scales', 'nectary_pits', 'h_scales', 'h_pits']),
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
    ids: { flints_a: 'stone', flints_b: 'stone', flints_c: 'stone', flints_s: 'stone', crumbs_a: 'soil', crumbs_b: 'soil', pore_back: 'soil', pore_water: 'water', litter: 'matte', cast: 'soil', burrow: 'mud',
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
    const lk = (LOOK_OF[thing.id] || {})[p.id]; if (lk) { if (lk.lod) p.look_lod = lk.lod; if (lk.color) p.look_color = lk.color; }
    if ((SECTIONS[thing.id] || []).includes(p.id)) p.look_section = true;
  }
  return problems;
}
/* What a part does differently under the realistic look only (the app without it is left exactly as it is), written into thing.json as
   `look_lod` (the detail tiers it is drawn in: 'off' for none) and `look_color` (its colour, where the drawn colour was chosen for flat
   shading and reads wrong in real light). */
/* Parts that are modelled cut faces (a half mushroom's flesh, a half flower's sections, the log's end grain): under the look they take
   the cut face's floor of light (js/things.js thLkFill), like the faces drawn where a thing is clipped. */
const SECTIONS = {
  mushroom: ['c_flesh', 'c_stipe_sec', 'c_ring_sec', 'c_gill', 'c_cuticle', 'c_subcuticle', 'e_outer', 'e_veil', 'e_roof', 'e_stem', 'e_cap_cuticle', 'e_cap_sub', 'e_cap_flesh', 'e_gills'],
  flower: ['s_receptacle', 's_pedicel', 's_filament', 's_anther_wall', 's_pollen_sacs', 's_carpel_wall', 's_carpel_cavity', 's_ovule', 's_embryosac'],
  oak: ['log_phloem', 'log_cambium', 'log_sapwood', 'log_heartwood', 'log_pith', 'log_rays'],
};
/* Colours under the look are chosen against photographs opened for the purpose (no measured albedo of these surfaces was found); each
   keeps roughly the brightness of the drawn colour and takes the photograph's hue (the ratios of red, green and blue in the lit parts):
   - oak leaves: an English oak in July, Baginton (Wikimedia Commons, "Baginton oak tree july06.JPG", CC BY-SA 3.0): the crown's lit
     leaves #a8c28e, median #6e8456: a dull green, far less yellow than the drawing's #4f8a2e. Drawn #55703e: between the photograph's
     hue and the drawing's lightness (a judgement: no measured albedo of oak leaves in the visible was found; the photograph's own
     exposure is unknown);
   - robin: "Erithacus rubecula with cocked head.jpg" (Wikimedia Commons, Francis C. Franklin, CC BY-SA 3.0): orange breast and face,
     lit #96522d; bluish-grey border #9698a9; upperparts grey-brown, olive-tinged (#a89b8e median); belly buff-white #cfbea8; and the
     text of Wikipedia, "European robin": "an orange breast and face lined by a bluish grey on the sides of the neck and chest. The
     upperparts are brownish, or olive-tinged in British birds, and the belly whitish";
   - dog: a yellow Labrador in sun ("Labrador on Quantock (2175262184).jpg", CC BY-SA 2.0): flank #f9d3ab lit, the ears darker and
     redder (#c58c60, about 0.8 of the flank's lightness; drawn at 0.85, since the model's ear lies flat on the head and a darker flap
     read as a patch stuck on), the legs and chest paler (#fbeed9). The breed's yellows "range from light cream to fox red" (The Royal
     Kennel Club, breed standard), all on the yellow side: the coat is drawn #dabb88, a cream-gold between the drawing's #e8cd8a and
     the photograph's warmer hue (#d8b48c, its hue taken whole, read as pinkish beige, close to flesh, in the park). */
export const LOOK_OF = {
  oak: {
    leaves: { color: '#55703e' },
    leaves_mid: { lod: 'mid+far', color: '#55703e' },   // every oak in view wears the same photographed leaves: the middle tier's tufts are drawn far away too
    crown_far: { lod: 'off' },        // (fewer triangles than the smooth clumps they replace: 2,032 cards against 250 clumps of 44 triangles; a shaded inner mass drawn from them showed as balls at every distance)
  },
  robin: {
    r_breast: { color: '#bf6834' }, r_face: { color: '#bc6331' }, r_grey: { color: '#8a8d9c' }, r_back: { color: '#7b6e5c' }, r_crown: { color: '#7d705e' },
    r_nape: { color: '#7f725f' }, r_rump: { color: '#7e6f58' }, r_flank: { color: '#a8957b' }, r_belly: { color: '#ddd2c0' },
    r_breast_mid: { color: '#bf6834' }, r_face_mid: { color: '#bc6331' }, r_grey_mid: { color: '#8a8d9c' }, r_back_mid: { color: '#7b6e5c' }, r_crown_mid: { color: '#7d705e' },
    r_vent: { color: '#e0d6c4' }, r_vent_mid: { color: '#e0d6c4' }, f_undertc: { color: '#e0d6c4' },
    r_nape_mid: { color: '#7f725f' }, r_rump_mid: { color: '#7e6f58' }, r_flank_mid: { color: '#a8957b' }, r_belly_mid: { color: '#ddd2c0' },
    f_pcov: { color: '#7a6a55' }, f_gcov: { color: '#7a6a55' }, f_mcov: { color: '#7a6a55' }, f_lcov: { color: '#7a6a55' }, f_utc: { color: '#7a6b57' },
    f_prim: { color: '#5a4a3a' }, f_sec: { color: '#5e4d3c' }, f_tert: { color: '#64513f' }, f_tail: { color: '#4f4234' },
  },
  dog: {
    coat: { color: '#dabb88' }, coat_mid: { color: '#dabb88' }, coat_far: { color: '#dabb88' }, fur: { color: '#dec190' }, ears: { color: '#c7a070' },
  },
  boulder: {
    moss: { color: '#5b6a31' },       // moss cushions on rock (Grimmia, Hypnum) in photographs: a dull olive, not the drawing's lime (chosen against photographs; no measured albedo found)
  },
};

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
  /* the soil's horizons under the look: the drawn palette's hues, scaled in linear light to a measured albedo (mean over the face):
     O 0.075 and A 0.11 (moist, humus-rich topsoil), B 0.20, C 0.38 (dry, light parent sand). Dark soils 0.1 to 0.2, light soils 0.4 to 0.5,
     less when wet (Encyclopedia of Soil Science, 2006, "Albedo"; https://rd.springer.com/referenceworkentry/10.1007/1-4020-3266-8_32).
     The drawn palette (flag off) is unlit and is left as it is. */
  ho: { kind: 'soil', pattern: 'grain', palette: [[0x574631, 0.4], [0x413326, 0.3], [0x6f593c, 0.2], [0x846b47, 0.1]] },
  ha: { kind: 'soil', pattern: 'grain', palette: [[0x6d543d, 0.4], [0x57422f, 0.3], [0x83674b, 0.2], [0x9a7c54, 0.1]] },
  hb: { kind: 'soil', pattern: 'grain', palette: [[0x997a4d, 0.4], [0x85683e, 0.3], [0xac8e5d, 0.2], [0x795d37, 0.1]] },
  hc: { kind: 'soil', pattern: 'grain', palette: [[0xbba980, 0.4], [0xab976c, 0.3], [0xc9b992, 0.2], [0x9a875e, 0.1]] },
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
