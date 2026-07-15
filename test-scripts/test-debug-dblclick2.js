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

    const pageInfo = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        return { x: rect.left + 50, y: rect.top + 50, width: rect.width, height: rect.height };
    });
    console.log('Page:', pageInfo);

    // Add debug listener
    await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        pageDiv.addEventListener('dblclick', function(e) {
            console.log('DBLCLICK:', {
                target: e.target.className,
                targetId: e.target.id || 'no-id',
                clientX: e.clientX,
                clientY: e.clientY,
            });
        });
    });

    // First double-click
    console.log('\nFirst double-click at:', pageInfo.x, pageInfo.y);
    await page.mouse.move(pageInfo.x, pageInfo.y);
    await page.mouse.down({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.down({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 500));

    let spans1 = await page.evaluate(() => document.querySelectorAll('.text-span').length);
    console.log('Spans after first:', spans1);

    // Second double-click at a different location
    console.log('\nSecond double-click at:', pageInfo.x + 400, pageInfo.y + 200);
    await page.mouse.move(pageInfo.x + 400, pageInfo.y + 200);
    await page.mouse.down({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.down({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 500));

    let spans2 = await page.evaluate(() => document.querySelectorAll('.text-span').length);
    console.log('Spans after second:', spans2);

    // Third double-click at yet another location
    console.log('\nThird double-click at:', pageInfo.x + 100, pageInfo.y + 400);
    await page.mouse.move(pageInfo.x + 100, pageInfo.y + 400);
    await page.mouse.down({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.down({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 500));

    let spans3 = await page.evaluate(() => document.querySelectorAll('.text-span').length);
    console.log('Spans after third:', spans3);

    await browser.close();
})();
