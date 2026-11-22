#!/usr/bin/env python3
"""Mars heights (metres, equirectangular, row 0 = north) recovered from NASA's colour-coded MOLA topography map.

usage: mars_heights.py MOLA_HIRES.jpg MOLA_KEY.jpg OUT.npy [WIDTH=4096]

Inputs (Wikimedia Commons, public domain, NASA / Goddard Space Flight Center, from mola.gsfc.nasa.gov/images.html):
  "Mars topography (MOLA dataset) HiRes.jpg": 12140 x 6940, Mercator, +-70 degrees, 32 pixels per degree of longitude, the MGS MOLA elevation in
     the colour scale of the key, shaded relief laid over it;
  "MOLA map color elevation key.jpg": the scale, -8.5 to +14 km (ticks every km).
The original altimetry (USGS Astropedia, MGS MOLA DEM 463 m) could not be fetched from this machine, so the heights are read back from the colours:
each pixel takes the elevation of the nearest colour on the key, comparing the proportions of red, green and blue (the shading changes the
brightness, not the hue) and, to separate the brown-to-white end, the lightness a little. Consequences, all stated in the app:
  * heights above about +10 km are not separable (the key runs into grey), so Olympus Mons (21 km) and the Tharsis volcanoes are clipped;
  * the vertical error is of the order of a kilometre; craters smaller than about 30 km are not in the data (their shading is not elevation);
  * the map stops at 70 degrees: beyond it the surface is held flat at the edge value, so the polar caps have no relief.
Frame of the map found by detecting the black border (x 313..11832, y 384..6783 inside it); the equator row is the middle one.
"""
import sys, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

hi, key, out = sys.argv[1:4]; W = int(sys.argv[4]) if len(sys.argv) > 4 else 4096
X0, X1, Y0, Y1 = 313, 11833, 384, 6784
img = Image.open(hi).convert('RGB').crop((X0, Y0, X1, Y1))
# the key: bar from x=317 (-8.5 km) to 2365 (+14.0 km) at 91.0 px per km, zero at 1091
k = np.asarray(Image.open(key).convert('RGB')).astype(np.float64)
bar = k[200:240, 320:2362].mean(0)                      # 2042 columns
lum = bar.sum(1); bad = lum < np.convolve(lum, np.ones(9) / 9, 'same') * 0.93   # the thin black tick lines
xs = np.arange(len(bar)); good = ~bad
lut = np.stack([np.interp(xs, xs[good], bar[good, c]) for c in range(3)], 1)
elev = (xs + 320 - 1091) / 91.0 * 1000.0                 # metres

# Mercator crop -> width W, then to equirectangular rows
h_c = int(round(img.height * W / img.width))
m = np.asarray(img.resize((W, h_c), Image.BOX))
yeq = h_c / 2.0
Hh = W // 2; lat = (0.5 - (np.arange(Hh) + 0.5) / Hh) * np.pi
inside = np.abs(lat) < np.radians(70.0)
ky = (W / (2 * np.pi)) * np.log(np.tan(np.pi / 4 + lat[inside] / 2))
ysrc = np.clip(yeq - ky, 0, h_c - 1.001); y0 = ysrc.astype(int); fy = (ysrc - y0)[:, None, None]
rows = m[y0] * (1 - fy) + m[np.minimum(y0 + 1, h_c - 1)] * fy       # (n, W, 3)

def chroma(c): s = c.sum(-1, keepdims=True) + 1e-6; return c / s
lc = chroma(lut); ll = lut.sum(1) / 765.0
q = (rows / 8).astype(np.int32); code = (q[..., 0] << 16) | (q[..., 1] << 8) | q[..., 2]
u, inv = np.unique(code, return_inverse=True)
col = np.stack([(u >> 16) & 255, (u >> 8) & 255, u & 255], 1) * 8.0 + 4.0
pc = chroma(col); pl = col.sum(1) / 765.0
res = np.empty(len(u), np.float32)
for i in range(0, len(u), 2000):
    d = ((pc[i:i + 2000, None, :] - lc[None]) ** 2).sum(-1) * 30.0 + 0.5 * (pl[i:i + 2000, None] - ll[None]) ** 2
    res[i:i + 2000] = elev[d.argmin(1)]
hts = res[inv].reshape(rows.shape[0], W)
# smooth over a few pixels: the colour steps of the key give terraces
k5 = np.ones(5) / 5
for ax in (0, 1): hts = np.apply_along_axis(lambda v: np.convolve(np.pad(v, 2, mode='edge'), k5, 'valid'), ax, hts)
full = np.zeros((Hh, W), np.float32); full[inside] = hts
n = np.where(inside)[0]; top, bot = n[0], n[-1]
full[:top] = hts[0].mean(); full[bot + 1:] = hts[-1].mean()
np.save(out, full)
print('rows', top, bot, 'min', full.min(), 'max', full.max(), 'mean', full.mean())
