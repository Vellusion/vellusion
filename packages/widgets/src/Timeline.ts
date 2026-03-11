export interface TimelineOptions {
  startTime: number; // seconds (e.g., Julian date seconds)
  stopTime: number;
  currentTime: number;
  onSeek?: (time: number) => void;
}

export class Timeline {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _trackEl: HTMLElement;
  private _thumbEl: HTMLElement;
  private _startTime: number;
  private _stopTime: number;
  private _currentTime: number;
  private _onSeek: ((time: number) => void) | null;
  private _dragging = false;

  constructor(parent: HTMLElement, options: TimelineOptions) {
    this.container = parent;
    this._startTime = options.startTime;
    this._stopTime = options.stopTime;
    this._currentTime = options.currentTime;
    this._onSeek = options.onSeek ?? null;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-timeline';
    this._element.style.cssText =
      'position:absolute;bottom:32px;left:0;right:0;height:28px;background:rgba(38,38,42,0.9);z-index:10;';

    this._trackEl = document.createElement('div');
    this._trackEl.style.cssText =
      'position:absolute;top:12px;left:16px;right:16px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;cursor:pointer;';

    this._thumbEl = document.createElement('div');
    this._thumbEl.style.cssText =
      'position:absolute;top:-4px;width:12px;height:12px;background:#6ec6ff;border-radius:50%;cursor:grab;transform:translateX(-50%);';

    this._trackEl.appendChild(this._thumbEl);
    this._element.appendChild(this._trackEl);
    parent.appendChild(this._element);

    this._updateThumbPosition();
    this._setupDrag();
  }

  get startTime(): number {
    return this._startTime;
  }
  set startTime(v: number) {
    this._startTime = v;
    this._updateThumbPosition();
  }

  get stopTime(): number {
    return this._stopTime;
  }
  set stopTime(v: number) {
    this._stopTime = v;
    this._updateThumbPosition();
  }

  get currentTime(): number {
    return this._currentTime;
  }
  set currentTime(v: number) {
    this._currentTime = Math.max(this._startTime, Math.min(v, this._stopTime));
    this._updateThumbPosition();
  }

  private _updateThumbPosition(): void {
    const range = this._stopTime - this._startTime;
    if (range <= 0) return;
    const pct = ((this._currentTime - this._startTime) / range) * 100;
    this._thumbEl.style.left = `${pct}%`;
  }

  private _setupDrag(): void {
    this._trackEl.addEventListener('mousedown', (e) => {
      this._dragging = true;
      this._seekFromEvent(e);
    });
    document.addEventListener('mousemove', (e) => {
      if (this._dragging) this._seekFromEvent(e);
    });
    document.addEventListener('mouseup', () => {
      this._dragging = false;
    });
  }

  private _seekFromEvent(e: MouseEvent): void {
    const rect = this._trackEl.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    this._currentTime =
      this._startTime + pct * (this._stopTime - this._startTime);
    this._updateThumbPosition();
    this._onSeek?.(this._currentTime);
  }

  destroy(): void {
    this._element.remove();
  }
}
