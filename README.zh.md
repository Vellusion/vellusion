# Vellusion

**新一代基于 WebGPU 的三维地理空间可视化引擎**

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![WebGPU](https://img.shields.io/badge/WebGPU-native-orange.svg)](https://www.w3.org/TR/webgpu/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Build](https://img.shields.io/badge/Build-pnpm-yellow.svg)](https://pnpm.io/)

## 概述

Vellusion 是一款从零构建的现代三维 GIS 引擎，完全基于 **WebGPU** 和 **WGSL** 开发，旨在成为 CesiumJS 的下一代替代方案。项目使用 **TypeScript** 严格模式编写，充分利用现代 GPU 管线的全部能力（包括计算着色器），在浏览器中实现高性能地理空间可视化。

Vellusion 支持三种投影视图：

- **三维球体视图** — 完整的球形地球渲染
- **2.5D 哥伦布视图** — 带三维高程的平面地图
- **二维地图视图** — 传统平面地图投影

## 特性

- **WebGPU 原生渲染** — 直接构建于 WebGPU API 之上，而非 WebGL 兼容层
- **WGSL 计算着色器** — GPU 驱动的粒子模拟与空间计算
- **PBR Cook-Torrance 材质** — 基于物理的渲染，支持金属度-粗糙度工作流
- **四叉树瓦片调度的地球渲染** — 动态地形与影像瓦片管理
- **3D Tiles 1.0** — 支持 b3dm、i3dm、pnts、cmpt 瓦片格式流式加载
- **glTF 2.0 / GLB 模型加载** — 完整支持骨骼蒙皮、变形目标与动画
- **实体-属性系统** — 支持插值的时序动态数据绑定
- **GIS 空间分析** — 距离量测、坡度分析、等高线生成、通视域计算
- **数据源** — 支持 GeoJSON、KML、CZML 数据接入
- **原生 DOM 界面组件** — 无框架依赖的控件，支持深色与浅色主题
- **全量 TypeScript** — 全面启用严格模式，附带完整类型定义

## 包结构

Vellusion 采用 monorepo 架构，包含 12 个包：

| 包名 | 说明 |
| --- | --- |
| `@vellusion/math` | 64 位向量、矩阵、四元数与坐标变换 |
| `@vellusion/core` | WebGPU 设备、管线、缓冲区与纹理抽象 |
| `@vellusion/scene` | 场景图、相机、轨道与飞行控制器 |
| `@vellusion/globe` | 椭球体、地形、影像与瓦片调度 |
| `@vellusion/geometry` | 图元、外观与材质 |
| `@vellusion/datasources` | 实体 API、GeoJSON/KML/CZML 数据源 |
| `@vellusion/tiles3d` | 3D Tiles 1.0 瓦片集流式加载 |
| `@vellusion/model` | glTF 2.0 加载器与 PBR 渲染 |
| `@vellusion/particles` | GPU 计算着色器粒子系统 |
| `@vellusion/analysis` | GIS 空间分析工具 |
| `@vellusion/widgets` | 界面控件、Viewer 组件与主题系统 |
| `@vellusion/vellusion` | 统一导出所有包 |

## 安装

安装完整包：

```bash
npm install @vellusion/vellusion
```

也可以按需安装单独的包：

```bash
npm install @vellusion/core @vellusion/scene @vellusion/globe
```

## 快速开始

```typescript
import { Viewer } from '@vellusion/vellusion';

const viewer = new Viewer('container', {
  terrain: true,
  baseLayerPicker: true,
});
```

## 示例

`examples/` 目录包含覆盖主要功能的可运行示例：

| 示例 | 说明 |
| --- | --- |
| `basic-globe` | 使用默认影像的最小化地球 |
| `terrain-imagery` | 带多图层影像的地形高程 |
| `geometry-showcase` | 内置图元几何体与材质展示 |
| `entity-demo` | 实体-属性系统与时序动态数据 |
| `geojson-viewer` | GeoJSON 数据加载与样式设置 |
| `tiles3d-viewer` | 3D Tiles 瓦片集流式加载 |
| `model-viewer` | glTF 2.0 模型加载与动画播放 |
| `particle-effects` | GPU 计算着色器粒子系统 |
| `analysis-tools` | GIS 分析：距离、坡度、等高线、通视域 |
| `full-viewer` | 包含全部组件与功能的完整查看器 |

运行示例：

```bash
cd examples/<示例名称>
pnpm install
pnpm dev
```

## 开发

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建所有包
pnpm run build
```

## 架构

各包遵循分层依赖链：

```
math → core → scene → globe → geometry → datasources → tiles3d/model → particles/analysis → widgets → vellusion
```

每一层仅依赖其左侧的包，确保关注点清晰分离，并支持按需 tree-shaking，只引入所需功能子集。

## 许可证

[MIT](LICENSE)
