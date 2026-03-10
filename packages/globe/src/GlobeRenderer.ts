import type { GPUContext } from '@vellusion/core';
import { Globe } from './Globe';
import type { Vec3Type, Mat4Type } from '@vellusion/math';
import { QuadtreeTile, TileState } from './QuadtreeTile';

export class GlobeRenderer {
  private _globe: Globe;
  private _gpuContext: GPUContext;
  private _pipeline: GPURenderPipeline | null = null;
  private _tileGPUData: Map<string, {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    indexCount: number;
    uniformBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
  }> = new Map();

  constructor(gpuContext: GPUContext, globe: Globe) {
    this._gpuContext = gpuContext;
    this._globe = globe;
  }

  /**
   * Update tile selection and process load queue.
   */
  update(cameraPosition: Vec3Type, screenHeight: number, fov: number): void {
    if (!this._globe.show) return;
    this._globe.quadtree.update(cameraPosition, screenHeight, fov);
    // Don't await - fire and forget, tiles will be ready next frame
    this._globe.quadtree.processLoadQueue();
  }

  /**
   * Render all visible tiles.
   */
  render(passEncoder: GPURenderPassEncoder, viewProjectionMatrix: Mat4Type): void {
    if (!this._globe.show) return;
    if (!this._pipeline) return;

    const tiles = this._globe.quadtree.tilesToRender;
    for (const tile of tiles) {
      if (tile.state !== TileState.READY || !tile.mesh) continue;
      this._renderTile(passEncoder, tile, viewProjectionMatrix);
    }
  }

  private _renderTile(
    passEncoder: GPURenderPassEncoder,
    tile: QuadtreeTile,
    viewProjectionMatrix: Mat4Type,
  ): void {
    let gpuData = this._tileGPUData.get(tile.tileKey);
    if (!gpuData) {
      gpuData = this._createTileGPUData(tile);
      if (!gpuData) return;
      this._tileGPUData.set(tile.tileKey, gpuData);
    }

    // Update MVP uniform (model is identity for globe tiles)
    const mvpF32 = new Float32Array(16);
    for (let i = 0; i < 16; i++) mvpF32[i] = viewProjectionMatrix[i];
    this._gpuContext.device.queue.writeBuffer(gpuData.uniformBuffer, 0, mvpF32);

    passEncoder.setPipeline(this._pipeline!);
    passEncoder.setBindGroup(0, gpuData.bindGroup);
    passEncoder.setVertexBuffer(0, gpuData.vertexBuffer);
    passEncoder.setIndexBuffer(gpuData.indexBuffer, 'uint16');
    passEncoder.drawIndexed(gpuData.indexCount);
  }

  private _createTileGPUData(tile: QuadtreeTile) {
    if (!tile.mesh) return null;
    const device = this._gpuContext.device;
    const mesh = tile.mesh;

    // Convert Float64 positions to Float32 for GPU
    const posF32 = new Float32Array(mesh.vertexCount * 3);
    for (let i = 0; i < mesh.vertexCount * 3; i++) {
      posF32[i] = mesh.positions[i];
    }

    // Interleave: position(3f) + normal(3f) + uv(2f) = 8 floats per vertex
    const stride = 8;
    const vertexData = new Float32Array(mesh.vertexCount * stride);
    for (let i = 0; i < mesh.vertexCount; i++) {
      vertexData[i * stride + 0] = posF32[i * 3];
      vertexData[i * stride + 1] = posF32[i * 3 + 1];
      vertexData[i * stride + 2] = posF32[i * 3 + 2];
      vertexData[i * stride + 3] = mesh.normals[i * 3];
      vertexData[i * stride + 4] = mesh.normals[i * 3 + 1];
      vertexData[i * stride + 5] = mesh.normals[i * 3 + 2];
      vertexData[i * stride + 6] = mesh.uvs[i * 2];
      vertexData[i * stride + 7] = mesh.uvs[i * 2 + 1];
    }

    const vertexBuffer = device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
    vertexBuffer.unmap();

    const indexBuffer = device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(indexBuffer.getMappedRange()).set(mesh.indices);
    indexBuffer.unmap();

    const uniformBuffer = device.createBuffer({
      size: 64, // mat4x4f
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = device.createBindGroup({
      layout: this._pipeline!.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    return {
      vertexBuffer,
      indexBuffer,
      indexCount: mesh.indexCount,
      uniformBuffer,
      bindGroup,
    };
  }

  /**
   * Initialize the render pipeline. Must be called once before render().
   */
  initPipeline(shaderCode: string): void {
    const device = this._gpuContext.device;
    const shaderModule = device.createShaderModule({ code: shaderCode });

    this._pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 32, // 8 floats x 4 bytes
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' as GPUVertexFormat },  // position
            { shaderLocation: 1, offset: 12, format: 'float32x3' as GPUVertexFormat }, // normal
            { shaderLocation: 2, offset: 24, format: 'float32x2' as GPUVertexFormat }, // uv
          ],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format: this._gpuContext.format }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
  }

  destroy(): void {
    for (const [, data] of this._tileGPUData) {
      data.vertexBuffer.destroy();
      data.indexBuffer.destroy();
      data.uniformBuffer.destroy();
    }
    this._tileGPUData.clear();
  }
}
