const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/tools/pdf-editor.html');

  // Upload PDF
  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile('C:/pi-agent/money-maker/files for tests/Resume.pdf');
  await page.waitForSelector('.text-span');

  const initialSpans = await page.$$('.text-span');
  console.log(`Initial spans on page 1: ${initialSpans.length}`);

  // Test 1: Backspace at start of span merges with previous span
  // First, focus on a span that has a predecessor (not the first one)
  await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    if (spans.length > 2) {
      spans[2].focus();
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // Move cursor to start (position 0) and press backspace
  const mergeResult = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    if (spans.length < 2) return { ok: false, reason: 'not enough spans' };

    const span2 = spans[2];
    const span1 = spans[1];
    const text1 = span1.textContent || '';
    const text2 = span2.textContent || '';

    // Simulate: cursor at position 0 of span2, press backspace
    span2.focus();
    // Use a range to place cursor at position 0
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(span2, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // Trigger backspace keydown
    const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    span2.dispatchEvent(event);

    // After merge, span2 should be removed
    const remaining = document.querySelectorAll('.text-span');
    const span1StillExists = span1.isConnected;
    const span2Removed = !span2.isConnected;
    const mergedText = span1StillExists ? span1.textContent : '';

    return {
      ok: span2Removed && span1StillExists,
      span1Text: text1,
      span2Text: text2,
      mergedText: mergedText,
      spansBefore: document.querySelectorAll('.pdf-page:first-child .text-span').length + 1,
      spansAfter: remaining.length
    };
  });
  console.log(`Test 1 - Backspace merges span at cursor pos 0:`);
  console.log(`  Span merged: ${mergeResult.ok ? 'PASS' : 'FAIL'}`);
  console.log(`  Spans: ${mergeResult.spansBefore} → ${mergeResult.spansAfter}`);
  console.log(`  Merged text starts with span1 text: ${mergeResult.mergedText.startsWith(mergeResult.span1Text) ? 'PASS' : 'FAIL'}`);

  // Test 2: Backspace in empty span deletes the span
  // Use createNewSpan (the actual function) to get proper event handlers
  const emptySpanResult = await page.evaluate(() => {
    const pageDiv = document.querySelector('.pdf-page');
    const emptySpan = createNewSpan(1, 200, 500, 12, '', null, 'ltr');
    pageDiv.appendChild(emptySpan);

    const spansBefore = document.querySelectorAll('.text-span').length;

    // Focus empty span and press backspace
    emptySpan.focus();
    const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    emptySpan.dispatchEvent(event);

    const spansAfter = document.querySelectorAll('.text-span').length;
    return {
      ok: !emptySpan.isConnected && spansAfter === spansBefore - 1,
      spansBefore, spansAfter
    };
  });
  console.log(`\nTest 2 - Backspace deletes empty span: ${emptySpanResult.ok ? 'PASS' : 'FAIL'} (${emptySpanResult.spansBefore} → ${emptySpanResult.spansAfter})`);

  // Test 3: Backspace NOT at position 0 should NOT merge (normal delete behavior)
  const noMergeResult = await page.evaluate(() => {
    // Find a span with enough text
    const spans = document.querySelectorAll('.text-span');
    let span = null;
    for (const s of spans) {
      if ((s.textContent || '').length >= 3) { span = s; break; }
    }
    if (!span) return { ok: false, reason: 'no span with enough text' };

    const originalText = span.textContent || '';
    // Place cursor at position 2
    span.focus();
    setCursorOffset(span, 2);

    const spansBefore = document.querySelectorAll('.text-span').length;

    // Trigger backspace at position 2 (should delete character, not merge)
    const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    span.dispatchEvent(event);

    const spansAfter = document.querySelectorAll('.text-span').length;
    return {
      ok: spansBefore === spansAfter && span.isConnected,
      spansBefore, spansAfter,
      textBefore: originalText,
      textAfter: span.textContent
    };
  });
  console.log(`\nTest 3 - Backspace mid-text does NOT merge: ${noMergeResult.ok ? 'PASS' : 'FAIL'}`);
  console.log(`  Spans unchanged: ${noMergeResult.spansBefore} → ${noMergeResult.spansAfter}`);

  await browser.close();
  console.log('\nPhase 3 backspace tests complete.');
})().catch(err => { console.error(err); process.exit(1); });
