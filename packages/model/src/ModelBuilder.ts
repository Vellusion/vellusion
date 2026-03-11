import type { GltfDocument } from './gltf/GltfDocument';
import { ModelNode, ModelMesh, ModelPrimitive } from './ModelSceneGraph';
import {
  ModelAnimation,
  AnimationChannel,
  AnimationSampler,
} from './ModelAnimation';
import { ModelSkin } from './ModelSkin';
import { PbrMaterial } from './PbrMaterial';
import { Mat4 } from '@vellusion/math';

export interface ModelData {
  rootNodes: ModelNode[];
  allNodes: ModelNode[];
  meshes: ModelMesh[];
  materials: PbrMaterial[];
  animations: ModelAnimation[];
  skins: ModelSkin[];
}

export class ModelBuilder {
  static build(doc: GltfDocument): ModelData {
    const json = doc.json;
    const materials = (json.materials ?? []).map((m) =>
      PbrMaterial.fromGltfMaterial(m),
    );
    if (materials.length === 0) materials.push(PbrMaterial.default());

    // Build meshes
    const meshes = (json.meshes ?? []).map((gltfMesh) => {
      const prims = gltfMesh.primitives.map((p) => {
        const positions = doc.getAccessorData(
          p.attributes.POSITION,
        ) as Float32Array;
        const normals =
          p.attributes.NORMAL !== undefined
            ? (doc.getAccessorData(p.attributes.NORMAL) as Float32Array)
            : null;
        const uvs =
          p.attributes.TEXCOORD_0 !== undefined
            ? (doc.getAccessorData(p.attributes.TEXCOORD_0) as Float32Array)
            : null;
        const tangents =
          p.attributes.TANGENT !== undefined
            ? (doc.getAccessorData(p.attributes.TANGENT) as Float32Array)
            : null;
        const indices =
          p.indices !== undefined
            ? (doc.getAccessorData(p.indices) as Uint16Array | Uint32Array)
            : null;

        return new ModelPrimitive({
          positions:
            positions instanceof Float32Array
              ? positions
              : new Float32Array(positions),
          normals:
            normals instanceof Float32Array
              ? normals
              : normals
                ? new Float32Array(normals)
                : undefined,
          uvs:
            uvs instanceof Float32Array
              ? uvs
              : uvs
                ? new Float32Array(uvs)
                : undefined,
          tangents:
            tangents instanceof Float32Array
              ? tangents
              : tangents
                ? new Float32Array(tangents)
                : undefined,
          indices: indices ?? undefined,
          materialIndex: p.material ?? 0,
          mode: p.mode ?? 4,
        });
      });
      return new ModelMesh(prims);
    });

    // Build nodes
    const allNodes = (json.nodes ?? []).map((n) => {
      const node = new ModelNode(n.name);
      if (n.translation) {
        node.translation[0] = n.translation[0];
        node.translation[1] = n.translation[1];
        node.translation[2] = n.translation[2];
      }
      if (n.rotation) {
        node.rotation[0] = n.rotation[0];
        node.rotation[1] = n.rotation[1];
        node.rotation[2] = n.rotation[2];
        node.rotation[3] = n.rotation[3];
      }
      if (n.scale) {
        node.scale[0] = n.scale[0];
        node.scale[1] = n.scale[1];
        node.scale[2] = n.scale[2];
      }
      if (n.matrix) {
        for (let j = 0; j < 16; j++) node.localMatrix[j] = n.matrix[j];
      }
      if (n.mesh !== undefined && meshes[n.mesh]) {
        node.mesh = meshes[n.mesh];
      }
      if (n.skin !== undefined) {
        node.skinIndex = n.skin;
      }
      return node;
    });

    // Set up parent-child relationships
    (json.nodes ?? []).forEach((n, i) => {
      if (n.children) {
        for (const ci of n.children) {
          allNodes[i].addChild(allNodes[ci]);
        }
      }
    });

    // Root nodes from default scene
    const sceneIndex = json.scene ?? 0;
    const scene = json.scenes?.[sceneIndex];
    const rootNodeIndices = scene?.nodes ?? [];
    const rootNodes = rootNodeIndices.map((i) => allNodes[i]);

    // Update world matrices
    for (const root of rootNodes) {
      root.updateWorldMatrix();
    }

    // Build skins
    const skins = (json.skins ?? []).map((s) => {
      const joints = s.joints.map((j) => allNodes[j]);
      const ibmData =
        s.inverseBindMatrices !== undefined
          ? (doc.getAccessorData(s.inverseBindMatrices) as Float32Array)
          : null;
      const inverseBindMatrices = joints.map((_, i) => {
        const m = Mat4.identity();
        if (ibmData) {
          for (let j = 0; j < 16; j++) m[j] = ibmData[i * 16 + j];
        }
        return m;
      });
      return new ModelSkin(joints, inverseBindMatrices);
    });

    // Build animations
    const animations = (json.animations ?? []).map((a) => {
      const anim = new ModelAnimation(a.name);
      for (const ch of a.channels) {
        if (ch.target.node === undefined) continue;
        const targetNode = allNodes[ch.target.node];
        const samplerDef = a.samplers[ch.sampler];
        const inputData = doc.getAccessorData(samplerDef.input) as Float32Array;
        const outputData = doc.getAccessorData(
          samplerDef.output,
        ) as Float32Array;
        const path = ch.target.path as
          | 'translation'
          | 'rotation'
          | 'scale'
          | 'weights';
        const components = path === 'rotation' ? 4 : 3;
        const sampler = new AnimationSampler(
          inputData instanceof Float32Array
            ? inputData
            : new Float32Array(inputData),
          outputData instanceof Float32Array
            ? outputData
            : new Float32Array(outputData),
          components,
          samplerDef.interpolation ?? 'LINEAR',
        );
        anim.channels.push(new AnimationChannel(targetNode, path, sampler));
        // Update duration
        const maxTime = inputData[inputData.length - 1];
        if (maxTime > anim.duration) anim.duration = maxTime;
      }
      return anim;
    });

    return { rootNodes, allNodes, meshes, materials, animations, skins };
  }
}
