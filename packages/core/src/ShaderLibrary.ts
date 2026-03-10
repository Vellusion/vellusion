import { ShaderPreprocessor } from './ShaderPreprocessor';
import type { ShaderDefines } from './ShaderPreprocessor';

/**
 * Caching layer for compiled `GPUShaderModule` instances.
 *
 * The cache key is the **processed** source string (after preprocessor
 * expansion), so two calls with the same raw source but different defines
 * will produce separate cache entries.
 */
export class ShaderLibrary {
  private cache: Map<string, GPUShaderModule> = new Map();

  constructor(private device: GPUDevice) {}

  /**
   * Return a cached `GPUShaderModule` for the given source + defines, or
   * create one via `device.createShaderModule` and cache it.
   */
  get(source: string, defines?: ShaderDefines): GPUShaderModule {
    const processed = ShaderPreprocessor.process(source, defines);

    let mod = this.cache.get(processed);
    if (mod) return mod;

    mod = this.device.createShaderModule({ code: processed });
    this.cache.set(processed, mod);
    return mod;
  }

  /** Remove all cached shader modules. */
  clear(): void {
    this.cache.clear();
  }
}
