'use strict';
/* ================= KNOWLEDGE / LIBRARY DATA ================= */
let KN = null, FRONT = null, BOOKS = null, knLoading = null;
const KN_BY_SIM = {}, KN_BY_ID = {};
function loadKnowledge() {
  if (knLoading) return knLoading;
  knLoading = Promise.all([
    fetch('data/knowledge/nodes.json').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('data/knowledge/frontier.json').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('data/library/books.json').then(r => r.ok ? r.json() : []).catch(() => []),
  ]).then(([n, f, b]) => {
    KN = n || []; FRONT = {}; (f || []).forEach(x => FRONT[x.id] = x); BOOKS = b || [];
    KN.forEach(x => { KN_BY_ID[x.id] = x; (x.sim || []).forEach(s => (KN_BY_SIM[s] = KN_BY_SIM[s] || []).push(x)); });
  });
  return knLoading;
}
// map explorer object ids → knowledge-graph sim ids
const SIM_OF = {
  mito: 'mitochondrion', chloroplast: 'chloroplast', membrane: 'membrane', phospholipid: 'membrane', channel: 'membrane', ribosome: 'ribosome', er: 'er', golgi: 'golgi', lysosome: 'lysosome',
  nucleus: 'nucleus_cell', chromatin: 'chromatin', nucleosome: 'nucleosome', histone: 'nucleosome', dna: 'dna', base_A: 'dna', base_T: 'dna', base_G: 'dna', base_C: 'dna', hbond: 'dna', sugar: 'dna', phosphate: 'dna', unzip: 'dna',
  cell_animal: 'cell:animal', cell_plant: 'cell:plant', vacuole: 'cell:plant', cellwall: 'cell:plant', human: 'human', dog: 'dog', tree: 'tree', flower: 'flower', bee: 'bee', bird: 'bird', mushroom: 'mushroom', pond: 'pond', cloud: 'cloud', air: 'air', ground: 'soil',
  earth: 'planet:earth', ocean: 'planet:earth', land: 'planet:earth', ice: 'planet:earth', moon: 'moon', iss: 'planet:earth', crust: 'planet:earth', mantle: 'planet:earth', outercore: 'planet:earth', innercore: 'planet:earth', magnetosphere: 'planet:earth', aurora: 'planet:earth',
  sun: 'sun', sunSky: 'sun', mercury: 'planet:mercury', venus: 'planet:venus', earthPlanet: 'planet:earth', mars: 'planet:mars', jupiter: 'planet:jupiter', saturn: 'planet:saturn', uranus: 'planet:uranus', neptune: 'planet:neptune', pluto: 'dwarf:pluto', asteroids: 'asteroidbelt', kuiper: 'kuiper', kepler: 'solarsystem', solar: 'solarsystem',
  galaxy: 'milkyway', sunMarker: 'milkyway', sgrA: 'sgrA', bulge: 'milkyway', spiralArm: 'milkyway', globular: 'milkyway', lmc: 'localgroup', smc: 'localgroup', darkhalo: 'milkyway',
  blackhole: 'blackhole', horizon: 'blackhole', disk: 'blackhole', photonRing: 'blackhole', s2: 'sgrA', radii: 'blackhole', jets: 'blackhole', probe: 'blackhole',
  universe: 'cosmos', milkyway: 'milkyway', andromeda: 'localgroup', cluster: 'cosmos', filament: 'cosmos', galSpiral: 'galaxy', galElliptical: 'galaxy', galIrregular: 'galaxy', cmb: 'cmb', darkmatter: 'cosmos', expansion: 'cosmos',
  proton: 'proton', neutron: 'neutron', electron: 'electron', valence: 'electron', ecloud: 'orbital', orbital_s: 'orbital', orbital_p: 'orbital', orbital_d: 'orbital', config: 'atom', photon: 'photon', nucleusQ: 'nucleus', model_quantum: 'atom', model_bohr: 'atom', model_dalton: 'atom', model_thomson: 'atom',
  proton_inside: 'proton', quark_up: 'quark', quark_down: 'quark', gluon: 'gluon', seaquark: 'quark', colorcharge: 'quark', neutron_inside: 'neutron',
  bond_single: 'molecule', bond_double: 'molecule', polarity: 'molecule', delocalized: 'molecule',
};
const CERT = { C1: ['Settled', '#3ddc84'], C2: ['Well supported', '#6ee7ff'], C3: ['Debated', '#ffd166'], C4: ['Speculative', '#ff8fb1'] };
function certBadge(c) { const x = CERT[c]; return x ? `<span class="cert" style="--c:${x[1]}" title="Certainty ${c}">${c} · ${x[0]}</span>` : ''; }
function bookRef(code, sec) {
  if (!BOOKS) return '';
  const b = BOOKS.find(x => x.c === code); if (!b) return '';
  const ch = b.ch[parseInt(sec) - 1]; if (!ch) return '';
  const s = ch[2].find(x => x[0] === sec) || ch[2][0];
  return `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${s[2]}" target="_blank" rel="noopener"><b>${b.t} ${s[0] || 'Ch. ' + ch[0]}</b> ${s[1]}</a>`;
}

/* ================= INFO PANEL ================= */
const infoEl = $('#info');
let depthPref = store.get('depth', 0), infoState = null;
function refChip(code) {
  const r = REFS[code]; if (!r) return '';
  return `<a class="ref" href="https://openstax.org/books/${r[1]}/pages/${r[2]}" target="_blank" rel="noopener"><b>${BOOK_NAMES[r[0]]} ${r[3]}</b> ${r[4]}</a>`;
}
function layered(tabs) { // tabs: [[label, html], ...]
  const t = tabs.filter(x => x[1]); const di = Math.min(depthPref, t.length - 1);
  let h = t.length > 1 ? `<div class="tabs">${t.map((x, i) => `<button data-i="${i}" class="${i === di ? 'on' : ''}">${x[0]}</button>`).join('')}</div>` : '';
  t.forEach((x, i) => h += `<div class="lay" data-i="${i}"${i === di ? '' : ' hidden'}>${x[1]}</div>`);
  return h;
}
function wireTabs() {
  infoEl.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
    const i = +b.dataset.i; depthPref = i; store.set('depth', i);
    infoEl.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    infoEl.querySelectorAll('.lay').forEach(l => l.hidden = +l.dataset.i !== i);
  });
}
function openPanel(h) { infoEl.innerHTML = `<button class="x" aria-label="Close">✕</button>` + h; infoEl.classList.add('open'); infoEl.scrollTop = 0; infoEl.querySelector('.x').onclick = closeInfo; wireTabs(); }
function closeInfo() { infoEl.classList.remove('open'); infoState = null; }
function closePops() { ['#library', '#tourPop', '#tracks'].forEach(s => { const e = $(s); if (e) e.classList.remove('open'); }); document.body.classList.remove('trackOpen'); }
function scienceSection(simIds) {
  const nodes = []; simIds.forEach(s => (KN_BY_SIM[s] || []).forEach(n => { if (!nodes.includes(n)) nodes.push(n); }));
  if (!nodes.length) return '';
  return `<div class="refs"><div class="rh">🧭 The science behind this</div>${nodes.slice(0, 8).map(n => `<button class="kn" data-k="${n.id}">${certBadge(n.certainty)} ${n.title}</button>`).join('')}</div>`;
}
function wireKn() { infoEl.querySelectorAll('.kn').forEach(b => b.onclick = () => showNode(b.dataset.k)); }
// info for a picked object
function showInfoFor(h) {
  if (h.obj.userData.node && window.NODE && NODE[h.obj.userData.node]) { showBodyNode(h.obj.userData.node, h); return; }
  const id = h.id, d = (h.obj.userData.infoFn && h.obj.userData.infoFn(h)) || h.obj.userData.info || INFO[id];
  if (!d) return;
  infoState = { h };
  const dp = DEEP[id] || d.deep || {};
  let basics = `<div class="body">${d.body || ''}</div>`;
  if (d.facts && d.facts.length) basics += '<dl>' + d.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('') + '</dl>';
  if (d.fun) basics += `<div class="fun"><b>Did you know?</b>${d.fun}</div>`;
  let html = `<div class="tag">${d.tag || ''}</div><h2>${d.title}</h2>` + layered([['Basics', basics], ['Deeper', dp.d ? `<div class="body"><p>${dp.d}</p></div>` : ''], ['Expert', dp.x ? `<div class="body expert"><p>${dp.x}</p></div>` : '']]);
  if (d.note) html += `<div class="note">${d.note}</div>`;
  html += `<div class="btnrow"><button class="zoom" id="zoomBtn"><span>🔍 Zoom in</span><span>▸</span></button>${h.obj.userData.madeOf ? `<button class="zoom alt" id="madeBtn"><span>What is it made of?</span><span>▾</span></button>` : ''}</div>`;
  const simIds = [SIM_OF[id] || id].concat(h.obj.userData.sim || []);
  html += '<div id="sci"></div>';
  if (dp.r && dp.r.length) html += `<div class="refs"><div class="rh">📚 Textbook sections</div>${dp.r.map(refChip).join('')}</div>`;
  openPanel(html);
  $('#zoomBtn').onclick = () => zoomIntoHit(h);
  const mb = $('#madeBtn'); if (mb) mb.onclick = () => { closeInfo(); diveMaterial(h); };
  loadKnowledge().then(() => { const s = $('#sci'); if (s && infoState && infoState.h === h) { s.innerHTML = scienceSection(simIds); wireKn(); } });
  markSeen(id);
}
function showNode(id) {
  const n = KN_BY_ID[id]; if (!n) return;
  let basics = `<div class="body"><p>${n.basics || ''}</p></div>`;
  if (n.regime) basics += `<div class="regime"><b>Where it applies:</b> ${n.regime}</div>`;
  if (n.evidence && n.evidence.length) basics += `<div class="rh" style="margin-top:10px">Evidence</div><ul class="ev">${n.evidence.map(e => `<li>${e}</li>`).join('')}</ul>`;
  let h = `<div class="tag">Level ${n.level} · ${n.domain || ''} ${n.scale_m ? '· ' + fmtLen(n.scale_m[0]) + ' – ' + fmtLen(n.scale_m[1]) : ''}</div><h2>${n.title}</h2><div style="margin:-4px 0 10px">${certBadge(n.certainty)}</div><div class="vzh" id="vizHost"></div>`;
  h += layered([['Basics', basics], ['Deeper', n.deeper ? `<div class="body"><p>${n.deeper}</p></div>` : ''], ['Expert', n.expert ? `<div class="body expert"><p>${n.expert}</p></div>` : '']]);
  const link = (ids, label) => ids && ids.length ? `<div class="rh">${label}</div><div class="chips">${ids.filter(i => KN_BY_ID[i]).map(i => `<button class="kn chip" data-k="${i}">${KN_BY_ID[i].title}</button>`).join('')}</div>` : '';
  h += `<div class="refs">${link(n.emerges_from, '⬇ Emerges from (deeper layer)')}${link(n.explains, '⬆ Explains')}</div>`;
  const fr = (n.frontier || []).map(f => `<li><b>${f.status || 'open'}</b> ${f.text}${f.as_of ? ` <i>(${f.as_of})</i>` : ''}</li>`).join('');
  const fr2 = (n.frontier_ref || []).map(k => FRONT[k]).filter(Boolean).map(f => `<li>${certBadge(f.certainty)} <b>${f.topic}</b>: ${f.corrected || f.claim} <i>(${f.status}, ${f.as_of})</i>${f.note ? ` — ${f.note}` : ''} ${(f.sources || []).slice(0, 2).map(s => `<a href="${s.url}" target="_blank" rel="noopener">source ↗</a>`).join(' ')}</li>`).join('');
  if (fr || fr2) h += `<div class="refs"><div class="rh">🔭 Frontier — what's still open</div><ul class="ev">${fr}${fr2}</ul></div>`;
  if (n.refs && n.refs.length) h += `<div class="refs"><div class="rh">📚 Read more</div>${n.refs.slice(0, 6).map(r => bookRef(r[0], r[1])).join('')}</div>`;
  openPanel(h); if (window.mountViz) mountViz($('#vizHost'), id); wireKn();
}
const seen = new Set(store.get('seen', []));
function markSeen(id) { if (!seen.has(id)) { seen.add(id); store.set('seen', [...seen]); } }

/* ================= LIBRARY (all indexed books + knowledge graph) ================= */
const termShards = {};
function libSearch(q) {
  const box = $('#libRes'); q = (q || '').trim().toLowerCase();
  if (!q) {
    let h = '';
    if (KN && KN.length) {
      const levels = {}; KN.forEach(n => (levels[n.level] = levels[n.level] || []).push(n));
      h += `<div class="jl">Knowledge map · ${KN.length} topics</div>` + Object.keys(levels).sort((a, b) => (a === 'X') - (b === 'X') || +a - +b).map(l => `<details><summary>Level ${l} (${levels[l].length})</summary>${levels[l].map(n => `<button class="kn chip" data-k="${n.id}">${n.title}</button>`).join('')}</details>`).join('');
    }
    if (BOOKS && BOOKS.length) h += `<div class="jl">${BOOKS.length} textbooks</div>` + BOOKS.map(b => `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${b.ch[0][2][0][2]}" target="_blank" rel="noopener"><b>${b.t}</b> ${b.subject || ''}</a>`).join('');
    box.innerHTML = h || '<div class="sub">Loading…</div>'; wireLib(); return;
  }
  let h = '';
  if (window.NODE) { const ns = Object.values(NODE).filter(n => n.title.toLowerCase().includes(q)).slice(0, 10); if (ns.length) h += '<div class="jl">Explore</div>' + ns.map(n => `<button class="kn bn" data-n="${n.id}"><b>${n.title}</b><span>${n.kind} · ${n.summary || ''}</span></button>`).join(''); }
  if (KN) { const ks = KN.filter(n => n.title.toLowerCase().includes(q) || (n.basics || '').toLowerCase().includes(q)).slice(0, 8); if (ks.length) h += '<div class="jl">Knowledge map</div>' + ks.map(n => `<button class="kn simhit" data-k="${n.id}"><b>${n.title}</b><span>${n.certainty} · level ${n.level}</span></button>`).join(''); }
  const L = /[a-z]/.test(q[0]) ? q[0] : '0';
  const sh = termShards[L];
  if (!sh) { termShards[L] = 'loading'; fetch(`data/library/terms_${L}.json`).then(r => r.json()).then(j => { termShards[L] = j; libSearch($('#libQ').value); }).catch(() => { termShards[L] = []; }); h += '<div class="sub">Searching the textbooks…</div>'; }
  else if (sh !== 'loading' && BOOKS) {
    const terms = sh.filter(t => t[0].toLowerCase().startsWith(q)).concat(sh.filter(t => !t[0].toLowerCase().startsWith(q) && t[0].toLowerCase().includes(q))).slice(0, 30);
    if (terms.length) h += '<div class="jl">Key terms</div>' + terms.map(t => `<div class="term"><div class="tt">${t[0]}</div>${t[1].slice(0, 8).map(r => { const b = BOOKS[r[0]]; return b ? `<a class="mini" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${r[2]}" target="_blank" rel="noopener">${b.t} ${r[1]}</a>` : ''; }).join('')}</div>`).join('');
  }
  if (BOOKS) { const secs = []; for (const b of BOOKS) for (const c of b.ch) for (const s of c[2]) if (s[0] && s[1].toLowerCase().includes(q)) { secs.push([b, s]); if (secs.length >= 12) break; } if (secs.length) h += '<div class="jl">Sections</div>' + secs.map(([b, s]) => `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${s[2]}" target="_blank" rel="noopener"><b>${b.t} ${s[0]}</b> ${s[1]}</a>`).join(''); }
  box.innerHTML = h || '<div class="sub">No matches.</div>'; wireLib();
}
function wireLib() { $('#libRes').querySelectorAll('.kn').forEach(b => b.onclick = () => b.dataset.n ? (closePops(), goToNode(b.dataset.n)) : showNode(b.dataset.k)); }
function openLibrary() { const p = $('#library'); const o = !p.classList.contains('open'); closePops(); if (!o) return; p.classList.add('open'); $('#libQ').focus(); loadKnowledge().then(() => libSearch($('#libQ').value)); libSearch($('#libQ').value); }

/* ================= SCALE RULER ================= */
const RULER_MIN = -16, RULER_MAX = 27;
let LANDMARKS = []; // filled by world: {label, D, go()}
function buildRuler() {
  const r = $('#ruler'); r.innerHTML = '<div class="track"><i id="rulerMark"></i></div>';
  LANDMARKS.forEach(L => {
    const b = document.createElement('button'); b.className = 'lm';
    const e = Math.log10(L.D); b.style.top = (100 - (e - RULER_MIN) / (RULER_MAX - RULER_MIN) * 100) + '%';
    b.innerHTML = `<span class="ex">10${sup(Math.round(e))}</span><span class="nm">${L.label}</span>`; b.title = `Fly to: ${L.label}`;
    b.onclick = () => { tour = null; L.go(); };
    r.appendChild(b);
  });
}
function updateRuler() { const e = Math.log10(cam.D * 2 * Math.tan(25 * Math.PI / 180)); const m = $('#rulerMark'); if (m) m.style.top = clamp(100 - (e - RULER_MIN) / (RULER_MAX - RULER_MIN) * 100, 0, 100) + '%'; }

/* ================= TOUR (continuous Powers-of-Ten flight) ================= */
let tour = null;
function startTour(dirIn) {
  const list = dirIn ? LANDMARKS.slice().sort((a, b) => b.D - a.D) : LANDMARKS.slice().sort((a, b) => a.D - b.D);
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180);
  const rest = list.filter(L => dirIn ? L.D < view * .9 : L.D > view * 1.1);
  if (!rest.length) { message('Nothing further in that direction.'); return; }
  tour = { list: rest, i: 0 };
  nextTour();
}
function nextTour() { if (!tour) return; const L = tour.list[tour.i++]; if (!L) { tour = null; return; } L.go(() => setTimeout(nextTour, 900)); }

/* ================= CAPTION ================= */
let capFrame = null;
function updateCaption() {
  let f = active[active.length - 1];
  for (let i = active.length - 1; i >= 0; i--) if (active[i].alpha > .6) { f = active[i]; break; }
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180), e = Math.log10(view);
  if (f !== capFrame) {
    capFrame = f;
    $('#capN').textContent = f.name || '';
    $('#capD').textContent = f.blurb || '';
    $('#capNote').textContent = f.note || '';
    updateControls(f);
  }
  $('#capK').textContent = `10${sup(e.toFixed(1))} m · view ≈ ${fmtLen(view)}${f.timeNote ? ' · ' + f.timeNote : ''}`;
}
function updateTimeUI() {
  const d = new Date(simTime);
  $('#timeT').textContent = d.toUTCString().slice(5, 22) + ' UTC';
}

/* ================= MAIN LOOP ================= */
let lastT = performance.now(), hoverTick = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; clock += dt;
  simTime += dt * 1000 * timeSpeed;
  if (holdZoom) zoomBy(holdZoom * dt * 1.6, holdZoom < 0 ? W / 2 : undefined, H / 2);
  if (fly) stepFly(dt);
  applyZoom(dt);
  if (!pointers.size && !fly) levelUp(dt);
  orthoUp();
  reanchor();
  computeActive();
  for (const f of active) { f.ensure(); if (f.place) f.place(); }
  if (typeof bloom !== 'undefined' && bloom) bloom.strength = active.some(f => f.illo && f.alpha > .3 && cam.D < 6) ? .03 : .55;
  for (const f of active) { placeFrameCam(f); applyFade(f); if (f.update) f.update(dt, clock, f); }
  if (composer) composer.render(); else renderFrames(renderer);
  updateLabels(); updateCaption(); updateRuler();
  if ((hoverTick += dt) > .12 || mouse.dirty) { hoverTick = 0; doHover(); }
  if ((clock * 4 | 0) !== ((clock - dt) * 4 | 0)) updateTimeUI();
  const pe = $('#push'); if (now - msg.t < 2600 && msg.text) { $('#pushT').textContent = msg.text; pe.classList.add('show'); } else pe.classList.remove('show');
}
async function startApp() {
  ROOT = await buildWorld();
  setupComposer(); resize();
  buildRuler();
  bindHold($('#zin'), -1); bindHold($('#zout'), 1);
  $('#bLibrary').onclick = e => { e.stopPropagation(); openLibrary(); };
  $('#bTracks').onclick = e => { e.stopPropagation(); openTracks(); };
  $('#libQ').addEventListener('input', e => libSearch(e.target.value));
  $('#bLabels').classList.toggle('off', !labelsOn);
  $('#bLabels').onclick = () => { labelsOn = !labelsOn; store.set('labels', labelsOn); $('#bLabels').classList.toggle('off', !labelsOn); };
  $('#bHelp').onclick = () => $('#help').classList.remove('hide');
  $('#goBtn').onclick = () => { $('#help').classList.add('hide'); store.set('seenHelp', true); canvas.focus(); };
  $('#tourIn').onclick = () => startTour(true); $('#tourOut').onclick = () => startTour(false);
  const speeds = [[1, '1×'], [60, '1 min/s'], [3600, '1 h/s'], [86400, '1 day/s'], [86400 * 30, '1 month/s'], [0, '⏸']];
  let si = 0; $('#timeS').onclick = () => { si = (si + 1) % speeds.length; timeSpeed = speeds[si][0]; $('#timeS').textContent = speeds[si][1]; };
  $('#timeNow').onclick = () => { simTime = Date.now(); };
  if (store.get('seenHelp', false)) $('#help').classList.add('hide');
  startView();
  const fade = $('#fade'); fade.style.transition = 'opacity 1.2s'; requestAnimationFrame(() => fade.style.opacity = 0);
  loadKnowledge();
  requestAnimationFrame(loop);
}
