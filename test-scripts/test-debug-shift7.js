const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    page.on('console', msg => {
        const t = msg.text();
        if (t.includes('OVERFLOW')) console.log('CONSOLE:', t);
    });

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

    // Press Enter 10 times
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 500));

    const result = await page.evaluate(() => {
        const pages = document.querySelectorAll('.pdf-page');
        const spansPerPage = {};
        document.querySelectorAll('.text-span').forEach(s => {
            const p = s.dataset.page;
            spansPerPage[p] = (spansPerPage[p] || 0) + 1;
        });
        return { totalPages: pages.length, spansPerPage };
    });
    console.log('Result:', JSON.stringify(result, null, 2));

    await browser.close();
})();
