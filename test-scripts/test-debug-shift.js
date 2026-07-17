const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
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

    // Get page dimensions
    const pageInfo = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        return {
            pageHeight: pageDiv.offsetHeight,
            rectHeight: rect.height,
        };
    });
    console.log('Page dimensions:', pageInfo);

    // Find a span in the middle and press Enter multiple times
    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span')).sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        const mid = spans[Math.floor(spans.length / 2)];
        const rect = mid.getBoundingClientRect();
        // Focus the span
        mid.focus();
        // Position cursor at end
        const range = document.createRange();
        range.setStart(mid, mid.childNodes.length || 1);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });
    await new Promise(r => setTimeout(r, 300));

    // Press Enter 5 times
    for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 300));
    }

    // Check spans near bottom
    const bottomSpans = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const pageH = pageDiv.offsetHeight;
        const spans = Array.from(document.querySelectorAll('.text-span'))
            .sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        const last10 = spans.slice(-10);
        return last10.map(s => ({
            text: s.textContent.substring(0,30),
            top: parseFloat(s.style.top),
            height: parseFloat(s.style.height),
            bottom: parseFloat(s.style.top) + parseFloat(s.style.height),
            pageNum: s.dataset.page,
            meta: s._meta,
        }));
    });
    console.log('Last 10 spans:', JSON.stringify(bottomSpans, null, 2));
    console.log('Page height:', pageInfo.pageHeight);

    // Check for overlap
    const overlapCheck = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span'))
            .sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        let overlaps = 0;
        for (let i = 0; i < spans.length - 1; i++) {
            const bottom = parseFloat(spans[i].style.top) + parseFloat(spans[i].style.height);
            const nextTop = parseFloat(spans[i+1].style.top);
            if (bottom > nextTop + 2) {
                overlaps++;
            }
        }
        return { totalSpans: spans.length, overlaps };
    });
    console.log('Overlap check:', overlapCheck);

    await page.screenshot({ path: 'C:/pi-agent/money-maker/test-png/test-debug-shift.png', fullPage: false });
    await browser.close();
})();
