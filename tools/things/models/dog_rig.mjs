// The dog's rig: joint positions in centimetres (x forward, y up, z = the dog's right), a standing adult Labrador-type male.
// These are modelling choices in typical proportions (breed standard height 57 cm at the withers); see the notes for what is sourced.
import * as L from '../lib/index.mjs';
import { P, S, ell, ellA, rod, flatZ, smoothS, unionS, sphereS, SIDES } from './dog_lib.mjs';

export const M = {
  withers: 57,        // cm, mid of the breed-standard range for males (about 57 cm; see the card for the source)
  mass: 30,           // kg, typical adult male
  teeth: 42, cervical: 7, thoracic: 13, lumbar: 7, sacral: 3, caudal: 20, ribPairs: 13,
};

// spine: the line through the centres of the vertebral bodies (cm)
export const SPINE = {
  cerv: [[31, 61], [27.5, 60], [24, 58.5], [20.5, 56.5], [17.5, 54.5], [15, 52.5], [13.2, 51]],   // C1..C7 (7 centres)
  thor: [[12, 50.5], [10, 50.2], [8, 50], [6, 49.8], [4, 49.6], [2, 49.3], [0, 49], [-2, 48.7], [-4, 48.4], [-6, 48.1], [-8, 47.8], [-10, 47.5], [-12, 47.3]],   // T1..T13
  lum: [[-14.6, 47.1], [-17.8, 46.9], [-21, 46.7], [-24.2, 46.5], [-27.4, 46.3], [-30.6, 46.1], [-33.6, 45.9]],   // L1..L7
  sac: [[-36.6, 45.6], [-38.8, 45.2], [-41, 44.8]],       // S1..S3 (fused)
};
export const TAIL = [[-43.5, 45], [-49, 43.6], [-55, 40.5], [-60.5, 36], [-64.5, 30.5], [-66.5, 25.5]];   // caudal centres: path, 20 vertebrae along it

// limbs (cm). Fore: scapula dorsal end, shoulder (glenoid), elbow, carpus, metacarpophalangeal joint; toe points
export const FORE = { sc0: [10.5, 54], sc1: [20.5, 37.5], glen: [20.5, 37.5], elbow: [4.5, 30.5], carpus: [7.5, 11.5], mcp: [10.2, 4.3], zS: 7.6, zE: 8.8, zC: 7, zP: 6.4 };
export const HIND = { hip: [-34.5, 39.5], stifle: [-24, 22.5], hock: [-41, 15.5], mtp: [-39.5, 4.2], heel: [-43.5, 21], zH: 8, zK: 9.6, zT: 8.2, zP: 6.6 };

// ---------- the skin envelope: everything else is built inside it ----------
export function skinShape() {
  const s = [];
  // trunk
  s.push(ell(P(4, 42.6, 0), [1, 0, 0], .195, .142, .115));        // chest
  s.push(ell(P(-14, 42.4, 0), [1, 0, 0], .175, .130, .106));     // belly
  s.push(ell(P(-31, 44.8, 0), [1, 0, 0], .125, .108, .108));     // rump
  s.push(ell(P(15, 46, 0), [1, -.35, 0], .11, .115, .098));       // withers / shoulder mass
  // neck and head
  s.push(rod(P(14, 50, 0), P(31, 60.2, 0), .1, .082));
  s.push(rod(P(30, 61, 0), P(41, 63, 0), .084, .076));        // skull
  s.push(rod(P(40.5, 60.8, 0), P(51.3, 57.6, 0), .062, .045));      // muzzle
  s.push(flatZ(rod(P(37, 55.8, 0), P(50, 53.2, 0), .036, .027), 0, 1));   // lower jaw and lips
  s.push(ellA(P(51.6, 56.3, 0), .020, .017, .031));               // nose pad
  s.push(ell(P(36, 60.5, 0), [1, 0, 0], .075, .068, .072));         // cheeks
  // tail (thick at the base, an otter tail)
  const tp = L.spline([[-43, 46], [-49, 44.3], [-55, 41], [-60.5, 36.2], [-64.5, 30.8], [-66.7, 25.6]].map(p => P(...p))).sample(10);
  for (let i = 0; i < tp.length - 1; i++) { const r1 = .048 * (1 - i / 10) + .01, r2 = .048 * (1 - (i + 1) / 10) + .01; s.push(rod(tp[i], tp[i + 1], r1, r2)); }
  for (const z of SIDES) {
    const zz = a => [a[0], a[1], z * a[2]];
    // forelimb
    s.push(rod(zz(P(18.5, 42, FORE.zS * 1.15)), zz(P(4.8, 32, FORE.zE)), .062, .047));     // upper arm / triceps mass
    s.push(rod(zz(P(4.8, 32, FORE.zE)), zz(P(7.5, 12.5, FORE.zC)), .047, .027));            // forearm
    s.push(rod(zz(P(7.5, 12.5, FORE.zC)), zz(P(10.2, 4.8, FORE.zP)), .027, .024));          // carpus + metacarpus
    s.push(ell(zz(P(12.8, 2.5, FORE.zP)), [1, 0, 0], .058, .026, .030));                     // paw
    // hindlimb
    s.push(rod(zz(P(-32, 41, 6.5)), zz(P(-25, 23.5, HIND.zK)), .108, .050));                 // thigh
    s.push(ell(zz(P(-32.5, 37, 7)), [0, 1, 0], .165, .08, .075));
    s.push(rod(zz(P(-25, 23.5, HIND.zK)), zz(P(-41, 16.5, HIND.zT)), .052, .030));           // gaskin / second thigh
    s.push(rod(zz(P(-41, 16.5, HIND.zT)), zz(P(-39.8, 5, HIND.zP)), .030, .024));            // hock + metatarsus
    s.push(ell(zz(P(-37.2, 2.5, HIND.zP)), [1, 0, 0], .058, .026, .030));                    // paw
  }
  return smoothS(.045, ...s);
}
