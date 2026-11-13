# Biontra.github.io

My personal portfolio: who I am, what I've built, and how to reach me.

**Live:** https://biontra.github.io

## Tech

Plain HTML, CSS and JavaScript. No framework, build step or paid API. Hosted on GitHub Pages. The workshop uses a dark theme and respects the operating system’s reduced motion preference.

## Run locally

```bash
git clone https://github.com/Biontra/Biontra.github.io.git
cd Biontra.github.io
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Portfolio features

- TR/EN switches all page copy, project details, controls and workflow diagrams. The selection is saved in the browser. `?lang=tr` or `?lang=en` explicitly selects a language.
- Share a project with `?project=kilit&lang=tr#projects`. Slugs: `mixen`, `uni`, `trading-bot`, `stream-deck`, `rough-cut`, `exam-plan`, `kilit`. Each project has a copy-link button. Back/forward restores the selection.
- The map focuses the selected station, animates its active connections and has a reset-view control. Small screens use a spaced grid.
- Mixen and Kilit have labelled, local simulations. They do not call AI services, block real input or send the task text anywhere.

## Editing content

English content and the dated workbench update live in `index.html`. Turkish translations are in `i18n.js`; `data-i18n` identifies translatable text. After changing English text, update its translation key too. The workbench is an editorial update, not an automatic project-status feed.

Add a project as an `article.card` with a stable `data-project` slug and `data-x`/`data-y` map coordinates. `lab.js` derives the stations and count from those cards. Keep enough space for the full station rectangle and its 5px selection outline. Add translated diagrams with `data-src-en` and `data-src-tr`.

Bump the version query in `index.html` when changing scripts or CSS so returning visitors receive the matching files.

## Validation

Browser checks for this update covered both languages, all seven projects at 320, 390, 700, 768, 901, 1024 and 1280px (98 layout states), all 14 project/language links, browser back/forward, clipboard copying, Mixen empty-input/completion, and Kilit locked/unlocked input handling. No station rectangle overlaps or horizontal overflow were observed in those states.

Static checks: `node --check i18n.js`, `node --check script.js`, `node --check lab.js`, `git diff --check`, unique HTML IDs, existing local assets and valid SVG markup.

## License

MIT
