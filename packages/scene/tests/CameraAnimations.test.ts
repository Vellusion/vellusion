import { describe, it, expect, vi } from 'vitest';
import { Vec3, BoundingSphere } from '@vellusion/math';
import { PerspectiveCamera } from '../src/Camera';
import { CameraAnimations } from '../src/CameraAnimations';

function createCamera(): PerspectiveCamera {
  const cam = new PerspectiveCamera();
  cam.setPosition(0, 0, 5);
  cam.update();
  return cam;
}

describe('CameraAnimations', () => {
  it('flyTo starts animation, isAnimating=true', () => {
    const cam = createCamera();
    const anim = new CameraAnimations(cam);

    expect(anim.isAnimating).toBe(false);
    anim.flyTo({ destination: Vec3.create(10, 0, 0) });
    expect(anim.isAnimating).toBe(true);
  });

  it('flyTo after full duration, camera at destination', () => {
    const cam = createCamera();
    const anim = new CameraAnimations(cam);
    const dest = Vec3.create(10, 20, 30);

    anim.flyTo({ destination: dest, duration: 2.0 });

    // Advance the full duration in one step
    anim.update(2.0);

    expect(cam.position[0]).toBeCloseTo(10);
    expect(cam.position[1]).toBeCloseTo(20);
    expect(cam.position[2]).toBeCloseTo(30);
    expect(anim.isAnimating).toBe(false);
  });

  it('flyTo calls onComplete when finished', () => {
    const cam = createCamera();
    const anim = new CameraAnimations(cam);
    const onComplete = vi.fn();

    anim.flyTo({
      destination: Vec3.create(10, 0, 0),
      duration: 1.0,
      onComplete,
    });

    // Partially advance -- should not call yet
    anim.update(0.5);
    expect(onComplete).not.toHaveBeenCalled();

    // Finish
    anim.update(0.5);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('lookAt points camera direction at target', () => {
    const cam = createCamera(); // at (0, 0, 5)
    const anim = new CameraAnimations(cam);

    anim.lookAt(Vec3.create(0, 0, 0));

    // Direction should point from (0,0,5) to (0,0,0) = (0,0,-1)
    expect(cam.direction[0]).toBeCloseTo(0);
    expect(cam.direction[1]).toBeCloseTo(0);
    expect(cam.direction[2]).toBeCloseTo(-1);
  });

  it('setView sets camera position instantly', () => {
    const cam = createCamera();
    const anim = new CameraAnimations(cam);

    anim.setView(Vec3.create(100, 200, 300));

    expect(cam.position[0]).toBeCloseTo(100);
    expect(cam.position[1]).toBeCloseTo(200);
    expect(cam.position[2]).toBeCloseTo(300);
  });

  it('cancelAnimation stops mid-flight, isAnimating=false', () => {
    const cam = createCamera();
    const anim = new CameraAnimations(cam);

    anim.flyTo({ destination: Vec3.create(50, 50, 50), duration: 5.0 });
    expect(anim.isAnimating).toBe(true);

    anim.update(1.0); // partially advance
    anim.cancelAnimation();

    expect(anim.isAnimating).toBe(false);

    // Camera should be at an intermediate position (not the destination)
    expect(cam.position[0]).not.toBeCloseTo(50);
  });

  it('update with no animation does nothing', () => {
    const cam = createCamera();
    const anim = new CameraAnimations(cam);
    const posBefore = Vec3.clone(cam.position);

    anim.update(1.0);

    expect(cam.position[0]).toBe(posBefore[0]);
    expect(cam.position[1]).toBe(posBefore[1]);
    expect(cam.position[2]).toBe(posBefore[2]);
  });

  it('zoomTo positions camera to frame bounding sphere', () => {
    const cam = createCamera();
    const anim = new CameraAnimations(cam);

    const sphere = BoundingSphere.create(Vec3.create(0, 0, 0), 10);
    anim.zoomTo(sphere);

    // zoomTo should start a flyTo animation
    expect(anim.isAnimating).toBe(true);

    // Let it finish (duration is 1.5)
    anim.update(1.5);

    // Default offset multiplier is 2.0, so dist = 10 * 2 = 20
    // Destination is center with z += dist => (0, 0, 20)
    expect(cam.position[0]).toBeCloseTo(0);
    expect(cam.position[1]).toBeCloseTo(0);
    expect(cam.position[2]).toBeCloseTo(20);
    expect(anim.isAnimating).toBe(false);
  });
});
