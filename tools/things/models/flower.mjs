// The meadow buttercup (Ranunculus acris): a whole flowering plant built procedurally from typical measurements.
// Parts: fibrous roots and short stock, basal rosette leaves, branching hairy stem with stem leaves, buds, open flowers (five sepals, five
// glossy petals each with a nectary pit and scale, many spirally arranged stamens, many separate carpels on a domed receptacle), fruiting heads
// of achenes, and a longitudinal half-flower (the classic botanical view) with the cut faces drawn as flat sections.
// Reconstruction from typical values, not a scan. Facts and sources: tools/things/content/flower_nodes.py, /home/rhett/projects/how/.devtools/notes/flower.md
import * as L from '../lib/index.mjs';

const TAU = Math.PI * 2, GA = L.GOLDEN_ANGLE;

// ---- the numbers chosen for the model (stated on the cards). "src" = consulted source, "chosen" = model choice within a stated range ----
const M = {
  height: 0.60,          // m. src: plant 30-100 cm (Wikipedia, Ranunculus acris); chosen 60 cm
  flowerD: 0.022,        // m across the open flower. src: about 2 cm / 25 mm (Wikipedia; Wildlife Watch); chosen 22 mm
  petals: 5, sepals: 5,  // 5 + 5 is the usual count (Wikipedia, Ranunculus; Burren Flora, Go Botany: sepals 5, petals 5)
  stamens: 50,           // model choice: floras only say 'numerous' (Burren Flora: numerous, indefinite, free); no count source was opened
  carpels: 25,           // model choice: floras say 'many'; no count source was opened
  achene: [0.0028, 0.0021], // m long x wide. src: 2-3 x 1.8-2.4 mm (same page)
  petalLen: 0.0116, petalW: 0.0118, sepalLen: 0.0065,   // chosen so that the open flower is about 22 mm across (not separately sourced)
  petalThick: 0.00018,   // m. src: van der Kooi et al. 2017 layer thicknesses: 2.7 + 38 + 100 + 40 um (model values) = about 0.18 mm
  y0: 0.72,              // height of the half-flower specimen above the ground (it floats beside the plant's axis)
};

// ---------- helpers ----------
function basisQuat(X, Y, Z) {   // rotation matrix columns X,Y,Z -> quaternion [x,y,z,w]
  const m00 = X[0], m01 = Y[0], m02 = Z[0], m10 = X[1], m11 = Y[1], m12 = Z[1], m20 = X[2], m21 = Y[2], m22 = Z[2], tr = m00 + m11 + m22; let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
  return q;
}
const place = (m, O, X, Y, Z) => L.transform(m, p => [O[0] + X[0] * p[0] + Y[0] * p[1] + Z[0] * p[2], O[1] + X[1] * p[0] + Y[1] * p[1] + Z[1] * p[2], O[2] + X[2] * p[0] + Y[2] * p[1] + Z[2] * p[2]]);
const cen = (m, i) => [(m.pos[m.idx[i] * 3] + m.pos[m.idx[i + 1] * 3] + m.pos[m.idx[i + 2] * 3]) / 3, (m.pos[m.idx[i] * 3 + 1] + m.pos[m.idx[i + 1] * 3 + 1] + m.pos[m.idx[i + 2] * 3 + 1]) / 3, (m.pos[m.idx[i] * 3 + 2] + m.pos[m.idx[i + 1] * 3 + 2] + m.pos[m.idx[i + 2] * 3 + 2]) / 3];
function halfOf(m, keep) {   // keep triangles whose centroid satisfies keep(c): a clean half of a mesh that has a vertex column on the cut plane
  const o = { pos: m.pos.slice(), idx: [] }; if (m.shade) o.shade = m.shade.slice();
  for (let i = 0; i < m.idx.length; i += 3) if (keep(cen(m, i))) o.idx.push(m.idx[i], m.idx[i + 1], m.idx[i + 2]);
  return o;
}
// a lathe over part of a turn (a0..a1), same orientation as L.lathe (x = r cos a, z = -r sin a)
function lathePart(profile, a0, a1, seg) {
  const m = L.newMesh(), k = profile.length;
  for (let s = 0; s <= seg; s++) { const a = a0 + (a1 - a0) * s / seg, c = Math.cos(a), sn = Math.sin(a); for (const [r, y] of profile) m.pos.push(r * c, y, -r * sn); }
  for (let s = 0; s < seg; s++) for (let i = 0; i < k - 1; i++) { const a = s * k + i, b = (s + 1) * k + i, c = (s + 1) * k + i + 1, d = s * k + i + 1; m.idx.push(a, b, c, a, c, d); }
  return m;
}
// flat section slab in the plane z = zc facing +z (a cut face): outline in x,y
const slab = (poly, zc, t = .0001) => L.extrudeOutline(poly, t, { warp: p => [p[0], p[1], p[2] + zc] });
const ellipse = (cx, cy, a, b, ang = 0, n = 18) => Array.from({ length: n }, (_, i) => { const t = i / n * TAU, x = a * Math.cos(t), y = b * Math.sin(t); return [cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)]; });
function strip(pts, w0, w1) {   // polygon around a polyline in the xy plane, half-widths w0 -> w1
  const n = pts.length, left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = w0 + (w1 - w0) * i / (n - 1);
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return left.concat(right.reverse());
}

// ---------- leaf blades: palmately divided, each primary lobe cut again into three; star-shaped outline about the petiole join ----------
function leafBlade(nLobes, R, perLobe, thick = .0004, depth = .62) {
  const total = nLobes === 5 ? 4.1 : nLobes === 3 ? 2.5 : 2.0, w = total / nLobes, pts = [[0, 0]];
  for (let k = 0; k < nLobes; k++) for (let j = 0; j < perLobe; j++) {
    const u = j / perLobe, phi = -total / 2 + (k + u) * w, s = Math.pow(Math.sin(Math.PI * u), .7), prim = 1 - depth * (1 - s);
    const sec = 1 - (perLobe > 8 ? .24 * (.5 - .5 * Math.cos(TAU * 3 * u)) * Math.sin(Math.PI * u) : 0), outer = (k === 0 || k === nLobes - 1) && nLobes > 3 ? .82 : 1, r = R * prim * sec * outer;
    pts.push([r * Math.sin(phi), r * Math.cos(phi)]);
  }
  return L.extrudeOutline(pts, thick, { warp: p => [p[0], p[1], p[2] - .22 * (p[0] * p[0] + p[1] * p[1]) / R] });
}

// ---------- the flower: positions in a local frame, base of the receptacle at the origin, axis +y ----------
const RHO = .0021, RC = .0019;                                   // receptacle: dome radius and the height of its centre
const domeAt = (beta, th) => [RHO * Math.sin(beta) * Math.cos(th), RC + RHO * Math.cos(beta), RHO * Math.sin(beta) * Math.sin(th)];
function flowerData(r, az0 = 0, grow = 1) {
  const d = { petals: [], sepals: [], scales: [], pits: [], fil: [], anth: [], ov: [], sty: [], cut: {} };
  for (let k = 0; k < M.petals; k++) {   // petals at azimuth th, tilted 52 degrees from the axis (a shallow cup)
    const th = az0 + k * TAU / 5, rh = [Math.cos(th), 0, Math.sin(th)], phi = 1.0 + r.range(-.05, .05), Y = [rh[0] * Math.sin(phi), Math.cos(phi), rh[2] * Math.sin(phi)], Z = [-rh[0] * Math.cos(phi), Math.sin(phi), -rh[2] * Math.cos(phi)], X = L.cross(Y, Z);
    const O = [rh[0] * .0021, .0003, rh[2] * .0021]; d.petals.push({ p: O, X, Y, Z, th, s: grow * r.range(.94, 1.06) });
    d.scales.push({ p: L.add(O, L.add(L.mul(Y, .0009), L.mul(Z, .00045))), X, Y, Z, th });
    d.pits.push({ p: L.add(O, L.add(L.mul(Y, .0011), L.mul(Z, .0001))), X, Y, Z, th });
  }
  for (let k = 0; k < M.sepals; k++) {   // sepals alternate with the petals; spread outward, about 72 degrees from the axis (floras: sepals spreading; Burren Flora, Go Botany, Britton and Brown)
    const th = az0 + (k + .5) * TAU / 5, rh = [Math.cos(th), 0, Math.sin(th)], phi = 1.25, Y = [rh[0] * Math.sin(phi), Math.cos(phi), rh[2] * Math.sin(phi)], Z = [-rh[0] * Math.cos(phi), Math.sin(phi), -rh[2] * Math.cos(phi)], X = L.cross(Y, Z);
    d.sepals.push({ p: [rh[0] * .0021, .0, rh[2] * .0021], X, Y, Z, th, s: grow });
  }
  for (let i = 0; i < M.stamens; i++) {   // stamens in a spiral (golden angle) on the receptacle below the carpels; outer = older = lower and more spread
    const u = i / (M.stamens - 1), th = az0 + i * GA, y = .0004 + .0017 * u, rad = .0021 + (y > .0012 ? .0001 : 0), ang = (1.0 - .7 * u) + r.range(-.08, .08), len = (.0046 - .0012 * u) * grow * r.range(.92, 1.08);
    const rh = [Math.cos(th), 0, Math.sin(th)], dir = L.norm([rh[0] * Math.sin(ang), Math.cos(ang), rh[2] * Math.sin(ang)]), p = [rh[0] * rad, y, rh[2] * rad], tip = L.add(p, L.mul(dir, len));
    const adir = L.norm(L.add(dir, L.add(L.mul(rh, .55), [0, -.15, 0])));   // the anther leans outward
    d.fil.push({ p, d: dir, len }); d.anth.push({ p: tip, d: adir, th, len: .0019 * grow, u });
  }
  for (let i = 0; i < M.carpels; i++) {   // carpels in a spiral over the dome; apex first
    const u = (i + .5) / M.carpels, beta = 1.2 * Math.sqrt(u), th = az0 + i * GA, p = domeAt(beta, th), n = L.norm([p[0], p[1] - RC, p[2]]), dd = L.norm(L.add(L.mul(n, .55), [0, .45, 0]));
    d.ov.push({ p, d: dd, th, beta }); d.sty.push({ p: L.add(p, L.mul(dd, .0014)), d: dd, th });
  }
  return d;
}

export default function build() {
  const R = L.rng(2031), meshes = {}, instances = {};
  const inst = (key, meshKey) => instances[key] = new L.Instances(meshKey);

  // ===================== unit meshes (all instanced) =====================
  meshes.filament = L.lathe([[.034, 0], [.02, 1]], { segments: 4, caps: false });                                                  // length 1, scaled to the filament length
  meshes.anther = L.lathe([[0, 0], [.16, .1], [.22, .5], [.16, .9], [0, 1]], { segments: 6, caps: false });                          // length 1
  meshes.ovary = L.lathe([[0, 0], [.33, .06], [.42, .3], [.38, .58], [.2, .8], [.08, .93], [0, 1]], { segments: 7, caps: false });
  meshes.style = L.transform(L.lathe([[.06, 0], [.05, .5], [.09, .85], [0, 1]], { segments: 4, caps: false }), p => [p[0] + .55 * p[1] * p[1], p[1], p[2]]);   // short hooked style with the stigma at the tip
  meshes.receptacle = L.lathe([[0, -.0008], [.0017, -.0008], [.0021, .0006], [.0021, RC], ...Array.from({ length: 6 }, (_, i) => { const b = Math.PI / 2 * (1 - (i + 1) / 6); return [RHO * Math.sin(b), RC + RHO * Math.cos(b)]; })], { segments: 10, caps: false });
  meshes.petal = L.blade({ length: M.petalLen, halfWidth: t => M.petalW / 2 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.6)), .7), thickness: M.petalThick, nAlong: 9, nAcross: 3, curlAcross: .55, curlAlong: .45 });
  L.bakeShade(meshes.petal, (p) => .68 + .32 * Math.min(1, p[1] / (M.petalLen * .7)) - .12 * Math.abs(p[0]) / (M.petalW / 2));
  meshes.sepal = L.blade({ length: M.sepalLen, halfWidth: t => .0017 * Math.pow(Math.sin(Math.PI * Math.pow(t, .8)), .8), thickness: .0003, nAlong: 4, nAcross: 2, curlAlong: .35, curlAcross: .25 });
  meshes.scale = L.blade({ length: .0013, halfWidth: t => .0006 * Math.sin(Math.PI * Math.pow(t, .8)) ** .7, thickness: .00012, nAlong: 3, nAcross: 2, curlAcross: .3 });
  meshes.pit = L.lathe([[0, 0], [.0006, .00004], [.0004, .0002], [0, .00025]], { segments: 6, caps: false });
  meshes.bud = L.lathe([[0, 0], [.0021, .0008], [.0046, .0035], [.0049, .0062], [.0033, .0086], [.0009, .0102], [0, .0105]], { segments: 8, caps: false });
  meshes.achene = L.transform(L.lathe([[0, 0], [.42, .08], [.5, .38], [.44, .72], [.2, .9], [0, 1]], { segments: 6, caps: false }), p => [p[0] * .72, p[1], p[2] * 1.0]);   // flattened, with a short beak below
  meshes.beak = L.transform(L.lathe([[.05, 0], [.04, .6], [0, 1]], { segments: 3, caps: false }), p => [p[0] + .7 * p[1] * p[1], p[1], p[2]]);
  meshes.fruit_rec = L.lathe([[0, -.0006], [.0019, -.0006], [.0021, .0014], [.0019, .0032], [.0012, .0046], [0, .0052]], { segments: 8, caps: false });
  meshes.hair = L.lathe([[.00006, 0], [0, .0028]], { segments: 3, caps: false });
  meshes.disc = (() => { const m = L.newMesh(); m.pos.push(0, .0004, 0); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, r = .0112 * (.8 + .2 * Math.cos(5 * a)); m.pos.push(r * Math.cos(a), 0, r * Math.sin(a)); } for (let i = 0; i < 20; i++) m.idx.push(0, 1 + (i + 1) % 20, 1 + i); return m; })();   // far stand-in for an open flower
  meshes.ball = L.lathe([[0, -1], [.8, -.6], [1, 0], [.7, .7], [0, 1]], { segments: 5, caps: false });

  // ===================== stem skeleton =====================
  const H = M.height, stemPts = [[0, .012, 0], [.011, .16, .009], [-.009, .33, .012], [.007, .47, -.008], [0, H, 0]], stemF = L.spline(stemPts), stemAt = t => stemF(t);
  const stemTube = L.tube(stemF.sample(26), t => .0027 - .0014 * t, { sides: 5, caps: false });
  const tubes = [stemTube], hairs = inst('hairs', 'hair'), openF = [], budF = [], fruitF = [], leafSpecs = [], hairLine = [];
  const stemLeaves = [{ t: .12, az: .4, R: .042, n: 5 }, { t: .22, az: .4 + GA, R: .036, n: 5 }, { t: .33, az: .4 + 2 * GA, R: .03, n: 3 }];
  const sites = [
    { t: .40, az: .3, dist: .17, rise: .13, stage: 'open' }, { t: .50, az: .3 + GA, dist: .15, rise: .11, stage: 'open' },
    { t: .58, az: .3 + 2 * GA, dist: .12, rise: .10, stage: 'fruit' }, { t: .66, az: .3 + 3 * GA, dist: .10, rise: .08, stage: 'open', fork: { dist: .045, rise: .05, az: 1.6, stage: 'bud' } },
    { t: .76, az: .3 + 4 * GA, dist: .08, rise: .07, stage: 'open' }, { t: .86, az: .3 + 5 * GA, dist: .05, rise: .05, stage: 'bud' },
  ];
  const addSite = (E, tan, stage, sc, tag) => { const ax = L.norm(L.add([0, 1, 0], L.mul(tan, .45))); (stage === 'open' ? openF : stage === 'fruit' ? fruitF : budF).push({ E, ax, sc, tag }); };
  for (const s of sites) {
    const S = stemAt(s.t), h = [Math.cos(s.az), 0, Math.sin(s.az)], pts = [S, L.add(S, L.add(L.mul(h, s.dist * .45), [0, s.rise * .75, 0])), L.add(S, L.add(L.mul(h, s.dist), [0, s.rise, 0]))];
    const path = L.spline(pts).sample(8), E = path[path.length - 1], tan = L.norm(L.sub(E, path[path.length - 2]));
    tubes.push(L.tube(path, t => .0014 - .0005 * t, { sides: 4, caps: false })); hairLine.push(path);
    leafSpecs.push({ at: S, az: s.az, R: .03 * (1 - (s.t - .4) * .9), n: 3, stem: true, up: .55 });   // stem leaf under each branch
    if (s.fork) {
      const hf = [Math.cos(s.az + s.fork.az), 0, Math.sin(s.az + s.fork.az)], p2 = [E, L.add(E, L.add(L.mul(hf, s.fork.dist * .5), [0, s.fork.rise * .8, 0])), L.add(E, L.add(L.mul(hf, s.fork.dist), [0, s.fork.rise, 0]))], pa = L.spline(p2).sample(5), E2 = pa[pa.length - 1];
      tubes.push(L.tube(pa, t => .0009 - .0003 * t, { sides: 4, caps: false })); addSite(E2, L.norm(L.sub(E2, pa[pa.length - 2])), s.fork.stage, 1, 'fork');
    }
    addSite(E, tan, s.stage, 1, 'branch');
  }
  addSite(stemAt(1), [0, 1, 0], 'fruit', 1, 'terminal');   // the first (terminal) flower of the main stem has already set fruit
  for (const sl of stemLeaves) leafSpecs.push({ at: stemAt(sl.t), az: sl.az, R: sl.R, n: sl.n, stem: true, up: .5 });
  hairLine.push(stemF.sample(26));
  // hairs: spread along the stem and branches, pointing out and up
  for (const path of hairLine) for (let i = 1; i < path.length - 1; i++) for (let q = 0; q < 6; q++) {
    const T = L.norm(L.sub(path[i + 1], path[i - 1])), a = R() * TAU, n1 = L.perp(T), n2 = L.cross(T, n1), out = L.add(L.mul(n1, Math.cos(a)), L.mul(n2, Math.sin(a))), d = L.norm(L.add(L.mul(out, .8), L.mul(T, .6)));
    hairs.add(L.add(path[i], L.mul(out, .0016)), L.quatFromTo([0, 1, 0], d), R.range(.8, 1.3));
  }
  const stems = L.bakeShade(L.merge(...tubes), (p) => .78 + .22 * L.fbm(p[0] * 40, p[1] * 40, p[2] * 40, { seed: 4 }));
  meshes.stems = stems;
  // pedicels' ends are covered by the flower: nothing else to do

  // ===================== leaves =====================
  const basal = [], basalMid = [], stemL = [], stemLMid = [], petioles = [];
  const NB = 9;
  for (let k = 0; k < NB; k++) {
    const az = k * GA + .5, h = [Math.cos(az), 0, Math.sin(az)], len = .15 + .06 * R(), up = .09 + .05 * R(), Rb = .05 + .016 * R();
    const base = [h[0] * .004, .012, h[2] * .004], tip = L.add([h[0] * len, up, h[2] * len], base), mid = L.add(L.lerp3(base, tip, .55), [0, .035, 0]);
    petioles.push(L.tube(L.spline([base, mid, tip]).sample(8), t => .0017 - .0007 * t, { sides: 4, caps: false }));
    const Y = L.norm(L.add(h, [0, .1, 0])), Zn = L.norm(L.sub([0, 1, 0], L.mul(Y, Y[1]))), X = L.cross(Y, Zn);
    basal.push(place(leafBlade(5, Rb, 26), tip, X, Y, Zn)); basalMid.push(place(leafBlade(5, Rb, 6, .0004, .6), tip, X, Y, Zn));
  }
  for (const s of leafSpecs) {
    const h = [Math.cos(s.az), 0, Math.sin(s.az)], Y = L.norm(L.add(h, [0, s.up, 0])), Zn = L.norm(L.sub([0, 1, 0], L.mul(Y, Y[1]))), X = L.cross(Y, Zn), o = L.add(s.at, L.mul(Y, .004));
    stemL.push(place(leafBlade(s.n, s.R, s.n === 5 ? 22 : 24, .0004, .7), o, X, Y, Zn)); stemLMid.push(place(leafBlade(s.n, s.R, 6, .0004, .65), o, X, Y, Zn));
  }
  // stem leaves with long petioles low on the stem: short stalk
  for (const sl of stemLeaves) { const S = stemAt(sl.t), h = [Math.cos(sl.az), 0, Math.sin(sl.az)]; petioles.push(L.tube([S, L.add(S, L.add(L.mul(h, .03), [0, .012, 0]))], .0011, { sides: 4, caps: false })); }
  meshes.basal_leaves = L.bakeShade(L.merge(...basal), (p, n) => .8 + .2 * Math.abs(n[1]) + .06 * L.fbm(p[0] * 30, p[2] * 30, 1, { seed: 3 }));
  meshes.basal_leaves_mid = L.merge(...basalMid);
  meshes.stem_leaves = L.merge(...stemL); meshes.stem_leaves_mid = L.merge(...stemLMid);
  meshes.petioles = L.merge(...petioles);

  // ===================== roots: a short thick stock and many thin fibrous roots =====================
  const stock = L.tube(L.spline([[0, .012, 0], [.002, -.008, .001], [0, -.03, -.002]]).sample(6), t => .0075 - .0035 * t, { sides: 6, caps: true });
  meshes.stock = L.bakeShade(stock, (p) => .8 + .2 * L.fbm(p[0] * 90, p[1] * 90, p[2] * 90, { seed: 9 }));
  const fib = [], lat = [], tipsR = [];
  for (let i = 0; i < 30; i++) {
    const a = i * GA + R() * .4, h = [Math.cos(a), 0, Math.sin(a)], y0 = -.004 - .028 * R(), L0 = .09 + .15 * R(); let p = [h[0] * .004, y0, h[2] * .004], dd = L.norm([h[0] * .9, -.55 - .4 * R(), h[2] * .9]); const pts = [p];
    for (let s = 0; s < 6; s++) { dd = L.norm(L.add(dd, L.add(L.mul(R.unitVec(), .35), [0, -.18, 0]))); p = L.add(p, L.mul(dd, L0 / 6)); if (p[1] < -.3) p[1] = -.3; pts.push(p); }
    fib.push(L.tube(L.spline(pts).sample(10), t => .0013 - .0009 * t, { sides: 4, caps: false })); tipsR.push(pts[6]);
    for (let q = 0; q < 3; q++) { const b = pts[1 + Math.floor(R() * 5)], a2 = R() * TAU, dl = L.norm([Math.cos(a2), -.3, Math.sin(a2)]), e = L.add(b, L.mul(dl, .02 + .04 * R())); lat.push(L.tube([b, L.lerp3(b, e, .5), e], t => .0004 * (1 - .7 * t) + .00008, { sides: 3, caps: false })); }
  }
  meshes.fibrous_roots = L.bakeShade(L.merge(...fib), () => .9); meshes.lateral_roots = L.merge(...lat);
  meshes.soil = L.lathe([[0, 0], [.3, 0], [.3, -.34], [0, -.34]], { segments: 24, caps: false });

  // ===================== open flowers, buds, fruit heads on the plant =====================
  const I = {}; for (const k of ['petals:petal', 'sepals:sepal', 'scales:scale', 'pits:pit', 'filaments:filament', 'anthers:anther', 'ovaries:ovary', 'styles:style', 'receptacles:receptacle', 'discs:disc', 'buds:bud', 'achenes:achene', 'beaks:beak', 'fruit_recs:fruit_rec', 'fruit_balls:ball']) { const [a, b] = k.split(':'); I[a] = inst(a, b); }
  const basisFlower = (ax, psi) => { const Y = ax, X0 = L.perp(Y), X = L.rotAxis(X0, Y, psi), Z = L.cross(X, Y); return { X, Y, Z, q: basisQuat(X, Y, Z) }; };
  const W = (B, v) => L.quatRot(B.q, v);
  const addBasis = (list, B, E, it, s = 1) => { const X = W(B, it.X), Y = W(B, it.Y), Z = W(B, it.Z); list.add(L.add(E, W(B, it.p)), basisQuat(X, Y, Z), (it.s || 1) * s); };
  for (const f of openF) {
    const psi = R() * TAU, B = basisFlower(f.ax, psi), g = flowerData(R, 0, f.sc * R.range(.92, 1.08));
    I.receptacles.add(f.E, B.q, 1); I.discs.add(f.E, B.q, 1);
    g.petals.forEach(it => addBasis(I.petals, B, f.E, it)); g.sepals.forEach(it => addBasis(I.sepals, B, f.E, it)); g.scales.forEach(it => addBasis(I.scales, B, f.E, it)); g.pits.forEach(it => addBasis(I.pits, B, f.E, it));
    g.fil.forEach(it => I.filaments.add(L.add(f.E, W(B, it.p)), L.quatFromTo([0, 1, 0], W(B, it.d)), it.len));
    g.anth.forEach(it => I.anthers.add(L.add(f.E, W(B, it.p)), L.quatFromTo([0, 1, 0], W(B, it.d)), it.len));
    g.ov.forEach(it => I.ovaries.add(L.add(f.E, W(B, it.p)), L.quatFromTo([0, 1, 0], W(B, it.d)), .0017));
    g.sty.forEach(it => I.styles.add(L.add(f.E, W(B, it.p)), L.quatFromTo([0, 1, 0], W(B, it.d)), .0009));
  }
  for (const f of budF) { const B = basisFlower(f.ax, R() * TAU), s = f.tag === 'fork' ? .75 : 1; I.buds.add(f.E, B.q, s); }
  for (const f of fruitF) {
    const B = basisFlower(f.ax, R() * TAU), ripe = f.tag === 'terminal' ? 1.15 : 1;
    I.fruit_recs.add(f.E, B.q, ripe); I.fruit_balls.add(L.add(f.E, W(B, [0, .005 * ripe, 0])), L.quatAxisAngle([0, 1, 0], R() * TAU), .0045 * ripe);
    for (let i = 0; i < 24; i++) {   // achenes in a spiral over the elongated receptacle
      const u = (i + .5) / 24, beta = 1.15 * Math.sqrt(u), th = i * GA, rr = .0021 * (1 - .15 * u), y = .0034 * ripe + .0021 * ripe * Math.cos(beta), p = [rr * Math.sin(beta) * 1.1 * Math.cos(th), y - .0004 * ripe, rr * Math.sin(beta) * 1.1 * Math.sin(th)];
      const n = L.norm([p[0], (p[1] - .0030 * ripe) * .8, p[2]]), d = L.norm(L.add(L.mul(n, .7), [0, .5, 0])), qd = L.quatFromTo([0, 1, 0], W(B, d)), wp = L.add(f.E, W(B, p));
      I.achenes.add(wp, qd, [M.achene[1] * 1.1, M.achene[0], M.achene[1] * .8]); I.beaks.add(L.add(wp, L.mul(W(B, d), M.achene[0] * .95)), qd, .0011);
    }
  }

  // ===================== the half flower (specimen on the axis, cut plane z = 0, facing +z) =====================
  const O = [0, M.y0, 0], sp = flowerData(L.rng(77), 0, 1);   // petal 0 at azimuth 0 (+x, in the plane), sepal 2 at 180 degrees (-x, in the plane)
  const recProfile = [[0, -.0008], [.0017, -.0008], [.0021, .0006], [.0021, RC], ...Array.from({ length: 10 }, (_, i) => { const b = Math.PI / 2 * (1 - (i + 1) / 10); return [RHO * Math.sin(b), RC + RHO * Math.cos(b)]; })];
  meshes.h_receptacle = L.transform(lathePart(recProfile.slice(1), 0, Math.PI, 14), p => L.add(p, O));
  const recPoly = [...recProfile.slice(1).map(([r, y]) => [r, y + O[1]]), ...recProfile.slice(1).reverse().map(([r, y]) => [-r, y + O[1]]), ];
  meshes.s_receptacle = slab(recPoly.filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 1e-9), .00002, .00016);
  // pedicel: half tube and a section strip
  meshes.h_pedicel = L.transform(lathePart([[.0009, -.012], [.0009, -.0008]], 0, Math.PI, 8), p => L.add(p, O));
  meshes.s_pedicel = slab([[-.0009, O[1] - .012], [.0009, O[1] - .012], [.0009, O[1] - .0008], [-.0009, O[1] - .0008]], .00002, .00016);
  // petal 0 (in the plane, +x) and the sepal at -x: half blades, cut along their midribs
  const p0 = sp.petals[0], petalFull = place(meshes.petal, L.add(O, p0.p), p0.X, p0.Y, p0.Z);
  meshes.h_petal0 = halfOf(petalFull, c => c[2] <= 1e-7);
  const s2 = sp.sepals[2], sepalFull = place(meshes.sepal, L.add(O, s2.p), s2.X, s2.Y, s2.Z);
  meshes.h_sepal0 = halfOf(sepalFull, c => c[2] <= 1e-7);
  // back-half instances (z < 0): petals at 216 and 288 degrees, sepals at 252 and 324, stamens and carpels whose base lies behind the plane
  const hI = {}; for (const k of ['petals:petal', 'sepals:sepal', 'scales:scale', 'pits:pit', 'filaments:filament', 'anthers:anther', 'ovaries:ovary', 'styles:style']) { const [a, b] = k.split(':'); hI[a] = inst('h_' + a, b); }
  const bk = it => Math.sin(it.th) < -.2;
  sp.petals.forEach((it, i) => { if (bk(it)) hI.petals.add(L.add(O, it.p), basisQuat(it.X, it.Y, it.Z), it.s); });
  sp.sepals.forEach(it => { if (bk(it)) hI.sepals.add(L.add(O, it.p), basisQuat(it.X, it.Y, it.Z), 1); });
  sp.scales.forEach(it => { if (Math.sin(it.th) < .2 && Math.sin(it.th) > -.99) hI.scales.add(L.add(O, it.p), basisQuat(it.X, it.Y, it.Z), 1); });
  sp.pits.forEach(it => { if (Math.sin(it.th) < .2) hI.pits.add(L.add(O, it.p), basisQuat(it.X, it.Y, it.Z), 1); });
  sp.fil.forEach((f, i) => { const a = sp.anth[i]; if (f.p[2] < -.0004) { hI.filaments.add(L.add(O, f.p), L.quatFromTo([0, 1, 0], f.d), f.len); hI.anthers.add(L.add(O, a.p), L.quatFromTo([0, 1, 0], a.d), a.len); } });
  sp.ov.forEach((c, i) => { if (c.p[2] < -.0008) { hI.ovaries.add(L.add(O, c.p), L.quatFromTo([0, 1, 0], c.d), .0017); hI.styles.add(L.add(O, sp.sty[i].p), L.quatFromTo([0, 1, 0], c.d), .0009); } });
  // the pit and scale belong to petal 0 too (in the plane): they are on the cut edge, drawn whole beside the half petal
  hI.scales.add(L.add(O, sp.scales[0].p), basisQuat(sp.scales[0].X, sp.scales[0].Y, sp.scales[0].Z), 1); hI.pits.add(L.add(O, sp.pits[0].p), basisQuat(sp.pits[0].X, sp.pits[0].Y, sp.pits[0].Z), 1);
  // cut carpels: on the plane, drawn as sections: wall, cavity, ovule, embryo sac (z layers stack toward the viewer)
  const cutCarpels = [{ beta: 0, th: 0 }, { beta: .8, th: 0 }, { beta: .8, th: Math.PI }, { beta: 1.15, th: Math.PI }, { beta: .45, th: 0 }, { beta: .45, th: Math.PI }];
  const cw = [], cc = [], co = [], ce = [], cs = [];
  for (const c of cutCarpels) {
    const b = c.beta, sgn = c.th === 0 ? 1 : -1, p = domeAt(b, 0), px = p[0] * sgn, py = p[1] + O[1], n = L.norm([px, p[1] - RC, 0]), d = b === 0 ? [0, 1, 0] : L.norm(L.add(L.mul(n, .55), [0, .45, 0])), ang = Math.atan2(d[1], d[0]), L1 = .0017 * 1.0;
    const cx = px + d[0] * L1 * .42, cy = py + d[1] * L1 * .42;
    cw.push(slab(ellipse(cx, cy, L1 * .46, .00046, ang, 20), .00018, .00008));
    cc.push(slab(ellipse(cx, cy, L1 * .36, .00032, ang, 18), .00027, .00008));
    co.push(slab(ellipse(cx - d[0] * .00006, cy - d[1] * .00006, L1 * .24, .00024, ang + .2, 16), .00036, .00008));
    ce.push(slab(ellipse(cx - d[0] * .00005, cy - d[1] * .00005, L1 * .1, .00011, ang + .2, 12), .00045, .00008));
    const sBase = [cx + d[0] * L1 * .42, cy + d[1] * L1 * .42], sPts = [0, .25, .5, .75, 1].map(t => [sBase[0] + d[0] * .00055 * t * 1.2 + (-d[1]) * sgn * .00045 * t * t * 1.5, sBase[1] + d[1] * .00055 * t * 1.2 + d[0] * sgn * .00045 * t * t * 1.5]);
    cs.push(slab(strip(sPts, .00007, .00005), .00018, .00008));
  }
  meshes.s_carpel_wall = L.merge(...cw, ...cs); meshes.s_carpel_cavity = L.merge(...cc); meshes.s_ovule = L.merge(...co); meshes.s_embryosac = L.merge(...ce);
  // cut stamen (at -x): filament strip, anther wall, two pollen sacs; and a second, shorter one on the +x side
  const stm = (sgn, yb, len, ang0) => {
    const base = [sgn * (RHO + .0001), O[1] + yb], dir = [sgn * Math.sin(ang0), Math.cos(ang0)], pts = [0, .33, .66, 1].map(t => [base[0] + dir[0] * len * t + sgn * .0004 * t * t, base[1] + dir[1] * len * t - .0003 * t * t]);
    const tip = pts[3], ad = [pts[3][0] - pts[2][0], pts[3][1] - pts[2][1]], al = Math.hypot(...ad), a = [ad[0] / al, ad[1] / al], ang = Math.atan2(a[1], a[0]), cx = tip[0] + a[0] * .00095, cy = tip[1] + a[1] * .00095, nrm = [-a[1], a[0]];
    return { fil: slab(strip(pts, .00014, .00009), .00018, .00008), anth: slab(ellipse(cx, cy, .00098, .00026, ang, 20), .00018, .00008), sacs: L.merge(...[-1, 1].map(k => slab(ellipse(cx + nrm[0] * .0001 * k, cy + nrm[1] * .0001 * k, .0008, .000105, ang, 16), .00028, .00008))), cx, cy };
  };
  const stA = stm(-1, .0011, .0036, .7), stB = stm(1, .0016, .0032, .55);
  meshes.s_filament = L.merge(stA.fil, stB.fil); meshes.s_anther_wall = L.merge(stA.anth, stB.anth); meshes.s_pollen_sacs = L.merge(stA.sacs, stB.sacs);
  const half = { O, anther: [stA.cx, stA.cy] };

  // ===================== far / mid stand-ins: already covered by discs, balls, mid leaves =====================

  // ===================== thing description =====================
  const hs = (id, node, at, label, r = .0003) => ({ id, node, at: at.map(v => +v.toFixed(5)), label, r, pivot: 'wood', modes: ['half'] });
  const cc0 = cutCarpels[1], pC = domeAt(cc0.beta, 0), carpelAt = [pC[0] + .0007, pC[1] + O[1] + .0005, .0004];
  const thing = {
    id: 'flower', title: 'Meadow buttercup', label: 'Meadow buttercup', scientific: 'Ranunculus acris', node: 'rn_acris', main_part: 'stems', label_first_only: true,
    blurb: 'A meadow buttercup plant. Click a leaf, a stem, a bud, a petal, a stamen or a fruit. The layer buttons show one flower, a flower cut in half, the fruit, and the roots.',
    model_note: 'A procedural model built from typical measurements of the species, not a scan of one plant. The counts of stamens (50), carpels (25) and leaf lobes (5, each cut into 3) are choices made for the model, within what floras describe as numerous, many and variable. A real plant has more leaves and more flowers; the half flower is drawn at life size, with its cut faces as flat sections.',
    size_m: { height: M.height, flower_width: M.flowerD }, height_m: M.height, radius_m: .8, draw_m: 120, seed: 2031,
    systems: [{ id: 'leaves', label: 'Leaves' }, { id: 'stems', label: 'Stems' }, { id: 'flowers', label: 'Flowers' }, { id: 'buds', label: 'Buds' }, { id: 'fruit', label: 'Fruit' }, { id: 'roots', label: 'Roots' }, { id: 'soil', label: 'Soil' }, { id: 'half', label: 'Half flower' }],
    lod: { near_m: 3.2, far_m: 16 },
    anim: [{ kind: 'sway', systems: ['leaves', 'stems', 'flowers', 'buds', 'fruit'], from_y: 0, to_y: .6, amp_m: .012, hz: .45, label: 'Stems and leaves' }],   // a light breeze (shader only); illustrative
    variation: { scale: [.88, 1.12], yaw: true, lean_deg: 4, groups: [{ id: 'open_flowers', n: 4, keep: [2, 4], always: [0], members: { petals: 5, sepals: 5, scales: 5, pits: 5, filaments: 50, anthers: 50, ovaries: 25, styles: 25, discs: 1 } }] },   // per-placement seed: size, heading, lean, and how many of the four open flowers are open (the first always is)
    sites: { open: openF.map(f => f.E.map(v => +v.toFixed(4))), bud: budF.map(f => f.E.map(v => +v.toFixed(4))), fruit: fruitF.map(f => f.E.map(v => +v.toFixed(4))) },
    shadow: { radius_m: .2, opacity: .55 },
    modes: [
      { id: 'whole', label: 'Whole plant', show: { leaves: 1, stems: 1, flowers: 1, buds: 1, fruit: 1 } },
      { id: 'flower', label: 'One flower', show: { leaves: .1, stems: .3, flowers: 1, buds: .25, fruit: .25 } },
      { id: 'half', label: 'Cut in half', pivot: 'wood', show: { half: 1 }, hotspots: true, legend: { title: 'Half a flower, at life size', items: [{ name: 'Petal (cut along its middle)', color: '#f4c20d', node: 'rn_petal' }, { name: 'Sepal', color: '#8fb64a', node: 'rn_sepal' }, { name: 'Stamen: filament and anther', color: '#e8a416', node: 'rn_stamen' }, { name: 'Carpel: ovary, ovule', color: '#8eb44a', node: 'rn_carpel' }, { name: 'Receptacle', color: '#b9d68a', node: 'rn_receptacle' }], note: 'The flower is cut down its middle. Parts behind the cut are drawn whole; the cut faces are flat coloured sections. Life size: about 2 cm across. The ovule and the pollen sacs are drawn from typical anatomy, not from one measured flower.' } },
      { id: 'fruit', label: 'Fruit', show: { leaves: .1, stems: .3, flowers: .15, buds: .15, fruit: 1 } },
      { id: 'underground', label: 'Underground', show: { roots: 1, soil: 1, stems: 1, leaves: .1, flowers: .05, buds: .05, fruit: .05 }, groundSeeThrough: true, hotspots: true, legend: { title: 'Underground', items: [{ name: 'Stock (short thick stem base)', color: '#a98a5c', node: 'rn_stock' }, { name: 'Fibrous roots', color: '#d6c28f', node: 'rn_roots' }], note: 'The soil is drawn see-through. The root system is a schematic of a fibrous system: the number and course of real roots differ from plant to plant.' } },
    ],
    hotspots: [
      hs('hs_half', 'rn_receptacle', [0, O[1] + .0012, .0012], 'Receptacle: where all the parts are attached', .0006),
      hs('hs_anther', 'rn_anther', [half.anther[0], half.anther[1], .0006], 'Anther: pollen sacs (click it, then look inside)'),
      hs('hs_carpel', 'rn_ovule', carpelAt, 'Carpel: ovary with one ovule (click it, then look inside)'),
      hs('hs_nectary', 'rn_nectary', [p0.p[0] + p0.Y[0] * .0011 + p0.Z[0] * .0007, O[1] + p0.p[1] + p0.Y[1] * .0011 + p0.Z[1] * .0007, .0007], 'Nectary: pit and scale at the petal base', .0004),
      hs('hs_petal', 'rn_gloss', [p0.p[0] + p0.Y[0] * .007, O[1] + p0.p[1] + p0.Y[1] * .007, .0008], 'Petal: why it shines (click it, then look inside)', .0006),
      { id: 'hs_stock', node: 'rn_stock', at: [0, -.015, 0], label: 'Stock: the short, thick base of the stem', r: .012, modes: ['underground'] },
      { id: 'hs_fibrous', node: 'rn_roots', at: tipsR[4].map(v => +v.toFixed(3)), label: 'Fibrous root', r: .012, modes: ['underground'] },
    ],
    parts: [
      { id: 'stems', name: 'Stem and branches', system: 'stems', node: 'rn_stem', color: '#86a24c', mesh: 'stems', priority: 1.5, solid: false, noink: true },
      { id: 'hairs', name: 'Stem hairs', system: 'stems', node: 'rn_hairs', color: '#e9edd2', instances: 'hairs', lod: 'near', priority: 1.8, tint: .1 },
      { id: 'petioles', name: 'Leaf stalks', system: 'leaves', node: 'rn_basal_leaf', color: '#7a9a44', mesh: 'petioles', priority: 1.6, solid: false, noink: true },
      { id: 'basal_leaves', name: 'Basal leaf', system: 'leaves', node: 'rn_basal_leaf', color: '#4f8f2d', mesh: 'basal_leaves', lod: 'near', priority: 1.7, solid: false, noink: true, deeper: { type: 'tissue2', id: 'flower_leaf', D: 4e-4, button: 'Look at the leaf surface' } },
      { id: 'basal_leaves_mid', name: 'Basal leaf', system: 'leaves', node: 'rn_basal_leaf', color: '#4f8f2d', mesh: 'basal_leaves_mid', lod: 'mid+far', priority: 1.7, solid: false, noink: true },
      { id: 'stem_leaves', name: 'Stem leaf', system: 'leaves', node: 'rn_stem_leaf', color: '#5a9a33', mesh: 'stem_leaves', lod: 'near', priority: 1.7, solid: false, noink: true, deeper: { type: 'tissue2', id: 'flower_leaf', D: 4e-4, button: 'Look at the leaf surface' } },
      { id: 'stem_leaves_mid', name: 'Stem leaf', system: 'leaves', node: 'rn_stem_leaf', color: '#5a9a33', mesh: 'stem_leaves_mid', lod: 'mid+far', priority: 1.7, solid: false, noink: true },
      { id: 'sepals', name: 'Sepal', system: 'flowers', node: 'rn_sepal', color: '#9cbc50', instances: 'sepals', lod: 'near', tint: .12, double: true, priority: 1.9 },
      { id: 'petals', name: 'Petal', system: 'flowers', node: 'rn_petal', color: '#f6c40b', instances: 'petals', lod: 'near', tint: .08, double: true, priority: 1.9, deeper: { type: 'tissue2', id: 'flower_petal', D: 3e-4, button: 'Look inside the petal' } },
      { id: 'nectary_scales', name: 'Nectary scale', system: 'flowers', node: 'rn_nectary', color: '#b9cf6a', instances: 'scales', lod: 'near', double: true, priority: 2.1 },
      { id: 'nectary_pits', name: 'Nectary pit', system: 'flowers', node: 'rn_nectary', color: '#7f9f33', instances: 'pits', lod: 'near', double: true, priority: 2.1 },
      { id: 'filaments', name: 'Filament', system: 'flowers', node: 'rn_filament', color: '#ece08c', instances: 'filaments', lod: 'near', priority: 2, double: true },
      { id: 'anthers', name: 'Anther', system: 'flowers', node: 'rn_anther', color: '#e59d14', instances: 'anthers', lod: 'near', tint: .1, priority: 2, double: true, deeper: { type: 'tissue2', id: 'flower_anther', D: 1.6e-3, button: 'Look inside the anther' } },
      { id: 'ovaries', name: 'Carpel (ovary)', system: 'flowers', node: 'rn_carpel', color: '#8ab34a', instances: 'ovaries', lod: 'near', tint: .08, priority: 2, double: true, deeper: { type: 'tissue2', id: 'flower_carpel', D: 1.6e-3, button: 'Look inside the carpel' } },
      { id: 'styles', name: 'Style and stigma', system: 'flowers', node: 'rn_style_stigma', color: '#c7d77a', instances: 'styles', lod: 'near', priority: 2.1, double: true },
      { id: 'receptacles', name: 'Receptacle', system: 'flowers', node: 'rn_receptacle', color: '#a9c870', instances: 'receptacles', lod: 'near', priority: 1.6, double: true },
      { id: 'flower_discs', name: 'Open flower', system: 'flowers', node: 'rn_flower', color: '#f6c40b', instances: 'discs', lod: 'mid+far', priority: 1.8, double: true },
      { id: 'buds', name: 'Flower bud', system: 'buds', node: 'rn_bud', color: '#93b24d', instances: 'buds', tint: .1, priority: 1.8, double: true },
      { id: 'fruit_recs', name: 'Fruiting head (receptacle)', system: 'fruit', node: 'rn_fruit', color: '#a2bb62', instances: 'fruit_recs', lod: 'near', priority: 1.7, double: true },
      { id: 'achenes', name: 'Achene', system: 'fruit', node: 'rn_achene', color: '#9aa43c', instances: 'achenes', lod: 'near', tint: .15, priority: 1.9, double: true },
      { id: 'beaks', name: 'Achene beak', system: 'fruit', node: 'rn_achene', color: '#8a9334', instances: 'beaks', lod: 'near', priority: 1.9, double: true },
      { id: 'fruit_balls', name: 'Fruiting head', system: 'fruit', node: 'rn_fruit', color: '#96a548', instances: 'fruit_balls', lod: 'mid+far', priority: 1.7, double: true },
      { id: 'stock', name: 'Stock', system: 'roots', node: 'rn_stock', color: '#a98a5c', mesh: 'stock', priority: 1.6, solid: false, noink: true },
      { id: 'fibrous_roots', name: 'Fibrous roots', system: 'roots', node: 'rn_roots', color: '#d6c28f', mesh: 'fibrous_roots', priority: 1.7, solid: false, noink: true },
      { id: 'lateral_roots', name: 'Fine lateral roots', system: 'roots', node: 'rn_roots', color: '#e4d6ae', mesh: 'lateral_roots', priority: 1.8, solid: false, noink: true },
      { id: 'soil', name: 'Soil', system: 'soil', node: 'bio_plant_nutrition_soil', color: '#6b4c32', mesh: 'soil', priority: .5, solid: false, noink: true, opacity_max: .32 },
      // ---- the half flower ----
      { id: 'h_receptacle', name: 'Receptacle (back half)', system: 'half', node: 'rn_receptacle', color: '#a9c870', mesh: 'h_receptacle', pivot: 'wood', solid: false, priority: 1.6, noink: true },
      { id: 's_receptacle', name: 'Receptacle (cut face)', system: 'half', node: 'rn_receptacle', color: '#b5d47c', mesh: 's_receptacle', pivot: 'wood', solid: false, priority: 1.7, noink: true },
      { id: 'h_pedicel', name: 'Flower stalk (back half)', system: 'half', node: 'rn_stem', color: '#86a24c', mesh: 'h_pedicel', pivot: 'wood', solid: false, priority: 1.6, noink: true },
      { id: 's_pedicel', name: 'Flower stalk (cut face)', system: 'half', node: 'rn_stem', color: '#dfe9b8', mesh: 's_pedicel', pivot: 'wood', solid: false, priority: 1.7, noink: true },
      { id: 'h_petal0', name: 'Petal (cut along its middle)', system: 'half', node: 'rn_petal', color: '#f6c40b', mesh: 'h_petal0', pivot: 'wood', solid: false, priority: 1.9, noink: true, deeper: { type: 'tissue2', id: 'flower_petal', D: 3e-4, button: 'Look inside the petal' } },
      { id: 'h_sepal0', name: 'Sepal (cut along its middle)', system: 'half', node: 'rn_sepal', color: '#9cbc50', mesh: 'h_sepal0', pivot: 'wood', solid: false, priority: 1.9, noink: true },
      { id: 'h_petals', name: 'Petal', system: 'half', node: 'rn_petal', color: '#f6c40b', instances: 'h_petals', pivot: 'wood', double: true, priority: 1.8, deeper: { type: 'tissue2', id: 'flower_petal', D: 3e-4, button: 'Look inside the petal' } },
      { id: 'h_sepals', name: 'Sepal', system: 'half', node: 'rn_sepal', color: '#9cbc50', instances: 'h_sepals', pivot: 'wood', double: true, priority: 1.8 },
      { id: 'h_scales', name: 'Nectary scale', system: 'half', node: 'rn_nectary', color: '#b9cf6a', instances: 'h_scales', pivot: 'wood', double: true, priority: 2.1 },
      { id: 'h_pits', name: 'Nectary pit', system: 'half', node: 'rn_nectary', color: '#7f9f33', instances: 'h_pits', pivot: 'wood', double: true, priority: 2.1 },
      { id: 'h_filaments', name: 'Filament', system: 'half', node: 'rn_filament', color: '#ece08c', instances: 'h_filaments', pivot: 'wood', double: true, priority: 2 },
      { id: 'h_anthers', name: 'Anther', system: 'half', node: 'rn_anther', color: '#e59d14', instances: 'h_anthers', pivot: 'wood', double: true, priority: 2, deeper: { type: 'tissue2', id: 'flower_anther', D: 1.6e-3, button: 'Look inside the anther' } },
      { id: 'h_ovaries', name: 'Carpel (ovary)', system: 'half', node: 'rn_carpel', color: '#8ab34a', instances: 'h_ovaries', pivot: 'wood', double: true, priority: 2, deeper: { type: 'tissue2', id: 'flower_carpel', D: 1.6e-3, button: 'Look inside the carpel' } },
      { id: 'h_styles', name: 'Style and stigma', system: 'half', node: 'rn_style_stigma', color: '#c7d77a', instances: 'h_styles', pivot: 'wood', double: true, priority: 2.1 },
      { id: 's_filament', name: 'Filament (cut)', system: 'half', node: 'rn_filament', color: '#f3e9a6', mesh: 's_filament', pivot: 'wood', solid: false, priority: 2.2, noink: true },
      { id: 's_anther_wall', name: 'Anther wall (cut)', system: 'half', node: 'rn_anther', color: '#e59d14', mesh: 's_anther_wall', pivot: 'wood', solid: false, priority: 2.2, noink: true, deeper: { type: 'tissue2', id: 'flower_anther', D: 1.6e-3, button: 'Look inside the anther' } },
      { id: 's_pollen_sacs', name: 'Pollen sacs (cut)', system: 'half', node: 'rn_pollen_sac', color: '#fbe24a', mesh: 's_pollen_sacs', pivot: 'wood', solid: false, priority: 2.3, noink: true, deeper: { type: 'tissue2', id: 'flower_anther', D: 1.6e-3, button: 'Look inside the anther' } },
      { id: 's_carpel_wall', name: 'Carpel wall (cut)', system: 'half', node: 'rn_carpel', color: '#7aa63c', mesh: 's_carpel_wall', pivot: 'wood', solid: false, priority: 2.2, noink: true, deeper: { type: 'tissue2', id: 'flower_carpel', D: 1.6e-3, button: 'Look inside the carpel' } },
      { id: 's_carpel_cavity', name: 'Ovary cavity (cut)', system: 'half', node: 'rn_carpel', color: '#d8ecb0', mesh: 's_carpel_cavity', pivot: 'wood', solid: false, priority: 2.3, noink: true, deeper: { type: 'tissue2', id: 'flower_carpel', D: 1.6e-3, button: 'Look inside the carpel' } },
      { id: 's_ovule', name: 'Ovule (cut)', system: 'half', node: 'rn_ovule', color: '#f1d98a', mesh: 's_ovule', pivot: 'wood', solid: false, priority: 2.4, noink: true, deeper: { type: 'tissue2', id: 'flower_carpel', D: 1.6e-3, button: 'Look inside the carpel' } },
      { id: 's_embryosac', name: 'Embryo sac (cut)', system: 'half', node: 'rn_embryo_sac', color: '#fffdf0', mesh: 's_embryosac', pivot: 'wood', solid: false, priority: 2.5, noink: true, deeper: { type: 'tissue2', id: 'flower_carpel', D: 1.6e-3, button: 'Look inside the carpel' } },
    ],
  };
  const stats = { openFlowers: openF.length, buds: budF.length, fruitHeads: fruitF.length, petals: I.petals.count, stamensOnPlant: I.filaments.count, carpelsOnPlant: I.ovaries.count, achenes: I.achenes.count, hairs: hairs.count, basalLeaves: NB, stemLeaves: leafSpecs.length };
  console.log('flower model:', JSON.stringify(stats));
  return { thing, meshes, instances };
}
