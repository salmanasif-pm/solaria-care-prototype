// Today's Care across all permitted clients - the same derived items as each client workspace.
import { useState } from 'react';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { clientName, permittedClients, todaysCare, type TodayItem } from '../domain/care';
import { fmtTime, toMinutes, today } from '../domain/time';
import { Card, Tabs } from '../ui';
import { TodaysCareList } from './TodaysCare';

export function TodayAll() {
  const { state, me } = useStore();
  const f = useFeatures();
  const [filter, setFilter] = useState<'open' | 'all' | 'done'>('open');
  const T = today();
  const clients = permittedClients(state, me);
  const all: TodayItem[] = clients.flatMap((c) => todaysCare(state, c.id, T, state.demoTime, { includeSchedule: true, includeMeds: f.on('medications') }));
  all.sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const open = all.filter((i) => i.status === 'due' || i.status === 'overdue' || i.status === 'upcoming');
  const done = all.filter((i) => i.status === 'completed' || i.status === 'not-done');
  const shown = filter === 'open' ? open : filter === 'done' ? done : all;
  const names = Object.fromEntries(clients.map((c) => [c.id, clientName(c)]));
  const overdue = all.filter((i) => i.status === 'overdue').length;
  const due = all.filter((i) => i.status === 'due').length;

  return (
    <div className="page">
      <div className="page-head"><div className="titles"><h1>Today's care</h1><p className="lede">All scheduled care for your clients · now {fmtTime(state.demoTime)} · {overdue} overdue · {due} due now</p></div></div>
      <Card>
        <Tabs value={filter} onChange={setFilter} items={[{ key: 'open', label: 'To do', count: open.length }, { key: 'done', label: 'Done', count: done.length }, { key: 'all', label: 'All', count: all.length }]} />
        <div style={{ marginTop: 12 }}><TodaysCareList items={shown} showClient={(id) => names[id]} /></div>
      </Card>
    </div>
  );
}
