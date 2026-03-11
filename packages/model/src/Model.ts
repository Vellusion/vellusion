import type { Mat4Type, Vec3Type } from '@vellusion/math';
import { Mat4 } from '@vellusion/math';
import type { ModelNode } from './ModelSceneGraph';
import type { ModelAnimation } from './ModelAnimation';
import type { ModelSkin } from './ModelSkin';
import type { PbrMaterial } from './PbrMaterial';
import { ModelBuilder } from './ModelBuilder';
import { GltfParser } from './gltf/GltfParser';

export class Model {
  readonly rootNodes: ModelNode[];
  readonly allNodes: ModelNode[];
  readonly animations: ModelAnimation[];
  readonly skins: ModelSkin[];
  readonly materials: PbrMaterial[];
  show: boolean = true;
  modelMatrix: Mat4Type;

  constructor(options: {
    rootNodes: ModelNode[];
    allNodes: ModelNode[];
    animations: ModelAnimation[];
    skins: ModelSkin[];
    materials: PbrMaterial[];
  }) {
    this.rootNodes = options.rootNodes;
    this.allNodes = options.allNodes;
    this.animations = options.animations;
    this.skins = options.skins;
    this.materials = options.materials;
    this.modelMatrix = Mat4.identity();
  }

  /**
   * Create Model from glTF JSON + buffers.
   */
  static fromGltf(json: any, buffers: ArrayBuffer[] = []): Model {
    const doc = GltfParser.parseGltf(json, buffers);
    const data = ModelBuilder.build(doc);
    return new Model(data);
  }

  /**
   * Create Model from GLB binary data.
   */
  static fromGlb(data: ArrayBuffer): Model {
    const doc = GltfParser.parseGlb(data);
    const modelData = ModelBuilder.build(doc);
    return new Model(modelData);
  }

  /**
   * Advance all playing animations.
   */
  updateAnimations(deltaTime: number): void {
    for (const anim of this.animations) {
      anim.update(deltaTime);
    }
    // Update world matrices after animation
    for (const root of this.rootNodes) {
      root.updateWorldMatrix();
    }
    // Update skins
    for (const skin of this.skins) {
      skin.update();
    }
  }

  /**
   * Get all primitives from all mesh nodes (for rendering).
   */
  get allPrimitives(): { node: ModelNode; primitiveIndex: number }[] {
    const result: { node: ModelNode; primitiveIndex: number }[] = [];
    const stack = [...this.rootNodes];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.mesh) {
        for (let i = 0; i < node.mesh.primitives.length; i++) {
          result.push({ node, primitiveIndex: i });
        }
      }
      stack.push(...node.children);
    }
    return result;
  }
}
