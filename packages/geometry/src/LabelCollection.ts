import type { Vec3Type, Vec4Type } from '@vellusion/math';

export interface Label {
  position: Vec3Type;
  text: string;
  font: string;
  fillColor?: Vec4Type;
  outlineColor?: Vec4Type;
  outlineWidth: number;
  scale: number;
  show: boolean;
  id?: string;
  horizontalOrigin: 'left' | 'center' | 'right';
  verticalOrigin: 'top' | 'center' | 'bottom';
}

export class LabelCollection {
  private _labels: Label[] = [];
  private _dirty: boolean = false;

  add(options: Partial<Label> & { position: Vec3Type; text: string }): Label {
    const label: Label = {
      position: options.position,
      text: options.text,
      font: options.font ?? '14px sans-serif',
      fillColor: options.fillColor,
      outlineColor: options.outlineColor,
      outlineWidth: options.outlineWidth ?? 0,
      scale: options.scale ?? 1.0,
      show: options.show ?? true,
      id: options.id,
      horizontalOrigin: options.horizontalOrigin ?? 'center',
      verticalOrigin: options.verticalOrigin ?? 'center',
    };
    this._labels.push(label);
    this._dirty = true;
    return label;
  }

  remove(label: Label): boolean {
    const idx = this._labels.indexOf(label);
    if (idx === -1) return false;
    this._labels.splice(idx, 1);
    this._dirty = true;
    return true;
  }

  get(index: number): Label {
    return this._labels[index];
  }

  get length(): number {
    return this._labels.length;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  removeAll(): void {
    this._labels.length = 0;
    this._dirty = true;
  }

  destroy(): void {
    this.removeAll();
  }
}
