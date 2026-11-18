import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image
async def main(frm, n, out):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1460,'height':1000})
        await pg.goto(f'http://127.0.0.1:8792/tools/viz/viztest.html?file=ee_a.json&from={frm}&n={n}')
        await pg.wait_for_timeout(3000)
        err = await pg.evaluate('window.VIZ_ERRORS||[]')
        print('errors', err)
        await pg.screenshot(path=out, full_page=True)
        await b.close()
    im = Image.open(out); w,h = im.size
    im = im.resize((int(w*.6), int(h*.6))); im.save(out)
    print(im.size)
asyncio.run(main(int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]))
