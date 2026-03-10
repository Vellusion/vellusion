import { describe, it, expect } from 'vitest';
import { ImageryLayer } from '../src/ImageryLayer';
import { ImageryLayerCollection } from '../src/ImageryLayerCollection';
import {
  UrlTemplateImageryProvider,
  OpenStreetMapImageryProvider,
} from '../src/ImageryProvider';

// Helpers ---------------------------------------------------------------

function makeLayer(tag = ''): ImageryLayer {
  return new ImageryLayer(
    new UrlTemplateImageryProvider({
      url: `https://example.com/${tag}/{z}/{x}/{y}.png`,
    }),
  );
}

// ImageryLayer ----------------------------------------------------------

describe('ImageryLayer', () => {
  it('constructor stores the provider', () => {
    const provider = new OpenStreetMapImageryProvider();
    const layer = new ImageryLayer(provider);
    expect(layer.provider).toBe(provider);
  });

  it('defaults: show=true, alpha=1, brightness=1, contrast=1, saturation=1, gamma=1', () => {
    const layer = makeLayer();
    expect(layer.show).toBe(true);
    expect(layer.alpha).toBe(1.0);
    expect(layer.brightness).toBe(1.0);
    expect(layer.contrast).toBe(1.0);
    expect(layer.saturation).toBe(1.0);
    expect(layer.gamma).toBe(1.0);
  });

  it('custom options are applied', () => {
    const layer = new ImageryLayer(new OpenStreetMapImageryProvider(), {
      show: false,
      alpha: 0.5,
      brightness: 1.2,
      contrast: 0.8,
      saturation: 0.6,
      gamma: 2.2,
    });
    expect(layer.show).toBe(false);
    expect(layer.alpha).toBe(0.5);
    expect(layer.brightness).toBe(1.2);
    expect(layer.contrast).toBe(0.8);
    expect(layer.saturation).toBe(0.6);
    expect(layer.gamma).toBe(2.2);
  });
});

// ImageryLayerCollection ------------------------------------------------

describe('ImageryLayerCollection', () => {
  it('starts empty', () => {
    const col = new ImageryLayerCollection();
    expect(col.length).toBe(0);
  });

  it('add / get / length', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    col.add(a);
    col.add(b);
    expect(col.length).toBe(2);
    expect(col.get(0)).toBe(a);
    expect(col.get(1)).toBe(b);
  });

  it('add at specific index', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    const c = makeLayer('c');
    col.add(a);
    col.add(c);
    col.add(b, 1); // insert between a and c
    expect(col.get(0)).toBe(a);
    expect(col.get(1)).toBe(b);
    expect(col.get(2)).toBe(c);
  });

  it('remove returns true and removes the layer', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    col.add(a);
    expect(col.remove(a)).toBe(true);
    expect(col.length).toBe(0);
  });

  it('remove returns false for a layer not in the collection', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    expect(col.remove(a)).toBe(false);
  });

  it('indexOf returns correct index', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    col.add(a);
    col.add(b);
    expect(col.indexOf(a)).toBe(0);
    expect(col.indexOf(b)).toBe(1);
  });

  it('indexOf returns -1 for missing layer', () => {
    const col = new ImageryLayerCollection();
    expect(col.indexOf(makeLayer())).toBe(-1);
  });

  it('raise moves layer one position towards front', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    const c = makeLayer('c');
    col.add(a);
    col.add(b);
    col.add(c);
    col.raise(c); // c was at 2, now at 1
    expect(col.get(0)).toBe(a);
    expect(col.get(1)).toBe(c);
    expect(col.get(2)).toBe(b);
  });

  it('raise on first layer is a no-op', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    col.add(a);
    col.add(b);
    col.raise(a);
    expect(col.get(0)).toBe(a);
    expect(col.get(1)).toBe(b);
  });

  it('lower moves layer one position towards back', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    const c = makeLayer('c');
    col.add(a);
    col.add(b);
    col.add(c);
    col.lower(a); // a was at 0, now at 1
    expect(col.get(0)).toBe(b);
    expect(col.get(1)).toBe(a);
    expect(col.get(2)).toBe(c);
  });

  it('lower on last layer is a no-op', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    col.add(a);
    col.add(b);
    col.lower(b);
    expect(col.get(0)).toBe(a);
    expect(col.get(1)).toBe(b);
  });

  it('raiseToTop moves layer to index 0', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    const c = makeLayer('c');
    col.add(a);
    col.add(b);
    col.add(c);
    col.raiseToTop(c); // c was at 2, now at 0
    expect(col.get(0)).toBe(c);
    expect(col.get(1)).toBe(a);
    expect(col.get(2)).toBe(b);
  });

  it('lowerToBottom moves layer to last index', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    const c = makeLayer('c');
    col.add(a);
    col.add(b);
    col.add(c);
    col.lowerToBottom(a); // a was at 0, now at 2
    expect(col.get(0)).toBe(b);
    expect(col.get(1)).toBe(c);
    expect(col.get(2)).toBe(a);
  });

  it('is iterable with for-of', () => {
    const col = new ImageryLayerCollection();
    const a = makeLayer('a');
    const b = makeLayer('b');
    col.add(a);
    col.add(b);
    const collected: ImageryLayer[] = [];
    for (const layer of col) {
      collected.push(layer);
    }
    expect(collected).toEqual([a, b]);
  });
});
