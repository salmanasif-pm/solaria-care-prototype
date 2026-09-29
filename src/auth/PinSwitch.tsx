// Shared-iPad quick switch (roadmap 2.1 PIN, 2.3, 7.1). Each person switches in with their own PIN,
// so every entry stays individually attributed. MFA is not assumed for PIN switching (roadmap note).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Staff } from '../domain/types';
import { useStore } from '../store/store';
import { Avatar, Button, Callout } from '../ui';
import { AuthCard, BrandMark } from './AuthCard';

export function PinSwitch({ onCancel }: { onCancel: () => void }) {
  const { state, actions, me } = useStore();
  const nav = useNavigate();
  const location = me?.location ?? 'North Center';
  const people = state.staff.filter((s) => s.role === 'care' && s.status === 'active' && s.location === location);
  const [who, setWho] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();

  const tryPin = (value: string) => {
    if (!who) return;
    if (value === who.pin) {
      if (me && me.id !== who.id) actions.signOut(`Locked shared iPad; handed over to ${who.name}`);
      actions.signIn(who.id, 'care', 'pin');
      nav('/care/clients');
    } else { setError('Incorrect PIN.'); setPin(''); }
  };
  const press = (k: string) => {
    setError(undefined);
    if (k === 'del') return setPin((p) => p.slice(0, -1));
    const next = (pin + k).slice(0, 4);
    setPin(next);
    if (next.length === 4) tryPin(next);
  };

  return (
    <AuthCard surface="care">
      <BrandMark surface="care" />
      <h1 className="auth-title">Switch user</h1>
      <p className="muted small" style={{ marginTop: 0 }}>Shared iPad · {location}. Entries are attributed to whoever switches in.</p>
      <div className="proto-note" data-demo style={{ marginTop: 0, marginBottom: 12 }}><strong>Future / recommended enhancement - not in the Phase 1 baseline or estimate.</strong> Phase 1 hand-over is log out, then sign in with your own account.</div>
      {!who ? (
        <div className="pin-people">
          {people.map((p) => (
            <button key={p.id} type="button" className={`pin-person ${me?.id === p.id ? 'current' : ''}`} onClick={() => setWho(p)}>
              <Avatar name={p.name} /><span><strong>{p.name}</strong><span className="small muted">{p.title}{me?.id === p.id ? ' · current' : ''}</span></span>
            </button>
          ))}
        </div>
      ) : (
        <div className="stack" style={{ alignItems: 'center' }}>
          <div className="row"><Avatar name={who.name} /><strong>{who.name}</strong></div>
          <div className="pin-dots" aria-label={`${pin.length} of 4 digits entered`}>{[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}</div>
          {error && <Callout tone="danger">{error}</Callout>}
          <div className="pin-pad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => k === '' ? <span key={i} /> : (
              <button key={i} type="button" onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k}>{k === 'del' ? '⌫' : k}</button>
            ))}
          </div>
          <div className="proto-note" data-demo>Prototype: PIN is the last four digits of the employee ID (<code>{who.pin}</code>). <button type="button" className="link" onClick={() => { setPin(who.pin!); tryPin(who.pin!); }}>Fill PIN</button></div>
          <Button variant="ghost" onClick={() => { setWho(null); setPin(''); }}>Choose someone else</Button>
        </div>
      )}
      <div style={{ marginTop: 12 }}><Button variant="ghost" onClick={onCancel}>Use email and password instead</Button></div>
    </AuthCard>
  );
}
