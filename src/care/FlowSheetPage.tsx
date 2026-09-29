// Today's daily flow sheet (4.1 / 4.6): one record per client and care date, built from the shared entries.
import { useState } from 'react';
import type { Client } from '../domain/types';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { contributors, entriesFor, KIND_LABEL, sheetFor } from '../domain/care';
import { fmtStamp, fmtTime, today } from '../domain/time';
import { Badge, Callout, Card, LinkButton, Tabs } from '../ui';
import { StaffChip, Timeline } from './Timeline';

export function HourlyView({ entries }: { entries: ReturnType<typeof entriesFor> }) {
  const { state } = useStore();
  const hours = Array.from({ length: 12 }, (_, i) => 7 + i); // 07:00-18:00 display default (roadmap 4.2 note)
  const outside = entries.filter((e) => { const h = Number(e.careTime.slice(0, 2)); return h < 7 || h > 18; });
  return (
    <div className="hourly">
      {hours.map((h) => {
        const list = entries.filter((e) => Number(e.careTime.slice(0, 2)) === h);
        return (
          <div key={h} className={`hour ${list.length ? '' : 'empty'}`}>
            <div className="hour-l">{fmtTime(`${String(h).padStart(2, '0')}:00`)}</div>
            <div className="hour-entries">
              {list.map((e) => {
                const s = state.staff.find((x) => x.id === e.staffId);
                return (
                  <div key={e.id} className={`hour-entry k-${e.kind}`}>
                    <span className="small muted">{fmtTime(e.careTime)}</span> <strong>{e.kind === 'activity' ? e.title : KIND_LABEL[e.kind]}</strong> <span>{e.summary}</span> <StaffChip staff={s} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {outside.length > 0 && <p className="small muted">{outside.length} entries outside 7 AM - 6 PM are shown in the timeline view.</p>}
    </div>
  );
}

export function FlowSheetPage({ client }: { client: Client }) {
  const { state } = useStore();
  const f = useFeatures();
  const [view, setView] = useState<'timeline' | 'hourly'>('timeline');
  const T = today();
  const sheet = sheetFor(state, client.id, T);
  const entries = entriesFor(state, client.id, T, view === 'hourly' ? 'asc' : 'desc');
  const people = contributors(state, client.id, T);
  const byKind = Object.entries(entries.reduce<Record<string, number>>((a, e) => ({ ...a, [KIND_LABEL[e.kind]]: (a[KIND_LABEL[e.kind]] ?? 0) + 1 }), {}));
  const completer = sheet?.completedBy && state.staff.find((s) => s.id === sheet.completedBy);

  return (
    <Card title="Daily flow sheet" sub={<>Care date today · {entries.length} entries{byKind.length ? ` · ${byKind.map(([k, n]) => `${n} ${k}`).join(', ')}` : ''}</>}
      actions={<>
        {sheet?.status === 'completed' ? <Badge tone="green" dot>Completed</Badge> : <Badge tone="blue" dot>Open</Badge>}
        {f.on('completionSignoff') && sheet?.status !== 'completed' && <LinkButton size="sm" to={`/care/clients/${client.id}/complete`} variant="secondary" icon="sign">Review &amp; complete</LinkButton>}
      </>}>
      {sheet?.status === 'completed' && <Callout tone="success" icon="lock">Completed {sheet.completedAt ? fmtStamp(sheet.completedAt) : ''}{completer ? ` by ${completer.name}` : ''}. The record is read-only; new entries are added as attributed addenda.</Callout>}
      <div className="row between" style={{ margin: '4px 0 12px', flexWrap: 'wrap', gap: 8 }}>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{people.map((p) => <StaffChip key={p.id} staff={p} />)}</div>
        <Tabs value={view} onChange={setView} items={[{ key: 'timeline', label: 'Timeline' }, { key: 'hourly', label: 'Hourly view' }]} />
      </div>
      <div data-tour="timeline">
        {view === 'timeline' ? <Timeline entries={entries} allowCorrect empty="No entries yet today" /> : <HourlyView entries={entries} />}
      </div>
    </Card>
  );
}
