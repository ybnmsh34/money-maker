const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

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

    // Export and get the buffer
    const pdfBuffer = await page.evaluate(async () => {
        // Call exportPDF which sets downloadLink.href to a blob URL
        await exportPDF();
        const dl = document.getElementById('downloadLink');
        // Fetch the blob
        const resp = await fetch(dl.href);
        const buf = await resp.arrayBuffer();
        return Array.from(new Uint8Array(buf));
    });

    // Save PDF to file
    fs.writeFileSync('./edited-test.pdf', Buffer.from(pdfBuffer));
    console.log('Saved edited-test.pdf');

    // Read and check PDF page count
    const buf = fs.readFileSync('./edited-test.pdf');
    const text = buf.toString('latin1');
    const matches = text.match(/\/Type\s+\/Pages[^]*?\/Count\s+(\d+)/);
    if (matches) {
        console.log('PDF pages in exported file:', matches[1]);
        console.log(matches[1] === '2' ? '✅ Export has 2 pages!' : '❌ Export page count wrong');
    } else {
        console.log('Could not determine page count from PDF');
    }

    await browser.close();
})();
