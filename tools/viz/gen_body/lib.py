import math, json

def f4(v):
    return ('%.5g' % v)

def pw(pts, var='x', dense=6):
    """Smooth (Catmull-Rom) piecewise curve through pts, emitted as a flat sum of hinge terms."""
    pts = sorted(pts)
    P = []
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[max(i - 1, 0)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(i + 2, n - 1)]
        for k in range(dense):
            u = k / dense
            # non-uniform-safe: use Hermite with finite-difference tangents
            def tan(a, b, c):
                if a is b: return (c[1] - b[1]) / (c[0] - b[0])
                if c is b: return (b[1] - a[1]) / (b[0] - a[0])
                return (c[1] - a[1]) / (c[0] - a[0])
            m1 = tan(p0, p1, p2); m2 = tan(p1, p2, p3)
            # monotone-ish clamp
            s = (p2[1] - p1[1]) / (p2[0] - p1[0])
            if s == 0: m1 = m2 = 0
            else:
                if m1 * s < 0: m1 = 0
                if m2 * s < 0: m2 = 0
                if abs(m1) > 3 * abs(s): m1 = 3 * s
                if abs(m2) > 3 * abs(s): m2 = 3 * s
            h = p2[0] - p1[0]
            h00 = 2*u**3 - 3*u**2 + 1; h10 = u**3 - 2*u**2 + u; h01 = -2*u**3 + 3*u**2; h11 = u**3 - u**2
            P.append((p1[0] + u * h, h00 * p1[1] + h10 * h * m1 + h01 * p2[1] + h11 * h * m2))
    P.append(pts[-1])
    if not dense or dense == 1: P = pts
    terms = [f4(P[0][1])]
    prev = 0.0
    for i in range(len(P) - 1):
        m = (P[i + 1][1] - P[i][1]) / (P[i + 1][0] - P[i][0])
        d = m - prev; prev = m
        if abs(d) < 1e-9: continue
        a = f'max({var}-{f4(P[i][0])},0)'
        terms.append(('+ ' if d > 0 else '- ') + f4(abs(d)) + '*' + a)
    if abs(prev) > 1e-9:
        d = -prev
        terms.append(('+ ' if d > 0 else '- ') + f4(abs(d)) + f'*max({var}-{f4(P[-1][0])},0)')
    return ' '.join(terms)

# ---------- blocks ----------
def flow(labels, caption, cols=None, colors=None, extra=None, aspect=None, nflow=True):
    n = len(labels)
    mx = max(len(l) for l in labels)
    if cols is None:
        cols = 3 if mx <= 11 else (2 if mx <= 19 else 1)
    cols = min(cols, n)
    while cols > 1 and mx > {2: 16, 3: 10, 4: 6}[cols]:
        cols -= 1
    rows = math.ceil(n / cols)
    xs = {1: [50], 2: [26, 74], 3: [17, 50, 83], 4: [12, 37, 63, 88]}[cols]
    nodes = []
    for i, l in enumerate(labels):
        r, c = divmod(i, cols)
        if r % 2 == 1: c = cols - 1 - c
        y = 50 if rows == 1 else 12 + (76 * r / (rows - 1))
        d = {'id': 'n%d' % i, 'label': l, 'x': xs[c], 'y': y}
        if colors and colors.get(i): d['color'] = colors[i]
        nodes.append(d)
    edges = [{'from': 'n%d' % i, 'to': 'n%d' % (i + 1)} for i in range(n - 1)]
    for e in (extra or []):
        a, b = e[0], e[1]
        d = {'from': 'n%d' % a, 'to': 'n%d' % b}
        if len(e) > 2 and e[2]: d['label'] = e[2]
        d['dashed'] = True
        edges.append(d)
    return {'type': 'blocks', 'flow': nflow, 'nodes': nodes, 'edges': edges, 'caption': caption,
            'aspect': aspect or max(0.34, 0.2 * rows + 0.14)}

def net(nodes, edges, caption, aspect=0.72, nflow=True):
    """nodes: [(id,label,x,y[,color])]; edges: [(a,b[,label[,dashed]])]"""
    N = []
    for t in nodes:
        d = {'id': t[0], 'label': t[1], 'x': t[2], 'y': t[3]}
        if len(t) > 4 and t[4]: d['color'] = t[4]
        N.append(d)
    E = []
    for t in edges:
        d = {'from': t[0], 'to': t[1]}
        if len(t) > 2 and t[2]: d['label'] = t[2]
        if len(t) > 3 and t[3]: d['dashed'] = True
        E.append(d)
    return {'type': 'blocks', 'flow': nflow, 'nodes': N, 'edges': E, 'caption': caption, 'aspect': aspect}

def hub(center, items, caption, ccolor='accent', aspect=None, spokes_in=False, nflow=True):
    """center label, items [(label, edge_label)] placed around the hub (up to 8)."""
    n = len(items)
    nodes = [('c', center, 50, 50, ccolor)]
    edges = []
    pos = {1: [(50, 10)], 2: [(20, 50), (80, 50)], 3: [(50, 8), (20, 90), (80, 90)], 4: [(20, 12), (80, 12), (20, 88), (80, 88)],
           5: [(22, 10), (78, 10), (14, 50), (86, 50), (50, 90)], 6: [(22, 10), (78, 10), (14, 50), (86, 50), (22, 90), (78, 90)]}[n]
    for i, (lab, el) in enumerate(items):
        nodes.append(('h%d' % i, lab, pos[i][0], pos[i][1]))
        edges.append(('h%d' % i, 'c', el) if spokes_in else ('c', 'h%d' % i, el))
    return net(nodes, edges, caption, aspect or (0.6 if n <= 4 else 0.78), nflow)

# ---------- misc ----------
def bars(items, caption, ylabel=None, logy=False, params=None, readouts=None, aspect=0.62):
    B = []
    for it in items:
        d = {'label': it[0], 'value': it[1]}
        if len(it) > 2 and it[2]: d['color'] = it[2]
        B.append(d)
    s = {'type': 'bars', 'bars': B, 'caption': caption, 'aspect': aspect}
    if ylabel: s['ylabel'] = ylabel
    if logy: s['logy'] = True
    if params: s['params'] = params
    if readouts: s['readouts'] = readouts
    return s

def P(id, label, mn, mx, val, unit=None, step=None):
    d = {'id': id, 'label': label, 'min': mn, 'max': mx, 'value': val}
    if unit: d['unit'] = unit
    if step: d['step'] = step
    return d

def R(label, value, unit=None):
    d = {'label': label, 'value': value}
    if unit: d['unit'] = unit
    return d

def plot(fns, x, y=None, caption='', xlabel=None, ylabel=None, params=None, readouts=None, vlines=None, hlines=None, points=None, logx=False, logy=False, aspect=0.66, shade=None):
    s = {'type': 'plot', 'x': x, 'fns': fns, 'caption': caption, 'aspect': aspect}
    if y: s['y'] = y
    if any(f.get('label') for f in fns) and ylabel:
        xlabel = (xlabel + '   |   y: ' if xlabel else 'y: ') + ylabel; ylabel = None
    if xlabel: s['xlabel'] = xlabel
    if ylabel: s['ylabel'] = ylabel
    if params: s['params'] = params
    if readouts: s['readouts'] = readouts
    if vlines: s['vlines'] = vlines
    if hlines: s['hlines'] = hlines
    if points: s['points'] = points
    if logx: s['logx'] = True
    if logy: s['logy'] = True
    if shade: s['shade'] = shade
    return s

COLH = {'accent': '#6ee7ff', 'gold': '#ffd166', 'pink': '#ff8fb1', 'green': '#9be37b', 'purple': '#b388ff', 'orange': '#ffa94d', 'red': '#ff6b6b', 'blue': '#5b9cff', 'white': '#e8ecf5', 'dim': '#98a2b8'}
def fn(f, label=None, color=None, dash=None, width=None):
    d = {'f': f}
    if color: color = COLH.get(color, color)
    if label: d['label'] = label
    if color: d['color'] = color
    if dash: d['dash'] = True
    if width: d['width'] = width
    return d

def geo(shapes, caption, rng=(-5, 5, -3.5, 3.5), params=None, readouts=None, aspect=None, **kw):
    x0, x1, y0, y1 = rng
    s = {'type': 'geometry', 'range': list(rng), 'shapes': shapes, 'caption': caption,
         'aspect': aspect or round((y1 - y0) / (x1 - x0), 3)}
    if params: s['params'] = params
    if readouts: s['readouts'] = readouts
    s.update(kw)
    return s

# ---------- geometry primitives ----------
def poly(pts, color='accent', fill=None, alpha=None, width=None, closed=True, when=None):
    d = {'k': 'poly', 'pts': [[round(a, 3) if isinstance(a, (int, float)) else a, round(b, 3) if isinstance(b, (int, float)) else b] for a, b in pts], 'color': color}
    if fill: d['fill'] = fill
    if alpha is not None: d['alpha'] = alpha
    if width: d['width'] = width
    if not closed: d['closed'] = False
    if when: d['when'] = when
    return d

def ellpts(cx, cy, rx, ry, rot=0, n=36, a0=0, a1=360):
    out = []
    cr, sr = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    for i in range(n + 1 if a1 - a0 < 360 else n):
        a = math.radians(a0 + (a1 - a0) * i / n)
        x, y = rx * math.cos(a), ry * math.sin(a)
        out.append((cx + x * cr - y * sr, cy + x * sr + y * cr))
    return out

def ell(cx, cy, rx, ry, color='accent', fill=None, alpha=None, rot=0, width=None, n=16):
    return poly(ellpts(cx, cy, rx, ry, rot, n), color, fill, alpha, width)

def circ(x, y, r, color='accent', fill=None, alpha=None, width=None, when=None):
    d = {'k': 'circle', 'x': x, 'y': y, 'r': r, 'color': color}
    if fill: d['fill'] = fill
    if alpha is not None: d['alpha'] = alpha
    if width: d['width'] = width
    if when: d['when'] = when
    return d

def line(x1, y1, x2, y2, color='dim', width=None, dash=False, when=None, alpha=None):
    d = {'k': 'line', 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, 'color': color}
    if width: d['width'] = width
    if dash: d['dash'] = True
    if when: d['when'] = when
    if alpha is not None: d['alpha'] = alpha
    return d

def arrow(x1, y1, x2, y2, color='gold', width=None, when=None):
    d = {'k': 'arrow', 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, 'color': color}
    if width: d['width'] = width
    if when: d['when'] = when
    return d

def rect(x, y, w, h, color='accent', fill=None, alpha=None, width=None):
    d = {'k': 'rect', 'x': x, 'y': y, 'w': w, 'h': h, 'color': color}
    if fill: d['fill'] = fill
    if alpha is not None: d['alpha'] = alpha
    if width: d['width'] = width
    return d

def pt(x, y, color='gold', size=None, when=None):
    d = {'k': 'point', 'x': x, 'y': y, 'color': color}
    if size: d['size'] = size
    if when: d['when'] = when
    return d

def text(x, y, s, color='white', size=None, align=None, when=None):
    d = {'k': 'text', 'x': x, 'y': y, 'text': s, 'color': color}
    if size: d['size'] = size
    if align: d['align'] = align
    if when: d['when'] = when
    return d

def curve(xe, ye, s, color='accent', width=None, when=None, dash=False):
    d = {'k': 'curve', 'x': xe, 'y': ye, 's': s, 'color': color}
    if width: d['width'] = width
    if when: d['when'] = when
    if dash: d['dash'] = True
    return d

def tag(label, tx, ty, px, py, color='white', align='center'):
    """label at (tx,ty) with a leader line to (px,py)"""
    return [line(tx, ty, px, py, 'dim', 1, alpha=0.7), pt(px, py, 'white', 3), text(tx, ty, label, color, 10, align)]

# ---------- joint lever (muscles) ----------
def jointfig(prox, dist, ap, s, a, b, h, caption, thmax=120, Fdef=600, Lp=3.0, Ld=3.0, rng=(-4.5, 4.5, -3.4, 3.4), thdef=40, muscle='muscle', off=0, thlabel='joint angle'):
    hA, hB = h if isinstance(h, tuple) else (h, h)
    ap_r = f'{ap}*pi/180'
    ph = f'(({ap}+180+{off}+{s}*th)*pi/180)'
    ph0 = f'(({ap}+180+{off})*pi/180)'
    def AB(ph):
        Ax = f'({a}*cos({ap_r})+{hA}*sin({ap_r}))'; Ay = f'({a}*sin({ap_r})-{hA}*cos({ap_r}))'
        Bx = f'({b}*cos({ph})-{hB}*sin({ph}))'; By = f'({b}*sin({ph})+{hB}*cos({ph}))'
        return Ax, Ay, Bx, By
    Ax, Ay, Bx, By = AB(ph)
    L = f'hypot({Bx}-{Ax},{By}-{Ay})'
    arm = f'abs({Ax}*({By}-{Ay})-{Ay}*({Bx}-{Ax}))/{L}'
    _, _, Bx0, By0 = AB(ph0)
    L0 = f'hypot({Bx0}-{Ax},{By0}-{Ay})'
    ex1 = (f'({Lp}+0.45)*cos({ap_r})', f'({Lp}+0.45)*sin({ap_r})')
    ex2 = (f'({Ld}+0.45)*cos{ph}', f'({Ld}+0.45)*sin{ph}')
    shapes = [
        line(0, 0, f'{Lp}*cos({ap_r})', f'{Lp}*sin({ap_r})', 'white', 9, alpha=0.45),
        line(0, 0, f'{Ld}*cos{ph}', f'{Ld}*sin{ph}', 'accent', 9, alpha=0.8),
        line(Ax, Ay, Bx, By, 'red', 4),
        pt(Ax, Ay, 'red', 4), pt(Bx, By, 'red', 4),
        circ(0, 0, 0.17, 'gold', 'gold'),
        text(ex1[0], ex1[1], prox, 'white', 10), text(ex2[0], ex2[1], dist, 'accent', 10),
        text(rng[0] + 0.2, rng[3] - 0.3, 'red line = ' + muscle, 'red', 10, 'left'),
    ]
    return geo(shapes, caption, rng,
        params=[P('th', thlabel, 0, thmax, thdef, '°'), P('F', 'muscle force', 100, max(1500, int(Fdef * 1.6)), Fdef, 'N')],
        readouts=[R('muscle length vs straight', f'100*({L})/({L0})', '%'), R('moment arm', f'{arm}*10', 'cm'), R('joint torque', f'F*{arm}*0.1', 'N·m')])
