import { describe, it, expect } from 'vitest';
import { JulianDate } from '../src/JulianDate';
import { Clock, ClockRange, ClockStep } from '../src/Clock';

describe('Clock', () => {
  it('tick advances time by delta x multiplier', () => {
    const start = JulianDate.create(2460000, 0);
    const clock = new Clock({
      startTime: JulianDate.clone(start),
      currentTime: JulianDate.clone(start),
      multiplier: 1,
    });

    clock.tick(10);

    expect(JulianDate.secondsDifference(clock.currentTime, start)).toBeCloseTo(10, 5);
  });

  it('multiplier=2 advances twice as fast', () => {
    const start = JulianDate.create(2460000, 0);
    const clock = new Clock({
      startTime: JulianDate.clone(start),
      currentTime: JulianDate.clone(start),
      multiplier: 2,
    });

    clock.tick(10);

    expect(JulianDate.secondsDifference(clock.currentTime, start)).toBeCloseTo(20, 5);
  });

  it('CLAMPED: time stops at stopTime', () => {
    const start = JulianDate.create(2460000, 0);
    const stop = JulianDate.create(2460000, 100);
    const clock = new Clock({
      startTime: JulianDate.clone(start),
      currentTime: JulianDate.clone(start),
      stopTime: JulianDate.clone(stop),
      multiplier: 1,
      clockRange: ClockRange.CLAMPED,
    });

    // Advance well past the stop time
    clock.tick(200);

    expect(clock.currentTime.dayNumber).toBe(stop.dayNumber);
    expect(clock.currentTime.secondsOfDay).toBe(stop.secondsOfDay);
  });

  it('CLAMPED: time stops at startTime (negative multiplier)', () => {
    const start = JulianDate.create(2460000, 0);
    const stop = JulianDate.create(2460000, 100);
    const current = JulianDate.create(2460000, 50);
    const clock = new Clock({
      startTime: JulianDate.clone(start),
      currentTime: JulianDate.clone(current),
      stopTime: JulianDate.clone(stop),
      multiplier: -1,
      clockRange: ClockRange.CLAMPED,
    });

    // Reverse well past the start time
    clock.tick(200);

    expect(clock.currentTime.dayNumber).toBe(start.dayNumber);
    expect(clock.currentTime.secondsOfDay).toBe(start.secondsOfDay);
  });

  it('LOOP: time wraps to startTime after passing stopTime', () => {
    const start = JulianDate.create(2460000, 0);
    const stop = JulianDate.create(2460000, 100);
    const clock = new Clock({
      startTime: JulianDate.clone(start),
      currentTime: JulianDate.clone(start),
      stopTime: JulianDate.clone(stop),
      multiplier: 1,
      clockRange: ClockRange.LOOP,
    });

    // Advance past stop time
    clock.tick(150);

    expect(clock.currentTime.dayNumber).toBe(start.dayNumber);
    expect(clock.currentTime.secondsOfDay).toBe(start.secondsOfDay);
  });

  it('shouldAnimate=false: tick does not advance time', () => {
    const start = JulianDate.create(2460000, 0);
    const clock = new Clock({
      startTime: JulianDate.clone(start),
      currentTime: JulianDate.clone(start),
      shouldAnimate: false,
    });

    clock.tick(1000);

    expect(JulianDate.secondsDifference(clock.currentTime, start)).toBe(0);
  });

  it('default constructor creates reasonable defaults', () => {
    const clock = new Clock();

    expect(clock.currentTime.dayNumber).toBeGreaterThan(2460000);
    expect(clock.multiplier).toBe(1.0);
    expect(clock.clockRange).toBe(ClockRange.UNBOUNDED);
    expect(clock.clockStep).toBe(ClockStep.SYSTEM_CLOCK_MULTIPLIER);
    expect(clock.shouldAnimate).toBe(true);

    // stopTime should be 24 hours after startTime
    const diff = JulianDate.secondsDifference(clock.stopTime, clock.startTime);
    expect(diff).toBeCloseTo(86400, 0);
  });
});
