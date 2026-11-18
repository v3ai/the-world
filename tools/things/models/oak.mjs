// The English oak (Quercus robur): a mature open-grown park tree, built procedurally from typical measurements.
// Parts: trunk with buttress flare and furrowed bark, branching crown (space colonisation + pipe model), twigs with buds,
// instanced lobed leaves and acorns, a root system with fine roots and mycorrhizal threads, a cut log showing every layer of
// the wood with countable annual rings, flow markers for the water and sugar view, and a cheap far stand-in.
// Everything is a reconstruction from typical values, not a scan of one tree. See data/nodes/park_tree.json for the sourced facts.
import * as L from '../lib/index.mjs';

const TAU = Math.PI * 2, GA = L.GOLDEN_ANGLE;
const SS = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the numbers chosen for the model (stated on the cards) ----
const M = {
  height: 20,            // m; Wikipedia: matures typically up to 20 m, sometimes 40 m
  dbh: 1.0,              // trunk diameter at 1.3 m, m (girth about 3.1 m)
  crownRx: 9.5, crownCy: 12, crownRy: 7.6,   // crown half-width, centre height, half-height
  forkY: 2.7,            // where the limbs begin
  rings: 150,            // annual rings drawn in the cut log
  sapRings: 13,          // sapwood rings (mean 13.3, range 5-32 in a 344-tree study of Q. robur)
  barkT: .030, phloemT: .008, cambT: .005, pith: .006,  // m; bark and phloem typical, cambium drawn thicker than real
  logTop: 1.7, notchY: .75,
};

// ---- trunk radius as a function of angle and height: flare, buttress lobes, vertical furrows ----
const flareR = y => .455 + .31 * Math.exp(-Math.max(y, 0) / .5) - .018 * Math.max(y - 1.3, 0);
function trunkR(th, y, bark = true) {
  const yy = Math.max(y, 0), c = Math.cos(th), s = Math.sin(th);
  const lobe = .5 + .5 * Math.cos(5 * th + .7 + 1.3 * L.noise3(c * 1.3, yy * .3, s * 1.3, 3));
  let r = flareR(y) * (1 + .26 * Math.exp(-yy / .8) * lobe * lobe);
  if (bark) {
    const rr = flareR(y), n = L.fbm(c * rr * 7, yy * 1.1, s * rr * 7, { octaves: 3, seed: 31 });
    r += -.026 * (1 - SS(0, .1, Math.abs(n))) + .007 * L.fbm(c * rr * 22, yy * 4, s * rr * 22, { octaves: 2, seed: 5 });
  }
  return r;
}
const barkShade = (th, y) => { const rr = flareR(y), n = L.fbm(Math.cos(th) * rr * 7, Math.max(y, 0) * 1.1, Math.sin(th) * rr * 7, { octaves: 3, seed: 31 }); return .5 + .5 * SS(0, .1, Math.abs(n)) * (.88 + .24 * L.fbm(th * 9, y * 3, 1, { seed: 8 })); };

// a surface grid over (theta, y): returns a mesh with outward-facing triangles; thetaRanges = [[a,b], ...]
function barkGrid(y0, y1, th0, th1, nth, dy, { bark = true, shade = true } = {}) {
  const m = L.newMesh(), ny = Math.max(1, Math.round((y1 - y0) / dy)), sh = [];
  for (let j = 0; j <= ny; j++) { const y = y0 + (y1 - y0) * j / ny; for (let i = 0; i <= nth; i++) { const th = th0 + (th1 - th0) * i / nth, r = trunkR(th, y, bark); m.pos.push(r * Math.cos(th), y, r * Math.sin(th)); sh.push(shade ? barkShade(th, y) : .8); } }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nth; i++) { const a = j * (nth + 1) + i, b = a + 1, c = a + nth + 2, d = a + nth + 1; m.idx.push(a, b, c, a, c, d); }
  const o = orient(m, (cx, cy, cz) => [cx, 0, cz]); o.shade = sh; return o;
}
// flip triangles so that their normal agrees with a direction function of the centroid
function orient(m, dirFn) {
  const o = { pos: m.pos, idx: [] }, p = m.pos;
  for (let i = 0; i < m.idx.length; i += 3) {
    let [a, b, c] = [m.idx[i], m.idx[i + 1], m.idx[i + 2]];
    const ux = p[b * 3] - p[a * 3], uy = p[b * 3 + 1] - p[a * 3 + 1], uz = p[b * 3 + 2] - p[a * 3 + 2], vx = p[c * 3] - p[a * 3], vy = p[c * 3 + 1] - p[a * 3 + 1], vz = p[c * 3 + 2] - p[a * 3 + 2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], cx = (p[a * 3] + p[b * 3] + p[c * 3]) / 3, cy = (p[a * 3 + 1] + p[b * 3 + 1] + p[c * 3 + 1]) / 3, cz = (p[a * 3 + 2] + p[b * 3 + 2] + p[c * 3 + 2]) / 3;
    const d = dirFn(cx, cy, cz); if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) { const t = b; b = c; c = t; }
    o.idx.push(a, b, c);
  }
  return o;
}
function basisQuat(X, Y, Z) {   // rotation matrix columns X,Y,Z -> quaternion [x,y,z,w]
  const m00 = X[0], m01 = Y[0], m02 = Z[0], m10 = X[1], m11 = Y[1], m12 = Z[1], m20 = X[2], m21 = Y[2], m22 = Z[2], tr = m00 + m11 + m22; let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
  return q;
}

// ---- the layered cut log: bands by radius, relative to the local bark radius ----
function ringWidths(R) {   // 150 widths, pith outwards: wide juvenile rings, narrower and variable later; scaled to sum to R
  const r = L.rng(404), w = [];
  for (let i = 0; i < M.rings; i++) { const t = i / (M.rings - 1); w.push((1.45 - .8 * t) * (.55 + .9 * r()) * (1 + .25 * Math.sin(i * .37))); }
  const s = w.reduce((a, b) => a + b, 0); return w.map(v => v * R / s);
}
// geometry of one band between two radius functions across a sector or a vertical wall
// sector at height y: theta range, rIn(th), rOut(th); shade(r) optional
function sectorBand(y, th0, th1, rIn, rOut, nth, shadeFn, up = true) {
  const m = L.newMesh(), sh = [];
  for (let i = 0; i <= nth; i++) { const th = th0 + (th1 - th0) * i / nth, a = rIn(th), b = rOut(th); for (const r of [a, b]) { m.pos.push(r * Math.cos(th), y, r * Math.sin(th)); sh.push(shadeFn ? shadeFn(th, r) : 1); } }
  for (let i = 0; i < nth; i++) { const a = i * 2; m.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const o = orient(m, () => [0, up ? 1 : -1, 0]); o.shade = sh; return o;
}
// vertical wall at angle th through the axis: rows in y, band between radius functions of the local bark radius
function wallBand(th, y0, y1, rIn, rOut, normal, shadeFn) {
  const m = L.newMesh(), sh = [], ny = Math.max(1, Math.round((y1 - y0) / .02)), c = Math.cos(th), s = Math.sin(th);
  for (let j = 0; j <= ny; j++) { const y = y0 + (y1 - y0) * j / ny, Rb = trunkR(th, y); for (const r of [rIn(Rb), rOut(Rb)]) { m.pos.push(r * c, y, r * s); sh.push(shadeFn ? shadeFn(y, r, Rb) : 1); } }
  for (let j = 0; j < ny; j++) { const a = j * 2; m.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const o = orient(m, () => normal); o.shade = sh; return o;
}

export default function build() {
  const R = L.rng(2026), meshes = {}, instances = {};
  const inst = (key, meshKey) => instances[key] = new L.Instances(meshKey);

  // ================= trunk (whole tree view) =================
  const trunk = barkGrid(-.35, 3.7, 0, TAU, 220, .03);
  { // close the top with a fan to an apex that sits inside the limbs
    const apex = trunk.pos.length / 3, base = apex - 221; trunk.pos.push(0, 3.95, 0); trunk.shade.push(.5);
    for (let i = 0; i < 220; i++) trunk.idx.push(base + i + 1, base + i, apex);
  }
  meshes.trunk = trunk;

  // ================= crown skeleton =================
  const attr = [];
  while (attr.length < 800) {
    const p = [R.range(-1, 1) * M.crownRx, M.crownCy + R.range(-1, 1) * M.crownRy, R.range(-1, 1) * M.crownRx];
    const e = Math.hypot(p[0] / M.crownRx, (p[1] - M.crownCy) / M.crownRy, p[2] / M.crownRx); if (e > 1) continue;
    // hollow-ish crown: the interior near the axis is left to the main limbs
    if (Math.hypot(p[0], p[2]) < 1.6 && p[1] < 14) continue;
    attr.push(p);
  }
  // a thick low spreading limb or two: oaks in the open keep big lower limbs
  const sk = L.spaceColonize({ attractors: attr, root: [0, M.forkY, 0], step: .9, influence: 4.4, kill: 1.1, maxIter: 110, rand: R, bias: [0, 1, 0], biasWeight: .12 });
  L.pipeRadii(sk, .01, 2);
  const tips = sk.map((n, i) => i).filter(i => !sk[i].children.length);
  { const f = flareR(M.forkY) * .98 / sk[0].radius; for (const n of sk) n.radius = Math.max(.012, n.radius * f); for (const i of tips) sk[i].radius = .011; }
  const branches = L.treeToMesh(sk, { sides: 7, smoothSteps: 2 });
  L.bakeShade(branches, (p, n) => .72 + .28 * L.fbm(p[0] * 6, p[1] * 3, p[2] * 6, { seed: 12 }) + .1 * n[1]);
  meshes.branches = branches;

  // ================= twigs, buds, leaves, acorns =================
  // leaf: obovate outline with four pairs of rounded lobes cut no deeper than halfway to the midrib, a pair of small basal lobes, short stalk
  const LEAF_LEN = .105, LEAF_W = .037, NSEG = 7;
  const lobeW = t => { const env = Math.pow(Math.max(t, 0), .85) * Math.pow(1 - t, .55) / (Math.pow(.85 / 1.4, .85) * Math.pow(.55 / 1.4, .55)); const lobes = .5 + .5 * (.5 + .5 * Math.cos(TAU * 4 * (t - .02))); const aur = .22 * Math.exp(-Math.pow((t - .06) / .05, 2)); return LEAF_W * (env * lobes * (t < .04 ? t / .04 : 1) + aur); };
  const leaf = L.newMesh();
  for (let i = 0; i <= NSEG; i++) { const t = i / NSEG, y = .004 + t * LEAF_LEN, w = lobeW(t), droop = -.018 * t * t, ridge = .006 * w / LEAF_W; leaf.pos.push(0, y, droop + ridge * .3, -w, y, droop + ridge, w, y, droop + ridge); }
  for (let i = 0; i < NSEG; i++) { const a = i * 3, b = a + 3; leaf.idx.push(a, a + 1, b + 1, a, b + 1, b, a, b + 2, a + 2, a, b, b + 2); }
  meshes.leaf = leaf;
  // acorn nut and cup
  meshes.nut = L.lathe([[0, 0], [.0035, .0012], [.0075, .005], [.0088, .011], [.0075, .018], [.004, .0225], [0, .0245]], { segments: 9, caps: false });
  meshes.cup = L.lathe([[.0052, .0125], [.0096, .0135], [.0105, .017], [.0098, .0215], [.0075, .0228], [.0062, .0216], [.0058, .0145]], { segments: 9, caps: false });
  meshes.bud = L.lathe([[0, 0], [.0026, .0035], [0, .0098]], { segments: 4, caps: false });

  const twigMeshes = [], leaves = inst('leaves', 'leaf'), nuts = inst('nuts', 'nut'), cups = inst('cups', 'cup'), buds = inst('buds', 'bud');
  const sprigPts = [], upV = [0, 1, 0], clumpPts = [];
  const place = (list, p, X, Y, Z, s = 1) => list.add(p, basisQuat(X, Y, Z), s);
  const cand = sk.map((n, i) => i).filter(i => sk[i].radius < .1 && sk[i].p[1] > 4.2);
  for (const ni of cand) {
    const n = sk[ni], isTip = !n.children.length, k = isTip ? 3 : (R() < .5 ? 1 : 0);
    const par = n.parent >= 0 ? sk[n.parent].p : [n.p[0], n.p[1] - 1, n.p[2]];
    const dir0 = L.norm(L.sub(n.p, par));
    for (let s = 0; s < k; s++) {
      let d = L.norm(L.add(L.add(L.mul(dir0, .8), L.mul(R.unitVec(), .9)), [n.p[0] * .02, .15, n.p[2] * .02]));
      const len = R.range(.3, .5), pts = [n.p], seg = 4;
      for (let q = 1; q <= seg; q++) { d = L.norm(L.add(d, L.mul(R.unitVec(), .2))); d[1] += .05; d = L.norm(d); pts.push(L.add(pts[q - 1], L.mul(d, len / seg))); }
      const sp = L.spline(pts); twigMeshes.push(L.tube(sp.sample(8), t => .0045 * (1 - .6 * t) + .0015, { sides: 4, caps: false }));
      const tipP = pts[seg]; sprigPts.push(tipP); clumpPts.push(tipP);
      // buds: a terminal bud with a few clustered round it (oak buds sit in clusters at the shoot tip)
      const dEnd = L.norm(L.sub(pts[seg], pts[seg - 1])), px = L.perp(dEnd), py = L.cross(dEnd, px);
      place(buds, tipP, px, dEnd, py, 1.3);
      for (let b = 0; b < 1; b++) { const a = b / 2 * TAU + R(); const dd = L.norm(L.add(dEnd, L.add(L.mul(px, Math.cos(a) * .7), L.mul(py, Math.sin(a) * .7)))); const X = L.perp(dd), Z = L.cross(dd, X); place(buds, L.add(tipP, L.mul(dEnd, -.004)), X, dd, Z, .9); }
      // leaves: a spiral of about 7 round the last 60% of the sprig, the outer ones largest
      const nl = R.int(4, 6);
      for (let q = 0; q < nl; q++) {
        const t = .4 + .6 * q / nl, at = sp(Math.min(.999, t)), ang = q * GA + R(), pn = L.perp(dEnd), pb = L.cross(dEnd, pn);
        const out = L.add(L.mul(pn, Math.cos(ang)), L.mul(pb, Math.sin(ang)));
        let ld = L.norm(L.add(L.add(L.mul(out, 1), L.mul(dEnd, .75)), [0, -.25, 0]));
        const Z0 = L.norm(L.sub(upV, L.mul(ld, L.dot(upV, ld)))); const X = L.norm(L.cross(ld, Z0)), Z = L.cross(X, ld);
        place(leaves, at, X, ld, Z, R.range(.85, 1.12));
      }
      if (R() < .09) { // acorns: 1-3 on a short stalk, hanging
        const na = R.int(1, 3); for (let q = 0; q < na; q++) {
          const at = L.add(sp(.7), [R.range(-.03, .03), -.035 - q * .004, R.range(-.03, .03)]), d = L.norm([R.range(-.4, .4), -1, R.range(-.4, .4)]);
          const X = L.perp(d), Z = L.cross(d, X); place(nuts, at, X, d, Z, 1); place(cups, at, X, d, Z, 1);
        }
      }
    }
  }
  meshes.twigs = L.bakeShade(L.merge(...twigMeshes), (p) => .75 + .25 * L.fbm(p[0] * 9, p[1] * 9, p[2] * 9, { seed: 2 }));

  // ================= far stand-in: simplified trunk, main limbs, clumps of foliage =================
  const farTrunk = barkGrid(-.2, 3.4, 0, TAU, 16, .6, { bark: false, shade: false }); L.bakeShade(farTrunk, (p, n) => .75 + .2 * n[1]);
  { const keep = new Map(), sub = []; sk.forEach((n, i) => { if (n.radius >= .075 || i === 0) { keep.set(i, sub.length); sub.push({ p: n.p, parent: -1, children: [], radius: n.radius }); } }); sk.forEach((n, i) => { if (!keep.has(i)) return; let pa = n.parent; while (pa >= 0 && !keep.has(pa)) pa = sk[pa].parent; if (pa >= 0) { sub[keep.get(i)].parent = keep.get(pa); sub[keep.get(pa)].children.push(keep.get(i)); } }); meshes.far_limbs = L.bakeShade(L.treeToMesh(sub, { sides: 5, smoothSteps: 0 }), (p, n) => .8 + .2 * n[1]); }
  // clumps: grid the sprig tips and put a lumpy blob where leaves are dense
  const cell = 1.45, grid = new Map();
  for (const p of clumpPts) { const k = [Math.floor(p[0] / cell), Math.floor(p[1] / cell), Math.floor(p[2] / cell)].join(','); const g = grid.get(k) || { s: [0, 0, 0], n: 0 }; g.s = L.add(g.s, p); g.n++; grid.set(k, g); }
  const blob = L.bakeShade(L.transform(L.lathe(Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + Math.PI * i / 4; return [Math.max(0, Math.cos(a)), Math.sin(a)]; }), { segments: 7, caps: false }), p => { const j = 1 + .22 * L.noise3(p[0] * 2.1, p[1] * 2.1, p[2] * 2.1, 4); return [p[0] * j, p[1] * j * .75, p[2] * j]; }), (p, n) => .62 + .38 * (.5 + .5 * n[1]));
  meshes.blob = blob;
  const clumps = inst('clumps', 'blob'); let nCl = 0;
  for (const [, g] of grid) { if (g.n < 2) continue; const c = L.mul(g.s, 1 / g.n); clumps.add([c[0], c[1] + .15, c[2]], L.quatAxisAngle([0, 1, 0], R.range(0, TAU)), R.range(1.1, 1.4) * Math.min(1.7, .75 + g.n * .04)); nCl++; }

  // ================= roots =================
  const rattr = [];
  while (rattr.length < 520) { const a = R.range(0, TAU), d = 9 * Math.pow(R(), .6), y = -(.25 + 2.3 * Math.pow(R(), 1.7)); if (Math.hypot(d, y * 2) > 11) continue; rattr.push([Math.cos(a) * d, y, Math.sin(a) * d]); }
  const rs = L.spaceColonize({ attractors: rattr, root: [0, -.1, 0], step: .5, influence: 3.4, kill: .6, maxIter: 90, rand: R, bias: [0, -1, 0], biasWeight: .05 });
  L.pipeRadii(rs, .01, 2);
  const rtips = rs.map((n, i) => i).filter(i => !rs[i].children.length);
  { const f = .62 / rs[0].radius; for (const n of rs) n.radius = Math.max(.01, n.radius * f * .75); for (const i of rtips) rs[i].radius = .008; }
  meshes.roots = L.bakeShade(L.treeToMesh(rs, { sides: 6, smoothSteps: 2 }), (p, n) => .7 + .3 * L.fbm(p[0] * 5, p[1] * 5, p[2] * 5, { seed: 6 }));
  // fine roots and mycorrhizal threads grow from the tips and along thin roots
  const fine = [], myc = [], mycTip = [];
  for (const i of rs.map((n, j) => j).filter(j => rs[j].radius < .04)) {
    const n = rs[i], isTip = !n.children.length, k = isTip ? 4 : (R() < .5 ? 1 : 0);
    for (let q = 0; q < k && fine.length < 1100; q++) {
      let d = L.norm(L.add(R.unitVec(), [0, -.2, 0])), p = n.p; const pts = [p];
      for (let s = 0; s < 4; s++) { d = L.norm(L.add(d, L.mul(R.unitVec(), .35))); p = L.add(p, L.mul(d, R.range(.04, .08))); pts.push(p); }
      fine.push(L.tube(pts, t => .0016 * (1 - .7 * t) + .0004, { sides: 4, caps: false })); mycTip.push(pts[4]);
      if (R() < .75) for (let h = 0; h < 3; h++) { const a = L.norm(L.add(d, R.unitVec())); const e = L.add(pts[R.int(2, 4)], L.mul(a, R.range(.03, .09))); myc.push(L.tube([pts[3], L.add(L.lerp3(pts[3], e, .5), L.mul(R.unitVec(), .01)), e], .0005, { sides: 3, caps: false })); }
    }
  }
  meshes.fine_roots = L.bakeShade(L.merge(...fine), () => .85);
  meshes.hyphae = L.merge(...myc.slice(0, 1400));
  // soil block (translucent in the Roots view)
  meshes.soil = L.lathe([[0, 0], [10.5, 0], [10.5, -3.4], [0, -3.4]], { segments: 36, caps: false });

  // ================= the cut log: every layer of the wood =================
  const th0 = Math.PI / 4, thN0 = th0 + Math.PI / 2;           // the notch spans th0..thN0 (a quarter), centred on +z
  const bandR = Rb => { const o = Rb - M.barkT, p = o - M.phloemT, c = p - M.cambT; return { bark: [o, Rb], phloem: [p, o], cambium: [c, p], wood: [M.pith, c] }; };
  const wTotal = .405;   // radius of the wood at the log (from pith to cambium)
  const w = ringWidths(wTotal - M.pith), edges = [M.pith]; w.forEach(x => edges.push(edges[edges.length - 1] + x));   // radii of ring boundaries from pith
  const sapW = w.slice(-M.sapRings).reduce((a, b) => a + b, 0), heartOuter = wTotal - sapW;
  const eb = edges.map(v => v);   // ring boundaries measured from the pith, absolute radius = boundary (edges already start at the pith)
  const merged = list => { const m = L.merge(...list); m.shade = [].concat(...list.map(x => x.shade)); return m; };
  const ringStripsSector = (y, a, b, rIn, rOut, up) => { const n = Math.max(3, Math.round((b - a) / TAU * 48)), list = []; for (let i = 0; i < M.rings; i++) { const e0 = eb[i], e1 = eb[i + 1], mid = e0 + (e1 - e0) * .58; for (const [r0, r1, s] of [[e0, mid, 1], [mid, e1, .66]]) { const lo = Math.max(r0, rIn), hi = Math.min(r1, rOut); if (hi - lo < 1e-6) continue; list.push(sectorBand(y, a, b, () => lo, () => hi, n, () => s, up)); } } return merged(list); };
  const ringStripsWall = (th, y0, y1, rIn, rOut, normal) => { const list = []; for (let i = 0; i < M.rings; i++) { const e0 = eb[i], e1 = eb[i + 1], mid = e0 + (e1 - e0) * .58; for (const [r0, r1, s] of [[e0, mid, 1], [mid, e1, .66]]) { const lo = Math.max(r0, rIn), hi = Math.min(r1, rOut); if (hi - lo < 1e-6) continue; list.push(wallBand(th, y0, y1, () => lo, () => hi, normal, () => s)); } } return merged(list); };
  const wallNormA = [-Math.sin(th0), 0, Math.cos(th0)], wallNormB = [Math.sin(thN0), 0, -Math.cos(thN0)];
  const layerFaces = (rIn, rOut, shaded) => {   // fixed-radius layers (wood, pith)
    const list = [];
    const sec = (y, a, b, up) => shaded ? list.push(ringStripsSector(y, a, b, rIn, rOut, up)) : list.push(sectorBand(y, a, b, () => rIn, () => rOut, Math.max(3, Math.round((b - a) / TAU * 48)), () => 1, up));
    sec(M.notchY, th0, thN0, true); sec(M.logTop, thN0, th0 + TAU, true);
    list.push(shaded ? ringStripsWall(th0, M.notchY, M.logTop, rIn, rOut, wallNormA) : wallBand(th0, M.notchY, M.logTop, () => rIn, () => rOut, wallNormA, () => 1));
    list.push(shaded ? ringStripsWall(thN0, M.notchY, M.logTop, rIn, rOut, wallNormB) : wallBand(thN0, M.notchY, M.logTop, () => rIn, () => rOut, wallNormB, () => 1));
    return merged(list);
  };
  const relFaces = (key, shade) => {   // layers measured from the bark surface (bark, phloem, cambium): vary with the local bark radius
    const list = [], pick = Rb => bandR(Rb)[key], f = th => pick(trunkR(th, 0)), nSec = 120;
    const sec = (y, a, b, up) => list.push(sectorBand(y, a, b, th => pick(trunkR(th, y))[0], th => pick(trunkR(th, y))[1], Math.round((b - a) / TAU * nSec), () => shade, up));
    sec(M.notchY, th0, thN0, true); sec(M.logTop, thN0, th0 + TAU, true);
    list.push(wallBand(th0, M.notchY, M.logTop, Rb => pick(Rb)[0], Rb => pick(Rb)[1], wallNormA, () => shade));
    list.push(wallBand(thN0, M.notchY, M.logTop, Rb => pick(Rb)[0], Rb => pick(Rb)[1], wallNormB, () => shade));
    return merged(list);
  };
  // the cut log's outer surface: full circle below the notch, three quarters above
  const surfLow = barkGrid(-.35, M.notchY, 0, TAU, 220, .03), surfHi = barkGrid(M.notchY, M.logTop, thN0, th0 + TAU, 165, .03);
  const logBark = merged([surfLow, surfHi, relFaces('bark', .55)]);
  meshes.log_bark = logBark;
  meshes.log_phloem = relFaces('phloem', 1);
  meshes.log_cambium = relFaces('cambium', 1);
  meshes.log_sapwood = layerFaces(heartOuter, wTotal, true);
  meshes.log_heartwood = layerFaces(M.pith, heartOuter, true);
  meshes.log_pith = layerFaces(0, M.pith, false);
  // rays: thin pale radial strips lying on the transverse faces
  const rays = []; { const rr = L.rng(77); for (let i = 0; i < 70; i++) { const a = rr.range(thN0 + .02, th0 + TAU - .02), r0 = rr.range(.04, .3), r1 = Math.min(wTotal, r0 + rr.range(.04, .12)), hw = .0006; const m = L.newMesh(), c = Math.cos(a), s = Math.sin(a); m.pos.push(r0 * c - s * hw, M.logTop + .0006, r0 * s + c * hw, r0 * c + s * hw, M.logTop + .0006, r0 * s - c * hw, r1 * c + s * hw, M.logTop + .0006, r1 * s - c * hw, r1 * c - s * hw, M.logTop + .0006, r1 * s + c * hw); m.idx.push(0, 1, 2, 0, 2, 3); rays.push(orient(m, () => [0, 1, 0])); }
    for (let i = 0; i < 60; i++) { const a = rr() < .5 ? th0 : thN0, y = rr.range(M.notchY + .03, M.logTop - .03), r0 = rr.range(.04, wTotal - .06), l = rr.range(.012, .035), nrm = a === th0 ? wallNormA : wallNormB, c = Math.cos(a), s = Math.sin(a), e = .0006, m = L.newMesh(), hh = .0013; m.pos.push(r0 * c + nrm[0] * e, y - hh, r0 * s + nrm[2] * e, (r0 + l) * c + nrm[0] * e, y - hh, (r0 + l) * s + nrm[2] * e, (r0 + l) * c + nrm[0] * e, y + hh, (r0 + l) * s + nrm[2] * e, r0 * c + nrm[0] * e, y + hh, r0 * s + nrm[2] * e); m.idx.push(0, 1, 2, 0, 2, 3); rays.push(orient(m, () => nrm)); } }
  meshes.log_rays = L.merge(...rays);

  // ================= flow markers (water up the xylem, sugar down the phloem) =================
  const parentChain = (nodes, i) => { const c = []; for (; i >= 0; i = nodes[i].parent) c.push(i); return c.reverse(); };   // root ... i
  const paths = [], markers = [];
  const tipSel = tips.filter((_, i) => i % Math.max(1, Math.floor(tips.length / 56)) === 0).slice(0, 56);
  tipSel.forEach((ti, k) => {
    const rt = rtips[(k * 7) % rtips.length], rc = parentChain(rs, rt).reverse(), cc = parentChain(sk, ti);
    const pts = [], rad = [];
    for (const i of rc) { pts.push(rs[i].p); rad.push(rs[i].radius); }
    for (let y = .1; y < M.forkY; y += .45) { pts.push([0, y, 0]); rad.push(flareR(y)); }
    for (const i of cc) { pts.push(sk[i].p); rad.push(sk[i].radius); }
    paths.push({ p: pts.map(p => p.map(v => Math.round(v * 1e3) / 1e3)).flat(), r: rad.map(v => Math.round(v * 1e4) / 1e4) });
  });
  const flows = { water: { mesh: 'drop', dir: 1, speed: .9, ring: .45, paths, markers: [] }, sugar: { mesh: 'drop', dir: -1, speed: .28, ring: .9, paths, markers: [] } };
  for (let k = 0; k < paths.length; k++) for (let j = 0; j < 10; j++) { flows.water.markers.push([k, Math.round(R() * 1e3) / 1e3, Math.round(R() * 628) / 100]); }
  for (let k = 0; k < paths.length; k++) for (let j = 0; j < 7; j++) { flows.sugar.markers.push([k, Math.round(R() * 1e3) / 1e3, Math.round(R() * 628) / 100]); }
  meshes.drop = L.lathe([[0, -.02], [.014, 0], [.011, .02], [0, .05]], { segments: 6, caps: false });

  // ================= thing description =================
  const thing = {
    id: 'oak', label_first_only: true, title: 'English oak', label: 'English oak', scientific: 'Quercus robur', node: 'oak_english', main_part: 'trunk',
    blurb: 'A mature English oak. Click the trunk, a branch, a leaf or an acorn. Use the layer buttons for the wood, the roots, and the water and sugar flow.',
    model_note: 'A model built from typical measurements of the species, not a scan of one individual. It has about ' + (Math.round(leaves.count / 500) * 500).toLocaleString('en') + ' leaves; a real oak this size carries many times more.',
    size_m: { height: M.height, crown_width: M.crownRx * 2, trunk_diameter: M.dbh }, height_m: M.height, radius_m: 12, draw_m: 700,
    seed: 2026,
    systems: [{ id: 'trunk', label: 'Trunk' }, { id: 'branches', label: 'Branches' }, { id: 'twigs', label: 'Twigs' }, { id: 'leaves', label: 'Leaves' }, { id: 'acorns', label: 'Acorns' }, { id: 'roots', label: 'Roots' }, { id: 'soil', label: 'Soil' }, { id: 'wood', label: 'Wood' }, { id: 'flow', label: 'Flow' }, { id: 'crown_far', label: 'Distant crown' }],
    auto: { label: 'Auto', near_m: 40, near: 'whole', far: 'whole' },
    lod: { near_m: 32 },
    shadow: { radius_m: 12, opacity: .9 },
    modes: [
      { id: 'whole', label: 'Whole tree', show: { trunk: 1, branches: 1, twigs: 1, leaves: 1, acorns: 1, crown_far: 1 } },
      { id: 'wood', label: 'Wood', pivot: 'wood', show: { wood: 1, trunk: 0 }, hotspots: true, legend: { title: 'Layers of the wood', items: [{ name: 'Outer bark', color: '#6b5f52', node: 'oak_bark' }, { name: 'Inner bark (phloem)', color: '#d8c79a', node: 'oak_phloem' }, { name: 'Vascular cambium', color: '#9bbf5c', node: 'oak_cambium' }, { name: 'Sapwood', color: '#d9b878', node: 'oak_sapwood' }, { name: 'Heartwood', color: '#a8703c', node: 'oak_heartwood' }, { name: 'Pith', color: '#5a3c22', node: 'oak_pith_rays' }], note: 'A log cut open. About 150 rings are drawn, one for each year of the model tree. The cambium and phloem are drawn thicker than they really are, so you can see them.' } },
      { id: 'roots', label: 'Roots', show: { roots: 1, soil: 1, trunk: 1, branches: .12, twigs: .1, leaves: .08 }, groundSeeThrough: true, hotspots: true, legend: { title: 'Underground', items: [{ name: 'Structural roots', color: '#7a5a3a', node: 'oak_roots' }, { name: 'Fine roots and root hairs', color: '#c9b389', node: 'oak_root_hairs' }, { name: 'Fungal threads (mycorrhiza)', color: '#f2efe6', node: 'oak_mycorrhiza' }], note: 'The soil is drawn see-through. The root system is a schematic: real oak roots reach differently on every soil, and fine roots are far more numerous than shown.' } },
      { id: 'flow', label: 'Water and sugar', show: { trunk: .2, branches: .2, twigs: .2, leaves: .16, roots: .2, flow: 1 }, flowOn: true, legend: { title: 'Two one-way streets', items: [{ name: 'Water and minerals, rising in the xylem', color: '#4aa3df', node: 'bio_water_transport' }, { name: 'Sugar solution, moving through the phloem', color: '#e0a526', node: 'bio_phloem_transport' }], note: 'A diagram of flow, not to scale in speed: the markers move much faster than real sap, and the real flows are carried in cells far too small to see here.' } },
    ],
    hotspots: [
      { id: 'hs_rings', node: 'oak_growth_rings', at: [.08, M.logTop, -.18], label: 'Count the rings', r: .03, modes: ['wood'] },
      { id: 'hs_cambium', node: 'oak_cambium', at: [Math.cos(th0 + .12) * (trunkR(th0 + .12, M.logTop) - M.barkT - M.phloemT - .003), M.logTop, Math.sin(th0 + .12) * (trunkR(th0 + .12, M.logTop) - M.barkT - M.phloemT - .003)], label: 'Cambium: where the tree grows wider', r: .025, modes: ['wood'] },
      { id: 'hs_roottip', node: 'oak_root_hairs', at: rs[rtips[3]].p.map(v => +v.toFixed(2)), label: 'Root tip with root hairs', r: .12, modes: ['roots'] },
      { id: 'hs_myc', node: 'oak_mycorrhiza', at: rs[rtips[9]].p.map(v => +v.toFixed(2)), label: 'Fungal partner', r: .12, modes: ['roots'] },
    ],
    parts: [
      { id: 'trunk', name: 'Trunk', system: 'trunk', node: 'oak_trunk', color: '#7a6d5e', mesh: 'trunk', lod: 'near', ink_w: .0016, priority: 1.4, solid: false },
      { id: 'branches', name: 'Branches', system: 'branches', node: 'oak_branches', color: '#6a5d4f', mesh: 'branches', lod: 'near', ink_w: .0014, priority: 1.5, solid: false },
      { id: 'twigs', name: 'Twigs', system: 'twigs', node: 'oak_twigs_buds', color: '#6e5d49', mesh: 'twigs', lod: 'near', noink: true, priority: 1.6, solid: false },
      { id: 'buds', name: 'Buds', system: 'twigs', node: 'oak_twigs_buds', color: '#8a6a3c', instances: 'buds', lod: 'near', priority: 1.7 },
      { id: 'leaves', name: 'Leaves', system: 'leaves', node: 'oak_leaf', color: '#4f8a2e', instances: 'leaves', tint: .34, double: true, lod: 'near', priority: 1.9, deeper: { type: 'tissue2', id: 'leaf_section', D: 2.6e-4, button: 'Look inside the leaf' } },
      { id: 'acorn_nuts', name: 'Acorn', system: 'acorns', node: 'oak_acorn', color: '#a98a4a', instances: 'nuts', tint: .2, double: true, lod: 'near', priority: 1.9 },
      { id: 'acorn_cups', name: 'Acorn cup', system: 'acorns', node: 'oak_acorn', color: '#6f5a35', instances: 'cups', tint: .2, double: true, lod: 'near', priority: 1.9 },
      { id: 'crown_far', name: 'Crown', system: 'crown_far', node: 'oak_english', color: '#4a8530', instances: 'clumps', tint: .3, lod: 'far', priority: 1.2, far_of: 'leaves' },
      { id: 'trunk_far', name: 'Trunk', system: 'trunk', node: 'oak_trunk', color: '#7a6d5e', mesh: 'far_trunk', lod: 'far', priority: 1.4, solid: false, far_of: 'trunk' },
      { id: 'limbs_far', name: 'Branches', system: 'branches', node: 'oak_branches', color: '#6a5d4f', mesh: 'far_limbs', lod: 'far', priority: 1.5, solid: false, far_of: 'branches' },
      { id: 'roots', name: 'Roots', system: 'roots', node: 'oak_roots', color: '#8a6a44', mesh: 'roots', priority: 1.5, solid: false, ink_w: .0014 },
      { id: 'fine_roots', name: 'Fine roots', system: 'roots', node: 'oak_root_hairs', color: '#d7c294', mesh: 'fine_roots', priority: 1.8, solid: false, noink: true },
      { id: 'hyphae', name: 'Fungal threads', system: 'roots', node: 'oak_mycorrhiza', color: '#f4f0e4', mesh: 'hyphae', priority: 1.9, solid: false, noink: true },
      { id: 'soil', name: 'Soil', system: 'soil', node: 'bio_plant_nutrition_soil', color: '#6b4c32', mesh: 'soil', priority: 0.5, solid: false, noink: true, opacity_max: .32 },
      { id: 'log_bark', name: 'Outer bark', system: 'wood', node: 'oak_bark', color: '#6e6256', mesh: 'log_bark', pivot: 'wood', noink: true, priority: 1.6, solid: false },
      { id: 'log_phloem', name: 'Inner bark (phloem)', system: 'wood', node: 'oak_phloem', color: '#dccb9a', mesh: 'log_phloem', pivot: 'wood', noink: true, priority: 1.8, solid: false },
      { id: 'log_cambium', name: 'Vascular cambium', system: 'wood', node: 'oak_cambium', color: '#9bbf5c', mesh: 'log_cambium', pivot: 'wood', noink: true, priority: 1.9, solid: false },
      { id: 'log_sapwood', name: 'Sapwood', system: 'wood', node: 'oak_sapwood', color: '#dcbd7e', mesh: 'log_sapwood', pivot: 'wood', noink: true, priority: 1.7, solid: false },
      { id: 'log_heartwood', name: 'Heartwood', system: 'wood', node: 'oak_heartwood', color: '#b07a44', mesh: 'log_heartwood', pivot: 'wood', noink: true, priority: 1.7, solid: false },
      { id: 'log_pith', name: 'Pith', system: 'wood', node: 'oak_pith_rays', color: '#5a3c22', mesh: 'log_pith', pivot: 'wood', noink: true, priority: 1.9, solid: false },
      { id: 'log_rays', name: 'Wood rays', system: 'wood', node: 'oak_pith_rays', color: '#f1e3bd', mesh: 'log_rays', pivot: 'wood', noink: true, priority: 2, solid: false },
      { id: 'flow_water', name: 'Water rising in the xylem', system: 'flow', node: 'bio_water_transport', color: '#4aa3df', flow: 'water', priority: 2.2 },
      { id: 'flow_sugar', name: 'Sugar moving in the phloem', system: 'flow', node: 'bio_phloem_transport', color: '#e0a526', flow: 'sugar', priority: 2.2 },
    ],
  };
  const stats = { leaves: leaves.count, acorns: nuts.count, buds: buds.count, skeletonNodes: sk.length, tips: tips.length, rootNodes: rs.length, fineRoots: fine.length, clumps: nCl, ringBoundaries: eb.length - 1, sapwoodWidthCm: +(sapW * 100).toFixed(1), heartwoodRadiusCm: +(heartOuter * 100).toFixed(1) };
  console.log('oak model:', JSON.stringify(stats));
  return { thing, meshes: { ...meshes, far_trunk: farTrunk }, instances, flows };
}
