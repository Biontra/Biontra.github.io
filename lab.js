(function () {
  'use strict';
  var I = window.PortfolioI18n;
  var list = document.querySelector('#projects .grid');
  if (!list || !I) return;
  var cards = Array.from(list.querySelectorAll('article.card'));
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var compact = matchMedia('(max-width: 700px)');
  var NS = 'http://www.w3.org/2000/svg';
  var current = -1;
  var cleanup = function () {};
  var copyTimer;
  var lab = document.createElement('div'); lab.className = 'lab';
  var hint = document.createElement('p'); hint.className = 'lab-hint';
  var mapShell = document.createElement('div'); mapShell.className = 'map-shell';
  var mapHeading = document.createElement('div'); mapHeading.className = 'map-heading';
  var mapTitle = document.createElement('span');
  var resetView = document.createElement('button'); resetView.type = 'button'; resetView.className = 'map-reset';
  mapHeading.append(mapTitle, resetView);
  var map = document.createElement('div'); map.className = 'map'; map.setAttribute('role', 'tablist');
  var world = document.createElement('div'); world.className = 'map-world'; map.append(world);
  var wires = document.createElementNS(NS, 'svg');
  wires.setAttribute('class', 'wires'); wires.setAttribute('viewBox', '0 0 100 100');
  wires.setAttribute('preserveAspectRatio', 'none'); wires.setAttribute('aria-hidden', 'true');
  var lines = cards.map(function (card, i) {
    var next = (i + 1) % cards.length;
    var line = document.createElementNS(NS, 'line');
    ['x', 'y'].forEach(function (axis) { line.setAttribute(axis + '1', card.dataset[axis]); line.setAttribute(axis + '2', cards[next].dataset[axis]); });
    wires.append(line);
    return { start: i, end: next, line: line };
  });
  world.append(wires);
  var tabs = cards.map(function (card, index) {
    var button = document.createElement('button'); button.type = 'button'; button.className = 'station';
    button.id = 'station-' + index; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'station-panel');
    button.setAttribute('aria-selected', 'false'); button.tabIndex = -1;
    button.style.left = card.dataset.x + '%'; button.style.top = card.dataset.y + '%';
    button.classList.add(card.querySelector('.status').className.match(/st-\w+/)[0]);
    var icon = card.querySelector('.icon').cloneNode(true);
    icon.removeAttribute('role'); icon.removeAttribute('aria-label'); icon.setAttribute('aria-hidden', 'true');
    var led = document.createElement('span'); led.className = 'led'; led.setAttribute('aria-hidden', 'true');
    var name = document.createElement('span'); name.className = 'nm';
    var serial = document.createElement('span'); serial.className = 'sn'; serial.textContent = card.querySelector('.serial').textContent;
    button.append(led, icon, name, serial);
    button.addEventListener('click', function () { select(index, { user: true, push: true }); });
    world.append(button);
    return button;
  });
  var mapFooter = document.createElement('p'); mapFooter.className = 'map-footer';
  mapShell.append(mapHeading, map, mapFooter);
  var hud = document.createElement('div'); hud.className = 'hud'; hud.id = 'station-panel'; hud.tabIndex = 0; hud.setAttribute('role', 'tabpanel');
  lab.append(hint, mapShell, hud); list.before(lab); list.hidden = true;

  function el(tag, className, key) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (key) node.textContent = I.t(key);
    return node;
  }
  function projectURL(index) {
    var url = new URL(location.href);
    url.searchParams.set('project', cards[index].dataset.project);
    url.searchParams.set('lang', I.language);
    url.hash = 'projects';
    return url;
  }
  function updateLabels() {
    hint.textContent = I.t('Choose a project to explore');
    mapTitle.textContent = I.t('LAB MAP / SECTOR A');
    mapFooter.textContent = cards.length + ' ' + I.t('STATIONS');
    resetView.textContent = I.t('Reset view');
    map.setAttribute('aria-label', I.t('Projects'));
    tabs.forEach(function (button, index) {
      button.querySelector('.nm').textContent = I.t(cards[index].dataset.short);
      button.setAttribute('aria-label', I.t(cards[index].dataset.short) + ', ' + cards[index].querySelector('.serial').textContent + ', ' + cards[index].querySelector('.status').textContent);
    });
  }
  function shareControl(index) {
    var share = el('div', 'project-share');
    var link = el('a', '', 'Share project'); link.href = projectURL(index); link.setAttribute('aria-label', I.t('Share project') + ': ' + cards[index].dataset.short);
    var copy = el('button', 'copy-link', 'Copy link'); copy.type = 'button';
    var feedback = el('p', 'share-feedback'); feedback.setAttribute('role', 'status');
    copy.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(projectURL(index).href);
        if (!copy.isConnected) return;
        copy.textContent = I.t('Link copied'); feedback.textContent = I.t('Link copied');
        clearTimeout(copyTimer); copyTimer = setTimeout(function () { copy.textContent = I.t('Copy link'); feedback.textContent = ''; }, 2400);
      } catch (_) {
        if (share.querySelector('input')) return;
        var input = el('input', 'share-url'); input.type = 'text'; input.readOnly = true; input.value = projectURL(index).href;
        input.setAttribute('aria-label', I.t('Copy this link')); share.append(input); input.focus(); input.select();
        feedback.textContent = I.t('Copy this link');
      }
    });
    share.append(link, copy, feedback);
    return share;
  }
  function makeDemo(slug) {
    var demo = el('section', 'interactive-demo'); demo.dataset.demo = slug;
    var top = el('div', 'demo-heading'); top.append(el('h4', '', 'Interactive demo'), el('span', 'simulation-label', 'Simulation'));
    demo.append(top, el('p', 'demo-disclaimer', 'This is a visual simulation. No AI model is called and no device input is blocked.'));
    if (slug === 'mixen') mountMixen(demo); else mountKilit(demo);
    return demo;
  }
  function mountMixen(demo) {
    var timers = [];
    var form = el('form', 'mixen-form');
    var label = el('label', '', 'Example task'); label.htmlFor = 'mixen-task';
    var task = el('input'); task.id = 'mixen-task'; task.name = 'task'; task.type = 'text'; task.maxLength = 160; task.value = I.t('Plan a study app and review its code');
    var controls = el('div', 'demo-controls');
    var run = el('button', 'project-button primary', 'Run simulation'); run.type = 'submit';
    var reset = el('button', 'project-button', 'Reset'); reset.type = 'button'; controls.append(run, reset);
    var error = el('p', 'demo-error'); error.setAttribute('role', 'alert'); error.id = 'mixen-error'; task.setAttribute('aria-describedby', 'mixen-error');
    form.append(label, task, controls, error);
    var pipeline = el('ol', 'agent-pipeline');
    var models = ['Claude', 'Codex', 'Gemini']; var jobs = ['Planning', 'Implementation', 'Review'];
    var nodes = jobs.map(function (job, i) {
      var node = el('li'); node.dataset.state = 'waiting';
      node.append(el('span', 'agent-model', models[i]), el('strong', '', job), el('span', 'agent-state', 'Waiting'));
      pipeline.append(node); return node;
    });
    var status = el('p', 'demo-result', 'Ready for a task'); status.setAttribute('role', 'status');
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function resetDemo() {
      clearTimers(); run.disabled = false; task.disabled = false; task.removeAttribute('aria-invalid'); error.textContent = '';
      nodes.forEach(function (node) { node.dataset.state = 'waiting'; node.querySelector('.agent-state').textContent = I.t('Waiting'); });
      status.textContent = I.t('Ready for a task');
    }
    reset.addEventListener('click', resetDemo);
    form.addEventListener('submit', function (event) {
      event.preventDefault(); resetDemo();
      if (!task.value.trim()) { error.textContent = I.t('Enter a task first.'); task.setAttribute('aria-invalid', 'true'); task.focus(); return; }
      run.disabled = true; task.disabled = true;
      status.textContent = I.t('Sample routing for your task') + ': ' + task.value.trim();
      nodes[0].dataset.state = 'working'; nodes[0].querySelector('.agent-state').textContent = I.t('Working');
      for (var n = 0; n < nodes.length; n++) (function (index) {
        timers.push(setTimeout(function () {
          nodes[index].dataset.state = 'complete'; nodes[index].querySelector('.agent-state').textContent = I.t('Complete');
          if (index + 1 < nodes.length) { nodes[index + 1].dataset.state = 'working'; nodes[index + 1].querySelector('.agent-state').textContent = I.t('Working'); }
          else { run.disabled = false; task.disabled = false; status.textContent = I.t('Simulation finished. This is an example routing, not a live model result.'); }
        }, (index + 1) * 900));
      })(n);
    });
    demo.append(form, pipeline, status); cleanup = clearTimers;
  }
  function mountKilit(demo) {
    var locked = true;
    var controls = el('div', 'demo-controls');
    var toggle = el('button', 'project-button primary', 'Unlock simulation'); toggle.type = 'button'; toggle.setAttribute('aria-pressed', 'true');
    var reset = el('button', 'project-button', 'Reset'); reset.type = 'button'; controls.append(toggle, reset);
    var flow = el('div', 'input-flow');
    var hardware = el('div', 'input-source', 'Hardware input');
    var filter = el('div', 'input-filter'); filter.append(el('span', '', 'Input filter'), el('strong', 'filter-state', 'Locked'));
    var software = el('div', 'input-source', 'Software input'); flow.append(hardware, filter, software);
    var note = el('p', 'filter-note', 'Hardware stops. Software continues.');
    var eventButtons = el('div', 'input-events');
    var status = el('p', 'demo-result', 'No input yet'); status.setAttribute('role', 'status');
    var log = el('ol', 'event-log'); log.setAttribute('aria-live', 'off');
    function setLocked(next) {
      locked = next; demo.dataset.locked = String(locked);
      toggle.textContent = I.t(locked ? 'Unlock simulation' : 'Lock simulation'); toggle.setAttribute('aria-pressed', String(locked));
      filter.querySelector('strong').textContent = I.t(locked ? 'Locked' : 'Unlocked');
      note.textContent = I.t(locked ? 'Hardware stops. Software continues.' : 'All input passes through.');
    }
    [['Keyboard', 'Send a keyboard event'], ['Mouse', 'Send a mouse event'], ['AI agent', 'Send an agent event']].forEach(function (item) {
      var button = el('button', 'project-button', item[0]); button.type = 'button'; button.setAttribute('aria-label', I.t(item[1]));
      button.addEventListener('click', function () {
        var allowed = item[0] === 'AI agent' || !locked;
        var entry = el('li'); entry.dataset.result = allowed ? 'passed' : 'blocked';
        entry.textContent = I.t(item[0]) + ' → ' + I.t(allowed ? 'Passed through' : 'Blocked');
        log.prepend(entry); if (log.children.length > 4) log.lastElementChild.remove();
        status.textContent = entry.textContent;
        flow.dataset.result = allowed ? 'passed' : 'blocked';
        flow.dataset.source = item[0] === 'AI agent' ? 'software' : 'hardware';
        flow.classList.remove('event-pulse'); void flow.offsetWidth; flow.classList.add('event-pulse');
      });
      eventButtons.append(button);
    });
    toggle.addEventListener('click', function () { setLocked(!locked); });
    reset.addEventListener('click', function () { setLocked(true); log.textContent = ''; status.textContent = I.t('No input yet'); delete flow.dataset.result; delete flow.dataset.source; });
    setLocked(true); demo.append(controls, flow, note, eventButtons, status, log);
  }
  function focusMap(index) {
    map.dataset.project = cards[index].dataset.project;
    world.style.transformOrigin = cards[index].dataset.x + '% ' + cards[index].dataset.y + '%';
    map.classList.add('is-focused');
  }
  resetView.addEventListener('click', function () { map.classList.remove('is-focused'); });
  function select(index, options) {
    options = options || {};
    if (index < 0 || index >= cards.length) return;
    if (index === current && !options.force) {
      focusMap(index);
      if (options.user && compact.matches) hud.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'instant' : 'smooth' });
      return;
    }
    cleanup(); cleanup = function () {}; clearTimeout(copyTimer); current = index;
    tabs.forEach(function (tab, n) { tab.setAttribute('aria-selected', String(n === index)); tab.tabIndex = n === index ? 0 : -1; });
    lines.forEach(function (wire) { wire.line.classList.toggle('hot', wire.start === index || wire.end === index); });
    hud.setAttribute('aria-labelledby', tabs[index].id); hud.dataset.project = cards[index].dataset.project;
    hud.replaceChildren();
    Array.from(cards[index].children).forEach(function (child) { hud.append(child.cloneNode(true)); });
    hud.querySelectorAll('.icon').forEach(function (icon) { icon.removeAttribute('role'); icon.removeAttribute('aria-label'); icon.setAttribute('aria-hidden', 'true'); });
    I.apply(hud);
    var slug = cards[index].dataset.project;
    if (slug === 'mixen' || slug === 'kilit') {
      var preview = hud.querySelector('.project-preview'); preview.replaceWith(makeDemo(slug));
    }
    hud.append(shareControl(index));
    hud.classList.remove('scan-in');
    if (!reduced.matches) { void hud.offsetWidth; hud.classList.add('scan-in'); }
    focusMap(index);
    if (options.push) history.pushState(null, '', projectURL(index));
    if (options.user && compact.matches) hud.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'instant' : 'smooth' });
  }
  function readLocation() {
    var params = new URL(location.href).searchParams;
    var previousLanguage = I.language;
    var language = params.get('lang');
    if ((language === 'tr' || language === 'en') && language !== I.language) I.set(language, false);
    var index = cards.findIndex(function (card) { return card.dataset.project === params.get('project'); });
    if (index < 0 && location.hash.startsWith('#project-')) index = cards.findIndex(function (card) { return '#project-' + card.dataset.project === location.hash; });
    if (index < 0) index = cards.findIndex(function (card) { return card.dataset.featured === 'true'; });
    updateLabels(); select(index < 0 ? 0 : index, { force: I.language !== previousLanguage });
  }
  map.addEventListener('keydown', function (event) {
    var index = tabs.indexOf(document.activeElement); if (index < 0) return;
    var next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); tabs[next].focus(); select(next, { push: true });
  });
  document.addEventListener('portfolio:language', function () { updateLabels(); select(current, { force: true }); });
  window.addEventListener('popstate', readLocation);
  window.addEventListener('hashchange', readLocation);
  readLocation();
  // A direct project URL opens the lab, rather than leaving its selection below the fold.
  if (new URL(location.href).searchParams.has('project') || location.hash.startsWith('#project-')) {
    requestAnimationFrame(function () { document.querySelector('#projects').scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }
})();
