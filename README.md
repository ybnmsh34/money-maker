# DevUtils — Free Developer Tools

A collection of free, browser-based developer tools. All processing happens locally in your browser — your data never leaves your device.

## Tools

1. **JSON Formatter** — Format, validate, beautify, and minify JSON
2. **Base64 Converter** — Encode and decode Base64 strings
3. **UUID Generator** — Generate random UUIDs (v4)
4. **Regex Tester** — Test regular expressions with live matching
5. **Hash Generator** — Generate SHA-1, SHA-256, SHA-384, SHA-512 hashes
6. **Color Converter** — Convert between HEX, RGB, and HSL
7. **Lorem Ipsum Generator** — Generate placeholder text
8. **Markdown Preview** — Write Markdown and see live preview
9. **Password Generator** — Generate strong, secure passwords
10. **URL Encoder/Decoder** — Encode and decode URLs
11. **Timestamp Converter** — Convert Unix timestamps to dates

## Local Development

```bash
# Start local server
npx http-server public -p 3000
```

## Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Add it as remote:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
3. Go to Settings → Pages → Source → Deploy from branch → Select `main` branch, `/ (root)`
4. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=public
```

## License

MIT
