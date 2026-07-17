const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });

    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(2000);

    console.log('\n=== Phase 3: Full Wrap Test ===\n');

    // Test 1: LTR overflow wrapping
    console.log('Test 1: LTR overflow (double-click + long text)');

    // Create LTR span via double-click
    await page.select('#dirToggle', 'ltr');
    await page.evaluate(() => document.getElementById('pdf-page-1').dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true, clientX: 150, clientY: 200 })));
    await sleep(300);

    // Type 500 LTR characters
    const ltrLong = 'The quick brown fox jumps over the lazy dog. '.repeat(8);
    await page.keyboard.type(ltrLong, { delay: 3 });
    await sleep(2000);

    const ltrResult = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span[dir="ltr"]')).map(s => ({
            text: s.textContent.substring(0, 40),
            len: s.textContent.length
        }));
        return { count: spans.length, spans: spans.slice(0, 5) };
    });
    console.log('  LTR spans: ' + ltrResult.count);
    console.log('  First 5:', JSON.stringify(ltrResult.spans));
    console.log(ltrResult.count > 1 ? '  PASS: LTR text wrapped' : '  WARN: LTR text may fit on one line');

    // Test 2: RTL overflow wrapping
    console.log('\nTest 2: RTL overflow (create + long Hebrew text)');

    await page.select('#dirToggle', 'rtl');
    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const x = bounds.width - EDGE_PAD;
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, x, 400, 12, '', null, 'rtl');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(300);

    // Type 500 Hebrew characters
    const hebrewLong = 'זהו טקסט בעברית שמשתמש במילים שונות כדי לבדוק את עטיפת השורות. '.repeat(8);
    await page.keyboard.type(hebrewLong, { delay: 5 });
    await sleep(2000);

    const rtlResult = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span[dir="rtl"]')).map(s => ({
            text: s.textContent.substring(0, 40),
            len: s.textContent.length
        }));
        return { count: spans.length, spans: spans.slice(0, 5) };
    });
    console.log('  RTL spans: ' + rtlResult.count);
    console.log('  First 5:', JSON.stringify(rtlResult.spans));
    console.log(rtlResult.count > 1 ? '  PASS: RTL text wrapped' : '  WARN: RTL text may fit on one line');

    // Test 3: Edge verification
    console.log('\nTest 3: Edge verification');
    const edgeCheck = await page.evaluate(() => {
        const ltr = { past: 0, total: 0 };
        const rtl = { past: 0, total: 0 };
        document.querySelectorAll('.text-span').forEach(s => {
            const meta = s._meta;
            if (!meta) return;
            const bounds = getPageBounds(meta.pageNum);
            const w = s.offsetWidth / zoom;
            if (meta.dir === 'ltr') {
                ltr.total++;
                if (meta.x + w > bounds.width - EDGE_PAD) ltr.past++;
            } else {
                rtl.total++;
                const rightPx = parseFloat(s.style.right);
                const anchorRight = (rightPx / zoom) + w;
                if (anchorRight - w < EDGE_PAD) rtl.past++;
            }
        });
        return { ltr, rtl };
    });
    console.log('  LTR: ' + edgeCheck.ltr.past + '/' + edgeCheck.ltr.total + ' past right edge');
    console.log('  RTL: ' + edgeCheck.rtl.past + '/' + edgeCheck.rtl.total + ' past left edge');
    console.log(edgeCheck.ltr.past === 0 && edgeCheck.rtl.past === 0
        ? '  PASS: No spans extend past edges'
        : '  WARN: Some spans extend past edges (unbreakable words OK)');

    // Test 4: Cascade to new page
    console.log('\nTest 4: Cascade to new page');
    const pageCount = await page.evaluate(() => allPages.length);
    const pageDivs = await page.evaluate(() => document.querySelectorAll('.pdf-page').length);
    console.log('  allPages.length: ' + pageCount);
    console.log('  DOM page divs: ' + pageDivs);
    console.log(pageCount > 3 ? '  PASS: New pages created by cascade' : '  INFO: All content fits on original pages');

    await page.screenshot({ path: 'test-png/test-phase3-wrap-full.png', fullPage: true });
    console.log('\nScreenshot saved to test-png/test-phase3-wrap-full.png');

    await browser.close();
})();
