import { ObstacleType } from '../level/obstacles.js';

const COLORS = {
  ground: '#11192c',
  groundEdge: '#1f2b47',
  player: '#7cf2ff',
  trail: '#2c9fff',
  spike: '#ff4f6d',
  block: '#7cf2ff',
  pit: '#05070b',
  movingPlatform: '#ffe66d',
};

export class Renderer {
  constructor(canvas, level) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = level;
    this.backgroundLayers = [
      { color: '#11192c', height: canvas.height, speed: 0.1 },
      { color: '#182744', height: canvas.height, speed: 0.3 },
    ];
    this.trail = [];
  }

  drawBackground(cameraX) {
    const ctx = this.ctx;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const horizon = this.level.groundY - 60;
    for (const layer of this.backgroundLayers) {
      const offset = (cameraX * layer.speed) % this.canvas.width;
      ctx.fillStyle = layer.color;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(-offset, horizon - 120, this.canvas.width * 2, this.canvas.height);
      ctx.globalAlpha = 1;
    }
  }

  drawGround(cameraX) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, this.level.groundY, this.canvas.width, this.canvas.height - this.level.groundY);
    ctx.fillStyle = COLORS.groundEdge;
    ctx.fillRect(0, this.level.groundY - 8, this.canvas.width, 8);

    // draw visual pits for clarity
    const visibleStart = cameraX - 100;
    const visibleEnd = cameraX + this.canvas.width + 100;
    for (const pit of this.level.pits) {
      if (pit.end < visibleStart || pit.start > visibleEnd) continue;
      const x = pit.start - cameraX;
      const width = pit.end - pit.start;
      ctx.fillStyle = COLORS.pit;
      ctx.fillRect(x, this.level.groundY, width, this.canvas.height - this.level.groundY);
    }
  }

  drawObstacles(cameraX, obstacles) {
    const ctx = this.ctx;
    for (const obstacle of obstacles) {
      const screenX = obstacle.x - cameraX;
      if (obstacle.type === ObstacleType.SPIKE) {
        this.drawSpike(screenX, obstacle);
      } else if (obstacle.type === ObstacleType.BLOCK) {
        this.drawBlock(screenX, obstacle);
      } else if (obstacle.type === ObstacleType.MOVING_PLATFORM) {
        this.drawMovingPlatform(screenX, obstacle);
      }
    }
  }

  drawSpike(screenX, obstacle) {
    const ctx = this.ctx;
    const baseY = obstacle.y + obstacle.height;
    ctx.fillStyle = obstacle.color ?? COLORS.spike;
    ctx.beginPath();
    ctx.moveTo(screenX, baseY);
    ctx.lineTo(screenX + obstacle.width / 2, baseY - obstacle.height);
    ctx.lineTo(screenX + obstacle.width, baseY);
    ctx.closePath();
    ctx.fill();
  }

  drawBlock(screenX, obstacle) {
    const ctx = this.ctx;
    ctx.fillStyle = obstacle.color ?? COLORS.block;
    ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height / 4);
  }

  drawMovingPlatform(screenX, obstacle) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.movingPlatform;
    ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(screenX, obstacle.y + obstacle.height - 4, obstacle.width, 4);
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    this.trail.push({ x: player.x, y: player.y, life: 0.4 });
    if (this.trail.length > 12) {
      this.trail.shift();
    }

    for (const particle of this.trail) {
      particle.life -= 0.015;
      if (particle.life <= 0) continue;
      ctx.fillStyle = `rgba(44, 159, 255, ${particle.life})`;
      ctx.fillRect(particle.x + 6, particle.y + 6, player.width - 12, player.height - 12);
    }

    ctx.fillStyle = COLORS.player;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeStyle = '#0b0f1a';
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x + 1.5, player.y + 1.5, player.width - 3, player.height - 3);
  }

  drawSpeedIndicator(cameraX, speedZones) {
    const ctx = this.ctx;
    const visibleStart = cameraX;
    const visibleEnd = cameraX + this.canvas.width;
    ctx.fillStyle = 'rgba(124, 242, 255, 0.2)';
    for (const zone of speedZones) {
      if (zone.end < visibleStart || zone.start > visibleEnd) continue;
      const x = zone.start - cameraX;
      const width = zone.end - zone.start;
      ctx.fillRect(x, 0, width, 12);
    }
  }

  render(state) {
    const { cameraX, obstacles, player, speedZones } = state;
    this.drawBackground(cameraX);
    this.drawSpeedIndicator(cameraX, speedZones);
    this.drawGround(cameraX);
    this.drawObstacles(cameraX, obstacles);
    this.drawPlayer(player);
  }
}
