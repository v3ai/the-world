import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    frm = int(sys.argv[1]); n = int(sys.argv[2]) if len(sys.argv) > 2 else 24
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 1460, 'height': 1000})
        await pg.goto('http://127.0.0.1:8797/tools/viz/viztest.html?file=bio_b.json&from=%d&n=%d' % (frm, n))
        await pg.wait_for_timeout(3000)
        err = await pg.evaluate('window.VIZ_ERRORS||[]')
        print('errors', err)
        await pg.screenshot(path='/tmp/bb_%03d.png' % frm, full_page=True)
        await b.close()
asyncio.run(main())
