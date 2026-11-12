// Turns the edition's audio script into text a speech voice reads well.
// Run: node tools/script.mjs [edition.json] > script.txt
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
const two = (n) => (n < 20 ? SMALL[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + SMALL[n % 10] : ''));

function militaryTime(hh, mm) {
  const h = Number(hh), m = Number(mm);
  const hour = h < 10 ? 'oh ' + SMALL[h] : two(h);
  return `${hour} ${m === 0 ? 'hundred' : m < 10 ? 'oh ' + SMALL[m] : two(m)}`;
}

// Letter-by-letter acronyms. Words said as words (NATO, HIMARS) are left alone.
const SPELLED = ['ISW', 'EU', 'UN', 'UK', 'UAE', 'IAEA', 'OSCE', 'FPV', 'NCO', 'DOD', 'TRADOC', 'HRC', 'ROTC', 'MOD', 'GUR', 'SBU', 'FSB', 'OSW', 'ATACMS', 'IMF', 'G7', 'PT'];
const SAID = { TRADOC: 'TRADOC', ROTC: 'R O T C', ATACMS: 'attackems', G7: 'G seven' };

export function spokenText(script) {
  let s = String(script).replace(/\r/g, '');
  s = s.replace(/\bZNPP\b/g, 'Zaporizhzhia nuclear plant');
  s = s.replace(/\bU\.S\./g, 'U S').replace(/\bUS\b/g, 'U S');
  // 4-digit military times: only when the hour and minute are valid and it is not a year.
  s = s.replace(/\b(at|by|around|about|before|after|from|until|to) ([01]\d|2[0-3])([0-5]\d)\b(?! (hours|people|troops|soldiers|drones))/gi, (m, w, hh, mm) => `${w} ${militaryTime(hh, mm)}`);
  for (const a of SPELLED) s = s.replace(new RegExp(`\\b${a}\\b`, 'g'), SAID[a] || a.split('').join(' ') + ' ');
  s = s.replace(/(\d+)\s?km\b/g, '$1 kilometers').replace(/%/g, ' percent').replace(/&/g, ' and ');
  return s.replace(/[ \t]{2,}/g, ' ').replace(/ ([.,;:])/g, '$1').trim() + '\n';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const ed = JSON.parse(readFileSync(process.argv[2] || 'data/latest.json', 'utf8'));
  process.stdout.write(spokenText(ed.audio.script));
}
