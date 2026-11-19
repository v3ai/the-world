// The dog's rig: joint positions in centimetres (x forward, y up, z = the dog's right), a standing adult Labrador-type male.
// These are modelling choices in typical proportions (breed standard height 57 cm at the withers); see the notes for what is sourced.
import * as L from '../lib/index.mjs';
import { P, S, ell, ellA, rod, flatZ, smoothS, unionS, subS, mapS, sphereS, SIDES } from './dog_lib.mjs';
import { HL, HLcm, headSkinParts, skinCuts, mouthGroove, HEAD } from './dog_head.mjs';

export const DX = 5.5;   // the hind end sits this far (cm) forward of the first draft: a Labrador is short-coupled (body length only a little more than the height)
export const WARP_FROM = -12, WARP_TO = -34;
// organs, vessels and nerves of the abdomen: x compressed between WARP_FROM and WARP_TO, then shifted rigidly with the hind end
export const wx = x => x >= WARP_FROM ? x : x >= WARP_TO ? WARP_FROM + (x - WARP_FROM) * ((WARP_FROM - WARP_TO - DX) / (WARP_FROM - WARP_TO)) : x + DX;
export const M = {
  withers: 57,        // cm, mid of the breed-standard range for males (about 57 cm; see the card for the source)
  mass: 30,           // kg, typical adult male
  teeth: 42, cervical: 7, thoracic: 13, lumbar: 7, sacral: 3, caudal: 20, ribPairs: 13,
};

// spine: the line through the centres of the vertebral bodies (cm)
export const SPINE = {
  cerv: [[31, 61], [27.5, 60], [24, 58.5], [20.5, 56.5], [17.5, 54.5], [15, 52.5], [13.2, 51]],   // C1..C7 (7 centres)
  thor: [[12, 50.5], [10, 50.3], [8, 50.1], [6, 49.9], [4, 49.7], [2, 49.5], [0, 49.3], [-2, 49.1], [-4, 48.9], [-6, 48.8], [-8, 48.7], [-10, 48.6], [-12, 48.5]],   // T1..T13
  lum: [48.4, 48.3, 48.2, 48.1, 48.0, 47.9, 47.8].map((y, i) => [-14.6 - i * 2.35, y]),   // L1..L7 (short-coupled loin)
  sac: [[-31.1, 47.6], [-33.3, 47.3], [-35.5, 46.9]],       // S1..S3 (fused)
};
export const TAIL = [[-38, 47.3], [-44.5, 45.8], [-51, 42.5], [-57, 37.5], [-61, 31], [-63, 24]];   // caudal centres: path, 20 vertebrae along it

// limbs (cm). Fore: scapula dorsal end, shoulder (glenoid), elbow, carpus, metacarpophalangeal joint; toe points
export const FORE = { sc0: [10.5, 54], sc1: [20.5, 37.5], glen: [20.5, 37.5], elbow: [4.5, 30.5], carpus: [7.5, 11.5], mcp: [10.2, 4.3], zS: 7.6, zE: 8.8, zC: 7, zP: 6.4 };
export const HIND = { hip: [-29, 41], stifle: [-18.5, 23.5], hock: [-35.5, 16], mtp: [-34, 4.2], heel: [-38, 21.5], zH: 8, zK: 9.6, zT: 8.2, zP: 6.6 };

// ---------- the skin envelope: everything else is built inside it ----------
// Side view of a Labrador standing: level topline from the withers (57 cm) to the croup, deep chest down to the elbow, tucked-up belly,
// thick tapering "otter" tail, straight forelegs, angulated hindlegs with a hock about a third of the height, round compact feet.
export const TAILR = [.042, .0185];
export function tailPath() { return L.spline(TAIL.map(p => P(...p))).sample(14); }
export function skinShape() {
  const s = [];
  // trunk
  s.push(ell(P(4, 42.8, 0), [1, 0, 0], .2, .139, .108));            // rib cage
  s.push(ell(P(20, 38.5, 0), [1, -.3, 0], .055, .07, .068));      // forechest (the point of the breastbone)
  s.push(ell(P(-13, 46.2, 0), [1, 0, 0], .125, .103, .092));       // loin and flank
  s.push(ell(P(-29.5, 47.8, 0), [1, -.1, 0], .115, .088, .1));        // croup and hindquarters
  s.push(ell(P(13, 49.5, 0), [1, -.2, 0], .1, .078, .074));       // withers
  s.push(ell(P(-12, 38.3, 0), [1, .06, 0], .115, .086, .096));    // belly (moderate tuck-up behind the ribs)
  // neck and head
  s.push(rod(P(13, 49, 0), HL(2, 1, 0), .1, .07));
  s.push(rod(P(15, 46.5, 0), HL(1, -4.5, 0), .08, .045));          // under the neck
  // tail: thick at the base, tapering, with a rounded tip
  const tp = tailPath(), n = tp.length - 1;
  for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, r = t => TAILR[0] + (TAILR[1] - TAILR[0]) * Math.pow(t, .8); s.push(rod(tp[i], tp[i + 1], r(t0), r(t1))); }
  for (const z of SIDES) {
    const zz = a => [a[0], a[1], z * a[2]];
    // forelimb: heavy bone, straight, close under the shoulder
    s.push(ell(zz(P(14.5, 42, 7)), [.55, -.8, 0], .075, .052, .038));                      // shoulder muscles over the blade
    s.push(rod(zz(P(19, 38.5, 6.8)), zz(P(5.8, 31.5, 8.2)), .054, .05));                  // upper arm
    s.push(ell(zz(P(7.5, 35, 8.2)), [-.5, -.8, 0], .068, .045, .032));                    // triceps
    s.push(sphereSk(zz(P(4.2, 30.8, 8.5)), .045));                                          // point of the elbow
    s.push(flatZ(rod(zz(P(5.6, 30, 8.2)), zz(P(7.7, 13, 6.9)), .047, .03), z * .069, .88));    // forearm
    s.push(sphereSk(zz(P(7.6, 11.8, 6.9)), .033));                                          // carpus
    s.push(sphereSk(zz(P(5.7, 11.4, 6.9)), .018));                                          // accessory carpal pad
    s.push(rod(zz(P(7.6, 12, 6.8)), zz(P(10.5, 4.6, 6.5)), .028, .026));                   // pastern
    s.push(ell(zz(P(12.9, 3, 6.5)), [1, 0, 0], .05, .031, .037));                          // the round, compact foot
    // hindlimb: broad thigh, stifle in front, hock about a third of the height, upright rear pastern
    s.push(ell(zz(P(-25.5, 36, 7.4)), [.3, -1, 0], .125, .077, .058));                      // thigh
    s.push(sphereSk(zz(P(-19.5, 25.5, 8.8)), .046));                                        // stifle
    s.push(rod(zz(P(-20, 24.5, 8.8)), zz(P(-35.5, 17.5, 7.2)), .05, .033));                // second thigh
    s.push(ell(zz(P(-27.5, 22.2, 8)), [1, -.3, 0], .058, .034, .03));                      // calf
    s.push(rod(zz(P(-35.5, 18.5, 7.2)), zz(P(-37.8, 21, 7)), .022, .015));                 // point of the hock (calcaneus)
    s.push(sphereSk(zz(P(-36, 16.5, 7.4)), .029));                                          // hock
    s.push(rod(zz(P(-35.5, 16, 7)), zz(P(-34.3, 5, 6.6)), .027, .022));                    // hock to foot
    s.push(ell(zz(P(-31.7, 3, 6.6)), [1, 0, 0], .05, .031, .037));                         // foot
  }
  const body = smoothS(.03, ...s);
  const head = smoothS(.012, ...headSkinParts());
  let sk = smoothS(.028, body, head);
  for (const c of skinCuts().slice(0, 2)) sk = subS(sk, c, .003);
  const g = mouthGroove(); const f0 = sk.f;
  return S(p => f0(p) + g(p), sk.lo, sk.hi);
}
function sphereSk(c, r) { return sphereS(c, r); }
