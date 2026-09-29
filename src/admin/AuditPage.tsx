// 6.5 Audit trail viewer: review and search only (no report generation or archival tooling).
import { useState } from 'react';
import type { AuditCategory } from '../domain/types';
import { useStore } from '../store/store';
import { clientName } from '../domain/care';
import { addDays, fmtStamp, isoDate, today } from '../domain/time';
import { Badge, Card, Empty, Icon, Input, PageHead, Select } from '../ui';

const CATS: AuditCategory[] = ['Authentication', 'Client', 'Care schedule', 'Documentation', 'Sign-off', 'Staff & access', 'Record access'];
const TONE: Record<AuditCategory, 'blue' | 'green' | 'amber' | 'neutral' | 'outline'> = { Authentication: 'neutral', Client: 'blue', 'Care schedule': 'blue', Documentation: 'green', 'Sign-off': 'green', 'Staff & access': 'amber', 'Record access': 'outline' };

export function AuditPage() {
  const { state } = useStore();
  const [cat, setCat] = useState('');
  const [user, setUser] = useState('');
  const [client, setClient] = useState('');
  const [range, setRange] = useState<'today' | '7' | 'all'>('7');
  const [q, setQ] = useState('');
  const min = range === 'today' ? today() : range === '7' ? addDays(today(), -7) : '0000';
  const list = state.audit.filter((a) => (!cat || a.category === cat) && (!user || a.userId === user) && (!client || a.clientId === client) && isoDate(new Date(a.at)) >= min && a.action.toLowerCase().includes(q.trim().toLowerCase()));
  const staff = (id: string) => state.staff.find((s) => s.id === id);

  return (
    <div className="page">
      <PageHead title="Audit trail" lede="Attributable record of sign-ins, documentation and corrections, sign-offs, client / schedule / staff changes and record access." />
      <Card pad={false}>
        <div className="table-tools wrap">
          <div className="search"><Icon name="search" size={16} /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions" aria-label="Search actions" /></div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</Select>
          <Select value={user} onChange={(e) => setUser(e.target.value)} aria-label="User"><option value="">All users</option>{state.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client"><option value="">All clients</option>{state.clients.map((c) => <option key={c.id} value={c.id}>{clientName(c)}</option>)}</Select>
          <Select value={range} onChange={(e) => setRange(e.target.value as typeof range)} aria-label="Date range"><option value="today">Today</option><option value="7">Last 7 days</option><option value="all">All</option></Select>
          <span className="small muted grow right">{list.length} events</span>
        </div>
        {list.length === 0 ? <Empty title="No matching activity" icon="shield" /> : (
          <table className="table" data-tour="audit-table">
            <thead><tr><th style={{ width: 170 }}>Timestamp</th><th style={{ width: 190 }}>User</th><th style={{ width: 150 }}>Client</th><th>Action</th><th style={{ width: 140 }}>Category</th></tr></thead>
            <tbody>
              {list.slice(0, 200).map((a) => {
                const s = staff(a.userId);
                const c = a.clientId && state.clients.find((x) => x.id === a.clientId);
                return (
                  <tr key={a.id}>
                    <td className="small nowrap">{fmtStamp(a.at)}</td>
                    <td>{s ? <><strong>{s.name}</strong><div className="small muted">{s.role === 'admin' ? 'Administrative User' : s.title}</div></> : <span className="muted">System</span>}</td>
                    <td className="small">{c ? clientName(c) : '—'}</td>
                    <td>{a.action}</td>
                    <td><Badge tone={TONE[a.category]}>{a.category}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
