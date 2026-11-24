'use strict';
/* =====================================================================
   TWO BODIES: what the cards say about the man (FR.body) and the woman (FR.body_f), who are two models made in different ways.
   - "In this model" on the card of a body structure: where the shape of the part comes from in her model (each of her parts names
     its source in data/anatomy_f/index.json, src), and a button to see the same structure in the other body;
   - a structure the man's model has and the atlas made from her sections does not (index.json, absent; checked against both source
     files by tools/anatomy/female/build_f.py): "Not in her model", and a button to see it in the man.
   Uses goToNodeIn, bodyHas, bodyOfFrame and BODIES (js/nodes.js).
   ===================================================================== */
const BODY_SRC_LINE = {
  vhf: 'Shape: from her sections.',
  vhf_edited: 'Shape: from her sections, adjusted by the atlas makers.',
  vhf_atlas: 'Shape: from her sections, modelled with the guidance of oral anatomy atlases.',
  modelled: 'Shape: modelled to fit her body, not traced from her sections.',
  sculpted: 'Shape: a sculpted reference model drawn from anatomy atlases, placed in her body.',
  allen: 'Shape: another woman\'s brain (Allen human brain atlas), mirrored and resized to fit.',
};
const BODY_F_MUSCLES = 'Her model has only two kinds of muscle of her own: the rectus femoris at the front of each thigh, and the muscles that move her eyes. The atlas made from her sections has no other muscles.';
/* the parts of a body's index that show this card (detail parts too) */
function bodyPartsFor(b, id) { const ix = b && ANAT_SYNC_BY[b.anatDir || 'data/anatomy/']; return ix ? ix.parts.filter(p => nodeForMesh(p.id) === id) : []; }
/* is this card a part of the man's model that her atlas lacks? (the man's parts with this card, by base id, all in her index's absent list) */
function absentInHer(id) {
  const m = FR.body, f = FR.body_f, fx = f && ANAT_SYNC_BY[f.anatDir]; if (!m || !fx || !fx.absent) return false;
  const P = bodyPartsFor(m, id).filter(p => !p.parent); if (!P.length) return false;
  return P.every(p => fx.absent.includes(p.id.replace(/_(l|r)$/, '')));
}
CARD_HOOKS.push((id, h, n) => {
  if (typeof FR === 'undefined' || !FR.body_f || !FR.body || infoEl.querySelector('.bodyTwo')) return;
  const man = FR.body, her = FR.body_f;
  const hasM = bodyHas(man, id), hasF = bodyHas(her, id), lacksF = !hasF && absentInHer(id);
  if (!hasF && !lacksF) return;   // not a structure of either model (or one only he has that her atlas may hold under another name: say nothing)
  const ctx = (h && bodyOfFrame(h.frame)) || bodyFor(id);
  const box = document.createElement('div'); box.className = 'refs bodyTwo';
  let html = '<div class="rh">In this model</div>', btn = null;
  if (ctx === her && hasF) {
    const src = [...new Set(bodyPartsFor(her, id).map(p => p.src).filter(Boolean))];
    html += src.map(s => `<p class="cnote">${BODY_SRC_LINE[s] || ''}</p>`).join('');
    if (id === 'quadriceps') html += '<p class="cnote">Of the four muscles of the quadriceps, only the rectus femoris is in her model.</p>';
    if (hasM) btn = ['See it in the man', 'man'];
  } else if (ctx === her && lacksF) {
    html += `<p class="cnote">Not in her model: the atlas made from her sections has no ${String(n.title).toLowerCase().replace(/[&<>]/g, '')}.</p>`;
    btn = ['See it in the man', 'man'];
  } else if (ctx === man && hasF) {
    if (hasM) btn = ['See it in the woman', 'woman'];
    else return;
  } else if (ctx === man && lacksF) {
    html += '<p class="cnote">The woman\'s model does not have this part: the atlas made from her sections has none.</p>';
  } else return;
  if (btn) html += `<button class="chip nd" id="bodyTwoBtn">${btn[0]}</button>`;
  box.innerHTML = html;
  const after = infoEl.querySelector('.core') || infoEl.querySelector('h2');   // under the core sample of a click, else under the title
  if (after) after.insertAdjacentElement('afterend', box); else infoEl.appendChild(box);
  const b = box.querySelector('#bodyTwoBtn'); if (b) b.onclick = () => goToNodeIn(id, btn[1]);
});
