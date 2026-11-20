// The pond's plants: duckweed (Lemna minor, true size, instanced), hornwort (Ceratophyllum demersum, submerged, rootless), yellow flag iris (Iris pseudacorus) at the margin.
import * as L from '../lib/index.mjs';
import { POND, sm, sOf, bedY, place, uvSphere, sp } from './pond_lib.mjs';

const MM = .001;
// ---- measurements (sources in tools/things/content/pond_nodes.py and the report) ----
const M = {
  frond: { len: 3.0, wid: 2.4 },    // Lemna minor fronds are 1-8 mm long and 0.6-5 mm broad (Wikipedia, Lemna minor); the model draws a typical 3 x 2.4 mm frond
  root: 12,                         // each frond has one root, 1-2 cm long (same page); 12 mm drawn
  hornwort: { whorl: 8, leaf: [8, 40], stemLen: .62 },   // leaves in whorls of 6-12, each 8-40 mm and forked once or twice into thread-like segments (Wikipedia, Ceratophyllum demersum); stems reach 1-3 m (the model stem is at most about 0.55 m because it stops 5 cm below the surface of a pond that is 0.6 m deep)
  iris: { leafLen: .8, leafWid: .026, flower: .085, rhizomeR: .014 },   // leaves up to 90 cm long and 3 cm wide, flowers 7-10 cm across, 100-150 cm tall (Wikipedia, Iris pseudacorus); drawn: 80 cm x 2.2 cm leaves, 8.5 cm flowers
};
export { M as PLANT_M };

export default function plants(R) {
  const meshes = {}, instances = {};
  // ================= duckweed: one frond with one root, 3 mm across, a 12 mm root =================
  { // frond: a thin oval disc, slightly domed above, flat below (6-gon fan, 12 triangles); root: a crossed pair of thin strips hanging down
    const f = L.newMesh(), n = 5, a = M.frond.len * MM / 2, b = M.frond.wid * MM / 2;
    f.pos.push(0, .00028, 0); for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; f.pos.push(Math.cos(t) * a, 0, Math.sin(t) * b); }
    f.pos.push(0, -.00004, 0); for (let i = 0; i < n; i++) { f.idx.push(0, 1 + (i + 1) % n, 1 + i); f.idx.push(n + 1, 1 + i, 1 + (i + 1) % n); }
    // the root: a node under the middle, 12 mm long, 0.15 mm wide
    const r0 = f.pos.length / 3, rl = M.root * MM, rw = .00008;
    for (const [dx, dz] of [[1, 0]]) { const k = f.pos.length / 3; f.pos.push(-dx * rw, -.0001, -dz * rw, dx * rw, -.0001, dz * rw, -dx * rw * .4, -rl, -dz * rw * .4, dx * rw * .4, -rl, dz * rw * .4); f.idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
    L.bakeShade(f, (p, nn) => p[1] < -.0005 ? .55 : .85);
    meshes.duckweed = f;
    // a stand-in for the middle distance: the raft's outline as one flat green patch (the fronds themselves are 3 mm and cannot be seen from 10 m)
  }
  const dw = new L.Instances('duckweed'), raft = [];
  { // one drifting raft 0.28 m across and a scatter of single fronds near it; about 50 per cent cover inside the raft
    const cx = -1.15, cz = .85, rxm = .17, rzm = .12;
    let n = 0; const spots = [];
    while (n < 1900) { const t = R.range(0, 6.28), rr = Math.sqrt(R()) , x = cx + Math.cos(t) * rr * rxm * (1 + .25 * L.noise3(t * 2, 0, 1, 3)), z = cz + Math.sin(t) * rr * rzm * (1 + .25 * L.noise3(t * 2, 1, 1, 4)); raft.push([x, z]); spots.push([x, z]); n++; }
    for (let i = 0; i < 380; i++) { const t = R.range(0, 6.28), rr = R.range(.9, 2.6), x = cx + Math.cos(t) * rr * rxm, z = cz + Math.sin(t) * rr * rzm; spots.push([x, z]); }
    for (const [x, z] of spots) dw.add([x, POND.yw + .0002, z], L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), R.range(.75, 1.25));
    instances.duckweed = dw;
    // mat stand-in: an irregular green patch at the raft, 0.35 m
    const m = L.newMesh(), k = 20; m.pos.push(cx, POND.yw + .0007, cz); for (let i = 0; i < k; i++) { const t = i / k * Math.PI * 2, w = 1.08 + .18 * L.noise3(Math.cos(t) * 1.5 + 4, Math.sin(t) * 1.5, 2, 9); m.pos.push(cx + Math.cos(t) * rxm * 1.08 * w, POND.yw + .0007, cz + Math.sin(t) * rzm * 1.08 * w); }
    for (let i = 0; i < k; i++) m.idx.push(0, 1 + (i + 1) % k, 1 + i);
    meshes.duckweed_mat = m;
  }
  // ================= hornwort: a rootless submerged plant. Whorls of forked, stiff, thread-like leaves along a stem =================
  { // one whorl (8 leaves, each forked twice into four thread-like segments, 3-sided strands): drawn at its real length (2.4 cm here)
    const whorl = (seed, nLeaves, len) => {
      const r = L.rng(seed), parts = [];
      for (let i = 0; i < nLeaves; i++) {
        const ang = i / nLeaves * Math.PI * 2 + r.range(-.2, .2), dir = [Math.cos(ang), 0, Math.sin(ang)], up = r.range(.15, .45);
        const seg = (p0, d, l, w, depth) => { const p1 = [p0[0] + d[0] * l, p0[1] + d[1] * l, p0[2] + d[2] * l]; parts.push(L.tube([p0, p1], w, { sides: 3, caps: false })); return p1; };
        const d0 = L.norm([dir[0], up, dir[2]]), l0 = len * .45, tip0 = seg([dir[0] * .0008, 0, dir[2] * .0008], d0, l0, .00032, 0);
        for (const sg of [-1, 1]) {
          const side = L.cross(d0, [0, 1, 0]), d1 = L.norm([d0[0] + side[0] * .6 * sg, d0[1] + .1, d0[2] + side[2] * .6 * sg]), l1 = len * (i % 3 === 0 ? .28 : .5), tip1 = seg(tip0, d1, l1, .00026, 1);
          if (i % 3 === 0) for (const sg2 of [-1, 1]) { const d2 = L.norm([d1[0] + side[0] * .45 * sg2, d1[1] + .2, d1[2] + side[2] * .45 * sg2]); seg(tip1, d2, len * .27, .0002, 2); }
        }
      }
      return L.merge(...parts);
    };
    meshes.hornwort_whorl_a = L.bakeShade(whorl(31, 6, .022), (p) => .7 + .3 * Math.min(1, p[1] / .02));
    meshes.hornwort_whorl_b = L.bakeShade(whorl(32, 6, .017), (p) => .7 + .3 * Math.min(1, p[1] / .015));
    // stems: a tube with a small kink; whorls every 1.4 cm at the tip and 2.6 cm lower down
    const stems = [], wa = new L.Instances('hornwort_whorl_a'), wb = new L.Instances('hornwort_whorl_b');
    const clumps = [[.35, -.85], [-.7, .45], [1.45, .25], [-1.6, -.9]];
    clumps.forEach(([cx, cz], ci) => {
      const ns = 4; for (let s = 0; s < ns; s++) {
        const x0 = cx + R.range(-.12, .12), z0 = cz + R.range(-.12, .12), y0 = bedY(x0, z0) + .01, top = Math.min(POND.yw - .05, y0 + M.hornwort.stemLen * R.range(.7, 1)),
              lean = [R.range(-.12, .12), R.range(-.12, .12)], pts = [];
        for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([x0 + lean[0] * t + .015 * Math.sin(t * 6 + s), y0 + (top - y0) * t, z0 + lean[1] * t + .015 * Math.cos(t * 5 + s)]); }
        stems.push(L.tube(pts, t => .0012 * (1 - .4 * t), { sides: 4, caps: false }));
        const sm2 = sp(pts, 40); let acc = 0;
        for (let k = 0; k < sm2.length; k++) { const next = k === 0 ? 0 : Math.hypot(sm2[k][0] - sm2[k - 1][0], sm2[k][1] - sm2[k - 1][1], sm2[k][2] - sm2[k - 1][2]); acc += next; const gap = .024 + .02 * (1 - k / sm2.length);
          if (acc >= gap) { acc = 0; (R() < .5 ? wa : wb).add(sm2[k], L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), R.range(.85, 1.1)); } }
      }
    });
    meshes.hornwort_stems = L.bakeShade(L.merge(...stems), () => .6);
    instances.hornwort_a = wa; instances.hornwort_b = wb;
    // oxygen bubbles that cling to the leaves in sunlight: 1.5 mm, a sample of the bubbles you see on a sunlit plant
    meshes.o2_bubble = uvSphere(.0008, 6, 4);
    const ob = new L.Instances('o2_bubble');
    for (const w of [...wa.list, ...wb.list]) if (R() < .22) ob.add([w.p[0] + R.range(-.012, .012), w.p[1] + R.range(.004, .014), w.p[2] + R.range(-.012, .012)], [0, 0, 0, 1], R.range(.6, 1.6));
    instances.o2_bubbles = ob;
    // the far/mid stand-in for hornwort: one soft green blob per clump (this also keeps the number of triangles low from a distance)
    const blobs = clumps.map(([cx, cz]) => { const y0 = bedY(cx, cz); return L.translateMesh(L.scaleMesh(uvSphere(1, 10, 6), [.16, .22, .16]), [cx, y0 + .3, cz]); });
    meshes.hornwort_far = L.merge(...blobs);
  }
  // ================= yellow flag iris: three clumps standing on the marginal shelf, roots and rhizome in the mud =================
  { const clumpsAt = [[2.62, -.5], [2.15, -1.2], [-2.62, .7]];   // on the shelf (about 0.2 m deep), 0.9 of the way to the edge
    const leaves = [], flowers = [], stems = [], rhz = [], roots = new L.Instances('iris_root');
    const leafMesh = (len, wid, curl, seed) => L.blade({ length: len, halfWidth: t => wid / 2 * Math.min(1, .3 + t * 7) * Math.pow(Math.max(0, 1 - Math.pow(t, 3.2)), .55), thickness: .003, nAlong: 9, nAcross: 1, fold: .14, curlAlong: curl });
    // leaf: a sword blade folded along its midrib. The blade grows in +y (length), faces +z; stand it up and spread the fan.
    const leaf1 = L.bakeShade(leafMesh(M.iris.leafLen, M.iris.leafWid, .42), (p, n) => .6 + .4 * Math.min(1, p[1] / .5));
    meshes.iris_leaf = leaf1;
    clumpsAt.forEach(([cx, cz], ci) => {
      const by = bedY(cx, cz), nL = 9, fan = [];
      for (let i = 0; i < nL; i++) {
        const yaw = i / nL * 6.28 + R.range(-.3, .3) + ci, lean = R.range(.05, .38), len = R.range(.55, 1) , s = len;
        // blade in the xy plane -> stand it: it already grows along +y; lean it away from the clump centre about z, then yaw
        const q = L.quatMul(L.quatAxisAngle([0, 1, 0], yaw), L.quatAxisAngle([0, 0, 1], -lean));
        fan.push({ p: [cx + Math.cos(yaw) * .02, POND.yw - .02, cz + Math.sin(yaw) * .02], q, s });
      }
      leaves.push(fan);
      // flowering stem with two flowers
      const sx = cx + R.range(-.04, .04), sz = cz + R.range(-.04, .04), pts = [[sx, by + .02, sz], [sx + .02, .35, sz + .01], [sx + .05, .75, sz + .03], [sx + .06, .98, sz + .03]];
      if (ci < 2) stems.push({ pts, top: pts[3], yaw: R.range(0, 6.28) });
      // rhizome: a thick horizontal stem in the mud, 24 cm, with a few roots
      const rp = [[cx - .12, by - .035, cz - .06], [cx, by - .03, cz], [cx + .13, by - .045, cz + .07]]; rhz.push(L.tube(sp(rp, 10), M.iris.rhizomeR, { sides: 7, caps: true }));
      for (let k = 0; k < 26; k++) { const a = R.range(0, 6.28), t = R.range(0, 1), bx = cx - .12 + .25 * t, bz = cz - .06 + .13 * t, d = [Math.cos(a) * .5, -R.range(.5, 1), Math.sin(a) * .5], q = L.quatFromTo([0, 1, 0], L.norm([-d[0], -d[1], -d[2]]));   // the mesh grows +y; aim it down and out
        roots.add([bx, by - .04, bz], q, R.range(.6, 1.4)); }
    });
    // leaves as instances of the one blade mesh
    const il = new L.Instances('iris_leaf'); for (const fan of leaves) for (const f of fan) il.add(f.p, f.q, f.s);
    instances.iris_leaves = il;
    meshes.iris_root = L.tube([[0, 0, 0], [0, .06, .008], [0, .13, .012], [0, .2, .004]], t => .0012 * (1 - .8 * t), { sides: 4, caps: false });
    // flowers (9 segments: 3 falls, 3 style branches that arch over them, 3 small standards), a stalk, a bud
    const fl = [], bud = [];
    const petal = (len, wid, curl, fold) => L.blade({ length: len, halfWidth: t => wid / 2 * Math.pow(Math.sin(Math.PI * Math.min(1, t * .85 + .12)), .7), thickness: .0016, nAlong: 6, nAcross: 2, curlAlong: curl, curlAcross: .3, fold });
    const fall = petal(.062, .048, -.9, .1), style = petal(.045, .026, -.5, .35), standard = petal(.035, .012, .1, .1);
    const flowerAt = (top, yaw) => {
      const sets = [];
      for (let i = 0; i < 3; i++) { const a = yaw + i * 2.094;
        // falls: hang outward and down
        sets.push(L.transform(fall, p => { const q = L.rotAxis([p[0], p[1], p[2]], [0, 0, 1], -1.25); const w = L.rotAxis(q, [0, 1, 0], a); return [top[0] + w[0], top[1] + w[1], top[2] + w[2]]; }));
        sets.push(L.transform(style, p => { const q = L.rotAxis([p[0], p[1], p[2]], [0, 0, 1], -.62); const w = L.rotAxis(q, [0, 1, 0], a + .15); return [top[0] + w[0], top[1] + .006 + w[1], top[2] + w[2]]; }));
        sets.push(L.transform(standard, p => { const q = L.rotAxis([p[0], p[1], p[2]], [0, 0, 1], -.15); const w = L.rotAxis(q, [0, 1, 0], a + 1.05); return [top[0] + w[0], top[1] + w[1] + .004, top[2] + w[2]]; }));
      }
      return sets;
    };
    const stalks = []; for (const s of stems) { stalks.push(L.tube(sp(s.pts, 14), .005, { sides: 5, caps: true })); fl.push(...flowerAt(s.top, s.yaw)); stalks.push(L.tube([s.pts[2], [s.pts[2][0] + .035, s.pts[2][1] + .1, s.pts[2][2] + .02]], .003, { sides: 4, caps: true }));
      const b = L.translateMesh(L.scaleMesh(uvSphere(1, 6, 4), [.006, .035, .006]), [s.pts[2][0] + .035, s.pts[2][1] + .13, s.pts[2][2] + .02]); bud.push(b); }
    meshes.iris_flowers = L.bakeShade(L.merge(...fl), (p, n) => .8 + .2 * n[1]);
    meshes.iris_stalks = L.merge(...stalks, ...bud);
    meshes.iris_rhizome = L.bakeShade(L.merge(...rhz), () => .8);
    instances.iris_roots = roots;
    // far stand-in for the iris above water: one cone of blades per clump
    meshes.iris_far = L.merge(...clumpsAt.map(([cx, cz]) => L.translateMesh(L.scaleMesh(uvSphere(1, 7, 4), [.16, .42, .16]), [cx, .4, cz])));
  }
  return { meshes, instances };
}
