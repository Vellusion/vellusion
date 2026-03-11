import { describe, it, expect } from 'vitest';
import { ModelNode, ModelMesh, ModelPrimitive } from '../src/ModelSceneGraph';
import {
  ModelAnimation,
  AnimationChannel,
  AnimationSampler,
} from '../src/ModelAnimation';
import { ModelSkin } from '../src/ModelSkin';
import { ModelBuilder } from '../src/ModelBuilder';
import { GltfDocument } from '../src/gltf/GltfDocument';
import { Mat4 } from '@vellusion/math';

// ────────────────── ModelNode ──────────────────

describe('ModelNode', () => {
  it('has default TRS values (translation=0, rotation=identity, scale=1)', () => {
    const node = new ModelNode('test');
    expect(node.name).toBe('test');
    expect(node.translation[0]).toBe(0);
    expect(node.translation[1]).toBe(0);
    expect(node.translation[2]).toBe(0);
    expect(node.rotation[0]).toBe(0);
    expect(node.rotation[1]).toBe(0);
    expect(node.rotation[2]).toBe(0);
    expect(node.rotation[3]).toBe(1);
    expect(node.scale[0]).toBe(1);
    expect(node.scale[1]).toBe(1);
    expect(node.scale[2]).toBe(1);
  });

  it('has default values for mesh and skinIndex', () => {
    const node = new ModelNode();
    expect(node.mesh).toBeNull();
    expect(node.skinIndex).toBe(-1);
    expect(node.parent).toBeNull();
    expect(node.children).toHaveLength(0);
  });

  it('addChild sets parent and appends to children', () => {
    const parent = new ModelNode('parent');
    const child = new ModelNode('child');
    parent.addChild(child);
    expect(child.parent).toBe(parent);
    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]).toBe(child);
  });

  it('updateWorldMatrix computes identity when no transform applied', () => {
    const node = new ModelNode();
    node.updateWorldMatrix();
    // Identity check: diagonal is 1, rest is 0
    expect(node.worldMatrix[0]).toBeCloseTo(1);
    expect(node.worldMatrix[5]).toBeCloseTo(1);
    expect(node.worldMatrix[10]).toBeCloseTo(1);
    expect(node.worldMatrix[15]).toBeCloseTo(1);
    expect(node.worldMatrix[12]).toBeCloseTo(0);
    expect(node.worldMatrix[13]).toBeCloseTo(0);
    expect(node.worldMatrix[14]).toBeCloseTo(0);
  });

  it('updateWorldMatrix applies translation', () => {
    const node = new ModelNode();
    node.translation[0] = 5;
    node.translation[1] = 10;
    node.translation[2] = 15;
    node.updateWorldMatrix();
    // Column-major: translation is at indices 12, 13, 14
    expect(node.worldMatrix[12]).toBeCloseTo(5);
    expect(node.worldMatrix[13]).toBeCloseTo(10);
    expect(node.worldMatrix[14]).toBeCloseTo(15);
  });

  it('updateWorldMatrix propagates to children', () => {
    const parent = new ModelNode('parent');
    const child = new ModelNode('child');
    parent.addChild(child);

    parent.translation[0] = 10;
    child.translation[1] = 5;

    parent.updateWorldMatrix();

    // Child world matrix should combine parent X=10 and child Y=5
    expect(child.worldMatrix[12]).toBeCloseTo(10);
    expect(child.worldMatrix[13]).toBeCloseTo(5);
    expect(child.worldMatrix[14]).toBeCloseTo(0);
  });

  it('updateWorldMatrix with parentMatrix parameter', () => {
    const node = new ModelNode();
    node.translation[0] = 3;

    const parentMatrix = Mat4.identity();
    parentMatrix[12] = 7; // parent translation X

    node.updateWorldMatrix(parentMatrix);
    expect(node.worldMatrix[12]).toBeCloseTo(10); // 7 + 3
  });

  it('updateWorldMatrix with scale', () => {
    const parent = new ModelNode('parent');
    const child = new ModelNode('child');
    parent.addChild(child);

    parent.scale[0] = 2;
    parent.scale[1] = 2;
    parent.scale[2] = 2;
    child.translation[0] = 5;

    parent.updateWorldMatrix();

    // Child translation should be scaled by parent: 5 * 2 = 10
    expect(child.worldMatrix[12]).toBeCloseTo(10);
  });
});

// ────────────────── ModelMesh / ModelPrimitive ──────────────────

describe('ModelMesh', () => {
  it('creates with empty primitives by default', () => {
    const mesh = new ModelMesh();
    expect(mesh.primitives).toHaveLength(0);
  });

  it('creates with given primitives', () => {
    const p = new ModelPrimitive({ positions: new Float32Array(9) });
    const mesh = new ModelMesh([p]);
    expect(mesh.primitives).toHaveLength(1);
  });
});

describe('ModelPrimitive', () => {
  it('vertexCount from positions', () => {
    const prim = new ModelPrimitive({
      positions: new Float32Array(9), // 3 vertices * 3 components
    });
    expect(prim.vertexCount).toBe(3);
  });

  it('indexCount from indices', () => {
    const prim = new ModelPrimitive({
      positions: new Float32Array(9),
      indices: new Uint16Array([0, 1, 2]),
    });
    expect(prim.indexCount).toBe(3);
  });

  it('indexCount is 0 when no indices', () => {
    const prim = new ModelPrimitive({
      positions: new Float32Array(9),
    });
    expect(prim.indexCount).toBe(0);
  });

  it('defaults materialIndex to 0 and mode to 4', () => {
    const prim = new ModelPrimitive({
      positions: new Float32Array(3),
    });
    expect(prim.materialIndex).toBe(0);
    expect(prim.mode).toBe(4);
  });

  it('stores optional attributes', () => {
    const normals = new Float32Array([0, 1, 0]);
    const uvs = new Float32Array([0.5, 0.5]);
    const tangents = new Float32Array([1, 0, 0, 1]);
    const prim = new ModelPrimitive({
      positions: new Float32Array(3),
      normals,
      uvs,
      tangents,
      materialIndex: 2,
      mode: 1,
    });
    expect(prim.normals).toBe(normals);
    expect(prim.uvs).toBe(uvs);
    expect(prim.tangents).toBe(tangents);
    expect(prim.materialIndex).toBe(2);
    expect(prim.mode).toBe(1);
  });
});

// ────────────────── ModelAnimation ──────────────────

describe('ModelAnimation', () => {
  it('starts with default values', () => {
    const anim = new ModelAnimation('walk');
    expect(anim.name).toBe('walk');
    expect(anim.playing).toBe(false);
    expect(anim.currentTime).toBe(0);
    expect(anim.loop).toBe(true);
    expect(anim.duration).toBe(0);
  });

  it('play/pause/stop control playing state', () => {
    const anim = new ModelAnimation();
    anim.play();
    expect(anim.playing).toBe(true);
    anim.pause();
    expect(anim.playing).toBe(false);
    expect(anim.currentTime).toBe(0); // pause keeps currentTime
    anim.play();
    anim.duration = 10;
    anim.update(3);
    anim.stop();
    expect(anim.playing).toBe(false);
    expect(anim.currentTime).toBe(0); // stop resets currentTime
  });

  it('update advances currentTime', () => {
    const anim = new ModelAnimation();
    anim.duration = 10;
    anim.play();
    anim.update(2.5);
    expect(anim.currentTime).toBeCloseTo(2.5);
    anim.update(1.5);
    expect(anim.currentTime).toBeCloseTo(4.0);
  });

  it('loop wraps time around duration', () => {
    const anim = new ModelAnimation();
    anim.duration = 5;
    anim.loop = true;
    anim.play();
    anim.update(7);
    expect(anim.currentTime).toBeCloseTo(2); // 7 % 5 = 2
  });

  it('non-loop clamps time at duration', () => {
    const anim = new ModelAnimation();
    anim.duration = 5;
    anim.loop = false;
    anim.play();
    anim.update(8);
    expect(anim.currentTime).toBeCloseTo(5);
  });

  it('does not advance when not playing', () => {
    const anim = new ModelAnimation();
    anim.duration = 10;
    anim.update(5);
    expect(anim.currentTime).toBe(0);
  });

  it('does not advance when duration is 0', () => {
    const anim = new ModelAnimation();
    anim.play();
    anim.update(5);
    expect(anim.currentTime).toBe(0);
  });
});

// ────────────────── AnimationSampler ──────────────────

describe('AnimationSampler', () => {
  it('evaluate at keyframe returns exact value', () => {
    const input = new Float32Array([0, 1, 2]);
    const output = new Float32Array([10, 20, 30, 40, 50, 60, 70, 80, 90]);
    const sampler = new AnimationSampler(input, output, 3, 'LINEAR');

    const v0 = sampler.evaluate(0);
    expect(v0[0]).toBeCloseTo(10);
    expect(v0[1]).toBeCloseTo(20);
    expect(v0[2]).toBeCloseTo(30);

    const v2 = sampler.evaluate(2);
    expect(v2[0]).toBeCloseTo(70);
    expect(v2[1]).toBeCloseTo(80);
    expect(v2[2]).toBeCloseTo(90);
  });

  it('evaluate between keyframes interpolates linearly', () => {
    const input = new Float32Array([0, 1]);
    const output = new Float32Array([0, 0, 0, 10, 20, 30]);
    const sampler = new AnimationSampler(input, output, 3, 'LINEAR');

    const v = sampler.evaluate(0.5);
    expect(v[0]).toBeCloseTo(5);
    expect(v[1]).toBeCloseTo(10);
    expect(v[2]).toBeCloseTo(15);
  });

  it('STEP interpolation returns previous value', () => {
    const input = new Float32Array([0, 1]);
    const output = new Float32Array([100, 200, 300, 400, 500, 600]);
    const sampler = new AnimationSampler(input, output, 3, 'STEP');

    const v = sampler.evaluate(0.9);
    expect(v[0]).toBeCloseTo(100);
    expect(v[1]).toBeCloseTo(200);
    expect(v[2]).toBeCloseTo(300);
  });

  it('before first keyframe returns first value', () => {
    const input = new Float32Array([1, 2]);
    const output = new Float32Array([10, 20, 30, 40, 50, 60]);
    const sampler = new AnimationSampler(input, output, 3, 'LINEAR');

    const v = sampler.evaluate(0);
    expect(v[0]).toBeCloseTo(10);
    expect(v[1]).toBeCloseTo(20);
    expect(v[2]).toBeCloseTo(30);
  });

  it('after last keyframe returns last value', () => {
    const input = new Float32Array([0, 1]);
    const output = new Float32Array([10, 20, 30, 40, 50, 60]);
    const sampler = new AnimationSampler(input, output, 3, 'LINEAR');

    const v = sampler.evaluate(5);
    expect(v[0]).toBeCloseTo(40);
    expect(v[1]).toBeCloseTo(50);
    expect(v[2]).toBeCloseTo(60);
  });

  it('empty input returns zero array', () => {
    const sampler = new AnimationSampler(
      new Float32Array(0),
      new Float32Array(0),
      3,
    );
    const v = sampler.evaluate(0);
    expect(v.length).toBe(3);
    expect(v[0]).toBe(0);
  });

  it('single keyframe returns that value regardless of time', () => {
    const input = new Float32Array([0.5]);
    const output = new Float32Array([7, 8, 9]);
    const sampler = new AnimationSampler(input, output, 3, 'LINEAR');

    const v = sampler.evaluate(999);
    expect(v[0]).toBeCloseTo(7);
    expect(v[1]).toBeCloseTo(8);
    expect(v[2]).toBeCloseTo(9);
  });

  it('quaternion slerp for 4-component output', () => {
    // Slerp between identity (0,0,0,1) and 90-degree rotation around Y
    const halfAngle = Math.PI / 4; // 45 degrees half-angle for 90 degrees
    const input = new Float32Array([0, 1]);
    const output = new Float32Array([
      0, 0, 0, 1,  // identity
      0, Math.sin(halfAngle), 0, Math.cos(halfAngle), // 90 degrees around Y
    ]);
    const sampler = new AnimationSampler(input, output, 4, 'LINEAR');

    // At t=0.5, slerp should give 45-degree rotation around Y
    const v = sampler.evaluate(0.5);
    // The result should be a valid quaternion close to 22.5 deg around Y
    const qLen = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2] + v[3] * v[3]);
    expect(qLen).toBeCloseTo(1, 4); // normalized
  });
});

// ────────────────── AnimationChannel ──────────────────

describe('AnimationChannel', () => {
  it('evaluate updates target node translation', () => {
    const node = new ModelNode('target');
    const input = new Float32Array([0, 1]);
    const output = new Float32Array([0, 0, 0, 10, 20, 30]);
    const sampler = new AnimationSampler(input, output, 3, 'LINEAR');
    const channel = new AnimationChannel(node, 'translation', sampler);

    channel.evaluate(0.5);
    expect(node.translation[0]).toBeCloseTo(5);
    expect(node.translation[1]).toBeCloseTo(10);
    expect(node.translation[2]).toBeCloseTo(15);
  });

  it('evaluate updates target node scale', () => {
    const node = new ModelNode('target');
    const input = new Float32Array([0, 1]);
    const output = new Float32Array([1, 1, 1, 2, 3, 4]);
    const sampler = new AnimationSampler(input, output, 3, 'LINEAR');
    const channel = new AnimationChannel(node, 'scale', sampler);

    channel.evaluate(1);
    expect(node.scale[0]).toBeCloseTo(2);
    expect(node.scale[1]).toBeCloseTo(3);
    expect(node.scale[2]).toBeCloseTo(4);
  });
});

// ────────────────── ModelSkin ──────────────────

describe('ModelSkin', () => {
  it('jointCount returns correct count', () => {
    const j0 = new ModelNode('j0');
    const j1 = new ModelNode('j1');
    const ibm0 = Mat4.identity();
    const ibm1 = Mat4.identity();
    const skin = new ModelSkin([j0, j1], [ibm0, ibm1]);
    expect(skin.jointCount).toBe(2);
  });

  it('jointMatrices buffer has correct size', () => {
    const j0 = new ModelNode('j0');
    const skin = new ModelSkin([j0], [Mat4.identity()]);
    expect(skin.jointMatrices.length).toBe(16);
  });

  it('update computes joint matrices correctly', () => {
    const joint = new ModelNode('joint');
    joint.translation[0] = 5;
    joint.updateWorldMatrix();

    const ibm = Mat4.identity();
    const skin = new ModelSkin([joint], [ibm]);
    skin.update();

    // jointMatrix = worldMatrix * ibm = translate(5,0,0) * identity
    // Column-major: translation X at index 12
    expect(skin.jointMatrices[12]).toBeCloseTo(5);
    expect(skin.jointMatrices[0]).toBeCloseTo(1);
    expect(skin.jointMatrices[5]).toBeCloseTo(1);
    expect(skin.jointMatrices[10]).toBeCloseTo(1);
    expect(skin.jointMatrices[15]).toBeCloseTo(1);
  });

  it('update with inverse bind matrix', () => {
    const joint = new ModelNode('joint');
    joint.translation[0] = 10;
    joint.updateWorldMatrix();

    // IBM that translates by -10 on X (inverse of the bind pose)
    const ibm = Mat4.identity();
    ibm[12] = -10;

    const skin = new ModelSkin([joint], [ibm]);
    skin.update();

    // jointMatrix = worldMatrix * ibm = translate(10) * translate(-10) = identity
    expect(skin.jointMatrices[12]).toBeCloseTo(0);
    expect(skin.jointMatrices[0]).toBeCloseTo(1);
    expect(skin.jointMatrices[15]).toBeCloseTo(1);
  });
});

// ────────────────── ModelBuilder ──────────────────

describe('ModelBuilder', () => {
  /**
   * Helper: create a minimal GltfDocument with inline binary data
   * for a single triangle mesh.
   */
  function createMinimalDoc(): GltfDocument {
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
      nodes: [{ name: 'root', mesh: 0, translation: [1, 2, 3] }],
      meshes: [
        {
          primitives: [
            {
              attributes: { POSITION: 0 },
              indices: 1,
              material: 0,
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

    return new GltfDocument(json as any, [buffer]);
  }

  it('builds rootNodes from scene', () => {
    const doc = createMinimalDoc();
    const data = ModelBuilder.build(doc);
    expect(data.rootNodes).toHaveLength(1);
    expect(data.rootNodes[0].name).toBe('root');
  });

  it('builds allNodes from nodes array', () => {
    const doc = createMinimalDoc();
    const data = ModelBuilder.build(doc);
    expect(data.allNodes).toHaveLength(1);
  });

  it('applies node translation', () => {
    const doc = createMinimalDoc();
    const data = ModelBuilder.build(doc);
    const node = data.rootNodes[0];
    expect(node.translation[0]).toBeCloseTo(1);
    expect(node.translation[1]).toBeCloseTo(2);
    expect(node.translation[2]).toBeCloseTo(3);
  });

  it('builds meshes with primitives', () => {
    const doc = createMinimalDoc();
    const data = ModelBuilder.build(doc);
    expect(data.meshes).toHaveLength(1);
    expect(data.meshes[0].primitives).toHaveLength(1);
    expect(data.meshes[0].primitives[0].vertexCount).toBe(3);
    expect(data.meshes[0].primitives[0].indexCount).toBe(3);
  });

  it('builds materials', () => {
    const doc = createMinimalDoc();
    const data = ModelBuilder.build(doc);
    expect(data.materials).toHaveLength(1);
    expect(data.materials[0].params.baseColorFactor[0]).toBeCloseTo(1);
  });

  it('provides default material when none specified', () => {
    const buffer = new ArrayBuffer(36);
    new Float32Array(buffer, 0, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const json = {
      asset: { version: '2.0' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [
        {
          primitives: [
            { attributes: { POSITION: 0 } },
          ],
        },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      ],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
      buffers: [{ byteLength: 36 }],
    };
    const doc = new GltfDocument(json as any, [buffer]);
    const data = ModelBuilder.build(doc);
    expect(data.materials).toHaveLength(1); // default material
  });

  it('assigns mesh to node', () => {
    const doc = createMinimalDoc();
    const data = ModelBuilder.build(doc);
    expect(data.rootNodes[0].mesh).not.toBeNull();
    expect(data.rootNodes[0].mesh!.primitives[0].positions.length).toBe(9);
  });

  it('sets up parent-child relationships', () => {
    const buffer = new ArrayBuffer(36);
    new Float32Array(buffer, 0, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const json = {
      asset: { version: '2.0' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [
        { name: 'parent', children: [1] },
        { name: 'child', mesh: 0 },
      ],
      meshes: [
        {
          primitives: [
            { attributes: { POSITION: 0 } },
          ],
        },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      ],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
      buffers: [{ byteLength: 36 }],
    };
    const doc = new GltfDocument(json as any, [buffer]);
    const data = ModelBuilder.build(doc);
    expect(data.allNodes[0].children).toHaveLength(1);
    expect(data.allNodes[1].parent).toBe(data.allNodes[0]);
  });

  it('computes world matrices during build', () => {
    const doc = createMinimalDoc();
    const data = ModelBuilder.build(doc);
    const node = data.rootNodes[0];
    // translation [1,2,3] should appear in worldMatrix
    expect(node.worldMatrix[12]).toBeCloseTo(1);
    expect(node.worldMatrix[13]).toBeCloseTo(2);
    expect(node.worldMatrix[14]).toBeCloseTo(3);
  });
});
