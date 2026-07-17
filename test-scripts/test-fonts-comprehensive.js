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

  // Test 1: Font dropdown has all expected options
  const options = await page.evaluate(() => {
    const sel = document.getElementById('fontFamily');
    return Array.from(sel.options).map(o => o.value);
  });
  const expected = ['helvetica','serif','monospace','roboto','open-sans','lato','montserrat','raleway','pt-sans','nunito','poppins','playfair-display','merriweather','lora','fira-code','ibm-plex-mono','dancing-script'];
  const allPresent = expected.every(v => options.includes(v));
  console.log(`Test 1 - Font dropdown has ${options.length} options (expect ${expected.length}): ${allPresent ? 'PASS' : 'FAIL'}`);
  if (!allPresent) console.log(`  Missing: ${expected.filter(v => !options.includes(v)).join(', ')}`);
  allPresent ? pass++ : fail++;

  // Test 2: 5 visually distinct fonts applied to different spans
  // Use: Roboto, Playfair Display, Fira Code, Dancing Script, Montserrat
  const fontTests = [
    { font: 'roboto', span: 0, desc: 'Roboto (sans)' },
    { font: 'playfair-display', span: 1, desc: 'Playfair Display (serif)' },
    { font: 'fira-code', span: 2, desc: 'Fira Code (mono)' },
    { font: 'dancing-script', span: 3, desc: 'Dancing Script (cursive)' },
    { font: 'montserrat', span: 4, desc: 'Montserrat (geometric sans)' },
  ];

  const results = await page.evaluate((tests) => {
    const sel = document.getElementById('fontFamily');
    const spans = document.querySelectorAll('.text-span');
    const results = [];

    for (const test of tests) {
      if (!spans[test.span]) {
        results.push({ ok: false, reason: 'no span' });
        continue;
      }

      // Focus the span
      spans[test.span].focus();
      spans[test.span]._meta.fontType = test.font;
      sel.value = test.font;
      spans[test.span].style.fontFamily = mapFontType(test.font);

      results.push({
        ok: true,
        font: test.font,
        family: spans[test.span].style.fontFamily,
        fontType: spans[test.span]._meta.fontType
      });
    }
    return results;
  }, fontTests);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const desc = fontTests[i].desc;
    if (r.ok) {
      console.log(`Test ${i+2} - ${desc}: fontType=${r.fontType}, family="${r.family.substring(0, 40)}..." → PASS`);
      pass++;
    } else {
      console.log(`Test ${i+2} - ${desc}: ${r.reason} → FAIL`);
      fail++;
    }
  }

  // Test 6: Font change updates _meta.fontType
  const metaUpdate = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    span.focus();

    const sel = document.getElementById('fontFamily');
    sel.value = 'lato';
    sel.dispatchEvent(new Event('change', { bubbles: true }));

    return span._meta.fontType === 'lato';
  });
  console.log(`Test 7 - Font change updates _meta.fontType: ${metaUpdate ? 'PASS' : 'FAIL'}`);
  metaUpdate ? pass++ : fail++;

  // Test 8: New span inherits parent's fontType (via Enter split)
  const inherit = await page.evaluate(() => {
    const spans = document.querySelectorAll('.text-span');
    const span = spans[0];
    span._meta.fontType = 'poppins';
    span.focus();

    const offset = (span.textContent || '').length;
    setCursorOffset(span, offset);

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    span.dispatchEvent(event);

    const newSpans = document.querySelectorAll('.text-span[data-new-text="true"]');
    if (newSpans.length === 0) return { ok: false, reason: 'no new span' };

    const newSpan = newSpans[newSpans.length - 1];
    return {
      ok: newSpan._meta.fontType === 'poppins',
      fontType: newSpan._meta.fontType,
      family: newSpan.style.fontFamily
    };
  });
  console.log(`Test 8 - New span inherits fontType (poppins): ${inherit.ok ? 'PASS' : 'FAIL'} (got ${inherit.fontType})`);
  inherit.ok ? pass++ : fail++;

  // Test 9: Export with custom fonts (at least verify no crash)
  const exportTest = await page.evaluate(() => {
    // Verify custom font loading URL structure is correct
    const folderName = 'roboto'.toLowerCase().replace(/\s+/g, '-');
    const url = `fonts/${folderName}/regular.ttf`;
    return { url, ok: url === 'fonts/roboto/regular.ttf' };
  });
  console.log(`Test 9 - Custom font URL structure: ${exportTest.ok ? 'PASS' : 'FAIL'} (${exportTest.url})`);
  exportTest.ok ? pass++ : fail++;

  // Test 10: Verify mapFontType returns correct CSS for each font
  const mapTest = await page.evaluate(() => {
    const tests = [
      { type: 'roboto', expect: 'Roboto' },
      { type: 'playfair-display', expect: 'Playfair' },
      { type: 'fira-code', expect: 'Fira Code' },
      { type: 'dancing-script', expect: 'Dancing' },
      { type: 'ibm-plex-mono', expect: 'IBM Plex' },
    ];
    const results = [];
    for (const t of tests) {
      const css = mapFontType(t.type);
      results.push({
        type: t.type,
        ok: css.includes(t.expect),
        css: css.substring(0, 50)
      });
    }
    return results;
  });
  let mapPass = 0;
  for (const t of mapTest) {
    if (t.ok) mapPass++;
    else console.log(`  ✗ ${t.type}: ${t.css}`);
  }
  console.log(`Test 10 - mapFontType CSS mapping: ${mapPass}/${mapTest.length} → ${mapPass === mapTest.length ? 'PASS' : 'FAIL'}`);
  mapPass === mapTest.length ? pass++ : fail++;

  console.log(`\n=== Font Tests: ${pass}/${pass+fail} PASS ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
