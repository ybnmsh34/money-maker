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
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
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

    const initialPages = await page.evaluate(() => document.querySelectorAll('.pdf-page').length);
    console.log('Initial pages:', initialPages);

    // =============================================
    // SCENARIO 1: Enter near bottom of last page → new page
    // =============================================
    console.log('\n=== SCENARIO 1: Enter near bottom of last page → new page ===');

    // Scroll to bottom of page
    await page.evaluate(() => {
        document.getElementById('pdf-page-1').scrollIntoView({ behavior: 'instant', block: 'end' });
    });
    await new Promise(r => setTimeout(r, 500));

    // Double-click near bottom to create a span
    const pageInfo = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        return { x: rect.left + 100, y: rect.top + rect.height - 60 };
    });

    await doubleClick(page, pageInfo.x, pageInfo.y);
    await page.keyboard.type('Bottom text here');
    await new Promise(r => setTimeout(r, 300));

    // Press Enter (should create new page since we're near bottom)
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));

    let result1 = await page.evaluate(() => {
        const pages = document.querySelectorAll('.pdf-page');
        const thumbs = document.querySelectorAll('.page-thumb');
        const spans = document.querySelectorAll('.text-span');
        const focused = document.activeElement;
        return {
            totalPages: pages.length,
            totalThumbs: thumbs.length,
            totalSpans: spans.length,
            focusedIsSpan: focused && focused.classList.contains('text-span'),
            focusedPageNum: focused && focused.dataset.page,
            focusedHasNewTag: focused && focused.dataset.newText === 'true',
        };
    });
    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log(result1.totalPages > initialPages ? '✅ PASS (new page created)' : '❌ FAIL');

    await page.screenshot({ path: 'C:/pi-agent/test-newpage-scenario1.png', fullPage: false });

    // =============================================
    // SCENARIO 2: Verify new page has content and thumbnail
    // =============================================
    console.log('\n=== SCENARIO 2: Verify new page structure ===');

    let result2 = await page.evaluate(() => {
        const newPage = document.getElementById('pdf-page-2');
        return {
            newPageExists: !!newPage,
            newPageHasSpan: newPage && newPage.querySelectorAll('.text-span').length > 0,
            newSpanText: newPage ? newPage.querySelector('.text-span').textContent : 'N/A',
            thumbCount: document.querySelectorAll('.page-thumb').length,
        };
    });
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log(result2.newPageExists && result2.newPageHasSpan ? '✅ PASS' : '❌ FAIL');

    // Scroll to new page and screenshot
    await page.evaluate(() => document.getElementById('pdf-page-2')?.scrollIntoView({ behavior: 'instant' }));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/pi-agent/test-newpage-scenario2.png', fullPage: false });

    // =============================================
    // SCENARIO 3: Enter in middle of page (should NOT create new page)
    // =============================================
    console.log('\n=== SCENARIO 3: Enter in middle of page → NO new page ===');
    const before3 = result1.totalPages;

    // Double-click in middle of page 1 (scroll to top first)
    await page.evaluate(() => {
        document.getElementById('pdf-page-1').scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 500));

    const middleInfo = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        return { x: rect.left + 100, y: rect.top + 200 };
    });

    await doubleClick(page, middleInfo.x, middleInfo.y);
    await page.keyboard.type('Middle');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    let result3 = await page.evaluate(() => ({
        totalPages: document.querySelectorAll('.pdf-page').length,
    }));
    console.log('Result:', JSON.stringify(result3, null, 2));
    console.log(result3.totalPages === before3 ? '✅ PASS (no new page)' : '❌ FAIL');

    console.log('\n=== ALL SCENARIOS COMPLETE ===');
    await browser.close();
})();
