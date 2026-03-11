/**
 * @vellusion/widgets - InfoBox
 *
 * A floating panel anchored inside the viewer container that displays a title
 * and HTML description for the currently selected entity or feature.
 */

export class InfoBox {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _titleEl: HTMLElement;
  private _descriptionEl: HTMLElement;
  private _closeBtn: HTMLElement;
  private _visible = false;

  constructor(parent: HTMLElement) {
    this.container = parent;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-infobox';
    this._element.style.cssText =
      'position:absolute;top:8px;left:8px;width:300px;max-height:400px;' +
      'background:rgba(38,38,42,0.95);color:#e0e0e0;border-radius:8px;' +
      'font-family:system-ui,sans-serif;overflow:hidden;display:none;z-index:20;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.3);';

    // Header
    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;' +
      'padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.1);';

    this._titleEl = document.createElement('h3');
    this._titleEl.style.cssText = 'margin:0;font-size:14px;font-weight:600;';

    this._closeBtn = document.createElement('button');
    this._closeBtn.textContent = '\u00D7';
    this._closeBtn.style.cssText =
      'background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;padding:0;line-height:1;';
    this._closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(this._titleEl);
    header.appendChild(this._closeBtn);

    // Description body
    this._descriptionEl = document.createElement('div');
    this._descriptionEl.style.cssText =
      'padding:12px 16px;font-size:13px;line-height:1.5;overflow-y:auto;max-height:340px;';

    this._element.appendChild(header);
    this._element.appendChild(this._descriptionEl);
    parent.appendChild(this._element);
  }

  // ---------------------------------------------------------------------------
  // Properties
  // ---------------------------------------------------------------------------

  /** Current title text. */
  get title(): string {
    return this._titleEl.textContent ?? '';
  }
  set title(value: string) {
    this._titleEl.textContent = value;
  }

  /** Current description HTML. */
  get description(): string {
    return this._descriptionEl.innerHTML;
  }
  set description(value: string) {
    this._descriptionEl.innerHTML = value;
  }

  /** Whether the info box is currently visible. */
  get isVisible(): boolean {
    return this._visible;
  }

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /** Show the info box with the given title and description. */
  show(title: string, description: string): void {
    this._titleEl.textContent = title;
    this._descriptionEl.innerHTML = description;
    this._element.style.display = 'block';
    this._visible = true;
  }

  /** Hide the info box. */
  hide(): void {
    this._element.style.display = 'none';
    this._visible = false;
  }

  /** Remove the info box element from the DOM. */
  destroy(): void {
    this._element.remove();
  }
}
