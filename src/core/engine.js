/**
 * Basic fixed-step engine using requestAnimationFrame.
 * The game updates at high frequency while keeping rendering smooth.
 */
export class Engine {
  constructor({ update, render, targetFps = 120 }) {
    this.update = update;
    this.render = render;
    this.targetStep = 1 / targetFps;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.boundLoop = (timestamp) => this.loop(timestamp);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.boundLoop);
  }

  stop() {
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) {
      return;
    }

    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.accumulator += delta;

    while (this.accumulator >= this.targetStep) {
      this.update(this.targetStep);
      this.accumulator -= this.targetStep;
    }

    this.render();
    requestAnimationFrame(this.boundLoop);
  }
}
