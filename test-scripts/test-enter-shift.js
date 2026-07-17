const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

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

    // =============================================
    // SCENARIO 1: Enter in middle → text below shifts down, no overlap
    // =============================================
    console.log('\n=== SCENARIO 1: Enter in middle → text below shifts down ===');

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

    // Get positions BEFORE
    const beforePositions = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.text-span'))
            .map(s => ({ text: s.textContent.substring(0,20), top: parseFloat(s.style.top) }))
            .sort((a,b) => a.top - b.top);
    });

    // Press Enter
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    // Check: no overlapping
    const result1 = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span'))
            .sort((a,b) => parseFloat(a.style.top) - parseFloat(b.style.top));
        let noOverlap = true;
        for (let i = 0; i < spans.length - 1; i++) {
            const h = spans[i]._meta ? spans[i]._meta.height * zoom : parseFloat(spans[i].style.fontSize);
            const bottom = parseFloat(spans[i].style.top) + h;
            const nextTop = parseFloat(spans[i+1].style.top);
            if (bottom > nextTop + 2) {
                noOverlap = false;
            }
        }
        return { noOverlap, totalSpans: spans.length };
    });

    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log(result1.noOverlap ? '✅ PASS (no overlapping text)' : '❌ FAIL (overlapping detected)');

    await page.screenshot({ path: 'C:/pi-agent/money-maker/test-png/test-enter-shift-scenario1.png', fullPage: false });

    // =============================================
    // SCENARIO 2: Many Enters → text cascades to new pages
    // =============================================
    console.log('\n=== SCENARIO 2: Many Enters → text cascades to new pages ===');

    const beforePages = await page.evaluate(() => document.querySelectorAll('.pdf-page').length);
    console.log('Pages before:', beforePages);

    // Press Enter 50 times to push content to new pages
    for (let i = 0; i < 50; i++) {
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 1000));

    const result2 = await page.evaluate(() => {
        const pages = document.querySelectorAll('.pdf-page');
        const thumbs = document.querySelectorAll('.page-thumb');
        const spansPerPage = {};
        document.querySelectorAll('.text-span').forEach(s => {
            const p = s.dataset.page;
            spansPerPage[p] = (spansPerPage[p] || 0) + 1;
        });
        return {
            totalPages: pages.length,
            totalThumbs: thumbs.length,
            spansPerPage,
        };
    });
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log(result2.totalPages > beforePages ? '✅ PASS (new pages created)' : '❌ FAIL (no new pages)');

    // Scroll to last page
    await page.evaluate(() => {
        const lastPage = document.querySelector('.pdf-page:last-child');
        if (lastPage) lastPage.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/pi-agent/money-maker/test-png/test-enter-shift-scenario2.png', fullPage: false });

    // =============================================
    // SCENARIO 3: Export includes all pages with correct content
    // =============================================
    console.log('\n=== SCENARIO 3: Export includes all pages ===');

    const pdfBuffer = await page.evaluate(async () => {
        await exportPDF();
        const dl = document.getElementById('downloadLink');
        const resp = await fetch(dl.href);
        const buf = await resp.arrayBuffer();
        return Array.from(new Uint8Array(buf));
    });

    fs.writeFileSync('./test-png/test-export-cascade.pdf', Buffer.from(pdfBuffer));

    // Verify page count
    const PDFLib = require('pdf-lib');
    const buf = fs.readFileSync('./test-png/test-export-cascade.pdf');
    const doc = await PDFLib.PDFDocument.load(buf);
    console.log('Exported PDF pages:', doc.getPageCount());
    console.log(doc.getPageCount() === result2.totalPages ? '✅ PASS (page count matches)' : '❌ FAIL (page count mismatch)');

    console.log('\n=== ALL SCENARIOS COMPLETE ===');
    await browser.close();
})();
