const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => { if (msg.text().includes('Phase') || msg.text().includes('pdf-page')) console.log('  CONSOLE:', msg.text()); });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });

    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(2000);

    console.log('\n=== Phase 3 RTL Debug ===\n');

    // Set direction to RTL
    await page.select('#dirToggle', 'rtl');
    await sleep(200);

    // Escape from any focused element
    await page.keyboard.press('Escape');
    await sleep(200);

    // Scroll to top to ensure page is visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(200);

    // Get the FIRST page div
    const firstPage = await page.$('#pdf-page-1');
    const firstBox = await firstPage.boundingBox();
    console.log('First page box:', JSON.stringify(firstBox));

    // Click well within the first page (center-ish, below the existing text)
    const cx = firstBox.x + firstBox.width * 0.3;
    const cy = firstBox.y + firstBox.height * 0.4;
    console.log('Clicking at:', cx, cy);

    // Use evaluate to dispatch dblclick on the page element directly
    const result = await page.evaluate(() => {
        const pageEl = document.getElementById('pdf-page-1');
        if (!pageEl) return 'no page element';
        pageEl.dispatchEvent(new MouseEvent('dblclick', {
            bubbles: true,
            clientX: 300,
            clientY: 300
        }));
        return 'dblclick dispatched';
    });
    console.log('Dispatch result:', result);
    await sleep(500);

    // Check if span was created
    const spanCount = await page.evaluate(() => {
        return {
            total: document.querySelectorAll('.text-span').length,
            rtl: document.querySelectorAll('.text-span[dir="rtl"]').length,
            ltr: document.querySelectorAll('.text-span[dir="ltr"]').length,
            focused: document.activeElement ? document.activeElement.className : 'none'
        };
    });
    console.log('Span counts after double-click:', JSON.stringify(spanCount));

    // Try creating span directly via evaluate with correct RTL anchor
    await page.evaluate(() => {
        const pageEl = document.getElementById('pdf-page-1');
        const bounds = getPageBounds(1);
        const x = bounds.width - EDGE_PAD; // anchorRight at right margin
        const newSpan = createNewSpan(1, x, 200, 12, '', null, 'rtl');
        pageEl.appendChild(newSpan);
        newSpan.focus();
    });
    await sleep(200);

    const afterCreate = await page.evaluate(() => {
        return {
            total: document.querySelectorAll('.text-span').length,
            rtl: document.querySelectorAll('.text-span[dir="rtl"]').length,
            last: (() => {
                const spans = document.querySelectorAll('.text-span');
                const s = spans[spans.length - 1];
                return s ? { dir: s.getAttribute('dir'), text: s.textContent, right: s.style.right, left: s.style.left } : null;
            })()
        };
    });
    console.log('After manual create:', JSON.stringify(afterCreate));

    // Type RTL text into the newly created span
    await page.keyboard.type('זהו שורה ארוכה מאוד של טקסט בעברית שצריכה לחרוג מהגבול של הדף לגרום לעטיפה', { delay: 12 });
    await sleep(2000);

    const finalCount = await page.evaluate(() => {
        const spans = [];
        document.querySelectorAll('.text-span').forEach(s => {
            spans.push({
                dir: s.getAttribute('dir'),
                text: s.textContent.substring(0, 30),
                right: s.style.right,
                left: s.style.left
            });
        });
        return {
            total: spans.length,
            rtl: document.querySelectorAll('.text-span[dir="rtl"]').length,
            lastFew: spans.slice(-4)
        };
    });
    console.log('Final counts:', JSON.stringify(finalCount));
    console.log('Last 4 spans:', JSON.stringify(finalCount.lastFew));

    await page.screenshot({ path: 'test-png/test-phase3-rtl-debug.png', fullPage: true });
    console.log('\nScreenshot saved to test-png/test-phase3-rtl-debug.png');

    await browser.close();
})();
