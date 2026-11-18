#!/bin/bash
# usage: shot2.sh from n
cd . && python3 tools/viz/gen_bio_a/shot.py $1 $2 && python3 -c "
from PIL import Image
im=Image.open('/tmp/bio_%03d.png'%$1);im.resize((int(im.width*.6),int(im.height*.6))).save('/tmp/bio_%03ds.png'%$1)"
