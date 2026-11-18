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
  return cands[0];
}

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
  if (!F.parts || !F.parts.femur_l) return null;
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
  for (const id in F.parts) {
    const part = F.parts[id], m = part.g.userData.main; m.updateWorldMatrix(true, false);
    const hit = raycaster.intersectObject(m, false)[0]; if (!hit) continue;
    rows.push({ id, name: part.p.name, dist: hit.distance, point: hit.point.clone().add(F.C), normal: hit.face ? hit.face.normal.clone() : null, hit });
  }
  rows.sort((a, b) => a.dist - b.dist);
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
  const where = S.region ? `<p class="where">You clicked your <b>${S.region.name}</b>.</p>` : '';
  return `<div class="core">${where}<div class="rh">Under this point, from the skin inward</div><ol>${li}${more}</ol><p class="cnote">Depths are on the model, an average adult: not a scan of you.</p></div>`;
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
