// Seeded fictional scenario. All names, dates of birth, payers and clinical values are invented.
import type { AppState, AuditEvent, CareScheduleItem, Client, DeviceRecord, FlowEntry, FlowSheet, MedicationOrder, Staff } from '../domain/types';
import { addDays, ALL_DAYS, stamp, today, weekday, WEEKDAYS } from '../domain/time';

export const STATE_VERSION = 3;
export const DEFAULT_DEMO_TIME = '10:40';
export const MFA_DEMO_CODE = '246810';
export const DEMO_PASSWORD = 'demo';

const LOCATIONS = ['North Center', 'Westside Center'];
const CARE_AREAS = ['Pediatric Area', 'Infant & Toddler Area', 'Youth Area'];

function yearsAgo(years: number, monthOffset = 0, day = 12): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth() - monthOffset, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildSeed(): AppState {
  const T = today();
  const created = stamp(addDays(T, -120), '09:00');

  const staff: Staff[] = [
    { id: 'u_dana', name: 'Dana Whitfield', email: 'dana.whitfield@solaria.example', employeeId: 'SC-1001', role: 'admin', title: 'Administrator', location: 'North Center', careAreas: CARE_AREAS, status: 'active', pin: '1001', termsAcceptedVersion: '2026.1' },
    { id: 'u_sarah', name: 'Sarah Mitchell', email: 'sarah.mitchell@solaria.example', employeeId: 'SC-2014', role: 'care', title: 'LVN', location: 'North Center', careAreas: CARE_AREAS, status: 'active', pin: '2014', termsAcceptedVersion: '2026.1' },
    { id: 'u_james', name: 'James Rivera', email: 'james.rivera@solaria.example', employeeId: 'SC-2031', role: 'care', title: 'PCA', location: 'North Center', careAreas: ['Pediatric Area', 'Youth Area'], status: 'active', pin: '2031', termsAcceptedVersion: '2026.1' },
    { id: 'u_grace', name: 'Grace Owens', email: 'grace.owens@solaria.example', employeeId: 'SC-2002', role: 'care', title: 'RN', location: 'North Center', careAreas: CARE_AREAS, status: 'active', pin: '2002', termsAcceptedVersion: '2026.1' },
    { id: 'u_keisha', name: 'Keisha Brown', email: 'keisha.brown@solaria.example', employeeId: 'SC-3007', role: 'care', title: 'PCA', location: 'Westside Center', careAreas: ['Pediatric Area'], status: 'active', pin: '3007', termsAcceptedVersion: '2026.1' },
    { id: 'u_nina', name: 'Nina Park', email: 'nina.park@solaria.example', employeeId: 'SC-2040', role: 'care', title: 'Direct-Care Staff', location: 'North Center', careAreas: ['Youth Area'], status: 'invited', inviteCode: 'SOL-4821' },
    { id: 'u_tom', name: 'Tom Keller', email: 'tom.keller@solaria.example', employeeId: 'SC-1988', role: 'care', title: 'PCA', location: 'North Center', careAreas: ['Pediatric Area'], status: 'inactive', pin: '1988', termsAcceptedVersion: '2025.2' },
  ];

  const client = (id: string, firstName: string, lastName: string, dob: string, heightCm: number, weightKg: number, location: string, careArea: string, indicators: string[], notes: string, status: Client['status'] = 'active'): Client =>
    ({ id, firstName, lastName, dob, heightCm, weightKg, location, careArea, indicators, notes, status, createdAt: created, updatedAt: created });

  const clients: Client[] = [
    client('c_emily', 'Emily', 'Carter', yearsAgo(6, 3, 14), 112, 18.4, 'North Center', 'Pediatric Area', ['Seizure precautions', 'NPO except G-tube'], 'Bolus feeds via G-tube. Parent prefers updates at pick-up.'),
    client('c_noah', 'Noah', 'Bennett', yearsAgo(8, 7, 3), 124, 22.1, 'North Center', 'Pediatric Area', ['Aspiration risk', 'Latex allergy'], 'Humidified trach collar during rest periods.'),
    client('c_ava', 'Ava', 'Morales', yearsAgo(3, 1, 22), 94, 13.6, 'North Center', 'Infant & Toddler Area', ['Penicillin sensitivity - see order note'], 'Completing a 10-day antibiotic course this week.'),
    client('c_liam', 'Liam', 'Foster', yearsAgo(11, 5, 9), 141, 34.0, 'North Center', 'Youth Area', [], 'Uses picture schedule for transitions.'),
    client('c_zoe', 'Zoe', 'Nguyen', yearsAgo(5, 9, 17), 106, 16.8, 'Westside Center', 'Pediatric Area', ['Wears AFOs'], 'AFOs on during activity, off during rest.'),
    client('c_mason', 'Mason', 'Reed', yearsAgo(7, 2, 1), 118, 20.5, 'North Center', 'Pediatric Area', [], 'Discharged from program last month.', 'inactive'),
  ];

  // Seeded schedules run every day so a demo on any weekday or weekend shows today's care.
  const hist = (text: string) => [{ at: created, by: 'u_dana', text }];
  const sch = (id: string, clientId: string, time: string, name: string, docKind: CareScheduleItem['docKind'], instructions: string, days = ALL_DAYS): CareScheduleItem =>
    ({ id, clientId, time, name, docKind, instructions, days, active: true, history: hist('Created during initial schedule setup') });

  const schedule: CareScheduleItem[] = [
    sch('s_em_feed1', 'c_emily', '09:00', 'G-tube feeding', 'intakeOutput', 'PediaSure 1.0, 120 mL bolus over 20 min. Flush 10 mL water before and after.'),
    sch('s_em_assess', 'c_emily', '10:00', 'Nursing assessment', 'assessment', 'Full head-to-toe; note respiratory effort and stoma site.'),
    sch('s_em_rom', 'c_emily', '10:00', 'Position change / ROM', 'observations', 'Reposition every 2 hours while seated; passive ROM to lower limbs.'),
    sch('s_em_site', 'c_emily', '11:00', 'G-tube site care', 'specializedCare', 'Clean with soap and water, dry thoroughly, check for redness or leakage.'),
    sch('s_em_brief', 'c_emily', '11:30', 'Diaper / brief change', 'activity', 'Check and change; record output.'),
    sch('s_em_feed2', 'c_emily', '13:00', 'G-tube feeding', 'intakeOutput', 'PediaSure 1.0, 120 mL bolus. Flush before and after.'),
    sch('s_em_vitals', 'c_emily', '14:00', 'Vitals', 'observations', 'Temp, HR, RR, SpO2.'),
    sch('s_em_out', 'c_emily', '15:00', 'Outdoor activity', 'activity', 'Shaded area only; sunscreen applied by 14:45.'),

    sch('s_no_trach', 'c_noah', '08:30', 'Tracheostomy site care', 'specializedCare', 'Clean stoma, change split gauze, check ties (one finger fit).'),
    sch('s_no_suction', 'c_noah', '09:30', 'Suction & vitals', 'observations', 'Suction as needed; document secretions and SpO2 before/after.'),
    sch('s_no_resp', 'c_noah', '10:30', 'Respiratory assessment', 'assessment', 'Lung sounds, effort, secretions, trach findings.'),
    sch('s_no_pos', 'c_noah', '12:30', 'Position change / ROM', 'observations', 'Upright 30° minimum after meals.'),
    sch('s_no_enrich', 'c_noah', '14:00', 'Enrichment', 'activity', 'Sensory table or music group.'),

    sch('s_av_diaper1', 'c_ava', '09:30', 'Diaper change', 'activity', 'Record wet / stool.'),
    sch('s_av_snack', 'c_ava', '10:00', 'Morning snack', 'intakeOutput', 'Offer 4 oz whole milk + soft snack by mouth.'),
    sch('s_av_diaper2', 'c_ava', '11:30', 'Diaper change', 'activity', 'Record wet / stool.'),
    sch('s_av_lunch', 'c_ava', '12:00', 'Lunch', 'intakeOutput', 'Soft diet, finger foods; record fluids.'),
    sch('s_av_nap', 'c_ava', '12:45', 'Rest period - position check', 'observations', 'Back to sleep; check color and breathing every 15 min.'),

    sch('s_li_toilet1', 'c_liam', '10:00', 'Toileting', 'activity', 'Prompted toileting with picture card.'),
    sch('s_li_out', 'c_liam', '11:30', 'Outdoor activity', 'activity', 'Playground with 1:1 staff.'),
    sch('s_li_toilet2', 'c_liam', '13:00', 'Toileting', 'activity', 'Prompted toileting.'),
    sch('s_li_enrich', 'c_liam', '14:30', 'Enrichment', 'activity', 'Art or reading group.'),

    sch('s_zo_rom', 'c_zoe', '10:00', 'AFO skin check / ROM', 'observations', 'Remove AFOs, check skin, passive ROM, reapply.'),
    sch('s_zo_toilet', 'c_zoe', '11:00', 'Toileting', 'activity', 'Assist on and off.'),
  ];

  const med = (id: string, clientId: string, name: string, dose: string, route: string, times: string[], instructions: string): MedicationOrder =>
    ({ id, clientId, name, dose, route, times, days: ALL_DAYS, instructions, active: true, history: hist('Entered from parent-supplied order during setup') });
  const medications: MedicationOrder[] = [
    med('m_em_levet', 'c_emily', 'Levetiracetam', '150 mg', 'G-tube', ['08:00'], 'Flush with 5 mL water after.'),
    med('m_em_glyco', 'c_emily', 'Glycopyrrolate', '0.5 mg', 'G-tube', ['12:00'], 'For secretions.'),
    med('m_no_bud', 'c_noah', 'Budesonide nebulizer', '0.5 mg', 'Inhalation (via trach)', ['09:00', '15:00'], ''),
    med('m_no_ome', 'c_noah', 'Omeprazole', '10 mg', 'PO', ['11:30'], 'Give 30 min before lunch.'),
    med('m_av_amox', 'c_ava', 'Amoxicillin', '200 mg', 'PO', ['09:00', '13:00'], 'Day 6 of 10. Parent confirmed tolerated previously.'),
    med('m_av_cet', 'c_ava', 'Cetirizine', '2.5 mg', 'PO', ['10:30'], ''),
  ];

  const devices: DeviceRecord[] = [
    { id: 'd_em_gt', clientId: 'c_emily', type: 'G-tube', description: 'Low-profile balloon button', size: '14 Fr · 1.5 cm', details: 'Balloon 5 mL sterile water; checked weekly.', lastChanged: addDays(T, -41), active: true, history: hist('Device record created') },
    { id: 'd_no_tr', clientId: 'c_noah', type: 'Tracheostomy', description: 'Pediatric cuffless', size: '4.0 PED', details: 'Velcro ties; spare trach and one size smaller in go-bag.', lastChanged: addDays(T, -9), active: true, history: hist('Device record created') },
  ];

  const authorizations = [
    { id: 'a_em_1', clientId: 'c_emily', payer: 'Horizon Kids Health Plan (fictional)', start: addDays(T, -224), end: addDays(T, -45), reference: 'HK-22-01931' },
    { id: 'a_em_2', clientId: 'c_emily', payer: 'Horizon Kids Health Plan (fictional)', start: addDays(T, -44), end: addDays(T, 136), reference: 'HK-22-04410' },
    { id: 'a_no_1', clientId: 'c_noah', payer: 'BrightPath Medicaid (fictional)', start: addDays(T, -12), end: addDays(T, 168), reference: 'BP-7781-02' },
    { id: 'a_av_1', clientId: 'c_ava', payer: 'Horizon Kids Health Plan (fictional)', start: addDays(T, -80), end: addDays(T, 100), reference: 'HK-23-00277' },
    { id: 'a_li_1', clientId: 'c_liam', payer: 'BrightPath Medicaid (fictional)', start: addDays(T, -150), end: addDays(T, 30), reference: 'BP-6620-11' },
  ];

  const sheets: FlowSheet[] = [];
  const entries: FlowEntry[] = [];
  let n = 0;
  const sheetId = (c: string, d: string) => `fs_${c}_${d}`;
  const ensureSheet = (clientId: string, date: string, status: FlowSheet['status'] = 'open') => {
    let s = sheets.find((x) => x.clientId === clientId && x.date === date);
    if (!s) { s = { id: sheetId(clientId, date), clientId, date, status, signoffs: [], parentCopyOffered: null, parentCopyAccepted: null, reviewNote: '' }; sheets.push(s); }
    return s;
  };
  const add = (clientId: string, date: string, e: Omit<FlowEntry, 'id' | 'sheetId' | 'clientId' | 'date' | 'enteredAt'> & { enteredAt?: string }) => {
    const s = ensureSheet(clientId, date);
    const entry: FlowEntry = { id: `e_${++n}`, sheetId: s.id, clientId, date, enteredAt: e.enteredAt ?? stamp(date, e.careTime), ...e };
    entries.push(entry);
    return entry;
  };

  // ---------- Generic entry builders used for today and for history ----------
  const vitals = (clientId: string, date: string, careTime: string, staffId: string, v: { t: string; hr: string; rr: string; spo2: string; color?: string; o2?: string }, scheduleRef?: string) =>
    add(clientId, date, { kind: 'observations', careTime, staffId, scheduleRef, title: 'Observations', summary: `T ${v.t}°F · HR ${v.hr} · RR ${v.rr} · SpO₂ ${v.spo2}%`, details: [['Temperature', `${v.t} °F`], ['Heart rate', `${v.hr} bpm`], ['Respiratory rate', `${v.rr} /min`], ['Color', v.color ?? 'Pink'], ['Oxygen', v.o2 ?? 'Room air'], ['Oxygen saturation', `${v.spo2}%`]], data: { temperature: v.t, heartRate: v.hr, respRate: v.rr, spo2: v.spo2, color: v.color ?? 'Pink', oxygen: v.o2 ?? 'Room air' } });
  const intake = (clientId: string, date: string, careTime: string, staffId: string, type: string, amount: string, route: string, scheduleRef?: string) =>
    add(clientId, date, { kind: 'intakeOutput', careTime, staffId, scheduleRef, title: 'Intake', summary: `${amount} mL ${type} via ${route}`, details: [['Type', type], ['Amount', `${amount} mL`], ['Route', route]], data: { direction: 'intake', type, amount, route } });
  const activity = (clientId: string, date: string, careTime: string, staffId: string, name: string, notes: string, output?: FlowEntry['output'], scheduleRef?: string) => {
    const outText = output ? Object.entries(output).filter(([, v]) => v).map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`).join(' · ') : '';
    return add(clientId, date, { kind: 'activity', careTime, staffId, scheduleRef, title: name, summary: [notes, outText].filter(Boolean).join(' · ') || 'Completed', details: [['Activity', name], ...(notes ? [['Notes', notes] as [string, string]] : []), ...(outText ? [['Output', outText] as [string, string]] : [])], data: { activity: name, notes }, output });
  };
  const medGiven = (clientId: string, date: string, careTime: string, staffId: string, m: MedicationOrder, time: string, status = 'Given', note = '') =>
    add(clientId, date, { kind: 'medication', careTime, staffId, scheduleRef: `${m.id}@${time}`, title: 'Medication', summary: `${m.name} ${m.dose} · ${m.route} · ${status}`, details: [['Medication', `${m.name} ${m.dose}`], ['Route', m.route], ['Scheduled', time], ['Status', status], ...(note ? [['Note', note] as [string, string]] : [])], data: { medId: m.id, status, note } });
  const assessment = (clientId: string, date: string, careTime: string, staffId: string, sections: string[], summary: string, details: [string, string][], scheduleRef?: string) =>
    add(clientId, date, { kind: 'assessment', careTime, staffId, scheduleRef, title: 'Assessment', summary, details: [['Sections', sections.join(', ')], ...details], data: { sections } });
  const site = (clientId: string, date: string, careTime: string, staffId: string, device: DeviceRecord, finding: string, scheduleRef?: string) =>
    add(clientId, date, { kind: 'specializedCare', careTime, staffId, scheduleRef, title: `${device.type} care`, summary: `${device.type} ${device.size} · ${finding}`, details: [['Device', `${device.type} · ${device.description} · ${device.size}`], ['Site condition', finding], ['Care performed', 'Site cleaned and dried']], data: { deviceId: device.id, siteCondition: finding } });

  const [emGt, noTr] = devices;
  const medById = (id: string) => medications.find((m) => m.id === id)!;

  // ---------- Today (demo time 10:40): some care done, some due, one overdue ----------
  vitals('c_emily', T, '07:50', 'u_james', { t: '98.4', hr: '96', rr: '22', spo2: '98' });
  medGiven('c_emily', T, '08:02', 'u_sarah', medById('m_em_levet'), '08:00');
  activity('c_emily', T, '08:15', 'u_james', 'Diaper / Brief Change', 'Skin intact', { urine: 'Wet - moderate' });
  intake('c_emily', T, '09:05', 'u_james', 'PediaSure 1.0', '120', 'G-tube', 's_em_feed1@09:00');
  assessment('c_emily', T, '09:50', 'u_sarah', ['Respiratory', 'Neurological', 'Skin'], 'Respiratory, neurological and skin assessment documented', [['Respiratory', 'Unlabored, clear bilaterally, no secretions'], ['Neurological', 'Alert, tone baseline'], ['Skin', 'Warm, dry, cap refill < 3 s']], 's_em_assess@10:00');

  site('c_noah', T, '08:34', 'u_sarah', noTr, 'Clean, dry, no redness', 's_no_trach@08:30');
  medGiven('c_noah', T, '09:04', 'u_sarah', medById('m_no_bud'), '09:00');
  vitals('c_noah', T, '09:35', 'u_james', { t: '98.9', hr: '104', rr: '26', spo2: '96', o2: '28% · 5 L/min trach collar' }, 's_no_suction@09:30');

  medGiven('c_ava', T, '09:02', 'u_sarah', medById('m_av_amox'), '09:00');
  activity('c_ava', T, '09:34', 'u_james', 'Diaper / Brief Change', '', { urine: 'Wet - small', stool: 'Soft, formed' }, 's_av_diaper1@09:30');

  activity('c_liam', T, '10:05', 'u_james', 'Toileting', 'Independent with prompt', { urine: 'Voided' }, 's_li_toilet1@10:00');

  vitals('c_zoe', T, '09:40', 'u_keisha', { t: '98.2', hr: '92', rr: '20', spo2: '99' });

  // ---------- History: completed flow sheets for the previous 8 program days ----------
  const history: { date: string }[] = [];
  for (let back = 1; history.length < 8 && back < 20; back++) {
    const d = addDays(T, -back);
    if (WEEKDAYS.includes(weekday(d))) history.push({ date: d });
  }
  history.forEach(({ date }, i) => {
    const pca = i % 2 ? 'u_james' : 'u_tom';
    const nurse = i % 3 === 0 ? 'u_grace' : 'u_sarah';
    const pcaActive = i < 5 ? 'u_james' : pca; // Tom (now inactive) appears in older records: attribution is kept
    // Emily
    vitals('c_emily', date, '08:10', pcaActive, { t: (98.1 + (i % 4) * 0.2).toFixed(1), hr: String(92 + i), rr: '22', spo2: String(97 + (i % 2)) });
    medGiven('c_emily', date, '08:03', nurse, medById('m_em_levet'), '08:00');
    intake('c_emily', date, '09:04', pcaActive, 'PediaSure 1.0', '120', 'G-tube', 's_em_feed1@09:00');
    assessment('c_emily', date, '10:02', nurse, ['Respiratory', 'Neurological', 'Skin', 'Gastrointestinal'], 'Head-to-toe assessment documented', [['Respiratory', 'Clear, unlabored'], ['Gastrointestinal', 'Soft, bowel sounds present; G-tube site clean']], 's_em_assess@10:00');
    site('c_emily', date, '11:05', nurse, emGt, i === 3 ? 'Slight redness, no drainage' : 'Clean, dry, intact', 's_em_site@11:00');
    medGiven('c_emily', date, '12:01', nurse, medById('m_em_glyco'), '12:00');
    intake('c_emily', date, '13:02', pcaActive, 'PediaSure 1.0', '120', 'G-tube', 's_em_feed2@13:00');
    activity('c_emily', date, '15:05', pcaActive, 'Outdoor Activity', 'Shaded patio, 20 min', undefined, 's_em_out@15:00');
    // Noah
    site('c_noah', date, '08:32', nurse, noTr, 'Clean, dry, ties secure', 's_no_trach@08:30');
    medGiven('c_noah', date, '09:02', nurse, medById('m_no_bud'), '09:00');
    vitals('c_noah', date, '09:33', pcaActive, { t: '98.6', hr: String(100 + i), rr: '24', spo2: '96', o2: '28% · 5 L/min trach collar' }, 's_no_suction@09:30');
    activity('c_noah', date, '14:05', pcaActive, 'Enrichment', 'Music group', undefined, 's_no_enrich@14:00');
    // Ava
    if (i < 6) medGiven('c_ava', date, '09:03', nurse, medById('m_av_amox'), '09:00');
    activity('c_ava', date, '09:31', pcaActive, 'Diaper / Brief Change', '', { urine: 'Wet' }, 's_av_diaper1@09:30');
    intake('c_ava', date, '10:04', pcaActive, 'Whole milk', '110', 'PO', 's_av_snack@10:00');
    // Liam
    activity('c_liam', date, '10:03', pcaActive, 'Toileting', 'Independent with prompt', { urine: 'Voided' }, 's_li_toilet1@10:00');
    activity('c_liam', date, '11:34', pcaActive, 'Outdoor Activity', 'Playground', undefined, 's_li_out@11:30');

    for (const c of ['c_emily', 'c_noah', 'c_ava', 'c_liam']) {
      const s = ensureSheet(c, date, 'completed');
      s.status = 'completed';
      s.signoffs = [
        { role: 'PCA', staffId: pcaActive, at: stamp(date, '15:40') },
        { role: 'Licensed Nurse', staffId: nurse, at: stamp(date, '15:50') },
      ];
      s.parentCopyOffered = true;
      s.parentCopyAccepted = i % 3 !== 1;
      s.completedBy = nurse;
      s.completedAt = stamp(date, '15:50');
    }
  });

  // Today's sheets exist for everyone who has entries; others are initialized when opened.
  for (const c of clients.filter((x) => x.status === 'active')) ensureSheet(c.id, T);

  staff.find((x) => x.id === 'u_james')!.lastSignIn = stamp(T, '07:31');
  staff.find((x) => x.id === 'u_sarah')!.lastSignIn = stamp(T, '07:58');
  staff.find((x) => x.id === 'u_dana')!.lastSignIn = stamp(T, '08:40');

  // ---------- Audit ----------
  const audit: AuditEvent[] = [];
  let a = 0;
  const log = (at: string, userId: string, category: AuditEvent['category'], action: string, clientId?: string) => audit.push({ id: `au_${++a}`, at, userId, category, action, clientId });
  log(stamp(addDays(T, -3), '16:10'), 'u_dana', 'Staff & access', 'Staff account deactivated: Tom Keller (PCA)');
  log(stamp(addDays(T, -2), '15:20'), 'u_dana', 'Care schedule', 'Updated care schedule: Emily Carter · G-tube site care instructions', 'c_emily');
  log(stamp(addDays(T, -1), '11:02'), 'u_dana', 'Staff & access', 'Invitation sent: Nina Park (Direct-Care Staff)');
  log(stamp(addDays(T, -1), '16:05'), 'u_grace', 'Record access', 'Printed flow sheet: Noah Bennett', 'c_noah');
  log(stamp(T, '07:31'), 'u_james', 'Authentication', 'Signed in (password + MFA) on shared iPad');
  log(stamp(T, '07:58'), 'u_sarah', 'Authentication', 'Switched in by PIN on shared iPad');
  log(stamp(T, '08:40'), 'u_dana', 'Authentication', 'Signed in to Web Admin (password + MFA)');
  log(stamp(T, '08:52'), 'u_dana', 'Client', 'Updated client record: Ava Morales · weight', 'c_ava');
  const nameOf = Object.fromEntries(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));
  for (const e of entries.filter((x) => x.date === T)) log(e.enteredAt, e.staffId, 'Documentation', `Documented ${e.title.toLowerCase()}: ${nameOf[e.clientId]} · ${e.summary}`, e.clientId);
  audit.sort((x, y) => y.at.localeCompare(x.at));

  return {
    version: STATE_VERSION,
    demoTime: DEFAULT_DEMO_TIME,
    staff,
    clients,
    schedule,
    medications,
    devices,
    authorizations,
    sheets,
    entries,
    notDone: [],
    audit,
    session: { userId: null, surface: null, via: null },
    termsVersion: '2026.1',
    locations: LOCATIONS,
    careAreas: CARE_AREAS,
  };
}
