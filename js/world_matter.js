'use strict';
/* ================= MATTER & LIFE FRAMES (true sizes) ================= */
const ELJ = {}; // symbol → elements.json record
const SUBCH = '₀₁₂₃₄₅₆₇₈₉', SUPCH = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const toSub = s => String(s).replace(/\d/g, d => SUBCH[d]), toSup = s => String(s).replace(/\d/g, d => SUPCH[d]);
/* electron configuration with superscripts and the count written out: "1s" -> 1s¹, "[He] 2s2 2p2" -> [He] 2s² 2p² */
function fmtConfig(c) { return String(c || '—').replace(/(\d[spdf])(\d*)/g, (m, o, n) => o + toSup(n || '1')); }
function elInfo(sym) {
  const e = ELJ[sym]; if (!e) return { title: sym, tag: 'Element', body: '' };
  const f = [['Atomic number', e.Z], ['Atomic mass', `${(+e.mass).toFixed(3)} u`], ['Electron configuration', fmtConfig(e.config)]];
  if (e.radius_vdw_pm) f.push(['Van der Waals radius', `≈ ${Math.round(e.radius_vdw_pm)} pm (values differ a little between sources)`]);
  if (e.electronegativity) f.push(['Electronegativity', e.electronegativity]);
  if (e.ionization_eV) f.push(['First ionization energy', `${(+e.ionization_eV).toFixed(2)} eV`]);
  if (e.phase_stp) f.push(['State at room temperature', e.phase_stp]);
  if (e.melt_K) f.push(['Melts at', `${Math.round(e.melt_K)} K`]);
  if (e.discovered) f.push(['Discovered', e.discovered]);
  return { title: `${e.name} atom (${e.symbol})`, tag: `${e.category || 'Element'} · group ${e.group || '—'}, period ${e.period}`, body: `<p>${e.summary || ''}</p>`, facts: f };
}
const elColor = s => MD.on ? MD.cpk(s) : new THREE.Color(ELJ[s] && ELJ[s].color_cpk ? ELJ[s].color_cpk : '#ff66cc');
const elVdw = s => (ELJ[s] && ELJ[s].radius_vdw_pm ? Math.round(ELJ[s].radius_vdw_pm) : 170) / 100; // Å
const elHex = s => '#' + elColor(s).getHexString();
function colorKey(syms) { return '<p class="mini">Colours (a convention, atoms have no colour): ' + [...new Set(syms)].map(s => `<span style="color:${elHex(s)};text-shadow:0 0 1px #345">●</span> ${(ELJ[s] || {}).name || s}`).join(', ') + '.</p>'; }
/* Shannon (1976) effective ionic radii, 6-coordinate, in Å (Wikipedia "Ionic radius", table of Shannon values) */
const IONIC_R = { Na: 1.02, Cl: 1.81, Ca: 1.00, F: 1.33, O: 1.40, Mg: .72, Si: .40, Ti: .605, Fe: .645 };
const CRYSTAL_IONIC = { halite: ['Na', 'Cl'], fluorite: ['Ca', 'F'], hematite: ['Fe', 'O'], rutile: ['Ti', 'O'], forsterite: ['Mg', 'Si', 'O'] };
const CRYSTAL_METAL = ['iron_bcc', 'copper_fcc', 'gold_fcc', 'aluminium_fcc', 'magnetite'];
/* formula as chemists write it: subscripts, charge as a superscript, common small molecules in conventional order */
function molFormula(f) {
  let ch = 0, core = String(f || ''); const m = /([+-])(\d*)$/.exec(core);
  if (m) { ch = (m[1] === '-' ? -1 : 1) * (m[2] ? +m[2] : 1); core = core.slice(0, m.index); }
  const CONV = { H3N: 'NH₃', O2S: 'SO₂', CHN: 'HCN', H4N: 'NH₄', H2O4S: 'H₂SO₄', ClH: 'HCl', FH: 'HF', H2S: 'H₂S', NO2: 'NO₂', CHN: 'HCN' };
  let t = CONV[core] || toSub(core);
  if (ch) t += toSup(Math.abs(ch) > 1 ? Math.abs(ch) : '') + (ch > 0 ? '⁺' : '⁻');
  return { text: t, charge: ch };
}
function methodText(method) {
  const m = String(method || 'MMFF94').replace(/(\([^)]*\))\s*\1/g, '$1');
  if (/experimental/i.test(m)) return 'Geometry from experiment.';
  if (/idealized/i.test(m)) return 'Idealised shape, not a measured structure.';
  if (/placed|free-base/i.test(m)) return 'Approximate: the ring comes from a force-field calculation and the metal atom is placed by hand.';
  if (/docking/i.test(m)) return 'Approximate: the shape comes from a docking calculation.';
  if (/UFF/i.test(m)) return 'Approximate: a force-field shape (UFF) with some bond lengths rescaled.';
  return `Approximate: a computed shape (RDKit toolkit, ${m} force field), close to but not exactly the measured structure.`;
}
const MOL_GROUPS = { amino_acid: 'Amino acids', cofactor: 'Cofactors and vitamins', drug: 'Medicines', gas: 'Small molecules (gases, water, others)', hormone_neuro: 'Hormones and neurotransmitters', inorganic: 'Inorganic', lipid: 'Lipids', mineral_unit: 'Mineral building blocks', nucleotide: 'Nucleotides', organic: 'Other organic molecules', pigment: 'Pigments', polymer: 'Polymer units', sugar: 'Sugars' };
/* --- models under the realistic look (?look=2; docs/DESIGN.md 3.1, 3.2, 3.4): MD ---
   Molecules, crystals, liquids, gases, the cell and DNA have no appearance of their own, so under the look they are drawn as models
   photographed in a studio: the foundation's studio rig (one environment, one lamp), materials of a kind from LOOK.KINDS, a plain graphite
   ground, far parts fading into it (a depth cue), and contact darkening between touching spheres. With the look off, MD.on is false
   and nothing here runs. */
const _mdV = new V3(), _mdB = new THREE.Box3();
if (typeof LOOK !== 'undefined' && LOOK.on && LOOK.KINDS && !LOOK.KINDS.satin) LOOK.KINDS.satin = { rough: .66 };   // a kind this family adds (DESIGN 3.5: a scene may add a kind)
const MD = {
  on: typeof LOOK !== 'undefined' && LOOK.on && LOOK.part('pbr'),
  BG: 0x16191c,                                   // the studio ground: graphite, the same for every model scene
  /* The CPK convention as the look draws it: carbon dark grey and hydrogen white (Corey and Pauling's model kits; RasMol's light grey
     carbon is the other common reading), nitrogen blue, oxygen red, sulfur yellow, phosphorus orange, chlorine green, sodium violet, iron
     rust-orange, each toned to a colour a real surface can have (DESIGN 3.5: no channel near 0 or 255, nothing purely saturated). An
     element not listed keeps its data colour, toned the same way. The card's colour key and the scene use the same values. */
  CPK: { H: 0xe6e6e3, C: 0x7b828b, N: 0x4166c8, O: 0xcc4137, S: 0xd9b843, P: 0xd98a35, F: 0x8cbf5c, Cl: 0x53ad55, Br: 0x9a4a3a, I: 0x7a4f9a,
    Na: 0x8b6ccf, K: 0x8a62c4, Li: 0xa77ccc, Mg: 0x79a650, Ca: 0x9aa1a8, Fe: 0xc8743f, Cu: 0xc58a5c, Zn: 0x8a93b0, Au: 0xd6ae4c, Al: 0xb3a7aa, Si: 0xc4ab86,
    Ti: 0x9ea3a9, Co: 0xc98c9a, He: 0xd9e3e3, Ar: 0x86b7c4, B: 0xd0a08a },
  _cpk: {},
  cpk(s) {
    if (MD._cpk[s]) return MD._cpk[s].clone();
    let c; if (MD.CPK[s] !== undefined) c = new THREE.Color(MD.CPK[s]);
    else { c = new THREE.Color(ELJ[s] && ELJ[s].color_cpk ? ELJ[s].color_cpk : '#9a9aa0'); const h = {}; c.getHSL(h); c.setHSL(h.h, Math.min(.62, h.s), Math.max(.22, Math.min(.86, h.l))); }
    return (MD._cpk[s] = c).clone();
  },
  /* the light of every model scene: exposed so that a mid-grey part shows about mid-grey, with the lamp stronger against the room than the
     rig's default so that form reads (about three to one, as a product is lit) */
  EXPOSURE: .52, KEY: 1.05, ENVK: .6,
  /* the scene's kind as the first word of its note (DESIGN 3.2): every note set later, by any code, keeps it */
  kind(F, word, tail) {
    if (!MD.on) return; let n = F.note || '';
    const fix = v => { if (!v || /^(Model|Diagram|As it looks)\b/.test(v)) return v; v = String(v); const low = v.length > 1 && v[1] === v[1].toLowerCase() ? v[0].toLowerCase() + v.slice(1) : v;
      return (/^[^:.]{1,40}:\s/.test(v) ? word + ', ' : word + ': ') + low + (tail && !v.includes(tail) ? ' ' + tail : ''); };
    const d0 = Object.getOwnPropertyDescriptor(F, 'note');
    if (d0 && d0.get && d0.set) {   // a scene reached through the descent table already wraps its note with its honesty line ("A stand-in. ..."): that line stays first, the kind leads what follows it
      let inner = ''; Object.defineProperty(F, 'note', { configurable: true, enumerable: true, get: d0.get, set: v => { inner = fix(v); d0.set.call(F, inner); } }); F.note = inner; return;
    }
    Object.defineProperty(F, 'note', { configurable: true, enumerable: true, get: () => n, set: v => { n = fix(v); } }); F.note = n;
  },
  /* a model's stage: graphite ground, and fog in the ground's colour from just in front of the model to a few of its sizes behind,
     so the far side of a crowd falls back (fog is mixed after the tone curve and encoding in r128, so it meets the ground exactly) */
  stage(F, o) {
    if (!MD.on) return; o = o || {};
    if (F.exposure === undefined) F.exposure = MD.EXPOSURE; if (F._lkKeyI === undefined) F._lkKeyI = MD.KEY;
    F.env = Object.assign({}, F.env || {}, { opaque: true, bg: MD.BG }); if (F.scene.background && F.scene.background.isColor) F.scene.background.setHex(MD.BG);
    const fog = new THREE.Fog(MD.BG, 1e9, 2e9); F.scene.fog = fog; const near = o.near || .9, far = o.far || 3.2, u0 = F.update;
    F.update = function (dt, t) { if (u0) u0.call(this, dt, t); if (F._mdTick) F._mdTick();
      const bg = F.scene.background; if (bg && bg.isColor && bg.getHex() !== MD.BG) { bg.setHex(MD.BG); F.env = Object.assign({}, F.env, { bg: MD.BG }); }   // the ground stays the family's (a later dressing may set its own)
      if (F.scene.fog !== fog) F.scene.fog = fog; if (fog.color.getHex() !== MD.BG) fog.color.setHex(MD.BG);
      if (cam.A === F) { const d = cam.D / F.unit; fog.near = d * near; fog.far = d * far; } else { fog.near = 1e9; fog.far = 2e9; } };
  },
  /* every model material: the kind's roughness, the room's share cut, and a depth cue that stops short of the ground: far parts lose at
     most FOGMAX of their colour to it, so a dark atom at the back (carbon) keeps its own tone and never reads as a hole */
  FOGMAX: .5,
  /* a crowd of atoms (liquid water, a large crystal) in a satin finish: the same highlight repeated on a thousand beads reads as a pile of
     plastic beads; a small molecule keeps the plastic of a model kit */
  KIND_CROWD: 'satin',
  mat(color, kind, o) { const m = LOOK.material(kind || 'plastic', color, o); m.envMapIntensity *= MD.ENVK; return MD.fogCap(m); },
  fogCap(m) { return LOOK.patch(m, 'mdfog' + MD.FOGMAX, sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', THREE.ShaderChunk.fog_fragment.replace('fogColor, fogFactor', 'fogColor, min( fogFactor, ' + MD.FOGMAX.toFixed(2) + ' )')); }); },
  /* a thin film (a membrane): a lit surface that is nearly clear where it is seen face on and denser where it is seen edge on, as a
     bubble or a membrane in a microscope is. Its reflections of the studio are part of it. a0, a1: opacity face on and edge on. */
  film(color, a0, a1, kind) {
    const m = MD.mat(color, kind || 'wet', { extra: { transparent: true, depthWrite: false } }); m._lkUn = true;
    return LOOK.patch(m, 'mdfilm' + a0 + '_' + a1, sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <tonemapping_fragment>',   // r128 writes gl_FragColor just before the tone curve
      `{ float mdF = pow( 1.0 - abs( dot( normalize( normal ), normalize( vViewPosition ) ) ), 2.2 ); gl_FragColor.a *= mix( ${a0.toFixed(3)}, ${a1.toFixed(3)}, mdF ); }\n#include <tonemapping_fragment>`); });
  },
  /* a membrane seen edge on, as an electron micrograph shows it: two thin darker lines with a paler core where the surface turns away
     from the eye (the band of the silhouette where the view runs along the surface); far thicker than the real 7 nm or so, as every
     outline at this scale is */
  bilayer(m) {
    return LOOK.patch(m, 'mdbilayer', sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <tonemapping_fragment>',
      `{ float mdU = abs( dot( normalize( normal ), normalize( vViewPosition ) ) );
         float mdL = smoothstep( 0.03, 0.06, mdU ) * ( 1.0 - smoothstep( 0.09, 0.12, mdU ) ) + smoothstep( 0.17, 0.2, mdU ) * ( 1.0 - smoothstep( 0.23, 0.26, mdU ) );
         float mdC = smoothstep( 0.1, 0.13, mdU ) * ( 1.0 - smoothstep( 0.16, 0.19, mdU ) );
         gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * 0.45, mdL ); gl_FragColor.a = max( gl_FragColor.a, 0.75 * mdL + 0.55 * mdC ); }
#include <tonemapping_fragment>`); });
  },
  /* the cell's parts in one code of muted colours (DESIGN 3.2: colours a code, named as such in the note); chlorophyll green is real */
  CELL: { membrane: 0xd8c9c6, cytoplasm: 0x23272b, nucleus: 0x8e86b5, pore: 0xc9c2dc, nucleolus: 0x5d4d86, chromatin: 0xb6a7d2, er: 0x8aa2ad, golgi: 0xc6a55c,
    mito: 0xcf8a5f, cristae: 0x9a5538, lysosome: 0xa3a77f, chloroplast: 0x3f7f3a, vacuole: 0x9cc1d2, ribosome: 0xd9d2c4, cytoskeleton: 0xc8c2b4, cellwall: 0xb3c993,
    bacwall: 0xb8c98e, nucleoid: 0xb9a8d6, flagellum: 0xcbb98a, head: 0xd9a95e, tail: 0xe6d9ae, channel: 0x8e7cc3, glyco: 0x6fae7c, sugar: 0xd6aede, ion: 0x7fc9d6 },
  restyleCell(F, c) {
    if (!MD.on) return; const K = MD.CELL;
    const idOf = o => { for (let x = o; x && x !== c.group; x = x.parent) if (x.userData && x.userData.id) return x.userData.id; return ''; };
    const std = (o, col, kind) => { const m = o.material; if (m && m.isMeshStandardMaterial && !m.transparent) { m.color.setHex(col); if (m.emissive) m.emissive.setRGB(0, 0, 0); if (m.map) { m.map = null; m.needsUpdate = true; } LOOK.dress(m, kind || 'wet'); m.envMapIntensity *= MD.ENVK; m._lkUn = true; } else { const n = MD.mat(col, kind || 'wet'); n.side = m && m.side || THREE.FrontSide; n.userData = Object.assign({}, m && m.userData); n._lkUn = true; o.material = n; } };
    const film = (o, col, a0, a1, kind) => { const n = MD.film(col, a0, a1, kind); n.side = o.material && o.material.side || THREE.FrontSide; n.userData = Object.assign({}, o.material && o.material.userData); o.material = n; };
    const drop = [];
    c.group.traverse(o => {
      if (o.isPoints) { drop.push(o); return; }
      const id = idOf(o), m = o.material; if (!m || Array.isArray(m)) return;
      if (m.isShaderMaterial && m.uniforms && m.uniforms.uInt) {   // the additive rim shells: the membrane becomes a film, the others go
        if (id === 'membrane' && o.userData.id === 'membrane') { film(o, K.membrane, .04, .5); MD.bilayer(o.material); } else drop.push(o); return; }
      if (o.isLineSegments) { if (id === 'cellwall' || !id && m.opacity > .5) { m.color.setHex(K.cellwall); m.opacity = .35; } else { m.color.setHex(K.cytoskeleton); m.opacity = .14; } return; }
      if (m.isMeshBasicMaterial) {
        if (!m.visible) return;
        if (id === 'cytoplasm') { film(o, K.cytoplasm, .62, .12, 'matte'); return; }   // a volume: denser through the middle than at the rim, so the cell is a body, not a flat disc
        if (id === 'nucleoid') { drop.push(o); return; }                                  // the nucleoid's halo
        if (id === 'channel') { std(o, K.ion, 'plastic'); return; }                         // the ions passing through
        return;                                                                            // scale bars stay annotations
      }
      switch (id) {
        case 'nucleus': if (o.userData.id === 'nucleus') film(o, K.nucleus, .22, .8); else std(o, K.pore); break;
        case 'nucleolus': std(o, K.nucleolus); break;
        case 'chromatin': std(o, K.chromatin); break;
        case 'er': std(o, K.er, 'matte'); m.transparent = false; m.opacity = 1; break;   // a membrane sheet seen at this scale: matte, not wrap
        case 'golgi': std(o, K.golgi); break;
        case 'mito': if (m.transparent) film(o, K.mito, .3, .9); else std(o, K.cristae); break;
        case 'lysosome': std(o, K.lysosome, 'matte'); break;
        case 'chloroplast': std(o, K.chloroplast, 'leaf'); break;
        case 'vacuole': film(o, K.vacuole, .06, .5); break;
        case 'ribosome': std(o, K.ribosome); break;
        case 'cellwall': film(o, K.cellwall, .05, .4, 'matte'); break;
        case 'bacwall': film(o, K.bacwall, .05, .45); break;
        case 'nucleoid': std(o, K.nucleoid); break;
        case 'flagellum': std(o, K.flagellum); break;
        case 'phospholipid': std(o, o.geometry && o.geometry.type === 'SphereGeometry' ? K.head : K.tail); break;
        case 'channel': std(o, K.channel); break;
        case 'glycoprotein': std(o, o.geometry && o.geometry.type === 'SphereGeometry' ? K.sugar : K.glyco); break;
        default: if (m.isMeshStandardMaterial) { if (m.emissive) m.emissive.setRGB(0, 0, 0); m._lkUn = true; }
      }
    });
    drop.forEach(o => o.parent && o.parent.remove(o));
    c.group.traverse(o => { const m = o.material; if (m && !Array.isArray(m)) m._lkUn = true; });
    /* ribosomes are drawn at their true size: where one is under about a pixel it is not drawn (a part smaller than a pixel lit one pixel
       here and there, and read as specks); from about 2 px it is fully there */
    let rib = null; c.group.traverse(o => { if (o.isInstancedMesh && o.userData.id === 'ribosome') rib = o; });
    if (rib) { const rm = rib.material, r0 = rib.geometry.parameters.radius || .0165; rm.transparent = true;
      rib.onBeforeRender = (rr, sc, camera) => { const s = rib.matrixWorld.getMaxScaleOnAxis(), d = Math.max(1e-9, camera.position.distanceTo(_mdV.setFromMatrixPosition(rib.matrixWorld))), px = 2 * r0 * s / d * H / (2 * Math.tan(camera.fov * Math.PI / 360));
        const a = Math.min(1, Math.max(0, (px - 1) / 1.2)); rm.opacity = a * (rm.userData.baseOp === undefined ? 1 : rm.userData.baseOp); rm.depthWrite = a > .99; };
      F._mdRib = rib; }
    F._mdc = F._mdcStep = F._mdChoose = null; if (F._mdcClip0 !== undefined) F.coreClip = F._mdcClip0;   // a rebuild (another kind of cell) starts clean
    if (c.cellKind === 'animal') MDC.build(F, c);   // the model with real counts and forms (MDC, below)
    /* the labels' stems end on the part they name: the anchor is put on the top of the part (its vertices, as it turns), not above it */
    const LBL = (F.labels || []).filter(L => L.off && L.off.y > 0 && L.off.x === 0 && L.obj && (L.obj.isMesh || L.obj.isGroup));
    LBL.forEach(L => { L._mdOff0 = L.off.y; });
    let tLbl = 0; F._mdTick = () => { const now = performance.now(); if (now - tLbl < 400) return; tLbl = now;
      LBL.forEach(L => { if (!L.obj.visible) return; L.obj.updateWorldMatrix(true, true); _mdB.setFromObject(L.obj); if (_mdB.isEmpty()) return; L.obj.getWorldPosition(_mdV); const k = L.scaleRef ? L.scaleRef.k || 1 : 1; L.off.y = Math.min(L._mdOff0, (_mdB.max.y - _mdV.y) / k); }); if (F._mdcStep) F._mdcStep(); };   // the colours above are final: the foundation's generic toning of a cell (look.js, DRESS.cell) leaves them alone
  },
  /* DNA: the four letters keep their code (A green, T red, G yellow, C blue: the usual convention), toned to sit beside CPK colours; the
     backbone is a pale sugar and an ochre phosphate. The water-and-ion dots drawn round it for atmosphere are removed: they were not data. */
  DNA: { A: 0x5fb779, T: 0xd06a63, G: 0xd9b445, C: 0x5f8bd2, sugar: 0xc6bda5, phos: 0xe3a463, tube: 0xd8b88f, sugarNew: 0xbfd2e2, phosNew: 0x6f9cc6, tubeNew: 0x86a9c8, hist: [0xc98aa6, 0xcf9a6c, 0x7f9fcf, 0x79b394], fiber: 0x86a9c8 },
  restyleDNA(F, c) {
    if (!MD.on) return; const K = MD.DNA, OLD = { 0x4ade80: K.A, 0xf87171: K.T, 0xfacc15: K.G, 0x60a5fa: K.C, 0xe9e2c6: K.sugar, 0xff9f43: K.phos, 0xbfe6ff: K.sugarNew, 0x38bdf8: K.phosNew,
      0xf2c38b: K.tube, 0x7dd3fc: K.tubeNew, 0xf472b6: K.hist[0], 0xfb923c: K.hist[1], 0x34d399: K.hist[3] };
    const seen = new Set(), drop = [];
    c.group.traverse(o => {
      if (o.isPoints) { drop.push(o); return; }
      const m = o.material; if (!m || Array.isArray(m) || seen.has(m)) return; seen.add(m);
      if (m.isMeshBasicMaterial) { if (m.color.getHex() === 0xffffff) { m.color.setHex(0xcfd3d8); m.opacity = .9; } return; }   // the hydrogen-bond dots: an annotation, quiet grey
      if (!m.isMeshStandardMaterial) return;
      let h = m.color.getHex(); if (OLD[h] !== undefined) m.color.setHex(OLD[h]);
      else if (h === 0x60a5fa) m.color.setHex(K.hist[2]);
      if (m.emissive) m.emissive.setRGB(0, 0, 0); LOOK.dress(m, 'plastic'); m.envMapIntensity *= MD.ENVK;
    });
    // histones share the hue of cytosine (#60a5fa) in the old code; the core spheres are told apart by their place, so their blue is set by the group
    c.group.traverse(o => { if (o.userData && o.userData.id === 'histone') o.children.forEach((s, j) => { if (s.material && s.material.color) { s.material = s.material.clone(); s.material.color.setHex(K.hist[j % 4]); } }); });
    drop.forEach(o => o.parent && o.parent.remove(o));
    const strip = (F.uiEls || []).find(e => e && e.id === 'seq'); if (strip) { strip.querySelectorAll('.l span').forEach(s => { const L = s.textContent; if (K[L]) s.style.color = '#' + K[L].toString(16).padStart(6, '0'); });
      const mk = 'linear-gradient(90deg, #000 calc(100% - 56px), transparent)'; strip.style.webkitMaskImage = mk; strip.style.maskImage = mk; }   // the strip runs on past the edge: it fades there instead of being cut through a codon
  },
  /* contact darkening between spheres (an approximation, stated here and in DESIGN 3.8: occlusion between parts is not computed by the
     renderer). Each sphere gets a direction toward its neighbours and a strength (the solid angle they cover, summed); the side of the
     sphere that faces them loses most of the room's light and part of the lamp's. One vec4 per instance, a few operations per fragment. */
  occlusion(C, R, maxD) {
    const n = R.length, out = new Float32Array(n * 4), cell = maxD || 4, grid = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
    for (let i = 0; i < n; i++) { const k = key(Math.floor(C[3 * i] / cell), Math.floor(C[3 * i + 1] / cell), Math.floor(C[3 * i + 2] / cell)); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); }
    for (let i = 0; i < n; i++) {
      const x = C[3 * i], y = C[3 * i + 1], z = C[3 * i + 2], gx = Math.floor(x / cell), gy = Math.floor(y / cell), gz = Math.floor(z / cell); let dx = 0, dy = 0, dz = 0, s = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const j of grid.get(key(gx + a, gy + b, gz + c)) || []) {
        if (j === i) continue; const ux = C[3 * j] - x, uy = C[3 * j + 1] - y, uz = C[3 * j + 2] - z, d = Math.hypot(ux, uy, uz); if (d < 1e-6 || d > cell + R[i]) continue;
        const w = 1 - Math.sqrt(1 - Math.min(.98, (R[j] / Math.max(d, R[j])) ** 2));   // the share of the sky a sphere of radius R[j] at distance d covers, as 1 - cos(half angle)
        dx += ux / d * w; dy += uy / d * w; dz += uz / d * w; s += w;
      }
      const L = Math.hypot(dx, dy, dz) || 1; out.set([dx / L, dy / L, dz / L, Math.min(.82, 1.7 * s)], 4 * i);
    }
    return out;
  },
  /* points drawn as glowing blobs added into the picture (pointsMaterial, js/helpers.js) become opaque discs: a particle in a model is a
     marker, and nothing in the scene gives off light */
  discs(pts, k = .84) {
    const m0 = pts.material;
    pts.material = new THREE.ShaderMaterial({ uniforms: m0.uniforms, vertexShader: m0.vertexShader,
      fragmentShader: `varying vec3 vColor; uniform float uOpacity;
        void main(){ vec2 d = gl_PointCoord * 2.0 - 1.0; float r2 = dot(d, d); if (r2 > 1.0) discard;
          gl_FragColor = vec4(vColor * ${k.toFixed(3)} * (1.0 - 0.16 * smoothstep(0.55, 1.0, r2)), uOpacity); }`,
      transparent: true, depthWrite: true });   // transparent only so the frame's fade can pass through (engine.js applyFade); at rest it is opaque
    m0.dispose(); return pts;
  },
  /* hydrogen bonds between separate molecules of one model (the two bases of a pair, a dimer): a hydrogen bonded to N or O, and an N or O
     of another molecule 1.5 to 2.3 Å from it (the nearest) with the donor, the hydrogen and the acceptor within 60° of a line (an A-T pair
     gives its two, a G-C pair its three). Drawn as dashes: short
     sticks, thinner than a bond, in a cool grey. Returns how many were found. */
  HB: 0x9fb0c2,
  hbonds(F, parent, atoms, bonds) {
    const n = atoms.length, root = atoms.map((_, i) => i), find = i => root[i] === i ? i : (root[i] = find(root[i]));
    bonds.forEach(([i, j]) => { root[find(i)] = find(j); });
    const nb = atoms.map(() => []); bonds.forEach(([i, j]) => { nb[i].push(j); nb[j].push(i); });
    const P = i => new V3(atoms[i][1], atoms[i][2], atoms[i][3]), pairs = [];
    for (let h = 0; h < n; h++) {
      if (atoms[h][0] !== 'H') continue; const d = nb[h].find(k => atoms[k][0] === 'N' || atoms[k][0] === 'O'); if (d === undefined) continue;
      const ph = P(h), pd = P(d); let best = -1, bl = 2.3;   // one acceptor per hydrogen: the nearest
      for (let a = 0; a < n; a++) {
        if ((atoms[a][0] !== 'N' && atoms[a][0] !== 'O') || find(a) === find(h)) continue;
        const pa = P(a), L = ph.distanceTo(pa); if (L < 1.5 || L > bl) continue;
        if (pd.clone().sub(ph).angleTo(pa.clone().sub(ph)) < 120 * Math.PI / 180) continue;
        best = a; bl = L;
      }
      if (best >= 0) pairs.push([h, best]);
    }
    if (!pairs.length) return 0;
    const dash = .2, gap = .13, segs = [];
    pairs.forEach(([h, a]) => { const p = P(h), q = P(a), L = p.distanceTo(q), k = Math.max(2, Math.round((L + gap) / (dash + gap))), step = L / k;
      for (let i = 0; i < k; i++) segs.push([p.clone().lerp(q, (i * step + gap / 2) / L), p.clone().lerp(q, ((i + 1) * step - gap / 2) / L)]); });
    const g = new THREE.CylinderGeometry(1, 1, 1, 10, 1); g.translate(0, .5, 0);
    const mesh = new THREE.InstancedMesh(g, MD.mat(MD.HB, 'plastic'), segs.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0);
    segs.forEach(([a, b], i) => { const d = b.clone().sub(a), L = d.length(); q.setFromUnitVectors(up, d.normalize()); m4.compose(a, q, new V3(.055, L, .055)); mesh.setMatrixAt(i, m4); });
    parent.add(mesh); F.pick(mesh, 'hbond', 1.5);
    const [h0, a0] = pairs[0], mid = P(h0).lerp(P(a0), .5), lo = new THREE.Object3D(); lo.position.copy(mid); parent.add(lo);
    return { count: pairs.length, mesh, anchor: lo };
  },
  /* a crystal's unit cell seen through the atoms in front of it: its edges again, thinner and faint, drawn over everything, and the atoms
     that belong to it (corners, faces, centre) as faint ghosts, so the block the label names, and the atom at the centre of a bcc cell,
     can be found inside the crowd. An annotation, like the label: unlit, no fog. */
  cellXray(holder, E, corners, atoms, L, ctr, g) {
    const em = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .5, depthTest: false, depthWrite: false, fog: false }), grp = new THREE.Group();
    const cg = new THREE.CylinderGeometry(.035, .035, 1, 6); cg.translate(0, .5, 0);
    const edges = new THREE.InstancedMesh(cg, em, E.length), q = new THREE.Quaternion(), e4 = new THREE.Matrix4();
    E.forEach(([a, b], i) => { const d = corners[b].clone().sub(corners[a]), Ld = d.length(); q.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); e4.compose(corners[a], q, new V3(1, Ld, 1)); edges.setMatrixAt(i, e4); });
    edges.renderOrder = 21; grp.add(edges);
    const inv = new THREE.Matrix4().makeBasis(L[0], L[1], L[2]).invert(), fr = new V3(), mine = [];
    atoms.forEach(a => { fr.set(a[1], a[2], a[3]).add(ctr).applyMatrix4(inv); if (fr.x > -1e-3 && fr.y > -1e-3 && fr.z > -1e-3 && fr.x < 1 + 1e-3 && fr.y < 1 + 1e-3 && fr.z < 1 + 1e-3) mine.push(a); });
    if (mine.length) {
      const sm = (g.userData.meshes || [])[0], R0 = sm ? (sm.userData.radius() || .5) : .5, gm = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .32, depthTest: false, depthWrite: false, fog: false });
      const ring = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), gm, mine.length), m4 = new THREE.Matrix4();
      mine.forEach((a, i) => { const s = (g.userData.meshes.find(m => m.userData.sym === a[0]) || sm).userData.radius() * .55; m4.makeScale(s, s, s).setPosition(a[1], a[2], a[3]); ring.setMatrixAt(i, m4); });
      ring.renderOrder = 20; grp.add(ring);
    }
    holder.add(grp); return grp;
  },
  occPatch(m) {
    return LOOK.patch(m, 'mdocc', sh => {
      sh.vertexShader = 'attribute vec4 aOcc;\nvarying vec4 vOcc;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvOcc = vec4( normalize( normalMatrix * mat3( instanceMatrix ) * ( aOcc.xyz + vec3( 0.0, 0.0, 1e-4 ) ) ), aOcc.w );');
      sh.fragmentShader = 'varying vec4 vOcc;\n' + sh.fragmentShader.replace('#include <aomap_fragment>', `#include <aomap_fragment>
	{ float mdO = 1.0 - vOcc.w * pow( clamp( dot( normal, normalize( vOcc.xyz ) ) * 0.5 + 0.5, 0.0, 1.0 ), 1.6 );
	reflectedLight.indirectDiffuse *= mdO; reflectedLight.indirectSpecular *= mdO;
	reflectedLight.directDiffuse *= mix( 1.0, mdO, 0.55 ); reflectedLight.directSpecular *= mix( 1.0, mdO, 0.55 ); }`);
    });
  },
  /* DNA atom by atom. The four kinds of base pair are taken from a measured structure: the Dickerson-Drew dodecamer, PDB 1BNA (Drew et al.
     1981, data/proteins/1bna.json; X-ray, so no hydrogens), one central pair of each kind (C3·G22, G4·C21, A5·T20, T7·A18). Each pair was put
     in its own frame (y from one C1' atom to the other, z the normal of the bases' plane, along strand A 5'->3') and the local helix axis was
     found from the screw motion between neighbouring pairs of 1BNA; the coordinates below are in that axis frame, in angstroms (x, y across,
     z along the axis). A long helix is then built the way fibre models are: pair i turned 360/10.5 degrees and raised 0.34 nm from pair i-1.
     The joins between neighbouring nucleotides come out 1.0 to 2.6 angstroms long instead of the 1.6 of the real O3'-P bond, hidden inside the
     space-filling spheres. Atom: element, strand (0 = A, 1 = B), part (p phosphate: P, OP1, OP2, O5'; s sugar; b base), x, y, z. */
  DNA_TPL: {
    AT: 'P0p,-0.37,-8.69,-0.6 O0p,-0.33,-10.12,-0.95 O0p,-1.31,-8.3,0.49 O0p,1.09,-8.15,-0.27 C0s,2.04,-7.99,-1.34 C0s,2.82,-6.76,-1.01 O0s,1.91,-5.66,-1.06 C0s,3.43,-6.71,0.39 O0s,4.86,-6.6,0.34 C0s,2.69,-5.55,1.07 C0s,2.37,-4.68,-0.12 N0b,1.17,-3.86,0.14 C0b,-0.1,-4.28,0.43 N0b,-0.99,-3.28,0.48 C0b,-0.28,-2.11,0.2 C0b,-0.77,-0.76,0.11 N0b,-2.1,-0.36,0.35 N0b,0.17,0.15,-0.15 C0b,1.46,-0.24,-0.33 N0b,2.03,-1.42,-0.34 C0b,1.07,-2.36,-0.09 P1p,2.27,10.06,1.53 O1p,2.75,11.48,1.53 O1p,0.96,9.71,2.13 O1p,3.33,9.06,2.16 C1s,4.6,9.07,1.45 C1s,5.36,7.85,1.92 O1s,4.65,6.65,1.55 C1s,5.45,7.75,3.46 O1s,6.81,7.37,3.79 C1s,4.48,6.65,3.89 C1s,4.61,5.67,2.75 N1b,3.62,4.6,2.6 C1b,2.37,4.82,2.17 O1b,1.87,5.92,1.96 N1b,1.69,3.66,2.01 C1b,2.06,2.37,2.25 O1b,1.33,1.4,2.07 C1b,3.39,2.27,2.66 C1b,3.88,0.88,2.97 C1b,4.06,3.36,2.8',
    TA: 'P0p,0.45,-9.58,-1.38 O0p,0.21,-11.01,-1.73 O0p,-0.6,-8.64,-1.78 O0p,1.86,-9.12,-1.95 C0s,3.04,-9.65,-1.33 C0s,4.04,-8.54,-1.04 O0s,3.43,-7.53,-0.2 C0s,4.46,-7.73,-2.28 O0s,5.82,-7.32,-2.21 C0s,3.53,-6.53,-2.13 C0s,3.31,-6.48,-0.63 N0b,2.03,-5.84,-0.29 C0b,0.82,-6.45,-0.11 O0b,0.68,-7.68,-0.18 N0b,-0.22,-5.57,0.11 C0b,-0.17,-4.19,0.2 O0b,-1.23,-3.55,0.38 C0b,1.11,-3.57,0.06 C0b,1.24,-2.06,0.22 C0b,2.13,-4.47,-0.21 P1p,1.29,9.53,1.33 O1p,1.27,10.96,1.68 O1p,-0.05,8.88,1.23 O1p,2.09,9.38,-0.04 C1s,3.53,9.21,-0.08 C1s,4.27,8.82,1.17 O1s,3.81,7.53,1.67 C1s,5.73,8.58,0.86 O1s,6.44,9.08,1.97 C1s,5.87,7.07,0.84 C1s,4.99,6.66,2.0 N1b,4.07,5.53,1.67 C1b,4.36,4.19,1.66 N1b,3.29,3.45,1.37 C1b,2.18,4.29,1.18 C1b,0.83,3.96,0.94 N1b,0.32,2.73,0.83 N1b,0.06,5.03,0.86 C1b,0.61,6.22,1.08 N1b,1.82,6.67,1.31 C1b,2.53,5.62,1.36',
    GC: 'P0p,-1.15,-8.08,-1.82 O0p,-0.92,-9.53,-2.03 O0p,-2.37,-7.61,-1.15 O0p,0.15,-7.42,-1.25 C0s,1.36,-7.74,-1.81 C0s,2.6,-7.12,-1.21 O0s,2.55,-5.69,-1.1 C0s,2.79,-7.54,0.26 O0s,4.11,-8.07,0.53 C0s,2.6,-6.2,0.96 C0s,2.98,-5.15,-0.08 N0b,2.21,-3.95,0.17 C0b,2.63,-2.66,0.39 N0b,1.62,-1.85,0.48 C0b,0.47,-2.63,0.28 C0b,-0.88,-2.24,0.23 O0b,-1.32,-1.08,0.36 N0b,-1.71,-3.34,-0.0 C0b,-1.32,-4.62,-0.16 N0b,-2.25,-5.56,-0.26 N0b,-0.08,-5.01,-0.15 C0b,0.82,-3.98,0.06 P1p,0.25,9.99,2.11 O1p,0.36,11.42,2.46 O1p,-1.11,9.42,1.95 O1p,1.13,9.26,1.02 C1s,2.53,9.33,1.3 C1s,3.2,8.56,0.18 O1s,2.67,7.24,0.06 C1s,4.68,8.54,0.48 O1s,5.4,8.54,-0.75 C1s,4.86,7.11,0.95 C1s,3.58,6.48,0.43 N1b,3.13,5.21,1.07 C1b,1.85,4.8,0.79 O1b,1.12,5.47,0.07 N1b,1.47,3.6,1.32 C1b,2.33,2.82,1.99 N1b,1.87,1.6,2.24 C1b,3.66,3.23,2.38 C1b,4.0,4.45,1.94',
    CG: 'P0p,-0.33,-8.81,-1.76 O0p,0.03,-10.22,-2.0 O0p,-1.67,-8.4,-2.24 O0p,0.67,-7.89,-2.42 C0s,2.05,-7.92,-2.05 C0s,2.74,-6.87,-2.84 O0s,2.62,-5.6,-2.15 C0s,2.21,-6.69,-4.24 O0s,3.06,-7.35,-5.2 C0s,2.28,-5.21,-4.38 C0s,2.83,-4.86,-2.99 N0b,2.07,-3.77,-2.34 C0b,0.75,-3.86,-1.83 O0b,0.18,-4.94,-1.83 N0b,0.12,-2.81,-1.32 C0b,0.8,-1.66,-1.41 N0b,0.12,-0.62,-0.91 C0b,2.15,-1.53,-1.99 C0b,2.76,-2.63,-2.43 P1p,1.85,9.48,2.91 O1p,2.03,10.95,3.0 O1p,0.67,8.98,3.66 O1p,1.87,8.98,1.42 C1s,3.06,9.33,0.69 C1s,3.53,8.3,-0.35 O1s,3.19,6.96,0.08 C1s,5.04,8.33,-0.48 O1s,5.4,8.32,-1.86 C1s,5.43,7.06,0.27 C1s,4.31,6.08,-0.05 N1b,3.98,5.14,1.0 C1b,4.55,4.98,2.23 N1b,3.95,4.07,2.95 C1b,2.98,3.6,2.07 C1b,1.99,2.6,2.27 O1b,1.8,1.89,3.25 N1b,1.21,2.5,1.15 C1b,1.38,3.27,0.03 N1b,0.47,3.08,-0.97 N1b,2.29,4.21,-0.13 C1b,3.03,4.36,0.95',
  },
  /* the DNA scene's helix as atoms: one instanced mesh per colour of the code (the four bases, sugar, phosphate), space-filling at the
     van der Waals radii (Bondi 1964: C 1.70, N 1.55, O 1.52, P 1.80 angstroms), with contact darkening between touching atoms. Old and new
     strands (replication) share the meshes: the new ones come after the old in each, and are drawn only while they exist. */
  VDW: { C: 1.7, N: 1.55, O: 1.52, P: 1.8 },
  dnaAtoms(F, holder, seq, comp, NM, rise, twist) {
    const K = MD.DNA, tpl = {}, A = 0.1 * NM;   // builder units per angstrom
    for (const k in MD.DNA_TPL) tpl[k] = MD.DNA_TPL[k].split(' ').map(s => { const v = s.split(','); return { el: v[0][0], st: +v[0][1], cl: v[0][2], p: new V3(+v[1], +v[3], -+v[2]) }; });   // helix frame (x, y, z) -> builder (x, z, -y): the axis is the builder's y
    const n = seq.length, cls = ['A', 'T', 'G', 'C', 's', 'p'], list = { A: [], T: [], G: [], C: [], s: [], p: [] }, nuc = [];
    for (const isNew of [0, 1]) for (let i = 0; i < n; i++) for (let s = 0; s < 2; s++) {
      const L = s === 0 ? seq[i] : comp[seq[i]], key = seq[i] + comp[seq[i]], end = s === 0 ? i === 0 : i === n - 1;   // a strand's 5' end has no phosphate
      const rec = { i, s, isNew, atoms: [] };
      tpl[key].forEach(a => { if (a.st !== s || (end && a.cl === 'p')) return; const c = a.cl === 'b' ? L : a.cl; rec.atoms.push({ c, k: list[c].length, p: a.p, r: MD.VDW[a.el] * A, el: a.el }); list[c].push(rec); });
      nuc.push(rec);
    }
    const lo = new THREE.IcosahedronGeometry(1, 1), hi = new THREE.IcosahedronGeometry(1, 2), meshes = {}, col = { A: K.A, T: K.T, G: K.G, C: K.C, s: K.sugar, p: K.phos };
    const nOld = {}; cls.forEach(c => { nOld[c] = list[c].filter(r => !r.isNew).length; });
    cls.forEach(c => {
      const N = list[c].length, gl = lo.clone(), gh = hi.clone(), occ = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); gl.setAttribute('aOcc', occ); gh.setAttribute('aOcc', occ);
      const m = new THREE.InstancedMesh(gl, MD.occPatch(MD.mat(col[c], 'plastic')), N); m.userData = { id: c === 's' ? 'sugar' : c === 'p' ? 'phosphate' : 'base_' + c, priority: 1 }; m.frustumCulled = false;
      if (c === 's' || c === 'p') { const cn = new THREE.Color(c === 's' ? K.sugarNew : K.phosNew), co = new THREE.Color(col[c]); m.material.color.setHex(0xffffff); for (let k = 0; k < N; k++) m.setColorAt(k, list[c][k].isNew ? cn : co); }
      m.count = nOld[c]; m.userData.geo = [gl, gh]; holder.add(m); F.pickables.push(m); meshes[c] = m;
    });
    const M = new THREE.Matrix4(), T = new THREE.Matrix4(), _p = new V3(), _q = new THREE.Quaternion(), _s = new V3(), Y = new V3(0, 1, 0);
    const at = {}; nuc.forEach(r => { at[r.isNew + ':' + r.i + ':' + r.s] = r; });
    const pos = new Float32Array(nuc.reduce((a, r) => a + r.atoms.length, 0) * 3); let dirty = true, newOn = false;
    /* where nucleotide (i, slot s, old or new) is: shifted sideways by dx (the daughters part), grown by g from its sugar (a new strand being made) */
    const place = (i, s, isNew, dx, g) => {
      const r = at[isNew + ':' + i + ':' + s]; if (!r) return; _q.setFromAxisAngle(Y, i * twist);
      M.compose(_p.set(dx, (i - (n - 1) / 2) * rise, 0), _q, _s.set(A, A, A));
      let cx = 0, cy = 0, cz = 0, ns = 0; if (g < 1) r.atoms.forEach(a => { if (a.c === 's') { _p.copy(a.p).applyMatrix4(M); cx += _p.x; cy += _p.y; cz += _p.z; ns++; } });
      r.atoms.forEach(a => {
        _p.copy(a.p).applyMatrix4(M); if (g < 1 && ns) { _p.x = cx / ns + (_p.x - cx / ns) * g; _p.y = cy / ns + (_p.y - cy / ns) * g; _p.z = cz / ns + (_p.z - cz / ns) * g; }
        const rr = a.r * Math.max(g, 1e-4); T.makeScale(rr, rr, rr).setPosition(_p); meshes[a.c].setMatrixAt(a.k, T); (a.w || (a.w = new V3())).copy(_p); a.rr = rr;
      });
      dirty = true;
    };
    const occNow = () => {   // contact darkening for what is drawn now (old strands, and the new while they exist)
      const all = []; nuc.forEach(r => { if (r.isNew && !newOn) return; r.atoms.forEach(a => { if (a.rr > 1e-3) all.push(a); }); });
      const C = new Float32Array(all.length * 3), R = new Float32Array(all.length); all.forEach((a, j) => { C[3 * j] = a.w.x; C[3 * j + 1] = a.w.y; C[3 * j + 2] = a.w.z; R[j] = a.rr; });
      const o = MD.occlusion(C, R, 2.2 * 1.8 * A); all.forEach((a, j) => { meshes[a.c].geometry.attributes.aOcc.array.set(o.subarray(4 * j, 4 * j + 4), 4 * a.k); });
      cls.forEach(c => { meshes[c].geometry.attributes.aOcc.needsUpdate = true; });
    };
    let tOcc = 0;
    const api = {
      meshes, place,
      showNew(on) { if (on === newOn) return; newOn = on; cls.forEach(c => { meshes[c].count = on ? list[c].length : nOld[c]; }); dirty = true; },
      commit(force) { if (!dirty) return; cls.forEach(c => { meshes[c].instanceMatrix.needsUpdate = true; if (meshes[c].instanceColor) meshes[c].instanceColor.needsUpdate = true; });
        const now = performance.now(); if (LOOK.quality === 'high' && (force || now - tOcc > 350)) { tOcc = now; occNow(); } dirty = false; },
      lod(hiOn) { cls.forEach(c => { const g = meshes[c].userData.geo[hiOn ? 1 : 0]; if (meshes[c].geometry !== g) meshes[c].geometry = g; }); },
      /* the angle (as the builder's spos counts it) of the middle of the minor groove at pair i, less the pair's own turn: between the two
         C1' atoms, on the side where they are closer together */
      minorAt(i) { const g = s => { const r = at['0:' + i + ':' + s], a = r.atoms.filter(x => x.c === 's').pop().w; return Math.atan2(-a.z, a.x); };
        let a0 = g(0), a1 = g(1), d = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0)); return a0 + d / 2 - i * twist; },
      atom(i, s, cl) { const r = at['0:' + i + ':' + s]; const a = r && r.atoms.find(x => x.c === cl || (cl === 'b' && 'ATGC'.includes(x.c))); return a ? a.w : null; },
    };
    return api;
  },
};
/* ---------- The animal cell under the realistic look: a model with the counts, sizes and forms of a real one (MDC) ----------
   Built over the old schematic (js/levels_v2.js, BUILD.cell), whose parts are hidden; only the membrane, the hidden cytoplasm (for
   clicks) and the membrane close-up are kept. Builder units: 1 = 1/1.2 µm (the old builder's), so the nucleus anchor, the DNA frame
   and the tests that use c.nucPos and c.k keep working. Every number is in the scene's note or docs/notes; where one is a choice, it
   says so. The cell is cut open, as a model on a bench is: the half toward the visitor is taken away (the plane through the nucleus
   facing the arrival view), the nucleus is kept whole but for one eighth cut out of it, and the endoplasmic reticulum round the
   nucleus is kept with it. Only with the look on (MD.on); nothing here runs otherwise. */
const MDC = {
  U: 1.2,                                            // builder units per micrometre
  N0: [0.3194, 0.2555, 0.9125], UP0: [-0.0844, 0.9668, -0.2412],   // the view on arrival from the skin (the cell frame's own axes): the cut faces it
  COL: { membrane: 0xd9cfc6, nucleus: 0x9c92bd, pore: 0xbcb2d6, hetero: 0x4f4279, eu: 0xb3a4d6, nucleolus: 0x54467a, rer: 0x8fa7b3, ser: 0xa7b9c0,
    golgi: 0xc9a865, vesicle: 0xd2bf8e, mito: 0xc98a62, cristae: 0xe6b796, lysosome: 0x9ea37c, ribosome: 0xe4dccb, mt: 0xcfd6dc, actin: 0xc9b9ae, centriole: 0xd8d2c6 },
  /* smooth noise made of sines, the same in JavaScript and in the shaders, so the holes in an ER sheet (drawn by the shader) and the
     ribosomes put on it (placed here) agree */
  sn(x, y, z) { return Math.sin(x * 1.7 + 1.3 * Math.sin(z * 1.1)) * Math.sin(y * 1.9 + 1.1 * Math.sin(x * .9)) * Math.sin(z * 1.5 + 1.2 * Math.sin(y * 1.3)); },
  SN: 'float mdSn( vec3 p ) { return sin( p.x * 1.7 + 1.3 * sin( p.z * 1.1 ) ) * sin( p.y * 1.9 + 1.1 * sin( p.x * 0.9 ) ) * sin( p.z * 1.5 + 1.2 * sin( p.y * 1.3 ) ); }\n',
  fen(x, y, z, f) { return .62 * MDC.sn(x * f, y * f, z * f) + .38 * MDC.sn(x * f * 2.3 + 3.1, y * f * 2.3 + 1.7, z * f * 2.3 + 5.3); },
  /* one geometry from many (position, normal; indexed), each with its own matrix */
  merge(list) {
    let nv = 0, ni = 0; list.forEach(([g]) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), I = new Uint32Array(ni), v = new V3(), nm = new THREE.Matrix3(); let ov = 0, oi = 0;
    list.forEach(([g, m]) => {
      const p = g.attributes.position, n = g.attributes.normal; if (m) nm.getNormalMatrix(m);
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); if (m) v.applyMatrix4(m); P.set([v.x, v.y, v.z], 3 * (ov + i)); if (n) { v.fromBufferAttribute(n, i); if (m) v.applyMatrix3(nm).normalize(); N.set([v.x, v.y, v.z], 3 * (ov + i)); } }
      if (g.index) for (let i = 0; i < g.index.count; i++) I[oi + i] = g.index.getX(i) + ov; else for (let i = 0; i < p.count; i++) I[oi + i] = i + ov;
      ov += p.count; oi += g.index ? g.index.count : p.count; g.dispose();
    });
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setIndex(new THREE.BufferAttribute(I, 1)); return out;
  },
  /* the cut: every material of the model knows where it is in the cell (vMdP, builder units) and drops what lies in the half that was
     taken away (mode 1), or in the eighth of the nucleus that was cut out (mode 2); mode 0 keeps all. Inside surfaces (seen through a cut)
     are drawn a little darker, as the inside of a cut fruit is in shadow. */
  cut(m, S, mode, o) {
    o = o || {}; m.side = THREE.DoubleSide;
    return LOOK.patch(m, 'mdcut' + mode + (o.fen ? 'f' + o.fen.join('_') : '') + (o.mask ? 'm' + o.mask.join('_') : '') + (o.dark === undefined ? '' : 'd' + o.dark), sh => {
      Object.assign(sh.uniforms, S.uni);
      sh.vertexShader = 'uniform mat4 uMdW2L;\nvarying vec3 vMdP;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
	{ vec4 mdQ = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		mdQ = instanceMatrix * mdQ;
	#endif
		vMdP = ( uMdW2L * modelMatrix * mdQ ).xyz; }`);
      const test = mode === 1 ? 'dot( vMdP - uMdC, uMdN ) > 0.0' : mode === 2 ? '( dot( vMdP - uMdC, uMdA ) > 0.0 && dot( vMdP - uMdC, uMdB ) > 0.0 && dot( vMdP - uMdC, uMdN2 ) > 0.0 )' : 'false';
      const fen = (o.mask ? `if ( mdSn( vMdP * ${o.mask[0].toFixed(3)} + vec3( 7.3, 2.9, 4.1 ) ) > ${o.mask[1].toFixed(3)} ) discard;\n\t` : '') + (o.fen ? `if ( 0.62 * mdSn( vMdP * ${o.fen[0].toFixed(3)} ) + 0.38 * mdSn( vMdP * ${(o.fen[0] * 2.3).toFixed(3)} + vec3( 3.1, 1.7, 5.3 ) ) > ${o.fen[1].toFixed(3)} ) discard;` : '');
      sh.fragmentShader = 'uniform vec3 uMdC, uMdN, uMdA, uMdB, uMdN2;\nvarying vec3 vMdP;\n' + MDC.SN + sh.fragmentShader.replace('void main() {', `void main() {
	if ( ${test} ) discard;
	${fen}`);
      if (o.dark !== 0 && sh.fragmentShader.includes('#include <color_fragment>')) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
	if ( ! gl_FrontFacing ) diffuseColor.rgb *= ${(o.dark === undefined ? .72 : o.dark).toFixed(2)};`);
    });
  },
  mat(S, col, kind, mode, o) { const m = MD.mat(col, kind || 'wet', o && o.extra ? { extra: o.extra } : undefined); m._lkUn = true; return MDC.cut(m, S, mode, o); },
  ell(a, p) { return (p.x / a.x) ** 2 + (p.y / a.y) ** 2 + (p.z / a.z) ** 2; },
  build(F, c) {
    const U = MDC.U, K = MDC.COL, r = rng(4242), TAU2 = Math.PI * 2;
    let mem = null; c.group.traverse(o => { if (!mem && o.userData && o.userData.id === 'membrane' && o.isMesh) mem = o; });
    if (!mem) return; const cellG = mem.parent, fill = cellG.children.find(o => o.userData && o.userData.id === 'cytoplasm');
    /* the old schematic's parts: hidden, no longer picked or labelled */
    const keep = new Set([mem, fill]); const gone = new Set();
    cellG.children.forEach(o => { if (!keep.has(o)) { o.visible = false; o.traverse(x => gone.add(x)); } });
    for (let i = c.pickables.length - 1; i >= 0; i--) if (gone.has(c.pickables[i])) c.pickables.splice(i, 1);
    (F.labels || []).slice().forEach(L => { let x = L.obj; while (x && !gone.has(x)) x = x.parent; if (x) { L.el.remove(); F.labels.splice(F.labels.indexOf(L), 1); } });
    const G = new THREE.Group(); cellG.add(G); G.userData.mdc = true;
    /* the geometry of the cut */
    const nN = new V3().fromArray(MDC.N0).normalize(), up = new V3().fromArray(MDC.UP0), rt = new V3().crossVectors(up, nN).normalize(); up.crossVectors(nN, rt).normalize();
    const C = c.nucPos.clone(), uni = { uMdW2L: { value: new THREE.Matrix4() }, uMdC: { value: C.clone() }, uMdN: { value: nN.clone() },
      uMdA: { value: rt.clone().addScaledVector(nN, .55).normalize() }, uMdB: { value: up.clone().addScaledVector(nN, .55).normalize() }, uMdN2: { value: nN.clone() } };
    const S = { uni, G };
    const gone1 = p => _mdV.copy(p).sub(C).dot(nN) > 0;   // in the half taken away
    if (!F._mdcHook) { F._mdcHook = true; const b0 = F.scene.onBeforeRender;   // once per frame: the world-to-cell matrix of the model built last
      F.scene.onBeforeRender = function (rr, sc, cm) { const M = F._mdc; if (M && M.G.parent) { M.G.updateWorldMatrix(true, false); M.uni.uMdW2L.value.copy(M.G.matrixWorld).invert(); } if (b0) b0.call(this, rr, sc, cm); }; }
    const E = new V3(12, 12 * .82, 12 * .92);            // the membrane (the old builder's: 20 x 16.4 x 18.4 µm)
    const inCell = (p, m) => MDC.ell(new V3(E.x - m, E.y - m, E.z - m), p) < 1;
    /* membrane: the old film, cut, seen from inside where it is open; its cut edge drawn as the two leaflets of the bilayer */
    MDC.cut(mem.material, S, 1, { dark: 0 }); mem.material.needsUpdate = true;
    if (fill) { fill.material.visible = false; }
    const rim = []; { const n = 160, pts = [[], []]; for (let i = 0; i <= n; i++) { const a = i / n * TAU2, d = rt.clone().multiplyScalar(Math.cos(a)).addScaledVector(up, Math.sin(a));
        // the plane through C meets the ellipsoid at C + t d: solve |(C + t d) / E| = 1
        const q = new V3(C.x / E.x, C.y / E.y, C.z / E.z), w = new V3(d.x / E.x, d.y / E.y, d.z / E.z), A2 = w.dot(w), B2 = 2 * q.dot(w), C2 = q.dot(q) - 1, t = (-B2 + Math.sqrt(B2 * B2 - 4 * A2 * C2)) / (2 * A2);
        const p = C.clone().addScaledVector(d, t), nr = new V3(p.x / E.x / E.x, p.y / E.y / E.y, p.z / E.z / E.z).normalize();
        pts[0].push(p.clone().addScaledVector(nr, .05)); pts[1].push(p.clone().addScaledVector(nr, -.05)); }
      pts.forEach(P => rim.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P, true), n, .028, 5, true)])); }
    const rimM = new THREE.Mesh(MDC.merge(rim), MDC.mat(S, K.membrane, 'matte', 0)); rimM.userData = { id: 'membrane', priority: 0 }; G.add(rimM); c.pickables.push(rimM);
    /* ---- nucleus: an ellipsoid of 10% of the cell's volume (BioNumbers 113848), its surface not quite smooth */
    const vCell = 4 / 3 * Math.PI * E.x * E.y * E.z, k3 = Math.cbrt(.1 * vCell / (4 / 3 * Math.PI * 5.3 * 4.5 * 5.0)), NA = new V3(5.3, 4.5, 5.0).multiplyScalar(k3);
    const nucG = new THREE.Group(); nucG.position.copy(C); G.add(nucG);
    const ng = new THREE.SphereGeometry(1, 72, 48), npos = ng.attributes.position;
    const nucSurf = (dir, out) => { const s = 1 + .025 * MDC.sn(dir.x * 3.1, dir.y * 3.1, dir.z * 3.1) + .012 * MDC.sn(dir.x * 7 + 2, dir.y * 7, dir.z * 7 + 1); return out.set(dir.x * NA.x * s, dir.y * NA.y * s, dir.z * NA.z * s); };
    for (let i = 0; i < npos.count; i++) { const d = new V3().fromBufferAttribute(npos, i).normalize(); nucSurf(d, d); npos.setXYZ(i, d.x, d.y, d.z); } ng.computeVertexNormals();
    const env = new THREE.Mesh(ng, MDC.mat(S, K.nucleus, 'wet', 2)); env.userData = { id: 'nucleus', priority: .5 }; nucG.add(env); c.pickables.push(env);
    /* nuclear pores: about 3,900 in a HeLa nucleus of 374 µm³ (Maul and Deaven 1977; BioNumbers 101390, 101402), so about 15.7 per µm² of
       envelope; here at that density over this nucleus, except in the eighth cut out. Each is drawn as its ring, 0.12 µm across with a
       channel about 0.06 µm wide (the in-cell structure of the human pore, 2021), on a flat disc that lies on the envelope. */
    const ap = 1.6075, areaU = 4 * Math.PI * Math.pow((Math.pow(NA.x * NA.y, ap) + Math.pow(NA.x * NA.z, ap) + Math.pow(NA.y * NA.z, ap)) / 3, 1 / ap), areaUm = areaU / (U * U);
    const nPore = Math.round(15.7 * areaUm), poreTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 30, 0, TAU2); g.arc(32, 32, 15, 0, TAU2, true); g.fill(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU2; g.beginPath(); g.arc(32 + Math.cos(a) * 23, 32 + Math.sin(a) * 23, 6.5, 0, TAU2); g.fill(); }
      const t = new THREE.CanvasTexture(cv); return t; })();
    const poreM = MDC.mat(S, K.pore, 'wet', 2, { extra: { alphaMap: poreTex, alphaTest: .5 } });
    const pq = new THREE.PlaneGeometry(.12 * U, .12 * U), pores = [], gold = Math.PI * (3 - Math.sqrt(5)), cl = new V3();
    for (let i = 0; i < Math.round(nPore); i++) {
      const y = 1 - (i + .5) / nPore * 2, rr2 = Math.sqrt(1 - y * y), a = i * gold + (r() - .5) * 3.2 / Math.sqrt(nPore), d = new V3(Math.cos(a) * rr2, y + (r() - .5) * 2.4 / Math.sqrt(nPore), Math.sin(a) * rr2).normalize();
      const p = nucSurf(d, new V3()), nr = new V3(p.x / NA.x / NA.x, p.y / NA.y / NA.y, p.z / NA.z / NA.z).normalize(); cl.copy(p).add(C);
      if (cl.clone().sub(C).dot(uni.uMdA.value) > 0 && cl.clone().sub(C).dot(uni.uMdB.value) > 0 && cl.clone().sub(C).dot(nN) > 0) continue;
      pores.push([p.addScaledVector(nr, .012), nr]);
    }
    const poreI = new THREE.InstancedMesh(pq, poreM, pores.length), q = new THREE.Quaternion(), Z = new V3(0, 0, 1), m4 = new THREE.Matrix4(), one = new V3(1, 1, 1);
    pores.forEach(([p, nr], i) => { q.setFromUnitVectors(Z, nr); m4.compose(p, q, one); poreI.setMatrixAt(i, m4); });
    poreI.frustumCulled = false; poreI.userData = { id: 'pore', priority: .6, info: MDC.INFO.pore(pores.length) }; nucG.add(poreI); c.pickables.push(poreI);
    /* nucleoli: one to five in a mammalian nucleus, 0.5 to 5 µm (BioNumbers 107499, 107498): two here, 1.9 and 1.3 µm */
    // placed so that the faces of the cut pass through them (a point's distances from the three cut planes: eA, eB, eN)
    const e2p = (a, b, n) => new V3(a, b, n).applyMatrix3(new THREE.Matrix3().set(...uni.uMdA.value.toArray(), ...uni.uMdB.value.toArray(), ...nN.toArray()).invert());
    const NUCL = [[e2p(.15, 1.5, 1.2), .95 * U], [e2p(1.7, -.25, .9), .65 * U]];
    const nlM = MDC.mat(S, K.nucleolus, 'matte', 2); const nlG = MDC.merge(NUCL.map(([p, R]) => { const g = new THREE.IcosahedronGeometry(1, 3), a = g.attributes.position;
      for (let i = 0; i < a.count; i++) { const v = new V3().fromBufferAttribute(a, i), s = 1 + .08 * MDC.sn(v.x * 5, v.y * 5, v.z * 5); a.setXYZ(i, v.x * s, v.y * s, v.z * s); } g.computeVertexNormals(); return [g, new THREE.Matrix4().makeScale(R, R, R).setPosition(p)]; }));
    const nlMesh = new THREE.Mesh(nlG, nlM); nlMesh.userData = { id: 'nucleolus', priority: 2 }; nucG.add(nlMesh); c.pickables.push(nlMesh);
    /* the faces of the cut-out eighth: chromatin, denser (heterochromatin) at the envelope and round the nucleoli, looser inside; the
       nucleoli where the faces pass through them. A texture of noise, not a map of real chromatin. */
    const capM = MDC.capMat(S, NA, NUCL, nN); const caps = [];
    [[uni.uMdA.value, uni.uMdB.value, nN], [uni.uMdB.value, uni.uMdA.value, nN], [nN, uni.uMdA.value, uni.uMdB.value]].forEach(([pn]) => {
      // a disc on the plane through C with normal pn, filling the nucleus there; the shader keeps the part that faces the open eighth
      const u1 = new V3().crossVectors(pn, Math.abs(pn.y) < .9 ? new V3(0, 1, 0) : new V3(1, 0, 0)).normalize(), u2 = new V3().crossVectors(pn, u1), segs = 72, rings = 14, P = [], I = [];
      for (let j = 0; j <= rings; j++) for (let i = 0; i < segs; i++) { const a = i / segs * TAU2, d = u1.clone().multiplyScalar(Math.cos(a)).addScaledVector(u2, Math.sin(a)); const e = nucSurf(new V3(d.x / NA.x, d.y / NA.y, d.z / NA.z).normalize(), new V3()).length() * .995; const p = d.multiplyScalar(e * j / rings); P.push(p.x, p.y, p.z); }
      for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) { const a = j * segs + i, b = j * segs + (i + 1) % segs, c2 = a + segs, d2 = b + segs; I.push(a, c2, b, b, c2, d2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); const nrm = []; for (let i = 0; i < P.length / 3; i++) nrm.push(pn.x, pn.y, pn.z); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(I);
      caps.push([g]);
    });
    const capMesh = new THREE.Mesh(MDC.merge(caps), capM); capMesh.userData = { id: 'chromatin', priority: 1.5 }; nucG.add(capMesh); c.pickables.push(capMesh);
    /* ---- rough ER: flattened sacs (cisternae) stacked round the nucleus, 60 to 100 nm thick (BioNumbers 111388), joined to the outer
       membrane of the envelope (they are one membrane: OpenStax Biology 2e, 4.4); edges and holes (fenestrae) from the noise */
    const rerL = [], rerD = [.3, .6, .92, 1.28, 1.7];
    const sheetPt = (d, k) => { const p = nucSurf(d, new V3()), nr = new V3(p.x / NA.x / NA.x, p.y / NA.y / NA.y, p.z / NA.z / NA.z).normalize();
      return p.addScaledVector(nr, rerD[k] * U * .9 + .18 * MDC.sn(d.x * 4 + k, d.y * 4, d.z * 4 - k)).add(C); };
    rerD.forEach((dd, k) => { const g = new THREE.SphereGeometry(1, 56, 36), a = g.attributes.position;
      for (let i = 0; i < a.count; i++) { const p = sheetPt(new V3().fromBufferAttribute(a, i).normalize(), k); a.setXYZ(i, p.x, p.y, p.z); }
      g.computeVertexNormals(); rerL.push([g]); });
    // where a sheet meets the next, or the envelope: short necks (the sheets are continuous with each other and with the envelope)
    for (let k = 0; k < 70; k++) { const d = new V3(gauss(r), gauss(r), gauss(r)).normalize(), j = Math.floor(r() * rerD.length); const p0 = nucSurf(d, new V3()), nr = new V3(p0.x / NA.x / NA.x, p0.y / NA.y / NA.y, p0.z / NA.z / NA.z).normalize();
      const a = j ? rerD[j - 1] * U * .9 : 0, b = rerD[j] * U * .9, g = new THREE.CylinderGeometry(.045 * U, .045 * U, Math.max(.05, b - a), 7, 1, true); q.setFromUnitVectors(new V3(0, 1, 0), nr);
      rerL.push([g, new THREE.Matrix4().compose(p0.clone().addScaledVector(nr, (a + b) / 2).add(C), q, one)]); }
    const rerM = MDC.mat(S, K.rer, 'matte', 1, { fen: [.62, .3], mask: [.55, .2] }), rer = new THREE.Mesh(MDC.merge(rerL), rerM); rer.userData = { id: 'er', priority: 1 }; G.add(rer); c.pickables.push(rer);
    const rerOn = p => MDC.fen(p.x, p.y, p.z, .62) <= .3 && MDC.sn(p.x * .55 + 7.3, p.y * .55 + 2.9, p.z * .55 + 4.1) <= .2;
    /* ---- the centrosome: two centrioles at right angles, each about 0.25 µm across and 0.5 µm long, nine triplets of microtubules
       (reviews of centriole structure), beside the nucleus; the Golgi ribbon round it */
    const gDir = rt.clone().multiplyScalar(.82).addScaledVector(up, -.42).addScaledVector(nN, -.38).normalize();
    const cs = C.clone().add(nucSurf(new V3(gDir.x / NA.x, gDir.y / NA.y, gDir.z / NA.z).normalize(), new V3()).multiplyScalar(1).addScaledVector(gDir, 1.35));
    const cenL = [], tri = new THREE.CylinderGeometry(.0125 * U, .0125 * U, .5 * U, 6, 1);
    [[new V3(0, 1, 0), 0], [new V3(1, 0, 0), .32]].forEach(([ax, off]) => { const qa = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), ax);
      for (let b = 0; b < 9; b++) for (let t = 0; t < 3; t++) { const a = b / 9 * TAU2 + t * .1, rad = (.11 - t * .022) * U; const p = new V3(Math.cos(a) * rad, 0, Math.sin(a) * rad).applyQuaternion(qa).add(cs).addScaledVector(gDir, off * U);
        cenL.push([tri.clone(), new THREE.Matrix4().compose(p, qa, one)]); } });
    const cen = new THREE.Mesh(MDC.merge(cenL), MDC.mat(S, K.centriole, 'matte', 1)); cen.userData = { id: 'centrosome', priority: 1.2, info: MDC.INFO.centrosome() }; G.add(cen); c.pickables.push(cen);
    /* ---- Golgi: a ribbon 5 to 7 µm long beside the centrosome, of stacks of four to six flattened sacs (reviews of Golgi structure);
       here five stacks of five, each sac about 1.3 µm across, curved, with holes near its rim */
    const gl = [], gq = new THREE.Quaternion(), side = new V3().crossVectors(gDir, nN).normalize();
    for (let s = 0; s < 5; s++) { const t = (s - 2) / 2, ctr = cs.clone().addScaledVector(side, t * 1.55 * U).addScaledVector(gDir, (.45 + .35 * t * t) * U); const ax = gDir.clone().addScaledVector(side, -t * .45).normalize();
      gq.setFromUnitVectors(new V3(0, 1, 0), ax);
      for (let k = 0; k < 5; k++) { const R = (1.0 - k * .05) * U, g = new THREE.SphereGeometry(R, 30, 5, 0, TAU2, 0, .62 / (1 + k * .04)); const a = g.attributes.position;
        for (let i = 0; i < a.count; i++) { const v = new V3().fromBufferAttribute(a, i); v.y *= .55; a.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals();
        gl.push([g, new THREE.Matrix4().compose(ctr.clone().addScaledVector(ax, k * .1 * U - R * .55), gq, one)]); } }
    const golM = MDC.mat(S, K.golgi, 'wet', 1, { fen: [1.9, .62] }), gol = new THREE.Mesh(MDC.merge(gl), golM); gol.userData = { id: 'golgi', priority: 1 }; G.add(gol); c.pickables.push(gol);
    /* ---- mitochondria: 0.27 to 0.31 µm³ each, an ellipsoid of axes 5 : 1.38 : 1, 9.4 to 11% of the cytoplasm's volume, 0.35 to 0.43 per
       µm³ of cytoplasm (HeLa cells: Posakony, England and Attardi 1977, Table II). Here 0.4 per µm³, in the half that is kept; drawn
       bent a little, as they lie along microtubules, aligned outward from the centrosome. */
    const vCyto = (vCell - 4 / 3 * Math.PI * NA.x * NA.y * NA.z) / (U * U * U), nMitoAll = Math.round(.4 * vCyto);
    const c0 = Math.cbrt(.29 / (4 / 3 * Math.PI * 5 * 1.38)), MA = new V3(5 * c0, 1.38 * c0, c0).multiplyScalar(U);   // semi-axes in builder units
    const occ = [], avoid = (p, R) => { const d = p.clone().sub(C); if (MDC.ell(new V3(NA.x + R + .35, NA.y + R + .35, NA.z + R + .35), d) < 1) return true; if (p.distanceTo(cs) < 2.4 * U) return true; for (const [o, ro] of occ) if (o.distanceToSquared(p) < (R + ro) ** 2) return true; return false; };
    const mito = [];
    for (let k = 0; k < nMitoAll * 3 && mito.length < nMitoAll; k++) {
      const p = new V3((r() * 2 - 1) * E.x, (r() * 2 - 1) * E.y, (r() * 2 - 1) * E.z); if (!inCell(p, .55)) continue;
      const dn = p.distanceTo(C) / 10; if (r() > .55 + .45 * Math.exp(-dn * dn)) continue;   // more of them round the nucleus
      if (MDC.ell(new V3(NA.x + .3, NA.y + .3, NA.z + .3), p.clone().sub(C)) < 1) continue;
      if (_mdV.copy(p).sub(C).dot(nN) > .5) { mito.push(null); continue; }   // in the half taken away: counted, not drawn
      const s = .7 + r() * .7, R = MA.x * s * .5; if (avoid(p, R)) continue; occ.push([p, R]);
      const ax = p.clone().sub(cs).normalize().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.9)).normalize();
      mito.push({ p, ax, s, w: .85 + r() * .3, roll: r() * TAU2, bend: Math.floor(r() * 3) });
    }
    const mitoDrawn = mito.filter(Boolean);
    const bentGeo = (bend, segL, segR) => { const g = new THREE.SphereGeometry(1, segR, segL), a = g.attributes.position; g.rotateZ(Math.PI / 2);
      for (let i = 0; i < a.count; i++) { const v = new V3().fromBufferAttribute(a, i); const bb = [0, .55, 1.0][bend]; v.y += bb * (1 - v.x * v.x) - bb * .5; a.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; };
    const mitoM = MDC.mat(S, K.mito, 'wet', 1, { dark: .62 }), mitoMesh = [0, 1, 2].map(b => { const L = mitoDrawn.filter(x => x.bend === b), im = new THREE.InstancedMesh(bentGeo(b, 6, 8), mitoM, L.length); im.userData = { id: 'mito', priority: 1 }; im.frustumCulled = false; L.forEach((x, i) => { x.inst = [im, i]; }); G.add(im); c.pickables.push(im); return im; });
    const mxOf = (x, out) => { q.setFromUnitVectors(new V3(1, 0, 0), x.ax); const qr = new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), x.roll); q.multiply(qr); return out.compose(x.p, q, new V3(MA.x * x.s, MA.y * x.w, MA.z * x.w)); };
    mitoDrawn.forEach(x => { mxOf(x, m4); x.inst[0].setMatrixAt(x.inst[1], m4); });
    /* ---- lysosomes: 50 to 1,000 a cell, typically 0.5 µm across, 0.1 to 1.2 (BioNumbers 107483, 106072; 0.34 µm on average in HeLa);
       here 300 in the whole cell, 0.25 to 0.6 µm, more of them near the nucleus */
    const lyso = []; for (let k = 0; k < 4000 && lyso.length < 300; k++) { const p = new V3((r() * 2 - 1) * E.x, (r() * 2 - 1) * E.y, (r() * 2 - 1) * E.z); if (!inCell(p, .5)) continue; const dn = p.distanceTo(C) / 9; if (r() > .35 + .65 * Math.exp(-dn * dn)) continue;
      if (MDC.ell(new V3(NA.x + .3, NA.y + .3, NA.z + .3), p.clone().sub(C)) < 1) continue;
      if (_mdV.copy(p).sub(C).dot(nN) > .4) { lyso.push(null); continue; } const R = (.125 + r() * .175) * U; if (avoid(p, R)) continue; occ.push([p, R]); lyso.push({ p, R }); }
    const lysoD = lyso.filter(Boolean), lysoI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), MDC.mat(S, K.lysosome, 'matte', 1), lysoD.length);
    lysoD.forEach((x, i) => { m4.makeScale(x.R, x.R * (.85 + r() * .3), x.R).setPosition(x.p); lysoI.setMatrixAt(i, m4); }); lysoI.frustumCulled = false; lysoI.userData = { id: 'lysosome', priority: 1 }; G.add(lysoI); c.pickables.push(lysoI);
    /* ---- vesicles near the Golgi and through the cytoplasm (a choice of number and size: tens of nanometres to 0.15 µm) */
    const ves = []; for (let k = 0; k < 3000 && ves.length < 420; k++) { const nearG = k % 2 === 0, p = nearG ? cs.clone().addScaledVector(gDir, .6 * U).add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(1.1 * U)) : new V3((r() * 2 - 1) * E.x, (r() * 2 - 1) * E.y, (r() * 2 - 1) * E.z);
      if (!inCell(p, .3) || gone1(p)) continue; const R = (.035 + r() * .04) * U; if (avoid(p, R)) continue; ves.push([p, R]); }
    const vesI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), MDC.mat(S, K.vesicle, 'wet', 1), ves.length); ves.forEach(([p, R], i) => { m4.makeScale(R, R, R).setPosition(p); vesI.setMatrixAt(i, m4); });
    vesI.frustumCulled = false; vesI.userData = { id: 'vesicle', priority: 1, info: MDC.INFO.vesicle() }; G.add(vesI); c.pickables.push(vesI);
    /* ---- smooth ER: a net of tubules 60 to 100 nm across (BioNumbers 111388) out in the cytoplasm, meeting in threes */
    const nodes = []; for (let k = 0; k < 6000 && nodes.length < 340; k++) { const p = new V3((r() * 2 - 1) * E.x, (r() * 2 - 1) * E.y, (r() * 2 - 1) * E.z); if (!inCell(p, .6) || _mdV.copy(p).sub(C).dot(nN) > .6) continue; if (MDC.ell(new V3(NA.x + 2.3 * U, NA.y + 2.3 * U, NA.z + 2.3 * U), p.clone().sub(C)) < 1) continue; if (nodes.some(o => o.distanceToSquared(p) < 1.1)) continue; nodes.push(p); }
    const serL = [], deg = nodes.map(() => 0), seen = new Set();
    nodes.forEach((p, i) => { const nb = nodes.map((o, j) => [o.distanceToSquared(p), j]).filter(([d, j]) => j !== i && d < 7).sort((a, b) => a[0] - b[0]);
      for (const [, j] of nb) { if (deg[i] >= 3) break; if (deg[j] >= 3 || seen.has(Math.min(i, j) + ':' + Math.max(i, j))) continue; seen.add(Math.min(i, j) + ':' + Math.max(i, j)); deg[i]++; deg[j]++;
        const a = p, b = nodes[j], mid = a.clone().lerp(b, .5).add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.25));
        serL.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 6, .04 * U, 5, false)]); } });
    const ser = new THREE.Mesh(MDC.merge(serL), MDC.mat(S, K.ser, 'matte', 1)); ser.userData = { id: 'er', priority: 1 }; G.add(ser); c.pickables.push(ser);
    /* ---- microtubules: from the centrosome outward to the cortex, 25 nm across (OpenStax Biology 2e, 4.5): drawn as lines one pixel wide
       from afar (far wider than they are), as tubes of their true width close in. How many a cell has is not sourced here: 140 are drawn. */
    const mtP = [], mtCurves = [];
    for (let k = 0; k < 400 && mtCurves.length < 140; k++) { let d = new V3(gauss(r), gauss(r), gauss(r)).normalize(); if (d.dot(nN) > .35) continue; const pts = [cs.clone()]; let p = cs.clone();
      for (let s = 0; s < 60; s++) { d.add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.12)).normalize(); const nx = p.clone().addScaledVector(d, .35 * U);
        const dn = nx.clone().sub(C); if (MDC.ell(new V3(NA.x + .25, NA.y + .25, NA.z + .25), dn) < 1) { const nr = new V3(dn.x / NA.x / NA.x, dn.y / NA.y / NA.y, dn.z / NA.z / NA.z).normalize(); d.addScaledVector(nr, -d.dot(nr) * 1.3).normalize(); continue; }
        if (!inCell(nx, .25)) break; p = nx; pts.push(p.clone()); }
      if (pts.length < 6) continue; mtCurves.push(pts); for (let i = 1; i < pts.length; i++) mtP.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z); }
    const lineMat = (col, op) => { const m = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false }); return MDC.cut(m, S, 1, { dark: 0 }); };
    const mtg = new THREE.BufferGeometry(); mtg.setAttribute('position', new THREE.Float32BufferAttribute(mtP, 3)); const mtL = new THREE.LineSegments(mtg, lineMat(K.mt, .55)); mtL.userData.noHit = true; G.add(mtL);
    let mtT = null; const mtTubes = () => { if (mtT) return mtT; mtT = new THREE.Mesh(MDC.merge(mtCurves.map(P => [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), P.length, .0125 * U, 5, false)])), MDC.mat(S, K.mt, 'matte', 1)); mtT.userData = { id: 'microtubule', priority: 1.1, info: MDC.INFO.microtubule() }; mtT.visible = false; G.add(mtT); c.pickables.push(mtT); return mtT; };
    /* ---- the actin cortex: a mesh of filaments just inside the membrane, 7 nm thick (OpenStax 4.5); drawn as one-pixel lines */
    const acP = []; for (let k = 0; k < 9000; k++) { const d = new V3(gauss(r), gauss(r), gauss(r)).normalize(); const p = new V3(d.x * E.x, d.y * E.y, d.z * E.z).multiplyScalar(.985); if (gone1(p)) continue;
      const nr = new V3(p.x / E.x / E.x, p.y / E.y / E.y, p.z / E.z / E.z).normalize(), t = new V3(gauss(r), gauss(r), gauss(r)); t.addScaledVector(nr, -t.dot(nr)).normalize().multiplyScalar(.22 + r() * .3);
      acP.push(p.x - t.x, p.y - t.y, p.z - t.z, p.x + t.x, p.y + t.y, p.z + t.z); }
    const acg = new THREE.BufferGeometry(); acg.setAttribute('position', new THREE.Float32BufferAttribute(acP, 3)); const acL = new THREE.LineSegments(acg, lineMat(K.actin, .3)); acL.userData.noHit = true; G.add(acL);
    /* ---- ribosomes, 25 to 30 nm (BioNumbers 100483): 3 to 10 million in a HeLa cell (BioNumbers 107347; Duncan and Hershey 1983; a
       review, 2001), so roughly 2,000 to 6,000 per µm³ of cytoplasm. Far too many to draw: only those within a slab 0.1 µm deep behind the
       cut face, near where the camera looks, at 2,500 per µm³ (free), and on the rough ER sheets there; drawn only once they are more than
       about a pixel across. */
    const ribI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.0135 * U, 0), MDC.mat(S, K.ribosome, 'matte', 0), 24000); ribI.count = 0; ribI.visible = false; ribI.frustumCulled = false;
    ribI.userData = { id: 'ribosome', priority: .8 }; G.add(ribI); c.pickables.push(ribI);
    const mitoGrid = new Map(), gk = (x, y, z) => x + ',' + y + ',' + z; occ.forEach(([p, R]) => { const k0 = gk(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)); (mitoGrid.get(k0) || mitoGrid.set(k0, []).get(k0)).push([p, R]); });
    const inOrg = p => { const d = p.clone().sub(C); if (MDC.ell(new V3(NA.x + .05, NA.y + .05, NA.z + .05), d) < 1) return true; const x = Math.floor(p.x), y = Math.floor(p.y), z = Math.floor(p.z);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let e = -1; e <= 1; e++) for (const [o, R] of mitoGrid.get(gk(x + a, y + b, z + e)) || []) if (o.distanceToSquared(p) < R * R) return true; return false; };
    let ribAt = null;
    const ribFill = T => {   // ribosomes in cubes of 1 builder unit near T (builder coordinates), each cube from its own seed, so the pattern holds still
      const perCube = Math.round(2500 / (U * U * U)), out = []; const R = 3;
      for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (let e = -R; e <= R; e++) {
        const x = Math.floor(T.x) + a, y = Math.floor(T.y) + b, z = Math.floor(T.z) + e, cc = new V3(x + .5, y + .5, z + .5); if (Math.abs(cc.clone().sub(C).dot(nN)) > 1.2) continue;
        const rr = rng((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
        for (let i = 0; i < perCube; i++) { const p = new V3(x + rr(), y + rr(), z + rr()), s = p.clone().sub(C).dot(nN); if (s > 0 || s < -.1 * U) continue; if (!inCell(p, .1) || inOrg(p)) continue; out.push(p); }
        if (out.length > 20000) break;
      }
      // on the rough ER sheets in view: every ~40 nm along the sheet where the sheet is there
      const rr2 = rng(77); for (let i = 0; i < 60000 && out.length < 23900; i++) { const k = Math.floor(rr2() * rerD.length), d = new V3(gauss(rr2), gauss(rr2), gauss(rr2)).normalize(), p = sheetPt(d, k);
        const nr = new V3(p.x - C.x, p.y - C.y, p.z - C.z).normalize(); p.addScaledVector(nr, (rr2() < .5 ? 1 : -1) * .045 * U);
        if (p.distanceToSquared(T) > 9 || p.clone().sub(C).dot(nN) > 0 || !rerOn(p)) continue; out.push(p); }
      out.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); ribI.setMatrixAt(i, m4); }); ribI.count = out.length; ribI.instanceMatrix.needsUpdate = true; ribAt = T.clone(); S.ribN = out.length;
    };
    /* ---- close in: the mitochondria near where the camera looks get their inner membrane, folded into cristae across the long axis
       (the folds' number and spacing are a choice, about one per 0.12 µm of length) */
    const crG = new THREE.SphereGeometry(1, 14, 10), crM = MDC.mat(S, K.cristae, 'wet', 1, { dark: .8 }), crI = new THREE.InstancedMesh(crG, crM, 60 * 18); crI.count = 0; crI.frustumCulled = false; crI.userData = { id: 'mito', priority: 1 }; G.add(crI); c.pickables.push(crI);
    const innerM = MDC.mat(S, K.mito, 'wet', 1, { dark: .5 }), inI = [0, 1, 2].map(b => { const im = new THREE.InstancedMesh(bentGeo(b, 16, 20), innerM, 60); im.count = 0; im.frustumCulled = false; im.userData = { id: 'mito', priority: 1 }; G.add(im); c.pickables.push(im); return im; });
    let near = [], nearAt = null; const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    const mitoNear = T => {
      near.forEach(x => { mxOf(x, m4); x.inst[0].setMatrixAt(x.inst[1], m4); x.inst[0].instanceMatrix.needsUpdate = true; });
      near = T ? mitoDrawn.filter(x => x.p.distanceToSquared(T) < 16).sort((a, b) => a.p.distanceToSquared(T) - b.p.distanceToSquared(T)).slice(0, 60) : [];
      let k = 0; const nb = [0, 0, 0]; near.forEach(x => { x.inst[0].setMatrixAt(x.inst[1], zero); x.inst[0].instanceMatrix.needsUpdate = true; mxOf(x, m4); inI[x.bend].setMatrixAt(nb[x.bend]++, m4);
        const bb = [0, .55, 1.0][x.bend], nC = Math.max(6, Math.round(x.s * 13)); for (let i = 0; i < nC && k < crI.instanceMatrix.count; i++) { const t = -.82 + 1.64 * (i + .5) / nC, wy = Math.sqrt(Math.max(0, 1 - t * t)), sdir = i % 2 ? 1 : -1;
          const loc = new THREE.Matrix4().compose(new V3(t, sdir * .14 * wy + bb * (1 - t * t) - bb * .5, 0), new THREE.Quaternion(), new V3(.022 / x.s, .78 * wy, .8 * wy)); crI.setMatrixAt(k++, m4.clone().multiply(loc)); } });
      inI.forEach((im, b) => { im.count = nb[b]; im.instanceMatrix.needsUpdate = true; }); crI.count = k; crI.instanceMatrix.needsUpdate = true; nearAt = T ? T.clone() : null;
    };
    /* ---- labels: on the parts themselves */
    const anchor = p => { const o = new THREE.Object3D(); o.position.copy(p); G.add(o); return o; };
    // a name's anchor stands for its part (its id and card), so a click on the name goes to that place, not to the middle of the whole set
    const lbl = (o, t, pk, x) => { o.userData = Object.assign({}, pk.userData); const L = F.label(o, t, x || {}); L.scaleRef = c; return L; };
    const topOfNuc = C.clone().addScaledVector(up, NA.y * .98).addScaledVector(nN, -.8);
    lbl(anchor(topOfNuc), 'Nucleus', env);
    lbl(anchor(C.clone().add(NUCL[0][0]).addScaledVector(up, NUCL[0][1])), 'Nucleolus', nlMesh);
    const rerA = C.clone().add(nucSurf(rt.clone().multiplyScalar(-.75).addScaledVector(up, .45).normalize(), new V3()).multiplyScalar(1.12)); lbl(anchor(rerA), 'Rough endoplasmic reticulum', rer);
    const fm = mitoDrawn.filter(x => x.p.clone().sub(C).dot(nN) > -1.6 && x.p.clone().sub(C).dot(rt) > 4).sort((a, b) => b.p.y - a.p.y)[0] || mitoDrawn[0]; if (fm) lbl(anchor(fm.p.clone().addScaledVector(up, MA.y * fm.w)), 'Mitochondrion', mitoMesh[fm.bend]);
    lbl(anchor(cs.clone().addScaledVector(side, 2.2 * U).addScaledVector(gDir, .7 * U).addScaledVector(up, .6)), 'Golgi apparatus', gol);
    lbl(anchor(cs.clone().addScaledVector(up, .35 * U)), 'Centrosome', cen);
    const fl = lysoD.filter(x => x.p.clone().sub(C).dot(nN) > -1.5).sort((a, b) => a.p.x - b.p.x)[0]; if (fl) lbl(anchor(fl.p.clone().addScaledVector(up, fl.R)), 'Lysosome', lysoI);
    const sn = nodes.filter(p => p.clone().sub(C).dot(nN) > -1.5).sort((a, b) => a.y - b.y)[0]; if (sn) lbl(anchor(sn), 'Smooth endoplasmic reticulum', ser);
    const ribL = lbl(anchor(new V3()), 'Ribosomes (true size)', ribI); ribL.minSizeFn = () => ribI.visible && ribI.count > 0;
    /* the frame's per-frame step: detail where the camera is close */
    let tChk = 0; const _T = new V3();
    S.step = () => {
      const now = performance.now(); if (now - tChk < 250) return; tChk = now;
      const here = cam.A === F, D = cam.D, Tl = _T.copy(cam.T).divideScalar(c.k);   // the camera's target in builder units (the group is scaled by c.k)
      const close = here && D < 1.1e-5, mtClose = here && D < 7e-6;
      if (close && (!ribAt || ribAt.distanceTo(Tl) > 1.2)) ribFill(Tl); ribI.visible = close && here && D < 9e-6;
      if (ribI.visible) { const lp = Tl.clone(); lp.addScaledVector(nN, -.05); ribL.obj.position.copy(lp); }
      if (close && (!nearAt || nearAt.distanceTo(Tl) > 1)) mitoNear(Tl); else if (!close && near.length) mitoNear(null);
      mtTubes().visible = mtClose; mtL.visible = !mtClose;
    };
    F._mdcStep = S.step;
    /* clicks: what is cut away is not hit; the membrane only at its cut edge or where nothing else is; otherwise the nearest thing */
    F._mdChoose = () => cands => {
      const ok = cands.filter(k => { const p = G.worldToLocal(k.hit.point.clone()), id = k.obj.userData.id, d = p.clone().sub(C), eA = d.dot(uni.uMdA.value), eB = d.dot(uni.uMdB.value), eN = d.dot(nN);
        if (id === 'chromatin') return eA > -.03 && eB > -.03 && eN > -.03;                                           // a face of the cut-out eighth: only where it is drawn
        if (id === 'nucleus' || id === 'nucleolus' || id === 'pore') return !(eA > 0 && eB > 0 && eN > 0);
        return !gone1(p) || k.obj === rimM; });
      const solid = ok.filter(k => !/^(membrane|cytoplasm)$/.test(k.obj.userData.id)); if (solid.length) return solid.reduce((a, b) => a.hit.distance <= b.hit.distance ? a : b);
      return ok.find(k => k.obj.userData.id === 'cytoplasm') || ok[0] || null;
    };
    if (F._mdcClip0 === undefined) F._mdcClip0 = F.coreClip || null;
    F.coreClip = p => { const l = G.worldToLocal(p.clone()); return l.clone().sub(C).dot(nN) > .12 && MDC.ell(new V3(NA.x + .1, NA.y + .1, NA.z + .1), l.clone().sub(C)) > 1; };
    S.counts = { mitoAll: mito.length, mitoDrawn: mitoDrawn.length, lyso: lysoD.length, lysoAll: lyso.length, pores: pores.length, poresAll: nPore, ves: ves.length, ser: serL.length, mt: mtCurves.length, vCell: vCell / (U * U * U), vNuc: 4 / 3 * Math.PI * NA.x * NA.y * NA.z / (U * U * U) };
    F._mdc = S; c.nucR = NA; return S;
  },
  /* the cut faces of the nucleus: chromatin as a texture of noise in two tones, heterochromatin (dense) at the envelope and round the
     nucleoli, euchromatin (loose) between; the nucleoli where a face passes through them */
  capMat(S, NA, NUCL, nN) {
    const m = MD.mat(MDC.COL.eu, 'matte'); m._lkUn = true; m.side = THREE.DoubleSide;
    const het = new THREE.Color(MDC.COL.hetero), nl = new THREE.Color(MDC.COL.nucleolus);
    LOOK.patch(m, 'mdcap', sh => {
      Object.assign(sh.uniforms, S.uni);
      sh.vertexShader = 'uniform mat4 uMdW2L;\nvarying vec3 vMdP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n\tvMdP = ( uMdW2L * modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      sh.fragmentShader = `uniform vec3 uMdC, uMdN, uMdA, uMdB, uMdN2;\nvarying vec3 vMdP;
	float mdH( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 ); }
	float mdV( vec3 p ) { vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
		return mix( mix( mix( mdH( i ), mdH( i + vec3( 1, 0, 0 ) ), f.x ), mix( mdH( i + vec3( 0, 1, 0 ) ), mdH( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
		            mix( mix( mdH( i + vec3( 0, 0, 1 ) ), mdH( i + vec3( 1, 0, 1 ) ), f.x ), mix( mdH( i + vec3( 0, 1, 1 ) ), mdH( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z ); }
` + sh.fragmentShader.replace('void main() {', `void main() {
	{ vec3 d = vMdP - uMdC; float eA = dot( d, uMdA ), eB = dot( d, uMdB ), eN = dot( d, uMdN2 );
	  // a face lies on one of the three planes; it shows only where the other two say the point is in the eighth that was cut out
	  float tol = 0.02; if ( !( ( abs( eA ) < tol || eA > 0.0 ) && ( abs( eB ) < tol || eB > 0.0 ) && ( abs( eN ) < tol || eN > 0.0 ) ) ) discard; }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
	{ vec3 d = vMdP - uMdC; vec3 e = d / vec3( ${NA.x.toFixed(3)}, ${NA.y.toFixed(3)}, ${NA.z.toFixed(3)} ); float rim = 1.0 - length( e );
	  float n = 0.45 * mdV( vMdP * 5.5 ) + 0.35 * mdV( vMdP * 12.0 + 4.0 ) + 0.2 * mdV( vMdP * 26.0 + 9.0 );
	  float het = smoothstep( 0.09, 0.0, rim ) * 0.9 + smoothstep( 0.25, 0.08, rim ) * 0.25;
	  ${NUCL.map(([p, R], i) => `float dn${i} = length( d - vec3( ${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)} ) ) - ${R.toFixed(3)}; het = max( het, smoothstep( 0.45, 0.0, dn${i} ) * 0.8 );`).join('\n\t  ')}
	  float k = smoothstep( 0.52 - 0.3 * het, 0.68 - 0.3 * het, n );
	  k = k * 0.8;
	  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( ${het.r.toFixed(3)}, ${het.g.toFixed(3)}, ${het.b.toFixed(3)} ), k );
	  ${NUCL.map((_, i) => `if ( dn${i} < 0.0 ) diffuseColor.rgb = vec3( ${nl.r.toFixed(3)}, ${nl.g.toFixed(3)}, ${nl.b.toFixed(3)} ) * ( 0.7 + 0.6 * mdV( vMdP * 14.0 ) ) * ( 0.85 + 0.3 * mdV( vMdP * 40.0 ) );`).join('\n\t  ')} }`);
    });
    return m;
  },
  /* the whole cell's note: what is drawn, how many of each against how many a cell has, and what is left out. The old schematic's note
     (set again whenever the cell's view is switched) is replaced by this one; the scene's kind (MD.kind) still leads it. */
  note(F, S) {
    const n = S.counts, f = x => Math.round(x).toLocaleString('en-GB'), r2 = x => Math.round(x / 100) * 100;
    const text = `an animal cell cut open, at its true size (20 µm across), with counts and sizes from measurements of human HeLa cells. The nucleus is 10% of the cell's volume; ${f(n.pores)} pores are drawn on it, at the measured density (about 16 per µm²). ${f(n.mitoDrawn)} mitochondria of 0.29 µm³ are drawn in the half kept (about ${f(r2(n.mitoAll))} in the whole cell, 0.4 per µm³ of cytoplasm), and ${f(n.lyso)} lysosomes. The rough ER is drawn as sheets joined to the nuclear envelope, the smooth ER as tubules, the Golgi as a ribbon of five stacks beside the centrosome. Microtubules and the actin under the membrane are drawn as lines, far wider than they are, until close in. Ribosomes (3 to 10 million in a cell) are drawn only close in, in a thin layer behind the cut face. Not drawn: the cell's roughly 2 billion other protein molecules, the water and small molecules between, the intermediate filaments. The arrangement is invented and the shapes smoothed.`;
    const d = Object.getOwnPropertyDescriptor(F, 'note'), get = d && d.get ? d.get : () => F._mdcN0, set = d && d.set ? d.set : v => { F._mdcN0 = v; };
    Object.defineProperty(F, 'note', { configurable: true, enumerable: true, get, set: v => set.call(F, /schematic animal cell/i.test(String(v)) ? text : v) });
    F.note = text;
  },
  /* cards for the parts the old schematic did not have (the others keep theirs, js/content_extra.js) */
  INFO: {
    pore: n => ({ title: 'Nuclear pore', tag: 'A gate through the nuclear envelope', body: `<p>A ring of proteins, about 120 nanometres across, set in a hole where the two membranes of the nuclear envelope meet. Its central channel, roughly 60 nanometres wide, lets small molecules through freely and passes large ones (RNA on its way out, proteins on their way in) only with the help of carrier proteins.</p><p class="mini">A nucleus of a human HeLa cell has about 3,900 of them (Maul and Deaven, 1977). ${n.toLocaleString('en-GB')} are drawn on this one, at that density; those in the cut-out eighth are not.</p>` }),
    centrosome: () => ({ title: 'Centrosome', tag: 'Where microtubules start', body: '<p>The cell\'s main organizer of microtubules: a pair of centrioles set at right angles, in a cloud of proteins that starts new microtubules. Each centriole is a short cylinder, about 0.25 micrometres across and 0.5 long, made of nine triplets of microtubules.</p><p class="mini">The cloud of proteins round the centrioles is not drawn.</p>' }),
    microtubule: () => ({ title: 'Microtubule', tag: 'A hollow protein tube, 25 nm across', body: '<p>Microtubules are hollow tubes of the protein tubulin, about 25 nanometres across. They grow out from the centrosome toward the edge of the cell, and motor proteins walk along them carrying vesicles and organelles.</p><p class="mini">Seen from afar they are drawn as lines one pixel wide, far wider than they are; close in, as tubes of their true width. How many there are is a choice here, not a count.</p>' }),
    vesicle: () => ({ title: 'Vesicle', tag: 'A small membrane bubble that carries cargo', body: '<p>Small bubbles of membrane that carry proteins and lipids between the endoplasmic reticulum, the Golgi apparatus and the cell membrane. Many cluster round the Golgi.</p><p class="mini">Their number and sizes here are a choice, not a count.</p>' }),
  },
};
/* --- instanced atoms + bonds (Å units) ---
   o.style 'bs' (ball and stick: balls at a quarter of their van der Waals radius) or 'sf' (space-filling, true radius)
   o.radii {sym: Å} sets the radius instead (ions); o.noBonds draws no sticks; o.partOf names the molecule for atom cards */
function atomSet(F, parent, atoms, bonds, o = {}) {
  const style = o.style || 'bs', grp = new THREE.Group(); parent.add(grp);
  const bySym = {}; atoms.forEach((a, i) => (bySym[a[0]] = bySym[a[0]] || []).push(i));
  // under the look a small molecule gets smooth spheres (its silhouette is what a close view shows), a crowd keeps the coarse ones
  const sw = MD.on ? (atoms.length < 120 ? [36, 26] : atoms.length < 600 && !o.lowpoly ? [24, 16] : o.lowpoly ? [10, 8] : [20, 14]) : null;   // triangles: a sugar 24 x 1.9 k, iron's small crystal 163 x 768, liquid water as before
  const sg = new THREE.SphereGeometry(1, sw ? sw[0] : o.lowpoly ? 10 : 20, sw ? sw[1] : o.lowpoly ? 8 : 14), m4 = new THREE.Matrix4(), meshes = [];
  const radOf = s => o.radii && o.radii[s] ? o.radii[s] * (style === 'sf' ? 1 : (o.ionScale || .5)) : elVdw(s) * (style === 'sf' ? 1 : .26);
  let occ = null;
  if (MD.on && LOOK.quality === 'high') {   // contact darkening: every drawn sphere against its neighbours (bonds left out: they are thin)
    const C = new Float32Array(atoms.length * 3), R = new Float32Array(atoms.length); atoms.forEach((a, i) => { C[3 * i] = a[1]; C[3 * i + 1] = a[2]; C[3 * i + 2] = a[3]; R[i] = radOf(a[0]); });
    occ = MD.occlusion(C, R, Math.max(2.5, 2.2 * Math.max(...R)));
  }
  for (const s in bySym) {
    const idx = bySym[s], mat = MD.on ? MD.mat(elColor(s), atoms.length >= 600 ? MD.KIND_CROWD : 'plastic') : new THREE.MeshStandardMaterial({ color: elColor(s), emissive: elColor(s).multiplyScalar(.28), roughness: .4, metalness: 0 });
    const mesh = new THREE.InstancedMesh(occ ? sg.clone() : sg, mat, idx.length);
    if (occ) { const a = new Float32Array(idx.length * 4); idx.forEach((ai, k) => a.set(occ.subarray(4 * ai, 4 * ai + 4), 4 * k)); mesh.geometry.setAttribute('aOcc', new THREE.InstancedBufferAttribute(a, 4)); MD.occPatch(mat); }
    const rad = radOf(s);
    idx.forEach((ai, k) => { const a = atoms[ai]; m4.makeScale(rad, rad, rad).setPosition(a[1], a[2], a[3]); mesh.setMatrixAt(k, m4); });
    mesh.userData = {
      id: 'atom', priority: 3, madeOf: 'atom', sym: s,
      infoFn: () => { const e = elInfo(s); if (o.partOf) e.body += `<p class="mini">${o.partOf}</p>`; return e; },
      center: h => { const a = atoms[idx[h.hit.instanceId]]; return new V3(a[1], a[2], a[3]).applyMatrix4(grp.matrixWorld).add(h.frame.C); },
      radius: () => rad
    };
    mesh.userData.atomAt = id => atoms[idx[id]]; mesh.userData.atomIx = id => idx[id];
    grp.add(mesh); F.pickables.push(mesh); meshes.push(mesh);
  }
  if (bonds && bonds.length && style !== 'sf' && !o.noBonds) {
    // each bond is drawn as 1, 2 or 3 parallel sticks (order 1, 2, 3); aromatic and resonance bonds (1 < order < 2) as a thick plus a thin stick
    const adj = atoms.map(() => []); bonds.forEach(([i, j]) => { adj[i].push(j); adj[j].push(i); });
    const A = i => new V3(atoms[i][1], atoms[i][2], atoms[i][3]);
    const plan = bonds.map(([i, j, ord]) => ord >= 2.5 ? [[-.22, .065], [0, .065], [.22, .065]] : ord >= 1.95 ? [[-.13, .07], [.13, .07]] : ord > 1.05 ? [[-.07, .09], [.2, .04]] : [[0, .11]]);
    const total = plan.reduce((s, p) => s + p.length * 2, 0);
    const cg = new THREE.CylinderGeometry(1, 1, 1, MD.on && atoms.length < 600 ? 16 : 8, 1); cg.translate(0, .5, 0);
    const bm = new THREE.InstancedMesh(cg, MD.on ? MD.mat(0xffffff, atoms.length >= 600 ? MD.KIND_CROWD : 'plastic') : new THREE.MeshStandardMaterial({ roughness: .5 }), total), q = new THREE.Quaternion(), up = new V3(0, 1, 0), bondOf = [];
    let k = 0;
    bonds.forEach(([i, j, ord], bi) => {
      const a = A(i), b = A(j), dir = b.clone().sub(a).normalize(), mid = a.clone().lerp(b, .5);
      let perp = null;
      for (const [c0, nb] of [[a, adj[i]], [b, adj[j]]]) { for (const n of nb) { if (n === i || n === j) continue; const v = A(n).sub(c0); v.addScaledVector(dir, -v.dot(dir)); if (v.length() > .2) { perp = v.normalize(); break; } } if (perp) break; }
      if (!perp) perp = new V3(0, 0, 1).cross(dir).length() > .1 ? new V3(0, 0, 1).cross(dir).normalize() : new V3(1, 0, 0).cross(dir).normalize();
      plan[bi].forEach(([off, rad]) => {
        [[a, atoms[i][0]], [b, atoms[j][0]]].forEach(([p, s]) => { const pp = p.clone().addScaledVector(perp, off), d = mid.clone().addScaledVector(perp, off).sub(pp), L = d.length(); q.setFromUnitVectors(up, d.normalize()); m4.compose(pp, q, new V3(rad, L, rad)); bm.setMatrixAt(k, m4); bm.setColorAt(k, elColor(s)); bondOf[k] = bi; k++; });
      });
    });
    grp.add(bm);
    bm.userData = { id: 'bond', priority: 1, infoFn: h => bondCard(atoms, bonds[bondOf[h.hit.instanceId] || 0], o) }; F.pickables.push(bm);
  }
  grp.userData.meshes = meshes;
  F.atomSet = { grp, atoms };   // the atoms a zoom in this frame can end on (atomAtt)
  return grp;
}
/* The atoms of a molecule, crystal or liquid frame as attractors (engine.js, "attractors"): scrolling in converges on the atom under the pointer, or on the atom
   nearest the pointer when it is between atoms, so the descent never runs on into the empty space between them. Positions are those of the frame's current atomSet,
   through whatever turn its holder has. */
const _atM = new THREE.Matrix4(), _atI = new THREE.Matrix4(), _atP = new V3();
function atomSetMatrix(F) { const S = F.atomSet; _atM.identity(); if (S) for (let o = S.grp; o && o !== F.root; o = o.parent) { o.updateMatrix(); _atM.premultiply(o.matrix); } return _atM; }
function atomAtt(F, D) {
  F.att = {
    D, tol: .3,
    find(P, hint) {
      const S = F.atomSet; if (!S || !S.atoms.length) return -1;
      const u = hint && hint.obj && hint.obj.userData;
      if (u && u.atomIx && hint.hit && hint.hit.instanceId != null && S.atoms[u.atomIx(hint.hit.instanceId)] === u.atomAt(hint.hit.instanceId)) return u.atomIx(hint.hit.instanceId);   // the atom the pointer is on
      _atP.copy(P).applyMatrix4(_atI.copy(atomSetMatrix(F)).invert());
      let best = -1, bd = Infinity; const A = S.atoms;
      for (let i = 0; i < A.length; i++) { const a = A[i], dx = a[1] - _atP.x, dy = a[2] - _atP.y, dz = a[3] - _atP.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = i; } }
      return best;
    },
    pos(id, out) { const S = F.atomSet, a = S && S.atoms[id]; return a ? out.set(a[1], a[2], a[3]).applyMatrix4(atomSetMatrix(F)) : null; }
  };
}
function bondCard(atoms, b, o) {
  const [i, j, ord] = b, sa = atoms[i][0], sb = atoms[j][0], L = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]);
  const names = `${(ELJ[sa] || {}).name || sa} and ${(ELJ[sb] || {}).name || sb}`;
  const kind = o.contact ? 'contact' : ord >= 2.5 ? 'triple' : ord >= 1.95 ? 'double' : ord > 1.05 ? 'delocalised' : 'single';
  const TXT = {
    contact: 'A stick between nearest neighbours in the crystal. It marks which atoms touch; it is not a separate bond with its own electron pair.',
    single: 'One shared pair of electrons (2 electrons) holds these two atoms together.',
    double: 'Two shared pairs of electrons (4 electrons): shorter and stronger than a single bond, and it cannot twist freely.',
    triple: 'Three shared pairs of electrons (6 electrons): the shortest and strongest of the three kinds, as in nitrogen gas, N₂.',
    delocalised: 'A bond between single and double: the electrons are shared over several atoms (as in benzene or the carbonate ion), so every such bond is the same. It is drawn as a thick stick plus a thin one.',
  };
  return { title: kind === 'contact' ? 'Neighbouring atoms in a crystal' : `${kind[0].toUpperCase() + kind.slice(1)} bond`, tag: `Chemical bond · ${sa}–${sb}`, body: `<p>${TXT[kind]}</p>`, facts: [['Atoms', names], ['Length in this model', `${L.toFixed(2)} Å (${(L / 10).toFixed(3)} nm)`], ['Bond order', ord]] };
}
function spawnAtomFrom(F, T, hint, unitScale) {
  // the atom the zoom has converged on; else the atom the pointer is on; else the nearest atom to the target, however far: never run on into empty space
  const a = F.att, S = F.atomSet; if (!a || !S) return null;
  let id = attId(F); if (id < 0) id = a.find(T, hint);
  const p = id >= 0 && a.pos(id, new V3()); if (!p) return null;
  return atomFrame(S.atoms[id][0], p, unitScale);
}
function atomFrame(sym, pos, unitScale) { // unitScale: parent units per Å
  return new Frame({ type: 'atom', pinned: true, name: `${(ELJ[sym] || {}).name || sym} atom`, unit: 1e-12, radius: 600, r0: 0, r1: 2.5e-9, spawnD: 2e-13, pos: pos.clone(), opts: { el: sym } });
}
function refreshCaption(F) { if (typeof capFrame !== 'undefined' && capFrame === F) capFrame = null; }
/* ---------- molecule from data/molecules (unit Å) ---------- */
const MOLIDX = { list: null };
FT.mol = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x302040, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 8, 6); F.add(dl);
    const holder = new THREE.Group(); F.add(holder); MD.kind(F, 'Model');
    let style = store.get('molStyle', 'bs'), sel = null;
    const STYLE_NOTE = {
      bs: 'Ball and stick: the atoms are drawn at a quarter of their true size so the bonds show; bond lengths are true. Double and triple bonds are 2 and 3 sticks. Colours are the CPK convention, not real colours.',
      sf: 'Space-filling: each atom is drawn at its van der Waals radius, roughly the reach of its electron cloud, so bonded atoms overlap. Colours are the CPK convention, not real colours.',
    };
    const load = (id, fit) => getJSON('data/molecules_all.json').then(ALL => ALL.mols[id] || ALL.mols.water).then(M => {
      if (!F.built) return;
      holder.clear(); F.pickables.length = 0; F.mats = null;
      const c = new V3(); M.atoms.forEach(a => c.add(new V3(a[1], a[2], a[3]))); c.divideScalar(M.atoms.length);
      const atoms = M.atoms.map(a => [a[0], a[1] - c.x, a[2] - c.y, a[3] - c.z, a[4]]);
      F.molAtoms = atoms; F.mol = M;
      const fm = molFormula(M.formula), ionic = id === 'nacl_pair';
      const RES = { carbonate: 1.33, nitrate: 1.33, ozone: 1.5 };
      const bonds = RES[id] ? M.bonds.map(b => [b[0], b[1], RES[id]]) : M.bonds;
      const g = atomSet(F, holder, atoms, bonds, { style, partOf: `Part of ${M.name}, ${fm.text}. Click the molecule's name for its card.`, radii: ionic ? { Na: IONIC_R.Na, Cl: IONIC_R.Cl } : null });
      const syms = atoms.map(a => a[0]);
      let rmax = 0; atoms.forEach(a => rmax = Math.max(rmax, Math.hypot(a[1], a[2], a[3])));
      const info = {
        title: M.name, tag: `Molecule · ${fm.text}${fm.charge ? ' · an ion' : ''}`,
        body: `<p>${M.notes || ''}</p><p class="mini">${methodText(M.method)} ${ionic ? 'The two balls are drawn with their ionic radii (Na⁺ about 102 pm, Cl⁻ about 181 pm, Shannon 1976), at half size in ball and stick.' : ''} ${RES[id] ? 'The real bonds are all equal (resonance); the geometry here is only approximate.' : ''}</p>${colorKey(syms)}`,
        facts: [['Formula', fm.text], ['Net charge', fm.charge ? (fm.charge > 0 ? '+' : '−') + Math.abs(fm.charge) : '0 (neutral)'], ['Molar mass', `${(+M.mw).toFixed(2)} g/mol`], ['Atoms', M.atoms.length], ['Size', `≈ ${(2 * rmax / 10 + .3).toFixed(1)} nm across`]]
      };
      g.userData.meshes.forEach(m => m.userData.molInfo = info);
      F.info = info; F.name = o.cname || (o.stand ? 'Example molecule: ' + M.name : M.name); F.blurb = `${o.cname ? o.cname + '. ' : o.stand ? 'An example molecule that stands in for the topic you came from (the topic is bigger than one molecule). ' : ''}${M.name} (${fm.text}): ${M.atoms.length} atoms, about ${(2 * rmax / 10 + .3).toFixed(1)} nm across.`; F.note = STYLE_NOTE[style];
      if (F.molLabel) { F.molLabel.el.remove(); F.labels.splice(F.labels.indexOf(F.molLabel), 1); }
      if (F.hbLabel) { F.hbLabel.el.remove(); F.labels.splice(F.labels.indexOf(F.hbLabel), 1); F.hbLabel = null; }
      const hb = MD.on && style === 'bs' ? MD.hbonds(F, holder, atoms, bonds) : 0;
      if (hb) { F.hbLabel = F.label(hb.anchor, hb.count === 1 ? 'Hydrogen bond (dashed)' : 'Hydrogen bonds (dashed)'); F.note = STYLE_NOTE[style] + ` The dashes are the ${hb.count} hydrogen bonds between the two molecules.`; }
      const lo = new THREE.Object3D(); lo.position.set(0, rmax + 2, 0); lo.userData = { id: 'moleculecard', info, noZoom: true }; holder.add(lo); F.molLabel = F.label(lo, M.name);
      if (fit && cam.A === F) cam.D = Math.max(rmax * 2.6e-10, 1.2e-9);
      if (o.onLoad) o.onLoad(F);
      F.opts.mol = id; if (sel && sel.value !== id) sel.value = id;
      refreshCaption(F);
    });
    load(o.mol || 'water');
    if (!o.fixed) {
      sel = document.createElement('select'); sel.className = 'molsel'; sel.title = 'Choose any of 250 molecules'; sel.style.maxWidth = '46vw';
      getJSON('data/molecules_all.json').then(ALL => ALL.index).then(L => {
        const cats = {}; L.forEach(m => (cats[m.category] = cats[m.category] || []).push(m));
        sel.innerHTML = Object.keys(cats).sort((a, b) => (MOL_GROUPS[a] || a).localeCompare(MOL_GROUPS[b] || b)).map(k => `<optgroup label="${MOL_GROUPS[k] || k}">${cats[k].sort((a, b) => a.name.localeCompare(b.name)).map(m => `<option value="${m.id}" ${m.id === (o.mol || 'water') ? 'selected' : ''}>${m.name}</option>`).join('')}</optgroup>`).join('');
      });
      sel.onchange = () => load(sel.value, true);
      uiEl(sel);
    }
    seg([['bs', 'Ball and stick'], ['sf', 'Space-filling']], style, k => { style = k; store.set('molStyle', k); load(F.opts.mol); });
    atomAtt(F, 2.5e-9); F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
    F.update = (dt) => { holder.rotation.y += dt * .05 * smooth(3e-9, 5e-9, cam.D); };   // the slow turn comes to rest before the zoom starts to close on an atom
    MD.stage(F, { near: .85, far: 2.6 });
  }
};
/* ---------- crystal lattice (unit Å) ---------- */
FT.crystal = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x302040, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 8, 6); F.add(dl);
    const holder = new THREE.Group(); F.add(holder); let mode = 'small', CR = null, myLabels = []; MD.kind(F, 'Model');
    const draw = () => {
      holder.clear(); F.pickables.length = 0; F.mats = null; myLabels.forEach(l => { l.el.remove(); const i = F.labels.indexOf(l); if (i >= 0) F.labels.splice(i, 1); }); myLabels = [];
      const X = CR.find(c => c.id === o.id) || CR[0], L = X.lattice.map(v => new V3(...v)), R = mode === 'big' ? 13 : 8, atoms = [];
      const n = Math.ceil(13 / Math.min(...L.map(v => v.length()))) + 1;
      const ctr = new V3().add(L[0]).add(L[1]).add(L[2]).multiplyScalar(.5);
      const inv = new THREE.Matrix4().makeBasis(L[0], L[1], L[2]).invert(), fr = new V3();
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++) X.basis.forEach(([s, fx, fy, fz]) => {
        const p = L[0].clone().multiplyScalar(i + fx).add(L[1].clone().multiplyScalar(j + fy)).add(L[2].clone().multiplyScalar(k + fz)).sub(ctr);
        if (mode === 'cell') { fr.copy(p).add(ctr).applyMatrix4(inv); if (fr.x < -1e-3 || fr.y < -1e-3 || fr.z < -1e-3 || fr.x > 1 + 1e-3 || fr.y > 1 + 1e-3 || fr.z > 1 + 1e-3) return; atoms.push([s, p.x, p.y, p.z]); }
        else if (p.length() < R) atoms.push([s, p.x, p.y, p.z]);
      });
      const ionic = CRYSTAL_IONIC[X.id], metal = CRYSTAL_METAL.includes(X.id), noBonds = !!ionic || metal;
      const bonds = [], cut = X.bond_cutoff || 2.5;
      if (!noBonds) for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const d = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]); if (d < cut && !(atoms[i][0] === 'H' && atoms[j][0] === 'H')) bonds.push([i, j, 1]); }
      const radii = ionic ? Object.fromEntries(ionic.map(s => [s, IONIC_R[s]])) : null;
      const g = atomSet(F, holder, atoms, bonds, { style: 'bs', lowpoly: atoms.length > 1500, radii, noBonds, contact: true, partOf: `Part of the ${X.name} crystal.` });
      // ice: the hydrogen bonds between molecules (O···H about 1.8 Å), dashed
      if (X.id === 'ice_ih') {
        const lp = []; for (let i = 0; i < atoms.length; i++) { if (atoms[i][0] !== 'H') continue; for (let j = 0; j < atoms.length; j++) { if (atoms[j][0] !== 'O') continue; const d = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]); if (d > 1.4 && d < 2.1) lp.push(atoms[i][1], atoms[i][2], atoms[i][3], atoms[j][1], atoms[j][2], atoms[j][3]); } }
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
        const hb = new THREE.LineSegments(lg, new THREE.LineDashedMaterial({ color: 0x7fd8ff, dashSize: .2, gapSize: .15, transparent: true, opacity: .8 })); hb.computeLineDistances(); holder.add(hb); F.pick(hb, 'hbond_water', 1.5);
      }
      // unit cell outline: thick bright edges
      const c0 = ctr.clone().negate(), corners = [];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) corners.push(c0.clone().add(L[0].clone().multiplyScalar(a)).add(L[1].clone().multiplyScalar(b)).add(L[2].clone().multiplyScalar(c)));
      const E = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]], boxG = new THREE.Group(), em = new THREE.MeshBasicMaterial({ color: 0xffe08a });
      E.forEach(([a, b]) => { const d = corners[b].clone().sub(corners[a]), m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, d.length(), 6), em); m.position.copy(corners[a]).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); boxG.add(m); });
      holder.add(boxG); myLabels.push(F.label(boxG, 'One unit cell (the repeating block)', { offset: corners[7].clone() }));
      if (MD.on && mode !== 'cell') MD.cellXray(holder, E, corners, atoms, L, ctr, g);
      const ionNote = ionic ? 'Ions are drawn at half their true radius (Shannon 1976 effective radii, 6-coordinate) so you can see into the lattice; the big ones are the negative ions. No sticks: ionic crystals are held by attraction between ions, not by bonds between pairs.' : metal ? 'Atoms of a metal share their outer electrons across the whole crystal, so no sticks are drawn between pairs.' : noBonds ? '' : 'Sticks join nearest neighbours. Atoms are drawn at a quarter of their van der Waals radius.';
      const info = { title: X.name, tag: `Crystal · ${toSub(X.formula)}`, body: `<p>${X.notes || ''}</p><p class="mini">Atoms sit on a repeating 3-D lattice. The yellow box is one unit cell; a real crystal is this box copied about 10²⁰ times. ${ionNote}</p>${colorKey(atoms.map(a => a[0]))}`, facts: [['Formula', toSub(X.formula)], ['Cell edges', L.map(v => v.length().toFixed(2) + ' Å').join(' × ')], ['Atoms drawn', atoms.length]] };
      F.info = info; F.name = X.name; F.blurb = `${X.name}: ${mode === 'cell' ? 'the atoms of one unit cell' : 'a small piece of the crystal'}, at true atomic positions (ångström units).`;
      F.note = (ionic ? 'Ions at half their real radius. ' : '') + (noBonds ? 'No sticks between atoms. ' : 'Sticks join nearest neighbours. ') + 'Colours are the CPK convention.';
      g.userData.meshes.forEach(m => m.userData.molInfo = info);
      refreshCaption(F);
    };
    getJSON('data/crystals.json').then(C => { CR = C; if (!F.built) return; draw();
      const sl = document.createElement('select'); sl.className = 'molsel'; sl.title = 'Choose a crystal'; sl.style.maxWidth = '46vw';
      sl.innerHTML = CR.map(c => `<option value="${c.id}" ${c.id === o.id ? 'selected' : ''}>${c.name}</option>`).join('');
      sl.onchange = () => { o.id = sl.value; F.opts.id = sl.value; draw(); };
      const mg = seg([['cell', 'One unit cell'], ['small', 'Small crystal'], ['big', 'Larger crystal']], mode, k => { mode = k; draw(); });
      uiEl(sl); uiEl(mg); if (typeof uiFrame !== 'undefined' && uiFrame === F) { uiFrame = null; }
    });
    atomAtt(F, 2.5e-9); F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
    MD.stage(F, { near: .8, far: 2.6 });
  }
};
/* ---------- liquid water (unit Å) ---------- */
FT.liquid = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, .75)); const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(5, 8, 6); F.add(dl);
    const r = rng(9), R = 16, mols = [], cell = 3, grid = new Map(), key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    const target = Math.floor(4 / 3 * Math.PI * R ** 3 * .0334);
    for (let t = 0; t < target * 40 && mols.length < target; t++) {
      const p = new V3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).multiplyScalar(R); if (p.length() > R) continue;
      let ok = true; const [cx, cy, cz] = key(p.x, p.y, p.z).split(',').map(Number);
      for (let a = -1; a <= 1 && ok; a++) for (let b = -1; b <= 1 && ok; b++) for (let c = -1; c <= 1 && ok; c++) (grid.get(`${cx + a},${cy + b},${cz + c}`) || []).forEach(q => { if (q.distanceTo(p) < 2.72) ok = false; });
      if (!ok) continue; mols.push(p); const k = key(p.x, p.y, p.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p);
    }
    const N = mols.length, th = 104.52 / 2 * Math.PI / 180, OH = .9572, HA = [new V3(Math.sin(th) * OH, Math.cos(th) * OH, 0), new V3(-Math.sin(th) * OH, Math.cos(th) * OH, 0)];
    const quats = mols.map(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6))), Hs = mols.map(() => [new V3(), new V3()]);
    const setH = i => { for (let k = 0; k < 2; k++) Hs[i][k].copy(HA[k]).applyQuaternion(quats[i]).add(mols[i]); };
    mols.forEach((_, i) => setH(i));
    const nb = mols.map((p, i) => { const l = []; mols.forEach((q, j) => { if (i !== j && p.distanceTo(q) < 3.7) l.push(j); }); return l; });
    // hydrogen bond between donor i (its hydrogen) and acceptor j (its oxygen): H···O under 2.4 Å and O–H···O angle over 140°
    const _a = new V3(), _b = new V3();
    const bond = (i, j) => { let n = 0; for (let k = 0; k < 2; k++) { const d = Hs[i][k].distanceTo(mols[j]); if (d < 2.4) { _a.subVectors(mols[i], Hs[i][k]); _b.subVectors(mols[j], Hs[i][k]); if (_a.angleTo(_b) > 140 * Math.PI / 180) n++; } } return n; };
    const count = i => { let n = 0; nb[i].forEach(j => { n += bond(i, j) + bond(j, i); }); return n; };
    // keep the random positions (true density) and tune only the orientations so that molecules form hydrogen bonds
    const rr = rng(77);
    for (let sweep = 0; sweep < 40; sweep++) for (let i = 0; i < N; i++) {
      const q0 = quats[i].clone(); let best = count(i), bq = q0;
      for (let t = 0; t < 8; t++) { quats[i].setFromEuler(new THREE.Euler(rr() * 6, rr() * 6, rr() * 6)); setH(i); const c = count(i); if (c > best) { best = c; bq = quats[i].clone(); } }
      quats[i].copy(bq); setH(i);
    }
    const atoms = [], bonds = [];
    mols.forEach((p, i) => { const a0 = atoms.length; atoms.push(['O', p.x, p.y, p.z], ['H', Hs[i][0].x, Hs[i][0].y, Hs[i][0].z], ['H', Hs[i][1].x, Hs[i][1].y, Hs[i][1].z]); bonds.push([a0, a0 + 1, 1], [a0, a0 + 2, 1]); });
    const g = atomSet(F, F.root, atoms, bonds, { style: 'bs', lowpoly: true, partOf: 'Part of a water molecule in a model of liquid water.' });
    const lp = []; let nbond = 0, inner = 0, innerN = 0;
    for (let i = 0; i < N; i++) { const interior = mols[i].length() < R - 4; if (interior) innerN++; nb[i].forEach(j => { for (let k = 0; k < 2; k++) { const d = Hs[i][k].distanceTo(mols[j]); if (d < 2.4) { _a.subVectors(mols[i], Hs[i][k]); _b.subVectors(mols[j], Hs[i][k]); if (_a.angleTo(_b) > 140 * Math.PI / 180) { lp.push(Hs[i][k].x, Hs[i][k].y, Hs[i][k].z, mols[j].x, mols[j].y, mols[j].z); nbond++; if (interior) inner++; } } } }); }
    const perMol = innerN ? 2 * inner / innerN : 0;   // each bond counts once for its donor and once for its acceptor, but inner counts donors only: 2x gives both ends
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const hb = new THREE.LineSegments(lg, new THREE.LineDashedMaterial({ color: MD.on ? 0xb4d2e6 : 0x7fd8ff, dashSize: .2, gapSize: .15, transparent: true, opacity: MD.on ? 1 : .8 })); hb.computeLineDistances(); F.add(hb); F.pick(hb, 'hbond_water', 1.5);
    if (MD.on && lp.length) {   // the look: the label stands on one of the dashes (the highest one near the front), not in the air above the drop
      let bi = 0, bs = -Infinity; for (let i = 0; i < lp.length; i += 6) { const y = (lp[i + 1] + lp[i + 4]) / 2, z = (lp[i + 2] + lp[i + 5]) / 2, sc = y + .5 * z; if (Math.hypot(lp[i], y, z) < R - 1 && sc > bs) { bs = sc; bi = i; } }
      const a = new THREE.Object3D(); a.position.set((lp[bi] + lp[bi + 3]) / 2, (lp[bi + 1] + lp[bi + 4]) / 2, (lp[bi + 2] + lp[bi + 5]) / 2); F.add(a); F.label(a, 'Hydrogen bonds (dashed)', { pick: hb });
    } else F.label(hb, 'Hydrogen bonds (dashed)', { offset: new V3(0, R + 1, 0) });
    const info = { title: 'Liquid water', tag: 'H₂O · about 1 g/cm³', body: `<p>Each water molecule is a bent H–O–H unit about 0.28 nm across. In the liquid they are packed almost shoulder to shoulder (33 molecules per cubic nanometer) and keep forming and breaking hydrogen bonds, each lasting only about ten trillionths of a second.</p><p class="mini">This is a model, not a snapshot of a simulation: positions are random at the right density, and each molecule was turned to make as many hydrogen bonds as it can. In this picture the molecules away from the edge average about ${perMol.toFixed(1)} hydrogen bonds each (counting a bond for both partners). For comparison, simulations of real water give about 3.5 (the counting rules differ, so compare only roughly); real water also has a tetrahedral order that this random arrangement lacks. Pure water is shown; pond, sea and cell water also hold dissolved salts and molecules.</p>`, facts: [['Molecules shown', N], ['Density', '≈ 33.4 molecules/nm³'], ['O–H bond', '0.957 Å'], ['H–O–H angle', '104.5°'], ['Hydrogen bonds drawn', nbond]] };
    g.userData.meshes.forEach(m => m.userData.molInfo = info); F.info = info;
    F.blurb = 'Liquid water: a ball about 3 nm across cut from the bulk, every atom shown.';
    F.note = 'Model, not a simulation: random positions at the true density (33 molecules per nm³), orientations tuned to form hydrogen bonds. Real molecules never stop moving. Atoms are drawn at a quarter of their true size so the bonds show.' + (MD.on ? ' Colours follow the CPK convention: oxygen red, hydrogen white.' : '');
    atomAtt(F, 2.5e-9); F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
    MD.kind(F, 'Model'); MD.stage(F, { near: .75, far: 2.4 });
  }
};
/* ---------- gas (air, or a gas giant's hydrogen and helium) — unit nm ---------- */
FT.gas = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x061022 };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, .9)); const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(5, 8, 6); F.add(dl);
    /* o.mix (from the materials table, js/descent.js): [[kind, share by number], ...] with kinds N2 O2 Ar CO2 H2O H2 He H CH4, drawn like air: the number density of
       sea-level air unless o.count says how many to draw; o.gasTitle, o.gasBlurb, o.gasBody and o.gasNote are its name and its honesty line. */
    const giant = o.air === 'giant', custom = Array.isArray(o.mix) && o.mix.length ? o.mix : null;
    const r = rng(3), R = 22, n = o.count || Math.floor(4 / 3 * Math.PI * R ** 3 * .0246);
    // humid air at sea level: about 1% water vapour, the rest dry air (N2 78.08%, O2 20.95%, Ar 0.93%, CO2 about 0.04%)
    const mix = custom || (giant ? [['H2', .898], ['He', .102]] : [['N2', .7808 * .99], ['O2', .2095 * .99], ['Ar', .0093 * .99], ['CO2', .0004 * .99], ['H2O', .01]]);
    const mols = [], sumW = mix.reduce((s, m) => s + m[1], 0);
    for (let i = 0; i < n; i++) {
      let u = r() * sumW, k = 0; while (k < mix.length - 1 && u > mix[k][1]) { u -= mix[k][1]; k++; }
      const p = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar((n < 8 ? 3 : R) * Math.cbrt(r())), d = new V3(gauss(r), gauss(r), gauss(r)).normalize(), v = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.3);
      mols.push({ kind: mix[k][0], p, d, v, q: new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d) });
    }
    const counts = {}; mols.forEach(m => counts[m.kind] = (counts[m.kind] || 0) + 1); const cs = k => counts[k] || 0;
    const sg = new THREE.SphereGeometry(1, 12, 8), meshes = {};   // about 2,000 molecules: kept at 12 x 8 (the look adds no triangles here)
    const mk = (s, cnt) => { const m = new THREE.InstancedMesh(sg, MD.on ? MD.mat(elColor(s), 'plastic') : new THREE.MeshStandardMaterial({ color: elColor(s), emissive: elColor(s).multiplyScalar(.35), roughness: .5 }), Math.max(cnt, 1)); m.count = 0; F.add(m); meshes[s] = m; return m; };
    const need = { N: (counts.N2 || 0) * 2, O: (counts.O2 || 0) * 2 + (counts.CO2 || 0) * 2 + (counts.H2O || 0), Ar: counts.Ar || 0, C: (counts.CO2 || 0) + (counts.CH4 || 0), H: (counts.H2O || 0) * 2 + (counts.H2 || 0) * 2 + (counts.H || 0) + (counts.CH4 || 0) * 4, He: counts.He || 0 };
    const CH4_H = [[-.633, -.782, -.426], [-.39, .98, -.284], [.005, -.088, 1.089], [1.018, -.11, -.379]].map(v => new V3(v[0], v[1], v[2]).multiplyScalar(.1));   // the four C-H bonds of methane (nm), from data/molecules_all.json
    for (const s in need) if (need[s] > 0) mk(s, need[s]);
    const hA = [new V3(Math.sin(52.26 * Math.PI / 180) * .0957, Math.cos(52.26 * Math.PI / 180) * .0957, 0), new V3(-Math.sin(52.26 * Math.PI / 180) * .0957, Math.cos(52.26 * Math.PI / 180) * .0957, 0)];
    const m4 = new THREE.Matrix4(), place = () => {
      for (const s in meshes) meshes[s].count = 0;
      const put = (s, p, rad) => { const m = meshes[s]; m4.makeScale(rad, rad, rad).setPosition(p); m.setMatrixAt(m.count++, m4); };
      mols.forEach(m => {
        const h = m.d;
        if (m.kind === 'N2') { put('N', m.p.clone().addScaledVector(h, .055), .155); put('N', m.p.clone().addScaledVector(h, -.055), .155); }
        else if (m.kind === 'O2') { put('O', m.p.clone().addScaledVector(h, .06), .152); put('O', m.p.clone().addScaledVector(h, -.06), .152); }
        else if (m.kind === 'H2') { put('H', m.p.clone().addScaledVector(h, .037), .11); put('H', m.p.clone().addScaledVector(h, -.037), .11); }
        else if (m.kind === 'Ar') put('Ar', m.p, .188);
        else if (m.kind === 'He') put('He', m.p, .14);
        else if (m.kind === 'H') put('H', m.p, .11);
        else if (m.kind === 'CH4') { put('C', m.p, .17); for (const v of CH4_H) put('H', m.p.clone().add(v.clone().applyQuaternion(m.q)), .11); }
        else if (m.kind === 'CO2') { put('C', m.p, .17); put('O', m.p.clone().addScaledVector(h, .116), .152); put('O', m.p.clone().addScaledVector(h, -.116), .152); }
        else { put('O', m.p, .152); put('H', m.p.clone().add(hA[0].clone().applyQuaternion(m.q)), .11); put('H', m.p.clone().add(hA[1].clone().applyQuaternion(m.q)), .11); }
      });
      for (const s in meshes) { meshes[s].instanceMatrix.needsUpdate = true; meshes[s].computeBoundingSphere && meshes[s].computeBoundingSphere(); }
    };
    place();
    const KN = { N2: 'N₂', O2: 'O₂', Ar: 'Ar', CO2: 'CO₂', H2O: 'H₂O', H2: 'H₂', He: 'He', H: 'H', CH4: 'CH₄' };
    const info = custom ? { title: o.gasTitle || 'Gas', tag: 'A gas, at the scale of molecules', body: `<p>${o.gasBody || o.gasBlurb || ''}</p>${o.gasNote ? `<p class="mini">${o.gasNote}</p>` : ''}`, facts: [['Drawn', n === 1 ? 'one atom or molecule' : `${n} atoms or molecules`], [mix.map(m => KN[m[0]] || m[0]).join(' : '), mix.map(m => cs(m[0])).join(' : ')]] }
      : giant
      ? { title: 'Hydrogen and helium gas', tag: 'The air of a gas giant', body: `<p>The air of Jupiter and Saturn is mostly hydrogen and helium: about 90% H₂ molecules and 10% helium atoms by number in Jupiter (NASA planetary fact sheet). Uranus and Neptune also hold a few percent methane (CH₄), not drawn here.</p><p class="mini">Model: random positions and orientations, drawn at the same number density as air at sea level on Earth (0.025 molecules per nm³) so the pictures can be compared. The real density at a giant's cloud tops is different. Molecules are drawn at true size; motion is slowed about a trillion times.</p>`, facts: [['Molecules shown', n], ['H₂ : He', `${cs('H2')} : ${cs('He')}`], ['Mean spacing (as drawn)', '≈ 3.4 nm']] }
      : { title: 'Air', tag: 'A gas mixture at sea level', body: `<p>Air is mostly empty space. At sea level and 25 °C a cubic nanometer holds on average just 0.025 molecules, so neighbours are about 3.4 nm apart, ten times the size of a molecule. About 78% nitrogen (N₂), 21% oxygen (O₂), 0.9% argon, about 1% water vapour in humid air, and a trace of CO₂ (about 0.04%, so usually none in a view this small).</p><p class="mini">Model: random positions and orientations at the true density, a frozen snapshot. Molecules are drawn at true size. A real N₂ molecule moves about 475 m/s (calculated for 25 °C) and travels about 68 nm between collisions; motion here is slowed about a trillion times.</p>`, facts: [['Molecules shown', n], ['N₂ : O₂ : Ar : H₂O : CO₂', `${cs('N2')} : ${cs('O2')} : ${cs('Ar')} : ${cs('H2O')} : ${cs('CO2')}`], ['Mean spacing', '≈ 3.4 nm'], ['Mean free path', '≈ 68 nm']] };
    for (const s in meshes) { const m = meshes[s]; m.userData = { id: 'gasmol', priority: 3, sym: s, infoFn: () => info, madeOf: 'molecule', center: h => { const M = new THREE.Matrix4(); m.getMatrixAt(h.hit.instanceId, M); return new V3().setFromMatrixPosition(M); }, radius: () => .3 }   /* the instance matrix is already in the frame's own coordinates */; F.pickables.push(m); }
    F.info = info; F.name = custom ? (o.gasTitle || 'Gas') : giant ? 'Hydrogen and helium gas' : 'Air molecules';
    F.blurb = custom ? (o.gasBlurb || '') : giant ? 'Hydrogen and helium, the gas of a giant planet, at the scale of molecules.' : 'Air at the scale of molecules: mostly empty space.';
    F.note = custom ? (o.gasNote || 'Model: a random snapshot; molecules at true size. Colours are the CPK convention.') : 'Model: random snapshot at true density and true molecule size, motion slowed about a trillion times. Colours are the CPK convention.' + (giant ? ' Density drawn is that of air on Earth, for comparison.' : '');
    F.update = dt => {
      if (cam.D < 9e-9) return; // freeze when you're looking closely (before the zoom starts to close on one molecule)
      const s = dt * .25 * smooth(9e-9, 2e-8, cam.D);
      mols.forEach(m => { m.p.addScaledVector(m.v, s); if (m.p.length() > R) m.p.multiplyScalar(-.98); m.d.applyAxisAngle(new V3(0, 1, 0), dt * .3); m.q.setFromUnitVectors(new V3(0, 1, 0), m.d); });
      place();
    };
    MD.kind(F, 'Model'); MD.stage(F, { near: .6, far: 3.5 });
    // the molecules are what a zoom ends on: below 8 nm (when only a handful are in view) it converges on the one nearest the pointer, however empty the gas between
    F.att = {
      D: 8e-9,
      find(P) { let best = -1, bd = Infinity; for (let i = 0; i < mols.length; i++) { const d = mols[i].p.distanceToSquared(P); if (d < bd) { bd = d; best = i; } } return best; },
      pos(id, out) { const m = mols[id]; return m ? out.copy(m.p) : null; }
    };
    F.spawn = (T, hint) => {
      let i = attId(F); if (i < 0) i = F.att.find(T); const best = mols[i]; if (!best) return null;
      const id = { N2: 'nitrogen', O2: 'oxygen', CO2: 'carbon_dioxide', H2O: 'water', H2: 'hydrogen', CH4: 'methane' }[best.kind];
      if (!id) return atomFrame(best.kind, best.p);
      return new Frame({ type: 'mol', pinned: true, name: { N2: 'Nitrogen, N₂', O2: 'Oxygen, O₂', CO2: 'Carbon dioxide, CO₂', H2O: 'Water, H₂O', H2: 'Hydrogen, H₂', CH4: 'Methane, CH₄' }[best.kind], unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: best.p.clone(), opts: { mol: id, fixed: true } });
    };
  }
};
/* ---------- plasma (inside the Sun, or a star) — unit nm ---------- */
const PLASMA_SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const plasmaSci = x => { const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return `${m.toFixed(1)} × 10${e < 0 ? '⁻' : ''}${String(Math.abs(e)).split('').map(c => PLASMA_SUP[+c]).join('')}`; };
FT.plasma = {
  build(F, o = {}) {   // o.title, o.blurb, o.note: a plasma somewhere other than the Sun, named and qualified by the materials table (js/descent.js)
    F.env = { opaque: true, bg: 0x04070f };
    const par = F.parent, AUSUN = 695700 / 1.495978707e8; let r = null;
    if (par && par.type === 'sun') r = F.pos.length(); else if (par && par.type === 'solarsystem' && F.pos.length() < 2 * AUSUN) r = F.pos.length() / AUSUN;
    const M = r === null ? null : sunAt(r), ionised = !M || M.T > 1.5e4;
    const X = M ? M.X : .7, Z = .02, Y = 1 - X - Z, nH = X / 1.008, nHe = Y / 4.0026, ne = nH + 2 * nHe;       // moles per gram of each species
    const perM3 = M ? M.rho * 1000 * 6.02214e23 * (ionised ? nH + nHe + ne : nH + nHe) : null;                    // particles (ions and electrons, or atoms) per m3
    const Rp = ionised ? 30 : 60, vol = 4 / 3 * Math.PI * Math.pow(Rp * 1e-9, 3), Nreal = perM3 ? perM3 * vol : null;
    const N = Nreal ? Math.max(24, Math.min(2600, Math.round(Nreal))) : 2600;
    const rg = rng(4), P = [], C = [], S = [], K = [], tot = ionised ? nH + nHe + ne : nH + nHe;
    const add = (kind) => { const p = new V3(gauss(rg), gauss(rg), gauss(rg)).normalize().multiplyScalar(Rp * Math.cbrt(rg())); return p; };
    const species = ionised ? [['p', nH / tot, [1, .42, .3], 1.8], ['he', nHe / tot, [1, .82, .3], 3.2], ['e', ne / tot, [.5, .75, 1], 1.0]] : [['p', nH / tot, [1, .42, .3], 3], ['he', nHe / tot, [1, .82, .3], 5]];
    species.forEach(([k, f, c, sz]) => { const n = Math.round(N * f); for (let i = 0; i < n; i++) { const p = add(); P.push(p.x, p.y, p.z); C.push(...c); S.push(sz); K.push(k); if (!ionised) { const q = p.clone().add(new V3(gauss(rg), gauss(rg), gauss(rg)).multiplyScalar(.9)); P.push(q.x, q.y, q.z); C.push(.5, .75, 1); S.push(1.6); K.push('e'); if (k === 'he') { const q2 = p.clone().add(new V3(gauss(rg), gauss(rg), gauss(rg)).multiplyScalar(.9)); P.push(q2.x, q2.y, q2.z); C.push(.5, .75, 1); S.push(1.6); K.push('e'); } } } });
    const pts = makePoints(P, C, S); if (MD.on) MD.discs(pts); F.add(pts); F.pick(pts, 'plasma', 1); pts.userData.madeOf = null;
    const T = M ? M.T : null, vp = T ? Math.sqrt(3 * 1.380649e-23 * T / 1.67262e-27) / 1000 : null;
    const place = M ? (r > .999 ? 'the photosphere, the Sun\'s visible surface' : r < .001 ? 'the centre of the Sun (the core)' : `${(r * 100).toFixed(0)}% of the way out from the centre, in the Sun's ${M.layer} ${M.layer === 'core' ? '' : 'zone'}`.replace(' zone', ' zone').replace('core ', 'core')) : null;
    const tK = T ? (T >= 1e6 ? `${(T / 1e6).toFixed(T >= 1e7 ? 1 : 1)} million K` : `${Math.round(T).toLocaleString('en-US')} K`) : '';
    const rho = M ? (M.rho >= 1 ? `${Math.round(M.rho).toLocaleString('en-US')} kg/m³` : `${plasmaSci(M.rho)} kg/m³`) : '';
    const comp = M ? `${Math.round(X * 100)}% hydrogen and ${Math.round(Y * 100)}% helium by mass` : '';
    pts.userData.info = M ? { title: ionised ? 'Plasma inside the Sun' : 'Gas at the Sun\'s surface', tag: ionised ? 'Fully ionised plasma' : 'Hot, thinly ionised gas',
      body: ionised ? `<p>At ${tK} atoms cannot hold on to their electrons. What is left is a gas of bare hydrogen nuclei (single protons, red), helium nuclei (gold) and free electrons (blue), all moving freely, steered by electric and magnetic fields. This is the fourth state of matter, plasma.</p>`
        : `<p>At about ${tK} the gas at the Sun's surface is mostly <b>neutral atoms</b>: a proton with its electron (red and blue) and helium atoms (gold with two blue electrons). Only about 3% of the hydrogen is ionised. The Sun's surface is not a plasma in the sense of its hot interior.</p>`,
      facts: [['Where', place], ['Temperature', `≈ ${tK} (standard solar model)`], ['Density', `≈ ${rho}`], ['Composition', `≈ ${comp} (approximate)`], ['Particles per m³', `≈ ${plasmaSci(perM3)}`], ['Typical proton speed', `≈ ${Math.round(vp).toLocaleString('en-US')} km/s (√(3kT/m), calculated)`]],
      note: 'Conditions are interpolated between standard-solar-model values; the picture is schematic.' }
      : { title: 'Plasma', tag: 'The fourth state of matter', body: '<p>So hot that atoms are torn apart: bare nuclei (red, mostly protons) and free electrons (blue) fly separately. Plasma conducts electricity and is steered by magnetic fields. Over 99% of the visible matter in the universe is plasma, and stars are made of it.</p>', facts: [['Sun\'s surface', '≈ 5,772 K'], ['Sun\'s core', '≈ 15 million K']] };
    if (M) {
      F.name = ionised ? `Plasma inside the Sun (${r < .001 ? 'centre' : r.toFixed(2) + ' R'})` : 'Gas at the Sun\'s surface';
      if (!F.blurb || r > .001) F.blurb = `Inside the Sun, at ${place}: a patch ${Rp * 2} nm wide, ${tK}, density ${rho}. ${ionised ? 'Bare hydrogen and helium nuclei and free electrons.' : 'Mostly neutral hydrogen and helium atoms.'}`;
      F.note = `Schematic: ${N.toLocaleString('en-US')} particles are drawn${Nreal && Nreal > N * 1.5 ? ` of the roughly ${plasmaSci(Nreal)} that would fill this view (at this density the real spacing is about ${(Math.cbrt(1 / perM3) * 1e9).toFixed(3)} nm)` : Nreal ? ' (about the true number for this density)' : ''}; positions are random and the dots are far larger than real nuclei (about 10⁻¹⁵ m). Composition: ${comp} (rounded); the heavier elements (about 2%) are left out. Conditions come from a standard solar model, interpolated.`;
    } else { F.blurb = o.blurb || F.blurb || 'Stellar plasma at nanometer scale: free electrons and bare nuclei.'; F.note = o.note || 'Schematic: a patch of stellar plasma drawn at random; the conditions of any particular star are not modelled.'; if (o.title) F.name = o.title; }
    const vel = new Float32Array(P.length), sp = { p: 1, he: .5, e: 6 }; for (let i = 0; i < K.length; i++) { const k = sp[K[i]] * (T ? Math.sqrt(T / 1.57e7) : 1) * .8; vel[3 * i] = gauss(rg) * k; vel[3 * i + 1] = gauss(rg) * k; vel[3 * i + 2] = gauss(rg) * k; }
    const pos = pts.geometry.attributes.position;
    const _yAx = new V3(0, 1, 0), uk = F.unit / 1e-9;   // uk: the patch is drawn in the frame's own unit (nanometres inside the Sun, ångströms for a star)
    F.update = (dt, t) => {
      const mv = smooth(1.2e-8 * uk, 4e-8 * uk, cam.D); if (!mv) return;   // everything comes to rest as you close in, so that the particle you are heading for is still there when you arrive
      pts.rotation.y += dt * .04 * mv; const d = Math.min(dt, .05) * mv; // thermal motion, slowed down enormously: electrons move fastest, helium nuclei slowest
      if (ionised) for (let i = 0; i < K.length; i++) { let x = pos.array[3 * i] + vel[3 * i] * d, y = pos.array[3 * i + 1] + vel[3 * i + 1] * d, z = pos.array[3 * i + 2] + vel[3 * i + 2] * d; if (x * x + y * y + z * z > Rp * Rp) { vel[3 * i] *= -1; vel[3 * i + 1] *= -1; vel[3 * i + 2] *= -1; x = pos.array[3 * i]; y = pos.array[3 * i + 1]; z = pos.array[3 * i + 2]; } pos.array[3 * i] = x; pos.array[3 * i + 1] = y; pos.array[3 * i + 2] = z; }
      pos.needsUpdate = true;
    };
    MD.kind(F, 'Model'); MD.stage(F, { near: .6, far: 3 });
    // zooming into a nucleus goes on down: a hydrogen nucleus is a proton; a helium nucleus is two protons and two neutrons
    // the nuclei are what a zoom ends on (an electron has nothing inside it to go on to): below 10 nm it converges on the nucleus nearest the pointer
    const _pp = new V3();
    F.att = {
      D: 1e-8 * uk,
      find(P, hint) {
        const A = pos.array; _pp.copy(P).applyAxisAngle(_yAx, -pts.rotation.y);
        if (hint && hint.obj === pts && hint.hit && hint.hit.index != null && K[hint.hit.index] !== 'e') return hint.hit.index;
        let bi = -1, bd = Infinity; for (let i = 0; i < K.length; i++) { if (K[i] === 'e') continue; const dx = A[i * 3] - _pp.x, dy = A[i * 3 + 1] - _pp.y, dz = A[i * 3 + 2] - _pp.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bi = i; } }
        return bi;
      },
      pos(id, out) { const A = pos.array; return id >= 0 && id < K.length ? out.set(A[id * 3], A[id * 3 + 1], A[id * 3 + 2]).applyAxisAngle(_yAx, pts.rotation.y) : null; }
    };
    F.spawn = (T) => {
      let bi = attId(F); if (bi < 0) bi = F.att.find(T, null); if (bi < 0) return null;
      const at = F.att.pos(bi, new V3());
      if (K[bi] === 'he') return new Frame({ type: 'nucleus', pinned: true, name: 'Helium-4 nucleus', unit: 1e-15, radius: 40, r0: 1.5e-15, r1: 3e-13, spawnD: 4e-15, pos: at, opts: { Z: 2, N: 2, el: 'He' } });
      return new Frame({ type: 'proton', pinned: true, name: 'Proton', unit: 1e-15, radius: 4, r1: 1.2e-14, pos: at, opts: { kind: 'proton' } });
    };
    F.spawnD = 3e-11;
  }
};
/* ---------- nucleus (unit fm) ---------- */
FT.nucleus = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.AmbientLight(0x8899bb, .55)); const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5, 8, 6); F.add(dl);
    const Z = o.Z || 8, N = o.N || 8, A = Z + N, r = rng(A * 7), rn = .84, pts = [];
    const types = shuffle([...Array(Z).fill('p'), ...Array(N).fill('n')], r);
    types.forEach(() => pts.push(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.5)));
    for (let it = 0; it < 160; it++) { for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = new V3().subVectors(pts[j], pts[i]); let L = d.length(); if (L < 1e-4) { d.set(r() - .5, r() - .5, r() - .5); L = d.length(); } if (L < 1.7) { d.multiplyScalar((1.7 - L) / 2 / L); pts[i].sub(d); pts[j].add(d); } } if (it < 130) pts.forEach(p => p.multiplyScalar(.97)); }
    const pm = smat(0xff4d4d, { roughness: .35, emissive: 0x2a0000 }), nm = smat(0x9fb3c8, { roughness: .4, emissive: 0x06090e }), geo = new THREE.SphereGeometry(rn, 32, 24);
    F.nucleons = [];
    types.forEach((t, i) => { const m = new THREE.Mesh(geo, t === 'p' ? pm : nm); m.position.copy(pts[i]); F.pick(m, t === 'p' ? 'proton' : 'neutron', 3); m.userData.madeOf = 'quarks'; F.add(m); F.nucleons.push(m); });
    const Rn = 1.2 * Math.cbrt(A);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(Rn * 1.15, 48, 32), fresnelMat(0xff9966, 2.2, .5)); F.add(shell);
    F.label(F.nucleons[types.indexOf('p')], 'Proton', { offset: new V3(0, 1.1, 0) }); if (N) F.label(F.nucleons[types.indexOf('n')], 'Neutron', { offset: new V3(0, -1.3, 0) });
    F.info = { title: `Nucleus of ${o.el || ''} (${Z} protons, ${N} neutrons)`, tag: 'Atomic nucleus', body: '<p>Protons and neutrons (nucleons) packed together by the residual strong force, which overpowers the protons\' electric repulsion at distances below ~2.5 fm. Nuclear matter has a nearly constant density of about 2×10¹⁷ kg/m³ — a teaspoon would weigh about a billion tonnes.</p>', facts: [['Radius', `≈ ${Rn.toFixed(1)} fm (1.2·A^⅓)`], ['Nucleon radius', '≈ 0.84 fm']] };
    F.blurb = `An atomic nucleus at true size: ${Rn.toFixed(1)} femtometers (10⁻¹⁵ m) across. Each ball is a proton (red) or neutron (gray).`;
    F.update = (dt, t) => { F.nucleons.forEach((m, i) => m.position.copy(pts[i]).addScaledVector(new V3(Math.sin(t * 3 + i), Math.cos(t * 2.6 + i * 2), Math.sin(t * 2.2 + i * 3)), .035)); };
    F.spawn = (T, hint) => {
      let best = null, bd = Infinity; F.nucleons.forEach(m => { const d = m.position.distanceTo(T); if (d < bd) { bd = d; best = m; } }); if (!best || bd > 1.6) return null;
      return new Frame({ type: 'proton', pinned: true, name: best.userData.id === 'proton' ? 'Proton' : 'Neutron', unit: 1e-15, radius: 4, r1: 1.2e-14, pos: best.position.clone(), opts: { kind: best.userData.id } });
    };
  }
};
/* ---------- DNA (unit nm) & cell (unit µm) via v2 ---------- */
v2frame('dna', 'dna', () => 1 / 2.4, (F, c) => {
  F.blurb = 'DNA, the double helix. Choose "Chromatin packing" to see how it is wound round proteins.';
  if (MD.on) { MD.restyleDNA(F, c); MD.kind(F, 'Model', 'Colours are a code: A green, T red, G yellow, C blue; the backbone pale (sugar) and ochre (phosphate).'); MD.stage(F, { near: .85, far: 2.4 }); }
  F.spawn = (T, hint) => {
    const id = hint && hint.id || '';
    const mol = /base_[AT]/.test(id) ? 'bp_AT' : /base_[GC]/.test(id) ? 'bp_GC' : id === 'sugar' ? 'deoxyribose' : id === 'phosphate' ? 'phosphate' : 'bp_GC';
    const nm = { bp_AT: 'Adenine-thymine base pair', bp_GC: 'Guanine-cytosine base pair', deoxyribose: 'Deoxyribose (the sugar in DNA)', phosphate: 'Phosphate group' }[mol];
    return new Frame({ type: 'mol', name: nm, unit: 1e-10, radius: 25, r1: 1.2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol, fixed: true } });
  };
  F.spawnD = 2.5e-9;
});
v2frame('cell', 'cell', (c) => c.opts.type === 'bacterium' ? .1 : 10 / 12, (F, c) => {
  const kind = c.cellKind || 'animal';
  const NAMES = { animal: 'Animal cell', plant: 'Plant cell', bacterium: 'Bacterium' };
  const BLURBS = {
    animal: 'A generic animal cell, about 20 µm across (a skin cell is one example). A human body has about 30 trillion cells of several hundred types.',
    plant: 'A plant cell, here about 30 µm long, as in a leaf. Chloroplasts capture sunlight.',
    bacterium: 'A rod-shaped bacterium, about 2 µm long. It has no nucleus: its DNA floats in the cell as a tangle called the nucleoid.',
  };
  F.name = (F.opts && F.opts.cname) || NAMES[kind]; F.blurb = (F.opts && F.opts.blurb) || BLURBS[kind];
  if (MD.on) { MD.restyleCell(F, c); MD.kind(F, 'Model', kind === 'plant' ? 'Colours are a code to tell the parts apart (living cells are nearly colourless); only the chloroplasts\' green is their real colour.' : 'Colours are a code to tell the parts apart: living cells are nearly colourless.' + (kind === 'bacterium' ? '' : ' The membrane\'s edge shows its two layers, drawn far thicker than they are.')); MD.stage(F, { near: .75, far: 2.4 }); if (F._mdc) MDC.note(F, F._mdc); }
  const nuc0 = c.nucPos.clone();
  F.chooseHit = cands => {
    let best = null; for (const k of cands) if (!best || k.pri > best.pri) best = k;
    if (!best) return null;
    const id = best.obj.userData.id;
    if (id !== 'membrane' && id !== 'cellwall' && id !== 'bacwall') return best;
    const inner = cands.find(k => k.obj.userData.id === 'cytoplasm');
    if (!inner) return best;
    // the shell wins only at the rim of the cell (a ray that skims it) or at a box edge; anywhere else the click is on the cytoplasm behind it
    let rim;
    if (id === 'cellwall') { const p = best.hit.object.worldToLocal(best.hit.point.clone()), g = best.hit.object.geometry.parameters; const e = [Math.abs(p.x) > g.width / 2 - 1.3, Math.abs(p.y) > g.height / 2 - 1.3, Math.abs(p.z) > g.depth / 2 - 1.3]; rim = e.filter(Boolean).length >= 2; }
    else { const nrm = best.hit.face.normal.clone().transformDirection(best.hit.object.matrixWorld); rim = Math.abs(nrm.dot(raycaster.ray.direction)) < .4; }
    return rim ? best : inner;
  };
  if (MD.on && F._mdChoose) F.chooseHit = F._mdChoose();   // the cut-open model's own rule (MDC)
  F.spawn = (T, hint) => {
    let id = hint && hint.id || '';
    if (c.patchOn) id = /phospholipid|channel|glyco/.test(id) ? id : 'phospholipid';   // the membrane patch sits at the cell centre in the drawing, but it is a patch of membrane
    const nucP = nuc0.clone().multiplyScalar(c.k);
    const dnaF = () => new Frame({ type: 'dna', name: kind === 'bacterium' ? 'DNA of the bacterium' : 'DNA', unit: 1e-9, radius: 30, r1: 2.5e-7, pos: T.clone() });
    // The part the pointer is on decides. Being close to the nucleus counts only when the pointer is on nothing (it used to send a membrane protein into DNA).
    if (id && typeof DESCENT !== 'undefined') { const q = { id, node: hint.obj && hint.obj.userData.node, what: hint.obj && hint.obj.userData.info && hint.obj.userData.info.title, u: (hint.obj && hint.obj.userData) || {} }; if (DESCENT.known(F, q)) return DESCENT.spawnFor(F, q, T); }   // data/descent/assign/cell.json: ribosome, nucleolus, ER ...
    if (kind === 'bacterium') { if (/nucleoid/.test(id) || (!id && T.distanceTo(nucP) < 3 * c.k)) return dnaF(); }
    else if (!c.patchOn && (/^nucleus$|chromatin/.test(id) || (!id && T.distanceTo(nucP) < 3.4 * c.k))) return dnaF();
    const molF = (mol, name) => new Frame({ type: 'mol', name, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol, fixed: false, cname: name } });
    if (/membrane|phospholipid|channel|glyco/.test(id)) return molF('popc', 'POPC, a common membrane phospholipid (one lipid of the bilayer)');
    if (/mito/.test(id)) return molF('atp', 'ATP, the molecule mitochondria make (the inside of a mitochondrion is not built yet)');
    if (/chloro/.test(id)) return molF('chlorophyll_a', 'Chlorophyll a, the green pigment in chloroplasts');
    if (/cellwall/.test(id)) return molF('cellotriose', 'Cellotriose: three glucose units of cellulose, the stuff of plant cell walls');
    if (/vacuole/.test(id)) return new Frame({ type: 'liquid', name: 'Water, the main ingredient of a vacuole (dissolved sugars and salts not drawn)', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
    if (/^(cytoplasm|bacwall)$/.test(id) || !id) return new Frame({ type: 'liquid', name: 'Water, the main ingredient of cytoplasm (dissolved molecules not drawn)', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
    return null;   // anything else: the materials table's default for a cell (js/descent.js)
  };
  F.spawnD = kind === 'bacterium' ? 6e-6 : 1.2e-6;
});
/* ---------- micro scale (unit µm): tissue surfaces, grains, pond life, aerosols ---------- */
function voronoiTex(key, cols, n, line, seed, w = 512) {
  return canvasTex(key, w, w, (g) => {
    const r = rng(seed), P = []; for (let i = 0; i < n; i++) P.push([r() * w, r() * w, cols[i % cols.length]]);
    const img = g.createImageData(w, w), d = img.data;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      let b1 = 1e9, b2 = 1e9, c = null; for (const p of P) { let dx = Math.abs(x - p[0]), dy = Math.abs(y - p[1]); dx = Math.min(dx, w - dx); dy = Math.min(dy, w - dy); const dd = dx * dx + dy * dy; if (dd < b1) { b2 = b1; b1 = dd; c = p[2]; } else if (dd < b2) b2 = dd; }
      const e = Math.sqrt(b2) - Math.sqrt(b1), k = (y * w + x) * 4, edge = e < line ? .55 + .45 * e / line : 1;
      const col = new THREE.Color(c); d[k] = col.r * 255 * edge; d[k + 1] = col.g * 255 * edge; d[k + 2] = col.b * 255 * edge; d[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { wrap: true });
}
const FUNGAL = { type: 'animal', cname: 'Fungal cell (drawn as a generic animal-type cell)', blurb: 'A fungal cell: like an animal cell it has a nucleus and organelles, but it also has a rigid wall of chitin, which is not drawn here.', note: 'Fungal cells have a chitin wall that this generic cell does not show.' };
const DIATOM = { type: 'plant', cname: 'Diatom cell (drawn as a generic plant-type cell)', blurb: 'A diatom is a single-celled alga. Like a plant cell it has a nucleus and chloroplasts; it lives in a two-part shell of silica (glass), which is not drawn here.', note: 'The diatom\'s silica shell is not drawn.' };
const ALGA = { type: 'plant', cname: 'Green alga cell (drawn as a generic plant-type cell)', blurb: 'A single-celled green alga, close kin of land plants: nucleus, chloroplasts and a cell wall.', note: 'Real algal cells are often rounder and have one large chloroplast; this is the generic plant cell.' };
const POLLEN = { type: 'plant', cname: 'Pollen grain (drawn as a generic plant-type cell)', blurb: 'A pollen grain is a tiny plant body inside a tough wall of sporopollenin; it carries the male cells. The scene shows a generic plant cell, not its real structure.', note: 'A pollen grain is not like a leaf cell: this generic plant cell stands in for it.' };
const MICRO = {
  skin: { title: 'Skin surface', blurb: 'Your skin, about 1 mm across: the outer layer is flattened dead cells (corneocytes, tens of µm across) that flake off all the time. A hair is roughly 50 to 100 µm thick.', ground: ['#e9b59b', '#e2a98e', '#efc0a6', '#dca089'], cells: 30, hair: 3, bact: 40, child: 'cell' },
  fur: { title: 'Dog skin and fur', blurb: 'Fur, about 1 mm across: each hair is a tube of dead keratin cells about 50–100 µm thick.', ground: ['#c9a27e', '#b8916e', '#d6b08b'], cells: 30, hair: 40, bact: 20, child: 'cell' },
  leaf: { title: 'Leaf surface', blurb: 'A leaf, about 1 mm across: epidermis cells (jigsaw-shaped in many plants, drawn here as simple polygons) and stomata, tiny mouths (~25 µm) that let CO₂ in and water vapour out.', ground: ['#5fa64a', '#69b153', '#57983f', '#74b85b'], cells: 22, stoma: 14, bact: 10, child: 'plantcell' },
  soil: { title: 'Soil', blurb: 'Soil, about 1 mm across: mineral grains (sand ~0.1–2 mm, silt, clay), organic matter, fungal threads and bacteria — a gram of soil holds ~1 billion microbes.', ground: ['#5b4632', '#4f3c2a', '#6a523a'], grains: ['#cdb89a', '#a58e6e', '#8c7a63', '#e0d3bd'], n: 160, hyphae: 25, bact: 120, crystal: 'quartz' },
  sand: { title: 'Desert sand', blurb: 'Sand grains are mostly quartz (SiO₂) rounded by wind — each 0.06–2 mm.', ground: ['#d9b77f', '#cfa86c'], grains: ['#e8cf9c', '#d4b07a', '#f0dcb4', '#c79d63', '#b98a55'], n: 220, crystal: 'quartz' },
  regolith: { title: 'Lunar regolith', blurb: 'Moon dust: sharp, glassy fragments made by billions of years of micrometeorite impacts — no wind or water has ever rounded them.', ground: ['#5c5c5c', '#666'], grains: ['#8a8a8a', '#6f6f6f', '#a2a2a2', '#4d4d4d', '#b5b0a0'], n: 220, sharp: true, crystal: 'forsterite' },
  mars: { title: 'Martian soil', blurb: 'Mars dust is basaltic rock coated with iron oxides (rust) — that is why the planet is red.', ground: ['#8a4a2e', '#7a3f26'], grains: ['#b3623b', '#a0522d', '#c27a4f', '#7c3a21'], n: 220, crystal: 'hematite' },
  ice: { title: 'Snow and ice', blurb: 'Snow and ice: crystals of frozen water, each grain a lattice of H₂O molecules in hexagonal ice Ih.', ground: ['#dfeef8', '#cfe3f2'], grains: ['#f4fbff', '#e2f1fb', '#d0e6f6'], n: 120, crystal: 'ice_ih', glass: true },
  pond: { title: 'Pond water', blurb: 'A drop of pond water, about 1 mm across: diatoms with glass (silica) shells, green algae and bacteria drift in liquid water.', water: true, diatoms: 40, algae: 60, bact: 200, child: 'water' },
  ocean: { title: 'Sea water', blurb: 'Sea water, about 1 mm across: phytoplankton make about half of Earth\'s oxygen.', water: true, diatoms: 50, algae: 80, bact: 200, child: 'water' },
  air: { title: 'Air (aerosols)', blurb: 'Air, about 1 mm across: almost empty, with a few dust grains, pollen and cloud droplets drifting by. The gas molecules themselves are far too small to see at this scale.', air: true, child: 'gas' },
  cloudtops: { title: 'Cloud tops of a gas giant', blurb: 'Inside a giant planet\'s upper atmosphere, about 1 mm across: the gas is mostly hydrogen and helium. The cloud particles and haze that colour the planet are not drawn here.', air: 'giant', child: 'gas' },
  rock: { title: 'Rock surface', blurb: 'Granite-like rock: interlocking crystals of quartz, feldspar and mica.', ground: ['#a9a39b', '#8f8a84', '#c8c2b8', '#5f5b57', '#e6dfd2'], cells: 40, crystal: 'quartz' },
  basalt: { title: 'Basalt', blurb: 'Basalt is a dark volcanic rock made of tiny crystals (mostly pyroxene and feldspar). Landers on Venus measured rock compositions similar to basalts, and radar maps show lava plains across most of the planet.', ground: ['#4f4a44', '#5d5750', '#3f3b37', '#6b645b'], cells: 40, crystal: 'forsterite' },
  metal: { title: 'Metal surface', blurb: 'Polished iron under a microscope shows grains — each a single crystal of atoms in a cubic lattice.', ground: ['#9aa3ad', '#8c96a1', '#a7b0b9'], cells: 26, crystal: 'iron_bcc' },
};
/* over (optional): {title, blurb, crystal, material} from the materials table: the same picture standing for another material of the same kind (aluminium grains drawn
   with the metal scene; ice grains on Europa), named as what it is. `material`: what its grains, its surface, its water or its gas lead into, instead of the scene's own. */
function microFrame(kind, pos, quat, over) { const M = MICRO[kind] || MICRO.soil; return new Frame({ type: 'micro', name: (over && over.title) || M.title, unit: 1e-6, radius: M.air || M.water ? 1100 : 800,   /* what drifts in air or water is scattered through a box that reaches past 800 µm */ r0: 1.5e-4, r1: 6e-3, spawnD: 1.5e-4, pos: pos.clone(), quat: quat || new THREE.Quaternion(), up: new V3(0, 1, 0), opts: Object.assign({ kind }, over && (over.title || over.blurb || over.crystal || over.material) ? { over: { title: over.title, blurb: over.blurb, crystal: over.crystal, material: over.material } } : {}) }); }
FT.micro = {
  build(F, o) {
    const M = Object.assign({}, MICRO[o.kind] || MICRO.soil, o.over || {}), r = rng(o.kind.length * 13 + 5);
    F.env = { opaque: true, bg: 0x0d0f14 }; F.daylight = true; // a lit close-up of pale grains: glow only burned them out to white
    F.add(new THREE.HemisphereLight(0xf2f6ff, 0x404040, .5)); const dl = new THREE.DirectionalLight(0xffffff, .5); dl.position.set(3, 8, 4); F.add(dl);
    F.name = M.title; F.blurb = M.blurb;
    const info = { title: M.title, tag: 'Microscopic view (sizes true, shapes schematic)', body: `<p>${M.blurb}</p>` };
    if (M.ground) {
      const t = M.cells ? voronoiTex('vor_' + o.kind, M.ground, M.cells * 3, 5, 7) : canvasTex('grd_' + o.kind, 256, 256, (g, w, h) => { const rr = rng(3); g.fillStyle = M.ground[0]; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = M.ground[i % M.ground.length]; g.globalAlpha = .4; g.fillRect(rr() * w, rr() * h, 2 + rr() * 4, 2 + rr() * 4); } }, { wrap: true });
      t.repeat.set(4, 4);
      const geo = new THREE.CircleGeometry(800, 96); const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, (Math.sin(x * .02) * Math.cos(y * .017) * (M.cells ? 4 : 2)) + (o.kind === 'skin' ? -6 * Math.exp(-Math.pow((x * .7 + y * .7) % 260 / 22, 2)) : 0)); }
      geo.computeVertexNormals();
      const gm = new THREE.Mesh(geo, smat(0xffffff, { map: t, roughness: .8 })); gm.rotation.x = -Math.PI / 2; F.add(gm);
      F.pick(gm, 'microsurface', 1); gm.userData.info = info; gm.userData.madeOf = M.crystal ? 'crystal' : 'cell'; gm.userData.cellOpts = { type: M.child === 'plantcell' ? 'plant' : 'animal' };
    }
    const sg = new THREE.IcosahedronGeometry(1, 1);
    if (M.grains) {
      const pa = sg.attributes.position, gg = sg.clone(), ga = gg.attributes.position;
      for (let i = 0; i < ga.count; i++) { const v = new V3().fromBufferAttribute(ga, i); v.multiplyScalar(M.sharp ? .75 + Math.abs(Math.sin(v.x * 9 + v.y * 7)) * .5 : .9 + Math.sin(v.x * 5 + v.z * 3) * .1); ga.setXYZ(i, v.x, v.y, v.z); }
      gg.computeVertexNormals(); if (M.sharp) { gg.deleteAttribute('normal'); gg.computeVertexNormals(); }
      const im = new THREE.InstancedMesh(gg, smat(0xffffff, { roughness: M.glass ? .1 : .75, flatShading: !!M.sharp, transparent: !!M.glass, opacity: M.glass ? .85 : 1 }), M.n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < M.n; i++) { const s = Math.exp(lerp(Math.log(8), Math.log(220), Math.pow(r(), 1.6))), a = r() * TAU, d = Math.sqrt(r()) * 700; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, s * .5, Math.sin(a) * d), q, new V3(s, s * (.7 + r() * .4), s * (.8 + r() * .4))); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color(M.grains[i % M.grains.length])); }
      F.add(im); F.pick(im, 'grain', 2); im.userData.info = { title: 'Mineral grain', tag: M.title, body: `<p>${M.blurb}</p><p>Zoom into a grain to see its crystal lattice.</p>` }; im.userData.madeOf = 'crystal';
    }
    if (M.hair) {
      for (let i = 0; i < M.hair; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 600, h = 400 + r() * 600; const c = new THREE.Mesh(new THREE.CylinderGeometry(35, 38, h, 24), smat(o.kind === 'fur' ? 0x8a6340 : 0x3b2a20, { roughness: .8 })); c.position.set(Math.cos(a) * d, h / 2 - 10, Math.sin(a) * d); c.rotation.set((r() - .5) * 1.4, 0, (r() - .5) * 1.4); F.add(c); F.pick(c, 'hair', 2); c.userData.info = { title: 'Hair', tag: 'Keratin fiber, ~70 µm thick', body: '<p>A hair is a rope of dead cells packed with keratin protein, covered in overlapping scales (the cuticle). It grows from a follicle about 1 cm per month.</p>' }; c.userData.madeOf = 'protein'; }
    }
    if (M.stoma) {
      for (let i = 0; i < M.stoma; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 650, s = new THREE.Group(); s.position.set(Math.cos(a) * d, 2, Math.sin(a) * d); s.rotation.y = r() * 6; [-1, 1].forEach(k => { const g = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), smat(0x3f8f35, { roughness: .6 })); g.scale.set(14, 6, 5); g.position.z = k * 5; s.add(g); }); F.add(s); F.pick(s, 'stoma', 2); s.userData.info = { title: 'Stoma', tag: 'A leaf\'s breathing pore', body: '<p>Two curved guard cells swell with water to open the pore and shrink to close it, balancing CO₂ intake against water loss. A leaf has thousands per square centimeter.</p>' }; s.userData.madeOf = 'cell'; s.userData.cellOpts = { type: 'plant', cname: 'Guard cell (plant cell)' }; }
    }
    if (M.bact) {
      const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(.6, 10, 8).scale(1, 1, 1.9), smat(0x9fd38a, { roughness: .5 }), M.bact), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < M.bact; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 500; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, M.water ? (r() - .5) * 300 : 3, Math.sin(a) * d), q, new V3(1, 1, 1)); bm.setMatrixAt(i, m4); }
      F.add(bm); F.pick(bm, 'bacterium', 3); bm.userData.info = { title: 'Bacteria', tag: 'Single-celled prokaryotes, ~1–2 µm', body: '<p>Bacteria have no nucleus; their DNA floats in a single loop. Your skin alone carries about a trillion of them, most harmless or helpful.</p>' }; bm.userData.madeOf = 'cell'; bm.userData.cellOpts = { type: 'bacterium' };
    }
    if (M.hyphae) { for (let i = 0; i < M.hyphae; i++) { const pts = []; let p = new V3((r() - .5) * 1200, 20 + r() * 60, (r() - .5) * 1200), d = new V3(gauss(r), gauss(r) * .2, gauss(r)).normalize(); for (let k = 0; k < 12; k++) { pts.push(p.clone()); d.add(new V3(gauss(r), gauss(r) * .2, gauss(r)).multiplyScalar(.3)).normalize(); p = p.clone().addScaledVector(d, 50); } const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 2.5, 6), smat(0xe9e3d0, { roughness: .6 })); F.add(t); F.pick(t, 'hypha', 2); t.userData.info = { title: 'Fungal hyphae', tag: '~5 µm threads', body: '<p>Fungi grow as networks of thread-like cells (mycelium) that digest organic matter and trade nutrients with plant roots.</p>' }; t.userData.madeOf = 'cell'; t.userData.cellOpts = FUNGAL; } }
    if (M.water) {
      F.scene.fog = new THREE.FogExp2(0x2a6f8f, .0018); F.env = { bg: 0x2a6f8f, opaque: true };
      for (let i = 0; i < M.diatoms; i++) { const s = 15 + r() * 40, m = new THREE.Mesh(new THREE.CylinderGeometry(s, s, s * .4, 32), new THREE.MeshStandardMaterial({ color: 0xc8b46a, roughness: .2, transparent: true, opacity: .75 })); m.position.set((r() - .5) * 1100, (r() - .5) * 600, (r() - .5) * 1100); m.rotation.set(r() * 6, r() * 6, 0); F.add(m); F.pick(m, 'diatom', 2); m.userData.info = { title: 'Diatom', tag: 'Algae in glass houses, 20–200 µm', body: '<p>Diatoms build intricate shells of silica (glass). They produce about a fifth of the oxygen made on Earth each year.</p>' }; m.userData.madeOf = 'cell'; m.userData.cellOpts = DIATOM; }
      const am = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), smat(0x3fa34d, { roughness: .4 }), M.algae), m4 = new THREE.Matrix4();
      for (let i = 0; i < M.algae; i++) { const s = 4 + r() * 8; m4.makeScale(s, s, s).setPosition((r() - .5) * 1100, (r() - .5) * 600, (r() - .5) * 1100); am.setMatrixAt(i, m4); }
      F.add(am); F.pick(am, 'algae', 2); am.userData.info = { title: 'Green algae', tag: 'Single-celled plants, ~5–20 µm', body: '<p>Single-celled green algae (like Chlorella) photosynthesize with the same chlorophyll as land plants — which evolved from green algae.</p>' }; am.userData.madeOf = 'cell'; am.userData.cellOpts = ALGA;
      const wv = hitSphere(900, 'water', -1); wv.userData.info = { title: 'Liquid water', tag: 'H₂O', body: '<p>At this scale water looks perfectly smooth. Zoom another 100,000 times to see individual molecules.</p>' }; wv.userData.madeOf = 'molecule'; wv.userData.noZoom = true; wv.material.side = THREE.BackSide; F.add(wv); F.pickables.push(wv);   // noZoom: a zoom is not aimed at the far wall of the backdrop (the target used to glide out of the scene toward it)
    }
    if (M.air) {
      F.env = { bg: 0x9cc8ef, opaque: true };
      const add = M.air === 'giant' ? () => { } : (n, col, smin, smax, id, inf) => { for (let i = 0; i < n; i++) { const s = smin + r() * (smax - smin), m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, id === 'pollen' ? 2 : 1), smat(col, { roughness: id === 'droplet' ? .05 : .8, transparent: id === 'droplet', opacity: id === 'droplet' ? .6 : 1 })); m.position.set((r() - .5) * 1400, (r() - .5) * 900, (r() - .5) * 1400); F.add(m); F.pick(m, id, 2); m.userData.info = inf; m.userData.madeOf = id === 'droplet' ? 'water' : id === 'pollen' ? 'cell' : 'crystal'; if (id === 'pollen') m.userData.cellOpts = POLLEN; } };
      add(10, 0xa58e6e, 1, 6, 'dust', { title: 'Dust particle', tag: '1–10 µm', body: '<p>Mineral dust, soot and sea salt: aerosols. They seed cloud droplets and scatter sunlight. Dust is a mix, so "what it is made of" shows quartz only as one common example.</p>' });
      add(6, 0xf2c94c, 12, 18, 'pollen', { title: 'Pollen grain', tag: '~25 µm', body: '<p>A pollen grain carries a plant\'s male gametes inside a tough, often spiky shell.</p>' });
      add(14, 0xdff1ff, 5, 12, 'droplet', { title: 'Cloud droplet', tag: '≈ 20 µm across (10 µm radius)', body: '<p>A cloud droplet is about a million times smaller in volume than a raindrop. It takes about a million of them merging to make one raindrop.</p>' });
      const av = hitSphere(900, 'airvol', -1); av.material.side = THREE.BackSide; av.userData.info = { title: M.air === 'giant' ? 'Hydrogen and helium gas' : 'Air', tag: 'Gas mixture', body: M.air === 'giant' ? '<p>Zoom about 10,000× more to see individual hydrogen molecules and helium atoms.</p>' : '<p>Zoom about 10,000× more to see individual nitrogen and oxygen molecules.</p>' }; av.userData.madeOf = 'molecule'; av.userData.noZoom = true; F.add(av); F.pickables.push(av);
    }
    F.info = info;
    F.spawn = (T, hint) => {
      const id = hint && hint.id || '';
      if (id && typeof DESCENT !== 'undefined') { const u = (hint.obj && hint.obj.userData) || {}, q = { id, what: u.info && u.info.title, u }; if (DESCENT.known(F, q)) return DESCENT.spawnFor(F, q, T); }   // data/descent/assign/micro.json (dead skin cells are not living cells ...)
      if (M.material && typeof DESCENT !== 'undefined' && !/stoma|diatom|algae|hypha|bacterium|pollen|hair|dust|droplet/.test(id)) return DESCENT.spawnMat(F, M.material, T, { id, what: M.title });   // the scene was opened for a material: its grains, surface, water or gas are that material
      if (/microsurface/.test(id) || (!hint && M.ground)) {
        if (M.child === 'cell' || M.child === 'plantcell') return new Frame({ type: 'cell', name: M.child === 'plantcell' ? 'Plant cell' : 'Animal cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone().add(new V3(0, -10, 0)), opts: { type: M.child === 'plantcell' ? 'plant' : 'animal' } });
        if (M.crystal) return crystalFrame(M.crystal, T);
      }
      if (/grain|dust/.test(id)) return crystalFrame(M.crystal || 'quartz', T);
      if (/stoma|diatom|algae|hypha|bacterium|pollen/.test(id)) { const co = (hint && hint.obj && hint.obj.userData.cellOpts) || { type: 'animal' }; return new Frame({ type: 'cell', name: co.cname || 'Cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone(), opts: Object.assign({}, co) }); }
      if (/hair/.test(id)) return new Frame({ type: 'mol', name: 'Keratin building block', unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol: 'aa_cys' } });
      if (/water|droplet/.test(id) || M.water) return new Frame({ type: 'liquid', name: 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
      if (/airvol/.test(id) || M.air) return new Frame({ type: 'gas', name: M.air === 'giant' ? 'Hydrogen and helium gas' : 'Air molecules', unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: T.clone(), opts: M.air === 'giant' ? { air: 'giant' } : {} });
      return null;
    };
  }
};
function crystalFrame(id, T) { return new Frame({ type: 'crystal', name: 'Crystal lattice', unit: 1e-10, radius: 16, r1: 3e-8, spawnD: 1e-9, pos: T.clone(), opts: { id } }); }
/* ---------- landscapes (unit m): biome ground, sky, sun ---------- */
const BIOME = {
  grass: { g: ['#4f8a33', '#5d9a3e', '#6aa848', '#55803a'], trees: 260, sky: 1, micro: 'soil', h: 25 },
  forest: { g: ['#2f5e2a', '#3a6b31', '#294f25'], trees: 1400, sky: 1, micro: 'soil', h: 40 },
  desert: { g: ['#d9b77f', '#e3c48e', '#cfa86c'], dunes: true, sky: 1, micro: 'sand', h: 30 },
  ice: { g: ['#eef6fb', '#dfeef8', '#f7fbff'], sky: 1, micro: 'ice', h: 20 },
  rock: { g: ['#8f8a84', '#a19a90', '#7b746c'], sky: 1, micro: 'rock', h: 120 },
  ocean: { water: true, sky: 1, micro: 'ocean' },
  moonrock: { g: ['#7d7d7d', '#8c8c8c', '#6c6c6c'], craters: true, sky: 0, micro: 'regolith', h: 15 },
  icemoon: { g: ['#c9d3dc', '#dbe3ea', '#b4c0cb'], craters: true, sky: 0, micro: 'ice', h: 15 },   // an airless icy body (the colours are illustrative)
  mars: { g: ['#9a4f2c', '#a85a33', '#8a4426'], rocks: true, sky: 2, micro: 'mars', h: 40 },
  venus: { g: ['#6b5a45', '#5d4e3b', '#7a6850'], sky: 3, micro: 'basalt', h: 20 },
  cloudtops: { water: true, cloud: true, sky: 4, micro: 'cloudtops' },
};
const SKYCOL = { 1: [[.2, .45, .86], [.79, .88, .97]], 2: [[.55, .42, .3], [.85, .68, .5]], 3: [[.65, .52, .25], [.85, .72, .4]], 4: [[.55, .6, .75], [.85, .82, .75]] };
function skyDome(F, kind, R) {
  const [top, hor] = SKYCOL[kind] || SKYCOL[1];
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: new V3(0, 1, 0) }, uTop: { value: new V3(...top) }, uHor: { value: new V3(...hor) }, uOpacity: { value: 1 } }, side: THREE.BackSide, depthWrite: false, transparent: true,
    vertexShader: LDV(`varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(`uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHor; uniform float uOpacity; varying vec3 vD; void main(){ float h=max(vD.y,0.); float day=smoothstep(-.15,.12,uSun.y); vec3 c=mix(uHor,uTop,pow(h,.5)); float s=max(dot(normalize(vD),normalize(uSun)),0.);
      vec3 sunset=vec3(1.,.5,.25)*pow(1.-h,6.)*pow(s,4.)*smoothstep(.35,0.,abs(uSun.y)); c=c*day+sunset+vec3(1.,.95,.85)*pow(s,900.)*3.*step(-.02,uSun.y); c=max(c,vec3(.005,.008,.02));
      gl_FragColor=vec4(c,uOpacity*clamp(day*1.4+.05,0.,1.)); }`)
  }));
  F.add(m); return m;
}
function landscapeFrame(biome, pos, quat, body) { return new Frame({ landOn: true, fineD: 4, fineNext: biome === 'cloudtops' ? 'the gas itself' : biome === 'ocean' ? 'a drop of the water' : 'a close-up of what the ground is made of', type: 'landscape', name: biome === 'cloudtops' ? `${body} cloud tops (no solid surface)` : body ? `${body} surface` : 'Landscape', unit: 1, radius: 4000, r0: 2e-4, r1: 4e4, spawnD: .02, up: new V3(0, 1, 0), maxPolar: Math.PI / 2 - .02, pos: pos.clone(), quat: quat || new THREE.Quaternion(), opts: { biome, body } }); }
FT.landscape = {
  build(F, o) {
    const B = BIOME[o.biome] || BIOME.grass, r = rng(o.biome.length * 31 + 3);
    const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a4a3a, .6); F.add(hemi); const sun = new THREE.DirectionalLight(0xfff1d6, 1.2); F.add(sun); F.add(sun.target);
    const col = new THREE.Color(), gcol = B.g ? B.g.map(c => new THREE.Color(c)) : null;
    const terrain = (Rr, seg) => {
      const geo = new THREE.PlaneGeometry(Rr * 2, Rr * 2, seg, seg); geo.rotateX(-Math.PI / 2); const pa = geo.attributes.position, cols = [];
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), z = pa.getZ(i), dd = Math.hypot(x, z);
        let h = (Math.sin(x * .0021) * Math.cos(z * .0017) + .5 * Math.sin(x * .0063 + 1) * Math.sin(z * .0051)) * (B.h || 0);
        if (B.dunes) h += Math.pow(Math.abs(Math.sin(x * .006 + Math.sin(z * .002) * 2)), 1.5) * 18;
        if (B.craters) [[300, 200, 120], [-800, 400, 300], [100, -900, 200], [-60, -40, 25]].forEach(([cx, cz, cr]) => { const d = Math.hypot(x - cx, z - cz) / cr; if (d < 1.3) h += d < 1 ? -cr * .18 * (1 - d * d) : cr * .06 * (1.3 - d) / .3; });
        h *= smooth(0, 60, dd); // flat where you stand
        pa.setY(i, h - dd * dd / 12742000 * 1); // Earth-curvature drop
        const c = gcol[(Math.floor(Math.abs(Math.sin(x * .013) * Math.cos(z * .011) * 7 + Math.sin(x * .07 + z * .05) * 2)) % gcol.length)]; const v = .85 + .15 * Math.sin(x * .9 + z * 1.3);
        cols.push(c.r * v, c.g * v, c.b * v);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
      return new THREE.Mesh(geo, smat(0xffffff, { vertexColors: true, roughness: .95 }));
    };
    let ground = null;
    if (B.water) {
      const wm = new THREE.Mesh(new THREE.CircleGeometry(4000, 96).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: B.cloud ? 0xd9c7a2 : 0x1b4f7a, roughness: B.cloud ? 1 : .12, metalness: B.cloud ? 0 : .3 })); F.add(wm); ground = wm;
      F.pick(wm, B.cloud ? 'cloudtop' : 'ocean', 1); wm.userData.madeOf = B.cloud ? 'gas' : 'water';
      if (B.cloud) wm.material = hitMat(); // no ground is drawn: the sky colour fills everything, so there is nothing to stand on (the plane stays only as a click target)
      if (B.cloud) wm.userData.info = { title: 'Cloud tops', tag: 'Giant planet atmosphere', body: '<p>Gas giants have no solid surface: hydrogen and helium get gradually denser with depth until they become liquid and, deeper still, metallic hydrogen. The visible clouds are ammonia ice and ammonium hydrosulfide.</p>' };
    } else {
      ground = terrain(4000, 160); F.add(ground); F.pick(ground, 'ground', 0); ground.userData.madeOf = B.micro;
      ground.userData.info = { title: o.body ? `${o.body} surface` : 'The ground', tag: o.biome === 'venus' ? 'About 740 K, about 93 bar' : o.biome, body: `<p>${MICRO[B.micro] ? MICRO[B.micro].blurb : ''}</p>`, note: o.body && o.body !== 'Earth' ? 'The terrain you see is a generic illustration, not a map of this place.' : undefined };
      const near = terrain(60, 120); near.position.y = .02; F.add(near); F.pick(near, 'ground', 0); near.userData = ground.userData;
    }
    if (B.trees) {
      const tr = new THREE.InstancedMesh(new THREE.ConeGeometry(3, 12, 7).translate(0, 8, 0), smat(0x2d5a27, { roughness: .9, flatShading: true }), B.trees), tk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.35, .45, 3, 6).translate(0, 1.5, 0), smat(0x5a3f2a), B.trees), m4 = new THREE.Matrix4();
      for (let i = 0; i < B.trees; i++) { const a = r() * TAU, d = 40 + Math.sqrt(r()) * 3500, s = .7 + r() * .8; m4.makeScale(s, s * (.8 + r() * .5), s).setPosition(Math.cos(a) * d, -d * d / 12742000, Math.sin(a) * d); tr.setMatrixAt(i, m4); tk.setMatrixAt(i, m4); tr.setColorAt(i, col.setHSL(.28 + r() * .06, .45, .18 + r() * .1)); }
      F.add(tr); F.add(tk); F.pick(tr, 'tree', 2); tr.userData.madeOf = 'leaf';
    }
    if (B.rocks) { const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), smat(0x6e3a22, { roughness: 1, flatShading: true }), 400), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); for (let i = 0; i < 400; i++) { const a = r() * TAU, d = 3 + Math.sqrt(r()) * 300, s = .1 + Math.pow(r(), 3) * 1.5; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, s * .3, Math.sin(a) * d), q, new V3(s, s * .7, s)); rm.setMatrixAt(i, m4); } F.add(rm); F.pick(rm, 'rock', 2); rm.userData.madeOf = 'rock'; }
    const sky = B.sky ? skyDome(F, B.sky, 30000) : null;
    if (B.sky) { F.env = { opaque: true, bg: 0x000000 }; F.daylight = true; }
    const bn = o.body || 'Earth', GAS = { Jupiter: ' and the temperature is about 165 K (−108 °C)', Saturn: ' and the temperature is about 134 K (−139 °C)' };
    if (o.biome === 'cloudtops') { F.blurb = `${bn} has no solid surface. This is an illustration of its cloud tops, at the level where the pressure is about 1 bar (Earth's sea-level air pressure)${GAS[bn] || ''}. Going down, the gas only gets denser and hotter: there is no ground to stand on.`; F.note = 'Illustration only: a made-up cloud deck, not an image. The real clouds lie in layers, with ammonia ice highest, then ammonium hydrosulfide, then water.'; }
    else if (o.biome === 'venus') { F.blurb = 'Venus\'s surface: about 740 K (467 °C) and 93 bar, under a thick cloud deck, on volcanic plains of basalt. Lit by the real Sun for the date shown, though very little sunlight actually reaches the ground.'; F.note = 'Illustrative: the ground, the sky and the light are generic. Known: the temperature and pressure, and that the plains are basalt (measured by Venera and Vega landers).'; }
    else if (o.body && o.body !== 'Earth') { F.blurb = `A generic ${o.biome === 'icemoon' ? 'icy' : 'rocky'} landscape standing in for ${bn}. Lit by the real Sun for the date shown.`; F.note = `Illustrative: this is generic procedural terrain, not a map or photograph of ${bn}. Its real surface is not drawn.`; }
    else F.blurb = 'Earth\'s surface, lit by the real Sun for this place and time.';
    F.update = () => {
      const s = sunDirIn(F); sun.position.copy(s).multiplyScalar(100); const day = smooth(-.1, .15, s.y); sun.intensity = (o.body && o.body !== 'Earth' ? .95 : 1.25) * day; hemi.intensity = .08 + .55 * day;
      if (sky) { sky.material.uniforms.uSun.value.copy(s); F.env.opaque = day > .25; }
    };
    F.spawn = (T, hint) => {
      const id = hint && hint.id || (B.cloud ? 'cloudtop' : B.water ? 'ocean' : 'ground');
      if (typeof DESCENT !== 'undefined') { const q = { id, what: o.body ? `the surface of ${o.body}` : 'the ground', u: {} }; if (DESCENT.known(F, q)) return DESCENT.spawnFor(F, q, T); }   // what this body's surface is made of: data/descent/assign/landscape.json
      const kind = id === 'tree' ? 'leaf' : id === 'ocean' ? 'ocean' : id === 'cloudtop' ? 'cloudtops' : id === 'rock' ? (o.biome === 'mars' ? 'mars' : 'rock') : B.micro;   // cloud tops lead into the giant's own gas (they used to lead into Earth's air)
      return microFrame(kind, T);
    };
    if (PKL.on) PKL.landscape(F, o, B, { ground, near: F.root.children.find(m => m.isMesh && m !== ground && m.userData === ground.userData), sun, sky, rocks: B.rocks ? F.pickables.find(m => m.userData.id === 'rock') : null });   // the realistic look (js/levels_v2.js)
  }
};
/* ---------- region (unit km): a 40-km patch of the surface ---------- */
FT.region = {
  build(F, o) {
    const B = BIOME[o.biome] || BIOME.grass, r = rng(Math.round(o.lat * 100 + o.lon));
    F.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a4a3a, .5)); const sun = new THREE.DirectionalLight(0xffffff, 1.2); F.add(sun);
    const cols = B.water ? ['#1b4f7a', '#21577f', '#1a4a72'] : B.g;
    const t = canvasTex('reg_' + o.biome + (o.isPark ? 'p' : ''), 512, 512, (g, w, h) => {
      const rr = rng(5); g.fillStyle = cols[0]; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = .35; g.beginPath(); g.ellipse(rr() * w, rr() * h, 5 + rr() * 40, 5 + rr() * 30, rr() * 3, 0, TAU); g.fill(); }
      if (o.isPark) { // a city: grey blocks, a river
        g.globalAlpha = 1; for (let i = 0; i < 1800; i++) { const x = rr() * w, y = rr() * h, d = Math.hypot(x - w / 2, y - h / 2); if (d < 6) continue; g.fillStyle = ['#8d8a86', '#7a7773', '#9c978f', '#6d6a66'][i % 4]; g.globalAlpha = .65; g.fillRect(x, y, 3 + rr() * 6, 3 + rr() * 6); }
        g.globalAlpha = 1; g.strokeStyle = '#2d4f66'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, h * .38); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .38 + Math.sin(x * .02) * 18 - (x > w * .4 && x < w * .6 ? 14 : 0)); g.stroke();
        g.fillStyle = '#4f8a33'; g.beginPath(); g.ellipse(w / 2, h / 2, 3, 2.4, 0, 0, TAU); g.fill(); // the park is about half a kilometre wide: a few pixels of this 80-km tile
      }
      g.globalAlpha = 1;
    }, {});
    const geo = new THREE.CircleGeometry(40, 128); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: .95, transparent: true, depthWrite: false });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a *= smoothstep(1.0, 0.75, length(vUv-0.5)*2.0);'); };
    const m = new THREE.Mesh(geo, mat); F.add(m); F.pick(m, B.water ? 'ocean' : 'land', 0); m.userData.madeOf = B.micro;
    m.userData.info = { title: o.isPark ? 'Greenwich, London (schematic tile)' : 'Earth\'s surface', tag: `${o.lat.toFixed(2)}°, ${o.lon.toFixed(2)}° · schematic`, body: o.isPark ? '<p>An 80-km-wide patch around Greenwich Park. <b>The picture is a schematic stand-in, not a map:</b> the grey blocks, the river line and the green patch are a generated pattern, not London\'s real streets, buildings or Thames. Keep zooming to land in the park.</p>' : '<p>An 80-km-wide patch of the surface, coloured by the land type under it on the globe map. It is an illustrative tile, not a map of this place. Keep zooming to land here.</p>', note: 'Schematic: not real streets, buildings or rivers.' };
    if (o.isPark) { const pk = markerSprite(0xffd166, 10); pk.position.y = .01; F.add(pk); F.label(pk, 'Greenwich Park', { cls: 'you', always: true }); }
    F.update = () => { const s = sunDirIn(F); sun.position.copy(s).multiplyScalar(100); };
    F.blurb = o.isPark ? 'Above London and Greenwich Park, where your journey started. The ground picture is a schematic tile, not a map.' : `Earth's surface at ${o.lat.toFixed(1)}°, ${o.lon.toFixed(1)}° (${o.biome}). The ground picture is an illustrative tile, not a map.`;
    // the blocks, the river and the park are drawn on London's tile only: elsewhere (open sea, a desert) the note must not speak of them
    F.note = (o.isPark ? 'Schematic: the blocks, river and park are a generated pattern, not real streets or buildings.' : `Illustrative: the ${B.water ? 'sea' : 'ground'} is a generated pattern of patches in the colours of this kind of surface, not a map or a photograph.`) + ' The sky colour follows the Sun and altitude. The globe\'s own map is blurry below about 100 km (4096 by 2048 pixels for the whole Earth).';
    // a sky above the tile: blue by day, black above about 100 km and at night; the stars of the parent frames show through at night and from high up
    const dome = skyDome(F, 1, 1500); dome.geometry.dispose(); dome.geometry = new THREE.SphereGeometry(1500, 32, 16, 0, TAU, 0, Math.PI / 2 + .09); dome.renderOrder = -1;
    const baseUp = F.update; F.update = () => { baseUp(); const s = sunDirIn(F); dome.material.uniforms.uSun.value.copy(s); dome.material.uniforms.uOpacity.value = (1 - smooth(3e4, 1.2e5, cam.D)) * F.alpha; dome.visible = cam.D < 1.3e5; };
    if (o.isPark) { F.attract = new V3(); F.attractD = 4000; F.attractR = 1.5; } // scrolling toward the park pulls the target onto it: you land in the park, not in generic grass
    F.spawn = (T) => {
      // a zoom that is aimed at the park (its pivot is in the park, though the middle of the view is still a little way off) is on its way into the park: no generic grassland is put in its way
      if (o.isPark) { const pv = zoom.pivot && anchored.includes(zoom.pivot) ? zoom.pivot.p : T; if (Math.hypot(pv.x, pv.z) < .52) return null; }
      return landscapeFrame(o.isPark ? 'grass' : o.biome, T.clone().setY(0), null, 'Earth');
    };
    F.spawnD = 2500;
  }
};
/* ---------- the park (unit m): v2 park, real sun ---------- */
v2frame('park', 'life', () => 1, (F, c, g) => {
  F.env = { opaque: true, bg: 0x000000 }; F.daylight = true; // a daylight scene takes no glow while it fills the view (engine.js bloomTarget)
  F.blurb = 'Greenwich Park, London — you, a dog, trees and a pond, lit by the real Sun for this date and time.';
  const P = c.parts, up0 = F.update;
  /* The sun's shadow map is drawn again only when the sun has moved enough to shift a shadow, or while the stand-in figure (which
     breathes) is still showing, and at most ten times a second. In between, the map is still right in the park's own coordinates; only
     the scene's origin moves (it follows the camera), so the shadow matrix is shifted by that movement each frame. shadows=0 turns it off. */
  const SH = P.sun.shadow, sh = { t: -1e9, dir: new V3(), M: new THREE.Matrix4(), root: new V3(), have: false, wait: false, hv: true, d: new THREE.Matrix4() };
  SH.autoUpdate = false; P.sun.castShadow = PERF.flags.shadows; PERF.on('shadows', on => { P.sun.castShadow = !!on; sh.t = -1e9; sh.have = false; });
  const shadowStep = () => {
    if (!P.sun.castShadow) return;
    const now = performance.now();
    if (sh.wait && !SH.needsUpdate) { sh.wait = false; sh.have = true; sh.M.copy(SH.matrix); } // the map was drawn in the last frame: keep its matrix and where the origin was
    const hv = P.human.visible; // the stand-in figure is the only caster that moves; when the body has loaded it is hidden, and its shadow must go with it
    const fit = LOOK.on ? LOOK.shadowFit(F, P.sun, SH) : null;   // the realistic look fits the map to the view (js/look.js): true when it must be drawn again
    if (!sh.wait && now - sh.t > 100 && (!sh.have || (fit === null ? sh.dir.distanceToSquared(P.sun.position) > 1.6e-3 : fit) || hv || hv !== sh.hv)) { sh.hv = hv; sh.t = now; sh.dir.copy(P.sun.position); sh.root.copy(F.root.position); SH.needsUpdate = true; sh.wait = true; sh.have = false; if (fit !== null) LOOK.shadowDrawn(); }
    else if (sh.have) { sh.d.makeTranslation(sh.root.x - F.root.position.x, sh.root.y - F.root.position.y, sh.root.z - F.root.position.z); SH.matrix.multiplyMatrices(sh.M, sh.d); }
  };
  /* The park from its edge and from above. The painted lawn is a disc 170 m in radius and the sky a ball 420 m in radius round the middle: scrolling in from the
     park's ruler stop with the pointer just off the disc found no ground, took the sky ball's underside for the place to go, and ended below the lawn inside the
     sky's colour (a blank pale-blue view all the way down). So:
     - the lawn goes on to 520 m as a plain ring that fades out at its rim (the park is about a kilometre across), and beyond that an unseen ring to 3 km still
       answers a pointer: below the horizon there is ground wherever you point, and a zoom ends on it;
     - the hills are cut off at the ground (their undersides hung below the disc when seen from outside) and are ground to a click and a zoom;
     - the sky is where you look, never where a zoom goes (noZoom: with the pointer on the sky the zoom closes on the point of air in front of the camera), and it
       is centred on the camera, so the camera is inside it wherever it stands in the park;
     - the Sun's glow belongs to the sky: it is hidden with it when the park is seen from far above. */
  const gud = () => ({ id: 'ground', priority: 0, node: P.ground.userData.node, extent: h => ({ p: h.pointLocal.clone(), r: 170 }) });
  for (const h of g.children) if (h.isMesh && h.geometry.type === 'SphereGeometry' && h.position.y === -18 && !h.userData.id) {
    const R = h.geometry.parameters.radius; h.geometry.dispose(); h.geometry = new THREE.SphereGeometry(R, 24, 8, 0, TAU, 0, Math.acos(Math.min(1, 30 / R)) + .05);   // the cap that stands above the ground (centre 18 m down, flattened to 0.6)
    // and they are lawn, like the ground they rise from: the same painted blades, laid on from above (a plain green ball was a blank screen to arrive on)
    const hp = h.geometry.attributes.position, hu = h.geometry.attributes.uv; for (let i = 0; i < hp.count; i++) hu.setXY(i, ((hp.getX(i) + h.position.x) / 170 + 1) / 2, ((hp.getZ(i) + h.position.z) / 170 + 1) / 2);
    h.material.dispose(); h.material = smat(0xf2ffe6, { map: P.ground.material.map, roughness: 1 });
    h.userData = gud(); h.material.userData.noHL = true; F.pickables.push(h);
  }
  {
    const rg = new THREE.RingGeometry(170, 520, 96, 7), rp = rg.attributes.position, uv = rg.attributes.uv, col = new Float32Array(rp.count * 3), tone = new THREE.Color();
    for (let i = 0; i < rp.count; i++) { lawnTone(rp.getX(i), -rp.getY(i), tone); col[i * 3] = tone.r; col[i * 3 + 1] = tone.g; col[i * 3 + 2] = tone.b; uv.setXY(i, (rp.getX(i) / 170 + 1) / 2, (rp.getY(i) / 170 + 1) / 2); }   // the same metre-wide tiles as the disc inside it
    rg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const rm = smat(0xffffff, { map: P.ground.material.map, roughness: 1, vertexColors: true, transparent: true });   // always see-through at its rim
    rm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a *= 1. - smoothstep(400., 520., length(vUv - 170.));'); };   // vUv is in metres from the disc's corner (340 tiles across 340 m)
    rm.customProgramCacheKey = () => 'parkrim';
    rm.userData.noHL = true; const ring = new THREE.Mesh(rg, rm); ring.rotation.x = -Math.PI / 2; ring.userData = gud(); ring.updateMatrix(); ring.matrixAutoUpdate = false; g.add(ring); F.pickables.push(ring);
    const far = new THREE.Mesh(new THREE.RingGeometry(520, 3000, 48, 1), hitMat()); far.rotation.x = -Math.PI / 2; far.userData = gud(); far.updateMatrix(); far.matrixAutoUpdate = false; g.add(far); F.pickables.push(far);
    P.rim = ring; P.farGround = far;
  }
  P.sky.userData.noZoom = true; P.sky.renderOrder = -10;
  // coming down from London the camera enters the park frame half a kilometre from its middle: while the park is still a patch seen from above, the zoom homes in on the middle, where the things are; below 300 m the pointer decides
  F.attract = new V3(); F.attractD = 3500; F.attractMin = 300; F.attractR = 600;
  // the lawn is far larger than any view of it: resting the pointer on it, or selecting it, does not light up the whole park (the ring marks the place clicked)
  P.ground.material.userData.noHL = true; P.ground.userData.extent = h => ({ p: h.pointLocal.clone(), r: 170 });
  F.update = (dt, t) => {
    up0(dt, t);
    const s = sunDirIn(F); c.setSun(s); if (LOOK.on) LOOK.parkSunSet(F, P.sun); const day = smooth(-.12, .12, s.y); shadowStep();
    F.env.opaque = cam.D < 300 && day > .2; P.sky.visible = cam.D < 380 && F.alpha > .6;
    if (F.C) { const cx = F.C.x, cz = F.C.z; P.sky.position.set(cx, 0, cz); P.sunHit.position.x += cx; P.sunHit.position.z += cz; P.sg.position.copy(P.sunHit.position); }
    P.sunHit.visible = P.sky.visible; if (!P.sky.visible) P.sg.visible = false;
    if (c.scene.fog) { c.scene.fog.near = Math.max(45, cam.D * .6); c.scene.fog.far = Math.max(170, cam.D * 4); }
  };
  F.spawn = (T, hint) => {
    const id = hint && hint.id || '';
    if (id && typeof DESCENT !== 'undefined') { const u = (hint.obj && hint.obj.userData) || {}, q = { id, node: u.node, what: u.info && u.info.title, u }; if (DESCENT.known(F, q)) return DESCENT.spawnFor(F, q, hint.point ? hint.point.clone() : T); }   // data/descent/assign/park.json (the sky, a far bird, a cloud ...)
    const kind = id === 'human' ? 'skin' : /tree|flower|leaf/.test(id) ? 'leaf' : /air|cloud|sunSky/.test(id) || (!id && T.y > .05) ? 'air' : 'soil';   // with the pointer on nothing (the far sky), a target above the ground is in the air, not in soil
    if (kind === 'air') { const n = hint ? hint.point.clone() : T.clone(); return microFrame('air', n); }
    return microFrame(kind, T);
  };
  F.spawnD = 3e-3;
  if (PKL.on) PKL.park(F, c, g);   // the realistic look: ground, hills, haze, clouds and the pond (js/levels_v2.js)
});
/* ---------- black hole at the galactic center (unit 1e10 m) ---------- */
v2frame('sgrA', 'blackhole', () => .6, (F) => { F.blurb = 'Sagittarius A*: 4.3 million Suns of mass inside an event horizon about 25 million km across (radius 12.7 million km). (Accretion flow shown brighter than reality.)'; });
