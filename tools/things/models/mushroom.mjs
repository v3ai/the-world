// The fly agaric (Amanita muscaria): a mature fruit body, a half-open one and a button ("egg"), cut-open views of the mature one and
// of the button, and what is normally hidden: the mycelium in the soil and a host tree's root with mycorrhizal tips.
// A procedural reconstruction from typical measurements (see M below and data/nodes/park_mushroom.json), not a scan of one mushroom.
// Coordinates: thing-local metres, ground at y = 0, mature fruit body on the axis. Cut faces lie in the plane z = 0, facing +z.
import * as L from '../lib/index.mjs';

const TAU = Math.PI * 2, SS = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the numbers chosen for the model (sources: Amanita muscaria, Wikipedia, Description section: cap 5-30 cm, stipe 5-20 cm high and 1-2 cm wide,
// gills free and white, ring white from the partial veil, base a bulb with "two to four distinct rings or ruffs"; spores 9-13 x 6.5-9 um; Mushroom, Wikipedia:
// a primordium under 2 mm grows into an egg-shaped button wrapped in the universal veil). Choices inside those ranges are marked (chosen). ----
const M = {
  capD: .14,          // m, cap diameter of the mature specimen (chosen, inside 5-30 cm; the brief's range 8-20 cm)
  stipeH: .14,        // m, stipe height from ground (chosen, inside 5-20 cm)
  stipeD: .017,       // m, stipe width under the cap (chosen, inside 1-2 cm)
  bulbD: .04,         // m, width of the swollen base (chosen)
  ringY: .118, ringR: .034,   // ring: height on the stipe, skirt radius (chosen)
  gillsLong: 56,      // full-length gills in the model (chosen; real counts vary), plus shorter gills in two tiers between them
  warts: 150,         // warts on the cap (chosen; real number varies and falls with age and rain)
  cordMm: 3.5,        // drawn thickness of the thickest mycelial cord, mm (real hyphae are about 2-10 um: drawn several hundred times too thick)
};
const ST = {
  mature: { cx: 0, cz: 0, R: M.capD / 2, H: M.stipeH, rTop: M.stipeD / 2, droop: .012, thickC: .028, tm: .003 },
  half: { cx: -.19, cz: .14, R: .036, H: .085, rTop: .0078, droop: .026, thickC: .024, tm: .003 },
};
const EGG = { cx: .17, cz: .12 }, EGGCUT = { cx: .17, cz: -.02 };

// ---- helpers ----
const yU = (s, r) => s.H - .002 - s.droop * (r / s.R) ** 2;                                   // underside of the cap (gill-bearing surface)
const yT = (s, r) => yU(s, r) + s.tm + (s.thickC - s.tm) * Math.max(0, 1 - (r / s.R) ** 2) ** 1.25;   // top of the cap
function capProfile(s, n = 30) {   // closed loop: underside from the axis out, round the rim, top back to the axis
  const p = [];
  for (let i = 0; i <= n; i++) { const r = s.R * i / n; p.push([r, yU(s, r)]); }
  p.push([s.R + .0006, yU(s, s.R) + s.tm * .5]);
  for (let i = n; i >= 0; i--) { const r = s.R * i / n; p.push([r, yT(s, r)]); }
  return p;
}
// surface of revolution about Y between angles a0..a1 (x = r cos, z = r sin); orientation fixed by the full solid's signed volume
function rev(profile, a0 = 0, a1 = TAU, segs = 32, flip = null) {
  if (flip === null) flip = L.signedVolume(L.lathe(profile, { segments: 24, caps: false })) < 0;
  const m = L.newMesh(), k = profile.length, n = Math.max(1, Math.round(segs * (a1 - a0) / TAU)), full = Math.abs(a1 - a0 - TAU) < 1e-9, cols = full ? n : n + 1;
  for (let s = 0; s < cols; s++) { const a = a0 + (a1 - a0) * s / n, c = Math.cos(a), sn = Math.sin(a); for (const [r, y] of profile) m.pos.push(r * c, y, r * sn); }
  const id = (s, i) => (s % cols) * k + i;
  for (let s = 0; s < n; s++) for (let i = 0; i < k - 1; i++) { const a = id(s, i), b = id(s + 1, i), c = id(s + 1, i + 1), d = id(s, i + 1); if (flip) m.idx.push(a, c, b, a, d, c); else m.idx.push(a, b, c, a, c, d); }
  return m;
}
function solid(profile, a0 = 0, a1 = TAU, segs = 32) {
  const vol = L.signedVolume(L.lathe(profile, { segments: 24, caps: false }));
  return rev(profile, a0, a1, segs, !(vol < 0));
}
function capSplit(s, n, a0, a1, segs) {   // the red top and the pale underside of the cap as two surfaces, oriented like the closed solid
  const prof = capProfile(s, n), flip = !(L.signedVolume(L.lathe(prof, { segments: 24, caps: false })) < 0);
  return { top: rev(prof.slice(n + 1), a0, a1, segs, flip), under: rev(prof.slice(0, n + 2), a0, a1, segs, flip) };
}
function quad(m, a, b, c, d, want) {   // four points, two triangles; flip so that the normal agrees with `want`
  const i = m.pos.length / 3; m.pos.push(...a, ...b, ...c, ...d);
  const u = L.sub(b, a), v = L.sub(c, a), n = L.cross(u, v);
  if (L.dot(n, want) >= 0) m.idx.push(i, i + 1, i + 2, i, i + 2, i + 3); else m.idx.push(i, i + 2, i + 1, i, i + 3, i + 2);
}
// a flat band between two polylines A and B (each [[x,y],...], same length) in the plane z = zz, facing +z
function band(A, B, zz = 0) { const m = L.newMesh(); for (let i = 0; i < A.length - 1; i++) quad(m, [A[i][0], A[i][1], zz], [A[i + 1][0], A[i + 1][1], zz], [B[i + 1][0], B[i + 1][1], zz], [B[i][0], B[i][1], zz], [0, 0, 1]); return m; }
const xs = (R, n) => Array.from({ length: 2 * n + 1 }, (_, i) => -R + R * i / n);
const tr = (m, x, y, z) => L.translateMesh(m, [x, y, z]);
const shiftXZ = (m, c) => tr(m, c.cx, 0, c.cz);
function ribbon(pts, th, zz = 0) {   // a thin strip of thickness th along a polyline, in the plane z = zz
  const A = [], B = [];
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], t = [q[0] - o[0], q[1] - o[1]], l = Math.hypot(...t) || 1, nrm = [-t[1] / l, t[0] / l]; A.push([p[0] + nrm[0] * th / 2, p[1] + nrm[1] * th / 2]); B.push([p[0] - nrm[0] * th / 2, p[1] - nrm[1] * th / 2]); }
  return band(A, B, zz);
}
const lerpProfile = (pts, y) => { for (let i = 0; i < pts.length - 1; i++) if (y >= pts[i][1] && y <= pts[i + 1][1]) { const t = (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1] || 1); return pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t; } return pts[pts.length - 1][0]; };

// ---- stem profiles (r, y), closed on the axis ----
const STIPE_M = [[0, -.008], [.010, -.008], [.015, 0], [.020, .012], [.0205, .022], [.017, .034], [.0125, .048], [.011, .07], [.0098, .10], [.0088, .13], [.0085, .1385], [.0085, .1385], [0, .1385]];
const STIPE_H = [[0, -.006], [.008, -.006], [.0115, 0], [.0155, .010], [.016, .017], [.0125, .028], [.0095, .045], [.0085, .07], [.0078, .0828], [0, .0828]];
const stemR = (prof, y) => lerpProfile(prof.slice(1, -1), y);

export default function build() {
  const R = L.rng(4242), meshes = {}, instances = {};
  // wart and scale templates: a four-sided pyramid with a base radius of 1 and a height of about 0.7
  { const m = L.newMesh(); const ang = [.785, 2.356, 3.927, 5.498]; ang.forEach(a => m.pos.push(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3)); m.pos.push(0, 1.0, 0, 0, -.12, 0);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; m.idx.push(i, 4, j); m.idx.push(i, j, 5); }   // outward winding checked below
    const sv = L.signedVolume(m); if (sv < 0) m.idx = (() => { const o = []; for (let i = 0; i < m.idx.length; i += 3) o.push(m.idx[i], m.idx[i + 2], m.idx[i + 1]); return o; })();
    meshes.wart = m; }

  // ================= the mature fruit body =================
  const S = ST.mature;
  const capSh = (p, n) => { const r = Math.hypot(p[0], p[2]) / S.R; return (.80 + .2 * SS(0, .9, r)) * (.9 + .12 * L.fbm(p[0] * 40, p[1] * 40, p[2] * 40, { octaves: 2, seed: 3 })) * (.86 + .14 * n[1]); };
  const capFull = capSplit(S, 40, 0, TAU, 64);
  const capMesh = L.bakeShade(capFull.top, (p, n) => { const r = Math.hypot(p[0], p[2]) / S.R; return (.80 + .2 * SS(0, .9, r)) * (.9 + .12 * L.fbm(p[0] * 40, p[1] * 40, p[2] * 40, { octaves: 2, seed: 3 })) * (.86 + .14 * n[1]); });
  meshes.cap = capMesh; meshes.cap_under = capFull.under;
  const stipe = L.bakeShade(solid(STIPE_M, 0, TAU, 40), (p, n) => .84 + .16 * L.fbm(p[0] * 60, p[1] * 8, p[2] * 60, { octaves: 2, seed: 9 }));
  // bulb = the swollen part of the profile below y = .045; stipe above. Both drawn from the one profile, split at y = .045 so the base can be its own part
  const profAbove = [[STIPE_M[8][0] * 0 + stemR(STIPE_M, .045), .045], ...STIPE_M.filter(p => p[1] > .045 && p[0] > 0), [0, STIPE_M[STIPE_M.length - 1][1]]];
  const profBulb = [...STIPE_M.filter(p => p[1] < .045), [stemR(STIPE_M, .045), .045], [0, .045]];
  const stipeUp = L.bakeShade(solid(profAbove, 0, TAU, 40), (p, n) => .84 + .16 * L.fbm(p[0] * 60, p[1] * 8, p[2] * 60, { octaves: 2, seed: 9 }));
  const bulb = L.bakeShade(solid(profBulb, 0, TAU, 40), (p, n) => .8 + .2 * L.fbm(p[0] * 50, p[1] * 30, p[2] * 50, { octaves: 2, seed: 11 }));
  meshes.stipe = stipeUp; meshes.bulb = bulb;
  // ring (annulus): a thin drooping skirt, closed profile, scalloped rim
  const ringProf = (rs) => { const y0 = M.ringY, ro = M.ringR, th = .0009, c = [[rs, y0 + .003], [rs + .006, y0 + .002], [rs + .014, y0 - .004], [ro * .86, y0 - .012], [ro, y0 - .019]]; const up = c.map(([r, y]) => [r, y]), dn = c.map(([r, y]) => [r - .0012 * (r > rs + .001 ? 1 : 0), y - th * 1.4]).reverse(); return [...up, ...dn, up[0]]; };
  const wob = (m) => L.transform(m, p => { const r = Math.hypot(p[0], p[2]); if (r < .02) return p; const a = Math.atan2(p[2], p[0]), f = 1 + .05 * Math.sin(a * 13 + 1) + .04 * L.noise3(Math.cos(a) * 2, 1, Math.sin(a) * 2, 5); const k = 1 + (f - 1) * SS(.018, M.ringR, r); return [p[0] * k, p[1] - .004 * (k - 1) * 5, p[2] * k]; });
  meshes.ring = L.bakeShade(wob(solid(ringProf(stemR(STIPE_M, M.ringY) + .0004), 0, TAU, 56)), (p, n) => .9 + .1 * n[1]);
  // gills
  const rin = stemR(STIPE_M, M.stipeH - .005) + .006;   // free from the stipe: they stop short of it
  const gillMesh = (s, phis, rInner, rOuter) => {
    const m = L.newMesh(), t = .00055;
    for (const { phi, f } of phis) {
      const r1 = s.R - .0012, r0 = r1 - (r1 - rInner) * f, nseg = Math.max(3, Math.ceil((r1 - r0) / .004)), tan = [-Math.sin(phi), 0, Math.cos(phi)], rad = [Math.cos(phi), 0, Math.sin(phi)];
      const top = [], bot = [];
      for (let j = 0; j <= nseg; j++) {
        const r = r0 + (r1 - r0) * j / nseg, u = Math.max(0, Math.min(1, (r - rInner) / (r1 - rInner)));
        let d = u < .55 ? .003 + .0075 * Math.sin(Math.PI / 2 * u / .55) : .0105 - .003 * ((u - .55) / .45) ** 1.5;
        d *= .35 + .65 * SS(0, .08, (r - r0) / (r1 - r0)) * (1 - .25 * SS(.9, 1, (r - r0) / (r1 - r0)));
        top.push([r * rad[0], yU(s, r) + .0004, r * rad[2]]); bot.push([r * rad[0], yU(s, r) - d, r * rad[2]]);
      }
      const off = (p, k) => [p[0] + tan[0] * t * k, p[1], p[2] + tan[2] * t * k];
      for (let j = 0; j < nseg; j++) {
        quad(m, off(top[j], .5), off(top[j + 1], .5), off(bot[j + 1], .5), off(bot[j], .5), tan);
        quad(m, off(top[j], -.5), off(top[j + 1], -.5), off(bot[j + 1], -.5), off(bot[j], -.5), [-tan[0], 0, -tan[2]]);
        quad(m, off(bot[j], .5), off(bot[j + 1], .5), off(bot[j + 1], -.5), off(bot[j], -.5), [0, -1, 0]);
      }
    }
    return m;
  };
  const gillPhis = [], N0 = M.gillsLong;
  for (let k = 0; k < N0; k++) { gillPhis.push({ phi: TAU * k / N0, f: 1, tier: 0 }, { phi: TAU * (k + .5) / N0, f: .66, tier: 1 }, { phi: TAU * (k + .25) / N0, f: .4, tier: 2 }, { phi: TAU * (k + .75) / N0, f: .4, tier: 2 }); }
  meshes.gills = gillMesh(S, gillPhis, rin);
  // warts: positions on the unit disc (Poisson-like), the same for every stage so that the specimens show one cap expanding
  const wartLayout = []; { let guard = 0; while (wartLayout.length < M.warts && guard++ < 20000) { const rho = Math.sqrt(R()) * .965, th = R.range(0, TAU), x = rho * Math.cos(th), z = rho * Math.sin(th); if (wartLayout.some(w => Math.hypot(w.x - x, w.z - z) < .062 * (1 - .15 * rho))) continue; wartLayout.push({ x, z, rho, th, k: R() }); } }
  const wartsOn = (s, c, filt, scale = 1) => {
    const inst = new L.Instances('wart');
    for (const w of wartLayout) {
      if (filt && !filt(w)) continue;
      const r = w.rho * s.R, e = .0008, dy = (yT(s, Math.min(s.R, r + e)) - yT(s, Math.max(0, r - e))) / (2 * e), nrm = L.norm([-dy * Math.cos(w.th), 1, -dy * Math.sin(w.th)]);
      const base = (.0011 + .0014 * w.k) * (1 - .3 * w.rho) * scale, p = [c.cx + w.x * s.R, yT(s, r) - base * .12, c.cz + w.z * s.R];
      inst.add(p, L.quatMul(L.quatFromTo([0, 1, 0], nrm), L.quatAxisAngle([0, 1, 0], R.range(0, TAU))), [base, base * R.range(.8, 1.15), base]);
    }
    return inst;
  };
  instances.warts = wartsOn(S, ST.mature, null);
  // scales of the volva: three rings of small recurved scales on the bulb (the remains of the universal veil's base)
  const volvaScales = (prof, c, ys, counts, size, seed) => {
    const inst = new L.Instances('wart'), rr = L.rng(seed);
    ys.forEach((y, ri) => { const r0 = stemR(prof, y), n = counts[ri]; for (let i = 0; i < n; i++) { const a = TAU * (i + rr.range(-.2, .2)) / n + ri * .4, out = [Math.cos(a), 0, Math.sin(a)], nrm = L.norm([out[0] * .85, .5, out[2] * .85]);
      inst.add([c.cx + out[0] * (r0 - size * .1), y, c.cz + out[2] * (r0 - size * .1)], L.quatMul(L.quatFromTo([0, 1, 0], nrm), L.quatAxisAngle([0, 1, 0], a)), [size * rr.range(.9, 1.3), size * rr.range(.7, 1), size * rr.range(.8, 1.3) * 1.3]); } });
    return inst;
  };
  instances.volva_scales = volvaScales(STIPE_M, ST.mature, [.007, .015, .024], [15, 13, 10], .0035, 21);

  // far stand-ins (a few hundred triangles)
  meshes.cap_far = solid(capProfile(S, 6), 0, TAU, 14); meshes.stipe_far = solid([[0, 0], [.02, 0], [.02, .02], [.0098, .06], [.0085, .1385], [0, .1385]], 0, TAU, 8);

  // ================= the half-open specimen =================
  const H = ST.half;
  meshes.h_cap = shiftXZ(L.bakeShade(solid(capProfile(H, 30), 0, TAU, 48), (p, n) => (.8 + .2 * SS(0, .9, Math.hypot(p[0], p[2]) / H.R)) * (.9 + .12 * L.fbm(p[0] * 60, p[1] * 60, p[2] * 60, { octaves: 2, seed: 4 }))), H);
  meshes.h_stipe = shiftXZ(L.bakeShade(solid(STIPE_H.filter((_, i) => true), 0, TAU, 28), (p, n) => .84 + .16 * L.fbm(p[0] * 60, p[1] * 8, p[2] * 60, { octaves: 2, seed: 9 })), H);
  { // partial veil: a thin cone from the cap margin to the stipe (still unbroken)
    const y1 = .056, r1 = stemR(STIPE_H, y1) + .0004, c = [[r1, y1], [r1 + .007, y1 + .001], [H.R * .62, yU(H, H.R) - .006], [H.R * .98, yU(H, H.R) - .0015]], pr = [...c, ...c.map(([r, y]) => [r - .0007, y - .0016]).reverse(), c[0]];
    meshes.h_veil = shiftXZ(solid(pr, 0, TAU, 40), H); }
  instances.h_warts = wartsOn(H, H, null, .75);
  instances.h_scales = volvaScales(STIPE_H, H, [.006, .013], [11, 9], .0027, 22);
  meshes.h_stipe_far = shiftXZ(solid([[0, 0], [.014, 0], [.008, .08], [0, .0828]], 0, TAU, 6), H);

  // ================= the button ("egg"): the whole fruit body wrapped in the universal veil =================
  const eggProf = [[0, -.004], [.007, -.004], [.014, .003], [.0185, .014], [.019, .024], [.0165, .034], [.010, .043], [.0035, .0475], [0, .0485]];
  meshes.egg = shiftXZ(L.bakeShade(solid(eggProf, 0, TAU, 36), (p, n) => .86 + .14 * L.fbm(p[0] * 80, p[1] * 80, p[2] * 80, { octaves: 2, seed: 6 })), EGG);
  { const inst = new L.Instances('wart'), rr = L.rng(77); for (let i = 0; i < 46; i++) { const y = rr.range(.006, .044), r = lerpProfile(eggProf, y), a = rr.range(0, TAU), out = [Math.cos(a), 0, Math.sin(a)], dr = (lerpProfile(eggProf, y + .002) - lerpProfile(eggProf, y - .002)) / .004, nrm = L.norm([out[0], -dr, out[2]]), s = rr.range(.0011, .0021);
    inst.add([EGG.cx + out[0] * (r - s * .1), y, EGG.cz + out[2] * (r - s * .1)], L.quatMul(L.quatFromTo([0, 1, 0], nrm), L.quatAxisAngle([0, 1, 0], a)), [s, s, s]); } instances.egg_flakes = inst; }

  // ================= cut in half: the mature fruit body (plane z = 0, kept half z <= 0) =================
  const lo = Math.PI, hi = TAU, nx = 44, X = xs(S.R, nx), rr_ = x => Math.abs(x);
  const topY = x => yT(S, rr_(x)), undY = x => yU(S, rr_(x));
  const cut = {};
  cut.cuticle = band(X.map(x => [x, topY(x)]), X.map(x => [x, Math.max(undY(x), topY(x) - .0012)]), .0002);
  cut.subcuticle = band(X.map(x => [x, Math.max(undY(x), topY(x) - .0012)]), X.map(x => [x, Math.max(undY(x), topY(x) - .004)]), .0002);
  cut.flesh = band(X.map(x => [x, Math.max(undY(x), topY(x) - .004)]), X.map(x => [x, undY(x)]), .0002);
  { // gill cut lengthwise (the gill at phi = 0 and phi = pi lies in the cutting plane): one profile each side
    const A = [], B = [], gn = 20, sgn = [1, -1], parts = [];
    const r1 = S.R - .0012;
    for (const sg of sgn) { const a = [], b = []; for (let j = 0; j <= gn; j++) { const r = rin + (r1 - rin) * j / gn, u = j / gn; let d = u < .55 ? .003 + .0075 * Math.sin(Math.PI / 2 * u / .55) : .0105 - .003 * ((u - .55) / .45) ** 1.5; d *= .35 + .65 * SS(0, .08, u) * (1 - .25 * SS(.9, 1, u)); a.push([sg * r, yU(S, r) - d]); b.push([sg * r, yU(S, r) + .0003]); } parts.push(sg > 0 ? band(a, b, .0004) : band(a.slice().reverse(), b.slice().reverse(), .0004)); }
    cut.gill = L.merge(...parts); }
  { // stipe section
    const ys = Array.from({ length: 41 }, (_, i) => -.008 + (S.H - .002 + .008) * i / 40), prof = STIPE_M;
    const Lw = ys.map(y => [-stemR(prof, Math.min(y, .1385)), y]), Rw = ys.map(y => [stemR(prof, Math.min(y, .1385)), y]);
    cut.stipe = band(Lw, Rw, 0);
  }
  { // ring section: two thin ribbons
    const rs = stemR(STIPE_M, M.ringY) + .0004, y0 = M.ringY, ro = M.ringR, c = [[rs, y0 + .003], [rs + .006, y0 + .002], [rs + .014, y0 - .004], [ro * .86, y0 - .012], [ro, y0 - .019]];
    cut.ring = L.merge(ribbon(c, .0016, .0003), ribbon(c.map(([r, y]) => [-r, y]), .0016, .0003)); }
  // outer surfaces of the kept half
  const capHalf = capSplit(S, 40, lo, hi, 64); meshes.c_cap = L.bakeShade(capHalf.top, (p, n) => (.80 + .2 * SS(0, .9, Math.hypot(p[0], p[2]) / S.R)) * (.86 + .14 * n[1])); meshes.c_under = capHalf.under;
  meshes.c_stipe = solid(profAbove, lo, hi, 40); meshes.c_bulb = solid(profBulb, lo, hi, 40);
  meshes.c_ring = wob(solid(ringProf(stemR(STIPE_M, M.ringY) + .0004), lo, hi, 56));
  meshes.c_gills = gillMesh(S, gillPhis.filter(g => Math.sin(g.phi) < -1e-6), rin);
  instances.c_warts = (() => { const inst = new L.Instances('wart'); wartsOn(S, ST.mature, w => w.z < 0).list.forEach(t => inst.list.push(t)); return inst; })();
  instances.c_scales = (() => { const inst = new L.Instances('wart'); instances.volva_scales.list.filter(t => t.p[2] <= .0005).forEach(t => inst.list.push(t)); return inst; })();
  meshes.c_flesh = cut.flesh; meshes.c_cuticle = cut.cuticle; meshes.c_subcuticle = cut.subcuticle; meshes.c_gill = cut.gill; meshes.c_stipe_sec = cut.stipe; meshes.c_ring_sec = cut.ring;

  // ================= cut in half: the button =================
  { const E = EGGCUT, ep = eggProf;
    const ys = Array.from({ length: 31 }, (_, i) => -.004 + .0525 * i / 30);
    const veilIn = y => Math.max(.001, lerpProfile(ep, y) - .0026);   // veil thickness drawn 2.6 mm (chosen)
    const outerL = ys.map(y => [-lerpProfile(ep, y), y]), outerR = ys.map(y => [lerpProfile(ep, y), y]);
    // veil: two walls (left and right), plus the roof
    const vl = band(ys.map(y => [-lerpProfile(ep, y), y]), ys.map(y => [-veilIn(y), y]), 0), vr = band(ys.map(y => [veilIn(y), y]), ys.map(y => [lerpProfile(ep, y), y]), 0);
    // inside: the stipe (a short stalk), the cap (a red dome pressed against it) and the gill chamber between
    const stR = y => .0042 + .0012 * Math.max(0, (.022 - y) / .022);
    const stemYs = Array.from({ length: 12 }, (_, i) => .0 + .030 * i / 11);
    const stemSec = band(stemYs.map(y => [-stR(y), y]), stemYs.map(y => [stR(y), y]), 0);
    const capR = .0125, capBase = .022, capTop = .0405;
    const capX = xs(capR, 16), capT = x => capBase + (capTop - capBase) * Math.sqrt(Math.max(0, 1 - (x / capR) ** 2)) , capU = x => capBase + .0035 * (1 - Math.max(0, 1 - (x / capR) ** 2));
    const cCut = band(capX.map(x => [x, capT(x)]), capX.map(x => [x, Math.max(capU(x), capT(x) - .0010)]), .0002);
    const cSub = band(capX.map(x => [x, Math.max(capU(x), capT(x) - .0010)]), capX.map(x => [x, Math.max(capU(x), capT(x) - .0030)]), .0002);
    const cFl = band(capX.map(x => [x, Math.max(capU(x), capT(x) - .0030)]), capX.map(x => [x, capU(x)]), .0002);
    // young gills: short plates hanging into the chamber
    const gX = [-1, 1].map(sg => Array.from({ length: 8 }, (_, i) => sg * (stR(.02) + .002 + (capR - stR(.02) - .003) * i / 7)));
    const gillsE = L.merge(...gX.map(arr => band(arr.map(x => [x, capU(Math.abs(x)) - .0045 * Math.sin(Math.PI * (Math.abs(x) - stR(.02)) / (capR - stR(.02)))]), arr.map(x => [x, capU(Math.abs(x)) + .0003]), .0004)));
    const sh = m => tr(m, E.cx, 0, E.cz);
    meshes.e_veil = sh(L.merge(vl, vr)); meshes.e_stem = sh(stemSec); meshes.e_cap_cuticle = sh(cCut); meshes.e_cap_sub = sh(cSub); meshes.e_cap_flesh = sh(cFl); meshes.e_gills = sh(gillsE);
    // the veil shell's outer surface (the half kept, z <= 0)
    meshes.e_outer = sh(solid(eggProf, lo, hi, 36));
    // its roof: the sectioned solid is closed by the veil only above the cap
    const roofX = xs(veilIn(.0475) + .0004, 6); void roofX;
    meshes.e_roof = sh(band(Array.from({ length: 13 }, (_, i) => { const y = capTop + .0002 + .0075 * i / 12; return [-Math.max(0, veilIn(y)), y]; }), Array.from({ length: 13 }, (_, i) => { const y = capTop + .0002 + .0075 * i / 12; return [Math.max(0, veilIn(y)), y]; }), 0));
    void outerL; void outerR;
  }

  // ================= soil, mycelium, a host tree's root with mycorrhizal tips =================
  const SOIL = { r: .78, d: .5 };
  meshes.soil = L.merge(L.lathe([[SOIL.r, 0], [SOIL.r, -SOIL.d], [0, -SOIL.d]], { segments: 40, caps: false }));
  const hub = [0, -.035, 0], bases = [[0, 0, 0], [EGG.cx, 0, EGG.cz], [H.cx, 0, H.cz]];
  // host root: a horizontal root of a birch or pine, entering from the left edge of the soil block (the tree itself is off the model)
  const rootPts = [[-.78, -.15, .34], [-.5, -.19, .31], [-.2, -.2, .36], [.1, -.17, .30], [.4, -.19, .35], [.78, -.16, .30]];
  const rootCurve = L.spline(rootPts), rootRad = t => .021 - .011 * t;
  meshes.root = L.tube(rootCurve.sample(40), rootRad, { sides: 12, caps: true });
  const lat = [], coreT = [], sheathT = [], tips = [], rr = L.rng(311);
  const nLat = 15;
  for (let i = 0; i < nLat; i++) {
    const u = .08 + .84 * i / (nLat - 1), p = rootCurve(u), side = i % 2 ? 1 : -1, ang = rr.range(.2, .9), len = rr.range(.07, .15);
    const dir = L.norm([rr.range(-.3, .3), -.35 * rr.range(.4, 1.3), side * (.8 + rr.range(-.2, .2))]);
    const q0 = [p[0], p[1] + (i % 3 === 0 ? 0 : 0), p[2] + side * rootRad(u) * .8], mid = L.add(q0, L.mul(dir, len * .55)), end = L.add(q0, L.mul(L.norm(L.add(dir, [rr.range(-.4, .4), -.1, rr.range(-.3, .3)])), len)); void ang;
    end[1] = Math.max(-.4, Math.min(-.06, end[1]));
    lat.push(L.tube(L.spline([q0, mid, end]).sample(8), t => .0030 - .0012 * t, { sides: 6, caps: true }));
    // a cluster of 3-5 mycorrhizal tips at the end of the lateral
    const nt = 3 + (i % 3);
    for (let k = 0; k < nt; k++) {
      const d = L.norm([rr.range(-1, 1), rr.range(-.6, .5), rr.range(-1, 1)]), l = rr.range(.022, .034), a = L.add(end, L.mul(d, .004)), b = L.add(end, L.mul(d, l)), m2 = L.add(end, L.mul(L.add(d, [rr.range(-.3, .3), rr.range(-.3, .3), rr.range(-.3, .3)]), l * .55));
      const pth = L.spline([a, m2, b]).sample(6);
      coreT.push(L.tube(pth, t => .0018 - .0006 * t, { sides: 6, caps: true }));
      sheathT.push(L.tube(pth.slice(2), t => .0042 * (1 - .3 * t * t * t) , { sides: 8, caps: true }));
      tips.push({ a, b, lat: i });
    }
  }
  meshes.rootlets = L.merge(...lat); meshes.ecm_core = L.merge(...coreT); meshes.ecm_sheath = L.merge(...sheathT);
  // mycelium: cords from each fruit body to a hub, a radiating exploring network, and strands that reach the mycorrhizal tips
  const hy = [], addH = (pts, r0, r1, sides = 5) => hy.push(L.tube(L.spline(pts).sample(Math.max(4, pts.length * 2)), t => r0 + (r1 - r0) * t, { sides, caps: true }));
  const cord = M.cordMm / 1000 / 2 * 1.3;
  bases.forEach((b, i) => addH([[b[0], -.002, b[2]], [b[0] * .6 + hub[0] * .4, -.02, b[2] * .6 + hub[2] * .4], hub], cord * .55, cord, 7));
  const grow = (p, dir, len, rad, depth) => {
    const pts = [p]; let d = dir, q = p; const step = .045;
    for (let s = 0; s < Math.floor(len / step); s++) {
      d = L.norm(L.add(d, [rr.range(-.35, .35), rr.range(-.25, .25) - (q[1] > -.1 ? .2 : 0) + (q[1] < -.3 ? .4 : 0), rr.range(-.35, .35)]));
      q = L.add(q, L.mul(d, step)); if (Math.hypot(q[0], q[2]) > SOIL.r - .03) break; q = [q[0], Math.max(-.44, Math.min(-.012, q[1])), q[2]]; pts.push(q);
      if (depth < 2 && rr() < .22 && s > 0) grow(q, L.norm(L.add(d, [rr.range(-.9, .9), rr.range(-.4, .4), rr.range(-.9, .9)])), len * .6, rad * .8, depth + 1);
    }
    if (pts.length > 2) addH(pts, rad, Math.max(rad * .75, .0011));
  };
  for (let i = 0; i < 22; i++) { const a = TAU * i / 22 + rr.range(-.2, .2); grow(hub, L.norm([Math.cos(a), rr.range(-.15, .1), Math.sin(a)]), rr.range(.45, .7), cord * .6, 0); }
  // strands to the tips: a bundle from the hub to the root, then single hyphae to each tip
  const trunkTo = tips.slice(0, 12);
  trunkTo.forEach((t, i) => { const mid = [(hub[0] + t.b[0]) / 2 + rr.range(-.05, .05), (hub[1] + t.b[1]) / 2 + rr.range(-.03, .03), (hub[2] + t.b[2]) / 2 + rr.range(-.05, .05)]; addH([hub, L.lerp3(hub, mid, .5), mid, L.lerp3(mid, t.b, .6), t.b], cord * .35, .0012, 5); });
  for (let i = 12; i < tips.length; i += 2) { const t = tips[i], from = tips[(i + 3) % tips.length]; addH([t.b, L.lerp3(t.b, [t.b[0] * .85, t.b[1] - .02, t.b[2] * .85], .5), [t.b[0] * .8, t.b[1] - .035, t.b[2] * .7]], .0011, .0007, 4); void from; }
  meshes.mycelium = L.merge(...hy);

  // ================= the description =================
  const SYS = [{ id: 'mature', label: 'Mature fruit body' }, { id: 'halfopen', label: 'Half-open fruit body' }, { id: 'egg', label: 'Button stage' }, { id: 'half', label: 'Cut fruit body' }, { id: 'eggcut', label: 'Cut button' }, { id: 'soil', label: 'Soil' }, { id: 'mycelium', label: 'Mycelium' }, { id: 'root', label: 'Host root' }];
  const rtip = tips[3].b, rtip2 = tips[8].b, rootAt = rootCurve(.55);
  const gillMid = [.034, yU(S, .034) - .006, 0.0006];
  const thing = {
    id: 'mushroom', title: 'Fly agaric', label: 'Fly agaric', scientific: 'Amanita muscaria', node: 'park_mushroom', main_part: 'cap',
    blurb: 'A fly agaric, with a half-open one and a button beside it. Click the cap, the white warts, the gills, the ring or the swollen base. Use the layer buttons to cut it in half, see the threads underground, or follow how it grows.',
    model_note: 'A model built from typical measurements of the species, not a scan of one mushroom. The cap is ' + Math.round(M.capD * 100) + ' cm across (the species ranges from about 5 to 30 cm); the number of gills and warts is chosen. Underground, the fungal threads are drawn several hundred times thicker than they are.',
    size_m: { cap_diameter: M.capD, height: M.stipeH + .02, stipe_width: M.stipeD }, height_m: .17, radius_m: .85, draw_m: 260, seed: 4242,
    systems: SYS, lod: { near_m: 12 },
    shadow: { radius_m: .26, opacity: .75, offset: [.0, .0] },
    modes: [
      { id: 'whole', label: 'Whole', show: { mature: 1, halfopen: 1, egg: 1 } },
      { id: 'wood', label: 'Cut in half', pivot: 'wood', show: { half: 1, eggcut: 1 }, hotspots: true,
        legend: { title: 'What the cut shows', items: [{ name: 'Red skin (cuticle)', color: '#c8261b', node: 'fa_cuticle' }, { name: 'Yellow layer under the skin', color: '#e8c24a', node: 'fa_cuticle' }, { name: 'White flesh', color: '#fbf8ee', node: 'fa_cap_flesh' }, { name: 'Gill', color: '#f2ecdd', node: 'fa_gills' }, { name: 'Stipe (stem)', color: '#f1ecdf', node: 'fa_stipe' }, { name: 'Ring', color: '#f4efe3', node: 'fa_ring' }], note: 'The layers of skin are drawn thicker than they are, to be visible. The button on the right is cut the same way.' } },
      { id: 'under', label: 'Underground', show: { mature: .12, halfopen: .12, egg: .12, soil: 1, mycelium: 1, root: 1 }, groundSeeThrough: true, hotspots: true,
        legend: { title: 'Underground', items: [{ name: 'Mycelium (threads of the fungus)', color: '#f6f3ea', node: 'fa_mycelium' }, { name: 'Root of a host tree', color: '#7a5b3f', node: 'fa_host_root' }, { name: 'Root tips wrapped in fungus', color: '#efe1b8', node: 'fa_ecm' }, { name: 'Soil', color: '#6b4c32', node: 'bio_soil_ecology' }], note: 'Fungal threads are drawn several hundred times thicker than real; root tips are drawn larger than life too.' } },
      { id: 'grows', label: 'How it grows', show: { mature: 1, halfopen: 1, egg: 1 }, hotspots: true,
        legend: { title: 'Three stages', items: [{ name: '1  Button (egg)', color: '#f1ece0', node: 'fa_button' }, { name: '2  Half open', color: '#d02a1e', node: 'fa_expanding' }, { name: '3  Mature', color: '#d02a1e', node: 'fa_cap' }], note: 'Three different fruit bodies standing side by side, drawn at one moment as stages of one life. They are not one mushroom photographed over time.' } },
    ],
    hotspots: [
      { id: 'hs_half', node: 'fa_cut_half', at: [.0, .075, .004], label: 'Inside a fly agaric', r: .004, modes: ['wood'] },
      { id: 'hs_gill', node: 'fa_gill_inside', at: gillMid.map(v => +v.toFixed(4)), label: 'Inside a gill: the spore-making layer', r: .0025, modes: ['wood'] },
      { id: 'hs_flesh', node: 'fa_cap_flesh', at: [-.03, yU(S, .03) + .012, .0016], label: 'Flesh of the cap', r: .0025, modes: ['wood'] },
      { id: 'hs_cuticle', node: 'fa_cuticle', at: [-.05, yT(S, .05) - .0012, .0016], label: 'Red skin of the cap', r: .003, modes: ['wood'] },
      { id: 'hs_ring', node: 'fa_ring', at: [M.ringR * .9, M.ringY - .018, .0008], label: 'Ring: the torn partial veil', r: .0025, modes: ['wood'] },
      { id: 'hs_base', node: 'fa_volva', at: [.017, .012, .001], label: 'Swollen base with scales', r: .0025, modes: ['wood'] },
      { id: 'hs_egg', node: 'fa_button', at: [EGGCUT.cx, .024, EGGCUT.cz + .0005], label: 'Inside the button', r: .0025, modes: ['wood'] },
      { id: 'hs_hub', node: 'fa_mycelium', at: hub, label: 'Mycelium: the fungus itself', r: .02, modes: ['under'] },
      { id: 'hs_tip', node: 'fa_ecm', at: rtip.map(v => +v.toFixed(3)), label: 'Root tip wrapped in fungus', r: .02, modes: ['under'] },
      { id: 'hs_tip2', node: 'fa_trade', at: rtip2.map(v => +v.toFixed(3)), label: 'Where sugar is swapped for minerals', r: .02, modes: ['under'] },
      { id: 'hs_root', node: 'fa_host_root', at: rootAt.map(v => +v.toFixed(3)), label: 'Root of a partner tree', r: .03, modes: ['under'] },
      { id: 'hs_g1', node: 'fa_button', at: [EGG.cx, .052, EGG.cz], label: '1  Button', r: .006, modes: ['grows'] },
      { id: 'hs_g2', node: 'fa_expanding', at: [H.cx, .09, H.cz], label: '2  Veil tearing', r: .006, modes: ['grows'] },
      { id: 'hs_g3', node: 'fa_cap', at: [0, .17, 0], label: '3  Mature', r: .006, modes: ['grows'] },
    ],
    parts: [
      { id: 'cap', name: 'Cap (pileus)', system: 'mature', node: 'fa_cap', color: '#d12a1d', mesh: 'cap', lod: 'near', ink_w: .0016, priority: 1.4, solid: false, deeper: { type: 'tissue2', id: 'mushroom_flesh', D: 8e-4, button: 'Look inside the cap flesh' } },
      { id: 'cap_under', name: 'Underside of the cap', system: 'mature', node: 'fa_gills', color: '#e8dfc6', mesh: 'cap_under', lod: 'near', double: true, noink: true, priority: 1.5, solid: false },
      { id: 'warts', name: 'Warts (universal veil remnants)', system: 'mature', node: 'fa_warts', color: '#f6f1e2', instances: 'warts', tint: .12, lod: 'near', priority: 1.9 },
      { id: 'gills', name: 'Gills (lamellae)', system: 'mature', node: 'fa_gills', color: '#f2ecdd', mesh: 'gills', lod: 'near', double: true, noink: true, priority: 1.7, solid: false, deeper: { type: 'tissue2', id: 'mushroom_gill', D: 6e-4, button: 'Look inside a gill' } },
      { id: 'stipe', name: 'Stipe (stem)', system: 'mature', node: 'fa_stipe', color: '#f1ecdf', mesh: 'stipe', lod: 'near', ink_w: .0014, priority: 1.5, solid: false },
      { id: 'ring', name: 'Ring (annulus)', system: 'mature', node: 'fa_ring', color: '#f4efe3', mesh: 'ring', lod: 'near', ink_w: .0012, priority: 1.8, solid: false },
      { id: 'bulb', name: 'Swollen base (volva remains)', system: 'mature', node: 'fa_volva', color: '#ece4d0', mesh: 'bulb', lod: 'near', ink_w: .0014, priority: 1.6, solid: false },
      { id: 'volva_scales', name: 'Rings of scales on the base', system: 'mature', node: 'fa_volva', color: '#f4eede', instances: 'volva_scales', tint: .12, lod: 'near', priority: 1.9 },
      { id: 'cap_far', name: 'Cap (pileus)', system: 'mature', node: 'fa_cap', color: '#d12a1d', mesh: 'cap_far', lod: 'far', priority: 1.4, solid: false, far_of: 'cap' },
      { id: 'stipe_far', name: 'Stipe (stem)', system: 'mature', node: 'fa_stipe', color: '#f1ecdf', mesh: 'stipe_far', lod: 'far', priority: 1.5, solid: false, far_of: 'stipe' },
      { id: 'h_cap', name: 'Cap, half open', system: 'halfopen', node: 'fa_expanding', color: '#d12a1d', mesh: 'h_cap', lod: 'near', ink_w: .0014, priority: 1.4, solid: false },
      { id: 'h_warts', name: 'Warts', system: 'halfopen', node: 'fa_warts', color: '#f6f1e2', instances: 'h_warts', tint: .12, lod: 'near', priority: 1.9 },
      { id: 'h_veil', name: 'Partial veil (still joined)', system: 'halfopen', node: 'fa_ring', color: '#f4efe3', mesh: 'h_veil', lod: 'near', ink_w: .0010, priority: 1.8, solid: false },
      { id: 'h_stipe', name: 'Stipe, half open', system: 'halfopen', node: 'fa_stipe', color: '#f1ecdf', mesh: 'h_stipe', lod: 'near', ink_w: .0012, priority: 1.5, solid: false },
      { id: 'h_scales', name: 'Scales on the base', system: 'halfopen', node: 'fa_volva', color: '#f4eede', instances: 'h_scales', tint: .12, lod: 'near', priority: 1.9 },
      { id: 'h_far', name: 'Half-open fruit body', system: 'halfopen', node: 'fa_expanding', color: '#e9e2d0', mesh: 'h_stipe_far', lod: 'far', priority: 1.4, solid: false, far_of: 'h_stipe' },
      { id: 'egg', name: 'Button (universal veil)', system: 'egg', node: 'fa_button', color: '#f1ece0', mesh: 'egg', ink_w: .0012, priority: 1.5, solid: false },
      { id: 'egg_flakes', name: 'Veil flakes', system: 'egg', node: 'fa_button', color: '#f1e8c6', instances: 'egg_flakes', tint: .1, lod: 'near', priority: 1.9 },
      // cut-open mature fruit body (all pivoted so the cut faces the camera)
      { id: 'c_cap', name: 'Cap (pileus)', system: 'half', node: 'fa_cap', color: '#d12a1d', mesh: 'c_cap', pivot: 'wood', ink_w: .0014, priority: 1.4, solid: false },
      { id: 'c_under', name: 'Underside of the cap', system: 'half', node: 'fa_gills', color: '#e8dfc6', mesh: 'c_under', pivot: 'wood', double: true, noink: true, priority: 1.5, solid: false },
      { id: 'c_warts', name: 'Warts', system: 'half', node: 'fa_warts', color: '#f6f1e2', instances: 'c_warts', pivot: 'wood', tint: .12, priority: 1.9 },
      { id: 'c_gills', name: 'Gills (lamellae)', system: 'half', node: 'fa_gills', color: '#f2ecdd', mesh: 'c_gills', pivot: 'wood', double: true, noink: true, priority: 1.7, solid: false },
      { id: 'c_stipe', name: 'Stipe (stem)', system: 'half', node: 'fa_stipe', color: '#f1ecdf', mesh: 'c_stipe', pivot: 'wood', ink_w: .0012, priority: 1.5, solid: false },
      { id: 'c_bulb', name: 'Swollen base', system: 'half', node: 'fa_volva', color: '#ece4d0', mesh: 'c_bulb', pivot: 'wood', ink_w: .0012, priority: 1.6, solid: false },
      { id: 'c_scales', name: 'Scales on the base', system: 'half', node: 'fa_volva', color: '#f4eede', instances: 'c_scales', pivot: 'wood', tint: .12, priority: 1.9 },
      { id: 'c_ring', name: 'Ring (annulus)', system: 'half', node: 'fa_ring', color: '#f4efe3', mesh: 'c_ring', pivot: 'wood', ink_w: .001, priority: 1.8, solid: false },
      { id: 'c_cuticle', name: 'Cuticle (red skin)', system: 'half', node: 'fa_cuticle', color: '#c8261b', mesh: 'c_cuticle', pivot: 'wood', double: true, noink: true, priority: 2, solid: false, deeper: { type: 'tissue2', id: 'mushroom_flesh', D: 8e-4, button: 'Look inside the cap flesh' } },
      { id: 'c_subcuticle', name: 'Yellow layer under the skin', system: 'half', node: 'fa_cuticle', color: '#e8c24a', mesh: 'c_subcuticle', pivot: 'wood', double: true, noink: true, priority: 2, solid: false },
      { id: 'c_flesh', name: 'Flesh of the cap', system: 'half', node: 'fa_cap_flesh', color: '#fbf8ee', mesh: 'c_flesh', pivot: 'wood', double: true, noink: true, priority: 1.8, solid: false, deeper: { type: 'tissue2', id: 'mushroom_flesh', D: 8e-4, button: 'Look inside the cap flesh' } },
      { id: 'c_gill', name: 'Gill, cut lengthwise', system: 'half', node: 'fa_gill_inside', color: '#efe3c4', mesh: 'c_gill', pivot: 'wood', double: true, noink: true, priority: 2, solid: false, deeper: { type: 'tissue2', id: 'mushroom_gill', D: 6e-4, button: 'Look inside a gill' } },
      { id: 'c_stipe_sec', name: 'Stipe, cut', system: 'half', node: 'fa_stipe', color: '#f1ecdf', mesh: 'c_stipe_sec', pivot: 'wood', double: true, noink: true, priority: 1.8, solid: false },
      { id: 'c_ring_sec', name: 'Ring, cut', system: 'half', node: 'fa_ring', color: '#f4efe3', mesh: 'c_ring_sec', pivot: 'wood', double: true, noink: true, priority: 2, solid: false },
      // cut-open button
      { id: 'e_outer', name: 'Button (universal veil)', system: 'eggcut', node: 'fa_button', color: '#f1ece0', mesh: 'e_outer', pivot: 'wood', double: true, noink: true, priority: 1.5, solid: false },
      { id: 'e_veil', name: 'Universal veil, cut', system: 'eggcut', node: 'fa_button', color: '#f1ece0', mesh: 'e_veil', pivot: 'wood', double: true, noink: true, priority: 1.8, solid: false },
      { id: 'e_roof', name: 'Universal veil, cut', system: 'eggcut', node: 'fa_button', color: '#f1ece0', mesh: 'e_roof', pivot: 'wood', double: true, noink: true, priority: 1.8, solid: false },
      { id: 'e_stem', name: 'Young stipe', system: 'eggcut', node: 'fa_stipe', color: '#f1ecdf', mesh: 'e_stem', pivot: 'wood', double: true, noink: true, priority: 1.8, solid: false },
      { id: 'e_cap_cuticle', name: 'Young cap, red skin', system: 'eggcut', node: 'fa_cuticle', color: '#c8261b', mesh: 'e_cap_cuticle', pivot: 'wood', double: true, noink: true, priority: 2, solid: false },
      { id: 'e_cap_sub', name: 'Yellow layer under the skin', system: 'eggcut', node: 'fa_cuticle', color: '#e8c24a', mesh: 'e_cap_sub', pivot: 'wood', double: true, noink: true, priority: 2, solid: false },
      { id: 'e_cap_flesh', name: 'Young cap, flesh', system: 'eggcut', node: 'fa_cap_flesh', color: '#fbf8ee', mesh: 'e_cap_flesh', pivot: 'wood', double: true, noink: true, priority: 1.9, solid: false },
      { id: 'e_gills', name: 'Young gills', system: 'eggcut', node: 'fa_gills', color: '#f2ecdd', mesh: 'e_gills', pivot: 'wood', double: true, noink: true, priority: 2, solid: false },
      // underground
      { id: 'soil', name: 'Soil', system: 'soil', node: 'bio_soil_ecology', color: '#6b4c32', mesh: 'soil', priority: .5, solid: false, noink: true, opacity_max: .3 },
      { id: 'mycelium', name: 'Mycelium (fungal threads)', system: 'mycelium', node: 'fa_mycelium', color: '#f6f3ea', mesh: 'mycelium', priority: 1.8, solid: false, noink: true, deeper: { type: 'tissue2', id: 'mushroom_ecm', D: 4e-4, button: 'Look at a root tip and its fungal partner' } },
      { id: 'root', name: 'Root of a host tree', system: 'root', node: 'fa_host_root', color: '#8a6a47', mesh: 'root', priority: 1.5, solid: false, noink: true },
      { id: 'rootlets', name: 'Fine roots', system: 'root', node: 'fa_host_root', color: '#a98d62', mesh: 'rootlets', priority: 1.6, solid: false, noink: true },
      { id: 'ecm_core', name: 'Root tips (inside the sheath)', system: 'root', node: 'fa_ecm', color: '#b89a6c', mesh: 'ecm_core', priority: 1.8, solid: false, noink: true },
      { id: 'ecm_sheath', name: 'Fungal sheath (mantle) on a root tip', system: 'root', node: 'fa_ecm', color: '#efe1b8', mesh: 'ecm_sheath', priority: 1.9, solid: false, noink: true, deeper: { type: 'tissue2', id: 'mushroom_ecm', D: 4e-4, button: 'Look at a root tip and its fungal partner' } },
    ],
  };
  const stats = { warts: wartLayout.length, gills: gillPhis.length, tips: tips.length, hyphaeTubes: hy.length };
  console.log('fly agaric model:', JSON.stringify(stats));
  void tr; void SOIL;
  return { thing, meshes, instances };
}
