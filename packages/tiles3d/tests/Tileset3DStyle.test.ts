import { describe, it, expect } from 'vitest';
import {
  StyleExpression,
  Tileset3DStyle,
  Tile3DFeatureTable,
} from '@vellusion/tiles3d';

// ---------- StyleExpression ----------

describe('StyleExpression', () => {
  it('evaluates property reference', () => {
    const expr = new StyleExpression('${height}');
    expect(expr.evaluate({ height: 100 })).toBe(100);
  });

  it('evaluates comparison: ${height} > 50 → true', () => {
    const expr = new StyleExpression('${height} > 50');
    expect(expr.evaluate({ height: 100 })).toBe(true);
  });

  it('evaluates comparison: ${height} > 50 → false', () => {
    const expr = new StyleExpression('${height} > 50');
    expect(expr.evaluate({ height: 30 })).toBe(false);
  });

  it('evaluates arithmetic: ${width} * 2', () => {
    const expr = new StyleExpression('${width} * 2');
    expect(expr.evaluate({ width: 5 })).toBe(10);
  });

  it('evaluates color(\'#ff0000\') → Float32Array [1, 0, 0, 1]', () => {
    const expr = new StyleExpression("color('#ff0000')");
    const result = expr.evaluate({});
    expect(result).toBeInstanceOf(Float32Array);
    expect(result[0]).toBeCloseTo(1, 2);
    expect(result[1]).toBeCloseTo(0, 2);
    expect(result[2]).toBeCloseTo(0, 2);
    expect(result[3]).toBeCloseTo(1, 2);
  });

  it('evaluates rgba(255, 128, 0, 1) → correct normalized values', () => {
    const expr = new StyleExpression('rgba(255, 128, 0, 1)');
    const result = expr.evaluate({});
    expect(result).toBeInstanceOf(Float32Array);
    expect(result[0]).toBeCloseTo(1, 2);         // 255/255
    expect(result[1]).toBeCloseTo(128 / 255, 2);  // 128/255
    expect(result[2]).toBeCloseTo(0, 2);           // 0/255
    expect(result[3]).toBeCloseTo(1, 2);           // alpha passthrough
  });

  it('handles undefined property gracefully', () => {
    const expr = new StyleExpression('${missing}');
    // Should not throw
    const result = expr.evaluate({});
    // The substituted string "undefined" is evaluated by new Function, returning JS undefined
    expect(result).toBeUndefined();
  });

  it('evaluates boolean "true"', () => {
    const expr = new StyleExpression('true');
    expect(expr.evaluate({})).toBe(true);
  });

  it('evaluates boolean "false"', () => {
    const expr = new StyleExpression('false');
    expect(expr.evaluate({})).toBe(false);
  });
});

// ---------- Tileset3DStyle ----------

describe('Tileset3DStyle', () => {
  it('constructs with show expression', () => {
    const style = new Tileset3DStyle({ show: '${visible} === true' });
    expect(style.show).toBeDefined();
    expect(style.show!.expression).toBe('${visible} === true');
  });

  it('constructs with color expression', () => {
    const style = new Tileset3DStyle({ color: "color('#00ff00')" });
    expect(style.color).toBeDefined();
    expect(style.color!.expression).toBe("color('#00ff00')");
  });

  it('constructs with pointSize expression', () => {
    const style = new Tileset3DStyle({ pointSize: '${size} * 2' });
    expect(style.pointSize).toBeDefined();
    expect(style.pointSize!.expression).toBe('${size} * 2');
  });

  it('applyToFeature returns show=false when condition not met', () => {
    const style = new Tileset3DStyle({ show: '${height} > 100' });
    const result = style.applyToFeature({ height: 50 });
    expect(result.show).toBe(false);
  });

  it('applyToFeature returns color when color expression set', () => {
    const style = new Tileset3DStyle({ color: "color('#0000ff')" });
    const result = style.applyToFeature({});
    expect(result.color).toBeInstanceOf(Float32Array);
    expect(result.color![0]).toBeCloseTo(0, 2);
    expect(result.color![1]).toBeCloseTo(0, 2);
    expect(result.color![2]).toBeCloseTo(1, 2);
    expect(result.color![3]).toBeCloseTo(1, 2);
  });

  it('applyToFeature returns pointSize when expression set', () => {
    const style = new Tileset3DStyle({ pointSize: '${size} * 3' });
    const result = style.applyToFeature({ size: 4 });
    expect(result.pointSize).toBe(12);
  });

  it('empty style defaults to show=true', () => {
    const style = new Tileset3DStyle();
    const result = style.applyToFeature({});
    expect(result.show).toBe(true);
    expect(result.color).toBeUndefined();
    expect(result.pointSize).toBeUndefined();
  });
});

// ---------- Tile3DFeatureTable ----------

describe('Tile3DFeatureTable', () => {
  it('featureCount returns correct count', () => {
    const ft = new Tile3DFeatureTable(5);
    expect(ft.featureCount).toBe(5);
  });

  it('getProperty returns batch table value', () => {
    const ft = new Tile3DFeatureTable(3, {
      height: [10, 20, 30],
      name: ['a', 'b', 'c'],
    });
    expect(ft.getProperty(0, 'height')).toBe(10);
    expect(ft.getProperty(2, 'name')).toBe('c');
  });

  it('getProperty returns undefined for missing property', () => {
    const ft = new Tile3DFeatureTable(2);
    expect(ft.getProperty(0, 'nonexistent')).toBeUndefined();
  });

  it('setProperty stores value', () => {
    const ft = new Tile3DFeatureTable(3);
    ft.setProperty(1, 'height', 42);
    expect(ft.getProperty(1, 'height')).toBe(42);
  });

  it('getAllProperties returns all properties for feature', () => {
    const ft = new Tile3DFeatureTable(2, {
      height: [10, 20],
      type: ['building', 'tree'],
    });
    const props = ft.getAllProperties(1);
    expect(props.height).toBe(20);
    expect(props.type).toBe('tree');
  });

  it('getColor returns default white', () => {
    const ft = new Tile3DFeatureTable(2);
    const c = ft.getColor(0);
    expect(c).toBeInstanceOf(Float32Array);
    expect(c[0]).toBe(1);
    expect(c[1]).toBe(1);
    expect(c[2]).toBe(1);
    expect(c[3]).toBe(1);
  });

  it('setColor stores color', () => {
    const ft = new Tile3DFeatureTable(2);
    const red = new Float32Array([1, 0, 0, 1]);
    ft.setColor(0, red);
    expect(ft.getColor(0)).toBe(red);
  });

  it('getShow returns default true', () => {
    const ft = new Tile3DFeatureTable(2);
    expect(ft.getShow(0)).toBe(true);
  });

  it('setShow stores flag', () => {
    const ft = new Tile3DFeatureTable(2);
    ft.setShow(1, false);
    expect(ft.getShow(1)).toBe(false);
  });

  it('applyStyle updates show and color for all features', () => {
    const ft = new Tile3DFeatureTable(3, {
      height: [50, 150, 200],
    });
    const style = new Tileset3DStyle({
      show: '${height} > 100',
      color: "color('#ff0000')",
    });
    ft.applyStyle(style);

    expect(ft.getShow(0)).toBe(false);  // height 50, not > 100
    expect(ft.getShow(1)).toBe(true);   // height 150
    expect(ft.getShow(2)).toBe(true);   // height 200

    // Color should be applied to all
    expect(ft.getColor(1)[0]).toBeCloseTo(1, 2);
    expect(ft.getColor(1)[1]).toBeCloseTo(0, 2);
    expect(ft.getColor(1)[2]).toBeCloseTo(0, 2);
  });

  it('propertyNames returns keys', () => {
    const ft = new Tile3DFeatureTable(2, {
      height: [10, 20],
      type: ['a', 'b'],
    });
    const names = ft.propertyNames;
    expect(names).toContain('height');
    expect(names).toContain('type');
    expect(names.length).toBe(2);
  });
});
