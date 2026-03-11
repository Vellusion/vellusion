/**
 * @vellusion/widgets - SelectionIndicator
 *
 * A circular overlay that highlights the screen position of a selected entity.
 * The indicator smoothly animates between positions using CSS transitions.
 */

export class SelectionIndicator {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _visible = false;

  constructor(parent: HTMLElement) {
    this.container = parent;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-selection-indicator';
    this._element.style.cssText =
      'position:absolute;width:48px;height:48px;border:2px solid #6ec6ff;' +
      'border-radius:50%;pointer-events:none;display:none;z-index:15;' +
      'transform:translate(-50%,-50%);' +
      'box-shadow:0 0 12px rgba(110,198,255,0.4);' +
      'transition:left 0.2s ease,top 0.2s ease;';
    parent.appendChild(this._element);
  }

  /** Whether the indicator is currently visible. */
  get isVisible(): boolean {
    return this._visible;
  }

  /** Show the indicator at a given screen position. */
  show(screenX: number, screenY: number): void {
    this._element.style.left = `${screenX}px`;
    this._element.style.top = `${screenY}px`;
    this._element.style.display = 'block';
    this._visible = true;
  }

  /** Hide the indicator. */
  hide(): void {
    this._element.style.display = 'none';
    this._visible = false;
  }

  /**
   * Animate the indicator to a new screen position (CSS transition handles
   * the interpolation). If the indicator is hidden it will be made visible.
   */
  animateTo(screenX: number, screenY: number): void {
    this._element.style.left = `${screenX}px`;
    this._element.style.top = `${screenY}px`;
    if (!this._visible) {
      this._element.style.display = 'block';
      this._visible = true;
    }
  }

  /** Remove the indicator element from the DOM. */
  destroy(): void {
    this._element.remove();
  }
}
