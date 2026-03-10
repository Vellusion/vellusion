import type { Vec3Type, Vec4Type } from '@vellusion/math';

export interface PointPrimitive {
  position: Vec3Type;
  color?: Vec4Type;
  pixelSize: number;
  outlineColor?: Vec4Type;
  outlineWidth: number;
  show: boolean;
  id?: string;
}

export class PointPrimitiveCollection {
  private _points: PointPrimitive[] = [];
  private _dirty: boolean = false;

  add(options: Partial<PointPrimitive> & { position: Vec3Type }): PointPrimitive {
    const point: PointPrimitive = {
      position: options.position,
      color: options.color,
      pixelSize: options.pixelSize ?? 4,
      outlineColor: options.outlineColor,
      outlineWidth: options.outlineWidth ?? 0,
      show: options.show ?? true,
      id: options.id,
    };
    this._points.push(point);
    this._dirty = true;
    return point;
  }

  remove(point: PointPrimitive): boolean {
    const idx = this._points.indexOf(point);
    if (idx === -1) return false;
    this._points.splice(idx, 1);
    this._dirty = true;
    return true;
  }

  get(index: number): PointPrimitive {
    return this._points[index];
  }

  get length(): number {
    return this._points.length;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  removeAll(): void {
    this._points.length = 0;
    this._dirty = true;
  }

  destroy(): void {
    this.removeAll();
  }
}
