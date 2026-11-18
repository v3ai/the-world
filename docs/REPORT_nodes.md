# Human-body nodes report
Total nodes: 230. By kind: {'organ': 75, 'structure': 76, 'cell': 27, 'organelle': 9, 'process': 16, 'organism': 1, 'system': 11, 'tissue': 15}. Certainty: {'C1': 225, 'C2': 4, 'C3': 1}.
Files (data/nodes/): body_systems, body_skeletal, body_muscles, body_nervous, body_cardio_resp, body_viscera, body_tissues, body_cells, body_organelles, body_processes, body_extra.
Scripts: work/scripts_nodes/run_all.sh (runs g_*.py generators, then finalize.py which adds reciprocal parts, patches links and validates).
Validation: unique ids; all parents/parts/made_of/processes/related/hotspot/focus ids resolve; all refs match books.json (code, section, slug); molecule ids exist in molecules_all.json or data/proteins; kn ids exist; every node reachable from human_body via parts/made_of/processes. Errors: 0. Unreachable: 0.
Mesh coverage: all 71 requested mesh ids present. Hotspots: 58.
Gaps / notes:
- `related` is mostly empty (processes are linked to organs via `processes`); `parts` of systems are derived from `parents`.
- Hotspot coordinates are rough anatomical estimates (frame: organ centre, Y up, +Z anterior, +X body left); right-sided hosts (lung_r, kidney_r, eye_r) are used for shared parts.
- Nephron parts use template "micro" with hotspots in the nephron frame; long_bone is a generic structure hosting compact/spongy bone, marrow, periosteum, growth plate hotspots.
- Not covered: ear/hearing, individual cranial nerves, most smaller muscles, joints beyond a generic synovial joint, detailed reproductive anatomy.
- C2/C3 nodes: hippocampus, microbiome (C3), hematopoietic stem cell, blood_vessels length figure, amygdala.
- Prose was written originally (paraphrased), figures are typical textbook values marked with ≈.
