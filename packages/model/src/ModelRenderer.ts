import type { GPUContext } from '@vellusion/core';
import type { Model } from './Model';
import type { Mat4Type, Vec3Type } from '@vellusion/math';
import type { ModelNode } from './ModelSceneGraph';
import type { ModelPrimitive } from './ModelSceneGraph';

export class ModelRenderer {
  private _gpuContext: GPUContext;
  private _models: Set<Model> = new Set();
  private _pipeline: GPURenderPipeline | null = null;
  private _primitiveGPUData: Map<ModelPrimitive, {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer | null;
    indexCount: number;
    vertexCount: number;
    uniformBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
  }> = new Map();

  constructor(gpuContext: GPUContext) {
    this._gpuContext = gpuContext;
  }

  initPipeline(shaderCode: string): void {
    const device = this._gpuContext.device;
    const shaderModule = device.createShaderModule({ code: shaderCode });

    this._pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 32, // pos(3) + normal(3) + uv(2) = 8 floats x 4
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' as GPUVertexFormat },
            { shaderLocation: 1, offset: 12, format: 'float32x3' as GPUVertexFormat },
            { shaderLocation: 2, offset: 24, format: 'float32x2' as GPUVertexFormat },
          ],
        }],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format: this._gpuContext.format }],
      },
      primitive: { topology: 'triangle-list', cullMode: 'back' },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
  }

  addModel(model: Model): void {
    this._models.add(model);
  }

  removeModel(model: Model): void {
    this._models.delete(model);
  }

  get modelCount(): number {
    return this._models.size;
  }

  render(passEncoder: GPURenderPassEncoder, viewProjection: Mat4Type, cameraPosition: Vec3Type): void {
    if (!this._pipeline) return;

    for (const model of this._models) {
      if (!model.show) continue;
      this._renderModel(passEncoder, model, viewProjection);
    }
  }

  private _renderModel(
    passEncoder: GPURenderPassEncoder,
    model: Model,
    viewProjection: Mat4Type,
  ): void {
    const prims = model.allPrimitives;
    for (const { node, primitiveIndex } of prims) {
      const prim = node.mesh!.primitives[primitiveIndex];
      let gpuData = this._primitiveGPUData.get(prim);
      if (!gpuData) {
        gpuData = this._uploadPrimitive(prim);
        if (!gpuData) continue;
        this._primitiveGPUData.set(prim, gpuData);
      }

      // Update uniform: MVP = viewProjection * model.modelMatrix * node.worldMatrix
      const mvpData = new Float32Array(16);
      // Simplified: just viewProjection for now (model transform applied in uniform)
      for (let i = 0; i < 16; i++) mvpData[i] = viewProjection[i];
      this._gpuContext.device.queue.writeBuffer(gpuData.uniformBuffer, 0, mvpData);

      passEncoder.setPipeline(this._pipeline!);
      passEncoder.setBindGroup(0, gpuData.bindGroup);
      passEncoder.setVertexBuffer(0, gpuData.vertexBuffer);
      if (gpuData.indexBuffer) {
        passEncoder.setIndexBuffer(gpuData.indexBuffer, 'uint16');
        passEncoder.drawIndexed(gpuData.indexCount);
      } else {
        passEncoder.draw(gpuData.vertexCount);
      }
    }
  }

  private _uploadPrimitive(prim: ModelPrimitive) {
    const device = this._gpuContext.device;
    const vertexCount = prim.vertexCount;

    // Interleave: position(3) + normal(3) + uv(2) = 8 floats per vertex
    const stride = 8;
    const vertexData = new Float32Array(vertexCount * stride);
    for (let i = 0; i < vertexCount; i++) {
      vertexData[i * stride + 0] = prim.positions[i * 3];
      vertexData[i * stride + 1] = prim.positions[i * 3 + 1];
      vertexData[i * stride + 2] = prim.positions[i * 3 + 2];
      vertexData[i * stride + 3] = prim.normals ? prim.normals[i * 3] : 0;
      vertexData[i * stride + 4] = prim.normals ? prim.normals[i * 3 + 1] : 1;
      vertexData[i * stride + 5] = prim.normals ? prim.normals[i * 3 + 2] : 0;
      vertexData[i * stride + 6] = prim.uvs ? prim.uvs[i * 2] : 0;
      vertexData[i * stride + 7] = prim.uvs ? prim.uvs[i * 2 + 1] : 0;
    }

    const vertexBuffer = device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
    vertexBuffer.unmap();

    let indexBuffer: GPUBuffer | null = null;
    let indexCount = 0;
    if (prim.indices) {
      indexCount = prim.indices.length;
      indexBuffer = device.createBuffer({
        size: prim.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Uint16Array(indexBuffer.getMappedRange()).set(
        prim.indices instanceof Uint16Array ? prim.indices : new Uint16Array(prim.indices),
      );
      indexBuffer.unmap();
    }

    const uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = device.createBindGroup({
      layout: this._pipeline!.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    return { vertexBuffer, indexBuffer, indexCount, vertexCount, uniformBuffer, bindGroup };
  }

  destroy(): void {
    for (const [, data] of this._primitiveGPUData) {
      data.vertexBuffer.destroy();
      data.indexBuffer?.destroy();
      data.uniformBuffer.destroy();
    }
    this._primitiveGPUData.clear();
    this._models.clear();
  }
}
