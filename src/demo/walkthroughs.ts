// Guided presenter walkthroughs. Each step can switch the demo user/surface, navigate, and point at
// an element (data-tour attribute). Steps never block the UI: the presenter can click anything.
import type { FeatureId, Layer } from '../features/registry';
import type { Surface } from '../domain/types';

export interface Step {
  title: string;
  body: string;
  route: string;
  /** Demo user to be signed in as for this step; null = signed out. undefined = leave as is. */
  user?: string | null;
  surface?: Surface;
  target?: string; // data-tour value to highlight
  requires?: FeatureId; // step is skipped when the feature is out of scope
}
export interface Walkthrough { id: 'admin' | 'care' | 'lean'; title: string; sub: string; preset?: Layer; steps: Step[] }

export const WALKTHROUGHS: Walkthrough[] = [
  {
    id: 'admin', title: 'A · Administrative setup', sub: 'Web Admin: clients, care schedule, staff, audit - then hand over to Care Staff.',
    steps: [
      { title: 'Sign in with MFA', body: 'Individual sign-in with email or employee ID, then a verification code. Use the demo account button, then enter code 246810.', route: '/admin/signin', user: null, surface: 'admin', target: 'signin' },
      { title: 'Clients', body: 'Client list with DOB/age, location, care area and status. Search and filter by care area.', route: '/admin/clients', user: 'u_dana', surface: 'admin', target: 'client-table', requires: 'clientManagement' },
      { title: 'Create a client', body: 'Baseline fields from the flow-sheet header: name, DOB, height, weight, location, care area. Try "Fill sample client" - a duplicate check runs on name + DOB.', route: '/admin/clients/new', user: 'u_dana', surface: 'admin', target: 'client-form', requires: 'clientManagement' },
      { title: 'Client record', body: "Emily Carter's demographics and care context. Tabs hold the care schedule, medications, device record and authorization periods.", route: '/admin/clients/c_emily', user: 'u_dana', surface: 'admin', target: 'client-tabs', requires: 'clientManagement' },
      { title: 'Care instructions & schedule', body: 'Add a scheduled activity (name, instructions, time, days, active). It appears in the Care Staff "Today\'s Care" immediately. Change history is kept.', route: '/admin/clients/c_emily/care-schedule', user: 'u_dana', surface: 'admin', target: 'schedule-add', requires: 'scheduleManagement' },
      { title: 'Medications', body: 'Bounded setup: medication, dose, route, schedule. Scheduled doses flow to Care Staff. No drug database or e-prescribing.', route: '/admin/clients/c_emily/medications', user: 'u_dana', surface: 'admin', target: 'med-table', requires: 'medications' },
      { title: 'Staff & access', body: 'Invite staff with role (Administrative User or Care Staff), location and care areas. Deactivate/reactivate; history stays attributed.', route: '/admin/staff', user: 'u_dana', surface: 'admin', target: 'staff-table', requires: 'staffManagement' },
      { title: 'Audit trail', body: 'Who did what, when, to which client - sign-ins, documentation, schedule and access changes, record prints.', route: '/admin/audit', user: 'u_dana', surface: 'admin', target: 'audit-table', requires: 'auditTrail' },
      { title: 'Switch to Care Staff', body: 'Now the iPad: Sarah Mitchell (LVN) sees the clients in her care areas and today\'s required care, including anything just added.', route: '/care/clients', user: 'u_sarah', surface: 'care', target: 'client-board' },
    ],
  },
  {
    id: 'care', title: 'B · Care Staff daily documentation', sub: 'iPad: client board → today’s care → document → shared timeline → completion.',
    steps: [
      { title: 'Care area client board', body: 'Sarah sees only clients in her location and care areas, with due / overdue counts and the last documentation time.', route: '/care/clients', user: 'u_sarah', surface: 'care', target: 'client-board' },
      { title: 'Filter by care area', body: 'Tap a care area to narrow the board. Search works on name.', route: '/care/clients', user: 'u_sarah', surface: 'care', target: 'area-filter' },
      { title: 'Open Emily Carter', body: 'The client workspace: header with DOB/age, care area and indicators (device indicators come from the device record).', route: '/care/clients/c_emily', user: 'u_sarah', surface: 'care', target: 'client-header' },
      { title: "Review today's required care", body: 'Scheduled care and medication doses in time order: completed, due, overdue, upcoming. Tap an item to document it.', route: '/care/clients/c_emily', user: 'u_sarah', surface: 'care', target: 'todays-care', requires: 'careSchedule' },
      { title: "Today's flow sheet", body: 'One flow sheet per client per care date. Entries from James (PCA) and Sarah are shown with who and when.', route: '/care/clients/c_emily/flow-sheet', user: 'u_sarah', surface: 'care', target: 'timeline' },
      { title: 'Document intake', body: 'Record 120 mL via G-tube. Time and staff attribution are automatic.', route: '/care/clients/c_emily/document/intakeOutput', user: 'u_sarah', surface: 'care', target: 'doc-sheet', requires: 'intakeOutput' },
      { title: 'Record a medication', body: 'Glycopyrrolate 0.5 mg is scheduled at 12:00. Mark it Given (or Held / Refused / Omitted with a note) - the scheduled dose shows completed.', route: '/care/clients/c_emily/document/medication', user: 'u_sarah', surface: 'care', target: 'doc-sheet', requires: 'medications' },
      { title: 'Another documentation type', body: 'Assessment: ten sections in accordions. "Mark within normal limits" speeds up routine sections.', route: '/care/clients/c_emily/document/assessment', user: 'u_sarah', surface: 'care', target: 'doc-sheet', requires: 'assessments' },
      { title: 'Hand the iPad to James', body: 'Quick switch by PIN keeps individual attribution on a shared device. James (PCA) adds a brief change; its output counts in Intake & Output without a second entry.', route: '/care/clients/c_emily/document/activity', user: 'u_james', surface: 'care', target: 'doc-sheet' },
      { title: 'Entries in the shared timeline', body: 'Every form feeds one timeline. Contributions stay distinguishable; corrections are appended, never overwritten.', route: '/care/clients/c_emily/flow-sheet', user: 'u_sarah', surface: 'care', target: 'timeline' },
      { title: 'Review, sign-off, complete', body: 'PCA / Licensed Nurse / RN signature areas (requirements pending nursing confirmation), parent copy offered / accepted, then complete. The record becomes read-only.', route: '/care/clients/c_emily/complete', user: 'u_sarah', surface: 'care', target: 'signoff', requires: 'completionSignoff' },
      { title: 'Records & history', body: 'Find prior flow sheets by client and date range (or the current authorization period), open read-only, print or save as PDF.', route: '/care/records', user: 'u_sarah', surface: 'care', target: 'records', requires: 'history' },
    ],
  },
  {
    id: 'lean', title: 'C · Lean Phase 1', sub: 'Smallest viable product. Switches scope to “Leanest version” first.', preset: 'lean',
    steps: [
      { title: 'Scope set to leanest version', body: 'Optional modules are switched off (see Scope). Sign in with email/employee ID and password.', route: '/care/signin', user: null, surface: 'care', target: 'signin' },
      { title: 'Client list', body: 'The same client board, without schedule counts.', route: '/care/clients', user: 'u_james', surface: 'care', target: 'client-board' },
      { title: 'Open a client', body: 'Basic client context: name, DOB/age, care area, indicators.', route: '/care/clients/c_liam', user: 'u_james', surface: 'care', target: 'client-header' },
      { title: 'Record a routine care activity', body: 'Only Care Activity remains in the picker. Toileting with optional output.', route: '/care/clients/c_liam/document/activity', user: 'u_james', surface: 'care', target: 'doc-sheet' },
      { title: "See today's entries", body: 'The saved entry appears in the shared timeline with time and staff. Restore full scope from the Scope panel when done.', route: '/care/clients/c_liam', user: 'u_james', surface: 'care', target: 'timeline' },
    ],
  },
];
