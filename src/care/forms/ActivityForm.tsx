// 4.5 Record Care Activities - the leanest documentation path. Works with every other module removed.
import { useState } from 'react';
import { Choice, Field, Textarea } from '../../ui';
import { details, FormFrame, Section, useCareTime, useSave, type DocFormProps } from './common';

export const ACTIVITIES = ['Toileting', 'Diaper / Brief Change', 'Enrichment', 'Outdoor Activity'] as const;
const WITH_OUTPUT = ['Toileting', 'Diaper / Brief Change'];
const URINE = ['None', 'Voided', 'Wet - small', 'Wet - moderate', 'Wet - large'] as const;
const STOOL = ['None', 'Soft, formed', 'Loose', 'Hard', 'Large'] as const;
const EMESIS = ['None', 'Small', 'Moderate', 'Large'] as const;

function matchActivity(name?: string): string {
  if (!name) return '';
  const n = name.toLowerCase();
  if (n.includes('toilet')) return 'Toileting';
  if (n.includes('diaper') || n.includes('brief')) return 'Diaper / Brief Change';
  if (n.includes('outdoor')) return 'Outdoor Activity';
  if (n.includes('enrich')) return 'Enrichment';
  return name; // a scheduled item whose own form is out of scope falls back here, keeping its name
}

export function ActivityForm({ client, item, onSaved, onCancel }: DocFormProps) {
  const [careTime, setCareTime] = useCareTime();
  const initial = matchActivity(item?.name);
  const [activity, setActivity] = useState<string>(initial);
  const [notes, setNotes] = useState('');
  const [urine, setUrine] = useState('');
  const [stool, setStool] = useState('');
  const [emesis, setEmesis] = useState('');
  const [error, setError] = useState<string>();
  const save = useSave(client, item, onSaved);
  const options = (ACTIVITIES as readonly string[]).includes(initial) || !initial ? [...ACTIVITIES] : [initial, ...ACTIVITIES];
  const showOutput = WITH_OUTPUT.includes(activity);

  const submit = () => {
    if (!activity) return setError('Choose the care activity.');
    if (!careTime) return setError('Enter the care time.');
    const out = showOutput ? { urine: urine && urine !== 'None' ? urine : undefined, stool: stool && stool !== 'None' ? stool : undefined, emesis: emesis && emesis !== 'None' ? emesis : undefined } : undefined;
    const outText = out ? Object.entries(out).filter(([, v]) => v).map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`).join(' · ') : '';
    save('activity', careTime, {
      title: activity,
      summary: [notes.trim(), outText].filter(Boolean).join(' · ') || 'Completed',
      details: details([['Activity', activity], ['Notes', notes.trim()], ['Output', outText]]),
      data: { activity, notes },
      output: out && (out.urine || out.stool || out.emesis) ? out : undefined,
    });
  };

  return (
    <FormFrame clientId={client.id} item={item} careTime={careTime} setCareTime={setCareTime} onCancel={onCancel} onSubmit={submit} error={error}>
      <Field label="Activity" required>
        <Choice options={options} value={activity} onChange={(v) => { setActivity(v); setError(undefined); }} allowClear={false} ariaLabel="Activity" />
      </Field>
      {showOutput && (
        <Section title="Output (optional)" hint="Recorded once here and counted in today's Intake & Output - no second entry needed.">
          <div className="grid-3">
            <Field label="Urine"><Choice size="sm" options={URINE} value={urine} onChange={setUrine} /></Field>
            <Field label="Stool"><Choice size="sm" options={STOOL} value={stool} onChange={setStool} /></Field>
            <Field label="Emesis"><Choice size="sm" options={EMESIS} value={emesis} onChange={setEmesis} /></Field>
          </div>
        </Section>
      )}
      <Field label="Notes / details">
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional - e.g. skin intact, tolerated well, 20 min on patio" />
      </Field>
    </FormFrame>
  );
}
