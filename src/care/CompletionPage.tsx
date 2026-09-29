// 5.1 Complete, review and sign a daily flow sheet. One end-of-day workflow owns completion, sign-off and
// parent-copy status. Which signatures are required is configuration pending nursing confirmation.
import { useNavigate } from 'react-router-dom';
import type { Client, SignoffRole } from '../domain/types';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { careCounts, completionGaps, contributors, entriesFor, sheetFor, todaysCare } from '../domain/care';
import { fmtStamp, today } from '../domain/time';
import { Badge, Button, Callout, Card, Choice, Field, Textarea, useToast } from '../ui';
import { StaffChip } from './Timeline';

/** Signature areas from the supplied flow sheet. Which are required is TBD with nursing leadership (roadmap
 *  question 3), so none is modelled as mandatory; the prototype only asks for at least one signature. */
export const SIGNOFF_ROLES: { role: SignoffRole; required: boolean; hint: string }[] = [
  { role: 'PCA', required: false, hint: 'Signature area on the current paper form' },
  { role: 'Licensed Nurse', required: false, hint: 'Signature area on the current paper form' },
  { role: 'RN', required: false, hint: 'Signature area on the current paper form' },
];

export function CompletionPage({ client }: { client: Client }) {
  const { state, actions, me } = useStore();
  const f = useFeatures();
  const nav = useNavigate();
  const toast = useToast();
  const T = today();
  const sheet = sheetFor(state, client.id, T);
  if (!sheet) return null;
  const done = sheet.status === 'completed';
  const entries = entriesFor(state, client.id, T);
  const items = f.on('careSchedule') ? todaysCare(state, client.id, T, state.demoTime, { includeSchedule: true, includeMeds: f.on('medications') }) : [];
  const counts = careCounts(items);
  const open = items.filter((i) => i.status !== 'completed' && i.status !== 'not-done');
  const gaps = completionGaps(sheet, SIGNOFF_ROLES.filter((r) => r.required).map((r) => r.role));
  const people = contributors(state, client.id, T);

  const complete = () => {
    if (gaps.length) return;
    actions.completeSheet(sheet.id);
    toast(`${client.firstName}'s flow sheet completed and locked`);
    nav(`/care/clients/${client.id}/flow-sheet`);
  };

  return (
    <div className="ws-grid">
      <Card title="Review" sub="Check the day's record before signing.">
        <div className="review-stats">
          <div><strong>{entries.length}</strong><span>entries</span></div>
          <div><strong>{people.length}</strong><span>contributors</span></div>
          {items.length > 0 && <div><strong>{counts.completed}/{counts.total}</strong><span>scheduled care done</span></div>}
          {items.length > 0 && <div className={open.length ? 'warn' : ''}><strong>{open.length}</strong><span>not yet documented</span></div>}
        </div>
        {open.length > 0 && !done && (
          <Callout tone="warn">
            Scheduled care still open: {open.map((i) => i.name).join(', ')}. Document it or mark it not done with a reason before completing. (Completion is not blocked in the prototype - this rule is pending nursing confirmation.)
          </Callout>
        )}
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{people.map((p) => <StaffChip key={p.id} staff={p} />)}</div>
        <Field label="Review note" className="mt">
          <Textarea rows={3} value={sheet.reviewNote} disabled={done} onChange={(e) => actions.setParentCopy(sheet.id, { reviewNote: e.target.value })} placeholder="Optional end-of-day note" />
        </Field>
      </Card>
      <div className="stack">
        <Card title="Sign-off" sub="Signature areas from the supplied flow sheet. Which signatures are required - and by whom - is to be confirmed with nursing leadership." id="signoff">
          <div className="signoffs" data-tour="signoff">
            {SIGNOFF_ROLES.map((r) => {
              const s = sheet.signoffs.find((x) => x.role === r.role);
              const who = s && state.staff.find((x) => x.id === s.staffId);
              return (
                <div key={r.role} className={`signoff ${s ? 'signed' : ''}`}>
                  <div className="grow">
                    <strong>{r.role} signature</strong> {r.required ? <Badge tone="outline">Required</Badge> : <Badge tone="neutral">Requirement TBD</Badge>}
                    <div className="small muted">{s && who ? <>Signed by <strong>{who.name}, {who.title}</strong> · {fmtStamp(s.at)}</> : r.hint}</div>
                  </div>
                  {!done && (s ? (s.staffId === me?.id && <Button size="sm" variant="ghost" onClick={() => actions.removeSignoff(sheet.id, r.role)}>Remove my signature</Button>)
                    : <Button size="sm" icon="sign" onClick={() => { actions.signOff(sheet.id, r.role); toast(`Signed as ${r.role}`); }}>Sign as {me?.name.split(' ')[0]}</Button>)}
                </div>
              );
            })}
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>Prototype rule: at least one signature before completion; any signed-in Care Staff can sign any area. The required combination and who may sign each area are open questions for Solaria (not separate app roles).</p>
        </Card>
        <Card title="Parent copy">
          <Field label="Parent copy offered?">
            <Choice options={[{ key: 'yes', label: 'Yes' }, { key: 'no', label: 'No' }]} value={sheet.parentCopyOffered === null ? '' : sheet.parentCopyOffered ? 'yes' : 'no'} onChange={(v) => !done && actions.setParentCopy(sheet.id, { parentCopyOffered: v === '' ? null : v === 'yes' })} />
          </Field>
          {sheet.parentCopyOffered && (
            <Field label="Parent copy accepted?">
              <Choice options={[{ key: 'yes', label: 'Accepted' }, { key: 'no', label: 'Declined' }]} value={sheet.parentCopyAccepted === null ? '' : sheet.parentCopyAccepted ? 'yes' : 'no'} onChange={(v) => !done && actions.setParentCopy(sheet.id, { parentCopyAccepted: v === '' ? null : v === 'yes' })} />
            </Field>
          )}
          <p className="small muted" style={{ marginBottom: 0 }}>Recorded as a field on the record. There is no parent portal or messaging in Phase 1.</p>
        </Card>
        {done ? (
          <Callout tone="success" icon="lock">Completed {sheet.completedAt && fmtStamp(sheet.completedAt)}. Read-only; later entries are attributed addenda.</Callout>
        ) : (
          <div className="complete-bar">
            {gaps.length > 0 ? <span className="small muted">Still needed: {gaps.join(', ')}</span> : <span className="small">Ready to complete.</span>}
            <Button variant="primary" size="lg" icon="lock" disabled={gaps.length > 0} onClick={complete}>Complete flow sheet</Button>
          </div>
        )}
      </div>
    </div>
  );
}
