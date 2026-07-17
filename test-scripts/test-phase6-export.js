const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => { if (msg.text().includes('Export') || msg.text().includes('Phase') || msg.text().includes('font')) console.log('  CONSOLE:', msg.text()); });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });

    // Upload Hebrew PDF
    const input = await page.$('#fileInput');
    const hebrewPdf = path.join(__dirname, '..', 'files for tests', 'חברת טבע - ניתוח.pdf');
    await input.uploadFile(hebrewPdf);
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(2000);

    console.log('\n=== Phase 6: Export (Hebrew fonts, bidi, Arabic block) ===\n');

    // Test 1: Hebrew RTL span creation + typing
    console.log('Test 1: Hebrew RTL span with digits');

    // Create RTL span directly via evaluate
    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const x = bounds.width - EDGE_PAD;
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, x, 600, 14, '', null, 'rtl');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(300);

    // Type Hebrew text with embedded digits
    const hebrewWithDigits = 'שולם 250 שח';
    await page.keyboard.type(hebrewWithDigits, { delay: 10 });
    await sleep(500);

    // Check the newly created span
    const domCheck = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span'));
        const newSpans = spans.filter(s => s.dataset.newText === 'true');
        if (newSpans.length === 0) return { count: 0, text: '' };
        const last = newSpans[newSpans.length - 1];
        return { count: newSpans.length, text: last.textContent, dir: last.getAttribute('dir') };
    });
    console.log('  New spans:', domCheck.count, 'dir:', domCheck.dir, 'text:', domCheck.text);
    console.log(domCheck.text.includes('250') ? '  PASS: Digits preserved' : '  FAIL: Digits missing');

    // Test 2: Export attempt (check font loading)
    console.log('\nTest 2: Export attempt');

    const exportResult = await page.evaluate(async () => {
        try {
            await exportPDF();
            return { success: true, error: null };
        } catch(e) {
            return { success: false, error: e.message };
        }
    });
    console.log(exportResult.success ? '  PASS: Export completed' : '  FAIL: Export failed - ' + exportResult.error);

    // Test 3: Arabic detection
    console.log('\nTest 3: Arabic text detection');
    const arabicTest = await page.evaluate(() => {
        return {
            arabic1: containsArabic('مرحبا'),
            arabic2: containsArabic('hello'),
            hebrew1: containsArabic('שלום')
        };
    });
    console.log('  Arabic text:', arabicTest.arabic1 ? 'detected ✓' : 'not detected ✗');
    console.log('  English text:', arabicTest.arabic2 ? 'false positive ✗' : 'clean ✓');
    console.log('  Hebrew text:', arabicTest.hebrew1 ? 'false positive ✗' : 'clean ✓');
    console.log(arabicTest.arabic1 && !arabicTest.arabic2 && !arabicTest.hebrew1
        ? '  PASS: Arabic detection accurate' : '  FAIL: Detection issues');

    // Test 4: Font files accessible
    console.log('\nTest 4: Font files accessible');
    const fontsOk = await page.evaluate(async () => {
        const results = {};
        try { const r1 = await fetch('../fonts/NotoSansHebrew-Regular.ttf'); results.regular = r1.ok; }
        catch(e) { results.regular = false; }
        try { const r2 = await fetch('../fonts/NotoSansHebrew-Bold.ttf'); results.bold = r2.ok; }
        catch(e) { results.bold = false; }
        return results;
    });
    console.log('  Regular:', fontsOk.regular ? 'OK' : 'MISSING');
    console.log('  Bold:', fontsOk.bold ? 'OK' : 'MISSING');
    console.log(fontsOk.regular && fontsOk.bold ? '  PASS: Both fonts accessible' : '  FAIL');

    // Test 5: bidi-js availability
    console.log('\nTest 5: bidi-js availability');
    const bidiCheck = await page.evaluate(() => {
        if (typeof window.bidi_js === 'undefined') return { available: false };
        const bidi = window.bidi_js();
        const embedLevels = bidi.getEmbeddingLevels('שולם 250 שח', 'rtl');
        const indices = bidi.getReorderedIndices('שולם 250 שח', embedLevels);
        const chars = 'שולם 250 שח'.split('');
        const result = indices.map(i => chars[i]).join('');
        return { available: true, result, has250: result.includes('250') };
    });
    console.log('  Available:', bidiCheck.available ? 'Yes' : 'No');
    if (bidiCheck.available) {
        console.log('  Output:', bidiCheck.result);
        console.log(bidiCheck.has250 ? '  PASS: Digits 250 preserved' : '  FAIL: Digits corrupted');
    }

    // Test 6: Hard boundary clamp
    console.log('\nTest 6: Hard boundary clamp');
    const clampTest = await page.evaluate(() => {
        // Test cases
        const t1 = clampDrawPosition(-10, 100, 612);  // x too small
        const t2 = clampDrawPosition(550, 100, 612);  // x + width > page
        const t3 = clampDrawPosition(100, 50, 612);   // normal
        return { t1, t2, t3 };
    });
    console.log('  Negative x (-10):', clampTest.t1, '(expected: 4)');
    console.log('  Overflows page (550+100):', clampTest.t2, '(expected: 508 = 612-4-100)');
    console.log('  Normal (100+50):', clampTest.t3, '(expected: 100)');
    console.log(clampTest.t1 === 4 && clampTest.t2 === 508 && clampTest.t3 === 100
        ? '  PASS: Clamp works correctly' : '  WARN: Clamp results differ');

    // Screenshot
    await page.screenshot({ path: 'test-png/test-phase6-export.png', fullPage: true });
    console.log('\nScreenshot saved to test-png/test-phase6-export.png');

    await browser.close();
})();
