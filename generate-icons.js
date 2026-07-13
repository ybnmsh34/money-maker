const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, output) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, size, size);

    // Rounded rect border with neon glow
    const padding = size * 0.05;
    const radius = size * 0.15;
    const w = size - padding * 2;
    const h = size - padding * 2;

    // Outer glow
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = size * 0.1;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.roundRect(padding, padding, w, h, radius);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gradient fill for icon body
    const grad = ctx.createLinearGradient(padding, padding, size - padding, size - padding);
    grad.addColorStop(0, '#00d4ff');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#ff006e');

    // Draw "FT" text
    ctx.fillStyle = grad;
    ctx.font = `bold ${size * 0.4}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FT', size / 2, size / 2);

    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(output, buf);
    console.log(`✓ Generated ${output} (${buf.length} bytes)`);
}

// Generate icons at multiple sizes
const sizes = [192, 512, 16, 32, 48, 64, 128];
const imagesDir = path.join(__dirname, 'public/images');

// PWA icons
drawIcon(192, path.join(imagesDir, 'icon-192.png'));
drawIcon(512, path.join(imagesDir, 'icon-512.png'));

// Favicons at various sizes
drawIcon(16, path.join(__dirname, 'public/favicon-16.png'));
drawIcon(32, path.join(__dirname, 'public/favicon-32.png'));
drawIcon(48, path.join(__dirname, 'public/favicon-48.png'));
drawIcon(64, path.join(__dirname, 'public/favicon-64.png'));
drawIcon(128, path.join(__dirname, 'public/favicon-128.png'));

// Generate ICO-like PNG (16x16) for favicon.ico
drawIcon(64, path.join(__dirname, 'public/favicon.ico'));

console.log('\nAll icons generated successfully!');
