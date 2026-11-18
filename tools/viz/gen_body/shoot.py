import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image
async def main(frm, n, tag):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 1460, 'height': 1000})
        await pg.goto(f'http://127.0.0.1:8794/tools/viz/viztest.html?file=body.json&from={frm}&n={n}')
        await pg.wait_for_timeout(3000)
        print(frm, 'errors', await pg.evaluate('window.VIZ_ERRORS || []'))
        raw = f'/tmp/raw_{tag}.png'
        await pg.screenshot(path=raw, full_page=True)
        await b.close()
    im = Image.open(raw).convert('RGB')
    im = im.resize((int(im.width * .62), int(im.height * .62)))
    h = 640; k = 0
    for y in range(0, im.height, h):
        im.crop((0, y, im.width, min(y + h, im.height))).save(f'/tmp/shot_{tag}_{k}.png'); k += 1
    print('parts', k)
asyncio.run(main(int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]))
