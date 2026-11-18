from nodelib import *

PDGNODE = dict(up='Q002', down='Q001', strange='Q003', charm='Q004', bottom='Q005', top='Q007', electron='S003', muon='S004', tau='S035',
               nu_e='S066', nu_mu='S066', nu_tau='S066', gluon='G021', photon='S000', w_boson='S043', z_boson='S044', higgs='S126')
MASSBARS = [('u', 'up'), ('d', 'down'), ('s', 'strange'), ('c', 'charm'), ('b', 'bottom'), ('t', 'top'), ('e', 'electron'), ('μ', 'muon'), ('τ', 'tau'), ('W', 'w_boson'), ('Z', 'z_boson'), ('H', 'higgs')]

def massbars(me):
    bars = []
    for lab, pid in MASSBARS:
        bars.append({'label': lab, 'value': round(mevs(pid), 6), 'color': 'gold' if pid == me else 'dim'})
    return {'type': 'bars', 'bars': bars, 'logy': True, 'ylabel': 'rest mass, MeV/c² (log scale)',
            'caption': 'Rest masses of the twelve massive particles on a logarithmic scale; the one you are reading about is highlighted. The top quark is about 340,000 times heavier than the electron. Quark masses depend on the scheme used to define them (see the card).'}

def feats(p):
    f = [['Electric charge', p['charge_text']], ['Spin', p['spin'] + ' (ħ)'],
         ['Mass', p['mass'].get('display') or p['mass']['text']]]
    if p['mass'].get('scheme'): f.append(['What the mass means', p['mass']['scheme']])
    f.append(['Colour charge', 'yes' if p['colour']['has'] else 'no'])
    f.append(['Feels', ', '.join({'strong': 'strong', 'em': 'electromagnetic', 'weak': 'weak', 'higgs': 'Higgs field'}[x] for x in p['feels']) or 'nothing directly (it carries a force)'])
    if p['generation']: f.append(['Generation', str(p['generation'])])
    f.append(['Antiparticle', p['antiparticle']['name'] + (' (own antiparticle)' if p['antiparticle']['self_conjugate'] else '')])
    f.append(['Data source', 'Particle Data Group, Review of Particle Physics 2026'])
    return f

def decay_html(p):
    out = []
    for d in p['decays']:
        if not d['out']: continue
        s = d['label']
        if d.get('br'): s += ' &nbsp;(' + ('{}'.format(d['br']['text'].replace('<', '&lt;'))) + ' of decays)'
        out.append('<li>' + s + '</li>')
    return '<ul>' + ''.join(out) + '</ul>' if out else ''

def pnode(id_, summary, basics, deeper_extra, expert, cert='C1', refs=(), kn=(), where=None, viz=None, oq=None, dyk=None, parts=(), made_of=()):
    p = PBY[id_]
    life = p['lifetime']['text']
    deeper = ('<p><b>Mass.</b> ' + (p['mass'].get('display') or p['mass']['text']) + '. ' + (p['mass'].get('note') or '') + '</p>' if p['mass'].get('known', True) else '<p><b>Mass.</b> ' + p['mass']['text'] + ' ' + p['mass']['note'] + '</p>')
    deeper += '<p><b>Lifetime.</b> ' + life + '</p>'
    dh = decay_html(p)
    if dh: deeper += '<p><b>Main ways it decays</b> (branching fractions from the PDG, 2026):</p>' + dh
    deeper += '<p><b>Colour charge.</b> ' + p['colour']['text'] + '</p>'
    deeper += '<p><b>Antiparticle.</b> ' + p['antiparticle']['name'] + ' (' + p['antiparticle']['symbol'] + '). ' + p['antiparticle']['note'] + '</p>'
    deeper += deeper_extra
    expert += '<p><b>Weak isospin.</b> T = ' + p['weak_isospin']['T'] + ', T₃ = ' + p['weak_isospin']['T3'] + '. ' + p['weak_isospin']['note'] + '</p>'
    expert += '<p><b>Discovery.</b> ' + p['discovery'] + '</p><p><b>Where you meet it.</b> ' + p['everyday'] + '</p>'
    n = N('sm_' + id_, p['name'] + ' (' + p['symbol'] + ')', 'particle', summary, basics, deeper, expert, feats(p), cert, refs, kn,
          parts=parts, made_of=made_of, oq=oq, dyk=dyk, where=where, ext=pdg_ext(PDGNODE[id_]), viz=viz or massbars(id_))
    return n

STD_REFS = (('UP3', '11.3'), ('UP3', '11.5'))
LEP_REFS = (('UP3', '11.1'), ('UP3', '11.5'))
KN_Q = ['quarks_leptons', 'standard_model', 'qcd']
KN_L = ['quarks_leptons', 'standard_model']

# ---------------------------------------------------------------- quarks
pnode('up', 'The lighter of the two quarks that build protons and neutrons: two of them, with one down quark, make a proton.',
      '<p>Every proton in every atom you have ever touched contains <b>two up quarks</b> and one down quark; every neutron contains one up quark and two down quarks. The up quark has an electric charge of +⅔ (two thirds of a proton\'s charge, in units where the electron is −1).</p><p>You will never see one on its own: the strong force keeps quarks locked inside bigger particles. Its mass is tiny, about 2 MeV/c², so the two up quarks and the down quark together supply only about 1% of the mass of a proton. Most of the rest is energy in the strong force field.</p><p>As far as anyone has measured, an up quark has no inside: it is a point-like excitation of a quantum field.</p>',
      '<p><b>Why one number is not enough.</b> The quoted mass is the "current-quark mass" in the MS-bar scheme at 2 GeV. A confined quark has no scale to weigh it on, so the mass is a parameter whose value depends on the energy scale and the way you define it. The PDG notes that the up and down masses "are not without controversy".</p><p>Up and down quarks are the first <b>generation</b> of quarks. The up quark has a roughly twice-as-heavy partner, charm, and a far heavier one, top, with the same charge and spin.</p>',
      '<p>The up quark is a spin-½ colour triplet. The left-handed field forms a weak-isospin doublet with the down quark (the d′ of the CKM matrix); the right-handed field is a weak-isospin singlet with hypercharge 4/3 (left-handed doublet: 1/3), from Q = T₃ + Y/2 (PDG Electroweak Model review). It couples to gluons, the photon (Q = +2/3), the W (to d, s, b with strengths set by the CKM matrix), the Z and the Higgs field (Yukawa coupling ∝ mass).</p>',
      kn=KN_Q, refs=STD_REFS)
pnode('down', 'The slightly heavier of the two lightest quarks: one in a proton, two in a neutron.',
      '<p>A proton holds one down quark (and two up quarks); a neutron holds two down quarks (and one up quark). A down quark carries an electric charge of −⅓. Add up the charges: proton u+u+d = ⅔+⅔−⅓ = +1; neutron u+d+d = ⅔−⅓−⅓ = 0.</p><p>The down quark is a little heavier than the up quark (about 4.7 MeV/c² against 2.2), which is a large part of why the neutron is slightly heavier than the proton and why a lone neutron decays: one of its down quarks turns into an up quark.</p>',
      '<p><b>Beta decay.</b> When a neutron decays into a proton, an electron and an antineutrino, the quark-level event is d → u + W⁻, followed by W⁻ → e⁻ + ν̄ₑ. The W is "virtual" here: there is not enough energy to make a real one.</p><p>The quoted mass is the MS-bar "current-quark mass" at 2 GeV; there is no such thing as weighing a free down quark.</p>',
      '<p>Spin-½ colour triplet with Q = −1/3. The left-handed field is the lower member of the weak-isospin doublet with the up quark; right-handed hypercharge −2/3. The mass difference md − mu is small compared with the strong-interaction scale, so isospin symmetry (swapping u and d) is a good approximation, and the proton and neutron look almost the same to the strong force.</p>',
      kn=KN_Q, refs=STD_REFS)
pnode('strange', 'A heavier cousin of the down quark, found in kaons and in the first "strange" particles seen in cosmic rays.',
      '<p>The strange quark is like a down quark (charge −⅓) but about twenty times heavier. It does not appear in ordinary stable matter, but the cosmic rays that hit the atmosphere make strange particles all the time, and a proton contains short-lived strange–antistrange pairs as part of its quark sea.</p><p>It was named "strange" because the particles that contain it lived surprisingly long for their mass: they decay by the weak force, not the strong one.</p>',
      '<p>The quoted mass (92.9 MeV/c²) is MS-bar at 2 GeV. The strange quark is the heaviest quark that is still light compared with the scale of the strong force (about 1 GeV), so it blurs the line between "light" and "heavy" quarks.</p>',
      '<p>Second generation, down-type. It decays (inside hadrons) through s → u + W⁻ with a rate suppressed by the small CKM element Vus. Strangeness is conserved by the strong and electromagnetic forces but not by the weak force, which is why strange particles are produced in pairs but decay one at a time.</p>',
      kn=KN_Q, refs=STD_REFS)
pnode('charm', 'The second-generation partner of the up quark: about 600 times as heavy as it, found as the J/ψ in 1974.',
      '<p>The charm quark has the same electric charge as the up quark (+⅔) and the same spin, but a much larger mass, about 1.27 GeV/c², more than a proton. It does not exist in everyday matter. When two groups found a new particle, the J/ψ, in November 1974, it was a charm quark bound to an anti-charm quark.</p>',
      '<p>The mass is the MS-bar mass at its own scale, 1.2729 ± 0.0045 GeV (PDG 2026). In another scheme the same quark has a "pole mass" of about 1.65 GeV. The J/ψ is surprisingly long-lived for a particle of mass 3.097 GeV: its width is only 92.6 keV (PDG). That narrowness was a key clue.</p>',
      '<p>Charm decays via c → s + W⁺, dominated by the CKM element Vcs.</p>',
      kn=KN_Q, refs=STD_REFS)
pnode('bottom', 'The heavy cousin of the down and strange quarks, found as the Υ meson in 1977.',
      '<p>The bottom quark has charge −⅓ and a mass of about 4.2 GeV/c², over four times a proton. It was found as part of the Υ (upsilon) particle, a bottom–antibottom pair, at Fermilab in 1977. Its relatives, the B mesons, are made in huge numbers by "B factory" colliders because they decay in ways that differ for matter and antimatter.</p>',
      '<p>B mesons live about 1.5 picoseconds (1.5×10⁻¹² s), long enough to travel a fraction of a millimetre before decaying, which lets detectors see the decay point.</p>',
      '<p>Third generation, down-type. It decays via b → c + W⁻, suppressed by the small CKM element Vcb, which is why its lifetime is long for a particle of its mass. CP violation (a difference between matter and antimatter) is large in some B decays.</p>',
      kn=KN_Q, refs=STD_REFS)
pnode('top', 'The heaviest known elementary particle: about as heavy as a gold atom, but it lasts less than a trillionth of a trillionth of a second.',
      '<p>The top quark has charge +⅔ and a mass of about 172.6 GeV/c², about 184 times a proton and about 340,000 times an electron. It was found in 1995 at Fermilab. It decays so fast (about 5×10⁻²⁵ s) that it falls apart before it can bind with other quarks, so it is the only quark we study almost bare.</p>',
      '<p><b>Quark mass, three ways.</b> The PDG lists the top mass from direct measurements as 172.60 ± 0.27 GeV. It also lists a value from the cross-section of making top pairs interpreted as an MS-bar mass (162.5 +2.1/−1.5 GeV) and as a pole mass (172.1 ± 0.6 GeV). They are different definitions of the same quark, and the "direct" value comes from the kinematics of its decay products, which is as close to a weight as a quark gets.</p><p>The width, 1.42 GeV, is large, so the particle is very short-lived and hardly a "particle" in the everyday sense.</p>',
      '<p>The top\'s large mass means its Yukawa coupling to the Higgs field is close to 1, much stronger than any other fermion. Loops with top quarks dominate quantum corrections to the Higgs mass, which is part of the hierarchy problem. Its decay t → W b has a measured ratio Γ(Wb)/Γ(Wq) = 0.957 ± 0.034 (PDG), consistent with 1.</p>',
      kn=KN_Q, refs=STD_REFS)

# ---------------------------------------------------------------- leptons
pnode('electron', 'The light, negatively charged particle that surrounds every atomic nucleus and carries electric current.',
      '<p>The electron is the particle that makes chemistry: electrons arranged around nuclei decide how atoms bond, and electrons moving through wires are electric current. It has charge −1, a mass of 0.511 MeV/c² (1/1836 of a proton), and no known inside.</p><p>All electrons are exactly alike. In the Standard Model that is because they are all excitations of the same electron field.</p><p>The electron appears in the atom cards of this explorer: its cloud is a probability pattern, not a little ball in orbit.</p>',
      '<p>The electron is the lightest charged particle, so it cannot decay: charge conservation would forbid it. The PDG gives a lower bound on its lifetime of 6.6×10²⁸ years (90% confidence) for decay into a neutrino and a photon.</p><p>Its magnetic moment is one of the most precisely measured quantities in physics (see the PDG listing). Its mass comes from its coupling to the Higgs field; without that coupling an electron would have no mass and atoms would not hold together.</p>',
      '<p>Spin-½ Dirac fermion, member of the first-generation lepton doublet (νₑ, e)L, with the right-handed electron an SU(2) singlet of hypercharge −2. Couples to the photon (Q = −1), the Z, the W (to νₑ) and the Higgs (Yukawa y_e = √2 mₑ / v, with v ≈ 246 GeV from the PDG).</p>',
      kn=KN_L + ['quantum_orbitals'], refs=LEP_REFS + (('UP3', '8.3'),), where='place:atom')
pnode('muon', 'A heavier copy of the electron that decays in about two microseconds; cosmic-ray muons pass through you constantly.',
      '<p>The muon is a heavier twin of the electron: same charge (−1), same kind of behaviour, but about 207 times the mass. It lives for only 2.2 microseconds, yet muons made when cosmic rays hit the upper air arrive at ground level, roughly one per square centimetre per minute on a horizontal surface at sea level.</p>',
      '<p>They reach the ground because of <b>time dilation</b>: a muon moving at nearly the speed of light has its lifetime stretched in our frame. It decays almost always into an electron and two neutrinos (μ⁻ → e⁻ + ν̄ₑ + ν_μ). The muon is also at the centre of the "g−2" experiments: see the frontier note on the muon magnetic moment.</p>',
      '<p>Second-generation charged lepton. Its magnetic moment anomaly is measured to 127 parts per billion by Fermilab\'s final result (2025), and the PDG review has a dedicated section. As recorded in the frontier file, the 2025 Standard Model prediction agrees with the measurement; the earlier discrepancy has largely gone.</p>',
      kn=KN_L, refs=LEP_REFS, oq=['Why does a second, heavier copy of the electron exist? The theory does not say.'])
pnode('tau', 'The heaviest charged lepton: a copy of the electron about 3,500 times as heavy, living a third of a trillionth of a second.',
      '<p>The tau has the electron\'s charge (−1) but weighs about 3,477 times as much (1.777 GeV/c²), more than a proton. Because it is so heavy it can decay into hadrons as well as leptons. It lives about 2.9×10⁻¹³ seconds.</p>',
      '<p>Martin Perl\'s group found it at SLAC in 1975 by seeing electron–muon pairs with missing energy that no known process could explain. About 17% of tau decays are to an electron and two neutrinos, about 17% to a muon and two neutrinos, and the rest involve pions (PDG 2026).</p>',
      '<p>Third-generation charged lepton. Lepton universality is the statement that the electron, muon and tau couple identically to the W and Z apart from their masses. The PDG 2026 W branching fractions are 10.71 ± 0.16% (eν), 10.63 ± 0.15% (μν) and 11.38 ± 0.21% (τν); the tau value sits about 3 combined standard errors above the muon value, a spread the PDG lists and that is still being tested.</p>',
      kn=KN_L, refs=LEP_REFS)

def nu_viz():
    return {'type': 'bars', 'bars': [
        {'label': 'electron', 'value': 5.1099895e5, 'color': 'dim'},
        {'label': 'KATRIN limit (νₑ)', 'value': 0.45, 'color': 'gold'},
        {'label': 'cosmic limit (sum)', 'value': 0.064, 'color': 'pink'},
        {'label': 'heaviest ν (min)', 'value': 0.0494, 'color': 'accent'}], 'logy': True, 'ylabel': 'eV (log scale)',
        'caption': 'Neutrino masses are not known. These are bounds, not measurements: an upper limit from KATRIN, an upper limit on the sum from cosmology, and a lower limit from oscillations (about 0.049 eV for the heaviest of the three). The electron\'s mass is shown for scale.'}

NU_DEEP = ('<p><b>What is known.</b> Neutrinos change flavour as they travel (oscillation), which proves they have mass and that the flavour states are mixtures of three mass states. Oscillations measure only differences of squared masses: Δm²₂₁ = (7.60 ± 0.17)×10⁻⁵ eV² and |Δm²₃₂| ≈ 2.4–2.5×10⁻³ eV² (PDG 2026; the sign, normal or inverted ordering, is not yet known).</p>'
           '<p><b>Upper bounds.</b> KATRIN\'s 2025 result: the effective electron-antineutrino mass is below 0.45 eV at 90% confidence (see frontier note <i>katrin_neutrino</i>). From cosmology, the sum of the three masses is below about 0.064 eV at 95% confidence for the standard cosmological model with DESI DR2 data (listed in the PDG 2026), and the bound depends on the cosmological model assumed. From oscillations alone the sum is at least about 0.058 eV (normal) or 0.10 eV (inverted), by my arithmetic from the PDG numbers.</p>'
           '<p><b>Open questions.</b> The absolute mass scale, the ordering, whether neutrinos are their own antiparticles, and whether the CP-violating phase is nonzero.</p>')
for nid, nm, ptn in (('nu_e', 'electron neutrino', 'electron'), ('nu_mu', 'muon neutrino', 'muon'), ('nu_tau', 'tau neutrino', 'tau lepton')):
    pnode(nid, 'A nearly massless, uncharged particle that passes through the Earth almost untouched; its mass is still unknown.',
          '<p>The %s is made alongside a %s in weak decays. It has no electric charge and feels only the weak force (and gravity), so it almost never interacts with matter. About 6×10¹⁰ solar neutrinos of the commonest kind pass through every square centimetre of you each second (PDG), unnoticed.</p><p>Neutrinos have mass, but it is so small that no experiment has yet weighed one: only upper bounds exist.</p>' % (nm, ptn),
          NU_DEEP,
          '<p>Three mass states ν₁, ν₂, ν₃ mix through the PMNS matrix with measured angles sin²θ₁₂ = 0.307 ± 0.012, sin²θ₁₃ = 0.0217 ± 0.0007 and sin²θ₂₃ ≈ 0.53 (PDG 2026, normal ordering). Only left-handed neutrinos (and right-handed antineutrinos) have been seen. A neutrino mass term needs either right-handed partners (Dirac mass) or a lepton-number-violating Majorana term; which is realised is unknown. Neutrinoless double-beta decay is the main test of the second.</p>',
          cert='C2', kn=['neutrinos'] + KN_L, refs=LEP_REFS + (('AST', '16.1'),), viz=nu_viz(),
          oq=['What are the neutrino masses (only bounds exist)?', 'Is the mass ordering normal or inverted?', 'Is the neutrino its own antiparticle (Majorana) or not (Dirac)?'])

# ---------------------------------------------------------------- bosons
pnode('gluon', 'The carrier of the strong force: it glues quarks together, and it carries the colour charge it acts on.',
      '<p>A gluon is a particle of the strong force, the "glue" that binds quarks inside protons and neutrons. It has no mass and no electric charge, but it does carry colour charge (the strong force\'s kind of charge). Because gluons carry colour themselves, they pull on each other too, which is why the strong force acts very differently from electromagnetism and why quarks can never be pulled apart.</p><p>Most of the proton\'s mass is not the quarks: it is the energy of the gluon field holding them together.</p>',
      '<p>There are <b>eight</b> gluons (eight colour–anticolour combinations). A single gluon is never seen on its own; the first evidence came in 1979 from collision events at the PETRA collider in Hamburg in which a quark and antiquark flew out with a third spray (jet) of particles, a gluon, radiated from one of them.</p><p>Lattice calculations indicate gluons carry about half of the proton\'s momentum (51% in a 2022 calculation at 2 GeV).</p>',
      '<p>Massless spin-1 gauge bosons of SU(3) colour. The theory has self-interaction vertices (three and four gluons) with colour factor C_A = 3; the PDG notes a measured world average C_A = 2.89 ± 0.03 (stat) ± 0.21 (syst), consistent with the SU(3) value. Whether the gluon field has a mass gap and confines colour is the subject of a Clay Millennium Prize problem (Yang–Mills existence and mass gap), unsolved in rigorous mathematics even though lattice calculations support it.</p>',
      kn=['qcd', 'standard_model'], refs=STD_REFS, viz={'type': 'blocks', 'flow': True, 'nodes': [
          {'id': 'q1', 'label': 'quark (red)', 'x': 5, 'y': 50}, {'id': 'g', 'label': 'gluon (red + anti-green)', 'x': 50, 'y': 15, 'color': 'gold'},
          {'id': 'q2', 'label': 'quark (green)', 'x': 95, 'y': 50}], 'edges': [{'from': 'q1', 'to': 'g', 'label': 'emits'}, {'from': 'g', 'to': 'q2', 'label': 'absorbed'}],
          'caption': 'Schematic bookkeeping of one gluon exchange. The "colours" are only labels for three kinds of charge; a quark that emits a gluon changes colour while the colour total is kept. Nothing here is a picture of a path.'}, cert='C1',
      oq=['Why does the theory confine colour at all, and can that be proved mathematically?'])
pnode('photon', 'The particle of light, and the carrier of the electromagnetic force.',
      '<p>A photon is the smallest possible bundle of light, and also of any electric or magnetic force between charged particles. It has no mass, no charge, and always moves at the speed of light. Sunlight on the park is a stream of photons; so are radio waves and X-rays, with different energies.</p>',
      '<p>The PDG limit on a photon mass is below 10⁻¹⁸ eV, and on its charge below 10⁻⁴⁶ of an electron\'s. It is its own antiparticle, and it carries spin 1 (two polarisations, because it is massless). A photon\'s energy is E = hf: radio photons have very little, gamma rays enormous amounts.</p>',
      '<p>Gauge boson of the U(1) electromagnetic symmetry that survives after electroweak symmetry breaking; it is a mixture of the SU(2) boson W³ and the hypercharge boson B. Quantum electrodynamics (QED), the quantum theory of photons and charges, predicts the electron magnetic moment to parts per trillion.</p>',
      kn=['standard_model', 'photon_node', 'electromagnetic_waves'], refs=(('UP3', '11.5'), ('CPH', '29.4')), where='place:park',
      viz={'type': 'blocks', 'flow': True, 'nodes': [{'id': 'a', 'label': 'electron', 'x': 5, 'y': 50}, {'id': 'p', 'label': 'photon', 'x': 50, 'y': 50, 'color': 'gold'}, {'id': 'b', 'label': 'electron', 'x': 95, 'y': 50}],
           'edges': [{'from': 'a', 'to': 'p'}, {'from': 'p', 'to': 'b'}], 'caption': 'Bookkeeping for one photon exchange between two electrons. The line is not a path the photon takes; it records an interaction in a calculation.'})
pnode('w_boson', 'A heavy carrier of the weak force that changes one kind of particle into another; it is why the Sun shines slowly.',
      '<p>The W boson (W⁺ and W⁻) carries the weak force, the one responsible for radioactive beta decay and for turning protons into neutrons in the Sun\'s core. It is charged (±1), and heavy: about 86 times a proton. Its heaviness means the weak force reaches only about 2×10⁻¹⁸ m, so it is "weak" in the sense of being short-ranged and rare.</p>',
      '<p>The W changes quark flavour (up ↔ down, for example) and turns charged leptons into their neutrinos. Its mass, 80.3625 ± 0.0077 GeV, is the world average of LHC and Tevatron measurements (PDG 2026). It decays within about 3×10⁻²⁵ s: roughly two thirds to quark pairs (67.41%) and the rest to a lepton and its neutrino (10.86% for each of e, μ, τ).</p>',
      '<p>Spin-1 gauge boson of the SU(2) weak-isospin symmetry; it acquires mass through the Higgs mechanism with m_W = g v / 2 (tree level). The W couples only to left-handed fermions (and right-handed antifermions): the weak force violates mirror symmetry maximally.</p>',
      kn=['weak_force_note', 'standard_model'], refs=STD_REFS + (('AST', '16.1'),), where=None)
pnode('z_boson', 'The neutral heavy carrier of the weak force; its decays showed that there are three light kinds of neutrino.',
      '<p>The Z boson is the electrically neutral partner of the W. It makes the weak force act without changing what a particle is: a neutrino bouncing off matter through a Z leaves as the same neutrino. It weighs about 97 protons and lives about 2.6×10⁻²⁵ s.</p>',
      '<p>Mass 91.1879 ± 0.0020 GeV; decay width 2.4955 ± 0.0023 GeV (PDG 2026). About 70% of Z decays are to quarks, about 20% to neutrino pairs you cannot see, and about 10% to charged lepton pairs. The invisible fraction, measured at the LEP collider at CERN, fits three light kinds of neutrino.</p>',
      '<p>A mixture of the SU(2) boson W³ and hypercharge boson B, with mixing angle θ_W. Its coupling to a fermion is set by T₃ − Q sin²θ_W (vector) and T₃ (axial) (PDG Electroweak Model review, eq. 10.7).</p>',
      kn=['weak_force_note', 'standard_model'], refs=STD_REFS)
pnode('higgs', 'A ripple in the Higgs field, the field that gives the other fundamental particles their mass.',
      '<p>The Higgs boson is the particle you get when you disturb the <b>Higgs field</b>, a field that has a nonzero value everywhere in the universe. Particles that interact with that field acquire a rest mass; the stronger the interaction, the heavier the particle. The Higgs boson itself weighs about 125 GeV/c², about 133 proton masses, and lasts only about 2×10⁻²² s.</p><p>It was announced on 4 July 2012 by the ATLAS and CMS experiments at CERN.</p>',
      '<p>The Higgs gives mass to the electron, the quarks, and the W and Z. It does <b>not</b> explain most of the mass you weigh: about 99% of a proton\'s mass is the energy of the strong field, not Higgs-given quark masses (see the card on where the proton\'s mass comes from).</p><p>Its decays: to bottom quarks about 53%, W pairs about 26%, tau pairs about 6%, Z pairs about 3%, and two photons about 0.25% (PDG 2026 averages; large uncertainties on the larger rates).</p>',
      '<p>A neutral spin-0 scalar: the remnant of the complex SU(2) doublet φ after electroweak symmetry breaking with a vacuum value v ≈ 246 GeV (PDG). The couplings of the Higgs to other particles are proportional to their masses and are being measured at the LHC; so far they agree with the Standard Model within the current precision. The Higgs width, 3.0 (+1.5, −0.7) MeV, is not directly measured; it is inferred from other measurements.</p>',
      cert='C2', kn=['higgs_mechanism', 'standard_model'], refs=STD_REFS,
      oq=['Is the Higgs boson elementary, or made of something? (Not known; no sign of structure.)', 'Why is its mass so much lighter than quantum corrections would naturally make it (the hierarchy problem)?'])
