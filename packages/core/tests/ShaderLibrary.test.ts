import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShaderLibrary } from '../src/ShaderLibrary';

// ---------------------------------------------------------------------------
// Mock GPUDevice
// ---------------------------------------------------------------------------

function createMockDevice() {
  let moduleCounter = 0;
  return {
    createShaderModule: vi.fn().mockImplementation(({ code }: { code: string }) => ({
      __id: ++moduleCounter,
      __code: code,
    })),
  } as unknown as GPUDevice;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ShaderLibrary', () => {
  let device: GPUDevice;
  let library: ShaderLibrary;

  beforeEach(() => {
    device = createMockDevice();
    library = new ShaderLibrary(device);
  });

  it('should return a GPUShaderModule for new source', () => {
    const mod = library.get('fn main() {}');
    expect(mod).toBeDefined();
    expect(device.createShaderModule).toHaveBeenCalledOnce();
  });

  it('should return cached module for the same source', () => {
    const src = 'fn main() {}';
    const mod1 = library.get(src);
    const mod2 = library.get(src);
    expect(mod1).toBe(mod2);
    expect(device.createShaderModule).toHaveBeenCalledOnce();
  });

  it('should create separate modules for different sources', () => {
    const mod1 = library.get('fn a() {}');
    const mod2 = library.get('fn b() {}');
    expect(mod1).not.toBe(mod2);
    expect(device.createShaderModule).toHaveBeenCalledTimes(2);
  });

  it('should apply defines before caching', () => {
    const src = [
      '// #if FEATURE',
      'featureLine',
      '// #endif',
    ].join('\n');

    const modWithFeature = library.get(src, { FEATURE: true });
    const modWithoutFeature = library.get(src, { FEATURE: false });

    // Different processed source -> different modules
    expect(modWithFeature).not.toBe(modWithoutFeature);
    expect(device.createShaderModule).toHaveBeenCalledTimes(2);

    // First call should contain the feature line
    const firstCall = (device.createShaderModule as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(firstCall.code).toContain('featureLine');

    // Second call should not
    const secondCall = (device.createShaderModule as ReturnType<typeof vi.fn>).mock.calls[1][0];
    expect(secondCall.code).not.toContain('featureLine');
  });

  it('should cache based on processed source, not raw source + defines', () => {
    // Two different raw sources that produce the same processed output
    const src1 = 'fn main() {}';
    const src2 = [
      '// #if ALWAYS',
      'fn main() {}',
      '// #endif',
    ].join('\n');

    const mod1 = library.get(src1);
    const mod2 = library.get(src2, { ALWAYS: true });

    // Same processed source -> same cached module
    expect(mod1).toBe(mod2);
    expect(device.createShaderModule).toHaveBeenCalledOnce();
  });

  it('clear() should empty the cache so modules are re-created', () => {
    const src = 'fn main() {}';
    const mod1 = library.get(src);

    library.clear();

    const mod2 = library.get(src);
    expect(mod2).not.toBe(mod1);
    expect(device.createShaderModule).toHaveBeenCalledTimes(2);
  });
});
