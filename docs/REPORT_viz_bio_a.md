# Figure report: bio_a (biology hubs, chemistry, biochemistry, cell, molecular, genetics, genomics, microbiology, development)

File: data/viz/bio_a.json. Generator: tools/viz/gen_bio_a/ (gen.py, p1-p6.py, lib.py, shot.py).

Coverage: 212 of 212 nodes (100%); validator 0 errors; every batch rendered in headless Chrome with no VIZ_ERRORS and visually reviewed.

## Counts by type
- blocks: 78
- plot: 66
- geometry: 30
- bars: 15
- table: 15
- graph: 7
- dist: 1

Figures with at least one slider: 96.

## Weak spots
- Section hubs are grids of boxes without edges.
- Long labels were abbreviated in dense block diagrams; snake-layout chains are read by arrows.
- Geometry sketches (peptide bond, replication fork, transcription bubble, ribosome, induced fit) are schematic.
- GWAS, growth-curve, enzyme-temperature and similar curves are illustrative models; NGS output, microbiome density and genome-identity bars are approximate.
- Log-y plots (DNA profiling, BLAST, pH) have crowded axis labels.
