// The inside of the robin: skeleton, muscles, skin and fill, organs, air sacs and lungs, nerves. Millimetres; a "B-frame" is the trunk's own frame
// (origin at the trunk centre, u forward along the body axis, v perpendicular and up, z the bird's right), tilted 38 degrees nose-up in the world.
import { L, ball, EZ, S2, add, sub, mul, norm, cross, dot, len, lerp3, bnd, sp, tubeM, fin, zs, rot2, D2R, quatBasis, frameYZ } from './robin_lib.mjs';
import { bodySdf, HC, HB, headLocal, headInv, LEG, WING, TAIL, BODY_ANG } from './robin_shape.mjs';

export const BC = [-2, 58], CA = Math.cos(BODY_ANG * D2R), SA = Math.sin(BODY_ANG * D2R);
export const Bp = p => [BC[0] + p[0] * CA - p[1] * SA, BC[1] + p[0] * SA + p[1] * CA, p[2]];     // B-frame -> world
export const Bi = p => { const dx = p[0] - BC[0], dy = p[1] - BC[1]; return [dx * CA + dy * SA, -dx * SA + dy * CA, p[2]]; };
const inBody = (p, m = 3) => { let q = p.slice(); for (let i = 0; i < 30 && bodySdf(q) > -m; i++) { const g = L.gradient(bodySdf, q); q = sub(q, mul(norm(g), bodySdf(q) + m + .1)); } return q; };
export const fitIn = (p, m = 3) => inBody(p, m);
const W3 = (p, s = 1) => [p[0], p[1], p[2] * s];
const CF = 1.75, bB = (sdfB, minB, maxB, cell, refine = 1, sm = 1) => { let m = L.meshSDF(sdfB, { min: minB, max: maxB, cell: cell * CF, refine }); if (sm) m = L.smooth(m, sm); return L.transform(m, Bp); };   // mesh in the B-frame, place in the world
const EB = (c, r, ang = 0, axis = [0, 0, 1]) => { let s = L.ellipsoid(r[0], r[1], r[2]); if (ang) s = L.rotate(s, axis, ang * D2R); return L.translate(s, c); };
const tubeW = (pts, r, sides = 7, n = 0, caps = true) => L.tube(n ? sp(pts, n) : pts, r, { sides, caps });
const shade = (m, k = 1) => { L.bakeShade(m, (p, n) => k * (.8 + .2 * Math.max(0, n[1] * .5 + .5))); return m; };

export function wingPts(s) { const g = k => { const w = WING[k], z = Math.abs((L.surfaceHit(bodySdf, [w[0], w[1], s * 60], [0, 0, -s], 70) || { p: [0, 0, 14] }).p[2]); return [w[0], w[1], s * z + s * w[2]]; }; return { shoulder: g('shoulder'), elbow: g('elbow'), wrist: g('wrist'), handEnd: g('handEnd') }; }
// ---------------------------------------------------------------------------------------------------------- skeleton
export function skeleton() {
  const o = {};
  // skull: braincase with big orbits, built in head-local mm then placed
  const hW = m => L.transform(m, p => headLocal(p)), tw = pts => pts.map(p => headLocal(p));
  { const cr = L.smoothUnion(2, L.translate(L.ellipsoid(10, 8.6, 8.2), [-3, 1.2, 0]), L.translate(L.ellipsoid(6, 5, 6.8), [4, 0, 0]));
    const orb = S2.map(s => L.translate(L.sphere(4.6), [4.4, 2.4, s * 7.4]));
    const sk = L.smoothSubtract(.5, cr, L.union(...orb, L.translate(L.sphere(3.2), [-6, -7.2, 0])));
    o.skull = hW(bnd(sk, [-14, -9, -10], [11, 11, 10], .62, 1, 1)); }
  { // upper bill bone (premaxilla): a slender cone inside the horny sheath; lower jaw: two rami joined at the tip, hinged at the quadrates
    const pm = L.roundCone([8, .6, 0], [23, -.5, 0], 1.9, .28); o.upper_jaw = hW(bnd(L.scale(pm, [1, .9, .95]), [7, -3, -3], [24, 3, 3], .3, 1, 1));
    const rami = S2.map(s => tubeW(tw([[-3, -5.6, s * 5.8], [3, -3.4, s * 3.4], [10, -2.4, s * 1.8], [18, -1.8, s * .5], [22, -1.5, 0]]), .5, 6, 20));
    o.mandible = L.merge(...rami.map(r => L.transform(r, p => p))); }
  // cervical vertebrae: 14 beads along a gentle S from the skull base to the trunk
  const nb = [headLocal([-11, -3.2, 0]), [11.2, 85.5, 0], [8.4, 80.6, 0], [6.8, 76, 0], [6, 71.5, 0]].map((p, i) => i ? fitIn(p, 3.2) : p);
  { const path = sp(nb, 140), pts = path;
    o.cervical = L.tube(pts, t => 1.15 + .34 * Math.abs(Math.sin(t * Math.PI * 14)), { sides: 8, caps: true });
    o.neck_path = pts; }
  // thoracic vertebrae (5 shown) and the synsacrum (the fused lower back) along the back line in the B-frame
  const back = [[17, 14.5], [10, 15.6], [3, 15.6], [-4, 15], [-11, 14], [-18, 12.6], [-25, 11]].map(([u, v]) => Bp([u, v, 0]));
  { const th = sp(back.slice(0, 4), 40); o.thoracic = L.tube(th, t => 1.25 + .3 * Math.abs(Math.sin(t * Math.PI * 5)), { sides: 8, caps: true });
    const sy = sp(back.slice(3), 40); o.synsacrum = L.tube(sy, t => 1.7 - .3 * t, { sides: 8, caps: true }); }
  { const base = Bp([-24, 11.3, 0]), tb = fitIn([TAIL.base[0] - 1, TAIL.base[1] + 3.5, 0], 2.5);
    o.caudal = L.tube(sp([base, lerp3(base, tb, .5), tb], 22), t => .95 + .2 * Math.abs(Math.sin(t * Math.PI * 6)), { sides: 7, caps: true });
    // pygostyle: a small upright plate at the end of the tail vertebrae, where the tail feathers are anchored
    o.pygostyle = bnd(L.translate(L.rotate(L.ellipsoid(2.7, 2.3, .7), [0, 0, 1], -TAIL.dirDeg * D2R + Math.PI), add(tb, [-1.6, -.8, 0])), [tb[0] - 8, tb[1] - 6, -2], [tb[0] + 5, tb[1] + 5, 2], .3, 1, 0); o.pyg = tb; }
  // sternum (breastbone) with its keel, furcula, coracoids, scapulae
  { const keel = L.extrudeOutline([[19.5, -11.5], [18, -15.2], [12, -17.6], [1, -18.2], [-8, -16.6], [-13.5, -13], [-13.5, -11.5]], 1.0);
    const plate = bB(L.translate(L.ellipsoid(17, 1.2, 8.2), [3, -11.8, 0]), [-16, -14, -10], [22, -9, 10], .5, 1, 1);
    o.sternum = L.merge(L.transform(keel, Bp), plate);
    const fu = [[16.5, 1.5, 9.6], [20, -3, 6.6], [23, -8, 2.6], [24, -9.6, 0], [23, -8, -2.6], [20, -3, -6.6], [16.5, 1.5, -9.6]].map(Bp); o.furcula = L.tube(sp(fu, 40), .62, { sides: 6, caps: true });
    o.coracoid = L.merge(...S2.map(s => L.tube(sp([[16.8, 1, s * 8.6], [18.2, -5, s * 6.5], [19.2, -11, s * 4.2]].map(Bp), 14), t => 1.0 + .25 * t, { sides: 7, caps: true })));
    o.scapula = L.merge(...S2.map(s => L.tube(sp([[17, 2, s * 8.8], [10, 6, s * 10.2], [2, 9.6, s * 10.8], [-6, 11.5, s * 9.8]].map(Bp), 20), t => .62 * (1 - .45 * t), { sides: 6, caps: true }))); }
  // ribs (5 pairs) and their uncinate processes
  { const rb = [], un = []; for (const u0 of [14, 8.5, 3, -2.5, -8]) for (const s of S2) {
      const pts = [[u0, 14.2, s * 2.4], [u0 - .5, 9, s * 9], [u0 - 1.8, 1, s * 11.4], [u0 - 3.2, -6, s * 10.2], [u0 - 4, -10.6, s * 7]].map(Bp); rb.push(L.tube(sp(pts, 20), .42, { sides: 5, caps: true }));
      const a = Bp([u0 - 1.4, 3, s * 11.4]), b = Bp([u0 - 6.8, 5.4, s * 11.2]); un.push(L.tube([a, b], .26, { sides: 4, caps: true })); }
    o.ribs = L.merge(...rb); o.uncinate = L.merge(...un); }
  // pelvis: ilium, ischium and pubis, fused to the synsacrum
  { const il = S2.map(s => bB(L.rotate(L.translate(L.ellipsoid(14, .9, 6), [-12, 11.2, s * 5.8]), [1, 0, 0], s * -.38), [-28, 3, s > 0 ? -1 : -12], [2, 19, s > 0 ? 12 : 1], .6, 1, 1));
    const is = S2.map(s => bB(L.rotate(L.translate(L.ellipsoid(6.5, .8, 3.2), [-22, 5.4, s * 7.6]), [1, 0, 0], s * -.7), [-30, 0, s > 0 ? 2 : -12], [-14, 12, s > 0 ? 12 : -2], .45, 1, 1));
    const pu = S2.map(s => L.tube(sp([LEG.hip, [-14, 40.5, s * 8.5 * 1], [-27, 35, s * 7.5 * 1]].map((p, i) => i ? p : Bp([-11, -8, s * 8])).map((p, i) => i === 0 ? p : [p[0], p[1], s * Math.abs(p[2])]), 14), .38, { sides: 5, caps: true }));
    o.pelvis = L.merge(...il, ...is, ...pu); }
  // wing bones (right and left): humerus, radius, ulna, carpometacarpus with its three digits
  const wp = (k, s) => { const w = WING[k], z0 = s * (L.surfaceHit(bodySdf, [w[0], w[1], s * 60], [0, 0, -s], 70) || { p: [0, 0, 14] }).p[2]; return [w[0], w[1], z0 + s * w[2] * 1]; };
  const hum = [], rad = [], uln = [], cmc = [], dig = [];
  for (const s of S2) {
    const Sh = wp('shoulder', s), E = wp('elbow', s), Wr = wp('wrist', s), He = wp('handEnd', s);
    hum.push(L.tube(sp([Sh, lerp3(Sh, E, .5).map((v, i) => i === 1 ? v + 1.8 : v), E], 14), t => 1.0 + .45 * Math.sin(Math.PI * t) * .35 + .3 * (1 - t), { sides: 7, caps: true }));
    const off = [0, 0, s * .85];
    rad.push(L.tube(sp([add(E, off), lerp3(E, Wr, .5).map((v, i) => i === 1 ? v - .5 : v), add(Wr, off)].map((p, i) => i ? p : p), 12), .4, { sides: 5, caps: true }));
    uln.push(L.tube(sp([sub(E, off), lerp3(E, Wr, .5).map((v, i) => i === 1 ? v + .6 : v), sub(Wr, off)], 12), t => .62 - .15 * t, { sides: 6, caps: true }));
    cmc.push(L.tube(sp([Wr, lerp3(Wr, He, .5), He], 10), t => .72 - .2 * t, { sides: 6, caps: true }));
    const dv = norm(sub(He, Wr)); dig.push(L.tube([He, add(He, mul(dv, 5.6)), add(add(He, mul(dv, 9.2)), [0, .1, 0])], .36, { sides: 5, caps: true }));      // major digit: two phalanges
    dig.push(L.tube([add(Wr, [0, -.2, s * .2]), add(Wr, [2.2, 1.9, s * .1]), add(Wr, [3.2, 3.2, s * .1])], .3, { sides: 5, caps: true }));   // alular digit (the "thumb"), bearing the alula
    dig.push(L.tube([add(He, mul(dv, -1.2)), add(He, [-.9, -2.4, s * -.6])], .28, { sides: 5, caps: true }));                                // minor digit (short)
  }
  o.humerus = L.merge(...hum); o.radius = L.merge(...rad); o.ulna = L.merge(...uln); o.carpometacarpus = L.merge(...cmc); o.digits = L.merge(...dig);
  // leg bones: femur, tibiotarsus (with the thin fibula), tarsometatarsus, toe bones
  const fem = [], tib = [], tms = [], toe = [], fib = [];
  for (const s of S2) {
    const hip = [Bp([-11, -8, s * 8])[0], Bp([-11, -8, s * 8])[1], s * 8], knee = W3(LEG.knee, s), ank = W3(LEG.ankle, s), mtp = W3(LEG.mtp, s);
    fem.push(L.tube(sp([hip, lerp3(hip, knee, .5).map((v, i) => i === 1 ? v + .6 : v), knee], 12), t => 1.05 - .15 * t, { sides: 7, caps: true }));
    tib.push(L.tube(sp([knee, lerp3(knee, ank, .45), ank], 16), t => t < .1 ? 1.5 - 4 * t * .5 : 1.0 - .15 * t, { sides: 7, caps: true }));
    fib.push(L.tube([add(knee, [.5, -2, s * -1.1]), add(lerp3(knee, ank, .45), [.6, 0, s * -1.2])], .26, { sides: 4, caps: true }));
    tms.push(L.tube([ank, mtp], .85, { sides: 7, caps: true }));
    const bone = (pts, r) => { for (let i = 0; i < pts.length - 1; i++) toe.push(L.tube([add(pts[i], [0, 0, 0]), pts[i + 1]], r, { sides: 5, caps: true })); };
    const F = [[[1, 3.2, 11], [6, 1.9, 8.5], [10.5, 1.2, 7.2], [14.5, .8, 6.6]], [[1, 3.2, 11], [5.8, 2.1, 11], [10.5, 1.4, 11], [14.8, .9, 11], [18.5, .8, 11]], [[1, 3.2, 11], [3.8, 2.3, 12], [6.6, 1.8, 13.1], [9.4, 1.4, 14.2], [12.4, 1.1, 15.1], [15.5, .8, 15.9]]];
    for (const f of F) bone(f.map(p => W3(p, s)), .52);   // forward toes: 3, 4 and 5 bones as drawn, counting along each toe
    bone([[1, 3.2, 11], [-3.2, 2.2, 10.7], [-9.6, .9, 10.5]].map(p => W3(p, s)), .6);
  }
  o.femur = L.merge(...fem); o.tibiotarsus = L.merge(...tib); o.fibula = L.merge(...fib); o.tarsometatarsus = L.merge(...tms); o.toe_bones = L.merge(...toe);
  const out = {}; for (const [k, m] of Object.entries(o)) if (m && m.pos) out[k] = fin(shade(m, 1.04)); out.neck_path = o.neck_path; out.pyg = o.pyg;
  return out;
}

// ---------------------------------------------------------------------------------------------------------- skin, fill, muscles
export function muscles(sk) {
  const o = {}, ins = (m, d = 3.2) => m;  // (meshes are clipped to the body inset by construction below)
  const inset = d => p => bodySdf(p) + d;
  o.skin = bnd(inset(3.0), [-44, 24, -20], [42, 112, 20], 1.0, 1, 1);
  o.fill = bnd(inset(4.8), [-44, 25, -18], [42, 110, 18], 1.1, 1, 1);
  // pectoralis: the big downstroke muscle, a thick sheet over the sides and underside of the rib cage (two halves, parted at the keel)
  { const sh = L.subtract(EB([6, -5.5, 0], [16, 14.8, 13.3]), EB([6, -5.5, 0], [16, 12.3, 10.9])), cut = L.intersect(sh, p => p[1] - 4, p => 1 - Math.abs(p[2]), p => bodySdf(Bp(p)) + 3.3, p => p[0] - 21);
    o.pectoralis = bB(cut, [-12, -22, -14], [24, 5, 14], .7, 1, 1); }
  // supracoracoideus: the smaller, deeper upstroke muscle beside the keel; its tendon rises through the triosseal canal to the top of the humerus
  { const sc = S2.map(s => bB(L.rotate(EB([12.5, -10.8, s * 4.1], [8.2, 5.6, 2.3]), [0, 0, 1], -.25), [2, -18, s > 0 ? 0 : -8], [22, -3, s > 0 ? 8 : 0], .5, 1, 1)); o.supracoracoideus = L.merge(...sc);
    const tn = [], ring = [];
    for (const s of S2) { const Sh = [WING.shoulder[0], WING.shoulder[1], s * 12.5], pts = [Bp([18.2, -5, s * 4.6]), Bp([18.6, 1.4, s * 7.2]), Bp([17.7, 3.8, s * 8.6]), Sh];
      tn.push(L.tube(sp(pts, 20), .34, { sides: 5, caps: true }));
      const c = Bp([18.6, 1.6, s * 7.4]), ax = norm(sub(pts[2], pts[0])), px = L.perp(ax), py = cross(ax, px), rp = []; for (let i = 0; i <= 18; i++) { const t = i / 18 * 2 * Math.PI; rp.push(add(add(c, mul(px, Math.cos(t) * 1.7)), mul(py, Math.sin(t) * 1.7))); } ring.push(L.tube(rp, .3, { sides: 5, caps: false })); }
    o.sc_tendon = L.merge(...tn); o.canal = L.merge(...ring); }
  // neck, back, wing, leg, jaw and tail muscles
  { const np = sk.neck_path, off = (p, k) => [p[0] + 1.2, p[1], k];
    o.neck_muscles = L.merge(...S2.map(s => L.tube(np.filter((_, i) => i % 4 === 0).map(p => [p[0], p[1], s * 2.4]), t => .8 + .5 * Math.sin(Math.PI * t) , { sides: 6, caps: true })));
    const bk = [[17, 16.4], [10, 17.2], [3, 17.2], [-4, 16.6], [-11, 15.4], [-18, 14.2], [-24, 12.8]].map(([u, v]) => v);
    o.back_muscles = L.merge(...S2.map(s => L.tube(sp([[17, 16.6, s * 3.7], [10, 17.4, s * 4], [3, 17.4, s * 4.4], [-4, 16.8, s * 4.6], [-11, 15.6, s * 4.4], [-18, 14.4, s * 3.9], [-24, 13, s * 3.2]].map(Bp), 30), t => 1.7 - .55 * t, { sides: 7, caps: true })));
    const jm = S2.map(s => bnd(L.translate(L.ellipsoid(4.6, 3.3, 1.9), [-4.2, -1.4, s * 8.9]), [-10, -6, s > 0 ? 5 : -12], [2, 4, s > 0 ? 12 : -5], .45, 1, 1)); o.jaw_muscle = L.transform(L.merge(...jm), p => headLocal(p));
    const wm = []; for (const s of S2) { const wp = k => { const w = WING[k]; const z = Math.abs((L.surfaceHit(bodySdf, [w[0], w[1], s * 60], [0, 0, -s], 70) || { p: [0, 0, 14] }).p[2]); return [w[0], w[1], s * z + s * w[2]]; };
      const Sh = wp('shoulder'), E = wp('elbow'), Wr = wp('wrist');
      wm.push(L.tube(sp([add(Sh, [-1, 1, s * 1.2]), add(lerp3(Sh, E, .5), [0, 1.2, s * 1.5]), add(E, [.5, .8, s * 1])], 12), t => .9 + 1.1 * Math.sin(Math.PI * t) * .9, { sides: 7, caps: true }));
      wm.push(L.tube(sp([add(E, [0, .6, s * 1.2]), add(lerp3(E, Wr, .5), [0, .8, s * 1.4]), add(Wr, [0, .2, s * 1.2])], 12), t => .5 + .6 * Math.sin(Math.PI * t * .9 + .2), { sides: 6, caps: true })); }
    o.wing_muscles = L.merge(...wm);
    const th = S2.map(s => { const hip = [Bp([-11, -8, 0])[0], Bp([-11, -8, 0])[1], s * 9], kn = W3(LEG.knee, s); return L.transform(bnd(L.translate(L.roundCone(sub(hip, hip), sub(kn, hip), 3.3, 2.3), hip), [Math.min(hip[0], kn[0]) - 5, Math.min(hip[1], kn[1]) - 5, s > 0 ? 3 : -15], [Math.max(hip[0], kn[0]) + 5, Math.max(hip[1], kn[1]) + 5, s > 0 ? 15 : -3], .6, 1, 1), p => p); });
    o.thigh_muscles = L.merge(...th);
    const shk = S2.map(s => { const kn = W3(LEG.knee, s), an = W3(LEG.ankle, s), e = lerp3(kn, an, .72); return bnd(L.translate(L.roundCone([0, 0, 0], sub(e, kn), 2.5, 1.0), kn), [Math.min(kn[0], e[0]) - 4, Math.min(kn[1], e[1]) - 4, s > 0 ? 4 : -15], [Math.max(kn[0], e[0]) + 4, Math.max(kn[1], e[1]) + 4, s > 0 ? 15 : -4], .55, 1, 1); });
    o.shank_muscles = L.merge(...shk);
    const tl = S2.map(s => bnd(L.translate(L.ellipsoid(4.2, 2.2, 2.4), [TAIL.base[0] + 1.5, TAIL.base[1] + 3.3, s * 2.9]), [TAIL.base[0] - 4, TAIL.base[1], s > 0 ? 0 : -7], [TAIL.base[0] + 7, TAIL.base[1] + 8, s > 0 ? 7 : 0], .45, 1, 1)); o.tail_muscles = L.merge(...tl); }
  // the perching tendon: the toe-flexor tendon runs behind the ankle and down the back of the foot to the toes; its ridged surface is the ratchet
  { const ts = []; for (const s of S2) { const kn = W3(LEG.knee, s), an = W3(LEG.ankle, s), mt = W3(LEG.mtp, s);
      const path = sp([lerp3(kn, an, .5), add(lerp3(kn, an, .85), [-1.5, 0, 0]), add(an, [-2.0, -.6, 0]), add(lerp3(an, mt, .5), [-1.5, 0, 0]), add(mt, [-.9, -.4, 0])], 40);
      ts.push(L.tube(path, t => .46 + .12 * Math.sign(Math.sin(t * 6.28 * 7)) * (t > .25 && t < .75 ? 1 : .2), { sides: 6, caps: true }));
      for (const [dz, e] of [[-4.2, [14.5, .8]], [0, [18.5, .8]], [4.2, [15.5, .8]], [0, [-9.6, .9]]]) { const tz = e[0] < 0 ? 0 : dz; ts.push(L.tube([add(mt, [-.9, -.4, 0]), [(mt[0] + e[0]) / 2, 1.2, mt[2] + s * tz * .5], [e[0], e[1] + .2, mt[2] + s * tz]], .28, { sides: 5, caps: true })); } }
    o.tendon = L.merge(...ts); }
  const out = {}; for (const [k, m] of Object.entries(o)) out[k] = fin(shade(m, 1));
  return out;
}

// ---------------------------------------------------------------------------------------------------------- organs, air sacs and lungs, nerves
export const HEART_B = [10.5, -6.2, 0];
export function organs(sk) {
  const o = {};
  const smoothE = (c, r, ang = 0) => EB(c, r, ang);
  // heart: four chambers in one body, between the coracoids, over the front of the liver (the cut view shows the chambers)
  { const h = L.smoothUnion(1.1, EB([HEART_B[0] - .8, HEART_B[1] - .6, 0], [4.3, 5.3, 4.1], -.35), EB([HEART_B[0] + 1.8, HEART_B[1] + 3.6, 2.4], [2.2, 2.4, 2.0]), EB([HEART_B[0] + 1.8, HEART_B[1] + 3.6, -2.4], [2.2, 2.4, 2.0]));
    o.heart = bB(L.rotate(h, [0, 0, 1], 0), [3, -14, -7], [20, 5, 7], .22, 1, 1); }
  // liver: two lobes, the right a little larger, wrapped round the back of the heart
  o.liver = bB(L.smoothUnion(1.2, EB([3.2, -8.4, 5.2], [5.8, 5.6, 4.4], .2), EB([3.6, -8.8, -4.8], [5.3, 5.3, 4.0], -.2)), [-4, -16, -11], [11, -1, 11], .3, 1, 1);
  // oesophagus (no true crop: only a gentle widening low in the neck), proventriculus (glandular stomach), gizzard (muscular stomach)
  { const np = sk.neck_path, eso = [headLocal([-6, -6.2, 0]), np[Math.floor(np.length * .25)], np[Math.floor(np.length * .6)], np[np.length - 1]].map((p, i) => i ? [p[0] + 3.2, p[1] - 2.2, -1.2] : p);
    const down = [Bp([14.5, 4.5, -1.0]), Bp([11, -1, -1]), Bp([7.2, -6.5, -1.4])].map(p => fitIn(p, 3.5));
    const pts = [headLocal([-5.6, -6.2, 0]), fitIn(add(np[Math.floor(np.length * .3)], [3, -2, 0]), 3), fitIn(add(np[Math.floor(np.length * .65)], [2.8, -3, 0]), 3.2), ...down];
    o.oesophagus = L.tube(sp(pts, 70), t => .95 + .35 * Math.sin(Math.PI * Math.max(0, (t - .62) * 2.6)) * (t > .62 ? 1 : 0), { sides: 8, caps: true }); o.eso_path = pts; }
  o.proventriculus = bB(EB([5.4, -7.4, -1.6], [2.6, 3.2, 2.2], .4), [1, -12, -5], [10, -2, 3], .2, 1, 1);
  o.gizzard = bB(L.smoothUnion(.8, EB([-1.4, -9.4, -2.6], [5.0, 5.0, 3.6]), EB([-1.4, -9.4, -2.6], [4.2, 4.3, 4.6])), [-8, -16, -9], [6, -3, 5], .3, 1, 1);
  o.spleen = bB(EB([1, -4.8, 3.6], [1.5, 1.5, 1.5]), [-1, -7, 1], [3, -2, 6], .15, 1, 0);
  o.pancreas = bB(L.tube ? L.union(EB([1.8, -13, -4.2], [3.6, .9, .9]), EB([-1, -14, -5.6], [3, .8, .8])) : null, [-5, -16, -8], [6, -11, -2], .2, 1, 1);
  // intestines: a duodenal loop, then coils; a short rectum ends in the cloaca (the one opening for gut, kidneys and reproduction)
  { const loop = [[-3, -12.5, -3], [-8, -13, -2], [-12, -10.5, -3.5], [-9, -8, -5], [-13, -5.5, -3.5], [-17, -8, -2], [-14.5, -11, 0], [-18, -12.5, 1.5], [-21, -9, 3], [-17, -5, 4.5], [-20, -2, 2], [-23, -3.5, 0]].map(Bp).map(p => fitIn(p, 3.2));
    o.intestines = L.tube(sp(loop, 110), .95, { sides: 7, caps: true });
    const cl = fitIn(Bp([-25.5, -4.5, 0]), 2.6); o.cloaca = bnd(L.translate(L.ellipsoid(2.6, 2.4, 2.4), cl), [cl[0] - 4, cl[1] - 4, -4], [cl[0] + 4, cl[1] + 4, 4], .4, 1, 1);
    o.rectum = L.tube(sp([Bp([-23, -3.5, 0]), lerp3(Bp([-23, -3.5, 0]), cl, .5), cl], 8), .95, { sides: 7, caps: true }); }
  // kidneys: three lobes each, set in hollows of the pelvis under the synsacrum
  { const k = []; for (const s of S2) for (const [u, w] of [[-8, 4.4], [-13.2, 4.7], [-18.6, 4.2]]) k.push(bB(EB([u, 8.2, s * 4.1], [2.7, 2.3, w * .45]), [u - 4, 5, s > 0 ? 0 : -8], [u + 4, 12, s > 0 ? 8 : 0], .2, 1, 1)); o.kidneys = L.merge(...k); }
  // eyes: the globes (drawn at 8 mm; each is larger relative to the head than ours)
  { const g = headLocal([0, 0, 0]); o.eyeballs = L.merge(...S2.map(s => { const c = headLocal([4.4, 2.5, s * 8.2]); return ball(4.1, c, 24, 16); })); }
  // airway: the trachea (a tube of rings) from the larynx at the back of the tongue down the front of the neck to the syrinx
  { const sy = SYR; const larynx = headLocal([2.5, -6.0, 0]), pts = [larynx, fitIn(add(headLocal([-4, -8.5, 0]), [3, -2, 0]), 3), fitIn(Bp([20, 10.5, 0]), 3.2), fitIn(Bp([17.8, 5.8, 0]), 3), sy.at];
    o.trachea_path = sp(pts, 60); o.trachea = L.tube(o.trachea_path, 1.1, { sides: 10, caps: true }); }
  // lungs: two small, spongy, wedged between the ribs along the back
  o.lungs = L.merge(...S2.map(s => bB(L.smoothUnion(1, EB([7.5, 6.2, s * 7.8], [10.5, 5.6, 4.0], .1), EB([13.4, 4.2, s * 6.6], [4.2, 4.4, 3.4])), [-6, 0, s > 0 ? 1 : -12], [22, 13, s > 0 ? 12 : -1], .28, 1, 1)));
  // air sacs: one in the front of the chest (interclavicular), a pair in the neck base, two pairs in the chest, one pair in the belly
  { const sacs = {};
    sacs.interclav = bB(L.smoothUnion(1.2, EB([17.2, -1.8, 0], [3.2, 5.4, 6.8]), EB([20.5, -6.5, 0], [2.6, 4.0, 5.2])), [12, -13, -10], [24, 6, 10], .3, 1, 1);
    sacs.cervical = L.merge(...S2.map(s => bB(EB([19.2, 10.2, s * 3.1], [3.0, 2.8, 1.9], .3), [15, 6, s > 0 ? 0 : -6], [24, 15, s > 0 ? 6 : 0], .22, 1, 1)));
    sacs.ant_thoracic = L.merge(...S2.map(s => bB(EB([9.6, -2.8, s * 9.4], [5.0, 5.8, 2.6], .1), [3, -11, s > 0 ? 5 : -14], [16, 6, s > 0 ? 14 : -5], .25, 1, 1)));
    sacs.post_thoracic = L.merge(...S2.map(s => bB(EB([-1.2, -2.4, s * 9.6], [6.2, 6.4, 3.0], .2), [-9, -11, s > 0 ? 5 : -15], [8, 7, s > 0 ? 15 : -5], .28, 1, 1)));
    sacs.abdominal = L.merge(...S2.map(s => bB(L.smoothUnion(1, EB([-12.5, -7.2, s * 7.8], [9.4, 6.8, 3.6]), EB([-20, -4, s * 6.4], [4.2, 4.5, 3.0])), [-28, -15, s > 0 ? 2 : -13], [-2, 5, s > 0 ? 13 : -2], .3, 1, 1)));
    Object.assign(o, { sac_interclav: sacs.interclav, sac_cervical: sacs.cervical, sac_ant: sacs.ant_thoracic, sac_post: sacs.post_thoracic, sac_abd: sacs.abdominal }); }
  // nerves
  { const nv = {}; const hb = headLocal;
    nv.brain = L.transform(bnd(L.smoothUnion(1.2, L.translate(L.ellipsoid(6.2, 5.6, 6.4), [-3.4, 2.6, 0]), L.translate(L.ellipsoid(4.2, 3.2, 4.0), [-9.2, -.2, 0]), L.translate(L.ellipsoid(3.6, 2.8, 2.8), [2.6, 1.4, 0])), [-14, -4, -8], [8, 9, 8], .5, 1, 1), p => headLocal(p));
    nv.optic_lobes = L.transform(L.merge(...S2.map(s => bnd(L.translate(L.ellipsoid(2.5, 3.2, 3.0), [-3.2, .2, s * 6.6]), [-7, -4, s > 0 ? 3 : -10], [1, 4, s > 0 ? 10 : -3], .4, 1, 1))), p => headLocal(p));
    nv.optic_nerves = L.merge(...S2.map(s => L.tube([headLocal([1.6, 2.1, s * 5.6]), headLocal([-.2, 1.4, s * 3.6]), headLocal([-1.4, .8, s * 1.0])], .45, { sides: 5, caps: true })));
    const cord = [headLocal([-11.8, -1.8, 0]), ...sk.neck_path.filter((_, i) => i % 10 === 5 && i > 8).map(p => [p[0] - .2, p[1] + 1.0, 0]), ...[[17, 16], [10, 17], [3, 17], [-4, 16.4], [-11, 15.2], [-18, 14], [-23.5, 12.6]].map(([u, v]) => Bp([u, v - 1.4, 0]))];
    nv.spinal_cord = L.tube(sp(cord, 120), t => .75 - .2 * t, { sides: 6, caps: true });
    nv.brachial = L.merge(...S2.map(s => { const Sh = [WING.shoulder[0], WING.shoulder[1], s * 12], root = Bp([15, 14.4, s * 1.2]); return L.merge(L.tube(sp([root, Bp([16.5, 10, s * 5.5]), Sh], 14), .4, { sides: 5, caps: true }), L.tube(sp([Sh, [Sh[0] - 6, Sh[1] - 4, s * 14], [WING.elbow[0] + 3, WING.elbow[1] + 2, s * 15.8]], 14), .28, { sides: 5, caps: true })); }));
    nv.sciatic = L.merge(...S2.map(s => { const hip = [Bp([-11, -8, 0])[0], Bp([-11, -8, 0])[1], s * 9], kn = W3(LEG.knee, s), an = W3(LEG.ankle, s); return L.tube(sp([Bp([-14, 9.2, s * 2.6]), Bp([-12, 2, s * 7.5]), add(lerp3(hip, kn, .5), [0, -1.2, s * -1.1]), add(lerp3(kn, an, .5), [-.5, 0, s * -1.2]), add(an, [-1.7, 1.0, 0])], 28), .36, { sides: 5, caps: true }); }));
    nv.vagus = L.merge(...S2.map(s => L.tube(sp([headLocal([-10.5, -3.6, s * 2.2]), ...sk.neck_path.filter((_, i) => i % 15 === 7 && i > 20).map(p => [p[0] + 1.0, p[1] - .6, s * 3.0]), Bp([16.5, -1, s * 4]), Bp([12.5, -4.2, s * 3.4])], 40), .26, { sides: 4, caps: true })));
    Object.assign(o, nv); }
  const out = {}; for (const [k, m] of Object.entries(o)) if (m && m.pos) out[k] = fin(shade(m, 1)); out.trachea_path = o.trachea_path; out.eso_path = o.eso_path;
  return out;
}
// the syrinx sits at the fork of the windpipe, deep in the chest just above the heart
export const SYR = { at: fitIn(Bp([16.2, 3.4, 0]), 3.2) };
