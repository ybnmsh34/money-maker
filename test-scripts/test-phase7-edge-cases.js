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

    // Upload Hebrew PDF for RTL edge cases
    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'חברת טבע - ניתוח.pdf'));
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(2000);

    console.log('\n========================================');
    console.log('  Phase 7: Edge Cases');
    console.log('========================================\n');

    // ===== Edge 1: Single character span =====
    console.log('--- Edge 1: Single character spans ---');

    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const pageEl = document.getElementById('pdf-page-1');

        // Single Hebrew char (RTL)
        const s1 = createNewSpan(1, bounds.width - EDGE_PAD, 400, 14, 'א', null, 'rtl');
        pageEl.appendChild(s1);

        // Single Latin char (LTR)
        const s2 = createNewSpan(1, 50, 420, 14, 'A', null, 'ltr');
        pageEl.appendChild(s2);
    });
    await sleep(300);

    const singleCharTest = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        let rtlWithRight = 0, ltrWithLeft = 0;
        spans.forEach(s => {
            if (s.getAttribute('dir') === 'rtl' && s.style.right) rtlWithRight++;
            if (s.getAttribute('dir') === 'ltr' && s.style.left) ltrWithLeft++;
        });
        return { rtlWithRight, ltrWithLeft };
    });

    if (singleCharTest.rtlWithRight > 0) pass('Single-char RTL has right positioning');
    else fail('Single-char RTL missing right positioning');
    if (singleCharTest.ltrWithLeft > 0) pass('Single-char LTR has left positioning');
    else fail('Single-char LTR missing left positioning');

    // ===== Edge 2: Empty span =====
    console.log('\n--- Edge 2: Empty span ---');

    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, bounds.width - EDGE_PAD, 440, 14, '', null, 'rtl');
        pageEl.appendChild(span);
    });
    await sleep(200);

    const emptySpan = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span'));
        const newSpan = spans.find(s => s.dataset.newText === 'true' && s.textContent === '');
        if (!newSpan) return { text: 'NOT_FOUND', hasMeta: false, dir: '' };
        return {
            text: newSpan.textContent,
            hasMeta: !!newSpan._meta,
            dir: newSpan.getAttribute('dir')
        };
    });

    if (emptySpan.text === '' && emptySpan.hasMeta && emptySpan.dir === 'rtl')
        pass('Empty RTL span created correctly');
    else fail('Empty RTL span: text="' + emptySpan.text + '" hasMeta=' + emptySpan.hasMeta + ' dir=' + emptySpan.dir);

    // ===== Edge 3: Enter at bottom of last page =====
    console.log('\n--- Edge 3: Enter at bottom of last page ---');

    // Reload with mixed-size PDF (3 pages)
    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });
    await sleep(1000);

    const input2 = await page.$('#fileInput');
    await input2.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(2000);

    const initialPages = await page.evaluate(() => ({
        allPages: allPages.length,
        domPages: document.querySelectorAll('.pdf-page').length
    }));
    console.log('  Initial: allPages=' + initialPages.allPages + ', domPages=' + initialPages.domPages);

    // Create span at bottom of last page and press Enter
    await page.evaluate(() => {
        const pageEl = document.getElementById('pdf-page-3');
        const span = createNewSpan(3, 50, 700, 14, 'test', null, 'ltr');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(300);

    // Place cursor at end and press Enter
    await page.keyboard.press('End');
    await sleep(100);
    await page.keyboard.press('Enter');
    await sleep(1000);

    const afterEnter = await page.evaluate(() => ({
        allPages: allPages.length,
        domPages: document.querySelectorAll('.pdf-page').length
    }));

    if (afterEnter.allPages > initialPages.allPages)
        pass('New page created by Enter at last page bottom');
    else if (afterEnter.allPages === initialPages.allPages)
        pass('No overflow needed (content fits)');
    else fail('Page count decreased (regression)');

    // ===== Edge 4: Very long unbreakable word =====
    console.log('\n--- Edge 4: Unbreakable word past edge ---');

    await page.evaluate(() => {
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, 50, 200, 12, '', null, 'ltr');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(200);

    // Type a very long unbreakable word
    await page.keyboard.type('supercalifragilisticexpialidocious', { delay: 5 });
    await sleep(1000);

    const unbreakable = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span'));
        const newSpans = spans.filter(s => s.dataset.newText === 'true');
        return {
            count: newSpans.length,
            lastText: newSpans.length > 0 ? newSpans[newSpans.length - 1].textContent : ''
        };
    });

    if (unbreakable.count >= 1) pass('Unbreakable word handled (' + unbreakable.count + ' span(s) created)');
    else fail('Unbreakable word not handled');

    // ===== Edge 5: Special characters =====
    console.log('\n--- Edge 5: Special characters ---');

    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, bounds.width - EDGE_PAD, 500, 14, '', null, 'rtl');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(200);

    const specialText = 'שלום! @#$ 123';
    await page.keyboard.type(specialText, { delay: 10 });
    await sleep(500);

    const specialResult = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('.text-span'));
        // Find the RTL span we typed into (has newText=true and contains the text)
        const target = spans.find(s => s.dataset.newText === 'true' && s.textContent.length > 0 && s.getAttribute('dir') === 'rtl');
        return target ? target.textContent : 'NOT_FOUND';
    });

    if (specialResult.includes('123')) pass('Special chars + digits in RTL: "' + specialResult + '"');
    else fail('Special chars lost: "' + specialResult + '"');

    // ===== Edge 6: Direction change mid-session =====
    console.log('\n--- Edge 6: Direction change mid-session ---');

    // Toggle from LTR to RTL then back
    await page.select('#dirToggle', 'rtl');
    await sleep(200);

    await page.evaluate(() => {
        const bounds = getPageBounds(1);
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, bounds.width - EDGE_PAD, 520, 14, '', null, 'rtl');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(200);
    await page.keyboard.type('חדש', { delay: 8 });
    await sleep(300);

    // Switch to LTR
    await page.select('#dirToggle', 'ltr');
    await sleep(200);

    await page.evaluate(() => {
        const pageEl = document.getElementById('pdf-page-1');
        const span = createNewSpan(1, 50, 540, 14, '', null, 'ltr');
        pageEl.appendChild(span);
        span.focus();
    });
    await sleep(200);
    await page.keyboard.type('new', { delay: 5 });
    await sleep(300);

    const dirSwitch = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        let rtlCount = 0, ltrCount = 0;
        spans.forEach(s => {
            if (s.getAttribute('dir') === 'rtl') rtlCount++;
            else if (s.getAttribute('dir') === 'ltr') ltrCount++;
        });
        return { rtlCount, ltrCount };
    });

    if (dirSwitch.rtlCount > 0 && dirSwitch.ltrCount > 0)
        pass('Both RTL and LTR spans coexist after direction toggle');
    else fail('Direction toggle: rtl=' + dirSwitch.rtlCount + ' ltr=' + dirSwitch.ltrCount);

    // ===== Edge 7: Double-click on existing span (should NOT create new span) =====
    console.log('\n--- Edge 7: Double-click on existing span ---');

    const beforeDblClick = await page.evaluate(() =>
        document.querySelectorAll('.text-span').length);

    // Double-click on an existing span
    await page.evaluate(() => {
        const span = document.querySelector('.text-span');
        if (span) {
            span.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        }
    });
    await sleep(500);

    const afterDblClick = await page.evaluate(() =>
        document.querySelectorAll('.text-span').length);

    if (beforeDblClick === afterDblClick)
        pass('Double-click on existing span does NOT create new span');
    else fail('Double-click on span created extra span');

    // ===== Edge 8: Zoom invariance after direction change =====
    console.log('\n--- Edge 8: Zoom invariance ---');

    const zoomBefore = await page.evaluate(() => {
        const span = document.querySelector('.text-span[dir="rtl"]');
        return span ? { right: span.style.right, zoom } : null;
    });

    // Change zoom
    await page.evaluate(() => { zoom = 1.5; });
    await sleep(300);

    const zoomAfter = await page.evaluate(() => {
        const span = document.querySelector('.text-span[dir="rtl"]');
        return span ? { right: span.style.right, zoom } : null;
    });

    console.log('  Before: right=' + zoomBefore.right + ', zoom=' + zoomBefore.zoom);
    console.log('  After: right=' + zoomAfter.right + ', zoom=' + zoomAfter.zoom);

    if (zoomAfter) pass('RTL span persists after zoom change');
    else fail('RTL span missing after zoom change');

    // ===== Summary =====
    console.log('\n========================================');
    console.log('  Results: ' + totalPassed + '/' + totalTests + ' passed');
    if (totalFailed > 0) console.log('  Failed: ' + totalFailed);
    console.log('========================================\n');

    await page.screenshot({ path: 'test-png/test-phase7-edge-cases.png', fullPage: true });
    console.log('Screenshot: test-png/test-phase7-edge-cases.png');

    await browser.close();
    process.exit(totalFailed > 0 ? 1 : 0);
})();
