import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Vec3 } from '@vellusion/math';
import { ScreenSpaceEventType } from '../src/ScreenSpaceEventHandler';
import { ScreenSpaceCameraController } from '../src/ScreenSpaceCameraController';
import type { ScreenSpaceEventHandler } from '../src/ScreenSpaceEventHandler';
import type { Camera } from '../src/Camera';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockEventHandler() {
  const actions = new Map<ScreenSpaceEventType, Function>();
  return {
    setInputAction: vi.fn((cb: Function, type: ScreenSpaceEventType) => actions.set(type, cb)),
    removeInputAction: vi.fn((type: ScreenSpaceEventType) => actions.delete(type)),
    getInputAction: vi.fn((type: ScreenSpaceEventType) => actions.get(type)),
    destroy: vi.fn(),
    /** Fire a registered action in tests. */
    fireAction(type: ScreenSpaceEventType, event: any) {
      actions.get(type)?.(event);
    },
  } as unknown as ScreenSpaceEventHandler & {
    fireAction(type: ScreenSpaceEventType, event: any): void;
  };
}

function createMockCamera(): Camera {
  const position = Vec3.create(0, 0, 10);
  const direction = Vec3.create(0, 0, -1);
  const up = Vec3.create(0, 1, 0);
  const right = Vec3.create(1, 0, 0);

  return {
    position,
    direction,
    up,
    right,
    lookAtTarget: vi.fn((target) => {
      Vec3.subtract(target, position, direction);
      Vec3.normalize(direction, direction);

      Vec3.cross(direction, Vec3.create(0, 1, 0), right);
      Vec3.normalize(right, right);

      Vec3.cross(right, direction, up);
      Vec3.normalize(up, up);
    }),
  } as unknown as Camera;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScreenSpaceCameraController', () => {
  let handler: ReturnType<typeof createMockEventHandler>;
  let camera: Camera;
  let controller: ScreenSpaceCameraController;

  beforeEach(() => {
    handler = createMockEventHandler();
    camera = createMockCamera();
    controller = new ScreenSpaceCameraController(camera, handler);
  });

  // -----------------------------------------------------------------------
  // Constructor & event registration
  // -----------------------------------------------------------------------

  it('registers event handlers for LEFT_DOWN, LEFT_UP, RIGHT_DOWN, RIGHT_UP, MOUSE_MOVE, WHEEL', () => {
    const registeredTypes = (handler.setInputAction as ReturnType<typeof vi.fn>)
      .mock.calls.map((call: any[]) => call[1]);

    expect(registeredTypes).toContain(ScreenSpaceEventType.LEFT_DOWN);
    expect(registeredTypes).toContain(ScreenSpaceEventType.LEFT_UP);
    expect(registeredTypes).toContain(ScreenSpaceEventType.RIGHT_DOWN);
    expect(registeredTypes).toContain(ScreenSpaceEventType.RIGHT_UP);
    expect(registeredTypes).toContain(ScreenSpaceEventType.MOUSE_MOVE);
    expect(registeredTypes).toContain(ScreenSpaceEventType.WHEEL);
  });

  it('applies default option values', () => {
    expect(controller.enableRotate).toBe(true);
    expect(controller.enableZoom).toBe(true);
    expect(controller.enableTranslate).toBe(true);
    expect(controller.minimumZoomDistance).toBe(1);
    expect(controller.maximumZoomDistance).toBe(Infinity);
    expect(controller.rotateSpeed).toBe(0.005);
    expect(controller.zoomSpeed).toBe(0.1);
    expect(controller.translateSpeed).toBe(0.01);
    expect(controller.inertiaEnabled).toBe(true);
    expect(controller.inertiaDuration).toBe(0.3);
  });

  it('respects custom option values', () => {
    const custom = new ScreenSpaceCameraController(camera, handler, {
      enableRotate: false,
      enableZoom: false,
      enableTranslate: false,
      minimumZoomDistance: 5,
      maximumZoomDistance: 500,
      rotateSpeed: 0.01,
      zoomSpeed: 0.5,
      translateSpeed: 0.02,
      inertiaEnabled: false,
      inertiaDuration: 1.0,
    });

    expect(custom.enableRotate).toBe(false);
    expect(custom.enableZoom).toBe(false);
    expect(custom.enableTranslate).toBe(false);
    expect(custom.minimumZoomDistance).toBe(5);
    expect(custom.maximumZoomDistance).toBe(500);
    expect(custom.rotateSpeed).toBe(0.01);
    expect(custom.zoomSpeed).toBe(0.5);
    expect(custom.translateSpeed).toBe(0.02);
    expect(custom.inertiaEnabled).toBe(false);
    expect(custom.inertiaDuration).toBe(1.0);
  });

  // -----------------------------------------------------------------------
  // enableRotate = false
  // -----------------------------------------------------------------------

  it('enableRotate=false: rotation events are ignored', () => {
    controller.enableRotate = false;

    const posBefore = Vec3.clone(camera.position);

    // Start left drag
    handler.fireAction(ScreenSpaceEventType.LEFT_DOWN, { x: 100, y: 100 });
    handler.fireAction(ScreenSpaceEventType.MOUSE_MOVE, {
      startPosition: { x: 100, y: 100 },
      endPosition: { x: 150, y: 150 },
    });
    handler.fireAction(ScreenSpaceEventType.LEFT_UP, { x: 150, y: 150 });

    // Position should be unchanged
    expect(camera.position[0]).toBe(posBefore[0]);
    expect(camera.position[1]).toBe(posBefore[1]);
    expect(camera.position[2]).toBe(posBefore[2]);
  });

  // -----------------------------------------------------------------------
  // enableZoom = false
  // -----------------------------------------------------------------------

  it('enableZoom=false: wheel events are ignored', () => {
    controller.enableZoom = false;

    const posBefore = Vec3.clone(camera.position);

    handler.fireAction(ScreenSpaceEventType.WHEEL, {
      delta: 120,
      position: { x: 400, y: 300 },
    });

    expect(camera.position[0]).toBe(posBefore[0]);
    expect(camera.position[1]).toBe(posBefore[1]);
    expect(camera.position[2]).toBe(posBefore[2]);
  });

  // -----------------------------------------------------------------------
  // enableTranslate = false
  // -----------------------------------------------------------------------

  it('enableTranslate=false: translation events are ignored', () => {
    controller.enableTranslate = false;

    const posBefore = Vec3.clone(camera.position);

    handler.fireAction(ScreenSpaceEventType.RIGHT_DOWN, { x: 100, y: 100 });
    handler.fireAction(ScreenSpaceEventType.MOUSE_MOVE, {
      startPosition: { x: 100, y: 100 },
      endPosition: { x: 150, y: 150 },
    });
    handler.fireAction(ScreenSpaceEventType.RIGHT_UP, { x: 150, y: 150 });

    expect(camera.position[0]).toBe(posBefore[0]);
    expect(camera.position[1]).toBe(posBefore[1]);
    expect(camera.position[2]).toBe(posBefore[2]);
  });

  // -----------------------------------------------------------------------
  // Zoom limits
  // -----------------------------------------------------------------------

  it('zoom respects minimumZoomDistance', () => {
    controller.minimumZoomDistance = 5;

    // Camera starts at z=10, try to zoom in a lot (negative delta = scroll up = zoom in)
    handler.fireAction(ScreenSpaceEventType.WHEEL, {
      delta: -1000,
      position: { x: 400, y: 300 },
    });

    const distance = Vec3.magnitude(camera.position);
    expect(distance).toBeGreaterThanOrEqual(5 - 1e-6);
  });

  it('zoom respects maximumZoomDistance', () => {
    controller.maximumZoomDistance = 20;

    // Zoom out a lot (positive delta = scroll down = zoom out)
    handler.fireAction(ScreenSpaceEventType.WHEEL, {
      delta: 1000,
      position: { x: 400, y: 300 },
    });

    const distance = Vec3.magnitude(camera.position);
    expect(distance).toBeLessThanOrEqual(20 + 1e-6);
  });

  // -----------------------------------------------------------------------
  // Zoom changes position
  // -----------------------------------------------------------------------

  it('wheel event moves camera position along direction', () => {
    const posBefore = Vec3.clone(camera.position);

    handler.fireAction(ScreenSpaceEventType.WHEEL, {
      delta: -50,
      position: { x: 400, y: 300 },
    });

    // Camera should have moved (zoomed in)
    const distBefore = Vec3.magnitude(posBefore);
    const distAfter = Vec3.magnitude(camera.position);
    expect(distAfter).toBeLessThan(distBefore);
  });

  // -----------------------------------------------------------------------
  // Rotation changes position
  // -----------------------------------------------------------------------

  it('left drag rotates camera around target', () => {
    const posBefore = Vec3.clone(camera.position);

    handler.fireAction(ScreenSpaceEventType.LEFT_DOWN, { x: 100, y: 100 });
    handler.fireAction(ScreenSpaceEventType.MOUSE_MOVE, {
      startPosition: { x: 100, y: 100 },
      endPosition: { x: 200, y: 100 },
    });
    handler.fireAction(ScreenSpaceEventType.LEFT_UP, { x: 200, y: 100 });

    // X position should have changed due to horizontal orbit
    expect(camera.position[0]).not.toBeCloseTo(posBefore[0], 3);
    // lookAtTarget should have been called to re-orient
    expect(camera.lookAtTarget).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Translation changes position
  // -----------------------------------------------------------------------

  it('right drag translates camera', () => {
    const posBefore = Vec3.clone(camera.position);

    handler.fireAction(ScreenSpaceEventType.RIGHT_DOWN, { x: 100, y: 100 });
    handler.fireAction(ScreenSpaceEventType.MOUSE_MOVE, {
      startPosition: { x: 100, y: 100 },
      endPosition: { x: 200, y: 200 },
    });
    handler.fireAction(ScreenSpaceEventType.RIGHT_UP, { x: 200, y: 200 });

    // Position should have changed
    const moved = (
      camera.position[0] !== posBefore[0] ||
      camera.position[1] !== posBefore[1] ||
      camera.position[2] !== posBefore[2]
    );
    expect(moved).toBe(true);
  });

  // -----------------------------------------------------------------------
  // destroy
  // -----------------------------------------------------------------------

  it('destroy removes all input actions', () => {
    controller.destroy();

    expect(handler.removeInputAction).toHaveBeenCalledWith(ScreenSpaceEventType.LEFT_DOWN);
    expect(handler.removeInputAction).toHaveBeenCalledWith(ScreenSpaceEventType.LEFT_UP);
    expect(handler.removeInputAction).toHaveBeenCalledWith(ScreenSpaceEventType.RIGHT_DOWN);
    expect(handler.removeInputAction).toHaveBeenCalledWith(ScreenSpaceEventType.RIGHT_UP);
    expect(handler.removeInputAction).toHaveBeenCalledWith(ScreenSpaceEventType.MOUSE_MOVE);
    expect(handler.removeInputAction).toHaveBeenCalledWith(ScreenSpaceEventType.WHEEL);
  });

  // -----------------------------------------------------------------------
  // Inertia
  // -----------------------------------------------------------------------

  it('update with deltaTime decays inertia velocity', () => {
    // Perform a rotation to set velocity
    handler.fireAction(ScreenSpaceEventType.LEFT_DOWN, { x: 100, y: 100 });
    handler.fireAction(ScreenSpaceEventType.MOUSE_MOVE, {
      startPosition: { x: 100, y: 100 },
      endPosition: { x: 200, y: 100 },
    });
    // Release: velocity should be stored
    handler.fireAction(ScreenSpaceEventType.LEFT_UP, { x: 200, y: 100 });

    const posAfterRelease = Vec3.clone(camera.position);

    // Update should apply inertia and change position further
    controller.update(0.016);

    const posAfterUpdate = Vec3.clone(camera.position);
    const moved = (
      posAfterUpdate[0] !== posAfterRelease[0] ||
      posAfterUpdate[1] !== posAfterRelease[1] ||
      posAfterUpdate[2] !== posAfterRelease[2]
    );
    expect(moved).toBe(true);

    // After many updates, velocity should decay to near zero
    for (let i = 0; i < 100; i++) {
      controller.update(0.1);
    }

    const posAfterDecay = Vec3.clone(camera.position);

    // One more update should barely change anything
    controller.update(0.1);
    expect(camera.position[0]).toBeCloseTo(posAfterDecay[0], 4);
    expect(camera.position[1]).toBeCloseTo(posAfterDecay[1], 4);
    expect(camera.position[2]).toBeCloseTo(posAfterDecay[2], 4);
  });

  it('update with inertiaEnabled=false does not move camera', () => {
    controller.inertiaEnabled = false;

    // Set some velocity via drag
    handler.fireAction(ScreenSpaceEventType.LEFT_DOWN, { x: 100, y: 100 });
    handler.fireAction(ScreenSpaceEventType.MOUSE_MOVE, {
      startPosition: { x: 100, y: 100 },
      endPosition: { x: 200, y: 100 },
    });
    handler.fireAction(ScreenSpaceEventType.LEFT_UP, { x: 200, y: 100 });

    const posAfterRelease = Vec3.clone(camera.position);

    controller.update(0.016);

    // Should not move — inertia disabled
    expect(camera.position[0]).toBe(posAfterRelease[0]);
    expect(camera.position[1]).toBe(posAfterRelease[1]);
    expect(camera.position[2]).toBe(posAfterRelease[2]);
  });

  // -----------------------------------------------------------------------
  // No movement when mouse moves without button down
  // -----------------------------------------------------------------------

  it('mouse move without button down does not move camera', () => {
    const posBefore = Vec3.clone(camera.position);

    handler.fireAction(ScreenSpaceEventType.MOUSE_MOVE, {
      startPosition: { x: 100, y: 100 },
      endPosition: { x: 300, y: 300 },
    });

    expect(camera.position[0]).toBe(posBefore[0]);
    expect(camera.position[1]).toBe(posBefore[1]);
    expect(camera.position[2]).toBe(posBefore[2]);
  });
});
