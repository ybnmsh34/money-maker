const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    // Capture ALL console messages
    page.on('console', msg => console.log('CONSOLE [' + msg.type() + ']:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Upload PDF
    await page.waitForSelector('#fileInput', { timeout: 10000 });
    const fileInput = await page.$('#fileInput');
    await fileInput.uploadFile(path.resolve('./files for tests/Resume.pdf'));

    // Wait and check
    await new Promise(r => setTimeout(r, 10000));

    const info = await page.evaluate(() => ({
        editorVisible: document.getElementById('editorArea') ? document.getElementById('editorArea').style.display : 'no-id',
        uploadVisible: document.getElementById('uploadZone') ? document.getElementById('uploadZone').style.display : 'no-id',
        spans: document.querySelectorAll('.text-span').length,
        viewerContent: document.getElementById('viewer') ? document.getElementById('viewer').innerHTML.substring(0, 200) : 'no-viewer',
    }));
    console.log('\nState after upload:', JSON.stringify(info, null, 2));

    await page.screenshot({ path: 'C:/pi-agent/test-debug.png', fullPage: false });
    console.log('Screenshot saved');

    await browser.close();
})();
