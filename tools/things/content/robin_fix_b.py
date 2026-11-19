# Further corrections to the robin's cards (feathers, plumage, bill, keratin, tags, textbook references).
# Imported by robin_nodes.py after robin_fix_a.py. See notes/review_fixes_pondrobin.md for every source.
from robin_fix_a import *

def sub(id, layer, old, new):
    n = [x for x in NODES if x['id'] == id][0]
    d, key = (n['layers'], layer) if layer in ('basics', 'deeper', 'expert') else (n, layer)
    assert old in d[key], (id, layer, old[:50])
    d[key] = d[key].replace(old, new)

# ---- feathers
fix('robin_sec', deeper='The secondaries are attached to the ulna and stay close together in flight, so that together they make the curved airfoil shape of the wing. They tend to be shorter and broader than the primaries, with blunter tips.',
    expert='In passerines the secondaries number nine counting the tertials; other birds range from six (hummingbirds) to as many as 40 (some albatrosses). Some authorities count only the three innermost, shorter and more symmetrical feathers as tertials; the model draws six secondaries and three tertials.')
fix('robin_alula', cert='C2',
    deeper='The alula is carried on the first digit of the hand, the "thumb" (which digits the bird hand keeps is debated: see the finger bones card). It is not counted as a true flight feather, but it is an aid to slow flight.',
    expert='The comparison with a leading-edge slat on an aircraft wing is an analogy for the effect, not a measurement on a robin. The number of alula feathers varies by species; three are drawn.')
sub('robin_prim', 'deeper', 'so the vane is a smooth surface that air cannot pass through.', 'so the vane is a smooth sheet that holds back most of the air.')
sub('robin_feather_scene', 'basics', 'so the vane is a smooth sheet that air cannot go through.', 'so the vane is a smooth sheet that holds back most of the air.')

# ---- plumage
sub('robin_back', 'basics', 'The back is olive-brown: camouflage when the robin is on the ground or in a hedge.', 'The back is olive-brown, a colour that probably helps hide the robin on the ground or in a hedge.')
fix('robin_back', cert='C1')

# ---- bill and keratin
fix('robin_bill',
    deeper='The horn sheath (the rhamphotheca) is made of keratin, which is dead material, but it grows continuously from living tissue at the base of each half of the bill and wears away at the tip. Inside, the upper jaw is a slender bone core (the premaxilla), and the lower jaw hinges at the quadrate bone. The nostrils open on the top of the upper mandible near its base.',
    expert='The sheath is beta-keratin, like feathers and claws. All living birds can move the upper jaw relative to the braincase (cranial kinesis), most obviously in parrots; how far a robin\'s bill flexes is not measured here.',
    ext=[WR, WBA, KINESIS], related=['robin_keratin', 'robin_upper_jaw'])
fix('robin_keratin',
    deeper='Beta-keratins are found only in birds and reptiles. In feathers, beaks and claws they are formed mainly as beta-pleated sheets, stabilised by disulfide bridges between cysteine residues. Birds also have alpha-keratins, the family that makes up hair and horn in mammals, for example in parts of the skin. Because a bridge cannot be undone without a chemical reaction, a feather is a long-lived, heat-stable material.',
    summary='Feathers, beak and claws are made mostly of beta-keratin, a tough protein held together by sulfur bridges between cysteine units.')

# ---- body temperature
fix('robin', dyk='Birds in general run at about 41 °C when active, a few degrees above us; that figure is an average over many species and was not measured on robins.')
fix('robin_temperature', summary='Birds run hotter than mammals: about 41 °C when active on average, and a small songbird\'s heart beats several hundred times a minute.',
    facts=[['Body temperature, resting phase', '≈ 38.5 °C (all birds; mean of 203)'], ['Active', '≈ 41.0 °C (all birds; mean of 724)'], ['High activity', '≈ 43.9 °C (all birds; mean of 74)'], ['Heart rate, spotted antbird (≈ 17 g)', '260 to 824 beats/min, mean 492 (Steiger et al. 2009)']],
    openq=[])
sub('robin_temperature', 'expert', 'The antbird numbers are for another species in a rain forest, not a measurement on robins.', 'The antbird numbers are for another species in a rain forest, and the temperatures are means over many bird species: neither is a measurement on robins, and published heart rates for passerines are not collected on this card.')
sub('robin_temperature', 'deeper', 'The animation of the heart in this model is an illustration with no real rate. For scale, a ruby-throated hummingbird\'s heart can beat up to 1,200 times a minute.', 'The animation of the heart in this model is an illustration with no real rate. For scale, a hummingbird\'s heart can beat well over a thousand times a minute (a figure usually quoted for the ruby-throated hummingbird).')

# ---- textbook references that did not fit
SK = [n for n in NODES if n['refs'] == [R_SKEL]]
for n in SK: n['refs'] = [R_BONE]
fix('robin_pigment', refs=[])
fix('robin_lifespan', refs=[R('45.2', '45-2-life-histories-and-natural-selection')])
