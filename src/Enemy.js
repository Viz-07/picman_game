import MovingDirection from "./MovingDirection.js";

export default class Enemy {
  constructor(x, y, tileSize, velocity, tileMap) {
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
  }

  draw(ctx, pause, pacman) {
    if (!pause) {
      this.#move();
      this.#changeDirection(pacman);
    }
    this.#setImage(ctx, pacman);
  }

  collideWith(pacman) {
    const size = this.tileSize / 2;
    if (
      this.x < pacman.x + size &&
      this.x + size > pacman.x &&
      this.y < pacman.y + size &&
      this.y + size > pacman.y
    ) {
      return true;
    } else {
      return false;
    }
  }

  #setImage(ctx, pacman) {
    if (pacman.powerDotActive) {
      this.#setImageWhenPowerDotIsActive(pacman);
    } else {
      this.image = this.normalGhost;
    }
    ctx.drawImage(this.image, this.x, this.y, this.tileSize, this.tileSize);
  }

  #setImageWhenPowerDotIsActive(pacman) {
    if (pacman.powerDotAboutToExpire) {
      this.scaredAboutToExpireTimer--;
      if (this.scaredAboutToExpireTimer === 0) {
        this.scaredAboutToExpireTimer = this.scaredAboutToExpireTimerDefault;
        if (this.image === this.scaredGhost) {
          this.image = this.scaredGhost2;
        } else {
          this.image = this.scaredGhost;
        }
      }
    } else {
      this.image = this.scaredGhost;
    }
  }

  // #changeDirection() {
  //   this.directionTimer--;
  //   let newMoveDirection = null;
  //   if (this.directionTimer == 0) {
  //     this.directionTimer = this.directionTimerDefault;
  //     newMoveDirection = Math.floor(
  //       Math.random() * Object.keys(MovingDirection).length
  //     );
  //   }

  //   if (newMoveDirection != null && this.movingDirection != newMoveDirection) {
  //     if (
  //       Number.isInteger(this.x / this.tileSize) &&
  //       Number.isInteger(this.y / this.tileSize)
  //     ) {
  //       if (
  //         !this.tileMap.didCollideWithEnvironment(
  //           this.x,
  //           this.y,
  //           newMoveDirection
  //         )
  //       ) {
  //         this.movingDirection = newMoveDirection;
  //       }
  //     }
  //   }
  // }
  #changeDirection(pacman) {
    this.directionTimer--;
    if (this.directionTimer > 0) return;
    // Only change direction if the ghost is aligned to the tile grid
    if (
      !Number.isInteger(this.x / this.tileSize) ||
      !Number.isInteger(this.y / this.tileSize)
    ) {
      return;
    }

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

    directions.sort((a, b) => {
      const aDist = Math.abs((currentRow + a.dy) - pacRow) + Math.abs((currentCol + a.dx) - pacCol);
      const bDist = Math.abs((currentRow + b.dy) - pacRow) + Math.abs((currentCol + b.dx) - pacCol);
      return aDist - bDist;
    });

    for (const d of directions) {
      if (
        !this.tileMap.didCollideWithEnvironment(this.x, this.y, d.dir)
      ) {
        this.movingDirection = d.dir;
        break;
      }
    }
  }


  #move() {
    if (
      !this.tileMap.didCollideWithEnvironment(
        this.x,
        this.y,
        this.movingDirection
      )
    ) {
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
    }
  }

  #random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  #loadImages() {
    this.normalGhost = new Image();
    this.normalGhost.src = "images/ghost.png";

    this.scaredGhost = new Image();
    this.scaredGhost.src = "images/scaredGhost.png";

    this.scaredGhost2 = new Image();
    this.scaredGhost2.src = "images/scaredGhost2.png";

    this.image = this.normalGhost;
  }
}
