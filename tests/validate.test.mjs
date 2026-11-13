import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEdition } from '../tools/validate.mjs';
import { finishEdition } from '../tools/finish.mjs';
import { spokenText } from '../tools/script.mjs';
import { makeSample } from './sample.mjs';

const clone = (o) => JSON.parse(JSON.stringify(o));
const bad = (change, pattern) => {
  const ed = clone(makeSample('2026-11-12'));
  change(ed);
  const errors = validateEdition(ed);
  assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern}, got: ${errors.join(' | ') || 'no errors'}`);
};

test('the sample edition passes', () => {
  assert.deepEqual(validateEdition(makeSample('2026-11-12')), []);
});
test('rejects things that are not an edition', () => {
  assert.ok(validateEdition(null).length);
  assert.ok(validateEdition([]).length);
  assert.ok(validateEdition({}).length > 5);
});
test('an edition without the analyst box passes', () => {
  const ed = makeSample('2026-11-12');
  delete ed.analyst;
  assert.deepEqual(validateEdition(ed), []);
});
test('every body of text must name its sources', () => {
  bad((e) => { delete e.lead.sources; }, /lead\.sources/);
  bad((e) => { e.front.sources = []; }, /front\.sources/);
  bad((e) => { delete e.front.axes[0].sources; }, /front\.axes\[0\]\.sources/);
  bad((e) => { e.sections[1].sources = [{ name: 'Wire', url: 'http://example.com' }]; }, /sections\[1\]\.sources\[0\]\.url/);
  bad((e) => { delete e.numbers[0].url; }, /numbers\[0\]\.url/);
  bad((e) => { delete e.upcoming[0].url; }, /upcoming\[0\]\.url/);
});
test('rejects markup anywhere', () => bad((e) => { e.sections[0].items[0].summary += ' <img src=x onerror=alert(1)>'; }, /contains < or >/));
test('rejects a link that is not https', () => bad((e) => { e.sections[1].items[0].url = 'javascript:alert(1)'; }, /https link/));
test('rejects a missing section', () => bad((e) => { e.sections = e.sections.filter((s) => s.id !== 'fort-knox'); }, /missing "fort-knox"/));
test('an empty section needs a quiet note', () => {
  bad((e) => { e.sections[2].items = []; }, /quiet_note/);
  const ed = makeSample('2026-11-12');
  ed.sections[2].items = [];
  ed.sections[2].quiet_note = 'Nothing new from the post in the last day.';
  assert.deepEqual(validateEdition(ed), []);
});
test('rejects a pin outside Europe', () => bad((e) => { e.map_events[0].lon = -85.9; }, /inside Europe/));
test('rejects swapped or text coordinates', () => bad((e) => { e.map_events[0].lat = '47.6'; }, /inside Europe/));
test('rejects an unknown status', () => bad((e) => { e.map_events[1].status = 'rumored'; }, /status/));
test('rejects a front with no Kherson axis', () => bad((e) => { e.front.axes = e.front.axes.filter((a) => a.sector !== 'kherson'); }, /nothing for kherson/));
test('rejects an upcoming date in the past', () => bad((e) => { e.upcoming[0].date = '2026-11-01'; }, /before the edition date/));
test('rejects a short audio script', () => bad((e) => { e.audio.script = 'Too short.'; }, /600 to 2200 words/));
test('rejects links in the audio script', () => bad((e) => { e.audio.script += ' See https://example.com for more.'; }, /read aloud/));
test('rejects a stale generated_at', () => bad((e) => { e.generated_at = '2026-11-01T10:00:00Z'; }, /within a day/));
test('rejects an over-long summary', () => bad((e) => { e.sections[0].items[0].summary = 'x'.repeat(701); }, /never copy/));

test('finishEdition files the edition and keeps the index newest first, without repeats', () => {
  const files = new Map();
  const io = {
    read: (p) => (files.has(p) ? files.get(p) : null),
    write: (p, s) => files.set(p, s),
  };
  finishEdition(makeSample('2026-11-11'), io);
  finishEdition(makeSample('2026-11-12'), io);
  finishEdition(makeSample('2026-11-12'), io);
  const idx = JSON.parse(files.get('data/index.json'));
  assert.deepEqual(idx.editions.map((e) => e.date), ['2026-11-12', '2026-11-11']);
  assert.ok(files.has('data/archive/2026-11-12.json'));
  assert.equal(JSON.parse(files.get('data/latest.json')).date, '2026-11-12');
});
test('finishEdition refuses a bad edition and writes nothing', () => {
  const files = new Map();
  const ed = makeSample('2026-11-12');
  delete ed.front;
  assert.throws(() => finishEdition(ed, { read: () => null, write: (p, s) => files.set(p, s) }), /front is required/);
  assert.equal(files.size, 0);
});

test('spokenText says military times and acronyms the way they are spoken', () => {
  const out = spokenText('At 0530 the U.S. Army said NATO and the EU met. ISW and the ZNPP were named at 1730.');
  assert.match(out, /oh five thirty/);
  assert.match(out, /seventeen thirty/);
  assert.match(out, /E U /);
  assert.match(out, /I S W/);
  assert.match(out, /NATO/);
  assert.match(out, /Zaporizhzhia nuclear plant/);
});

// ---------- the Cyber Dispatch ----------
import { readFileSync } from 'node:fs';
import { cyberPage, paperPage, PAGES } from '../tools/sync-pages.mjs';
import { makeCyberSample, makeAiSample } from './sample.mjs';

test('the cyber sample edition passes', () => {
  assert.deepEqual(validateEdition(makeCyberSample('2026-11-12')), []);
});
test('a cyber edition needs its own sections, sectors and the explainer', () => {
  const ed = makeSample('2026-11-12');
  ed.edition = 'cyber';
  const errors = validateEdition(ed).join(' | ');
  assert.match(errors, /missing "threats"/);
  assert.match(errors, /nothing for state/);
  assert.match(errors, /explainer is required/);
});
test('a cyber pin may be anywhere in the world, but not off the map', () => {
  const ed = makeCyberSample('2026-11-12');
  ed.map_events[0].lat = 36.16; ed.map_events[0].lon = -86.78;
  assert.deepEqual(validateEdition(ed), []);
  ed.map_events[0].lat = 91;
  assert.ok(validateEdition(ed).some((e) => /real coordinates/.test(e)));
});
test('rejects an unknown paper', () => bad((e) => { e.edition = 'sports'; }, /edition: one of/));
test('a cyber edition is filed under cyber/data', () => {
  const files = new Map();
  finishEdition(makeCyberSample('2026-11-12'), { read: (p) => files.get(p) ?? null, write: (p, s) => files.set(p, s) });
  assert.deepEqual([...files.keys()].sort(), ['cyber/data/archive/2026-11-12.json', 'cyber/data/index.json', 'cyber/data/latest.json']);
});
test('cyber/index.html is in sync with index.html', () => {
  assert.equal(readFileSync(new URL('../cyber/index.html', import.meta.url), 'utf8'), cyberPage(readFileSync(new URL('../index.html', import.meta.url), 'utf8')));
});

// ---------- the AI Dispatch ----------
test('the AI sample edition passes and is filed under ai/data', () => {
  const ed = makeAiSample('2026-11-12');
  assert.deepEqual(validateEdition(ed), []);
  const files = new Map();
  finishEdition(ed, { read: (p) => files.get(p) ?? null, write: (p, s) => files.set(p, s) });
  assert.ok(files.has('ai/data/latest.json'));
});
test('the AI paper needs a playbook with real steps and a source', () => {
  const check = (change, pattern) => {
    const ed = makeAiSample('2026-11-12');
    change(ed);
    const errors = validateEdition(ed);
    assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern}, got: ${errors.join(' | ') || 'no errors'}`);
  };
  check((e) => { delete e.playbook; }, /playbook: 2 to 6/);
  check((e) => { e.playbook[0].steps = ['Only one step here, which is too few.']; }, /steps: 2 to 6/);
  check((e) => { e.playbook[1].url = 'http://example.com'; }, /playbook\[1\]\.url/);
  check((e) => { delete e.playbook[2].who; }, /playbook\[2\]\.who/);
});
test('every generated page is in sync with index.html', () => {
  const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of Object.keys(PAGES)) {
    assert.equal(readFileSync(new URL(`../${id}/index.html`, import.meta.url), 'utf8'), paperPage(source, id), `${id}/index.html`);
  }
});
