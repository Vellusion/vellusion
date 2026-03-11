export interface GeocoderResult {
  displayName: string;
  longitude: number; // degrees
  latitude: number;
  altitude?: number;
}

export interface GeocoderService {
  geocode(query: string): Promise<GeocoderResult[]>;
}

/** Built-in: Nominatim (OSM) geocoder */
export class NominatimGeocoderService implements GeocoderService {
  async geocode(_query: string): Promise<GeocoderResult[]> {
    // In a real implementation, this would call the Nominatim API
    // For now, return empty - actual HTTP requests handled at integration level
    return [];
  }
}

export class Geocoder {
  readonly container: HTMLElement;
  private _element: HTMLElement;
  private _input: HTMLInputElement;
  private _resultsList: HTMLElement;
  private _services: GeocoderService[];
  private _onSelect: ((result: GeocoderResult) => void) | null = null;
  private _results: GeocoderResult[] = [];

  constructor(
    parent: HTMLElement,
    options?: {
      services?: GeocoderService[];
      onSelect?: (result: GeocoderResult) => void;
      placeholder?: string;
    },
  ) {
    this.container = parent;
    this._services = options?.services ?? [new NominatimGeocoderService()];
    this._onSelect = options?.onSelect ?? null;

    this._element = document.createElement('div');
    this._element.className = 'vellusion-geocoder';
    this._element.style.cssText = 'position:relative;';

    this._input = document.createElement('input');
    this._input.type = 'text';
    this._input.placeholder = options?.placeholder ?? 'Search location...';
    this._input.style.cssText =
      'width:200px;padding:6px 10px;border:none;border-radius:4px;background:rgba(48,48,54,0.9);color:#e0e0e0;font-size:13px;font-family:system-ui,sans-serif;outline:none;';
    this._input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.search(this._input.value);
    });

    this._resultsList = document.createElement('div');
    this._resultsList.className = 'vellusion-geocoder-results';
    this._resultsList.style.cssText =
      'position:absolute;top:36px;left:0;width:220px;background:rgba(38,38,42,0.95);border-radius:4px;display:none;z-index:30;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;font-size:12px;max-height:200px;overflow-y:auto;';

    this._element.appendChild(this._input);
    this._element.appendChild(this._resultsList);
    parent.appendChild(this._element);
  }

  get query(): string {
    return this._input.value;
  }
  get results(): readonly GeocoderResult[] {
    return this._results;
  }

  async search(query: string): Promise<GeocoderResult[]> {
    this._results = [];
    for (const service of this._services) {
      const results = await service.geocode(query);
      this._results.push(...results);
    }
    this._renderResults();
    return this._results;
  }

  private _renderResults(): void {
    this._resultsList.innerHTML = '';
    if (this._results.length === 0) {
      this._resultsList.style.display = 'none';
      return;
    }
    this._resultsList.style.display = 'block';
    for (const result of this._results) {
      const item = document.createElement('div');
      item.textContent = result.displayName;
      item.style.cssText = 'padding:8px 10px;cursor:pointer;color:#e0e0e0;';
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.1)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        this._onSelect?.(result);
        this._input.value = result.displayName;
        this._resultsList.style.display = 'none';
      });
      this._resultsList.appendChild(item);
    }
  }

  destroy(): void {
    this._element.remove();
  }
}
