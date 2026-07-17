const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000/tools/pdf-editor.html');

  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile('C:/pi-agent/money-maker/files for tests/Resume.pdf');
  await page.waitForSelector('.text-span');
  await new Promise(r => setTimeout(r, 1000));

  let pass = 0, fail = 0;

  // Test 1: Click span → click color picker → change color → verify
  const spanBox = await page.$('.text-span').then(el => el.boundingBox());
  await page.mouse.click(spanBox.x + spanBox.width/2, spanBox.y + spanBox.height/2);
  await new Promise(r => setTimeout(r, 300));

  // Click color input (triggers blur on span)
  const colorBox = await page.$('#fontColor').then(el => el.boundingBox());
  await page.mouse.click(colorBox.x + colorBox.width/2, colorBox.y + colorBox.height/2);
  await new Promise(r => setTimeout(r, 300));

  // Change color via evaluate (simulates picker selection)
  await page.evaluate(() => {
    document.getElementById('fontColor').value = '#ff0000';
  });
  await new Promise(r => setTimeout(r, 200));

  // Dispatch input event
  await page.evaluate(() => {
    const fc = document.getElementById('fontColor');
    fc.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));

  const color1 = await page.evaluate(() => {
    return document.querySelector('.text-span').style.color;
  });
  const c1ok = color1 === 'rgb(255, 0, 0)';
  console.log(`Test 1 - Color picker works after blur: ${color1} → ${c1ok ? 'PASS' : 'FAIL'}`);
  c1ok ? pass++ : fail++;

  // Test 2: Change to a different color (blue)
  await page.evaluate(() => {
    const fc = document.getElementById('fontColor');
    fc.value = '#0000ff';
    fc.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));

  const color2 = await page.evaluate(() => {
    return document.querySelector('.text-span').style.color;
  });
  const c2ok = color2 === 'rgb(0, 0, 255)';
  console.log(`Test 2 - Second color change (blue): ${color2} → ${c2ok ? 'PASS' : 'FAIL'}`);
  c2ok ? pass++ : fail++;

  // Test 3: Change color of different span
  await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    if (spans.length > 1) {
      spans[1].focus();
    }
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    const fc = document.getElementById('fontColor');
    fc.value = '#00ff00';
    fc.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));

  const color3 = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    return spans[1] ? spans[1].style.color : 'N/A';
  });
  const c3ok = color3 === 'rgb(0, 255, 0)';
  console.log(`Test 3 - Color on different span: ${color3} → ${c3ok ? 'PASS' : 'FAIL'}`);
  c3ok ? pass++ : fail++;

  // Test 4: lastEditingEl persists after blur
  const persisted = await page.evaluate(() => {
    return lastEditingEl !== null && lastEditingEl.classList.contains('text-span');
  });
  console.log(`Test 4 - lastEditingEl persists after blur: ${persisted ? 'PASS' : 'FAIL'}`);
  persisted ? pass++ : fail++;

  // Test 5: Toolbar still works after color change (bold + italic)
  await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    if (spans.length > 0) spans[0].focus();
  });
  await new Promise(r => setTimeout(r, 300));

  // Click bold
  const boldBtn = await page.$('#boldBtn');
  await boldBtn.click();
  await new Promise(r => setTimeout(r, 200));

  const fontWeight = await page.evaluate(() => {
    return document.querySelector('.text-span').style.fontWeight;
  });
  const boldOk = fontWeight === 'bold';
  console.log(`Test 5 - Bold still works after color changes: ${fontWeight} → ${boldOk ? 'PASS' : 'FAIL'}`);
  boldOk ? pass++ : fail++;

  console.log(`\n=== Color Fix: ${pass}/${pass+fail} PASS ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
