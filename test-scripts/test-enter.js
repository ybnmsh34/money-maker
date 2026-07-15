const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    page.on('console', msg => { if (msg.type() === 'error') console.log('ERR:', msg.text()); });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Upload PDF - wait for file input to exist
    await page.waitForSelector('#fileInput', { timeout: 10000 });
    const fileInput = await page.$('#fileInput');
    const pdfPath = path.resolve('./files for tests/Resume.pdf');
    await fileInput.uploadFile(pdfPath);

    // Wait for editor area to appear (PDF loaded)
    await page.waitForSelector('#editorArea', { timeout: 30000 });
    // Wait for spans to appear
    await page.waitForFunction(() => document.querySelectorAll('.text-span').length > 0, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const initialInfo = await page.evaluate(() => ({
        spans: document.querySelectorAll('.text-span').length,
        editorVisible: document.getElementById('editorArea').style.display !== 'none',
    }));
    console.log('Initial state:', initialInfo);

    // =============================================
    // SCENARIO 1: Enter in the MIDDLE of a line
    // =============================================
    console.log('\n=== SCENARIO 1: Enter in the middle of a line ===');
    await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        for (const span of spans) {
            if (span.textContent.length > 10) {
                span.focus();
                const mid = Math.floor(span.textContent.length / 2);
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(span.firstChild, mid);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                break;
            }
        }
    });
    await new Promise(r => setTimeout(r, 300));

    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    let result1 = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        const focused = document.activeElement;
        return {
            totalSpans: spans.length,
            focusedIsSpan: focused && focused.classList.contains('text-span'),
            focusedText: focused ? `"${focused.textContent}"` : 'none',
            changeCount: document.getElementById('changeCount').textContent,
        };
    });
    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log(result1.totalSpans > initialInfo.spans && result1.focusedIsSpan ? '✅ PASS' : '❌ FAIL');

    await page.screenshot({ path: 'C:/pi-agent/test-enter-scenario1.png', fullPage: false });

    // =============================================
    // SCENARIO 2: Enter at the END of a line
    // =============================================
    console.log('\n=== SCENARIO 2: Enter at the end of a line ===');
    await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        for (const span of spans) {
            if (span.textContent.length > 5) {
                span.focus();
                const len = span.textContent.length;
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(span.firstChild, len);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                break;
            }
        }
    });
    await new Promise(r => setTimeout(r, 300));

    const beforeCount = await page.evaluate(() => document.querySelectorAll('.text-span').length);

    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    let result2 = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        const focused = document.activeElement;
        return {
            totalSpans: spans.length,
            focusedIsEmpty: focused && focused.textContent === '',
            focusedIsSpan: focused && focused.classList.contains('text-span'),
            changeCount: document.getElementById('changeCount').textContent,
        };
    });
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log(result2.totalSpans > beforeCount && result2.focusedIsEmpty ? '✅ PASS' : '❌ FAIL');

    await page.screenshot({ path: 'C:/pi-agent/test-enter-scenario2.png', fullPage: false });

    // =============================================
    // SCENARIO 3: Enter at the BEGINNING of a line
    // =============================================
    console.log('\n=== SCENARIO 3: Enter at the beginning of a line ===');
    await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        for (const span of spans) {
            if (span.textContent.length > 10) {
                span.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(span.firstChild, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                break;
            }
        }
    });
    await new Promise(r => setTimeout(r, 300));

    const beforeCount3 = await page.evaluate(() => document.querySelectorAll('.text-span').length);

    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));

    let result3 = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        const focused = document.activeElement;
        const emptySpans = Array.from(spans).filter(s => s.textContent === '');
        return {
            totalSpans: spans.length,
            emptySpanCount: emptySpans.length,
            focusedText: focused ? `"${focused.textContent}"` : 'none',
            focusedIsSpan: focused && focused.classList.contains('text-span'),
            changeCount: document.getElementById('changeCount').textContent,
        };
    });
    console.log('Result:', JSON.stringify(result3, null, 2));
    console.log(result3.totalSpans > beforeCount3 && result3.focusedIsSpan ? '✅ PASS' : '❌ FAIL');

    await page.screenshot({ path: 'C:/pi-agent/test-enter-scenario3.png', fullPage: false });

    console.log('\n=== ALL SCENARIOS COMPLETE ===');
    await browser.close();
})();
