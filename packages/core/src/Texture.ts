/**
 * Texture usage flags matching GPUTextureUsage constants.
 */
export const TEXTURE_USAGE = {
  COPY_SRC: 0x01,
  COPY_DST: 0x02,
  TEXTURE_BINDING: 0x04,
  STORAGE_BINDING: 0x08,
  RENDER_ATTACHMENT: 0x10,
} as const;

/**
 * Descriptor for creating a TextureWrapper.
 */
export interface TextureDescriptor {
  width: number;
  height: number;
  format?: GPUTextureFormat;
  usage?: number;
  dimension?: GPUTextureDimension;
  mipLevelCount?: number;
  sampleCount?: number;
  label?: string;
}

/**
 * Wraps a GPUTexture with convenient defaults and helper methods.
 */
export class TextureWrapper {
  readonly gpuTexture: GPUTexture;
  readonly width: number;
  readonly height: number;
  readonly format: GPUTextureFormat;

  constructor(device: GPUDevice, descriptor: TextureDescriptor) {
    this.width = descriptor.width;
    this.height = descriptor.height;
    this.format = descriptor.format ?? 'rgba8unorm';

    const usage =
      descriptor.usage ??
      (TEXTURE_USAGE.TEXTURE_BINDING | TEXTURE_USAGE.COPY_DST | TEXTURE_USAGE.RENDER_ATTACHMENT);

    this.gpuTexture = device.createTexture({
      size: { width: this.width, height: this.height },
      format: this.format,
      usage,
      dimension: descriptor.dimension ?? '2d',
      mipLevelCount: descriptor.mipLevelCount ?? 1,
      sampleCount: descriptor.sampleCount ?? 1,
      label: descriptor.label,
    });
  }

  /**
   * Write pixel data into this texture via the device queue.
   */
  writeData(device: GPUDevice, data: ArrayBufferView, bytesPerRow: number): void {
    device.queue.writeTexture(
      { texture: this.gpuTexture },
      data,
      { bytesPerRow },
      { width: this.width, height: this.height },
    );
  }

  /**
   * Create a GPUTextureView from the underlying texture.
   */
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView {
    return this.gpuTexture.createView(descriptor);
  }

  /**
   * Destroy the underlying GPUTexture and release GPU memory.
   */
  destroy(): void {
    this.gpuTexture.destroy();
  }
}
