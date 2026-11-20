'use strict';
/* =====================================================================
   The second look (docs/DESIGN.md): a prototype, off by default.

   ?look=2                 everything below
   ?look=2&lookoff=a,b     the same without the named parts, to compare one at a time on a real GPU:
                             ui      the interface (css/look.css), figures, the ruler's tiers, the lead paragraph
                             ramp    the shading ramp of every illustrated material (a soft terminator and a cool shadow)
                             rim     the light on the rim of the lit side
                             tone    the tone curve (a soft shoulder in place of clipping)
                             ink     thinner outlines in a darker shade of the part's own colour
                             rig     the light levels: the park's own surfaces, the body, the cell, the atom
                             sky     the park's sky and haze
                             shadow  the soft contact shadows on the lawn
                             labels  light or dark label text to suit the scene
                             glow    no glow on a planet seen close
   ?look=2&theme=dark      the dark tokens of the interface

   This file is loaded after every other script and before startApp(). With the flag off it defines LOOK and does
   nothing else. With it on, it changes how things are drawn, never what is drawn: no geometry, no text, no data.
   It works by (1) replacing two three.js shader chunks before any program is compiled, (2) wrapping the global
   functions that make outline materials, and (3) dressing a frame's lights when the frame is built.
   Costs, per fragment: the ramp replaces a texture read with two smoothsteps; the rim adds one pow per light; the tone
   curve adds one exp. No render target, no full-screen pass, one extra draw call (the contact shadows).
   ===================================================================== */
const LOOK = (() => {
  const q = new URLSearchParams(location.search), on = q.get('look') === '2';
  const off = new Set((q.get('lookoff') || '').split(',').map(s => s.trim()).filter(Boolean));
  const L = { on, part: k => on && !off.has(k), dark: on && q.get('theme') === 'dark', dressed: 0 };
  if (!on || typeof THREE === 'undefined') return L;
  const P = L.part, root = document.documentElement;
  if (P('ui')) { root.classList.add('look2'); if (L.dark) root.classList.add('look2-dark'); }

  /* ---------- 1. shading: the ramp, the rim, the tone curve (three.js r128 shader chunks) ---------- */
  const C = THREE.ShaderChunk;
  if (P('ramp')) {
    /* MeshToonMaterial looks its light up at dot(n, l) through this function. The engine's ramp was four hard steps of grey.
       This one has three zones with drawn edges: a shadow that turns cool instead of only dark, a half tone, and a warm light. */
    C.gradientmap_pars_fragment = `#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float d = dot( normal, lightDirection );
	float lit = smoothstep( -0.14, 0.18, d );
	float top = smoothstep( 0.38, 0.92, d );
	vec3 shade = vec3( 0.60, 0.635, 0.74 );
	vec3 mid = vec3( 0.87, 0.875, 0.885 );
	vec3 full = vec3( 1.0, 0.985, 0.955 );
	return mix( shade, mix( mid, full, top ), lit );
}`;
  }
  if (P('rim')) {
    C.lights_toon_pars_fragment = C.lights_toon_pars_fragment.replace(
      'vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;',
      `vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
	float lkRim = pow( 1.0 - saturate( dot( geometry.normal, geometry.viewDir ) ), 3.0 ) * smoothstep( -0.25, 0.55, dot( geometry.normal, directLight.direction ) );
	irradiance += directLight.color * lkRim * 0.20;`);
  }
  if (P('tone')) {
    /* The app's colours are authored as the colours to show, and the renderer writes them out unchanged (LinearEncoding), so
       a film curve made for linear light would grey them. This curve leaves everything below the knee exactly as it was
       and bends what is above it toward white; where a colour is far over, it gives up a little saturation instead of
       sliding toward yellow, which is what clipping one channel at a time does. */
    C.tonemapping_pars_fragment = C.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',
      `vec3 CustomToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	const float k = 0.80;
	vec3 over = max( color - k, 0.0 );
	vec3 bent = k + ( 1.0 - k ) * ( 1.0 - exp( - over / ( 1.0 - k ) ) );
	vec3 o = mix( color, bent, step( k, color ) );
	float m = max( max( color.r, color.g ), color.b );
	return mix( o, vec3( dot( o, vec3( 0.2126, 0.7152, 0.0722 ) ) ), 0.30 * smoothstep( 1.0, 1.9, m ) );
}`);
    renderer.toneMapping = THREE.CustomToneMapping;
  }

  /* ---------- 2. line: thinner, and in a darker shade of the part it bounds ---------- */
  const INK = 0x1a1f2b, _hsl = { h: 0, s: 0, l: 0 }, _c = new THREE.Color();
  function tintOf(hex) {   // the line colour for a fill: the same hue, deeper and darker; a white or grey fill keeps the ink
    _c.set(hex).getHSL(_hsl); if (_hsl.s < .08) return new THREE.Color(INK);
    return new THREE.Color().setHSL(_hsl.h, Math.min(1, _hsl.s * 1.05 + .08), Math.max(.07, _hsl.l * .30));
  }
  function inkPatch(m) {
    if (!m || !m.uniforms || !m.uniforms.uColor || m.uniforms.uTint) return m;
    m.uniforms.uTint = { value: new THREE.Color(INK) }; m.uniforms.uW.value *= .62;
    m.fragmentShader = m.fragmentShader.replace('uniform vec3 uColor;', 'uniform vec3 uColor; uniform vec3 uTint;')
      .replace('gl_FragColor=vec4(uColor,uOpacity);', 'gl_FragColor=vec4(mix(uColor,uTint,step(distance(uColor,vec3(0.10196,0.12157,0.16863)),0.02)),uOpacity);');   // a highlight colour set by the frame passes through untouched
    return m;
  }
  if (P('ink')) {
    const wrapMat = name => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function () { return inkPatch(f.apply(this, arguments)); }; };
    const wrapMk = name => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function (geo, color, o) {
      const g = f.apply(this, arguments), ol = g && g.userData && g.userData.ol;
      if (ol && ol.material.uniforms && ol.material.uniforms.uTint && !(o && (o.ink !== undefined || o.vc))) ol.material.uniforms.uTint.value.copy(tintOf(color));
      return g; }; };
    wrapMat('outlineMat'); wrapMat('thOutlineMat'); wrapMk('inked'); wrapMk('thInked');
  }

  /* ---------- 3. light: one rig per kind of scene, levels that add up to white and no more ---------- */
  const lightsOf = F => { const r = { hemi: null, amb: null, dir: [], pt: [] }; F.root.traverse(o => { if (o.isHemisphereLight && !r.hemi) r.hemi = o; else if (o.isAmbientLight && !r.amb) r.amb = o; else if (o.isDirectionalLight) r.dir.push(o); else if (o.isPointLight) r.pt.push(o); }); return r; };
  /* scale the light a lit built-in material receives (the same patch the park's things have: thPatch in js/things.js, and the same two uniforms) */
  function scalePatch(m, uni) {
    if (!m || m._lkScaled || !(m.isMeshStandardMaterial || m.isMeshPhongMaterial || m.isMeshLambertMaterial || m.isMeshToonMaterial)) return;
    m._lkScaled = true; const prev = m.onBeforeCompile, key = prev ? prev.toString() : '';
    m.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      if (sh.fragmentShader.indexOf('uThSun') >= 0 || sh.fragmentShader.indexOf('vec3 outgoingLight =') < 0) return;
      sh.uniforms.uThSun = uni.uThSun; sh.uniforms.uThSky = uni.uThSky;
      sh.fragmentShader = 'uniform float uThSun; uniform float uThSky;\n' + sh.fragmentShader.replace('vec3 outgoingLight =', 'reflectedLight.directDiffuse *= uThSun; reflectedLight.indirectDiffuse *= uThSky;\n\tvec3 outgoingLight =');
    };
    m.customProgramCacheKey = () => 'lk-scale|' + key; m.needsUpdate = true;
  }
  const SKY_HOR = [.86, .90, .93];
  const DRESS = {
    /* daylight: the Sun and the sky are the scene's own; what was wrong is that the lawn took them at full strength (1.15 + 0.75) while
       the things standing on it take 0.75 and 0.55 of them. Everything in the park now takes the same share. */
    park(F) {
      const c = F.v2, p = c && c.parts; if (!p) return;
      if (P('rig') && typeof TH_LIGHT !== 'undefined') F.root.traverse(o => { if (o.material && !o.isSprite) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => scalePatch(m, TH_LIGHT)); });
      if (P('sky') && p.sky) {
        /* a quiet sky: deep only overhead, pale and wide at the horizon as a real sky is, dithered so the gradient does not band */
        p.sky.material.fragmentShader = LDF(`uniform vec3 uSun; uniform float uDay; varying vec3 vD;
void main(){ vec3 d=normalize(vD); float h=max(d.y,0.);
  vec3 zen=vec3(.27,.47,.80), mid=vec3(.55,.72,.90), hor=vec3(${SKY_HOR.join(',')});
  vec3 c=mix(hor,mid,smoothstep(0.,.24,h)); c=mix(c,zen,smoothstep(.16,.95,h));
  float s=max(dot(d,uSun),0.); c+=vec3(1.,.93,.78)*pow(s,300.)*1.4+vec3(1.,.9,.72)*pow(s,8.)*.14;
  if(d.y<0.) c=hor; c*=mix(vec3(.03,.04,.09),vec3(1.),uDay);
  c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
  gl_FragColor=vec4(c,1.); }`);
        p.sky.material.needsUpdate = true;
        const up = F.update;
        F.update = (dt, t) => { up(dt, t); const fog = F.scene && F.scene.fog; if (!fog) return; const day = p.sky.material.uniforms.uDay.value, k = .08 + .92 * day;   // far things take the colour of the sky at the horizon
          fog.color.setRGB(SKY_HOR[0] * k, SKY_HOR[1] * k, SKY_HOR[2] * (.1 + .9 * day)); fog.near = Math.max(28, cam.D * .6); fog.far = Math.max(200, cam.D * 4); };
      }
      if (P('shadow')) L.blobs = makeBlobs(F);
    },
    /* the person stands in the park: by day the key light is the park's Sun, so the figure and the trees agree; the fill is the sky above and the lawn below */
    body(F) {
      if (!P('rig')) return; const l = lightsOf(F); if (!l.hemi || !l.dir[0]) return;
      l.hemi.color.setHex(0xe6eefa); l.hemi.groundColor.setHex(0x7f8468); l.dir[0].color.setHex(0xfff3e2);
      L.body = { F, hemi: l.hemi, key: l.dir[0], home: l.dir[0].position.clone().normalize() }; bodyLight();
    },
    /* a schematic scene: a key over the viewer's left shoulder, a broad fill, and a ground that says "this is a drawing" */
    cell(F) { if (!P('rig')) return; studio(F, { hemi: .50, key: .52, back: 0, sky: 0xf6f7f8, ground: 0x8d9096 }); plate(F); F.root.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(reink); }); },
    atom(F) { if (P('rig')) studio(F, { amb: .50, key: .52 }); },
    /* ball-and-stick models: their two lights added up to 2.2, which burned every atom to white and lost the element colours the note beside them promises */
    mol(F) { if (!P('rig')) return; studio(F, { hemi: .46, key: .56, sky: 0xf2f5fa, ground: 0x6c7078 }); F.illo = true; },
    crystal(F) { if (!P('rig')) return; studio(F, { hemi: .46, key: .56, sky: 0xf2f5fa, ground: 0x6c7078 }); F.illo = true; },
  };
  /* A plate: the ground of a schematic picture. Paper, not space: nothing glows on it and nothing fades into darkness. */
  const PLATE = 0xe6e8e8;
  function plate(F) {
    F.illo = true; F.env = Object.assign({}, F.env, { bg: PLATE, opaque: true });   // illo: the engine gives an illustrated frame no glow
    if (F.scene.background && F.scene.background.isColor) F.scene.background.setHex(PLATE);
    if (F.scene.fog) F.scene.fog.color.setHex(PLATE);
  }
  /* Re-ink a material made for a dark, glowing scene so that it reads on a plate: matte, no light of its own, the same hue at a
     middle value. A rim that was added to the picture as light becomes a tinted, see-through edge. */
  function reink(m) {
    if (!m || m._lkInk) return; m._lkInk = true;
    if (m.isShaderMaterial) {
      if (m.blending === THREE.AdditiveBlending && m.uniforms && m.uniforms.uColor && m.uniforms.uColor.value.isColor) {
        m.uniforms.uColor.value.getHSL(_hsl); m.uniforms.uColor.value.setHSL(_hsl.h, Math.min(.6, _hsl.s), Math.min(.40, _hsl.l));
        m.blending = THREE.NormalBlending; m.premultipliedAlpha = true; m.needsUpdate = true;
      }
      return;
    }
    if (!m.color) return; m.color.getHSL(_hsl);
    if (m.isMeshBasicMaterial && m.transparent && _hsl.l < .25) { m.color.setHSL(_hsl.h, .25, .86); return; }                 // the dark wash that stood for cytoplasm: a pale one
    if (m.isLineBasicMaterial || m.isPointsMaterial) { m.color.setHSL(_hsl.h, Math.min(.4, _hsl.s), Math.min(.36, _hsl.l)); m.opacity = Math.min(1, m.opacity * 2.2); return; }
    m.color.setHSL(_hsl.h, Math.min(.58, _hsl.s * .8), Math.max(.36, Math.min(.56, _hsl.l)));
    if (m.emissive) m.emissive.setRGB(0, 0, 0);
    if (m.roughness !== undefined) { m.roughness = .88; m.metalness = 0; }
  }
  function studio(F, o) {
    const l = lightsOf(F);
    if (l.hemi && o.hemi !== undefined) { l.hemi.intensity = o.hemi; if (o.sky) l.hemi.color.setHex(o.sky); if (o.ground) l.hemi.groundColor.setHex(o.ground); }
    if (l.amb && o.amb !== undefined) { l.amb.intensity = o.amb; l.amb.color.setHex(0xffffff); }
    if (l.dir[0]) { l.dir[0].intensity = o.key; l.dir[0].color.setHex(0xfffaf2); }
    if (l.dir[1]) l.dir[1].intensity = o.back !== undefined ? o.back : l.dir[1].intensity;
    /* the key follows the viewer (over the left shoulder), as a lamp on the drawing board lights a drawing from the upper left whichever way it is turned */
    if (l.dir[0] && F.scene) { const key = l.dir[0], v = new V3(); F.scene.onBeforeRender = (r, s, camera) => { v.set(-.55, .62, .56).applyQuaternion(camera.quaternion).multiplyScalar(1e5); key.position.copy(v); }; }
  }
  const _sun = new V3();
  function parkSun() { const p = typeof FR !== 'undefined' && FR.park && FR.park.built && FR.park.v2 && FR.park.v2.parts; if (!p || !p.sun) return null; return { dir: _sun.copy(p.sun.position).normalize(), day: Math.min(1, p.sun.intensity / 1.15) }; }
  function bodyLight() {
    const b = L.body; if (!b || !b.F.built) return; const s = parkSun(), day = s ? s.day : 1, d = s && s.dir.y > .14 ? s.dir : b.home;   // a low or set Sun: the model keeps a lamp of its own, so it can still be read at night
    if (b.key.position.distanceToSquared(_sun.copy(d).multiplyScalar(40)) > 1e-3) b.key.position.copy(_sun);
    b.key.intensity = .44 + .20 * day; b.hemi.intensity = .36 + .16 * day;
  }
  /* soft contact shadows: one instanced quad for everything that stands on the lawn and does not cast into the Sun's shadow map */
  function makeBlobs(F) {
    const spots = [[0, 0, .27]], R = { dog: .36, mushroom: .09, boulder: .6, flower: .045, grass: .11 };
    (FR.things || []).forEach(t => { const r = R[t.opts && t.opts.thing]; if (r && t.pos) spots.push([t.pos.x, t.pos.z, r]); });
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.62)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv), geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0f1c10, alphaMap: tex, transparent: true, opacity: .34, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const m = new THREE.InstancedMesh(geo, mat, spots.length); m.frustumCulled = false; m.renderOrder = 1; m.userData.noPick = true;
    F.root.add(m); return { m, spots, M: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new V3(), p: new V3(), last: new V3(9, 9, 9) };
  }
  function blobStep() {
    const b = L.blobs, s = parkSun(); if (!b || !s || !b.m.parent) return; if (b.last.distanceToSquared(s.dir) < 1e-5) return; b.last.copy(s.dir);
    const k = FR.park.v2 ? FR.park.v2.k || 1 : 1, hx = -s.dir.x, hz = -s.dir.z, hl = Math.hypot(hx, hz) || 1, low = 1 - Math.min(1, Math.max(.2, s.dir.y)), a = Math.atan2(hx, hz);
    b.q.setFromAxisAngle(b.p.set(0, 1, 0), a);
    b.spots.forEach((sp, i) => { const r = sp[2], off = r * (.25 + .9 * low);   // the shadow leans away from the Sun, further as the Sun gets low
      b.p.set(sp[0] + hx / hl * off, .012, sp[1] + hz / hl * off); b.s.set(r * 2.5, 1, r * (2.5 + 2.4 * low)); b.M.compose(b.p, b.q, b.s); b.m.setMatrixAt(i, b.M); });
    b.m.instanceMatrix.needsUpdate = true; b.m.material.opacity = .34 * Math.max(0, Math.min(1, s.day)) * (s.dir.y > 0 ? 1 : 0);
  }

  /* dress a frame once, when it is built */
  const ensure0 = Frame.prototype.ensure;
  Frame.prototype.ensure = function () {
    const was = this.built; ensure0.call(this);
    if (!was && this.built && DRESS[this.type]) { try { DRESS[this.type](this); L.dressed++; } catch (e) { console.warn('look: could not dress', this.type, e && e.message); } }
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
    if (P('glow') && typeof bloomTarget === 'function') { const f = bloomTarget; window.bloomTarget = function () { const A = cam.A; if (A && (A.type === 'earth' || A.type === 'planet') && cam.D < 1.5e8) return 0; return f(); }; }
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
      bodyLight(); blobStep();
      if (P('labels') && P('ui')) document.body.classList.toggle('lk-day', sceneIsLight());
      if (P('ui') && wired) { const n = document.querySelector('#rulerScale .lm.near'); if (n !== lastNear) { lastNear = n; rulerTiers(); } }
    } catch (e) { /* the look must never stop the app */ }
  }
  L.tick = tick; L.timer = setInterval(tick, 300);
  return L;
})();
