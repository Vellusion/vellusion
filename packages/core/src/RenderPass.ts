/**
 * Options for creating a render pass.
 */
export interface RenderPassOptions {
  colorAttachments: {
    view: GPUTextureView;
    clearColor?: { r: number; g: number; b: number; a: number };
    loadOp?: GPULoadOp;
    storeOp?: GPUStoreOp;
  }[];
  depthStencilAttachment?: {
    view: GPUTextureView;
    depthClearValue?: number;
    depthLoadOp?: GPULoadOp;
    depthStoreOp?: GPUStoreOp;
  };
  label?: string;
}

/**
 * Begin a render pass on the given command encoder.
 *
 * Maps friendly `RenderPassOptions` to a `GPURenderPassDescriptor` with
 * sensible defaults:
 * - loadOp defaults to `'clear'`, storeOp defaults to `'store'`
 * - clearColor defaults to `{ r: 0, g: 0, b: 0, a: 1 }`
 * - depthClearValue defaults to `1.0`
 * - depthLoadOp defaults to `'clear'`, depthStoreOp defaults to `'store'`
 */
export function beginRenderPass(
  encoder: GPUCommandEncoder,
  options: RenderPassOptions,
): GPURenderPassEncoder {
  const colorAttachments: GPURenderPassColorAttachment[] =
    options.colorAttachments.map((att) => {
      const clearColor = att.clearColor ?? { r: 0, g: 0, b: 0, a: 1 };
      return {
        view: att.view,
        clearValue: clearColor,
        loadOp: att.loadOp ?? 'clear',
        storeOp: att.storeOp ?? 'store',
      };
    });

  const descriptor: GPURenderPassDescriptor = {
    colorAttachments,
    label: options.label,
  };

  if (options.depthStencilAttachment) {
    const depth = options.depthStencilAttachment;
    descriptor.depthStencilAttachment = {
      view: depth.view,
      depthClearValue: depth.depthClearValue ?? 1.0,
      depthLoadOp: depth.depthLoadOp ?? 'clear',
      depthStoreOp: depth.depthStoreOp ?? 'store',
    };
  }

  return encoder.beginRenderPass(descriptor);
}
