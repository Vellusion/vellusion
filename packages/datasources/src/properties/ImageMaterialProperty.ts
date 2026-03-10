import type { JulianDateType } from '@vellusion/scene';
import type { Vec2Type } from '@vellusion/math';
import { Vec2 } from '@vellusion/math';
import type { Property } from './Property';
import { ConstantProperty } from './ConstantProperty';

export interface ImageMaterialValue {
  image: string;
  repeat: Vec2Type;
}

/**
 * Describes a textured material with a repeating image.
 */
export class ImageMaterialProperty implements Property<ImageMaterialValue> {
  image: Property<string>;
  repeat: Property<Vec2Type>;

  get isConstant(): boolean {
    return this.image.isConstant && this.repeat.isConstant;
  }

  constructor(options: {
    image: Property<string> | string;
    repeat?: Property<Vec2Type> | Vec2Type;
  }) {
    this.image = _wrapIfNeeded(options.image);
    this.repeat = _wrapIfNeeded(options.repeat ?? Vec2.create(1, 1));
  }

  getValue(time: JulianDateType): ImageMaterialValue {
    return {
      image: this.image.getValue(time),
      repeat: this.repeat.getValue(time),
    };
  }

  equals(other: Property<ImageMaterialValue>): boolean {
    if (!(other instanceof ImageMaterialProperty)) return false;
    return this.image.equals(other.image) && this.repeat.equals(other.repeat);
  }
}

function _wrapIfNeeded<T>(value: Property<T> | T): Property<T> {
  if (value != null && typeof (value as any).getValue === 'function') {
    return value as Property<T>;
  }
  return new ConstantProperty(value as T);
}
