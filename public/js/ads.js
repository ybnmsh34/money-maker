// Ad placeholders - Replace ADSENSE_PUBLISHER_ID with your actual AdSense ID
// Once you have an AdSense account, paste your ID below and the ads will show automatically

const ADSENSE_CONFIG = {
    publisherId: '', // e.g., 'ca-pub-1234567890123456'
    enabled: false   // Set to true once you have an AdSense ID
};

// Auto-detect and inject ads if configured
(function() {
    if (!ADSENSE_CONFIG.enabled || !ADSENSE_CONFIG.publisherId) {
        // No ads configured yet - placeholder slots are in the HTML
        return;
    }

    // Load AdSense
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CONFIG.publisherId;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
})();
