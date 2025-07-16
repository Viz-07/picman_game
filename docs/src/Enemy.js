import MovingDirection from "./MovingDirection.js";

export default class Enemy {
  constructor(x, y, tileSize, velocity, tileMap, name = "pinky") {
    this.color = name;
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.velocity = velocity;
    this.tileMap = tileMap;

    this.#loadImages();

    this.movingDirection = Math.floor(
      Math.random() * Object.keys(MovingDirection).length
    );

    this.directionTimerDefault = this.#random(10, 25);
    this.directionTimer = this.directionTimerDefault;

    this.scaredAboutToExpireTimerDefault = 10;
    this.scaredAboutToExpireTimer = this.scaredAboutToExpireTimerDefault;

    this.respawnAlpha = 0; // Start fully transparent
    this.fadingIn = true; // Enable fade-in logic
  }

  draw(ctx, pause, pacman) {
    if (!pause()) {
      this.#move();
      this.#changeDirection(pacman);
    }
    this.#setImage(ctx, pacman);
  }

  collideWith(pacman) {
    const size = this.tileSize / 2;
    return (
      this.x < pacman.x + size &&
      this.x + size > pacman.x &&
      this.y < pacman.y + size &&
      this.y + size > pacman.y
    );
  }

  #setImage(ctx, pacman) {
    if (pacman.powerDotActive) {
      this.#setImageWhenPowerDotIsActive(pacman);
    } else {
      this.image = this.normalGhost;
    }

    if (this.fadingIn) {
      this.respawnAlpha += 0.05;
      if (this.respawnAlpha >= 1) {
        this.respawnAlpha = 1;
        this.fadingIn = false;
      }
      ctx.globalAlpha = this.respawnAlpha;
    }

    ctx.drawImage(this.image, this.x, this.y, this.tileSize, this.tileSize);
    ctx.globalAlpha = 1; // Reset alpha
  }

  #setImageWhenPowerDotIsActive(pacman) {
    if (pacman.powerDotAboutToExpire) {
      this.scaredAboutToExpireTimer--;
      if (this.scaredAboutToExpireTimer === 0) {
        this.scaredAboutToExpireTimer = this.scaredAboutToExpireTimerDefault;
        this.image = this.image === this.scaredGhost ? this.scaredGhost2 : this.scaredGhost;
      }
    } else {
      this.image = this.scaredGhost;
    }
  }

  #changeDirection(pacman) {
    this.directionTimer--;
    if (this.directionTimer > 0) return;

    if (!Number.isInteger(this.x / this.tileSize) || !Number.isInteger(this.y / this.tileSize)) return;

    this.directionTimer = this.directionTimerDefault;

    const directions = [
      { dir: MovingDirection.up, dx: 0, dy: -1 },
      { dir: MovingDirection.down, dx: 0, dy: 1 },
      { dir: MovingDirection.left, dx: -1, dy: 0 },
      { dir: MovingDirection.right, dx: 1, dy: 0 },
    ];

    const currentRow = Math.floor(this.y / this.tileSize);
    const currentCol = Math.floor(this.x / this.tileSize);
    const pacRow = Math.floor(pacman.y / this.tileSize);
    const pacCol = Math.floor(pacman.x / this.tileSize);


    const maxCols = this.tileMap.map[0].length;
    directions.sort((a, b) => {
      const nextColA = currentCol + a.dx;
      const nextRowA = currentRow + a.dy;
      const nextColB = currentCol + b.dx;
      const nextRowB = currentRow + b.dy;

      let dxA = Math.abs(nextColA - pacCol);
      let dyA = Math.abs(nextRowA - pacRow);
      dxA = Math.min(dxA, maxCols - dxA); // wormhole-aware horizontal distance
      const distA = dxA + dyA;

      let dxB = Math.abs(nextColB - pacCol);
      let dyB = Math.abs(nextRowB - pacRow);
      dxB = Math.min(dxB, maxCols - dxB); // wormhole-aware horizontal distance
      const distB = dxB + dyB;

      return distA - distB;
    });

    for (const d of directions) {
      if (!this.tileMap.didCollideWithEnvironment(this.x, this.y, d.dir)) {
        this.movingDirection = d.dir;
        break;
      }
    }
  }

  #move() {
    if (!this.tileMap.didCollideWithEnvironment(this.x, this.y, this.movingDirection)) {
      switch (this.movingDirection) {
        case MovingDirection.up:
          this.y -= this.velocity;
          break;
        case MovingDirection.down:
          this.y += this.velocity;
          break;
        case MovingDirection.left:
          this.x -= this.velocity;
          break;
        case MovingDirection.right:
          this.x += this.velocity;
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
  }

  #random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  #loadImages() {
    this.normalGhost = new Image();
    switch (this.color) {
      case "pinky":
        this.normalGhost.src = "images/pinky.png";
        break;
      case "inky":
        this.normalGhost.src = "images/inky.png";
        break;
      case "clyde":
        this.normalGhost.src = "images/clyde.png";
        break;
      case "blinky":
        this.normalGhost.src = "images/blinky.png";
        break;
      default:
        this.normalGhost.src = "images/pinky.png";
    }

    this.scaredGhost = new Image();
    this.scaredGhost.src = "images/scaredGhost.png";

    this.scaredGhost2 = new Image();
    this.scaredGhost2.src = "images/scaredGhost2.png";

    this.image = this.normalGhost;
  }
}