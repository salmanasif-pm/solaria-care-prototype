// 3.1 View client care instructions and today's schedule. Tapping an item opens its documentation form.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TodayItem } from '../domain/care';
import { fmtTime, shortName } from '../domain/time';
import { useStore } from '../store/store';
import { Badge, Button, Confirm, Empty, Field, Icon, Textarea, useToast } from '../ui';

export const STATUS_BADGE: Record<TodayItem['status'], { tone: 'green' | 'amber' | 'red' | 'outline' | 'neutral'; label: string }> = {
  completed: { tone: 'green', label: 'Completed' },
  'not-done': { tone: 'neutral', label: 'Not done' },
  overdue: { tone: 'red', label: 'Overdue' },
  due: { tone: 'amber', label: 'Due now' },
  upcoming: { tone: 'outline', label: 'Upcoming' },
};

export function TodaysCareList({ items, clientId, editable = true, showClient }: { items: TodayItem[]; clientId?: string; editable?: boolean; showClient?: (id: string) => string }) {
  const nav = useNavigate();
  const { state, actions } = useStore();
  const toast = useToast();
  const [nd, setNd] = useState<TodayItem | null>(null);
  const [reason, setReason] = useState('');
  if (items.length === 0) return <Empty title="No scheduled care today" hint="Scheduled activities and medication doses set up in Web Admin appear here." icon="calendar" />;

  return (
    <>
      <ul className="care-items">
        {items.map((i) => {
          const b = STATUS_BADGE[i.status];
          const who = i.entry && state.staff.find((s) => s.id === i.entry!.staffId);
          const open = () => nav(`/care/clients/${i.clientId}/document/${i.docKind}?ref=${encodeURIComponent(i.ref)}`);
          const actionable = editable && i.status !== 'completed';
          return (
            <li key={i.ref} className={`care-item s-${i.status}`}>
              <button type="button" className="ci-main" onClick={actionable ? open : undefined} disabled={!actionable} aria-label={`${fmtTime(i.time)} ${i.name}, ${b.label}`}>
                <span className="ci-time">{fmtTime(i.time)}</span>
                <span className="ci-text">
                  <strong>{showClient ? `${showClient(i.clientId)} · ` : ''}{i.name}</strong>
                  <span className="small muted">
                    {i.status === 'completed' && i.entry ? <>Documented {fmtTime(i.entry.careTime)} by {who ? shortName(who.name) : '—'}{i.docKind === 'medication' ? ` · ${String(i.entry.data.status ?? '')}` : ''}</> : i.status === 'not-done' ? <>Not done: {i.notDoneReason}</> : i.instructions}
                  </span>
                </span>
                <Badge tone={b.tone} dot>{b.label}</Badge>
                {actionable && <Icon name="chevronRight" size={16} className="muted" />}
              </button>
              {actionable && i.status !== 'not-done' && (
                <button type="button" className="ci-nd" onClick={() => { setNd(i); setReason(''); }} aria-label={`Mark ${i.name} not done`}>Not done</button>
              )}
            </li>
          );
        })}
      </ul>
      {nd && (
        <Confirm title="Mark as not done" confirmLabel="Save" onCancel={() => setNd(null)}
          onConfirm={() => { if (!reason.trim()) return; actions.markNotDone(clientId ?? nd.clientId, nd.ref, nd.name, reason.trim()); setNd(null); toast('Recorded as not done', 'info'); }}>
          <p><strong>{fmtTime(nd.time)} · {nd.name}</strong></p>
          <Field label="Reason" required><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Client asleep - re-offer at 11:30" autoFocus /></Field>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {['Client asleep', 'Client declined', 'Client absent', 'Parent request'].map((r) => <Button key={r} size="sm" variant="ghost" onClick={() => setReason(r)}>{r}</Button>)}
          </div>
        </Confirm>
      )}
    </>
  );
}
