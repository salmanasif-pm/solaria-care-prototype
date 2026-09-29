// Shared scaffolding for documentation forms. Each form module stays independent: it only needs the
// client, an optional scheduled item it fulfils, and the store's addEntry action.
import React, { useState } from 'react';
import type { Client, Detail, DocKind, FlowEntry } from '../../domain/types';
import type { TodayItem } from '../../domain/care';
import { useStore, type EntryInput } from '../../store/store';
import { Avatar, Button, Callout, Field, Input, useToast } from '../../ui';
import { fmtTime, today } from '../../domain/time';

export interface DocFormProps {
  client: Client;
  item?: TodayItem;
  onSaved: (entry: FlowEntry) => void;
  onCancel: () => void;
}

export function useCareTime() {
  const { state } = useStore();
  return useState(state.demoTime);
}

/** Removes empty values so entries never show blank rows. */
export const details = (rows: [string, string | undefined | null | false][]): Detail[] =>
  rows.filter((r): r is [string, string] => typeof r[1] === 'string' && r[1].trim() !== '');

export function useSave(client: Client, item: TodayItem | undefined, onSaved: (e: FlowEntry) => void) {
  const { actions } = useStore();
  const toast = useToast();
  return (kind: DocKind, careTime: string, input: Omit<EntryInput, 'kind' | 'careTime' | 'scheduleRef'>) => {
    const entry = actions.addEntry(client.id, { ...input, kind, careTime, scheduleRef: item?.ref });
    toast(`${entry.title} saved to ${client.firstName}'s flow sheet`);
    onSaved(entry);
  };
}

export function FormFrame({ careTime, setCareTime, error, onCancel, onSubmit, saveLabel = 'Save entry', children, item, clientId }: {
  clientId: string; careTime: string; setCareTime: (v: string) => void; error?: string; onCancel: () => void; onSubmit: () => void; saveLabel?: string; children: React.ReactNode; item?: TodayItem;
}) {
  const { me, state } = useStore();
  const sheet = state.sheets.find((s) => s.clientId === clientId && s.status === 'completed' && s.date === today());
  return (
    <form className="doc-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} noValidate>
      {item && (
        <Callout tone="info" icon="calendar">
          Fulfils scheduled care <strong>{fmtTime(item.time)} · {item.name}</strong>
          {item.instructions && <div className="muted small">{item.instructions}</div>}
        </Callout>
      )}
      {sheet && <Callout tone="warn">Today's flow sheet is completed. This entry will be saved as an attributed addendum.</Callout>}
      <div className="doc-form-body">{children}</div>
      <div className="attribution">
        <Field label="Care time" required className="care-time">
          <Input type="time" value={careTime} onChange={(e) => setCareTime(e.target.value)} step={60} />
        </Field>
        <div className="attrib-who">
          <Avatar name={me?.name ?? '?'} size="sm" />
          <div>
            <div className="small muted">Documented by</div>
            <strong>{me?.name}{me?.title && me.title !== 'Direct-Care Staff' ? `, ${me.title}` : ''}</strong>
            <div className="small muted">Entry time recorded automatically ({fmtTime(state.demoTime)})</div>
          </div>
        </div>
      </div>
      {error && <Callout tone="danger">{error}</Callout>}
      <div className="doc-form-foot">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="lg" type="submit" icon="check">{saveLabel}</Button>
      </div>
    </form>
  );
}

export function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <fieldset className="form-section">
      <legend>{title}</legend>
      {hint && <p className="small muted" style={{ marginTop: -4 }}>{hint}</p>}
      {children}
    </fieldset>
  );
}
