#!/usr/bin/env python3
"""Mars heights from the real MOLA DEM, and the Viking colour map with its baked light and shade taken out.

usage: mars_dem.py MOLA463.tif VIKING_4k.jpg OUTDIR
Inputs: USGS Astropedia "Mars MGS MOLA DEM 463m" (CC0, public domain), 46080 x 23040, signed 16 bit, metres above the areoid, 128 px per degree,
        centred on 0 degrees longitude, row 0 = north; and the Viking colour map the app already uses (look_mars_4k.jpg).
Output (OUTDIR): mars_h4k.npy / mars_h2k.npy (float32 metres) for make_relief.py, and look_mars_4k.jpg / look_mars_2k.jpg, the Viking map divided by the
        hill-shade of the heights at Viking's own sun direction.
How the Viking sun is found: the map's brightness, divided by its own local average, is regressed on the east and north slope of the MOLA heights
(both taken at 2.6 km per pixel and averaged to the map's 5.2 km, after removing the slopes broader than about 30 km). The fit gives the direction the Viking light came from and how strongly it
modulates the image; correcting by that fit (1 + a * slope_east + b * slope_north) removes the large relief's baked shading and leaves the albedo.
What stays: the shading of craters and ridges smaller than about 10 km on gentle ground, which the height data cannot describe at this scale.
"""
import sys, os, struct, json
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
Image.MAX_IMAGE_PIXELS = None
tif, vik, out = sys.argv[1:4]
f = open(tif, 'rb'); f.seek(2125678546); first = struct.unpack('<I', f.read(4))[0]   # first strip offset (the strip offsets are stored at 2125678546)
a = np.memmap(tif, dtype='<i2', mode='r', offset=first, shape=(23040, 46080))
def down(w):
    return np.asarray(Image.fromarray(np.asarray(a, dtype=np.float32), mode='F').resize((w, w // 2), Image.BOX), dtype=np.float32)
R = 3389500.0
h8, h4, h2 = down(8192), down(4096), down(2048)
os.makedirs(out, exist_ok=True)
np.save(os.path.join(out, 'mars_h4k.npy'), h4); np.save(os.path.join(out, 'mars_h2k.npy'), h2)
print('heights', h4.min(), h4.max())

def slopes(h):
    H, W = h.shape; lat = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    dx = (2 * np.pi * R / W) * np.maximum(np.cos(lat), 0.05)[:, None]; dy = np.pi * R / H
    hp = np.pad(h, ((1, 1), (0, 0)), mode='edge')
    return (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / (2 * dx), (hp[:-2] - hp[2:]) / (2 * dy)
gx8, gy8 = slopes(h8)
def box(x, w): return np.asarray(Image.fromarray(x.astype(np.float32), mode='F').resize((w, w // 2), Image.BOX), dtype=np.float32)
SIG = 6   # pixels at 4096 (31 km): broader slopes are the shape of the rises, and broader brightness is albedo, neither is the light of Viking
hp_ = lambda x, sg: x - gaussian_filter(x, sg)
gx8, gy8 = hp_(gx8, 2 * SIG), hp_(gy8, 2 * SIG)
gx4, gy4 = box(gx8, 4096), box(gy8, 4096)

im = np.asarray(Image.open(vik).convert('RGB').resize((4096, 2048), Image.BOX)).astype(np.float32) / 255.0
L = (im ** 2.2 @ np.array([.2126, .7152, .0722], np.float32))
Lh = L / np.maximum(gaussian_filter(L, SIG), 1e-3) - 1.0
H4 = 2048; lat = (0.5 - (np.arange(H4) + 0.5) / H4) * 180
msk = (np.abs(lat)[:, None] < 60) & (L > 0.02)
def fit(dx=0, dy=0):
    g1, g2 = np.roll(np.roll(gx4, dy, 0), dx, 1), np.roll(np.roll(gy4, dy, 0), dx, 1)
    A = np.stack([g1[msk], g2[msk]], 1); y = Lh[msk]
    c, *_ = np.linalg.lstsq(A, y, rcond=None); r = 1 - ((y - A @ c) ** 2).sum() / (y ** 2).sum(); return c, r
best = max(((fit(dx, dy)[1], dx, dy) for dx in range(-3, 4) for dy in range(-3, 4)))
print('alignment search (R2, dx, dy):', best)
c, r2 = fit(); print('fit a (east), b (north):', c, 'R2', r2)
sx, sy = -c[0], -c[1]   # the light comes from the side the slope is brightened on
print('Viking light comes from azimuth (deg east of north):', np.degrees(np.arctan2(sx, sy)) % 360, 'strength', np.hypot(sx, sy))
C8 = np.clip(1.0 + c[0] * gx8 + c[1] * gy8, 0.55, 1.7)
res = {'a': float(c[0]), 'b': float(c[1]), 'R2': float(r2), 'azimuth_from_deg': float(np.degrees(np.arctan2(sx, sy)) % 360)}
json.dump(res, open(os.path.join(out, 'viking_sun.json'), 'w'))
# Where the ground is steep (scarps, canyon walls) the Viking brightness is mostly the light of its own sun (and the slope's own bright dust and frost),
# which the heights cannot describe at this scale. There the colour and brightness are replaced by the average of the gentle ground around it, so
# the only light on a wall is today's, computed from the heights. w: 0 below 4.5 degrees of slope, 1 above 11 degrees.
sl8 = np.hypot(*slopes(h8))
for w in (4096, 2048):
    Cw = box(C8, w); Cw = Cw / Cw.mean()
    src = np.asarray(Image.open(vik).convert('RGB').resize((w, w // 2), Image.BOX)).astype(np.float32) / 255.0
    lin = (src ** 2.2) / Cw[..., None]
    lum = lin @ np.array([.2126, .7152, .0722], np.float32)
    s_ = box(sl8, w); wt = np.clip((s_ - 0.08) / 0.12, 0, 1); wt = wt * wt * (3 - 2 * wt)
    sg = 6.0 * w / 4096
    ok = 1.0 - wt
    den = np.maximum(gaussian_filter(ok, sg), 1e-3)
    fill = np.stack([gaussian_filter(lin[..., c] * ok, sg) / den for c in range(3)], -1)   # the average colour and brightness of the gentle ground around
    lin = lin * (1 - wt)[..., None] + fill * wt[..., None]
    o = np.clip(lin, 0, 1) ** (1 / 2.2)
    Image.fromarray(np.round(o * 255).astype(np.uint8)).save(os.path.join(out, 'look_mars_%dk.jpg' % (w // 1024)), quality=88, optimize=True)
