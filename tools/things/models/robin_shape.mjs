// The robin's outer shape and key points, in millimetres. Origin: on the top of the perch twig, under the body. +x = the way the bird faces, +y up, +z the bird's right.
// Proportions are drawn by eye from photographs and drawings of a perched robin (alert posture, body tilted about 38 degrees, bill about level);
// the total length from bill tip to tail tip is checked against 12.5-14 cm (Wikipedia, European robin) in robin.mjs.
import { L, EZ, S2, add, sub, mul, norm, D2R, rot2 } from './robin_lib.mjs';

export const HC = [24, 94, 0], HB = 8;                                 // head centre, head tilt (bill slightly up)
export const BODY_ANG = 38;
export const headLocal = p => add(HC, rot2(p, HB));                    // head-local mm -> world
export const headInv = p => rot2(sub(p, HC), -HB);                     // world -> head-local
const trunk = EZ([-2, 58, 0], [28, 21, 16.5], BODY_ANG), breast = EZ([12, 55, 0], [17, 17, 15.5], 30), belly = EZ([-8, 43, 0], [20, 13, 14.5], 15);
const rump = EZ([-25, 45, 0], [13, 9.5, 10], 35), neck = EZ([15, 79, 0], [9.5, 13, 9], 62), head = EZ(HC, [14, 12.8, 11.8], HB);
export const bodySdf = L.smoothUnion(6, trunk, breast, belly, rump, neck, head);
export const headSdf = head;
// the perch: a twig along z, 13 mm thick, top surface at y = 0
export const TWIG = { r: 6.5, cy: -6.5, half: 150 };
// legs (right side z>0; mirrored). hip and knee are hidden inside the body; the ankle is the visible "backward knee"
export const LEG = { hip: [-6, 45, 8], knee: [16, 49, 10.5], ankle: [-4, 27, 11], mtp: [1, 3.2, 11] };
// bones of the folded wing (right side): [x, y, depth below (-) or above (+) the plumage surface]; shoulder -> elbow -> wrist -> end of the hand
export const WING = { shoulder: [3, 72, -3.5], elbow: [-17, 60, -1.2], wrist: [14, 63, .6], handEnd: [-2, 52, -.3], dirDeg: 216 };
export const TAIL = { base: [-33, 41, 0], dirDeg: 207 };
export const surfZ = (s, x, y, side = 1) => { const h = L.surfaceHit(s, [x, y, side * 60], [0, 0, -side], 70); return h ? h.p[2] : null; };
export { S2 };
