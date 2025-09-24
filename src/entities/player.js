const GRAVITY = 2800;
const JUMP_VELOCITY = -1250;

export class Player {
  constructor(x, groundY) {
    this.width = 54;
    this.height = 54;
    this.x = x;
    this.y = groundY - this.height;
    this.velocityY = 0;
    this.grounded = true;
    this.prevBottom = this.y + this.height;
    this.prevTop = this.y;
  }

  reset(groundY) {
    this.y = groundY - this.height;
    this.velocityY = 0;
    this.grounded = true;
    this.prevBottom = this.y + this.height;
    this.prevTop = this.y;
  }

  requestJump() {
    if (this.grounded) {
      this.velocityY = JUMP_VELOCITY;
      this.grounded = false;
    }
  }

  updatePhysics(dt) {
    this.prevBottom = this.y + this.height;
    this.prevTop = this.y;

    if (!this.grounded) {
      this.velocityY += GRAVITY * dt;
    }

    this.y += this.velocityY * dt;
  }

  landOn(y, platformVelocity = 0) {
    this.y = y - this.height;
    this.velocityY = platformVelocity;
    this.grounded = true;
  }

  leaveGround() {
    this.grounded = false;
  }

  get bounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }
}
