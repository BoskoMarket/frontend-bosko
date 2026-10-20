import {
  availableSlots,
  buildDayOptions,
  toScheduledIso,
  TIME_SLOTS,
  DEFAULT_SLOT_HOUR,
} from '@/features/orders/utils/scheduledDate';

describe('availableSlots', () => {
  it('drops past slots only for today', () => {
    const now = new Date(2026, 9, 20, 15, 30);
    const today = new Date(2026, 9, 20);
    const tomorrow = new Date(2026, 9, 21);
    expect(availableSlots(today, now).map((s) => s.hour)).toEqual([19]);
    expect(availableSlots(tomorrow, now).map((s) => s.hour)).toEqual([9, 14, 19]);
    expect(availableSlots(today, new Date(2026, 9, 20, 20))).toEqual([]);
  });
});

describe('scheduledDate', () => {
  // Sunday 2026-10-25 15:30 local
  const now = new Date(2026, 9, 25, 15, 30);

  it('builds 14 day options starting with Hoy and Mañana', () => {
    const days = buildDayOptions(now, 14);
    expect(days).toHaveLength(14);
    expect(days[0].label).toBe('Hoy');
    expect(days[1].label).toBe('Mañana');
    expect(days[2].label).toBe('Mar 27');
    expect(days[0].key).toBe('2026-10-25');
    expect(days[13].key).toBe('2026-11-07');
  });

  it('keeps day keys unique across month boundaries', () => {
    const keys = buildDayOptions(now, 14).map((d) => d.key);
    expect(new Set(keys).size).toBe(14);
  });

  it('produces an ISO string that parses back to the local day and hour', () => {
    const day = buildDayOptions(now, 14)[3].date; // 2026-10-28
    const iso = toScheduledIso(day, 14);
    const parsed = new Date(iso);
    expect(iso).toBe(parsed.toISOString());
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9);
    expect(parsed.getDate()).toBe(28);
    expect(parsed.getHours()).toBe(14);
    expect(parsed.getMinutes()).toBe(0);
  });

  it('exposes the three slots with hours 9/14/19 and a 9 h default', () => {
    expect(TIME_SLOTS.map((s) => s.hour)).toEqual([9, 14, 19]);
    expect(DEFAULT_SLOT_HOUR).toBe(9);
  });
});
