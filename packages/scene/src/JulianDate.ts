export interface JulianDateType {
  dayNumber: number;
  secondsOfDay: number;
}

// Julian date epoch: January 1, 4713 BC (Julian calendar)
// J2000.0 epoch: January 1, 2000, 12:00 TT = JD 2451545.0

const JULIAN_EPOCH_DIFF = 2440587.5; // Unix epoch (Jan 1 1970) in Julian day numbers

export const JulianDate = {
  create(dayNumber: number, secondsOfDay: number): JulianDateType {
    // Normalize so secondsOfDay is in [0, 86400)
    const extraDays = Math.floor(secondsOfDay / 86400);
    return {
      dayNumber: dayNumber + extraDays,
      secondsOfDay: secondsOfDay - extraDays * 86400,
    };
  },

  now(): JulianDateType {
    return JulianDate.fromDate(new Date());
  },

  fromDate(date: Date): JulianDateType {
    const unixMs = date.getTime();
    const unixDays = unixMs / 86400000;
    const julianDay = unixDays + JULIAN_EPOCH_DIFF;
    const dayNumber = Math.floor(julianDay);
    const secondsOfDay = (julianDay - dayNumber) * 86400;
    return { dayNumber, secondsOfDay };
  },

  toDate(jd: JulianDateType): Date {
    const julianDay = jd.dayNumber + jd.secondsOfDay / 86400;
    const unixMs = (julianDay - JULIAN_EPOCH_DIFF) * 86400000;
    return new Date(unixMs);
  },

  addSeconds(jd: JulianDateType, seconds: number, result: JulianDateType): JulianDateType {
    const totalSeconds = jd.secondsOfDay + seconds;
    const extraDays = Math.floor(totalSeconds / 86400);
    result.dayNumber = jd.dayNumber + extraDays;
    result.secondsOfDay = totalSeconds - extraDays * 86400;
    return result;
  },

  secondsDifference(left: JulianDateType, right: JulianDateType): number {
    const dayDiff = left.dayNumber - right.dayNumber;
    return dayDiff * 86400 + (left.secondsOfDay - right.secondsOfDay);
  },

  clone(jd: JulianDateType): JulianDateType {
    return { dayNumber: jd.dayNumber, secondsOfDay: jd.secondsOfDay };
  },

  equals(left: JulianDateType, right: JulianDateType): boolean {
    return left.dayNumber === right.dayNumber && left.secondsOfDay === right.secondsOfDay;
  },

  fromIso8601(iso: string): JulianDateType {
    return JulianDate.fromDate(new Date(iso));
  },

  fromSeconds(totalSeconds: number): JulianDateType {
    // Treat as seconds since J2000 epoch (JD 2451545.0)
    const j2000DayNumber = 2451545;
    return JulianDate.create(j2000DayNumber, totalSeconds);
  },
} as const;
