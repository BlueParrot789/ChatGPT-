const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const gravity = 0.65;
const friction = 0.82;
const moveSpeed = 1.2;
const jumpForce = -14;

const level = {
  width: 2600,
  height: canvas.height,
  platforms: [
    { x: 0, y: 480, w: 700, h: 60 },
    { x: 780, y: 430, w: 200, h: 24 },
    { x: 1080, y: 380, w: 170, h: 24 },
    { x: 1320, y: 320, w: 170, h: 24 },
    { x: 1540, y: 380, w: 220, h: 24 },
    { x: 1850, y: 440, w: 250, h: 24 },
    { x: 2190, y: 400, w: 260, h: 24 },
    { x: 2100, y: 480, w: 500, h: 60 }
  ],
  hazards: [
    { x: 500, y: 470, w: 80, h: 10 },
    { x: 1700, y: 470, w: 90, h: 10 },
    { x: 2420, y: 470, w: 80, h: 10 }
  ],
  coins: [
    { x: 840, y: 390, r: 10, taken: false },
    { x: 1160, y: 340, r: 10, taken: false },
    { x: 1400, y: 280, r: 10, taken: false },
    { x: 1625, y: 340, r: 10, taken: false },
    { x: 1950, y: 400, r: 10, taken: false },
    { x: 2280, y: 360, r: 10, taken: false }
  ],
  goal: { x: 2500, y: 420, w: 28, h: 60 }
};

const player = {
  x: 80,
  y: 200,
  w: 34,
  h: 40,
  vx: 0,
  vy: 0,
  onGround: false,
  color: '#fef3c7'
};

let cameraX = 0;
let score = 0;
let isWin = false;

const keys = new Set();
window.addEventListener('keydown', (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code) || ["ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
  }
  keys.add(event.key.toLowerCase());
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleIntersectsRect(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function resetPlayer() {
  player.x = 80;
  player.y = 200;
  player.vx = 0;
  player.vy = 0;
  cameraX = 0;
  statusEl.textContent = 'Ouch! Watch out for spikes.';
}

function update() {
  if (isWin) {
    return;
  }

  const movingLeft = keys.has('arrowleft') || keys.has('a');
  const movingRight = keys.has('arrowright') || keys.has('d');
  const jumping = keys.has('arrowup') || keys.has('w') || keys.has(' ');

  if (movingLeft) player.vx -= moveSpeed;
  if (movingRight) player.vx += moveSpeed;
  if (!movingLeft && !movingRight) player.vx *= friction;

  player.vx = Math.max(-8, Math.min(8, player.vx));

  if (jumping && player.onGround) {
    player.vy = jumpForce;
    player.onGround = false;
  }

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }
  if (player.x + player.w > level.width) {
    player.x = level.width - player.w;
    player.vx = 0;
  }

  for (const platform of level.platforms) {
    if (!intersects(player, platform)) continue;

    const prevY = player.y - player.vy;
    if (prevY + player.h <= platform.y + 2) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (prevY >= platform.y + platform.h - 2) {
      player.y = platform.y + platform.h;
      player.vy = 1;
    } else if (player.x + player.w / 2 < platform.x + platform.w / 2) {
      player.x = platform.x - player.w;
      player.vx = 0;
    } else {
      player.x = platform.x + platform.w;
      player.vx = 0;
    }
  }

  if (player.y > canvas.height + 120) {
    resetPlayer();
  }

  for (const hazard of level.hazards) {
    if (intersects(player, hazard)) {
      resetPlayer();
      break;
    }
  }

  for (const coin of level.coins) {
    if (!coin.taken && circleIntersectsRect(coin, player)) {
      coin.taken = true;
      score += 1;
      statusEl.textContent = `Coins: ${score}/${level.coins.length}`;
    }
  }

  if (intersects(player, level.goal)) {
    isWin = true;
    statusEl.textContent = `You win! Coins collected: ${score}/${level.coins.length}. Refresh to play again.`;
  }

  const targetCam = player.x - canvas.width * 0.35;
  cameraX += (targetCam - cameraX) * 0.1;
  cameraX = Math.max(0, Math.min(level.width - canvas.width, cameraX));
}

function drawBackground() {
  ctx.fillStyle = '#5ea8f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#7dd3fc';
  for (let i = 0; i < 7; i++) {
    const x = ((i * 240) - (cameraX * 0.3)) % (canvas.width + 200);
    ctx.beginPath();
    ctx.arc(x, 90 + (i % 3) * 26, 52, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 470, level.width, 70);

  ctx.fillStyle = '#3f3f46';
  for (const platform of level.platforms) {
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
  }

  ctx.fillStyle = '#ef4444';
  for (const hazard of level.hazards) {
    const spikes = Math.floor(hazard.w / 12);
    for (let i = 0; i < spikes; i++) {
      const sx = hazard.x + i * 12;
      ctx.beginPath();
      ctx.moveTo(sx, hazard.y + hazard.h);
      ctx.lineTo(sx + 6, hazard.y);
      ctx.lineTo(sx + 12, hazard.y + hazard.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  for (const coin of level.coins) {
    if (coin.taken) continue;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#111827';
  ctx.fillRect(player.x + 20, player.y + 10, 8, 8);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(level.goal.x + 4, level.goal.y, 4, level.goal.h);
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.moveTo(level.goal.x + 8, level.goal.y);
  ctx.lineTo(level.goal.x + 38, level.goal.y + 12);
  ctx.lineTo(level.goal.x + 8, level.goal.y + 24);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawUi() {
  ctx.fillStyle = 'rgba(17,24,39,0.65)';
  ctx.fillRect(12, 12, 190, 46);
  ctx.fillStyle = '#f9fafb';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Coins: ${score}/${level.coins.length}`, 22, 42);
}

function gameLoop() {
  update();
  drawBackground();
  drawWorld();
  drawUi();
  requestAnimationFrame(gameLoop);
}

gameLoop();
