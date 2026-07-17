#!/usr/bin/env python3
import os

html = []
html.append('''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Editor - Edit PDF Text Online | Easy File Tools</title>
    <meta name="description" content="Edit PDF text online for free. Full styling: fonts, colors, bold, italic, underline.">
    <link rel="stylesheet" href="../css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="manifest" href="../manifest.json">
    <link rel="icon" type="image/png" href="../images/icon-192.png">
    <style>
        .editor-toolbar {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 15px 20px; border-radius: 10px; margin-bottom: 20px;
            display: flex; align-items: center; gap: 15px;
            border: 1px solid rgba(0,212,255,0.2); flex-wrap: wrap;
        }
        .toolbar-group { display: flex; align-items: center; gap: 8px; padding: 0 15px; border-right: 1px solid rgba(255,255,255,0.1); }
        .toolbar-group:last-child { border-right: none; }
        .toolbar-group label { font-size: 0.9em; color: var(--text-secondary); }
        .toolbar-group select, .toolbar-group input[type="number"] {
            background: var(--bg-secondary); border: 1px solid rgba(0,212,255,0.3);
            color: var(--text-primary); padding: 8px 12px; border-radius: 6px; font-size: 0.9em;
        }
        .toolbar-group select:focus { outline: none; border-color: var(--neon-blue); }
        .toolbar-group input[type="color"] { width: 30px; height: 30px; border: 1px solid rgba(0,212,255,0.3); border-radius: 6px; cursor: pointer; background: none; }
        .toolbar-group input[type="number"] { width: 60px; text-align: center; }
        .pdf-viewer { background: var(--bg-secondary); border-radius: 10px; padding: 20px; overflow: auto; max-height: 70vh; border: 1px solid rgba(0,212,255,0.2); }
        .pdf-page { position: relative; margin: 0 auto 30px; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.5); overflow: hidden; }
        .text-span {
            position: absolute; white-space: pre; cursor: text; pointer-events: auto; outline: none;
            border: 1px solid transparent; padding: 0; margin: 0; line-height: 1.15;
            user-select: text; transition: border-color 0.15s; overflow: visible;
        }
        .text-span:hover { border: 1px dashed rgba(0,212,255,0.4); }
        .text-span:focus { border: 2px solid var(--neon-blue); z-index: 100; }
        .text-span.changed { border: 1px solid rgba(6,255,210,0.4); }
        .pages-panel { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .page-thumb { width: 80px; height: 100px; background: #fff; border: 2px solid transparent; border-radius: 6px; cursor: pointer; overflow: hidden; transition: border-color 0.2s; }
        .page-thumb:hover { border-color: rgba(0,212,255,0.5); }
        .page-thumb.active { border-color: var(--neon-blue); }
        .page-thumb img { width: 100%; height: 100%; object-fit: contain; }
        .progress-bar { width: 100%; height: 4px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden; margin: 20px 0; display: none; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple)); transition: width 0.3s ease; }
        .result-area { display: none; background: rgba(6,255,210,0.1); border: 1px solid var(--neon-cyan); border-radius: 10px; padding: 20px; text-align: center; margin-top: 20px; }
        .result-area a { color: var(--neon-cyan); text-decoration: none; font-size: 1.2em; font-weight: bold; }
        .result-area a:hover { color: var(--neon-blue); }
        .zoom-controls { display: flex; align-items: center; gap: 10px; }
        .zoom-controls button { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; padding: 0; background: var(--bg-secondary); border: 1px solid rgba(0,212,255,0.3); color: var(--text-primary); border-radius: 6px; cursor: pointer; }
        .zoom-controls button:hover { background: var(--bg-tertiary); }
        .page-indicator { color: var(--text-secondary); font-size: 0.9em; }
        @media (max-width: 768px) {
            .editor-toolbar { flex-direction: column; align-items: stretch; }
            .toolbar-group { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
        }
    </style>
</head>
<body>
    <div class="scanline"></div>
    <nav class="navbar">
        <div class="container nav-content">
            <a href="../index.html" class="logo">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#toolLogoGrad)"/>
                    <defs><linearGradient id="toolLogoGrad" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#8b5cf6"/>
                    </linearGradient></defs>
                    <path d="M8 16L14 22L24 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>FileTools</span>
            </a>
            <div class="nav-links">
                <a href="../index.html#pdf-tools" class="nav-link">PDF Tools</a>
                <a href="../index.html#image-tools" class="nav-link">Image Tools</a>
                <a href="../index.html#document-tools" class="nav-link">Documents</a>
                <a href="../index.html#file-converter" class="nav-link">Converter</a>
            </div>
        </div>
    </nav>
    <main class="container tool-page">
        <div class="tool-header">
            <a href="../index.html" class="back-link">&#x2190; Back to all tools</a>
            <h1>PDF Editor</h1>
            <p>Edit PDF text with full styling. Extracts fonts, colors, bold, italic, underline.</p>
        </div>
        <div class="upload-zone" id="uploadZone">
            <svg viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <h3>Drop PDF here or click to select</h3><p>PDF files only</p>
            <input type="file" id="fileInput" accept=".pdf" hidden>
        </div>
        <div id="editorArea" style="display:none;">
            <div class="editor-toolbar">
                <div class="toolbar-group"><label>Font:</label><select id="fontFamily"><option value="helvetica">Sans-Serif</option><option value="serif">Serif</option><option value="monospace">Monospace</option></select></div>
                <div class="toolbar-group"><label>Size:</label><input type="number" id="fontSizeInput" value="12" min="6" max="72"></div>
                <div class="toolbar-group"><label>Bold:</label><button class="btn btn-secondary" id="boldBtn" onclick="toggleBold()" style="min-width:36px;font-weight:bold;">B</button></div>
                <div class="toolbar-group"><label>Italic:</label><button class="btn btn-secondary" id="italicBtn" onclick="toggleItalic()" style="min-width:36px;font-style:italic;">I</button></div>
                <div class="toolbar-group"><label>Underline:</label><button class="btn btn-secondary" id="underlineBtn" onclick="toggleUnderline()" style="min-width:36px;text-decoration:underline;">U</button></div>
                <div class="toolbar-group"><label>Color:</label><input type="color" id="fontColor" value="#000000"></div>
                <div class="toolbar-group"><label>Zoom:</label><div class="zoom-controls"><button onclick="changeZoom(-0.1)">-</button><span id="zoomLevel" class="page-indicator">100%</span><button onclick="changeZoom(0.1)">+</button></div></div>
                <div class="toolbar-group"><span id="changeCount" class="page-indicator">0 changes</span></div>
                <div class="toolbar-group"><button class="btn" onclick="exportPDF()">Save PDF</button><button class="btn btn-secondary" onclick="resetEditor()">New File</button></div>
            </div>
            <div class="progress-bar" id="progressBar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
            <div class="pages-panel" id="pagesPanel"></div>
            <div class="pdf-viewer" id="viewer"></div>
            <div class="result-area" id="resultArea"><p>PDF edited successfully!</p><a id="downloadLink" href="#" download="edited.pdf">Download Edited PDF</a></div>
        </div>
    </main>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
    <script>
''')

# JavaScript - pure parse, no PDF rendering
js = r"""
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        let pdfDoc = null, currentFile = null, zoom = 1, changes = 0, currentEditingEl = null, allPages = [];
        const $ = id => document.getElementById(id);
        const uploadZone=$('uploadZone'), fileInput=$('fileInput'), editorArea=$('editorArea'), viewer=$('viewer'),
            progressBar=$('progressBar'), progressFill=$('progressFill'), resultArea=$('resultArea'),
            downloadLink=$('downloadLink'), zoomLevelEl=$('zoomLevel'), pagesPanel=$('pagesPanel'),
            changeCountEl=$('changeCount'), fontFamilySelect=$('fontFamily'), fontSizeInput=$('fontSizeInput'),
            fontColorInput=$('fontColor'), boldBtn=$('boldBtn'), italicBtn=$('italicBtn'), underlineBtn=$('underlineBtn');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
        uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('dragover'); const f=e.dataTransfer.files[0]; if(f&&f.type==='application/pdf') loadPDF(f); else alert('Please upload a valid PDF file'); });
        fileInput.addEventListener('change', e => { if(e.target.files[0]) loadPDF(e.target.files[0]); });
        fontFamilySelect.addEventListener('change', () => { if(currentEditingEl) currentEditingEl.style.fontFamily = mapFontType(fontFamilySelect.value); });
        fontSizeInput.addEventListener('change', () => { if(currentEditingEl) currentEditingEl.style.fontSize = (parseInt(fontSizeInput.value)*zoom)+'px'; });
        fontColorInput.addEventListener('input', () => { if(currentEditingEl) currentEditingEl.style.color = fontColorInput.value; });
        function toggleBold(){ if(!currentEditingEl)return; currentEditingEl.style.fontWeight=currentEditingEl.style.fontWeight==='bold'?'normal':'bold'; boldBtn.style.background=currentEditingEl.style.fontWeight==='bold'?'rgba(0,212,255,0.3)':''; }
        function toggleItalic(){ if(!currentEditingEl)return; currentEditingEl.style.fontStyle=currentEditingEl.style.fontStyle==='italic'?'normal':'italic'; italicBtn.style.background=currentEditingEl.style.fontStyle==='italic'?'rgba(0,212,255,0.3)':''; }
        function toggleUnderline(){ if(!currentEditingEl)return; currentEditingEl.style.textDecoration=currentEditingEl.style.textDecoration==='underline'?'none':'underline'; underlineBtn.style.background=currentEditingEl.style.textDecoration==='underline'?'rgba(0,212,255,0.3)':''; }

        // ============================================================
        // LOAD: parse PDF only, never render it for display
        // ============================================================
        async function loadPDF(file){
            currentFile=file; changes=0; allPages=[]; updateChangeCount();
            progressBar.style.display='block'; progressFill.style.width='10%';
            try{
                const ab=await file.arrayBuffer(), bytes=new Uint8Array(ab);
                pdfDoc=await pdfjsLib.getDocument({data:bytes.slice()}).promise;
                progressFill.style.width='30%'; viewer.innerHTML=''; pagesPanel.innerHTML='';
                for(let i=1;i<=pdfDoc.numPages;i++){
                    progressFill.style.width=(30+(i/pdfDoc.numPages*50))+'%';
                    await parsePage(i);
                }
                progressFill.style.width='100%';
                setTimeout(()=>{progressBar.style.display='none';},300);
                uploadZone.style.display='none'; editorArea.style.display='block';
            }catch(err){console.error('Load failed:',err); alert('Failed to load PDF: '+err.message); progressBar.style.display='none';}
        }

        // ============================================================
        // PARSE PAGE: extract data, build pure HTML
        // ============================================================
        async function parsePage(pageNum){
            const page=await pdfDoc.getPage(pageNum);
            const viewport=page.getViewport({scale:1});
            const ops=await page.getOperatorList();
            const textContent=await page.getTextContent();

            const textStyles=extractTextStyles(ops);
            const underlines=extractUnderlines(ops,viewport);
            const lines=groupTextIntoLines(textContent.items,viewport,textStyles,underlines);
            allPages.push({pageNum,width:viewport.width,height:viewport.height,lines});
            buildHTMLPage(pageNum,viewport,lines);
            await createThumbnail(pageNum);
        }

        // ============================================================
        // EXTRACT TEXT STYLES FROM OPERATOR LIST (colors, fonts)
        // ============================================================
        function extractTextStyles(ops){
            const styles=new Map();
            let cc={r:0,g:0,b:0}, cf=null, cfs=0, stc=0;
            for(let i=0;i<ops.fnArray.length;i++){
                const op=ops.fnArray[i], args=ops.argsArray[i];
                if(op===59&&args&&args.length>=3) cc={r:args[0],g:args[1],b:args[2]};
                if(op===37&&args&&args.length>=2){cf=args[0];cfs=args[1];}
                if((op>=44&&op<=47)&&args){
                    stc++; let ht=false;
                    if(args[0]){
                        const chars=Array.isArray(args[0])?args[0]:[args[0]];
                        const t=chars.map(c=>typeof c==='number'?'':(c.unicode||'')).join('');
                        if(t.trim()) ht=true;
                    }
                    styles.set(stc,{color:{...cc},fontName:cf,fontSize:cfs,hasText:ht});
                }
            }
            return styles;
        }

        // ============================================================
        // EXTRACT UNDERLINES FROM OPERATOR LIST (thin rectangles)
        // ============================================================
        function extractUnderlines(ops,viewport){
            const ul=[];
            for(let i=0;i<ops.fnArray.length;i++){
                if(ops.fnArray[i]!==91) continue;
                const args=ops.argsArray[i];
                for(let j=1;j<args.length;j++){
                    const s=args[j];
                    if(s&&s.length>=4&&s[3]<5&&s[2]>20&&s[2]<600)
                        ul.push({y:viewport.height-s[1],x:s[0],width:s[2]});
                }
            }
            return ul;
        }

        // ============================================================
        // GROUP TEXT ITEMS INTO LINES (line-by-line approach)
        // ============================================================
        function groupTextIntoLines(items,viewport,textStyles,underlines){
            const lines=[], thr=3; let si=0;
            for(const item of items){
                si++;
                const tx=item.transform;
                const fs=Math.sqrt(tx[0]*tx[0]+tx[1]*tx[1]);
                const x=tx[4], y=viewport.height-tx[5];
                const style=textStyles.get(si)||{};
                let line=lines.find(l=>Math.abs(l.y-y)<thr);
                if(!line){line={y,items:[],fontSize:fs,fontName:item.fontName}; lines.push(line);}
                line.items.push({
                    str:item.str, x, fontSize:fs, width:item.width||0,
                    fontName:style.fontName||item.fontName,
                    color:style.color||{r:0,g:0,b:0}
                });
            }
            for(const l of lines) l.items.sort((a,b)=>a.x-b.x);
            lines.sort((a,b)=>a.y-b.y);
            for(const l of lines) l.hasUnderline=underlines.some(u=>Math.abs(u.y-l.y)<5);
            return lines;
        }

        // ============================================================
        // BUILD HTML PAGE (no PDF canvas, pure HTML only)
        // ============================================================
        function buildHTMLPage(pageNum,viewport,lines){
            const pageDiv=document.createElement('div');
            pageDiv.className='pdf-page';
            pageDiv.id='pdf-page-'+pageNum;
            pageDiv.style.width=(viewport.width*zoom)+'px';
            pageDiv.style.height=(viewport.height*zoom)+'px';
            for(const line of lines){
                const span=createEditableSpan(line,pageNum);
                pageDiv.appendChild(span);
            }
            viewer.appendChild(pageDiv);
        }

        // ============================================================
        // CREATE EDITABLE SPAN FOR ONE LINE (with full styling)
        // ============================================================
        function createEditableSpan(line,pageNum){
            const span=document.createElement('span');
            span.className='text-span';
            span.contentEditable='true';
            span.spellcheck=false;

            // Text: join ALL items including spaces
            const text=line.items.map(i=>i.str).join('');
            span.textContent=text;
            span.dataset.page=pageNum;
            span.dataset.originalText=text;

            // Position
            const minX=Math.min(...line.items.map(i=>i.x));
            const maxX=Math.max(...line.items.map(i=>i.x+i.width));
            const tw=maxX-minX;
            span.style.position='absolute';
            span.style.left=(minX*zoom)+'px';
            span.style.top=((line.y-line.fontSize)*zoom)+'px';
            span.style.fontSize=(line.fontSize*zoom)+'px';

            // Font family
            span.style.fontFamily=mapFontToWeb(line.fontName);

            // Bold
            const fl=(line.fontName||'').toLowerCase();
            const isBold=fl.includes('bold')||fl.includes('black')||fl.includes('medium')||fl.includes('demi')||fl.includes('semibold');
            span.style.fontWeight=isBold?'bold':'normal';

            // Italic
            const isItalic=fl.includes('italic')||fl.includes('oblique');
            span.style.fontStyle=isItalic?'italic':'normal';

            // Underline
            span.style.textDecoration=line.hasUnderline?'underline':'none';
            if(line.hasUnderline){
                const c=line.items[0].color;
                span.style.textDecorationColor='rgb('+Math.round(c.r*255)+','+Math.round(c.g*255)+','+Math.round(c.b*255)+')';
            }

            // Color
            const col=line.items[0].color;
            span.style.color='rgb('+Math.round(col.r*255)+','+Math.round(col.g*255)+','+Math.round(col.b*255)+')';

            // Other styles
            span.style.lineHeight='1.15';
            span.style.whiteSpace='pre';
            span.style.minWidth=Math.max(tw*zoom,10)+'px';
            span.style.padding='0'; span.style.margin='0';
            span.style.border='1px solid transparent';
            span.style.outline='none';
            span.style.cursor='text';
            span.style.pointerEvents='auto';
            span.style.userSelect='text';

            // Metadata for export
            span._meta={pageNum,x:minX,y:line.y,fontSize:line.fontSize,fontName:line.fontName,width:tw,height:line.fontSize,isBold,isItalic,hasUnderline:line.hasUnderline};

            // Focus: update toolbar
            span.addEventListener('focus',()=>{
                currentEditingEl=span;
                fontSizeInput.value=Math.round(parseInt(span.style.fontSize)/zoom);
                const c=span.style.color;
                if(c.startsWith('rgb')){
                    const m=c.match(/(\d+)/g);
                    if(m) fontColorInput.value='#'+m.slice(0,3).map(v=>{const h=parseInt(v).toString(16);return h.length===1?'0'+h:h;}).join('');
                } else if(c) fontColorInput.value=c;
                const fam=span.style.fontFamily.toLowerCase();
                if(fam.includes('serif')||fam.includes('times')) fontFamilySelect.value='serif';
                else if(fam.includes('monospace')||fam.includes('courier')) fontFamilySelect.value='monospace';
                else fontFamilySelect.value='helvetica';
                boldBtn.style.background=span.style.fontWeight==='bold'?'rgba(0,212,255,0.3)':'';
                italicBtn.style.background=span.style.fontStyle==='italic'?'rgba(0,212,255,0.3)':'';
                underlineBtn.style.background=span.style.textDecoration==='underline'?'rgba(0,212,255,0.3)':'';
            });

            // Blur: track changes
            span.addEventListener('blur',()=>{
                currentEditingEl=null;
                boldBtn.style.background=''; italicBtn.style.background=''; underlineBtn.style.background='';
                const nt=span.textContent, orig=span.dataset.originalText;
                if(nt!==orig){span.dataset.originalText=nt; span.classList.add('changed'); changes++; updateChangeCount();}
            });
            span.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();span.blur();}});
            return span;
        }

        function mapFontToWeb(name){
            if(!name) return "'Helvetica', Arial, sans-serif";
            const n=name.toLowerCase();
            if(n.includes('times')||n.includes('roman')) return "'Times New Roman', Times, serif";
            if(n.includes('courier')||n.includes('mono')) return "'Courier New', Courier, monospace";
            return "'Helvetica', Arial, sans-serif";
        }
        function mapFontType(type){
            if(type==='serif') return "'Times New Roman', Times, serif";
            if(type==='monospace') return "'Courier New', Courier, monospace";
            return "'Helvetica', Arial, sans-serif";
        }

        async function createThumbnail(pageNum){
            const thumb=document.createElement('div');
            thumb.className='page-thumb'+(pageNum===1?' active':'');
            const img=document.createElement('img');
            const page=await pdfDoc.getPage(pageNum), vp=page.getViewport({scale:0.2});
            const c=document.createElement('canvas'); c.width=vp.width; c.height=vp.height;
            await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
            img.src=c.toDataURL(); thumb.appendChild(img); thumb.title='Page '+pageNum;
            thumb.addEventListener('click',()=>{
                document.querySelectorAll('.page-thumb').forEach(t=>t.classList.remove('active'));
                thumb.classList.add('active');
                document.getElementById('pdf-page-'+pageNum).scrollIntoView({behavior:'smooth'});
            });
            pagesPanel.appendChild(thumb);
        }

        function changeZoom(d){zoom=Math.max(0.5,Math.min(3,zoom+d)); zoomLevelEl.textContent=Math.round(zoom*100)+'%'; rebuildAll();}
        async function rebuildAll(){
            viewer.innerHTML=''; pagesPanel.innerHTML='';
            for(const p of allPages){
                const page=await pdfDoc.getPage(p.pageNum), vp=page.getViewport({scale:1}),
                      ops=await page.getOperatorList(), tc=await page.getTextContent();
                const ts=extractTextStyles(ops), ul=extractUnderlines(ops,vp);
                const lines=groupTextIntoLines(tc.items,vp,ts,ul);
                buildHTMLPage(p.pageNum,vp,lines); await createThumbnail(p.pageNum);
            }
        }

        async function exportPDF(){
            progressBar.style.display='block'; progressFill.style.width='30%'; resultArea.style.display='none';
            try{
                const ab=await currentFile.arrayBuffer(), bytes=new Uint8Array(ab);
                const doc=await PDFLib.PDFDocument.load(bytes.slice());
                progressFill.style.width='50%';
                const helvetica=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
                const times=await doc.embedFont(PDFLib.StandardFonts.TimesRoman);
                const courier=await doc.embedFont(PDFLib.StandardFonts.Courier);
                const spans=document.querySelectorAll('.text-span');
                for(const span of spans){
                    const nt=span.textContent, orig=span.dataset.originalText;
                    if(nt===orig) continue;
                    const m=span._meta, pg=doc.getPage(m.pageNum-1);
                    const {width:pw,height:ph}=pg.getSize();
                    const pe=document.getElementById('pdf-page-'+m.pageNum);
                    const sx=pw/pe.offsetWidth, sy=ph/pe.offsetHeight;
                    const x=m.x*sx, y=ph-(m.y*sy), fs=m.fontSize*Math.min(sx,sy), tw=m.width*sx;
                    let font=helvetica;
                    if(m.fontName&&(/times|roman/i.test(m.fontName))) font=times;
                    else if(m.fontName&&(/courier|mono/i.test(m.fontName))) font=courier;
                    pg.drawLine({start:{x:x-2,y:y+fs*0.8},end:{x:x+tw+2,y:y+fs*0.8},thickness:fs*1.3,color:PDFLib.rgb(1,1,1)});
                    pg.drawText(nt,{x,y:y+fs*0.15,size:fs,font,color:PDFLib.rgb(0,0,0)});
                }
                progressFill.style.width='90%';
                const pb=await doc.save(), blob=new Blob([pb],{type:'application/pdf'});
                downloadLink.href=URL.createObjectURL(blob); downloadLink.download='edited.pdf';
                progressFill.style.width='100%';
                setTimeout(()=>{progressBar.style.display='none';resultArea.style.display='block';},300);
            }catch(err){console.error('Export failed:',err); alert('Export failed: '+err.message); progressBar.style.display='none';}
        }

        function resetEditor(){
            pdfDoc=null; currentFile=null; allPages=[]; changes=0; zoom=1; currentEditingEl=null;
            zoomLevelEl.textContent='100%'; viewer.innerHTML=''; pagesPanel.innerHTML='';
            resultArea.style.display='none'; uploadZone.style.display='block';
            editorArea.style.display='none'; fileInput.value=''; updateChangeCount();
        }
        function updateChangeCount(){changeCountEl.textContent=changes+(changes===1?' change':' changes');}
""";

html.append(js)
html.append('\n    </script>\n</body>\n</html>')

out = '\n'.join(html)
path = os.path.join(os.path.dirname(__file__), 'public', 'tools', 'pdf-editor.html')
with open(path, 'w', encoding='utf-8') as f:
    f.write(out)

print(f'Written {len(out)} bytes to {path}')
