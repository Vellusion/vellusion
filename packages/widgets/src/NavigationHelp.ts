export class NavigationHelp {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _visible = false;
  private _toggleBtn: HTMLButtonElement;

  constructor(parent: HTMLElement) {
    this.container = parent;

    this._toggleBtn = document.createElement('button');
    this._toggleBtn.className = 'vellusion-nav-help-toggle';
    this._toggleBtn.textContent = '?';
    this._toggleBtn.title = 'Navigation Help';
    this._toggleBtn.style.cssText =
      'width:32px;height:32px;border:none;border-radius:4px;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:16px;cursor:pointer;';
    this._toggleBtn.addEventListener('click', () => this.toggle());
    parent.appendChild(this._toggleBtn);

    this._element = document.createElement('div');
    this._element.className = 'vellusion-nav-help';
    this._element.style.cssText =
      'position:absolute;top:50px;right:8px;width:240px;background:rgba(38,38,42,0.95);color:#e0e0e0;border-radius:8px;padding:16px;font-family:system-ui,sans-serif;font-size:12px;line-height:1.6;display:none;z-index:20;box-shadow:0 4px 16px rgba(0,0,0,0.3);';
    this._element.innerHTML = `
      <div style="font-weight:600;margin-bottom:8px;">Navigation Controls</div>
      <div><b>Left Drag</b> — Rotate</div>
      <div><b>Right Drag</b> — Zoom</div>
      <div><b>Middle Drag</b> — Pan</div>
      <div><b>Scroll</b> — Zoom</div>
      <div><b>Double Click</b> — Zoom to point</div>
    `;
    parent.appendChild(this._element);
  }

  get isVisible(): boolean {
    return this._visible;
  }

  show(): void {
    this._element.style.display = 'block';
    this._visible = true;
  }

  hide(): void {
    this._element.style.display = 'none';
    this._visible = false;
  }

  toggle(): void {
    this._visible ? this.hide() : this.show();
  }

  destroy(): void {
    this._element.remove();
    this._toggleBtn.remove();
  }
}
