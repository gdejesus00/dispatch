// Builds a made-up edition for tests and for looking at the layout. Never published.
// Run: node tests/sample.mjs <out-dir>   (writes latest.json and index.json there)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const addDays = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);

export function makeSample(date = new Date().toISOString().slice(0, 10)) {
  const y = addDays(date, -1);
  const item = (n, topic, status) => ({
    headline: `Sample ${topic} headline number ${n} for layout testing`,
    summary: `This is made-up sample text for checking the layout. It stands in for a two or three sentence summary of a ${topic} story, written in plain words, with the source linked underneath.`,
    source: 'Sample Wire', url: 'https://example.com/story-' + n, published: n % 2 ? date : y,
    ...(status ? { status } : {}),
  });
  const ev = (title, place, lat, lon, type, status, d = date) => ({
    title, place, lat, lon, type, status, date: d, source: 'Sample Wire', url: 'https://example.com/event',
    summary: `Sample event text for ${place}. In a real edition this says what was reported, by whom, and how well it is supported.`,
  });
  const para = 'This is a sample paragraph of the spoken brief, written for the ear with short sentences and no symbols. It exists only so the page and the audio step have something of a realistic length to work with during testing. ';
  return {
    schema: 1, date, generated_at: `${date}T10:05:00Z`,
    lead: {
      headline: 'Sample edition: pressure builds near Huliaipole as talks continue',
      dek: 'A made-up front page for testing the layout. Nothing on this page is real reporting.',
    },
    bottom_line: 'This is sample text, not news. In a real edition this paragraph gives the two or three things that matter most from the last twenty-four hours, in plain sentences, so the reader could stop here and still be current. It covers the front, the service and the continent in that order.',
    numbers: [
      { value: '112', label: 'Sample count of combat clashes reported along the front', source: 'Sample Wire' },
      { value: '38', label: 'Sample count of drones reported shot down overnight', source: 'Sample Wire' },
      { value: '3', label: 'Sample count of days until the next ministers meeting', source: 'Sample Wire' },
    ],
    analyst: {
      indicator: 'Watch for armor moving up near Huliaipole',
      judgment: 'Sample judgment: a renewed mechanized push on this axis in the next week is likely, because small-group infantry probing has continued for several days without a pause.',
      confidence: 'moderate',
      why: 'Sample reasoning: two independent sources agree on the pattern, with no visual confirmation yet.',
    },
    front: {
      summary: 'Sample summary of the southern front. Fighting is heaviest east of Huliaipole, steady near Orikhiv, and limited to drones and artillery along the Dnipro.',
      axes: [
        { name: 'Huliaipole', sector: 'zaporizhzhia', status: 'corroborated', text: 'Sample text for the Huliaipole axis, saying what changed and how well it is supported by the sources.' },
        { name: 'Orikhiv', sector: 'zaporizhzhia', status: 'claimed', text: 'Sample text for the Orikhiv axis, saying what changed and how well it is supported by the sources.' },
        { name: 'Stepnohirsk and Kamianske', sector: 'zaporizhzhia', status: 'confirmed', text: 'Sample text for the Stepnohirsk axis, saying what changed and how well it is supported by the sources.' },
        { name: 'Dnipro line and islands', sector: 'kherson', status: 'claimed', text: 'Sample text for the Dnipro line, saying what changed and how well it is supported by the sources.' },
        { name: 'Kherson city', sector: 'kherson', status: 'corroborated', text: 'Sample text for Kherson city, saying what changed and how well it is supported by the sources.' },
      ],
    },
    map_events: [
      ev('Sample assaults reported east of Huliaipole', 'Huliaipole', 47.6636, 36.2569, 'ground', 'corroborated'),
      ev('Sample glide bomb strike on Orikhiv', 'Orikhiv', 47.5681, 35.7856, 'strike', 'claimed'),
      ev('Sample drone strike in Zaporizhzhia city', 'Zaporizhzhia', 47.8388, 35.1396, 'strike', 'confirmed', y),
      ev('Sample power line cut near the nuclear plant', 'Enerhodar', 47.5119, 34.5858, 'infrastructure', 'corroborated', y),
      ev('Sample shelling of Kherson city', 'Kherson', 46.6354, 32.6169, 'strike', 'confirmed'),
      ev('Sample boat landing attempt on the islands', 'Dnipro delta', 46.56, 32.55, 'naval', 'claimed'),
      ev('Sample air defense activity over Kyiv', 'Kyiv', 50.4501, 30.5234, 'air-defense', 'corroborated'),
      ev('Sample ministers meeting', 'Brussels', 50.8503, 4.3517, 'diplomatic', 'confirmed', y),
    ],
    sections: [
      { id: 'ukraine', summary: 'Sample summary of the wider war over the last day, in two sentences. It names the main developments.', items: [item(1, 'war', 'corroborated'), item(2, 'war', 'claimed'), item(3, 'war'), item(4, 'war', 'confirmed')] },
      { id: 'army', summary: 'Sample summary of Army and military news over the last day, in two sentences.', items: [item(5, 'Army'), item(6, 'Army'), item(7, 'Army')] },
      { id: 'fort-knox', summary: 'Sample summary of Fort Knox news over the last day, in two sentences for the layout.', items: [item(8, 'Fort Knox'), item(9, 'Fort Knox')] },
      { id: 'europe', summary: 'Sample summary of European security and politics over the last day, in two sentences.', items: [item(10, 'Europe'), item(11, 'Europe'), item(12, 'Europe'), item(13, 'Europe')] },
    ],
    upcoming: [
      { date, title: 'Sample event happening today', detail: 'Sample detail saying why this date matters and what to look for.', topic: 'ukraine' },
      { date: addDays(date, 1), title: 'Sample ministers meeting', detail: 'Sample detail saying why this date matters and what to look for.', topic: 'europe', url: 'https://example.com/meeting' },
      { date: addDays(date, 4), title: 'Sample post event at Fort Knox', detail: 'Sample detail saying why this date matters and what to look for.', topic: 'fort-knox' },
      { date: addDays(date, 9), title: 'Sample Army deadline', detail: 'Sample detail saying why this date matters and what to look for.', topic: 'army' },
      { date: addDays(date, 13), title: 'Sample watch date on the front', detail: 'Sample detail saying why this date matters and what to look for.', topic: 'front' },
    ],
    audio: { script: Array.from({ length: 6 }, () => para.repeat(3).trim()).join('\n\n') },
    sources: Array.from({ length: 8 }, (_, i) => ({ title: `Sample source ${i + 1}: a made-up article title`, url: `https://example.com/source-${i + 1}` })),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const out = process.argv[2];
  if (!out) { console.error('usage: node tests/sample.mjs <out-dir>'); process.exit(2); }
  const ed = makeSample();
  mkdirSync(join(out, 'archive'), { recursive: true });
  writeFileSync(join(out, 'latest.json'), JSON.stringify(ed, null, 1));
  writeFileSync(join(out, 'archive', `${ed.date}.json`), JSON.stringify(ed, null, 1));
  writeFileSync(join(out, 'index.json'), JSON.stringify({ editions: [{ date: ed.date, headline: ed.lead.headline }, { date: addDays(ed.date, -1), headline: 'Sample earlier edition' }] }, null, 1));
  console.log('sample written to ' + out);
}
