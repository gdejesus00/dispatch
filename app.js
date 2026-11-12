// The Morning Dispatch: reads one edition file and lays out the paper.
// Everything from the edition goes on the page as plain text, never as markup.

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const link = (href, text, cls) => {
  const a = el('a', cls, text);
  if (/^https:\/\//.test(href || '')) { a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  return a;
};

const SECTION_TITLES = {
  ukraine: ['The War in Ukraine', 'Russia, Ukraine and the wider fight'],
  army: ['Army and Military', 'The force, the Pentagon, the services'],
  'fort-knox': ['Fort Knox', 'The post and its commands'],
  europe: ['Europe', 'Security and politics across the continent'],
};
const SECTION_ORDER = ['ukraine', 'army', 'fort-knox', 'europe'];
const TYPE_LABELS = {
  ground: 'Ground', strike: 'Strike', 'air-defense': 'Air defense', naval: 'River and sea',
  infrastructure: 'Infrastructure', diplomatic: 'Diplomatic', other: 'Other',
};
const TOPIC_LABELS = { ukraine: 'The war', army: 'Army', 'fort-knox': 'Fort Knox', europe: 'Europe', front: 'Southern front' };
const VIEWS = {
  south: [[45.95, 31.3], [48.25, 37.1]],
  ukraine: [[44.2, 22.0], [52.5, 40.5]],
  europe: [[35.0, -11.0], [66.0, 45.0]],
};
const ET = 'America/New_York';

const fmtLong = (d) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
const fmtShort = (d) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
const fmtDow = (d) => new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
const fmtClock = (iso) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: ET, timeZoneName: 'short' }).format(new Date(iso));
const mmss = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––');
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
};

// ---------- theme ----------
const root = document.documentElement;
function currentTheme() {
  return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function applyTheme(t) {
  if (t) root.dataset.theme = t;
  if (map) setTiles();
}
const savedTheme = store.get('dispatch:theme');
if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
$('theme-btn').addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  store.set('dispatch:theme', next);
  applyTheme(next);
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());

// ---------- loading ----------
const params = new URLSearchParams(location.search);
const wanted = /^\d{4}-\d{2}-\d{2}$/.test(params.get('d') || '') ? params.get('d') : null;

async function getJson(path) {
  const r = await fetch(`${path}?t=${Math.floor(Date.now() / 60000)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

async function start() {
  let edition;
  try {
    edition = await getJson(wanted ? `data/archive/${wanted}.json` : 'data/latest.json');
  } catch (e) {
    $('lead-headline').textContent = wanted ? 'That edition is not on file.' : 'Today’s edition could not be loaded.';
    $('lead-dek').textContent = 'Check the connection and reload. If this keeps happening, the daily update may have failed.';
    $('paper').setAttribute('aria-busy', 'false');
    return;
  }
  render(edition);
  $('paper').setAttribute('aria-busy', 'false');
  getJson('data/index.json').then((idx) => fillPicker(idx, edition.date)).catch(() => { $('edition-pick').hidden = true; });
}

function fillPicker(idx, current) {
  const pick = $('edition-pick');
  const list = Array.isArray(idx.editions) ? idx.editions.slice(0, 60) : [];
  if (list.length < 2) { pick.hidden = true; return; }
  list.forEach((e, i) => {
    const o = el('option', null, (i === 0 ? 'Today: ' : '') + fmtShort(e.date));
    o.value = i === 0 ? '' : e.date;
    if (e.date === current) o.selected = true;
    pick.append(o);
  });
  pick.addEventListener('change', () => { location.search = pick.value ? `?d=${pick.value}` : ''; });
}

// ---------- render ----------
function render(ed) {
  document.title = `The Morning Dispatch: ${fmtShort(ed.date)}`;
  $('rail-date').textContent = fmtLong(ed.date);
  $('rail-updated').textContent = `Updated ${fmtClock(ed.generated_at)}`;
  $('ear-edition').textContent = wanted ? 'From the archive' : 'Daily edition';

  const ageH = (Date.now() - Date.parse(ed.generated_at)) / 36e5;
  if (!wanted && ageH > 30) {
    const s = $('stale');
    s.textContent = `This edition is from ${fmtLong(ed.date)}. A newer one has not arrived yet, so the daily update may have failed.`;
    s.hidden = false;
  } else if (wanted) {
    const s = $('stale');
    s.append('You are reading an earlier edition. ', Object.assign(el('a', null, 'Go to today’s paper'), { href: location.pathname }));
    s.hidden = false;
  }

  $('lead-headline').textContent = ed.lead.headline;
  $('lead-dek').textContent = ed.lead.dek;
  $('bottom-line').textContent = ed.bottom_line;
  fillSources($('lead-sources'), ed.lead.sources);

  if (ed.numbers && ed.numbers.length) {
    const box = $('numbers');
    ed.numbers.forEach((n) => {
      const row = el('div', 'num');
      const src = el('span', 'num-src');
      src.append(link(n.url, n.source));
      row.append(el('span', 'num-value', n.value), el('span', 'num-label', n.label), src);
      box.append(row);
    });
    $('numbers-box').hidden = false;
  }
  renderFront(ed);
  renderColumns(ed);
  renderAhead(ed);

  const src = $('source-list');
  ed.sources.forEach((s) => { const li = el('li'); li.append(link(s.url, s.title)); src.append(li); });

  const items = ed.sections.reduce((n, s) => n + s.items.length, 0);
  $('ear-count').textContent = `${items} stories · ${ed.map_events.length} mapped`;
  $('foot-build').textContent = `Edition of ${fmtLong(ed.date)}, set at ${fmtClock(ed.generated_at)}.`;

  setupAudio(ed);
}

const safe = (v) => String(v).replace(/[^a-z-]/g, '');
// "Sources: A \u00b7 B" under a body of text, each one a link to where the text came from.
function fillSources(node, list) {
  node.textContent = '';
  const ok = (list || []).filter((x) => x && x.url);
  if (!ok.length) { node.hidden = true; return node; }
  node.append(ok.length > 1 ? 'Sources: ' : 'Source: ');
  ok.forEach((x, i) => { if (i) node.append(' \u00b7 '); node.append(link(x.url, x.name)); });
  return node;
}
const sourceLine = (list) => fillSources(el('p', 'byline src-line'), list);
function stamp(status) { return el('span', `stamp s-${status}`, status); }

function storyNode(it) {
  const a = el('article', 'story');
  const h = el('h4');
  h.append(link(it.url, it.headline));
  a.append(h, el('p', null, it.summary));
  const by = el('p', 'byline');
  if (it.status) by.append(stamp(it.status), ' ');
  by.append(link(it.url, it.source), ` · ${fmtShort(it.published)}`);
  a.append(by);
  return a;
}

function renderColumns(ed) {
  const wrap = $('columns');
  SECTION_ORDER.forEach((id) => {
    const s = ed.sections.find((x) => x.id === id);
    if (!s) return;
    const sec = el('section', `col col-${id}`);
    sec.id = `s-${id}`;
    const head = el('div', 'section-head');
    head.append(el('h2', null, SECTION_TITLES[id][0]), el('p', 'section-sub', SECTION_TITLES[id][1]));
    sec.append(head, el('p', 'col-summary', s.summary), sourceLine(s.sources));
    if (!s.items.length && s.quiet_note) sec.append(el('p', 'quiet', s.quiet_note));
    s.items.forEach((it) => sec.append(storyNode(it)));
    wrap.append(sec);
  });
}

function renderAhead(ed) {
  const list = $('ahead-list');
  [...ed.upcoming].sort((a, b) => a.date.localeCompare(b.date)).forEach((u) => {
    const li = el('li', 'ahead-item');
    const d = el('div', 'ahead-date');
    d.append(el('span', 'ahead-dow', fmtDow(u.date)), el('span', 'ahead-day', fmtShort(u.date)));
    const n = daysBetween(ed.date, u.date);
    d.append(el('span', 'ahead-in', n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`));
    const body = el('div', 'ahead-body');
    body.append(el('p', 'kicker', TOPIC_LABELS[u.topic] || ''));
    const h = el('h4');
    if (u.url) h.append(link(u.url, u.title)); else h.textContent = u.title;
    body.append(h, el('p', null, u.detail));
    if (u.url) {
      let host = 'source';
      try { host = new URL(u.url).hostname.replace(/^www\./, ''); } catch { /* keep the plain label */ }
      body.append(sourceLine([{ name: host, url: u.url }]));
    }
    li.append(d, body);
    list.append(li);
  });
}

// ---------- the front and its map ----------
let map = null;
let tiles = null;
const markers = [];
let activeTypes = new Set();

function setTiles() {
  if (tiles) return; // one tile set; the night look is done with a filter in the stylesheet
  tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12, minZoom: 3,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
}

function renderFront(ed) {
  $('front-summary').textContent = ed.front.summary;
  fillSources($('front-sources'), ed.front.sources);

  const axes = $('axes');
  [['zaporizhzhia', 'Zaporizhzhia direction'], ['kherson', 'Kherson direction']].forEach(([sector, title]) => {
    const group = el('div', 'axis-group');
    group.append(el('h3', null, title));
    ed.front.axes.filter((a) => a.sector === sector).forEach((a) => {
      const row = el('div', 'axis');
      const h = el('h4', null, a.name);
      h.append(' ', stamp(a.status));
      row.append(h, el('p', null, a.text), sourceLine(a.sources));
      group.append(row);
    });
    axes.append(group);
  });

  if (typeof L === 'undefined') { $('map').textContent = 'The map could not load.'; return; }
  map = L.map('map', { zoomControl: true, scrollWheelZoom: false, worldCopyJump: false, attributionControl: true });
  map.attributionControl.setPrefix(false);
  setTiles();
  map.fitBounds(VIEWS.south);
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  const events = [...ed.map_events].sort((a, b) => b.date.localeCompare(a.date));
  const list = $('event-list');
  const types = [...new Set(events.map((e) => e.type))];
  activeTypes = new Set(types);

  events.forEach((e, i) => {
    const fresh = daysBetween(e.date, ed.date) <= 1;
    const icon = L.divIcon({
      className: '',
      html: `<span class="pin t-${safe(e.type)} s-${safe(e.status)}${fresh ? ' fresh' : ''}"><i>${i + 1}</i></span>`,
      iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12],
    });
    const m = L.marker([e.lat, e.lon], { icon, title: e.title, alt: e.title, keyboard: true }).addTo(map);
    const pop = el('div', 'pop');
    pop.append(el('p', 'kicker', `${TYPE_LABELS[e.type]} · ${e.place} · ${fmtShort(e.date)}`), el('h4', null, e.title), el('p', null, e.summary));
    const by = el('p', 'byline');
    by.append(stamp(e.status), ' ', link(e.url, e.source));
    pop.append(by);
    m.bindPopup(pop, { maxWidth: 300 });

    const li = el('li', 'event');
    li.dataset.type = e.type;
    const b = el('button');
    b.type = 'button';
    b.append(el('span', `num-pin t-${e.type}`, String(i + 1)));
    const txt = el('span', 'event-text');
    txt.append(el('span', 'event-title', e.title), el('span', 'event-meta', `${e.place} · ${fmtShort(e.date)} · ${e.status}`));
    b.append(txt);
    b.addEventListener('click', () => {
      map.flyTo([e.lat, e.lon], Math.max(map.getZoom(), 9), { duration: 0.6 });
      m.openPopup();
      if (matchMedia('(max-width: 899px)').matches) $('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    m.on('popupopen', () => { list.querySelectorAll('.on').forEach((x) => x.classList.remove('on')); li.classList.add('on'); });
    li.append(b);
    list.append(li);
    markers.push({ e, m, li });
  });

  const chipBox = $('type-chips');
  types.forEach((t) => {
    const c = el('button', `chip on t-${t}`, TYPE_LABELS[t]);
    c.type = 'button';
    c.setAttribute('aria-pressed', 'true');
    c.addEventListener('click', () => {
      if (activeTypes.has(t)) activeTypes.delete(t); else activeTypes.add(t);
      c.classList.toggle('on', activeTypes.has(t));
      c.setAttribute('aria-pressed', String(activeTypes.has(t)));
      markers.forEach(({ e, m, li }) => {
        const show = activeTypes.has(e.type);
        if (show && !map.hasLayer(m)) m.addTo(map);
        if (!show && map.hasLayer(m)) m.remove();
        li.hidden = !show;
      });
    });
    chipBox.append(c);
  });

  document.querySelectorAll('[data-view]').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('on', x === b));
      map.flyToBounds(VIEWS[b.dataset.view], { duration: 0.8 });
    });
  });
  // The map can be laid out before its box has a size (phones especially), so refit until the reader takes over.
  let view = 'south';
  let touched = false;
  map.on('mousedown touchstart wheel', () => { touched = true; });
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; touched = false; }));
  new ResizeObserver(() => { map.invalidateSize(); if (!touched) map.fitBounds(VIEWS[view], { animate: false }); }).observe($('map'));
}

// ---------- audio ----------
function setupAudio(ed) {
  const audio = $('audio');
  const play = $('play');
  const seek = $('seek');
  const script = (ed.audio && ed.audio.script) || '';
  const wordCount = script.trim().split(/\s+/).length;
  const estMin = Math.max(1, Math.round(wordCount / 155));

  const panel = $('script-panel');
  script.split(/\n\s*\n/).forEach((p) => { if (p.trim()) panel.append(el('p', null, p.trim())); });
  $('read-btn').addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    $('read-btn').classList.toggle('on', !panel.hidden);
  });

  const speeds = [1, 1.25, 1.5, 1.75, 0.85];
  let speedIx = Math.max(0, speeds.indexOf(Number(store.get('dispatch:speed'))));
  const showSpeed = () => { $('speed').textContent = `${speeds[speedIx]}×`; };
  showSpeed();

  let mode = 'file'; // 'file' plays the MP3; 'voice' reads the script with the device's own voice.
  const setPlaying = (on) => { play.classList.toggle('playing', on); play.setAttribute('aria-label', on ? 'Pause the morning brief' : 'Play the morning brief'); };

  // --- device voice fallback ---
  const sentences = script.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [];
  let sIx = 0;
  let speaking = false;
  // Devices ship several voices; the default is often the most robotic. Prefer the natural-sounding ones.
  function bestVoice() {
    const voices = ('speechSynthesis' in window ? speechSynthesis.getVoices() : []).filter((v) => /^en[-_]/i.test(v.lang));
    const score = (v) => (/natural|neural/i.test(v.name) ? 8 : 0) + (/google/i.test(v.name) ? 4 : 0) + (/online|enhanced|premium/i.test(v.name) ? 3 : 0)
      + (/en[-_]US/i.test(v.lang) ? 2 : 0) + (/andrew|ava|brian|emma|guy|aria|jenny/i.test(v.name) ? 1 : 0) + (v.localService ? 0 : 1);
    return voices.sort((a, b) => score(b) - score(a))[0] || null;
  }
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  function speakNext() {
    if (!speaking) return;
    if (sIx >= sentences.length) { speaking = false; sIx = 0; setPlaying(false); seek.value = 0; return; }
    const u = new SpeechSynthesisUtterance(sentences[sIx]);
    u.rate = speeds[speedIx];
    u.lang = 'en-US';
    const v = bestVoice();
    if (v) u.voice = v;
    u.onend = () => { if (speaking) { sIx += 1; seek.value = Math.round((sIx / sentences.length) * 1000); $('t-now').textContent = `${Math.round((sIx / sentences.length) * 100)}%`; speakNext(); } };
    u.onerror = () => { speaking = false; setPlaying(false); };
    speechSynthesis.speak(u);
  }
  function useVoice() {
    mode = 'voice';
    $('download').hidden = true;
    if (!('speechSynthesis' in window) || !sentences.length) {
      $('listen-meta').textContent = '· audio is not ready yet; the script is below';
      play.disabled = true;
      panel.hidden = false;
      return;
    }
    $('listen-meta').textContent = `· about ${estMin} min · read by this device’s voice`;
    $('t-end').textContent = '100%';
    $('t-now').textContent = '0%';
  }

  // --- MP3 ---
  const file = wanted ? null : 'audio/latest.mp3';
  if (file) {
    audio.src = `${file}?v=${encodeURIComponent(ed.generated_at)}`;
    audio.addEventListener('loadedmetadata', () => {
      $('t-end').textContent = mmss(audio.duration);
      $('listen-meta').textContent = `· ${Math.max(1, Math.round(audio.duration / 60))} min`;
      const d = $('download');
      d.href = audio.src; d.download = `morning-dispatch-${ed.date}.mp3`; d.hidden = false;
    });
    audio.addEventListener('error', useVoice, { once: true });
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      if (!seek.matches(':active')) seek.value = Math.round((audio.currentTime / audio.duration) * 1000);
      $('t-now').textContent = mmss(audio.currentTime);
    });
    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => setPlaying(false));
    audio.playbackRate = speeds[speedIx];
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: `The Morning Brief, ${fmtShort(ed.date)}`, artist: 'The Morning Dispatch', album: ed.lead.headline });
      navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
      navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 30); });
    }
  } else {
    useVoice();
  }

  play.addEventListener('click', () => {
    if (mode === 'file') { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); return; }
    if (speaking) { speaking = false; speechSynthesis.cancel(); setPlaying(false); }
    else { speaking = true; setPlaying(true); speechSynthesis.cancel(); speakNext(); }
  });
  seek.addEventListener('input', () => {
    if (mode === 'file') { if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration; return; }
    sIx = Math.min(sentences.length - 1, Math.floor((seek.value / 1000) * sentences.length));
    if (speaking) { speechSynthesis.cancel(); setTimeout(speakNext, 60); }
  });
  const jump = (by) => {
    if (mode === 'file') { audio.currentTime = Math.min(Math.max(0, audio.currentTime + by), audio.duration || 0); return; }
    sIx = Math.min(Math.max(0, sIx + Math.sign(by) * 2), Math.max(0, sentences.length - 1));
    if (speaking) { speechSynthesis.cancel(); setTimeout(speakNext, 60); }
  };
  $('back15').addEventListener('click', () => jump(-15));
  $('fwd30').addEventListener('click', () => jump(30));
  $('speed').addEventListener('click', () => {
    speedIx = (speedIx + 1) % speeds.length;
    store.set('dispatch:speed', String(speeds[speedIx]));
    showSpeed();
    if (mode === 'file') audio.playbackRate = speeds[speedIx];
    else if (speaking) { speechSynthesis.cancel(); setTimeout(speakNext, 60); }
  });
  addEventListener('pagehide', () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); });
}

start();
