import { JulianDate, type JulianDateType } from './JulianDate';

export enum ClockRange {
  UNBOUNDED = 0,
  CLAMPED = 1,
  LOOP = 2,
}

export enum ClockStep {
  TICK_DEPENDENT = 0,
  SYSTEM_CLOCK_MULTIPLIER = 1,
}

export interface ClockOptions {
  startTime?: JulianDateType;
  stopTime?: JulianDateType;
  currentTime?: JulianDateType;
  multiplier?: number;
  clockRange?: ClockRange;
  clockStep?: ClockStep;
  shouldAnimate?: boolean;
}

export class Clock {
  startTime: JulianDateType;
  stopTime: JulianDateType;
  currentTime: JulianDateType;
  multiplier: number;
  clockRange: ClockRange;
  clockStep: ClockStep;
  shouldAnimate: boolean;

  constructor(options?: ClockOptions) {
    const now = JulianDate.now();
    this.startTime = options?.startTime ?? JulianDate.clone(now);
    this.currentTime = options?.currentTime ?? JulianDate.clone(now);
    // Default stop = start + 24 hours
    this.stopTime = options?.stopTime ?? JulianDate.addSeconds(this.startTime, 86400, { dayNumber: 0, secondsOfDay: 0 });
    this.multiplier = options?.multiplier ?? 1.0;
    this.clockRange = options?.clockRange ?? ClockRange.UNBOUNDED;
    this.clockStep = options?.clockStep ?? ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    this.shouldAnimate = options?.shouldAnimate ?? true;
  }

  tick(deltaSeconds?: number): JulianDateType {
    if (!this.shouldAnimate) return this.currentTime;

    const dt = (deltaSeconds ?? 0) * this.multiplier;
    JulianDate.addSeconds(this.currentTime, dt, this.currentTime);

    if (this.clockRange === ClockRange.CLAMPED) {
      if (JulianDate.secondsDifference(this.currentTime, this.stopTime) > 0) {
        this.currentTime.dayNumber = this.stopTime.dayNumber;
        this.currentTime.secondsOfDay = this.stopTime.secondsOfDay;
      }
      if (JulianDate.secondsDifference(this.currentTime, this.startTime) < 0) {
        this.currentTime.dayNumber = this.startTime.dayNumber;
        this.currentTime.secondsOfDay = this.startTime.secondsOfDay;
      }
    } else if (this.clockRange === ClockRange.LOOP) {
      if (JulianDate.secondsDifference(this.currentTime, this.stopTime) > 0) {
        this.currentTime.dayNumber = this.startTime.dayNumber;
        this.currentTime.secondsOfDay = this.startTime.secondsOfDay;
      }
    }

    return this.currentTime;
  }
}
