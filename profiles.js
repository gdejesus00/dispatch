// The papers this site publishes. Each one has the same layout and its own beats.
// Used by the page (app.js) and by the edition checker (tools/validate.mjs).

export const PROFILES = {
  dispatch: {
    id: 'dispatch',
    dir: '',
    name: 'The Morning Dispatch',
    brief: 'The Morning Brief',
    earLeft: ['Open sources only', '24-hour roll-up'],
    others: [{ label: 'Cyber', href: 'cyber/' }, { label: 'AI', href: 'ai/' }],
    shortName: 'Morning',
    front: { title: 'The Southern Front', sub: 'Zaporizhzhia and Kherson, mapped', nav: 'Southern front' },
    sectors: [
      { id: 'zaporizhzhia', title: 'Zaporizhzhia direction' },
      { id: 'kherson', title: 'Kherson direction' },
    ],
    sections: [
      { id: 'ukraine', title: 'The War in Ukraine', sub: 'Russia, Ukraine and the wider fight', nav: 'The war' },
      { id: 'army', title: 'Army and Military', sub: 'The force, the Pentagon, the services', nav: 'Army' },
      { id: 'fort-knox', title: 'Fort Knox', sub: 'The post and its commands', nav: 'Fort Knox' },
      { id: 'europe', title: 'Europe', sub: 'Security and politics across the continent', nav: 'Europe' },
    ],
    types: {
      ground: 'Ground', strike: 'Strike', 'air-defense': 'Air defense', naval: 'River and sea',
      infrastructure: 'Infrastructure', diplomatic: 'Diplomatic', other: 'Other',
    },
    views: [
      { id: 'south', label: 'Southern front', bounds: [[45.95, 31.3], [48.25, 37.1]] },
      { id: 'ukraine', label: 'All Ukraine', bounds: [[44.2, 22.0], [52.5, 40.5]] },
      { id: 'europe', label: 'Europe', bounds: [[35.0, -11.0], [66.0, 45.0]] },
    ],
    bounds: { latMin: 30, latMax: 72, lonMin: -25, lonMax: 60, label: 'inside Europe (lat 30 to 72, lon -25 to 60)' },
    minZoom: 3,
    explainer: false,
    mapNote: 'Each pin is a reported event placed at the named town, not an exact position.',
    statusNote: ['is one side or one source', 'is two independent sources', 'is visual evidence or both sides'],
    mapLinks: [
      { before: 'For the line of contact itself, open ', label: 'DeepStateMap', href: 'https://deepstatemap.live/en' },
      { before: ' or the ', label: 'ISW map', href: 'https://understandingwar.org/' },
    ],
  },

  cyber: {
    id: 'cyber',
    dir: 'cyber/',
    name: 'The Cyber Dispatch',
    brief: 'The Cyber Brief',
    earLeft: ['Cyber and AI', '24-hour roll-up'],
    others: [{ label: 'Morning', href: '../' }, { label: 'AI', href: '../ai/' }],
    shortName: 'Cyber',
    front: { title: 'The Threat Board', sub: 'Who is doing what, and where', nav: 'Threat board' },
    sectors: [
      { id: 'state', title: 'Nation-state activity' },
      { id: 'crime', title: 'Ransomware and cybercrime' },
    ],
    sections: [
      { id: 'threats', title: 'Threats and Incidents', sub: 'Intrusions, ransomware, breaches', nav: 'Threats' },
      { id: 'vulns', title: 'Vulnerabilities and Patches', sub: 'What is being exploited and what to fix', nav: 'Patches' },
      { id: 'ai-safety', title: 'AI Safety and Security', sub: 'Research, misuse and model behavior', nav: 'AI safety' },
      { id: 'ai-policy', title: 'AI Policy and Industry', sub: 'Labs, governments and rules', nav: 'AI policy' },
    ],
    types: {
      intrusion: 'Intrusion', ransomware: 'Ransomware', breach: 'Data breach', disruption: 'Disruption',
      vulnerability: 'Vulnerability', policy: 'Policy and law', other: 'Other',
    },
    views: [
      { id: 'world', label: 'World', bounds: [[-42, -125], [66, 150]] },
      { id: 'europe', label: 'Europe', bounds: [[35.0, -11.0], [66.0, 45.0]] },
      { id: 'americas', label: 'Americas', bounds: [[-35, -125], [55, -35]] },
      { id: 'asia', label: 'Asia-Pacific', bounds: [[-40, 60], [55, 155]] },
    ],
    bounds: { latMin: -60, latMax: 75, lonMin: -180, lonMax: 180, label: 'real coordinates (lat -60 to 75, lon -180 to 180)' },
    minZoom: 2,
    explainer: true,
    mapNote: 'Each pin is a reported incident or decision placed at the victim, agency or company named in the report, not at the attacker.',
    statusNote: ['is one vendor, one outlet or the attacker saying so', 'is two independent sources', 'is the victim or a government confirming it'],
    mapLinks: [],
  },
};

PROFILES.ai = {
  id: 'ai',
  dir: 'ai/',
  name: 'The AI Dispatch',
  brief: 'The AI Brief',
  earLeft: ['AI news and know-how', '24-hour roll-up'],
  others: [{ label: 'Morning', href: '../' }, { label: 'Cyber', href: '../cyber/' }],
  shortName: 'AI',
  front: { title: 'The Lab Board', sub: 'Who shipped, raised and decided what', nav: 'Lab board' },
  sectors: [
    { id: 'labs', title: 'Frontier labs' },
    { id: 'field', title: 'The wider field' },
  ],
  sections: [
    { id: 'models', title: 'Models and Releases', sub: 'What shipped and what it can do', nav: 'Models' },
    { id: 'research', title: 'Research', sub: 'Findings worth knowing', nav: 'Research' },
    { id: 'builders', title: 'Tools and Builders', sub: 'Agents, coding tools and the people making them', nav: 'Tools' },
    { id: 'industry', title: 'Policy and Industry', sub: 'Money, rules and the companies', nav: 'Industry' },
  ],
  types: {
    release: 'Release', research: 'Research', funding: 'Money', policy: 'Policy and law',
    hardware: 'Chips and compute', incident: 'Incident', other: 'Other',
  },
  views: [
    { id: 'world', label: 'World', bounds: [[-42, -125], [66, 150]] },
    { id: 'us', label: 'United States', bounds: [[24, -126], [50, -66]] },
    { id: 'europe', label: 'Europe', bounds: [[35.0, -11.0], [66.0, 45.0]] },
    { id: 'asia', label: 'Asia-Pacific', bounds: [[-40, 60], [55, 155]] },
  ],
  bounds: { latMin: -60, latMax: 75, lonMin: -180, lonMax: 180, label: 'real coordinates (lat -60 to 75, lon -180 to 180)' },
  minZoom: 2,
  explainer: true,
  playbook: true,
  mapNote: 'Each pin is a release, finding, deal or decision placed at the lab, company or government named in the report.',
  statusNote: ['is the company itself or one outlet saying so', 'is two independent sources', 'is shipped and usable, or confirmed by the parties or a government'],
  mapLinks: [],
};

export const profileOf = (id) => PROFILES[id] || PROFILES.dispatch;
