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
