// Tool database for search
const TOOLS = [
    { name: 'PDF Compressor', slug: 'pdf-compressor', cat: 'PDF', icon: 'pdf' },
    { name: 'PDF Merge', slug: 'pdf-merge', cat: 'PDF', icon: 'pdf' },
    { name: 'PDF Split', slug: 'pdf-split', cat: 'PDF', icon: 'pdf' },
    { name: 'PDF to Word', slug: 'pdf-to-word', cat: 'PDF', icon: 'pdf' },
    { name: 'PDF to Image', slug: 'pdf-to-image', cat: 'PDF', icon: 'pdf' },
    { name: 'PDF Editor', slug: 'pdf-editor', cat: 'PDF', icon: 'pdf' },
    { name: 'Image Converter', slug: 'image-converter', cat: 'Image', icon: 'image' },
    { name: 'Image Compressor', slug: 'image-compressor', cat: 'Image', icon: 'image' },
    { name: 'Image Resizer', slug: 'image-resizer', cat: 'Image', icon: 'image' },
    { name: 'Image Cropper', slug: 'image-cropper', cat: 'Image', icon: 'image' },
    { name: 'Bulk Image Converter', slug: 'bulk-image-converter', cat: 'Image', icon: 'image' },
    { name: 'Image to PDF', slug: 'image-to-pdf', cat: 'Image', icon: 'image' },
    { name: 'Word to PDF', slug: 'word-to-pdf', cat: 'Document', icon: 'doc' },
    { name: 'HTML to PDF', slug: 'html-to-pdf', cat: 'Document', icon: 'doc' },
    { name: 'CSV to JSON', slug: 'csv-to-json', cat: 'Document', icon: 'doc' },
    { name: 'JSON to CSV', slug: 'json-to-csv', cat: 'Document', icon: 'doc' },
    { name: 'QR Code Generator', slug: 'qr-code-generator', cat: 'Other', icon: 'universal' },
    { name: 'Universal Converter', slug: 'universal-converter', cat: 'Other', icon: 'universal' },
];

// Icon SVGs for dropdown
const ICONS = {
    pdf: '<svg viewBox="0 0 24 24" fill="none"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke="currentColor" stroke-width="2"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.973c.621 0 1.14-.52 1.14-1.14v-1.835a7.47 7.47 0 01-1.44-3.66M15.75 3h-7.5" stroke="currentColor" stroke-width="2"/></svg>',
    universal: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/><path d="M14 14h3v3h-3zm4 4h3v3h-3zm0-4h3v3h-3z" stroke="currentColor" stroke-width="2"/></svg>',
};

function navigateToTool(slug) {
    window.location.href = `tools/${slug}.html`;
}

// Search dropdown
const heroSearch = document.getElementById('heroSearch');
const searchDropdown = document.getElementById('searchDropdown');

if (heroSearch && searchDropdown) {
    // Position dropdown below the search bar
    function positionDropdown() {
        const rect = heroSearch.closest('.hero-search').getBoundingClientRect();
        const ddWidth = Math.min(420, window.innerWidth - 40);
        const ddLeft = Math.max(10, rect.left);
        searchDropdown.style.top = (rect.bottom + 8) + 'px';
        searchDropdown.style.left = ddLeft + 'px';
        searchDropdown.style.width = ddWidth + 'px';
    }

    heroSearch.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        
        if (!query) {
            searchDropdown.classList.remove('active');
            searchDropdown.innerHTML = '';
            return;
        }
        
        const matches = TOOLS.filter(t => 
            t.name.toLowerCase().includes(query) || 
            t.cat.toLowerCase().includes(query) ||
            t.slug.includes(query)
        );
        
        if (matches.length === 0) {
            searchDropdown.innerHTML = '<div class="search-dropdown-empty">No tools found</div>';
            positionDropdown();
            searchDropdown.classList.add('active');
            return;
        }
        
        searchDropdown.innerHTML = matches.map(t => `
            <a href="tools/${t.slug}.html" class="search-dropdown-item">
                <div class="sd-icon ${t.icon}">${ICONS[t.icon]}</div>
                <div class="sd-text">
                    <span class="sd-name">${highlightMatch(t.name, query)}</span>
                    <span class="sd-cat">${t.cat}</span>
                </div>
            </a>
        `).join('');
        
        positionDropdown();
        searchDropdown.classList.add('active');
    });
    
    heroSearch.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const first = searchDropdown.querySelector('.search-dropdown-item');
            if (first) first.click();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.hero-search')) {
            searchDropdown.classList.remove('active');
        }
    });
    
    // Close on Escape
    heroSearch.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            searchDropdown.classList.remove('active');
            this.blur();
        }
    });
}

function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.slice(0, idx) + '<mark style="background:rgba(0,212,255,0.2);color:var(--neon-blue);border-radius:2px;padding:0 2px">' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
}

// Search on Enter (legacy)
function searchTools() {
    const query = heroSearch?.value || '';
    if (!query.trim()) return;
    const first = TOOLS.find(t => t.name.toLowerCase().includes(query.toLowerCase()));
    if (first) {
        navigateToTool(first.slug);
    }
}

// Smooth scroll for nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });
