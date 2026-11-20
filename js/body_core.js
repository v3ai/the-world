'use strict';
/* =====================================================================
   BODY CORE: how a click on the human body is answered.
   - which part a click lands on (the nearest part you can actually see)
   - the core sample: every part along the ray, from the skin inward
   - which region of the body a skin point is in, derived from the skeleton data
   - hide / reveal
   Everything here works on F = FR.body (see FT.body in nodes.js).
   ===================================================================== */

/* A part counts as visible to the eye at about this opacity or more. */
const BODY_VISIBLE_OP = .35;

/* Pick rule for the body frame, called by pickFrame with the candidates nearest first.
   Markers and hit-spheres (priority 3 or more) keep priority. For body parts: the nearest part whose layer is actually
   showing; if none is, the nearest one drawn at all. While an organ view is open its own frame takes the click. */
function bodyChooseHit(F, cands) {
  if (!cands.length || bodyFocus(F)) return null;
  let top = null;
  for (const c of cands) if (c.pri >= 3 && (!top || c.pri > top.pri)) top = c;
  if (top) return top;
  for (const c of cands) if ((c.obj.userData.shown || 0) >= BODY_VISIBLE_OP) return c;
  return PICK_HOVER ? null : cands[0];   // a click may still select a see-through layer; a tooltip must not name one (hovering a gap in a peeled chest said "Skin")
}
/* true while the hover tooltip is being worked out (set around engine.js doHover) */
let PICK_HOVER = false;
const _doHover0 = doHover;
doHover = function () { PICK_HOVER = true; try { return _doHover0(); } finally { PICK_HOVER = false; } };

/* ---------- regions ---------- */
// Which segment of the body each bone belongs to; the region of a skin point is the segment of the nearest bone.
function boneSegment(id) {
  if (/^(skull|mandible|teeth)/.test(id)) return 'head';
  if (/^(hyoid|cervical_spine)/.test(id)) return 'neck';
  if (/^humerus/.test(id)) return 'upper arm';
  if (/^(radius|ulna)/.test(id)) return 'forearm';
  if (/^hand_bones/.test(id)) return 'hand';
  if (/^femur/.test(id)) return 'thigh';
  if (/^patella/.test(id)) return 'knee';
  if (/^(tibia|fibula)/.test(id)) return 'lower leg';
  if (/^foot_bones/.test(id)) return 'foot';
  return 'torso'; // ribs, sternum, spine, discs, sacrum, hip bones, clavicles, scapulae
}
let _boneCloud = null;
function boneCloud(F) {
  if (_boneCloud && _boneCloud.n === Object.keys(F.parts).length) return _boneCloud;
  const ids = Object.keys(F.parts).filter(id => F.parts[id].p.system === 'skeletal');
  let n = 0; ids.forEach(id => n += F.parts[id].g.userData.main.geometry.attributes.position.count);
  const pos = new Float32Array(n * 3), seg = new Uint8Array(n), segs = [];
  let k = 0;
  ids.forEach(id => {
    const a = F.parts[id].g.userData.main.geometry.attributes.position, sg = boneSegment(id); let si = segs.indexOf(sg); if (si < 0) si = segs.push(sg) - 1;
    for (let i = 0; i < a.count; i++) { pos[k * 3] = a.getX(i); pos[k * 3 + 1] = a.getY(i); pos[k * 3 + 2] = a.getZ(i); seg[k++] = si; }
  });
  // torso bands from the skeleton itself, so they follow the model: the thorax ends at the costal margin (from the tip of the
  // sternum at the midline, sloping down to the lowest front rib at the side) and at the lower end of the thoracic spine at the back;
  // the lower back ends at the top of the lumbar spine's base, the abdomen at the top of the hip bone.
  const bb = id => { const g = F.parts[id] && F.parts[id].g.userData.main.geometry; if (!g) return null; if (!g.boundingBox) g.computeBoundingBox(); return g.boundingBox; };
  const rib = bb('ribs_l'), hip = bb('hip_bone_l'), st = bb('sternum'), th = bb('thoracic_spine'), lu = bb('lumbar_spine');
  let lowY = rib ? rib.max.y : 1.1, lowX = .12; // lowest rib in the front half, and where it is
  if (rib) { const a = F.parts.ribs_l.g.userData.main.geometry.attributes.position; lowY = 9; for (let i = 0; i < a.count; i++) if (a.getZ(i) > .03 && a.getY(i) < lowY) { lowY = a.getY(i); lowX = Math.abs(a.getX(i)); } }
  _boneCloud = { n: Object.keys(F.parts).length, pos, seg, segs, xiphY: st ? st.min.y : 1.25, lowY, lowX: Math.max(lowX, .05), thMinY: th ? th.min.y : 1.15, luMinY: lu ? lu.min.y : 1.0, hipMinY: hip ? hip.min.y : .85, hipMaxY: hip ? hip.max.y : 1.05 };
  return _boneCloud;
}
/* Region of a point on the skin: p in body-local metres (y up, +x is the body's left, +z is its front), normal optional.
   Names follow surface anatomy: chest above the costal margin, abdomen below it down to the hip bone, lower abdomen and pelvis
   below that; at the back upper back (thoracic), lower back (lumbar) and buttock. */
function bodyRegion(F, p, normal) {
  if (F.type !== 'body' || !F.parts || !F.parts.femur_l) return null;
  const C = boneCloud(F), P = C.pos; let bd = Infinity, bi = 0;
  for (let i = 0, n = C.seg.length; i < n; i++) { const dx = P[i * 3] - p.x, dy = P[i * 3 + 1] - p.y, dz = P[i * 3 + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bi = i; } }
  let seg = C.segs[C.seg[bi]];
  let back = false; // is this the back of the body? Face normals are not oriented, so turn the normal to face the viewer first
  if (normal) { const n = normal.clone(); if (raycaster && raycaster.ray && n.dot(raycaster.ray.direction) > 0) n.negate(); back = n.z < -.35; }
  const side = p.x > .045 ? 'left' : p.x < -.045 ? 'right' : '', ax = Math.abs(p.x);
  let name;
  if (seg === 'torso') {
    let band;
    if (p.y > 1.4 && ax > .07) band = 'shoulder';
    else if (back) band = p.y >= C.thMinY ? 'upper back' : p.y >= C.luMinY ? 'lower back' : 'buttock';
    else { const costal = C.xiphY - (C.xiphY - C.lowY) * Math.min(ax / C.lowX, 1); band = p.y >= costal + .06 ? 'chest' : p.y >= costal ? 'lower chest' : p.y >= C.hipMaxY ? 'abdomen' : p.y >= C.hipMinY + .08 ? 'lower abdomen' : 'pelvis'; }
    seg = band === 'lower chest' ? 'chest' : band === 'upper back' ? 'chest' : band === 'lower back' ? 'abdomen' : band === 'buttock' ? 'pelvis' : band === 'lower abdomen' ? 'abdomen' : band;
    name = side && band !== 'pelvis' ? `${side} ${band}` : band;
  } else if (seg === 'head' || seg === 'neck') name = (back ? 'back of the ' : '') + seg;
  else { const lr = p.x > 0 ? 'left' : 'right'; name = `${lr} ${seg}`; }
  return { seg, name, side };
}
const capFirst = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* ---------- hover text ---------- */
let _tipKey = '', _tipVal = '';
function bodyTip(F, p, h) {
  if (p.id !== 'skin') return p.name;
  const k = h.pointLocal.x.toFixed(2) + h.pointLocal.y.toFixed(2) + h.pointLocal.z.toFixed(2); // the cursor moves little between ticks
  if (k !== _tipKey) { const r = bodyRegion(F, h.pointLocal, h.normalLocal); _tipKey = k; _tipVal = r ? `Skin, ${r.name}` : 'Skin'; }
  return _tipVal;
}

/* ---------- core sample ---------- */
/* Every body part along the ray under a click, from the surface inward, whether or not it is showing.
   h is a pick result with `ndc`. Returns {rows, region} or null. Each row: {id, name, dist (m from the camera), depth (m below the skin), point, normal, hit}. */
function bodyCoreSample(F, h) {
  if (!h || !h.ndc || !F.cam || !F.parts) return null;
  raycaster.setFromCamera(h.ndc, F.cam);
  const rows = [];
  for (const id of F.coreIds ? F.coreIds() : Object.keys(F.parts)) {   // a frame may list the parts that count (a thing: the ones in its current detail tier)
    const part = F.parts[id], m = part.g.userData.main; m.updateWorldMatrix(true, false);
    const hits = raycaster.intersectObjects(part.g.userData.shell ? [m, part.g.userData.shell] : [m], false), hit = F.coreClip ? hits.find(x => !F.coreClip(x.point)) : hits[0]; if (!hit) continue;   // coreClip: a cut-open view ignores what the cut has removed
    rows.push({ id, name: part.p.name, dist: hit.distance, point: hit.point.clone().add(F.C), normal: hit.face ? hit.face.normal.clone() : null, hit });
  }
  rows.sort((a, b) => a.dist - b.dist);
  for (let i = rows.length - 1; i > 0; i--) if (rows[i].name === rows[i - 1].name && Math.abs(rows[i].dist - rows[i - 1].dist) < 1e-3) rows.splice(i, 1);   // the same organ listed under two layers (a heart in Organs and in Vessels) is one row
  if (!rows.length) return null;
  const skin = rows.find(r => r.id === 'skin') || rows[0];
  rows.forEach(r => r.depth = Math.max(0, r.dist - skin.dist));
  return { rows, region: bodyRegion(F, skin.point, skin.normal) };
}

/* The core-sample block of a card. h.stack is the sample; `cur` is the part the card is about. */
function coreHtml(F, h) {
  const S = h.stack; if (!S || !S.rows.length) return '';
  const cur = h.id, max = 14, rows = S.rows;
  const cm = d => d < .0005 ? 'surface' : d < .1 ? (d * 100).toFixed(1).replace(/\.0$/, '') + ' cm' : (d * 100).toFixed(0) + ' cm';
  const li = rows.slice(0, max).map((r, i) => `<li class="${r.id === cur ? 'cur' : ''}${F.hidden.has(r.id) ? ' off' : ''}"><button class="core-go" data-i="${i}">${r.name}</button><span class="dp">${cm(r.depth)}</span>${i > 0 ? `<button class="core-peel" data-i="${i}" title="Hide everything in front of this part">Peel to here</button>` : ''}</li>`).join('');
  const more = rows.length > max ? `<li class="more">and ${rows.length - max} more, deeper</li>` : '';
  const body = F.type === 'body', T = F.coreText || {}, cr = rows.find(r => r.id === cur), gap = body && cr && F.parts[cur] && cr.depth > .12 && peelRank(F.parts[cur].p) <= 2 ? `<p class="gap">Seen through a gap between the parts in front of it: this one is on the far side of the body, ${cm(cr.depth)} behind the skin.</p>` : '';
  const where = S.region ? `<p class="where">You clicked your <b>${S.region.name}</b>.</p>${gap}` : gap;
  return `<div class="core">${where}<div class="rh">${T.head || 'Under this point, from the skin inward'}</div><ol>${li}${more}</ol><p class="cnote">${T.note || 'Depths are on the model, an average adult: not a scan of you.'}</p></div>`;
}
function wireCore(F, h) {
  const S = h.stack; if (!S) return;
  const open = i => { // open a row's card with that part highlighted
    const r = S.rows[i]; if (!r || !F.parts[r.id]) return;
    F.hidden.delete(r.id);
    const h2 = Object.assign({}, h, { obj: F.parts[r.id].g, id: r.id, pointLocal: r.point.clone(), normalLocal: r.normal, hit: r.hit, stack: S });
    showInfoFor(h2);
  };
  infoEl.querySelectorAll('.core-go').forEach(b => b.onclick = () => open(+b.dataset.i));
  infoEl.querySelectorAll('.core-peel').forEach(b => b.onclick = () => { const i = +b.dataset.i; for (let k = 0; k < i; k++) F.hidden.add(S.rows[k].id); open(i); toast('Everything in front is hidden. Use "Show everything" to bring it back.'); });
}
/* "Hide this" / "Show everything" */
function bodyHide(F, id) { F.hidden.add(id); if (F.sel === id) F.sel = null; closeInfo(); toast('Hidden. Click again to reach what is behind it. "Show everything" brings it back.'); }

/* ---------- Auto layers: a peel that follows what is under the view ----------
   The old Auto mode faded layers by the camera's distance to the body, tuned for the torso. Now the camera looks along a ray (through
   the zoom target, which is the point under the cursor while you zoom) and the stack of body parts on that ray decides what peels:
   a layer (skin, then muscle, then bone) turns see-through when the camera is closer to its surface than about PEEL_K times the
   gap to the next deeper kind of layer behind it, and each deeper layer waits until the one in front is mostly gone. So the same
   rule gives a hand, a forearm, the head and the abdomen their own distances. The first organ (or vessel, or nerve) on the ray is the
   end of the descent: it is never peeled, so you finish on the surface of the thing you were pointing at. */
const PEEL_K = 12, PEEL_TMIN = .008, PEEL_TMAX = .045, PEEL_GHOST_SKIN = .06, PEEL_GHOST_MUSCLE = .08, PEEL_GHOST_BONE = .12;
const PEEL_RANK = { skin: 0, muscular: 1, skeletal: 2 };
// vessels (arteries, veins, the big trunks) are a layer of their own between muscle and bone: they run through and over the other parts,
// so they give way to what they lie in front of (a knee shows the bone, not the artery on top of it)
const VESSEL_ID = /^(arteries_|veins_|carotid|pulmonary_vessels|pulmonary_trunk|coronary|superior_vena|inferior_vena|aorta)/;
function isVessel(p) { return VESSEL_ID.test(p.id); }
function peelRank(p) { if (isVessel(p)) return 1.5; const s = sysOf(p); return s in PEEL_RANK ? PEEL_RANK[s] : 3; }
const _po = new V3(), _pd = new V3(), _pc = new V3();
/* Stack of parts along a ray from the camera: [{id, e (metres from the camera), rank}], nearest first. Hidden parts are left out. */
function bodyRayStack(F, targetLocal) {
  camPosIn(F, _po); // camera, body-local metres
  if (targetLocal) _pd.copy(targetLocal).sub(_po); else { _pc.copy(cam.T); convertP(_pc, cam.A, F); _pd.copy(_pc).sub(_po); }
  if (_pd.lengthSq() < 1e-12) _pd.copy(cam.dir).negate();
  _pd.normalize();
  raycaster.ray.origin.copy(_po).sub(F.C); raycaster.ray.direction.copy(_pd); raycaster.near = 0; raycaster.far = Infinity;
  const rows = [];
  for (const id in F.parts) {
    if (F.hidden.has(id)) continue;
    const part = F.parts[id], m = part.g.userData.main; m.updateWorldMatrix(true, false);
    const hits = raycaster.intersectObjects(part.g.userData.shell ? [m, part.g.userData.shell] : [m], false); if (!hits.length) continue;
    const rank = peelRank(part.p);
    // the skin is a thin double-sided shell (two crossings per pass): an odd number of passes means the camera is inside it,
    // and the first pass is the way out, not something in front of the camera
    const inside = rank === 0 && (hits.length >> 1) % 2 === 1;
    const hit = hits[inside ? 2 : 0]; if (!hit) continue;
    rows.push({ id, e: hit.distance, rank });
  }
  rows.sort((a, b) => a.e - b.e);
  return rows;
}
/* Peel amounts (0 solid .. 1 see-through) of the rows. `tgt` ({n: rows in front of the part, rank}) forces the descent to end at a
   given part: everything in front of it is peeled. Returns {rows, pS, pM, pB, star, focus (name of the layer you are looking at)}. */
function bodyPeel(F, rows, tgt) {
  const n = rows.length; let prevT = Infinity, prevRank = -1, prevPi = 1;
  for (let i = 0; i < n; i++) {
    const r = rows[i]; let j = i + 1; while (j < n && rows[j].rank <= r.rank) j++;
    if (tgt) { r.pi = i < tgt.n ? 1 : 0; continue; }
    // nothing deeper behind it on this ray: a bone or organ is the end of the descent; a skin or muscle (a ray along an edge) is
    // treated as a thin layer with something behind it, so the view does not flicker between peeled and not as the ray wanders
    if (j >= n && r.rank > 1) { r.pi = 0; continue; }
    if (r.rank !== prevRank) { r.T = Math.min(PEEL_K * Math.min(Math.max(j < n ? rows[j].e - r.e : .025, PEEL_TMIN), PEEL_TMAX), prevT * .5); prevT = r.T; prevRank = r.rank; r.pi = Math.min(prevPi, 1 - smooth(r.T, r.T * 1.6, r.e)); prevPi = r.pi; }
    else { const p0 = rows[i - 1]; r.T = p0.T; r.pi = p0.pi; }
  }
  // only the layers down to the one you are looking at (the focus) count; deeper ones, and ones the camera has already passed, do not
  let fi = rows.findIndex(r => r.pi < .5); if (fi < 0) fi = n - 1;
  const fr = fi >= 0 ? rows[fi].rank : -1, upto = rk => { const r = rows.find(x => x.rank === rk); return r && rows.indexOf(r) <= fi ? r : null; };
  const near = Math.max(0, 1 - smooth(.85, 1.3, cam.D)); // an empty ray: the camera is inside the skin, or looking past the body
  const S = upto(0), M = upto(1), B = upto(2), V = upto(1.5), star = rows.some(r => r.rank === 3);
  let pS, pM, pB, pV;
  if (tgt) { const Bi = rows.findIndex(r => r.rank === 2); pS = tgt.rank > 0 ? 1 : 0; pM = tgt.rank > 1 ? 1 : 0; pB = Bi >= 0 && Bi < tgt.n && tgt.rank >= 3 ? 1 : 0; pV = tgt.rank >= 2 ? 1 : 0; }
  else { pS = S ? S.pi : fr > 0 ? 1 : near; pM = M ? M.pi : fr > 1 ? 1 : pS; pB = B ? B.pi : 0; pV = V ? V.pi : fr > 1.5 ? 1 : 0; }
  const f = rows[fi];
  return { rows, pS, pM, pB, pV, star, focus: !f ? 'skin' : f.rank === 1.5 ? 'vessels' : ['skin', 'muscles', 'bones', 'organs'][f.rank] };
}
/* class opacities from the peel amounts */
function peelOpacities(P) {
  const { pS, pM, pB, pV, star } = P, cap = star ? .3 : 1;
  const sk = 1 - (1 - PEEL_GHOST_SKIN) * pS, mu = pS * (.95 * (1 - pM) + PEEL_GHOST_MUSCLE * pM);
  const bo = pS * ((1 - pB) * (cap * pM + .3 * (1 - pM)) + pB * PEEL_GHOST_BONE);
  return { skin: sk, muscular: mu, skeletal: bo, '*': pS * pM, vessel: pS * pM * (1 - .9 * (pV || 0)) };
}
/* Called every tick by the body frame: finds what is under the view (throttled) and eases the part opacities toward it. */
const _pk = new V3(), _rc = new V3();
function bodyAutoUpdate(F, dt) {
  const A = F.auto = F.auto || { t: -1, key: '', P: null, cur: {} };
  const now = performance.now();
  camPosIn(F, _pk); const dist = _pk.distanceTo(F.center || V3Z);
  const reveal = F.reveal && F.parts[F.reveal.id] ? F.reveal : null;
  if (dist > 4 && !reveal) { A.P = null; A.far = true; return; }
  A.far = false;
  const key = [_pk.x, _pk.y, _pk.z, cam.T.x, cam.T.y, cam.T.z, F.hidden.size, reveal ? reveal.id : ''].map(v => typeof v === 'number' ? v.toFixed(4) : v).join();
  if (key !== A.key && now - A.t > 110 && F.partsReady) {
    A.key = key; A.t = now;
    let tl = null, tgt = null; if (reveal) tl = _rc.set(...F.parts[reveal.id].p.center);
    const rows = bodyRayStack(F, tl);
    if (reveal) { let k = rows.findIndex(r => r.id === reveal.id); if (k < 0) { const dc = _po.distanceTo(tl); k = rows.filter(r => r.e < dc * .97).length; } tgt = { n: k, rank: peelRank(F.parts[reveal.id].p) }; }
    A.P = bodyPeel(F, rows, tgt); A.P.op = peelOpacities(A.P); // (applyMode notices when the parts that can be seen change, and has the hover worked out again)
    A.front = tgt ? new Set(rows.slice(0, tgt.n).filter(r => r.rank >= tgt.rank).map(r => r.id)) : null; // parts of its own kind or deeper that sit in front of it (a muscle over a muscle, an organ over an organ)
  }
}
const V3Z = new V3();

/* ---------- double click on a layered thing in Auto: one step in, at that spot ----------
   A visitor who double-clicks the belly wants to see what is inside the belly, not the tissue of the skin. In Auto, "Look inside" (a double click, or
   the card's button) on a part that has a deeper layer under the pointer takes the step that scrolling would take: the camera flies to the next layer
   under that point (skin, then muscle, then the bone or organ behind it), to the distance at which the Auto peel shows exactly that layer, and the card
   of the part now shown opens. Nothing here decides what peels: the step is found by asking the frame's own peel what it would show from each candidate
   distance (bodyRayStack and bodyPeel for the body; thRayStack and thPeel for a thing with `auto.layers`, js/things.js), with the camera put there
   for the question and put back. A thing whose Auto goes by distance (`auto.stages`: the pond, the soil block) takes its next stage instead.
   When the part pointed at is the innermost there (an organ, a bone with nothing behind it) there is no step: lookInside goes on to its cut-open view
   or its tissue, as before. In a fixed layer view (Skin, Muscles ...) nothing changes: a double click on the skin still opens the skin's own tissue. */
function layerRank(F, id) {   // the body's peel rank (skin 0, muscle 1, vessels 1.5, bone 2, organs 3), a thing's layer index; undefined: the part is in no layer
  if (F.type === 'body') { const p = F.parts[id]; return p ? peelRank(p.p) : undefined; }
  const r = F.T && F.T.parts[id]; return r ? r.rank : undefined;
}
function layerAuto(F) {       // 'layers', 'stages', or null when Auto is not what decides which layers show
  if (!F || !F.layered || !F.parts || (F.hidden && F.hidden.size) || F.reveal) return null;
  if (F.type === 'body') return F.mode === 'auto' && !bodyFocus(F) ? 'layers' : null;
  const T = F.T, a = T && T.def.auto; if (!a || T.modeId !== 'auto') return null;
  return a.layers ? 'layers' : a.stages ? 'stages' : null;
}
/* the step a "Look inside" on this pick would take, without the camera distance (cheap: the card's button asks it): {kind, name, ...} or null */
function layerNext(h) {
  const F = h && h.frame, kind = layerAuto(F); if (!kind || !h.obj || !h.obj.userData.part) return null;
  if (kind === 'stages') {
    const T = F.T, st = T.def.auto.stages, cur = T.curMode && T.curMode.id, i = st.findIndex(x => x.mode === cur); if (i <= 0) return null;
    const md = T.modeDef(st[i - 1].mode); return md ? { kind, F, stage: i - 1, name: md.label || md.id } : null;
  }
  const rk = layerRank(F, h.id); if (rk === undefined) return null;
  const S = h.stack || (h.ndc ? bodyCoreSample(F, h) : null); if (!S) return null;
  const i = S.rows.findIndex(r => r.id === h.id); if (i < 0) return null;
  // (for the card's button: the nearest deeper part on the ray. The step itself asks the peel what it really shows next: layerStep)
  const next = S.rows.slice(i + 1).find(r => { const q = layerRank(F, r.id); return q !== undefined && q > rk && !F.hidden.has(r.id); }); if (!next) return null;
  return { kind, F, next, rank: layerRank(F, next.id), name: next.name, stack: S };
}
/* what Auto would bring into focus with the camera looking at P (frame coordinates) from D metres, along the direction it looks now: {id, rank} */
const _lsT = new V3(), _lsD = new V3(), _lsU = new V3(), _lsC = new V3(), _lsM = new V3();
function layerFocusAt(F, P, D) {
  const A0 = cam.A, D0 = cam.D; _lsT.copy(cam.T); _lsD.copy(cam.dir); _lsU.copy(cam.up);
  try {
    convertD(cam.dir, A0, F); cam.A = F; cam.T.copy(P); cam.D = D; camPosIn(F, _lsC);
    if (F.type === 'body') {
      if (_lsC.distanceTo(F.center || V3Z) > 4) return { id: 'skin', rank: 0 };
      const rows = bodyRayStack(F, null); bodyPeel(F, rows); const f = rows.find(r => r.pi < .5) || rows[rows.length - 1]; return f ? { id: f.id, rank: f.rank } : null;
    }
    const T = F.T, a = T.def.auto, R = (T.def.radius_m || 1) * T.k, active = a.active_m || R * 2.5, dist = _lsC.distanceTo(_lsM.set(0, R * .5, 0));
    if (dist > active) return { id: null, rank: 0 };
    if (!T.peelScale) T.peelScale = a.scale || Math.max(.15, (T.def.height_m || 1) * T.k / 1.75);
    const rows = thRayStack(F, null), pe = thPeel(T, rows, null, 1 - smooth(active * .35, active * .6, dist)), f = rows.find(r => r.rank === pe.rank);
    return { id: f ? f.id : null, rank: pe.rank };
  } finally { cam.A = A0; cam.T.copy(_lsT); cam.D = D0; cam.dir.copy(_lsD); cam.up.copy(_lsU); }
}
/* take the step: fly there, and open the card of what is now shown. Returns false when there is no step to take (lookInside then goes on). */
function layerStep(h) {
  const n = layerNext(h); if (!n) return false;
  const F = n.F, T = F.T, size = F.type === 'body' ? 1.75 : (T.def.radius_m || 1) * T.k * 2, lo = Math.max((F.floorD || 0) * 6, (F.spawnD || 0) * 2.5, size * .004);
  if (n.kind === 'stages') {   // the camera within the next stage's distance of the thing's middle (and not yet within the one after it), looking at the point clicked, else at the thing's middle
    const st = T.def.auto.stages, R = (T.def.radius_m || 1) * T.k, mid = new V3(0, R * .5, 0), dir = convertD(cam.dir.clone(), cam.A, F), max = st[n.stage].max_m * .92, min = n.stage > 0 ? st[n.stage - 1].max_m * 1.08 : 0;
    for (const P of [h.pointLocal.clone(), new V3(0, 0, 0)]) for (let D = Math.min(cam.D, max); D > lo; D *= .86) {
      const d = _lsC.copy(dir).multiplyScalar(D).add(P).distanceTo(mid); if (d > max || d < min) continue;
      flyKeep(F, P, D); if (typeof showStepNote === 'function') showStepNote(`${n.name}: one step in. Double-click again to go further.`); return true;
    }
    return false;
  }
  /* Which layer comes next is the peel's own business (under the skin of the belly the body's Auto brings up the vessels and organs, not the muscle that lies a
     little deeper on the ray; a thing's layers come strictly in order). So the camera is brought in toward the point clicked, in thought, until the peel's focus
     moves to a deeper part: that part is the next layer, and that distance shows it. The flight then aims at that part's own surface under the click when the
     peel still shows it from there. */
  const rk = layerRank(F, h.id), P0 = (h.pointLocal || n.next.point).clone(); let id = null, D1 = 0;
  for (let D = Math.min(cam.D, size * 1.2); D > lo; D *= .88) { const fo = layerFocusAt(F, P0, D); if (fo && fo.id && fo.id !== h.id && fo.rank > rk && F.parts[fo.id]) { id = fo.id; D1 = D; break; } }
  if (!id) return false;
  const row = n.stack.rows.find(r => r.id === id); let P = P0, D = D1 * .94;
  if (row) for (const k of [.94, .82, 1.06, .7]) { const fo = layerFocusAt(F, row.point, D1 * k); if (fo && fo.id === id) { P = row.point.clone(); D = D1 * k; break; } }
  const part = F.parts[id], name = (part.p && part.p.name) || id;
  const h2 = { frame: F, obj: part.g, id, pointLocal: P.clone(), normalLocal: row ? row.normal : null, hit: row ? row.hit : null, ndc: h.ndc, stack: n.stack };
  selectHit(h2);                // the panel names what is now shown
  flyKeep(F, P, D);
  if (typeof showStepNote === 'function') showStepNote(`One layer in: ${name.charAt(0).toLowerCase() + name.slice(1)} is what shows under ${(h.obj.userData.part.name || 'that').toLowerCase()} at the spot you chose. Double-click again to go further in.`);
  return true;
}

/* ---------- lung outline ----------
   The anatomy data holds each lung as its airway tree only (branches, no lung tissue). A lung that is only branches reads as a
   floating bush and has nothing to click, so the lung is drawn as a smooth outline wrapped around the tree. This is a schematic
   envelope made from the tree's reach (a star-shaped hull, pushed out of the heart so the left lung gets its notch): it is not
   measured lung anatomy, and the card and the view say so. `tree` is the tree's geometry in body metres; `heart` = {center, radius}. */
function lungShellGeo(tree, heart) {
  const a = tree.attributes.position, n = a.count, c = new V3();
  for (let i = 0; i < n; i++) c.add(new V3(a.getX(i), a.getY(i), a.getZ(i))); c.divideScalar(n);
  const U = [], R = []; for (let i = 0; i < n; i++) { const u = new V3(a.getX(i) - c.x, a.getY(i) - c.y, a.getZ(i) - c.z), l = u.length(); if (l > 1e-4) { U.push(u.divideScalar(l)); R.push(l); } }
  const sph = new THREE.SphereGeometry(1, 44, 30), P = sph.attributes.position, m = P.count, d = new V3(), r = new Float32Array(m);
  for (let i = 0; i < m; i++) { d.set(P.getX(i), P.getY(i), P.getZ(i)); let best = 0; for (let k = 0; k < U.length; k++) { const w = d.dot(U[k]); if (w > 0) { const v = R[k] * w * w * w * w; if (v > best) best = v; } } r[i] = best; }
  // the sphere repeats its seam vertices: smooth by position so the seam closes, a few rounds
  const key = i => Math.round(P.getX(i) * 1e4) + ',' + Math.round(P.getY(i) * 1e4) + ',' + Math.round(P.getZ(i) * 1e4), grp = new Map();
  for (let i = 0; i < m; i++) { const k = key(i); (grp.get(k) || grp.set(k, []).get(k)).push(i); }
  const nb = Array.from({ length: m }, () => new Set()), idx = sph.index.array;
  for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) { const i = idx[t + e], j = idx[t + (e + 1) % 3]; nb[i].add(j); nb[j].add(i); }
  for (let it = 0; it < 6; it++) {
    const nr = new Float32Array(m);
    for (let i = 0; i < m; i++) { let s = r[i], cnt = 1; nb[i].forEach(j => { s += r[j]; cnt++; }); nr[i] = s / cnt; }
    for (const ids of grp.values()) { let s = 0; ids.forEach(i => s += nr[i]); s /= ids.length; ids.forEach(i => nr[i] = s); }
    r.set(nr);
  }
  const hc = heart ? new V3(...heart.center) : null, hr = heart ? heart.radius * 1.12 : 0, q = new V3();
  for (let i = 0; i < m; i++) {
    d.set(P.getX(i), P.getY(i), P.getZ(i)); const L = r[i] * 1.05 + .004; q.copy(d).multiplyScalar(L).add(c);
    if (hc && q.distanceTo(hc) < hr) q.sub(hc).setLength(hr).add(hc); // the heart is not inside the lung
    P.setXYZ(i, q.x, q.y, q.z);
  }
  sph.computeVertexNormals(); sph.computeBoundingSphere(); sph.computeBoundingBox();
  return sph;
}
const LUNG_NOTE = 'The lung outline is drawn schematically around the airway tree, because the model data holds only the airways. Its size and shape are approximate.';

/* ---------- surface grain ----------
   Body parts are smooth single-colour meshes: close up they become a flat wall. A faint value noise in object space (two scales,
   about 7 mm and 1 mm cells, each fading out with the camera's distance) gives the eye something to judge distance and direction by.
   It only modulates the colour by a few percent; it is not anatomy. */
function bodySurface(mat) {
  mat.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vObjPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vObjPos = position;');
    sh.fragmentShader = `varying vec3 vObjPos;
float bgh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float bgn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(bgh(i), bgh(i + vec3(1, 0, 0)), f.x), mix(bgh(i + vec3(0, 1, 0)), bgh(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(bgh(i + vec3(0, 0, 1)), bgh(i + vec3(1, 0, 1)), f.x), mix(bgh(i + vec3(0, 1, 1)), bgh(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
 { float dv = length(vViewPosition);
   float a1 = 1. - smoothstep(.5, 2.5, dv), a2 = 1. - smoothstep(.05, .35, dv);
   float n = bgn(vObjPos * 150.) * a1 * .14 + bgn(vObjPos * 1000.) * a2 * .2;
   diffuseColor.rgb *= 1. - n; }`); // only darkens, so a pale bone is not clipped to flat white
  };
  mat.customProgramCacheKey = () => 'bodysurface';
}
