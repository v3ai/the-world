"""Charge, lepton number and baryon number of the particles that appear in decays (used by the checker and the nodes)."""
from fractions import Fraction as F
QN = {}
def _a(name, q, L, B): QN[name] = (F(q), F(L), F(B))
for flav in ('e', 'mu', 'tau'):
    _a(flav + '-', -1, 1, 0); _a(flav + '+', 1, -1, 0); _a('nu_' + flav, 0, 1, 0); _a('nubar_' + flav, 0, -1, 0)
for n, q in (('u', F(2, 3)), ('c', F(2, 3)), ('t', F(2, 3)), ('d', F(-1, 3)), ('s', F(-1, 3)), ('b', F(-1, 3))):
    _a(n, q, 0, F(1, 3)); _a(n + 'bar', -q, 0, F(-1, 3))
for n in ('gamma', 'g', 'Z', 'H', 'pi0', 'jpsi', 'upsilon'): _a(n, 0, 0, 0)
_a('W+', 1, 0, 0); _a('W-', -1, 0, 0); _a('pi+', 1, 0, 0); _a('pi-', -1, 0, 0); _a('k+', 1, 0, 0); _a('k-', -1, 0, 0)
_a('p', 1, 0, 1); _a('n', 0, 0, 1); _a('lambda', 0, 0, 1); _a('xi0', 0, 0, 1); _a('omega-', -1, 0, 1); _a('delta++', 2, 0, 1)
_a('nu', 0, 1, 0); _a('nubar', 0, -1, 0); _a('lepton+', 1, -1, 0); _a('lepton-', -1, 1, 0)
UNBALANCEABLE = {'hadrons'}

def totals(names):
    q = L = B = F(0)
    for n in names:
        a, b, c = QN[n]; q += a; L += b; B += c
    return q, L, B
