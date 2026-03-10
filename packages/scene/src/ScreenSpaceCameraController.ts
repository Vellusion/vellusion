// ---------------------------------------------------------------------------
// ScreenSpaceCameraController — orbit-style camera controller that translates
// mouse/touch input into camera movement (rotation, zoom, pan).
// ---------------------------------------------------------------------------

import { Vec3, type Vec3Type } from '@vellusion/math';
import { Camera } from './Camera';
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type MoveEvent,
  type ScreenSpacePosition,
  type WheelEventData,
} from './ScreenSpaceEventHandler';

export interface CameraControllerOptions {
  enableRotate?: boolean;
  enableZoom?: boolean;
  enableTranslate?: boolean;
  minimumZoomDistance?: number;
  maximumZoomDistance?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
  translateSpeed?: number;
  inertiaEnabled?: boolean;
  inertiaDuration?: number;
}

/**
 * Orbit-style camera controller. Listens to mouse events via a
 * `ScreenSpaceEventHandler` and manipulates a `Camera` accordingly.
 *
 * - **Left drag** — orbit (rotate heading/pitch around a target point)
 * - **Right drag** — pan (translate along camera right/up)
 * - **Scroll wheel** — zoom (move along camera direction)
 */
export class ScreenSpaceCameraController {
  enableRotate: boolean;
  enableZoom: boolean;
  enableTranslate: boolean;
  minimumZoomDistance: number;
  maximumZoomDistance: number;
  rotateSpeed: number;
  zoomSpeed: number;
  translateSpeed: number;
  inertiaEnabled: boolean;
  inertiaDuration: number;

  private _camera: Camera;
  private _eventHandler: ScreenSpaceEventHandler;

  // Orbit / pan state
  private _isRotating: boolean = false;
  private _isTranslating: boolean = false;
  private _rotateVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private _translateVelocity: { x: number; y: number } = { x: 0, y: 0 };

  // Scratch vectors — reused to avoid per-frame allocations
  private _scratch: Vec3Type = Vec3.zero();

  constructor(
    camera: Camera,
    eventHandler: ScreenSpaceEventHandler,
    options?: CameraControllerOptions,
  ) {
    this._camera = camera;
    this._eventHandler = eventHandler;

    const o = options ?? {};
    this.enableRotate = o.enableRotate ?? true;
    this.enableZoom = o.enableZoom ?? true;
    this.enableTranslate = o.enableTranslate ?? true;
    this.minimumZoomDistance = o.minimumZoomDistance ?? 1;
    this.maximumZoomDistance = o.maximumZoomDistance ?? Infinity;
    this.rotateSpeed = o.rotateSpeed ?? 0.005;
    this.zoomSpeed = o.zoomSpeed ?? 0.1;
    this.translateSpeed = o.translateSpeed ?? 0.01;
    this.inertiaEnabled = o.inertiaEnabled ?? true;
    this.inertiaDuration = o.inertiaDuration ?? 0.3;

    this._setupInputActions();
  }

  // -------------------------------------------------------------------------
  // Public
  // -------------------------------------------------------------------------

  /**
   * Advance the controller by `deltaTime` seconds.
   * Applies inertia decay and any residual velocity to the camera.
   */
  update(deltaTime: number): void {
    if (!this.inertiaEnabled) return;

    const decay = Math.exp(-deltaTime / this.inertiaDuration);

    // Apply rotation inertia
    if (!this._isRotating && (this._rotateVelocity.x !== 0 || this._rotateVelocity.y !== 0)) {
      this._applyRotation(this._rotateVelocity.x, this._rotateVelocity.y);
      this._rotateVelocity.x *= decay;
      this._rotateVelocity.y *= decay;

      // Clamp near-zero velocities to zero
      if (Math.abs(this._rotateVelocity.x) < 1e-6) this._rotateVelocity.x = 0;
      if (Math.abs(this._rotateVelocity.y) < 1e-6) this._rotateVelocity.y = 0;
    }

    // Apply translation inertia
    if (!this._isTranslating && (this._translateVelocity.x !== 0 || this._translateVelocity.y !== 0)) {
      this._applyTranslation(this._translateVelocity.x, this._translateVelocity.y);
      this._translateVelocity.x *= decay;
      this._translateVelocity.y *= decay;

      if (Math.abs(this._translateVelocity.x) < 1e-6) this._translateVelocity.x = 0;
      if (Math.abs(this._translateVelocity.y) < 1e-6) this._translateVelocity.y = 0;
    }
  }

  /** Remove all event subscriptions from the handler. */
  destroy(): void {
    this._eventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
    this._eventHandler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
    this._eventHandler.removeInputAction(ScreenSpaceEventType.RIGHT_DOWN);
    this._eventHandler.removeInputAction(ScreenSpaceEventType.RIGHT_UP);
    this._eventHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    this._eventHandler.removeInputAction(ScreenSpaceEventType.WHEEL);
  }

  // -------------------------------------------------------------------------
  // Input wiring
  // -------------------------------------------------------------------------

  private _setupInputActions(): void {
    this._eventHandler.setInputAction(
      (_pos: ScreenSpacePosition) => { if (this.enableRotate) this._isRotating = true; },
      ScreenSpaceEventType.LEFT_DOWN,
    );

    this._eventHandler.setInputAction(
      (_pos: ScreenSpacePosition) => { this._isRotating = false; },
      ScreenSpaceEventType.LEFT_UP,
    );

    this._eventHandler.setInputAction(
      (_pos: ScreenSpacePosition) => { if (this.enableTranslate) this._isTranslating = true; },
      ScreenSpaceEventType.RIGHT_DOWN,
    );

    this._eventHandler.setInputAction(
      (_pos: ScreenSpacePosition) => { this._isTranslating = false; },
      ScreenSpaceEventType.RIGHT_UP,
    );

    this._eventHandler.setInputAction(
      (event: MoveEvent) => { this._handleMouseMove(event); },
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    this._eventHandler.setInputAction(
      (event: WheelEventData) => { this._handleWheel(event); },
      ScreenSpaceEventType.WHEEL,
    );
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private _handleMouseMove(event: MoveEvent): void {
    const dx = event.endPosition.x - event.startPosition.x;
    const dy = event.endPosition.y - event.startPosition.y;

    if (this._isRotating && this.enableRotate) {
      this._applyRotation(dx, dy);
      this._rotateVelocity.x = dx;
      this._rotateVelocity.y = dy;
    }

    if (this._isTranslating && this.enableTranslate) {
      this._applyTranslation(dx, dy);
      this._translateVelocity.x = dx;
      this._translateVelocity.y = dy;
    }
  }

  private _handleWheel(event: WheelEventData): void {
    if (!this.enableZoom) return;

    const zoomAmount = event.delta * this.zoomSpeed;
    const currentDistance = Vec3.magnitude(this._camera.position);

    // Positive delta = scroll down = zoom out (move away), negative = zoom in
    const newDistance = Math.max(
      this.minimumZoomDistance,
      Math.min(this.maximumZoomDistance, currentDistance + zoomAmount),
    );

    // moveAmount > 0 means we need to move *along* direction (toward target)
    // to reduce distance; moveAmount < 0 means move away
    const moveAmount = currentDistance - newDistance;

    // Move position along the camera direction
    Vec3.scale(this._camera.direction, moveAmount, this._scratch);
    Vec3.add(this._camera.position, this._scratch, this._camera.position);
  }

  // -------------------------------------------------------------------------
  // Camera manipulation
  // -------------------------------------------------------------------------

  /**
   * Orbit the camera around a target point derived from `position + direction * orbitDistance`.
   * `dx` controls heading (horizontal rotation), `dy` controls pitch (vertical rotation).
   */
  private _applyRotation(dx: number, dy: number): void {
    const cam = this._camera;
    const orbitDistance = Vec3.magnitude(cam.position);

    // Compute target = position + direction * orbitDistance
    const target = Vec3.zero();
    Vec3.scale(cam.direction, orbitDistance, target);
    Vec3.add(cam.position, target, target);

    // Horizontal rotation (heading): rotate around the world up axis (Y)
    const headingAngle = -dx * this.rotateSpeed;
    // Vertical rotation (pitch): rotate around the camera right axis
    const pitchAngle = -dy * this.rotateSpeed;

    // Offset from target to camera
    const offset = Vec3.zero();
    Vec3.subtract(cam.position, target, offset);

    // Apply heading rotation (around Y axis)
    const cosH = Math.cos(headingAngle);
    const sinH = Math.sin(headingAngle);
    const ox = offset[0];
    const oz = offset[2];
    offset[0] = ox * cosH - oz * sinH;
    offset[2] = ox * sinH + oz * cosH;

    // Apply pitch rotation (around camera right axis)
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);
    const rx = cam.right[0], ry = cam.right[1], rz = cam.right[2];

    // Rodrigues' rotation formula: v' = v*cos + (k x v)*sin + k*(k.v)*(1-cos)
    const dot = rx * offset[0] + ry * offset[1] + rz * offset[2];
    const crossX = ry * offset[2] - rz * offset[1];
    const crossY = rz * offset[0] - rx * offset[2];
    const crossZ = rx * offset[1] - ry * offset[0];

    offset[0] = offset[0] * cosP + crossX * sinP + rx * dot * (1 - cosP);
    offset[1] = offset[1] * cosP + crossY * sinP + ry * dot * (1 - cosP);
    offset[2] = offset[2] * cosP + crossZ * sinP + rz * dot * (1 - cosP);

    // New position = target + offset
    Vec3.add(target, offset, cam.position);

    // Re-orient camera to look at the target
    cam.lookAtTarget(target);
  }

  /**
   * Pan the camera: translate position along right and up vectors.
   */
  private _applyTranslation(dx: number, dy: number): void {
    const cam = this._camera;

    // Move right by -dx (drag left -> move right) and up by dy
    Vec3.scale(cam.right, -dx * this.translateSpeed, this._scratch);
    Vec3.add(cam.position, this._scratch, cam.position);

    Vec3.scale(cam.up, dy * this.translateSpeed, this._scratch);
    Vec3.add(cam.position, this._scratch, cam.position);
  }
}
