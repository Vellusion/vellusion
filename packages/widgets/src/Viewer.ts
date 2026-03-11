/**
 * @vellusion/widgets - Viewer
 *
 * Full-featured entry point that wraps a {@link Widget} and adds a toolbar,
 * {@link InfoBox}, {@link SelectionIndicator}, and {@link CreditDisplay}.
 *
 * Individual components can be disabled via the {@link ViewerOptions}.
 */

import { Widget } from './Widget';
import { InfoBox } from './InfoBox';
import { SelectionIndicator } from './SelectionIndicator';
import { CreditDisplay } from './CreditDisplay';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ViewerOptions {
  /** The DOM element or element-id that will host the viewer. */
  container: HTMLElement | string;

  /** Show the info-box panel (default `true`). */
  infoBox?: boolean;
  /** Show the selection indicator (default `true`). */
  selectionIndicator?: boolean;
  /** Show the credit display bar (default `true`). */
  creditDisplay?: boolean;

  // Placeholders for future toolbar widgets — reserved for API stability.
  homeButton?: boolean;
  sceneModePicker?: boolean;
  navigationHelp?: boolean;
  timeline?: boolean;
  animation?: boolean;
  fullscreenButton?: boolean;
  baseLayerPicker?: boolean;
  geocoder?: boolean;
  performanceDisplay?: boolean;
}

// ---------------------------------------------------------------------------
// Viewer
// ---------------------------------------------------------------------------

export class Viewer {
  readonly container: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly infoBox: InfoBox | undefined;
  readonly selectionIndicator: SelectionIndicator | undefined;
  readonly creditDisplay: CreditDisplay | undefined;

  private _widget: Widget;
  private _destroyed = false;
  private _toolbar: HTMLElement;

  constructor(options: ViewerOptions) {
    const containerEl =
      typeof options.container === 'string'
        ? document.getElementById(options.container)!
        : options.container;

    this._widget = new Widget(containerEl);
    this.container = this._widget.container;
    this.canvas = this._widget.canvas;

    // Toolbar container (buttons will be added by future widget sub-classes)
    this._toolbar = document.createElement('div');
    this._toolbar.className = 'vellusion-toolbar';
    this._toolbar.style.cssText =
      'position:absolute;top:8px;right:8px;display:flex;gap:4px;z-index:10;';
    this.container.appendChild(this._toolbar);

    // Optional info components — enabled by default
    if (options.infoBox !== false) {
      this.infoBox = new InfoBox(this.container);
    }
    if (options.selectionIndicator !== false) {
      this.selectionIndicator = new SelectionIndicator(this.container);
    }
    if (options.creditDisplay !== false) {
      this.creditDisplay = new CreditDisplay(this.container);
    }
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** Whether {@link destroy} has been called. */
  get isDestroyed(): boolean {
    return this._destroyed;
  }

  /** The toolbar element where button widgets are appended. */
  get toolbar(): HTMLElement {
    return this._toolbar;
  }

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /**
   * Resize the backing canvas to match the container's current CSS size.
   * Delegates to the underlying {@link Widget}.
   */
  resize(): void {
    this._widget.resize();
  }

  /** Tear down the viewer and all its sub-components. */
  destroy(): void {
    this._destroyed = true;
    this.infoBox?.destroy();
    this.selectionIndicator?.destroy();
    this.creditDisplay?.destroy();
    this._toolbar.remove();
    this._widget.destroy();
  }
}
