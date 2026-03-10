import { Mat4, type Mat4Type } from '@vellusion/math';
import { Vec3, type Vec3Type } from '@vellusion/math';
import { Quaternion, type QuaternionType } from '@vellusion/math';

let nextId = 0;

export class SceneNode {
  readonly id: string;
  name: string;
  visible: boolean = true;

  // Separate TRS components for the local transform
  private _position: Vec3Type;
  private _rotation: QuaternionType;
  private _scale: Vec3Type;
  private _localMatrixDirty: boolean = true;

  readonly localMatrix: Mat4Type = Mat4.identity();
  readonly worldMatrix: Mat4Type = Mat4.identity();

  parent: SceneNode | null = null;
  readonly children: SceneNode[] = [];

  constructor(name?: string) {
    this.id = `node_${nextId++}`;
    this.name = name ?? this.id;
    this._position = Vec3.zero();
    this._rotation = Quaternion.identity();
    this._scale = Vec3.create(1, 1, 1);
  }

  addChild(child: SceneNode): void {
    if (child.parent) child.removeFromParent();
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child: SceneNode): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  removeFromParent(): void {
    if (this.parent) this.parent.removeChild(this);
  }

  setPosition(x: number, y: number, z: number): void {
    this._position[0] = x; this._position[1] = y; this._position[2] = z;
    this._localMatrixDirty = true;
  }

  getPosition(result: Vec3Type): Vec3Type {
    result[0] = this._position[0];
    result[1] = this._position[1];
    result[2] = this._position[2];
    return result;
  }

  setRotation(q: QuaternionType): void {
    this._rotation[0] = q[0]; this._rotation[1] = q[1];
    this._rotation[2] = q[2]; this._rotation[3] = q[3];
    this._localMatrixDirty = true;
  }

  setScale(x: number, y: number, z: number): void {
    this._scale[0] = x; this._scale[1] = y; this._scale[2] = z;
    this._localMatrixDirty = true;
  }

  updateWorldMatrix(parentWorldMatrix?: Mat4Type): void {
    if (this._localMatrixDirty) {
      Mat4.fromTranslationRotationScale(
        this._position, this._rotation, this._scale, this.localMatrix,
      );
      this._localMatrixDirty = false;
    }

    if (parentWorldMatrix) {
      Mat4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // Copy local to world
      this.worldMatrix.set(this.localMatrix);
    }

    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }

  traverse(callback: (node: SceneNode) => void): void {
    callback(this);
    for (const child of this.children) {
      child.traverse(callback);
    }
  }

  find(name: string): SceneNode | undefined {
    if (this.name === name) return this;
    for (const child of this.children) {
      const found = child.find(name);
      if (found) return found;
    }
    return undefined;
  }
}
