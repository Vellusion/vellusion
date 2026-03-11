export interface ProviderViewModel {
  name: string;
  iconUrl?: string;
  tooltip?: string;
  category: 'imagery' | 'terrain';
}

export class BaseLayerPicker {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _dropdown: HTMLElement;
  private _providers: ProviderViewModel[];
  private _selectedImagery: ProviderViewModel | null = null;
  private _selectedTerrain: ProviderViewModel | null = null;
  private _open = false;
  private _onSelect: ((provider: ProviderViewModel) => void) | null = null;

  constructor(
    parent: HTMLElement,
    options: {
      providers: ProviderViewModel[];
      onSelect?: (provider: ProviderViewModel) => void;
    },
  ) {
    this.container = parent;
    this._providers = options.providers;
    this._onSelect = options.onSelect ?? null;

    // Set defaults
    this._selectedImagery =
      this._providers.find((p) => p.category === 'imagery') ?? null;
    this._selectedTerrain =
      this._providers.find((p) => p.category === 'terrain') ?? null;

    // Toggle button
    this._element = document.createElement('button');
    this._element.className = 'vellusion-base-layer-picker';
    this._element.title = 'Base Layer';
    this._element.textContent = '\u25F0'; // layers icon
    this._element.style.cssText =
      'width:32px;height:32px;border:none;border-radius:4px;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:16px;cursor:pointer;';
    this._element.addEventListener('click', () => this._toggle());
    parent.appendChild(this._element);

    // Dropdown
    this._dropdown = document.createElement('div');
    this._dropdown.className = 'vellusion-base-layer-dropdown';
    this._dropdown.style.cssText =
      'position:absolute;top:44px;right:8px;width:200px;background:rgba(38,38,42,0.95);border-radius:8px;padding:8px;display:none;z-index:25;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;font-size:12px;color:#e0e0e0;';
    this._renderDropdown();
    parent.appendChild(this._dropdown);
  }

  get selectedImagery(): ProviderViewModel | null {
    return this._selectedImagery;
  }
  get selectedTerrain(): ProviderViewModel | null {
    return this._selectedTerrain;
  }
  get isOpen(): boolean {
    return this._open;
  }
  get providers(): readonly ProviderViewModel[] {
    return this._providers;
  }

  private _toggle(): void {
    this._open = !this._open;
    this._dropdown.style.display = this._open ? 'block' : 'none';
  }

  private _renderDropdown(): void {
    this._dropdown.innerHTML = '';
    const imagery = this._providers.filter((p) => p.category === 'imagery');
    const terrain = this._providers.filter((p) => p.category === 'terrain');

    if (imagery.length > 0) {
      const header = document.createElement('div');
      header.textContent = 'Imagery';
      header.style.cssText = 'font-weight:600;padding:4px 8px;color:#6ec6ff;';
      this._dropdown.appendChild(header);
      for (const p of imagery) this._addProviderItem(p);
    }
    if (terrain.length > 0) {
      const header = document.createElement('div');
      header.textContent = 'Terrain';
      header.style.cssText =
        'font-weight:600;padding:4px 8px;margin-top:8px;color:#6ec6ff;';
      this._dropdown.appendChild(header);
      for (const p of terrain) this._addProviderItem(p);
    }
  }

  private _addProviderItem(provider: ProviderViewModel): void {
    const item = document.createElement('div');
    item.textContent = provider.name;
    item.title = provider.tooltip ?? provider.name;
    item.style.cssText = 'padding:6px 8px;cursor:pointer;border-radius:4px;';
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255,255,255,0.1)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
    item.addEventListener('click', () => {
      if (provider.category === 'imagery') this._selectedImagery = provider;
      else this._selectedTerrain = provider;
      this._onSelect?.(provider);
      this._toggle();
    });
    this._dropdown.appendChild(item);
  }

  destroy(): void {
    this._element.remove();
    this._dropdown.remove();
  }
}
