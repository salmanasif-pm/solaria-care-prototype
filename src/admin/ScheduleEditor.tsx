// 6.2 Maintain care instructions and non-medication scheduled activities, with basic change history.
// Not a physician care-plan authoring / approval / version-diff system.
import { useState } from 'react';
import type { CareScheduleItem, Client } from '../domain/types';
import { uid, useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { DOC_MODULES } from '../features/modules';
import { daysLabel, fmtStamp, fmtTime, toMinutes, WEEKDAYS } from '../domain/time';
import { Button, Callout, Card, Empty, Field, Input, Modal, Select, Textarea, Toggle, useToast } from '../ui';
import { DaysPicker } from './DaysPicker';

type Kind = CareScheduleItem['docKind'];

export function ScheduleEditor({ client }: { client: Client }) {
  const { state, actions } = useStore();
  const f = useFeatures();
  const toast = useToast();
  const [editing, setEditing] = useState<CareScheduleItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [history, setHistory] = useState<CareScheduleItem | null>(null);
  const items = state.schedule.filter((s) => s.clientId === client.id).sort((a, b) => Number(b.active) - Number(a.active) || toMinutes(a.time) - toMinutes(b.time));
  const kinds = DOC_MODULES.filter((m) => m.kind !== 'medication' && f.on(m.feature));
  const kindLabel = (k: Kind) => DOC_MODULES.find((m) => m.kind === k)?.label ?? k;
  const name = (id: string) => state.staff.find((s) => s.id === id)?.name ?? 'System';

  return (
    <>
      <Card title="Care instructions & scheduled activities" sub="Visible to Care Staff in Today's Care as soon as they are saved. Medications are maintained on the Medications tab."
        actions={<Button variant="primary" icon="plus" data-tour="schedule-add" onClick={() => { setIsNew(true); setEditing({ id: uid('s'), clientId: client.id, name: '', instructions: '', time: '11:00', days: [...WEEKDAYS], docKind: 'activity', active: true, history: [] }); }}>Add scheduled care</Button>} pad={false}>
        {items.length === 0 ? <Empty title="No scheduled care yet" hint="Add the activities floor staff should see each day." icon="calendar" /> : (
          <table className="table">
            <thead><tr><th style={{ width: 90 }}>Time</th><th>Care / activity</th><th>Days</th><th>Documented as</th><th>Status</th><th>Changes</th><th /></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className={s.active ? '' : 'inactive'}>
                  <td className="nowrap"><strong>{fmtTime(s.time)}</strong></td>
                  <td><strong>{s.name}</strong><div className="small muted">{s.instructions}</div></td>
                  <td className="small">{daysLabel(s.days)}</td>
                  <td className="small">{kindLabel(s.docKind)}{!DOC_MODULES.some((m) => m.kind === s.docKind && f.on(m.feature)) && <div className="muted">out of scope → care activity</div>}</td>
                  <td><Toggle checked={s.active} onChange={(v) => { actions.setScheduleActive(s.id, v); toast(v ? 'Scheduled care reactivated' : 'Scheduled care deactivated - removed from Today\'s Care', 'info'); }} label={s.active ? 'Active' : 'Inactive'} /></td>
                  <td><button type="button" className="link small" onClick={() => setHistory(s)}>{s.history.length} change{s.history.length === 1 ? '' : 's'}</button></td>
                  <td className="right"><Button size="sm" variant="ghost" icon="edit" onClick={() => { setIsNew(false); setEditing({ ...s, days: [...s.days] }); }}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {editing && <ItemModal item={editing} isNew={isNew} kinds={kinds.map((k) => ({ key: k.kind as Kind, label: k.label }))} onClose={() => setEditing(null)}
        onSave={(it) => { actions.saveScheduleItem(it, isNew); setEditing(null); toast(isNew ? `${it.name} added - visible in Care Staff Today's Care` : 'Scheduled care updated'); }} />}
      {history && (
        <Modal title={`Change history · ${history.name}`} onClose={() => setHistory(null)} width={480}>
          <ul className="plain-list">{[...history.history].reverse().map((h, i) => <li key={i}><strong>{h.text}</strong> <span className="muted small">· {name(h.by)} · {fmtStamp(h.at)}</span></li>)}</ul>
          <p className="small muted">Basic effective-date history only; no approval workflow or version comparison in Phase 1.</p>
        </Modal>
      )}
    </>
  );
}

function ItemModal({ item, isNew, kinds, onClose, onSave }: { item: CareScheduleItem; isNew: boolean; kinds: { key: Kind; label: string }[]; onClose: () => void; onSave: (i: CareScheduleItem) => void }) {
  const [it, setIt] = useState(item);
  const [error, setError] = useState<string>();
  const set = <K extends keyof CareScheduleItem>(k: K, v: CareScheduleItem[K]) => { setIt({ ...it, [k]: v }); setError(undefined); };
  const save = () => {
    if (!it.name.trim()) return setError('Enter the care or activity name.');
    if (!it.time) return setError('Enter the scheduled time.');
    if (it.days.length === 0) return setError('Choose at least one day.');
    onSave({ ...it, name: it.name.trim(), instructions: it.instructions.trim() });
  };
  return (
    <Modal title={isNew ? 'Add scheduled care' : 'Edit scheduled care'} onClose={onClose} width={620}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{isNew ? 'Add to schedule' : 'Save changes'}</Button></>}>
      <div className="stack">
        <div className="grid-2">
          <Field label="Care / activity name" required><Input value={it.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Toileting" autoFocus /></Field>
          <Field label="Scheduled time" required><Input type="time" value={it.time} onChange={(e) => set('time', e.target.value)} /></Field>
        </div>
        <Field label="Instructions"><Textarea rows={3} value={it.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="What floor staff need to know" /></Field>
        <Field label="Applicable days" required><DaysPicker value={it.days} onChange={(v) => set('days', v)} /></Field>
        <Field label="Documented with" help="Which Care Staff form opens when the item is tapped">
          <Select value={it.docKind} onChange={(e) => set('docKind', e.target.value as Kind)}>{kinds.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}</Select>
        </Field>
        <Toggle checked={it.active} onChange={(v) => set('active', v)} label="Active" />
        {error && <Callout tone="danger">{error}</Callout>}
      </div>
    </Modal>
  );
}
