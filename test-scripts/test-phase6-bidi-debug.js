const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const bidiInfo = await page.evaluate(() => {
        if (typeof window.bidi_js === 'undefined') return { available: false };
        const bidi = window.bidi_js;
        const result = {
            available: true,
            type: typeof bidi,
            keys: Object.keys(bidi),
            hasEmbeddingLevels: typeof bidi.getEmbeddingLevels === 'function',
            hasReorderedIndices: typeof bidi.getReorderedIndices === 'function',
            hasReorderedString: typeof bidi.getReorderedString === 'function',
        };
        return result;
    });
    console.log('bidi-js info:', JSON.stringify(bidiInfo, null, 2));

    await browser.close();
})();
