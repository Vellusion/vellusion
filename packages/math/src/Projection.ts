import type { Vec3Type } from './Vec3';
import type { CartographicType } from './Cartographic';
import type { EllipsoidType } from './Ellipsoid';
import { Ellipsoid } from './Ellipsoid';
import { VelMath } from './MathUtils';

export interface ProjectionType {
  project(cartographic: CartographicType, result: Vec3Type): Vec3Type;
  unproject(position: Vec3Type, result: CartographicType): CartographicType;
}

export const GeographicProjection = {
  create(ellipsoid: EllipsoidType = Ellipsoid.WGS84): ProjectionType {
    return {
      project(cartographic: CartographicType, result: Vec3Type): Vec3Type {
        result[0] = cartographic[0] * ellipsoid.radii[0]; // x = longitude * a
        result[1] = cartographic[1] * ellipsoid.radii[0]; // y = latitude * a
        result[2] = cartographic[2];                       // z = height
        return result;
      },

      unproject(position: Vec3Type, result: CartographicType): CartographicType {
        result[0] = position[0] / ellipsoid.radii[0]; // longitude = x / a
        result[1] = position[1] / ellipsoid.radii[0]; // latitude = y / a
        result[2] = position[2];                       // height = z
        return result;
      },
    };
  },
} as const;

const MAX_MERCATOR_LATITUDE = VelMath.toRadians(85.05112878);

export const WebMercatorProjection = {
  create(ellipsoid: EllipsoidType = Ellipsoid.WGS84): ProjectionType {
    return {
      project(cartographic: CartographicType, result: Vec3Type): Vec3Type {
        const a = ellipsoid.radii[0]; // semimajor axis
        const longitude = cartographic[0];
        const latitude = VelMath.clamp(cartographic[1], -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);

        result[0] = longitude * a;
        result[1] = a * Math.log(Math.tan(Math.PI / 4 + latitude / 2));
        result[2] = cartographic[2];
        return result;
      },

      unproject(position: Vec3Type, result: CartographicType): CartographicType {
        const a = ellipsoid.radii[0]; // semimajor axis

        result[0] = position[0] / a;                                     // longitude
        result[1] = 2.0 * Math.atan(Math.exp(position[1] / a)) - VelMath.HALF_PI; // latitude
        result[2] = position[2];                                         // height
        return result;
      },
    };
  },
} as const;
