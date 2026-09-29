// Domain model for the Solaria Care prototype. Everything is fictional demo data held in the browser.

export type Surface = 'admin' | 'care';
export type AppRole = 'admin' | 'care';
/** Professional title only. It labels signatures and entries; it is NOT a separate permission model. */
export type ProfessionalTitle = 'Administrator' | 'PCA' | 'LVN' | 'RN' | 'Direct-Care Staff';

export interface Staff {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: AppRole;
  title: ProfessionalTitle;
  location: string;
  careAreas: string[];
  status: 'active' | 'invited' | 'inactive';
  inviteCode?: string;
  pin?: string;
  termsAcceptedVersion?: string;
  lastSignIn?: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  heightCm: number | null;
  weightKg: number | null;
  location: string;
  careArea: string;
  status: 'active' | 'inactive';
  indicators: string[]; // e.g. allergies / precautions shown to staff
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Documentation types. Each is an independent module (see src/features). */
export type DocKind = 'observations' | 'intakeOutput' | 'assessment' | 'activity' | 'medication' | 'specializedCare' | 'note';

export interface ChangeRecord { at: string; by: string; text: string }

/** Admin-maintained, non-medication scheduled care (roadmap 6.2 / 3.1). */
export interface CareScheduleItem {
  id: string;
  clientId: string;
  name: string;
  instructions: string;
  time: string; // HH:MM
  days: number[]; // 0 = Sunday
  docKind: Exclude<DocKind, 'medication' | 'note'>;
  active: boolean;
  history: ChangeRecord[];
}

/** Medication order used for documentation only (roadmap 4.8). No drug database. */
export interface MedicationOrder {
  id: string;
  clientId: string;
  name: string;
  dose: string;
  route: string;
  times: string[]; // HH:MM
  days: number[];
  instructions: string;
  active: boolean;
  history: ChangeRecord[];
}

/** One current structured record per device (roadmap 4.7). Other screens derive indicators from here. */
export interface DeviceRecord {
  id: string;
  clientId: string;
  type: 'G-tube' | 'NG tube' | 'Tracheostomy';
  description: string; // e.g. "MIC-KEY low-profile"
  size: string;
  details: string; // placement / balloon / ties
  lastChanged: string; // YYYY-MM-DD
  active: boolean;
  history: ChangeRecord[];
}

export interface AuthorizationPeriod {
  id: string;
  clientId: string;
  payer: string;
  start: string;
  end: string;
  reference: string;
}

export type SignoffRole = 'PCA' | 'Licensed Nurse' | 'RN';

export interface Signoff { role: SignoffRole; staffId: string; at: string }

export interface FlowSheet {
  id: string;
  clientId: string;
  date: string; // care date YYYY-MM-DD
  status: 'open' | 'completed';
  signoffs: Signoff[];
  parentCopyOffered: boolean | null;
  parentCopyAccepted: boolean | null;
  reviewNote: string;
  completedBy?: string;
  completedAt?: string;
}

export type Detail = [label: string, value: string];

export interface FlowEntry {
  id: string;
  sheetId: string;
  clientId: string;
  date: string;
  kind: DocKind;
  careTime: string; // HH:MM, the time care was given
  enteredAt: string; // ISO, when it was saved
  staffId: string;
  title: string; // "Intake" / "Medication"
  summary: string; // one line for the timeline
  details: Detail[];
  data: Record<string, unknown>;
  /** "itemId@HH:MM" when the entry fulfils a scheduled care item or medication dose. */
  scheduleRef?: string;
  /** Output captured through toileting / brief change, reused by Intake & Output totals. */
  output?: { urine?: string; stool?: string; emesis?: string };
  /** Append-only correction: points to the entry this one corrects. */
  correctionOf?: string;
  /** Entry added after the flow sheet was completed. */
  addendum?: boolean;
}

/** A scheduled item explicitly marked "not done" with a reason (roadmap 3.1). */
export interface NotDone { id: string; sheetId: string; scheduleRef: string; reason: string; staffId: string; at: string }

export type AuditCategory = 'Authentication' | 'Client' | 'Care schedule' | 'Documentation' | 'Sign-off' | 'Staff & access' | 'Record access';

export interface AuditEvent {
  id: string;
  at: string;
  userId: string;
  clientId?: string;
  category: AuditCategory;
  action: string;
}

export interface Session {
  userId: string | null;
  surface: Surface | null;
  /** Staff on a shared iPad who switched in by PIN keep individual attribution. */
  via: 'credentials' | 'pin' | 'demo' | null;
}

export interface AppState {
  version: number;
  demoTime: string; // HH:MM, the prototype's "now" on today's date
  staff: Staff[];
  clients: Client[];
  schedule: CareScheduleItem[];
  medications: MedicationOrder[];
  devices: DeviceRecord[];
  authorizations: AuthorizationPeriod[];
  sheets: FlowSheet[];
  entries: FlowEntry[];
  notDone: NotDone[];
  audit: AuditEvent[];
  session: Session;
  termsVersion: string;
  locations: string[];
  careAreas: string[];
}
