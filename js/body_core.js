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
  if (F.type !== 'body' || !F.parts) return null;
  let C, seg;
  if (F.who === 'woman') {   // her model has no skull, arm, hand or foot bones: each vertex of her skin carries its region (tools/anatomy/female/regions_f.py)
    C = F.A && F.A.regions; const sk = F.parts.skin; if (!C || !sk) return null;
    const P = sk.g.userData.main.geometry.attributes.position.array; let bd = Infinity, bi = 0;
    for (let i = 0, n = P.length / 3; i < n; i++) { const dx = P[i * 3] - p.x, dy = P[i * 3 + 1] - p.y, dz = P[i * 3 + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bi = i; } }
    seg = C.segs[C.codes[bi]];
  } else {
  if (!F.parts.femur_l) return null;
  C = boneCloud(F); const P = C.pos; let bd = Infinity, bi = 0;
  for (let i = 0, n = C.seg.length; i < n; i++) { const dx = P[i * 3] - p.x, dy = P[i * 3 + 1] - p.y, dz = P[i * 3 + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bi = i; } }
  seg = C.segs[C.seg[bi]];
  }
  let back = false; // is this the back of the body? Face normals are not oriented, so turn the normal to face the viewer first
  if (normal) { const n = normal.clone(); if (raycaster && raycaster.ray && n.dot(raycaster.ray.direction) > 0) n.negate(); back = n.z < -.35; }
  const side = p.x > .045 ? 'left' : p.x < -.045 ? 'right' : '', ax = Math.abs(p.x);
  let name;
  if (seg === 'torso') {
    let band;
    if (p.y > (C.shoulderY || 1.4) && ax > .07) band = 'shoulder';
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
  const where = S.region ? `<p class="where">You clicked ${F.who === 'woman' ? 'her' : 'his'} <b>${S.region.name}</b>.</p>${gap}` : gap;
  return `<div class="core">${where}<div class="rh">${T.head || 'Under this point, from the skin inward'}</div><ol>${li}${more}</ol><p class="cnote">${T.note || (F.who === 'woman' ? 'Depths are on this model of one woman: not a scan of you.' : 'Depths are on this model of one man: not a scan of you.')}</p></div>`;
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
    // the man's skin is a thin double-sided shell (two crossings per pass; the woman's is one surface, F.skinPasses = 1): an odd number of
    // passes means the camera is inside it, and the first pass is the way out, not something in front of the camera
    const k = F.skinPasses || 2, inside = rank === 0 && Math.floor(hits.length / k) % 2 === 1;
    const hit = hits[inside ? k : 0]; if (!hit) continue;
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
/* the woman's model note (js/nodes.js FT.body, BLK.recolor): what is hers, what is missing, what is not her own tissue */
const BODY_F_NOTE = 'Model: one woman\'s body, the Visible Human Female (U.S. National Library of Medicine; 59 years old, described by the Human Reference Atlas as obese), from the Human Reference Atlas\'s 3D models of her frozen sections. Not resized: she stands 1.66 m in this model (her recorded height is 171.2 cm). Her shape is that of a body lying on its back, shown standing: her back and buttocks are flattened. Shown are her skin; spine, breastbone, pelvis and leg bones, with the cartilage and ligaments of her knees; heart and the vessels of her trunk; lungs and airway; liver, gallbladder, bile ducts, pancreas, spleen, thymus, gut and omentum; kidneys and bladder; uterus, ovaries and their ligaments; breasts; brain, spinal cord, optic nerves, eyes and eye muscles; teeth, tongue, mouth and salivary glands; and one thigh muscle on each side. Her skull, ribs, shoulders, arm, hand and foot bones, almost all her muscles, her stomach and the vessels of her head and limbs were not made from her sections, so they are missing here: no missing part is filled in from another body. The one part from someone else is her brain, which the atlas makers took from another woman (Allen human brain atlas), mirrored and resized. Also not her own tissue: the inside of each breast is a sculpted reference model; the large intestine follows her bowel\'s path only roughly; the spinal discs are modelled. Her teeth, tongue, gums, palate and salivary glands follow her sections and were refined with dental atlases. The atlas makers adjusted her skin to fit the organs, made her optic nerves thicker and reshaped the neck of her pancreas. Tissue colours are those of living tissue, approximately. Woman: Visible Human Female (U.S. National Library of Medicine), 3D models by K. Browne and H. Schlehlein, Human Reference Atlas, 3D Reference Organ Set for Female v1.10 and Pelvis v1.3 (CC BY 4.0, https://creativecommons.org/licenses/by/4.0/); brain from the Allen human brain reference atlas (Ding et al. 2016) as fitted by the HRA. Selected, merged, simplified, re-centred and recoloured for this site.';
const BODY_F_NOTE_REAL = 'The skin tone is one choice of many. Her eyes are closed in the data and are shown closed; the line of the lashes is drawn by rule. The red of the lips, the brows and the hair are colours laid on the skin by rule, as on the man: the data has no hair. Her fingernails are drawn by the rule used for the man, with the proportions measured on men\'s nails (women\'s are a little longer for their width); her toes have none.';
const BODY_BOTH_NOTE = 'The man is BodyParts3D scaled to 1.75 m, a height chosen for this site (TARO, the scan model it was made from, is 1.73 m tall); the woman is not scaled. So their difference in height is partly that choice. Their other differences are between these two people, not between men and women on average.';
/* the two of them seen together (the place card while the camera is a few metres from both: engine_ui.js updateCaption, F.placeAs) */
const BODY_PEOPLE = { name: 'People', blurb: 'A man and a woman, each an anatomical model made from one person\'s body: the man from BodyParts3D, scaled to 1.75 m, the woman from the Visible Human Female at her own size. Click anywhere on either to see what lies under that spot; double-click a part to look inside it. Zoom in and the skin turns see-through, then the layers beneath. Her model has fewer layers than his; her note says which.', note: BODY_BOTH_NOTE };
/* what her data lacks, said on the canvas in each view (the line under the field of view: engine_ui.js updateCaption, F.gapNote) */
const BODY_F_GAP = {
  skeleton: 'Not in her data: skull, jaw, ribs, collarbones, shoulder blades, arm, hand and foot bones. Nothing is filled in from another body.',
  muscles: 'Not in her data: all her muscles but the front muscle of each thigh (rectus femoris) and the eye muscles.',
  organs: 'Not in her data: stomach, oesophagus, diaphragm, and the adrenal, thyroid and pituitary glands.',
  nervous: 'Her nerves in the data: the brain (another woman\'s), spinal cord and optic nerves; no other nerves.',
  circulatory: 'Not in her data: the vessels of her head, neck, arms and legs.',
  auto: 'Not in her data: skull, ribs, arm, hand and foot bones and almost all her muscles; what shows is all the atlas has here.' };
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

/* ---------- the person under the realistic look (?look=2; docs/DESIGN.md 3.5 to 3.7, rollout step 8) ----------
   Off by default: with the look off BLK.on is false, nothing below runs, and the body is drawn exactly as before.
   What it does, all in the shader of the body's own materials (no new pass, no new light, no texture to fetch):
   - colour: living tissue instead of the atlas code (the atlas colours come back, named as a convention, in the Nerves and Heart &
     vessels views); skin with the redder and paler zones a real body has, set once per vertex, and a mottling of blood and pigment;
   - light through: the thin parts (ears, fingers, the tip of the nose) glow red when lit from behind (the foundation's LK_THIN term,
     scaled per vertex); the wrapped terminator of the skin kind does the rest;
   - surface: fine relief of the skin drawn from noise in the body's own space, only when the camera is within about a metre;
   - eyes: the skin of the model has openings for the eyes; the eyeballs behind them are shown while the skin is, with an iris and pupil
     drawn on the eyeball in its own frame (the iris colour is a choice, brown);
   - lips and areolae: darker zones where they are on this model's skin (it has no separate geometry for them);
   - peeled layers: a layer that is see-through is drawn as clear glass, its reflections and its edges, not as a milky film of its colour.
   Measured on the test machine: no change in draw calls or triangles but the two eyeballs (2 calls, 1,514 triangles while the skin is
   shown). Expected on a graphics card: about 60 more arithmetic operations per skin pixel, and fewer under a peel (no extra pass). */
const BLK = (() => {
  const B = { on: typeof LOOK !== 'undefined' && LOOK.on && LOOK.part('pbr') };
  if (!B.on) return B;
  B.BG = 0x141619;   // the neutral dark ground of a close-up, a cut-open organ and a tissue model
  /* Living tissue, as fresh tissue and surgical photographs show it under neutral light: estimates, not measurements (the anatomy data
     carries atlas colours only). Hex as sRGB, like every colour in the app. */
  const REAL = {
    skin: 0xc4a08a, teeth: 0xe6dcc6, intervertebral_discs: 0xd6d4c8, eyeball_l: 0xe9e3d8, eyeball_r: 0xe9e3d8,
    heart: 0x8c3a32, left_atrium: 0x8e3832, right_atrium: 0x8e3832, left_ventricle: 0x84302b, right_ventricle: 0x84302b, papillary_muscles: 0x8a3530, heart_valves: 0xe2d5b6, liver: 0x7a3328, gallbladder: 0x56703e, spleen: 0x6a2c3a, pancreas: 0xd2ab86, stomach: 0xd2a08e,
    small_intestine: 0xd6a294, colon: 0xc89c84, rectum: 0xc89c84, appendix: 0xc89c84, esophagus: 0xc98c7e, tongue: 0xbf6a62,
    kidney_l: 0x7e322d, kidney_r: 0x7e322d, ureter_l: 0xd8b9a8, ureter_r: 0xd8b9a8, bladder: 0xd9b4a0, adrenal_l: 0xd3a24e, adrenal_r: 0xd3a24e,
    pituitary: 0xcf9f8e, thymus: 0xd8b9a0, lung_l: 0xd59a92, lung_r: 0xd59a92, trachea: 0xdcc8bc, bronchi: 0xdcc8bc, larynx: 0xdcc8bc,
    cerebrum_l: 0xcfa79a, cerebrum_r: 0xcfa79a, cerebellum: 0xc99c90, brainstem: 0xd4b2a4, spinal_cord: 0xe6dccb, diaphragm: 0x8a3a33,
    aorta: 0xcf9c90, pulmonary_trunk: 0xcf9c90, coronary_arteries: 0xc4877c, superior_vena_cava: 0x5f4b6c, inferior_vena_cava: 0x5f4b6c,
  };
  const SYSREAL = { skeletal: 0xd8cbb0, muscular: 0x8e3a33, nervous: 0xe8dfcb, respiratory: 0xdcc8bc, digestive: 0xd2a08e, urinary: 0xd8b9a8,
    endocrine: 0xd3a24e, lymphatic: 0xd8b9a0, sensory: 0xe9e3d8, integumentary: 0xc4a08a };
  /* the woman's parts the man has no counterpart of, and her detail parts (by id pattern); her skin tone is another choice of many */
  const REAL_F = [[/^breast_fat/, 0xe0c38e], [/^breast_lobes|^lactiferous/, 0xd9aa9c], [/^nipple_areola/, 0x7e5242], [/^breast_ligaments|^broad_ligament|^uterine_ligaments|^uterovesical/, 0xe2d4c4],
    [/^uterus|^cervix|^vagina/, 0xc78a82], [/^uterine_tube/, 0xd6a49a], [/^ovary/, 0xe0cbb8], [/^uterine_vessels/, 0xb98078], [/^lseg/, 0xd59a92], [/^lvseg/, 0x7a3328],
    [/^kidney_cortex|^kidney_capsule|^renal_pyramids/, 0x7e322d], [/^renal_pelvis/, 0xe2cdb8], [/_lobe_|^cingulate|^cerebral_white|^thalamus|^basal_ganglia|^hippocampus|^amygdala|^hypothalamus|^corpus_callosum/, 0xcfa79a],
    [/^rectus_femoris|^extraocular/, 0x8e3a33], [/^cardiac_veins/, 0x5f4b6c], [/^omentum/, 0xe6cf98], [/^biliary/, 0x7f8f4a], [/^gums_palate/, 0xc07a72], [/^salivary/, 0xd8b89a], [/^knee_cartilage/, 0xd8dcd4]];
  const SKIN_F = 0x9c6c50;
  const realOf = (p, who) => (who === 'woman' && p.id === 'skin' ? SKIN_F : 0) || REAL[p.id] || (/^arteries_|^carotid/.test(p.id) ? 0xc98f84 : /^veins_/.test(p.id) ? 0x5f4b6c : /^pulmonary_vessels/.test(p.id) ? 0xa6736e : 0) || (REAL_F.find(r => r[0].test(p.id)) || [])[1] || SYSREAL[p.system] || 0xc8b8a8;
  B.colorOf = (p, who) => realOf(p, who);
  /* the convention a view of one system uses, and says it uses */
  const ATLAS_MODE = { nervous: 'nervous', circulatory: 'cardiovascular' };
  B.NOTE = 'Model: one man\'s body, from anatomical data made from his scans (BodyParts3D), scaled to 1.75 m and lit by the real Sun and sky. Tissue colours are those of living tissue, approximately, and where each muscle turns into tendon is drawn approximately. The skin tone is one choice of many. The eyes are the model\'s eyeballs, with an iris drawn on; lips, brows and the short hair are colours on the skin, because the model\'s surface is too coarse for them. It has no nails.';
  /* once the detailed skin is in (BLK.hd): what is one man's and what is an average. BodyParts3D's shapes come from TARO, a set of MRI
     scans of one adult man (Nagaoka et al. 2004, Phys Med Biol 49:1); Mitsuhashi et al. 2009, Nucleic Acids Res 37:D782. */
  B.NOTE_HD = 'Model: one man\'s body, from anatomical data made from his scans (BodyParts3D), scaled to 1.75 m and lit by the real Sun and sky. The shape of his face, ears, hands and body is his own, not an average. The eyes are scaled to the average adult size (24 mm across) and the lids opened to average measurements. Tissue colours are those of living tissue, approximately, and where each muscle turns into tendon is drawn approximately. The skin tone is one choice of many. The red of the lips, the brows and the short hair are colours on the skin, laid where the data has them. The fingernails are drawn by rule from published proportions; the toes have none.';
  B.ATLAS_NOTE = { nervous: 'Nerves are drawn yellow, the colour anatomy atlases use; in life they are glistening white.', cardiovascular: 'Arteries red and veins blue, the colours anatomy atlases use; in life artery walls are pale pink and veins dark bluish purple.' };

  const NOISE = `
float bkH( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 ); }
float bkN( vec3 p ) { vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( bkH( i ), bkH( i + vec3( 1.0, 0.0, 0.0 ) ), f.x ), mix( bkH( i + vec3( 0.0, 1.0, 0.0 ) ), bkH( i + vec3( 1.0, 1.0, 0.0 ) ), f.x ), f.y ),
	            mix( mix( bkH( i + vec3( 0.0, 0.0, 1.0 ) ), bkH( i + vec3( 1.0, 0.0, 1.0 ) ), f.x ), mix( bkH( i + vec3( 0.0, 1.0, 1.0 ) ), bkH( i + vec3( 1.0, 1.0, 1.0 ) ), f.x ), f.y ), f.z ); }
`;
  /* A peeled layer as clear glass: only what a clear sheet shows, the sky or the studio reflected in it, which is strong only where it is
     seen edge-on (Fresnel), so the layer is a thin bright line at its outline and nothing across its face. None of its own colour, none of
     its shade (a coloured or darkened film read as smoked glass), and only its near side: the far side of a closed shell drew a second
     outline inside the first. The outermost pixel of the outline fades out, so a silhouette cannot sparkle. */
  const GLASS = `
	if ( uBkGhost.x > 0.001 ) {
		if ( uBkGhost.x > 0.5 && ! gl_FrontFacing ) discard;
		vec3 bkVd = normalize( vViewPosition ), bkNn = normalize( normal );
		float bkNV = abs( dot( bkNn, bkVd ) ), bkF = ( 0.04 + 0.96 * pow( 1.0 - bkNV, 5.0 ) ) * smoothstep( 0.0, 0.07, bkNV );
		vec3 bkRd = inverseTransformDirection( reflect( - bkVd, bkNn ), viewMatrix );
		vec3 bkRad = radiance; bkRad = mix( bkRad, vec3( dot( bkRad, vec3( 0.2126, 0.7152, 0.0722 ) ) ), smoothstep( 0.15, -0.25, bkRd.y ) );   // the lawn's bounce is not green on glass either
		float bkA = clamp( uBkGhost.y * bkF * 1.3, 0.0, 0.6 );
		vec3 bkC = bkRad + reflectedLight.directSpecular * ( 0.5 / max( bkA, 0.08 ) );
		gl_FragColor = vec4( mix( outgoingLight, bkC, uBkGhost.x ), mix( diffuseColor.a, bkA, uBkGhost.x ) );
	} else gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;
  const OUT = 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );';
  /* Ambient occlusion baked per vertex (tools/anatomy/bake_ao.mjs, data/anatomy/ao.json, fetched only under this look): the light of the
     sky or the studio does not reach into a crease, an armpit or the gap between two fingers. It darkens the environment's light fully
     and the key's a little (the body has no shadow of its own on itself). Stored as occlusion, so a part whose bake has not arrived is open. */
  /* Also here, two corrections to the light of the environment:
     - the lower half of the park's sky is the lawn's bounce, drawn a saturated green: on a surface that faces down (under the chin, the
       nose, the brows, a thumb) it made a green-black band. Grass reflects little and fairly evenly, so the light from below is kept at
       its strength and loses its colour, for diffuse light by the way the surface faces and for reflections by the way they point;
     - reflections are occluded with the rest of the indirect light, and fade out where a surface is seen exactly edge-on: there the
       interpolated normal of a coarse mesh turns away from the eye and a single pixel caught the whole sky (white dots along the jaw,
       a white fringe round the fingertips);
     - what closes a crease is the body itself, and in sunlight that is lit skin: the occluded share of the sky is given back as light
       reflected once by a surface of the same colour lit by the key at about a third of its strength (a third: the share of the
       occluding surface that faces the light, roughly). Under the chin this is the light the sunlit chest sends up, the main light
       there in life; without it the underside of the jaw was a black band. */
  const AO = `
	{ float bkO = 1.0 - 0.82 * vBkOcc;   // light that bounces between surfaces never lets a crease go black
	  vec3 bkWN = inverseTransformDirection( geometry.normal, viewMatrix ), bkWR = inverseTransformDirection( reflect( - geometry.viewDir, geometry.normal ), viewMatrix );
	  vec3 bkAlb = max( material.diffuseColor, vec3( 0.002 ) ), bkIrr = reflectedLight.indirectDiffuse / bkAlb;
	  bkIrr = mix( bkIrr, vec3( dot( bkIrr, vec3( 0.2126, 0.7152, 0.0722 ) ) ), smoothstep( 0.35, -0.45, bkWN.y ) );
	  vec3 bkSun = vec3( 0.0 );
	  #if NUM_DIR_LIGHTS > 0
	  bkSun = directionalLights[ 0 ].color * saturate( inverseTransformDirection( directionalLights[ 0 ].direction, viewMatrix ).y * 0.5 + 0.5 );
	  #endif
	  reflectedLight.indirectDiffuse = ( bkIrr * bkO + vBkOcc * bkAlb * bkSun * 0.35 ) * bkAlb; reflectedLight.directDiffuse *= mix( 1.0, bkO, 0.35 );
	  float bkNV = saturate( dot( geometry.normal, geometry.viewDir ) ), bkEdge = smoothstep( 0.0, 0.18, bkNV );
	  vec3 bkSp = reflectedLight.indirectSpecular; bkSp = mix( bkSp, vec3( dot( bkSp, vec3( 0.2126, 0.7152, 0.0722 ) ) ), smoothstep( 0.15, -0.25, bkWR.y ) );
	  reflectedLight.indirectSpecular = bkSp * computeSpecularOcclusion( bkNV, bkO, material.specularRoughness ) * mix( 1.0, bkO, 0.6 ) * bkEdge;
	  reflectedLight.directSpecular *= bkEdge;
	  #ifdef BK_FILL
	  reflectedLight.indirectDiffuse += bkFill( bkWN, bkAlb );
	  #endif
	}
`;
  /* A closed shell drawn from both sides (the skin) has, along every fold that turns away from the eye (the side of the nose, under the
     jaw), its inside face at the same depth as its outside: some pixels went to the inside face and showed as a dotted line of light.
     The inside face is pushed back by a hair's breadth in depth, so the outside always wins a tie. */
  const BACK = `
	#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
		if ( ! gl_FrontFacing ) gl_FragDepthEXT += 4e-5;
	#endif
`;
  /* the normal a coarse mesh interpolates can face away from the eye near an outline; it is turned back to just face it */
  const FACE = `
	{ vec3 bkVd = normalize( vViewPosition ); float bkNd = dot( normal, bkVd ); if ( bkNd < 0.06 ) normal = normalize( normal + bkVd * ( 0.06 - bkNd ) ); }
`;
  const aoP = {}, aoData = {};   // per anatomy folder (the man's, the woman's)
  B.loadAO = (dir = 'data/anatomy/') => aoP[dir] || (aoP[dir] = (LOOK.part('ao') ? getJSON(dir + 'ao.json') : Promise.resolve(null)).then(j => (aoData[dir] = j && j.parts) || null, () => null));
  B.applyAO = F => {
    const D = aoData[F.anatDir || 'data/anatomy/']; if (!D) return;
    for (const id in F.parts) { const s = D[id], g = F.parts[id].g.userData.main.geometry; if (!s || g.attributes.bkOcc) continue;
      const b = atob(s), n = g.attributes.position.count; if (b.length !== n) continue; const o = new Uint8Array(n); for (let i = 0; i < n; i++) o[i] = 255 - b.charCodeAt(i);
      g.setAttribute('bkOcc', new THREE.BufferAttribute(o, 1, true)); }
  };
  /* every body part: the baked occlusion and the glass peel. The peel's uniform is set each tick by applyMode: x how far the layer is peeled, y the frame's own opacity */
  B.part = (m, p, g) => {
    if (!m || !m.isMeshStandardMaterial) return m;
    const u = m.userData.bkGhost = { value: new THREE.Vector2(0, 1) };
    LOOK.patch(m, 'bkpart', sh => {
      sh.uniforms.uBkGhost = u;
      sh.vertexShader = 'attribute float bkOcc;\nvarying float vBkOcc;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvBkOcc = bkOcc;');
      sh.fragmentShader = 'varying float vBkOcc;\n' + sh.fragmentShader.replace('void main() {', 'uniform vec2 uBkGhost;\nvoid main() {').replace('#include <logdepthbuf_fragment>', '#include <logdepthbuf_fragment>' + BACK).replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + FACE).replace('#include <aomap_fragment>', '#include <aomap_fragment>' + AO).replace(OUT, GLASS);
    });
    if (/^eyeball_/.test(p.id)) eye(m, p, g);
    else if (p.system === 'muscular' && g && LOOK.part('tex')) muscle(m, p, g);
    return m;
  };
  B.ghost = (m, g, a) => { const u = m.userData.bkGhost; if (u) u.value.set(g, a); };
  /* the eye: an iris 11.7 mm across and a pupil of 3.5 mm on the front of the eyeball, looking straight ahead (+z), drawn in the eye's
     own frame; the eye kind makes it as smooth as a wet cornea is. The iris's angle is worked out from this eyeball's own radius (13.6 mm:
     the model's eyeball is 27 mm across, at the top of the measured adult range of 21 to 27 mm; typical is 24.2, Bekerman et al. 2014).
     While it is seen through the skin, only its front shows: the coarse skin has no real socket and passes inside the eyeball beside the
     nose and under the brow, where the eyeball came through it as a dotted line of white. The upper lid's shade lies on its top. */
  function eye(m, p, g) {
    const c = new V3(...p.center); let r = .0136;
    if (g) { g.computeBoundingBox(); const s = new V3(); g.boundingBox.getSize(s); r = s.x / 2; }
    const cap = m.userData.bkCap = { value: new THREE.Vector2(0, Math.sign(c.x) || 1) };
    /* the detailed eye (BLK.hd): the atlas's own sclera, iris and lens (bkMask.r: 0, 0.5, 1) under a clear cornea of its own; uBkIris: the
       pupil's centre and the iris's radius, uBkGaze: the way the eye looks (w: 1 once the detailed eye is in) */
    const iris = m.userData.bkIris = { value: new THREE.Vector4(0, 0, 0, 1) }, gaze = m.userData.bkGaze = { value: new THREE.Vector4(0, 0, 1, 0) };
    if (g && !g.attributes.bkMask) g.setAttribute('bkMask', new THREE.BufferAttribute(new Uint8Array(g.attributes.position.count * 4), 4, true));
    LOOK.patch(m, 'bkeye', sh => {
      sh.uniforms.uBkEye = { value: c }; sh.uniforms.uBkCap = cap; sh.uniforms.uBkIris = iris; sh.uniforms.uBkGaze = gaze;
      sh.vertexShader = 'attribute vec4 bkMask;\nvarying vec3 vBkP;\nvarying vec4 vBkEm;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvBkP = position; vBkEm = bkMask;');
      sh.fragmentShader = 'varying vec3 vBkP;\nvarying vec4 vBkEm;\nuniform vec3 uBkEye;\nuniform vec2 uBkCap;\nuniform vec4 uBkIris;\nuniform vec4 uBkGaze;\n' + NOISE + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
	{ vec3 bkD = normalize( vBkP - uBkEye ); if ( uBkCap.x > 0.5 && ( bkD.z < 0.0 || length( vec2( ( bkD.x * uBkCap.y - 0.08 ) / 0.79, bkD.y / 0.59 ) ) > 1.0 ) ) discard;   // the almond the lids leave open: 45 degrees to the nose, 60 to the side, 36 up and down
	  float bkR = acos( clamp( bkD.z, -1.0, 1.0 ) ) / ${Math.asin(Math.min(.9, .00585 / r)).toFixed(4)};   // 1 at the edge of the iris
	  if ( uBkGaze.w > 0.5 ) {   // the detailed eye: the iris is its own disc, behind the cornea; measured across it, not by angle
		vec3 bkQ = vBkP - uBkIris.xyz; bkR = length( bkQ - uBkGaze.xyz * dot( bkQ, uBkGaze.xyz ) ) / uBkIris.w;
		if ( vBkEm.r < 0.25 ) {   // the sclera: a warm white, in the shade of the lids towards the corners and under the upper lid
			diffuseColor.rgb *= vec3( 0.93, 0.91, 0.87 ) * mix( 1.0, 0.78, smoothstep( 1.1, 2.2, bkR ) ) * mix( 1.0, 0.86, smoothstep( 0.3, 1.0, bkQ.y / uBkIris.w ) );
			bkR = 2.0;
		}
		else if ( vBkEm.r > 0.75 ) { diffuseColor.rgb = vec3( 0.03 ); bkR = 2.0; }   // the lens, seen through the pupil: dark
	  }
	  if ( bkR < 1.2 ) {
		float bkAz = atan( bkD.y, bkD.x ), bkF1 = bkN( vec3( cos( bkAz ) * 14.0, sin( bkAz ) * 14.0, bkR * 3.0 ) ), bkF2 = bkN( vec3( cos( bkAz ) * 40.0, sin( bkAz ) * 40.0, bkR * 9.0 ) );
		vec3 bkI = vec3( 0.40, 0.26, 0.15 ) * ( 0.72 + 0.4 * bkF1 + 0.2 * bkF2 );
		bkI = mix( bkI * 1.45, bkI, smoothstep( 0.36, 0.55, bkR ) );              // the paler ring round the pupil
		bkI *= mix( 1.0, 0.45, smoothstep( 0.82, 1.0, bkR ) );                     // the dark limbal ring
		vec3 bkC = mix( bkI, vec3( 0.025 ), 1.0 - smoothstep( 0.28, 0.32, bkR ) );   // the pupil
		diffuseColor.rgb = mix( diffuseColor.rgb, bkC, 1.0 - smoothstep( 0.99, 1.05, bkR ) );
	  }
	  diffuseColor.rgb *= mix( 1.0, 0.55, smoothstep( 0.2, 0.62, bkD.y ) * uBkCap.x );   // the upper lid's shade, while the lids are there
	}`);
    });
  }
  /* A muscle. Each mesh of the data is a whole muscle (or a group) with its tendons fused on, all one colour. In life a tendon and an
     aponeurosis are white and silvery and shine, and they are where a dissection reads as one. Where they are on each mesh is set here
     approximately, from the muscle's long axis (the main axis of its vertices) and where it attaches: [fraction of the length that is
     tendon at the upper or inner end, at the lower or outer end]; the flat ones by rule (the linea alba down the middle of the abdomen,
     the trapezius's aponeurosis at the midline of the neck and back, the central tendon at the top of the diaphragm).
     Near the camera (within about a metre, `lookoff=tex` removes it) a fine relief runs along the axis: fascicles, bundles of fibres
     about a millimetre across, so a muscle is not a smooth red rubber. */
  const TEND = { biceps_brachii: [.14, .14], triceps_brachii: [0, .12], forearm_muscles: [0, .3], quadriceps: [0, .1], hamstrings: [.08, .1], gastrocnemius: [0, .3],
    sternocleidomastoid: [.1, .1], deltoid: [0, .12], pectoralis_major: [0, .12] };
  function muscle(m, p, g) {
    const P = g.attributes.position, n = P.count, c = new V3(), v = new V3(), C = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < n; i++) c.add(v.fromBufferAttribute(P, i)); c.divideScalar(n);
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i).sub(c); C[0] += v.x * v.x; C[1] += v.y * v.y; C[2] += v.z * v.z; C[3] += v.x * v.y; C[4] += v.x * v.z; C[5] += v.y * v.z; }
    const ax = new V3(.3, 1, .2).normalize(), t = new V3();
    for (let k = 0; k < 40; k++) { t.set(C[0] * ax.x + C[3] * ax.y + C[4] * ax.z, C[3] * ax.x + C[1] * ax.y + C[5] * ax.z, C[4] * ax.x + C[5] * ax.y + C[2] * ax.z); ax.copy(t.normalize()); }
    const base = p.id.replace(/_[lr]$/, ''), rule = TEND[base], w = new Float32Array(n);
    let lo = Infinity, hi = -Infinity, ymax = -Infinity; for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i); const s = v.clone().sub(c).dot(ax); lo = Math.min(lo, s); hi = Math.max(hi, s); ymax = Math.max(ymax, v.y); }
    // which end of the axis is the lower (for the pectoralis: the outer) one
    const endV = new V3().copy(ax).multiplyScalar(hi).add(c), lowerIsHi = base === 'pectoralis_major' ? Math.abs(endV.x) > Math.abs(c.x) : endV.y < c.y;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(P, i); const x = Math.abs(v.x);
      let k = 0;
      if (rule) { const f = (v.clone().sub(c).dot(ax) - lo) / (hi - lo), up = lowerIsHi ? f : 1 - f, dn = 1 - up;   // 0 at the upper end, 0 at the lower end
        if (rule[0]) k = Math.max(k, 1 - sm(rule[0] * .55, rule[0], up)); if (rule[1]) k = Math.max(k, 1 - sm(rule[1] * .55, rule[1], dn)); }
      else if (base === 'abdominal_muscles') k = (1 - sm(.003, .0075, x)) * .85;   // the linea alba: about a centimetre wide above the navel
      else if (base === 'trapezius') k = (1 - sm(.012, .028, x)) * sm(1.2, 1.3, v.y);
      else if (base === 'diaphragm') k = sm(ymax - .03, ymax - .012, v.y) * (1 - sm(.045, .075, x));
      w[i] = k;
    }
    g.setAttribute('bkTen', new THREE.BufferAttribute(w, 1));
    if (LOOK.part('tex')) m.defines.BK_FIBRE = '1';
    m.extensions = Object.assign(m.extensions || {}, { derivatives: true });
    LOOK.patch(m, 'bkmuscle', sh => {
      sh.uniforms.uBkAx = { value: ax };
      sh.vertexShader = 'attribute float bkTen;\nvarying float vBkTen;\nvarying vec3 vBkM;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvBkTen = bkTen; vBkM = position;');
      sh.fragmentShader = 'varying float vBkTen;\nvarying vec3 vBkM;\nuniform vec3 uBkAx;\nfloat bkFib = 0.5;\n' + NOISE + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
	diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.80, 0.76, 0.71 ), vBkTen );   // tendon: white, faintly yellow
	#ifdef BK_FIBRE
	{ vec3 bkB = normalize( cross( uBkAx, abs( uBkAx.y ) < 0.9 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 ) ) ), bkC = cross( uBkAx, bkB );
	  bkFib = bkN( vec3( dot( vBkM, uBkAx ) * 60.0, dot( vBkM, bkB ) * 1100.0, dot( vBkM, bkC ) * 1100.0 ) ); }
	#endif`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix( roughnessFactor * ( 0.8 + 0.4 * bkFib ), 0.3, vBkTen );')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	#ifdef BK_FIBRE
	{ float bkDv = length( vViewPosition ), bkK = 1.0 - smoothstep( 0.3, 1.2, bkDv );
	  if ( bkK > 0.0 ) {
		float bkHt = bkFib * 9e-5 * bkK;
		vec3 bkSx = dFdx( -vViewPosition ), bkSy = dFdy( -vViewPosition ), bkR1 = cross( bkSy, normal ), bkR2 = cross( normal, bkSx );
		float bkDet = dot( bkSx, bkR1 ); vec3 bkGr = sign( bkDet ) * ( dFdx( bkHt ) * bkR1 + dFdy( bkHt ) * bkR2 );
		normal = normalize( abs( bkDet ) * normal - bkGr );
	  } }
	#endif`);
    });
  }
  /* The skin. Zones are set once per vertex from where they are on this model (body metres: +x the body's left, +y up, +z its front),
     measured on the skin of data/anatomy: redder on the face, ears, hands, feet, knees and elbows, where blood is nearer the surface;
     bkThin marks what is thin enough for light to come through (ears, fingers, the tip of the nose). */
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const blob = (x, y, z, cx, cy, cz, r) => 1 - sm(r * .4, r, Math.hypot(x - cx, y - cy, z - cz));
  /* where the zones are, per body: the man's measured on his skin; the woman's moved by where her eyes, nose tip, hands, elbows and knee
     caps are on hers (her head is 7 cm lower and 2 cm further forward in her frame; her arms hang further out) */
  const ZONES = { man: { face: [1.48, 1.54, -.03, .03, 1.66, 1.72], cheek: [.046, 1.585, .074], nose: [0, 1.592, .1], ear: [.076, 1.645, -.045], hand: [.2, .23, .88, .93, .77, .815],
      knee: [.083, .47, .04], elbow: [.215, 1.13, -.045], out: [.066, .075], lid: [.031, 1.627, .052], earThin: [.07, .077], noseThin: [.095, .105], head: 1.45 },
    woman: { face: [1.41, 1.47, -.01, .05, 1.59, 1.65], cheek: [.055, 1.517, .096], nose: [0, 1.512, .118], ear: [.085, 1.577, -.023], hand: [.37, .40, .9, .95, .79, .83],
      knee: [.135, .44, .06], elbow: [.29, 1.07, -.04], out: [.075, .084], lid: [.040, 1.559, .074], earThin: [.079, .086], noseThin: [.111, .121], head: 1.38,
      hair: [1.50, 1.625, -.06, .07], fingerThin: .35 } };   // her data has no hair: a colour on the scalp above a hairline set by rule (from 1.50 m at the nape to 1.625 m over the brow).
  // fingerThin: the light through her fingers at about a third of his: the red that comes through skin, added to her darker tone, made the edges of her palms glow orange
  function skinZones(g, keepNormals, who) {
    const P = g.attributes.position, n = P.count, col = new Float32Array(n * 3), thin = new Float32Array(n), lids = new Float32Array(n), Z = ZONES[who] || ZONES.man;
    for (let i = 0; i < n; i++) {
      const x = Math.abs(P.getX(i)), y = P.getY(i), z = P.getZ(i);
      const face = sm(Z.face[0], Z.face[1], y) * sm(Z.face[2], Z.face[3], z) * (1 - sm(Z.face[4], Z.face[5], y));
      const cheek = blob(x, y, z, ...Z.cheek, .035), nose = blob(x, y, z, ...Z.nose, .026), ear = blob(x, y, z, ...Z.ear, .034);
      const hand = sm(Z.hand[0], Z.hand[1], x) * (1 - sm(Z.hand[2], Z.hand[3], y)), finger = hand * (1 - sm(Z.hand[4], Z.hand[5], y)), foot = 1 - sm(.06, .12, y);
      const knee = blob(x, y, z, ...Z.knee, .07), elbow = blob(x, y, z, ...Z.elbow, .06);
      const out = sm(Z.out[0], Z.out[1], x);   // the ear's own surface, not the side of the head behind it (the coarse ear has almost no shape to hold a colour)
      const lid = blob(x, y, z, ...Z.lid, .024);   // round the eyes: the face's flush is kept off the deep sockets, where it read as make-up
      const red = Math.min(1, (.35 * face + .55 * cheek + .5 * nose + .55 * ear * out + .45 * hand + .35 * finger + .45 * foot + .35 * knee + .3 * elbow) * (1 - .6 * lid));
      col[i * 3] = 1 + .02 * red; col[i * 3 + 1] = 1 - .09 * red; col[i * 3 + 2] = 1 - .1 * red;
      if (Z.hair) { const h = Z.hair[0] + (Z.hair[1] - Z.hair[0]) * sm(Z.hair[2], Z.hair[3], z), k = sm(h, h + .012, y) * .78; col[i * 3] *= 1 - k * .8; col[i * 3 + 1] *= 1 - k * .84; col[i * 3 + 2] *= 1 - k * .86; }
      thin[i] = Math.min(1, ear * sm(Z.earThin[0], Z.earThin[1], x) + finger * (Z.fingerThin ?? 1) + .6 * nose * sm(Z.noseThin[0], Z.noseThin[1], z));
      lids[i] = lid;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('bkThin', new THREE.BufferAttribute(thin, 1));
    /* The skin is 20,000 triangles about 1.6 cm across, and its normals turn sharply from one vertex to the next: lit by a low Sun the
       chest and belly showed as a mosaic of lighter and darker triangles. The normals (only they: the shape is the data's) are averaged
       with their neighbours' a few times, as a smoother surface through the same points would have them. */
    const N = g.attributes.normal, I = g.index && g.index.array;
    if (N && I && !keepNormals) {   // the detailed skin's normals are the full-resolution surface's
      let a = Float32Array.from(N.array); const b = new Float32Array(a.length);
      for (let r = 0; r < 3; r++) {
        b.set(a); for (let t = 0; t < I.length; t += 3) for (let e = 0; e < 3; e++) { const i = I[t + e] * 3, j = I[t + (e + 1) % 3] * 3; b[i] += a[j]; b[i + 1] += a[j + 1]; b[i + 2] += a[j + 2]; b[j] += a[i]; b[j + 1] += a[i + 1]; b[j + 2] += a[i + 2]; }
        for (let i = 0; i < b.length; i += 3) { const l = Math.hypot(b[i], b[i + 1], b[i + 2]) || 1, k = P.getY(i / 3) > Z.head ? .45 : 1;   // the head less: its nose and brows are most of the shape it has
          a[i] += (b[i] / l - a[i]) * k; a[i + 1] += (b[i + 1] / l - a[i + 1]) * k; a[i + 2] += (b[i + 2] / l - a[i + 2]) * k; const m = Math.hypot(a[i], a[i + 1], a[i + 2]) || 1; a[i] /= m; a[i + 1] /= m; a[i + 2] /= m; }
      }
      N.array.set(a); N.needsUpdate = true;
    }
    if (!N || !I) return;
    const cv = convexity(g); if (!keepNormals) for (let i = 0; i < n; i++) cv[i] = Math.min(cv[i], 1 - .9 * lids[i]);   // the coarse sockets have no lids to curve round
    g.setAttribute('bkConv', new THREE.BufferAttribute(cv, 1));
    g.setAttribute('bkNs', new THREE.BufferAttribute(keepNormals ? smoothN(g, .004) : Float32Array.from(N.array), 3));
  }
  /* How sharply the skin curves at each vertex, signed (1 where it curves round within 8 mm, 0 flat, below 0 hollow; from -3 to 3): the
     curvature along each edge, (n_i - n_j).(p_i - p_j) / |p_i - p_j|^2, averaged over the vertex's edges and then over its neighbours */
  function convexity(g) {
    const P = g.attributes.position.array, N = g.attributes.normal.array, I = g.index.array, n = P.length / 3, k = new Float32Array(n), c = new Float32Array(n);
    for (let t = 0; t < I.length; t += 3) for (let e = 0; e < 3; e++) {
      const i = I[t + e] * 3, j = I[t + (e + 1) % 3] * 3, dx = P[i] - P[j], dy = P[i + 1] - P[j + 1], dz = P[i + 2] - P[j + 2], l2 = dx * dx + dy * dy + dz * dz;
      if (l2 < 1e-12) continue; const kk = ((N[i] - N[j]) * dx + (N[i + 1] - N[j + 1]) * dy + (N[i + 2] - N[j + 2]) * dz) / l2;
      k[i / 3] += kk; c[i / 3]++; k[j / 3] += kk; c[j / 3]++;
    }
    let a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = Math.max(-3, Math.min(3, (c[i] ? k[i] / c[i] : 0) * .008));
    const M = g.attributes.bkMask && g.attributes.bkMask.array;   // the lids' margins are folded in by the model (a fold of no thickness): their curvature is not the skin's
    if (M) for (let i = 0; i < n; i++) if (M[i * 4 + 1] > 70) a[i] = Math.min(a[i], .3);
    for (let r = 0; r < 2; r++) { const b = Float32Array.from(a), w = Float32Array.from(c).fill(1);
      for (let t = 0; t < I.length; t += 3) for (let e = 0; e < 3; e++) { const i = I[t + e], j = I[t + (e + 1) % 3]; b[i] += a[j]; b[j] += a[i]; w[i]++; w[j]++; }
      for (let i = 0; i < n; i++) a[i] = b[i] / w[i]; }
    return a;
  }
  /* the normals averaged over a disc of radius R (only those that face the same way: the two sides of a lid's margin or an ear stay apart) */
  function smoothN(g, R) {
    const P = g.attributes.position.array, N = g.attributes.normal.array, n = P.length / 3, out = new Float32Array(n * 3), H = new Map();
    const cell = (x, y, z) => ((Math.floor(x / R) + 1024) * 2048 + Math.floor(y / R) + 1024) * 2048 + Math.floor(z / R) + 1024;
    for (let i = 0; i < n; i++) { const k = cell(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); let a = H.get(k); if (!a) H.set(k, a = []); a.push(i); }
    for (let i = 0; i < n; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], cx = Math.floor(x / R), cy = Math.floor(y / R), cz = Math.floor(z / R); let sx = 0, sy = 0, sz = 0;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const a = H.get(((cx + dx + 1024) * 2048 + cy + dy + 1024) * 2048 + cz + dz + 1024); if (!a) continue;
        for (const j of a) { const ex = P[j * 3] - x, ey = P[j * 3 + 1] - y, ez = P[j * 3 + 2] - z, d2 = ex * ex + ey * ey + ez * ez; if (d2 > R * R) continue;
          if (N[i * 3] * N[j * 3] + N[i * 3 + 1] * N[j * 3 + 1] + N[i * 3 + 2] * N[j * 3 + 2] <= 0) continue;
          const w = 1 - Math.sqrt(d2) / R; sx += N[j * 3] * w; sy += N[j * 3 + 1] * w; sz += N[j * 3 + 2] * w; }
      }
      const l = Math.hypot(sx, sy, sz) || 1; out[i * 3] = sx / l; out[i * 3 + 1] = sy / l; out[i * 3 + 2] = sz / l;
    }
    return out;
  }
  /* The light of the Sun on skin. Light goes a few millimetres into skin before it comes out again, red furthest, blue least; so the
     terminator, where the skin turns from the light, is soft, and a little red where the skin curves round within a centimetre or so
     (the nose, the ears, the fingers, the lips). Done as skin renderers do it from a normal averaged over 4 mm (bkNs): red is lit as
     that smoother surface would be, green half way, blue by the surface's own normal (the idea of pre-integrated skin shading, Penner
     and Borshukov 2011, GPU Pro 2), and a narrow red wrap only on convex skin. Where the skin is hollow (the sockets under the brows,
     the corners of the mouth) the light spreads too, but without the red: there a fixed red wrap had read as red-brown make-up.
     Light through the skin from behind (bkThinK) only where it is a few millimetres thick: the ears' rims, the webs between the fingers.
     Specular light stays the surface's own. */
  const FILLFN = `
/* Light reflected onto the skin by what is round it. Under a high Sun the hollows of a face (under the brows, under the nose and the
   chin) get no direct light; what lights them is the sunlit ground and the sunlit skin below them (the cheeks, the chest), which the
   sky's picture of the park, seen from a point in the open, does not hold. Taken as light from below: 30 % of the Sun's light on
   the ground reflected back up (sunlit skin, about 35 %, fills most of what a socket or the underside of the chin sees; grass, about
   20 %, the rest), seen by the share of the lower half of the sky the surface faces. */
vec3 bkFill( const in vec3 bkWN, const in vec3 bkAlb ) {
	vec3 bkSn = vec3( 0.0 );
	#if NUM_DIR_LIGHTS > 0
	bkSn = directionalLights[ 0 ].color * saturate( inverseTransformDirection( directionalLights[ 0 ].direction, viewMatrix ).y );
	#endif
	float bkDown = saturate( 0.5 - 0.5 * bkWN.y );
	return bkSn * bkAlb * 0.3 * bkDown;
}
`;
  const SKINLIGHT = `
varying vec3 vBkNs;
varying float vBkConv;
float bkThinK = 0.0;
vec3 bkSkinIrr( const in GeometricContext geometry, const in IncidentLight directLight ) {
	vec3 bkL = directLight.direction, bkN0 = geometry.normal, bkNsV = normalize( vBkNs );
	#ifdef DOUBLE_SIDED
	if ( uBkHD < 0.5 ) bkNsV *= ( gl_FrontFacing ? 1.0 : - 1.0 );
	#endif
	float bkCv = vBkConv, bkVx = saturate( bkCv ), bkHo = saturate( - bkCv );
	vec3 bkK = mix( vec3( 0.4, 0.28, 0.2 ), vec3( 0.8, 0.45, 0.3 ), bkVx ) * ( 1.0 - 0.4 * bkHo );
	vec3 bkD = vec3( dot( normalize( mix( bkN0, bkNsV, bkK.r ) ), bkL ), dot( normalize( mix( bkN0, bkNsV, bkK.g ) ), bkL ), dot( normalize( mix( bkN0, bkNsV, bkK.b ) ), bkL ) );
	/* how far round the turn the light spreads: the distance light travels under the skin (red about 4 mm, green 2, blue 1.5) times
	   how sharply the surface turns there (vBkConv: 1 at a radius of 8 mm); in a hollow, the same for every colour. The terminator is
	   then a soft step that wide, which keeps the light's total. */
	vec3 bkW = clamp( abs( bkCv ) * mix( vec3( 0.25 ), vec3( 0.5, 0.25, 0.19 ), step( 0.0, bkCv ) ), 0.02, 0.7 );
	vec3 bkI = mix( saturate( bkD ), ( bkD + bkW ) * ( bkD + bkW ) / ( 4.0 * bkW ), step( - bkW, bkD ) * step( bkD, bkW ) );
	bkI += saturate( - dot( bkN0, bkL ) ) * vec3( 0.42, 0.11, 0.04 ) * bkThinK;
	return bkI * directLight.color;
}
` + FILLFN;
  const SKINDIFF = ['reflectedLight.directDiffuse += ( 1.0 - clearcoatDHR ) * irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );',
    `{ vec3 bkIrr = bkSkinIrr( geometry, directLight );
	#ifndef PHYSICALLY_CORRECT_LIGHTS
		bkIrr *= PI;
	#endif
	reflectedLight.directDiffuse += ( 1.0 - clearcoatDHR ) * bkIrr * BRDF_Diffuse_Lambert( material.diffuseColor ); }`];
  B.skin = (m, g, who) => {
    if (!m || !m.isMeshStandardMaterial) return;
    skinZones(g, false, who);
    if (!g.attributes.bkMask) g.setAttribute('bkMask', new THREE.BufferAttribute(new Uint8Array(g.attributes.position.count * 4), 4, true));
    skinMat(m, who);
  };
  /* the skin's material (also the second one drawn while the coarse and the detailed skin cross over, hdUse). uBkFade: x 1 for the
     skin coming in, 2 for the one going out; y how far the change has gone. Each pixel is the one or the other (a fixed pattern of
     pixels hands over from one to the other), so nothing is blended or drawn twice. */
  /* Where the skin's colours by rule lie on each body (body metres; x is taken on either side): the lips' red (an ellipse round the mouth's
     middle, on the front of the face), the line where the lips meet, the brows, the areolae, the hairline, the ears and the sideburns.
     The man's were set on his skin; the woman's measured on hers (tools/anatomy/female: her mouth's middle at 1.4795 m, the front of
     her lips 10 to 11 cm in front of her midline plane; her lids close at about 1.5545 m, 3.6 cm either side of the midline). Her lids
     are closed in the data: the line where they meet carries a line of lashes. */
  const SKINRULE = {
    man: { lip: [1.5645, .022, .0085, .078, .086], part: .0012, brow: [.029, 1.6455, .021, .0034, .068, .076], ar: [.066, 1.287, .123, .006, .013],
      hair: [1.578, 1.702, -.10, .04], ear: [.074, 1.646, -.046], sb: [.052, .062, -.02, -.013, -.003, .004], lash: null },
    woman: { lip: [1.4795, .022, .011, .096, .103], part: .0012, brow: [.034, 1.578, .021, .0034, .084, .092], ar: [.108, 1.185, .1385, .009, .016],
      hair: [1.50, 1.625, -.06, .07], ear: [.085, 1.577, -.023], sb: [.063, .073, .003, .010, .020, .027], lash: [.036, 1.5545, .016, .0011, .084, .090] } };
  const gf = x => (Math.round(x * 1e5) / 1e5).toFixed(5);
  function skinMat(m, who) {
    const Fc = SKINRULE[who] || SKINRULE.man, L = Fc.lip, Bw = Fc.brow, A = Fc.ar, Hh = Fc.hair, E = Fc.ear, S = Fc.sb, W = Fc.lash;
    m.vertexColors = true;
    const hd = m.userData.bkHD = { value: 0 }, fade = m.userData.bkFade = { value: new THREE.Vector2(0, 0) };
    const sss = LOOK.part('sss'), tex = LOOK.part('tex');
    if (sss) { delete m.defines.LK_SSS; delete m.defines.LK_THIN; m.defines.BK_SKINLIGHT = '1'; m.defines.BK_FILL = '1'; }
    if (tex) m.defines.BK_RELIEF = '1';
    if (LOOK.part('hair')) m.defines.BK_HAIR = '1';   // ?look=2&lookoff=hair leaves the head bare
    m.extensions = Object.assign(m.extensions || {}, { derivatives: true });
    const pars = THREE.ShaderChunk.lights_physical_pars_fragment, ok = sss && pars.includes(SKINDIFF[0]);
    LOOK.patch(m, who === 'woman' ? 'bkskin_f' : 'bkskin', sh => {
      sh.uniforms.uBkHD = hd; sh.uniforms.uBkFade = fade;
      sh.vertexShader = 'attribute float bkThin;\nattribute float bkConv;\nattribute vec3 bkNs;\nattribute vec4 bkMask;\nvarying float vBkThin;\nvarying float vBkConv;\nvarying vec3 vBkNs;\nvarying vec3 vBkP;\nvarying vec4 vBkM;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvBkP = position; vBkThin = bkThin; vBkConv = bkConv; vBkNs = normalMatrix * bkNs; vBkM = bkMask;');
      let f = 'varying float vBkThin;\nvarying vec3 vBkP;\nvarying vec4 vBkM;\nuniform float uBkHD;\nuniform vec2 uBkFade;\nfloat bkHair = 0.0;\nfloat bkWet = 0.0;\nfloat bkLipK = 0.0;\n' + NOISE + sh.fragmentShader;
      if (ok) f = f.replace('#include <lights_physical_pars_fragment>', SKINLIGHT + pars.replace(SKINDIFF[0], SKINDIFF[1]));
      else f = f.replace('#include <aomap_fragment>', '#undef BK_FILL\n#include <aomap_fragment>');
      sh.fragmentShader = f
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
	if ( uBkFade.x > 0.5 ) { float bkDh = fract( sin( dot( floor( gl_FragCoord.xy ), vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); if ( ( bkDh < uBkFade.y ) == ( uBkFade.x > 1.5 ) ) discard; }`)
        .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
	#ifdef DOUBLE_SIDED
	if ( uBkHD > 0.5 && ! gl_FrontFacing ) normal = - normal;   // the detailed skin is the outer surface only: where its far side shows past an outline (a pixel at the edge of the jaw or a lid), it is shaded as the outside there, not lit from inside
	#endif`)
        .replace('#include <color_fragment>', `#include <color_fragment>
	bkThinK = vBkThin;
	{ vec3 bkQ = vec3( abs( vBkP.x ), vBkP.yz ); float bkDv = length( vViewPosition );
	  float bkM1 = bkN( vBkP * 40.0 ) - 0.5, bkM2 = bkN( vBkP * 230.0 + 7.0 ) - 0.5, bkNear = 1.0 - smoothstep( 0.5, 2.5, bkDv );
	  diffuseColor.rgb *= 1.0 + vec3( 0.07, -0.03, -0.05 ) * bkM1 + vec3( -0.05, -0.07, -0.06 ) * bkM2 * bkNear;   // blood over centimetres, pigment over millimetres
	  float bkLip = ( 1.0 - smoothstep( 0.55, 1.0, length( vec2( bkQ.x / ${gf(L[1])}, ( bkQ.y - ${gf(L[0])} ) / ${gf(L[2])} ) ) ) ) * smoothstep( ${gf(L[3])}, ${gf(L[4])}, bkQ.z );
	  bkLip = mix( bkLip, smoothstep( 0.1, 0.6, vBkM.r ), uBkHD );   // the detailed skin: the red of the lips where the atlas's lips are
	  bkLipK = bkLip * uBkHD;
	  diffuseColor.rgb *= mix( vec3( 1.0 ), mix( vec3( 0.93, 0.8, 0.8 ), vec3( 0.95, 0.76, 0.8 ), uBkHD ), bkLip );   // the red of the lips: blood seen through a thin, clear skin
	  bkWet = smoothstep( 0.3, 0.9, vBkM.g ) * uBkHD;   // the lids' margins, where skin turns into the wet lining of the lid
	  diffuseColor.rgb *= mix( vec3( 1.0 ), vec3( 0.98, 0.86, 0.85 ), bkWet );
	  { float bkLx = bkQ.x / ${gf(L[1])}, bkLine = ${gf(L[0])} - ${gf(Fc.part)} * bkLx * bkLx;   // where the lips meet: a thin shadow, the corners a little lower
	    float bkPart = exp( - pow( ( bkQ.y - bkLine ) / 0.0017, 2.0 ) ) * ( 1.0 - smoothstep( 0.45, 1.0, abs( bkLx ) ) ) * smoothstep( ${gf(L[3] - .004)}, ${gf(L[4] - .002)}, bkQ.z );
	    bkPart *= 1.0 - uBkHD;   // the detailed skin has the parting of the lips in its shape
	    diffuseColor.rgb *= ( 1.0 - 0.3 * bkPart ) * mix( 1.0, 0.93, bkLip * step( bkLine, bkQ.y ) * ( 1.0 - uBkHD ) ); }   // the upper lip, turned down from the light, a little darker
	  float bkAr = 1.0 - smoothstep( ${gf(A[3])}, ${gf(A[4])}, length( bkQ - vec3( ${gf(A[0])}, ${gf(A[1])}, ${gf(A[2])} ) ) );
	  diffuseColor.rgb *= mix( vec3( 1.0 ), vec3( 0.86, 0.76, 0.74 ), bkAr );${W ? `
	  { float bkEx = bkQ.x - ${gf(W[0])}, bkLs = exp( - pow( ( bkQ.y - ${gf(W[1])} + 2.0 * bkEx * bkEx ) / ${gf(W[3])}, 2.0 ) ) * ( 1.0 - smoothstep( 0.6, 1.0, abs( bkEx ) / ${gf(W[2])} ) ) * smoothstep( ${gf(W[4])}, ${gf(W[5])}, bkQ.z );
	    diffuseColor.rgb *= 1.0 - 0.55 * bkLs; }   // closed lids: where they meet, the line of the lashes` : ''}
	  #ifdef BK_HAIR
	  float bkHl = mix( ${gf(Hh[0])}, ${gf(Hh[1])}, smoothstep( ${gf(Hh[2])}, ${gf(Hh[3])}, bkQ.z ) ) + ( bkN( vBkP * 90.0 ) - 0.5 ) * 0.006;   // the hairline: the nape, over the ears, the forehead
	  bkHl -= 0.03 * smoothstep( ${gf(S[0])}, ${gf(S[1])}, bkQ.x ) * smoothstep( ${gf(S[2])}, ${gf(S[3])}, bkQ.z ) * ( 1.0 - smoothstep( ${gf(S[4])}, ${gf(S[5])}, bkQ.z ) );   // sideburns, in front of the ear, to about its middle
	  float bkEar = length( ( bkQ - vec3( ${gf(E[0])}, ${gf(E[1])}, ${gf(E[2])} ) ) / vec3( 0.03, 0.05, 0.034 ) );
	  float bkFe = ( bkQ.y - bkHl ) / 0.006 + ( bkN( vBkP * 1500.0 ) - 0.5 ) * 1.6;   // the edge thins out over about 5 mm, hair by hair rather than as a line
	  diffuseColor.rgb *= 1.0 - 0.12 * mix( smoothstep( -1.5, 0.5, bkFe ) * smoothstep( 0.95, 1.3, bkEar ), smoothstep( 0.1, 0.5, vBkM.a ) * step( 1.3, vBkP.y ), uBkHD );   // the scalp under thin hair is a little darker than the forehead
	  bkHair = smoothstep( -0.3, 1.0, bkFe ) * smoothstep( 0.95, 1.3, bkEar );
	  float bkDx = bkQ.x - ${gf(Bw[0])}, bkBrow = ( 1.0 - smoothstep( 0.5, 1.0, length( vec2( bkDx / ${gf(Bw[2])}, ( bkQ.y - ${gf(Bw[1])} + 9.0 * bkDx * bkDx ) / ( ${gf(Bw[3])} - 0.04 * max( bkDx, 0.0 ) ) ) ) ) ) * smoothstep( ${gf(Bw[4])}, ${gf(Bw[5])}, bkQ.z );   // tapering outward
	  bkHair = max( bkHair, 0.55 * bkBrow );
	  float bkStr = bkN( vec3( vBkP.x * 1400.0, vBkP.y * 300.0, vBkP.z * 1400.0 ) );
	  if ( uBkHD > 0.5 && vBkP.y > 1.3 ) {
		/* the detailed skin: hair where the atlas's hair of the head lies on the scalp, brows where its set of eyebrows is. The edges
		   thin out as hair does, in strands: noise long along the way hair grows (back and down from the hairline) and fine across it,
		   which a pixel never resolves into a speckle; further away it fades to the smooth edge */
		float bkFar = smoothstep( 0.35, 0.9, bkDv );
		float bkSn = ( bkN( vec3( vBkP.x * 1300.0, vBkP.y * 240.0, vBkP.z * 1300.0 ) ) - 0.5 ) * ( 1.0 - bkFar );   // the scalp's hair: down and back from the crown
		float bkSb = ( bkN( vec3( vBkP.x * 320.0, vBkP.y * 2600.0, vBkP.z * 1800.0 ) ) - 0.5 ) * ( 1.0 - bkFar );  // the brows' hairs lie out along the brow
		float bkBr = smoothstep( 0.12, 0.8, vBkM.b + bkSb * 0.3 ) * smoothstep( 0.06, 0.3, vBkM.b );   // no stray hairs past the brow's edge
		bkStr = mix( bkN( vec3( vBkP.x * 2600.0, vBkP.y * 300.0, vBkP.z * 700.0 ) ), bkN( vec3( vBkP.x * 320.0, vBkP.y * 2600.0, vBkP.z * 1800.0 ) ), bkBr );
		bkHair = max( smoothstep( 0.15, 0.9, vBkM.a + bkSn * 0.25 ) * smoothstep( 0.04, 0.25, vBkM.a ), 0.5 * bkBr * ( 0.75 + 0.5 * bkStr ) );
	  }
	  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.21, 0.15, 0.11 ) * ( 0.75 + 0.5 * bkStr ), bkHair );
	  #endif
	}`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix( mix( mix( roughnessFactor, 0.8, bkHair ), 0.3, bkWet ), 0.4, bkLipK );')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	#ifdef BK_RELIEF
	{ float bkDv = length( vViewPosition ), bkK = 1.0 - smoothstep( 0.25, 1.1, bkDv );   // fine relief: within about a metre
	  if ( bkK > 0.0 ) {
		float bkHt = ( bkN( vBkP * 700.0 ) * 0.6 + bkN( vBkP * 2100.0 + 3.0 ) * 0.4 ) * 6e-5 * bkK;
		vec3 bkSx = dFdx( -vViewPosition ), bkSy = dFdy( -vViewPosition ), bkR1 = cross( bkSy, normal ), bkR2 = cross( normal, bkSx );
		float bkDet = dot( bkSx, bkR1 ); vec3 bkGr = sign( bkDet ) * ( dFdx( bkHt ) * bkR1 + dFdy( bkHt ) * bkR2 );
		normal = normalize( abs( bkDet ) * normal - bkGr );
	  } }
	#endif`);
    });
  }
  /* each tick (applyMode): the colour code of the view, and the eyes, which show while the skin does */
  B.recolor = F => {
    const sys = ATLAS_MODE[F.mode] || null, n = F.pickables.length; if (F._bkSys === sys && F._bkN === n) return; F._bkSys = sys; F._bkN = n;
    for (const id in F.parts) { const { g, p } = F.parts[id], m = g.userData.main.material; if (m.color) m.color.setHex(sys && p.system === sys ? g.userData.atlas : realOf(p, F.who)); }
    const base = F.who === 'woman' ? BODY_F_NOTE + ' ' + BODY_F_NOTE_REAL + ' ' + BODY_BOTH_NOTE : (HD.near ? B.NOTE_HD : B.NOTE) + (FR.body_f ? ' ' + BODY_BOTH_NOTE : ''); F.note = sys ? base + ' ' + B.ATLAS_NOTE[sys] : base;
    const el = document.querySelector('#capNote'); if (el && typeof capFrame !== 'undefined' && capFrame === F && el.textContent !== F.note) el.textContent = F.note;
  };
  B.eyes = (F, focus) => {
    const sk = F.parts.skin; if (!sk) return; const so = sk.g.userData.op, lids = !focus && so >= .9 && sk.g.visible && !HD.near;   // the detailed skin has real lids
    if (HD.near) for (const id of ['eyeball_l', 'eyeball_r']) { const e = F.parts[id], c = e && e.g.userData.cornea; if (c) { const m = e.g.userData.main.material; B.ghost(c.material, 1, e.g.visible && !F.hidden.has(id) ? Math.min(1, m.transparent ? m.opacity : F.alpha) : 0); } }   // the cornea: as clear as the eye under it is solid
    { const nl = sk.g.userData.nails; if (nl && (HD.near || F.who === 'woman')) { const m = sk.g.userData.main.material; nl.visible = sk.g.visible && m.opacity > .02; nl.material.opacity = m.opacity; nl.material.depthWrite = m.depthWrite; } }   // the nails: as the skin is
    for (const id of ['eyeball_l', 'eyeball_r']) { const e = F.parts[id], c = e && e.g.userData.main.material.userData.bkCap; if (c) c.value.x = lids ? 1 : 0; }
    if (focus) return;
    for (const id of ['eyeball_l', 'eyeball_r']) {
      const e = F.parts[id]; if (!e || F.hidden.has(id) || so < .9) continue; const u = e.g.userData; if (u.op >= so) continue;
      u.op = so; const m = u.main.material; m.opacity = so * F.alpha; m.depthWrite = so > .9; B.ghost(m, 0, F.alpha);
      e.g.visible = so > .01; u.shown = so;
    }
  };
  /* The detailed skin and eyes (data/anatomy/skin_hd.bin, made by tools/anatomy/skin_hd.py from the atlas's own full-resolution files):
     the skin of BodyParts3D 4.0 as published (fingers apart, the ears), the head from the finer 3.0 release with its lids, nostrils and
     lip edges (fitted to the 4.0 head and eyes), and each eye as the atlas's sclera, iris, lens and a clear cornea. About 55,000 vertices
     and 108,000 triangles for the skin (the coarse one: 10,000 and 20,000), 1.5 MB. Fetched only under this look and only when the camera
     first comes within 4 m of the person (the start view is 7 m away and does not fetch it); then it replaces the coarse skin's geometry
     and the eyes' in the same parts, so picking, the peel, the layers and every part id stay as they were; further than 5 m the coarse
     ones are drawn again (hdUse). The coarse skin stays the person's stand-in in the park's shadow (B.shadow): the shadow on the lawn
     does not need the detail, and the skin does not take that shadow. `lookoff=hd` keeps the coarse skin. */
  const HD = { p: null, on: false, near: false, C: new V3(0, 1.1, 0) };
  B.hdOn = () => HD.near;
  B.hdWait = (ms = 30000) => new Promise(res => {   // for tests: resolves once the detailed skin is in (true), or when the camera is not near enough to want it
    const t0 = performance.now(), F = typeof FR !== 'undefined' && FR.body;
    const k = () => HD.on ? res(HD.near) : HD.p ? HD.p.then(() => res(HD.near), () => res(false)) : (!F || !F.C || (F.partsReady && F.C.distanceTo(HD.C) > 4) || performance.now() - t0 > ms) ? res(false) : setTimeout(k, 150);
    k();
  });
  function hdParse(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    if (String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== 'SKHD') throw new Error('skin_hd.bin: not a skin file');
    const hl = dv.getUint32(4, true), H = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + hl))); let o = 8 + hl;
    const al = () => { o = (o + 3) & ~3; }, G = {};
    for (const m of H.meshes) {
      const n = m.vertices, q = new Int16Array(buf, o, n * 3); o += n * 6; al();
      const on = new Int8Array(buf, o, n * 2); o += n * 2; al();
      const occ = new Uint8Array(buf, o, n).slice(); o += n; al();
      const mk = new Uint8Array(buf, o, n * 4).slice(); o += n * 4; al();
      const th = m.thick ? new Uint8Array(buf, o, n).slice() : null; if (th) { o += n; al(); }   // the thickness under each vertex, 0.1 mm
      const ni = m.triangles * 3, idx = m.index === 'u2' ? new Uint16Array(buf, o, ni).slice() : new Uint32Array(buf, o, ni).slice(); o += ni * (m.index === 'u2' ? 2 : 4); al();
      const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), sc = m.scale, of = m.offset;
      for (let i = 0; i < n; i++) {
        pos[i * 3] = q[i * 3] * sc[0] + of[0]; pos[i * 3 + 1] = q[i * 3 + 1] * sc[1] + of[1]; pos[i * 3 + 2] = q[i * 3 + 2] * sc[2] + of[2];
        let x = on[i * 2] / 127, y = on[i * 2 + 1] / 127; const z = 1 - Math.abs(x) - Math.abs(y);   // octahedral normals
        if (z < 0) { const ox = x; x = (1 - Math.abs(y)) * (ox >= 0 ? 1 : -1); y = (1 - Math.abs(ox)) * (y >= 0 ? 1 : -1); }
        const l = Math.hypot(x, y, z) || 1; nrm[i * 3] = x / l; nrm[i * 3 + 1] = y / l; nrm[i * 3 + 2] = z / l;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      g.setAttribute('bkOcc', new THREE.BufferAttribute(occ, 1, true)); g.setAttribute('bkMask', new THREE.BufferAttribute(mk, 4, true));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); g.computeBoundingBox();
      if (th) g.userData.thick = th;
      G[m.id] = g;
    }
    return { H, G };
  }
  B.hd = F => {
    if (F.who === 'woman') {   // the detailed skin is the man's (data/anatomy/skin_hd.bin); the woman's is drawn from her data's own skin.
      // Her fingernails (data/anatomy_f/nails.json, tools/anatomy/female/nails_f.py: by the man's rule), loaded when the camera is within 4 m
      if (F._nails || !F.partsReady || !F.parts.skin || !F.C || F.C.distanceTo(F.center || V3Z) > 4) return;
      F._nails = getJSON(F.anatDir + 'nails.json').then(d => {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(d.pos), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(d.normal), 3));
        g.setAttribute('bkMask', new THREE.BufferAttribute(new Float32Array(d.mask), 4)); g.setIndex(new THREE.BufferAttribute(new Uint32Array(d.idx), 1)); g.computeBoundingSphere();
        const sk = F.parts.skin; sk.g.userData.nails = nailMesh(sk, g);
      }).catch(e => console.warn('body: her nails did not load', e && e.message));
      return;
    }
    if (HD.fade && HD.fade.t0 >= 0) hdFade(F);
    if (HD.on && F.C) { const d = F.C.distanceTo(HD.C); if (HD.near ? d > 5 : d < 4) hdUse(F, !HD.near); return; }   // 4 m in, 5 m out: the park's views draw the coarse skin
    if (HD.p || !F.partsReady || !LOOK.part('hd') || !F.C || F.C.distanceTo(HD.C) > 4) return;
    HD.p = fetch(absURL('data/anatomy/skin_hd.bin')).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('skin_hd.bin ' + r.status)))
      .then(buf => { if (F.built) hdApply(F, hdParse(buf)); })
      .catch(e => { console.warn('body: the detailed skin did not load; the coarse one stays', e && e.message); });
    loadNote('the detailed skin', HD.p);
  };
  function hdApply(F, D) {
    const sk = F.parts.skin; if (!sk || HD.on) return;
    const u = sk.g.userData, g = D.G.skin; skinZones(g, true);
    /* light through the skin from behind: as much as comes through the tissue's thickness there (measured by rays, tools/anatomy):
       red light falls to about a third every 2.5 mm, so the rims of the ears and the webs of the fingers glow and a whole finger
       or the nose hardly at all */
    if (g.userData.thick) { const T = g.userData.thick, A = g.attributes.bkThin.array; for (let i = 0; i < A.length; i++) A[i] = Math.min(1, Math.exp(-(T[i] * 1e-4 - .002) / .0025)); g.attributes.bkThin.needsUpdate = true; }
    u.baseGeo = u.main.geometry; u.hdGeo = g;
    if (D.G.nails) u.nails = nailMesh(sk, D.G.nails);
    { const m0 = u.main.material, m2 = LOOK.material('skin', m0.color.getHex(), { double: true });   // the skin going out while the other comes in (hdUse)
      B.part(m2, sk.p); skinMat(m2); m2.userData.bkGhost.value = m0.userData.bkGhost.value; m2.userData.noHL = true;
      const fm = new THREE.Mesh(u.baseGeo, m2); fm.matrixAutoUpdate = false; fm.visible = false; fm.raycast = () => { }; fm.userData.noPick = true;
      sk.g.add(fm); HD.fade = { mesh: fm, t0: -1 }; }
    for (const sd of ['l', 'r']) {
      const e = F.parts['eyeball_' + sd], eg = D.G['eye_' + sd], E = D.H.eyes && D.H.eyes[sd]; if (!e || !eg || !E) continue;
      const eu = e.g.userData, em = eu.main.material;
      eu.baseGeo = eu.main.geometry; eu.hdGeo = eg;
      // the iris's radius: the furthest of its vertices from the eye's axis
      const P = eg.attributes.position, M = eg.attributes.bkMask, c = new V3(...E.pupil), z = new V3(...E.gaze).normalize(), v = new V3(); let R = 0;
      for (let i = 0; i < P.count; i++) if (Math.abs(M.getX(i) - .5) < .2) { v.fromBufferAttribute(P, i).sub(c); R = Math.max(R, v.addScaledVector(z, -v.dot(z)).length()); }
      if (em.userData.bkIris) { em.userData.bkIris.value.set(c.x, c.y, c.z, R || .0059); em.userData.bkGaze.value.set(z.x, z.y, z.z, 1); }
      const cm = corneaMat();
      const cn = new THREE.Mesh(D.G['cornea_' + sd], cm); cn.matrixAutoUpdate = false; cn.renderOrder = 4; cn.userData.pickRoot = e.g; cm.userData.noHL = true;
      e.g.add(cn); eu.cornea = cn;
    }
    HD.on = true; hdUse(F, true);
  }
  /* The cornea: clear, so what is seen of it is what it reflects, added to the iris and sclera seen through it: the sky and the Sun,
     mirrored by a surface as smooth as a wet cornea (roughness 0.03), at the strength of a clear surface of the cornea's refractive
     index (1.376: 2.5 % straight on, three fifths of the 4 % the standard material assumes, more towards grazing). The Sun's own
     reflection is the small bright catchlight; it shows where the Sun's mirror point on the cornea is not under a lid. */
  function corneaMat() {
    const cm = LOOK.material('eye', 0xffffff, { extra: { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } });
    cm.roughness = .03; cm.userData.noHL = true;
    const u = cm.userData.bkGhost = { value: new THREE.Vector2(1, 1) };
    LOOK.patch(cm, 'bkcornea', sh => {
      sh.uniforms.uBkGhost = u;
      sh.fragmentShader = 'uniform vec2 uBkGhost;\n' + sh.fragmentShader.replace(OUT, 'gl_FragColor = vec4( ( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) * 0.62 * uBkGhost.y, 1.0 );');
    });
    return cm;
  }
  /* The fingernails: a plate of its own on the back of each finger's end (tools/anatomy/skin_hd.py, nails and nail_plate: placed and
     sized by rule from the finger's own shape and published proportions; the atlas has none). Its mask: across it, along it from
     the fold, and the free edge. Drawn as the skin is (it goes when the skin is peeled, picks as the skin), with the pink of the bed
     seen through the clear plate, a paler half moon at the fold, a white free edge, and the shade of the folds it is tucked into. */
  function nailMesh(sk, g) {
    const sm0 = sk.g.userData.main.material, m = LOOK.material('horn', 0xffffff, { double: true, extra: { transparent: true } });
    m.roughness = .3; m.userData.noHL = true;
    B.part(m, { id: 'nails' }); m.userData.bkGhost.value = sm0.userData.bkGhost.value;   // the skin's peel, shared
    if (LOOK.part('sss')) m.defines.BK_FILL = '1';   // lit by what is round it, as the skin is
    LOOK.patch(m, 'bknail', sh => {
      sh.vertexShader = 'attribute vec4 bkMask;\nvarying vec4 vBkNm;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvBkNm = bkMask;');
      sh.fragmentShader = 'varying vec4 vBkNm;\n' + sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', '#include <lights_physical_pars_fragment>\n' + FILLFN).replace('#include <color_fragment>', `#include <color_fragment>
	{ float bkU = vBkNm.x * 2.0 - 1.0, bkT = vBkNm.y, bkFree = smoothstep( 0.2, 0.8, vBkNm.z );
	  float bkLun = 1.0 - smoothstep( -0.015, 0.015, bkT - 0.17 * sqrt( max( 1.0 - bkU * bkU, 0.0 ) ) );   // the half moon, just out from the fold
	  vec3 bkC = mix( vec3( 0.80, 0.58, 0.54 ), vec3( 0.85, 0.74, 0.70 ), bkLun * 0.7 );   // the bed's pink through the plate
	  bkC = mix( bkC, vec3( 0.90, 0.87, 0.81 ), bkFree );                                    // the free edge: the plate with no bed under it
	  bkC *= 1.0 - 0.22 * smoothstep( 0.75, 1.0, abs( bkU ) );                                  // shade where it goes into the lateral folds
	  bkC = mix( vec3( 0.62, 0.47, 0.41 ), bkC, smoothstep( 0.04, 0.13, bkT ) );                // where it comes out from under the fold of skin: the fold's shade
	  diffuseColor.rgb = bkC; }`);
    });
    const mesh = new THREE.Mesh(g, m); mesh.matrixAutoUpdate = false; mesh.userData.pickRoot = sk.g; mesh.renderOrder = 2.5; mesh.visible = false;
    sk.g.add(mesh); return mesh;
  }
  /* near (within 4 m, until 5 m): the detailed skin and eyes drawn; further out the coarse ones, as before it loaded (the start view is
     7 m away, where the coarse skin is more than fine enough, and the triangle budget of the park's views stays as it was) */
  function hdUse(F, near) {
    const sk0 = F.parts.skin, was = sk0 && sk0.g.userData.main.geometry;
    if (HD.fade && was && was !== (near ? sk0.g.userData.hdGeo : sk0.g.userData.baseGeo)) {   // cross over in half a second, not in one frame
      const fm = HD.fade.mesh, m0 = sk0.g.userData.main.material; fm.geometry = was; fm.material.userData.bkHD.value = was === sk0.g.userData.hdGeo ? 1 : 0;
      HD.fade.t0 = performance.now(); HD.fade.t = 0; m0.userData.bkFade.value.set(1, 0); fm.material.userData.bkFade.value.set(2, 0);
    }
    HD.near = near;
    const set = id => { const pt = F.parts[id]; if (!pt) return; const u = pt.g.userData; if (!u.hdGeo) return; const g = near ? u.hdGeo : u.baseGeo; u.main.geometry = g; if (u.ol) u.ol.geometry = g; if (u.cornea) u.cornea.visible = near; if (u.nails) u.nails.visible = near; };
    ['skin', 'eyeball_l', 'eyeball_r'].forEach(set);
    const sk = F.parts.skin, mu = sk && sk.g.userData.main.material.userData; if (mu && mu.bkHD) mu.bkHD.value = near ? 1 : 0;
    for (const sd of ['l', 'r']) { const e = F.parts['eyeball_' + sd], m = e && e.g.userData.main.material.userData; if (m && m.bkGaze) m.bkGaze.value.w = near ? 1 : 0; }
    F._bkN = -1; F._vs = null;
    if (typeof viewChanged === 'function') viewChanged();
  }
  function hdFade(F) {
    const sk = F.parts.skin, fm = HD.fade.mesh, m0 = sk.g.userData.main.material, m2 = fm.material, now = performance.now();
    const t = HD.fade.t = (HD.fade.t || 0) + Math.min(now - HD.fade.t0, 50) / 450; HD.fade.t0 = now;   // half a second, but never fewer than nine frames
    if (t >= 1 || !sk.g.visible) { HD.fade.t0 = -1; fm.visible = false; m0.userData.bkFade.value.set(0, 0); return; }
    m0.userData.bkFade.value.y = m2.userData.bkFade.value.y = t;
    m2.color.copy(m0.color); m2.opacity = m0.opacity; m2.transparent = m0.transparent; m2.blending = m0.blending; m2.depthWrite = m0.depthWrite;
    fm.matrix.copy(sk.g.userData.main.matrix); fm.renderOrder = sk.g.userData.main.renderOrder; fm.visible = true;
  }
  /* The person's shadow on the lawn. The foundation draws the skin's geometry into the park's shadow map as a stand-in (js/look.js,
     personProxy), so the shadow was a whole person even when the skin was a clear outline round a skeleton. Here the stand-in's
     geometry follows what is drawn solid: the skin while it is solid; otherwise every system that has a solid part (the bones in
     Skeleton; muscles and bones in Muscles). Built once per set of systems (one position buffer of all parts but the skin, an index
     per set) and only when the set changes; the map is then drawn again once (the same map the park would draw: its fit to the view
     is unchanged). Measured: no draw call in the picture; the shadow pass draws the bones' 0.2 million triangles instead of the
     skin's 20 thousand while the skeleton is shown. */
  const SHD = { proxy: null, skin: null, all: null, start: {}, sets: new Map(), sig: 'skin', t: 0, sun: null };
  B.shadow = F => {
    if (F.who === 'woman') return;   // the park's shadow proxy is the man's skin (js/look.js)
    const now = performance.now(); if (now - SHD.t < 250) return; SHD.t = now;
    const pk = typeof FR !== 'undefined' && FR.park, sk = F.parts.skin; if (!pk || !pk.built || !sk || !F.partsReady) return;
    const skG = sk.g.userData.baseGeo || sk.g.userData.main.geometry;   // the coarse skin stands in for the person in the park's shadow, also once the detailed one is drawn
    if (!SHD.proxy || !SHD.proxy.parent) {
      SHD.proxy = null; SHD.sig = 'skin'; SHD.sun = null;
      pk.root.traverse(o => { if (!SHD.proxy && o.isMesh && o.castShadow && o.geometry && o.geometry.attributes.position === skG.attributes.position) SHD.proxy = o; if (!SHD.sun && o.isDirectionalLight && o.castShadow) SHD.sun = o; });
      if (!SHD.proxy) return; SHD.skin = { pos: skG.attributes.position, idx: skG.index };
    }
    const solid = {};
    for (const id in F.parts) { const { g, p } = F.parts[id]; if (id !== 'skin' && g.visible && g.userData.op >= .5 && !F.hidden.has(id)) solid[sysOf(p)] = 1; }
    const sig = sk.g.visible && sk.g.userData.op >= .5 && !F.hidden.has('skin') ? 'skin' : Object.keys(solid).sort().join(',') || 'none';
    if (sig === SHD.sig) return; SHD.sig = sig;
    const G = SHD.proxy.geometry;
    if (sig === 'skin') { G.setAttribute('position', SHD.skin.pos); G.setIndex(SHD.skin.idx); }
    else {
      if (!SHD.all) {   // every part but the skin, in one buffer; per system, the indices into it
        let nv = 0; const ids = Object.keys(F.parts).filter(id => id !== 'skin'); ids.forEach(id => nv += F.parts[id].g.userData.main.geometry.attributes.position.count);
        const pos = new Float32Array(nv * 3), per = {}; let o = 0;
        ids.forEach(id => { const { g, p } = F.parts[id], gg = g.userData.main.geometry, a = gg.attributes.position, s = sysOf(p), ix = gg.index ? gg.index.array : null;
          pos.set(a.array.subarray(0, a.count * 3), o * 3); const L = per[s] || (per[s] = []);
          if (ix) for (let i = 0; i < ix.length; i++) L.push(ix[i] + o); else for (let i = 0; i < a.count; i++) L.push(i + o); o += a.count; });
        SHD.all = new THREE.BufferAttribute(pos, 3); SHD.per = per;
      }
      let idx = SHD.sets.get(sig);
      if (!idx) { const L = []; sig.split(',').forEach(s => { const a = SHD.per[s]; if (a) for (let i = 0; i < a.length; i++) L.push(a[i]); }); idx = new THREE.BufferAttribute(new Uint32Array(L.length ? L : [0, 0, 0]), 1); SHD.sets.set(sig, idx); }
      G.setAttribute('position', SHD.all); G.setIndex(idx);
    }
    if (SHD.sun && SHD.sun.shadow) SHD.sun.shadow.needsUpdate = true;
  };
  /* The tissue models (FT.tissue in js/nodes.js): a model on a bench in the studio rig, not an illustration on paper. No ink; colours
     closer to fresh, unstained tissue (still a code where tissue has none: nuclei are tinted so they can be seen); a striated muscle
     fibre's bands run across it, one dark A band and one light I band per sarcomere of 2.5 micrometres (the illustration's stripes ran
     along it). */
  const TISSUE_COL = { 0xd9737a: 0x8f3a35, 0xd96a6a: 0x93403a, 0xe08a8a: 0xb06a60, 0xd93030: 0xa8322c, 0xeee3c8: 0xd8ccb2, 0xe2d3ae: 0xcbbd9e,
    0xc0392b: 0x8a2a26, 0xcfe3ee: 0xd3dbd6, 0xdfeef6: 0xdde3e0, 0xf6e7a8: 0xe6cf98, 0xf2d36b: 0xe2d8c6, 0xf7e3a0: 0xeee4d0, 0x8fc0e8: 0xc9cfd6,
    0xf4b6c2: 0xd9a39c, 0xf0b98a: 0xe0a898, 0xb5584a: 0x8a3a2c, 0x3b6fd6: 0x5f4b6c, 0xf0c7a8: 0xd6a88c, 0x5b3a8c: 0x6a6380, 0xf4f0ff: 0xe8e2d8, 0xd6b8f0: 0xd9cfc0 };
  /* A stripe of the band texture is 2.5 micrometres; at the view's own distance that is two or three pixels, which made a moire like
     corduroy that would shimmer as the camera moves. Where a period is under about three to five pixels the stripes give way to their mean colour,
     and they come back as the camera comes closer. */
  const BAND_MEAN = 'vec3( 0.86, 0.83, 0.83 )';
  const bandFade = m => { m.extensions = Object.assign(m.extensions || {}, { derivatives: true });
    LOOK.patch(m, 'bkband', sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
	{ vec4 bkT = texture2D( map, vUv ); float bkW = fwidth( vUv.y );
	  diffuseColor *= vec4( mix( bkT.rgb, ${BAND_MEAN}, smoothstep( 0.2, 0.36, bkW ) ), bkT.a ); }
#endif`); }); };
  B.tissue = (F, K) => {
    F.env = Object.assign({}, F.env, { bg: B.BG });
    F.note = 'Model: built from measured cell sizes and lit as in a studio. Not a microscope image: under a microscope, tissue is a thin, flat, usually stained slice. The shapes and the arrangement of the cells are simplified, and nuclei are tinted so they can be seen; in life they are nearly colourless.';
    const ink = [], band = (K === 'skeletal' || K === 'cardiac') && canvasTex('bkband_' + K, 2, 16, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,20,25,.3)'; g.fillRect(0, 0, w, 10); }, { wrap: true });   // 10 of 16 rows: the A band is 1.6 of 2.5 micrometres
    F.root.traverse(o => {
      if (!o.isMesh || !o.material) return; const m = o.material;
      if (m.isShaderMaterial && m.uniforms && m.uniforms.uW) { ink.push(o); return; }
      if (!m.isMeshStandardMaterial) return;
      const h = m.color.getHex(); if (TISSUE_COL[h] !== undefined) m.color.setHex(TISSUE_COL[h]);
      if (m.map && band && o.geometry.parameters && o.geometry.parameters.height) { m.map = band; band.repeat.set(1, o.geometry.parameters.height / 2.5); if (!m.defines || !m.defines.LK_TRI) bandFade(m); m.needsUpdate = true; }
    });
    ink.forEach(o => o.parent.remove(o));   // no outlines (DESIGN 3.10): half the draw calls of the scene go with them
    /* Skeletal fibres: none passes through another (they were tilted at random by up to 1.4 degrees, enough for a 0.9 mm fibre to cut
       into its neighbour 4 micrometres away), and their nuclei lie where they are in life, just under the cell's membrane all round it,
       not buried at one depth where they showed as single pixels. */
    if (K === 'skeletal') {
      const hs = i => { const x = Math.sin(i * 91.7 + 7.3) * 43758.5453; return x - Math.floor(x); };
      F.pickables.forEach((g, i) => {
        const fm = g.userData.main; if (!fm || !fm.geometry.parameters || !fm.geometry.parameters.radiusTop) return; const R = fm.geometry.parameters.radiusTop;
        g.rotation.set(0, 0, 0); g.position.x = (hs(i) - .5) * 160; g.position.y += (hs(i + 40) - .5) * 2; g.position.z += (hs(i + 80) - .5) * 2;
        let k = 0; g.children.forEach(c => { const mm = c.userData && c.userData.main; if (!mm || mm === fm || !mm.geometry.parameters || mm.geometry.parameters.widthSegments !== 12) return;
          const a = hs(i * 13 + k) * 6.2832; c.position.set(c.position.x + (hs(i * 7 + k + 3) - .5) * 40, Math.cos(a) * (R - 1.1), Math.sin(a) * (R - 1.1)); c.rotation.set(a, 0, 0); k++; });
        g.updateMatrixWorld(true);
      });
    }
    /* A neutral ground the whole way: the tissue fades in over the body as the camera closes in, and until it was fully in, the body's own
       organ meshes, a thousand times too large, showed behind the fibres as faceted red shards (and the park's grass at the edge). A
       dark sphere round the model fades in with it; it is not picked. */
    const bd = new THREE.Mesh(new THREE.SphereGeometry(6000, 24, 12), new THREE.MeshBasicMaterial({ color: B.BG, side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    bd.renderOrder = -10; bd.userData.noPick = true; bd.onBeforeRender = () => { bd.material.opacity = Math.min(1, F.alpha * 2.5); }; F.add(bd);   // opaque well before the fibres are: the body behind is gone by the time they are half in
  };
  return B;
})();
