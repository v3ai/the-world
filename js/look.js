'use strict';
/* =====================================================================
   The second look (docs/DESIGN.md): a prototype, off by default.

   ?look=2                 everything below
   ?look=2&lookoff=a,b     the same without the named parts, to compare one at a time on a real GPU:
                             ui      the interface (css/look.css), figures, the ruler's tiers, the lead paragraph
                             labels  light or dark label text to suit the scene
                             pbr     linear light and sRGB output; physically based materials in place of the
                                     toon ones; no ink outlines except on the part pointed at or selected
                             tone    the filmic tone curve (ACES); without it the output is clipped at white
                             sky     the park's sky computed from the Sun's real position (Preetham's model)
                             env     image-based light: the computed sky outdoors, a studio photograph elsewhere
                             tex     photographed surface detail: lawn, oak bark, rock
                             sss     the cues of light passing through skin, leaves, petals and wax
                             rig     the light levels of the scenes the prototype has relit
                             shadow  the soft contact shadows on the lawn
                             glow    no glow on a planet seen close
   ?look=2&lookq=low       the cheap level: no surface textures, no light-through cues, no studio photograph
   ?look=2&lookexp=1.2     exposure (default 1)
   ?look=2&theme=dark      the dark tokens of the interface

   This file is loaded after every other script and before startApp(). With the flag off it defines LOOK and does
   nothing else. With it on it changes how things are drawn, never what is drawn: no geometry, no text, no data.

   THE FOUNDATION (what a scene's own code may call once this has moved into the engine):
     LOOK.env(kind)               'sky' | 'studio' -> the prefiltered environment texture for scene.environment
     LOOK.envFor(frame)           the environment that frame should have: the sky outdoors, the studio for a model, null in space
     LOOK.material(kind, color)   a MeshStandardMaterial of a named kind (LOOK.KINDS): 'skin', 'bark', 'water' ...
     LOOK.dress(material, kind)   give an existing standard material the properties of a kind
     LOOK.light(frame, rig)       'studio': set a frame's own lights to the studio rig and its environment
     LOOK.quality                 'high' | 'low'
     LOOK.part(name)              whether a part of the look is on
     LOOK.patch(material, key, fn) add a shader patch that combines with the others on that material
     LOOK.envLoad(name, file)     load and prefilter a photographed environment; LOOK.sun() the park's Sun; LOOK.lin(hex) a colour as linear light
     frame.exposure, frame.glow   a frame's own exposure factor, and whether it holds things that emit light

   How it works. three.js r128 has no colour management, and the app stores every colour as the colour to show. So:
   (1) lit built-in materials turn their finished surface colour (uniform x texture x vertex colour) from display
       values to linear light just before lighting, light adds up in linear light, the ACES curve brings it back into
       range and the renderer encodes sRGB. Unlit materials and the app's own shaders are left exactly as they were.
   (2) illoMat(), the app's one material factory for models, returns a MeshStandardMaterial of a kind chosen from the
       part it is for.
   (3) Light comes from one environment per scene: outdoors a sky computed from where the Sun really is (so it is true
       for the date and time shown), prefiltered with PMREMGenerator; elsewhere a photographed studio.
   Costs per fragment on a lit surface: one pow, the standard BRDF, two environment look-ups; on bark and rock six
   more texture reads. No render target is drawn per frame and there is no full-screen pass. The environment is
   redrawn only when the Sun has moved by about a degree.
   ===================================================================== */
const LOOK = (() => {
  const q = new URLSearchParams(location.search), on = q.get('look') === '2';
  const off = new Set((q.get('lookoff') || '').split(',').map(s => s.trim()).filter(Boolean));
  const quality = q.get('lookq') === 'low' ? 'low' : 'high';
  if (quality === 'low') ['tex', 'sss', 'studio'].forEach(k => off.add(k));
  const L = { on, quality, part: k => on && !off.has(k), dark: on && q.get('theme') === 'dark', dressed: 0, KINDS: {}, env: () => null, material: null, dress: null, light: null };
  if (!on || typeof THREE === 'undefined') return L;
  const P = L.part, root = document.documentElement;
  if (P('ui')) { root.classList.add('look2'); if (L.dark) root.classList.add('look2-dark'); }
  const _hsl = { h: 0, s: 0, l: 0 }, _c = new THREE.Color(), PBR = P('pbr');

  /* ---------- 1. the renderer: linear light, a filmic curve, sRGB out ---------- */
  const C = THREE.ShaderChunk, SL = THREE.ShaderLib;
  if (PBR) {
    const toLin = '\tdiffuseColor.rgb = pow( max( diffuseColor.rgb, vec3( 0.0 ) ), vec3( 2.2 ) );\n\ttotalEmissiveRadiance = pow( max( totalEmissiveRadiance, vec3( 0.0 ) ), vec3( 2.2 ) );\n';
    ['lights_physical_fragment', 'lights_phong_fragment', 'lights_toon_fragment'].forEach(k => { C[k] = toLin + C[k]; });
    SL.lambert.fragmentShader = SL.lambert.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + toLin);
    /* unlit materials (washes, lines, sprites, points, a picture used as a background) are written out as they were authored */
    ['basic', 'points', 'sprite', 'dashed', 'background', 'cube', 'equirect'].forEach(k => { if (SL[k]) SL[k].fragmentShader = SL[k].fragmentShader.replace('#include <tonemapping_fragment>', '').replace('#include <encodings_fragment>', ''); });
    /* the few materials that are still toon-shaded get a plain diffuse falloff in place of their four steps */
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
	vec3 lkB = lkBlend(); vec3 lkQ = lkP * LK_TRI;
	diffuseColor.rgb *= 2.0 * ( texture2D( map, lkQ.zy ).rgb * lkB.x + texture2D( map, lkQ.xz ).rgb * lkB.y + texture2D( map, lkQ.xy ).rgb * lkB.z );
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
    renderer.toneMappingExposure = +q.get("lookexp") || .9;
    if (typeof outlineAmt === 'function') window.outlineAmt = () => 0;   // no ink: an outline is left only on the part pointed at or selected, as the mark of that
  }

  /* ---------- 2. surface textures (assets/look, all CC0: see assets/ATTRIBUTION.md) ---------- */
  const TEXDIR = 'assets/look/', texLd = new THREE.TextureLoader();
  function flat(r, g, b) { const cv = document.createElement('canvas'); cv.width = cv.height = 2; const x = cv.getContext('2d'); x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, 2, 2); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
  /* a colour map as DETAIL: each channel is scaled so that its mean is one half; the shader multiplies by two. The model keeps the colour it was given and takes the photograph's variation. */
  function detailTex(file) {
    const t = flat(128, 128, 128);
    texLd.load(TEXDIR + file, src => { const im = src.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height), a = d.data, n = a.length / 4, m = [0, 0, 0]; for (let i = 0; i < a.length; i += 4) { m[0] += a[i]; m[1] += a[i + 1]; m[2] += a[i + 2]; }
      const k = m.map(v => 127.5 / Math.max(1, v / n)); for (let i = 0; i < a.length; i += 4) { a[i] = Math.min(255, a[i] * k[0]); a[i + 1] = Math.min(255, a[i + 1] * k[1]); a[i + 2] = Math.min(255, a[i + 2] * k[2]); }
      x.putImageData(d, 0, 0); t.image = cv; t.needsUpdate = true; src.dispose(); });
    return t;
  }
  function normalTex(file) { const t = flat(128, 128, 255); texLd.load(TEXDIR + file, src => { t.image = src.image; t.needsUpdate = true; }); return t; }
  const TEXSET = {}, texSet = name => TEXSET[name] || (TEXSET[name] = { map: detailTex(TEXFILES[name][0]), normalMap: normalTex(TEXFILES[name][1]), scale: TEXFILES[name][2], bump: TEXFILES[name][3] });
  const TEXFILES = {   // colour, normal (OpenGL convention), repeats per metre, strength of the normal map
    lawn: ['Grass004_color_1k.jpg', 'Grass004_normal_gl_1k.jpg', 1 / 1.4, .7],
    bark: ['jolcham_oak_bark_01_color_1k.jpg', 'jolcham_oak_bark_01_normal_gl_1k.jpg', 1 / .9, 1.1],
    rock: ['rock_boulder_dry_color_1k.jpg', 'rock_boulder_dry_normal_gl_1k.jpg', 1 / 1.2, 1],
  };

  /* ---------- 3. materials: a kind for every surface ----------
     roughness and metalness as measured ranges give them (nothing mirror-smooth but water and the eye, nothing metallic but metal);
     sss: how far the terminator wraps per channel (red furthest: blood under skin); thin: the colour and share of light that comes
     through a sheet lit from behind; tri: the photographed surface laid on from three sides. */
  const K = L.KINDS = {
    matte: { rough: .9 }, plastic: { rough: .45 }, metal: { rough: .38, metal: 1 }, glass: { rough: .06 }, chitin: { rough: .32 },
    skin: { rough: .56, sss: [.42, .17, .09] }, wet: { rough: .34, sss: [.24, .08, .05] }, muscle: { rough: .46, sss: [.2, .06, .04] },
    bone: { rough: .6 }, enamel: { rough: .22 }, horn: { rough: .42 }, eye: { rough: .07, env: 1.2 },
    fur: { rough: .95, sss: [.22, .16, .09], env: .7 }, feather: { rough: .93, sss: [.14, .1, .06], env: .6 },
    leaf: { rough: .6, sss: [.16, .2, .06], thin: [.30, .42, .09] }, petal: { rough: .52, sss: [.2, .18, .08], thin: [.42, .38, .10] },
    bark: { rough: .95, tri: 'bark' }, wood: { rough: .8 }, rock: { rough: .9, tri: 'rock' }, soil: { rough: 1 },
    fungus: { rough: .7, sss: [.26, .2, .14] }, wax: { rough: .3, sss: [.2, .08, .05] }, water: { rough: .05, env: 1.5 },
  };
  const v3 = a => `vec3( ${a.map(x => x.toFixed(3)).join(', ')} )`;
  function dress(m, kind, o) {
    const k = K[kind]; if (!m || !k || !m.isMeshStandardMaterial) return m; o = o || {};
    m.roughness = k.rough; m.metalness = k.metal || 0; m.envMapIntensity = k.env || 1; m.userData.kind = kind;
    if (P('sss')) { if (k.sss) m.defines.LK_SSS = v3(k.sss); if (k.thin) m.defines.LK_THIN = v3(k.thin); }
    if (k.tri && P('tex') && !m.map) { const s = texSet(k.tri); m.map = s.map; m.defines.LK_TRI = s.scale.toFixed(4);
      if (!o.instanced) { m.normalMap = s.normalMap; m.normalScale.set(s.bump, s.bump); } }   // an instanced part's own turn is not in the normal matrix: it takes the colour detail only
    m.needsUpdate = true; return m;
  }
  L.dress = dress;
  L.material = (kind, color, o) => { o = o || {}; const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .8, metalness: 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide }, o.extra || {})); return dress(m, kind, o); };
  /* which kind a part is, from what it is called in its data */
  function kindOf(c) {
    if (!c) return null;
    if (c.body) { const p = c.body, id = p.id || '', s = p.system === 'integumentary' || id === 'skin' ? 'skin' : (p.system || '');
      return s === 'skin' ? 'skin' : /skelet/.test(s) ? (/tooth|teeth/.test(id) ? 'enamel' : 'bone') : /musc/.test(s) ? 'muscle' : /^eye/.test(id) ? 'eye' : 'wet'; }
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
    return 'matte';
  }
  let ctx = null;   // what the material being made is for: set by the wrappers below for the length of one call
  if (PBR) {
    window.illoMat = function (color, o) {
      o = o || {}; const ex = Object.assign({}, o.extra || {});
      const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .8, metalness: 0, opacity: 1, side: o.double ? THREE.DoubleSide : THREE.FrontSide }, ex));
      let kind = null; try { kind = kindOf(ctx); } catch (e) { } if (ctx && ctx.body) ctx = null;
      if (kind) dress(m, kind, { instanced: !!(ctx && ctx.pd && ctx.pd.instances) });
      return ex.transparent ? m : opaqueUnlessFading(m);
    };
    if (typeof ThingObj !== 'undefined') { const f = ThingObj.prototype._addPart; ThingObj.prototype._addPart = function (pd) { const prev = ctx; ctx = { thing: this.def && this.def.id, pd }; try { return f.call(this, pd); } finally { ctx = prev; } }; }
    if (typeof decodePart === 'function') { const f = decodePart; window.decodePart = function (p) { ctx = { body: p }; return f.apply(this, arguments); }; }
  }

  /* ---------- 4. the sky, and light from it ----------
     Preetham, Shirley and Smits (1999), "A practical analytic model for daylight", as implemented in three.js r128 (examples/js/objects/Sky.js,
     MIT), moved into one fragment shader. It is computed from the direction of the real Sun, so the sky agrees with the date and time shown.
     It is a clear sky of moderate haze (turbidity 2.2): not today's weather. uDisc 0 leaves the Sun's disc out (the environment: the Sun is a
     light of its own); uEnv 1 fills the lower half with the light the lawn sends back up. */
  const SKY_FRAG = `uniform vec3 uSun; uniform float uDisc; uniform float uEnv; uniform float uGain; varying vec3 vD;
const float lkPi = 3.141592653589793;
const vec3 lkRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );
const vec3 lkMie = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );
float lkSunE( float c ) { return 1000.0 * max( 0.0, 1.0 - exp( - ( ( 1.6110731556870734 - acos( clamp( c, -1.0, 1.0 ) ) ) / 1.5 ) ) ); }
void main(){
  vec3 dir = normalize( vD ), sun = normalize( uSun );
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
  vec3 L0 = vec3( 0.1 ) * Fex + ( sunE * 19000.0 * Fex ) * smoothstep( 0.999956676946448, 0.999976676946448, ct ) * uDisc;
  vec3 col = pow( ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 ), vec3( 1.0 / ( 1.2 + 1.2 * sunfade ) ) ) * uGain;
  if ( uEnv > 0.5 ) col = mix( col, vec3( 0.075, 0.150, 0.030 ) * ( 0.25 + 0.9 * max( sun.y, 0.0 ) ) * ( sunE / 1000.0 ), 1.0 - smoothstep( -0.06, 0.0, dir.y ) );
  gl_FragColor = vec4( col, 1.0 );
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
  const SKY_GAIN = .5, _sun = new V3();
  const skyU = { uSun: { value: new V3(.45, .8, .4).normalize() }, uDisc: { value: 0 }, uEnv: { value: 1 }, uGain: { value: SKY_GAIN } };
  const ENV = { sky: null, studio: null, skyRT: null, pm: null, scene: null, at: new V3(9, 9, 9), t: 0 };
  function skyEnv(dir) {
    if (!ENV.pm) { ENV.pm = new THREE.PMREMGenerator(renderer); ENV.scene = new THREE.Scene();
      ENV.scene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize( position ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }', fragmentShader: SKY_FRAG }))); }
    skyU.uSun.value.copy(dir); const rt = ENV.pm.fromScene(ENV.scene, 0, .1, 100); if (ENV.skyRT) ENV.skyRT.dispose(); ENV.skyRT = rt; ENV.sky = rt.texture; ENV.at.copy(dir); ENV.t = performance.now();
  }
  if (PBR && P('env')) {
    try { skyEnv(skyU.uSun.value); } catch (e) { console.warn('look: no environment', e && e.message); }
    if (P('studio')) {   // the studio photograph arrives a moment later; until then the sky stands in, so no shader has to be built twice
      setTimeout(() => L.envLoad('studio', 'white_studio_06_1k.hdr').then(() => envAssign(true)).catch(e => console.warn('look: studio', e && e.message)), 0);
    }
  }
  L.env = kind => kind === 'sky' || !kind ? ENV.sky : (ENV[kind] || ENV.sky);   // by name; until a photographed one has arrived the sky stands in, so no shader is built twice
  /* LOOK.envLoad(name, file): a photographed environment (an equirectangular .hdr in assets/look) by name, prefiltered once and kept. Resolves to the texture. */
  const ENVP = {};
  L.envLoad = (name, file) => ENVP[name] || (ENVP[name] = new Promise((res, rej) => { const go = () => new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load(TEXDIR + file, t => { try { const e = ENV.pm.fromEquirectangular(t).texture; t.dispose(); ENV[name] = e; res(e); } catch (er) { rej(er); } }, undefined, rej);
    if (THREE.RGBELoader) go(); else { const sc = document.createElement('script'); sc.src = 'js/vendor/RGBELoader.js'; sc.onload = go; sc.onerror = rej; document.head.appendChild(sc); } }));
  L.envFor = F => { const k = envKind(F); return k ? L.env(k) : null; };   // the environment a frame should have (null in space)
  L.ready = Promise.resolve(!!ENV.sky);                                        // the first environment exists as soon as this file has run
  const OUTDOOR = { park: 1, body: 1, thing: 1 };   // what stands under the park's sky
  const STUDIO = { cell: 1, atom: 1, mol: 1, crystal: 1 };   // the scenes the prototype has relit; every other scene keeps its own lights until it is given a rig (space has no sky at all: what lights a planet is the Sun, and the far side is dark)
  const envKind = F => OUTDOOR[F.type] ? 'sky' : STUDIO[F.type] ? 'studio' : null;
  function envAssign(all) {
    if (!ENV.sky || typeof drawn === 'undefined') return;
    const list = all && typeof ROOT !== 'undefined' && ROOT ? (function walk(f, out) { out.push(f); (f.children || []).forEach(c => walk(c, out)); return out; })(ROOT, []) : drawn;
    for (const f of list) { if (!f.built || !f.scene) continue; const k = envKind(f), e = k ? L.env(k) : null; if (f.scene.environment !== e) f.scene.environment = e; }
  }
  function parkSun() { const p = typeof FR !== 'undefined' && FR.park && FR.park.built && FR.park.v2 && FR.park.v2.parts; if (!p || !p.sun) return null; return { dir: _sun.copy(p.sun.position).normalize(), day: Math.min(1, p.sun.intensity / 1.15), sun: p.sun }; }
  L.sun = () => { const s = parkSun(); return s ? { dir: s.dir.clone(), day: s.day, color: s.sun.color.clone(), intensity: s.sun.intensity } : null; };   // the park's Sun now: direction (park coordinates), how much of the day is left (0 to 1), colour, intensity
  function skyStep() {   // the environment follows the Sun: redrawn when it has moved about a degree, at most once in two seconds
    if (!PBR || !P('env') || !ENV.pm) return; const s = parkSun(); if (!s) return;
    if (ENV.at.distanceToSquared(s.dir) > 3e-4 && performance.now() - ENV.t > 2000) { try { skyEnv(s.dir); envAssign(true); } catch (e) { } }
  }

  /* ---------- 5. light: one rig per kind of scene ---------- */
  const lightsOf = F => { const r = { hemi: null, amb: null, dir: [], pt: [] }; F.root.traverse(o => { if (o.isHemisphereLight && !r.hemi) r.hemi = o; else if (o.isAmbientLight && !r.amb) r.amb = o; else if (o.isDirectionalLight) r.dir.push(o); else if (o.isPointLight) r.pt.push(o); }); return r; };
  /* Shader patches that can be combined. LOOK.patch(material, key, fn) runs fn(shader) after whatever onBeforeCompile the material already has,
     and adds key to the program's cache key, so two materials that differ only in their patches never share a program. A patch that is
     assigned to material.onBeforeCompile directly, later, replaces everything: use this instead. */
  function patch(m, key, fn) {
    if (!m || (m.userData._lkPatch || (m.userData._lkPatch = {}))[key]) return m; m.userData._lkPatch[key] = 1;
    const prev = m.onBeforeCompile, base = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r); fn.call(this, sh, r); };
    m.customProgramCacheKey = () => base + '|look:' + key; m.needsUpdate = true; return m;
  }
  L.patch = patch;
  L.lin = hex => new THREE.Color(hex).convertSRGBToLinear();   // a colour as linear light, for a shader of your own (lit built-in materials need no conversion: see the top of this file)
  /* give a lit built-in material the same share of the Sun and the sky as the park's things take (thPatch in js/things.js: the same two uniforms) */
  function scalePatch(m, uni) {
    if (!m || !(m.isMeshStandardMaterial || m.isMeshPhongMaterial || m.isMeshLambertMaterial || m.isMeshToonMaterial)) return;
    patch(m, 'share', sh => { if (sh.fragmentShader.indexOf('uThSun') >= 0 || sh.fragmentShader.indexOf('vec3 outgoingLight =') < 0) return;
      sh.uniforms.uThSun = uni.uThSun; sh.uniforms.uThSky = uni.uThSky;
      sh.fragmentShader = 'uniform float uThSun; uniform float uThSky;\n' + sh.fragmentShader.replace('vec3 outgoingLight =', 'reflectedLight.directDiffuse *= uThSun; reflectedLight.indirectDiffuse *= uThSky;\n\tvec3 outgoingLight ='); });
  }
  /* The studio: one key over the viewer's left shoulder, the photographed room for everything else. The key follows the view, as the lamp
     over a bench lights a specimen from the upper left however it is turned. */
  function studio(F, o) {
    o = o || {}; const l = lightsOf(F), key = o.key === undefined ? .62 : o.key, fill = o.fill === undefined ? .16 : o.fill;
    if (l.hemi) { l.hemi.intensity = fill; l.hemi.color.setHex(0xffffff); l.hemi.groundColor.setHex(0x8a8d92); }
    if (l.amb) { l.amb.intensity = fill; l.amb.color.setHex(0xffffff); }
    l.dir.forEach((d, i) => { d.intensity = i ? 0 : key; if (!i) d.color.setHex(0xfffaf2); });
    F.exposure = o.exposure || .8;   // the photographed room is bright: the studio is exposed a little lower than daylight
    if (F.scene && l.dir[0]) { const k = l.dir[0], v = new V3(), b0 = F.scene.onBeforeRender; F.scene.onBeforeRender = function (r, s, camera) { v.set(-.55, .62, .56).applyQuaternion(camera.quaternion).multiplyScalar(1e5); k.position.copy(v); b0.call(this, r, s, camera); }; }
    if (F.scene && PBR && P('env')) F.scene.environment = L.env('studio');
  }
  L.light = (F, rig) => { if (rig === 'studio') studio(F); };
  /* a material made to glow on a dark ground (emissive colour, a rim added to the picture as light) becomes a surface that is lit */
  function unglow(m, rough) {
    if (!m || m._lkUn) return; m._lkUn = true;
    if (m.isShaderMaterial) { if (m.blending === THREE.AdditiveBlending && m.uniforms && m.uniforms.uInt) m.uniforms.uInt.value *= .4; return; }
    if (m.emissive) m.emissive.setRGB(0, 0, 0);
    if (m.isMeshStandardMaterial) { m.roughness = rough; m.metalness = 0; if (m.color) { m.color.getHSL(_hsl); m.color.setHSL(_hsl.h, Math.min(.62, _hsl.s), Math.max(.3, Math.min(.6, _hsl.l))); } }
  }
  const DRESS = {
    park(F) {
      const c = F.v2, p = c && c.parts; if (!p) return;
      if (P('rig') && typeof TH_LIGHT !== 'undefined') F.root.traverse(o => { if (o.material && !o.isSprite) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => scalePatch(m, TH_LIGHT)); });
      if (PBR && P('rig')) { const l = lightsOf(F); if (l.hemi) l.hemi.intensity = P('env') ? .18 : .75; }   // the sky itself now lights the scene: the flat fill only lifts the deepest shade
      if (PBR && P('sky') && p.sky) {
        const m = p.sky.material; m.uniforms.uDisc = { value: 1 }; m.uniforms.uEnv = { value: 0 }; m.uniforms.uGain = { value: SKY_GAIN }; m.fragmentShader = LDF(SKY_FRAG); m.needsUpdate = true;
        const up = F.update; F.update = (dt, t) => { up(dt, t); const fog = F.scene && F.scene.fog; if (!fog) return; const s = parkSun(), day = s ? s.day : 1, k = .06 + .94 * day;   // far things take the colour of the sky at the horizon
          fog.color.setRGB(.80 * k, .86 * k, .93 * k); fog.near = Math.max(40, cam.D * .6); fog.far = Math.max(260, cam.D * 4); };
      }
      if (PBR && P('tex') && p.ground && p.ground.material) {   // the lawn: its own green, with the blades and the relief of a photographed turf
        const s = texSet('lawn'), old = p.ground.material.map, rep = 340 * s.scale, tint = new THREE.Color(.33 * 2, .50 * 2, .19 * 2);
        s.map.repeat.set(rep, rep);
        F.root.traverse(o => { const m = o.material; if (!m || Array.isArray(m) || !m.isMeshStandardMaterial || !old || m.map !== old) return;
          m.map = s.map; m.color.multiply(tint); if (o === p.ground) { m.normalMap = s.normalMap; m.normalScale.set(s.bump, s.bump); } m.roughness = .96; m.needsUpdate = true; });
      }
      if (P('shadow')) L.blobs = makeBlobs(F);
    },
    /* the person stands in the park: lit by the park's Sun and its sky, like everything else there */
    body(F) {
      if (!P('rig')) return; const l = lightsOf(F); if (!l.hemi || !l.dir[0]) return;
      l.hemi.color.setHex(0xdfe9f7); l.hemi.groundColor.setHex(0x6f7a55); l.dir[0].color.setHex(0xfff1d6);
      L.body = { F, hemi: l.hemi, key: l.dir[0], home: l.dir[0].position.clone().normalize() }; bodyLight();
    },
    cell(F) {
      if (!P('rig')) return; studio(F, { key: .7, fill: .12 }); F.illo = true;   // illo: the engine gives such a frame no glow
      const BG = 0x0d1115; F.env = Object.assign({}, F.env, { bg: BG, opaque: true }); if (F.scene.background && F.scene.background.isColor) F.scene.background.setHex(BG); if (F.scene.fog) F.scene.fog.color.setHex(BG);
      F.root.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => unglow(m, .36)); });
    },
    atom(F) { if (P('rig')) studio(F, { key: .6, fill: .3 }); },
    mol(F) { if (P('rig')) { studio(F, { key: .66, fill: .12 }); F.illo = true; } },
    crystal(F) { if (P('rig')) { studio(F, { key: .66, fill: .12 }); F.illo = true; } },
  };
  function bodyLight() {
    const b = L.body; if (!b || !b.F.built) return; const s = parkSun(), day = s ? s.day : 1, d = s && s.dir.y > .14 ? s.dir : b.home;   // a low or set Sun: the model keeps a lamp of its own, so it can still be read at night
    if (b.key.position.distanceToSquared(_sun.copy(d).multiplyScalar(40)) > 1e-3) b.key.position.copy(_sun);
    if (PBR) { b.key.intensity = .30 + .56 * day; b.hemi.intensity = P('env') ? .10 : .45; }
    else { b.key.intensity = .44 + .20 * day; b.hemi.intensity = .36 + .16 * day; }
  }
  /* soft contact shadows: one instanced quad for everything that stands on the lawn and does not cast into the Sun's shadow map */
  function makeBlobs(F) {
    const spots = [[0, 0, .27]], R = { dog: .36, mushroom: .09, boulder: .6, flower: .045, grass: .11 };
    (FR.things || []).forEach(t => { const r = R[t.opts && t.opts.thing]; if (r && t.pos) spots.push([t.pos.x, t.pos.z, r]); });
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.62)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv), geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0b140c, alphaMap: tex, transparent: true, opacity: BLOB, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const m = new THREE.InstancedMesh(geo, mat, spots.length); m.frustumCulled = false; m.renderOrder = 1; m.userData.noPick = true;
    F.root.add(m); return { m, spots, M: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new V3(), p: new V3(), last: new V3(9, 9, 9) };
  }
  const BLOB = PBR ? .3 : .34;
  function blobStep() {
    const b = L.blobs, s = parkSun(); if (!b || !s || !b.m.parent) return; if (b.last.distanceToSquared(s.dir) < 1e-5) return; b.last.copy(s.dir);
    const hx = -s.dir.x, hz = -s.dir.z, hl = Math.hypot(hx, hz) || 1, low = 1 - Math.min(1, Math.max(.2, s.dir.y)), a = Math.atan2(hx, hz);
    b.q.setFromAxisAngle(b.p.set(0, 1, 0), a);
    b.spots.forEach((sp, i) => { const r = sp[2], off = r * (.25 + .9 * low);   // the shadow leans away from the Sun, further as the Sun gets low
      b.p.set(sp[0] + hx / hl * off, .012, sp[1] + hz / hl * off); b.s.set(r * 2.1, 1, r * (2.1 + 2.4 * low)); b.M.compose(b.p, b.q, b.s); b.m.setMatrixAt(i, b.M); });
    b.m.instanceMatrix.needsUpdate = true; b.m.material.opacity = BLOB * Math.max(0, Math.min(1, s.day)) * (s.dir.y > 0 ? 1 : 0);
  }

  /* dress a frame once, when it is built: its environment, and its rig if the prototype has one for it */
  const ensure0 = Frame.prototype.ensure;
  Frame.prototype.ensure = function () {
    const was = this.built; ensure0.call(this);
    if (was || !this.built) return;
    try { if (PBR && P('env') && this.scene) { const k = envKind(this); if (k) this.scene.environment = L.env(k); }
      if (PBR && this.scene && !this.scene._lkExp) { const F = this, sc = this.scene; sc._lkExp = 1; let e0 = 1; const b0 = sc.onBeforeRender, a0 = sc.onAfterRender;   // frame.exposure: a factor on the exposure, for this frame's scene only
        sc.onBeforeRender = function (r, s, c) { e0 = r.toneMappingExposure; if (F.exposure) r.toneMappingExposure = e0 * F.exposure; b0.call(this, r, s, c); };
        sc.onAfterRender = function (r, s, c) { a0.call(this, r, s, c); r.toneMappingExposure = e0; }; }
      if (DRESS[this.type]) { DRESS[this.type](this); L.dressed++; } } catch (e) { console.warn('look: could not dress', this.type, e && e.message); }
  };

  /* ---------- 4. labels: paper on a dark scene, ink on a light one ---------- */
  const lumOf = hex => { _c.set(hex); return .2126 * _c.r + .7152 * _c.g + .0722 * _c.b; };
  function sceneIsLight() {
    if (typeof cam === 'undefined' || !cam.A || typeof chainOf !== 'function') return false;
    const f = cam.A, ch = chainOf(f), s = parkSun();
    if (typeof FR !== 'undefined' && FR.park && ch.includes(FR.park) && cam.D < 300 && (f === FR.park || f === FR.body || f.type === 'thing')) return !!s && s.day > .5;
    const bg = f.scene && f.scene.background && f.scene.background.isColor ? f.scene.background.getHex() : f.env && f.env.opaque && f.env.bg !== undefined ? f.env.bg : null;
    return bg !== null && lumOf(bg) > .55;
  }

  /* ---------- 5. the interface: the ruler's tiers, the lead paragraph, figures on a plate ---------- */
  function rulerTiers() {
    if (typeof LANDMARKS === 'undefined') return; const leads = document.querySelectorAll('#ruler svg .lead'), els = [...document.querySelectorAll('#rulerScale .lm')];
    els.forEach((el, i) => { const Lm = LANDMARKS.find(l => l._el === el), side = !!(Lm && Lm.side), near = el.classList.contains('near'); el.classList.toggle('lk-side', side && !near);
      if (leads[i]) { leads[i].classList.toggle('lk-side', side && !near); leads[i].classList.toggle('lk-near', near); } });
  }
  function cardLead() {   // the first paragraph of a card, where it is one bold sentence, is set as a lead: larger, not bolder
    const p = document.querySelector('#info .lay .body > p:first-child'); if (!p || p.classList.contains('lk-lead')) return;
    if (p.childNodes.length === 1 && p.firstChild.nodeName === 'B') p.classList.add('lk-lead');
  }
  /* Figures (js/viz.js) are drawn for a dark screen. Until the renderer has themes of its own, the colours it asks for are
     translated on their way to the canvas: each named ink to its counterpart for a light plate, light text to ink, dark
     backings to paper. Only canvases made while a figure is being built are touched. */
  const FIG = { '#6ee7ff': '#1e4e8f', '#ffd166': '#96690a', '#ff8fb1': '#b4412f', '#9be37b': '#3f7a3a', '#b388ff': '#6b4a9c', '#ffa94d': '#a8561a', '#ff6b6b': '#b4412f', '#5b9cff': '#1f7a78',
    '#e8ecf5': '#16191d', '#c5cde0': '#3b424a', '#98a2b8': '#5d6670', '#5d6780': '#5d6670', '#fff': '#16191d', '#ffffff': '#16191d', '#26304a': '#dfe3e2', '#1a1300': '#ffffff' };
  const FIG_DARK = { '#6ee7ff': '#8db8f2', '#ffd166': '#e2b659', '#ff8fb1': '#f0907c', '#9be37b': '#93c98a', '#b388ff': '#b9a0e6', '#ffa94d': '#eaa56b', '#ff6b6b': '#f0907c', '#5b9cff': '#74cfc9' };
  const figMemo = new Map();
  function figColor(v) {
    if (typeof v !== 'string') return v; let r = figMemo.get(v); if (r !== undefined) return r; if (figMemo.size > 1500) figMemo.clear(); const s = v.trim().toLowerCase(); r = v;
    if (L.dark) r = FIG_DARK[s] || v;
    else if (FIG[s]) r = FIG[s];
    else { const m = s.match(   // only washes and backings (colours with an alpha) are translated here; a plain rgb() is a value on a colour scale and is data
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
      if (m && m[4] !== undefined) { const R = +m[1], G = +m[2], B = +m[3], a = +m[4], lum = (.2126 * R + .7152 * G + .0722 * B) / 255;
        if (lum > .8) r = `rgba(22,25,29,${Math.min(1, a * 1.7).toFixed(3)})`;                       // white lines and washes become ink
        else if (lum < .12) r = `rgba(250,251,250,${Math.min(1, a).toFixed(3)})`;                    // dark backings become the plate
        else if (R > 240 && G > 190 && B < 130) r = `rgba(150,105,10,${a})`; }                       // the gold of a live value
      else if (/^#[0-9a-f]{6}$/.test(s)) { _c.set(s).getHSL(_hsl); if (_hsl.l > .62) r = '#' + new THREE.Color().setHSL(_hsl.h, Math.min(1, _hsl.s * .9), .34).getHexString(); } }   // any other pale ink is deepened to read on the plate
    figMemo.set(v, r); return r;
  }
  const figFont = f => typeof f === 'string' ? f.replace(/"Space Grotesk"(,\s*monospace)?|Inter(,\s*sans-serif)?/g, "-apple-system, BlinkMacSystemFont, 'IBM Plex Sans', 'Segoe UI', sans-serif") : f;
  let figNow = false;
  function figDress(ctx) {
    const proto = CanvasRenderingContext2D.prototype;
    ['fillStyle', 'strokeStyle'].forEach(k => { const d = Object.getOwnPropertyDescriptor(proto, k); Object.defineProperty(ctx, k, { get() { return d.get.call(this); }, set(v) { d.set.call(this, figColor(v)); }, configurable: true }); });
    const fd = Object.getOwnPropertyDescriptor(proto, 'font'); Object.defineProperty(ctx, 'font', { get() { return fd.get.call(this); }, set(v) { fd.set.call(this, figFont(v)); }, configurable: true });
  }

  /* ---------- hooks that need the rest of the app: wired on the first tick ---------- */
  function wire() {
    /* glow is for things that shine. A planet seen close is lit, not shining: with the glow on, its sunlit clouds and deserts burn out. */
    if (P('glow') && typeof bloomTarget === 'function') { const f = bloomTarget; window.bloomTarget = function () { const A = cam.A, f0 = drawn[0]; if (f0 && f0.glow !== undefined && f0.alpha > .995) return f0.glow ? .55 : 0;   /* frame.glow: a scene says whether it holds things that emit light */ if (A && (A.type === 'earth' || A.type === 'planet') && cam.D < 1.5e8) return 0; return f(); }; }
    if (P('ui')) {
      if (typeof buildRuler === 'function') { const f = buildRuler; window.buildRuler = function () { const r = f.apply(this, arguments); rulerTiers(); return r; }; if (f._ro) window.buildRuler._ro = f._ro; rulerTiers(); }
      if (typeof openPanel === 'function') { const f = openPanel; window.openPanel = function () { const r = f.apply(this, arguments); try { cardLead(); } catch (e) { } return r; }; }
      if (typeof renderViz === 'function') {
        const gc = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type) { const ctx = gc.apply(this, arguments); if (figNow && type === '2d' && ctx && !ctx._lk) { ctx._lk = true; figDress(ctx); } return ctx; };
        const f = renderViz; window.renderViz = function () { figNow = true; try { return f.apply(this, arguments); } finally { figNow = false; } };
        if (window.VIZX) window.VIZX.renderViz = window.renderViz;
      }
    }
  }
  let wired = false, lastNear = null;
  function tick() {
    if (!wired && typeof LANDMARKS !== 'undefined' && typeof cam !== 'undefined' && cam.A) { wired = true; try { wire(); } catch (e) { console.warn('look: wire', e && e.message); } }
    try {
      skyStep(); envAssign(false); bodyLight(); blobStep();
      if (P('labels') && P('ui')) document.body.classList.toggle('lk-day', sceneIsLight());
      if (P('ui') && wired) { const n = document.querySelector('#rulerScale .lm.near'); if (n !== lastNear) { lastNear = n; rulerTiers(); } }
    } catch (e) { /* the look must never stop the app */ }
  }
  L.tick = tick; L.timer = setInterval(tick, 300);
  return L;
})();
