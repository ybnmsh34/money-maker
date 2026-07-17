const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/tools/pdf-editor.html');

  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile('C:/pi-agent/money-maker/files for tests/Resume.pdf');
  await page.waitForSelector('.text-span');
  let pass = 0, fail = 0;

  console.log('=== REGRESSION: All 5 Fixes ===\n');

  // --- Phase 1: Margins (EDGE_PAD = 72) ---
  const edgePad = await page.evaluate(() => EDGE_PAD);
  const bottomPad = await page.evaluate(() => BOTTOM_PAD);
  const clampX = await page.evaluate(() => {
    const meta = { pageNum: 1, x: 10, y: 200, fontSize: 12, fontName: null, width: 100, height: 12, isBold: false, isItalic: false, hasUnderline: false, dir: 'ltr' };
    clampSpanPosition(meta, 1);
    return meta.x;
  });
  console.log(`Phase 1 - Margins:`);
  const p1 = edgePad === 72 && bottomPad === 72 && clampX >= 72;
  console.log(`  EDGE_PAD=72, BOTTOM_PAD=72, clamp prevents x<72: ${p1 ? 'PASS' : 'FAIL'}`);
  p1 ? pass++ : fail++;

  // --- Phase 2: Toolbar Focus ---
  const span = await page.$('.text-span');
  await span.click();
  await new Promise(r => setTimeout(r, 200));
  const boldBtn = await page.$('#boldBtn');
  await boldBtn.click();
  await new Promise(r => setTimeout(r, 200));
  const focusOk = await page.evaluate(() => {
    return document.activeElement.classList.contains('text-span') && currentEditingEl !== null;
  });
  console.log(`\nPhase 2 - Toolbar focus preserved: ${focusOk ? 'PASS' : 'FAIL'}`);
  focusOk ? pass++ : fail++;

  // --- Phase 3: Backspace Merge ---
  const bsResult = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    if (spans.length < 3) return { ok: false };
    const s1 = spans[1], s2 = spans[2];
    const t1 = s1.textContent || '', t2 = s2.textContent || '';
    const sb = document.querySelectorAll('.text-span').length;

    s2.focus();
    setCursorOffset(s2, 0);
    const ev = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    s2.dispatchEvent(ev);

    const sa = document.querySelectorAll('.text-span').length;
    return { ok: !s2.isConnected && s1.isConnected && sa === sb - 1 };
  });
  console.log(`\nPhase 3 - Backspace merges spans: ${bsResult.ok ? 'PASS' : 'FAIL'}`);
  bsResult.ok ? pass++ : fail++;

  // --- Phase 4: Line Spacing from PDF ---
  const lsResult = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    if (!span || !span._meta) return { ok: false };
    const meta = span._meta;

    // Check leading exists and differs from fontSize * 1.2 in some cases
    const leadings = new Set();
    for (const s of spans) {
      if (s._meta) leadings.add(Math.round(s._meta.leading * 100) / 100);
    }

    // Check Enter split uses leading
    const offset = (span.textContent || '').length;
    span.focus();
    setCursorOffset(span, offset);
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    span.dispatchEvent(ev);

    const newSpans = document.querySelectorAll('.text-span[data-new-text="true"]');
    if (newSpans.length === 0) return { ok: false, reason: 'no new span' };
    const newSpan = newSpans[newSpans.length - 1];
    const expectedY = meta.y + (meta.leading || meta.height);
    const actualY = newSpan._meta.y;

    return {
      ok: Math.abs(actualY - expectedY) < 2 && leadings.size > 1,
      leadings: leadings.size,
      expectedY, actualY
    };
  });
  console.log(`\nPhase 4 - Line spacing from PDF (${lsResult.leadings} unique leadings): ${lsResult.ok ? 'PASS' : 'FAIL'}`);
  lsResult.ok ? pass++ : fail++;

  // --- Phase 5: Style Inheritance ---
  const siResult = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    span.style.fontWeight = 'bold';
    span._meta.isBold = true;
    const meta = span._meta;

    const offset = (span.textContent || '').length;
    span.focus();
    setCursorOffset(span, offset);
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    span.dispatchEvent(ev);

    const newSpans = document.querySelectorAll('.text-span[data-new-text="true"]');
    const newSpan = newSpans[newSpans.length - 1];
    return {
      ok: newSpan._meta.isBold === true && newSpan.style.fontWeight === 'bold' && newSpan.style.color === span.style.color,
      newBold: newSpan._meta.isBold,
      newColor: newSpan.style.color
    };
  });
  console.log(`\nPhase 5 - Style inheritance (bold, color): ${siResult.ok ? 'PASS' : 'FAIL'}`);
  siResult.ok ? pass++ : fail++;

  // --- Summary ---
  console.log(`\n=== SUMMARY: ${pass}/${pass + fail} PASS ===`);
  if (fail > 0) console.log(`${fail} test(s) failed!`);
  else console.log('All fixes verified!');

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
