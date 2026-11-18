"""Shared helpers for the EE content graph generators."""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BOOKS = json.load(open(ROOT + '/data/library/books.json'))
SEC = {}
for _b in BOOKS:
    for _n, _t, _secs in _b['ch']:
        for _s in _secs:
            if _s[0]:
                SEC[(_b['c'], _s[0])] = _s[2]

AREAS = [  # (hub id, syllabus title)
    ('ee_math', 'Mathematics'),
    ('ee_physics', 'Physics and Chemistry'),
    ('ee_programming', 'Programming and Computing'),
    ('ee_circuits', 'Circuit Analysis (Circuits I and II)'),
    ('ee_electronics', 'Electronics (Electronics I and II)'),
    ('ee_digital', 'Digital Logic Design'),
    ('ee_architecture', 'Computer Architecture and Microcontrollers'),
    ('ee_signals', 'Signals and Systems'),
    ('ee_dsp', 'Digital Signal Processing (DSP)'),
    ('ee_em', 'Electromagnetics'),
    ('ee_devices', 'Semiconductor Devices and Solid-State Electronics'),
    ('ee_control', 'Control Systems'),
    ('ee_comm', 'Communication Systems'),
    ('ee_power', 'Power Systems and Energy Conversion'),
    ('ee_labs', 'Labs and Hands-On Skills'),
    ('ee_electives', 'Electives and Specializations'),
]
AREA_IDS = [a for a, _ in AREAS]

# Planned (not yet built) lab presets: id -> (lab, one-line spec). Built presets are listed in KNOWN.
KNOWN_CIRCUIT = set("""ohms_law series_parallel voltage_divider current_divider kvl_kcl nodal_analysis superposition thevenin max_power rc_charging rl_transient rlc_damping ac_phasors power_factor low_pass high_pass band_pass notch resonance_q transformer half_wave_rectifier bridge_rectifier zener_regulator led_circuit bjt_switch common_emitter mosfet_switch cmos_inverter inverting_amp non_inverting_amp summing_amp integrator differentiator comparator schmitt_trigger wien_oscillator rc_ladder""".split())
KNOWN_DEVICE = set("""bands_formation fermi_dirac intrinsic_si n_type p_type carrier_vs_temp drift_diffusion pn_equilibrium pn_forward pn_reverse pn_breakdown led_colors solar_cell bjt_output bjt_active mos_capacitor mosfet_output mosfet_transfer short_channel finfet cmos_vtc cmos_nand fab_process""".split())

NODES = []
_cur = {'area': None}

def area(a):
    _cur['area'] = a

def _refs(s):
    out = []
    for t in (s or '').split():
        b, sec = t.split(':')
        out.append([b, sec, SEC[(b, sec)]])
    return out

def n(id, title, kind, needs, summary, basics, deeper, expert, f=None, fa=None, d=None,
      r='', x='', lab=None, w=None, kn='', c='C1', oq=None, par=None, tmpl='concept',
      scale=None, hs=None, parts=(), made=(), proc=(), rel=(), mol=(), steps=None):
    """needs/kn/par/parts: space-separated id strings. lab 'circuit:ohms_law'. x 'title|url;title|url'."""
    sp = lambda s: s.split() if isinstance(s, str) else list(s)
    dd = {"id": id, "title": title, "kind": kind, "template": tmpl, "scale_m": scale,
          "area": _cur['area'],
          "parents": sp(par) if par is not None else [_cur['area']],
          "parts": sp(parts), "made_of": sp(made), "processes": sp(proc), "related": sp(rel), "mesh": None}
    if hs:
        dd["hotspot"] = {"of": hs[0], "at": list(hs[1]), "label": hs[2]}
    dd["needs"] = sp(needs)
    dd["summary"] = summary
    dd["layers"] = {"basics": basics, "deeper": deeper, "expert": expert}
    dd["facts"] = [list(t) for t in (fa or [])]
    if f: dd["formula"] = f
    if d: dd["did_you_know"] = d
    dd["certainty"] = c
    if oq: dd["open_questions"] = oq
    dd["refs"] = _refs(r)
    if x:
        dd["ext"] = [{"title": t.split('|')[0], "url": t.split('|')[1]} for t in x.split(';')]
    if kn: dd["kn"] = sp(kn)
    if lab:
        l, p = lab.split(':')
        dd["lab"] = {"id": l, "preset": p}
    if w: dd["where"] = w
    if mol: dd["molecules"] = sp(mol)
    if steps: dd["steps"] = [{"title": a, "text": b, "focus": sp(c2)} for a, b, c2 in steps]
    NODES.append(dd)
    return dd

def save(name):
    path = ROOT + f'/data/nodes/{name}.json'
    json.dump(NODES, open(path, 'w'), indent=1, ensure_ascii=False)
    print(name, len(NODES)); NODES.clear()

from urllib.parse import unquote
def wp(*titles):
    """Wikipedia links (stable article titles) as an x= string."""
    return ';'.join(f"Wikipedia: {unquote(t).replace('_',' ')}|https://en.wikipedia.org/wiki/{t}" for t in titles)
AAC = "All About Circuits textbook|https://www.allaboutcircuits.com/textbook/"
