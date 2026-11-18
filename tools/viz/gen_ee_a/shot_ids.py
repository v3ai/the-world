import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image
async def main(ids, out):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1460,'height':1000})
        await pg.goto(f'http://127.0.0.1:8792/tools/viz/gen_ee_a/viztest_ids.html?file=ee_a.json&ids={ids}')
        await pg.wait_for_timeout(3000)
        print('errors', await pg.evaluate('window.VIZ_ERRORS||[]'))
        await pg.screenshot(path=out, full_page=True)
        await b.close()
    im = Image.open(out); w,h = im.size
    im.resize((int(w*.6), int(h*.6))).save(out)
asyncio.run(main(sys.argv[1], sys.argv[2]))
