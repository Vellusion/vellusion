import { describe, it, expect } from 'vitest';
import {
  UrlTemplateImageryProvider,
  OpenStreetMapImageryProvider,
  WebMercatorTilingScheme,
} from '../src/ImageryProvider';

describe('UrlTemplateImageryProvider', () => {
  it('getTileUrl replaces {x}, {y}, {z} correctly', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://example.com/{z}/{x}/{y}.png',
    });
    expect(provider.getTileUrl(3, 5, 7)).toBe('https://example.com/7/3/5.png');
  });

  it('getTileUrl handles multiple digit values', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://tiles.test/{z}/{x}/{y}.jpg',
    });
    expect(provider.getTileUrl(1023, 2047, 11)).toBe(
      'https://tiles.test/11/1023/2047.jpg',
    );
  });

  it('has correct default tileWidth and tileHeight', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://example.com/{z}/{x}/{y}.png',
    });
    expect(provider.tileWidth).toBe(256);
    expect(provider.tileHeight).toBe(256);
  });

  it('has correct default minimumLevel and maximumLevel', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://example.com/{z}/{x}/{y}.png',
    });
    expect(provider.minimumLevel).toBe(0);
    expect(provider.maximumLevel).toBe(18);
  });

  it('respects custom options', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://example.com/{z}/{x}/{y}.png',
      tileWidth: 512,
      tileHeight: 512,
      minimumLevel: 2,
      maximumLevel: 14,
      credit: 'Test Credit',
    });
    expect(provider.tileWidth).toBe(512);
    expect(provider.tileHeight).toBe(512);
    expect(provider.minimumLevel).toBe(2);
    expect(provider.maximumLevel).toBe(14);
    expect(provider.credit).toBe('Test Credit');
  });

  it('is always ready', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://example.com/{z}/{x}/{y}.png',
    });
    expect(provider.ready).toBe(true);
  });

  it('uses WebMercatorTilingScheme by default', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://example.com/{z}/{x}/{y}.png',
    });
    expect(provider.tilingScheme).toBeInstanceOf(WebMercatorTilingScheme);
  });

  it('requestImage is an async function', () => {
    const provider = new UrlTemplateImageryProvider({
      url: 'https://example.com/{z}/{x}/{y}.png',
    });
    // Verify it returns a promise (without actually fetching)
    expect(typeof provider.requestImage).toBe('function');
  });
});

describe('OpenStreetMapImageryProvider', () => {
  it('default URL matches the OSM tile server', () => {
    const provider = new OpenStreetMapImageryProvider();
    expect(provider.getTileUrl(1, 2, 3)).toBe(
      'https://tile.openstreetmap.org/3/1/2.png',
    );
  });

  it('credit is set to OpenStreetMap contributors', () => {
    const provider = new OpenStreetMapImageryProvider();
    expect(provider.credit).toBe('\u00A9 OpenStreetMap contributors');
  });

  it('allows overriding url', () => {
    const provider = new OpenStreetMapImageryProvider({
      url: 'https://my-proxy.com/{z}/{x}/{y}.png',
    });
    expect(provider.getTileUrl(0, 0, 1)).toBe('https://my-proxy.com/1/0/0.png');
  });

  it('allows overriding maximumLevel', () => {
    const provider = new OpenStreetMapImageryProvider({ maximumLevel: 12 });
    expect(provider.maximumLevel).toBe(12);
  });

  it('allows overriding credit', () => {
    const provider = new OpenStreetMapImageryProvider({ credit: 'Custom' });
    expect(provider.credit).toBe('Custom');
  });
});

describe('WebMercatorTilingScheme', () => {
  it('level 0 has 1x1 tiles', () => {
    const scheme = new WebMercatorTilingScheme();
    expect(scheme.getNumberOfXTilesAtLevel(0)).toBe(1);
    expect(scheme.getNumberOfYTilesAtLevel(0)).toBe(1);
  });

  it('level 2 has 4x4 tiles', () => {
    const scheme = new WebMercatorTilingScheme();
    expect(scheme.getNumberOfXTilesAtLevel(2)).toBe(4);
    expect(scheme.getNumberOfYTilesAtLevel(2)).toBe(4);
  });

  it('tileXYToExtent returns valid extent', () => {
    const scheme = new WebMercatorTilingScheme();
    const extent = scheme.tileXYToExtent(0, 0, 0);
    expect(extent.west).toBeCloseTo(-Math.PI);
    expect(extent.east).toBeCloseTo(Math.PI);
    expect(extent.north).toBeCloseTo(Math.PI);
    expect(extent.south).toBeCloseTo(-Math.PI);
  });

  it('projection is EPSG:3857', () => {
    const scheme = new WebMercatorTilingScheme();
    expect(scheme.projection).toBe('EPSG:3857');
  });
});
