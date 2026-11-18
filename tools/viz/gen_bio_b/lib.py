import math
S = {}
def add(i, spec):
    assert i not in S, i
    S[i] = spec
def P(id, label, mn, mx, val, unit=None, step=None):
    d = dict(id=id, label=label, min=mn, max=mx, value=val)
    if unit: d['unit'] = unit
    if step: d['step'] = step
    return d
def R(label, value, unit=None):
    d = dict(label=label, value=value)
    if unit: d['unit'] = unit
    return d
def F(f, label=None, color=None, dash=False, width=None):
    d = dict(f=f)
    if label: d['label'] = label
    if color: d['color'] = color
    if dash: d['dash'] = True
    if width: d['width'] = width
    return d
def plot(i, cap, fns=(), x=None, y=None, params=(), readouts=(), points=(), xlabel=None, ylabel=None,
         vlines=(), hlines=(), logx=False, logy=False, aspect=None, **kw):
    d = dict(type='plot', caption=cap)
    if x is not None: d['x'] = x
    if y is not None: d['y'] = y
    if fns: d['fns'] = list(fns)
    if params: d['params'] = list(params)
    if readouts: d['readouts'] = list(readouts)
    if points: d['points'] = list(points)
    if xlabel: d['xlabel'] = xlabel
    if ylabel: d['ylabel'] = ylabel
    if vlines: d['vlines'] = list(vlines)
    if hlines: d['hlines'] = list(hlines)
    if logx: d['logx'] = True
    if logy: d['logy'] = True
    if aspect: d['aspect'] = aspect
    d.update(kw)
    add(i, d)
def bars(i, cap, items, logy=False, ylabel=None, params=(), readouts=(), aspect=None):
    b = []
    for it in items:
        e = dict(label=it[0], value=it[1])
        if len(it) > 2 and it[2]: e['color'] = it[2]
        b.append(e)
    d = dict(type='bars', bars=b, caption=cap)
    if logy: d['logy'] = True
    if ylabel: d['ylabel'] = ylabel
    if params: d['params'] = list(params)
    if readouts: d['readouts'] = list(readouts)
    if aspect: d['aspect'] = aspect
    add(i, d)
def nd(id, label, x, y, color=None, shape=None):
    d = dict(id=id, label=label, x=x, y=y)
    if color: d['color'] = color
    if shape: d['shape'] = shape
    return d
def blocks(i, cap, nodes, edges, flow=True, aspect=None, params=(), readouts=()):
    ns = [n if isinstance(n, dict) else nd(*n) for n in nodes]
    es = []
    for e in edges:
        if isinstance(e, dict): es.append(e)
        else:
            o = dict(**{'from': e[0], 'to': e[1]})
            if len(e) > 2 and e[2]: o['label'] = e[2]
            if len(e) > 3 and e[3]: o['dashed'] = True
            es.append(o)
    d = dict(type='blocks', nodes=ns, edges=es, caption=cap)
    if flow: d['flow'] = True
    if aspect: d['aspect'] = aspect
    if params: d['params'] = list(params)
    if readouts: d['readouts'] = list(readouts)
    add(i, d)
def chain(i, cap, labels, per_row=3, colors=None, elabels=None, loop=False, aspect=None, flow=True, **kw):
    n = len(labels); rows = (n + per_row - 1) // per_row
    nodes = []; edges = []
    for k, lab in enumerate(labels):
        r, c = divmod(k, per_row)
        cnt = min(per_row, n - r * per_row)
        if r % 2 == 1: c = per_row - 1 - c
        lo, hi = {2: (25, 75), 3: (14, 86), 4: (10, 90)}.get(per_row, (8, 92))
        xs = [50] if per_row == 1 else [lo + (hi - lo) * j / (per_row - 1) for j in range(per_row)]
        y = 50 if rows == 1 else 12 + 76 * r / (rows - 1)
        nodes.append(nd('n%d' % k, lab, round(xs[c], 1), round(y, 1), (colors[k] if colors else None)))
    for k in range(n - 1):
        edges.append(('n%d' % k, 'n%d' % (k + 1), (elabels[k] if elabels and k < len(elabels) else None)))
    if loop: edges.append(('n%d' % (n - 1), 'n0', (elabels[n - 1] if elabels and len(elabels) >= n else None), True))
    blocks(i, cap, nodes, edges, flow=flow, aspect=aspect or (0.5 if rows == 1 else 0.38 + 0.2 * rows), **kw)
def hub(i, cap, center, spokes, colors=None, centercolor='gold', aspect=0.8, flow=False, arrows_in=False):
    nodes = [nd('c', center, 50, 50, centercolor)]
    edges = []
    m = len(spokes)
    for k, lab in enumerate(spokes):
        a = -math.pi / 2 + 2 * math.pi * k / m
        nodes.append(nd('s%d' % k, lab, round(50 + 38 * math.cos(a), 1), round(50 + 40 * math.sin(a), 1), colors[k] if colors else None))
        edges.append(('s%d' % k, 'c') if arrows_in else ('c', 's%d' % k))
    blocks(i, cap, nodes, edges, flow=flow, aspect=aspect)
def geo(i, cap, rng, shapes, params=(), readouts=(), aspect=None, equal=None, axes=False, grid=False):
    d = dict(type='geometry', range=rng, shapes=shapes, caption=cap)
    if params: d['params'] = list(params)
    if readouts: d['readouts'] = list(readouts)
    if aspect: d['aspect'] = aspect
    if equal is False: d['equal'] = False
    if axes: d['axes'] = True
    if grid: d['grid'] = True
    add(i, d)
def T(x, y, text, color=None, size=None, align=None, when=None):
    d = dict(k='text', x=x, y=y, text=text)
    if color: d['color'] = color
    if size: d['size'] = size
    if align: d['align'] = align
    if when is not None: d['when'] = when
    return d
def L(x1, y1, x2, y2, color=None, width=None, dash=False, when=None):
    d = dict(k='line', x1=x1, y1=y1, x2=x2, y2=y2)
    if color: d['color'] = color
    if width: d['width'] = width
    if dash: d['dash'] = True
    if when is not None: d['when'] = when
    return d
def A(x1, y1, x2, y2, color=None, width=None, when=None):
    d = L(x1, y1, x2, y2, color, width, when=when); d['k'] = 'arrow'; return d
def C(x, y, r, color=None, fill=None, width=None, when=None, alpha=None, dash=False):
    d = dict(k='circle', x=x, y=y, r=r)
    if color: d['color'] = color
    if fill: d['fill'] = fill
    if width: d['width'] = width
    if when is not None: d['when'] = when
    if alpha is not None: d['alpha'] = alpha
    if dash: d['dash'] = True
    return d
def Pt(x, y, color=None, size=None, when=None):
    d = dict(k='point', x=x, y=y)
    if color: d['color'] = color
    if size: d['size'] = size
    if when is not None: d['when'] = when
    return d
def Rc(x, y, w, h, color=None, fill=None, alpha=None, width=None, when=None):
    d = dict(k='poly', pts=[[x, y], ['(%s)+(%s)' % (x, w) if isinstance(x, str) or isinstance(w, str) else x + w, y],
             ['(%s)+(%s)' % (x, w) if isinstance(x, str) or isinstance(w, str) else x + w, '(%s)+(%s)' % (y, h) if isinstance(y, str) or isinstance(h, str) else y + h],
             [x, '(%s)+(%s)' % (y, h) if isinstance(y, str) or isinstance(h, str) else y + h]])
    if color: d['color'] = color
    if fill: d['fill'] = fill
    if alpha is not None: d['alpha'] = alpha
    if width: d['width'] = width
    if when is not None: d['when'] = when
    return d
def Pg(pts, color=None, fill=None, alpha=None, width=None, closed=True):
    d = dict(k='poly', pts=pts)
    if color: d['color'] = color
    if fill: d['fill'] = fill
    if alpha is not None: d['alpha'] = alpha
    if width: d['width'] = width
    if not closed: d['closed'] = False
    return d
def Cv(x, y, s, color=None, width=None, dash=False, when=None):
    d = dict(k='curve', x=x, y=y, s=s)
    if color: d['color'] = color
    if width: d['width'] = width
    if dash: d['dash'] = True
    if when is not None: d['when'] = when
    return d
def pwl(pts, nan=True):
    """piecewise-linear expression in x through pts [(x,y)...], NaN outside range."""
    # restructure: nested ternary from first segment
    segs = list(zip(pts[:-1], pts[1:]))
    out = None
    for k in range(len(segs) - 1, -1, -1):
        (x0, y0), (x1, y1) = segs[k]
        seg = '(%s+(%s)*(x-%s))' % (y0, round((y1 - y0) / (x1 - x0), 10), x0)
        out = seg if out is None else '(x<%s ? %s : %s)' % (x1, seg, out)
    if nan:
        out = 'sqrt(x-%s)*0+sqrt(%s-x)*0+%s' % (pts[0][0], pts[-1][0], out)
    return out
def kw(*a): return a

# ---- extras for bio_b ----
import json as _json, os as _os
_root = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '..', '..', '..'))
NODES = {}
for _f in ['bio_evol_diversity_plants','bio_physio_neuro','bio_immuno_part','bio_eco_stats_lab','bio_electives','bio_extra','bio_processes']:
    for _n in _json.load(open(_root + '/data/nodes/%s.json' % _f)): NODES[_n['id']] = _n
def steps_of(i): return [s['title'] for s in NODES[i].get('steps', [])]
def lg(z):
    """expression string for ln Gamma(z) (Stirling with shift 3)"""
    w = '((%s)+3)' % z
    return '(((%s)-0.5)*ln(%s)-%s+0.9189385+1/(12*%s)-1/(360*%s^3)-ln((%s)*((%s)+1)*((%s)+2)))' % (w, w, w, w, w, z, z, z)
def Phi(z): return '(0.5*(1+erf((%s)/sqrt(2))))' % z

_chain0 = chain
def chain(i, cap, labels, per_row=None, **kw):
    m = max(len(l) for l in labels)
    auto = 3 if m <= 8 else (2 if m <= 13 else 1)
    pr = min(per_row or auto, auto) if per_row else auto
    if len(labels) <= 3 and m <= 22 and not kw.get('loop'): pr = len(labels) if m <= 9 else min(len(labels), 2)
    _chain0(i, cap, labels, per_row=pr, **kw)
def tree(i, cap, t, aspect=None, flow=False):
    """t = (label, [children], color?) ; root left, leaves in right column; internal nodes are dots with the clade name on the branch."""
    leaves = []; nodes = []; edges = []; cnt = [0]
    def depth(n): return 1 + max([depth(c) for c in n[1]] or [0])
    D = depth(t)
    def go(n, d, parent):
        my = 'n%d' % cnt[0]; cnt[0] += 1
        if not n[1]:
            leaves.append(my); y = len(leaves) - 1
        else:
            ys = [go(c, d + 1, my) for c in n[1]]; y = sum(ys) / len(ys)
        nodes.append((my, n[0], d, y, n[2] if len(n) > 2 else None, bool(n[1]), parent))
        if parent: edges.append((parent, my))
        return y
    go(t, 0, None)
    nl = len(leaves); ns = []
    for (my, lab, d, y, col, internal, parent) in nodes:
        yy = round(8 + 84 * (y + .5) / nl, 1)
        if internal:
            x = 15 + d * (30.0 / max(1, D - 2))
            ns.append(dict(id=my, label=lab, x=round(x, 1), y=yy, color=col or 'gold'))
        else:
            ns.append(nd(my, lab, 84, yy, col))
    blocks(i, cap, ns, edges, flow=flow, aspect=aspect or min(1.3, 0.2 + 0.11 * nl))

def hub(i, cap, center, spokes, colors=None, centercolor='gold', aspect=0.8, flow=False, arrows_in=False):
    nodes = [nd('c', center, 50, 50, centercolor)]
    edges = []
    m = len(spokes)
    off = math.pi / m if m <= 4 else 0
    xr = 34 if m > 4 else 36
    for k, lab in enumerate(spokes):
        a = -math.pi / 2 + off + 2 * math.pi * k / m
        nodes.append(nd('s%d' % k, lab, round(50 + xr * math.cos(a), 1), round(50 + 40 * math.sin(a), 1), colors[k] if colors else None))
        edges.append(('s%d' % k, 'c') if arrows_in else ('c', 's%d' % k))
    blocks(i, cap, nodes, edges, flow=flow, aspect=aspect)
