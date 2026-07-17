const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/tools/pdf-editor.html');

  // Upload PDF
  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile('C:/pi-agent/money-maker/files for tests/Resume.pdf');
  await page.waitForSelector('.text-span');

  // Test 1: Click on a span to give it focus, then click Bold button
  const span = await page.$('.text-span');
  await span.click();
  await new Promise(r => setTimeout(r, 200));

  const focusedBefore = await page.evaluate(() => {
    const el = document.activeElement;
    return el.classList.contains('text-span');
  });
  console.log(`Test 1 - Span focused before toolbar click: ${focusedBefore ? 'PASS' : 'FAIL'}`);

  // Click Bold button
  const boldBtn = await page.$('#boldBtn');
  await boldBtn.click();
  await new Promise(r => setTimeout(r, 200));

  // After clicking Bold, check if span is still focused (onmousedown preventDefault should keep it)
  const focusedAfterBold = await page.evaluate(() => {
    const el = document.activeElement;
    return el.classList && el.classList.contains('text-span');
  });
  console.log(`Test 2 - Span still focused after Bold click: ${focusedAfterBold ? 'PASS' : 'FAIL'}`);

  // Test 3: Check that bold was actually applied (currentEditingEl was preserved)
  const fontWeight = await page.evaluate(() => {
    return document.activeElement ? document.activeElement.style.fontWeight : 'none';
  });
  console.log(`Test 3 - Bold applied (fontWeight=${fontWeight}): ${fontWeight === 'bold' ? 'PASS' : 'FAIL'}`);

  // Test 4: Multiple toolbar clicks in sequence
  // Click Bold again (should toggle off), then Italic
  await boldBtn.click();
  await new Promise(r => setTimeout(r, 100));
  const italicBtn = await page.$('#italicBtn');
  await italicBtn.click();
  await new Promise(r => setTimeout(r, 200));

  const fontStyle = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.style.fontStyle : 'none';
  });
  const fontWeight2 = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.style.fontWeight : 'none';
  });
  console.log(`Test 4 - Sequential clicks: bold toggled off (fontWeight=${fontWeight2}), italic applied (fontStyle=${fontStyle}) → ${(fontWeight2 === 'normal' && fontStyle === 'italic') ? 'PASS' : 'FAIL'}`);

  // Test 5: currentEditingEl preserved after toolbar interaction
  const editingElPreserved = await page.evaluate(() => {
    return currentEditingEl !== null && currentEditingEl.classList.contains('text-span');
  });
  console.log(`Test 5 - currentEditingEl preserved: ${editingElPreserved ? 'PASS' : 'FAIL'}`);

  await browser.close();
  console.log('\nPhase 2 toolbar focus tests complete.');
})().catch(err => { console.error(err); process.exit(1); });
