// 4.3 Record Intake and Output. Output captured during toileting / brief change is reused, not re-entered.
import { useState } from 'react';
import { Choice, Field, Input, Textarea } from '../../ui';
import { details, FormFrame, Section, useCareTime, useSave, type DocFormProps } from './common';

const ROUTES = ['G-tube', 'NG', 'PO'] as const;
const TYPES = ['Formula', 'Water flush', 'Milk', 'Juice', 'Solids', 'Other'] as const;
const URINE = ['None', 'Voided', 'Wet - small', 'Wet - moderate', 'Wet - large'] as const;
const STOOL = ['None', 'Soft, formed', 'Loose', 'Hard', 'Large'] as const;
const EMESIS = ['None', 'Small', 'Moderate', 'Large'] as const;

export function IntakeOutputForm({ client, item, onSaved, onCancel }: DocFormProps) {
  const [careTime, setCareTime] = useCareTime();
  const feedingItem = item && /feed|snack|lunch|intake/i.test(item.name);
  const gtube = /g-tube|npo/i.test(client.indicators.join(' ') + (item?.instructions ?? ''));
  const [direction, setDirection] = useState<'intake' | 'output'>('intake');
  const [type, setType] = useState(feedingItem && gtube ? 'Formula' : '');
  const [typeDetail, setTypeDetail] = useState(feedingItem && gtube ? 'PediaSure 1.0' : '');
  const [amount, setAmount] = useState('');
  const [route, setRoute] = useState(gtube ? 'G-tube' : feedingItem ? 'PO' : '');
  const [urine, setUrine] = useState('');
  const [stool, setStool] = useState('');
  const [emesis, setEmesis] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const save = useSave(client, item, onSaved);

  const submit = () => {
    if (!careTime) return setError('Enter the care time.');
    if (direction === 'intake') {
      if (!type) return setError('Choose the intake type.');
      const ml = Number(amount);
      if (!amount || !Number.isFinite(ml) || ml <= 0 || ml > 2000) return setError('Enter the amount in mL (1-2000).');
      if (!route) return setError('Choose the route: G-tube, NG or PO.');
      const label = typeDetail.trim() || type;
      save('intakeOutput', careTime, {
        title: 'Intake',
        summary: `${ml} mL ${label} via ${route}`,
        details: details([['Type', label], ['Amount', `${ml} mL`], ['Route', route], ['Notes', notes.trim()]]),
        data: { direction: 'intake', type: label, amount: String(ml), route, notes },
      });
    } else {
      const u = urine !== 'None' ? urine : '';
      const s = stool !== 'None' ? stool : '';
      const e = emesis !== 'None' ? emesis : '';
      if (!urine && !stool && !emesis) return setError('Record at least one of urine, stool or emesis (choose None if not applicable).');
      save('intakeOutput', careTime, {
        title: 'Output',
        summary: [u && `Urine: ${u}`, s && `Stool: ${s}`, e && `Emesis: ${e}`].filter(Boolean).join(' · ') || 'No output',
        details: details([['Urine', urine], ['Stool', stool], ['Emesis', emesis], ['Notes', notes.trim()]]),
        data: { direction: 'output', urine: u, stool: s, emesis: e, notes },
      });
    }
  };

  return (
    <FormFrame clientId={client.id} item={item} careTime={careTime} setCareTime={setCareTime} onCancel={onCancel} onSubmit={submit} error={error}>
      <Choice options={[{ key: 'intake', label: 'Intake' }, { key: 'output', label: 'Output' }]} value={direction} onChange={(v) => v && setDirection(v)} allowClear={false} ariaLabel="Intake or output" />
      {direction === 'intake' ? (
        <Section title="Intake">
          <Field label="Type" required><Choice size="sm" options={TYPES} value={type} onChange={(v) => { setType(v); setError(undefined); }} allowClear={false} /></Field>
          <div className="grid-2">
            <Field label="Description" help="e.g. formula name"><Input value={typeDetail} onChange={(e) => setTypeDetail(e.target.value)} placeholder="Optional" /></Field>
            <Field label="Amount (mL)" required><Input inputMode="numeric" value={amount} onChange={(e) => { setAmount(e.target.value); setError(undefined); }} placeholder="120" /></Field>
          </div>
          <Field label="Route" required><Choice options={ROUTES} value={route} onChange={setRoute} allowClear={false} /></Field>
        </Section>
      ) : (
        <Section title="Output" hint="Toileting and brief-change entries already count here. Use this for output not captured there.">
          <div className="grid-3">
            <Field label="Urine"><Choice size="sm" options={URINE} value={urine} onChange={setUrine} /></Field>
            <Field label="Stool"><Choice size="sm" options={STOOL} value={stool} onChange={setStool} /></Field>
            <Field label="Emesis"><Choice size="sm" options={EMESIS} value={emesis} onChange={setEmesis} /></Field>
          </div>
        </Section>
      )}
      <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>
    </FormFrame>
  );
}
