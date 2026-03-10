import type { Vec3Type } from './Vec3';
import { Vec3 } from './Vec3';
import type { CartographicType } from './Cartographic';
import { VelMath } from './MathUtils';

export type EllipsoidType = {
  radii: Vec3Type;
  radiiSquared: Vec3Type;
  oneOverRadii: Vec3Type;
  oneOverRadiiSquared: Vec3Type;
};

function createEllipsoid(x: number, y: number, z: number): EllipsoidType {
  return {
    radii: Vec3.create(x, y, z),
    radiiSquared: Vec3.create(x * x, y * y, z * z),
    oneOverRadii: Vec3.create(1.0 / x, 1.0 / y, 1.0 / z),
    oneOverRadiiSquared: Vec3.create(1.0 / (x * x), 1.0 / (y * y), 1.0 / (z * z)),
  };
}

export const Ellipsoid = {
  create(x: number, y: number, z: number): EllipsoidType {
    return createEllipsoid(x, y, z);
  },

  WGS84: createEllipsoid(6378137.0, 6378137.0, 6356752.3142451793),

  UNIT_SPHERE: createEllipsoid(1.0, 1.0, 1.0),

  cartographicToCartesian(
    ellipsoid: EllipsoidType,
    cartographic: CartographicType,
    result: Vec3Type,
  ): Vec3Type {
    const longitude = cartographic[0];
    const latitude = cartographic[1];
    const height = cartographic[2];

    const cosLatitude = Math.cos(latitude);
    const sinLatitude = Math.sin(latitude);
    const cosLongitude = Math.cos(longitude);
    const sinLongitude = Math.sin(longitude);

    const radiiSquared = ellipsoid.radiiSquared;

    // Normal direction (geodetic surface normal from lat/lon)
    const nx = cosLatitude * cosLongitude;
    const ny = cosLatitude * sinLongitude;
    const nz = sinLatitude;

    // Scale normal by radiiSquared to get surface point direction
    const gamma_x = radiiSquared[0] * nx;
    const gamma_y = radiiSquared[1] * ny;
    const gamma_z = radiiSquared[2] * nz;

    // Normalize to get surface point
    const magnitude = Math.sqrt(gamma_x * nx + gamma_y * ny + gamma_z * nz);

    const surfaceX = gamma_x / magnitude;
    const surfaceY = gamma_y / magnitude;
    const surfaceZ = gamma_z / magnitude;

    // Add height along the geodetic surface normal
    result[0] = surfaceX + height * nx;
    result[1] = surfaceY + height * ny;
    result[2] = surfaceZ + height * nz;

    return result;
  },

  cartesianToCartographic(
    ellipsoid: EllipsoidType,
    cartesian: Vec3Type,
    result: CartographicType,
  ): CartographicType {
    const surfacePoint = Vec3.zero();
    Ellipsoid.scaleToGeodeticSurface(ellipsoid, cartesian, surfacePoint);

    const normal = Vec3.zero();
    Ellipsoid.geodeticSurfaceNormal(ellipsoid, surfacePoint, normal);

    // Height is the distance from the surface point to the cartesian point
    // along the normal direction
    const hx = cartesian[0] - surfacePoint[0];
    const hy = cartesian[1] - surfacePoint[1];
    const hz = cartesian[2] - surfacePoint[2];

    const heightMag = Math.sqrt(hx * hx + hy * hy + hz * hz);
    const sign = hx * normal[0] + hy * normal[1] + hz * normal[2] >= 0 ? 1.0 : -1.0;

    result[0] = Math.atan2(surfacePoint[1], surfacePoint[0]); // longitude
    result[1] = Math.asin(VelMath.clamp(normal[2], -1.0, 1.0)); // latitude
    result[2] = sign * heightMag; // height

    return result;
  },

  geodeticSurfaceNormal(
    ellipsoid: EllipsoidType,
    cartesian: Vec3Type,
    result: Vec3Type,
  ): Vec3Type {
    const oneOverRadiiSquared = ellipsoid.oneOverRadiiSquared;

    result[0] = cartesian[0] * oneOverRadiiSquared[0];
    result[1] = cartesian[1] * oneOverRadiiSquared[1];
    result[2] = cartesian[2] * oneOverRadiiSquared[2];

    const magnitude = Vec3.magnitude(result);
    result[0] /= magnitude;
    result[1] /= magnitude;
    result[2] /= magnitude;

    return result;
  },

  geocentricSurfaceNormal(
    cartesian: Vec3Type,
    result: Vec3Type,
  ): Vec3Type {
    return Vec3.normalize(cartesian, result);
  },

  scaleToGeodeticSurface(
    ellipsoid: EllipsoidType,
    cartesian: Vec3Type,
    result: Vec3Type,
  ): Vec3Type {
    const positionX = cartesian[0];
    const positionY = cartesian[1];
    const positionZ = cartesian[2];

    const oneOverRadiiSquaredX = ellipsoid.oneOverRadiiSquared[0];
    const oneOverRadiiSquaredY = ellipsoid.oneOverRadiiSquared[1];
    const oneOverRadiiSquaredZ = ellipsoid.oneOverRadiiSquared[2];

    const beta = 1.0 / Math.sqrt(
      positionX * positionX * oneOverRadiiSquaredX +
      positionY * positionY * oneOverRadiiSquaredY +
      positionZ * positionZ * oneOverRadiiSquaredZ,
    );
    const n = Vec3.magnitude(
      Vec3.create(
        beta * positionX * oneOverRadiiSquaredX,
        beta * positionY * oneOverRadiiSquaredY,
        beta * positionZ * oneOverRadiiSquaredZ,
      ),
    );
    let alpha = (1.0 - beta) * (Vec3.magnitude(cartesian) / n);

    const s2x = positionX * positionX;
    const s2y = positionY * positionY;
    const s2z = positionZ * positionZ;

    // Newton's method iteration
    for (let i = 0; i < 10; i++) {
      const da0 = 1.0 / (1.0 + alpha * oneOverRadiiSquaredX);
      const da1 = 1.0 / (1.0 + alpha * oneOverRadiiSquaredY);
      const da2 = 1.0 / (1.0 + alpha * oneOverRadiiSquaredZ);

      const da0sq = da0 * da0;
      const da1sq = da1 * da1;
      const da2sq = da2 * da2;

      const da0cu = da0sq * da0;
      const da1cu = da1sq * da1;
      const da2cu = da2sq * da2;

      const fx = s2x * da0sq * oneOverRadiiSquaredX +
                 s2y * da1sq * oneOverRadiiSquaredY +
                 s2z * da2sq * oneOverRadiiSquaredZ - 1.0;

      if (Math.abs(fx) < VelMath.EPSILON14) {
        break;
      }

      const dfx = -2.0 * (
        s2x * da0cu * oneOverRadiiSquaredX * oneOverRadiiSquaredX +
        s2y * da1cu * oneOverRadiiSquaredY * oneOverRadiiSquaredY +
        s2z * da2cu * oneOverRadiiSquaredZ * oneOverRadiiSquaredZ
      );

      alpha -= fx / dfx;
    }

    result[0] = positionX / (1.0 + alpha * oneOverRadiiSquaredX);
    result[1] = positionY / (1.0 + alpha * oneOverRadiiSquaredY);
    result[2] = positionZ / (1.0 + alpha * oneOverRadiiSquaredZ);

    return result;
  },
} as const;
