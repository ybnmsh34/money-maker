const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Capture console logs
    const logs = [];
    page.on('console', msg => {
        if (msg.text().includes('Phase 2') || msg.text().includes('[Phase 2]')) logs.push(msg.text());
    });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });

    // Upload Hebrew PDF
    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'חברת טבע - ניתוח.pdf'));

    // Wait for parse
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n=== Phase 2 Verification ===');
    console.log('Console logs:', logs.join('\n'));

    // Check: all spans have dir attribute
    const spans = await page.evaluate(() => {
        const result = [];
        document.querySelectorAll('.text-span').forEach(s => {
            result.push({
                dir: s.getAttribute('dir'),
                metaDir: s._meta ? s._meta.dir : null,
                text: s.textContent.substring(0, 40),
                hasRight: s.style.right !== '',
                hasLeft: s.style.left !== ''
            });
        });
        return result;
    });

    console.log('\nSpan analysis (' + spans.length + ' spans):');
    const rtlSpans = spans.filter(s => s.dir === 'rtl');
    const ltrSpans = spans.filter(s => s.dir === 'ltr');
    console.log('  RTL spans: ' + rtlSpans.length);
    console.log('  LTR spans: ' + ltrSpans.length);

    // Verify RTL spans use CSS right positioning
    const rtlRight = rtlSpans.filter(s => s.hasRight && !s.hasLeft);
    console.log('  RTL spans with right positioning: ' + rtlRight.length + ' / ' + rtlSpans.length);

    // Check document direction
    const docDir = await page.evaluate(() => document.getElementById('dirToggle').value);
    console.log('  Document direction (toolbar): ' + docDir);

    // Verify: at least some RTL spans with correct positioning
    if (rtlSpans.length > 0 && rtlRight.length === rtlSpans.length) {
        console.log('\nPASS: RTL detection and positioning working');
    } else if (rtlSpans.length === 0) {
        console.log('\nWARN: No RTL spans detected (PDF may use non-standard encoding)');
        // Show first few spans for debugging
        spans.slice(0, 5).forEach((s, i) => {
            console.log('  Span ' + i + ': dir=' + s.dir + ', text="' + s.text + '", right=' + s.hasRight + ', left=' + s.hasLeft);
        });
    } else {
        console.log('\nFAIL: RTL spans not using right positioning');
    }

    // Test zoom invariance: zoom to 0.5x and check spans stay put
    console.log('\nZoom test:');
    await page.click('#zoomLevel'); // click zoom area
    // Actually, let's use evaluate to change zoom
    const beforeZoom = await page.evaluate(() => {
        const s = document.querySelector('.text-span');
        return s ? { left: s.style.left, right: s.style.right, top: s.style.top } : null;
    });
    console.log('  At 1.0x: ' + JSON.stringify(beforeZoom));

    // Zoom to 0.5x
    await page.evaluate(() => { zoom = 0.5; rebuildAll(); });
    await new Promise(r => setTimeout(r, 3000));

    const afterZoom = await page.evaluate(() => {
        const s = document.querySelector('.text-span');
        return s ? { left: s.style.left, right: s.style.right, top: s.style.top } : null;
    });
    console.log('  At 0.5x: ' + JSON.stringify(afterZoom));

    // Reset zoom
    await page.evaluate(() => { zoom = 1; rebuildAll(); });
    await new Promise(r => setTimeout(r, 3000));

    await browser.close();
})();
