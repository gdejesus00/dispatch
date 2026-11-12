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
