/**
 * Collects keyboard and pointer input to drive jumps.
 */
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.jumpRequested = false;

    this.keyHandler = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        if (event.type === 'keydown') {
          this.jumpRequested = true;
        }
        event.preventDefault();
      }
    };

    this.pointerHandler = (event) => {
      if (event.type === 'mousedown') {
        this.jumpRequested = true;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('keyup', this.keyHandler);
    canvas.addEventListener('mousedown', this.pointerHandler);
    canvas.addEventListener('touchstart', this.pointerHandler, { passive: false });
  }

  consumeJumpRequest() {
    const requested = this.jumpRequested;
    this.jumpRequested = false;
    return requested;
  }

  dispose() {
    window.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('keyup', this.keyHandler);
    this.canvas.removeEventListener('mousedown', this.pointerHandler);
    this.canvas.removeEventListener('touchstart', this.pointerHandler);
  }
}
