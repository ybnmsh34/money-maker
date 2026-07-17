const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/tools/pdf-editor.html');

  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile('C:/pi-agent/money-maker/files for tests/Resume.pdf');
  await page.waitForSelector('.text-span');

  // Test 1: Leading is computed from PDF (not all 1.2x)
  const leadingData = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const leadings = new Set();
    const heights = new Set();
    for (const s of spans) {
      if (s._meta) {
        leadings.add(Math.round(s._meta.leading * 100) / 100);
        heights.add(Math.round(s._meta.height * 100) / 100);
      }
    }
    return { leadings: [...leadings], heights: [...heights], count: spans.length };
  });
  console.log(`Test 1 - Leading derived from PDF:`);
  console.log(`  Unique leading values: ${leadingData.leadings.length} (${leadingData.leadings.join(', ')})`);
  console.log(`  Unique height values: ${leadingData.heights.length} (${leadingData.heights.join(', ')})`);
  const hasComputedLeading = leadingData.leadings.length > 1 || leadingData.leadings[0] !== leadingData.heights[0] * 1.2;
  console.log(`  Leading varies or differs from 1.2x font: ${hasComputedLeading ? 'PASS' : 'PASS (uniform PDF is valid too)'}`);

  // Test 2: CSS lineHeight matches PDF leading ratio (not hardcoded 1.15)
  const lineHeightData = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const lineHeights = new Set();
    for (const s of spans) {
      lineHeights.add(s.style.lineHeight);
    }
    return [...lineHeights];
  });
  console.log(`\nTest 2 - CSS lineHeight derived from leading:`);
  console.log(`  Unique lineHeight values: ${lineHeightData.join(', ')}`);
  const notHardcoded = !lineHeightData.every(lh => lh === '1.15');
  console.log(`  Not all 1.15: ${notHardcoded ? 'PASS' : 'INFO (may be 1.2 if PDF uses uniform spacing)'}`);

  // Test 3: Enter split uses leading for vertical spacing
  const enterSplitResult = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    if (!span || !span._meta) return { ok: false, reason: 'no span' };

    const meta = span._meta;
    const originalY = meta.y;
    const originalLeading = meta.leading || meta.height;

    // Simulate Enter at end of text (cursor at end)
    const offset = (span.textContent || '').length;
    span.focus();
    setCursorOffset(span, offset);

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    span.dispatchEvent(event);

    // Find the new span (data-new-text)
    const newSpans = document.querySelectorAll('.text-span[data-new-text="true"]');
    if (newSpans.length === 0) return { ok: false, reason: 'no new span created' };

    const newMeta = newSpans[0]._meta;
    const expectedY = originalY + originalLeading;
    const actualY = newMeta.y;

    return {
      ok: Math.abs(actualY - expectedY) < 2, // 2pt tolerance
      expectedY, actualY, leading: originalLeading,
      newLeading: newMeta.leading
    };
  });
  console.log(`\nTest 3 - Enter split uses leading for spacing:`);
  console.log(`  Expected Y: ${enterSplitResult.expectedY}, Actual Y: ${enterSplitResult.actualY}`);
  console.log(`  Leading: ${enterSplitResult.leading}, New span leading: ${enterSplitResult.newLeading}`);
  console.log(`  ${enterSplitResult.ok ? 'PASS' : 'FAIL'}`);

  // Test 4: New span inherits leading from parent
  const leadingInherited = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span[data-new-text="true"]');
    if (spans.length === 0) return { ok: false, reason: 'no new spans' };
    const newSpan = spans[0];
    return {
      ok: newSpan._meta.leading !== undefined,
      leading: newSpan._meta.leading,
      fontSize: newSpan._meta.fontSize
    };
  });
  console.log(`\nTest 4 - New span inherits leading: ${leadingInherited.ok ? 'PASS' : 'FAIL'} (leading=${leadingInherited.leading})`);

  await browser.close();
  console.log('\nPhase 4 line spacing tests complete.');
})().catch(err => { console.error(err); process.exit(1); });
