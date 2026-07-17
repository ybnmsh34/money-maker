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

  // Test 1: Underline color matches text color after changing via toolbar
  const result1 = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    span.style.textDecoration = 'underline';
    span.focus();

    const colorInput = document.getElementById('fontColor');
    colorInput.value = '#ff0000';
    colorInput.dispatchEvent(new Event('input', { bubbles: true }));

    return { textColor: span.style.color, underlineColor: span.style.textDecorationColor };
  });
  console.log('Test 1 - Underline follows text color change (red):');
  console.log(`  text: ${result1.textColor}, underline: ${result1.underlineColor}`);
  const match1 = result1.textColor === result1.underlineColor;
  console.log(`  ${match1 ? 'PASS' : 'FAIL'}`);
  match1 ? pass++ : fail++;

  // Test 2: Multiple color changes
  const result2 = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    span.style.textDecoration = 'underline';
    span.focus();

    const colorInput = document.getElementById('fontColor');
    colorInput.value = '#0000ff';
    colorInput.dispatchEvent(new Event('input', { bubbles: true }));
    colorInput.value = '#00ff00';
    colorInput.dispatchEvent(new Event('input', { bubbles: true }));

    return { textColor: span.style.color, underlineColor: span.style.textDecorationColor };
  });
  console.log('\nTest 2 - Multiple color changes (final=green):');
  console.log(`  text: ${result2.textColor}, underline: ${result2.underlineColor}`);
  const match2 = result2.textColor === result2.underlineColor;
  console.log(`  ${match2 ? 'PASS' : 'FAIL'}`);
  match2 ? pass++ : fail++;

  // Test 3: Non-underlined span should not have textDecorationColor changed
  const result3 = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[1] || spans[0];
    span.style.textDecoration = 'none';
    span.focus();
    const origUnderlineColor = span.style.textDecorationColor || 'unset';

    const colorInput = document.getElementById('fontColor');
    colorInput.value = '#ff00ff';
    colorInput.dispatchEvent(new Event('input', { bubbles: true }));

    return { textColor: span.style.color, underlineColorBefore: origUnderlineColor, underlineColorAfter: span.style.textDecorationColor || 'unset' };
  });
  console.log('\nTest 3 - Non-underlined span (underline color should not change):');
  console.log(`  text: ${result3.textColor}, underline before: ${result3.underlineColorBefore}, after: ${result3.underlineColorAfter}`);
  const match3 = result3.underlineColorBefore === result3.underlineColorAfter;
  console.log(`  ${match3 ? 'PASS' : 'FAIL'}`);
  match3 ? pass++ : fail++;

  // Test 4: Toggle underline on, then change color
  const result4 = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    span.style.textDecoration = 'none';
    span.focus();

    const underlineBtn = document.getElementById('underlineBtn');
    underlineBtn.click();

    const colorInput = document.getElementById('fontColor');
    colorInput.value = '#ff6600';
    colorInput.dispatchEvent(new Event('input', { bubbles: true }));

    return { textDecoration: span.style.textDecoration, textColor: span.style.color, underlineColor: span.style.textDecorationColor };
  });
  console.log('\nTest 4 - Toggle underline then change color (orange):');
  console.log(`  decoration: ${result4.textDecoration}, text: ${result4.textColor}, underline: ${result4.underlineColor}`);
  const match4 = result4.textDecoration.includes('underline') && result4.textColor === result4.underlineColor;
  console.log(`  ${match4 ? 'PASS' : 'FAIL'}`);
  match4 ? pass++ : fail++;

  console.log(`\n=== Underline Color Tests: ${pass}/${pass+fail} PASS ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
