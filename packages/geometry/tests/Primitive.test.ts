import { describe, it, expect } from 'vitest';
import type { Geometry } from '../src/Geometry';
import { GeometryInstance } from '../src/GeometryInstance';
import { MaterialAppearance, PerInstanceColorAppearance } from '../src/Appearance';
import { Primitive } from '../src/Primitive';
import { GroundPrimitive } from '../src/GroundPrimitive';
import { ClassificationPrimitive } from '../src/ClassificationPrimitive';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSimpleGeometry(): Geometry {
  return {
    attributes: {
      position: {
        values: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        componentsPerAttribute: 3,
        componentDatatype: 'float32',
      },
    },
    primitiveType: 'triangles',
  };
}

function createInstance(): GeometryInstance {
  return new GeometryInstance({ geometry: createSimpleGeometry() });
}

// ---------------------------------------------------------------------------
// Primitive
// ---------------------------------------------------------------------------

describe('Primitive', () => {
  it('stores a single geometry instance', () => {
    const instance = createInstance();
    const prim = new Primitive({
      geometryInstances: instance,
      appearance: new MaterialAppearance(),
    });
    expect(prim.geometryInstances).toHaveLength(1);
    expect(prim.geometryInstances[0]).toBe(instance);
  });

  it('stores an array of geometry instances', () => {
    const a = createInstance();
    const b = createInstance();
    const prim = new Primitive({
      geometryInstances: [a, b],
      appearance: new MaterialAppearance(),
    });
    expect(prim.geometryInstances).toHaveLength(2);
    expect(prim.geometryInstances[0]).toBe(a);
    expect(prim.geometryInstances[1]).toBe(b);
  });

  it('show defaults to true', () => {
    const prim = new Primitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    expect(prim.show).toBe(true);
  });

  it('show can be set to false', () => {
    const prim = new Primitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
      show: false,
    });
    expect(prim.show).toBe(false);
  });

  it('ready=false before update', () => {
    const prim = new Primitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    expect(prim.ready).toBe(false);
  });

  it('ready=true after update', () => {
    const prim = new Primitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    prim.update();
    expect(prim.ready).toBe(true);
  });

  it('destroy sets ready=false', () => {
    const prim = new Primitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    prim.update();
    expect(prim.ready).toBe(true);
    prim.destroy();
    expect(prim.ready).toBe(false);
  });

  it('stores the appearance', () => {
    const appearance = new PerInstanceColorAppearance({ closed: true });
    const prim = new Primitive({
      geometryInstances: createInstance(),
      appearance,
    });
    expect(prim.appearance).toBe(appearance);
  });
});

// ---------------------------------------------------------------------------
// GroundPrimitive
// ---------------------------------------------------------------------------

describe('GroundPrimitive', () => {
  it('extends Primitive', () => {
    const gp = new GroundPrimitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    expect(gp).toBeInstanceOf(Primitive);
    expect(gp).toBeInstanceOf(GroundPrimitive);
  });

  it('inherits show, ready, update, destroy', () => {
    const gp = new GroundPrimitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    expect(gp.show).toBe(true);
    expect(gp.ready).toBe(false);
    gp.update();
    expect(gp.ready).toBe(true);
    gp.destroy();
    expect(gp.ready).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ClassificationPrimitive
// ---------------------------------------------------------------------------

describe('ClassificationPrimitive', () => {
  it('extends Primitive', () => {
    const cp = new ClassificationPrimitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    expect(cp).toBeInstanceOf(Primitive);
    expect(cp).toBeInstanceOf(ClassificationPrimitive);
  });

  it('default classificationType is both', () => {
    const cp = new ClassificationPrimitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
    });
    expect(cp.classificationType).toBe('both');
  });

  it('custom classificationType terrain', () => {
    const cp = new ClassificationPrimitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
      classificationType: 'terrain',
    });
    expect(cp.classificationType).toBe('terrain');
  });

  it('custom classificationType tiles3d', () => {
    const cp = new ClassificationPrimitive({
      geometryInstances: createInstance(),
      appearance: new MaterialAppearance(),
      classificationType: 'tiles3d',
    });
    expect(cp.classificationType).toBe('tiles3d');
  });
});
