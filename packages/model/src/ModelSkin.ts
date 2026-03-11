import { Mat4 } from '@vellusion/math';
import type { Mat4Type } from '@vellusion/math';
import type { ModelNode } from './ModelSceneGraph';

export class ModelSkin {
  joints: ModelNode[];
  inverseBindMatrices: Mat4Type[];
  jointMatrices: Float32Array; // flattened 4x4 matrices for GPU upload

  constructor(joints: ModelNode[], inverseBindMatrices: Mat4Type[]) {
    this.joints = joints;
    this.inverseBindMatrices = inverseBindMatrices;
    this.jointMatrices = new Float32Array(joints.length * 16);
  }

  /**
   * Recompute joint matrices: jointMatrix[i] = joint[i].worldMatrix * inverseBindMatrices[i]
   */
  update(): void {
    const temp = Mat4.identity();
    for (let i = 0; i < this.joints.length; i++) {
      Mat4.multiply(this.joints[i].worldMatrix, this.inverseBindMatrices[i], temp);
      // Copy Float64Array temp into Float32Array jointMatrices
      for (let j = 0; j < 16; j++) {
        this.jointMatrices[i * 16 + j] = temp[j];
      }
    }
  }

  get jointCount(): number {
    return this.joints.length;
  }
}
