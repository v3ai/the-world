import math
def P(id, label, mn, mx, v, unit=None, step=None):
    d = {"id": id, "label": label, "min": mn, "max": mx, "value": v}
    if unit: d["unit"] = unit
    if step: d["step"] = step
    return d
def R(label, value, unit=None):
    d = {"label": label, "value": value}
    if unit: d["unit"] = unit
    return d
def S(type, caption, params=None, readouts=None, **kw):
    d = {"type": type}
    d.update(kw)
    if params: d["params"] = params
    if readouts: d["readouts"] = readouts
    d["caption"] = caption
    return d
def fn(f, label=None, color=None, dash=None, width=None):
    d = {"f": f}
    if label: d["label"] = label
    if color: d["color"] = color
    if dash: d["dash"] = True
    if width: d["width"] = width
    return d
def plot(fns, x, y=None, caption="", params=None, readouts=None, **kw):
    fns = [fn(*f) if isinstance(f, tuple) else (fn(f) if isinstance(f, str) else f) for f in fns]
    d = dict(fns=fns, x=x)
    if y is not None: d["y"] = y
    d.update(kw)
    return S("plot", caption, params, readouts, **d)
def N(id, label, x, y, shape=None, color=None):
    d = {"id": id, "label": label, "x": x, "y": y}
    if shape: d["shape"] = shape
    if color: d["color"] = color
    return d
def E(a, b, label=None, dashed=False, color=None):
    d = {"from": a, "to": b}
    if label: d["label"] = label
    if dashed: d["dashed"] = True
    if color: d["color"] = color
    return d
def blocks(nodes, edges, caption, params=None, readouts=None, flow=True, **kw):
    return S("blocks", caption, params, readouts, nodes=nodes, edges=edges, flow=flow, **kw)
def chain(labels, caption, per=None, colors=None, extra=None, params=None, readouts=None, shapes=None, edge_labels=None, **kw):
    n = len(labels); maxL = max(len(l) for l in labels)
    if per is None:
        per = 4 if (maxL <= 7 and n >= 5) else (3 if maxL <= 11 else 2)
    per = min(per, n)
    rows = -(-n // per)
    nodes = []
    for i, l in enumerate(labels):
        r, c = divmod(i, per)
        if r % 2 == 1: c = per - 1 - c
        x = 50 if per == 1 else 17 + c * 66 / (per - 1)
        y = 50 if rows == 1 else 10 + r * 80 / (rows - 1)
        nd = N("n%d" % i, l, round(x, 1), round(y, 1))
        if colors and i in colors: nd["color"] = colors[i]
        if shapes and i in shapes: nd["shape"] = shapes[i]
        nodes.append(nd)
    edges = [E("n%d" % i, "n%d" % (i + 1), (edge_labels or {}).get(i)) for i in range(n - 1)]
    for a, b, lab in (extra or []):
        edges.append(E("n%d" % a, "n%d" % b, lab, dashed=True))
    kw.setdefault("aspect", round(max(.42, .2 * rows + .17), 2))
    return blocks(nodes, edges, caption, params, readouts, **kw)
