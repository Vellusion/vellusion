import { describe, it, expect } from 'vitest';
import { Material } from '../src/Material';

const ALL_BUILT_IN_TYPES = [
  'Color',
  'Image',
  'Grid',
  'Stripe',
  'Checkerboard',
  'Dot',
  'Water',
  'PolylineArrow',
  'PolylineDash',
  'PolylineGlow',
  'PolylineOutline',
];

describe('Material', () => {
  it('Material.fromType("Color") has shaderSource and uniforms', () => {
    const mat = Material.fromType('Color');
    expect(mat.type).toBe('Color');
    expect(mat.shaderSource).toBeTruthy();
    expect(mat.shaderSource).toContain('materialColor');
    expect(mat.uniforms).toBeDefined();
    expect(mat.uniforms.color).toEqual([1.0, 1.0, 1.0, 1.0]);
  });

  it('Material.fromType("Color", { color }) overrides default uniform', () => {
    const red = [1, 0, 0, 1];
    const mat = Material.fromType('Color', { color: red });
    expect(mat.uniforms.color).toEqual(red);
  });

  describe('built-in material types have non-empty shaderSource', () => {
    for (const type of ALL_BUILT_IN_TYPES) {
      it(`Material.fromType("${type}") has non-empty shaderSource`, () => {
        const mat = Material.fromType(type);
        expect(mat.shaderSource.length).toBeGreaterThan(0);
        expect(mat.shaderSource).toContain('materialColor');
      });
    }
  });

  it('Material with custom source uses provided WGSL', () => {
    const customWGSL = `
fn materialColor(uv: vec2f) -> vec4f {
  return vec4f(1.0, 0.0, 1.0, 1.0);
}`;
    const mat = new Material({ type: 'Custom', source: customWGSL });
    expect(mat.type).toBe('Custom');
    expect(mat.shaderSource).toBe(customWGSL);
  });

  it('Material uniforms merged with defaults', () => {
    const mat = Material.fromType('Grid', { lineCount: 16 });
    // user override applied
    expect(mat.uniforms.lineCount).toBe(16);
    // defaults preserved
    expect(mat.uniforms.color).toEqual([1.0, 1.0, 1.0, 1.0]);
    expect(mat.uniforms.cellAlpha).toBe(0.1);
    expect(mat.uniforms.lineThickness).toBe(0.01);
  });

  it('unknown type returns empty shader source', () => {
    const mat = Material.fromType('NonExistent');
    expect(mat.shaderSource).toBe('');
    expect(mat.type).toBe('NonExistent');
  });

  it('all 11 material types are registered', () => {
    const registeredCount = ALL_BUILT_IN_TYPES.filter((type) => {
      const mat = Material.fromType(type);
      return mat.shaderSource.length > 0;
    }).length;
    expect(registeredCount).toBe(11);
  });
});
