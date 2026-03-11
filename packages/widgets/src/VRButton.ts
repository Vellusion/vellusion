export class VRButton {
  readonly container: HTMLElement;
  private _element: HTMLButtonElement;
  private _supported = false;

  constructor(parent: HTMLElement) {
    this.container = parent;

    this._element = document.createElement('button');
    this._element.className = 'vellusion-vr-button';
    this._element.textContent = 'VR';
    this._element.title = 'Enter VR';
    this._element.style.cssText =
      'width:32px;height:32px;border:none;border-radius:4px;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:12px;font-weight:bold;cursor:pointer;font-family:system-ui;';

    // Check WebXR support
    if ('xr' in navigator) {
      (navigator as any).xr
        ?.isSessionSupported?.('immersive-vr')
        ?.then((supported: boolean) => {
          this._supported = supported;
          if (!supported) {
            this._element.style.opacity = '0.4';
            this._element.title = 'VR not supported';
          }
        });
    } else {
      this._element.style.opacity = '0.4';
      this._element.title = 'WebXR not available';
    }

    parent.appendChild(this._element);
  }

  get isSupported(): boolean {
    return this._supported;
  }

  destroy(): void {
    this._element.remove();
  }
}
