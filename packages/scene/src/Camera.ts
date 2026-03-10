import { Vec3, type Vec3Type, Mat4, type Mat4Type, VelMath } from '@vellusion/math';

/**
 * Abstract base class for cameras. Manages position, orientation, and
 * the view/projection/viewProjection matrices used by the renderer.
 *
 * Coordinate convention: right-handed world space, camera looks down -Z.
 */
export abstract class Camera {
  readonly position: Vec3Type = Vec3.zero();
  readonly direction: Vec3Type = Vec3.create(0, 0, -1);
  readonly up: Vec3Type = Vec3.create(0, 1, 0);
  readonly right: Vec3Type = Vec3.create(1, 0, 0);

  readonly viewMatrix: Mat4Type = Mat4.identity();
  readonly projectionMatrix: Mat4Type = Mat4.identity();
  readonly viewProjectionMatrix: Mat4Type = Mat4.identity();

  /** Subclasses must fill `this.projectionMatrix`. */
  abstract updateProjectionMatrix(): void;

  /** Recompute the view matrix from position, direction, and up. */
  updateViewMatrix(): void {
    const target = Vec3.zero();
    Vec3.add(this.position, this.direction, target);
    Mat4.lookAt(this.position, target, this.up, this.viewMatrix);
  }

  /** Recompute view, projection, and the combined viewProjection matrix. */
  update(): void {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
    Mat4.multiply(this.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);
  }

  /** Set the camera position. */
  setPosition(x: number, y: number, z: number): void {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
  }

  /**
   * Orient the camera to look at the given target point.
   * Recomputes direction, right, and up vectors.
   */
  lookAtTarget(target: Vec3Type): void {
    Vec3.subtract(target, this.position, this.direction);
    Vec3.normalize(this.direction, this.direction);

    // Recompute right = direction x worldUp
    Vec3.cross(this.direction, Vec3.create(0, 1, 0), this.right);
    Vec3.normalize(this.right, this.right);

    // Recompute up = right x direction
    Vec3.cross(this.right, this.direction, this.up);
    Vec3.normalize(this.up, this.up);
  }
}

/**
 * Perspective camera with a vertical field-of-view, aspect ratio,
 * and near/far clipping planes.
 */
export class PerspectiveCamera extends Camera {
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(
    fov: number = VelMath.toRadians(60),
    aspect: number = 1,
    near: number = 0.1,
    far: number = 10000,
  ) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  updateProjectionMatrix(): void {
    Mat4.computePerspectiveFieldOfView(
      this.fov, this.aspect, this.near, this.far, this.projectionMatrix,
    );
  }
}

/**
 * Orthographic camera defined by left/right/bottom/top/near/far bounds.
 *
 * Boundary properties use the `ortho` prefix to avoid conflicts with the
 * inherited `right` (Vec3Type) property from Camera.
 */
export class OrthographicCamera extends Camera {
  left: number;
  orthoRight: number;
  bottom: number;
  orthoTop: number;
  near: number;
  far: number;

  constructor(
    left: number = -1,
    right: number = 1,
    bottom: number = -1,
    top: number = 1,
    near: number = 0.1,
    far: number = 1000,
  ) {
    super();
    this.left = left;
    this.orthoRight = right;
    this.bottom = bottom;
    this.orthoTop = top;
    this.near = near;
    this.far = far;
  }

  updateProjectionMatrix(): void {
    Mat4.computeOrthographic(
      this.left, this.orthoRight, this.bottom, this.orthoTop,
      this.near, this.far, this.projectionMatrix,
    );
  }
}
