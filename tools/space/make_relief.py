#!/usr/bin/env python3
"""Tangent-space normal maps (and a height map) for a body, from an elevation model in an equirectangular projection.

usage: make_relief.py moon  DEM.tif  OUTDIR [--exag 1]
       make_relief.py array NAME HEIGHTS.npy RADIUS_M OUTDIR [--exag 1]    (HEIGHTS: float32 metres, row 0 = north)

The Moon's input is NASA SVS 4720 (CGI Moon Kit), LRO LOLA, "Ldem_64_uint.tif": unsigned 16 bit, 64 pixels per degree,
height = DN * 0.5 m - 10000 m above a sphere of radius 1737.4 km (the header of the kit's page; checked: the lowest DN is -9.1 km, the floor of
the South Pole-Aitken basin, and the highest +10.76 km). Centred on 0 degrees longitude, row 0 = north, so it lines up with an
equirectangular map in the app's own convention (u = 0.5 at longitude 0).

Output, for each size (4096 and 2048 wide): look_<name>_nrm_<size>.jpg, a tangent-space normal map (r = east, g = north, b = up; the OpenGL
convention that three.js reads with the surface's own u and v). The slope is the true slope of the height model averaged over one output
pixel, multiplied by --exag (1 is the truth). Nothing here depends on the Sun: the light is the app's real Sun direction, in the shader.
Heights smaller than the pixel cannot be shown: at 4096 pixels one pixel is 2.7 km on the Moon, so only the larger craters, the basins and
the mountain ranges are in the map.
"""
import sys, os, json, struct, argparse
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None


def read_moon(path):
    f = open(path, 'rb'); f.seek(4); off = struct.unpack('<I', f.read(4))[0]; f.seek(off)
    n = struct.unpack('<H', f.read(2))[0]; tags = {}
    for _ in range(n):
        t, ty, c, v = struct.unpack('<HHII', f.read(12)); tags[t] = v
    f.seek(tags[273]); first = struct.unpack('<I', f.read(4))[0]
    a = np.memmap(path, dtype='<u2', mode='r', offset=first, shape=(tags[257], tags[256]))
    return (a.astype(np.float32) * 0.5 - 10000.0), 1737400.0


def resample(h, w):
    out = []
    im = Image.fromarray(h, mode='F')
    return np.asarray(im.resize((w, w // 2), Image.BOX), dtype=np.float32)


def normals(h, radius, exag):
    H, W = h.shape
    lat = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    dx = (2 * np.pi * radius / W) * np.maximum(np.cos(lat), 0.08)[:, None]   # metres per pixel, east
    dy = np.pi * radius / H
    hp = np.pad(h, ((1, 1), (0, 0)), mode='edge')
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / (2 * dx)
    gy = (hp[:-2] - hp[2:]) / (2 * dy)   # row 0 is north: north-pointing slope = h(north) - h(south)
    nx, ny, nz = -gx * exag, -gy * exag, np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx / l, ny / l, nz / l], -1), np.degrees(np.arctan(np.sqrt(gx * gx + gy * gy)))


def save(n, path):
    Image.fromarray(np.clip(np.round((n * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8)).save(path, quality=90, subsampling=0, optimize=True)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('kind'); ap.add_argument('args', nargs='+'); ap.add_argument('--exag', type=float, default=1.0)
    ap.add_argument('--sizes', default='4096,2048')
    a = ap.parse_args()
    if a.kind == 'moon': h, R = read_moon(a.args[0]); name, out = 'moon', a.args[1]
    else: name, h, R, out = a.args[0], np.load(a.args[1]).astype(np.float32), float(a.args[2]), a.args[3]
    os.makedirs(out, exist_ok=True); stats = {}
    for s in [int(x) for x in a.sizes.split(',')]:
        hs = resample(h, s); n, sl = normals(hs, R, a.exag)
        save(n, os.path.join(out, 'look_%s_nrm_%dk.jpg' % (name, s // 1024)))
        stats[s] = {'metres_per_pixel_equator': 2 * np.pi * R / s, 'rms_slope_deg': float(np.sqrt((sl ** 2).mean())), 'max_slope_deg': float(sl.max()), 'exag': a.exag}
        if s == 2048: np.save(os.path.join(out, name + '_h2k.npy'), hs)
    print(json.dumps(stats, indent=1))


if __name__ == '__main__': main()
