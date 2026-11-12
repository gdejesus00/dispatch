// Builds cyber/index.html from index.html so the two papers never drift apart.
// Run after any change to index.html: node tools/sync-pages.mjs   (add --check to only compare)
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function cyberPage(html) {
  return html
    .replace('<html lang="en">', '<html lang="en" data-edition="cyber">')
    .replace('<title>The Morning Dispatch</title>', '<title>The Cyber Dispatch</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="A daily open-source roll-up of cybersecurity and AI news.">')
    .replace('>The Morning Dispatch</h1>', '>The Cyber Dispatch</h1>')
    .replace('href="manifest.webmanifest"', 'href="manifest.webmanifest"')
    .replace(/(href|src)="(icons|vendor)\//g, '$1="../$2/')
    .replace('href="styles.css"', 'href="../styles.css"')
    .replace('src="app.js"', 'src="../app.js"')
    .replace(/icons\/icon(\.svg|-192\.png)/g, 'icons/cyber$1');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const want = cyberPage(readFileSync('index.html', 'utf8'));
  if (process.argv.includes('--check')) {
    let have = '';
    try { have = readFileSync('cyber/index.html', 'utf8'); } catch { /* missing */ }
    if (have !== want) { console.error('cyber/index.html is out of date. Run: node tools/sync-pages.mjs'); process.exit(1); }
    console.log('cyber/index.html is in sync');
  } else {
    writeFileSync('cyber/index.html', want);
    console.log('wrote cyber/index.html');
  }
}
