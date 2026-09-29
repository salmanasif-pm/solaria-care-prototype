// 6.3 Staff account and identity management. Two application roles only; professional title is a label.
import { useState } from 'react';
import type { ProfessionalTitle, Staff } from '../domain/types';
import { uid, useStore } from '../store/store';
import { useFeature } from '../features/FeatureContext';
import { fmtStamp } from '../domain/time';
import { Badge, Button, Callout, Card, Confirm, Field, Input, Modal, MultiChoice, PageHead, Select, Tabs, useToast } from '../ui';

const TITLES: ProfessionalTitle[] = ['PCA', 'LVN', 'RN', 'Direct-Care Staff', 'Administrator'];

export function StaffPage() {
  const { state, actions, me } = useStore();
  const lifecycle = useFeature('accountLifecycle');
  const toast = useToast();
  const [tab, setTab] = useState<'active' | 'invited' | 'inactive' | 'all'>('all');
  const [editing, setEditing] = useState<{ s: Staff; isNew: boolean } | null>(null);
  const [confirm, setConfirm] = useState<Staff | null>(null);
  const [invited, setInvited] = useState<{ name: string; code: string } | null>(null);
  const list = state.staff.filter((s) => tab === 'all' || s.status === tab).sort((a, b) => a.name.localeCompare(b.name));
  const areasCount = state.careAreas.length;
  const count = (st: Staff['status']) => state.staff.filter((s) => s.status === st).length;

  return (
    <div className="page">
      <PageHead title="Staff" lede="Individual accounts with role and location / care-area assignment. Deactivating revokes sessions; past documentation stays attributed."
        actions={<Button variant="primary" icon="plus" onClick={() => setEditing({ isNew: true, s: { id: uid('u'), name: '', email: '', employeeId: '', role: 'care', title: 'PCA', location: state.locations[0], careAreas: [], status: 'invited' } })}>Invite staff</Button>} />
      {invited && <Callout tone="success">Invitation created for <strong>{invited.name}</strong>. Prototype invitation code: <code>{invited.code}</code> - use it on the iPad under "Activate invited account".</Callout>}
      <Card pad={false}>
        <div className="table-tools"><Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All', count: state.staff.length }, { key: 'active', label: 'Active', count: count('active') }, { key: 'invited', label: 'Invited', count: count('invited') }, { key: 'inactive', label: 'Inactive', count: count('inactive') }]} /></div>
        <table className="table" data-tour="staff-table">
          <thead><tr><th>Name</th><th>Role</th><th>Professional title</th><th>Location / care areas</th><th>Status</th><th>Last sign-in</th><th /></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className={s.status === 'inactive' ? 'inactive' : ''}>
                <td><strong>{s.name}</strong><div className="small muted">{s.email} · {s.employeeId}</div></td>
                <td>{s.role === 'admin' ? 'Administrative User' : 'Care Staff'}</td>
                <td>{s.title}</td>
                <td className="small">{s.location}<div className="muted">{s.role === 'admin' ? 'Web Admin - all clients' : s.careAreas.length === areasCount ? 'All care areas' : s.careAreas.join(', ') || '—'}</div></td>
                <td>{s.status === 'active' ? <Badge tone="green" dot>Active</Badge> : s.status === 'invited' ? <Badge tone="amber" dot>Invited</Badge> : <Badge tone="neutral">Inactive</Badge>}</td>
                <td className="small muted">{s.lastSignIn ? fmtStamp(s.lastSignIn) : '—'}</td>
                <td className="row-actions">
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing({ isNew: false, s: { ...s, careAreas: [...s.careAreas] } })}>Edit</Button>
                  {s.status === 'invited' && lifecycle && <Button size="sm" variant="ghost" onClick={() => { actions.resendInvite(s.id); toast(`Invitation re-sent to ${s.email}`, 'info'); }}>Resend invite</Button>}
                  {s.status === 'active' && lifecycle && <Button size="sm" variant="ghost" onClick={() => { actions.resetCredentials(s.id); toast(`Reset link sent to ${s.name}; sessions revoked`, 'info'); }}>Reset password</Button>}
                  {s.status !== 'invited' && s.id !== me?.id && (s.status === 'active'
                    ? <Button size="sm" variant="ghost" className="danger-text" onClick={() => setConfirm(s)}>Deactivate</Button>
                    : <Button size="sm" variant="ghost" onClick={() => { actions.setStaffStatus(s.id, 'active'); toast(`${s.name} reactivated`); }}>Reactivate</Button>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {editing && <StaffModal s={editing.s} isNew={editing.isNew} areas={state.careAreas} locations={state.locations} onClose={() => setEditing(null)}
        onSave={(s) => {
          const code = actions.saveStaff(s, editing.isNew);
          setEditing(null);
          if (code) setInvited({ name: s.name, code }); else toast('Staff access updated');
        }} emails={state.staff.filter((x) => x.id !== editing.s.id).map((x) => x.email.toLowerCase())} />}
      {confirm && (
        <Confirm title={`Deactivate ${confirm.name}?`} danger confirmLabel="Deactivate" onCancel={() => setConfirm(null)}
          onConfirm={() => { actions.setStaffStatus(confirm.id, 'inactive'); toast(`${confirm.name} deactivated; active sessions revoked`, 'info'); setConfirm(null); }}
          body="They can no longer sign in or switch in by PIN. Everything they documented stays attributed to them. You can reactivate the account later." />
      )}
    </div>
  );
}

function StaffModal({ s: initial, isNew, areas, locations, emails, onClose, onSave }: { s: Staff; isNew: boolean; areas: string[]; locations: string[]; emails: string[]; onClose: () => void; onSave: (s: Staff) => void }) {
  const [s, setS] = useState(initial);
  const [error, setError] = useState<string>();
  const set = <K extends keyof Staff>(k: K, v: Staff[K]) => { setS({ ...s, [k]: v }); setError(undefined); };
  const save = () => {
    if (!s.name.trim()) return setError('Enter the staff member\'s name.');
    if (!/^\S+@\S+\.\S+$/.test(s.email)) return setError('Enter a valid email address.');
    if (emails.includes(s.email.toLowerCase())) return setError('Another account already uses this email.');
    if (!s.employeeId.trim()) return setError('Enter the employee ID.');
    if (s.role === 'care' && s.careAreas.length === 0) return setError('Assign at least one care area.');
    onSave({ ...s, name: s.name.trim(), email: s.email.trim(), careAreas: s.role === 'admin' ? [...areas] : s.careAreas });
  };
  return (
    <Modal title={isNew ? 'Invite staff member' : `Edit ${initial.name}`} sub={isNew ? 'They receive an invitation to activate their account and set a password and PIN.' : undefined} onClose={onClose} width={640}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{isNew ? 'Send invitation' : 'Save changes'}</Button></>}>
      <div className="stack">
        <div className="grid-2">
          <Field label="Full name" required><Input value={s.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
          <Field label="Employee ID" required><Input value={s.employeeId} onChange={(e) => set('employeeId', e.target.value)} placeholder="SC-0000" /></Field>
          <Field label="Email" required><Input type="email" value={s.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Application role" required help="Only two roles in Phase 1; finer segregation pending confirmation">
            <Select value={s.role} onChange={(e) => set('role', e.target.value as Staff['role'])}><option value="care">Care Staff (iPad)</option><option value="admin">Administrative User (Web Admin)</option></Select>
          </Field>
          <Field label="Professional title" help="Labels entries and signatures; not a permission"><Select value={s.title} onChange={(e) => set('title', e.target.value as ProfessionalTitle)}>{TITLES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Location" required><Select value={s.location} onChange={(e) => set('location', e.target.value)}>{locations.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        </div>
        {s.role === 'care' && <Field label="Care areas" required help="Care Staff see only clients in these areas at their location"><MultiChoice options={areas} value={s.careAreas} onChange={(v) => set('careAreas', v)} /></Field>}
        {error && <Callout tone="danger">{error}</Callout>}
      </div>
    </Modal>
  );
}
