'use strict';
/* ===== LAB HOST: full-screen interactive labs that open over the world ===== */
const LAB_FILES = { circuit: 'js/labs/circuit.js', device: 'js/labs/device.js' };
const LAB_NAMES = { circuit: 'Circuit Lab', device: 'Semiconductor Device Lab', signal: 'Signal Lab', logic: 'Logic & CPU Lab', control: 'Control Lab', field: 'Field Lab', math: 'Math Lab', prob: 'Probability Lab', code: 'Code Lab', network: 'Network Lab' };
window.LABS = window.LABS || {};
let labInst = null;
function labAvailable(id) { return !!LAB_FILES[id]; }
function loadLabScript(id) {
  if (LABS[id]) return Promise.resolve(LABS[id]);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = LAB_FILES[id]; s.onload = () => LABS[id] ? res(LABS[id]) : rej(new Error('lab missing')); s.onerror = rej; document.head.appendChild(s); });
}
function openLab(id, preset, fromTitle) {
  if (!labAvailable(id)) { toast(`🧪 The ${LAB_NAMES[id] || id} is still being built.`); return; }
  let el = $('#lab'); if (!el) { el = document.createElement('div'); el.id = 'lab'; el.innerHTML = '<div class="labbar"><button id="labBack">← Back to the world</button><b id="labTitle"></b><span id="labFrom"></span></div><div id="labBody"></div>'; document.body.appendChild(el); $('#labBack').onclick = closeLab; }
  closeInfo(); el.classList.add('open'); $('#labTitle').textContent = LAB_NAMES[id] || id; $('#labFrom').textContent = fromTitle ? 'from: ' + fromTitle : '';
  const body = $('#labBody'); body.innerHTML = '<div class="labload">Loading lab…</div>';
  loadLabScript(id).then(L => { body.innerHTML = ''; if (labInst && labInst.close) labInst.close(); labInst = L.open(body, preset); }).catch(() => { body.innerHTML = '<div class="labload">Could not load this lab.</div>'; });
}
function closeLab() { const el = $('#lab'); if (el) el.classList.remove('open'); if (labInst && labInst.close) labInst.close(); labInst = null; const b = $('#labBody'); if (b) b.innerHTML = ''; canvas.focus(); }
addEventListener('keydown', e => { if (e.key === 'Escape' && $('#lab') && $('#lab').classList.contains('open')) closeLab(); });

/* ===== TRACKS: guided paths through the concept graph ===== */
let TRACKS = null;
function loadTracks() { if (!TRACKS) TRACKS = getJSON('data/tracks/manifest.json').then(fs => Promise.all(fs.map(f => getJSON('data/tracks/' + f)))).catch(() => []); return TRACKS; }
function openTracks() {
  let el = $('#tracks'); const was = el && el.classList.contains('open'); closePops(); if (el) el.classList.remove('open'); if (was) return;
  if (!el) { el = document.createElement('div'); el.id = 'tracks'; el.className = 'pop glass'; document.body.appendChild(el); }
  el.classList.add('open'); el.innerHTML = '<h3>Tracks</h3><div class="sub">Guided paths through a whole field, in the order ideas build on each other. Explore freely — nothing is graded.</div><div id="trList">Loading…</div>';
  Promise.all([loadTracks(), loadNodes()]).then(([ts]) => {
    const seenS = new Set(store.get('seen', []));
    $('#trList').innerHTML = ts.map((t, ti) => {
      const all = t.sections.flatMap(s => s.nodes), done = all.filter(id => seenS.has(id)).length;
      return `<details open><summary><b>${t.title}</b> <span class="mini">${done}/${all.length} visited</span></summary><div class="meter"><i style="width:${(done / Math.max(all.length, 1) * 100).toFixed(1)}%"></i></div>${t.description ? `<div class="sub">${t.description}</div>` : ''}${t.sections.map((s, si) => `<details><summary>${si + 1}. ${s.title} <span class="mini">(${s.nodes.length})</span></summary><div class="trn">${s.nodes.map(id => `<button class="trk${seenS.has(id) ? ' seen' : ''}" data-n="${id}">${NODE[id] ? NODE[id].title : id}${NODE[id] && NODE[id].lab && labAvailable(NODE[id].lab.id) ? ' <span class="lb">🧪</span>' : ''}</button>`).join('')}</div></details>`).join('')}</details>`;
    }).join('') || '<div class="sub">No tracks yet.</div>';
    el.querySelectorAll('.trk').forEach(b => b.onclick = () => { goToNode(b.dataset.n); b.classList.add('seen'); });
  });
}
