// 5.3 Lean authorization-period record: payer, start/end, optional reference. No billing units or expiry dashboards.
import { useState } from 'react';
import type { AuthorizationPeriod, Client } from '../domain/types';
import { uid, useStore } from '../store/store';
import { addDays, fmtDate, today } from '../domain/time';
import { Badge, Button, Callout, Card, Empty, Field, Input, Modal, useToast } from '../ui';

export function AuthorizationsTab({ client }: { client: Client }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<{ p: AuthorizationPeriod; isNew: boolean } | null>(null);
  const [error, setError] = useState<string>();
  const T = today();
  const periods = state.authorizations.filter((a) => a.clientId === client.id).sort((a, b) => b.start.localeCompare(a.start));
  const save = () => {
    if (!editing) return;
    const { p } = editing;
    if (!p.payer.trim() || !p.start || !p.end) return setError('Payer, start and end are required.');
    if (p.end < p.start) return setError('End date must be after the start date.');
    actions.saveAuthorization(p, editing.isNew);
    setEditing(null);
    toast('Authorization period saved');
  };
  return (
    <>
      <Card title="Authorization periods" sub="Used by Records to filter the current authorization period. Staggered dates per client are supported." pad={false}
        actions={<Button variant="primary" icon="plus" onClick={() => { setError(undefined); setEditing({ isNew: true, p: { id: uid('a'), clientId: client.id, payer: periods[0]?.payer ?? '', start: T, end: addDays(T, 180), reference: '' } }); }}>Add period</Button>}>
        {periods.length === 0 ? <Empty title="No authorization periods on file" icon="calendar" /> : (
          <table className="table">
            <thead><tr><th>Payer</th><th>Start</th><th>End</th><th>Reference</th><th>Status</th><th /></tr></thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id}>
                  <td>{p.payer}</td><td>{fmtDate(p.start)}</td><td>{fmtDate(p.end)}</td><td>{p.reference || '—'}</td>
                  <td>{p.start <= T && p.end >= T ? <Badge tone="green" dot>Current</Badge> : p.end < T ? <Badge tone="neutral">Past</Badge> : <Badge tone="outline">Future</Badge>}</td>
                  <td className="right"><Button size="sm" variant="ghost" icon="edit" onClick={() => { setError(undefined); setEditing({ isNew: false, p: { ...p } }); }}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {editing && (
        <Modal title={editing.isNew ? 'Add authorization period' : 'Edit authorization period'} onClose={() => setEditing(null)} width={560}
          footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
          <div className="stack">
            <Field label="Payer" required><Input value={editing.p.payer} onChange={(e) => setEditing({ ...editing, p: { ...editing.p, payer: e.target.value } })} /></Field>
            <div className="grid-2">
              <Field label="Start" required><Input type="date" value={editing.p.start} onChange={(e) => setEditing({ ...editing, p: { ...editing.p, start: e.target.value } })} /></Field>
              <Field label="End" required><Input type="date" value={editing.p.end} onChange={(e) => setEditing({ ...editing, p: { ...editing.p, end: e.target.value } })} /></Field>
            </div>
            <Field label="Reference (optional)"><Input value={editing.p.reference} onChange={(e) => setEditing({ ...editing, p: { ...editing.p, reference: e.target.value } })} /></Field>
            <p className="small muted" style={{ margin: 0 }}>Scanned legacy flow sheets could be linked here if required for go-live (pending confirmation).</p>
            {error && <Callout tone="danger">{error}</Callout>}
          </div>
        </Modal>
      )}
    </>
  );
}
