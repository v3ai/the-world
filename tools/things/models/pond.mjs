// A pond in the park: a slice through a small temperate pond (about 6 m by 4.6 m, 0.6 m deep) with its inhabitants as clickable parts.
// Layers: Surface, Open water, Bottom and mud, Cut-away slice (and Auto by distance). Inhabitants are drawn at their true sizes.
import * as L from '../lib/index.mjs';
import { POND, bedY, xf } from './pond_lib.mjs';
import core from './pond_core.mjs';
import plants from './pond_plants.mjs';
import life from './pond_life.mjs';

const R = L.rng(2718);
export default function build() {
  const c = core(R), pl = plants(R), lf = life(R);
  const meshes = { ...c.meshes, ...pl.meshes, ...lf.meshes }, instances = { ...c.instances, ...pl.instances, ...lf.instances }, flows = { ...c.flows };
  const P = lf.P, pt = (k, v) => { const q = xf([v[0] * .001, v[1] * .001, v[2] * .001], { yaw: P[k].yaw || 0 }); return [+(q[0] + P[k].at[0]).toFixed(5), +(q[1] + P[k].at[1]).toFixed(5), +(q[2] + P[k].at[2]).toFixed(5)]; };
  const ax = (k, v) => { const q = xf(v, { yaw: P[k].yaw || 0 }); return q.map(x => +x.toFixed(4)); };

  const part = (id, name, system, node, color, o = {}) => ({ id, name, system, node, color, ...o });
  const parts = [
    // ---- the water and its edge ----
    part('surface', 'Water surface', 'surface', 'pond_surface', '#3f7f7a', { mesh: 'surface', solid: false, double: true, noink: true, deeper: { type: 'tissue2', id: 'pond_film', D: 4e-4, button: 'Look at the surface film, close up' } }),
    part('bank', 'Bank and marginal zone', 'bank', 'pond_bank', '#6a5c3c', { mesh: 'bank', solid: false, double: true, noink: true }),
    part('stones', 'Edging stones', 'bank', 'pond_stones', '#8b8a84', { instances: 'stones', tint: .15 }),
    part('water', 'Open water', 'water', 'pond_water', '#4a928d', { mesh: 'water', cutFace: 'water', noink: true, deeper: { type: 'tissue2', id: 'pond_drop', D: 6e-4, button: 'Look at a drop of pond water' } }),
    // ---- bed ----
    part('mud', 'Mud', 'bed', 'pond_mud', '#4a3c2d', { mesh: 'mud', cutFace: 'mud', noink: true, deeper: { type: 'tissue2', id: 'pond_mud', D: 3e-4, button: 'Look inside the mud' } }),
    part('leaf_litter', 'Fallen leaves', 'bed', 'pond_leaf_litter', '#6c4a28', { instances: 'litter', tint: .3, double: true, lod: 'near' }),
    part('gas_bubbles', 'Bubbles rising from the mud', 'bed', 'pond_gas_bubbles', '#d9edf2', { flow: 'bubbles', deeper: { type: 'mol', mol: 'methane', name: 'Methane', button: 'See the molecule: methane' } }),
    // ---- floating and surface life ----
    part('duckweed', 'Common duckweed', 'floating', 'pond_duckweed', '#6aa83a', { instances: 'duckweed', tint: .25, double: true, lod: 'near', deeper: { type: 'cell', cell: 'plant', button: 'Look inside a duckweed cell' } }),
    part('duckweed_mat', 'Common duckweed (raft)', 'floating', 'pond_duckweed', '#6aa83a', { mesh: 'duckweed_mat', solid: false, double: true, noink: true, lod: 'mid+far' }),
    part('skater_body', 'Pond skater: body', 'floating', 'pond_skater', '#3a2e22', { mesh: 'skater_body', lod: 'near', ink_w: .0006, deeper: { type: 'mol', mol: 'n_acetylglucosamine', name: 'N-acetylglucosamine', button: 'See the molecule: the unit of chitin' } }),
    part('skater_front_legs', 'Pond skater: front legs', 'floating', 'pond_skater_legs', '#4a3b2c', { mesh: 'skater_front', lod: 'near', ink_w: .0005, solid: false }),
    part('skater_mid_legs', 'Pond skater: middle legs (rowing)', 'floating', 'pond_skater_legs', '#4a3b2c', { mesh: 'skater_mid', lod: 'near', ink_w: .0005, solid: false, deeper: { type: 'tissue2', id: 'pond_film', D: 4e-4, button: 'Look at the leg hairs on the surface film' } }),
    part('skater_hind_legs', 'Pond skater: hind legs (steering)', 'floating', 'pond_skater_legs', '#4a3b2c', { mesh: 'skater_hind', lod: 'near', ink_w: .0005, solid: false }),
    part('film_dimples', 'Dimples in the surface film', 'floating', 'pond_surface_film', '#cfe6ee', { mesh: 'skater_dimples', lod: 'near', solid: false, double: true, noink: true, opacity_max: .55, deeper: { type: 'tissue2', id: 'pond_film', D: 4e-4, button: 'Look at the surface film, close up' } }),
    // ---- plants ----
    part('hornwort', 'Hornwort (submerged plant)', 'plants', 'pond_hornwort', '#3f7d3a', { instances: 'hornwort_a', tint: .25, double: true, lod: 'near', deeper: { type: 'cell', cell: 'plant', button: 'Look inside a hornwort cell' } }),
    part('hornwort_b', 'Hornwort (submerged plant)', 'plants', 'pond_hornwort', '#468543', { instances: 'hornwort_b', tint: .25, double: true, lod: 'near', deeper: { type: 'cell', cell: 'plant', button: 'Look inside a hornwort cell' } }),
    part('hornwort_stems', 'Hornwort stems', 'plants', 'pond_hornwort', '#587a38', { mesh: 'hornwort_stems', lod: 'near', noink: true }),
    part('hornwort_far', 'Hornwort (submerged plant)', 'plants', 'pond_hornwort', '#3f7d3a', { mesh: 'hornwort_far', lod: 'mid+far', noink: true }),
    part('oxygen_bubbles', 'Oxygen bubbles on the leaves', 'plants', 'pond_oxygen', '#eaf7fb', { instances: 'o2_bubbles', lod: 'near', deeper: { type: 'mol', mol: 'oxygen', name: 'Oxygen', button: 'See the molecule: oxygen' } }),
    part('iris_leaves', 'Yellow flag iris: leaves', 'bank', 'pond_iris', '#5b8a3a', { instances: 'iris_leaves', double: true, tint: .15, lod: 'near+mid' }),
    part('iris_flowers', 'Yellow flag iris: flowers', 'bank', 'pond_iris_flower', '#f2c81e', { mesh: 'iris_flowers', double: true, lod: 'near+mid', solid: false }),
    part('iris_stalks', 'Yellow flag iris: flower stalks', 'bank', 'pond_iris', '#6b8f3a', { mesh: 'iris_stalks', lod: 'near+mid' }),
    part('iris_far', 'Yellow flag iris', 'bank', 'pond_iris', '#5b8a3a', { mesh: 'iris_far', lod: 'far', noink: true }),
    part('iris_rhizome', 'Yellow flag iris: rhizome in the mud', 'bed', 'pond_iris_rhizome', '#b79b6b', { mesh: 'iris_rhizome', lod: 'near' }),
    part('iris_roots', 'Yellow flag iris: roots', 'bed', 'pond_iris_rhizome', '#d9c7a0', { instances: 'iris_roots', lod: 'near', double: true }),
    // ---- water flea (Daphnia): the animal and its parts ----
    part('daphnia_carapace', 'Water flea: shell (carapace)', 'animals', 'pond_daphnia', '#cfe8e0', { mesh: 'daphnia_carapace', lod: 'near', opacity_max: .32, noink: true, deeper: { type: 'mol', mol: 'n_acetylglucosamine', name: 'N-acetylglucosamine', button: 'See the molecule: the unit of chitin' } }),
    part('daphnia_head', 'Water flea: head', 'animals', 'pond_daphnia_head', '#e3caa0', { mesh: 'daphnia_head', lod: 'near', ink_w: .0003 }),
    part('daphnia_eye', 'Water flea: compound eye', 'animals', 'pond_daphnia_head', '#101010', { mesh: 'daphnia_eye', lod: 'near', noink: true }),
    part('daphnia_antennae', 'Water flea: second antennae', 'animals', 'pond_daphnia_antennae', '#e8d8b8', { mesh: 'daphnia_antennae', lod: 'near', ink_w: .0002, solid: false }),
    part('daphnia_heart', 'Water flea: heart', 'animals', 'pond_daphnia_heart', '#cf5a4e', { mesh: 'daphnia_heart', lod: 'near', ink_w: .0002, deeper: { type: 'cell', cell: 'animal', button: 'Look inside a heart muscle cell (the human heart, for comparison)' } }),
    part('daphnia_gut', 'Water flea: gut', 'animals', 'pond_daphnia_gut', '#7aa84a', { mesh: 'daphnia_gut', lod: 'near', ink_w: .0002 }),
    part('daphnia_eggs', 'Water flea: eggs in the brood chamber', 'animals', 'pond_daphnia_eggs', '#e8e0a8', { mesh: 'daphnia_eggs', lod: 'near', ink_w: .0002 }),
    part('daphnia_limbs', 'Water flea: filtering limbs', 'animals', 'pond_daphnia_limbs', '#d9c9a0', { mesh: 'daphnia_limbs', lod: 'near', ink_w: .0002 }),
    part('daphnia_swarm', 'Water fleas (more of them)', 'animals', 'pond_daphnia', '#d8c8a0', { instances: 'daphnia_swarm', lod: 'near' }),
    // ---- great pond snail ----
    part('snail_shell', 'Great pond snail: shell', 'animals', 'pond_snail', '#a07a45', { mesh: 'snail_shell', lod: 'near', ink_w: .0012, solid: false, double: true }),
    part('snail_body', 'Great pond snail: foot and head', 'animals', 'pond_snail_body', '#6e6a55', { mesh: 'snail_body', lod: 'near', ink_w: .0008 }),
    part('snail_tentacles', 'Great pond snail: tentacles', 'animals', 'pond_snail_senses', '#7b7660', { mesh: 'snail_tentacles', lod: 'near', ink_w: .0006 }),
    part('snail_eyes', 'Great pond snail: eyes', 'animals', 'pond_snail_senses', '#101010', { mesh: 'snail_eyes', lod: 'near', noink: true }),
    // ---- southern hawker larva ----
    part('larva_head', 'Dragonfly larva: head', 'animals', 'pond_larva_head', '#6a6b3d', { mesh: 'larva_head', lod: 'near', ink_w: .0006 }),
    part('larva_eyes', 'Dragonfly larva: compound eyes', 'animals', 'pond_larva_head', '#8a9a50', { mesh: 'larva_eyes', lod: 'near', ink_w: .0006 }),
    part('larva_mask', 'Dragonfly larva: folded lip (the mask)', 'animals', 'pond_larva_mask', '#8a7a50', { mesh: 'larva_mask', lod: 'near', ink_w: .0005, solid: false, double: true }),
    part('larva_thorax', 'Dragonfly larva: thorax', 'animals', 'pond_larva_thorax', '#6a6b3d', { mesh: 'larva_thorax', lod: 'near', ink_w: .0006 }),
    part('larva_wingpads', 'Dragonfly larva: wing pads', 'animals', 'pond_larva_thorax', '#5a5b34', { mesh: 'larva_wingpads', lod: 'near', ink_w: .0005 }),
    part('larva_legs', 'Dragonfly larva: legs', 'animals', 'pond_larva_legs', '#5d5a35', { mesh: 'larva_legs', lod: 'near', ink_w: .0005 }),
    part('larva_abdomen', 'Dragonfly larva: abdomen', 'animals', 'pond_larva_abdomen', '#68693c', { mesh: 'larva_abdomen', lod: 'near', ink_w: .0006 }),
    part('larva_cerci', 'Dragonfly larva: tail points', 'animals', 'pond_larva_abdomen', '#6a6638', { mesh: 'larva_cerci', lod: 'near', ink_w: .0005 }),
    // ---- common frog tadpole ----
    part('tadpole_body', 'Frog tadpole: body', 'animals', 'pond_tadpole', '#3b3326', { mesh: 'tadpole_body', lod: 'near', ink_w: .0008 }),
    part('tadpole_eyes', 'Frog tadpole: eyes', 'animals', 'pond_tadpole', '#e1b94a', { mesh: 'tadpole_eyes', lod: 'near', noink: true }),
    part('tadpole_tail', 'Frog tadpole: tail', 'animals', 'pond_tadpole_tail', '#5a4a32', { mesh: 'tadpole_tail', lod: 'near', ink_w: .0006 }),
    part('tadpole_legs', 'Frog tadpole: hind legs', 'animals', 'pond_tadpole_legs', '#4d3f2b', { mesh: 'tadpole_legs', lod: 'near', ink_w: .0005 }),
    part('tadpole_swarm', 'Frog tadpoles (more of them)', 'animals', 'pond_tadpole', '#3b3326', { instances: 'tadpole_swarm', lod: 'near' }),
  ];
  // the tadpole's eyes are separate geometry in the build; keep the names the model script made
  const thing = {
    id: 'pond', title: 'A pond in the park', label: 'Pond', scientific: null, node: 'park_pond', main_part: 'surface',
    blurb: 'A small pond in the park: a slice through the water, the mud and the bank, with the plants and animals of a British garden pond at their true sizes. Click anything, or choose a layer.',
    model_note: 'A model built from typical measurements of each species, not a scan of a real pond. The pond\'s outline and depth are choices (about 6 m by 4.6 m, 0.6 m deep); the animals and plants are at true size, and how many there are and where they sit is illustrative.',
    size_m: { width: 6.0, depth: 4.6, deepest: POND.depth }, height_m: 1.0, radius_m: 3.7, draw_m: 500, seed: 2718,
    label_m: 45,
    systems: [
      { id: 'surface', label: 'Water surface' }, { id: 'floating', label: 'On and in the surface film' }, { id: 'bank', label: 'Bank and edge' },
      { id: 'water', label: 'Open water' }, { id: 'plants', label: 'Submerged plants' }, { id: 'animals', label: 'Animals' }, { id: 'bed', label: 'Bottom and mud' },
    ],
    modes: [
      { id: 'surface', label: 'Surface', show: { surface: .9, floating: 1, bank: 1 } },
      { id: 'water', label: 'Open water', groundSeeThrough: true, show: { surface: .2, floating: 1, bank: 1, water: .18, plants: 1, animals: 1, bed: .5 } },
      { id: 'bed', label: 'Bottom and mud', groundSeeThrough: true, show: { surface: .1, floating: .4, bank: .8, water: .06, plants: .75, animals: 1, bed: 1 } },
      { id: 'slice', label: 'Cut-away slice', groundSeeThrough: true, cut: { at: [0, -.15, 0], normal: [0, 0, 1] }, hotspots: false, show: { surface: .3, floating: 1, bank: 1, water: .32, plants: 1, animals: 1, bed: 1 },
        legend: { title: 'A slice through the pond', items: [{ name: 'Water', color: '#6fa8b8', node: 'pond_water' }, { name: 'Mud (silt, clay and rotting plant matter)', color: '#5c4630', node: 'pond_mud' }, { name: 'Roots and rhizome', color: '#b79b6b', node: 'pond_iris_rhizome' }], note: 'The colours on the cut face are a code, not what the cut would look like in a real pond.' } },
    ],
    auto: { label: 'Auto', stages: [{ max_m: 3.4, mode: 'water' }, { mode: 'surface' }] },
    layers: [
      { id: 'surface', label: 'the water surface and what floats on it', systems: ['surface', 'floating', 'bank'], ghost: .1 },
      { id: 'water', label: 'the open water, its plants and animals', systems: ['water', 'plants', 'animals'], ghost: .1 },
      { id: 'bed', label: 'the bottom and mud', systems: ['bed'], ghost: .1 },
    ],
    lod: { near_m: 6, far_m: 32 },
    cut: { default: 'tissue', at: [0, -.15, 0], faces: {
      tissue: { kind: 'plain', palette: [[0xdad2bc, 1]] },
      water: { kind: 'plain', palette: [[0x6fa8b8, 1]] },
      mud: { kind: 'grains', cell: .05, edge: .35, palette: [[0x5c4630, .4], [0x4a3826, .3], [0x6b5a42, .2], [0x2d261e, .1]] },
    } },
    hotspots: [
      { id: 'hs_mud_oxygen', node: 'pond_mud_oxygen', at: [.5, bedY(.5, 0) - .004, .02], label: 'Where the oxygen runs out', r: .035, modes: ['slice'] },
      { id: 'hs_rhizome', node: 'pond_iris_rhizome', at: [2.62, bedY(2.62, -.5) - .03, -.5], label: 'Roots in the mud', r: .035, modes: ['slice'] },
      { id: 'hs_warm_top', node: 'pond_stratification', at: [-.4, -.04, .03], label: 'Warmer water at the top?', r: .035, modes: ['slice'] },
    ],
    anim: [
      { kind: 'sway', parts: ['duckweed'], from_y: -.012, to_y: .0003, amp_m: .0035, hz: .12, label: 'Duckweed drifting' },
      { kind: 'wag', parts: ['skater_body', 'skater_front_legs', 'skater_mid_legs', 'skater_hind_legs', 'film_dimples'], pivot: P.skater.at, axis: [0, 1, 0], amp_deg: 5, hz: 1.4, shown_hz: .7, illustrative: true, label: 'Pond skater twitch' },
      { kind: 'pulse', part: 'daphnia_heart', pivot: pt('daphnia', [.4, .58, 0]), amp: .22, hz: 3, shown_hz: 1.5, label: 'Water flea heart' },
      { kind: 'flap', part: 'daphnia_antennae', pivot: pt('daphnia', [1.05, -.05, 0]), axis: ax('daphnia', [0, 0, 1]), amp_deg: 22, shown_hz: 1.2, illustrative: true, label: 'Water flea antennae (its hop)' },
    ],
    ruler: { label: 'Pond', D: 8, at: [0, 0, 0] },
    parts,
  };
  return { thing, meshes, instances, flows };
}
