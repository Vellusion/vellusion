import { describe, it, expect, vi } from 'vitest';
import { beginComputePass, dispatchCompute } from '../src/ComputePass';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockEncoder() {
  return {
    beginComputePass: vi.fn().mockReturnValue({
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      dispatchWorkgroups: vi.fn(),
      end: vi.fn(),
    }),
  } as unknown as GPUCommandEncoder;
}

function createMockComputePassEncoder() {
  return {
    setPipeline: vi.fn(),
    setBindGroup: vi.fn(),
    dispatchWorkgroups: vi.fn(),
    end: vi.fn(),
  } as unknown as GPUComputePassEncoder;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('beginComputePass', () => {
  it('should call encoder.beginComputePass', () => {
    const encoder = createMockEncoder();

    beginComputePass(encoder);

    expect(encoder.beginComputePass).toHaveBeenCalledWith({ label: undefined });
  });

  it('should pass label to encoder.beginComputePass', () => {
    const encoder = createMockEncoder();

    beginComputePass(encoder, 'my-compute');

    expect(encoder.beginComputePass).toHaveBeenCalledWith({ label: 'my-compute' });
  });

  it('should return the GPUComputePassEncoder', () => {
    const encoder = createMockEncoder();

    const result = beginComputePass(encoder);

    expect(result).toBeDefined();
    expect(result).toBe(
      (encoder.beginComputePass as ReturnType<typeof vi.fn>).mock.results[0].value,
    );
  });
});

describe('dispatchCompute', () => {
  it('should set pipeline, bind group at index 0, and dispatch', () => {
    const pass = createMockComputePassEncoder();
    const pipeline = {} as GPUComputePipeline;
    const bindGroup = {} as GPUBindGroup;

    dispatchCompute(pass, pipeline, bindGroup, 64);

    expect(pass.setPipeline).toHaveBeenCalledWith(pipeline);
    expect(pass.setBindGroup).toHaveBeenCalledWith(0, bindGroup);
    expect(pass.dispatchWorkgroups).toHaveBeenCalledWith(64, 1, 1);
  });

  it('should pass workgroup counts for Y and Z', () => {
    const pass = createMockComputePassEncoder();
    const pipeline = {} as GPUComputePipeline;
    const bindGroup = {} as GPUBindGroup;

    dispatchCompute(pass, pipeline, bindGroup, 16, 8, 4);

    expect(pass.dispatchWorkgroups).toHaveBeenCalledWith(16, 8, 4);
  });

  it('should default Y and Z workgroup counts to 1', () => {
    const pass = createMockComputePassEncoder();
    const pipeline = {} as GPUComputePipeline;
    const bindGroup = {} as GPUBindGroup;

    dispatchCompute(pass, pipeline, bindGroup, 32);

    expect(pass.dispatchWorkgroups).toHaveBeenCalledWith(32, 1, 1);
  });

  it('should call methods in correct order: setPipeline, setBindGroup, dispatchWorkgroups', () => {
    const callOrder: string[] = [];
    const pass = {
      setPipeline: vi.fn(() => callOrder.push('setPipeline')),
      setBindGroup: vi.fn(() => callOrder.push('setBindGroup')),
      dispatchWorkgroups: vi.fn(() => callOrder.push('dispatchWorkgroups')),
    } as unknown as GPUComputePassEncoder;
    const pipeline = {} as GPUComputePipeline;
    const bindGroup = {} as GPUBindGroup;

    dispatchCompute(pass, pipeline, bindGroup, 8);

    expect(callOrder).toEqual(['setPipeline', 'setBindGroup', 'dispatchWorkgroups']);
  });
});
