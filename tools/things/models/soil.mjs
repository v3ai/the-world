// The soil under your feet: a cut block of park soil 1.5 m across and 1.2 m deep, placed where the lawn meets an oak's roots.
// Layers: Surface, Topsoil, Subsoil, Whole profile cut, Life only, Open the earthworm (and Auto by distance).
import * as L from '../lib/index.mjs';
import { BLK, mm, place, rad } from './soil_lib.mjs';
import ground, { BURROW_X, CRUMBS } from './soil_ground.mjs';
import worm, { WORM } from './soil_worm.mjs';
import fauna from './soil_fauna.mjs';

const R = L.rng(5150);
export default function build() {
  const g = ground(R), w = worm(R), f = fauna(R);
  const meshes = { ...g.meshes, ...w.meshes }, instances = { ...g.instances, ...w.instances };
  // ---- animals: single woodlouse and beetle placed on the lawn; springtails and mites as small instanced crowds ----
  const put = (k, at, yaw) => { meshes[k] = place(mm(f.meshes[k]), at, 1, yaw); };
  for (const k of ['woodlouse_body', 'woodlouse_eyes', 'woodlouse_legs', 'woodlouse_ant']) put(k, [.4, .0035, -.16], rad(35));
  for (const k of ['beetle_head', 'beetle_eyes', 'beetle_jaws', 'beetle_pronotum', 'beetle_elytra', 'beetle_legs', 'beetle_antennae']) put(k, [-.5, .0045, -.12], rad(-150));
  for (const k of ['springtail_body', 'springtail_legs', 'springtail_furca', 'mite_body', 'mite_legs']) meshes[k] = mm(f.meshes[k]);
  const SP = ['springtail_body', 'springtail_legs', 'springtail_furca'].map(k => new L.Instances(k)), MI = ['mite_body', 'mite_legs'].map(k => new L.Instances(k));
  const rZ = a => L.quatAxisAngle([0, 0, 1], a), flat = L.quatAxisAngle([1, 0, 0], Math.PI / 2);   // flat: the animal's up (y) turns to face +z, onto the cut face
  const onLitter = (n, set) => { for (let i = 0; i < n; i++) { const q = L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), at = [R.range(.05, .7), .013, R.range(-.33, -.03)]; set.forEach(s => s.add(at, q, 1)); } };
  const onFace = (n, set) => { for (let i = 0; i < n; i++) { const q = L.quatMul(rZ(R.range(0, 6.28)), flat), at = [R.range(CRUMBS.x[0] + .02, CRUMBS.x[1] - .02), R.range(CRUMBS.y[0] + .015, CRUMBS.y[1] - .015), -.0012]; set.forEach(s => s.add(at, q, 1)); } };
  onLitter(10, SP); onFace(6, SP); onLitter(5, MI); onFace(5, MI);
  SP.forEach((s, i) => instances[['springtail_body', 'springtail_legs', 'springtail_furca'][i] + 's'] = s); MI.forEach((s, i) => instances[['mite_body', 'mite_legs'][i] + 's'] = s);

  const part = (id, name, system, node, color, o = {}) => ({ id, name, system, node, color, ...o });
  const FLINT = '#2d2e33', ROOT = '#8a6a43';
  const parts = [
    // ---- horizons ----
    part('hor_o', 'Litter and thatch layer (O horizon)', 'topsoil', 'soil_horizon_o', '#3b2f20', { mesh: 'hor_o', cutFace: 'ho', noink: true, deeper: { type: 'tissue2', id: 'soil_crumb', D: 2.2e-3, button: 'Look inside a soil crumb' } }),
    part('hor_a', 'Topsoil (A horizon)', 'topsoil', 'soil_horizon_a', '#4a3828', { mesh: 'hor_a', cutFace: 'ha', noink: true, deeper: { type: 'tissue2', id: 'soil_crumb', D: 2.2e-3, button: 'Look inside a soil crumb' } }),
    part('hor_b', 'Subsoil (B horizon)', 'subsoil', 'soil_horizon_b', '#9a7b4e', { mesh: 'hor_b', cutFace: 'hb', noink: true, deeper: { type: 'tissue2', id: 'soil_clay_ions', D: 8e-6, button: 'Look at a clay particle and its ions' } }),
    part('hor_c', 'Parent material (C horizon)', 'parent', 'soil_horizon_c', '#cdb98c', { mesh: 'hor_c', cutFace: 'hc', noink: true, deeper: { type: 'crystal', id: 'quartz', button: 'See a crystal of quartz, the main grain of sand' } }),
    // ---- turf and the surface ----
    part('grass', 'Lawn grass', 'turf', 'soil_turf', '#4f8a33', { instances: 'grass', tint: .3, double: true, lod: 'near', deeper: { type: 'mol', mol: 'cellotriose', name: 'Cellotriose', button: 'See cellulose, the grass fibre: a piece of its chain' } }),
    part('grass_mid', 'Lawn grass', 'turf', 'soil_turf', '#4f8a33', { instances: 'grass_mid', tint: .3, double: true, lod: 'mid+far' }),
    part('litter', 'Oak leaf litter', 'turf', 'soil_litter', '#7a5530', { instances: 'litter', tint: .35, double: true, lod: 'near+mid', deeper: { type: 'mol', mol: 'cellotriose', name: 'Cellotriose', button: 'See cellulose, the main material of the leaf: a piece of its chain' } }),
    part('cast', 'Earthworm cast', 'turf', 'soil_worm_cast', '#5a4630', { mesh: 'cast', cutFace: 'cast', lod: 'near+mid', noink: true }),
    part('flints_s', 'Flint pebbles on the lawn', 'turf', 'soil_flints', FLINT, { mesh: 'flints_s', cutFace: 'flint', lod: 'near+mid', deeper: { type: 'crystal', id: 'quartz', button: 'See a crystal of quartz, the mineral of flint' } }),
    // ---- stones in the profile ----
    part('flints_a', 'Flint pebbles in the topsoil', 'topsoil', 'soil_flints', FLINT, { mesh: 'flints_a', cutFace: 'flint', lod: 'near', deeper: { type: 'crystal', id: 'quartz', button: 'See a crystal of quartz, the mineral of flint' } }),
    part('flints_b', 'Flint pebbles in the subsoil', 'subsoil', 'soil_flints', FLINT, { mesh: 'flints_b', cutFace: 'flint', lod: 'near', deeper: { type: 'crystal', id: 'quartz', button: 'See a crystal of quartz, the mineral of flint' } }),
    part('flints_c', 'Flint pebbles in the pebble bed (C horizon)', 'parent', 'soil_flints', FLINT, { mesh: 'flints_c', cutFace: 'flint', lod: 'near', deeper: { type: 'crystal', id: 'quartz', button: 'See a crystal of quartz, the mineral of flint' } }),
    // ---- crumbs and pores ----
    part('crumbs_a', 'Soil crumbs (aggregates)', 'topsoil', 'soil_crumbs', '#5b4430', { instances: 'crumbs_a', tint: .35, lod: 'near', deeper: { type: 'tissue2', id: 'soil_crumb', D: 2.2e-3, button: 'Look inside a soil crumb' } }),
    part('crumbs_b', 'Soil crumbs (aggregates)', 'topsoil', 'soil_crumbs', '#66503a', { instances: 'crumbs_b', tint: .35, lod: 'near', deeper: { type: 'tissue2', id: 'soil_crumb', D: 2.2e-3, button: 'Look inside a soil crumb' } }),
    part('pore_back', 'Pore space between the crumbs', 'topsoil', 'soil_pores', '#1d150e', { mesh: 'pore_back', solid: false, double: true, noink: true, lod: 'near' }),
    part('pore_water', 'Water held in the pores', 'topsoil', 'soil_pore_water', '#6fb3e0', { instances: 'pore_water', lod: 'near', opacity_max: .75, deeper: { type: 'mol', mol: 'water', name: 'Water', button: 'See a water molecule' } }),
    // ---- roots and fungi ----
    part('roots_coarse', 'Oak roots (coarse)', 'roots', 'soil_coarse_root', ROOT, { mesh: 'roots_coarse', cutFace: 'root', lod: 'near', deeper: { type: 'tissue2', id: 'wood_section', D: 4.2e-3, button: 'Look inside oak wood' } }),
    part('froots', 'Oak fine roots', 'roots', 'soil_fine_roots', '#d6b98a', { instances: 'froots', tint: .3, lod: 'near', deeper: { type: 'tissue2', id: 'root_tip', D: 3e-3, button: 'Look at root hairs' } }),
    part('ecm_tips', 'Fungus-covered root tips (ectomycorrhiza)', 'roots', 'soil_ecm_tips', '#e3d2a8', { instances: 'ecm_tips', tint: .3, lod: 'near', deeper: { type: 'tissue2', id: 'mushroom_ecm', D: 1e-3, button: 'Look inside the root-fungus partnership' } }),
    part('hyphae', 'Fungal threads (hyphae)', 'fungi', 'soil_hyphae', '#f1ebdc', { instances: 'hyphae', tint: .25, lod: 'near', double: true, deeper: { type: 'tissue2', id: 'mushroom_ecm', D: 1e-3, button: 'Look inside the root-fungus partnership' } }),
    // ---- earthworm: outside ----
    part('burrow', 'Earthworm burrow', 'worm_out', 'soil_worm_burrow', '#2c211a', { mesh: 'burrow', solid: false, double: true, noink: true, lod: 'near', opacity_max: .35 }),
    part('worm_head', 'Earthworm: head lobe and mouth', 'worm_out', 'soil_worm_head', '#b87563', { mesh: 'worm_head', lod: 'near', ink_w: .0004 }),
    part('worm_skin', 'Earthworm: body with its segments', 'worm_out', 'soil_worm_segments', '#c98672', { mesh: 'worm_skin', cutFace: 'skin', lod: 'near', ink_w: .0004 }),
    part('worm_clitellum', 'Earthworm: clitellum (the saddle)', 'worm_out', 'soil_worm_clitellum', '#dca27a', { mesh: 'worm_clitellum', cutFace: 'clit', lod: 'near', ink_w: .0004 }),
    part('worm_setae', 'Earthworm: bristles (setae)', 'worm_out', 'soil_worm_setae', '#e8d9a8', { instances: 'worm_setae', lod: 'near' }),
    // ---- earthworm: inside (cut views) ----
    part('worm_circ', 'Earthworm: circular muscle', 'worm_in', 'soil_worm_circular', '#8a3b2b', { mesh: 'worm_circ', cutFace: 'circ', parent: 'worm_skin', lod: 'near', noink: true }),
    part('worm_long', 'Earthworm: longitudinal muscle', 'worm_in', 'soil_worm_longitudinal', '#ddd2c4', { mesh: 'worm_long', cutFace: 'long', parent: 'worm_skin', lod: 'near', noink: true }),
    part('worm_coelom', 'Earthworm: coelom (the fluid-filled body cavity)', 'worm_in', 'soil_worm_coelom', '#efdccb', { mesh: 'worm_coelom', cutFace: 'coel', parent: 'worm_skin', lod: 'near', noink: true }),
    part('worm_pharynx', 'Earthworm: pharynx', 'worm_in', 'soil_worm_pharynx', '#c97b6a', { mesh: 'worm_pharynx', cutFace: 'pharynx', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_oesophagus', 'Earthworm: oesophagus and lime glands', 'worm_in', 'soil_worm_oesophagus', '#e0b58f', { mesh: 'worm_oesophagus', cutFace: 'oes', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_crop', 'Earthworm: crop', 'worm_in', 'soil_worm_crop', '#e6c9a4', { mesh: 'worm_crop', cutFace: 'crop', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_gizzard', 'Earthworm: gizzard', 'worm_in', 'soil_worm_gizzard', '#9a7a5a', { mesh: 'worm_gizzard', cutFace: 'gizz', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_intestine', 'Earthworm: intestine', 'worm_in', 'soil_worm_intestine', '#b79468', { mesh: 'worm_intestine', cutFace: 'int', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_gutcontent', 'Earthworm: soil being digested', 'worm_in', 'soil_worm_intestine', '#4a3a2a', { mesh: 'worm_gutcontent', cutFace: 'gutc', parent: 'worm_skin', lod: 'near', noink: true }),
    part('worm_dorsal_vessel', 'Earthworm: dorsal blood vessel', 'worm_in', 'soil_worm_vessels', '#b3262d', { mesh: 'worm_dorsal_vessel', cutFace: 'blood', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_ventral_vessel', 'Earthworm: ventral blood vessel', 'worm_in', 'soil_worm_vessels', '#b3262d', { mesh: 'worm_ventral_vessel', cutFace: 'blood', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_hearts', 'Earthworm: five pairs of hearts', 'worm_in', 'soil_worm_hearts', '#d23a40', { mesh: 'worm_hearts', cutFace: 'blood', parent: 'worm_skin', lod: 'near', ink_w: .0002, deeper: { type: 'mol', mol: 'atp', name: 'ATP', button: 'See the molecule that fuels muscle: ATP' } }),
    part('worm_nerve_cord', 'Earthworm: ventral nerve cord', 'worm_in', 'soil_worm_nerve', '#efe3a0', { mesh: 'worm_nerve_cord', cutFace: 'nerve', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    part('worm_brain', 'Earthworm: brain and nerve ring', 'worm_in', 'soil_worm_brain', '#f2e8b4', { mesh: 'worm_brain', cutFace: 'nerve', parent: 'worm_skin', lod: 'near', ink_w: .0002 }),
    // ---- other animals ----
    part('woodlouse_body', 'Woodlouse: body', 'animals', 'soil_woodlouse', '#7a746a', { mesh: 'woodlouse_body', lod: 'near', ink_w: .0006, deeper: { type: 'mol', mol: 'n_acetylglucosamine', name: 'N-acetylglucosamine', button: 'See the unit of chitin' } }),
    part('woodlouse_eyes', 'Woodlouse: eyes', 'animals', 'soil_woodlouse', '#14110e', { mesh: 'woodlouse_eyes', lod: 'near', noink: true }),
    part('woodlouse_legs', 'Woodlouse: seven pairs of legs', 'animals', 'soil_woodlouse', '#8d857a', { mesh: 'woodlouse_legs', lod: 'near', ink_w: .0004 }),
    part('woodlouse_ant', 'Woodlouse: antennae and tail points', 'animals', 'soil_woodlouse', '#8d857a', { mesh: 'woodlouse_ant', lod: 'near', ink_w: .0004 }),
    part('beetle_head', 'Ground beetle: head', 'animals', 'soil_beetle_head', '#14120f', { mesh: 'beetle_head', lod: 'near', ink_w: .0005 }),
    part('beetle_eyes', 'Ground beetle: eyes', 'animals', 'soil_beetle_head', '#2a2622', { mesh: 'beetle_eyes', lod: 'near', noink: true }),
    part('beetle_jaws', 'Ground beetle: jaws (mandibles)', 'animals', 'soil_beetle_head', '#3a2a1c', { mesh: 'beetle_jaws', lod: 'near', ink_w: .0004 }),
    part('beetle_antennae', 'Ground beetle: antennae', 'animals', 'soil_beetle_head', '#4a3526', { mesh: 'beetle_antennae', lod: 'near', ink_w: .0003 }),
    part('beetle_pronotum', 'Ground beetle: thorax shield (pronotum)', 'animals', 'soil_beetle', '#171512', { mesh: 'beetle_pronotum', lod: 'near', ink_w: .0005 }),
    part('beetle_elytra', 'Ground beetle: wing cases (elytra)', 'animals', 'soil_beetle', '#13110f', { mesh: 'beetle_elytra', lod: 'near', ink_w: .0005, deeper: { type: 'mol', mol: 'n_acetylglucosamine', name: 'N-acetylglucosamine', button: 'See the unit of chitin' } }),
    part('beetle_legs', 'Ground beetle: legs', 'animals', 'soil_beetle_legs', '#4d3524', { mesh: 'beetle_legs', lod: 'near', ink_w: .0004 }),
    part('springtail_body', 'Springtails (about 1.8 mm)', 'animals', 'soil_springtail', '#e4dccb', { instances: 'springtail_bodys', lod: 'near' }),
    part('springtail_legs', 'Springtails: legs and antennae', 'animals', 'soil_springtail', '#cfc6b3', { instances: 'springtail_legss', lod: 'near' }),
    part('springtail_furca', 'Springtails: the spring (furca)', 'animals', 'soil_springtail_furca', '#bfb49a', { instances: 'springtail_furcas', lod: 'near' }),
    part('mite_body', 'Oribatid mites (about 0.7 mm)', 'animals', 'soil_mite', '#7a3f1f', { instances: 'mite_bodys', lod: 'near' }),
    part('mite_legs', 'Oribatid mites: eight legs', 'animals', 'soil_mite', '#8a5a34', { instances: 'mite_legss', lod: 'near' }),
  ];

  const SOIL_FACES = { kind: 'grains', edge: .3 };
  const plain = c => ({ kind: 'plain', palette: [[c, 1]] });
  const thing = {
    id: 'soil', title: 'The soil under your feet', label: 'Soil', scientific: null, node: 'soil_block', main_part: 'hor_a',
    blurb: 'A cut block of park soil, 1.5 m across and 1.2 m deep, where the lawn meets an oak\'s roots: its layers, stones, roots, fungal threads, crumbs and pores, and the animals that live in it at true size. Click anything, or choose a layer.',
    model_note: 'A model built from typical measurements, not a scan or a core from a real place. The rock below (flint pebbles in sand) is what the geological survey says lies under Greenwich Park; the depths of the soil layers are typical values for such a soil, not measured here. Animals are drawn at typical sizes for their kind and their places are illustrative. Fungal threads are drawn about 40 times thicker than real ones so that you can see them.',
    size_m: { width: BLK.w, thickness: BLK.z1 - BLK.z0, deep: BLK.h }, height_m: 1.2, radius_m: 1.45, draw_m: 120, seed: 5150, label_m: 25,
    systems: [
      { id: 'turf', label: 'Turf and surface' }, { id: 'topsoil', label: 'Topsoil and crumbs' }, { id: 'subsoil', label: 'Subsoil' }, { id: 'parent', label: 'Parent material' },
      { id: 'roots', label: 'Oak roots' }, { id: 'fungi', label: 'Fungal threads' }, { id: 'animals', label: 'Animals' }, { id: 'worm_out', label: 'Earthworm and its burrow' }, { id: 'worm_in', label: 'Inside the earthworm' },
    ],
    modes: [
      { id: 'surface', label: 'Surface', show: { turf: 1, topsoil: 0, subsoil: 0, parent: 0, roots: 0, fungi: 0, animals: 1, worm_out: 0, worm_in: 0 } },
      { id: 'topsoil', label: 'Topsoil', groundSeeThrough: true, cut: { at: [0, -.12, 0], normal: [0, 0, 1] }, hotspots: true, show: { turf: 1, topsoil: 1, subsoil: .1, parent: .06, roots: 1, fungi: 1, animals: 1, worm_out: 1, worm_in: 1 } },
      { id: 'subsoil', label: 'Subsoil', groundSeeThrough: true, cut: { at: [0, -.5, 0], normal: [0, 0, 1] }, hotspots: true, show: { turf: .6, topsoil: .12, subsoil: 1, parent: 1, roots: 1, fungi: .4, animals: 1, worm_out: 1, worm_in: 0 } },
      { id: 'profile', label: 'Whole profile cut', groundSeeThrough: true, cut: { at: [0, -.6, 0], normal: [0, 0, 1] }, hotspots: true,
        show: { turf: 1, topsoil: 1, subsoil: 1, parent: 1, roots: 1, fungi: 1, animals: 1, worm_out: 1, worm_in: 1 },
        legend: { title: 'Horizons of this soil (typical depths)', items: [{ name: 'O: litter and thatch', color: '#3b2f20', node: 'soil_horizon_o' }, { name: 'A: topsoil', color: '#4a3828', node: 'soil_horizon_a' }, { name: 'B: subsoil', color: '#9a7b4e', node: 'soil_horizon_b' }, { name: 'C: pebble bed', color: '#cdb98c', node: 'soil_horizon_c' }, { name: 'Flint', color: '#2d2e33', node: 'soil_flints' }, { name: 'Oak root', color: '#8a6a43', node: 'soil_coarse_root' }], note: 'The colours on the cut face are a code, not a photograph. The layer depths are typical values.' } },
      { id: 'life', label: 'Life only (soil see-through)', groundSeeThrough: true, show: { turf: .5, topsoil: .09, subsoil: .06, parent: .05, roots: 1, fungi: 1, animals: 1, worm_out: 1, worm_in: 0 } },
      { id: 'worm', label: 'Open the earthworm', groundSeeThrough: true, cut: { at: [BURROW_X, -.12, 0], normal: [0, 0, 1] }, hotspots: true, show: { turf: .5, topsoil: .1, subsoil: .06, parent: .05, roots: .4, fungi: .3, animals: 1, worm_out: 1, worm_in: 1 },
        legend: { title: 'Inside the earthworm (sagittal cut: back on the right)', items: [{ name: 'Circular muscle', color: '#8a3b2b', node: 'soil_worm_circular' }, { name: 'Longitudinal muscle', color: '#ddd2c4', node: 'soil_worm_longitudinal' }, { name: 'Gut', color: '#b79468', node: 'soil_worm_intestine' }, { name: 'Blood vessels and hearts', color: '#b3262d', node: 'soil_worm_hearts' }, { name: 'Nerve cord', color: '#efe3a0', node: 'soil_worm_nerve' }], note: 'The thickness of each layer is illustrative.' } },
    ],
    auto: { label: 'Auto', stages: [{ max_m: 1.6, mode: 'profile' }, { max_m: 4.5, mode: 'topsoil' }, { mode: 'surface' }] },
    layers: [
      { id: 'surface', label: 'the turf and the surface', systems: ['turf'], ghost: .15 },
      { id: 'topsoil', label: 'the topsoil', systems: ['topsoil'], ghost: .1 },
      { id: 'subsoil', label: 'the subsoil and the rock below', systems: ['subsoil', 'parent'], ghost: .08 },
    ],
    lod: { near_m: 4.5, far_m: 28 },
    cut: { default: 'ha', at: [0, -.6, 0], faces: {
      ho: { ...SOIL_FACES, cell: .006, palette: [[0x3b2f20, .4], [0x2b2118, .3], [0x4d3d28, .2], [0x5c4a30, .1]] },
      ha: { ...SOIL_FACES, cell: .008, palette: [[0x4a3828, .4], [0x3a2b1e, .3], [0x5a4632, .2], [0x6a5538, .1]] },
      hb: { ...SOIL_FACES, cell: .012, palette: [[0x9a7b4e, .4], [0x86693f, .3], [0xae8f5e, .2], [0x7a5e38, .1]] },
      hc: { ...SOIL_FACES, cell: .014, palette: [[0xcdb98c, .4], [0xbba577, .3], [0xdccaa0, .2], [0xa99468, .1]] },
      flint: plain(0x3a3b40), root: plain(0xc9a56a), cast: plain(0x5a4630),
      skin: plain(0xc98672), clit: plain(0xdca27a), circ: plain(0x8a3b2b), long: plain(0xe6dccf), coel: plain(0xf1e2d3), pharynx: plain(0xc97b6a), oes: plain(0xe0b58f), crop: plain(0xe6c9a4), gizz: plain(0x9a7a5a),
      int: plain(0xb79468), gutc: plain(0x4a3a2a), blood: plain(0xb3262d), nerve: plain(0xf2e8b4),
    } },
    hotspots: [
      { id: 'hs_crumbs', node: 'soil_crumbs', at: [.24, -.14, -.012], label: 'Soil crumbs and the pores between them', r: .007, modes: ['topsoil', 'profile'], deeper: { type: 'tissue2', id: 'soil_crumb', D: 2.2e-3, button: 'Look inside a soil crumb' } },
      { id: 'hs_worm', node: 'soil_earthworm', at: [BURROW_X, -.12, -.004], label: 'An earthworm in its burrow', r: .006, modes: ['topsoil', 'profile'] },
      { id: 'hs_gut', node: 'soil_worm_intestine', at: [BURROW_X, -.156, -.0005], label: 'The gut', r: .0028, modes: ['worm'] },
      { id: 'hs_hearts', node: 'soil_worm_hearts', at: [BURROW_X, -.055, -.001], label: 'The hearts', r: .0028, modes: ['worm'] },
      { id: 'hs_hyphae', node: 'soil_hyphae', at: [.12, -.015, -.1], label: 'Fungal threads in the litter', r: .008, modes: ['topsoil', 'profile'] },
      { id: 'hs_root', node: 'soil_coarse_root', at: [.4, -.335, -.001], label: 'An oak root cut across', r: .008, modes: ['subsoil', 'profile'], deeper: { type: 'tissue2', id: 'wood_section', D: 4.2e-3, button: 'Look inside oak wood' } },
      { id: 'hs_clay', node: 'soil_clay', at: [-.5, -.5, -.01], label: 'Clay: the finest particles', r: .01, modes: ['subsoil', 'profile'], deeper: { type: 'tissue2', id: 'soil_clay_ions', D: 8e-6, button: 'Look at a clay particle and its ions' } },
      { id: 'hs_pebbles', node: 'soil_horizon_c', at: [.1, -1.0, -.01], label: 'The pebble bed below', r: .012, modes: ['subsoil', 'profile'] },
    ],
    anim: [
      { kind: 'sway', parts: ['grass'], from_y: -.004, to_y: .042, amp_m: .004, hz: .35, label: 'Grass in a light breeze' },
    ],
    ruler: { label: 'Soil block', D: 3, at: [0, -.2, 0] },
    parts,
  };
  return { thing, meshes, instances };
}
