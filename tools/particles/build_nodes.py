#!/usr/bin/env python3
"""Write data/nodes/phys_particles.json and data/viz/particles.json. Run after build_particles.py:
   python3 -I tools/particles/build_nodes.py   (from the repo root)"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nodelib
import nodes_particles, nodes_concepts
from nodelib import NODES, VIZ, ROOT
ids = [n['id'] for n in NODES]
assert len(ids) == len(set(ids)), 'duplicate node ids'
json.dump(NODES, open(os.path.join(ROOT, 'data', 'nodes', 'phys_particles.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(VIZ, open(os.path.join(ROOT, 'data', 'viz', 'particles.json'), 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'nodes,', len(VIZ), 'figures')
