// React Web Admin (6.4): desktop shell for configuration and oversight. Navigation from the module manifest.
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { ADMIN_NAV } from '../features/modules';
import { Avatar, Empty, Icon } from '../ui';
import { NotInScope } from '../shared/NotInScope';
import { ClientsList } from './ClientsList';
import { ClientForm } from './ClientForm';
import { ClientRecord } from './ClientRecord';
import { ScheduleOverview } from './ScheduleOverview';
import { StaffPage } from './StaffPage';
import { AuditPage } from './AuditPage';

export function AdminShell() {
  const { me, actions } = useStore();
  const f = useFeatures();
  const nav = useNavigate();
  const loc = useLocation();
  const items = ADMIN_NAV.filter((n) => !n.feature || f.on(n.feature));
  const gate = (feature: Parameters<typeof f.on>[0], el: JSX.Element) => (f.on(feature) ? el : <NotInScope feature={feature} back="/admin" />);

  return (
    <div className="admin-app">
      <aside className="admin-side">
        <div className="admin-brand">
          <span className="logo" aria-hidden><svg viewBox="0 0 32 32" width="26" height="26"><rect width="32" height="32" rx="7" fill="#fff" fillOpacity=".14" /><path d="M16 8v16M8 16h16" stroke="#fff" strokeWidth="4" strokeLinecap="round" /><circle cx="23.5" cy="8.5" r="3" fill="#2bb3a0" /></svg></span>
          <div><strong>Solaria Care</strong><span>Web Admin</span></div>
        </div>
        <nav aria-label="Admin navigation">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive || (n.match && loc.pathname.startsWith(n.match)) ? 'active' : '')}>
              <Icon name={n.icon} size={17} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <div className="row" style={{ gap: 10 }}>
            <Avatar name={me?.name ?? '?'} size="sm" />
            <div className="grow"><strong>{me?.name}</strong><div className="small">Administrative User</div></div>
          </div>
          <button type="button" className="side-logout" onClick={() => { actions.signOut('Signed out of Web Admin; session terminated'); nav('/admin/signin?ended=1'); }}><Icon name="logout" size={15} />Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={items[0] ? <Navigate to={items[0].to} replace /> : <div className="page"><Empty icon="layers" title="No Web Admin capability in the current scope" hint="Client, schedule, staff and audit administration are all switched off. Records are set up by one-time import." /></div>} />
          <Route path="clients" element={gate('clientManagement', <ClientsList />)} />
          <Route path="clients/new" element={gate('clientManagement', <ClientForm />)} />
          <Route path="clients/:id/edit" element={gate('clientManagement', <ClientForm />)} />
          <Route path="clients/:id/*" element={gate('clientManagement', <ClientRecord />)} />
          <Route path="schedule" element={gate('scheduleManagement', <ScheduleOverview />)} />
          <Route path="staff" element={gate('staffManagement', <StaffPage />)} />
          <Route path="audit" element={gate('auditTrail', <AuditPage />)} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
