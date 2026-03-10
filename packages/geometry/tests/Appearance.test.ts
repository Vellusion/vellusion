import { describe, it, expect } from 'vitest';
import {
  MaterialAppearance,
  PerInstanceColorAppearance,
  EllipsoidSurfaceAppearance,
  PolylineColorAppearance,
  PolylineMaterialAppearance,
} from '../src/Appearance';
import type { Appearance, RenderState } from '../src/Appearance';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasValidRenderState(a: Appearance): boolean {
  const rs = a.renderState;
  return rs !== undefined && rs !== null && typeof rs === 'object';
}

function hasShaderSources(a: Appearance): boolean {
  return (
    typeof a.vertexShaderSource === 'string' &&
    a.vertexShaderSource.length > 0 &&
    typeof a.fragmentShaderSource === 'string' &&
    a.fragmentShaderSource.length > 0
  );
}

// ---------------------------------------------------------------------------
// MaterialAppearance
// ---------------------------------------------------------------------------

describe('MaterialAppearance', () => {
  it('has default shader sources', () => {
    const a = new MaterialAppearance();
    expect(hasShaderSources(a)).toBe(true);
  });

  it('custom options are applied', () => {
    const vs = '/* custom vertex */';
    const fs = '/* custom fragment */';
    const rs: RenderState = { depthTest: false, blending: true };

    const a = new MaterialAppearance({
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      renderState: rs,
      closed: true,
      flat: true,
    });

    expect(a.vertexShaderSource).toBe(vs);
    expect(a.fragmentShaderSource).toBe(fs);
    expect(a.renderState).toBe(rs);
    expect(a.closed).toBe(true);
    expect(a.flat).toBe(true);
  });

  it('defaults closed=false and flat=false', () => {
    const a = new MaterialAppearance();
    expect(a.closed).toBe(false);
    expect(a.flat).toBe(false);
  });

  it('has valid renderState', () => {
    const a = new MaterialAppearance();
    expect(hasValidRenderState(a)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PerInstanceColorAppearance
// ---------------------------------------------------------------------------

describe('PerInstanceColorAppearance', () => {
  it('has shader sources', () => {
    const a = new PerInstanceColorAppearance();
    expect(hasShaderSources(a)).toBe(true);
  });

  it('closed and flat options', () => {
    const a = new PerInstanceColorAppearance({ closed: true, flat: true });
    expect(a.closed).toBe(true);
    expect(a.flat).toBe(true);
  });

  it('defaults closed=false and flat=false', () => {
    const a = new PerInstanceColorAppearance();
    expect(a.closed).toBe(false);
    expect(a.flat).toBe(false);
  });

  it('accepts custom renderState', () => {
    const rs: RenderState = { depthTest: false };
    const a = new PerInstanceColorAppearance({ renderState: rs });
    expect(a.renderState).toBe(rs);
  });

  it('has valid renderState', () => {
    const a = new PerInstanceColorAppearance();
    expect(hasValidRenderState(a)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EllipsoidSurfaceAppearance
// ---------------------------------------------------------------------------

describe('EllipsoidSurfaceAppearance', () => {
  it('flat=true by default', () => {
    const a = new EllipsoidSurfaceAppearance();
    expect(a.flat).toBe(true);
  });

  it('closed=false by default', () => {
    const a = new EllipsoidSurfaceAppearance();
    expect(a.closed).toBe(false);
  });

  it('has shader sources', () => {
    const a = new EllipsoidSurfaceAppearance();
    expect(hasShaderSources(a)).toBe(true);
  });

  it('accepts custom renderState', () => {
    const rs: RenderState = { cullFace: 'none' };
    const a = new EllipsoidSurfaceAppearance({ renderState: rs });
    expect(a.renderState).toBe(rs);
  });

  it('has valid renderState', () => {
    const a = new EllipsoidSurfaceAppearance();
    expect(hasValidRenderState(a)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PolylineColorAppearance
// ---------------------------------------------------------------------------

describe('PolylineColorAppearance', () => {
  it('has shader sources', () => {
    const a = new PolylineColorAppearance();
    expect(hasShaderSources(a)).toBe(true);
  });

  it('flat=true and closed=false', () => {
    const a = new PolylineColorAppearance();
    expect(a.flat).toBe(true);
    expect(a.closed).toBe(false);
  });

  it('has valid renderState', () => {
    const a = new PolylineColorAppearance();
    expect(hasValidRenderState(a)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PolylineMaterialAppearance
// ---------------------------------------------------------------------------

describe('PolylineMaterialAppearance', () => {
  it('has shader sources', () => {
    const a = new PolylineMaterialAppearance();
    expect(hasShaderSources(a)).toBe(true);
  });

  it('flat=true and closed=false', () => {
    const a = new PolylineMaterialAppearance();
    expect(a.flat).toBe(true);
    expect(a.closed).toBe(false);
  });

  it('has valid renderState', () => {
    const a = new PolylineMaterialAppearance();
    expect(hasValidRenderState(a)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// All appearances satisfy the Appearance interface
// ---------------------------------------------------------------------------

describe('All appearances', () => {
  const appearances: Appearance[] = [
    new MaterialAppearance(),
    new PerInstanceColorAppearance(),
    new EllipsoidSurfaceAppearance(),
    new PolylineColorAppearance(),
    new PolylineMaterialAppearance(),
  ];

  it.each(appearances.map((a, i) => [a.constructor.name, a]))(
    '%s has valid renderState',
    (_name, appearance) => {
      expect(hasValidRenderState(appearance as Appearance)).toBe(true);
      expect(hasShaderSources(appearance as Appearance)).toBe(true);
    },
  );
});
