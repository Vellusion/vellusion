export class FullscreenButton {
  readonly container: HTMLElement;
  private _element: HTMLButtonElement;
  private _target: HTMLElement;
  private _isFullscreen = false;

  constructor(parent: HTMLElement, target?: HTMLElement) {
    this.container = parent;
    this._target = target ?? parent;

    this._element = document.createElement('button');
    this._element.className = 'vellusion-fullscreen-button';
    this._element.title = 'Fullscreen';
    this._element.textContent = '\u26F6'; // expand
    this._element.style.cssText =
      'width:32px;height:32px;border:none;border-radius:4px;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:16px;cursor:pointer;';
    this._element.addEventListener('click', () => this.toggle());
    parent.appendChild(this._element);

    document.addEventListener('fullscreenchange', () => {
      this._isFullscreen = !!document.fullscreenElement;
    });
  }

  get isFullscreen(): boolean {
    return this._isFullscreen;
  }

  async toggle(): Promise<void> {
    if (this._isFullscreen) {
      await document.exitFullscreen?.();
    } else {
      await this._target.requestFullscreen?.();
    }
  }

  destroy(): void {
    this._element.remove();
  }
}
