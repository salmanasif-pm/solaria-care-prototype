import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './icons';
import { initials } from '../domain/time';

export { Icon } from './icons';
export type { IconName } from './icons';

// ---------- Buttons ----------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; block?: boolean };
export function Button({ variant = 'secondary', size = 'md', icon, block, className = '', children, type = 'button', ...rest }: BtnProps) {
  return (
    <button type={type} className={['btn', variant, size, block ? 'block' : '', className].filter(Boolean).join(' ')} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}
export function LinkButton({ to, variant = 'secondary', size = 'md', icon, children, className = '', onClick }: { to: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className={['btn', variant, size, className].filter(Boolean).join(' ')}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </Link>
  );
}

// ---------- Status ----------
export type Tone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'outline';
export function Badge({ tone = 'neutral', children, dot, title }: { tone?: Tone; children: React.ReactNode; dot?: boolean; title?: string }) {
  return <span className={`badge ${tone} ${dot ? 'dot' : ''}`} title={title}>{children}</span>;
}
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`avatar ${size}`} aria-hidden>{initials(name)}</span>;
}

// ---------- Layout ----------
export function PageHead({ title, lede, crumbs, actions }: { title: React.ReactNode; lede?: React.ReactNode; crumbs?: { to?: string; label: string }[]; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div className="titles">
        {crumbs && (
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevronRight" size={12} />}
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
export function Card({ title, sub, actions, children, className = '', pad = true, id }: { title?: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean; id?: string }) {
  return (
    <section className={`card ${className}`} id={id}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {typeof title === 'string' ? <h2>{title}</h2> : title}
            {sub && <p className="sub">{sub}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      {pad ? <div className="card-body">{children}</div> : children}
    </section>
  );
}
export function Callout({ tone = 'info', children, icon }: { tone?: 'info' | 'warn' | 'danger' | 'success' | 'neutral'; children: React.ReactNode; icon?: IconName }) {
  const ic: IconName = icon ?? (tone === 'warn' || tone === 'danger' ? 'alert' : tone === 'success' ? 'check' : 'info');
  return (
    <div className={`callout ${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={ic} size={16} />
      <div className="grow">{children}</div>
    </div>
  );
}
export function Empty({ title, hint, action, icon = 'list' }: { title: string; hint?: string; action?: React.ReactNode; icon?: IconName }) {
  return (
    <div className="empty">
      <span className="empty-ico"><Icon name={icon} size={20} /></span>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}
export function KV({ items }: { items: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v], i) => (
        <React.Fragment key={i}>
          <dt>{k}</dt>
          <dd>{v === '' || v === null || v === undefined ? '—' : v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: string; count?: number }[] }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button key={it.key} type="button" role="tab" aria-selected={value === it.key} className={`tab ${value === it.key ? 'active' : ''}`} onClick={() => onChange(it.key)}>
          {it.label}{it.count !== undefined && <span className="n">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- Forms ----------
export function Field({ label, required, help, error, children, className = '', htmlFor }: { label: React.ReactNode; required?: boolean; help?: React.ReactNode; error?: string; children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={htmlFor}>{label}{required && <span className="req" aria-hidden> *</span>}</label>
      {children}
      {error ? <span className="error">{error}</span> : help ? <span className="help">{help}</span> : null}
    </div>
  );
}
export function Input({ invalid, className = '', ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={`input ${invalid ? 'invalid' : ''} ${className}`} aria-invalid={invalid || undefined} {...rest} />;
}
export function Textarea({ invalid, className = '', ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={`input ${invalid ? 'invalid' : ''} ${className}`} aria-invalid={invalid || undefined} {...rest} />;
}
export function Select({ invalid, className = '', children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select className={`input ${invalid ? 'invalid' : ''} ${className}`} aria-invalid={invalid || undefined} {...rest}>{children}</select>;
}
export function Check({ label, checked, onChange, disabled }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
export function Toggle({ label, checked, onChange, disabled }: { label?: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`toggle ${disabled ? 'disabled' : ''}`}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" aria-hidden />
      {label && <span>{label}</span>}
    </label>
  );
}
/** Touch-friendly single / multi choice buttons (iPad forms). */
export function Choice<T extends string>({ options, value, onChange, allowClear = true, size = 'md', ariaLabel }: { options: readonly T[] | { key: T; label: string }[]; value: T | '' | null | undefined; onChange: (v: T | '') => void; allowClear?: boolean; size?: 'sm' | 'md'; ariaLabel?: string }) {
  const opts = (options as (T | { key: T; label: string })[]).map((o) => (typeof o === 'string' ? { key: o, label: o } : o));
  return (
    <div className={`choice ${size}`} role="radiogroup" aria-label={ariaLabel}>
      {opts.map((o) => (
        <button key={o.key} type="button" role="radio" aria-checked={value === o.key} className={value === o.key ? 'on' : ''} onClick={() => onChange(value === o.key && allowClear ? '' : o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function MultiChoice({ options, value, onChange, ariaLabel }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; ariaLabel?: string }) {
  return (
    <div className="choice" role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} className={on ? 'on' : ''} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>{o}</button>
        );
      })}
    </div>
  );
}

// ---------- Overlays ----------
export function Modal({ title, sub, onClose, children, footer, width = 560 }: { title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} style={{ maxWidth: width }}>
        <header className="modal-head">
          <div><h2>{title}</h2>{sub && <p className="sub">{sub}</p>}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
export function Confirm({ title, body, confirmLabel = 'Confirm', danger, onConfirm, onCancel, children }: { title: string; body?: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; children?: React.ReactNode }) {
  return (
    <Modal title={title} onClose={onCancel} width={460} footer={<><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></>}>
      {body && <p className="muted" style={{ margin: 0 }}>{body}</p>}
      {children}
    </Modal>
  );
}

// ---------- Toasts ----------
type Toast = { id: number; text: string; tone: 'success' | 'info' | 'warn' };
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-2), { id, text, tone }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}><Icon name={t.tone === 'warn' ? 'alert' : t.tone === 'info' ? 'info' : 'check'} size={16} />{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
