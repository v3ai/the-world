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
const CERT = { C1: ['Settled science', '#2f7d4f'], C2: ['Well supported', '#1e4e8f'], C3: ['Debated', '#b7791f'], C4: ['Speculative', '#9b2c4f'] };
function certBadge(c) { const x = CERT[c]; return x ? `<span class="cert" style="--c:${x[1]}" title="How certain science is (level ${c.slice(1)} of 4)"><i></i>${x[0]}</span>` : ''; }
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
function openPanel(h) { document.body.classList.add('cardOpen'); infoEl.innerHTML = `<button class="x" aria-label="Close">×</button>` + h; infoEl.classList.add('open'); infoEl.scrollTop = 0; infoEl.querySelector('.x').onclick = closeInfo; wireTabs(); }
function closeInfo() { infoEl.classList.remove('open'); document.body.classList.remove('cardOpen'); infoState = null; if (typeof FR !== 'undefined' && FR.body) FR.body.sel = null; }
function closePops() { ['#library', '#tourPop', '#tracks'].forEach(s => { const e = $(s); if (e) e.classList.remove('open'); }); document.body.classList.remove('trackOpen'); }
function scienceSection(simIds) {
  const nodes = []; simIds.forEach(s => (KN_BY_SIM[s] || []).forEach(n => { if (!nodes.includes(n)) nodes.push(n); }));
  if (!nodes.length) return '';
  return `<div class="refs"><div class="rh">The science behind this</div>${nodes.slice(0, 8).map(n => `<button class="kn" data-k="${n.id}">${certBadge(n.certainty)} ${n.title}</button>`).join('')}</div>`;
}
function wireKn() { infoEl.querySelectorAll('.kn').forEach(b => b.onclick = () => showNode(b.dataset.k)); }
// info for a picked object
function showInfoFor(h) {
  if (h.obj.userData.node && typeof NODE !== 'undefined' && NODE[h.obj.userData.node]) { showBodyNode(h.obj.userData.node, h); return; }
  const id = h.id, d = (h.obj.userData.infoFn && h.obj.userData.infoFn(h)) || h.obj.userData.info || INFO[id];
  if (!d) return;
  infoState = { h };
  const dp = DEEP[id] || d.deep || {};
  let basics = `<div class="body">${d.body || ''}</div>`;
  if (d.facts && d.facts.length) basics += '<dl>' + d.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('') + '</dl>';
  if (d.fun) basics += `<div class="fun"><b>Did you know?</b>${d.fun}</div>`;
  let html = `<div class="tag">${d.tag || ''}</div><h2>${d.title}</h2>` + layered([['Basics', basics], ['Deeper', dp.d ? `<div class="body"><p>${dp.d}</p></div>` : ''], ['Expert', dp.x ? `<div class="body expert"><p>${dp.x}</p></div>` : '']]);
  if (d.note) html += `<div class="note">${d.note}</div>`;
  html += `<div class="btnrow">${h.noZoom ? '' : '<button class="zoom" id="zoomBtn">Zoom in</button>'}${h.obj.userData.madeOf ? `<button class="zoom alt" id="madeBtn">See what it is made of</button>` : ''}</div>`;
  const simIds = [SIM_OF[id] || id].concat(h.obj.userData.sim || []);
  html += '<div id="sci"></div>';
  if (dp.r && dp.r.length) html += `<div class="refs"><div class="rh">Textbook sections</div>${dp.r.map(refChip).join('')}</div>`;
  openPanel(html);
  const zb0 = $('#zoomBtn'); if (zb0) zb0.onclick = () => zoomIntoHit(h);
  const mb = $('#madeBtn'); if (mb) mb.onclick = () => { closeInfo(); diveMaterial(h); };
  loadKnowledge().then(() => { const s = $('#sci'); if (s && infoState && infoState.h === h) { s.innerHTML = scienceSection(simIds); wireKn(); } });
  markSeen(id);
}
function showNode(id) {
  const n = KN_BY_ID[id]; if (!n) return;
  let basics = `<div class="body"><p>${n.basics || ''}</p></div>`;
  if (n.regime) basics += `<div class="regime"><b>Where it applies:</b> ${n.regime}</div>`;
  if (n.evidence && n.evidence.length) basics += `<div class="rh" style="margin-top:10px">Evidence</div><ul class="ev">${n.evidence.map(e => `<li>${e}</li>`).join('')}</ul>`;
  const dom = (n.domain || '').replace(/_/g, ' '); let h = `<div class="tag">${dom ? dom[0].toUpperCase() + dom.slice(1) : 'Topic'}${n.scale_m ? `, from ${fmtLen(n.scale_m[0])} to ${fmtLen(n.scale_m[1])}` : ''}</div><h2>${n.title}</h2>${certBadge(n.certainty)}<div class="vzh" id="vizHost"></div>`;
  h += layered([['Basics', basics], ['Deeper', n.deeper ? `<div class="body"><p>${n.deeper}</p></div>` : ''], ['Expert', n.expert ? `<div class="body expert"><p>${n.expert}</p></div>` : '']]);
  const link = (ids, label) => ids && ids.length ? `<div class="rh">${label}</div><div class="chips">${ids.filter(i => KN_BY_ID[i]).map(i => `<button class="kn chip" data-k="${i}">${KN_BY_ID[i].title}</button>`).join('')}</div>` : '';
  h += `<div class="refs">${link(n.emerges_from, 'Emerges from')}${link(n.explains, 'Explains')}</div>`;
  const fr = (n.frontier || []).map(f => `<li><b>${f.status || 'open'}</b> ${f.text}${f.as_of ? ` <i>(${f.as_of})</i>` : ''}</li>`).join('');
  const fr2 = (n.frontier_ref || []).map(k => FRONT[k]).filter(Boolean).map(f => `<li>${certBadge(f.certainty)} <b>${f.topic}</b>: ${f.claim} <i>(${f.status}, ${f.as_of})</i>${f.note ? ` — ${f.note}` : ''} ${(f.sources || []).slice(0, 2).map(s => `<a href="${s.url}" target="_blank" rel="noopener">source ↗</a>`).join(' ')}</li>`).join('');
  if (fr || fr2) h += `<div class="refs"><div class="rh">Open questions</div><ul class="ev">${fr}${fr2}</ul></div>`;
  if (n.refs && n.refs.length) h += `<div class="refs"><div class="rh">Read more</div>${n.refs.slice(0, 6).map(r => bookRef(r[0], r[1])).join('')}</div>`;
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
  if (typeof NODE !== 'undefined') { const ns = Object.values(NODE).filter(n => n.title.toLowerCase().includes(q)).slice(0, 10); if (ns.length) h += '<div class="jl">Explore</div>' + ns.map(n => `<button class="kn bn" data-n="${n.id}"><b>${n.title}</b><span>${n.kind} · ${n.summary || ''}</span></button>`).join(''); }
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
const RULER_MIN = -19, RULER_MAX = 27;
let LANDMARKS = []; // filled by world: {label, D, go()}
function rulerY(e, h) { return (1 - (e - RULER_MIN) / (RULER_MAX - RULER_MIN)) * h; }
function buildRuler() {
  const box = $('#rulerScale'); if (!box) return; const h = box.clientHeight || 600; box.innerHTML = '';
  let svg = `<svg viewBox="0 0 ${box.clientWidth || 184} ${h}" preserveAspectRatio="none">`;
  for (let e = RULER_MIN; e <= RULER_MAX; e++) {
    const y = rulerY(e, h), major = e % 3 === 0;
    svg += `<line class="tk" x1="0" x2="${major ? 14 : 9}" y1="${y}" y2="${y}"/>`;
    if (e < RULER_MAX) for (let k = 2; k <= 9; k++) { const yy = rulerY(e + Math.log10(k), h); svg += `<line class="tk mi" x1="0" x2="${k === 5 ? 6 : 4}" y1="${yy}" y2="${yy}"/>`; }
    if (major) svg += `<text class="ex" x="18" y="${y + 3.5}">10${sup(e)}</text>`;
  }
  // landmarks: place names at their true heights, nudged apart so none overlap
  const items = LANDMARKS.map(L => ({ L, y: rulerY(Math.log10(L.D), h) })).sort((a, b) => a.y - b.y);
  const gap = 15; for (let k = 1; k < items.length; k++) items[k].p = Math.max(items[k].y, (items[k - 1].p ?? items[k - 1].y) + gap); if (items.length) items[0].p = items[0].p ?? items[0].y;
  const over = (items.length ? items[items.length - 1].p : 0) - (h - 6); if (over > 0) for (let k = items.length - 1; k >= 0; k--) { items[k].p -= over; if (k && items[k - 1].p > items[k].p - gap) items[k - 1].p = items[k].p - gap; }
  items.forEach(it => { svg += `<path class="lead" d="M15 ${it.y} L48 ${it.y} L58 ${it.p}"/>`; });
  svg += '</svg>'; box.insertAdjacentHTML('beforeend', svg);
  items.forEach(it => { const b = document.createElement('button'); b.className = 'lm'; b.style.top = it.p + 'px'; b.textContent = it.L.label; b.title = `Fly to ${it.L.label} (${fmtLen(it.L.D)} across)`; b.onclick = () => { cancelTour(); it.L.go(); }; it.L._el = b; box.appendChild(b); });
  const m = document.createElement('i'); m.id = 'rulerMark'; m.innerHTML = '<span class="ro" id="rulerRO"></span>'; box.appendChild(m);
  if (!buildRuler._ro) { buildRuler._ro = new ResizeObserver(() => buildRuler()); buildRuler._ro.observe(box); }
}
function updateRuler() {
  const box = $('#rulerScale'), m = $('#rulerMark'); if (!box || !m) return;
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180), e = Math.log10(view), h = box.clientHeight;
  m.style.top = clamp(rulerY(e, h), 0, h) + 'px'; const ro = $('#rulerRO'); const t = fmtLen(view); if (ro.textContent !== t) ro.textContent = t;
  let best = null, bd = .35; LANDMARKS.forEach(L => { const d = Math.abs(Math.log10(L.D) - e); if (d < bd) { bd = d; best = L; } });
  LANDMARKS.forEach(L => L._el && L._el.classList.toggle('near', L === best));
}

/* ================= TOUR (continuous Powers-of-Ten flight) ================= */
/* A tour walks the spine of landmarks one stop at a time: fly there, pause on it so the caption can be read, go on.
   Escape, the Stop button, or any manual input (wheel, drag, keys, a ruler click) ends it. */
let tour = null;
const TOUR_PAUSE = 2600; // ms to rest at each stop
function tourBar() {
  let el = $('#tourBar');
  if (!el) { el = document.createElement('div'); el.id = 'tourBar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  return el;
}
function cancelTour() { if (!tour) return; tour = null; tourBar().classList.remove('on'); }
function startTour(dirIn) {
  const spine = LANDMARKS.filter(L => !L.side); // side branches (organs, the phone, the black hole) are ruler stops, not tour stops
  const list = dirIn ? spine.sort((a, b) => b.D - a.D) : spine.sort((a, b) => a.D - b.D);
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180);
  const rest = list.filter(L => dirIn ? L.D < view * .9 : L.D > view * 1.1);
  if (!rest.length) { message('Nothing further in that direction.'); return; }
  closeInfo(); closePops();
  tour = { list: rest, i: 0, dirIn };
  nextTour();
}
function nextTour() {
  const T = tour; if (!T) return;
  const L = T.list[T.i++], bar = tourBar();
  if (!L) { cancelTour(); message('End of the tour.'); return; }
  bar.innerHTML = `<span><b>${T.dirIn ? 'Tour in' : 'Tour out'}</b> · stop ${T.i} of ${T.list.length}: ${L.label}</span><button id="tourStop">Stop</button>`;
  bar.classList.add('on'); $('#tourStop').onclick = cancelTour;
  L.go(() => {
    if (tour !== T) return;
    bar.innerHTML = `<span><b>${T.dirIn ? 'Tour in' : 'Tour out'}</b> · stop ${T.i} of ${T.list.length}: <b>${L.label}</b>${T.i < T.list.length ? '' : ' (last stop)'}</span><button id="tourStop">Stop</button>`;
    $('#tourStop').onclick = cancelTour;
    setTimeout(() => { if (tour === T) nextTour(); }, TOUR_PAUSE);
  });
}

/* ================= CAPTION ================= */
let capFrame = null;
/* The name shown for a frame: never a raw id such as bp_GC. */
function humanName(f) {
  let n = f.name || '';
  if (!n || /^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$/.test(n)) {
    const k = (f.opts && (f.opts.mol || f.opts.node || f.opts.kind)) || n;
    const t = (f.info && f.info.title) || (typeof NODE !== 'undefined' && NODE[n] && NODE[n].title) || (typeof NODE !== 'undefined' && NODE[k] && NODE[k].title);
    n = t || String(n || k || f.type || 'Scene').replace(/_/g, ' ');
  }
  return n;
}
function updateCaption() {
  let f = active[active.length - 1];
  for (let i = active.length - 1; i >= 0; i--) if (active[i].alpha > .6) { f = active[i]; break; }
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180), e = Math.log10(view);
  const nm = humanName(f);
  if (f !== capFrame || $('#capN').textContent !== nm) {
    capFrame = f;
    $('#capN').textContent = nm;
    $('#capD').textContent = f.blurb || '';
    $('#capNote').textContent = f.note || '';
    updateControls(f);
  }
  const k = `Field of view ${fmtLen(view)}${f.timeNote ? `, ${f.timeNote}` : ''}`; if ($('#capK').textContent !== k) $('#capK').textContent = k;
}
function updateTimeUI() {
  const d = new Date(simTime);
  $('#timeT').textContent = `${d.getUTCDate()} ${d.toUTCString().slice(8, 11)} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
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
  for (const f of drawn) { f.ensure(); if (f.place) f.place(); }
  if (typeof bloom !== 'undefined' && bloom) bloom.strength = drawn.some(f => f.illo && f.alpha > .3 && cam.D < 6) ? .03 : .55;
  for (const f of drawn) { placeFrameCam(f); applyFade(f); if (f.update) f.update(dt, clock, f); }
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
