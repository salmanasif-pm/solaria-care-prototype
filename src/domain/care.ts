// Pure rules shared by every screen. No screen stores its own counts; everything derives from state.
import type { AppState, CareScheduleItem, Client, DocKind, FlowEntry, FlowSheet, MedicationOrder, Staff } from './types';
import { toMinutes, weekday } from './time';

export const DUE_WINDOW_MIN = 30; // an item is "due" from 30 min before until 30 min after its time
export const OVERDUE_AFTER_MIN = 30;

export type CareItemStatus = 'completed' | 'not-done' | 'overdue' | 'due' | 'upcoming';

export interface TodayItem {
  ref: string; // itemId@HH:MM
  source: 'schedule' | 'medication';
  itemId: string;
  clientId: string;
  time: string;
  name: string;
  instructions: string;
  docKind: DocKind;
  status: CareItemStatus;
  entry?: FlowEntry;
  notDoneReason?: string;
  med?: MedicationOrder;
  schedule?: CareScheduleItem;
}

export const clientName = (c: Pick<Client, 'firstName' | 'lastName'>) => `${c.firstName} ${c.lastName}`;

export function sheetFor(state: AppState, clientId: string, date: string): FlowSheet | undefined {
  return state.sheets.find((s) => s.clientId === clientId && s.date === date);
}

/** Entries for a sheet in care-time order, newest first by default. */
export function entriesFor(state: AppState, clientId: string, date: string, order: 'asc' | 'desc' = 'desc'): FlowEntry[] {
  const list = state.entries.filter((e) => e.clientId === clientId && e.date === date);
  list.sort((a, b) => toMinutes(a.careTime) - toMinutes(b.careTime) || a.enteredAt.localeCompare(b.enteredAt));
  return order === 'desc' ? list.reverse() : list;
}

/** An entry superseded by an attributed correction stays visible but is marked corrected. */
export function correctedIds(entries: FlowEntry[]): Set<string> {
  return new Set(entries.filter((e) => e.correctionOf).map((e) => e.correctionOf!));
}

export interface ItemFilters { includeSchedule: boolean; includeMeds: boolean }

/** Today's care for one client: scheduled activities + medication doses for the care date's weekday. */
export function todaysCare(state: AppState, clientId: string, date: string, nowHHMM: string, f: ItemFilters): TodayItem[] {
  const wd = weekday(date);
  const entries = state.entries.filter((e) => e.clientId === clientId && e.date === date && e.scheduleRef);
  const sheet = sheetFor(state, clientId, date);
  const notDone = sheet ? state.notDone.filter((n) => n.sheetId === sheet.id) : [];
  const now = toMinutes(nowHHMM);
  const items: TodayItem[] = [];

  const statusFor = (ref: string, time: string): Pick<TodayItem, 'status' | 'entry' | 'notDoneReason'> => {
    const entry = entries.filter((e) => e.scheduleRef === ref).sort((a, b) => b.enteredAt.localeCompare(a.enteredAt))[0];
    if (entry) return { status: 'completed', entry };
    const nd = notDone.find((n) => n.scheduleRef === ref);
    if (nd) return { status: 'not-done', notDoneReason: nd.reason };
    const t = toMinutes(time);
    if (now > t + OVERDUE_AFTER_MIN) return { status: 'overdue' };
    if (now >= t - DUE_WINDOW_MIN) return { status: 'due' };
    return { status: 'upcoming' };
  };

  if (f.includeSchedule) {
    for (const s of state.schedule) {
      if (s.clientId !== clientId || !s.active || !s.days.includes(wd)) continue;
      const ref = `${s.id}@${s.time}`;
      items.push({ ref, source: 'schedule', itemId: s.id, clientId, time: s.time, name: s.name, instructions: s.instructions, docKind: s.docKind, schedule: s, ...statusFor(ref, s.time) });
    }
  }
  if (f.includeMeds) {
    for (const m of state.medications) {
      if (m.clientId !== clientId || !m.active || !m.days.includes(wd)) continue;
      for (const time of m.times) {
        const ref = `${m.id}@${time}`;
        items.push({ ref, source: 'medication', itemId: m.id, clientId, time, name: `${m.name} ${m.dose}`, instructions: `${m.route}${m.instructions ? ' · ' + m.instructions : ''}`, docKind: 'medication', med: m, ...statusFor(ref, time) });
      }
    }
  }
  items.sort((a, b) => toMinutes(a.time) - toMinutes(b.time) || a.name.localeCompare(b.name));
  return items;
}

export function careCounts(items: TodayItem[]) {
  return {
    due: items.filter((i) => i.status === 'due').length,
    overdue: items.filter((i) => i.status === 'overdue').length,
    completed: items.filter((i) => i.status === 'completed').length,
    notDone: items.filter((i) => i.status === 'not-done').length,
    upcoming: items.filter((i) => i.status === 'upcoming').length,
    total: items.length,
  };
}

/** Clients a care staff member may see: their location and care areas (roadmap 7.1 access scope). */
export function permittedClients(state: AppState, user: Staff | undefined): Client[] {
  if (!user) return [];
  return state.clients.filter((c) => c.status === 'active' && (user.role === 'admin' || (c.location === user.location && user.careAreas.includes(c.careArea))));
}

export function lastDocumented(state: AppState, clientId: string, date: string): FlowEntry | undefined {
  return entriesFor(state, clientId, date, 'desc')[0];
}

export function contributors(state: AppState, clientId: string, date: string): Staff[] {
  const ids = new Set(state.entries.filter((e) => e.clientId === clientId && e.date === date).map((e) => e.staffId));
  return state.staff.filter((s) => ids.has(s.id));
}

// ---------- Intake & output ----------
const num = (v: unknown) => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export interface IoTotals { intakeMl: number; intakeByRoute: Record<string, number>; urine: number; stool: number; emesis: number; fromActivities: number }

/**
 * Totals for the day. Output captured through toileting or brief-change entries is counted here
 * without being re-entered (roadmap 4.3 / 4.5 no-duplicate rule).
 */
export function ioTotals(entries: FlowEntry[]): IoTotals {
  const corrected = correctedIds(entries);
  const t: IoTotals = { intakeMl: 0, intakeByRoute: {}, urine: 0, stool: 0, emesis: 0, fromActivities: 0 };
  for (const e of entries) {
    if (corrected.has(e.id)) continue;
    if (e.kind === 'intakeOutput' && e.data.direction === 'intake') {
      const ml = num(e.data.amount);
      t.intakeMl += ml;
      const r = String(e.data.route ?? 'Other');
      t.intakeByRoute[r] = (t.intakeByRoute[r] ?? 0) + ml;
    }
    const out = e.kind === 'intakeOutput' && e.data.direction === 'output' ? (e.data as { urine?: string; stool?: string; emesis?: string }) : e.output;
    if (out) {
      if (out.urine) t.urine += 1;
      if (out.stool) t.stool += 1;
      if (out.emesis) t.emesis += 1;
      if (e.kind === 'activity' && (out.urine || out.stool || out.emesis)) t.fromActivities += 1;
    }
  }
  return t;
}

/** Sheet completion rule (conservative, pending nursing confirmation): at least one signature, any configured
 *  required sign-offs, and the parent-copy question answered. */
export function completionGaps(sheet: FlowSheet, required: string[]): string[] {
  const gaps: string[] = [];
  if (sheet.signoffs.length === 0) gaps.push('At least one signature');
  for (const r of required) if (!sheet.signoffs.some((s) => s.role === r)) gaps.push(`${r} sign-off`);
  if (sheet.parentCopyOffered === null) gaps.push('Parent copy offered: yes / no');
  if (sheet.parentCopyOffered && sheet.parentCopyAccepted === null) gaps.push('Parent copy accepted: yes / no');
  return gaps;
}

export const KIND_LABEL: Record<DocKind, string> = {
  observations: 'Observations',
  intakeOutput: 'Intake & Output',
  assessment: 'Assessment',
  activity: 'Care Activity',
  medication: 'Medication',
  specializedCare: 'Specialized Care',
  note: 'Note',
};
