import asyncio, sys
from playwright.async_api import async_playwright
async def main(ids, out):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1460,'height':1000})
        import json
        m=json.load(open('data/viz/ee_b.json')); keys=list(m)
        idx=[keys.index(i) for i in ids]
        await pg.goto(f"http://127.0.0.1:8793/tools/viz/viztest.html?file=ee_b.json&from=0&n=300")
        await pg.wait_for_timeout(4000)
        cards=await pg.query_selector_all('.c')
        for i,k in zip(idx,ids):
            await cards[i].scroll_into_view_if_needed()
            await cards[i].screenshot(path=f"{out}/{k}.png")
        await b.close()
asyncio.run(main(sys.argv[2:], sys.argv[1]))
