'use strict';
/* =====================================================================
   LOOK: the realism foundation (docs/DESIGN.md section 3, and 3.12 for every name below). Part of the engine: loaded right after
   js/engine.js, before any scene. The realistic picture is switched on with ?look=2 and is OFF by default; with it off this file
   defines LOOK with inert members and changes nothing at all.

   Switches (read in js/perf.js, shown in the meter with Shift+P):
     look=2            on                      lookq=high|low     quality level (fx=low implies low)
     lookexp=0.9       exposure (live)         lookoff=a,b        parts off: pbr tone sky env tex sss rig shadow glow ui labels
                                                                  (env, shadow, glow, labels live; the others reload)

   What a scene calls (the whole vocabulary; nothing else about light, tone or colour belongs in a scene):
     LOOK.material(kind, color, o)   a MeshStandardMaterial of a kind of LOOK.KINDS (o: {double, extra, instanced})
     LOOK.dress(material, kind)      give an existing standard material a kind's properties
     LOOK.patch(material, key, fn)   a shader patch that combines with the material's others (every onBeforeCompile goes through it)
     LOOK.light(frame, 'studio')     the studio rig for a frame (the rig table below does this for every listed type)
     LOOK.env(name), LOOK.envFor(F)  environments by name ('sky', 'studio', or one loaded with LOOK.envLoad(name, file)) and for a frame
     LOOK.sun()                      the park's Sun now: {dir, day, color, intensity}
     LOOK.lin(hex)                   a colour as linear light, for a shader of your own
     LOOK.quality, LOOK.part(name)   'high' | 'low'; whether a part is on (anything costly asks first)
     LOOK.ready                      a promise: resolves (true) when nothing the look has asked for is still loading (environments,
                                     photographs, surface textures); read it again after a view change. LOOK.busy(): how many are loading
     LOOK.RIGS, LOOK.rigOf(F)        which light each frame type has: 'outdoor', 'studio', 'space' or 'diagram'
     frame.exposure, frame.glow      a frame's exposure factor; whether it holds things that emit light
   The engine calls: LOOK.frameBuilt(F) at the end of Frame.ensure, LOOK.exposureOf(F) before each scene is drawn,
   LOOK.glowOf() in bloomTarget, LOOK.step(now) once per frame, LOOK.wire() at start-up, LOOK.smat() from smat().

   How colour works. three.js r128 has no colour management, and the app stores every colour as the colour to show (sRGB). Lit
   built-in materials turn their finished surface colour (uniform x texture x vertex colour) into linear light just before lighting
   (one pow 2.2), light adds in linear light, ACES brings it into range, and the renderer encodes sRGB. Unlit built-in materials
   (washes, lines, sprites, points, backgrounds) and the app's own shaders are written exactly as authored. A shader of your own that
   carries light works in linear light (LOOK.lin) and ends main() with #include <tonemapping_fragment> and #include <encodings_fragment>.
   Light units: physicallyCorrectLights stays off. A directional light of intensity 1, white, brings a white matte surface that faces
   it to 1.0 before the tone curve. Costs per lit fragment: one pow, the standard BRDF, two environment look-ups; six more texture reads
   on a triplanar surface (bark, rock). No full-screen pass. An environment is redrawn only when its Sun has moved about a degree.
   ===================================================================== */
const LOOK = (() => {
  const Q = new URLSearchParams(location.search), FL = PERF.flags, on = FL.look === '2' && typeof THREE !== 'undefined';
  const quality = FL.lookq === 'low' ? 'low' : 'high', LOWOFF = ['tex', 'sss', 'studio'];   // the low level has no surface textures, no light-through cues and no studio photograph
  let offKey = null, offSet = new Set();
  const part = k => { if (!on) return false; if (offKey !== FL.lookoff) { offKey = FL.lookoff; offSet = new Set(FL.lookoff.split(',').filter(Boolean)); } return !offSet.has(k) && !(quality === 'low' && LOWOFF.includes(k)); };
  /* shader patches that combine: fn(shader) runs after the material's own onBeforeCompile, and the key joins the program's cache key, so two
     materials that differ only in their patches never share a program. Works with the look on or off.
     The composer owns the material's onBeforeCompile and customProgramCacheKey from the first patch on: scene code that later assigns
     either one directly (m.onBeforeCompile = fn) sets the material's own step, which runs first, and no patch is lost. (Before, a direct
     assignment after a patch threw the patch away: the selection mark and others vanished from things and the lawn.) Each patch must
     declare what it adds inside a block or under its own prefix: two patches on one material share one main(). */
  const PATCHES = new WeakMap();
  function patch(m, key, fn) {
    if (!m) return m; let P = PATCHES.get(m);
    if (!P) {
      const own = k => Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null;
      P = { fns: [], keys: [], base: own('onBeforeCompile'), baseKey: own('customProgramCacheKey') }; PATCHES.set(m, P);
      const run = function (sh, r) { if (P.base) P.base.call(this, sh, r); for (const f of P.fns) f.call(this, sh, r); };
      const ckey = function () { return (P.baseKey ? P.baseKey.call(this) : P.base ? P.base.toString() : '') + '|lk:' + P.keys.join('|lk:'); };
      Object.defineProperty(m, 'onBeforeCompile', { configurable: true, get: () => run, set: f => { P.base = f; } });
      Object.defineProperty(m, 'customProgramCacheKey', { configurable: true, get: () => ckey, set: f => { P.baseKey = f; } });
    }
    if (P.keys.includes(key)) return m;
    P.keys.push(key); P.fns.push(fn); (m.userData._lkPatch || (m.userData._lkPatch = {}))[key] = 1; m.needsUpdate = true; return m;
  }
  /* The table of kinds (DESIGN 3.5): roughness and metalness from measured ranges (nothing mirror-smooth but water, glass and the eye,
     nothing metallic but metal); sss: how far the light wraps round the terminator per colour channel (red furthest: blood under skin);
     thin: the colour and share of light that comes through a sheet lit from behind; env: the strength of the environment's reflection;
     tri: the photographed surface laid on from three sides. A scene may add a kind here; it never makes a one-off material. */
  const KINDS = {
    matte: { rough: .9 }, plastic: { rough: .45 }, metal: { rough: .38, metal: 1 }, glass: { rough: .06 }, chitin: { rough: .32 },
    skin: { rough: .56, sss: [.42, .17, .09] }, wet: { rough: .34, sss: [.24, .08, .05] }, muscle: { rough: .46, sss: [.2, .06, .04] },
    bone: { rough: .6 }, enamel: { rough: .22 }, horn: { rough: .42 }, eye: { rough: .07, env: 1.2 },
    fur: { rough: .95, sss: [.22, .16, .09], env: .7 }, feather: { rough: .93, sss: [.14, .1, .06], env: .6 },
    leaf: { rough: .6, sss: [.16, .2, .06], thin: [.30, .42, .09] }, petal: { rough: .52, sss: [.2, .18, .08], thin: [.42, .38, .10] },
    bark: { rough: .95, tri: 'bark' }, wood: { rough: .8 }, rock: { rough: .9, tri: 'rock' }, soil: { rough: 1 }, turf: { rough: .96 },
    fungus: { rough: .7, sss: [.26, .2, .14] }, wax: { rough: .3, sss: [.2, .08, .05] }, water: { rough: .05, env: 1.5 },
  };
  /* Which light every frame type has (DESIGN 3.4). outdoor: the sky of the place it stands in as environment, its Sun as the one key;
     studio: a photographed studio and one lamp over the viewer's left shoulder; space: no environment, the Sun the only light (night
     sides are dark); diagram: unlit, drawn as authored (a plot or a diagram has no surface). kind: what smat() and illoMat() make when a
     part names no kind of its own. glow: whether the frame holds things that emit light (the Sun, stars, a lit screen). exposure: a
     factor on the page's exposure. A new frame type is added here; until it is, it keeps its own lights (and the audit lists it). */
  const SPACE_GLOW = { kind: 'matte', glow: true, exposure: 1 / .9 };
  const RIGS = {
    outdoor: { kind: 'matte', glow: false, exposure: 1 },
    studio: { kind: 'plastic', glow: false, exposure: .8 },
    space: { kind: 'matte', glow: false, exposure: 1 / .9 },
    diagram: { kind: 'matte', glow: false, exposure: 1 },
  };
  const TYPES = {
    park: 'outdoor', body: 'outdoor', region: 'outdoor',
    landscape: F => !F.opts.body || F.opts.body === 'Earth' || (typeof BIOME !== 'undefined' && (BIOME[F.opts.biome] || {}).sky) ? 'outdoor' : 'space',   // a world with no air (the Moon) has no sky: the Sun alone
    thing: F => { const e = F.opts && F.opts.env; if (e === 'park' || !e) return 'outdoor'; if (e === 'sun') { const p = F.parent; return p && p.rig === 'outdoor' ? 'outdoor' : 'space'; } return 'studio'; },
    cell: 'studio', dna: 'studio', mol: 'studio', crystal: 'studio', liquid: 'studio', gas: 'studio', plasma: 'studio', micro: 'studio',
    tissue: 'studio', tissue2: 'studio', organ: 'studio', thstage: 'studio',
    phone: 'studio', die: 'studio', core: 'studio', cells: 'studio', inverter: 'studio', finfet: 'studio',
    atom: 'diagram', atomq: 'diagram', nucleus: 'diagram', proton: 'diagram', sm: 'diagram',
    cosmos: 'space', localgroup: 'space', milkyway: 'space', neighborhood: 'space', star: 'space', sun: 'space', solarsystem: 'space', sgrA: 'space', planet: 'space', earth: 'space',
  };
  const EMITS = { cosmos: 1, localgroup: 1, milkyway: 1, neighborhood: 1, star: 1, sun: 1, solarsystem: 1, sgrA: 1 };   // what a frame of this type shows is mostly light sources: stars, the Sun, a glowing accretion flow
  const rigOf = F => { const t = TYPES[F.type]; return typeof t === 'function' ? t(F) : t || null; };
  const L = {
    on, quality, part, patch, KINDS, RIGS, TYPES, rigOf, dark: on && Q.get('theme') === 'dark', dressed: 0,
    lin: hex => new THREE.Color(hex).convertSRGBToLinear(),
    ready: Promise.resolve(true), busy: () => 0, env: () => null, envFor: () => null, envLoad: () => Promise.resolve(null), sun: () => null,
    material: null, dress: m => m, light: () => { }, smat: null, selMark: m => m, selSet: () => false,
    frameBuilt() { }, exposureOf: () => 1, glowOf: () => undefined, step() { }, wire() { }, audit: () => null,
    /* programs that failed to compile or link (three.js keeps its diagnostics on each program): the tests fail on any, with the look on or off */
    shaderFaults: () => (typeof renderer !== 'undefined' && renderer.info.programs || []).filter(p => p.diagnostics && !p.diagnostics.runnable).map(p => ({ name: p.name, key: String(p.cacheKey).slice(-160), log: ((p.diagnostics.fragmentShader.log || '') + ' ' + (p.diagnostics.vertexShader.log || '') + ' ' + (p.diagnostics.programLog || '')).trim().slice(0, 600) })),
  };
  if (!on) return L;
  const P = part, PBR = P('pbr'), _sun = new V3(), _v = new V3();
  /* what is still loading: LOOK.ready waits for all of it, including what starts while it waits */
  const PEND = new Set(), track = pr => { PEND.add(pr); const done = () => PEND.delete(pr); pr.then(done, done); return pr; };
  const settle = () => PEND.size ? Promise.all([...PEND].map(x => x.catch(() => null))).then(settle) : Promise.resolve(true);
  Object.defineProperty(L, 'ready', { get: settle, enumerable: true }); L.busy = () => PEND.size;

  /* ---------- 1. the renderer: linear light, a filmic curve, sRGB out (set once, before any shader is built) ---------- */
  const C = THREE.ShaderChunk, SL = THREE.ShaderLib;
  if (PBR) {
    const toLin = '\tdiffuseColor.rgb = pow( max( diffuseColor.rgb, vec3( 0.0 ) ), vec3( 2.2 ) );\n\ttotalEmissiveRadiance = pow( max( totalEmissiveRadiance, vec3( 0.0 ) ), vec3( 2.2 ) );\n';
    ['lights_physical_fragment', 'lights_phong_fragment', 'lights_toon_fragment'].forEach(k => { C[k] = toLin + C[k]; });
    SL.lambert.fragmentShader = SL.lambert.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + toLin);
    /* unlit materials (washes, lines, sprites, points, a picture used as a background) are written out as they were authored */
    ['basic', 'points', 'sprite', 'dashed', 'background', 'cube', 'equirect'].forEach(k => { if (SL[k]) SL[k].fragmentShader = SL[k].fragmentShader.replace('#include <tonemapping_fragment>', '').replace('#include <encodings_fragment>', ''); });
    /* the few materials that are still toon-shaded get a plain diffuse fall-off in place of their four steps */
    C.gradientmap_pars_fragment = '#ifdef USE_GRADIENTMAP\n\tuniform sampler2D gradientMap;\n#endif\nvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\n\treturn vec3( saturate( dot( normal, lightDirection ) ) );\n}';
    /* light that passes through: a wrapped terminator per colour channel (skin, flesh), and light through a thin sheet (a leaf lit from behind) */
    C.lights_physical_pars_fragment = C.lights_physical_pars_fragment.replace('vec3 irradiance = dotNL * directLight.color;',
      `vec3 irradiance = dotNL * directLight.color;
	#ifdef LK_SSS
		irradiance = directLight.color * saturate( ( vec3( dot( geometry.normal, directLight.direction ) ) + LK_SSS ) / ( 1.0 + LK_SSS ) );
	#endif
	#ifdef LK_THIN
		irradiance += directLight.color * saturate( - dot( geometry.normal, directLight.direction ) ) * LK_THIN;
	#endif`);
    /* surface detail on meshes that have no texture coordinates: the map and the normal map are laid on from three sides, in the mesh's own space */
    C.uv_pars_vertex += '\n#ifdef LK_TRI\n\tvarying vec3 lkP;\n\tvarying vec3 lkN;\n#endif\n';
    C.begin_vertex += '\n#ifdef LK_TRI\n\tlkP = position;\n\tlkN = normal;\n#endif\n';
    C.uv_pars_fragment += '\n#ifdef LK_TRI\n\tvarying vec3 lkP;\n\tvarying vec3 lkN;\n\tuniform mat3 normalMatrix;\n\tvec3 lkBlend() { vec3 b = pow( abs( normalize( lkN ) ), vec3( 4.0 ) ); return b / ( b.x + b.y + b.z ); }\n#endif\n';
    C.map_fragment = `#if defined( USE_MAP ) && defined( LK_TRI )
	{ vec3 lkB = lkBlend(); vec3 lkQ = lkP * LK_TRI;   // in a block of its own: a scene's patch after this chunk may use the same names
	diffuseColor.rgb *= pow( 2.0 * ( texture2D( map, lkQ.zy ).rgb * lkB.x + texture2D( map, lkQ.xz ).rgb * lkB.y + texture2D( map, lkQ.xy ).rgb * lkB.z ), vec3( 0.4545 ) ); }   // detail with a mean of one half, proportional in linear light (the colour is raised to 2.2 after this)
#else
${C.map_fragment}
#endif
`;
    C.normal_fragment_maps = `#if defined( USE_NORMALMAP ) && defined( LK_TRI )
	{ vec3 lkB2 = lkBlend(); vec3 lkQ2 = lkP * LK_TRI;
	vec3 lkX = texture2D( normalMap, lkQ2.zy ).xyz * 2.0 - 1.0, lkY = texture2D( normalMap, lkQ2.xz ).xyz * 2.0 - 1.0, lkZ = texture2D( normalMap, lkQ2.xy ).xyz * 2.0 - 1.0;
	vec3 lkD = vec3( 0.0, lkX.y, lkX.x ) * lkB2.x + vec3( lkY.x, 0.0, lkY.y ) * lkB2.y + vec3( lkZ.x, lkZ.y, 0.0 ) * lkB2.z;
	vec3 lkV = normalize( normalMatrix * normalize( normalize( lkN ) + lkD * normalScale.x ) );
	#ifdef DOUBLE_SIDED
		lkV *= faceDirection;
	#endif
	normal = lkV; }
#else
${C.normal_fragment_maps}
#endif
`;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = P('tone') ? THREE.ACESFilmicToneMapping : THREE.LinearToneMapping;
    renderer.toneMappingExposure = FL.lookexp;
  }
  L.exposure = () => FL.lookexp;   // the page's exposure (live: the meter's Exposure row)

  /* ---------- 2. surface textures (assets/look, CC0: assets/ATTRIBUTION.md), fetched only when a material of their kind is first made ---------- */
  const TEXDIR = 'assets/look/', texLd = new THREE.TextureLoader();
  function flat(r, g, b) { const cv = document.createElement('canvas'); cv.width = cv.height = 2; const x = cv.getContext('2d'); x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, 2, 2); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
  /* a colour map as DETAIL: each channel is scaled so that its mean is one half; the shader multiplies by two. The model keeps the colour it was given and takes the photograph's variation. */
  function detailTex(file) {
    const t = flat(128, 128, 128);
    track(new Promise(res => texLd.load(TEXDIR + file, src => { res(); const im = src.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height), a = d.data, n = a.length / 4, m = [0, 0, 0]; for (let i = 0; i < a.length; i += 4) { m[0] += a[i]; m[1] += a[i + 1]; m[2] += a[i + 2]; }
      const k = m.map(v => 127.5 / Math.max(1, v / n)); for (let i = 0; i < a.length; i += 4) { a[i] = Math.min(255, a[i] * k[0]); a[i + 1] = Math.min(255, a[i + 1] * k[1]); a[i + 2] = Math.min(255, a[i + 2] * k[2]); }
      x.putImageData(d, 0, 0); t.image = cv; t.needsUpdate = true; src.dispose(); }, undefined, e => { console.warn('look: texture', file); res(); })));
    return t;
  }
  function normalTex(file) { const t = flat(128, 128, 255); track(new Promise(res => texLd.load(TEXDIR + file, src => { t.image = src.image; t.needsUpdate = true; res(); }, undefined, () => { console.warn('look: texture', file); res(); }))); return t; }
  const TEXFILES = {   // colour, normal (OpenGL convention), repeats per metre, strength of the normal map
    lawn: ['Grass004_color_1k.jpg', 'Grass004_normal_gl_1k.jpg', 1 / 1.4, .7],
    bark: ['jolcham_oak_bark_01_color_1k.jpg', 'jolcham_oak_bark_01_normal_gl_1k.jpg', 1 / .9, 1.1],
    rock: ['rock_boulder_dry_color_1k.jpg', 'rock_boulder_dry_normal_gl_1k.jpg', 1 / 1.2, 1],
  };
  const TEXSET = {}, texSet = name => TEXSET[name] || (TEXSET[name] = { map: detailTex(TEXFILES[name][0]), normalMap: normalTex(TEXFILES[name][1]), scale: TEXFILES[name][2], bump: TEXFILES[name][3] });
  L.texSet = texSet;

  /* ---------- 3. materials: a kind for every surface ---------- */
  const v3 = a => `vec3( ${a.map(x => x.toFixed(3)).join(', ')} )`;
  function dress(m, kind, o) {
    const k = KINDS[kind]; if (!m || !k || !m.isMeshStandardMaterial) return m; o = o || {};
    m.roughness = k.rough; m.metalness = k.metal || 0; m.envMapIntensity = k.env || 1; m.userData.kind = kind;
    if (P('sss')) { if (k.sss) m.defines.LK_SSS = v3(k.sss); if (k.thin) m.defines.LK_THIN = v3(k.thin); }
    if (k.tri && P('tex') && !m.map) { const s = texSet(k.tri); m.map = s.map; m.defines.LK_TRI = s.scale.toFixed(4);
      if (!o.instanced) { m.normalMap = s.normalMap; m.normalScale.set(s.bump, s.bump); } }   // an instanced part's own turn is not in the normal matrix: it takes the colour detail only
    selMark(m); m.needsUpdate = true; return m;
  }
  L.dress = dress;
  /* Selection (DESIGN 3.10): the one mark of the part pointed at or selected, the same on every material (skin, fur, a leaf, stone, metal, a
     cut face). It is interface, not light: drawn after the tone curve, so it looks the same in a studio, at noon and at night. A faint wash
     of the accent over the whole part (so a flat face seen square on still shows it) and a soft rim where the part's smooth surface turns
     away from the eye (its interpolated normal, not the relief of a normal map, which streaked bark and fur). No outline. Every dressed
     material carries it (one uniform, off until used), so selecting never builds a new program; LOOK.selSet(m, a) sets it, a = 1 for
     the selected part, about a half for the part pointed at. */
  const SEL_RGB = new THREE.Color(0x6a9be0);
  function selMark(m, from) {
    if (!m || !m.isMeshStandardMaterial || m.userData.lkSel) return m;
    const u = m.userData.lkSel = (from && from.userData && from.userData.lkSel) || { value: new THREE.Vector4(SEL_RGB.r, SEL_RGB.g, SEL_RGB.b, 0) };   // from: share another material's mark (a coat's shells and its skin)
    patch(m, 'lksel', sh => {
      sh.uniforms.uLkSel = u;
      sh.fragmentShader = 'uniform vec4 uLkSel;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
	if ( uLkSel.a > 0.0 ) {
	#ifndef FLAT_SHADED
		vec3 lkSN = normalize( vNormal );
	#else
		vec3 lkSN = normal;
	#endif
		float lkSF = 1.0 - saturate( abs( dot( lkSN, normalize( vViewPosition ) ) ) );
		gl_FragColor.rgb = mix( gl_FragColor.rgb, uLkSel.rgb, uLkSel.a * ( 0.06 + 0.55 * pow( lkSF, 4.0 ) ) );
	}`);
    });
    return m;
  }
  L.selMark = selMark;
  L.selSet = (m, a) => { if (!m || !m.isMeshStandardMaterial) return false; if (!m.userData.lkSel) selMark(m); const u = m.userData.lkSel.value; if (u.w !== a) u.w = a; return true; };
  /* the kind a part is when its call names none: the frame being built decides (its rig's default) */
  const TYPE_KIND = { cell: 'wet', organ: 'wet', tissue: 'wet', tissue2: 'wet', body: 'skin' };   // where a frame type's parts are mostly of one kind
  const defaultKind = () => { const F = typeof building !== 'undefined' ? building : null, r = F && (F.rig || rigOf(F)); return (F && TYPE_KIND[F.type]) || (r && RIGS[r].kind) || 'matte'; };
  const emitsNow = () => { const F = typeof building !== 'undefined' ? building : null; return !!(F && (F.glow === true || EMITS[F.type])); };
  L.material = (kind, color, o) => { o = o || {}; const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .8, metalness: 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide }, o.extra || {})); return dress(m, kind || defaultKind(), o); };
  /* smat() (js/helpers.js) under the look: through the table. o.kind names the kind; otherwise a part asking for metalness of a half or
     more is metal and anything else takes the frame's default. Roughness and metalness given by the call are the table's to decide.
     Emissive is kept only where the frame emits light (or the call says o.emits): a cell's organelles do not shine. */
  const STRIP = ['kind', 'emits', 'roughness', 'metalness'];
  L.smat = (color, o) => {
    o = o || {}; const kind = o.kind || (o.metalness >= .5 ? 'metal' : defaultKind()), ex = {};
    for (const k in o) if (!STRIP.includes(k)) ex[k] = o[k];
    if (ex.emissive !== undefined && !o.emits && !emitsNow()) delete ex.emissive;
    const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .8, metalness: 0 }, ex));
    return dress(m, kind);
  };
  /* which kind a part is, from what it is called in its data (a first guess: the rollout puts "kind" into each part's data, which then wins) */
  function kindOf(c) {
    if (!c) return null;
    if (c.body) { const p = c.body, id = p.id || '', s = p.system === 'integumentary' || id === 'skin' ? 'skin' : (p.system || '');
      return s === 'skin' ? 'skin' : /skelet/.test(s) ? (/tooth|teeth/.test(id) ? 'enamel' : 'bone') : /musc/.test(s) ? 'muscle' : /^eye/.test(id) ? 'eye' : 'wet'; }
    if (c.pd && c.pd.kind && KINDS[c.pd.kind]) return c.pd.kind;
    const t = c.thing, id = c.pd.id || '', sys = c.pd.system || '', s = id + ' ' + sys;
    if (/\beye/.test(s) && t !== 'pond') return 'eye';
    if (/teeth|tooth/.test(s)) return 'enamel'; if (/skelet|skull|mandible|bone/.test(s)) return 'bone'; if (/muscle/.test(s)) return 'muscle';
    if (/claw|bill|beak|nail/.test(s)) return 'horn';
    switch (t) {
      case 'pond': return /^(surface|water)/.test(id) ? 'water' : /stone|pebble/.test(s) ? 'rock' : /duckweed|plants|reed|leaf|lily/.test(s) ? 'leaf' : /skater|animals|beetle|larva/.test(s) ? 'chitin' : 'soil';
      case 'boulder': return /rock|stone|debris/.test(s) ? 'rock' : 'matte';
      case 'oak': return /lea(f|ves)|crown/.test(s) ? 'leaf' : /soil/.test(s) ? 'soil' : /acorn|bud/.test(s) ? 'wood' : 'bark';
      case 'mushroom': return /soil/.test(s) ? 'soil' : /^(h_)?cap(_far)?$/.test(id) ? 'wax' : 'fungus';
      case 'dog': return /coat|fur|ear/.test(s) && !/nose|paw/.test(id) ? 'fur' : /paw/.test(id) ? 'skin' : 'wet';
      case 'robin': return /outside|feather|plum/.test(s) ? 'feather' : /skin/.test(s) ? 'skin' : 'wet';
      case 'bee': return /wing/.test(s) ? 'glass' : /hair/.test(s) ? 'fur' : /organ|gut|gland|nerv|heart/.test(s) ? 'wet' : 'chitin';
      case 'flower': return /petal/.test(s) ? 'petal' : /soil/.test(s) ? 'soil' : /root/.test(s) ? 'matte' : 'leaf';
      case 'grass': return /soil/.test(s) ? 'soil' : /root/.test(s) ? 'matte' : 'leaf';
      case 'soil': return /stone|pebble|grain|flint/.test(s) ? 'rock' : /root|worm|fung/.test(s) ? 'wet' : 'soil';
    }
    return null;
  }
  let ctx = null;   // what the material being made is for: set round ThingObj._addPart and decodePart (LOOK.wire) for the length of one call
  /* illoMat() (js/nodes.js) under the look: a standard material of the kind the call names (o.kind), or of the part it is made for, or the frame's default */
  L.illoMat = (color, o) => {
    o = o || {}; const ex = Object.assign({}, o.extra || {});
    const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .8, metalness: 0, opacity: 1, side: o.double ? THREE.DoubleSide : THREE.FrontSide }, ex));
    let kind = o.kind || null; if (!kind) try { kind = kindOf(ctx); } catch (e) { } if (ctx && ctx.body) ctx = null;
    dress(m, kind || defaultKind(), { instanced: !!(o.instanced || (ctx && ctx.pd && ctx.pd.instances)) });
    return ex.transparent ? m : opaqueUnlessFading(m);
  };
  L.wire = () => {
    if (!PBR || L._wired) return; L._wired = true;
    if (typeof ThingObj !== 'undefined') { const f = ThingObj.prototype._addPart; ThingObj.prototype._addPart = function (pd) { const prev = ctx; ctx = { thing: this.def && this.def.id, pd }; try { return f.call(this, pd); } finally { ctx = prev; } }; }
    if (typeof decodePart === 'function') { const f = decodePart; window.decodePart = function (p) { ctx = { body: p }; return f.apply(this, arguments); }; }
  };

  /* ---------- 4. the sky, and light from it ----------
     Preetham, Shirley and Smits (1999), "A practical analytic model for daylight", as implemented in three.js r128 (examples/js/objects/Sky.js,
     MIT), moved into one fragment shader. It is computed from the direction of the real Sun, so the sky agrees with the date and time shown.
     It is a clear sky of moderate haze (turbidity 2.2): not today's weather. uDisc 0 leaves the Sun's disc out (the environment: the Sun is a
     light of its own); uEnv 1 fills the lower half with the light the lawn sends back up. The same shader draws the visible sky. */
  /* Below the horizon (section 9, night): uNight.w scales the Sun's sky (twilight: the sky keeps the shape it has with the Sun on the
     horizon and the measured brightness for the Sun's depth), uNight.rgb is the moonless night sky's own light (airglow and starlight),
     uMoon.xyz the Moon's direction and uMoon.w its sky (the same sky, lit by the Moon, at the Moon's brightness over the Sun's). A
     material that never set uNight (w = 0) gets the Sun's sky unchanged. */
  const SKY_FRAG = `uniform vec3 uSun; uniform float uDisc; uniform float uEnv; uniform float uGain; uniform float uOpacity; uniform vec4 uNight; uniform vec4 uMoon; varying vec3 vD;
const float lkPi = 3.141592653589793;
const vec3 lkRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );
const vec3 lkMie = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );
float lkSunE( float c ) { return 1000.0 * max( 0.0, 1.0 - exp( - ( ( 1.6110731556870734 - acos( clamp( c, -1.0, 1.0 ) ) ) / 1.5 ) ) ); }
vec3 lkSkyOf( vec3 dir, vec3 sun, float disc ) {
  float sunE = lkSunE( sun.y ), sunfade = 1.0 - clamp( 1.0 - exp( sun.y ), 0.0, 1.0 );
  vec3 betaR = lkRayleigh * ( 1.0 - ( 1.0 - sunfade ) ), betaM = ( 0.434 * ( 0.2 * 2.2 ) * 10E-18 * lkMie ) * 0.005;
  float zen = acos( max( 0.0, dir.y ) ), inv = 1.0 / ( cos( zen ) + 0.15 * pow( 93.885 - ( ( zen * 180.0 ) / lkPi ), -1.253 ) );
  vec3 Fex = exp( - ( betaR * 8.4E3 * inv + betaM * 1.25E3 * inv ) );
  float ct = dot( dir, sun ), g = 0.8;
  vec3 bRT = betaR * ( 0.05968310365946075 * ( 1.0 + pow( ct * 0.5 + 0.5, 2.0 ) ) );
  vec3 bMT = betaM * ( 0.07957747154594767 * ( ( 1.0 - g * g ) / pow( 1.0 - 2.0 * g * ct + g * g, 1.5 ) ) );
  vec3 sc = sunE * ( ( bRT + bMT ) / ( betaR + betaM ) );
  vec3 Lin = pow( sc * ( 1.0 - Fex ), vec3( 1.5 ) );
  Lin *= mix( vec3( 1.0 ), pow( sc * Fex, vec3( 0.5 ) ), clamp( pow( 1.0 - sun.y, 5.0 ), 0.0, 1.0 ) );
  vec3 L0 = vec3( 0.1 ) * Fex + ( sunE * 19000.0 * Fex ) * smoothstep( 0.999956676946448, 0.999976676946448, ct ) * disc;
  return pow( ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 ), vec3( 1.0 / ( 1.2 + 1.2 * sunfade ) ) );
}
void main(){
  vec3 dir = normalize( vD ), sun = normalize( uSun );
  float sunE = lkSunE( sun.y ), sunfade = 1.0 - clamp( 1.0 - exp( sun.y ), 0.0, 1.0 );
  vec3 betaR = lkRayleigh * ( 1.0 - ( 1.0 - sunfade ) ), betaM = ( 0.434 * ( 0.2 * 2.2 ) * 10E-18 * lkMie ) * 0.005;
  float lkK = uNight.w > 0.0 ? uNight.w : 1.0;
  vec3 col = lkSkyOf( dir, sun.y >= 0.0 ? sun : normalize( vec3( sun.x, 0.0, sun.z + 1e-4 ) ), uDisc * step( 0.0, sun.y ) ) * ( uGain * lkK );
  if ( uMoon.w > 0.0 ) col += lkSkyOf( dir, normalize( uMoon.xyz ), 0.0 ) * ( uGain * uMoon.w );
  col += uNight.rgb;
  if ( uEnv > 0.5 ) col = mix( col, vec3( 0.075, 0.150, 0.030 ) * ( 0.25 + 0.9 * max( sun.y, 0.0 ) ) * ( sunE / 1000.0 ) * lkK + uNight.rgb * 0.15, 1.0 - smoothstep( -0.06, 0.0, dir.y ) );
  float lkA = uNight.w > 0.0 ? mix( 0.05, 1.0, smoothstep( -0.309, -0.208, sun.y ) ) : clamp( smoothstep( -0.15, 0.12, sun.y ) * 1.4 + 0.05, 0.0, 1.0 );   // with the night set (section 9): the sky hides what is behind it until nautical dusk (Sun 12 degrees down), and lets the stars through by the end of twilight (18 down)
  gl_FragColor = vec4( col, uOpacity * lkA );
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
  L.SKY_FRAG = SKY_FRAG;
  function skyUniforms() { return { uNight: { value: new THREE.Vector4(0, 0, 0, 1) }, uMoon: { value: new THREE.Vector4(0, 1, 0, 0) } }; }
  L.skyUniforms = skyUniforms;   // a material drawn with SKY_FRAG takes these (section 9)
  /* The sky's brightness, one gain for the light it gives and for the sky that is seen. In three.js units (physicallyCorrectLights off)
     the park's Sun shows a level white surface at 1.15 x sin(elevation), and the sky shows it at the cosine-weighted mean of the sky's
     radiance; both are the real irradiance over pi, so they compare directly. Two measurements agree on 0.08:
       - midday under a clear sky, the Sun gives a level surface 4 to 6 times what the sky gives (about 100 and 15 to 25 thousand lux):
         at the June noon elevation of 62 degrees this shader gives 4.7;
       - a clear zenith is about 5000 cd/m2 against 32 thousand for a white card facing the Sun (0.16): this shader gives 0.15.
     (The prototype's 0.5 made the sky give nearly as much as the Sun.) The photographed Greenwich sky cannot check it: an HDR's Sun is
     usually clipped, and that one's Sun measures only 1.3 times the rest of its sky. */
  const SKY_GAIN = .08;
  const SKY_VERT = 'varying vec3 vD; void main(){ vD = normalize( position ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }';
  const ENV = { pm: null, scene: null, mesh: null, mat: null, studio: null, sky0: null, n: 0 };
  function envScene() {
    if (ENV.pm) return; ENV.pm = new THREE.PMREMGenerator(renderer); ENV.scene = new THREE.Scene();
    ENV.mat = new THREE.ShaderMaterial({ uniforms: Object.assign({ uSun: { value: new V3(.45, .8, .4).normalize() }, uDisc: { value: 0 }, uEnv: { value: 1 }, uGain: { value: SKY_GAIN }, uOpacity: { value: 1 } }, skyUniforms()), side: THREE.BackSide, depthTest: false, depthWrite: false, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG });
    ENV.mesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), ENV.mat); ENV.scene.add(ENV.mesh);
  }
  /* one prefiltered environment from a material drawn on a sphere round the origin (the computed sky, a frame's own sky dome, a photograph) */
  function envFrom(mat, old) {
    envScene(); ENV.mesh.material = mat || ENV.mat;
    const rt = ENV.pm.fromScene(ENV.scene, 0, .1, 100); ENV.mesh.material = ENV.mat; ENV.n++;
    if (old) old.dispose(); return rt;
  }
  if (PBR && P('env')) {
    try { ENV.sky0 = envFrom(null).texture; } catch (e) { console.warn('look: no environment', e && e.message); }   // a first sky, before any Sun is known: everything compiles against it, and the real one replaces it without a new program
  }
  /* LOOK.envLoad(name, file): a photographed environment (an equirectangular .hdr in assets/look) by name, prefiltered once and kept. Resolves to the texture. */
  const ENVP = {};
  const rgbeLoader = () => THREE.RGBELoader ? Promise.resolve() : new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'js/vendor/RGBELoader.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
  L.hdrLoad = file => rgbeLoader().then(() => new Promise((res, rej) => new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load(TEXDIR + file, res, undefined, rej)));
  L.envLoad = (name, file) => ENVP[name] || (ENVP[name] = track(L.hdrLoad(file).then(t => { envScene(); const e = ENV.pm.fromEquirectangular(t).texture; t.dispose(); ENV[name] = e; return e; })));
  L.env = name => !name || name === 'sky' ? (skyOf(FR_park()) || ENV.sky0) : (ENV[name] || ENV.sky0);   // by name; until a photographed one has arrived the sky stands in, so no shader is built twice
  /* the studio photograph is fetched when the first studio frame is built (2 MB: not for a view that has none) */
  const studioEnv = () => { if (!ENV.studio && !ENVP.studio && P('studio')) L.envLoad('studio', 'white_studio_06_1k.hdr').then(() => envAssign(true)).catch(e => console.warn('look: studio', e && e.message)); return ENV.studio || ENV.sky0; };
  const FR_park = () => typeof FR !== 'undefined' && FR.park && FR.park.built ? FR.park : null;

  /* Outdoors, each place has its own sky: the frame whose Sun and sky light a frame (the park lights the body and the things in it; a
     landscape or the region over London lights itself). Its environment is redrawn when its Sun has moved about a degree, at most once in
     two seconds; a frame's scene takes the environment of its sky's owner. A world other than the Earth with a sky (Mars) is lit by its own
     sky dome; the Earth's places by the computed sky. */
  function skyOwner(F) {
    if (!F || F.rig !== 'outdoor') return null;
    for (let f = F; f; f = f.parent) if (f.type === 'park' || f.type === 'region' || f.type === 'landscape') return f;
    return null;
  }
  const sunOf = O => {
    if (O.type === 'park') return parkDir(O);
    return typeof sunDirIn === 'function' ? _sun.copy(sunDirIn(O)) : null;
  };
  function skyOf(O) { return O && O._lkSky && O._lkSky.tex || null; }
  function skyMatOf(O) {   // what is drawn into the owner's environment
    if (O._lkSkyMat !== undefined) return O._lkSkyMat;
    let m = null;
    if (O.type === 'landscape' && O.opts.body && O.opts.body !== 'Earth') O.root.traverse(o => { if (!m && o.material && o.material.uniforms && o.material.uniforms.uTop) m = o.material; });   // the world's own sky dome
    return (O._lkSkyMat = m);
  }
  function skyRedraw(O, now) {
    const s = sunOf(O); if (!s) return false; const S = O._lkSky || (O._lkSky = { rt: null, tex: null, at: new V3(9, 9, 9), t: -1e9 });
    const ph = O.type === 'park' ? photoNow(s) : null;   // a photographed sky over the park (section 7)
    if (ph) { if (S.photo === ph.key) return false; S.photo = ph.key; try { S.rt = envFrom(ph.mat, S.rt); S.tex = S.rt.texture; } catch (e) { console.warn('look: photo sky', e && e.message); } S.t = now; S.at.set(9, 9, 9); return true; }
    if (S.photo) { S.photo = null; S.tex = null; }
    if (S.tex && ((S.at.distanceToSquared(s) < 3e-4 && (O.type !== 'park' || Math.abs(NIGHT.moonW - (S.mw || 0)) <= .05 * NIGHT.moonW)) || now - S.t < 2000)) return false;
    S.mw = NIGHT.moonW;
    const dm = skyMatOf(O); let op = 1;
    if (dm) { op = dm.uniforms.uOpacity.value; dm.uniforms.uOpacity.value = 1; dm.uniforms.uSun.value.copy(s); } else { ENV.mat.uniforms.uSun.value.copy(s); setNight(ENV.mat.uniforms, s.y, O.type !== 'park'); }
    try { S.rt = envFrom(dm, S.rt); S.tex = S.rt.texture; } catch (e) { console.warn('look: sky', e && e.message); }
    if (dm) dm.uniforms.uOpacity.value = op;
    S.at.copy(s); S.t = now;
    if (!O._lkDisp) { O._lkDisp = true; const d0 = O.onDispose; O.onDispose = function () { if (d0) d0.call(this); if (O._lkSky && O._lkSky.rt && !O._lkSky.keep) O._lkSky.rt.dispose(); O._lkSky = null; O._lkSkyMat = undefined; }; }
    return true;
  }
  L.envFor = F => { if (!PBR || !P('env') || !F) return null; const r = F.rig || rigOf(F); if (r === 'studio') return P('studio') ? studioEnv() : ENV.sky0; if (r === 'outdoor') return skyOf(skyOwner(F)) || ENV.sky0; return null; };
  function envAssign(all) {
    if (typeof drawn === 'undefined') return;
    const list = all && typeof ROOT !== 'undefined' && ROOT ? (function walk(f, out) { out.push(f); (f.children || []).forEach(c => walk(c, out)); return out; })(ROOT, []) : drawn;
    for (const f of list) { if (!f.built || !f.scene) continue; const e = L.envFor(f); if (f.scene.environment !== e) f.scene.environment = e; }
  }
  L.envAssign = envAssign;
  /* the park's Sun direction, as the park set it (its sky's uniform): the light itself is moved about with the shadow's square (section 6) */
  function parkDir(F) { const p = F && F.v2 && F.v2.parts; if (!p || !p.sun) return null; return p.sky && p.sky.material.uniforms && p.sky.material.uniforms.uSun ? _sun.copy(p.sky.material.uniforms.uSun.value).normalize() : _sun.subVectors(p.sun.position, p.sun.target.position).normalize(); }
  function parkSun() { const F = FR_park(), p = F && F.v2 && F.v2.parts; if (!p || !p.sun) return null; return { dir: parkDir(F), day: Math.min(1, p.sun.intensity / 1.15), sun: p.sun }; }
  L.sun = () => { const s = parkSun(); return s ? { dir: s.dir.clone(), day: s.day, color: s.sun.color.clone(), intensity: s.sun.intensity } : null; };   // the park's Sun now: direction (park coordinates), how much of the day is left (0 to 1), colour, intensity
  /* the colour of the computed sky in one direction, as it is shown (tone curve and sRGB included): the fog takes it, so that far
     things fade into the sky at the horizon with no seam. The same arithmetic as SKY_FRAG. */
  const ACES = c => { const m1 = [[.59719, .35458, .04823], [.07600, .90834, .01566], [.02840, .13383, .83777]], m2 = [[1.60475, -.53108, -.07367], [-.10208, 1.10813, -.00605], [-.00327, -.07276, 1.07602]];
    const a = m1.map(r => r[0] * c[0] + r[1] * c[1] + r[2] * c[2]).map(v => (v * (v + .0245786) - .000090537) / (v * (.983729 * v + .4329510) + .238081)); return m2.map(r => Math.max(0, Math.min(1, r[0] * a[0] + r[1] * a[1] + r[2] * a[2]))); };
  const toSRGB = v => v <= .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055;
  L.shown = (rgb, exposure) => { const k = (exposure || 1) / .6; const c = P('tone') ? ACES(rgb.map(v => v * k)) : rgb.map(v => Math.min(1, v * (exposure || 1))); return c.map(toSRGB); };
  function skyRGB(dir, sun) {
    const pi = Math.PI, R = [5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5], M = [1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14];
    const cl = (x, a, b) => Math.max(a, Math.min(b, x)), sunE = 1000 * Math.max(0, 1 - Math.exp(-((1.6110731556870734 - Math.acos(cl(sun.y, -1, 1))) / 1.5))), sunfade = 1 - cl(1 - Math.exp(sun.y), 0, 1);
    const bR = R.map(v => v * sunfade), bM = M.map(v => .434 * (.2 * 2.2) * 10E-18 * v * .005);
    const zen = Math.acos(Math.max(0, dir.y)), inv = 1 / (Math.cos(zen) + .15 * Math.pow(93.885 - zen * 180 / pi, -1.253));
    const Fex = [0, 1, 2].map(i => Math.exp(-(bR[i] * 8.4E3 * inv + bM[i] * 1.25E3 * inv)));
    const ct = dir.x * sun.x + dir.y * sun.y + dir.z * sun.z, g = .8, rp = .05968310365946075 * (1 + Math.pow(ct * .5 + .5, 2)), mp = .07957747154594767 * ((1 - g * g) / Math.pow(1 - 2 * g * ct + g * g, 1.5));
    const k = cl(Math.pow(1 - sun.y, 5), 0, 1), e = 1 / (1.2 + 1.2 * sunfade), add = [0, .0003, .00075];
    return [0, 1, 2].map(i => { const sc = sunE * ((bR[i] * rp + bM[i] * mp) / (bR[i] + bM[i])); let Lin = Math.pow(sc * (1 - Fex[i]), 1.5); Lin *= 1 + (Math.pow(sc * Fex[i], .5) - 1) * k; return Math.pow((Lin + .1 * Fex[i]) * .04 + add[i], e) * SKY_GAIN; });
  }
  /* the whole sky in one direction, as SKY_FRAG draws it with the park's uNight and uMoon (section 9): the Sun's sky (scaled below the
     horizon), the Moon's, and the night's own light */
  const _sS = new V3(), _sM = new V3();
  function skyAll(dir, sun) {
    const K = twiK(sun.y), sh = sun.y >= 0 ? sun : _sS.set(sun.x, 0, sun.z + 1e-4).normalize(), c = skyRGB(dir, sh).map(v => v * K);
    if (NIGHT.moonW > 0) { const m = skyRGB(dir, _sM.set(NIGHT.moonU[0], NIGHT.moonU[1], NIGHT.moonU[2])); for (let i = 0; i < 3; i++) c[i] += m[i] * NIGHT.moonW; }
    for (let i = 0; i < 3; i++) c[i] += NIGHT_N; return c;
  }
  L.skyRGB = skyAll;
  /* the fog colour of an outdoor scene: the sky at the horizon, a quarter turn from the Sun, as shown on screen */
  L.horizon = (sun, exposure) => { const a = Math.atan2(sun.z, sun.x) + Math.PI / 2; return L.shown(skyAll(_v.set(Math.cos(a), .02, Math.sin(a)).normalize(), sun), exposure); };

  /* ---------- 5. light: one rig per kind of scene ---------- */
  function lightsOf(F) { const r = { hemi: [], amb: [], dir: [], pt: [], spot: [] }; F.root.traverse(o => { if (!o.isLight || o.userData.lkOwn) return; if (o.isHemisphereLight) r.hemi.push(o); else if (o.isAmbientLight) r.amb.push(o); else if (o.isDirectionalLight) r.dir.push(o); else if (o.isPointLight) r.pt.push(o); else if (o.isSpotLight) r.spot.push(o); }); return r; }
  const hide = (F, o) => { o.visible = false; o.userData.lkOff = true; (F._lkOff || (F._lkOff = new Set())).add(o); };
  /* The studio: one key over the viewer's left shoulder, the photographed room for everything else. The key follows the view, as the lamp
     over a bench lights a specimen from the upper left however it is turned. */
  function studioKey(F, key) {
    if (!F.scene || F.scene._lkKey === key) return; F.scene._lkKey = key; const v = new V3(), b0 = F.scene.onBeforeRender;
    F.scene.onBeforeRender = function (r, s, camera) { const k = this._lkKey; if (k) { v.set(-.55, .62, .56).applyQuaternion(camera.quaternion).multiplyScalar(1e5); k.position.copy(v); if (k.target.parent) k.target.position.set(0, 0, 0); } b0.call(this, r, s, camera); };
  }
  /* apply the frame's rig to its lights: every hemisphere and ambient light and every second light is switched off (the environment does
     their work); one key stays. Run again when lights arrive later (a thing's lights come with its model). */
  const KEYI = { cell: .7, mol: .66, crystal: .66 };   // a studio lamp a little brighter where the model is pale and small-featured
  function applyLights(F) {
    const rig = F.rig, l = lightsOf(F); F._lkN = F.root.children.length;
    if (rig === 'diagram') {   // unlit: one flat white light that gives every surface exactly its own colour, and no tone curve (flatten)
      [...l.hemi, ...l.amb, ...l.dir, ...l.pt, ...l.spot].forEach(o => hide(F, o));
      if (!F._lkFlat) { F._lkFlat = new THREE.AmbientLight(0xffffff, 1); F._lkFlat.userData.lkOwn = true; F.root.add(F._lkFlat); F._lkN = F.root.children.length; }
      return;
    }
    [...l.hemi, ...l.amb, ...l.spot].forEach(o => hide(F, o));
    const keys = [...l.dir, ...l.pt], key = rig === 'space' ? (l.pt[0] || l.dir[0]) : l.dir[0];
    keys.forEach(o => { if (o !== key) hide(F, o); });
    if (rig === 'studio') {
      let k = key; if (!k) { k = new THREE.DirectionalLight(0xffffff, 1); k.userData.lkOwn = true; F.root.add(k); F._lkN = F.root.children.length; }
      k.intensity = F._lkKeyI || KEYI[F.type] || .62; k.color.setHex(0xfffaf2); studioKey(F, k);
    }
  }
  /* a diagram: every lit material shows its own colour, untouched by the tone curve */
  function flatten(F) { F.root.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if ((m.isMeshStandardMaterial || m.isMeshToonMaterial || m.isMeshPhongMaterial || m.isMeshLambertMaterial) && m.toneMapped) { m.toneMapped = false; m.needsUpdate = true; } }); F._lkFlatT = performance.now(); }
  L.light = (F, rig) => { if (rig === 'studio') { F.rig = 'studio'; F.exposure = RIGS.studio.exposure; applyLights(F); if (F.scene && PBR && P('env')) F.scene.environment = L.envFor(F); } };
  /* a material made to glow on a dark ground (emissive colour, a rim added to the picture as light) becomes a surface that is lit */
  const _hsl = { h: 0, s: 0, l: 0 };
  function unglow(m, rough) {
    if (!m || m._lkUn) return; m._lkUn = true;
    if (m.isShaderMaterial) { if (m.blending === THREE.AdditiveBlending && m.uniforms && m.uniforms.uInt) m.uniforms.uInt.value *= .4; return; }
    if (m.emissive) m.emissive.setRGB(0, 0, 0);
    if (m.isMeshStandardMaterial) { m.roughness = rough; m.metalness = 0; if (m.color) { m.color.getHSL(_hsl); m.color.setHSL(_hsl.h, Math.min(.62, _hsl.s), Math.max(.3, Math.min(.6, _hsl.l))); } }
  }
  /* what a scene of the prototype needs beyond its rig (each scene family takes these over) */
  const DRESS = {
    park(F) {
      const c = F.v2, p = c && c.parts; if (!p) return;
      if (PBR && P('sky') && p.sky) {   // the visible sky: the same shader as the light it gives
        const m = p.sky.material; Object.assign(m.uniforms, { uDisc: { value: 1 }, uEnv: { value: 0 }, uGain: { value: SKY_GAIN }, uOpacity: { value: 1 } }, skyUniforms()); m.fragmentShader = LDF(SKY_FRAG); m.needsUpdate = true;
        m.transparent = true; m.premultipliedAlpha = true;   // the sky's light is added to what is behind it (the stars of the frames above, the Moon), and hides it only as far as its alpha says: by day all of it, at night almost none
      }
      if (PBR && P('tex') && p.ground && p.ground.material) {   // the lawn: its own green, with the blades and the relief of a photographed turf
        const s = texSet('lawn'), old = p.ground.material.map, rep = 340 * s.scale, tint = new THREE.Color(.33 * 2, .50 * 2, .19 * 2);
        s.map.repeat.set(rep, rep);
        F.root.traverse(o => { const m = o.material; if (!m || Array.isArray(m) || !m.isMeshStandardMaterial || !old || m.map !== old) return;
          m.map = s.map; m.color.multiply(tint); if (o === p.ground) { m.normalMap = s.normalMap; m.normalScale.set(s.bump, s.bump); } m.roughness = .96; m.userData.kind = 'turf'; m.needsUpdate = true; });
      }
      if (P('shadow')) L.blobs = makeBlobs(F);
      /* everything that is ground takes the Sun's shadow: the lawn, its far ring, the hills and the turf near the eye */
      F.root.traverse(o => { if (o.isMesh && o.userData && o.userData.id === 'ground') o.receiveShadow = true; });
      if (c.lawn) { c.lawn.shells.receiveShadow = true; c.lawn.t0.receiveShadow = true; }
    },
    /* the person stands in the park: lit by the park's Sun and its sky, like everything else there */
    body(F) {
      const l = lightsOf(F); if (!l.dir[0]) return;
      l.dir[0].color.setHex(0xfff1d6);
      L.body = { F, key: l.dir[0], home: l.dir[0].position.clone().normalize() }; bodyLight();
    },
    cell(F) {
      const BG = 0x0d1115; F.env = Object.assign({}, F.env, { bg: BG, opaque: true }); if (F.scene.background && F.scene.background.isColor) F.scene.background.setHex(BG); if (F.scene.fog) F.scene.fog.color.setHex(BG);
      F.root.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => unglow(m, .36)); });
    },
  };
  /* The person's key light is the park's: the Sun, or the Moon once the Sun has set, exactly as the lawn gets it (section 9). There is no
     lamp of its own after sunset: the eye's adaptation (exposure) is what keeps a night view readable. */
  function bodyLight() {
    const b = L.body; if (!b || !b.F.built || !P('rig')) return; const s = parkSun();
    const d = s ? _v.subVectors(s.sun.position, s.sun.target.position).normalize() : _v.copy(b.home);
    if (b.key.position.distanceToSquared(d.multiplyScalar(40)) > 1e-3) b.key.position.copy(d);
    if (PBR) { b.key.intensity = s ? s.sun.intensity : 1.15; if (s) b.key.color.copy(s.sun.color); }
  }
  /* soft contact shadows: one instanced quad for what stands on the lawn and is too small for the Sun's shadow map */
  const BLOB = .3;
  function makeBlobs(F) {
    const spots = [[0, 0, .2]], R = { dog: .26, mushroom: .09, boulder: .45, flower: .045, grass: .11 };
    (FR.things || []).forEach(t => { const r = R[t.opts && t.opts.thing]; if (r && t.pos) spots.push([t.pos.x, t.pos.z, r]); });
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.62)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv), geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0b140c, alphaMap: tex, transparent: true, opacity: BLOB, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const m = new THREE.InstancedMesh(geo, mat, spots.length); m.frustumCulled = false; m.renderOrder = 1; m.userData.noPick = true;
    F.root.add(m); return { m, spots, M: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new V3(), p: new V3(), last: new V3(9, 9, 9) };
  }
  function blobStep() {
    const b = L.blobs, s = parkSun(); if (!b || !b.m.parent) return; b.m.visible = P('shadow'); if (!s || !b.m.visible) return; if (b.last.distanceToSquared(s.dir) < 1e-5) return; b.last.copy(s.dir);
    const hx = -s.dir.x, hz = -s.dir.z, hl = Math.hypot(hx, hz) || 1, low = 1 - Math.min(1, Math.max(.2, s.dir.y)), a = Math.atan2(hx, hz);
    b.q.setFromAxisAngle(b.p.set(0, 1, 0), a);
    b.spots.forEach((sp, i) => { const r = sp[2], off = r * (.25 + .9 * low);   // the shadow leans away from the Sun, further as the Sun gets low
      b.p.set(sp[0] + hx / hl * off, .012, sp[1] + hz / hl * off); b.s.set(r * 2.1, 1, r * (2.1 + 2.4 * low)); b.M.compose(b.p, b.q, b.s); b.m.setMatrixAt(i, b.M); });
    b.m.instanceMatrix.needsUpdate = true; b.m.material.opacity = BLOB * Math.max(0, Math.min(1, s.day)) * (s.dir.y > 0 ? 1 : 0);
  }

  /* ---------- 6. the Sun's shadow, fitted to what is on screen (rollout step 7) ----------
     One shadow map, as before, drawn again only when something changed (js/world_matter.js, shadowStep, asks LOOK.shadowFit). The map's
     square is centred on the ground where the camera looks and is about 3.2 viewing distances wide (16 m to 240 m), so near things get fine
     texels and the oaks round a 30 m view are inside it. Its centre is snapped to whole texels in the light's own axes, so a shadow does not
     crawl when the view moves; the map is redrawn when the snapped centre has moved 6 texels, the square has changed size by a step of 25
     percent, the Sun has moved, or a caster has changed (a thing's detail tier, a thing entering or leaving the park's scene).
     Casters: every thing drawn in the park's scene, and the person: the body is a scene of its own, which cannot cast into the park's map,
     so its skin's geometry is drawn into the map as a stand-in that the camera never sees (it draws nothing in the main pass). Measured:
     counts only; the map costs one depth pass over the casters on a redraw, none on other frames. Not done: a penumbra that widens with
     distance (r128's soft shadow is one constant blur), and the parts that move (a wagging tail, swaying leaves) cast where they were. */
  const SHF = { drawn: new V3(), have: false, c: new V3(), half: 0, dir: new V3(), sig: '', ax: new V3(), ay: new V3(), az: new V3(), t: new V3(), proxy: null, size: 0 };
  L.shadowFit = (F, sun, SH) => {
    if (!PBR || typeof cam === 'undefined' || typeof convertP !== 'function') return null;
    const size = quality === 'low' ? 1024 : 2048;
    if (SHF.size !== size) { SHF.size = size; SH.mapSize.set(size, size); if (SH.map) { SH.map.dispose(); SH.map = null; } SHF.half = 0; }
    /* where the camera looks, on the ground, in the park's coordinates */
    const T = SHF.t.copy(cam.T); convertP(T, cam.A, F); T.y = 0;
    const D = Math.min(cam.D, 2e3), want = Math.max(8, Math.min(120, 1.6 * D)), half = Math.pow(1.25, Math.round(Math.log(want) / Math.log(1.25)));
    const d = SHF.dir.copy(NIGHT.key === 'moon' ? NIGHT.moonDir : parkDir(F) || sun.position).normalize(), az = SHF.az.copy(d), ax = SHF.ax.set(0, 1, 0).cross(az); if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0); ax.normalize(); const ay = SHF.ay.crossVectors(az, ax);
    const tex = 2 * half / size, u = Math.round(T.dot(ax) / tex) * tex, v = Math.round(T.dot(ay) / tex) * tex, w = T.dot(az);
    const c = _v.copy(ax).multiplyScalar(u).addScaledVector(ay, v).addScaledVector(az, w);
    let sig = ''; for (const f of drawn) if (f.type === 'thing' && f.T && f.parent === F) sig += (f._merged && !f._culled ? f.T.tier : 'x');
    if (SHF.proxy) sig += SHF.proxy.visible ? 'p' : '';
    const moved = SHF.half !== half || c.distanceTo(SHF.c) > 6 * tex || sig !== SHF.sig || SHF.drawn.distanceToSquared(d) > 1e-6 || !SHF.have;
    const R = (moved ? half : SHF.half) * 3 + 60;
    if (moved) { SHF.c.copy(c); SHF.half = half; SHF.sig = sig; SHF.drawn.copy(d); SHF.have = true; SHF.pending = true; }
    sun.target.position.copy(SHF.c); sun.position.copy(SHF.c).addScaledVector(d, R); sun.target.updateMatrixWorld();   // every frame: the Sun's direction is kept, only its place moves with the square
    if (!moved) return !!SHF.pending;   // asked for and not yet drawn (the map is drawn at most ten times a second)
    const cmr = SH.camera;
    Object.assign(cmr, { left: -half, right: half, top: half, bottom: -half, near: Math.max(.5, R - half * 2 - 40), far: R + half * 2 + 40 }); cmr.updateProjectionMatrix();
    SH.bias = -.0004; SH.normalBias = tex * 1.2;
    return true;
  };
  L.shadowDrawn = () => { SHF.pending = false; };
  /* the person's shadow: the skin of the anatomical body, drawn only into the park's shadow map */
  function personProxy(F) {
    const B = FR.body, sk = B && B.built && B.partsReady && B.parts && B.parts.skin; if (!sk || SHF.proxy) return;
    const main = sk.g.userData.main; if (!main || !main.geometry) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', main.geometry.attributes.position); if (main.geometry.index) g.setIndex(main.geometry.index); g.boundingSphere = main.geometry.boundingSphere;
    B.root.updateMatrixWorld(true); const M = new THREE.Matrix4().copy(B.root.matrixWorld).invert().multiply(main.matrixWorld);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide })); m.matrixAutoUpdate = false; m.matrix.copy(M); m.castShadow = true; m.userData.noPick = true; m.frustumCulled = false;
    let n = 0; m.onBeforeRender = () => { n = g.drawRange.count; g.drawRange.count = 0; }; m.onAfterRender = () => { g.drawRange.count = n; };   // never drawn in the picture: only into the shadow map
    F.root.add(m); SHF.proxy = m;
    const d0 = B.onDispose; B.onDispose = function () { if (d0) d0.call(this); if (SHF.proxy) { if (SHF.proxy.parent) SHF.proxy.parent.remove(SHF.proxy); SHF.proxy = null; } };
  }
  let tCast = 0, tScan = 0;
  function shadowCasters(now) {   // things in the park cast into its map once their model has arrived; the person once the body has
    if (!PBR || now - tCast < 500) return; tCast = now; const F = FR_park(); if (!F || !drawn.includes(F)) return;
    if (!SHF.proxy && PERF.flags.shadows) personProxy(F);
    if (SHF.proxy) SHF.proxy.visible = !!(FR.body && FR.body.built && FR.body.alpha > .5);
    if (now - tScan < 2000) return; tScan = now; let added = 0;   // a thing builds the meshes of a detail tier when it first needs them: look again every two seconds
    for (const f of drawn) {
      const T = f.type === 'thing' && f.parent === F && f.T; if (!T) continue;
      T.group.traverse(o => { if (!o.isMesh || o.castShadow || o._lkNoCast || !o.material || o.userData.shadow) return; const m = o.material;
        if (m.isMeshStandardMaterial && m.visible !== false && !(m.transparent && m.opacity < .5)) { o.castShadow = true; if (quality === 'high') o.receiveShadow = true; added++; } else if (!m.isMeshStandardMaterial) o._lkNoCast = true; });   // a part fading in is looked at again
    }
    if (added) SHF.have = false;   // new casters: draw the map again
  }

  /* ---------- 7. a photographed sky over the park (?looksky=photo or overcast; the computed sky is the default) ----------
     Two photographs of Greenwich Park by Andreas Mischok (Poly Haven, CC0), halved to 1k, the Sun's disc in the clear one clamped to four
     times the sky round it (the Sun is a light of its own). Each is shown on the park's sky ball and is the park's environment, drawn from
     the same sphere, so what is seen and what lights the lawn agree.
       photo     the clear sky, taken in winter with the Sun 23.47 degrees high. It is true only when the real Sun stands there: choosing it
                 sets the clock to such an hour (the nearest day, afternoon) and stops it, and the photograph is turned so that its Sun is
                 where the app's Sun is. If the clock is moved and the Sun is more than 4 degrees from that height, the computed sky comes back.
       overcast  a grey sky has no Sun to disagree with: shown while the Sun is up (above -2 degrees), with the Sun's direct light off.
     Brightness: the clear photograph's own Sun is not trusted (see SKY_GAIN), so its sky is scaled to give a level surface what the
     computed sky gives at the same height (0.136 against 0.403 measured with the Sun clamped: 0.34); the overcast one so that a level surface gets 0.9, about three quarters of
     a clear noon (an exposure a camera would choose; the real overcast light is a fifth of it or less). The fog takes the photograph's own
     colour at the horizon, so the lawn's far edge fades into what the photograph shows there. A note on screen says which sky is a photograph. */
  const PHOTOS = {
    photo: { file: 'greenwich_park_1k.hdr', scale: .34, sunEl: 23.47, sunU: .59986, tol: 4,
      note: 'Sky: a photograph of Greenwich Park (Andreas Mischok, Poly Haven, CC0), taken in winter with the Sun 23.5° high. The clock is set to an hour when the Sun stands there.' },
    overcast: { file: 'greenwich_park_03_1k.hdr', scale: .926,
      note: 'Sky: a photograph of Greenwich Park under cloud (Andreas Mischok, Poly Haven, CC0). The weather is chosen, not today\'s.' },
  };
  const PH = { mode: PBR && P('sky') && PHOTOS[FL.looksky] ? FL.looksky : null, tex: null, mat: null, dome: null, horizon: [0, 0, 0], shown: null, key: '', set: false, noteEl: null, sky0: null };
  const PHOTO_FRAG = `uniform sampler2D uMap; uniform float uRot; uniform float uScale; uniform float uOpacity; varying vec3 vD;
void main(){
  vec3 d = normalize( vD ); float c = cos( uRot ), s = sin( uRot ); d = vec3( c * d.x - s * d.z, d.y, s * d.x + c * d.z );
  vec2 uv = vec2( atan( d.z, d.x ) * 0.15915494309189535 + 0.5, asin( clamp( d.y, -1.0, 1.0 ) ) * 0.3183098861837907 + 0.5 );
  vec4 t = texture2D( uMap, uv );
  gl_FragColor = vec4( t.rgb * exp2( t.a * 255.0 - 128.0 ) * uScale, uOpacity );
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
  function photoMat(tex, scale, ld) { return new THREE.ShaderMaterial({ uniforms: { uMap: { value: tex }, uRot: { value: 0 }, uScale: { value: scale }, uOpacity: { value: 1 } }, side: THREE.BackSide, depthTest: !ld ? false : true, depthWrite: false, vertexShader: ld ? LDV(SKY_VERT) : SKY_VERT, fragmentShader: ld ? LDF(PHOTO_FRAG) : PHOTO_FRAG }); }
  if (PH.mode) {
    const S = PHOTOS[PH.mode];
    track(L.hdrLoad(S.file).then(t => {
      t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; PH.tex = t;
      const d = t.image.data, W = t.image.width, H = t.image.height, sum = [0, 0, 0]; let n = 0;   // the colour at the horizon: the rows within a degree of it
      for (let y = Math.floor(H * (.5 - 1 / 180)); y < Math.ceil(H * (.5 + 1 / 180)); y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, e = d[i + 3]; if (!e) continue; const f = Math.pow(2, e - 136); sum[0] += d[i] * f; sum[1] += d[i + 1] * f; sum[2] += d[i + 2] * f; n++; }
      PH.horizon = sum.map(v => v / Math.max(1, n));
      PH.mat = photoMat(t, S.scale, false); PH.dome = photoMat(t, S.scale, true);
    }).catch(e => { console.warn('look: photo sky', e && e.message); PH.mode = null; }));
  }
  /* the Sun's height over Greenwich at a time (NOAA's approximation; degrees): to find the hour the photograph was taken at */
  function sunEl(t) {
    const d = (t - Date.UTC(2000, 0, 1, 12)) / 864e5, g = (357.529 + .98560028 * d) * Math.PI / 180, q = 280.459 + .98564736 * d, L = (q + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * Math.PI / 180;
    const e = (23.439 - 3.6e-7 * d) * Math.PI / 180, dec = Math.asin(Math.sin(e) * Math.sin(L)), ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24, ha = (gmst * 15 - ra * 180 / Math.PI) * Math.PI / 180, lat = 51.4769 * Math.PI / 180;   // longitude 0
    return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) * 180 / Math.PI;
  }
  L.sunEl = sunEl;
  /* the afternoon moment nearest the clock's day when the Sun stands at the photograph's height */
  function photoHour(t0, el) {
    for (let k = 0; k < 370; k++) for (const sg of k ? [1, -1] : [1]) {
      const day = Math.floor(t0 / 864e5) + sg * k, noon = day * 864e5 + 12 * 36e5;
      if (sunEl(noon) < el) continue;
      let a = noon, b = noon + 10 * 36e5; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (sunEl(m) > el) a = m; else b = m; }
      return Math.round(a / 6e4) * 6e4;
    }
    return t0;
  }
  /* is the photograph true now? Returns {mat, key} while it is shown */
  function photoNow(s) {
    if (!PH.mode || !PH.mat) return null; const S = PHOTOS[PH.mode], el = Math.asin(Math.max(-1, Math.min(1, s.y))) * 180 / Math.PI;
    if (PH.mode === 'overcast' ? el < -2 : Math.abs(el - S.sunEl) > S.tol) return null;
    if (PH.mode === 'photo') { const rot = (PHOTOS.photo.sunU - .5) * 2 * Math.PI - Math.atan2(s.z, s.x); PH.mat.uniforms.uRot.value = PH.dome.uniforms.uRot.value = rot; return { mat: PH.mat, key: 'photo' + rot.toFixed(2) }; }
    return { mat: PH.mat, key: 'overcast' };
  }
  function photoStep() {
    if (!PH.mode || !PH.mat) return; const F = FR_park(); if (!F || !F.v2 || !F.v2.parts.sky) return;
    if (PH.mode === 'photo' && !PH.set && typeof simTime !== 'undefined') { PH.set = true; simTime = photoHour(simTime, PHOTOS.photo.sunEl); timeSpeed = 0; const b = document.querySelector('#timeS'); if (b) b.textContent = 'Paused'; }
    const sky = F.v2.parts.sky, s = parkDir(F), ok = s && photoNow(s);
    if (!PH.sky0) PH.sky0 = sky.material;
    if (!PH.copied) { PH.copied = true; for (const k of ['side', 'depthTest', 'depthWrite']) PH.dome[k] = PH.sky0[k];   // drawn exactly as the computed sky ball is,
      for (const k in PH.sky0.uniforms) if (!PH.dome.uniforms[k]) PH.dome.uniforms[k] = PH.sky0.uniforms[k]; }        // and the park's own updates (its Sun, its daylight) land in both
    const want = ok ? PH.dome : PH.sky0; if (sky.material !== want) sky.material = want;
    PH.shown = ok ? { horizon: PH.horizon, scale: PHOTOS[PH.mode].scale } : null;
    if (!PH.noteEl) { PH.noteEl = document.createElement('div'); PH.noteEl.id = 'lkSkyNote'; PH.noteEl.setAttribute('role', 'note'); document.body.appendChild(PH.noteEl); }
    const near = drawn.includes(F) && cam.D < 400, txt = ok ? PHOTOS[PH.mode].note : PH.mode === 'photo' ? 'The photographed sky is shown only when the Sun stands about 23.5° high; now the computed sky is shown.' : '';
    PH.noteEl.hidden = !(near && txt); if (PH.noteEl.textContent !== txt) PH.noteEl.textContent = txt;
  }
  /* after the park has set its Sun for the frame: under a cloudy photograph there is no direct sunlight */
  L.parkSunSet = (F, sun) => { if (PH.shown) { if (PH.mode === 'overcast') sun.intensity = 0; return; } nightStep(F, sun); };   // the key light, the sky's night and the level light (section 9)

  /* ---------- the engine's calls ---------- */
  /* at the end of Frame.ensure: the frame's rig, environment, exposure and glow, then whatever its scene needs beyond the rig */
  L.frameBuilt = F => {
    if (!F.scene) return;
    try {
      F.rig = rigOf(F); const R = F.rig && RIGS[F.rig];
      if (R) {
        if (F.exposure === undefined) F.exposure = R.exposure;
        if (F.glow === undefined) F.glow = EMITS[F.type] ? true : R.glow;
        if (P('rig')) { applyLights(F); if (F.rig === 'diagram' && PBR) flatten(F); }
        if (F.rig === 'outdoor') { const O = skyOwner(F); if (O && PBR && P('env') && O.built) skyRedraw(O, performance.now()); }
        if (PBR && P('env')) F.scene.environment = L.envFor(F);
      }
      if (DRESS[F.type]) { DRESS[F.type](F); L.dressed++; }
    } catch (e) { console.warn('look: could not dress', F.type, e && e.message); }
  };
  /* Outdoors the eye adapts. The light on a level surface (levelE, section 9: the key light's intensity x sin(elevation), the sky's share
     from SKY_E, this shader integrated at gain 0.08 by elevation in degrees, scaled below the horizon, the Moon's sky and the night's own)
     is compared with a clear June noon (1.23). By day the exposure rises by that ratio to the power 0.6 (adaptation is partial: a low
     winter Sun still looks low), up to 3 times (the Sun about 8 degrees up). Below that the eye goes on adapting, nearly as fast as the
     light falls (power 0.9): civil dusk (3 lux) shows at about a fifth of noon's brightness, a clear full-Moon night (0.2 lux) at about
     a sixth, a moonless one (0.002 lux) at about a tenth. Night stays night (dark, no Sun's shadows, the Moon's own), and a lit
     thing can still be seen, found and clicked. (At 0.82 a moonlit park was near black on a screen, and at 0.88 dusk still read as night.) */
  const SKY_E = [[-6, .004], [-3, .018], [0, .035], [3, .057], [10, .096], [23.5, .136], [40, .17], [62, .214], [90, .23]];
  const skyE = el => { for (let i = 1; i < SKY_E.length; i++) if (el <= SKY_E[i][0]) { const a = SKY_E[i - 1], b = SKY_E[i], t = Math.max(0, (el - a[0]) / (b[0] - a[0])); return a[1] + t * (b[1] - a[1]); } return SKY_E[SKY_E.length - 1][1]; };
  const ADAPT = { k: 1, at: -1 }, E1 = 1.23 / Math.pow(3, 1 / .6);
  const adaptK = E => E >= E1 ? Math.max(1, Math.min(3, Math.pow(1.23 / Math.max(E, 1e-9), .6))) : 3 * Math.pow(E1 / Math.max(E, 1e-9), .9);
  function adapt(now) {
    if (now - ADAPT.at < 200) return ADAPT.k; ADAPT.at = now; const F = FR_park(), s = F && parkSun(); if (!s) return ADAPT.k;
    const E = PH.shown ? s.sun.intensity * Math.max(0, s.dir.y) + (PH.mode === 'overcast' ? .9 : skyE(Math.asin(Math.max(-1, Math.min(1, s.dir.y))) * 180 / Math.PI)) : levelE();
    return (ADAPT.k = adaptK(E));
  }
  L.adaptation = () => ADAPT.k;
  /* the exposure for one frame's scene: the page's, times the frame's own (a studio is exposed lower than daylight), times the eye's
     adaptation outdoors on the Earth (the park, the body and things in it, the region over London) */
  const inPark = F => { const O = skyOwner(F); return !!O && O.type === 'park'; };
  const onEarthOutdoors = F => F.rig === 'outdoor' && (F.type !== 'landscape' || !F.opts.body || F.opts.body === 'Earth');
  L.exposureOf = F => FL.lookexp * (F.exposure || 1) * (onEarthOutdoors(F) ? (inPark(F) ? ADAPT.k : Math.min(3, ADAPT.k)) : 1);   // the night's adaptation is the park's (its light is worked out there): other places keep the day's range
  /* glow (bloom) is for things that emit light: the anchor frame says so, or the nearest frame above it that does */
  L.glowOf = () => { if (!P('glow') || typeof cam === 'undefined') return undefined; for (let f = cam.A; f; f = f.parent) if (f.glow !== undefined) return f.glow; return undefined; };
  /* once per drawn frame of the app: environments follow their Suns, late lights get the rig, the person's lamp, the contact shadows */
  let tEnv = 0, tLight = 0;
  L.step = now => {
    try {
      if (PBR && P('env') && now - tEnv > 250) {
        tEnv = now; let redrawn = false; const seen = new Set();
        for (const f of drawn) { const O = skyOwner(f); if (O && O.built && !seen.has(O)) { seen.add(O); if (!redrawn && skyRedraw(O, now)) redrawn = true; } }
        for (const f of drawn) if (f.built && f.scene) { const e = L.envFor(f); if (f.scene.environment !== e) f.scene.environment = e; }
      } else if (!P('env') && now - tEnv > 250) { tEnv = now; for (const f of drawn) if (f.scene && f.scene.environment) f.scene.environment = null; }
      if (P('rig') && now - tLight > 400) {
        tLight = now;
        for (const f of drawn) {
          if (!f.built || !f.rig || !RIGS[f.rig]) continue;
          if (f._lkN !== f.root.children.length) { applyLights(f); if (f.rig === 'diagram' && PBR) flatten(f); }
          else if (f.rig === 'diagram' && PBR && now - (f._lkFlatT || 0) > 1500) flatten(f);
          if (f._lkOff) for (const o of f._lkOff) if (o.visible) o.visible = false;   // a frame switched one of its lights on again (a thing leaving its parent's scene)
        }
      }
      bodyLight(); blobStep(); photoStep(); adapt(now);
      shadowCasters(now);
      const F = FR_park();
      if (F && F.scene && F.scene.fog && PBR && P('sky') && drawn.includes(F)) {   // far things take the colour of the sky at the horizon
        const s = sunOf(F); if (s) { const c = PH.shown ? L.shown(PH.shown.horizon.map(v => v * PH.shown.scale), L.exposureOf(F)) : L.horizon(s, L.exposureOf(F)); F.scene.fog.color.setRGB(c[0], c[1], c[2]); F.scene.fog.near = Math.max(40, cam.D * .6); F.scene.fog.far = Math.max(260, cam.D * 4); }
      }
    } catch (e) { if (!L._warned) { L._warned = true; console.warn('look: step', e && e.message); } }
  };
  /* LOOK.audit(): every drawn frame's rig, environment and the lights it still has on: a frame type with no rig is listed under `norig` */
  /* ---------- 9. dusk and night ----------
     Units: the park's light is in three.js units in which a clear June noon gives a level surface 1.23 (the Sun 1.015, the sky 0.21);
     that is about 103 thousand lux (direct sunlight 32 to 100 thousand lux, the clear sky 10 to 25 thousand), so 1 unit is taken as
     84 thousand lux. Measured illuminance on a level surface under a clear sky (Wikipedia, "Lux", table of examples): sunrise or sunset
     400 lux, the dark limit of civil twilight (Sun 6 degrees down) 3.4 lux, full Moon 0.05 to 0.3 lux, quarter Moon 0.01 lux, a
     moonless clear night with airglow 0.002 lux.
     - The Sun: its light falls with the air it crosses (air mass by Kasten and Young 1989; an extinction of 0.16, 0.20 and 0.28 per air
       mass in red, green and blue, clean air: these are typical values, not a measurement over London), so it reddens and dims as it sets.
       It gives no light once its top has gone below the horizon (with the bending of light, about 0.8 degrees below).
     - Twilight: the sky keeps the colours and shape it has with the Sun on the horizon, scaled to the light measured for the Sun's depth:
       400 lux at sunset and 3.4 lux at -6 degrees from the table above; between those and on to -18 degrees (the end of astronomical
       twilight, where the moonless night's 0.002 lux is all that is left) the curve is a smooth fall in the logarithm drawn through
       them, an approximation, not a measurement. From 6 degrees up to the horizon the computed sky is brought down to meet it.
     - The Moon: where it is and how bright it is for the date (astronomy-engine: GeoMoon, Illumination; its magnitude gives lux outside
       the air, 0 magnitude = 2.54 microlux), dimmed by the air like the Sun. It is the key light once the Sun has set and it is up, and
       its sky is the day's sky shape at the Moon's brightness over the Sun's (127 thousand lux): a full-Moon sky is a very dim blue.
     - The night's own light (airglow, starlight): 0.002 lux, from every direction alike. The city's own glow is not drawn: over London
       the night sky is many times brighter than this, but how much has not been measured here.
     The person and everything in the park are lit by exactly this: the old lamp that lit the person after sunset is gone. */
  const LUX = 1 / 84000, NIGHT_N = .002 * LUX, SUN_OUT = 127000, TAU_X = [.16, .20, .28];
  const TWI = [[-18, .002], [-15, .0036], [-12, .008], [-10, .06], [-8, .45], [-6, 3.4], [-5, 8], [-4, 18], [-3, 40], [-2, 90], [-1, 190], [0, 400]];
  const twiLux = h => { if (h <= TWI[0][0]) return TWI[0][1]; for (let i = 1; i < TWI.length; i++) if (h <= TWI[i][0]) { const a = TWI[i - 1], b = TWI[i], t = (h - a[0]) / (b[0] - a[0]); return Math.pow(10, Math.log10(a[1]) + t * (Math.log10(b[1]) - Math.log10(a[1]))); } return TWI[TWI.length - 1][1]; };
  const K0 = 400 * LUX / skyE(0);   // the computed sky at sunset over the measured one
  /* the scale on the Sun's sky for a Sun this high (y: the sine of its elevation): 1 from 6 degrees up, the measured twilight below the horizon (less the night's own light) */
  function twiK(y) {
    const h = Math.asin(Math.max(-1, Math.min(1, y))) * 180 / Math.PI;
    if (h >= 6) return 1; if (h >= 0) return Math.pow(K0, 1 - h / 6);
    return Math.max(0, twiLux(h) - .002) * LUX / skyE(0);
  }
  /* the air mass toward a body h degrees up (Kasten and Young 1989), and the light that crosses it, per colour */
  const airMass = h => { h = Math.max(-.5, h); return 1 / (Math.sin(h * Math.PI / 180) + .50572 * Math.pow(h + 6.07995, -1.6364)); };
  const X_NOON = airMass(62);
  const upOf = h => { const t = Math.max(0, Math.min(1, (h + 1.1) / .55)); return t * t * (3 - 2 * t); };   // its disc's top above the horizon, refraction included
  const NIGHT = { at: -1e9, sunY: 9, key: null, keyI: 0, keyCol: [1, 1, 1], moonDir: new V3(0, -1, 0), moonU: [0, 1, 0], moonW: 0, moonLux: 0, moonPhase: 0, moonEl: -90, E: 1.23 };
  const SUNCOL = new THREE.Color(0xfff1d6), _md = new V3();
  /* the Moon in frame F's coordinates and its light, for the date shown */
  function moonNow(F) {
    if (!window.Astronomy || typeof simTime === 'undefined' || typeof FR === 'undefined' || !FR.earth || typeof convertD !== 'function' || typeof eq3 !== 'function') return null;
    const d = new Date(simTime), v = Astronomy.GeoMoon(d), il = Astronomy.Illumination(Astronomy.Body.Moon, d);
    convertD(_md.copy(eq3(v.x, v.y, v.z)).normalize(), FR.earth, F).normalize();
    return { dir: _md, mag: il.mag, phase: il.phase_angle, lux: Math.pow(10, -.4 * (il.mag + 13.99)) };
  }
  /* once a park frame: the key light (the Sun, or the Moon once the Sun has set), the sky's night uniforms, the light on a level surface */
  function nightStep(F, light) {
    const p = F.v2 && F.v2.parts, sun = parkDir(F); if (!p || !sun) return;
    const now = performance.now(), hs = Math.asin(Math.max(-1, Math.min(1, sun.y))) * 180 / Math.PI;
    if (now - NIGHT.at > 1000 || Math.abs(sun.y - NIGHT.sunY) > 2e-3) {   // the Moon moves about as fast as the Sun: once a second, or when the clock jumps
      NIGHT.at = now; NIGHT.sunY = sun.y; const m = moonNow(F);
      if (m) { NIGHT.moonDir.copy(m.dir); NIGHT.moonEl = Math.asin(Math.max(-1, Math.min(1, m.dir.y))) * 180 / Math.PI; NIGHT.moonLux = m.lux; NIGHT.moonPhase = m.phase; }
      else { NIGHT.moonEl = -90; NIGHT.moonLux = 0; }
      const md = NIGHT.moonDir; if (md.y >= 0) NIGHT.moonU = [md.x, md.y, md.z]; else { const l = Math.hypot(md.x, md.z) || 1; NIGHT.moonU = [md.x / l, 0, md.z / l]; }
      NIGHT.moonW = NIGHT.moonLux / SUN_OUT * Math.max(0, Math.min(1, (NIGHT.moonEl + 6) / 6));
    }
    const ext = (h, rel) => TAU_X.map(t => Math.exp(-t * (airMass(h) - (rel ? X_NOON : 0))));
    const es = ext(hs, true), sunI = 1.15 * Math.min(1, es[1]) * upOf(hs);
    const em = ext(NIGHT.moonEl, false), moonI = NIGHT.moonLux * LUX * em[1] * upOf(NIGHT.moonEl);
    const useMoon = moonI > sunI, e = useMoon ? em : es, d = useMoon ? NIGHT.moonDir : sun;
    NIGHT.key = useMoon ? 'moon' : 'sun'; NIGHT.keyI = useMoon ? moonI : sunI;
    if (light) {
      light.intensity = NIGHT.keyI; light.color.setRGB(SUNCOL.r * Math.min(1, e[0] / e[1]), SUNCOL.g, SUNCOL.b * Math.min(1, e[2] / e[1]));
      if (useMoon) { light.position.copy(d).multiplyScalar(40).add(light.target.position); }   // (the Sun's place was set by the park; the shadow's square follows the light)
    }
    const K = twiK(sun.y), u = p.sky && p.sky.material && p.sky.material.uniforms;
    if (u) setNight(u);
    const kd = Math.max(0, d.y) * NIGHT.keyI, sky = hs >= 0 ? skyE(hs) * K : K * skyE(0), msky = NIGHT.moonW * skyE(Math.max(0, NIGHT.moonEl));
    NIGHT.E = kd + sky + msky + NIGHT_N;
  }
  /* a sky material's night uniforms for a Sun this high (sunY); noMoon: a place other than the park (its Moon is not worked out) */
  function setNight(u, sunY, noMoon) {
    const K = twiK(sunY === undefined ? NIGHT.sunY : sunY);
    if (!u.uNight || !u.uMoon) return;   // (they are given when the sky's shader is set: skyUniforms)
    u.uNight.value.set(NIGHT_N, NIGHT_N, NIGHT_N, Math.max(K, 1e-12)); u.uMoon.value.set(NIGHT.moonU[0], NIGHT.moonU[1], NIGHT.moonU[2], noMoon ? 0 : NIGHT.moonW);
  }
  L.skyNight = (u, sunY) => setNight(u, sunY, true);   // a sky over another place on the Earth (the region over London): its twilight and the night's own light
  const levelE = () => NIGHT.E;
  L.levelE = levelE;   // the light on a level patch of open ground in the park now (units above)
  L.night = () => ({ key: NIGHT.key, keyI: NIGHT.keyI, E: NIGHT.E, lux: NIGHT.E / LUX, moonEl: NIGHT.moonEl, moonPhase: NIGHT.moonPhase, moonLux: NIGHT.moonLux, adapt: ADAPT.k });
  L.key = () => { const F = FR_park(), p = F && F.v2 && F.v2.parts; if (!p || !p.sun) return null; return { dir: _v.subVectors(p.sun.position, p.sun.target.position).normalize().clone(), intensity: p.sun.intensity, color: p.sun.color.clone(), moon: NIGHT.key === 'moon' }; };
  L.audit = () => drawn.map(f => { const l = f.built ? lightsOf(f) : null, onL = l ? [...l.hemi, ...l.amb, ...l.dir, ...l.pt, ...l.spot].filter(o => o.visible) : []; return { type: f.type, name: f.name, rig: f.rig || null, env: !!(f.scene && f.scene.environment), lights: onL.map(o => o.type + ' ' + o.intensity.toFixed(2)), exposure: f.exposure, glow: f.glow }; });
  return L;
})();
