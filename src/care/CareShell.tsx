// Care Staff - iPad experience. Minimal top navigation; routes come from the module manifest.
import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeature, useFeatures } from '../features/FeatureContext';
import { CARE_NAV } from '../features/modules';
import { Avatar, Icon } from '../ui';
import { ClientBoard } from './ClientBoard';
import { ClientWorkspace } from './ClientWorkspace';
import { TodayAll } from './TodayAll';
import { RecordsPage, RecordView } from './Records';
import { Profile } from './Profile';
import { PinSwitch } from '../auth/PinSwitch';
import { NotInScope } from '../shared/NotInScope';

export function CareShell() {
  const { me, actions } = useStore();
  const features = useFeatures();
  const quickSwitch = useFeature('quickSwitch');
  const nav = useNavigate();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo?.({ top: 0 }); setMenu(false); }, [loc.pathname]);

  const logout = () => { actions.signOut('Logged out of Care Staff iPad; session terminated'); nav('/care/signin?ended=1'); };

  return (
    <div className="care-app">
      <header className="care-top">
        <div className="care-brand"><span className="dotmark" aria-hidden />Solaria Care</div>
        <nav className="care-nav" aria-label="Care navigation">
          {CARE_NAV.filter((n) => !n.feature || features.on(n.feature)).map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive || (n.match && loc.pathname.startsWith(n.match)) ? 'active' : '')}>
              <Icon name={n.icon} size={17} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="care-user">
          <button type="button" className="care-user-btn" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="menu">
            <Avatar name={me?.name ?? '?'} size="sm" />
            <span className="who"><strong>{me?.name.split(' ')[0]}</strong><span>{me?.title}</span></span>
            <Icon name="chevronDown" size={14} />
          </button>
          {menu && (
            <div className="menu" role="menu">
              <div className="menu-head"><strong>{me?.name}</strong><span>{me?.title} · {me?.location}</span></div>
              <button type="button" role="menuitem" onClick={() => nav('/care/profile')}><Icon name="user" size={15} />Profile</button>
              {quickSwitch && <button type="button" role="menuitem" onClick={() => nav('/care/switch')}><Icon name="swap" size={15} />Lock &amp; switch user</button>}
              <button type="button" role="menuitem" onClick={logout}><Icon name="logout" size={15} />Log out</button>
            </div>
          )}
        </div>
      </header>
      <div className="care-main" ref={scroller}>
        <Routes>
          <Route index element={<Navigate to="clients" replace />} />
          <Route path="clients" element={<ClientBoard />} />
          <Route path="clients/:id/*" element={<ClientWorkspace />} />
          <Route path="today" element={features.on('careSchedule') ? <TodayAll /> : <NotInScope feature="careSchedule" back="/care/clients" />} />
          <Route path="records" element={features.on('history') ? <RecordsPage /> : <NotInScope feature="history" back="/care/clients" />} />
          <Route path="records/:sheetId" element={features.on('history') ? <RecordView /> : <NotInScope feature="history" back="/care/clients" />} />
          <Route path="profile" element={<Profile />} />
          <Route path="switch" element={quickSwitch ? <PinSwitch onCancel={() => nav(-1)} /> : <NotInScope feature="quickSwitch" back="/care/clients" />} />
          <Route path="*" element={<Navigate to="/care/clients" replace />} />
        </Routes>
      </div>
    </div>
  );
}
