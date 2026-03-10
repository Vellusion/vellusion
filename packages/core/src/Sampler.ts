/**
 * Descriptor for creating a SamplerWrapper.
 */
export interface SamplerDescriptor {
  minFilter?: GPUFilterMode;
  magFilter?: GPUFilterMode;
  mipmapFilter?: GPUMipmapFilterMode;
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
  maxAnisotropy?: number;
  label?: string;
}

/**
 * Wraps a GPUSampler with convenient defaults.
 */
export class SamplerWrapper {
  readonly gpuSampler: GPUSampler;

  constructor(device: GPUDevice, descriptor?: SamplerDescriptor) {
    const desc = descriptor ?? {};

    this.gpuSampler = device.createSampler({
      minFilter: desc.minFilter ?? 'linear',
      magFilter: desc.magFilter ?? 'linear',
      mipmapFilter: desc.mipmapFilter ?? 'linear',
      addressModeU: desc.addressModeU ?? 'clamp-to-edge',
      addressModeV: desc.addressModeV ?? 'clamp-to-edge',
      maxAnisotropy: desc.maxAnisotropy,
      label: desc.label,
    });
  }
}
