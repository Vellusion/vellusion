import { describe, it, expect, vi } from 'vitest';
import { Model } from '../src/Model';
import { ModelRenderer } from '../src/ModelRenderer';
import { ModelNode, ModelMesh, ModelPrimitive } from '../src/ModelSceneGraph';
import { ModelAnimation } from '../src/ModelAnimation';
import { ModelSkin } from '../src/ModelSkin';
import { PbrMaterial } from '../src/PbrMaterial';
import { GltfDocument } from '../src/gltf/GltfDocument';
import { Mat4 } from '@vellusion/math';
import type { GPUContext } from '@vellusion/core';

// ─────────────── Helpers ───────────────

/**
 * Create a minimal glTF JSON + binary buffer for a single triangle.
 */
function createMinimalGltfJson() {
  // Binary buffer: 3 positions (VEC3) + 3 indices (SCALAR uint16)
  // 3 * 3 * 4 = 36 bytes for positions, then 3 * 2 = 6 bytes for indices = 42 bytes
  // Pad to multiple of 4: 44 bytes
  const buffer = new ArrayBuffer(44);
  const posView = new Float32Array(buffer, 0, 9);
  posView.set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const idxView = new Uint16Array(buffer, 36, 3);
  idxView.set([0, 1, 2]);

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'triangle', mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
          },
        ],
      },
    ],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [1, 0, 0, 1],
        },
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: 3,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 6 },
    ],
    buffers: [{ byteLength: 44 }],
  };

  return { json, buffers: [buffer] };
}

/**
 * Create a minimal GLB binary from JSON + optional binary chunk.
 */
function createMinimalGlb(json: object, bin?: ArrayBuffer): ArrayBuffer {
  const jsonStr = JSON.stringify(json);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const jsonPadded =
    jsonBytes.length + ((4 - (jsonBytes.length % 4)) % 4);
  const jsonChunk = new Uint8Array(jsonPadded);
  jsonChunk.set(jsonBytes);
  for (let i = jsonBytes.length; i < jsonPadded; i++) jsonChunk[i] = 0x20;

  const binLength = bin ? bin.byteLength : 0;
  const binPadded = binLength + ((4 - (binLength % 4)) % 4);
  const totalLength = 12 + 8 + jsonPadded + (bin ? 8 + binPadded : 0);

  const result = new ArrayBuffer(totalLength);
  const view = new DataView(result);
  const bytes = new Uint8Array(result);

  // Header
  view.setUint32(0, 0x46546c67, true); // magic
  view.setUint32(4, 2, true); // version
  view.setUint32(8, totalLength, true); // length

  // JSON chunk
  let off = 12;
  view.setUint32(off, jsonPadded, true);
  off += 4;
  view.setUint32(off, 0x4e4f534a, true);
  off += 4;
  bytes.set(jsonChunk, off);
  off += jsonPadded;

  // BIN chunk
  if (bin) {
    view.setUint32(off, binPadded, true);
    off += 4;
    view.setUint32(off, 0x004e4942, true);
    off += 4;
    bytes.set(new Uint8Array(bin), off);
  }

  return result;
}

/**
 * Create a mock GPUContext following the Globe.test.ts pattern.
 */
function createMockGPUContext() {
  const mockBuffer = {
    getMappedRange: vi.fn(() => new ArrayBuffer(1024)),
    unmap: vi.fn(),
    destroy: vi.fn(),
  };
  const mockBindGroup = {};
  const mockBindGroupLayout = {};
  const mockShaderModule = {};
  const mockPipeline = {
    getBindGroupLayout: vi.fn(() => mockBindGroupLayout),
  };

  const mockGPUContext = {
    device: {
      createBuffer: vi.fn(() => mockBuffer),
      createBindGroup: vi.fn(() => mockBindGroup),
      createShaderModule: vi.fn(() => mockShaderModule),
      createRenderPipeline: vi.fn(() => mockPipeline),
      queue: {
        submit: vi.fn(),
        writeBuffer: vi.fn(),
      },
    },
    format: 'bgra8unorm',
    width: 800,
    height: 600,
  } as unknown as GPUContext;

  return { mockGPUContext, mockBuffer };
}

/**
 * Create a simple Model from in-memory data (no glTF parsing).
 */
function createSimpleModel(): Model {
  const prim = new ModelPrimitive({
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    indices: new Uint16Array([0, 1, 2]),
  });
  const mesh = new ModelMesh([prim]);
  const node = new ModelNode('root');
  node.mesh = mesh;
  node.updateWorldMatrix();

  return new Model({
    rootNodes: [node],
    allNodes: [node],
    animations: [],
    skins: [],
    materials: [PbrMaterial.default()],
  });
}

// ─────────────── Model tests ───────────────

describe('Model', () => {
  it('fromGltf creates model from minimal glTF', () => {
    const { json, buffers } = createMinimalGltfJson();
    const model = Model.fromGltf(json, buffers);
    expect(model.rootNodes).toHaveLength(1);
    expect(model.rootNodes[0].name).toBe('triangle');
    expect(model.allNodes).toHaveLength(1);
    expect(model.materials.length).toBeGreaterThanOrEqual(1);
  });

  it('fromGlb creates model from GLB binary', () => {
    const { json, buffers } = createMinimalGltfJson();
    const glb = createMinimalGlb(json, buffers[0]);
    const model = Model.fromGlb(glb);
    expect(model.rootNodes).toHaveLength(1);
    expect(model.rootNodes[0].name).toBe('triangle');
    expect(model.allNodes).toHaveLength(1);
  });

  it('show defaults to true', () => {
    const model = createSimpleModel();
    expect(model.show).toBe(true);
  });

  it('modelMatrix defaults to identity', () => {
    const model = createSimpleModel();
    expect(model.modelMatrix[0]).toBeCloseTo(1);
    expect(model.modelMatrix[5]).toBeCloseTo(1);
    expect(model.modelMatrix[10]).toBeCloseTo(1);
    expect(model.modelMatrix[15]).toBeCloseTo(1);
    expect(model.modelMatrix[12]).toBeCloseTo(0);
    expect(model.modelMatrix[13]).toBeCloseTo(0);
    expect(model.modelMatrix[14]).toBeCloseTo(0);
  });

  it('allPrimitives collects all mesh primitives', () => {
    const prim1 = new ModelPrimitive({
      positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    });
    const prim2 = new ModelPrimitive({
      positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0]),
    });
    const mesh1 = new ModelMesh([prim1]);
    const mesh2 = new ModelMesh([prim2]);

    const parent = new ModelNode('parent');
    parent.mesh = mesh1;
    const child = new ModelNode('child');
    child.mesh = mesh2;
    parent.addChild(child);

    const model = new Model({
      rootNodes: [parent],
      allNodes: [parent, child],
      animations: [],
      skins: [],
      materials: [],
    });

    const prims = model.allPrimitives;
    expect(prims).toHaveLength(2);
  });

  it('allPrimitives returns multiple primitives per mesh', () => {
    const prim1 = new ModelPrimitive({
      positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    });
    const prim2 = new ModelPrimitive({
      positions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0]),
    });
    const mesh = new ModelMesh([prim1, prim2]);
    const node = new ModelNode('multi');
    node.mesh = mesh;

    const model = new Model({
      rootNodes: [node],
      allNodes: [node],
      animations: [],
      skins: [],
      materials: [],
    });

    const prims = model.allPrimitives;
    expect(prims).toHaveLength(2);
    expect(prims[0].primitiveIndex).toBe(0);
    expect(prims[1].primitiveIndex).toBe(1);
  });

  it('updateAnimations advances animation time', () => {
    const node = new ModelNode('animated');
    const anim = new ModelAnimation('bounce');
    anim.duration = 5;
    anim.play();

    const model = new Model({
      rootNodes: [node],
      allNodes: [node],
      animations: [anim],
      skins: [],
      materials: [],
    });

    model.updateAnimations(2.0);
    expect(anim.currentTime).toBeCloseTo(2.0);
  });

  it('updateAnimations with no animations is a no-op', () => {
    const node = new ModelNode('static');
    node.translation[0] = 5;
    node.updateWorldMatrix();

    const model = new Model({
      rootNodes: [node],
      allNodes: [node],
      animations: [],
      skins: [],
      materials: [],
    });

    // Should not throw and should still update world matrices
    model.updateAnimations(1.0);
    expect(node.worldMatrix[12]).toBeCloseTo(5);
  });

  it('updateAnimations updates skins', () => {
    const joint = new ModelNode('joint');
    joint.translation[0] = 3;
    joint.updateWorldMatrix();

    const ibm = Mat4.identity();
    const skin = new ModelSkin([joint], [ibm]);

    const model = new Model({
      rootNodes: [joint],
      allNodes: [joint],
      animations: [],
      skins: [skin],
      materials: [],
    });

    model.updateAnimations(0);
    // After updateAnimations, skin.jointMatrices should reflect world matrix
    expect(skin.jointMatrices[12]).toBeCloseTo(3);
  });
});

// ─────────────── ModelRenderer tests (mock-based) ───────────────

describe('ModelRenderer', () => {
  it('addModel increases modelCount', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ModelRenderer(mockGPUContext);
    const model = createSimpleModel();

    expect(renderer.modelCount).toBe(0);
    renderer.addModel(model);
    expect(renderer.modelCount).toBe(1);
  });

  it('removeModel decreases modelCount', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ModelRenderer(mockGPUContext);
    const model = createSimpleModel();

    renderer.addModel(model);
    expect(renderer.modelCount).toBe(1);
    renderer.removeModel(model);
    expect(renderer.modelCount).toBe(0);
  });

  it('addModel does not duplicate same model', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ModelRenderer(mockGPUContext);
    const model = createSimpleModel();

    renderer.addModel(model);
    renderer.addModel(model);
    expect(renderer.modelCount).toBe(1);
  });

  it('render does nothing without pipeline', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ModelRenderer(mockGPUContext);
    const model = createSimpleModel();
    renderer.addModel(model);

    const mockPassEncoder = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      setIndexBuffer: vi.fn(),
      drawIndexed: vi.fn(),
      draw: vi.fn(),
    } as unknown as GPURenderPassEncoder;

    const viewProjection = new Float64Array(16);
    const cameraPos = new Float64Array([0, 0, 10]);

    // Should not throw, just do nothing
    renderer.render(mockPassEncoder, viewProjection, cameraPos);

    expect(mockPassEncoder.setPipeline).not.toHaveBeenCalled();
  });

  it('destroy cleans up GPU resources', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ModelRenderer(mockGPUContext);
    const model = createSimpleModel();
    renderer.addModel(model);

    renderer.destroy();

    expect(renderer.modelCount).toBe(0);
    // Should not throw on double destroy
    expect(() => renderer.destroy()).not.toThrow();
  });
});
