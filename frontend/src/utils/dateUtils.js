// ============================================================
// Small, dependable date helpers built on the native Date object.
// Every function here builds dates with new Date(year, month, day)
// instead of parsing ambiguous strings like new Date("09/03/2026"),
// which avoids the off-by-one / timezone bugs that plague ad-hoc
// calendar code.
// ============================================================

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Formats a Date as 'YYYY-MM-DD' using local fields (no UTC shift). */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date, delta) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

/** Sunday-start of the week containing `date`. */
export function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

export function monthLabel(date) {
  return `${MONTH_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function weekdayShort(date) {
  return WEEKDAY_SHORT[date.getDay()];
}

/**
 * Builds a full 6-row (42-cell) month grid, including the trailing
 * days of the previous month and leading days of the next month so
 * every week row is complete and weekday columns always line up.
 */
export function getMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const gridStart = addDays(first, -first.getDay());
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = addDays(gridStart, i);
    cells.push({ date, inMonth: date.getMonth() === monthDate.getMonth() });
  }
  return cells;
}

/** The 7 dates (Sun–Sat) of the week containing `date`. */
export function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const WEEKDAY_HEADERS = WEEKDAY_SHORT;

/** Converts a "09:30 AM" / "02:30 PM" style label into minutes since midnight, for reliable chronological sorting. */
export function timeToMinutes(label) {
  const match = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec(label.trim());
  if (!match) return 0;
  let [, hh, mm, period] = match;
  let hours = parseInt(hh, 10) % 12;
  if (period.toUpperCase() === 'PM') hours += 12;
  return hours * 60 + parseInt(mm, 10);
}

export function sortByTime(list, timeKey = 'time') {
  return [...list].sort((a, b) => timeToMinutes(a[timeKey]) - timeToMinutes(b[timeKey]));
}

/** Returns a new Date object offset by `offsetDays` from today (local midnight-normalized or current time). */
export function getRelativeDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

/** Returns 'YYYY-MM-DD' offset by `offsetDays` from today. */
export function getRelativeISO(offsetDays = 0) {
  return toISODate(getRelativeDate(offsetDays));
}

/** Formats a relative date like '05 Sep 2026' or localized. */
export function getRelativeFormatted(offsetDays = 0, locale = 'en-GB') {
  return getRelativeDate(offsetDays).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Formats complete date with weekday, day, month and year. */
export function formatFullDate(date = new Date(), locale = 'en-IN') {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Formats live time with optional seconds. */
export function formatLiveTime(date = new Date(), locale = 'en-IN', withSeconds = true) {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/**
 * Calculates scheduled trigger timestamp and formatted string given dose time string
 * (e.g. "08:00 PM" or "8:00 AM") and lead minutes before dose (e.g. 60 min, 120 min, 0 min, or -1 for 10s demo).
 */
export function calculateTriggerTime(doseTimeStr, leadMinutes = 0) {
  if (leadMinutes === -1) {
    return {
      triggerTimestamp: Date.now() + 10000,
      triggerTimeFormatted: 'In 10 seconds (Demo)',
      scheduledDoseTime: doseTimeStr || 'Now',
    };
  }

  const now = new Date();
  let doseHours = 8;
  let doseMinutes = 0;

  const match = (doseTimeStr || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    doseHours = parseInt(match[1], 10);
    doseMinutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && doseHours < 12) doseHours += 12;
    if (ampm === 'AM' && doseHours === 12) doseHours = 0;
  }

  const targetDate = new Date(now);
  targetDate.setHours(doseHours, doseMinutes, 0, 0);

  // Subtract lead minutes
  const triggerDate = new Date(targetDate.getTime() - leadMinutes * 60 * 1000);

  // If time has passed today by more than 2 minutes, assume next day
  if (triggerDate.getTime() < now.getTime() - 2 * 60 * 1000) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const triggerTimeFormatted = triggerDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    triggerTimestamp: triggerDate.getTime(),
    triggerTimeFormatted,
    scheduledDoseTime: doseTimeStr,
  };
}


