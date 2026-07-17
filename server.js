const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
    filePath = path.resolve(filePath);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            // Never cache CSS/JS - always serve latest
            const headers = {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            res.writeHead(200, headers);
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`FileTools running at http://localhost:${PORT}`);
});
