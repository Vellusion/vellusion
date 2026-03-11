export class ZoomControls {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _onZoomIn: (() => void) | null = null;
  private _onZoomOut: (() => void) | null = null;

  constructor(
    parent: HTMLElement,
    options?: { onZoomIn?: () => void; onZoomOut?: () => void },
  ) {
    this.container = parent;
    this._onZoomIn = options?.onZoomIn ?? null;
    this._onZoomOut = options?.onZoomOut ?? null;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-zoom-controls';
    this._element.style.cssText =
      'display:flex;flex-direction:column;border-radius:4px;overflow:hidden;';

    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.title = 'Zoom In';
    zoomIn.style.cssText =
      'width:32px;height:32px;border:none;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:18px;cursor:pointer;';
    zoomIn.addEventListener('click', () => this._onZoomIn?.());

    const zoomOut = document.createElement('button');
    zoomOut.textContent = '\u2212'; // minus
    zoomOut.title = 'Zoom Out';
    zoomOut.style.cssText =
      'width:32px;height:32px;border:none;border-top:1px solid rgba(255,255,255,0.1);background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:18px;cursor:pointer;';
    zoomOut.addEventListener('click', () => this._onZoomOut?.());

    this._element.appendChild(zoomIn);
    this._element.appendChild(zoomOut);
    parent.appendChild(this._element);
  }

  destroy(): void {
    this._element.remove();
  }
}
