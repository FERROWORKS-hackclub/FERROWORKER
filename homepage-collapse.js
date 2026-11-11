(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pieces = document.querySelectorAll(
    '.wrapper > nav, .hero > *, main > section > *, .wrapper > footer'
  );
  let timer;
  let animations = [];

  function stop() {
    clearTimeout(timer);
    for (const animation of animations) animation.cancel();
    animations = [];
  }

  function collapse() {
    stop();
    if (motion.matches || document.hidden) return;

    for (const piece of pieces) {
      const rect = piece.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight || rect.height === 0) continue;
      if (piece.contains(document.activeElement)) continue;

      const direction = rect.left + rect.width / 2 < innerWidth / 2 ? -1 : 1;
      const drift = direction * (18 + Math.random() * 85);
      const tilt = direction * (5 + Math.random() * 24);
      const distance = innerHeight - Math.min(rect.top, 0) + 100;
      animations.push(piece.animate([
        { transform: 'translate(0, 0) rotate(0)', opacity: 1, offset: 0, easing: 'ease-out' },
        { transform: `translate(${drift / 6}px, 10px) rotate(${tilt / 5}deg)`, opacity: 1, offset: .22, easing: 'ease-in' },
        { transform: `translate(${drift}px, ${distance}px) rotate(${tilt}deg)`, opacity: 0, offset: .84 },
        { transform: `translate(${drift}px, ${distance}px) rotate(${tilt}deg)`, opacity: 0, offset: 1 },
      ], {
        duration: 1150 + Math.random() * 260,
        delay: Math.min(350, Math.max(0, rect.top) * .32) + Math.random() * 100,
      }));
    }
    timer = setTimeout(collapse, 4600);
  }

  function schedule() {
    stop();
    if (!motion.matches && !document.hidden) timer = setTimeout(collapse, 1100);
  }

  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  document.addEventListener('focusin', event => {
    for (const animation of animations) {
      if (animation.effect.target.contains(event.target)) animation.cancel();
    }
  });
  schedule();
})();
