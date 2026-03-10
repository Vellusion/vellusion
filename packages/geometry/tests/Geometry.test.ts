import { describe, it, expect } from 'vitest';
import { Mat4, Vec4 } from '@vellusion/math';
import type { GeometryAttribute } from '../src/GeometryAttribute';
import type { Geometry } from '../src/Geometry';
import { GeometryInstance } from '../src/GeometryInstance';

describe('GeometryAttribute', () => {
  it('should store values and metadata', () => {
    const attr: GeometryAttribute = {
      values: new Float32Array([1, 2, 3, 4, 5, 6]),
      componentsPerAttribute: 3,
      componentDatatype: 'float32',
    };
    expect(attr.values).toBeInstanceOf(Float32Array);
    expect(attr.values.length).toBe(6);
    expect(attr.componentsPerAttribute).toBe(3);
    expect(attr.componentDatatype).toBe('float32');
  });
});

describe('Geometry', () => {
  it('should have required position attribute and primitiveType', () => {
    const geometry: Geometry = {
      attributes: {
        position: {
          values: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
          componentsPerAttribute: 3,
          componentDatatype: 'float32',
        },
      },
      primitiveType: 'triangles',
    };
    expect(geometry.attributes.position.values.length).toBe(9);
    expect(geometry.attributes.position.componentsPerAttribute).toBe(3);
    expect(geometry.primitiveType).toBe('triangles');
    expect(geometry.indices).toBeUndefined();
    expect(geometry.boundingSphere).toBeUndefined();
  });
});

describe('GeometryInstance', () => {
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

  it('should default modelMatrix to identity', () => {
    const instance = new GeometryInstance({ geometry: createSimpleGeometry() });
    const identity = Mat4.identity();
    for (let i = 0; i < 16; i++) {
      expect(instance.modelMatrix[i]).toBe(identity[i]);
    }
  });

  it('should assign unique id if not provided', () => {
    const a = new GeometryInstance({ geometry: createSimpleGeometry() });
    const b = new GeometryInstance({ geometry: createSimpleGeometry() });
    expect(a.id).toMatch(/^instance_\d+$/);
    expect(b.id).toMatch(/^instance_\d+$/);
    expect(a.id).not.toBe(b.id);
  });

  it('should use provided id', () => {
    const instance = new GeometryInstance({
      geometry: createSimpleGeometry(),
      id: 'my-custom-id',
    });
    expect(instance.id).toBe('my-custom-id');
  });

  it('should store custom attributes', () => {
    const color = Vec4.create(1, 0, 0, 1);
    const instance = new GeometryInstance({
      geometry: createSimpleGeometry(),
      attributes: { color, show: false },
    });
    expect(instance.attributes.color).toBe(color);
    expect(instance.attributes.show).toBe(false);
  });

  it('should default attributes to empty object', () => {
    const instance = new GeometryInstance({ geometry: createSimpleGeometry() });
    expect(instance.attributes).toEqual({});
  });
});
