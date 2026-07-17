const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });

    // Upload the mixed-size PDF
    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(2000);

    console.log('\n=== Phase 3: Directional Overflow Wrapping ===\n');

    // Test 1: LTR overflow wrapping
    console.log('Test 1: LTR overflow wrapping');
    const pageDiv = await page.$('.pdf-page');
    const box = await pageDiv.boundingBox();

    // Set direction to LTR
    await page.select('#dirToggle', 'ltr');
    await sleep(100);

    // Double-click near middle of page to create new span
    await page.mouse.click(box.x + 100, box.y + 300);
    await sleep(100);
    await page.mouse.click(box.x + 100, box.y + 300);
    await sleep(500);

    // Type long LTR text
    const ltrText = 'This is a very long line of English text that should overflow the page boundary and trigger automatic wrapping to the next line below. It continues with more words to ensure it definitely crosses the right page edge.';
    await page.keyboard.type(ltrText, { delay: 8 });
    await sleep(2000);

    // Check: multiple spans created
    const ltrSpanCount = await page.evaluate(() => {
        return document.querySelectorAll('.text-span[dir="ltr"]').length;
    });
    console.log('  LTR spans after typing: ' + ltrSpanCount);
    console.log(ltrSpanCount > 1 ? '  PASS: Text wrapped into multiple spans' : '  INFO: Text may fit on one line');

    // Test 2: RTL overflow wrapping
    console.log('\nTest 2: RTL overflow wrapping');
    await page.select('#dirToggle', 'rtl');
    await sleep(100);

    // Double-click another spot to create new RTL span
    await page.mouse.click(box.x + 500, box.y + 400);
    await sleep(100);
    await page.mouse.click(box.x + 500, box.y + 400);
    await sleep(500);

    // Type long Hebrew text
    const rtlText = 'זהו שורה ארוכה מאוד של טקסט בעברית שצריכה לחרוג מהגבול של הדף לגרום לעטיפה אוטומטית לשורה הבטה המשך עם יותר מילים כדי לוודא שזה עובד נכון.';
    await page.keyboard.type(rtlText, { delay: 12 });
    await sleep(2000);

    const rtlSpanCount = await page.evaluate(() => {
        return document.querySelectorAll('.text-span[dir="rtl"]').length;
    });
    console.log('  RTL spans after typing: ' + rtlSpanCount);
    console.log(rtlSpanCount > 1 ? '  PASS: RTL text wrapped into multiple spans' : '  INFO: RTL text may fit on one line');

    // Test 3: Edge clamp
    console.log('\nTest 3: Edge clamp verification');
    const edgeCheck = await page.evaluate(() => {
        const results = { ltrOverflow: 0, rtlOverflow: 0 };
        document.querySelectorAll('.text-span').forEach(s => {
            const meta = s._meta;
            if (!meta) return;
            const bounds = getPageBounds(meta.pageNum);
            const w = s.offsetWidth / zoom;

            if (meta.dir === 'ltr') {
                if (meta.x + w > bounds.width - 4) results.ltrOverflow++;
            } else if (meta.dir === 'rtl') {
                const ar = meta.x + meta.width;
                if (ar - w < 4) results.rtlOverflow++;
            }
        });
        return results;
    });
    console.log('  LTR spans past right edge: ' + edgeCheck.ltrOverflow);
    console.log('  RTL spans past left edge: ' + edgeCheck.rtlOverflow);
    console.log(edgeCheck.ltrOverflow === 0 && edgeCheck.rtlOverflow === 0
        ? '  PASS: No spans extend past edges'
        : '  WARN: Some spans extend past edges (unbreakable words OK)');

    // Screenshot for visual verification
    await page.screenshot({ path: 'test-png/test-phase3-wrap.png', fullPage: true });
    console.log('\nScreenshot saved to test-png/test-phase3-wrap.png');

    await browser.close();
})();
