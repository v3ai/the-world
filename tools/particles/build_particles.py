#!/usr/bin/env python3
"""Build data/particles.json from pdg_extract.json (PDG 2026) plus the curated facts below.
Run from the repo root:  python3 -I tools/particles/build_particles.py
Every measured number comes from pdglib (PDG id recorded); every sentence is written for this project."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pdglib import *

QSCHEME_LIGHT = 'MS-bar scheme at a scale of 2 GeV'
Q_NOTE_LIGHT = ('A "current-quark mass": the parameter in the theory\'s equations at that energy scale. A free quark is never seen, '
                'so there is no scale to put it on; the number depends on the scheme and the energy scale used to define it.')

def P(**k): return k
dec = lambda label, inn, out, b=None, note=None: {k: v for k, v in dict(label=label, **{'in': inn}, out=out, br=b, note=note).items() if v is not None}

# ---- the 17 fundamental particles -----------------------------------------------------------
parts = []
def add(p): parts.append(p)

# --- quarks
colour_q = {'has': True, 'text': 'Yes. Quarks carry colour charge, the charge of the strong force. It comes in three kinds, called red, green and blue after a loose analogy; there is no real colour involved. Only combinations with no net colour are ever seen, so a lone quark is never observed.'}
def quark(id_, sym, name, gen, charge, T3, massrec, mass_note, scale, life, decays, anti, disc, everyday, sources, mass_scheme=None, extra=None):
    d = dict(id=id_, node='sm_' + id_, symbol=sym, name=name, family='quark', kind='fermion', generation=gen, charge=charge,
             charge_text={'2/3': '+2/3 e', '-1/3': '−1/3 e'}[charge], spin='1/2', colour=colour_q,
             weak_isospin={'T': '1/2', 'T3': T3, 'note': 'The left-handed version sits in a doublet with ' + ('a down-type' if T3 == '+1/2' else 'an up-type') + ' quark; the right-handed version has weak isospin 0 (PDG Electroweak Model review).'},
             feels=['strong', 'em', 'weak', 'higgs'], mass=massrec, lifetime=life, decays=decays, antiparticle=anti,
             discovery=disc, everyday=everyday, sources=sources)
    d['mass']['note'] = mass_note
    if extra: d.update(extra)
    add(d)

anti_q = lambda sym, nm: {'name': nm, 'symbol': sym, 'self_conjugate': False, 'note': 'Same mass and spin, opposite electric charge and opposite colour (an "anticolour").'}
no_free = {'kind': 'confined', 'text': 'A free quark has no lifetime to quote: quarks are never found alone (confinement), only inside hadrons. Where a quark does change, it does so by the weak force, and the lifetimes of hadrons that contain it are given below.'}

quark('up', 'u', 'Up quark', 1, '2/3', '+1/2', mass('Q002M', QSCHEME_LIGHT),
      Q_NOTE_LIGHT + ' Two up quarks and one down quark make a proton.', None,
      {'kind': 'stable-in-matter', 'text': 'Up quarks inside protons are as stable as the proton itself (no proton decay has ever been seen; see the proton entry).'},
      [dec('Nothing: the lightest charged-up-type quark', ['u'], [], None, 'It cannot decay by the weak force because no lighter quark with the right charge exists.')],
      anti_q('ū', 'Anti-up quark'),
      'Evidence for pointlike quark-like constituents inside the proton came from electron scattering at SLAC in 1968–69 (deep inelastic scattering); the up quark was proposed in the quark model of Gell-Mann and of Zweig in 1964.',
      'Everywhere. Every proton has two up quarks and every neutron has one; together with down quarks they are the only quarks in ordinary stable matter (apart from short-lived quark–antiquark pairs).',
      ['Q002M'])
quark('down', 'd', 'Down quark', 1, '-1/3', '-1/2', mass('Q001M', QSCHEME_LIGHT),
      Q_NOTE_LIGHT + ' It is a little heavier than the up quark; that mass difference is the main reason a neutron is slightly heavier than a proton (the electromagnetic energy works the other way, so the neutron-proton gap, 1.29 MeV, is smaller than the quark mass gap).', None,
      {'kind': 'stable-in-matter', 'text': 'Down quarks in stable nuclei are stable; in a free neutron one turns into an up quark by the weak force (see the neutron entry).'},
      [dec('d → u + W⁻ (virtual), as in neutron decay', ['d'], ['u', 'W-'], None, 'Possible only when there is energy to spare, as when a neutron becomes a proton.')],
      anti_q('d̄', 'Anti-down quark'),
      'Seen indirectly in the same SLAC electron-scattering experiments as the up quark (1968–69); proposed in the 1964 quark model.',
      'In every proton (one) and every neutron (two). Together with up quarks, the only quarks in ordinary matter.',
      ['Q001M'])
quark('strange', 's', 'Strange quark', 2, '-1/3', '-1/2', mass('Q003M', QSCHEME_LIGHT),
      Q_NOTE_LIGHT + ' Roughly 20 times the down-quark mass.', None,
      {'kind': 'via-hadrons', 'text': 'Strange hadrons decay by the weak force: the charged kaon lasts about 1.24×10⁻⁸ s and the Λ about 2.6×10⁻¹⁰ s (PDG).', 'hadrons': [{'name': 'K⁺', 'ref': pdg('S010T')}, {'name': 'Λ', 'ref': pdg('S018T')}]},
      [dec('s → u + W⁻ (virtual): how a kaon or Λ decays', ['s'], ['u', 'W-'])],
      anti_q('s̄', 'Anti-strange quark'),
      'The first "strange" particles (kaons) were seen in cosmic-ray cloud-chamber photographs by Rochester and Butler in 1947; the quark picture that explains them came in 1964.',
      'Made constantly in the debris of cosmic rays hitting the air, and present as short-lived pairs inside every proton, but not part of ordinary stable matter.',
      ['Q003M'])
quark('charm', 'c', 'Charm quark', 2, '2/3', '+1/2', mass('Q004M', 'MS-bar scheme, at the scale of the charm-quark mass itself'),
      'The "running" mass in the MS-bar scheme evaluated at its own value. The PDG notes the same quark corresponds to a pole mass of about 1.65 GeV in another scheme: the same quark, a different definition.', None,
      {'kind': 'via-hadrons', 'text': 'Charm hadrons decay by the weak force: the D⁰ lasts about 4.1×10⁻¹³ s and the D⁺ about 1.0×10⁻¹² s (PDG).', 'hadrons': [{'name': 'D⁰', 'ref': pdg('S032T')}, {'name': 'D⁺', 'ref': pdg('S031T')}]},
      [dec('c → s + W⁺ (virtual)', ['c'], ['s', 'W+'])],
      anti_q('c̄', 'Anti-charm quark'),
      'Seen as the J/ψ meson (a charm–anticharm pair) in November 1974 by two groups at once: one led by Burton Richter at SLAC and one led by Samuel Ting at Brookhaven.',
      'Not in everyday matter. Made in particle accelerators and in cosmic-ray collisions; charm quarks also appear in the proton briefly through gluon splitting; whether the proton has an intrinsic (non-perturbative) charm component is still debated.',
      ['Q004M'])
quark('bottom', 'b', 'Bottom quark', 3, '-1/3', '-1/2', mass('Q005M', 'MS-bar scheme, at the scale of the bottom-quark mass itself'),
      'The "running" mass in the MS-bar scheme at its own scale; other definitions (pole mass) give a larger number, because the quark mass depends on how and at what energy you define it.', None,
      {'kind': 'via-hadrons', 'text': 'B mesons decay by the weak force: the B⁺ lasts about 1.64×10⁻¹² s and the B⁰ about 1.51×10⁻¹² s (PDG).', 'hadrons': [{'name': 'B⁺', 'ref': pdg('S041T')}, {'name': 'B⁰', 'ref': pdg('S042T')}]},
      [dec('b → c + W⁻ (virtual)', ['b'], ['c', 'W-'])],
      anti_q('b̄', 'Anti-bottom quark'),
      'Seen as the Υ (upsilon) meson, a bottom–antibottom pair, in 1977 by an experiment led by Leon Lederman at Fermilab.',
      'Only in accelerators and rare cosmic-ray collisions. B mesons are made by the billion in dedicated "B factory" colliders to study matter–antimatter differences.',
      ['Q005M'])
# top: direct measurements
topmass = mass('Q007TP', 'Direct measurements: reconstructed from the decay products of top–antitop pairs (Tevatron and LHC average)')
quark('top', 't', 'Top quark', 3, '2/3', '+1/2', topmass,
      'This is the one quark mass measured directly from the energies of the particles it decays into. Because the top decays before it can bind into a hadron, it is the only quark we can study "almost bare". The PDG notes that turning this number into a precise theoretical mass (pole or MS-bar) carries a theory uncertainty that is hard to quantify.', None,
      {'kind': 'width', 'text': 'About 5×10⁻²⁵ s, from the measured decay width of 1.42 GeV (lifetime = ħ / width; my calculation). It decays before it can form a hadron.',
       'width': pdg('Q007W'), 'lifetime_s_calc': life_from_width(pdg('Q007W')['value'])},
      [dec('t → W⁺ + b', ['t'], ['W+', 'b'], br('Q007R6'), 'PDG gives the ratio Γ(Wb)/Γ(Wq) = 0.957 ± 0.034, consistent with 1: essentially every top decays to a W and a bottom quark; no other decay has been seen.')],
      anti_q('t̄', 'Anti-top quark'),
      'Announced on 2 March 1995 by the CDF and DØ collaborations at Fermilab\'s Tevatron proton–antiproton collider.',
      'Not in everyday matter and gone within 10⁻²⁴ s of being made. Made by the million at the LHC. It is the heaviest known elementary particle.',
      ['Q007TP', 'Q007W', 'Q007R6'])
parts[-1]['mass']['other'] = [pdg('Q007TP2'), pdg('Q007TP4')]

# --- charged leptons
colour_none = {'has': False, 'text': 'No. Leptons carry no colour charge, so they do not feel the strong force at all.'}
def lepton(id_, sym, name, gen, massrec, mass_note, life, decays, anti, disc, everyday, sources, extra=None):
    d = dict(id=id_, node='sm_' + id_, symbol=sym, name=name, family='lepton', kind='fermion', generation=gen, charge='-1', charge_text='−1 e',
             spin='1/2', colour=colour_none,
             weak_isospin={'T': '1/2', 'T3': '-1/2', 'note': 'The left-handed version is the lower member of a doublet with the matching neutrino; the right-handed version has weak isospin 0 (PDG Electroweak Model review).'},
             feels=['em', 'weak', 'higgs'], mass=massrec, lifetime=life, decays=decays, antiparticle=anti, discovery=disc, everyday=everyday, sources=sources)
    d['mass']['note'] = mass_note
    if extra: d.update(extra)
    add(d)

lepton('electron', 'e⁻', 'Electron', 1, mass('S003M', 'Measured directly (Penning-trap and atomic-physics experiments); no scheme needed because the electron is not confined'),
       'A directly measured rest mass, known to better than a part in 10⁹. Unlike a quark mass it has an ordinary meaning, though the Higgs field is what gives it a mass at all.',
       {'kind': 'stable', 'text': 'Stable as far as anyone can tell. PDG: mean life > 6.6×10²⁸ years (90% confidence) for decay into a neutrino and photon.', 'bound': pdg('S003T')},
       [dec('None (stable)', ['e-'], [], None, 'Lightest charged particle: electric charge conservation forbids any decay.')],
       {'name': 'Positron', 'symbol': 'e⁺', 'self_conjugate': False, 'note': 'Proposed from Dirac\'s relativistic theory of the electron and found in cosmic rays by Carl Anderson in 1932. Same mass, charge +1.'},
       'J. J. Thomson at the Cavendish Laboratory in 1897, measuring the charge-to-mass ratio of cathode rays and showing they were far lighter than any atom.',
       'The cloud around every atom: all of chemistry, the current in a wire and the light from a screen. About as many as there are protons in everything you touch.',
       ['S003M', 'S003T'])
lepton('muon', 'μ⁻', 'Muon', 2, mass('S004M', 'Measured directly'),
       'A directly measured rest mass, about 207 times the electron\'s. The reason there is a second, heavier copy of the electron is not known.',
       {'kind': 'unstable', 'text': 'Mean life 2.1969811×10⁻⁶ s (PDG).', 'ref': pdg('S004T')},
       [dec('μ⁻ → e⁻ + ν̄ₑ + ν_μ', ['mu-'], ['e-', 'nubar_e', 'nu_mu'], None, 'Essentially 100% of muon decays (PDG listing); the rare radiative and e⁺e⁻ variants are small. The rate follows the weak force through a virtual W.')],
       {'name': 'Antimuon', 'symbol': 'μ⁺', 'self_conjugate': False, 'note': 'Same mass and lifetime, charge +1.'},
       'Seth Neddermeyer and Carl Anderson (and, independently, Jabez Street and Edward Stevenson) in cosmic-ray cloud-chamber tracks, reported in 1937.',
       'Cosmic-ray muons pass through you all the time: roughly one per square centimetre of horizontal surface per minute at sea level (PDG cosmic-ray review, 2000 edition).',
       ['S004M', 'S004T'])
lepton('tau', 'τ⁻', 'Tau lepton', 3, mass('S035M', 'Measured directly'),
       'A directly measured rest mass, about 3,477 times the electron\'s (a ratio: my calculation). The heaviest charged lepton, heavy enough to decay into hadrons.',
       {'kind': 'unstable', 'text': 'Mean life 2.903×10⁻¹³ s (PDG).', 'ref': pdg('S035T')},
       [dec('τ⁻ → e⁻ + ν̄ₑ + ν_τ', ['tau-'], ['e-', 'nubar_e', 'nu_tau'], br('S035.2')),
        dec('τ⁻ → μ⁻ + ν̄_μ + ν_τ', ['tau-'], ['mu-', 'nubar_mu', 'nu_tau'], br('S035.1')),
        dec('τ⁻ → π⁻ + ν_τ', ['tau-'], ['pi-', 'nu_tau'], br('S035.12')),
        dec('τ⁻ → π⁻ + π⁰ + ν_τ', ['tau-'], ['pi-', 'pi0', 'nu_tau'], br('S035.16'))],
       {'name': 'Antitau', 'symbol': 'τ⁺', 'self_conjugate': False, 'note': 'Same mass and lifetime, charge +1.'},
       'Martin Perl and colleagues using the Mark I detector at the SPEAR electron–positron collider at SLAC, 1975, from events containing an electron and a muon with energy missing; he shared the 1995 Nobel Prize in Physics for it.',
       'Not in everyday matter: it lives about 3×10⁻¹³ s. Made in accelerators and by cosmic rays.',
       ['S035M', 'S035T', 'S035.2', 'S035.1', 'S035.12', 'S035.16'])

# --- neutrinos: masses are NOT known
nu_mass = {'known': False, 'text': 'Not known. Neutrinos have a tiny mass (oscillation proves it is not zero) but only differences between their squared masses are measured, plus upper bounds on the size. See the neutrino numbers below.',
           'note': 'Each neutrino of definite flavour is a mix of three mass states (ν₁, ν₂, ν₃); that is what neutrino oscillation shows. The original Standard Model had massless neutrinos, so their mass is the first thing found that goes beyond it.'}
def neutrino(id_, sym, name, gen, partner, disc, everyday, sources, anti_sym):
    add(dict(id=id_, node='sm_' + id_, symbol=sym, name=name, family='lepton', kind='fermion', generation=gen, charge='0', charge_text='0',
             spin='1/2', colour=colour_none,
             weak_isospin={'T': '1/2', 'T3': '+1/2', 'note': 'Only the left-handed neutrino has been observed; it forms a doublet with the ' + partner + '.'},
             feels=['weak'], feels_note='In the minimal Standard Model a neutrino feels only the weak force (and gravity), has no right-handed partner and no coupling to the Higgs field. Neutrinos do have mass, so the minimal model is incomplete: how they get their mass, and so whether they couple to the Higgs field the way other fermions do, is not known (open question).',
             mass=dict(nu_mass), lifetime={'kind': 'stable-assumed', 'text': 'No decay has been observed. Heavier neutrino mass states could in principle decay into lighter ones; the PDG gives limits on the lifetime-to-mass ratio.'},
             decays=[dec('None observed', [id_], [], None, 'Stable on all observed timescales.')],
             antiparticle={'name': 'Antineutrino', 'symbol': anti_sym, 'self_conjugate': None,
                           'note': 'OPEN QUESTION: is the antineutrino a different particle (Dirac neutrino) or the same particle as the neutrino (Majorana)? Not yet known; experiments searching for neutrinoless double-beta decay test this.'},
             discovery=disc, everyday=everyday, sources=sources))
neutrino('nu_e', 'νₑ', 'Electron neutrino', 1, 'electron',
         'Clyde Cowan and Frederick Reines detected (anti)neutrinos from a nuclear reactor at the Savannah River Plant, South Carolina, in 1956, by the flash from inverse beta decay.',
         'The Sun\'s fusion makes of order 10³⁸ of them every second (my estimate from its luminosity); roughly 6×10¹⁰ of the most common (pp) kind pass through each square centimetre of Earth per second, and you notice none (PDG, solar-neutrino section of the neutrino-mixing review).', ['S066MAE'], 'ν̄ₑ')
neutrino('nu_mu', 'ν_μ', 'Muon neutrino', 2, 'muon',
         'Leon Lederman, Melvin Schwartz and Jack Steinberger at Brookhaven\'s Alternating Gradient Synchrotron in 1962 showed that the neutrino made with a muon is a different kind from the one made with an electron.',
         'Made when cosmic rays hit the upper atmosphere (pions decay to muons and muon neutrinos); studied by the Super-Kamiokande detector.', ['S066MNM'], 'ν̄_μ')
neutrino('nu_tau', 'ν_τ', 'Tau neutrino', 3, 'tau lepton',
         'Directly observed by the DONUT experiment at Fermilab in 2000; the last of the Standard Model\'s fermions to be seen directly (the Higgs boson, which is not a fermion, came later, in 2012).',
         'Rare. Appears when other neutrinos oscillate into this flavour on their way from the Sun or atmosphere.', ['S066MNT'], 'ν̄_τ')

# --- gauge bosons and Higgs
add(dict(id='gluon', node='sm_gluon', symbol='g', name='Gluon', family='boson', kind='gauge boson', generation=None, charge='0', charge_text='0',
         spin='1', colour={'has': True, 'text': 'Yes, unlike the photon. A gluon carries a colour and an anticolour at once; there are eight kinds. Because gluons carry colour, they attract each other, which is why the strong force behaves so differently from electromagnetism.'},
         weak_isospin={'T': '0', 'T3': '0', 'note': 'A gluon has no weak isospin.'}, feels=['strong'],
         mass={'known': True, 'eV': 0.0, 'text': '0 in the Standard Model (the theory\'s symmetry requires it); a single gluon is never seen alone, so no direct limit can be measured the way it is for the photon.', 'scheme': 'Theoretical', 'note': 'Gluons are massless in the theory, yet the energy of the gluon field is a large part of the proton\'s mass: a lattice calculation gives glue field energy 37(5)(4)% (MS-bar scheme, 2 GeV; the split depends on scheme and scale), alongside quark energy, the trace anomaly and quark-mass terms.'},
         lifetime={'kind': 'confined', 'text': 'Not defined: gluons are never free. They exist only inside hadrons; a high-energy gluon shows up in a detector as a jet, a spray of hadrons.'},
         decays=[dec('None (confined)', ['g'], [], None, 'No lifetime applies to a particle that is never free.')],
         antiparticle={'name': 'Gluon', 'symbol': 'g', 'self_conjugate': True, 'note': 'Each of the 8 gluons\' antiparticles is again one of the 8 gluon states (a colour–anticolour mixture), so the set is its own antiparticle.'},
         discovery='Seen as a third "jet" in electron–positron collisions at the PETRA collider at DESY, Hamburg, in 1979 (TASSO first, then JADE, PLUTO and Mark J).',
         everyday='Inside every proton and neutron, in all matter, holding quarks together. The energy of the quark and gluon fields makes up nearly all of the mass you weigh (see the proton mass card for the lattice split).', sources=['G021']))
add(dict(id='photon', node='sm_photon', symbol='γ', name='Photon', family='boson', kind='gauge boson', generation=None, charge='0', charge_text='0',
         spin='1', colour={'has': False, 'text': 'No. Photons carry no colour and do not feel the strong force.'},
         weak_isospin={'T': '0', 'T3': '0', 'note': 'After electroweak mixing the photon is a combination of the weak-isospin boson W³ and the hypercharge boson B; it has no definite weak isospin.'}, feels=[],
         feels_note='A photon has no charge, so it does not feel the electromagnetic force; it is the carrier of it. It couples to every electrically charged particle.',
         mass={'known': True, 'eV': 0.0, 'limit': pdg('S000M'), 'text': 'Zero in the Standard Model. PDG: experimental upper limit < 1×10⁻¹⁸ eV.', 'scheme': 'Experimental limit', 'note': 'An upper limit, not a measurement of a mass.'},
         lifetime={'kind': 'stable', 'text': 'Stable. PDG also gives a photon charge limit of < 1×10⁻⁴⁶ e.', 'charge_limit': pdg('S000Q')},
         decays=[dec('None (stable)', ['gamma'], [], None, 'A massless particle has nothing lighter to decay to.')],
         antiparticle={'name': 'Photon', 'symbol': 'γ', 'self_conjugate': True, 'note': 'The photon is its own antiparticle.'},
         discovery='Planck (1900) introduced energy quanta for the exchange of energy between matter and radiation; Einstein (1905) proposed that light itself comes in quanta; Arthur Compton\'s 1923 X-ray scattering experiments showed light carries momentum like a particle.',
         everyday='All light, radio, X-rays, and every electric and magnetic force between charges. Sunlight on the park is a stream of photons.', sources=['S000M', 'S000Q']))
wm = mass('S043M', 'Direct measurements at colliders (LHC–Tevatron average)'); wm['note'] = 'About 86 times a proton\'s mass. The W is heavy because the Higgs field gives it mass; that makes the weak force short-ranged.'
add(dict(id='w_boson', node='sm_w_boson', symbol='W±', name='W boson', family='boson', kind='gauge boson', generation=None, charge='±1', charge_text='±1 e (W⁺: +1, W⁻: −1)',
         spin='1', colour={'has': False, 'text': 'No. W bosons carry no colour.'},
         weak_isospin={'T': '1', 'T3': '±1', 'note': 'W⁺ has T3 = +1, W⁻ has T3 = −1.'}, feels=['weak', 'em', 'higgs'], mass=wm,
         lifetime={'kind': 'width', 'text': 'Decay width 2.14 ± 0.05 GeV (PDG), a lifetime of about 3×10⁻²⁵ s (calculation).', 'width': pdg('S043W'), 'lifetime_s_calc': life_from_width(pdg('S043W')['value'])},
         decays=[dec('W⁺ → hadrons (a quark and an antiquark)', ['W+'], ['hadrons'], br('S043.8')),
                 dec('W⁺ → ℓ⁺ + ν (each of e, μ, τ about equally)', ['W+'], ['lepton+', 'nu'], br('S043.7'), 'The figure is per lepton flavour.')],
         antiparticle={'name': 'W⁻', 'symbol': 'W⁻', 'self_conjugate': False, 'note': 'W⁺ and W⁻ are each other\'s antiparticles.'},
         discovery='Announced at CERN in January 1983 by the UA1 and UA2 experiments at the Super Proton Synchrotron run as a proton–antiproton collider (UA1 led by Carlo Rubbia, UA2 by Pierre Darriulat).',
         everyday='In the Sun\'s core, a proton turns into a neutron through a virtual W; that step makes hydrogen fusion slow and the Sun last billions of years. Also in radioactive beta decay.', sources=['S043M', 'S043W', 'S043.7', 'S043.8']))
zm = mass('S044M', 'Direct measurements: the position of the resonance in electron–positron collisions at LEP'); zm['note'] = 'About 97 times a proton\'s mass.'
add(dict(id='z_boson', node='sm_z_boson', symbol='Z⁰', name='Z boson', family='boson', kind='gauge boson', generation=None, charge='0', charge_text='0',
         spin='1', colour={'has': False, 'text': 'No. The Z carries no colour.'},
         weak_isospin={'T': '1', 'T3': '0', 'note': 'The Z is a mixture of W³ and the hypercharge boson B. It couples to a fermion through the fermion\'s T3 and charge.'},
         feels=['weak', 'higgs'], mass=zm,
         lifetime={'kind': 'width', 'text': 'Decay width 2.4955 ± 0.0023 GeV (PDG), a lifetime of about 2.6×10⁻²⁵ s (calculation).', 'width': pdg('S044W'), 'lifetime_s_calc': life_from_width(pdg('S044W')['value'])},
         decays=[dec('Z⁰ → hadrons (quark–antiquark)', ['Z'], ['hadrons'], br('S044.7')),
                 dec('Z⁰ → neutrino + antineutrino (unseen)', ['Z'], ['nu', 'nubar'], br('S044.9'), 'Invisible: the light neutrino kinds that couple to the Z, added together. The measured width fits three kinds.'),
                 dec('Z⁰ → ℓ⁺ + ℓ⁻ (each of e, μ, τ)', ['Z'], ['lepton+', 'lepton-'], br('S044.16'), 'Each charged-lepton pair is about 3.37% (Z → e⁺e⁻ 3.3632%, μ⁺μ⁻ 3.3662%, τ⁺τ⁻ 3.3696%).')],
         antiparticle={'name': 'Z⁰', 'symbol': 'Z⁰', 'self_conjugate': True, 'note': 'The Z is its own antiparticle.'},
         discovery='Announced at CERN in 1983 by UA1 and UA2, a few months after the W.',
         everyday='Mediates the weak "neutral current": neutrinos scattering off matter without changing into charged leptons. Its decays were measured precisely at LEP in the 1990s.', sources=['S044M', 'S044W', 'S044.7', 'S044.9', 'S044.16', 'S044.1', 'S044.2', 'S044.8']))
hm = mass('S126M', 'Direct measurements: ATLAS and CMS combined'); hm['note'] = 'About 133 times a proton\'s mass. A direct measurement from the energies of its decay products.'
add(dict(id='higgs', node='sm_higgs', symbol='H', name='Higgs boson', family='boson', kind='scalar boson', generation=None, charge='0', charge_text='0',
         spin='0', colour={'has': False, 'text': 'No.'},
         weak_isospin={'T': '1/2', 'T3': '-1/2', 'note': 'The Higgs field is a doublet of weak isospin 1/2; the Higgs boson is what is left of it after the field takes a value everywhere (PDG Electroweak Model review).'},
         feels=['higgs', 'weak'], feels_note='It couples to every massive particle with strength proportional to the particle\'s mass, and to itself; it does not couple to the photon or gluon directly.',
         mass=hm,
         lifetime={'kind': 'width', 'text': 'Decay width 3.0 (+1.5, −0.7) MeV (PDG), a lifetime of about 2×10⁻²² s (calculation).', 'width': pdg('S126W'), 'lifetime_s_calc': HBAR_GEV_S / (pdg('S126W')['value'] / 1000)},
         decays=[dec('H → b + b̄', ['H'], ['b', 'bbar'], br('S126.4')),
                 dec('H → W + W*', ['H'], ['W+', 'W-'], br('S126.1'), 'One W is "off-shell": the Higgs is lighter than two real Ws.'),
                 dec('H → τ⁺ + τ⁻', ['H'], ['tau+', 'tau-'], br('S126.5')),
                 dec('H → Z + Z*', ['H'], ['Z', 'Z'], br('S126.2')),
                 dec('H → γ + γ', ['H'], ['gamma', 'gamma'], br('S126.3'), 'Rare but clean; this was one of the two channels of the 2012 discovery.')],
         antiparticle={'name': 'Higgs boson', 'symbol': 'H', 'self_conjugate': True, 'note': 'The Higgs boson is neutral and is its own antiparticle.'},
         discovery='Announced on 4 July 2012 at CERN by the ATLAS and CMS experiments at the Large Hadron Collider; Peter Higgs and François Englert shared the 2013 Nobel Prize in Physics for the theory.',
         everyday='Not found alone in ordinary matter: it lives about 10⁻²² s. The Higgs field, which fills space, gives the electron its mass, and therefore sets the size of atoms.', sources=['S126M', 'S126W', 'S126.4', 'S126.1', 'S126.5', 'S126.2', 'S126.3']))

# ---- composites ---------------------------------------------------------------------------------
proton = dict(id='proton', node='sm_proton', symbol='p', name='Proton', quarks=['u', 'u', 'd'], charge='+1', spin='1/2',
  mass=pdg('S016M'), mass_u=pdg('S016AMU'), charge_radius=pdg('S016CR'), magnetic_radius=pdg('S016MCR'), magnetic_moment=pdg('S016MM'),
  lifetime={'text': 'No decay has ever been seen. PDG 2026, 90% confidence: the mean life is more than 9×10²⁹ years for decay into anything (a mode-independent limit, which is weak), and much more for particular modes: for p → e⁺π⁰ the partial mean life is more than 2.4×10³⁴ years (Super-Kamiokande). These are bounds, not predictions of decay.', 'short': 'no decay seen; more than 9×10²⁹ years for any mode, more than 2.4×10³⁴ years for p → e⁺π⁰ (PDG 2026, 90% CL)', 'partial_e_pi0': pdg('S016T06P'), 'bound': pdg('S016T')},
  charge_neutrality={'bound': pdg('S016DQ'), 'text': 'The proton and electron charges are equal and opposite to better than 1 part in 10²¹ (PDG).'},
  note='The proton mass listed by PDG is the CODATA 2022 value.')
neutron = dict(id='neutron', node='sm_neutron', symbol='n', name='Neutron', quarks=['u', 'd', 'd'], charge='0', spin='1/2',
  mass=pdg('S017M'), mass_u=pdg('S017AMU'), mass_minus_proton=pdg('S017D'), magnetic_moment=pdg('S017MM'), charge_radius_squared=pdg('S017MCR'),
  charge_limit=pdg('S017Q'),
  lifetime={'text': 'Free neutron mean life 878.3 ± 0.4 s (PDG average; the scale factor of 1.8 reflects a long-standing disagreement between "beam" and "bottle" measurements). Inside most stable nuclei neutrons do not decay.', 'ref': pdg('S017T')},
  decay=dec('n → p + e⁻ + ν̄ₑ', ['n'], ['p', 'e-', 'nubar_e'], None, 'Essentially 100% (PDG). The quark-level step is d → u + W⁻ with W⁻ → e⁻ + ν̄ₑ.'))

H = []   # other hadrons: (id, symbol, name, content, kind, mass pid, life pid or width, decays, note)
def had(id_, sym, name, content, mpid, charge, spin, kind, life=None, width=None, decays=None, note='', antiparticle=None, mixed=False):
    d = dict(id=id_, symbol=sym, name=name, quarks=content, kind=kind, charge=charge, spin=spin, mass=pdg(mpid), note=note, quark_content_mixed=mixed)
    if life: d['lifetime'] = pdg(life)
    if width: d['width'] = pdg(width)
    if decays: d['decays'] = decays
    if antiparticle: d['antiparticle'] = antiparticle
    H.append(d)
    if id_=='delta_pp':
        d['mass']['display']=d['mass']['text']='1232 (range 1230 to 1234) MeV'; d['mass'].pop('value',None); d['mass']['value']=1232.0; d['width']['display']=d['width']['text']='117 (range 114 to 120) MeV'; d['width']['value']=117.0; d['mass']['pdg_override']=d['width']['pdg_override']=True

had('pi_plus', 'π⁺', 'Pion (charged)', ['u', 'dbar'], 'S008M', '+1', '0', 'meson', life='S008T', decays=[dec('π⁺ → μ⁺ + ν_μ', ['pi+'], ['mu+', 'nu_mu'], br('S008.1'))], antiparticle='π⁻ (d ū)', note='The lightest meson with charge. Carries the residual strong force between nucleons.')
had('pi_zero', 'π⁰', 'Pion (neutral)', ['u', 'ubar'], 'S009M', '0', '0', 'meson', life='S009T', decays=[dec('π⁰ → γ + γ', ['pi0'], ['gamma', 'gamma'], br('S009.1'))], mixed=True, note='A quantum mix of u ū and d d̄; lifetime about 8×10⁻¹⁷ s, because it decays by the electromagnetic force.')
had('k_plus', 'K⁺', 'Kaon (charged)', ['u', 'sbar'], 'S010M', '+1', '0', 'meson', life='S010T', decays=[dec('K⁺ → μ⁺ + ν_μ', ['k+'], ['mu+', 'nu_mu'], br('S010.1')), dec('K⁺ → π⁺ + π⁰', ['k+'], ['pi+', 'pi0'], br('S010.2'))], antiparticle='K⁻ (s ū)', note='The first "strange" particle family (Rochester and Butler, 1947).')
had('k_zero', 'K⁰', 'Kaon (neutral)', ['d', 'sbar'], 'S011M', '0', '0', 'meson', note='Quantum mixes of K⁰ and K̄⁰ make a short-lived K_S and a long-lived K_L, which are the states that actually travel through a detector.')
had('d_zero', 'D⁰', 'D meson (neutral)', ['c', 'ubar'], 'S032M', '0', '0', 'meson', life='S032T', note='A charm quark with an up antiquark.')
had('b_plus', 'B⁺', 'B meson (charged)', ['u', 'bbar'], 'S041M', '+1', '0', 'meson', life='S041T', note='An up quark with a bottom antiquark; made in huge numbers at "B factories".')
had('jpsi', 'J/ψ', 'J/psi', ['c', 'cbar'], 'M070M', '0', '1', 'meson', width='M070W', decays=[dec('J/ψ → hadrons', ['jpsi'], ['hadrons'], br('M070.3')), dec('J/ψ → e⁺ + e⁻', ['jpsi'], ['e+', 'e-'], br('M070.1')), dec('J/ψ → μ⁺ + μ⁻', ['jpsi'], ['mu+', 'mu-'], br('M070.2'))], note='A charm–anticharm pair. Its extraordinarily narrow width (92.6 keV, compared to its 3.097 GeV mass) was the clue that it was a new kind of quark.')
had('upsilon', 'Υ(1S)', 'Upsilon', ['b', 'bbar'], 'M049M', '0', '1', 'meson', width='M049W', decays=[dec('Υ(1S) → hadrons', ['upsilon'], ['hadrons'], br('M049.101')), dec('Υ(1S) → μ⁺ + μ⁻', ['upsilon'], ['mu+', 'mu-'], br('M049.1'))], note='A bottom–antibottom pair (bottomonium).')
had('lambda', 'Λ', 'Lambda baryon', ['u', 'd', 's'], 'S018M', '0', '1/2', 'baryon', life='S018T', decays=[dec('Λ → p + π⁻', ['lambda'], ['p', 'pi-'], br('S018.1')), dec('Λ → n + π⁰', ['lambda'], ['n', 'pi0'], br('S018.2'))], antiparticle='Λ̄ (ū d̄ s̄)', note='Like a neutron with one down quark replaced by a strange quark.')
had('lambda_c', 'Λc⁺', 'Lambda-c baryon', ['u', 'd', 'c'], 'S033M', '+1', '1/2', 'baryon', note='Like a proton with one up quark replaced by a charm quark.')
had('delta_pp', 'Δ⁺⁺', 'Delta baryon (charge 2)', ['u', 'u', 'u'], 'B033M', '+2', '3/2', 'baryon', width='B033W', decays=[dec('Δ⁺⁺ → p + π⁺', ['delta++'], ['p', 'pi+'], br('B033.1'), 'PDG lists Δ(1232) → Nπ at about 99.4%; for the Δ⁺⁺ the only possible Nπ state is pπ⁺.')], note='Three up quarks with parallel spins. This particle was one of the clues that quarks carry an extra "colour" charge: otherwise three identical fermions in the same state would break the exclusion principle. Mass given is the PDG "Breit–Wigner" central value of 1232 MeV with a range of 1230–1234; it is a resonance, with a width of about 117 MeV (PDG range 114–120).')
had('omega_minus', 'Ω⁻', 'Omega baryon', ['s', 's', 's'], 'S024M', '-1', '3/2', 'baryon', life='S024T', decays=[dec('Ω⁻ → Λ + K⁻', ['omega-'], ['lambda', 'k-'], br('S024.1')), dec('Ω⁻ → Ξ⁰ + π⁻', ['omega-'], ['xi0', 'pi-'], br('S024.2'))], note='Three strange quarks. Found at Brookhaven National Laboratory in 1964, as the quark model required.')

# ---- interactions -----------------------------------------------------------------------------
interactions = [
 dict(id='strong', name='Strong force', carriers=['gluon'], couples_to='colour charge', feels=['up', 'down', 'strange', 'charm', 'bottom', 'top', 'gluon'],
      text='Binds quarks into protons, neutrons and other hadrons, and (as a leftover) binds protons and neutrons into nuclei. Carried by 8 kinds of gluon. Between coloured objects (quarks and gluons) the energy keeps rising as they are pulled apart (confinement); the leftover force between hadrons is short-ranged, about 1.4×10⁻¹⁵ m.'),
 dict(id='em', name='Electromagnetic force', carriers=['photon'], couples_to='electric charge', feels=['up', 'down', 'strange', 'charm', 'bottom', 'top', 'electron', 'muon', 'tau', 'w_boson'],
      text='Acts on everything with electric charge; carried by the photon. Holds electrons around nuclei and shapes all of chemistry.'),
 dict(id='weak', name='Weak force', carriers=['w_boson', 'z_boson'], couples_to='weak isospin (the W) and a mix of weak isospin and electric charge (the Z); mass comes from the Higgs field, not from the weak coupling', feels=['up', 'down', 'strange', 'charm', 'bottom', 'top', 'electron', 'muon', 'tau', 'nu_e', 'nu_mu', 'nu_tau', 'w_boson', 'z_boson', 'higgs'],
      text='Changes one flavour of quark or lepton into another (beta decay) and acts on neutrinos. Carried by the heavy W and Z bosons, which is why it has such a short range, about 2.5×10⁻¹⁸ m (ħc divided by the W mass: 197.327 MeV fm / 80,362 MeV = 2.46×10⁻¹⁸ m; my calculation).'),
 dict(id='higgs', name='Higgs field', carriers=['higgs'], couples_to='mass (the Yukawa couplings)', feels=['up', 'down', 'strange', 'charm', 'bottom', 'top', 'electron', 'muon', 'tau', 'w_boson', 'z_boson', 'higgs'],
      text='Not a force in the usual sense. The Higgs field has a nonzero value everywhere; particles that interact with it get a rest mass. The Higgs boson is a ripple in that field.'),
 dict(id='gravity', name='Gravity', carriers=[], couples_to='energy and momentum', feels=[], in_standard_model=False,
      text='Not part of the Standard Model. It acts on everything, but no quantum theory of it has been confirmed, and at particle scales it is about 10³⁶ times weaker than electromagnetism (a rough comparison for two protons; my calculation from the constants).'),
]
# NOTE the 10^36 number is checked in check_particles.py (computed from G, e, m_p).

# ---- neutrino numbers -------------------------------------------------------------------------
neutrinos = dict(
  mixing={'sin2_theta12': pdg('S067P12'), 'sin2_theta13': pdg('S067P13'),
          'sin2_theta23_normal': pdg('S067P23', 'normal'), 'sin2_theta23_inverted': pdg('S067P23', 'inverted'), 'delta_cp_pi': pdg('S067DEL')},
  mass_squared={'dm21': pdg('S067DM3'), 'dm32_normal': pdg('S067DM1', 'normal'), 'dm32_inverted': pdg('S067DM1', 'inverted')},
  direct_bound={'text': 'KATRIN (2025, 259 days of tritium beta-decay data): the effective electron-antineutrino mass is below 0.45 eV at 90% confidence. PDG 2026 lists the same bound.', 'pdg': pdg('S066MAE'), 'frontier': 'katrin_neutrino'},
  cosmology_bound={'text': 'The sum of the three neutrino masses is below 0.064 eV at 95% confidence from DESI DR2 combined with other data (assumes the standard ΛCDM cosmological model; other analyses listed by PDG give 0.08–0.19 eV).', 'source_reference': 'DESI DR2 Results II, Phys. Rev. D 112, 083515 (2025); listed in PDG 2026 under "Sum of the neutrino masses"', 'limit_eV': 0.064, 'cl': 95},
  oscillation_frontier='juno_oscillation',
  open=['The absolute mass scale (only bounds exist).', 'Normal or inverted mass ordering.', 'Whether neutrinos are their own antiparticles (Majorana) or not (Dirac).', 'Whether the CP-violating phase is nonzero.'])
import math
dm21 = neutrinos['mass_squared']['dm21']['value']; dm32n = neutrinos['mass_squared']['dm32_normal']['value']; dm32i = abs(neutrinos['mass_squared']['dm32_inverted']['value'])
neutrinos['mass_state_bounds_eV'] = {'heaviest_at_least_normal': math.sqrt(dm32n), 'heaviest_at_least_inverted': math.sqrt(dm32i), 'second_at_least': math.sqrt(dm21), 'each_below_direct': 0.45, 'sum_below_cosmology': 0.064,
   'text': 'Oscillations show the heaviest of the three mass states is at least about 0.05 eV (square root of the atmospheric Δm²; my arithmetic) and the second at least about 0.009 eV (square root of the solar Δm²); the lightest could be anywhere down to zero. The direct KATRIN bound applies to an effective electron-neutrino mass, below 0.45 eV (90% CL). The cosmological bound on the sum, below 0.064 eV (95% CL), assumes the standard ΛCDM model. A flavour neutrino (νₑ, ν_μ, ν_τ) is a mixture of mass states and has no single mass.'}
neutrinos['minimum_mass_sum_eV_calc'] = {'normal': math.sqrt(dm21) + math.sqrt(dm32n), 'inverted': math.sqrt(dm32i) + math.sqrt(dm32i - dm21),
   'text': 'The oscillation data alone force the sum of masses to be at least about 0.058 eV if the ordering is normal and about 0.10 eV if inverted (my arithmetic from the PDG Δm² values, taking the lightest neutrino to be massless).'}

# ---- what the Standard Model leaves out ------------------------------------------------------
open_questions = [
 dict(id='gravity', title='Gravity', cert='C3', text='The Standard Model has no gravity. General relativity describes it very well, but nobody has a tested quantum theory of it; the two descriptions have not been joined.'),
 dict(id='dark_matter', title='Dark matter', cert='C2', text='Motions of stars, galaxies and clusters, and the pattern of the early universe, indicate matter that does not shine; none of the 17 particles fits (neutrinos are too light). What it is remains unknown.', kn='dark_matter_evidence'),
 dict(id='dark_energy', title='Dark energy', cert='C3', text='The expansion of the universe is accelerating. The Standard Model has no explanation, and the vacuum energy it would naturally predict is far larger than what is observed.', kn='dark_energy_node'),
 dict(id='neutrino_mass', title='Neutrino masses', cert='C1', text='The original Standard Model had massless neutrinos. Oscillation proves they have mass, so the model had to be extended; how neutrinos get their mass, and whether they are Majorana particles, is not known.', kn='neutrinos'),
 dict(id='matter_antimatter', title='Matter–antimatter imbalance', cert='C2', text='Matter and antimatter should have been made equally in the Big Bang, yet the universe is made of matter. The known sources of CP violation in the Standard Model are far too small to explain the amount.', kn='antimatter_asymmetry'),
 dict(id='generations', title='Why three generations', cert='C3', text='Why there are three copies of the quark and lepton pattern, and not two or four, is not known. Experiments on Z decay show three light neutrino kinds, but say nothing about heavier ones.'),
 dict(id='parameters', title='Free parameters', cert='C3', text='The model contains about 19 numbers that are not predicted but must be measured (the masses, the mixing angles, the force strengths and so on; see the count below). Why they have the values they have is unexplained.'),
 dict(id='hierarchy', title='Why the Higgs is so light', cert='C3', text='Quantum corrections would naturally push the Higgs mass towards the highest energy scale in the theory. That it stays at 125 GeV is called the hierarchy problem; no accepted solution has been confirmed.'),
 dict(id='strong_cp', title='The strong CP problem', cert='C3', text='The strong force could violate the matter–antimatter mirror symmetry (the parameter θ), but measurements of the neutron\'s electric dipole moment find it indistinguishable from zero. Why it is so small is unexplained.'),
 dict(id='compositeness', title='Are quarks and electrons really pointlike?', cert='C2', text='No internal structure has been found. PDG 2026 reports limits on a compositeness scale of roughly 10 to 35 TeV, which corresponds to sizes below about 10⁻²⁰ m. That is a limit of measurement, not a proof that there is nothing inside.'),
]
particle_count_note = 'The count of seventeen is a convention: W⁺ and W⁻ are counted as one particle, the eight gluons as one, and antiparticles, colour states and spin or handedness states are not counted separately.'
free_parameters = dict(count=19, convention='19 free parameters in the Standard Model with massless neutrinos (a common counting)',
  list=[('quark masses', 6), ('charged-lepton masses', 3), ('quark mixing angles (CKM)', 3), ('quark CP-violating phase (CKM)', 1), ('gauge couplings (strong, weak, hypercharge)', 3),
        ('Higgs vacuum value and Higgs mass', 2), ('strong CP angle θ', 1)],
  extra='Neutrino masses and mixing add more: three masses, three angles and a CP phase (and two more phases if neutrinos are Majorana).')

compositeness = dict(
  text='PDG 2026 "Searches for Quark and Lepton Compositeness" reports limits on a contact-interaction scale Λ between about 9 and 29.5 TeV for quark models (ATLAS and CMS dijet data) and 24 to 36 TeV for electron- and muon-quark contact interactions. A scale Λ corresponds to a length of ħc/Λ.',
  low_TeV=9.2, high_TeV=36.4, hbar_c_MeV_fm=197.3269804,
  length_m_range=[197.3269804e-15 / 36.4e6, 197.3269804e-15 / 9.2e6],
  note='ħc/Λ gives about 5×10⁻²¹ m to 2×10⁻²⁰ m (my calculation). These limits are model dependent, so the safe statement is "no structure found down to roughly 10⁻¹⁹ m".')

momentum = dict(
  text='Lattice QCD (chiQCD collaboration, 2022, MS-bar scheme at 2 GeV): quarks and antiquarks together carry about 49% of the proton\'s momentum and gluons about 51% (⟨x⟩q = 0.491(20)(23), ⟨x⟩g = 0.509(20)(23)). The split depends on the energy scale at which the proton is probed. Global fits to scattering data at the same scale give a smaller gluon share, about 0.40 to 0.41 (CT18: 0.413(8); JAM19: 0.403(2); as quoted by Fan, Lin and Zeilbeck 2022, arXiv:2208.00980); lattice results sit higher, and the difference is not yet understood.',
  quarks=0.491, gluons=0.509, gluons_uncertainty=[0.020, 0.023], scale_GeV=2, global_fits={'CT18': 0.413, 'JAM19': 0.403, 'source': 'arXiv:2208.00980, quoting CT18 and JAM19, MS-bar 2 GeV'}, ref='G. Wang et al., Phys. Rev. D 106, 014512 (2022), arXiv:2111.09329')
mass_origin = dict(
  text='Lattice-QCD decomposition of the proton mass (Yang et al., Phys. Rev. Lett. 121, 212001 (2018), MS-bar scheme at 2 GeV; two uncertainties are quoted for each number): quark energy 33(4)(4)%, glue field energy 37(5)(4)%, trace anomaly 23(1)(1)%, and quark scalar-condensate (sigma-term) contributions 9(2)(1)%. The sigma terms are the part that scales with the quark masses (u, d and the strange sea). The four add to 102%, within the uncertainties. The split depends on the scheme and the scale; only the total is fixed.',
  parts={'quark_energy': 33, 'glue_energy': 37, 'trace_anomaly': 23, 'sigma_terms': 9},
  uncertainties={'quark_energy': [4, 4], 'glue_energy': [5, 4], 'trace_anomaly': [1, 1], 'sigma_terms': [2, 1]},
  scheme='MS-bar, 2 GeV',
  ref='Y.-B. Yang et al. (chiQCD), arXiv:1808.08677',
  rest_mass_sum_MeV=2 * pdg('Q002M')['value'] + pdg('Q001M')['value'],
  rest_mass_fraction=(2 * pdg('Q002M')['value'] + pdg('Q001M')['value']) / pdg('S016M')['value'],
  note='Adding the rest masses of the two up quarks and one down quark (PDG, MS-bar 2 GeV) gives about 9 MeV, roughly 1% of the proton mass of 938.27 MeV (my calculation). That is only the valence quarks: the lattice sigma terms (about 9%, including the strange sea) are the part of the mass that responds to the quark masses. The other terms are energies of the quark-gluon system; how the total is divided depends on scheme and scale.')

out = dict(
  meta=dict(title='Standard Model particle data', pdg_edition='2026', pdg_citation=EX['_meta']['citation'], pdg_release=EX['_meta']['release'], licence_of_source=EX['_meta']['licence'],
            built_by='tools/particles/build_particles.py', note='Every measured value carries a PDG identifier (pdgid) and the text PDG prints. Calculated values are marked "calc". See tools/particles/SOURCES.md.',
            masses_note='Masses are given in eV in the field "eV" for plotting; use "text" and "unit" to show the PDG value.'),
  particle_count_note=particle_count_note, particles=parts, composites=[proton, neutron], hadrons=H, interactions=interactions, neutrinos=neutrinos,
  open_questions=open_questions, free_parameters=free_parameters, compositeness=compositeness, proton_momentum=momentum, proton_mass_origin=mass_origin,
  everyday_matter=dict(ids=['up', 'down', 'electron', 'gluon', 'photon'], note='Everything in the park is built from up quarks, down quarks and electrons, bound by gluons and photons.',
     others=[dict(id='muon', text='Cosmic-ray muons: roughly one per square centimetre of horizontal surface per minute at sea level (PDG cosmic-ray review, 2000 edition; this is the figure for muons above 1 GeV/c).'),
             dict(id='nu_e', text='Solar neutrinos: about 6×10¹⁰ per square centimetre per second of the pp kind (PDG neutrino-mixing review, 2026).'),
             dict(id='others', text='Strange, charm, bottom and top quarks, the tau, the W, Z and Higgs bosons: made in accelerators and cosmic-ray collisions, and abundant in the early universe.')]),
  mass_axis=dict(note='Masses on a logarithmic axis in eV. Neutrinos have no measured mass and the flavour states have no single mass, so they are not placed on the axis. What is known is drawn as a band: the heaviest mass state is at least ≈0.05 eV (oscillations; my calculation from PDG Δm²) and every mass is below 0.45 eV (KATRIN, direct, 90% CL); a line marks the cosmological bound on the sum of all three, 0.064 eV, which holds only in the standard cosmological model.',
     top_over_electron=pdg('Q007TP')['value'] * 1e9 / mass('S003M', '')['eV'], electron_over_neutrino_at_least=mass('S003M', '')['eV'] / 0.45),
)
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'particles.json')
json.dump(out, open(dst, 'w'), indent=1, ensure_ascii=False)
print('wrote', os.path.normpath(dst), len(parts), 'particles', len(H), 'hadrons')
