import type { Vec3Type, Vec4Type } from '@vellusion/math';

export interface Polyline {
  positions: Vec3Type[];
  width: number;
  color?: Vec4Type;
  show: boolean;
  id?: string;
}

export class PolylineCollection {
  private _polylines: Polyline[] = [];
  private _dirty: boolean = false;

  add(options: Partial<Polyline> & { positions: Vec3Type[] }): Polyline {
    const polyline: Polyline = {
      positions: options.positions,
      width: options.width ?? 1.0,
      color: options.color,
      show: options.show ?? true,
      id: options.id,
    };
    this._polylines.push(polyline);
    this._dirty = true;
    return polyline;
  }

  remove(polyline: Polyline): boolean {
    const idx = this._polylines.indexOf(polyline);
    if (idx === -1) return false;
    this._polylines.splice(idx, 1);
    this._dirty = true;
    return true;
  }

  get(index: number): Polyline {
    return this._polylines[index];
  }

  get length(): number {
    return this._polylines.length;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  removeAll(): void {
    this._polylines.length = 0;
    this._dirty = true;
  }

  destroy(): void {
    this.removeAll();
  }
}
