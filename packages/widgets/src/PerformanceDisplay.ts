export class PerformanceDisplay {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _fpsEl: HTMLElement;
  private _frameTimeEl: HTMLElement;
  private _fps = 0;
  private _frameTime = 0;
  private _frameTimes: number[] = [];

  constructor(parent: HTMLElement) {
    this.container = parent;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-perf-display';
    this._element.style.cssText =
      'position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.7);color:#0f0;font-family:monospace;font-size:11px;padding:6px 10px;border-radius:4px;z-index:10;line-height:1.6;pointer-events:none;';

    this._fpsEl = document.createElement('div');
    this._frameTimeEl = document.createElement('div');
    this._element.appendChild(this._fpsEl);
    this._element.appendChild(this._frameTimeEl);
    parent.appendChild(this._element);
  }

  get fps(): number {
    return this._fps;
  }
  get frameTime(): number {
    return this._frameTime;
  }

  update(dt: number): void {
    this._frameTimes.push(dt);
    if (this._frameTimes.length > 60) this._frameTimes.shift();

    const avg =
      this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;
    this._frameTime = avg;
    this._fps = avg > 0 ? 1 / avg : 0;

    this._fpsEl.textContent = `FPS: ${this._fps.toFixed(0)}`;
    this._frameTimeEl.textContent = `Frame: ${(this._frameTime * 1000).toFixed(1)}ms`;
  }

  destroy(): void {
    this._element.remove();
  }
}
