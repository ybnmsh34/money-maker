const puppeteer = require('puppeteer');
const path = require('path');

async function doubleClick(page, x, y) {
    await page.mouse.move(x, y);
    await page.mouse.down({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 1 });
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.down({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 50));
    await page.mouse.up({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 500));
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1200 });

    await page.goto('http://localhost:3000/tools/pdf-editor.html', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.waitForSelector('#fileInput', { timeout: 10000 });
    await page.$('#fileInput').then(f => f.uploadFile(path.resolve('./files for tests/Resume.pdf')));
    await page.waitForSelector('#editorArea', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('.text-span').length > 0, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to bottom and create new page
    await page.evaluate(() => {
        document.getElementById('pdf-page-1').scrollIntoView({ behavior: 'instant', block: 'end' });
    });
    await new Promise(r => setTimeout(r, 500));

    const pageInfo = await page.evaluate(() => {
        const pageDiv = document.getElementById('pdf-page-1');
        const rect = pageDiv.getBoundingClientRect();
        return { x: rect.left + 100, y: rect.top + rect.height - 60 };
    });

    await doubleClick(page, pageInfo.x, pageInfo.y);
    await page.keyboard.type('Bottom text here');
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));

    console.log('Pages created:', await page.evaluate(() => document.querySelectorAll('.pdf-page').length));

    // Type on new page
    await page.keyboard.type('New page content!');
    await new Promise(r => setTimeout(r, 500));

    // Click Save PDF
    await page.evaluate(() => { document.querySelector('button[onclick="exportPDF()"]').click(); });
    await new Promise(r => setTimeout(r, 5000));

    const result = await page.evaluate(() => {
        const dl = document.getElementById('downloadLink');
        const ra = document.getElementById('resultArea');
        return {
            downloadHref: dl ? dl.href : null,
            resultVisible: ra && ra.style.display !== 'none',
            pages: document.querySelectorAll('.pdf-page').length,
        };
    });
    console.log('Export result:', JSON.stringify(result, null, 2));
    console.log(result.resultVisible ? '✅ Export succeeded' : '❌ Export failed');

    await browser.close();
})();
