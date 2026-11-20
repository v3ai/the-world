# Design system

This is how The World looks and why. It is written so that someone who has never seen the app can apply it, and so that a reviewer can check a screen against it. The first rule of the app stands above everything here: it tells the truth. Design serves that rule. A picture that looks better and says something false is a fault.

The system exists in two forms today:

- **This document**, which is the specification.
- **A prototype**, `css/look.css` and `js/look.js`, switched on with `?look=2` in the address and off by default. It applies the system to the start view, a card and its figure, the lists, search, the ruler, and to six kinds of scene. The rollout plan at the end moves it, part by part, into the engine and the main stylesheet. `?look=2&lookoff=tone,ink` switches named parts off again so that each can be judged alone on a real graphics card (the list is at the top of `js/look.js`); `?look=2&theme=dark` shows the dark interface.

Values in this document are the values in the prototype. Where the two differ, the document is right and the prototype is wrong.

## Contents

1. Principles
2. Interface
3. Illustration
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

One panel to read in. One accent. One index colour. Three kinds of button. One segmented control. One type scale. One shading ramp. One ground for each kind of picture. When a second version of a thing appears, one of the two is a mistake.

- **Do:** use the segmented control for the body's layers, a card's Basics, Deeper and Expert, and the meter's switches alike.
- **Don't:** ship the start view with seven visibly different buttons, or give each new scene its own background colour and its own lights.

### 3. Type and space first, lines and boxes last

Order of importance is shown by size, weight and distance. A rule or a box is used only where those are not enough, and a box never gets both a border and a shadow.

- **Do:** set a card as a title, one lead sentence, then reading text, with sections parted by space and one hairline.
- **Don't:** put a coloured bar down the left edge of a paragraph to make it a "note", or bold a whole sentence at body size.

### 4. The picture says what kind of picture it is

A learner must be able to tell, before reading anything, whether a scene shows the thing as it would look or a diagram of it. So the two are drawn differently, always in the same way. Things with a true appearance (the park, the body's surface, the Earth, the stars) get the light and the ground they really have. Things with none (a cell's colours, a molecule's balls, a proton) are drawn as plates: on paper, matte, coloured by category, without glow. The words next to the picture then say exactly what is true in it.

- **Do:** draw the cell on a paper ground with a key, and say "Schematic" in the note.
- **Don't:** give quarks a glossy highlight, light a molecule until its element colours burn out to white, or scatter blue specks round the DNA as decoration. Each of these says something untrue.

### 5. Nothing clips, nothing floats, nothing jumps

Light adds up to white and no more, so colours stay the colours that were chosen. Everything that stands on a surface is joined to it by a shadow. Far things take the colour of the air. Motion eases, can always be interrupted, and stops.

- **Do:** give every rig a key and a fill that sum to about 1.0, and put a soft shadow under the person on the lawn.
- **Don't:** add a second light "to brighten it up". The lawn was lime green because its lights summed to 1.9.

---

## 2. Interface

### 2.1 Type

**Families.** Two, each with a job.

| role | stack | notes |
|---|---|---|
| serif: titles and reading text | `ui-serif, 'Source Serif 4', 'Source Serif Pro', 'Iowan Old Style', Georgia, serif` | `ui-serif` gives the platform's own serif where the browser supports the keyword; everywhere else Source Serif 4 (SIL Open Font Licence) |
| sans: controls, labels, numbers | `-apple-system, BlinkMacSystemFont, 'IBM Plex Sans', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif` | the platform's own sans on Apple systems; everywhere else IBM Plex Sans (SIL Open Font Licence) |

Platform fonts are reached only through these CSS keywords, which use what is already installed on the reader's machine. They are never downloaded, copied or shipped: their licences do not allow it. The two open families are to be self-hosted from `assets/fonts` (rollout step 10); until then they come from Google Fonts as now. No third family. `js/viz.js` currently asks for Inter and Space Grotesk, which are not loaded; that is a fault (step 4).

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
- Still to do (step 9): show side stops only within three decades of where you are, so that no more than about twenty names are ever on the ruler.

**Labels in the scene.** Names, set like names on a map.

- Small sans, weight 500, 12/16. A label sits above the thing it names with a 7 px stem pointing down at it. There is no dot: a mark must be on the thing or not exist.
- On a dark scene the words are paper with a crisp ink halo; on a light scene (the park by day, a plate) they are ink, weight 600, with a paper halo. The halo is eight 1 px offsets and a soft 6 px one, which reads on grass, sky and stars alike.
- "You", and the park's marker on the globe, are ink on the index colour.
- Labels have priorities already (`data-pri`); colliding labels hide the lower one. To add (step 7): primary labels at full strength and secondary at 60 percent; labels may not run under the ruler or the panel.
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
- With `prefers-reduced-motion`, every interface transition is removed. Flights should become a short cross-fade (step 7 covers this; today they still fly).

### 2.6 Phone (860 px and narrower)

- The ruler is a 52 px strip. Tapping it lists the nearby stops.
- The main buttons run across the top; search is a button that opens a full-screen field.
- The panel is a sheet at the bottom with a 36 × 5 handle: about a third of the height at rest, most of it when dragged up. The scene stays live above it.
- Library and Questions are sheets from just under the top bar to the bottom.
- Targets are 44 × 44. Title drops to Heading size; reading text stays 16/26.
- Still crowded (step 15): three stacked control boxes at the top. A scene's layer control should become one row that scrolls sideways.

### 2.7 The voice of controls

- A button starts with a verb and says what will happen: "Look inside", "See it from further out", "Show the skeleton". Not "OK", not "Go".
- A name is a name: "Library", "Questions", "Time".
- Sentence case. No exclamation marks. No "please". No "we".
- A hint is one sentence and can be dismissed for good.
- Never explain a control that explains itself, and never explain twice.
- When something cannot be done, say what is true: "No closer view of this has been built yet".

---

## 3. Illustration

One art direction for every scene. It has two modes, and principle 4 decides which applies.

- **As it looks.** The thing has an appearance: the park, the body's outside, animals and plants, rock, the Earth, planets, stars. It gets its real light and its real ground.
- **Plate.** The thing has no appearance at this scale, or the view is a diagram: tissues drawn cell by cell, the cell, DNA, molecules, crystals, the atom, the nucleus, the proton, the Standard Model view, a cut-open organ, the phone's chips. It is drawn on paper.

Both modes share the same shading, line and colour discipline. Each rule below gives its reason and what it costs to draw.

### 3.1 Light

**Rule L1. Light sums to 1.0.** On a surface facing the key, key plus fill is between 0.95 and 1.1. Nothing else is allowed to raise it.
*Reason:* three.js adds lights, and above 1.0 each colour channel clips on its own: green grass turns lime, skin turns yellow-white, form disappears. *Cost:* none.

**Rule L2. One key.** A scene has one key light, one fill from above and below (a hemisphere light), and nothing more. A second directional light is allowed only as a rim at 0.12 or less.
*Reason:* two keys make two sets of shading and no form. *Cost:* fewer lights is cheaper.

**The rigs.** A scene takes the rig of its kind and does not invent one.

| kind | key | fill | where the key is | examples |
|---|---|---|---|---|
| Daylight | the Sun: `0xfff1d6`, 0.86 after the park's share | sky `0xcfe6ff` over ground `0x4a6a2a`, 0.41 | the Sun's true direction for the date and time | the park and everything in it |
| The figure in daylight | `0xfff3e2`, 0.64 by day falling to 0.44 at night | sky `0xe6eefa` over lawn `0x7f8468`, 0.52 falling to 0.36 | the park's Sun while it is more than 8° up, otherwise its own lamp | the human body |
| Plate | `0xfffaf2`, 0.52 to 0.56 | `0xf6f7f8` over `0x8d9096`, 0.46 to 0.50 | over the viewer's left shoulder, moving with the view | cell, molecule, crystal, atom models |
| Cosmic | the Sun, 1.0 | 0.08 or less | the Sun's true direction | Earth, Moon, planets |

- *Daylight:* every surface in the park takes the same share of the Sun and the sky. The lawn used to take 1.15 and 0.75 while the things on it took 0.86 and 0.41.
- *The figure:* the person is lit by the same Sun as the trees, so the two agree. At night the model keeps a lamp of its own so that it can still be read; the note on the card says it is a model.
- *Plate:* the lamp follows the viewer, as the lamp over a drawing board does. Turn the object and the light stays upper left, which is the convention of scientific drawing and guarantees that no view is in the dark.
- *Cosmic:* space has no fill. The night side is dark because it is.

**Rule L3. The tone curve.** Colours below 0.8 pass through unchanged. Above it they bend toward white (`k + (1−k)(1 − e^−(x−k)/(1−k))`, k = 0.8), and a colour far over the top loses up to 30 percent of its saturation.
*Reason:* a highlight that rolls off looks like light; one that clips looks like an error. The curve is written for this app, whose colours are stored as the colours to show; a film curve made for linear light would grey them. *Cost:* one `exp` per fragment in built-in materials; no pass.

**Rule L4. Glow is for things that shine.** Stars, the Sun, a lit screen, a spark. Not a cell, not a molecule, not a planet seen close.
*Reason:* glow says "this emits light". On a molecule it also washed out the element colours. *Cost:* removing it removes eleven full-screen passes from those views.

### 3.2 Shading

**Rule S1. The ramp.** Every illustrated material is shaded by one ramp with three zones and drawn edges.

| zone | where (n·l) | value multiplied into the colour |
|---|---|---|
| shadow | below −0.14 | (0.60, 0.635, 0.74): darker and cooler |
| half tone | 0.18 to 0.38 | (0.87, 0.875, 0.885) |
| light | above 0.92 | (1.0, 0.985, 0.955): full and slightly warm |

The shadow edge is a smooth step from −0.14 to 0.18; the light builds from 0.38 to 0.92.
*Reason:* a shadow that only darkens turns skin brown and leaves green; one that also cools reads as shade under a sky. The soft edge draws the form; four hard steps drew stripes. The range is deliberately short (0.6 to 1.0): this is illustration, and every part must stay readable on its dark side. *Cost:* two smoothsteps in place of a texture read; cheaper than before.

**Rule S2. The rim.** On the lit side only, a surface turning away from the eye gains up to 0.20 of the key (`(1 − n·v)³`).
*Reason:* it separates a form from what is behind it without a line. *Cost:* one `pow` per light per fragment.

**Rule S3. Occlusion.** Three sources, cheapest first: the hemisphere fill, whose ground colour is darker than its sky colour, so that undersides are darker; a contact shadow (3.4); and, for procedural models, occlusion baked into vertex colours by the model tools (step 13). No screen-space pass.
*Reason:* shading where surfaces meet is what makes a model one object. *Cost:* none at run time.

### 3.3 Line

**Rule I1. A thin line in the part's own colour.** An outline is 1.2 px on screen at any distance (the engine's inverted hull, 0.62 of its old width). Its colour is the fill's hue at 30 percent of the fill's lightness and slightly more saturation. A white or grey part keeps the ink `0x1a1f2b`.
*Reason:* a black line 2 px wide round every part is the look of a colouring book and swallows thin parts. A dark line of the same hue bounds the shape and belongs to it. *Cost:* none beyond the hull already drawn.

**Rule I2. Line fades with distance.** As now: full when a thing is more than 70 px tall on screen, gone below 40, never on the far detail tier.

**Rule I3. Line carries state.** Pointed at or selected: the outline turns to the accent `0x1e4e8f` at full strength, and nothing else about the part changes. A thing that cannot carry an outline (a star, a marker) gets the white ring. Other parts are never dimmed to make a selection stand out, except when a card asks to reveal something that is behind them.

### 3.4 Ground, sky and air

**Rule G1. Everything on a surface casts on it.** Trees cast into the Sun's shadow map. Everything that cannot (the person, the dog, the mushroom, a boulder, a flower) gets a soft dark ellipse under it, 2.5 times its footprint, at 34 percent, leaning away from the Sun and lengthening as the Sun gets low; it fades out at night.
*Reason:* without it a thing is pasted on the lawn. *Cost:* one instanced draw call for all of them.

**Rule G2. A quiet sky.** Deep blue (0.27, 0.47, 0.80) only overhead; a middle blue (0.55, 0.72, 0.90) a quarter of the way up; pale (0.86, 0.90, 0.93) and wide at the horizon, as a real sky is. Dithered by half a level so the gradient does not band.
*Reason:* a saturated sky competes with the subject and flattens distance. *Cost:* none.

**Rule G3. Far things take the colour of the horizon.** Fog from 28 m to 200 m in the park, in exactly the sky's horizon colour, darkening with the Sun.
*Reason:* the cheapest depth cue there is, and a true one. *Cost:* none.

**Rule G4. The ground of a plate is paper.** `0xe6e8e8`, one value for every plate. Nothing on a plate glows; nothing fades into darkness. Space is black because space is black; no other scene is.
*Reason:* the ground is the first thing that says "diagram". Nine near-black backgrounds said "night" eleven different ways. *Cost:* none.

### 3.5 Colour and material

**Rule C1. True colour where there is one.** Skin, bark, leaves, feathers, rock, water, the Earth, a star's temperature: the colour is the thing's, taken from a source or a photograph, and it is not tuned for effect. Because light now sums to 1.0, the colour chosen is the colour shown.

**Rule C2. Where there is none, colour is a code, and the code is fixed.** One table for the whole app, kept in one place, used by scenes and figures alike:

| meaning | ink on a plate |
|---|---|
| structure, membrane, "the thing itself" | blue `#1e4e8f` |
| energy, heat, arteries, oxygenated | red `#b4412f` |
| growth, plant, safe, reduced | green `#3f7a3a` |
| signal, nerve, stored energy, a live value | ochre `#96690a` |
| information, nucleus, genetic | violet `#6b4a9c` |
| water, flow, veins | teal `#1f7a78` |
| neutral, inert, background structure | grey `#5d6670` |

Element colours follow the CPK convention and must be legible: carbon dark grey, hydrogen light grey with a line, nitrogen blue, oxygen red. If the screen says "CPK colours", a learner must be able to check it by looking.
*Reason:* a colour that means one thing in the cell and another in the next figure teaches nothing. The cell and DNA were coloured with the stock palette of a web framework. *Cost:* none.

**Rule C3. Saturation is spent, not sprayed.** On a plate, fills sit between 36 and 56 percent lightness and below 58 percent saturation. One element may be brighter: the one the view is about.

**Rule C4. Materials differ by three things only:** how wide the shading range is, whether there is a highlight, and whether light passes through.

| material | shading | highlight | through |
|---|---|---|---|
| skin, leaf, petal, fur, feather | the ramp | none | no |
| bark, rock, soil, bone | the ramp, plus baked occlusion when available | none | no |
| wet tissue, the eye, a beetle's shell | the ramp | one small soft highlight | no |
| metal, glass, a phone's screen | standard material, roughness 0.35 to 0.5 | yes | glass only |
| water | flat colour, darker with depth, a pale line at the edge | a broad faint one toward the Sun | yes |
| a membrane or shell on a plate | a tinted, see-through rim, strongest at the edge | none | yes |
| a point cloud (the atom, stars) | unlit | none | additive only on black |

No material is glossy unless the thing is. Quarks, nucleons and organelles are not.

### 3.6 Cuts, stand-ins and markers

- **A cut face** is flat: unlit, in the section colours of what was cut, bounded by a line 1.5 times the normal weight. It never takes the shading of an outside surface, so it cannot be mistaken for one. Its key is in the panel.
- **A stand-in** (a generic animal cell opened from a liver) is always a plate, and its note begins "A stand-in."
- **Not to scale** is said in the note and, where a single part is exaggerated, in the key ("drawn 40 times thicker than real").
- **Markers** (the points on a cut-open organ) are white discs 10 px across with a 1 px ink ring; the selected one takes the accent. They are not yellow: yellow is the index.
- **A scale bar** on a plate is a hairline with end ticks and a Small label.
- **Decoration that could be data is forbidden.** No specks for "water", no starfield behind a molecule, no orbit rings that are not orbits.

### 3.7 What must never be done

- A light added to brighten a scene.
- A gloss, glow or gradient that the thing does not have.
- A new background colour, or a new rig, for one scene.
- A colour from outside the code table on a plate.
- A full-screen pass in a view whose budget is zero.
- Depth of field, vignettes or lens effects: the eye here is an instrument, not a camera.
- A label that is a box, or a mark that sits on nothing.

---

## 4. Figures and diagrams (`js/viz.js`)

A figure is a plate on the card, not a screen.

- **Ground.** `--plate`, radius 9, a 1 px `--rule` outline. No frame inside it.
- **Type.** The sans stack. Tick labels Micro (11) in `--muted`; axis names and direct labels Small (12) weight 500 in `--ink-2`; values that change are `--ink`. No other sizes.
- **Axes.** One hairline each, ink at 35 percent, through zero when zero is in range. Grid lines ink at 7 percent, or none. Ticks are numbers only; the unit is in the axis name.
- **Line weights.** Data 2 px. Secondary curves and construction lines 1.25 px. Axes 1 px. Dashes only for "not real" (an asymptote, a prediction, a return path).
- **Colour.** The code table of rule C2, in this order when a figure has no meaning to attach: blue, red, green, ochre, violet, teal. In dark mode the same hues lightened (`#8db8f2`, `#f0907c`, `#93c98a`, `#e2b659`, `#b9a0e6`, `#74cfc9`). All twelve are 4.6:1 or better on their plate. A figure uses as few as it can: one series is blue.
- **Annotation.** Label the curve at its end or beside it, in its own colour. A legend only when direct labels would collide. Label backings are the plate colour at 85 percent, no box.
- **Nodes in block diagrams.** Plate fill, a 1.5 px outline in the node's code colour, ink text. A lit node fills with its colour at 15 percent.
- **Controls.** Sliders use the accent. One to three at most. Play and Pause are plain buttons. "Enlarge" is a plain button at the top right of the plate.
- **Caption.** Label size (13/19), sans, roman, `--ink-2`, under the controls. It tells the reader what to look at or try, in one or two sentences.
- **Heat maps.** A single-hue ramp from the plate colour to blue for magnitudes; blue to red through the plate colour for signed values. Never a rainbow.

The prototype reaches this without changing `js/viz.js`: it translates each colour and font the renderer asks for on the way to the canvas (`figColor` in `js/look.js`). That is a bridge. Step 4 puts the theme into the renderer and removes the bridge.

---

## 5. Rollout plan

Ranked by what a visitor sees per hour of work. Each step can be merged alone. "Check" is in addition to the checklist in section 6.

| # | step | what changes | files | risk | check |
|---|---|---|---|---|---|
| 1 | **Light that adds up** | every rig set from the table in 3.1 by one helper, `rig(F, kind)`; the park's own materials take the same share as its things | `js/helpers.js` (new helper), the light lines in `js/levels_v2.js`, `js/world_matter.js`, `js/nodes.js`, `js/things.js`, `js/particles.js`, `js/atom.js`, `js/teardown.js` | medium: `js/things.js` reads the Sun's intensity as a fraction of 1.15 to know the time of day; keep that constant or change both | at every landmark, no lit surface has a channel at 255 outside a highlight; `t_perf_budget.py`; `t_followups.py light sun` |
| 2 | **Ramp, rim and tone curve** | the three shader chunks, set once at start-up | `js/nodes.js` (`toonGrad` goes), `js/engine.js` (renderer set-up) | low | before and after pairs of the body, a thing and a tissue; `t_perf_budget.py` |
| 3 | **Interface tokens and components** | tokens, type scale, three buttons, one segmented control, the right-hand column, sheets | `css/app.css`, `css/search.css`, `css/trails.css`, `css/atom.css`, `css/particles.css`, `css/things.css`; `css/look.css` is folded in and deleted | medium: other work touches `css/app.css`; merge section by section | `t_ui_panel.py`, `t_ui_clicks.py`, `t_c2_phone.py`, `t_c2_nav.py`; the start view and a card at 1280 and at 390 |
| 4 | **Figures as plates** | a theme object in the renderer (colours, fonts, weights from section 4); the bridge in `js/look.js` goes | `js/viz.js`, `tools/viz/viztest.html` | low | `viztest.html` for all 19 files; `node tools/viz/validate.mjs`; no font named that is not loaded |
| 5 | **Ground and air in the park** | contact shadows, the sky, haze | `js/levels_v2.js` (`BUILD.life`), `js/world_matter.js` (the park) | low | start view, park at 30 m, an oak; one more draw call and no more |
| 6 | **Line** | weight and tint in the three outline materials | `js/nodes.js` (`outlineMat`, `inked`), `js/things.js` (`thOutlineMat`, `thInked`, the instanced outline) | low | the body's organs, the robin, a tissue |
| 7 | **Labels** | light and dark, stems, two strengths, anchors moved onto their things, no label under the chrome, flights under reduced motion | `js/engine.js` (labels), `css/app.css` | medium: label offsets are per scene | every landmark with labels on; `t_c2_fade.py` |
| 8 | **Plates** | paper ground, the code table, matte materials and no glow for the cell, DNA, molecules, crystals, nucleus, proton and the Standard Model view; decorative specks removed; markers redrawn | `js/levels_v2.js`, `js/world_matter.js`, `js/particles.js`, `js/nodes.js` | medium: each scene needs its colours chosen and its note checked against the picture | each scene against its own note: every claim in the note visible in the picture |
| 9 | **The ruler and numbers** | side stops shown only near where you are; numbers on cards typeset (en dash, superscripts, thin spaces) by one formatter | `js/engine_ui.js` (`buildRuler`, `updateRuler`, card facts) | low | `t_all_landmarks.py`, `t_tours.py`; no caret or hyphen-range left on any card |
| 10 | **Fonts** | Source Serif 4 and IBM Plex Sans self-hosted (OFL), the stacks of 2.1, the Google Fonts link removed | `index.html`, `assets/fonts`, `assets/ATTRIBUTION.md`, `css/app.css` | low | the page with the network blocked; a Mac, a Windows machine and a phone |
| 11 | **Scene controls** | one segmented row per scene; everything else moves into a panel section | `js/atom.js`, `js/things.js`, `js/particles.js` | medium | the atom, the dog, the robin, the bee at 1280 and 390 |
| 12 | **Labs** | the two labs restyled with the tokens: no capitals, no pills, no left bars | `js/labs/circuit.js`, `js/labs/device.js` and their styles | medium | every preset opens; `tools/labtest` |
| 13 | **Baked occlusion** | occlusion written into vertex colours when a thing is baked | `tools/things` (bake script), `data/things/*` | medium: every bundle is rebuilt | triangle counts unchanged; the oak and the robin near |
| 14 | **Dark interface** | the dark tokens follow the system setting | `css/app.css` | low | every component in both; contrast table re-run |
| 15 | **Phone top bar** | the main buttons, search and a scene's control in two rows at most | `css/app.css`, `js/engine_ui.js` | medium | `t_c2_phone.py`, `t_ui_panel.py --phone` |
| 16 | **Linear light** | sRGB output and converted colours throughout, so that light adds as it does in the world | `js/engine.js`, every custom shader | high: every colour in the app shifts | all of the above again. Do it last, and only if steps 1 and 2 leave something wanting. |

Steps 1, 2, 5 and 6 are what the prototype's 3D look consists of; 3, 4 and part of 7 and 9 are its interface. Step 8 is prototyped for the cell only.

---

## 6. Before you merge

For any new screen, control, scene or model. If an answer is no, it is not ready.

**Truth**
- [ ] Is every colour either the thing's true colour or one from the code table, and does the screen say which?
- [ ] Can each claim in the scene's note be checked by looking at the picture?
- [ ] Is there anything decorative that could be read as data? Remove it.
- [ ] Does the ground say what kind of picture this is (real light and ground, or paper)?

**Light and form**
- [ ] Does the scene use the rig of its kind, unchanged? Do key and fill sum to between 0.95 and 1.1?
- [ ] On a screenshot, is any lit surface clipped to white or to a pure hue?
- [ ] Does everything that stands on something cast on it?
- [ ] Does anything glow that does not shine? Is anything glossy that is not?
- [ ] Are outlines in the part's own dark, and no thicker than 1.2 px?
- [ ] Are shadows cooler, not only darker?

**Interface**
- [ ] Is every size from the scale, every colour a token, every radius one of three?
- [ ] How many primary buttons are on screen? (One.) How many kinds of button? (Three at most.)
- [ ] Does any box have both a border and a shadow, or a bar down one side?
- [ ] Does everything in the right-hand column share its width and edge?
- [ ] Is any text below 4.5:1, or below 11 px? Is anything italic that is not an honest note?
- [ ] Are numbers typeset: en dash, ×, superscripts, a space before the unit?
- [ ] Does it work at 390 px wide, with 44 px targets, and with the panel minimised?
- [ ] Does every control say what it does, starting with a verb?
- [ ] Does keyboard focus show on every control?
- [ ] With reduced motion set, does anything still move in the interface?

**Cost**
- [ ] Does `t_perf_budget.py` pass? Are there new full-screen passes, lights or transparent materials?
- [ ] No console errors on load and along the feature's main paths.

**Looked at**
- [ ] Screenshots at 1280 × 800 and 390 × 844, before and after, side by side, judged by someone other than the author if possible.
