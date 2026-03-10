import { describe, it, expect } from 'vitest';
import { JulianDate, type JulianDateType } from '@vellusion/scene';
import { Vec3, Vec4, Vec2 } from '@vellusion/math';
import {
  ConstantProperty,
  SampledProperty,
  TimeIntervalCollectionProperty,
  CompositeProperty,
  ReferenceProperty,
  CallbackProperty,
  ConstantPositionProperty,
  SampledPositionProperty,
  ColorMaterialProperty,
  ImageMaterialProperty,
  GridMaterialProperty,
  PolylineDashMaterialProperty,
  PolylineGlowMaterialProperty,
  PolylineArrowMaterialProperty,
} from '@vellusion/datasources';
import { EntityCollection, Entity } from '@vellusion/datasources';

// ─── helpers ───────────────────────────────────────────────────────────
function jd(dayNumber: number, secondsOfDay: number): JulianDateType {
  return JulianDate.create(dayNumber, secondsOfDay);
}

// ─── ConstantProperty ──────────────────────────────────────────────────
describe('ConstantProperty', () => {
  it('getValue returns the stored value', () => {
    const p = new ConstantProperty(42);
    expect(p.getValue(jd(0, 0))).toBe(42);
  });

  it('isConstant is true', () => {
    const p = new ConstantProperty('hello');
    expect(p.isConstant).toBe(true);
  });

  it('equals returns true for same value', () => {
    const a = new ConstantProperty(7);
    const b = new ConstantProperty(7);
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different value', () => {
    const a = new ConstantProperty(7);
    const b = new ConstantProperty(8);
    expect(a.equals(b)).toBe(false);
  });

  it('setValue updates the value', () => {
    const p = new ConstantProperty(1);
    p.setValue(2);
    expect(p.getValue(jd(0, 0))).toBe(2);
  });
});

// ─── SampledProperty ──────────────────────────────────────────────────
describe('SampledProperty', () => {
  it('interpolates linearly between two samples', () => {
    const sp = new SampledProperty();
    sp.addSample(jd(100, 0), 0);
    sp.addSample(jd(100, 10), 100);
    // midpoint
    const val = sp.getValue(jd(100, 5));
    expect(val).toBeCloseTo(50, 5);
  });

  it('returns first value before first sample', () => {
    const sp = new SampledProperty();
    sp.addSample(jd(100, 10), 50);
    sp.addSample(jd(100, 20), 100);
    expect(sp.getValue(jd(100, 0))).toBe(50);
  });

  it('returns last value after last sample', () => {
    const sp = new SampledProperty();
    sp.addSample(jd(100, 10), 50);
    sp.addSample(jd(100, 20), 100);
    expect(sp.getValue(jd(100, 30))).toBe(100);
  });

  it('addSamples adds multiple samples', () => {
    const sp = new SampledProperty();
    sp.addSamples(
      [jd(100, 0), jd(100, 10)],
      [0, 100],
    );
    expect(sp.getValue(jd(100, 5))).toBeCloseTo(50, 5);
  });

  it('isConstant is false', () => {
    const sp = new SampledProperty();
    expect(sp.isConstant).toBe(false);
  });

  it('interpolates at 25% correctly', () => {
    const sp = new SampledProperty();
    sp.addSample(jd(200, 0), 0);
    sp.addSample(jd(200, 100), 200);
    expect(sp.getValue(jd(200, 25))).toBeCloseTo(50, 5);
  });
});

// ─── TimeIntervalCollectionProperty ───────────────────────────────────
describe('TimeIntervalCollectionProperty', () => {
  it('returns correct value for containing interval', () => {
    const p = new TimeIntervalCollectionProperty<string>();
    p.addInterval(jd(100, 0), jd(100, 10), 'A');
    p.addInterval(jd(100, 20), jd(100, 30), 'B');
    expect(p.getValue(jd(100, 5))).toBe('A');
    expect(p.getValue(jd(100, 25))).toBe('B');
  });

  it('returns undefined outside any interval', () => {
    const p = new TimeIntervalCollectionProperty<string>();
    p.addInterval(jd(100, 0), jd(100, 10), 'A');
    expect(p.getValue(jd(100, 15))).toBeUndefined();
  });

  it('isConstant is false', () => {
    const p = new TimeIntervalCollectionProperty<number>();
    expect(p.isConstant).toBe(false);
  });
});

// ─── CompositeProperty ────────────────────────────────────────────────
describe('CompositeProperty', () => {
  it('delegates to the correct sub-property based on time', () => {
    const cp = new CompositeProperty<number>();
    const p1 = new ConstantProperty(10);
    const p2 = new ConstantProperty(20);
    cp.addInterval(jd(100, 0), jd(100, 10), p1);
    cp.addInterval(jd(100, 10), jd(100, 20), p2);
    expect(cp.getValue(jd(100, 5))).toBe(10);
    expect(cp.getValue(jd(100, 15))).toBe(20);
  });

  it('returns undefined outside all intervals', () => {
    const cp = new CompositeProperty<number>();
    cp.addInterval(jd(100, 0), jd(100, 10), new ConstantProperty(1));
    expect(cp.getValue(jd(100, 20))).toBeUndefined();
  });
});

// ─── CallbackProperty ─────────────────────────────────────────────────
describe('CallbackProperty', () => {
  it('invokes the callback with the given time', () => {
    const cb = new CallbackProperty<number>((time) => time.secondsOfDay * 2, false);
    expect(cb.getValue(jd(100, 5))).toBe(10);
  });

  it('isConstant reflects the constructor argument', () => {
    const a = new CallbackProperty(() => 1, true);
    const b = new CallbackProperty(() => 1, false);
    expect(a.isConstant).toBe(true);
    expect(b.isConstant).toBe(false);
  });
});

// ─── ReferenceProperty ────────────────────────────────────────────────
describe('ReferenceProperty', () => {
  it('resolves entity property by ID and path', () => {
    const collection = new EntityCollection();
    const entity = collection.add({ id: 'e1', position: new ConstantProperty(Vec3.create(1, 2, 3)) });
    const rp = new ReferenceProperty(collection, 'e1', ['position']);
    // position is a ConstantProperty, so ReferenceProperty calls getValue on it
    const val = rp.getValue(jd(0, 0));
    expect(val).toBe(entity.position.getValue(jd(0, 0)));
  });

  it('returns undefined for missing entity', () => {
    const collection = new EntityCollection();
    const rp = new ReferenceProperty(collection, 'missing', ['position']);
    expect(rp.getValue(jd(0, 0))).toBeUndefined();
  });
});

// ─── ConstantPositionProperty ─────────────────────────────────────────
describe('ConstantPositionProperty', () => {
  it('stores and returns a Vec3 position', () => {
    const pos = Vec3.create(1, 2, 3);
    const p = new ConstantPositionProperty(pos);
    const val = p.getValue(jd(0, 0));
    expect(val[0]).toBe(1);
    expect(val[1]).toBe(2);
    expect(val[2]).toBe(3);
  });

  it('isConstant is true', () => {
    const p = new ConstantPositionProperty(Vec3.zero());
    expect(p.isConstant).toBe(true);
  });

  it('returns a clone, not the internal reference', () => {
    const pos = Vec3.create(1, 2, 3);
    const p = new ConstantPositionProperty(pos);
    const v1 = p.getValue(jd(0, 0));
    const v2 = p.getValue(jd(0, 0));
    expect(v1).not.toBe(v2); // different objects
    expect(v1[0]).toBe(v2[0]);
  });
});

// ─── SampledPositionProperty ──────────────────────────────────────────
describe('SampledPositionProperty', () => {
  it('interpolates positions correctly', () => {
    const sp = new SampledPositionProperty();
    sp.addSample(jd(100, 0), Vec3.create(0, 0, 0));
    sp.addSample(jd(100, 10), Vec3.create(10, 20, 30));
    const val = sp.getValue(jd(100, 5));
    expect(val[0]).toBeCloseTo(5, 5);
    expect(val[1]).toBeCloseTo(10, 5);
    expect(val[2]).toBeCloseTo(15, 5);
  });

  it('isConstant is false', () => {
    const sp = new SampledPositionProperty();
    expect(sp.isConstant).toBe(false);
  });
});

// ─── ColorMaterialProperty ────────────────────────────────────────────
describe('ColorMaterialProperty', () => {
  it('stores and retrieves color', () => {
    const color = Vec4.create(1, 0, 0, 1);
    const mat = new ColorMaterialProperty(color);
    const val = mat.getValue(jd(0, 0));
    expect(val.color[0]).toBe(1);
    expect(val.color[1]).toBe(0);
    expect(val.color[2]).toBe(0);
    expect(val.color[3]).toBe(1);
  });

  it('isConstant reflects the color property', () => {
    const mat = new ColorMaterialProperty(Vec4.create(1, 1, 1, 1));
    expect(mat.isConstant).toBe(true);
  });
});

// ─── ImageMaterialProperty ────────────────────────────────────────────
describe('ImageMaterialProperty', () => {
  it('stores image URL and repeat', () => {
    const mat = new ImageMaterialProperty({
      image: 'texture.png',
      repeat: Vec2.create(2, 2),
    });
    const val = mat.getValue(jd(0, 0));
    expect(val.image).toBe('texture.png');
    expect(val.repeat[0]).toBe(2);
    expect(val.repeat[1]).toBe(2);
  });
});

// ─── GridMaterialProperty ─────────────────────────────────────────────
describe('GridMaterialProperty', () => {
  it('stores grid parameters with defaults', () => {
    const mat = new GridMaterialProperty();
    const val = mat.getValue(jd(0, 0));
    expect(val.cellAlpha).toBeCloseTo(0.1, 5);
    expect(val.lineCount[0]).toBe(8);
    expect(val.lineThickness[0]).toBe(1);
  });

  it('stores custom grid parameters', () => {
    const mat = new GridMaterialProperty({
      cellAlpha: 0.5,
      lineCount: Vec2.create(16, 16),
    });
    const val = mat.getValue(jd(0, 0));
    expect(val.cellAlpha).toBeCloseTo(0.5, 5);
    expect(val.lineCount[0]).toBe(16);
  });
});

// ─── PolylineDashMaterialProperty ─────────────────────────────────────
describe('PolylineDashMaterialProperty', () => {
  it('stores dash parameters', () => {
    const mat = new PolylineDashMaterialProperty({
      dashLength: 32,
    });
    const val = mat.getValue(jd(0, 0));
    expect(val.dashLength).toBe(32);
    expect(val.color[0]).toBe(1); // default white
  });
});

// ─── PolylineGlowMaterialProperty ────────────────────────────────────
describe('PolylineGlowMaterialProperty', () => {
  it('stores glow parameters', () => {
    const mat = new PolylineGlowMaterialProperty({
      glowPower: 0.5,
      color: Vec4.create(0, 1, 0, 1),
    });
    const val = mat.getValue(jd(0, 0));
    expect(val.glowPower).toBeCloseTo(0.5, 5);
    expect(val.color[1]).toBe(1); // green
  });
});

// ─── PolylineArrowMaterialProperty ───────────────────────────────────
describe('PolylineArrowMaterialProperty', () => {
  it('stores arrow color', () => {
    const mat = new PolylineArrowMaterialProperty({
      color: Vec4.create(0, 0, 1, 1),
    });
    const val = mat.getValue(jd(0, 0));
    expect(val.color[2]).toBe(1); // blue
  });
});
