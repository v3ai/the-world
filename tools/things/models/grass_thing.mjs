// The thing description: systems, layers, modes, parts, hotspots, animation.
export function buildThing(ctx, M) {
  const P = (id, name, system, node, color, o = {}) => ({ id, name, system, node, color, priority: 1.7, solid: false, noink: true, ...o });
  const parts = [
    // ---- blades: two sheets back to back ----
    P('blade_up', 'Leaf blade, upper surface', 'blades', 'grass_blade_upper', '#4d8a2e', { mesh: 'blade_up', lod: 'near', deeper: { type: 'tissue2', id: 'grass_leaf_section', D: 5.2e-4, button: 'Look inside the leaf blade' } }),
    P('blade_down', 'Leaf blade, underside', 'blades', 'grass_blade_under', '#74b04a', { mesh: 'blade_down', lod: 'near', deeper: { type: 'tissue2', id: 'grass_leaf_section', D: 5.2e-4, button: 'Look inside the leaf blade' } }),
    P('far_blades', 'Leaf blades', 'blades', 'grass_blade', '#5c9a3a', { mesh: 'far_blades', lod: 'mid+far', double: true }),
    P('culm_blade_up', 'Stem leaf blade, upper surface', 'blades', 'grass_blade_upper', '#4d8a2e', { mesh: 'culm_blade_up', lod: 'near' }),
    P('culm_blade_down', 'Stem leaf blade, underside', 'blades', 'grass_blade_under', '#74b04a', { mesh: 'culm_blade_down', lod: 'near' }),
    P('culm_blade_mid', 'Stem leaf blade', 'blades', 'grass_blade', '#5c9a3a', { mesh: 'culm_blade_mid', lod: 'mid+far', double: true }),
    P('dead_leaves', 'Dead leaves', 'blades', 'grass_dead_leaf', '#a8935a', { mesh: 'dead_leaves', double: true, lod: 'near' }),
    // ---- sheaths and the junction ----
    P('sheaths', 'Leaf sheaths', 'sheaths', 'grass_sheath', '#9ec06a', { mesh: 'sheaths', double: true, lod: 'near' }),
    P('culm_sheaths', 'Stem leaf sheaths', 'sheaths', 'grass_sheath', '#a4c46f', { mesh: 'culm_sheaths', double: true, lod: 'near' }),
    P('ligules', 'Ligule', 'sheaths', 'grass_ligule', '#f1efe2', { mesh: 'ligules', double: true, lod: 'near', priority: 2.2 }),
    P('culm_ligules', 'Ligule', 'sheaths', 'grass_ligule', '#f1efe2', { mesh: 'culm_ligules', double: true, lod: 'near', priority: 2.2 }),
    P('auricles', 'Auricles', 'sheaths', 'grass_auricle', '#e8e3c8', { mesh: 'auricles', lod: 'near', priority: 2.2 }),
    // ---- stems ----
    P('crowns', 'Stem base (crown)', 'stems', 'grass_crown', '#b9a06a', { mesh: 'crowns', lod: 'near' }),
    P('meristems', 'Growing point (shoot apex)', 'stems', 'grass_meristem', '#e8c96a', { instances: 'meristems', lod: 'near', priority: 2.5 }),
    P('culms', 'Flowering stem (culm)', 'stems', 'grass_culm', '#8cae52', { mesh: 'culms', lod: 'near+mid+far' }),
    P('culm_nodes', 'Node', 'stems', 'grass_node', '#6f8a3a', { mesh: 'culm_nodes', lod: 'near', priority: 2.1 }),
    // ---- flowers ----
    P('rachis', 'Spike axis (rachis)', 'flowers', 'grass_rachis', '#9cba5c', { mesh: 'rachis', lod: 'near', priority: 1.8 }),
    P('glumes', 'Glume', 'flowers', 'grass_glume', '#9db75a', { instances: 'glumes', lod: 'near', double: true, priority: 1.9 }),
    P('lemmas', 'Lemma', 'flowers', 'grass_lemma', '#b3c46a', { instances: 'lemmas', lod: 'near', double: true, tint: .15, priority: 1.9 }),
    P('spikelet_lens', 'Spikelet', 'flowers', 'grass_spikelet', '#b0c06a', { instances: 'spikelet_lens', lod: 'mid+far', double: true, priority: 1.8 }),
    P('filaments', 'Filament', 'flowers', 'grass_filament', '#f0ecc8', { instances: 'filaments', lod: 'near', double: true, priority: 2.1 }),
    P('anthers', 'Anther', 'flowers', 'grass_anther', '#e8d35a', { instances: 'anthers', lod: 'near', double: true, tint: .1, priority: 2.2, deeper: { type: 'tissue2', id: 'grass_pollen', D: 4.8e-4, button: 'Look at grass pollen' } }),
    P('stigmas', 'Stigma', 'flowers', 'grass_stigma', '#d9d6e6', { instances: 'stigmas', lod: 'near', double: true, priority: 2.1 }),
    // ---- roots ----
    P('roots', 'Fibrous roots', 'roots', 'grass_roots', '#d9c796', { mesh: 'roots', lod: 'near', deeper: { type: 'tissue2', id: 'grass_root_tip', D: 1.7e-3, button: 'Look at a root tip' } }),
    P('lateral_roots', 'Lateral roots', 'roots', 'grass_roots', '#e6d9b2', { mesh: 'lateral_roots', lod: 'near' }),
    P('root_tips', 'Root cap', 'roots', 'grass_root_tip', '#f2e8c4', { instances: 'root_tips', lod: 'near', priority: 2.1, deeper: { type: 'tissue2', id: 'grass_root_tip', D: 1.7e-3, button: 'Look at a root tip' } }),
    P('root_hairs', 'Root hairs', 'roots', 'grass_root_hairs', '#f6f1dc', { instances: 'root_hairs', lod: 'near', double: true, priority: 2 }),
    P('soil', 'Soil', 'soil', 'grass_soil', '#6b4c32', { mesh: 'soil', opacity_max: .32, priority: .5 }),
    ...(ctx.parts || []),
  ];
  const systems = [{ id: 'blades', label: 'Leaf blades' }, { id: 'sheaths', label: 'Sheaths' }, { id: 'stems', label: 'Stems' }, { id: 'flowers', label: 'Flowers' }, { id: 'roots', label: 'Roots' }, { id: 'soil', label: 'Soil' }, ...(ctx.systems || [])];
  const spec0 = Object.fromEntries((ctx.systems || []).map(s => [s.id, 0]));
  const plant = (o = 1) => ({ blades: o, sheaths: o, stems: o, flowers: o });
  const modes = [
    { id: 'whole', label: 'Whole plant', show: plant(1) },
    { id: 'tiller', label: 'One tiller pulled apart', pivot: 'tiller', show: { ...plant(.12), tiller: 1 }, hotspots: true, groundSeeThrough: true, legend: ctx.legends?.tiller },
    { id: 'flower', label: 'In flower', show: { blades: .35, sheaths: .35, stems: 1, flowers: 1 }, hotspots: true, legend: ctx.legends?.flower },
    { id: 'under', label: 'Underground', show: { roots: 1, soil: 1, stems: .9, sheaths: .2, blades: .08, flowers: .05 }, groundSeeThrough: true, hotspots: true,
      legend: { title: 'Underground', items: [{ name: 'Fibrous roots', color: '#d9c796', node: 'grass_roots' }, { name: 'Root cap and tip', color: '#f2e8c4', node: 'grass_root_tip' }, { name: 'Root hairs', color: '#f6f1dc', node: 'grass_root_hairs' }, { name: 'Stem base', color: '#b9a06a', node: 'grass_crown' }], note: 'The soil is drawn see-through. The roots are a schematic of a fibrous system: the number and course of real roots differ from plant to plant. Root hairs are drawn at an illustrative length.' } },
    ...(ctx.modes || []),
  ];
  const thing = {
    id: 'grass', title: 'A grass plant', label: 'Perennial ryegrass', scientific: 'Lolium perenne', node: 'grass_plant', main_part: 'blade_up', label_first_only: true,
    blurb: 'A tussock of perennial ryegrass, the commonest park lawn grass, at true size. Click a blade, a sheath, the base of a stem, a flower or a root. The layers pull one shoot apart, open the flowers, and show the roots.',
    model_note: 'A procedural model built from typical measurements of the species, not a scan of one plant. Counts of tillers, leaves and spikelets are choices within the ranges on the cards; real tussocks are larger and untidier.',
    size_m: { height: M.culmH, leaf_blade: M.bladeLen[1] }, height_m: M.culmH + .16, radius_m: .8, draw_m: 90, seed: 7771,
    systems, lod: { near_m: 2.5, far_m: 6 },
    shadow: { radius_m: .16, opacity: .5 },
    pivots: ctx.pivots || {},
    anim: [{ kind: 'sway', systems: ['blades', 'stems', 'flowers'], from_y: .02, to_y: .6, amp_m: .01, hz: .5, label: 'Leaves and flowering stems' }],
    layers: [
      { id: 'above', label: 'Blades and flowers', systems: ['blades', 'flowers'] },
      { id: 'sheaths', label: 'Sheaths', systems: ['sheaths'] },
      { id: 'stem', label: 'Stems and growing points', systems: ['stems'] },
      { id: 'soil', label: 'Soil', systems: ['soil'] },
      { id: 'roots', label: 'Roots', systems: ['roots'] },
    ],
    auto: { label: 'Auto', layers: true, always: {} },
    modes, hotspots: ctx.hot, parts,
  };
  return thing;
}
