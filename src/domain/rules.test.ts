import { describe, expect, it } from 'vitest';
import { buildSeed } from '../data/seed';
import { careCounts, completionGaps, ioTotals, permittedClients, todaysCare, entriesFor } from './care';
import { today } from './time';
import { dependents, FEATURES, isEffective, presetFlags, allOn } from '../features/registry';
import { DOC_MODULES, ADMIN_NAV, CARE_NAV, ADMIN_CLIENT_TABS } from '../features/modules';

const T = today();

describe("today's care", () => {
  it('derives completed / due / overdue / upcoming from the demo clock', () => {
    const s = buildSeed();
    const items = todaysCare(s, 'c_emily', T, '10:40', { includeSchedule: true, includeMeds: true });
    const by = (name: string) => items.find((i) => i.name.startsWith(name))!;
    expect(by('G-tube feeding').status).toBe('completed');
    expect(by('Levetiracetam').status).toBe('completed');
    expect(by('Position change').status).toBe('overdue');
    expect(by('G-tube site care').status).toBe('due');
    expect(by('Glycopyrrolate').status).toBe('upcoming');
    expect(careCounts(items).total).toBe(items.length);
  });
  it('omits medication doses when the medication module is out of scope', () => {
    const s = buildSeed();
    const items = todaysCare(s, 'c_emily', T, '10:40', { includeSchedule: true, includeMeds: false });
    expect(items.some((i) => i.docKind === 'medication')).toBe(false);
  });
  it('inactive schedule items disappear', () => {
    const s = buildSeed();
    s.schedule.forEach((x) => { if (x.clientId === 'c_liam') x.active = false; });
    expect(todaysCare(s, 'c_liam', T, '10:40', { includeSchedule: true, includeMeds: true })).toHaveLength(0);
  });
});

describe('intake & output', () => {
  it('counts output captured during toileting / brief change without a second entry', () => {
    const s = buildSeed();
    const io = ioTotals(entriesFor(s, 'c_emily', T));
    expect(io.intakeMl).toBe(120);
    expect(io.urine).toBe(1);
    expect(io.fromActivities).toBe(1);
  });
  it('ignores entries that were corrected', () => {
    const s = buildSeed();
    const list = entriesFor(s, 'c_emily', T);
    const intake = list.find((e) => e.kind === 'intakeOutput')!;
    list.push({ ...intake, id: 'corr', kind: 'note', correctionOf: intake.id });
    expect(ioTotals(list).intakeMl).toBe(0);
  });
});

describe('access scope', () => {
  it('limits care staff to their location and care areas', () => {
    const s = buildSeed();
    const james = s.staff.find((x) => x.id === 'u_james')!;
    const ids = permittedClients(s, james).map((c) => c.id);
    expect(ids).toContain('c_emily');
    expect(ids).not.toContain('c_ava'); // Infant & Toddler
    expect(ids).not.toContain('c_zoe'); // other location
    expect(ids).not.toContain('c_mason'); // inactive
  });
});

describe('completion', () => {
  it('requires the assumed sign-offs and the parent-copy answers', () => {
    const s = buildSeed();
    const sheet = s.sheets.find((x) => x.clientId === 'c_emily' && x.date === T)!;
    expect(completionGaps(sheet, ['PCA', 'Licensed Nurse'])).toHaveLength(3);
    sheet.signoffs = [{ role: 'PCA', staffId: 'u_james', at: '' }, { role: 'Licensed Nurse', staffId: 'u_sarah', at: '' }];
    sheet.parentCopyOffered = true;
    expect(completionGaps(sheet, ['PCA', 'Licensed Nurse'])).toEqual(['Parent copy accepted: yes / no']);
    sheet.parentCopyAccepted = false;
    expect(completionGaps(sheet, ['PCA', 'Licensed Nurse'])).toHaveLength(0);
  });
});

describe('feature registry', () => {
  it('core features can never be switched off', () => {
    const flags = presetFlags('lean');
    for (const f of FEATURES.filter((x) => !x.removable)) expect(isEffective(flags, f.id)).toBe(true);
    expect(isEffective(flags, 'medications')).toBe(false);
  });
  it('dependencies switch dependents off', () => {
    const flags = { ...allOn(), history: false };
    expect(isEffective(flags, 'authorizationHistory')).toBe(false);
    expect(dependents('history')).toContain('authorizationHistory');
  });
  it('presets are cumulative', () => {
    const core = presetFlags('core');
    expect(core.observations && core.assessments && !core.medications && !core.staffManagement).toBe(true);
    expect(Object.values(presetFlags('admin')).every(Boolean)).toBe(true);
  });
  it('every module, nav item and tab references a registered feature', () => {
    const ids = new Set(FEATURES.map((f) => f.id));
    for (const m of DOC_MODULES) expect(ids.has(m.feature)).toBe(true);
    for (const n of [...ADMIN_NAV, ...CARE_NAV, ...ADMIN_CLIENT_TABS]) if ('feature' in n && n.feature) expect(ids.has(n.feature)).toBe(true);
    expect(DOC_MODULES.find((m) => m.feature === 'activities')).toBeTruthy();
  });
});
