// Module manifest: which documentation types, navigation items and admin client tabs exist, and which
// registry feature owns each. Shells and pickers render from these lists only.
// Removing a capability = delete its folder/file and its line(s) here. Nothing else imports the forms.
import type { ComponentType } from 'react';
import type { DocKind } from '../domain/types';
import type { IconName } from '../ui';
import type { FeatureId } from './registry';
import type { DocFormProps } from '../care/forms/common';
import { ActivityForm } from '../care/forms/ActivityForm';
import { ObservationsForm } from '../care/forms/ObservationsForm';
import { IntakeOutputForm } from '../care/forms/IntakeOutputForm';
import { AssessmentForm } from '../care/forms/AssessmentForm';
import { MedicationForm } from '../care/forms/MedicationForm';
import { SpecializedCareForm } from '../care/forms/SpecializedCareForm';

export interface DocModule {
  kind: Exclude<DocKind, 'note'>;
  feature: FeatureId;
  label: string;
  blurb: string;
  icon: IconName;
  Form: ComponentType<DocFormProps>;
}

/** Order = order in the "Add documentation" picker. */
export const DOC_MODULES: DocModule[] = [
  { kind: 'activity', feature: 'activities', label: 'Care Activity', blurb: 'Toileting, brief change, enrichment, outdoor', icon: 'hand', Form: ActivityForm },
  { kind: 'observations', feature: 'observations', label: 'Observations / Vitals', blurb: 'Temp, HR, RR, color, O₂, SpO₂, CPT, suction, position', icon: 'heart', Form: ObservationsForm },
  { kind: 'intakeOutput', feature: 'intakeOutput', label: 'Intake & Output', blurb: 'Type, amount, route · urine, stool, emesis', icon: 'droplet', Form: IntakeOutputForm },
  { kind: 'assessment', feature: 'assessments', label: 'Assessment', blurb: 'Pain, neuro, respiratory, skin, GI and more', icon: 'steth', Form: AssessmentForm },
  { kind: 'medication', feature: 'medications', label: 'Medication', blurb: 'Given, held, refused or omitted', icon: 'pill', Form: MedicationForm },
  { kind: 'specializedCare', feature: 'specializedCare', label: 'Specialized Care', blurb: 'Feeding tube / tracheostomy site care', icon: 'tube', Form: SpecializedCareForm },
];

/** The lean fallback: when a scheduled item's own form is out of scope it is documented as a care activity. */
export const FALLBACK_KIND: DocModule['kind'] = 'activity';

export interface NavItem { to: string; label: string; icon: IconName; feature?: FeatureId; match?: string }

export const CARE_NAV: NavItem[] = [
  { to: '/care/clients', label: 'Clients', icon: 'users', match: '/care/clients' },
  { to: '/care/today', label: "Today's Care", icon: 'clipboard', feature: 'careSchedule' },
  { to: '/care/records', label: 'Records', icon: 'file', feature: 'history' },
];

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin/clients', label: 'Clients', icon: 'users', feature: 'clientManagement', match: '/admin/clients' },
  { to: '/admin/schedule', label: 'Care Instructions & Schedule', icon: 'calendar', feature: 'scheduleManagement' },
  { to: '/admin/staff', label: 'Staff', icon: 'user', feature: 'staffManagement' },
  { to: '/admin/audit', label: 'Audit Trail', icon: 'shield', feature: 'auditTrail' },
];

export interface ClientTab { path: string; label: string; feature?: FeatureId; features?: FeatureId[] }
export const ADMIN_CLIENT_TABS: ClientTab[] = [
  { path: '', label: 'Overview' },
  { path: 'care-schedule', label: 'Care Schedule', feature: 'scheduleManagement' },
  { path: 'medications', label: 'Medications', feature: 'medications' },
  { path: 'devices', label: 'Devices', feature: 'specializedCare' },
  { path: 'authorizations', label: 'Authorization Periods', feature: 'authorizationHistory' },
];
