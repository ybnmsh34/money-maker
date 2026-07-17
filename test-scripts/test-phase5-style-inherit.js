const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/tools/pdf-editor.html');

  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile('C:/pi-agent/money-maker/files for tests/Resume.pdf');
  await page.waitForSelector('.text-span');

  // Test 1: Find a bold span and check Enter split inherits bold
  const boldSplit = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    let boldSpan = null;
    for (const s of spans) {
      if (s._meta && s._meta.isBold) { boldSpan = s; break; }
    }
    if (!boldSpan) return { ok: false, reason: 'no bold span found' };

    const meta = boldSpan._meta;
    const offset = (boldSpan.textContent || '').length;
    boldSpan.focus();
    setCursorOffset(boldSpan, offset);

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    boldSpan.dispatchEvent(event);

    const newSpans = document.querySelectorAll('.text-span[data-new-text="true"]');
    if (newSpans.length === 0) return { ok: false, reason: 'no new span' };

    const newSpan = newSpans[0];
    return {
      ok: newSpan._meta.isBold && newSpan.style.fontWeight === 'bold',
      parentBold: meta.isBold,
      parentColor: boldSpan.style.color,
      newBold: newSpan._meta.isBold,
      newFontWeight: newSpan.style.fontWeight,
      newColor: newSpan.style.color
    };
  });
  console.log(`Test 1 - Bold span Enter split inherits bold:`);
  if (!boldSplit.ok && boldSplit.reason) console.log(`  Reason: ${boldSplit.reason}`);
  console.log(`  Parent bold: ${boldSplit.parentBold}, New bold: ${boldSplit.newBold}`);
  console.log(`  Parent color: ${boldSplit.parentColor}, New color: ${boldSplit.newColor}`);
  console.log(`  ${boldSplit.ok ? 'PASS' : (boldSplit.reason ? 'SKIP' : 'FAIL')}`);

  // Test 2: Enter split inherits color (use first span, make it bold first)
  const colorInherit = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    // Make it bold for testing
    span.style.fontWeight = 'bold';
    span._meta.isBold = true;
    const meta = span._meta;

    const parentColor = span.style.color;
    const parentBold = span._meta.isBold;
    const offset = (span.textContent || '').length;
    span.focus();
    setCursorOffset(span, offset);

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    span.dispatchEvent(event);

    const newSpans = document.querySelectorAll('.text-span[data-new-text="true"]');
    if (newSpans.length === 0) return { ok: false, reason: 'no new span' };

    // Check the most recent new span (from this test)
    const newSpan = newSpans[newSpans.length - 1];
    return {
      ok: newSpan.style.color === parentColor && newSpan._meta.isBold === parentBold,
      parentColor,
      newColor: newSpan.style.color,
      parentBold,
      newBold: newSpan._meta.isBold
    };
  });
  console.log(`\nTest 2 - Enter split inherits color + bold:`);
  if (!colorInherit.ok && colorInherit.reason) console.log(`  Reason: ${colorInherit.reason}`);
  console.log(`  Parent: ${colorInherit.parentColor}, bold=${colorInherit.parentBold}, New: ${colorInherit.newColor}, bold=${colorInherit.newBold}`);
  console.log(`  ${colorInherit.ok ? 'PASS' : (colorInherit.reason ? 'SKIP' : 'FAIL')}`);

  // Test 3: Overflow wrap inherits styling
  const wrapInherit = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    // Use first span and make it bold
    const styledSpan = spans[0];
    styledSpan.style.fontWeight = 'bold';
    styledSpan._meta.isBold = true;

    const meta = styledSpan._meta;
    const origText = styledSpan.textContent || '';

    // Add enough text to trigger overflow wrap
    styledSpan.textContent = origText + ' ' + 'x'.repeat(200);
    // Trigger input event for overflow wrap
    const inputEvent = new Event('input', { bubbles: true });
    styledSpan.dispatchEvent(inputEvent);

    const newSpans = document.querySelectorAll('.text-span[data-new-text="true"]');
    if (newSpans.length === 0) return { ok: false, reason: 'no wrapped span created' };

    const wrappedSpan = newSpans[newSpans.length - 1];
    return {
      ok: wrappedSpan._meta.isBold === meta.isBold && wrappedSpan.style.color === styledSpan.style.color,
      parentBold: meta.isBold, wrappedBold: wrappedSpan._meta.isBold,
      parentColor: styledSpan.style.color, wrappedColor: wrappedSpan.style.color
    };
  });
  console.log(`\nTest 3 - Overflow wrap inherits styling:`);
  if (!wrapInherit.ok && wrapInherit.reason) console.log(`  Reason: ${wrapInherit.reason}`);
  console.log(`  Parent bold: ${wrapInherit.parentBold}, Wrapped bold: ${wrapInherit.wrappedBold}`);
  console.log(`  Parent color: ${wrapInherit.parentColor}, Wrapped color: ${wrapInherit.wrappedColor}`);
  console.log(`  ${wrapInherit.ok ? 'PASS' : (wrapInherit.reason ? 'SKIP' : 'FAIL')}`);

  await browser.close();
  console.log('\nPhase 5 style inheritance tests complete.');
})().catch(err => { console.error(err); process.exit(1); });
