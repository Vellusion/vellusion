export class HomeButton {
  readonly container: HTMLElement;
  private _element: HTMLButtonElement;
  private _onClickCallback: (() => void) | null = null;

  constructor(parent: HTMLElement, onClick?: () => void) {
    this.container = parent;
    this._onClickCallback = onClick ?? null;

    this._element = document.createElement('button');
    this._element.className = 'vellusion-home-button';
    this._element.title = 'Home';
    this._element.textContent = '\u2302'; // house symbol
    this._element.style.cssText =
      'width:32px;height:32px;border:none;border-radius:4px;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
    this._element.addEventListener('click', () => this._onClick());
    parent.appendChild(this._element);
  }

  set onClick(fn: () => void) {
    this._onClickCallback = fn;
  }

  private _onClick(): void {
    this._onClickCallback?.();
  }

  destroy(): void {
    this._element.remove();
  }
}
