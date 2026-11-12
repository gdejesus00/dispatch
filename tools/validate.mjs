// Checks an edition file before it is published. Run: node tools/validate.mjs [file]
// Exit code 0 means the edition is safe to publish. Anything else keeps yesterday's edition up.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SECTION_IDS = ['ukraine', 'army', 'fort-knox', 'europe'];
export const STATUSES = ['claimed', 'corroborated', 'confirmed'];
export const EVENT_TYPES = ['ground', 'strike', 'air-defense', 'naval', 'infrastructure', 'diplomatic', 'other'];
export const SECTORS = ['zaporizhzhia', 'kherson'];
export const CONFIDENCE = ['low', 'moderate', 'high'];

const isStr = (v, min = 1, max = 10000) => typeof v === 'string' && v.trim().length >= min && v.length <= max;
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z'));
const isUrl = (v) => {
  if (typeof v !== 'string') return false;
  try { return new URL(v).protocol === 'https:'; } catch { return false; }
};
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

export function validateEdition(ed) {
  const errors = [];
  const err = (m) => errors.push(m);
  if (!ed || typeof ed !== 'object' || Array.isArray(ed)) return ['edition is not an object'];

  // No markup anywhere: the page shows text only, and this keeps copied page code out.
  (function scan(v, path) {
    if (typeof v === 'string') {
      if (/[<>]/.test(v)) err(`${path}: contains < or >`);
    } else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) scan(v[k], `${path}.${k}`);
  })(ed, 'edition');

  if (ed.schema !== 1) err('schema must be 1');
  if (!isDate(ed.date)) err('date must be YYYY-MM-DD');
  if (!isStr(ed.generated_at) || Number.isNaN(Date.parse(ed.generated_at))) err('generated_at must be an ISO time');
  else if (isDate(ed.date)) {
    const gap = Math.abs(Date.parse(ed.generated_at) - Date.parse(ed.date + 'T12:00:00Z'));
    if (gap > 36 * 3600 * 1000) err('generated_at is not within a day of date');
  }

  // Every body of text names where it came from: a list of { name, url } links.
  const srcs = (list, path) => {
    if (!Array.isArray(list) || list.length < 1 || list.length > 8) return err(`${path}: 1 to 8 sources, each { name, url }`);
    list.forEach((x, i) => {
      if (!x || !isStr(x.name, 2, 80)) err(`${path}[${i}].name: the outlet`);
      if (!x || !isUrl(x.url)) err(`${path}[${i}].url: must be an https link`);
    });
  };

  srcs(ed.lead && ed.lead.sources, 'lead.sources');
  if (!ed.lead || !isStr(ed.lead.headline, 8, 140)) err('lead.headline: 8 to 140 characters');
  if (!ed.lead || !isStr(ed.lead.dek, 20, 320)) err('lead.dek: 20 to 320 characters');
  if (!isStr(ed.bottom_line, 80, 900)) err('bottom_line: 80 to 900 characters');

  const item = (it, path) => {
    if (!it || typeof it !== 'object') return err(`${path}: not an object`);
    if (!isStr(it.headline, 8, 160)) err(`${path}.headline: 8 to 160 characters`);
    if (!isStr(it.summary, 40, 700)) err(`${path}.summary: 40 to 700 characters (summarise, never copy)`);
    if (!isStr(it.source, 2, 80)) err(`${path}.source: name of the outlet`);
    if (!isUrl(it.url)) err(`${path}.url: must be an https link`);
    if (!isDate(it.published)) err(`${path}.published: YYYY-MM-DD`);
    if (it.status !== undefined && !STATUSES.includes(it.status)) err(`${path}.status: ${STATUSES.join(', ')}`);
  };

  if (!Array.isArray(ed.sections)) err('sections must be a list');
  else {
    const ids = ed.sections.map((s) => s && s.id);
    for (const id of SECTION_IDS) if (!ids.includes(id)) err(`sections: missing "${id}"`);
    ed.sections.forEach((s, i) => {
      const p = `sections[${i}]`;
      if (!s || !SECTION_IDS.includes(s.id)) return err(`${p}.id: one of ${SECTION_IDS.join(', ')}`);
      if (!isStr(s.summary, 40, 900)) err(`${p}.summary: 40 to 900 characters`);
      srcs(s.sources, `${p}.sources`);
      if (!Array.isArray(s.items)) return err(`${p}.items must be a list`);
      if (s.items.length > 8) err(`${p}.items: 8 at most`);
      if (s.items.length === 0 && !isStr(s.quiet_note, 10, 300)) err(`${p}: no items needs a quiet_note saying so`);
      s.items.forEach((it, j) => item(it, `${p}.items[${j}]`));
    });
  }

  const f = ed.front;
  if (!f || typeof f !== 'object') err('front is required');
  else {
    if (!isStr(f.summary, 60, 900)) err('front.summary: 60 to 900 characters');
    srcs(f.sources, 'front.sources');
    if (!Array.isArray(f.axes) || f.axes.length < 3 || f.axes.length > 10) err('front.axes: 3 to 10 axes');
    else {
      f.axes.forEach((a, i) => {
        const p = `front.axes[${i}]`;
        if (!a || !isStr(a.name, 3, 60)) err(`${p}.name`);
        if (!a || !SECTORS.includes(a.sector)) err(`${p}.sector: ${SECTORS.join(' or ')}`);
        if (!a || !STATUSES.includes(a.status)) err(`${p}.status: ${STATUSES.join(', ')}`);
        if (!a || !isStr(a.text, 40, 700)) err(`${p}.text: 40 to 700 characters`);
        srcs(a && a.sources, `${p}.sources`);
      });
      for (const s of SECTORS) if (!f.axes.some((a) => a && a.sector === s)) err(`front.axes: nothing for ${s}`);
    }
  }

  if (!Array.isArray(ed.map_events) || ed.map_events.length < 3 || ed.map_events.length > 40) err('map_events: 3 to 40 events');
  else {
    ed.map_events.forEach((e, i) => {
      const p = `map_events[${i}]`;
      if (!e || typeof e !== 'object') return err(`${p}: not an object`);
      if (!isStr(e.title, 6, 120)) err(`${p}.title`);
      if (!isStr(e.summary, 30, 500)) err(`${p}.summary: 30 to 500 characters`);
      if (!isStr(e.place, 2, 80)) err(`${p}.place`);
      if (typeof e.lat !== 'number' || typeof e.lon !== 'number' || e.lat < 30 || e.lat > 72 || e.lon < -25 || e.lon > 60)
        err(`${p}: lat/lon must be numbers inside Europe (lat 30 to 72, lon -25 to 60)`);
      if (!EVENT_TYPES.includes(e.type)) err(`${p}.type: ${EVENT_TYPES.join(', ')}`);
      if (!STATUSES.includes(e.status)) err(`${p}.status: ${STATUSES.join(', ')}`);
      if (!isDate(e.date)) err(`${p}.date: YYYY-MM-DD`);
      if (!isStr(e.source, 2, 80)) err(`${p}.source`);
      if (!isUrl(e.url)) err(`${p}.url: must be an https link`);
    });
  }

  const a = ed.analyst;
  // The analyst box was removed from the page on request. Old editions still carry it; new ones leave it out.
  if (a !== undefined) {
    if (!a || typeof a !== 'object') err('analyst must be an object when present');
    else {
    if (!isStr(a.indicator, 10, 200)) err('analyst.indicator');
    if (!isStr(a.judgment, 40, 700)) err('analyst.judgment');
    if (!CONFIDENCE.includes(a.confidence)) err(`analyst.confidence: ${CONFIDENCE.join(', ')}`);
    if (!isStr(a.why, 20, 400)) err('analyst.why');
    }
  }

  if (!Array.isArray(ed.numbers) || ed.numbers.length > 6) err('numbers: a list of up to 6');
  else ed.numbers.forEach((n, i) => {
    if (!n || !isStr(n.value, 1, 14)) err(`numbers[${i}].value: short, like "112" or "38%"`);
    if (!n || !isStr(n.label, 6, 120)) err(`numbers[${i}].label`);
    if (!n || !isStr(n.source, 2, 80)) err(`numbers[${i}].source`);
    if (!n || !isUrl(n.url)) err(`numbers[${i}].url: must be an https link to where the number came from`);
  });

  if (!Array.isArray(ed.upcoming) || ed.upcoming.length < 2 || ed.upcoming.length > 14) err('upcoming: 2 to 14 entries');
  else ed.upcoming.forEach((u, i) => {
    const p = `upcoming[${i}]`;
    if (!u || !isDate(u.date)) return err(`${p}.date: YYYY-MM-DD`);
    if (isDate(ed.date) && u.date < ed.date) err(`${p}.date is before the edition date`);
    if (!isStr(u.title, 6, 120)) err(`${p}.title`);
    if (!isStr(u.detail, 20, 400)) err(`${p}.detail`);
    if (![...SECTION_IDS, 'front'].includes(u.topic)) err(`${p}.topic: ${[...SECTION_IDS, 'front'].join(', ')}`);
    if (!isUrl(u.url)) err(`${p}.url: must be an https link to the source of the date`);
  });

  if (!ed.audio || !isStr(ed.audio.script, 1)) err('audio.script is required');
  else {
    const n = words(ed.audio.script);
    if (n < 600 || n > 2200) err(`audio.script: 600 to 2200 words (has ${n})`);
    if (/https?:|www\.|[#*_|]/.test(ed.audio.script)) err('audio.script: no links or markdown symbols, it is read aloud');
  }

  if (!Array.isArray(ed.sources) || ed.sources.length < 5) err('sources: at least 5');
  else ed.sources.forEach((s, i) => {
    if (!s || !isStr(s.title, 3, 200)) err(`sources[${i}].title`);
    if (!s || !isUrl(s.url)) err(`sources[${i}].url: must be an https link`);
  });

  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const file = process.argv[2] || 'data/latest.json';
  let ed;
  try { ed = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { console.error(`${file}: cannot read as JSON: ${e.message}`); process.exit(2); }
  const errors = validateEdition(ed);
  if (errors.length) {
    console.error(`${file}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(' - ' + e);
    process.exit(1);
  }
  console.log(`${file}: OK (${ed.date}, ${ed.map_events.length} map events, ${ed.audio.script.trim().split(/\s+/).length} spoken words)`);
}
