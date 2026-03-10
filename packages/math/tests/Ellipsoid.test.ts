import { describe, it, expect } from 'vitest';
import { Ellipsoid } from '../src/Ellipsoid';
import { Cartographic } from '../src/Cartographic';
import { Vec3 } from '../src/Vec3';
import { VelMath } from '../src/MathUtils';

describe('Ellipsoid', () => {
  describe('create', () => {
    it('should create ellipsoid with precomputed fields', () => {
      const e = Ellipsoid.create(2, 3, 4);
      expect(e.radii[0]).toBe(2);
      expect(e.radii[1]).toBe(3);
      expect(e.radii[2]).toBe(4);
      expect(e.radiiSquared[0]).toBe(4);
      expect(e.radiiSquared[1]).toBe(9);
      expect(e.radiiSquared[2]).toBe(16);
      expect(e.oneOverRadii[0]).toBeCloseTo(0.5);
      expect(e.oneOverRadii[1]).toBeCloseTo(1 / 3);
      expect(e.oneOverRadii[2]).toBeCloseTo(0.25);
      expect(e.oneOverRadiiSquared[0]).toBeCloseTo(0.25);
      expect(e.oneOverRadiiSquared[1]).toBeCloseTo(1 / 9);
      expect(e.oneOverRadiiSquared[2]).toBeCloseTo(1 / 16);
    });
  });

  describe('WGS84 constant', () => {
    it('should have correct radii', () => {
      expect(Ellipsoid.WGS84.radii[0]).toBe(6378137.0);
      expect(Ellipsoid.WGS84.radii[1]).toBe(6378137.0);
      expect(Ellipsoid.WGS84.radii[2]).toBe(6356752.3142451793);
    });
  });

  describe('UNIT_SPHERE constant', () => {
    it('should have unit radii', () => {
      expect(Ellipsoid.UNIT_SPHERE.radii[0]).toBe(1);
      expect(Ellipsoid.UNIT_SPHERE.radii[1]).toBe(1);
      expect(Ellipsoid.UNIT_SPHERE.radii[2]).toBe(1);
    });
  });

  describe('WGS84 round-trip: (0, 0, 0) cartographic <-> cartesian', () => {
    it('should round-trip with error < EPSILON7', () => {
      const carto = Cartographic.fromDegrees(0, 0, 0);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, carto, cartesian);

      const roundTrip = Cartographic.create(0, 0, 0);
      Ellipsoid.cartesianToCartographic(Ellipsoid.WGS84, cartesian, roundTrip);

      expect(Cartographic.equalsEpsilon(carto, roundTrip, VelMath.EPSILON7)).toBe(true);
    });
  });

  describe('WGS84: North pole (0, 90, 0) -> cartesian z ~ 6356752.3', () => {
    it('should place north pole on z-axis', () => {
      const carto = Cartographic.fromDegrees(0, 90, 0);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, carto, cartesian);

      expect(Math.abs(cartesian[0])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(cartesian[1])).toBeLessThan(VelMath.EPSILON7);
      expect(cartesian[2]).toBeCloseTo(6356752.3142451793, 0);
    });
  });

  describe('geodeticSurfaceNormal', () => {
    it('should return (0, 0, 1) at north pole', () => {
      const carto = Cartographic.fromDegrees(0, 90, 0);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, carto, cartesian);

      const normal = Vec3.zero();
      Ellipsoid.geodeticSurfaceNormal(Ellipsoid.WGS84, cartesian, normal);

      expect(Math.abs(normal[0])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(normal[1])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(normal[2] - 1.0)).toBeLessThan(VelMath.EPSILON7);
    });

    it('should return (1, 0, 0) at (0, 0) on unit sphere', () => {
      const carto = Cartographic.fromDegrees(0, 0, 0);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.UNIT_SPHERE, carto, cartesian);

      const normal = Vec3.zero();
      Ellipsoid.geodeticSurfaceNormal(Ellipsoid.UNIT_SPHERE, cartesian, normal);

      expect(Math.abs(normal[0] - 1.0)).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(normal[1])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(normal[2])).toBeLessThan(VelMath.EPSILON7);
    });
  });

  describe('geocentricSurfaceNormal', () => {
    it('should return normalized cartesian', () => {
      const cartesian = Vec3.create(3, 4, 0);
      const normal = Vec3.zero();
      Ellipsoid.geocentricSurfaceNormal(cartesian, normal);

      expect(normal[0]).toBeCloseTo(0.6);
      expect(normal[1]).toBeCloseTo(0.8);
      expect(normal[2]).toBeCloseTo(0);
    });
  });

  describe('UNIT_SPHERE: cartographicToCartesian matches trig functions', () => {
    it('should match cos/sin for equator points', () => {
      const lon = Math.PI / 4; // 45 degrees
      const lat = 0;
      const carto = Cartographic.create(lon, lat, 0);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.UNIT_SPHERE, carto, cartesian);

      // On unit sphere at equator: x = cos(lon), y = sin(lon), z = 0
      // But geodetic: x = cos(lat)*cos(lon), y = cos(lat)*sin(lon), z = sin(lat)
      const expectedX = Math.cos(lat) * Math.cos(lon);
      const expectedY = Math.cos(lat) * Math.sin(lon);
      const expectedZ = Math.sin(lat);
      expect(cartesian[0]).toBeCloseTo(expectedX, 10);
      expect(cartesian[1]).toBeCloseTo(expectedY, 10);
      expect(cartesian[2]).toBeCloseTo(expectedZ, 10);
    });

    it('should match trig for arbitrary lat/lon', () => {
      const lon = Math.PI / 3; // 60 degrees
      const lat = Math.PI / 6; // 30 degrees
      const carto = Cartographic.create(lon, lat, 0);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.UNIT_SPHERE, carto, cartesian);

      const expectedX = Math.cos(lat) * Math.cos(lon);
      const expectedY = Math.cos(lat) * Math.sin(lon);
      const expectedZ = Math.sin(lat);
      expect(cartesian[0]).toBeCloseTo(expectedX, 10);
      expect(cartesian[1]).toBeCloseTo(expectedY, 10);
      expect(cartesian[2]).toBeCloseTo(expectedZ, 10);
    });
  });

  describe('scaleToGeodeticSurface', () => {
    it('should project a point onto the ellipsoid surface', () => {
      // A point 1000m above the surface at (0, 0) on WGS84
      const carto = Cartographic.fromDegrees(0, 0, 1000);
      const aboveSurface = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, carto, aboveSurface);

      const onSurface = Vec3.zero();
      Ellipsoid.scaleToGeodeticSurface(Ellipsoid.WGS84, aboveSurface, onSurface);

      // The projected point should be at height 0
      const surfaceCarto = Cartographic.create(0, 0, 0);
      Ellipsoid.cartesianToCartographic(Ellipsoid.WGS84, onSurface, surfaceCarto);

      expect(Math.abs(surfaceCarto[2])).toBeLessThan(VelMath.EPSILON7);
    });

    it('should project correctly for unit sphere', () => {
      // Point at (2, 0, 0) should project to (1, 0, 0) on unit sphere
      const point = Vec3.create(2, 0, 0);
      const onSurface = Vec3.zero();
      Ellipsoid.scaleToGeodeticSurface(Ellipsoid.UNIT_SPHERE, point, onSurface);

      expect(onSurface[0]).toBeCloseTo(1.0);
      expect(Math.abs(onSurface[1])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(onSurface[2])).toBeLessThan(VelMath.EPSILON7);
    });

    it('should project arbitrary points onto unit sphere', () => {
      const point = Vec3.create(3, 4, 0);
      const onSurface = Vec3.zero();
      Ellipsoid.scaleToGeodeticSurface(Ellipsoid.UNIT_SPHERE, point, onSurface);

      // On a unit sphere, result should be normalized
      const mag = Vec3.magnitude(onSurface);
      expect(mag).toBeCloseTo(1.0);
    });
  });

  describe('cartesianToCartographic', () => {
    it('should handle points at different longitudes', () => {
      const carto = Cartographic.fromDegrees(45, 30, 500);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, carto, cartesian);

      const result = Cartographic.create(0, 0, 0);
      Ellipsoid.cartesianToCartographic(Ellipsoid.WGS84, cartesian, result);

      expect(Cartographic.equalsEpsilon(carto, result, VelMath.EPSILON7)).toBe(true);
    });

    it('should handle negative longitude and latitude', () => {
      const carto = Cartographic.fromDegrees(-120, -45, 1000);
      const cartesian = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, carto, cartesian);

      const result = Cartographic.create(0, 0, 0);
      Ellipsoid.cartesianToCartographic(Ellipsoid.WGS84, cartesian, result);

      expect(Cartographic.equalsEpsilon(carto, result, VelMath.EPSILON7)).toBe(true);
    });
  });
});
