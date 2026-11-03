"use strict";

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const scoreOutput = document.querySelector("#score");
const livesOutput = document.querySelector("#lives");
const gameAnnouncement = document.querySelector("#game-announcement");

const FIELD = {
  left: 12,
  right: canvas.width - 12,
  top: 12,
  bottom: canvas.height - 12,
};
const PADDLE = {
  width: 108,
  height: 14,
  y: canvas.height - 48,
  speed: 420,
};
const BALL_RADIUS = 12;
const BALL_SPEED = 330;
const INITIAL_LIVES = 3;

const keys = new Set();
let paddleX = canvas.width / 2;
let ball = { x: canvas.width / 2, y: canvas.height * 0.42, vx: 180, vy: 0 };
let lives = INITIAL_LIVES;
let score = 0;
let gameState = "ready";
let lastFrameTime = 0;
let runStartedAt = 0;
let elapsedMilliseconds = 0;

function resetBall() {
  const direction = Math.random() < 0.5 ? -1 : 1;
  ball = {
    x: canvas.width / 2,
    y: canvas.height * 0.42,
    vx: direction * BALL_SPEED * 0.55,
    vy: -BALL_SPEED * Math.sqrt(1 - 0.55 ** 2),
  };
}

function resetGame() {
  lives = INITIAL_LIVES;
  score = 0;
  gameState = "ready";
  paddleX = canvas.width / 2;
  resetBall();
  elapsedMilliseconds = 0;
  livesOutput.value = String(lives);
  livesOutput.textContent = String(lives);
  scoreOutput.value = String(score);
  scoreOutput.textContent = String(score);
  lastFrameTime = performance.now();
  gameAnnouncement.textContent =
    "How to play. Move with the left and right arrow keys or A and D. Press Space to start.";
}

function startGame() {
  gameState = "playing";
  runStartedAt = performance.now();
  lastFrameTime = runStartedAt;
  gameAnnouncement.textContent = "Game started.";
}

function updateScore(now) {
  score = Math.floor((elapsedMilliseconds + now - runStartedAt) / 1000);
  scoreOutput.value = String(score);
  scoreOutput.textContent = String(score);
}

function update(deltaSeconds) {
  if (gameState !== "playing") return;

  const now = performance.now();
  updateScore(now);

  // Keep the paddle's speed fixed, independent of the frame rate.
  const direction = Number(keys.has("ArrowRight") || keys.has("d")) -
    Number(keys.has("ArrowLeft") || keys.has("a"));
  paddleX += direction * PADDLE.speed * deltaSeconds;
  paddleX = Math.max(
    FIELD.left + PADDLE.width / 2,
    Math.min(FIELD.right - PADDLE.width / 2, paddleX),
  );

  ball.x += ball.vx * deltaSeconds;
  ball.y += ball.vy * deltaSeconds;

  if (ball.x - BALL_RADIUS < FIELD.left) {
    ball.x = FIELD.left + BALL_RADIUS;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + BALL_RADIUS > FIELD.right) {
    ball.x = FIELD.right - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - BALL_RADIUS < FIELD.top) {
    ball.y = FIELD.top + BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
  }

  const paddleLeft = paddleX - PADDLE.width / 2;
  const paddleRight = paddleX + PADDLE.width / 2;
  const paddleTop = PADDLE.y;
  if (
    ball.vy > 0 &&
    ball.y + BALL_RADIUS >= paddleTop &&
    ball.y - BALL_RADIUS <= paddleTop + PADDLE.height &&
    ball.x >= paddleLeft - BALL_RADIUS &&
    ball.x <= paddleRight + BALL_RADIUS
  ) {
    ball.y = paddleTop - BALL_RADIUS;
    const hitPosition = (ball.x - paddleX) / (PADDLE.width / 2);
    const horizontalRatio = Math.max(-0.88, Math.min(0.88, hitPosition * 0.88));
    ball.vx = horizontalRatio * BALL_SPEED;
    ball.vy = -Math.sqrt(BALL_SPEED ** 2 - ball.vx ** 2);
  }

  if (ball.y - BALL_RADIUS > FIELD.bottom) {
    lives -= 1;
    livesOutput.value = String(lives);
    livesOutput.textContent = String(lives);
    gameAnnouncement.textContent = `You lost a life. ${lives} lives remaining.`;
    if (lives === 0) {
      updateScore(now);
      elapsedMilliseconds += now - runStartedAt;
      gameState = "gameOver";
      gameAnnouncement.textContent = "Game over. Press Space to play again.";
    } else {
      paddleX = canvas.width / 2;
      resetBall();
    }
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Playfield boundary.
  context.strokeStyle = "#263746";
  context.lineWidth = 3;
  context.strokeRect(
    FIELD.left,
    FIELD.top,
    FIELD.right - FIELD.left,
    FIELD.bottom - FIELD.top,
  );

  // Paddle.
  context.fillStyle = "#474be8";
  context.fillRect(
    paddleX - PADDLE.width / 2,
    PADDLE.y,
    PADDLE.width,
    PADDLE.height,
  );

  // Ball.
  context.beginPath();
  context.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  context.fillStyle = "#f36a38";
  context.fill();
  context.strokeStyle = "#fff";
  context.lineWidth = 2;
  context.stroke();

  // Lives counter inside the playfield.
  context.fillStyle = "#263746";
  context.textAlign = "left";
  context.font = "700 18px Arial, sans-serif";
  context.fillText(`LIVES: ${lives}`, FIELD.left + 12, FIELD.top + 28);

  if (gameState !== "playing") {
    context.fillStyle = "rgb(16 22 30 / 82%)";
    context.fillRect(
      FIELD.left,
      FIELD.top,
      FIELD.right - FIELD.left,
      FIELD.bottom - FIELD.top,
    );
    context.fillStyle = "#fff";
    context.textAlign = "center";
    const centerY = canvas.height / 2;
    if (gameState === "ready") {
      context.font = "700 40px Arial, sans-serif";
      context.fillText("HOW TO PLAY", canvas.width / 2, centerY - 38);
      context.font = "20px Arial, sans-serif";
      context.fillText("Move with ← → or A / D", canvas.width / 2, centerY + 2);
      context.fillText("Keep the ball in play", canvas.width / 2, centerY + 32);
      context.fillText("Press SPACE to start", canvas.width / 2, centerY + 70);
    } else if (gameState === "paused") {
      context.font = "700 42px Arial, sans-serif";
      context.fillText("PAUSED", canvas.width / 2, centerY - 8);
      context.font = "20px Arial, sans-serif";
      context.fillText("Press SPACE to resume", canvas.width / 2, centerY + 32);
    } else {
      context.font = "700 42px Arial, sans-serif";
      context.fillText("GAME OVER", canvas.width / 2, centerY - 8);
      context.font = "20px Arial, sans-serif";
      context.fillText("click space to play again", canvas.width / 2, centerY + 32);
    }
  }
}

function frame(timestamp) {
  const deltaSeconds = lastFrameTime
    ? Math.min((timestamp - lastFrameTime) / 1000, 0.05)
    : 0;
  lastFrameTime = timestamp;
  update(deltaSeconds);
  draw();
  requestAnimationFrame(frame);
}

function movePaddleToPointer(event) {
  if (gameState !== "playing") return;
  const bounds = canvas.getBoundingClientRect();
  const scaleX = canvas.width / bounds.width;
  paddleX = (event.clientX - bounds.left) * scaleX;
  paddleX = Math.max(
    FIELD.left + PADDLE.width / 2,
    Math.min(FIELD.right - PADDLE.width / 2, paddleX),
  );
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (event.repeat) return;
    if (gameState === "ready") {
      startGame();
    } else if (gameState === "playing") {
      const now = performance.now();
      updateScore(now);
      elapsedMilliseconds += now - runStartedAt;
      gameState = "paused";
      gameAnnouncement.textContent = "Game paused. Press Space to resume.";
    } else if (gameState === "paused") {
      startGame();
    } else {
      resetGame();
      startGame();
    }
    return;
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowLeft", "ArrowRight"].includes(key)) event.preventDefault();
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

window.addEventListener("blur", () => keys.clear());
canvas.addEventListener("pointermove", movePaddleToPointer);

resetGame();
requestAnimationFrame(frame);
