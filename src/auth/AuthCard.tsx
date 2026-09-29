import type { ReactNode } from 'react';
import type { Surface } from '../domain/types';

export function BrandMark({ surface }: { surface: Surface }) {
  return (
    <div className="brand-mark">
      <span className="logo" aria-hidden><svg viewBox="0 0 32 32" width="30" height="30"><rect width="32" height="32" rx="7" fill="currentColor" /><path d="M16 8v16M8 16h16" stroke="#fff" strokeWidth="4" strokeLinecap="round" /><circle cx="23.5" cy="8.5" r="3" fill="#2bb3a0" /></svg></span>
      <div>
        <strong>Solaria Care</strong>
        <span>{surface === 'admin' ? 'Web Admin' : 'Care Documentation · iPad'}</span>
      </div>
    </div>
  );
}

export function AuthCard({ surface, children }: { surface: Surface; children: ReactNode }) {
  return (
    <div className={`auth-screen ${surface}`}>
      <div className="auth-card">{children}</div>
      <p className="auth-foot">Access to client information requires an individual, authenticated account. Activity is recorded.</p>
    </div>
  );
}
