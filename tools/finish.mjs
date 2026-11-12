// Files a finished edition: checks it, then writes latest.json, the archive copy and the index.
// Run: node tools/finish.mjs <edition.json>
// If the edition has a problem, nothing is written and the last good edition stays in place.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateEdition } from './validate.mjs';
import { profileOf } from '../profiles.js';

const diskIo = {
  read: (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null),
  write: (p, s) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s); },
};

export function finishEdition(ed, io = diskIo) {
  const errors = validateEdition(ed);
  if (errors.length) throw new Error(`edition has ${errors.length} problem(s):\n - ` + errors.join('\n - '));
  const dir = profileOf(ed.edition).dir + 'data'; // data/ for the Morning Dispatch, cyber/data/ for the Cyber Dispatch
  let index = { editions: [] };
  try { const old = JSON.parse(io.read(`${dir}/index.json`) || 'null'); if (old && Array.isArray(old.editions)) index = old; } catch { /* start a new index */ }
  const editions = index.editions.filter((e) => e && e.date !== ed.date);
  editions.push({ date: ed.date, headline: ed.lead.headline });
  editions.sort((a, b) => b.date.localeCompare(a.date));
  const text = JSON.stringify(ed, null, 1) + '\n';
  io.write(`${dir}/archive/${ed.date}.json`, text);
  io.write(`${dir}/latest.json`, text);
  io.write(`${dir}/index.json`, JSON.stringify({ editions: editions.slice(0, 120) }, null, 1) + '\n');
  return editions.length;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node tools/finish.mjs <edition.json>'); process.exit(2); }
  try {
    const ed = JSON.parse(readFileSync(file, 'utf8'));
    const n = finishEdition(ed);
    console.log(`Filed the ${ed.date} edition. ${n} edition(s) on file.`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
