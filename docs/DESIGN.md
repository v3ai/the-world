# Design system

This is how The World looks and why. It is written so that someone who has never seen the app can apply it, and so that a reviewer can check a screen against it. The first rule of the app stands above everything here: it tells the truth. Design serves that rule. A picture that looks better and says something false is a fault.

The system exists in two forms today:

- **This document**, which is the specification.
- **A prototype**, `css/look.css` and `js/look.js`, switched on with `?look=2` in the address and off by default. It applies the interface to the start view, a card and its figure, the lists, search and the ruler, and the realistic picture to the park, the body, the park's things, the cell, the atom's models, molecules and crystals. The rollout plan at the end moves it, part by part, into the engine and the main stylesheet. `?look=2&lookoff=tex,sss` switches named parts off again so that each can be judged alone on a real graphics card (the list is at the top of `js/look.js`); `?look=2&lookq=low` is the cheap level; `?look=2&theme=dark` shows the dark interface.

Values in this document are the values in the prototype. Where the two differ, the document is right and the prototype is wrong.

## Contents

1. Principles
2. Interface
3. The picture: realism
4. Figures and diagrams
5. Rollout plan
6. Before you merge

---

## 1. Principles

### 1. The world is the subject

The scene is what people came for. The interface is its margin: neutral in colour, at the edges, and able to get out of the way.

- **Do:** put controls on small light surfaces at the edges of the scene, and let the panel fold to a tab. The only saturated colours on the chrome are the accent (what can be pressed) and the index (where you are).
- **Don't:** put a dark, glowing figure box inside a card, or a panel of controls four rows deep over the atom. Anything louder than the scene is in the wrong place.

### 2. One of each

One panel to read in. One accent. One index colour. Three kinds of button. One segmented control. One type scale. One light for each kind of scene. One table of materials. When a second version of a thing appears, one of the two is a mistake.

- **Do:** use the segmented control for the body's layers, a card's Basics, Deeper and Expert, and the meter's switches alike.
- **Don't:** ship the start view with seven visibly different buttons, or give each new scene its own lights and hand-made materials.

### 3. Type and space first, lines and boxes last

Order of importance is shown by size, weight and distance. A rule or a box is used only where those are not enough, and a box never gets both a border and a shadow.

- **Do:** set a card as a title, one lead sentence, then reading text, with sections parted by space and one hairline.
- **Don't:** put a coloured bar down the left edge of a paragraph to make it a "note", or bold a whole sentence at body size.

### 4. Real to look at, honest about what it is

Scenes are drawn as real as light, material and photographed surfaces can make them. That is a way of drawing and never a claim. A thing with an appearance (the park, a body, a planet) is shown in the light it really has. A thing with none (a cell's colours, a molecule's balls, a proton) is shown as a physical model in a studio, or as a plain diagram, and the first word of its note says which: *Model*, *Diagram*. The better a render looks, the more plainly the screen must say what in it is measured, what is typical, and what is convention.

- **Do:** light the cell like a specimen on a bench, begin its note with "Model", and name its colours as a code.
- **Don't:** give quarks a glossy highlight, set a molecule against a sky, or scatter specks round the DNA for atmosphere. Each of these says something untrue.

### 5. Nothing clips, nothing floats, nothing jumps

Light is added in linear light and brought into range by one filmic curve, so a colour that was chosen is the colour that is shown. Everything that stands on a surface is joined to it by a shadow. Far things take the colour of the air. Motion eases, can always be interrupted, and stops.

- **Do:** light a scene with one environment and one key, and put a soft shadow under the person on the lawn.
- **Don't:** add a second light "to brighten it up". The lawn was lime green because its lights summed to 1.9 and clipped.

---

## 2. Interface

### 2.1 Type

**Families.** Two, each with a job.

| role | stack | notes |
|---|---|---|
| serif: titles and reading text | `ui-serif, 'Source Serif 4', 'Source Serif Pro', 'Iowan Old Style', Georgia, serif` | `ui-serif` gives the platform's own serif where the browser supports the keyword; everywhere else Source Serif 4 (SIL Open Font Licence) |
| sans: controls, labels, numbers | `-apple-system, BlinkMacSystemFont, 'IBM Plex Sans', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif` | the platform's own sans on Apple systems; everywhere else IBM Plex Sans (SIL Open Font Licence) |

Platform fonts are reached only through these CSS keywords, which use what is already installed on the reader's machine. They are never downloaded, copied or shipped: their licences do not allow it. The two open families are to be self-hosted from `assets/fonts` (rollout step 14); until then they come from Google Fonts as now. No third family. `js/viz.js` currently asks for Inter and Space Grotesk, which are not loaded; that is a fault (step 13).

Because the fallback faces differ in width, never set a control to a width that only fits one of them. Check a screen in both.

**Where serif, where sans.** Serif is for what is read: titles, the lead, body text, questions, notes. Sans is for what is used: buttons, segments, breadcrumbs, lists of links, table cells, read-outs, labels in the scene, captions. A list of links is a control and is set in sans.

**Italic serif means one thing:** the honest note that says what a picture is ("A model built from typical measurements, not a scan"). Nothing else is italic: not captions, not search summaries, not emphasis.

**The scale.** Ten sizes. Sizes are CSS pixels; line heights are fixed, not ratios.

| name | face | size/line | weight | tracking | used for |
|---|---|---|---|---|---|
| Display | serif | 36/40 | 600 | −0.022em | the welcome title (30/34 on a phone) |
| Title | serif | 30/34 | 600 | −0.018em | the name of the place or the selected thing (22/27 on a phone) |
| Heading | serif | 22/27 | 600 | −0.012em | sheet titles, a trail stop, the wordmark |
| Subhead | serif | 18/24 | 600 | −0.008em | a question in a list, a step, the place under a card |
| Lead | serif | 18/27 | 400 | −0.004em | the first sentence of a card |
| Body | serif | 16/26 | 400 | 0 | reading text |
| Body small | serif | 15/23 | 400 | 0 | asides, Expert text, list summaries |
| Note | serif italic | 14/21 | 400 | 0 | the honest note |
| Control | sans | 14/20 | 400, 500 | 0 | fields, list rows, the default |
| Label | sans | 13/18 | 500; 600 for section heads | 0 | buttons, segments, table cells, captions (13/19) |
| Small | sans | 12/16 | 400; 500 for tags | 0 | breadcrumbs, meta lines, ruler names, labels in the scene |
| Micro | sans | 11/16 | 500 | 0 | ruler exponents, key hints. Nothing is smaller. |

Rules:

- Weights are 400, 500 and 600. No light weights, no 700 and above.
- Emphasis inside reading text is weight 600 on a word or a phrase, never a sentence. A whole first sentence in bold becomes the Lead.
- Reading text runs 45 to 60 characters a line (36em at most). The panel is 400 px wide for this reason.
- Sentence case everywhere. No capitals for labels, no letter-spacing on anything but the tracking above.
- Text can be enlarged to 200 percent with the browser's zoom and the panel still scrolls; no text is drawn into a canvas except inside figures.

**Numerals and units.**

- Lining, tabular figures in controls, tables and read-outs (`font-variant-numeric: tabular-nums lining-nums`).
- A range uses an en dash without spaces (250–350 g). A minus is U+2212. Multiplication is ×. Powers are superscripts (3 × 10⁹), never a caret.
- A thin non-breaking space between a number and its unit (70 mL), none before % or °.
- "≈" marks a rounded or typical value, as the content rules already require.
- The ruler's exponents are superscripts set at Micro size in weight 500.

### 2.2 Colour

One neutral family (porcelain and ink), one accent, one index. Every other colour on the page belongs to the scene or to a figure.

| token | light | dark | role |
|---|---|---|---|
| `--paper` | `#f4f5f4` | `#1c1f23` | the panel and every sheet |
| `--paper-2` | `#e9ebea` | `#262a2f` | insets, hover, the track of a segmented control |
| `--raised` | `#fdfdfc` | `#2e3338` | fields, the selected segment |
| `--plate` | `#fafbfa` | `#15181b` | the ground of a figure |
| `--ink` | `#16191d` | `#eef0f2` | text |
| `--ink-2` | `#3b424a` | `#c5cad0` | secondary text |
| `--muted` | `#5d6670` | `#9aa3ad` | meta and captions, 12 px or larger |
| `--rule` | ink at 12% | ink at 14% | hairlines between rows |
| `--edge` | ink at 50% | ink at 50% | the boundary of a field |
| `--accent` | `#1e4e8f` | `#8db8f2` | what can be pressed; what is selected |
| `--accent-2` | `#173f75` | `#a9c9f5` | pressed |
| `--wash` | accent at 9% | accent at 14% | the quiet button |
| `--index` | `#f0c330` | `#f0c330` | "you are here": the ruler's needle and read-out, the label of You, the park's marker on the globe |
| `--vellum` | paper at 92% | paper at 92% | controls that float on the scene |
| `--tip` | ink at 92% | paper at 94% | tooltips and toasts |

**Contrast, computed** (WCAG 2 relative luminance; the script is in the workstream notes):

| pair | light | dark | needed |
|---|---|---|---|
| ink on paper | 16.4 | 14.5 | 4.5 |
| ink-2 on paper | 9.5 | 10.0 | 4.5 |
| muted on paper | 5.4 | 6.5 | 4.5 |
| muted on paper-2 | 4.9 | 5.7 | 4.5 |
| accent on paper | 7.6 | 8.1 | 4.5 |
| accent on paper-2 | 6.9 | 7.1 | 4.5 |
| button text on accent | 8.3 (white) | 8.1 (ink) | 4.5 |
| ink on index | 10.5 | 10.5 | 4.5 |
| edge against paper | 3.4 | 3.7 | 3.0 |

Rules:

- The accent means "you can press this" or "this is what you selected". It is never decoration, never a heading colour, never a left border.
- The index means "you are here". It appears at most once in the chrome and once in the scene.
- Nothing is told by colour alone. A selected segment is also raised; a link in running text is also underlined; a certainty tag is also a word.
- Hairlines are `--rule`. A field's boundary is `--edge` because a boundary must be seen to find the field.
- No pure white and no pure black in the chrome.
- The dark tokens follow the reader's system setting (rollout step 14). The chrome never changes with the scene: it is the fixed frame of reference while the camera flies.

### 2.3 Space, shape and depth

- **Grid.** Spacing comes from 4, 8, 12, 16, 24, 32. The panel's inner margin is 24 (16 on a phone). Rows in a list are at least 36 high with a mouse and 44 with a finger.
- **Columns.** The page has three: the ruler (184) on the left, the scene, and the right-hand column (400) that holds the main buttons, the search field and the panel. Everything in the right-hand column shares one width and one left edge. Sheets (Library, Questions) take exactly the panel's place.
- **Radii.** Three: 14 for the panel and sheets, 9 or 10 for controls and insets, 7 for what sits inside a control. An inner corner is the outer radius less the gap between them. No pills. No 50 percent radius except a round mark.
- **Depth.** Three layers: the scene; controls that float on it; the panel and sheets. Two shadows separate them, and neither is paired with a border:
  - `--lift` (panel, sheets): `0 0 0 .5px rgba(22,25,29,.14), 0 2px 6px rgba(22,25,29,.08), 0 16px 36px -14px rgba(22,25,29,.32)`
  - `--lift-ctl` (controls): `0 0 0 .5px rgba(22,25,29,.14), 0 1px 3px rgba(22,25,29,.12)`
- **Material.** The panel is opaque: it holds a great deal of text. Floating controls are vellum, paper at 92 percent, so a hint of the scene shows through and they belong to it. There is no blur behind anything: the scene redraws every frame, a live blur over it is paid for on every one of them, and the look does not need it.

### 2.4 Components

**Buttons: three kinds.**

| kind | looks like | for | examples |
|---|---|---|---|
| Primary | filled accent, white text, radius 9, 13/18 weight 500, padding 8 × 15 | the one thing this view is for. At most one per view. | Look inside, Start exploring, Next |
| Quiet | accent text on `--wash`, same shape | the other things you can do here | See it from further out, Tour in, Back (in a trail) |
| Plain | accent text, no ground; `--wash` on hover; padding 4 × 8, 12/16 weight 500 | housekeeping | Back, Close, Minimise, Show, Hide, Pause, Got it, Enlarge |

A disabled button is muted text at half strength; it keeps its place. On a touch screen every button has a 44 × 44 target whatever its drawn size.

**Segmented control.** For one choice among two to seven of a kind (a layer, a depth of text, a model). A track (`--track` on the scene, `--paper-2` in the panel) with radius 10 and 3 px of padding; segments of radius 7, Label type, `--ink-2`; the selected segment is `--raised` with `--lift-ctl` and `--ink` text. It never wraps onto a second row: more than seven choices, or a second kind of choice, go into a section of the panel. In the panel it spans the full width with equal segments.

**The panel.** 400 wide, 14 radius, from 94 px below the top to 16 px above the bottom. Head: Back (plain), the path, Minimise (plain), one hairline. Body, top to bottom: a trail if one is playing; the card of the selected thing, or else the place; the scene's own sections; Time. Inside a card: tag (Small, muted), Title, the look row (one primary, one quiet), the figure, the segmented depth control, Lead, Body, facts, the note, then sections each opened by a hairline and a Label-600 head. Minimised, it is a tab at the right edge that shows the title.

**Lists** (search results, Questions, Library, Tracks). A row is a title and at most two supporting lines; rows are parted by space, not rules; hover and keyboard selection are a `--paper-2` ground with radius 7, never a bar at the edge. Group heads are Small 600 muted. A list does not repeat a group head.

**Search.** One field, always on screen, 36 high, `--raised` with an `--edge` boundary; focus is a 2 px accent ring. The placeholder says what can be typed. The `/` hint is Micro on `--paper-2`. Results open under it at the panel's width. Each result says what choosing it will do.

**The ruler.** The one instrument on the page.

- Vellum, 184 wide, no border; the scene shows faintly through.
- Major ticks every three decades with the exponent; minor ticks at 20 percent ink.
- The needle is a 1.5 px line in the index colour with the size of the view in a chip of the same colour. Nothing else on the page uses that chip, except the label of You.
- Names have three tiers: the stop you are at (ink, 600), the main stops along the spine (ink-2), and side stops such as "Your heart" (muted). Leader lines are ink at 16 percent, 9 percent for side stops, 70 percent for the stop you are at.
- On a phone the strip shows ticks and the needle only, with no leader lines.
- Still to do (step 14): show side stops only within three decades of where you are, so that no more than about twenty names are ever on the ruler.

**Labels in the scene.** Names, set like names on a map.

- Small sans, weight 500, 12/16. A label sits above the thing it names with a 7 px stem pointing down at it. There is no dot: a mark must be on the thing or not exist.
- On a dark scene the words are paper with a crisp ink halo; on a light scene (the park by day, a plate) they are ink, weight 600, with a paper halo. The halo is eight 1 px offsets and a soft 6 px one, which reads on grass, sky and stars alike.
- "You", and the park's marker on the globe, are ink on the index colour.
- Labels have priorities already (`data-pri`); colliding labels hide the lower one. To add (step 14): primary labels at full strength and secondary at 60 percent; labels may not run under the ruler or the panel.
- Hover underlines a label. It opens the card of its thing, like the thing itself.

**Tooltips and toasts.** `--tip` ground, white text, Small 500, radius 7, no border. A tooltip names the thing under the pointer and adds one muted fact at most. It is never a white box.

**Focus.** A 2 px accent outline, 2 px off the control, on everything that can take the keyboard. It is never removed.

**Icons.** None. Controls are words. The only glyphs are typographic: `+` and `−` on the zoom buttons, `›` in the path, `×` to close a sheet, `/` for the search key. If icons are ever wanted, they are one drawn set at one weight, used with their words.

**Notes and asides.** An aside in a card (Did you know?) is Body small on `--paper-2`, radius 9, with a Small 600 head. A warning or a "not built yet" sentence looks the same. No left bars.

**Empty and loading states.** Say it in a sentence, in the place where the content will be. "No closer view of this has been built yet" is the model. While meshes arrive, one quiet line near the bottom of the scene names what is still loading; there are no spinners and no skeleton boxes. A figure that fails says "Figure error" and why, in ink on the plate.

**The welcome page.** Display title, a Lead sentence, three starter questions, three steps numbered with plain serif numerals in muted ink, a short table, one primary button.

### 2.5 Motion

| what | duration | curve |
|---|---|---|
| hover, press, focus | 120 ms | ease |
| a segment's selection, a section opening | 160 ms | ease-out |
| the panel folding, a sheet arriving | 280 ms | `cubic-bezier(.2,.8,.2,1)` |
| a label hidden by a collision | 160 ms fade | ease-out |
| camera flights | the engine's own timing | ease in and out; any input interrupts |

- What moves: the camera, the needle on the ruler, things in the scene that really move (and say so in their note).
- What never moves: the ruler, the right-hand column, text while it is being read, and anything "to draw attention". There are no pulsing marks and no entrance animations.
- Nothing bounces. Nothing waits for an animation to finish before it responds.
- With `prefers-reduced-motion`, every interface transition is removed. Flights should become a short cross-fade (step 14 covers this; today they still fly).

### 2.6 Phone (860 px and narrower)

- The ruler is a 52 px strip. Tapping it lists the nearby stops.
- The main buttons run across the top; search is a button that opens a full-screen field.
- The panel is a sheet at the bottom with a 36 × 5 handle: about a third of the height at rest, most of it when dragged up. The scene stays live above it.
- Library and Questions are sheets from just under the Search button to the bottom; while one is open the scene's own control is hidden.
- Targets are 44 × 44. Title drops to Heading size; reading text stays 16/26.
- Still crowded (step 14): three stacked control boxes at the top. A scene's layer control should become one row that scrolls sideways.

### 2.7 The voice of controls

- A button starts with a verb and says what will happen: "Look inside", "See it from further out", "Show the skeleton". Not "OK", not "Go".
- A name is a name: "Library", "Questions", "Time".
- Sentence case. No exclamation marks. No "please". No "we".
- A hint is one sentence and can be dismissed for good.
- Never explain a control that explains itself, and never explain twice.
- When something cannot be done, say what is true: "No closer view of this has been built yet".

---

## 3. The picture: realism

The 3D scenes are to look real: lit by a real sky or a real room, made of materials with measured properties, with the detail of photographed surfaces. This replaces the earlier illustrated direction (toon shading, ink outlines), which is gone from this document.

Realism is a way of drawing. It is never a claim. The first rule stands above it: a render that looks like a photograph of a cell is still a model of a cell, and the screen says so.

### 3.1 What "real" can mean at each scale

| scale | what exists to be seen | what "real" means here | what it cannot mean |
|---|---|---|---|
| Stars, galaxies, the cosmic web | light, measured | catalogue positions and colours; survey images where they exist; black space | a "view from a spaceship": no eye sees a galaxy's arms this bright. Simulated structure (the web) is a rendering of data and says what its colours encode. |
| The Sun, planets, moons | photographed | real global maps (NASA and others), one Sun as the only light, a dark night side, no fill | weather today; surface detail finer than the map |
| Earth from orbit down to a landscape | photographed | real imagery, a physically computed sky, haze | the actual park: the scene is a model of a place, not a scan of it |
| The park, the body, animals, plants | visible, and familiar to everyone | real light and sky for the date and time; photographed surface detail; skin, leaves and wax that let light through; soft shadows | a photograph. The models are built from typical measurements, so close up they are good models, not specimens. |
| Tissues, cells, organelles (0.1 mm to 0.1 µm) | visible only by microscope, mostly without colour | a physical model on a bench: studio light, believable wet or matte materials, depth | "what a cell looks like". Colour is a convention. Counts and crowding are far below the real thing unless the note says otherwise. |
| Molecules, crystals (nm) | no appearance: smaller than the wavelength of light | a model kit photographed well: true geometry, true relative sizes, conventional element colours | colour, surface, shine: all convention. A ball is not an atom's surface. |
| The atom | a probability density | the dot cloud, which is a plot of data, drawn as a plot | an object. It is not lit, not shaded, has no material. |
| Nucleus, proton, quarks | no picture at all | a diagram, drawn plainly as a diagram | anything that looks like a photograph. Gloss on a quark is a false statement. |

The further from the human scale, the less a camera could ever have recorded, and the more plainly the screen must say what is model and what is convention.

### 3.2 The truth rule under realism

Each rule here is checked in the merge list (section 6).

- **Every scene carries a kind:** *As it looks* (the park, a planet), *Model* (a cell, a molecule) or *Diagram* (the proton, the atom's cloud). The kind is the first words of the scene's note in the panel: "Model: a generic animal cell...". A model or diagram never loses that word, however good the render.
- **Colours with no physical basis are named as a convention** where they are shown: "Colours follow the CPK convention", "Organelle colours are a code, listed below". The convention must be legible: if the note says carbon is dark grey, it is dark grey on screen.
- **A model is lit like a model:** a studio, a neutral ground, no sky. Daylight is kept for things that stand in daylight. The ground alone tells a visitor which kind of picture this is.
- **Nothing is added for atmosphere that could be read as data:** no floating specks, no star field behind a molecule, no lens flare, no depth-of-field blur that hides what is there.
- **Stand-ins stay labelled.** The photographed bark is a Korean oak's on an English oak; the boulder's surface is sandstone on a boulder its card calls granite. Both are said in `assets/ATTRIBUTION.md`, and a stand-in that a visitor could be misled by is said in the thing's note.
- **Scale, "not to scale" and "drawn thicker than real" stay** exactly as now.
- **Real imagery is credited and dated** where it is used as the picture itself (planetary maps, galaxy images).

### 3.3 The pipeline

What is right, and what three.js r128 allows.

| stage | rule | r128 |
|---|---|---|
| Colour in | every colour and colour texture is stored as the colour to show (sRGB) and converted to linear light before lighting | r128 has no colour management. Colour textures can be flagged `sRGBEncoding`; material colours, vertex colours and instance colours are never converted by the library. |
| Light | lights add in linear light | default |
| Tone | one filmic curve, ACES (`ACESFilmicToneMapping`), exposure set per scene | built in. r128 has Linear, Reinhard, Cineon and ACES only; no AgX, no Khronos Neutral. ACES desaturates bright colours slightly; accepted. |
| Colour out | `renderer.outputEncoding = sRGBEncoding` | built in, applied inside built-in materials only |
| Unlit things | lines, sprites, points, washes and the app's own shaders bypass tone mapping and encoding and are written as authored | they must not include the two chunks |

Two ways to do "colour in", and the choice between them:

- **In the shader** (the prototype): lit built-in materials raise their finished surface colour to the power 2.2 just before lighting. One `pow` per fragment. Nothing in the app's data or code is touched, so it can be switched on and off, and a colour set later at run time is still right.
- **At creation** (the engine plan, `notes/realism/renderer_core.md` step 4): every colour is converted once when a material or geometry is made. Free at run time, exact (the true sRGB curve, not 2.2), but every place that sets a colour later must be found.

Ship the first; move to the second when the illustration path is retired. The foundation's API (3.12) is the same either way.

### 3.4 Light

**One environment per scene, and one key.** A scene is lit by an environment (a prefiltered cube map, `scene.environment`) and at most one directional light that casts the shadow. Nothing else: no second key, no coloured back light, no flat ambient above 0.2.

| kind of scene | environment | key | exposure |
|---|---|---|---|
| Outdoors (the park, the body in it, things, landscapes) | the sky, computed from the Sun's true direction for the date and time shown (Preetham's analytic daylight model, turbidity 2.2), with the lawn's bounce in the lower half | the Sun: `0xfff1d6`, in its true direction, casting the shadow map | 0.9 × the eye's adaptation (1 to 3) |
| A model (cell, tissue, molecule, crystal, organ cut open, the phone's parts) | a photographed studio (White Studio 06, CC0) | one lamp over the viewer's left shoulder, 0.6 to 0.7, moving with the view | 0.9 × 0.8 |
| Space (planets, moons) | none | the Sun only; night sides are dark | 1.0 |
| A diagram or a plot (the atom's cloud, the proton, the Standard Model view) | none | none: unlit | 1.0 |

- **The sky is computed, not photographed,** because the app shows the real Sun for any date and hour and a photograph shows one moment. It is a clear sky of moderate haze, and the park's note says it is not today's weather. Two photographs of the real Greenwich Park are offered on choice (`looksky`, 3.12): the clear one only at an hour when the real Sun stands at its height, the cloudy one while the Sun is up; never with a Sun in a different place.
- **The environment is redrawn only when the Sun has moved about a degree,** at most every two seconds. It is 14 small renders into an off-screen target (`PMREMGenerator.fromScene`), not a per-frame cost.
- **The sky dome and the environment use the same shader,** so what lights a thing and what is seen behind it agree.
- **Night:** the Sun's light falls to zero with its altitude; the environment darkens with it. The body keeps a weak lamp of its own so the model can be read, and its note says so.

### 3.5 Materials

Every surface is a `MeshStandardMaterial` of a named kind. A kind fixes what is physical; the thing's data supplies only the colour. Kinds are in `LOOK.KINDS`.

| kind | roughness | notes |
|---|---|---|
| `skin` | 0.56 | light passes through: the terminator wraps, red furthest (0.42, 0.17, 0.09) |
| `wet` (organs, mucosa), `muscle` | 0.34, 0.46 | a soft highlight; wraps less than skin |
| `bone`, `enamel`, `horn` | 0.6, 0.22, 0.42 | |
| `eye` | 0.07 | the one mirror-smooth thing on an animal: it shows the sky |
| `fur`, `feather` | 0.95, 0.93 | matte; a weak environment (0.7, 0.6) so they do not read as plastic |
| `leaf`, `petal` | 0.6, 0.52 | thin: lit from behind they glow in their own colour (30 to 42 percent of the light comes through) |
| `bark`, `rock` | 0.95, 0.9 | photographed detail laid on from three sides, with its relief |
| `wood`, `soil`, `matte` | 0.8, 1.0, 0.9 | |
| `fungus`, `wax` | 0.7, 0.3 | a fly agaric's cap is waxy and shines; its stem does not |
| `chitin` | 0.32 | a beetle's or a bee's shell |
| `water` | 0.05 | reflects the sky strongly at a low angle (environment 1.5) |
| `glass`, `plastic`, `metal` | 0.06, 0.45, 0.38 (metalness 1) | metal is the only metallic kind |

Rules:

- **Nothing is metallic but metal. Nothing is mirror-smooth but water, glass and an eye.** A plain sphere at roughness 0.4 under a bright environment is a snooker ball; most of nature is above 0.5.
- **No colour of a surface is outside sRGB 50 to 240** in any channel pair that makes it near-black or near-white (measured surfaces run from charcoal at about 4 percent to fresh snow at about 80 percent). Pure saturated colours do not occur.
- **Colour comes from the thing's data or from a real map,** never from a texture chosen because it looks good. A photographed texture is used as *detail*: it is normalised to a mean of one half and multiplied in, so the thing keeps its sourced colour and gains the variation of a real surface.
- **Emissive is for things that emit.**

### 3.6 Surface detail

- **Texture sets** are colour and normal (OpenGL convention) at 1024 px, CC0, vendored in `assets/`. Roughness maps are a second step.
- **Models have no texture coordinates,** so detail is laid on from three sides in the model's own space (triplanar: six more texture reads per fragment on a surface that has both maps). It cannot follow the grain of a branch or the growth of bark round a trunk; for that a model needs coordinates (step 11).
- **Scale is real:** the bark set covers 0.9 m, the rock 1.2 m, the turf 1.4 m.
- **An instanced part takes the colour detail only,** not the relief (its own turn is not in the normal matrix).
- **Tiling must not show.** The lawn already carries a slow colour variation; keep it. Beyond about 12 m detail is below a pixel and the far tier has none.

### 3.7 Light through things

Cheap cues, each one term in the standard shader; none is a simulation.

- **Skin and flesh:** the edge between light and shade is wrapped per colour channel, so the shade side begins red. This is what stops skin looking like painted plaster.
- **Leaves and petals:** a share of the light that falls on the back comes through in the leaf's colour. A crown lit from behind is bright yellow-green, not black.
- **Wax and fungus:** a mild wrap.

Not done, and not possible at this cost: true subsurface scattering (ears and nostrils glowing), hair and fur that scatter light along the strand.

### 3.8 Shadows and occlusion

- **The Sun's shadow** is one shadow map (`PCFSoftShadowMap`) fitted to the view (3.12), drawn again only when the view's square, the Sun or a caster has changed. The person, the dog and every oak cast their own shapes. Its softness is constant; a real penumbra widens with distance from the caster, and r128 has nothing cheap for that.
- **Contact:** everything that stands on the lawn gets a small soft dark ellipse under it (the person 0.2 m, the dog 0.26 m, a boulder 0.45 m), 30 percent, leaning away from the Sun: the contact that a shadow map's bias leaves out. One draw call for all.
- **Occlusion between parts** (the crotch of a branch, under a chin) is to be baked into vertex colours when a model is built (step 9). Until then the models lack it, and it shows.
- **Screen-space ambient occlusion is not used:** it needs a second render of the scene, a full-screen pass and a blur, on every frame, and the start view's budget is zero passes. It may be offered at the highest quality level only (step 15).

### 3.9 Sky, air and water

- **Sky:** Preetham's model as above. It has no clouds. The park's old clouds (white lumps) do not survive realism and are to be replaced by a noise-based cloud layer in the sky shader or removed (step 6).
- **Air:** fog in the colour of the sky at the horizon (or of the photograph's horizon), from 40 m to 260 m in the park. This is aerial perspective at no cost. It is one colour in every direction; real haze is brighter toward the Sun.
- **Water** (the pond): the `water` kind reflects the environment, so it shows the sky and darkens when you look straight down. It does not yet reflect the trees, refract the bed or move. A planar reflection is one more render of the scene per frame (r128's `Reflector`), allowed only at the highest quality level; ripples from a normal map and a depth-tinted bed are cheap and come first (step 6).

### 3.10 Line and selection

- **No outlines.** Edges come from light. The ink hull is drawn only on the part pointed at or selected, in the accent colour, as the mark of that; it is an interface element, not part of the picture.
- **Selected:** the accent hull, and nothing else about the part changes. Other parts are not dimmed, except when a card reveals something behind them.

### 3.11 Lens

- **Glow (bloom) only on things that emit light:** stars, the Sun, a lit screen. Never on a cell, a molecule or a sunlit planet.
- **No depth of field, no vignette, no grain, no lens flare, no chromatic aberration.** The view is an instrument's. A blur would hide what a visitor is trying to read, and none of these is information.
- **Anti-aliasing** is the canvas's own (MSAA), which is why nothing is drawn through a post-processing target.

### 3.12 The realism foundation: what a scene calls

`js/look.js` is part of the engine: it is loaded right after `js/engine.js`, and the engine calls it. It is on with `?look=2` and **off by default**; off, `LOOK` exists with inert members (`LOOK.on` is false) and nothing is drawn differently. `js/look_ui.js`, loaded last, holds only the interface prototype (root classes, label colour, the ruler's tiers, the card's lead, figures on a plate). The names below are the one vocabulary for every scene plan in `notes/realism` (where a plan says `ENV.get`, `lin()`, `shaderPatch` or `q=`, read these).

**Decisions that every scene relies on**

| question | answer |
|---|---|
| Colour pipeline | sRGB out and ACES, set once on the renderer. Colours and colour maps stay as authored (sRGB); lit built-in materials convert them in the shader (3.3). Unlit built-in materials (basic, points, sprite, dashed, background) skip the tone curve and the encoding. Normal and other data maps are never converted and never used as `map`. |
| Both looks at once | The switch is for the whole page, not per frame. In r128 the tone mapping and the output encoding are part of every program's key, so switching between frames would compile every material twice; it is possible and not built. |
| Light units | `physicallyCorrectLights` stays **off**. A directional light of intensity 1 and colour white shows a white matte surface that faces it at 1.0 before the tone curve; an environment shows it at the cosine-weighted mean of the environment's radiance. Both are the real irradiance over π, so they compare directly. The park's Sun is 1.15 (×sin elevation on level ground). The sky's gain (`SKY_GAIN` 0.08) is set by two measurements: at noon in June the Sun gives a level surface 4.7 times what the sky gives (measured 4 to 6), and the zenith is 0.15 of a white card facing the Sun (measured 0.16). |
| Exposure | `renderer.toneMappingExposure` is set before each frame's scene is drawn to `LOOK.exposureOf(frame)`: the page's (`lookexp`, 0.9) × `frame.exposure` (the rig's; a studio 0.8) × the eye's adaptation outdoors on the Earth (the light on a level surface against a clear June noon, to the power 0.6, from 1 to 3; `LOOK.adaptation()`). |
| Glow | A frame says so: `frame.glow`. The rig table sets it (true for the space frames that show light sources: stars, the Sun, galaxies, the accretion flow); `bloomTarget` asks `LOOK.glowOf()`, which takes the nearest frame up the camera's chain that has a value. |
| The Sun of a photographed sky | r128 cannot turn an environment map, but an environment drawn from a turned sphere (`fromScene`) is turned. The outdoor environment is **computed** from the Sun's real direction (re-prefiltered when it has moved about a degree). Two photographs of Greenwich Park are offered on choice (`looksky`, below); the clear one only at an hour when the real Sun stands at its height. |

**Rigs: which light every frame type has** (`LOOK.TYPES`, `LOOK.RIGS`, `LOOK.rigOf(F)`; set on `frame.rig` when the frame is built)

| rig | environment | lights kept | frame types |
|---|---|---|---|
| `outdoor` | the sky of the place it stands in (the park's, or the region's or landscape's own) | the Sun (one directional light); hemisphere, ambient and spot lights off | park, body, region; landscape on the Earth or on a world with air; a thing in the park (or with no `env`), or on a world lit by the Sun when its parent is outdoor |
| `studio` | the studio photograph (fetched when the first studio frame is built; the sky until then) | one lamp over the viewer's left shoulder (0.62; a cell 0.7, a molecule or crystal 0.66), moving with the view | cell, dna, mol, crystal, liquid, gas, plasma, micro, tissue, tissue2, organ, thstage, phone, die, core, cells, inverter, finfet; a thing with another `env` |
| `space` | none | the Sun only (a point light where the frame has one, else one directional light); night sides dark | cosmos, localgroup, milkyway, neighborhood, star, sun, solarsystem, sgrA, planet, earth; a landscape on a world with no air (the Moon) |
| `diagram` | none | none: one white ambient light of 1 and no tone curve, so every surface shows exactly its own colour | atom, atomq, nucleus, proton, sm |

Lights that arrive later (a thing's model) get the rig within half a second; a light a frame switches back on (a thing leaving its parent's scene) is switched off again. `LOOK.audit()` lists every drawn frame's rig, environment, the lights still on, exposure and glow. A new frame type is added to `TYPES`; until it is, it keeps its own lights and the audit shows `rig: null`.

**Calls**

| call | gives |
|---|---|
| `LOOK.on` | whether the look is on (`?look=2`). Every engine hook tests it first. |
| `LOOK.material(kind, color, {double, extra, instanced})` | a `MeshStandardMaterial` of that kind |
| `smat(color, o)` (js/helpers.js) | under the look, `LOOK.smat`: the kind is `o.kind`, else metal for `metalness` ≥ 0.5, else the frame's default (skin in the body, wet in a cell, organ or tissue, plastic in a studio, matte elsewhere). Roughness and metalness passed in are the table's to decide; `emissive` is dropped unless the frame emits (`frame.glow`) or `o.emits`. Off, `kind` and `emits` are ignored and it is what it always was. |
| `illoMat(color, o)` (js/nodes.js) | under the look, `LOOK.illoMat`: `o.kind`, else the kind of the part it is made for (`kindOf`, from the part's data `kind` or its name), else the frame's default |
| `LOOK.dress(material, kind)` | gives an existing standard material the kind's roughness, light-through cues and surface detail |
| `LOOK.KINDS` | the table of 3.5. A scene may add a kind; it never makes a one-off material. |
| `LOOK.patch(material, key, fn)` | adds a shader patch that runs after the ones the material already has, and extends the program's cache key. Works with the look on or off. |
| `LOOK.light(frame, 'studio')` | puts a frame of another rig on the studio rig, with its environment and exposure |
| `LOOK.envFor(frame)`, `LOOK.env(name)`, `LOOK.envLoad(name, file)` | the environment for a frame (the foundation assigns it; a scene does not); one by name (`'sky'`, `'studio'`, or one loaded from a `.hdr` in `assets/look`, prefiltered once and cached; a promise) |
| `LOOK.sun()` | the park's Sun now: `{dir, day, color, intensity}` (park coordinates). The park's light is moved about with the shadow's square; read its direction here, never from the light's position. |
| `LOOK.lin(hex)`, `LOOK.SKY_FRAG`, `LOOK.skyRGB(dir, sun)`, `LOOK.shown(rgb, exposure)` | a colour as linear light; the sky shader; the same sky in JavaScript; a linear colour as it will be shown (ACES and sRGB) |
| `LOOK.quality`, `LOOK.part(name)` | `'high'` or `'low'`; whether a part is on (live). Anything costly a scene adds asks first. |
| `LOOK.ready`, `LOOK.busy()` | a promise that resolves when nothing the look asked for is still loading (environments, photographs, textures), including what starts while it waits: read it again after each view change. Tests wait on it. |
| `LOOK.shadowFit(F, sun, shadow)` | the park's fitted Sun shadow (below); called by the park's `shadowStep` |
| `frame.rig`, `frame.exposure`, `frame.glow` | set from the rig table when the frame is built; a scene may set `exposure` or `glow` before that |
| `frame.postDraw(renderer)` | optional: called right after the frame's scene is drawn, in its depth (for a pass of its own) |

**What the engine calls** (each guarded by `LOOK.on`): `LOOK.wire()` at the start of `startApp` (wraps `ThingObj._addPart` and `decodePart` so a material knows its part); `LOOK.frameBuilt(F)` at the end of `Frame.ensure` (rig, lights, environment, exposure, glow, then the scene's own dressing); `LOOK.exposureOf(F)` before each scene is drawn, in `renderFrames` and `renderFramesTight`; `LOOK.glowOf()` in `bloomTarget`; `LOOK.step(now)` once per frame in the main loop (skies follow their Suns, late lights, the person's light, contact shadows, casters, the photographed sky, fog colour, adaptation); `LOOK.parkSunSet(F, sun)` after the park sets its Sun; `LOOK.shadowFit` in the park's shadow step. Under the look `outlineAmt` is 0 (no ink; the hull of the part pointed at or selected stays).

A scene engineer therefore writes, in a frame's `build`: materials through `LOOK.material`, `smat(color, {kind})` or `illoMat`; one directional light if the scene has a Sun or a lamp; `LOOK.light(F, 'studio')` if it is a model of another rig. Nothing about environments, tone mapping or encoding, and no hemisphere or ambient light (the rig switches them off).

**The Sun's shadow, fitted to the view** (rollout step 7). One map, as before, drawn only when something changed (the park's `shadowStep`). The map's square is centred on the ground where the camera looks, 3.2 viewing distances wide (16 to 240 m, in steps of 25 percent), 2048 px (1024 at the low level). Its centre is snapped to whole texels in the light's own axes, so shadows do not crawl as the view moves; it is drawn again when the snapped centre has moved six texels, the square has changed size, the Sun has moved, or a caster has changed. Casters: every standard-material part of every thing in the park's scene (looked at every two seconds, as a thing builds the meshes of a detail tier when it first needs them), and the person: the body is a scene of its own and cannot cast into the park's map, so the skin's geometry is drawn into the map as a stand-in the camera never sees. Receivers: the lawn, its far ring, the hills and the turf. `PCFSoftShadowMap`, normal offset of 1.2 texels. Not done: a penumbra that widens with distance; parts that move (a wagging tail) cast where they were when the map was drawn.

**The sky over the park: `looksky`.** `sky` (default): the computed sky, true for every hour. `photo`: the clear photograph (taken in winter, Sun 23.47° high); choosing it sets the clock to the afternoon of the nearest day when the Sun stands at that height and stops it, and the photograph is turned so that its Sun lies where the app's Sun is. If the clock is moved and the Sun is more than 4° from that height, the computed sky comes back and a note says why. `overcast`: the cloudy photograph while the Sun is up, with the Sun's direct light off. Each photograph is the sky that is seen and the environment, drawn from the same turned sphere; the fog takes its colour at the horizon; a note on screen names it as a photograph and credits it. The clear one is scaled to give the light the computed sky gives at the same height (its own Sun is clipped, as an HDR's usually is); the overcast one to give a level surface 0.9.

**Switches** (read in `js/perf.js`, shown in the meter, Shift+P, only while `look=2`): `look=2` on (reloads). `lookq=high|low` (reloads; `fx=low` implies low). `lookoff=` a list of parts: `pbr, tone, sky, env, tex, sss, rig, shadow, glow, ui, labels`; `env`, `shadow`, `glow` and `labels` change at once, the others reload. `lookexp=` the page's exposure (live). `looksky=sky|photo|overcast` (reloads).

**Built, and not built**

| item | state |
|---|---|
| 1. Colour pipeline, legacy colours, colour against data textures | built (shader-side conversion). Per-frame switching: not built. |
| 2. Exposure per frame; light-unit convention; adaptation outdoors | built, in the engine's render loops |
| 3. Environment service | built: one generator, the computed sky per outdoor place, the studio photograph, two park photographs on choice, load by name, cache, `LOOK.ready` |
| 4. Quality levels and switches | built in `js/perf.js`, in the meter; `lookexp` and four parts live, the rest reload |
| 5. Glow as a frame's choice | built: the rig table sets `frame.glow` for every type; `bloomTarget` honours it |
| 6. Material factory from a table; triplanar detail; patch composer | built; `smat()` and `illoMat()` go through it, and the two toon materials made directly in `js/nodes.js` now go through `illoMat`. **Not built:** the per-vertex occlusion patch (needs the bake, plan step 9). Materials made directly in a scene's code (a `ShaderMaterial`, a `MeshBasicMaterial`, a `MeshStandardMaterial` written by hand) are not routed; the rig still lights the standard ones. |
| 7. A Sun shadow fitted to the view | built for the park (above) |
| Rigs for every frame type | built: all 38 types of `FT` and `sgrA` are in `TYPES` |

### 3.13 What r128 can and cannot do, with no build step

| wanted | r128 | verdict |
|---|---|---|
| Physically based materials | `MeshStandardMaterial`; `MeshPhysicalMaterial` adds clearcoat, sheen and `ior` | yes |
| Environment light from an HDR | `PMREMGenerator.fromEquirectangular`, `fromScene`; `scene.environment` (standard materials only); `RGBELoader` in the examples (vendored, 12.6 kB) | yes |
| Turning an environment | no `envMapRotation` | yes, by drawing the photograph on a turned sphere and prefiltering that (`fromScene`). The Sun's height in a photograph still cannot change: one reason the sky is computed. |
| Filmic tone curve, sRGB out | ACES; `outputEncoding` | yes, for built-in materials; the app's own shaders opt in by hand |
| Soft Sun shadows | PCF soft, VSM | yes, one map; softness constant |
| Contact shadows | no; the example redraws the scene and blurs it every frame | a blob per thing; later a baked or once-drawn map |
| Ambient occlusion | SSAO and SAO passes exist in the examples (extra scene renders and blurs; no GTAO) | baked per vertex; screen-space only at the top quality level |
| Detail without texture coordinates | not built in | yes, by replacing three shader chunks (done) |
| Subsurface scattering | none | cues only (done) |
| Refraction, transmission | `transmission` in r128 only changes opacity | no real refraction; glass and water are reflection plus tint |
| Planar reflection | `Reflector`, `Water` (one more scene render each) | top quality level only |
| A physical sky from the ground | Preetham (`Sky.js`) | yes (done). No clouds, no view from altitude: the hand-over from the park to the globe stays a cross-fade. |
| Depth of field, bloom | example passes | bloom exists and is restricted; depth of field is not wanted |

**What light, material and texture cannot fix.** The models are procedural, built from typical proportions, and the body is a surface atlas. Up close they will read as good models, not as the thing:

| model | what is wrong up close | what it would take | licence-clean source |
|---|---|---|---|
| The person's skin and face | smooth, poreless, no eyes, lips, nails or hair; segments show | a sculpted or scanned head and hands with texture coordinates and colour, normal and roughness maps | MakeHuman (core assets CC0; the status of exports must be read on its licence page and saved in the repository before use). BodyParts3D and Z-Anatomy stay the anatomical base (CC BY-SA; no skin textures). |
| The dog's coat | fur as flat cards with no shading of their own | shell or strand fur with a real colour map, or a scanned dog | none found with a clear licence; Poly Haven has no animals but one rat |
| Oak leaves | flat cards in two greens | a photographed leaf atlas (colour, alpha, normal, translucency) | ambientCG leaf sets (CC0), staged |
| Oak trunk | bark laid on from three sides, no flare of roots into turf | texture coordinates along the trunk; a root collar | Poly Haven bark (CC0), staged |
| Robin, bee | good shape, uniform surfaces | feather and hair detail maps; iridescence on wings | none found; CT scans of a bee exist under CC BY as shape references |
| Lawn | a tiled turf and hashed shells | blades as instanced geometry near the eye with a real blade texture | Poly Haven grass models (CC0, glTF) |
| Pond | flat tinted surface | ripples, depth tint, wet bank | staged normal and caustic maps (generated, own work) |

### 3.14 Assets and their budget

Vendored now, used only with `?look=2` (all CC0; lines in `assets/ATTRIBUTION.md`):

| file | what | bytes | fetched |
|---|---|---|---|
| `assets/look/white_studio_06_1k.hdr` | studio light (Poly Haven, Grzegorz Wronkowski), halved from 2k | 2,097,202 | when the first studio frame is built |
| `assets/look/greenwich_park_1k.hdr` | the park's clear sky, on choice (Poly Haven, Andreas Mischok), halved, Sun clamped | 2,097,202 | only with `looksky=photo` |
| `assets/look/greenwich_park_03_1k.hdr` | the park's overcast sky, on choice (same) | 2,097,202 | only with `looksky=overcast` |
| `assets/look/Grass004_color_1k.jpg`, `_normal_gl_1k.jpg` | turf detail (ambientCG), re-encoded (colour JPEG 80, normal 85 without chroma subsampling) | 308,397 + 725,669 | with the park |
| `assets/look/jolcham_oak_bark_01_color_1k.jpg`, `_normal_gl_1k.jpg` | oak bark (Poly Haven, Charlotte Baglioni), re-encoded | 516,126 + 1,159,599 | with the first bark |
| `assets/look/rock_boulder_dry_color_1k.jpg`, `_normal_gl_1k.jpg` | boulder (Poly Haven, Dimitrios Savva and Rico Cilliers), re-encoded | 211,832 + 244,411 | with the first rock |
| `js/vendor/RGBELoader.js` | three.js r128 loader (MIT) | 12,572 | with the first `.hdr` |

9.47 MB in the repository. The start view (the park at high quality) fetches the three surface sets, 3.17 MB, within the budget below; the low level fetches none. A view of the park with a photographed sky fetches 5.3 MB, over the budget; it is a choice, not a default.

**Budget:** 25 MB of look assets in the repository for the first pass; at most 4 MB fetched for any one default view at the high level and nothing at the low level; every set loaded only when a scene that uses it is built. 512 px on phones is not built yet. No new CDN: everything is served from the repository.

More sets, each checked by a second reader, wait in `/home/rhett/projects/how/.devtools/assets_staging/` (skies, ground, bark and rock, water, planets, deep space, models), with a manifest and licence quotes per file.

### 3.15 Quality levels and flags

| level | what is on | for |
|---|---|---|
| `low` (`?lookq=low`) | linear light, ACES, standard materials, the computed sky as environment, Sun shadow as `shadows=` says | phones, integrated graphics |
| `high` (default with `?look=2`) | plus surface textures, light-through cues, the studio photograph | laptops and desktops |
| top (not built) | plus planar reflection on the pond, screen-space occlusion | a discrete graphics card; behind `fx=high` |

Every part has a switch (`?look=2&lookoff=tex,sss,env,sky,tone,rig,shadow,glow,pbr,ui,labels`), so each can be judged alone on a real graphics card; the meter (Shift+P) has a toggle per part and rows for quality, sky and exposure. The existing switches (`shadows`, `bloom`, `dpr`, `outline`, `fx`) keep their meaning.

**Measured and expected.** The test machine draws in software. Measured there: counts (scenes, passes, draw calls, triangles) and CPU time. Not measured: anything about a graphics card. Expected on one: the standard material costs more per fragment than the toon material it replaces (a specular term, two environment look-ups, one `pow`); bark and rock add six texture reads; the 880 thousand triangles of the dog's fur and the oaks' leaves are where that is paid most, because they overdraw. The first thing to look at on the owner's machine is the frame time at the dog and under an oak with `?look=2` against `?look=2&lookq=low`.

### 3.16 What must never be done

- A second key light, or an ambient light strong enough to flatten form.
- A material made by hand in a scene instead of a kind.
- A texture used for its colour when the thing has a sourced colour.
- Gloss, glow or a reflection the thing does not have.
- A sky, room or backdrop behind a model that suggests a place it is not in.
- A photographed environment with a Sun that is not where the scene's Sun is.
- Depth of field, vignette, grain or flare.
- A full-screen pass in a view whose budget is zero.
- A scene whose note has lost the word *Model* or *Diagram*.

---

## 4. Figures and diagrams (`js/viz.js`)

A figure is a plate on the card, not a screen.

- **Ground.** `--plate`, radius 9, a 1 px `--rule` outline. No frame inside it.
- **Type.** The sans stack. Tick labels Micro (11) in `--muted`; axis names and direct labels Small (12) weight 500 in `--ink-2`; values that change are `--ink`. No other sizes.
- **Axes.** One hairline each, ink at 35 percent, through zero when zero is in range. Grid lines ink at 7 percent, or none. Ticks are numbers only; the unit is in the axis name.
- **Line weights.** Data 2 px. Secondary curves and construction lines 1.25 px. Axes 1 px. Dashes only for "not real" (an asymptote, a prediction, a return path).
- **Colour.** One code for the whole app, used by figures and by the keys of model scenes alike: blue `#1e4e8f` (structure, the thing itself), red `#b4412f` (energy, heat, arteries), green `#3f7a3a` (growth, plant), ochre `#96690a` (signal, a live value), violet `#6b4a9c` (information, genetic), teal `#1f7a78` (water, flow, veins), grey `#5d6670` (neutral). In that order when a figure has no meaning to attach. In dark mode the same hues lightened (`#8db8f2`, `#f0907c`, `#93c98a`, `#e2b659`, `#b9a0e6`, `#74cfc9`). All twelve are 4.6:1 or better on their plate. A figure uses as few as it can: one series is blue.
- **Annotation.** Label the curve at its end or beside it, in its own colour. A legend only when direct labels would collide. Label backings are the plate colour at 85 percent, no box.
- **Nodes in block diagrams.** Plate fill, a 1.5 px outline in the node's code colour, ink text. A lit node fills with its colour at 15 percent.
- **Controls.** Sliders use the accent. One to three at most. Play and Pause are plain buttons. "Enlarge" is a plain button at the top right of the plate.
- **Caption.** Label size (13/19), sans, roman, `--ink-2`, under the controls. It tells the reader what to look at or try, in one or two sentences.
- **Heat maps.** A single-hue ramp from the plate colour to blue for magnitudes; blue to red through the plate colour for signed values. Never a rainbow.

The prototype reaches this without changing `js/viz.js`: it translates each colour and font the renderer asks for on the way to the canvas (`figColor` in `js/look.js`). That is a bridge. Step 13 puts the theme into the renderer and removes the bridge.

---

## 5. Rollout plan

Ranked by what a visitor sees per hour of work: light and tone first (they change every pixel for almost no work), then materials and surfaces, then the interface, and last the models that have to be rebuilt. Each step can be merged alone. The scene plans in `notes/realism/*.md` give line numbers for each; this table is their order and their shared foundation. "Check" is in addition to section 6.

| # | step | what changes | files | cost at run time | risk | check |
|---|---|---|---|---|---|---|
| 1 | **Foundation into the engine** | `js/look.js` section 1 to 5 becomes part of the engine: renderer set-up, the shader conversions, `LOOK.env`, `LOOK.material`, `LOOK.patch`, per-frame exposure and glow. Switches move to `js/perf.js` and the meter. | `js/engine.js` (renderer, `Frame.ensure`, `bloomTarget`), `js/perf.js`, `js/nodes.js` (`illoMat`, `toonGrad` goes), `js/helpers.js` (`smat` through the table), `index.html` | one `pow` and the standard BRDF per lit fragment | medium: every scene changes at once; keep `?look=1` as the way back for one release | every landmark, flag on and off; `t_perf_budget.py`; no console errors |
| 2 | **Every scene gets its rig** | each frame type is listed as outdoors, model or neither and loses its own hemisphere and second lights; diagrams become unlit | the light lines in `js/levels_v2.js`, `js/world_matter.js`, `js/nodes.js`, `js/particles.js`, `js/atom.js`, `js/teardown.js`, `js/world_space.js` | fewer lights | medium: each scene must be looked at | at every landmark no surface clipped, no scene still on its old lights (`LOOK.audit`, to write) |
| 3 | **Interface** | tokens, type scale, three buttons, one segmented control, the right-hand column, sheets (section 2) | `css/app.css` and the five other stylesheets; `css/look.css` is folded in | none | medium: other work touches `css/app.css` | `t_ui_panel.py`, `t_ui_clicks.py`, `t_c2_phone.py`; start view and a card at 1280 and 390 |
| 4 | **Surfaces of the park** | bark, rock, soil, mud and pebble sets; every thing's parts given a kind in its data (`"kind": "bark"`) instead of guessed from names; assets re-encoded to the budget of 3.14 | `data/things/*/thing.json`, `js/things.js`, `assets/look`, `assets/ATTRIBUTION.md` | six texture reads on detailed parts | low | each thing near; download size per view |
| 5 | **Lawn and ground** | turf detail (done), instanced blades near the eye with a real blade texture, the hills as ground, no hashed shells | `js/levels_v2.js` (`makeLawn`, `BUILD.life`), `js/world_matter.js` | to be measured: the lawn is already the heaviest part of the start view | medium | start view and park at 30 m within budget |
| 6 | **Sky, clouds, water** | clouds in the sky shader (noise), not lumps; the pond: ripples, depth tint, wet bank; haze brighter toward the Sun | `js/levels_v2.js`, `data/things/pond`, `js/things.js` | none; a planar reflection only at the top level | low | the pond from 2 m and 20 m; dusk and night |
| 7 | **A Sun shadow fitted to the view** | the shadow map covers what is on screen (2048 px near the eye) and is redrawn on change as now | `js/world_matter.js` (`shadowStep`), `js/levels_v2.js` | the same map, better used | medium | shadows of the person and the dog are their shapes; `t_followups.py sun` |
| 8 | **Skin and the body** | skin tone and its variation by region as vertex colour, nails, lips, eyes with the `eye` kind, hair cap; organs `wet`; the peel as glass, not a milky ghost | `js/nodes.js`, `js/body_core.js`, `tools/anatomy` | small | medium: `bodySurface` and the peel code set materials every tick | `t_body_core.py`, `t_descent.py`; the face at 0.5 m |
| 9 | **Occlusion baked into the models** | ambient occlusion per vertex written by the model tools into its own attribute, multiplied into ambient light only by a patch | `tools/things` (bake), `data/things/*`, `tools/anatomy`, the foundation (patch) | none at run time | medium: every bundle is rebuilt | triangle counts unchanged; the crotch of the oak, under the dog |
| 10 | **Models and diagrams** | cell, tissues, DNA, molecules, crystals as studio models with the word *Model* and their colour convention in the note; the proton, nucleus and Standard Model view as plain diagrams; decorative specks removed | `js/levels_v2.js`, `js/world_matter.js`, `js/particles.js`, `js/nodes.js`, `data/nodes` (notes) | fewer passes (no glow) | medium: each note must be checked against its picture | every claim in each note visible in the picture |
| 11 | **Leaves, bark coordinates, fur** | a photographed leaf atlas on the oak's cards; texture coordinates along trunks; shell fur on the dog | `tools/things` (generators), `data/things/oak`, `data/things/dog` | the dog and the oaks are the heaviest views already | high: geometry and bundles change | the view at the dog on a real graphics card |
| 12 | **Planets and deep space** | higher-resolution maps where staged; night lights and clouds in linear light; glow only on the Sun and stars | `js/world_space.js`, `assets/textures` | texture memory | low | Earth, Moon, Mars, Saturn; attribution |
| 13 | **Figures as plates** | a theme in the figure renderer (section 4); the bridge in `js/look.js` goes | `js/viz.js`, `tools/viz/viztest.html` | none | low | `viztest.html` for all files; `node tools/viz/validate.mjs` |
| 14 | **Labels, ruler, numbers, fonts, scene controls, phone bar, dark interface** | section 2 items not in step 3 | `js/engine.js` (labels), `js/engine_ui.js`, `index.html`, `assets/fonts` | none | low to medium | `t_all_landmarks.py`, `t_c2_phone.py` |
| 15 | **Top quality level** | planar reflection on the pond, screen-space occlusion, behind `fx=high` | the foundation, `js/engine.js` | one or two more scene renders and passes per frame | medium | only on a discrete graphics card; never the default |
| 16 | **Replacement models** | a sculpted or scanned head and hands; a real dog; see 3.13 | `data/anatomy`, `data/things`, `tools` | to be measured | high: licences, size, picking and layers must all survive | owner's decision first |
| 17 | **Retire the old look** | the toon path, the ink on every part, the flag; colours converted at creation instead of in the shader | everything in step 1 | saves the `pow` | medium | all of the above again |

The prototype covers step 1 as an add-on, step 2 for six frame types (park, body, cell, atom, molecule, crystal), the turf of step 5, a first guess at step 4 by name, and steps 3, 13 and parts of 14 for the interface.

---

## 6. Before you merge

For any new screen, control, scene or model. If an answer is no, it is not ready.

**Truth**
- [ ] Does the scene's note begin with its kind (*Model*, *Diagram*) unless it is a thing as it looks?
- [ ] Is every colour either the thing's sourced colour, a real map, or a convention that the screen names?
- [ ] Can each claim in the note be checked by looking at the picture?
- [ ] Is there anything decorative that could be read as data? Remove it.
- [ ] Is a model lit as a model (studio, neutral ground), and only a thing that stands in daylight lit by the sky?
- [ ] Is every stand-in (a texture of another species or rock, a generic cell) said?

**Light and material**
- [ ] Does the frame take its environment and exposure from the foundation, with at most one directional light of its own?
- [ ] Is every material a kind from `LOOK.KINDS`? Is anything metallic that is not metal, or mirror-smooth that is not water, glass or an eye?
- [ ] On a screenshot, is any lit surface clipped to white, or any colour purer than a real surface?
- [ ] Does everything that stands on something cast on it or sit on a contact shadow?
- [ ] Does anything glow that does not emit light?
- [ ] Is there an outline anywhere but on the part pointed at or selected?
- [ ] Does it still read at night and at dusk (`simTime`), and at the low quality level?

**Assets**
- [ ] Licence read on its own page, quoted in `assets/ATTRIBUTION.md`, file vendored (no new CDN)?
- [ ] Within the budget: 4 MB fetched for a view at the high level, nothing at the low level?

**Interface**
- [ ] Is every size from the scale, every colour a token, every radius one of three?
- [ ] How many primary buttons are on screen? (One.) How many kinds of button? (Three at most.)
- [ ] Does any box have both a border and a shadow, or a bar down one side?
- [ ] Does everything in the right-hand column share its width and edge?
- [ ] Is any text below 4.5:1, or below 11 px? Is anything italic that is not an honest note?
- [ ] Are numbers typeset: en dash, ×, superscripts, a space before the unit?
- [ ] Does it work at 390 px wide, with 44 px targets, and with the panel minimised?
- [ ] Does every control say what it does, starting with a verb? Does keyboard focus show?
- [ ] With reduced motion set, does anything still move in the interface?

**Cost**
- [ ] Does `t_perf_budget.py` pass with the look on? Any new full-screen pass, light, render target or transparent material?
- [ ] Is every costly effect behind `LOOK.part(...)` and absent at the low level?
- [ ] No console errors on load and along the feature's main paths.

**Looked at**
- [ ] Screenshots at 1280 × 800 and 390 × 844, before and after, side by side. If a view still reads as a game asset or a plastic toy, say so in the notes and say what it would take.
