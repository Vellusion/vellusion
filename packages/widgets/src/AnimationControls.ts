export class AnimationControls {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _playing = false;
  private _speed = 1;
  private _reverse = false;
  private _onPlay: (() => void) | null = null;
  private _onPause: (() => void) | null = null;
  private _onSpeedChange: ((speed: number) => void) | null = null;

  constructor(
    parent: HTMLElement,
    options?: {
      onPlay?: () => void;
      onPause?: () => void;
      onSpeedChange?: (speed: number) => void;
    },
  ) {
    this.container = parent;
    this._onPlay = options?.onPlay ?? null;
    this._onPause = options?.onPause ?? null;
    this._onSpeedChange = options?.onSpeedChange ?? null;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-animation-controls';
    this._element.style.cssText =
      'position:absolute;bottom:4px;left:50%;transform:translateX(-50%);display:flex;gap:2px;z-index:10;';

    const btns = [
      { label: '\u23EA', title: 'Reverse', action: () => this.reverse() },
      { label: '\u23F4', title: 'Slow Down', action: () => this.slowDown() },
      {
        label: '\u25B6',
        title: 'Play/Pause',
        action: () => this.togglePlay(),
      },
      { label: '\u23F5', title: 'Speed Up', action: () => this.speedUp() },
      { label: '\u23ED', title: 'Step Forward', action: () => {} },
    ];

    for (const b of btns) {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      btn.title = b.title;
      btn.style.cssText =
        'width:28px;height:24px;border:none;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:12px;cursor:pointer;';
      btn.addEventListener('click', b.action);
      this._element.appendChild(btn);
    }

    parent.appendChild(this._element);
  }

  get isPlaying(): boolean {
    return this._playing;
  }
  get speed(): number {
    return this._speed;
  }
  get isReversed(): boolean {
    return this._reverse;
  }

  play(): void {
    this._playing = true;
    this._onPlay?.();
  }

  pause(): void {
    this._playing = false;
    this._onPause?.();
  }

  togglePlay(): void {
    this._playing ? this.pause() : this.play();
  }

  speedUp(): void {
    this._speed = Math.min(this._speed * 2, 64);
    this._onSpeedChange?.(this._speed);
  }

  slowDown(): void {
    this._speed = Math.max(this._speed / 2, 0.125);
    this._onSpeedChange?.(this._speed);
  }

  reverse(): void {
    this._reverse = !this._reverse;
  }

  destroy(): void {
    this._element.remove();
  }
}
