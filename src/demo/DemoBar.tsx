// Presenter strip above the application. Visually distinct from product navigation on purpose:
// switching user/surface, walkthroughs, scope preview, demo clock and reset are prototype conveniences.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { useDemo } from './DemoContext';
import { WALKTHROUGHS } from './walkthroughs';
import { ScopePanel } from './ScopePanel';
import { Confirm, Icon, useToast } from '../ui';
import { fmtTime } from '../domain/time';

export function DemoBar() {
  const { state, actions } = useStore();
  const features = useFeatures();
  const demo = useDemo();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [menu, setMenu] = useState<'walk' | null>(null);
  const [scope, setScope] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const s = state.session;
  const current = s.userId ? `${s.userId}|${s.surface}` : loc.pathname.startsWith('/care') ? 'out|care' : loc.pathname.startsWith('/admin') ? 'out|admin' : '';
  const admins = state.staff.filter((u) => u.role === 'admin' && u.status === 'active');
  const care = state.staff.filter((u) => u.role === 'care' && u.status === 'active');

  const onView = (v: string) => {
    const [userId, surface] = v.split('|') as [string, 'admin' | 'care'];
    if (userId === 'out') { if (s.userId) actions.signOut('Signed out (demo switcher)'); nav(`/${surface}/signin`); return; }
    actions.signIn(userId, surface, 'demo');
    nav(surface === 'admin' ? (features.on('clientManagement') ? '/admin/clients' : '/admin') : '/care/clients');
  };

  return (
    <div className="demo-bar" role="region" aria-label="Prototype presenter controls">
      <span className="demo-tag">Prototype</span>
      <label className="demo-view">
        <span>Viewing as</span>
        <select value={current} onChange={(e) => onView(e.target.value)} data-tour="viewing-as" aria-label="Viewing as">
          {current === '' && <option value="">Choose an experience…</option>}
          <optgroup label="Web Admin">
            {admins.map((u) => <option key={u.id} value={`${u.id}|admin`} disabled={!features.adminAvailable}>Administrative User - {u.name} · Web Admin</option>)}
            <option value="out|admin">Signed out · Web Admin sign-in</option>
          </optgroup>
          <optgroup label="Care Staff - iPad">
            {care.map((u) => <option key={u.id} value={`${u.id}|care`}>Care Staff - {u.name}, {u.title} · iPad</option>)}
            <option value="out|care">Signed out · iPad sign-in</option>
          </optgroup>
        </select>
      </label>
      <div className="demo-actions">
        <div className="demo-menu-wrap">
          <button type="button" className="demo-btn" title="Walkthroughs" aria-expanded={menu === 'walk'} onClick={() => setMenu(menu === 'walk' ? null : 'walk')}><Icon name="play" size={13} /><span className="lbl">Walkthroughs</span></button>
          {menu === 'walk' && (
            <div className="demo-menu" role="menu">
              {WALKTHROUGHS.map((w) => (
                <button key={w.id} type="button" role="menuitem" onClick={() => { setMenu(null); demo.start(w.id); }}>
                  <strong>{w.title}</strong><span>{w.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className={`demo-btn ${features.isFull ? '' : 'warn'}`} onClick={() => setScope(true)} title="Preview a smaller Phase 1 by switching capabilities off">
          <Icon name="layers" size={13} /><span className="lbl">Scope{features.isFull ? '' : features.futureOn ? ': + future idea' : ': reduced'}</span>
        </button>
        <label className="demo-btn time" title="Demo clock drives due / overdue status">
          <Icon name="clock" size={13} />
          <input type="time" value={state.demoTime} onChange={(e) => e.target.value && actions.setDemoTime(e.target.value)} aria-label="Demo time" />
        </label>
        {loc.pathname.startsWith('/care') && (
          <button type="button" className="demo-btn" onClick={() => demo.setFrame(!demo.frame)} title="Show the Care Staff experience inside an iPad frame on large screens">
            <Icon name="tablet" size={13} /><span className="lbl">{demo.frame ? 'iPad frame on' : 'iPad frame off'}</span>
          </button>
        )}
        <button type="button" className="demo-btn" title="Reset demo" onClick={() => setConfirmReset(true)}><Icon name="refresh" size={13} /><span className="lbl">Reset demo</span></button>
      </div>
      {scope && <ScopePanel onClose={() => setScope(false)} />}
      {confirmReset && (
        <Confirm title="Reset demo data?" danger confirmLabel="Reset" body="All changes made in this browser are discarded and the seeded scenario is restored. Scope settings are kept."
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => { actions.reset(); demo.exit(); setConfirmReset(false); nav('/'); toast(`Demo data reset · demo clock ${fmtTime('10:40')}`, 'info'); }} />
      )}
    </div>
  );
}
