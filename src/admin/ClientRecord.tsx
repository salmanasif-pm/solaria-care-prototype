// Admin client record with tabs. Each tab is an independent module owned by a registry feature.
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { ADMIN_CLIENT_TABS } from '../features/modules';
import { clientName } from '../domain/care';
import { ageLabel, cmToFtIn, fmtDate, fmtStamp, kgToLb } from '../domain/time';
import { Badge, Card, Empty, KV, LinkButton, PageHead } from '../ui';
import { clientIndicators } from '../shared/indicators';
import { NotInScope } from '../shared/NotInScope';
import { ScheduleEditor } from './ScheduleEditor';
import { MedicationEditor } from './MedicationEditor';
import { DevicesTab } from './DevicesTab';
import { AuthorizationsTab } from './AuthorizationsTab';
import type { Client } from '../domain/types';

export function ClientRecord() {
  const { id } = useParams();
  const { state } = useStore();
  const f = useFeatures();
  const loc = useLocation();
  const client = state.clients.find((c) => c.id === id);
  if (!client) return <div className="page"><Empty title="Client not found" action={<LinkButton to="/admin/clients" variant="primary">Back to clients</LinkButton>} /></div>;
  const base = `/admin/clients/${client.id}`;
  const tabs = ADMIN_CLIENT_TABS.filter((t) => !t.feature || f.on(t.feature));
  const current = loc.pathname.slice(base.length + 1);

  return (
    <div className="page">
      <PageHead title={<>{clientName(client)} {client.status === 'inactive' && <Badge tone="neutral">Inactive</Badge>}</>} crumbs={[{ to: '/admin/clients', label: 'Clients' }, { label: clientName(client) }]}
        lede={`${ageLabel(client.dob)} · DOB ${fmtDate(client.dob)} · ${client.location} · ${client.careArea}`}
        actions={<LinkButton to={`${base}/edit`} icon="edit">Edit client</LinkButton>} />
      <nav className="tabs" data-tour="client-tabs" aria-label="Client record sections">
        {tabs.map((t) => <Link key={t.path} to={t.path ? `${base}/${t.path}` : base} className={`tab ${current === t.path ? 'active' : ''}`}>{t.label}</Link>)}
      </nav>
      <Routes>
        <Route index element={<Overview client={client} />} />
        <Route path="care-schedule" element={f.on('scheduleManagement') ? <ScheduleEditor client={client} /> : <NotInScope feature="scheduleManagement" back={base} />} />
        <Route path="medications" element={f.on('medications') ? <MedicationEditor client={client} /> : <NotInScope feature="medications" back={base} />} />
        <Route path="devices" element={f.on('specializedCare') ? <DevicesTab client={client} /> : <NotInScope feature="specializedCare" back={base} />} />
        <Route path="authorizations" element={f.on('authorizationHistory') ? <AuthorizationsTab client={client} /> : <NotInScope feature="authorizationHistory" back={base} />} />
      </Routes>
    </div>
  );
}

function Overview({ client }: { client: Client }) {
  const { state } = useStore();
  const f = useFeatures();
  const sched = state.schedule.filter((s) => s.clientId === client.id);
  const meds = state.medications.filter((m) => m.clientId === client.id);
  const staff = state.staff.filter((s) => s.role === 'care' && s.status === 'active' && s.location === client.location && s.careAreas.includes(client.careArea));
  const ind = clientIndicators(state, client, f.on('specializedCare'));
  return (
    <div className="grid-2 align-start">
      <Card title="Demographics">
        <KV items={[
          ['Client / patient name', clientName(client)], ['Date of birth', `${fmtDate(client.dob)} (${ageLabel(client.dob)})`], ['Height', cmToFtIn(client.heightCm)], ['Weight', kgToLb(client.weightKg)],
          ['Location', client.location], ['Care area', client.careArea], ['Status', client.status === 'active' ? 'Active' : 'Inactive'],
          ['Indicators', ind.length ? <div className="tags">{ind.map((i) => <span key={i.label} className={`tag ${i.kind}`}>{i.label}</span>)}</div> : ''],
          ['Notes', client.notes], ['Last updated', fmtStamp(client.updatedAt)],
        ]} />
      </Card>
      <div className="stack">
        <Card title="Care setup">
          <KV items={[
            ...(f.on('careSchedule') ? [['Scheduled care', `${sched.filter((s) => s.active).length} active · ${sched.filter((s) => !s.active).length} inactive`] as [string, string]] : []),
            ...(f.on('medications') ? [['Medications', `${meds.filter((m) => m.active).length} active`] as [string, string]] : []),
            ...(f.on('specializedCare') ? [['Device records', String(state.devices.filter((d) => d.clientId === client.id && d.active).length)] as [string, string]] : []),
          ]} />
          <p className="small muted" style={{ marginBottom: 0 }}>Daily documentation and flow sheets live in the Care Staff app; the Web Admin does not duplicate them in Phase 1 (roadmap 6.4).</p>
        </Card>
        <Card title="Care Staff with access" sub="Derived from staff location and care-area assignment">
          {staff.length ? <ul className="plain-list">{staff.map((s) => <li key={s.id}><strong>{s.name}</strong> <span className="muted">· {s.title}</span></li>)}</ul> : <p className="muted">No active Care Staff assigned to this care area.</p>}
        </Card>
      </div>
    </div>
  );
}
