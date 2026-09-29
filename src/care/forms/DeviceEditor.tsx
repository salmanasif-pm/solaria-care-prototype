// Edits the single current device record. Used from the care-staff device-care form and Web Admin.
import { useState } from 'react';
import type { DeviceRecord } from '../../domain/types';
import { uid, useStore } from '../../store/store';
import { today } from '../../domain/time';
import { Button, Callout, Choice, Field, Input, Textarea } from '../../ui';

export function DeviceEditor({ clientId, device, onDone }: { clientId: string; device?: DeviceRecord; onDone: (savedId?: string) => void }) {
  const { actions } = useStore();
  const [d, setD] = useState<DeviceRecord>(device ?? { id: uid('d'), clientId, type: 'G-tube', description: '', size: '', details: '', lastChanged: today(), active: true, history: [] });
  const [error, setError] = useState<string>();
  const set = <K extends keyof DeviceRecord>(k: K, v: DeviceRecord[K]) => { setD({ ...d, [k]: v }); setError(undefined); };
  const save = () => {
    if (!d.size.trim()) return setError('Enter the device size.');
    if (!d.description.trim()) return setError('Enter the device description.');
    actions.saveDevice(d, !device);
    onDone(d.id);
  };
  return (
    <div className="stack">
      {!device && <Field label="Device type" required><Choice options={['G-tube', 'NG tube', 'Tracheostomy'] as const} value={d.type} onChange={(v) => v && set('type', v)} allowClear={false} /></Field>}
      <div className="grid-2">
        <Field label="Description" required><Input value={d.description} onChange={(e) => set('description', e.target.value)} placeholder={d.type === 'Tracheostomy' ? 'Pediatric cuffless' : 'Low-profile balloon button'} /></Field>
        <Field label="Type / size" required><Input value={d.size} onChange={(e) => set('size', e.target.value)} placeholder={d.type === 'Tracheostomy' ? '4.0 PED' : '14 Fr · 1.5 cm'} /></Field>
      </div>
      <div className="grid-2">
        <Field label="Last changed / placed"><Input type="date" value={d.lastChanged} onChange={(e) => set('lastChanged', e.target.value)} /></Field>
      </div>
      <Field label="Placement / verification details"><Textarea rows={2} value={d.details} onChange={(e) => set('details', e.target.value)} placeholder="e.g. balloon volume, ties, spare device" /></Field>
      {device && device.history.length > 0 && (
        <div className="small muted">History: {device.history.slice(-3).map((h) => h.text).join(' · ')}</div>
      )}
      {error && <Callout tone="danger">{error}</Callout>}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {device && <Button variant="ghost" onClick={() => { actions.saveDevice({ ...d, active: false }, false); onDone(); }}>Device removed</Button>}
        <Button variant="ghost" onClick={() => onDone()}>Cancel</Button>
        <Button variant="primary" onClick={save}>Save device record</Button>
      </div>
    </div>
  );
}
