/**
 * @vellusion/widgets - CreditDisplay
 *
 * A small bar at the bottom of the viewer container that shows attribution
 * credits for imagery providers, terrain providers, or custom data sources.
 */

/** Describes a single credit entry. */
export interface Credit {
  text: string;
  link?: string;
}

export class CreditDisplay {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _credits: Credit[] = [];

  constructor(parent: HTMLElement) {
    this.container = parent;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-credits';
    this._element.style.cssText =
      'position:absolute;bottom:4px;left:4px;font-size:11px;' +
      'color:rgba(255,255,255,0.5);font-family:system-ui,sans-serif;z-index:10;';
    parent.appendChild(this._element);
  }

  /** Snapshot of the current credits list. */
  get credits(): readonly Credit[] {
    return this._credits;
  }

  /** Add a credit entry and re-render. */
  addCredit(credit: Credit): void {
    this._credits.push(credit);
    this._render();
  }

  /** Remove all credits whose text matches and re-render. */
  removeCredit(text: string): void {
    this._credits = this._credits.filter((c) => c.text !== text);
    this._render();
  }

  /** Remove the credit display element from the DOM. */
  destroy(): void {
    this._element.remove();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private _render(): void {
    this._element.innerHTML = this._credits
      .map((c) =>
        c.link
          ? `<a href="${c.link}" target="_blank" style="color:rgba(255,255,255,0.6);text-decoration:none;">${c.text}</a>`
          : c.text,
      )
      .join(' | ');
  }
}
