/**
 * Pure date helpers for the quote request "Fecha deseada" selector.
 * Labels are built manually (no Intl) so they are deterministic in tests.
 */

export interface DayOption {
  /** yyyy-mm-dd in local time, stable key. */
  key: string;
  /** "Hoy", "Mañana" or short form like "Sáb 25". */
  label: string;
  /** Local midnight of the day. */
  date: Date;
}

export interface TimeSlot {
  key: 'morning' | 'afternoon' | 'evening';
  label: string;
  hour: number;
}

export const TIME_SLOTS: readonly TimeSlot[] = [
  { key: 'morning', label: 'Mañana (9 h)', hour: 9 },
  { key: 'afternoon', label: 'Tarde (14 h)', hour: 14 },
  { key: 'evening', label: 'Noche (19 h)', hour: 19 },
];

export const DEFAULT_SLOT_HOUR = TIME_SLOTS[0].hour;

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** `count` consecutive local days starting today: Hoy, Mañana, then "Sáb 25"... */
export function buildDayOptions(now: Date, count = 14): DayOption[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const label =
      i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${WEEKDAYS[date.getDay()]} ${date.getDate()}`;
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return { key, label, date };
  });
}

/** ISO 8601 string for the given local day at `slotHour` local time. */
export function toScheduledIso(day: Date, slotHour: number): string {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), slotHour, 0, 0, 0).toISOString();
}

/** Slots still ahead of `now` for the given day (only today drops past hours). */
export function availableSlots(day: Date, now: Date, leadMinutes = MIN_LEAD_MINUTES): readonly TimeSlot[] {
  const earliest = now.getTime() + leadMinutes * 60_000;
  return TIME_SLOTS.filter((s) => slotStart(day, s.hour).getTime() >= earliest);
}

/** Minimum notice before a slot starts; closer slots are not offered nor sent. */
export const MIN_LEAD_MINUTES = 30;

function slotStart(day: Date, hour: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

/** True while the chosen day + slot is still at least `leadMinutes` ahead of `now`. */
export function isSlotStillAvailable(day: Date, hour: number, now: Date, leadMinutes = MIN_LEAD_MINUTES): boolean {
  return slotStart(day, hour).getTime() >= now.getTime() + leadMinutes * 60_000;
}
