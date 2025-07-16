import MovingDirection from "./MovingDirection.js";

export default class Pacman {
  constructor(x, y, tileSize, velocity, tileMap) {
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.velocity = velocity;
    this.tileMap = tileMap;

    this.currentMovingDirection = null;
    this.requestedMovingDirection = null;

    this.pacmanAnimationTimerDefault = 10;
    this.pacmanAnimationTimer = null;

    this.pacmanRotation = this.Rotation.right;
    this.wakaSound = new Audio("sounds/waka.wav");

    this.powerDotSound = new Audio("sounds/power_dot.wav");
    this.powerDotActive = false;
    this.powerDotAboutToExpire = false;

    this.powerDotEndTime = null;
    this.powerDotWarningTime = null;
    this.ghostRespawns = [];

    this.eatGhostSound = new Audio("sounds/eat_ghost.wav");
    this.respawnSound = new Audio("sounds/respawn.wav");

    this.madeFirstMove = false;

    document.addEventListener("keydown", this.#keydown);

    this.#loadPacmanImages();
  }

  Rotation = {
    right: 0,
    down: 1,
    left: 2,
    up: 3,
  };

  draw(ctx, pause, enemies, gameTime) {
    const paused = pause();
    if (!paused) {
      this.#move();
      this.#animate();
    }
    this.#eatDot();
    this.#eatPowerDot(gameTime);
    this.#eatGhost(enemies, gameTime);

    const size = this.tileSize / 2;

    ctx.save();
    ctx.translate(this.x + size, this.y + size);
    ctx.rotate((this.pacmanRotation * 90 * Math.PI) / 180);
    ctx.drawImage(
      this.pacmanImages[this.pacmanImageIndex],
      -size,
      -size,
      this.tileSize,
      this.tileSize
    );
    ctx.restore();

    // Handle power dot timing
    if (!paused && this.powerDotActive) {
      const now = gameTime.now;
      if (now >= this.powerDotEndTime) {
        this.powerDotActive = false;
        this.powerDotAboutToExpire = false;
      } else if (now >= this.powerDotWarningTime) {
        this.powerDotAboutToExpire = true;
      }
    }

    // Handle queued ghost respawns
    if (!paused) {
      const now = gameTime.now;
      this.ghostRespawns = this.ghostRespawns.filter(data => {
        if (now >= data.schedule) {
          const newEnemy = new data.constructor(
            data.spawn.x,
            data.spawn.y,
            this.tileSize,
            data.velocity,
            this.tileMap,
            data.spawn.name
          );
          newEnemy.fadingIn = true;
          newEnemy.respawnAlpha = 0;
          enemies.push(newEnemy);
          if (!window.isMuted) this.respawnSound.play();
          return false;
        }
        return true;
      });
    }
  }

  #loadPacmanImages() {
    const load = name => {
      const img = new Image();
      img.src = `images/${name}`;
      return img;
    };

    this.pacmanImages = [
      load("pacman_frame_0.png"),
      load("pacman_frame_1.png"),
      load("pacman_frame_2.png"),
      load("pacman_frame_3.png"),
      load("pacman_frame_4.png"),
      load("pacman_frame_5.png"),
      load("pacman_frame_6.png"),
    ];
    this.pacmanImageIndex = 0;
  }

  #keydown = (event) => {
    switch (event.keyCode) {
      case 38:
        this.requestedMovingDirection = MovingDirection.up;
        this.madeFirstMove = true;
        break;
      case 40:
        this.requestedMovingDirection = MovingDirection.down;
        this.madeFirstMove = true;
        break;
      case 37:
        this.requestedMovingDirection = MovingDirection.left;
        this.madeFirstMove = true;
        break;
      case 39:
        this.requestedMovingDirection = MovingDirection.right;
        this.madeFirstMove = true;
        break;
    }
  };

  #move() {
    if (this.currentMovingDirection !== this.requestedMovingDirection) {
      if (
        Number.isInteger(this.x / this.tileSize) &&
        Number.isInteger(this.y / this.tileSize)
      ) {
        if (
          !this.tileMap.didCollideWithEnvironment(
            this.x,
            this.y,
            this.requestedMovingDirection
          )
        ) {
          this.currentMovingDirection = this.requestedMovingDirection;
        }
      }
    }

    if (
      this.tileMap.didCollideWithEnvironment(
        this.x,
        this.y,
        this.currentMovingDirection
      )
    ) {
      this.pacmanAnimationTimer = null;
      this.pacmanImageIndex = 1;
      return;
    } else if (
      this.currentMovingDirection !== null &&
      this.pacmanAnimationTimer === null
    ) {
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
    }

    switch (this.currentMovingDirection) {
      case MovingDirection.up:
        this.y -= this.velocity;
        this.pacmanRotation = this.Rotation.up;
        break;
      case MovingDirection.down:
        this.y += this.velocity;
        this.pacmanRotation = this.Rotation.down;
        break;
      case MovingDirection.left:
        this.x -= this.velocity;
        this.pacmanRotation = this.Rotation.left;
        break;
      case MovingDirection.right:
        this.x += this.velocity;
        this.pacmanRotation = this.Rotation.right;
        break;
    }
    
    const col = Math.floor(this.x / this.tileSize);
    const row = Math.floor(this.y / this.tileSize);

    if (this.tileMap.map[row][col] === 2) {
      // If Pacman is at left wormhole (tile 2)
      if (col === 0 || col === 1 || col === 2) {
        // Teleport to right side wormhole (tile 2 on far right)
        this.x = (this.tileMap.map[0].length - 2) * this.tileSize; // Adjust offset to avoid wall overlap
      } 
      // If Pacman is at right wormhole
      else if (col >= this.tileMap.map[0].length - 3) {
        this.x = 1 * this.tileSize; // Teleport to left side
      }
    }
  }

  #animate() {
    if (this.pacmanAnimationTimer === null) return;

    this.pacmanAnimationTimer--;
    if (this.pacmanAnimationTimer === 0) {
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
      this.pacmanImageIndex = (this.pacmanImageIndex + 1) % this.pacmanImages.length;
    }
  }

  #eatDot() {
    if (this.tileMap.eatDot(this.x, this.y) && this.madeFirstMove) {
      if (!window.isMuted) {
        this.wakaSound.volume = 0.8;
        this.wakaSound.play();
      }
      window.score += 10;
    }
  }

  #eatPowerDot(gameTime) {
    if (this.tileMap.eatPowerDot(this.x, this.y)) {
      if (!window.isMuted) this.powerDotSound.play();
      this.powerDotActive = true;
      this.powerDotAboutToExpire = false;
      window.score += 50;

      const now = gameTime.now;
      this.powerDotEndTime = now + 6000; // 6 seconds active
      this.powerDotWarningTime = now + 4000; // 4 seconds warning
    }
  }

  #eatGhost(enemies, gameTime) {
    if (this.powerDotActive) {
      const now = gameTime.now;
      const collideEnemies = enemies.filter(enemy => enemy.collideWith(this));
      collideEnemies.forEach(enemy => {
        enemies.splice(enemies.indexOf(enemy), 1);
        if (!window.isMuted) this.eatGhostSound.play();
        window.score += 100;

        const spawn = this.tileMap.enemySpawnPoints.find(e => e.name === enemy.color);
        if (spawn) {
          this.ghostRespawns.push({
            spawn,
            constructor: enemy.constructor,
            velocity: enemy.velocity,
            schedule: now + 4000 + Math.random() * 2000
          });
        }
      });
    }
  }
}
