const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.waitForSelector('#fileInput', { timeout: 10000 });
    await page.$('#fileInput').then(f => f.uploadFile(path.resolve('./files for tests/Resume.pdf')));
    await page.waitForSelector('#editorArea', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('.text-span').length > 0, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Focus on middle span and press Enter
    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span')).sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        const mid = spans[Math.floor(spans.length / 2)];
        mid.focus();
        const range = document.createRange();
        range.setStart(mid, mid.childNodes.length || 1);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });
    await new Promise(r => setTimeout(r, 300));

    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    // Find overlaps
    const result = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span'))
            .sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        const overlaps = [];
        for (let i = 0; i < spans.length - 1; i++) {
            const h = spans[i]._meta ? spans[i]._meta.height * zoom : parseFloat(spans[i].style.fontSize);
            const bottom = parseFloat(spans[i].style.top) + h;
            const nextTop = parseFloat(spans[i+1].style.top);
            if (bottom > nextTop + 2) {
                overlaps.push({
                    span1: spans[i].textContent.substring(0,30),
                    bottom1: bottom.toFixed(1),
                    span2: spans[i+1].textContent.substring(0,30),
                    top2: nextTop.toFixed(1),
                    overlap: (bottom - nextTop).toFixed(1),
                });
            }
        }
        return { totalSpans: spans.length, overlaps };
    });
    console.log('Result:', JSON.stringify(result, null, 2));

    await browser.close();
})();
