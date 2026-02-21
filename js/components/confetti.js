import { randInt } from '../utils/math.js';

export const Confetti = (() => {
  let canvas;
  let ctx;
  const COLORS = ['#ff85c2','#c77dff','#72efdd','#ffe066','#ff6b6b','#74c0fc','#3bc47e','#ffd6a5'];
  let particles = [];
  let rafId     = null;

  const init = () => {
    if (!canvas) {
      canvas = document.getElementById('confetti-canvas');
      if (canvas) ctx = canvas.getContext('2d');
    }
  };

  const resize = () => { 
    if (canvas) {
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    }
  };

  const makeParticle = () => ({
    x:    Math.random() * window.innerWidth,
    y:    Math.random() * window.innerHeight - window.innerHeight,
    w:    randInt(7, 15),
    h:    randInt(4, 9),
    color: COLORS[randInt(0, COLORS.length - 1)],
    rot:  Math.random() * 360,
    rotV: (Math.random() - 0.5) * 6,
    vy:   randInt(3, 7),
    vx:   (Math.random() - 0.5) * 2.5,
  });

  const draw = () => {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
    });
    particles = particles.filter(p => p.y < canvas.height + 30);
    if (particles.length > 0) rafId = requestAnimationFrame(draw);
    else stop();
  };

  const start = () => {
    init();
    if (!canvas) return;
    resize();
    canvas.style.display = 'block';
    for (let i = 0; i < 200; i++) particles.push(makeParticle());
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(draw);
  };

  const stop = () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    particles = [];
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
    window.removeEventListener('resize', resize);
  };

  return { start, stop };
})();
