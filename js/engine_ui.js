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

/* ================= WHERE AM I: back, breadcrumbs =================
   navStack holds earlier states: {card, cam}. A state is pushed when a card opens (the card you leave) and when a flight
   starts (flyTo calls navFlyHook), so Back returns to the previous place and card. navQuiet is raised while Back itself acts. */
const navStack = []; let curCard = null, navQuiet = 0;
function camSnap() { return { A: cam.A, T: cam.T.clone(), D: cam.D }; }
function sameSnap(a, b) { return a && b && a.A === b.A && a.T.distanceTo(b.T) < a.D * .02 / a.A.unit && Math.abs(Math.log(a.D / b.D)) < .05; }
function navFlyHook() {
  if (navQuiet || (typeof tour !== 'undefined' && tour && tour.i > 1)) return; // a tour is one trip: only its first leg is remembered
  const e = { card: curCard, cam: camSnap() }, top = navStack[navStack.length - 1];
  if (top && top.card === e.card && sameSnap(top.cam, e.cam)) return;
  navStack.push(e); if (navStack.length > 60) navStack.shift(); navUpdate();
}
function navUpdate() { const b = $('#navBack'); if (b) b.disabled = !navStack.length; const c = $('#cardBack'); if (c) c.hidden = !navStack.length; }
function navBack() {
  const e = navStack.pop(); navUpdate(); if (!e) return;
  cancelTour(); navQuiet++;
  try {
    if (e.cam) flyTo(e.cam.A, e.cam.T, e.cam.D);
    if (e.card && e.card.reopen) e.card.reopen(); else closeInfo();
  } finally { navQuiet--; }
  navUpdate();
}
const CRUMB_NAME = { 'Observable universe': 'Universe', 'Human body': 'You', 'Greenwich, London': 'London' };
let crumbsAll = false;
function crumbGo(f) {
  cancelTour();
  const lms = LANDMARKS.filter(l => l.frame === f).sort((a, b) => b.D - a.D); // the widest landmark of that frame is its overview
  if (lms.length) { lms[0].go(); return; }
  const D = f.r1 !== Infinity ? f.r1 * .3 : f.radius * f.unit * .8;
  flyTo(f, f.center ? f.center.clone() : new V3(), Math.max(D, MIN_D * 10));
}
function updateCrumbs(cur) {
  const ol = $('#crumbList'); if (!ol) return;
  const chain = chainOf(cur).reverse(); // root ... current
  // the patch of skin (and the cell, DNA and atoms in it) sits on the person standing in the park: say so, and let "You" be a way out
  { const i = typeof FR !== 'undefined' && FR.skin ? chain.indexOf(FR.skin) : -1; if (i > 0 && FR.body && !chain.includes(FR.body)) chain.splice(i, 0, FR.body); }
  const short = f => { const n = CRUMB_NAME[humanName(f)] || humanName(f); return n.length > 26 ? n.slice(0, 25) + '…' : n; };
  let items = chain.map((f, i) => ({ f, last: i === chain.length - 1 }));
  let cut = 0; if (chain.length > 11 && !crumbsAll) { cut = chain.length - 7; items = [items[0], { more: cut - 1 }].concat(items.slice(cut)); }
  ol.innerHTML = items.map(it => it.more !== undefined ? `<li><button class="crumb more" title="Show the whole path">… ${it.more} more</button></li>` : `<li>${it.last ? `<span class="crumb cur" aria-current="location" title="${humanName(it.f)}">${short(it.f)}</span>` : `<button class="crumb" data-i="${chain.indexOf(it.f)}" title="Fly out to ${humanName(it.f)}">${short(it.f)}</button>`}</li>`).join('');
  ol.querySelectorAll('.crumb[data-i]').forEach(b => b.onclick = () => crumbGo(chain[+b.dataset.i]));
  const mo = ol.querySelector('.more'); if (mo) mo.onclick = () => { crumbsAll = true; updateCrumbs(cur); };
  ol.scrollLeft = ol.scrollWidth; ol.classList.toggle("clip", ol.scrollLeft > 2);
}

/* ================= ONE CARD =================
   Every thing you can click opens the same card, whichever data it comes from: a scene object (INFO), an explorable topic
   (NODE) or a knowledge-map topic (KN). The three code paths below only build a spec; cardHtml() draws it, so the header,
   the Basics / Deeper / Expert tabs and the sections always appear in the same order:
   header, figure, tabs, facts, actions, what it is made of, what it is part of, how it works, more, textbook sections,
   open questions, how certain science is. Spec keys: tag, title, figure, core, track, basics, deeper, expert, facts, note,
   buttons, after, madeLabel, made, partLabel, part, howLabel, how, more, books, open (html), cert (C1..C4), sci (true: fill
   "The science behind this" once the knowledge map has loaded). */
const infoEl = $('#info');
let depthPref = store.get('depth', 0), infoState = null;
const CERT_WORDS = { C1: 'Settled: checked in many independent ways and not in serious doubt.', C2: 'Well supported, and the details are still being refined.', C3: 'Debated: experts disagree about this.', C4: 'Speculative: a proposal that has not been tested yet.' };
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
function cardHtml(s) {
  const sec = (label, body) => body ? `<div class="refs"><div class="rh">${label}</div>${body}</div>` : '';
  let h = `<div class="cardhead"><button class="back" id="cardBack"${navStack.length ? '' : ' hidden'}>Back</button><div class="tag">${s.tag || ''}</div></div><h2>${s.title}</h2>`;
  h += (s.figure || '') + (s.core || '') + (s.track || '');
  h += layered([['Basics', s.basics ? `<div class="body">${s.basics}</div>` : ''], ['Deeper', s.deeper ? `<div class="body"><p>${s.deeper}</p></div>` : ''], ['Expert', s.expert ? `<div class="body expert"><p>${s.expert}</p></div>` : '']]);
  if (s.facts && s.facts.length) h += '<dl>' + s.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('') + '</dl>';
  if (s.note) h += `<div class="note">${s.note}</div>`;
  if (s.buttons) h += `<div class="btnrow">${s.buttons}</div>`;
  h += s.after || '';
  h += sec(s.madeLabel || 'What it is made of', s.made) + sec(s.partLabel || 'What it is part of', s.part) + sec(s.howLabel || 'How it works', s.how);
  h += s.more || '';
  h += sec('Textbook sections', s.books) + sec('Open questions', s.open);
  if (s.cert && CERT[s.cert]) h += sec('How certain is this?', `<div class="certrow">${certBadge(s.cert)}<span>${CERT_WORDS[s.cert]}</span></div>`);
  else if (s.sci) h += '<div id="sci"></div>';
  return h;
}
function chipsHtml(items) { return items.length ? `<div class="chips">${items.join('')}</div>` : ''; }
function openPanel(h, desc) {
  const key = desc && desc.key || '';
  if (!navQuiet && key && (!curCard || curCard.key !== key)) navStack.push({ card: curCard, cam: curCard ? curCard.cam : camSnap() }), navStack.length > 60 && navStack.shift();
  curCard = key ? { key, reopen: desc.reopen, cam: camSnap() } : null;
  document.body.classList.add('cardOpen'); infoEl.innerHTML = `<button class="x" aria-label="Close">×</button><div class="grab" role="button" tabindex="0" aria-label="Drag up to make this card taller, down to make it shorter"></div>` + h; infoEl.classList.remove('tall'); wireGrab(); infoEl.classList.add('open'); infoEl.scrollTop = 0; infoEl.querySelector('.x').onclick = closeInfo; wireTabs(); wireCardLinks(); navUpdate();
}
/* Phone: the card is a sheet that starts low (about a third of the screen, so what you tapped stays in view) and is dragged up for the rest. */
function wireGrab() {
  const g = infoEl.querySelector('.grab'); if (!g) return; let y0 = null, moved = false;
  g.onpointerdown = e => { y0 = e.clientY; moved = false; try { g.setPointerCapture(e.pointerId); } catch (_) { } };
  g.onpointermove = e => { if (y0 === null) return; const dy = e.clientY - y0; if (Math.abs(dy) > 24) { moved = true; infoEl.classList.toggle('tall', dy < 0); y0 = e.clientY; } };
  g.onpointerup = () => { if (y0 !== null && !moved) infoEl.classList.toggle('tall'); y0 = null; };
  g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); infoEl.classList.toggle('tall'); } };
}
function closeInfo() { infoEl.classList.remove('open'); document.body.classList.remove('cardOpen'); infoState = null; curCard = null; if (typeof FR !== 'undefined' && FR.body) { FR.body.sel = null; FR.body.reveal = null; } }
function closePops() { ['#library', '#tourPop', '#tracks'].forEach(s => { const e = $(s); if (e) e.classList.remove('open'); }); document.body.classList.remove('trackOpen'); }
function scienceSection(simIds) {
  const nodes = []; simIds.forEach(s => (KN_BY_SIM[s] || []).forEach(n => { if (!nodes.includes(n)) nodes.push(n); }));
  if (!nodes.length) return '';
  return `<div class="refs"><div class="rh">The science behind this, and how certain it is</div>${nodes.slice(0, 8).map(n => `<button class="kn" data-k="${n.id}">${certBadge(n.certainty)} ${n.title}</button>`).join('')}</div>`;
}
function wireKn() { infoEl.querySelectorAll('.kn').forEach(b => b.onclick = () => showNode(b.dataset.k)); }
// links shared by every card: topics (.nd), knowledge-map topics (.kn), processes (.pr), back
function wireCardLinks() {
  wireKn();
  infoEl.querySelectorAll('.nd').forEach(b => b.onclick = () => (TEAR[b.dataset.n] ? goToNode(b.dataset.n) : focusNode(b.dataset.n)));
  infoEl.querySelectorAll('.pr').forEach(b => b.onclick = () => startProcess(b.dataset.p));
  const bk = $('#cardBack'); if (bk) bk.onclick = navBack;
}
/* the card for an object that has an id but no card data: say so, never stay silent */
const NO_CARD = new Set();
function humanId(id) { return String(id || '').replace(/^(el|mol|model|node)_/, '').replace(/[_:]+/g, ' ').replace(/^./, c => c.toUpperCase()); }
function cardDataFor(h) {
  const ud = h.obj.userData, id = h.id;
  return (ud.infoFn && ud.infoFn(h)) || ud.info || (id && INFO[id]) || null;
}
function hasCard(obj, id) {
  const ud = obj.userData || {};
  return !!(ud.infoFn || ud.info || (ud.node && typeof NODE !== 'undefined' && NODE[ud.node]) || (id && (INFO[id] || (typeof NODE !== 'undefined' && NODE[id]))));
}
// info for a picked object
function showInfoFor(h) {
  const ud = h.obj.userData;
  if (ud.node && typeof NODE !== 'undefined' && NODE[ud.node]) { showBodyNode(ud.node, h); return; }
  const id = h.id;
  let d = cardDataFor(h);
  if (!d && id && typeof NODE !== 'undefined' && NODE[id]) { showBodyNode(id, h); return; }
  if (!d) {
    const nm = ud.title || h.obj.name || humanId(id) || 'This object';
    if (!NO_CARD.has(id || nm)) { NO_CARD.add(id || nm); console.warn('No card for pickable id', id, 'in frame', h.frame && h.frame.name); }
    d = { title: nm, tag: '', body: '<p>No description has been written for this yet.</p>' };
  }
  infoState = { h };
  const dp = DEEP[id] || d.deep || {};
  const simIds = [SIM_OF[id] || id].concat(ud.sim || []);
  const spec = {
    tag: d.tag || '', title: d.title, basics: (d.body || '') + (d.fun ? `<div class="fun"><b>Did you know?</b>${d.fun}</div>` : ''), deeper: dp.d, expert: dp.x, facts: d.facts, note: d.note, sci: true,
    buttons: (h.noZoom ? '' : '<button class="zoom" id="zoomBtn">Zoom in</button>') + (ud.madeOf ? `<button class="zoom alt" id="madeBtn">See what it is made of</button>` : '') + (h.elSym ? `<button class="zoom" id="atomBtn">Fly to ${(ELJ[h.elSym] || {}).name || h.elSym} atoms</button>` : ''),
    books: dp.r && dp.r.length ? dp.r.map(refChip).join('') : '',
  };
  openPanel(cardHtml(spec), { key: 'info:' + (id || d.title), reopen: () => showInfoFor(h) });
  const zb0 = $('#zoomBtn'); if (zb0) zb0.onclick = () => zoomIntoHit(h);
  const mb = $('#madeBtn'); if (mb) mb.onclick = () => { closeInfo(); diveMaterial(h); };
  const ab = $('#atomBtn'); if (ab) ab.onclick = () => flyToElement(h.elSym);
  loadKnowledge().then(() => { const s = $('#sci'); if (s && infoState && infoState.h === h) { s.outerHTML = scienceSection(simIds) || ''; wireKn(); } });
  if (id) markSeen(id);
}
function showNode(id) {
  const n = KN_BY_ID[id]; if (!n) return;
  let basics = `<p>${n.basics || ''}</p>`;
  if (n.regime) basics += `<div class="regime"><b>Where it applies:</b> ${n.regime}</div>`;
  if (n.evidence && n.evidence.length) basics += `<div class="rh" style="margin-top:10px">Evidence</div><ul class="ev">${n.evidence.map(e => `<li>${e}</li>`).join('')}</ul>`;
  const dom = (n.domain || '').replace(/_/g, ' ');
  const link = ids => chipsHtml((ids || []).filter(i => KN_BY_ID[i]).map(i => `<button class="kn chip" data-k="${i}">${KN_BY_ID[i].title}</button>`));
  const fr = (n.frontier || []).map(f => `<li><b>${f.status || 'open'}</b> ${f.text}${f.as_of ? ` <i>(${f.as_of})</i>` : ''}</li>`).join('');
  const fr2 = (n.frontier_ref || []).map(k => FRONT[k]).filter(Boolean).map(f => `<li>${certBadge(f.certainty)} <b>${f.topic}</b>: ${f.claim} <i>(as of ${f.as_of})</i>${f.note ? ` ${f.note}` : ''} ${(f.sources || []).slice(0, 2).map(s => `<a href="${s.url}" target="_blank" rel="noopener">source ↗</a>`).join(' ')}</li>`).join('');
  const spec = {
    tag: `${dom ? dom[0].toUpperCase() + dom.slice(1) : 'Topic'}${n.scale_m ? `, from ${fmtLen(n.scale_m[0])} to ${fmtLen(n.scale_m[1])}` : ''}`, title: n.title,
    figure: '<div class="vzh" id="vizHost"></div>', basics, deeper: n.deeper, expert: n.expert,
    madeLabel: 'What it emerges from', made: link(n.emerges_from), howLabel: 'What it explains', how: link(n.explains),
    books: n.refs && n.refs.length ? n.refs.slice(0, 6).map(r => bookRef(r[0], r[1])).join('') : '',
    open: fr || fr2 ? `<ul class="ev">${fr}${fr2}</ul>` : '', cert: n.certainty,
  };
  infoState = { kn: id };
  openPanel(cardHtml(spec), { key: 'kn:' + id, reopen: () => showNode(id) }); if (window.mountViz) mountViz($('#vizHost'), id);
}
const seen = new Set(store.get('seen', []));
function markSeen(id) { if (!seen.has(id)) { seen.add(id); store.set('seen', [...seen]); } if (typeof trackProgress === 'function') trackProgress(); }

/* ================= LIBRARY (all indexed books + knowledge graph) ================= */
const termShards = {};
function libSearch(q) {
  const box = $('#libRes'); q = foldText((q || '').trim());
  if (!q) {
    let h = '';
    if (KN && KN.length) {
      const levels = {}; KN.forEach(n => (levels[n.level] = levels[n.level] || []).push(n));
      h += `<div class="jl">Knowledge map · ${KN.length} topics</div>` + Object.keys(levels).sort((a, b) => (a === 'X') - (b === 'X') || +a - +b).map(l => `<details><summary>${levelName(l)} (${levels[l].length})</summary>${levels[l].map(n => `<button class="kn chip" data-k="${n.id}">${n.title}</button>`).join('')}</details>`).join('');
    }
    if (LANDMARKS.length) h += `<div class="jl">Places on the scale</div><details><summary>${LANDMARKS.length} places, from a proton to the observable universe</summary>${LANDMARKS.slice().sort((a, b) => a.D - b.D).map(L => `<button class="kn chip" data-lm="${LANDMARKS.indexOf(L)}">${L.label}</button>`).join('')}</details>`;
    if (BOOKS && BOOKS.length) h += `<div class="jl">${BOOKS.length} textbooks</div>` + BOOKS.map(b => `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${b.ch[0][2][0][2]}" target="_blank" rel="noopener"><b>${b.t}</b> ${b.subject || ''}</a>`).join('');
    box.innerHTML = h || '<div class="sub">Loading…</div>'; wireLib(); return;
  }
  let h = '';
  const goHits = searchGoHits(q);
  if (goHits.length) h += '<div class="jl">Take me there</div>' + goHits.map((r, i) => `<button class="kn gohit" data-g="${i}"><b>${r.title}</b><span>${r.sub || ''}</span></button>`).join('');
  libGo = goHits;
  if (KN) { const wre = q.length > 2 ? new RegExp('\\b' + q.replace(/[^a-z0-9 ]/g, '') + '\\b') : null, ti = KN.filter(n => foldText(n.title).includes(q)).map((n, i) => [matchRank(n.title, q), i, n]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]), ks = ti.concat(wre && ti.length < 4 ? KN.filter(n => !ti.includes(n) && wre.test(foldText(n.basics || ''))) : []).slice(0, 8); if (ks.length) h += '<div class="jl">Knowledge map</div>' + ks.map(n => `<button class="kn simhit" data-k="${n.id}"><b>${n.title}</b><span>${n.certainty} · ${levelName(n.level)}</span></button>`).join(''); }
  const L = /[a-z]/.test(q[0]) ? q[0] : '0';
  const sh = termShards[L];
  if (!sh) { termShards[L] = 'loading'; fetch(`data/library/terms_${L}.json`).then(r => r.json()).then(j => { termShards[L] = j; libSearch($('#libQ').value); }).catch(() => { termShards[L] = []; }); h += '<div class="sub">Searching the textbooks…</div>'; }
  else if (sh !== 'loading' && BOOKS) {
    const terms = sh.filter(t => t[0].toLowerCase().startsWith(q)).concat(sh.filter(t => !t[0].toLowerCase().startsWith(q) && t[0].toLowerCase().includes(q))).slice(0, 30);
    if (terms.length) h += '<div class="jl">Key terms</div>' + terms.map(t => `<div class="term"><div class="tt">${t[0]}</div>${t[1].slice(0, 8).map(r => { const b = BOOKS[r[0]]; return b ? `<a class="mini" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${r[2]}" target="_blank" rel="noopener">${b.t} ${r[1]}</a>` : ''; }).join('')}</div>`).join('');
  }
  if (BOOKS) { const secs = []; for (const b of BOOKS) for (const c of b.ch) for (const s of c[2]) if (s[0] && s[1].toLowerCase().includes(q)) { secs.push([b, s]); if (secs.length >= 12) break; } if (secs.length) h += '<div class="jl">Sections</div>' + secs.map(([b, s]) => `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${s[2]}" target="_blank" rel="noopener"><b>${b.t} ${s[0]}</b> ${s[1]}</a>`).join(''); }
  if (!h) { h = noMatchHtml(q); }
  box.innerHTML = h; wireLib();
}
/* Nothing matched: say so, and offer the nearest topics: the longer words of the query searched one by one, then a few places to start. */
const STOPWORDS = new Set('a an the of is are was were why how what when where who which does do did can could would should work works about and or to in on for with it its this that from into like make made'.split(' '));
function noMatchHtml(q) {
  const words = q.split(/[^a-z0-9α-ω]+/).filter(w => w.length > 2 && !STOPWORDS.has(w)), sug = [], seenT = new Set();
  words.forEach(w => { const gh = searchGoHits(w).slice(0, 3); gh.forEach(r => { if (!seenT.has(r.title)) { seenT.add(r.title); sug.push({ r }); } });
    if (KN) KN.filter(n => n.title.toLowerCase().includes(w)).slice(0, 2).forEach(n => { if (!seenT.has(n.title)) { seenT.add(n.title); sug.push({ k: n }); } }); });
  libGo = sug.filter(x => x.r).map(x => x.r); let gi = 0;
  const btns = sug.slice(0, 8).map(x => x.r ? `<button class="kn gohit" data-g="${gi++}"><b>${x.r.title}</b><span>${x.r.sub || ''}</span></button>` : `<button class="kn simhit" data-k="${x.k.id}"><b>${x.k.title}</b><span>${x.k.certainty} · ${levelName(x.k.level)}</span></button>`).join('');
  if (btns) return `<div class="sub">Nothing is called "${q.replace(/[<>&]/g, '')}". The closest topics to the words in it:</div>${btns}`;
  const start = ['Heart', 'DNA', 'Gold', 'Saturn', 'The Sun', 'Proton', 'Caffeine', 'Black hole'].map(t => `<button class="chip" data-q="${t}">${t}</button>`).join('');
  return `<div class="sub">Nothing is called "${q.replace(/[<>&]/g, '')}". Search works on names (a body part, an element or its symbol, a molecule, a planet, a place on the scale), so try one word, for example:</div><div class="chips">${start}</div>`;
}
function wireLib() { $('#libRes').querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { const L = LANDMARKS[+b.dataset.lm]; if (L) { cancelTour(); closePops(); L.go(); canvas.focus(); } }); $('#libRes').querySelectorAll('.chip[data-q]').forEach(b => b.onclick = () => { $('#libQ').value = b.dataset.q; libSearch(b.dataset.q); }); $('#libRes').querySelectorAll('.kn').forEach(b => b.onclick = () => b.dataset.lm !== undefined ? 0 : b.dataset.g !== undefined ? libPick(+b.dataset.g) : (closePops(), showNode(b.dataset.k))); }
let libGo = [];
function libPick(i) { const r = libGo[i]; if (!r) return; cancelTour(); closePops(); r.go(); canvas.focus(); }
/* Search sources. Anything that can be found by name registers here. A source is one of:
     1. a function:  q => [{ title, sub, go, rank?, prio? }]            q is the lower-case query (at least one character)
     2. an object with search:  { id, label, search(q) => [result] }     (js/particles.js)
     3. an object with items:   { id, title, items() => [{ id, title, sub, go? }] }   (js/atom.js); items() is called once and the
        list is filtered by title and sub. An item without go whose id is a node id (NODE[id]) opens that node with goToNode;
        an item with neither is ignored (it cannot take you anywhere).
   A result needs a title; go() takes the user somewhere (a flight, or a card). rank (lower is better) defaults from the title:
   0 exact, 1 starts with the query, 2 a word in it starts with the query, 3 contains it; anything else is not a match.
   prio orders results of the same kind of match: 0 places you can fly to (landmarks, planets, park objects), 1 topics, elements,
   molecules, 2 the rest. Results that go somewhere are listed first; textbook terms and sections follow.
   A source that throws is reported once on the console, never per keystroke; a malformed source is reported once and skipped. */
const SEARCH_SOURCES = [];
const _srcState = new WeakMap(); // per source: {fn, warned, cache}
const foldText = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Schrödinger matches schrodinger
const LEVEL_NAMES = { 0: 'Mathematics', 1: 'Classical, quantum and thermal physics', 2: 'Nuclei', 3: 'Atoms', 4: 'Chemistry', 5: 'Materials and the molecules of life', 6: 'Cells', 7: 'Bodies, machines and technology', 8: 'Life on Earth and its history', 9: 'Planets, climate and weather', 10: 'Stars and gravity', 11: 'The whole universe', X: 'Ideas that cut across scales' };
const levelName = l => LEVEL_NAMES[l] || 'Level ' + l;
function matchRank(title, q) {
  const t = foldText(title); if (t === q) return 0; if (t.startsWith(q)) return 1;
  if (t.split(/[^a-z0-9α-ω]+/).some(w => w.startsWith(q))) return 2; return t.includes(q) ? 3 : 9;
}
function searchSourceFn(src) {
  if (!src || (typeof src !== 'object' && typeof src !== 'function')) return null;
  let st = _srcState.get(src); if (!st) { st = { warned: false }; _srcState.set(src, st); }
  const bad = why => { if (!st.warned) { st.warned = true; console.warn('search source ignored:', why, src && (src.id || src.label || src.title)); } return null; };
  if (typeof src === 'function') return src;
  if (!src || typeof src !== 'object') return bad('not a function or an object');
  if (typeof src.search === 'function') return q => src.search(q);
  if (typeof src.items === 'function') return q => {
    if (!st.cache) st.cache = (src.items() || []).map(it => ({ it, t: String(it.title || '').toLowerCase(), u: String(it.sub || '').toLowerCase() }));
    return st.cache.filter(x => x.t.includes(q) || x.u.includes(q)).map(x => {
      const it = x.it, go = it.go || (typeof NODE !== 'undefined' && NODE[it.id] ? () => goToNode(it.id) : null); if (!go) return null;
      return { title: it.title, sub: it.sub, go, rank: it.rank };
    }).filter(Boolean);
  };
  return bad('needs a function, a search(q) method or an items() method');
}
function searchGoHits(q) {
  const out = [];
  SEARCH_SOURCES.forEach(src => {
    const fn = searchSourceFn(src); if (!fn) return;
    try { (fn(q) || []).forEach(r => { if (!r || !r.title || typeof r.go !== 'function') return; if (r.rank === undefined) r.rank = matchRank(r.title, q); if (r.rank < 9) out.push(Object.assign({ prio: 1 }, r)); }); }
    catch (e) { const st = _srcState.get(src); if (st && !st.warned) { st.warned = true; console.warn('search source failed:', e && e.message, src && (src.id || src.label || src.title)); } }
  });
  const bucket = r => r.rank <= 0 ? 0 : r.rank <= 2 ? 1 : 2; // exact, then prefix or word start, then contains
  const seenT = new Set(), uniq = [];
  out.map((r, i) => [r, i]).sort((a, b) => bucket(a[0]) - bucket(b[0]) || a[0].prio - b[0].prio || a[0].rank - b[0].rank || a[1] - b[1]).forEach(([r]) => { const k = r.title.toLowerCase() + '|' + (r.prio === 0 ? 'f' : ''); if (!seenT.has(k)) { seenT.add(k); uniq.push(r); } });
  return uniq.slice(0, 14);
}
SEARCH_SOURCES.push(q => LANDMARKS.filter(L => L.label.toLowerCase().includes(q)).map(L => ({ title: L.label, sub: `Fly there: about ${fmtLen(L.D)} across`, prio: 0, go: () => L.go() })));
SEARCH_SOURCES.push(q => {
  if (typeof ELJ === 'undefined') return [];
  return Object.values(ELJ).filter(e => e.symbol.toLowerCase() === q || e.name.toLowerCase().includes(q)).map(e => ({ title: `${e.name} (${e.symbol})`, sub: `Element ${e.Z}: its card, and a way to fly to its atoms`, rank: e.symbol.toLowerCase() === q ? 0 : matchRank(e.name, q), go: () => showElement(e.symbol) })); // a symbol typed exactly ("Fe") puts that element first
});
let MOL_INDEX = null;
SEARCH_SOURCES.push(q => {
  if (!MOL_INDEX) { if (MOL_INDEX !== 0 && typeof getJSON === 'function') { MOL_INDEX = 0; getJSON('data/molecules_all.json').then(A => { MOL_INDEX = A.index; libSearch($('#libQ').value); }).catch(() => { MOL_INDEX = []; }); } return []; }
  return MOL_INDEX.filter(m => m.name.toLowerCase().includes(q) || m.formula.toLowerCase() === q).map(m => ({ title: m.name, sub: `Molecule, ${m.formula}: fly to it at true size`, rank: m.formula.toLowerCase() === q ? 0 : undefined, go: () => placeGo('mol:' + m.id) }));
});
SEARCH_SOURCES.push(q => typeof NODE === 'undefined' ? [] : Object.values(NODE).filter(n => n.title.toLowerCase().includes(q)).map(n => ({ title: n.title, sub: `${(n.kind || '').replace(/_/g, ' ')}${n.summary ? ': ' + n.summary : ''}`.slice(0, 110), go: () => goToNode(n.id) })));
/* The Sun, the planets, the Moon and the things in the park: places you can fly to. Built when first searched, from the frames in FR. */
let _bodyPlaces = null;
function bodyPlaces() {
  if (_bodyPlaces || !FR.solar || !FR.park) return _bodyPlaces || [];
  const P = [], fmt = (D) => `Fly there: about ${fmtLen(D)} across`;
  const planet = (name, key) => { const f = FR[key]; if (!f) return; P.push({ title: name, sub: `Planet. ${fmt(1)}`.replace(/Fly there.*/, 'Planet: fly there'), go: () => { f.ensure(); const o = f.pickables.find(x => x.userData && x.userData.id && x.userData.id.toLowerCase() === name.toLowerCase()), r = (o && objRadiusLocal(o)) || f.radius * .01; flyTo(f, new V3(), r * f.unit * 4.5); } }); };
  ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].forEach(n => planet(n, n));
  P.push({ title: 'The Sun', sub: 'Our star: fly there', alias: 'sun', go: () => flyTo(FR.solar, new V3(), 4e9) });
  P.push({ title: 'The Moon', sub: 'Earth\'s moon: fly there', alias: 'moon', go: () => { FR.earth.ensure(); const m = FR.earth.pickables.find(x => x.userData && x.userData.id === 'moon'); if (m) flyTo(FR.earth, m.position.clone(), 1.2e7); else flyTo(FR.earth, new V3(), 1.4e9); } });
  P.push({ title: 'International Space Station', sub: 'Fly there', alias: 'iss', go: () => { FR.earth.ensure(); const m = FR.earth.pickables.find(x => x.userData && x.userData.id === 'iss'); if (m) flyTo(FR.earth, m.position.clone(), 2e3); } });
  const park = { dog: 'Dog', tree: 'Tree', pond: 'Pond', flower: 'Flowers', bee: 'Honeybee', mushroom: 'Mushroom', bird: 'Bird', cloud: 'Cloud' };
  for (const id in park) P.push({ title: (INFO[id] && INFO[id].title) || park[id], sub: 'In Greenwich Park: fly there', go: () => { FR.park.ensure(); const o = FR.park.pickables.find(x => x.userData && x.userData.id === id); if (!o) { placeGo('place:park'); return; } const p = parkPointOf(id, new V3(0, 1, 0)), r = objRadiusLocal(o) || 1; flyTo(FR.park, p, Math.max(Math.min(r * 3.5, 30), 1.2)); } });
  P.push({ title: 'Air', sub: 'In Greenwich Park: what the air is made of', go: () => placeGo('place:air') }, { title: 'Soil and rock', sub: 'In Greenwich Park: down into the soil', alias: 'soil ground', go: () => placeGo('place:soil') });
  return _bodyPlaces = P;
}
SEARCH_SOURCES.push(q => bodyPlaces().filter(b => b.title.toLowerCase().includes(q) || (b.alias && b.alias.split(' ').some(a => a.startsWith(q)))).map(b => ({ title: b.title, sub: b.sub, go: b.go, prio: 0, rank: b.alias && b.alias.split(' ').some(a => a === q) ? 0 : undefined })));
function showElement(sym) {
  const dummy = new THREE.Object3D(); dummy.userData.id = 'el_' + sym; dummy.userData.info = INFO['el_' + sym] || elInfo(sym);
  showInfoFor({ id: 'el_' + sym, obj: dummy, frame: cam.A, pointLocal: cam.T.clone(), noZoom: true, elSym: sym });
}
function flyToElement(sym) {
  if (typeof atomFrame !== 'function' || !FR.park) { message('The atom view is not available.'); return; }
  closeInfo(); FR.park.ensure(); placeChild(FR.park, atomFrame(sym, new V3(1.2, .5, 1.4)), 7e-10);
}
function openLibrary(force) { const p = $('#library'); const o = force || !p.classList.contains('open'); if (!force || !p.classList.contains('open')) closePops(); if (!o) return; p.classList.add('open'); $('#libQ').focus(); $('#libQ').select(); loadKnowledge().then(() => libSearch($('#libQ').value)); libSearch($('#libQ').value); }

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
  // on a phone the strip has no room for names: tapping it flies to the nearest place on the scale and says which
  if (!box._tap) { box._tap = 1; box.addEventListener('click', e => {
    if (e.target.closest('.lm') || !LANDMARKS.length || getComputedStyle($('#ruler .lm') || box).display !== 'none') return;
    const r = box.getBoundingClientRect(), y = e.clientY - r.top, hh = box.clientHeight || 600;
    let best = null, bd = 1e9; LANDMARKS.forEach(L => { const d = Math.abs(rulerY(Math.log10(L.D), hh) - y); if (d < bd) { bd = d; best = L; } });
    if (best) { cancelTour(); toast(`Flying to ${best.label}`); best.go(); }
  }); }
  if (!buildRuler._ro) { buildRuler._ro = new ResizeObserver(() => buildRuler()); buildRuler._ro.observe(box); }
}
function updateRuler() {
  const box = $('#rulerScale'), m = $('#rulerMark'); if (!box || !m) return;
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180), e = Math.log10(view), h = box.clientHeight;
  m.style.top = clamp(rulerY(e, h), 0, h) + 'px'; const ro = $('#rulerRO'); const t = fmtLen(view); if (ro.textContent !== t) ro.textContent = t;
  // the name is bold only where the camera really is: a landmark whose frame is not on the camera's path (another cell, a surface you flew past) is not named, the scale tick still shows the size
  const path = chainOf(cam.A); let best = null, bd = .35; LANDMARKS.forEach(L => { const d = Math.abs(Math.log10(L.D) - e); if (d < bd && (!L.frame || path.includes(L.frame))) { bd = d; best = L; } });
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
let capSince = performance.now(), capPref = null; // capPref: null = automatic (folds a few seconds after you arrive, or while a card is open), true/false = your choice for this place
function updateCaption() {
  let f = active[active.length - 1];
  if (active.includes(cam.A)) f = cam.A; // the caption and the path name the frame the camera is in as soon as it is the anchor, not once it has faded in
  else for (let i = active.length - 1; i >= 0; i--) if (active[i].alpha > .6) { f = active[i]; break; }
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180), e = Math.log10(view);
  const nm = humanName(f);
  if (f !== capFrame || $('#capN').textContent !== nm) {
    capFrame = f; crumbsAll = false; capSince = performance.now(); capPref = null; updateCrumbs(f);
    $('#capN').textContent = nm;
    $('#capD').textContent = f.blurb || '';
    $('#capNote').textContent = f.note || '';
    updateControls(f);
  }
  { const min = capPref !== null ? capPref : (document.body.classList.contains('cardOpen') || performance.now() - capSince > 14000), cp = $('#caption'); if (cp.classList.contains('min') !== min) { cp.classList.toggle('min', min); $('#capFold').textContent = min ? 'Show details' : 'Hide details'; } }
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
  updateViewOffset(dt);
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
  $('#libQ').addEventListener('keydown', e => { if (e.key === 'Enter') libPick(0); else if (e.key === 'Escape') { closePops(); canvas.focus(); } });
  $('#navBack').onclick = navBack; $('#capFold').onclick = () => { capPref = !$('#caption').classList.contains('min'); };
  $('#bLabels').classList.toggle('off', !labelsOn);
  $('#bLabels').onclick = () => { labelsOn = !labelsOn; store.set('labels', labelsOn); $('#bLabels').classList.toggle('off', !labelsOn); };
  $('#bHelp').onclick = () => $('#help').classList.remove('hide');
  $('#goBtn').onclick = () => { $('#help').classList.add('hide'); store.set('seenHelp', true); canvas.focus(); };
  $('#tourIn').onclick = () => startTour(true); $('#tourOut').onclick = () => startTour(false);
  $('#tourIn2').onclick = () => { closePops(); startTour(true); }; $('#tourOut2').onclick = () => { closePops(); startTour(false); }; // the same tours, from the Library panel (the ruler's buttons have no room on a phone)
  const speeds = [[1, 'Real time'], [60, '1 min per s'], [3600, '1 hour per s'], [86400, '1 day per s'], [86400 * 30, '1 month per s'], [0, 'Paused']];
  let si = 0; $('#timeS').onclick = () => { si = (si + 1) % speeds.length; timeSpeed = speeds[si][0]; $('#timeS').textContent = speeds[si][1]; };
  $('#timeNow').onclick = () => { simTime = Date.now(); };
  if (store.get('seenHelp', false)) $('#help').classList.add('hide');
  startView();
  const fade = $('#fade'); fade.style.transition = 'opacity 1.2s'; requestAnimationFrame(() => fade.style.opacity = 0);
  loadKnowledge();
  requestAnimationFrame(loop);
}

/* ================= DEBUG: pickables without a card =================
   auditPickables() lists, for every frame drawn now, the pickable ids that have no card data (no INFO entry, no NODE,
   no userData.info or infoFn). Clicking one still opens a minimal card and logs a console warning; this finds them before
   a user does. Ids resolved at pick time (userData.resolve) cannot be listed in advance and are counted as `dynamic`. */
// a hit-sphere child of a group that carries the card shows that card when picked
function cardOnAncestor(o) { for (let a = o.parent; a; a = a.parent) { const u = a.userData || {}; if (u.infoFn || u.info) return true; } return false; }
function auditPickables(quiet) {
  const out = [];
  for (const f of drawn) {
    if (!f.pickables) continue;
    const missing = new Map(); let dyn = 0, total = 0;
    const seenObj = new Set();
    const visit = o => {
      if (seenObj.has(o)) return; seenObj.add(o);
      const ud = o.userData || {};
      if (ud.resolve) { dyn++; return; }
      if (ud.id !== undefined) { total++; if (!hasCard(o, ud.id) && !cardOnAncestor(o)) missing.set(ud.id, (missing.get(ud.id) || 0) + 1); }
    };
    f.pickables.forEach(p => { visit(p); p.traverse && p.traverse(visit); });
    out.push({ frame: humanName(f), type: f.type, pickables: total, dynamic: dyn, missing: [...missing.keys()] });
  }
  if (!quiet) console.table(out.map(r => ({ frame: r.frame, pickables: r.pickables, dynamic: r.dynamic, missing: r.missing.join(', ') })));
  return out;
}
