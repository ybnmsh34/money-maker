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

    // Focus on a span near the top
    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span')).sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        const top = spans[2];
        top.focus();
        const range = document.createRange();
        range.setStart(top, top.childNodes.length || 1);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });
    await new Promise(r => setTimeout(r, 300));

    // Press Enter 30 times
    for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 150));
    }
    await new Promise(r => setTimeout(r, 500));

    const result = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const pageH = pageDiv.offsetHeight;
        const spans = Array.from(document.querySelectorAll('.text-span'))
            .sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        const last10 = spans.slice(-10);
        const overflow = spans.filter(s => {
            const top = parseFloat(s.style.top);
            const h = s._meta ? s._meta.height : 13;
            return top + h > pageH - 10;
        });
        return {
            pageH,
            last10: last10.map(s => ({ text: s.textContent.substring(0,30), top: parseFloat(s.style.top), bottom: parseFloat(s.style.top) + (s._meta ? s._meta.height : 13) })),
            overflowCount: overflow.length,
            overflowTexts: overflow.map(s => s.textContent.substring(0,30)),
            totalPages: document.querySelectorAll('.pdf-page').length,
        };
    });
    console.log('Result:', JSON.stringify(result, null, 2));

    await browser.close();
})();
