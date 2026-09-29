// Date/time helpers. The prototype runs on today's real date with a presenter-controlled time of day
// (AppState.demoTime) so due/overdue states are predictable in every demo.

const pad = (n: number) => String(n).padStart(2, '0');

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function today(): string {
  return isoDate(new Date());
}
export function addDays(date: string, n: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
export function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function weekday(date: string): number {
  return parseDate(date).getDay();
}
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
export function fromMinutes(min: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}
export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${ap}`;
}
export function fmtDate(date: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string {
  return parseDate(date).toLocaleDateString('en-US', opts);
}
export function fmtDay(date: string): string {
  const t = today();
  if (date === t) return 'Today';
  if (date === addDays(t, -1)) return 'Yesterday';
  return parseDate(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
export function fmtStamp(iso: string): string {
  const d = new Date(iso);
  const date = isoDate(d);
  return `${fmtDay(date)}, ${fmtTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`)}`;
}
/** ISO timestamp for a care date + time of day. */
export function stamp(date: string, hhmm: string): string {
  const d = parseDate(date);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
export function ageLabel(dob: string, on: string = today()): string {
  const b = parseDate(dob);
  const t = parseDate(on);
  let years = t.getFullYear() - b.getFullYear();
  let months = t.getMonth() - b.getMonth();
  if (t.getDate() < b.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years < 2) return `${years * 12 + months} mo`;
  return `${years} yrs`;
}
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS = [1, 2, 3, 4, 5];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export function daysLabel(days: number[]): string {
  const s = [...days].sort().join(',');
  if (s === '1,2,3,4,5') return 'Weekdays';
  if (s === '0,1,2,3,4,5,6') return 'Every day';
  return [...days].sort().map((d) => DAY_LABELS[d]).join(', ');
}
export function cmToFtIn(cm: number | null): string {
  if (!cm) return '—';
  const inches = cm / 2.54;
  return `${cm} cm (${Math.floor(inches / 12)}′ ${Math.round(inches % 12)}″)`;
}
export function kgToLb(kg: number | null): string {
  if (!kg) return '—';
  return `${kg} kg (${Math.round(kg * 2.2046)} lb)`;
}
export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
}
export function shortName(name: string): string {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
}
