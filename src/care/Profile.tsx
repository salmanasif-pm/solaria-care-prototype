import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeature } from '../features/FeatureContext';
import { fmtStamp, today } from '../domain/time';
import { Avatar, Button, Card, KV } from '../ui';

export function Profile() {
  const { me, state, actions } = useStore();
  const quick = useFeature('quickSwitch');
  const nav = useNavigate();
  if (!me) return null;
  const mine = state.entries.filter((e) => e.staffId === me.id && e.date === today()).length;
  return (
    <div className="page narrow">
      <Card>
        <div className="row" style={{ gap: 14, marginBottom: 16 }}><Avatar name={me.name} size="lg" /><div><h1 style={{ margin: 0 }}>{me.name}</h1><div className="muted">{me.title} · Care Staff</div></div></div>
        <KV items={[
          ['Email', me.email], ['Employee ID', me.employeeId], ['Location', me.location], ['Care areas', me.careAreas.join(', ')],
          ['Signed in', `${state.session.via === 'pin' ? 'Quick switch (PIN)' : state.session.via === 'demo' ? 'Demo switcher' : 'Password + MFA'}${me.lastSignIn ? ' · ' + fmtStamp(me.lastSignIn) : ''}`],
          ['Terms accepted', me.termsAcceptedVersion ? `v${me.termsAcceptedVersion}` : '—'],
          ['Entries by you today', String(mine)],
        ]} />
        <p className="small muted">Your role and care areas are managed by an administrator. Professional title labels your entries and signatures; it does not change what the app lets you do.</p>
        <div className="row">
          {quick && <Button icon="swap" onClick={() => nav('/care/switch')}>Lock &amp; switch user</Button>}
          <Button variant="danger" icon="logout" onClick={() => { actions.signOut('Logged out of Care Staff iPad; session terminated'); nav('/care/signin?ended=1'); }}>Log out</Button>
        </div>
      </Card>
    </div>
  );
}
