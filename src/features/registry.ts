// Central prototype feature registry.
//
// Every independently removable capability is declared here once, with its roadmap reference,
// scope layer and dependencies. Screens, navigation items and documentation types ask this
// registry (through useFeature / useFeatures) instead of scattering their own conditions.
//
// To remove a capability for a lower-budget Phase 1:
//   1. switch it off in the presenter "Scope" panel to preview the smaller product, then
//   2. delete its module folder and its entry in src/features/modules.tsx.
// Core features (removable: false) make up the leanest journey and must stay.

export type Layer = 'lean' | 'core' | 'extended' | 'admin' | 'future';

export type FeatureId =
  | 'clientBoard'
  | 'activities'
  | 'dailyTimeline'
  | 'mfa'
  | 'termsAcceptance'
  | 'accountLifecycle'
  | 'quickSwitch'
  | 'careSchedule'
  | 'observations'
  | 'intakeOutput'
  | 'assessments'
  | 'medications'
  | 'specializedCare'
  | 'completionSignoff'
  | 'history'
  | 'authorizationHistory'
  | 'clientManagement'
  | 'scheduleManagement'
  | 'staffManagement'
  | 'auditTrail';

export interface FeatureDef {
  id: FeatureId;
  label: string;
  roadmap: string[];
  layer: Layer;
  removable: boolean;
  surface: 'care' | 'admin' | 'both';
  dependsOn?: FeatureId[];
  summary: string;
}

export const FEATURES: FeatureDef[] = [
  // Leanest possible version: these never switch off.
  { id: 'clientBoard', label: 'Client list & basic client context', roadmap: ['4.1', '2.3', '2.5'], layer: 'lean', removable: false, surface: 'care', summary: 'Sign in, care-area client board, open a client.' },
  { id: 'activities', label: 'Routine care activities', roadmap: ['4.5'], layer: 'lean', removable: false, surface: 'care', summary: 'Toileting, brief change, enrichment, outdoor activity.' },
  { id: 'dailyTimeline', label: "Today's entries (shared timeline)", roadmap: ['4.6'], layer: 'lean', removable: false, surface: 'care', summary: 'One attributable timeline per client and care date.' },

  // Core care documentation.
  { id: 'careSchedule', label: "Care instructions & today's schedule", roadmap: ['3.1'], layer: 'core', removable: true, surface: 'care', summary: 'Due / completed / not-done scheduled care per client.' },
  { id: 'observations', label: 'Observations / vitals', roadmap: ['4.2'], layer: 'core', removable: true, surface: 'care', summary: 'Time-based vitals and nursing care.' },
  { id: 'intakeOutput', label: 'Intake & output', roadmap: ['4.3'], layer: 'core', removable: true, surface: 'care', summary: 'Intake type/amount/route; urine, stool, emesis.' },
  { id: 'assessments', label: 'Assessments', roadmap: ['4.4'], layer: 'core', removable: true, surface: 'care', summary: 'Ten structured body-system sections.' },
  { id: 'mfa', label: 'Multi-factor sign-in', roadmap: ['2.3'], layer: 'core', removable: true, surface: 'both', summary: 'Verification code after password (simulated).' },

  // Extended clinical documentation.
  { id: 'medications', label: 'Medication documentation', roadmap: ['4.8'], layer: 'extended', removable: true, surface: 'both', summary: 'Given / held / refused / omitted against scheduled doses.' },
  { id: 'specializedCare', label: 'Feeding-tube & tracheostomy care', roadmap: ['4.7'], layer: 'extended', removable: true, surface: 'both', summary: 'One device record per device + daily site checks.' },
  { id: 'completionSignoff', label: 'Review, completion & sign-off', roadmap: ['5.1'], layer: 'extended', removable: true, surface: 'care', summary: 'PCA / Licensed Nurse / RN sign-off, parent copy.' },
  { id: 'history', label: 'Records & history', roadmap: ['5.2'], layer: 'extended', removable: true, surface: 'care', summary: 'Find prior flow sheets; read-only, printable.' },
  { id: 'authorizationHistory', label: 'Authorization-period history', roadmap: ['5.3'], layer: 'extended', removable: true, surface: 'both', dependsOn: ['history'], summary: 'Payer + dates; current-period filter in Records.' },
  { id: 'termsAcceptance', label: 'Terms acceptance record', roadmap: ['2.2'], layer: 'extended', removable: true, surface: 'both', summary: 'Versioned acceptance before protected use.' },
  { id: 'accountLifecycle', label: 'Account activation & password recovery', roadmap: ['2.1', '2.4'], layer: 'extended', removable: true, surface: 'both', dependsOn: ['staffManagement'], summary: 'Invite-code activation with PIN; reset link.' },

  // Administrative controls (React Web Admin).
  { id: 'clientManagement', label: 'Client management', roadmap: ['6.1', '6.4'], layer: 'admin', removable: true, surface: 'admin', summary: 'Create / edit clients, duplicate safeguard.' },
  { id: 'scheduleManagement', label: 'Care schedule management', roadmap: ['6.2'], layer: 'admin', removable: true, surface: 'admin', dependsOn: ['clientManagement', 'careSchedule'], summary: 'Add / edit / deactivate scheduled care, change history.' },
  { id: 'staffManagement', label: 'Staff & access', roadmap: ['6.3'], layer: 'admin', removable: true, surface: 'admin', summary: 'Invite, assign care areas, deactivate / reactivate.' },
  { id: 'auditTrail', label: 'Audit trail', roadmap: ['6.5', '7.1'], layer: 'admin', removable: true, surface: 'admin', summary: 'Filtered, attributable activity log.' },

  // Future / recommended enhancements: demo-only, NOT in the Phase 1 baseline or estimate. Off by default.
  // Baseline hand-over on a shared iPad is: User A logs out -> User B signs in with their own account.
  { id: 'quickSwitch', label: 'Shared-iPad quick switch (PIN)', roadmap: ['Future'], layer: 'future', removable: true, surface: 'care', summary: 'Faster hand-over by PIN if repeated sign-in proves burdensome. Not in the Phase 1 estimate.' },
];

export const LAYERS: { key: Layer; label: string; hint: string }[] = [
  { key: 'lean', label: 'Leanest version', hint: 'Login, client list, open client, record routine care, see today’s entries.' },
  { key: 'core', label: 'Core care documentation', hint: 'Adds care schedule, observations, intake & output, assessments.' },
  { key: 'extended', label: 'Extended clinical documentation', hint: 'Adds medications, device care, completion / sign-off, history.' },
  { key: 'admin', label: 'Administrative controls', hint: 'Adds client configuration, schedule management, staff, audit.' },
  { key: 'future', label: 'Future / recommended enhancements (not in Phase 1 estimate)', hint: 'Optional demo of ideas outside the baseline.' },
];

export type FeatureFlags = Record<FeatureId, boolean>;

const byId = Object.fromEntries(FEATURES.map((f) => [f.id, f])) as Record<FeatureId, FeatureDef>;
export const feature = (id: FeatureId) => byId[id];

/** Cumulative presets: each layer includes everything before it. Future enhancements are never part of a preset. */
export function presetFlags(upTo: Exclude<Layer, 'future'>): FeatureFlags {
  const order: Layer[] = ['lean', 'core', 'extended', 'admin'];
  const max = order.indexOf(upTo);
  return Object.fromEntries(FEATURES.map((f) => [f.id, !f.removable || (f.layer !== 'future' && order.indexOf(f.layer) <= max)])) as FeatureFlags;
}
/** Default scope: the full Phase 1 roadmap, future enhancements off. */
export const roadmapScope = (): FeatureFlags => presetFlags('admin');
export const isRoadmapScope = (flags: FeatureFlags) => FEATURES.every((f) => flags[f.id] === roadmapScope()[f.id]);

/** A feature is effective only when it is switched on and every dependency is effective. */
export function isEffective(flags: FeatureFlags, id: FeatureId, seen: Set<FeatureId> = new Set()): boolean {
  const def = byId[id];
  if (!def) return false;
  if (!def.removable) return true;
  if (!flags[id]) return false;
  if (seen.has(id)) return true;
  seen.add(id);
  return (def.dependsOn ?? []).every((d) => isEffective(flags, d, seen));
}

/** Features that would stop working if `id` were removed. */
export function dependents(id: FeatureId): FeatureId[] {
  return FEATURES.filter((f) => f.dependsOn?.includes(id)).map((f) => f.id);
}

/** Admin Web surface exists only while at least one admin capability is in scope. */
export const ADMIN_FEATURES: FeatureId[] = ['clientManagement', 'scheduleManagement', 'staffManagement', 'auditTrail'];
