#!/bin/sh
# Regenerate all EE nodes, finalize, build track, validate.
cd "$(dirname "$0")" || exit 1
rm -f ../../data/nodes/ee_*.json
for g in g_math g_phys g_prog g_circ g_elec g_digital g_arch g_sig g_em g_ctrl g_power g_elect g_teardown g_hubs; do python3 $g.py || exit 1; done
python3 finalize.py && python3 track.py && python3 validate.py && python3 report.py
