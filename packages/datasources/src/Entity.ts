let nextEntityId = 0;

/**
 * Options for constructing an {@link Entity}.
 * Graphics component properties use `any` to avoid circular dependencies
 * with the Property system.
 */
export interface EntityOptions {
  id?: string;
  name?: string;
  show?: boolean;
  position?: any;
  orientation?: any;
  description?: any;
  parent?: Entity;
  billboard?: any;
  box?: any;
  corridor?: any;
  cylinder?: any;
  ellipse?: any;
  ellipsoid?: any;
  label?: any;
  model?: any;
  path?: any;
  plane?: any;
  point?: any;
  polygon?: any;
  polyline?: any;
  polylineVolume?: any;
  rectangle?: any;
  wall?: any;
}

/** Keys that are bulk-assigned from EntityOptions. */
const OPTIONAL_KEYS = [
  'position', 'orientation', 'description',
  'billboard', 'box', 'corridor', 'cylinder', 'ellipse', 'ellipsoid',
  'label', 'model', 'path', 'plane', 'point', 'polygon', 'polyline',
  'polylineVolume', 'rectangle', 'wall',
] as const;

/**
 * An Entity is the fundamental unit for associating data (position,
 * graphics, description, etc.) with a uniquely identifiable object.
 */
export class Entity {
  id: string;
  name?: string;
  show: boolean;

  position?: any;
  orientation?: any;
  description?: any;

  billboard?: any;
  box?: any;
  corridor?: any;
  cylinder?: any;
  ellipse?: any;
  ellipsoid?: any;
  label?: any;
  model?: any;
  path?: any;
  plane?: any;
  point?: any;
  polygon?: any;
  polyline?: any;
  polylineVolume?: any;
  rectangle?: any;
  wall?: any;

  parent?: Entity;
  readonly children: Entity[] = [];

  constructor(options?: EntityOptions) {
    this.id = options?.id ?? `entity_${nextEntityId++}`;
    this.name = options?.name;
    this.show = options?.show ?? true;

    if (options) {
      for (const key of OPTIONAL_KEYS) {
        if ((options as any)[key] !== undefined) {
          (this as any)[key] = (options as any)[key];
        }
      }
      if (options.parent) {
        this.parent = options.parent;
        options.parent.children.push(this);
      }
    }
  }
}
