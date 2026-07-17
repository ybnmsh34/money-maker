const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Capture ALL console messages
    page.on('console', msg => console.log('  CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('  PAGE ERROR:', err.message));

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });

    console.log('Page loaded, uploading Hebrew PDF...');

    // Try with English path first
    const hebrewPdf = path.join(__dirname, '..', 'files for tests', 'חברת טבע - ניתוח.pdf');
    console.log('File path:', hebrewPdf);
    console.log('File exists:', require('fs').existsSync(hebrewPdf));

    const input = await page.$('#fileInput');
    await input.uploadFile(hebrewPdf);

    console.log('File uploaded, waiting for parse...');

    // Wait longer and check for errors
    await new Promise(r => setTimeout(r, 10000));

    // Check if any pages were created
    const pageCount = await page.evaluate(() => document.querySelectorAll('.pdf-page').length);
    console.log('PDF pages found:', pageCount);

    if (pageCount === 0) {
        // Check error state
        const uploadVisible = await page.evaluate(() => document.getElementById('uploadZone').style.display !== 'none');
        const editorVisible = await page.evaluate(() => document.getElementById('editorArea').style.display !== 'none');
        console.log('Upload zone visible:', uploadVisible);
        console.log('Editor area visible:', editorVisible);

        // Check for alert dialogs
        const alerts = await page.evaluate(() => {
            // Check if there's an alert overlay
            return document.querySelector('.alert')?.textContent || 'no alert';
        });
        console.log('Alert:', alerts);
    }

    await browser.close();
})();
