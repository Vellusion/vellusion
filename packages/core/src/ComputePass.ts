/**
 * Begin a compute pass on the given command encoder.
 *
 * @param encoder  The command encoder to begin the pass on.
 * @param label    Optional debug label for the pass.
 */
export function beginComputePass(
  encoder: GPUCommandEncoder,
  label?: string,
): GPUComputePassEncoder {
  return encoder.beginComputePass({ label });
}

/**
 * Convenience function that sets the pipeline, binds bind-group 0, and
 * dispatches the specified number of workgroups.
 *
 * @param pass            The active compute pass encoder.
 * @param pipeline        The compute pipeline to use.
 * @param bindGroup       The bind group to set at index 0.
 * @param workgroupCountX Number of workgroups in X.
 * @param workgroupCountY Number of workgroups in Y (default 1).
 * @param workgroupCountZ Number of workgroups in Z (default 1).
 */
export function dispatchCompute(
  pass: GPUComputePassEncoder,
  pipeline: GPUComputePipeline,
  bindGroup: GPUBindGroup,
  workgroupCountX: number,
  workgroupCountY: number = 1,
  workgroupCountZ: number = 1,
): void {
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ);
}
