// The above- and below-ground plant of perennial ryegrass (Lolium perenne): tillers with sheaths and blades, flowering culms with spikes, roots.
import * as L from '../lib/index.mjs';
import { TAU, basisQuat, place, frameFromAxis, grassBlade, sheath } from './grass_lib.mjs';

// ---- numbers chosen for the model (sources on the cards; "chosen" = a choice within a sourced range) ----
export const M = {
  nTillers: 9, nCulms: 3,
  bladeLen: [0.15, 0.19, 0.11],      // m, older to younger leaf of a tiller; sourced range 5-25 cm (DELTA), chosen inside it
  bladeW: [0.0034, 0.0038, 0.0030],  // m; sourced 2-4 mm (DELTA)
  sheathTop: [0.034, 0.042, 0.048],  // m above the stem base (chosen)
  culmH: 0.50,                       // m; sourced 30-90 cm (DELTA), chosen
  spikeLen: 0.15, nSpikelets: 18, spikeletLen: 0.011, florets: 8, lemmaLen: 0.0060, antherLen: 0.0031,   // sourced: spike 8-25 cm, spikelet 5-20 mm, florets 4-14, lemma 4-8.5 mm, anther 2.9-3.4 mm
  ligule: 0.0015,                    // m; sourced 1-2 mm
  rootDepth: 0.26,
};

export function buildPlant(ctx) {
  const { meshes, instances, R } = ctx, GA = L.GOLDEN_ANGLE;
  const I = k => instances[k] || (instances[k] = new L.Instances(ctx.unit[k]));
  // ---------- one vegetative tiller in its own frame (stem axis = +y, base at 0) ----------
  const acc = { bu: [], bd: [], sh: [], lig: [], aur: [], crown: [], bum: [], bdm: [], shm: [], farb: [] };
  const vegTiller = (sc, az0, young = false) => {
    const o = { bu: [], bd: [], sh: [], lig: [], aur: [], crown: [], bum: [], bdm: [], shm: [], farb: [], tip: [] };
    const nL = young ? 2 : 3;
    for (let k = 0; k < nL; k++) {
      const kk = young ? k + 1 : k, y1 = (young ? [0.012, 0.018][k] : M.sheathTop[k]) * sc, y0 = .002 + .002 * k, r1 = .0032 - .0005 * kk, r0 = r1 * .8, az = az0 + k * Math.PI;
      o.sh.push(sheath({ y0, y1, r0, r1, a0: -(az + Math.PI) + 0.0, wrap: 5.2, rows: 4, seg: 12 })); o.shm.push(sheath({ y0, y1, r0, r1, a0: -az, wrap: 5.2, rows: 2, seg: 8 }));
      const len = (young ? [.05, .03][k] : M.bladeLen[k]) * sc * R.range(.85, 1.1), W = M.bladeW[kk], P0 = [r1 * .6 * Math.cos(az), y1, r1 * .6 * Math.sin(az)];
      const b = grassBlade({ P0, az, tilt0: .1 + .05 * k, tilt1: [1.25, 1.05, .75][kk] + R.range(-.15, .15), len, W, rows: Math.max(6, Math.round(len * 90)), across: 6 });
      o.bu.push(b.up); o.bd.push(b.down);
      const bm = grassBlade({ P0, az, tilt0: .1, tilt1: [1.25, 1.05, .75][kk], len, W, rows: 4, across: 1, ribAmp: 0 }); o.bum.push(bm.up); o.bdm.push(bm.down);
      const bf = grassBlade({ P0, az, tilt0: .1, tilt1: [1.25, 1.05, .75][kk], len, W: W * 1.6, rows: 2, across: 1, ribAmp: 0 }); o.farb.push(bf.up);
      if (!young) {
        o.lig.push(sheath({ y0: y1 - .0004, y1: y1 + M.ligule, r0: r1 * .92, r1: r1 * .95, a0: -(az + Math.PI), wrap: 2.6, rows: 1, seg: 8 }));
        const S = [-Math.sin(az), 0, Math.cos(az)];
        for (const sg of [-1, 1]) { const b0 = L.add(P0, L.mul(S, sg * W * .5)), path = [b0, L.add(b0, [-Math.cos(az) * .0008, .001, -Math.sin(az) * .0008]), L.add(b0, [-Math.cos(az) * .0022, .0016, -Math.sin(az) * .0022])];
          o.aur.push(L.tube(path, t => .00028 * (1 - .8 * t), { sides: 3, caps: false })); }
      }
    }
    return o;
  };
  const addTiller = (sc, lean, phi, base, young) => {
    const az0 = R() * TAU, t = vegTiller(sc, az0, young), ax = [Math.sin(lean) * Math.cos(phi), Math.cos(lean), Math.sin(lean) * Math.sin(phi)], F = frameFromAxis(ax, R() * TAU);
    for (const k of ['bu', 'bd', 'sh', 'lig', 'aur', 'bum', 'bdm', 'shm', 'farb']) for (const m of t[k]) acc[k].push(place(m, base, F.X, F.Y, F.Z));
    return { F, base };
  };
  const tillers = [];
  for (let i = 0; i < M.nTillers; i++) { const a = i * GA + .3, rr = i === 0 ? 0 : .012 + .05 * Math.sqrt((i + .5) / M.nTillers), lean = i === 0 ? .08 : .12 + .22 * (rr / .06), base = [rr * Math.cos(a), 0, rr * Math.sin(a)];
    tillers.push({ ...addTiller(R.range(.8, 1.08), lean, a, base), a, rr }); }
  const daughters = [];   // two young tillers on the rim, emerging from the axils of old leaves
  for (const [a, rr] of [[2.2, .075], [5.1, .082]]) { const base = [rr * Math.cos(a), 0, rr * Math.sin(a)]; addTiller(1, .5, a, base, true); daughters.push(base); }
  meshes.blade_up = L.merge(...acc.bu); meshes.blade_down = L.merge(...acc.bd); meshes.sheaths = L.merge(...acc.sh); meshes.ligules = L.merge(...acc.lig); meshes.auricles = L.merge(...acc.aur);
  meshes.blade_up_mid = L.merge(...acc.bum); meshes.blade_down_mid = L.merge(...acc.bdm); meshes.sheaths_mid = L.merge(...acc.shm); meshes.far_blades = L.merge(...acc.farb);
  // stem bases (crowns): the compressed stem inside the sheaths, with the growing point on top
  const crowns = [], apexI = I('meristems');
  for (const t of tillers) { const F = t.F, y = .014;
    crowns.push(place(L.tube([[0, -.006, 0], [0, .006, 0], [0, y, 0]], q => .0017 * (1 - .15 * q), { sides: 6, caps: true }), t.base, F.X, F.Y, F.Z));
    apexI.add(L.add(t.base, L.mul(F.Y, y)), F.q, 1); }
  meshes.crowns = L.merge(...crowns);
  meshes.meristem = L.lathe([[0, 0], [.0004, .00005], [.00032, .0003], [.0002, .0005], [0, .0006]], { segments: 7, caps: false });
  ctx.unit.meristems = 'meristem';

  // ---------- flowering culms with spikes ----------
  const cul = [], nodeM = [], culBu = [], culBd = [], culSh = [], culLig = [], rach = [], culBum = [], culShm = [];
  const ringM = L.lathe([[.0013, -.0007], [.0019, -.0003], [.0019, .0003], [.0013, .0007]], { segments: 7, caps: false });
  const spikeletData = [];
  for (let c = 0; c < M.nCulms; c++) {
    const t = tillers[c * 2 + 1], H = M.culmH * R.range(.82, 1.05), lean = .05 + .06 * c, F = frameFromAxis([Math.sin(lean) * Math.cos(t.a + c), Math.cos(lean), Math.sin(lean) * Math.sin(t.a + c)], R() * TAU);
    const kb = R.range(.012, .02) / H, wr = p => [p[0] + kb * p[1] * p[1] * H, p[1], p[2]];   // gentle bend in x
    const culmPath = Array.from({ length: 13 }, (_, i) => [0, H * i / 12, 0]);
    const parts = [L.tube(culmPath, q => .0012 - .0005 * q, { sides: 5, caps: false })];
    const nodesY = [.2, .42, .66].map(f => f * H), place2 = m => place(L.transform(m, wr), t.base, F.X, F.Y, F.Z);
    for (const m of parts) cul.push(place2(m));
    nodesY.forEach((ny, k) => { nodeM.push(place2(L.transform(ringM, p => [p[0], p[1] + ny, p[2]]))); });
    nodesY.forEach((ny, k) => {   // culm leaf: a long sheath up the internode and a short blade
      const az = k * Math.PI + c, sh = [.09, .085, .07][k], r = .0017;
      culSh.push(place2(sheath({ y0: ny - .0005, y1: ny + sh, r0: r, r1: r * 1.25, a0: -az, wrap: 5.2, rows: 4, seg: 10 }))); culShm.push(place2(sheath({ y0: ny, y1: ny + sh, r0: r, r1: r * 1.25, a0: -az, wrap: 5.2, rows: 1, seg: 6 })));
      const b = grassBlade({ P0: [r * Math.cos(az) * .8, ny + sh, r * Math.sin(az) * .8], az, tilt0: .3, tilt1: .9, len: [.1, .085, .06][k], W: .0032 * (1 - .12 * k), rows: 8, across: 5 }); culBu.push(place2(b.up)); culBd.push(place2(b.down));
      const bm = grassBlade({ P0: [r * Math.cos(az) * .8, ny + sh, r * Math.sin(az) * .8], az, tilt0: .3, tilt1: .9, len: [.1, .085, .06][k], W: .0032, rows: 3, across: 1, ribAmp: 0 }); culBum.push(place2(bm.up));
      culLig.push(place2(sheath({ y0: ny + sh - .0003, y1: ny + sh + M.ligule, r0: r * 1.2, r1: r * 1.25, a0: -(az + Math.PI), wrap: 2.6, rows: 1, seg: 6 })));
    });
    // spike
    const y0 = H, sl = M.spikeLen * R.range(.9, 1.08), N = M.nSpikelets, sp = sl / N, zig = [];
    for (let i = 0; i <= N; i++) zig.push([(i % 2 ? 1 : -1) * .0003, y0 + i * sp, 0]);
    rach.push(place2(L.tube(zig, q => .00065 * (1 - .4 * q), { sides: 4, caps: true })));
    for (let i = 0; i < N; i++) {
      const side = i % 2 ? 1 : -1, yy = y0 + (i + .4) * sp, al = .34 * (1 - .35 * i / N), shrink = 1 - .6 * Math.pow(i / N, 3);
      const base = [side * .0007, yy, 0], ay = [side * Math.sin(al), Math.cos(al), 0], ax2 = [Math.cos(al) * side, -Math.sin(al), 0], az2 = [0, 0, 1];
      // transform spikelet local frame (X' = outward edge direction, Y' = axis, Z' = thickness) through the culm placement
      const w0 = wr(base), w1 = wr(L.add(base, ay)), dir = L.norm(L.sub(w1, w0)), O = L.add(t.base, L.add(L.mul(F.X, w0[0]), L.add(L.mul(F.Y, w0[1]), L.mul(F.Z, w0[2]))));
      const wd = [0, 1, 2].map(k => F.X[k] * dir[0] + F.Y[k] * dir[1] + F.Z[k] * dir[2]), Zt = [0, 1, 2].map(k => F.Z[k]);   // Z' stays the culm's Z
      const Xp = L.norm(L.cross(wd, Zt)); const Xo = L.mul(Xp, side > 0 ? 1 : 1);
      spikeletData.push({ O, Y: L.norm(wd), Z: Zt, X: L.norm(L.cross(L.norm(wd), Zt)), side, shrink, i, culm: c });
    }
  }
  meshes.culms = L.merge(...cul); meshes.culm_nodes = L.merge(...nodeM); meshes.culm_sheaths = L.merge(...culSh); meshes.culm_blade_up = L.merge(...culBu); meshes.culm_blade_down = L.merge(...culBd); meshes.culm_ligules = L.merge(...culLig); meshes.rachis = L.merge(...rach);
  meshes.culm_blade_mid = L.merge(...culBum); meshes.culm_sheaths_mid = L.merge(...culShm);
  // ---- spikelet pieces (unit meshes, spikelet frame: Y along the spikelet, X across in the broad plane, Z the thin direction) ----
  const LL = M.lemmaLen;
  meshes.lemma = L.blade({ length: LL, halfWidth: t => .00115 * Math.pow(Math.sin(Math.PI * Math.pow(t, .75)), .65), thickness: .00018, nAlong: 6, nAcross: 2, curlAcross: .55, curlAlong: .12, midribBulge: .00005 });
  L.bakeShade(meshes.lemma, p => .72 + .28 * Math.min(1, p[1] / LL));
  meshes.glume = L.blade({ length: .0085, halfWidth: t => .00085 * Math.pow(Math.sin(Math.PI * Math.pow(t, .6)), .8), thickness: .00014, nAlong: 6, nAcross: 1, curlAcross: .25 });
  meshes.spikelet_lens = L.lathe([[0, 0], [.0013, .002], [.0016, .0055], [.0013, .0095], [.0004, .0112], [0, .0115]], { segments: 5, caps: false });
  meshes.anther = L.lathe([[0, 0], [.00018, .00025], [.00026, M.antherLen * .5], [.00018, M.antherLen * .9], [0, M.antherLen]], { segments: 5, caps: false });
  meshes.filament = L.lathe([[.00008, 0], [.00006, 1]], { segments: 3, caps: false });
  meshes.stigma = L.lathe([[.00006, 0], [.00022, .0008], [.00016, .002], [0, .0031]], { segments: 4, caps: false });
  Object.assign(ctx.unit, { lemmas: 'lemma', glumes: 'glume', spikelet_lens: 'spikelet_lens', anthers: 'anther', filaments: 'filament', stigmas: 'stigma' });
  const iL = I('lemmas'), iG = I('glumes'), iS = I('spikelet_lens'), iA = I('anthers'), iF = I('filaments'), iT = I('stigmas'); let nOpen = 0;
  for (const s of spikeletData) {
    const { O, X, Y, Z } = s, sc = s.shrink;
    iS.add(O, basisQuat(X, Y, Z), sc); iG.add(L.add(O, L.mul(X, s.side * 0 + .0012 * (s.side))), basisQuat(Z, Y, X), sc);
    const nF = Math.max(3, Math.round(M.florets * sc));
    for (let j = 0; j < nF; j++) {
      const rank = j % 2 ? 1 : -1, sj = .0035 + j * (LL * .26) * sc, P = L.add(O, L.add(L.mul(Y, sj), L.mul(Z, rank * .0008 * sc)));
      const q = rank > 0 ? basisQuat(L.mul(X, -1), Y, L.mul(Z, -1)) : basisQuat(X, Y, Z);
      iL.add(P, q, sc);
      if (R() < .38 && j > 0) { nOpen++;
        const top = L.add(P, L.add(L.mul(Y, LL * .8 * sc), L.mul(Z, rank * .0007)));
        for (let a = 0; a < 3; a++) { const d = L.norm([R.range(-.5, .5) + (a - 1) * .3, -1, R.range(-.3, .3)]), len = .0035;
          iF.add(top, L.quatFromTo([0, 1, 0], d), len); iA.add(L.add(top, L.mul(d, len)), L.quatFromTo([0, 1, 0], L.norm(L.add(d, [R.range(-.2, .2), 0, 0]))), 1); }
        for (const sg of [-1, 1]) iT.add(L.add(top, L.mul(X, sg * .0005)), L.quatFromTo([0, 1, 0], L.norm(L.add(L.add(L.mul(X, sg * .6), L.mul(Z, rank * .35)), L.mul(Y, .9)))), 1);
      }
    }
  }
  ctx.stats.openFlorets = nOpen; ctx.stats.spikelets = spikeletData.length;
  ctx.unit.lens = 'spikelet_lens'; ctx.spikeTips = spikeletData;

  // ---------- dead leaves at the base ----------
  const dead = [];
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + .4, b = grassBlade({ P0: [.03 * Math.cos(a), .004, .03 * Math.sin(a)], az: a, tilt0: 1.1, tilt1: 1.5, len: R.range(.06, .1), W: .0028, rows: 6, across: 2, ribAmp: 0 }); dead.push(b.up, b.down); }
  meshes.dead_leaves = L.merge(...dead);
  // ---------- daughter tiller marker mesh = merged into daughter parts below ----------
  // ---------- roots ----------
  const roots = [], lats = [], hairsI = I('root_hairs'), tipsI = I('root_tips'); ctx.unit.root_hairs = 'root_hair'; ctx.unit.root_tips = 'root_cap';
  meshes.root_hair = L.lathe([[.00003, 0], [0, .0007]], { segments: 3, caps: false }); meshes.root_cap = L.lathe([[0, -.0007], [.0002, -.0005], [.00032, 0], [.0003, .0007]], { segments: 6, caps: false });
  const rootOf = (base, a0, n) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + i * 1.9 + R(), depth = M.rootDepth * R.range(.35, 1), pts = [[base[0], -.002, base[2]]], hdir = [Math.cos(a), 0, Math.sin(a)];
      let p = pts[0], d = L.norm([hdir[0] * .6, -1, hdir[2] * .6]); const steps = 9, stepL = depth / steps * 1.15;
      for (let s = 0; s < steps; s++) { d = L.norm(L.add(d, L.add(L.mul(R.unitVec(), .22), [0, -.14, 0]))); p = L.add(p, L.mul(d, stepL)); pts.push(p.slice()); }
      roots.push(L.tube(L.spline(pts).sample(18), q => .00042 * (1 - .75 * q) + .00006, { sides: 4, caps: false }));
      tipsI.add(pts[pts.length - 1], L.quatFromTo([0, 1, 0], d), 1);
      for (let k = 0; k < 14; k++) { const u = R.range(.15, .95), b = pts[Math.floor(u * (pts.length - 1))], a2 = R() * TAU, dl = L.norm([Math.cos(a2), -.35, Math.sin(a2)]), len = R.range(.015, .05);
        lats.push(L.tube([b, L.add(b, L.mul(dl, len / 2)), L.add(b, L.mul(dl, len))], q => .00016 * (1 - .6 * q), { sides: 3, caps: false })); tipsI.add(L.add(b, L.mul(dl, len)), L.quatFromTo([0, 1, 0], dl), .5); }
      // root hairs: a fuzzy zone behind the tip of the main root
      const tp = pts[pts.length - 1], tdir = d;
      for (let h = 0; h < 36; h++) { const u = R.range(.004, .02), a2 = R() * TAU, n1 = L.perp(tdir), n2 = L.cross(tdir, n1), out = L.add(L.mul(n1, Math.cos(a2)), L.mul(n2, Math.sin(a2)));
        hairsI.add(L.add(tp, L.add(L.mul(tdir, -u), L.mul(out, .0003))), L.quatFromTo([0, 1, 0], L.norm(L.add(L.mul(out, .9), L.mul(tdir, -.3)))), R.range(.7, 1.2)); }
    }
  };
  tillers.forEach((t, i) => rootOf(t.base, i * 1.1, 5));
  meshes.roots = L.merge(...roots); meshes.lateral_roots = L.merge(...lats);
  meshes.soil = L.lathe([[0, 0], [.3, 0], [.3, -.32], [0, -.32]], { segments: 24, caps: false });
  ctx.tillers = tillers; ctx.daughters = daughters;
}
