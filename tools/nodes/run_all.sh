#!/bin/sh
cd work/scripts_nodes
for g in g_systems g_skel g_muscle g_nerv g_cardio g_visc g_tissue g_cells g_org g_proc g_extra; do python3 $g.py >/dev/null || exit 1; done
python3 finalize.py
