"""Helpers for building figure specs."""
import math

def P(id, label, mn, mx, val, unit=None, step=None):
    d = {'id': id, 'label': label, 'min': mn, 'max': mx, 'value': val}
    if unit: d['unit'] = unit
    if step: d['step'] = step
    return d

def R(label, value, unit=None):
    d = {'label': label, 'value': value}
    if unit: d['unit'] = unit
    return d

HEX = {'accent': '#6ee7ff', 'gold': '#ffd166', 'pink': '#ff8fb1', 'green': '#9be37b', 'purple': '#b388ff', 'orange': '#ffa94d', 'red': '#ff6b6b', 'blue': '#5b9cff', 'white': '#e8ecf5', 'dim': '#98a2b8'}

def F(f, label=None, color=None, dash=False, width=None):
    # NOTE: js/viz.js plot fns use the raw color string (names are not resolved), so emit hex.
    color = HEX.get(color, color)
    d = {'f': f}
    if label: d['label'] = label
    if color: d['color'] = color
    if dash: d['dash'] = True
    if width: d['width'] = width
    return d

def spec(type_, caption, params=None, readouts=None, **kw):
    d = {'type': type_}
    d.update(kw)
    if params: d['params'] = params
    if readouts: d['readouts'] = readouts
    d['caption'] = caption
    return d

def plot(fns, caption, x, y=None, params=None, readouts=None, **kw):
    fl = [f if isinstance(f, dict) else F(*f) for f in fns]
    if y is not None: kw['y'] = y
    return spec('plot', caption, params, readouts, x=x, fns=fl, **kw)

def blocks(nodes, edges, caption, flow=True, params=None, readouts=None, **kw):
    """nodes: (id,label,x,y[,color[,shape]]) ; edges: (a,b[,label[,dashed]])"""
    N = []
    for n in nodes:
        d = {'id': n[0], 'label': n[1], 'x': n[2], 'y': n[3]}
        if len(n) > 4 and n[4]: d['color'] = n[4]
        if len(n) > 5 and n[5]: d['shape'] = n[5]
        if d['label'] is None: del d['label']
        N.append(d)
    E_ = []
    for e in edges:
        d = {'from': e[0], 'to': e[1]}
        if len(e) > 2 and e[2]: d['label'] = e[2]
        if len(e) > 3 and e[3]: d['dashed'] = True
        E_.append(d)
    return spec('blocks', caption, params, readouts, nodes=N, edges=E_, flow=flow, **kw)

def geo(shapes, rng, caption, params=None, readouts=None, **kw):
    return spec('geometry', caption, params, readouts, range=rng, shapes=shapes, **kw)

# ---- geometry shape helpers ----
def line(x1, y1, x2, y2, color=None, width=None, dash=False, **kw):
    d = {'k': 'line', 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}
    if color: d['color'] = color
    if width: d['width'] = width
    if dash: d['dash'] = True
    d.update(kw); return d

def arrow(x1, y1, x2, y2, color=None, width=None, **kw):
    d = {'k': 'arrow', 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}
    if color: d['color'] = color
    if width: d['width'] = width
    d.update(kw); return d

def text(x, y, t, color=None, size=None, align=None, **kw):
    d = {'k': 'text', 'x': x, 'y': y, 'text': t}
    if color: d['color'] = color
    if size: d['size'] = size
    if align: d['align'] = align
    d.update(kw); return d

def circle(x, y, r, color=None, fill=None, **kw):
    d = {'k': 'circle', 'x': x, 'y': y, 'r': r}
    if color: d['color'] = color
    if fill: d['fill'] = fill
    d.update(kw); return d

def rect(x, y, w, h, color=None, fill=None, **kw):
    d = {'k': 'rect', 'x': x, 'y': y, 'w': w, 'h': h}
    if color: d['color'] = color
    if fill: d['fill'] = fill
    d.update(kw); return d

def point(x, y, color=None, size=None, **kw):
    d = {'k': 'point', 'x': x, 'y': y}
    if color: d['color'] = color
    if size: d['size'] = size
    d.update(kw); return d

def poly(pts, color=None, fill=None, closed=True, **kw):
    d = {'k': 'poly', 'pts': pts, 'closed': closed}
    if color: d['color'] = color
    if fill: d['fill'] = fill
    d.update(kw); return d

def curve(x, y, s, color=None, **kw):
    d = {'k': 'curve', 'x': x, 'y': y, 's': s}
    if color: d['color'] = color
    d.update(kw); return d

# ---- schematic parts (numbers only) ----
def resH(x1, x2, y, color='gold', n=6, a=0.18):
    """horizontal resistor zigzag between x1..x2 with short leads"""
    L = (x2 - x1); l0 = L * 0.18
    pts = [[x1, y], [x1 + l0, y]]
    w = (L - 2 * l0) / n
    for i in range(n):
        pts.append([round(x1 + l0 + w * (i + .5), 3), y + (a if i % 2 == 0 else -a)])
    pts += [[x2 - l0, y], [x2, y]]
    return poly(pts, color=color, closed=False)

def resV(x, y1, y2, color='gold', n=6, a=0.18):
    L = (y2 - y1); l0 = L * 0.18
    pts = [[x, y1], [x, y1 + l0]]
    w = (L - 2 * l0) / n
    for i in range(n):
        pts.append([x + (a if i % 2 == 0 else -a), round(y1 + l0 + w * (i + .5), 3)])
    pts += [[x, y2 - l0], [x, y2]]
    return poly(pts, color=color, closed=False)

def capH(xc, y, color='accent', gap=0.16, h=0.45, lead=0.8):
    return [line(xc - lead, y, xc - gap / 2, y, color), line(xc + gap / 2, y, xc + lead, y, color),
            line(xc - gap / 2, y - h, xc - gap / 2, y + h, color, 3), line(xc + gap / 2, y - h, xc + gap / 2, y + h, color, 3)]

def capV(x, yc, color='accent', gap=0.16, w=0.45, lead=0.8):
    return [line(x, yc - lead, x, yc - gap / 2, color), line(x, yc + gap / 2, x, yc + lead, color),
            line(x - w, yc - gap / 2, x + w, yc - gap / 2, color, 3), line(x - w, yc + gap / 2, x + w, yc + gap / 2, color, 3)]

def indH(x1, x2, y, color='purple', n=4):
    L = x2 - x1; l0 = L * 0.15
    inner = L - 2 * l0
    return [line(x1, y, x1 + l0, y, color), line(x2 - l0, y, x2, y, color),
            curve(f"{x1 + l0}+{inner}*s/{2 * math.pi * n:.5f}", f"{y}+0.3*abs(sin(s/2))", [0, round(2 * math.pi * n, 5)], color)]

def indV(x, y1, y2, color='purple', n=4):
    L = y2 - y1; l0 = L * 0.15
    inner = L - 2 * l0
    return [line(x, y1, x, y1 + l0, color), line(x, y2 - l0, x, y2, color),
            curve(f"{x}+0.3*abs(sin(s/2))", f"{y1 + l0}+{inner}*s/{2 * math.pi * n:.5f}", [0, round(2 * math.pi * n, 5)], color)]

def vsrc(x, y, r=0.5, color='pink', lab=None):
    out = [circle(x, y, r, color), text(x, y + r * .45, '+', color, 12), text(x, y - r * .45, '−', color, 12)]
    return out

def batV(x, yc, color='pink', lead=0.7):
    """vertical battery symbol, + on top (long plate)"""
    return [line(x, yc - lead, x, yc - 0.12, color), line(x, yc + 0.12, x, yc + lead, color),
            line(x - 0.5, yc + 0.12, x + 0.5, yc + 0.12, color, 3), line(x - 0.28, yc - 0.12, x + 0.28, yc - 0.12, color, 3)]

def gnd(x, y, color='dim'):
    return [line(x, y, x, y - 0.3, color), line(x - .4, y - .3, x + .4, y - .3, color), line(x - .26, y - .45, x + .26, y - .45, color), line(x - .12, y - .6, x + .12, y - .6, color)]

def isrc(x, y, r=0.5, color='pink'):
    return [circle(x, y, r, color), arrow(x, y - r * .6, x, y + r * .6, color)]

def dot(x, y, color='white'):
    return point(x, y, color, 4)

def pts_grid(f, nx, ny, x0, y0, dx, dy):
    return [f(x0 + i * dx, y0 + j * dy) for i in range(nx) for j in range(ny)]
