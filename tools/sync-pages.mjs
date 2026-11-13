// Builds cyber/index.html and ai/index.html from index.html so the papers never drift apart.
// Run after any change to index.html: node tools/sync-pages.mjs   (add --check to only compare)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PAGES = {
  cyber: { name: 'The Cyber Dispatch', description: 'A daily open-source roll-up of cybersecurity and AI security news.' },
  ai: { name: 'The AI Dispatch', description: 'A daily roll-up of AI news, with techniques from the people who build the tools.' },
};

export function paperPage(html, id) {
  const { name, description } = PAGES[id];
  return html
    .replace('<html lang="en">', `<html lang="en" data-edition="${id}">`)
    .replace('<title>The Morning Dispatch</title>', `<title>${name}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
    .replace('>The Morning Dispatch</h1>', `>${name}</h1>`)
    .replace(/(href|src)="(icons|vendor)\//g, '$1="../$2/')
    .replace('href="styles.css"', 'href="../styles.css"')
    .replace('src="app.js"', 'src="../app.js"')
    .replace(/icons\/icon(\.svg|-192\.png)/g, `icons/${id}$1`);
}
export const cyberPage = (html) => paperPage(html, 'cyber');

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const source = readFileSync('index.html', 'utf8');
  let stale = false;
  for (const id of Object.keys(PAGES)) {
    const want = paperPage(source, id);
    if (process.argv.includes('--check')) {
      let have = '';
      try { have = readFileSync(`${id}/index.html`, 'utf8'); } catch { /* missing */ }
      if (have !== want) { console.error(`${id}/index.html is out of date. Run: node tools/sync-pages.mjs`); stale = true; }
      else console.log(`${id}/index.html is in sync`);
    } else {
      mkdirSync(id, { recursive: true });
      writeFileSync(`${id}/index.html`, want);
      console.log(`wrote ${id}/index.html`);
    }
  }
  if (stale) process.exit(1);
}
