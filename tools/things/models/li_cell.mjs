// A lithium-ion pouch cell of the kind that powers a phone, at true size, layer by layer.
// It does not stand in the park: data/things/index.json places it in the phone, where the phone's battery block is (in: "phone", part: "phone_battery").
// Axes are the phone's: x across the cell, y along it (base at y = 0, the tabs at the top), z through its thickness (+z toward the screen).
import * as L from '../lib/index.mjs';

/* Every number the model is built from, with where it comes from (sources: notes/anywhere.md). Lengths in metres. */
export const M = {
  // outer size: the battery bay of the phone model (js/teardown.js PHONE_PARTS: 62 x 78 x 4.6 mm). No source gives the outer size of a named phone cell; this is the model's choice.
  W: .062, H: .078, T: .0046,
  terrace: .006,            // the flat sealed strip at the top that the tabs pass through (drawn; not sourced)
  // pouch film: aluminium laminated between nylon (outside) and polypropylene (inside); 113 um is the grade described for mobile devices (batterydesign.net, a trade reference)
  film: 113e-6,
  // layer thicknesses of a consumer LiCoO2/graphite pouch cell (Enertech, 2.28 Ah, charged to 4.2 V), as measured for Ai et al. 2020 (J. Electrochem. Soc. 167, 013512)
  // and Rieger et al. 2016 (J. Electrochem. Soc. 163, A1566); read from the parameter file of the open-source PyBaMM project (Ai2020.py)
  cu: 10e-6, anode: 76.5e-6, sep: 25e-6, cathode: 68e-6, al: 15e-6,
  rGraphite: 5e-6, rLCO: 3e-6,               // particle radii in the same parameter set
  // the stack: how many double-coated electrodes of each kind fit in the thickness (a calculation, below)
  sheetW: .056, sheetH: .064, sheetY0: .003,  // the coated area of each sheet (drawn; not sourced)
  tabW: .010, tabX: .017, tabTop: .0705,      // the bare foil tongue of each sheet, and how far up it reaches inside the pouch (drawn)
  gap: .3e-6,                                 // each sheet is drawn this much thinner on both faces so that neighbouring faces do not coincide (0.6 um between sheets)
};
M.unit = M.cu + 2 * M.anode + M.al + 2 * M.cathode + 2 * M.sep;                       // one anode sheet, one cathode sheet and two separators: 364 um
M.pairs = Math.floor((M.T - 2 * M.film + 1e-9) / M.unit);                             // 12
M.stackT = M.pairs * M.unit;                                                          // 4.368 mm of the 4.374 mm inside the pouch

const mm = v => v * 1e-3;
/* a box from its two corners, outward winding */
function box(a, b) {
  const [x0, y0, z0] = a, [x1, y1, z1] = b;
  const pos = [x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1];
  const idx = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
  return { pos, idx };
}
/* a prism: a convex outline in the xy plane (counter-clockwise seen from +z), from z0 to z1 */
function prism(poly, z0, z1) {
  const n = poly.length, pos = [], idx = [];
  for (const [x, y] of poly) pos.push(x, y, z0); for (const [x, y] of poly) pos.push(x, y, z1);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, j, n + j, i, n + j, n + i); }
  for (let i = 1; i < n - 1; i++) { idx.push(0, i + 1, i); idx.push(n, n + i, n + i + 1); }
  return { pos, idx };
}
function roundRect(x0, y0, x1, y1, r, seg = 6) {
  const out = [], c = [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= seg; i++) { const a = (a0 + 90 * i / seg) * Math.PI / 180; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return out;
}
const merge = (...m) => L.merge(...m);

export default function build() {
  const { W, H, T, film, gap } = M, bodyH = H - M.terrace, meshes = {};
  // ---- the pouch: a shell of laminate film round the stack, sealed flat at the top (the "terrace") ----
  const outer = prism(roundRect(-W / 2, 0, W / 2, bodyH, mm(2.2)), -T / 2, T / 2);
  const inner = L.flip(prism(roundRect(-W / 2 + film, film, W / 2 - film, bodyH - film, mm(2.1)), -T / 2 + film, T / 2 - film));
  meshes.pouch = merge(outer, inner);
  meshes.seal = box([-W / 2, bodyH - mm(.2), -film], [W / 2, H - mm(1.6), film]);                                  // two films welded face to face: 0.226 mm
  meshes.cell_far = merge(prism(roundRect(-W / 2, 0, W / 2, bodyH, mm(2.2), 3), -T / 2, T / 2), box([-W / 2, bodyH - mm(.2), -film], [W / 2, H - mm(1.6), film]));
  // ---- the stack: 12 x (separator, anode sheet, separator, cathode sheet), every layer at its true thickness ----
  const x0 = -M.sheetW / 2, x1 = M.sheetW / 2, y0 = M.sheetY0, y1 = M.sheetY0 + M.sheetH;
  const parts = { cu: [], anode: [], sep: [], cathode: [], al: [] };
  const slab = (za, zb, xa = x0, xb = x1, ya = y0, yb = y1) => box([xa, ya, za + gap], [xb, yb, zb - gap]);
  let z = -M.stackT / 2; const zs = [];
  for (let i = 0; i < M.pairs; i++) {
    parts.sep.push(slab(z, z + M.sep)); z += M.sep;
    parts.anode.push(slab(z, z + M.anode)); z += M.anode;
    parts.cu.push(slab(z, z + M.cu), slab(z, z + M.cu, -M.tabX - M.tabW / 2, -M.tabX + M.tabW / 2, y1, M.tabTop)); zs.push(['cu', z + M.cu / 2]); z += M.cu;   // the foil and its bare tongue
    parts.anode.push(slab(z, z + M.anode)); z += M.anode;
    parts.sep.push(slab(z, z + M.sep)); z += M.sep;
    parts.cathode.push(slab(z, z + M.cathode)); z += M.cathode;
    parts.al.push(slab(z, z + M.al), slab(z, z + M.al, M.tabX - M.tabW / 2, M.tabX + M.tabW / 2, y1, M.tabTop)); zs.push(['al', z + M.al / 2]); z += M.al;
    parts.cathode.push(slab(z, z + M.cathode)); z += M.cathode;
  }
  for (const k in parts) meshes[k] = merge(...parts[k]);
  // ---- the tabs: metal strips welded to the gathered foil tongues, passing out through the seal ----
  // ---- the protection circuit: a small board lying on the terrace, with one control chip, a pair of switches and a connector tail ----
  const bz0 = film + mm(.15), bz1 = bz0 + mm(.6), by0 = bodyH + mm(.6), by1 = H - mm(1.9);
  // each tab comes out past the sealed edge and is bent forward and down onto the face of the board (the bend and the join are drawn, not sourced; 0.1 mm thick: drawn)
  const tabT = mm(.1), tabY1 = H;
  const tab = x => merge(box([x - mm(4), M.tabTop - mm(1.5), -tabT / 2], [x + mm(4), tabY1, tabT / 2]), box([x - mm(4), tabY1 - tabT, -tabT / 2], [x + mm(4), tabY1, bz1 + tabT]), box([x - mm(4), by0 + mm(.5), bz1], [x + mm(4), tabY1, bz1 + tabT]));
  meshes.tab_neg = tab(-M.tabX); meshes.tab_pos = tab(M.tabX);
  meshes.pcm_board = box([-mm(23), by0, bz0], [mm(23), by1, bz1]);
  meshes.pcm_ic = box([-mm(4.5), by0 + mm(1.0), bz1], [-mm(1.6), by0 + mm(2.6), bz1 + mm(1.1)]);
  meshes.pcm_fet = box([mm(1.5), by0 + mm(.6), bz1], [mm(4.5), by0 + mm(3.0), bz1 + mm(.6)]);
  meshes.pcm_flex = merge(box([mm(23), by0 + mm(.6), bz0], [mm(29.5), by1 - mm(.6), bz0 + mm(.15)]), box([mm(26.5), by0 + mm(.3), bz0 + mm(.15)], [mm(29.5), by1 - mm(.3), bz0 + mm(1.0)]));

  // ---- one electrode pair, opened: the same sheets at their true thickness, lifted 7 mm apart and stepped sideways so each can be seen ----
  const dz = mm(7), sx = mm(9);
  const sheet = (zc, th, ox, xa = x0, xb = x1, ya = y0, yb = y1) => box([xa + ox, ya, zc - th / 2], [xb + ox, yb, zc + th / 2]);
  meshes.p_cu = merge(sheet(-dz, M.cu, sx), sheet(-dz, M.cu, sx, -M.tabX - M.tabW / 2, -M.tabX + M.tabW / 2, y1, M.tabTop));
  meshes.p_an = merge(sheet(-dz - M.cu / 2 - M.anode / 2 - gap, M.anode, sx), sheet(-dz + M.cu / 2 + M.anode / 2 + gap, M.anode, sx));
  meshes.p_sep = sheet(0, M.sep, 0);
  meshes.p_al = merge(sheet(dz, M.al, -sx), sheet(dz, M.al, -sx, M.tabX - M.tabW / 2, M.tabX + M.tabW / 2, y1, M.tabTop));
  meshes.p_ca = merge(sheet(dz - M.al / 2 - M.cathode / 2 - gap, M.cathode, -sx), sheet(dz + M.al / 2 + M.cathode / 2 + gap, M.cathode, -sx));
  // ---- the outside circuit, schematic: a wire from the copper foil's tongue round through a device to the aluminium foil's tongue ----
  const xa = -M.tabX + sx, xc = M.tabX - sx, yt = M.tabTop, wy = mm(86), ly = mm(91);
  const wirePts = [[xa, yt, -dz], [xa, wy, -dz], [xa, ly, 0], [xc, ly, 0], [xc, wy, dz], [xc, yt, dz]];
  meshes.wire = L.tube(wirePts, mm(.35), { sides: 8, caps: true });
  meshes.load = box([-mm(5), ly - mm(3), -mm(2)], [mm(5), ly + mm(3), mm(2)]);
  // ---- motion (declared as flows): lithium ions across the separator, electrons round the outside ----
  meshes.ion = L.lathe([[0, -.00045], [.00032, -.00032], [.00045, 0], [.00032, .00032], [0, .00045]], { segments: 8, caps: false });
  meshes.electron = L.lathe([[0, -.00036], [.00025, -.00025], [.00036, 0], [.00025, .00025], [0, .00036]], { segments: 8, caps: false });
  const ionPaths = [], zA = -dz + M.cu / 2 + M.anode, zC = dz - M.al / 2 - M.cathode;   // from the face of the graphite coating to the face of the oxide coating
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const x = mm(-16 + i * 8), y = mm(11 + j * 15); ionPaths.push({ p: [x, y, zA, x, y, 0, x, y, zC], r: [1e-5, 1e-5, 1e-5] }); }
  const ePts = [[xa, mm(30), -dz], [xa, yt, -dz], [xa, wy, -dz], [xa, ly, 0], [xc, ly, 0], [xc, wy, dz], [xc, yt, dz], [xc, mm(30), dz]];
  const ePath = [{ p: ePts.flat(), r: new Array(ePts.length).fill(1e-5) }];
  const R = L.rng(77), ionMk = [], eMk = [];
  ionPaths.forEach((_, k) => { for (let j = 0; j < 3; j++) ionMk.push([k, Math.round(((j + R()) / 3) * 1e3) / 1e3, 0]); });
  for (let j = 0; j < 16; j++) eMk.push([0, Math.round(((j + .5) / 16) * 1e3) / 1e3, 0]);
  const ionSpeed = (zC - zA) / 18, eSpeed = .14 / 48;   // an ion marker crosses in about 3 s, an electron marker goes round in about 8 s: diagram speeds, not real ones
  const flows = {
    ions_dis: { mesh: 'ion', dir: 1, speed: ionSpeed, ring: 0, paths: ionPaths, markers: ionMk }, ions_chg: { mesh: 'ion', dir: -1, speed: ionSpeed, ring: 0, paths: ionPaths, markers: ionMk },
    e_dis: { mesh: 'electron', dir: 1, speed: eSpeed, ring: 0, paths: ePath, markers: eMk }, e_chg: { mesh: 'electron', dir: -1, speed: eSpeed, ring: 0, paths: ePath, markers: eMk },
  };

  const um = v => Math.round(v * 1e7) / 10, zMid = zs[Math.floor(zs.length / 2)];
  const cutY = .036, stackSys = ['copper', 'anode', 'separator', 'cathode', 'aluminium'], caseSys = ['pouch', 'tabs', 'pcm'];
  const show = (o) => Object.assign({ pouch: 0, tabs: 0, pcm: 0, copper: 0, anode: 0, separator: 0, cathode: 0, aluminium: 0, pair: 0, circuit: 0, flow_dis: 0, flow_chg: 0 }, o);
  const real = { pouch: 1, tabs: 1, pcm: 1, copper: 1, anode: 1, separator: 1, cathode: 1, aluminium: 1 };
  const layerLegend = [
    { name: `Copper foil, ${um(M.cu)} µm`, color: '#c8793a', node: 'licell_cu_foil' }, { name: `Graphite coating, ${um(M.anode)} µm`, color: '#474c55', node: 'licell_anode' },
    { name: `Separator, ${um(M.sep)} µm`, color: '#efe9d8', node: 'licell_separator' }, { name: `Lithium cobalt oxide coating, ${um(M.cathode)} µm`, color: '#2d4a86', node: 'licell_cathode' },
    { name: `Aluminium foil, ${um(M.al)} µm`, color: '#cfd4da', node: 'licell_al_foil' }];
  const flowNote = 'A diagram of direction only. The markers are enormously enlarged and their speed means nothing; the sheets are at their true thickness but are drawn 7 mm apart, while in the cell they touch and an ion travels about 0.2 mm. The wire and the device are schematic.';
  const deepAnode = { type: 'tissue2', id: 'licell_anode', D: 1.1e-4, button: 'Look into the graphite coating' }, deepCathode = { type: 'tissue2', id: 'licell_cathode', D: 1.0e-4, button: 'Look into the oxide coating' }, deepSep = { type: 'tissue2', id: 'licell_separator', D: 6e-6, button: 'Look into the separator' };
  const thing = {
    id: 'li_cell', title: 'Lithium-ion cell', label: 'Battery', scientific: null, node: 'li_cell', main_part: 'pouch',
    answers: ['phone_battery'],   // the phone's own short battery card: going to it (search, a chip) leads here, to this thing's card
    blurb: 'The phone\'s battery: one lithium-ion pouch cell, at true size. Inside the foil pouch lie 12 pairs of coated metal sheets with a porous separator between them. Double-click it to cut it across, or choose a view above.',
    model_note: 'A model built from published measurements, not a scan of one battery. The layer thicknesses are those measured on a 2.28 Ah consumer pouch cell of the same chemistry (lithium cobalt oxide and graphite); the outer size is the battery bay of the phone model; the sizes of the tabs, the sealed strip and the circuit board are drawn, not measured. A real phone cell differs in detail.',
    size_m: { width: W, height: H, thickness: T }, height_m: H, radius_m: .085, bound_m: .052, draw_m: 30, label_m: .6,   // bound_m: the ball about the cell's middle that holds it (half its diagonal)
    seed: 77, systems: [
      { id: 'pouch', label: 'Pouch' }, { id: 'tabs', label: 'Tabs' }, { id: 'pcm', label: 'Protection circuit' },
      { id: 'copper', label: 'Negative current collector' }, { id: 'anode', label: 'Negative electrode' }, { id: 'separator', label: 'Separator' }, { id: 'cathode', label: 'Positive electrode' }, { id: 'aluminium', label: 'Positive current collector' },
      { id: 'pair', label: 'One electrode pair' }, { id: 'circuit', label: 'Outside circuit (schematic)' }, { id: 'flow_dis', label: 'Discharging' }, { id: 'flow_chg', label: 'Charging' }],
    modes: [
      { id: 'whole', label: 'Whole cell', show: show(real) },
      { id: 'stack', label: 'Without the pouch', show: show(Object.assign({}, real, { pouch: .1 })) },
      { id: 'cut', label: 'Cut across: the layers', cut: { at: [0, cutY, 0], normal: [0, 1, 0] }, view: { dir: [.18, .8, .57], at: [0, cutY, 0], D: .075 }, hotspots: true, show: show(real),
        legend: { title: 'On the cut face', items: layerLegend, note: `Every layer is drawn at its true thickness (to within a micrometre), so the sheets only show as separate when you zoom in to a view about a millimetre wide. Thicknesses: a 2.28 Ah consumer pouch cell (Ai et al. 2020). ${M.pairs} pairs of sheets fill the ${(M.T * 1e3).toFixed(1)} mm.` } },
      { id: 'pair', label: 'One pair of sheets, opened', hotspots: true, view: { dir: [.72, .3, .62], at: [0, .037, 0], D: .16 }, show: show({ pair: 1 }),
        legend: { title: 'One pair of sheets', items: layerLegend, note: 'One negative sheet, one separator and one positive sheet, at their true thickness but lifted 7 mm apart and stepped sideways. In the cell they lie pressed together, soaked in liquid electrolyte.' } },
      { id: 'discharge', label: 'Discharging', hotspots: true, view: { dir: [.8, .28, .53], at: [0, .05, 0], D: .2 }, show: show({ pair: 1, circuit: 1, flow_dis: 1 }),
        legend: { title: 'Discharging: the cell drives the device', items: [{ name: 'Lithium ions: out of the graphite, through the separator, into the oxide', color: '#8fd3ff', node: 'licell_ion_shuttle' }, { name: 'Electrons: out through the copper, round the outside, in through the aluminium', color: '#ffd166', node: 'licell_electrons' }], note: flowNote } },
      { id: 'charge', label: 'Charging', hotspots: true, view: { dir: [.8, .28, .53], at: [0, .05, 0], D: .2 }, show: show({ pair: 1, circuit: 1, flow_chg: 1 }),
        legend: { title: 'Charging: the charger pushes both back', items: [{ name: 'Lithium ions: out of the oxide, through the separator, into the graphite', color: '#8fd3ff', node: 'licell_ion_shuttle' }, { name: 'Electrons: pushed by the charger from the aluminium side round to the copper side', color: '#ffd166', node: 'licell_electrons' }], note: flowNote } },
    ],
    layers: [{ id: 'case', label: 'pouch', systems: caseSys, ghost: .08 }, { id: 'stack', label: 'electrode stack', systems: stackSys }],
    auto: { label: 'Auto', layers: true, always: {}, scale: .06 },
    lod: { near_m: .7 },
    cut: { default: 'graphite', at: [0, cutY, 0], faces: {
      film: { kind: 'plain', palette: [[0xc9ced6, 1]] }, copper: { kind: 'plain', palette: [[0xc8793a, 1]] }, graphite: { kind: 'plain', palette: [[0x474c55, 1]] },
      sep: { kind: 'plain', palette: [[0xefe9d8, 1]] }, lco: { kind: 'plain', palette: [[0x2d4a86, 1]] }, alu: { kind: 'plain', palette: [[0xcfd4da, 1]] }, board: { kind: 'plain', palette: [[0x1f6f4a, 1]] }, chip: { kind: 'plain', palette: [[0x2a2d35, 1]] } } },
    hotspots: [
      { id: 'hs_layers', node: 'licell_stack', at: [0, cutY, zMid[1]], label: 'The layers: zoom in here', modes: ['cut'], r: .0006 },
      { id: 'hs_sei', node: 'licell_sei', at: [sx + mm(18), mm(20), -dz + M.cu / 2 + M.anode], label: 'On the graphite: the interphase (SEI)', modes: ['pair', 'discharge', 'charge'], r: .0009 },
      { id: 'hs_plating', node: 'licell_plating', at: [sx + mm(18), mm(46), -dz + M.cu / 2 + M.anode], label: 'Where lithium metal can plate', modes: ['pair', 'charge'], r: .0009 },
      { id: 'hs_electrolyte', node: 'licell_electrolyte', at: [mm(22), mm(33), mm(1.5)], label: 'Electrolyte fills the pores', modes: ['pair', 'discharge', 'charge'], r: .0009 },
    ],
    parts: [
      { id: 'pouch', name: 'Pouch', system: 'pouch', node: 'li_cell', color: '#9aa3b0', mesh: 'pouch', lod: 'near', cutFace: 'film', ink_w: .0016, material: 'pouch_laminate' },
      { id: 'seal', name: 'Sealed edge of the pouch', system: 'pouch', node: 'licell_pouch', color: '#aab1ba', mesh: 'seal', lod: 'near', cutFace: 'film', ink_w: .0014, material: 'pouch_laminate' },
      { id: 'cell_far', name: 'Battery', system: 'pouch', node: 'li_cell', color: '#9aa3b0', mesh: 'cell_far', lod: 'far', far_of: 'pouch', material: 'pouch_laminate' },
      { id: 'tab_neg', name: 'Negative tab', system: 'tabs', node: 'licell_tabs', color: '#b9bcc0', mesh: 'tab_neg', lod: 'near', cutFace: 'alu', ink_w: .0012, material: 'cell_tab' },
      { id: 'tab_pos', name: 'Positive tab', system: 'tabs', node: 'licell_tabs', color: '#d6dade', mesh: 'tab_pos', lod: 'near', cutFace: 'alu', ink_w: .0012, material: 'cell_tab' },
      { id: 'pcm_board', name: 'Protection circuit board', system: 'pcm', node: 'licell_pcm', color: '#1f6f4a', mesh: 'pcm_board', lod: 'near', cutFace: 'board', ink_w: .0012, material: 'circuit_copper' },
      { id: 'pcm_ic', name: 'Protection chip', system: 'pcm', node: 'licell_pcm', color: '#2a2d35', mesh: 'pcm_ic', lod: 'near', cutFace: 'chip', ink_w: .001, material: 'chip_silicon' },
      { id: 'pcm_fet', name: 'Two switching transistors', system: 'pcm', node: 'licell_pcm', color: '#30343d', mesh: 'pcm_fet', lod: 'near', cutFace: 'chip', ink_w: .001, material: 'chip_silicon' },
      { id: 'pcm_flex', name: 'Connector to the phone', system: 'pcm', node: 'licell_pcm', color: '#c9a24f', mesh: 'pcm_flex', lod: 'near', cutFace: 'copper', ink_w: .001, material: 'circuit_copper' },
      { id: 'cu', name: 'Copper foil (negative current collector)', system: 'copper', node: 'licell_cu_foil', color: '#c8793a', mesh: 'cu', lod: 'near', cutFace: 'copper', noink: true, material: 'copper' },
      { id: 'anode', name: 'Graphite coating (negative electrode)', system: 'anode', node: 'licell_anode', color: '#474c55', mesh: 'anode', lod: 'near', cutFace: 'graphite', noink: true, deeper: deepAnode },
      { id: 'sep', name: 'Separator', system: 'separator', node: 'licell_separator', color: '#efe9d8', mesh: 'sep', lod: 'near', cutFace: 'sep', noink: true, deeper: deepSep },
      { id: 'cathode', name: 'Lithium cobalt oxide coating (positive electrode)', system: 'cathode', node: 'licell_cathode', color: '#2d4a86', mesh: 'cathode', lod: 'near', cutFace: 'lco', noink: true, deeper: deepCathode },
      { id: 'al', name: 'Aluminium foil (positive current collector)', system: 'aluminium', node: 'licell_al_foil', color: '#cfd4da', mesh: 'al', lod: 'near', cutFace: 'alu', noink: true, material: 'aluminium' },
      { id: 'p_cu', name: 'Copper foil (negative current collector)', system: 'pair', node: 'licell_cu_foil', color: '#c8793a', mesh: 'p_cu', lod: 'near', cutFace: 'copper', ink_w: .0008, material: 'copper' },
      { id: 'p_an', name: 'Graphite coating (negative electrode)', system: 'pair', node: 'licell_anode', color: '#474c55', mesh: 'p_an', lod: 'near', cutFace: 'graphite', ink_w: .0008, deeper: deepAnode },
      { id: 'p_sep', name: 'Separator', system: 'pair', node: 'licell_separator', color: '#efe9d8', mesh: 'p_sep', lod: 'near', cutFace: 'sep', ink_w: .0008, deeper: deepSep },
      { id: 'p_ca', name: 'Lithium cobalt oxide coating (positive electrode)', system: 'pair', node: 'licell_cathode', color: '#2d4a86', mesh: 'p_ca', lod: 'near', cutFace: 'lco', ink_w: .0008, deeper: deepCathode },
      { id: 'p_al', name: 'Aluminium foil (positive current collector)', system: 'pair', node: 'licell_al_foil', color: '#cfd4da', mesh: 'p_al', lod: 'near', cutFace: 'alu', ink_w: .0008, material: 'aluminium' },
      { id: 'wire', name: 'Wire of the outside circuit (schematic)', system: 'circuit', node: 'licell_electrons', color: '#b08850', mesh: 'wire', lod: 'near', cutFace: 'copper', ink_w: .0008, material: 'copper' },
      { id: 'load', name: 'The device being powered, or the charger (schematic)', system: 'circuit', node: 'licell_electrons', color: '#6b7383', mesh: 'load', lod: 'near', ink_w: .001, material: 'schematic_part' },
      { id: 'ions_dis', name: 'Lithium ions (markers)', system: 'flow_dis', node: 'licell_ion_shuttle', color: '#8fd3ff', flow: 'ions_dis', lod: 'near', material: 'lithium_ion_marker' },
      { id: 'e_dis', name: 'Electrons (markers)', system: 'flow_dis', node: 'licell_electrons', color: '#ffd166', flow: 'e_dis', lod: 'near', material: 'electron_marker' },
      { id: 'ions_chg', name: 'Lithium ions (markers)', system: 'flow_chg', node: 'licell_ion_shuttle', color: '#8fd3ff', flow: 'ions_chg', lod: 'near', material: 'lithium_ion_marker' },
      { id: 'e_chg', name: 'Electrons (markers)', system: 'flow_chg', node: 'licell_electrons', color: '#ffd166', flow: 'e_chg', lod: 'near', material: 'electron_marker' },
    ],
    numbers: { layers_um: { copper_foil: um(M.cu), graphite_coating: um(M.anode), separator: um(M.sep), oxide_coating: um(M.cathode), aluminium_foil: um(M.al), pouch_film: um(M.film) }, pairs: M.pairs, stack_mm: +(M.stackT * 1e3).toFixed(3), inside_mm: +((M.T - 2 * M.film) * 1e3).toFixed(3) },
  };
  // what the stack would hold (printed by the bake; quoted on the cards as a calculation)
  const cathVol = M.pairs * 2 * M.sheetW * M.sheetH * M.cathode, lcoG = cathVol * 1e6 * .62 * 5.044;   // 0.62: active volume fraction (Ai2020 set); 5.044 g/cm3: from the unit cell of Hertz et al. 2008 (3 formula units of 97.87 g/mol in 96.655 cubic angstrom)
  console.log(`li_cell: ${M.pairs} pairs, stack ${(M.stackT * 1e3).toFixed(3)} mm of ${((M.T - 2 * M.film) * 1e3).toFixed(3)} mm; coated area ${(M.pairs * 2 * M.sheetW * M.sheetH * 1e4).toFixed(0)} cm2; LiCoO2 ${lcoG.toFixed(1)} g -> ${(lcoG * .135).toFixed(2)} Ah at 135 mAh/g (4.2 V), ${(lcoG * .185).toFixed(2)} Ah at 185 mAh/g (4.5 V)`);
  return { thing, meshes, instances: {}, flows };
}
