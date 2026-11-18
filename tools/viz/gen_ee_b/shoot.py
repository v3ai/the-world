import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image
async def main(batches, n=24, file="ee_b.json"):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1460,'height':1000})
        for fr in batches:
            await pg.goto(f"http://127.0.0.1:8793/tools/viz/viztest.html?file={file}&from={fr}&n={n}")
            await pg.wait_for_timeout(3000)
            errs = await pg.evaluate("window.VIZ_ERRORS||[]")
            print(fr, "errors:", errs)
            path=f"/tmp/eeb_{fr}.png"
            await pg.screenshot(path=path, full_page=True)
            im=Image.open(path); h=im.height//2
            for k,(a,b2) in enumerate([(0,h),(h,im.height)]):
                c=im.crop((0,a,im.width,b2)); c=c.resize((int(c.width*0.72),int(c.height*0.72))); c.save(f"/tmp/eeb_{fr}_{k}.png")
        await b.close()
asyncio.run(main([int(a) for a in sys.argv[1:]]))
