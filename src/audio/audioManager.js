/**
 * Lightweight audio wrapper to plug a soundtrack easily.
 */
export class AudioManager {
  constructor() {
    this.audio = null;
    this.isReady = false;
  }

  async loadMusic(url) {
    this.audio = new Audio(url);
    this.audio.loop = true;
    await this.audio.play().catch(() => {
      // Autoplay might fail: wait for user interaction.
      this.isReady = false;
    });
    this.isReady = true;
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  play() {
    if (this.audio) {
      this.audio.play().catch(() => {
        /* ignore */
      });
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
}
