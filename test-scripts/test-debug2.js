const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    // Capture ALL console messages and errors
    page.on('console', msg => console.log('CONSOLE [' + msg.type() + ']:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));
    page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure().errorText));

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));

    // Check if PDF.js loaded
    const pdfjsLoaded = await page.evaluate(() => typeof pdfjsLib !== 'undefined');
    console.log('PDF.js loaded:', pdfjsLoaded);

    // Check if PDFLib loaded
    const pdflibLoaded = await page.evaluate(() => typeof PDFLib !== 'undefined');
    console.log('PDFLib loaded:', pdflibLoaded);

    // Check if our global variables exist
    const ourVars = await page.evaluate(() => {
        return {
            hasPdfDoc: typeof pdfDoc !== 'undefined',
            hasZoom: typeof zoom !== 'undefined',
            hasChanges: typeof changes !== 'undefined',
            hasAllPages: typeof allPages !== 'undefined',
        };
    });
    console.log('Our globals:', ourVars);

    await browser.close();
})();
