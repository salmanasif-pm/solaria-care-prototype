// 4.2 Record Time-Based Observations and Care. Append-only; multiple entries per hour are fine.
import { useState } from 'react';
import { Check, Choice, Field, Input, Textarea } from '../../ui';
import { details, FormFrame, Section, useCareTime, useSave, type DocFormProps } from './common';

const COLORS = ['Pink', 'Pale', 'Flushed', 'Mottled', 'Dusky', 'Cyanotic'] as const;
const AEROSOL = ['None', 'Aerosol treatment', 'CPT', 'Aerosol + CPT'] as const;
const SUCTION = ['None', 'Oral', 'Nasal', 'Trach'] as const;
const SECRETIONS = ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged'] as const;
const AMOUNTS = ['Small', 'Moderate', 'Large'] as const;
const POSITIONS = ['Supine', 'Prone', 'Left side', 'Right side', 'Seated', 'Upright 30°+'] as const;

const RANGES: Record<string, [number, number, string]> = {
  temperature: [90, 108, 'Temperature must be between 90 and 108 °F.'],
  heartRate: [30, 250, 'Heart rate must be between 30 and 250 bpm.'],
  respRate: [5, 100, 'Respiratory rate must be between 5 and 100 /min.'],
  spo2: [50, 100, 'Oxygen saturation must be between 50 and 100%.'],
};

export function ObservationsForm({ client, item, onSaved, onCancel }: DocFormProps) {
  const [careTime, setCareTime] = useCareTime();
  const [v, setV] = useState({ temperature: '', heartRate: '', respRate: '', spo2: '' });
  const [color, setColor] = useState('');
  const [o2Mode, setO2Mode] = useState<'Room air' | 'Supplemental O₂' | ''>('');
  const [o2Pct, setO2Pct] = useState('');
  const [o2Flow, setO2Flow] = useState('');
  const [aerosol, setAerosol] = useState('');
  const [suction, setSuction] = useState('');
  const [secretions, setSecretions] = useState('');
  const [secAmount, setSecAmount] = useState('');
  const [position, setPosition] = useState('');
  const [rom, setRom] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const save = useSave(client, item, onSaved);
  const hasTrach = client.indicators.some((i) => /trach/i.test(i)) || item?.name.toLowerCase().includes('suction');

  const submit = () => {
    for (const [k, [lo, hi, msg]] of Object.entries(RANGES)) {
      const raw = v[k as keyof typeof v];
      if (raw === '') continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < lo || n > hi) return setError(msg);
    }
    const oxygen = o2Mode === 'Supplemental O₂' ? `${o2Pct ? o2Pct + '%' : ''}${o2Pct && o2Flow ? ' · ' : ''}${o2Flow ? o2Flow + ' L/min' : ''}` || 'Supplemental' : o2Mode;
    const suctionText = suction && suction !== 'None' ? [suction, secretions, secAmount].filter(Boolean).join(' · ') : '';
    const positionText = [position, rom ? 'ROM completed' : ''].filter(Boolean).join(' · ');
    const rows = details([
      ['Temperature', v.temperature && `${v.temperature} °F`],
      ['Heart rate', v.heartRate && `${v.heartRate} bpm`],
      ['Respiratory rate', v.respRate && `${v.respRate} /min`],
      ['Color', color],
      ['Oxygen % / liter flow', oxygen],
      ['Oxygen saturation', v.spo2 && `${v.spo2}%`],
      ['Aerosol treatment / CPT', aerosol !== 'None' ? aerosol : ''],
      ['Suction', suctionText],
      ['Position change / ROM', positionText],
      ['Notes', notes.trim()],
    ]);
    if (!careTime) return setError('Enter the care time.');
    if (rows.length === 0) return setError('Record at least one observation or care item.');
    const vit = [v.temperature && `T ${v.temperature}°F`, v.heartRate && `HR ${v.heartRate}`, v.respRate && `RR ${v.respRate}`, v.spo2 && `SpO₂ ${v.spo2}%`].filter(Boolean).join(' · ');
    const care = [aerosol && aerosol !== 'None' && aerosol, suctionText && `Suction ${suction.toLowerCase()}`, positionText && `Position: ${positionText}`].filter(Boolean).join(' · ');
    save('observations', careTime, {
      title: 'Observations',
      summary: [vit, care].filter(Boolean).join(' · ') || rows.map((r) => r[1]).join(' · '),
      details: rows,
      data: { ...v, color, oxygen, aerosol, suction: suctionText, position: positionText },
    });
  };
  const num = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); setError(undefined); };

  return (
    <FormFrame clientId={client.id} item={item} careTime={careTime} setCareTime={setCareTime} onCancel={onCancel} onSubmit={submit} error={error}>
      <Section title="Vital signs">
        <div className="grid-4">
          <Field label="Temperature (°F)"><Input inputMode="decimal" value={v.temperature} onChange={num('temperature')} placeholder="98.6" /></Field>
          <Field label="Heart rate (bpm)"><Input inputMode="numeric" value={v.heartRate} onChange={num('heartRate')} placeholder="—" /></Field>
          <Field label="Respiratory rate"><Input inputMode="numeric" value={v.respRate} onChange={num('respRate')} placeholder="/min" /></Field>
          <Field label="Oxygen saturation (%)"><Input inputMode="numeric" value={v.spo2} onChange={num('spo2')} placeholder="—" /></Field>
        </div>
        <Field label="Color"><Choice size="sm" options={COLORS} value={color} onChange={setColor} /></Field>
        <Field label="Oxygen">
          <Choice size="sm" options={['Room air', 'Supplemental O₂'] as const} value={o2Mode} onChange={(x) => setO2Mode(x)} />
        </Field>
        {o2Mode === 'Supplemental O₂' && (
          <div className="grid-4">
            <Field label="Oxygen %"><Input inputMode="numeric" value={o2Pct} onChange={(e) => setO2Pct(e.target.value)} placeholder="28" /></Field>
            <Field label="Liter flow (L/min)"><Input inputMode="decimal" value={o2Flow} onChange={(e) => setO2Flow(e.target.value)} placeholder="5" /></Field>
          </div>
        )}
      </Section>
      <Section title="Nursing care">
        <Field label="Aerosol treatment / CPT"><Choice size="sm" options={AEROSOL} value={aerosol} onChange={setAerosol} /></Field>
        <Field label="Suction" help={hasTrach ? 'Trach details come from the device record; no need to re-enter type or size.' : undefined}>
          <Choice size="sm" options={SUCTION} value={suction} onChange={setSuction} />
        </Field>
        {suction && suction !== 'None' && (
          <div className="grid-2">
            <Field label="Secretions"><Choice size="sm" options={SECRETIONS} value={secretions} onChange={setSecretions} /></Field>
            <Field label="Amount"><Choice size="sm" options={AMOUNTS} value={secAmount} onChange={setSecAmount} /></Field>
          </div>
        )}
        <Field label="Position change"><Choice size="sm" options={POSITIONS} value={position} onChange={setPosition} /></Field>
        <Check label="Range of motion (ROM) completed" checked={rom} onChange={setRom} />
      </Section>
      <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>
    </FormFrame>
  );
}
