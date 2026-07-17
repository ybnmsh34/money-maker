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

    const info = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        const spans = document.querySelectorAll('.text-span');
        // Find spans near bottom
        const bottomSpans = Array.from(spans).filter(s => {
            const top = parseFloat(s.style.top);
            return top > rect.height - 100;
        }).map(s => ({
            text: s.textContent.substring(0, 40),
            top: parseFloat(s.style.top),
            left: parseFloat(s.style.left),
            meta: s._meta,
        }));
        return {
            pageHeight: rect.height,
            pageWidth: rect.width,
            bottomSpans,
            totalSpans: spans.length,
        };
    });
    console.log('Page info:', JSON.stringify(info, null, 2));

    // Try double-clicking on an existing span near the bottom
    const bottomSpan = info.bottomSpans[info.bottomSpans.length - 1];
    console.log('Bottom span:', bottomSpan);

    // Click on that span and press Enter
    if (bottomSpan) {
        await page.mouse.click(bottomSpan.left + 10, bottomSpan.top + 10);
        await new Promise(r => setTimeout(r, 300));

        // Press Enter (should split the span)
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 500));

        const after = await page.evaluate(() => {
            const spans = document.querySelectorAll('.text-span');
            const pages = document.querySelectorAll('.pdf-page');
            const focused = document.activeElement;
            return {
                totalPages: pages.length,
                totalSpans: spans.length,
                focusedIsSpan: focused && focused.classList.contains('text-span'),
            };
        });
        console.log('After Enter:', after);
    }

    await browser.close();
})();
