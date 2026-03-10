import type { ImageryProvider } from './ImageryProvider';

export interface ImageryLayerOptions {
  show?: boolean;
  alpha?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  gamma?: number;
}

/**
 * Wraps an {@link ImageryProvider} with per-layer visual parameters
 * such as opacity, brightness, contrast, saturation and gamma.
 */
export class ImageryLayer {
  readonly provider: ImageryProvider;
  show: boolean;
  alpha: number;
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;

  constructor(provider: ImageryProvider, options?: ImageryLayerOptions) {
    this.provider = provider;
    this.show = options?.show ?? true;
    this.alpha = options?.alpha ?? 1.0;
    this.brightness = options?.brightness ?? 1.0;
    this.contrast = options?.contrast ?? 1.0;
    this.saturation = options?.saturation ?? 1.0;
    this.gamma = options?.gamma ?? 1.0;
  }
}
