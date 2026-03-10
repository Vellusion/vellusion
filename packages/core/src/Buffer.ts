/**
 * Friendly string aliases for GPUBufferUsage flags.
 */
export type BufferUsage = 'vertex' | 'index' | 'uniform' | 'storage' | 'copy-src' | 'copy-dst';

/**
 * Descriptor for creating a GPUBufferWrapper.
 */
export interface BufferDescriptor {
  size: number;
  usage: BufferUsage[];
  label?: string;
  mappedAtCreation?: boolean;
}

/**
 * Numeric values for GPUBufferUsage flags.
 * Defined explicitly because GPUBufferUsage is not available in Node.
 */
const BUFFER_USAGE: Record<BufferUsage, number> = {
  'vertex': 0x0020,
  'index': 0x0010,
  'uniform': 0x0040,
  'storage': 0x0080,
  'copy-src': 0x0004,
  'copy-dst': 0x0008,
};

/**
 * Thin wrapper around a GPUBuffer that provides:
 * - Friendly string-based usage flags
 * - Automatic COPY_DST inclusion so `write()` always works
 * - Convenient `write()` method delegating to `device.queue.writeBuffer`
 */
export class GPUBufferWrapper {
  readonly gpuBuffer: GPUBuffer;
  readonly size: number;
  readonly label: string;

  constructor(device: GPUDevice, descriptor: BufferDescriptor) {
    this.size = descriptor.size;
    this.label = descriptor.label ?? '';

    // OR together the requested usage flags, always including COPY_DST.
    let usage = BUFFER_USAGE['copy-dst'];
    for (const flag of descriptor.usage) {
      usage |= BUFFER_USAGE[flag];
    }

    this.gpuBuffer = device.createBuffer({
      size: descriptor.size,
      usage,
      label: this.label,
      mappedAtCreation: descriptor.mappedAtCreation ?? false,
    });
  }

  /**
   * Write data into this buffer via the device queue.
   *
   * @param device  The GPUDevice whose queue will perform the write.
   * @param data    The data to upload.
   * @param offset  Byte offset into the GPU buffer (default 0).
   */
  write(device: GPUDevice, data: ArrayBufferView, offset: number = 0): void {
    device.queue.writeBuffer(this.gpuBuffer, offset, data);
  }

  /**
   * Destroy the underlying GPUBuffer and release GPU memory.
   */
  destroy(): void {
    this.gpuBuffer.destroy();
  }
}
