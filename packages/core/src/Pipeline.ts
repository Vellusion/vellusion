/**
 * Fluent builder for GPURenderPipeline and a cache to avoid duplicate creation.
 */

// ---------------------------------------------------------------------------
// RenderPipelineBuilder
// ---------------------------------------------------------------------------

/**
 * A fluent builder for creating GPURenderPipeline objects.
 *
 * Provides sensible defaults (triangle-list topology, vs_main / fs_main
 * entry points, single-sample) and lets callers override only what they need.
 */
export class RenderPipelineBuilder {
  private _vertexModule?: GPUShaderModule;
  private _vertexEntryPoint: string = 'vs_main';
  private _fragmentModule?: GPUShaderModule;
  private _fragmentEntryPoint: string = 'fs_main';
  private _vertexBufferLayouts: GPUVertexBufferLayout[] = [];
  private _colorTargets: GPUColorTargetState[] = [];
  private _depthStencil?: GPUDepthStencilState;
  private _topology: GPUPrimitiveTopology = 'triangle-list';
  private _multisampleCount: number = 1;
  private _bindGroupLayouts: GPUBindGroupLayout[] = [];
  private _label?: string;

  /** Set the vertex shader module (and optionally the entry point). */
  setVertexShader(module: GPUShaderModule, entryPoint?: string): this {
    this._vertexModule = module;
    if (entryPoint !== undefined) {
      this._vertexEntryPoint = entryPoint;
    }
    return this;
  }

  /** Set the fragment shader module (and optionally the entry point). */
  setFragmentShader(module: GPUShaderModule, entryPoint?: string): this {
    this._fragmentModule = module;
    if (entryPoint !== undefined) {
      this._fragmentEntryPoint = entryPoint;
    }
    return this;
  }

  /** Set the vertex buffer layouts. */
  setVertexBufferLayouts(layouts: GPUVertexBufferLayout[]): this {
    this._vertexBufferLayouts = layouts;
    return this;
  }

  /** Set the color target states for the fragment stage. */
  setColorTargets(targets: GPUColorTargetState[]): this {
    this._colorTargets = targets;
    return this;
  }

  /** Set the depth/stencil state. */
  setDepthStencil(state: GPUDepthStencilState): this {
    this._depthStencil = state;
    return this;
  }

  /** Set the primitive topology (default: 'triangle-list'). */
  setPrimitiveTopology(topology: GPUPrimitiveTopology): this {
    this._topology = topology;
    return this;
  }

  /** Set the multisample count (default: 1). */
  setMultisample(count: number): this {
    this._multisampleCount = count;
    return this;
  }

  /** Set bind group layouts for an explicit pipeline layout. */
  setBindGroupLayouts(layouts: GPUBindGroupLayout[]): this {
    this._bindGroupLayouts = layouts;
    return this;
  }

  /** Set a debug label for the pipeline. */
  setLabel(label: string): this {
    this._label = label;
    return this;
  }

  /**
   * Build the GPURenderPipeline from the current configuration.
   *
   * If no bind group layouts have been set, the pipeline uses `layout: 'auto'`.
   * Otherwise a GPUPipelineLayout is created from the provided layouts.
   *
   * @throws if the vertex shader module has not been set.
   */
  build(device: GPUDevice): GPURenderPipeline {
    if (!this._vertexModule) {
      throw new Error('RenderPipelineBuilder: vertex shader module is required');
    }

    const layout: GPUPipelineLayout | 'auto' =
      this._bindGroupLayouts.length > 0
        ? device.createPipelineLayout({ bindGroupLayouts: this._bindGroupLayouts })
        : 'auto';

    const descriptor: GPURenderPipelineDescriptor = {
      label: this._label,
      layout,
      vertex: {
        module: this._vertexModule,
        entryPoint: this._vertexEntryPoint,
        buffers: this._vertexBufferLayouts,
      },
      primitive: {
        topology: this._topology,
      },
      multisample: {
        count: this._multisampleCount,
      },
    };

    // Only add fragment stage if a fragment module is provided.
    if (this._fragmentModule) {
      descriptor.fragment = {
        module: this._fragmentModule,
        entryPoint: this._fragmentEntryPoint,
        targets: this._colorTargets,
      };
    }

    if (this._depthStencil) {
      descriptor.depthStencil = this._depthStencil;
    }

    return device.createRenderPipeline(descriptor);
  }
}

// ---------------------------------------------------------------------------
// PipelineCache
// ---------------------------------------------------------------------------

/**
 * Caches render and compute pipelines keyed by JSON.stringify of their
 * descriptors.  Avoids creating duplicate GPU pipeline objects when the
 * same configuration is requested multiple times.
 */
export class PipelineCache {
  private renderCache: Map<string, GPURenderPipeline> = new Map();
  private computeCache: Map<string, GPUComputePipeline> = new Map();

  constructor(private device: GPUDevice) {}

  /**
   * Get (or create) a render pipeline for the given descriptor.
   * The descriptor is serialised with JSON.stringify to derive the cache key.
   */
  getRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline {
    const key = JSON.stringify(descriptor);
    let pipeline = this.renderCache.get(key);
    if (!pipeline) {
      pipeline = this.device.createRenderPipeline(descriptor);
      this.renderCache.set(key, pipeline);
    }
    return pipeline;
  }

  /**
   * Get (or create) a compute pipeline for the given descriptor.
   * The descriptor is serialised with JSON.stringify to derive the cache key.
   */
  getComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline {
    const key = JSON.stringify(descriptor);
    let pipeline = this.computeCache.get(key);
    if (!pipeline) {
      pipeline = this.device.createComputePipeline(descriptor);
      this.computeCache.set(key, pipeline);
    }
    return pipeline;
  }

  /** Remove all cached pipelines. */
  clear(): void {
    this.renderCache.clear();
    this.computeCache.clear();
  }
}
