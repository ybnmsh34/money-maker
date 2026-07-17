const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Disable ALL caching
    await page.setCacheEnabled(false);
    
    // Block and override CSS to ensure fresh load
    await page.setRequestInterception(true);
    page.on('request', req => {
        if (req.resourceType() === 'stylesheet' || req.resourceType() === 'script') {
            req.continue({ headers: { ...req.headers(), 'cache-control': 'no-cache' } });
        } else {
            req.continue();
        }
    });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.waitForSelector('#heroSearch', { timeout: 5000 });
    
    await page.evaluate(() => {
        const input = document.getElementById('heroSearch');
        input.value = 'pdf';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Check computed styles
    const debug = await page.evaluate(() => {
        const dd = document.getElementById('searchDropdown');
        const cs = window.getComputedStyle(dd);
        const item = dd.querySelector('.search-dropdown-item');
        const csItem = item ? window.getComputedStyle(item) : null;
        return {
            ddBg: cs.backgroundColor,
            ddBgColor: cs.background,
            ddDisplay: cs.display,
            ddZIndex: cs.zIndex,
            ddPosition: cs.position,
            itemBg: csItem ? csItem.backgroundColor : 'N/A',
            itemBgFull: csItem ? csItem.background : 'N/A',
            ddHeight: dd.offsetHeight,
            ddWidth: dd.offsetWidth,
            ddTop: dd.offsetTop,
            ddLeft: dd.offsetLeft,
        };
    });
    
    console.log('Computed styles:', JSON.stringify(debug, null, 2));
    
    await page.screenshot({
        path: 'C:/pi-agent/search-dropdown-fixed.png',
        fullPage: false
    });
    
    console.log('Screenshot saved');
    await browser.close();
})();
