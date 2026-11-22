#!/usr/bin/env python3
"""Copy the surface sets the park's things use under the realistic look (?look=2) from the licence-checked staging folder into
assets/look/, re-encoded to the size docs/DESIGN.md 3.14 allows. Every set is CC0; its attribution line is in assets/ATTRIBUTION.md.

usage: python3 tools/things/look_assets.py /path/to/assets_staging      (needs Pillow)

Colour maps: JPEG quality 80. Normal maps (OpenGL convention): JPEG quality 85 without chroma subsampling, so the two slopes are
not blurred into each other. The oak leaf atlas: colour at 1024 px (each leaf 340 x 512 px), opacity as a greyscale JPEG.
"""
import sys, os
from PIL import Image

SETS = [   # (source file under staging, file in assets/look, size in px, kind of map)
    ('ground/forest_ground_06/forest_ground_06_color_1k.jpg', 'forest_ground_06_color_512.jpg', 512, 'color'),
    ('ground/forest_ground_06/forest_ground_06_normal_gl_1k.jpg', 'forest_ground_06_normal_gl_512.jpg', 512, 'normal'),
    ('ground/brown_mud_03/brown_mud_03_color_1k.jpg', 'brown_mud_03_color_512.jpg', 512, 'color'),
    ('ground/brown_mud_03/brown_mud_03_normal_gl_1k.jpg', 'brown_mud_03_normal_gl_512.jpg', 512, 'normal'),
    ('bark_rock_wood/dry_river_pebbles/dry_river_pebbles_color_1k.jpg', 'dry_river_pebbles_color_512.jpg', 512, 'color'),
    ('bark_rock_wood/dry_river_pebbles/dry_river_pebbles_normal_gl_1k.jpg', 'dry_river_pebbles_normal_gl_512.jpg', 512, 'normal'),
    ('bark_rock_wood/mossy_rock/mossy_rock_color_1k.jpg', 'mossy_rock_color_512.jpg', 512, 'color'),
    ('bark_rock_wood/ambientcg_leafset016/ambientcg_leafset016_color_1k.jpg', 'LeafSet016_color_1k.jpg', 1024, 'color'),
    ('bark_rock_wood/ambientcg_leafset016/ambientcg_leafset016_opacity_1k.jpg', 'LeafSet016_opacity_1k.jpg', 1024, 'grey'),
    ('bark_rock_wood/ambientcg_leafset016/ambientcg_leafset016_normal_gl_1k.jpg', 'LeafSet016_normal_gl_512.jpg', 512, 'normal'),
]


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else '/home/rhett/projects/how/.devtools/assets_staging'
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'look')
    for s, d, px, kind in SETS:
        im = Image.open(os.path.join(src, s))
        im = im.convert('L' if kind == 'grey' else 'RGB')
        if im.size != (px, px): im = im.resize((px, px), Image.LANCZOS)
        p = os.path.join(out, d)
        if kind == 'normal': im.save(p, 'JPEG', quality=85, subsampling=0, optimize=True)
        else: im.save(p, 'JPEG', quality=80, optimize=True)
        print('%-40s %8d bytes' % (d, os.path.getsize(p)))


if __name__ == '__main__':
    main()
