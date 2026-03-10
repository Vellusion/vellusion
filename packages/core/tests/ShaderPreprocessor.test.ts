import { describe, it, expect } from 'vitest';
import { ShaderPreprocessor } from '../src/ShaderPreprocessor';

describe('ShaderPreprocessor', () => {
  // -----------------------------------------------------------------------
  // No-op / passthrough
  // -----------------------------------------------------------------------

  it('should return source unchanged when no defines are given', () => {
    const src = '@vertex fn main() -> @builtin(position) vec4f { return vec4f(0); }';
    expect(ShaderPreprocessor.process(src)).toBe(src);
  });

  it('should return source unchanged when defines map is empty', () => {
    const src = 'fn foo() {}';
    expect(ShaderPreprocessor.process(src, {})).toBe(src);
  });

  // -----------------------------------------------------------------------
  // Define injection
  // -----------------------------------------------------------------------

  it('should inject numeric defines as const declarations', () => {
    const src = 'fn main() {}';
    const result = ShaderPreprocessor.process(src, { MAX_LIGHTS: 8 });
    expect(result).toContain('const MAX_LIGHTS = 8;');
    expect(result).toContain('fn main() {}');
  });

  it('should inject string defines as const declarations', () => {
    const src = 'fn main() {}';
    const result = ShaderPreprocessor.process(src, { COLOR: 'vec3f(1.0, 0.0, 0.0)' });
    expect(result).toContain('const COLOR = vec3f(1.0, 0.0, 0.0);');
  });

  it('should not inject boolean defines as const declarations', () => {
    const src = 'fn main() {}';
    const result = ShaderPreprocessor.process(src, { FEATURE: true });
    expect(result).not.toContain('const FEATURE');
  });

  it('should process multiple defines', () => {
    const src = 'fn main() {}';
    const result = ShaderPreprocessor.process(src, {
      MAX_LIGHTS: 4,
      TILE_SIZE: 16,
    });
    expect(result).toContain('const MAX_LIGHTS = 4;');
    expect(result).toContain('const TILE_SIZE = 16;');
  });

  // -----------------------------------------------------------------------
  // Conditionals — #if / #else / #endif
  // -----------------------------------------------------------------------

  it('should include #if block when define is truthy (boolean true)', () => {
    const src = [
      'line1',
      '// #if FEATURE',
      'featureLine',
      '// #endif',
      'line2',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { FEATURE: true });
    expect(result).toContain('featureLine');
    expect(result).toContain('line1');
    expect(result).toContain('line2');
  });

  it('should exclude #if block when define is falsy (boolean false)', () => {
    const src = [
      'line1',
      '// #if FEATURE',
      'featureLine',
      '// #endif',
      'line2',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { FEATURE: false });
    expect(result).not.toContain('featureLine');
    expect(result).toContain('line1');
    expect(result).toContain('line2');
  });

  it('should exclude #if block when define is missing', () => {
    const src = [
      'line1',
      '// #if FEATURE',
      'featureLine',
      '// #endif',
      'line2',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { OTHER: true });
    expect(result).not.toContain('featureLine');
  });

  it('should include #else block when define is falsy', () => {
    const src = [
      '// #if FEATURE',
      'trueBranch',
      '// #else',
      'falseBranch',
      '// #endif',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { FEATURE: false });
    expect(result).not.toContain('trueBranch');
    expect(result).toContain('falseBranch');
  });

  it('should include #if block and exclude #else block when define is truthy', () => {
    const src = [
      '// #if FEATURE',
      'trueBranch',
      '// #else',
      'falseBranch',
      '// #endif',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { FEATURE: true });
    expect(result).toContain('trueBranch');
    expect(result).not.toContain('falseBranch');
  });

  it('should treat non-zero number as truthy in conditionals', () => {
    const src = [
      '// #if COUNT',
      'hasCount',
      '// #endif',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { COUNT: 5 });
    expect(result).toContain('hasCount');
  });

  it('should treat zero as falsy in conditionals', () => {
    const src = [
      '// #if COUNT',
      'hasCount',
      '// #endif',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { COUNT: 0 });
    expect(result).not.toContain('hasCount');
  });

  it('should treat non-empty string as truthy in conditionals', () => {
    const src = [
      '// #if MODE',
      'hasMode',
      '// #endif',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { MODE: 'pbr' });
    expect(result).toContain('hasMode');
  });

  it('should treat empty string as falsy in conditionals', () => {
    const src = [
      '// #if MODE',
      'hasMode',
      '// #endif',
    ].join('\n');

    const result = ShaderPreprocessor.process(src, { MODE: '' });
    expect(result).not.toContain('hasMode');
  });

  // -----------------------------------------------------------------------
  // Nested conditionals
  // -----------------------------------------------------------------------

  it('should handle nested #if / #endif correctly', () => {
    const src = [
      '// #if A',
      'aBlock',
      '// #if B',
      'abBlock',
      '// #endif',
      'afterB',
      '// #endif',
    ].join('\n');

    // Both truthy
    const r1 = ShaderPreprocessor.process(src, { A: true, B: true });
    expect(r1).toContain('aBlock');
    expect(r1).toContain('abBlock');
    expect(r1).toContain('afterB');

    // A true, B false
    const r2 = ShaderPreprocessor.process(src, { A: true, B: false });
    expect(r2).toContain('aBlock');
    expect(r2).not.toContain('abBlock');
    expect(r2).toContain('afterB');

    // A false — entire block skipped
    const r3 = ShaderPreprocessor.process(src, { A: false, B: true });
    expect(r3).not.toContain('aBlock');
    expect(r3).not.toContain('abBlock');
    expect(r3).not.toContain('afterB');
  });

  it('should handle nested #if with #else correctly', () => {
    const src = [
      '// #if A',
      '// #if B',
      'AB',
      '// #else',
      'A_notB',
      '// #endif',
      '// #else',
      'notA',
      '// #endif',
    ].join('\n');

    const r1 = ShaderPreprocessor.process(src, { A: true, B: true });
    expect(r1).toContain('AB');
    expect(r1).not.toContain('A_notB');
    expect(r1).not.toContain('notA');

    const r2 = ShaderPreprocessor.process(src, { A: true, B: false });
    expect(r2).not.toContain('AB');
    expect(r2).toContain('A_notB');
    expect(r2).not.toContain('notA');

    const r3 = ShaderPreprocessor.process(src, { A: false, B: true });
    expect(r3).not.toContain('AB');
    expect(r3).not.toContain('A_notB');
    expect(r3).toContain('notA');
  });

  // -----------------------------------------------------------------------
  // Includes
  // -----------------------------------------------------------------------

  it('should replace // #include with content from includes map', () => {
    const src = [
      '// #include "common.wgsl"',
      'fn main() {}',
    ].join('\n');

    const includes = { 'common.wgsl': 'struct Uniforms { mvp: mat4x4f }' };
    const result = ShaderPreprocessor.processWithIncludes(src, includes);
    expect(result).toContain('struct Uniforms { mvp: mat4x4f }');
    expect(result).toContain('fn main() {}');
    expect(result).not.toContain('#include');
  });

  it('should handle multiple includes', () => {
    const src = [
      '// #include "a.wgsl"',
      '// #include "b.wgsl"',
      'fn main() {}',
    ].join('\n');

    const includes = {
      'a.wgsl': 'const A = 1;',
      'b.wgsl': 'const B = 2;',
    };
    const result = ShaderPreprocessor.processWithIncludes(src, includes);
    expect(result).toContain('const A = 1;');
    expect(result).toContain('const B = 2;');
  });

  it('should throw when an include is missing', () => {
    const src = '// #include "missing.wgsl"';
    expect(() => ShaderPreprocessor.processWithIncludes(src, {})).toThrow(
      'missing include "missing.wgsl"',
    );
  });

  // -----------------------------------------------------------------------
  // Combined: includes + defines + conditionals
  // -----------------------------------------------------------------------

  it('should process includes before defines and conditionals', () => {
    const src = [
      '// #include "header.wgsl"',
      '// #if USE_LIGHTING',
      'fn lighting() {}',
      '// #endif',
    ].join('\n');

    const includes = { 'header.wgsl': 'struct Vertex { pos: vec3f }' };
    const result = ShaderPreprocessor.processWithIncludes(
      src,
      includes,
      { USE_LIGHTING: true },
    );
    expect(result).toContain('struct Vertex { pos: vec3f }');
    expect(result).toContain('fn lighting() {}');
  });
});
