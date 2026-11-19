// The small animals of the soil at true size, each built in millimetres (x forward, y up, z across): a woodlouse, a springtail, an oribatid mite, a ground beetle.
import * as L from '../lib/index.mjs';
import { uvSphere, ell, tubeM, spl, sdfMesh, aoShade } from './soil_lib.mjs';

export const FAUNA = {
  woodlouse: { len: 15, wid: 6.5 },   // Oniscus asellus grows to 16 mm long and 6 mm wide (Wikipedia, Oniscus asellus); a 15 mm adult is drawn
  springtail: { len: 1.8 },           // soil-dwelling (hemiedaphic) springtails are 1-2 mm (Wikipedia, Springtail)
  mite: { len: .7 },                  // oribatid mites are 0.2-1.4 mm (Wikipedia, Oribatida)
  beetle: { len: 16 },                // Pterostichus madidus, a common ground beetle, 14-20 mm (Wikipedia)
};
const S = [1, -1];
const E = (c, r, nu = 12, nv = 7) => L.translateMesh(L.scaleMesh(uvSphere(1, nu, nv), r), c);

export default function fauna(R) {
  const m = {};
  // ===================== woodlouse (Oniscus asellus): head forward (+x), seven plates on the thorax, five on the tail part =====================
  { const body = [E([7.0, 1.0, 0], [1.5, .9, 2.0])];
    for (let i = 0; i < 7; i++) { const x = 5.0 - i * 1.25, w = 3.15 - .05 * Math.abs(i - 2); body.push(E([x, 1.35, 0], [.95, 1.1, w]));   // a plate (tergite) with a pointed side corner
      for (const s of S) body.push(E([x - .1, .75, s * (w - .35)], [.8, .55, .55])); }
    for (let i = 0; i < 5; i++) body.push(E([-3.9 - i * .75, .95, 0], [.6, .7, 2.15 - .22 * i]));
    body.push(E([-8.0, .65, 0], [1.2, .6, 1.15]));   // the tail plate (pleotelson)
    m.woodlouse_body = L.bakeShade(L.merge(...body), (p, n) => .62 + .38 * (.5 + .5 * n[1]));
    const eyes = S.map(s => E([7.55, 1.4, s * 1.55], [.38, .38, .38])); m.woodlouse_eyes = L.merge(...eyes);
    const legs = []; for (let i = 0; i < 7; i++) for (const s of S) { const x = 5.0 - i * 1.25; legs.push(tubeM([[x, .5, s * 1.4], [x + .2, -.2, s * 2.8], [x - .1, -.9, s * 3.5], [x - .5, -1.0, s * 3.9]], .14, 5, 0, true)); }
    m.woodlouse_legs = L.merge(...legs);
    const ant = []; for (const s of S) { ant.push(tubeM([[8.0, 1.0, s * .8], [8.6, 1.0, s * 1.4]], .11, 5, 0, true));            // the short first pair
      ant.push(L.tube(spl([[7.9, .9, s * 1.5], [9.2, 1.4, s * 2.8], [11.0, 1.6, s * 3.9], [12.6, 1.2, s * 4.6]], 10), t => .22 * (1 - .6 * t), { sides: 5, caps: true })); }   // the long second pair
    for (const s of S) { ant.push(tubeM([[-8.8, .65, s * .6], [-10.4, .6, s * .9]], .18, 5, 0, true)); }   // the two tail points (uropods)
    m.woodlouse_ant = L.merge(...ant); }

  // ===================== springtail: a soil springtail 1.8 mm long =====================
  { const body = L.merge(E([.62, .0, 0], [.2, .17, .16], 8, 5), ...Array.from({ length: 9 }, (_, i) => E([.38 - i * .17, .0, 0], [.17, .15 - .006 * i, .14 - .006 * i], 8, 5)));
    m.springtail_body = L.bakeShade(L.translateMesh(L.scaleMesh(body, 1), [0, .12, 0]), (p, n) => .75 + .25 * n[1]);
    const ant = [], legs = []; for (const s of S) { ant.push(tubeM([[.8, .2, s * .06], [1.0, .3, s * .12], [1.17, .36, s * .17], [1.3, .36, s * .22]], .018, 4, 0, true));
      for (const x of [.3, .05, -.2]) legs.push(tubeM([[x, .05, s * .1], [x + .02, -.04, s * .2], [x - .1, -.14, s * .24]], .02, 4, 0, true)); }
    m.springtail_legs = L.merge(...ant, ...legs);
    // the spring (furca): folded forward under the tail end and held by a catch; it snaps back to launch the animal
    m.springtail_furca = L.merge(...S.map(s => tubeM([[-.85, .06, s * .035], [-.55, -.02, s * .04], [-.28, -.06, s * .045]], .045, 4, 0, true))); }

  // ===================== oribatid mite: a hard, domed body 0.7 mm long with eight legs =====================
  { const body = [E([0, .15, 0], [.34, .26, .27]), E([.34, .08, 0], [.12, .1, .1])];
    m.mite_body = L.bakeShade(L.merge(...body), (p, n) => .6 + .4 * (.5 + .5 * n[1]));
    const legs = []; for (const s of S) for (let i = 0; i < 4; i++) { const x = .18 - i * .1 + (i < 2 ? .1 : 0), dz = s * (.25 + .0 * i), a = (i - 1.5) * .22;
      legs.push(tubeM([[x, .1, dz * .8], [x + a * .3, .22, s * (.46 + .04 * i)], [x + a * .6, .02, s * (.62 + .05 * i)], [x + a * .7, -.1, s * (.7 + .05 * i)]], .025, 4, 0, true)); }
    m.mite_legs = L.merge(...legs); }

  // ===================== ground beetle (Pterostichus madidus type): 16 mm, black, grooved wing cases =====================
  { const hd = L.smoothUnion(.35, ell([6.6, .9, 0], [1.9, 1.35, 1.6]), ell([5.3, .9, 0], [1.2, 1.1, 1.3]));
    m.beetle_head = L.bakeShade(sdfMesh(hd, [4.0, -.8, -2.3], [8.7, 2.8, 2.3], .22, 1), aoShade(hd, .95, .3));
    const eyes = S.map(s => E([6.6, 1.55, s * 1.35], [.55, .5, .45])); m.beetle_eyes = L.merge(...eyes);
    const mand = S.map(s => tubeM([[8.1, .6, s * .55], [8.9, .55, s * .55], [9.4, .55, s * .15]], .26, 6, 0, true)); m.beetle_jaws = L.merge(...mand);
    const pr = L.smoothUnion(.4, ell([3.3, 1.1, 0], [2.0, 1.3, 2.8]));
    m.beetle_pronotum = L.bakeShade(sdfMesh(pr, [1.0, -.5, -3.4], [5.6, 2.8, 3.4], .22, 1), aoShade(pr, .95, .3));
    let el = ell([-2.7, 1.3, 0], [5.9, 1.9, 3.5]); el = L.displace(el, p => .1 * Math.pow(Math.sin(p[2] * 3.6), 2) * (p[1] > 0 ? 1 : 0) - .04);   // nine grooves run along each wing case; the card says how many are drawn
    m.beetle_elytra = L.bakeShade(sdfMesh(el, [-9.2, -.6, -4.1], [3.6, 3.6, 4.1], .25, 1), aoShade(el, .9, .35));
    const legs = [], seg = (a, b, r0, r1) => tubeM([a, b], 1, 5, 0, true);
    for (const s of S) for (const [x, fw] of [[3.3, 1], [.2, 0], [-2.6, -1]]) { const k = [[x, .3, s * 1.8], [x + fw * 1.8, .4, s * 3.8], [x + fw * 2.8, -.9, s * 5.0], [x + fw * 3.2, -1.2, s * 6.4], [x + fw * 3.0, -1.35, s * 7.5]];
      legs.push(L.tube(spl(k, 14), t => .5 - .32 * t, { sides: 6, caps: true })); }
    m.beetle_legs = L.merge(...legs);
    m.beetle_antennae = L.merge(...S.map(s => L.tube(spl([[8.0, 1.3, s * .5], [10.0, 2.3, s * 1.5], [12.2, 2.9, s * 2.6], [14.0, 2.8, s * 3.6]], 12), .15, { sides: 5, caps: true }))); }
  return { meshes: m };
}
