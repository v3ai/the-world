# Figure spec reference (`data/viz/*.json`)

Every concept card can show a live figure. A figure file is a JSON object mapping **node id → spec**:

```json
{ "ohms_law_node": { "type": "plot", "x": [0, 12], "fns": [{ "f": "x/R", "label": "I = V/R" }],
                     "params": [{ "id": "R", "label": "resistance", "min": 50, "max": 1000, "value": 220, "unit": "Ω" }],
                     "caption": "Current rises in proportion to voltage." } }
```

The renderer is `js/viz.js`. Working examples of every type are in `data/viz/samples.json`. Preview a file with `tools/viz/viztest.html?file=<file>.json&from=0&n=24`, and validate it with `node tools/viz/validate.mjs data/viz/<file>.json`.

## Common fields (all types)

| field | meaning |
|---|---|
| `type` | one of the types below (required) |
| `caption` | 1–2 plain sentences: what to look at / try. Always include. |
| `params` | sliders: `[{id, label, min, max, value, step?, unit?}]`. Each `id` becomes a variable in expressions. |
| `readouts` | live numbers under the figure: `[{label, value: "<expr>", unit?}]` |
| `aspect` | height/width (default 0.62). `height` = fixed px. |

**Animation:** any expression that uses the variable `t` (seconds since shown) animates automatically, with a play/pause button.

## Expressions

Expressions are strings in a small, safe math language. They support:

- **Arithmetic:** numbers (`1e-3`), `+ - * / ^ %`, parentheses, comparisons `< > <= >= == !=` (giving 1/0), `&& || !`, and the ternary `c ? a : b`.
- **Variables:** `x`, `y` (the axes), `t` (time), `s` (curve parameter), plus slider ids. The constants are `pi e tau`.
- **Functions:**
  - `sin cos tan asin acos atan atan2 sinh cosh tanh exp log/ln log10 log2`
  - `sqrt cbrt abs floor ceil round sign min max pow hypot mod`
  - `step sinc sq clamp if(c,a,b) deg rad gauss(x,mu,sigma) fact choose erf`
  - waveforms: `square(x) saw(x) tri(x)`
  - noise: `rand(seed)`

There is no implicit multiplication: write `2*x`, not `2x`.

Text fields (`label`, `text`, `caption`, point labels) may embed live values with braces: `"τ = {R*C*1000} ms"`.

## Types

**plot**: y = f(x) curves.
- **Axes:** `x:[min,max]` and `y:[min,max]` (optional; auto-scales if omitted). `logx` and `logy` are booleans. `xlabel` and `ylabel` name the axes. `equal:true` gives equal scale on both axes.
- **Curves:** `fns:[{f, label?, color?, dash?, width?}]`.
- **Marks:**
  - `points:[{x, y, label?, color?}]` (expressions)
  - `shade:{f, from, to}`: area under a curve, for integrals
  - `tangent:{at, f?}`: a tangent line with its slope readout, for derivatives
  - `vlines:[{x, label}]` and `hlines:[{y, label}]`

Use it for functions, calculus, transients (`1-exp(-x/tau)`), I–V curves, waves (use `t` to make them travel), and growth or decay.

**parametric**: curves `x(s), y(s)`. Give `range:[x0,x1,y0,y1]` and `curves:[{x, y, s:[a,b], color?, dot?}]`, where `dot` is an expression for the `s` value at which to draw a moving dot. The default is equal aspect. Use it for circles, ellipses, Lissajous figures, orbits, and the unit circle with `dot:"t"`.

**field**: a 2D vector field.
- **Range:** `range:[x0,x1,y0,y1]`.
- **Source of the field:** either `vx`, `vy` (expressions in x, y) or `charges:[{x, y, q}]` for an electric field computed by Coulomb's law.
- **Drawing options:** `streamlines:true` adds field lines. `mode:"stream"` draws only lines. `potential:true` adds a potential heatmap (charges only). `density` sets the number of arrows.
- **Overlays:** `shapes:[...]` (geometry shapes, see below).

**heatmap**: a scalar field f(x, y) drawn as colour.
- **Fields:** `f`, `x:[..]`, `y:[..]`, `z:[min,max]?`, `colormap:"heat"|"diverging"`, `equal?`, `shapes?`.
- **Uses:** probability densities |ψ|², potentials, temperatures and intensities.

**surface**: a 3D surface z = f(x, y) that the reader can rotate by dragging.
- **Fields:** `f`, `x`, `y`, `z?`.
- **Uses:** multivariable functions, potential wells and saddle points.

**vectors**: linear-algebra plane with `range` (number).
- **Matrix:** `matrix:[["a","b"],["c","d"]]` draws the transformed grid, the image of the unit square (its area is the determinant) and the transformed basis vectors.
- **Eigenvectors:** `eigen:true` draws them as dashed lines.
- **Vectors:** `vectors:[{x, y, label?, color?, transform?, from?:[x,y]}]`.
- **Uses:** vectors, dot and cross ideas in 2D, matrices, eigenvalues and linear maps.

**phasor**: rotating arrows plus their sine waves. Give `phasors:[{mag, deg, label, color?}]`, `omega`, and `sum:true` (or a label string) to draw the vector sum. Use it for AC, phase, impedance, interference and three-phase power.

**signal**: a time signal `f` (with `x` as the time variable).
- **Fields:** `x:[t0,t1]` and `y?`.
- **Sampling:** `sample:"<fs expr>"` draws sample stems plus the sinc reconstruction. Set `reconstruct:false` to hide the reconstruction.
- **Spectrum:** `spectrum:true` draws the DFT magnitude underneath, and `fmax` limits its range.
- **Uses:** sampling, aliasing, Fourier series, modulation, noise, filters in the time domain, and PWM.

**bode**: frequency response from a transfer function. Either:
- **Pole/zero form:** `poles:[[re,im],...]`, `zeros:[...]` and `k`. It is DC-normalised: each factor is (1 − s/r), so `k` is the DC gain.
- **Polynomial form:** `num:[...]` and `den:[...]`, coefficients in s from highest power first.

Other fields: `w:[ωmin,ωmax]` (log), `unit`, and `phase:false` to hide the phase plot. A −3 dB marker is drawn automatically. Use it for filters, amplifiers, control loops and resonance (complex poles).

**pz**: the s-plane (or `plane:"z"` for the unit circle) with `poles` and `zeros`.
- **Fields:** `range`.
- **Root locus:** `rootlocus:{num, den, K:"<expr>"}` draws the locus plus the current poles for gain K.
- **Uses:** stability, root locus, digital filters (z-plane) and damping.

**blocks**: a block or flow diagram.
- **Nodes:** `nodes:[{id, label, x, y, shape?:"box"|"circle"|"sum"|"diamond", color?}]`, with x and y in 0–100 (a percentage of the width and height).
- **Edges:** `edges:[{from, to, label?, dashed?, color?}]`.
- **Animation:** `flow:true` animates tokens along the edges.
- **Uses:** systems, control loops, pipelines, protocols, OSI layers, data flow, the power grid, signal chains, the parts of a process, and biology pathways.

**graph**: nodes and edges for graph theory, trees and networks.
- **Fields:** `nodes:[{id,label?}]`, `edges:[[a,b,label?],...]`, `directed?`.
- **Layout:** `layout:"circle"|"tree"|"layered"|"row"`, or give x and y on the nodes.
- **Animation:** `steps:[[ids],[ids],...]` lights up nodes step by step, for algorithms such as BFS, DFS, Dijkstra and sorting.

**fsm**: a finite state machine.
- **Fields:** `states:[{id, accept?}]`, `start`, `transitions:[[from,to,"label"],...]` and `input:"0110"`.
- **Behaviour:** the machine reads the input string symbol by symbol (animated). The first character of a transition label is the input symbol.

**logic**: a combinational circuit drawn from a Boolean expression, with a clickable truth table.
- **Fields:** `inputs:["A","B"]`, `expr:"(A & B) | !C"`, `output:"Y"`.
- **Operators:** `& | ! ^`, words AND, OR and NOT, and functions `nand(a,b) nor xor xnor`.

**kmap**: a Karnaugh map. Fields: `vars:[2–4 names]`, `minterms:[...]`, `dontcare?`, `groups?:[[minterms],...]`.

**dist**: a probability distribution.
- **Kinds:** `kind:"normal"|"uniform"|"exponential"|"binomial"|"poisson"|"geometric"|"custom"`.
- **Parameters:** `mu, sigma, a, b, lambda, n, p`, as expressions. For `custom`, give `f` and `x`.
- **Options:** `shade:[a,b]` shows the probability of that range. `sample:true` animates a histogram of random draws, for the law of large numbers and the central limit theorem.

**ode**: a system of differential equations, solved numerically (RK4). Use it for population dynamics, epidemics, chemical kinetics, circuits, orbits and control loops.
- **Fields:**
  - `vars:[{id, init, f, label?, color?, hide?}]`, where `f` is the expression for d(id)/dt. It may use every var id, the params, and `time`.
  - `t` is the end time; `steps` (default 1200) sets the resolution.
  - Optional: `y:[min,max]`, `xlabel`, `ylabel`.
- **Phase portrait:** `phase:["N","P"]` plots one variable against another, with a moving dot (`xr` and `yr` are optional ranges).
- **Example:** `data/viz/curated.json` holds the SIR epidemic and Lotka–Volterra models.

**bits**: a binary word with clickable bits. Fields: `bits` (count), `value`, and `mode:"unsigned"|"twos"`. Use it for number systems, registers and two's complement.

**bars**: a comparison bar chart. Fields: `bars:[{label, value, color?}]`, `logy?`, `ylabel?`. Use it for orders of magnitude and comparing quantities.

**table**: a small table. Fields: `cols:[...]`, `rows:[[...]]` (cells may contain `{expr}`). Use sparingly: prefer a picture.

**geometry**: a free drawing canvas with `range:[x0,x1,y0,y1]` (equal aspect by default), plus `axes?` and `grid?`.
- **Shapes:** `shapes:[{k, ...}]`. Every numeric field may be an expression, which makes the shapes move with sliders or `t`.
- **Shape kinds:**

| shape | fields |
|---|---|
| `line` | `x1, y1, x2, y2` |
| `arrow` | `x1, y1, x2, y2` |
| `circle` | `x, y, r, fill?, stroke?` |
| `point` | `x, y, size?` |
| `rect` | `x, y, w, h, fill?` (x, y is the bottom-left corner) |
| `poly` | `pts:[[x,y],...], fill?, closed?` |
| `arc` | `x, y, r, a0, a1` |
| `curve` | `x:"expr(s)", y:"expr(s)", s:[a,b]` |
| `text` | `x, y, text, size?, align?` |
| `spring` | `x1, y1, x2, y2, coils?` |

- **Common shape options:** `color`, `width`, `dash`, `alpha`, `when:"<expr>"` (draw only when non-zero).
- **Uses:** mechanics (forces, levers, pendulums with `t`), optics (rays, lenses), atoms, cross-sections, timing diagrams and anything bespoke.

## Colours

Names: `accent` (cyan), `gold`, `pink`, `green`, `purple`, `orange`, `red`, `blue`, `white`, `dim`, or any `#hex`.

## Guidelines for authors

- **Interactive:** make the figure interactive where possible. One to three sliders that change the key quantity, with a readout of the result. The figure should show *how the idea behaves*, not only what it looks like.
- **Accurate:** use correct formulas and realistic magnitudes. Use units in labels.
- **Simple:** one idea per figure, with a caption that tells the reader what to try.
- **Abstract topics:** prefer a `blocks` diagram (structure, flow) or a `geometry` sketch over a table.
- **Physical things:** if the thing already has a 3D model in the world (organs, phone parts), still give a 2D figure, for example a schematic, a cross-section, a block diagram of how it works, or the key curve.
- **Keep it small:** under ~2 KB per spec. No HTML.
