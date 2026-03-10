import { describe, it, expect, vi } from 'vitest';
import { GPUBufferWrapper, BufferDescriptor } from '../src/Buffer';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockGPUBuffer() {
  return {
    destroy: vi.fn(),
    size: 0,
    usage: 0,
    mapState: 'unmapped',
    label: '',
    getMappedRange: vi.fn(),
    mapAsync: vi.fn(),
    unmap: vi.fn(),
  } as unknown as GPUBuffer;
}

function createMockDevice(mockBuffer?: GPUBuffer) {
  const buffer = mockBuffer ?? createMockGPUBuffer();
  return {
    createBuffer: vi.fn().mockReturnValue(buffer),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn(),
    },
    destroy: vi.fn(),
  } as unknown as GPUDevice;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GPUBufferWrapper', () => {
  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  it('should call device.createBuffer with correct size and label', () => {
    const device = createMockDevice();
    const descriptor: BufferDescriptor = {
      size: 256,
      usage: ['vertex'],
      label: 'my-buffer',
    };

    new GPUBufferWrapper(device, descriptor);

    expect(device.createBuffer).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 256,
        label: 'my-buffer',
      }),
    );
  });

  it('should default label to empty string', () => {
    const device = createMockDevice();
    const wrapper = new GPUBufferWrapper(device, { size: 64, usage: ['uniform'] });

    expect(wrapper.label).toBe('');
    expect(device.createBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ label: '' }),
    );
  });

  it('should map vertex usage to correct flag', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['vertex'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // vertex = 0x0020, copy-dst = 0x0008
    expect(call.usage).toBe(0x0020 | 0x0008);
  });

  it('should map index usage to correct flag', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['index'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // index = 0x0010, copy-dst = 0x0008
    expect(call.usage).toBe(0x0010 | 0x0008);
  });

  it('should map uniform usage to correct flag', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['uniform'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // uniform = 0x0040, copy-dst = 0x0008
    expect(call.usage).toBe(0x0040 | 0x0008);
  });

  it('should map storage usage to correct flag', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['storage'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // storage = 0x0080, copy-dst = 0x0008
    expect(call.usage).toBe(0x0080 | 0x0008);
  });

  it('should map copy-src usage to correct flag', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['copy-src'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // copy-src = 0x0004, copy-dst = 0x0008
    expect(call.usage).toBe(0x0004 | 0x0008);
  });

  it('should always include COPY_DST even when not explicitly requested', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['vertex'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // COPY_DST = 0x0008
    expect(call.usage & 0x0008).toBe(0x0008);
  });

  it('should OR multiple usage flags together', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 128, usage: ['vertex', 'storage', 'copy-src'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // vertex=0x0020 | storage=0x0080 | copy-src=0x0004 | copy-dst=0x0008
    expect(call.usage).toBe(0x0020 | 0x0080 | 0x0004 | 0x0008);
  });

  it('should not duplicate COPY_DST when explicitly included', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['vertex', 'copy-dst'] });

    const call = (device.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // vertex=0x0020 | copy-dst=0x0008 (OR is idempotent)
    expect(call.usage).toBe(0x0020 | 0x0008);
  });

  it('should forward mappedAtCreation to device.createBuffer', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['vertex'], mappedAtCreation: true });

    expect(device.createBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ mappedAtCreation: true }),
    );
  });

  it('should default mappedAtCreation to false', () => {
    const device = createMockDevice();
    new GPUBufferWrapper(device, { size: 64, usage: ['vertex'] });

    expect(device.createBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ mappedAtCreation: false }),
    );
  });

  it('should expose size and gpuBuffer properties', () => {
    const mockBuffer = createMockGPUBuffer();
    const device = createMockDevice(mockBuffer);
    const wrapper = new GPUBufferWrapper(device, { size: 512, usage: ['uniform'] });

    expect(wrapper.size).toBe(512);
    expect(wrapper.gpuBuffer).toBe(mockBuffer);
  });

  // -------------------------------------------------------------------------
  // write()
  // -------------------------------------------------------------------------

  it('should call device.queue.writeBuffer with correct arguments', () => {
    const device = createMockDevice();
    const wrapper = new GPUBufferWrapper(device, { size: 256, usage: ['uniform'] });
    const data = new Float32Array([1, 2, 3, 4]);

    wrapper.write(device, data);

    expect(device.queue.writeBuffer).toHaveBeenCalledWith(
      wrapper.gpuBuffer,
      0,
      data,
    );
  });

  it('should pass offset to writeBuffer', () => {
    const device = createMockDevice();
    const wrapper = new GPUBufferWrapper(device, { size: 256, usage: ['storage'] });
    const data = new Uint8Array([10, 20, 30]);

    wrapper.write(device, data, 64);

    expect(device.queue.writeBuffer).toHaveBeenCalledWith(
      wrapper.gpuBuffer,
      64,
      data,
    );
  });

  it('should default offset to 0', () => {
    const device = createMockDevice();
    const wrapper = new GPUBufferWrapper(device, { size: 128, usage: ['vertex'] });
    const data = new Float32Array([1]);

    wrapper.write(device, data);

    expect(device.queue.writeBuffer).toHaveBeenCalledWith(
      wrapper.gpuBuffer,
      0,
      data,
    );
  });

  // -------------------------------------------------------------------------
  // destroy()
  // -------------------------------------------------------------------------

  it('should call gpuBuffer.destroy()', () => {
    const mockBuffer = createMockGPUBuffer();
    const device = createMockDevice(mockBuffer);
    const wrapper = new GPUBufferWrapper(device, { size: 64, usage: ['vertex'] });

    wrapper.destroy();

    expect(mockBuffer.destroy).toHaveBeenCalled();
  });
});
