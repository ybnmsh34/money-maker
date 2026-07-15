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
    await new Promise(r => setTimeout(r, 500));

    // Upload PDF
    const fileInput = await page.$('#fileInput');
    await fileInput.uploadFile(path.resolve('./files for tests/Resume.pdf'));
    await page.waitForSelector('#editorArea', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Click on first text span (should be "Resume" title)
    await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        if (spans[0]) {
            spans[0].focus();
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(spans[0]);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });
    await new Promise(r => setTimeout(r, 500));

    // Type new text
    await page.keyboard.type('MY EDITED RESUME', { delay: 30 });
    await new Promise(r => setTimeout(r, 300));

    // Click away to trigger blur/change detection
    await page.evaluate(() => {
        document.querySelector('.text-span').blur();
    });
    await new Promise(r => setTimeout(r, 500));

    // Check results
    const info = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        return {
            newText: spans[0] ? spans[0].textContent : 'MISSING',
            hasChangedClass: spans[0] ? spans[0].classList.contains('changed') : false,
            changeCount: document.getElementById('changeCount').textContent,
            zoom: document.getElementById('zoomLevel').textContent,
            totalPages: document.querySelectorAll('.page-thumb').length,
        };
    });
    console.log('Edit test results:', JSON.stringify(info, null, 2));

    await page.screenshot({ path: 'C:/pi-agent/editor-editing-test.png', fullPage: false });
    console.log('Screenshot saved');

    await browser.close();
})();
