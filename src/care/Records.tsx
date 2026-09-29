// 5.2 Retrieve prior flow-sheet records (+ 5.3 current-authorization-period filter). One common viewer.
import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { useFeature } from '../features/FeatureContext';
import { clientName, correctedIds, entriesFor, ioTotals, KIND_LABEL, permittedClients } from '../domain/care';
import type { DocKind } from '../domain/types';
import { addDays, ageLabel, cmToFtIn, fmtDate, fmtStamp, fmtTime, kgToLb, today } from '../domain/time';
import { Badge, Button, Card, Empty, Field, Icon, Input, LinkButton, Select, Toggle } from '../ui';

export function RecordsPage() {
  const { state, me } = useStore();
  const authOn = useFeature('authorizationHistory');
  const [params, setParams] = useSearchParams();
  const clients = permittedClients(state, me);
  const clientId = params.get('client') ?? clients[0]?.id ?? '';
  const T = today();
  const currentAuth = state.authorizations.find((a) => a.clientId === clientId && a.start <= T && a.end >= T);
  const authMode = authOn && params.get('auth') === '1' && !!currentAuth;
  const from = authMode ? currentAuth!.start : params.get('from') ?? addDays(T, -14);
  const to = authMode ? T : params.get('to') ?? T;
  const set = (patch: Record<string, string | null>) => { const p = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v === null ? p.delete(k) : p.set(k, v))); setParams(p, { replace: true }); };

  const sheets = useMemo(() => state.sheets
    .filter((s) => s.clientId === clientId && s.date >= from && s.date <= to)
    .map((s) => ({ s, n: state.entries.filter((e) => e.sheetId === s.id).length }))
    .filter((x) => x.n > 0 || x.s.status === 'completed')
    .sort((a, b) => b.s.date.localeCompare(a.s.date)), [state, clientId, from, to]);

  return (
    <div className="page" data-tour="records">
      <div className="page-head"><div className="titles"><h1>Records</h1><p className="lede">Find prior daily flow sheets by client and date. Records open read-only and can be printed or saved as PDF.</p></div></div>
      <Card>
        <div className="filters">
          <Field label="Client">
            <Select value={clientId} onChange={(e) => set({ client: e.target.value, auth: null })}>
              {clients.map((c) => <option key={c.id} value={c.id}>{clientName(c)}</option>)}
            </Select>
          </Field>
          <Field label="From"><Input type="date" value={from} disabled={authMode} onChange={(e) => set({ from: e.target.value })} /></Field>
          <Field label="To"><Input type="date" value={to} disabled={authMode} onChange={(e) => set({ to: e.target.value })} /></Field>
          {authOn && (
            <div className="field">
              <label>Authorization period</label>
              <Toggle checked={authMode} disabled={!currentAuth} onChange={(v) => set({ auth: v ? '1' : null })} label={currentAuth ? `Current: ${fmtDate(currentAuth.start)} - ${fmtDate(currentAuth.end)}` : 'No current period on file'} />
            </div>
          )}
        </div>
        {authMode && currentAuth && <p className="small muted">Payer {currentAuth.payer} · reference {currentAuth.reference}. Same viewer, filtered to the current authorization period.</p>}
      </Card>
      <Card pad={false} title={`${sheets.length} flow sheet${sheets.length === 1 ? '' : 's'}`}>
        {sheets.length === 0 ? <Empty title="No records in this range" hint="Try a wider date range." icon="file" /> : (
          <table className="table">
            <thead><tr><th>Care date</th><th>Status</th><th>Entries</th><th>Sign-off</th><th>Parent copy</th><th /></tr></thead>
            <tbody>
              {sheets.map(({ s, n }) => (
                <tr key={s.id}>
                  <td><strong>{fmtDate(s.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>{s.date === T && <span className="small muted"> · today</span>}</td>
                  <td>{s.status === 'completed' ? <Badge tone="green" dot>Completed</Badge> : <Badge tone="blue" dot>Open</Badge>}</td>
                  <td>{n}</td>
                  <td className="small">{s.signoffs.length ? s.signoffs.map((x) => x.role).join(', ') : '—'}</td>
                  <td className="small">{s.parentCopyOffered === null ? '—' : s.parentCopyOffered ? (s.parentCopyAccepted ? 'Offered · accepted' : 'Offered · declined') : 'Not offered'}</td>
                  <td className="right"><LinkButton size="sm" to={`/care/records/${s.id}`} icon="eye">Open</LinkButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

const ORDER: DocKind[] = ['observations', 'intakeOutput', 'assessment', 'activity', 'medication', 'specializedCare', 'note'];

export function RecordView() {
  const { sheetId } = useParams();
  const { state, actions, me } = useStore();
  const sheet = state.sheets.find((s) => s.id === sheetId);
  const client = sheet && state.clients.find((c) => c.id === sheet.clientId);
  const permitted = client && permittedClients(state, me).some((c) => c.id === client.id);
  const logged = useRef(false);
  useEffect(() => { if (client && permitted && !logged.current) { logged.current = true; actions.logAccess(client.id, `Viewed flow sheet ${sheet!.date}`); } }, [client, permitted, actions, sheet]);
  if (!sheet || !client) return <div className="page"><Empty title="Record not found" action={<LinkButton to="/care/records" variant="primary">Back to records</LinkButton>} /></div>;
  if (!permitted) return <div className="page"><Empty icon="lock" title="Not in your care areas" action={<LinkButton to="/care/records" variant="primary">Back to records</LinkButton>} /></div>;

  const entries = entriesFor(state, client.id, sheet.date, 'asc');
  const corrected = correctedIds(entries);
  const io = ioTotals(entries);
  const staff = (id: string) => state.staff.find((s) => s.id === id);
  const print = () => { actions.logAccess(client.id, `Printed / exported flow sheet ${sheet.date}`); setTimeout(() => window.print(), 50); };

  return (
    <div className="page">
      <div className="row between no-print" style={{ marginBottom: 12 }}>
        <Link to={`/care/records?client=${client.id}`} className="back-link"><Icon name="chevronLeft" size={16} />Records</Link>
        <Button icon="print" onClick={print}>Print / save as PDF</Button>
      </div>
      <article className="record">
        <header className="record-head">
          <div>
            <div className="small muted">Solaria Care · Daily Flow Sheet</div>
            <h1>{clientName(client)}</h1>
            <div className="small">DOB {fmtDate(client.dob)} ({ageLabel(client.dob, sheet.date)}) · Ht {cmToFtIn(client.heightCm)} · Wt {kgToLb(client.weightKg)}</div>
            <div className="small">{client.location} · {client.careArea}</div>
          </div>
          <div className="right">
            <div className="small muted">Care date</div>
            <strong>{fmtDate(sheet.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            <div>{sheet.status === 'completed' ? <Badge tone="green">Completed · read-only</Badge> : <Badge tone="blue">Open - in progress</Badge>}</div>
          </div>
        </header>
        {ORDER.map((k) => {
          const list = entries.filter((e) => e.kind === k);
          if (!list.length) return null;
          return (
            <section key={k} className="record-sec">
              <h2>{k === 'note' ? 'Corrections' : KIND_LABEL[k]}</h2>
              <table className="table record-table">
                <thead><tr><th style={{ width: 80 }}>Time</th><th>Entry</th><th style={{ width: 170 }}>Documented by</th></tr></thead>
                <tbody>
                  {list.map((e) => {
                    const s = staff(e.staffId);
                    return (
                      <tr key={e.id} className={corrected.has(e.id) ? 'corrected' : ''}>
                        <td className="nowrap">{fmtTime(e.careTime)}</td>
                        <td><strong>{e.title}</strong>{corrected.has(e.id) && <em className="small"> (corrected)</em>}{e.addendum && <em className="small"> (addendum)</em>}<div className="small">{e.details.map(([a, b]) => `${a}: ${b}`).join(' · ')}</div></td>
                        <td className="small">{s?.name}, {s?.title}<div className="muted">{fmtStamp(e.enteredAt)}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
        {entries.length === 0 && <p className="muted">No entries on this flow sheet.</p>}
        <section className="record-sec">
          <h2>Totals & sign-off</h2>
          <p className="small">Intake {io.intakeMl} mL{Object.keys(io.intakeByRoute).length ? ` (${Object.entries(io.intakeByRoute).map(([r, v]) => `${r} ${v} mL`).join(', ')})` : ''} · Urine ×{io.urine} · Stool ×{io.stool} · Emesis ×{io.emesis}</p>
          <table className="table record-table">
            <tbody>
              {(['PCA', 'Licensed Nurse', 'RN'] as const).map((r) => {
                const so = sheet.signoffs.find((x) => x.role === r);
                const s = so && staff(so.staffId);
                return <tr key={r}><td style={{ width: 160 }}><strong>{r}</strong></td><td>{so && s ? `${s.name}, ${s.title} · ${fmtStamp(so.at)}` : '—'}</td></tr>;
              })}
              <tr><td><strong>Parent copy</strong></td><td>{sheet.parentCopyOffered === null ? '—' : sheet.parentCopyOffered ? (sheet.parentCopyAccepted ? 'Offered and accepted' : 'Offered, declined') : 'Not offered'}</td></tr>
              {sheet.reviewNote && <tr><td><strong>Review note</strong></td><td>{sheet.reviewNote}</td></tr>}
            </tbody>
          </table>
        </section>
        <footer className="record-foot small muted">Generated {fmtStamp(new Date().toISOString())} by {me?.name} · Prototype output with fictional data - production PDF is generated by the backend.</footer>
      </article>
    </div>
  );
}
