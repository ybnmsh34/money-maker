const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    page.on('console', msg => { if (msg.type() === 'error') console.log('ERR:', msg.text()); });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 500));

    // Upload Resume.pdf
    const fileInput = await page.$('#fileInput');
    const pdfPath = path.resolve('./files for tests/Resume.pdf');
    console.log('Uploading:', pdfPath);
    await fileInput.uploadFile(pdfPath);

    // Wait for editor area
    await page.waitForSelector('#editorArea', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check results
    const info = await page.evaluate(() => {
        const spans = document.querySelectorAll('.text-span');
        const canvases = document.querySelectorAll('.pdf-page canvas');
        const editorVisible = document.getElementById('editorArea').style.display !== 'none';
        return {
            spanCount: spans.length,
            canvasInPages: canvases.length,
            editorVisible,
            firstText: spans[0] ? spans[0].textContent.substring(0, 50) : 'NONE',
            firstBold: spans[0] ? spans[0].style.fontWeight : null,
            firstColor: spans[0] ? spans[0].style.color : null,
            firstUnderline: spans[0] ? spans[0].style.textDecoration : null,
        };
    });
    console.log('Results:', JSON.stringify(info, null, 2));

    await page.screenshot({ path: 'C:/pi-agent/editor-extract-test.png', fullPage: false });
    console.log('Screenshot saved');
    await browser.close();
})();
