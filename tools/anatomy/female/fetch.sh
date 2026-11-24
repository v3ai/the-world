#!/bin/sh
# The woman's anatomy (data/anatomy_f/) is built from these three files, pinned by version and hash. They are not kept in the
# repository: this script downloads them into $WORK/src (default work/anatomy_f/src) and stops if a file is not the one the build
# was made from. A file already there with the right hash is not downloaded again.
#   Human Reference Atlas, 3D Reference Organ Set for Female v1.10 (K. Browne, H. Schlehlein; CC BY 4.0; doi:10.48539/HBM637.DWBM.744)
#   and its crosswalk of node names to ontology terms; Pelvis, Female v1.3 (doi:10.48539/HBM853.VCFM.778), for the pubis and ischium.
set -eu
WORK=${WORK:-work/anatomy_f}
mkdir -p "$WORK/src"
UA='Mozilla/5.0 (compatible; anatomy-build)'
get() { # url file sha256
  f="$WORK/src/$2"
  if [ -f "$f" ] && [ "$(sha256sum "$f" | cut -d' ' -f1)" = "$3" ]; then echo "have $2"; return; fi
  curl -fL --retry 3 -A "$UA" -o "$f.part" "$1"
  h=$(sha256sum "$f.part" | cut -d' ' -f1)
  if [ "$h" != "$3" ]; then echo "HASH MISMATCH for $2: $h (expected $3). The source has changed; do not build from it." >&2; rm -f "$f.part"; exit 1; fi
  mv "$f.part" "$f"; echo "got $2"
}
B=https://cdn.humanatlas.io/digital-objects/ref-organ
get $B/united-female/v1.10/assets/3d-vh-f-united.glb 3d-vh-f-united.glb 95f0c3d2f918582608692ca1139e8bdb18c147a16470e9ee9af8b276bd77c422
get $B/united-female/v1.10/assets/crosswalk.csv crosswalk.csv 2a367d3ad8c1cf1b083c884aed7d99fb3b504d482e1e49570ecdb4f03c84d55f
get $B/pelvis-female/v1.3/assets/3d-vh-f-pelvis.glb 3d-vh-f-pelvis.glb 6ef3436e42b7203afcdfa075e57098e97c4e1aaaec08cfdacf6300ba3d5a551d
