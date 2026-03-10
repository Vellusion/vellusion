import { describe, it, expect } from 'vitest';
import { Vec3 } from '@vellusion/math';
import { SceneNode } from '../src/SceneNode';

describe('SceneNode', () => {
  it('addChild sets parent, adds to children array', () => {
    const parent = new SceneNode('parent');
    const child = new SceneNode('child');

    parent.addChild(child);

    expect(child.parent).toBe(parent);
    expect(parent.children).toContain(child);
    expect(parent.children.length).toBe(1);
  });

  it('removeChild unlinks parent, removes from array', () => {
    const parent = new SceneNode('parent');
    const child = new SceneNode('child');
    parent.addChild(child);

    parent.removeChild(child);

    expect(child.parent).toBeNull();
    expect(parent.children.length).toBe(0);
  });

  it('removeFromParent delegates correctly', () => {
    const parent = new SceneNode('parent');
    const child = new SceneNode('child');
    parent.addChild(child);

    child.removeFromParent();

    expect(child.parent).toBeNull();
    expect(parent.children.length).toBe(0);
  });

  it('addChild on already-parented child re-parents it', () => {
    const parentA = new SceneNode('parentA');
    const parentB = new SceneNode('parentB');
    const child = new SceneNode('child');

    parentA.addChild(child);
    expect(child.parent).toBe(parentA);
    expect(parentA.children.length).toBe(1);

    parentB.addChild(child);
    expect(child.parent).toBe(parentB);
    expect(parentB.children).toContain(child);
    expect(parentA.children.length).toBe(0);
  });

  it('setPosition updates localMatrix after updateWorldMatrix', () => {
    const node = new SceneNode('node');
    node.setPosition(10, 20, 30);
    node.updateWorldMatrix();

    // Column-major: translation is in indices 12, 13, 14
    expect(node.localMatrix[12]).toBe(10);
    expect(node.localMatrix[13]).toBe(20);
    expect(node.localMatrix[14]).toBe(30);
  });

  it('updateWorldMatrix propagates to children (parent translate + child translate = combined)', () => {
    const parent = new SceneNode('parent');
    const child = new SceneNode('child');
    parent.addChild(child);

    parent.setPosition(100, 0, 0);
    child.setPosition(0, 50, 0);
    parent.updateWorldMatrix();

    // Child world translation = parent translation + child translation
    expect(child.worldMatrix[12]).toBe(100);
    expect(child.worldMatrix[13]).toBe(50);
    expect(child.worldMatrix[14]).toBe(0);
  });

  it('traverse visits all nodes depth-first', () => {
    const root = new SceneNode('root');
    const a = new SceneNode('a');
    const b = new SceneNode('b');
    const a1 = new SceneNode('a1');
    root.addChild(a);
    root.addChild(b);
    a.addChild(a1);

    const visited: string[] = [];
    root.traverse((node) => visited.push(node.name));

    expect(visited).toEqual(['root', 'a', 'a1', 'b']);
  });

  it('find locates nested node by name', () => {
    const root = new SceneNode('root');
    const child = new SceneNode('child');
    const grandchild = new SceneNode('target');
    root.addChild(child);
    child.addChild(grandchild);

    const found = root.find('target');
    expect(found).toBe(grandchild);
  });

  it('find returns undefined for missing name', () => {
    const root = new SceneNode('root');
    const child = new SceneNode('child');
    root.addChild(child);

    const found = root.find('nonexistent');
    expect(found).toBeUndefined();
  });

  it('visible flag is settable', () => {
    const node = new SceneNode('node');
    expect(node.visible).toBe(true);

    node.visible = false;
    expect(node.visible).toBe(false);

    node.visible = true;
    expect(node.visible).toBe(true);
  });
});
