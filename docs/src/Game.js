
import TileMap from "./TileMap.js";
import GameTime from "./GameTime.js";

const tileSize = 30;
const velocity = 2;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileMap = new TileMap(tileSize);
const pacman = tileMap.getPacman(velocity);
const enemies = tileMap.getEnemies(velocity);

const gameTime = new GameTime();

const pacmanStart = { x: pacman.x, y: pacman.y };
const enemySpawns = enemies.map(enemy => ({ x: enemy.x, y: enemy.y }));

let pauseUntil = 0;
let waitingToRespawn = false;
let paused = false;

let gameOver = false;
let gameWin = false;

let lives = 3;
window.score = 0;

const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");

const gameOverSound = new Audio("sounds/gameOver.wav");
const gameWinSound = new Audio("sounds/gameWin.wav");
const readySound = new Audio("sounds/ready.wav");
const pauseSound = new Audio("sounds/terrapin.wav");


function gameLoop() {
  if (paused) return;

  tileMap.draw(ctx);
  pacman.draw(ctx, pause, enemies, gameTime);

  enemies.forEach(enemy => enemy.draw(ctx, pause, pacman));
  // enemies.forEach(enemy => enemy.draw(ctx, pause, pacman, enemies));
  drawGameEnd();

  // Game logic updates (e.g., check collisions, eat dots, etc.)
  checkGameOver();
  checkGameWin();
  updateHUD();
}

function updateHUD(flash = false) {
  scoreDisplay.textContent = `Score: ${window.score}`;
  livesDisplay.innerHTML = "";
  for (let i = 0; i < lives; i++) {
    livesDisplay.innerHTML += `<img src="images/heart.png" width="32" height="32" style="margin-left: 3px;">`;
  }
  if (flash) {
    livesDisplay.classList.add("heart-flash");
    setTimeout(() => livesDisplay.classList.remove("heart-flash"), 2700);
  }
}

function checkGameWin() {
  if (!gameWin) {
    gameWin = tileMap.didWin();
    if (gameWin) {
      gameWinSound.play();
    }
  }
}

function checkGameOver() {
  if (!gameOver && !waitingToRespawn && isGameOver()) {
    lives--;
    if (lives <= 0) {
      gameOver = true;
      if (!window.druted) gameOverSound.play();
    } else {
      waitingToRespawn = true;
      pauseUntil = gameTime.now + 3000;

      if (!window.isMuted) readySound.play();
      document.getElementById("readyMessage").style.display = "block";
      updateHUD(true);

      setTimeout(() => {
        resetPositions();
        waitingToRespawn = false;
        document.getElementById("readyMessage").style.display = "none";
      }, 3000);
    }
  }
}

function resetPositions() {
  pacman.x = pacmanStart.x;
  pacman.y = pacmanStart.y;
  pacman.currentMovingDirection = null;
  pacman.requestedMovingDirection = null;

  enemies.forEach((enemy, index) => {
    enemy.x = enemySpawns[index].x;
    enemy.y = enemySpawns[index].y;
  });
}

function isGameOver() {
  return enemies.some(enemy => !pacman.powerDotActive && enemy.collideWith(pacman));
}

function pause() {
  return !pacman.madeFirstMove || gameOver || gameWin || gameTime.now < pauseUntil;
}

function drawGameEnd() {
  const overlay = document.getElementById("gameEndOverlay");
  if ((gameOver || gameWin) && gameTime.now >= pauseUntil) {
    overlay.querySelector("h2").textContent = gameWin ? "You Win!" : "Game Over";
    overlay.style.display = "block";
  } else {
    overlay.style.display = "none";
  }
}

tileMap.setCanvasSize(canvas);
setInterval(gameLoop, 1000 / 70);

document.addEventListener("keydown", (event) => {
  if ((gameOver || gameWin) && (event.key.toLowerCase() === "r")) {
    location.reload();
  } else if (event.key.toLowerCase() === "p") {
    paused = !paused;
    const pauseMessage = document.getElementById("pauseMessage");
    
    if (paused) {
      gameTime.pause();
      pauseMessage.style.display = "block";

      if (!window.isMuted) {
        setTimeout(() => {
          if (paused) { // Delay the pause sound by 3 seconds
            pauseSound.loop = true;
            pauseSound.volume = 0.2
            ;
            pauseSound.play();
          }
        }, 2000);
      }
    } else {
      pauseSound.pause();
      pauseSound.currentTime = 0;
      gameTime.resume();
      pauseMessage.style.display = "none";
    }
  }
});
