// 4.4 Record Assessments. Fixed Solaria sections (from the supplied flow sheet) in accordions.
// This is intentionally NOT a dynamic form builder: sections are plain configuration in this file.
import { useMemo, useState } from 'react';
import { useStore } from '../../store/store';
import { useFeature } from '../../features/FeatureContext';
import { Badge, Button, Choice, Field, Icon, Textarea } from '../../ui';
import { FormFrame, useCareTime, useSave, type DocFormProps } from './common';

type Q = { key: string; label: string; options: string[]; when?: 'trach' | 'gtube' | 'infant' };
type SectionDef = { key: string; title: string; normal: Record<string, string>; questions: Q[]; note?: string };

const SECTIONS: SectionDef[] = [
  { key: 'covid', title: 'COVID-19 Precautions', note: 'Kept from the supplied flow sheet; easy to remove if nursing leadership confirms it is obsolete.',
    normal: { precautions: 'No' }, questions: [{ key: 'precautions', label: 'COVID-19 precautions in place', options: ['Yes', 'No'] }] },
  { key: 'pain', title: 'Pain', normal: { present: 'No', scale: '0-10 numeric', score: '0' },
    questions: [
      { key: 'present', label: 'Pain present', options: ['Yes', 'No'] },
      { key: 'scale', label: 'Scale used', options: ['0-10 numeric', 'FACES'] },
      { key: 'score', label: 'Score', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    ] },
  { key: 'neuro', title: 'Neurological', normal: { loc: 'Alert', tone: 'Normal / baseline', reflexes: 'Present' },
    questions: [
      { key: 'loc', label: 'Level of consciousness', options: ['Alert', 'Sleeping', 'Lethargic', 'Irritable', 'Unresponsive'] },
      { key: 'tone', label: 'Tone', options: ['Normal / baseline', 'Hypotonic', 'Hypertonic', 'Spastic'] },
      { key: 'fontanel', label: 'Fontanel', options: ['Flat / soft', 'Bulging', 'Sunken', 'Closed'], when: 'infant' },
      { key: 'reflexes', label: 'Reflexes', options: ['Present', 'Diminished', 'Absent'] },
    ] },
  { key: 'resp', title: 'Respiratory', normal: { effort: 'Unlabored', flaring: 'None', lungs: 'Clear', cough: 'None', secretions: 'None' },
    questions: [
      { key: 'effort', label: 'Effort', options: ['Unlabored', 'Labored', 'Tachypneic', 'Shallow'] },
      { key: 'flaring', label: 'Flaring / retractions', options: ['None', 'Nasal flaring', 'Mild retractions', 'Moderate retractions', 'Severe retractions'] },
      { key: 'lungs', label: 'Lung sounds', options: ['Clear', 'Diminished', 'Crackles', 'Wheezes', 'Rhonchi'] },
      { key: 'cough', label: 'Cough', options: ['None', 'Productive', 'Non-productive'] },
      { key: 'secretions', label: 'Secretions', options: ['None', 'Clear', 'White', 'Yellow', 'Green'] },
      { key: 'trach', label: 'Tracheostomy findings', options: ['Stoma clean / dry', 'Redness', 'Drainage', 'Granulation', 'Ties secure'], when: 'trach' },
    ] },
  { key: 'ent', title: 'Head / ENT', normal: { face: 'Symmetric', ears: 'Clear', eyes: 'Clear', nose: 'Clear', mouth: 'Moist / pink', oral: 'Oral care done' },
    questions: [
      { key: 'face', label: 'Face', options: ['Symmetric', 'Asymmetric', 'Edema'] },
      { key: 'ears', label: 'Ears', options: ['Clear', 'Drainage', 'Redness'] },
      { key: 'eyes', label: 'Eyes', options: ['Clear', 'Drainage', 'Redness', 'Swelling'] },
      { key: 'nose', label: 'Nose', options: ['Clear', 'Congested', 'Drainage'] },
      { key: 'mouth', label: 'Mouth', options: ['Moist / pink', 'Dry', 'Lesions', 'Thrush'] },
      { key: 'oral', label: 'Oral care', options: ['Oral care done', 'Not done'] },
    ] },
  { key: 'skeletal', title: 'Skeletal', normal: { rom: 'Full ROM' },
    questions: [
      { key: 'rom', label: 'Range of motion', options: ['Full ROM', 'Limited', 'Contractures'] },
      { key: 'afo', label: 'AFO status', options: ['Not applicable', 'On', 'Off', 'Skin intact after removal', 'Redness after removal'] },
    ] },
  { key: 'skin', title: 'Skin', normal: { condition: 'Intact', color: 'Pink', temp: 'Warm / dry', capRefill: '< 3 seconds', edema: 'None' },
    questions: [
      { key: 'condition', label: 'Condition', options: ['Intact', 'Rash', 'Breakdown', 'Bruising', 'Dry'] },
      { key: 'color', label: 'Color', options: ['Pink', 'Pale', 'Flushed', 'Mottled', 'Jaundiced'] },
      { key: 'temp', label: 'Temperature / moisture', options: ['Warm / dry', 'Cool', 'Hot', 'Diaphoretic'] },
      { key: 'capRefill', label: 'Perfusion / capillary refill', options: ['< 3 seconds', '> 3 seconds'] },
      { key: 'edema', label: 'Edema', options: ['None', 'Present'] },
    ] },
  { key: 'gi', title: 'Gastrointestinal', normal: { abdomen: 'Soft / non-tender', bowel: 'Present', stool: 'No stool yet today' },
    questions: [
      { key: 'abdomen', label: 'Abdomen', options: ['Soft / non-tender', 'Distended', 'Firm', 'Tender'] },
      { key: 'bowel', label: 'Bowel sounds', options: ['Present', 'Hypoactive', 'Hyperactive', 'Absent'] },
      { key: 'stool', label: 'Stool', options: ['Stool today', 'No stool yet today', 'Loose', 'Constipated'] },
      { key: 'tube', label: 'Feeding-tube findings', options: ['Site clean / dry', 'Redness', 'Leakage', 'Granulation', 'Tolerating feeds'], when: 'gtube' },
    ] },
  { key: 'cv', title: 'Cardiovascular', normal: { tones: 'Regular', pulses: 'Strong / equal' },
    questions: [
      { key: 'tones', label: 'Heart tones', options: ['Regular', 'Irregular', 'Murmur'] },
      { key: 'pulses', label: 'Peripheral pulses', options: ['Strong / equal', 'Weak', 'Absent', 'Unequal'] },
    ] },
  { key: 'gu', title: 'Genitourinary', normal: { status: 'Voiding / wet diapers', discharge: 'None' },
    questions: [
      { key: 'status', label: 'Status', options: ['Voiding / wet diapers', 'Decreased output', 'Catheter'] },
      { key: 'discharge', label: 'Discharge', options: ['None', 'Present'] },
      { key: 'continence', label: 'Toilet-trained / incontinence', options: ['Toilet-trained', 'In training', 'Incontinent - diapers / briefs'] },
    ] },
];

export function AssessmentForm({ client, item, onSaved, onCancel }: DocFormProps) {
  const { state } = useStore();
  const [careTime, setCareTime] = useCareTime();
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(item?.name.toLowerCase().includes('respiratory') ? 'resp' : 'pain');
  const [error, setError] = useState<string>();
  const save = useSave(client, item, onSaved);

  // Device-specific questions derive from the device record, so they follow the device module's scope.
  const devicesOn = useFeature('specializedCare');
  const devices = devicesOn ? state.devices.filter((d) => d.clientId === client.id && d.active) : [];
  const trach = devices.find((d) => d.type === 'Tracheostomy');
  const gtube = devices.find((d) => d.type === 'G-tube' || d.type === 'NG tube');
  const ageMonths = useMemo(() => { const b = new Date(client.dob); const t = new Date(); return (t.getFullYear() - b.getFullYear()) * 12 + t.getMonth() - b.getMonth(); }, [client.dob]);
  const visible = (q: Q) => !q.when || (q.when === 'trach' && trach) || (q.when === 'gtube' && gtube) || (q.when === 'infant' && ageMonths < 24);

  const setQ = (s: string, q: string, v: string) => { setValues((all) => ({ ...all, [s]: { ...(all[s] ?? {}), [q]: v } })); setError(undefined); };
  const markNormal = (s: SectionDef) => setValues((all) => ({ ...all, [s.key]: { ...s.normal, ...(all[s.key] ?? {}) } }));
  const documented = SECTIONS.filter((s) => Object.values(values[s.key] ?? {}).some(Boolean) || notes[s.key]?.trim());

  const submit = () => {
    if (!careTime) return setError('Enter the care time.');
    if (documented.length === 0) return setError('Document at least one assessment section.');
    const rows: [string, string][] = [['Sections', documented.map((s) => s.title).join(', ')]];
    for (const s of documented) {
      const parts = s.questions.filter(visible).map((q) => values[s.key]?.[q.key] && `${q.label}: ${values[s.key][q.key]}`).filter(Boolean);
      if (notes[s.key]?.trim()) parts.push(`Note: ${notes[s.key].trim()}`);
      rows.push([s.title, parts.join(' · ')]);
    }
    const names = documented.map((s) => s.title.replace('COVID-19 Precautions', 'COVID-19'));
    save('assessment', careTime, {
      title: 'Assessment',
      summary: `${names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]} assessment documented`,
      details: rows,
      data: { sections: documented.map((s) => s.key), values, notes },
    });
  };

  return (
    <FormFrame clientId={client.id} item={item} careTime={careTime} setCareTime={setCareTime} onCancel={onCancel} onSubmit={submit} error={error} saveLabel={`Save assessment${documented.length ? ` (${documented.length})` : ''}`}>
      {(trach || gtube) && (
        <p className="small muted" style={{ margin: 0 }}>
          Device details come from the current device record ({[trach, gtube].filter(Boolean).map((d) => `${d!.type} ${d!.size}`).join('; ')}). This assessment records today's findings only.
        </p>
      )}
      <div className="accordion">
        {SECTIONS.map((s) => {
          const isOpen = open === s.key;
          const done = documented.includes(s);
          return (
            <div key={s.key} className={`acc-item ${isOpen ? 'open' : ''}`}>
              <button type="button" className="acc-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.key)}>
                <span className="acc-title">{s.title}</span>
                {done ? <Badge tone="green" dot>Documented</Badge> : <span className="small muted">Not documented</span>}
                <Icon name="chevronDown" size={16} className="acc-chev" />
              </button>
              {isOpen && (
                <div className="acc-body">
                  {s.note && <p className="small muted" style={{ marginTop: 0 }}>{s.note}</p>}
                  <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
                    <Button size="sm" variant="ghost" icon="check" onClick={() => markNormal(s)}>Mark within normal limits</Button>
                  </div>
                  {s.questions.filter(visible).map((q) => (
                    <Field key={q.key} label={q.label}>
                      <Choice size="sm" options={q.options} value={values[s.key]?.[q.key] ?? ''} onChange={(v) => setQ(s.key, q.key, v)} />
                    </Field>
                  ))}
                  <Field label="Section note"><Textarea rows={2} value={notes[s.key] ?? ''} onChange={(e) => setNotes({ ...notes, [s.key]: e.target.value })} placeholder="Optional" /></Field>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FormFrame>
  );
}
