const http = require('http');
const fs = require('fs');
const path = require('path');

const TOOLS = fs.readdirSync(path.join(__dirname, 'public/tools'))
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));

let done = 0;
const issues = [];

TOOLS.forEach(tool => {
    http.get(`http://localhost:3000/tools/${tool}.html`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const checks = [
                { name: 'style.css', pass: data.includes('style.css') },
                { name: 'scanline', pass: data.includes('scanline') },
                { name: 'logo gradient', pass: data.includes('toolLogoGrad') || data.includes('tLG') },
                { name: 'JetBrains Mono', pass: data.includes('JetBrains') },
                { name: 'no old vars', pass: !data.includes('var(--bg)') && !data.includes('var(--surface)') && !data.includes('var(--border)') },
                { name: 'tool-common.js', pass: data.includes('tool-common.js') },
                { name: 'upload zone', pass: data.includes('upload-zone') || data.includes('input-area') },
            ];
            
            const btns = (data.match(/onclick="[^"]*"/g) || []).length;
            const funcs = (data.match(/function\s+[a-zA-Z_][a-zA-Z0-9_]*\(/g) || []).length;
            checks.push({ name: `buttons (${btns})`, pass: btns > 0 });
            checks.push({ name: `functions (${funcs})`, pass: funcs > 0 });
            
            // Check each onclick has a matching function
            const onclickNames = (data.match(/onclick="([^"]+)"/g) || [])
                .map(o => o.match(/onclick="([^"]+)"/)?.[1]?.split('(')[0])
                .filter(Boolean);
            
            onclickNames.forEach(oname => {
                // Skip built-ins like Blob, Array.from, etc.
                if (['Blob', 'Array', 'Math', 'JSON', 'console', 'alert', 'window', 'document', 'parseInt', 'parseFloat', 'setTimeout', 'setInterval'].includes(oname)) return;
                // Skip template literal onclicks
                if (oname.includes('${')) return;
                const exists = data.includes(`function ${oname}`) || data.includes(`const ${oname} =`) || data.includes(`let ${oname} =`);
                if (!exists) {
                    // Check if it's in tool-common.js
                    const common = fs.readFileSync(path.join(__dirname, 'public/js/tool-common.js'), 'utf8');
                    const inCommon = common.includes(`function ${oname}`);
                    if (!inCommon) {
                        checks.push({ name: `function ${oname} missing`, pass: false });
                    }
                }
            });
            
            const failed = checks.filter(c => !c.pass);
            
            if (failed.length > 0) {
                issues.push({ tool, failed });
                console.log(`[FAIL] ${tool}`);
                failed.forEach(f => console.log(`  ✗ ${f.name}`));
            } else {
                console.log(`[PASS] ${tool}`);
            }
            
            done++;
            if (done === TOOLS.length) {
                console.log('');
                console.log('================================');
                console.log(`Total: ${TOOLS.length} tool pages`);
                console.log(`Passed: ${TOOLS.length - issues.length}`);
                console.log(`Failed: ${issues.length}`);
                if (issues.length > 0) {
                    console.log('\nFailed tools:');
                    issues.forEach(i => console.log(`  ${i.tool}`));
                }
                console.log('================================');
            }
        });
    }).on('error', e => {
        issues.push({ tool, error: e.message });
        console.log(`[ERROR] ${tool}: ${e.message}`);
        done++;
    });
});
