// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BaseLayerPicker,
  type ProviderViewModel,
} from '../src/BaseLayerPicker';
import {
  Geocoder,
  NominatimGeocoderService,
  type GeocoderResult,
  type GeocoderService,
} from '../src/Geocoder';

// ---------------------------------------------------------------------------
// BaseLayerPicker
// ---------------------------------------------------------------------------

describe('BaseLayerPicker', () => {
  let parent: HTMLDivElement;

  const testProviders: ProviderViewModel[] = [
    { name: 'Bing Aerial', category: 'imagery' },
    { name: 'OSM', category: 'imagery' },
    { name: 'Cesium World Terrain', category: 'terrain' },
  ];

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  it('stores providers', () => {
    const picker = new BaseLayerPicker(parent, { providers: testProviders });
    expect(picker.providers).toHaveLength(3);
    picker.destroy();
  });

  it('selects first imagery as default selectedImagery', () => {
    const picker = new BaseLayerPicker(parent, { providers: testProviders });
    expect(picker.selectedImagery?.name).toBe('Bing Aerial');
    picker.destroy();
  });

  it('selects first terrain as default selectedTerrain', () => {
    const picker = new BaseLayerPicker(parent, { providers: testProviders });
    expect(picker.selectedTerrain?.name).toBe('Cesium World Terrain');
    picker.destroy();
  });

  it('isOpen defaults to false', () => {
    const picker = new BaseLayerPicker(parent, { providers: testProviders });
    expect(picker.isOpen).toBe(false);
    picker.destroy();
  });

  it('clicking toggle button opens dropdown', () => {
    const picker = new BaseLayerPicker(parent, { providers: testProviders });
    parent.querySelector('button')!.click();
    expect(picker.isOpen).toBe(true);
    picker.destroy();
  });

  it('clicking toggle button twice closes dropdown', () => {
    const picker = new BaseLayerPicker(parent, { providers: testProviders });
    parent.querySelector('button')!.click();
    parent.querySelector('button')!.click();
    expect(picker.isOpen).toBe(false);
    picker.destroy();
  });

  it('handles empty providers gracefully', () => {
    const picker = new BaseLayerPicker(parent, { providers: [] });
    expect(picker.selectedImagery).toBeNull();
    expect(picker.selectedTerrain).toBeNull();
    picker.destroy();
  });

  it('destroy() removes both elements', () => {
    const picker = new BaseLayerPicker(parent, { providers: testProviders });
    picker.destroy();
    expect(parent.querySelector('.vellusion-base-layer-picker')).toBeNull();
    expect(parent.querySelector('.vellusion-base-layer-dropdown')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Geocoder
// ---------------------------------------------------------------------------

describe('Geocoder', () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  it('results defaults to empty', () => {
    const geocoder = new Geocoder(parent);
    expect(geocoder.results).toHaveLength(0);
    geocoder.destroy();
  });

  it('search returns results from services', async () => {
    const mockResults: GeocoderResult[] = [
      { displayName: 'New York', longitude: -74.006, latitude: 40.7128 },
      { displayName: 'New Orleans', longitude: -90.071, latitude: 29.9511 },
    ];
    const mockService: GeocoderService = {
      geocode: vi.fn().mockResolvedValue(mockResults),
    };
    const geocoder = new Geocoder(parent, { services: [mockService] });
    const results = await geocoder.search('New');
    expect(results).toHaveLength(2);
    expect(results[0].displayName).toBe('New York');
    expect(mockService.geocode).toHaveBeenCalledWith('New');
    geocoder.destroy();
  });

  it('search aggregates results from multiple services', async () => {
    const service1: GeocoderService = {
      geocode: vi.fn().mockResolvedValue([
        { displayName: 'London, UK', longitude: -0.1276, latitude: 51.5074 },
      ]),
    };
    const service2: GeocoderService = {
      geocode: vi.fn().mockResolvedValue([
        {
          displayName: 'London, Ontario',
          longitude: -81.2497,
          latitude: 42.9849,
        },
      ]),
    };
    const geocoder = new Geocoder(parent, { services: [service1, service2] });
    const results = await geocoder.search('London');
    expect(results).toHaveLength(2);
    geocoder.destroy();
  });

  it('NominatimGeocoderService.geocode returns empty array', async () => {
    const service = new NominatimGeocoderService();
    const results = await service.geocode('test');
    expect(results).toEqual([]);
  });

  it('destroy() removes the element', () => {
    const geocoder = new Geocoder(parent);
    geocoder.destroy();
    expect(parent.querySelector('.vellusion-geocoder')).toBeNull();
  });
});
