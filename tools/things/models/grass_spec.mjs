// Specimens drawn beside the plant: (1) one tiller pulled apart, (2) a stem base cut lengthwise, (3) a leaf blade cut across (magnified), (4) a floret opened.
import * as L from '../lib/index.mjs';
import { TAU, basisQuat, place, grassBlade, sheath, slab, ellipse, rect } from './grass_lib.mjs';
import { M } from './grass_plant.mjs';

export const OX = .32, K = 25;   // specimens stand at x = OX; the leaf cross-section is drawn K times life size
export function buildSpecimens(ctx) {
  const { meshes, R } = ctx, parts = [], hot = [];
  const P = (id, name, system, node, color, o = {}) => parts.push({ id, name, system, node, color, priority: 2, solid: false, noink: true, ...o });
  const mv = (m, d) => L.transform(m, p => [p[0] + d[0], p[1] + d[1], p[2] + d[2]]);
  ctx.systems = [{ id: 'tiller', label: 'Tiller pulled apart' }, { id: 'base', label: 'Growing point cut open' }, { id: 'leafsec', label: 'Leaf blade cut across' }, { id: 'floret', label: 'Floret opened' }];
  ctx.pivots = { tiller: { at: [OX, 0] }, base: { at: [OX, 0] }, leafsec: { at: [OX, 0] }, floret: { at: [OX, 0] } };
  const H = (id, node, at, label, mode, r = .0006) => hot.push({ id, node, at: at.map(v => +v.toFixed(5)), label, r, modes: [mode], pivot: mode });

  // ===== 1. one tiller pulled apart (true size) =====
  { const bu = [], bd = [], shs = [], lig = [], aur = [];
    const leaves = [{ phi: -.9, d: .03, bl: .15, W: M.bladeW[0], top: .034, rad: .0032 }, { phi: 2.2, d: .045, bl: .19, W: M.bladeW[1], top: .042, rad: .0027 }, { phi: 4.0, d: .035, bl: .11, W: M.bladeW[2], top: .048, rad: .0022 }];
    leaves.forEach((lf, k) => {
      const c = [OX + Math.cos(lf.phi) * lf.d, 0, Math.sin(lf.phi) * lf.d], az = lf.phi, e = [Math.cos(az), 0, Math.sin(az)], S = [-Math.sin(az), 0, Math.cos(az)];
      shs.push(mv(sheath({ y0: .002 + .002 * k, y1: lf.top, r0: lf.rad * .8, r1: lf.rad, a0: -(az + Math.PI), wrap: 4.4, rows: 4, seg: 14 }), c));
      const P0 = [lf.rad * .6 * e[0], lf.top, lf.rad * .6 * e[2]], b = grassBlade({ P0, az, tilt0: .1, tilt1: [1.1, .9, .7][k], len: lf.bl, W: lf.W, rows: 14, across: 6 });
      bu.push(mv(b.up, c)); bd.push(mv(b.down, c));
      lig.push(mv(sheath({ y0: lf.top - .0004, y1: lf.top + M.ligule, r0: lf.rad * .92, r1: lf.rad * .95, a0: -(az + Math.PI), wrap: 2.6, rows: 1, seg: 8 }), c));
      for (const sg of [-1, 1]) { const b0 = L.add(P0, L.mul(S, sg * lf.W * .5)); aur.push(mv(L.tube([b0, L.add(b0, [-e[0] * .0008, .001, -e[2] * .0008]), L.add(b0, [-e[0] * .0022, .0016, -e[2] * .0022])], q => .00028 * (1 - .8 * q), { sides: 3, caps: false }), c)); }
      if (k === 1) H('h_lig', 'grass_ligule', L.add(c, [P0[0] - e[0] * .002, lf.top + .001, P0[2] - e[2] * .002]), 'Ligule and auricles: where the blade meets the sheath', 'tiller', .0012);
      if (k === 0) H('h_sheath', 'grass_sheath', L.add(c, [lf.rad * Math.cos(az + 2.9), .02, lf.rad * Math.sin(az + 2.9)]), 'Leaf sheath, opened out', 'tiller', .003);
    });
    meshes.t_sheaths = L.merge(...shs); meshes.t_blade_up = L.merge(...bu); meshes.t_blade_down = L.merge(...bd); meshes.t_ligules = L.merge(...lig); meshes.t_auricles = L.merge(...aur);
    const stem = [L.tube([[OX, -.007, 0], [OX, .007, 0], [OX, .0135, 0]], q => .0018 * (1 - .15 * q), { sides: 7, caps: true })], rings = [];
    for (let i = 0; i < 4; i++) rings.push(mv(L.lathe([[.0018, -.0004], [.0023, -.0002], [.0023, .0002], [.0018, .0004]], { segments: 8, caps: false }), [OX, .002 + .0035 * i, 0]));
    meshes.t_stem = L.merge(...stem, ...rings);
    meshes.t_apex = mv(L.lathe([[0, 0], [.00055, .00008], [.00045, .0004], [.0003, .0007], [0, .0009]], { segments: 8, caps: false }), [OX, .0135, 0]);
    const rt = []; for (let i = 0; i < 5; i++) { const a = i * 1.4; rt.push(L.tube(L.spline([[OX + .0012 * Math.cos(a), -.003, .0012 * Math.sin(a)], [OX + .006 * Math.cos(a), -.025, .006 * Math.sin(a)], [OX + .012 * Math.cos(a + .4), -.07, .012 * Math.sin(a + .4)]]).sample(8), q => .0004 * (1 - .6 * q), { sides: 4, caps: false })); }
    meshes.t_roots = L.merge(...rt);
    P('t_sheaths', 'Leaf sheath (opened)', 'tiller', 'grass_sheath', '#9ec06a', { mesh: 't_sheaths', double: true, pivot: 'tiller' });
    P('t_blade_up', 'Leaf blade, upper surface', 'tiller', 'grass_blade_upper', '#4d8a2e', { mesh: 't_blade_up', pivot: 'tiller' });
    P('t_blade_down', 'Leaf blade, underside', 'tiller', 'grass_blade_under', '#74b04a', { mesh: 't_blade_down', pivot: 'tiller' });
    P('t_ligules', 'Ligule', 'tiller', 'grass_ligule', '#f1efe2', { mesh: 't_ligules', double: true, pivot: 'tiller', priority: 2.3 });
    P('t_auricles', 'Auricles', 'tiller', 'grass_auricle', '#e8e3c8', { mesh: 't_auricles', pivot: 'tiller', priority: 2.3 });
    P('t_stem', 'Stem base with nodes', 'tiller', 'grass_crown', '#c4ab74', { mesh: 't_stem', pivot: 'tiller', priority: 2.1 });
    P('t_apex', 'Growing point (shoot apex)', 'tiller', 'grass_meristem', '#f0c94c', { mesh: 't_apex', pivot: 'tiller', priority: 2.6 });
    P('t_roots', 'Roots from the base of the tiller', 'tiller', 'grass_roots', '#d9c796', { mesh: 't_roots', pivot: 'tiller' });
    H('h_apex', 'grass_meristem', [OX, .0145, 0], 'Growing point: where new leaves begin', 'tiller', .0009);
    H('h_node', 'grass_node', [OX + .0023, .0055, 0], 'Nodes, packed close together at the base', 'tiller', .0008);
  }

  // ===== 2. the base of a tiller cut lengthwise (true size; cut plane z = 0, facing +z) =====
  { const Z = (n) => n * .00012, S = (poly, n, t = .0001) => slab(poly.map(p => [p[0] + OX, p[1]]), Z(n), t), strip = (xa, xb, y0, y1, tilt = 0) => [[xa, y0], [xb, y0], [xb + tilt, y1], [xa + tilt, y1]];
    const st = [], shA = [], shB = [], leafIn = [], gz = [], apex = [], prim = [], rts = [], ndl = [];
    st.push(S(rect(-.0017, -.006, .0017, .0135), 1, .00012));   // the compressed stem
    for (let i = 0; i < 4; i++) ndl.push(S(rect(-.0023, .0017 + .0035 * i, .0023, .0023 + .0035 * i), 2, .00012));
    const tops = [.034, .042, .048], rad = [.0032, .0027, .0022];
    tops.forEach((ty, k) => { const r = rad[k], y0 = .002 + .002 * k; for (const sg of [-1, 1]) shA.push(S(strip(sg > 0 ? r - .00018 : -r, sg > 0 ? r : -r + .00018, y0, ty, sg * (r * .25)), 3 + k, .0001)); });
    for (const sg of [-1, 1]) leafIn.push(S(strip(sg > 0 ? .0012 : -.00135, sg > 0 ? .00135 : -.0012, .0105, .052, -sg * .0011), 6, .0001));   // youngest leaf, folded inside the tube
    gz.push(S(rect(-.0013, .0105, .0013, .0165), 7, .00008));   // the leaf growth zone at the base of that blade (illustrative extent)
    apex.push(S(ellipse(0, .0135, .00055, .0009, 0, 14).filter(p => p[1] >= .0135), 5, .00012));
    for (const sg of [-1, 1]) prim.push(S(strip(sg * .0007 - .00005, sg * .0007 + .00005, .0137, .0165, -sg * .0003), 8, .0001));
    for (const a of [-1, 1]) rts.push(S(strip(a * .0018, a * .0018 + .0004, -.0065, .0025).map(p => p), 4, .0001), S(strip(a * .0024, a * .0028, -.07, -.006, a * .004), 4, .0001));
    meshes.b_stem = L.merge(...st); meshes.b_nodes = L.merge(...ndl); meshes.b_sheaths = L.merge(...shA); meshes.b_leaf_in = L.merge(...leafIn); meshes.b_growth_zone = L.merge(...gz); meshes.b_apex = L.merge(...apex, ...prim); meshes.b_roots = L.merge(...rts);
    for (const m of ['b_stem', 'b_nodes', 'b_sheaths', 'b_leaf_in', 'b_growth_zone', 'b_apex', 'b_roots']) meshes[m] = L.transform(meshes[m], p => p);
    P('b_stem', 'Stem base (cut)', 'base', 'grass_crown', '#e3cf9a', { mesh: 'b_stem', pivot: 'base' });
    P('b_nodes', 'Nodes (cut)', 'base', 'grass_node', '#a88c52', { mesh: 'b_nodes', pivot: 'base', priority: 2.1 });
    P('b_sheaths', 'Leaf sheaths (cut)', 'base', 'grass_sheath', '#8fb85a', { mesh: 'b_sheaths', pivot: 'base', priority: 2.2 });
    P('b_leaf_in', 'Youngest leaf, folded inside (cut)', 'base', 'grass_blade', '#6aa83c', { mesh: 'b_leaf_in', pivot: 'base', priority: 2.3 });
    P('b_growth_zone', 'Leaf growth zone (cut)', 'base', 'grass_growth_zone', '#f2b84a', { mesh: 'b_growth_zone', pivot: 'base', priority: 2.4 });
    P('b_apex', 'Growing point (cut)', 'base', 'grass_meristem', '#f0c94c', { mesh: 'b_apex', pivot: 'base', priority: 2.5, deeper: { type: 'tissue2', id: 'grass_apex', D: 8e-4, button: 'Look inside the growing point' } });
    P('b_roots', 'Roots (cut)', 'base', 'grass_roots', '#d9c796', { mesh: 'b_roots', pivot: 'base' });
    H('h_b_apex', 'grass_meristem', [OX, .0142, .0012], 'Growing point: the shoot apex sits low, inside the sheaths', 'base', .0007);
    H('h_b_gz', 'grass_growth_zone', [OX + .0008, .0125, .0012], 'Leaf growth zone: the blade lengthens from its base', 'base', .0007);
    H('h_b_sheath', 'grass_sheath', [OX + .0031, .03, .0012], 'Sheaths: tubes of older leaves that enclose the younger ones', 'base', .0009);
    H('h_b_blade', 'grass_blade', [OX + .0013, .045, .0012], 'The youngest blade, still folded inside the tube', 'base', .0009);
  }

  // ===== 3. a leaf blade cut across, drawn K times life size (cut plane z = 0 facing +z) =====
  { const hw = .0017 * K, th = .0002 * K, yb = .25, nb = 11, ribA = .00006 * K, N = 120;
    const xs = Array.from({ length: N + 1 }, (_, i) => -hw + 2 * hw * i / N), bundles = Array.from({ length: nb }, (_, i) => -hw * .9 + 1.8 * hw * i / (nb - 1));
    const bot = x => -th / 2 - th * .5 * Math.exp(-((x / (hw * .06)) ** 2));
    const topP = xs.map(x => [x, yb + th / 2 + ribA * (.5 + .5 * Math.cos((x + hw * .9) / (1.8 * hw / (nb - 1)) * TAU))]), botP = xs.map(x => [x, yb + bot(x)]).reverse();
    const Zs = n => n * .0007, SL = (poly, n, t = .0004) => slab(poly.map(p => [p[0] + OX, p[1]]), Zs(n), t);
    meshes.l_body = SL([...botP, ...topP], 1, .0008);
    // epidermis: thin bands along both faces
    const band = (pts, d) => [...pts.map(p => [p[0], p[1]]), ...pts.slice().reverse().map(p => [p[0], p[1] + d])];
    meshes.l_epidermis = L.merge(SL(band(topP, -th * .09), 2), SL(band(botP.slice().reverse(), th * .09).reverse(), 2));
    const bun = [], sheathR = [], xyl = [], scl = [], bul = [], sto = [], sil = [];
    bundles.forEach((x, i) => { const big = i % 3 === 0, a = (big ? .42 : .3) * th, b = a * .85, cy = yb + (big ? .02 : .0) * th;
      sheathR.push(SL(ellipse(x, cy, a * 1.45, b * 1.5, 0, 18), 3)); xyl.push(SL(ellipse(x - a * .15, cy - b * .15, a * .55, b * .5, 0, 12), 4), SL(ellipse(x + a * .25, cy + b * .05, a * .3, b * .3, 0, 10), 4));
      if (big) { scl.push(SL(ellipse(x, cy + b * 1.75, a * 1.0, b * .5, 0, 12), 3), SL(ellipse(x, cy - b * 1.75, a * 1.0, b * .5, 0, 12), 3)); }
      sil.push(SL(ellipse(x, yb + th / 2 - th * .1 + ribA * 1.0, a * .38, b * .32, 0, 8), 5));
      if (i < nb - 1) { const fx = x + (1.8 * hw / (nb - 1)) * .5, fy = yb + th / 2 - th * .02; bul.push(SL(ellipse(fx, fy - th * .09, a * .8, th * .13, 0, 10), 3), SL(ellipse(fx - a * .35, fy - th * .09, a * .4, th * .1, 0, 8), 3)); sto.push(SL(rect(fx - a * .23, yb - th / 2 + th * .01, fx + a * .23, yb - th / 2 + th * .075), 5), SL(rect(fx - a * .23 + a * .35, yb + th / 2 - th * .08, fx + a * .23 + a * .35, yb + th / 2 - th * .01 + ribA * .2), 5)); }
    });
    meshes.l_bundles = L.merge(...xyl); meshes.l_sheaths = L.merge(...sheathR); meshes.l_sclerenchyma = L.merge(...scl); meshes.l_bulliform = L.merge(...bul); meshes.l_stomata = L.merge(...sto); meshes.l_silica = L.merge(...sil);
    P('l_body', 'Mesophyll (leaf blade, cut)', 'leafsec', 'grass_mesophyll', '#8fc060', { mesh: 'l_body', pivot: 'leafsec', priority: 1.6, deeper: { type: 'tissue2', id: 'grass_leaf_section', D: 5.2e-4, button: 'Look inside the leaf blade' } });
    P('l_epidermis', 'Epidermis (cut)', 'leafsec', 'grass_epidermis', '#cfe6a8', { mesh: 'l_epidermis', pivot: 'leafsec', priority: 1.9 });
    P('l_sheaths', 'Bundle sheath (cut)', 'leafsec', 'grass_bundle_sheath', '#4f9a52', { mesh: 'l_sheaths', pivot: 'leafsec', priority: 2.2 });
    P('l_bundles', 'Vascular bundle: xylem and phloem (cut)', 'leafsec', 'grass_bundle', '#e8e0a0', { mesh: 'l_bundles', pivot: 'leafsec', priority: 2.4 });
    P('l_sclerenchyma', 'Sclerenchyma fibres (cut)', 'leafsec', 'grass_sclerenchyma', '#b79b6a', { mesh: 'l_sclerenchyma', pivot: 'leafsec', priority: 2.3 });
    P('l_bulliform', 'Bulliform cells (cut)', 'leafsec', 'grass_bulliform', '#e9f3c9', { mesh: 'l_bulliform', pivot: 'leafsec', priority: 2.3 });
    P('l_stomata', 'Stomata (cut)', 'leafsec', 'grass_stoma', '#2f6b3a', { mesh: 'l_stomata', pivot: 'leafsec', priority: 2.5, deeper: { type: 'tissue2', id: 'grass_stoma_scene', D: 1.5e-4, button: 'Look at a grass stoma from above' } });
    P('l_silica', 'Silica bodies (cut)', 'leafsec', 'grass_silica_body', '#ffffff', { mesh: 'l_silica', pivot: 'leafsec', priority: 2.6 });
    const bx0 = bundles[3], cy0 = yb;
    H('h_l_bundle', 'grass_bundle', [OX + bx0, cy0, Zs(5)], 'Vascular bundle with its sheath of cells', 'leafsec', .004);
    H('h_l_bull', 'grass_bulliform', [OX + bundles[4] - (1.8 * hw / (nb - 1)) * .5, yb + th / 2 - th * .09, Zs(5)], 'Bulliform cells: they lose water and fold the blade', 'leafsec', .004);
    H('h_l_stoma', 'grass_stoma', [OX + bundles[5] - (1.8 * hw / (nb - 1)) * .5 + .0008, yb - th / 2 + th * .04, Zs(6)], 'A stoma: a pore in the epidermis', 'leafsec', .004);
    H('h_l_silica', 'grass_silica_body', [OX + bundles[6], yb + th / 2 + ribA * 1.0 - th * .1, Zs(6)], 'Silica body in the epidermis', 'leafsec', .0035);
    H('h_l_scl', 'grass_sclerenchyma', [OX + bundles[3], yb + th * .26, Zs(5)], 'Fibres that stiffen the blade', 'leafsec', .004);
    ctx.leafsecNote = { K, hw };
  }

  // ===== 4. a floret opened (true size) =====
  { const Y0 = .25, ox = OX;
    const lemma = L.blade({ length: M.lemmaLen, halfWidth: t => .00115 * Math.pow(Math.sin(Math.PI * Math.pow(t, .75)), .65), thickness: .00016, nAlong: 10, nAcross: 3, curlAcross: .6, curlAlong: .1, midribBulge: .00005 });
    const palea = L.blade({ length: M.lemmaLen * .92, halfWidth: t => .00085 * Math.pow(Math.sin(Math.PI * Math.pow(t, .8)), .6), thickness: .00012, nAlong: 8, nAcross: 2, curlAcross: .25 });
    const R3 = (m, O, ang = 0) => L.transform(m, p => [O[0] + p[0] * Math.cos(ang) - p[2] * Math.sin(ang), O[1] + p[1], O[2] + p[0] * Math.sin(ang) + p[2] * Math.cos(ang)]);
    meshes.f_lemma = R3(lemma, [ox - .0045, Y0, .0006]); meshes.f_palea = R3(palea, [ox + .0006, Y0, -.0004], 0);
    meshes.f_lodicules = L.merge(...[-1, 1].map(s => mv(L.lathe([[0, 0], [.0003, .00015], [.0002, .0006], [0, .0008]], { segments: 6, caps: false }), [ox + s * .0006, Y0 + .001, .0012])));
    meshes.f_ovary = mv(L.lathe([[0, 0], [.0006, .0003], [.00075, .0011], [.0005, .0019], [0, .0023]], { segments: 10, caps: false }), [ox, Y0 + .0008, .0]);
    const stg = [], an = [], fl = [];
    for (const s of [-1, 1]) { const o = [ox + s * .0002, Y0 + .0028, 0], d = L.norm([s * .55, 1, .1]); stg.push(L.tube([o, L.add(o, L.mul(d, .0015)), L.add(o, L.add(L.mul(d, .003), [s * .0008, 0, 0]))], q => .00014 * (1 - .6 * q), { sides: 4, caps: false }));
      for (let k = 0; k < 14; k++) { const u = .25 + .75 * k / 14, base = L.add(o, L.add(L.mul(d, .003 * u), [s * .0008 * u * u, 0, 0])), a = k * 1.9; stg.push(L.tube([base, L.add(base, [Math.cos(a) * .0006 + s * .0003, .0003, Math.sin(a) * .0006])], .00003, { sides: 3, caps: false })); } }
    for (let a = 0; a < 3; a++) { const x = ox - .0008 + a * .0009, top = [x + .0006, Y0 + .0045, .0012 * (a - 1)], end = L.add(top, [.0006 * (a - 1), -.0036, .0007 * (a - 1)]);
      fl.push(L.tube([top, L.lerp3(top, end, .5), end], .00007, { sides: 3, caps: false }));
      an.push(L.transform(L.lathe([[0, 0], [.00018, .00025], [.00026, M.antherLen * .5], [.00018, M.antherLen * .9], [0, M.antherLen]], { segments: 6, caps: false }), p => [end[0] + p[0], end[1] - p[1] * 1 + 0, end[2] + p[2]])); }
    meshes.f_stigmas = L.merge(...stg); meshes.f_anthers = L.merge(...an); meshes.f_filaments = L.merge(...fl);
    P('f_lemma', 'Lemma (the outer scale, opened out)', 'floret', 'grass_lemma', '#b3c46a', { mesh: 'f_lemma', pivot: 'floret', double: true });
    P('f_palea', 'Palea (the inner scale)', 'floret', 'grass_palea', '#c9d68a', { mesh: 'f_palea', pivot: 'floret', double: true });
    P('f_lodicules', 'Lodicules', 'floret', 'grass_lodicule', '#f4f1dc', { mesh: 'f_lodicules', pivot: 'floret', double: true, priority: 2.4 });
    P('f_ovary', 'Ovary', 'floret', 'grass_ovary', '#8cb34a', { mesh: 'f_ovary', pivot: 'floret', double: true, priority: 2.4 });
    P('f_stigmas', 'Feathery stigmas', 'floret', 'grass_stigma', '#d9d6e6', { mesh: 'f_stigmas', pivot: 'floret', double: true, priority: 2.4 });
    P('f_filaments', 'Filaments', 'floret', 'grass_filament', '#f0ecc8', { mesh: 'f_filaments', pivot: 'floret', double: true, priority: 2.3 });
    P('f_anthers', 'Anthers', 'floret', 'grass_anther', '#e8d35a', { mesh: 'f_anthers', pivot: 'floret', double: true, priority: 2.5, deeper: { type: 'tissue2', id: 'grass_pollen', D: 4.8e-4, button: 'Look at grass pollen' } });
    H('h_f_ovary', 'grass_ovary', [ox, Y0 + .0015, .0007], 'Ovary: one seed develops here', 'floret', .0005);
    H('h_f_stigma', 'grass_stigma', [ox + .0009, Y0 + .0042, 0], 'Feathery stigmas: they catch pollen from the air', 'floret', .0005);
    H('h_f_anther', 'grass_anther', [ox + .0005, Y0 + .001, .0003], 'Anthers: hang out on thread-like filaments', 'floret', .0006);
    H('h_f_lodicule', 'grass_lodicule', [ox - .0006, Y0 + .0012, .0014], 'Lodicules: swell and push the floret open', 'floret', .0004);
    H('h_f_lemma', 'grass_lemma', [ox - .0045, Y0 + .003, .0012], 'Lemma: the outer scale', 'floret', .0006);
  }
  ctx.parts = parts; ctx.hot = hot;
  const lg = (title, items, note) => ({ title, items, note });
  ctx.legends = {
    tiller: lg('One tiller, pulled apart (life size)', [{ name: 'Sheath (opened out)', color: '#9ec06a', node: 'grass_sheath' }, { name: 'Blade', color: '#4d8a2e', node: 'grass_blade' }, { name: 'Ligule', color: '#f1efe2', node: 'grass_ligule' }, { name: 'Stem base with nodes', color: '#c4ab74', node: 'grass_crown' }, { name: 'Growing point', color: '#f0c94c', node: 'grass_meristem' }], 'Three leaves of one shoot are drawn pulled away from the stem, each with its sheath opened out. Life size. In a real tiller the sheaths stay wrapped round the stem and round each other. Look to the right of the plant.'),
    flower: lg('In flower', [{ name: 'Flowering stem (culm)', color: '#8cae52', node: 'grass_culm' }, { name: 'Spike', color: '#b0c06a', node: 'grass_spike' }, { name: 'Anthers', color: '#e8d35a', node: 'grass_anther' }, { name: 'Stigmas', color: '#d9d6e6', node: 'grass_stigma' }], 'The leaves fade so that the flowering stems stand out. The numbers of spikes, spikelets and open florets are choices within ranges on the cards.'),
  };
  ctx.modes = [
    { id: 'base', label: 'Growing point cut open', pivot: 'base', show: { blades: .1, sheaths: .1, stems: .1, flowers: .05, base: 1 }, hotspots: true, groundSeeThrough: true, legend: lg('The base of a shoot, cut lengthwise (life size)', [{ name: 'Growing point', color: '#f0c94c', node: 'grass_meristem' }, { name: 'Leaf growth zone', color: '#f2b84a', node: 'grass_growth_zone' }, { name: 'Sheaths', color: '#8fb85a', node: 'grass_sheath' }, { name: 'Stem and nodes', color: '#e3cf9a', node: 'grass_crown' }], 'The stem base is about 3 mm wide. Flat coloured faces show the cut. Positions are drawn from the general layout of a vegetative grass shoot; the exact sizes of the zones are illustrative. Look to the right of the plant.') },
    { id: 'leafsec', label: 'Leaf blade cut across', pivot: 'leafsec', show: { blades: .1, sheaths: .1, stems: .1, flowers: .05, leafsec: 1 }, hotspots: true, legend: lg('A leaf blade cut across (drawn 25 times life size)', [{ name: 'Vascular bundle', color: '#e8e0a0', node: 'grass_bundle' }, { name: 'Bundle sheath', color: '#4f9a52', node: 'grass_bundle_sheath' }, { name: 'Bulliform cells', color: '#e9f3c9', node: 'grass_bulliform' }, { name: 'Stoma', color: '#2f6b3a', node: 'grass_stoma' }, { name: 'Silica body', color: '#ffffff', node: 'grass_silica_body' }], 'Drawn 25 times life size: the real blade is about 3 mm wide and a fraction of a millimetre thick. The number of bundles, ribs and the sizes of the cell groups are illustrative, drawn from the general pattern of a temperate grass leaf. Look above and to the right of the plant.') },
    { id: 'floret', label: 'A floret opened', pivot: 'floret', show: { blades: .1, sheaths: .1, stems: .1, flowers: .05, floret: 1 }, hotspots: true, legend: lg('A floret opened out (life size)', [{ name: 'Lemma and palea', color: '#b3c46a', node: 'grass_lemma' }, { name: 'Anthers', color: '#e8d35a', node: 'grass_anther' }, { name: 'Ovary and stigmas', color: '#8cb34a', node: 'grass_ovary' }, { name: 'Lodicules', color: '#f4f1dc', node: 'grass_lodicule' }], 'A floret is about 6 mm long. Its parts are drawn separated so that each can be seen: in a real floret the lemma and palea close over the rest. The shapes are simplified. Look above and to the right of the plant.') },
  ];
}
