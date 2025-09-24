export const ObstacleType = {
  BLOCK: 'block',
  SPIKE: 'spike',
  PIT: 'pit',
  MOVING_PLATFORM: 'movingPlatform',
};

export class Obstacle {
  constructor(type, x, width, height, options = {}) {
    this.type = type;
    this.x = x;
    this.width = width;
    this.height = height;
    this.y = options.y ?? 0;
    this.color = options.color;
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.x + this.width;
  }

  get top() {
    return this.y;
  }

  get bottom() {
    return this.y + this.height;
  }
}

export class MovingPlatform extends Obstacle {
  constructor(x, y, width, height, amplitude, angularSpeed, phase = 0) {
    super(ObstacleType.MOVING_PLATFORM, x, width, height, { y });
    this.baseY = y;
    this.amplitude = amplitude;
    this.angularSpeed = angularSpeed;
    this.phase = phase;
    this.verticalVelocity = 0;
  }

  update(dt) {
    const previousY = this.y;
    this.phase += this.angularSpeed * dt;
    this.y = this.baseY + Math.sin(this.phase) * this.amplitude;
    this.verticalVelocity = (this.y - previousY) / dt;
  }

  reset() {
    this.phase = 0;
    this.y = this.baseY;
    this.verticalVelocity = 0;
  }
}
