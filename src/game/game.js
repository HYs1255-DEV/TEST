import { AudioManager } from '../audio/audioManager.js';
import { Engine } from '../core/engine.js';
import { Input } from '../core/input.js';
import { Player } from '../entities/player.js';
import { Level } from '../level/level.js';
import { ObstacleType } from '../level/obstacles.js';
import { Renderer } from '../render/renderer.js';

export class Game {
  constructor(canvas, statusElement) {
    this.canvas = canvas;
    this.statusElement = statusElement;

    this.level = new Level({
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      seed: 2024,
    });
    this.player = new Player(160, this.level.groundY);
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas, this.level);
    this.audio = new AudioManager();

    this.engine = new Engine({
      update: (dt) => this.update(dt),
      render: () => this.render(),
      targetFps: 120,
    });

    this.cameraX = 0;
    this.visibleObstacles = [];
    this.statusDuration = 0;
    this.completed = false;

    this.canvas.addEventListener('mousedown', () => this.startAudio(), { once: true });
    this.canvas.addEventListener('touchstart', () => this.startAudio(), { once: true });
  }

  async loadMusic(url) {
    await this.audio.loadMusic(url);
  }

  startAudio() {
    if (this.audio && this.audio.audio) {
      this.audio.play();
    }
  }

  start() {
    this.engine.start();
  }

  update(dt) {
    if (this.completed) {
      return;
    }

    const speed = this.level.getScrollSpeed(this.cameraX + this.player.x);
    this.cameraX += speed * dt;

    if (this.cameraX >= this.level.length) {
      this.completed = true;
      this.showStatus('Niveau terminé !', 0);
      this.audio.stop();
      return;
    }

    this.level.update(dt);

    if (this.input.consumeJumpRequest()) {
      this.player.requestJump();
    }

    this.player.leaveGround();
    this.player.updatePhysics(dt);

    const playerWorldLeft = this.cameraX + this.player.x;
    const playerBounds = this.player.bounds;

    const obstacles = this.level.getActiveObstacles(this.cameraX, this.canvas.width);
    let landed = false;

    for (const obstacle of obstacles) {
      const collisionResult = this.handleObstacle(obstacle, playerWorldLeft);
      if (collisionResult.dead) {
        return;
      }
      if (collisionResult.landed) {
        landed = true;
      }
    }

    const overPit = this.level.isOverPit(playerWorldLeft, this.player.width);
    if (!overPit && playerBounds.bottom >= this.level.groundY) {
      if (this.player.prevBottom <= this.level.groundY || playerBounds.bottom > this.level.groundY) {
        this.player.landOn(this.level.groundY);
        landed = true;
      }
    }

    if (!landed) {
      this.player.leaveGround();
    }

    if (overPit && playerBounds.top > this.canvas.height) {
      this.fail('Tu es tombé dans le vide !');
      return;
    }

    this.visibleObstacles = obstacles;

    if (this.statusDuration > 0) {
      this.statusDuration -= dt;
      if (this.statusDuration <= 0) {
        this.statusElement.textContent = '';
      }
    }
  }

  handleObstacle(obstacle, playerWorldLeft) {
    const result = { landed: false, dead: false };
    const bounds = this.player.bounds;
    const playerLeft = playerWorldLeft;
    const playerRight = playerLeft + this.player.width;
    const playerTop = bounds.top;
    const playerBottom = bounds.bottom;
    const prevBottom = this.player.prevBottom;

    const obsLeft = obstacle.left;
    const obsRight = obstacle.right;
    const obsTop = obstacle.y;
    const obsBottom = obstacle.y + obstacle.height;

    const horizontalOverlap = playerRight > obsLeft && playerLeft < obsRight;
    if (!horizontalOverlap) {
      return result;
    }

    const verticalOverlap = playerBottom > obsTop && playerTop < obsBottom;

    if (obstacle.type === ObstacleType.SPIKE) {
      if (verticalOverlap) {
        this.fail('Aïe ! Un pique t\'a stoppé.');
        result.dead = true;
      }
      return result;
    }

    if (obstacle.type === ObstacleType.BLOCK || obstacle.type === ObstacleType.MOVING_PLATFORM) {
      const landingFromAbove = prevBottom <= obsTop && playerBottom >= obsTop;
      const sticking = Math.abs(playerBottom - obsTop) <= 2 && this.player.velocityY >= (obstacle.verticalVelocity ?? 0);
      if (landingFromAbove || sticking) {
        const platformVelocity = obstacle.type === ObstacleType.MOVING_PLATFORM ? obstacle.verticalVelocity : 0;
        this.player.landOn(obsTop, platformVelocity);
        result.landed = true;
        return result;
      }

      if (verticalOverlap) {
        this.fail('Crash ! Tu as heurté un bloc.');
        result.dead = true;
        return result;
      }
    }

    return result;
  }

  fail(message) {
    this.showStatus(message, 2.5);
    this.level.reset();
    this.cameraX = 0;
    this.player.reset(this.level.groundY);
    this.visibleObstacles = [];
  }

  showStatus(message, duration) {
    this.statusElement.textContent = message;
    this.statusDuration = duration;
  }

  render() {
    this.renderer.render({
      cameraX: this.cameraX,
      obstacles: this.visibleObstacles,
      player: this.player,
      speedZones: this.level.speedZones,
    });
  }
}
