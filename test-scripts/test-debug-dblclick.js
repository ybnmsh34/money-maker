const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    page.on('console', msg => console.log('CONSOLE:', msg.text()));

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.waitForSelector('#fileInput', { timeout: 10000 });
    await page.$('#fileInput').then(f => f.uploadFile(path.resolve('./files for tests/Resume.pdf')));
    await page.waitForSelector('#editorArea', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('.text-span').length > 0, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Add debug listeners to viewer and page
    await page.evaluate(() => {
        const viewer = document.getElementById('viewer');
        const pageDiv = document.getElementById('pdf-page-1');

        viewer.addEventListener('dblclick', function(e) {
            console.log('DBLCLICK on VIEWER, target:', e.target.className, e.target.id);
        }, true); // capture phase

        viewer.addEventListener('dblclick', function(e) {
            console.log('DBLCLICK on VIEWER (bubble), target:', e.target.className, e.target.id);
        });

        pageDiv.addEventListener('dblclick', function(e) {
            console.log('DBLCLICK on PAGE!', e.target.className);
        }, true);
    });

    // Get page position
    const pageInfo = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        return { x: rect.left + 50, y: rect.top + 50 };
    });
    console.log('Clicking at:', pageInfo);

    // Try clicking with a small delay
    await page.mouse.move(pageInfo.x, pageInfo.y);
    await new Promise(r => setTimeout(r, 200));
    await page.mouse.down({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.down({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 1000));

    const info = await page.evaluate(() => ({
        totalSpans: document.querySelectorAll('.text-span').length,
    }));
    console.log('After:', info);

    await browser.close();
})();
