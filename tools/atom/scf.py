#!/usr/bin/env python3
"""Spherical, non-relativistic, self-consistent central-field atom (Hartree-Fock-Slater type).

Solves  [-1/2 d^2/dr^2 + l(l+1)/(2 r^2) + V(r)] P_nl = e_nl P_nl  for every occupied subshell with the
configuration-averaged (spherical) density, in atomic units (hartree, bohr), on a logarithmic grid.

  V(r) = -Z/r + V_Hartree[rho](r) + V_x[rho](r)
  V_x  = -(3 alpha/2) (3 rho / pi)^(1/3)          (alpha = 2/3 is the Kohn-Sham / Gaspar exchange; alpha = 1 Slater's)
  Latter tail correction (optional, OFF in the published data: it made open p shells 15-20 % too big in tests against
  Hartree-Fock): where V(r) would rise above -1/r it is set to -1/r.
  One-electron atoms (hydrogen) are solved in the bare Coulomb field: a lone electron does not repel itself, and the local
  exchange potential would otherwise leave a self-interaction error (+15 % in <r>); the result is exactly the hydrogen 1s.

Output per subshell: <r>, r_max (outermost maximum of the radial density P^2) and the orbital energy. No relativity, no correlation, no spin polarisation: stated wherever the numbers are shown.
"""
import numpy as np
from scipy.linalg import eigh_tridiagonal

LETTER = 'spdfg'

def _solve(Z, occ, N=2400, rmax=80.0, alpha=2/3, latter=False, iters=500, mix=0.35, tol=1e-9, interact=True):
    """occ: {(n, l): electrons}. Returns {(n,l): dict(r_mean, r_max, e)} and a convergence record."""
    nel = sum(occ.values())
    xmin, xmax = np.log(min(1e-3, 0.03 / Z)), np.log(rmax)
    x = np.linspace(xmin, xmax, N); h = x[1] - x[0]; r = np.exp(x)
    # start: Thomas-Fermi-like screened charge
    rho = nel * (Z ** (1 / 3)) ** 3 * np.exp(-Z ** (1 / 3) * r) / (8 * np.pi) * 1.0
    rho *= nel / (4 * np.pi * np.sum(r ** 3 * rho) * h)
    Vold = None; res = {}; err = 1.0; rec = {}
    byl = {}
    for (n, l), f in occ.items(): byl.setdefault(l, []).append((n, f))
    for it in range(iters):
        q = 4 * np.pi * r ** 3 * rho                  # charge per dx
        Qin = np.cumsum(q) * h - 0.5 * q * h
        w = 4 * np.pi * r ** 2 * rho
        Qout = (np.cumsum(w[::-1]) * h)[::-1] - 0.5 * w * h
        VH = Qin / r + Qout
        Vx = -1.5 * alpha * (3 * np.maximum(rho, 0) / np.pi) ** (1 / 3)
        V = -Z / r + VH + Vx
        if not interact: V = -Z / r + 0 * VH        # test mode: bare Coulomb field, must reproduce hydrogenic values
        elif latter:
            V = np.minimum(V, -(Z - nel + 1) / r)
        if Vold is not None: V = (1 - mix) * Vold + mix * V
        Vold = V
        newrho = np.zeros(N); res = {}
        for l, lst in byl.items():
            lst = sorted(lst)
            # (-1/2 d2/dx2 + r^2 (V - e) + (l+1/2)^2/2) f = 0, f = P/sqrt(r); symmetrise with B = r^2
            d = (1.0 / h ** 2 + r ** 2 * V + (l + 0.5) ** 2 / 2) / r ** 2
            d[0] += -0.5 / h ** 2 * np.exp(-(l + 0.5) * h) / r[0] ** 2     # inner boundary: f ~ r^(l+1/2) continues below r_min
            o = -0.5 / h ** 2 / (r[:-1] * r[1:])
            ev, vec = eigh_tridiagonal(d, o, select='i', select_range=(0, len(lst) - 1))
            for k, (n, f) in enumerate(lst):
                g = vec[:, k]; fv = g / r                  # f(x)
                P2x = r ** 2 * fv ** 2                    # P^2 dr = r^2 f^2 dx  (per dx)
                P2x /= np.sum(P2x) * h
                P2 = P2x / r                              # radial density per unit r
                res[(n, l)] = dict(e=float(ev[k]), r_mean=float(np.sum(P2x * r) * h), P2=P2)
                newrho += f * P2 / (4 * np.pi * r ** 2)
        err = float(np.max(np.abs(newrho - rho) * r ** 3) / max(1e-30, np.max(rho * r ** 3)))
        rho = (1 - mix) * rho + mix * newrho if it < 60 else newrho * mix + rho * (1 - mix)
        if err < tol and it > 20: break
    out = {}
    for (n, l), v in res.items():
        P2 = v['P2']
        # outermost local maximum of P2 (above 0.1% of peak, to skip numerical wiggles)
        pk = np.where((P2[1:-1] > P2[:-2]) & (P2[1:-1] >= P2[2:]) & (P2[1:-1] > 0.05 * P2.max()))[0] + 1
        i = pk[-1]
        # parabolic refinement in x
        a, b, c = np.log(P2[i - 1] + 1e-300), np.log(P2[i] + 1e-300), np.log(P2[i + 1] + 1e-300)
        dx = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0
        out[(n, l)] = dict(r_mean=v['r_mean'], r_max=float(np.exp(x[i] + dx * h)), e=v['e'])
    return out, dict(iterations=it + 1, residual=err, grid_points=N, r_min=float(r[0]), r_max=float(r[-1]),
                     n_electrons=nel)

def solve(Z, occ, **kw):
    """_solve with automatic reduction of the mixing parameter when the iteration does not converge."""
    if sum(occ.values()) == 1: kw = dict(kw, interact=False)
    for mix in (0.35, 0.2, 0.1, 0.05, 0.025):
        out, rec = _solve(Z, occ, mix=mix, iters=500, **kw)
        if rec['residual'] < 1e-7: break
    rec['mixing'] = mix
    return out, rec

if __name__ == '__main__':
    import sys, json, os
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    E = {e['symbol']: e for e in json.load(open(os.path.join(root, 'data/elements.json')))}
    for sym in sys.argv[1:]:
        e = E[sym]
        occ = {(int(k[0]), LETTER.index(k[1])): v for k, v in e['subshells'].items()}
        res, rec = solve(e['Z'], occ)
        print(sym, rec)
        for (n, l), v in sorted(res.items()):
            print(f"  {n}{LETTER[l]}  <r>={v['r_mean']:.4f}  rmax={v['r_max']:.4f}  e={v['e']:.4f}")

