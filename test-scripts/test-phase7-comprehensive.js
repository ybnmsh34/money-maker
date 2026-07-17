const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

function pass(msg) { totalTests++; totalPassed++; console.log('  ✓ PASS:', msg); }
function fail(msg) { totalTests++; totalFailed++; console.log('  ✗ FAIL:', msg); }

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Upload mixed-page-sizes PDF
    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(2000);

    console.log('\n========================================');
    console.log('  Phase 7: Comprehensive Regression Suite');
    console.log('========================================\n');

    // ===== PHASE 1: getPageBounds =====
    console.log('--- Phase 1: getPageBounds ---');

    const bounds = await page.evaluate(() => {
        const result = [];
        for (let i = 1; i <= 3; i++) {
            result.push(getPageBounds(i));
        }
        return result;
    });
    console.log('  Page 1:', JSON.stringify(bounds[0]));
    console.log('  Page 2:', JSON.stringify(bounds[1]));
    console.log('  Page 3:', JSON.stringify(bounds[2]));

    if (bounds[0].width > 0 && bounds[0].height > 0) pass('Page 1 bounds valid');
    else fail('Page 1 bounds invalid');
    if (bounds[1].width > 0 && bounds[1].height > 0) pass('Page 2 bounds valid');
    else fail('Page 2 bounds invalid');
    if (bounds.length === 3) pass('All 3 pages have bounds');
    else fail('Missing page bounds');
    if (bounds[0].width !== bounds[1].width || bounds[0].height !== bounds[1].height)
        pass('Page 1 and 2 have different sizes (mixed PDF)');
    else fail('Page sizes identical (unexpected for mixed PDF)');

    // ===== PHASE 2: Direction model =====
    console.log('\n--- Phase 2: Direction model ---');

    // Check default direction
    const defaultDir = await page.evaluate(() => $('dirToggle').value);
    if (defaultDir === 'ltr') pass('Default direction is LTR');
    else fail('Default direction should be LTR, got ' + defaultDir);

    // Test direction toggle
    await page.select('#dirToggle', 'rtl');
    await sleep(200);
    const afterToggle = await page.evaluate(() => $('dirToggle').value);
    if (afterToggle === 'rtl') pass('Toggle to RTL works');
    else fail('Toggle failed, got ' + afterToggle);

    await page.select('#dirToggle', 'ltr');

    // Create RTL span and verify positioning
    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const x = bounds.width - EDGE_PAD;
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, x, 500, 14, 'test', null, 'rtl');
        pageEl.appendChild(span);
    });
    await sleep(200);

    const rtlSpanPos = await page.evaluate(() => {
        const span = document.querySelector('.text-span[dir="rtl"]');
        return {
            hasRight: span.style.right !== '',
            hasLeft: span.style.left !== '',
            right: span.style.right
        };
    });
    if (rtlSpanPos.hasRight && !rtlSpanPos.hasLeft) pass('RTL span uses CSS right positioning');
    else fail('RTL span positioning wrong: right=' + rtlSpanPos.right + ', left=' + rtlSpanPos.left);

    // Create LTR span and verify positioning
    await page.evaluate(() => {
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, 50, 520, 14, 'test', null, 'ltr');
        pageEl.appendChild(span);
    });
    await sleep(200);

    const ltrSpanPos = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span[dir="ltr"]');
        const span = spans[spans.length - 1]; // newly created
        return {
            hasRight: span.style.right !== '',
            hasLeft: span.style.left !== ''
        };
    });
    if (ltrSpanPos.hasLeft) pass('LTR span uses CSS left positioning');
    else fail('LTR span positioning wrong');

    // ===== PHASE 3: Overflow wrapping =====
    console.log('\n--- Phase 3: Overflow wrapping ---');

    // LTR wrapping test
    await page.evaluate(() => {
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, 50, 540, 12, '', null, 'ltr');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(200);

    const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(8);
    await page.keyboard.type(longText, { delay: 3 });
    await sleep(2000);

    const ltrWrapResult = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span[dir="ltr"]'));
        const userSpans = spans.filter(s => s.dataset.newText === 'true');
        return userSpans.length;
    });
    if (ltrWrapResult > 1) pass('LTR text wrapped into ' + ltrWrapResult + ' spans');
    else fail('LTR text did not wrap (only ' + ltrWrapResult + ' span)');

    // RTL wrapping test
    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const x = bounds.width - EDGE_PAD;
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, x, 700, 12, '', null, 'rtl');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(200);

    const hebrewText = 'זהו טקסט ארוך מאוד שמשתמש במילים שונות כדי לבדוק עטיפה אוטומטית. '.repeat(8);
    await page.keyboard.type(hebrewText, { delay: 5 });
    await sleep(2000);

    const rtlWrapResult = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span[dir="rtl"]'));
        return spans.length;
    });
    if (rtlWrapResult > 2) pass('RTL text wrapped into ' + rtlWrapResult + ' spans');
    else fail('RTL text did not wrap (only ' + rtlWrapResult + ' spans)');

    // ===== PHASE 4: Clamp =====
    console.log('\n--- Phase 4: Clamp span creation ---');

    const clampResult = await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const tests = [];

        // Test 1: x past right edge
        const m1 = { dir: 'ltr', x: bounds.width + 100, width: 50, height: 12, y: 50 };
        clampSpanPosition(m1, 1);
        tests.push({ test: 'LTR x clamped', pass: m1.x < bounds.width });

        // Test 2: y past bottom edge
        const m2 = { dir: 'ltr', x: 50, width: 50, height: 12, y: bounds.height + 50 };
        clampSpanPosition(m2, 1);
        tests.push({ test: 'LTR y clamped', pass: m2.y < bounds.height });

        // Test 3: RTL anchorRight clamped
        const m3 = { dir: 'rtl', x: -500, width: 100, height: 12, y: 50 };
        clampSpanPosition(m3, 1);
        tests.push({ test: 'RTL anchorRight clamped', pass: (m3.x + m3.width) <= bounds.width });

        // Test 4: Negative x
        const m4 = { dir: 'ltr', x: -100, width: 50, height: 12, y: 50 };
        clampSpanPosition(m4, 1);
        tests.push({ test: 'Negative x clamped', pass: m4.x >= EDGE_PAD });

        return tests;
    });
    clampResult.forEach(t => t.pass ? pass(t.test) : fail(t.test));

    // ===== PHASE 5: Edge guide =====
    console.log('\n--- Phase 5: Visual containment ---');

    const pageOverflow = await page.evaluate(() => {
        const pages = document.querySelectorAll('.pdf-page');
        return Array.from(pages).map(p => getComputedStyle(p).overflow);
    });
    const allHidden = pageOverflow.every(o => o === 'hidden');
    if (allHidden) pass('All pages have overflow: hidden');
    else fail('Some pages missing overflow: hidden (got: ' + pageOverflow.join(', ') + ')');

    // Test edge guide CSS exists
    const edgeGuideCSS = await page.evaluate(() => {
        const styles = document.querySelectorAll('style');
        let hasGuide = false;
        styles.forEach(s => { if (s.textContent.includes('edge-guide')) hasGuide = true; });
        return hasGuide;
    });
    if (edgeGuideCSS) pass('Edge guide CSS present');
    else fail('Edge guide CSS missing');

    // ===== PHASE 6: Export infrastructure =====
    console.log('\n--- Phase 6: Export infrastructure ---');

    // Arabic detection
    const arabicTest = await page.evaluate(() => ({
        arabic: containsArabic('مرحبا'),
        english: containsArabic('hello'),
        hebrew: containsArabic('שלום')
    }));
    if (arabicTest.arabic && !arabicTest.english && !arabicTest.hebrew)
        pass('Arabic detection accurate');
    else fail('Arabic detection: ar=' + arabicTest.arabic + ' en=' + arabicTest.english + ' he=' + arabicTest.hebrew);

    // Font files
    const fontsOk = await page.evaluate(async () => {
        try { const r = await fetch('../fonts/NotoSansHebrew-Regular.ttf'); return r.ok; }
        catch(e) { return false; }
    });
    if (fontsOk) pass('Noto Sans Hebrew font accessible');
    else fail('Noto Sans Hebrew font NOT accessible');

    // bidi-js
    const bidiTest = await page.evaluate(() => {
        if (typeof window.bidi_js === 'undefined') return { ok: false };
        const bidi = window.bidi_js();
        const levels = bidi.getEmbeddingLevels('שלום 250 שח', 'rtl');
        const indices = bidi.getReorderedIndices('שלום 250 שח', levels);
        const chars = 'שלום 250 שח'.split('');
        const result = indices.map(i => chars[i]).join('');
        return { ok: true, has250: result.includes('250') };
    });
    if (bidiTest.ok && bidiTest.has250) pass('bidi-js: digits preserved');
    else fail('bidi-js: digits not preserved or unavailable');

    // Hard boundary clamp
    const clampDraw = await page.evaluate(() => ({
        t1: clampDrawPosition(-10, 100, 612) === 4,
        t2: clampDrawPosition(550, 100, 612) === 508,
        t3: clampDrawPosition(100, 50, 612) === 100
    }));
    if (clampDraw.t1 && clampDraw.t2 && clampDraw.t3) pass('Hard boundary clamp correct');
    else fail('Hard boundary clamp: t1=' + clampDraw.t1 + ' t2=' + clampDraw.t2 + ' t3=' + clampDraw.t3);

    // fontkit
    const fontkitOk = await page.evaluate(() => typeof window.fontkit !== 'undefined');
    if (fontkitOk) pass('fontkit available');
    else fail('fontkit NOT available');

    // ===== Summary =====
    console.log('\n========================================');
    console.log('  Results: ' + totalPassed + '/' + totalTests + ' passed');
    if (totalFailed > 0) console.log('  Failed: ' + totalFailed);
    console.log('========================================\n');

    await page.screenshot({ path: 'test-png/test-phase7-comprehensive.png', fullPage: true });
    console.log('Screenshot: test-png/test-phase7-comprehensive.png');

    await browser.close();
    process.exit(totalFailed > 0 ? 1 : 0);
})();
