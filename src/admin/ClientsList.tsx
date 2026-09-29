// 6.1 Client list.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { clientName } from '../domain/care';
import { ageLabel, fmtDate, fmtStamp } from '../domain/time';
import { Badge, Card, Empty, Icon, Input, LinkButton, PageHead, Select } from '../ui';
import { clientIndicators } from '../shared/indicators';

export function ClientsList() {
  const { state } = useStore();
  const f = useFeatures();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | ''>('active');
  const list = state.clients
    .filter((c) => (!area || c.careArea === area) && (!status || c.status === status) && clientName(c).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="page">
      <PageHead title="Clients" lede="Baseline client information used by Care Staff when documenting care." actions={<LinkButton to="/admin/clients/new" variant="primary" icon="plus">New client</LinkButton>} />
      <Card pad={false}>
        <div className="table-tools">
          <div className="search"><Icon name="search" size={16} /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" aria-label="Search clients" /></div>
          <Select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Care area"><option value="">All care areas</option>{state.careAreas.map((a) => <option key={a}>{a}</option>)}</Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status"><option value="active">Active</option><option value="inactive">Inactive</option><option value="">All statuses</option></Select>
          <span className="small muted grow right">{list.length} client{list.length === 1 ? '' : 's'}</span>
        </div>
        {list.length === 0 ? <Empty title="No clients match" icon="users" /> : (
          <table className="table hover" data-tour="client-table">
            <thead><tr><th>Name</th><th>DOB / age</th><th>Location</th><th>Care area</th><th>Indicators</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} onClick={() => nav(`/admin/clients/${c.id}`)} className="clickable">
                  <td><Link to={`/admin/clients/${c.id}`} onClick={(e) => e.stopPropagation()}><strong>{c.lastName}, {c.firstName}</strong></Link></td>
                  <td>{fmtDate(c.dob)} <span className="muted">· {ageLabel(c.dob)}</span></td>
                  <td>{c.location}</td>
                  <td>{c.careArea}</td>
                  <td><div className="tags">{clientIndicators(state, c, f.on('specializedCare')).slice(0, 2).map((i) => <span key={i.label} className={`tag ${i.kind}`}>{i.label}</span>)}</div></td>
                  <td>{c.status === 'active' ? <Badge tone="green" dot>Active</Badge> : <Badge tone="neutral">Inactive</Badge>}</td>
                  <td className="small muted">{fmtStamp(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
