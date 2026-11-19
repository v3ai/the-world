"""Browser test of the player itself (not the content): list, starters on the help overlay, search, Next/Back, arrow keys,
wander and 'Return to this stop', Escape, resume, 'Asked here' on a card, phone layout. Writes screenshots to --shots.
Usage: python tools/trails/test_ui.py [--phone]"""
import sys, os, json, argparse
sys.path.insert(0, '/home/rhett/projects/how/.devtools/harness')
os.environ.setdefault('WT_URL', 'http://127.0.0.1:8153/index.html')
ap = argparse.ArgumentParser(); ap.add_argument('--phone', action='store_true')
ap.add_argument('--shots', default='/home/rhett/projects/how/.devtools/shots/trails/ui'); a = ap.parse_args()
os.environ['WT_SHOTS'] = a.shots
from wt import World
INSTANT = """(() => { window.flyTo = function (f, p, D, then) { jumpTo(f, p, D); fly = null; camHold = f; setTimeout(() => safeThen(then), 80); }; })()"""
res = []
def check(name, ok, info=''):
    res.append(ok); print(('PASS ' if ok else 'FAIL ') + name, info, flush=True)
sfx = '_phone' if a.phone else ''
size = (390, 844) if a.phone else (1280, 800)
with World(size=size, mobile=a.phone, start=False) as w:
    w.page.wait_for_function('typeof TRAILS !== "undefined" && TRAILS.list.length > 0', timeout=120000)
    w.settle(3)
    # 1. starters on the first-visit overlay (help is shown because nothing is stored)
    st = w.js("document.querySelectorAll('#help .starters button').length")
    check('help starters (3)', st == 3, st); w.shot('help' + sfx)
    w.begin()
    w.js(INSTANT)
    # 2. list
    w.js("document.querySelector('#bQuestions').click()"); w.settle(1)
    n = w.js("document.querySelectorAll('#questions .qitem').length"); tn = w.js('TRAILS.list.length'); check('list shows all trails', n == tn and tn > 0, n)
    w.shot('list' + sfx)
    # 3. search
    w.js("openLibrary(true)"); w.js("(() => { const q = document.querySelector('#libQ'); q.value = 'why is a leaf green'; libSearch(q.value); })()"); w.settle(1)
    txt = w.js("document.querySelector('#library').innerText")
    check('search finds the trail', 'Why is a leaf green?' in txt); w.shot('search' + sfx)
    w.js("closePops()")
    # 4. play, Next/Back, arrows
    w.js("TRAILS.start('what_am_i_made_of', 0)"); w.settle(4)
    check('panel open', w.js("document.querySelector('#trail').classList.contains('on')"))
    w.shot('play1' + sfx)
    if not a.phone:
        w.page.keyboard.press('ArrowRight'); w.settle(3)
        check('arrow right goes to stop 2', w.js('TRAILS.i') == 1, w.js('TRAILS.i'))
        w.page.keyboard.press('ArrowLeft'); w.settle(3)
        check('arrow left goes back', w.js('TRAILS.i') == 0)
    w.js("document.querySelector('#trail .next').click()"); w.settle(4); w.js("document.querySelector('#trail .next').click()"); w.settle(5)
    i = w.js('TRAILS.i'); check('Next advances', i == 2, i); w.shot('play3' + sfx)
    # 5. wander: zoom the camera far away, expect the Return button
    w.js("jumpTo(FR.park, new V3(0,1,0), 5000)"); w.settle(3)
    check('wandering shows Return', w.js("document.querySelector('#trail .tr-away').classList.contains('on')")); w.shot('wander' + sfx)
    w.js("document.querySelector('#trail .tr-ret').click()"); w.settle(4)
    check('Return goes back to the stop', not w.js("document.querySelector('#trail .tr-away').classList.contains('on')"))
    # 6. resume is remembered
    saved = w.js("JSON.parse(localStorage.getItem('cz3_trail_what_am_i_made_of'))"); check('last stop remembered', saved == 2, saved)
    # 7. Escape leaves
    w.page.keyboard.press('Escape'); w.settle(1)
    check('Escape leaves the trail', not w.js("document.querySelector('#trail').classList.contains('on')"))
    # 8. answer page and where next
    w.js("TRAILS.start('what_is_light', 4)"); w.settle(3); w.js("document.querySelector('#trail .next').click()"); w.settle(2)
    check('answer page', 'The answer' in w.js("document.querySelector('#trail').innerText")); w.shot('answer' + sfx)
    w.js("TRAILS.leave()")
    # 9. 'Asked here' on a card of a stop
    w.js("showBodyNode('oak_leaf', null)"); w.settle(1)
    check('Asked here link on a card', w.js("!!document.querySelector('#info .asked button')")); w.shot('asked' + sfx)
    print('errors', w.errors, 'player errors', w.js('TRAILS.errors'))
    check('no console errors', not w.errors)
print('DONE', 'ALL PASS' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
