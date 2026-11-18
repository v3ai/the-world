from lib import *
import math

# ---------- PLANETS ----------
plot('solar_system_formation', 'In the young Sun\'s disc, temperature fell with distance. Beyond the "frost line" (~150 K, near 3 AU) ices could condense, so giants grew big cores there; inside it only rock and metal survived. A simple disc model.',
     [F('280*x^-0.5*L^0.25', 'disc temperature', 'accent')], x=[0.3, 40], y=[20, 600], logx=True, logy=True, xlabel='distance from the Sun (AU)', ylabel='temperature (K)',
     hlines=[dict(y=150, label='frost line 150 K', color='gold')], params=[P('L', 'young-Sun brightness', 0.5, 2, 1, '×')],
     points=[dict(x=1, y='280*L^0.25', label='Earth', color='green'), dict(x=5.2, y='280*5.2^-0.5*L^0.25', label='Jupiter', color='pink'), dict(x=30, y='280*30^-0.5*L^0.25', label='Neptune', color='pink')],
     readouts=[R('frost line distance', '(280/150)^2*sqrt(L)', 'AU')])
S['solar_system_formation']['readouts'] = [R('frost line distance', '3.48*sqrt(L)', 'AU')]

pts = [(0.107, 0.532, 'Mars', 'orange'), (1, 1, 'Earth', 'green'), (17.1, 3.88, 'Neptune', 'accent'), (14.5, 4.01, 'Uranus', 'accent'), (95.2, 9.45, 'Saturn', 'gold'), (317.8, 11.2, 'Jupiter', 'gold')]
plot('planet_types', 'Rocky planets (Mars, Earth) follow R ∝ M^0.27 and are dense; ice giants (Neptune, Uranus) are a few times bigger; gas giants (Saturn, Jupiter) stop growing in radius even as mass climbs past 300 Earth masses.',
     [F('x^0.27', 'rocky relation', 'dim', dash=True)], x=[0.05, 500], y=[0.3, 20], logx=True, logy=True, xlabel='mass (Earth masses)', ylabel='radius (Earth radii)', points=[dict(x=m, y=r, label=n, color=c) for m, r, n, c in pts])

hub('moon_origin_node', 'The leading idea is a giant impact with a Mars-sized body (Theia), but the Moon\'s Earth-like isotopes are hard to explain, so variants compete.',
    'Moon formation (open)', ['Giant impact (canonical)', 'Fast-spinning Earth', 'Many small impacts', 'Synestia (vaporised disc)'], colors=['accent'] * 4, aspect=0.8)

bars('earth_water_origin', 'The deuterium-to-hydrogen ratio fingerprints water. Earth\'s oceans match carbonaceous meteorites (asteroids) better than most comets or the original solar gas, but the source is not settled. Values approximate (×10⁻⁶).',
     [('solar nebula', 21), ('Earth oceans', 156, 'accent'), ('carbonaceous chondrites', 140), ('comet 67P', 530, 'pink'), ('comet Halley', 310, 'pink')], ylabel='D/H (×10⁻⁶)')
S['earth_water_origin']['bars'][2]['label'] = 'chondrites'

plot('moons_tidal', 'A moon closer than the Roche limit, d = 2.44 R·(ρ_planet/ρ_moon)^⅓, is torn apart by tides; that is where rings sit. Saturn\'s rings (inside ~2.3 R_S) fit the limit for icy material.',
     [F('2.44*(rho/x)^(1/3)', 'Roche limit', 'accent')], x=[500, 5000], y=[0, 4], xlabel='satellite density (kg/m³)', ylabel='Roche limit (planet radii)',
     params=[P('rho', 'planet density', 600, 5500, 687, 'kg/m³')], points=[dict(x=920, y='2.44*(rho/920)^(1/3)', label='icy moon', color='pink')], readouts=[R('limit for icy material', '2.44*(rho/920)^(1/3)', 'planet radii')])

plot('small_bodies', 'Big impacts are rare, small ones frequent: the interval between impacts grows roughly as D^2.2. A 20 m asteroid (Chelyabinsk, 2013) arrives every few decades; a 10 km one (dinosaur-killer) every ~100 million years. Approximate.',
     [F('0.1*x^2.2', 'average years between impacts', 'accent')], x=[1, 10000], y=[0.01, 1e10], logx=True, logy=True, xlabel='asteroid diameter (m)', ylabel='years between impacts',
     params=[P('D', 'diameter', 1, 10000, 20, 'm')], points=[dict(x='D', y='0.1*D^2.2')], readouts=[R('interval', '0.1*D^2.2', 'years'), R('impact energy (3000 kg/m³, 20 km/s)', '0.5*3.1416/6*D^3*3000*4e8/4.184e15', 'Mt TNT')])

plot('exoplanets', 'When a planet crosses its star the starlight dips by (R_planet/R_star)². Earth-size planets dim a Sun-like star by <0.01%; Jupiter-size ones by 1%, so big planets are easiest to find.',
     [F('1-(0.009168*Rp)^2/(1+exp((abs(x)-1.5)*6))', 'star brightness', 'accent')], x=[-4, 4], xlabel='hours from mid-transit', ylabel='relative brightness',
     params=[P('Rp', 'planet radius', 1, 13, 11.2, 'R⊕')], readouts=[R('dip depth', '100*(0.009168*Rp)^2', '%')])

plot('habitability', 'The "habitable zone" is the band where a planet could have liquid water. Brighter, heavier stars have it farther out. Whether other conditions make a planet habitable is unknown (we have a single example). Boundaries are model-dependent.',
     [F('x^2/1.049', 'inner edge', 'pink'), F('x^2/0.6', 'outer edge', 'accent')], x=[0.5, 1.5], y=[0, 4], xlabel='star mass (solar masses)', ylabel='distance from star (AU)',
     params=[P('m', 'star mass', 0.5, 1.5, 1, 'M☉')], points=[dict(x=1, y=1, label='Earth', color='green')],
     readouts=[R('habitable zone from', 'm^2/1.049', 'AU'), R('to', 'm^2/0.6', 'AU')])
S['habitability']['readouts'] = [R('zone starts at', 'm^2/1.049', 'AU'), R('zone ends at', 'm^2/0.6', 'AU')]

# ---------- STARS ----------
geo('sun_structure', 'The Sun\'s layers: a core (to 0.25 R) where fusion makes energy at ~15 million K, a radiative zone where light random-walks for ~100,000 years, a convective zone of boiling plasma, and the glowing photosphere at 5800 K.',
    [-1.5, 1.5, -1.2, 1.2],
    [C(0, 0, 1, 'gold', 'gold', alpha=0.15, width=3), C(0, 0, 0.7, 'orange', 'orange', alpha=0.18), C(0, 0, 0.25, 'red', 'red', alpha=0.4),
     T(0, 0, 'core\n15 MK', 'white', 10), T(0, 0.48, 'radiative zone', 'white', 10), T(0, 0.85, 'convection zone', 'white', 10), T(0, -1.1, 'photosphere 5800 K', 'gold', 10), T(0, -0.5, '~2 MK at 0.7 R', 'dim', 9)], aspect=0.8)
S['sun_structure']['shapes'][3]['text'] = 'core 15 MK'

blocks('hydrostatic_balance', 'A star is held up by a thermostat: gravity squeezes the core, raising temperature and fusion; the heat raises pressure, which pushes back. If fusion speeds up the star expands and cools, slowing fusion again (negative feedback).',
       [('g', 'Gravity squeezes', 12, 20, 'pink'), ('t', 'Core hotter', 12, 80, 'gold'), ('f', 'More fusion', 50, 80, 'gold'), ('p', 'More pressure', 88, 80, 'accent'), ('e', 'Star expands, cools', 88, 20, 'accent')],
       [('g', 't'), ('t', 'f'), ('f', 'p'), ('p', 'e'), ('e', 'g', '− slows fusion', True)], aspect=0.62)

hr = [(5772, 1, 'Sun', 'gold'), (9940, 25, 'Sirius A', 'accent'), (3042, 0.0017, 'Proxima', 'pink'), (25200, 0.056, 'Sirius B', 'blue'), (3600, 1.3e5, 'Betelgeuse', 'red'), (12100, 1.2e5, 'Rigel', 'blue')]
plot('stellar_spectra', 'The Hertzsprung–Russell diagram plots luminosity against temperature. Luminosity follows L = R²(T/5772)⁴, so dashed lines are stars of equal radius. Slide a star\'s temperature and radius and watch it move; real stars cluster on a diagonal "main sequence". (Hot is to the right here.)',
     [F('0.0001*(x/5772)^4', 'R = 0.01 R☉', 'dim', dash=True), F('(x/5772)^4', 'R = 1 R☉', 'dim', dash=True), F('10000*(x/5772)^4', 'R = 100 R☉', 'dim', dash=True)],
     x=[2500, 30000], y=[1e-4, 1e6], logx=True, logy=True, xlabel='surface temperature (K)', ylabel='luminosity (solar units)',
     points=[dict(x=t, y=l, label=n, color=c, r=3) for t, l, n, c in hr] + [dict(x='T', y='R^2*(T/5772)^4', label='your star', color='white', r=6)],
     params=[P('T', 'temperature', 2500, 30000, 5772, 'K'), P('R', 'radius', 0.01, 100, 1, 'R☉')], readouts=[R('luminosity', 'R^2*(T/5772)^4', 'L☉')])
S['stellar_spectra']['fns'][0]['f'] = '0.0001*(x/5772)^4'
S['stellar_spectra']['fns'][2]['f'] = '10000*(x/5772)^4'
S['stellar_spectra']['params'][1] = P('R', 'radius', 0.01, 100, 1, 'R☉')

plot('star_formation', 'A gas cloud collapses when it exceeds the Jeans mass, M_J ∝ T^1.5/√n. Cold, dense clouds (10 K) can collapse into stars of a few solar masses; warm, thin gas cannot. Set the cloud temperature.',
     [F('5.4*(T/10)^1.5*(x/1e4)^-0.5', 'Jeans mass', 'accent')], x=[1e2, 1e7], y=[0.01, 1e4], logx=True, logy=True, xlabel='gas density (molecules per cm³)', ylabel='mass needed to collapse (M☉)',
     params=[P('T', 'cloud temperature', 10, 100, 10, 'K')], readouts=[R('Jeans mass at 10⁴ cm⁻³', '5.4*(T/10)^1.5', 'M☉')])

plot('stellar_evolution', 'Heavier stars burn fuel much faster: lifetime ≈ 10 billion years × (M/M☉)^−2.5. The Sun lasts ~10 Gyr; a 25 M☉ star only ~30 million years, while tiny red dwarfs outlast the current age of the universe.',
     [F('10*x^-2.5', 'main-sequence lifetime (Gyr)', 'accent')], x=[0.1, 100], y=[0.001, 10000], logx=True, logy=True, xlabel='stellar mass (solar masses)', ylabel='lifetime (billion years)',
     params=[P('m', 'mass', 0.1, 100, 1, 'M☉')], points=[dict(x='m', y='10*m^-2.5', label='{10*m^-2.5} Gyr'), dict(x=1, y=10, label='Sun', color='gold')], readouts=[R('lifetime', '10*m^-2.5', 'Gyr')])

plot('stellar_death', 'White dwarfs are supported by electron pressure, and heavier ones are smaller: radius shrinks to zero at the Chandrasekhar mass, 1.44 M☉. Beyond it the star collapses to a neutron star or black hole (often via a supernova).',
     [F('8900*(x/0.6)^(-1/3)*sqrt(1-(x/1.44)^(4/3))/0.83', 'white dwarf radius', 'accent')], x=[0.2, 1.44], y=[0, 20000], xlabel='white dwarf mass (solar masses)', ylabel='radius (km)',
     vlines=[dict(x=1.44, label='Chandrasekhar limit', color='gold')], params=[P('m', 'mass', 0.2, 1.43, 0.6, 'M☉')], points=[dict(x='m', y='8900*(m/0.6)^(-1/3)*sqrt(1-(m/1.44)^(4/3))/0.83')],
     readouts=[R('radius', '8900*(m/0.6)^(-1/3)*sqrt(1-(m/1.44)^(4/3))/0.83', 'km'), R('compare Earth radius', '6371', 'km')])

bars('nucleosynthesis_stars', 'Cosmic abundance of some elements (atoms per 10¹² hydrogen atoms, Sun). H and He came from the Big Bang; carbon to iron from stars; gold and uranium from rarer, more violent events. Exact sources of heavy elements are still being worked out.',
     [('H', 1e12), ('He', 8.5e10), ('O', 4.9e8, 'green'), ('C', 2.7e8, 'green'), ('Fe', 3.2e7, 'gold'), ('Au', 8, 'pink'), ('U', 0.3, 'pink')], logy=True, ylabel='atoms per 10¹² H')

blocks('kilonova_rprocess', 'In 2017 gravitational waves and light from two merging neutron stars (GW170817) showed fresh heavy elements being made by rapid neutron capture (r-process). Mergers are one source; whether supernovae also contribute is debated.',
       [('m', 'Neutron-star\nmerger', 10, 50, 'pink'), ('e', 'Neutron-rich ejecta', 40, 50), ('r', 'r-process', 70, 50, 'gold'), ('a', 'Gold, platinum,\nuranium', 92, 20, 'gold'), ('k', 'Kilonova glow', 92, 82, 'accent')],
       [('m', 'e'), ('e', 'r'), ('r', 'a'), ('r', 'k')], aspect=0.62)
S['kilonova_rprocess']['nodes'][0]['label'] = 'NS merger'; S['kilonova_rprocess']['nodes'][3]['label'] = 'Gold, uranium'

plot('binary_variable', 'An eclipsing binary dims twice per orbit: once when the small star is in front (primary) and once behind. Depth ratio tells the stars\' relative surface brightness. Slide the depth and temperature ratio.',
     [F('1-D*(exp(-(x/0.04)^2)+exp(-((x-1)/0.04)^2))-D*q*exp(-((x-0.5)/0.04)^2)', 'combined brightness', 'accent')], x=[0, 1], y=[0.4, 1.05], xlabel='orbital phase', ylabel='relative brightness',
     params=[P('D', 'primary eclipse depth', 0.1, 0.6, 0.4), P('q', 'secondary/primary depth', 0.1, 1, 0.5)], readouts=[R('secondary eclipse depth', 'D*q*100', '%')])

bars('distance_ladder', 'No single method measures all distances; each rung calibrates the next. Rough maximum useful reach: parallax (Gaia) ~10 kpc, Cepheids ~30 Mpc, supernovae Ia ~1 Gpc. Small errors in the lower rungs carry up, which feeds the Hubble tension.',
     [('parallax', 1e4), ('Cepheids', 3e7), ('tip of RGB', 5e7), ('Type Ia SNe', 1e9, 'gold'), ('redshift', 1e10)], logy=True, ylabel='reach (parsecs)')

plot('milky_way', 'The Galaxy\'s rotation speed stays flat (~230 km/s) far from the centre, but the visible stars and gas alone (dashed) would make it fall off. A halo of unseen mass lifts it. Slide the halo strength.',
     [F('sqrt(4.3e-6*7e10*(1-exp(-x/3)*(1+x/3))/x)', 'visible matter only', 'pink', dash=True), F('Vh*sqrt(1-(3/x)*atan(x/3))', 'dark halo', 'accent', dash=True),
      F('sqrt(4.3e-6*7e10*(1-exp(-x/3)*(1+x/3))/x+Vh^2*(1-(3/x)*atan(x/3)))', 'total', 'gold', width=3)],
     x=[0.5, 30], y=[0, 300], xlabel='distance from the galactic centre (kpc)', ylabel='orbital speed (km/s)', params=[P('Vh', 'halo strength', 0, 250, 200, 'km/s')],
     vlines=[dict(x=8.2, label='Sun')], readouts=[R('speed at the Sun', 'sqrt(4.3e-6*7e10*(1-exp(-8.2/3)*(1+8.2/3))/8.2+Vh^2*(1-(3/8.2)*atan(8.2/3)))', 'km/s')])

plot('galaxies', 'Bigger galaxies spin faster: baryonic mass ∝ v⁴ (Tully–Fisher). On log axes it is a straight line, which lets astronomers estimate a galaxy\'s mass from its rotation speed. Slide the exponent.',
     [F('1.1e11*(x/220)^n', 'mass vs rotation speed', 'accent')], x=[20, 400], y=[1e7, 1e13], logx=True, logy=True, xlabel='rotation speed (km/s)', ylabel='stellar + gas mass (solar masses)',
     params=[P('n', 'slope', 3, 5, 4)], points=[dict(x=220, y=1.1e11, label='Milky Way', color='gold'), dict(x=250, y='1.1e11*(250/220)^n', label='Andromeda', color='pink'), dict(x=65, y='1.1e11*(65/220)^n', label='LMC', color='green')])

plot('dark_matter_evidence', 'Three explanations of flat rotation curves: dark matter halo (accent), modified gravity at low acceleration (MOND, pink), or nothing (visible matter, dashed). Many observations such as cluster collisions and the CMB favour dark matter; the particle has not been found.',
     [F('sqrt(4.3e-6*Mv*1e10*(1-exp(-x/3)*(1+x/3))/x)', 'visible only (Newton)', 'dim', dash=True), F('sqrt(4.3e-6*Mv*1e10*(1-exp(-x/3)*(1+x/3))/x+200^2*(1-(3/x)*atan(x/3)))', 'with dark matter halo', 'accent'),
      F('sqrt(x*(4.3e-6*Mv*1e10*(1-exp(-x/3)*(1+x/3))/x^2)/(1-exp(-sqrt((4.3e-6*Mv*1e10*(1-exp(-x/3)*(1+x/3))/x^2)/3704))))', 'MOND', 'pink')],
     x=[0.5, 30], y=[0, 320], xlabel='distance from centre (kpc)', ylabel='orbital speed (km/s)', params=[P('Mv', 'visible mass', 3, 12, 7, '×10¹⁰ M☉')])

plot('agn_quasars', 'A black hole can shine no brighter than the Eddington luminosity (about 3.3×10⁴ L☉ per solar mass) or its own light would blow the gas away. Quasars are supermassive black holes feeding near that limit; Sgr A* is nearly starved.',
     [F('3.29e4*lam*x', 'luminosity', 'accent')], x=[1e6, 1e10], y=[1e4, 1e15], logx=True, logy=True, xlabel='black-hole mass (solar masses)', ylabel='luminosity (solar luminosities)',
     params=[P('lam', 'fraction of Eddington', 0.001, 1, 0.3)], points=[dict(x=4.3e6, y=1000, label='Sgr A* (dim)', color='pink'), dict(x=6.5e9, y='3.29e4*lam*6.5e9', label='M87*-like', color='gold')],
     readouts=[R('luminosity of a 10⁸ M☉ hole', '3.29e4*lam*1e8', 'L☉')])
S['agn_quasars']['y'] = [1e2, 1e15]

plot('smbh_growth', 'Quasars with a billion solar masses existed less than a billion years after the Big Bang. Even steady Eddington-rate growth takes ~50 Myr per e-fold, so starting from a light seed (100 M☉) is barely fast enough; heavy seeds help. How they formed is open.',
     [F('10^ls*exp(x*lam/50)', 'black-hole mass', 'accent')], x=[0, 800], y=[10, 1e11], logy=True, xlabel='time since seed formed (Myr)', ylabel='mass (solar masses)', hlines=[dict(y=8e8, label='z = 7.5 quasar: 8×10⁸', color='gold')],
     params=[P('ls', 'seed mass: log₁₀(M☉)', 1, 6, 2), P('lam', 'Eddington ratio', 0.3, 1.5, 1)], readouts=[R('mass after 700 Myr', '10^ls*exp(700*lam/50)', 'M☉')])

# ---------- COSMOLOGY ----------
plot('expansion_hubble', 'Hubble\'s law: galaxies recede at speeds proportional to distance, v = H₀d, so the universe is expanding. Distances to galaxies and their redshift speeds fall on a line; its slope is H₀ (about 70 km/s/Mpc).',
     [F('H0*x', 'recession velocity', 'accent')], x=[0, 500], y=[0, 40000], xlabel='distance (Mpc)', ylabel='recession speed (km/s)', params=[P('H0', 'Hubble constant', 60, 80, 70, 'km/s/Mpc'), P('d', 'galaxy distance', 10, 500, 200, 'Mpc')],
     points=[dict(x='d', y='H0*d', label='{H0*d} km/s')], readouts=[R('speed', 'H0*d', 'km/s'), R('rough age 1/H₀', '977.8/H0', 'Gyr')])

pts = [(1, 67.4, 'Planck CMB', 'accent'), (2, 67.6, 'BAO + BBN', 'accent'), (3, 69.8, 'TRGB', 'orange'), (4, 73.0, 'Cepheids/SNe', 'gold')]
plot('hubble_tension_node', 'Early-universe data (CMB, BAO) give H₀ ≈ 67.4 km/s/Mpc, while the local distance ladder gives ≈ 73. The gap (~8%) is statistically large. Possible causes include measurement error or new physics; nothing is settled.',
     [], x=[0, 5], y=[64, 76], xlabel='method (1: CMB, 2: BAO+BBN, 3: TRGB, 4: Cepheids)', ylabel='H₀ (km/s/Mpc)', points=[dict(x=x, y=y, label=l, color=c, r=6) for x, y, l, c in pts], readouts=[R('gap', '73-67.4', 'km/s/Mpc'), R('relative gap', '100*(73-67.4)/67.4', '%')])

plot('big_bang', 'The universe was hotter in the past: the cosmic background temperature scales as T = 2.725 K × (1 + z). Light first travelled freely at ~3000 K (z ≈ 1100); nuclei formed near 10¹⁰ K, within the first minutes. Earlier eras are extrapolations.',
     [F('2.725*x', 'radiation temperature', 'accent')], x=[1, 1e10], y=[1, 1e11], logx=True, logy=True, xlabel='1 + redshift', ylabel='temperature (K)',
     points=[dict(x=1101, y=3000, label='light released', color='gold'), dict(x=3.7e9, y=1e10, label='nuclei form', color='pink'), dict(x=1, y=2.725, label='today', color='green')],
     params=[P('lz', 'log₁₀(1+z)', 0, 10, 3)], readouts=[R('temperature', '2.725*10^lz', 'K'), R('thermal energy kT', '8.617e-5*2.725*10^lz', 'eV')])

plot('cmb', 'The cosmic microwave background is the most perfect blackbody ever measured: 2.725 K, peaking near 160 GHz. It is the afterglow of the hot early universe, stretched by expansion. Slide the temperature to see how it would shift.',
     [F('2*6.626e-34*(x*1e9)^3/8.988e16/(exp(0.04799*x/T)-1)*1e14', 'brightness', 'accent')], x=[10, 600], xlabel='frequency (GHz)', ylabel='intensity (MJy/sr)', params=[P('T', 'temperature', 2, 4, 2.725, 'K')],
     vlines=[dict(x='58.8*T', label='peak', color='gold')], readouts=[R('peak frequency', '58.8*T', 'GHz'), R('peak wavelength', '1.06e3/(58.8*T)*1e2*0.01*10', 'mm')])
S['cmb']['readouts'] = [R('peak frequency', '58.8*T', 'GHz'), R('peak wavelength', '2.898/T', 'mm')]

plot('bbn_node', 'Big Bang nucleosynthesis predicts how much deuterium survives: more baryons (ordinary matter) means less deuterium left. The measured D/H (2.5×10⁻⁵) fixes the baryon density, matching the CMB value (vertical line).',
     [F('2.55*(x/0.0224)^-1.6', 'predicted D/H (×10⁻⁵)', 'accent')], x=[0.012, 0.04], y=[0, 10], xlabel='baryon density Ωb h²', ylabel='D/H (×10⁻⁵)',
     vlines=[dict(x=0.0224, label='CMB value', color='gold')], hlines=[dict(y=2.55, label='observed', color='pink')], params=[P('ob', 'baryon density', 0.012, 0.04, 0.0224)], points=[dict(x='ob', y='2.55*(ob/0.0224)^-1.6')],
     readouts=[R('predicted D/H', '2.55*(ob/0.0224)^-1.6', '×10⁻⁵')])

plot('inflation', 'In inflation the comoving Hubble radius (blue) shrinks, so one tiny region became everything we see and was smoothed out; afterwards it grows again. Roughly 60 e-folds of growth are needed. Inflation is a hypothesis; competing ideas exist.',
     [F('x<N ? exp(-x) : exp(x-2*N)', 'comoving Hubble radius (relative)', 'accent')], x=[0, 'N+25'], y=['exp(-N)*0.1', 'exp(25-N)*10'], logy=True, xlabel='expansion (e-folds of growth)', ylabel='Hubble radius (log scale)',
     vlines=[dict(x='N', label='inflation ends', color='gold')], params=[P('N', 'e-folds of inflation', 20, 70, 60)])

plot('dark_energy_node', 'Expansion is accelerating, as if driven by a "dark energy" (ΩΛ ≈ 0.7). With more of it the universe expands exponentially; with none it keeps decelerating. Its nature (a cosmological constant or something dynamic) is open. H₀ = 70 assumed.',
     [F('((1-L)/L)^(1/3)*sinh(1.5*sqrt(L)*0.0716*x)^(2/3)', 'scale factor a(t)', 'accent')], x=[0, 30], y=[0, 5], xlabel='time since the Big Bang (Gyr)', ylabel='scale factor a (today = 1)', hlines=[dict(y=1, label='today')],
     params=[P('L', 'dark energy fraction ΩΛ', 0.05, 0.9, 0.7)], readouts=[R('age when a = 1', 'asinh(sqrt(L/(1-L)))/(1.5*sqrt(L)*0.0716)', 'Gyr')])
S['dark_energy_node']['readouts'] = [R('age when a = 1', 'log(sqrt(L/(1-L))+sqrt(L/(1-L)+1))/(1.5*sqrt(L)*0.0716)', 'Gyr')]
S['dark_energy_node']['readouts'][0]['value'] = 'log(sqrt(L/(1-L))+sqrt(L/(1-L)+1))/(1.5*sqrt(L)*0.0716)'

add('cosmic_web', dict(type='heatmap', f='exp(g*(sin(x+1.7*sin(1.3*y+0.5))+sin(y-1.3*sin(0.9*x))+0.7*sin(0.5*(x+y)+sin(2*y))))', x=[0, 14], y=[0, 9], equal=True, colormap='heat',
    params=[P('g', 'gravity-driven clustering', 0, 2, 1.2)], caption='A toy picture of the cosmic web: as gravity pulls matter together over time (slide g from 0 up), a smooth distribution gathers into filaments, nodes and voids, as in galaxy surveys and simulations.'))

plot('reionization', 'Ultraviolet light from the first stars and galaxies stripped electrons from the surrounding hydrogen, switching the universe from neutral to ionised between about z = 12 and 6. The exact timeline is still being measured.',
     [F('0.5*(1+tanh((zr-x)/dz))', 'ionised fraction', 'accent')], x=[4, 15], y=[0, 1.05], xlabel='redshift z (earlier →)', ylabel='fraction of hydrogen ionised', params=[P('zr', 'midpoint redshift', 6, 10, 7.7), P('dz', 'duration', 0.5, 3, 1.5)],
     hlines=[dict(y=0.5, label='half ionised')])

plot('fate_multiverse', 'Possible far futures depend on dark energy: it may keep expanding (cold, empty "freeze"), eventually tear everything apart (a "rip"), or reverse and collapse (a "crunch"). Current data favour a freeze, but the future of dark energy is unknown, and ideas of other universes are untestable.',
     [F('exp(0.14*x)', 'freeze (cosmological constant)', 'accent'), F('1/(1-x/12)^0.5', 'rip (w < −1)', 'pink'), F('2.2*sin(0.26*(x+2.2))', 'crunch (dark energy fades)', 'gold')],
     x=[0, 11], y=[0, 4], xlabel='time from now (arbitrary units)', ylabel='size of the universe (relative)')

bars('observable_universe', 'Distance scales from the Earth to the observable universe, on a log axis: every bar is a thousand to a million times larger than the last. The edge of what we can see is ~46 billion light-years away (radius), though more may lie beyond.',
     [('Earth', 1.3e7), ('Sun–Neptune', 9e12), ('nearest star', 4.1e16), ('Milky Way', 9.5e20), ('Virgo cluster', 5e23), ('observable', 8.8e26, 'gold')], logy=True, ylabel='diameter (m)')

plot('telescopes_tech', 'A bigger mirror sees finer detail: the diffraction limit is θ ≈ 1.22 λ/D. Doubling the aperture halves the smallest angle; shorter wavelengths resolve more. Points mark the eye, Hubble, JWST and Keck at the chosen wavelength.',
     [F('0.2516*lam/x', 'smallest resolvable angle', 'accent')], x=[0.005, 40], y=[1e-3, 100], logx=True, logy=True, xlabel='aperture diameter (m)', ylabel='resolution (arcseconds)',
     params=[P('lam', 'wavelength', 400, 2000, 550, 'nm')], points=[dict(x=0.007, y='0.2516*lam/0.007', label='eye'), dict(x=2.4, y='0.2516*lam/2.4', label='Hubble', color='gold'), dict(x=6.5, y='0.2516*lam/6.5', label='JWST', color='pink'), dict(x=10, y='0.2516*lam/10', label='Keck', color='green')])

# ---------- CROSS-CUTTING ----------
chain('scientific_method', 'Science is a loop: observe, form a hypothesis, derive a testable prediction, test it, and revise. Claims gain confidence as they survive repeated tests by independent groups; nothing is ever proven absolutely.',
      ['Observe', 'Hypothesis', 'Prediction', 'Test', 'Revise or keep'], per_row=3, colors=['accent', 'gold', 'gold', 'pink', 'green'], loop=True)

chain('effective_theories', 'Each level of nature has its own good description, mostly independent of the details below: chemistry does not need quark physics, biology does not need to solve the Schrödinger equation. New behaviour "emerges" at each level.',
      ['Quarks & gluons', 'Nuclei', 'Atoms', 'Molecules', 'Cells'], per_row=3, colors=['pink', 'pink', 'gold', 'accent', 'green'], elabels=['bind', 'add electrons', 'bond', 'organise'])

plot('arrow_of_time', 'Why time has a direction: the chance that N gas molecules all end up in one half of a box is 2⁻ᴺ. For 100 molecules it is 10⁻³⁰, and for a mole it is effectively zero. Entropy rises because disordered states vastly outnumber ordered ones. Why the early universe was so ordered remains an open question.',
     [F('2^-x', 'probability all molecules in one half', 'accent')], x=[1, 100], y=[1e-31, 1], logy=True, xlabel='number of molecules N', ylabel='probability', params=[P('n', 'molecules', 1, 100, 20, step=1)],
     points=[dict(x='n', y='2^-n')], readouts=[R('probability', '2^-n')])

plot('information_theory', 'Shannon entropy of a yes/no event: H = −p log₂p − (1−p) log₂(1−p). A fair coin carries 1 bit per flip; a biased coin carries less, because its outcome is more predictable.',
     [F('-(x*log2(x)+(1-x)*log2(1-x))', 'entropy (bits)', 'accent')], x=[0.001, 0.999], y=[0, 1.1], xlabel='probability of heads p', ylabel='entropy (bits per flip)', params=[P('p', 'p', 0.01, 0.99, 0.2)],
     points=[dict(x='p', y='-(p*log2(p)+(1-p)*log2(1-p))')], readouts=[R('entropy', '-(p*log2(p)+(1-p)*log2(1-p))', 'bits')])

plot('landauer', 'Erasing one bit must release at least kT ln 2 of heat. At room temperature this is about 3×10⁻²¹ J, far below what today\'s chips use (~10⁻¹⁵–10⁻¹⁷ J per operation), so there is room to improve but a real physical floor.',
     [F('9.57e-24*x', 'Landauer limit', 'accent')], x=[1, 400], y=[1e-24, 1e-14], logx=True, logy=True, xlabel='temperature (K)', ylabel='minimum energy to erase 1 bit (J)',
     hlines=[dict(y=1e-16, label='typical CMOS gate ~10⁻¹⁶ J', color='pink')], params=[P('T', 'temperature', 1, 400, 300, 'K')], points=[dict(x='T', y='9.57e-24*T')],
     readouts=[R('limit at this T', '9.57e-24*T', 'J'), R('CMOS ~1 fJ / limit', '1e-15/(9.57e-24*T)')])

plot('computation', 'Algorithms scale differently: n², n³ remain practical, but 2ⁿ explodes: at 10⁹ operations/s, n = 60 would take years. That gap between "polynomial" and "exponential" is the heart of complexity theory.',
     [F('x^2/10^sp', 'n² steps', 'accent'), F('x^3/10^sp', 'n³ steps', 'gold'), F('2^x/10^sp', '2ⁿ steps', 'pink')], x=[1, 70], y=[1e-9, 1e12], logy=True, xlabel='input size n', ylabel='run time (seconds)',
     params=[P('sp', 'speed: log₁₀(operations/s)', 6, 12, 9)], hlines=[dict(y=3.15e7, label='1 year', color='white')], readouts=[R('2ⁿ at n = 60', '2^60/10^sp/3.15e7', 'years')])

geo('p_vs_np', 'P: problems solved fast. NP: problems whose answers can be checked fast. Everything in P is in NP; whether they are equal is unsolved (a $1M Millennium problem). Most experts suspect P ≠ NP (left), but no proof exists.',
    [-4, 4, -2, 2],
    [C(-1.5, 0, 1.6, 'accent', alpha=0.1, width=3), C(-1.5, 0, 0.8, 'gold', 'gold', alpha=0.25), T(-1.5, 0, 'P', 'gold', 14), T(-1.5, 1.2, 'NP', 'accent', 14), T(-1.5, -1.4, 'if P ≠ NP', 'dim', 10),
     C(2.2, 0, 1.2, 'gold', 'gold', alpha=0.25), T(2.2, 0, 'P = NP', 'gold', 13), T(2.2, -1.4, 'if P = NP', 'dim', 10), T(-1.5, 0.45, 'factoring?', 'dim', 9)], aspect=0.5)
S['p_vs_np']['shapes'][-1]['y'] = 0.55

plot('quantum_computing', 'Grover\'s algorithm searches N items in about (π/4)√N steps instead of N/2. It is a quadratic, not exponential, speed-up; the big exponential gains (e.g. Shor\'s factoring) apply only to special problems. Useful large machines do not yet exist.',
     [F('x/2', 'classical (average N/2)', 'pink'), F('0.785*sqrt(x)', 'Grover quantum', 'accent')], x=[10, 1e12], y=[1, 1e12], logx=True, logy=True, xlabel='number of items N', ylabel='steps',
     params=[P('lg', 'log₁₀ N', 1, 12, 9)], readouts=[R('classical steps', '10^lg/2'), R('Grover steps', '0.785*10^(lg/2)'), R('speed-up', '10^lg/2/(0.785*10^(lg/2))')])

add('electronics_logic', dict(type='logic', inputs=['A', 'B', 'C'], expr='(A & B) | (C & (A ^ B))', output='Cout', caption='Digital circuits are built from gates (AND, OR, XOR…) that compute Boolean functions. This is the carry of a full adder: the output is 1 when at least two of the three bits are 1. Click the inputs.'))

add('neural_nets', dict(type='heatmap', f='1/(1+exp(-(w1*x+w2*y+b)))', x=[-3, 3], y=[-3, 3], z=[0, 1], colormap='diverging', equal=True,
    params=[P('w1', 'weight 1', -4, 4, 1.5), P('w2', 'weight 2', -4, 4, 1), P('b', 'bias', -4, 4, 0)],
    caption='One artificial neuron outputs a smooth 0-to-1 value of a weighted sum of its inputs. Weights tilt the dividing line between "yes" (red) and "no" (blue); the bias shifts it. Training adjusts weights; deep networks stack many of these.'))

plot('networks_complexity', 'Many real networks (the web, airports, protein interactions) have a few hubs and many low-degree nodes: the number of nodes with degree k falls as a power law k^−γ, a straight line on log axes. Preferential attachment gives γ = 3.',
     [F('x^-g', 'fraction of nodes with k links', 'accent')], x=[1, 1000], y=[1e-8, 1], logx=True, logy=True, xlabel='degree k (number of connections)', ylabel='fraction of nodes', params=[P('g', 'exponent γ', 2, 3.5, 2.5)],
     readouts=[R('nodes with 100× average hubs are', '100^-g', 'as common as the rest (relative)')])
S['networks_complexity']['readouts'] = [R('rarity of degree-100 nodes vs degree-1', '100^-g')]

chain('evolution_algorithm', 'Evolution as an algorithm: copy with variation, select what works, repeat. Information about the environment accumulates in genomes over generations. The same loop drives genetic algorithms in computing.',
      ['Variation (mutation)', 'Selection', 'Inheritance (copying)'], per_row=3, colors=['accent', 'pink', 'gold'], loop=True)

plot('dimensional_scaling', 'Kleiber\'s law: metabolic rate scales as mass^0.75, not mass^1, across animals from mice to elephants. A straight line on log axes; an 8000-fold bigger animal needs only ~700 times the power. Slide the exponent (0.67 would follow surface-area scaling).',
     [F('3.4*x^b', 'metabolic rate (W)', 'accent')], x=[0.01, 10000], y=[0.1, 5000], logx=True, logy=True, xlabel='body mass (kg)', ylabel='basal metabolic rate (W)', params=[P('b', 'exponent', 0.5, 1, 0.75)],
     points=[dict(x=0.025, y='3.4*0.025^b', label='mouse', color='gold'), dict(x=70, y='3.4*70^b', label='human', color='pink'), dict(x=4000, y='3.4*4000^b', label='elephant', color='green')], readouts=[R('human (70 kg)', '3.4*70^b', 'W')])

nodes = []; edges = []
for k, (c, u, col) in enumerate([('Δν Cs', 'second', 'accent'), ('c', 'metre', 'accent'), ('h', 'kilogram', 'gold'), ('e', 'ampere', 'accent'), ('k', 'kelvin', 'pink'), ('N_A', 'mole', 'green'), ('K_cd', 'candela', 'orange')]):
    y = 8 + 14 * k
    nodes += [nd('c%d' % k, c, 12, y, 'dim'), nd('u%d' % k, u, 80, y, col)]
    edges.append(('c%d' % k, 'u%d' % k, 'fixes' if k == 0 else None))
blocks('si_units', 'Since 2019 all seven SI base units are defined by fixing exact values of constants of nature (left), not by physical artefacts: for example the metre via c and the kilogram via Planck\'s constant h.',
       nodes, edges, flow=False, aspect=0.9)

plot('power_grid', 'Long-distance lines lose power as I²R, so transmitting at high voltage (low current) cuts losses: the percent loss falls as 1/V². That is why transformers step up to hundreds of kV and back down for homes.',
     [F('P*R*100/x^2', 'line loss (%)', 'accent')], x=[10, 1000], y=[0.01, 100], logx=True, logy=True, xlabel='line voltage (kV)', ylabel='power lost in the line (%)',
     params=[P('P', 'power sent', 100, 1000, 500, 'MW'), P('R', 'line resistance', 2, 30, 10, 'Ω'), P('V', 'voltage', 10, 1000, 400, 'kV')], points=[dict(x='V', y='P*R*100/V^2', label='{P*R*100/V^2}%')],
     readouts=[R('loss at this voltage', 'P*R*100/V^2', '%'), R('current', 'P*1000/V', 'A')])

plot('electric_motors', 'A DC motor\'s torque falls linearly with speed (stall torque at 0 rpm, none at no-load speed), so mechanical power peaks at half speed. Slide the stall torque and no-load speed.',
     [F('Ts*(1-x/wn)', 'torque (N·m)', 'accent'), F('Ts*(1-x/wn)*x*0.10472', 'power (W)', 'gold')], x=[0, 3000], y=[0, 'Ts*wn*0.10472*0.27'], xlabel='speed (rpm)', ylabel='torque (N·m) / power (W)',
     params=[P('Ts', 'stall torque', 0.5, 5, 2, 'N·m'), P('wn', 'no-load speed', 1000, 3000, 2500, 'rpm')], readouts=[R('peak power', 'Ts*wn*0.10472/4', 'W')])
S['electric_motors']['y'] = [0, 1000]

bars('batteries_tech', 'Energy stored per kilogram: lead-acid 35, NiMH ~80, lithium-ion ~250 Wh/kg, and gasoline about 12,000 Wh/kg of chemical energy (an engine wastes ~70% of it). Batteries have improved a lot but remain far behind fuels in raw energy density.',
     [('lead-acid', 35), ('NiMH', 80), ('Li-ion', 250, 'gold'), ('gasoline', 12000, 'pink')], logy=True, ylabel='Wh per kg')

plot('flight_tech', 'A wing\'s lift-to-drag ratio L/D rises with its aspect ratio (long, thin wings like a glider\'s waste less energy as wingtip vortices). Slide the aspect ratio: airliners ~9, gliders 30+.',
     [F('2*pi*rad(x)/(0.02+(2*pi*rad(x))^2/(pi*0.85*AR))', 'lift / drag', 'accent')], x=[0.5, 12], y=[0, 50], xlabel='angle of attack (°)', ylabel='lift-to-drag ratio', params=[P('AR', 'aspect ratio', 5, 30, 9)],
     readouts=[R('best glide ratio ≈', 'sqrt(pi*0.85*AR/0.02)/2')])

plot('fiber_optics', 'Light travels through silica fibre with loss of only ~0.2 dB/km at 1550 nm, the sweet spot between scattering (falls with wavelength) and infrared absorption (rises). That low loss lets signals cross oceans with few amplifiers. A schematic of the loss curve.',
     [F('0.95/x^4+0.02+0.02*exp(19.6*(x-1.55))', 'fibre loss (dB/km)', 'accent')], x=[0.8, 1.8], y=[0.1, 10], logy=True, xlabel='wavelength (µm)', ylabel='loss (dB/km)',
     vlines=[dict(x=1.31, label='1310 nm', color='gold'), dict(x=1.55, label='1550 nm', color='gold')], params=[P('km', 'link length', 10, 500, 100, 'km')],
     readouts=[R('loss over the link at 1550 nm', '0.2*km', 'dB')])

plot('led_lasers', 'An LED or laser diode emits photons with the semiconductor\'s band-gap energy, λ = 1240 nm·eV / E_g. Wide-gap GaN gives blue/UV; GaAs (1.42 eV) gives infrared; alloys tune the colour in between.',
     [F('1239.84/x', 'emission wavelength', 'accent')], x=[0.5, 3.6], y=[300, 2500], xlabel='band gap (eV)', ylabel='wavelength (nm)', params=[P('eg', 'band gap', 0.6, 3.5, 1.9, 'eV')],
     points=[dict(x='eg', y='1239.84/eg', label='{1239.84/eg} nm'), dict(x=1.42, y=873, label='GaAs', color='pink'), dict(x=3.4, y=365, label='GaN', color='pink')], hlines=[dict(y=400, label='violet'), dict(y=700, label='red')],
     readouts=[R('wavelength', '1239.84/eg', 'nm')])

add('radio_comm', dict(type='signal', x=[0, 1], f='(1+m*sin(2*pi*4*x))*sin(2*pi*40*x)', y=[-2.1, 2.1], spectrum=True, fmax=60, params=[P('m', 'modulation depth', 0, 1, 0.7)],
    caption='Amplitude modulation: a high-frequency carrier (40 Hz here, MHz in reality) has its height varied by the message (4 Hz). The spectrum shows the carrier plus two sidebands at carrier ± message frequency.'))

bars('fusion_energy', 'Energy gain Q = fusion power out / heating power in. JET reached 0.67 (1997); the NIF laser achieved a target gain of ~1.5 in 2022 (energy out/laser energy), not counting the electricity to run the lasers; ITER aims for Q = 10 in the 2030s. Net electricity from fusion has not been shown.',
     [('JET 1997', 0.67), ('NIF 2022 (target gain)', 1.5, 'gold'), ('ITER goal', 10, 'pink')], ylabel='energy gain Q')
S['fusion_energy']['bars'][1]['label'] = 'NIF 2022'

plot('plasma_physics', 'In a plasma, charges screen each other beyond the Debye length λ_D = 7430·√(T/n) m (T in eV, n in m⁻³). Plasma behaviour needs the system to be much bigger than this. Hot, thin plasmas (solar wind) have long λ_D; dense fusion plasmas are tiny.',
     [F('7430*sqrt(10^lT/x)', 'Debye length (m)', 'accent')], x=[1e6, 1e30], y=[1e-9, 1e7], logx=True, logy=True, xlabel='electron density (m⁻³)', ylabel='Debye length (m)',
     params=[P('lT', 'log₁₀ temperature (eV)', -1, 4, 1)], points=[dict(x=5e6, y=10, label='solar wind', color='gold'), dict(x=1e20, y=7.4e-5, label='tokamak', color='pink')])

geo('additive_manufacturing_tech', 'Layer-by-layer printing turns a smooth 45° slope (dashed) into a staircase. Thinner layers follow the true surface better but need many more layers and more print time. Slide the layer height.',
    [0, 3, 0, 3], [L(0, 0, 3, 3, 'dim', 1, dash=True), Cv('s', 'floor(s/h)*h+h', [0, 2.999], 'accent', 3), T(1.9, 0.5, '{3/h} layers for a 3 mm part', 'gold', 11)],
    params=[P('h', 'layer height', 0.05, 0.6, 0.3, 'mm')], readouts=[R('layers for a 3 mm part', '3/h'), R('stair-step height error', 'h', 'mm')], aspect=0.8, axes=True)

# ---------- SOCIAL ----------
plot('economics_basics', 'Where the falling demand curve meets the rising supply curve, the market clears at price P* and quantity Q*. Raise demand (richer buyers) or cost of supply and the equilibrium moves; slide to see price and quantity change.',
     [F('a-0.5*x', 'demand', 'accent'), F('c+0.5*x', 'supply', 'pink')], x=[0, 100], y=[0, 100], xlabel='quantity', ylabel='price', params=[P('a', 'demand strength', 60, 100, 80), P('c', 'supply cost', 5, 40, 20)],
     points=[dict(x='(a-c)', y='a-0.5*(a-c)', label='equilibrium', color='gold')], readouts=[R('equilibrium price', 'a-0.5*(a-c)'), R('equilibrium quantity', 'a-c')])

plot('game_theory', 'In the repeated prisoner\'s dilemma, cooperating (tit-for-tat) beats always defecting once the game is likely to continue long enough (probability w > (T−3)/(T−1)). Cooperation can pay when we meet again. Payoff values are standard textbook ones.',
     [F('3/(1-x)', 'tit-for-tat pair', 'accent'), F('T+x/(1-x)', 'defector against tit-for-tat', 'pink')], x=[0, 0.95], y=[0, 40], xlabel='probability of meeting again (w)', ylabel='total payoff',
     params=[P('T', 'temptation payoff T', 4, 8, 5)], vlines=[dict(x='(T-3)/(T-1)', label='break-even', color='gold')], readouts=[R('cooperation wins above w =', '(T-3)/(T-1)')])

plot('macro_economics', 'Money grows with compound interest but loses value with inflation: after n years 100 units become 100(1+g)ⁿ (growth) or 100/(1+π)ⁿ in real terms (inflation). The rule of 70: doubling time ≈ 70 / rate%. Economic forecasts remain uncertain.',
     [F('100*(1+g/100)^x', 'growing economy (index)', 'accent'), F('100/(1+pi_/100)^x', 'purchasing power of 100 units', 'pink')], x=[0, 50], y=[0, 500], xlabel='years', ylabel='index',
     params=[P('g', 'growth rate', 0, 6, 2, '% / yr'), P('pi_', 'inflation', 0, 10, 3, '% / yr')], readouts=[R('doubling time of the economy', 'g>0 ? 70/g : 0', 'years'), R('purchasing power after 30 years', '100/(1+pi_/100)^30')])
S['macro_economics']['fns'][1]['f'] = '100/(1+pr/100)^x'; S['macro_economics']['params'][1]['id'] = 'pr'
S['macro_economics']['readouts'][1]['value'] = '100/(1+pr/100)^30'

plot('behavioral_economics', 'Prospect theory: people feel losses about twice as strongly as equal gains (loss aversion), and feel changes with diminishing sensitivity. Slide the loss-aversion factor; the curve is steeper on the left.',
     [F('(x>=0 ? 1 : lam)*sign(x)*abs(x)^0.88', 'felt value', 'accent')], x=[-100, 100], y=[-150, 80], xlabel='gain or loss ($)', ylabel='felt value', params=[P('lam', 'loss aversion λ', 1, 3, 2.25)],
     readouts=[R('a $50 loss feels like a gain of', '2.25*50^0.88/50^0.88*50')])
S['behavioral_economics']['readouts'] = [R('a $50 loss feels as bad as a gain of', '(lam*50^0.88)^(1/0.88)', '$')]

plot('sociology_basics', 'New ideas and technologies spread through a society in an S-curve (the Bass diffusion model): innovators adopt first (p), then imitation by others (q) accelerates it. Larger q gives a sharper take-off.',
     [F('(1-exp(-(p+q)*x))/(1+(q/p)*exp(-(p+q)*x))*100', 'share who adopted', 'accent')], x=[0, 30], y=[0, 105], xlabel='years', ylabel='adopters (%)', params=[P('p', 'innovation p', 0.005, 0.05, 0.02), P('q', 'imitation q', 0.1, 0.8, 0.4)],
     readouts=[R('peak adoption at year', 'ln(q/p)/(p+q)')])

hg = [(0, 50, 49), (1, 76, 74), (2, 87, 86), (4, 102, 100), (6, 116, 114), (8, 128, 127), (10, 139, 140), (12, 149, 152), (14, 163, 160), (16, 174, 162), (18, 176, 163)]
plot('human_development', 'Height at 50th percentile (typical boys and girls, approximate). Growth is fastest in infancy, slows, then spurts at puberty, earlier in girls. Development of the mind and body unfolds in these stages, with large normal variation.',
     [], x=[0, 19], y=[40, 185], xlabel='age (years)', ylabel='height (cm)', points=[dict(x=a, y=b, color='accent', r=3) for a, b, g in hg] + [dict(x=a, y=g, color='pink', r=3) for a, b, g in hg] + [dict(x=17, y=178, label='boys', color='accent'), dict(x=17, y=164, label='girls', color='pink')])

plot('language_cognition', 'Zipf\'s law: in every language the r-th most common word occurs about 1/r^s times as often as the first (s ≈ 1). A few words (the, of, and) make up much of speech; most words are rare. On log axes, a straight line.',
     [F('x^-s', 'relative frequency', 'accent')], x=[1, 10000], y=[1e-5, 1], logx=True, logy=True, xlabel='word rank', ylabel='relative frequency', params=[P('s', 'exponent s', 0.8, 1.3, 1)],
     readouts=[R('100th word vs 1st', '100^-s')])

plot('medicine_evidence', 'Even a good test can mislead when the condition is rare: PPV = sens·p / (sens·p + (1−spec)(1−p)). With 95% sensitivity and 95% specificity, only ~16% of positives are true if prevalence is 1%. Slide prevalence and test quality.',
     [F('se*x/(se*x+(1-sp)*(1-x))*100', 'chance a positive test is true (%)', 'accent')], x=[0, 0.3], y=[0, 105], xlabel='prevalence (fraction with the condition)', ylabel='positive predictive value (%)',
     params=[P('se', 'sensitivity', 0.5, 0.99, 0.95), P('sp', 'specificity', 0.5, 0.99, 0.95), P('pv', 'prevalence', 0.001, 0.3, 0.01)], points=[dict(x='pv', y='se*pv/(se*pv+(1-sp)*(1-pv))*100', label='{se*pv/(se*pv+(1-sp)*(1-pv))*100}%')],
     readouts=[R('PPV', 'se*pv/(se*pv+(1-sp)*(1-pv))*100', '%')])

add('number_theory_crypto', dict(type='geometry', range=[-1.35, 1.35, -1.35, 1.35], shapes=[C(0, 0, 1, 'dim', width=1)] +
    [L('cos(2*pi*%d/23)' % i, 'sin(2*pi*%d/23)' % i, 'cos(2*pi*mod(a*%d,23)/23)' % i, 'sin(2*pi*mod(a*%d,23)/23)' % i, 'accent', 1.2) for i in range(1, 23)] + [T(0, 0, 'k → {a}·k  mod 23', 'gold', 11)],
    params=[P('a', 'multiplier a', 2, 22, 2, step=1)], aspect=0.9,
    caption='Arithmetic on a clock of 23 hours: each point k is joined to a·k mod 23. Simple rules produce intricate patterns (a = 2 gives a cardioid); modular arithmetic like this underlies RSA and other cryptography.'))

plot('geometry_topology', 'The Weierstrass function: a sum of ever-finer cosines that is continuous but has a rough edge at every scale (a fractal; its dimension is 2 + ln a / ln b). Slide a: small = smooth, near 1 = very jagged.',
     [F('+'.join('%s^%d*cos(%d*pi*x)' % ('a', k, 3 ** k) for k in range(8)).replace('+-', '-'), 'sum of 8 terms', 'accent')], x=[-1, 1], xlabel='x', params=[P('a', 'roughness a', 0.2, 0.9, 0.55)],
     readouts=[R('graph dimension 2 + ln a / ln 3', '2+ln(a)/ln(3)')])
S['geometry_topology']['fns'][0]['f'] = '+'.join('a^%d*cos(%d*pi*x)' % (k, 3 ** k) for k in range(8))

ds = [(1, 2.1), (2, 2.9), (3, 4.2), (4, 4.8), (5, 6.1), (6, 6.4), (7, 8.2), (8, 8.8), (9, 10.3), (10, 10.9)]
sse = '+'.join('(%s-(m*%s+b))^2' % (y, x) for x, y in ds)
n = len(ds); sx = sum(x for x, y in ds); sy = sum(y for x, y in ds); sxy = sum(x * y for x, y in ds); sxx = sum(x * x for x, y in ds)
bm = (n * sxy - sx * sy) / (n * sxx - sx * sx); bb = (sy - bm * sx) / n
plot('regression_models', 'Least-squares regression picks the line that minimises the sum of squared vertical gaps between the data and the line. Adjust slope and intercept by hand and watch the error; the dashed line is the best fit.',
     [F('m*x+b', 'your line', 'accent'), F('%.4f*x+%.4f' % (bm, bb), 'least-squares line', 'dim', dash=True)], x=[0, 11], y=[0, 14], xlabel='x', ylabel='y',
     points=[dict(x=x, y=y, color='gold') for x, y in ds], params=[P('m', 'slope', 0, 2, 0.5), P('b', 'intercept', -2, 6, 3)], readouts=[R('sum of squared errors', sse), R('best possible', '%.3f' % sum((y - (bm * x + bb)) ** 2 for x, y in ds))])

# ---------- remaining ----------
plot('photon_node', 'Photoelectric effect: light ejects electrons only above a threshold frequency, however bright, with kinetic energy KE = hf − φ. This showed light comes in quanta (photons) of energy hf. Choose the metal\'s work function φ.',
     [F('max(0,4.1357*x-phi)', 'electron energy', 'accent')], x=[0, 2], y=[0, 5], xlabel='light frequency (×10¹⁵ Hz)', ylabel='max electron energy (eV)', params=[P('phi', 'work function φ', 2, 5.6, 2.3, 'eV')],
     vlines=[dict(x='phi/4.1357', label='threshold', color='gold')], readouts=[R('threshold frequency', 'phi/4.1357*1000', 'THz'), R('threshold wavelength', '1239.84/phi', 'nm')])

geo('equivalence_principle', 'Galileo\'s and Einstein\'s equivalence: in a vacuum every object falls with the same acceleration regardless of mass, because gravitational and inertial mass are equal. Change the masses: the balls still land together.',
    [-3, 3, -0.5, 5],
    [L(-3, 0, 3, 0, 'dim', 2), C(-1, 'max(0.15,4.5-4.905*mod(t,0.96)^2)', '0.12*m1^0.33', 'accent', 'accent', alpha=0.6), C(1, 'max(0.15,4.5-4.905*mod(t,0.96)^2)', '0.12*m2^0.33', 'pink', 'pink', alpha=0.6),
     T(-1, 4.9, '{m1} kg', 'accent', 10), T(1, 4.9, '{m2} kg', 'pink', 10)],
    params=[P('m1', 'mass 1', 0.2, 10, 1, 'kg'), P('m2', 'mass 2', 0.2, 10, 8, 'kg')], readouts=[R('acceleration of both', '9.81', 'm/s²'), R('weight ratio = mass ratio', 'm2/m1')], aspect=0.8)
for sh in S['equivalence_principle']['shapes']:
    if sh.get('k') == 'text' and 'y' in sh and sh['y'] == 4.9: pass

plot('quark_gluon_plasma', 'Map of strongly interacting matter (T vs baryon chemical potential μ_B). At low μ_B, heating changes hadrons to quark–gluon plasma smoothly near 156 MeV (~1.8 trillion K). Whether the transition becomes abrupt at higher μ_B, and where, is unknown.',
     [F('156*(1-0.015*(x/156)^2)', 'crossover (lattice QCD)', 'accent')], x=[0, 1100], y=[0, 200], xlabel='baryon chemical potential μ_B (MeV)', ylabel='temperature (MeV)',
     points=[dict(x=10, y=156, label='LHC early universe', color='gold'), dict(x=923, y=0, label='nuclear matter', color='pink'), dict(x=1100, y=10, label='neutron stars', color='pink'), dict(x=500, y=125, label='critical point?', color='white')])

plot('superfluidity', 'Below 2.17 K liquid helium-4 becomes a superfluid that flows without friction: a growing fraction ρₛ/ρ = 1 − (T/T_λ)^5.6 (two-fluid picture). Slide the temperature across the lambda point.',
     [F('x<2.17 ? 1-(x/2.17)^5.6 : 0', 'superfluid fraction', 'accent')], x=[0, 3], y=[0, 1.05], xlabel='temperature (K)', ylabel='fraction of superfluid', params=[P('T', 'temperature', 0, 3, 1.5, 'K')],
     points=[dict(x='T', y='T<2.17 ? 1-(T/2.17)^5.6 : 0')], vlines=[dict(x=2.17, label='lambda point', color='gold')], readouts=[R('superfluid', 'T<2.17 ? 100*(1-(T/2.17)^5.6) : 0', '%')])

plot('space_weather', 'The solar wind\'s pressure compresses the magnetosphere: the stand-off distance falls as P^(−1/6). Normally ~10.7 Earth radii; in a strong storm it drops below geostationary orbit (6.6 R⊕), exposing satellites.',
     [F('10.7*(x/2)^(-1/6)', 'magnetopause distance', 'accent')], x=[0.1, 100], y=[4, 16], logx=True, xlabel='solar-wind pressure (nPa)', ylabel='stand-off distance (Earth radii)', hlines=[dict(y=6.6, label='geostationary orbit', color='pink')],
     params=[P('p', 'wind pressure', 0.5, 100, 2, 'nPa')], points=[dict(x='p', y='10.7*(p/2)^(-1/6)')], readouts=[R('distance', '10.7*(p/2)^(-1/6)', 'R⊕')])

bars('mars_node', 'Mars compared with Earth (Earth = 1): about half the radius, a tenth of the mass, 38% of the gravity, 43% of the sunlight, but only 0.6% of the atmospheric pressure. That thin air cannot hold liquid water on the surface.',
     [('radius', 0.53), ('mass', 0.107), ('gravity', 0.38), ('sunlight', 0.43), ('air pressure', 0.006, 'pink'), ('day length', 1.03)], logy=True, ylabel='relative to Earth')

plot('venus_node', 'Greenhouse warming grows with the optical depth τ of the atmosphere: T = T_e (1 + 0.75τ)^¼ for a simple grey atmosphere. Earth (τ ≈ 0.8) is warmed ~33 K; Venus\'s thick CO₂ air (τ ≈ 130) pushes the surface to ~737 K, hotter than Mercury.',
     [F('255*(1+0.75*x)^0.25', 'Earth (T_e = 255 K)', 'accent'), F('232*(1+0.75*x)^0.25', 'Venus (T_e = 232 K)', 'pink')], x=[0.1, 300], y=[200, 900], logx=True, xlabel='atmospheric optical depth τ', ylabel='surface temperature (K)',
     points=[dict(x=0.84, y=288, label='Earth', color='green'), dict(x=134, y=737, label='Venus', color='gold')], params=[P('tau', 'optical depth τ', 0.1, 300, 1)], readouts=[R('Earth-like planet at this τ', '255*(1+0.75*tau)^0.25', 'K')])

bars('giants_planets_tmp', 'tmp', [('a', 1)])
del S['giants_planets_tmp']
bars('giant_planets_node', 'The giant planets dwarf the rocky ones: Jupiter has 318 Earth masses (more than all other planets combined) and Saturn 95; Uranus and Neptune ("ice giants") ~15 and 17. Earth = 1.',
     [('Earth', 1, 'green'), ('Uranus', 14.5), ('Neptune', 17.1), ('Saturn', 95.2, 'gold'), ('Jupiter', 317.8, 'gold')], logy=True, ylabel='mass (Earth masses)')

add('pluto_kuiper', dict(type='parametric', range=[-52, 52, -52, 52],
    curves=[dict(x='30.1*cos(s)', y='30.1*sin(s)', s=[0, 6.2832], color='accent', dot='t*0.5'), dict(x='39.5*cos(s)-39.5*0.249', y='39.5*sqrt(1-0.249^2)*sin(s)', s=[0, 6.2832], color='pink', dot='(t*0.5*2/3)+0.249*sin(t*0.5*2/3)')],
    shapes=[C(0, 0, 1.5, 'gold', 'gold'), T(5, 4, 'Sun', 'gold', 10), T(0, -48, 'Neptune (blue), Pluto (pink): 2 orbits of Neptune per 3 of Pluto', 'dim', 9)],
    caption='Pluto\'s orbit is tilted and elongated: it crosses inside Neptune\'s orbit but they never collide because Pluto circles twice for every three Neptune orbits (a 3:2 resonance). Distances in AU; animation sped up.'))

plot('planet_earth_node', 'Earth\'s seasons come from its 23.4° axial tilt, not from distance. Daily sunlight at a given latitude swings with the year; with no tilt there would be no seasons, and a larger tilt would make them extreme. Slide the tilt and latitude.',
     [F('(1361/pi)*((sin(rad(lat))*sin(rad(ob*sin(2*pi*(x-80)/365)))*acos(clamp(-tan(rad(lat))*tan(rad(ob*sin(2*pi*(x-80)/365))),-1,1)))+(cos(rad(lat))*cos(rad(ob*sin(2*pi*(x-80)/365)))*sin(acos(clamp(-tan(rad(lat))*tan(rad(ob*sin(2*pi*(x-80)/365))),-1,1)))))', 'daily sunlight (W/m²)', 'accent')],
     x=[0, 365], y=[0, 560], xlabel='day of year', ylabel='mean sunlight at the top of the atmosphere (W/m²)', params=[P('ob', 'axial tilt', 0, 45, 23.4, '°'), P('lat', 'latitude', 0, 80, 45, '°N')])

plot('plant_physiology', 'Water moves up xylem tubes by flow that scales as the radius to the fourth power (Poiseuille): a vessel twice as wide carries 16 times as much. Wide vessels transport fast but are more prone to freeze or air-bubble blockage. Relative to a 20 µm tube.',
     [F('(x/20)^4', 'relative flow', 'accent')], x=[5, 100], y=[0.001, 1000], logx=True, logy=True, xlabel='tube radius (µm)', ylabel='relative flow rate', params=[P('r', 'tube radius', 5, 100, 20, 'µm')],
     points=[dict(x='r', y='(r/20)^4'), dict(x=10, y=0.0625, label='tracheid', color='pink'), dict(x=50, y=39, label='vessel', color='gold')], readouts=[R('relative flow', '(r/20)^4')])

plot('flowers_pollination', 'Seeds and pollen land at a range of distances. Wind-spread seeds mostly fall near the parent (exponential tail); animals can carry some far away (long fat tail), which helps colonise new places. Same mean distance, different tails.',
     [F('exp(-x/d)/d', 'short-range (gravity/wind)', 'accent'), F('1/(d*2)*(1+x/(2*d))^-3*2', 'long tail (animal carriers)', 'pink')], x=[0, 100], y=[1e-6, 0.5], logy=True, xlabel='distance from parent plant (m)', ylabel='relative chance of landing',
     params=[P('d', 'mean distance', 2, 30, 10, 'm')])

bars('animal_diversity', 'Described species (approximate): insects alone are about a million, outnumbering all vertebrates (~70,000) ten to one. Fungi (~150,000 described) are far more diverse than classified, with millions more estimated.',
     [('insects', 1.0e6, 'gold'), ('fungi', 1.5e5), ('molluscs', 8.5e4), ('vertebrates', 7e4, 'accent'), ('mammals', 6.5e3, 'pink')], logy=True, ylabel='described species')

plot('tsunami_hazards', 'A tsunami is a shallow-water wave whose speed is √(g·depth): ~700 km/h across a 4 km-deep ocean, slowing to ~35 km/h near shore. As it slows it piles up (Green\'s law, height ∝ depth^−¼), growing several-fold.',
     [F('3.6*sqrt(9.81*x)', 'wave speed (km/h)', 'accent')], x=[10, 10000], y=[10, 1000], logx=True, logy=True, xlabel='water depth (m)', ylabel='speed (km/h)',
     params=[P('dp', 'water depth', 10, 4000, 4000, 'm')], points=[dict(x='dp', y='3.6*sqrt(9.81*dp)')], readouts=[R('wave speed', '3.6*sqrt(9.81*dp)', 'km/h'), R('height growth vs deep ocean', '(4000/dp)^0.25')])

plot('enso', 'El Niño and La Niña are irregular 2–7 year swings in Pacific sea-surface temperature. Positive anomalies above about +0.5 °C mean El Niño. This is an idealised oscillation; the real one is irregular and only partly predictable. Slide the period.',
     [F('1.2*sin(2*pi*x/P)*(1+0.5*sin(2*pi*x/23))', 'Niño-3.4 anomaly (°C)', 'accent')], x=[0, 30], y=[-2.5, 2.5], xlabel='years', ylabel='temperature anomaly (°C)', hlines=[dict(y=0.5, label='El Niño threshold', color='pink'), dict(y=-0.5, label='La Niña', color='blue')],
     params=[P('P', 'period', 2, 7, 4, 'yr')])

rects = [Rc(-15, 0, 10, 100, 'blue', 'blue', alpha=0.25), Rc(-5, 20, 10, 80, 'accent', 'accent', alpha=0.25), Rc(5, 100, 15, 150, 'green', 'green', alpha=0.25), Rc(5, 20, 20, 80, 'gold', 'gold', alpha=0.25),
         Rc(15, 0, 15, 25, 'orange', 'orange', alpha=0.25), Rc(20, 250, 10, 200, 'green', 'green', alpha=0.4), Rc(20, 100, 10, 150, 'accent', 'accent', alpha=0.2)]
geo('biomes_climate', 'Climate (temperature and rainfall) largely decides which biome grows: cold = tundra/boreal forest, wet and warm = rainforest, dry = desert or grassland. A rough sketch of the Whittaker diagram; drag the climate point.',
    [-15, 30, 0, 450],
    rects + [T(-10, 50, 'tundra', 'white', 10), T(0, 60, 'boreal', 'white', 10), T(12, 170, 'temperate forest', 'white', 10), T(15, 50, 'grassland', 'white', 10), T(24, 12, 'desert', 'white', 10), T(25, 350, 'rainforest', 'white', 10), T(25, 175, 'seasonal forest', 'white', 9),
             Pt('Tm', 'Pr', 'gold', 8)],
    params=[P('Tm', 'mean temperature', -15, 30, 15, '°C'), P('Pr', 'annual rainfall', 0, 450, 100, 'cm')], equal=False, aspect=0.75, axes=True)
S['biomes_climate']['shapes'] = [dict(s) for s in S['biomes_climate']['shapes']]

plot('fossils_paleontology', 'Radiocarbon dating works only for recent remains: carbon-14 (half-life 5730 yr) fades below measurable levels after ~50,000 years. Older fossils are dated from radioactive minerals in the surrounding volcanic rocks.',
     [F('2^(-x/5.73)', 'carbon-14 remaining', 'accent')], x=[0, 60], y=[1e-4, 1.2], logy=True, xlabel='age (thousand years)', ylabel='fraction of ¹⁴C left', hlines=[dict(y=0.002, label='practical limit ~50 kyr', color='pink')],
     params=[P('age', 'age', 0, 60, 20, 'kyr')], points=[dict(x='age', y='2^(-age/5.73)')], readouts=[R('left', '100*2^(-age/5.73)', '%')])

bars('energy_systems', 'Where the world\'s primary energy comes from (share, about 2022, approximate): fossil fuels still supply roughly 80%. Hydro, nuclear and wind/solar/other renewables fill most of the rest. Shares are changing as renewables grow.',
     [('oil', 31.6, 'dim'), ('coal', 26.7, 'dim'), ('gas', 23.5, 'dim'), ('hydro', 6.7, 'accent'), ('nuclear', 4.0, 'gold'), ('wind, solar, other', 7.5, 'green')], ylabel='% of world primary energy')
S['energy_systems']['bars'][5]['label'] = 'wind+solar'

pop_h = [(1800, 1.0), (1900, 1.65), (1927, 2.0), (1950, 2.5), (1960, 3.0), (1974, 4.0), (1987, 5.0), (1999, 6.0), (2011, 7.0), (2022, 8.0)]
pop_p = [(2022, 8.0), (2050, 9.7)]
plot('demography_agriculture', 'World population took all of history to reach 1 billion (about 1800), then added the next billions ever faster, helped by agriculture and the Haber–Bosch fertiliser. Growth is now slowing; the 2050 value is a UN projection and uncertain.',
     [F(pwl(pop_h), 'estimates', 'accent'), F(pwl(pop_p), 'UN medium projection', 'pink', dash=True)], x=[1800, 2050], y=[0, 11], xlabel='year', ylabel='population (billions)')

blocks('symmetry_conservation_summary', 'Each continuous symmetry matches a conserved quantity (Noether). Symmetries that are only approximate or broken (like parity in the weak force) give quantities that are not always conserved.',
       [('a', 'Time shift', 14, 10), ('b', 'Space shift', 14, 32), ('c', 'Rotation', 14, 54), ('d', 'Phase (U(1))', 14, 76), ('e', 'Mirror (parity)', 14, 96, 'pink'),
        ('e1', 'Energy', 86, 10, 'gold'), ('f1', 'Momentum', 86, 32, 'gold'), ('g1', 'Angular mom.', 86, 54, 'gold'), ('h1', 'Charge', 86, 76, 'gold'), ('i1', 'Parity (violated by weak force)', 80, 96, 'pink')],
       [('a', 'e1'), ('b', 'f1'), ('c', 'g1'), ('d', 'h1'), ('e', 'i1')], flow=False, aspect=0.85)
S['symmetry_conservation_summary']['nodes'][9]['label'] = 'Parity (weak: no)'; 

blocks('string_theory_holography', 'String theory replaces point particles with tiny vibrating strings, and the AdS/CFT duality says a gravity theory in a volume equals a quantum theory without gravity on its boundary. Both are mathematically rich, but untested by experiment.',
       [('s', 'Strings (vibration = particle type)', 50, 10, 'gold'), ('b', 'Gravity in AdS volume', 14, 70, 'accent'), ('c', 'Quantum theory on boundary (CFT)', 86, 70, 'pink'), ('t', 'No experimental test yet', 50, 94, 'dim')],
       [('s', 'b'), ('s', 'c'), ('b', 'c', 'dual'), ('c', 'b', '', True)], flow=False, aspect=0.7)
S['string_theory_holography']['nodes'][0]['label'] = 'Vibrating strings'; S['string_theory_holography']['nodes'][2]['label'] = 'Boundary theory (CFT)'; S['string_theory_holography']['nodes'][1]['label'] = 'Gravity in AdS'
S['string_theory_holography']['edges'] = [{'from': 's', 'to': 'b'}, {'from': 's', 'to': 'c'}, {'from': 'b', 'to': 'c', 'label': 'equivalent'}]

add('loop_quantum_gravity', dict(type='graph', layout='circle', nodes=[dict(id=str(i)) for i in range(6)], edges=[[str(i), str((i + 1) % 6), 'j'] for i in range(6)] + [['0', '3'], ['1', '4'], ['2', '5']],
    caption='In loop quantum gravity space is a network of discrete links (a "spin network"): area and volume come in indivisible units of order the Planck scale. One of several candidates for quantum gravity (with strings, causal sets and others); none is confirmed.'))
S['loop_quantum_gravity']['edges'] = [e[:2] for e in S['loop_quantum_gravity']['edges']]

hub('machine_consciousness', 'Whether a machine could be conscious depends on what consciousness is, which is unsettled. Views differ: computation might suffice, hardware might matter, or life itself might be required. No test exists.',
    'Could machines be conscious?', ['Functionalism: right computation is enough', 'IIT: physical causal structure matters', 'Biological: life is required', 'Illusionism: no hard problem'], colors=['accent', 'pink', 'green', 'gold'], aspect=0.9)
S['machine_consciousness']['nodes'][1]['label'] = 'Functionalism'; S['machine_consciousness']['nodes'][2]['label'] = 'IIT (hardware)'; S['machine_consciousness']['nodes'][3]['label'] = 'Biological only'; S['machine_consciousness']['nodes'][4]['label'] = 'Illusionism'
