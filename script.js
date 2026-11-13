// Star field in the hero. Pauses for prefers-reduced-motion and when the tab is hidden.
(function () {
  var canvas = document.getElementById('stars');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stars = [], w = 0, h = 0, raf = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(24, Math.min(90, Math.round(w * h / 9000)));
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.2 + 0.4, amber: Math.random() < 0.12 });
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var i, j, a, b, dx, dy, d;
    ctx.lineWidth = 1;
    for (i = 0; i < stars.length; i++) {
      a = stars[i];
      for (j = i + 1; j < stars.length; j++) {
        b = stars[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
        if (d < 8000) {
          ctx.strokeStyle = 'rgba(61,232,255,' + (0.22 * (1 - d / 8000)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (i = 0; i < stars.length; i++) {
      a = stars[i];
      ctx.fillStyle = a.amber ? 'rgba(255,179,64,0.55)' : 'rgba(61,232,255,0.5)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0 || s.x > w) s.vx = -s.vx;
      if (s.y < 0 || s.y > h) s.vy = -s.vy;
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function start() { stop(); if (!mq.matches && !document.hidden) raf = requestAnimationFrame(step); else draw(); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', start);
  if (mq.addEventListener) mq.addEventListener('change', start);
  resize(); start();
})();

// Projects as a lab map: every project card becomes a station; the selected one fills the detail panel.
// Without JS the plain list of cards stays visible.
(function () {
  var list = document.querySelector('#projects .grid');
  if (!list) return;
  var cards = Array.prototype.slice.call(list.querySelectorAll('article.card'));
  if (!cards.length) return;
  var NS = 'http://www.w3.org/2000/svg';
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 700px)');

  var lab = document.createElement('div'); lab.className = 'lab';
  var hint = document.createElement('p'); hint.className = 'lab-hint';
  hint.textContent = 'Lab map: select a station to open its data';
  var map = document.createElement('div'); map.className = 'map';
  map.setAttribute('role', 'tablist'); map.setAttribute('aria-label', 'Projects');
  var hud = document.createElement('div'); hud.className = 'hud';
  hud.setAttribute('role', 'tabpanel'); hud.tabIndex = 0;

  function tag(cls, txt) { var s = document.createElement('span'); s.className = 'map-tag ' + cls; s.textContent = txt; s.setAttribute('aria-hidden', 'true'); return s; }
  map.appendChild(tag('tl', 'LAB MAP / SECTOR A'));
  map.appendChild(tag('br', cards.length + ' STATIONS'));

  var wires = document.createElementNS(NS, 'svg');
  wires.setAttribute('class', 'wires'); wires.setAttribute('viewBox', '0 0 100 100');
  wires.setAttribute('preserveAspectRatio', 'none'); wires.setAttribute('aria-hidden', 'true'); wires.setAttribute('focusable', 'false');
  var lines = [];
  cards.forEach(function (c, i) {
    var n = (i + 1) % cards.length, a = c, b = cards[n];
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', a.dataset.x); l.setAttribute('y1', a.dataset.y);
    l.setAttribute('x2', b.dataset.x); l.setAttribute('y2', b.dataset.y);
    wires.appendChild(l); lines.push([i, n, l]);
  });
  map.appendChild(wires);

  var tabs = cards.map(function (c, i) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'station';
    btn.id = 'station-' + i; btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'station-panel'); btn.setAttribute('aria-selected', 'false'); btn.tabIndex = -1;
    var st = c.querySelector('.status'), serial = c.querySelector('.serial');
    var m = (st.className.match(/st-\w+/) || [''])[0]; if (m) btn.classList.add(m);
    btn.style.left = c.dataset.x + '%'; btn.style.top = c.dataset.y + '%';
    btn.setAttribute('aria-label', c.dataset.short + ', ' + serial.textContent + ', ' + st.textContent);
    var ic = c.querySelector('.icon').cloneNode(true);
    ic.removeAttribute('role'); ic.removeAttribute('aria-label'); ic.setAttribute('aria-hidden', 'true');
    var led = document.createElement('span'); led.className = 'led'; led.setAttribute('aria-hidden', 'true');
    var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = c.dataset.short;
    var sn = document.createElement('span'); sn.className = 'sn'; sn.textContent = serial.textContent;
    btn.appendChild(led); btn.appendChild(ic); btn.appendChild(nm); btn.appendChild(sn);
    btn.addEventListener('click', function () { select(i, true); });
    map.appendChild(btn);
    return btn;
  });
  hud.id = 'station-panel';

  var current = -1;
  function select(i, fromUser) {
    if (i === current) return;
    current = i;
    tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
    lines.forEach(function (x) { x[2].classList.toggle('hot', x[0] === i || x[1] === i); });
    hud.setAttribute('aria-labelledby', tabs[i].id);
    hud.textContent = '';
    Array.prototype.forEach.call(cards[i].children, function (ch) {
      var cl = ch.cloneNode(true);
      Array.prototype.forEach.call(cl.querySelectorAll('.icon'), function (ic) { ic.removeAttribute('role'); ic.removeAttribute('aria-label'); ic.setAttribute('aria-hidden', 'true'); });
      hud.appendChild(cl);
    });
    if (!mq.matches) { hud.classList.remove('scan-in'); void hud.offsetWidth; hud.classList.add('scan-in'); }
    if (fromUser && mobile.matches) hud.scrollIntoView({ block: 'nearest', behavior: mq.matches ? 'auto' : 'smooth' });
  }

  map.addEventListener('keydown', function (e) {
    var k = e.key, i = tabs.indexOf(document.activeElement), n = tabs.length, t;
    if (i < 0) return;
    if (k === 'ArrowRight' || k === 'ArrowDown') t = (i + 1) % n;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') t = (i - 1 + n) % n;
    else if (k === 'Home') t = 0;
    else if (k === 'End') t = n - 1;
    else return;
    e.preventDefault(); tabs[t].focus(); select(t, false);
  });

  lab.appendChild(hint); lab.appendChild(map); lab.appendChild(hud);
  list.hidden = true;
  list.parentNode.insertBefore(lab, list);
  var featured = cards.findIndex(function (card) { return card.dataset.featured === "true"; });
  select(featured < 0 ? 0 : featured, false);
})();
