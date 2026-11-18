#!/usr/bin/env python3
"""Extract the PDG 2026 values this project uses from the official PDG SQLite file.

Usage: python3 -I extract_pdg.py /path/to/pdg-2026.0.sqlite  > pdg_extract.json
The database is downloaded from https://pdg.lbl.gov/2026/api/pdg-2026.0.sqlite (licence CC BY 4.0).
Every record keeps its PDG identifier, the text PDG prints, and the numeric value, so data/particles.json
never contains a hand-typed measured number: build_particles.py looks values up here by PDG id.
"""
import json, sqlite3, sys

db = sqlite3.connect(sys.argv[1])
info = dict(db.execute("select name,value from pdginfo").fetchall())

# every PDG identifier we use; the label is only for readers of this file
IDS = """
Q001M Q002M Q003M Q004M Q005M Q007TP Q007TP2 Q007TP4 Q007W Q007R9 Q007R10 Q007R6
S003M S004M S004T S035M S035T S003T S003TD
S066MAE S066M2E S066MNE S066MNM S066MNT S066CHR S066MGM
S067P12 S067DM3 S067P23 S067DM1 S067P13 S067DEL
S000M S000Q
S043M S043W S044M S044W S126M S126W
S043.7 S043.8 S043.1 S043.2 S043.5
S044.7 S044.9 S044.16 S044.1 S044.2 S044.8
S126.4 S126.1 S126.5 S126.2 S126.3 S126.8 S126.7
S035.2 S035.1 S035.12 S035.16 S035.257
S008.1 S009.1 S009.2 S010.1 S010.2 S010.3 S010.6
S012.1 S012.2 S013.4 S013.3 S013.1 S013.2
S018.1 S018.2 S024.1 S024.2 S024.3 B033.1
S016M S016AMU S016T S016CR S016MCR S016MM S016DQ S017M S017AMU S017T S017MM S017MCR S017D S017Q S017R1
S008M S008T S009M S009T S010M S010T S011M S012T S013T S018M S018T S024M S024T M070M M070W M049M M049W B033M B033W
S031M S031T S032M S032T S041M S041T S042M S042T S033M S014M
M070.1 M070.2 M070.3 M049.1 M049.2 M049.101
""".split()

def rec(pid):
    r = db.execute("select id,description,data_type from pdgid where pdgid=?", (pid,)).fetchone()
    if not r: return {"pdgid": pid, "missing": True}
    rows = db.execute("""select value_type,in_summary_table,confidence_level,limit_type,comment,value,value_text,
        error_positive,error_negative,scale_factor,unit_text from pdgdata where pdgid_id=? order by in_summary_table desc, id""", (r[0],)).fetchall()
    out = {"pdgid": pid, "description": r[1], "values": []}
    for v in rows:
        out["values"].append(dict(zip(["type","in_summary","cl","limit","comment","value","text","err_plus","err_minus","scale","unit"], v)))
    return out

res = {"_meta": {"edition": info.get("edition"), "citation": info.get("citation"), "licence": info.get("license"),
                 "release": info.get("data_release_timestamp"), "source": "https://pdg.lbl.gov/2026/api/pdg-2026.0.sqlite"},
       "records": {p: rec(p) for p in IDS}}
# the proton limit on N -> e+ pi sits in the measurement table (one row per particle), not in the summary value: pick the p row marked "used in average"
r = db.execute("select id from pdgid where pdgid='S016T06'").fetchone()
for m in db.execute("select id,technique from pdgmeasurement where pdgid_id=? order by sort", (r[0],)).fetchall():
    vals = {c: (vt, v, cl) for c, vt, v, cl in db.execute("select column_name,value_text,value,used_in_average from pdgmeasurement_values where pdgmeasurement_id=?", (m[0],))}
    if vals['PARTICLE'][0] == 'p' and vals['LIMIT'][2] == 1:
        res["records"]["S016T06P"] = {"pdgid": "S016T06", "description": "tau(N --> e+ pi), limit for the proton (" + m[1] + "), 90% CL",
            "values": [dict(type="L", in_summary=1, cl=float(vals['CL%'][0]), limit="L", comment=None, value=vals['LIMIT'][1], text=vals['LIMIT'][0], err_plus=0.0, err_minus=0.0, scale=None, unit="years")]}
        break
# quantum numbers from the particle table
q = {}
for mc in (1,2,3,4,5,6,11,12,13,14,15,16,21,22,23,24,25,211,111,321,310,130,443,553,2212,2112,3122,2224,3334,-11,-1,-2,-3,-4,-5,-6):
    r = db.execute("select pdgid,name,cc_type,charge,quantum_j from pdgparticle where mcid=?", (mc,)).fetchone()
    if r: q[str(mc)] = dict(zip(["pdgid","name","cc_type","charge","J"], r))
res["particles"] = q
res["missing"] = [p for p, v in res["records"].items() if v.get("missing")]
json.dump(res, sys.stdout, indent=1, ensure_ascii=False)
