const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

function pass(msg) { totalTests++; totalPassed++; console.log('  ✓ PASS:', msg); }
function fail(msg) { totalTests++; totalFailed++; console.log('  ✗ FAIL:', msg); }

// Helper: create a new browser+page for each test to avoid stale state
async function createBrowser() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });
    await sleep(1000);
    return { browser, page };
}

(async () => {
    console.log('\n========================================');
    console.log('  Phase 7: Export Roundtrip Tests');
    console.log('========================================\n');

    // ===== Test 1: Hebrew RTL export with digits =====
    console.log('--- Test 1: Hebrew RTL export with digits ---');
    {
        const { browser, page } = await createBrowser();
        // Upload Hebrew PDF
        const input = await page.$('#fileInput');
        await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'חברת טבע - ניתוח.pdf'));
        await page.waitForSelector('.pdf-page', { timeout: 15000 });
        await sleep(2000);

        // Create RTL span with mixed Hebrew+digits
        await page.evaluate(() => {
            const bounds = getPageBounds(1);
            const x = bounds.width - EDGE_PAD;
            const pageEl = document.getElementById('pdf-page-1');
            const span = createNewSpan(1, x, 600, 14, '', null, 'rtl');
            pageEl.appendChild(span);
            span.focus();
        });
        await sleep(300);

        const hebrewWithDigits = 'סכום: 1500 שח';
        await page.keyboard.type(hebrewWithDigits, { delay: 8 });
        await sleep(500);

        // Verify the newly created span's text (filter by newText)
        const domText = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('.text-span'));
            const newSpan = spans.find(s => s.dataset.newText === 'true');
            return newSpan ? newSpan.textContent : '';
        });
        if (domText === hebrewWithDigits) pass('DOM text matches input: "' + domText + '"');
        else fail('DOM text mismatch: "' + domText + '" vs "' + hebrewWithDigits + '"');

        // Trigger export
        page.on('dialog', async d => await d.dismiss());
        const exportResult = await page.evaluate(async () => {
            try { await exportPDF(); return 'ok'; }
            catch(e) { return 'error: ' + e.message; }
        });
        if (exportResult === 'ok') pass('Export completed successfully');
        else fail('Export failed: ' + exportResult);

        await browser.close();
    }

    // ===== Test 2: Arabic text blocked =====
    console.log('\n--- Test 2: Arabic text blocked ---');
    {
        const { browser, page } = await createBrowser();
        const input = await page.$('#fileInput');
        await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
        await page.waitForSelector('.pdf-page', { timeout: 15000 });
        await sleep(2000);

        // Add Arabic text to a span
        await page.evaluate(() => {
            const pageEl = document.getElementById('pdf-page-1');
            const span = createNewSpan(1, 50, 700, 14, '', null, 'ltr');
            pageEl.appendChild(span);
            span.focus();
        });
        await sleep(200);
        await page.keyboard.type('مرحبا بالعالم', { delay: 10 });
        await sleep(500);

        // Try export — should trigger alert
        let alertMsg = null;
        page.once('dialog', async d => { alertMsg = d.message(); await d.dismiss(); });

        const arabicExport = await page.evaluate(async () => {
            try { await exportPDF(); return 'ok'; }
            catch(e) { return 'error: ' + e.message; }
        });
        await sleep(1000);

        if (alertMsg && alertMsg.includes('Arabic'))
            pass('Arabic text blocked: "' + alertMsg.substring(0, 50) + '"');
        else if (arabicExport === 'ok')
            fail('Arabic text was NOT blocked');
        else
            fail('Arabic test: export=' + arabicExport + ' alert=' + alertMsg);

        await browser.close();
    }

    // ===== Test 3: LTR export =====
    console.log('\n--- Test 3: LTR text export ---');
    {
        const { browser, page } = await createBrowser();
        const input = await page.$('#fileInput');
        await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
        await page.waitForSelector('.pdf-page', { timeout: 15000 });
        await sleep(2000);

        await page.evaluate(() => {
            const pageEl = document.getElementById('pdf-page-1');
            const span = createNewSpan(1, 50, 500, 14, '', null, 'ltr');
            pageEl.appendChild(span);
            span.focus();
        });
        await sleep(200);
        await page.keyboard.type('Edited PDF text: Hello World 2025', { delay: 5 });
        await sleep(500);

        page.on('dialog', async d => await d.dismiss());
        const ltrExport = await page.evaluate(async () => {
            try { await exportPDF(); return 'ok'; }
            catch(e) { return 'error: ' + e.message; }
        });

        if (ltrExport === 'ok') pass('LTR export succeeded');
        else fail('LTR export failed: ' + ltrExport);

        await browser.close();
    }

    // ===== Test 4: Bold Hebrew export =====
    console.log('\n--- Test 4: Bold Hebrew export ---');
    {
        const { browser, page } = await createBrowser();
        const input = await page.$('#fileInput');
        await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'חברת טבע - ניתוח.pdf'));
        await page.waitForSelector('.pdf-page', { timeout: 15000 });
        await sleep(2000);

        // Create bold RTL span
        await page.evaluate(() => {
            const bounds = getPageBounds(1);
            const x = bounds.width - EDGE_PAD;
            const pageEl = document.getElementById('pdf-page-1');
            const span = createNewSpan(1, x, 650, 16, '', null, 'rtl');
            span.style.fontWeight = 'bold';
            span._meta.isBold = true;
            pageEl.appendChild(span);
            span.focus();
        });
        await sleep(200);
        await page.keyboard.type('מודגש', { delay: 8 });
        await sleep(500);

        page.on('dialog', async d => await d.dismiss());
        const boldExport = await page.evaluate(async () => {
            try { await exportPDF(); return 'ok'; }
            catch(e) { return 'error: ' + e.message; }
        });

        if (boldExport === 'ok') pass('Bold Hebrew export succeeded');
        else fail('Bold Hebrew export failed: ' + boldExport);

        await browser.close();
    }

    // ===== Test 5: Multiple spans mixed directions =====
    console.log('\n--- Test 5: Mixed LTR/RTL export ---');
    {
        const { browser, page } = await createBrowser();
        const input = await page.$('#fileInput');
        await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
        await page.waitForSelector('.pdf-page', { timeout: 15000 });
        await sleep(2000);

        await page.evaluate(() => {
            const bounds = getPageBounds(1);
            const pageEl = document.getElementById('pdf-page-1');

            const s1 = createNewSpan(1, 50, 560, 12, 'Hello', null, 'ltr');
            pageEl.appendChild(s1);

            const s2 = createNewSpan(1, bounds.width - EDGE_PAD, 580, 12, '', null, 'rtl');
            pageEl.appendChild(s2);

            const s3 = createNewSpan(1, 50, 600, 12, 'World', null, 'ltr');
            pageEl.appendChild(s3);
        });
        await sleep(200);

        // Type into RTL span
        await page.keyboard.type('שלום', { delay: 8 });
        await sleep(300);

        page.on('dialog', async d => await d.dismiss());
        const multiExport = await page.evaluate(async () => {
            try { await exportPDF(); return 'ok'; }
            catch(e) { return 'error: ' + e.message; }
        });

        if (multiExport === 'ok') pass('Mixed LTR/RTL export succeeded');
        else fail('Mixed LTR/RTL export failed: ' + multiExport);

        await browser.close();
    }

    // ===== Summary =====
    console.log('\n========================================');
    console.log('  Results: ' + totalPassed + '/' + totalTests + ' passed');
    if (totalFailed > 0) console.log('  Failed: ' + totalFailed);
    console.log('========================================\n');

    // Take screenshot with a fresh browser
    const { browser, page } = await createBrowser();
    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'חברת טבע - ניתוח.pdf'));
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await sleep(1000);
    await page.screenshot({ path: 'test-png/test-phase7-export-roundtrip.png', fullPage: true });
    console.log('Screenshot: test-png/test-phase7-export-roundtrip.png');
    await browser.close();

    process.exit(totalFailed > 0 ? 1 : 0);
})();
