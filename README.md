# Vellusion

**Next-generation WebGPU-powered 3D geospatial visualization engine**

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![WebGPU](https://img.shields.io/badge/WebGPU-native-orange.svg)](https://www.w3.org/TR/webgpu/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Build](https://img.shields.io/badge/Build-pnpm-yellow.svg)](https://pnpm.io/)

## Overview

Vellusion is a modern 3D GIS engine built from the ground up on **WebGPU** and **WGSL**, designed as a next-generation alternative to CesiumJS. Written entirely in **TypeScript** with strict mode, Vellusion leverages the full power of the modern GPU pipeline — including compute shaders — to deliver high-performance geospatial visualization in the browser.

Vellusion supports three projection views:

- **3D Globe** — full spherical Earth rendering
- **2.5D Columbus View** — flat map with 3D elevation
- **2D Map View** — traditional flat map projection

## Features

- **WebGPU native rendering** — built directly on the WebGPU API, not a WebGL compatibility layer
- **WGSL compute shaders** — GPU-driven particle simulation and spatial computation
- **PBR Cook-Torrance materials** — physically based rendering with metallic-roughness workflow
- **Globe with quadtree tile scheduling** — dynamic terrain and imagery tile management
- **3D Tiles 1.0** — streaming of b3dm, i3dm, pnts, and cmpt tile formats
- **glTF 2.0 / GLB model loading** — full support for skinning, morph targets, and animation
- **Entity-Property system** — time-dynamic data binding with interpolation
- **GIS spatial analysis** — distance measurement, slope analysis, contour generation, viewshed computation
- **Data sources** — GeoJSON, KML, and CZML ingestion
- **Native DOM UI widgets** — framework-free controls with dark and light theming
- **Full TypeScript** — strict mode throughout, with complete type definitions

## Packages

Vellusion is organized as a monorepo with 12 packages:

| Package | Description |
| --- | --- |
| `@vellusion/math` | 64-bit vectors, matrices, quaternions, and coordinate transforms |
| `@vellusion/core` | WebGPU device, pipeline, buffer, and texture abstractions |
| `@vellusion/scene` | Scene graph, cameras, orbit and fly controls |
| `@vellusion/globe` | Ellipsoid, terrain, imagery, and tile scheduling |
| `@vellusion/geometry` | Primitives, appearances, and materials |
| `@vellusion/datasources` | Entity API, GeoJSON/KML/CZML data sources |
| `@vellusion/tiles3d` | 3D Tiles 1.0 tileset streaming |
| `@vellusion/model` | glTF 2.0 loader and PBR rendering |
| `@vellusion/particles` | GPU compute particle system |
| `@vellusion/analysis` | GIS spatial analysis tools |
| `@vellusion/widgets` | UI controls, viewer component, and theming |
| `@vellusion/vellusion` | Unified re-export of all packages |

## Installation

Install the full bundle:

```bash
npm install @vellusion/vellusion
```

Or install individual packages as needed:

```bash
npm install @vellusion/core @vellusion/scene @vellusion/globe
```

## Quick Start

```typescript
import { Viewer } from '@vellusion/vellusion';

const viewer = new Viewer('container', {
  terrain: true,
  baseLayerPicker: true,
});
```

## Examples

The `examples/` directory contains runnable demos covering the main capabilities:

| Example | Description |
| --- | --- |
| `basic-globe` | Minimal globe with default imagery |
| `terrain-imagery` | Terrain elevation with multiple imagery layers |
| `geometry-showcase` | Built-in primitive geometries and materials |
| `entity-demo` | Entity-Property system with time-dynamic data |
| `geojson-viewer` | Loading and styling GeoJSON data |
| `tiles3d-viewer` | Streaming 3D Tiles tilesets |
| `model-viewer` | glTF 2.0 model loading with animation |
| `particle-effects` | GPU compute shader particle systems |
| `analysis-tools` | GIS analysis: distance, slope, contours, viewshed |
| `full-viewer` | Complete viewer with all widgets and features |

To run an example:

```bash
cd examples/<example-name>
pnpm install
pnpm dev
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm run build
```

## Architecture

The packages follow a layered dependency chain:

```
math → core → scene → globe → geometry → datasources → tiles3d/model → particles/analysis → widgets → vellusion
```

Each layer depends only on packages to its left, ensuring clean separation of concerns and enabling tree-shaking when only a subset of functionality is needed.

## License

[MIT](LICENSE)
