/**
 * Collecte les entrées clavier et pointeur pour déclencher les sauts.
 */
export class Input {
  constructor(element) {
    this.element = element;
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
      if (event.type === 'mousedown' || event.type === 'touchstart') {
        this.jumpRequested = true;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('keyup', this.keyHandler);
    element.addEventListener('mousedown', this.pointerHandler);
    element.addEventListener('touchstart', this.pointerHandler, { passive: false });
  }

  consumeJumpRequest() {
    const requested = this.jumpRequested;
    this.jumpRequested = false;
    return requested;
  }

  dispose() {
    window.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('keyup', this.keyHandler);
    this.element.removeEventListener('mousedown', this.pointerHandler);
    this.element.removeEventListener('touchstart', this.pointerHandler);
  }
}
