import type { Vec3Type, Vec4Type } from '@vellusion/math';

export interface Billboard {
  position: Vec3Type;
  image?: string;
  width: number;
  height: number;
  color?: Vec4Type;
  scale: number;
  rotation: number;
  show: boolean;
  id?: string;
}

export class BillboardCollection {
  private _billboards: Billboard[] = [];
  private _dirty: boolean = false;

  add(options: Partial<Billboard> & { position: Vec3Type }): Billboard {
    const billboard: Billboard = {
      position: options.position,
      image: options.image,
      width: options.width ?? 32,
      height: options.height ?? 32,
      color: options.color,
      scale: options.scale ?? 1.0,
      rotation: options.rotation ?? 0,
      show: options.show ?? true,
      id: options.id,
    };
    this._billboards.push(billboard);
    this._dirty = true;
    return billboard;
  }

  remove(billboard: Billboard): boolean {
    const idx = this._billboards.indexOf(billboard);
    if (idx === -1) return false;
    this._billboards.splice(idx, 1);
    this._dirty = true;
    return true;
  }

  get(index: number): Billboard {
    return this._billboards[index];
  }

  get length(): number {
    return this._billboards.length;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  removeAll(): void {
    this._billboards.length = 0;
    this._dirty = true;
  }

  destroy(): void {
    this.removeAll();
  }
}
