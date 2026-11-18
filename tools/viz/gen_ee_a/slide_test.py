import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1460,'height':1000})
        await pg.goto('http://127.0.0.1:8792/tools/viz/viztest.html?file=ee_a.json&from=0&n=189')
        await pg.wait_for_timeout(4000)
        print('initial errors', await pg.evaluate('window.VIZ_ERRORS||[]'), 'cards', await pg.evaluate('document.querySelectorAll(".c").length'))
        for which in ('min','max'):
            await pg.evaluate("""(w)=>{document.querySelectorAll('.vzc input[type=range]').forEach(i=>{i.value = w==='min'?i.min:i.max; i.dispatchEvent(new Event('input'))})}""", which)
            await pg.wait_for_timeout(1500)
            print(which, 'errors', await pg.evaluate('window.VIZ_ERRORS||[]'))
        await b.close()
asyncio.run(main())
