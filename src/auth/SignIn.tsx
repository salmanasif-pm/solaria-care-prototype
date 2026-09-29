// 2.3 Full-credential sign-in (common to both surfaces) with simulated MFA. Not real authentication.
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Staff, Surface } from '../domain/types';
import { useStore } from '../store/store';
import { useFeature } from '../features/FeatureContext';
import { DEMO_PASSWORD, MFA_DEMO_CODE } from '../data/seed';
import { Button, Callout, Field, Icon, Input } from '../ui';
import { AuthCard, BrandMark } from './AuthCard';
import { PinSwitch } from './PinSwitch';

export function SignIn({ surface }: { surface: Surface }) {
  const { state, actions } = useStore();
  const mfaOn = useFeature('mfa');
  const quickSwitch = useFeature('quickSwitch');
  const lifecycle = useFeature('accountLifecycle');
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<Staff | null>(null);
  const [error, setError] = useState<string>();
  const [pinMode, setPinMode] = useState(false);
  const ended = params.get('ended');

  const home = surface === 'admin' ? '/admin' : '/care/clients';
  const finish = (u: Staff, how: string) => {
    actions.signIn(u.id, surface, 'credentials', how);
    nav(params.get('next') ?? home);
  };

  const submitCredentials = () => {
    setError(undefined);
    const key = id.trim().toLowerCase();
    if (!key || !pw) return setError('Enter your email or employee ID and password.');
    const u = state.staff.find((s) => s.email.toLowerCase() === key || s.employeeId.toLowerCase() === key);
    // Safe, generic error: never reveals whether the account exists.
    if (!u || pw !== DEMO_PASSWORD) { actions.logFailedSignIn(id.trim()); return setError('Those credentials were not recognised. Check them and try again.'); }
    if (u.status === 'inactive') return setError('This account is inactive. Contact your administrator.');
    if (u.status === 'invited') return setError('This account has not been activated yet. Use your invitation code to activate it.');
    if (surface === 'admin' && u.role !== 'admin') return setError('This account does not have Web Admin access. Care Staff sign in on the iPad app.');
    if (surface === 'care' && u.role !== 'care') return setError('Administrative users sign in to the Web Admin. The iPad app is for Care Staff documentation.');
    if (mfaOn) { setPending(u); return; }
    finish(u, `Signed in to ${surface === 'admin' ? 'Web Admin' : 'Care Staff iPad'} (password)`);
  };
  const submitCode = () => {
    if (code.replace(/\s/g, '') !== MFA_DEMO_CODE) return setError('That code is incorrect or has expired.');
    finish(pending!, `Signed in to ${surface === 'admin' ? 'Web Admin' : 'Care Staff iPad'} (password + MFA)`);
  };
  const demoAccount = surface === 'admin' ? state.staff.find((s) => s.id === 'u_dana')! : state.staff.find((s) => s.id === 'u_sarah')!;

  if (pinMode) return <PinSwitch onCancel={() => setPinMode(false)} />;

  return (
    <AuthCard surface={surface}>
      <div data-tour="signin">
        <BrandMark surface={surface} />
        {ended && <Callout tone="success" icon="lock">You have been signed out and the session was ended on this device.</Callout>}
        {!pending ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); submitCredentials(); }} noValidate>
            <h1 className="auth-title">Sign in</h1>
            <Field label="Email or employee ID" required><Input autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} placeholder="name@solaria.example or SC-0000" autoFocus /></Field>
            <Field label="Password" required><Input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
            {error && <Callout tone="danger">{error}</Callout>}
            <Button type="submit" variant="primary" size="lg" block>Continue</Button>
            <div className="row between small">
              {lifecycle ? <Link to={`/${surface}/forgot`}>Forgot password?</Link> : <span />}
              {lifecycle && surface === 'care' && <Link to="/care/activate">Activate invited account</Link>}
            </div>
            {surface === 'care' && quickSwitch && (
              <button type="button" className="pin-entry-btn" onClick={() => setPinMode(true)}>
                <Icon name="swap" size={16} /> Future idea (not in Phase 1): switch user with PIN
              </button>
            )}
          </form>
        ) : (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); submitCode(); }} noValidate>
            <h1 className="auth-title">Verify it's you</h1>
            <p className="muted" style={{ margin: 0 }}>Enter the 6-digit code from your authenticator app for <strong>{pending.email}</strong>.</p>
            <Field label="Verification code" required><Input inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => { setCode(e.target.value); setError(undefined); }} className="code-input" autoFocus /></Field>
            {error && <Callout tone="danger">{error}</Callout>}
            <Button type="submit" variant="primary" size="lg" block>Verify and sign in</Button>
            <Button variant="ghost" onClick={() => { setPending(null); setCode(''); }}>Back</Button>
          </form>
        )}
        <div className="proto-note" data-demo>
          <strong>Prototype sign-in</strong> - simulated, no real authentication.
          {!pending ? (
            <> Password for every demo account is <code>{DEMO_PASSWORD}</code>.{' '}
              <button type="button" className="link" onClick={() => { setId(demoAccount.email); setPw(DEMO_PASSWORD); setError(undefined); }}>Use {demoAccount.name}</button>
            </>
          ) : (
            <> Demo code <code>{MFA_DEMO_CODE}</code>. <button type="button" className="link" onClick={() => setCode(MFA_DEMO_CODE)}>Fill code</button></>
          )}
        </div>
      </div>
    </AuthCard>
  );
}
