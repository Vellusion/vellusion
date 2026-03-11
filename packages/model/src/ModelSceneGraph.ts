import { Mat4, Vec3, Quaternion } from '@vellusion/math';
import type { Mat4Type, Vec3Type, QuaternionType } from '@vellusion/math';

export class ModelNode {
  name?: string;
  children: ModelNode[] = [];
  parent: ModelNode | null = null;
  localMatrix: Mat4Type;
  worldMatrix: Mat4Type;
  mesh: ModelMesh | null = null;
  skinIndex: number = -1;

  // TRS
  translation: Vec3Type;
  rotation: QuaternionType;
  scale: Vec3Type;

  constructor(name?: string) {
    this.name = name;
    this.localMatrix = Mat4.identity();
    this.worldMatrix = Mat4.identity();
    this.translation = Vec3.zero();
    this.rotation = Quaternion.identity();
    this.scale = Vec3.create(1, 1, 1);
  }

  addChild(child: ModelNode): void {
    child.parent = this;
    this.children.push(child);
  }

  /**
   * Recompute localMatrix from TRS, then worldMatrix = parent.world * local
   */
  updateWorldMatrix(parentMatrix?: Mat4Type): void {
    // Build local from TRS
    Mat4.fromTranslationRotationScale(
      this.translation,
      this.rotation,
      this.scale,
      this.localMatrix,
    );

    if (parentMatrix) {
      Mat4.multiply(parentMatrix, this.localMatrix, this.worldMatrix);
    } else {
      this.worldMatrix.set(this.localMatrix);
    }

    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }
}

export class ModelMesh {
  name?: string;
  primitives: ModelPrimitive[];

  constructor(primitives: ModelPrimitive[] = []) {
    this.primitives = primitives;
  }
}

export class ModelPrimitive {
  positions: Float32Array;
  normals: Float32Array | null;
  uvs: Float32Array | null;
  tangents: Float32Array | null;
  indices: Uint16Array | Uint32Array | null;
  materialIndex: number;
  mode: number; // 4 = TRIANGLES

  constructor(options: {
    positions: Float32Array;
    normals?: Float32Array;
    uvs?: Float32Array;
    tangents?: Float32Array;
    indices?: Uint16Array | Uint32Array;
    materialIndex?: number;
    mode?: number;
  }) {
    this.positions = options.positions;
    this.normals = options.normals ?? null;
    this.uvs = options.uvs ?? null;
    this.tangents = options.tangents ?? null;
    this.indices = options.indices ?? null;
    this.materialIndex = options.materialIndex ?? 0;
    this.mode = options.mode ?? 4;
  }

  get vertexCount(): number {
    return this.positions.length / 3;
  }

  get indexCount(): number {
    return this.indices?.length ?? 0;
  }
}
