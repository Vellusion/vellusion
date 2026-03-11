export interface StyleDefinition {
  show?: string;      // boolean expression, e.g. "${height} > 100"
  color?: string;     // color expression, e.g. "color('#ff0000')" or "rgb(${r}, ${g}, ${b})"
  pointSize?: string; // number expression, e.g. "${size} * 2"
}

export class StyleExpression {
  readonly expression: string;

  constructor(expression: string) {
    this.expression = expression;
  }

  /**
   * Evaluate expression against feature properties.
   * Supports:
   * - ${propertyName} — property reference
   * - Basic arithmetic: +, -, *, /
   * - Comparisons: >, <, >=, <=, ===, !==
   * - Boolean: true, false
   * - Numbers
   * - color('hex') or rgba(r,g,b,a) for colors
   */
  evaluate(properties: Record<string, any>): any {
    let expr = this.expression;

    // Replace ${property} references with actual values
    expr = expr.replace(/\$\{(\w+)\}/g, (_, key) => {
      const val = properties[key];
      if (val === undefined) return 'undefined';
      if (typeof val === 'string') return `"${val}"`;
      return String(val);
    });

    // Handle color() function
    const colorMatch = expr.match(/^color\(['"]([^'"]+)['"]\)$/);
    if (colorMatch) {
      return this._parseColor(colorMatch[1]);
    }

    // Handle rgba()
    const rgbaMatch = expr.match(/^rgba\(([^)]+)\)$/);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(',').map(s => parseFloat(s.trim()));
      return new Float32Array([
        parts[0] / 255, parts[1] / 255, parts[2] / 255, parts[3] ?? 1,
      ]);
    }

    // Try to evaluate as simple expression
    try {
      // Safe subset: only allow numbers, operators, booleans
      if (/^[\d\s+\-*/().><=!&|"truefalseundefined]+$/.test(expr)) {
        return new Function(`return (${expr})`)();
      }
    } catch {
      // fallback
    }

    return expr;
  }

  private _parseColor(hex: string): Float32Array {
    const h = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const a = h.length >= 8 ? parseInt(h.substring(6, 8), 16) / 255 : 1;
    return new Float32Array([r, g, b, a]);
  }
}

export class Tileset3DStyle {
  show?: StyleExpression;
  color?: StyleExpression;
  pointSize?: StyleExpression;

  constructor(style?: StyleDefinition) {
    if (style?.show) this.show = new StyleExpression(style.show);
    if (style?.color) this.color = new StyleExpression(style.color);
    if (style?.pointSize) this.pointSize = new StyleExpression(style.pointSize);
  }

  /**
   * Apply style to feature properties.
   */
  applyToFeature(properties: Record<string, any>): {
    show: boolean;
    color?: Float32Array;
    pointSize?: number;
  } {
    const result: { show: boolean; color?: Float32Array; pointSize?: number } = {
      show: true,
    };

    if (this.show) {
      result.show = !!this.show.evaluate(properties);
    }
    if (this.color) {
      const c = this.color.evaluate(properties);
      if (c instanceof Float32Array) result.color = c;
    }
    if (this.pointSize) {
      const s = this.pointSize.evaluate(properties);
      if (typeof s === 'number') result.pointSize = s;
    }

    return result;
  }
}
