from lib import *
S = {}
S['lung_l'] = plot([fn('2.4+VT*(0.5-0.5*cos(2*pi*f*x/60))', 'lung volume (L)', 'accent')], [0, 20], [0, 6.5],
    'Air volume rises and falls with each breath around the resting level of about 2.4 L. Try deeper or faster breathing and watch minute ventilation change.',
    'time (s)', 'volume (L)', [P('VT', 'tidal volume', 0.3, 3.0, 0.5, 'L'), P('f', 'breathing rate', 6, 40, 14, '/min')],
    [R('minute ventilation', 'VT*f', 'L/min'), R('alveolar ventilation', '(VT-0.15)*f', 'L/min')], hlines=[{'y': 6, 'label': 'total capacity ~6 L'}, {'y': 1.2, 'label': 'residual ~1.2 L'}])
S['lung_l']['x'] = [0, 20]
S['breathing'] = plot([fn('104-64*exp(-x/tau)', 'blood oxygen (mmHg)', 'pink')], [0, 0.8], [30, 115],
    'Red cells pick up oxygen within about a quarter of a second of their 0.75 s trip past an alveolus, leaving a safety margin. Thicken the barrier (disease) or shorten the transit time (hard exercise) and the margin shrinks.',
    'time in the capillary (s)', 'PO2 (mmHg)', [P('tau', 'diffusion delay (barrier)', 0.04, 0.4, 0.1, 's'), P('tc', 'capillary transit time', 0.25, 0.9, 0.75, 's')],
    [R('PO2 leaving the lung', '104-64*exp(-tc/tau)', 'mmHg')], vlines=[{'x': 'tc', 'label': 'exit'}], hlines=[{'y': 104, 'label': 'alveolar air 104'}, {'y': 40, 'label': 'venous blood 40'}])
S['diaphragm'] = plot([fn('-5-3*VD*(0.5-0.5*cos(2*pi*f*x/60))', 'pleural pressure (cmH2O)', 'gold'), fn('-VD*1.2*sin(2*pi*f*x/60)', 'alveolar pressure (cmH2O)', 'accent')], [0, 20], [-12, 4],
    'When the diaphragm contracts it flattens and pulls pleural pressure more negative, which drops alveolar pressure below atmospheric and draws air in. Quiet breathing moves it about 1.5 cm; deep breaths about 7 cm.',
    'time (s)', 'cmH2O (0 = atmosphere)', [P('VD', 'effort', 0.5, 3, 1, 'x quiet'), P('f', 'rate', 6, 30, 14, '/min')], [R('diaphragm travel', '1.5*VD', 'cm')], hlines=[{'y': 0, 'label': ''}])
S['nose_airway'] = plot([fn('37-(37-Ta)*exp(-x/8)', 'inspired air temperature (°C)', 'accent')], [0, 30], [-5, 40],
    'Warm, moist mucosa heats and humidifies air so it reaches the lungs near body temperature and nearly 100% humidity. Cold air takes farther to warm up; slide the outside temperature.',
    'distance from nostril (cm)', '°C', [P('Ta', 'outside air', -10, 35, 10, '°C')], [R('temperature 15 cm down', '37-(37-Ta)*exp(-15/8)', '°C')], hlines=[{'y': 37, 'label': 'body 37 °C'}])
S['larynx'] = plot([fn('sqrt(sig*1000/1040)/(2*x*0.001)', 'pitch of vibrating fold (Hz)', 'pink')], [8, 26], [0, 400],
    'The vocal folds vibrate like a string: shorter or tighter folds give a higher pitch. Adult male folds are about 17-25 mm, female about 12-17 mm. Slide the tension.',
    'fold length (mm)', 'Hz', [P('sig', 'tissue stress (tension)', 6, 40, 17, 'kPa'), P('L', 'fold length', 9, 25, 17, 'mm')],
    [R('your pitch', 'sqrt(sig*1000/1040)/(2*L*0.001)', 'Hz')], points=[{'x': 'L', 'y': 'sqrt(sig*1000/1040)/(2*L*0.001)', 'label': ''}])
S['trachea'] = flow(['dust or germ', 'sticks to mucus', 'cilia beat', 'mucus moves up', 'swallowed/coughed'],
    'About 100 million cilia-covered cells sweep a mucus blanket up the airway (roughly 1 cm per minute), carrying trapped dust and germs to the throat. The C-shaped rings keep the tube open.', cols=2, colors={2: 'gold'})
rad = 'z'
S['bronchi'] = plot([fn('2^x', 'number of airways', 'accent'), fn('2^x*pi/4*(' + pw([(0, 1.8), (1, 1.22), (2, .83), (3, .56), (4, .45), (5, .35), (6, .28), (8, .186), (10, .13), (12, .1), (16, .06), (20, .045), (23, .041)]) + ')^2', 'total cross-section (cm²)', 'gold')],
    [0, 23], [1, 2e7], 'Each branching (generation) doubles the airway count. The tubes shrink, but the total cross-section grows from 2.5 cm² in the trachea to thousands of cm² at the end, so air slows to a crawl in the deep lung.',
    'branching generation (0 = trachea)', 'log scale', logy=True, readouts=[R('airways at generation 16', '2^16'), R('airways at generation 23', '2^23')])
S['bronchioles'] = plot([fn('100/(1-x/100)^4', 'resistance to airflow (% of normal)', 'pink')], [0, 70], [0, 1000],
    'Resistance goes as 1 over radius to the fourth power, so a small narrowing (asthma, mucus) raises it a lot: halving the radius makes breathing 16 times harder. Slide the constriction.',
    'airway narrowing (%)', '% of normal', [P('c', 'narrowing', 0, 70, 30, '%')], [R('resistance', '100/(1-c/100)^4', '%'), R('airflow', '100*(1-c/100)^4', '% of normal')],
    points=[{'x': 'c', 'y': '100/(1-c/100)^4', 'label': ''}])
S['alveoli'] = plot([fn('2000*70/x/98', 'no surfactant (T = 70 mN/m)', 'pink'), fn('2000*T/x/98', 'with surfactant', 'accent')], [40, 150], [0, 40],
    'Surface tension tries to collapse alveoli, and the pressure needed goes as 2T/r, worst for the smallest sacs. Surfactant slashes T so small and large alveoli can stay open together. Slide the tension.',
    'alveolar radius (µm)', 'cmH2O', [P('T', 'tension with surfactant', 5, 70, 15, 'mN/m')], [R('pressure at r = 100 µm', '2000*T/100/98', 'cmH2O')])
