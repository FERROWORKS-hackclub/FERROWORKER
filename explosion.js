(() => {
  if (window.top !== window) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'site-explosion';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.documentElement.append(canvas);

  const surface = document.querySelector('.wrapper, main') || document.body;
  const colors = ['#fff2a8', '#ffc34b', '#ff8130', '#d74820', '#564039'];
  let width, height, frame, start;
  let particles = [];
  let blasts = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function explode(now) {
    start = now;
    particles = [];
    blasts = [];
    const points = [[.18, .24], [.78, .26], [.5, .49], [.2, .76], [.82, .77]];
    points.forEach(([left, top], index) => {
      const x = width * (left + (Math.random() - .5) * .12);
      const y = height * (top + (Math.random() - .5) * .12);
      const delay = index * 72;
      blasts.push({ x, y, delay });
      for (let i = 0; i < 36; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 45 + Math.random() * Math.min(300, width * .65);
        particles.push({
          x, y, delay, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 7, life: .45 + Math.random() * .68,
          color: colors[i % colors.length],
        });
      }
    });
    surface.classList.add('site-blast');
  }

  function draw(now) {
    if (start === undefined || now - start >= 2550) explode(now);
    const elapsed = now - start;
    if (elapsed > 560) surface.classList.remove('site-blast');
    ctx.clearRect(0, 0, width, height);

    for (const { x, y, delay } of blasts) {
      const t = (elapsed - delay) / 700;
      if (t < 0 || t >= 1) continue;
      const radius = 9 + t * Math.min(145, width * .24);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, '#fff1ad');
      glow.addColorStop(.32, '#ff9d38');
      glow.addColorStop(.68, '#da4d27');
      glow.addColorStop(1, '#da4d2700');
      ctx.globalAlpha = (1 - t) * .78;
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.globalAlpha = (1 - t) * .55;
      ctx.strokeStyle = '#f99b48';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const p of particles) {
      const t = (elapsed - p.delay) / 1000;
      if (t < 0 || t >= p.life) continue;
      const x = p.x + p.vx * t;
      const y = p.y + p.vy * t + 100 * t * t;
      ctx.globalAlpha = 1 - t / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(x, y, p.size * (1 - t / p.life / 2), p.size);
    }
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }

  function update() {
    cancelAnimationFrame(frame);
    surface.classList.remove('site-blast');
    ctx.clearRect(0, 0, width, height);
    if (motion.matches || document.hidden) return;
    start = undefined;
    frame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
  resize();
  update();
})();
