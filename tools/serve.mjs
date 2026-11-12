// Local preview. Run: node tools/serve.mjs [--port 5210] [--data <folder>]
// --data serves another folder as /data, so sample editions never touch the real one.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataDir = arg('--data', null) ? resolve(arg('--data')) : null;
const port = Number(arg('--port', 5210));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg' };

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let base = rootDir;
    if (dataDir && p.startsWith('/data/')) { base = dataDir; p = p.slice(5); }
    const file = normalize(join(base, p));
    if (file !== base && !file.startsWith(base + sep)) throw new Error('outside');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`The Morning Dispatch preview: http://localhost:${port}`));
