// Shared application state + every workflow action. Persisted to localStorage so a demo survives refresh;
// two tabs in the same browser stay in sync. "Reset demo" restores the seeded scenario.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, AuditEvent, AuthorizationPeriod, CareScheduleItem, Client, DeviceRecord, FlowEntry, FlowSheet, MedicationOrder, SignoffRole, Staff, Surface } from '../domain/types';
import { buildSeed, STATE_VERSION } from '../data/seed';
import { stamp, today } from '../domain/time';
import { clientName } from '../domain/care';

const KEY = 'solaria-prototype-state';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    /* storage unavailable or corrupt: start from the seed */
  }
  return buildSeed();
}
const clone = <T,>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
let seq = Date.now() % 100000;
export const uid = (p: string) => `${p}_${(++seq).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export type EntryInput = Omit<FlowEntry, 'id' | 'sheetId' | 'clientId' | 'date' | 'enteredAt' | 'staffId'>;

function useStoreValue() {
  const [state, setState] = useState<AppState>(load);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* in-memory only */ }
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try { const next = JSON.parse(e.newValue) as AppState; if (next.version === STATE_VERSION) setState(next); } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback(<R,>(fn: (d: AppState) => R): R => {
    const draft = clone(ref.current);
    const result = fn(draft);
    ref.current = draft;
    setState(draft);
    return result;
  }, []);

  const actions = useMemo(() => {
    const now = (d: AppState) => stamp(today(), d.demoTime);
    const audit = (d: AppState, category: AuditEvent['category'], action: string, clientId?: string, userId?: string) => {
      d.audit.unshift({ id: uid('au'), at: now(d), userId: userId ?? d.session.userId ?? 'system', category, action, clientId });
    };
    const cname = (d: AppState, id: string) => { const c = d.clients.find((x) => x.id === id); return c ? clientName(c) : 'client'; };
    const ensureSheet = (d: AppState, clientId: string, date: string): FlowSheet => {
      let s = d.sheets.find((x) => x.clientId === clientId && x.date === date);
      if (!s) {
        s = { id: `fs_${clientId}_${date}`, clientId, date, status: 'open', signoffs: [], parentCopyOffered: null, parentCopyAccepted: null, reviewNote: '' };
        d.sheets.push(s);
      }
      return s;
    };

    return {
      // ---------- session ----------
      signIn: (userId: string, surface: Surface, via: 'credentials' | 'pin' | 'demo', how?: string) => update((d) => {
        d.session = { userId, surface, via };
        const u = d.staff.find((s) => s.id === userId);
        if (u) u.lastSignIn = now(d);
        if (via !== 'demo') audit(d, 'Authentication', how ?? (via === 'pin' ? 'Switched in by PIN on shared iPad' : `Signed in to ${surface === 'admin' ? 'Web Admin' : 'Care Staff iPad'}`), undefined, userId);
      }),
      signOut: (reason = 'Signed out; session terminated') => update((d) => {
        if (d.session.userId) audit(d, 'Authentication', reason);
        d.session = { userId: null, surface: null, via: null };
      }),
      logFailedSignIn: (identifier: string) => update((d) => { audit(d, 'Authentication', `Failed sign-in attempt for "${identifier}"`, undefined, 'system'); }),
      acceptTerms: (userId: string) => update((d) => {
        const u = d.staff.find((s) => s.id === userId);
        if (u) { u.termsAcceptedVersion = d.termsVersion; audit(d, 'Authentication', `Accepted terms of use v${d.termsVersion}`, undefined, userId); }
      }),
      activateAccount: (code: string, pin: string): { ok: true; user: Staff } | { ok: false; error: string } => update((d) => {
        const u = d.staff.find((s) => s.status === 'invited' && s.inviteCode?.toUpperCase() === code.trim().toUpperCase());
        if (!u) return { ok: false as const, error: 'This invitation code is not valid or has already been used.' };
        u.status = 'active';
        u.pin = pin;
        delete u.inviteCode;
        audit(d, 'Staff & access', `Account activated from invitation: ${u.name}`, undefined, u.id);
        return { ok: true as const, user: clone(u) };
      }),
      requestPasswordReset: (identifier: string) => update((d) => { audit(d, 'Authentication', `Password reset requested for "${identifier}"`, undefined, 'system'); }),

      // ---------- demo ----------
      setDemoTime: (hhmm: string) => update((d) => { d.demoTime = hhmm; }),
      reset: () => update((d) => { const fresh = buildSeed(); Object.assign(d, fresh); }),

      // ---------- clients (6.1) ----------
      saveClient: (c: Client, isNew: boolean) => update((d) => {
        c.updatedAt = now(d);
        if (isNew) { c.createdAt = now(d); d.clients.push(c); audit(d, 'Client', `Created client record: ${clientName(c)}`, c.id); }
        else {
          const i = d.clients.findIndex((x) => x.id === c.id);
          const before = d.clients[i];
          const changed = (['firstName', 'lastName', 'dob', 'heightCm', 'weightKg', 'location', 'careArea', 'status', 'notes'] as const).filter((k) => before[k] !== c[k]);
          d.clients[i] = c;
          audit(d, 'Client', `Updated client record: ${clientName(c)}${changed.length ? ' · ' + changed.join(', ') : ''}`, c.id);
        }
        return c.id;
      }),

      // ---------- care schedule (6.2) ----------
      saveScheduleItem: (item: CareScheduleItem, isNew: boolean) => update((d) => {
        const by = d.session.userId ?? 'system';
        if (isNew) { item.history = [{ at: now(d), by, text: 'Created' }]; d.schedule.push(item); audit(d, 'Care schedule', `Added scheduled care: ${cname(d, item.clientId)} · ${item.name} at ${item.time}`, item.clientId); }
        else {
          const i = d.schedule.findIndex((x) => x.id === item.id);
          item.history = [...d.schedule[i].history, { at: now(d), by, text: 'Edited' }];
          d.schedule[i] = item;
          audit(d, 'Care schedule', `Updated scheduled care: ${cname(d, item.clientId)} · ${item.name}`, item.clientId);
        }
      }),
      setScheduleActive: (id: string, active: boolean) => update((d) => {
        const s = d.schedule.find((x) => x.id === id);
        if (!s) return;
        s.active = active;
        s.history.push({ at: now(d), by: d.session.userId ?? 'system', text: active ? 'Reactivated' : 'Deactivated' });
        audit(d, 'Care schedule', `${active ? 'Reactivated' : 'Deactivated'} scheduled care: ${cname(d, s.clientId)} · ${s.name}`, s.clientId);
      }),

      // ---------- medications (4.8) ----------
      saveMedication: (m: MedicationOrder, isNew: boolean) => update((d) => {
        const by = d.session.userId ?? 'system';
        if (isNew) { m.history = [{ at: now(d), by, text: 'Created' }]; d.medications.push(m); audit(d, 'Care schedule', `Added medication: ${cname(d, m.clientId)} · ${m.name} ${m.dose}`, m.clientId); }
        else {
          const i = d.medications.findIndex((x) => x.id === m.id);
          m.history = [...d.medications[i].history, { at: now(d), by, text: 'Edited' }];
          d.medications[i] = m;
          audit(d, 'Care schedule', `Updated medication: ${cname(d, m.clientId)} · ${m.name} ${m.dose}`, m.clientId);
        }
      }),
      setMedicationActive: (id: string, active: boolean) => update((d) => {
        const m = d.medications.find((x) => x.id === id);
        if (!m) return;
        m.active = active;
        m.history.push({ at: now(d), by: d.session.userId ?? 'system', text: active ? 'Reactivated' : 'Discontinued' });
        audit(d, 'Care schedule', `${active ? 'Reactivated' : 'Discontinued'} medication: ${cname(d, m.clientId)} · ${m.name}`, m.clientId);
      }),

      // ---------- devices (4.7) ----------
      saveDevice: (dev: DeviceRecord, isNew: boolean) => update((d) => {
        const by = d.session.userId ?? 'system';
        if (isNew) { dev.history = [{ at: now(d), by, text: 'Device record created' }]; d.devices.push(dev); }
        else {
          const i = d.devices.findIndex((x) => x.id === dev.id);
          const b = d.devices[i];
          const diff = [b.size !== dev.size && `size ${b.size} → ${dev.size}`, b.description !== dev.description && 'description', b.lastChanged !== dev.lastChanged && `changed ${dev.lastChanged}`, b.details !== dev.details && 'details', b.active !== dev.active && (dev.active ? 'reactivated' : 'removed')].filter(Boolean).join(', ');
          dev.history = [...b.history, { at: now(d), by, text: diff ? `Updated: ${diff}` : 'Reviewed, no change' }];
          d.devices[i] = dev;
        }
        audit(d, 'Client', `${isNew ? 'Added' : 'Updated'} device record: ${cname(d, dev.clientId)} · ${dev.type} ${dev.size}`, dev.clientId);
      }),

      // ---------- authorization periods (5.3) ----------
      saveAuthorization: (p: AuthorizationPeriod, isNew: boolean) => update((d) => {
        if (isNew) d.authorizations.push(p); else d.authorizations[d.authorizations.findIndex((x) => x.id === p.id)] = p;
        audit(d, 'Client', `${isNew ? 'Added' : 'Updated'} authorization period: ${cname(d, p.clientId)} · ${p.start} to ${p.end}`, p.clientId);
      }),

      // ---------- staff (6.3) ----------
      saveStaff: (s: Staff, isNew: boolean) => update((d) => {
        if (isNew) {
          s.status = 'invited';
          s.inviteCode = `SOL-${Math.floor(1000 + Math.random() * 9000)}`;
          d.staff.push(s);
          audit(d, 'Staff & access', `Invitation sent: ${s.name} (${s.role === 'admin' ? 'Administrative User' : 'Care Staff'}, ${s.title})`);
          return s.inviteCode;
        }
        const i = d.staff.findIndex((x) => x.id === s.id);
        d.staff[i] = s;
        audit(d, 'Staff & access', `Updated staff access: ${s.name} · ${s.role === 'admin' ? 'Administrative User' : 'Care Staff'} · ${s.location} · ${s.careAreas.join(', ')}`);
        return undefined;
      }),
      setStaffStatus: (id: string, status: Staff['status']) => update((d) => {
        const s = d.staff.find((x) => x.id === id);
        if (!s) return;
        s.status = status;
        if (status === 'inactive' && d.session.userId === id) d.session = { userId: null, surface: null, via: null };
        audit(d, 'Staff & access', `Staff account ${status === 'inactive' ? 'deactivated (sessions revoked)' : 'reactivated'}: ${s.name}`);
      }),
      resendInvite: (id: string) => update((d) => { const s = d.staff.find((x) => x.id === id); if (s) audit(d, 'Staff & access', `Invitation re-sent: ${s.name}`); }),
      resetCredentials: (id: string) => update((d) => { const s = d.staff.find((x) => x.id === id); if (s) audit(d, 'Staff & access', `Credential reset triggered: ${s.name} (sessions revoked)`); }),

      // ---------- documentation (4.x) ----------
      openSheet: (clientId: string, date: string) => update((d) => ensureSheet(d, clientId, date).id),
      addEntry: (clientId: string, input: EntryInput): FlowEntry => update((d) => {
        const date = today();
        const sheet = ensureSheet(d, clientId, date);
        const entry: FlowEntry = { ...input, id: uid('e'), sheetId: sheet.id, clientId, date, enteredAt: now(d), staffId: d.session.userId ?? 'system', addendum: sheet.status === 'completed' || undefined };
        d.entries.push(entry);
        // A "not done" mark is superseded when the item is later documented.
        if (entry.scheduleRef) d.notDone = d.notDone.filter((n) => !(n.sheetId === sheet.id && n.scheduleRef === entry.scheduleRef));
        audit(d, 'Documentation', `${entry.addendum ? 'Added addendum' : 'Documented'} ${entry.title.toLowerCase()}: ${cname(d, clientId)} · ${entry.summary}`, clientId);
        return clone(entry);
      }),
      correctEntry: (entryId: string, reason: string) => update((d) => {
        const orig = d.entries.find((e) => e.id === entryId);
        if (!orig) return;
        const sheet = d.sheets.find((s) => s.id === orig.sheetId)!;
        d.entries.push({ id: uid('e'), sheetId: orig.sheetId, clientId: orig.clientId, date: orig.date, kind: 'note', careTime: orig.careTime, enteredAt: now(d), staffId: d.session.userId ?? 'system', title: 'Correction', summary: `Corrects ${orig.title.toLowerCase()} entry: ${reason}`, details: [['Original entry', `${orig.title} · ${orig.summary}`], ['Reason', reason]], data: {}, correctionOf: orig.id, addendum: sheet.status === 'completed' || undefined });
        audit(d, 'Documentation', `Recorded correction: ${cname(d, orig.clientId)} · ${orig.title} (original retained)`, orig.clientId);
      }),
      markNotDone: (clientId: string, scheduleRef: string, label: string, reason: string) => update((d) => {
        const sheet = ensureSheet(d, clientId, today());
        d.notDone.push({ id: uid('nd'), sheetId: sheet.id, scheduleRef, reason, staffId: d.session.userId ?? 'system', at: now(d) });
        audit(d, 'Documentation', `Marked not done: ${cname(d, clientId)} · ${label} · ${reason}`, clientId);
      }),

      // ---------- completion (5.1) ----------
      signOff: (sheetId: string, role: SignoffRole) => update((d) => {
        const s = d.sheets.find((x) => x.id === sheetId);
        if (!s || !d.session.userId) return;
        s.signoffs = s.signoffs.filter((x) => x.role !== role);
        s.signoffs.push({ role, staffId: d.session.userId, at: now(d) });
        audit(d, 'Sign-off', `Signed flow sheet as ${role}: ${cname(d, s.clientId)} · ${s.date}`, s.clientId);
      }),
      removeSignoff: (sheetId: string, role: SignoffRole) => update((d) => {
        const s = d.sheets.find((x) => x.id === sheetId);
        if (!s) return;
        s.signoffs = s.signoffs.filter((x) => x.role !== role);
        audit(d, 'Sign-off', `Removed own ${role} signature before completion: ${cname(d, s.clientId)}`, s.clientId);
      }),
      setParentCopy: (sheetId: string, patch: Partial<Pick<FlowSheet, 'parentCopyOffered' | 'parentCopyAccepted' | 'reviewNote'>>) => update((d) => {
        const s = d.sheets.find((x) => x.id === sheetId);
        if (!s) return;
        Object.assign(s, patch);
        if (patch.parentCopyOffered === false) s.parentCopyAccepted = null;
      }),
      completeSheet: (sheetId: string) => update((d) => {
        const s = d.sheets.find((x) => x.id === sheetId);
        if (!s) return;
        s.status = 'completed';
        s.completedBy = d.session.userId ?? undefined;
        s.completedAt = now(d);
        audit(d, 'Sign-off', `Completed daily flow sheet: ${cname(d, s.clientId)} · ${s.date} · parent copy ${s.parentCopyOffered ? (s.parentCopyAccepted ? 'offered and accepted' : 'offered, declined') : 'not offered'}`, s.clientId);
      }),

      // ---------- record access (5.2) ----------
      logAccess: (clientId: string, action: string) => update((d) => audit(d, 'Record access', `${action}: ${cname(d, clientId)}`, clientId)),
    };
  }, [update]);

  const me = state.staff.find((u) => u.id === state.session.userId);
  return { state, actions, me };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}
