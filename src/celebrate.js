// ── CELEBRATIONS ──
import { MILESTONE_MSGS } from './constants.js';
import { maybeShow7DayPrompt } from './pro.js';

let _lastMilestone = 0;

export function showMilestoneBanner(n) {
  const m = MILESTONE_MSGS[n];
  if (!m) return;
  _lastMilestone = n;
  document.getElementById('milestone-emoji').textContent = m.emoji;
  document.getElementById('milestone-title').textContent = m.title;
  document.getElementById('milestone-sub').textContent = m.sub;
  document.getElementById('milestone-banner').classList.add('open');
  launchConfetti();
}

export function closeMilestone() {
  document.getElementById('milestone-banner').classList.remove('open');
  // 7-day milestone is the only Pro upgrade trigger in the daily loop.
  if (_lastMilestone === 7) maybeShow7DayPrompt(7);
  _lastMilestone = 0;
}

export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = Array.from({ length: 220 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.5,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 1,
    color: ['#e8f55a','#4dff91','#fff','#ffb347','#a78bfa','#38bdf8'][Math.floor(Math.random()*6)],
    size: Math.random() * 10 + 5,
    rot: Math.random() * 360,
    rspeed: (Math.random() - 0.5) * 10,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.rot += p.rspeed; p.vy += 0.06;
    });
    frame++;
    if (frame < 280) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}
