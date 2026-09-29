// 4.7 Feeding-tube and tracheostomy daily care. The device record itself is baseline information maintained
// in Web Admin (single source); the iPad shows it read-only and records today's site check against it.
import { useState } from 'react';
import type { DeviceRecord } from '../../domain/types';
import { useStore } from '../../store/store';
import { fmtDate } from '../../domain/time';
import { Button, Choice, Field, MultiChoice, Textarea } from '../../ui';
import { details, FormFrame, Section, useCareTime, useSave, type DocFormProps } from './common';

const SITE = ['Clean / dry / intact', 'Redness', 'Drainage', 'Leakage', 'Granulation tissue', 'Bleeding'] as const;
const CARE: Record<DeviceRecord['type'], string[]> = {
  'G-tube': ['Site cleaned and dried', 'Split gauze changed', 'Balloon volume checked', 'Tube rotated', 'Flushed'],
  'NG tube': ['Placement verified', 'Tape changed', 'Nares checked', 'Flushed'],
  Tracheostomy: ['Stoma cleaned', 'Split gauze changed', 'Ties changed', 'Ties checked (one-finger fit)', 'Inner cannula cleaned', 'Spare trach present'],
};

export function SpecializedCareForm({ client, item, onSaved, onCancel }: DocFormProps) {
  const { state } = useStore();
  const [careTime, setCareTime] = useCareTime();
  const devices = state.devices.filter((d) => d.clientId === client.id && d.active);
  const guess = item ? devices.find((d) => item.name.toLowerCase().includes(d.type === 'Tracheostomy' ? 'trach' : 'tube')) : undefined;
  const [deviceId, setDeviceId] = useState(guess?.id ?? devices[0]?.id ?? '');
  const [site, setSite] = useState('');
  const [care, setCare] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const save = useSave(client, item, onSaved);
  const device = devices.find((d) => d.id === deviceId);

  if (!device) {
    return (
      <div className="stack">
        <p className="muted">{client.firstName} has no feeding-tube or tracheostomy device on record. Device records are set up by an administrative user in Web Admin (client → Devices).</p>
        <div><Button variant="ghost" onClick={onCancel}>Close</Button></div>
      </div>
    );
  }

  const submit = () => {
    if (!site) return setError('Record the site condition.');
    if (!careTime) return setError('Enter the care time.');
    save('specializedCare', careTime, {
      title: `${device.type} care`,
      summary: `${device.type} ${device.size} · ${site}${care.length ? ' · ' + care.join(', ') : ''}`,
      details: details([['Device', `${device.type} · ${device.description} · ${device.size}`], ['Site condition', site], ['Care performed', care.join(', ')], ['Notes', notes.trim()]]),
      data: { deviceId: device.id, siteCondition: site, care, notes },
    });
  };

  return (
    <FormFrame clientId={client.id} item={item} careTime={careTime} setCareTime={setCareTime} onCancel={onCancel} onSubmit={submit} error={error} saveLabel="Save device care">
      {devices.length > 1 && (
        <Field label="Device"><Choice options={devices.map((d) => ({ key: d.id, label: d.type }))} value={deviceId} onChange={(v) => v && setDeviceId(v)} allowClear={false} /></Field>
      )}
      <div className="device-card">
        <div>
          <div className="small muted">Current device record</div>
          <strong>{device.type} · {device.description}</strong>
          <div>Size {device.size} · last changed {fmtDate(device.lastChanged)}</div>
          {device.details && <div className="small muted">{device.details}</div>}
        </div>
        <span className="small muted">Maintained in Web Admin</span>
      </div>
      <Section title="Daily check / site care">
        <Field label="Site condition" required><Choice size="sm" options={SITE} value={site} onChange={(v) => { setSite(v); setError(undefined); }} allowClear={false} /></Field>
        <Field label="Care performed"><MultiChoice options={CARE[device.type]} value={care} onChange={setCare} /></Field>
      </Section>
      <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>
    </FormFrame>
  );
}
