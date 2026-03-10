import { describe, it, expect, vi } from 'vitest';
import { TextureWrapper, TEXTURE_USAGE } from '../src/Texture';
import type { TextureDescriptor } from '../src/Texture';
import { SamplerWrapper } from '../src/Sampler';
import type { SamplerDescriptor } from '../src/Sampler';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockGPUTexture() {
  return {
    createView: vi.fn().mockReturnValue({ label: 'mock-view' }),
    destroy: vi.fn(),
    width: 0,
    height: 0,
    format: 'rgba8unorm',
    usage: 0,
  } as unknown as GPUTexture;
}

function createMockDevice(mockTexture?: GPUTexture, mockSampler?: GPUSampler) {
  return {
    createTexture: vi.fn().mockReturnValue(mockTexture ?? createMockGPUTexture()),
    createSampler: vi.fn().mockReturnValue(mockSampler ?? ({} as GPUSampler)),
    queue: {
      writeTexture: vi.fn(),
    },
  } as unknown as GPUDevice;
}

// ---------------------------------------------------------------------------
// TextureWrapper
// ---------------------------------------------------------------------------

describe('TextureWrapper', () => {
  it('should call device.createTexture with correct params', () => {
    const device = createMockDevice();
    const desc: TextureDescriptor = {
      width: 512,
      height: 256,
      format: 'rgba16float',
      usage: TEXTURE_USAGE.STORAGE_BINDING | TEXTURE_USAGE.COPY_SRC,
      dimension: '2d',
      mipLevelCount: 4,
      sampleCount: 1,
      label: 'my-texture',
    };

    new TextureWrapper(device, desc);

    expect(device.createTexture).toHaveBeenCalledWith({
      size: { width: 512, height: 256 },
      format: 'rgba16float',
      usage: TEXTURE_USAGE.STORAGE_BINDING | TEXTURE_USAGE.COPY_SRC,
      dimension: '2d',
      mipLevelCount: 4,
      sampleCount: 1,
      label: 'my-texture',
    });
  });

  it('should apply defaults when optional fields are omitted', () => {
    const device = createMockDevice();
    const desc: TextureDescriptor = { width: 64, height: 64 };

    const tex = new TextureWrapper(device, desc);

    expect(device.createTexture).toHaveBeenCalledWith({
      size: { width: 64, height: 64 },
      format: 'rgba8unorm',
      usage: TEXTURE_USAGE.TEXTURE_BINDING | TEXTURE_USAGE.COPY_DST | TEXTURE_USAGE.RENDER_ATTACHMENT,
      dimension: '2d',
      mipLevelCount: 1,
      sampleCount: 1,
      label: undefined,
    });
    expect(tex.width).toBe(64);
    expect(tex.height).toBe(64);
    expect(tex.format).toBe('rgba8unorm');
  });

  it('writeData should call device.queue.writeTexture', () => {
    const device = createMockDevice();
    const tex = new TextureWrapper(device, { width: 128, height: 128 });

    const data = new Uint8Array(128 * 128 * 4);
    tex.writeData(device, data, 128 * 4);

    expect(device.queue.writeTexture).toHaveBeenCalledWith(
      { texture: tex.gpuTexture },
      data,
      { bytesPerRow: 128 * 4 },
      { width: 128, height: 128 },
    );
  });

  it('createView should delegate to gpuTexture.createView', () => {
    const mockTexture = createMockGPUTexture();
    const device = createMockDevice(mockTexture);
    const tex = new TextureWrapper(device, { width: 32, height: 32 });

    const viewDesc: GPUTextureViewDescriptor = { dimension: '2d' };
    const view = tex.createView(viewDesc);

    expect(mockTexture.createView).toHaveBeenCalledWith(viewDesc);
    expect(view).toEqual({ label: 'mock-view' });
  });

  it('createView should work without a descriptor', () => {
    const mockTexture = createMockGPUTexture();
    const device = createMockDevice(mockTexture);
    const tex = new TextureWrapper(device, { width: 32, height: 32 });

    tex.createView();

    expect(mockTexture.createView).toHaveBeenCalledWith(undefined);
  });

  it('destroy should call gpuTexture.destroy', () => {
    const mockTexture = createMockGPUTexture();
    const device = createMockDevice(mockTexture);
    const tex = new TextureWrapper(device, { width: 16, height: 16 });

    tex.destroy();

    expect(mockTexture.destroy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SamplerWrapper
// ---------------------------------------------------------------------------

describe('SamplerWrapper', () => {
  it('should call device.createSampler with provided params', () => {
    const device = createMockDevice();
    const desc: SamplerDescriptor = {
      minFilter: 'nearest',
      magFilter: 'nearest',
      mipmapFilter: 'nearest',
      addressModeU: 'repeat',
      addressModeV: 'mirror-repeat',
      maxAnisotropy: 8,
      label: 'my-sampler',
    };

    new SamplerWrapper(device, desc);

    expect(device.createSampler).toHaveBeenCalledWith({
      minFilter: 'nearest',
      magFilter: 'nearest',
      mipmapFilter: 'nearest',
      addressModeU: 'repeat',
      addressModeV: 'mirror-repeat',
      maxAnisotropy: 8,
      label: 'my-sampler',
    });
  });

  it('should apply defaults when no descriptor is provided', () => {
    const device = createMockDevice();

    new SamplerWrapper(device);

    expect(device.createSampler).toHaveBeenCalledWith({
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      maxAnisotropy: undefined,
      label: undefined,
    });
  });

  it('should apply defaults when empty descriptor is provided', () => {
    const device = createMockDevice();

    new SamplerWrapper(device, {});

    expect(device.createSampler).toHaveBeenCalledWith({
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      maxAnisotropy: undefined,
      label: undefined,
    });
  });

  it('should expose the created GPUSampler', () => {
    const mockSampler = { label: 'test' } as unknown as GPUSampler;
    const device = createMockDevice(undefined, mockSampler);

    const sampler = new SamplerWrapper(device);

    expect(sampler.gpuSampler).toBe(mockSampler);
  });
});
