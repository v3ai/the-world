// A western honey bee worker (Apis mellifera), true size (about 14 mm), standing on a flower and drinking.
// Everything is modelled in MILLIMETRES (x forward = head, y up, z across, feet at y = 0) and scaled to metres at the end.
// Every number that is a measurement carries its source in the comment; the rest are proportions chosen by eye from photographs and drawings, and say so.
import * as L from '../lib/index.mjs';

const MM = .001;
const FLOWER_Y = 0;   // metres: the bee stands at the origin; the park index puts her on a flower (data/things/index.json: placement `on`)
// ---- measurements (sources in tools/things/content/bee_nodes.py and the report) ----
const M = {
  bodyLen: 14,          // worker body length 12-15 mm (life-cycle table, Wikipedia "Honey bee life cycle"); model ~14 mm head to abdomen tip, proboscis folded out of count
  forewing: 9.7,        // average wing length 9.7 mm (PNAS-related study quoted in search summary; see report)
  facet: .0252,         // facet diameter 25.2 um (Streinzer et al. 2013, PLOS ONE, Table 1)
  eyeLen: 2.4,          // eye length 2.4 mm (same table)
  ocellus: .3,          // median ocellus 0.30 mm, lateral 0.28 mm (same table)
  hindTibia: [2.7, 3.0],// tibia length 2.7-3.0 mm (Egyptian morphometric study, search summary)
  proboscis: 5.7,       // proboscis length ~5.4-5.9 mm in one population (same study); drawn partly extended (~3.9 mm)
  nAbd: 6,              // visible abdominal segments in a worker (first abdominal segment is fused into the thorax)
  nHamuli: 20,          // the model draws 20 hooks; the real number varies and was not confirmed
};
const V = L, add = L.add, sub = L.sub, mul = L.mul, norm = L.norm, cross = L.cross, dot = L.dot, len = L.len;
const R = L.rng(4242);
const E = (c, r, yaw = 0) => { let s = L.ellipsoid(r[0], r[1], r[2]); if (yaw) s = L.rotate(s, [0, 1, 0], yaw); return L.translate(s, c); };
const bnd = (sdf, min, max, cell, refine = 1, sm = 1) => { let m = L.meshSDF(sdf, { min, max, cell, refine }); if (sm) m = L.smooth(m, sm); return m; };
const fin = m => { const o = L.scaleMesh(m, MM); if (m.shade) o.shade = m.shade; return o; };
const aoShade = (sdf, tone = 1, d = .18, k = 1) => (p, n) => { const a = Math.max(0, Math.min(1, sdf([p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d]) / d)); return tone * (1 - k * .5 + k * .5 * a); };
const sp = (pts, n = 24) => L.spline(pts).sample(n);
const tubeM = (pts, r, sides = 7, n, caps = true) => L.tube(n ? sp(pts, n) : pts, r, { sides, caps });
const mir = z => [0, 0, z];
const S = [1, -1];
const flipZ = p => [p[0], p[1], -p[2]];

// ================= outer shapes =================
// ---- head (hypognathous: face looks forward and down) ----
const headS = L.smoothUnion(.35, E([6.0, 5.35, 0], [1.15, 1.55, 1.5]), E([6.55, 4.35, 0], [.75, 1.0, .85]), E([6.3, 5.9, 0], [.8, .9, 1.2]));
const eyeS = s => E([5.9, 5.55, s * 1.28], [.95, 1.2, .62]);
const eyesBoth = L.union(eyeS(1), eyeS(-1));
// ---- thorax: prothorax collar, mesothorax (the big dome with the flight muscles), metathorax with the propodeum ----
const proS = E([4.2, 4.85, 0], [.7, 1.3, 1.45]);
const mesoS = L.smoothUnion(.3, E([2.45, 5.3, 0], [1.7, 1.75, 1.75]), E([2.6, 6.0, 0], [1.4, 1.2, 1.5]));
const metaS = E([.55, 4.75, 0], [.9, 1.3, 1.3]);
const thoraxAll = L.union(proS, mesoS, metaS);
// ---- abdomen: three blended ellipsoids; segments are slabs of it ----
const abdS = L.smoothUnion(.5, E([-1.5, 4.5, 0], [1.9, 1.55, 1.5]), E([-3.7, 4.2, 0], [2.2, 1.85, 1.75]), E([-5.4, 3.75, 0], [1.3, 1.4, 1.2]));
const segX = [0.35, -.85, -2.0, -3.2, -4.4, -5.6, -6.8];
const bodyAll = L.union(headS, eyesBoth, thoraxAll, abdS);

export default function build() {
  const meshes = {}, instances = {};
  const log = [];
  // ---------- head capsule ----------
  { const m = bnd(headS, [4.7, 3.2, -1.9], [7.6, 7.2, 1.9], .1, 1); L.bakeShade(m, aoShade(L.union(headS, eyesBoth), .95)); meshes.head = fin(m); }
  // compound eyes, one mesh each (dark; the facets are 25 um, far below what a 14 mm model can draw)
  for (const s of S) { const sd = eyeS(s); const m = bnd(sd, [4.8, 4.2, s > 0 ? -.1 : -2.1], [7.0, 6.9, s > 0 ? 2.1 : .1], .09, 1); L.bakeShade(m, (p, n) => .75 + .25 * L.fbm(p[0] * 7, p[1] * 7, p[2] * 7, { octaves: 2, seed: 5 }) * 1.2); meshes[s > 0 ? 'eye_l' : 'eye_r'] = fin(m); }
  // ocelli: three simple eyes on top of the head (0.30 and 0.28 mm across)
  { const hs = [[6.45, 0, M.ocellus / 2], [6.0, .62, .28 / 2], [6.0, -.62, .28 / 2]].map(([x, z, r]) => { const h = L.surfaceHit(L.union(headS), [x, 8.5, z], [0, -1, 0], 6); return { p: h ? h.p : [x, 6.8, z], r }; });
    const sd = L.union(...hs.map(h => L.translate(L.sphere(h.r), [h.p[0], h.p[1] + h.r * .15, h.p[2]]))); meshes.ocelli = fin(bnd(sd, [5.4, 6.0, -1.1], [7.0, 7.6, 1.1], .045, 1, 0)); log.push('ocelli at ' + hs.map(h => h.p.map(v => +v.toFixed(2))).join(' | ')); }
  // ---------- antennae: scape, pedicel, flagellum (12 segments in all, ten of them in the flagellum) ----------
  { const sc = [], pe = [], fl = [], base = [6.95, 5.35, .55];
    for (const s of S) { const z = v => [v[0], v[1], v[2] * s];
      sc.push(tubeM([base, [7.5, 6.1, .85], [8.05, 6.75, 1.1]].map(z), t => .17 + .03 * Math.sin(t * 3), 8, 8));
      pe.push(tubeM([[8.05, 6.75, 1.1], [8.4, 7.05, 1.25]].map(z), .12, 8, 0));
      const pts = sp([[8.4, 7.05, 1.25], [9.5, 7.3, 1.8], [10.7, 7.0, 2.4], [11.8, 6.2, 2.9]].map(z), 60);
      fl.push(tubeM(pts, t => { const seg = 10, u = t * seg, f = u - Math.floor(u); return (.11 - .03 * t) * (.9 + .12 * Math.sin(f * Math.PI)); }, 7, 0)); }
    meshes.ant_scape = fin(L.merge(...sc)); meshes.ant_pedicel = fin(L.merge(...pe)); meshes.ant_flagellum = fin(L.merge(...fl)); }
  // ---------- mouthparts: mandibles, and the proboscis drawn partly extended down into the flower ----------
  { const md = S.map(s => { const sd = L.smoothUnion(.08, L.translate(L.rotate(L.ellipsoid(.55, .2, .24), [0, 0, 1], -.7), [7.0, 4.0, s * .52]), L.translate(L.sphere(.2), [6.75, 4.35, s * .5])); return bnd(sd, [6.3, 3.4, s > 0 ? .1 : -1], [7.7, 4.8, s > 0 ? 1 : -.1], .055, 1); });
    meshes.mandibles = fin(L.merge(...md));
    const root = [7.05, 3.95, 0], P = [root, [7.75, 2.9, 0], [8.35, 1.6, 0], [8.55, .55, 0]];
    meshes.glossa = fin(tubeM(P.map((p, i) => [p[0] + .04, p[1] - .02, p[2]]), t => .11 - .06 * t, 7, 24));
    const sheath = [];
    for (const s of S) { sheath.push(tubeM([[7.05, 4.0, s * .22], [7.7, 3.0, s * .26], [8.2, 1.9, s * .24], [8.35, 1.2, s * .17]], t => .15 - .07 * t, 6, 22));
      sheath.push(tubeM([[7.0, 3.85, s * .36], [7.5, 3.0, s * .42], [7.9, 2.2, s * .3]], t => .1 - .04 * t, 6, 14)); }
    meshes.sheath = fin(L.merge(...sheath)); }
  // ---------- thorax ----------
  for (const [k, sd, a, b] of [['prothorax', proS, [3.4, 3.4, -1.7], [5.0, 6.4, 1.7]], ['mesothorax', mesoS, [.6, 3.3, -2.0], [4.3, 7.4, 2.0]], ['metathorax', metaS, [-.5, 3.3, -1.5], [1.5, 6.2, 1.5]]]) {
    const m = bnd(sd, a, b, .11, 1); L.bakeShade(m, aoShade(thoraxAll, .95, .22)); meshes[k] = fin(m); }
  // tegulae (scales over the wing bases) and the wing hinge (sclerites at the base of each wing)
  { const teg = S.map(s => bnd(E([3.35, 6.9, s * 1.55], [.42, .12, .36]), [2.8, 6.6, s > 0 ? 1.1 : -2.1], [3.9, 7.2, s > 0 ? 2.1 : -1.1], .07, 1, 0));
    meshes.tegulae = fin(L.merge(...teg));
    const hg = S.map(s => bnd(L.smoothUnion(.05, E([2.75, 6.95, s * 1.4], [.28, .09, .3]), E([2.2, 6.95, s * 1.45], [.2, .08, .25])), [1.8, 6.7, s > 0 ? .9 : -2.1], [3.2, 7.3, s > 0 ? 2.1 : -.9], .07, 1, 0)); meshes.wing_hinge = fin(L.merge(...hg)); }
  // ---------- abdomen: six visible segments ----------
  for (let i = 0; i < M.nAbd; i++) {
    const x0 = segX[i], x1 = segX[i + 1], slab = p => Math.max(p[0] - (x0 - .015), (x1 + .015) - p[0]);
    const sd = L.smoothIntersect(.05, abdS, slab), m = bnd(sd, [x1 - .3, 2.2, -2.1], [x0 + .3, 6.2, 2.1], .12, 1);
    L.bakeShade(m, (p, n) => { const fx = (x0 - p[0]) / (x0 - x1), band = fx > .72 ? .78 + .22 * (1 - (fx - .72) / .28) : 1; return aoShade(abdS, 1, .2, .6)(p, n) * band; }); meshes['abd' + (i + 1)] = fin(m); }
  // ---------- far stand-in: the whole body in one simplified mesh ----------
  { const m = L.simplify(L.merge(L.meshSDF(bodyAll, { min: [-7, 2.2, -2.1], max: [7.6, 7.4, 2.1], cell: .2, refine: 1 })), .22); meshes.body_far = fin(m); }

  // ================= wings (folded back, as at rest) =================
  const wingFrame = (s, B, dir, rollY) => { const U = norm(dir.map((v, i) => i === 2 ? v * s : v)), Cd = norm([0, rollY, -s * .96]); const N = norm(cross(U, Cd)); return { B: [B[0], B[1], B[2] * s], U, Cd, N }; };
  const wxf = (f, u, v, w) => [f.B[0] + u * f.U[0] - v * f.Cd[0] + w * f.N[0], f.B[1] + u * f.U[1] - v * f.Cd[1] + w * f.N[1], f.B[2] + u * f.U[2] - v * f.Cd[2] + w * f.N[2]];
  const fw = [[0, 0], [2, .12], [4, .17], [6, .12], [8, -.1], [9.2, -.6], [9.7, -1.2], [9.4, -1.9], [8.4, -2.4], [6.6, -2.8], [4.4, -3.1], [2.4, -2.9], [1, -2.2], [.2, -1.1]];
  const hw = [[0, 0], [2, .1], [4, .13], [5.8, .0], [6.9, -.5], [7.1, -1.2], [6.6, -1.8], [5.2, -2.1], [3.2, -2.3], [1.6, -2.0], [.5, -1.2]];
  const FWF = S.map(s => wingFrame(s, [2.9, 6.95 + (s < 0 ? -.07 : 0), 1.5], [-1, -.13, .1], -.28));
  const HWF = S.map(s => wingFrame(s, [2.4, 6.78, 1.4], [-1, -.15, .07], -.28));
  const wing = (F, outline, th) => { const e = L.extrudeOutline(outline, th); return L.flip(L.transform(e, p => wxf(F, p[0], -p[1], p[2]))); };
  // wing membrane (extrudeOutline lies in x,y with z thickness; v is negative toward the trailing edge, so we flip the sign above)
  { const ms = FWF.map(F => wing(F, fw, .03)); meshes.forewings = fin(L.merge(...ms)); }
  { const ms = HWF.map(F => wing(F, hw, .03)); meshes.hindwings = fin(L.merge(...ms)); }
  // veins: costa along the front edge, the radial and medial veins and cross-veins that close the cells (simplified: the real forewing has three submarginal cells)
  { const lines = [[[0, .02], [2, .12], [4, .17], [6, .12], [8, -.1], [9.4, -.6]], [[.4, -.3], [3, -.45], [5.5, -.55], [8, -.7], [9.3, -1.1]], [[.6, -.9], [3, -1.25], [5, -1.5], [7, -1.7], [9, -1.7]], [[.8, -1.6], [3.5, -2.2], [6, -2.5], [8.2, -2.3]],
      [[2.9, .15], [3.0, -.45]], [[4.7, .16], [4.8, -.5]], [[6.1, .12], [6.2, -.58]], [[3.0, -.45], [3.2, -1.25]], [[5.0, -.52], [5.1, -1.5]]];
    const tubes = []; for (const F of FWF) for (const ln of lines) { const pts = ln.length > 2 ? sp(ln.map(q => [q[0], q[1], 0]), ln.length * 4) : ln.map(q => [q[0], q[1], 0]); tubes.push(L.transform(L.tube(pts.map(q => wxf(F, q[0], -q[1], .02)), ln === lines[0] ? .05 : .028, { sides: 4, caps: false }), p => p)); }
    meshes.veins = fin(L.merge(...tubes)); }
  // hamuli: a row of small hooks along the front edge of each hind wing; they catch the fold on the back edge of the forewing in flight
  { const hk = L.tube([[0, 0, 0], [0, .09, .02], [-.045, .15, .0], [-.09, .14, -.02]].map(q => q), .012, { sides: 4, caps: true }); meshes.hook = hk;   // mm units, 0.15 mm long, scaled below
    meshes.hook = fin(hk); const I = new L.Instances('hook');
    for (const F of HWF) for (let i = 0; i < M.nHamuli; i++) { const u = 3.0 + i * .075 * 1.0 * 1.0; const p = wxf(F, u, -.02, .02); I.add(p.map(v => v * MM), L.quatFromTo([0, 1, 0], mul(F.N, -1)), 1); }
    instances.hamuli = I; }

  // ================= legs =================
  const legs = {
    f: { hip: [4.0, 3.75, 1.05], tr: [4.35, 3.55, 1.45], knee: [5.35, 3.4, 2.9], ank: [6.1, 1.3, 3.4], b1: [6.8, .4, 3.55], end: [7.5, .12, 3.65] },
    m: { hip: [2.3, 3.5, 1.35], tr: [2.45, 3.3, 1.75], knee: [2.9, 3.3, 3.5], ank: [3.6, 1.1, 4.0], b1: [4.4, .3, 4.15], end: [5.2, .1, 4.25] },
    h: { hip: [.5, 3.5, 1.25], tr: [.3, 3.3, 1.65], knee: [-.7, 3.3, 3.5], ank: [-1.9, .7, 4.0], b1: [-3.4, .2, 4.5], end: [-4.2, .08, 4.7] },
  };
  const coxa = [], troch = [], femur = [], tibia = [], tars1 = [], tars = [], claws = [];
  const zs = (p, s) => [p[0], p[1], p[2] * s];
  for (const k of ['f', 'm', 'h']) for (const s of S) {
    const g = legs[k], P = n => zs(g[n], s);
    coxa.push(tubeM([zs([g.hip[0], g.hip[1] + .35, g.hip[2] * .6], s), P('hip'), P('tr')], t => .55 - .14 * t, 8, 0));
    troch.push(tubeM([P('tr'), add(P('tr'), mul(norm(sub(P('knee'), P('tr'))), .3))], .22, 8, 0));
    femur.push(tubeM([add(P('tr'), mul(norm(sub(P('knee'), P('tr'))), .2)), P('knee')], t => k === 'h' ? .44 + .08 * Math.sin(t * 3) : .36 + .05 * Math.sin(t * 3), 8, 0));
    if (k !== 'h') tibia.push(tubeM([P('knee'), P('ank')], t => .27 + .06 * Math.sin(t * 3) + .03 * t, 8, 0));
    if (k !== 'h') tars1.push(tubeM([P('ank'), P('b1')], t => .24 + .04 * Math.sin(t * 3), 8, 0));
    const tarP = [P('b1'), lerp3(P('b1'), P('end'), .33), lerp3(P('b1'), P('end'), .66), P('end')];
    for (let i = 0; i < 3; i++) tars.push(tubeM([tarP[i], tarP[i + 1]], .15 - .015 * i, 6, 0));
    // claws: a pair of small hooks and the pad between them
    const e = P('end'), d = norm(sub(P('end'), P('b1')));
    for (const c of [-1, 1]) { const side = norm(cross(d, [0, 1, 0])); claws.push(tubeM([e, add(e, add(mul(d, .18), mul(side, c * .08))), add(add(e, add(mul(d, .3), mul(side, c * .1))), [0, -.14, 0])], .035, 5, 0)); }
    claws.push(bnd(L.translate(L.ellipsoid(.16, .07, .12), add(e, add(mul(d, .12), [0, -.05, 0]))), [e[0] - .4, e[1] - .4, e[2] - .4], [e[0] + .4, e[1] + .4, e[2] + .4], .05, 1, 0));
  }
  meshes.coxa = fin(L.merge(...coxa)); meshes.trochanter = fin(L.merge(...troch)); meshes.femur = fin(L.merge(...femur)); meshes.tibia = fin(L.merge(...tibia)); meshes.basitarsus = fin(L.merge(...tars1)); meshes.tarsomeres = fin(L.merge(...tars)); meshes.claws = fin(L.merge(...claws));
  // hind leg: the flat tibia with the pollen basket (corbicula) on its outer face, and the broad first tarsal segment
  const hind = {};
  { const tpl = [], bas = [], corb = [], load = [], fringe = new L.Instances('bristle');
    for (const s of S) {
      const g = legs.h, a = zs(g.knee, s), b = zs(g.ank, s), u = norm(sub(b, a)), nOut = norm(sub([0, 0, s], mul(u, dot([0, 0, s], u)))), w = norm(cross(u, nOut)), ln = len(sub(b, a)), mid = lerp3(a, b, .5);
      const frame = (c, ru, rw, rn, dirU, dirN) => { const dw = norm(cross(dirU, dirN)); return p => { const q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; return Math.hypot(dot(q, dirU) / ru, dot(q, dw) / rw, dot(q, dirN) / rn) - 1; }; };   // ellipsoid in a leg-aligned frame (distance approximate)
      const ell = (c, ru, rw, rn, dirU, dirN) => { const f = frame(c, ru, rw, rn, dirU, dirN), m = Math.min(ru, rw, rn); return p => f(p) * m; };
      const tib = L.smoothUnion(.12, ell(add(a, mul(u, ln * .22)), ln * .27, .22, .17, u, nOut), ell(add(a, mul(u, ln * .62)), ln * .42, .55, .2, u, nOut));
      const bb = (c, r) => [[c[0] - r, c[1] - r, c[2] - r], [c[0] + r, c[1] + r, c[2] + r]];
      let [lo, hi] = bb(mid, ln * .8); tpl.push(bnd(tib, lo, hi, .08, 1));
      // corbicula: a smooth shallow dish on the outer face (the pollen basket), with a fringe of curved bristles round its rim
      const cc = add(add(mid, mul(u, ln * .08)), mul(nOut, .2)), dish = ell(cc, ln * .36, .42, .045, u, nOut); [lo, hi] = bb(cc, 1.4); corb.push(bnd(dish, lo, hi, .05, 1, 0));
      for (let i = 0; i < 26; i++) { const th = i / 26 * Math.PI * 2, pt = add(add(add(cc, mul(u, Math.cos(th) * ln * .36)), mul(w, Math.sin(th) * .42)), mul(nOut, .03)); const dir = norm(add(add(mul(nOut, .75), mul(w, Math.sin(th) * .65)), mul(u, Math.cos(th) * .3))); fringe.add(pt.map(v => v * MM), L.quatFromTo([0, 1, 0], dir), 1); }
      const lc = add(cc, mul(nOut, .38)); load.push(bnd(L.noiseDisplace(ell(lc, ln * .3, .4, .42, u, nOut), { amp: .06, freq: 3, octaves: 2, seed: 9 }), ...bb(lc, 1.3), .08, 1));
      // broad first tarsal segment (the pollen press and combs live on its inner face)
      const b1 = zs(g.b1, s), bu = norm(sub(b1, b)), bn = norm(sub([0, 0, s], mul(bu, dot([0, 0, s], bu)))), bl = len(sub(b1, b)), bm = lerp3(b, b1, .5);
      [lo, hi] = bb(bm, bl); bas.push(bnd(L.smoothUnion(.08, ell(bm, bl * .58, .36, .12, bu, bn), ell(add(b, mul(bu, bl * .15)), bl * .2, .16, .15, bu, bn)), lo, hi, .07, 1));
    }
    meshes.hind_tibia = fin(L.merge(...tpl)); meshes.hind_basitarsus = fin(L.merge(...bas)); meshes.corbicula = fin(L.merge(...corb)); meshes.pollen = fin(L.merge(...load));
    meshes.bristle = fin(L.tube([[0, 0, 0], [.04, .35, 0], [.1, .65, 0], [.2, .9, 0]], t => .016 * (1 - .7 * t), { sides: 4, caps: false }));
    instances.fringe = fringe; }
  // antenna cleaner on the foreleg: a notch with a comb of fine bristles on the first tarsal segment, closed by a spur on the tibia
  { const parts = []; for (const s of S) { const a = zs(legs.f.ank, s), b = zs(legs.f.b1, s), d = norm(sub(b, a)), inner = norm([-.4, .1, -s * .9]);
      const c0 = add(add(a, mul(d, .22)), mul(inner, .1)); const ring = L.intersect(L.translate(L.torus(.2, .05), c0), L.halfSpace(inner.map(v => -v), -dot(inner, c0) - 0));
      const spur = L.translate(L.rotate(L.ellipsoid(.22, .12, .04), [0, 0, 1], .5), add(add(a, mul(d, -.05)), mul(inner, .22)));
      parts.push(bnd(L.smoothUnion(.03, L.torus ? L.translate(L.torus(.2, .045), c0) : spur, spur), [a[0] - .6, a[1] - .6, a[2] - .6], [a[0] + .6, a[1] + .6, a[2] + .6], .05, 1, 0)); }
    meshes.cleaner = fin(L.merge(...parts)); }

  // ================= body hairs: branched (a shaft with side barbs), instanced =================
  { const sh = L.tube([[0, 0, 0], [0, .5, .015], [0, 1, 0]], t => .03 * (1 - .8 * t), { sides: 3, caps: false }), bm = L.newMesh(), q = (a, b, c) => { const k = bm.pos.length / 3; bm.pos.push(...a, ...b, ...c); bm.idx.push(k, k + 1, k + 2, k, k + 2, k + 1); };
    for (let k = 0; k < 3; k++) { const y = .3 + k * .22, l2 = .24 - k * .05; for (const sd of [-1, 1]) q([0, y, 0], [sd * l2, y + .22, .0], [0, y + .06, .02]); }
    meshes.hair = fin(L.merge(sh, bm)); }
  const hairs = new L.Instances('hair'), hairsMid = new L.Instances('hair');
  const placeHair = (sd, center, dirFn, n, lenFn, back = .55, midEvery = 4, when) => {
    let made = 0, guard = 0;
    while (made < n && guard++ < n * 6) {
      const dir = dirFn(); const o = add(center, mul(dir, 4)), h = L.surfaceHit(sd, o, mul(dir, -1), 8); if (!h) continue; if (when && !when(h.p)) continue;
      const nn = L.normalAt(sd, h.p), d2 = norm(add(mul(nn, 1 - back * .4), [-back, 0, 0])), q = L.quatMul(L.quatFromTo([0, 1, 0], d2), L.quatAxisAngle([0, 1, 0], R.range(0, 6.28))), l = lenFn(h.p);
      const p = add(h.p, mul(nn, -.03)).map(v => v * MM); hairs.add(p, q, l); if (made % midEvery === 0) hairsMid.add(p, q, l * 1.9); made++;
    }
    return made;
  };
  const sphDir = () => R.unitVec();
  const nT = placeHair(thoraxAll, [2.4, 5.2, 0], sphDir, 2400, p => R.range(.65, 1.1) * (p[1] > 5 ? 1 : .8), .85, 4, p => p[1] > 3.9);
  const nH = placeHair(L.union(headS, eyesBoth), [6, 5.3, 0], sphDir, 220, () => R.range(.25, .45), .4, 3, p => p[1] > 3.8);
  // abdomen: short hairs, denser in a band along the rear edge of each segment
  let nA = 0; for (let i = 0; i < M.nAbd; i++) for (let k = 0; k < 150; k++) { const x = segX[i] - R.range(.0, k % 3 ? .35 : 1.1), th = R.range(0, Math.PI * 2), dir = [0, Math.cos(th), Math.sin(th)], c = [x, 4.3 + (-3.7 - x) * -.05, 0], h = L.surfaceHit(abdS, add(c, mul(dir, 3.4)), mul(dir, -1), 8); if (!h) continue; const nn = L.normalAt(abdS, h.p), d2 = norm(add(mul(nn, .6), [-.6, 0, 0])), q = L.quatMul(L.quatFromTo([0, 1, 0], d2), L.quatAxisAngle([0, 1, 0], R.range(0, 6.28))), l = R.range(.28, .5), p = add(h.p, mul(nn, -.02)).map(v => v * MM); hairs.add(p, q, l); if (k % 4 === 0) hairsMid.add(p, q, l * 2); nA++; }
  instances.hairs = hairs; instances.hairs_mid = hairsMid; log.push(`hairs: thorax ${nT}, head ${nH}, abdomen ${nA}; mid ${hairsMid.count}`);

  // ================= flight muscles and other muscles =================
  { const dlm = S.map(s => bnd(E([2.4, 5.65, s * .6], [1.55, .95, .52]), [.7, 4.5, s > 0 ? 0 : -1.3], [4.2, 6.8, s > 0 ? 1.3 : 0], .11, 1));
    meshes.dlm = fin(L.merge(...dlm));
    const dvm = []; for (const s of S) for (const x of [3.35, 1.55]) dvm.push(bnd(E([x, 5.0, s * 1.15], [.5, 1.35, .42], 0), [x - .8, 3.4, s > 0 ? .6 : -1.8], [x + .8, 6.6, s > 0 ? 1.8 : -.6], .1, 1));
    meshes.dvm = fin(L.merge(...dvm));
    const lg = []; for (const k of ['f', 'm', 'h']) for (const s of S) { const g = legs[k]; lg.push(bnd(E([g.hip[0], g.hip[1] + .2, s * .75], [.4, .5, .3]), [g.hip[0] - .6, g.hip[1] - .5, s > 0 ? .2 : -1.3], [g.hip[0] + .6, g.hip[1] + 1, s > 0 ? 1.3 : -.2], .1, 1)); }
    meshes.leg_muscles = fin(L.merge(...lg));
    const jaw = S.map(s => bnd(E([6.05, 5.1, s * .98], [.55, .7, .36]), [5.3, 4.2, s > 0 ? .5 : -1.5], [6.8, 6.0, s > 0 ? 1.5 : -.5], .1, 1)); meshes.jaw_muscles = fin(L.merge(...jaw)); }

  // ================= nervous system =================
  { const bn = L.smoothUnion(.12, E([5.85, 5.8, 0], [.52, .62, .72]), E([5.95, 5.95, 0], [.4, .35, .35]));
    meshes.brain = fin(L.bakeShade(bnd(bn, [5.0, 4.9, -1.0], [6.7, 6.8, 1.0], .09, 1), aoShade(bn, 1, .12, .5)));
    meshes.optic_lobes = fin(L.merge(...S.map(s => bnd(E([5.95, 5.55, s * 1.05], [.36, .85, .45]), [5.3, 4.5, s > 0 ? .4 : -1.7], [6.6, 6.6, s > 0 ? 1.7 : -.4], .09, 1))));
    meshes.antennal_lobes = fin(L.merge(...S.map(s => bnd(E([6.45, 5.2, s * .32], [.2, .22, .2]), [6.0, 4.8, s > 0 ? 0 : -.7], [6.9, 5.6, s > 0 ? .7 : 0], .035, 1, 0))));
    // mushroom bodies: two cup-shaped calyces on top of each half-brain, joined by a stalk to the lobes (here shown as one folded tube)
    const mb = []; for (const s of S) { for (const dz of [.28, .62]) mb.push(bnd(L.subtract(E([5.82, 6.3, s * dz], [.2, .16, .2]), E([5.82, 6.42, s * dz], [.12, .1, .12])), [5.4, 5.9, s > 0 ? 0 : -1], [6.3, 6.8, s > 0 ? 1 : 0], .03, 1, 0));
      mb.push(tubeM([[5.82, 6.2, s * .45], [6.0, 5.7, s * .4], [6.25, 5.55, s * .32], [6.55, 5.4, s * .28]], .09, 6, 16)); mb.push(tubeM([[6.25, 5.55, s * .32], [6.3, 6.15, s * .26]], .07, 6, 0)); }
    meshes.mushroom_bodies = fin(L.merge(...mb));
    // ventral nerve cord: suboesophageal ganglion, thoracic ganglia, abdominal ganglia (the number drawn is schematic), joined by paired connectives
    const gang = [[6.05, 4.3, 0, .42, .28, .42], [4.25, 3.95, 0, .4, .24, .42], [1.9, 3.75, 0, .75, .28, .5], [-1.2, 3.2, 0, .3, .2, .3], [-2.6, 3.1, 0, .3, .2, .3], [-4.0, 3.0, 0, .3, .2, .3], [-5.3, 3.0, 0, .32, .2, .32]];
    const gm = gang.map(g => bnd(E([g[0], g[1], g[2]], [g[3], g[4], g[5]]), [g[0] - g[3] - .1, g[1] - g[4] - .1, -g[5] - .1], [g[0] + g[3] + .1, g[1] + g[4] + .1, g[5] + .1], .08, 1, 0));
    meshes.ganglia = fin(L.merge(...gm));
    const cn = []; for (let i = 0; i < gang.length - 1; i++) for (const s of S) cn.push(tubeM([[gang[i][0] - gang[i][3] * .8, gang[i][1], s * .1], [gang[i + 1][0] + gang[i + 1][3] * .8, gang[i + 1][1], s * .1]], .05, 5, 0));
    for (const s of S) cn.push(tubeM([[6.05, 4.5, s * .2], [6.0, 5.2, s * .4], [5.85, 5.55, s * .35]], .06, 5, 10));   // circumoesophageal connectives
    for (const s of S) { cn.push(tubeM([[6.4, 5.35, s * .3], [6.8, 5.4, s * .5], [6.95, 5.35, s * .55]], .045, 5, 8)); }   // antennal nerves
    meshes.nerves = fin(L.merge(...cn)); }

  // ================= gut, heart, glands =================
  { const oes = tubeM([[7.0, 3.95, 0], [6.5, 4.3, 0], [5.6, 4.55, 0], [4.6, 4.5, 0], [3.2, 4.45, 0], [1.6, 4.4, 0], [.3, 4.4, 0], [-.4, 4.45, 0]], .13, 7, 36);
    meshes.oesophagus = fin(oes);
    const crop = L.smoothUnion(.2, E([-1.55, 4.45, 0], [1.4, 1.1, 1.05]), E([-1.9, 4.4, 0], [1.2, 1.15, 1.1]));
    meshes.crop = fin(L.bakeShade(bnd(crop, [-3.2, 3.1, -1.4], [.2, 5.8, 1.4], .13, 1), aoShade(crop, 1, .15, .5)));
    meshes.proventriculus = fin(L.merge(bnd(E([-3.1, 4.3, 0], [.3, .35, .35]), [-3.6, 3.8, -.5], [-2.6, 4.8, .5], .06, 1, 0), tubeM([[-3.3, 4.3, 0], [-3.6, 4.3, 0]], .16, 6, 0)));
    meshes.midgut = fin(tubeM([[-3.5, 4.3, 0], [-4.1, 4.5, .55], [-4.8, 4.3, .5], [-5.1, 3.9, 0], [-4.6, 3.6, -.5], [-3.9, 3.7, -.35]], t => .56 + .05 * Math.sin(t * 22), 9, 40));
    // Malpighian tubules: many fine tubes leaving the gut where midgut meets hindgut and winding through the body cavity (the real count is larger; this is a sample)
    const mt = []; const rr = L.rng(77); for (let i = 0; i < 22; i++) { const a0 = [-3.9 + rr.range(-.1, .1), 3.7, -.35 + rr.range(-.1, .1)], pts = [a0]; let p = a0.slice(), d = norm([rr.range(-1, .3), rr.range(-.3, .6), rr.range(-1, 1)]);
      for (let k = 0; k < 7; k++) { d = norm(add(d, [rr.range(-.7, .7), rr.range(-.7, .7), rr.range(-.7, .7)])); p = add(p, mul(d, .5)); p = [Math.max(-5.9, Math.min(-1.2, p[0])), Math.max(2.9, Math.min(5.4, p[1])), Math.max(-1.4, Math.min(1.4, p[2]))]; pts.push(p.slice()); }
      mt.push(tubeM(pts, .018, 4, 24, false)); }
    meshes.malpighian = fin(L.merge(...mt));
    meshes.hindgut = fin(L.merge(tubeM([[-3.9, 3.7, -.35], [-4.7, 3.3, -.55], [-5.4, 3.65, -.2], [-5.8, 4.0, 0]], .17, 7, 18), bnd(E([-6.0, 4.05, 0], [.55, .45, .45]), [-6.7, 3.4, -.6], [-5.3, 4.7, .6], .05, 1, 0), tubeM([[-6.4, 4.05, 0], [-6.65, 4.05, 0]], .12, 6, 0)));
    // dorsal vessel: the "heart" is the chambered part in the abdomen; the aorta runs forward through the thorax to the head
    const hp = sp([[-6.1, 5.0, 0], [-5.0, 5.55, 0], [-3.0, 5.85, 0], [-1.2, 5.95, 0], [.2, 6.0, 0], [1.2, 6.55, 0], [2.7, 6.75, 0], [4.2, 6.5, 0], [5.3, 6.35, 0], [6.1, 6.25, 0]], 70);
    meshes.heart = fin(tubeM(hp, t => { const x = hp[Math.round(t * 69)][0]; return x < -.2 ? .2 + .07 * Math.sin((x + 6) * 3.6) ** 2 : .075; }, 8, 0));
    // hypopharyngeal glands: strings of grape-like acini coiled in the head in front of the brain
    const hg = []; for (const s of S) { const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([6.35 + .35 * Math.sin(t * 17) * .5 + .2 * t, 4.7 + 1.0 * t + .12 * Math.sin(t * 29), s * (.45 + .3 * Math.cos(t * 17))]); }
      hg.push(tubeM(pts, t => .06 + .05 * Math.abs(Math.sin(t * 55)), 6, 0)); }
    meshes.hpg = fin(L.merge(...hg));
    meshes.ovaries = fin(L.merge(...S.map(s => bnd(L.smoothUnion(.05, E([-4.6, 5.0, s * .85], [.4, .15, .2]), E([-4.0, 5.1, s * .75], [.25, .12, .15])), [-5.3, 4.6, s > 0 ? .4 : -1.4], [-3.5, 5.5, s > 0 ? 1.4 : -.4], .07, 1, 0))));
    // sting apparatus: venom sac with duct, the stylet (a shaft and two barbed lancets) retracted inside the tip of the abdomen
    const stylet = sp([[-5.7, 3.2, 0], [-6.1, 3.15, 0], [-6.5, 3.05, 0], [-6.75, 2.95, 0]], 14);
    meshes.sting = fin(L.merge(tubeM(stylet, t => .11 * (1 - .75 * t) + .02, 6, 0), bnd(L.smoothUnion(.1, E([-5.55, 3.3, 0], [.4, .32, .28])), [-6.1, 2.7, -.5], [-5.0, 3.9, .5], .04, 1, 0)));
    meshes.venom_sac = fin(L.merge(bnd(E([-5.1, 3.65, 0], [.55, .45, .42]), [-5.8, 3.0, -.6], [-4.4, 4.3, .6], .07, 1, 0), tubeM([[-4.6, 3.75, 0], [-4.2, 3.95, 0], [-3.9, 4.05, .3]], .06, 5, 8)));
    const barb = L.lathe([[.045, 0], [.0, .28]], { segments: 5, caps: false }); meshes.barb = fin(barb); const bi = new L.Instances('barb'); const sc = L.spline(stylet);
    for (let i = 0; i < 9; i++) for (const s of S) { const t = .5 + i * .055, p = sc(t), tg = norm(sub(sc(Math.min(1, t + .02)), sc(t - .02))); const dirB = norm(add(mul(tg, -1), [0, 0, s * 1.4])); bi.add([p[0], p[1] - .03, p[2] + s * .045].map(v => v * MM), L.quatFromTo([0, 1, 0], dirB), 1); }
    instances.barbs = bi;
    // wax glands: four pairs of oval "mirrors" on the underside, under the segments
    const wx = []; for (let i = 1; i < 5; i++) for (const s of S) { const x = (segX[i] + segX[i + 1]) / 2 + .1, h = L.surfaceHit(abdS, [x, 0, s * .85], [0, 1, 0], 6); if (h) wx.push(L.translate(L.ellipsoid(.5, .07, .4), [h.p[0], h.p[1] + .05, h.p[2]])); }
    meshes.wax = fin(bnd(L.union(...wx), [-6.2, 2.0, -1.5], [-.8, 3.6, 1.5], .1, 1, 0));
    // Nasonov gland: a band of gland cells under the rear edge of the last tergite, on the back
    { const h = L.surfaceHit(abdS, [-5.65, 8, 0], [0, -1, 0], 8); meshes.nasonov = fin(bnd(E([-5.65, h ? h.p[1] - .2 : 5, 0], [.4, .09, .75]), [-6.2, (h ? h.p[1] : 5.2) - .6, -1.0], [-5.1, (h ? h.p[1] : 5.2) + .2, 1.0], .07, 1, 0)); log.push('nasonov y ' + (h ? h.p[1].toFixed(2) : 'n/a')); }
  }

  // ================= breathing tubes =================
  { const sacs = []; for (const s of S) { sacs.push(bnd(E([-2.9, 4.4, s * 1.2], [1.5, .85, .42]), [-4.6, 3.4, s > 0 ? .5 : -1.9], [-1.2, 5.5, s > 0 ? 1.9 : -.5], .12, 1)); sacs.push(bnd(E([-4.9, 4.2, s * .95], [.7, .6, .35]), [-5.8, 3.5, s > 0 ? .5 : -1.5], [-4.0, 5.0, s > 0 ? 1.5 : -.5], .1, 1)); sacs.push(bnd(E([1.2, 4.2, s * 1.0], [.6, .6, .4]), [.4, 3.4, s > 0 ? .5 : -1.6], [2.0, 5.0, s > 0 ? 1.6 : -.5], .1, 1)); sacs.push(bnd(E([5.5, 6.0, s * .75], [.5, .45, .35]), [4.9, 5.4, s > 0 ? .3 : -1.2], [6.1, 6.6, s > 0 ? 1.2 : -.3], .1, 1)); }
    meshes.air_sacs = fin(L.merge(...sacs));
    const spPos = []; const tr = [], rings = new L.Instances('spiracle');
    for (const s of S) {
      const sprs = [[3.95, 5.45], [2.0, 4.3], [.7, 4.9]].map(([x, y]) => { const h = L.surfaceHit(thoraxAll, [x, y, s * 4], [0, 0, -s], 6); return h ? h.p : [x, y, s * 1.6]; });
      for (let i = 0; i < 6; i++) { const x = (segX[i] + segX[i + 1]) / 2, h = L.surfaceHit(abdS, [x, 4.15, s * 4], [0, 0, -s], 6); sprs.push(h ? [h.p[0], h.p[1] - .1, h.p[2]] : [x, 4.1, s * 1.7]); }
      sprs.forEach((p, i) => { const nn = i < 3 ? L.normalAt(thoraxAll, p) : L.normalAt(abdS, p); rings.add(p.map(v => v * MM), L.quatFromTo([0, 1, 0], nn), 1); spPos.push(p); tr.push(tubeM([p, [p[0], p[1] - .02, s * (Math.abs(p[2]) - .45)], [p[0] + .05, Math.max(3.9, p[1] - .2), s * 1.05]], .045, 5, 0)); });
      // longitudinal trunk on each side, with the head tube and the lateral branches into the legs and wings
      tr.push(tubeM([[5.6, 6.0, s * .8], [4.4, 5.3, s * 1.2], [2.8, 4.6, s * 1.3], [1.3, 4.5, s * 1.1], [-.4, 4.6, s * 1.1], [-2.2, 4.55, s * 1.2], [-4.0, 4.4, s * 1.05], [-5.4, 4.1, s * .85]], .1, 7, 40));
      tr.push(tubeM([[2.8, 4.7, s * 1.3], [2.9, 5.9, s * 1.4], [2.9, 6.8, s * 1.4]], .05, 5, 8));       // toward the wing base
      for (const [x, z0] of [[4.2, 1.2], [2.4, 1.3], [.4, 1.2]]) tr.push(tubeM([[x, 4.2, s * z0], [x, 3.7, s * (z0 + .3)]], .045, 5, 0));   // into the legs
      tr.push(tubeM([[5.6, 6.0, s * .8], [6.0, 5.2, s * 1.4], [5.9, 5.6, s * 1.6]], .05, 5, 8));   // head, toward the eye
    }
    meshes.trachea = fin(L.merge(...tr)); meshes.spiracle = fin(L.lathe([[.12, 0], [.11, .04], [.07, .045], [.07, .0]], { segments: 8, caps: false })); instances.spiracles = rings; log.push('spiracle positions ' + spPos.length); }

  // ================= thing description =================
  const SYS = [{ id: 'cuticle', label: 'Exoskeleton' }, { id: 'wings', label: 'Wings' }, { id: 'hairs', label: 'Body hairs' }, { id: 'muscles', label: 'Muscles' }, { id: 'organs', label: 'Organs and glands' }, { id: 'nerves', label: 'Nervous system' }, { id: 'tracheal', label: 'Breathing tubes' }];
  const CUT_ALL = { cuticle: 1, wings: .25, muscles: 1, organs: 1, nerves: 1, tracheal: 1, hairs: 0 };
  const CUT_LEGEND = { title: 'Colours on the cut face', items: [
    { name: 'Exoskeleton', color: '#7a5632', node: 'bee_cuticle' }, { name: 'Flight and other muscle', color: '#c0463a', node: 'bee_flight_muscles' }, { name: 'Brain and nerves', color: '#f2e8cf', node: 'bee_brain' },
    { name: 'Gut', color: '#e0b25a', node: 'bee_midgut' }, { name: 'Glands', color: '#f6e3a8', node: 'bee_hypopharyngeal_gland' }, { name: 'Heart', color: '#d25a4a', node: 'bee_heart' }, { name: 'Air tubes and sacs', color: '#eaf4f8', node: 'bee_tracheae' }],
    note: 'These colours only mark the kind of tissue; they are not what the tissue looks like.' };
  const modes = [
    { id: 'outside', label: 'Outside', show: { cuticle: 1, wings: 1, hairs: 1 } },
    { id: 'shell', label: 'Exoskeleton only', show: { cuticle: 1, wings: 1 } },
    { id: 'muscles', label: 'Muscles and flight', show: { cuticle: .09, wings: .35, muscles: 1 } },
    { id: 'organs', label: 'Organs', show: { cuticle: .09, wings: .15, organs: 1 } },
    { id: 'nerves', label: 'Nerves', show: { cuticle: .09, nerves: 1 } },
    { id: 'breath', label: 'Breathing tubes', show: { cuticle: .09, tracheal: 1 } },
    { id: 'cut_head', label: 'Cut open: head', cut: { at: [6, 5, 0] }, hotspots: true, legend: CUT_LEGEND, show: CUT_ALL },
    { id: 'cut_thorax', label: 'Cut open: thorax', cut: { at: [2.4, 5, 0] }, hotspots: true, legend: CUT_LEGEND, show: CUT_ALL },
    { id: 'cut_abdomen', label: 'Cut open: abdomen', cut: { at: [-3, 4, 0] }, hotspots: true, legend: CUT_LEGEND, show: CUT_ALL },
  ];
  const col = { head: '#2a1f16', eye: '#86663f', hairc: '#cdb88a', amber: '#c9862a', dark: '#4b3320', leg: '#4a3322', tars: '#7b5330', wing: '#e3eaee', vein: '#7e8a8f' };
  const P = (id, name, system, node, color, mesh, extra = {}) => ({ id, name, system, node, color, mesh, lod: 'near+mid', ...extra });
  const I = (id, name, system, node, color, inst, extra = {}) => ({ id, name, system, node, color, instances: inst, lod: 'near+mid', ...extra });
  const abdCol = ['#c9862a', '#c58327', '#8a5a22', '#6d4720', '#4f3520', '#3d2a1c'];
  const parts = [
    P('head', 'Head capsule', 'cuticle', 'bee_head', col.head, 'head', { priority: 1.6, deeper: { type: 'tissue2', id: 'bee_cuticle', D: 9e-5, button: 'Look inside the exoskeleton' } }),
    P('eye_l', 'Compound eye (left)', 'cuticle', 'bee_compound_eye', col.eye, 'eye_l', { priority: 1.7, deeper: { type: 'tissue2', id: 'bee_eye', D: 3.6e-4, button: 'Look inside the compound eye' } }),
    P('eye_r', 'Compound eye (right)', 'cuticle', 'bee_compound_eye', col.eye, 'eye_r', { priority: 1.7, deeper: { type: 'tissue2', id: 'bee_eye', D: 3.6e-4, button: 'Look inside the compound eye' } }),
    P('ocelli', 'Ocelli (three simple eyes)', 'cuticle', 'bee_ocelli', '#d9c9a0', 'ocelli', { priority: 2.2 }),
    P('ant_scape', 'Antenna: scape', 'cuticle', 'bee_antenna', '#3d2b1e', 'ant_scape', { priority: 2 }),
    P('ant_pedicel', 'Antenna: pedicel', 'cuticle', 'bee_antenna', '#3d2b1e', 'ant_pedicel', { priority: 2.2 }),
    P('ant_flagellum', 'Antenna: flagellum', 'cuticle', 'bee_antenna', '#4a3524', 'ant_flagellum', { priority: 2 }),
    P('mandibles', 'Mandibles', 'cuticle', 'bee_mandibles', '#6b4a2a', 'mandibles', { priority: 2.2 }),
    P('glossa', 'Proboscis: tongue (glossa)', 'cuticle', 'bee_proboscis', '#a9814d', 'glossa', { priority: 2.2 }),
    P('sheath', 'Proboscis: sheath (galeae and labial palps)', 'cuticle', 'bee_proboscis', '#7a5a35', 'sheath', { priority: 2.2 }),
    P('prothorax', 'Thorax: prothorax', 'cuticle', 'bee_thorax', '#3a2a1c', 'prothorax', { priority: 1.7 }),
    P('mesothorax', 'Thorax: mesothorax', 'cuticle', 'bee_thorax', '#3a2a1c', 'mesothorax', { priority: 1.6, deeper: { type: 'tissue2', id: 'bee_cuticle', D: 9e-5, button: 'Look inside the exoskeleton' } }),
    P('metathorax', 'Thorax: metathorax and propodeum', 'cuticle', 'bee_thorax', '#3a2a1c', 'metathorax', { priority: 1.7 }),
    P('tegulae', 'Tegulae', 'cuticle', 'bee_wing_hinge', '#6b4a2a', 'tegulae', { priority: 2.2 }),
    P('wing_hinge', 'Wing hinge (sclerites)', 'cuticle', 'bee_wing_hinge', '#8a6a3a', 'wing_hinge', { priority: 2.3 }),
    P('forewings', 'Forewings', 'wings', 'bee_wings', col.wing, 'forewings', { priority: 1.8, opacity_max: .5, solid: false, noink: true }),
    P('hindwings', 'Hindwings', 'wings', 'bee_wings', col.wing, 'hindwings', { priority: 1.9, opacity_max: .5, solid: false, noink: true }),
    P('veins', 'Wing veins', 'wings', 'bee_wings', col.vein, 'veins', { priority: 2.1, solid: false, noink: true }),
    I('hamuli', 'Hamuli (wing-coupling hooks)', 'wings', 'bee_hamuli', '#5b6468', 'hamuli', { priority: 2.5 }),
    P('coxa', 'Leg: coxa', 'cuticle', 'bee_leg', col.leg, 'coxa', { priority: 2 }),
    P('trochanter', 'Leg: trochanter', 'cuticle', 'bee_leg', col.leg, 'trochanter', { priority: 2.1 }),
    P('femur', 'Leg: femur', 'cuticle', 'bee_leg', col.leg, 'femur', { priority: 2 }),
    P('tibia', 'Leg: tibia (front and middle legs)', 'cuticle', 'bee_leg', '#4f3623', 'tibia', { priority: 2 }),
    P('hind_tibia', 'Hind leg: tibia', 'cuticle', 'bee_leg', '#5a3d27', 'hind_tibia', { priority: 2 }),
    P('basitarsus', 'Leg: first tarsal segment (front and middle legs)', 'cuticle', 'bee_leg', col.tars, 'basitarsus', { priority: 2 }),
    P('hind_basitarsus', 'Hind leg: first tarsal segment', 'cuticle', 'bee_leg', '#7b5330', 'hind_basitarsus', { priority: 2 }),
    P('tarsomeres', 'Leg: small tarsal segments', 'cuticle', 'bee_foot', col.tars, 'tarsomeres', { priority: 2.1 }),
    P('claws', 'Foot: claws and pad (pretarsus)', 'cuticle', 'bee_foot', '#2e2118', 'claws', { priority: 2.3 }),
    P('corbicula', 'Pollen basket (corbicula)', 'cuticle', 'bee_pollen_basket', '#2c2118', 'corbicula', { priority: 2.4 }),
    I('fringe', 'Pollen basket: fringe hairs', 'cuticle', 'bee_pollen_basket', '#9a7a48', 'fringe', { priority: 2.5 }),
    P('pollen', 'Pollen load', 'cuticle', 'bee_pollen_load', '#d79a22', 'pollen', { priority: 2.2 }),
    P('cleaner', 'Antenna cleaner (foreleg notch and spur)', 'cuticle', 'bee_antenna_cleaner', '#a2733f', 'cleaner', { priority: 2.6 }),
    ...Array.from({ length: M.nAbd }, (_, i) => P('abd' + (i + 1), `Abdomen: visible segment ${i + 1} of 6 (abdominal segment ${i + 2})`, 'cuticle', 'bee_abdomen', abdCol[i], 'abd' + (i + 1), { priority: 1.6, deeper: i === 2 ? { type: 'tissue2', id: 'bee_cuticle', D: 9e-5, button: 'Look inside the exoskeleton' } : undefined })),
    I('hairs', 'Body hairs (branched)', 'hairs', 'bee_hairs', col.hairc, 'hairs', { lod: 'near', tint: .25, priority: 2.4 }),
    I('hairs_mid', 'Body hairs (branched)', 'hairs', 'bee_hairs', col.hairc, 'hairs_mid', { lod: 'mid', tint: .2, priority: 2.4 }),
    P('body_far', 'Honey bee', 'cuticle', 'park_bee', '#7c5a2b', 'body_far', { lod: 'far', far_of: 'head', priority: 1.5 }),
    // muscles
    P('dlm', 'Dorsal longitudinal flight muscles', 'muscles', 'bee_flight_muscles', '#c6564a', 'dlm', { priority: 1.8, deeper: { type: 'tissue2', id: 'bee_flight_muscle', D: 3.2e-4, button: 'Look inside flight muscle' } }),
    P('dvm', 'Dorsoventral flight muscles', 'muscles', 'bee_flight_muscles', '#d1665a', 'dvm', { priority: 1.8, deeper: { type: 'tissue2', id: 'bee_flight_muscle', D: 3.2e-4, button: 'Look inside flight muscle' } }),
    P('leg_muscles', 'Leg muscles in the thorax', 'muscles', 'bee_other_muscles', '#b94d44', 'leg_muscles', { priority: 2 }),
    P('jaw_muscles', 'Jaw (mandible) muscles', 'muscles', 'bee_other_muscles', '#b94d44', 'jaw_muscles', { priority: 2 }),
    // nerves
    P('brain', 'Brain', 'nerves', 'bee_brain', '#e8dcc0', 'brain', { priority: 1.8, opacity_max: .55 }),
    P('optic_lobes', 'Optic lobes', 'nerves', 'bee_brain', '#dccfae', 'optic_lobes', { priority: 1.9 }),
    P('antennal_lobes', 'Antennal lobes', 'nerves', 'bee_brain', '#f0e4c8', 'antennal_lobes', { priority: 2.1 }),
    P('mushroom_bodies', 'Mushroom bodies', 'nerves', 'bee_mushroom_bodies', '#e29a52', 'mushroom_bodies', { priority: 2 }),
    P('ganglia', 'Ganglia of the nerve cord (a worker has one more abdominal ganglion than drawn)', 'nerves', 'bee_nerve_cord', '#eadcb8', 'ganglia', { priority: 1.9 }),
    P('nerves', 'Nerve cord and nerves', 'nerves', 'bee_nerve_cord', '#e0d2ac', 'nerves', { priority: 2, solid: true }),
    // organs
    P('oesophagus', 'Oesophagus', 'organs', 'bee_oesophagus', '#d9b97c', 'oesophagus', { priority: 2 }),
    P('crop', 'Crop (honey stomach)', 'organs', 'bee_crop', '#e8c474', 'crop', { priority: 1.7, opacity_max: .85, deeper: { type: 'tissue2', id: 'bee_crop', D: 5e-4, button: 'Look at what the crop carries' } }),
    P('proventriculus', 'Proventriculus', 'organs', 'bee_proventriculus', '#c99a58', 'proventriculus', { priority: 2.1 }),
    P('midgut', 'Midgut', 'organs', 'bee_midgut', '#c68d4a', 'midgut', { priority: 1.8 }),
    P('malpighian', 'Malpighian tubules (22 drawn as a sample; a worker has about 100)', 'organs', 'bee_malpighian', '#e9e2a8', 'malpighian', { priority: 2.2, solid: false }),
    P('hindgut', 'Hindgut and rectum', 'organs', 'bee_hindgut', '#9a7a4a', 'hindgut', { priority: 2 }),
    P('heart', 'Dorsal vessel (heart and aorta)', 'organs', 'bee_heart', '#d86a5a', 'heart', { priority: 1.9 }),
    P('hpg', 'Hypopharyngeal glands', 'organs', 'bee_hypopharyngeal_gland', '#f0d9a2', 'hpg', { priority: 2 }),
    P('ovaries', 'Ovaries (reduced in a worker)', 'organs', 'bee_ovaries', '#e6d8c0', 'ovaries', { priority: 2.1 }),
    P('venom_sac', 'Venom sac', 'organs', 'bee_venom_sac', '#d8c25a', 'venom_sac', { priority: 2 }),
    P('sting', 'Sting (stylet and lancets)', 'organs', 'bee_sting', '#5a3a1e', 'sting', { priority: 1.9 }),
    I('barbs', 'Sting barbs', 'organs', 'bee_sting', '#3a2412', 'barbs', { priority: 2.4 }),
    P('wax', 'Wax glands (wax mirrors, abdominal segments 4 to 7)', 'organs', 'bee_wax_glands', '#efe6c8', 'wax', { priority: 2.1 }),
    P('nasonov', 'Nasonov gland', 'organs', 'bee_nasonov', '#f3b13c', 'nasonov', { priority: 2.2 }),
    // breathing
    P('trachea', 'Tracheae (breathing tubes)', 'tracheal', 'bee_tracheae', '#cfe6ef', 'trachea', { priority: 2.1 }),
    P('air_sacs', 'Air sacs', 'tracheal', 'bee_air_sacs', '#e6f1f6', 'air_sacs', { priority: 1.9, opacity_max: .75 }),
    I('spiracles', 'Spiracles (9 pairs drawn; a worker has 10)', 'tracheal', 'bee_spiracles', '#2a2018', 'spiracles', { priority: 2.5 }),
  ];
  // spiracles sit on the outer surface: they belong to the cuticle visually, but are listed under breathing tubes (shown faintly in the shell view)
  const hs = (id, node, at, label, modes) => ({ id, node, at: at.map(v => +(v * MM).toFixed(6)), label, r: .00018, modes });
  const thing = {
    id: 'bee', title: 'Honey bee worker', label: 'Honey bee', scientific: 'Apis mellifera', node: 'park_bee', main_part: 'mesothorax',
    blurb: 'A western honey bee worker, about 14 mm long, drinking from a flower. Zoom right in: she is modelled at about her real size. Click any part.',
    model_note: 'A model built from published measurements and typical proportions of a worker, not a scan of one bee. The overall length, eye, ocelli and wing sizes come from sources named on the cards; the rest, including the legs, mouthparts and organs, are proportions drawn by eye from photographs and anatomical drawings. Some counts are simplified: the model draws fewer ganglia, spiracle pairs and Malpighian tubules than a real worker has, and the cards say by how many. The bee is shown still, wings folded, as she stands on a flower; internal organs are placed and sized approximately. Where the wing beat is animated it is slowed about 100 times (a real wing beats about 230 times a second).',
    size_m: { length: .0139, width: .0094, height: .0072 }, height_m: .0075, radius_m: .0125, draw_m: 40,
    seed: 4242, systems: SYS, modes, lod: { near_m: .25, far_m: 1.5 },
    cut: { default: 'cuticle', at: [2, 5, 0], faces: {
      cuticle: { kind: 'plain', palette: [[0x7a5632, 1]] },
      muscle: { kind: 'grains', cell: .00007, edge: .4, palette: [[0xc0463a, .5], [0xd36a5c, .3], [0xa83a30, .2]], note: 'Cut face colours are only a code for tissue type; they are not what the real tissue looks like.' },
      nerve: { kind: 'plain', palette: [[0xf2e8cf, 1]] }, gut: { kind: 'plain', palette: [[0xe0b25a, 1]] }, gland: { kind: 'plain', palette: [[0xf6e3a8, 1]] }, air: { kind: 'plain', palette: [[0xeaf4f8, 1]] }, heart: { kind: 'plain', palette: [[0xd25a4a, 1]] } } },
    hotspots: [
      hs('hs_eye', 'bee_compound_eye', [5.9, 5.55, 1.25], 'Compound eye', ['cut_head']), hs('hs_brain', 'bee_brain', [5.85, 5.8, .0], 'Brain', ['cut_head']), hs('hs_mb', 'bee_mushroom_bodies', [5.85, 6.35, .0], 'Mushroom bodies', ['cut_head']),
      hs('hs_hpg', 'bee_hypopharyngeal_gland', [6.45, 5.2, .0], 'Hypopharyngeal glands', ['cut_head']), hs('hs_mouth', 'bee_proboscis', [7.45, 3.5, 0], 'Mouthparts', ['cut_head']),
      hs('hs_dlm', 'bee_flight_muscles', [2.4, 5.7, 0], 'Flight muscles', ['cut_thorax']), hs('hs_dvm', 'bee_flight_muscles', [3.4, 4.7, 0], 'Flight muscles (up and down)', ['cut_thorax']), hs('hs_hinge', 'bee_wing_hinge', [2.5, 6.9, 0], 'Wing hinge', ['cut_thorax']),
      hs('hs_gang', 'bee_nerve_cord', [1.9, 3.75, 0], 'Thoracic ganglion', ['cut_thorax']),
      hs('hs_crop', 'bee_crop', [-1.6, 4.5, 0], 'Crop (honey stomach)', ['cut_abdomen']), hs('hs_mid', 'bee_midgut', [-4.3, 4.3, 0], 'Midgut', ['cut_abdomen']), hs('hs_heart', 'bee_heart', [-3.0, 5.85, 0], 'Heart (dorsal vessel)', ['cut_abdomen']), hs('hs_sting', 'bee_sting', [-6.1, 3.15, 0], 'Sting', ['cut_abdomen']), hs('hs_venom', 'bee_venom_sac', [-5.1, 3.65, 0], 'Venom sac', ['cut_abdomen']),
    ],
    parts,
  };
  // Picking: the framework takes the nearest visible un-clipped hit (like the human), so no per-layer priorities are needed.
  // cut-face patterns per part: muscles, nerves, gut ... (cutFace keys above)
  const cf = { dlm: 'muscle', dvm: 'muscle', leg_muscles: 'muscle', jaw_muscles: 'muscle', brain: 'nerve', optic_lobes: 'nerve', antennal_lobes: 'nerve', mushroom_bodies: 'nerve', ganglia: 'nerve', nerves: 'nerve', crop: 'gut', midgut: 'gut', hindgut: 'gut', oesophagus: 'gut', proventriculus: 'gut', hpg: 'gland', venom_sac: 'gland', ovaries: 'gland', wax: 'gland', nasonov: 'gland', heart: 'heart', air_sacs: 'air', trachea: 'air' };
  for (const p of thing.parts) if (cf[p.id]) p.cutFace = cf[p.id];
  // The placement's `y` is part of the frame now, so nothing is lifted inside the model: feet at y = 0 (the index puts the bee on a flower).
  thing.cut.at = [.002, .005, 0]; for (const m of thing.modes) if (m.cut && m.cut.at) { m.cut.at = [m.cut.at[0] * MM, m.cut.at[1] * MM, 0]; m.cut.normal = [1, 0, 0]; }   // three transverse cuts, each at its own place along the body
  thing.height_m = .0075; thing.radius_m = .0125; thing.label = 'Honey bee, 14 mm'; thing.label_m = 40;
  thing.ruler = { label: 'Honey bee (14 mm)', D: .05, at: [.001, .005, 0] };
  // Auto peels with what is under the view: exoskeleton, then muscles, then the organs, nerves and breathing tubes
  thing.auto = { label: 'Auto', layers: true, scale: .01 };
  // The wings beat (230 per second is the figure on the wing-beat card: shown 100 times slower, and the screen says so); the heart pulse is an illustration of the dorsal vessel.
  // The two wings turn opposite ways about the body's long axis (an illustration: a real wing stroke is a sweep back and forth with a twist, not a rotation about one line).
  thing.anim = [{ kind: 'swing', system: 'wings', pivot: [.0029, .00695, 0], dir: [0, 0, 1], sym: true, from: .0008, to: .003, axis: [1, 0, 0], amp_deg: 18, hz: 230, shown_hz: 2.3, label: 'Wing beat' },
    { kind: 'pulse', part: 'heart', pivot: [0, .0058, 0], amp: .12, shown_hz: 1.3, illustrative: true, label: 'Heart (dorsal vessel)' }];
  thing.layers = [{ id: 'shell', label: 'exoskeleton', systems: ['cuticle', 'wings', 'hairs'], ghost: .08 }, { id: 'muscles', label: 'muscles', systems: ['muscles'], ghost: .1, see_through: .4 }, { id: 'inside', label: 'organs', systems: ['organs', 'nerves', 'tracheal'], ghost: .1 }];
  console.log(log.join('\n'));
  return { thing, meshes, instances };
}
const lerp3 = L.lerp3;
