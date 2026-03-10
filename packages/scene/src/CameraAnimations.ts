import { Camera } from './Camera';
import { Vec3, type Vec3Type } from '@vellusion/math';
import { type BoundingSphereType } from '@vellusion/math';

export interface FlyToOptions {
  destination: Vec3Type;
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
  duration?: number;     // seconds, default 3.0
  onComplete?: () => void;
}

interface ActiveAnimation {
  startPosition: Vec3Type;
  startDirection: Vec3Type;
  startUp: Vec3Type;
  endPosition: Vec3Type;
  endDirection: Vec3Type;
  endUp: Vec3Type;
  duration: number;
  elapsed: number;
  onComplete?: () => void;
}

export class CameraAnimations {
  private _camera: Camera;
  private _animation: ActiveAnimation | null = null;

  constructor(camera: Camera) {
    this._camera = camera;
  }

  flyTo(options: FlyToOptions): void {
    const duration = options.duration ?? 3.0;
    const dest = options.destination;

    // Compute end direction: if orientation given, use it; otherwise look at origin
    let endDir = Vec3.create(0, 0, -1);
    let endUp = Vec3.create(0, 1, 0);

    // Store start state
    this._animation = {
      startPosition: Vec3.clone(this._camera.position),
      startDirection: Vec3.clone(this._camera.direction),
      startUp: Vec3.clone(this._camera.up),
      endPosition: Vec3.clone(dest),
      endDirection: endDir,
      endUp: endUp,
      duration,
      elapsed: 0,
      onComplete: options.onComplete,
    };
  }

  lookAt(target: Vec3Type, offset?: Vec3Type): void {
    // Instantly point camera at target
    if (offset) {
      Vec3.add(target, offset, this._camera.position);
    }
    this._camera.lookAtTarget(target);
    this._camera.update();
  }

  zoomTo(boundingSphere: BoundingSphereType, offset?: number): void {
    const mult = offset ?? 2.0;
    const dist = boundingSphere.radius * mult;
    // Position camera at center + direction * dist
    const pos = Vec3.clone(boundingSphere.center);
    pos[2] += dist; // offset along Z
    this.flyTo({ destination: pos, duration: 1.5 });
  }

  setView(position: Vec3Type, heading?: number, pitch?: number, roll?: number): void {
    this._camera.position[0] = position[0];
    this._camera.position[1] = position[1];
    this._camera.position[2] = position[2];
    this._camera.update();
  }

  update(deltaTime: number): void {
    if (!this._animation) return;

    this._animation.elapsed += deltaTime;
    let t = Math.min(this._animation.elapsed / this._animation.duration, 1.0);

    // Ease in-out (smoothstep)
    t = t * t * (3 - 2 * t);

    // Interpolate position
    Vec3.lerp(
      this._animation.startPosition,
      this._animation.endPosition,
      t,
      this._camera.position,
    );

    // Interpolate direction
    Vec3.lerp(
      this._animation.startDirection,
      this._animation.endDirection,
      t,
      this._camera.direction,
    );
    Vec3.normalize(this._camera.direction, this._camera.direction);

    // Interpolate up
    Vec3.lerp(
      this._animation.startUp,
      this._animation.endUp,
      t,
      this._camera.up,
    );
    Vec3.normalize(this._camera.up, this._camera.up);

    this._camera.update();

    if (t >= 1.0) {
      const cb = this._animation.onComplete;
      this._animation = null;
      cb?.();
    }
  }

  cancelAnimation(): void {
    this._animation = null;
  }

  get isAnimating(): boolean {
    return this._animation !== null;
  }
}
