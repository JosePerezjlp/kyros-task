// Due dates are calendar days stored as UTC midnight, so all day arithmetic is done in UTC.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses a 'YYYY-MM-DD' string into a Date at UTC midnight. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function startOfTodayUTC(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}
