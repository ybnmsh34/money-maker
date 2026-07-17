import os, re

tools_dir = r'C:/pi-agent/money-maker/public/tools'

for fname in os.listdir(tools_dir):
    if not fname.endswith('.html'):
        continue
    fpath = os.path.join(tools_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Fix font import - replace entire line cleanly
    html = re.sub(
        r'<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">',
        html
    )
    
    # Fix logo SVG - replace solid fill with gradient
    html = html.replace(
        '<rect width="32" height="32" rx="8" fill="#6366f1"/>',
        '<rect width="32" height="32" rx="8" fill="url(#tLG)"/><defs><linearGradient id="tLG" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs>'
    )
    
    # Add scanline after <body>
    if '<div class="scanline"></div>' not in html:
        html = html.replace('<body>', '<body>\n    <div class="scanline"></div>', 1)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Fixed: {fname}")

print("All tool pages fixed!")
