// Daily confession streak, kept in this browser only (no backend yet).
//
// Stored as { start: 'YYYY-MM-DD', last: 'YYYY-MM-DD' }: the streak's first
// day and the most recent day a confession was completed. Days are the
// visitor's local calendar days.

const KEY = 'confession.streak.v1';
const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a, b) => Math.round((fromKey(toKey(b)) - fromKey(toKey(a))) / 86400000);

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && /^\d{4}-\d\d-\d\d$/.test(v.start) && /^\d{4}-\d\d-\d\d$/.test(v.last)) return v;
  } catch {
    /* storage blocked or corrupt */
  }
  return null;
}

function write(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode etc. — the screen still works for this visit */
  }
}

/**
 * Record today's confession and describe the streak for the completion screen.
 * Same day again: nothing changes. Yesterday was the last day: streak grows.
 * Any gap (or first time): a new streak starts today.
 */
export function recordCompletion(now = new Date()) {
  const today = toKey(now);
  const saved = read();
  let start = today;
  let repeat = false;

  if (saved) {
    const gap = daysBetween(fromKey(saved.last), now);
    if (gap === 0) {
      start = saved.start;
      repeat = true;
    } else if (gap === 1) {
      start = saved.start;
    }
  }
  write({ start, last: today });

  const startDate = fromKey(start);
  const day = daysBetween(startDate, now) + 1;

  // Seven-day row beginning on the streak's first day; after a full week it
  // rolls on to the next block of seven.
  const blockStart = addDays(startDate, Math.floor((day - 1) / 7) * 7);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(blockStart, i);
    const offset = daysBetween(date, now); // >0 past, 0 today, <0 future
    return {
      key: toKey(date),
      letter: LETTERS[date.getDay()],
      label: date.toLocaleDateString(undefined, { weekday: 'long' }),
      done: offset >= 0,
      today: offset === 0,
    };
  });

  return { day, repeat, week };
}
