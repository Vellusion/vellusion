import type { GPUContext } from '@vellusion/core';
import type { ParticleSystem } from './ParticleSystem';
import type { Mat4Type, Vec3Type } from '@vellusion/math';

export class ParticleRenderer {
  private _gpuContext: GPUContext;
  private _systems: Set<ParticleSystem> = new Set();
  private _renderPipeline: GPURenderPipeline | null = null;
  private _systemGPUData: Map<ParticleSystem, {
    positionBuffer: GPUBuffer;
    colorBuffer: GPUBuffer;
    scaleBuffer: GPUBuffer;
    aliveBuffer: GPUBuffer;
    uniformBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
  }> = new Map();

  constructor(gpuContext: GPUContext) {
    this._gpuContext = gpuContext;
  }

  addSystem(system: ParticleSystem): void {
    this._systems.add(system);
  }

  removeSystem(system: ParticleSystem): void {
    this._systems.delete(system);
    const data = this._systemGPUData.get(system);
    if (data) {
      data.positionBuffer.destroy();
      data.colorBuffer.destroy();
      data.scaleBuffer.destroy();
      data.aliveBuffer.destroy();
      data.uniformBuffer.destroy();
      this._systemGPUData.delete(system);
    }
  }

  get systemCount(): number {
    return this._systems.size;
  }

  /**
   * Update particle systems on CPU and upload data to GPU.
   * In a full implementation, this would use a compute shader.
   * For now, CPU update + GPU upload for correctness.
   */
  update(dt: number): void {
    for (const system of this._systems) {
      system.update(dt);
      this._uploadParticleData(system);
    }
  }

  private _uploadParticleData(system: ParticleSystem): void {
    let data = this._systemGPUData.get(system);
    if (!data) {
      data = this._createGPUData(system);
      if (!data) return;
      this._systemGPUData.set(system, data);
    }

    const device = this._gpuContext.device;
    device.queue.writeBuffer(data.positionBuffer, 0, system.positions);
    device.queue.writeBuffer(data.colorBuffer, 0, system.colors);
    device.queue.writeBuffer(data.scaleBuffer, 0, system.scales);
    device.queue.writeBuffer(data.aliveBuffer, 0, system.alive);
  }

  private _createGPUData(system: ParticleSystem) {
    if (!this._renderPipeline) return null;
    const device = this._gpuContext.device;
    const n = system.maximumParticles;

    const positionBuffer = device.createBuffer({
      size: n * 3 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const colorBuffer = device.createBuffer({
      size: n * 4 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const scaleBuffer = device.createBuffer({
      size: n * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const aliveBuffer = device.createBuffer({
      size: n,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const uniformBuffer = device.createBuffer({
      size: 80, // viewProjection(64) + cameraPosition(12) + pad(4)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = device.createBindGroup({
      layout: this._renderPipeline!.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    return { positionBuffer, colorBuffer, scaleBuffer, aliveBuffer, uniformBuffer, bindGroup };
  }

  /**
   * Initialize the render pipeline for billboard particles.
   */
  initPipeline(shaderCode: string): void {
    const device = this._gpuContext.device;
    const shaderModule = device.createShaderModule({ code: shaderCode });

    this._renderPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            // Per-particle position (instanced)
            arrayStride: 12,
            stepMode: 'instance' as GPUVertexStepMode,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' as GPUVertexFormat },
            ],
          },
          {
            // Per-particle color (instanced)
            arrayStride: 16,
            stepMode: 'instance' as GPUVertexStepMode,
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'float32x4' as GPUVertexFormat },
            ],
          },
          {
            // Per-particle scale (instanced)
            arrayStride: 4,
            stepMode: 'instance' as GPUVertexStepMode,
            attributes: [
              { shaderLocation: 2, offset: 0, format: 'float32' as GPUVertexFormat },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{
          format: this._gpuContext.format,
          blend: {
            color: {
              srcFactor: 'src-alpha' as GPUBlendFactor,
              dstFactor: 'one-minus-src-alpha' as GPUBlendFactor,
            },
            alpha: {
              srcFactor: 'one' as GPUBlendFactor,
              dstFactor: 'one-minus-src-alpha' as GPUBlendFactor,
            },
          },
        }],
      },
      primitive: { topology: 'triangle-strip' },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false, // particles don't write depth
        depthCompare: 'less',
      },
    });
  }

  /**
   * Render all active particle systems.
   */
  render(passEncoder: GPURenderPassEncoder, viewProjection: Mat4Type, cameraPosition: Vec3Type): void {
    if (!this._renderPipeline) return;

    for (const system of this._systems) {
      if (!system.show || system.activeCount === 0) continue;
      const data = this._systemGPUData.get(system);
      if (!data) continue;

      // Update uniforms
      const uniforms = new Float32Array(20);
      for (let i = 0; i < 16; i++) uniforms[i] = viewProjection[i];
      uniforms[16] = cameraPosition[0];
      uniforms[17] = cameraPosition[1];
      uniforms[18] = cameraPosition[2];
      this._gpuContext.device.queue.writeBuffer(data.uniformBuffer, 0, uniforms);

      passEncoder.setPipeline(this._renderPipeline);
      passEncoder.setBindGroup(0, data.bindGroup);
      passEncoder.setVertexBuffer(0, data.positionBuffer);
      passEncoder.setVertexBuffer(1, data.colorBuffer);
      passEncoder.setVertexBuffer(2, data.scaleBuffer);
      // Draw 4 vertices (triangle strip quad) per instance
      passEncoder.draw(4, system.activeCount);
    }
  }

  destroy(): void {
    for (const [, data] of this._systemGPUData) {
      data.positionBuffer.destroy();
      data.colorBuffer.destroy();
      data.scaleBuffer.destroy();
      data.aliveBuffer.destroy();
      data.uniformBuffer.destroy();
    }
    this._systemGPUData.clear();
    this._systems.clear();
  }
}
