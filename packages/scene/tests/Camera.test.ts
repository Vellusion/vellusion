import { describe, it, expect } from 'vitest';
import { Vec3, Vec4, Mat4, VelMath } from '@vellusion/math';
import { PerspectiveCamera, OrthographicCamera } from '../src/Camera';

describe('PerspectiveCamera', () => {
  it('creates valid projection matrix', () => {
    const cam = new PerspectiveCamera();
    cam.updateProjectionMatrix();
    const m = cam.projectionMatrix;

    // Perspective matrix: m[15] should be 0, m[11] should be -1
    expect(m[15]).toBe(0);
    expect(m[11]).toBe(-1);
    // Diagonal elements should be non-zero
    expect(m[0]).not.toBe(0);
    expect(m[5]).not.toBe(0);
    expect(m[10]).not.toBe(0);
  });

  it('default fov is 60 degrees', () => {
    const cam = new PerspectiveCamera();
    expect(VelMath.equalsEpsilon(cam.fov, VelMath.toRadians(60), VelMath.EPSILON10)).toBe(true);
  });

  it('updateViewMatrix produces correct view for known position', () => {
    const cam = new PerspectiveCamera();
    cam.setPosition(0, 0, 5);
    cam.updateViewMatrix();

    // The origin should be at (0, 0, -5) in view space
    const origin = Vec4.create(0, 0, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(cam.viewMatrix, origin, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(-5);
    expect(r[3]).toBeCloseTo(1);
  });

  it('viewProjectionMatrix equals projection * view after update()', () => {
    const cam = new PerspectiveCamera(VelMath.toRadians(90), 16 / 9, 1, 1000);
    cam.setPosition(0, 0, 5);
    cam.update();

    // Manually compute projection * view
    const expected = Mat4.identity();
    Mat4.multiply(cam.projectionMatrix, cam.viewMatrix, expected);
    for (let i = 0; i < 16; i++) {
      expect(cam.viewProjectionMatrix[i]).toBeCloseTo(expected[i], 10);
    }
  });

  it('setPosition changes camera position', () => {
    const cam = new PerspectiveCamera();
    cam.setPosition(10, 20, 30);
    expect(cam.position[0]).toBe(10);
    expect(cam.position[1]).toBe(20);
    expect(cam.position[2]).toBe(30);
  });

  it('lookAtTarget recomputes direction', () => {
    const cam = new PerspectiveCamera();
    cam.setPosition(0, 0, 5);
    cam.lookAtTarget(Vec3.create(0, 0, 0));

    // Direction should be (0, 0, -1) normalized
    expect(cam.direction[0]).toBeCloseTo(0);
    expect(cam.direction[1]).toBeCloseTo(0);
    expect(cam.direction[2]).toBeCloseTo(-1);

    // Up should remain (0, 1, 0)
    expect(cam.up[0]).toBeCloseTo(0);
    expect(cam.up[1]).toBeCloseTo(1);
    expect(cam.up[2]).toBeCloseTo(0);

    // Right should be (1, 0, 0)
    expect(cam.right[0]).toBeCloseTo(1);
    expect(cam.right[1]).toBeCloseTo(0);
    expect(cam.right[2]).toBeCloseTo(0);
  });

  it('lookAtTarget handles off-axis target', () => {
    const cam = new PerspectiveCamera();
    cam.setPosition(0, 0, 0);
    cam.lookAtTarget(Vec3.create(1, 0, 0));

    // Direction should be (1, 0, 0)
    expect(cam.direction[0]).toBeCloseTo(1);
    expect(cam.direction[1]).toBeCloseTo(0);
    expect(cam.direction[2]).toBeCloseTo(0);

    // Direction should be normalized
    const mag = Vec3.magnitude(cam.direction);
    expect(mag).toBeCloseTo(1);
  });

  it('camera at (0,0,5) looking at origin transforms origin to (0,0,-5) in view space', () => {
    const cam = new PerspectiveCamera();
    cam.setPosition(0, 0, 5);
    cam.update();

    // Transform origin through the view matrix
    const origin = Vec3.zero();
    const viewOrigin = Vec3.zero();
    Mat4.multiplyByPoint(cam.viewMatrix, origin, viewOrigin);

    expect(viewOrigin[0]).toBeCloseTo(0);
    expect(viewOrigin[1]).toBeCloseTo(0);
    expect(viewOrigin[2]).toBeCloseTo(-5);
  });

  it('near plane maps to z=0 and far plane maps to z=1 in NDC', () => {
    const cam = new PerspectiveCamera(VelMath.toRadians(90), 1, 0.1, 100);
    cam.update();

    const nearPoint = Vec4.create(0, 0, -cam.near, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(cam.viewProjectionMatrix, nearPoint, r);
    expect(r[2] / r[3]).toBeCloseTo(0);

    const farPoint = Vec4.create(0, 0, -cam.far, 1);
    Mat4.multiplyByVector(cam.viewProjectionMatrix, farPoint, r);
    expect(r[2] / r[3]).toBeCloseTo(1);
  });
});

describe('OrthographicCamera', () => {
  it('creates valid orthographic projection', () => {
    const cam = new OrthographicCamera(-10, 10, -5, 5, 0.1, 100);
    cam.updateProjectionMatrix();
    const m = cam.projectionMatrix;

    // Orthographic matrix: m[15] should be 1, m[11] should be 0
    expect(m[15]).toBe(1);
    expect(m[11]).toBe(0);

    // Verify near plane center maps to z=0 in NDC
    const nearPoint = Vec4.create(0, 0, -0.1, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, nearPoint, r);
    expect(r[2] / r[3]).toBeCloseTo(0);

    // Far plane center maps to z=1
    const farPoint = Vec4.create(0, 0, -100, 1);
    Mat4.multiplyByVector(m, farPoint, r);
    expect(r[2] / r[3]).toBeCloseTo(1);
  });

  it('update() computes all three matrices', () => {
    const cam = new OrthographicCamera(-1, 1, -1, 1, 0.1, 1000);
    cam.setPosition(0, 0, 5);
    cam.update();

    // viewMatrix should not be identity (camera is at z=5)
    const identity = Mat4.identity();
    let isIdentity = true;
    for (let i = 0; i < 16; i++) {
      if (Math.abs(cam.viewMatrix[i] - identity[i]) > 1e-10) {
        isIdentity = false;
        break;
      }
    }
    expect(isIdentity).toBe(false);

    // projectionMatrix should not be identity
    isIdentity = true;
    for (let i = 0; i < 16; i++) {
      if (Math.abs(cam.projectionMatrix[i] - identity[i]) > 1e-10) {
        isIdentity = false;
        break;
      }
    }
    expect(isIdentity).toBe(false);

    // viewProjectionMatrix should equal projection * view
    const expected = Mat4.identity();
    Mat4.multiply(cam.projectionMatrix, cam.viewMatrix, expected);
    for (let i = 0; i < 16; i++) {
      expect(cam.viewProjectionMatrix[i]).toBeCloseTo(expected[i], 10);
    }
  });

  it('orthoRight and orthoTop store boundary values correctly', () => {
    const cam = new OrthographicCamera(-5, 10, -3, 7, 1, 500);
    expect(cam.left).toBe(-5);
    expect(cam.orthoRight).toBe(10);
    expect(cam.bottom).toBe(-3);
    expect(cam.orthoTop).toBe(7);
    expect(cam.near).toBe(1);
    expect(cam.far).toBe(500);
  });
});
