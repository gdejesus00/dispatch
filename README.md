# The Morning Dispatch

A private morning paper: a 24-hour roll-up of open-source news with an interactive map of the southern front in Ukraine, a "days ahead" calendar and an audio brief. It is a static site with no build step and no paid services.

## Three papers, one codebase

- **The Morning Dispatch** at the site root: Fort Knox, the Army, the war in Ukraine, the southern front, Europe.
- **The Cyber Dispatch** at `cyber/`: threats and incidents, vulnerabilities and patches, AI safety and security, AI policy and industry.
- **The AI Dispatch** at `ai/`: models and releases, research, tools and builders, policy and industry, plus The Playbook, a set of sourced techniques from the people who build these tools.

`profiles.js` says how they differ (name, sections, map views, event types, extra boxes). All use the same page, styles, checker and filing tool. `cyber/index.html` and `ai/index.html` are generated from `index.html` by `node tools/sync-pages.mjs`; a test fails if they drift. The daily instructions are `tools/EDITION_GUIDE.md`, `tools/CYBER_GUIDE.md` and `tools/AI_GUIDE.md`. An edition's `"edition"` field (`cyber` or `ai`; none for the Morning Dispatch) decides which folder it is filed under.

Every body of text in an edition carries links to the pages it was written from, and the checker rejects an edition that is missing any.

## How it works

1. Each morning a scheduled Claude job researches the news and writes one edition file by following `tools/EDITION_GUIDE.md`.
2. `tools/finish.mjs` checks the edition (`tools/validate.mjs`) and files it under `data/`. A bad edition is never filed.
3. The job pushes `data/`. The workflow in `.github/workflows/publish.yml` runs the tests, turns the edition's script into an MP3 with the free Piper voice, and puts the site on the `gh-pages` branch.
4. If a day's update fails, the previous edition stays up and the page says it is old. If only the audio fails, the page reads the script with the device's own voice.

## Layout

- `index.html`, `styles.css`, `app.js`: the page. All edition text is shown as plain text, never as markup.
- `data/latest.json`, `data/archive/`, `data/index.json`: the editions. Written only by `tools/finish.mjs`.
- `tools/`: the edition guide, checker, filing tool, spoken-script tool, place coordinates and a local preview server.
- `tests/`: `node --test tests/`. `tests/sample.mjs` makes a made-up edition for layout work; it is never published.
- `vendor/leaflet/`: Leaflet 1.9.4 (BSD 2-Clause). Map tiles are from OpenStreetMap.

## Local preview

```
node tests/sample.mjs /tmp/sample-data
node tools/serve.mjs --port 5210 --data /tmp/sample-data
```

Summaries link to the original reporting. This is a personal study aid compiled from public sources, not an official product of any government or service.
