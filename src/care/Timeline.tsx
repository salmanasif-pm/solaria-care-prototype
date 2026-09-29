// 4.6 Shared daily timeline. Aggregates entries from every documentation module; staff never re-enter
// information to make it appear here. Corrections are appended; the original stays visible.
import { useState } from 'react';
import type { DocKind, FlowEntry, Staff } from '../domain/types';
import { correctedIds } from '../domain/care';
import { fmtStamp, fmtTime } from '../domain/time';
import { useStore } from '../store/store';
import { Badge, Button, Confirm, Empty, Field, Icon, Textarea, useToast, type IconName } from '../ui';

const KIND_ICON: Record<DocKind, IconName> = { observations: 'heart', intakeOutput: 'droplet', assessment: 'steth', activity: 'hand', medication: 'pill', specializedCare: 'tube', note: 'edit' };
const HUES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
export function staffHue(id: string) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return HUES[h % HUES.length]; }

export function StaffChip({ staff }: { staff?: Staff }) {
  if (!staff) return <span className="staff-chip">Unknown</span>;
  const initials = staff.name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  return (
    <span className={`staff-chip ${staffHue(staff.id)}`} title={`${staff.name}, ${staff.title}${staff.status === 'inactive' ? ' (account now inactive)' : ''}`}>
      <span className="sc-av" aria-hidden>{initials}</span>
      {staff.name.split(' ')[0]} {staff.name.split(' ')[1]?.[0]}.<span className="sc-title">{staff.title !== 'Direct-Care Staff' ? staff.title : 'Staff'}</span>
    </span>
  );
}

export function Timeline({ entries, allowCorrect, empty, compact, max }: { entries: FlowEntry[]; allowCorrect?: boolean; empty?: string; compact?: boolean; max?: number }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<FlowEntry | null>(null);
  const [reason, setReason] = useState('');
  const corrected = correctedIds(entries);
  const list = max ? entries.slice(0, max) : entries;
  if (entries.length === 0) return <Empty title={empty ?? 'Nothing documented yet'} hint="Entries from every staff member appear here as they are saved." icon="clipboard" />;

  return (
    <>
      <ol className={`timeline ${compact ? 'compact' : ''}`}>
        {list.map((e) => {
          const s = state.staff.find((x) => x.id === e.staffId);
          const isOpen = open === e.id;
          const entered = new Date(e.enteredAt);
          const late = Math.abs(entered.getHours() * 60 + entered.getMinutes() - (Number(e.careTime.slice(0, 2)) * 60 + Number(e.careTime.slice(3)))) > 30;
          return (
            <li key={e.id} className={`tl-item k-${e.kind} ${corrected.has(e.id) ? 'corrected' : ''}`}>
              <div className="tl-time">{fmtTime(e.careTime)}</div>
              <div className="tl-dot" aria-hidden><Icon name={KIND_ICON[e.kind]} size={14} /></div>
              <div className="tl-body">
                <button type="button" className="tl-main" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}>
                  <span className="tl-title">{e.title}</span>
                  <span className="tl-summary">{e.summary}</span>
                </button>
                <div className="tl-meta">
                  <StaffChip staff={s} />
                  {corrected.has(e.id) && <Badge tone="amber">Corrected - see correction</Badge>}
                  {e.correctionOf && <Badge tone="amber">Correction</Badge>}
                  {e.addendum && <Badge tone="outline">Addendum</Badge>}
                  {e.scheduleRef && !compact && <Badge tone="outline">Scheduled care</Badge>}
                  {late && <span className="small muted">entered {fmtStamp(e.enteredAt)}</span>}
                </div>
                {isOpen && (
                  <div className="tl-details">
                    <dl className="kv">{e.details.map(([k, v], i) => <div key={i} className="kv-row"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                    <div className="small muted">Saved {fmtStamp(e.enteredAt)} by {s?.name}{s ? `, ${s.title}` : ''}</div>
                    {allowCorrect && !e.correctionOf && !corrected.has(e.id) && (
                      <Button size="sm" variant="ghost" icon="edit" onClick={() => { setCorrecting(e); setReason(''); }}>Record a correction</Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {max && entries.length > max && <p className="small muted" style={{ margin: '8px 0 0 72px' }}>+ {entries.length - max} earlier entries in the flow sheet</p>}
      {correcting && (
        <Confirm title="Record a correction" confirmLabel="Save correction" onCancel={() => setCorrecting(null)}
          onConfirm={() => { if (!reason.trim()) return; actions.correctEntry(correcting.id, reason.trim()); setCorrecting(null); toast('Correction recorded - original entry retained'); }}>
          <p className="small muted">The original entry is never overwritten. Your correction is added with your name and the time.</p>
          <p><strong>{fmtTime(correcting.careTime)} · {correcting.title}</strong><br /><span className="muted">{correcting.summary}</span></p>
          <Field label="What is being corrected and why" required><Textarea rows={3} value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="e.g. Amount was 100 mL, not 120 mL" autoFocus /></Field>
        </Confirm>
      )}
    </>
  );
}
