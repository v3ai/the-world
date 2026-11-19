// Muscles (a partition of the space under the skin), organs, nerves and vessels
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { P, bone, place, S, ell, ellA, rod, smoothS, unionS, subS, meshS, SIDES, path } from './dog_lib.mjs';
import { SPINE, TAIL, FORE, HIND, DX, wx } from './dog_rig.mjs';
import * as H from './dog_head.mjs';

// ---------------- muscles ----------------
// each core: id, name, shapes(s) -> Shape[], reach (cm). A muscle is the part of the space under the skin that is nearer to its core than to any other core.
const Z = (x, y, z, s) => P(x, y, s * z);
export const MUSCLES = [
  { id: 'temporalis', node0: 'dog_m_temporalis', name: 'Temporalis (chewing)', pair: 1, sh: s => [H.hell([6, 4.6, s * 4.6], [1, -.2], 3.4, 2.4, 1.1)], reach: 2.6 },
  { id: 'masseter', node0: 'dog_m_masseter', name: 'Masseter (chewing)', pair: 1, sh: s => [H.hell([5.6, -.8, s * 5.1], [.25, 1], 3.2, 1.7, .9)], reach: 2.6 },
  { id: 'face_muscles', node0: 'dog_m_face', name: 'Muscles of the muzzle and lips', pair: 1, sh: s => [H.hrod([11, .2, s * 3.2], [19, .4, s * 2.1], .9, .8), H.hrod([11, -2.2, s * 3.2], [18, -2.5, s * 2.1], .8, .7)], reach: 3 },
  { id: 'neck_dorsal', depth: 5.5, node0: 'dog_m_neck_dorsal', name: 'Splenius and neck extensors', pair: 1, sh: s => [rod(Z(31, 62.5, 2.8, s), Z(14, 55.5, 3.6, s), .026, .03)], reach: 3.5 },
  { id: 'brachiocephalicus', node0: 'dog_m_brachiocephalicus', name: 'Brachiocephalicus (draws the foreleg forward)', pair: 1, sh: s => [rod(Z(29, 58.5, 5.2, s), Z(20, 44, 7.5, s), .022, .026)], reach: 3.2 },
  { id: 'neck_ventral', depth: 3.5, node0: 'dog_m_neck_ventral', name: 'Sternocephalicus and neck flexors', pair: 1, sh: s => [rod(Z(28, 55.5, 2.2, s), Z(17, 42, 3, s), .02, .022)], reach: 3 },
  { id: 'trapezius', depth: 1.8, node0: 'trapezius', name: 'Trapezius', pair: 1, sh: s => [ell(Z(10, 54.5, 4.8, s), [1, -.1, 0], .09, .02, .02)], reach: 3 },
  { id: 'latissimus', depth: 2.0, node0: 'latissimus_dorsi', name: 'Latissimus dorsi', pair: 1, sh: s => [ell(Z(-1, 46, 9, s), [1, -.55, 0], .14, .08, .02)], reach: 4 },
  { id: 'chest_wall', depth: 2.2, node0: 'dog_m_chest_wall', name: 'Serratus ventralis and the chest wall (intercostal muscles)', pair: 1, sh: s => [ell(Z(5, 41, 8.6, s), [1, 0, 0], .13, .1, .02)], reach: 6 },
  { id: 'pectorals', depth: 3.5, node0: 'pectoralis_major', name: 'Pectoral muscles', pair: 1, sh: s => [ell(Z(15, 33, 6.5, s), [.3, -1, 0], .09, .04, .028)], reach: 3.6 },
  { id: 'back_extensors', depth: 6.5, node0: 'dog_m_epaxial', name: 'Longissimus and the back extensors', pair: 1, sh: s => [rod(Z(13, 54.5, 3.2, s), Z(-14, 52, 3.8, s), .034, .036), rod(Z(-14, 52, 3.8, s), Z(-29, 50, 3.8, s), .036, .03)], reach: 4 },
  { id: 'external_oblique', depth: 2.2, node0: 'external_obliques', name: 'External oblique (flank)', pair: 1, sh: s => [ell(Z(-13.5, 38, 8.8, s), [1, .1, 0], .1, .08, .02)], reach: 5 },
  { id: 'rectus_abdominis', depth: 2.2, node0: 'rectus_abdominis', name: 'Rectus abdominis', pair: 1, sh: s => [rod(Z(-8, 30, 2, s), Z(-24, 31.5, 2.4, s), .022, .022)], reach: 3.5 },
  { id: 'supraspinatus', node0: 'dog_m_supraspinatus', name: 'Supraspinatus and infraspinatus (shoulder)', pair: 1, sh: s => [ell(Z(16, 47, 5, s), [.5, .8, 0], .07, .03, .022), ell(Z(14.5, 43, 6.2, s), [.4, .9, 0], .07, .03, .022)], reach: 3.2 },
  { id: 'deltoid', node0: 'deltoid', name: 'Deltoideus', pair: 1, sh: s => [rod(Z(17.5, 42, 8.2, s), Z(13, 35.5, 8.6, s), .02, .02)], reach: 3 },
  { id: 'triceps', node0: 'triceps_brachii', name: 'Triceps brachii', pair: 1, sh: s => [ell(Z(11, 38, 8.4, s), [-.6, -.8, 0], .09, .05, .032)], reach: 4 },
  { id: 'biceps', node0: 'biceps_brachii', name: 'Biceps brachii', pair: 1, sh: s => [rod(Z(18.2, 37.5, 7.2, s), Z(6.5, 27, 6.6, s), .016, .018)], reach: 3.2 },
  { id: 'fore_extensors', node0: 'dog_m_fore_ext', name: 'Forearm extensors (carpus and toes)', pair: 1, sh: s => [rod(Z(6, 27.5, 9.7, s), Z(8, 14, 8.2, s), .022, .014)], reach: 3 },
  { id: 'fore_flexors', node0: 'forearm_muscles', name: 'Forearm flexors (carpus and toes)', pair: 1, sh: s => [rod(Z(3.5, 27.5, 7, s), Z(7, 14, 6, s), .024, .014)], reach: 3 },
  { id: 'fore_tendons', node0: 'tendon', name: 'Tendons of the lower foreleg', pair: 1, sh: s => [rod(Z(7.5, 13.5, 7, s), Z(10.5, 4.5, 6.4, s), .026, .026), ell(Z(13, 2.6, 6.4, s), [1, 0, 0], .05, .025, .028)], reach: 3.2 },
  { id: 'gluteals', node0: 'gluteus_maximus', name: 'Gluteal muscles (hip extensors)', pair: 1, sh: s => [ell(Z(-31, 48.5, 7.2, s), [.6, -.7, 0], .08, .045, .03)], reach: 4.5 },
  { id: 'tensor', node0: 'dog_m_tensor', name: 'Tensor fasciae latae and sartorius', pair: 1, sh: s => [rod(Z(-26, 47, 8, s), Z(-25.5, 31, 9.5, s), .02, .026)], reach: 3.4 },
  { id: 'biceps_femoris', node0: 'dog_m_biceps_femoris', name: 'Biceps femoris', pair: 1, sh: s => [rod(Z(-34, 44, 9, s), Z(-31, 23, 10, s), .032, .032)], reach: 4 },
  { id: 'hamstrings', node0: 'hamstrings', name: 'Semitendinosus and semimembranosus (hamstrings)', pair: 1, sh: s => [rod(Z(-40, 40.5, 6.5, s), Z(-36.5, 25, 7.3, s), .03, .03)], reach: 3.8 },
  { id: 'quadriceps', node0: 'quadriceps', name: 'Quadriceps femoris', pair: 1, sh: s => [ell(Z(-25.5, 33, 8.6, s), [-.15, -1, 0], .1, .05, .035)], reach: 4 },
  { id: 'adductors', node0: 'dog_m_adductors', name: 'Gracilis and adductors (inner thigh)', pair: 1, sh: s => [rod(Z(-30, 39, 4.2, s), Z(-26.5, 25, 4.6, s), .022, .024)], reach: 3.2 },
  { id: 'gastrocnemius', node0: 'gastrocnemius', name: 'Gastrocnemius (calf)', pair: 1, sh: s => [rod(Z(-27, 22.5, 8, s), Z(-39, 17.5, 7, s), .02, .016)], reach: 3 },
  { id: 'shin_muscles', node0: 'dog_m_shin', name: 'Cranial tibial and toe extensors (shin)', pair: 1, sh: s => [rod(Z(-25.5, 22, 9.6, s), Z(-37, 13.5, 8.4, s), .018, .012)], reach: 3 },
  { id: 'hind_tendons', node0: 'tendon', name: 'Calcaneal (Achilles) and lower hindleg tendons', pair: 1, sh: s => [rod(Z(-40, 17.5, 6.8, s), Z(-40, 6, 6.5, s), .028, .026), ell(Z(-37, 2.6, 6.6, s), [1, 0, 0], .05, .025, .028)], reach: 3.2 },
  { id: 'tail_muscles', node0: 'dog_m_tail', name: 'Tail muscles', pair: 0, sh: s => { const f = L.spline(TAIL.map(p => P(...p))).sample(8), o = []; for (let i = 0; i < 8; i++) o.push(rod(f[i], f[i + 1], .045 * (1 - i / 9) + .006, .045 * (1 - (i + 1) / 9) + .006)); return o; }, reach: 3.5 },
];
const HIND_M = ['gluteals', 'tensor', 'biceps_femoris', 'hamstrings', 'quadriceps', 'adductors', 'gastrocnemius', 'shin_muscles', 'hind_tendons'];
for (const m of MUSCLES) if (HIND_M.includes(m.id)) { const f = m.sh; m.sh = s => f(s).map(x => D.translateS(x, [DX * .01, 0, 0])); }
export function muscleMeshes(skin, cell = .009) {
  const out = {}; const cores = [];
  for (const m of MUSCLES) for (const s of (m.pair ? SIDES : [1])) cores.push({ m, s, shapes: m.sh(s) });
  const dist = (c, p) => { let d = Infinity; for (const sh of c.shapes) { const v = sh.f(p); if (v < d) d = v; } return d; };
  const inset = .007, buf = new Float64Array(cores.length);
  for (const m of MUSCLES) {
    const mine = cores.filter(c => c.m === m), meshes = [];
    for (const c of mine) {
      const R = m.reach * .01, lo = [0, 1, 2].map(i => Math.min(...c.shapes.map(x => x.lo[i])) - R), hi = [0, 1, 2].map(i => Math.max(...c.shapes.map(x => x.hi[i])) + R);
      const others = cores.filter(o => o !== c && o.shapes.some(sh => sh.lo.every((v, i) => v < hi[i] && sh.hi[i] > lo[i]) || true) && o.shapes.some(sh => [0, 1, 2].every(i => sh.lo[i] - .12 < hi[i] && sh.hi[i] + .12 > lo[i])));
      const f = p => { const sk = skin.f(p) + inset; if (sk > R * 1.5 + .02) return sk; const dk = dist(c, p); let mo = Infinity; for (const o of others) { const v = dist(o, p); if (v < mo) mo = v; } const v = Math.max(sk, dk - mo, dk - R); return m.depth ? Math.max(v, -m.depth * .01 - (sk - inset)) : v; };
      meshes.push(L.meshSDF(f, { min: lo, max: hi, cell, refine: 1 }));
    }
    out[m.id] = L.merge(...meshes);
  }
  return out;
}

// ---------------- organs ----------------
export function organs() {
  const m = {}, T = s => s;
  m.brain = H.brain(); m.bulbs = H.bulbs(); m.tongue = H.tongue();
  // airway
  { const tr = L.spline([[29, 56.2, 0], [24, 53.2, 0], [19, 50.2, 0], [14, 47.3, 0], [9, 44.8, 0], [6.2, 42.9, 0]].map(p => P(...p))).sample(24); m.trachea = L.tube(tr, .0105, { sides: 12 });
    const ring = L.merge(...[...Array(35)].map((_, i) => { const t = .04 + i * .93 / 34, f = L.spline([[29, 56.2, 0], [24, 53.2, 0], [19, 50.2, 0], [14, 47.3, 0], [9, 44.8, 0], [6.2, 42.9, 0]].map(p => P(...p))); const o = f(t), tn = L.norm(L.sub(f(Math.min(.999, t + .01)), f(Math.max(0, t - .01)))); const tor = L.lathe([[.0105, -.0011], [.0122, -.0011], [.0122, .0011], [.0105, .0011]], { segments: 10 }); return place(tor, o, [tn[1], -tn[0], 0], tn); })); m.tracheal_rings = ring;
    m.bronchi = L.merge(...SIDES.map(s => L.tube([P(6.2, 42.9, 0), P(5.3, 42, s * 1.5), P(3.5, 40.8, s * 3.2)], .0075, { sides: 8 })));
    m.larynx = meshS(smoothS(.004, ell(P(30, 56.6, 0), [1, -.2, 0], .018, .016, .014), rod(P(30.5, 58, 0), P(32.5, 59, 0), .008, .007)), .0028);
    m.esophagus = L.tube(L.spline([[29, 55.2, -.8], [22, 52, -1], [14, 47, -.8], [8, 45, -.2], [1, 44.2, 0], [-9, 43.8, 0], [-13, 42.8, 0]].map(p => P(...p))).sample(26), .0068, { sides: 8 }); }
  // lungs (right 4 lobes, left 2) ; cardiac notch cut out by the heart
  { const heartCut = ell(P(8.4, 36.9, 0), [-.3, -1, 0], .075, .052, .042);
    const lung = s => { const lobes = [ell(P(11.5, 41, s * 4.3), [.3, -1, 0], .07, .06, .042), ell(P(1.5, 38, s * 5.1), [-.2, -1, 0], .1, .075, .045), ell(P(-3, 41, s * 5.2), [-.15, -1, 0], .08, .07, .043)]; if (s > 0) lobes.push(ell(P(5, 33.5, s * 3.8), [1, -.3, 0], .045, .032, .03)); return subS(smoothS(.01, ...lobes), heartCut, .01); };
    m.lung_r = meshS(lung(1), .006); m.lung_l = meshS(lung(-1), .006); }
  // diaphragm: a thin dome behind the lungs
  { const e = L.ellipsoid(.12, .13, .105), dome = L.intersect(L.shell(e, .004), L.halfSpace([-1, 0, 0], .0));   // keep x < 0 side relative to centre (set below)
    const c = P(-20, 41, 0); const f = p => dome([-(p[0] - c[0]) * -1, p[1] - c[1], p[2] - c[2]]);
    const g = p => Math.max(L.shell(L.ellipsoid(.11, .125, .105), .0045)([p[0] - c[0], p[1] - c[1], p[2] - c[2]]), -(p[0] - (c[0] + .0))); // keep x > c.x: the front half of the shell, bulging toward the chest
    m.diaphragm = meshS(S(g, P(-32, 27, -12), P(-8, 56, 12)), .0055); }
  // liver, stomach, spleen
  m.liver = meshS(smoothS(.012, ell(P(-16.5, 39.4, 3), [.2, 1, 0], .062, .1, .06), ell(P(-17, 37.2, -3.5), [.3, 1, 0], .055, .085, .05), ell(P(-15.5, 35, 0), [1, 0, 0], .03, .045, .07)), .0045);
  m.stomach = meshS(smoothS(.01, ell(P(-21.5, 36.5, -3.8), [.3, 1, .2], .072, .066, .052), rod(P(-21, 34, -2.8), P(-23, 33, 2.8), .028, .02), ell(P(-23.5, 34.2, 3.8), [1, 0, 0], .02, .018, .018)), .0045);
  m.spleen = meshS(rod(P(-17.5, 44, -7.4), P(-26.5, 31, -6.6), .016, .011), .0035);
  // intestines
  { const loops = []; const r = L.rng(5); const pts = []; for (let i = 0; i < 46; i++) { const t = i / 45, a = t * Math.PI * 7; pts.push([-30 + 11 * (.5 + .5 * Math.sin(a * 1.0 + .6)) - 0, 32.5 + 6.2 * Math.sin(a * 1.45 + 1) * .5 + 2.5 * t, 6.5 * Math.cos(a * .77 + .3) * (1 - .15 * t)]); }
    m.small_intestine = L.tube(L.spline(pts.map(p => P(p[0], Math.max(29, Math.min(40, p[1])), p[2]))).sample(160), .0105, { sides: 8 });
    m.large_intestine = L.merge(L.tube(L.spline([[-27, 37, 4], [-24, 38.5, 2.5], [-23.5, 39.5, -1], [-25, 41.5, -3.5], [-30, 43.2, -2.2], [-36, 43.8, -1], [-40.5, 43, 0], [-43.2, 41.8, 0]].map(p => P(...p))).sample(30), t => .0165 - .006 * t, { sides: 9 }), meshS(rod(P(-27, 36.8, 4.5), P(-30, 33.6, 5.3), .011, .0065), .0028)); }
  // kidneys, bladder
  m.kidney_r = meshS(ell(P(-21, 46.4, 3.4), [1, .15, .15], .033, .022, .019), .0028);   // right kidney at about L2, left one a little further back (L3-L4), both under the lumbar muscles
  m.kidney_l = meshS(ell(P(-26, 46.2, -3.6), [1, .15, -.15], .033, .022, .019), .0028);
  m.bladder = meshS(smoothS(.01, ell(P(-33.5, 33.8, 0), [.3, 1, 0], .035, .042, .032)), .0032);
  // heart: outer muscle (two ventricles, two atria with auricles), chambers inside (for the cut-open view)
  { const ax = [-.32, -1, 0], lv = ell(P(7.9, 35, -.5), ax, .056, .036, .036), rv = ell(P(9.5, 35.8, 1.9), [-.3, -1, 0], .05, .024, .022), la = ell(P(11, 40.5, -1.4), [0, 1, 0], .022, .02, .02), ra = ell(P(11.4, 40, 2.4), [0, 1, 0], .022, .02, .019), au = ell(P(13.2, 38.6, 3.6), [1, 0, 0], .014, .009, .008);
    m.heart = meshS(smoothS(.006, lv, rv, la, ra, au), .0036);
    m.h_lv = meshS(ell(P(7.9, 35, -.5), ax, .044, .022, .022), .0022);
    m.h_rv = meshS(ell(P(9.3, 35.9, 2.2), [-.3, -1, 0], .04, .0115, .0105), .0022);
    m.h_la = meshS(ell(P(11, 40.6, -1.4), [0, 1, 0], .015, .0125, .0125), .002);
    m.h_ra = meshS(ell(P(11.4, 40.2, 2.4), [0, 1, 0], .015, .0125, .0115), .002);
    m.h_valves = L.merge(...[[10.2, 38.3, -.9], [10.5, 38.4, 2.4], [8.6, 38.9, -1], [10.2, 39.6, 1.3]].map(c => place(L.lathe([[.0075, -.0012], [.0085, 0], [.0075, .0012]], { segments: 10 }), P(...c), [1, 0, 0], [.2, 1, 0]))); }
  return m;
}
export function vessels() {
  const m = {}; const HY = 1.4, hy = p => (p[0] > 2 && p[0] < 15 && p[1] > 33 && p[1] < 46) ? [p[0], p[1] + HY, p[2]] : p;
  const T = (pts, r, o) => L.tube(L.spline(pts.map(p => P(...hy([wx(p[0]), p[1], p[2]])))).sample(o && o.n || 24), r, { sides: 6 });
  const art = [], vein = [];
  // aorta: out of the left ventricle, arch, then back along the spine
  art.push(T([[9.2, 38, -1.2], [10.4, 42, -1.2], [8.6, 44.8, -1.2], [4, 45.6, -.8], [-3, 46.3, -.5], [-12, 45.6, -.3], [-24, 44.6, -.2], [-33, 43, -.2]], .0085, { n: 40 }));
  art.push(T([[-33, 43, -.2], [-36, 41, 2.2], [-34, 33, 5.2], [-27, 25.5, 7.3]], .0045)); art.push(T([[-33, 43, -.2], [-36, 41, -2.2], [-34, 33, -5.2], [-27, 25.5, -7.3]], .0045));
  art.push(T([[-27, 25.5, 7.3], [-33, 20, 7.1], [-38, 15.5, 6.5], [-40, 8, 6.2]], .0028)); art.push(T([[-27, 25.5, -7.3], [-33, 20, -7.1], [-38, 15.5, -6.5], [-40, 8, -6.2]], .0028));
  for (const s of SIDES) { art.push(T([[8.6, 44.8, -1.2], [11, 44, s * 3.5], [14.5, 41, s * 6.6], [10, 34, s * 8.2], [6.5, 26, s * 7.4], [8, 13, s * 6.7], [10, 5.5, s * 6.2]], .0042));
    art.push(T([[10.4, 43.4, -1.1], [16, 49.5, s * 2.2], [23, 56, s * 2.3], [30, 61, s * 2.8], [36, 64, s * 3.2]], .0042)); }   // carotid arteries toward the head
  art.push(T([[8.9, 38.5, 1.3], [8, 40.5, 1], [6.5, 41, 2.4], [3, 40.5, 5]], .0075));   // pulmonary trunk and one branch
  art.push(T([[8, 40.5, 1], [6.5, 41, -1.5], [3, 40.5, -5]], .0065));
  // veins: cranial and caudal vena cava, jugulars, pulmonary veins
  vein.push(T([[11.6, 40.2, 2.4], [14, 44.5, 2.2], [18, 49, 2], [24, 54, 2.6], [30, 58, 3.4]], .0085)); vein.push(T([[14, 44.5, 2.4], [24, 52, -1.4], [30, 57, -3.4]], .0065));
  vein.push(T([[11.4, 37.5, 2.6], [1, 35.5, 2.4], [-10, 36, 2.4], [-14, 40.5, 2.6], [-24, 42.4, 1.2], [-33, 42.2, 1]], .0095, { n: 30 }));
  for (const s of SIDES) { vein.push(T([[14, 42, s * 5], [10, 33, s * 8], [6.8, 24.5, s * 7.9], [8.2, 12, s * 7.4]], .0045)); vein.push(T([[-31, 31, s * 5.8], [-27, 26, s * 8], [-38, 15.5, s * 7.2], [-40, 8, s * 7.1]], .0038)); vein.push(T([[3, 40.5, s * 5], [6.4, 40.2, s * 1.4], [10.6, 40.4, -1.3]], .0055)); }
  m.arteries = L.merge(...art); m.veins = L.merge(...vein);
  return m;
}
const HLpt = (x, y) => { const p = H.HLcm(x, y, 0); return [p[0], p[1], 0]; };
export function nerves() {
  const m = {}; const T = (pts, r, o) => L.tube(L.spline(pts.map(p => P(wx(p[0]), p[1], p[2]))).sample(o && o.n || 24), r, { sides: 5 });
  // spinal cord in the vertebral canal, with the cervical and lumbar swellings
  const cord = [HLpt(.8, .6), ...SPINE.cerv, ...SPINE.thor, ...SPINE.lum]   // the cord ends in the lower back, at about the last lumbar vertebra (the nerves of the tail run on beyond it, not drawn)
   .map((p, i) => i === 0 ? p : [p[0], p[1] + .9, 0]);
  m.spinal_cord = L.tube(L.spline(cord.map(p => P(...p))).sample(90), .0042, { sides: 5 });
  // brachial plexus and the main nerves of the foreleg; lumbosacral plexus and sciatic nerve of the hindleg; vagus; optic nerves
  const nn = [];
  for (const s of SIDES) { nn.push(T([[16, 53, 0.4], [18, 46, s * 3.5], [18.5, 40.5, s * 6.5]], .0032)); nn.push(T([[16, 53, 0.4], [14, 44, s * 3.5], [14.5, 38, s * 6.6]], .0032));
    nn.push(T([[18.5, 40.5, s * 6.6], [12, 35, s * 8.4], [6, 30.5, s * 9], [8.3, 18, s * 8.5], [9.5, 8, s * 7.4], [11.5, 3, s * 6.5]], .0026));   // radial and median toward the paw
    nn.push(T([[-32, 46, 0.4], [-33.5, 43.5, s * 4], [-35.5, 40, s * 6.6], [-35, 33, s * 8.4], [-31, 25.5, s * 9], [-38, 17, s * 8.2], [-40, 8, s * 7]], .003));   // sciatic nerve to the foot
    nn.push(T([[24, 56.8, s * 2.2], [18, 51, s * 2.2], [12, 46.5, s * 2], [8, 44.4, s * 1.8]], .0022)); }   // vagus nerves
  m.nerves_fore = L.merge(...nn.filter((_, i) => i % 5 < 3 && i % 5 !== 3)); m.nerves_hind = L.merge(...nn.filter((_, i) => i % 5 === 3)); m.vagus = L.merge(...nn.filter((_, i) => i % 5 === 4));
  m.optic = L.merge(...SIDES.map(s => T([[42.2, 63.6, s * 1.5], [42.8, 63.8, s * 3], [43.6, 64, s * 4.2]], .0022, { n: 6 })));
  m.tail_nerves = L.tube(L.spline(TAIL.slice(0, 5).map(p => P(p[0], p[1], 0))).sample(10), .0014, { sides: 5 });
  return m;
}
