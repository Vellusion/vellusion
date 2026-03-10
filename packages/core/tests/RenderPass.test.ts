import { describe, it, expect, vi } from 'vitest';
import { beginRenderPass, RenderPassOptions } from '../src/RenderPass';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockEncoder() {
  return {
    beginRenderPass: vi.fn().mockReturnValue({ end: vi.fn() }),
  } as unknown as GPUCommandEncoder;
}

function createMockTextureView(label = 'mock-view') {
  return { label } as unknown as GPUTextureView;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('beginRenderPass', () => {
  // -------------------------------------------------------------------------
  // Color attachments
  // -------------------------------------------------------------------------

  it('should call encoder.beginRenderPass with correct descriptor', () => {
    const encoder = createMockEncoder();
    const view = createMockTextureView();
    const options: RenderPassOptions = {
      colorAttachments: [
        {
          view,
          clearColor: { r: 1, g: 0, b: 0, a: 1 },
          loadOp: 'load',
          storeOp: 'discard',
        },
      ],
      label: 'test-pass',
    };

    beginRenderPass(encoder, options);

    expect(encoder.beginRenderPass).toHaveBeenCalledWith({
      colorAttachments: [
        {
          view,
          clearValue: { r: 1, g: 0, b: 0, a: 1 },
          loadOp: 'load',
          storeOp: 'discard',
        },
      ],
      label: 'test-pass',
    });
  });

  it('should apply default clearColor { r: 0, g: 0, b: 0, a: 1 }', () => {
    const encoder = createMockEncoder();
    const view = createMockTextureView();
    const options: RenderPassOptions = {
      colorAttachments: [{ view }],
    };

    beginRenderPass(encoder, options);

    const call = (encoder.beginRenderPass as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.colorAttachments[0].clearValue).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('should default loadOp to "clear" and storeOp to "store"', () => {
    const encoder = createMockEncoder();
    const view = createMockTextureView();
    const options: RenderPassOptions = {
      colorAttachments: [{ view }],
    };

    beginRenderPass(encoder, options);

    const call = (encoder.beginRenderPass as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.colorAttachments[0].loadOp).toBe('clear');
    expect(call.colorAttachments[0].storeOp).toBe('store');
  });

  it('should handle multiple color attachments', () => {
    const encoder = createMockEncoder();
    const view1 = createMockTextureView('v1');
    const view2 = createMockTextureView('v2');
    const options: RenderPassOptions = {
      colorAttachments: [
        { view: view1, clearColor: { r: 1, g: 1, b: 1, a: 1 } },
        { view: view2, loadOp: 'load' },
      ],
    };

    beginRenderPass(encoder, options);

    const call = (encoder.beginRenderPass as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.colorAttachments).toHaveLength(2);
    expect(call.colorAttachments[0].clearValue).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    expect(call.colorAttachments[1].loadOp).toBe('load');
    expect(call.colorAttachments[1].storeOp).toBe('store');
  });

  // -------------------------------------------------------------------------
  // Depth / stencil attachment
  // -------------------------------------------------------------------------

  it('should map depthStencilAttachment with defaults', () => {
    const encoder = createMockEncoder();
    const colorView = createMockTextureView('color');
    const depthView = createMockTextureView('depth');
    const options: RenderPassOptions = {
      colorAttachments: [{ view: colorView }],
      depthStencilAttachment: { view: depthView },
    };

    beginRenderPass(encoder, options);

    const call = (encoder.beginRenderPass as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.depthStencilAttachment).toEqual({
      view: depthView,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    });
  });

  it('should use custom depth values when provided', () => {
    const encoder = createMockEncoder();
    const colorView = createMockTextureView('color');
    const depthView = createMockTextureView('depth');
    const options: RenderPassOptions = {
      colorAttachments: [{ view: colorView }],
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 0.5,
        depthLoadOp: 'load',
        depthStoreOp: 'discard',
      },
    };

    beginRenderPass(encoder, options);

    const call = (encoder.beginRenderPass as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.depthStencilAttachment).toEqual({
      view: depthView,
      depthClearValue: 0.5,
      depthLoadOp: 'load',
      depthStoreOp: 'discard',
    });
  });

  it('should not include depthStencilAttachment when not provided', () => {
    const encoder = createMockEncoder();
    const view = createMockTextureView();
    const options: RenderPassOptions = {
      colorAttachments: [{ view }],
    };

    beginRenderPass(encoder, options);

    const call = (encoder.beginRenderPass as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.depthStencilAttachment).toBeUndefined();
  });

  it('should return the GPURenderPassEncoder from encoder.beginRenderPass', () => {
    const encoder = createMockEncoder();
    const view = createMockTextureView();

    const result = beginRenderPass(encoder, { colorAttachments: [{ view }] });

    expect(result).toBeDefined();
    expect(result).toBe((encoder.beginRenderPass as ReturnType<typeof vi.fn>).mock.results[0].value);
  });
});
