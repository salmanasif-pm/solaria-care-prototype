// 2.1 invitation activation, 2.4 password recovery, 2.2 terms acceptance. All simulated.
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { Surface } from '../domain/types';
import { useStore } from '../store/store';
import { useFeature } from '../features/FeatureContext';
import { Button, Callout, Check, Field, Input } from '../ui';
import { AuthCard, BrandMark } from './AuthCard';

export function Activate() {
  const { state, actions } = useStore();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string | null>(null);
  const pendingInvite = state.staff.find((s) => s.status === 'invited');
  const pinOn = useFeature('quickSwitch'); // PIN only matters for the future quick-switch idea

  const submit = () => {
    if (!code.trim()) return setError('Enter the invitation code from your email.');
    if (pw.length < 8) return setError('Choose a password of at least 8 characters.');
    if (pw !== pw2) return setError('Passwords do not match.');
    if (pinOn && !/^\d{4}$/.test(pin)) return setError('Choose a 4-digit PIN for quick switching on shared iPads.');
    const r = actions.activateAccount(code, pin);
    if (!r.ok) return setError(r.error);
    setDone(r.user.name);
  };

  return (
    <AuthCard surface="care">
      <BrandMark surface="care" />
      {done ? (
        <div className="stack">
          <Callout tone="success">Account activated for <strong>{done}</strong>. Sign in with your email and the demo password.</Callout>
          <Button variant="primary" size="lg" onClick={() => nav('/care/signin')}>Go to sign in</Button>
        </div>
      ) : (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
          <h1 className="auth-title">Activate your account</h1>
          <p className="muted small" style={{ marginTop: 0 }}>Accounts are created by an administrator. There is no public sign-up.</p>
          <Field label="Invitation code" required><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SOL-0000" /></Field>
          <div className="grid-2">
            <Field label="New password" required><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
            <Field label="Confirm password" required><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
          </div>
          {pinOn && <Field label="Personal PIN (4 digits)" required help="Future idea (not in Phase 1): used to switch users on a shared iPad"><Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} /></Field>}
          {error && <Callout tone="danger">{error}</Callout>}
          <Button type="submit" variant="primary" size="lg" block>Activate account</Button>
          <Link to="/care/signin" className="small">Back to sign in</Link>
          {pendingInvite?.inviteCode && (
            <div className="proto-note" data-demo>Prototype: pending invitation for {pendingInvite.name} uses code <code>{pendingInvite.inviteCode}</code>.{' '}
              <button type="button" className="link" onClick={() => { setCode(pendingInvite.inviteCode!); setPw('password1'); setPw2('password1'); setPin('2040'); }}>Fill</button>
            </div>
          )}
        </form>
      )}
    </AuthCard>
  );
}

export function Forgot({ surface }: { surface: Surface }) {
  const { actions } = useStore();
  const [id, setId] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <AuthCard surface={surface}>
      <BrandMark surface={surface} />
      {sent ? (
        <div className="stack">
          <Callout tone="success">If an account matches, a single-use reset link has been sent. It expires in 30 minutes; completing a reset ends all active sessions.</Callout>
          <Link to={`/${surface}/signin`}>Back to sign in</Link>
        </div>
      ) : (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (id.trim()) { actions.requestPasswordReset(id.trim()); setSent(true); } }}>
          <h1 className="auth-title">Reset password</h1>
          <Field label="Email or employee ID" required><Input value={id} onChange={(e) => setId(e.target.value)} /></Field>
          <Button type="submit" variant="primary" size="lg" block disabled={!id.trim()}>Send reset link</Button>
          <Link to={`/${surface}/signin`} className="small">Back to sign in</Link>
        </form>
      )}
    </AuthCard>
  );
}

export function Terms({ surface }: { surface: Surface }) {
  const { state, actions, me } = useStore();
  const nav = useNavigate();
  const [agree, setAgree] = useState(false);
  if (!me) return <Navigate to={`/${surface}/signin`} replace />;
  return (
    <AuthCard surface={surface}>
      <BrandMark surface={surface} />
      <h1 className="auth-title">Terms of use · v{state.termsVersion}</h1>
      <div className="terms-box">
        <p><strong>Placeholder text.</strong> The client-approved terms document will be supplied before launch (roadmap 2.2).</p>
        <p>You will access protected health information only for the clients you are assigned to, keep your credentials and PIN private, lock or switch user before handing over a shared device, and report suspected misuse.</p>
      </div>
      <Check label="I have read and accept the current terms of use" checked={agree} onChange={setAgree} />
      <div className="row" style={{ marginTop: 12 }}>
        <Button variant="ghost" onClick={() => { actions.signOut('Declined terms; signed out'); nav(`/${surface}/signin`); }}>Decline and sign out</Button>
        <Button variant="primary" disabled={!agree} onClick={() => { actions.acceptTerms(me.id); nav(surface === 'admin' ? '/admin' : '/care/clients'); }}>Accept and continue</Button>
      </div>
    </AuthCard>
  );
}
