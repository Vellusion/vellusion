export type SceneMode = '3D' | '2.5D' | '2D';

export class SceneModePicker {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _currentMode: SceneMode = '3D';
  private _buttons: HTMLButtonElement[] = [];
  private _onModeChange: ((mode: SceneMode) => void) | null = null;

  constructor(
    parent: HTMLElement,
    onModeChange?: (mode: SceneMode) => void,
  ) {
    this.container = parent;
    this._onModeChange = onModeChange ?? null;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-scene-mode-picker';
    this._element.style.cssText =
      'display:flex;border-radius:4px;overflow:hidden;';

    const modes: SceneMode[] = ['3D', '2.5D', '2D'];
    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.textContent = mode;
      btn.style.cssText =
        'border:none;padding:4px 8px;font-size:11px;cursor:pointer;background:rgba(48,48,54,0.9);color:#aaa;font-family:system-ui;';
      btn.addEventListener('click', () => this.setMode(mode));
      this._element.appendChild(btn);
      this._buttons.push(btn);
    }
    this._updateButtons();
    parent.appendChild(this._element);
  }

  get currentMode(): SceneMode {
    return this._currentMode;
  }

  setMode(mode: SceneMode): void {
    this._currentMode = mode;
    this._updateButtons();
    this._onModeChange?.(mode);
  }

  private _updateButtons(): void {
    const modes: SceneMode[] = ['3D', '2.5D', '2D'];
    this._buttons.forEach((btn, i) => {
      btn.style.color = modes[i] === this._currentMode ? '#6ec6ff' : '#aaa';
      btn.style.fontWeight =
        modes[i] === this._currentMode ? 'bold' : 'normal';
    });
  }

  destroy(): void {
    this._element.remove();
  }
}
