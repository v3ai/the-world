#!/usr/bin/env python3
"""Content of the lithium-ion cell (tools/things/models/li_cell.mjs): cards, figures, close-up scenes, crystals, materials.

Run from the repository root:  python3 tools/things/content/li_cell_content.py
Writes  data/nodes/thing_li_cell.json, data/viz/thing_li_cell.json (and lists both in their manifests),
        data/things/tissues/licell_{anode,cathode,separator}.json, data/descent/assign/li_cell.json,
        and adds rows (replacing its own earlier ones) to data/crystals.json and data/descent/materials.json.
Every number is from a source opened for this work; the list, with what each supports, is in SRC below and in the workstream notes.
"""
import json, os, math
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
def load(p): return json.load(open(os.path.join(ROOT, p), encoding='utf8'))
def save(p, o, indent=1):
    with open(os.path.join(ROOT, p), 'w', encoding='utf8') as f: json.dump(o, f, ensure_ascii=False, indent=indent); f.write('\n')

SRC = {
 'nobel': {'title': 'Royal Swedish Academy of Sciences: Scientific Background on the Nobel Prize in Chemistry 2019, Lithium-ion batteries', 'url': 'https://www.kva.se/app/uploads/2019/10/scibackkeen19.pdf'},
 'note7': {'title': 'Loveridge et al. 2018, Looking Deeper into the Galaxy (Note 7), Batteries 4, 3 (a teardown of a phone cell)', 'url': 'https://wrap.warwick.ac.uk/id/eprint/101027/'},
 'ai2020': {'title': 'Ai et al. 2020, J. Electrochem. Soc. 167, 013512: the measured pouch cell whose layer thicknesses the model uses', 'url': 'https://doi.org/10.1149/2.0122001JES'},
 'pybamm': {'title': 'PyBaMM parameter set Ai2020 (thicknesses, particle sizes and voltage curves of that cell)', 'url': 'https://github.com/pybamm-team/PyBaMM/blob/v24.1/pybamm/input/parameters/lithium_ion/Ai2020.py'},
 'hertz': {'title': 'Hertz et al. 2008, Phys. Rev. B 77, 075119: the structure of LiCoO2 by neutron diffraction', 'url': 'https://arxiv.org/abs/0710.3767'},
 'psi': {'title': 'Novák, Heß and Villevieille (Paul Scherrer Institut): graphite and LiC6 followed by diffraction during charging (poster)', 'url': 'https://psi.ch/de/media/46091/download'},
 'xiong': {'title': 'Xiong et al. 2025, Science Advances 11, eadx5020: lithium cobalt oxide and its capacity at different voltages', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12442873'},
 'sei': {'title': 'Beheshti et al. 2022, iScience: the graphite-electrolyte interphase (review)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8859004/'},
 'plating': {'title': 'Chen et al. 2025, ACS Electrochemistry: lithium intercalation and plating on graphite', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12051203/'},
 'separator': {'title': 'Li et al. 2021, Molecules 26, 478: lithium-ion battery separators (review)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7831081/'},
 'solid': {'title': 'Review of anode-less sulfide all-solid-state cells (2025)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12696776'},
 'dw01': {'title': 'DW01 one-cell lithium-ion protection chip: datasheet', 'url': 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/7158/5272_DW01.pdf'},
 'ifixit': {'title': 'iFixit: iPhone 15 Pro Max replacement battery (label values)', 'url': 'https://www.ifixit.com/en-eu/products/iphone-15-pro-max-battery'},
 'film': {'title': 'batterydesign.net: the laminated film of pouch cells (a trade reference)', 'url': 'https://www.batterydesign.net/battery-cell/formats/pouch-cells/pouch-cell-edge-seal-integrity/'},
 'wikiE': {'title': 'Wikipedia: Energy density (table of specific energies; a secondary source)', 'url': 'https://en.wikipedia.org/wiki/Energy_density'},
 'wikiLi': {'title': 'Wikipedia: Lithium-ion battery (a secondary source)', 'url': 'https://en.wikipedia.org/wiki/Lithium-ion_battery'},
}
def ext(*ks): return [SRC[k] for k in ks]

# ---------------------------------------------------------------- numbers (the model's, from tools/things/models/li_cell.mjs)
CU, AN, SEP, CA, AL, FILM = 10, 76.5, 25, 68, 15, 113            # micrometres (Ai2020 parameter set; film: trade reference)
PAIRS = 12
OCV = [(0, 3.60), (10, 3.67), (20, 3.72), (30, 3.75), (40, 3.77), (50, 3.80), (60, 3.85), (70, 3.92), (80, 4.00), (90, 4.09), (100, 4.18)]
# OCV: calculated here from the two half-cell voltage curves of the Ai2020 parameter set (graphite: Ai et al. 2020; LiCoO2: Rieger et al. 2016), for that cell's
# 2.28 Ah between its stated limits (graphite filled to 0.84 and the oxide emptied to 0.435 when full). See notes/anywhere.md for the calculation.

MODEL = 'This model'
def node(id, title, kind, summary, basics, deeper, expert, facts, certainty='C1', open_q=None, parents=None, parts=None, related=None, needs=None, refs=None, ex=None, scale=None, dyk=None, formula=None):
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': 'thing_li_cell', 'parents': parents or ['li_cell'], 'parts': parts or [], 'made_of': [], 'processes': [],
         'related': related or [], 'mesh': None, 'needs': needs or [], 'summary': summary, 'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': certainty,
         'open_questions': open_q or [], 'refs': refs or [['CHE', '17.5', '17-5-batteries-and-fuel-cells']], 'ext': ex or []}
    if dyk: n['did_you_know'] = dyk
    if formula: n['formula'] = formula
    return n

NODES = [
 node('li_cell', 'Battery (lithium-ion cell)', 'component',
  'One flat lithium-ion cell in a foil pouch: it stores energy by moving lithium between two stacks of coated metal sheets.',
  'A phone runs on a single flat cell. Inside a sealed foil pouch lie thin metal sheets, coated on both sides and stacked like the pages of a book: sheets coated with graphite (a form of carbon) alternate with sheets coated with a dark oxide of lithium and cobalt, and a thin porous plastic film keeps them from touching. Everything is soaked in a liquid that lithium can travel through. Charging moves lithium out of the oxide and into the graphite; using the phone lets it move back, and that return trip is what pushes electric current through the phone. Double-click the battery to cut it across, or choose One pair of sheets, Discharging or Charging above.',
  'The cell has two electrodes. The negative one is graphite on copper foil; the positive one is lithium cobalt oxide, LiCoO<sub>2</sub>, on aluminium foil. A lithium atom sits more comfortably (at lower energy) in the oxide than in the graphite, by about 3.6 to 4.2 electronvolts depending on how full the cell is. The lithium crosses inside the cell as a charged ion, Li<sup>+</sup>, through the liquid electrolyte; the electron it left behind cannot cross (the separator and the electrolyte do not conduct electrons), so it has to go round through the phone, delivering that energy on the way. The voltage printed on the cell, about 3.86 V, is the average over a discharge. A small circuit board on the cell switches it off if it is charged or drained too far.',
  'Half-reactions (to the right on discharge): negative Li<sub>x</sub>C<sub>6</sub> → C<sub>6</sub> + x Li<sup>+</sup> + x e<sup>−</sup>; positive Li<sub>1−x</sub>CoO<sub>2</sub> + x Li<sup>+</sup> + x e<sup>−</sup> → LiCoO<sub>2</sub>. Only part of the lithium is used: charging to 4.2 V takes about half of it out of the oxide (Li<sub>0.5</sub>CoO<sub>2</sub>, about 135 mAh/g of the theoretical 274 mAh/g); cells charged to 4.5 V reach about 185 mAh/g (Xiong et al. 2025). Graphite holds up to one lithium per six carbons, 372 mAh/g. ' + f'The model stacks {PAIRS} double-coated sheets of each kind with the layer thicknesses of a measured 2.28 Ah consumer pouch cell (Ai et al. 2020). Its oxide coatings hold about 18 g of LiCoO<sub>2</sub>, which gives about 2.5 Ah at 4.2 V: a calculation for this model. The label of a 2023 flagship cell says 4,422 mAh, so current phone cells pack more into a similar space, with thinner separators and foils, denser coatings and a higher charging voltage.',
  [['On the label of a 2023 flagship phone cell', '4,422 mAh, 3.86 V, 17.1 Wh (replacement part listing)'], ['Size of the model', '62 × 78 × 4.6 mm: the battery bay of the phone model, not a measured cell'], ['Sheets in the model', f'{PAIRS} graphite-coated and {PAIRS} oxide-coated, {2 * PAIRS} separators'], ['Voltage, empty to full', '≈ 3.6 to 4.2 V with nothing connected (calculated for the measured cell the layers come from)'], ['First commercial cell, 1991', 'charged to 4.1 V, ≈ 80 Wh/kg']],
  'C1', ['How long a cell lasts is set by slow side reactions (the growth of the skin on the graphite, loss of usable lithium, cracking of the oxide grains); predicting the life of a given cell from its chemistry is still not possible without testing it.', 'Whether a solid electrolyte can replace the liquid in a cell that can be mass-produced and charged quickly is not settled.'],
  parents=['smartphone'], parts=['licell_stack', 'licell_anode', 'licell_cathode', 'licell_separator', 'licell_cu_foil', 'licell_al_foil', 'licell_electrolyte', 'licell_pouch', 'licell_tabs', 'licell_pcm', 'licell_ion_shuttle', 'licell_electrons'],
  related=['licell_sei', 'licell_plating', 'licell_solid_state', 'how_a_phone_charges', 'phone_battery'], needs=['batteries_electrochem'], scale=.078,
  refs=[['CHE', '17.5', '17-5-batteries-and-fuel-cells'], ['UP2', '10.1', '10-1-electromotive-force']], ex=ext('nobel', 'note7', 'ai2020', 'ifixit', 'xiong'),
  dyk='The three people who made this cell possible shared the 2019 Nobel Prize in Chemistry: Stanley Whittingham (the first lithium cell with a layered electrode, 2.5 V, in the 1970s), John Goodenough (the cobalt oxide electrode, 1980) and Akira Yoshino (the carbon electrode, 1985).'),

 node('licell_stack', 'The electrode stack', 'structure',
  'Twelve pairs of coated sheets, each about a sixth of a millimetre thick, laid on top of one another.',
  f'Cut the cell across and you see stripes: the sheets, seen edge on. One negative sheet, one separator, one positive sheet and another separator are together {CU + 2 * AN + AL + 2 * CA + 2 * SEP:.0f} micrometres thick, about a third of a millimetre, so {PAIRS} such sets fill the cell. Thin sheets give a large area in a small space: the coated faces of this model add up to 860 cm², more than an A4 sheet of paper (624 cm²), and all of that area works at once. That is why a cell can deliver a large current without any single spot working hard.',
  f'Each negative sheet is a {CU} µm copper foil with a {AN} µm graphite coating on both faces; each positive sheet is a {AL} µm aluminium foil with a {CA} µm lithium cobalt oxide coating on both faces; a {SEP} µm porous separator lies between every two sheets. All the copper foils are joined to one tab and all the aluminium foils to the other, so the pairs work in parallel: the cell has the voltage of one pair and the capacity of all of them. In this model the sheets are separate rectangles, stacked. Many phone cells are instead made from two long strips wound up flat (a "jelly roll"): the Galaxy Note 7 cell was wound.',
  'The thicknesses are those of the Enertech pouch cell characterised for Ai et al. 2020 and Rieger et al. 2016 (2.28 Ah, 34 electrode pairs in parallel, 3.0 to 4.2 V), as listed in the open-source PyBaMM parameter set. Coating thickness is a trade-off: thicker coatings store more per unit of inactive foil and separator but lengthen the path of the ions through the pores, which limits how fast the cell can be charged. The Note 7 teardown found a separator of less than 5 µm with about 1 µm of alumina on each face: newer phone cells use much thinner separators than the 25 µm drawn here.',
  [['One set of layers', f'{CU + 2 * AN + AL + 2 * CA + 2 * SEP:.0f} µm'], ['Sets in the model', f'{PAIRS} (a calculation: they fill 4.368 of the 4.374 mm inside the pouch)'], ['Coated area in the model', '≈ 860 cm²'], ['Galaxy Note 7 separator', '< 5 µm plus ≈ 1 µm alumina per face']],
  'C1', ['Thicker coatings would store more energy, but ions then cannot get through fast enough during fast charging; how to build thick electrodes that still charge quickly is an active field of research.'],
  parts=['licell_cu_foil', 'licell_anode', 'licell_separator', 'licell_cathode', 'licell_al_foil'], related=['licell_electrolyte'], scale=.0044, ex=ext('ai2020', 'pybamm', 'note7')),

 node('licell_anode', 'Graphite coating (negative electrode)', 'material',
  'A layer of graphite grains on copper foil: where the lithium is kept while the cell is charged.',
  f'The dark coating on the copper foil is graphite, the form of carbon also used in pencil leads, as a packed layer of grains about a hundredth of a millimetre across. Graphite is made of flat sheets of carbon atoms stacked loosely, and lithium atoms can slip in between the sheets. Charging fills the gaps with lithium; using the phone empties them again. The coating here is {AN} micrometres thick. Look into it to see the grains, then into one grain to see lithium between the carbon sheets.',
  'Lithium enters graphite in stages: first every few gaps between sheets are filled, then every second one, finally every one, which gives LiC<sub>6</sub>, one lithium for six carbons. The carbon sheets are pushed apart from about 3.36 Å to 3.70 Å, so a full grain is about a tenth larger than an empty one, and the whole cell swells and shrinks slightly as it is charged and used. Graphite takes up lithium within about 0.2 V of lithium metal itself, which is what gives the cell its high voltage; it is also why charging too fast, or in the cold, can deposit lithium metal on the grains instead of inside them.',
  'LiC<sub>6</sub> (stage 1) is hexagonal, space group P6/mmm, a = 4.32 Å, c = 3.70 Å by in-situ diffraction (Paul Scherrer Institut); the carbon sheets lie directly above one another (AA stacking) instead of the ABAB of graphite (a = 2.46 Å, c = 6.72 Å for two sheets). Theoretical capacity 372 mAh/g. Volume expansion on full lithiation is about 10 % (10 to 15 % is quoted). The electrolyte is not stable at these potentials: it is reduced on the first charge and leaves a thin solid skin on every grain, the SEI, which then protects the rest. The parameter set of the measured cell gives grains of 5 µm radius and a porosity of 33 %; both are fitted model values.',
  [['Thickness on each face of the foil', f'{AN} µm (measured consumer pouch cell)'], ['Capacity of graphite', '372 mAh/g when full (LiC₆)'], ['Sheet spacing', '≈ 3.36 Å empty, 3.70 Å full'], ['Swelling when full', '≈ 10 %']],
  'C1', ['Adding silicon to the graphite stores more lithium, but silicon swells several-fold; how much silicon a long-lived cell can carry is still being worked out.'],
  parts=['licell_graphite'], related=['licell_sei', 'licell_plating', 'licell_cathode'], scale=AN * 1e-6, ex=ext('psi', 'ai2020', 'nobel')),

 node('licell_graphite', 'A graphite grain with lithium in it', 'structure',
  'Flat sheets of carbon atoms with lithium between them: LiC₆ when the cell is full.',
  'Each grain of the coating is a crystal of graphite: sheets of carbon atoms joined in six-sided rings, like chicken wire, stacked on top of one another and held together only weakly. A lithium atom is small enough to sit between two sheets, above the middle of a ring. When the cell is fully charged there is one lithium for every six carbons. The crystal shown one step further in is that full state.',
  'Between the sheets the lithium is nearly an ion: it has handed most of its outer electron to the carbon sheets, which conduct electricity. So when lithium leaves the grain during discharge, the ion goes one way, into the liquid, and the electron goes the other way, through the carbon to the copper foil. The grain keeps its sheets; only the spacing and the stacking change. That is why the reaction can be run backwards thousands of times.',
  'Structure drawn: LiC<sub>6</sub>, P6/mmm, a = 4.32 Å, c = 3.70 Å (cell constants measured by the Paul Scherrer Institut group); lithium at the corners of the cell and carbon at height one half, in regular hexagons of side a/3 = 1.44 Å. The atom positions are constructed from the symmetry and the cell size, with the rings taken as regular; they were not copied from a refinement. In the plane the lithium atoms form a √3 × √3 pattern over the rings: every third ring has a lithium above it.',
  [['Formula when full', 'LiC₆'], ['Cell', 'a = 4.32 Å, c = 3.70 Å, space group P6/mmm'], ['Carbon to carbon', '≈ 1.44 Å (taken as a/3)'], ['Empty graphite, for comparison', 'a = 2.46 Å, c = 6.72 Å (two sheets)']],
  'C1', [], parents=['licell_anode'], related=['at_el_C', 'at_el_Li'], scale=1e-5, refs=[['CHE', '10.6', '10-6-lattice-structures-in-crystalline-solids']], ex=ext('psi')),

 node('licell_cathode', 'Lithium cobalt oxide coating (positive electrode)', 'material',
  'A layer of dark oxide grains on aluminium foil: where the lithium goes when the cell is used.',
  f'The coating on the aluminium foil is lithium cobalt oxide, a dark powder of grains a few thousandths of a millimetre across, packed into a layer {CA} micrometres thick. Like graphite it is built in layers, here sheets of cobalt and oxygen with lithium between them. A lithium ion is held far more tightly here than in graphite, and that difference is where the cell\'s energy comes from. Using the phone fills the oxide with lithium; charging pulls about half of it out again.',
  'Phones and laptops use this oxide because it packs a lot of energy into a small volume: it is described as still the dominant positive-electrode material for portable electronics. When lithium leaves, cobalt gives up an electron (Co<sup>3+</sup> becomes Co<sup>4+</sup>) to keep the crystal neutral. Only about half the lithium is taken out at 4.2 V, where the crystal begins to change form; taking out more without harming it is hard, and is what cells charged to 4.4 V and more have to manage. The oxide grains conduct poorly, so fine carbon is mixed in to carry the electrons: the Note 7 teardown found carbon nanotubes on the grains.',
  'LiCoO<sub>2</sub>: theoretical 274 mAh/g for all the lithium; about 135 mAh/g at 4.2 V, where the composition is Li<sub>0.5</sub>CoO<sub>2</sub> and a monoclinic phase appears; about 185 mAh/g at 4.5 V (Xiong et al. 2025). Its potential is about 4 to 5 V above lithium metal (Nobel background).  The parameter set of the measured cell gives grains of 3 µm radius, a porosity of 32 % and an active volume fraction of 62 %; these are fitted model values.',
  [['Thickness on each face of the foil', f'{CA} µm (measured consumer pouch cell)'], ['Capacity of LiCoO₂', '≈ 135 mAh/g at 4.2 V; 274 mAh/g in theory'], ['At 4.2 V', 'about half the lithium is out: Li₀.₅CoO₂'], ['Potential against lithium metal', '≈ 4 to 5 V']],
  'C1', ['How to take more than half of the lithium out of the oxide, by charging to 4.5 V and above, without the crystal and its surface breaking down is a matter of current research.'],
  parts=['licell_lco'], related=['licell_anode', 'at_el_Co'], scale=CA * 1e-6, ex=ext('xiong', 'note7', 'nobel', 'ai2020')),

 node('licell_lco', 'Lithium cobalt oxide crystal', 'structure',
  'Sheets of cobalt and oxygen with layers of lithium between them.',
  'Each grain of the coating is a crystal built in layers. Cobalt atoms sit in a flat sheet, each one surrounded by six oxygen atoms; these cobalt-oxygen sheets are stacked with a layer of lithium between every two. The lithium layer is a kind of corridor: lithium ions can hop along it sideways, out to the edge of the grain and into the liquid, and come back the same way.',
  'Every cobalt and every lithium has six oxygen neighbours, at the corners of an octahedron. The cobalt-oxygen bonds are short and strong (1.92 Å) and hold the sheets together; the lithium-oxygen distances are longer (2.09 Å) and the lithium is more loosely held, which is what lets it move. When lithium is taken out, the cobalt-oxygen sheets move a little further apart: the measured cell grows taller as it empties.',
  'Structure drawn: space group R3̄m, hexagonal cell a = 2.81698(3) Å, c = 14.0646(1) Å at 295 K; Li at 3a (0, 0, 0), Co at 3b (0, 0, ½), O at 6c (0, 0, z) with z = 0.23949(3); Co–O 1.9220(2) Å, Li–O 2.0946(3) Å (neutron powder diffraction, Hertz et al. 2008). The cell holds three formula units, which gives a density of 5.04 g/cm³ (a calculation). The same paper shows c growing to 14.29 Å as the lithium content falls to 0.66.',
  [['Formula', 'LiCoO₂'], ['Cell', 'a = 2.817 Å, c = 14.065 Å, space group R3̄m'], ['Cobalt to oxygen', '1.922 Å, six neighbours'], ['Lithium to oxygen', '2.095 Å, six neighbours']],
  'C1', [], parents=['licell_cathode'], related=['at_el_Co', 'at_el_Li'], scale=6e-6, refs=[['CHE', '10.6', '10-6-lattice-structures-in-crystalline-solids']], ex=ext('hertz', 'nobel')),

 node('licell_separator', 'Separator', 'structure',
  'A thin plastic film full of tiny holes: ions pass, the two electrodes never touch.',
  f'Between every two sheets lies a film of plastic, {SEP} micrometres thick in this model, It keeps the graphite and the oxide apart: if they touched, the cell would discharge through itself in an instant and overheat. But the film is not solid. It is a sponge of fine holes, each less than a thousandth of a millimetre wide, filled with the liquid electrolyte, and lithium ions swim through the holes.',
  'Separators are made of polyethylene, polypropylene or layers of both. About half of the film is hole. The plastic also works as a fuse: if the cell overheats, polyethylene softens and melts at about 135 °C, the holes close, the ions can no longer pass and the current stops. Some separators carry a thin coat of ceramic grains: the separator of the Galaxy Note 7 cell was less than 5 µm thick with about 1 µm of alumina on each face. The investigations of the fires in that phone listed a thinner separator than in earlier phones among the suspected causes, together with deformed corners of the stack, a missing insulating tape and welding burrs on a tab.',
  'General requirements quoted for lithium-ion separators: thickness 20 to 25 µm, pore size below 1 µm, porosity 40 to 60 %; melting points 135 °C (polyethylene) and 165 °C (polypropylene) (Li et al. 2021). The parameter set of the measured cell uses a porosity of 50 %. The film does not take part in the cell reaction, but its holes are part of the path of the ions, so a thinner or more open separator lowers the resistance of the cell; the price is less mechanical safety margin.',
  [['Thickness in the model', f'{SEP} µm (measured consumer pouch cell)'], ['Holes', '< 1 µm wide, 40 to 60 % of the volume'], ['Melting point of polyethylene', '135 °C: the holes close (shutdown)'], ['Galaxy Note 7', '< 5 µm of polymer, ≈ 1 µm alumina per face']],
  'C1', ['How thin a separator can be made before the risk of an internal short circuit becomes unacceptable has no agreed answer; it is settled cell by cell, by testing.'],
  related=['licell_electrolyte', 'licell_plating'], scale=SEP * 1e-6, ex=ext('separator', 'note7', 'ai2020')),

 node('licell_cu_foil', 'Copper foil (negative current collector)', 'structure',
  'The metal backbone of each graphite sheet: it carries the electrons in and out.',
  f'Graphite grains are a powder; something has to hold them and collect the electric current from all of them. That is a foil of copper, {CU} micrometres thick, A bare tongue of each foil sticks out at the top, and all the tongues are welded together to the negative tab. Electrons that leave the graphite during discharge run through the copper, out of the tab, through the phone and back to the other electrode.',
  'Copper is used on the negative side because lithium does not form an alloy with it at the low voltage of the graphite. It is also an excellent conductor of both electricity and heat. The foil takes no part in the storage reaction: it is dead weight, which is why makers keep making it thinner.',
  'Copper: electrical resistivity 1.72 × 10⁻⁸ Ω·m, thermal conductivity 401 W/(m·K) (as quoted in the Note 7 study, which also notes that the aluminium foil of that cell was 5 µm thicker than its copper foil).',
  [['Thickness', f'{CU} µm (measured consumer pouch cell)'], ['Resistivity', '1.72 × 10⁻⁸ Ω·m'], ['Thermal conductivity', '401 W/(m·K)']],
  'C1', [], related=['licell_al_foil', 'licell_tabs', 'at_el_Cu'], scale=CU * 1e-6, ex=ext('ai2020', 'note7', 'wikiLi')),

 node('licell_al_foil', 'Aluminium foil (positive current collector)', 'structure',
  'The metal backbone of each oxide sheet.',
  f'The oxide grains are held on a foil of aluminium, {AL} micrometres thick, which collects the current of the positive electrode. A bare tongue of each foil reaches up to the positive tab. During discharge electrons arrive here from the phone and spread through the foil to the oxide grains, where they meet the lithium ions arriving through the liquid.',
  'Aluminium is used on the positive side because, in this electrolyte, its surface covers itself with a thin protective layer and then survives the high voltage there. It is also light. Why it is not used on the negative side as well is not stated in the sources opened for this model.',
  'Aluminium: electrical resistivity 2.65 × 10⁻⁸ Ω·m, thermal conductivity 205 W/(m·K) (as quoted in the Note 7 study). The passivation in LiPF₆ electrolytes is stated in general references; the details of the protective film are a research topic of their own.',
  [['Thickness', f'{AL} µm (measured consumer pouch cell)'], ['Resistivity', '2.65 × 10⁻⁸ Ω·m'], ['Thermal conductivity', '205 W/(m·K)']],
  'C1', [], related=['licell_cu_foil', 'licell_tabs', 'at_el_Al'], scale=AL * 1e-6, ex=ext('ai2020', 'note7', 'wikiLi')),

 node('licell_electrolyte', 'Electrolyte', 'material',
  'The liquid that soaks everything inside: a lithium salt dissolved in organic solvents.',
  'The sheets are not dry. Every pore of the coatings and every hole of the separator is filled with a clear liquid, the electrolyte. It is a lithium salt dissolved in organic solvents that contain no water. The liquid is the road for lithium ions between the two electrodes. It does not let electrons through, and that is essential: the electrons must take the outside path, through the phone.',
  'The usual salt is lithium hexafluorophosphate, LiPF<sub>6</sub>, at about one mole per litre, and the solvents are organic carbonates. One of them, ethylene carbonate, turned out to be the key to using graphite at all: on the first charge a little of it breaks down on the graphite and leaves a thin solid skin (the SEI) that stops the rest of the liquid from being consumed. Ethylene carbonate is solid at room temperature, so it is mixed with a runnier carbonate.',
  'A standard research electrolyte is 1 M LiPF<sub>6</sub> in ethylene carbonate and dimethyl carbonate, 1 : 1 ("LP30"); the exact recipe of a commercial phone cell, including its additives, is not published. How fast the ions can move through the pores is one of the limits on how fast a cell can be charged. No model of these molecules has been built here yet.',
  [['Salt', 'LiPF₆, about 1 mol/L'], ['Solvents', 'organic carbonates, ethylene carbonate among them'], ['Conducts', 'ions, not electrons']],
  'C2', ['The recipe of a commercial electrolyte (its solvent mix and additives) is a trade secret, so published models of phone cells use stand-in mixtures.', 'Replacing the liquid with a solid that conducts lithium ions as well is the aim of solid-state cells; none has replaced liquid cells in phones.'],
  related=['licell_sei', 'licell_separator', 'licell_solid_state'], scale=None, ex=ext('nobel', 'psi', 'wikiLi')),

 node('licell_pouch', 'Pouch', 'structure',
  'The soft foil envelope that seals the cell: plastic, aluminium and plastic again.',
  f'A phone cell has no steel can. Its sheets are sealed in a pouch of laminated film about {FILM / 1000:.2f} mm thick, like a very tough coffee bag. The film has three layers: nylon outside to resist scratches and punctures, aluminium foil in the middle to keep out air and above all moisture, and polypropylene inside, which melts when the edges are pressed together hot and so welds the pouch shut. The flat strip at the top is such a weld; the two tabs pass through it.',
  'A pouch is lighter and thinner than a can and can be made in almost any flat shape, which is why phones use it. The price is that it gives little mechanical protection, and the cell needs a little room: the graphite grains grow by about a tenth as they fill, so the stack is slightly thicker when charged. Too little room for the cell was one of the faults named in the Galaxy Note 7 investigations.',
  'Laminate grades: about 88 µm for slim consumer devices, 113 µm for mobile and portable power, 152 to 153 µm for cars and stationary storage; the aluminium layer is typically a few tens of micrometres (a trade reference, batterydesign.net). The model uses 113 µm.',
  [['Film thickness in the model', f'{FILM} µm (the grade described for mobile devices)'], ['Layers, outside to inside', 'nylon, aluminium foil, polypropylene']],
  'C1', [], related=['licell_tabs'], scale=.078, ex=ext('film')),

 node('licell_tabs', 'Tabs', 'structure',
  'Two metal strips that bring the current out through the seal.',
  'All the copper foils are welded to one strip of metal and all the aluminium foils to another. These two tabs are the cell\'s terminals: they pass out through the sealed edge of the pouch and are joined to the small protection board. The weld is made by ultrasound: the metals are rubbed together so fast that they bond without melting.',
  'The tabs are places where things can go wrong. The Galaxy Note 7 investigations named a missing insulating tape on the positive tab, and welding burrs that pierced the tape and the separator, among the causes of the fires. In this model the foil tongues run straight up to the tabs; in a real cell they are gathered and bent together before welding.',
  'No source opened for this model names the tab metals of a phone cell. Trade sources (not checked further) give aluminium for the positive tab and nickel or nickel-plated copper for the negative one. The thickness drawn (0.1 mm) and the width (8 mm) are choices of the model.',
  [['Welding', 'ultrasonic, tab to the bundle of foils'], ['Size drawn', '8 mm wide, 0.1 mm thick (not sourced)']],
  'C2', [], related=['licell_cu_foil', 'licell_al_foil', 'licell_pcm'], scale=.008, ex=ext('note7')),

 node('licell_pcm', 'Protection circuit', 'component',
  'A small board on the cell that disconnects it before it can be damaged.',
  'A lithium-ion cell must never be charged too far, drained too far or short-circuited. So every phone cell carries its own guard: a narrow circuit board at the top with a chip that watches the cell voltage and the current, and two electronic switches (transistors) in the path of the current. If anything goes out of range, the chip opens a switch and the cell is disconnected until things are normal again.',
  'One switch can stop charging and the other can stop discharging; the chip drives each separately. The current is measured by the small voltage drop across the switches themselves. The phone\'s own power-management chip does the fine control of charging; this board is the last line of defence, and it stays with the cell.',
  'A typical one-cell protection chip (the widely used DW01 type) switches off charging at 4.30 V ± 50 mV and releases at 4.10 V; switches off discharging at 2.40 V and releases at 3.00 V; and detects over-current when the drop across the switches reaches 150 mV. Chips for cells charged to higher voltages have higher limits. The parts drawn on the board (one chip, one package of two transistors) follow that datasheet\'s circuit; their sizes and places are choices of the model, and real boards often add a fuel-gauge chip and a temperature sensor.',
  [['Over-charge cut-off', '4.30 V (releases at 4.10 V)'], ['Over-discharge cut-off', '2.40 V (releases at 3.00 V)'], ['Over-current', 'when the switches drop 150 mV']],
  'C1', [], related=['phone_pmic', 'how_a_phone_charges', 'licell_plating'], scale=.046, ex=ext('dw01')),

 node('licell_ion_shuttle', 'Lithium ions crossing', 'process',
  'Inside the cell, lithium travels as a charged ion through the liquid: one way on charge, back on discharge.',
  'Choose Discharging: the blue markers are lithium ions. Each one leaves a graphite grain, swims through the liquid in the holes of the separator and enters an oxide grain on the other side. Choose Charging: the charger forces them back the other way. Nothing is used up; the same lithium goes to and fro, which is why the cell is sometimes called a rocking-chair battery. The markers are enormously enlarged and the sheets are drawn 7 mm apart; in the real cell the trip is about a fifth of a millimetre.',
  'An ion moves because it is at lower energy in the oxide than in the graphite. On discharge that energy difference, about 3.6 to 4.2 electronvolts per ion, is delivered to the phone by the electron that has to go round the outside. On charge the charger supplies a little more than that to push both back uphill. For every ion that crosses inside, exactly one electron goes round outside: the current in the wire is the count of ions crossing per second.',
  'The ion\'s path has several steps: diffusion inside the grain to its surface, shedding or gaining its shell of solvent molecules at the surface (through the SEI on the graphite side), and migration and diffusion through the electrolyte in the pores. Each step costs some voltage that grows with the current, so a cell delivers less than its open-circuit voltage under load and needs more to charge. A current of 1 A is 6.2 × 10¹⁸ ions crossing every second (1 A divided by the charge of one ion, a calculation).',
  [['Charge carried by one ion', '1.602 × 10⁻¹⁹ C'], ['At a current of 1 A', '≈ 6.2 × 10¹⁸ ions cross per second (calculated)'], ['Distance in the model cell', '≈ 0.2 mm: one coating, the separator, the next coating']],
  'C1', [], related=['licell_electrons', 'licell_electrolyte', 'licell_sei'], scale=None, refs=[['CHE', '17.5', '17-5-batteries-and-fuel-cells'], ['CHE', '17.2', '17-2-galvanic-cells']], ex=ext('nobel', 'note7'),
  formula='LiC<sub>6</sub> + CoO<sub>2</sub> ⇌ C<sub>6</sub> + LiCoO<sub>2</sub> &nbsp; (to the right: discharge)'),

 node('licell_electrons', 'Electrons going round the outside', 'process',
  'The electrons cannot cross inside the cell, so they flow through the phone: that flow is the current.',
  'When a lithium atom leaves the graphite as an ion, it leaves one electron behind. The liquid and the separator do not conduct electrons, so the electron has only one way to follow the ion to the other electrode: through the copper foil, out of the negative tab, through the phone\'s circuits, and in again through the positive tab and the aluminium foil. On its way it does the work: lighting the screen, running the processor. The yellow markers show the direction; the wire and the grey box stand for the whole phone, or for the charger.',
  'On discharge electrons leave by the copper side and return by the aluminium side. On charge the charger pushes them the opposite way, from the aluminium side round to the copper side, and the ions inside follow. By convention electric current is drawn in the direction positive charge would move, so it points the opposite way to the electrons.',
  'The energy each electron delivers is the cell voltage times its charge: at 3.86 V that is 3.86 eV, or 6.2 × 10⁻¹⁹ J. A cell labelled 4,422 mAh passes 4.422 × 3600 = 15,900 C in a full discharge, which is about 1.0 × 10²³ electrons, a sixth of a mole (calculations from the label values). The markers in the picture are a diagram: an electron has no size that has been measured, and electrons in a wire drift slowly while the push that drives them travels at nearly the speed of light.',
  [['Energy per electron at 3.86 V', '3.86 eV = 6.2 × 10⁻¹⁹ J'], ['Charge in a 4,422 mAh discharge', '≈ 15,900 C, about 1.0 × 10²³ electrons (calculated)']],
  'C1', [], related=['licell_ion_shuttle', 'licell_pcm', 'sm_electron'], scale=None, refs=[['UP2', '10.1', '10-1-electromotive-force'], ['CHE', '17.2', '17-2-galvanic-cells']], ex=ext('ifixit', 'nobel')),

 node('licell_sei', 'The skin on the graphite (SEI)', 'structure',
  'A layer a few millionths of a millimetre thick that forms on the graphite and keeps the cell alive.',
  'The liquid in the cell is not really stable next to charged graphite: it reacts. On the very first charge, in the factory, a little of the liquid breaks down on the surface of every graphite grain and leaves a solid skin. The skin lets lithium ions through but blocks the liquid and the electrons, so the reaction stops itself. Without this skin a lithium-ion cell with a graphite electrode would not work at all; with it, the cell lasts for years. It is far too thin to draw at the scale of this model: the marker only shows where it is.',
  'The skin is called the solid electrolyte interphase, SEI. It is made from the debris of the electrolyte: lithium salts of carbonate fragments, lithium fluoride, lithium carbonate, lithium oxide. It uses up some of the cell\'s lithium when it forms, and it keeps growing very slowly afterwards, which is one of the main reasons a battery holds a little less each year.',
  'Reported composition: at first mainly lithium ethylene dicarbonate and LiF, with an inner part rich in inorganic compounds (LiF, Li<sub>2</sub>CO<sub>3</sub>, Li<sub>2</sub>O); a favourable thickness is put at a few ångströms to a few nanometres, growing with cycling (Beheshti et al. 2022). It is often pictured as a mosaic of small organic and inorganic patches. It is hard to study: it is thin, uneven, sensitive to air and to the electron or X-ray beams used to look at it, and different methods give different pictures.',
  [['Thickness', 'a few ångströms to a few nanometres when fresh; it grows'], ['Made of', 'lithium fluoride, lithium carbonate, lithium oxide and organic lithium salts'], ['Forms', 'on the first charge, from the electrolyte']],
  'C3', ['The exact structure of the skin, how lithium ions get through it, and how it changes over the life of a cell are not agreed; it has been called the most important and least understood part of the cell.', 'Which additives give the most durable skin is found largely by trial.'],
  related=['licell_anode', 'licell_electrolyte', 'licell_plating'], scale=3e-9, ex=ext('sei', 'nobel')),

 node('licell_plating', 'Lithium plating and dendrites', 'process',
  'Charged too fast or too cold, lithium can settle on the graphite as metal instead of going in.',
  'Lithium needs a moment to work its way into a graphite grain. If the charger pushes ions across faster than the grains can take them in, or if the cell is cold and everything is slower, lithium piles up on the surface of the grains as bare metal. Some of it goes in later, some is lost for good, and some can grow into fine needles called dendrites. A needle that grows through the separator joins the two electrodes and short-circuits the cell, which can then overheat and catch fire. This is why the charging current has to be limited, most of all in the cold.',
  'Plating happens when the graphite is driven down to the potential of lithium metal: 0 V against lithium, only a little below where it normally works. Fast charging and low temperature both push it there. The first lithium batteries of the 1970s had lithium metal itself as the negative electrode and failed for exactly this reason: dendrites formed on repeated charging. Storing the lithium inside carbon instead was the step that made rechargeable lithium cells safe enough to sell.',
  'Plated lithium reacts with the electrolyte and forms new SEI around itself; lithium that loses electrical contact becomes inactive, and capacity falls. Detecting the onset of plating in a working cell, from its voltage, its swelling or its temperature, is an active field, since the safe charging current depends on temperature, age and state of charge.',
  [['Happens when', 'the graphite reaches 0 V against lithium metal, or below'], ['Made worse by', 'fast charging, low temperature'], ['Risk', 'dendrites can short-circuit the cell']],
  'C2', ['Where and when plating starts inside a real electrode, and how to detect it early in a phone, are still being worked out.', 'Whether lithium metal itself can be made into a safe, long-lived negative electrode (which would store far more) is one of the central open problems of battery research.'],
  related=['licell_sei', 'licell_separator', 'licell_solid_state', 'licell_pcm'], scale=None, ex=ext('plating', 'nobel')),

 node('licell_solid_state', 'Solid-state cells', 'concept',
  'Cells with a solid in place of the liquid: promising, not yet in phones.',
  'Today\'s cells need a liquid, and a liquid cannot stop lithium needles from growing. A solid that conducts lithium ions is hoped to be safer and to hold needles back; it could even allow a negative electrode of lithium metal, which stores much more than graphite. Such solid-state cells exist in laboratories and in small numbers, but they have not replaced liquid cells in phones.',
  'Several families of solid are studied: sulfides, oxides and polymers. Sulfides conduct lithium ions about as well as liquids, but many react when they touch lithium metal. A solid also does not flow into every pore as a liquid does, so keeping the solid in close contact with grains that swell and shrink is hard; laboratory cells are often held under high pressure, which is impractical in a pouch.',
  'Problems named in a 2025 review of sulfide cells without a prepared anode: decomposition of the electrolyte in contact with lithium metal, short circuits caused by dendrites even through the solid, loss of contact at the interfaces over many cycles, and stack pressures too high for large-scale manufacture. That review covers one family; no opened source gave an agreed state of the art for solid-state cells in general, so none is stated here.',
  [['Aim', 'no liquid; a lithium-metal negative electrode'], ['Status', 'research and early products; not in phones']],
  'C3', ['Whether dendrites can be stopped by a solid, and at what charging rate, is unresolved.', 'Which family of solid electrolyte, if any, can be made cheaply at scale is unknown.'],
  related=['licell_electrolyte', 'licell_plating'], scale=None, ex=ext('solid')),
]

# ---------------------------------------------------------------- figures
WH = lambda mj: round(mj / 0.0036)
VIZ = {
 'li_cell': {'type': 'plot', 'x': [0, 100], 'y': [3.4, 4.3], 'xlabel': 'state of charge (%)', 'ylabel': 'cell voltage, nothing connected (V)',
   'points': [{'x': str(z), 'y': str(v), 'label': (f'{v:.2f} V' if z in (0, 50, 100) else '')} for z, v in OCV],
   'hlines': [{'y': '3.86', 'label': 'printed on a phone cell: 3.86 V'}],
   'caption': 'The voltage of a lithium cobalt oxide and graphite cell rises as it fills. Calculated from the measured voltage curves of the two electrodes of a 2.28 Ah pouch cell charged to 4.2 V (Ai et al. 2020); phone cells charged higher end higher. Below the last tenth it drops steeply to the 3.0 V limit.'},
 'licell_ion_shuttle': {'type': 'blocks', 'flow': True, 'caption': 'Discharge. Inside the cell the lithium ion crosses through the liquid; its electron has to go round through the phone. Charging runs both arrows backwards.',
   'nodes': [{'id': 'g', 'label': 'graphite (on copper)', 'x': 16, 'y': 62}, {'id': 's', 'label': 'separator, soaked in electrolyte', 'x': 50, 'y': 62}, {'id': 'o', 'label': 'cobalt oxide (on aluminium)', 'x': 84, 'y': 62}, {'id': 'p', 'label': 'the phone', 'x': 50, 'y': 16}],
   'edges': [{'from': 'g', 'to': 's', 'label': 'Li⁺'}, {'from': 's', 'to': 'o', 'label': 'Li⁺'}, {'from': 'g', 'to': 'p', 'label': 'e⁻'}, {'from': 'p', 'to': 'o', 'label': 'e⁻'}]},
 'licell_electrons': {'type': 'bars', 'logy': True, 'ylabel': 'energy stored per kilogram (Wh/kg)', 'caption': 'A lithium-ion cell stores far more per kilogram than older batteries, and still about fifty times less than petrol or body fat (which also use oxygen from the air, not counted in their weight). Values from a reference table (Wikipedia, Energy density), converted from MJ/kg; the cell bar is the top of the range given there.',
   'bars': [{'label': 'lead-acid battery', 'value': WH(.17)}, {'label': 'nickel-metal hydride', 'value': WH(.41)}, {'label': 'alkaline cell', 'value': WH(.48)}, {'label': 'lithium-ion cell', 'value': WH(.875), 'color': '#1e4e8f'}, {'label': 'TNT', 'value': WH(4.184)}, {'label': 'wood', 'value': WH(18.0)}, {'label': 'body fat', 'value': WH(38)}, {'label': 'petrol', 'value': WH(46.4)}, {'label': 'hydrogen', 'value': WH(119.93)}]},
 'licell_stack': {'type': 'bars', 'ylabel': 'thickness (µm)', 'caption': 'The five layers of the stack, as measured on a 2.28 Ah consumer pouch cell (Ai et al. 2020). The coatings that store the lithium are the thick ones; the foils and the separator are kept as thin as they can safely be. For comparison, a human hair is roughly 70 µm across.',
   'bars': [{'label': 'copper foil', 'value': CU, 'color': '#c8793a'}, {'label': 'graphite coating', 'value': AN, 'color': '#474c55'}, {'label': 'separator', 'value': SEP, 'color': '#b9b29a'}, {'label': 'oxide coating', 'value': CA, 'color': '#2d4a86'}, {'label': 'aluminium foil', 'value': AL, 'color': '#9aa3ad'}]},
 'licell_pcm': {'type': 'plot', 'x': [2, 4.6], 'y': [0, 1.2], 'xlabel': 'cell voltage (V)', 'ylabel': 'connected (1) or cut off (0)', 'fns': [{'f': '(x>2.4)*(x<4.3)', 'label': 'cell connected'}], 'vlines': [{'x': '2.4', 'label': 'too empty: 2.40 V'}, {'x': '4.3', 'label': 'too full: 4.30 V'}],
   'caption': 'The window in which a typical protection chip (DW01 type) leaves the cell connected. Outside it, one of the two switches opens. Chips for cells charged to higher voltages have a higher upper limit.'},
}
# the hair comparison is not sourced: drop it rather than state it
VIZ['licell_stack']['caption'] = VIZ['licell_stack']['caption'].replace(' For comparison, a human hair is roughly 70 µm across.', '')

# ---------------------------------------------------------------- close-up scenes (micrometres)
def scene_anode():
    return {'tag': 'Inside the negative electrode', 'cell': 'animal', 'id': 'licell_anode', 'title': 'Inside the graphite coating', 'node': 'licell_anode',
      'blurb': 'A slice through one coating of a negative sheet: copper foil at the bottom, graphite grains packed above it, the separator on top. The pores between the grains are full of liquid electrolyte. Click a grain, then look inside it.',
      'note': f'To scale: the thickness of the foil ({CU} µm), of the coating ({AN} µm) and of the separator ({SEP} µm), and the size of the grains (10 µm across), all from the parameter set of a measured consumer pouch cell (Ai et al. 2020). Illustrative: the shapes of the grains (real ones are irregular flakes and lumps), their number and their packing; the binder that glues them and the skin on each grain (the SEI, a few nanometres) are not drawn.',
      'bg': '#f1ede4', 'center': [70, 55, 0], 'D_um': 150,
      'labels': [{'text': 'Graphite grains: lithium is stored inside them', 'at': [20, 70, 32], 'pop': 'graphite'}, {'text': f'Copper foil, {CU} µm', 'at': [120, 5, 32], 'pop': 'foil'}, {'text': 'Separator', 'at': [118, 99, 32], 'pop': 'separator'}, {'text': 'Liquid electrolyte fills the pores', 'at': [70, 40, 34], 'pop': 'electrolyte'}],
      'populations': [
        {'id': 'foil', 'name': 'Copper foil', 'node': 'licell_cu_foil', 'shape': 'rbox', 'size': [140, CU, 60], 'color': '#c8793a', 'opacity': 1, 'ink': 1, 'priority': 3, 'material': 'copper', 'arrange': {'kind': 'list', 'items': [{'at': [70, CU / 2, 0]}]}},
        {'id': 'graphite', 'name': 'Graphite grain', 'node': 'licell_graphite', 'shape': 'ellipsoid', 'size': [11, 8, 11], 'color': '#3a4047', 'opacity': 1, 'ink': 1, 'priority': 3, 'material': 'lithiated_graphite',
         'arrange': {'kind': 'random', 'n': 230, 'min': [5, CU + 4.5, -24], 'max': [135, CU + AN - 4.5, 24], 'gap': -1.2, 'seed': 11, 'orient': 'free'}},
        {'id': 'electrolyte', 'name': 'Electrolyte in the pores', 'node': 'licell_electrolyte', 'shape': 'rbox', 'size': [139, AN - .5, 59], 'color': '#9fc3d6', 'opacity': .16, 'priority': 1, 'material': 'battery_electrolyte', 'arrange': {'kind': 'list', 'items': [{'at': [70, CU + AN / 2, 0]}]}},
        {'id': 'separator', 'name': 'Separator', 'node': 'licell_separator', 'shape': 'rbox', 'size': [140, SEP, 60], 'color': '#efe9d8', 'opacity': .95, 'ink': 1, 'priority': 3, 'deeper': {'type': 'none'}, 'material': 'separator_polymer', 'arrange': {'kind': 'list', 'items': [{'at': [70, CU + AN + SEP / 2, 0]}]}},
      ]}
def scene_cathode():
    return {'tag': 'Inside the positive electrode', 'cell': 'animal', 'id': 'licell_cathode', 'title': 'Inside the oxide coating', 'node': 'licell_cathode',
      'blurb': 'A slice through one coating of a positive sheet: aluminium foil at the bottom, grains of lithium cobalt oxide above it, with threads of carbon between them to carry the electrons. The pores are full of liquid electrolyte. Click a grain, then look inside it.',
      'note': f'To scale: the thickness of the foil ({AL} µm), of the coating ({CA} µm) and of the separator ({SEP} µm), and the size of the grains (6 µm across), from the parameter set of a measured consumer pouch cell (Ai et al. 2020). Illustrative: the round shape of the grains, their single size (real powders mix many sizes), their number and packing, and the carbon threads, which are drawn far thicker than the nanotubes seen in a phone cell; the binder is not drawn.',
      'bg': '#f1ede4', 'center': [36, 50, 0], 'D_um': 140,
      'labels': [{'text': 'Lithium cobalt oxide grains', 'at': [12, 66, 17], 'pop': 'lco'}, {'text': f'Aluminium foil, {AL} µm', 'at': [58, 7, 17], 'pop': 'foil'}, {'text': 'Carbon threads carry the electrons', 'at': [38, 36, 17], 'pop': 'carbon'}, {'text': 'Separator', 'at': [58, 95, 17], 'pop': 'separator'}],
      'populations': [
        {'id': 'foil', 'name': 'Aluminium foil', 'node': 'licell_al_foil', 'shape': 'rbox', 'size': [72, AL, 30], 'color': '#cfd4da', 'opacity': 1, 'ink': 1, 'priority': 3, 'material': 'aluminium', 'arrange': {'kind': 'list', 'items': [{'at': [36, AL / 2, 0]}]}},
        {'id': 'lco', 'name': 'Lithium cobalt oxide grain', 'node': 'licell_lco', 'shape': 'ellipsoid', 'size': [6, 6, 6], 'color': '#2a4170', 'opacity': 1, 'ink': 1, 'priority': 3, 'material': 'lithium_cobalt_oxide',
         'arrange': {'kind': 'random', 'n': 250, 'min': [3.5, AL + 3.2, -11.5], 'max': [68.5, AL + CA - 3.2, 11.5], 'gap': -.5, 'seed': 5}},
        {'id': 'carbon', 'name': 'Conducting carbon', 'node': 'licell_cathode', 'shape': 'cylinder', 'size': [.5, 9, .5], 'color': '#15171c', 'opacity': 1, 'priority': 2, 'material': 'conductive_carbon',
         'arrange': {'kind': 'random', 'n': 150, 'min': [3, AL + 2, -12], 'max': [69, AL + CA - 2, 12], 'gap': -8, 'seed': 9, 'orient': 'free'}},
        {'id': 'electrolyte', 'name': 'Electrolyte in the pores', 'node': 'licell_electrolyte', 'shape': 'rbox', 'size': [71, CA - .5, 29], 'color': '#9fc3d6', 'opacity': .16, 'priority': 1, 'material': 'battery_electrolyte', 'arrange': {'kind': 'list', 'items': [{'at': [36, AL + CA / 2, 0]}]}},
        {'id': 'separator', 'name': 'Separator', 'node': 'licell_separator', 'shape': 'rbox', 'size': [72, SEP, 30], 'color': '#efe9d8', 'opacity': .95, 'ink': 1, 'priority': 3, 'deeper': {'type': 'none'}, 'material': 'separator_polymer', 'arrange': {'kind': 'list', 'items': [{'at': [36, AL + CA + SEP / 2, 0]}]}},
      ]}
def scene_separator():
    return {'tag': 'Inside the separator', 'cell': 'animal', 'id': 'licell_separator', 'title': 'Inside the separator', 'node': 'licell_separator',
      'blurb': 'A piece of the separator film 8 micrometres wide: a web of plastic strands with liquid-filled holes between them. Lithium ions pass through the holes; the web keeps the two electrodes apart.',
      'note': 'To scale: the holes are under 1 µm wide and take up roughly half the volume, as reviews of separators state (pore size below 1 µm, porosity 40 to 60 %). Illustrative: the strands are drawn as straight rods of one thickness lying at random; a real film is a lacy, connected web whose pattern depends on how it was stretched. Only a slab 3 µm thick is drawn, of a film 25 µm thick. The ceramic coating that many phone separators carry is not drawn.',
      'bg': '#f1ede4', 'center': [4, 4, 0], 'D_um': 12,
      'labels': [{'text': 'Plastic strands (polyethylene)', 'at': [1.2, 6.8, 1.8], 'pop': 'strand'}, {'text': 'Holes under 1 µm, full of electrolyte', 'at': [5.6, 1.4, 1.8], 'pop': 'electrolyte'}],
      'populations': [
        {'id': 'strand', 'name': 'Plastic strand of the separator', 'node': 'licell_separator', 'shape': 'cylinder', 'size': [.22, 2.6, .22], 'color': '#e9e2cc', 'opacity': 1, 'ink': 1, 'priority': 3, 'material': 'separator_polymer',
         'arrange': {'kind': 'random', 'n': 420, 'min': [.3, .3, -1.4], 'max': [7.7, 7.7, 1.4], 'gap': -2.2, 'seed': 3, 'orient': 'free'}},
        {'id': 'electrolyte', 'name': 'Electrolyte in the holes', 'node': 'licell_electrolyte', 'shape': 'rbox', 'size': [8, 8, 3], 'color': '#9fc3d6', 'opacity': .14, 'priority': 1, 'material': 'battery_electrolyte', 'arrange': {'kind': 'list', 'items': [{'at': [4, 4, 0]}]}},
      ]}

# ---------------------------------------------------------------- crystals
A_LCO, C_LCO, Z_O = 2.81698, 14.0646, 0.23949
def r5(v): return round(v, 5)
cen = [(0, 0, 0), (2 / 3, 1 / 3, 1 / 3), (1 / 3, 2 / 3, 2 / 3)]
lco_basis = []
for el, z0s in (('Li', [0.0]), ('Co', [0.5]), ('O', [Z_O, 1 - Z_O])):
    for z0 in z0s:
        for cx, cy, cz in cen: lco_basis.append([el, r5(cx), r5(cy), r5((z0 + cz) % 1)])
A_LIC6, C_LIC6 = 4.32, 3.70
CRYSTALS = [
 {'id': 'licoo2', 'name': 'Lithium cobalt oxide (layered)', 'formula': 'LiCoO2', 'lattice': [[A_LCO, 0, 0], [r5(-A_LCO / 2), r5(A_LCO * math.sqrt(3) / 2), 0], [0, 0, C_LCO]], 'basis': lco_basis, 'bond_cutoff': 2.0,   # sticks for cobalt-oxygen (1.92 A) only: the lithium (2.09 A from oxygen) is shown loose between the sheets
 
  'notes': 'Sheets of cobalt and oxygen (each cobalt has six oxygen neighbours at 1.92 A) with a layer of lithium between every two sheets (lithium to oxygen 2.09 A): the lithium can move along its layer and leave the crystal, which is how the positive electrode of a phone battery works. Space group R-3m, a = 2.81698 A, c = 14.0646 A, oxygen at z = 0.23949, with lithium at the origin: neutron diffraction at 295 K (Hertz et al., Phys. Rev. B 77, 075119, 2008).'},
 {'id': 'lic6', 'name': 'Lithium in graphite (LiC6)', 'formula': 'LiC6', 'lattice': [[A_LIC6, 0, 0], [r5(-A_LIC6 / 2), r5(A_LIC6 * math.sqrt(3) / 2), 0], [0, 0, C_LIC6]],
  'basis': [['Li', 0, 0, 0]] + [['C', r5(x), r5(y), .5] for x, y in ((1 / 3, 0), (0, 1 / 3), (2 / 3, 2 / 3), (2 / 3, 0), (0, 2 / 3), (1 / 3, 1 / 3))], 'bond_cutoff': 1.7,
  'notes': 'Graphite filled with lithium, as in the negative electrode of a fully charged lithium-ion cell: flat sheets of carbon rings lying directly above one another, with a lithium atom between the sheets over every third ring. Space group P6/mmm, a = 4.32 A, c = 3.70 A, measured by diffraction during charging (Paul Scherrer Institut). The atom positions are constructed from that symmetry with regular carbon rings (carbon to carbon a/3 = 1.44 A); they are not from a refinement.'},
]

# ---------------------------------------------------------------- materials and assignment
MATERIALS = {
 'pouch_laminate': {'title': 'Pouch film', 'desc': 'A laminate about a tenth of a millimetre thick: nylon outside, aluminium foil in the middle, polypropylene inside.', 'card': 'licell_pouch',
   'inside': [{'name': 'aluminium foil, the middle layer', 'material': 'aluminium', 'note': '{What}: a film of three layers, nylon outside, aluminium foil in the middle and polypropylene inside. Shown: the aluminium, which is what keeps air and moisture out. The two plastic layers are not built yet.'}, {'name': 'nylon (polyamide), the outer layer'}, {'name': 'polypropylene, the inner layer that is welded'}],
   'src': 'card licell_pouch (batterydesign.net trade reference on pouch laminate)'},
 'cell_tab': {'title': 'Tab of a cell', 'desc': 'A metal strip welded to the foils of one electrode.', 'card': 'licell_tabs',
   'stop': 'Not built: the metal of {what}. No source opened for this model names the metals of a phone cell\'s tabs (trade sources give aluminium for the positive one and nickel or nickel-plated copper for the negative one), so no crystal is shown.'},
 'lithiated_graphite': {'title': 'Graphite with lithium in it', 'desc': 'Carbon sheets with lithium between them: LiC6 when the cell is full.', 'card': 'licell_graphite',
   'inside': [{'name': 'LiC6, graphite full of lithium', 'scene': 'crystal:lic6', 'note': '{What}: shown as it is in a fully charged cell, with lithium between all the carbon sheets (LiC6). In an empty cell the lithium is gone and the sheets lie closer, as in plain graphite.'}],
   'src': 'card licell_graphite; data/crystals.json lic6 (PSI in-situ diffraction: P6/mmm, a 4.32, c 3.70)'},
 'lithium_cobalt_oxide': {'title': 'Lithium cobalt oxide', 'desc': 'Sheets of cobalt and oxygen with lithium between them.', 'card': 'licell_lco',
   'inside': [{'name': 'LiCoO2 crystal', 'scene': 'crystal:licoo2', 'note': '{What}: shown full of lithium (LiCoO2), as in an empty cell. In a charged cell about half of the lithium sites are vacant.'}],
   'src': 'card licell_lco; data/crystals.json licoo2 (Hertz et al. 2008, neutron diffraction)'},
 'conductive_carbon': {'title': 'Conducting carbon', 'desc': 'Fine carbon mixed into the oxide coating to carry electrons between the grains.', 'card': 'licell_cathode',
   'inside': [{'name': 'graphite, a stand-in for the carbon', 'material': 'graphite', 'standIn': True, 'note': '{What}: carbon added to carry the electrons (carbon nanotubes were seen in a phone cell). A nanotube is a sheet of carbon rings rolled into a tube; shown instead: flat sheets of the same rings, as in graphite. No nanotube model has been built.'}],
   'src': 'card licell_cathode (Loveridge et al. 2018: carbon nanotubes on the Note 7 cathode)'},
 'separator_polymer': {'title': 'Separator plastic', 'desc': 'Polyethylene (or polypropylene): long chains of carbon and hydrogen.', 'card': 'licell_separator',
   'inside': [{'name': 'a short piece of a polyethylene chain', 'scene': 'mol:polyethylene_c20', 'standIn': True, 'title': 'Polyethylene (20 carbons of a chain thousands long)', 'note': '{What}: polyethylene, chains of thousands of CH2 units. Shown: a piece 20 carbons long. Some separators are polypropylene or layers of both, and many carry a ceramic coating, which is not built.'}],
   'src': 'card licell_separator (Li et al. 2021 review); data/molecules_all.json polyethylene_c20'},
 'battery_electrolyte': {'title': 'Electrolyte of a lithium-ion cell', 'desc': 'A lithium salt dissolved in organic carbonate solvents.', 'card': 'licell_electrolyte',
   'stop': 'Not built yet: the molecules of the electrolyte. It is a lithium salt (lithium hexafluorophosphate, LiPF6, about one mole per litre) dissolved in organic carbonates such as ethylene carbonate; no models of these molecules exist here yet.'},
 'lithium_ion_marker': {'title': 'A lithium ion', 'desc': 'A lithium atom that has given up its one outer electron.', 'card': 'at_el_Li',
   'inside': [{'name': 'the lithium atom', 'scene': 'atom:Li', 'standIn': True, 'note': 'The marker stands for one lithium ion, enlarged about three million times. An ion is the atom without its outer electron; shown: the whole neutral atom, with that electron.'}],
   'src': 'card licell_ion_shuttle; the atom scene'},
 'electron_marker': {'title': 'An electron (marker)', 'desc': 'A marker for one electron going round the outside circuit.', 'card': 'sm_electron',
   'stop': 'This marker stands for an electron. No parts are known inside an electron: experiments find no structure down to about 10⁻¹⁹ m, which is a limit of measurement.'},
 'schematic_part': {'title': 'A schematic part', 'desc': 'A stand-in drawn to complete a diagram.', 'card': None,
   'stop': '{What} is a schematic stand-in, not a part of the cell: there is nothing true to show inside it.'},
}
ASSIGN = {'about': 'The lithium-ion cell in the phone (data/things/li_cell). Its parts carry their own material or a closer view; these rows say the same by layer, and name the markers.',
  'default': None, 'spawnD': 0.001,
  'systems': {'pouch': 'pouch_laminate', 'tabs': 'cell_tab', 'copper': 'copper', 'aluminium': 'aluminium', 'circuit': 'copper'},
  'ids': {'pcm_board': 'circuit_copper', 'pcm_flex': 'circuit_copper', 'pcm_ic': 'chip_silicon', 'pcm_fet': 'chip_silicon', 'load': 'schematic_part', 'ions_dis': 'lithium_ion_marker', 'ions_chg': 'lithium_ion_marker', 'e_dis': 'electron_marker', 'e_chg': 'electron_marker',
          'hs_layers': 'marker', 'hs_sei': 'marker', 'hs_plating': 'marker', 'hs_electrolyte': 'marker'}}

def main():
    save('data/nodes/thing_li_cell.json', NODES)
    save('data/viz/thing_li_cell.json', VIZ)
    for mf, name, before in (('data/nodes/manifest.json', 'thing_li_cell.json', None), ('data/viz/manifest.json', 'thing_li_cell.json', 'curated.json')):
        m = load(mf)
        if name not in m:
            if before and before in m: m.insert(m.index(before), name)
            else: m.append(name)
            save(mf, m, indent=None)
    for s in (scene_anode(), scene_cathode(), scene_separator()): save('data/things/tissues/' + s['id'] + '.json', s)
    C = [c for c in load('data/crystals.json') if c['id'] not in ('licoo2', 'lic6')] + CRYSTALS
    with open(os.path.join(ROOT, 'data/crystals.json'), 'w', encoding='utf8') as f: json.dump(C, f, ensure_ascii=False, separators=(',', ':'))
    J = load('data/descent/materials.json')
    J['materials'].update(MATERIALS)
    if 'li_cell' not in J['assign']: J['assign'] = sorted(J['assign'] + ['li_cell'])
    save('data/descent/materials.json', J)
    save('data/descent/assign/li_cell.json', ASSIGN)
    ix = load('data/things/index.json')
    if not any(t['id'] == 'li_cell' for t in ix['things']):
        ix['things'].append({'id': 'li_cell', 'placements': [{'in': 'phone', 'part': 'phone_battery', 'note': 'takes the place of the phone\'s battery block (js/teardown.js PHONE_PARTS) and follows it as the phone opens up'}]})
        save('data/things/index.json', ix)
    print(len(NODES), 'cards,', len(VIZ), 'figures, 3 scenes, 2 crystals,', len(MATERIALS), 'materials written')

if __name__ == '__main__':
    main()
