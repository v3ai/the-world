'use strict';
/* ===== adapter: run a v2 builder inside a v3 frame, scaled to real size ===== */
const BUILD = {};
/* Extension points for feature modules (js/atom.js, js/particles.js, js/things.js ...), so they never edit world_build.js:
   WORLD_EXT.push(async FR => {...})   runs once inside buildWorld(), after the fixed frames exist and before the ruler is built;
   EXT_LANDMARKS.push({label, D, go})  adds a stop to the scale ruler and the tours (go receives the tour's `then` callback). */
const WORLD_EXT = [], EXT_LANDMARKS = [];
function v2frame(type, v2key, scaleFn, extra) {
  FT[type] = {
    build(F, opts) {
      const g = new THREE.Group(); F.root.add(g);
      const view = { theta: 0, phi: 1, dist: 1, target: new V3(), g: { theta: 0, phi: 1, dist: 1, target: new V3() } };
      const c = { key: v2key, opts: Object.assign({}, opts), scene: F.scene, group: g, camera: F.cam, pickables: F.pickables, labels: F.labels, uiEls: F.uiEls, view, k: 1, frame: F, minDist: () => 0, maxDist: () => 0 };
      c.addLabel = (o, t, x) => { const L = F.label(o, t, x); L.scaleRef = c; return L; };
      BUILD[v2key](c, c.opts);
      c.k = scaleFn(c, F); g.scale.setScalar(c.k);
      if (F.scene.fog) { F.scene.fog.near *= c.k; F.scene.fog.far *= c.k; }
      if (F.scene.background && F.scene.background.isColor) { F.env = Object.assign({ bg: F.scene.background.getHex(), opaque: !/blackhole|life/.test(v2key) }, F.env || {}); }
      F.v2 = c; F.v2group = g;
      F.update = (dt, t) => { if (c.update) c.update(dt, t); };
      if (c.intro) F.info = c.intro;
      if (extra) extra(F, c, g, c.k);
    }
  };
}
// shims used by v2 builders
function swapTo(key, opts) {
  const F = uiFrame && uiFrame.v2 && uiFrame.v2.key === key ? uiFrame : active.find(f => f.v2 && f.v2.key === key);
  if (!F) return;
  F.opts = Object.assign({}, F.opts, opts); F.dispose(); F.ensure(); uiFrame = null; capFrame = null;
}
function showInfo(id) { const d = INFO[id]; if (!d) return; const dummy = new THREE.Object3D(); dummy.userData.id = id; showInfoFor({ id, obj: dummy, frame: cam.A, pointLocal: cam.T.clone(), noZoom: true }); }
function fire() { }
function rekey() { }
function removeLabel(c, L) { L.el.remove(); const i = c.labels.indexOf(L); if (i >= 0) c.labels.splice(i, 1); }
// shared asset loading
const texLoader = new THREE.TextureLoader();
const TEX = {};
const TEXCB = {};
function tex(name, cb) { // every caller's callback fires, also when the texture is already requested or loaded
  if (!TEX[name]) { TEXCB[name] = []; TEX[name] = texLoader.load('assets/textures/' + name, t => { TEXCB[name].splice(0).forEach(f => f(t)); TEXCB[name] = null; }); TEX[name].anisotropy = 8; }
  if (cb) { if (TEXCB[name]) TEXCB[name].push(cb); else cb(TEX[name]); }
  return TEX[name];
}
const DATA = {};
function getJSON(path) { return DATA[path] || (DATA[path] = fetch(path).then(r => r.json()).catch(e => { delete DATA[path]; throw e; })); } // a failed fetch is not cached
// orientation helpers (J2000)
const EPS = 23.4392911 * Math.PI / 180;
const eq3 = (x, y, z) => new V3(x, z, -y);                    // equatorial xyz → three (Y = north)
function raDec3(raDeg, decDeg, d = 1) { const ra = raDeg * Math.PI / 180, de = decDeg * Math.PI / 180; return eq3(Math.cos(de) * Math.cos(ra) * d, Math.cos(de) * Math.sin(ra) * d, Math.sin(de) * d); }
const Q_ECL_TO_EQ = new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), EPS);   // solar(ecliptic three) → equatorial three
const Q_EQ_TO_ECL = new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), -EPS);
const Q_EQ_TO_GAL = (() => {   // equatorial three → galactic three (GC = +X, NGP = +Y)
  const T = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
  const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(e3 => { // three basis vector → eq → gal → three
    const eq = [e3[0], -e3[2], e3[1]]; const g = T.map(r => r[0] * eq[0] + r[1] * eq[1] + r[2] * eq[2]); return [g[0], g[2], -g[1]];
  });
  const m = new THREE.Matrix4().set(cols[0][0], cols[1][0], cols[2][0], 0, cols[0][1], cols[1][1], cols[2][1], 0, cols[0][2], cols[1][2], cols[2][2], 0, 0, 0, 0, 1);
  return new THREE.Quaternion().setFromRotationMatrix(m);
})();
const SUN_GAL = new V3(-8.2, 0.0208, 0); // kpc, galactocentric (three)
function eclFromEqj(v) { return new V3(v.x, v.y, v.z).applyQuaternion(Q_EQ_TO_ECL); } // for already-three vectors
function astroDate() { return new Date(simTime); }
function helio3(body) { // heliocentric ecliptic three-coords, AU
  if (window.Astronomy) { const v = Astronomy.HelioVector(body, astroDate()); return eq3(v.x, v.y, v.z).applyQuaternion(Q_EQ_TO_ECL); }
  return new V3();
}
function gmst() { const jd = simTime / 86400000 + 2440587.5; return ((280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360) * Math.PI / 180; }
function latLon3(lat, lon, r = 1) { const p = lat * Math.PI / 180, l = lon * Math.PI / 180; return new V3(Math.cos(p) * Math.cos(l) * r, Math.sin(p) * r, -Math.cos(p) * Math.sin(l) * r); }
function enuQuat(lat, lon) { // local frame: X east, Y up, Z south
  const p = lat * Math.PI / 180, l = lon * Math.PI / 180;
  const up = latLon3(lat, lon), east = new V3(-Math.sin(l), 0, -Math.cos(l)), north = new V3(-Math.sin(p) * Math.cos(l), Math.cos(p), Math.sin(p) * Math.sin(l));
  const m = new THREE.Matrix4().makeBasis(east, up, north.clone().negate());
  return new THREE.Quaternion().setFromRotationMatrix(m);
}
// marker sprite of fixed screen size (visibility aid)
function markerSprite(color, px = 10) {
  const m = new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false, sizeAttenuation: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(m); s.scale.set(px / 600, px / 600, 1); s.userData.marker = true; return s;
}
