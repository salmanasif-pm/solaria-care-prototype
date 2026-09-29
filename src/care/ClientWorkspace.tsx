// Client care workspace: the operational hub. Works with every optional module removed
// (header + Add documentation + today's entries remain).
import { useEffect, type ReactNode } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Client } from '../domain/types';
import { useStore } from '../store/store';
import { useFeatures } from '../features/FeatureContext';
import { DOC_MODULES, FALLBACK_KIND } from '../features/modules';
import { feature } from '../features/registry';
import { careCounts, clientName, contributors, entriesFor, ioTotals, permittedClients, sheetFor, todaysCare } from '../domain/care';
import { ageLabel, cmToFtIn, fmtDate, kgToLb, today } from '../domain/time';
import { Badge, Button, Callout, Card, Empty, Icon, LinkButton } from '../ui';
import { clientIndicators } from '../shared/indicators';
import { Timeline, StaffChip } from './Timeline';
import { TodaysCareList } from './TodaysCare';
import { FlowSheetPage } from './FlowSheetPage';
import { CompletionPage } from './CompletionPage';

export function ClientWorkspace() {
  const { id } = useParams();
  const { state, me, actions } = useStore();
  const features = useFeatures();
  const client = state.clients.find((c) => c.id === id);
  const permitted = client && permittedClients(state, me).some((c) => c.id === client.id);
  const T = today();
  const hasSheet = !!(client && sheetFor(state, client.id, T));
  // Opening a client returns the existing daily record or safely initializes it (4.1).
  useEffect(() => { if (client && permitted && !hasSheet) actions.openSheet(client.id, T); }, [client, permitted, hasSheet, actions, T]);

  if (!client) return <div className="page"><Empty title="Client not found" hint="The client may have been removed from the demo data." action={<LinkButton to="/care/clients" variant="primary">Back to clients</LinkButton>} /></div>;
  if (!permitted) return <div className="page"><Empty icon="lock" title="Not in your care areas" hint={`${clientName(client)} is outside your assigned location or care areas. Access is limited to permitted clients.`} action={<LinkButton to="/care/clients" variant="primary">Back to clients</LinkButton>} /></div>;

  return (
    <div className="page workspace">
      <ClientHeader client={client} />
      <Routes>
        <Route index element={<Overview client={client} />} />
        <Route path="document" element={<><Overview client={client} /><DocPicker client={client} /></>} />
        <Route path="document/:kind" element={<><Overview client={client} /><DocSheet client={client} /></>} />
        <Route path="flow-sheet" element={<FlowSheetPage client={client} />} />
        <Route path="flow-sheet/document/:kind" element={<><FlowSheetPage client={client} /><DocSheet client={client} back="flow-sheet" /></>} />
        <Route path="complete" element={features.on('completionSignoff') ? <CompletionPage client={client} /> : <Empty icon="layers" title="Completion & sign-off is not in the current scope" />} />
      </Routes>
    </div>
  );
}

function ClientHeader({ client }: { client: Client }) {
  const { state } = useStore();
  const f = useFeatures();
  const loc = useLocation();
  const sheet = sheetFor(state, client.id, today());
  const ind = clientIndicators(state, client, f.on('specializedCare'));
  const base = `/care/clients/${client.id}`;
  const tab = loc.pathname.includes('/flow-sheet') ? 'sheet' : loc.pathname.endsWith('/complete') ? 'complete' : 'overview';
  return (
    <>
      <Link to="/care/clients" className="back-link"><Icon name="chevronLeft" size={16} />All clients</Link>
      <header className="client-header" data-tour="client-header">
        <div className="ch-id">
          <span className="ch-avatar" aria-hidden>{client.firstName[0]}{client.lastName[0]}</span>
          <div>
            <h1>{clientName(client)}</h1>
            <div className="ch-meta">
              <span>{ageLabel(client.dob)} · DOB {fmtDate(client.dob)}</span>
              <span>{client.location} · {client.careArea}</span>
              <span>Ht {cmToFtIn(client.heightCm)} · Wt {kgToLb(client.weightKg)}</span>
            </div>
            {ind.length > 0 && <div className="tags">{ind.map((i) => <span key={i.label} className={`tag ${i.kind}`}>{i.label}</span>)}</div>}
          </div>
        </div>
        <div className="ch-actions">
          {sheet?.status === 'completed' ? <Badge tone="green" dot>Today's flow sheet completed</Badge> : <Badge tone="blue" dot>Today's flow sheet open</Badge>}
          <LinkButton to={`${base}/${tab === 'sheet' ? 'flow-sheet/' : ''}document`} variant="primary" size="lg" icon="plus">{sheet?.status === 'completed' ? 'Add addendum' : 'Add documentation'}</LinkButton>
        </div>
      </header>
      <nav className="sub-tabs" aria-label="Client sections">
        <Link to={base} className={tab === 'overview' ? 'active' : ''}>Today</Link>
        <Link to={`${base}/flow-sheet`} className={tab === 'sheet' ? 'active' : ''}>Daily flow sheet</Link>
        {f.on('completionSignoff') && <Link to={`${base}/complete`} className={tab === 'complete' ? 'active' : ''}>Review &amp; complete</Link>}
        {f.on('history') && <Link to={`/care/records?client=${client.id}`}>Past records</Link>}
      </nav>
    </>
  );
}

function Overview({ client }: { client: Client }) {
  const { state } = useStore();
  const f = useFeatures();
  const T = today();
  const schedOn = f.on('careSchedule');
  const items = schedOn ? todaysCare(state, client.id, T, state.demoTime, { includeSchedule: true, includeMeds: f.on('medications') }) : [];
  const counts = careCounts(items);
  const entries = entriesFor(state, client.id, T);
  const io = ioTotals(entries);
  const people = contributors(state, client.id, T);
  const sheet = sheetFor(state, client.id, T);

  return (
    <div className={`ws-grid ${schedOn ? '' : 'single'}`}>
      {schedOn && (
        <Card title="Today's care" sub={`${counts.completed} of ${counts.total} completed${counts.overdue ? ` · ${counts.overdue} overdue` : ''}${counts.due ? ` · ${counts.due} due now` : ''}`} className="todays-care" id="todays-care">
          <div data-tour="todays-care"><TodaysCareList items={items} clientId={client.id} /></div>
          {client.notes && <p className="small muted care-note"><Icon name="info" size={14} /> {client.notes}</p>}
        </Card>
      )}
      <div className="stack">
        <Card title="Today's entries" sub={people.length ? <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>Contributors: {people.map((p) => <StaffChip key={p.id} staff={p} />)}</span> : undefined}
          actions={<LinkButton size="sm" variant="ghost" to={`/care/clients/${client.id}/flow-sheet`}>Open flow sheet</LinkButton>}>
          <div data-tour="timeline"><Timeline entries={entries} compact max={6} allowCorrect={sheet?.status !== 'completed'} /></div>
        </Card>
        {f.on('intakeOutput') && (
          <Card title="Intake & output today">
            <div className="io-row">
              <div><span className="io-v">{io.intakeMl}</span><span className="io-l">mL intake{Object.keys(io.intakeByRoute).length ? ` · ${Object.entries(io.intakeByRoute).map(([r, v]) => `${r} ${v}`).join(', ')}` : ''}</span></div>
              <div><span className="io-v">{io.urine}</span><span className="io-l">urine</span></div>
              <div><span className="io-v">{io.stool}</span><span className="io-l">stool</span></div>
              <div><span className="io-v">{io.emesis}</span><span className="io-l">emesis</span></div>
            </div>
            {io.fromActivities > 0 && <p className="small muted" style={{ marginBottom: 0 }}>{io.fromActivities} output record{io.fromActivities > 1 ? 's' : ''} captured during toileting / brief change - not entered twice.</p>}
          </Card>
        )}
      </div>
    </div>
  );
}

function DocPicker({ client }: { client: Client }) {
  const f = useFeatures();
  const nav = useNavigate();
  const loc = useLocation();
  const back = loc.pathname.replace(/\/document$/, '');
  const mods = DOC_MODULES.filter((m) => f.on(m.feature));
  return (
    <SheetOverlay title="Add documentation" sub={`${clientName(client)} · choose what you are documenting`} onClose={() => nav(back)}>
      <div className="doc-picker">
        {mods.map((m) => (
          <Link key={m.kind} to={`${loc.pathname}/${m.kind}`} className="doc-type">
            <span className={`dt-ico k-${m.kind}`}><Icon name={m.icon} size={22} /></span>
            <span><strong>{m.label}</strong><span className="small muted">{m.blurb}</span></span>
            <Icon name="chevronRight" size={16} />
          </Link>
        ))}
      </div>
      {mods.length < DOC_MODULES.length && <p className="small muted">Other documentation types are switched off in the current prototype scope.</p>}
    </SheetOverlay>
  );
}

function DocSheet({ client, back }: { client: Client; back?: string }) {
  const { kind } = useParams();
  const [params] = useSearchParams();
  const { state } = useStore();
  const f = useFeatures();
  const nav = useNavigate();
  const ref = params.get('ref');
  const item = ref ? todaysCare(state, client.id, today(), state.demoTime, { includeSchedule: true, includeMeds: true }).find((i) => i.ref === ref) : undefined;
  const requested = DOC_MODULES.find((m) => m.kind === kind);
  const inScope = requested && f.on(requested.feature);
  // A scheduled item whose own module is out of scope is documented through the lean Care Activity form.
  const mod = inScope ? requested : item ? DOC_MODULES.find((m) => m.kind === FALLBACK_KIND) : undefined;
  const home = `/care/clients/${client.id}${back ? '/' + back : ''}`;
  const close = () => nav(home);

  return (
    <SheetOverlay title={mod ? (item ? item.name : mod.label) : 'Documentation type unavailable'} sub={`${clientName(client)}${mod && item ? ' · ' + mod.label : ''}`} onClose={close}>
      <div data-tour="doc-sheet">
        {!mod ? (
          <Empty icon="layers" title={requested ? `${feature(requested.feature).label} is not in the current scope` : 'Unknown documentation type'} action={<Button onClick={close} variant="primary">Back</Button>} />
        ) : (
          <>
            {!inScope && requested && <Callout tone="neutral" icon="layers">{feature(requested.feature).label} is out of scope; this scheduled item is recorded as a care activity.</Callout>}
            <mod.Form client={client} item={item} onCancel={close} onSaved={close} />
          </>
        )}
      </div>
    </SheetOverlay>
  );
}

export function SheetOverlay({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-head">
          <div><h2>{title}</h2>{sub && <p className="sub">{sub}</p>}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
