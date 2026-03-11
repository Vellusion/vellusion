// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Timeline, AnimationControls } from '@vellusion/widgets';

// ─── Timeline ───────────────────────────────────────────────────────────
describe('Timeline', () => {
  function makeParent(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  }

  it('currentTime clamps to range', () => {
    const parent = makeParent();
    const tl = new Timeline(parent, {
      startTime: 0,
      stopTime: 100,
      currentTime: 50,
    });
    tl.currentTime = 200;
    expect(tl.currentTime).toBe(100);
    tl.currentTime = -10;
    expect(tl.currentTime).toBe(0);
    tl.destroy();
  });

  it('setting startTime updates internally', () => {
    const parent = makeParent();
    const tl = new Timeline(parent, {
      startTime: 0,
      stopTime: 100,
      currentTime: 50,
    });
    tl.startTime = 10;
    expect(tl.startTime).toBe(10);
    tl.destroy();
  });

  it('setting stopTime updates internally', () => {
    const parent = makeParent();
    const tl = new Timeline(parent, {
      startTime: 0,
      stopTime: 100,
      currentTime: 50,
    });
    tl.stopTime = 200;
    expect(tl.stopTime).toBe(200);
    tl.destroy();
  });
});

// ─── AnimationControls ──────────────────────────────────────────────────
describe('AnimationControls', () => {
  function makeParent(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  }

  it('play/pause toggles isPlaying', () => {
    const ctrl = new AnimationControls(makeParent());
    expect(ctrl.isPlaying).toBe(false);
    ctrl.play();
    expect(ctrl.isPlaying).toBe(true);
    ctrl.pause();
    expect(ctrl.isPlaying).toBe(false);
    ctrl.destroy();
  });

  it('speedUp doubles speed', () => {
    const ctrl = new AnimationControls(makeParent());
    expect(ctrl.speed).toBe(1);
    ctrl.speedUp();
    expect(ctrl.speed).toBe(2);
    ctrl.speedUp();
    expect(ctrl.speed).toBe(4);
    ctrl.destroy();
  });

  it('slowDown halves speed', () => {
    const ctrl = new AnimationControls(makeParent());
    expect(ctrl.speed).toBe(1);
    ctrl.slowDown();
    expect(ctrl.speed).toBe(0.5);
    ctrl.slowDown();
    expect(ctrl.speed).toBe(0.25);
    ctrl.destroy();
  });

  it('speed capped at 64', () => {
    const ctrl = new AnimationControls(makeParent());
    for (let i = 0; i < 20; i++) ctrl.speedUp();
    expect(ctrl.speed).toBe(64);
    ctrl.destroy();
  });

  it('speed min at 0.125', () => {
    const ctrl = new AnimationControls(makeParent());
    for (let i = 0; i < 20; i++) ctrl.slowDown();
    expect(ctrl.speed).toBe(0.125);
    ctrl.destroy();
  });

  it('reverse toggles isReversed', () => {
    const ctrl = new AnimationControls(makeParent());
    expect(ctrl.isReversed).toBe(false);
    ctrl.reverse();
    expect(ctrl.isReversed).toBe(true);
    ctrl.reverse();
    expect(ctrl.isReversed).toBe(false);
    ctrl.destroy();
  });

  it('togglePlay switches between play and pause', () => {
    const ctrl = new AnimationControls(makeParent());
    expect(ctrl.isPlaying).toBe(false);
    ctrl.togglePlay();
    expect(ctrl.isPlaying).toBe(true);
    ctrl.togglePlay();
    expect(ctrl.isPlaying).toBe(false);
    ctrl.destroy();
  });

  it('fires onPlay/onPause callbacks', () => {
    let playCount = 0;
    let pauseCount = 0;
    const ctrl = new AnimationControls(makeParent(), {
      onPlay: () => playCount++,
      onPause: () => pauseCount++,
    });
    ctrl.play();
    ctrl.pause();
    expect(playCount).toBe(1);
    expect(pauseCount).toBe(1);
    ctrl.destroy();
  });
});
