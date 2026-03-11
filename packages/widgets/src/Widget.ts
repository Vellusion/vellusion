/**
 * @vellusion/widgets - Widget
 *
 * Lightweight entry point that creates a canvas inside a container element.
 * Does not include toolbar, info box, or other UI chrome — use {@link Viewer}
 * for the full-featured wrapper.
 */

export class Widget {
  readonly container: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private _destroyed = false;

  constructor(container: HTMLElement | string) {
    this.container =
      typeof container === 'string'
        ? document.getElementById(container)!
        : container;

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
  }

  /** Whether {@link destroy} has been called. */
  get isDestroyed(): boolean {
    return this._destroyed;
  }

  /**
   * Resize the backing canvas to match the container's current CSS size,
   * accounting for `devicePixelRatio`.
   */
  resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
  }

  /** Tear down the widget and remove the canvas from the DOM. */
  destroy(): void {
    this._destroyed = true;
    this.container.removeChild(this.canvas);
  }
}
