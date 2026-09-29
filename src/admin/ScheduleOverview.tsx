// Admin nav entry "Care Instructions & Schedule": choose a client, maintain its schedule.
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { clientName } from '../domain/care';
import { PageHead, Select, Field } from '../ui';
import { ScheduleEditor } from './ScheduleEditor';

export function ScheduleOverview() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const clients = state.clients.filter((c) => c.status === 'active').sort((a, b) => a.lastName.localeCompare(b.lastName));
  const id = params.get('client') ?? clients[0]?.id;
  const client = clients.find((c) => c.id === id);
  return (
    <div className="page">
      <PageHead title="Care instructions & schedule" lede="Straightforward scheduled care per client: activity, instructions, time, days, active. Physician care-plan authoring and approval are out of scope." />
      <div className="row" style={{ marginBottom: 16 }}>
        <Field label="Client">
          <Select value={id} onChange={(e) => setParams({ client: e.target.value }, { replace: true })} style={{ minWidth: 280 }}>
            {clients.map((c) => <option key={c.id} value={c.id}>{clientName(c)} · {c.careArea}</option>)}
          </Select>
        </Field>
      </div>
      {client && <ScheduleEditor client={client} />}
    </div>
  );
}
