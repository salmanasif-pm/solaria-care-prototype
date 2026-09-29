// 4.8 Medication setup (single source for scheduled doses). Deliberately bounded: name, dose, route, schedule.
import { useState } from 'react';
import type { Client, MedicationOrder } from '../domain/types';
import { uid, useStore } from '../store/store';
import { daysLabel, fmtStamp, fmtTime, WEEKDAYS } from '../domain/time';
import { Badge, Button, Callout, Card, Empty, Field, Input, Modal, Select, Textarea, Toggle, useToast } from '../ui';
import { DaysPicker } from './DaysPicker';

const ROUTES = ['G-tube', 'NG', 'PO', 'Inhalation (via trach)', 'Inhalation (nebulizer)', 'Topical', 'Other'];

export function MedicationEditor({ client }: { client: Client }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<MedicationOrder | null>(null);
  const [isNew, setIsNew] = useState(false);
  const meds = state.medications.filter((m) => m.clientId === client.id).sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  const name = (id: string) => state.staff.find((s) => s.id === id)?.name ?? 'System';

  return (
    <>
      <Callout tone="neutral" icon="info">Documentation support only: no drug database, interaction checking, pharmacy integration, e-prescribing or PRN enforcement.</Callout>
      <Card title="Medications" sub="Scheduled doses appear in Care Staff Today's Care and are documented as Given, Held, Refused or Omitted." pad={false}
        actions={<Button variant="primary" icon="plus" onClick={() => { setIsNew(true); setEditing({ id: uid('m'), clientId: client.id, name: '', dose: '', route: 'PO', times: ['12:00'], days: [...WEEKDAYS], instructions: '', active: true, history: [] }); }}>Add medication</Button>}>
        {meds.length === 0 ? <Empty title="No medications" icon="pill" /> : (
          <table className="table" data-tour="med-table">
            <thead><tr><th>Medication</th><th>Dose</th><th>Route</th><th>Schedule</th><th>Status</th><th>Last change</th><th /></tr></thead>
            <tbody>
              {meds.map((m) => {
                const last = m.history[m.history.length - 1];
                return (
                  <tr key={m.id} className={m.active ? '' : 'inactive'}>
                    <td><strong>{m.name}</strong>{m.instructions && <div className="small muted">{m.instructions}</div>}</td>
                    <td>{m.dose}</td>
                    <td>{m.route}</td>
                    <td className="small">{m.times.map(fmtTime).join(', ')}<div className="muted">{daysLabel(m.days)}</div></td>
                    <td>{m.active ? <Badge tone="green" dot>Active</Badge> : <Badge tone="neutral">Discontinued</Badge>}</td>
                    <td className="small muted">{last ? `${last.text} · ${name(last.by)} · ${fmtStamp(last.at)}` : '—'}</td>
                    <td className="right nowrap">
                      <Button size="sm" variant="ghost" icon="edit" onClick={() => { setIsNew(false); setEditing({ ...m, times: [...m.times], days: [...m.days] }); }}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => { actions.setMedicationActive(m.id, !m.active); toast(m.active ? 'Medication discontinued' : 'Medication reactivated', 'info'); }}>{m.active ? 'Discontinue' : 'Reactivate'}</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      {editing && <MedModal med={editing} isNew={isNew} onClose={() => setEditing(null)} onSave={(m) => { actions.saveMedication(m, isNew); setEditing(null); toast(isNew ? `${m.name} added to ${client.firstName}'s schedule` : 'Medication updated'); }} />}
    </>
  );
}

function MedModal({ med, isNew, onClose, onSave }: { med: MedicationOrder; isNew: boolean; onClose: () => void; onSave: (m: MedicationOrder) => void }) {
  const [m, setM] = useState(med);
  const [error, setError] = useState<string>();
  const set = <K extends keyof MedicationOrder>(k: K, v: MedicationOrder[K]) => { setM({ ...m, [k]: v }); setError(undefined); };
  const save = () => {
    if (!m.name.trim()) return setError('Enter the medication name.');
    if (!m.dose.trim()) return setError('Enter the dose.');
    const times = m.times.filter(Boolean);
    if (!times.length) return setError('Add at least one scheduled time.');
    if (!m.days.length) return setError('Choose at least one day.');
    onSave({ ...m, name: m.name.trim(), dose: m.dose.trim(), times: [...new Set(times)].sort() });
  };
  return (
    <Modal title={isNew ? 'Add medication' : 'Edit medication'} onClose={onClose} width={620}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{isNew ? 'Add medication' : 'Save changes'}</Button></>}>
      <div className="stack">
        <div className="grid-3">
          <Field label="Medication" required><Input value={m.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
          <Field label="Dose" required><Input value={m.dose} onChange={(e) => set('dose', e.target.value)} placeholder="e.g. 5 mg" /></Field>
          <Field label="Route" required><Select value={m.route} onChange={(e) => set('route', e.target.value)}>{ROUTES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
        </div>
        <Field label="Scheduled times" required>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {m.times.map((t, i) => (
              <span key={i} className="row" style={{ gap: 4 }}>
                <Input type="time" value={t} onChange={(e) => set('times', m.times.map((x, j) => (j === i ? e.target.value : x)))} style={{ width: 130 }} />
                {m.times.length > 1 && <Button size="sm" variant="ghost" icon="x" aria-label="Remove time" onClick={() => set('times', m.times.filter((_, j) => j !== i))} />}
              </span>
            ))}
            <Button size="sm" variant="ghost" icon="plus" onClick={() => set('times', [...m.times, '15:00'])}>Add time</Button>
          </div>
        </Field>
        <Field label="Days" required><DaysPicker value={m.days} onChange={(v) => set('days', v)} /></Field>
        <Field label="Instructions"><Textarea rows={2} value={m.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="e.g. Give 30 min before lunch" /></Field>
        <Toggle checked={m.active} onChange={(v) => set('active', v)} label="Active" />
        {error && <Callout tone="danger">{error}</Callout>}
      </div>
    </Modal>
  );
}
