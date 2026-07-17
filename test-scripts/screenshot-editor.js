const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    // Check for JS errors
    const errors = await page.evaluate(() => window.__errors || []);
    console.log('JS Errors:', errors);
    await page.screenshot({ path: 'C:/pi-agent/editor-test.png', fullPage: false });
    console.log('Screenshot saved to C:/pi-agent/editor-test.png');
    await browser.close();
})();
