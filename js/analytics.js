// Analytics placeholder - Add your Google Analytics code here
// When you have traffic, replace this with real Analytics code

(function() {
    // Track page views
    function trackPageView(path) {
        // Google Analytics 4 template:
        // gtag('config', 'G-XXXXXXXXXX', { page_path: path });
        
        // For now, just log to console
        console.log('Page viewed:', path);
    }

    // Track tool usage
    function trackToolUsage(toolName) {
        // Google Analytics 4 template:
        // gtag('event', 'tool_used', { tool_name: toolName });
        
        console.log('Tool used:', toolName);
    }

    // Track downloads
    function trackDownload(filename) {
        // Google Analytics 4 template:
        // gtag('event', 'download', { file_name: filename });
        
        console.log('Downloaded:', filename);
    }

    // Track file conversions
    function trackConversion(fromFormat, toFormat) {
        // Google Analytics 4 template:
        // gtag('event', 'file_converted', { 
        //     from_format: fromFormat, 
        //     to_format: toFormat 
        // });
        
        console.log('Conversion:', fromFormat, '→', toFormat);
    }

    // Expose functions globally
    window.analytics = {
        trackPageView,
        trackToolUsage,
        trackDownload,
        trackConversion
    };

    // Auto-track page view
    trackPageView(window.location.pathname);
})();

// Google Analytics 4 setup template:
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
// <script>
//   window.dataLayer = window.dataLayer || [];
//   function gtag(){dataLayer.push(arguments);}
//   gtag('js', new Date());
//   gtag('config', 'G-XXXXXXXXXX');
// </script>
