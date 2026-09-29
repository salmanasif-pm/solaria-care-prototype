// 4.8 Medication Documentation - bounded: scheduled doses from the medication setup, four statuses.
// No drug database, interaction checking, pharmacy, e-prescribing or PRN enforcement.
import { useMemo, useState } from 'react';
import { useStore } from '../../store/store';
import { todaysCare } from '../../domain/care';
import { fmtTime, today } from '../../domain/time';
import { Badge, Choice, Empty, Field, Textarea } from '../../ui';
import { details, FormFrame, Section, useCareTime, useSave, type DocFormProps } from './common';

const STATUSES = ['Given', 'Held', 'Refused', 'Omitted'] as const;

export function MedicationForm({ client, item, onSaved, onCancel }: DocFormProps) {
  const { state } = useStore();
  const [careTime, setCareTime] = useCareTime();
  const doses = useMemo(() => todaysCare(state, client.id, today(), state.demoTime, { includeSchedule: false, includeMeds: true }), [state, client.id]);
  const [ref, setRef] = useState(item?.ref ?? doses.find((d) => d.status !== 'completed' && d.status !== 'not-done')?.ref ?? '');
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const dose = doses.find((d) => d.ref === ref) ?? item;
  const save = useSave(client, dose, onSaved);

  if (doses.length === 0 && !item) {
    return <Empty title="No medications scheduled today" hint="Medications are set up by an administrative user in the client's medication list." icon="pill" />;
  }

  const submit = () => {
    if (!dose?.med) return setError('Choose the scheduled dose.');
    if (!status) return setError('Choose Given, Held, Refused or Omitted.');
    if (status !== 'Given' && !note.trim()) return setError(`A note is required when a dose is ${status.toLowerCase()}.`);
    if (!careTime) return setError('Enter the administration time.');
    const m = dose.med;
    save('medication', careTime, {
      title: 'Medication',
      summary: `${m.name} ${m.dose} · ${m.route} · ${status}`,
      details: details([['Medication', `${m.name} ${m.dose}`], ['Route', m.route], ['Scheduled', fmtTime(dose.time)], ['Status', status], ['Note', note.trim()]]),
      data: { medId: m.id, status, note },
    });
  };

  return (
    <FormFrame clientId={client.id} item={undefined} careTime={careTime} setCareTime={setCareTime} onCancel={onCancel} onSubmit={submit} error={error} saveLabel="Record administration">
      <Section title="Scheduled dose">
        <div className="dose-list" role="radiogroup" aria-label="Scheduled dose">
          {doses.map((d) => (
            <button key={d.ref} type="button" role="radio" aria-checked={ref === d.ref} className={`dose ${ref === d.ref ? 'on' : ''}`} onClick={() => { setRef(d.ref); setError(undefined); }} disabled={d.status === 'completed'}>
              <span className="dose-time">{fmtTime(d.time)}</span>
              <span className="dose-name"><strong>{d.name}</strong><span className="small muted">{d.instructions}</span></span>
              {d.status === 'completed' ? <Badge tone="green" dot>{String(d.entry?.data.status ?? 'Documented')}</Badge> : d.status === 'overdue' ? <Badge tone="red" dot>Overdue</Badge> : d.status === 'due' ? <Badge tone="amber" dot>Due</Badge> : <Badge tone="outline">Upcoming</Badge>}
            </button>
          ))}
        </div>
      </Section>
      <Field label="Administration status" required>
        <Choice options={STATUSES} value={status} onChange={(v) => { setStatus(v); setError(undefined); }} allowClear={false} ariaLabel="Administration status" />
      </Field>
      <Field label={status && status !== 'Given' ? 'Reason / note' : 'Note'} required={!!status && status !== 'Given'}>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={status && status !== 'Given' ? `Why was the dose ${status.toLowerCase()}?` : 'Optional'} />
      </Field>
    </FormFrame>
  );
}
