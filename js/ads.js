// Ads placeholder - Add your AdSense code here
// When you have traffic, replace this with real AdSense code

(function() {
    // Create ad slots
    const adSlots = [
        { id: 'ad-header', position: 'header' },
        { id: 'ad-sidebar', position: 'sidebar' },
        { id: 'ad-content', position: 'content' }
    ];

    adSlots.forEach(slot => {
        const adContainer = document.createElement('div');
        adContainer.id = slot.id;
        adContainer.className = 'ad-slot';
        adContainer.style.cssText = `
            max-width: 100%;
            margin: 20px auto;
            padding: 10px;
            text-align: center;
            background: var(--bg);
            border: 1px dashed var(--border);
            border-radius: 8px;
            font-size: 12px;
            color: var(--text-secondary);
        `;
        adContainer.textContent = 'Advertisement';
        
        // Insert into DOM
        if (slot.position === 'header') {
            const nav = document.querySelector('.navbar');
            if (nav) nav.parentNode.insertBefore(adContainer, nav.nextSibling);
        } else if (slot.position === 'content') {
            const main = document.querySelector('main');
            if (main) main.appendChild(adContainer);
        }
    });
})();

// AdSense code template:
// <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
// 
// <!-- Header Ad -->
// <ins class="adsbygoogle"
//      style="display:block"
//      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
//      data-ad-slot="XXXXXXXXXX"
//      data-ad-format="auto"
//      data-full-width-responsive="true"></ins>
// <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
