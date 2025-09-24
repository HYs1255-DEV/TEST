import { MovingPlatform, Obstacle, ObstacleType } from './obstacles.js';
import { Random } from './random.js';

const GROUND_MARGIN = 80;

/**
 * Creates a long scrolling level with multiple obstacle patterns.
 */
export class Level {
  constructor({ canvasWidth, canvasHeight, seed }) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = canvasHeight - GROUND_MARGIN;
    this.random = new Random(seed);

    this.obstacles = [];
    this.pits = [];
    this.speedZones = [];

    this.length = 76000; // approx 4 minutes at base speed.
    this.baseSpeed = 320;
    this.elapsed = 0;

    this.generate();
  }

  generate() {
    this.obstacles.length = 0;
    this.pits.length = 0;
    this.speedZones.length = 0;

    let cursor = 400;
    let nextSpeedZone = 4000 + this.random.range(2000, 4000);

    while (cursor < this.length) {
      if (cursor > nextSpeedZone) {
        const duration = this.random.range(1200, 2400);
        const multiplier = this.random.range(1.35, 1.7);
        this.speedZones.push({ start: cursor, end: cursor + duration, multiplier });
        cursor += 400;
        nextSpeedZone += this.random.range(8000, 12000);
        continue;
      }

      const pattern = this.random.pick(['spike', 'blockSteps', 'pit', 'movingPlatform', 'mixed']);
      switch (pattern) {
        case 'spike':
          cursor = this.addSpikeCluster(cursor);
          break;
        case 'blockSteps':
          cursor = this.addBlockSteps(cursor);
          break;
        case 'pit':
          cursor = this.addPitSequence(cursor);
          break;
        case 'movingPlatform':
          cursor = this.addMovingPlatformRun(cursor);
          break;
        case 'mixed':
        default:
          cursor = this.addMixedPattern(cursor);
          break;
      }
      cursor += this.random.range(160, 340);
    }
  }

  addSpikeCluster(cursor) {
    const clusterLength = this.random.range(3, 7);
    const spikeWidth = 60;
    for (let i = 0; i < clusterLength; i++) {
      const height = this.random.range(80, 120);
      this.obstacles.push(
        new Obstacle(ObstacleType.SPIKE, cursor + i * spikeWidth, spikeWidth, height, {
          y: this.groundY - height,
          color: '#ff4f6d',
        })
      );
    }
    return cursor + clusterLength * spikeWidth;
  }

  addBlockSteps(cursor) {
    const steps = this.random.range(3, 6);
    const blockWidth = 140;
    let height = 80;
    for (let i = 0; i < steps; i++) {
      const blockHeight = height + this.random.range(-10, 50);
      this.obstacles.push(
        new Obstacle(ObstacleType.BLOCK, cursor + i * (blockWidth + 40), blockWidth, blockHeight, {
          y: this.groundY - blockHeight,
          color: '#7cf2ff',
        })
      );
      height += this.random.range(-20, 40);
    }
    return cursor + steps * (blockWidth + 40);
  }

  addPitSequence(cursor) {
    const gaps = this.random.range(1, 3);
    const gapWidth = this.random.range(180, 320);
    for (let i = 0; i < gaps; i++) {
      const pitStart = cursor + i * (gapWidth + 240);
      this.pits.push({ start: pitStart, end: pitStart + gapWidth });
      this.obstacles.push(
        new Obstacle(ObstacleType.SPIKE, pitStart - 60, 60, 90, {
          y: this.groundY - 90,
          color: '#ffb347',
        })
      );
      this.obstacles.push(
        new Obstacle(ObstacleType.SPIKE, pitStart + gapWidth, 60, 90, {
          y: this.groundY - 90,
          color: '#ffb347',
        })
      );
    }
    return cursor + gaps * (gapWidth + 240);
  }

  addMovingPlatformRun(cursor) {
    const platforms = this.random.range(2, 4);
    const width = 160;
    for (let i = 0; i < platforms; i++) {
      const x = cursor + i * (width + 240);
      const baseY = this.groundY - this.random.range(120, 220);
      const amplitude = this.random.range(30, 70);
      const angularSpeed = this.random.range(1.2, 2.2);
      this.obstacles.push(new MovingPlatform(x, baseY, width, 22, amplitude, angularSpeed));
    }
    return cursor + platforms * (width + 240);
  }

  addMixedPattern(cursor) {
    const chunkLength = this.random.range(800, 1200);
    const subCursor = cursor;
    let offset = 0;
    while (offset < chunkLength) {
      const choice = this.random.pick(['spike', 'block', 'pit']);
      if (choice === 'spike') {
        offset += this.random.range(120, 220);
        const height = this.random.range(90, 130);
        this.obstacles.push(
          new Obstacle(ObstacleType.SPIKE, subCursor + offset, 60, height, {
            y: this.groundY - height,
            color: '#ff4f6d',
          })
        );
      } else if (choice === 'block') {
        const width = this.random.range(120, 200);
        const height = this.random.range(60, 160);
        this.obstacles.push(
          new Obstacle(ObstacleType.BLOCK, subCursor + offset, width, height, {
            y: this.groundY - height,
            color: '#7cf2ff',
          })
        );
        offset += width + 60;
      } else {
        const gapWidth = this.random.range(140, 220);
        const pitStart = subCursor + offset;
        this.pits.push({ start: pitStart, end: pitStart + gapWidth });
        offset += gapWidth + 200;
      }
    }
    return cursor + chunkLength;
  }

  reset() {
    this.elapsed = 0;
    for (const obstacle of this.obstacles) {
      if (obstacle instanceof MovingPlatform) {
        obstacle.reset();
      }
    }
  }

  update(dt) {
    this.elapsed += dt;
    for (const obstacle of this.obstacles) {
      if (obstacle instanceof MovingPlatform) {
        obstacle.update(dt);
      }
    }
  }

  getScrollSpeed(worldX) {
    let speed = this.baseSpeed;
    for (const zone of this.speedZones) {
      if (worldX >= zone.start && worldX <= zone.end) {
        speed = this.baseSpeed * zone.multiplier;
        break;
      }
    }
    return speed;
  }

  getActiveObstacles(cameraX, viewWidth) {
    const margin = 600;
    const start = cameraX - margin;
    const end = cameraX + viewWidth + margin;
    return this.obstacles.filter((obstacle) => obstacle.right >= start && obstacle.left <= end);
  }

  isOverPit(worldX, width) {
    const left = worldX;
    const right = worldX + width;
    return this.pits.some((pit) => right > pit.start && left < pit.end);
  }
}
