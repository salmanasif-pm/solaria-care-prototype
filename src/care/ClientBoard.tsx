// 4.1 / 3.1 Care-area client board - the Care Staff landing screen.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { careCounts, clientName, lastDocumented, permittedClients, sheetFor, todaysCare } from '../domain/care';
import { ageLabel, fmtDate, fmtTime, shortName, today } from '../domain/time';
import { Badge, Empty, Icon, Input } from '../ui';
import { clientIndicators } from '../shared/indicators';

export function ClientBoard() {
  const { state, me } = useStore();
  const f = useFeatures();
  const [q, setQ] = useState('');
  const [area, setArea] = useState<string>('all');
  const T = today();
  const clients = permittedClients(state, me);
  const areas = [...new Set(clients.map((c) => c.careArea))];
  const shown = clients.filter((c) => (area === 'all' || c.careArea === area) && clientName(c).toLowerCase().includes(q.trim().toLowerCase()));
  const schedOn = f.on('careSchedule');
  const medsOn = f.on('medications');

  const rows = useMemo(() => shown.map((c) => {
    const items = schedOn ? todaysCare(state, c.id, T, state.demoTime, { includeSchedule: true, includeMeds: medsOn }) : [];
    return { c, counts: careCounts(items), last: lastDocumented(state, c.id, T), sheet: sheetFor(state, c.id, T), next: items.find((i) => i.status === 'overdue' || i.status === 'due' || i.status === 'upcoming') };
  }), [shown, state, T, schedOn, medsOn]);

  return (
    <div className="page">
      <div className="page-head">
        <div className="titles">
          <h1>Clients</h1>
          <p className="lede">{me?.location} · {fmtDate(T, { weekday: 'long', month: 'long', day: 'numeric' })} · showing clients in your care areas</p>
        </div>
        <div className="search"><Icon name="search" size={16} /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients" aria-label="Search clients" /></div>
      </div>
      <div className="chips" data-tour="area-filter" role="tablist" aria-label="Care area">
        <button type="button" role="tab" aria-selected={area === 'all'} className={area === 'all' ? 'on' : ''} onClick={() => setArea('all')}>All areas <span className="n">{clients.length}</span></button>
        {areas.map((a) => (
          <button key={a} type="button" role="tab" aria-selected={area === a} className={area === a ? 'on' : ''} onClick={() => setArea(a)}>{a} <span className="n">{clients.filter((c) => c.careArea === a).length}</span></button>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty title="No clients match" hint={clients.length ? 'Try another care area or clear the search.' : 'You are not assigned to any care area with active clients. Ask an administrator.'} icon="users" />
      ) : (
        <div className="client-grid" data-tour="client-board">
          {rows.map(({ c, counts, last, sheet, next }) => {
            const staff = last && state.staff.find((s) => s.id === last.staffId);
            const ind = clientIndicators(state, c, f.on('specializedCare'));
            const attention = counts.overdue > 0;
            return (
              <Link key={c.id} to={`/care/clients/${c.id}`} className={`client-card ${attention ? 'attention' : ''}`}>
                <div className="cc-top">
                  <div>
                    <h2>{clientName(c)}</h2>
                    <div className="muted small">{ageLabel(c.dob)} · DOB {fmtDate(c.dob)}</div>
                  </div>
                  {sheet?.status === 'completed' ? <Badge tone="green" dot>Flow sheet completed</Badge> : last ? <Badge tone="blue" dot>In progress</Badge> : <Badge tone="outline">Not started</Badge>}
                </div>
                <div className="cc-area">{c.careArea}</div>
                {ind.length > 0 && <div className="tags">{ind.slice(0, 3).map((i) => <span key={i.label} className={`tag ${i.kind}`}>{i.label}</span>)}</div>}
                {schedOn && (
                  <div className="cc-counts">
                    {counts.overdue > 0 && <span className="cnt red"><strong>{counts.overdue}</strong> overdue</span>}
                    <span className={`cnt ${counts.due ? 'amber' : ''}`}><strong>{counts.due}</strong> due now</span>
                    <span className="cnt green"><strong>{counts.completed}</strong>/{counts.total} done</span>
                  </div>
                )}
                {schedOn && next && <div className="cc-next small">Next: {fmtTime(next.time)} · {next.name}</div>}
                <div className="cc-foot small muted">
                  {last ? <>Last documented {fmtTime(last.careTime)} · {staff ? shortName(staff.name) : ''}</> : 'Nothing documented yet today'}
                  <Icon name="chevronRight" size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
