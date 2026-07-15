const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    // Capture console errors
    page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERR:', msg.text()); });
    page.on('pageerror', err => console.log('PAGE ERR:', err.message));

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // Upload PDF via file input
    const fileInput = await page.$('#fileInput');
    const pdfPath = path.resolve('./files for tests/Resume.pdf');
    console.log('Uploading:', pdfPath, 'exists:', fs.existsSync(pdfPath));
    await fileInput.uploadFile(pdfPath);

    // Wait for editor to appear
    await page.waitForSelector('#editorArea', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // Check text spans
    const info = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        const canvases = document.querySelectorAll('canvas');
        const editorVisible = document.getElementById('editorArea').style.display !== 'none';
        const viewerH = document.getElementById('viewer').offsetHeight;
        return {
            spanCount: spans.length,
            canvasCount: canvases.length,
            editorVisible,
            viewerHeight: viewerH,
            firstText: spans[0] ? spans[0].textContent.substring(0, 80) : 'none',
            firstStyle: spans[0] ? spans[0].style : null,
        };
    });

    console.log('Extraction results:', JSON.stringify(info, null, 2));

    // Screenshot
    await page.screenshot({ path: 'C:/pi-agent/editor-loaded.png', fullPage: false });
    console.log('Screenshot saved');

    // Also save a wider screenshot to see more of the page
    await page.setViewport({ width: 1400, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 300));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/pi-agent/editor-page.png', fullPage: false });
    console.log('Page screenshot saved');

    await browser.close();
})();
