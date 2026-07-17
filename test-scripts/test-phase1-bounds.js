const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture ALL console logs
    const allLogs = [];
    page.on('console', msg => {
        const t = msg.text();
        allLogs.push(t);
        if (t.includes('Phase') || t.includes('Page ') || t.includes('bounds')) {
            console.log('CAPTURED: ' + t);
        }
    });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0' });
    
    // Upload mixed-page-sizes.pdf
    const input = await page.$('#fileInput');
    await input.uploadFile(path.join(__dirname, '..', 'files for tests', 'mixed-page-sizes.pdf'));
    
    // Wait for parse to complete
    await page.waitForSelector('.pdf-page', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\n=== Phase 1 Verification ===');
    console.log('Total console messages: ' + allLogs.length);
    
    const phaseLogs = allLogs.filter(l => l.includes('Phase 1'));
    console.log('Phase 1 logs: ' + phaseLogs.length);
    phaseLogs.forEach(l => console.log('  ' + l));
    
    // Evaluate getPageBounds directly
    const bounds = await page.evaluate(() => {
        const results = [];
        for(let i=1; i<=allPages.length; i++){
            results.push({pageNum: i, ...getPageBounds(i)});
        }
        return results;
    });
    console.log('\nDirect getPageBounds results:');
    bounds.forEach(b => console.log('  Page ' + b.pageNum + ': ' + b.width + 'x' + b.height));
    
    if (bounds.length >= 2) {
        console.log('\nPASS: getPageBounds works for ' + bounds.length + ' pages');
        // Verify different sizes
        const sizes = new Set(bounds.map(b => b.width + 'x' + b.height));
        console.log('  Distinct sizes: ' + sizes.size + ' -> ' + [...sizes].join(', '));
    } else {
        console.log('\nFAIL: Expected >=2 pages, got ' + bounds.length);
    }
    
    await browser.close();
})();
