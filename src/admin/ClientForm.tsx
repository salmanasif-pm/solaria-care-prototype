// 6.1 Create / edit client. Fields follow the supplied flow-sheet header; duplicate-client safeguard.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Client } from '../domain/types';
import { uid, useStore } from '../store/store';
import { clientName } from '../domain/care';
import { fmtDate, today } from '../domain/time';
import { Button, Callout, Card, Confirm, Field, Input, PageHead, Select, Textarea, useToast } from '../ui';

const blank = (location: string): Client => ({ id: '', firstName: '', lastName: '', dob: '', heightCm: null, weightKg: null, location, careArea: '', status: 'active', indicators: [], notes: '', createdAt: '', updatedAt: '' });

export function ClientForm() {
  const { id } = useParams();
  const { state, actions } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const existing = id ? state.clients.find((c) => c.id === id) : undefined;
  const isNew = !existing;
  const [c, setC] = useState<Client>(existing ? { ...existing } : blank(state.locations[0]));
  const [indicatorText, setIndicatorText] = useState((existing?.indicators ?? []).join(', '));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupe, setDupe] = useState<Client | null>(null);
  const set = <K extends keyof Client>(k: K, v: Client[K]) => { setC({ ...c, [k]: v }); setErrors((e) => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!c.firstName.trim()) e.firstName = 'Required';
    if (!c.lastName.trim()) e.lastName = 'Required';
    if (!c.dob) e.dob = 'Required'; else if (c.dob > today()) e.dob = 'Date of birth cannot be in the future';
    if (c.heightCm !== null && (c.heightCm < 30 || c.heightCm > 220)) e.heightCm = 'Enter a height between 30 and 220 cm';
    if (c.weightKg !== null && (c.weightKg < 1 || c.weightKg > 200)) e.weightKg = 'Enter a weight between 1 and 200 kg';
    if (!c.location) e.location = 'Required';
    if (!c.careArea) e.careArea = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const doSave = () => {
    const out: Client = { ...c, firstName: c.firstName.trim(), lastName: c.lastName.trim(), id: c.id || uid('c'), indicators: indicatorText.split(',').map((s) => s.trim()).filter(Boolean) };
    const savedId = actions.saveClient(out, isNew);
    toast(isNew ? `${clientName(out)} created - now visible to Care Staff in ${out.careArea}` : 'Client record updated');
    nav(`/admin/clients/${savedId}`);
  };
  const submit = () => {
    if (!validate()) return;
    const match = state.clients.find((x) => x.id !== c.id && x.dob === c.dob && x.firstName.trim().toLowerCase() === c.firstName.trim().toLowerCase() && x.lastName.trim().toLowerCase() === c.lastName.trim().toLowerCase());
    if (match) return setDupe(match);
    doSave();
  };
  const num = (v: string) => (v === '' ? null : Number(v));

  return (
    <div className="page narrow-wide">
      <PageHead title={isNew ? 'New client' : `Edit ${clientName(existing!)}`} crumbs={[{ to: '/admin/clients', label: 'Clients' }, ...(existing ? [{ to: `/admin/clients/${existing.id}`, label: clientName(existing) }] : []), { label: isNew ? 'New' : 'Edit' }]}
        actions={isNew ? <Button variant="ghost" size="sm" onClick={() => { setC({ ...c, firstName: 'Olivia', lastName: 'Grant', dob: `${new Date().getFullYear() - 4}-05-18`, heightCm: 101, weightKg: 15.2, location: 'North Center', careArea: 'Pediatric Area' }); setIndicatorText('Asthma - inhaler in bag'); setErrors({}); }}>Fill sample client</Button> : undefined} />
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate data-tour="client-form">
        <Card title="Client / patient" sub="Baseline fields from the flow-sheet header. Further fields are confirmed with Solaria before build.">
          <div className="grid-2">
            <Field label="First name" required error={errors.firstName}><Input value={c.firstName} onChange={(e) => set('firstName', e.target.value)} invalid={!!errors.firstName} /></Field>
            <Field label="Last name" required error={errors.lastName}><Input value={c.lastName} onChange={(e) => set('lastName', e.target.value)} invalid={!!errors.lastName} /></Field>
            <Field label="Date of birth" required error={errors.dob}><Input type="date" value={c.dob} max={today()} onChange={(e) => set('dob', e.target.value)} invalid={!!errors.dob} /></Field>
            <div className="grid-2">
              <Field label="Height (cm)" error={errors.heightCm}><Input inputMode="decimal" value={c.heightCm ?? ''} onChange={(e) => set('heightCm', num(e.target.value))} invalid={!!errors.heightCm} /></Field>
              <Field label="Weight (kg)" error={errors.weightKg}><Input inputMode="decimal" value={c.weightKg ?? ''} onChange={(e) => set('weightKg', num(e.target.value))} invalid={!!errors.weightKg} /></Field>
            </div>
            <Field label="Location" required error={errors.location}>
              <Select value={c.location} onChange={(e) => set('location', e.target.value)} invalid={!!errors.location}>{state.locations.map((l) => <option key={l}>{l}</option>)}</Select>
            </Field>
            <Field label="Care area" required error={errors.careArea} help="Controls which Care Staff can see this client">
              <Select value={c.careArea} onChange={(e) => set('careArea', e.target.value)} invalid={!!errors.careArea}><option value="">Choose…</option>{state.careAreas.map((a) => <option key={a}>{a}</option>)}</Select>
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Indicators / precautions" help="Comma-separated, shown to Care Staff. Device indicators come from the device record."><Input value={indicatorText} onChange={(e) => setIndicatorText(e.target.value)} placeholder="e.g. Latex allergy, Seizure precautions" /></Field>
            {!isNew && <Field label="Status"><Select value={c.status} onChange={(e) => set('status', e.target.value as Client['status'])}><option value="active">Active</option><option value="inactive">Inactive (hidden from Care Staff)</option></Select></Field>}
          </div>
          <Field label="Operational notes"><Textarea rows={3} value={c.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Short notes Care Staff should see" /></Field>
          {Object.values(errors).some(Boolean) && <Callout tone="danger">Check the highlighted fields.</Callout>}
        </Card>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => nav(existing ? `/admin/clients/${existing.id}` : '/admin/clients')}>Cancel</Button>
          <Button type="submit" variant="primary" icon="check">{isNew ? 'Create client' : 'Save changes'}</Button>
        </div>
      </form>
      {dupe && (
        <Confirm title="Possible duplicate client" confirmLabel="Save anyway" onCancel={() => setDupe(null)} onConfirm={() => { setDupe(null); doSave(); }}>
          <Callout tone="warn">{clientName(dupe)} with the same date of birth ({fmtDate(dupe.dob)}) already exists at {dupe.location} · {dupe.careArea}{dupe.status === 'inactive' ? ' (inactive)' : ''}.</Callout>
          <Button variant="ghost" onClick={() => nav(`/admin/clients/${dupe.id}`)}>Open existing record instead</Button>
        </Confirm>
      )}
    </div>
  );
}
