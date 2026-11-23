#!/usr/bin/env python3
"""Copy the surface sets the park's things use under the realistic look (?look=2) from the licence-checked staging folder into
assets/look/, re-encoded to the size docs/DESIGN.md 3.14 allows. Every set is CC0; its attribution line is in assets/ATTRIBUTION.md.

usage: python3 tools/things/look_assets.py /path/to/assets_staging      (needs Pillow)

Colour maps: JPEG quality 80. Normal maps (OpenGL convention): JPEG quality 85 without chroma subsampling, so the two slopes are
not blurred into each other. The oak leaf atlas (LeafSet016 at 2K, staged as ambientcg_leafset016_2k): colour and opacity at 512 px for every
oak, fetched with the first leaves, and at 2048 px (each leaf about 680 x 1024 px, so a leaf that fills a third of the screen is not
magnified) fetched only when the camera comes close to an oak, so the park's views stay inside the download budget; normal at 512 px. The colour's background
(where the opacity map is clear) is filled with the leaves' own mean colour: it is never seen, the runtime reads the outline from the
opacity map, and a flat background costs almost nothing in the JPEG and does not bleed a white fringe into the leaf edge at coarse mips.
The oak bark's height (Jolcham Oak Bark 01's displacement map, 1 x 2 m of bark) at 512 x 1024 px, greyscale: the trunk's relief under
the look is drawn from it (parallax), alongside the colour and normal the foundation already ships.
"""
import sys, os
from PIL import Image, ImageFilter

SETS = [   # (source file under staging, file in assets/look, size in px, kind of map)
    ('ground/forest_ground_06/forest_ground_06_color_1k.jpg', 'forest_ground_06_color_512.jpg', 512, 'color'),
    ('ground/forest_ground_06/forest_ground_06_normal_gl_1k.jpg', 'forest_ground_06_normal_gl_512.jpg', 512, 'normal'),
    ('ground/brown_mud_03/brown_mud_03_color_1k.jpg', 'brown_mud_03_color_512.jpg', 512, 'color'),
    ('ground/brown_mud_03/brown_mud_03_normal_gl_1k.jpg', 'brown_mud_03_normal_gl_512.jpg', 512, 'normal'),
    ('bark_rock_wood/dry_river_pebbles/dry_river_pebbles_color_1k.jpg', 'dry_river_pebbles_color_512.jpg', 512, 'color'),
    ('bark_rock_wood/dry_river_pebbles/dry_river_pebbles_normal_gl_1k.jpg', 'dry_river_pebbles_normal_gl_512.jpg', 512, 'normal'),
    ('bark_rock_wood/mossy_rock/mossy_rock_color_1k.jpg', 'mossy_rock_color_512.jpg', 512, 'color'),
    ('bark_rock_wood/ambientcg_leafset016_2k/LeafSet016_2K-JPG_Color.jpg', 'LeafSet016_color_2k.jpg', 2048, 'leafcolor'),
    ('bark_rock_wood/ambientcg_leafset016_2k/LeafSet016_2K-JPG_Opacity.jpg', 'LeafSet016_opacity_2k.jpg', 2048, 'grey'),
    ('bark_rock_wood/ambientcg_leafset016_2k/LeafSet016_2K-JPG_Color.jpg', 'LeafSet016_color_512.jpg', 512, 'leafcolor'),
    ('bark_rock_wood/ambientcg_leafset016_2k/LeafSet016_2K-JPG_Opacity.jpg', 'LeafSet016_opacity_512.jpg', 512, 'grey'),
    ('bark_rock_wood/ambientcg_leafset016_2k/LeafSet016_2K-JPG_NormalGL.jpg', 'LeafSet016_normal_gl_512.jpg', 512, 'normal'),
    ('bark_rock_wood/jolcham_oak_bark_01/jolcham_oak_bark_01_displacement_1k.jpg', 'jolcham_oak_bark_01_height_512.jpg', (512, 1024), 'grey'),
]
LEAF_MASK = 'bark_rock_wood/ambientcg_leafset016_2k/LeafSet016_2K-JPG_Opacity.jpg'


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else '/home/rhett/projects/how/.devtools/assets_staging'
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'look')
    for s, d, px, kind in SETS:
        im = Image.open(os.path.join(src, s))
        im = im.convert('L' if kind == 'grey' else 'RGB')
        sz = px if isinstance(px, tuple) else (px, px)
        if im.size != sz: im = im.resize(sz, Image.LANCZOS)
        if kind == 'leafcolor':   # background -> the leaves' mean colour (see the docstring)
            mk = Image.open(os.path.join(src, LEAF_MASK)).convert('L').resize((px, px), Image.LANCZOS).point(lambda v: 255 if v >= 128 else 0)
            hist = [0, 0, 0]; n = 0; px_ = im.load(); m_ = mk.load()
            for y in range(0, px, 4):
                for x in range(0, px, 4):
                    if m_[x, y]: c = px_[x, y]; hist[0] += c[0]; hist[1] += c[1]; hist[2] += c[2]; n += 1
            bg = Image.new('RGB', im.size, tuple(int(v / max(n, 1)) for v in hist)); im = Image.composite(im, bg, mk.filter(ImageFilter.MaxFilter(9)))
        p = os.path.join(out, d)
        if kind == 'normal': im.save(p, 'JPEG', quality=85, subsampling=0, optimize=True)
        else: im.save(p, 'JPEG', quality=80, optimize=True)
        print('%-40s %8d bytes' % (d, os.path.getsize(p)))


if __name__ == '__main__':
    main()
