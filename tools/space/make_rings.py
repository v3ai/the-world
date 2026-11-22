#!/usr/bin/env python3
"""Saturn's ring profile: a 1-D map (radius -> opacity and brightness) with the rings, divisions and gaps at their measured radii.

usage: make_rings.py OLD_RING_PNG OUT_PNG [WIDTH=8192]  (the app uses 8192 at the high level and 4096 at the low level)

What is measured (all from the table of ring radii and optical depths in the "Rings of Saturn" article, which cites NASA's Saturn ring
pages, the IAU Gazetteer of Planetary Nomenclature and Hedman et al. 2016; opened 2026-11-22): the edges of the C, B and A rings, the Cassini Division,
the named gaps and their widths (Colombo, Maxwell, Bond, Dawes, Huygens, Herschel, Russell, Jeffreys, Kuiper, Laplace, Bessel, Barnard,
Encke, Keeler) and the range of optical depth in each ring (C 0.05-0.12, B 0.4 to more than 5, A 0.4-0.9).
What is not: the pattern of ringlets inside each ring is taken from the earlier map (assets/textures/saturn_ring.png, an artist's rendering of
the measured profiles, 4096 px for 62,280 km) and stretched to each ring's published range of optical depth, in rank order; it has the right
statistics, not the right ringlets. The Cassini Division's own optical depth (0.1) and the contents of the gaps (0.02) are assumed.
Output: 8192 x 4 PNG, r,g,b = brightness x opacity (the shader divides by opacity), a = 1 - exp(-tau); radius 74,500 to 136,780 km (the
mesh's own inner and outer edge).
"""
import sys, numpy as np
from PIL import Image

RI, RO = 74500.0, 136780.0
W = int(sys.argv[3]) if len(sys.argv) > 3 else 8192
SS = 4   # supersampling, so that the 35 km Keeler gap (4.6 px) is not aliased

old = np.asarray(Image.open(sys.argv[1])).astype(np.float64)[:, :, 3].mean(0) / 255.0
tau0 = -np.log(1 - np.minimum(old, 0.995))
# low-pass the old profile (about 6 px at 4096), then resample to the new grid
k = np.ones(7) / 7; tau0 = np.convolve(np.pad(tau0, 3, mode='edge'), k, mode='valid')
r = RI + (np.arange(W * SS) + 0.5) / (W * SS) * (RO - RI)
t_old = np.interp(r, RI + (np.arange(4096) + 0.5) / 4096 * (RO - RI), tau0)

def rank_map(mask, lo, hi, power=1.0):
    """stretch t_old inside mask to [lo, hi] by rank (percentile), so the pattern keeps its shape and the range is the published one"""
    v = t_old[mask]; rk = v.argsort().argsort() / max(len(v) - 1, 1)
    out = np.zeros_like(t_old); out[mask] = lo + (hi - lo) * rk ** power; return out

tau = np.zeros_like(r)
rings = [(74658, 92000, 0.05, 0.12), (92000, 117580, 0.4, 3.6), (122170, 136775, 0.4, 0.9)]
for a, b, lo, hi in rings:
    m = (r >= a) & (r < b); tau += rank_map(m, lo, hi, 0.8 if hi > 2 else 1.0)
tau[(r >= 117580) & (r < 122170)] = 0.1                       # the Cassini Division (assumed)
tau[(r >= 74500) & (r < 74658)] = 0.02                         # the D ring's outer part, very faint

# gaps: (centre km, width km, optical depth left in it); ringlets inside gaps: (centre, width, tau)
gaps = [(77870, 150, 0.02), (87491, 270, 0.02), (88700, 30, 0.02), (90210, 20, 0.02),
        (117680, 340, 0.03), (118234, 102, 0.02), (118614, 33, 0.02), (118950, 38, 0.02), (119405, 3, 0.02), (119967, 238, 0.02),
        (120241, 10, 0.02), (120312, 13, 0.02), (133589, 325, 0.02), (136505, 35, 0.02)]
ringlets = [(77870, 25, 0.35), (87491, 64, 0.5), (117848, 17, 0.5)]
for c, w, t in gaps:
    m = np.abs(r - c) < w / 2; tau[m] = np.minimum(tau[m], t)
for c, w, t in ringlets:
    m = np.abs(r - c) < w / 2; tau[m] = t

# brightness of the particles (display value, linear-ish): B brightest, A next, C and the Cassini Division darker
c = np.full_like(r, 0.5)
c[(r < 92000)] = 0.38; c[(r >= 92000) & (r < 117580)] = 0.62; c[(r >= 117580) & (r < 122170)] = 0.40; c[r >= 122170] = 0.52
tau = tau.reshape(W, SS).mean(1); c = c.reshape(W, SS).mean(1)
al = 1 - np.exp(-tau)
px = np.stack([c * al, c * al * 0.95, c * al * 0.88, al], -1)
img = np.clip(np.round(px * 255), 0, 255).astype(np.uint8)
Image.fromarray(np.repeat(img[None], 4, 0)).save(sys.argv[2], optimize=True)
print('tau range', tau.min(), tau.max(), 'alpha max', al.max())
