const puppeteer = require('puppeteer');
const path = require('path');

async function doubleClick(page, x, y) {
    await page.mouse.move(x, y);
    await page.mouse.down({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.down({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 500));
}

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

    const initialSpans = await page.evaluate(() => document.querySelectorAll('.text-span').length);
    console.log('Initial spans:', initialSpans);

    const pageInfo = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        return { x: rect.left + 50, y: rect.top + 50, width: rect.width, height: rect.height };
    });

    // =============================================
    // SCENARIO 1: Double-click on empty white area
    // =============================================
    console.log('\n=== SCENARIO 1: Double-click on empty white area ===');
    await doubleClick(page, pageInfo.x, pageInfo.y);

    let result1 = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        const focused = document.activeElement;
        return {
            totalSpans: spans.length,
            focusedIsSpan: focused && focused.classList.contains('text-span'),
            focusedIsEmpty: focused && focused.textContent === '',
            focusedHasNewTag: focused && focused.dataset.newText === 'true',
        };
    });
    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log(result1.totalSpans > initialSpans && result1.focusedIsSpan ? '✅ PASS' : '❌ FAIL');

    await page.screenshot({ path: 'C:/pi-agent/money-maker/test-png/test-doubleclick-scenario1.png', fullPage: false });

    // =============================================
    // SCENARIO 2: Double-click on another empty spot
    // =============================================
    console.log('\n=== SCENARIO 2: Double-click on another empty spot ===');
    const before2 = result1.totalSpans;
    await doubleClick(page, pageInfo.x + 400, pageInfo.y + 200);

    let result2 = await page.evaluate(() => ({
        totalSpans: document.querySelectorAll('.text-span').length,
        newTagSpans: Array.from(document.querySelectorAll('.text-span')).filter(s => s.dataset.newText === 'true').length,
    }));
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log(result2.totalSpans > before2 ? '✅ PASS' : '❌ FAIL');

    // =============================================
    // SCENARIO 3: Double-click on existing text (should NOT create new span)
    // =============================================
    console.log('\n=== SCENARIO 3: Double-click on existing text (should NOT create new span) ===');
    const before3 = result2.totalSpans;

    await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        if (spans[0]) {
            const evt = new MouseEvent('dblclick', { bubbles: true });
            spans[0].dispatchEvent(evt);
        }
    });
    await new Promise(r => setTimeout(r, 500));

    let result3 = await page.evaluate(() => ({
        totalSpans: document.querySelectorAll('.text-span').length,
    }));
    console.log('Result:', JSON.stringify(result3, null, 2));
    console.log(result3.totalSpans === before3 ? '✅ PASS (no new span created)' : '❌ FAIL');

    await page.screenshot({ path: 'C:/pi-agent/money-maker/test-png/test-doubleclick-scenario3.png', fullPage: false });

    console.log('\n=== ALL SCENARIOS COMPLETE ===');
    await browser.close();
})();
